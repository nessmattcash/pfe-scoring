import { useState, useEffect, useRef } from "react"
import { AppCtx } from "./AppContext"
import { TRANSLATIONS } from "./constants/data"
import Aurora from "./components/Aurora"
import Header from "./components/Header"
import Footer from "./components/Footer"
import Loader from "./components/Loader"
import LoginPage from "./pages/LoginPage"
import ScoringPage from "./pages/ScoringPage"
import MassScoringPage from "./pages/MassScoringPage"
import DashboardPage from "./pages/DashboardPage"
import HomePage from "./pages/HomePage"

const PAGES     = ["home","scoring","masse","dashboard","login"]
const PROTECTED = ["scoring","masse","dashboard"]

export default function App() {
  const [lang,     setLang]    = useState("fr")
  const [page,     setPageRaw] = useState("home")
  const [risk,     setRisk]    = useState("idle")
  const [loaderOn, setLoaderOn]= useState(false)
  const [user,     setUser]    = useState(null)

  const pageRef  = useRef("home")
  const userRef  = useRef(null)
  const t1Ref    = useRef(null)
  const t2Ref    = useRef(null)
  const t        = TRANSLATIONS[lang]

  // Restore session
  useEffect(() => {
    try {
      const token = localStorage.getItem("stbg_token") || sessionStorage.getItem("stbg_token")
      if (!token) return
      const payload = JSON.parse(atob(token.split(".")[1]))
      if (payload.exp * 1000 < Date.now()) { localStorage.removeItem("stbg_token"); return }
      const u = { token, name: payload.name || payload.email, email: payload.email, role: "Analyste" }
      setUser(u); userRef.current = u
    } catch {}
  }, [])

  // Hash on mount
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (PAGES.includes(hash)) { setPageRaw(hash); pageRef.current = hash }
  }, [])

  const navigate = (target) => {
    if (target === pageRef.current) return
    clearTimeout(t1Ref.current); clearTimeout(t2Ref.current)
    pageRef.current = target
    window.location.hash = target
    // Show loader, swap page immediately (no black gap), then hide loader
    setLoaderOn(true)
    setPageRaw(target)                                    // ← swap page NOW
    window.scrollTo({ top: 0, behavior: "instant" })
    t1Ref.current = setTimeout(() => setLoaderOn(false), 1400) // loader hides after animation
  }

  const setPage = (newPage) => {
    const target = PROTECTED.includes(newPage) && !userRef.current ? "login" : newPage
    navigate(target)
  }

  const handleLogin = (userData) => {
    setUser(userData); userRef.current = userData
    navigate("home")
  }

  const handleLogout = () => {
    localStorage.removeItem("stbg_token")
    sessionStorage.removeItem("stbg_token")
    setUser(null); userRef.current = null
    navigate("home")
  }

  const isAuth = page === "login"

  return (
    <AppCtx.Provider value={{ lang, setLang, t }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>

      <Loader active={loaderOn}/>
      <Aurora riskLevel={risk}/>

      {!isAuth && <Header page={page} setPage={setPage} user={user} onLogout={handleLogout}/>}

      <main style={{ position:"relative", zIndex:2, paddingTop: isAuth ? 0 : 80 }}>
        {page === "home"      && <HomePage      setPage={setPage} lang={lang}/>}
        {page === "scoring"   && <ScoringPage   onRiskChange={setRisk}/>}
        {page === "masse"     && <MassScoringPage/>}
        {page === "dashboard" && <DashboardPage/>}
        {page === "login"     && <LoginPage     setPage={setPage} lang={lang} onLogin={handleLogin}/>}
      </main>

      {!isAuth && <Footer setPage={setPage}/>}
    </AppCtx.Provider>
  )
}