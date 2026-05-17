import { useState, useEffect } from "react"
import { AppCtx } from "./AppContext"
import { TRANSLATIONS } from "./constants/data"
import Aurora from "./components/Aurora"
import Header from "./components/Header"
import Footer from "./components/Footer"
import ScoringPage from "./pages/ScoringPage"
import MassScoringPage from "./pages/MassScoringPage"
import DashboardPage from "./pages/DashboardPage"

export default function App() {
  const [lang, setLang] = useState("fr")
  const [page, setPage] = useState("scoring")
  const [risk, setRisk] = useState("idle")
  const t = TRANSLATIONS[lang]

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (["scoring","masse","dashboard"].includes(hash)) setPage(hash)
    const fn = () => {
      const h = window.location.hash.slice(1)
      if (["scoring","masse","dashboard"].includes(h)) setPage(h)
    }
    window.addEventListener("hashchange", fn)
    return () => window.removeEventListener("hashchange", fn)
  }, [])

  return (
    <AppCtx.Provider value={{ lang, setLang, t }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      <Aurora riskLevel={risk}/>
      <Header page={page} setPage={setPage}/>
      <main style={{ position:"relative", zIndex:2, paddingTop:80 }}>
        {page==="scoring"   && <ScoringPage onRiskChange={setRisk}/>}
        {page==="masse"     && <MassScoringPage/>}
        {page==="dashboard" && <DashboardPage/>}
      </main>
      <Footer setPage={setPage}/>
    </AppCtx.Provider>
  )
}