import { useState, useEffect, useRef, useMemo, useCallback } from "react"

// ── Reveal — fires after React paints new tab content ────────────────────────
function useReveal(key) {
  useEffect(() => {
    if (!key) return
    // Step 1: mark all .db as animated (hidden)
    document.querySelectorAll(".db").forEach(el => {
      el.classList.add("db-anim")
      el.classList.remove("db-in")
    })
    // Step 2: two rAFs to wait for paint, then reveal
    let id1, id2, t
    id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => {
        t = setTimeout(() => {
          document.querySelectorAll(".db").forEach(el => {
            el.classList.add("db-in")
          })
        }, 20)
      })
    })
    return () => {
      cancelAnimationFrame(id1)
      cancelAnimationFrame(id2)
      clearTimeout(t)
    }
  }, [key])
}

// ── Bubbles ───────────────────────────────────────────────────────────────────
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

// ── Counter ───────────────────────────────────────────────────────────────────
function Counter({ to, duration=900, suffix="", decimals=0 }) {
  const [val, setVal] = useState(0)
  const raf = useRef(null)
  useEffect(() => {
    if (!to) return
    const s = performance.now()
    const tick = n => {
      const t = Math.min((n-s)/duration, 1)
      const e = 1 - Math.pow(1-t, 4)
      setVal(+(to*e).toFixed(decimals))
      if (t<1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [to, duration, decimals])
  return <>{decimals>0 ? val.toFixed(decimals) : Math.round(val).toLocaleString("fr-TN")}{suffix}</>
}

// ── Animated bar (intersection-triggered) ────────────────────────────────────
function ABar({ pct, color, delay=0, height=5 }) {
  const [w, setW] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setTimeout(()=>setW(pct), delay); io.disconnect() }
    }, { threshold:0.1 })
    if (ref.current) io.observe(ref.current)
    return () => io.disconnect()
  }, [pct, delay])
  return (
    <div ref={ref} style={{ height, background:"rgba(244,197,66,0.06)", borderRadius:99, overflow:"hidden" }}>
      <div style={{ height:"100%", width:`${w}%`, borderRadius:99, background:`linear-gradient(90deg,${color}70,${color})`, boxShadow:`0 0 8px ${color}50`, transition:`width 1s cubic-bezier(0.34,1.56,0.64,1) ${delay}ms` }}/>
    </div>
  )
}

// ── Histogram ─────────────────────────────────────────────────────────────────
function Histogram({ data }) {
  const [anim, setAnim] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if(e.isIntersecting){setAnim(true);io.disconnect()} }, {threshold:0.15})
    if(ref.current) io.observe(ref.current)
    return () => io.disconnect()
  }, [])
  const max = Math.max(...data.map(d=>d.count), 1)
  const COLS = ["#c9a84c","#b87830","#a06028","#8a3c28","#7a2d3a"]
  return (
    <div ref={ref} style={{ display:"flex", alignItems:"flex-end", gap:8, height:150, padding:"0 4px" }}>
      {data.map((d,i) => {
        const pct = d.count/max
        const c = COLS[i]
        return (
          <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
            <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"rgba(244,197,66,0.5)", fontWeight:600 }}>{d.count}</div>
            <div style={{ width:"100%", borderRadius:"5px 5px 0 0", background:`${c}14`, border:`1px solid ${c}28`, borderBottom:"none", position:"relative", height:110, overflow:"hidden" }}>
              <div style={{
                position:"absolute", bottom:0, left:0, right:0,
                background:`linear-gradient(180deg,${c}70,${c})`,
                borderRadius:"5px 5px 0 0",
                height: anim ? `${pct*100}%` : "0%",
                transition:`height .85s cubic-bezier(0.34,1.56,0.64,1) ${i*.1}s`,
                boxShadow:`0 0 16px ${c}35`
              }}/>
            </div>
            <div style={{ fontFamily:"var(--mono)", fontSize:9, color:c, letterSpacing:".5px" }}>{d.label}</div>
          </div>
        )
      })}
    </div>
  )
}

// ── Ring chart ────────────────────────────────────────────────────────────────
function Ring({ faible, modere, eleve, total }) {
  const [anim, setAnim] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if(e.isIntersecting){setTimeout(()=>setAnim(true),80);io.disconnect()} }, {threshold:0.15})
    if(ref.current) io.observe(ref.current)
    return () => io.disconnect()
  }, [])
  const r=56, cx=65, cy=65, circ=2*Math.PI*r
  const segs = [
    {pct:faible/total, c:"#c9a84c", label:"Faible", n:faible},
    {pct:modere/total, c:"#8a4820", label:"Modéré", n:modere},
    {pct:eleve/total,  c:"#7a2d3a", label:"Élevé",  n:eleve},
  ]
  let off = 0
  return (
    <div ref={ref} style={{ display:"flex", alignItems:"center", gap:24 }}>
      <svg width={130} height={130} style={{ flexShrink:0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(244,197,66,0.06)" strokeWidth={14}/>
        {segs.map((s,i) => {
          const dash = anim ? s.pct*circ : 0
          const el = <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.c} strokeWidth={14}
            strokeDasharray={`${dash} ${circ}`}
            strokeDashoffset={-(off*circ - circ/4)}
            style={{ transition:`stroke-dasharray .9s cubic-bezier(0.34,1.56,0.64,1) ${i*.14}s` }}/>
          off += s.pct; return el
        })}
        <text x={cx} y={cy-5} textAnchor="middle" fontFamily="var(--serif)" fontSize={24} fill="var(--gold)">{total}</text>
        <text x={cx} y={cy+12} textAnchor="middle" fontFamily="var(--mono)" fontSize={7} fill="var(--ink-mute)" letterSpacing="2">CLIENTS</text>
      </svg>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {segs.map(s => (
          <div key={s.label} style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:10, height:10, borderRadius:3, background:s.c, boxShadow:`0 0 8px ${s.c}80`, flexShrink:0 }}/>
            <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--ink-dim)", minWidth:48 }}>{s.label}</span>
            <span style={{ fontFamily:"var(--serif)", fontSize:20, color:s.c }}>{s.n}</span>
            <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"rgba(244,197,66,0.35)" }}>{Math.round(s.pct*100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Horizontal bar ────────────────────────────────────────────────────────────
function HBar({ label, value, max, color, sub, delay=0 }) {
  const [w, setW] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if(e.isIntersecting){setTimeout(()=>setW((value/max)*100), delay);io.disconnect()}
    }, {threshold:0.1})
    if(ref.current) io.observe(ref.current)
    return () => io.disconnect()
  }, [value, max, delay])
  return (
    <div ref={ref} style={{ marginBottom:14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
        <span style={{ fontFamily:"var(--sans)", fontSize:12, color:"var(--ink-dim)" }}>{label}</span>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {sub && <span style={{ fontFamily:"var(--mono)", fontSize:9, color:"rgba(244,197,66,0.28)" }}>{sub}</span>}
          <span style={{ fontFamily:"var(--mono)", fontSize:12, color, fontWeight:700 }}>{typeof value === "number" ? value.toFixed(1) : value}</span>
        </div>
      </div>
      <div style={{ height:5, background:"rgba(244,197,66,0.07)", borderRadius:99, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${w}%`, borderRadius:99, background:`linear-gradient(90deg,${color}65,${color})`, boxShadow:`0 0 8px ${color}45`, transition:`width 1s cubic-bezier(0.34,1.56,0.64,1) ${delay}ms` }}/>
      </div>
    </div>
  )
}

// ── Score heatmap row ─────────────────────────────────────────────────────────
function ScoreGauge({ label, value, delay=0 }) {
  const [w, setW] = useState(0)
  const ref = useRef(null)
  const color = value<=30?"#c9a84c":value<=60?"#a06028":"#7a2d3a"
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if(e.isIntersecting){setTimeout(()=>setW(value), delay);io.disconnect()}
    }, {threshold:0.1})
    if(ref.current) io.observe(ref.current)
    return () => io.disconnect()
  }, [value, delay])
  return (
    <div ref={ref} style={{ marginBottom:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
        <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"rgba(244,197,66,0.7)" }}>{label}</span>
        <span style={{ fontFamily:"var(--serif)", fontSize:17, color }}>{value.toFixed(1)}</span>
      </div>
      <div style={{ height:7, background:"rgba(244,197,66,0.06)", borderRadius:99, overflow:"hidden", position:"relative" }}>
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(90deg,rgba(92,184,116,0.25),rgba(168,96,40,0.3),rgba(122,45,58,0.35))", borderRadius:99 }}/>
        <div style={{ position:"absolute", top:0, left:0, bottom:0, width:`${w}%`, background:color, borderRadius:99, boxShadow:`0 0 10px ${color}55`, transition:`width 1.1s cubic-bezier(0.34,1.56,0.64,1) ${delay}ms` }}/>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:4, fontFamily:"var(--mono)", fontSize:7, color:"rgba(244,197,66,0.18)" }}>
        <span>0</span><span>50</span><span>100</span>
      </div>
    </div>
  )
}

// ── KPI card ──────────────────────────────────────────────────────────────────
const SVG_ICONS = {
  encours:<svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="16" height="12" rx="2"/><path d="M6 5V4a2 2 0 0 1 4 0v1M10 11a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/></svg>,
  score:  <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 14 7 9l3 3 4-5 4 3" strokeLinecap="round" strokeLinejoin="round"/><circle cx="17" cy="5" r="1.5" fill="currentColor"/></svg>,
  risque: <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 3L2 17h16L10 3z" strokeLinejoin="round"/><path d="M10 8v4M10 14.5v.5" strokeLinecap="round"/></svg>,
  delai:  <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10" cy="10" r="8"/><path d="M10 6v4.5l2.5 1.5" strokeLinecap="round"/></svg>,
  ca:     <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 17V8l7-5 7 5v9"/><path d="M8 17v-5h4v5" strokeLinejoin="round"/></svg>,
  check:  <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 10l5 5 9-9" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  mid:    <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 10h12M4 6h12M4 14h8" strokeLinecap="round"/></svg>,
  up:     <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 4v12M4 10l6-6 6 6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
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

// ── Card ──────────────────────────────────────────────────────────────────────
function Card({ children, style={} }) {
  return (
    <div style={{
      background:"linear-gradient(160deg,rgba(44,30,66,0.78),rgba(32,20,52,0.84))",
      border:"1px solid rgba(244,197,66,0.14)", borderRadius:14,
      padding:"22px 26px", boxShadow:"0 6px 32px rgba(0,0,0,0.25)", ...style
    }}>{children}</div>
  )
}
function CH({ title }) {
  return (
    <div style={{ marginBottom:18, textAlign:"center" }}>
      <div style={{ fontFamily:"var(--serif)", fontSize:17, color:"var(--ink-dim)", letterSpacing:"-.01em" }}>{title}</div>
    </div>
  )
}

// ── Section ───────────────────────────────────────────────────────────────────
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

// ── Full client table with filter + scroll ────────────────────────────────────
function ClientTable({ predictions }) {
  const [filter, setFilter] = useState("ALL")
  const [sortBy, setSortBy] = useState("score")
  const [sortDir, setSortDir] = useState("desc")

  const filtered = useMemo(() => {
    let d = [...predictions]
    if (filter !== "ALL") d = d.filter(r => r.niveau === filter)
    d.sort((a,b) => sortDir==="desc" ? b[sortBy]-a[sortBy] : a[sortBy]-b[sortBy])
    return d
  }, [predictions, filter, sortBy, sortDir])

  const toggleSort = col => {
    if(sortBy===col) setSortDir(d=>d==="desc"?"asc":"desc")
    else { setSortBy(col); setSortDir("desc") }
  }

  const COLS = [
    {key:"idx",     label:"N°",     sortable:false, w:"4%"},
    {key:"prenom",  label:"Client", sortable:false, w:"14%"},
    {key:"secteur", label:"Secteur",sortable:false, w:"12%"},
    {key:"region",  label:"Région", sortable:false, w:"10%"},
    {key:"montant_encours_tnd", label:"Encours", sortable:true, w:"12%"},
    {key:"ca_annuel_tnd",       label:"CA annuel",sortable:true, w:"12%"},
    {key:"anciennete_annees",   label:"Anc.",    sortable:true, w:"6%"},
    {key:"score",   label:"Score",  sortable:true, w:"8%"},
    {key:"niveau",  label:"Niveau", sortable:false, w:"10%"},
    {key:"decision",label:"Décision",sortable:false,w:"12%"},
  ]

  const FILTER_BTNS = [
    {key:"ALL",    label:"Tous",   count:predictions.length,                              c:"#c9a84c"},
    {key:"FAIBLE", label:"Faible", count:predictions.filter(r=>r.niveau==="FAIBLE").length,c:"#c9a84c"},
    {key:"MODÉRÉ", label:"Modéré", count:predictions.filter(r=>r.niveau==="MODÉRÉ").length,c:"#a06028"},
    {key:"ÉLEVÉ",  label:"Élevé",  count:predictions.filter(r=>r.niveau==="ÉLEVÉ").length, c:"#7a2d3a"},
  ]

  const scoreColor = s => s<=30?"#c9a84c":s<=60?"#a06028":"#7a2d3a"

  return (
    <Card style={{ padding:0, overflow:"hidden" }}>
      {/* Filter bar */}
      <div style={{ padding:"16px 22px", borderBottom:"1px solid rgba(244,197,66,0.08)", display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
        {FILTER_BTNS.map(({key,label,count,c}) => {
          const on = filter===key
          return (
            <button key={key} onClick={()=>setFilter(key)} style={{
              padding:"5px 14px", borderRadius:99, cursor:"pointer",
              fontFamily:"var(--mono)", fontSize:10, letterSpacing:"1px",
              border:on?`1px solid ${c}`:"1px solid rgba(244,197,66,0.1)",
              background:on?`${c}18`:"transparent",
              color:on?c:"rgba(244,197,66,0.35)",
              transition:"all .18s", display:"flex", alignItems:"center", gap:5
            }}>
              {label}
              <span style={{ padding:"0 5px", borderRadius:99, fontSize:9, background:on?`${c}28`:"rgba(255,255,255,0.03)", color:on?c:"rgba(244,197,66,0.3)" }}>{count}</span>
            </button>
          )
        })}
        <span style={{ marginLeft:"auto", fontFamily:"var(--mono)", fontSize:9, color:"rgba(244,197,66,0.25)", letterSpacing:"1px" }}>{filtered.length} entrées</span>
      </div>

      {/* Scrollable table */}
      <div className="stbg-table-wrap" style={{ border:"none", borderRadius:0, boxShadow:"none" }}>
        <div style={{ overflowX:"auto", overflowY:"auto", maxHeight:400 }} className="stbg-scroll">
          <table className="stbg-table" style={{ minWidth:860 }}>
            <thead>
              <tr>
                {COLS.map(col => (
                  <th key={col.key}
                    className={col.sortable ? "sortable" : ""}
                    onClick={col.sortable?()=>toggleSort(col.key):undefined}
                    style={{ position:"sticky", top:0, zIndex:2, background: sortBy===col.key ? "rgba(28,18,44,0.98)" : undefined }}>
                    {col.label}{sortBy===col.key && <span style={{ marginLeft:3, fontSize:10, color:"var(--gold)" }}>{sortDir==="desc"?"↓":"↑"}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr key={i}>
                  <td className="muted">{String(i+1).padStart(2,"0")}</td>
                  <td style={{ fontWeight:600, whiteSpace:"nowrap" }}>{(row.prenom||row.nom)?`${row.prenom||""} ${row.nom||""}`.trim():<span style={{ color:"rgba(244,197,66,0.25)",fontStyle:"italic",fontSize:11 }}>—</span>}</td>
                  <td className="dim" style={{ whiteSpace:"nowrap" }}>{row.secteur}</td>
                  <td className="dim" style={{ whiteSpace:"nowrap" }}>{row.region}</td>
                  <td className="mono" style={{ whiteSpace:"nowrap" }}>{Number(row.montant_encours_tnd||0).toLocaleString("fr-TN")}<span style={{ color:"rgba(244,197,66,0.4)",marginLeft:3 }}>TND</span></td>
                  <td className="mono" style={{ whiteSpace:"nowrap" }}>{Number(row.ca_annuel_tnd||0).toLocaleString("fr-TN")}<span style={{ color:"rgba(244,197,66,0.4)",marginLeft:3 }}>TND</span></td>
                  <td className="mono" style={{ textAlign:"center" }}>{row.anciennete_annees}<span style={{ color:"rgba(244,197,66,0.4)" }}>a</span></td>
                  <td>
                    <span style={{ display:"inline-flex",alignItems:"center",gap:4,padding:"2px 9px",borderRadius:99,fontFamily:"var(--mono)",fontSize:12,fontWeight:800,background:`${scoreColor(row.score)}22`,color:scoreColor(row.score),border:`1px solid ${scoreColor(row.score)}45` }}>{row.score}</span>
                  </td>
                  <td>
                    {(() => {
                      const map = {FAIBLE:{c:"#e0c268",bg:"rgba(224,194,104,0.14)"},MODÉRÉ:{c:"#d4995a",bg:"rgba(212,153,90,0.14)"},ÉLEVÉ:{c:"#e06868",bg:"rgba(224,104,104,0.16)"}}
                      const s = map[row.niveau]||map.FAIBLE
                      return <span style={{ padding:"2px 9px",borderRadius:99,fontFamily:"var(--mono)",fontSize:10,fontWeight:700,letterSpacing:"1px",background:s.bg,color:s.c,border:`1px solid ${s.c}45` }}>{row.niveau}</span>
                    })()}
                  </td>
                  <td style={{ fontSize:12, color:scoreColor(row.score), fontWeight:600 }}>{row.decision}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ padding:"8px 22px", borderTop:"1px solid rgba(244,197,66,0.06)", background:"rgba(8,4,14,0.4)", fontFamily:"var(--mono)", fontSize:9, color:"rgba(244,197,66,0.22)", display:"flex", justifyContent:"space-between" }}>
        <span>{filtered.length} lignes · scroll vertical</span><span>↕</span>
      </div>
    </Card>
  )
}

// ── Upload screen ─────────────────────────────────────────────────────────────
function UploadScreen({ onData }) {
  const [drag, setDrag] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err,  setErr]  = useState(null)
  const ref = useRef(null)

  const handle = useCallback(f => {
    if (!f) return
    setBusy(true); setErr(null)
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const text = ev.target.result
        const lines = text.split(/\r?\n/).filter(l=>l.trim())
        const sep = lines[0].includes(";") ? ";" : ","
        const heads = lines[0].split(sep).map(h=>h.trim().replace(/^"|"$/g,"").replace(/^\uFEFF/,""))
        const rows = lines.slice(1).filter(l=>l.trim()).map(line => {
          const vals = line.split(sep).map(v=>v.trim().replace(/^"|"$/g,""))
          const obj = {}
          heads.forEach((h,i)=>{ obj[h]=vals[i]||"" })
          return obj
        })
        const needed = ["score","niveau","decision","montant_encours_tnd","secteur","region","delai_moyen_jours"]
        const miss = needed.filter(c=>!heads.includes(c))
        if (miss.length) { setErr(`Colonnes manquantes : ${miss.join(", ")}`); setBusy(false); return }
        const predictions = rows.map(r => ({
          ...r,
          score: Number(r.score)||0,
          montant_encours_tnd: Number(r.montant_encours_tnd)||0,
          ca_annuel_tnd: Number(r.ca_annuel_tnd)||0,
          delai_moyen_jours: Number(r.delai_moyen_jours)||0,
          anciennete_annees: Number(r.anciennete_annees)||0,
        }))
        setBusy(false)
        onData({ predictions, total: predictions.length })
      } catch { setErr("Erreur de lecture."); setBusy(false) }
    }
    reader.readAsText(f, "UTF-8")
  }, [onData])

  return (
    <div style={{ maxWidth:600, margin:"80px auto", padding:"0 40px" }}>
      <div style={{ textAlign:"center", marginBottom:44 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, justifyContent:"center", marginBottom:18 }}>
          <span style={{ fontFamily:"var(--mono)", fontSize:9, color:"rgba(244,197,66,0.4)", letterSpacing:"3px" }}>04</span>
          <div style={{ height:1, width:22, background:"rgba(244,197,66,0.2)" }}/>
          <span style={{ fontFamily:"var(--mono)", fontSize:9, color:"rgba(244,197,66,0.45)", letterSpacing:"2.5px", textTransform:"uppercase" }}>Dashboard analytique</span>
        </div>
        <h1 style={{ fontFamily:"var(--serif)", fontSize:"clamp(30px,4vw,50px)", fontWeight:400, letterSpacing:"-.03em", lineHeight:1.05, margin:"0 0 14px", color:"var(--ink)" }}>
          Intelligence du <span style={{ color:"var(--gold)", fontStyle:"italic" }}>portefeuille</span>
        </h1>
        <p style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--ink-mute)", lineHeight:1.8 }}>
          Uploadez le fichier CSV du Scoring Masse.<br/>Le dashboard se génère instantanément.
        </p>
      </div>

      <div
        onClick={()=>ref.current.click()}
        onDragOver={e=>{e.preventDefault();setDrag(true)}}
        onDragLeave={()=>setDrag(false)}
        onDrop={e=>{e.preventDefault();setDrag(false);handle(e.dataTransfer.files[0])}}
        style={{
          border:`2px dashed ${drag?"var(--gold)":"rgba(244,197,66,0.2)"}`,
          borderRadius:16, padding:"44px 28px", textAlign:"center", cursor:"pointer",
          background:drag?"rgba(244,197,66,0.03)":"rgba(12,7,22,0.5)",
          transition:"all .22s ease", backdropFilter:"blur(12px)"
        }}>
        <input ref={ref} type="file" accept=".csv" style={{ display:"none" }} onChange={e=>handle(e.target.files[0])}/>
        {busy ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
            <div style={{ width:32,height:32,borderRadius:"50%",border:"2px solid rgba(244,197,66,0.1)",borderTop:"2px solid var(--gold)",animation:"db-spin .9s linear infinite" }}/>
            <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--ink-mute)", letterSpacing:"2px" }}>LECTURE…</span>
          </div>
        ) : (
          <>
            <svg viewBox="0 0 48 48" width="36" style={{ margin:"0 auto 12px",display:"block",opacity:.28 }} fill="none" stroke="var(--gold)" strokeWidth="1.4">
              <path d="M8 32v8a4 4 0 0 0 4 4h24a4 4 0 0 0 4-4v-8"/><path d="M24 6v28M14 16l10-10 10 10"/>
            </svg>
            <div style={{ fontSize:13, color:"var(--ink-dim)", marginBottom:6 }}>Glissez votre fichier CSV ici</div>
            <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--ink-mute)" }}>ou cliquez · resultats_scoring_stbg.csv</div>
          </>
        )}
      </div>
      {err && <div style={{ marginTop:14,padding:"10px 14px",background:"rgba(122,45,58,0.1)",border:"1px solid rgba(122,45,58,0.3)",borderRadius:10,fontSize:12,color:"#a84050",lineHeight:1.6 }}>⚠ {err}</div>}
      <div style={{ marginTop:20,padding:"14px 18px",background:"rgba(244,197,66,0.025)",border:"1px solid rgba(244,197,66,0.1)",borderRadius:12 }}>
        <div style={{ fontFamily:"var(--mono)",fontSize:8,color:"rgba(244,197,66,0.35)",letterSpacing:"2px",marginBottom:8,textTransform:"uppercase" }}>Colonnes requises</div>
        <div style={{ display:"flex",flexWrap:"wrap",gap:5 }}>
          {["score","niveau","decision","secteur","region","montant_encours_tnd","delai_moyen_jours"].map(c=>(
            <span key={c} style={{ padding:"2px 8px",borderRadius:99,background:"rgba(244,197,66,0.06)",border:"1px solid rgba(244,197,66,0.14)",fontFamily:"var(--mono)",fontSize:9,color:"rgba(244,197,66,0.45)" }}>{c}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
// ── Export helper — header derived from the data itself, so it can never
// drift out of alignment with the values (the bug that hit the batch export) ──
function exportDashboardCSV(predictions) {
  if (!predictions?.length) return
  const cols = Object.keys(predictions[0])
  const sep = ";"
  const header = cols.join(sep)
  const rows = predictions.map(row =>
    cols.map(h => {
      let v = row[h] ?? ""
      if (typeof v === "string" && (v.includes(sep) || v.includes('"'))) v = `"${v.replace(/"/g,'""')}"`
      return v
    }).join(sep)
  )
  const content = [header, ...rows].join("\r\n")
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(new Blob(["\uFEFF"+content], { type:"text/csv;charset=utf-8;" })),
    download: "dashboard_stbgrisk.csv"
  })
  a.click(); URL.revokeObjectURL(a.href)
}

export default function DashboardPage() {
  const [data,      setData]      = useState(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [tabKey,    setTabKey]    = useState(0)

  // Re-trigger reveals on every tab switch
  useReveal(tabKey)

  const switchTab = useCallback(key => {
    setActiveTab(key)
    setTabKey(k => k+1)
  }, [])

  const stats = useMemo(() => {
    if (!data) return null
    const p = data.predictions
    const scores  = p.map(r => Number(r.score)||0)
    const avg     = scores.reduce((a,b)=>a+b,0)/p.length
    const faible  = p.filter(r=>r.niveau==="FAIBLE").length
    const modere  = p.filter(r=>r.niveau==="MODÉRÉ").length
    const eleve   = p.filter(r=>r.niveau==="ÉLEVÉ").length
    const encours = p.reduce((s,r)=>s+(Number(r.montant_encours_tnd)||0),0)
    const delai   = p.reduce((s,r)=>s+(Number(r.delai_moyen_jours)||0),0)/p.length
    const ca      = p.reduce((s,r)=>s+(Number(r.ca_annuel_tnd)||0),0)

    const hist = [
      {label:"0–20",   count:scores.filter(s=>s<=20).length},
      {label:"20–40",  count:scores.filter(s=>s>20&&s<=40).length},
      {label:"40–60",  count:scores.filter(s=>s>40&&s<=60).length},
      {label:"60–80",  count:scores.filter(s=>s>60&&s<=80).length},
      {label:"80–100", count:scores.filter(s=>s>80).length},
    ]

    const secteurs = [...new Set(p.map(r=>r.secteur))].filter(Boolean).map(sec=>{
      const g = p.filter(r=>r.secteur===sec)
      return {name:sec, avg:g.reduce((a,r)=>a+r.score,0)/g.length, count:g.length, encours:g.reduce((a,r)=>a+(Number(r.montant_encours_tnd)||0),0), eleve:g.filter(r=>r.niveau==="ÉLEVÉ").length}
    }).sort((a,b)=>b.avg-a.avg)

    const regions = [...new Set(p.map(r=>r.region))].filter(Boolean).map(reg=>{
      const g = p.filter(r=>r.region===reg)
      return {name:reg, avg:g.reduce((a,r)=>a+r.score,0)/g.length, count:g.length, encours:g.reduce((a,r)=>a+(Number(r.montant_encours_tnd)||0),0)}
    }).sort((a,b)=>b.avg-a.avg)

    const banques = [...new Set(p.map(r=>r.banque_domiciliation))].filter(Boolean).map(b=>{
      const g = p.filter(r=>r.banque_domiciliation===b)
      return {name:b, avg:g.reduce((a,r)=>a+r.score,0)/g.length, count:g.length}
    }).sort((a,b)=>b.avg-a.avg).slice(0,8)

    const typesClient = [...new Set(p.map(r=>r.type_client))].filter(Boolean).map(tc=>{
      const g = p.filter(r=>r.type_client===tc)
      return {name:tc, avg:g.reduce((a,r)=>a+r.score,0)/g.length, count:g.length, encours:g.reduce((a,r)=>a+(Number(r.montant_encours_tnd)||0),0)}
    }).sort((a,b)=>b.avg-a.avg)

    const top10  = [...p].sort((a,b)=>b.score-a.score).slice(0,10)
    const avgColor = avg<=30?"#c9a84c":avg<=60?"#a06028":"#7a2d3a"
    const taux_risque = Math.round(eleve/p.length*100)

    return { p, scores, avg, avgColor, faible, modere, eleve, encours, ca, delai, hist, secteurs, regions, banques, typesClient, top10, total:p.length, taux_risque }
  }, [data])

  const TABS = [
    {key:"overview", label:"Vue d'ensemble"},
    {key:"clients",  label:"Clients"},
    {key:"risques",  label:"Risques"},
    {key:"secteurs", label:"Secteurs"},
    {key:"regions",  label:"Régions"},
  ]

  if (!data) return (
    <>
      <Bubbles/>
      <style>{`@keyframes db-spin{to{transform:rotate(360deg)}}`}</style>
      <UploadScreen onData={setData}/>
    </>
  )

  return (
    <>
      <Bubbles/>
      <style>{`
        .db{opacity:1;transform:translate3d(0,0,0)}
        .db.db-anim{opacity:0;transform:translate3d(0,16px,0)}
        .db.db-anim.db-in{opacity:1;transform:translate3d(0,0,0);transition:opacity .5s cubic-bezier(0.16,1,0.3,1),transform .5s cubic-bezier(0.16,1,0.3,1)}
        .db-d1{transition-delay:.07s}.db-d2{transition-delay:.14s}.db-d3{transition-delay:.21s}.db-d4{transition-delay:.28s}.db-d5{transition-delay:.35s}
        .tab-btn:hover{color:var(--ink)!important}
        .stbg-scroll::-webkit-scrollbar{width:4px;height:4px}
        .stbg-scroll::-webkit-scrollbar-track{background:transparent}
        .stbg-scroll::-webkit-scrollbar-thumb{background:rgba(201,168,76,0.2);border-radius:99px}
        @keyframes db-spin{to{transform:rotate(360deg)}}
      `}</style>

      <section style={{ padding:"100px 40px 100px", maxWidth:1280, margin:"0 auto" }}>

        {/* Header */}
        <div className="db" style={{ marginBottom:36 }}>
          <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", flexWrap:"wrap", gap:18 }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                <span style={{ fontFamily:"var(--mono)", fontSize:9, color:"rgba(244,197,66,0.38)", letterSpacing:"3px" }}>04</span>
                <div style={{ height:1, width:22, background:"rgba(244,197,66,0.2)" }}/>
                <span style={{ fontFamily:"var(--mono)", fontSize:9, color:"rgba(244,197,66,0.42)", letterSpacing:"2.5px", textTransform:"uppercase" }}>Dashboard analytique</span>
              </div>
              <h1 style={{ fontFamily:"var(--serif)", fontSize:"clamp(28px,4vw,52px)", fontWeight:400, letterSpacing:"-.03em", lineHeight:1.05, margin:0, color:"var(--ink)" }}>
                Intelligence du <span style={{ color:"var(--gold)", fontStyle:"italic" }}>portefeuille</span>
              </h1>
            </div>
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              <div style={{ display:"flex", alignItems:"center", gap:7, padding:"7px 13px", background:"rgba(92,184,116,0.06)", border:"1px solid rgba(92,184,116,0.18)", borderRadius:10 }}>
                <div style={{ width:6,height:6,borderRadius:"50%",background:"#5cb874",boxShadow:"0 0 8px #5cb874",animation:"pulse 2s infinite" }}/>
                <span style={{ fontFamily:"var(--mono)", fontSize:9, color:"#5cb874", letterSpacing:"1.5px" }}>{stats.total} CLIENTS</span>
              </div>
              <button onClick={()=>exportDashboardCSV(stats.p)} style={{
                padding:"7px 14px",borderRadius:10,border:"1px solid rgba(201,168,76,0.2)",
                background:"rgba(201,168,76,0.05)",color:"var(--gold)",
                fontFamily:"var(--mono)",fontSize:9,letterSpacing:"1px",cursor:"pointer",transition:"all .2s"
              }}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(201,168,76,0.12)";e.currentTarget.style.borderColor="rgba(201,168,76,0.4)"}}
                onMouseLeave={e=>{e.currentTarget.style.background="rgba(201,168,76,0.05)";e.currentTarget.style.borderColor="rgba(201,168,76,0.2)"}}
              >↓ Exporter</button>
              <button onClick={()=>setData(null)} style={{
                padding:"7px 14px",borderRadius:10,border:"1px solid rgba(244,197,66,0.14)",
                background:"rgba(244,197,66,0.04)",color:"rgba(244,197,66,0.55)",
                fontFamily:"var(--mono)",fontSize:9,letterSpacing:"1px",cursor:"pointer",transition:"all .2s"
              }}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(244,197,66,0.09)";e.currentTarget.style.color="var(--gold)"}}
                onMouseLeave={e=>{e.currentTarget.style.background="rgba(244,197,66,0.04)";e.currentTarget.style.color="rgba(244,197,66,0.55)"}}
              >↑ Changer</button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="db db-d1" style={{ display:"flex", gap:3, marginBottom:32, borderBottom:"1px solid rgba(244,197,66,0.08)" }}>
          {TABS.map(tab => {
            const on = activeTab===tab.key
            return (
              <button key={tab.key} className="tab-btn" onClick={()=>switchTab(tab.key)} style={{
                padding:"9px 18px", borderRadius:"7px 7px 0 0",
                fontFamily:"var(--mono)", fontSize:10, letterSpacing:"1px", textTransform:"uppercase",
                border:`1px solid ${on?"rgba(244,197,66,0.2)":"transparent"}`,
                borderBottom:on?"1px solid rgba(10,6,18,1)":"1px solid transparent",
                background:on?"rgba(22,14,36,0.95)":"transparent",
                color:on?"var(--gold)":"rgba(244,197,66,0.3)",
                cursor:"pointer", transition:"all .2s ease", marginBottom:on?-1:0
              }}>{tab.label}</button>
            )
          })}
        </div>

        {/* ── TAB: Vue d'ensemble ── */}
        {activeTab === "overview" && (<>
          <Sec label="Indicateurs clés" num="01">
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
              {[
                {label:"Encours total",        iconKey:"encours", value:<Counter to={stats.encours/1e6} decimals={1} suffix=" M"/>,   sub:"dinars tunisiens",                                     color:"#c9a84c"},
                {label:"Score moyen",           iconKey:"score", value:<Counter to={stats.avg} decimals={1}/>,                       sub:"/ 100 — portefeuille",                                  color:stats.avgColor},
                {label:"Taux risque élevé",    iconKey:"risque", value:<Counter to={stats.taux_risque} suffix="%"/>,                 sub:`${stats.eleve} clients refusés`,                        color:"#7a2d3a"},
                {label:"Délai moyen paiement", iconKey:"delai",  value:<Counter to={stats.delai} decimals={1} suffix=" j"/>,          sub:"jours moyens",                                          color:"#a06028"},
              ].map((k,i) => <div key={i} className={`db db-d${i+1}`}><KPI {...k}/></div>)}
            </div>
          </Sec>

          <Sec label="Indicateurs secondaires" num="02">
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
              {[
                {label:"CA total portefeuille", iconKey:"ca", value:<Counter to={stats.ca/1e6} decimals={1} suffix=" M"/>,        sub:"TND",                                                   color:"#c9a84c"},
                {label:"Clients FAIBLE",        iconKey:"check",  value:<Counter to={stats.faible}/>,                                 sub:`${Math.round(stats.faible/stats.total*100)}% — accordés`, color:"#c9a84c"},
                {label:"Clients MODÉRÉ",        iconKey:"mid",  value:<Counter to={stats.modere}/>,                                 sub:`${Math.round(stats.modere/stats.total*100)}% — garanties`, color:"#a06028"},
                {label:"Clients ÉLEVÉ",         iconKey:"up",  value:<Counter to={stats.eleve}/>,                                  sub:`${Math.round(stats.eleve/stats.total*100)}% — refusés`,   color:"#7a2d3a"},
              ].map((k,i) => <div key={i} className={`db db-d${i+1}`}><KPI {...k}/></div>)}
            </div>
          </Sec>

          <Sec label="Distribution & répartition" num="03">
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <div className="db db-d1">
                <Card>
                  <CH title="Distribution des scores"/>
                  <Histogram data={stats.hist}/>
                </Card>
              </div>
              <div className="db db-d2">
                <Card>
                  <CH title="Mix du portefeuille"/>
                  <Ring faible={stats.faible} modere={stats.modere} eleve={stats.eleve} total={stats.total}/>
                </Card>
              </div>
            </div>
          </Sec>

          <Sec label="Risque sectoriel" num="04">
            <div className="db db-d1">
              <Card>
                <CH title="Score moyen par secteur"/>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 40px" }}>
                  {stats.secteurs.map((s,i) => (
                    <ScoreGauge key={s.name} label={`${s.name} (${s.count})`} value={s.avg} delay={i*50}/>
                  ))}
                </div>
              </Card>
            </div>
          </Sec>

          <Sec label="Surveillance prioritaire" num="05">
            <div className="db">
              <Card style={{ padding:0, overflow:"hidden" }}>
                <div style={{ padding:"18px 24px 12px", borderBottom:"1px solid rgba(244,197,66,0.08)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontFamily:"var(--serif)", fontSize:16, color:"var(--ink)", marginBottom:2 }}>Top 10 — Risque élevé</div>
                    
                  </div>
                  <span style={{ padding:"3px 12px",borderRadius:99,background:"rgba(122,45,58,0.15)",border:"1px solid rgba(122,45,58,0.28)",fontFamily:"var(--mono)",fontSize:10,color:"#a84050" }}>{stats.eleve} ÉLEVÉ</span>
                </div>
                <div className="stbg-scroll" style={{ overflowX:"auto" }}>
                  <table className="stbg-table">
                    <thead><tr>
                      {["N°","Client","Secteur","Région","Encours","Score","Décision"].map(h=><th key={h}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {stats.top10.map((row,i)=>(
                        <tr key={i}>
                          <td className="muted">{String(i+1).padStart(2,"0")}</td>
                          <td style={{ fontWeight:600 }}>{(row.prenom||row.nom)?`${row.prenom||""} ${row.nom||""}`.trim():<span style={{ color:"rgba(244,197,66,0.25)",fontStyle:"italic",fontSize:11 }}>—</span>}</td>
                          <td className="dim">{row.secteur}</td>
                          <td className="dim">{row.region}</td>
                          <td className="mono" style={{ whiteSpace:"nowrap" }}>{Number(row.montant_encours_tnd||0).toLocaleString("fr-TN")} <span style={{ color:"rgba(244,197,66,0.4)" }}>TND</span></td>
                          <td><span style={{ display:"inline-flex",alignItems:"center",gap:4,padding:"2px 9px",borderRadius:99,fontFamily:"var(--mono)",fontSize:12,fontWeight:800,background:"rgba(224,104,104,0.18)",color:"#e06868",border:"1px solid rgba(224,104,104,0.45)" }}>{row.score}</span></td>
                          <td style={{ fontSize:12,color:"#e06868",fontWeight:600 }}>{row.decision}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </Sec>
        </>)}

        {/* ── TAB: Clients ── */}
        {activeTab === "clients" && (
          <Sec label="Tous les clients" num="01">
            <div className="db">
              <ClientTable predictions={stats.p}/>
            </div>
          </Sec>
        )}

        {/* ── TAB: Risques ── */}
        {activeTab === "risques" && (<>
          <Sec label="Répartition des niveaux" num="01">
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
              {[
                {label:"FAIBLE",  val:stats.faible, color:"#c9a84c", desc:"Accorder le crédit",     pct:Math.round(stats.faible/stats.total*100)},
                {label:"MODÉRÉ",  val:stats.modere, color:"#a06028", desc:"Accorder avec garanties", pct:Math.round(stats.modere/stats.total*100)},
                {label:"ÉLEVÉ",   val:stats.eleve,  color:"#7a2d3a", desc:"Refuser le crédit",       pct:Math.round(stats.eleve/stats.total*100)},
              ].map((x,i) => (
                <div key={i} className={`db db-d${i+1}`}>
                  <div style={{ padding:"26px 24px",background:"linear-gradient(160deg,rgba(28,18,44,0.9),rgba(16,10,28,0.95))",border:`1px solid ${x.color}15`,borderTop:`3px solid ${x.color}`,borderRadius:14,textAlign:"center" }}>
                    <div style={{ fontFamily:"var(--serif)", fontSize:62, color:x.color, lineHeight:1, marginBottom:8 }}><Counter to={x.val} duration={900}/></div>
                    <div style={{ fontFamily:"var(--mono)", fontSize:8, color:"rgba(244,197,66,0.32)", letterSpacing:"2.5px", textTransform:"uppercase", marginBottom:16 }}>{x.label}</div>
                    <div style={{ height:5, background:"rgba(244,197,66,0.06)", borderRadius:99, overflow:"hidden", marginBottom:10 }}>
                      <div style={{ height:"100%", width:`${x.pct}%`, background:x.color, borderRadius:99, boxShadow:`0 0 10px ${x.color}45`, transition:"width 1.2s cubic-bezier(0.34,1.56,0.64,1) .3s" }}/>
                    </div>
                    <div style={{ fontFamily:"var(--serif)", fontSize:22, color:x.color, marginBottom:6 }}>{x.pct}%</div>
                    <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--ink-mute)" }}>{x.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </Sec>

          <Sec label="Distribution des scores" num="02">
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <div className="db db-d1">
                <Card>
                  <CH title="Histogramme des scores"/>
                  <Histogram data={stats.hist}/>
                </Card>
              </div>
              <div className="db db-d2">
                <Card>
                  <CH title="Mix portefeuille"/>
                  <Ring faible={stats.faible} modere={stats.modere} eleve={stats.eleve} total={stats.total}/>
                </Card>
              </div>
            </div>
          </Sec>

          <Sec label="Top 10 à surveiller" num="03">
            <div className="db">
              <Card style={{ padding:0, overflow:"hidden" }}>
                <div style={{ padding:"18px 24px 12px",borderBottom:"1px solid rgba(244,197,66,0.08)" }}>
                  <div style={{ fontFamily:"var(--serif)", fontSize:16, color:"var(--ink)", marginBottom:2 }}>Surveillance prioritaire</div>
                  
                </div>
                <div className="stbg-scroll" style={{ overflowX:"auto" }}>
                  <table className="stbg-table">
                    <thead><tr>
                      {["N°","Client","Secteur","Région","Score","Niveau","Décision"].map(h=><th key={h}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {stats.top10.map((row,i)=>(
                        <tr key={i}>
                          <td className="muted">{String(i+1).padStart(2,"0")}</td>
                          <td style={{ fontWeight:600 }}>{(row.prenom||row.nom)?`${row.prenom||""} ${row.nom||""}`.trim():<span style={{ color:"rgba(244,197,66,0.25)",fontStyle:"italic" }}>—</span>}</td>
                          <td className="dim">{row.secteur}</td>
                          <td className="dim">{row.region}</td>
                          <td><span style={{ padding:"2px 9px",borderRadius:99,fontFamily:"var(--mono)",fontSize:12,fontWeight:800,background:"rgba(224,104,104,0.18)",color:"#e06868",border:"1px solid rgba(224,104,104,0.45)" }}>{row.score}</span></td>
                          <td><span style={{ padding:"2px 9px",borderRadius:99,fontFamily:"var(--mono)",fontSize:10,fontWeight:700,background:"rgba(224,104,104,0.14)",color:"#e06868",border:"1px solid rgba(224,104,104,0.4)" }}>ÉLEVÉ</span></td>
                          <td style={{ fontSize:12,color:"#e06868",fontWeight:600 }}>{row.decision}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </Sec>
        </>)}

        {/* ── TAB: Secteurs ── */}
        {activeTab === "secteurs" && (<>
          <Sec label="Analyse sectorielle complète" num="01">
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <div className="db db-d1">
                <Card>
                  <CH title="Score moyen par secteur"/>
                  {stats.secteurs.map((s,i)=>(
                    <HBar key={s.name} label={s.name} value={s.avg} max={100}
                      color={s.avg<=30?"#c9a84c":s.avg<=60?"#a06028":"#7a2d3a"}
                      sub={`${s.count} clients`} delay={i*55}/>
                  ))}
                </Card>
              </div>
              <div className="db db-d2">
                <Card>
                  <CH title="Exposition financière"/>
                  {stats.secteurs.map((s,i)=>(
                    <HBar key={s.name} label={s.name} value={s.encours/1e6}
                      max={Math.max(...stats.secteurs.map(x=>x.encours/1e6),1)}
                      color="#c9a84c" sub={`${s.count} clients`} delay={i*55}/>
                  ))}
                </Card>
              </div>
            </div>
          </Sec>

          <Sec label="Taux de risque élevé par secteur" num="02">
            <div className="db db-d1">
              <Card>
                <CH title="Part de clients ÉLEVÉ par secteur"/>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 40px" }}>
                  {stats.secteurs.map((s,i)=>{
                    const pct = s.count > 0 ? (s.eleve/s.count)*100 : 0
                    return <HBar key={s.name} label={s.name} value={pct} max={100}
                      color={pct<=20?"#c9a84c":pct<=50?"#a06028":"#7a2d3a"}
                      sub={`${s.eleve}/${s.count}`} delay={i*55}/>
                  })}
                </div>
              </Card>
            </div>
          </Sec>
        </>)}

        {/* ── TAB: Régions ── */}
        {activeTab === "regions" && (<>
          <Sec label="Analyse régionale complète" num="01">
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <div className="db db-d1">
                <Card>
                  <CH title="Score moyen par région"/>
                  {stats.regions.map((r,i)=>(
                    <HBar key={r.name} label={r.name} value={r.avg} max={100}
                      color={r.avg<=30?"#c9a84c":r.avg<=60?"#a06028":"#7a2d3a"}
                      sub={`${r.count} client${r.count>1?"s":""}`} delay={i*50}/>
                  ))}
                </Card>
              </div>
              <div className="db db-d2">
                <Card>
                  <CH title="Exposition par région"/>
                  {stats.regions.map((r,i)=>(
                    <HBar key={r.name} label={r.name} value={r.encours/1e6}
                      max={Math.max(...stats.regions.map(x=>x.encours/1e6),1)}
                      color="#c9a84c" sub={`${r.count} clients`} delay={i*50}/>
                  ))}
                </Card>
              </div>
            </div>
          </Sec>

          {stats.banques.length > 0 && (
            <Sec label="Analyse par banque domiciliataire" num="02">
              <div className="db db-d1">
                <Card>
                  <CH title="Score moyen par banque"/>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 40px" }}>
                    {stats.banques.map((b,i)=>(
                      <HBar key={b.name} label={b.name} value={b.avg} max={100}
                        color={b.avg<=30?"#c9a84c":b.avg<=60?"#a06028":"#7a2d3a"}
                        sub={`${b.count} clients`} delay={i*55}/>
                    ))}
                  </div>
                </Card>
              </div>
            </Sec>
          )}

          {stats.typesClient.length > 0 && (
            <Sec label="Analyse par type de client" num="03">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <div className="db db-d1">
                  <Card>
                    <CH title="Score moyen par type"/>
                    {stats.typesClient.map((tc,i)=>(
                      <HBar key={tc.name} label={tc.name} value={tc.avg} max={100}
                        color={tc.avg<=30?"#c9a84c":tc.avg<=60?"#a06028":"#7a2d3a"}
                        sub={`${tc.count} clients`} delay={i*55}/>
                    ))}
                  </Card>
                </div>
                <div className="db db-d2">
                  <Card>
                    <CH title="Exposition par type"/>
                    {stats.typesClient.map((tc,i)=>(
                      <HBar key={tc.name} label={tc.name} value={tc.encours/1e6}
                        max={Math.max(...stats.typesClient.map(x=>x.encours/1e6),1)}
                        color="#c9a84c" sub={`${tc.count} clients`} delay={i*55}/>
                    ))}
                  </Card>
                </div>
              </div>
            </Sec>
          )}
        </>)}

      </section>
    </>
  )
}