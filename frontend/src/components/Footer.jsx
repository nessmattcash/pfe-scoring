import { useApp } from "../AppContext"

export default function Footer({ setPage }) {
  const { dark, t } = useApp()
  const year = new Date().getFullYear()

  return (
    <footer style={{
      position: "relative", zIndex: 10, width: "100%",
      borderTop: `1px solid ${dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"}`,
      background: dark ? "rgba(2,8,23,0.92)" : "rgba(255,255,255,0.92)",
      backdropFilter: "blur(20px)",
      padding: "28px 32px",
      transition: "background 0.5s"
    }}>
      <div style={{
        maxWidth: 1100, margin: "0 auto", width: "100%",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 32
      }}>

        {/* Left — Logo + company */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/logo.png" alt="STBG" style={{ height: 28, opacity: .7 }} />
          <div>
            <div style={{
              fontSize: 13, fontWeight: 600,
              color: dark ? "#94a3b8" : "#64748b"
            }}>
              Société Tunisienne des Boissons Gazeuses
            </div>
            <div style={{
              fontSize: 11, marginTop: 2,
              color: dark ? "#475569" : "#94a3b8"
            }}>
              © {year} · {t.fCopy}
            </div>
          </div>
        </div>

        {/* Center — Links */}
        <nav style={{ display: "flex", gap: 28 }}>
          {[
            { label: t.fLinks.home,    key: "scoring" },
            { label: t.fLinks.scoring, key: "scoring" },
            { label: t.fLinks.contact, key: null },
          ].map(({ label, key }) => (
            <button key={label}
              onClick={() => key && setPage(key)}
              style={{
                border: "none", background: "transparent",
                cursor: key ? "pointer" : "default",
                fontSize: 13, fontFamily: "inherit",
                color: dark ? "#475569" : "#94a3b8",
                transition: "color 0.2s",
                padding: 0
              }}
              onMouseEnter={e => { if (key) e.target.style.color = "#3b82f6" }}
              onMouseLeave={e => { e.target.style.color = dark ? "#475569" : "#94a3b8" }}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Right — PFE badge */}
        <div style={{
          fontSize: 11, color: dark ? "#334155" : "#cbd5e1",
          textAlign: "right"
        }}>
          PFE 2026
        </div>
      </div>
    </footer>
  )
}