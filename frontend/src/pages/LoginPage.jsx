import { useState, useEffect, useRef, useMemo } from "react"

const API = "http://127.0.0.1:8000"

// ── Bottle SVG (mini) ─────────────────────────────────────────────────────────
function Bottle({ fillPct = 0, color = "#f4c542" }) {
  const pct = Math.max(0, Math.min(100, fillPct))
  const surfaceY = 305 - (pct / 100) * 165
  const bubbles = useMemo(() => Array.from({ length: 6 }, () => ({
    cx: 75 + Math.random() * 50, r: 1.5 + Math.random() * 2,
    delay: Math.random() * 3, dur: 2 + Math.random() * 2,
  })), [])
  return (
    <svg viewBox="0 0 200 400" style={{ overflow:"visible", display:"block", width:"100%", height:"100%" }}>
      <defs>
        <linearGradient id="lq" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".95"/>
          <stop offset="100%" stopColor={color} stopOpacity=".7"/>
        </linearGradient>
        <clipPath id="bc"><path d="M70 75 L70 110 Q50 125,50 160 L50 340 Q50 365,75 365 L125 365 Q150 365,150 340 L150 160 Q150 125,130 110 L130 75 Z"/></clipPath>
        <filter id="bg"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <ellipse cx="100" cy="370" rx="70" ry="12" fill={color} opacity={0.2*(pct/100)} filter="url(#bg)"/>
      <rect x="78" y="30" width="44" height="22" rx="3" fill="#7a2d3a" stroke={color} strokeWidth="1"/>
      <rect x="78" y="52" width="44" height="25" rx="2" fill="rgba(244,197,66,0.05)" stroke="rgba(244,197,66,0.2)" strokeWidth=".8"/>
      <path d="M70 75 L70 110 Q50 125,50 160 L50 340 Q50 365,75 365 L125 365 Q150 365,150 340 L150 160 Q150 125,130 110 L130 75 Z"
        fill="rgba(244,197,66,0.04)" stroke="rgba(244,197,66,0.35)" strokeWidth="1.2"/>
      <g clipPath="url(#bc)">
        <rect x="40" y={surfaceY} width="120" height="250" fill="url(#lq)" style={{ transition:"y .8s ease" }}/>
        <path d={`M40 ${surfaceY} Q70 ${surfaceY-5},100 ${surfaceY} T160 ${surfaceY} L160 ${surfaceY+8} L40 ${surfaceY+8}Z`} fill={color} opacity=".5">
          <animate attributeName="d" dur="3s" repeatCount="indefinite"
            values={`M40 ${surfaceY} Q70 ${surfaceY-5},100 ${surfaceY} T160 ${surfaceY} L160 ${surfaceY+8} L40 ${surfaceY+8}Z;M40 ${surfaceY} Q70 ${surfaceY+5},100 ${surfaceY} T160 ${surfaceY} L160 ${surfaceY+8} L40 ${surfaceY+8}Z;M40 ${surfaceY} Q70 ${surfaceY-5},100 ${surfaceY} T160 ${surfaceY} L160 ${surfaceY+8} L40 ${surfaceY+8}Z`}/>
        </path>
        {pct > 5 && bubbles.map((b, i) => (
          <circle key={i} cx={b.cx} r={b.r} fill="white" opacity=".5">
            <animate attributeName="cy" values={`365;${surfaceY+5}`} dur={`${b.dur}s`} begin={`${b.delay}s`} repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0;.7;0" dur={`${b.dur}s`} begin={`${b.delay}s`} repeatCount="indefinite"/>
          </circle>
        ))}
      </g>
      <rect x="60" y="205" width="80" height="70" fill="rgba(10,6,18,.6)" stroke="rgba(244,197,66,.3)" strokeWidth=".8" rx="2"/>
      <text x="100" y="228" textAnchor="middle" fontFamily="DM Serif Display,serif" fontSize="12" fill={color}>STBG</text>
      <line x1="68" y1="234" x2="132" y2="234" stroke={color} strokeWidth=".5" opacity=".5"/>
      <text x="100" y="252" textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize="5.5" fill="#b8a98c" letterSpacing="2">RISK</text>
      <text x="100" y="268" textAnchor="middle" fontFamily="DM Serif Display,serif" fontSize="18" fill={color}>{Math.round(pct)}</text>
      <path d="M62 130 Q58 230,64 325" stroke="rgba(255,255,255,.12)" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>
  )
}

// ── Float label input ─────────────────────────────────────────────────────────
function Field({ label, type="text", value, onChange, icon, trailing, error }) {
  const [focused, setFocused] = useState(false)
  const filled = value.length > 0
  return (
    <div style={{ position:"relative", marginBottom: error ? 6 : 18 }}>
      <div style={{
        position:"relative",
        background: focused ? "rgba(244,197,66,0.05)" : "rgba(10,6,18,0.5)",
        border: `1px solid ${error ? "#7a2d3a" : focused ? "var(--gold)" : "rgba(244,197,66,0.15)"}`,
        borderRadius: 12, transition:"all .2s ease", overflow:"hidden"
      }}>
        {/* Icon */}
        <div style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"rgba(244,197,66,0.4)", width:16, height:16, pointerEvents:"none" }}>
          {icon}
        </div>
        {/* Float label */}
        <label style={{
          position:"absolute", left:42, pointerEvents:"none", transition:"all .18s ease",
          fontFamily:"var(--mono)", fontSize: (focused||filled) ? 8 : 13,
          top: (focused||filled) ? 8 : "50%",
          transform: (focused||filled) ? "none" : "translateY(-50%)",
          color: (focused||filled) ? "rgba(244,197,66,0.5)" : "rgba(244,197,66,0.3)",
          letterSpacing: (focused||filled) ? "2px" : "0",
          textTransform: (focused||filled) ? "uppercase" : "none",
        }}>{label}</label>
        {/* Input */}
        <input
          type={type} value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width:"100%", background:"transparent", border:"none", outline:"none",
            padding: (focused||filled) ? "22px 44px 8px 42px" : "15px 44px 15px 42px",
            fontFamily:"var(--sans)", fontSize:14, color:"var(--ink)",
            transition:"padding .18s ease",
          }}/>
        {trailing && <div style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)" }}>{trailing}</div>}
      </div>
      {error && <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"#a84050", marginTop:4, paddingLeft:4 }}>⚠ {error}</div>}
    </div>
  )
}

// ── Submit button ─────────────────────────────────────────────────────────────
function SubmitBtn({ loading, children }) {
  return (
    <button type="submit" disabled={loading} style={{
      width:"100%", padding:"14px 24px",
      background: loading ? "rgba(244,197,66,0.6)" : "var(--gold)",
      border:"none", borderRadius:12, cursor: loading ? "not-allowed" : "pointer",
      fontFamily:"var(--mono)", fontSize:12, fontWeight:700,
      color: loading ? "rgba(10,6,18,0.5)" : "var(--bg)",
      letterSpacing:"1.5px", textTransform:"uppercase",
      display:"flex", alignItems:"center", justifyContent:"center", gap:10,
      transition:"all .2s ease", marginTop:8,
    }}>
      {loading ? (
        <><div style={{ width:14, height:14, border:"2px solid rgba(10,6,18,0.3)", borderTop:"2px solid var(--bg)", borderRadius:"50%", animation:"lspin .8s linear infinite" }}/>{children}</>
      ) : (
        <>{children}<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8H13M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/></svg></>
      )}
    </button>
  )
}

// ── Eye toggle ────────────────────────────────────────────────────────────────
function EyeBtn({ show, toggle }) {
  return (
    <button type="button" onClick={toggle} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(244,197,66,0.4)", padding:4 }}>
      {show
        ? <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 2l16 16M9 5a8 8 0 018 5c-.6 1.5-1.7 2.8-3 3.8M5 7c-1.5 1.2-2.6 2.6-3 4 1.4 3.6 4.9 6 9 6 1.6 0 3-.4 4.3-1.1"/><circle cx="10" cy="10" r="2.5"/></svg>
        : <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 10s3-6 9-6 9 6 9 6-3 6-9 6-9-6-9-6z"/><circle cx="10" cy="10" r="2.5"/></svg>
      }
    </button>
  )
}

// ── Stat pill ─────────────────────────────────────────────────────────────────
function Stat({ val, label }) {
  return (
    <div style={{ textAlign:"center" }}>
      <div style={{ fontFamily:"var(--serif)", fontSize:26, color:"var(--gold)", lineHeight:1 }}>{val}</div>
      <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"rgba(244,197,66,0.4)", letterSpacing:"2px", marginTop:4, textTransform:"uppercase" }}>{label}</div>
    </div>
  )
}

// ── Progress steps ────────────────────────────────────────────────────────────
function Steps({ current, labels }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:0, marginBottom:28 }}>
      {labels.map((label, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", flex: i < labels.length-1 ? 1 : 0 }}>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <div style={{
              width:28, height:28, borderRadius:"50%",
              background: i < current ? "var(--gold)" : i === current ? "rgba(244,197,66,0.15)" : "rgba(244,197,66,0.05)",
              border: i === current ? "2px solid var(--gold)" : i < current ? "2px solid var(--gold)" : "1px solid rgba(244,197,66,0.2)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontFamily:"var(--mono)", fontSize:11,
              color: i < current ? "var(--bg)" : i === current ? "var(--gold)" : "rgba(244,197,66,0.3)",
              fontWeight:700, transition:"all .3s ease",
            }}>
              {i < current ? <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6L5 9 10 3" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/></svg> : i+1}
            </div>
            <div style={{ fontFamily:"var(--mono)", fontSize:8, color: i===current ? "rgba(244,197,66,0.6)" : "rgba(244,197,66,0.25)", letterSpacing:"1px", whiteSpace:"nowrap" }}>{label}</div>
          </div>
          {i < labels.length-1 && (
            <div style={{ flex:1, height:1, background: i < current ? "rgba(244,197,66,0.4)" : "rgba(244,197,66,0.1)", margin:"0 8px", marginBottom:18, transition:"background .3s ease" }}/>
          )}
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN LOGIN PAGE
// ═══════════════════════════════════════════════════════════════════
export default function LoginPage({ setPage, lang = "fr", onLogin }) {
  const [mode, setMode] = useState("signin") // signin | signup | forgot
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [globalErr, setGlobalErr] = useState("")

  // Signin
  const [siEmail,   setSiEmail]   = useState("")
  const [siPwd,     setSiPwd]     = useState("")
  const [siErr,     setSiErr]     = useState({})
  const [remember,  setRemember]  = useState(true)

  // Signup
  const [suName,    setSuName]    = useState("")
  const [suEmail,   setSuEmail]   = useState("")
  const [suPwd,     setSuPwd]     = useState("")
  const [suRole,    setSuRole]    = useState("Analyste")
  const [suErr,     setSuErr]     = useState({})

  // Forgot — 3 steps: 0=email, 1=code, 2=new password
  const [fgStep,    setFgStep]    = useState(0)
  const [fgEmail,   setFgEmail]   = useState("")
  const [fgCode,    setFgCode]    = useState("")
  const [fgPwd,     setFgPwd]     = useState("")
  const [fgErr,     setFgErr]     = useState("")
  const [fgDevCode, setFgDevCode] = useState("") // shown in dev

  const t = (fr, en) => lang === "en" ? en : fr

  // Bottle fill based on form completeness
  const fillPct = useMemo(() => {
    if (mode === "signin") {
      let f = 0
      if (siEmail) f += 50
      if (siPwd.length >= 6) f += 50
      return f
    }
    if (mode === "signup") {
      let f = 0
      if (suName) f += 25
      if (suEmail) f += 25
      if (suPwd.length >= 6) f += 35
      if (suRole) f += 15
      return f
    }
    if (mode === "forgot") {
      if (fgStep === 0) return fgEmail ? 33 : 0
      if (fgStep === 1) return fgCode.length === 6 ? 66 : 33
      return fgPwd.length >= 6 ? 100 : 66
    }
    return 0
  }, [mode, siEmail, siPwd, suName, suEmail, suPwd, suRole, fgStep, fgEmail, fgCode, fgPwd])

  const liquidColor = fillPct < 40 ? "#f4c542" : fillPct < 80 ? "#e8a93d" : "#5cb874"

  const resetAll = () => {
    setSiEmail(""); setSiPwd(""); setSiErr({}); setShowPwd(false)
    setSuName(""); setSuEmail(""); setSuPwd(""); setSuErr({})
    setFgStep(0); setFgEmail(""); setFgCode(""); setFgPwd(""); setFgErr(""); setFgDevCode("")
    setGlobalErr("")
  }

  const switchMode = m => { resetAll(); setMode(m) }

  // ── SUBMIT SIGNIN ──────────────────────────────────────────────
  const handleSignin = async e => {
    e.preventDefault()
    const err = {}
    if (!siEmail) err.email = t("Email requis","Email required")
    if (!siPwd)   err.pwd   = t("Mot de passe requis","Password required")
    if (Object.keys(err).length) { setSiErr(err); return }
    setLoading(true); setGlobalErr("")
    try {
      const res = await fetch(`${API}/auth/login`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ email:siEmail, password:siPwd })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || t("Erreur","Error"))
      if (remember) localStorage.setItem("stbg_token", data.token)
      sessionStorage.setItem("stbg_token", data.token)
      onLogin(data.user)
    } catch(err) {
      setGlobalErr(err.message)
    } finally { setLoading(false) }
  }

  // ── SUBMIT SIGNUP ──────────────────────────────────────────────
  const handleSignup = async e => {
    e.preventDefault()
    const err = {}
    if (!suName)         err.name  = t("Nom requis","Name required")
    if (!suEmail)        err.email = t("Email requis","Email required")
    if (suPwd.length<6)  err.pwd   = t("6 caractères minimum","6 characters minimum")
    if (Object.keys(err).length) { setSuErr(err); return }
    setLoading(true); setGlobalErr("")
    try {
      const res = await fetch(`${API}/auth/register`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ name:suName, email:suEmail, password:suPwd, role:suRole })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || t("Erreur","Error"))
      localStorage.setItem("stbg_token", data.token)
      sessionStorage.setItem("stbg_token", data.token)
      onLogin(data.user)
    } catch(err) {
      setGlobalErr(err.message)
    } finally { setLoading(false) }
  }

  // ── FORGOT STEP 0 — send code ──────────────────────────────────
  const handleFgEmail = async e => {
    e.preventDefault()
    if (!fgEmail) { setFgErr(t("Email requis","Email required")); return }
    setLoading(true); setFgErr("")
    try {
      const res = await fetch(`${API}/auth/forgot`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ email: fgEmail })
      })
      const data = await res.json()
      if (data.dev_code) setFgDevCode(data.dev_code) // show in dev
      setFgStep(1)
    } catch { setFgErr(t("Erreur serveur","Server error")) }
    finally { setLoading(false) }
  }

  // ── FORGOT STEP 1 — verify code ────────────────────────────────
  const handleFgCode = e => {
    e.preventDefault()
    const cleanCode = fgCode.replace(/\s/g,"")
    if (cleanCode.length !== 6) { setFgErr(t("Code à 6 chiffres requis","6-digit code required")); return }
    setFgErr(""); setFgStep(2)
  }

  // ── FORGOT STEP 2 — new password ───────────────────────────────
  const handleFgReset = async e => {
    e.preventDefault()
    if (fgPwd.length < 6) { setFgErr(t("6 caractères minimum","6 characters minimum")); return }
    setLoading(true); setFgErr("")
    try {
      const res = await fetch(`${API}/auth/reset`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ email:fgEmail, code:fgCode.replace(/\s/g,""), password:fgPwd })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || t("Erreur","Error"))
      setGlobalErr("")
      switchMode("signin")
      // Small success flash
      setGlobalErr("✓ " + t("Mot de passe mis à jour. Connectez-vous.","Password updated. Sign in."))
    } catch(err) { setFgErr(err.message) }
    finally { setLoading(false) }
  }

  // ── RENDER ─────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight:"100vh", display:"flex",
      position:"relative", overflow:"hidden",
    }}>
      <style>{`
        @keyframes lspin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .lg-panel{animation:fadeIn .35s ease}
        .lg-tab{padding:9px 18px;border-radius:8px 8px 0 0;border:none;cursor:pointer;font-family:var(--mono);font-size:11px;letter-spacing:1px;text-transform:uppercase;transition:all .2s ease;background:transparent;color:rgba(244,197,66,0.3)}
        .lg-tab.on{background:rgba(244,197,66,0.08);color:var(--gold);border-bottom:2px solid var(--gold)}
        .lg-tab:hover{color:var(--ink)}
        .lg-role-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:18px}
        .lg-role-opt{padding:10px 12px;border-radius:10px;border:1px solid rgba(244,197,66,0.12);background:rgba(10,6,18,0.4);cursor:pointer;font-family:var(--mono);font-size:10px;letter-spacing:1px;color:rgba(244,197,66,0.4);text-align:center;transition:all .2s ease}
        .lg-role-opt.on{border-color:var(--gold);background:rgba(244,197,66,0.08);color:var(--gold)}
        .lg-check{display:flex;align-items:center;gap:8px;cursor:pointer}
        .lg-check-box{width:18px;height:18px;border-radius:5px;border:1px solid rgba(244,197,66,0.25);background:rgba(10,6,18,0.4);display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0}
        .lg-check.on .lg-check-box{background:var(--gold);border-color:var(--gold)}
        .lg-check-box svg{display:none}.lg-check.on .lg-check-box svg{display:block}
        .code-inputs{display:flex;gap:8px;justify-content:center;margin:20px 0}
        .code-input{width:44px;height:52px;border-radius:10px;border:1px solid rgba(244,197,66,0.2);background:rgba(10,6,18,0.5);color:var(--ink);text-align:center;font-family:var(--mono);font-size:22px;outline:none;transition:border-color .2s}
        .code-input:focus{border-color:var(--gold)}
      `}</style>

      {/* ── LEFT — Brand panel ── */}
      <div style={{
        width:"42%", minHeight:"100vh",
        background:"linear-gradient(160deg,rgba(18,10,31,0.98),rgba(10,6,18,0.99))",
        borderRight:"1px solid rgba(244,197,66,0.08)",
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"space-between",
        padding:"48px 40px", position:"relative", overflow:"hidden",
        flexShrink:0,
      }}>
        {/* Background glow */}
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 600px 400px at 50% 60%,rgba(122,45,58,0.15),transparent 60%)", pointerEvents:"none" }}/>

        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:12, alignSelf:"flex-start", position:"relative" }}>
          <div style={{ width:36, height:36, borderRadius:6, overflow:"hidden" }}>
            <img src="/logo.png" alt="STBG" style={{ width:"100%", height:"100%", objectFit:"contain" }}/>
          </div>
          <div>
            <div style={{ fontFamily:"var(--serif)", fontSize:16, color:"var(--ink)" }}>STBG <span style={{ color:"var(--gold)" }}>Risk</span></div>
            <div style={{ fontFamily:"var(--mono)", fontSize:8, color:"var(--ink-mute)", letterSpacing:"2px" }}>INTELLIGENCE PLATFORM</div>
          </div>
        </div>

        {/* Bottle */}
        <div style={{ width:180, height:360, position:"relative", flex:"0 0 auto" }}>
          {/* Rings */}
          {[200,260,320].map((s,i) => (
            <div key={i} style={{
              position:"absolute", top:"50%", left:"50%",
              width:s, height:s, marginLeft:-s/2, marginTop:-s/2,
              borderRadius:"50%", border:"1px solid rgba(244,197,66,0.06)",
              animation:`pulse ${3+i}s ease-in-out infinite`, animationDelay:`${i*.8}s`
            }}/>
          ))}
          <Bottle fillPct={fillPct} color={liquidColor}/>
        </div>

        {/* Quote */}
        <div style={{ position:"relative", textAlign:"center" }}>
          <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"rgba(244,197,66,0.4)", letterSpacing:"2.5px", textTransform:"uppercase", marginBottom:12 }}>
            {t("Plateforme de scoring","Scoring platform")}
          </div>
          <h2 style={{ fontFamily:"var(--serif)", fontSize:22, color:"var(--ink)", fontWeight:400, lineHeight:1.3, margin:"0 0 28px" }}>
            {t("Évaluer le risque, ","Evaluating risk, ")}<em style={{ color:"var(--gold)", fontStyle:"italic" }}>{t("avec précision.","with precision.")}</em>
          </h2>
          <div style={{ display:"flex", justifyContent:"center", gap:32 }}>
            <Stat val="50k+"   label={t("Profils","Profiles")}/>
            <Stat val="0.97"   label="AUC"/>
            <Stat val="1.4s"   label={t("Score","Score")}/>
          </div>
        </div>
      </div>

      {/* ── RIGHT — Form panel ── */}
      <div style={{
        flex:1, display:"flex", alignItems:"center", justifyContent:"center",
        padding:"40px", minHeight:"100vh",
        background:"rgba(10,6,18,0.97)",
      }}>
        <div style={{ width:"100%", maxWidth:420 }}>

          {/* Back to home */}
          <button onClick={() => setPage("home")} style={{
            display:"flex", alignItems:"center", gap:6, marginBottom:36,
            fontFamily:"var(--mono)", fontSize:10, color:"rgba(244,197,66,0.4)",
            background:"none", border:"none", cursor:"pointer", letterSpacing:"1.5px",
            transition:"color .2s",
          }}
            onMouseEnter={e => e.currentTarget.style.color="var(--gold)"}
            onMouseLeave={e => e.currentTarget.style.color="rgba(244,197,66,0.4)"}
          >
            <svg width="12" height="12" viewBox="0 0 12 12"><path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
            {t("Retour à l'accueil","Back to home")}
          </button>

          {/* Global error / success */}
          {globalErr && (
            <div style={{
              marginBottom:16, padding:"10px 14px",
              background: globalErr.startsWith("✓") ? "rgba(92,184,116,0.1)" : "rgba(122,45,58,0.12)",
              border: `1px solid ${globalErr.startsWith("✓") ? "rgba(92,184,116,0.25)" : "rgba(122,45,58,0.35)"}`,
              borderRadius:10, fontFamily:"var(--mono)", fontSize:11,
              color: globalErr.startsWith("✓") ? "#5cb874" : "#a84050",
            }}>{globalErr}</div>
          )}

          {/* ── SIGNIN ── */}
          {mode === "signin" && (
            <div className="lg-panel">
              <div style={{ marginBottom:28 }}>
                <h1 style={{ fontFamily:"var(--serif)", fontSize:36, color:"var(--ink)", fontWeight:400, marginBottom:6 }}>
                  {t("Bon retour","Welcome back")} <em style={{ color:"var(--gold)", fontStyle:"italic" }}>.</em>
                </h1>
                <p style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--ink-mute)", letterSpacing:"1px" }}>
                  {t("Connectez-vous à votre espace analyste","Sign in to your analyst workspace")}
                </p>
              </div>

              <div style={{ display:"flex", gap:4, marginBottom:28, borderBottom:"1px solid rgba(244,197,66,0.08)", paddingBottom:0 }}>
                <button className={`lg-tab on`}>{t("Connexion","Sign in")}</button>
                <button className="lg-tab" onClick={() => switchMode("signup")}>{t("Créer un compte","Sign up")}</button>
              </div>

              <form onSubmit={handleSignin}>
                <Field label={t("Adresse email","Email address")} type="email"
                  value={siEmail} onChange={setSiEmail} error={siErr.email}
                  icon={<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="16" height="12" rx="2"/><path d="M3 6l7 5 7-5"/></svg>}/>
                <Field label={t("Mot de passe","Password")} type={showPwd?"text":"password"}
                  value={siPwd} onChange={setSiPwd} error={siErr.pwd}
                  icon={<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="9" width="12" height="9" rx="2"/><path d="M7 9V6a3 3 0 016 0v3"/></svg>}
                  trailing={<EyeBtn show={showPwd} toggle={() => setShowPwd(!showPwd)}/>}/>

                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                  <div className={`lg-check ${remember?"on":""}`} onClick={() => setRemember(!remember)}>
                    <div className="lg-check-box"><svg width="10" height="10" viewBox="0 0 12 12"><path d="M2 6L5 9 10 3" stroke="var(--bg)" strokeWidth="2" fill="none" strokeLinecap="round"/></svg></div>
                    <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--ink-mute)" }}>{t("Rester connecté","Keep me signed in")}</span>
                  </div>
                  <button type="button" onClick={() => switchMode("forgot")} style={{ fontFamily:"var(--mono)", fontSize:10, color:"rgba(244,197,66,0.45)", background:"none", border:"none", cursor:"pointer", textDecoration:"underline" }}>
                    {t("Mot de passe oublié ?","Forgot password?")}
                  </button>
                </div>

                <SubmitBtn loading={loading}>{t("Se connecter","Sign in")}</SubmitBtn>
              </form>

              <div style={{ textAlign:"center", marginTop:20, fontFamily:"var(--mono)", fontSize:10, color:"var(--ink-mute)" }}>
                {t("Pas encore de compte ?","No account yet?")}{" "}
                <button onClick={() => switchMode("signup")} style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--gold)", background:"none", border:"none", cursor:"pointer", textDecoration:"underline" }}>
                  {t("S'inscrire","Sign up")}
                </button>
              </div>
            </div>
          )}

          {/* ── SIGNUP ── */}
          {mode === "signup" && (
            <div className="lg-panel">
              <div style={{ marginBottom:28 }}>
                <h1 style={{ fontFamily:"var(--serif)", fontSize:36, color:"var(--ink)", fontWeight:400, marginBottom:6 }}>
                  {t("Créer un ","Create an ")}<em style={{ color:"var(--gold)", fontStyle:"italic" }}>{t("accès","account")}</em>
                </h1>
                <p style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--ink-mute)", letterSpacing:"1px" }}>
                  {t("Rejoindre la plateforme STBG Risk","Join the STBG Risk platform")}
                </p>
              </div>

              <div style={{ display:"flex", gap:4, marginBottom:28, borderBottom:"1px solid rgba(244,197,66,0.08)" }}>
                <button className="lg-tab" onClick={() => switchMode("signin")}>{t("Connexion","Sign in")}</button>
                <button className="lg-tab on">{t("Créer un compte","Sign up")}</button>
              </div>

              <form onSubmit={handleSignup}>
                <Field label={t("Nom complet","Full name")}
                  value={suName} onChange={setSuName} error={suErr.name}
                  icon={<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10" cy="7" r="3"/><path d="M3 17c0-3.6 3-7 7-7s7 3.4 7 7"/></svg>}/>
                <Field label={t("Adresse email","Email address")} type="email"
                  value={suEmail} onChange={setSuEmail} error={suErr.email}
                  icon={<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="16" height="12" rx="2"/><path d="M3 6l7 5 7-5"/></svg>}/>
                <Field label={t("Mot de passe (min. 6 car.)","Password (min. 6 char.)")} type={showPwd?"text":"password"}
                  value={suPwd} onChange={setSuPwd} error={suErr.pwd}
                  icon={<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="9" width="12" height="9" rx="2"/><path d="M7 9V6a3 3 0 016 0v3"/></svg>}
                  trailing={<EyeBtn show={showPwd} toggle={() => setShowPwd(!showPwd)}/>}/>

                {/* Role picker */}
                <div style={{ marginBottom:18 }}>
                  <div style={{ fontFamily:"var(--mono)", fontSize:8, color:"rgba(244,197,66,0.4)", letterSpacing:"2px", textTransform:"uppercase", marginBottom:10 }}>{t("Rôle","Role")}</div>
                  <div className="lg-role-grid">
                    {[t("Analyste","Analyst"), t("Responsable","Manager"), t("Auditeur","Auditor"), t("Administrateur","Admin")].map(r => (
                      <button key={r} type="button" className={`lg-role-opt ${suRole===r?"on":""}`} onClick={() => setSuRole(r)}>{r}</button>
                    ))}
                  </div>
                </div>

                <SubmitBtn loading={loading}>{t("Créer le compte","Create account")}</SubmitBtn>
              </form>

              <div style={{ textAlign:"center", marginTop:20, fontFamily:"var(--mono)", fontSize:10, color:"var(--ink-mute)" }}>
                {t("Déjà un compte ?","Already have an account?")}{" "}
                <button onClick={() => switchMode("signin")} style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--gold)", background:"none", border:"none", cursor:"pointer", textDecoration:"underline" }}>
                  {t("Se connecter","Sign in")}
                </button>
              </div>
            </div>
          )}

          {/* ── FORGOT PASSWORD — 3 steps ── */}
          {mode === "forgot" && (
            <div className="lg-panel">
              <div style={{ marginBottom:28 }}>
                <h1 style={{ fontFamily:"var(--serif)", fontSize:32, color:"var(--ink)", fontWeight:400, marginBottom:6 }}>
                  {t("Réinitialiser le ","Reset your ")}<em style={{ color:"var(--gold)", fontStyle:"italic" }}>{t("mot de passe","password")}</em>
                </h1>
                <p style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--ink-mute)", letterSpacing:"1px" }}>
                  {[
                    t("Entrez votre email pour recevoir un code","Enter your email to receive a code"),
                    t("Entrez le code à 6 chiffres reçu","Enter the 6-digit code received"),
                    t("Choisissez votre nouveau mot de passe","Choose your new password"),
                  ][fgStep]}
                </p>
              </div>

              <Steps current={fgStep} labels={[t("Email","Email"), t("Code","Code"), t("Mot de passe","Password")]}/>

              {fgErr && (
                <div style={{ marginBottom:14, padding:"8px 12px", background:"rgba(122,45,58,0.1)", border:"1px solid rgba(122,45,58,0.3)", borderRadius:8, fontFamily:"var(--mono)", fontSize:11, color:"#a84050" }}>⚠ {fgErr}</div>
              )}

              {/* Step 0: Email */}
              {fgStep === 0 && (
                <form onSubmit={handleFgEmail}>
                  <Field label={t("Votre adresse email","Your email address")} type="email"
                    value={fgEmail} onChange={setFgEmail}
                    icon={<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="16" height="12" rx="2"/><path d="M3 6l7 5 7-5"/></svg>}/>
                  <SubmitBtn loading={loading}>{t("Envoyer le code","Send code")}</SubmitBtn>
                </form>
              )}

              {/* Step 1: Code */}
              {fgStep === 1 && (
                <form onSubmit={handleFgCode}>
                  <div style={{ textAlign:"center", marginBottom:8, fontFamily:"var(--mono)", fontSize:11, color:"var(--ink-mute)" }}>
      <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ display:"block", margin:"0 auto 8px", color:"var(--gold)" }}><rect x="2" y="4" width="16" height="12" rx="2"/><path d="M3 6l7 5 7-5"/></svg>
                    {t("Code envoyé à","Code sent to")} <strong style={{ color:"var(--gold)" }}>{fgEmail}</strong>
                  </div>
                  {fgDevCode && (
                    <div style={{ textAlign:"center", marginBottom:16, padding:"20px", background:"linear-gradient(160deg,rgba(44,30,66,0.8),rgba(18,10,31,0.9))", border:"1px solid rgba(244,197,66,0.3)", borderRadius:14, boxShadow:"0 0 30px rgba(244,197,66,0.1)" }}>
                      <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"rgba(244,197,66,0.4)", letterSpacing:"2.5px", marginBottom:10, textTransform:"uppercase" }}>Votre code de réinitialisation</div>
                      <div style={{ fontFamily:"var(--serif)", fontSize:42, letterSpacing:"12px", color:"var(--gold)", lineHeight:1, marginBottom:10 }}>{fgDevCode}</div>
                      <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"rgba(244,197,66,0.3)", letterSpacing:"1px" }}>Valable 15 minutes · Copiez ce code ci-dessous</div>
                    </div>
                  )}
                  <CodeInput value={fgCode} onChange={setFgCode}/>
                  <SubmitBtn loading={loading}>{t("Vérifier le code","Verify code")}</SubmitBtn>
                  <button type="button" onClick={() => { setFgStep(0); setFgCode(""); setFgErr("") }}
                    style={{ width:"100%", marginTop:10, padding:"10px", background:"none", border:"1px solid rgba(244,197,66,0.12)", borderRadius:10, fontFamily:"var(--mono)", fontSize:10, color:"rgba(244,197,66,0.4)", cursor:"pointer" }}>
                    {t("Renvoyer le code","Resend code")}
                  </button>
                </form>
              )}

              {/* Step 2: New password */}
              {fgStep === 2 && (
                <form onSubmit={handleFgReset}>
                  <Field label={t("Nouveau mot de passe","New password")} type={showPwd?"text":"password"}
                    value={fgPwd} onChange={setFgPwd}
                    icon={<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="9" width="12" height="9" rx="2"/><path d="M7 9V6a3 3 0 016 0v3"/></svg>}
                    trailing={<EyeBtn show={showPwd} toggle={() => setShowPwd(!showPwd)}/>}/>

                  {/* Password strength */}
                  <div style={{ display:"flex", gap:4, marginBottom:18 }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ flex:1, height:3, borderRadius:99, background: fgPwd.length >= i*3 ? (i<=2?"#e8a93d":i===3?"#5cb874":"#5cb874") : "rgba(244,197,66,0.08)", transition:"background .3s ease" }}/>
                    ))}
                  </div>

                  <SubmitBtn loading={loading}>{t("Mettre à jour","Update password")}</SubmitBtn>
                </form>
              )}

              <button onClick={() => switchMode("signin")} style={{ display:"flex", alignItems:"center", gap:6, marginTop:20, fontFamily:"var(--mono)", fontSize:10, color:"rgba(244,197,66,0.35)", background:"none", border:"none", cursor:"pointer" }}>
                <svg width="10" height="10" viewBox="0 0 12 12"><path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
                {t("Retour à la connexion","Back to sign in")}
              </button>
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop:32, display:"flex", justifyContent:"space-between", fontFamily:"var(--mono)", fontSize:9, color:"rgba(244,197,66,0.2)", letterSpacing:"1px" }}>
            <span>STBG · BCT COMPLIANT · 2026</span>
            <div style={{ display:"flex", gap:8 }}>
              <span style={{ cursor:"pointer", color: lang==="fr" ? "rgba(244,197,66,0.5)" : undefined }}>FR</span>
              <span>·</span>
              <span style={{ cursor:"pointer", color: lang==="en" ? "rgba(244,197,66,0.5)" : undefined }}>EN</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 6-digit code input ────────────────────────────────────────────────────────
function CodeInput({ value, onChange }) {
  const inputs = useRef([])
  const digits = value.split("").concat(Array(6).fill("")).slice(0,6)

  const handleKey = (i, e) => {
    const val = e.target.value.replace(/\D/,"")
    const next = digits.map((d,j) => j===i ? val.slice(-1) : d).join("")
    onChange(next)
    if (val && i < 5) inputs.current[i+1]?.focus()
    if (e.key === "Backspace" && !digits[i] && i > 0) inputs.current[i-1]?.focus()
  }

  const handlePaste = e => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g,"").slice(0,6)
    onChange(pasted.padEnd(6,"").slice(0,6))
    inputs.current[Math.min(pasted.length, 5)]?.focus()
  }

  return (
    <div style={{ display:"flex", gap:8, justifyContent:"center", margin:"16px 0 24px" }}>
      {digits.map((d,i) => (
        <input key={i} ref={el => inputs.current[i]=el}
          className="code-input"
          maxLength={1} value={d}
          onChange={e => handleKey(i, e)}
          onKeyDown={e => { if(e.key==="Backspace" && !d && i>0) { inputs.current[i-1]?.focus(); e.preventDefault() }}}
          onPaste={handlePaste}
          onFocus={e => e.target.select()}
          inputMode="numeric"
        />
      ))}
    </div>
  )
}