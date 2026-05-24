import { useState, useEffect } from "react"
import { useApp } from "../AppContext"

export default function Header({ page, setPage, user, onLogout }) {
  const { lang, setLang } = useApp()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30)
    window.addEventListener("scroll", fn, { passive: true })
    return () => window.removeEventListener("scroll", fn)
  }, [])

  const initials = user?.name
    ? user.name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase()
    : null

  return (
    <header className={`site-header${scrolled ? " scrolled" : ""}`}>
      <div className="logo" onClick={() => setPage("home")} style={{ cursor:"pointer" }}>
        <div className="logo-mark" style={{ overflow:"hidden", borderRadius:4 }}>
          <img src="/logo.png" alt="STBG" style={{ width:36, height:36, objectFit:"contain", display:"block" }}/>
        </div>
        <div className="logo-text">
          <div className="logo-name">STBG <span>Risk</span></div>
          <div className="logo-sub">Intelligence Platform</div>
        </div>
      </div>

      <nav className="nav">
        <a href="#home" className={page==="home"?"active":""} onClick={e=>{e.preventDefault();setPage("home")}}>
          {lang==="fr"?"Accueil":"Home"}
        </a>
        <a href="#scoring" className={page==="scoring"?"active":""} onClick={e=>{e.preventDefault();setPage("scoring")}}>
          Scoring
        </a>
        <a href="#masse" className={page==="masse"?"active":""} onClick={e=>{e.preventDefault();setPage("masse")}}>
          {lang==="fr"?"Masse":"Batch"}
        </a>
        <a href="#dashboard" className={page==="dashboard"?"active":""} onClick={e=>{e.preventDefault();setPage("dashboard")}}>
          Dashboard
        </a>
      </nav>

      <div className="header-right">
        <div className="status-pill">
          <span className="dot"/>
          {lang==="fr"?"Actif":"Live"}
        </div>
        <div className="lang-toggle">
          <button className={lang==="fr"?"active":""} onClick={() => setLang("fr")}>FR</button>
          <button className={lang==="en"?"active":""} onClick={() => setLang("en")}>EN</button>
        </div>

        {user ? (
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {/* User avatar */}
            <div style={{
              width:32, height:32, borderRadius:"50%",
              background:"linear-gradient(135deg,var(--royal),var(--burgundy))",
              border:"1px solid rgba(244,197,66,0.25)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontFamily:"var(--mono)", fontSize:11, color:"var(--gold)", fontWeight:700,
              cursor:"default", flexShrink:0,
            }} title={user.name || user.email}>
              {initials || "?"}
            </div>
            {/* Logout */}
            <button className="btn-login" onClick={onLogout} style={{ background:"transparent", border:"1px solid rgba(244,197,66,0.2)", color:"rgba(244,197,66,0.6)" }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--burgundy)";e.currentTarget.style.color="var(--red)"}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(244,197,66,0.2)";e.currentTarget.style.color="rgba(244,197,66,0.6)"}}>
              {lang==="fr"?"Déconnexion":"Sign out"}
            </button>
          </div>
        ) : (
          <button className="btn-login" onClick={() => setPage("login")}>
            {lang==="fr"?"Connexion":"Sign in"}
          </button>
        )}
      </div>
    </header>
  )
}