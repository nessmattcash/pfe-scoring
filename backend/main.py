from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib, numpy as np, pandas as pd

app = FastAPI(title="Scoring Client STBG", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Charger les modèles
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

def compute_score_metier(d):
    score = 50
    score += min(d['anciennete_annees'] * 1.0, 20)
    ratio  = d['montant_encours_tnd'] / d['ca_annuel_tnd']
    score -= min(ratio * 40, 30)
    score -= d['nb_retards_12m']       * 2.5
    score -= d['nb_impayes']           * 5
    score -= d['nb_cheques_retournes'] * 4
    score -= d['nb_litiges']           * 6
    score -= max(0, (d['delai_moyen_jours']  - 30) * 0.3)
    score -= max(0, (d['concentration_pct']  - 20) * 0.25)
    return float(np.clip(score, 0, 100))

@app.post("/predict")
def predict(client: Client):
    d = client.dict()

    # Encoder catégorielles
    for col in ['secteur', 'region', 'type_client', 'banque_domiciliation']:
        d[col + '_enc'] = int(le_dict[col].transform([d[col]])[0])

    # Features dérivées
    d['ratio_encours_ca']   = d['montant_encours_tnd'] / d['ca_annuel_tnd']
    d['encours_par_traite'] = d['montant_encours_tnd'] / d['nb_traites_actives']
    d['score_anciennete']   = 1 if d['anciennete_annees'] > 10 else 0 if d['anciennete_annees'] > 5 else -1
    d['charge_paiement']    = d['nb_retards_12m'] + d['nb_impayes'] * 2 + d['nb_cheques_retournes'] * 3
    d['stress_financier']   = d['ratio_encours_ca'] * d['delai_moyen_jours'] / 30

    # Prédiction ML
    X        = pd.DataFrame([d])[features]
    proba_ml = float(model.predict_proba(X)[0][1])

    # Score hybride 60/40
    score_metier = compute_score_metier(d)
    score_final  = int(np.clip(
        (proba_ml * 100) * 0.60 + (1 - score_metier / 100) * 100 * 0.40,
        1, 99
    ))

    # Niveau
    if score_final > 60:   niveau, decision = "ÉLEVÉ",  "Refuser le crédit"
    elif score_final > 30: niveau, decision = "MODÉRÉ", "Accorder avec garanties"
    else:                  niveau, decision = "FAIBLE",  "Accorder le crédit"

    # SHAP simplifié — top facteurs
    shap_factors = [
        {"label": "ratio_encours_ca",    "value": round(d['ratio_encours_ca'], 3)},
        {"label": "nb_impayes",          "value": d['nb_impayes']},
        {"label": "nb_retards_12m",      "value": d['nb_retards_12m']},
        {"label": "delai_moyen_jours",   "value": d['delai_moyen_jours']},
        {"label": "nb_cheques_retournes","value": d['nb_cheques_retournes']},
        {"label": "anciennete_annees",   "value": d['anciennete_annees']},
    ]

    return {
        "score":    score_final,
        "niveau":   niveau,
        "decision": decision,
        "proba_ml": round(proba_ml, 4),
        "shap":     shap_factors,
    }

@app.get("/health")
def health():
    return {"status": "ok", "model": "XGBoost + Règles métier"}

@app.get("/")
def root():
    return {"message": "API Scoring STBG — POST /predict pour scorer un client"}