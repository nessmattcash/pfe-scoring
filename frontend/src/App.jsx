import { useState, useEffect, useCallback, memo } from "react"
import { AppCtx } from "./AppContext"
import { TRANSLATIONS } from "./constants/data"
import Aurora from "./components/Aurora"
import Header from "./components/Header"
import Footer from "./components/Footer"
import Loader from "./components/Loader"
import ScoringPage from "./pages/ScoringPage"
import MassScoringPage from "./pages/MassScoringPage"
import DashboardPage from "./pages/DashboardPage"

const MScoringPage = memo(({ onRiskChange }) => <ScoringPage onRiskChange={onRiskChange}/>)
const MBatchPage   = memo(() => <MassScoringPage/>)
const MDashPage    = memo(() => <DashboardPage/>)

// ── Home placeholder ──────────────────────────────────────────────────────────
function HomePage({ setPage }) {
  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "120px 40px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "rgba(244,197,66,0.4)", letterSpacing: "3px" }}>01</span>
        <div style={{ height: 1, width: 24, background: "rgba(244,197,66,0.2)" }}/>
        <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "rgba(244,197,66,0.45)", letterSpacing: "2.5px", textTransform: "uppercase" }}>Plateforme de scoring</span>
      </div>
      <h1 style={{ fontFamily: "var(--serif)", fontSize: "clamp(40px,5vw,72px)", fontWeight: 400, letterSpacing: "-.03em", lineHeight: 1.05, marginBottom: 24, color: "var(--ink)" }}>
        Intelligence du risque<br/><span style={{ color: "var(--gold)", fontStyle: "italic" }}>crédit STBG</span>
      </h1>
      <p style={{ fontFamily: "var(--sans)", fontSize: 16, color: "var(--ink-dim)", maxWidth: 560, lineHeight: 1.7, marginBottom: 40 }}>
        Modèle XGBoost hybride entraîné sur 50 000 profils. Score hybride 60% ML + 40% règles métier. AUC 0.97.
      </p>
      <div style={{ display: "flex", gap: 14 }}>
        <button
          className="submit-btn"
          onClick={() => setPage("scoring")}
          style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          <svg viewBox="0 0 20 20" width="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Lancer un scoring
        </button>
        <button
          onClick={() => setPage("dashboard")}
          style={{
            padding: "12px 24px", borderRadius: 10, border: "1px solid var(--line-strong)",
            background: "transparent", color: "var(--ink-dim)",
            fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "1px",
            cursor: "pointer", transition: "all .2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.color = "var(--gold)" }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line-strong)"; e.currentTarget.style.color = "var(--ink-dim)" }}
        >
          Dashboard →
        </button>
      </div>

      {/* Quick stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginTop: 80 }}>
        {[
          { val: "0.97", label: "AUC Score", sub: "XGBoost" },
          { val: "50k",  label: "Clients entraînement", sub: "synthétiques" },
          { val: "60/40",label: "Hybride ML/Métier", sub: "score final" },
          { val: "3",    label: "Interfaces", sub: "scoring · masse · dashboard" },
        ].map((s, i) => (
          <div key={i} style={{
            padding: "24px", background: "linear-gradient(160deg,rgba(44,30,66,0.7),rgba(26,16,42,0.8))",
            border: "1px solid rgba(244,197,66,0.1)", borderTop: "2px solid var(--gold)", borderRadius: 14
          }}>
            <div style={{ fontFamily: "var(--serif)", fontSize: 40, color: "var(--gold)", lineHeight: 1, marginBottom: 8 }}>{s.val}</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "rgba(244,197,66,0.45)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--ink-mute)" }}>{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Login placeholder ─────────────────────────────────────────────────────────
function LoginPage({ setPage }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 40px" }}>
      <div style={{ width: "100%", maxWidth: 420, textAlign: "center" }}>
        <div style={{ marginBottom: 32 }}>
          <img src="/logo.png" alt="STBG" style={{ width: 56, height: 56, objectFit: "contain", margin: "0 auto 16px", display: "block" }}/>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: 32, color: "var(--ink)", marginBottom: 8 }}>Connexion</h2>
          <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-mute)", letterSpacing: "2px" }}>STBG RISK PLATFORM</p>
        </div>
        <div style={{
          background: "linear-gradient(160deg,rgba(44,30,66,0.8),rgba(26,16,42,0.9))",
          border: "1px solid rgba(244,197,66,0.12)", borderRadius: 16, padding: "36px 32px"
        }}>
          <div style={{ marginBottom: 16 }}>
            <input placeholder="Identifiant" style={{
              width: "100%", padding: "12px 16px", background: "rgba(10,6,18,0.6)",
              border: "1px solid rgba(244,197,66,0.14)", borderRadius: 10, color: "var(--ink)",
              fontFamily: "var(--sans)", fontSize: 14, outline: "none",
            }}/>
          </div>
          <div style={{ marginBottom: 24 }}>
            <input type="password" placeholder="Mot de passe" style={{
              width: "100%", padding: "12px 16px", background: "rgba(10,6,18,0.6)",
              border: "1px solid rgba(244,197,66,0.14)", borderRadius: 10, color: "var(--ink)",
              fontFamily: "var(--sans)", fontSize: 14, outline: "none",
            }}/>
          </div>
          <button className="submit-btn" style={{ width: "100%", justifyContent: "center" }}
            onClick={() => setPage("home")}>
            Se connecter
          </button>
          <div style={{ marginTop: 20, fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-mute)" }}>
            Pas de compte ?{" "}
            <span style={{ color: "var(--gold)", cursor: "pointer" }} onClick={() => setPage("register")}>
              S'inscrire
            </span>
          </div>
        </div>
        <button onClick={() => setPage("home")} style={{
          marginTop: 20, fontFamily: "var(--mono)", fontSize: 10,
          color: "var(--ink-mute)", background: "none", cursor: "pointer",
          letterSpacing: "1px"
        }}>← Retour à l'accueil</button>
      </div>
    </div>
  )
}

// ── Register placeholder ──────────────────────────────────────────────────────
function RegisterPage({ setPage }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 40px" }}>
      <div style={{ width: "100%", maxWidth: 420, textAlign: "center" }}>
        <div style={{ marginBottom: 32 }}>
          <img src="/logo.png" alt="STBG" style={{ width: 56, height: 56, objectFit: "contain", margin: "0 auto 16px", display: "block" }}/>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: 32, color: "var(--ink)", marginBottom: 8 }}>Créer un compte</h2>
          <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-mute)", letterSpacing: "2px" }}>STBG RISK PLATFORM</p>
        </div>
        <div style={{
          background: "linear-gradient(160deg,rgba(44,30,66,0.8),rgba(26,16,42,0.9))",
          border: "1px solid rgba(244,197,66,0.12)", borderRadius: 16, padding: "36px 32px"
        }}>
          {[
            { placeholder: "Nom complet", type: "text" },
            { placeholder: "Identifiant", type: "text" },
            { placeholder: "Mot de passe", type: "password" },
            { placeholder: "Confirmer le mot de passe", type: "password" },
          ].map((f, i) => (
            <div key={i} style={{ marginBottom: i < 3 ? 14 : 24 }}>
              <input type={f.type} placeholder={f.placeholder} style={{
                width: "100%", padding: "12px 16px", background: "rgba(10,6,18,0.6)",
                border: "1px solid rgba(244,197,66,0.14)", borderRadius: 10, color: "var(--ink)",
                fontFamily: "var(--sans)", fontSize: 14, outline: "none",
              }}/>
            </div>
          ))}
          <button className="submit-btn" style={{ width: "100%", justifyContent: "center" }}
            onClick={() => setPage("home")}>
            S'inscrire
          </button>
          <div style={{ marginTop: 20, fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-mute)" }}>
            Déjà un compte ?{" "}
            <span style={{ color: "var(--gold)", cursor: "pointer" }} onClick={() => setPage("login")}>
              Se connecter
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════════════════════════════
const PAGES = ["home", "scoring", "masse", "dashboard", "login", "register"]

export default function App() {
  const [lang,        setLang]        = useState("fr")
  const [page,        setPageRaw]     = useState("home")
  const [prevPage,    setPrevPage]    = useState(null)
  const [risk,        setRisk]        = useState("idle")
  const [loaderOn,    setLoaderOn]    = useState(false)
  const t = TRANSLATIONS[lang]

  // Hash sync on mount
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (PAGES.includes(hash)) setPageRaw(hash)
  }, [])

  // Navigate with loader — 3s total, page switches at 800ms (during split)
  const setPage = useCallback((newPage) => {
    if (newPage === page) return
    window.location.hash = newPage
    setLoaderOn(true)
    setTimeout(() => {
      setPageRaw(newPage)
      window.scrollTo({ top: 0, behavior: "instant" })
    }, 800)
    setTimeout(() => setLoaderOn(false), 3000)
  }, [page])

  // Hide header/footer on login/register
  const isAuth = page === "login" || page === "register"

  return (
    <AppCtx.Provider value={{ lang, setLang, t }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>

      <Loader active={loaderOn}/>
      <Aurora riskLevel={risk}/>

      {!isAuth && <Header page={page} setPage={setPage}/>}

      <main style={{ position: "relative", zIndex: 2, paddingTop: isAuth ? 0 : 80, flex: 1 }}>
        {page === "home"      && <HomePage      setPage={setPage}/>}
        {page === "scoring"   && <MScoringPage  onRiskChange={setRisk}/>}
        {page === "masse"     && <MBatchPage/>}
        {page === "dashboard" && <MDashPage/>}
        {page === "login"     && <LoginPage     setPage={setPage}/>}
        {page === "register"  && <RegisterPage  setPage={setPage}/>}
      </main>

      {!isAuth && <Footer setPage={setPage}/>}
    </AppCtx.Provider>
  )
}