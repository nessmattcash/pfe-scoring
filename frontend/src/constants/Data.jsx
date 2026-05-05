export const REGIONS = [
  "Tunis","Ariana","Ben Arous","Manouba","Nabeul","Zaghouan","Bizerte",
  "Béja","Jendouba","Le Kef","Siliana","Sousse","Monastir","Mahdia",
  "Sfax","Kairouan","Kasserine","Sidi Bouzid","Gabès","Médenine",
  "Tataouine","Gafsa","Tozeur","Kébili","Autre"
]

export const SECTEURS = [
  "Commerce","Industrie","BTP","Agro-alimentaire","Distribution",
  "Services","Transport","Immobilier","Hôtellerie & Restauration",
  "Technologie","Santé","Éducation","Agriculture","Pêche","Artisanat","Autre"
]

export const TYPES = [
  "Grossiste","Détaillant","Grande surface","Restauration","Export",
  "Import-Export","PME","Grande entreprise","Startup","Association","Autre"
]

export const BANQUES = [
  "ATTIJARI","BNA","BIAT","STB","ATB","QNB SELIENA","UIB",
  "AMEN BANK","WIFAK BANK","ZITOUNA BQ","AL BARAKA","UBCI",
  "BTRUE DE TURQUIE","ABC Bank","Stusid Bank","BH Bank","BTS","BTL","Autre"
]

export const INIT_FORM = {
  anciennete_annees:5, nb_contrats_actifs:4,
  montant_encours_tnd:120000, ca_annuel_tnd:620000,
  nb_traites_actives:6, montant_moyen_traite:20000,
  nb_retards_12m:1, nb_impayes:0,
  delai_moyen_jours:28, concentration_pct:14,
  nb_cheques_retournes:0, nb_litiges:0,
  secteur:"Commerce", region:"Tunis",
  type_client:"Grossiste", banque_domiciliation:"ATTIJARI",
  // "Autre" custom values
  secteur_custom:"", region_custom:"",
  type_custom:"", banque_custom:""
}

export const FIELD_RULES = {
  anciennete_annees:    { min:0,  max:50,       step:1 },
  nb_contrats_actifs:   { min:1,  max:50,       step:1 },
  montant_encours_tnd:  { min:0,  max:5000000,  step:1000 },
  ca_annuel_tnd:        { min:1,  max:50000000, step:10000 },
  nb_traites_actives:   { min:1,  max:100,      step:1 },
  montant_moyen_traite: { min:0,  max:2000000,  step:1000 },
  nb_retards_12m:       { min:0,  max:50,       step:1 },
  nb_impayes:           { min:0,  max:20,       step:1 },
  delai_moyen_jours:    { min:0,  max:365,      step:1 },
  concentration_pct:    { min:0,  max:100,      step:1 },
  nb_cheques_retournes: { min:0,  max:20,       step:1 },
  nb_litiges:           { min:0,  max:20,       step:1 },
}

export const TRANSLATIONS = {
  fr: {
    nav: { scoring:"Scoring", masse:"Masse", dashboard:"Dashboard" },
    hSub: "Plateforme d'analyse de risque",
    fCopy: "Tous droits réservés",
    fLinks: { home:"Accueil", scoring:"Scoring", contact:"Contact" },
    s01:"Profil client", s02:"Données financières", s03:"Historique de paiement",
    secteur:"Secteur d'activité", type:"Type client",
    region:"Région", banque:"Banque domiciliataire",
    encours:"Encours (TND)", ca:"CA annuel (TND)", anc:"Ancienneté (ans)",
    traites:"Traites actives", moy:"Montant moy. traite", contrats:"Contrats actifs",
    ret:"Retards 12 mois", imp:"Impayés", delai:"Délai moy. paiement (j)",
    cheq:"Chèques retournés", lit:"Litiges en cours", conc:"Concentration (%)",
    autrePh:"Précisez votre valeur…",
    calc:"Analyser le risque", reset:"Réinitialiser",
    waitTitle:"En attente d'analyse",
    waitSub:"Renseignez le formulaire et lancez l'analyse",
    res:"Résultat du scoring", reco:"Recommandation",
    proba:"Probabilité ML brute",
    shap:"Facteurs influents",
    shapUp:"augmente le risque", shapDn:"réduit le risque",
    loading:"Analyse en cours…",
    err:"Connexion impossible — vérifiez que FastAPI tourne sur le port 8000",
    faible:"FAIBLE", modere:"MODÉRÉ", eleve:"ÉLEVÉ",
    dec0:"Accorder le crédit",
    dec1:"Accorder avec garanties",
    dec2:"Refuser le crédit",
    masse:"Scoring en masse — bientôt disponible",
    dash:"Dashboard analytique — bientôt disponible",
  },
  en: {
    nav: { scoring:"Scoring", masse:"Batch", dashboard:"Dashboard" },
    hSub: "Risk analysis platform",
    fCopy: "All rights reserved",
    fLinks: { home:"Home", scoring:"Scoring", contact:"Contact" },
    s01:"Client profile", s02:"Financial data", s03:"Payment history",
    secteur:"Sector", type:"Client type", region:"Region", banque:"Bank",
    encours:"Outstanding (TND)", ca:"Annual revenue (TND)", anc:"Seniority (yrs)",
    traites:"Active bills", moy:"Avg bill amount", contrats:"Active contracts",
    ret:"Delays (12m)", imp:"Unpaid", delai:"Avg payment delay (d)",
    cheq:"Returned cheques", lit:"Disputes", conc:"Concentration (%)",
    autrePh:"Specify your value…",
    calc:"Analyze risk", reset:"Reset",
    waitTitle:"Awaiting analysis",
    waitSub:"Fill in the form then launch the analysis",
    res:"Scoring result", reco:"Recommendation",
    proba:"Raw ML probability",
    shap:"Key factors",
    shapUp:"increases risk", shapDn:"reduces risk",
    loading:"Analysing…",
    err:"Connection failed — check FastAPI is running on port 8000",
    faible:"LOW", modere:"MODERATE", eleve:"HIGH",
    dec0:"Grant credit",
    dec1:"Grant with guarantees",
    dec2:"Reject credit",
    masse:"Batch scoring — coming soon",
    dash:"Analytics dashboard — coming soon",
  }
}