import { useEffect, useRef } from "react"

// ── Animated soda can SVG overlay ────────────────────────────────────────────
function SodaCan({ style }) {
  return (
    <svg viewBox="0 0 80 160" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      {/* Can body */}
      <ellipse cx="40" cy="18" rx="28" ry="8" fill="url(#topGrad)"/>
      <rect x="12" y="18" width="56" height="124" fill="url(#bodyGrad)"/>
      <ellipse cx="40" cy="142" rx="28" ry="8" fill="url(#bottomGrad)"/>
      {/* Highlight stripe */}
      <rect x="18" y="18" width="8" height="124" fill="rgba(255,255,255,0.12)" rx="4"/>
      {/* STBG label area */}
      <rect x="12" y="48" width="56" height="64" fill="rgba(201,168,76,0.08)" rx="2"/>
      {/* Red band top */}
      <rect x="12" y="48" width="56" height="12" fill="rgba(220,38,38,0.5)"/>
      {/* Gold band */}
      <rect x="12" y="60" width="56" height="4" fill="rgba(201,168,76,0.8)"/>
      {/* STBG text sim */}
      <rect x="22" y="70" width="36" height="6" fill="rgba(201,168,76,0.6)" rx="3"/>
      <rect x="28" y="82" width="24" height="4" fill="rgba(255,255,255,0.2)" rx="2"/>
      <rect x="24" y="92" width="32" height="3" fill="rgba(255,255,255,0.15)" rx="1.5"/>
      {/* Red band bottom */}
      <rect x="12" y="100" width="56" height="12" fill="rgba(220,38,38,0.4)"/>
      {/* Tab */}
      <ellipse cx="40" cy="14" rx="8" ry="3" fill="rgba(201,168,76,0.7)"/>
      <rect x="38" y="8" width="4" height="10" fill="rgba(201,168,76,0.9)" rx="2"/>
      {/* Bubbles inside */}
      <circle cx="30" cy="75" r="2" fill="rgba(255,255,255,0.15)"/>
      <circle cx="50" cy="85" r="1.5" fill="rgba(255,255,255,0.12)"/>
      <circle cx="38" cy="95" r="1" fill="rgba(255,255,255,0.1)"/>
      <defs>
        <linearGradient id="topGrad" x1="12" y1="10" x2="68" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#c9a84c"/>
          <stop offset="1" stopColor="#7c6428"/>
        </linearGradient>
        <linearGradient id="bodyGrad" x1="12" y1="0" x2="68" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1a1a2e"/>
          <stop offset="0.3" stopColor="#2d2d4a"/>
          <stop offset="0.7" stopColor="#1a1a2e"/>
          <stop offset="1" stopColor="#0d0d1a"/>
        </linearGradient>
        <linearGradient id="bottomGrad" x1="12" y1="134" x2="68" y2="150" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7c6428"/>
          <stop offset="1" stopColor="#3d3214"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

// ── Floating bubble ───────────────────────────────────────────────────────────
function Bubbles() {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:1, pointerEvents:"none", overflow:"hidden" }}>
      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
          10%  { opacity: 0.6; }
          90%  { opacity: 0.3; }
          100% { transform: translateY(-100vh) translateX(20px) scale(0.5); opacity: 0; }
        }
        @keyframes floatCan1 {
          0%   { transform: translateY(0px) rotate(-8deg); }
          50%  { transform: translateY(-30px) rotate(-4deg); }
          100% { transform: translateY(0px) rotate(-8deg); }
        }
        @keyframes floatCan2 {
          0%   { transform: translateY(0px) rotate(6deg); }
          50%  { transform: translateY(-20px) rotate(10deg); }
          100% { transform: translateY(0px) rotate(6deg); }
        }
        @keyframes floatCan3 {
          0%   { transform: translateY(0px) rotate(-12deg) scale(0.7); }
          50%  { transform: translateY(-25px) rotate(-8deg) scale(0.7); }
          100% { transform: translateY(0px) rotate(-12deg) scale(0.7); }
        }
      `}</style>

      {/* Floating soda cans */}
      <div style={{ position:"absolute", right:"8%", top:"15%", animation:"floatCan1 6s ease-in-out infinite", opacity:.18 }}>
        <SodaCan style={{ width:70, height:140, filter:"drop-shadow(0 0 20px rgba(201,168,76,0.4))" }}/>
      </div>
      <div style={{ position:"absolute", left:"4%", top:"40%", animation:"floatCan2 8s ease-in-out infinite", opacity:.12 }}>
        <SodaCan style={{ width:55, height:110, filter:"drop-shadow(0 0 15px rgba(220,38,38,0.3))" }}/>
      </div>
      <div style={{ position:"absolute", right:"3%", bottom:"20%", animation:"floatCan3 7s ease-in-out infinite 1s", opacity:.1 }}>
        <SodaCan style={{ width:90, height:180 }}/>
      </div>

      {/* Bubbles */}
      {[
        { left:"15%", delay:"0s",  dur:"8s",  size:6 },
        { left:"28%", delay:"1.5s",dur:"10s", size:4 },
        { left:"42%", delay:"3s",  dur:"7s",  size:8 },
        { left:"58%", delay:"0.5s",dur:"9s",  size:5 },
        { left:"71%", delay:"2s",  dur:"11s", size:3 },
        { left:"85%", delay:"4s",  dur:"8s",  size:6 },
        { left:"8%",  delay:"2.5s",dur:"12s", size:4 },
        { left:"93%", delay:"1s",  dur:"9s",  size:5 },
      ].map((b,i) => (
        <div key={i} style={{
          position:"absolute", bottom:"-20px", left:b.left,
          width:b.size, height:b.size, borderRadius:"50%",
          background:`rgba(201,168,76,0.4)`,
          border:"1px solid rgba(201,168,76,0.6)",
          animation:`floatUp ${b.dur} ease-in infinite ${b.delay}`,
          boxShadow:`0 0 ${b.size*2}px rgba(201,168,76,0.3)`
        }}/>
      ))}
    </div>
  )
}

// ── Canvas background ─────────────────────────────────────────────────────────
export default function Aurora({ riskLevel }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    let W = canvas.width = window.innerWidth
    let H = canvas.height = window.innerHeight
    let animId, t = 0

    const getPal = () => {
      if (riskLevel === "ÉLEVÉ"  || riskLevel === "HIGH")     return [[220,38,38],[239,68,68],[201,168,76],[153,27,27]]
      if (riskLevel === "MODÉRÉ" || riskLevel === "MODERATE") return [[245,158,11],[251,191,36],[220,38,38],[201,168,76]]
      if (riskLevel === "FAIBLE" || riskLevel === "LOW")      return [[34,197,94],[21,128,61],[201,168,76],[59,130,246]]
      return [[201,168,76],[220,38,38],[99,102,241],[139,92,246]]
    }

    const N = 120
    const pts = Array.from({length:N}, () => ({
      x:Math.random()*W, y:Math.random()*H,
      vx:(Math.random()-.5)*.2, vy:(Math.random()-.5)*.2,
      r:.5+Math.random()*1.8,
      alpha:.08+Math.random()*.35,
      pulse:Math.random()*Math.PI*2,
      conn: Math.random()>.55
    }))

    const ORBS = [
      {xp:.05,yp:.12,r:320},{xp:.88,yp:.5,r:380},
      {xp:.45,yp:.88,r:260},{xp:.78,yp:.06,r:210},
      {xp:.22,yp:.58,r:240},
    ]

    const resize = () => {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
    }
    window.addEventListener("resize", resize)

    const draw = () => {
      animId = requestAnimationFrame(draw)
      t += .004
      const pal = getPal()

      ctx.fillStyle = "rgba(4,4,12,0.14)"
      ctx.fillRect(0,0,W,H)

      // Orbs
      ORBS.forEach((o,i) => {
        const col = pal[i%4]
        const ox = W*o.xp + Math.sin(t*.12+i*1.5)*100
        const oy = H*o.yp + Math.cos(t*.1+i*.8)*60
        const r  = o.r*(1+Math.sin(t*.45+i)*.1)
        const a  = .06+Math.sin(t*.3+i)*.02
        const g  = ctx.createRadialGradient(ox,oy,0,ox,oy,r)
        g.addColorStop(0, `rgba(${col},${a*2.5})`)
        g.addColorStop(.4,`rgba(${col},${a})`)
        g.addColorStop(1, `rgba(${col},0)`)
        ctx.beginPath(); ctx.arc(ox,oy,r,0,Math.PI*2)
        ctx.fillStyle=g; ctx.fill()
      })

      // Waves
      ;[
        {y:.38,amp:100,freq:.005,sp:.24,ci:0,a:.07},
        {y:.54,amp:78, freq:.007,sp:.18,ci:1,a:.055},
        {y:.68,amp:60, freq:.004,sp:.22,ci:2,a:.04},
        {y:.26,amp:50, freq:.009,sp:.15,ci:3,a:.03},
      ].forEach(({y,amp,freq,sp,ci,a}) => {
        const col=pal[ci]
        ctx.beginPath(); ctx.moveTo(0,H)
        for(let x=0;x<=W;x+=3){
          const wy=H*y+Math.sin(x*freq+t*sp)*amp+Math.sin(x*freq*.55+t*sp*1.5)*amp*.38+Math.sin(x*freq*1.4+t*sp*.6)*amp*.18
          ctx.lineTo(x,wy)
        }
        ctx.lineTo(W,H); ctx.closePath()
        const g=ctx.createLinearGradient(0,H*y-amp,0,H*y+amp*3)
        g.addColorStop(0, `rgba(${col},${a*1.8})`); g.addColorStop(.5,`rgba(${col},${a})`); g.addColorStop(1,`rgba(${col},0)`)
        ctx.fillStyle=g; ctx.fill()
      })

      // Particles
      const c0=pal[0],c1=pal[1]
      pts.forEach(p=>{
        p.x+=p.vx; p.y+=p.vy; p.pulse+=.015
        if(p.x<0)p.x=W; if(p.x>W)p.x=0; if(p.y<0)p.y=H; if(p.y>H)p.y=0
        const a=p.alpha*(.4+Math.sin(p.pulse)*.6)
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2)
        ctx.fillStyle=`rgba(${Math.random()>.7?c1:c0},${a})`; ctx.fill()
      })

      // Connections
      for(let i=0;i<N;i++){ if(!pts[i].conn) continue
        for(let j=i+1;j<N;j++){ if(!pts[j].conn) continue
          const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y,d=Math.sqrt(dx*dx+dy*dy)
          if(d<100){ ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);ctx.strokeStyle=`rgba(${c0},${(1-d/100)*.06})`;ctx.lineWidth=.5;ctx.stroke() }
        }
      }

      // Scan line
      const sy=(t*50)%H
      const sg=ctx.createLinearGradient(0,sy-20,0,sy+20)
      sg.addColorStop(0,"rgba(201,168,76,0)"); sg.addColorStop(.5,"rgba(201,168,76,0.014)"); sg.addColorStop(1,"rgba(201,168,76,0)")
      ctx.fillStyle=sg; ctx.fillRect(0,sy-20,W,40)
    }
    draw()
    return ()=>{ cancelAnimationFrame(animId); window.removeEventListener("resize",resize) }
  }, [riskLevel])

  return (
    <>
      <canvas ref={canvasRef} style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",background:"#04040c"}}/>
      <Bubbles/>
    </>
  )
}