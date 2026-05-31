import { useState, useEffect, useRef, useMemo } from "react"

export default function Loader({ active }) {
  const [phase, setPhase] = useState("idle")
  const t1 = useRef(null); const t2 = useRef(null)

  useEffect(() => {
    clearTimeout(t1.current); clearTimeout(t2.current)
    if (active) {
      setPhase("show")
      t1.current = setTimeout(() => setPhase("split"), 300)
      t2.current = setTimeout(() => setPhase("idle"),  1400)
    }
    // Don't reset on active=false — let the timer finish naturally
  }, [active])

  const drips = useMemo(() => Array.from({ length: 8 }, (_, i) => ({
    delay: i * 0.04 + Math.random() * 0.06,
    dx:    (i - 4) * 9 + (Math.random() - 0.5) * 5,
    dur:   0.5 + Math.random() * 0.2,
  })), [])

  if (phase === "idle") return null
  const isSplit = phase === "split"

  return (
    <div style={{
      position: "fixed", inset: 0,
      zIndex: 9999,
      pointerEvents: "none",          // ← KEY: never block clicks on page below
      overflow: "hidden",
    }}>
      {/* Left curtain */}
      <div style={{
        position: "absolute", top: 0, left: 0, bottom: 0, width: "50%",
        background: "#050308",
        transform: isSplit ? "translate3d(-101%,0,0)" : "translate3d(0,0,0)",
        transition: "transform 1s cubic-bezier(0.16,1,0.3,1)",
        willChange: "transform",
      }}/>
      {/* Right curtain */}
      <div style={{
        position: "absolute", top: 0, right: 0, bottom: 0, width: "50%",
        background: "#050308",
        transform: isSplit ? "translate3d(101%,0,0)" : "translate3d(0,0,0)",
        transition: "transform 1s cubic-bezier(0.16,1,0.3,1)",
        willChange: "transform",
      }}/>

      {/* Gold seam */}
      <div style={{
        position: "absolute", top: 0, bottom: 0, left: "50%",
        width: 1, transform: "translateX(-50%)",
        background: "linear-gradient(180deg,transparent,#f4c542 20%,#f4c542 80%,transparent)",
        opacity: isSplit ? 0 : 0.8,
        transition: "opacity .3s ease .6s",
        pointerEvents: "none",
      }}/>

      {/* Center content */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20,
        opacity: isSplit ? 0 : 1,
        transition: "opacity .4s ease",
        pointerEvents: "none",
      }}>
        <div style={{ width: 72, height: 86, position: "relative", filter: "drop-shadow(0 0 20px rgba(244,197,66,0.4))" }}>
          <div style={{ position:"absolute", top:0, left:0, bottom:0, width:"50%", overflow:"hidden" }}>
            <img src="/logo.png" alt="" style={{ position:"absolute", top:0, left:0, width:72, height:86, objectFit:"contain" }}/>
          </div>
          <div style={{ position:"absolute", top:0, right:0, bottom:0, width:"50%", overflow:"hidden" }}>
            <img src="/logo.png" alt="" style={{ position:"absolute", top:0, left:-36, width:72, height:86, objectFit:"contain" }}/>
          </div>
        </div>
        <div style={{ fontFamily:"var(--serif,serif)", fontSize:20, color:"#f5efe0", letterSpacing:".5px" }}>
          STBG <span style={{ color:"#f4c542" }}>Risk</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10, fontFamily:"var(--mono,monospace)", fontSize:9, color:"rgba(244,197,66,0.4)", letterSpacing:"3px" }}>
          <span>CHARGEMENT</span>
          <div style={{ width:60, height:1, background:"rgba(244,197,66,0.15)", overflow:"hidden", position:"relative" }}>
            <div style={{ position:"absolute", inset:0, background:"#f4c542", animation:"ldrBar 1s ease-in-out infinite" }}/>
          </div>
        </div>
      </div>

      {/* Drips */}
      {isSplit && drips.map((d, i) => (
        <div key={i} style={{
          position:"absolute", top:"50%", left:"calc(50% + 0px)",
          width:3, height:7, borderRadius:"50%",
          background:"#f4c542", marginLeft: d.dx,
          animation:`ldrDrip ${d.dur}s ease-in forwards`,
          animationDelay:`${d.delay}s`, opacity:0,
          pointerEvents:"none",
        }}/>
      ))}

      <style>{`
        @keyframes ldrBar{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
        @keyframes ldrDrip{0%{opacity:1;transform:translateY(-50%) scale(1)}100%{opacity:0;transform:translateY(calc(-50% + 60vh)) scale(.3)}}
      `}</style>
    </div>
  )
}