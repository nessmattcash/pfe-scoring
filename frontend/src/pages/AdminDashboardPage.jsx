import { useState, useEffect, useMemo, useCallback } from "react"

const API = "http://127.0.0.1:8000"

// ── Bubbles (shared visual motif with other pages) ─────────────────────────────
function Bubbles() {
  const b = useMemo(() => Array.from({ length: 12 }, () => ({
    left: Math.random()*100, size: 4+Math.random()*11,
    dur: 9+Math.random()*10, delay: -Math.random()*12,
  })), [])
  return (
    <div className="bubble-field">
      {b.map((x,i) => <div key={i} className="bubble" style={{ left:`${x.left}%`, width:x.size, height:x.size, animationDuration:`${x.dur}s`, animationDelay:`${x.delay}s` }}/>)}
    </div>
  )
}

// ── Reveal-on-mount (mirrors DashboardPage's .db pattern) ──────────────────────
function useReveal(key) {
  useEffect(() => {
    document.querySelectorAll(".db").forEach(el => { el.classList.add("db-anim"); el.classList.remove("db-in") })
    let id1, id2, t
    id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => {
        t = setTimeout(() => document.querySelectorAll(".db").forEach(el => el.classList.add("db-in")), 20)
      })
    })
    return () => { cancelAnimationFrame(id1); cancelAnimationFrame(id2); clearTimeout(t) }
  }, [key])
}

// ── Shared primitives (same visual language as Card / Sec / KPI elsewhere) ─────
function Card({ children, style={} }) {
  return (
    <div style={{
      background:"linear-gradient(160deg,rgba(44,30,66,0.78),rgba(32,20,52,0.84))",
      border:"1px solid rgba(244,197,66,0.14)", borderRadius:14,
      padding:"22px 26px", boxShadow:"0 6px 32px rgba(0,0,0,0.25)", ...style
    }}>{children}</div>
  )
}

function Sec({ children, label, num }) {
  return (
    <div className="db" style={{ marginBottom:28 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
        <span style={{ fontFamily:"var(--mono)", fontSize:8, color:"rgba(244,197,66,0.28)", letterSpacing:"2px" }}>{num}</span>
        <div style={{ height:1, width:18, background:"rgba(244,197,66,0.2)" }}/>
        <span style={{ fontFamily:"var(--mono)", fontSize:9, color:"rgba(244,197,66,0.45)", letterSpacing:"2px", textTransform:"uppercase" }}>{label}</span>
        <div style={{ flex:1, height:1, background:"linear-gradient(90deg,rgba(244,197,66,0.14),transparent)" }}/>
      </div>
      {children}
    </div>
  )
}

const SVG_ICONS = {
  users:  <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="6" r="3"/><path d="M2 17c0-3 2.5-5 5-5s5 2 5 5" strokeLinecap="round"/><circle cx="15" cy="7" r="2.3"/><path d="M13 12c2 0 4 1.6 4.5 4" strokeLinecap="round"/></svg>,
  shield: <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 2l7 3v5c0 4.5-3 7.5-7 8-4-.5-7-3.5-7-8V5l7-3z" strokeLinejoin="round"/><path d="M7 10l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  pulse:  <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 10h4l2-6 4 12 2-6h4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  layers: <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 2l8 4-8 4-8-4 8-4z" strokeLinejoin="round"/><path d="M2 10l8 4 8-4M2 14l8 4 8-4" strokeLinejoin="round"/></svg>,
}

function KPI({ label, value, sub, color, iconKey }) {
  return (
    <div style={{
      padding:"20px 22px",
      background:"linear-gradient(160deg,rgba(44,30,66,0.82),rgba(32,20,52,0.86))",
      border:`1px solid rgba(244,197,66,0.14)`,
      borderLeft:`3px solid ${color}`,
      borderRadius:14, position:"relative", overflow:"hidden",
      transition:"transform .2s ease, box-shadow .2s ease"
    }}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 12px 40px rgba(0,0,0,0.3),0 0 0 1px ${color}22`}}
      onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none"}}
    >
      <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse 70% 70% at 100% 0%,${color}0e,transparent)`, pointerEvents:"none" }}/>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
        <div style={{ fontFamily:"var(--mono)", fontSize:8, letterSpacing:"2.5px", textTransform:"uppercase", color:"rgba(244,197,66,0.4)" }}>{label}</div>
        <span style={{ color:`${color}90` }}>{SVG_ICONS[iconKey]}</span>
      </div>
      <div style={{ fontFamily:"var(--serif)", fontSize:34, color, lineHeight:1, marginBottom:8 }}>{value}</div>
      <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"rgba(244,197,66,0.38)" }}>{sub}</div>
    </div>
  )
}

// ── Role badge ───────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const map = {
    "Administrateur": { c:"#e06868", bg:"rgba(224,104,104,0.16)", br:"rgba(224,104,104,0.42)" },
    "Analyste":       { c:"#e0c268", bg:"rgba(224,194,104,0.14)", br:"rgba(224,194,104,0.4)" },
  }
  const s = map[role] || map.Analyste
  return (
    <span style={{ display:"inline-block", padding:"3px 11px", borderRadius:99, background:s.bg, color:s.c, fontFamily:"var(--mono)", fontSize:10, fontWeight:700, letterSpacing:"1px", border:`1px solid ${s.br}`, textTransform:"uppercase" }}>
      {role}
    </span>
  )
}

// ── Users table ──────────────────────────────────────────────────────────────
function UsersTable({ users }) {
  const [q, setQ] = useState("")
  const filtered = useMemo(() => {
    if (!q.trim()) return users
    const s = q.toLowerCase()
    return users.filter(u => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s))
  }, [users, q])

  return (
    <Card style={{ padding:0, overflow:"hidden" }}>
      <div style={{ padding:"18px 22px", borderBottom:"1px solid rgba(244,197,66,0.1)", display:"flex", justifyContent:"space-between", alignItems:"center", gap:16 }}>
        <div style={{ fontFamily:"var(--serif)", fontSize:17, color:"var(--ink-dim)" }}>Utilisateurs enregistrés</div>
        <input
          value={q} onChange={e=>setQ(e.target.value)}
          placeholder="Rechercher un nom ou un email…"
          style={{
            background:"rgba(10,6,18,0.5)", border:"1px solid rgba(244,197,66,0.15)", borderRadius:8,
            padding:"7px 12px", fontFamily:"var(--mono)", fontSize:11, color:"var(--ink)", outline:"none", minWidth:220
          }}
        />
      </div>
      <div className="stbg-scroll" style={{ maxHeight:420, overflowY:"auto" }}>
        <table className="stbg-table">
          <thead>
            <tr>
              {["#","Nom","Email","Rôle","Créé le"].map(h => (
                <th key={h} style={{ position:"sticky", top:0 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td className="muted">{u.id}</td>
                <td style={{ fontWeight:600 }}>{u.name}</td>
                <td className="mono">{u.email}</td>
                <td><RoleBadge role={u.role}/></td>
                <td className="muted">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString("fr-TN") : "—"}
                </td>
              </tr>
            ))}
            {filtered.length===0 && (
              <tr><td colSpan={5} style={{ padding:"28px 22px", textAlign:"center", fontFamily:"var(--mono)", fontSize:11, color:"rgba(244,197,66,0.3)" }}>Aucun utilisateur trouvé.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

// ── Access denied screen ────────────────────────────────────────────────────
function AccessDenied({ lang, setPage }) {
  const t = (fr,en) => lang==="en" ? en : fr
  return (
    <section style={{ padding:"140px 40px", maxWidth:600, margin:"0 auto", textAlign:"center" }}>
      <div style={{ width:56, height:56, margin:"0 auto 20px", borderRadius:14, background:"rgba(122,45,58,0.12)", border:"1px solid rgba(122,45,58,0.3)", display:"flex", alignItems:"center", justifyContent:"center", color:"#a84050" }}>
        <svg viewBox="0 0 20 20" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 2l7 3v5c0 4.5-3 7.5-7 8-4-.5-7-3.5-7-8V5l7-3z" strokeLinejoin="round"/><path d="M7.5 7.5l5 5M12.5 7.5l-5 5" strokeLinecap="round"/></svg>
      </div>
      <h1 style={{ fontFamily:"var(--serif)", fontSize:28, color:"var(--ink)", marginBottom:10 }}>{t("Accès réservé","Restricted access")}</h1>
      <p style={{ fontFamily:"var(--mono)", fontSize:12, color:"var(--ink-mute)", marginBottom:24 }}>
        {t("Cette section est réservée aux comptes administrateur.","This section is reserved for administrator accounts.")}
      </p>
      <button onClick={()=>setPage("home")} style={{
        padding:"11px 22px", borderRadius:10, border:"1px solid rgba(244,197,66,0.25)",
        background:"rgba(244,197,66,0.06)", color:"var(--gold)",
        fontFamily:"var(--mono)", fontSize:11, letterSpacing:"1px", textTransform:"uppercase", cursor:"pointer"
      }}>{t("Retour à l'accueil","Back to home")}</button>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════
export default function AdminDashboardPage({ user, lang="fr", setPage }) {
  const [users,      setUsers]      = useState(null)
  const [usersErr,   setUsersErr]   = useState(null)
  const [portfolio,  setPortfolio]  = useState(null)
  const [health,     setHealth]     = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [tabKey,     setTabKey]     = useState(0)

  useReveal(tabKey)

  const loadAll = useCallback(async () => {
    setLoading(true)
    const token = localStorage.getItem("stbg_token") || sessionStorage.getItem("stbg_token")

    // Registered users (admin-only endpoint)
    try {
      const res = await fetch(`${API}/auth/users`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      const data = await res.json()
      if (res.ok) { setUsers(data.users); setUsersErr(null) }
      else setUsersErr(data.detail || "Erreur")
    } catch { setUsersErr("Serveur injoignable") }

    // Portfolio snapshot from the most recent batch scoring run
    try {
      const res = await fetch(`${API}/results`)
      if (res.ok) { const data = await res.json(); setPortfolio(data.predictions?.length ? data : null) }
    } catch {}

    // Platform health
    try {
      const res = await fetch(`${API}/health`)
      if (res.ok) setHealth(await res.json())
    } catch { setHealth(null) }

    setLoading(false)
    setTabKey(k => k+1)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const portfolioStats = useMemo(() => {
    if (!portfolio) return null
    const p = portfolio.predictions
    const avg = p.reduce((s,r)=>s+(Number(r.score)||0),0)/p.length
    const eleve = p.filter(r=>r.niveau==="ÉLEVÉ").length
    const encours = p.reduce((s,r)=>s+(Number(r.montant_encours_tnd)||0),0)
    return { total:p.length, avg, eleve, encours, tauxRisque: Math.round(eleve/p.length*100) }
  }, [portfolio])

  const roleCounts = useMemo(() => {
    if (!users) return null
    const admins = users.filter(u=>u.role==="Administrateur").length
    return { admins, analystes: users.length - admins }
  }, [users])

  if (user?.role !== "Administrateur") {
    return <AccessDenied lang={lang} setPage={setPage}/>
  }

  return (
    <>
      <Bubbles/>
      <style>{`
        .db{opacity:1;transform:translate3d(0,0,0)}
        .db.db-anim{opacity:0;transform:translate3d(0,16px,0)}
        .db.db-anim.db-in{opacity:1;transform:translate3d(0,0,0);transition:opacity .5s cubic-bezier(0.16,1,0.3,1),transform .5s cubic-bezier(0.16,1,0.3,1)}
        .stbg-scroll::-webkit-scrollbar{width:4px;height:4px}
        .stbg-scroll::-webkit-scrollbar-track{background:transparent}
        .stbg-scroll::-webkit-scrollbar-thumb{background:rgba(201,168,76,0.2);border-radius:99px}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes admspin{to{transform:rotate(360deg)}}
      `}</style>

      <section style={{ padding:"100px 40px 100px", maxWidth:1280, margin:"0 auto" }}>

        {/* Header */}
        <div className="db" style={{ marginBottom:36 }}>
          <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", flexWrap:"wrap", gap:18 }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                <span style={{ fontFamily:"var(--mono)", fontSize:9, color:"rgba(244,197,66,0.38)", letterSpacing:"3px" }}>ADMIN</span>
                <div style={{ height:1, width:22, background:"rgba(244,197,66,0.2)" }}/>
                <span style={{ fontFamily:"var(--mono)", fontSize:9, color:"rgba(244,197,66,0.42)", letterSpacing:"2.5px", textTransform:"uppercase" }}>
                  {lang==="fr" ? "Console d'administration" : "Administration console"}
                </span>
              </div>
              <h1 style={{ fontFamily:"var(--serif)", fontSize:"clamp(28px,4vw,52px)", fontWeight:400, letterSpacing:"-.03em", lineHeight:1.05, margin:0, color:"var(--ink)" }}>
                {lang==="fr" ? "Pilotage de la " : "Managing the "}<span style={{ color:"var(--gold)", fontStyle:"italic" }}>plateforme</span>
              </h1>
            </div>
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              <div style={{ display:"flex", alignItems:"center", gap:7, padding:"7px 13px", background: health ? "rgba(92,184,116,0.06)" : "rgba(122,45,58,0.08)", border:`1px solid ${health ? "rgba(92,184,116,0.18)" : "rgba(122,45,58,0.3)"}`, borderRadius:10 }}>
                <div style={{ width:6,height:6,borderRadius:"50%",background: health ? "#5cb874" : "#a84050", boxShadow:`0 0 8px ${health ? "#5cb874" : "#a84050"}`,animation:"pulse 2s infinite" }}/>
                <span style={{ fontFamily:"var(--mono)", fontSize:9, color: health ? "#5cb874" : "#a84050", letterSpacing:"1.5px" }}>
                  {health ? "API EN LIGNE" : "API HORS LIGNE"}
                </span>
              </div>
              <button onClick={loadAll} disabled={loading} style={{
                padding:"7px 14px",borderRadius:10,border:"1px solid rgba(244,197,66,0.14)",
                background:"rgba(244,197,66,0.04)",color:"rgba(244,197,66,0.55)",
                fontFamily:"var(--mono)",fontSize:9,letterSpacing:"1px",cursor: loading ? "default" : "pointer",transition:"all .2s",
                display:"flex", alignItems:"center", gap:6
              }}>
                {loading && <div style={{ width:10, height:10, border:"1.5px solid rgba(244,197,66,0.3)", borderTop:"1.5px solid var(--gold)", borderRadius:"50%", animation:"admspin .7s linear infinite" }}/>}
                ↻ {lang==="fr" ? "Actualiser" : "Refresh"}
              </button>
            </div>
          </div>
        </div>

        {/* KPI row */}
        <Sec label={lang==="fr" ? "Vue d'ensemble" : "Overview"} num="01">
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
            <KPI label={lang==="fr"?"Comptes actifs":"Active accounts"} iconKey="users" color="#c9a84c"
              value={users ? users.length : "—"} sub={lang==="fr"?"utilisateurs enregistrés":"registered users"}/>
            <KPI label="Administrateurs" iconKey="shield" color="#7a2d3a"
              value={roleCounts ? roleCounts.admins : "—"} sub={lang==="fr"?"accès complet":"full access"}/>
            <KPI label={lang==="fr"?"Analystes":"Analysts"} iconKey="layers" color="#a06028"
              value={roleCounts ? roleCounts.analystes : "—"} sub={lang==="fr"?"accès scoring":"scoring access"}/>
            <KPI label={lang==="fr"?"Version modèle":"Model version"} iconKey="pulse" color="var(--gold)"
              value={health?.model ? "XGBoost" : "—"} sub={health?.status==="ok" ? (lang==="fr"?"opérationnel":"operational") : (lang==="fr"?"indisponible":"unavailable")}/>
          </div>
        </Sec>

        {/* Portfolio snapshot, if a batch run exists */}
        {portfolioStats && (
          <Sec label={lang==="fr" ? "Dernier lot scoré" : "Latest scored batch"} num="02">
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
              <KPI label={lang==="fr"?"Clients scorés":"Clients scored"} iconKey="layers" color="#c9a84c"
                value={portfolioStats.total} sub={lang==="fr"?"dernière analyse en masse":"latest batch run"}/>
              <KPI label={lang==="fr"?"Score moyen":"Average score"} iconKey="pulse" color="#a06028"
                value={portfolioStats.avg.toFixed(1)} sub="/ 100"/>
              <KPI label={lang==="fr"?"Taux risque élevé":"High-risk rate"} iconKey="shield" color="#7a2d3a"
                value={`${portfolioStats.tauxRisque}%`} sub={`${portfolioStats.eleve} ${lang==="fr"?"clients":"clients"}`}/>
              <KPI label={lang==="fr"?"Encours total":"Total exposure"} iconKey="users" color="var(--gold)"
                value={`${(portfolioStats.encours/1e6).toFixed(1)}M`} sub="TND"/>
            </div>
          </Sec>
        )}

        {/* Users table */}
        <Sec label={lang==="fr" ? "Gestion des comptes" : "Account management"} num={portfolioStats ? "03" : "02"}>
          {usersErr && (
            <div style={{ padding:"14px 18px", background:"rgba(122,45,58,0.1)", border:"1px solid rgba(122,45,58,0.3)", borderRadius:10, fontFamily:"var(--mono)", fontSize:11, color:"#a84050", marginBottom:16 }}>
              ⚠ {usersErr}
            </div>
          )}
          {users ? <UsersTable users={users}/> : !usersErr && (
            <Card style={{ textAlign:"center", padding:"40px 20px" }}>
              <div style={{ width:22, height:22, margin:"0 auto 12px", border:"2px solid rgba(244,197,66,0.2)", borderTop:"2px solid var(--gold)", borderRadius:"50%", animation:"admspin .8s linear infinite" }}/>
              <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--ink-mute)" }}>{lang==="fr"?"Chargement des comptes…":"Loading accounts…"}</div>
            </Card>
          )}
        </Sec>

      </section>
    </>
  )
}