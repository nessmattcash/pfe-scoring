import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import axios from "axios"
import { useApp } from "../AppContext"
import { REGIONS, BANQUES, INIT_FORM } from "../constants/data"

// ── Soda bottle SVG (unchanged, but bubbles disabled on small) ──────────────
function Bottle({ fillPct = 0, color = "#f4c542", bubbles = true, size = "normal" }) {
  const pct = Math.max(0, Math.min(100, fillPct))
  const surfaceY = 305 - (pct / 100) * 165
  const w = size === "small" ? 180 : 260
  const h = size === "small" ? 360 : 520

  const innerBubbles = useMemo(() =>
    Array.from({ length: 8 }, () => ({
      cx: 75 + Math.random() * 50,
      r: 1.5 + Math.random() * 2.5,
      delay: Math.random() * 3,
      dur: 2 + Math.random() * 2,
    })), [])

  return (
    <svg viewBox="0 0 200 400" width={w} height={h} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="liq" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.95"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.7"/>
        </linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(244,197,66,0.08)"/>
          <stop offset="50%" stopColor="rgba(244,197,66,0.02)"/>
          <stop offset="100%" stopColor="rgba(244,197,66,0.08)"/>
        </linearGradient>
        <clipPath id="bclip">
          <path d="M 70 75 L 70 110 Q 50 125, 50 160 L 50 340 Q 50 365, 75 365 L 125 365 Q 150 365, 150 340 L 150 160 Q 150 125, 130 110 L 130 75 Z"/>
        </clipPath>
        <filter id="bglow">
          <feGaussianBlur stdDeviation="6" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <ellipse cx="100" cy="370" rx="80" ry="14" fill={color} opacity={0.25*(pct/100)} filter="url(#bglow)"/>
      <rect x="78" y="30" width="44" height="22" rx="3" fill="#7a2d3a" stroke={color} strokeWidth="1"/>
      <rect x="80" y="34" width="40" height="2" fill={color} opacity="0.4"/>
      <rect x="80" y="40" width="40" height="2" fill={color} opacity="0.4"/>
      <rect x="80" y="46" width="40" height="2" fill={color} opacity="0.4"/>
      <rect x="78" y="52" width="44" height="25" rx="2" fill="rgba(244,197,66,0.06)" stroke="rgba(244,197,66,0.25)" strokeWidth="0.8"/>
      <path d="M 70 75 L 70 110 Q 50 125, 50 160 L 50 340 Q 50 365, 75 365 L 125 365 Q 150 365, 150 340 L 150 160 Q 150 125, 130 110 L 130 75 Z"
        fill="url(#glass)" stroke="rgba(244,197,66,0.4)" strokeWidth="1.2"/>
      <g clipPath="url(#bclip)">
        <rect x="40" y={surfaceY} width="120" height="200" fill="url(#liq)"
          style={{ transition: "y 0.8s cubic-bezier(0.2,0.7,0.2,1)" }}/>
        <path d={`M 40 ${surfaceY} Q 60 ${surfaceY-4}, 100 ${surfaceY} T 160 ${surfaceY} L 160 ${surfaceY+8} L 40 ${surfaceY+8} Z`}
          fill={color} opacity="0.6">
          <animate attributeName="d" dur="3s" repeatCount="indefinite"
            values={`M 40 ${surfaceY} Q 60 ${surfaceY-4}, 100 ${surfaceY} T 160 ${surfaceY} L 160 ${surfaceY+8} L 40 ${surfaceY+8} Z;M 40 ${surfaceY} Q 60 ${surfaceY+4}, 100 ${surfaceY} T 160 ${surfaceY} L 160 ${surfaceY+8} L 40 ${surfaceY+8} Z;M 40 ${surfaceY} Q 60 ${surfaceY-4}, 100 ${surfaceY} T 160 ${surfaceY} L 160 ${surfaceY+8} L 40 ${surfaceY+8} Z`}/>
        </path>
        {bubbles && pct > 5 && innerBubbles.map((b, i) => (
          <circle key={i} cx={b.cx} r={b.r} fill="white" opacity="0.5">
            <animate attributeName="cy" values={`365;${surfaceY+5}`} dur={`${b.dur}s`} begin={`${b.delay}s`} repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0;0.7;0" dur={`${b.dur}s`} begin={`${b.delay}s`} repeatCount="indefinite"/>
          </circle>
        ))}
      </g>
      <rect x="58" y="200" width="84" height="80" fill="rgba(10,6,18,0.6)" stroke="rgba(244,197,66,0.35)" strokeWidth="0.8" rx="2"/>
      <text x="100" y="225" textAnchor="middle" fontFamily="DM Serif Display,serif" fontSize="14" fill={color} letterSpacing="0.5">STBG</text>
      <line x1="68" y1="232" x2="132" y2="232" stroke={color} strokeWidth="0.5" opacity="0.6"/>
      <text x="100" y="250" textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize="6" fill="#b8a98c" letterSpacing="2">RISK SCORE</text>
      <text x="100" y="270" textAnchor="middle" fontFamily="DM Serif Display,serif" fontSize="20" fill={color}>{Math.round(pct)}</text>
      <path d="M 60 130 Q 56 230, 62 330" stroke="rgba(255,255,255,0.15)" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>
  )
}

// ── Bubble field (unchanged) ────────────────────────────────────────────────
function BubbleField({ intensity = 1 }) {
  const count = Math.round(20 * intensity)
  const bubbles = useMemo(() =>
    Array.from({ length: count }, () => ({
      left: Math.random() * 100,
      size: 4 + Math.random() * 16,
      dur: 8 + Math.random() * 12,
      delay: -Math.random() * 15,
    })), [count])
  if (intensity === 0) return null
  return (
    <div className="bubble-field">
      {bubbles.map((b, i) => (
        <div key={i} className="bubble" style={{
          left: `${b.left}%`, width: b.size, height: b.size,
          animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s`
        }}/>
      ))}
    </div>
  )
}

// ── Number stepper (no green tick) ─────────────────────────────────────────
function NumInput({ value, onChange, suffix, min = 0, max }) {
  const [focused, setFocused] = useState(false)
  const step = () => {
    const next = Number(value) + 1
    if (max === undefined || next <= max) onChange(next)
  }
  const dec = () => {
    const next = Number(value) - 1
    if (next >= min) onChange(next)
  }
  return (
    <div className={`num-input${focused ? " focused" : ""}`}>
      <button className="num-btn" onClick={dec} type="button" tabIndex={-1}>−</button>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {suffix && <div className="suffix">{suffix}</div>}
      <button className="num-btn" onClick={step} type="button" tabIndex={-1}>+</button>
    </div>
  )
}

// ── Slider field ───────────────────────────────────────────────────────────
function SliderField({ value, onChange, min = 0, max = 100, step = 1, suffix = "", ticks = [] }) {
  const trackRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const pct = ((value - min) / (max - min)) * 100

  const handleMove = useCallback(e => {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left
    const ratio = Math.max(0, Math.min(1, x / rect.width))
    let v = min + ratio * (max - min)
    v = Math.round(v / step) * step
    onChange(v)
  }, [min, max, step, onChange])

  useEffect(() => {
    if (!dragging) return
    const move = e => handleMove(e)
    const up = () => setDragging(false)
    window.addEventListener("mousemove", move)
    window.addEventListener("mouseup", up)
    window.addEventListener("touchmove", move)
    window.addEventListener("touchend", up)
    return () => {
      window.removeEventListener("mousemove", move)
      window.removeEventListener("mouseup", up)
      window.removeEventListener("touchmove", move)
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
        <div className="slider-fill" style={{ width: `${pct}%` }}/>
        <div className="slider-thumb" style={{ left: `${pct}%` }}/>
      </div>
      {ticks.length > 0 && <div className="slider-ticks">{ticks.map(t => <span key={t}>{t}</span>)}</div>}
    </div>
  )
}

// ── Custom Select (kept for region only) ────────────────────────────────────
function SelectWrap({ value, onChange, options }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])
  return (
    <div className={`custom-select${open ? " open" : ""}`} ref={ref}>
      <button className="custom-select-trigger" type="button" onClick={() => setOpen(v => !v)}>
        <span>{value}</span>
        <svg className="select-chevron" viewBox="0 0 12 12" width="10" height="10">
          <path d="M2 4 L6 8 L10 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </svg>
      </button>
      {open && (
        <div className="custom-select-dropdown">
          {options.map(o => (
            <button
              key={o}
              className={`custom-select-option${value === o ? " selected" : ""}`}
              type="button"
              onClick={() => { onChange(o); setOpen(false) }}
            >
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

// ── Factor computation (live rail) ──────────────────────────────────────────
function computeLiveFactors(form) {
  const v = x => Math.max(0, Math.min(100, Math.round(x)))
  return [
    { key: "payment",   label: "Paiement",        val: v(100 - (form.nb_retards_12m / 12) * 100 - (form.delai_moyen_jours / 90) * 30) },
    { key: "financial", label: "Santé financière", val: v(100 - (form.montant_encours_tnd / Math.max(1, form.ca_annuel_tnd * 0.4)) * 60) },
    { key: "anciennete",label: "Ancienneté",       val: v(40 + form.anciennete_annees * 3) },
    { key: "volume",    label: "Concentration",    val: v(100 - form.concentration_pct * 0.8) },
    { key: "litigation",label: "Litiges",          val: v(100 - form.nb_impayes * 18 - form.nb_litiges * 12 - form.nb_cheques_retournes * 14) },
    { key: "delay",     label: "Délais",           val: v(100 - (form.delai_moyen_jours / 90) * 100) },
  ]
}

// ── Result modal (compact) ──────────────────────────────────────────────────
function ResultModal({ result, onClose, lang }) {
  const [animScore, setAnimScore] = useState(0)
  const [animFill, setAnimFill] = useState(0)
  const score = result.score
  const color = score <= 30 ? "#5cb874" : score <= 60 ? "#e8a93d" : "#d34a4a"
  const gradeLabel = result.niveau === "FAIBLE" ? "sain" : result.niveau === "MODÉRÉ" ? "à suivre" : "à surveiller"
  const verdict =
    result.niveau === "FAIBLE"
      ? "Le profil est solide : historique de paiement régulier, ratios financiers favorables, ancienneté significative dans le portefeuille. Engagement recommandé."
      : result.niveau === "MODÉRÉ"
        ? "Le profil est globalement sain mais présente quelques zones de vigilance. Un suivi rapproché des délais de paiement est conseillé."
        : "Le profil présente des signaux d'alerte significatifs : retards de paiement répétés, concentration élevée. Une revue approfondie par le comité risque est recommandée."

  useEffect(() => {
    let f = 0
    const fIv = setInterval(() => { f += 2; setAnimFill(Math.min(score, f)); if (f >= score) clearInterval(fIv) }, 16)
    let s = 0
    const sIv = setInterval(() => { s += Math.max(1, Math.round((score - s) / 5)); setAnimScore(Math.min(score, s)); if (s >= score) clearInterval(sIv) }, 30)
    return () => { clearInterval(fIv); clearInterval(sIv) }
  }, [score])

  const factors = [
    { label: "Comportement paiement",  val: Math.max(0, 100 - result.shap.find(f => f.label === "nb_retards_12m")?.value * 8 - result.shap.find(f => f.label === "delai_moyen_jours")?.value * 0.3 || 0) },
    { label: "Santé financière",       val: Math.max(0, 100 - (result.shap.find(f => f.label === "ratio_encours_ca")?.value || 0) * 40) },
    { label: "Ancienneté & relation",  val: Math.min(100, 40 + (result.shap.find(f => f.label === "anciennete_annees")?.value || 0) * 3) },
    { label: "Litiges & impayés",      val: Math.max(0, 100 - (result.shap.find(f => f.label === "nb_impayes")?.value || 0) * 18 - (result.shap.find(f => f.label === "nb_cheques_retournes")?.value || 0) * 14) },
  ].map(f => ({ ...f, val: Math.max(0, Math.min(100, Math.round(f.val))) }))

  return (
    <div className="result-modal" onClick={e => e.stopPropagation()}>
      <button className="result-close" onClick={onClose}>
        <svg viewBox="0 0 14 14" width="12" height="12"><path d="M2 2 L12 12 M12 2 L2 12" stroke="currentColor" strokeWidth="1.5"/></svg>
      </button>
      <div className="result-bottle-panel">
        <Bottle fillPct={animFill} color={color} bubbles={false}/>
      </div>
      <div className="result-info-panel">
        <div className="result-grade-eyebrow">Score révélé · STBG</div>
        <div className="result-score-line">
          <span className="result-score" style={{ color }}>{animScore}</span>
          <span className="result-score-of">/ 100</span>
        </div>
        <div className="result-grade">
          Profil — <span className="italic" style={{ color }}>{gradeLabel}</span>
        </div>
        <p className="result-verdict">{verdict}</p>
        <div className="result-divider"/>
        <div className="breakdown-title">Décomposition par facteur</div>
        <div className="breakdown-grid">
          {factors.map((f, i) => {
            const c = f.val >= 70 ? "#5cb874" : f.val >= 45 ? "#e8a93d" : "#d34a4a"
            return (
              <div key={i} className="breakdown-item">
                <div className="breakdown-item-head">
                  <span className="breakdown-item-label">{f.label}</span>
                  <span className="breakdown-item-val" style={{ color: c }}>{f.val}</span>
                </div>
                <div className="breakdown-bar">
                  <div className="breakdown-bar-fill" style={{ width: `${f.val}%`, background: c }}/>
                </div>
              </div>
            )
          })}
        </div>
        <div className="result-actions">
          <button className="btn-primary">Générer le rapport PDF</button>
          <button className="btn-ghost" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SCORING PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function ScoringPage({ onRiskChange }) {
  const { t, lang } = useApp()
  const [form, setForm] = useState(INIT_FORM)
  const [result, setResult] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState("")
  const [showResult, setShowResult] = useState(false)
  const [error, setError] = useState(null)
  const [risk, setRisk] = useState("idle")

  // User identity
  const [prenom, setPrenom] = useState("")
  const [nom, setNom] = useState("")

  // "Autre" custom fields
  const [autreSecteur, setAutreSecteur] = useState("")
  const [autreType, setAutreType] = useState("")
  const [autreBanque, setAutreBanque] = useState("")
  const isAutreSecteur = form.secteur === "Autre"
  const isAutreType = form.type_client === "Autre"
  const isAutreBanque = form.banque_domiciliation === "Autre"

  // Full lists (matching your requirements)
  const ALL_SECTEURS = [
    "Commerce", "Industrie", "BTP", "Agro-alimentaire", "Distribution",
    "Services", "Transport", "Immobilier", "Hôtellerie & Restauration",
    "Technologie", "Santé", "Éducation", "Agriculture", "Pêche",
    "Artisanat", "Autre"
  ]
  const ALL_TYPES = [
    "Grossiste", "Détaillant", "Grande surface", "Restauration",
    "Export", "Import-Export", "PME", "Grande entreprise",
    "Startup", "Association", "Autre"
  ]

  // Sync custom values to form
  useEffect(() => {
    if (isAutreSecteur && autreSecteur.trim()) {
      setForm(f => ({ ...f, secteur: autreSecteur.trim() }))
    }
  }, [autreSecteur, isAutreSecteur])

  useEffect(() => {
    if (isAutreType && autreType.trim()) {
      setForm(f => ({ ...f, type_client: autreType.trim() }))
    }
  }, [autreType, isAutreType])

  useEffect(() => {
    if (isAutreBanque && autreBanque.trim()) {
      setForm(f => ({ ...f, banque_domiciliation: autreBanque.trim() }))
    }
  }, [autreBanque, isAutreBanque])

  // Score tracking with persistence
  const [lastScore, setLastScore] = useState(null)
  const [persistedScore, setPersistedScore] = useState(null)
  const [scoreDelta, setScoreDelta] = useState(0)
  const [flashDir, setFlashDir] = useState(null)
  const flashTimer = useRef(null)

  const up = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const liveFactors = useMemo(() => computeLiveFactors(form), [form])
  const liveScore = useMemo(() => {
    const avg = liveFactors.reduce((s, f) => s + f.val, 0) / liveFactors.length
    return Math.round(avg)
  }, [liveFactors])
  const liquidColor = liveScore >= 70 ? "#5cb874" : liveScore >= 50 ? "#f4c542" : liveScore >= 30 ? "#e8a93d" : "#d34a4a"

  // Track score changes and show delta, and update persisted score
  useEffect(() => {
    if (lastScore === null) {
      setLastScore(liveScore)
      setPersistedScore(liveScore)
      return
    }
    if (liveScore !== lastScore) {
      const delta = liveScore - lastScore
      setScoreDelta(delta)
      setFlashDir(delta > 0 ? "up" : "down")
      setLastScore(liveScore)
      setPersistedScore(liveScore)
      if (flashTimer.current) clearTimeout(flashTimer.current)
      flashTimer.current = setTimeout(() => {
        setFlashDir(null)
        setScoreDelta(0)
      }, 1800)
    }
  }, [liveScore])

  // Progress ring
  const filledRatio = useMemo(() => {
    const fields = ["montant_encours_tnd", "ca_annuel_tnd", "anciennete_annees", "nb_retards_12m", "nb_impayes", "delai_moyen_jours", "nb_cheques_retournes", "concentration_pct"]
    return fields.filter(k => Number(form[k]) > 0).length / fields.length
  }, [form])

  const stages = [
    { until: 25,  msg: "PROFIL CLIENT" },
    { until: 50,  msg: "DONNÉES FINANCIÈRES" },
    { until: 72,  msg: "HISTORIQUE PAIEMENT" },
    { until: 88,  msg: "MODÈLE XGBOOST" },
    { until: 100, msg: "RÈGLES MÉTIER" },
  ]

  const handleAnalyze = async () => {
    setAnalyzing(true); setError(null); setProgress(0)
    let p = 0
    const iv = setInterval(() => {
      p += 2 + Math.random() * 3
      const s = stages.find(st => p <= st.until)
      setStage(s?.msg || "RÈGLES MÉTIER")
      setProgress(Math.min(92, p))
    }, 60)
    try {
      const { data } = await axios.post("http://127.0.0.1:8000/predict", form)
      clearInterval(iv)
      setProgress(100)
      setStage("TERMINÉ")
      setTimeout(() => {
        setAnalyzing(false)
        setResult(data)
        setRisk(data.niveau)
        setShowResult(true)
        if (onRiskChange) onRiskChange(data.niveau)
      }, 500)
    } catch {
      clearInterval(iv)
      setAnalyzing(false)
      setError(t.err)
    }
  }

  const handleReset = () => {
    setForm(INIT_FORM)
    setResult(null); setRisk("idle"); setShowResult(false); setError(null)
    setPrenom(""); setNom("")
    setAutreSecteur(""); setAutreType(""); setAutreBanque("")
    setLastScore(null); setPersistedScore(null); setScoreDelta(0); setFlashDir(null)
    if (onRiskChange) onRiskChange("idle")
  }

  // Scroll reveal
  useEffect(() => {
    const els = document.querySelectorAll(".reveal")
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target) } })
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" })
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  const Icon = {
    profile:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>,
    financial: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 21h18M5 21V9m4 12V5m4 16v-9m4 9v-7m4 7v-4"/></svg>,
    history:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 7v5l3 2"/><circle cx="12" cy="12" r="9"/></svg>,
    arrow:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
    user:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>,
  }

  const riskLabel = persistedScore !== null
    ? (persistedScore >= 70 ? "FAIBLE" : persistedScore >= 50 ? "MODÉRÉ" : "ÉLEVÉ")
    : (liveScore >= 70 ? "FAIBLE" : liveScore >= 50 ? "MODÉRÉ" : "ÉLEVÉ")

  return (
    <>
      <BubbleField intensity={1}/>

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
            {/* LEFT: Form */}
            <div className="form-card">
              {/* Identity block */}
              <div className="form-block">
                <div className="form-block-head">
                  <div className="form-block-icon">{Icon.user}</div>
                  <div className="form-block-title">Identité</div>
                  <div className="form-block-num">00 / 03</div>
                </div>
                <div className="field-grid">
                  <div className="field">
                    <label className="field-label">Prénom</label>
                    <input className="text-input" type="text" placeholder="Jean" value={prenom} onChange={e => setPrenom(e.target.value)}/>
                  </div>
                  <div className="field">
                    <label className="field-label">Nom</label>
                    <input className="text-input" type="text" placeholder="Dupont" value={nom} onChange={e => setNom(e.target.value)}/>
                  </div>
                </div>
              </div>

              {/* Profile block – chip grids for secteur & type */}
              <div className="form-block">
                <div className="form-block-head">
                  <div className="form-block-icon">{Icon.profile}</div>
                  <div className="form-block-title">Profil client</div>
                  <div className="form-block-num">01 / 03</div>
                </div>
                <div className="field-grid">
                  <div className="field" style={{ gridColumn: "span 2" }}>
                    <label className="field-label">Secteur d'activité</label>
                    <div className="chip-grid">
                      {ALL_SECTEURS.map(s => (
                        <button
                          key={s}
                          className={`chip ${form.secteur === s ? 'chip-active' : ''}`}
                          onClick={() => {
                            up("secteur", s)
                            if (s !== "Autre") setAutreSecteur("")
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    {isAutreSecteur && (
                      <div className="autre-input-wrap">
                        <input
                          className="text-input"
                          type="text"
                          placeholder="Précisez votre secteur…"
                          value={autreSecteur}
                          onChange={e => setAutreSecteur(e.target.value)}
                          autoFocus
                        />
                      </div>
                    )}
                  </div>
                  <div className="field" style={{ gridColumn: "span 2" }}>
                    <label className="field-label">Type client</label>
                    <div className="chip-grid">
                      {ALL_TYPES.map(t => (
                        <button
                          key={t}
                          className={`chip ${form.type_client === t ? 'chip-active' : ''}`}
                          onClick={() => {
                            up("type_client", t)
                            if (t !== "Autre") setAutreType("")
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    {isAutreType && (
                      <div className="autre-input-wrap">
                        <input
                          className="text-input"
                          type="text"
                          placeholder="Précisez le type…"
                          value={autreType}
                          onChange={e => setAutreType(e.target.value)}
                          autoFocus
                        />
                      </div>
                    )}
                  </div>
                  <div className="field">
                    <label className="field-label">Région</label>
                    <SelectWrap value={form.region} onChange={v => up("region", v)} options={REGIONS}/>
                  </div>
                  <div className="field">
                    <label className="field-label">Banque domiciliataire</label>
                    <div className="chip-grid">
                      {BANQUES.map(b => (
                        <button
                          key={b}
                          className={`chip ${form.banque_domiciliation === b ? 'chip-active' : ''}`}
                          onClick={() => {
                            up("banque_domiciliation", b)
                            if (b !== "Autre") setAutreBanque("")
                          }}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                    {isAutreBanque && (
                      <div className="autre-input-wrap">
                        <input
                          className="text-input"
                          type="text"
                          placeholder="Autre banque…"
                          value={autreBanque}
                          onChange={e => setAutreBanque(e.target.value)}
                          autoFocus
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Financial block (unchanged) */}
              <div className="form-block">
                <div className="form-block-head">
                  <div className="form-block-icon" style={{ color: "var(--gold)", borderColor: "rgba(244,197,66,0.4)", background: "rgba(244,197,66,0.08)" }}>{Icon.financial}</div>
                  <div className="form-block-title">Données financières</div>
                  <div className="form-block-num">02 / 03</div>
                </div>
                <div className="field-grid-3">
                  <div className="field">
                    <label className="field-label">Encours (TND)</label>
                    <NumInput value={form.montant_encours_tnd} onChange={v => up("montant_encours_tnd", Number(v))} suffix="TND" min={0}/>
                    <div className="field-hint">Montant en cours bancaire</div>
                  </div>
                  <div className="field">
                    <label className="field-label">CA annuel (TND)</label>
                    <NumInput value={form.ca_annuel_tnd} onChange={v => up("ca_annuel_tnd", Number(v))} suffix="TND" min={0}/>
                    <div className="field-hint">Chiffre d'affaires annuel</div>
                  </div>
                  <div className="field">
                    <label className="field-label">Ancienneté (ans)</label>
                    <SliderField value={form.anciennete_annees} onChange={v => up("anciennete_annees", v)} min={0} max={30} step={1} suffix=" ans" ticks={["0", "10", "20", "30"]}/>
                  </div>
                  <div className="field">
                    <label className="field-label">Traites actives</label>
                    <NumInput value={form.nb_traites_actives} onChange={v => up("nb_traites_actives", Number(v))} min={0}/>
                  </div>
                  <div className="field">
                    <label className="field-label">Montant moy. traite</label>
                    <NumInput value={form.montant_moyen_traite} onChange={v => up("montant_moyen_traite", Number(v))} suffix="TND" min={0}/>
                  </div>
                  <div className="field">
                    <label className="field-label">Contrats actifs</label>
                    <NumInput value={form.nb_contrats_actifs} onChange={v => up("nb_contrats_actifs", Number(v))} min={0}/>
                  </div>
                </div>
              </div>

              {/* History block (unchanged) */}
              <div className="form-block">
                <div className="form-block-head">
                  <div className="form-block-icon" style={{ color: "var(--burgundy-soft)", borderColor: "rgba(168,64,79,0.4)", background: "rgba(168,64,79,0.08)" }}>{Icon.history}</div>
                  <div className="form-block-title">Historique de paiement</div>
                  <div className="form-block-num">03 / 03</div>
                </div>
                <div className="field-grid-3">
                  <div className="field">
                    <label className="field-label">Retards 12 mois</label>
                    <SliderField value={form.nb_retards_12m} onChange={v => up("nb_retards_12m", v)} min={0} max={12} step={1} ticks={["0", "6", "12"]}/>
                    <div className="field-hint">Effectués sur 12 mois</div>
                  </div>
                  <div className="field">
                    <label className="field-label">Impayés</label>
                    <SliderField value={form.nb_impayes} onChange={v => up("nb_impayes", v)} min={0} max={10} step={1} ticks={["0", "5", "10"]}/>
                    <div className="field-hint">Factures non réglées</div>
                  </div>
                  <div className="field">
                    <label className="field-label">Délai moy. paiement (j)</label>
                    <NumInput value={form.delai_moyen_jours} onChange={v => up("delai_moyen_jours", Number(v))} suffix="j" min={0}/>
                    <div className="field-hint">Jours moyens de paiement</div>
                  </div>
                  <div className="field">
                    <label className="field-label">Chèques retournés</label>
                    <SliderField value={form.nb_cheques_retournes} onChange={v => up("nb_cheques_retournes", v)} min={0} max={10} step={1} ticks={["0", "5", "10"]}/>
                    <div className="field-hint">Chèques sans provision</div>
                  </div>
                  <div className="field">
                    <label className="field-label">Litiges en cours</label>
                    <NumInput value={form.nb_litiges} onChange={v => up("nb_litiges", Number(v))} min={0}/>
                  </div>
                  <div className="field">
                    <label className="field-label">Concentration (%)</label>
                    <SliderField value={form.concentration_pct} onChange={v => up("concentration_pct", v)} min={0} max={100} step={1} suffix="%" ticks={["0", "50", "100"]}/>
                    <div className="field-hint">% du CA chez STBG</div>
                  </div>
                </div>
              </div>

              {/* Submit row – NO reset button, smaller submit */}
              <div className="submit-row">
                <button className="submit-btn" onClick={handleAnalyze} disabled={analyzing} type="button">
                  <svg className="submit-ring" viewBox="0 0 24 24">
                    <circle className="track" cx="12" cy="12" r="9"/>
                    <circle className="indicator" cx="12" cy="12" r="9"
                      strokeDasharray={`${2 * Math.PI * 9}`}
                      strokeDashoffset={`${2 * Math.PI * 9 * (1 - filledRatio)}`}/>
                  </svg>
                  <span>Analyser le risque</span>
                  {Icon.arrow}
                </button>
                {/* Reset button removed */}
              </div>

              {error && (
                <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(211,74,74,0.08)", border: "1px solid rgba(211,74,74,0.25)", borderRadius: 10, fontSize: 13, color: "#d34a4a" }}>
                  ⚠ {error}
                </div>
              )}
            </div>

            {/* RIGHT: Live risk rail – uses persistedScore */}
            <div className="risk-rail">
              <div className="risk-card">
                <div className="risk-card-head">
                  <div className="risk-card-title">Score en direct</div>
                  <div className="risk-card-live"><span className="dot"/>LIVE</div>
                </div>
                <div className="bottle-mini">
                  <Bottle fillPct={persistedScore ?? liveScore} color={liquidColor} bubbles={false} size="small"/>
                </div>
                <div className="risk-readout">
                  <div className={`risk-readout-score${flashDir ? ` flash-${flashDir}` : ""}`} style={{ color: liquidColor }}>
                    {persistedScore ?? liveScore}<span className="of"> / 100</span>
                  </div>
                  {flashDir && scoreDelta !== 0 && (
                    <div className={`score-delta score-delta-${flashDir}`}>
                      {flashDir === "up" ? "+" : ""}{scoreDelta}
                    </div>
                  )}
                  <div className="risk-readout-grade" style={{
                    background: `${liquidColor}22`, color: liquidColor, border: `1px solid ${liquidColor}55`
                  }}>
                    {riskLabel}
                  </div>
                </div>
                <div className="factor-list">
                  {liveFactors.map(f => {
                    const c = f.val >= 70 ? "var(--green)" : f.val >= 45 ? "var(--amber)" : "var(--red)"
                    return (
                      <div key={f.key} className="factor">
                        <div className="factor-label">{f.label}</div>
                        <div className="factor-bar"><div className="factor-bar-fill" style={{ width: `${f.val}%`, background: c }}/></div>
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
      <div className={`takeover${analyzing ? " open" : ""}`}>
        <div className="takeover-inner">
          <Bottle fillPct={progress} color={liquidColor} bubbles={false}/>
          <div className="takeover-text">Analyse en cours…</div>
          <div className="takeover-progress">
            <div className="takeover-progress-fill" style={{ width: `${progress}%` }}/>
          </div>
          <div className="takeover-status">{stage} · {Math.round(progress)}%</div>
        </div>
      </div>

      {/* Result modal */}
      <div className={`result-overlay${showResult ? " open" : ""}`}
        onClick={e => { if (e.target.classList.contains("result-overlay")) setShowResult(false) }}>
        {showResult && result && (
          <ResultModal result={result} onClose={() => setShowResult(false)} lang={lang}/>
        )}
      </div>
    </>
  )
}