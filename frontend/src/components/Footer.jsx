import { useApp } from "../AppContext"

export default function Footer({ setPage }) {
  const { lang } = useApp()

  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-col">
          <div className="logo" style={{ marginBottom: 16 }}>
            <div className="logo-mark"/>
            <div className="logo-text">
              <div className="logo-name">STBG <span>Risk</span></div>
              <div className="logo-sub">Intelligence Platform</div>
            </div>
          </div>
          <p style={{ fontSize: 12, color: "var(--ink-dim)", maxWidth: 280 }}>
            {lang==="fr"
              ? "Plateforme de scoring du risque crédit pour la Société Tunisienne des Boissons Gazeuses."
              : "Credit risk scoring platform for Société Tunisienne des Boissons Gazeuses."}
          </p>
        </div>

        <div className="footer-col">
          <h4>{lang==="fr"?"Plateforme":"Platform"}</h4>
          <a href="#" onClick={e=>{e.preventDefault();setPage("scoring")}}>Scoring</a>
          <a href="#" onClick={e=>e.preventDefault()}>{lang==="fr"?"Méthodologie":"Methodology"}</a>
          <a href="#" onClick={e=>{e.preventDefault();setPage("dashboard")}}>Dashboard</a>
          <a href="#" onClick={e=>e.preventDefault()}>API</a>
        </div>

        <div className="footer-col">
          <h4>{lang==="fr"?"Ressources":"Resources"}</h4>
          <a href="#" onClick={e=>e.preventDefault()}>Documentation</a>
          <a href="#" onClick={e=>e.preventDefault()}>Changelog</a>
          <a href="#" onClick={e=>e.preventDefault()}>{lang==="fr"?"Conformité BCT":"BCT compliance"}</a>
          <a href="#" onClick={e=>e.preventDefault()}>{lang==="fr"?"Sécurité":"Security"}</a>
        </div>

        <div className="footer-col">
          <h4>Contact</h4>
          <a href="#" onClick={e=>e.preventDefault()}>risk@stbg.tn</a>
          <a href="#" onClick={e=>e.preventDefault()}>+216 71 XXX XXX</a>
          <a href="#" onClick={e=>e.preventDefault()}>STBG Mégrine</a>
          <a href="#" onClick={e=>e.preventDefault()}>Khlifi Ayoub · PFE 2026</a>
        </div>
      </div>

      <div className="footer-bot">
        <span>© STBG 2026 · {lang==="fr"?"Tous droits réservés":"All rights reserved"}</span>
        <span>v 2.0 — XGBOOST · BCT-COMPLIANT</span>
      </div>
    </footer>
  )
}