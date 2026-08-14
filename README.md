# STBGRisk

Plateforme de scoring du risque crédit-client, développée pour la **STBG** (Société Tunisienne des Boissons Gazeuses). Le système combine un modèle XGBoost entraîné avec un moteur de règles métier expertes pour produire un score de risque hybride (0–100) par client, avec scoring unitaire, import de masse (CSV/Excel), dashboard analytique et console d'administration.

Réalisé par **Khlifi Ayoub** — Finance digitale, spécialisation Data & IA appliquées au risque de crédit.

---

## Sommaire

- [Aperçu](#aperçu)
- [Stack technique](#stack-technique)
- [Architecture](#architecture)
- [Structure du projet](#structure-du-projet)
- [Installation](#installation)
- [Lancer le projet](#lancer-le-projet)
- [Authentification](#authentification)
- [Le modèle de scoring](#le-modèle-de-scoring)
- [API — Endpoints](#api--endpoints)
- [Pages de l'application](#pages-de-lapplication)
- [Format des fichiers CSV](#format-des-fichiers-csv)
- [Design system](#design-system)
- [Limites connues & pistes d'amélioration](#limites-connues--pistes-damélioration)
- [Licence](#licence)

---

## Aperçu

STBGRisk permet à un analyste crédit de :

- **Scorer un client individuellement** — formulaire détaillé (secteur, région, historique de paiement, encours, etc.) → score de risque instantané avec explication des facteurs.
- **Scorer un portefeuille entier** — import CSV/Excel en masse, scoring par lot, export des résultats.
- **Visualiser un dashboard analytique** — répartition par secteur, région, banque domiciliataire, type de client ; top 10 des clients à risque ; export CSV.
- **Administrer la plateforme** — (compte Administrateur) gestion des comptes utilisateurs, supervision de la santé de l'API, aperçu du dernier lot scoré.

Chaque score est accompagné d'un niveau de risque (**FAIBLE / MODÉRÉ / ÉLEVÉ**) et d'une décision suggérée (accorder, accorder avec garanties, refuser), conformément à une logique de conformité BCT.

---

## Stack technique

### Backend
| Composant | Rôle |
|---|---|
| **FastAPI** | Framework API REST |
| **XGBoost** (via `joblib`) | Modèle de classification du risque (`model.pkl`) |
| **pandas / numpy** | Préparation des features et manipulation des données |
| **SQLite** | Base des utilisateurs (`users.db`) |
| **passlib[argon2]** | Hachage des mots de passe |
| **python-jose** | Génération et vérification des JWT |

### Frontend
| Composant | Rôle |
|---|---|
| **React** | Framework UI |
| **axios** | Appels HTTP vers l'API |
| Fonts : **DM Serif Display**, **Inter**, **JetBrains Mono** | Identité visuelle |

Aucun framework CSS externe : le design system est un fichier `index.css` unique basé sur des variables CSS (`:root`), sans Tailwind ni styled-components.

---

## Architecture

```
┌─────────────────┐        ┌──────────────────┐        ┌────────────────┐
│   React SPA      │──────▶│   FastAPI backend  │──────▶│  Modèle XGBoost │
│  (App.jsx routeur │ axios │  main.py + auth.py │joblib │  + règles métier│
│   par état, pas    │       │                    │       │  (model.pkl)    │
│   react-router)     │       │                    │       │                 │
└─────────────────┘        └──────────────────┘        └────────────────┘
                                      │
                                      ▼
                              ┌───────────────┐
                              │  SQLite         │
                              │  users.db       │
                              │  (comptes,      │
                              │  codes reset)   │
                              └───────────────┘
```

- **Navigation** : pas de `react-router` — `App.jsx` gère un état `page` et bascule les composants manuellement, avec synchronisation dans `window.location.hash`.
- **Session** : le JWT est stocké dans `localStorage` (case "rester connecté") ou `sessionStorage`. Le rôle et le nom de l'utilisateur sont également persistés séparément (`stbg_user`) pour survivre à un rafraîchissement de page sans dépendre uniquement du payload du token.
- **Score hybride** : `score_final = proba_ml × 100 × 0.60 + score_métier × 0.40`, plafonné entre 1 et 99.

---

## Structure du projet

```
stbgrisk/
├── main.py                    # API FastAPI — scoring, batch, résultats
├── auth.py                    # API FastAPI — authentification, comptes
├── models/
│   ├── model.pkl               # Modèle XGBoost entraîné
│   ├── label_encoders.pkl      # Encodeurs des variables catégorielles
│   └── features.pkl            # Liste ordonnée des features attendues par le modèle
├── users.db                    # Base SQLite (générée au premier lancement)
├── resultats_scoring.csv       # Dernier lot scoré en masse (généré à l'usage)
│
├── src/
│   ├── App.jsx                  # Point d'entrée, routage par état, gestion session
│   ├── AppContext.jsx            # Contexte React (langue, traductions)
│   ├── index.css                 # Design system complet
│   ├── constants/
│   │   └── data.js                # Traductions, listes (secteurs, régions, banques…)
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   ├── Loader.jsx             # Transition plein écran entre les pages
│   │   └── Aurora.jsx             # Fond animé (vagues de couleur selon le risque)
│   └── pages/
│       ├── HomePage.jsx           # Landing page
│       ├── LoginPage.jsx          # Connexion / inscription / mot de passe oublié
│       ├── ScoringPage.jsx        # Scoring unitaire
│       ├── MassScoringPage.jsx    # Scoring en masse (CSV/Excel)
│       ├── DashboardPage.jsx      # Dashboard analytique
│       └── AdminDashboardPage.jsx # Console d'administration
│
└── README.md
```

> **Note** — Ce dépôt ne contient pas de `requirements.txt` ni de `package.json` pré-remplis dans les fichiers fournis ; les dépendances listées ci-dessous sont extraites directement des imports réels du code.

---

## Installation

### Prérequis
- Python 3.10+
- Node.js 18+
- Les trois fichiers du modèle entraîné : `models/model.pkl`, `models/label_encoders.pkl`, `models/features.pkl` (non fournis dans ce dépôt — à générer via votre pipeline d'entraînement ou à copier depuis l'environnement d'entraînement)

### Backend

```bash
python -m venv venv
source venv/bin/activate        # Windows : venv\Scripts\activate

pip install fastapi uvicorn joblib numpy pandas openpyxl \
            "passlib[argon2]" python-jose[cryptography] pydantic[email]
```

### Frontend

```bash
npm install react react-dom axios
# + votre bundler (Vite recommandé, vu la config vite.config.js mentionnée dans le projet)
```

---

## Lancer le projet

**1. Démarrer l'API** (depuis le dossier contenant `main.py`) :

```bash
uvicorn main:app --reload --port 8000
```

Au premier lancement, `auth.py` initialise automatiquement `users.db` et crée deux comptes par défaut :

| Compte | Email | Mot de passe | Rôle |
|---|---|---|---|
| Administrateur (démo) | `admin@stbgrisk.tn` | `admin1234` | Administrateur |
| Compte principal | `ayoub@stbgrisk.tn` | `stbg2026` | Administrateur |

> ⚠️ **À changer avant toute mise en production.** Ces identifiants sont pensés pour la démonstration/soutenance uniquement.

**2. Démarrer le frontend :**

```bash
npm run dev
```

Le frontend attend l'API sur `http://127.0.0.1:8000` (URL en dur dans `ScoringPage.jsx`, `MassScoringPage.jsx` et `AdminDashboardPage.jsx` — à externaliser en variable d'environnement si vous déployez ailleurs qu'en local).

---

## Authentification

- **Inscription / connexion** classiques par email + mot de passe (hachage **argon2**).
- **Mot de passe oublié** : génère un code à 6 chiffres valable 15 minutes (`/auth/forgot`, `/auth/reset`). En développement, le code est renvoyé directement dans la réponse (`dev_code`) — **à retirer avant mise en production**, il doit normalement être envoyé par email uniquement.
- **JWT** : durée de validité de 24h, algorithme HS256.
- **Rôles** : `Analyste` (par défaut) et `Administrateur`. Le rôle conditionne l'accès à la console d'administration (`/admin`), protégée à la fois côté frontend (redirection) et côté API (`GET /auth/users` renvoie une erreur 403 si le compte n'est pas administrateur).

---

## Le modèle de scoring

Le score final est un **hybride pondéré** :

```
score_final = (probabilité_ML × 100 × 0.60) + (score_métier × 0.40)
```

### Volet Machine Learning (poids : 60%)
Modèle **XGBoost** entraîné sur les features suivantes (calculées à la volée dans `main.py`) :

- Variables brutes du client (ancienneté, encours, CA, retards, impayés, etc.)
- Variables catégorielles encodées (`secteur`, `région`, `type_client`, `banque_domiciliation`) via des `LabelEncoder` pré-entraînés
- Features dérivées : `ratio_encours_ca`, `encours_par_traite`, `score_anciennete`, `charge_paiement`, `stress_financier`, `ratio_retards_ca`, `ratio_impayes_ca`, `anciennete_log`, `flag_mono_contrat`, `delai_x_retards`

### Volet règles métier (poids : 40%)
Score construit à la main dans `compute_score_metier()`, sensible à :

- Le ratio encours/chiffre d'affaires (facteur dominant)
- L'historique de paiement (retards, impayés, chèques retournés, litiges)
- Le délai moyen de paiement (seuil de tolérance : 20 jours)
- La concentration du portefeuille (seuil : 10%)
- L'ancienneté de la relation client (effet protecteur, plafonné)
- La structure contractuelle (mono-contrat = risque structurel ; gros contrats = exposition élevée)

### Seuils de décision

| Score | Niveau | Décision |
|---|---|---|
| > 60 | ÉLEVÉ | Refuser le crédit |
| 31–60 | MODÉRÉ | Accorder avec garanties |
| ≤ 30 | FAIBLE | Accorder le crédit |

### Gestion des valeurs inconnues
Si une valeur catégorielle (secteur, région, etc.) n'a pas été vue à l'entraînement, elle est automatiquement remplacée par une valeur de repli (`Commerce`, `Tunis`, `Grossiste`, `ATTIJARI`) plutôt que de faire échouer la prédiction.

---

## API — Endpoints

Base URL locale : `http://127.0.0.1:8000`

### Scoring (`main.py`)

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/predict` | Score un client unique (payload JSON, voir le modèle `Client`) |
| `POST` | `/batch_predict` | Score un fichier CSV ou Excel entier (`multipart/form-data`, champ `file`) |
| `GET`  | `/results` | Renvoie le dernier lot scoré en masse (lu depuis `resultats_scoring.csv`) |
| `GET`  | `/health` | Statut de l'API et version du modèle |
| `GET`  | `/` | Message de bienvenue |

### Authentification (`auth.py`, préfixe `/auth`)

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/auth/register` | Créer un compte |
| `POST` | `/auth/login` | Connexion, renvoie `{ token, user }` |
| `POST` | `/auth/forgot` | Demande de réinitialisation (envoie un code) |
| `POST` | `/auth/reset` | Réinitialise le mot de passe avec le code reçu |
| `GET`  | `/auth/me` | Infos du compte connecté (nécessite un Bearer token) |
| `GET`  | `/auth/users` | Liste tous les comptes — **réservé aux administrateurs** (403 sinon) |

### Exemple — `POST /predict`

```json
{
  "anciennete_annees": 5,
  "nb_contrats_actifs": 7,
  "montant_encours_tnd": 388393,
  "ca_annuel_tnd": 642722,
  "nb_traites_actives": 14,
  "montant_moyen_traite": 41471,
  "nb_retards_12m": 2,
  "nb_impayes": 0,
  "delai_moyen_jours": 45,
  "concentration_pct": 28.0,
  "nb_cheques_retournes": 0,
  "nb_litiges": 0,
  "secteur": "BTP",
  "region": "Bizerte",
  "type_client": "Grande entreprise",
  "banque_domiciliation": "BIAT"
}
```

Réponse :

```json
{
  "score": 35,
  "niveau": "MODÉRÉ",
  "decision": "Accorder avec garanties",
  "proba_ml": 0.2891,
  "score_metier": 41.2,
  "shap": [
    { "label": "ratio_encours_ca", "value": 0.604 },
    { "label": "nb_impayes", "value": 0 },
    ...
  ]
}
```

---

## Pages de l'application

| Route (état `page`) | Composant | Accès |
|---|---|---|
| `home` | `HomePage.jsx` | Public |
| `login` | `LoginPage.jsx` | Public |
| `scoring` | `ScoringPage.jsx` | Connecté |
| `masse` | `MassScoringPage.jsx` | Connecté |
| `dashboard` | `DashboardPage.jsx` | Connecté |
| `admin` | `AdminDashboardPage.jsx` | Connecté + rôle `Administrateur` |

Un utilisateur non connecté tentant d'accéder à une page protégée est redirigé vers `login`. Un utilisateur non-admin tentant d'accéder à `/admin` est redirigé vers `home`.

---

## Format des fichiers CSV

### Import (scoring en masse)
Colonnes obligatoires (en-tête exact, séparateur `;` ou `,` auto-détecté) :

```
prenom, nom, secteur, region, type_client, banque_domiciliation,
montant_encours_tnd, ca_annuel_tnd, anciennete_annees, nb_traites_actives,
montant_moyen_traite, nb_contrats_actifs, nb_retards_12m, nb_impayes,
delai_moyen_jours, nb_cheques_retournes, nb_litiges, concentration_pct
```

`prenom` et `nom` sont optionnels ; toutes les autres colonnes sont requises, sans quoi l'API renvoie une erreur 400 listant les colonnes manquantes.

### Export (résultats)
L'export inclut désormais **l'intégralité** des colonnes d'entrée en plus des résultats de scoring (`score`, `niveau`, `decision`, `proba_ml`, `score_metier`), pour garantir que l'en-tête et les valeurs restent toujours alignés quel que soit le nombre de colonnes du fichier importé.

---

## Design system

Le fichier `index.css` définit un système de design sombre et cohérent via des variables CSS :

```css
--bg: #0a0612;        /* fond principal */
--gold: #f4c542;       /* accent principal */
--burgundy: #7a2d3a;    /* accent risque élevé */
--royal: #2d1f4a;        /* accent secondaire */
--ink: #f5efe0;           /* texte principal */
```

- **Typographie** : `DM Serif Display` (titres), `Inter` (texte courant), `JetBrains Mono` (données, labels techniques).
- **Composants réutilisables** : `.stbg-table` (tableaux de données premium avec zebra-striping et en-tête à fort contraste), `.reveal` / `.reveal-left` / `.reveal-right` (animations d'apparition au scroll), `.chip-pro` (sélecteurs de catégories), `.custom-select` (listes déroulantes stylées).
- Pas de framework CSS tiers — tout est écrit à la main pour un contrôle visuel total.

---

## Limites connues & pistes d'amélioration

- **URL de l'API en dur** (`http://127.0.0.1:8000`) dans plusieurs composants frontend — à remplacer par une variable d'environnement (`VITE_API_URL` ou équivalent) avant tout déploiement hors local.
- **`dev_code` exposé** dans la réponse de `/auth/forgot` — fonctionnel pour la démo, à retirer en production au profit d'un envoi par email réel (SMTP).
- **CORS ouvert à `*`** dans `main.py` — à restreindre au(x) domaine(s) de production.
- **`resultats_scoring.csv` en fichier local unique** — un seul lot scoré est conservé à la fois (pas d'historique multi-lots). Une base de données serait nécessaire pour un historique persistant.
- **Aucun `requirements.txt` / `package.json` fourni** dans les fichiers sources actuels — à générer (`pip freeze > requirements.txt`) une fois l'environnement stabilisé.
- **Modèle non versionné dans ce dépôt** — `models/*.pkl` doivent être fournis séparément ou régénérés via le pipeline d'entraînement.

---

## Licence

Projet académique / démonstration interne — Khlifi Ayoub, 2026. Tous droits réservés STBGRisk.
