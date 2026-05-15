import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import axios from "axios"
import { useApp } from "../AppContext"
import { REGIONS, BANQUES, INIT_FORM } from "../constants/data"

// ── Soda bottle ───────────────────────────────────────────────────────────────
function Bottle({ fillPct = 0, color = "#f4c542", bubbles = true, size = "normal" }) {
  const pct = Math.max(0, Math.min(100, fillPct))
  const surfaceY = 305 - (pct / 100) * 165
  const w = size === "small" ? 160 : 240
  const h = size === "small" ? 320 : 480
  const innerBubbles = useMemo(() => Array.from({ length: 6 }, () => ({
    cx: 75 + Math.random() * 50, r: 1.5 + Math.random() * 2,
    delay: Math.random() * 3, dur: 2.5 + Math.random() * 2,
  })), [])
  return (
    <svg viewBox="0 0 200 400" width={w} height={h} style={{ overflow:"visible" }}>
      <defs>
        <linearGradient id={`liq-${size}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.95"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.65"/>
        </linearGradient>
        <linearGradient id={`glass-${size}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(244,197,66,0.09)"/>
          <stop offset="50%" stopColor="rgba(244,197,66,0.02)"/>
          <stop offset="100%" stopColor="rgba(244,197,66,0.09)"/>
        </linearGradient>
        <clipPath id={`bc-${size}`}>
          <path d="M 70 75 L 70 110 Q 50 125, 50 160 L 50 340 Q 50 365, 75 365 L 125 365 Q 150 365, 150 340 L 150 160 Q 150 125, 130 110 L 130 75 Z"/>
        </clipPath>
        <filter id={`bg-${size}`}>
          <feGaussianBlur stdDeviation="5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <ellipse cx="100" cy="370" rx="76" ry="13" fill={color} opacity={0.22*(pct/100)} filter={`url(#bg-${size})`}/>
      <rect x="78" y="30" width="44" height="22" rx="3" fill="#7a2d3a" stroke={color} strokeWidth="1"/>
      <rect x="80" y="34" width="40" height="2" fill={color} opacity="0.4"/>
      <rect x="80" y="40" width="40" height="2" fill={color} opacity="0.4"/>
      <rect x="80" y="46" width="40" height="2" fill={color} opacity="0.4"/>
      <rect x="78" y="52" width="44" height="25" rx="2" fill="rgba(244,197,66,0.06)" stroke="rgba(244,197,66,0.25)" strokeWidth="0.8"/>
      <path d="M 70 75 L 70 110 Q 50 125, 50 160 L 50 340 Q 50 365, 75 365 L 125 365 Q 150 365, 150 340 L 150 160 Q 150 125, 130 110 L 130 75 Z"
        fill={`url(#glass-${size})`} stroke="rgba(244,197,66,0.4)" strokeWidth="1.2"/>
      <g clipPath={`url(#bc-${size})`}>
        <rect x="40" y={surfaceY} width="120" height="200" fill={`url(#liq-${size})`}
          style={{ transition:"y 0.7s cubic-bezier(0.2,0.7,0.2,1)" }}/>
        <path d={`M 40 ${surfaceY} Q 60 ${surfaceY-4}, 100 ${surfaceY} T 160 ${surfaceY} L 160 ${surfaceY+8} L 40 ${surfaceY+8} Z`}
          fill={color} opacity="0.55">
          <animate attributeName="d" dur="3.5s" repeatCount="indefinite"
            values={`M 40 ${surfaceY} Q 60 ${surfaceY-4}, 100 ${surfaceY} T 160 ${surfaceY} L 160 ${surfaceY+8} L 40 ${surfaceY+8} Z;M 40 ${surfaceY} Q 60 ${surfaceY+4}, 100 ${surfaceY} T 160 ${surfaceY} L 160 ${surfaceY+8} L 40 ${surfaceY+8} Z;M 40 ${surfaceY} Q 60 ${surfaceY-4}, 100 ${surfaceY} T 160 ${surfaceY} L 160 ${surfaceY+8} L 40 ${surfaceY+8} Z`}/>
        </path>
        {bubbles && pct > 5 && innerBubbles.map((b, i) => (
          <circle key={i} cx={b.cx} r={b.r} fill="white" opacity="0.45">
            <animate attributeName="cy" values={`365;${surfaceY+5}`} dur={`${b.dur}s`} begin={`${b.delay}s`} repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0;0.65;0" dur={`${b.dur}s`} begin={`${b.delay}s`} repeatCount="indefinite"/>
          </circle>
        ))}
      </g>
      <rect x="58" y="200" width="84" height="80" fill="rgba(10,6,18,0.65)" stroke="rgba(244,197,66,0.3)" strokeWidth="0.8" rx="2"/>
      <text x="100" y="225" textAnchor="middle" fontFamily="DM Serif Display,serif" fontSize="13" fill={color} letterSpacing="0.5">STBG</text>
      <line x1="68" y1="232" x2="132" y2="232" stroke={color} strokeWidth="0.5" opacity="0.5"/>
      <text x="100" y="248" textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize="6" fill="#b8a98c" letterSpacing="2">RISK SCORE</text>
      <text x="100" y="268" textAnchor="middle" fontFamily="DM Serif Display,serif" fontSize="19" fill={color}>{Math.round(pct)}</text>
      <path d="M 60 130 Q 56 230, 62 330" stroke="rgba(255,255,255,0.12)" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>
  )
}

// ── Bubbles ───────────────────────────────────────────────────────────────────
function BubbleField() {
  const bubbles = useMemo(() => Array.from({ length: 18 }, () => ({
    left: Math.random() * 100,
    size: 4 + Math.random() * 14,
    dur: 9 + Math.random() * 11,
    delay: -Math.random() * 14,
  })), [])
  return (
    <div className="bubble-field">
      {bubbles.map((b, i) => (
        <div key={i} className="bubble" style={{
          left:`${b.left}%`, width:b.size, height:b.size,
          animationDuration:`${b.dur}s`, animationDelay:`${b.delay}s`
        }}/>
      ))}
    </div>
  )
}

// ── Slider ────────────────────────────────────────────────────────────────────
function SliderField({ value, onChange, min=0, max=100, step=1, suffix="", ticks=[] }) {
  const trackRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const pct = ((value - min) / (max - min)) * 100
  const handleMove = useCallback(e => {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left
    const ratio = Math.max(0, Math.min(1, x / rect.width))
    onChange(Math.round((min + ratio * (max - min)) / step) * step)
  }, [min, max, step, onChange])
  useEffect(() => {
    if (!dragging) return
    const up = () => setDragging(false)
    window.addEventListener("mousemove", handleMove)
    window.addEventListener("mouseup", up)
    window.addEventListener("touchmove", handleMove, { passive: false })
    window.addEventListener("touchend", up)
    return () => {
      window.removeEventListener("mousemove", handleMove)
      window.removeEventListener("mouseup", up)
      window.removeEventListener("touchmove", handleMove)
      window.removeEventListener("touchend", up)
    }
  }, [dragging, handleMove])
  return (
    <div className="slider-field">
      <div className="slider-field-head">
        <span className="slider-field-val">{value}{suffix}</span>
        <span className="slider-field-range">{min} – {max}</span>
      </div>
      <div className="slider-track" ref={trackRef}
        onMouseDown={e => { setDragging(true); handleMove(e) }}
        onTouchStart={e => { setDragging(true); handleMove(e) }}>
        <div className="slider-fill" style={{ width:`${pct}%` }}/>
        <div className="slider-thumb" style={{ left:`${pct}%` }}/>
      </div>
      {ticks.length > 0 && <div className="slider-ticks">{ticks.map(t => <span key={t}>{t}</span>)}</div>}
    </div>
  )
}

// ── Number input — clean, no spinners ────────────────────────────────────────
function NumInput({ value, onChange, suffix, min=0, max }) {
  return (
    <div className="num-input">
      <input
        type="number" value={value} min={min} max={max}
        onChange={e => {
          let v = e.target.value === "" ? 0 : Number(e.target.value)
          if (max !== undefined) v = Math.min(max, v)
          v = Math.max(min, v)
          onChange(v)
        }}
      />
      {suffix && <div className="suffix">{suffix}</div>}
    </div>
  )
}

// ── Custom Select (dropdown, no native HTML scrollbar) ────────────────────────
function SelectWrap({ value, onChange, options }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])
  return (
    <div className={`custom-select${open?" open":""}`} ref={ref}>
      <button className="custom-select-trigger" type="button" onClick={() => setOpen(v => !v)}>
        <span>{value}</span>
        <svg className="select-chevron" viewBox="0 0 12 12" width="10" height="10">
          <path d="M2 4 L6 8 L10 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </svg>
      </button>
      {open && (
        <div className="custom-select-dropdown">
          {options.map(o => (
            <button key={o} className={`custom-select-option${value===o?" selected":""}`} type="button"
              onClick={() => { onChange(o); setOpen(false) }}>
              {o}
              {value === o && (
                <svg viewBox="0 0 12 12" width="10" height="10">
                  <path d="M2 6 L5 9 L10 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Live factors ──────────────────────────────────────────────────────────────
function computeLiveFactors(form) {
  const v = x => Math.max(0, Math.min(100, Math.round(x)))
  return [
    { key:"payment",    label:"Paiement",         val: v(100 - (form.nb_retards_12m/12)*100 - (form.delai_moyen_jours/90)*30) },
    { key:"financial",  label:"Santé financière",  val: v(100 - (form.montant_encours_tnd/Math.max(1,form.ca_annuel_tnd*0.4))*60) },
    { key:"anciennete", label:"Ancienneté",        val: v(40 + form.anciennete_annees*3) },
    { key:"volume",     label:"Concentration",     val: v(100 - form.concentration_pct*0.8) },
    { key:"litigation", label:"Litiges",           val: v(100 - form.nb_impayes*18 - form.nb_litiges*12 - form.nb_cheques_retournes*14) },
    { key:"delay",      label:"Délais",            val: v(100 - (form.delai_moyen_jours/90)*100) },
  ]
}

// ── Result modal — pro ────────────────────────────────────────────────────────
function ResultModal({ result, clientName, region, onClose }) {
  const [animScore, setAnimScore] = useState(0)
  const [animFill,  setAnimFill]  = useState(0)
  const [shapW, setShapW] = useState([])
  const [bdW,   setBdW]   = useState([])
  const score = result.score
  const color = score <= 30 ? "#5cb874" : score <= 60 ? "#e8a93d" : "#d34a4a"
  const level = result.niveau
  const gradeItalic = level==="FAIBLE"?"sain":level==="MODÉRÉ"?"à surveiller":"critique"
  const verdict =
    level==="FAIBLE"
      ? "Le profil est solide : historique de paiement régulier, ratios financiers favorables, ancienneté significative dans le portefeuille STBG. Engagement recommandé sans réserve."
      : level==="MODÉRÉ"
        ? "Le profil est globalement sain mais présente des zones de vigilance. Les ratios financiers sont acceptables ; un suivi rapproché des délais de paiement et de la concentration est conseillé."
        : "Le profil présente des signaux d'alerte significatifs : retards répétés, concentration excessive, historique de litiges. Une revue approfondie par le comité risque est requise avant tout engagement."

  const maxShap = Math.max(...result.shap.map(f => Math.abs(f.value)), 1)
  const breakdown = [
    { label:"Comportement paiement",  val: Math.max(0, 100-(result.shap.find(f=>f.label==="nb_retards_12m")?.value||0)*8-(result.shap.find(f=>f.label==="delai_moyen_jours")?.value||0)*0.3) },
    { label:"Santé financière",       val: Math.max(0, 100-(result.shap.find(f=>f.label==="ratio_encours_ca")?.value||0)*40) },
    { label:"Ancienneté & relation",  val: Math.min(100, 40+(result.shap.find(f=>f.label==="anciennete_annees")?.value||0)*3) },
    { label:"Litiges & impayés",      val: Math.max(0, 100-(result.shap.find(f=>f.label==="nb_impayes")?.value||0)*18-(result.shap.find(f=>f.label==="nb_cheques_retournes")?.value||0)*14) },
  ].map(f => ({ ...f, val: Math.max(0, Math.min(100, Math.round(f.val))) }))

  useEffect(() => {
    let f=0, s=0
    const fIv = setInterval(()=>{ f+=2; setAnimFill(Math.min(score,f)); if(f>=score) clearInterval(fIv) }, 14)
    const sIv = setInterval(()=>{ s+=Math.max(1,Math.round((score-s)/5)); setAnimScore(Math.min(score,s)); if(s>=score) clearInterval(sIv) }, 25)
    // Animate shap bars
    result.shap.forEach((_,i) => {
      setTimeout(()=>{ setShapW(p=>{ const n=[...p]; n[i]=Math.round(Math.abs(result.shap[i].value)/maxShap*100); return n }) }, 300+i*80)
    })
    // Animate breakdown bars
    breakdown.forEach((_,i) => {
      setTimeout(()=>{ setBdW(p=>{ const n=[...p]; n[i]=breakdown[i].val; return n }) }, 350+i*90)
    })
    return () => { clearInterval(fIv); clearInterval(sIv) }
  }, [score])

  return (
    <div className="result-modal" onClick={e=>e.stopPropagation()}>
      <button className="result-close" onClick={onClose}>
        <svg viewBox="0 0 14 14" width="11" height="11">
          <path d="M2 2 L12 12 M12 2 L2 12" stroke="currentColor" strokeWidth="1.6"/>
        </svg>
      </button>

      {/* Left — bottle */}
      <div className="result-bottle-panel">
        <Bottle fillPct={animFill} color={color} bubbles={animFill>5}/>
        <div className="result-bottle-region">
          {clientName || "Client"} · {region}
        </div>
      </div>

      {/* Right — info */}
      <div className="result-info-panel">
        {/* Eyebrow */}
        <div className="result-eyebrow">Score révélé · STBG Mégrine</div>

        {/* Big score */}
        <div className="result-score-block">
          <div className="result-score-line">
            <span className="result-score" style={{ color }}>{animScore}</span>
            <span className="result-score-of">/ 100</span>
          </div>
          <div className="result-level-row">
            <span className="result-level-badge" style={{ background:`${color}20`, color, border:`1px solid ${color}50` }}>
              {level}
            </span>
            <span className="result-grade-text">
              Profil — <em style={{ color }}>{gradeItalic}</em>
            </span>
          </div>
        </div>

        {/* Gauge */}
        <div className="result-gauge">
          <div className="result-gauge-track">
            <div className="result-gauge-fill" style={{
              width: `${score}%`,
              background: `linear-gradient(90deg, #5cb874, ${color})`
            }}/>
          </div>
          <div className="result-gauge-labels">
            <span>Faible</span><span>Modéré</span><span>Élevé</span>
          </div>
        </div>

        {/* Verdict */}
        <p className="result-verdict">{verdict}</p>

        <div className="result-divider"/>

        {/* Breakdown by factor */}
        <div className="breakdown-eyebrow">Décomposition par facteur</div>
        <div className="breakdown-grid">
          {breakdown.map((f, i) => {
            const c = f.val>=70?"#5cb874":f.val>=45?"#e8a93d":"#d34a4a"
            return (
              <div key={i} className="breakdown-item">
                <div className="breakdown-item-head">
                  <span className="breakdown-item-label">{f.label}</span>
                  <span className="breakdown-item-val" style={{ color:c }}>{f.val}</span>
                </div>
                <div className="breakdown-bar">
                  <div className="breakdown-bar-fill" style={{ width:`${bdW[i]||0}%`, background:c }}/>
                </div>
              </div>
            )
          })}
        </div>

        {/* SHAP factors */}
        <div className="shap-section">
          <div className="shap-eyebrow">Facteurs influents (SHAP)</div>
          {result.shap.map((f, i) => {
            const pos = f.value > 0
            const c = pos ? "#d34a4a" : "#5cb874"
            return (
              <div key={f.label} className="shap-row">
                <span className="shap-label">{f.label}</span>
                <div className="shap-track">
                  <div className="shap-fill" style={{ width:`${shapW[i]||0}%`, background:c }}/>
                </div>
                <span className="shap-val" style={{ color:c }}>
                  {pos?"+":""}{f.value}
                </span>
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div className="result-actions">
          <button className="btn-primary">Générer le rapport PDF</button>
          <button className="btn-ghost" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  )
}

// ── Data ──────────────────────────────────────────────────────────────────────
const ALL_SECTEURS = [
  "Commerce","Industrie","BTP","Agro-alimentaire","Distribution",
  "Services","Transport","Immobilier","Hôtellerie & Restauration",
  "Technologie","Santé","Éducation","Agriculture","Pêche","Artisanat","Autre"
]
const ALL_TYPES = [
  "Grossiste","Détaillant","Grande surface","Restauration",
  "Export","Import-Export","PME","Grande entreprise","Startup","Association","Autre"
]

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
export default function ScoringPage({ onRiskChange }) {
  const { t } = useApp()
  const [form, setForm] = useState(INIT_FORM)
  const [prenom, setPrenom] = useState("")
  const [nom, setNom]       = useState("")

  const [autreSecteur, setAutreSecteur] = useState("")
  const [autreType,    setAutreType]    = useState("")
  const [autreBanque,  setAutreBanque]  = useState("")

  const [result,     setResult]     = useState(null)
  const [analyzing,  setAnalyzing]  = useState(false)
  const [progress,   setProgress]   = useState(0)
  const [stage,      setStage]      = useState("")
  const [showResult, setShowResult] = useState(false)
  const [error,      setError]      = useState(null)
  const [risk,       setRisk]       = useState("idle")

  // Persistent score — keeps last analyzed result
  const [persistedResult, setPersistedResult] = useState(null)
  const [lastScore, setLastScore]   = useState(null)
  const [scoreDelta, setScoreDelta] = useState(0)
  const [flashDir,  setFlashDir]    = useState(null)
  const flashTimer = useRef(null)

  const isAutreSecteur = form.secteur === "Autre"
  const isAutreType    = form.type_client === "Autre"
  const isAutreBanque  = form.banque_domiciliation === "Autre"

  const up = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const liveFactors = useMemo(() => computeLiveFactors(form), [form])
  const liveScore   = useMemo(() => Math.round(liveFactors.reduce((s,f)=>s+f.val,0)/liveFactors.length), [liveFactors])
  const liquidColor = liveScore>=70?"#5cb874":liveScore>=50?"#f4c542":liveScore>=30?"#e8a93d":"#d34a4a"

  // Score delta tracking
  useEffect(() => {
    if (lastScore === null) { setLastScore(liveScore); return }
    if (liveScore !== lastScore) {
      const delta = liveScore - lastScore
      setScoreDelta(delta)
      setFlashDir(delta>0?"up":"down")
      setLastScore(liveScore)
      if (flashTimer.current) clearTimeout(flashTimer.current)
      flashTimer.current = setTimeout(()=>{ setFlashDir(null); setScoreDelta(0) }, 1800)
    }
  }, [liveScore])

  const filledRatio = useMemo(() => {
    const fields = ["montant_encours_tnd","ca_annuel_tnd","anciennete_annees","nb_retards_12m","nb_impayes","delai_moyen_jours","nb_cheques_retournes","concentration_pct"]
    return fields.filter(k=>Number(form[k])>0).length/fields.length
  }, [form])

  const stages = [
    {until:25,  msg:"PROFIL CLIENT"},
    {until:50,  msg:"DONNÉES FINANCIÈRES"},
    {until:72,  msg:"HISTORIQUE PAIEMENT"},
    {until:88,  msg:"MODÈLE XGBOOST"},
    {until:100, msg:"RÈGLES MÉTIER"},
  ]

  const handleAnalyze = async () => {
    setAnalyzing(true); setError(null); setProgress(0)
    let p=0
    const iv = setInterval(()=>{
      p += 2+Math.random()*3
      setStage(stages.find(s=>p<=s.until)?.msg||"RÈGLES MÉTIER")
      setProgress(Math.min(92,p))
    }, 60)
    try {
      const { data } = await axios.post("http://127.0.0.1:8000/predict", form)
      clearInterval(iv); setProgress(100); setStage("TERMINÉ")
      setTimeout(()=>{
        setAnalyzing(false)
        setResult(data); setPersistedResult(data)
        setRisk(data.niveau); setShowResult(true)
        if(onRiskChange) onRiskChange(data.niveau)
      }, 450)
    } catch {
      clearInterval(iv); setAnalyzing(false); setError(t?.err||"Connexion impossible — vérifiez que FastAPI tourne sur le port 8000")
    }
  }

  const handleReset = () => {
    setForm(INIT_FORM); setPrenom(""); setNom("")
    setAutreSecteur(""); setAutreType(""); setAutreBanque("")
    setResult(null); setPersistedResult(null)
    setRisk("idle"); setShowResult(false); setError(null)
    setLastScore(null); setScoreDelta(0); setFlashDir(null)
    if(onRiskChange) onRiskChange("idle")
  }

  // Scroll reveal
  useEffect(() => {
    const els = document.querySelectorAll(".reveal")
    const io = new IntersectionObserver(entries=>{
      entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target) } })
    }, { threshold:0.06, rootMargin:"0px 0px -30px 0px" })
    els.forEach(el=>io.observe(el))
    return ()=>io.disconnect()
  }, [])

  const Icon = {
    profile:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>,
    financial: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 21h18M5 21V9m4 12V5m4 16v-9m4 9v-7m4 7v-4"/></svg>,
    history:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 7v5l3 2"/><circle cx="12" cy="12" r="9"/></svg>,
    user:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>,
    arrow:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
    refresh:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 12a9 9 0 0 1 15-6.7L21 9"/><path d="M21 3v6h-6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 15"/><path d="M3 21v-6h6"/></svg>,
  }

  const clientName = [prenom, nom].filter(Boolean).join(" ")
  const displayScore = liveScore
  const riskLabel = displayScore>=70?"FAIBLE":displayScore>=50?"MODÉRÉ":"ÉLEVÉ"

  return (
    <>
      <BubbleField/>

      <section className="form-section">
        <div className="container">
          <div className="reveal section-eyebrow">
            <span className="num">02</span><span className="line"/>Scoring
          </div>
          <h2 className="reveal reveal-d1 section-title">
            Renseignez le profil,{" "}
            <span className="gold">le score se construit en direct</span>
          </h2>

          <div className="reveal reveal-d2 form-shell">
            {/* ── LEFT: Form ── */}
            <div className="form-card">

              {/* Block 0 — Identity */}
              <div className="form-block">
                <div className="form-block-head">
                  <div className="form-block-icon">{Icon.user}</div>
                  <div className="form-block-title">Identité</div>
                  <div className="form-block-num">00 / 03</div>
                </div>
                <div className="field-grid">
                  <div className="field">
                    <label className="field-label">Prénom</label>
                    <input className="text-input" type="text" placeholder="Jean" value={prenom} onChange={e=>setPrenom(e.target.value)}/>
                  </div>
                  <div className="field">
                    <label className="field-label">Nom</label>
                    <input className="text-input" type="text" placeholder="Dupont" value={nom} onChange={e=>setNom(e.target.value)}/>
                  </div>
                </div>
              </div>

              {/* Block 1 — Profil client */}
              <div className="form-block">
                <div className="form-block-head">
                  <div className="form-block-icon">{Icon.profile}</div>
                  <div className="form-block-title">Profil client</div>
                  <div className="form-block-num">01 / 03</div>
                </div>

                {/* Secteur — chip grid full width */}
                <div className="field" style={{ marginBottom:20 }}>
                  <label className="field-label">Secteur d'activité</label>
                  <div className="chip-grid">
                    {ALL_SECTEURS.map(s => (
                      <button key={s} type="button"
                        className={`chip${form.secteur===s?" chip-active":""}`}
                        onClick={()=>{ up("secteur",s); if(s!=="Autre") setAutreSecteur("") }}>
                        {s}
                      </button>
                    ))}
                  </div>
                  {isAutreSecteur && (
                    <div className="autre-input-wrap">
                      <input className="text-input" type="text" placeholder="Précisez votre secteur…"
                        value={autreSecteur} onChange={e=>{ setAutreSecteur(e.target.value); up("secteur",e.target.value||"Autre") }} autoFocus/>
                    </div>
                  )}
                </div>

                {/* Type client — chip grid full width */}
                <div className="field" style={{ marginBottom:20 }}>
                  <label className="field-label">Type client</label>
                  <div className="chip-grid">
                    {ALL_TYPES.map(ty => (
                      <button key={ty} type="button"
                        className={`chip${form.type_client===ty?" chip-active":""}`}
                        onClick={()=>{ up("type_client",ty); if(ty!=="Autre") setAutreType("") }}>
                        {ty}
                      </button>
                    ))}
                  </div>
                  {isAutreType && (
                    <div className="autre-input-wrap">
                      <input className="text-input" type="text" placeholder="Précisez le type…"
                        value={autreType} onChange={e=>{ setAutreType(e.target.value); up("type_client",e.target.value||"Autre") }} autoFocus/>
                    </div>
                  )}
                </div>

                {/* Région + Banque — 2 columns */}
                <div className="field-grid">
                  <div className="field">
                    <label className="field-label">Région</label>
                    <SelectWrap value={form.region} onChange={v=>up("region",v)} options={REGIONS}/>
                  </div>
                  <div className="field">
                    <label className="field-label">Banque domiciliataire</label>
                    <SelectWrap value={form.banque_domiciliation}
                      onChange={v=>{ up("banque_domiciliation",v); if(v!=="Autre") setAutreBanque("") }}
                      options={BANQUES}/>
                    {isAutreBanque && (
                      <div className="autre-input-wrap">
                        <input className="text-input" type="text" placeholder="Précisez la banque…"
                          value={autreBanque} onChange={e=>{ setAutreBanque(e.target.value); up("banque_domiciliation",e.target.value||"Autre") }} autoFocus/>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Block 2 — Données financières */}
              <div className="form-block">
                <div className="form-block-head">
                  <div className="form-block-icon">{Icon.financial}</div>
                  <div className="form-block-title">Données financières</div>
                  <div className="form-block-num">02 / 03</div>
                </div>
                <div className="field-grid-3">
                  <div className="field">
                    <label className="field-label">Encours (TND)</label>
                    <NumInput value={form.montant_encours_tnd} onChange={v=>up("montant_encours_tnd",v)} suffix="TND" min={0}/>
                    <div className="field-hint">Montant en cours bancaire</div>
                  </div>
                  <div className="field">
                    <label className="field-label">CA annuel (TND)</label>
                    <NumInput value={form.ca_annuel_tnd} onChange={v=>up("ca_annuel_tnd",v)} suffix="TND" min={0}/>
                    <div className="field-hint">Chiffre d'affaires annuel</div>
                  </div>
                  <div className="field">
                    <label className="field-label">Ancienneté (ans)</label>
                    <SliderField value={form.anciennete_annees} onChange={v=>up("anciennete_annees",v)} min={0} max={30} step={1} suffix=" ans" ticks={["0","10","20","30"]}/>
                  </div>
                  <div className="field">
                    <label className="field-label">Traites actives</label>
                    <NumInput value={form.nb_traites_actives} onChange={v=>up("nb_traites_actives",v)} min={0}/>
                  </div>
                  <div className="field">
                    <label className="field-label">Montant moy. traite</label>
                    <NumInput value={form.montant_moyen_traite} onChange={v=>up("montant_moyen_traite",v)} suffix="TND" min={0}/>
                  </div>
                  <div className="field">
                    <label className="field-label">Contrats actifs</label>
                    <NumInput value={form.nb_contrats_actifs} onChange={v=>up("nb_contrats_actifs",v)} min={0}/>
                  </div>
                </div>
              </div>

              {/* Block 3 — Historique */}
              <div className="form-block">
                <div className="form-block-head">
                  <div className="form-block-icon" style={{ color:"var(--burgundy-soft)",borderColor:"rgba(168,64,79,0.4)",background:"rgba(168,64,79,0.08)" }}>{Icon.history}</div>
                  <div className="form-block-title">Historique de paiement</div>
                  <div className="form-block-num">03 / 03</div>
                </div>
                <div className="field-grid-3">
                  <div className="field">
                    <label className="field-label">Retards 12 mois</label>
                    <SliderField value={form.nb_retards_12m} onChange={v=>up("nb_retards_12m",v)} min={0} max={12} step={1} ticks={["0","6","12"]}/>
                    <div className="field-hint">Effectués sur 12 mois</div>
                  </div>
                  <div className="field">
                    <label className="field-label">Impayés</label>
                    <SliderField value={form.nb_impayes} onChange={v=>up("nb_impayes",v)} min={0} max={10} step={1} ticks={["0","5","10"]}/>
                    <div className="field-hint">Factures non réglées</div>
                  </div>
                  <div className="field">
                    <label className="field-label">Délai moy. paiement (j)</label>
                    <NumInput value={form.delai_moyen_jours} onChange={v=>up("delai_moyen_jours",v)} suffix="j" min={0}/>
                    <div className="field-hint">Jours moyens de paiement</div>
                  </div>
                  <div className="field">
                    <label className="field-label">Chèques retournés</label>
                    <SliderField value={form.nb_cheques_retournes} onChange={v=>up("nb_cheques_retournes",v)} min={0} max={10} step={1} ticks={["0","5","10"]}/>
                    <div className="field-hint">Chèques sans provision</div>
                  </div>
                  <div className="field">
                    <label className="field-label">Litiges en cours</label>
                    <NumInput value={form.nb_litiges} onChange={v=>up("nb_litiges",v)} min={0}/>
                  </div>
                  <div className="field">
                    <label className="field-label">Concentration (%)</label>
                    <SliderField value={form.concentration_pct} onChange={v=>up("concentration_pct",v)} min={0} max={100} step={1} suffix="%" ticks={["0","50","100"]}/>
                    <div className="field-hint">% du CA chez STBG</div>
                  </div>
                </div>
              </div>

              {/* Submit row */}
              <div className="submit-row">
                <button className="submit-btn" onClick={handleAnalyze} disabled={analyzing} type="button">
                  <svg className="submit-ring" viewBox="0 0 24 24">
                    <circle className="track" cx="12" cy="12" r="9"/>
                    <circle className="indicator" cx="12" cy="12" r="9"
                      strokeDasharray={`${2*Math.PI*9}`}
                      strokeDashoffset={`${2*Math.PI*9*(1-filledRatio)}`}/>
                  </svg>
                  <span>Analyser le risque</span>
                  {Icon.arrow}
                </button>
                <button className="reset-btn" onClick={handleReset} type="button" title="Réinitialiser">
                  {Icon.refresh}
                </button>
              </div>

              {error && (
                <div style={{ marginTop:16, padding:"12px 16px", background:"rgba(211,74,74,0.07)", border:"1px solid rgba(211,74,74,0.22)", borderRadius:10, fontSize:13, color:"#d34a4a" }}>
                  ⚠ {error}
                </div>
              )}
            </div>

            {/* ── RIGHT: Risk rail ── */}
            <div className="risk-rail">
              <div className="risk-card">
                {/* Header — client name + live badge */}
                <div className="risk-card-head">
                  <div>
                    <div className="risk-card-label">Profil analysé</div>
                    <div className="risk-card-client-name">
                      {clientName || <span style={{ color:"var(--ink-mute)", fontStyle:"italic", fontSize:13 }}>Nouveau client</span>}
                    </div>
                  </div>
                  <div className="risk-card-live"><span className="dot"/>LIVE</div>
                </div>

                {/* Last result banner — persists */}
                {persistedResult && (
                  <div className="risk-result-banner" onClick={()=>setShowResult(true)}>
                    <span>Dernier résultat</span>
                    <span className="banner-score" style={{ color: persistedResult.score<=30?"#5cb874":persistedResult.score<=60?"#e8a93d":"#d34a4a" }}>
                      {persistedResult.score} / 100
                    </span>
                    <span className="banner-see">VOIR →</span>
                  </div>
                )}

                {/* Bottle */}
                <div className="bottle-mini">
                  <Bottle fillPct={displayScore} color={liquidColor} bubbles={false} size="small"/>
                </div>

                {/* Score readout */}
                <div className="risk-readout">
                  <div className={`risk-readout-score${flashDir?` flash-${flashDir}`:""}`} style={{ color:liquidColor }}>
                    {displayScore}<span className="of"> / 100</span>
                  </div>
                  {flashDir && scoreDelta !== 0 && (
                    <div className={`score-delta score-delta-${flashDir}`}>
                      {flashDir==="up"?"+":""}{scoreDelta}
                    </div>
                  )}
                  <div className="risk-readout-grade" style={{ background:`${liquidColor}22`, color:liquidColor, border:`1px solid ${liquidColor}50` }}>
                    {riskLabel}
                  </div>
                </div>

                {/* Factors */}
                <div className="factor-list">
                  {liveFactors.map(f => {
                    const c = f.val>=70?"var(--green)":f.val>=45?"var(--amber)":"var(--red)"
                    return (
                      <div key={f.key} className="factor">
                        <div className="factor-label">{f.label}</div>
                        <div className="factor-bar"><div className="factor-bar-fill" style={{ width:`${f.val}%`, background:c }}/></div>
                        <div className="factor-val">{f.val}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Takeover loader */}
      <div className={`takeover${analyzing?" open":""}`}>
        <div className="takeover-inner">
          <Bottle fillPct={progress} color={liquidColor} bubbles={false}/>
          <div className="takeover-text">Analyse en cours…</div>
          <div className="takeover-progress">
            <div className="takeover-progress-fill" style={{ width:`${progress}%` }}/>
          </div>
          <div className="takeover-status">{stage} · {Math.round(progress)}%</div>
        </div>
      </div>

      {/* Result modal */}
      <div className={`result-overlay${showResult?" open":""}`}
        onClick={e=>{ if(e.target.classList.contains("result-overlay")) setShowResult(false) }}>
        {showResult && result && (
          <ResultModal
            result={result}
            clientName={clientName}
            region={form.region}
            onClose={()=>setShowResult(false)}
          />
        )}
      </div>
    </>
  )
}