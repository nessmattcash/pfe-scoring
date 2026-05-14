import { useEffect, useRef } from "react"

export default function Aurora({ riskLevel }) {
  const scrollYRef = useRef(0)
  const rafRef = useRef(null)
  const wave1Ref = useRef(null)
  const wave2Ref = useRef(null)
  const wave3Ref = useRef(null)

  const col1 = riskLevel==="ÉLEVÉ"||riskLevel==="HIGH" ? "var(--red)"
    : riskLevel==="MODÉRÉ"||riskLevel==="MODERATE" ? "var(--amber)"
    : riskLevel==="FAIBLE"||riskLevel==="LOW" ? "var(--green)"
    : "var(--burgundy)"

  useEffect(() => {
    let targetY = 0
    let currentY = 0

    const onScroll = () => { targetY = window.scrollY }
    window.addEventListener("scroll", onScroll, { passive: true })

    const tick = () => {
      // Lerp for buttery smooth movement
      currentY += (targetY - currentY) * 0.06
      scrollYRef.current = currentY

      if (wave1Ref.current) wave1Ref.current.style.top = `${600 - currentY * 0.15}px`
      if (wave2Ref.current) wave2Ref.current.style.top = `${1400 - currentY * 0.25}px`
      if (wave3Ref.current) wave3Ref.current.style.top = `${2200 - currentY * 0.18}px`

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  useEffect(() => {
    if (wave1Ref.current) wave1Ref.current.style.setProperty("--col", col1)
  }, [col1])

  return (
    <div className="bg-scene">
      <div className="bg-wave" ref={wave1Ref} style={{ top: "600px", "--col": col1 }}/>
      <div className="bg-wave" ref={wave2Ref} style={{ top: "1400px", "--col": "var(--royal)" }}/>
      <div className="bg-wave" ref={wave3Ref} style={{ top: "2200px", "--col": "var(--gold-deep)" }}/>
      <div className="bg-grain"/>
    </div>
  )
}