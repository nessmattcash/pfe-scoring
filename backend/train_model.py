"""
STBG Risk — Entraînement du modèle amélioré
Lancer depuis backend/ : python train_model.py
Durée estimée : 2-4 minutes sur CPU
"""
import pandas as pd
import numpy as np
import joblib
from pathlib import Path

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing   import LabelEncoder
from sklearn.metrics         import (classification_report, roc_auc_score,
                                     confusion_matrix, f1_score)
from xgboost import XGBClassifier

# ── Chemins ───────────────────────────────────────────────────────────────────
BASE     = Path(__file__).parent
DATA     = BASE / "data" / "dataset_clients.csv"
MODELS   = BASE / "models"

if not DATA.exists():
    print("❌ dataset_clients.csv introuvable. Lance d'abord : python generate_data.py")
    exit(1)

# ── Chargement ────────────────────────────────────────────────────────────────
print("📂 Chargement du dataset...")
df = pd.read_csv(DATA, encoding='utf-8-sig')
print(f"   {len(df):,} clients · {df.risque_label.mean():.1%} risqués")

# ── Encodage catégoriel ───────────────────────────────────────────────────────
cat_cols = ['secteur', 'region', 'type_client', 'banque_domiciliation']
le_dict  = {}

for col in cat_cols:
    le = LabelEncoder()
    df[col + '_enc'] = le.fit_transform(df[col].astype(str))
    le_dict[col] = le

# ── Features ─────────────────────────────────────────────────────────────────
# AMÉLIORATIONS vs v1:
# 1. Ajout ratio_retards_ca, ratio_impayes_ca comme features continues
# 2. score_anciennete remplacé par anciennete_log (plus nuancé)
# 3. Ajout flag_mono_contrat

df['ratio_retards_ca']  = df['nb_retards_12m'] / (df['ca_annuel_tnd'] / 1_000_000).clip(lower=0.01)
df['ratio_impayes_ca']  = df['nb_impayes']      / (df['ca_annuel_tnd'] / 1_000_000).clip(lower=0.01)
df['anciennete_log']    = np.log1p(df['anciennete_annees'])
df['flag_mono_contrat'] = (df['nb_contrats_actifs'] <= 2).astype(int)
df['delai_x_retards']   = df['delai_moyen_jours'] * df['nb_retards_12m']

features = [
    # ── Profil financier ──
    'anciennete_annees', 'anciennete_log',
    'nb_contrats_actifs', 'flag_mono_contrat',
    'montant_encours_tnd', 'ca_annuel_tnd',
    'nb_traites_actives', 'montant_moyen_traite',

    # ── Comportement paiement ──
    'nb_retards_12m', 'nb_impayes',
    'delai_moyen_jours', 'concentration_pct',
    'nb_cheques_retournes', 'nb_litiges',

    # ── Features dérivées ──
    'ratio_encours_ca', 'encours_par_traite',
    'score_anciennete',
    'charge_paiement', 'stress_financier',
    'ratio_retards_ca', 'ratio_impayes_ca',
    'anciennete_log', 'delai_x_retards',

    # ── Catégorielles encodées ──
    'secteur_enc', 'region_enc',
    'type_client_enc', 'banque_domiciliation_enc',
]

# Dédupliquer features
features = list(dict.fromkeys(features))

X = df[features]
y = df['risque_label']

print(f"\n🔧 Features : {len(features)}")
print(f"   {features}")

# ── Split ─────────────────────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"\n📊 Train : {len(X_train):,} | Test : {len(X_test):,}")

# ── Modèle ────────────────────────────────────────────────────────────────────
# scale_pos_weight = ratio fiables/risqués pour gérer le déséquilibre
ratio = (y_train == 0).sum() / (y_train == 1).sum()
print(f"   scale_pos_weight = {ratio:.2f}")

model = XGBClassifier(
    n_estimators          = 800,
    max_depth             = 5,
    learning_rate         = 0.04,
    subsample             = 0.8,
    colsample_bytree      = 0.75,
    min_child_weight      = 8,     # évite les splits sur micro-groupes
    reg_alpha             = 0.2,   # L1 — pousse les features inutiles à 0
    reg_lambda            = 2.0,   # L2 — réduit l'overfitting
    gamma                 = 0.1,   # gain minimum pour splitter un nœud
    scale_pos_weight      = ratio,
    random_state          = 42,
    eval_metric           = 'auc',
    early_stopping_rounds = 30,
    n_jobs                = -1,
    verbosity             = 0,
)

print("\n🚀 Entraînement en cours...")
model.fit(
    X_train, y_train,
    eval_set=[(X_train, y_train), (X_test, y_test)],
    verbose=100,
)

# ── Évaluation ────────────────────────────────────────────────────────────────
y_pred  = model.predict(X_test)
y_proba = model.predict_proba(X_test)[:, 1]
auc     = roc_auc_score(y_test, y_proba)
f1      = f1_score(y_test, y_pred)
cm      = confusion_matrix(y_test, y_pred)

print("\n" + "="*55)
print(classification_report(y_test, y_pred, target_names=['Fiable','Risqué']))
print(f"🎯 AUC-ROC : {auc:.4f}")
print(f"📐 F1-score : {f1:.4f}")
print(f"\nMatrice de confusion :")
print(f"  Vrais Fiables   : {cm[0,0]:,}  |  Faux Risqués  : {cm[0,1]:,}")
print(f"  Faux Fiables    : {cm[1,0]:,}  |  Vrais Risqués : {cm[1,1]:,}")

# ── Importance des features ───────────────────────────────────────────────────
importances = pd.Series(model.feature_importances_, index=features).sort_values(ascending=False)
print("\n📈 Top 10 features par importance :")
for feat, imp in importances.head(10).items():
    bar = "█" * int(imp * 200)
    print(f"   {feat:<30} {imp:.4f}  {bar}")

# ── Validation croisée ────────────────────────────────────────────────────────
print("\n🔁 Validation croisée 5-fold...")
cv_model = XGBClassifier(
    n_estimators     = model.best_iteration + 1,
    max_depth        = 5,
    learning_rate    = 0.04,
    subsample        = 0.8,
    colsample_bytree = 0.75,
    min_child_weight = 8,
    reg_alpha        = 0.2,
    reg_lambda       = 2.0,
    gamma            = 0.1,
    scale_pos_weight = ratio,
    random_state     = 42,
    n_jobs           = -1,
    verbosity        = 0,
)
cv_scores = cross_val_score(cv_model, X, y, cv=StratifiedKFold(5), scoring='roc_auc', n_jobs=-1)
print(f"   AUC par fold : {[f'{s:.4f}' for s in cv_scores]}")
print(f"   AUC moyen    : {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

# ── Test de cohérence sur profils extrêmes ────────────────────────────────────
print("\n🧪 Test de cohérence profils extrêmes :")

def make_profile(**kwargs):
    base = {
        'anciennete_annees':15,'nb_contrats_actifs':8,
        'montant_encours_tnd':50000,'ca_annuel_tnd':2000000,
        'nb_traites_actives':5,'montant_moyen_traite':10000,
        'nb_retards_12m':0,'nb_impayes':0,'delai_moyen_jours':15,
        'concentration_pct':5.0,'nb_cheques_retournes':0,'nb_litiges':0,
        'secteur':'Commerce','region':'Tunis',
        'type_client':'Grossiste','banque_domiciliation':'ATTIJARI',
    }
    base.update(kwargs)
    row = pd.DataFrame([base])
    for col in cat_cols:
        row[col+'_enc'] = le_dict[col].transform(row[col].astype(str))
    row['ratio_encours_ca']   = row['montant_encours_tnd'] / row['ca_annuel_tnd']
    row['encours_par_traite'] = row['montant_encours_tnd'] / row['nb_traites_actives']
    row['score_anciennete']   = np.where(row['anciennete_annees']>10,1,
                                np.where(row['anciennete_annees']>5,0,-1))
    row['charge_paiement']    = row['nb_retards_12m'] + row['nb_impayes']*2 + row['nb_cheques_retournes']*3
    row['stress_financier']   = row['ratio_encours_ca'] * row['delai_moyen_jours'] / 30
    row['ratio_retards_ca']   = row['nb_retards_12m'] / (row['ca_annuel_tnd']/1_000_000).clip(lower=0.01)
    row['ratio_impayes_ca']   = row['nb_impayes'] / (row['ca_annuel_tnd']/1_000_000).clip(lower=0.01)
    row['anciennete_log']     = np.log1p(row['anciennete_annees'])
    row['flag_mono_contrat']  = (row['nb_contrats_actifs'] <= 2).astype(int)
    row['delai_x_retards']    = row['delai_moyen_jours'] * row['nb_retards_12m']
    return row[features]

tests = [
    ("PARFAIT",     make_profile()),
    ("BON",         make_profile(anciennete_annees=8, nb_retards_12m=1, delai_moyen_jours=28, concentration_pct=12)),
    ("MOYEN",       make_profile(anciennete_annees=4, nb_retards_12m=3, nb_impayes=1, delai_moyen_jours=60, concentration_pct=35, montant_encours_tnd=400000, ca_annuel_tnd=700000)),
    ("MAUVAIS",     make_profile(anciennete_annees=2, nb_retards_12m=8, nb_impayes=3, nb_cheques_retournes=3, nb_litiges=2, delai_moyen_jours=110, concentration_pct=70, montant_encours_tnd=800000, ca_annuel_tnd=500000, nb_contrats_actifs=1)),
    ("CATASTROPHE", make_profile(anciennete_annees=1, nb_retards_12m=15, nb_impayes=7, nb_cheques_retournes=7, nb_litiges=5, delai_moyen_jours=170, concentration_pct=92, montant_encours_tnd=2500000, ca_annuel_tnd=100000, nb_contrats_actifs=1)),
]

print(f"   {'Profil':<15} {'Proba ML':>9} {'Attendu'}")
print(f"   {'─'*13:<15} {'─'*9:>9} {'─'*15}")
for name, row in tests:
    p = model.predict_proba(row)[0][1]
    expected = {"PARFAIT":"~0.05–0.15","BON":"~0.20–0.35","MOYEN":"~0.45–0.60","MAUVAIS":"~0.65–0.80","CATASTROPHE":"~0.85–0.95"}
    ok = "✅" if name in ["PARFAIT","CATASTROPHE"] else ""
    print(f"   {name:<15} {p:>9.4f}  {expected[name]}  {ok}")

# ── Sauvegarde ────────────────────────────────────────────────────────────────
MODELS.mkdir(exist_ok=True)
joblib.dump(model,    MODELS / 'model.pkl')
joblib.dump(le_dict,  MODELS / 'label_encoders.pkl')
joblib.dump(features, MODELS / 'features.pkl')

print(f"\n✅ Modèle sauvegardé → models/")
print(f"   model.pkl ({(MODELS/'model.pkl').stat().st_size//1024} KB)")
print(f"   label_encoders.pkl")
print(f"   features.pkl ({len(features)} features)")
print(f"\n🏁 AUC final : {auc:.4f} | F1 : {f1:.4f}")
print("   Relance le serveur : uvicorn main:app --reload --reload-exclude 'models/*'")