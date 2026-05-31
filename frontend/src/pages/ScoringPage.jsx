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

// ── Number input — clean, no spinners, empty stays empty ─────────────────────
function NumInput({ value, onChange, suffix, min=0, max, showZero=false }) {
  const [raw, setRaw] = useState((value === 0 && !showZero) ? "" : String(value))

  useEffect(() => {
    if (value === 0 && !showZero) setRaw("")
    else setRaw(String(value))
  }, [value, showZero])

  return (
    <div className="num-input">
      <input
        type="number" value={raw} min={min} max={max}
        onChange={e => {
          const str = e.target.value
          setRaw(str)
          if (str === "" || str === "-") { onChange(0); return }
          let v = Number(str)
          if (isNaN(v)) return
          if (max !== undefined) v = Math.min(max, v)
          v = Math.max(min, v)
          onChange(v)
        }}
        onBlur={() => {
          if (raw === "" || raw === "-") { setRaw(""); onChange(0) }
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

// ── Smart reason engine — reads real form data ────────────────────────────────
function buildInsights(result, form) {
  const score = result.score
  const insights = []

  // Payment behavior
  if (form.nb_retards_12m >= 4) {
    insights.push({ type:"risk", category:"Comportement paiement", text:`${form.nb_retards_12m} retards de paiement enregistrés sur les 12 derniers mois, ce qui dépasse le seuil acceptable de 3.` })
  } else if (form.nb_retards_12m === 0) {
    insights.push({ type:"strength", category:"Comportement paiement", text:`Aucun retard de paiement sur les 12 derniers mois — historique irréprochable.` })
  } else {
    insights.push({ type:"neutral", category:"Comportement paiement", text:`${form.nb_retards_12m} retard${form.nb_retards_12m>1?"s":""} de paiement sur 12 mois, dans la limite acceptable.` })
  }

  // Financial health
  const ratio = form.ca_annuel_tnd > 0 ? form.montant_encours_tnd / form.ca_annuel_tnd : 0
  if (ratio > 0.5) {
    insights.push({ type:"risk", category:"Santé financière", text:`L'encours de ${form.montant_encours_tnd.toLocaleString()} TND représente ${Math.round(ratio*100)}% du CA annuel — ratio d'exposition élevé.` })
  } else if (ratio < 0.15 && form.ca_annuel_tnd > 0) {
    insights.push({ type:"strength", category:"Santé financière", text:`L'encours de ${form.montant_encours_tnd.toLocaleString()} TND est bien maîtrisé par rapport au CA annuel de ${form.ca_annuel_tnd.toLocaleString()} TND.` })
  } else if (form.ca_annuel_tnd > 0) {
    insights.push({ type:"neutral", category:"Santé financière", text:`Ratio encours/CA de ${Math.round(ratio*100)}% — exposition financière dans les normes.` })
  }

  // Ancienneté
  if (form.anciennete_annees >= 10) {
    insights.push({ type:"strength", category:"Ancienneté", text:`Relation commerciale établie depuis ${form.anciennete_annees} ans — partenaire historique, risque de rupture faible.` })
  } else if (form.anciennete_annees <= 2) {
    insights.push({ type:"risk", category:"Ancienneté", text:`Relation récente de ${form.anciennete_annees} an${form.anciennete_annees>1?"s":""} — historique insuffisant pour évaluer la fiabilité à long terme.` })
  }

  // Litiges & chèques
  if (form.nb_impayes > 0 || form.nb_cheques_retournes > 0 || form.nb_litiges > 0) {
    const parts = []
    if (form.nb_impayes > 0) parts.push(`${form.nb_impayes} impayé${form.nb_impayes>1?"s":""}`)
    if (form.nb_cheques_retournes > 0) parts.push(`${form.nb_cheques_retournes} chèque${form.nb_cheques_retournes>1?"s":""} retourné${form.nb_cheques_retournes>1?"s":""}`)
    if (form.nb_litiges > 0) parts.push(`${form.nb_litiges} litige${form.nb_litiges>1?"s":""} en cours`)
    insights.push({ type:"risk", category:"Litiges & incidents", text:`Incidents de paiement détectés : ${parts.join(", ")}.` })
  } else {
    insights.push({ type:"strength", category:"Litiges & incidents", text:`Aucun incident de paiement, litige ou chèque retourné — dossier propre.` })
  }

  // Concentration
  if (form.concentration_pct > 60) {
    insights.push({ type:"risk", category:"Concentration", text:`Concentration de ${form.concentration_pct}% du CA chez STBG — dépendance excessive, risque systémique.` })
  } else if (form.concentration_pct < 20) {
    insights.push({ type:"strength", category:"Concentration", text:`Portefeuille diversifié : ${form.concentration_pct}% du CA chez STBG seulement.` })
  }

  // Délai moyen
  if (form.delai_moyen_jours > 60) {
    insights.push({ type:"risk", category:"Délais de règlement", text:`Délai moyen de règlement de ${form.delai_moyen_jours} jours — bien au-delà des 30-45 jours standard.` })
  } else if (form.delai_moyen_jours <= 30 && form.delai_moyen_jours > 0) {
    insights.push({ type:"strength", category:"Délais de règlement", text:`Délai moyen de règlement de ${form.delai_moyen_jours} jours — dans les normes optimales.` })
  }

  return insights
}

// ── PDF generator ─────────────────────────────────────────────────────────────
async function generatePDF(result, form, clientName, region) {
  const score = result.score
  const level = result.niveau
  const color = score <= 30 ? [92,184,116] : score <= 60 ? [232,169,61] : [211,74,74]
  const colorHex = score <= 30 ? "#5cb874" : score <= 60 ? "#e8a93d" : "#d34a4a"
  const insights = buildInsights(result, form)
  const date = new Date().toLocaleDateString("fr-FR", { year:"numeric", month:"long", day:"numeric" })

  // Load jsPDF UMD script (attaches to window.jspdf)
  await new Promise((resolve, reject) => {
    if (window.jspdf) { resolve(); return; }
    const s = document.createElement("script")
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
    s.onload = resolve; s.onerror = reject
    document.head.appendChild(s)
  })
  const { jsPDF } = window.jspdf
  const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" })
  const W = 210, H = 297
  const margin = 20

  // ── Background
  doc.setFillColor(10, 6, 18)
  doc.rect(0, 0, W, H, "F")

  // ── Gold top bar
  doc.setFillColor(244, 197, 66)
  doc.rect(0, 0, W, 1.5, "F")

  // ── Left accent strip
  doc.setFillColor(...color)
  doc.rect(0, 0, 4, H, "F")

  // ── Header area
  doc.setFillColor(18, 10, 31)
  doc.rect(4, 0, W-4, 48, "F")

  // STBG logo text
  doc.setTextColor(244, 197, 66)
  doc.setFontSize(22)
  doc.setFont("helvetica", "bold")
  doc.text("STBG", margin, 20)
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(122, 111, 90)
  doc.text("SOCIÉTÉ TUNISIENNE DE BOISSONS GAZEUSES", margin, 26)

  // Report type
  doc.setFontSize(9)
  doc.setTextColor(180, 160, 120)
  doc.text("RAPPORT D'ÉVALUATION DU RISQUE CLIENT", margin, 34)
  doc.text(`Émis le ${date}`, margin, 40)

  // Score badge — right side
  doc.setFillColor(...color, 30)
  doc.roundedRect(W-60, 8, 40, 32, 4, 4, "F")
  doc.setDrawColor(...color)
  doc.setLineWidth(0.5)
  doc.roundedRect(W-60, 8, 40, 32, 4, 4, "S")
  doc.setTextColor(...color)
  doc.setFontSize(28)
  doc.setFont("helvetica", "bold")
  doc.text(String(score), W-40, 28, { align:"center" })
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.text("/ 100", W-40, 34, { align:"center" })
  doc.setFontSize(7)
  doc.text(level, W-40, 40, { align:"center" })

  let y = 58

  // ── Client info section
  doc.setFillColor(24, 16, 42)
  doc.rect(margin, y, W - margin*2, 28, "F")
  doc.setDrawColor(60, 45, 90)
  doc.setLineWidth(0.3)
  doc.rect(margin, y, W - margin*2, 28, "S")

  doc.setTextColor(122, 111, 90)
  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.text("CLIENT", margin+6, y+7)
  doc.text("SECTEUR", margin+70, y+7)
  doc.text("RÉGION", margin+120, y+7)
  doc.text("TYPE", margin+155, y+7)

  doc.setTextColor(245, 239, 224)
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text(clientName || "—", margin+6, y+17)
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.text(form.secteur || "—", margin+70, y+17)
  doc.text(region || "—", margin+120, y+17)
  doc.text(form.type_client || "—", margin+155, y+17)

  doc.setTextColor(122,111,90)
  doc.setFontSize(7)
  doc.text(`Ancienneté: ${form.anciennete_annees} ans  ·  Banque: ${form.banque_domiciliation||"—"}`, margin+6, y+25)

  y += 36

  // ── Score gauge bar
  doc.setTextColor(180, 160, 120)
  doc.setFontSize(7)
  doc.text("INDICE DE RISQUE", margin, y)
  y += 5
  doc.setFillColor(30, 20, 50)
  doc.roundedRect(margin, y, W-margin*2, 5, 2, 2, "F")
  doc.setFillColor(...color)
  doc.roundedRect(margin, y, (W-margin*2)*(score/100), 5, 2, 2, "F")
  doc.setTextColor(...color)
  doc.setFontSize(7)
  doc.text("Faible risque", margin, y+10)
  doc.text("Risque élevé", W-margin, y+10, { align:"right" })
  y += 16

  // ── Verdict box
  const verdict =
    level==="FAIBLE"
      ? "Le profil présente un niveau de risque faible. L'historique de paiement est régulier, les ratios financiers sont solides et l'ancienneté de la relation est significative. Un engagement commercial sans réserve est recommandé."
      : level==="MODÉRÉ"
        ? "Le profil est globalement sain mais présente des zones de vigilance. Un suivi rapproché des délais de paiement et de la concentration est conseillé avant tout engagement majeur."
        : "Des signaux d'alerte significatifs ont été détectés. Des retards répétés, une concentration excessive ou un historique d'incidents nécessitent une revue approfondie par le comité risque avant tout engagement."

  doc.setFillColor(18, 12, 30)
  doc.setDrawColor(244, 197, 66, 40)
  doc.roundedRect(margin, y, W-margin*2, 20, 3, 3, "FD")
  doc.setTextColor(180, 160, 120)
  doc.setFontSize(7)
  const lines = doc.splitTextToSize(verdict, W-margin*2-12)
  doc.text(lines, margin+6, y+7)
  y += 26

  // ── Section: Analyse détaillée
  doc.setTextColor(244, 197, 66)
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text("ANALYSE DÉTAILLÉE", margin, y)
  doc.setDrawColor(244, 197, 66)
  doc.setLineWidth(0.3)
  doc.line(margin+50, y-1, W-margin, y-1)
  y += 7

  insights.forEach((ins) => {
    const icolor = ins.type==="strength" ? [92,184,116] : ins.type==="risk" ? [211,74,74] : [180,160,120]
    doc.setFillColor(18, 12, 30)
    doc.setDrawColor(...icolor, 60)
    doc.setLineWidth(0.3)
    const textLines = doc.splitTextToSize(ins.text, W-margin*2-26)
    const boxH = 6 + textLines.length * 4.5
    doc.roundedRect(margin, y, W-margin*2, boxH, 2, 2, "FD")
    // Left indicator stripe
    doc.setFillColor(...icolor)
    doc.roundedRect(margin, y, 3, boxH, 1, 1, "F")
    // Category label
    doc.setTextColor(...icolor)
    doc.setFontSize(6.5)
    doc.setFont("helvetica", "bold")
    doc.text(ins.category.toUpperCase(), margin+8, y+5)
    // Text
    doc.setTextColor(180, 160, 120)
    doc.setFontSize(7.5)
    doc.setFont("helvetica", "normal")
    doc.text(textLines, margin+8, y+10)
    y += boxH + 4
    if (y > H - 40) {
      doc.addPage()
      doc.setFillColor(10, 6, 18)
      doc.rect(0, 0, W, H, "F")
      doc.setFillColor(...color)
      doc.rect(0, 0, 4, H, "F")
      y = 20
    }
  })

  y += 4

  // ── Key metrics table
  if (y < H - 70) {
    doc.setTextColor(244, 197, 66)
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text("DONNÉES CLÉS", margin, y)
    doc.setDrawColor(244, 197, 66)
    doc.setLineWidth(0.3)
    doc.line(margin+38, y-1, W-margin, y-1)
    y += 6

    const metrics = [
      ["Encours TND", `${form.montant_encours_tnd?.toLocaleString()||0} TND`],
      ["CA Annuel", `${form.ca_annuel_tnd?.toLocaleString()||0} TND`],
      ["Délai moyen règlement", `${form.delai_moyen_jours||0} jours`],
      ["Traites actives", String(form.nb_traites_actives||0)],
      ["Concentration STBG", `${form.concentration_pct||0}%`],
    ]
    metrics.forEach(([k,v], i) => {
      const rowY = y + i*8
      if (i%2===0) {
        doc.setFillColor(20, 14, 35)
        doc.rect(margin, rowY, W-margin*2, 8, "F")
      }
      doc.setTextColor(122, 111, 90)
      doc.setFontSize(7.5)
      doc.setFont("helvetica", "normal")
      doc.text(k, margin+4, rowY+5.5)
      doc.setTextColor(245, 239, 224)
      doc.text(v, W-margin-4, rowY+5.5, { align:"right" })
    })
    y += metrics.length * 8 + 8
  }

  // ── Footer
  doc.setFillColor(18, 10, 31)
  doc.rect(0, H-14, W, 14, "F")
  doc.setFillColor(244, 197, 66)
  doc.rect(0, H-14, W, 0.5, "F")
  doc.setTextColor(122, 111, 90)
  doc.setFontSize(6.5)
  doc.setFont("helvetica", "normal")
  doc.text("STBG — Document confidentiel à usage interne exclusif", margin, H-6)
  doc.text(`Score ${score}/100 · Niveau ${level} · ${date}`, W-margin, H-6, { align:"right" })

  doc.save(`STBG_Risque_${(clientName||"Client").replace(/\s/g,"_")}_${score}.pdf`)
}

// ── Result modal ───────────────────────────────────────────────────────────────
function ResultModal({ result, clientName, region, form, onClose }) {
  const [animScore, setAnimScore] = useState(0)
  const [animFill,  setAnimFill]  = useState(0)
  const [insVisible, setInsVisible] = useState([])
  const [factorsReady, setFactorsReady] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const score = result.score
  const color = score <= 30 ? "#5cb874" : score <= 60 ? "#e8a93d" : "#d34a4a"
  const level = result.niveau
  const gradeItalic = level==="FAIBLE"?"sain":level==="MODÉRÉ"?"à surveiller":"critique"
  const verdict =
    level==="FAIBLE"
      ? "Profil solide — historique de paiement régulier, ratios financiers favorables, ancienneté significative. Engagement recommandé sans réserve."
      : level==="MODÉRÉ"
        ? "Profil globalement sain avec des zones de vigilance. Un suivi rapproché des délais et de la concentration est conseillé."
        : "Signaux d'alerte significatifs détectés. Une revue approfondie est requise avant tout engagement."

  const insights = buildInsights(result, form)
  const factors  = computeLiveFactors(form)

  useEffect(() => {
    let f=0, s=0
    const fIv = setInterval(()=>{ f+=2; setAnimFill(Math.min(score,f)); if(f>=score) clearInterval(fIv) }, 14)
    const sIv = setInterval(()=>{ s+=Math.max(1,Math.round((score-s)/5)); setAnimScore(Math.min(score,s)); if(s>=score) clearInterval(sIv) }, 25)
    insights.forEach((_,i) => {
      setTimeout(()=>{ setInsVisible(p=>{ const n=[...p]; n[i]=1; return n }) }, 300+i*100)
    })
    setTimeout(()=>setFactorsReady(true), 200)
    return () => { clearInterval(fIv); clearInterval(sIv) }
  }, [score])

  const handlePDF = async () => {
    setPdfLoading(true)
    try { await generatePDF(result, form, clientName, region) }
    catch(e) { console.error(e) }
    finally { setPdfLoading(false) }
  }

  return (
    <div className="result-modal" onClick={e=>e.stopPropagation()}>
      <button className="result-close" onClick={onClose}>
        <svg viewBox="0 0 14 14" width="11" height="11">
          <path d="M2 2 L12 12 M12 2 L2 12" stroke="currentColor" strokeWidth="1.6"/>
        </svg>
      </button>

      {/* Left — bottle */}
      <div className="result-bottle-panel">
        <Bottle fillPct={animFill} color={color} bubbles={animFill>5} size="small"/>
        <div className="result-bottle-region">
          {clientName || "Client"} · {region}
        </div>
      </div>

      {/* Right — scrollable info */}
      <div className="result-info-panel">
        <div className="result-eyebrow">Évaluation du risque · STBG</div>

        {/* Score */}
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
            <div className="result-gauge-fill" style={{ width:`${score}%`, background:`linear-gradient(90deg, #5cb874, ${color})` }}/>
          </div>
          <div className="result-gauge-labels">
            <span>Faible</span><span>Modéré</span><span>Élevé</span>
          </div>
        </div>

        {/* Verdict */}
        <p className="result-verdict">{verdict}</p>

        {/* Factor scores */}
        <div className="factors-eyebrow">Scores par critère</div>
        <div className="factors-grid">
          {factors.map(f => {
            const c = f.val>=70?"var(--green)":f.val>=45?"var(--amber)":"var(--red)"
            return (
              <div key={f.key} className="factor-item">
                <div className="factor-item-head">
                  <span className="factor-item-label">{f.label}</span>
                  <span className="factor-item-val" style={{ color:c }}>{f.val}</span>
                </div>
                <div className="factor-item-bar">
                  <div className="factor-item-fill" style={{ width: factorsReady?`${f.val}%`:"0%", background:c }}/>
                </div>
              </div>
            )
          })}
        </div>

        <div className="result-divider"/>

        {/* Insight cards */}
        <div className="insight-eyebrow">Points clés du dossier</div>
        <div className="insight-list">
          {insights.map((ins, i) => (
            <div key={i} className={`insight-card insight-${ins.type}`}
              style={{ opacity: insVisible[i]?1:0, transform: insVisible[i]?"translateY(0)":"translateY(8px)", transition:`opacity .4s ease ${i*0.08}s, transform .4s ease ${i*0.08}s` }}>
              <div className="insight-dot"/>
              <div className="insight-body">
                <div className="insight-category">{ins.category}</div>
                <div className="insight-text">{ins.text}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="result-actions">
          <button className="btn-primary" onClick={handlePDF} disabled={pdfLoading}>
            {pdfLoading ? "Génération…" : "Télécharger le rapport PDF"}
          </button>
          <button className="btn-ghost" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  )
}

// ── Live factor computation ───────────────────────────────────────────────────
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

// ── Data ──────────────────────────────────────────────────────────────────────
const SECTEUR_GROUPS = [
  {
    group: "Production & Industrie",
    items: ["Industrie","Agro-alimentaire","Agriculture","BTP","Artisanat","Pêche"]
  },
  {
    group: "Commerce & Logistique",
    items: ["Commerce","Distribution","Transport","Immobilier","Import-Export"]
  },
  {
    group: "Services & Tertiaire",
    items: ["Services","Technologie","Santé","Éducation","Hôtellerie & Restauration","Autre"]
  }
]

const TYPE_GROUPS = [
  {
    group: "Négoce",
    items: ["Grossiste","Détaillant","Grande surface","Export","Import-Export"]
  },
  {
    group: "Structure",
    items: ["PME","Grande entreprise","Startup","Restauration","Association","Autre"]
  }
]

const ALL_SECTEURS = SECTEUR_GROUPS.flatMap(g => g.items)
const ALL_TYPES    = TYPE_GROUPS.flatMap(g => g.items)

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
  // Color based on the TRUE displayed score (persisted or default 50)
  const trueDisplayScore = persistedResult ? persistedResult.score : 50
  const liquidColor = trueDisplayScore>=70?"#5cb874":trueDisplayScore>=50?"#f4c542":trueDisplayScore>=30?"#e8a93d":"#d34a4a"

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

  // Scroll reveal — directional
  useEffect(() => {
    const els = document.querySelectorAll(".reveal, .reveal-left, .reveal-right")
    const io = new IntersectionObserver(entries=>{
      entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target) } })
    }, { threshold:0.06, rootMargin:"0px 0px -40px 0px" })
    els.forEach(el=>io.observe(el))
    return ()=>io.disconnect()
  }, [])

  // Scroll parallax for risk card bottle
  const [scrollY, setScrollY] = useState(0)
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
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
  // Display the TRUE ML score (last analyzed), or 50 by default — never the broken live estimate
  const displayScore = persistedResult ? persistedResult.score : 50
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
              <div className="form-block reveal-left">
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
              <div className="form-block reveal-right">
                <div className="form-block-head">
                  <div className="form-block-icon">{Icon.profile}</div>
                  <div className="form-block-title">Profil client</div>
                  <div className="form-block-num">01 / 03</div>
                </div>

                {/* Secteur — grouped text chips */}
                <div className="field" style={{ marginBottom:24 }}>
                  <label className="field-label">Secteur d'activité</label>
                  <div className="chip-groups">
                    {SECTEUR_GROUPS.map(g => (
                      <div key={g.group} className="chip-group">
                        <div className="chip-group-label">{g.group}</div>
                        <div className="chip-row">
                          {g.items.map(s => (
                            <button key={s} type="button"
                              className={`chip-pro${form.secteur===s||( s==="Autre"&&isAutreSecteur)?" chip-pro-active":""}`}
                              onClick={()=>{ up("secteur",s); if(s!=="Autre") setAutreSecteur("") }}>
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="autre-input-wrap" style={{ display: isAutreSecteur?"block":"none" }}>
                    <input className="text-input" type="text" placeholder="Précisez votre secteur…"
                      value={autreSecteur}
                      onChange={e=>{ setAutreSecteur(e.target.value); up("secteur_libre", e.target.value) }}/>
                  </div>
                </div>

                {/* Type client — grouped text chips */}
                <div className="field" style={{ marginBottom:24 }}>
                  <label className="field-label">Type client</label>
                  <div className="chip-groups">
                    {TYPE_GROUPS.map(g => (
                      <div key={g.group} className="chip-group">
                        <div className="chip-group-label">{g.group}</div>
                        <div className="chip-row">
                          {g.items.map(ty => (
                            <button key={ty} type="button"
                              className={`chip-pro${form.type_client===ty||(ty==="Autre"&&isAutreType)?" chip-pro-active":""}`}
                              onClick={()=>{ up("type_client",ty); if(ty!=="Autre") setAutreType("") }}>
                              {ty}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="autre-input-wrap" style={{ display: isAutreType?"block":"none" }}>
                    <input className="text-input" type="text" placeholder="Précisez le type…"
                      value={autreType}
                      onChange={e=>{ setAutreType(e.target.value) }}/>
                  </div>
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
              <div className="form-block reveal-left">
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
              <div className="form-block reveal-right">
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
                    <NumInput value={form.nb_litiges} onChange={v=>up("nb_litiges",v)} min={0} showZero/>
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
                  <span>Réinitialiser</span>
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
                {/* Header — client name + status */}
                <div className="risk-card-head">
                  <div>
                    <div className="risk-card-label">Profil analysé</div>
                    <div className="risk-card-client-name">
                      {clientName || <span style={{ color:"var(--ink-mute)", fontStyle:"italic", fontSize:13 }}>Nouveau client</span>}
                    </div>
                  </div>
                  {persistedResult ? (
                    <button className="risk-see-btn" onClick={()=>setShowResult(true)}>VOIR RAPPORT</button>
                  ) : (
                    <div className="risk-card-live"><span className="dot"/>EN ATTENTE</div>
                  )}
                </div>

                {/* Bottle — with scroll parallax */}
                <div className="bottle-mini" style={{ transform:`translateY(${scrollY * 0.04}px)` }}>
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
        onClick={e=>{ if(e.target.classList.contains("result-overlay")||e.target.classList.contains("result-overlay-inner")) setShowResult(false) }}>
        <div className="result-overlay-inner">
          {showResult && result && (
            <ResultModal
              result={result}
              clientName={clientName}
              region={form.region}
              form={form}
              onClose={()=>setShowResult(false)}
            />
          )}
        </div>
      </div>
    </>
  )
}