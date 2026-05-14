// shell.jsx — Phone frame, status bar, tab bar, page transitions
const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ── Status bar ──────────────────────────────────────────────────
function StatusBar({ time = "9:41", dark = true }) {
  const c = dark ? '#F5F4F2' : '#14120C';
  return (
    <div className="statusbar">
      <span className="tabular">{time}</span>
      <div style={{display:'flex',alignItems:'center',gap:6}}>
        {/* signal */}
        <svg width="18" height="12" viewBox="0 0 18 12" fill={c}>
          <rect x="0" y="8" width="3" height="4" rx="0.5"/>
          <rect x="5" y="5" width="3" height="7" rx="0.5"/>
          <rect x="10" y="2" width="3" height="10" rx="0.5"/>
          <rect x="15" y="0" width="3" height="12" rx="0.5"/>
        </svg>
        {/* wifi */}
        <svg width="16" height="12" viewBox="0 0 16 12" fill={c}>
          <path d="M8 11.5c0.6 0 1-.5 1-1s-.4-1-1-1-1 .5-1 1 .4 1 1 1z"/>
          <path d="M3.6 7.4a6 6 0 0 1 8.8 0l-1 1a4.6 4.6 0 0 0-6.8 0l-1-1z"/>
          <path d="M.7 4.5a10 10 0 0 1 14.6 0l-1 1a8.6 8.6 0 0 0-12.6 0l-1-1z"/>
        </svg>
        {/* battery */}
        <svg width="26" height="13" viewBox="0 0 26 13">
          <rect x="0.5" y="0.5" width="22" height="12" rx="3" fill="none" stroke={c} strokeOpacity="0.5"/>
          <rect x="2" y="2" width="19" height="9" rx="2" fill={c}/>
          <rect x="23.5" y="4" width="2" height="5" rx="1" fill={c} fillOpacity="0.5"/>
        </svg>
      </div>
    </div>
  );
}

// ── Tab bar ─────────────────────────────────────────────────────
function TabBar({ active, onChange }) {
  const tabs = [
    { id:'home', label:'Home', Icon: IconHome },
    { id:'events', label:'Events', Icon: IconTrophy },
    { id:'run', label:'Run', Icon: IconRun, primary: true },
    { id:'leader', label:'Board', Icon: IconChart },
    { id:'profile', label:'Profile', Icon: IconUser },
  ];
  return (
    <div className="tabbar">
      <div className="tabbar-inner">
        {tabs.map(t => {
          const isActive = active === t.id;
          if (t.primary) return (
            <button key={t.id} className="tab" onClick={() => onChange(t.id)}>
              <div style={{
                width:50,height:50,borderRadius:18,
                background:'var(--grad-warm)',
                display:'flex',alignItems:'center',justifyContent:'center',
                color:'#fff',marginTop:-22,
                boxShadow:'0 10px 24px -8px rgba(255,107,43,0.6)',
                border:'3px solid var(--bg)'
              }}>
                <t.Icon size={24} sw={2}/>
              </div>
            </button>
          );
          return (
            <button key={t.id} className={`tab ${isActive ? 'active' : ''}`} onClick={() => onChange(t.id)}>
              <div className="ic" style={{color: isActive ? 'var(--accent)' : 'var(--text-mute)'}}>
                <t.Icon size={22} sw={isActive ? 2.2 : 1.8}/>
              </div>
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Phone frame ─────────────────────────────────────────────────
function Phone({ children, dark = true }) {
  return (
    <div className="phone" data-theme={dark ? 'dark' : 'light'}>
      <div className="notch"/>
      <StatusBar dark={dark}/>
      <div className="screen">{children}</div>
      <div className="home-ind"/>
    </div>
  );
}

// ── Header (used inside scroll views) ───────────────────────────
function ScreenHeader({ title, subtitle, right, onBack }) {
  return (
    <div style={{padding:'4px 20px 8px',display:'flex',alignItems:'center',gap:12}}>
      {onBack && (
        <button onClick={onBack} style={{
          width:38,height:38,borderRadius:12,background:'rgba(255,255,255,0.06)',
          border:'1px solid var(--line)',display:'flex',alignItems:'center',justifyContent:'center',
          color:'var(--text)',cursor:'pointer'}}>
          <IconChevL size={20}/>
        </button>
      )}
      <div style={{flex:1,minWidth:0}}>
        <div className="display" style={{fontSize:28,lineHeight:1.05}}>{title}</div>
        {subtitle && <div style={{fontSize:13,color:'var(--text-dim)',marginTop:3}}>{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

Object.assign(window, { Phone, StatusBar, TabBar, ScreenHeader });
