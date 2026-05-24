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
import HomePage from "./pages/HomePage"

const MScoringPage = memo(({ onRiskChange }) => <ScoringPage onRiskChange={onRiskChange}/>)
const MBatchPage   = memo(() => <MassScoringPage/>)
const MDashPage    = memo(() => <DashboardPage/>)
const MHomePage    = memo(({ setPage, lang }) => <HomePage setPage={setPage} lang={lang}/>)


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
        {page === "home"      && <MHomePage     setPage={setPage} lang={lang}/>}
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