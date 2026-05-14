// challenges.jsx — Challenge browse & detail screens
const { useState: useSc } = React;

function Challenges({ go }) {
  const [tab, setTab] = useSc('active');
  return (
    <div className="scroll">
      <ScreenHeader title="Challenges" subtitle="Compete, conquer, level up" onBack={() => go('home')}/>
      <div style={{padding:'8px 20px 0'}}>
        <div style={{display:'flex',background:'rgba(255,255,255,0.05)',border:'1px solid var(--line)',borderRadius:14,padding:4}}>
          {[['active','Active'],['upcoming','Upcoming'],['past','Past']].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              flex:1,padding:'10px 0',borderRadius:11,border:0,fontSize:13,fontWeight:600,
              background: tab === k ? 'var(--grad-warm)' : 'transparent',
              color: tab === k ? '#fff' : 'var(--text-dim)',cursor:'pointer'}}>{l}</button>
          ))}
        </div>
      </div>

      {tab === 'active' && (
        <div style={{padding:'18px 20px 0',display:'flex',flexDirection:'column',gap:14}}>
          <BigChallengeCard onClick={() => go('challenge')}
            title="Mumbai Monsoon Run" tag="🌧️ City Challenge" pct={0.82}
            sub="Day 26 of 30 · 18.5 km left" prize="₹5,000 + Marathon kit"
            rank={147} of={2840}/>
          <BigChallengeCard
            title="10K Daily Streak" tag="🔥 Personal" pct={0.43}
            sub="Day 13 of 30" prize="Streak medal"
            rank={2080} of={11200}/>
          <BigChallengeCard
            title="Holi Steps Festival" tag="🎨 Festival" pct={0.21}
            sub="Day 3 of 14" prize="₹1,000 voucher"
            rank={4200} of={28000}/>
        </div>
      )}

      {tab === 'upcoming' && (
        <div style={{padding:'18px 20px 0',display:'flex',flexDirection:'column',gap:14}}>
          <UpcomingBig tint="orange" date="01 May" title="Spring Steps 2026" sub="1,50,000 steps in 31 days"
            participants="34k joined" prize="₹2,000 voucher"/>
          <UpcomingBig tint="green" date="05 Jun" title="Earth Day Eco Run" sub="Plant a tree per km · 50 km goal"
            participants="12k joined" prize="Tree certificate"/>
          <UpcomingBig tint="purple" date="15 Jun" title="Bengaluru Half Marathon" sub="21K · Cubbon Park"
            participants="8.4k joined" prize="Finisher medal"/>
          <UpcomingBig tint="pink" date="20 Jul" title="Diwali Lights Run" sub="500 km in 30 days"
            participants="Pre-launch" prize="Festival kit"/>
        </div>
      )}

      {tab === 'past' && (
        <div style={{padding:'18px 20px 0',display:'flex',flexDirection:'column',gap:12}}>
          <PastCard title="February Fitness" rank={284} of={5400} medal="silver"/>
          <PastCard title="Republic Day 26K" rank={47} of={1200} medal="gold"/>
          <PastCard title="New Year Reset" rank={892} of={11000} medal="bronze"/>
        </div>
      )}
      <div style={{height:20}}/>
    </div>
  );
}

function BigChallengeCard({ title, tag, pct, sub, prize, rank, of, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding:0,textAlign:'left',cursor:'pointer',color:'var(--text)',
      borderRadius:22,border:'1px solid var(--line)',
      background:'linear-gradient(135deg, rgba(255,107,43,0.10), rgba(124,58,237,0.06)), var(--surface)',
      overflow:'hidden'
    }}>
      <div style={{padding:18}}>
        <div style={{fontSize:11,fontWeight:700,color:'#FFB991',letterSpacing:0.06,textTransform:'uppercase'}}>{tag}</div>
        <div className="display" style={{fontSize:22,lineHeight:1.15,marginTop:6}}>{title}</div>
        <div style={{fontSize:12,color:'var(--text-dim)',marginTop:4}}>{sub}</div>

        <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginTop:14,marginBottom:6}}>
          <span style={{fontSize:11,color:'var(--text-mute)',fontWeight:600,letterSpacing:0.06,textTransform:'uppercase'}}>Progress</span>
          <span className="display tabular" style={{fontSize:22,
            background:'var(--grad-warm)',WebkitBackgroundClip:'text',color:'transparent'}}>{Math.round(pct*100)}%</span>
        </div>
        <div style={{height:10,borderRadius:5,background:'rgba(255,255,255,0.06)',overflow:'hidden'}}>
          <div style={{height:'100%',width:`${pct*100}%`,background:'var(--grad-warm)',borderRadius:5,boxShadow:'0 0 16px rgba(255,107,43,0.5)'}}/>
        </div>

        <div style={{display:'flex',gap:12,marginTop:14}}>
          <div style={{flex:1,padding:'10px 12px',borderRadius:12,background:'rgba(255,255,255,0.04)',border:'1px solid var(--line)'}}>
            <div style={{fontSize:10,color:'var(--text-mute)',fontWeight:600,letterSpacing:0.06,textTransform:'uppercase'}}>Your rank</div>
            <div style={{display:'flex',alignItems:'baseline',gap:3,marginTop:3}}>
              <span className="display tabular" style={{fontSize:18}}>#{rank}</span>
              <span style={{fontSize:11,color:'var(--text-dim)'}}>/ {of.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div style={{flex:1.4,padding:'10px 12px',borderRadius:12,background:'rgba(255,107,43,0.12)',border:'1px solid rgba(255,107,43,0.3)'}}>
            <div style={{fontSize:10,color:'#FFB991',fontWeight:600,letterSpacing:0.06,textTransform:'uppercase',display:'flex',alignItems:'center',gap:4}}>
              <IconStar size={11}/>Prize
            </div>
            <div style={{fontSize:13,fontWeight:600,marginTop:3}}>{prize}</div>
          </div>
        </div>
      </div>
    </button>
  );
}

function UpcomingBig({ tint, date, title, sub, participants, prize }) {
  const tints = {
    orange:'linear-gradient(135deg, rgba(255,107,43,0.22), rgba(255,46,99,0.10))',
    green:'linear-gradient(135deg, rgba(34,211,158,0.22), rgba(94,160,255,0.10))',
    purple:'linear-gradient(135deg, rgba(124,58,237,0.22), rgba(255,46,99,0.10))',
    pink:'linear-gradient(135deg, rgba(255,46,99,0.22), rgba(255,179,71,0.10))',
  };
  const colorMap = { orange:'#FFB991', green:'#7CEBC4', purple:'#C8A8FF', pink:'#FF8FA9' };
  return (
    <div style={{
      padding:18,borderRadius:22,border:'1px solid var(--line)',
      background:`${tints[tint]}, var(--surface)`}}>
      <div style={{display:'flex',alignItems:'flex-start',gap:14}}>
        <div style={{width:54,height:54,borderRadius:14,background:'rgba(0,0,0,0.3)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <span style={{fontSize:9,color:colorMap[tint],fontWeight:700,letterSpacing:0.06,textTransform:'uppercase'}}>{date.split(' ')[1]}</span>
          <span className="display tabular" style={{fontSize:22,lineHeight:1,color:colorMap[tint]}}>{date.split(' ')[0]}</span>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div className="display" style={{fontSize:18,lineHeight:1.2}}>{title}</div>
          <div style={{fontSize:12,color:'var(--text-dim)',marginTop:4}}>{sub}</div>
          <div style={{display:'flex',gap:10,marginTop:8,fontSize:11,color:'var(--text-mute)'}}>
            <span style={{display:'flex',alignItems:'center',gap:4}}><IconUser size={12}/>{participants}</span>
            <span style={{display:'flex',alignItems:'center',gap:4}}><IconStar size={12}/>{prize}</span>
          </div>
        </div>
      </div>
      <button className="btn btn-ghost btn-block" style={{marginTop:14,padding:'10px',fontSize:13}}>
        Reserve a spot
      </button>
    </div>
  );
}

function PastCard({ title, rank, of, medal }) {
  const colors = { gold:'#FFD700', silver:'#C0C0C0', bronze:'#CD7F32' };
  return (
    <div className="card" style={{display:'flex',alignItems:'center',gap:14,padding:14}}>
      <div style={{width:46,height:46,borderRadius:14,background:`linear-gradient(135deg,${colors[medal]}, ${colors[medal]}88)`,display:'flex',alignItems:'center',justifyContent:'center',color:'#14120C'}}>
        <IconMedal size={24} sw={2.2}/>
      </div>
      <div style={{flex:1}}>
        <div style={{fontSize:14,fontWeight:600}}>{title}</div>
        <div style={{fontSize:11,color:'var(--text-dim)',marginTop:2}}>Ranked #{rank} of {of.toLocaleString('en-IN')}</div>
      </div>
      <IconChevR size={18} color="var(--text-mute)"/>
    </div>
  );
}

// ── Detail ────────────────────────────────────────────────
function ChallengeDetail({ go }) {
  return (
    <div className="scroll">
      {/* Hero */}
      <div style={{
        position:'relative',height:280,marginTop:-54,paddingTop:54,
        background:'radial-gradient(120% 80% at 50% 0%, rgba(255,107,43,0.45), transparent 60%), radial-gradient(120% 80% at 100% 100%, rgba(124,58,237,0.5), transparent 60%), #1a1820',
        overflow:'hidden'
      }}>
        {/* Pattern */}
        <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:0.15}} viewBox="0 0 390 280">
          {Array.from({length:20}).map((_,i) => (
            <circle key={i} cx={(i*47)%390} cy={(i*73)%280} r={i%3+2} fill="#fff"/>
          ))}
        </svg>
        <button onClick={() => go('challenges')} style={{
          position:'absolute',top:60,left:16,zIndex:5,
          width:38,height:38,borderRadius:12,background:'rgba(0,0,0,0.4)',backdropFilter:'blur(10px)',
          border:'1px solid rgba(255,255,255,0.15)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
          <IconChevL size={20}/>
        </button>
        <button style={{
          position:'absolute',top:60,right:16,zIndex:5,
          width:38,height:38,borderRadius:12,background:'rgba(0,0,0,0.4)',backdropFilter:'blur(10px)',
          border:'1px solid rgba(255,255,255,0.15)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
          <IconShare size={18}/>
        </button>
        <div style={{position:'absolute',bottom:18,left:20,right:20}}>
          <div className="chip warm" style={{marginBottom:10}}>🌧️ City Challenge · Mumbai</div>
          <div className="display" style={{fontSize:30,lineHeight:1.05,color:'#fff'}}>Mumbai<br/>Monsoon Run</div>
          <div style={{fontSize:12,color:'rgba(255,255,255,0.7)',marginTop:6}}>120 km in 30 days · Ends 30 Apr</div>
        </div>
      </div>

      {/* Progress hero */}
      <div style={{padding:'18px 20px 0'}}>
        <div className="card" style={{padding:'18px 18px 14px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
            <div>
              <div style={{fontSize:11,fontWeight:600,color:'var(--text-mute)',letterSpacing:0.06,textTransform:'uppercase'}}>Your Progress</div>
              <div style={{display:'flex',alignItems:'baseline',gap:6,marginTop:4}}>
                <span className="display tabular" style={{fontSize:32,
                  background:'var(--grad-warm)',WebkitBackgroundClip:'text',color:'transparent'}}>101.5</span>
                <span style={{fontSize:14,color:'var(--text-dim)'}}>/ 120 km</span>
              </div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:11,fontWeight:600,color:'var(--text-mute)',letterSpacing:0.06,textTransform:'uppercase'}}>Days left</div>
              <div className="display tabular" style={{fontSize:28,marginTop:4}}>4</div>
            </div>
          </div>
          <div style={{height:12,borderRadius:6,background:'rgba(255,255,255,0.06)',overflow:'hidden',position:'relative'}}>
            <div style={{height:'100%',width:'82%',background:'var(--grad-warm)',borderRadius:6,boxShadow:'0 0 18px rgba(255,107,43,0.5)'}}/>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',marginTop:8,fontSize:11,color:'var(--text-mute)'}}>
            <span>Started 01 Apr</span><span>82% complete</span><span>30 Apr</span>
          </div>
        </div>
      </div>

      {/* Daily breakdown */}
      <div className="sec"><h3>Pace breakdown</h3></div>
      <div style={{padding:'0 20px'}}>
        <div className="card">
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <div style={{fontSize:12,color:'var(--text-dim)'}}>Required pace</div>
              <div className="display tabular" style={{fontSize:20}}>4.6 km/day</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:12,color:'var(--text-dim)'}}>Your pace</div>
              <div className="display tabular" style={{fontSize:20,color:'#7CEBC4'}}>3.9 km/day</div>
            </div>
          </div>
          <div style={{padding:'10px 12px',borderRadius:10,background:'rgba(34,211,158,0.1)',border:'1px solid rgba(34,211,158,0.2)',marginTop:12,fontSize:12,color:'#7CEBC4'}}>
            ✓ On track to finish in 5 days at current pace
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="sec"><h3>Leaderboard</h3><a>View all</a></div>
      <div style={{padding:'0 20px'}}>
        <div className="card" style={{padding:0,overflow:'hidden'}}>
          {[
            { rank:1, name:'Priya Sharma', km:124.8, you:false, city:'Mumbai' },
            { rank:2, name:'Rohan Mehta', km:121.2, you:false, city:'Pune' },
            { rank:3, name:'Ananya Iyer', km:119.4, you:false, city:'Bengaluru' },
            { rank:147, name:'You', km:101.5, you:true, city:'Bengaluru' },
            { rank:148, name:'Vikram S.', km:101.1, you:false, city:'Delhi' },
          ].map((r,i) => (
            <div key={i} style={{
              display:'flex',alignItems:'center',gap:12,padding:'12px 16px',
              borderTop: i ? '1px solid var(--line)' : 0,
              background: r.you ? 'rgba(255,107,43,0.08)' : 'transparent'}}>
              <div style={{
                width:30,height:30,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',
                background: r.rank <= 3 ? ['#FFD700','#C0C0C0','#CD7F32'][r.rank-1]+'30' : 'rgba(255,255,255,0.05)',
                color: r.rank <= 3 ? ['#FFD700','#C0C0C0','#CD7F32'][r.rank-1] : 'var(--text-mute)',
                fontSize:12,fontWeight:700}}>
                {r.rank <= 3 ? r.rank : `#${r.rank}`}
              </div>
              <div style={{width:34,height:34,borderRadius:'50%',background:'linear-gradient(135deg,#FF6B2B,#7C3AED)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'#fff'}}>
                {r.name[0]}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600}}>{r.name} {r.you && <span style={{color:'#FFB991',fontSize:10,fontWeight:600,marginLeft:4}}>YOU</span>}</div>
                <div style={{fontSize:11,color:'var(--text-mute)'}}>{r.city}</div>
              </div>
              <div className="tabular" style={{fontSize:14,fontWeight:600}}>{r.km}<span style={{fontSize:10,color:'var(--text-dim)',marginLeft:2}}>km</span></div>
            </div>
          ))}
        </div>
      </div>
      <div style={{height:30}}/>
    </div>
  );
}

Object.assign(window, { Challenges, ChallengeDetail });
