import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { useApp } from "../AppContext"
import { REGIONS, SECTEURS, TYPES, BANQUES, INIT_FORM, FIELD_RULES } from "../constants/data"

// ── Animated number counter ───────────────────────────────────────────────────
function AnimNum({ value, color }) {
  const [n, setN] = useState(0)
  const prev = useRef(0)
  useEffect(() => {
    const from = prev.current
    prev.current = value
    let i = 0
    const id = setInterval(() => {
      i++
      setN(Math.round(from + (value - from) * (i / 32)))
      if (i >= 32) clearInterval(id)
    }, 14)
    return () => clearInterval(id)
  }, [value])
  return (
    <span style={{
      fontFamily: "monospace", fontSize: 88, fontWeight: 800,
      lineHeight: 1, color, display: "block", transition: "color .6s",
      textShadow: `0 0 60px ${color}45, 0 0 20px ${color}25`
    }}>{n}</span>
  )
}

// ── SHAP bar row ──────────────────────────────────────────────────────────────
function ShapRow({ label, value, max, delay }) {
  const { dark } = useApp()
  const [w, setW] = useState(0)
  const pct = max > 0 ? Math.round(Math.abs(value) / max * 100) : 0
  const color = value > 0 ? "#ef4444" : "#22c55e"
  useEffect(() => {
    const id = setTimeout(() => setW(pct), delay)
    return () => clearTimeout(id)
  }, [pct, delay])
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
      <span style={{
        width: 118, fontSize: 11, color: dark ? "#64748b" : "#94a3b8",
        textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", flexShrink: 0
      }}>{label}</span>
      <div style={{
        flex: 1, height: 5, background: dark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.07)",
        borderRadius: 99, overflow: "hidden"
      }}>
        <div style={{
          height: "100%", width: `${w}%`, background: color, borderRadius: 99,
          transition: "width .85s cubic-bezier(0.34,1.56,0.64,1)",
          boxShadow: `0 0 6px ${color}50`
        }} />
      </div>
      <span style={{
        width: 40, fontSize: 11, color, fontWeight: 700,
        textAlign: "right", flexShrink: 0
      }}>{value > 0 ? "+" : ""}{value}</span>
    </div>
  )
}

// ── Section title ─────────────────────────────────────────────────────────────
function SecTitle({ n, label, accent }) {
  const { dark } = useApp()
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
      <div style={{
        width: 24, height: 24, borderRadius: 6, flexShrink: 0,
        background: `${accent}18`, border: `1px solid ${accent}35`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 10, fontWeight: 700, color: accent
      }}>{n}</div>
      <span style={{ fontSize: 13, fontWeight: 600, color: accent }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: `${accent}20` }} />
    </div>
  )
}

// ── Number input ──────────────────────────────────────────────────────────────
function NumInput({ label, name, value, onChange, min, max, step = 1 }) {
  const { dark } = useApp()
  const [f, setF] = useState(false)
  return (
    <div>
      <label style={{
        display: "block", fontSize: 11, marginBottom: 6, fontWeight: 500,
        color: f ? "#3b82f6" : (dark ? "#94a3b8" : "#64748b"),
        transition: "color .2s"
      }}>{label}</label>
      <input
        type="number" name={name} value={value} min={min} max={max} step={step}
        onChange={onChange}
        onFocus={() => setF(true)} onBlur={() => setF(false)}
        style={{
          width: "100%", outline: "none", boxSizing: "border-box",
          background: dark ? "rgba(30,41,59,0.85)" : "#ffffff",
          border: `1.5px solid ${f ? "#3b82f6" : (dark ? "rgba(255,255,255,0.1)" : "#e2e8f0")}`,
          borderRadius: 10, color: dark ? "#f1f5f9" : "#0f172a",
          fontSize: 13, padding: "10px 13px",
          boxShadow: f
            ? "0 0 0 3px rgba(59,130,246,0.15)"
            : (dark ? "none" : "0 1px 3px rgba(0,0,0,0.06)"),
          transition: "border-color .2s, box-shadow .2s"
        }}
      />
    </div>
  )
}

// ── Select with "Autre" support ───────────────────────────────────────────────
function SmartSelect({ label, name, value, onChange, onCustomChange, customValue, options }) {
  const { dark, t } = useApp()
  const [f, setF] = useState(false)
  const isAutre = value === "Autre"

  return (
    <div>
      <label style={{
        display: "block", fontSize: 11, marginBottom: 6, fontWeight: 500,
        color: f ? "#3b82f6" : (dark ? "#94a3b8" : "#64748b"),
        transition: "color .2s"
      }}>{label}</label>

      <select
        name={name} value={value} onChange={onChange}
        onFocus={() => setF(true)} onBlur={() => setF(false)}
        style={{
          width: "100%", outline: "none", boxSizing: "border-box", appearance: "none",
          background: dark ? "rgba(30,41,59,0.9)" : "#ffffff",
          border: `1.5px solid ${f ? "#3b82f6" : (dark ? "rgba(255,255,255,0.1)" : "#e2e8f0")}`,
          borderRadius: 10, color: dark ? "#f1f5f9" : "#0f172a",
          fontSize: 13, padding: "10px 36px 10px 13px",
          boxShadow: f
            ? "0 0 0 3px rgba(59,130,246,0.15)"
            : (dark ? "none" : "0 1px 3px rgba(0,0,0,0.06)"),
          transition: "border-color .2s, box-shadow .2s",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center"
        }}
      >
        {options.map(o => (
          <option key={o} style={{ background: dark ? "#1e293b" : "#fff" }}>{o}</option>
        ))}
      </select>

      {/* "Autre" custom field — slides in smoothly */}
      {isAutre && (
        <input
          type="text"
          value={customValue}
          onChange={e => onCustomChange(e.target.value)}
          placeholder={t.autrePh}
          style={{
            width: "100%", marginTop: 8, outline: "none", boxSizing: "border-box",
            background: dark ? "rgba(30,41,59,0.85)" : "#ffffff",
            border: `1.5px solid #3b82f6`,
            borderRadius: 10, color: dark ? "#f1f5f9" : "#0f172a",
            fontSize: 13, padding: "10px 13px",
            boxShadow: "0 0 0 3px rgba(59,130,246,0.12)",
            animation: "slideDown .25s ease"
          }}
        />
      )}
    </div>
  )
}

// ── Divider ───────────────────────────────────────────────────────────────────
function Divider() {
  const { dark } = useApp()
  return <div style={{ height: 1, background: dark ? "rgba(255,255,255,0.06)" : "#f1f5f9", margin: "24px 0" }} />
}

// ══════════════════════════════════════════════════════════════════════════════
// SCORING PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function ScoringPage({ onRiskChange }) {
  const { dark, t } = useApp()
  const [form, setForm] = useState(INIT_FORM)
  const [custom, setCustom] = useState({ secteur: "", region: "", type_client: "", banque_domiciliation: "" })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [risk, setRisk] = useState("idle")
  const [showPanel, setShowPanel] = useState(false)

  const accent = risk === "ÉLEVÉ" || risk === "HIGH"   ? "#ef4444"
               : risk === "MODÉRÉ" || risk === "MODERATE" ? "#f59e0b"
               : risk === "FAIBLE" || risk === "LOW"   ? "#22c55e"
               : "#3b82f6"

  const handleChange = e => {
    const { name, value } = e.target
    const rules = FIELD_RULES[name]
    let v = isNaN(value) || value === "" ? value : Number(value)
    if (rules && typeof v === "number") v = Math.min(rules.max, Math.max(rules.min, v))
    setForm(f => ({ ...f, [name]: v }))
  }

  const handleCustom = (fieldName, val) => {
    setCustom(c => ({ ...c, [fieldName]: val }))
  }

  const submit = async () => {
    setLoading(true); setError(null)
    // Resolve "Autre" values
    const payload = { ...form }
    ;["secteur", "region", "type_client", "banque_domiciliation"].forEach(k => {
      if (payload[k] === "Autre" && custom[k]) payload[k] = custom[k]
    })
    try {
      const { data } = await axios.post("http://127.0.0.1:8000/predict", payload)
      setResult(data)
      setRisk(data.niveau)
      setShowPanel(true)
      if (onRiskChange) onRiskChange(data.niveau)
    } catch {
      setError(t.err)
    }
    setLoading(false)
  }

  const reset = () => {
    setForm(INIT_FORM)
    setCustom({ secteur: "", region: "", type_client: "", banque_domiciliation: "" })
    setResult(null); setRisk("idle"); setShowPanel(false); setError(null)
    if (onRiskChange) onRiskChange("idle")
  }

  const maxShap = result ? Math.max(...result.shap.map(f => Math.abs(f.value)), 1) : 1

  // Card style — white on dark mode, soft shadow on light
  const card = {
    background: dark ? "rgba(15,23,42,0.82)" : "#ffffff",
    border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}`,
    borderRadius: 16,
    backdropFilter: dark ? "blur(24px)" : "none",
    boxShadow: dark
      ? "0 4px 40px rgba(0,0,0,0.4)"
      : "0 4px 24px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
    transition: "background .4s, border .4s, box-shadow .4s"
  }

  return (
    <>
      <style>{`
        @keyframes slideDown { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeUp    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn   { from{transform:translateX(100%)} to{transform:translateX(0)} }
        @keyframes spin      { to{transform:rotate(360deg)} }
        @keyframes blink     { 0%,100%{opacity:1} 50%{opacity:.3} }
      `}</style>

<main style={{ maxWidth: 760, margin: "0 auto", padding: "44px 32px 80px" }}>

        {/* Page title */}
        <div style={{ textAlign: "center", marginBottom: 44, maxWidth: 720 }}>
          <h1 style={{
            fontSize: 42, fontWeight: 800, letterSpacing: "-.035em", lineHeight: 1.1,
            color: dark ? "#f1f5f9" : "#0f172a", margin: 0,
            textAlign: "center"
          }}>
            Scoring{" "}
            <span style={{ color: accent, transition: "color .7s" }}>individuel</span>
          </h1>
          <p style={{
            fontSize: 14, color: dark ? "#64748b" : "#94a3b8",
            marginTop: 10, lineHeight: 1.5
          }}>
            {t.waitSub}
          </p>
        </div>

        {/* Centered form card */}
        <div style={{ ...card, padding: 36, marginBottom: 0 , width: "100%", maxWidth: 720}}>

          {/* Section 01 — Profil */}
          <SecTitle n="01" label={t.s01} accent="#3b82f6" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 0 }}>
            <SmartSelect
              label={t.secteur} name="secteur" value={form.secteur}
              onChange={handleChange} customValue={custom.secteur}
              onCustomChange={v => handleCustom("secteur", v)} options={SECTEURS}
            />
            <SmartSelect
              label={t.type} name="type_client" value={form.type_client}
              onChange={handleChange} customValue={custom.type_client}
              onCustomChange={v => handleCustom("type_client", v)} options={TYPES}
            />
            <SmartSelect
              label={t.region} name="region" value={form.region}
              onChange={handleChange} customValue={custom.region}
              onCustomChange={v => handleCustom("region", v)} options={REGIONS}
            />
            <SmartSelect
              label={t.banque} name="banque_domiciliation" value={form.banque_domiciliation}
              onChange={handleChange} customValue={custom.banque_domiciliation}
              onCustomChange={v => handleCustom("banque_domiciliation", v)} options={BANQUES}
            />
          </div>

          <Divider />

          {/* Section 02 — Financier */}
          <SecTitle n="02" label={t.s02} accent="#6366f1" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            <NumInput label={t.encours}  name="montant_encours_tnd"  value={form.montant_encours_tnd}  onChange={handleChange} min={0}  max={5000000}  step={1000} />
            <NumInput label={t.ca}       name="ca_annuel_tnd"        value={form.ca_annuel_tnd}        onChange={handleChange} min={1}  max={50000000} step={10000} />
            <NumInput label={t.anc}      name="anciennete_annees"    value={form.anciennete_annees}    onChange={handleChange} min={0}  max={50} />
            <NumInput label={t.traites}  name="nb_traites_actives"   value={form.nb_traites_actives}   onChange={handleChange} min={1}  max={100} />
            <NumInput label={t.moy}      name="montant_moyen_traite" value={form.montant_moyen_traite} onChange={handleChange} min={0}  max={2000000}  step={1000} />
            <NumInput label={t.contrats} name="nb_contrats_actifs"   value={form.nb_contrats_actifs}   onChange={handleChange} min={1}  max={50} />
          </div>

          <Divider />

          {/* Section 03 — Paiement */}
          <SecTitle n="03" label={t.s03} accent="#f43f5e" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 28 }}>
            <NumInput label={t.ret}  name="nb_retards_12m"       value={form.nb_retards_12m}       onChange={handleChange} min={0} max={50} />
            <NumInput label={t.imp}  name="nb_impayes"           value={form.nb_impayes}           onChange={handleChange} min={0} max={20} />
            <NumInput label={t.delai} name="delai_moyen_jours"   value={form.delai_moyen_jours}    onChange={handleChange} min={0} max={365} />
            <NumInput label={t.cheq} name="nb_cheques_retournes" value={form.nb_cheques_retournes} onChange={handleChange} min={0} max={20} />
            <NumInput label={t.lit}  name="nb_litiges"           value={form.nb_litiges}           onChange={handleChange} min={0} max={20} />
            <NumInput label={t.conc} name="concentration_pct"    value={form.concentration_pct}    onChange={handleChange} min={0} max={100} />
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={submit} disabled={loading}
              style={{
                flex: 1, border: "none", cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "inherit", fontWeight: 700, fontSize: 14,
                padding: "14px 24px", borderRadius: 12,
                background: loading
                  ? (dark ? "rgba(37,99,235,.15)" : "#dbeafe")
                  : "linear-gradient(135deg,#1d4ed8,#2563eb)",
                color: loading ? (dark ? "#475569" : "#93c5fd") : "#fff",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: loading ? "none" : "0 4px 20px rgba(37,99,235,.35)",
                transition: "all .2s"
              }}
            >
              {loading
                ? <>
                    <span style={{
                      width: 15, height: 15, border: "2px solid currentColor",
                      borderTopColor: "transparent", borderRadius: "50%",
                      display: "inline-block", animation: "spin .7s linear infinite"
                    }} />
                    {t.loading}
                  </>
                : `→ ${t.calc}`}
            </button>

            <button
              onClick={reset}
              style={{
                border: `1.5px solid ${dark ? "rgba(255,255,255,0.1)" : "#e2e8f0"}`,
                borderRadius: 12, padding: "14px 24px",
                background: "transparent", cursor: "pointer",
                fontFamily: "inherit", fontWeight: 600, fontSize: 13,
                color: dark ? "#64748b" : "#94a3b8",
                transition: "all .2s"
              }}
            >{t.reset}</button>
          </div>

          {error && (
            <div style={{
              marginTop: 14, padding: "12px 16px",
              background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)",
              borderRadius: 10, fontSize: 12, color: "#fca5a5"
            }}>⚠ {error}</div>
          )}

          {/* API status */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 16 }}>
            <div style={{
              width: 5, height: 5, borderRadius: "50%", background: "#22c55e",
              animation: "blink 2s infinite", boxShadow: "0 0 5px #22c55e"
            }} />
            <span style={{ fontSize: 11, color: dark ? "#334155" : "#cbd5e1" }}>
              FastAPI · POST http://127.0.0.1:8000/predict
            </span>
          </div>
        </div>
      </main>

      {/* ── RESULT SLIDE-IN PANEL ── */}
      {showPanel && result && (
        <div style={{
          position: "fixed", top: 0, right: 0, bottom: 0, width: 420,
          zIndex: 500, overflow: "auto",
          background: dark ? "rgba(2,8,23,0.97)" : "rgba(255,255,255,0.98)",
          backdropFilter: "blur(30px)",
          borderLeft: `1px solid ${accent}30`,
          boxShadow: `-12px 0 60px rgba(0,0,0,${dark ? ".5" : ".12"})`,
          animation: "slideIn .4s cubic-bezier(0.22,1,0.36,1)"
        }}>
          {/* Close btn */}
          <button
            onClick={() => setShowPanel(false)}
            style={{
              position: "absolute", top: 18, right: 18,
              border: `1px solid ${dark ? "rgba(255,255,255,.1)" : "#e2e8f0"}`,
              borderRadius: 8, width: 32, height: 32,
              background: "transparent", cursor: "pointer",
              fontSize: 16, color: dark ? "#64748b" : "#94a3b8",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>✕</button>

          <div style={{ padding: "28px 28px 40px" }}>

            {/* Score */}
            <div style={{
              fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase",
              color: dark ? "#475569" : "#94a3b8", marginBottom: 12
            }}>{t.res}</div>

            <AnimNum value={result.score} color={accent} />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 20, color: dark ? "#334155" : "#94a3b8" }}>/100</span>
              <span style={{
                fontSize: 12, fontWeight: 700, padding: "5px 16px", borderRadius: 20,
                background: `${accent}18`, color: accent, border: `1px solid ${accent}30`
              }}>{result.niveau}</span>
            </div>

            {/* Gauge */}
            <div style={{ margin: "18px 0 6px" }}>
              <div style={{
                height: 5, background: dark ? "rgba(255,255,255,.06)" : "#f1f5f9",
                borderRadius: 99, overflow: "hidden"
              }}>
                <div style={{
                  height: "100%", width: `${result.score}%`,
                  background: `linear-gradient(90deg,#1d4ed8,${accent})`,
                  borderRadius: 99, boxShadow: `0 0 10px ${accent}55`,
                  transition: "width .9s cubic-bezier(0.34,1.56,0.64,1)"
                }} />
              </div>
              <div style={{
                display: "flex", justifyContent: "space-between",
                fontSize: 10, marginTop: 5,
                color: dark ? "#334155" : "#94a3b8"
              }}>
                <span>{t.faible}</span><span>{t.modere}</span><span>{t.eleve}</span>
              </div>
            </div>

            {/* Decision */}
            <div style={{
              padding: "14px 16px", margin: "18px 0",
              background: `${accent}0c`, border: `1px solid ${accent}22`,
              borderRadius: 12
            }}>
              <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase",
                color: dark ? "#475569" : "#94a3b8", marginBottom: 6 }}>
                {t.reco}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: dark ? "#f1f5f9" : "#0f172a" }}>
                {result.decision}
              </div>
            </div>

            {/* Proba */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12,
              color: dark ? "#64748b" : "#94a3b8", marginBottom: 24 }}>
              <span>{t.proba}</span>
              <span style={{ color: accent, fontWeight: 700 }}>
                {(result.proba_ml * 100).toFixed(1)}%
              </span>
            </div>

            <div style={{ height: 1, background: dark ? "rgba(255,255,255,.06)" : "#f1f5f9", marginBottom: 20 }} />

            {/* SHAP */}
            <div style={{ fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase",
              color: accent, marginBottom: 16 }}>{t.shap}</div>
            {result.shap.map((f, i) => (
              <ShapRow key={f.label} label={f.label} value={f.value} max={maxShap} delay={i * 80} />
            ))}
            <div style={{ marginTop: 12, display: "flex", gap: 16, fontSize: 11,
              color: dark ? "#475569" : "#94a3b8" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: "#ef4444", display: "inline-block" }} />
                {t.shapUp}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: "#22c55e", display: "inline-block" }} />
                {t.shapDn}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}