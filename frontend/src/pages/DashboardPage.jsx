import { useState, useEffect, useRef, useMemo } from "react"
import axios from "axios"

// ── Reveal hook (unchanged) ──────────────────────────────────────────────
function useReveal() {
  useEffect(() => {
    const t = setTimeout(() => {
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("db-in"); io.unobserve(e.target) } })
      }, { threshold: 0.04 })
      document.querySelectorAll(".db").forEach(el => io.observe(el))
      return () => io.disconnect()
    }, 40)
    return () => clearTimeout(t)
  }, [])
}

// ── Animated counter ──────────────────────────────────────────────────────────
function Counter({ to, duration = 1200, suffix = "", prefix = "", decimals = 0 }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    if (to === 0) return
    const start = performance.now()
    const tick = now => {
      const p = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 4)
      setVal(+(to * ease).toFixed(decimals))
      if (p < 1) ref.current = requestAnimationFrame(tick)
    }
    ref.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(ref.current)
  }, [to, duration, decimals])
  return <>{prefix}{decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString("fr-TN")}{suffix}</>
}

// ── Histogram bar chart ───────────────────────────────────────────────────────
function Histogram({ data, color = "var(--gold)" }) {
  const [animated, setAnimated] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setAnimated(true); io.disconnect() } }, { threshold: 0.2 })
    if (ref.current) io.observe(ref.current)
    return () => io.disconnect()
  }, [])
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div ref={ref} style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 140, padding: "0 4px" }}>
      {data.map((d, i) => {
        const pct = d.count / max
        const c = d.label === "0–20" ? "#c9a84c"
          : d.label === "20–40" ? "#a87030"
          : d.label === "40–60" ? "#8a5020"
          : d.label === "60–80" ? "#8a3530"
          : "#7a2d3a"
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "rgba(244,197,66,0.4)" }}>{d.count}</div>
            <div style={{ width: "100%", borderRadius: "4px 4px 0 0", background: `${c}18`, border: `1px solid ${c}30`, borderBottom: "none", position: "relative", overflow: "hidden", height: 100 }}>
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                background: `linear-gradient(180deg, ${c}90, ${c})`,
                borderRadius: "4px 4px 0 0",
                height: animated ? `${pct * 100}%` : "0%",
                transition: `height .9s cubic-bezier(0.34,1.56,0.64,1) ${i * .08}s`,
                boxShadow: `0 0 12px ${c}40`
              }}/>
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: c, letterSpacing: ".5px" }}>{d.label}</div>
          </div>
        )
      })}
    </div>
  )
}

// ── Horizontal bar ────────────────────────────────────────────────────────────
function HBar({ label, value, max, color, sub, delay = 0 }) {
  const [w, setW] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setTimeout(() => setW((value / max) * 100), delay); io.disconnect() }
    }, { threshold: 0.1 })
    if (ref.current) io.observe(ref.current)
    return () => io.disconnect()
  }, [value, max, delay])
  return (
    <div ref={ref} style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
        <span style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--ink-dim)" }}>{label}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {sub && <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "rgba(244,197,66,0.3)" }}>{sub}</span>}
          <span style={{ fontFamily: "var(--mono)", fontSize: 12, color, fontWeight: 700 }}>{value.toFixed(1)}</span>
        </div>
      </div>
      <div style={{ height: 5, background: "rgba(244,197,66,0.06)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${w}%`, borderRadius: 99,
          background: `linear-gradient(90deg, ${color}70, ${color})`,
          boxShadow: `0 0 8px ${color}50`,
          transition: `width 1s cubic-bezier(0.34,1.56,0.64,1) ${delay}ms`
        }}/>
      </div>
    </div>
  )
}

// ── Ring chart ────────────────────────────────────────────────────────────────
function Ring({ faible, modere, eleve, total }) {
  const [animated, setAnimated] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setTimeout(() => setAnimated(true), 100); io.disconnect() } }, { threshold: 0.2 })
    if (ref.current) io.observe(ref.current)
    return () => io.disconnect()
  }, [])
  const r = 60, cx = 70, cy = 70, circ = 2 * Math.PI * r
  const segs = [
    { pct: faible / total, c: "#c9a84c", label: "Faible",  n: faible },
    { pct: modere / total, c: "#7a4020", label: "Modéré",  n: modere },
    { pct: eleve  / total, c: "#7a2d3a", label: "Élevé",   n: eleve  },
  ]
  let off = 0
  return (
    <div ref={ref} style={{ display: "flex", alignItems: "center", gap: 24 }}>
      <svg width={140} height={140} style={{ flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(244,197,66,0.05)" strokeWidth={16}/>
        {segs.map((s, i) => {
          const dash = animated ? s.pct * circ : 0
          const el = (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={s.c} strokeWidth={16}
              strokeDasharray={`${dash} ${circ}`}
              strokeDashoffset={-(off * circ - circ / 4)}
              strokeLinecap="butt"
              style={{ transition: `stroke-dasharray 1s cubic-bezier(0.34,1.56,0.64,1) ${i * .15}s` }}/>
          )
          off += s.pct; return el
        })}
        <text x={cx} y={cy - 8} textAnchor="middle" fontFamily="var(--serif)" fontSize={28} fill="var(--gold)">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontFamily="var(--mono)" fontSize={8} fill="var(--ink-mute)" letterSpacing="2">CLIENTS</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {segs.map(s => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: s.c, boxShadow: `0 0 8px ${s.c}70`, flexShrink: 0 }}/>
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-mute)", minWidth: 52 }}>{s.label}</span>
            <span style={{ fontFamily: "var(--serif)", fontSize: 22, color: s.c }}>{s.n}</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "rgba(244,197,66,0.3)" }}>{Math.round(s.pct * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Score sparkline ─────────────────────────────────────────────────────────
function Sparkline({ scores, color }) {
  const W = 120, H = 36
  const min = Math.min(...scores), max = Math.max(...scores)
  const range = max - min || 1
  const pts = scores.map((s, i) => {
    const x = (i / (scores.length - 1)) * W
    const y = H - ((s - min) / range) * H
    return `${x},${y}`
  }).join(" ")
  const area = `0,${H} ${pts} ${W},${H}`
  return (
    <svg width={W} height={H} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`sg-${color.replace(/[^a-z]/gi,"")}` } x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".35"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sg-${color.replace(/[^a-z]/gi,"")})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ── KPI card ────────────────────────────────────────────────────────────────
function KPICard({ label, value, sub, color, icon, trend, sparkData }) {
  return (
    <div style={{
      padding: "22px 24px",
      background: "linear-gradient(160deg, rgba(18,10,31,0.9), rgba(10,6,18,0.95))",
      border: `1px solid rgba(244,197,66,0.08)`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 16,
      position: "relative", overflow: "hidden",
      transition: "transform .2s ease, box-shadow .2s ease",
      cursor: "default"
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px ${color}20` }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none" }}
    >
      <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, background: `radial-gradient(ellipse 60% 60% at 100% 0%, ${color}08, transparent)`, pointerEvents: "none" }}/>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(244,197,66,0.3)" }}>{label}</div>
        <div style={{ fontSize: 18, opacity: .6 }}>{icon}</div>
      </div>
      <div style={{ fontFamily: "var(--serif)", fontSize: 38, color, lineHeight: 1, marginBottom: 8 }}>{value}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-mute)" }}>{sub}</div>
        {sparkData && <Sparkline scores={sparkData} color={color}/>}
        {trend !== undefined && (
          <span style={{
            fontFamily: "var(--mono)", fontSize: 10, fontWeight: 700,
            color: trend >= 0 ? "#5cb874" : "#d34a4a",
            padding: "2px 8px", borderRadius: 99,
            background: trend >= 0 ? "rgba(92,184,116,0.1)" : "rgba(211,74,74,0.1)"
          }}>{trend >= 0 ? "+" : ""}{trend}%</span>
        )}
      </div>
    </div>
  )
}

// ── Top risqués table ────────────────────────────────────────────────────────
function TopRisques({ data }) {
  return (
    <div style={{ borderRadius: 14, border: "1px solid rgba(244,197,66,0.08)", overflow: "hidden", background: "rgba(5,3,10,0.6)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "rgba(10,6,18,0.95)", borderBottom: "1px solid rgba(244,197,66,0.1)" }}>
            {["N°", "Client", "Secteur", "Région", "Encours", "Score", "Décision"].map(h => (
              <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontFamily: "var(--mono)", fontSize: 8, letterSpacing: "2px", textTransform: "uppercase", color: "rgba(244,197,66,0.3)", whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}
              style={{ borderBottom: "1px solid rgba(244,197,66,0.04)", background: i % 2 === 0 ? "rgba(244,197,66,0.012)" : "transparent", transition: "background .15s", cursor: "default" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(122,45,58,0.12)"}
              onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "rgba(244,197,66,0.012)" : "transparent"}
            >
              <td style={{ padding: "10px 14px", fontFamily: "var(--mono)", fontSize: 9, color: "rgba(244,197,66,0.25)" }}>{String(i + 1).padStart(2, "0")}</td>
              <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--ink)", fontWeight: 500, whiteSpace: "nowrap" }}>
                {(row.prenom || row.nom) ? `${row.prenom||""} ${row.nom||""}`.trim() : <span style={{ color: "rgba(244,197,66,0.25)", fontStyle: "italic", fontSize: 10 }}>Client anonyme</span>}
              </td>
              <td style={{ padding: "10px 14px", fontSize: 11, color: "var(--ink-dim)", whiteSpace: "nowrap" }}>{row.secteur}</td>
              <td style={{ padding: "10px 14px", fontSize: 11, color: "var(--ink-dim)", whiteSpace: "nowrap" }}>{row.region}</td>
              <td style={{ padding: "10px 14px", fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-dim)", whiteSpace: "nowrap" }}>{Number(row.montant_encours_tnd).toLocaleString("fr-TN")} <span style={{ fontSize: 9, color: "rgba(244,197,66,0.3)" }}>TND</span></td>
              <td style={{ padding: "10px 14px" }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "3px 11px", borderRadius: 99, fontFamily: "var(--mono)", fontSize: 12, fontWeight: 800,
                  background: "rgba(122,45,58,0.2)", color: "#a84050", border: "1px solid rgba(122,45,58,0.4)"
                }}>{row.score}</span>
              </td>
              <td style={{ padding: "10px 14px", fontSize: 11, color: "#a84050", fontWeight: 500 }}>{row.decision}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Section wrapper ──────────────────────────────────────────────────────────
function Section({ children, label, num, delay = 0 }) {
  return (
    <div className="db" style={{ transitionDelay: `${delay}s`, marginBottom: 32 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "rgba(244,197,66,0.3)", letterSpacing: "2px" }}>{num}</span>
        <div style={{ height: 1, width: 24, background: "rgba(244,197,66,0.2)" }}/>
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "rgba(244,197,66,0.5)", letterSpacing: "2px", textTransform: "uppercase" }}>{label}</span>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(244,197,66,0.15), transparent)" }}/>
      </div>
      {children}
    </div>
  )
}

// ── Card wrapper ────────────────────────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "linear-gradient(160deg, rgba(18,10,31,0.85), rgba(10,6,18,0.9))",
      border: "1px solid rgba(244,197,66,0.08)",
      borderRadius: 16, padding: "24px 28px",
      boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
      ...style
    }}>
      {children}
    </div>
  )
}

// ── Card title ──────────────────────────────────────────────────────────────
function CardTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontFamily: "var(--serif)", fontSize: 18, color: "var(--ink)", letterSpacing: "-.01em", marginBottom: 4 }}>{children}</div>
      {sub && <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "rgba(244,197,66,0.3)", letterSpacing: "1.5px" }}>{sub}</div>}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD (with file upload)
// ═══════════════════════════════════════════════════════════════════════════
export default function DashboardPage() {
  useReveal()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [fileName, setFileName] = useState(null)

  const handleFileUpload = async (file) => {
    if (!file) return
    setLoading(true)
    setError(null)
    const formData = new FormData()
    formData.append("file", file)
    try {
      const response = await axios.post("http://127.0.0.1:8000/batch_predict", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      setData(response.data)
      setFileName(file.name)
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors du scoring du fichier")
    } finally {
      setLoading(false)
    }
  }
   
 const stats = useMemo(() => {
  console.log("🔍 Computing stats, data =", data)
  if (!data) return null
  const p = data.predictions
  console.log("📈 Predictions length:", p?.length)
  if (!p || p.length === 0) return null
  
  const scores = p.map(r => r.score)
  const avg = scores.reduce((a, b) => a + b, 0) / p.length
  const faible = p.filter(r => r.niveau === "FAIBLE").length
  const modere = p.filter(r => r.niveau === "MODÉRÉ").length
  const eleve = p.filter(r => r.niveau === "ÉLEVÉ").length
  const encours = p.reduce((s, r) => s + (Number(r.montant_encours_tnd) || 0), 0)
  const delai = p.reduce((s, r) => s + (Number(r.delai_moyen_jours) || 0), 0) / p.length

  const hist = [
    { label: "0–20",   count: scores.filter(s => s <= 20).length },
    { label: "20–40",  count: scores.filter(s => s > 20 && s <= 40).length },
    { label: "40–60",  count: scores.filter(s => s > 40 && s <= 60).length },
    { label: "60–80",  count: scores.filter(s => s > 60 && s <= 80).length },
    { label: "80–100", count: scores.filter(s => s > 80).length },
  ]

  const secteurs = [...new Set(p.map(r => r.secteur))].map(sec => {
    const g = p.filter(r => r.secteur === sec)
    return { 
      name: sec, 
      avg: g.reduce((a, r) => a + r.score, 0) / g.length, 
      count: g.length, 
      encours: g.reduce((a, r) => a + (Number(r.montant_encours_tnd) || 0), 0) 
    }
  }).sort((a, b) => b.avg - a.avg)

  const regions = [...new Set(p.map(r => r.region))].map(reg => {
    const g = p.filter(r => r.region === reg)
    return { 
      name: reg, 
      avg: g.reduce((a, r) => a + r.score, 0) / g.length, 
      count: g.length 
    }
  }).sort((a, b) => b.avg - a.avg)

  const top10 = [...p].sort((a, b) => b.score - a.score).slice(0, 10)
  const sparkScores = [...scores].sort(() => Math.random() - 0.5).slice(0, 12)

  console.log("✅ Stats computed:", { total: p.length, avg, faible, modere, eleve })
  return { p, scores, avg, faible, modere, eleve, encours, delai, hist, secteurs, regions, top10, sparkScores, total: p.length }
}, [data]) 
  // If no data yet, show upload area
  if (!data && !loading) {
    return (
      <div style={{ padding: "120px 40px 100px", maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
        <div style={{ marginBottom: 32 }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1">
            <path d="M12 16v-6m0 0-3 3m3-3 3 3m-6 5h6" strokeLinecap="round"/>
            <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M4 8V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2"/>
          </svg>
        </div>
        <h2 style={{ fontFamily: "var(--serif)", fontSize: 28, color: "var(--gold)", marginBottom: 12 }}>Analyse de portefeuille</h2>
        <p style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-mute)", marginBottom: 24 }}>
          Chargez un fichier Excel (.xlsx) ou CSV contenant les données clients pour obtenir un scoring complet et un tableau de bord détaillé.
        </p>
        <label style={{
          display: "inline-flex", alignItems: "center", gap: 12,
          padding: "12px 24px", background: "linear-gradient(180deg,var(--gold),var(--gold-soft))",
          color: "var(--bg)", borderRadius: 40, fontFamily: "var(--mono)", fontSize: 12,
          fontWeight: 700, letterSpacing: 1, cursor: "pointer"
        }}>
          📂 Sélectionner un fichier
          <input type="file" accept=".xlsx,.csv" onChange={e => handleFileUpload(e.target.files[0])} style={{ display: "none" }}/>
        </label>
        {error && <div style={{ marginTop: 24, padding: 12, background: "rgba(211,74,74,0.1)", border: "1px solid rgba(211,74,74,0.3)", borderRadius: 12, color: "#d34a4a", fontSize: 13 }}>{error}</div>}
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 20 }}>
        <style>{`.db-spin{animation:db-rotate 1s linear infinite}@keyframes db-rotate{to{transform:rotate(360deg)}}`}</style>
        <div className="db-spin" style={{ width: 48, height: 48, borderRadius: "50%", border: "2px solid rgba(244,197,66,0.1)", borderTop: "2px solid var(--gold)" }}/>
        <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-mute)", letterSpacing: "2px" }}>SCORING EN COURS...</div>
      </div>
    )
  }

  

  if (error || !stats) {
    return (
      <div style={{ maxWidth: 600, margin: "100px auto", textAlign: "center", padding: "0 40px" }}>
        <svg viewBox="0 0 48 48" width="48" style={{ margin: "0 auto 16px", display: "block", opacity: .3 }} fill="none" stroke="var(--gold)" strokeWidth="1.2">
          <path d="M24 8v16M24 36h.01"/><circle cx="24" cy="24" r="20"/>
        </svg>
        <div style={{ fontFamily: "var(--serif)", fontSize: 24, color: "var(--ink)", marginBottom: 10 }}>Aucune donnée</div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-mute)", lineHeight: 1.8, letterSpacing: ".5px" }}>{error || "Erreur inconnue"}</div>
        <button onClick={() => window.location.reload()} style={{ marginTop: 24, padding: "8px 20px", background: "rgba(244,197,66,0.1)", border: "1px solid var(--gold)", borderRadius: 40, color: "var(--gold)", cursor: "pointer" }}>Recharger</button>
      </div>
    )
  }

  const TABS = [
    { key: "overview",  label: "Vue d'ensemble" },
    { key: "risques",   label: "Risques"         },
    { key: "secteurs",  label: "Secteurs"        },
    { key: "regions",   label: "Régions"         },
  ]

  return (
    <>
      <style>{`
        .db{opacity:0;transform:translate3d(0,20px,0);transition:opacity .65s cubic-bezier(0.16,1,0.3,1),transform .65s cubic-bezier(0.16,1,0.3,1);will-change:transform,opacity}
        .db.db-in{opacity:1;transform:translate3d(0,0,0)}
        .db-d1{transition-delay:.08s}.db-d2{transition-delay:.16s}.db-d3{transition-delay:.24s}.db-d4{transition-delay:.32s}.db-d5{transition-delay:.40s}
        .tab-btn:hover{color:var(--ink)!important;border-color:rgba(244,197,66,0.25)!important}
        .db-scroll::-webkit-scrollbar{width:4px;height:4px}
        .db-scroll::-webkit-scrollbar-track{background:transparent}
        .db-scroll::-webkit-scrollbar-thumb{background:rgba(201,168,76,0.2);border-radius:99px}
      `}</style>

      <section style={{ padding: "100px 40px 100px", maxWidth: 1280, margin: "0 auto" }}>
        {/* Header with file info */}
        <div className="db" style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "rgba(244,197,66,0.4)", letterSpacing: "3px" }}>04</span>
                <div style={{ height: 1, width: 28, background: "rgba(244,197,66,0.2)" }}/>
                <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "rgba(244,197,66,0.45)", letterSpacing: "2.5px", textTransform: "uppercase" }}>Dashboard analytique</span>
              </div>
              <h1 style={{ fontFamily: "var(--serif)", fontSize: "clamp(36px,5vw,60px)", fontWeight: 400, letterSpacing: "-.03em", lineHeight: 1.05, margin: 0, color: "var(--ink)" }}>
                Intelligence du <span style={{ color: "var(--gold)", fontStyle: "italic" }}>portefeuille</span>
              </h1>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: "rgba(92,184,116,0.06)", border: "1px solid rgba(92,184,116,0.2)", borderRadius: 10 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#5cb874", boxShadow: "0 0 8px #5cb874", animation: "pulse 2s infinite" }}/>
              <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "#5cb874", letterSpacing: "1.5px" }}>{stats.total} CLIENTS · FICHIER: {fileName}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="db db-d1" style={{ display: "flex", gap: 6, marginBottom: 40, borderBottom: "1px solid rgba(244,197,66,0.08)", paddingBottom: 0 }}>
          {TABS.map(tab => {
            const on = activeTab === tab.key
            return (
              <button key={tab.key} className="tab-btn"
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: "10px 20px", borderRadius: "8px 8px 0 0",
                  fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "1px", textTransform: "uppercase",
                  border: `1px solid ${on ? "rgba(244,197,66,0.2)" : "transparent"}`,
                  borderBottom: on ? "1px solid rgba(10,6,18,1)" : "1px solid transparent",
                  background: on ? "rgba(18,10,31,0.9)" : "transparent",
                  color: on ? "var(--gold)" : "rgba(244,197,66,0.3)",
                  cursor: "pointer", transition: "all .2s ease",
                  marginBottom: on ? -1 : 0
                }}>
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab content – exactly the same as your original dashboard (unchanged) */}
        {activeTab === "overview" && (
          <>
            <Section label="Indicateurs clés" num="01" delay={0}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
                <div className="db db-d1">
                  <KPICard label="Encours total" icon="💼"
                    value={<Counter to={stats.encours / 1e6} decimals={1} suffix=" M"/>}
                    sub="dinars tunisiens" color="#c9a84c"
                    sparkData={stats.sparkScores}/>
                </div>
                <div className="db db-d2">
                  <KPICard label="Score moyen" icon="📊"
                    value={<Counter to={stats.avg} decimals={1}/>}
                    sub="/ 100 — portefeuille global"
                    color={stats.avg <= 30 ? "#c9a84c" : stats.avg <= 60 ? "#a87030" : "#7a2d3a"}/>
                </div>
                <div className="db db-d3">
                  <KPICard label="Clients à risque élevé" icon="⚠️"
                    value={<Counter to={stats.eleve}/>}
                    sub={`${Math.round(stats.eleve / stats.total * 100)}% du portefeuille`}
                    color="#7a2d3a"/>
                </div>
                <div className="db db-d4">
                  <KPICard label="Délai moyen paiement" icon="⏱"
                    value={<Counter to={stats.delai} decimals={1} suffix=" j"/>}
                    sub="jours moyens de règlement" color="#a87030"/>
                </div>
              </div>
            </Section>

            <Section label="Distribution & répartition" num="02" delay={.1}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div className="db db-d1">
                  <Card>
                    <CardTitle sub="RÉPARTITION DES SCORES PAR TRANCHE">Distribution des scores</CardTitle>
                    <Histogram data={stats.hist}/>
                  </Card>
                </div>
                <div className="db db-d2">
                  <Card>
                    <CardTitle sub="PROFILS FAIBLE · MODÉRÉ · ÉLEVÉ">Mix du portefeuille</CardTitle>
                    <Ring faible={stats.faible} modere={stats.modere} eleve={stats.eleve} total={stats.total}/>
                  </Card>
                </div>
              </div>
            </Section>

            <Section label="Surveillance prioritaire" num="03" delay={.2}>
              <div className="db">
                <Card style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: "20px 28px 16px", borderBottom: "1px solid rgba(244,197,66,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontFamily: "var(--serif)", fontSize: 18, color: "var(--ink)", marginBottom: 3 }}>Top 10 — Risque élevé</div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "rgba(244,197,66,0.3)", letterSpacing: "1.5px" }}>CLIENTS NÉCESSITANT UNE ATTENTION IMMÉDIATE</div>
                    </div>
                    <span style={{ padding: "4px 14px", borderRadius: 99, background: "rgba(122,45,58,0.15)", border: "1px solid rgba(122,45,58,0.3)", fontFamily: "var(--mono)", fontSize: 10, color: "#a84050", letterSpacing: "1px" }}>{stats.eleve} ÉLEVÉ</span>
                  </div>
                  <TopRisques data={stats.top10}/>
                </Card>
              </div>
            </Section>
          </>
        )}

        {activeTab === "risques" && (
          <>
            <Section label="Analyse de risque détaillée" num="01" delay={0}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
                {[
                  { label:"Clients FAIBLE", val:stats.faible, pct:Math.round(stats.faible/stats.total*100), color:"#c9a84c", desc:"Accorder le crédit" },
                  { label:"Clients MODÉRÉ", val:stats.modere, pct:Math.round(stats.modere/stats.total*100), color:"#a87030", desc:"Accorder avec garanties" },
                  { label:"Clients ÉLEVÉ",  val:stats.eleve,  pct:Math.round(stats.eleve/stats.total*100),  color:"#7a2d3a", desc:"Refuser le crédit" },
                ].map((x, i) => (
                  <div key={i} className={`db db-d${i+1}`}>
                    <div style={{ padding: "28px", background: "linear-gradient(160deg,rgba(18,10,31,0.9),rgba(10,6,18,0.95))", border: `1px solid ${x.color}18`, borderTop: `3px solid ${x.color}`, borderRadius: 16, textAlign: "center" }}>
                      <div style={{ fontFamily: "var(--serif)", fontSize: 64, color: x.color, lineHeight: 1, marginBottom: 8 }}>
                        <Counter to={x.val} duration={1000}/>
                      </div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "rgba(244,197,66,0.35)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 16 }}>{x.label}</div>
                      <div style={{ height: 6, background: "rgba(244,197,66,0.06)", borderRadius: 99, overflow: "hidden", marginBottom: 12 }}>
                        <div className="db-pct-bar" style={{ height: "100%", width: `${x.pct}%`, background: x.color, borderRadius: 99, boxShadow: `0 0 10px ${x.color}50`, transition: "width 1.2s cubic-bezier(0.34,1.56,0.64,1) .3s" }}/>
                      </div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 18, color: x.color, fontWeight: 800, marginBottom: 6 }}>{x.pct}%</div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-mute)", letterSpacing: ".5px" }}>{x.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section label="Top 10 profils à risque" num="02" delay={.1}>
              <div className="db">
                <Card style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: "20px 28px 16px", borderBottom: "1px solid rgba(244,197,66,0.08)" }}>
                    <div style={{ fontFamily: "var(--serif)", fontSize: 18, color: "var(--ink)", marginBottom: 3 }}>Surveillance prioritaire</div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "rgba(244,197,66,0.3)", letterSpacing: "1.5px" }}>SCORES LES PLUS ÉLEVÉS — REVUE RECOMMANDÉE</div>
                  </div>
                  <TopRisques data={stats.top10}/>
                </Card>
              </div>
            </Section>
          </>
        )}

        {activeTab === "secteurs" && (
          <Section label="Performance par secteur d'activité" num="01" delay={0}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div className="db db-d1">
                <Card>
                  <CardTitle sub="SCORE MOYEN PAR SECTEUR · TRI PAR RISQUE">Risque sectoriel</CardTitle>
                  {stats.secteurs.map((s, i) => (
                    <HBar key={s.name} label={s.name} value={s.avg} max={100}
                      color={s.avg <= 30 ? "#c9a84c" : s.avg <= 60 ? "#a87030" : "#7a2d3a"}
                      sub={`${s.count} clients`} delay={i * 60}/>
                  ))}
                </Card>
              </div>
              <div className="db db-d2">
                <Card>
                  <CardTitle sub="ENCOURS PAR SECTEUR EN MILLIONS TND">Exposition par secteur</CardTitle>
                  {stats.secteurs.map((s, i) => (
                    <HBar key={s.name} label={s.name} value={s.encours / 1e6}
                      max={Math.max(...stats.secteurs.map(x => x.encours / 1e6))}
                      color="#c9a84c" sub={`${s.count} clients`} delay={i * 60}/>
                  ))}
                </Card>
              </div>
            </div>
          </Section>
        )}

        {activeTab === "regions" && (
          <Section label="Performance par région" num="01" delay={0}>
            <div className="db db-d1">
              <Card>
                <CardTitle sub="SCORE MOYEN PAR RÉGION · TRI PAR RISQUE">Risque régional</CardTitle>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 40px" }}>
                  {stats.regions.map((r, i) => (
                    <HBar key={r.name} label={r.name} value={r.avg} max={100}
                      color={r.avg <= 30 ? "#c9a84c" : r.avg <= 60 ? "#a87030" : "#7a2d3a"}
                      sub={`${r.count} client${r.count > 1 ? "s" : ""}`} delay={i * 50}/>
                  ))}
                </div>
              </Card>
            </div>
          </Section>
        )}
      </section>
    </>
  )
}