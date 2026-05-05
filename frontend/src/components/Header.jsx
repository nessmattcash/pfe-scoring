import { useApp } from "../AppContext"

export default function Header({ page, setPage }) {
  const { dark, setDark, lang, setLang, t } = useApp()

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 200, width: "100%",
      background: dark ? "rgba(2,8,23,0.90)" : "rgba(255,255,255,0.90)",
      backdropFilter: "blur(28px)",
      borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.055)" : "rgba(0,0,0,0.07)"}`,
      transition: "background 0.5s, border-color 0.5s"
    }}>
      <div style={{ width: "100%", padding: "0 40px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>


        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/logo.png" alt="STBG" style={{ height: 34 }} />
          <div style={{ width: 1, height: 26, background: dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }} />
          <div>
            <div style={{
              fontSize: 14, fontWeight: 700, letterSpacing: "-.02em",
              color: dark ? "#f1f5f9" : "#0f172a"
            }}>
              STBG <span style={{ color: "#3b82f6" }}>Risk</span>
            </div>
            <div style={{
              fontSize: 9, color: dark ? "#475569" : "#94a3b8",
              letterSpacing: ".03em"
            }}>
              {t.hSub}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display: "flex", gap: 4 }}>
          {[
            { key: "scoring",    label: t.nav.scoring },
            { key: "masse",      label: t.nav.masse },
            { key: "dashboard",  label: t.nav.dashboard },
          ].map(({ key, label }) => {
            const active = page === key
            return (
              <button key={key} onClick={() => setPage(key)} style={{
                border: "none", cursor: "pointer",
                fontFamily: "inherit", fontWeight: active ? 600 : 400,
                fontSize: 13, padding: "6px 16px", borderRadius: 8,
                background: active
                  ? (dark ? "rgba(59,130,246,0.14)" : "rgba(59,130,246,0.09)")
                  : "transparent",
                color: active ? "#3b82f6" : (dark ? "#64748b" : "#94a3b8"),
                transition: "all 0.2s"
              }}>{label}</button>
            )
          })}
        </nav>

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => setLang(l => l === "fr" ? "en" : "fr")}
            style={{
              border: `1px solid ${dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
              borderRadius: 8, padding: "5px 12px", cursor: "pointer",
              background: "transparent", fontSize: 11, fontWeight: 700,
              color: dark ? "#64748b" : "#94a3b8",
              transition: "all 0.2s", letterSpacing: ".04em"
            }}>
            {lang === "fr" ? "EN" : "FR"}
          </button>

          <button
            onClick={() => setDark(d => !d)}
            style={{
              border: `1px solid ${dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
              borderRadius: 8, padding: "5px 10px", cursor: "pointer",
              background: "transparent", fontSize: 15,
              transition: "all 0.2s", lineHeight: 1
            }}>
            {dark ? "☀️" : "🌙"}
          </button>
        </div>
      </div>
    </header>
  )
}