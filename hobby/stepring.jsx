// stepring.jsx — Animated multi-arc activity ring
const { useEffect: useEffectR, useRef: useRefR, useState: useStateR } = React;

function useCountUp(target, duration = 1400) {
  const [v, setV] = useStateR(0);
  useEffectR(() => {
    let raf, start;
    const from = 0;
    const tick = (t) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

// style: 'multi' | 'single' | 'gauge'
function StepRing({ steps, goal, calories, calGoal, minutes, minGoal, style = 'multi', size = 280 }) {
  const animSteps = useCountUp(steps);
  const cx = size / 2, cy = size / 2;

  const arc = (r, p, gradId, sw = 14) => {
    const C = 2 * Math.PI * r;
    const off = C * (1 - Math.min(1, p));
    return (
      <circle cx={cx} cy={cy} r={r}
        fill="none" stroke={`url(#${gradId})`} strokeWidth={sw} strokeLinecap="round"
        strokeDasharray={C} strokeDashoffset={off}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{transition:'stroke-dashoffset 1.4s cubic-bezier(0.22,0.61,0.36,1)'}}/>
    );
  };
  const trk = (r, sw = 14) => (
    <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={sw}/>
  );

  if (style === 'single') {
    const r = (size - 28) / 2;
    return (
      <div style={{position:'relative',width:size,height:size,margin:'0 auto'}}>
        <svg width={size} height={size}>
          <defs>
            <linearGradient id="grad-s" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFB347"/>
              <stop offset="50%" stopColor="#FF6B2B"/>
              <stop offset="100%" stopColor="#FF2E63"/>
            </linearGradient>
          </defs>
          {trk(r, 18)}
          {arc(r, steps/goal, 'grad-s', 18)}
        </svg>
        <RingCenter steps={animSteps} goal={goal}/>
      </div>
    );
  }

  if (style === 'gauge') {
    const r = (size - 36) / 2;
    const C = 2 * Math.PI * r;
    const sweep = 0.78;
    const off = C * (1 - sweep * Math.min(1, steps/goal));
    return (
      <div style={{position:'relative',width:size,height:size,margin:'0 auto'}}>
        <svg width={size} height={size}>
          <defs>
            <linearGradient id="grad-g" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FFB347"/>
              <stop offset="50%" stopColor="#FF6B2B"/>
              <stop offset="100%" stopColor="#FF2E63"/>
            </linearGradient>
          </defs>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="22"
                  strokeDasharray={`${C*sweep} ${C}`} strokeLinecap="round"
                  transform={`rotate(${-90 - 360*sweep/2} ${cx} ${cy})`}/>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#grad-g)" strokeWidth="22"
                  strokeDasharray={`${C*sweep} ${C}`} strokeDashoffset={off} strokeLinecap="round"
                  transform={`rotate(${-90 - 360*sweep/2} ${cx} ${cy})`}
                  style={{transition:'stroke-dashoffset 1.4s cubic-bezier(0.22,0.61,0.36,1)'}}/>
        </svg>
        <RingCenter steps={animSteps} goal={goal}/>
        <div style={{position:'absolute',bottom:18,left:0,right:0,display:'flex',justifyContent:'space-between',padding:'0 24px',fontSize:11,color:'var(--text-mute)'}}>
          <span>0</span><span className="tabular">{(goal/1000).toFixed(0)}k</span>
        </div>
      </div>
    );
  }

  // multi (default) — 3 concentric arcs
  const outer = (size - 24) / 2;
  const mid = outer - 22;
  const inner = mid - 22;
  return (
    <div style={{position:'relative',width:size,height:size,margin:'0 auto'}}>
      <svg width={size} height={size}>
        <defs>
          <linearGradient id="grad-o" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFB347"/><stop offset="100%" stopColor="#FF2E63"/>
          </linearGradient>
          <linearGradient id="grad-m" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FF2E63"/><stop offset="100%" stopColor="#7C3AED"/>
          </linearGradient>
          <linearGradient id="grad-i" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22D39E"/><stop offset="100%" stopColor="#5EA0FF"/>
          </linearGradient>
        </defs>
        {trk(outer, 14)}{arc(outer, steps/goal, 'grad-o', 14)}
        {trk(mid, 14)}{arc(mid, calories/calGoal, 'grad-m', 14)}
        {trk(inner, 14)}{arc(inner, minutes/minGoal, 'grad-i', 14)}
      </svg>
      <RingCenter steps={animSteps} goal={goal}/>
    </div>
  );
}

function RingCenter({ steps, goal }) {
  const pct = Math.round((steps/goal)*100);
  return (
    <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',pointerEvents:'none'}}>
      <div style={{fontSize:11,letterSpacing:0.18,fontWeight:600,color:'var(--text-mute)',textTransform:'uppercase'}}>Today</div>
      <div className="display tabular" style={{fontSize:64,lineHeight:1,marginTop:6,
        background:'linear-gradient(180deg,#fff 0%,#FFC9A8 100%)',WebkitBackgroundClip:'text',backgroundClip:'text',color:'transparent'}}>
        {steps.toLocaleString('en-IN')}
      </div>
      <div style={{fontSize:12,color:'var(--text-dim)',letterSpacing:0.16,marginTop:6,fontWeight:500}}>
        steps · <span style={{color:'var(--accent)'}}>{pct}%</span> of {(goal/1000).toFixed(0)}k
      </div>
    </div>
  );
}

Object.assign(window, { StepRing });
