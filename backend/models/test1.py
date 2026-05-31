"""
STBG Risk — Test de sensibilité du modèle
==========================================
Partie 1 : 6 valeurs par attribut (les autres constants) → vérifier la monotonie
Partie 2 : 20 profils aléatoires → vérifier la plage globale
"""
import requests, json, random, time

API = "http://127.0.0.1:8000/predict"

def score(data):
    r = requests.post(API, json=data, timeout=5)
    if r.status_code == 200:
        j = r.json()
        return j["score"], j["niveau"], j["proba_ml"], j["score_metier"]
    return None, f"ERR {r.status_code}", 0, 0

# ── Profil de base "neutre" — ni bon ni mauvais ──────────────────────────────
BASE = {
    "anciennete_annees":    6,
    "nb_contrats_actifs":   4,
    "montant_encours_tnd":  250000,
    "ca_annuel_tnd":        900000,
    "nb_traites_actives":   8,
    "montant_moyen_traite": 30000,
    "nb_retards_12m":       3,
    "nb_impayes":           1,
    "delai_moyen_jours":    35,
    "concentration_pct":    18.0,
    "nb_cheques_retournes": 1,
    "nb_litiges":           0,
    "secteur":              "Commerce",
    "region":               "Tunis",
    "type_client":          "Grossiste",
    "banque_domiciliation": "ATTIJARI",
}

# ─────────────────────────────────────────────────────────────────────────────
# PARTIE 1 — Sensibilité attribut par attribut
# Chaque bloc : 6 valeurs du plus favorable au plus risqué
# Les autres attributs = BASE
# ─────────────────────────────────────────────────────────────────────────────

SENSITIVITY_TESTS = [

    # ── anciennete_annees : plus c'est vieux → moins risqué ──────────────────
    ("ANCIENNETÉ (ans)", "anciennete_annees",
     [(25, "très ancien → FAIBLE"),
      (15, "ancien → FAIBLE"),
      (8,  "moyen"),
      (4,  "jeune"),
      (2,  "très jeune"),
      (1,  "nouveau → risqué")]),

    # ── nb_retards_12m : plus c'est élevé → plus risqué ──────────────────────
    ("RETARDS 12M", "nb_retards_12m",
     [(0,  "aucun → FAIBLE"),
      (1,  "rare"),
      (3,  "modéré"),
      (6,  "fréquent"),
      (10, "très fréquent → ÉLEVÉ"),
      (15, "systématique → ÉLEVÉ")]),

    # ── nb_impayes ────────────────────────────────────────────────────────────
    ("IMPAYÉS", "nb_impayes",
     [(0, "aucun → FAIBLE"),
      (1, "un seul"),
      (2, "deux"),
      (4, "sérieux"),
      (6, "grave → ÉLEVÉ"),
      (9, "critique → ÉLEVÉ")]),

    # ── ratio encours/CA via montant_encours_tnd (CA fixe 900k) ──────────────
    ("ENCOURS TND (CA=900k fixe)", "montant_encours_tnd",
     [(45000,   "ratio 5%  → très sain"),
      (135000,  "ratio 15% → sain"),
      (270000,  "ratio 30% → limite"),
      (540000,  "ratio 60% → tendu"),
      (900000,  "ratio 100% → dangereux"),
      (1800000, "ratio 200% → critique")]),

    # ── delai_moyen_jours ─────────────────────────────────────────────────────
    ("DÉLAI MOYEN PAIEMENT (j)", "delai_moyen_jours",
     [(5,   "5j → excellent"),
      (15,  "15j → bon"),
      (30,  "30j → limite"),
      (60,  "60j → retardataire"),
      (90,  "90j → mauvais"),
      (150, "150j → très mauvais")]),

    # ── nb_cheques_retournes ──────────────────────────────────────────────────
    ("CHÈQUES RETOURNÉS", "nb_cheques_retournes",
     [(0, "aucun → FAIBLE"),
      (1, "un"),
      (2, "deux"),
      (3, "trois → signal fort"),
      (5, "cinq → grave"),
      (8, "huit → critique")]),

    # ── nb_litiges ────────────────────────────────────────────────────────────
    ("LITIGES", "nb_litiges",
     [(0, "aucun"),
      (1, "un"),
      (2, "deux"),
      (3, "trois → sérieux"),
      (5, "cinq → grave"),
      (7, "sept → critique")]),

    # ── concentration_pct ─────────────────────────────────────────────────────
    ("CONCENTRATION % CA STBG", "concentration_pct",
     [(3.0,  "3%  → sain"),
      (10.0, "10% → normal"),
      (20.0, "20% → seuil"),
      (35.0, "35% → dépendance"),
      (55.0, "55% → forte dépendance"),
      (75.0, "75% → très forte")]),

    # ── nb_contrats_actifs ────────────────────────────────────────────────────
    ("NB CONTRATS ACTIFS", "nb_contrats_actifs",
     [(12, "12 → portefeuille riche"),
      (8,  "8"),
      (5,  "5 → moyen"),
      (3,  "3"),
      (2,  "2 → peu diversifié"),
      (1,  "1 → mono-contrat")]),

    # ── montant_moyen_traite ─────────────────────────────────────────────────
    ("MONTANT MOYEN TRAITE", "montant_moyen_traite",
     [(5000,   "5k  → petites traites"),
      (15000,  "15k → normal"),
      (30000,  "30k → élevé"),
      (60000,  "60k → très élevé"),
      (100000, "100k → gros"),
      (200000, "200k → très gros")]),
]

# ─────────────────────────────────────────────────────────────────────────────
# PARTIE 2 — 20 profils aléatoires
# ─────────────────────────────────────────────────────────────────────────────
SECTEURS = ["Commerce","Industrie","BTP","Distribution","Services","Transport","Agro-alimentaire"]
TYPES    = ["Grossiste","Détaillant","PME","Grande entreprise","Startup"]
REGIONS  = ["Tunis","Sfax","Sousse","Monastir","Nabeul","Bizerte","Kairouan","Gabès"]
BANQUES  = ["ATTIJARI","BIAT","BNA","STB","ATB","UIB","BH Bank"]

random.seed(42)

def random_profile(label=""):
    enc = random.randint(20000, 2500000)
    ca  = random.randint(200000, 3500000)
    return {
        "label":   label,
        "data": {
            "anciennete_annees":    random.randint(1, 25),
            "nb_contrats_actifs":   random.randint(1, 15),
            "montant_encours_tnd":  enc,
            "ca_annuel_tnd":        ca,
            "nb_traites_actives":   random.randint(1, 25),
            "montant_moyen_traite": random.randint(3000, 150000),
            "nb_retards_12m":       random.randint(0, 18),
            "nb_impayes":           random.randint(0, 8),
            "delai_moyen_jours":    random.randint(3, 180),
            "concentration_pct":    round(random.uniform(1, 75), 1),
            "nb_cheques_retournes": random.randint(0, 8),
            "nb_litiges":           random.randint(0, 6),
            "secteur":              random.choice(SECTEURS),
            "region":               random.choice(REGIONS),
            "type_client":          random.choice(TYPES),
            "banque_domiciliation": random.choice(BANQUES),
        }
    }

# Profils calibrés avec distributions réalistes
def rnd_cal(label):
    import numpy as _np
    d   = int(_np.clip(_np.random.lognormal(3.1, 0.5), 3, 120))
    ret = int(_np.clip(_np.random.poisson(1.2), 0, 10))
    imp = int(_np.clip(_np.random.poisson(0.4), 0, 5))
    ca  = random.randint(150000, 5000000)
    rat = float(_np.clip(_np.random.lognormal(-1.4, 0.8), 0.02, 1.2))
    enc = int(ca * rat)
    return {"label": label, "data": {
        "anciennete_annees":    random.randint(1, 20),
        "nb_contrats_actifs":   random.randint(1, 12),
        "montant_encours_tnd":  max(enc, 5000),
        "ca_annuel_tnd":        ca,
        "nb_traites_actives":   random.randint(1, 20),
        "montant_moyen_traite": random.randint(3000, 80000),
        "nb_retards_12m":       ret,
        "nb_impayes":           imp,
        "delai_moyen_jours":    d,
        "concentration_pct":    round(random.uniform(2, 55), 1),
        "nb_cheques_retournes": int(_np.clip(_np.random.poisson(0.3), 0, 5)),
        "nb_litiges":           int(_np.clip(_np.random.poisson(0.15), 0, 3)),
        "secteur":              random.choice(SECTEURS),
        "region":               random.choice(REGIONS),
        "type_client":          random.choice(TYPES),
        "banque_domiciliation": random.choice(BANQUES),
    }}

random.seed(42)
RANDOM_PROFILES = [rnd_cal(f"RND-{i+1:02d}") for i in range(20)]

# ═════════════════════════════════════════════════════════════════════════════
# RUN
# ═════════════════════════════════════════════════════════════════════════════
def bar(score, width=30):
    filled = int(score / 100 * width)
    c = "█" if score <= 30 else ("▓" if score <= 60 else "░")
    return c * filled + "·" * (width - filled)

def niveau_color(n):
    return {"FAIBLE":"🟢","MODÉRÉ":"🟡","ÉLEVÉ":"🔴"}.get(n,"⚪")

print("\n" + "═"*110)
print("  STBG RISK — TEST DE SENSIBILITÉ DU MODÈLE")
print("  Profil de base : ancienneté=6ans, retards=3, impayés=1, encours=250k, CA=900k, délai=35j")
print("═"*110)

# ── PARTIE 1 ─────────────────────────────────────────────────────────────────
for (bloc_name, attr, values) in SENSITIVITY_TESTS:
    print(f"\n{'─'*110}")
    print(f"  📊 {bloc_name}  (les autres attributs = BASE)")
    print(f"{'─'*110}")
    print(f"  {'VALEUR':<10} {'DESCRIPTION':<35} {'SCORE':>5} {'NIVEAU':<10} {'ML':>6} {'METIER':>6}  {'BARRE'}")
    print(f"  {'─'*8:<10} {'─'*33:<35} {'─'*5:>5} {'─'*8:<10} {'─'*6:>6} {'─'*6:>6}  {'─'*30}")
    prev_score = None
    for val, desc in values:
        d = {**BASE, attr: val}
        s, niv, ml, met = score(d)
        if s is not None:
            arrow = ""
            if prev_score is not None:
                diff = s - prev_score
                arrow = f"  ↑+{diff}" if diff > 0 else (f"  ↓{diff}" if diff < 0 else "  →0")
            print(f"  {str(val):<10} {desc:<35} {s:>5} {niveau_color(niv)} {niv:<8} {ml:>6.3f} {met:>6.1f}  {bar(s)}{arrow}")
            prev_score = s
        else:
            print(f"  {str(val):<10} {desc:<35}  ❌ ERREUR")
        time.sleep(0.05)

# ── PARTIE 2 ─────────────────────────────────────────────────────────────────
print("\n\n" + "═"*110)
print("  20 PROFILS ALÉATOIRES — Test de plage globale")
print("═"*110)
print(f"\n  {'NOM':<10} {'SECTEUR':<16} {'RÉGION':<12} {'RETARDS':>7} {'IMPAYÉS':>7} {'RATIO':>7} {'DÉLAI':>6} {'SCORE':>6} {'NIV':<10} {'ML':>7}")
print(f"  {'─'*8:<10} {'─'*14:<16} {'─'*10:<12} {'─'*7:>7} {'─'*7:>7} {'─'*7:>7} {'─'*6:>6} {'─'*5:>6} {'─'*8:<10} {'─'*7:>7}")

scores_random = []
for p in RANDOM_PROFILES:
    d = p["data"]
    s, niv, ml, met = score(d)
    if s is not None:
        ratio = round(d["montant_encours_tnd"] / max(d["ca_annuel_tnd"], 1), 2)
        print(f"  {p['label']:<10} {d['secteur']:<16} {d['region']:<12} {d['nb_retards_12m']:>7} {d['nb_impayes']:>7} {ratio:>7.2f} {d['delai_moyen_jours']:>6} {s:>6} {niveau_color(niv)} {niv:<8} {ml:>7.3f}")
        scores_random.append(s)
    time.sleep(0.05)

if scores_random:
    print(f"\n  Plage : {min(scores_random)} → {max(scores_random)}")
    print(f"  Moyenne : {sum(scores_random)/len(scores_random):.1f}")
    faible  = sum(1 for s in scores_random if s <= 30)
    modere  = sum(1 for s in scores_random if 30 < s <= 60)
    eleve   = sum(1 for s in scores_random if s > 60)
    print(f"  Répartition : 🟢 FAIBLE={faible}  🟡 MODÉRÉ={modere}  🔴 ÉLEVÉ={eleve}")

# ── PARTIE 3 — Cas extrêmes ───────────────────────────────────────────────────
print("\n\n" + "═"*110)
print("  CAS EXTRÊMES — Vérification des bornes")
print("═"*110)

extremes = [
    ("PARFAIT",    {"anciennete_annees":25,"nb_contrats_actifs":15,"montant_encours_tnd":10000,"ca_annuel_tnd":5000000,"nb_traites_actives":3,"montant_moyen_traite":3000,"nb_retards_12m":0,"nb_impayes":0,"delai_moyen_jours":3,"concentration_pct":1.0,"nb_cheques_retournes":0,"nb_litiges":0,"secteur":"Commerce","region":"Tunis","type_client":"Grossiste","banque_domiciliation":"BIAT"}),
    ("CATASTROPHE",{"anciennete_annees":1,"nb_contrats_actifs":1,"montant_encours_tnd":3000000,"ca_annuel_tnd":100000,"nb_traites_actives":30,"montant_moyen_traite":100000,"nb_retards_12m":20,"nb_impayes":10,"delai_moyen_jours":200,"concentration_pct":90.0,"nb_cheques_retournes":10,"nb_litiges":8,"secteur":"BTP","region":"Tataouine","type_client":"Startup","banque_domiciliation":"STB"}),
    ("BASE NEUTRE", BASE),
]

for name, d in extremes:
    s, niv, ml, met = score(d)
    print(f"  {name:<15}  score={s:>3}  {niveau_color(niv)} {niv:<10}  ML={ml:.3f}  métier={met:.1f}  {bar(s)}")

print("\n" + "═"*110)
print("  FIN DU TEST")
print("═"*110 + "\n")