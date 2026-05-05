import { useEffect, useRef } from "react"

export default function Aurora({ dark, riskLevel }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    let W = canvas.width = window.innerWidth
    let H = canvas.height = window.innerHeight
    let animId, t = 0

    const resize = () => {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
    }
    window.addEventListener("resize", resize)

    const getWaves = () => {
      const b = dark ? 0.055 : 0.028
      if (riskLevel === "ÉLEVÉ" || riskLevel === "HIGH") return [
        { y:.40, amp:110, freq:.006, speed:.38, col:[239,68,68],  a:b+.09 },
        { y:.56, amp:85,  freq:.008, speed:.24, col:[220,38,38],  a:b+.07 },
        { y:.68, amp:65,  freq:.005, speed:.32, col:[153,27,27],  a:b+.05 },
        { y:.28, amp:55,  freq:.009, speed:.19, col:[251,191,36], a:b+.04 },
      ]
      if (riskLevel === "MODÉRÉ" || riskLevel === "MODERATE") return [
        { y:.40, amp:110, freq:.006, speed:.38, col:[245,158,11], a:b+.09 },
        { y:.56, amp:85,  freq:.008, speed:.24, col:[217,119,6],  a:b+.07 },
        { y:.68, amp:65,  freq:.005, speed:.32, col:[30,64,175],  a:b+.05 },
        { y:.28, amp:55,  freq:.009, speed:.19, col:[251,191,36], a:b+.04 },
      ]
      if (riskLevel === "FAIBLE" || riskLevel === "LOW") return [
        { y:.40, amp:110, freq:.006, speed:.38, col:[34,197,94],  a:b+.09 },
        { y:.56, amp:85,  freq:.008, speed:.24, col:[21,128,61],  a:b+.07 },
        { y:.68, amp:65,  freq:.005, speed:.32, col:[29,78,216],  a:b+.05 },
        { y:.28, amp:55,  freq:.009, speed:.19, col:[52,211,153], a:b+.04 },
      ]
      return [
        { y:.40, amp:110, freq:.006, speed:.38, col:[99,102,241], a:b+.10 },
        { y:.56, amp:85,  freq:.008, speed:.24, col:[59,130,246], a:b+.08 },
        { y:.68, amp:65,  freq:.005, speed:.32, col:[139,92,246], a:b+.06 },
        { y:.28, amp:55,  freq:.009, speed:.19, col:[14,165,233], a:b+.05 },
      ]
    }

    const draw = () => {
      animId = requestAnimationFrame(draw)
      t += .007

      ctx.fillStyle = dark ? "rgba(2,8,23,0.20)" : "rgba(240,244,255,0.20)"
      ctx.fillRect(0, 0, W, H)

      const waves = getWaves()

      waves.forEach(({ y, amp, freq, speed, col, a }) => {
        ctx.beginPath()
        ctx.moveTo(0, H)
        for (let x = 0; x <= W; x += 3) {
          const wy = H * y
            + Math.sin(x * freq + t * speed) * amp
            + Math.sin(x * freq * .6 + t * speed * 1.4) * amp * .45
            + Math.sin(x * freq * 1.3 + t * speed * .7) * amp * .25
          ctx.lineTo(x, wy)
        }
        ctx.lineTo(W, H)
        ctx.closePath()

        const grd = ctx.createLinearGradient(0, H * y - amp * 1.2, 0, H * y + amp * 2.5)
        grd.addColorStop(0,   `rgba(${col[0]},${col[1]},${col[2]},${a * 1.6})`)
        grd.addColorStop(0.4, `rgba(${col[0]},${col[1]},${col[2]},${a})`)
        grd.addColorStop(1,   `rgba(${col[0]},${col[1]},${col[2]},0)`)
        ctx.fillStyle = grd
        ctx.fill()
      })

      // Floating radial glows
      for (let i = 0; i < 4; i++) {
        const w = waves[i]
        const ox = W * (.12 + i * .22) + Math.sin(t * .25 + i * 1.1) * 70
        const oy = H * (.32 + Math.sin(t * .18 + i * .9) * .14)
        const r  = 90 + i * 35
        const grd = ctx.createRadialGradient(ox, oy, 0, ox, oy, r)
        grd.addColorStop(0, `rgba(${w.col[0]},${w.col[1]},${w.col[2]},${w.a * .7})`)
        grd.addColorStop(1, `rgba(${w.col[0]},${w.col[1]},${w.col[2]},0)`)
        ctx.beginPath()
        ctx.arc(ox, oy, r, 0, Math.PI * 2)
        ctx.fillStyle = grd
        ctx.fill()
      }
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener("resize", resize)
    }
  }, [dark, riskLevel])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: dark ? "#020817" : "#f0f4ff",
        transition: "background 0.5s"
      }}
    />
  )
}