// run.jsx — Live run tracking screen (map placeholder, future feature)
const { useState: useSr, useEffect: useEr } = React;

function LiveRun({ go }) {
  const [running, setRunning] = useSr(false);
  const [t, setT] = useSr(1428); // 23:48
  const [km, setKm] = useSr(4.27);

  useEr(() => {
    if (!running) return;
    const id = setInterval(() => {
      setT(x => x + 1);
      setKm(x => +(x + 0.005).toFixed(2));
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const pace = `${Math.floor((t/60)/km)}'${String(Math.round((((t/60)/km)%1)*60)).padStart(2,'0')}"`;

  return (
    <div className="scroll" style={{paddingTop:54,paddingBottom:0}}>
      {/* Map placeholder */}
      <div style={{position:'relative',height:360,margin:'0',overflow:'hidden',
        background:'#0d0f1a'}}>
        {/* Stylized map */}
        <svg width="100%" height="100%" viewBox="0 0 390 360" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
            </pattern>
            <linearGradient id="route-grad" x1="0" x2="1">
              <stop offset="0%" stopColor="#FFB347"/>
              <stop offset="50%" stopColor="#FF6B2B"/>
              <stop offset="100%" stopColor="#FF2E63"/>
            </linearGradient>
          </defs>
          <rect width="390" height="360" fill="url(#grid)"/>
          {/* "buildings" / blocks */}
          <g opacity="0.2">
            <rect x="20" y="40" width="60" height="50" rx="3" fill="#7C3AED"/>
            <rect x="100" y="20" width="80" height="40" rx="3" fill="#5EA0FF"/>
            <rect x="220" y="60" width="50" height="80" rx="3" fill="#22D39E"/>
            <rect x="290" y="30" width="80" height="50" rx="3" fill="#FF6B2B"/>
            <rect x="40" y="160" width="100" height="60" rx="3" fill="#FF2E63"/>
            <rect x="180" y="200" width="70" height="50" rx="3" fill="#7C3AED"/>
            <rect x="280" y="180" width="90" height="80" rx="3" fill="#22D39E"/>
            <rect x="60" y="280" width="80" height="60" rx="3" fill="#5EA0FF"/>
          </g>
          {/* roads */}
          <g stroke="rgba(255,255,255,0.06)" strokeWidth="2" fill="none">
            <path d="M0 110 L390 110"/>
            <path d="M0 250 L390 250"/>
            <path d="M150 0 L150 360"/>
            <path d="M270 0 L270 360"/>
          </g>
          {/* Route */}
          <path d="M50 290 Q 80 240, 150 220 T 240 160 Q 280 130, 320 100"
            fill="none" stroke="url(#route-grad)" strokeWidth="5" strokeLinecap="round"
            strokeDasharray="600" strokeDashoffset={running ? "0" : "0"}
            style={{filter:'drop-shadow(0 0 8px rgba(255,107,43,0.6))'}}/>
          {/* Start dot */}
          <circle cx="50" cy="290" r="8" fill="#22D39E" stroke="#fff" strokeWidth="2"/>
          {/* Current dot */}
          <g>
            <circle cx="320" cy="100" r="14" fill="rgba(255,107,43,0.3)">
              {running && <animate attributeName="r" values="14;22;14" dur="1.5s" repeatCount="indefinite"/>}
            </circle>
            <circle cx="320" cy="100" r="8" fill="#FF6B2B" stroke="#fff" strokeWidth="2.5"/>
          </g>
        </svg>

        {/* top controls overlay */}
        <button onClick={() => go('home')} style={{
          position:'absolute',top:8,left:16,zIndex:5,
          width:38,height:38,borderRadius:12,background:'rgba(0,0,0,0.5)',backdropFilter:'blur(10px)',
          border:'1px solid rgba(255,255,255,0.15)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
          <IconChevL size={20}/>
        </button>
        <div style={{position:'absolute',top:8,right:16,zIndex:5,padding:'6px 12px',borderRadius:14,
          background:'rgba(0,0,0,0.5)',backdropFilter:'blur(10px)',
          border:'1px solid rgba(255,255,255,0.15)',display:'flex',alignItems:'center',gap:6}}>
          <IconLoc size={14}/>
          <span style={{fontSize:11,fontWeight:600}}>Bengaluru · 24°C</span>
        </div>

        {/* Coming soon banner */}
        <div style={{position:'absolute',bottom:20,left:20,right:20,
          padding:'10px 14px',borderRadius:12,background:'rgba(124,58,237,0.2)',backdropFilter:'blur(10px)',
          border:'1px solid rgba(124,58,237,0.4)',display:'flex',alignItems:'center',gap:8,fontSize:11}}>
          <IconSparkle size={14} color="#C8A8FF"/>
          <span style={{color:'#C8A8FF',fontWeight:600}}>Beta</span>
          <span style={{color:'rgba(255,255,255,0.7)'}}>· Live route tracking with Google Maps</span>
        </div>
      </div>

      {/* Stats panel */}
      <div style={{padding:'18px 20px',background:'var(--bg)'}}>
        <div style={{textAlign:'center',marginBottom:18}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:0.12,textTransform:'uppercase',color:'var(--text-mute)'}}>
            {running ? 'In progress' : 'Paused'}
          </div>
          <div className="display tabular" style={{fontSize:64,lineHeight:1,marginTop:4,
            background:'linear-gradient(180deg,#fff,#FFC9A8)',WebkitBackgroundClip:'text',color:'transparent'}}>
            {km.toFixed(2)}
          </div>
          <div style={{fontSize:13,color:'var(--text-dim)',marginTop:4}}>kilometers</div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:18}}>
          <RunStat label="Time" value={fmt(t)} icon={<IconClock size={14}/>}/>
          <RunStat label="Pace" value={pace} unit="/km" icon={<IconBolt size={14}/>}/>
          <RunStat label="Heart" value="148" unit="bpm" icon={<IconHeart size={14}/>}/>
        </div>

        {/* Splits */}
        <div style={{padding:'12px 14px',borderRadius:14,background:'rgba(255,255,255,0.04)',border:'1px solid var(--line)'}}>
          <div style={{fontSize:11,fontWeight:600,color:'var(--text-mute)',letterSpacing:0.06,textTransform:'uppercase',marginBottom:10}}>Splits</div>
          {[
            { km:1, pace:"5'24\"", best:false },
            { km:2, pace:"5'18\"", best:true },
            { km:3, pace:"5'32\"", best:false },
            { km:4, pace:"5'41\"", best:false },
          ].map(s => (
            <div key={s.km} style={{display:'flex',alignItems:'center',gap:10,padding:'6px 0'}}>
              <span style={{fontSize:11,color:'var(--text-mute)',width:20}}>{s.km}km</span>
              <div style={{flex:1,height:5,borderRadius:3,background:'rgba(255,255,255,0.06)',overflow:'hidden'}}>
                <div style={{height:'100%',width:`${100 - (parseInt(s.pace)*10 + parseInt(s.pace.split("'")[1])/2)}%`,
                  background: s.best ? 'var(--grad-warm)' : 'rgba(255,255,255,0.3)',borderRadius:3}}/>
              </div>
              <span className="tabular" style={{fontSize:12,fontWeight:600,color: s.best ? '#FFB991' : 'var(--text)'}}>{s.pace}</span>
              {s.best && <IconStar size={11} color="#FFB991"/>}
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{display:'flex',gap:12,marginTop:18}}>
          <button onClick={() => setRunning(false)} style={{
            width:60,height:60,borderRadius:'50%',background:'rgba(255,46,99,0.15)',border:'1px solid rgba(255,46,99,0.4)',
            color:'#FF8FA9',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
            <IconStop size={20}/>
          </button>
          <button onClick={() => setRunning(r => !r)} style={{
            flex:1,height:60,borderRadius:30,background:'var(--grad-warm)',border:0,color:'#fff',
            fontSize:16,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:8,cursor:'pointer',
            boxShadow:'0 12px 30px -8px rgba(255,107,43,0.5)'}}>
            {running ? <><IconPause size={18}/> Pause</> : <><IconPlay size={18}/> Resume</>}
          </button>
          <button style={{
            width:60,height:60,borderRadius:'50%',background:'rgba(255,255,255,0.06)',border:'1px solid var(--line)',
            color:'var(--text)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
            <IconShare size={20}/>
          </button>
        </div>
      </div>
    </div>
  );
}

function RunStat({ label, value, unit, icon }) {
  return (
    <div style={{padding:'12px',borderRadius:14,background:'rgba(255,255,255,0.04)',border:'1px solid var(--line)',textAlign:'center'}}>
      <div style={{display:'flex',alignItems:'center',gap:4,justifyContent:'center',color:'var(--text-mute)',fontSize:10,fontWeight:600,letterSpacing:0.06,textTransform:'uppercase'}}>
        {icon}<span>{label}</span>
      </div>
      <div style={{display:'flex',alignItems:'baseline',gap:3,justifyContent:'center',marginTop:5}}>
        <div className="display tabular" style={{fontSize:18,lineHeight:1}}>{value}</div>
        {unit && <div style={{fontSize:10,color:'var(--text-dim)'}}>{unit}</div>}
      </div>
    </div>
  );
}

Object.assign(window, { LiveRun });
