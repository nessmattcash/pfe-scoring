from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib, numpy as np, pandas as pd
import csv, io


app = FastAPI(title="Scoring Client STBG", version="2.0")

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
    score = 0.0
    ca = max(d['ca_annuel_tnd'], 1)

    # Ratio encours/CA — facteur #1
    ratio = d['montant_encours_tnd'] / ca
    score += min(ratio * 35, 35)

    # Historique paiement
    score += d['nb_retards_12m']       * 3.0
    score += d['nb_impayes']           * 7.0
    score += d['nb_cheques_retournes'] * 5.0
    score += d['nb_litiges']           * 8.0

    # Délai — pénalité au-delà de 30 jours
    score += max(0, (d['delai_moyen_jours'] - 30) * 0.45)

    # Concentration — pénalité au-delà de 20%
    score += max(0, (d['concentration_pct'] - 20) * 0.3)

    # Ancienneté — facteur positif (réduit le risque)
    score -= min(d['anciennete_annees'] * 1.2, 18)

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
    ca = max(d['ca_annuel_tnd'], 1)
    d['ratio_encours_ca']   = d['montant_encours_tnd'] / ca
    d['encours_par_traite'] = d['montant_encours_tnd'] / max(d['nb_traites_actives'], 1)
    d['score_anciennete']   = 1 if d['anciennete_annees'] > 10 else (0 if d['anciennete_annees'] > 5 else -1)
    d['charge_paiement']    = d['nb_retards_12m'] + d['nb_impayes'] * 2 + d['nb_cheques_retournes'] * 3
    d['stress_financier']   = d['ratio_encours_ca'] * d['delai_moyen_jours'] / 30

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
        ca = max(d['ca_annuel_tnd'], 1)
        d['ratio_encours_ca'] = d['montant_encours_tnd'] / ca
        d['encours_par_traite'] = d['montant_encours_tnd'] / max(d['nb_traites_actives'], 1)
        d['score_anciennete'] = 1 if d['anciennete_annees'] > 10 else (0 if d['anciennete_annees'] > 5 else -1)
        d['charge_paiement'] = d['nb_retards_12m'] + d['nb_impayes'] * 2 + d['nb_cheques_retournes'] * 3
        d['stress_financier'] = d['ratio_encours_ca'] * d['delai_moyen_jours'] / 30
        
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
        result = {
            "prenom": str(d.get("prenom", "")),
            "nom": str(d.get("nom", "")),
            "secteur": str(d["secteur"]),
            "region": str(d["region"]),
            "montant_encours_tnd": float(d["montant_encours_tnd"]),
            "delai_moyen_jours": float(d["delai_moyen_jours"]),
            "score": int(score_final),
            "niveau": str(niveau),
            "decision": str(decision),
            "proba_ml": float(round(proba_ml, 4)),
            "score_metier": float(round(score_metier, 1)),
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