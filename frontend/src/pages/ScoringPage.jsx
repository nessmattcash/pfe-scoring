import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { useApp } from "../AppContext"
import { REGIONS, SECTEURS, TYPES, BANQUES, INIT_FORM, FIELD_RULES } from "../constants/data"

// ─── useScrollReveal ──────────────────────────────────────────────────────────
function useReveal(threshold = 0.15) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible]
}

// ─── Loader ───────────────────────────────────────────────────────────────────
function Loader({ accent }) {
  return (
    <div style={{
      position:"fixed",inset:0,zIndex:2000,
      background:"rgba(4,4,12,0.9)",backdropFilter:"blur(16px)",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:28
    }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes dotpulse{0%,80%,100%{transform:scale(0.5);opacity:.2}40%{transform:scale(1);opacity:1}}
        @keyframes scanline{0%{transform:translateY(-100%)}100%{transform:translateY(100vh)}}
      `}</style>

      {/* Scanning line effect */}
      <div style={{
        position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"
      }}>
        <div style={{
          position:"absolute",left:0,right:0,height:2,
          background:`linear-gradient(90deg,transparent,${accent}60,transparent)`,
          animation:"scanline 2s linear infinite"
        }}/>
      </div>

      {/* Spinner */}
      <div style={{position:"relative",width:72,height:72}}>
        <div style={{position:"absolute",inset:0,borderRadius:"50%",border:"1px solid rgba(201,168,76,0.1)"}}/>
        <div style={{position:"absolute",inset:0,borderRadius:"50%",border:`3px solid transparent`,borderTopColor:accent,animation:"spin .8s linear infinite"}}/>
        <div style={{position:"absolute",inset:10,borderRadius:"50%",border:`2px solid transparent`,borderTopColor:`rgba(201,168,76,0.4)`,animation:"spin 1.4s linear infinite reverse"}}/>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{width:10,height:10,borderRadius:"50%",background:accent,boxShadow:`0 0 16px ${accent}`,animation:"dotpulse 1s ease infinite"}}/>
        </div>
      </div>

      <div style={{textAlign:"center"}}>
        <div style={{fontSize:17,fontWeight:700,color:"#f1f5f9",marginBottom:8,letterSpacing:"-.01em"}}>
          Analyse XGBoost en cours
        </div>
        <div style={{fontSize:13,color:"#475569",marginBottom:16}}>
          Le modèle évalue 8 indicateurs de fiabilité…
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"center"}}>
          {[0,1,2,3,4].map(i=>(
            <div key={i} style={{
              width:5,height:5,borderRadius:"50%",background:accent,
              animation:`dotpulse 1.2s ease-in-out ${i*.18}s infinite`
            }}/>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Score modal ──────────────────────────────────────────────────────────────
function ScoreModal({ result, accent, onClose, t }) {
  const [mounted, setMounted] = useState(false)
  const [score, setScore] = useState(0)
  const maxShap = Math.max(...result.shap.map(f => Math.abs(f.value)), 1)

  useEffect(() => {
    setMounted(true)
    let i = 0
    const id = setInterval(() => {
      i++
      setScore(Math.round(result.score * (i / 35)))
      if (i >= 35) clearInterval(id)
    }, 13)
    return () => clearInterval(id)
  }, [result.score])

  const [shapW, setShapW] = useState([])
  useEffect(() => {
    const timers = result.shap.map((_, i) =>
      setTimeout(() => {
        setShapW(prev => {
          const next = [...prev]
          next[i] = Math.round(Math.abs(result.shap[i].value) / maxShap * 100)
          return next
        })
      }, 400 + i * 80)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div style={{
      position:"fixed",inset:0,zIndex:1000,
      display:"flex",alignItems:"center",justifyContent:"center",
      background:"rgba(4,4,12,0.85)",backdropFilter:"blur(20px)",
      padding:"20px",
      opacity: mounted?1:0, transition:"opacity .3s"
    }} onClick={onClose}>
      <div style={{
        width:"100%",maxWidth:680,maxHeight:"90vh",overflow:"auto",
        background:"rgba(10,10,24,0.98)",
        border:"1px solid rgba(201,168,76,0.2)",
        borderRadius:24,
        boxShadow:`0 0 0 1px rgba(255,255,255,0.04),0 40px 100px rgba(0,0,0,0.8),0 0 80px ${accent}15`,
        transform: mounted?"scale(1) translateY(0)":"scale(0.95) translateY(20px)",
        transition:"transform .4s cubic-bezier(0.34,1.56,0.64,1)",
        overflow:"hidden"
      }} onClick={e=>e.stopPropagation()}>

        {/* Top accent bar */}
        <div style={{height:3,background:`linear-gradient(90deg,transparent,${accent},rgba(220,38,38,0.8),transparent)`}}/>

        <div style={{padding:"32px 36px 36px"}}>
          {/* Header row */}
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:28}}>
            <div>
              <div style={{fontSize:10,letterSpacing:".18em",textTransform:"uppercase",color:"rgba(201,168,76,0.5)",marginBottom:8,fontWeight:700}}>
                Résultat de l'analyse
              </div>
              <div style={{display:"flex",alignItems:"baseline",gap:12}}>
                <span style={{
                  fontSize:88,fontWeight:900,lineHeight:1,color:accent,
                  textShadow:`0 0 60px ${accent}50`,
                  fontVariantNumeric:"tabular-nums"
                }}>{score}</span>
                <div>
                  <div style={{fontSize:20,color:"rgba(255,255,255,0.3)",lineHeight:1}}>/100</div>
                  <div style={{
                    marginTop:6,fontSize:12,fontWeight:700,padding:"4px 14px",borderRadius:99,
                    background:`${accent}18`,color:accent,border:`1px solid ${accent}30`,
                    display:"inline-block"
                  }}>{result.niveau}</div>
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{
              border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,
              width:36,height:36,background:"rgba(255,255,255,0.03)",
              cursor:"pointer",fontSize:15,color:"#475569",
              display:"flex",alignItems:"center",justifyContent:"center",
              transition:"all .2s",flexShrink:0
            }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(201,168,76,0.3)";e.currentTarget.style.color="#c9a84c"}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.08)";e.currentTarget.style.color="#475569"}}
            >✕</button>
          </div>

          {/* Gauge */}
          <div style={{marginBottom:24}}>
            <div style={{height:8,background:"rgba(255,255,255,0.05)",borderRadius:99,overflow:"hidden",position:"relative"}}>
              <div style={{
                position:"absolute",inset:0,
                background:"linear-gradient(90deg,rgba(34,197,94,0.3),rgba(245,158,11,0.4),rgba(239,68,68,0.4))",
                borderRadius:99
              }}/>
              <div style={{
                position:"absolute",top:0,left:0,bottom:0,
                width:`${result.score}%`,
                background:`linear-gradient(90deg,#c9a84c,${accent})`,
                borderRadius:99,boxShadow:`0 0 16px ${accent}60`,
                transition:"width 1s cubic-bezier(0.34,1.56,0.64,1)"
              }}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginTop:6,color:"rgba(255,255,255,0.2)"}}>
              <span>Faible risque</span><span>Risque modéré</span><span>Risque élevé</span>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:24}}>
            {/* Decision */}
            <div style={{
              padding:"16px 18px",borderRadius:14,
              background:`${accent}08`,border:`1px solid ${accent}18`
            }}>
              <div style={{fontSize:9,letterSpacing:".14em",textTransform:"uppercase",color:"rgba(255,255,255,0.25)",marginBottom:8,fontWeight:700}}>
                Recommandation
              </div>
              <div style={{fontSize:15,fontWeight:800,color:"#f1f5f9",letterSpacing:"-.01em"}}>
                {result.decision}
              </div>
            </div>

            {/* Proba + score métier */}
            <div style={{
              padding:"16px 18px",borderRadius:14,
              background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)"
            }}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                <span style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>Probabilité ML</span>
                <span style={{fontSize:13,fontWeight:700,color:accent}}>{(result.proba_ml*100).toFixed(1)}%</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>Score métier</span>
                <span style={{fontSize:13,fontWeight:700,color:"#c9a84c"}}>{result.score_metier ?? "—"}/100</span>
              </div>
            </div>
          </div>

          {/* SHAP */}
          <div style={{marginBottom:4}}>
            <div style={{fontSize:10,letterSpacing:".14em",textTransform:"uppercase",color:"rgba(255,255,255,0.25)",marginBottom:14,fontWeight:700}}>
              Facteurs influents (SHAP)
            </div>
            {result.shap.map((f, i) => {
              const pos = f.value > 0
              const color = pos ? "#ef4444" : "#22c55e"
              const w = shapW[i] || 0
              return (
                <div key={f.label} style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                  <span style={{
                    width:140,fontSize:11,fontFamily:"monospace",
                    color:"rgba(255,255,255,0.35)",
                    textOverflow:"ellipsis",overflow:"hidden",whiteSpace:"nowrap",flexShrink:0
                  }}>{f.label}</span>
                  <div style={{flex:1,height:5,background:"rgba(255,255,255,0.04)",borderRadius:99,overflow:"hidden"}}>
                    <div style={{
                      height:"100%",width:`${w}%`,
                      background:`linear-gradient(90deg,${color}60,${color})`,
                      borderRadius:99,
                      transition:"width .8s cubic-bezier(0.34,1.56,0.64,1)",
                      boxShadow:`0 0 6px ${color}50`
                    }}/>
                  </div>
                  <span style={{width:44,fontSize:11,color,fontWeight:700,textAlign:"right",flexShrink:0}}>
                    {pos?"+":""}{f.value}
                  </span>
                </div>
              )
            })}
            <div style={{display:"flex",gap:20,marginTop:10,fontSize:11,color:"rgba(255,255,255,0.25)"}}>
              <span style={{display:"flex",alignItems:"center",gap:5}}>
                <span style={{width:10,height:3,background:"#ef4444",display:"inline-block",borderRadius:99}}/>
                Augmente le risque
              </span>
              <span style={{display:"flex",alignItems:"center",gap:5}}>
                <span style={{width:10,height:3,background:"#22c55e",display:"inline-block",borderRadius:99}}/>
                Réduit le risque
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Section reveal wrapper ───────────────────────────────────────────────────
function Reveal({ children, delay = 0 }) {
  const [ref, visible] = useReveal()
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(24px)",
      transition: `opacity .6s ease ${delay}s, transform .6s ease ${delay}s`
    }}>
      {children}
    </div>
  )
}

// ─── Section label ────────────────────────────────────────────────────────────
function Sec({ label, accent, icon }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
      <div style={{
        width:34,height:34,borderRadius:9,flexShrink:0,
        background:`linear-gradient(135deg,${accent}20,${accent}08)`,
        border:`1px solid ${accent}22`,
        display:"flex",alignItems:"center",justifyContent:"center",fontSize:15
      }}>{icon}</div>
      <span style={{fontSize:14,fontWeight:700,color:"#e2e8f0",letterSpacing:"-.01em"}}>{label}</span>
      <div style={{flex:1,height:1,background:`linear-gradient(90deg,${accent}25,transparent)`}}/>
    </div>
  )
}

// ─── Inputs ───────────────────────────────────────────────────────────────────
function Num({ label, name, value, onChange, min, max, step=1, hint }) {
  const [f,setF] = useState(false)
  return (
    <div>
      <label style={{display:"block",fontSize:11,marginBottom:5,fontWeight:500,color:f?"#c9a84c":"#475569",transition:"color .15s"}}>
        {label}
      </label>
      <input type="number" name={name} value={value} min={min} max={max} step={step}
        onChange={onChange} onFocus={()=>setF(true)} onBlur={()=>setF(false)}
        style={{
          width:"100%",outline:"none",boxSizing:"border-box",
          background:f?"rgba(201,168,76,0.04)":"rgba(255,255,255,0.025)",
          border:`1.5px solid ${f?"rgba(201,168,76,0.45)":"rgba(255,255,255,0.06)"}`,
          borderRadius:9,color:"#f1f5f9",fontSize:14,padding:"10px 13px",fontWeight:500,
          boxShadow:f?"0 0 0 3px rgba(201,168,76,0.07)":"none",
          transition:"all .15s"
        }}/>
      {hint && <div style={{fontSize:9,color:"rgba(255,255,255,0.2)",marginTop:4}}>{hint}</div>}
    </div>
  )
}

function Sel({ label, name, value, onChange, onCustomChange, customValue, options }) {
  const { t } = useApp()
  const [f,setF] = useState(false)
  return (
    <div>
      <label style={{display:"block",fontSize:11,marginBottom:5,fontWeight:500,color:f?"#c9a84c":"#475569",transition:"color .15s"}}>
        {label}
      </label>
      <div style={{position:"relative"}}>
        <select name={name} value={value} onChange={onChange}
          onFocus={()=>setF(true)} onBlur={()=>setF(false)}
          style={{
            width:"100%",outline:"none",boxSizing:"border-box",appearance:"none",
            background:f?"rgba(201,168,76,0.04)":"rgba(255,255,255,0.025)",
            border:`1.5px solid ${f?"rgba(201,168,76,0.45)":"rgba(255,255,255,0.06)"}`,
            borderRadius:9,color:"#f1f5f9",fontSize:13,
            padding:"10px 34px 10px 13px",fontWeight:500,cursor:"pointer",
            boxShadow:f?"0 0 0 3px rgba(201,168,76,0.07)":"none",
            transition:"all .15s"
          }}>
          {options.map(o=><option key={o} style={{background:"#0a0a1a"}}>{o}</option>)}
        </select>
        <svg style={{position:"absolute",right:11,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}
          width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 4l4 4 4-4" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      {value==="Autre" && (
        <input type="text" value={customValue} onChange={e=>onCustomChange(e.target.value)}
          placeholder={t.autrePh||"Précisez…"}
          style={{
            width:"100%",marginTop:7,outline:"none",boxSizing:"border-box",
            background:"rgba(201,168,76,0.04)",border:"1.5px solid rgba(201,168,76,0.35)",
            borderRadius:9,color:"#f1f5f9",fontSize:13,padding:"10px 13px",
            boxShadow:"0 0 0 3px rgba(201,168,76,0.07)",animation:"slideDown .2s ease"
          }}/>
      )}
    </div>
  )
}

const DIV = () => <div style={{height:1,background:"rgba(255,255,255,0.04)",margin:"28px 0"}}/>

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
export default function ScoringPage({ onRiskChange }) {
  const { t } = useApp()
  const [form, setForm]       = useState(INIT_FORM)
  const [custom, setCustom]   = useState({secteur:"",region:"",type_client:"",banque_domiciliation:""})
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [risk, setRisk]       = useState("idle")
  const [showModal, setShowModal] = useState(false)

  const accent =
    risk==="ÉLEVÉ"  ||risk==="HIGH"     ? "#ef4444" :
    risk==="MODÉRÉ" ||risk==="MODERATE" ? "#f59e0b" :
    risk==="FAIBLE" ||risk==="LOW"      ? "#22c55e" : "#c9a84c"

  const hc = e => {
    const {name,value}=e.target
    const r=FIELD_RULES[name]
    let v=isNaN(value)||value===""?value:Number(value)
    if(r&&typeof v==="number") v=Math.min(r.max,Math.max(r.min,v))
    setForm(f=>({...f,[name]:v}))
  }

  const submit = async () => {
    setLoading(true); setError(null)
    const payload={...form}
    ;["secteur","region","type_client","banque_domiciliation"].forEach(k=>{
      if(payload[k]==="Autre"&&custom[k]) payload[k]=custom[k]
    })
    try {
      const {data}=await axios.post("http://127.0.0.1:8000/predict",payload)
      setResult(data); setRisk(data.niveau); setShowModal(true)
      if(onRiskChange) onRiskChange(data.niveau)
    } catch { setError(t.err) }
    setLoading(false)
  }

  const reset = () => {
    setForm(INIT_FORM)
    setCustom({secteur:"",region:"",type_client:"",banque_domiciliation:""})
    setResult(null); setRisk("idle"); setShowModal(false); setError(null)
    if(onRiskChange) onRiskChange("idle")
  }

  return (
    <>
      <style>{`
        @keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes dotpulse{0%,80%,100%{transform:scale(.5);opacity:.2}40%{transform:scale(1);opacity:1}}
        @keyframes scanline{0%{transform:translateY(-100%)}100%{transform:translateY(100vh)}}
        @keyframes pulseGold{0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,0.4)}70%{box-shadow:0 0 0 8px rgba(201,168,76,0)}}
        .submit-btn:hover{transform:translateY(-2px)!important;box-shadow:0 10px 36px rgba(201,168,76,0.45)!important}
        .submit-btn:active{transform:scale(0.98)!important}
        .reset-btn:hover{border-color:rgba(201,168,76,0.3)!important;color:#c9a84c!important}
        input[type=number]::-webkit-inner-spin-button{opacity:.15}
      `}</style>

      {loading && <Loader accent={accent}/>}
      {showModal && result && (
        <ScoreModal result={result} accent={accent} onClose={()=>setShowModal(false)} t={t}/>
      )}

      <main style={{maxWidth:900,margin:"0 auto",padding:"56px 28px 120px"}}>

        {/* ── Hero section */}
        <div style={{textAlign:"center",marginBottom:64,animation:"fadeIn .7s ease"}}>
          <div style={{
            display:"inline-flex",alignItems:"center",gap:8,
            padding:"7px 20px",borderRadius:99,marginBottom:28,
            background:"linear-gradient(135deg,rgba(201,168,76,0.1),rgba(220,38,38,0.07))",
            border:"1px solid rgba(201,168,76,0.18)"
          }}>
            <div style={{width:7,height:7,borderRadius:"50%",background:"#22c55e",
              animation:"pulseGold 2s infinite",boxShadow:"0 0 8px #22c55e"}}/>
            <span style={{
              fontSize:12,fontWeight:700,
              background:"linear-gradient(90deg,#c9a84c,#f59e0b)",
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"
            }}>
              Système de scoring actif — STBG Mégrine
            </span>
          </div>

          <h1 style={{
            fontSize:52,fontWeight:900,letterSpacing:"-.04em",lineHeight:1.05,
            color:"#f1f5f9",margin:"0 0 20px"
          }}>
            Évaluation du risque{" "}
            <span style={{
              background:`linear-gradient(90deg,#c9a84c,${accent})`,
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
              transition:"all .6s"
            }}>client</span>
          </h1>

          <p style={{
            fontSize:16,color:"rgba(255,255,255,0.35)",
            lineHeight:1.8,maxWidth:540,margin:"0 auto"
          }}>
            Modèle XGBoost hybride · 60% Machine Learning · 40% règles métier.<br/>
            Analyse basée sur <strong style={{color:"rgba(201,168,76,0.7)"}}>8 indicateurs</strong> de fiabilité client.
          </p>
        </div>

        {/* ── Form */}
        <Reveal>
          <div style={{
            background:"rgba(8,8,20,0.82)",
            border:"1px solid rgba(201,168,76,0.1)",
            borderRadius:24,
            backdropFilter:"blur(24px)",
            boxShadow:"0 0 0 1px rgba(255,255,255,0.025),0 32px 80px rgba(0,0,0,0.6)",
            overflow:"hidden"
          }}>
            <div style={{height:2,background:`linear-gradient(90deg,transparent,#c9a84c,#ef4444,transparent)`}}/>

            <div style={{padding:"40px 44px 44px"}}>

              <Reveal delay={0.1}>
                <Sec label="Profil client" accent="#c9a84c" icon="🏢"/>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:4}}>
                  <Sel label={t.secteur} name="secteur" value={form.secteur} onChange={hc}
                    customValue={custom.secteur} onCustomChange={v=>setCustom(c=>({...c,secteur:v}))} options={SECTEURS}/>
                  <Sel label={t.type} name="type_client" value={form.type_client} onChange={hc}
                    customValue={custom.type_client} onCustomChange={v=>setCustom(c=>({...c,type_client:v}))} options={TYPES}/>
                  <Sel label={t.region} name="region" value={form.region} onChange={hc}
                    customValue={custom.region} onCustomChange={v=>setCustom(c=>({...c,region:v}))} options={REGIONS}/>
                  <Sel label={t.banque} name="banque_domiciliation" value={form.banque_domiciliation} onChange={hc}
                    customValue={custom.banque_domiciliation} onCustomChange={v=>setCustom(c=>({...c,banque_domiciliation:v}))} options={BANQUES}/>
                </div>
              </Reveal>

              <DIV/>

              <Reveal delay={0.15}>
                <Sec label="Données financières" accent="#3b82f6" icon="💰"/>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
                  <Num label={t.encours}  name="montant_encours_tnd"  value={form.montant_encours_tnd}  onChange={hc} min={0}  max={5000000}  step={1000} hint="Montant en dinars tunisiens"/>
                  <Num label={t.ca}       name="ca_annuel_tnd"        value={form.ca_annuel_tnd}        onChange={hc} min={1}  max={50000000} step={10000} hint="Chiffre d'affaires annuel"/>
                  <Num label={t.anc}      name="anciennete_annees"    value={form.anciennete_annees}    onChange={hc} min={0}  max={50} hint="Années de relation client"/>
                  <Num label={t.traites}  name="nb_traites_actives"   value={form.nb_traites_actives}   onChange={hc} min={1}  max={100}/>
                  <Num label={t.moy}      name="montant_moyen_traite" value={form.montant_moyen_traite} onChange={hc} min={0}  max={2000000} step={1000}/>
                  <Num label={t.contrats} name="nb_contrats_actifs"   value={form.nb_contrats_actifs}   onChange={hc} min={1}  max={50}/>
                </div>
              </Reveal>

              <DIV/>

              <Reveal delay={0.2}>
                <Sec label="Historique de paiement" accent="#ef4444" icon="⚠️"/>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:40}}>
                  <Num label={t.ret}  name="nb_retards_12m"       value={form.nb_retards_12m}       onChange={hc} min={0} max={50}  hint="Nb retards sur 12 mois"/>
                  <Num label={t.imp}  name="nb_impayes"           value={form.nb_impayes}           onChange={hc} min={0} max={20}  hint="Factures non réglées"/>
                  <Num label={t.delai} name="delai_moyen_jours"   value={form.delai_moyen_jours}    onChange={hc} min={0} max={365} hint="Jours moyens de paiement"/>
                  <Num label={t.cheq} name="nb_cheques_retournes" value={form.nb_cheques_retournes} onChange={hc} min={0} max={20}  hint="Chèques sans provision"/>
                  <Num label={t.lit}  name="nb_litiges"           value={form.nb_litiges}           onChange={hc} min={0} max={20}  hint="Litiges en cours"/>
                  <Num label={t.conc} name="concentration_pct"    value={form.concentration_pct}    onChange={hc} min={0} max={100} hint="% du CA chez STBG"/>
                </div>

                {/* Actions */}
                <div style={{display:"flex",gap:12}}>
                  <button className="submit-btn" onClick={submit} disabled={loading} style={{
                    flex:1,border:"none",cursor:"pointer",
                    fontFamily:"inherit",fontWeight:800,fontSize:15,
                    padding:"17px 28px",borderRadius:14,
                    background:"linear-gradient(135deg,#92700a,#c9a84c,#d97706)",
                    color:"#0a0a1a",
                    display:"flex",alignItems:"center",justifyContent:"center",gap:10,
                    boxShadow:"0 4px 24px rgba(201,168,76,0.3),0 0 0 1px rgba(201,168,76,0.15)",
                    transition:"all .25s",letterSpacing:"-.01em"
                  }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 2a6 6 0 100 12A6 6 0 008 2zm-1 3v4l3 2" stroke="#0a0a1a" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    Analyser le risque
                  </button>

                  <button className="reset-btn" onClick={reset} style={{
                    border:"1.5px solid rgba(255,255,255,0.07)",borderRadius:14,
                    padding:"17px 24px",background:"rgba(255,255,255,0.02)",
                    cursor:"pointer",fontFamily:"inherit",fontWeight:600,fontSize:14,
                    color:"rgba(255,255,255,0.3)",transition:"all .2s"
                  }}>{t.reset}</button>
                </div>

                {error && (
                  <div style={{marginTop:16,padding:"12px 16px",background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:10,fontSize:13,color:"#fca5a5"}}>
                    ⚠ {error}
                  </div>
                )}

                {/* Last result quick view */}
                {result && !showModal && (
                  <div style={{
                    marginTop:16,padding:"12px 18px",
                    background:`${accent}08`,border:`1px solid ${accent}20`,borderRadius:12,
                    display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"
                  }} onClick={()=>setShowModal(true)}>
                    <span style={{fontSize:13,color:"rgba(255,255,255,0.4)"}}>
                      Dernier résultat : <strong style={{color:accent}}>Score {result.score} — {result.niveau}</strong>
                    </span>
                    <span style={{fontSize:11,color:accent}}>Voir →</span>
                  </div>
                )}
              </Reveal>
            </div>
          </div>
        </Reveal>
      </main>
    </>
  )
}