"""
STBG Risk — Dataset v3 FINAL (version qui fonctionne)
Labels calculés depuis les attributs, distributions équilibrées ~50% risqués
"""
import pandas as pd
import numpy as np
from pathlib import Path

np.random.seed(42)
N = 50000

BANQUES      = ["ATTIJARI","BNA","BIAT","STB","ATB","QNB SELIENA","UIB",
                "AMEN BANK","WIFAK BANK","ZITOUNA BQ","AL BARAKA","UBCI","BH BANK"]
SECTEURS     = ["Commerce","Industrie","BTP","Agro-alimentaire","Distribution","Transport","Services"]
REGIONS      = ["Tunis","Sfax","Sousse","Bizerte","Nabeul","Ariana",
                "Ben Arous","Monastir","Kairouan","Gabès","Médenine"]
TYPES_CLIENT = ["Grossiste","Détaillant","Grande surface","Export","PME"]

# Distributions réalistes
anciennete = np.round(np.random.lognormal(1.8, 0.8, N)).clip(0, 25).astype(int)
ca = (np.random.lognormal(13.5, 1.2, N)).astype(int).clip(30_000, 15_000_000)
ratio_enc = np.random.beta(1.5, 3, N) * 2.0
encours = (ca * ratio_enc * np.random.uniform(0.9, 1.1, N)).astype(int).clip(5_000, 4_000_000)
nb_retards = np.random.poisson(1.5, N).clip(0, 18).astype(int)
nb_impayes = np.random.poisson(0.6, N).clip(0, 10).astype(int)
delai = np.round(np.random.lognormal(3.4, 0.7, N)).clip(1, 180).astype(int)
cheques_ret = np.random.poisson(0.4, N).clip(0, 10).astype(int)
litiges = np.random.poisson(0.2, N).clip(0, 7).astype(int)
concentration = (np.random.beta(1.2, 2.5, N) * 95 + 1).clip(1, 98).round(1)
nb_contrats = np.random.choice(
    [1,2,3,4,5,6,7,8,10,12,15], N,
    p=[0.06,0.10,0.14,0.15,0.14,0.12,0.10,0.08,0.06,0.03,0.02]
)

df = pd.DataFrame({
    'secteur':              np.random.choice(SECTEURS, N),
    'region':               np.random.choice(REGIONS, N),
    'type_client':          np.random.choice(TYPES_CLIENT, N),
    'banque_domiciliation': np.random.choice(BANQUES, N),
    'anciennete_annees':    anciennete,
    'nb_contrats_actifs':   nb_contrats,
    'montant_encours_tnd':  encours,
    'ca_annuel_tnd':        ca,
    'nb_traites_actives':   np.random.randint(1, 30, N),
    'montant_moyen_traite': (encours / np.random.randint(2, 20, N)).astype(int).clip(1000, 300_000),
    'nb_retards_12m':       nb_retards,
    'nb_impayes':           nb_impayes,
    'delai_moyen_jours':    delai,
    'concentration_pct':    concentration,
    'nb_cheques_retournes': cheques_ret,
    'nb_litiges':           litiges,
})

# Features dérivées
df['ratio_encours_ca']   = df['montant_encours_tnd'] / df['ca_annuel_tnd']
df['encours_par_traite'] = df['montant_encours_tnd'] / df['nb_traites_actives']
df['score_anciennete']   = np.where(df['anciennete_annees']>10,1,np.where(df['anciennete_annees']>5,0,-1))
df['charge_paiement']    = df['nb_retards_12m'] + df['nb_impayes']*2 + df['nb_cheques_retournes']*3
df['stress_financier']   = df['ratio_encours_ca'] * df['delai_moyen_jours'] / 30
df['ratio_retards_ca']   = df['nb_retards_12m'] / (df['ca_annuel_tnd']/1_000_000).clip(lower=0.01)
df['ratio_impayes_ca']   = df['nb_impayes'] / (df['ca_annuel_tnd']/1_000_000).clip(lower=0.01)
df['anciennete_log']     = np.log1p(df['anciennete_annees'])
df['flag_mono_contrat']  = (df['nb_contrats_actifs'] <= 2).astype(int)
df['delai_x_retards']    = df['delai_moyen_jours'] * df['nb_retards_12m']

def risque_continu(row):
    ca = max(row['ca_annuel_tnd'], 1)
    s = 0.0
    s += min(row['montant_encours_tnd'] / ca * 28, 40)
    s += row['nb_retards_12m']       * 4.5
    s += row['nb_impayes']           * 9.0
    s += row['nb_cheques_retournes'] * 6.5
    s += row['nb_litiges']           * 9.0
    s += max(0, (row['delai_moyen_jours'] - 20) * 0.55)
    s += max(0, (row['concentration_pct'] - 10) * 0.45)
    s -= min(row['anciennete_annees'] * 1.5, 22)
    if row['nb_contrats_actifs'] <= 2: s += 8
    elif row['nb_contrats_actifs'] >= 8: s -= 5
    return float(np.clip(s, 0, 100))

print("Calcul des labels...")
scores_risque = df.apply(risque_continu, axis=1).values
scores_norm = scores_risque / 100.0
scores_final = np.clip(scores_norm + np.random.normal(0, 0.08, N), 0, 1)

# Seuil 0.40 → ~50% risqués → modèle équilibré
df['risque_label'] = (scores_final > 0.40).astype(int)
df['score_risque_reel'] = (scores_final * 100).round(1)

print(f"\n✅ Dataset FINAL — {N:,} clients")
print(f"   Risqués : {df.risque_label.sum():,} ({df.risque_label.mean():.1%})")
print(f"   p10={np.percentile(scores_final*100,10):.0f}  p25={np.percentile(scores_final*100,25):.0f}  p50={np.percentile(scores_final*100,50):.0f}  p75={np.percentile(scores_final*100,75):.0f}  p90={np.percentile(scores_final*100,90):.0f}")

out = Path(__file__).parent / "data" / "dataset_clients.csv"
out.parent.mkdir(exist_ok=True)
df.to_csv(out, index=False, encoding='utf-8-sig')
print(f"💾 Sauvegardé → {out}")