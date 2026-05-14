import { useState, useEffect } from "react"
import { useApp } from "../AppContext"

export default function Header({ page, setPage }) {
  const { lang, setLang, t } = useApp()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30)
    window.addEventListener("scroll", fn, { passive: true })
    return () => window.removeEventListener("scroll", fn)
  }, [])

  return (
    <header className={`site-header${scrolled?" scrolled":""}`}>
      {/* Logo */}
      <div className="logo" onClick={() => setPage("scoring")}>
        <div className="logo-mark"/>
        <div className="logo-text">
          <div className="logo-name">STBG <span>Risk</span></div>
          <div className="logo-sub">Intelligence Platform</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="nav">
        <a href="#scoring" className={page==="scoring"?"active":""} onClick={e=>{e.preventDefault();setPage("scoring")}}>
          Scoring
        </a>
        <a href="#methodology" onClick={e=>{e.preventDefault()}}>
          {lang==="fr"?"Méthodologie":"Methodology"}
        </a>
        <a href="#dashboard" className={page==="dashboard"?"active":""} onClick={e=>{e.preventDefault();setPage("dashboard")}}>
          Dashboard
        </a>
      </nav>

      {/* Right */}
      <div className="header-right">
        <div className="status-pill">
          <span className="dot"/>
          {lang==="fr"?"Actif":"Live"}
        </div>
        <div className="lang-toggle">
          <button className={lang==="fr"?"active":""} onClick={()=>setLang("fr")}>FR</button>
          <button className={lang==="en"?"active":""} onClick={()=>setLang("en")}>EN</button>
        </div>
        <button className="btn-login">
          {lang==="fr"?"Connexion":"Sign in"}
        </button>
      </div>
    </header>
  )
}