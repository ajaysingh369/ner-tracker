// home.jsx — RunAstra home dashboard
const { useState: useS, useEffect: useE, useRef: useR } = React;

// ── Companion overlay ────────────────────────────────────────
function CompanionLayer({ companionId, theme, ringSize, trigger, onDone }) {
  const [phase, setPhase] = useS('perch'); // perch | popping | speaking | shrinking
  const [quote, setQuote] = useS('');
  const timers = useR([]);

  const comp = (window.COMPANIONS || []).find(c => c.id === companionId);

  const runCycle = () => {
    if (!comp) return;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const q = comp.quotes[Math.floor(Math.random() * comp.quotes.length)];
    setQuote(q);
    setPhase('popping');
    timers.current.push(setTimeout(() => setPhase('speaking'), 600));
    timers.current.push(setTimeout(() => setPhase('shrinking'), 4200));
    timers.current.push(setTimeout(() => { setPhase('perch'); onDone && onDone(); }, 4800));
  };

  // Initial auto-pop on mount, ~1.8s after the ring animates in
  useE(() => {
    window.__layerMounted = (window.__layerMounted || 0) + 1;
    const id = setTimeout(() => {
      window.__autoFired = (window.__autoFired || 0) + 1;
      // Run cycle inline to avoid stale closure on `comp`
      const cur = (window.COMPANIONS || []).find(c => c.id === companionId);
      if (!cur) return;
      const q = cur.quotes[Math.floor(Math.random() * cur.quotes.length)];
      setQuote(q);
      setPhase('popping');
      setTimeout(() => setPhase('speaking'), 600);
      setTimeout(() => setPhase('shrinking'), 4200);
      setTimeout(() => setPhase('perch'), 4800);
    }, 1800);
    return () => { window.__layerUnmount = (window.__layerUnmount || 0) + 1; clearTimeout(id); };
  }, []);

  // Manual re-trigger via prop change
  useE(() => {
    if (trigger > 0) runCycle();
  }, [trigger]);

  if (!comp) return null;
  const Mascot = comp.Comp;

  // Visual center where the companion sits when perched (top-right INSIDE the ring)
  const perchCenterX = ringSize * 0.82;
  const perchCenterY = ringSize * 0.20;
  // The companion's full-size bounding box
  const fullSize = ringSize * 0.70;
  // CSS position of the layer's top-left so its center lands on perchCenterX/Y
  const perchLeft = perchCenterX - fullSize/2;
  const perchTop  = perchCenterY - fullSize/2;
  // Translation needed to move the layer's CENTER from perch to ring center
  const popX = (ringSize/2) - perchCenterX;
  const popY = (ringSize/2) - perchCenterY;

  const anims = {
    perch:    'companionPerchFloat 2.6s ease-in-out infinite',
    popping:  'companionPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
    speaking: 'companionBobble 2.2s ease-in-out infinite',
    shrinking:'companionShrink 0.6s cubic-bezier(0.55, 0, 0.55, 1) forwards',
  };

  return (
    <div className="companion-layer" style={{
      width: fullSize, height: fullSize,
      top: perchTop, left: perchLeft,
      '--pop-x': `${popX}px`,
      '--pop-y': `${popY}px`,
      animation: anims[phase],
      filter: phase === 'perch'
        ? `drop-shadow(0 6px 14px ${comp.color}66)`
        : `drop-shadow(0 18px 40px ${comp.color}55)`,
      zIndex: phase === 'perch' ? 4 : 8,
    }}>
      <Mascot theme={theme} size={fullSize}/>
      {phase === 'speaking' && (
        <div className="speech-bubble-home" style={{
          animation:'speechIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          top: -34,
        }}>
          {quote}
        </div>
      )}
    </div>
  );
}

function Home({ go, tweaks }) {
  const connected = tweaks.healthConnected;
  const stravaConn = tweaks.stravaConnected;
  const steps = connected ? 8432 : 0;
  const goal = 10000;
  const cal = connected ? 412 : 0, calGoal = 600;
  const mins = connected ? 47 : 0, minGoal = 60;
  const km = connected ? 6.2 : 0;

  return (
    <div className="scroll">
      {/* Greeting */}
      <div style={{padding:'8px 20px 4px',display:'flex',alignItems:'center',gap:12}}>
        <div style={{flex:1}}>
          <div style={{fontSize:13,color:'var(--text-dim)',fontWeight:500}}>Namaste, Aarav 👋</div>
          <div className="display" style={{fontSize:24,lineHeight:1.1,marginTop:2}}>
            Tuesday, 28 Apr
          </div>
        </div>
        <button style={{width:42,height:42,borderRadius:14,background:'rgba(255,255,255,0.06)',border:'1px solid var(--line)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text)',cursor:'pointer',position:'relative'}}>
          <IconBell size={20}/>
          <div style={{position:'absolute',top:9,right:10,width:8,height:8,borderRadius:4,background:'var(--accent)',border:'2px solid var(--bg)'}}/>
        </button>
      </div>

      {/* AI banner (top placement) */}
      {tweaks.aiPlacement === 'top' && (
        <div style={{padding:'12px 20px 0'}}>
          <AiBanner go={go}/>
        </div>
      )}

      {/* Health connect prompt OR step ring */}
      {!connected ? (
        <div style={{padding:'14px 20px 0'}}>
          <button onClick={() => tweaks.set('healthConnected', true)} style={{
            width:'100%',padding:'14px 16px',borderRadius:16,
            background:'linear-gradient(135deg, rgba(255,107,43,0.16), rgba(255,46,99,0.10))',
            border:'1px solid rgba(255,107,43,0.35)',
            display:'flex',alignItems:'center',gap:12,cursor:'pointer',color:'var(--text)',textAlign:'left'}}>
            <div style={{width:36,height:36,borderRadius:11,background:'var(--grad-warm)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',flexShrink:0}}>
              <IconHeart size={20}/>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:600,color:'#FFB991'}}>Connect Health Connect</div>
              <div style={{fontSize:12,color:'var(--text-dim)',marginTop:2}}>Sync steps from Google Fit · 10 sec setup</div>
            </div>
            <IconChevR size={18} color="#FFB991"/>
          </button>
        </div>
      ) : null}

      {/* Step ring */}
      <div style={{padding:'18px 20px 0',position:'relative'}}>
        <div style={{
          background:'radial-gradient(120% 80% at 50% 0%, rgba(255,107,43,0.12), transparent 65%), var(--surface)',
          border:'1px solid var(--line)',borderRadius:24,padding:'18px 18px 22px',
          position:'relative',overflow:'hidden'
        }}>
          {/* date pills */}
          <div style={{display:'flex',justifyContent:'center',gap:6,marginBottom:6}}>
            {['M','T','W','T','F','S','S'].map((d,i) => {
              const isToday = i === 1;
              const done = i < 1;
              return (
                <div key={i} style={{
                  display:'flex',flexDirection:'column',alignItems:'center',gap:4,padding:'6px 8px',borderRadius:10,
                  background: isToday ? 'rgba(255,107,43,0.14)' : 'transparent',
                  border: isToday ? '1px solid rgba(255,107,43,0.3)' : '1px solid transparent'
                }}>
                  <span style={{fontSize:10,color: isToday ? '#FFB991' : 'var(--text-mute)',fontWeight:600,letterSpacing:0.06}}>{d}</span>
                  <div style={{width:6,height:6,borderRadius:3,
                    background: done ? 'var(--good)' : isToday ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}}/>
                </div>
              );
            })}
          </div>

          <div style={{position:'relative',width:260,height:260,margin:'0 auto'}}>
            <StepRing steps={steps} goal={goal} calories={cal} calGoal={calGoal}
                      minutes={mins} minGoal={minGoal} style={tweaks.ringStyle} size={260}/>
            {tweaks.companion !== 'none' && (
              <CompanionLayer
                companionId={tweaks.companion}
                theme={tweaks.companionTheme}
                ringSize={260}
                trigger={tweaks.popTick}
              />
            )}
          </div>

          {/* legend */}
          {tweaks.ringStyle === 'multi' && (
            <div style={{display:'flex',justifyContent:'center',gap:16,marginTop:8,fontSize:11,color:'var(--text-dim)'}}>
              <span style={{display:'flex',alignItems:'center',gap:5}}>
                <span style={{width:8,height:8,borderRadius:2,background:'linear-gradient(135deg,#FFB347,#FF2E63)'}}/>Steps
              </span>
              <span style={{display:'flex',alignItems:'center',gap:5}}>
                <span style={{width:8,height:8,borderRadius:2,background:'linear-gradient(135deg,#FF2E63,#7C3AED)'}}/>Calories
              </span>
              <span style={{display:'flex',alignItems:'center',gap:5}}>
                <span style={{width:8,height:8,borderRadius:2,background:'linear-gradient(135deg,#22D39E,#5EA0FF)'}}/>Active
              </span>
            </div>
          )}

          {/* stat row */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginTop:18}}>
            <StatTile icon={<IconRoute size={16}/>} label="Distance" value={`${km.toFixed(1)}`} unit="km"/>
            <StatTile icon={<IconFire size={16}/>} label="Calories" value={cal} unit="kcal"/>
            <StatTile icon={<IconBolt size={16}/>} label="Active" value={mins} unit="min"/>
          </div>

          <button onClick={() => go('history')} style={{
            marginTop:14,width:'100%',padding:'12px',borderRadius:12,background:'rgba(255,255,255,0.04)',
            border:'1px solid var(--line)',color:'var(--text)',fontSize:13,fontWeight:600,
            display:'flex',alignItems:'center',justifyContent:'center',gap:6,cursor:'pointer'}}>
            View Step History <IconArrowR size={14}/>
          </button>
        </div>
      </div>

      {/* AI Inline (default) */}
      {tweaks.aiPlacement === 'inline' && (
        <div style={{padding:'18px 20px 0'}}>
          <AiBanner go={go}/>
        </div>
      )}

      {/* Strava */}
      <div className="sec"><h3>Runner Sync</h3></div>
      <div style={{padding:'0 20px'}}>
        {!stravaConn ? (
          <div className="card" style={{
            background:'radial-gradient(120% 80% at 100% 0%, rgba(255,107,43,0.18), transparent 60%), var(--surface)',
            padding:'20px 18px'}}>
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              <div style={{width:48,height:48,borderRadius:14,background:'linear-gradient(135deg,#FC4C02,#FF6B2B)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff'}}>
                <IconRun size={26} sw={2.2}/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:15,fontWeight:600}}>Sync your activities</div>
                <div style={{fontSize:12,color:'var(--text-dim)',marginTop:2}}>Auto-import runs & rides from Strava</div>
              </div>
            </div>
            <button onClick={() => tweaks.set('stravaConnected', true)} className="btn btn-primary btn-block" style={{marginTop:14}}>
              Connect Strava <IconArrowUR size={16}/>
            </button>
          </div>
        ) : (
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <div style={{padding:'14px 16px',display:'flex',alignItems:'center',gap:10,borderBottom:'1px solid var(--line)'}}>
              <div style={{width:8,height:8,borderRadius:4,background:'#FC4C02'}}/>
              <span style={{fontSize:12,fontWeight:600,color:'var(--text-dim)',letterSpacing:0.06,textTransform:'uppercase'}}>Last activity · Strava</span>
              <div style={{flex:1}}/>
              <span style={{fontSize:11,color:'var(--text-mute)'}}>2h ago</span>
            </div>
            <div style={{padding:'14px 16px'}}>
              <div style={{fontSize:16,fontWeight:600}}>Cubbon Park morning loop 🌅</div>
              <div style={{fontSize:12,color:'var(--text-dim)',marginTop:3}}>Bengaluru · Easy run</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:8,marginTop:14}}>
                <MiniStat label="Distance" v="5.2" u="km"/>
                <MiniStat label="Pace" v="5'42&quot;" u="/km"/>
                <MiniStat label="Time" v="29:48" u=""/>
                <MiniStat label="Heart" v="142" u="bpm"/>
              </div>
              {/* Mini elevation graph */}
              <svg viewBox="0 0 300 50" style={{width:'100%',height:50,marginTop:12,display:'block'}}>
                <defs>
                  <linearGradient id="elev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF6B2B" stopOpacity="0.4"/>
                    <stop offset="100%" stopColor="#FF6B2B" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <path d="M0,40 L20,32 L40,28 L60,30 L90,18 L120,22 L150,12 L180,18 L210,8 L240,16 L270,24 L300,30 L300,50 L0,50 Z" fill="url(#elev)"/>
                <path d="M0,40 L20,32 L40,28 L60,30 L90,18 L120,22 L150,12 L180,18 L210,8 L240,16 L270,24 L300,30" fill="none" stroke="#FF6B2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Active Challenges */}
      <div className="sec"><h3>Active Challenges</h3><a onClick={() => go('challenges')}>View all</a></div>
      <div style={{display:'flex',gap:14,padding:'0 20px',overflowX:'auto',scrollbarWidth:'none'}}>
        <ChallengeCard
          title="Mumbai Monsoon Run" icon="🌧️" pct={0.82} day={4} total={30}
          remain="18.5 km left" featured onClick={() => go('challenge')}/>
        <ChallengeCard
          title="10K Daily Streak" icon="🔥" pct={0.43} day={13} total={30}
          remain="17 days to go"/>
        <ChallengeCard
          title="Holi Steps Festival" icon="🎨" pct={0.21} day={3} total={14}
          remain="44k steps left"/>
      </div>

      {/* Upcoming */}
      <div className="sec"><h3>Upcoming</h3><a onClick={() => go('challenges')}>Browse</a></div>
      <div style={{display:'flex',gap:14,padding:'0 20px',overflowX:'auto',scrollbarWidth:'none'}}>
        <UpcomingCard tint="orange" date="01 May – 31 May" title="Spring Steps 2026" sub="Target: 1,50,000 steps" prize="₹2,000 voucher"/>
        <UpcomingCard tint="green" date="05 Jun" title="Earth Day Eco Run" sub="Plant a tree per km" prize="Tree + medal"/>
        <UpcomingCard tint="purple" date="15 Jun" title="Bengaluru Half" sub="21K · Cubbon Park" prize="Finisher tee"/>
      </div>

      {/* Sponsored */}
      <div className="sec"><h3>Sponsored</h3></div>
      <SponsorCarousel/>
      <div style={{height:24}}/>

      {/* AI bottom */}
      {tweaks.aiPlacement === 'bottom' && (
        <div style={{padding:'0 20px 8px'}}>
          <AiBanner go={go}/>
        </div>
      )}
    </div>
  );
}

function StatTile({ icon, label, value, unit }) {
  return (
    <div style={{
      background:'rgba(255,255,255,0.04)',border:'1px solid var(--line)',borderRadius:14,
      padding:'10px 12px'}}>
      <div style={{display:'flex',alignItems:'center',gap:5,color:'var(--text-mute)',fontSize:10,fontWeight:600,letterSpacing:0.06,textTransform:'uppercase'}}>
        {icon}<span>{label}</span>
      </div>
      <div style={{display:'flex',alignItems:'baseline',gap:3,marginTop:4}}>
        <div className="display tabular" style={{fontSize:22,lineHeight:1}}>{value}</div>
        <div style={{fontSize:11,color:'var(--text-dim)'}}>{unit}</div>
      </div>
    </div>
  );
}

function MiniStat({ label, v, u }) {
  return (
    <div>
      <div style={{fontSize:9,color:'var(--text-mute)',fontWeight:600,letterSpacing:0.06,textTransform:'uppercase'}}>{label}</div>
      <div style={{display:'flex',alignItems:'baseline',gap:2,marginTop:3}}>
        <span className="display tabular" style={{fontSize:16,lineHeight:1}} dangerouslySetInnerHTML={{__html:v}}/>
        {u && <span style={{fontSize:10,color:'var(--text-dim)'}}>{u}</span>}
      </div>
    </div>
  );
}

function AiBanner({ go }) {
  return (
    <button onClick={() => go('ai')} className="ai-banner" style={{textAlign:'left',width:'100%',cursor:'pointer'}}>
      <div className="spark"><IconSparkle size={14} sw={2.2}/></div>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
        <span style={{fontSize:10,fontWeight:700,letterSpacing:0.1,textTransform:'uppercase',color:'#C8A8FF'}}>AI Coach</span>
        <span className="live-dot"/>
      </div>
      <div style={{fontSize:14,fontWeight:600,lineHeight:1.35}}>
        You're 1,568 steps short of your goal. <span style={{color:'#FFB991'}}>A 15-min walk after dinner does it.</span>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:6,marginTop:8,fontSize:12,color:'var(--text-dim)'}}>
        <span>See full plan</span>
        <IconArrowR size={13}/>
      </div>
    </button>
  );
}

function ChallengeCard({ title, icon, pct, day, total, remain, featured, onClick }) {
  return (
    <button onClick={onClick} style={{
      flexShrink:0,width:featured?280:240,padding:0,
      borderRadius:20,border:'1px solid var(--line)',
      background: featured
        ? 'linear-gradient(135deg, rgba(255,107,43,0.18) 0%, rgba(255,46,99,0.12) 60%, rgba(124,58,237,0.10) 100%), var(--surface)'
        : 'var(--surface)',
      color:'var(--text)',cursor:'pointer',textAlign:'left',overflow:'hidden'}}>
      <div style={{padding:'16px 16px 14px'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
          <div style={{width:34,height:34,borderRadius:10,background:'rgba(255,255,255,0.06)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>{icon}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:10,fontWeight:600,color:'var(--text-mute)',letterSpacing:0.08,textTransform:'uppercase'}}>Day {day} of {total}</div>
            <div style={{fontSize:14,fontWeight:600,lineHeight:1.2,marginTop:1}}>{title}</div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:6}}>
          <span style={{fontSize:11,color:'var(--text-dim)'}}>Progress</span>
          <span className="display tabular" style={{fontSize:18,
            background:'var(--grad-warm)',WebkitBackgroundClip:'text',backgroundClip:'text',color:'transparent'}}>{Math.round(pct*100)}%</span>
        </div>
        <div style={{height:8,borderRadius:4,background:'rgba(255,255,255,0.06)',overflow:'hidden'}}>
          <div style={{height:'100%',width:`${pct*100}%`,background:'var(--grad-warm)',borderRadius:4,
            boxShadow:'0 0 12px rgba(255,107,43,0.5)'}}/>
        </div>
        <div style={{fontSize:11,color:'var(--text-mute)',marginTop:8}}>{remain}</div>
      </div>
    </button>
  );
}

function UpcomingCard({ tint, date, title, sub, prize }) {
  const tints = {
    orange:'linear-gradient(135deg, rgba(255,107,43,0.22), rgba(255,46,99,0.10))',
    green:'linear-gradient(135deg, rgba(34,211,158,0.22), rgba(94,160,255,0.10))',
    purple:'linear-gradient(135deg, rgba(124,58,237,0.22), rgba(255,46,99,0.10))',
  };
  const colorMap = { orange:'#FFB991', green:'#7CEBC4', purple:'#C8A8FF' };
  return (
    <div style={{
      flexShrink:0,width:220,borderRadius:20,padding:16,
      background: `${tints[tint]}, var(--surface)`,
      border:'1px solid var(--line)'}}>
      <div style={{fontSize:11,fontWeight:700,color:colorMap[tint],letterSpacing:0.06,textTransform:'uppercase'}}>{date}</div>
      <div style={{fontSize:18,fontWeight:600,lineHeight:1.15,marginTop:8,minHeight:42}}>{title}</div>
      <div style={{fontSize:12,color:'var(--text-dim)',marginTop:4}}>{sub}</div>
      <div style={{display:'flex',alignItems:'center',gap:5,marginTop:10,fontSize:11,color:'var(--text-mute)'}}>
        <IconStar size={12}/><span>{prize}</span>
      </div>
      <button className="btn btn-ghost btn-block" style={{marginTop:12,padding:'10px',fontSize:13}}>Join Early</button>
    </div>
  );
}

function SponsorCarousel() {
  const items = [
    { brand:'NivBupa Health', tag:'Insurance', color:'#22D39E',
      title:'Earn ₹500 cashback', body:'Complete 7 days of step goals to unlock health premium discount.' },
    { brand:'Decabolt Sports', tag:'Gear', color:'#FF6B2B',
      title:'30% off running shoes', body:'Free pair with 21K finisher medal — Bengaluru Half partner.' },
    { brand:'Pulse Hydrate', tag:'Nutrition', color:'#7C3AED',
      title:'Buy 1 get 1 free', body:'Electrolyte drinks — for runners hitting 10k+ steps daily.' },
  ];
  const [i, setI] = useS(0);
  return (
    <div style={{padding:'0 20px'}}>
      <div style={{
        position:'relative',borderRadius:20,padding:18,
        background:`linear-gradient(135deg, ${items[i].color}22, transparent), var(--surface)`,
        border:'1px solid var(--line)',overflow:'hidden'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
          <div style={{padding:'3px 7px',borderRadius:6,background:'rgba(255,255,255,0.08)',fontSize:9,fontWeight:700,letterSpacing:0.1,color:'var(--text-mute)'}}>AD</div>
          <span style={{fontSize:11,color:'var(--text-dim)',fontWeight:600}}>{items[i].brand} · {items[i].tag}</span>
        </div>
        <div style={{fontSize:18,fontWeight:600,lineHeight:1.2}}>{items[i].title}</div>
        <div style={{fontSize:13,color:'var(--text-dim)',marginTop:6,lineHeight:1.4}}>{items[i].body}</div>
        <div style={{display:'flex',alignItems:'center',gap:10,marginTop:14}}>
          <button style={{padding:'10px 14px',borderRadius:10,background:'#fff',border:0,fontWeight:600,fontSize:13,color:'#14120C',cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
            Claim offer <IconArrowR size={14}/>
          </button>
          <div style={{flex:1}}/>
          <div style={{display:'flex',gap:5}}>
            {items.map((_, idx) => (
              <button key={idx} onClick={() => setI(idx)} style={{
                width: idx === i ? 18 : 6, height:6, borderRadius:3, border:0,
                background: idx === i ? items[i].color : 'rgba(255,255,255,0.2)', cursor:'pointer',
                transition:'all 0.2s'}}/>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Home });
