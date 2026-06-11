"""
STBG Risk — Dataset v5 FINAL
Labels construits sur logique de DÉFAUT RÉEL, différente de score_metier.
Le ML apprend des interactions non-linéaires que les règles ne capturent pas.
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

# Risque par secteur (BTP et Transport = plus risqués)
SECTEUR_RISK = {
    "Commerce":0.0, "Industrie":0.05, "BTP":0.15,
    "Agro-alimentaire":-0.05, "Distribution":0.05,
    "Transport":0.10, "Services":0.0
}

# ── Générer les attributs avec corrélations réalistes ─────────────────────────
anciennete  = np.round(np.random.lognormal(1.8, 0.8, N)).clip(0, 25).astype(int)
ca          = np.random.lognormal(13.5, 1.2, N).astype(int).clip(30_000, 15_000_000)
ratio_enc   = np.random.beta(1.5, 3, N) * 2.0
encours     = (ca * ratio_enc * np.random.uniform(0.9, 1.1, N)).astype(int).clip(5_000, 4_000_000)
nb_retards  = np.random.poisson(1.5, N).clip(0, 18).astype(int)
nb_impayes  = np.random.poisson(0.6, N).clip(0, 10).astype(int)
delai       = np.round(np.random.lognormal(3.4, 0.7, N)).clip(1, 180).astype(int)
cheques_ret = np.random.poisson(0.4, N).clip(0, 10).astype(int)
litiges     = np.random.poisson(0.2, N).clip(0, 7).astype(int)
concentration = (np.random.beta(1.2, 2.5, N) * 95 + 1).clip(1, 98).round(1)
nb_contrats = np.random.choice(
    [1,2,3,4,5,6,7,8,10,12,15], N,
    p=[0.06,0.10,0.14,0.15,0.14,0.12,0.10,0.08,0.06,0.03,0.02]
)
secteurs_arr = np.random.choice(SECTEURS, N)
regions_arr  = np.random.choice(REGIONS, N)
types_arr    = np.random.choice(TYPES_CLIENT, N)
banques_arr  = np.random.choice(BANQUES, N)

df = pd.DataFrame({
    'secteur':              secteurs_arr,
    'region':               regions_arr,
    'type_client':          types_arr,
    'banque_domiciliation': banques_arr,
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

# ── Features dérivées ─────────────────────────────────────────────────────────
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

# ── LABEL : logique de défaut RÉEL, différente de score_metier ────────────────
# Probabilité de défaut basée sur des interactions non-linéaires
def proba_defaut(row):
    """
    Probabilité de défaut réel (0-1).
    DIFFÉRENTE de compute_score_metier :
    - Interactions multiplicatives (pas additives)
    - Effets de seuil non-linéaires
    - Effets sectoriels et temporels
    """
    p = 0.05  # probabilité de base

    # ── Facteur 1: stress liquidité (interaction ratio × délai, non-linéaire)
    ratio = row['ratio_encours_ca']
    if ratio > 1.2:    p += 0.45  # catastrophique
    elif ratio > 0.8:  p += 0.25  # dangereux
    elif ratio > 0.5:  p += 0.12  # tendu
    elif ratio > 0.25: p += 0.04

    # ── Facteur 2: comportement paiement (effets de seuil)
    # Impayés : risque exponentiel
    if row['nb_impayes'] >= 4:      p += 0.40
    elif row['nb_impayes'] == 3:    p += 0.25
    elif row['nb_impayes'] == 2:    p += 0.15
    elif row['nb_impayes'] == 1:    p += 0.06

    # Retards : risque cumulatif
    if row['nb_retards_12m'] >= 8:  p += 0.35
    elif row['nb_retards_12m'] >= 5: p += 0.20
    elif row['nb_retards_12m'] >= 3: p += 0.08
    elif row['nb_retards_12m'] >= 1: p += 0.02

    # ── Facteur 3: délai (seuil critique à 60j)
    if row['delai_moyen_jours'] >= 120:  p += 0.30
    elif row['delai_moyen_jours'] >= 80: p += 0.18
    elif row['delai_moyen_jours'] >= 60: p += 0.10
    elif row['delai_moyen_jours'] >= 45: p += 0.04

    # ── Facteur 4: incidents bancaires (litiges et chèques = signal très fort)
    if row['nb_litiges'] >= 3:           p += 0.30
    elif row['nb_litiges'] >= 1:         p += 0.12

    if row['nb_cheques_retournes'] >= 4: p += 0.25
    elif row['nb_cheques_retournes'] >= 2: p += 0.12
    elif row['nb_cheques_retournes'] >= 1: p += 0.05

    # ── Facteur 5: concentration (dépendance structurelle)
    if row['concentration_pct'] >= 70:   p += 0.15
    elif row['concentration_pct'] >= 50: p += 0.08
    elif row['concentration_pct'] >= 35: p += 0.03

    # ── Facteur 6: ancienneté (réducteur de risque non-linéaire)
    if row['anciennete_annees'] >= 15:   p -= 0.18
    elif row['anciennete_annees'] >= 10: p -= 0.10
    elif row['anciennete_annees'] >= 5:  p -= 0.04
    elif row['anciennete_annees'] <= 1:  p += 0.08

    # ── Facteur 7: risque sectoriel
    p += SECTEUR_RISK.get(row['secteur'], 0)

    # ── Facteur 8: interaction critique (combi retards + ratio élevé)
    if row['nb_retards_12m'] >= 3 and row['ratio_encours_ca'] > 0.6:
        p += 0.15  # effet multiplicatif non capturé par règles additives

    # ── Facteur 9: mono-contrat avec mauvais historique
    if row['nb_contrats_actifs'] <= 2 and row['nb_retards_12m'] >= 2:
        p += 0.08

    return float(np.clip(p, 0, 1))

print("Calcul des probabilités de défaut réel...")
probas = df.apply(proba_defaut, axis=1).values

# Ajouter bruit réaliste
bruit = np.random.normal(0, 0.07, N)
probas_final = np.clip(probas + bruit, 0, 1)

# Label: défaut si proba > 0.40 → ~35% risqués
df['risque_label']      = (probas_final > 0.40).astype(int)
df['proba_defaut_reel'] = probas_final.round(3)

n_risques = df.risque_label.sum()
print(f"\n✅ Dataset v5 — {N:,} clients")
print(f"   Risqués : {n_risques:,} ({n_risques/N:.1%})")
print(f"   Fiables : {N-n_risques:,} ({(N-n_risques)/N:.1%})")
print(f"\n   Distribution proba défaut :")
print(f"   p10={np.percentile(probas_final,10):.2f}  p25={np.percentile(probas_final,25):.2f}  "
      f"p50={np.percentile(probas_final,50):.2f}  p75={np.percentile(probas_final,75):.2f}  "
      f"p90={np.percentile(probas_final,90):.2f}")

# Vérification
from collections import Counter
print(f"\n   Par secteur (taux de défaut) :")
for s in sorted(SECTEURS):
    sub = df[df.secteur==s]
    print(f"   {s:<20} {sub.risque_label.mean():.1%}  ({len(sub):,} clients)")

out = Path(__file__).parent / "data" / "dataset_clients.csv"
out.parent.mkdir(exist_ok=True)
df.to_csv(out, index=False, encoding='utf-8-sig')
print(f"\n💾 Sauvegardé → {out}")