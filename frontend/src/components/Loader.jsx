import { useState, useEffect, useMemo } from "react"

export default function Loader({ active }) {
  const [phase, setPhase] = useState("idle")

  useEffect(() => {
    let t1, t2
    if (active) {
      setPhase("show")
      t1 = setTimeout(() => setPhase("split"), 600)
      t2 = setTimeout(() => setPhase("idle"), 2900)
    } else {
      setPhase("idle")
    }
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [active])

  const drips = useMemo(() => Array.from({ length: 8 }, (_, i) => ({
    delay: i * 0.04 + Math.random() * 0.07,
    dx: (i - 4) * 8 + (Math.random() - 0.5) * 5,
    dur: 0.5 + Math.random() * 0.22,
  })), [])

  if (phase === "idle") return null

  const isSplit = phase === "split"

  return (
    <div className={`page-loader show${isSplit ? " split" : ""}`}>
      <div className="loader-half-left"/>
      <div className="loader-half-right"/>
      <div className="loader-seam"/>

      <div className="loader-shield-wrap">
        {/* Real STBG logo — split into two halves */}
        <div className="loader-shield">
          <div className="loader-shield-half left">
            <img
              src="/logo.png"
              alt=""
              style={{
                position: "absolute", top: 0, left: 0,
                width: 84, height: 100, objectFit: "contain",
                objectPosition: "left center",
                filter: "drop-shadow(0 0 12px rgba(244,197,66,0.5))"
              }}
            />
          </div>
          <div className="loader-shield-half right">
            <img
              src="/logo.png"
              alt=""
              style={{
                position: "absolute", top: 0, left: -42,
                width: 84, height: 100, objectFit: "contain",
                objectPosition: "left center",
                filter: "drop-shadow(0 0 12px rgba(244,197,66,0.5))"
              }}
            />
          </div>
        </div>

        <div className="loader-wordmark">STBG <span>Risk</span></div>

        <div className="loader-status">
          <span>Chargement</span>
          <span className="bar"/>
        </div>
      </div>

      {isSplit && drips.map((d, i) => (
        <div key={i} className="loader-drip" style={{
          animationDelay: `${d.delay}s`,
          animationDuration: `${d.dur}s`,
          marginLeft: `${d.dx}px`,
        }}/>
      ))}
    </div>
  )
}