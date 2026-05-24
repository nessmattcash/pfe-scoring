import { useState, useEffect, useRef, useMemo } from "react"

export default function Loader({ active }) {
  const [phase, setPhase] = useState("idle")
  const timers = useRef([])

  useEffect(() => {
    // Clear any previous timers
    timers.current.forEach(clearTimeout)
    timers.current = []

    if (active) {
      setPhase("show")
      timers.current.push(setTimeout(() => setPhase("split"), 700))
      timers.current.push(setTimeout(() => setPhase("idle"),  1400))
    }
    // When active goes false mid-animation, don't interrupt — let timer finish
  }, [active])

  const drips = useMemo(() => Array.from({ length: 10 }, (_, i) => ({
    delay: i * 0.05 + Math.random() * 0.08,
    dx:    (i - 5) * 9 + (Math.random() - 0.5) * 6,
    dur:   0.6 + Math.random() * 0.25,
  })), [])

  if (phase === "idle") return null
  const isSplit = phase === "split"

  return (
    <div style={{
      position: "fixed", inset: 0,
      zIndex: 9999,                          // above everything
      background: "var(--bg-deep, #050308)",
      display: "flex", alignItems: "center", justifyContent: "center",
      opacity: 1, pointerEvents: "auto",
    }}>
      {/* Left half */}
      <div style={{
        position: "absolute", top: 0, left: 0, bottom: 0, width: "50%",
        background: "var(--bg-deep, #050308)",
        borderRight: "1px solid rgba(244,197,66,0.15)",
        transform: isSplit ? "translate3d(-100%,0,0)" : "translate3d(0,0,0)",
        transition: "transform 1.1s cubic-bezier(0.16,1,0.3,1)",
        zIndex: 2,
      }}/>

      {/* Right half */}
      <div style={{
        position: "absolute", top: 0, right: 0, bottom: 0, width: "50%",
        background: "var(--bg-deep, #050308)",
        transform: isSplit ? "translate3d(100%,0,0)" : "translate3d(0,0,0)",
        transition: "transform 1.1s cubic-bezier(0.16,1,0.3,1)",
        zIndex: 2,
      }}/>

      {/* Gold seam */}
      <div style={{
        position: "absolute", top: 0, bottom: 0, left: "50%",
        width: 1, zIndex: 5, transform: "translateX(-50%)",
        background: "linear-gradient(180deg,transparent,var(--gold,#f4c542),var(--gold,#f4c542),transparent)",
        opacity: isSplit ? 0 : 1,
        transition: "opacity .4s ease .8s",
      }}>
        <div style={{
          position: "absolute", left: "50%", top: "50%",
          width: 80, height: 200,
          transform: "translate(-50%,-50%)",
          background: "radial-gradient(ellipse at center,rgba(244,197,66,0.3),transparent 70%)",
          filter: "blur(20px)",
          animation: "seamPulse 1.6s ease-in-out infinite",
        }}/>
      </div>

      {/* Logo + wordmark */}
      <div style={{
        position: "relative", zIndex: 6,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 22,
        opacity: isSplit ? 0 : 1,
        transform: isSplit ? "scale(1.3)" : "scale(1)",
        transition: "opacity .5s ease, transform .9s cubic-bezier(0.16,1,0.3,1)",
      }}>
        {/* Shield split logo */}
        <div style={{ width: 84, height: 100, position: "relative", filter: "drop-shadow(0 0 24px rgba(244,197,66,0.45))" }}>
          <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: "50%", overflow: "hidden",
            animation: "shieldHalfLeft 1.8s cubic-bezier(0.16,1,0.3,1) infinite" }}>
            <img src="/logo.png" alt="" style={{ position: "absolute", top: 0, left: 0, width: 84, height: 100, objectFit: "contain" }}/>
          </div>
          <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "50%", overflow: "hidden",
            animation: "shieldHalfRight 1.8s cubic-bezier(0.16,1,0.3,1) infinite" }}>
            <img src="/logo.png" alt="" style={{ position: "absolute", top: 0, left: -42, width: 84, height: 100, objectFit: "contain" }}/>
          </div>
        </div>

        <div style={{ fontFamily: "var(--serif,serif)", fontSize: 22, letterSpacing: ".5px", color: "var(--ink,#f5efe0)" }}>
          STBG <span style={{ color: "var(--gold,#f4c542)" }}>Risk</span>
        </div>

        <div style={{ fontFamily: "var(--mono,monospace)", fontSize: 10, color: "var(--ink-mute,#7a6f5a)",
          letterSpacing: "4px", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 10 }}>
          <span>Chargement</span>
          <div style={{ width: 80, height: 1, background: "rgba(244,197,66,0.15)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "var(--gold,#f4c542)",
              animation: "loaderBar 1.2s ease-in-out infinite" }}/>
          </div>
        </div>
      </div>

      {/* Drips on split */}
      {isSplit && drips.map((d, i) => (
        <div key={i} style={{
          position: "absolute", top: "50%", left: "50%",
          width: 4, height: 8,
          background: "var(--gold,#f4c542)", borderRadius: "50%",
          filter: "blur(0.3px)", pointerEvents: "none", zIndex: 4,
          marginLeft: d.dx,
          animation: `dripFall ${d.dur}s ease-in forwards`,
          animationDelay: `${d.delay}s`,
          opacity: 0,
        }}/>
      ))}

      <style>{`
        @keyframes seamPulse {
          0%,100%{opacity:.6;transform:translate(-50%,-50%) scale(1)}
          50%{opacity:1;transform:translate(-50%,-50%) scale(1.2)}
        }
        @keyframes shieldHalfLeft {
          0%,60%,100%{transform:translateX(0)}
          30%{transform:translateX(-6px)}
        }
        @keyframes shieldHalfRight {
          0%,60%,100%{transform:translateX(0)}
          30%{transform:translateX(6px)}
        }
        @keyframes loaderBar {
          0%{transform:translateX(-100%)}
          100%{transform:translateX(100%)}
        }
        @keyframes dripFall {
          0%{opacity:1;transform:translate(-50%,-50%) translateY(0) scale(1)}
          100%{opacity:0;transform:translate(-50%,-50%) translateY(100vh) scale(0.4)}
        }
      `}</style>
    </div>
  )
}