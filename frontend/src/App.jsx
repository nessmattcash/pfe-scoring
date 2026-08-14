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
import AdminDashboardPage from "./pages/AdminDashboardPage"
import HomePage from "./pages/HomePage"

const PAGES     = ["home","scoring","masse","dashboard","admin","login"]
const PROTECTED = ["scoring","masse","dashboard","admin"]
const ADMIN_ONLY = ["admin"]

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
      if (payload.exp * 1000 < Date.now()) {
        localStorage.removeItem("stbg_token"); localStorage.removeItem("stbg_user")
        sessionStorage.removeItem("stbg_token"); sessionStorage.removeItem("stbg_user")
        return
      }
      // Prefer the real user record (name/role) saved at login time.
      // Falling back to the JWT payload alone would lose the role and
      // silently downgrade an admin to "Analyste" on every page refresh.
      const savedUser = localStorage.getItem("stbg_user") || sessionStorage.getItem("stbg_user")
      const parsed = savedUser ? JSON.parse(savedUser) : null
      const u = {
        token,
        name:  parsed?.name  || payload.name || payload.email,
        email: parsed?.email || payload.email,
        role:  parsed?.role  || "Analyste",
      }
      setUser(u); userRef.current = u
    } catch {}
  }, [])

  // Hash on mount
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (PAGES.includes(hash)) { setPageRaw(hash); pageRef.current = hash }
  }, [])

  // Page title
  useEffect(() => {
    document.title = "STBGRisk · Intelligence Platform"
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
    let target = newPage
    if (PROTECTED.includes(newPage) && !userRef.current) target = "login"
    else if (ADMIN_ONLY.includes(newPage) && userRef.current?.role !== "Administrateur") target = "home"
    navigate(target)
  }

  const handleLogin = (userData) => {
    // Keep the user record (name/role) in sync with wherever the token was stored,
    // so a refresh restores the real role instead of defaulting to Analyste.
    const store = localStorage.getItem("stbg_token") ? localStorage : sessionStorage
    store.setItem("stbg_user", JSON.stringify(userData))
    setUser(userData); userRef.current = userData
    navigate(userData?.role === "Administrateur" ? "admin" : "home")
  }

  const handleLogout = () => {
    localStorage.removeItem("stbg_token"); localStorage.removeItem("stbg_user")
    sessionStorage.removeItem("stbg_token"); sessionStorage.removeItem("stbg_user")
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
        {page === "admin"     && <AdminDashboardPage user={user} lang={lang} setPage={setPage}/>}
        {page === "login"     && <LoginPage     setPage={setPage} lang={lang} onLogin={handleLogin}/>}
      </main>

      {!isAuth && <Footer setPage={setPage}/>}
    </AppCtx.Provider>
  )
}