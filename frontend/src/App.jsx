import { useState } from "react"
import { AppCtx } from "./AppContext"
import { TRANSLATIONS } from "./constants/data"
import Aurora from "./components/Aurora"
import Header from "./components/Header"
import Footer from "./components/Footer"
import ScoringPage from "./pages/ScoringPage"

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

  return (
    <AppCtx.Provider value={{ lang, setLang, t }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      <Aurora riskLevel={risk}/>
      <Header page={page} setPage={setPage}/>
      <main style={{ position:"relative", zIndex:2, paddingTop:80 }}>
        {page==="scoring"   && <ScoringPage onRiskChange={setRisk}/>}
        {page==="masse"     && <PlaceholderPage msg="SCORING EN MASSE · BIENTÔT DISPONIBLE"/>}
        {page==="dashboard" && <PlaceholderPage msg="DASHBOARD ANALYTIQUE · BIENTÔT DISPONIBLE"/>}
      </main>
      <Footer setPage={setPage}/>
    </AppCtx.Provider>
  )
}