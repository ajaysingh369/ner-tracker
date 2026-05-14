// profile.jsx — Profile + Leaderboard
const { useState: useSp } = React;

function Profile({ go }) {
  return (
    <div className="scroll">
      {/* Header w/ avatar */}
      <div style={{
        height:240,marginTop:-54,paddingTop:78,
        background:'radial-gradient(120% 80% at 50% 0%, rgba(255,107,43,0.4), transparent 60%), radial-gradient(120% 80% at 100% 100%, rgba(124,58,237,0.4), transparent 60%), #1a1820',
        position:'relative'
      }}>
        <button style={{
          position:'absolute',top:60,right:16,
          width:38,height:38,borderRadius:12,background:'rgba(0,0,0,0.4)',backdropFilter:'blur(10px)',
          border:'1px solid rgba(255,255,255,0.15)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
          <IconSettings size={18}/>
        </button>
        <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
          <div style={{position:'relative',marginBottom:12}}>
            <div style={{width:90,height:90,borderRadius:'50%',
              background:'linear-gradient(135deg,#FF6B2B,#FF2E63,#7C3AED)',
              display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:36,fontWeight:700,color:'#fff',
              boxShadow:'0 16px 40px -10px rgba(255,107,43,0.5)',
              border:'3px solid var(--bg)'}}>
              A
            </div>
            <div style={{position:'absolute',bottom:0,right:0,width:28,height:28,borderRadius:'50%',background:'#22D39E',border:'3px solid var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',color:'#0a0a0a'}}>
              <IconCheck size={14} sw={3}/>
            </div>
          </div>
          <div className="display" style={{fontSize:24}}>Aarav Sharma</div>
          <div style={{fontSize:12,color:'var(--text-dim)',marginTop:2,display:'flex',alignItems:'center',gap:6}}>
            <IconLoc size={12}/> Bengaluru · Member since Jan 2025
          </div>
        </div>
      </div>

      {/* Level card */}
      <div style={{padding:'14px 20px 0'}}>
        <div className="card-glow card" style={{padding:18}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
            <div style={{padding:'4px 10px',borderRadius:8,background:'var(--grad-warm)',fontSize:10,fontWeight:700,color:'#fff',letterSpacing:0.06}}>LVL 12</div>
            <div style={{flex:1,fontSize:13,fontWeight:600}}>Pavement Pacer</div>
            <div style={{fontSize:11,color:'var(--text-mute)'}}>682 / 1000 XP</div>
          </div>
          <div style={{height:8,borderRadius:4,background:'rgba(255,255,255,0.06)',overflow:'hidden'}}>
            <div style={{height:'100%',width:'68%',background:'var(--grad-warm)',borderRadius:4,boxShadow:'0 0 12px rgba(255,107,43,0.5)'}}/>
          </div>
          <div style={{fontSize:11,color:'var(--text-dim)',marginTop:8}}>318 XP to <b style={{color:'#FFB991'}}>Trail Tiger</b></div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{padding:'14px 20px 0',display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
        <PStat label="Total km" value="847.2" tint="orange"/>
        <PStat label="Activities" value="186" tint="purple"/>
        <PStat label="Medals" value="14" tint="green"/>
      </div>

      {/* Leaderboard */}
      <div className="sec"><h3>Leaderboard · This week</h3></div>
      <div style={{padding:'0 20px'}}>
        <div style={{display:'flex',gap:6,marginBottom:12,padding:4,background:'rgba(255,255,255,0.05)',border:'1px solid var(--line)',borderRadius:12}}>
          {['Friends','City','Global'].map((t,i) => (
            <button key={t} style={{
              flex:1,padding:'8px',borderRadius:9,border:0,fontSize:12,fontWeight:600,
              background: i === 0 ? 'var(--grad-warm)' : 'transparent',
              color: i === 0 ? '#fff' : 'var(--text-dim)',cursor:'pointer'}}>{t}</button>
          ))}
        </div>

        {/* Podium */}
        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'center',gap:8,padding:'18px 0 4px'}}>
          <PodiumSpot rank={2} name="Rohan" km={48.2} h={70}/>
          <PodiumSpot rank={1} name="Priya" km={62.4} h={92}/>
          <PodiumSpot rank={3} name="Ananya" km={41.7} h={56}/>
        </div>

        <div className="card" style={{padding:0,overflow:'hidden',marginTop:10}}>
          {[
            { rank:4, name:'Karan M.', km:38.4 },
            { rank:5, name:'Divya R.', km:35.1 },
            { rank:6, name:'You', km:32.8, you:true },
            { rank:7, name:'Vikram S.', km:29.6 },
            { rank:8, name:'Neha P.', km:27.4 },
          ].map((r,i) => (
            <div key={i} style={{
              display:'flex',alignItems:'center',gap:12,padding:'12px 16px',
              borderTop: i ? '1px solid var(--line)' : 0,
              background: r.you ? 'rgba(255,107,43,0.08)' : 'transparent'}}>
              <div style={{width:24,fontSize:12,fontWeight:700,color:'var(--text-mute)',textAlign:'center'}}>{r.rank}</div>
              <div style={{width:34,height:34,borderRadius:'50%',background:'linear-gradient(135deg,#FF6B2B,#7C3AED)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'#fff'}}>
                {r.name[0]}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600}}>{r.name} {r.you && <span style={{color:'#FFB991',fontSize:10,marginLeft:4}}>YOU</span>}</div>
                <div style={{fontSize:10,color:'var(--text-mute)'}}>This week</div>
              </div>
              <div className="tabular" style={{fontSize:14,fontWeight:600}}>{r.km}<span style={{fontSize:10,color:'var(--text-dim)',marginLeft:2}}>km</span></div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div className="sec"><h3>Recent achievements</h3><a>All 14</a></div>
      <div style={{display:'flex',gap:10,padding:'0 20px',overflowX:'auto',scrollbarWidth:'none'}}>
        <Achievement icon="🏅" title="First 10K" sub="Apr 12"/>
        <Achievement icon="🔥" title="20-day streak" sub="Apr 24"/>
        <Achievement icon="🌅" title="Early bird" sub="Apr 18" locked={false}/>
        <Achievement icon="⚡" title="Sub-5 pace" sub="Locked" locked/>
        <Achievement icon="🏆" title="100 km/mo" sub="Locked" locked/>
      </div>
      <div style={{height:24}}/>
    </div>
  );
}

function PStat({ label, value, tint }) {
  const c = { orange:'#FFB991', purple:'#C8A8FF', green:'#7CEBC4' }[tint];
  return (
    <div className="card" style={{padding:'12px',textAlign:'center'}}>
      <div className="display tabular" style={{fontSize:22,color:c}}>{value}</div>
      <div style={{fontSize:10,color:'var(--text-mute)',fontWeight:600,letterSpacing:0.06,textTransform:'uppercase',marginTop:2}}>{label}</div>
    </div>
  );
}

function PodiumSpot({ rank, name, km, h }) {
  const colors = { 1:'#FFD700', 2:'#C0C0C0', 3:'#CD7F32' };
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',flex:1,maxWidth:90}}>
      <div style={{width:48,height:48,borderRadius:'50%',background:'linear-gradient(135deg,#FF6B2B,#7C3AED)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:700,color:'#fff',marginBottom:6,
        border: rank === 1 ? '3px solid #FFD700' : 'none'}}>{name[0]}</div>
      <div style={{fontSize:11,fontWeight:600}}>{name}</div>
      <div className="tabular" style={{fontSize:11,color:'var(--text-dim)',marginBottom:8}}>{km} km</div>
      <div style={{width:'100%',height:h,borderRadius:'10px 10px 0 0',
        background:`linear-gradient(180deg, ${colors[rank]}80, ${colors[rank]}20)`,
        border:`1px solid ${colors[rank]}66`,borderBottom:0,
        display:'flex',alignItems:'center',justifyContent:'center',color:colors[rank],
        fontSize:20,fontWeight:700}}>
        {rank}
      </div>
    </div>
  );
}

function Achievement({ icon, title, sub, locked }) {
  return (
    <div style={{
      flexShrink:0,width:110,padding:14,borderRadius:16,
      background:'var(--surface)',border:'1px solid var(--line)',
      textAlign:'center',opacity: locked ? 0.5 : 1}}>
      <div style={{fontSize:28,marginBottom:6,filter: locked ? 'grayscale(1)' : 'none'}}>{icon}</div>
      <div style={{fontSize:12,fontWeight:600}}>{title}</div>
      <div style={{fontSize:10,color:'var(--text-mute)',marginTop:2}}>{sub}</div>
      {locked && <IconLock size={11} color="var(--text-mute)" style={{marginTop:4}}/>}
    </div>
  );
}

Object.assign(window, { Profile });
