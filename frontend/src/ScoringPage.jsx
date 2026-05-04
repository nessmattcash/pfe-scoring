import { useState, useEffect, useRef } from "react"
import axios from "axios"

// ── Constants ────────────────────────────────────────────────────────
const SECTEURS = ["Commerce","Industrie","BTP","Agro-alimentaire","Distribution"]
const REGIONS  = ["Tunis","Sfax","Sousse","Bizerte","Nabeul","Ariana","Ben Arous","Monastir"]
const TYPES    = ["Grossiste","Détaillant","Grande surface","Restauration","Export"]
const BANQUES  = ["ATTIJARI","BNA","BIAT","STB","ATB","QNB SELIENA","UIB","AMEN BANK","WIFAK BANK","ZITOUNA BQ","AL BARAKA","UBCI","BTRUE DE TURQUIE"]

const INIT = {
  anciennete_annees:5, nb_contrats_actifs:4,
  montant_encours_tnd:120000, ca_annuel_tnd:620000,
  nb_traites_actives:6, montant_moyen_traite:20000,
  nb_retards_12m:1, nb_impayes:0,
  delai_moyen_jours:28, concentration_pct:14,
  nb_cheques_retournes:0, nb_litiges:0,
  secteur:"Commerce", region:"Tunis",
  type_client:"Grossiste", banque_domiciliation:"ATTIJARI"
}

// ── BG themes per risk level ─────────────────────────────────────────
const THEMES = {
  idle: {
    bg: "radial-gradient(ellipse at 20% 50%, #1a0a00 0%, #0d0d0d 50%, #000510 100%)",
    accent: "#c9a84c", glow: "rgba(201,168,76,0.15)"
  },
  FAIBLE: {
    bg: "radial-gradient(ellipse at 80% 20%, #001a0d 0%, #0d0d0d 50%, #000d1a 100%)",
    accent: "#22c55e", glow: "rgba(34,197,94,0.12)"
  },
  MODÉRÉ: {
    bg: "radial-gradient(ellipse at 50% 80%, #1a0e00 0%, #0d0d0d 50%, #0d0500 100%)",
    accent: "#f59e0b", glow: "rgba(245,158,11,0.12)"
  },
  ÉLEVÉ: {
    bg: "radial-gradient(ellipse at 10% 90%, #1a0000 0%, #0d0d0d 50%, #1a0005 100%)",
    accent: "#ef4444", glow: "rgba(239,68,68,0.12)"
  }
}

// ── Field component ──────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{
        display: "block", fontSize: 10, fontFamily: "'DM Mono', monospace",
        letterSpacing: "0.12em", color: "#6b7280", textTransform: "uppercase",
        marginBottom: 6
      }}>{label}</label>
      {children}
    </div>
  )
}

// ── Animated number ──────────────────────────────────────────────────
function AnimatedNumber({ target, color }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    let start = 0
    const step = () => {
      start += Math.ceil((target - start) / 6)
      setDisplay(start)
      if (start < target) ref.current = requestAnimationFrame(step)
    }
    ref.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(ref.current)
  }, [target])
  return (
    <span style={{ color, fontFamily: "'DM Mono', monospace", fontSize: 72,
      fontWeight: 700, lineHeight: 1, display: "block",
      textShadow: `0 0 40px ${color}60` }}>
      {display}
    </span>
  )
}

// ── SHAP bar ─────────────────────────────────────────────────────────
function ShapBar({ label, value, max, accent, delay }) {
  const [width, setWidth] = useState(0)
  const pct = Math.round(Math.abs(value) / max * 100)
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), delay)
    return () => clearTimeout(t)
  }, [pct, delay])
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
      <span style={{
        fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#6b7280",
        width: 110, flexShrink: 0, textOverflow: "ellipsis", overflow: "hidden",
        whiteSpace: "nowrap"
      }}>{label}</span>
      <div style={{ flex: 1, height: 5, background: "rgba(255,255,255,0.05)",
        borderRadius: 99, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${width}%`, background: accent,
          borderRadius: 99, transition: "width 0.7s cubic-bezier(0.34,1.56,0.64,1)",
          boxShadow: `0 0 8px ${accent}80`
        }} />
      </div>
      <span style={{
        fontFamily: "'DM Mono', monospace", fontSize: 10,
        color: accent, width: 32, textAlign: "right"
      }}>{value}</span>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────
export default function ScoringPage() {
  const [form,    setForm]   = useState(INIT)
  const [result,  setResult] = useState(null)
  const [loading, setLoading]= useState(false)
  const [error,   setError]  = useState(null)
  const [theme,   setTheme]  = useState(THEMES.idle)
  const [pulse,   setPulse]  = useState(false)

  const set = k => e => {
    const v = e.target.value
    setForm(f => ({ ...f, [k]: isNaN(v) || v === "" ? v : Number(v) }))
  }

  const submit = async () => {
    setLoading(true); setError(null); setPulse(false)
    try {
      const { data } = await axios.post("http://127.0.0.1:8000/predict", form)
      setResult(data)
      setTheme(THEMES[data.niveau] || THEMES.idle)
      setPulse(true)
    } catch {
      setError("Impossible de joindre le serveur — vérifiez que FastAPI tourne")
      setTheme(THEMES.idle)
    }
    setLoading(false)
  }

  const accent = theme.accent

  const inputStyle = {
    width: "100%", background: "rgba(255,255,255,0.04)",
    border: `1px solid rgba(255,255,255,0.08)`,
    borderRadius: 8, color: "#e8eaf0",
    fontFamily: "'DM Mono', monospace", fontSize: 12,
    padding: "9px 12px", outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box"
  }

  const maxShap = result ? Math.max(...result.shap.map(f => Math.abs(f.value)), 1) : 1

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0d0d0d; }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.3; }
        select option { background: #1a1a1a; }
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 ${accent}40; }
          70% { box-shadow: 0 0 0 20px transparent; }
          100% { box-shadow: 0 0 0 0 transparent; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .field-input:focus { border-color: ${accent} !important; }
        .submit-btn:hover { opacity: 0.9; transform: scale(1.01); }
        .submit-btn:active { transform: scale(0.99); }
        .score-ring { animation: ${pulse ? "pulse-ring 0.8s ease-out" : "none"}; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: theme.bg,
        transition: "background 1.2s cubic-bezier(0.4,0,0.2,1)",
        padding: "0",
        fontFamily: "'Syne', sans-serif",
        position: "relative",
        overflow: "hidden"
      }}>

        {/* Ambient glow */}
        <div style={{
          position: "fixed", top: -200, right: -200,
          width: 600, height: 600, borderRadius: "50%",
          background: theme.glow,
          filter: "blur(120px)", pointerEvents: "none",
          transition: "background 1.2s ease",
          zIndex: 0
        }} />

        {/* Grid texture */}
        <div style={{
          position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
          backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
          backgroundSize: "60px 60px"
        }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>

          {/* ── HEADER ── */}
          <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 36 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <img src="/logo.png" alt="STBG" style={{ height: 48, width: "auto" }} />
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
                  STBG <span style={{ color: accent, transition: "color 0.8s" }}>Risk</span>
                </div>
                <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace",
                  color: "#4b5563", letterSpacing: "0.12em" }}>
                  SCORING INTELLIGENCE PLATFORM
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              {["XGBoost v2", "AUC 0.97", "50k clients"].map(t => (
                <span key={t} style={{
                  fontSize: 10, fontFamily: "'DM Mono', monospace",
                  padding: "4px 10px", borderRadius: 4,
                  border: `1px solid rgba(255,255,255,0.08)`,
                  color: "#6b7280", background: "rgba(255,255,255,0.02)"
                }}>{t}</span>
              ))}
            </div>
          </header>

          {/* ── PAGE TITLE ── */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 36, fontWeight: 800, color: "#fff",
              letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              Scoring<br />
              <span style={{ color: accent, transition: "color 0.8s" }}>individuel</span>
            </h1>
            <p style={{ fontSize: 13, color: "#6b7280", marginTop: 8, fontFamily: "'DM Mono', monospace" }}>
              Évaluation du risque crédit par modèle ML hybride — résultat instantané
            </p>
          </div>

          {/* ── MAIN GRID ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, alignItems: "start" }}>

            {/* ── FORM CARD ── */}
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 16, padding: 24,
              backdropFilter: "blur(12px)"
            }}>
              {/* Section — Identité */}
              <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace",
                color: accent, letterSpacing: "0.14em", marginBottom: 16,
                transition: "color 0.8s" }}>
                01 — IDENTITÉ CLIENT
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 4 }}>
                <Field label="Secteur d'activité">
                  <select className="field-input" value={form.secteur} onChange={set("secteur")} style={inputStyle}>
                    {SECTEURS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Type client">
                  <select className="field-input" value={form.type_client} onChange={set("type_client")} style={inputStyle}>
                    {TYPES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Région">
                  <select className="field-input" value={form.region} onChange={set("region")} style={inputStyle}>
                    {REGIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Banque domiciliation">
                  <select className="field-input" value={form.banque_domiciliation} onChange={set("banque_domiciliation")} style={inputStyle}>
                    {BANQUES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </Field>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "16px 0" }} />

              {/* Section — Financier */}
              <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace",
                color: accent, letterSpacing: "0.14em", marginBottom: 16,
                transition: "color 0.8s" }}>
                02 — DONNÉES FINANCIÈRES
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 4 }}>
                {[
                  ["Encours (TND)",      "montant_encours_tnd"],
                  ["CA annuel (TND)",    "ca_annuel_tnd"],
                  ["Ancienneté (ans)",   "anciennete_annees"],
                  ["Nb traites actives", "nb_traites_actives"],
                  ["Montant moy. traite","montant_moyen_traite"],
                  ["Nb contrats actifs", "nb_contrats_actifs"],
                ].map(([label, key]) => (
                  <Field key={key} label={label}>
                    <input type="number" className="field-input"
                      value={form[key]} onChange={set(key)} style={inputStyle} />
                  </Field>
                ))}
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "16px 0" }} />

              {/* Section — Comportement */}
              <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace",
                color: accent, letterSpacing: "0.14em", marginBottom: 16,
                transition: "color 0.8s" }}>
                03 — HISTORIQUE PAIEMENT
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 4 }}>
                {[
                  ["Retards 12 mois",     "nb_retards_12m"],
                  ["Impayés",             "nb_impayes"],
                  ["Délai moyen (j)",     "delai_moyen_jours"],
                  ["Chèques retournés",   "nb_cheques_retournes"],
                  ["Litiges en cours",    "nb_litiges"],
                  ["Concentration (%)",   "concentration_pct"],
                ].map(([label, key]) => (
                  <Field key={key} label={label}>
                    <input type="number" className="field-input"
                      value={form[key]} onChange={set(key)} style={inputStyle} />
                  </Field>
                ))}
              </div>

              {/* Submit */}
              <button className="submit-btn" onClick={submit} disabled={loading}
                style={{
                  width: "100%", marginTop: 20, padding: "13px",
                  background: loading ? "rgba(255,255,255,0.05)" : accent,
                  color: loading ? "#6b7280" : "#000",
                  fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700,
                  border: "none", borderRadius: 8, cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.3s", letterSpacing: "0.04em",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                }}>
                {loading ? (
                  <>
                    <span style={{ width: 14, height: 14, border: "2px solid #6b7280",
                      borderTopColor: "#fff", borderRadius: "50%",
                      display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                    ANALYSE EN COURS…
                  </>
                ) : "CALCULER LE SCORE DE RISQUE →"}
              </button>

              {error && (
                <div style={{ marginTop: 12, padding: "10px 14px",
                  background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: 8, fontSize: 12, color: "#ef4444", fontFamily: "'DM Mono', monospace" }}>
                  {error}
                </div>
              )}

              {/* API indicator */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 14 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%",
                  background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
                <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: "#4b5563" }}>
                  POST http://127.0.0.1:8000/predict
                </span>
              </div>
            </div>

            {/* ── RESULT PANEL ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Score card */}
              <div className="score-ring" style={{
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${result ? accent + "40" : "rgba(255,255,255,0.07)"}`,
                borderRadius: 16, padding: 24,
                backdropFilter: "blur(12px)",
                transition: "border-color 0.8s",
                animation: pulse ? "pulse-ring 0.8s ease-out" : "none"
              }}>
                {!result ? (
                  <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace",
                      color: "#4b5563", letterSpacing: "0.12em", marginBottom: 16 }}>
                      EN ATTENTE D'ANALYSE
                    </div>
                    <div style={{ width: 80, height: 80, borderRadius: "50%",
                      border: "1px solid rgba(255,255,255,0.06)",
                      margin: "0 auto 16px",
                      display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ fontSize: 28, opacity: 0.2 }}>◎</div>
                    </div>
                    <p style={{ fontSize: 12, color: "#374151", fontFamily: "'DM Mono', monospace" }}>
                      Remplis le formulaire<br />et lance l'analyse
                    </p>
                  </div>
                ) : (
                  <div style={{ animation: "fadeUp 0.5s ease" }}>
                    <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace",
                      color: accent, letterSpacing: "0.14em", marginBottom: 12,
                      transition: "color 0.8s" }}>
                      RÉSULTAT DU SCORING
                    </div>

                    <AnimatedNumber target={result.score} color={accent} />

                    <div style={{ display: "flex", alignItems: "center",
                      justifyContent: "space-between", marginTop: 4, marginBottom: 14 }}>
                      <span style={{ fontSize: 14, color: "#374151",
                        fontFamily: "'DM Mono', monospace" }}>/100</span>
                      <span style={{
                        fontSize: 11, fontFamily: "'DM Mono', monospace", fontWeight: 600,
                        padding: "4px 12px", borderRadius: 20,
                        background: `${accent}18`, color: accent,
                        border: `1px solid ${accent}35`,
                        transition: "all 0.8s"
                      }}>{result.niveau}</span>
                    </div>

                    {/* Gauge */}
                    <div style={{ height: 4, background: "rgba(255,255,255,0.05)",
                      borderRadius: 99, overflow: "hidden", marginBottom: 6 }}>
                      <div style={{
                        height: "100%", width: `${result.score}%`,
                        background: accent, borderRadius: 99,
                        transition: "width 0.8s cubic-bezier(0.34,1.56,0.64,1)",
                        boxShadow: `0 0 12px ${accent}60`
                      }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between",
                      fontSize: 9, fontFamily: "'DM Mono', monospace",
                      color: "#374151", marginBottom: 16 }}>
                      <span>FAIBLE</span><span>MODÉRÉ</span><span>ÉLEVÉ</span>
                    </div>

                    {/* Decision */}
                    <div style={{
                      padding: "12px 14px",
                      background: `${accent}0a`,
                      border: `1px solid ${accent}20`,
                      borderRadius: 8, marginBottom: 16,
                      transition: "all 0.8s"
                    }}>
                      <div style={{ fontSize: 9, fontFamily: "'DM Mono', monospace",
                        color: "#4b5563", marginBottom: 4 }}>RECOMMANDATION</div>
                      <div style={{ fontSize: 13, color: "#e8eaf0", fontWeight: 600 }}>
                        {result.decision}
                      </div>
                    </div>

                    {/* Proba ML */}
                    <div style={{ display: "flex", justifyContent: "space-between",
                      fontSize: 10, fontFamily: "'DM Mono', monospace",
                      color: "#4b5563", marginBottom: 4 }}>
                      <span>Probabilité ML brute</span>
                      <span style={{ color: accent }}>{(result.proba_ml * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* SHAP card */}
              {result && (
                <div style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 16, padding: 20,
                  backdropFilter: "blur(12px)",
                  animation: "fadeUp 0.6s ease 0.1s both"
                }}>
                  <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace",
                    color: accent, letterSpacing: "0.14em", marginBottom: 14,
                    transition: "color 0.8s" }}>
                    FACTEURS INFLUENTS — SHAP
                  </div>
                  {result.shap.map((f, i) => (
                    <ShapBar key={f.label} label={f.label}
                      value={f.value} max={maxShap} accent={accent} delay={i * 80} />
                  ))}
                  <div style={{ marginTop: 12, fontSize: 9, fontFamily: "'DM Mono', monospace",
                    color: "#374151" }}>
                    Rouge = risque augmenté · Vert = risque réduit
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── FOOTER ── */}
          <footer style={{ marginTop: 40, paddingTop: 20,
            borderTop: "1px solid rgba(255,255,255,0.05)",
            display: "flex", justifyContent: "space-between",
            alignItems: "center" }}>
            <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: "#374151" }}>
              STBG · Système de Scoring ML · PFE 2026
            </span>
            <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: "#374151" }}>
              XGBoost + Règles Métier · Score hybride 60/40
            </span>
          </footer>
        </div>
      </div>
    </>
  )
}
