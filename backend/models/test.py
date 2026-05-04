#1 installation of pytest: pip install pytest
#!pip install xgboost shap scikit-learn pandas numpy joblib -q

#2 imports + genration the dataset
import pandas as pd
import numpy as np

np.random.seed(42)
n = 50000

banques      = ["ATTIJARI","BNA","BIAT","STB","ATB","QNB SELIENA","UIB","AMEN BANK","WIFAK BANK","ZITOUNA BQ","AL BARAKA","UBCI","BTRUE DE TURQUIE"]
secteurs     = ["Commerce","Industrie","BTP","Agro-alimentaire","Distribution"]
regions      = ["Tunis","Sfax","Sousse","Bizerte","Nabeul","Ariana","Ben Arous","Monastir"]
types_client = ["Grossiste","Détaillant","Grande surface","Restauration","Export"]

profils = np.random.choice(
    ['excellent','bon','moyen','mauvais','catastrophique'],
    n, p=[0.20, 0.30, 0.25, 0.15, 0.10]
)

def val(profil, e, b, m, ma, c):
    return np.array([{'excellent':e,'bon':b,'moyen':m,'mauvais':ma,'catastrophique':c}[p] for p in profil])

anciennete  = (val(profils,20,13,6,2,1)  + np.random.randint(-3,4,n)).clip(0,25)
ca          = (val(profils,4_000_000,1_800_000,600_000,200_000,60_000) * np.random.uniform(0.70,1.30,n)).astype(int).clip(50_000,10_000_000)
ratio_cible = val(profils, 0.03, 0.12, 0.38, 0.72, 1.40)
encours     = (ca * ratio_cible * np.random.uniform(0.9,1.1,n)).astype(int).clip(5_000,2_000_000)
nb_retards  = (val(profils,0,0,2,5,9)   + np.random.poisson(0.2,n)).clip(0,20).astype(int)
nb_impayes  = (val(profils,0,0,0,2,5)   + np.random.poisson(0.1,n)).clip(0,10).astype(int)
delai       = (val(profils,10,25,60,100,140) + np.random.randint(-5,6,n)).clip(0,150)
cheques_ret = (val(profils,0,0,0,2,4)   + np.random.poisson(0.1,n)).clip(0,10).astype(int)
litiges     = (val(profils,0,0,0,1,3)   + np.random.poisson(0.05,n)).clip(0,5).astype(int)
concentration=(val(profils,3,12,35,65,90)+ np.random.uniform(-2,2,n)).clip(0,100)

df = pd.DataFrame({
    'client_id':            range(1,n+1),
    'profil_reel':          profils,
    'secteur':              np.random.choice(secteurs,n),
    'region':               np.random.choice(regions,n),
    'type_client':          np.random.choice(types_client,n),
    'banque_domiciliation': np.random.choice(banques,n),
    'anciennete_annees':    anciennete,
    'nb_contrats_actifs':   np.random.randint(1,15,n),
    'montant_encours_tnd':  encours,
    'ca_annuel_tnd':        ca,
    'nb_traites_actives':   np.random.randint(1,30,n),
    'montant_moyen_traite': np.random.randint(3_000,500_000,n),
    'nb_retards_12m':       nb_retards,
    'nb_impayes':           nb_impayes,
    'delai_moyen_jours':    delai,
    'concentration_pct':    concentration,
    'nb_cheques_retournes': cheques_ret,
    'nb_litiges':           litiges,
})

df['ratio_encours_ca']   = df['montant_encours_tnd'] / df['ca_annuel_tnd']
df['encours_par_traite'] = df['montant_encours_tnd'] / df['nb_traites_actives']
df['score_anciennete']   = np.where(df['anciennete_annees']>10,1,np.where(df['anciennete_annees']>5,0,-1))
df['charge_paiement']    = df['nb_retards_12m'] + df['nb_impayes']*2 + df['nb_cheques_retournes']*3
df['stress_financier']   = df['ratio_encours_ca'] * df['delai_moyen_jours'] / 30

# Label SANS bruit — séparation nette entre profils
risque_base = val(profils, 0.08, 0.25, 0.50, 0.75, 0.92)
bruit       = np.random.normal(0, 0.12, n)
risque_final = np.clip(risque_base + bruit, 0, 1)
df['risque_label'] = (risque_final > 0.45).astype(int)

print("✅ Dataset final")
print(f"   Risqués : {df.risque_label.sum():,} ({df.risque_label.mean():.1%})")
print(df.groupby('profil_reel')['risque_label'].agg(['sum','count','mean']).round(2))
df.to_csv('dataset_clients.csv', index=False)
print("💾 Sauvegardé")

#3 visualization 
import matplotlib.pyplot as plt

fig, axes = plt.subplots(1, 3, figsize=(15, 4))

# Distribution du label
df['risque_label'].value_counts().plot(
    kind='bar', ax=axes[0], color=['#22c55e','#ef4444']
)
axes[0].set_title('Répartition Fiable / Risqué')
axes[0].set_xticklabels(['Fiable', 'Risqué'], rotation=0)

# Distribution encours
df['montant_encours_tnd'].hist(bins=50, ax=axes[1], color='#4f8ef7')
axes[1].set_title('Distribution Encours (TND)')

# Délai moyen
df['delai_moyen_jours'].hist(bins=50, ax=axes[2], color='#f59e0b')
axes[2].set_title('Distribution Délai paiement (j)')

plt.tight_layout()
plt.savefig('eda_overview.png', dpi=150)
plt.show()
print("✅ Graphiques EDA générés")

# spliting the dataset + training 

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix
from xgboost import XGBClassifier
import joblib

# Encoder les colonnes catégorielles
cat_cols = ['secteur', 'region', 'type_client', 'banque_domiciliation']
le_dict  = {}

for col in cat_cols:
    le = LabelEncoder()
    df[col + '_enc'] = le.fit_transform(df[col])
    le_dict[col] = le

# Features finales
features = [
    'anciennete_annees', 'nb_contrats_actifs',
    'montant_encours_tnd', 'ca_annuel_tnd',
    'nb_traites_actives', 'montant_moyen_traite',
    'nb_retards_12m', 'nb_impayes',
    'delai_moyen_jours', 'concentration_pct',
    'nb_cheques_retournes', 'nb_litiges',
    'ratio_encours_ca', 'encours_par_traite', 'score_anciennete', 'charge_paiement', 'stress_financier', 
    'secteur_enc', 'region_enc', 'type_client_enc', 'banque_domiciliation_enc'
]

X = df[features]
y = df['risque_label']

# Split 80/20 stratifié
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"Train : {len(X_train):,} | Test : {len(X_test):,}")

# Ratio pour gérer le déséquilibre
ratio = (y_train == 0).sum() / (y_train == 1).sum()
print(f"scale_pos_weight = {ratio:.2f}")

# Entraînement
model = XGBClassifier(
    n_estimators      = 500,
    max_depth         = 4,
    learning_rate     = 0.05,
    subsample         = 0.8,
    colsample_bytree  = 0.8,
    scale_pos_weight  = ratio,
    random_state      = 42,
    eval_metric       = 'auc',
    early_stopping_rounds = 20,
    reg_alpha=0.1,        # ← ADD: L1 regularization
    reg_lambda=1.5,       # ← ADD: L2 regularization
    min_child_weight=5,   # ← ADD: prevents micro-splits
)

model.fit(
    X_train, y_train,
    eval_set=[(X_test, y_test)],
    verbose=50
)

# Évaluation
y_pred  = model.predict(X_test)
y_proba = model.predict_proba(X_test)[:, 1]
auc     = roc_auc_score(y_test, y_proba)

print("\n" + "="*50)
print(classification_report(y_test, y_pred, target_names=['Fiable','Risqué']))
print(f"🎯 AUC-ROC : {auc:.4f}")

# Sauvegarde du modèle et des encoders
import shap
from scipy.stats import rankdata


explainer   = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X_test[:1000])

# Importance globale
shap.summary_plot(shap_values, X_test[:1000], plot_type='bar',
                  feature_names=features, show=False)
plt.savefig('shap_importance.png', dpi=150, bbox_inches='tight')
plt.show()

# Sauvegarder tout
joblib.dump(model,    'model.pkl')
joblib.dump(le_dict,  'label_encoders.pkl')
joblib.dump(features, 'features.pkl')

# Générer resultats_scoring.csv pour Power BI
raw_probas = model.predict_proba(X[features])[:, 1]
df['score_risque'] = (rankdata(raw_probas) / len(raw_probas) * 99 + 1).astype(int)
df['niveau_risque'] = df['score_risque'].apply(
    lambda s: 'Élevé' if s > 60 else 'Modéré' if s > 30 else 'Faible'
)
df['decision'] = df['score_risque'].apply(
    lambda s: 'Refuser' if s > 60 else 'Garanties' if s > 30 else 'Accorder'
)
df.to_csv('resultats_scoring.csv', index=False)

print("✅ model.pkl sauvegardé")
print("✅ resultats_scoring.csv sauvegardé")
print(f"   AUC final : {auc:.4f}")

# testing 
nouveaux_clients = pd.DataFrame([
    {
        'nom': 'BOULBABA TRABELSI',
        'anciennete_annees': 22, 'nb_contrats_actifs': 12,
        'montant_encours_tnd': 30000, 'ca_annuel_tnd': 4500000,
        'nb_traites_actives': 8, 'montant_moyen_traite': 8000,
        'nb_retards_12m': 0, 'nb_impayes': 0,
        'delai_moyen_jours': 12, 'concentration_pct': 4,
        'nb_cheques_retournes': 0, 'nb_litiges': 0,
        'secteur': 'Agro-alimentaire', 'region': 'Sfax',
        'type_client': 'Grossiste', 'banque_domiciliation': 'BIAT',
    },
    {
        'nom': 'STE TRANSPORT HENI',
        'anciennete_annees': 0, 'nb_contrats_actifs': 1,
        'montant_encours_tnd': 850000, 'ca_annuel_tnd': 400000,
        'nb_traites_actives': 20, 'montant_moyen_traite': 42000,
        'nb_retards_12m': 8, 'nb_impayes': 4,
        'delai_moyen_jours': 135, 'concentration_pct': 92,
        'nb_cheques_retournes': 5, 'nb_litiges': 3,
        'secteur': 'BTP', 'region': 'Bizerte',
        'type_client': 'Détaillant', 'banque_domiciliation': 'WIFAK BANK',
    },
    {
        'nom': 'MARIEM GHARBI IMPORT',
        'anciennete_annees': 8, 'nb_contrats_actifs': 5,
        'montant_encours_tnd': 95000, 'ca_annuel_tnd': 1200000,
        'nb_traites_actives': 6, 'montant_moyen_traite': 15000,
        'nb_retards_12m': 1, 'nb_impayes': 0,
        'delai_moyen_jours': 28, 'concentration_pct': 18,
        'nb_cheques_retournes': 0, 'nb_litiges': 0,
        'secteur': 'Commerce', 'region': 'Tunis',
        'type_client': 'Export', 'banque_domiciliation': 'ATTIJARI',
    },
    {
        'nom': 'HAMDI JEBALI & FILS',
        'anciennete_annees': 3, 'nb_contrats_actifs': 2,
        'montant_encours_tnd': 310000, 'ca_annuel_tnd': 520000,
        'nb_traites_actives': 11, 'montant_moyen_traite': 28000,
        'nb_retards_12m': 3, 'nb_impayes': 2,
        'delai_moyen_jours': 88, 'concentration_pct': 55,
        'nb_cheques_retournes': 2, 'nb_litiges': 1,
        'secteur': 'BTP', 'region': 'Nabeul',
        'type_client': 'Détaillant', 'banque_domiciliation': 'STB',
    },
    {
        'nom': 'CARREFOUR MÉGRINE',
        'anciennete_annees': 14, 'nb_contrats_actifs': 10,
        'montant_encours_tnd': 210000, 'ca_annuel_tnd': 9500000,
        'nb_traites_actives': 15, 'montant_moyen_traite': 14000,
        'nb_retards_12m': 0, 'nb_impayes': 0,
        'delai_moyen_jours': 18, 'concentration_pct': 7,
        'nb_cheques_retournes': 0, 'nb_litiges': 0,
        'secteur': 'Commerce', 'region': 'Ben Arous',
        'type_client': 'Grande surface', 'banque_domiciliation': 'BNA',
    },
    {
        'nom': 'RIDHA AYARI CONSTRUCT',
        'anciennete_annees': 1, 'nb_contrats_actifs': 1,
        'montant_encours_tnd': 1200000, 'ca_annuel_tnd': 700000,
        'nb_traites_actives': 25, 'montant_moyen_traite': 48000,
        'nb_retards_12m': 9, 'nb_impayes': 5,
        'delai_moyen_jours': 145, 'concentration_pct': 88,
        'nb_cheques_retournes': 6, 'nb_litiges': 4,
        'secteur': 'BTP', 'region': 'Ariana',
        'type_client': 'Détaillant', 'banque_domiciliation': 'AL BARAKA',
    },
    {
        'nom': 'OLFA BEN SALAH BIO',
        'anciennete_annees': 11, 'nb_contrats_actifs': 7,
        'montant_encours_tnd': 45000, 'ca_annuel_tnd': 800000,
        'nb_traites_actives': 4, 'montant_moyen_traite': 11000,
        'nb_retards_12m': 0, 'nb_impayes': 0,
        'delai_moyen_jours': 22, 'concentration_pct': 9,
        'nb_cheques_retournes': 0, 'nb_litiges': 0,
        'secteur': 'Agro-alimentaire', 'region': 'Sousse',
        'type_client': 'Export', 'banque_domiciliation': 'UIB',
    },
    {
        'nom': 'SLIM MAATOUG DISTRIB',
        'anciennete_annees': 5, 'nb_contrats_actifs': 3,
        'montant_encours_tnd': 180000, 'ca_annuel_tnd': 420000,
        'nb_traites_actives': 9, 'montant_moyen_traite': 20000,
        'nb_retards_12m': 4, 'nb_impayes': 1,
        'delai_moyen_jours': 78, 'concentration_pct': 48,
        'nb_cheques_retournes': 1, 'nb_litiges': 0,
        'secteur': 'Distribution', 'region': 'Monastir',
        'type_client': 'Détaillant', 'banque_domiciliation': 'AMEN BANK',
    },
    {
        'nom': 'GROUPE ALIMENTAIRE NORD',
        'anciennete_annees': 18, 'nb_contrats_actifs': 14,
        'montant_encours_tnd': 520000, 'ca_annuel_tnd': 8000000,
        'nb_traites_actives': 18, 'montant_moyen_traite': 30000,
        'nb_retards_12m': 0, 'nb_impayes': 0,
        'delai_moyen_jours': 15, 'concentration_pct': 6,
        'nb_cheques_retournes': 0, 'nb_litiges': 0,
        'secteur': 'Agro-alimentaire', 'region': 'Ariana',
        'type_client': 'Grossiste', 'banque_domiciliation': 'ATTIJARI',
    },
    {
        'nom': 'KARIM SAIDI CERAMIQUE',
        'anciennete_annees': 2, 'nb_contrats_actifs': 2,
        'montant_encours_tnd': 620000, 'ca_annuel_tnd': 380000,
        'nb_traites_actives': 16, 'montant_moyen_traite': 38000,
        'nb_retards_12m': 7, 'nb_impayes': 4,
        'delai_moyen_jours': 122, 'concentration_pct': 76,
        'nb_cheques_retournes': 4, 'nb_litiges': 2,
        'secteur': 'Industrie', 'region': 'Sfax',
        'type_client': 'Détaillant', 'banque_domiciliation': 'QNB SELIENA',
    },
    {
        'nom': 'NAJLA FERCHICHI MODE',
        'anciennete_annees': 6, 'nb_contrats_actifs': 4,
        'montant_encours_tnd': 70000, 'ca_annuel_tnd': 650000,
        'nb_traites_actives': 5, 'montant_moyen_traite': 14000,
        'nb_retards_12m': 1, 'nb_impayes': 0,
        'delai_moyen_jours': 35, 'concentration_pct': 22,
        'nb_cheques_retournes': 0, 'nb_litiges': 0,
        'secteur': 'Commerce', 'region': 'Tunis',
        'type_client': 'Détaillant', 'banque_domiciliation': 'BIAT',
    },
    {
        'nom': 'STE MATÉRIAUX GAFSA',
        'anciennete_annees': 0, 'nb_contrats_actifs': 1,
        'montant_encours_tnd': 990000, 'ca_annuel_tnd': 300000,
        'nb_traites_actives': 28, 'montant_moyen_traite': 35000,
        'nb_retards_12m': 11, 'nb_impayes': 6,
        'delai_moyen_jours': 148, 'concentration_pct': 95,
        'nb_cheques_retournes': 7, 'nb_litiges': 5,
        'secteur': 'BTP', 'region': 'Bizerte',
        'type_client': 'Détaillant', 'banque_domiciliation': 'AL BARAKA',
    },
    {
        'nom': 'HATEM REZGUI AGRO',
        'anciennete_annees': 16, 'nb_contrats_actifs': 9,
        'montant_encours_tnd': 140000, 'ca_annuel_tnd': 2200000,
        'nb_traites_actives': 10, 'montant_moyen_traite': 14000,
        'nb_retards_12m': 0, 'nb_impayes': 0,
        'delai_moyen_jours': 20, 'concentration_pct': 11,
        'nb_cheques_retournes': 0, 'nb_litiges': 0,
        'secteur': 'Agro-alimentaire', 'region': 'Nabeul',
        'type_client': 'Grossiste', 'banque_domiciliation': 'STB',
    },
    {
        'nom': 'ZIED KHELIFA GALERIE',
        'anciennete_annees': 4, 'nb_contrats_actifs': 2,
        'montant_encours_tnd': 260000, 'ca_annuel_tnd': 480000,
        'nb_traites_actives': 12, 'montant_moyen_traite': 21000,
        'nb_retards_12m': 3, 'nb_impayes': 2,
        'delai_moyen_jours': 92, 'concentration_pct': 62,
        'nb_cheques_retournes': 2, 'nb_litiges': 1,
        'secteur': 'Commerce', 'region': 'Monastir',
        'type_client': 'Détaillant', 'banque_domiciliation': 'UBCI',
    },
    {
        'nom': 'INES CHAABANE PHARMA',
        'anciennete_annees': 9, 'nb_contrats_actifs': 6,
        'montant_encours_tnd': 55000, 'ca_annuel_tnd': 950000,
        'nb_traites_actives': 5, 'montant_moyen_traite': 11000,
        'nb_retards_12m': 0, 'nb_impayes': 0,
        'delai_moyen_jours': 25, 'concentration_pct': 14,
        'nb_cheques_retournes': 0, 'nb_litiges': 0,
        'secteur': 'Commerce', 'region': 'Sousse',
        'type_client': 'Grossiste', 'banque_domiciliation': 'ATTIJARI',
    },
    {
        'nom': 'MEHREZ OUALI ACIER',
        'anciennete_annees': 1, 'nb_contrats_actifs': 1,
        'montant_encours_tnd': 780000, 'ca_annuel_tnd': 550000,
        'nb_traites_actives': 22, 'montant_moyen_traite': 35000,
        'nb_retards_12m': 8, 'nb_impayes': 4,
        'delai_moyen_jours': 130, 'concentration_pct': 84,
        'nb_cheques_retournes': 5, 'nb_litiges': 3,
        'secteur': 'Industrie', 'region': 'Sfax',
        'type_client': 'Détaillant', 'banque_domiciliation': 'QNB SELIENA',
    },
    {
        'nom': 'KHALIL TRIKI EXPORT',
        'anciennete_annees': 13, 'nb_contrats_actifs': 8,
        'montant_encours_tnd': 320000, 'ca_annuel_tnd': 5500000,
        'nb_traites_actives': 12, 'montant_moyen_traite': 26000,
        'nb_retards_12m': 0, 'nb_impayes': 0,
        'delai_moyen_jours': 16, 'concentration_pct': 8,
        'nb_cheques_retournes': 0, 'nb_litiges': 0,
        'secteur': 'Agro-alimentaire', 'region': 'Sfax',
        'type_client': 'Export', 'banque_domiciliation': 'UIB',
    },
    {
        'nom': 'FARES CHAKER PEINTURE',
        'anciennete_annees': 3, 'nb_contrats_actifs': 2,
        'montant_encours_tnd': 430000, 'ca_annuel_tnd': 610000,
        'nb_traites_actives': 14, 'montant_moyen_traite': 30000,
        'nb_retards_12m': 5, 'nb_impayes': 3,
        'delai_moyen_jours': 105, 'concentration_pct': 71,
        'nb_cheques_retournes': 3, 'nb_litiges': 2,
        'secteur': 'BTP', 'region': 'Ariana',
        'type_client': 'Détaillant', 'banque_domiciliation': 'AMEN BANK',
    },
    {
        'nom': 'SUPERMARCHÉ TOUNES',
        'anciennete_annees': 12, 'nb_contrats_actifs': 11,
        'montant_encours_tnd': 180000, 'ca_annuel_tnd': 7000000,
        'nb_traites_actives': 14, 'montant_moyen_traite': 13000,
        'nb_retards_12m': 0, 'nb_impayes': 0,
        'delai_moyen_jours': 14, 'concentration_pct': 5,
        'nb_cheques_retournes': 0, 'nb_litiges': 0,
        'secteur': 'Commerce', 'region': 'Tunis',
        'type_client': 'Grande surface', 'banque_domiciliation': 'BNA',
    },
    {
        'nom': 'RAOUF BELHAJ MEUBLES',
        'anciennete_annees': 5, 'nb_contrats_actifs': 3,
        'montant_encours_tnd': 160000, 'ca_annuel_tnd': 390000,
        'nb_traites_actives': 8, 'montant_moyen_traite': 20000,
        'nb_retards_12m': 2, 'nb_impayes': 1,
        'delai_moyen_jours': 68, 'concentration_pct': 44,
        'nb_cheques_retournes': 1, 'nb_litiges': 0,
        'secteur': 'Commerce', 'region': 'Monastir',
        'type_client': 'Détaillant', 'banque_domiciliation': 'ZITOUNA BQ',
    },
])

# Encoder
for col in cat_cols:
    nouveaux_clients[col+'_enc'] = le_dict[col].transform(nouveaux_clients[col])

# Features dérivées
nouveaux_clients['ratio_encours_ca']   = nouveaux_clients['montant_encours_tnd'] / nouveaux_clients['ca_annuel_tnd']
nouveaux_clients['encours_par_traite'] = nouveaux_clients['montant_encours_tnd'] / nouveaux_clients['nb_traites_actives']
nouveaux_clients['score_anciennete']   = np.where(nouveaux_clients['anciennete_annees']>10,1,np.where(nouveaux_clients['anciennete_annees']>5,0,-1))
nouveaux_clients['charge_paiement']    = nouveaux_clients['nb_retards_12m'] + nouveaux_clients['nb_impayes']*2 + nouveaux_clients['nb_cheques_retournes']*3
nouveaux_clients['stress_financier']   = nouveaux_clients['ratio_encours_ca'] * nouveaux_clients['delai_moyen_jours'] / 30

# Prédiction
probas  = model.predict_proba(nouveaux_clients[features])[:, 1]
from scipy.stats import percentileofscore
train_probas = model.predict_proba(X[features])[:, 1]
scores = [int(percentileofscore(train_probas, p)) for p in probas]
niveaux = ['ÉLEVÉ' if s>60 else 'MODÉRÉ' if s>30 else 'FAIBLE' for s in scores]

print(f"{'#':<3} {'Client':<28} {'Score':>6}  {'Niveau':<8} {'Verdict attendu'}")
print("="*72)
for i, row in nouveaux_clients.iterrows():
    attendu = "✅ FAIBLE" if scores[i]<30 else "✅ ÉLEVÉ" if scores[i]>60 else "~ MODÉRÉ"
    print(f"{i+1:<3} {row['nom']:<28} {scores[i]:>5}/100  {niveaux[i]:<8} {attendu}")