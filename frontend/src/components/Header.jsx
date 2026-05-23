import { useState, useEffect } from "react"
import { useApp } from "../AppContext"

export default function Header({ page, setPage }) {
  const { lang, setLang } = useApp()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30)
    window.addEventListener("scroll", fn, { passive: true })
    return () => window.removeEventListener("scroll", fn)
  }, [])

  return (
    <header className={`site-header${scrolled ? " scrolled" : ""}`}>

      {/* Logo — real STBG image */}
      <div className="logo" onClick={() => setPage("home")} style={{ cursor: "pointer" }}>
        <div className="logo-mark" style={{ overflow: "hidden", borderRadius: 4 }}>
          <img
            src="/logo.png"
            alt="STBG"
            style={{ width: 36, height: 36, objectFit: "contain", display: "block" }}
          />
        </div>
        <div className="logo-text">
          <div className="logo-name">STBG <span>Risk</span></div>
          <div className="logo-sub">Intelligence Platform</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="nav">
        <a
          href="#home"
          className={page === "home" ? "active" : ""}
          onClick={e => { e.preventDefault(); setPage("home") }}
        >
          {lang === "fr" ? "Accueil" : "Home"}
        </a>
        <a
          href="#scoring"
          className={page === "scoring" ? "active" : ""}
          onClick={e => { e.preventDefault(); setPage("scoring") }}
        >
          Scoring
        </a>
        <a
          href="#masse"
          className={page === "masse" ? "active" : ""}
          onClick={e => { e.preventDefault(); setPage("masse") }}
        >
          {lang === "fr" ? "Masse" : "Batch"}
        </a>
        <a
          href="#dashboard"
          className={page === "dashboard" ? "active" : ""}
          onClick={e => { e.preventDefault(); setPage("dashboard") }}
        >
          Dashboard
        </a>
      </nav>

      {/* Right */}
      <div className="header-right">
        <div className="status-pill">
          <span className="dot"/>
          {lang === "fr" ? "Actif" : "Live"}
        </div>
        <div className="lang-toggle">
          <button className={lang === "fr" ? "active" : ""} onClick={() => setLang("fr")}>FR</button>
          <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button>
        </div>
        <button className="btn-login" onClick={() => setPage("login")}>
          {lang === "fr" ? "Connexion" : "Sign in"}
        </button>
      </div>
    </header>
  )
}