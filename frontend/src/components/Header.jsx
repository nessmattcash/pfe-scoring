import { useState, useEffect } from "react"
import { useApp } from "../AppContext"

export default function Header({ page, setPage }) {
  const { lang, setLang, t } = useApp()
  const [hov, setHov]       = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const [loginHov, setLoginHov] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", fn)
    return () => window.removeEventListener("scroll", fn)
  }, [])

  const NAV = [
    { key:"scoring",   label: t.nav.scoring },
    { key:"masse",     label: t.nav.masse },
    { key:"dashboard", label: t.nav.dashboard },
  ]

  return (
    <>
      <style>{`
        @keyframes pulse2{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(34,197,94,0.4)}70%{opacity:.7;box-shadow:0 0 0 6px rgba(34,197,94,0)}}
        .hbtn2{position:relative}
        .hbtn2::after{content:'';position:absolute;bottom:0;left:50%;right:50%;height:2px;
          background:linear-gradient(90deg,#c9a84c,#ef4444);
          transition:left .28s cubic-bezier(.4,0,.2,1),right .28s cubic-bezier(.4,0,.2,1);border-radius:99px}
        .hbtn2.on::after,.hbtn2:hover::after{left:8px;right:8px}
        .login-btn:hover{background:linear-gradient(135deg,#c9a84c,#f59e0b)!important;color:#0a0a1a!important;transform:translateY(-1px);box-shadow:0 6px 20px rgba(201,168,76,0.35)!important}
        .lang-btn:hover{border-color:rgba(201,168,76,0.5)!important;color:#c9a84c!important}
      `}</style>

      <header style={{
        position:"sticky", top:0, zIndex:200, width:"100%",
        background: scrolled ? "rgba(4,4,12,0.96)" : "rgba(4,4,12,0.75)",
        backdropFilter:"blur(28px)",
        borderBottom:`1px solid ${scrolled ? "rgba(201,168,76,0.2)" : "rgba(201,168,76,0.08)"}`,
        boxShadow: scrolled ? "0 4px 30px rgba(0,0,0,0.4)" : "none",
        transition:"all .4s ease",
        height: scrolled ? 64 : 80,
      }}>
        <div style={{
          width:"100%", padding:"0 48px", height:"100%",
          display:"flex", alignItems:"center", justifyContent:"space-between"
        }}>

          {/* ── Logo */}
          <div style={{display:"flex",alignItems:"center",gap:14,cursor:"pointer"}} onClick={()=>setPage("scoring")}>
            <div style={{position:"relative"}}>
              <img src="/logo.png" alt="STBG" style={{height: scrolled?36:44, transition:"height .3s"}}/>
              <div style={{
                position:"absolute",inset:-4,borderRadius:12,
                background:"radial-gradient(circle,rgba(201,168,76,0.15),transparent 70%)",
                pointerEvents:"none"
              }}/>
            </div>
            <div style={{width:1,height:30,background:"rgba(201,168,76,0.15)"}}/>
            <div>
              <div style={{
                fontSize: scrolled?15:17, fontWeight:900,
                letterSpacing:"-.03em", lineHeight:1.1,
                transition:"font-size .3s"
              }}>
                <span style={{color:"#f1f5f9"}}>STBG </span>
                <span style={{
                  background:"linear-gradient(90deg,#c9a84c,#f59e0b,#ef4444)",
                  WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                  backgroundSize:"200% 100%"
                }}>Risk</span>
              </div>
              <div style={{
                fontSize:8, color:"rgba(201,168,76,0.4)",
                letterSpacing:".18em", textTransform:"uppercase", marginTop:2
              }}>
                Intelligence Platform
              </div>
            </div>
          </div>

          {/* ── Nav */}
          <nav style={{display:"flex",gap:4,alignItems:"center"}}>
            {NAV.map(({key,label}) => {
              const on = page===key
              return (
                <button key={key}
                  className={`hbtn2${on?" on":""}`}
                  onClick={()=>setPage(key)}
                  onMouseEnter={()=>setHov(key)}
                  onMouseLeave={()=>setHov(null)}
                  style={{
                    border:"none", cursor:"pointer", fontFamily:"inherit",
                    fontWeight: on?700:400, fontSize:13,
                    padding:"10px 20px 12px",
                    background:"transparent",
                    color: on?"#c9a84c" : hov===key?"#e2e8f0":"#64748b",
                    transition:"color .2s", borderRadius:8
                  }}>{label}</button>
              )
            })}
          </nav>

          {/* ── Right controls */}
          <div style={{display:"flex",alignItems:"center",gap:10}}>

            {/* Status */}
            <div style={{
              display:"flex",alignItems:"center",gap:6,
              padding:"5px 12px",borderRadius:99,
              background:"rgba(34,197,94,0.06)",
              border:"1px solid rgba(34,197,94,0.15)"
            }}>
              <div style={{
                width:7,height:7,borderRadius:"50%",
                background:"#22c55e",
                animation:"pulse2 2s infinite"
              }}/>
              <span style={{fontSize:10,color:"rgba(34,197,94,0.8)",fontWeight:600,letterSpacing:".04em"}}>
                Actif
              </span>
            </div>

            {/* Lang */}
            <button className="lang-btn"
              onClick={()=>setLang(l=>l==="fr"?"en":"fr")}
              style={{
                border:"1px solid rgba(201,168,76,0.15)",
                borderRadius:8, padding:"7px 13px", cursor:"pointer",
                background:"transparent", fontSize:11, fontWeight:700,
                color:"rgba(201,168,76,0.5)",
                transition:"all .2s", letterSpacing:".06em"
              }}>
              {lang==="fr"?"EN":"FR"}
            </button>

            {/* Login */}
            <button className="login-btn"
              style={{
                border:"1px solid rgba(201,168,76,0.35)",
                borderRadius:10, padding:"8px 20px", cursor:"pointer",
                background:"rgba(201,168,76,0.06)",
                fontSize:13, fontWeight:700,
                color:"#c9a84c",
                fontFamily:"inherit",
                transition:"all .25s",
                letterSpacing:"-.01em",
                boxShadow:"0 0 0 0 rgba(201,168,76,0)"
              }}>
              Connexion
            </button>
          </div>
        </div>
      </header>
    </>
  )
}