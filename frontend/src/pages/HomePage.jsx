import { useState, useEffect, useRef, useMemo, useCallback } from "react"

// ── Translation helper ────────────────────────────────────────────────────────
const T = lang => (fr, en) => lang === "en" ? en : fr

// ── Bottle SVG ────────────────────────────────────────────────────────────────
function Bottle({ fillPct = 0, color = "#f4c542" }) {
  const pct = Math.max(0, Math.min(100, fillPct))
  const surfaceY = 305 - (pct / 100) * 165
  const innerBubbles = useMemo(() => Array.from({ length: 8 }, () => ({
    cx: 75 + Math.random() * 50,
    r:  1.5 + Math.random() * 2.5,
    delay: Math.random() * 3,
    dur:   2 + Math.random() * 2,
  })), [])

  return (
    <svg viewBox="0 0 200 400" style={{ overflow:"visible", display:"block", width:"100%", height:"100%" }} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="liq-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.95"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.7"/>
        </linearGradient>
        <linearGradient id="glass-g" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="rgba(244,197,66,0.08)"/>
          <stop offset="50%"  stopColor="rgba(244,197,66,0.02)"/>
          <stop offset="100%" stopColor="rgba(244,197,66,0.08)"/>
        </linearGradient>
        <clipPath id="btl-clip">
          <path d="M 70 75 L 70 110 Q 50 125,50 160 L 50 340 Q 50 365,75 365 L 125 365 Q 150 365,150 340 L 150 160 Q 150 125,130 110 L 130 75 Z"/>
        </clipPath>
        <filter id="btl-glow"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <ellipse cx="100" cy="370" rx="80" ry="14" fill={color} opacity={0.25*(pct/100)} filter="url(#btl-glow)"/>
      <rect x="78" y="30" width="44" height="22" rx="3" fill="#7a2d3a" stroke={color} strokeWidth="1"/>
      <rect x="80" y="34" width="40" height="2" fill={color} opacity="0.4"/>
      <rect x="80" y="40" width="40" height="2" fill={color} opacity="0.4"/>
      <rect x="80" y="46" width="40" height="2" fill={color} opacity="0.4"/>
      <rect x="78" y="52" width="44" height="25" rx="2" fill="rgba(244,197,66,0.06)" stroke="rgba(244,197,66,0.25)" strokeWidth="0.8"/>
      <path d="M 70 75 L 70 110 Q 50 125,50 160 L 50 340 Q 50 365,75 365 L 125 365 Q 150 365,150 340 L 150 160 Q 150 125,130 110 L 130 75 Z" fill="url(#glass-g)" stroke="rgba(244,197,66,0.4)" strokeWidth="1.2"/>
      <g clipPath="url(#btl-clip)">
        <rect x="40" y={surfaceY} width="120" height="200" fill="url(#liq-g)" style={{ transition:"y 0.8s cubic-bezier(0.2,0.7,0.2,1)" }}/>
        <path d={`M 40 ${surfaceY} Q 60 ${surfaceY-4},100 ${surfaceY} T 160 ${surfaceY} L 160 ${surfaceY+8} L 40 ${surfaceY+8} Z`} fill={color} opacity="0.6">
          <animate attributeName="d" dur="3s" repeatCount="indefinite"
            values={`M 40 ${surfaceY} Q 60 ${surfaceY-4},100 ${surfaceY} T 160 ${surfaceY} L 160 ${surfaceY+8} L 40 ${surfaceY+8} Z;M 40 ${surfaceY} Q 60 ${surfaceY+4},100 ${surfaceY} T 160 ${surfaceY} L 160 ${surfaceY+8} L 40 ${surfaceY+8} Z;M 40 ${surfaceY} Q 60 ${surfaceY-4},100 ${surfaceY} T 160 ${surfaceY} L 160 ${surfaceY+8} L 40 ${surfaceY+8} Z`}/>
        </path>
        {pct > 5 && innerBubbles.map((b, i) => (
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
      <path d="M 60 130 Q 56 230,62 330" stroke="rgba(255,255,255,0.15)" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function lerp(a, b, t) { return a + (b-a)*t }
function easeIO(t) { return t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2,2)/2 }

function colorAt(p) {
  const stops = [{p:0,c:[244,197,66]},{p:0.45,c:[232,93,61]},{p:1,c:[92,184,116]}]
  for (let i=0;i<stops.length-1;i++) {
    const a=stops[i], b=stops[i+1]
    if (p>=a.p && p<=b.p) {
      const t=(p-a.p)/(b.p-a.p)
      return `rgb(${Math.round(a.c[0]+(b.c[0]-a.c[0])*t)},${Math.round(a.c[1]+(b.c[1]-a.c[1])*t)},${Math.round(a.c[2]+(b.c[2]-a.c[2])*t)})`
    }
  }
  return "#f4c542"
}

// ── Reveal hook ───────────────────────────────────────────────────────────────
function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if(e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target) } })
    }, { threshold:0.05, rootMargin:"0px 0px -5% 0px" })
    document.querySelectorAll(".hv2-reveal,.hv2-tilt").forEach(el => {
      const r = el.getBoundingClientRect()
      if (r.top < window.innerHeight*0.95) el.classList.add("in")
      else io.observe(el)
    })
    // Batch the fallback check into rAF instead of running it on every raw
    // scroll tick — querySelectorAll + getBoundingClientRect force layout,
    // and doing that dozens of times per frame (trackpads especially) was
    // fighting the compositor and making the whole page feel less smooth.
    let ticking = false
    const checkReveals = () => {
      document.querySelectorAll(".hv2-reveal:not(.in),.hv2-tilt:not(.in)").forEach(el => {
        const r = el.getBoundingClientRect()
        if (r.top < window.innerHeight*0.92) { el.classList.add("in"); io.unobserve(el) }
      })
      ticking = false
    }
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(checkReveals)
    }
    window.addEventListener("scroll", onScroll, { passive:true })
    return () => { io.disconnect(); window.removeEventListener("scroll", onScroll) }
  }, [])
}

// ── Animated count-up ─────────────────────────────────────────────────────────
function useCountUp(target, trigger) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!trigger) return
    let raf
    const start = performance.now()
    const animate = now => {
      const t = Math.min(1,(now-start)/1500)
      setVal(target*(1-Math.pow(1-t,3)))
      if (t<1) raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [target, trigger])
  return val
}

// ── Eyebrow ───────────────────────────────────────────────────────────────────
function Eyebrow({ num, label, center }) {
  return (
    <div className="hv2-eyebrow-sm" style={center ? { justifyContent:"center" } : {}}>
      {num && <span className="num">{num}</span>}
      <span className="line"/>
      {label}
    </div>
  )
}

// ── Rotating phrase — swaps the hero's italic closing every few seconds ────────
function RotatingPhrase({ phrases }) {
  const [i, setI] = useState(0)
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    if (phrases.length <= 1) return
    const cycle = setInterval(() => {
      setVisible(false)
      setTimeout(() => { setI(n => (n+1) % phrases.length); setVisible(true) }, 380)
    }, 3200)
    return () => clearInterval(cycle)
  }, [phrases.length])

  return (
    <em className="hv2-rotating" style={{ opacity: visible?1:0, transform: visible?"translateY(0)":"translateY(10px)" }}>
      {phrases[i]}
    </em>
  )
}

// ═══════════════════════════════════════════════════════════════════
// SECTIONS
// ═══════════════════════════════════════════════════════════════════

// ── 01 HERO ───────────────────────────────────────────────────────
function HeroSection({ lang, onNav }) {
  const t = T(lang)
  const [entered, setEntered] = useState(false)
  useEffect(() => { const id = setTimeout(() => setEntered(true), 60); return () => clearTimeout(id) }, [])

  const words = lang==="fr" ? ["Le","risque","tunisien,"] : ["Tunisian","risk,","scored"]
  const rotatingPhrases = lang==="fr"
    ? ["servi avec précision.", "lu avant qu'il ne coûte.", "chiffré, pas deviné.", "expliqué, pas subi."]
    : ["served with precision.", "read before it costs you.", "measured, not guessed.", "explained, not just flagged."]

  return (
    <section id="sec-hero" className={`home-section-v2 hv2-hero ${entered?"entered":""}`}>
      <div className="home-section-wrap">
        <div className="home-content-half left">
          <div className="hv2-eyebrow">
            <span className="dot"/>
{t("Scoring crédit intelligent · STBGRisk","Intelligent credit scoring · STBGRisk")}
          </div>
          <h1 className={`hv2-h1 ${entered?"entered":""}`}>
            {words.map((w,i) => <span key={i} className="word"><span>{w}</span></span>).reduce((a,b,i) => [a," ",b])}
            {" "}<RotatingPhrase phrases={rotatingPhrases}/>
          </h1>
          <p className="hv2-lead">
            {t(
              "Plateforme de scoring du risque crédit-client conçue pour la STBG. Modèle XGBoost hybride, règles métier expertes, indicateurs sectoriels Tunisie.",
              "Client credit-risk scoring platform built for STBG. Hybrid XGBoost model, expert business rules, and Tunisian sector indicators."
            )}
          </p>
          <div className="hv2-cta">
            <button className="btn-pour" onClick={() => onNav("scoring")}>
              {t("Lancer un scoring","Start scoring")}
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8H13M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button className="btn-outline" onClick={() => onNav("login")}>{t("Connexion","Sign in")}</button>
          </div>
          <div className="hv2-meta">
            <span>XGBOOST · 60%</span><span className="sep">·</span>
            <span>RULES · 40%</span><span className="sep">·</span>
            <span>BCT COMPLIANT</span>
          </div>
        </div>
      </div>
      <div className="hv2-scrollhint">{t("Faites défiler","Scroll")}</div>
    </section>
  )
}

// ── 02 HERITAGE ───────────────────────────────────────────────────
function HeritageSection({ lang }) {
  const t = T(lang)
  return (
    <section id="sec-heritage" className="home-section-v2">
      <div className="home-section-wrap">
        <div className="home-content-half right">
          <div className="hv2-reveal">
            <Eyebrow num="01" label={t("Héritage","Heritage")}/>
            <h2 className="hv2-title">{t("Depuis ","Since ")}<em>1957,</em>{t(" le goût de la Tunisie."," the taste of Tunisia.")}</h2>
            <div className="hv2-body">
              <p>{t(
                "Implantée à Mégrine, la Société Tunisienne des Boissons Gazeuses produit, embouteille et distribue boissons gazeuses et eaux minérales à travers les 24 gouvernorats du pays.",
                "Headquartered in Mégrine, the Tunisian Beverage Company has produced, bottled, and distributed soft drinks and mineral waters across all 24 Tunisian governorates."
              )}</p>
              <p>{t(
                "Chaque jour, des milliers de bouteilles partent de nos lignes vers détaillants, grossistes, et grandes surfaces. ",
                "Each day, thousands of bottles leave our lines for retailers, wholesalers, and supermarkets. "
              )}<strong>{t("Cette plateforme protège ce flux.","This platform protects that flow.")}</strong></p>
            </div>
          </div>
          <div className="hv2-heritage-card hv2-reveal d2" style={{ marginTop:32 }}>
            <Eyebrow label={t("Fondée en","Founded in")}/>
            <div className="hv2-heritage-year">1957</div>
            <div className="hv2-body" style={{ maxWidth:460 }}>
              <p>{t(
                "68 ans d'expertise industrielle, 4 sites de production, réseau de plus de 12 000 clients actifs sur tout le territoire.",
                "68 years of industrial expertise, 4 production sites, 12,000+ active clients nationwide."
              )}</p>
            </div>
            <div className="hv2-heritage-list">
              {[
                { lbl:t("Sites","Sites"),           val:"4",     sub:"Mégrine · Sfax · Sousse · Gabès" },
                { lbl:t("Couverture","Coverage"),   val:"24/24", sub:t("Gouvernorats","Governorates") },
                { lbl:t("Clients actifs","Clients"),val:"12k+",  sub:t("Détail · gros · GMS","Retail · wholesale") },
                { lbl:t("Encours géré","Exposure"), val:"142M",  sub:"TND" },
              ].map((x,i) => (
                <div key={i} className="hv2-heritage-item">
                  <div className="lbl">{x.lbl}</div>
                  <div className="val">{x.val}</div>
                  <div className="sub">{x.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── 03 PLATFORM ───────────────────────────────────────────────────
function PlatformSection({ lang }) {
  const t = T(lang)
  const pillars = [
    { i:"01", t:t("Saisie intuitive","Intuitive input"),    s:t("Champs segmentés, sliders haptiques, chips de suggestion, validation temps réel.","Segmented fields, haptic sliders, suggestion chips, real-time validation.") },
    { i:"02", t:t("Score en direct","Live score"),          s:t("Une bouteille se remplit à mesure que l'analyste saisit. Couleur = risque.","A bottle fills as the analyst types. Liquid color = risk level.") },
    { i:"03", t:t("Verdict explicable","Explainable verdict"),s:t("Décomposition SHAP par facteur. Audit trail complet, exportable BCT.","SHAP factor breakdown. Full audit trail, BCT-exportable.") },
  ]
  return (
    <section id="sec-platform" className="home-section-v2">
      <div className="home-section-wrap">
        <div className="home-content-half left">
          <div className="hv2-reveal">
            <Eyebrow num="02" label={t("La plateforme","The platform")}/>
            <h2 className="hv2-title">{t("Lire le risque comme un ","Reading risk like a ")}<em>{t("analyste expérimenté.","seasoned analyst.")}</em></h2>
            <p className="hv2-lead-sm">{t(
              "Chaque client, du détaillant de quartier à la grande surface, est évalué sur 8 indicateurs. Score 0-100, décomposition par facteur, recommandation comité — en moins de 1,5 seconde.",
              "Every client, from the corner retailer to the supermarket, scored on 8 indicators. 0-100 score, factor breakdown, committee recommendation — in under 1.5 seconds."
            )}</p>
          </div>
          <div className="hv2-heritage-card hv2-tilt d2" style={{ marginTop:32 }}>
            <Eyebrow label={t("Trois piliers","Three pillars")}/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:14, marginTop:16 }}>
              {pillars.map((b,i) => (
                <div key={i} style={{ display:"flex", gap:16, padding:"14px 16px", background:"rgba(10,6,18,0.4)", border:"1px solid var(--line)", borderRadius:12 }}>
                  <div style={{ fontFamily:"var(--serif)", fontStyle:"italic", color:"var(--gold)", fontSize:24, lineHeight:1, flexShrink:0, width:32 }}>{b.i}</div>
                  <div>
                    <div style={{ fontFamily:"var(--serif)", fontSize:17, color:"var(--ink)", marginBottom:4 }}>{b.t}</div>
                    <div style={{ fontSize:12, color:"var(--ink-dim)", lineHeight:1.55 }}>{b.s}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── 04 MODEL ──────────────────────────────────────────────────────
function ModelSection({ lang }) {
  const t = T(lang)
  const [step, setStep] = useState(0)
  useEffect(() => { const iv = setInterval(() => setStep(s=>(s+1)%5), 2000); return () => clearInterval(iv) }, [])
  const pipeline = [
    { i:"1", t:t("Collecte profil","Profile collection"),  s:t("4 champs catégoriels","4 categorical fields"), v:"120ms" },
    { i:"2", t:t("Ratios financiers","Financial ratios"),  s:t("6 ratios calculés","6 ratios computed"),      v:"210ms" },
    { i:"3", t:t("Modèle XGBoost","XGBoost model"),        s:t("800 arbres · 60%","800 trees · 60%"),         v:"480ms" },
    { i:"4", t:t("Règles métier","Business rules"),        s:t("27 règles · 40%","27 rules · 40%"),           v:"180ms" },
    { i:"5", t:t("Score final","Final score"),             s:t("Calibré 0-100","Calibrated 0-100"),            v:"60ms"  },
  ]
  return (
    <section id="sec-model" className="home-section-v2">
      <div className="home-section-wrap">
        <div className="home-content-half right">
          <div className="hv2-reveal">
            <Eyebrow num="03" label={t("Le modèle","The model")}/>
            <h2 className="hv2-title">{t("Hybride. ","Hybrid. ")}<em>{t("Explicable.","Explainable.")}</em>{t(" Auditable."," Auditable.")}</h2>
            <p className="hv2-lead-sm">{t(
              "XGBoost calibré sur 50 000 profils synthétiques STBG, pondéré par 27 règles métier définies avec le département risque.",
              "XGBoost calibrated on 50,000 synthetic STBG profiles, weighted by 27 expert business rules built with the risk team."
            )}</p>
          </div>
          <div className="hv2-pipeline-card hv2-reveal d2" style={{ marginTop:28 }}>
            <Eyebrow label={t("Pipeline de scoring","Scoring pipeline")}/>
            <div style={{ marginTop:16 }}>
              {pipeline.map((n,i) => (
                <div key={i} className={`hv2-pipe-row ${i===step?"on":""}`}>
                  <div className="hv2-pipe-num">{n.i}</div>
                  <div className="hv2-pipe-txt">
                    <div className="hv2-pipe-title">{n.t}</div>
                    <div className="hv2-pipe-sub">{n.s}</div>
                  </div>
                  <div className="hv2-pipe-val">{n.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── 05 IMPACT ─────────────────────────────────────────────────────
function ImpactSection({ lang }) {
  const t = T(lang)
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    const io = new IntersectionObserver(es => es.forEach(e => { if(e.isIntersecting){setInView(true);io.disconnect()} }), {threshold:0.3})
    io.observe(ref.current)
    return () => io.disconnect()
  }, [])
  const v1 = useCountUp(12482, inView)
  const v2 = useCountUp(97,    inView)
  const v3 = useCountUp(1.2,   inView)
  const v4 = useCountUp(142,   inView)

  return (
    <section id="sec-impact" className="home-section-v2" ref={ref}>
      <div className="home-section-wrap">
        <div className="home-content-center hv2-reveal" style={{ textAlign:"center", marginBottom:48 }}>
          <Eyebrow num="04" label={t("Impact","Impact")} center/>
          <h2 className="hv2-title">{t("Des chiffres qui ","Numbers that ")}<em>{t("parlent.","speak.")}</em></h2>
        </div>
        <div className="hv2-metrics-strip hv2-reveal d2">
          {[
            { val:Math.round(v1).toLocaleString("fr-FR"), label:t("Clients scorés","Clients scored"),       sub:t("Avril 2026","April 2026") },
            { val:`${v2.toFixed(0)}%`,                    label:t("Précision modèle","Model accuracy"),     sub:"AUC 0.97 · F1 0.94" },
            { val:`${v3.toFixed(1)}s`,                    label:t("Temps moyen","Average time"),            sub:t("Saisie → verdict","Input → verdict") },
            { val:`${Math.round(v4)}M`,                   label:t("Encours protégé","Exposure protected"),  sub:"TND" },
          ].map((m,i) => (
            <div key={i} className="hv2-metric">
              <div className="hv2-metric-val">{m.val}</div>
              <div className="hv2-metric-label">{m.label}</div>
              <div className="hv2-metric-sub">{m.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── 06 TESTIMONIALS ───────────────────────────────────────────────
function TestimonialsSection({ lang }) {
  const t = T(lang)
  const items = [
    { q:t("« Le passage d'un dossier au comité prend désormais 3 minutes au lieu de 30. La décomposition SHAP nous donne un argumentaire prêt à l'emploi. »","\"What used to take 30 minutes in committee is now 3. The SHAP breakdown gives us a ready-to-use rationale.\""), n:"Hichem Trabelsi", r:t("Directeur des risques, STBG","Risk Director, STBG"), i:"HT" },
    { q:t("« On a divisé par deux les impayés sur la cohorte grossistes en six mois. Le score nous signale les dérapages avant qu'ils ne deviennent un dossier. »","\"We halved defaults in the wholesaler cohort in six months. The score flags drifts before they become a case.\""), n:"Sarra Mahjoub", r:t("Recouvrement, STBG","Collections, STBG"), i:"SM" },
    { q:t("« Le verdict est explicable, exportable, et compatible BCT. Le contrôle interne valide en un coup d'œil. »","\"The verdict is explainable, exportable, and BCT-compliant. Internal audit signs off at a glance.\""), n:"Karim Belkadi", r:t("Audit interne, STBG","Internal audit, STBG"), i:"KB" },
    { q:t("« Je formate un dossier client en deux minutes là où je passais une demi-journée à compiler les ratios manuellement. »","\"I file a client case in two minutes instead of half a day compiling ratios by hand.\""), n:"Nadia Bouzid", r:t("Analyste crédit","Credit analyst"), i:"NB" },
  ]
  return (
    <section id="sec-testimonials" className="home-section-v2">
      <div className="home-section-wrap">
        <div className="home-content-center hv2-reveal" style={{ textAlign:"center", marginBottom:16 }}>
          <Eyebrow num="05" label={t("Voix de l'équipe","Voices")} center/>
          <h2 className="hv2-title">{t("Ce que la STBG ","What STBG ")}<em>{t("dit du moteur.","says about the engine.")}</em></h2>
        </div>
        <div className="hv2-testi-grid">
          {items.map((it,i) => (
            <div key={i} className={`hv2-testi-card hv2-tilt d${(i%2)+1}`}>
              <div className="hv2-testi-quote-mark">"</div>
              <div className="hv2-testi-quote">{it.q}</div>
              <div className="hv2-testi-author">
                <div className="hv2-testi-avatar">{it.i}</div>
                <div>
                  <div className="hv2-testi-name">{it.n}</div>
                  <div className="hv2-testi-role">{it.r}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── 06 CREATOR ────────────────────────────────────────────────────
function CreatorSection({ lang }) {
  const t = T(lang)
  const [imgOk, setImgOk] = useState(true)
  return (
    <section id="sec-team" className="home-section-v2">
      <div className="home-section-wrap">
        <div className="home-content-center hv2-reveal" style={{ textAlign:"center", marginBottom:40 }}>
          <Eyebrow num="06" label={t("À l'origine du projet","Behind the project")} center/>
          <h2 className="hv2-title">{t("Une initiative pilotée par ","An initiative led by ")}<em>Khlifi Ayoub.</em></h2>
          <p className="hv2-lead-sm" style={{ margin:"0 auto" }}>
            {t("Finance digitale, spécialisation Data & IA appliquées au risque de crédit.","Digital finance, specialization in Data & AI applied to credit risk.")}
          </p>
        </div>
        <div className="hv2-reveal d2" style={{ maxWidth:520, margin:"0 auto" }}>
          <div style={{
            background:"linear-gradient(160deg,rgba(38,24,58,0.85),rgba(22,12,38,0.92))",
            border:"1px solid rgba(244,197,66,0.2)", borderRadius:24,
            padding:"44px 48px", textAlign:"center", position:"relative", overflow:"hidden",
            boxShadow:"0 24px 80px rgba(0,0,0,0.4)"
          }}>
            <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 500px 300px at 50% 0%,rgba(244,197,66,0.08),transparent 60%)", pointerEvents:"none" }}/>
            {/* Photo */}
            <div style={{ width:120, height:120, borderRadius:"50%", margin:"0 auto 24px", border:"2px solid rgba(244,197,66,0.4)", overflow:"hidden", boxShadow:"0 0 40px rgba(244,197,66,0.25)", position:"relative" }}>
              {imgOk
                ? <img src="/ayoub.jpg" alt="Khlifi Ayoub"
                    onError={() => setImgOk(false)}
                    style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
                : <div style={{ width:"100%", height:"100%", background:"linear-gradient(135deg,#2d1f4a,#7a2d3a)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--serif)", fontSize:36, color:"var(--gold)" }}>K</div>
              }
            </div>
            {/* Name & role */}
            <div style={{ fontFamily:"var(--serif)", fontSize:28, color:"var(--ink)", marginBottom:8, position:"relative" }}>Khlifi Ayoub</div>
            <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--gold)", letterSpacing:"3px", textTransform:"uppercase", marginBottom:24, position:"relative" }}>
              {t("Finance Digitale · Data & IA","Digital Finance · Data & AI")}
            </div>
            <div style={{ height:1, background:"rgba(244,197,66,0.1)", margin:"0 0 24px", position:"relative" }}/>
            <p style={{ fontSize:14, color:"var(--ink-dim)", lineHeight:1.7, margin:"0 0 24px", position:"relative" }}>
              {t(
                "Modèle XGBoost hybride entraîné sur 50 000 profils, pipeline FastAPI, interface React avec scoring en temps réel — conçu de A à Z pour le département risque STBG.",
                "Hybrid XGBoost model trained on 50,000 profiles, FastAPI pipeline, React interface with real-time scoring — built end-to-end for STBG's risk department."
              )}
            </p>
            <div style={{ display:"flex", justifyContent:"center", gap:10, flexWrap:"wrap", position:"relative" }}>
              {["XGBoost","FastAPI","React","Python","scikit-learn"].map(tag => (
                <span key={tag} style={{ padding:"4px 14px", borderRadius:99, background:"rgba(244,197,66,0.07)", border:"1px solid rgba(244,197,66,0.18)", fontFamily:"var(--mono)", fontSize:10, color:"rgba(244,197,66,0.55)", letterSpacing:"1px" }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── 07 ROADMAP ────────────────────────────────────────────────────
function RoadmapSection({ lang }) {
  const t = T(lang)
  const items = [
    { q:"Q4 2025", t:t("v1 – Scoring manuel","v1 – Manual scoring"),     b:t("Saisie individuelle, modèle XGBoost calibré, score 0-100 + décomposition.","Single-entry input, calibrated XGBoost, 0-100 score + breakdown."), tag:t("Livré","Shipped"), done:true },
    { q:"Q1 2026", t:t("v2 – Import CSV de masse","v2 – CSV batch import"), b:t("Scoring de portefeuille entier. Export CSV enrichi. Audit trail BCT.","Full-portfolio batch scoring. Enriched CSV export. BCT audit trail."), tag:t("Livré","Shipped"), done:true },
    { q:"Q2 2026", t:t("v3 – Dashboard analytique","v3 – Analytics dashboard"), b:t("Dashboard BI complet. Analyse par secteur, région, banque. Visualisations animées.","Full BI dashboard. Analysis by sector, region, bank. Animated charts."), tag:t("En cours","In progress"), done:false },
    { q:"Q3 2026", t:t("v4 – Alertes temps réel","v4 – Real-time alerts"),  b:t("Détection automatique de dégradation. Notifications email et SMS.","Automatic drift detection. Email and SMS notifications."), tag:t("Prévu","Planned"), done:false },
    { q:"Q4 2026", t:t("v5 – Connecteur ERP","v5 – ERP connector"),         b:t("Pull automatique depuis l'ERP STBG. Scoring en continu.","Automatic pull from STBG ERP. Continuous scoring."), tag:t("Prévu","Planned"), done:false },
  ]
  return (
    <section id="sec-roadmap" className="home-section-v2">
      <div className="home-section-wrap">
        <div className="home-content-half right">
          <div className="hv2-reveal">
            <Eyebrow num="06" label="Roadmap"/>
            <h2 className="hv2-title">{t("Ce qui ","What ")}<em>{t("arrive ensuite.","comes next.")}</em></h2>
            <p className="hv2-lead-sm">{t("La plateforme évolue tous les trimestres. Voici 2025-2026.","The platform ships every quarter. Here is 2025–2026.")}</p>
          </div>
          <div className="hv2-road hv2-reveal d2">
            {items.map((it,i) => (
              <div key={i} className={`hv2-road-row ${it.done?"done":""}`}>
                <div className="hv2-road-quarter">{it.q}</div>
                <div className="hv2-road-title">{it.t}</div>
                <div className="hv2-road-body">{it.b}</div>
                <span className={`hv2-road-tag ${it.done?"shipped":""}`}>{it.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── 08 FAQ ────────────────────────────────────────────────────────
function FaqSection({ lang }) {
  const t = T(lang)
  const [open, setOpen] = useState(0)
  const items = [
    { q:t("Sur quelles données le modèle a-t-il été entraîné ?","What data was the model trained on?"),
      a:t("50 000 profils clients synthétiques STBG générés à partir de 12 ans d'historique. Validation croisée par cohortes sectorielles pour éviter les biais.","50,000 synthetic STBG client profiles generated from 12 years of history. Cross-validation by sector cohorts to avoid bias.") },
    { q:t("Le score est-il interprétable ?","Is the score interpretable?"),
      a:t("Oui. Chaque score est accompagné de sa décomposition SHAP par facteur : retards, impayés, concentration, ancienneté, secteur, litiges. L'analyste voit exactement pourquoi.","Yes. Every score comes with a SHAP breakdown: delays, defaults, concentration, tenure, sector, disputes. The analyst sees exactly why.") },
    { q:t("Comment la conformité BCT est-elle assurée ?","How is BCT compliance ensured?"),
      a:t("Audit trail complet (qui, quand, quelles données), explicabilité par facteur, et passage obligatoire en comité pour tout score critique.","Full audit trail (who, when, which data), factor-level explainability, and mandatory committee validation for any critical score.") },
    { q:t("Quelle est la précision du modèle ?","What is the model accuracy?"),
      a:t("AUC 0.97, F1-score 0.94 sur les données de test. Le modèle hybride (60% ML + 40% règles métier) surpasse chaque composante prise isolément.","AUC 0.97, F1-score 0.94 on test data. The hybrid model (60% ML + 40% business rules) outperforms each component in isolation.") },
    { q:t("Peut-on scorer en masse ?","Can we score in batch?"),
      a:t("Oui. La page Scoring Masse permet d'uploader un CSV de n'importe quelle taille, de scorer tous les clients d'un coup, et d'exporter les résultats enrichis.","Yes. The Batch Scoring page lets you upload a CSV of any size, score all clients at once, and export the enriched results.") },
  ]
  return (
    <section id="sec-faq" className="home-section-v2">
      <div className="home-section-wrap">
        <div className="home-content-center hv2-reveal" style={{ textAlign:"center", marginBottom:16 }}>
          <Eyebrow num="07" label="FAQ" center/>
          <h2 className="hv2-title">{t("Questions ","Frequent ")}<em>{t("fréquentes.","questions.")}</em></h2>
        </div>
        <div className="hv2-faq hv2-reveal d2">
          {items.map((it,i) => (
            <div key={i} className={`hv2-faq-row ${open===i?"open":""}`} onClick={() => setOpen(open===i?-1:i)}>
              <div className="hv2-faq-q">
                <span>{it.q}</span>
                <span className="hv2-faq-icon">
                  <svg width="12" height="12" viewBox="0 0 12 12"><path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                </span>
              </div>
              <div className="hv2-faq-a">{it.a}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── 09 CTA FINAL ──────────────────────────────────────────────────
function CtaSection({ lang, onNav }) {
  const t = T(lang)
  return (
    <section id="sec-cta" className="home-section-v2 tight">
      <div className="home-section-wrap">
        <div className="hv2-cta-final hv2-reveal">
          <div className="hv2-eyebrow">
            <span className="dot"/>
            {t("Prêt à commencer ?","Ready to begin?")}
          </div>
          <h2>
            {t("Évaluez votre prochain","Score your next")}<br/>
            <em>{t("client en 90 secondes.","client in 90 seconds.")}</em>
          </h2>
          <p>{t(
            "Connectez-vous, renseignez 8 indicateurs, recevez un score interprétable avec sa décomposition. Aucune installation.",
            "Sign in, enter 8 indicators, receive an interpretable score with its breakdown. No installation."
          )}</p>
          <div className="hv2-cta-final-buttons">
            <button className="btn-pour" onClick={() => onNav("scoring")}>
              {t("Commencer maintenant","Get started")}
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8H13M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button className="btn-outline" onClick={() => onNav("login")}>{t("Se connecter","Sign in")}</button>
          </div>
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN HOME PAGE
// ═══════════════════════════════════════════════════════════════════
const SECTIONS = [
  { id:"sec-hero",         label:"Accueil",    labelEn:"Home" },
  { id:"sec-heritage",     label:"Héritage",   labelEn:"Heritage" },
  { id:"sec-platform",     label:"Plateforme", labelEn:"Platform" },
  { id:"sec-model",        label:"Modèle",     labelEn:"Model" },
  { id:"sec-impact",       label:"Impact",     labelEn:"Impact" },
  { id:"sec-testimonials", label:"Voix",       labelEn:"Voices" },
  { id:"sec-roadmap",      label:"Roadmap",    labelEn:"Roadmap" },
  { id:"sec-faq",          label:"FAQ",        labelEn:"FAQ" },
  { id:"sec-cta",          label:"Commencer",  labelEn:"Get started" },
]

export default function HomePage({ setPage, lang = "fr" }) {
  useReveal()

  const bubbles = useMemo(() => Array.from({ length: 14 }, () => ({
    left: Math.random()*100, size: 4+Math.random()*11,
    dur: 9+Math.random()*10, delay: -Math.random()*12,
  })), [])

  const [active, setActive] = useState("sec-hero")
  const spotRef    = useRef(null)
  const hueRef     = useRef(null)
  const bottleRef  = useRef(null)
  const raysRef    = useRef(null)
  const loopRef    = useRef(null)

  // Smooth bottle state — all in refs, no setState → zero lag
  const target = useRef({ bx:75, by:30, rot:-8, scale:0.95, fill:70, color:"#f4c542" })
  const current = useRef({ bx:75, by:30, rot:-8, scale:0.95 })
  const rawScroll = useRef(0)
  const rawMx = useRef(0.5)
  const rawMy = useRef(0.5)

  useEffect(() => {
    // Scroll → raw target (no setState)
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight
      rawScroll.current = total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0
      if (hueRef.current) hueRef.current.style.setProperty("--p", rawScroll.current)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive:true })

    // Mouse → raw (no setState)
    const onMove = e => {
      rawMx.current = e.clientX / window.innerWidth
      rawMy.current = e.clientY / window.innerHeight
      if (spotRef.current) {
        spotRef.current.style.setProperty("--mx", `${e.clientX}px`)
        spotRef.current.style.setProperty("--my", `${e.clientY}px`)
      }
    }
    window.addEventListener("mousemove", onMove, { passive:true })

    // rAF loop — lerp current → target, write directly to DOM
    const LERP_SPEED = 0.09
    const loop = () => {
      const p = rawScroll.current
      const mx = rawMx.current
      const my = rawMy.current

      // Compute raw target from scroll
      let tbx, tby, trot, tscale
      if (p < 0.5) {
        const e = easeIO(p / 0.5)
        tbx=lerp(72,50,e); tby=lerp(40,55,e); trot=lerp(-8,0,e); tscale=lerp(0.95,1.05,e)
      } else {
        const e = easeIO((p-0.5)/0.5)
        tbx=lerp(50,20,e); tby=lerp(55,60,e); trot=lerp(0,12,e); tscale=lerp(1.05,0.90,e)
      }
      // Clamp precisely: bottle height is 65vh, header=80px≈10vh, footer=80px≈10vh
      // center must be between (10 + 32.5)=42.5vh and (100-10-32.5)=57.5vh
      // But we want bottle to travel more — use px-based clamp
      const vh100 = window.innerHeight
      const bottleHalfPx = (vh100 * 0.65 * tscale) / 2
      const minByPx = 85 + bottleHalfPx          // 85px = header height
      const maxByPx = vh100 - 85 - bottleHalfPx  // 85px = footer approx
      const tbyPx = (tby / 100) * vh100
      const clampedByPx = Math.max(minByPx, Math.min(maxByPx, tbyPx))
      tby = (clampedByPx / vh100) * 100
      trot += (mx-0.5)*5

      // Lerp current toward target
      const c = current.current
      c.bx    += (tbx    - c.bx)    * LERP_SPEED
      c.by    += (tby    - c.by)    * LERP_SPEED
      c.rot   += (trot   - c.rot)   * LERP_SPEED
      c.scale += (tscale - c.scale) * LERP_SPEED

      // Write directly to DOM — zero React re-render.
      // Use a single translate3d instead of left/top so the browser can
      // composite this on the GPU without recalculating layout every frame —
      // this is what actually made the travel feel smoother, not just the lerp.
      if (bottleRef.current) {
        const px = (c.bx / 100) * window.innerWidth
        const py = (c.by / 100) * window.innerHeight
        bottleRef.current.style.transform =
          `translate3d(${px}px,${py}px,0) translate(-50%,-50%) rotate(${c.rot}deg) scale(${c.scale})`
      }
      if (raysRef.current) {
        raysRef.current.style.left = `${c.bx}%`
        raysRef.current.style.top  = `${c.by}vh`
      }

      loopRef.current = requestAnimationFrame(loop)
    }
    loopRef.current = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("mousemove", onMove)
      cancelAnimationFrame(loopRef.current)
    }
  }, [])

  // Active section dot nav (separate, only updates active state)
  useEffect(() => {
    const obs = SECTIONS.map(({ id }) => {
      const el = document.getElementById(id)
      if (!el) return null
      const io = new IntersectionObserver(es => es.forEach(e => { if(e.isIntersecting) setActive(id) }), { threshold:0.4 })
      io.observe(el)
      return io
    }).filter(Boolean)
    return () => obs.forEach(o => o.disconnect())
  }, [])

  // These are now static for render — bottle position is DOM-driven
  const scrollP   = 0
  const liquidColor = "#f4c542"
  const fillPct   = 82

  return (
    <div className="home-page-v2">
      {/* CSS for this page */}
      <style>{`
        .home-page-v2{position:relative}
        .home-hue{position:fixed;inset:0;z-index:0;pointer-events:none;--p:0;background:
          radial-gradient(ellipse 1200px 800px at calc(20% + var(--p)*60%) calc(20% + var(--p)*60%),hsla(calc(40 - var(--p)*280),70%,35%,0.32),transparent 60%),
          radial-gradient(ellipse 900px 700px at calc(80% - var(--p)*60%) calc(70% + var(--p)*20% - 40%),hsla(calc(280 + var(--p)*80),60%,25%,0.4),transparent 60%);}
        .home-spotlight{position:fixed;inset:0;z-index:1;pointer-events:none;background:radial-gradient(circle 400px at var(--mx,50%) var(--my,50%),rgba(244,197,66,0.04),transparent 70%);mix-blend-mode:screen}
        .home-bottle-traveler{position:fixed;left:var(--bx,75%);top:var(--by,30%);width:32vh;height:65vh;transform:translate(-50%,-50%) rotate(var(--brot,0deg)) rotateZ(var(--btilt,0deg)) scale(var(--bs,1));pointer-events:none;z-index:3;filter:drop-shadow(0 30px 60px rgba(0,0,0,0.55));will-change:transform,left,top;transition:filter .6s ease}
        .home-dotnav{position:fixed;right:24px;top:50%;transform:translateY(-50%);z-index:20;display:flex;flex-direction:column;gap:10px}
        .home-dotnav-btn{width:8px;height:8px;border-radius:50%;background:rgba(244,197,66,0.25);border:none;cursor:pointer;transition:all .3s ease;position:relative;padding:0}
        .home-dotnav-btn:hover,.home-dotnav-btn.active{background:var(--gold);box-shadow:0 0 8px rgba(244,197,66,0.6);width:10px;height:10px}
        .home-dotnav-btn .dotnav-label{position:absolute;right:18px;top:50%;transform:translateY(-50%);white-space:nowrap;font-family:var(--mono);font-size:9px;color:rgba(244,197,66,0.5);letter-spacing:1.5px;opacity:0;transition:opacity .2s ease;text-transform:uppercase;pointer-events:none}
        .home-dotnav-btn:hover .dotnav-label{opacity:1}

        .home-section-v2{position:relative;z-index:5;min-height:100vh;display:flex;align-items:center;padding:120px 0}
        .home-section-v2.tight{min-height:60vh}
        .home-section-wrap{max-width:1280px;margin:0 auto;padding:0 40px;width:100%}
        .home-content-half{max-width:600px}
        .home-content-half.right{margin-left:auto}
        .home-content-center{max-width:720px;margin:0 auto}

        .hv2-hero{min-height:100vh;display:flex;align-items:center}
        .hv2-eyebrow{display:flex;align-items:center;gap:10px;font-family:var(--mono);font-size:10px;color:rgba(244,197,66,0.5);letter-spacing:3px;text-transform:uppercase;margin-bottom:28px}
        .hv2-eyebrow .dot{width:6px;height:6px;border-radius:50%;background:var(--gold);box-shadow:0 0 8px var(--gold)}
        .hv2-eyebrow-sm{display:flex;align-items:center;gap:10px;font-family:var(--mono);font-size:9px;color:rgba(244,197,66,0.4);letter-spacing:2px;text-transform:uppercase;margin-bottom:16px}
        .hv2-eyebrow-sm .num{color:rgba(244,197,66,0.3);font-size:9px}
        .hv2-eyebrow-sm .line{display:block;width:20px;height:1px;background:rgba(244,197,66,0.25)}

        .hv2-h1{font-family:var(--serif);font-size:clamp(48px,6vw,84px);font-weight:400;line-height:1.02;letter-spacing:-.03em;color:var(--ink);margin:0 0 24px}
        .hv2-h1 em{color:var(--gold);font-style:italic;display:block}
        .hv2-rotating{transition:opacity .38s ease, transform .38s ease; min-height:1em}
        .hv2-h1 .word{display:inline-block;overflow:hidden}
        .hv2-h1 .word span{display:inline-block;transform:translateY(100%);transition:transform .7s cubic-bezier(0.16,1,0.3,1)}
        .hv2-h1.entered .word span{transform:translateY(0)}
        .hv2-h1 .word:nth-child(1) span{transition-delay:.05s}
        .hv2-h1 .word:nth-child(2) span{transition-delay:.1s}
        .hv2-h1 .word:nth-child(3) span{transition-delay:.15s}
        .hv2-h1 em .word:nth-child(1) span{transition-delay:.2s}
        .hv2-h1 em .word:nth-child(2) span{transition-delay:.25s}
        .hv2-h1 em .word:nth-child(3) span{transition-delay:.3s}

        .hv2-title{font-family:var(--serif);font-size:clamp(38px,4.5vw,62px);font-weight:400;line-height:1.08;letter-spacing:-.02em;color:var(--ink);margin:0 0 20px}
        .hv2-title em{color:var(--gold);font-style:italic}
        .hv2-lead{font-size:17px;color:var(--ink-dim);line-height:1.7;max-width:480px;margin:0 0 32px}
        .hv2-lead-sm{font-size:15px;color:var(--ink-dim);line-height:1.65;max-width:480px;margin:0 0 8px}
        .hv2-body p{font-size:15px;color:var(--ink-dim);line-height:1.65;margin-bottom:12px}
        .hv2-body strong{color:var(--ink)}

        .hv2-cta{display:flex;gap:14px;margin-bottom:24px;flex-wrap:wrap}
        .hv2-meta{display:flex;align-items:center;gap:10px;font-family:var(--mono);font-size:9px;color:rgba(244,197,66,0.35);letter-spacing:2px}
        .hv2-meta .sep{color:rgba(244,197,66,0.2)}
        .hv2-scrollhint{position:absolute;bottom:32px;left:50%;transform:translateX(-50%);font-family:var(--mono);font-size:9px;color:rgba(244,197,66,0.3);letter-spacing:3px;text-transform:uppercase;display:flex;align-items:center;gap:8px}
        .hv2-scrollhint::before{content:'';display:block;width:1px;height:20px;background:rgba(244,197,66,0.25);animation:scrollHint 2s ease-in-out infinite}
        @keyframes scrollHint{0%,100%{height:20px;opacity:.5}50%{height:30px;opacity:1}}

        .btn-pour{display:inline-flex;align-items:center;gap:8px;padding:13px 24px;background:var(--gold);color:var(--bg);border-radius:10px;border:none;font-family:var(--mono);font-size:11px;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;transition:all .2s ease;font-weight:600}
        .btn-pour:hover{background:var(--gold-soft);transform:translateY(-1px);box-shadow:0 8px 24px rgba(244,197,66,0.3)}
        .btn-outline{display:inline-flex;align-items:center;gap:8px;padding:13px 24px;background:transparent;color:var(--ink-dim);border-radius:10px;border:1px solid var(--line-strong);font-family:var(--mono);font-size:11px;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;transition:all .2s ease}
        .btn-outline:hover{border-color:var(--gold);color:var(--gold)}

        .hv2-reveal{opacity:0;transform:translateY(24px);transition:opacity .7s cubic-bezier(0.16,1,0.3,1),transform .7s cubic-bezier(0.16,1,0.3,1)}
        .hv2-reveal.in{opacity:1;transform:translateY(0)}
        .hv2-reveal.d2{transition-delay:.1s}
        .hv2-tilt{opacity:0;transform:translateY(20px);transition:opacity .6s cubic-bezier(0.16,1,0.3,1),transform .6s cubic-bezier(0.16,1,0.3,1)}
        .hv2-tilt.in{opacity:1;transform:translateY(0)}
        .hv2-tilt.d2{transition-delay:.12s}
        .hv2-tilt.d1{transition-delay:.06s}

        .hv2-heritage-card{background:linear-gradient(160deg,rgba(28,18,44,0.7),rgba(18,10,31,0.8));border:1px solid var(--line);border-radius:16px;padding:24px 28px}
        .hv2-heritage-year{font-family:var(--serif);font-size:88px;color:var(--gold);line-height:1;letter-spacing:-.03em;margin:8px 0 16px}
        .hv2-heritage-list{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:20px;padding-top:20px;border-top:1px solid var(--line)}
        .hv2-heritage-item .lbl{font-family:var(--mono);font-size:9px;color:var(--ink-mute);letter-spacing:2px;text-transform:uppercase;margin-bottom:6px}
        .hv2-heritage-item .val{font-family:var(--serif);font-size:28px;color:var(--gold);line-height:1;margin-bottom:4px}
        .hv2-heritage-item .sub{font-family:var(--mono);font-size:10px;color:var(--ink-mute)}

        .hv2-pipeline-card{background:linear-gradient(160deg,rgba(28,18,44,0.7),rgba(18,10,31,0.8));border:1px solid var(--line);border-radius:16px;padding:24px 28px}
        .hv2-pipe-row{display:grid;grid-template-columns:28px 1fr 60px;gap:14px;align-items:center;padding:12px 14px;border-radius:10px;margin-bottom:6px;transition:all .25s ease;opacity:.5}
        .hv2-pipe-row.on{background:rgba(244,197,66,0.06);border:1px solid rgba(244,197,66,0.15);opacity:1}
        .hv2-pipe-num{font-family:var(--serif);font-style:italic;color:var(--gold);font-size:18px;line-height:1}
        .hv2-pipe-title{font-size:13px;color:var(--ink);margin-bottom:2px}
        .hv2-pipe-sub{font-family:var(--mono);font-size:9px;color:var(--ink-mute);letter-spacing:1px}
        .hv2-pipe-val{font-family:var(--mono);font-size:11px;color:var(--gold);text-align:right}

        .hv2-metrics-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border:1px solid var(--line);border-radius:16px;overflow:hidden}
        .hv2-metric{padding:32px 28px;border-right:1px solid var(--line);text-align:center}
        .hv2-metric:last-child{border-right:none}
        .hv2-metric-val{font-family:var(--serif);font-size:64px;line-height:1;color:var(--gold);letter-spacing:-.02em;margin-bottom:10px}
        .hv2-metric-label{font-family:var(--mono);font-size:10px;color:var(--ink-mute);letter-spacing:2px;text-transform:uppercase;margin-bottom:6px}
        .hv2-metric-sub{font-size:12px;color:var(--ink-dim)}

        .hv2-testi-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:900px;margin:24px auto 0}
        .hv2-testi-card{background:linear-gradient(160deg,rgba(28,18,44,0.65),rgba(18,10,31,0.75));border:1px solid var(--line);border-radius:16px;padding:28px;position:relative;transition:border-color .25s ease}
        .hv2-testi-card:hover{border-color:var(--line-strong)}
        .hv2-testi-quote-mark{font-family:var(--serif);font-size:64px;color:rgba(244,197,66,0.2);line-height:1;margin-bottom:8px;height:40px;display:block}
        .hv2-testi-quote{font-size:13px;color:var(--ink-dim);line-height:1.65;margin-bottom:20px;font-style:italic}
        .hv2-testi-author{display:flex;align-items:center;gap:12px}
        .hv2-testi-avatar{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--royal),var(--burgundy));display:grid;place-items:center;font-family:var(--mono);font-size:11px;color:var(--ink);flex-shrink:0;font-weight:600}
        .hv2-testi-name{font-size:13px;color:var(--ink);font-weight:500;margin-bottom:2px}
        .hv2-testi-role{font-family:var(--mono);font-size:10px;color:var(--ink-mute);letter-spacing:1px}

        .hv2-road{display:flex;flex-direction:column;gap:0;margin-top:24px;border:1px solid var(--line);border-radius:14px;overflow:hidden}
        .hv2-road-row{padding:18px 22px;border-bottom:1px solid var(--line);transition:background .2s ease;position:relative;display:grid;grid-template-columns:80px 1fr auto;grid-template-rows:auto auto;gap:4px 16px;align-items:start}
        .hv2-road-row:last-child{border-bottom:none}
        .hv2-road-row.done{background:rgba(244,197,66,0.03)}
        .hv2-road-row:hover{background:rgba(244,197,66,0.04)}
        .hv2-road-quarter{font-family:var(--mono);font-size:9px;color:rgba(244,197,66,0.35);letter-spacing:2px;padding-top:2px}
        .hv2-road-title{font-size:13px;color:var(--ink);font-weight:500}
        .hv2-road-body{grid-column:2;font-size:12px;color:var(--ink-dim);line-height:1.5}
        .hv2-road-tag{grid-row:1;grid-column:3;font-family:var(--mono);font-size:9px;letter-spacing:1.5px;text-transform:uppercase;padding:3px 10px;border-radius:99px;background:rgba(244,197,66,0.06);color:rgba(244,197,66,0.4);border:1px solid var(--line);white-space:nowrap;align-self:start}
        .hv2-road-tag.shipped{background:rgba(92,184,116,0.1);color:#5cb874;border-color:rgba(92,184,116,0.25)}

        .hv2-faq{border:1px solid var(--line);border-radius:14px;overflow:hidden;max-width:760px;margin:24px auto 0}
        .hv2-faq-row{border-bottom:1px solid var(--line);cursor:pointer;transition:background .2s ease}
        .hv2-faq-row:last-child{border-bottom:none}
        .hv2-faq-row:hover{background:rgba(244,197,66,0.03)}
        .hv2-faq-q{display:flex;justify-content:space-between;align-items:center;padding:18px 22px;font-size:14px;color:var(--ink);gap:16px}
        .hv2-faq-icon{flex-shrink:0;color:rgba(244,197,66,0.4);transition:transform .25s ease}
        .hv2-faq-row.open .hv2-faq-icon{transform:rotate(45deg)}
        .hv2-faq-a{max-height:0;overflow:hidden;font-size:13px;color:var(--ink-dim);line-height:1.65;transition:max-height .35s ease,padding .35s ease;padding:0 22px}
        .hv2-faq-row.open .hv2-faq-a{max-height:200px;padding:0 22px 18px}

        .hv2-cta-final{text-align:center;padding:60px 40px;background:linear-gradient(160deg,rgba(28,18,44,0.5),rgba(18,10,31,0.6));border:1px solid var(--line);border-radius:24px;position:relative;overflow:hidden}
        .hv2-cta-final::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 600px 300px at 50% 50%,rgba(244,197,66,0.07),transparent 60%);pointer-events:none}
        .hv2-cta-final h2{font-family:var(--serif);font-size:clamp(32px,4vw,56px);font-weight:400;line-height:1.08;letter-spacing:-.02em;color:var(--ink);margin:20px 0 16px;position:relative}
        .hv2-cta-final h2 em{color:var(--gold);font-style:italic}
        .hv2-cta-final p{font-size:15px;color:var(--ink-dim);max-width:500px;margin:0 auto 32px;line-height:1.65;position:relative}
        .hv2-cta-final-buttons{display:flex;justify-content:center;gap:14px;position:relative;flex-wrap:wrap}

        .hv2-team-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:28px}
        .hv2-team-card{background:linear-gradient(160deg,rgba(28,18,44,0.65),rgba(18,10,31,0.75));border:1px solid var(--line);border-radius:16px;padding:28px;transition:border-color .25s}
        .hv2-team-card:hover{border-color:var(--line-strong)}
        .hv2-team-avatar{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,var(--royal),var(--burgundy));display:grid;place-items:center;font-family:var(--mono);font-size:13px;color:var(--ink);margin-bottom:14px;font-weight:600}
        .hv2-team-name{font-size:15px;color:var(--ink);font-weight:500;margin-bottom:4px}
        .hv2-team-role{font-family:var(--mono);font-size:9px;color:var(--gold);letter-spacing:2px;text-transform:uppercase;margin-bottom:12px}
        .hv2-team-bio{font-size:13px;color:var(--ink-dim);line-height:1.55}
        @keyframes rayPulse{0%,100%{opacity:.25;transform:rotate(0deg) scaleY(1)}50%{opacity:.55;transform:rotate(2deg) scaleY(1.05)}}
        @media(max-width:900px){
          .home-content-half.right{margin-left:0}
          .hv2-metrics-strip{grid-template-columns:1fr 1fr}
          .hv2-testi-grid{grid-template-columns:1fr}
          .hv2-heritage-list{grid-template-columns:1fr 1fr}
          .home-bottle-traveler{display:none}
          .home-dotnav{display:none}
        }
      `}</style>

      {/* Background layers */}
      <div className="home-hue" ref={hueRef}/>
      <div className="home-spotlight" ref={spotRef}/>

      {/* Bubbles — same as other pages */}
      <div className="bubble-field" style={{ position:"fixed", inset:0, zIndex:1, pointerEvents:"none", overflow:"hidden" }}>
        {bubbles.map((b,i) => (
          <div key={i} className="bubble" style={{ left:`${b.left}%`, width:b.size, height:b.size, animationDuration:`${b.dur}s`, animationDelay:`${b.delay}s` }}/>
        ))}
      </div>

      {/* Volumetric rays — DOM-driven via ref */}
      <div ref={raysRef} style={{ position:"fixed", left:"75%", top:"30vh", transform:"translate(-50%,-50%)", width:600, height:1000, pointerEvents:"none", zIndex:2, opacity:0.45 }}>
        <svg viewBox="-300 -500 600 1000" style={{ width:"100%", height:"100%" }} preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="rayGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={liquidColor} stopOpacity="0.45"/>
              <stop offset="100%" stopColor={liquidColor} stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d="M -8 -480 L 8 -480 L 80 480 L -80 480 Z" fill="url(#rayGrad)" style={{ animation:"rayPulse 6s ease-in-out infinite" }}/>
          <path d="M -4 -480 L 4 -480 L 160 480 L -160 480 Z" fill="url(#rayGrad)" opacity="0.4" style={{ animation:"rayPulse 6s ease-in-out infinite", animationDelay:"-2s" }}/>
          <path d="M -2 -480 L 2 -480 L 240 480 L -240 480 Z" fill="url(#rayGrad)" opacity="0.25" style={{ animation:"rayPulse 6s ease-in-out infinite", animationDelay:"-4s" }}/>
        </svg>
      </div>

      {/* Traveling bottle — DOM-driven via ref, zero React re-render */}
      <div ref={bottleRef} style={{
        position:"fixed", left:0, top:0,
        width:"28vh", height:"60vh",
        transform:"translate3d(75vw,30vh,0) translate(-50%,-50%) rotate(-8deg) scale(0.95)",
        pointerEvents:"none", zIndex:3,
        filter:"drop-shadow(0 24px 48px rgba(0,0,0,0.5))",
        willChange:"transform",
      }}>
        <Bottle fillPct={fillPct} color={liquidColor}/>
      </div>

      {/* Dot nav */}
      <div className="home-dotnav">
        {SECTIONS.map(s => (
          <button key={s.id}
            className={`home-dotnav-btn ${active===s.id?"active":""}`}
            onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior:"smooth" })}
            title={lang==="fr" ? s.label : s.labelEn}
          >
            <span className="dotnav-label">{lang==="fr" ? s.label : s.labelEn}</span>
          </button>
        ))}
      </div>

      {/* All sections */}
      <HeroSection          lang={lang} onNav={setPage}/>
      <HeritageSection      lang={lang}/>
      <PlatformSection      lang={lang}/>
      <ModelSection         lang={lang}/>
      <ImpactSection        lang={lang}/>
      <TestimonialsSection  lang={lang}/>
      <CreatorSection       lang={lang}/>
      <RoadmapSection       lang={lang}/>
      <FaqSection           lang={lang}/>
      <CtaSection           lang={lang} onNav={setPage}/>
    </div>
  )
}