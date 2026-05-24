import { useState, useEffect, useCallback, memo, useRef } from "react"
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

const MScoringPage = memo(({ onRiskChange }) => <ScoringPage onRiskChange={onRiskChange}/>)
const MBatchPage   = memo(() => <MassScoringPage/>)
const MDashPage    = memo(() => <DashboardPage/>)
const MHomePage    = memo(({ setPage, lang }) => <HomePage setPage={setPage} lang={lang}/>)

const PAGES     = ["home","scoring","masse","dashboard","login"]
const PROTECTED = ["scoring","masse","dashboard"]

export default function App() {
  const [lang,     setLang]    = useState("fr")
  const [page,     setPageRaw] = useState("home")
  const [risk,     setRisk]    = useState("idle")
  const [loaderOn, setLoaderOn]= useState(false)
  const [user,     setUser]    = useState(null)

  const pageRef = useRef("home")
  const userRef = useRef(null)
  const t = TRANSLATIONS[lang]

  // Restore session on mount
  useEffect(() => {
    try {
      const token = localStorage.getItem("stbg_token") || sessionStorage.getItem("stbg_token")
      if (!token) return
      const payload = JSON.parse(atob(token.split(".")[1]))
      if (payload.exp * 1000 < Date.now()) { localStorage.removeItem("stbg_token"); return }
      const restored = { token, name: payload.name || payload.email, email: payload.email, role: "Analyste" }
      setUser(restored)
      userRef.current = restored
    } catch {}
  }, [])

  // Hash sync on mount
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (PAGES.includes(hash)) { setPageRaw(hash); pageRef.current = hash }
  }, [])

  // Navigate with loader — uses refs so always stable
  const navigate = useCallback((target) => {
    if (target === pageRef.current) return
    pageRef.current = target
    window.location.hash = target
    setLoaderOn(true)
    setTimeout(() => {
      setPageRaw(target)
      window.scrollTo({ top: 0, behavior: "instant" })
    }, 400)
    setTimeout(() => setLoaderOn(false), 1400)
  }, [])

  // setPage — guards protected routes, always stable
  const setPage = useCallback((newPage) => {
    const isProtected = PROTECTED.includes(newPage)
    const loggedIn    = !!userRef.current
    const target      = isProtected && !loggedIn ? "login" : newPage
    navigate(target)
  }, [navigate])

  // Login handler — called by LoginPage on success
  const handleLogin = useCallback((userData) => {
    setUser(userData)
    userRef.current = userData
    // Small delay so state settles, then go home
    setTimeout(() => navigate("home"), 50)
  }, [navigate])

  // Logout
  const handleLogout = useCallback(() => {
    localStorage.removeItem("stbg_token")
    sessionStorage.removeItem("stbg_token")
    setUser(null)
    userRef.current = null
    navigate("home")
  }, [navigate])

  const isAuth = page === "login"

  return (
    <AppCtx.Provider value={{ lang, setLang, t }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>

      <Loader active={loaderOn}/>
      <Aurora riskLevel={risk}/>

      {!isAuth && <Header page={page} setPage={setPage} user={user} onLogout={handleLogout}/>}

      <main style={{ position:"relative", zIndex:2, paddingTop: isAuth ? 0 : 80 }}>
        {page === "home"      && <MHomePage    setPage={setPage} lang={lang}/>}
        {page === "scoring"   && <MScoringPage onRiskChange={setRisk}/>}
        {page === "masse"     && <MBatchPage/>}
        {page === "dashboard" && <MDashPage/>}
        {page === "login"     && <LoginPage    setPage={setPage} lang={lang} onLogin={handleLogin}/>}
      </main>

      {!isAuth && <Footer setPage={setPage}/>}
    </AppCtx.Provider>
  )
}