// ai.jsx — AI Insights, Plans & Coach screen
function AiCoach({ go }) {
  return (
    <div className="scroll">
      <ScreenHeader title="AI Coach" subtitle="Personalized for your body, your goals" onBack={() => go('home')}
        right={<div style={{display:'flex',alignItems:'center',gap:6,padding:'5px 10px',borderRadius:20,background:'rgba(124,58,237,0.15)',border:'1px solid rgba(124,58,237,0.3)'}}>
          <span className="live-dot" style={{background:'#C8A8FF'}}/>
          <span style={{fontSize:10,fontWeight:700,letterSpacing:0.06,color:'#C8A8FF',textTransform:'uppercase'}}>Live</span>
        </div>}/>

      {/* Hero */}
      <div style={{padding:'12px 20px 0'}}>
        <div style={{
          padding:'22px 20px',borderRadius:24,
          background:'radial-gradient(120% 80% at 100% 0%, rgba(124,58,237,0.4), transparent 60%), radial-gradient(120% 80% at 0% 100%, rgba(255,107,43,0.3), transparent 60%), var(--surface)',
          border:'1px solid rgba(124,58,237,0.3)',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:-30,right:-30,width:160,height:160,borderRadius:'50%',
            background:'radial-gradient(circle, rgba(124,58,237,0.4), transparent 60%)',filter:'blur(20px)'}}/>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
            <div style={{width:40,height:40,borderRadius:14,background:'var(--grad-warm)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff'}}>
              <IconSparkle size={20} sw={2.2}/>
            </div>
            <div>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:0.1,textTransform:'uppercase',color:'#C8A8FF'}}>Today's Plan</div>
              <div style={{fontSize:13,color:'var(--text-dim)',marginTop:1}}>Generated 2 mins ago</div>
            </div>
          </div>
          <div className="display" style={{fontSize:22,lineHeight:1.25}}>
            Push for a <span style={{background:'var(--grad-warm)',WebkitBackgroundClip:'text',color:'transparent'}}>10K finish</span> today —
            you've recovered well from yesterday.
          </div>
          <div style={{display:'flex',gap:8,marginTop:14,flexWrap:'wrap'}}>
            <div className="chip warm">🎯 Goal: 10,000 steps</div>
            <div className="chip">⏱ 47 active min</div>
            <div className="chip">💧 2.5L water</div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="sec"><h3>For you, right now</h3></div>
      <div style={{padding:'0 20px',display:'flex',flexDirection:'column',gap:12}}>
        <Insight icon="🌅" tint="orange" title="Morning walk window opens at 6:30 AM"
          body="AQI is 68 (Good) tomorrow. Best 90-min slot for a tempo run in Cubbon Park."
          cta="Set reminder"/>
        <Insight icon="🦵" tint="purple" title="Recovery day suggested for Thursday"
          body="Your last 3 runs averaged 4'58&quot; pace — leg fatigue likely. Try yoga or light stretching."
          cta="Show stretches"/>
        <Insight icon="🍛" tint="green" title="Pre-run fuel suggestion"
          body="Aloo paratha + curd 2 hours before evening run. Adds 380 kcal, perfect for endurance."
          cta="Save to plan"/>
        <Insight icon="📈" tint="pink" title="You're ready for 15K"
          body="Cardiovascular load up 12% in 4 weeks. Your weekly mileage supports stepping up."
          cta="Plan a 15K"/>
      </div>

      {/* Trends */}
      <div className="sec"><h3>Body trends</h3></div>
      <div style={{padding:'0 20px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        <TrendCard label="Resting HR" value="58" unit="bpm" trend={-3} good/>
        <TrendCard label="VO₂ max" value="48.2" unit="ml/kg" trend={+1.2} good/>
        <TrendCard label="Sleep avg" value="7h 12m" unit="" trend={-12} unit2="min vs target"/>
        <TrendCard label="Recovery" value="86" unit="%" trend={+4} good/>
      </div>

      {/* Ask coach */}
      <div className="sec"><h3>Ask your coach</h3></div>
      <div style={{padding:'0 20px'}}>
        <div className="card" style={{padding:'14px'}}>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>
            {['Why am I slower today?','Plan my next race','Best time to run?','Knee pain advice'].map(q => (
              <button key={q} className="chip" style={{cursor:'pointer'}}>{q}</button>
            ))}
          </div>
          <div style={{display:'flex',gap:10,padding:'12px',borderRadius:14,background:'rgba(255,255,255,0.04)',border:'1px solid var(--line)'}}>
            <input placeholder="Ask anything about your fitness..." style={{
              flex:1,background:'transparent',border:0,outline:'none',color:'var(--text)',fontSize:14,fontFamily:'inherit'}}/>
            <button style={{width:34,height:34,borderRadius:10,background:'var(--grad-warm)',border:0,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
              <IconArrowR size={18}/>
            </button>
          </div>
          <div style={{fontSize:10,color:'var(--text-mute)',marginTop:8,textAlign:'center'}}>AI may make mistakes · Not medical advice</div>
        </div>
      </div>
      <div style={{height:24}}/>
    </div>
  );
}

function Insight({ icon, tint, title, body, cta }) {
  const tints = { orange:'#FFB991', purple:'#C8A8FF', green:'#7CEBC4', pink:'#FF8FA9' };
  const bgs = {
    orange:'rgba(255,107,43,0.10)', purple:'rgba(124,58,237,0.10)',
    green:'rgba(34,211,158,0.10)', pink:'rgba(255,46,99,0.10)' };
  return (
    <div className="card" style={{display:'flex',gap:14,padding:14}}>
      <div style={{width:42,height:42,borderRadius:13,background:bgs[tint],display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{icon}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:14,fontWeight:600,lineHeight:1.3}}>{title}</div>
        <div style={{fontSize:12,color:'var(--text-dim)',marginTop:5,lineHeight:1.45}}>{body}</div>
        <button style={{marginTop:8,background:'transparent',border:0,padding:0,color:tints[tint],fontSize:12,fontWeight:600,display:'flex',alignItems:'center',gap:4,cursor:'pointer'}}>
          {cta} <IconArrowR size={12}/>
        </button>
      </div>
    </div>
  );
}

function TrendCard({ label, value, unit, trend, good, unit2 }) {
  const positive = good ? trend > 0 : trend < 0;
  return (
    <div className="card" style={{padding:'14px'}}>
      <div style={{fontSize:11,fontWeight:600,color:'var(--text-mute)',letterSpacing:0.06,textTransform:'uppercase'}}>{label}</div>
      <div style={{display:'flex',alignItems:'baseline',gap:4,marginTop:6}}>
        <div className="display tabular" style={{fontSize:22,lineHeight:1}}>{value}</div>
        <div style={{fontSize:11,color:'var(--text-dim)'}}>{unit}</div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:5,marginTop:6,fontSize:11,
        color: positive ? '#7CEBC4' : '#FF8FA9'}}>
        <span>{trend > 0 ? '↑' : '↓'} {Math.abs(trend)}{typeof trend === 'number' && trend % 1 === 0 ? '' : ''}{unit2 ? ` ${unit2}` : ' vs last week'}</span>
      </div>
    </div>
  );
}

Object.assign(window, { AiCoach });
