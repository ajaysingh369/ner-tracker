// app.jsx — main app shell with routing and tweaks
const { useState: useSa, useEffect: useEa } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "ringStyle": "multi",
  "aiPlacement": "inline",
  "healthConnected": true,
  "stravaConnected": true,
  "companion": "zenith",
  "companionTheme": "solar",
  "dark": true
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = useSa('home');
  const [prevRoute, setPrev] = useSa(null);
  const [animating, setAnim] = useSa(false);
  const [popTick, setPopTick] = useSa(0);

  useEa(() => {
    document.documentElement.dataset.theme = t.dark ? 'dark' : 'light';
  }, [t.dark]);

  const popCompanion = () => setPopTick(x => x + 1);

  // Expose for debugging
  useEa(() => { window.__popCompanion = popCompanion; }, []);

  // Expose for debugging
  useEa(() => { window.__popCompanion = popCompanion; }, []);

  const go = (r) => {
    if (r === route) return;
    setPrev(route);
    setRoute(r);
    setAnim(true);
    setTimeout(() => setAnim(false), 340);
  };

  const tabRoutes = ['home','events','run','leader','profile'];
  const onTab = (tab) => {
    if (tab === 'home') go('home');
    else if (tab === 'events') go('challenges');
    else if (tab === 'run') go('liverun');
    else if (tab === 'leader') go('history');
    else if (tab === 'profile') go('profile');
  };

  const activeTab = (() => {
    if (route === 'home' || route === 'ai') return 'home';
    if (route === 'challenges' || route === 'challenge') return 'events';
    if (route === 'liverun') return 'run';
    if (route === 'history') return 'leader';
    if (route === 'profile') return 'profile';
    return 'home';
  })();

  const renderRoute = (r) => {
    const tweaksObj = { ...t, popTick, set: (k,v) => setTweak(k,v) };
    if (r === 'home') return <Home go={go} tweaks={tweaksObj}/>;
    if (r === 'history') return <StepHistory go={go}/>;
    if (r === 'challenges') return <Challenges go={go}/>;
    if (r === 'challenge') return <ChallengeDetail go={go}/>;
    if (r === 'ai') return <AiCoach go={go}/>;
    if (r === 'liverun') return <LiveRun go={go}/>;
    if (r === 'profile') return <Profile go={go}/>;
    return null;
  };

  const showTabbar = route !== 'liverun' && route !== 'challenge';

  return (
    <Phone dark={t.dark}>
      <div style={{position:'relative',flex:1,overflow:'hidden'}}>
        {animating && prevRoute && (
          <div key={`p-${prevRoute}`} className="page page-exit page-exit-active">
            {renderRoute(prevRoute)}
          </div>
        )}
        <div key={`r-${route}`} className={`page ${animating ? 'page-enter page-enter-active' : ''}`}>
          {renderRoute(route)}
        </div>
      </div>
      {showTabbar && <TabBar active={activeTab} onChange={onTab}/>}

      <TweaksPanel>
        <TweakSection label="Companion"/>
        <TweakSelect label="Mascot" value={t.companion}
          options={['zenith','monk','beast','furious','buddy','sage','none']}
          onChange={(v) => setTweak('companion', v)}/>
        <TweakRadio label="Theme" value={t.companionTheme}
          options={['solar','lunar','nebula']}
          onChange={(v) => setTweak('companionTheme', v)}/>
        <TweakButton label="✨ Pop companion" onClick={popCompanion}/>

        <TweakSection label="Step Ring"/>
        <TweakRadio label="Style" value={t.ringStyle}
          options={['multi','single','gauge']}
          onChange={(v) => setTweak('ringStyle', v)}/>

        <TweakSection label="AI Coach"/>
        <TweakRadio label="Placement" value={t.aiPlacement}
          options={['top','inline','bottom']}
          onChange={(v) => setTweak('aiPlacement', v)}/>

        <TweakSection label="Connections"/>
        <TweakToggle label="Health Connect" value={t.healthConnected}
          onChange={(v) => setTweak('healthConnected', v)}/>
        <TweakToggle label="Strava connected" value={t.stravaConnected}
          onChange={(v) => setTweak('stravaConnected', v)}/>

        <TweakSection label="Theme"/>
        <TweakToggle label="Dark mode" value={t.dark}
          onChange={(v) => setTweak('dark', v)}/>
      </TweaksPanel>
    </Phone>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);

// auto-mark home as default tab on load
