import { useApp } from "../AppContext"

export default function Footer({ setPage }) {
  const { t } = useApp()
  const year = new Date().getFullYear()

  return (
    <footer style={{
      width:"100%", position:"relative", zIndex:10,
      background:"rgba(4,4,12,0.97)",
      borderTop:"1px solid rgba(201,168,76,0.12)",
    }}>
      {/* Gold top accent */}
      <div style={{height:1,background:"linear-gradient(90deg,transparent,rgba(201,168,76,0.4),rgba(220,38,38,0.3),transparent)"}}/>

      <div style={{width:"100%",padding:"44px 48px 28px"}}>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:48,marginBottom:40}}>

          {/* Brand */}
          <div>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
              <img src="/logo.png" alt="STBG" style={{height:32}}/>
              <div>
                <div style={{fontSize:16,fontWeight:900,letterSpacing:"-.02em"}}>
                  <span style={{color:"#f1f5f9"}}>STBG </span>
                  <span style={{background:"linear-gradient(90deg,#c9a84c,#ef4444)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Risk</span>
                </div>
                <div style={{fontSize:8,color:"rgba(201,168,76,0.35)",letterSpacing:".16em",textTransform:"uppercase"}}>Intelligence Platform</div>
              </div>
            </div>
            <p style={{fontSize:12,color:"rgba(255,255,255,0.25)",lineHeight:1.7,maxWidth:260}}>
              Système de scoring crédit basé sur le Machine Learning. Développé dans le cadre d'un PFE à la STBG Mégrine.
            </p>
            <div style={{display:"flex",gap:10,marginTop:20}}>
              {[
                {label:"XGBoost",color:"#c9a84c"},
                {label:"FastAPI", color:"#22c55e"},
                {label:"React",   color:"#3b82f6"},
              ].map(({label,color})=>(
                <span key={label} style={{
                  fontSize:9,fontWeight:700,padding:"3px 10px",borderRadius:99,
                  background:`${color}12`,border:`1px solid ${color}25`,color,
                  letterSpacing:".06em"
                }}>{label}</span>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <div style={{fontSize:10,fontWeight:700,color:"rgba(201,168,76,0.5)",letterSpacing:".14em",textTransform:"uppercase",marginBottom:16}}>Navigation</div>
            {[
              {label:"Accueil",   key:"scoring"},
              {label:"Scoring",   key:"scoring"},
              {label:"Masse",     key:"masse"},
              {label:"Dashboard", key:"dashboard"},
            ].map(({label,key})=>(
              <button key={label} onClick={()=>setPage(key)} style={{
                display:"block",border:"none",background:"transparent",
                cursor:"pointer",fontFamily:"inherit",
                fontSize:13,color:"rgba(255,255,255,0.3)",
                padding:"5px 0",textAlign:"left",
                transition:"color .2s",width:"100%"
              }}
                onMouseEnter={e=>e.target.style.color="#c9a84c"}
                onMouseLeave={e=>e.target.style.color="rgba(255,255,255,0.3)"}
              >{label}</button>
            ))}
          </div>

          {/* Compte */}
          <div>
            <div style={{fontSize:10,fontWeight:700,color:"rgba(201,168,76,0.5)",letterSpacing:".14em",textTransform:"uppercase",marginBottom:16}}>Compte</div>
            {["Connexion","Mon profil","Paramètres","Support"].map(label=>(
              <button key={label} style={{
                display:"block",border:"none",background:"transparent",
                cursor:"pointer",fontFamily:"inherit",
                fontSize:13,color:"rgba(255,255,255,0.3)",
                padding:"5px 0",textAlign:"left",
                transition:"color .2s",width:"100%"
              }}
                onMouseEnter={e=>e.target.style.color="#c9a84c"}
                onMouseLeave={e=>e.target.style.color="rgba(255,255,255,0.3)"}
              >{label}</button>
            ))}
          </div>

          {/* À propos */}
          <div>
            <div style={{fontSize:10,fontWeight:700,color:"rgba(201,168,76,0.5)",letterSpacing:".14em",textTransform:"uppercase",marginBottom:16}}>À propos</div>
            {["À propos","Documentation","Contact","PFE 2026"].map(label=>(
              <button key={label} style={{
                display:"block",border:"none",background:"transparent",
                cursor:"pointer",fontFamily:"inherit",
                fontSize:13,color:"rgba(255,255,255,0.3)",
                padding:"5px 0",textAlign:"left",
                transition:"color .2s",width:"100%"
              }}
                onMouseEnter={e=>e.target.style.color="#c9a84c"}
                onMouseLeave={e=>e.target.style.color="rgba(255,255,255,0.3)"}
              >{label}</button>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop:"1px solid rgba(255,255,255,0.05)",
          paddingTop:20,
          display:"flex",alignItems:"center",justifyContent:"space-between"
        }}>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.18)"}}>
            © {year} Société Tunisienne des Boissons Gazeuses · Tous droits réservés
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:4,height:4,borderRadius:"50%",background:"rgba(201,168,76,0.4)"}}/>
            <span style={{fontSize:10,color:"rgba(201,168,76,0.3)",letterSpacing:".1em",textTransform:"uppercase"}}>
              Khlifi Ayoub · PFE 2026
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
} 