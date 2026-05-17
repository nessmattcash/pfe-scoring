import { useState, useRef, useMemo, useEffect } from "react"
import axios from "axios"

function useReveal() {
  useEffect(() => {
    const t = setTimeout(() => {
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("mr-in"); io.unobserve(e.target) } })
      }, { threshold: 0.05 })
      document.querySelectorAll(".mr").forEach(el => io.observe(el))
      return () => io.disconnect()
    }, 40)
    return () => clearTimeout(t)
  }, [])
}

function BubbleField() {
  const b = useMemo(() => Array.from({ length: 12 }, () => ({
    left: Math.random()*100, size: 4+Math.random()*10,
    dur: 9+Math.random()*10, delay: -Math.random()*12,
  })), [])
  return (
    <div className="bubble-field">
      {b.map((x,i) => <div key={i} className="bubble" style={{ left:`${x.left}%`, width:x.size, height:x.size, animationDuration:`${x.dur}s`, animationDelay:`${x.delay}s` }}/>)}
    </div>
  )
}

function KPI({ label, value, sub, color }) {
  return (
    <div style={{ padding:"18px 20px", background:"rgba(8,4,16,0.7)", border:`1px solid rgba(244,197,66,0.1)`, borderLeft:`3px solid ${color}`, borderRadius:12, transition:"border-color .3s" }}>
      <div style={{ fontFamily:"var(--mono)", fontSize:9, letterSpacing:"2.5px", textTransform:"uppercase", color:"var(--ink-mute)", marginBottom:10 }}>{label}</div>
      <div style={{ fontFamily:"var(--serif)", fontSize:32, color, lineHeight:1, marginBottom:5 }}>{value}</div>
      {sub && <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--ink-mute)" }}>{sub}</div>}
    </div>
  )
}

function SBadge({ score }) {
  const c  = score<=30?"#c9a84c":score<=60?"#a87840":"#8a3030"
  const bg = score<=30?"rgba(201,168,76,0.12)":score<=60?"rgba(168,120,64,0.12)":"rgba(138,48,48,0.15)"
  const br = score<=30?"rgba(201,168,76,0.3)":score<=60?"rgba(168,120,64,0.3)":"rgba(138,48,48,0.35)"
  return (
    <span style={{ display:"inline-flex",alignItems:"center",gap:5,padding:"3px 11px",borderRadius:99,background:bg,color:c,fontFamily:"var(--mono)",fontSize:12,fontWeight:800,border:`1px solid ${br}`,letterSpacing:".5px" }}>
      {score}
    </span>
  )
}

function LBadge({ niveau }) {
  const map = {
    FAIBLE:  { c:"#c9a84c", bg:"rgba(201,168,76,0.08)",  br:"rgba(201,168,76,0.25)",  label:"Faible"  },
    MODÉRÉ:  { c:"#a87030", bg:"rgba(168,112,48,0.1)",   br:"rgba(168,112,48,0.28)",  label:"Modéré"  },
    ÉLEVÉ:   { c:"#8a2828", bg:"rgba(122,45,58,0.15)",   br:"rgba(122,45,58,0.4)",    label:"Élevé"   },
  }
  const s = map[niveau]||map.FAIBLE
  return (
    <span style={{ display:"inline-block",padding:"3px 11px",borderRadius:99,background:s.bg,color:s.c,fontFamily:"var(--mono)",fontSize:10,fontWeight:700,letterSpacing:"1.5px",border:`1px solid ${s.br}`,textTransform:"uppercase" }}>{s.label}</span>
  )
}

function RingChart({ faible, modere, eleve, total }) {
  const r = 52, cx = 60, cy = 60, circ = 2*Math.PI*r
  const segs = [
    { pct:faible/total, c:"#c9a84c", label:"Faible",  n:faible },
    { pct:modere/total, c:"#7a4020", label:"Modéré",  n:modere },
    { pct:eleve/total,  c:"#7a2d3a", label:"Élevé",   n:eleve  },
  ]
  let offset = 0
  return (
    <div style={{ display:"flex", alignItems:"center", gap:28 }}>
      <div style={{ position:"relative", flexShrink:0 }}>
        <svg width={120} height={120}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(244,197,66,0.05)" strokeWidth={14}/>
          {segs.map((s,i) => {
            const dash = s.pct*circ
            const el = (
              <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                stroke={s.c} strokeWidth={14}
                strokeDasharray={`${dash} ${circ-dash}`}
                strokeDashoffset={-(offset*circ - circ/4)}
                style={{ transition:"stroke-dasharray .8s cubic-bezier(0.34,1.56,0.64,1)" }}
                strokeLinecap="butt"/>
            )
            offset += s.pct; return el
          })}
          <text x={cx} y={cy-6} textAnchor="middle" fontFamily="var(--serif)" fontSize={22} fill="var(--gold)">{total}</text>
          <text x={cx} y={cy+10} textAnchor="middle" fontFamily="var(--mono)" fontSize={7} fill="var(--ink-mute)" letterSpacing="2">CLIENTS</text>
        </svg>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {segs.map(s => (
          <div key={s.label} style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:10, height:10, borderRadius:3, background:s.c, flexShrink:0, boxShadow:`0 0 6px ${s.c}60` }}/>
            <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--ink-mute)", minWidth:50 }}>{s.label}</span>
            <span style={{ fontFamily:"var(--serif)", fontSize:18, color:s.c, minWidth:28 }}>{s.n}</span>
            <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"rgba(244,197,66,0.3)" }}>{Math.round(s.pct*100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ResultsTable({ predictions }) {
  const [filter, setFilter] = useState("ALL")
  const [sortBy, setSortBy] = useState("score")
  const [sortDir,setSortDir]= useState("desc")

  const filtered = useMemo(() => {
    let d = [...predictions]
    if (filter!=="ALL") d = d.filter(r=>r.niveau===filter)
    d.sort((a,b)=>sortDir==="desc"?b[sortBy]-a[sortBy]:a[sortBy]-b[sortBy])
    return d
  }, [predictions,filter,sortBy,sortDir])

  const toggleSort = col => {
    if (sortBy===col) setSortDir(d=>d==="desc"?"asc":"desc")
    else { setSortBy(col); setSortDir("desc") }
  }

  const COLS = [
    { key:"idx",                 label:"N°",         sortable:false },
    { key:"prenom",              label:"Prénom",      sortable:false },
    { key:"nom",                 label:"Nom",         sortable:false },
    { key:"secteur",             label:"Secteur",     sortable:false },
    { key:"region",              label:"Région",      sortable:false },
    { key:"montant_encours_tnd", label:"Encours",     sortable:true  },
    { key:"ca_annuel_tnd",       label:"CA annuel",   sortable:true  },
    { key:"anciennete_annees",   label:"Anc.",        sortable:true  },
    { key:"score",               label:"Score",       sortable:true  },
    { key:"niveau",              label:"Niveau",      sortable:false },
    { key:"decision",            label:"Décision",    sortable:false },
  ]

  const fmtN = n => Number(n).toLocaleString("fr-TN")

  const filterBtns = [
    { key:"ALL",    label:"Tous",   count:predictions.length,                              c:"var(--gold)"  },
    { key:"FAIBLE", label:"Faible", count:predictions.filter(r=>r.niveau==="FAIBLE").length, c:"#c9a84c"    },
    { key:"MODÉRÉ", label:"Modéré", count:predictions.filter(r=>r.niveau==="MODÉRÉ").length, c:"#a87030"    },
    { key:"ÉLEVÉ",  label:"Élevé",  count:predictions.filter(r=>r.niveau==="ÉLEVÉ").length,  c:"#7a2d3a"    },
  ]

  return (
    <div>
      <div style={{ display:"flex", gap:6, marginBottom:16, alignItems:"center", flexWrap:"wrap" }}>
        {filterBtns.map(({ key, label, count, c }) => {
          const on = filter===key
          return (
            <button key={key} onClick={()=>setFilter(key)} style={{
              padding:"5px 14px", borderRadius:99, cursor:"pointer",
              fontFamily:"var(--mono)", fontSize:10, letterSpacing:"1px",
              border:on?`1px solid ${c}`:"1px solid rgba(244,197,66,0.1)",
              background:on?`${c}18`:"transparent",
              color:on?c:"var(--ink-mute)",
              transition:"all .2s ease", display:"flex", alignItems:"center", gap:5
            }}>
              {label}
              <span style={{ padding:"1px 6px",borderRadius:99,fontSize:9,background:on?`${c}28`:"rgba(255,255,255,0.03)",color:on?c:"var(--ink-mute)" }}>{count}</span>
            </button>
          )
        })}
        <span style={{ marginLeft:"auto", fontFamily:"var(--mono)", fontSize:9, color:"rgba(244,197,66,0.25)", letterSpacing:"1px" }}>{filtered.length} entrées</span>
      </div>

      <div style={{ borderRadius:14, border:"1px solid rgba(244,197,66,0.1)", background:"rgba(5,3,10,0.6)", overflow:"hidden", boxShadow:"0 8px 40px rgba(0,0,0,0.4)" }}>
        <div style={{ overflowX:"auto", overflowY:"auto", maxHeight:460 }} className="stbg-scroll">
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:920 }}>
            <thead>
              <tr style={{ background:"rgba(10,6,18,0.98)", borderBottom:"1px solid rgba(244,197,66,0.12)" }}>
                {COLS.map(col => (
                  <th key={col.key}
                    onClick={col.sortable?()=>toggleSort(col.key):undefined}
                    style={{
                      padding:"11px 14px", textAlign:"left", whiteSpace:"nowrap",
                      fontFamily:"var(--mono)", fontSize:8, letterSpacing:"2px",
                      textTransform:"uppercase",
                      color:sortBy===col.key?"var(--gold)":"rgba(244,197,66,0.3)",
                      cursor:col.sortable?"pointer":"default",
                      userSelect:"none", position:"sticky", top:0, background:"rgba(10,6,18,0.98)",
                      transition:"color .15s",
                      borderBottom:sortBy===col.key?"2px solid rgba(244,197,66,0.4)":"2px solid transparent"
                    }}>
                    <span style={{ display:"inline-flex",alignItems:"center",gap:4 }}>
                      {col.label}
                      {sortBy===col.key && <span style={{ fontSize:10,color:"var(--gold)" }}>{sortDir==="desc"?"↓":"↑"}</span>}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row,i) => (
                <tr key={i}
                  style={{ borderBottom:"1px solid rgba(244,197,66,0.04)", background:i%2===0?"rgba(244,197,66,0.012)":"transparent", transition:"background .15s" }}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(244,197,66,0.04)"}
                  onMouseLeave={e=>e.currentTarget.style.background=i%2===0?"rgba(244,197,66,0.012)":"transparent"}
                >
                  <td style={{ padding:"10px 14px",fontSize:9,color:"rgba(244,197,66,0.25)",fontFamily:"var(--mono)" }}>{String(i+1).padStart(2,"0")}</td>
                  <td style={{ padding:"10px 14px",fontSize:12,color:"var(--ink-dim)",whiteSpace:"nowrap" }}>{row.prenom||<span style={{ color:"rgba(244,197,66,0.2)",fontStyle:"italic",fontSize:10 }}>—</span>}</td>
                  <td style={{ padding:"10px 14px",fontSize:12,color:"var(--ink)",fontWeight:500,whiteSpace:"nowrap" }}>{row.nom||<span style={{ color:"rgba(244,197,66,0.2)",fontStyle:"italic",fontSize:10 }}>—</span>}</td>
                  <td style={{ padding:"10px 14px",fontSize:11,color:"var(--ink-dim)",whiteSpace:"nowrap" }}>{row.secteur}</td>
                  <td style={{ padding:"10px 14px",fontSize:11,color:"var(--ink-dim)",whiteSpace:"nowrap" }}>{row.region}</td>
                  <td style={{ padding:"10px 14px",fontFamily:"var(--mono)",fontSize:11,color:"var(--ink-dim)",whiteSpace:"nowrap" }}>{fmtN(row.montant_encours_tnd)} <span style={{ fontSize:9,color:"rgba(244,197,66,0.3)" }}>TND</span></td>
                  <td style={{ padding:"10px 14px",fontFamily:"var(--mono)",fontSize:11,color:"var(--ink-dim)",whiteSpace:"nowrap" }}>{fmtN(row.ca_annuel_tnd)} <span style={{ fontSize:9,color:"rgba(244,197,66,0.3)" }}>TND</span></td>
                  <td style={{ padding:"10px 14px",fontFamily:"var(--mono)",fontSize:11,color:"var(--ink-dim)",textAlign:"center" }}>{row.anciennete_annees}<span style={{ fontSize:9,color:"rgba(244,197,66,0.3)" }}>a</span></td>
                  <td style={{ padding:"10px 14px" }}><SBadge score={row.score}/></td>
                  <td style={{ padding:"10px 14px" }}><LBadge niveau={row.niveau}/></td>
                  <td style={{ padding:"10px 14px",fontSize:11,color:row.score<=30?"#c9a84c":row.score<=60?"#a87030":"#7a2d3a",whiteSpace:"nowrap",fontWeight:500 }}>{row.decision}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function MassScoringPage() {
  useReveal()

  const [file,       setFile]       = useState(null)
  const [preview,    setPreview]    = useState(null)
  const [csvHeaders, setCsvHeaders] = useState([])
  const [loading,    setLoading]    = useState(false)
  const [progress,   setProgress]   = useState(0)
  const [stage,      setStage]      = useState("")
  const [results,    setResults]    = useState(null)
  const [error,      setError]      = useState(null)
  const [dragOver,   setDragOver]   = useState(false)
  const fileRef = useRef(null)

  const parseFile = f => {
    if (!f?.name.endsWith(".csv")) { setError("Format attendu : .csv uniquement"); return }
    setFile(f); setError(null); setResults(null); setPreview(null)
    const reader = new FileReader()
    reader.onload = ev => {
      const lines = ev.target.result.split(/\r?\n/).filter(l=>l.trim())
      if (lines.length<2) { setError("En-tête + données requis"); return }
      const heads = lines[0].split(",").map(h=>h.trim().replace(/^"|"$/g,""))
      const rows  = lines.slice(1,4).map(line=>{
        const vals = line.split(",").map(v=>v.trim().replace(/^"|"$/g,""))
        const obj  = {}
        heads.forEach((h,i)=>{ obj[h]=vals[i]||"" })
        return obj
      })
      setCsvHeaders(heads); setPreview(rows)
    }
    reader.readAsText(f,"UTF-8")
  }

  const handleAnalyze = async () => {
    if (!file) return
    setLoading(true); setProgress(0); setError(null)
    const STAGES = ["LECTURE CSV","ENCODAGE","XGBOOST","RÈGLES MÉTIER","FINALISATION"]
    let si=0,p=0
    const iv = setInterval(()=>{
      p += 1.5+Math.random()*2
      if(p>(si+1)*18&&si<STAGES.length-1) si++
      setStage(STAGES[si]); setProgress(Math.min(88,p))
    }, 60)
    try {
      const fd = new FormData(); fd.append("file",file)
      const { data } = await axios.post("http://127.0.0.1:8000/batch_predict",fd)
      clearInterval(iv); setProgress(100); setStage("TERMINÉ")
      setTimeout(()=>{ setLoading(false); setResults(data) }, 350)
    } catch(err) {
      clearInterval(iv); setLoading(false)
      setError(err.response?.data?.detail||"Connexion refusée — lancez : uvicorn main:app --reload")
    }
  }

  const exportCSV = () => {
    if (!results) return
    const cols = csvHeaders.concat(["score","niveau","decision","proba_ml","score_metier"])
    const sep = ";"
    const header = cols.join(sep)
    const rows = results.predictions.map(row =>
      cols.map(h => {
        let v = row[h]??""
        if (typeof v === "string" && (v.includes(sep)||v.includes('"'))) v = `"${v.replace(/"/g,'""')}"`
        return v
      }).join(sep)
    )
    const content = [header,...rows].join("\r\n")
    const a = Object.assign(document.createElement("a"),{
      href: URL.createObjectURL(new Blob(["\uFEFF"+content],{type:"text/csv;charset=utf-8;"})),
      download:"resultats_scoring_stbg.csv"
    })
    a.click(); URL.revokeObjectURL(a.href)
  }

  const stats = useMemo(()=>{
    if(!results) return null
    const p = results.predictions
    const avg = Math.round(p.reduce((s,r)=>s+r.score,0)/p.length)
    return {
      total:p.length, avg,
      faible:p.filter(r=>r.niveau==="FAIBLE").length,
      modere:p.filter(r=>r.niveau==="MODÉRÉ").length,
      eleve: p.filter(r=>r.niveau==="ÉLEVÉ").length,
      encours:p.reduce((s,r)=>s+(Number(r.montant_encours_tnd)||0),0),
      scoreColor: avg<=30?"#c9a84c":avg<=60?"#a87030":"#7a2d3a"
    }
  },[results])

  return (
    <>
      <style>{`
        .mr{opacity:0;transform:translate3d(0,22px,0);transition:opacity .65s cubic-bezier(0.16,1,0.3,1),transform .65s cubic-bezier(0.16,1,0.3,1);will-change:transform,opacity}
        .mr.mr-in{opacity:1;transform:translate3d(0,0,0)}
        .d1{transition-delay:.09s}.d2{transition-delay:.18s}.d3{transition-delay:.27s}
        .stbg-scroll{scrollbar-width:thin;scrollbar-color:rgba(201,168,76,0.25) transparent}
        .stbg-scroll::-webkit-scrollbar{width:5px;height:5px}
        .stbg-scroll::-webkit-scrollbar-track{background:rgba(244,197,66,0.03);border-radius:99px}
        .stbg-scroll::-webkit-scrollbar-thumb{background:rgba(201,168,76,0.25);border-radius:99px}
        .stbg-scroll::-webkit-scrollbar-thumb:hover{background:rgba(201,168,76,0.45)}
        .stbg-scroll::-webkit-scrollbar-corner{background:transparent}
        .drop-zone:hover{border-color:rgba(201,168,76,0.45)!important;background:rgba(201,168,76,0.025)!important}
      `}</style>

      <BubbleField/>

      <section className="form-section">
        <div className="container">

          <div className="mr section-eyebrow"><span className="num">03</span><span className="line"/>Scoring en masse</div>
          <h2 className="mr d1 section-title">Analysez tout votre portefeuille <span className="gold">en un clic</span></h2>
          <p className="mr d2 section-lead" style={{marginBottom:0}}>
            Uploadez votre CSV, le modèle XGBoost score chaque client instantanément.
          </p>

          <div className="form-shell mr d3" style={{marginTop:48}}>

            <div style={{display:"flex",flexDirection:"column",gap:24,minWidth:0}}>

              {/* Upload card */}
              <div className="form-card" style={{padding:0,overflow:"hidden"}}>
                <div style={{height:2,background:"linear-gradient(90deg,transparent,var(--gold),var(--burgundy-soft),transparent)"}}/>
                <div style={{padding:"32px 36px"}}>
                  <div className="form-block-head" style={{marginBottom:20}}>
                    <div className="form-block-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    </div>
                    <div className="form-block-title">Chargement du fichier</div>
                  </div>

                  <div className="drop-zone"
                    onClick={()=>fileRef.current.click()}
                    onDragOver={e=>{e.preventDefault();setDragOver(true)}}
                    onDragLeave={()=>setDragOver(false)}
                    onDrop={e=>{e.preventDefault();setDragOver(false);parseFile(e.dataTransfer.files[0])}}
                    style={{
                      border:`1.5px dashed ${dragOver?"var(--gold)":"rgba(244,197,66,0.2)"}`,
                      borderRadius:14,padding:"36px 24px",textAlign:"center",cursor:"pointer",
                      background:dragOver?"rgba(201,168,76,0.04)":"rgba(8,4,16,0.4)",
                      transition:"all .25s ease"
                    }}>
                    <input ref={fileRef} type="file" accept=".csv" style={{display:"none"}} onChange={e=>parseFile(e.target.files[0])}/>
                    {file ? (
                      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:16}}>
                        <div style={{width:40,height:40,borderRadius:10,background:"rgba(201,168,76,0.1)",border:"1px solid rgba(201,168,76,0.2)",display:"grid",placeItems:"center",flexShrink:0}}>
                          <svg viewBox="0 0 24 24" width="17" fill="none" stroke="var(--gold)" strokeWidth="1.6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                        </div>
                        <div style={{textAlign:"left"}}>
                          <div style={{fontFamily:"var(--serif)",fontSize:16,color:"var(--ink)",letterSpacing:"-.01em"}}>{file.name}</div>
                          <div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--ink-mute)",marginTop:4}}>{(file.size/1024).toFixed(1)} KB · {csvHeaders.length} colonnes détectées</div>
                        </div>
                        <span style={{padding:"4px 12px",borderRadius:99,background:"rgba(92,184,116,0.08)",border:"1px solid rgba(92,184,116,0.2)",fontFamily:"var(--mono)",fontSize:10,color:"#5cb874",letterSpacing:"1px"}}>✓ PRÊT</span>
                      </div>
                    ) : (
                      <>
                        <svg viewBox="0 0 48 48" width="36" style={{margin:"0 auto 12px",display:"block",opacity:.25}} fill="none" stroke="var(--gold)" strokeWidth="1.5">
                          <path d="M8 32v8a4 4 0 0 0 4 4h24a4 4 0 0 0 4-4v-8"/><path d="M24 6v28M14 16l10-10 10 10"/>
                        </svg>
                        <div style={{fontSize:14,color:"var(--ink-dim)",marginBottom:6,letterSpacing:"-.01em"}}>Glissez votre fichier CSV ici</div>
                        <div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--ink-mute)",letterSpacing:".5px"}}>ou cliquez pour parcourir</div>
                      </>
                    )}
                  </div>

                  {preview && csvHeaders.length>0 && (
                    <div style={{marginTop:20}}>
                      <div style={{fontFamily:"var(--mono)",fontSize:8,letterSpacing:"2.5px",textTransform:"uppercase",color:"rgba(244,197,66,0.35)",marginBottom:10}}>
                        Aperçu — {csvHeaders.length} colonnes
                      </div>
                      <div style={{borderRadius:10,border:"1px solid rgba(244,197,66,0.1)",overflow:"hidden"}}>
                        <div className="stbg-scroll" style={{overflowX:"auto"}}>
                          <table style={{width:"100%",borderCollapse:"collapse",minWidth:500}}>
                            <thead>
                              <tr style={{background:"rgba(201,168,76,0.04)",borderBottom:"1px solid rgba(244,197,66,0.08)"}}>
                                {csvHeaders.slice(0,6).map(h=>(
                                  <th key={h} style={{padding:"8px 12px",fontFamily:"var(--mono)",fontSize:8,letterSpacing:"1.5px",textTransform:"uppercase",color:"rgba(244,197,66,0.5)",textAlign:"left",whiteSpace:"nowrap"}}>{h}</th>
                                ))}
                                {csvHeaders.length>6&&<th style={{padding:"8px 12px",fontFamily:"var(--mono)",fontSize:8,color:"rgba(244,197,66,0.25)"}}>+{csvHeaders.length-6}</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {preview.map((row,i)=>(
                                <tr key={i} style={{borderBottom:i<preview.length-1?"1px solid rgba(244,197,66,0.05)":"none"}}>
                                  {csvHeaders.slice(0,6).map(h=>(
                                    <td key={h} style={{padding:"7px 12px",fontSize:11,color:"var(--ink-dim)",fontFamily:"var(--mono)",whiteSpace:"nowrap"}}>{row[h]||"—"}</td>
                                  ))}
                                  {csvHeaders.length>6&&<td style={{padding:"7px 12px",fontSize:10,color:"rgba(244,197,66,0.25)"}}>…</td>}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {error&&(
                    <div style={{marginTop:16,padding:"12px 16px",background:"rgba(122,45,58,0.12)",border:"1px solid rgba(122,45,58,0.35)",borderRadius:10,fontSize:13,color:"#a84050",display:"flex",alignItems:"center",gap:10}}>
                      <svg viewBox="0 0 24 24" width="16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
                      {error}
                    </div>
                  )}

                  <div className="submit-row" style={{justifyContent:"flex-start",paddingTop:24,borderTop:"1px solid rgba(244,197,66,0.08)",marginTop:24}}>
                    <button className="submit-btn" onClick={handleAnalyze} disabled={!file||loading} type="button">
                      <svg viewBox="0 0 24 24" width="14" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                      {loading?"Analyse en cours…":"Lancer le scoring masse"}
                    </button>
                    {results&&(
                      <button onClick={exportCSV} type="button" style={{
                        padding:"12px 22px",borderRadius:10,
                        border:"1px solid rgba(201,168,76,0.2)",
                        background:"rgba(201,168,76,0.05)",color:"var(--gold)",
                        fontFamily:"var(--mono)",fontSize:10,letterSpacing:"1.5px",textTransform:"uppercase",
                        cursor:"pointer",transition:"all .2s",display:"flex",alignItems:"center",gap:8
                      }}
                        onMouseEnter={e=>{e.currentTarget.style.background="rgba(201,168,76,0.12)";e.currentTarget.style.borderColor="rgba(201,168,76,0.4)"}}
                        onMouseLeave={e=>{e.currentTarget.style.background="rgba(201,168,76,0.05)";e.currentTarget.style.borderColor="rgba(201,168,76,0.2)"}}
                      >
                        <svg viewBox="0 0 24 24" width="13" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Exporter CSV
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {results&&stats&&(
                <div className="form-card" style={{padding:0,overflow:"hidden"}}>
                  <div style={{height:2,background:"linear-gradient(90deg,transparent,var(--gold),rgba(122,45,58,0.8),transparent)"}}/>
                  <div style={{padding:"32px 36px"}}>
                    <div className="form-block-head" style={{marginBottom:24}}>
                      <div className="form-block-icon" style={{color:"var(--gold)",borderColor:"rgba(201,168,76,0.25)",background:"rgba(201,168,76,0.07)"}}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                      </div>
                      <div className="form-block-title">Résultats du scoring</div>
                    </div>

                    <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:28,marginBottom:28,padding:"24px",background:"rgba(8,4,16,0.5)",borderRadius:14,border:"1px solid rgba(244,197,66,0.08)"}}>
                      <RingChart faible={stats.faible} modere={stats.modere} eleve={stats.eleve} total={stats.total}/>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,alignContent:"center"}}>
                        <KPI label="Score moyen"   value={stats.avg}   sub="/100"                                            color={stats.scoreColor}/>
                        <KPI label="Risque élevé"  value={stats.eleve} sub={`${Math.round(stats.eleve/stats.total*100)}%`}  color="#7a2d3a"/>
                        <KPI label="Profils sains" value={stats.faible}sub={`${Math.round(stats.faible/stats.total*100)}%`} color="#c9a84c"/>
                        <KPI label="Encours total" value={`${(stats.encours/1e6).toFixed(1)}M`} sub="TND"                  color="var(--gold)"/>
                      </div>
                    </div>

                    <ResultsTable predictions={results.predictions}/>
                  </div>
                </div>
              )}
            </div>

            {/* Right rail */}
            <div className="risk-rail">
              <div className="risk-card">
                <div className="risk-card-head">
                  <div>
                    <div className="risk-card-label">Scoring en masse</div>
                    <div className="risk-card-client-name" style={{fontSize:11}}>
                      {file?<span style={{color:"var(--ink)"}}>{file.name}</span>:<span style={{color:"var(--ink-mute)",fontStyle:"italic",fontSize:10}}>Aucun fichier</span>}
                    </div>
                  </div>
                  <div className="risk-card-live">
                    <span className="dot" style={{background:loading?"var(--amber)":"var(--green)",boxShadow:`0 0 6px ${loading?"var(--amber)":"var(--green)"}`}}/>
                    {loading?"RUN":"BATCH"}
                  </div>
                </div>

                {loading&&(
                  <div style={{marginTop:18}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                      <span style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--ink-mute)",letterSpacing:"1.5px"}}>{stage}</span>
                      <span style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--gold)",fontWeight:600}}>{Math.round(progress)}%</span>
                    </div>
                    <div style={{height:3,background:"rgba(244,197,66,0.08)",borderRadius:99,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${progress}%`,background:"linear-gradient(90deg,rgba(122,45,58,0.8),var(--gold))",borderRadius:99,transition:"width .3s ease",boxShadow:"0 0 8px rgba(244,197,66,0.4)"}}/>
                    </div>
                    <div style={{marginTop:20,textAlign:"center",fontFamily:"var(--mono)",fontSize:9,color:"var(--ink-mute)",letterSpacing:"2px"}}>
                      XGBoost · analyse en cours
                    </div>
                  </div>
                )}

                {stats&&!loading&&(
                  <>
                    <div style={{marginTop:18,paddingTop:16,borderTop:"1px solid var(--line)"}}>
                      <div style={{fontFamily:"var(--serif)",fontSize:44,color:"var(--gold)",lineHeight:1}}>{stats.total}</div>
                      <div style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--ink-mute)",letterSpacing:"2.5px",marginTop:4}}>CLIENTS SCORÉS</div>
                    </div>
                    <div className="factor-list">
                      {[
                        {label:"Faible risque",val:Math.round(stats.faible/stats.total*100),color:"#c9a84c"},
                        {label:"Modéré",        val:Math.round(stats.modere/stats.total*100),color:"#a87030"},
                        {label:"Risque élevé", val:Math.round(stats.eleve/stats.total*100), color:"#7a2d3a"},
                      ].map(f=>(
                        <div key={f.label} className="factor">
                          <div className="factor-label" style={{color:f.color}}>{f.label}</div>
                          <div className="factor-bar"><div className="factor-bar-fill" style={{width:`${f.val}%`,background:f.color,boxShadow:`0 0 6px ${f.color}50`}}/></div>
                          <div className="factor-val" style={{color:f.color}}>{f.val}%</div>
                        </div>
                      ))}
                    </div>
                    <div style={{marginTop:14,padding:"14px 16px",borderRadius:12,background:"rgba(201,168,76,0.04)",border:"1px solid rgba(201,168,76,0.1)"}}>
                      <div style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--ink-mute)",letterSpacing:"2px",marginBottom:6}}>ENCOURS TOTAL</div>
                      <div style={{fontFamily:"var(--serif)",fontSize:18,color:"var(--gold)"}}>{stats.encours.toLocaleString("fr-TN")} <span style={{fontSize:10,color:"var(--ink-mute)"}}>TND</span></div>
                    </div>
                    <div style={{marginTop:10,padding:"14px 16px",borderRadius:12,background:"rgba(8,4,16,0.5)",border:"1px solid rgba(244,197,66,0.08)"}}>
                      <div style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--ink-mute)",letterSpacing:"2px",marginBottom:6}}>SCORE MOYEN</div>
                      <div style={{fontFamily:"var(--serif)",fontSize:28,color:stats.scoreColor}}>{stats.avg}<span style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--ink-mute)"}}> /100</span></div>
                    </div>
                  </>
                )}

                {!stats&&!loading&&(
                  <div style={{marginTop:32,textAlign:"center",opacity:.28}}>
                    <svg viewBox="0 0 48 48" width="42" style={{margin:"0 auto 12px",display:"block"}} fill="none" stroke="var(--gold)" strokeWidth="1">
                      <rect x="6" y="6" width="36" height="36" rx="6"/><line x1="14" y1="18" x2="34" y2="18"/><line x1="14" y1="26" x2="28" y2="26"/>
                    </svg>
                    <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--ink-mute)",letterSpacing:"2px",lineHeight:2}}>UPLOADEZ UN CSV<br/>POUR COMMENCER</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}