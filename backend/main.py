from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib, numpy as np, pandas as pd
import csv, io
from auth import router as auth_router, init_db


app = FastAPI(title="Scoring Client STBG", version="2.0")
app.include_router(auth_router)
init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model    = joblib.load("models/model.pkl")
le_dict  = joblib.load("models/label_encoders.pkl")
features = joblib.load("models/features.pkl")

class Client(BaseModel):
    anciennete_annees:    int
    nb_contrats_actifs:   int
    montant_encours_tnd:  int
    ca_annuel_tnd:        int
    nb_traites_actives:   int
    montant_moyen_traite: int
    nb_retards_12m:       int
    nb_impayes:           int
    delai_moyen_jours:    int
    concentration_pct:    float
    nb_cheques_retournes: int
    nb_litiges:           int
    secteur:              str
    region:               str
    type_client:          str
    banque_domiciliation: str

# ── Fallbacks si "Autre" ou valeur inconnue ───────────────────────────────────
FALLBACKS = {
    'secteur':             'Commerce',
    'region':              'Tunis',
    'type_client':         'Grossiste',
    'banque_domiciliation':'ATTIJARI'
}

# ── Score métier — plus haut = plus risqué (0-100) ────────────────────────────
def compute_score_metier(d):
    """Score métier amélioré v2 — plus de sensibilité sur tous les attributs"""
    score = 0.0
    ca = max(d['ca_annuel_tnd'], 1)

    # Ratio encours/CA — facteur #1 (plafond relevé)
    ratio = d['montant_encours_tnd'] / ca
    score += min(ratio * 28, 50)

    # Historique paiement — coefficients renforcés
    score += d['nb_retards_12m']       * 4.5
    score += d['nb_impayes']           * 9.0
    score += d['nb_cheques_retournes'] * 6.5
    score += d['nb_litiges']           * 9.0

    # Délai — seuil abaissé à 20j (au lieu de 30j)
    score += max(0, (d['delai_moyen_jours'] - 20) * 0.55)

    # Concentration — seuil abaissé à 10% (au lieu de 20%)
    score += max(0, (d['concentration_pct'] - 10) * 0.45)

    # Ancienneté — courbe continue renforcée
    score -= min(d['anciennete_annees'] * 1.5, 22)

    # Mono-contrat = risque structurel
    if d['nb_contrats_actifs'] <= 2:
        score += 8
    elif d['nb_contrats_actifs'] >= 8:
        score -= 5

    # Grosses traites = exposition élevée
    if d.get('montant_moyen_traite', 0) > 80000:
        score += 6
    elif d.get('montant_moyen_traite', 0) > 50000:
        score += 3

    return float(np.clip(score, 0, 100))


@app.post("/predict")
def predict(client: Client):
    d = client.dict()

    # ── Encoder catégorielles avec fallback sur valeur inconnue
    for col in ['secteur', 'region', 'type_client', 'banque_domiciliation']:
        val   = d[col]
        known = list(le_dict[col].classes_)
        if val not in known:
            val = FALLBACKS[col]
        d[col + '_enc'] = int(le_dict[col].transform([val])[0])

    # ── Features dérivées
    import math
    ca = max(d['ca_annuel_tnd'], 1)
    ca_m = ca / 1_000_000
    d['ratio_encours_ca']   = d['montant_encours_tnd'] / ca
    d['encours_par_traite'] = d['montant_encours_tnd'] / max(d['nb_traites_actives'], 1)
    d['score_anciennete']   = 1 if d['anciennete_annees'] > 10 else (0 if d['anciennete_annees'] > 5 else -1)
    d['charge_paiement']    = d['nb_retards_12m'] + d['nb_impayes'] * 2 + d['nb_cheques_retournes'] * 3
    d['stress_financier']   = d['ratio_encours_ca'] * d['delai_moyen_jours'] / 30
    # Nouvelles features v2
    d['ratio_retards_ca']   = d['nb_retards_12m']  / max(ca_m, 0.01)
    d['ratio_impayes_ca']   = d['nb_impayes']       / max(ca_m, 0.01)
    d['anciennete_log']     = math.log1p(d['anciennete_annees'])
    d['flag_mono_contrat']  = 1 if d['nb_contrats_actifs'] <= 2 else 0
    d['delai_x_retards']    = d['delai_moyen_jours'] * d['nb_retards_12m']

    # ── Prédiction ML
    X        = pd.DataFrame([d])[features]
    proba_ml = float(model.predict_proba(X)[0][1])

    # ── Score hybride 60% ML + 40% règles métier
    score_metier = compute_score_metier(d)
    score_final  = int(np.clip(
        proba_ml * 100 * 0.60 + score_metier * 0.40,
        1, 99
    ))

    # ── Niveau de risque
    if   score_final > 60: niveau, decision = "ÉLEVÉ",  "Refuser le crédit"
    elif score_final > 30: niveau, decision = "MODÉRÉ", "Accorder avec garanties"
    else:                  niveau, decision = "FAIBLE",  "Accorder le crédit"

    # ── SHAP simplifié
    shap_factors = [
        {"label": "ratio_encours_ca",    "value": round(d['ratio_encours_ca'], 3)},
        {"label": "nb_impayes",          "value": d['nb_impayes']},
        {"label": "nb_retards_12m",      "value": d['nb_retards_12m']},
        {"label": "delai_moyen_jours",   "value": d['delai_moyen_jours']},
        {"label": "nb_cheques_retournes","value": d['nb_cheques_retournes']},
        {"label": "anciennete_annees",   "value": d['anciennete_annees']},
    ]

    return {
        "score":        score_final,
        "niveau":       niveau,
        "decision":     decision,
        "proba_ml":     round(proba_ml, 4),
        "score_metier": round(score_metier, 1),
        "shap":         shap_factors,
    }

@app.post("/batch_predict")
async def batch_predict(file: UploadFile = File(...)):
    """
    Scoring en masse – accepte CSV (; ou ,) ou Excel.
    Nettoie les valeurs manquantes pour éviter les NaN dans JSON.
    """
    contents = await file.read()
    filename = file.filename.lower()
    
    # Lecture du fichier
    if filename.endswith('.xlsx'):
        df = pd.read_excel(io.BytesIO(contents), engine='openpyxl')
    else:
        # CSV avec gestion BOM et détection du séparateur
        try:
            text = contents.decode('utf-8-sig')
        except:
            text = contents.decode('latin-1')
        first_line = text.split('\n')[0]
        sep = ';' if ';' in first_line else ','
        df = pd.read_csv(io.StringIO(text), sep=sep)
    
    # Colonnes obligatoires
    required_cols = [
        "anciennete_annees", "nb_contrats_actifs", "montant_encours_tnd",
        "ca_annuel_tnd", "nb_traites_actives", "montant_moyen_traite",
        "nb_retards_12m", "nb_impayes", "delai_moyen_jours",
        "concentration_pct", "nb_cheques_retournes", "nb_litiges",
        "secteur", "region", "type_client", "banque_domiciliation"
    ]
    missing = [col for col in required_cols if col not in df.columns]
    if missing:
        raise HTTPException(400, f"Colonnes manquantes : {missing}")
    
    # Convertir les colonnes numériques en nombre, coercer les erreurs en NaN puis remplir par 0
    numeric_cols = [
        "anciennete_annees", "nb_contrats_actifs", "montant_encours_tnd",
        "ca_annuel_tnd", "nb_traites_actives", "montant_moyen_traite",
        "nb_retards_12m", "nb_impayes", "delai_moyen_jours",
        "concentration_pct", "nb_cheques_retournes", "nb_litiges"
    ]
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0).astype(float)
    
    # Remplir les colonnes textuelles vides par une chaîne vide (pour éviter NaN)
    text_cols = ["secteur", "region", "type_client", "banque_domiciliation", "prenom", "nom"]
    for col in text_cols:
        if col in df.columns:
            df[col] = df[col].fillna("").astype(str)
        else:
            df[col] = ""  # ajouter la colonne si absente
    
    results = []
    for idx, row in df.iterrows():
        d = row.to_dict()
        
        # Encodage catégoriel
        for col in ['secteur', 'region', 'type_client', 'banque_domiciliation']:
            val = d[col]
            known = list(le_dict[col].classes_)
            if val not in known:
                val = FALLBACKS.get(col, known[0] if known else 'Tunis')
            d[col + '_enc'] = int(le_dict[col].transform([val])[0])
            d[col] = val  # garder la valeur corrigée
        
        # Features dérivées
        import math
        ca = max(d['ca_annuel_tnd'], 1)
        ca_m = ca / 1_000_000
        d['ratio_encours_ca'] = d['montant_encours_tnd'] / ca
        d['encours_par_traite'] = d['montant_encours_tnd'] / max(d['nb_traites_actives'], 1)
        d['score_anciennete'] = 1 if d['anciennete_annees'] > 10 else (0 if d['anciennete_annees'] > 5 else -1)
        d['charge_paiement'] = d['nb_retards_12m'] + d['nb_impayes'] * 2 + d['nb_cheques_retournes'] * 3
        d['stress_financier'] = d['ratio_encours_ca'] * d['delai_moyen_jours'] / 30
        # Nouvelles features v2
        d['ratio_retards_ca']  = d['nb_retards_12m']  / max(ca_m, 0.01)
        d['ratio_impayes_ca']  = d['nb_impayes']       / max(ca_m, 0.01)
        d['anciennete_log']    = math.log1p(d['anciennete_annees'])
        d['flag_mono_contrat'] = 1 if d['nb_contrats_actifs'] <= 2 else 0
        d['delai_x_retards']   = d['delai_moyen_jours'] * d['nb_retards_12m']
        
        # Prédiction ML
        X = pd.DataFrame([d])[features]
        proba_ml = float(model.predict_proba(X)[0][1])
        
        # Score métier
        score_metier = compute_score_metier(d)
        
        # Score hybride
        score_final = int(np.clip(proba_ml * 100 * 0.60 + score_metier * 0.40, 1, 99))
        
        # Niveau et décision
        if score_final > 60:
            niveau, decision = "ÉLEVÉ", "Refuser le crédit"
        elif score_final > 30:
            niveau, decision = "MODÉRÉ", "Accorder avec garanties"
        else:
            niveau, decision = "FAIBLE", "Accorder le crédit"
        
        # Construction du résultat avec valeurs propres (pas de NaN)
        # IMPORTANT : on renvoie TOUTES les colonnes d'origine (pas un sous-ensemble),
        # sinon l'export CSV du frontend — qui construit son en-tête à partir des
        # colonnes du fichier importé — se décale et mélange les valeurs.
        result = {
            "prenom":               str(d.get("prenom", "")),
            "nom":                  str(d.get("nom", "")),
            "secteur":              str(d["secteur"]),
            "type_client":          str(d["type_client"]),
            "region":               str(d["region"]),
            "banque_domiciliation": str(d["banque_domiciliation"]),
            "montant_encours_tnd":  float(d["montant_encours_tnd"]),
            "ca_annuel_tnd":        float(d["ca_annuel_tnd"]),
            "anciennete_annees":    float(d["anciennete_annees"]),
            "nb_traites_actives":   float(d["nb_traites_actives"]),
            "montant_moyen_traite": float(d["montant_moyen_traite"]),
            "nb_contrats_actifs":   float(d["nb_contrats_actifs"]),
            "nb_retards_12m":       float(d["nb_retards_12m"]),
            "nb_impayes":           float(d["nb_impayes"]),
            "delai_moyen_jours":    float(d["delai_moyen_jours"]),
            "nb_cheques_retournes": float(d["nb_cheques_retournes"]),
            "nb_litiges":           float(d["nb_litiges"]),
            "concentration_pct":    float(d["concentration_pct"]),
            "score":                int(score_final),
            "niveau":               str(niveau),
            "decision":             str(decision),
            "proba_ml":             float(round(proba_ml, 4)),
            "score_metier":         float(round(score_metier, 1)),
        }
        results.append(result)
    
    # Sauvegarde pour le dashboard (remplace les NaN par None)
    out_df = pd.DataFrame(results)
    out_df = out_df.replace({np.nan: None, np.inf: None, -np.inf: None})
    out_df.to_csv("resultats_scoring.csv", index=False, encoding="utf-8-sig", sep=';')
    
    return {
        "predictions": results,
        "total": len(results)
    }


@app.get("/health")
def health():
    return {"status": "ok", "model": "XGBoost + Règles métier v2"}

@app.get("/results")
def get_results():
    df = pd.read_csv("resultats_scoring.csv", sep=';', encoding='utf-8-sig')
    df = df.replace({np.nan: None, np.inf: None, -np.inf: None})
    return {"predictions": df.to_dict(orient="records"), "total": len(df)}

@app.get("/")
def root():
    return {"message": "API Scoring STBG v2 — POST /predict"}