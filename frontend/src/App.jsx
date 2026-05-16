import { useState, useEffect } from "react"  
import { AppCtx } from "./AppContext"
import { TRANSLATIONS } from "./constants/data"
import Aurora from "./components/Aurora"
import Header from "./components/Header"
import Footer from "./components/Footer"
import ScoringPage from "./pages/ScoringPage"
import MassScoringPage from "./pages/MassScoringPage"

function PlaceholderPage({ msg }) {
  return (
    <div style={{ maxWidth:1280, margin:"0 auto", padding:"160px 40px 100px", textAlign:"center" }}>
      <div style={{ fontFamily:"var(--serif)", fontSize:48, color:"var(--gold)", marginBottom:16, opacity:.4 }}>
        Bientôt
      </div>
      <div style={{ fontFamily:"var(--mono)", fontSize:13, color:"var(--ink-mute)", letterSpacing:"2px" }}>
        {msg}
      </div>
    </div>
  )
}

export default function App() {
  const [lang, setLang] = useState("fr")
  const [page, setPage] = useState("scoring")
  const [risk, setRisk] = useState("idle")
  const t = TRANSLATIONS[lang]

  // Synchronisation avec le hash de l'URL
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash === "scoring" || hash === "masse" || hash === "dashboard") {
      setPage(hash)
    }
    const onHashChange = () => {
      const newHash = window.location.hash.slice(1)
      if (newHash === "scoring" || newHash === "masse" || newHash === "dashboard") {
        setPage(newHash)
      }
    }
    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [])

  return (
    <AppCtx.Provider value={{ lang, setLang, t }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      <Aurora riskLevel={risk}/>
      <Header page={page} setPage={setPage}/>
      <main style={{ position:"relative", zIndex:2, paddingTop:80 }}>
        {page==="scoring"   && <ScoringPage onRiskChange={setRisk}/>}
        {page === "masse" && <MassScoringPage />}
        {page==="dashboard" && <PlaceholderPage msg="DASHBOARD ANALYTIQUE · BIENTÔT DISPONIBLE"/>}
      </main>
      <Footer setPage={setPage}/>
    </AppCtx.Provider>
  )
}