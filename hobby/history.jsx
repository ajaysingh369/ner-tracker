// history.jsx — Step history with weekly/monthly/yearly graphs
const { useState: useSh } = React;

function StepHistory({ go }) {
  const [range, setRange] = useSh('week');
  const [selected, setSelected] = useSh(null);

  const weekData = [
    { l:'Mon', v:8240, cal:380 },
    { l:'Tue', v:11420, cal:520 },
    { l:'Wed', v:6890, cal:310 },
    { l:'Thu', v:14200, cal:640 },
    { l:'Fri', v:9870, cal:450 },
    { l:'Sat', v:13500, cal:610 },
    { l:'Sun', v:8432, cal:412 },
  ];
  const monthData = Array.from({length:30}, (_,i) => ({
    l: String(i+1), v: 5000 + Math.round(Math.sin(i*0.5)*3000 + Math.random()*4000), cal:0
  }));
  const yearData = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    .map((l,i) => ({ l, v: 180000 + Math.round(Math.sin(i*0.6)*60000 + Math.random()*40000), cal:0 }));

  const data = range === 'week' ? weekData : range === 'month' ? monthData : yearData;
  const max = Math.max(...data.map(d => d.v));
  const total = data.reduce((s,d) => s+d.v, 0);
  const avg = Math.round(total / data.length);
  const goalHit = data.filter(d => d.v >= 10000).length;

  return (
    <div className="scroll">
      <ScreenHeader title="Step History" subtitle="Your progress at a glance" onBack={() => go('home')}/>

      {/* Range selector */}
      <div style={{padding:'8px 20px 0'}}>
        <div style={{display:'flex',background:'rgba(255,255,255,0.05)',border:'1px solid var(--line)',borderRadius:14,padding:4,position:'relative'}}>
          {['week','month','year'].map(r => (
            <button key={r} onClick={() => { setRange(r); setSelected(null); }} style={{
              flex:1,padding:'10px 0',borderRadius:11,border:0,fontSize:13,fontWeight:600,
              background: range === r ? 'var(--grad-warm)' : 'transparent',
              color: range === r ? '#fff' : 'var(--text-dim)',
              boxShadow: range === r ? '0 6px 16px -6px rgba(255,107,43,0.5)' : 'none',
              textTransform:'capitalize',cursor:'pointer',transition:'all 0.2s'
            }}>{r}</button>
          ))}
        </div>
      </div>

      {/* Big stat */}
      <div style={{padding:'22px 20px 0'}}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:0.1,textTransform:'uppercase',color:'var(--text-mute)'}}>
          {range === 'week' ? 'This week' : range === 'month' ? 'April 2026' : '2026 so far'}
        </div>
        <div style={{display:'flex',alignItems:'baseline',gap:8,marginTop:6}}>
          <div className="display tabular" style={{fontSize:48,lineHeight:1,
            background:'linear-gradient(180deg,#fff 0%,#FFC9A8 100%)',WebkitBackgroundClip:'text',color:'transparent'}}>
            {total.toLocaleString('en-IN')}
          </div>
          <div style={{fontSize:14,color:'var(--text-dim)'}}>steps</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6,marginTop:6}}>
          <div style={{padding:'3px 8px',borderRadius:6,background:'rgba(34,211,158,0.15)',color:'#7CEBC4',fontSize:11,fontWeight:700,display:'flex',alignItems:'center',gap:3}}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M5 1l4 5H1l4-5z"/></svg>
            +12.4%
          </div>
          <span style={{fontSize:12,color:'var(--text-dim)'}}>vs previous {range}</span>
        </div>
      </div>

      {/* Graph */}
      <div style={{padding:'20px 20px 0'}}>
        <div className="card" style={{padding:'16px 12px'}}>
          <BarGraph data={data} max={max} selected={selected} onSelect={setSelected} range={range}/>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{padding:'14px 20px 0',display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        <BigStat icon={<IconTarget size={18}/>} label="Daily Average" value={avg.toLocaleString('en-IN')} unit="steps" tint="orange"/>
        <BigStat icon={<IconMedal size={18}/>} label="Goal Hit" value={goalHit} unit={`/ ${data.length} days`} tint="green"/>
        <BigStat icon={<IconRoute size={18}/>} label="Distance" value={(total*0.00075).toFixed(1)} unit="km" tint="purple"/>
        <BigStat icon={<IconFire size={18}/>} label="Calories" value={Math.round(total*0.045).toLocaleString('en-IN')} unit="kcal" tint="pink"/>
      </div>

      {/* AI Insight */}
      <div style={{padding:'18px 20px 0'}}>
        <div className="ai-banner">
          <div className="spark"><IconSparkle size={14} sw={2.2}/></div>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:0.1,color:'#C8A8FF',textTransform:'uppercase'}}>AI Insight</div>
          <div style={{fontSize:14,fontWeight:500,marginTop:6,lineHeight:1.45}}>
            You walk <b style={{color:'#FFB991'}}>32% more on Saturdays</b>. Tuesdays are your weakest day — try a lunchtime walk to balance the week.
          </div>
        </div>
      </div>

      {/* Heatmap / streak */}
      <div className="sec"><h3>Streak & Consistency</h3></div>
      <div style={{padding:'0 20px'}}>
        <div className="card">
          <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:14}}>
            <div style={{width:54,height:54,borderRadius:18,background:'linear-gradient(135deg,#FF6B2B,#FF2E63)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>🔥</div>
            <div style={{flex:1}}>
              <div className="display tabular" style={{fontSize:32,lineHeight:1}}>23</div>
              <div style={{fontSize:12,color:'var(--text-dim)'}}>day streak — <b style={{color:'#FFB991'}}>personal best!</b></div>
            </div>
          </div>
          <Heatmap/>
        </div>
      </div>
      <div style={{height:24}}/>
    </div>
  );
}

function BarGraph({ data, max, selected, onSelect, range }) {
  const cols = data.length;
  const w = 320, h = 180;
  const gap = range === 'month' ? 1.5 : 6;
  const barW = (w - gap*(cols-1)) / cols;

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h+30}`} style={{width:'100%',display:'block'}}>
        <defs>
          <linearGradient id="bar-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF6B2B"/>
            <stop offset="100%" stopColor="#FF2E63"/>
          </linearGradient>
          <linearGradient id="bar-grad-dim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,107,43,0.35)"/>
            <stop offset="100%" stopColor="rgba(255,46,99,0.18)"/>
          </linearGradient>
        </defs>
        {/* goal line */}
        {range !== 'year' && (
          <g>
            <line x1="0" y1={h - (10000/max)*h*0.9} x2={w} y2={h - (10000/max)*h*0.9}
              stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="3 3"/>
            <text x={w-2} y={h - (10000/max)*h*0.9 - 4} fontSize="9" fill="rgba(255,255,255,0.4)" textAnchor="end" fontWeight="600">10k goal</text>
          </g>
        )}
        {data.map((d, i) => {
          const bh = (d.v / max) * h * 0.9;
          const x = i*(barW+gap);
          const y = h - bh;
          const isSel = selected === i;
          return (
            <g key={i} onClick={() => onSelect(i)} style={{cursor:'pointer'}}>
              <rect x={x} y={0} width={barW} height={h} fill="transparent"/>
              <rect x={x} y={y} width={barW} height={bh} rx={Math.min(barW/2, 4)}
                fill={selected === null || isSel ? 'url(#bar-grad)' : 'url(#bar-grad-dim)'}
                style={{transition:'all 0.3s'}}/>
              {range === 'week' && (
                <text x={x+barW/2} y={h+14} fontSize="10" fill="rgba(255,255,255,0.5)" textAnchor="middle" fontWeight="600">{d.l}</text>
              )}
              {range === 'year' && (
                <text x={x+barW/2} y={h+14} fontSize="9" fill="rgba(255,255,255,0.5)" textAnchor="middle" fontWeight="600">{d.l}</text>
              )}
              {range === 'month' && i % 5 === 0 && (
                <text x={x+barW/2} y={h+14} fontSize="9" fill="rgba(255,255,255,0.4)" textAnchor="middle">{d.l}</text>
              )}
              {isSel && (
                <g>
                  <rect x={x+barW/2-30} y={y-26} width="60" height="20" rx="5" fill="#fff"/>
                  <text x={x+barW/2} y={y-12} fontSize="10" fill="#14120C" textAnchor="middle" fontWeight="700">{d.v.toLocaleString('en-IN')}</text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function BigStat({ icon, label, value, unit, tint }) {
  const tints = {
    orange:'rgba(255,107,43,0.16)', green:'rgba(34,211,158,0.16)',
    purple:'rgba(124,58,237,0.16)', pink:'rgba(255,46,99,0.16)'
  };
  const colors = {
    orange:'#FFB991', green:'#7CEBC4', purple:'#C8A8FF', pink:'#FF8FA9'
  };
  return (
    <div className="card" style={{padding:'14px'}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
        <div style={{width:30,height:30,borderRadius:9,background:tints[tint],color:colors[tint],display:'flex',alignItems:'center',justifyContent:'center'}}>{icon}</div>
        <div style={{fontSize:11,fontWeight:600,color:'var(--text-mute)',letterSpacing:0.06,textTransform:'uppercase'}}>{label}</div>
      </div>
      <div style={{display:'flex',alignItems:'baseline',gap:4}}>
        <div className="display tabular" style={{fontSize:24,lineHeight:1}}>{value}</div>
        <div style={{fontSize:11,color:'var(--text-dim)'}}>{unit}</div>
      </div>
    </div>
  );
}

function Heatmap() {
  const cells = Array.from({length: 7*12}, (_,i) => Math.random());
  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(12,1fr)',gridTemplateRows:'repeat(7,1fr)',gap:3,gridAutoFlow:'column'}}>
        {cells.map((v, i) => {
          const intensity = v < 0.2 ? 0 : v < 0.4 ? 1 : v < 0.7 ? 2 : 3;
          const colors = ['rgba(255,255,255,0.05)','rgba(255,107,43,0.3)','rgba(255,107,43,0.6)','rgba(255,107,43,1)'];
          return <div key={i} style={{aspectRatio:1,borderRadius:3,background:colors[intensity]}}/>;
        })}
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:10,fontSize:10,color:'var(--text-mute)'}}>
        <span>12 weeks ago</span>
        <div style={{display:'flex',alignItems:'center',gap:4}}>
          <span>Less</span>
          {['rgba(255,255,255,0.05)','rgba(255,107,43,0.3)','rgba(255,107,43,0.6)','rgba(255,107,43,1)'].map((c,i) => (
            <div key={i} style={{width:10,height:10,borderRadius:2,background:c}}/>
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { StepHistory });
