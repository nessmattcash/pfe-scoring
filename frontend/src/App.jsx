import { useState } from "react"
import { AppCtx } from "./AppContext"
import { TRANSLATIONS } from "./constants/data"
import Aurora from "./components/Aurora"
import Header from "./components/Header"
import Footer from "./components/Footer"
import ScoringPage from "./pages/ScoringPage"

function PlaceholderPage({ msg }) {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "100px 32px", textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 16, opacity: .2 }}>🚧</div>
      <div style={{ fontSize: 15, fontWeight: 500, color: "#64748b" }}>{msg}</div>
    </div>
  )
}

export default function App() {
  const [dark, setDark]   = useState(true)
  const [lang, setLang]   = useState("fr")
  const [page, setPage]   = useState("scoring")
  const [risk, setRisk]   = useState("idle")

  const t = TRANSLATIONS[lang]

  return (
    <AppCtx.Provider value={{ dark, setDark, lang, setLang, t }}>
      {/* Global styles */}
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background: ${dark ? "#020817" : "#f8fafc"};
          overflow-x: hidden;
          transition: background .5s;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: rgba(128,128,128,.18); border-radius: 99px; }
        input[type=number]::-webkit-inner-spin-button { opacity: .15; }
        input, select, button { font-family: inherit; }
      `}</style>

      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
        rel="stylesheet"
      />

      {/* Aurora background */}
      <Aurora dark={dark} riskLevel={risk} />

      {/* App shell */}
      <div style={{
        position: "relative", zIndex: 1,width: "100%",
        minHeight: "100vh", display: "flex", flexDirection: "column",
        color: dark ? "#e2e8f0" : "#0f172a",
        transition: "color .4s"
      }}>
        <Header page={page} setPage={setPage} />

        <div style={{ flex: 1 }}>
          {page === "scoring"   && <ScoringPage onRiskChange={setRisk} />}
          {page === "masse"     && <PlaceholderPage msg={t.masse} />}
          {page === "dashboard" && <PlaceholderPage msg={t.dash} />}
        </div>

        <Footer setPage={setPage} />
      </div>
    </AppCtx.Provider>
  )
}