// companions.jsx — RunAstra mascots: hand-painted SVG illustrations
// Each character uses layered radial gradients, rim lighting, specular highlights,
// and atmospheric particles to approximate 3D-rendered fidelity in pure vector.

const THEMES = {
  solar:  { primary:'#FF6B2B', secondary:'#FFB347', glow:'#FF8C42', accent:'#FFD27D', spark:'#FFE5A8', dark:'#2A0F05', ember:'#FF3A1A' },
  lunar:  { primary:'#5EA0FF', secondary:'#7CD4FF', glow:'#8FC4FF', accent:'#B8E0FF', spark:'#E6F2FF', dark:'#08132A', ember:'#3D7BD8' },
  nebula: { primary:'#C026D3', secondary:'#EC4899', glow:'#D946EF', accent:'#F0ABFC', spark:'#FCE7FF', dark:'#1A0828', ember:'#9D2EC8' },
};

// ────────────────────────────────────────────────────────────────
// ZENITH — The Challenger (energy robot warrior)
// ────────────────────────────────────────────────────────────────
function Zenith({ theme = 'solar', size = 200 }) {
  const c = THEMES[theme];
  const k = `zn${theme}`;
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      <defs>
        <radialGradient id={`${k}-aura`} cx="50%" cy="55%" r="55%">
          <stop offset="0%" stopColor={c.glow} stopOpacity="0.55"/>
          <stop offset="50%" stopColor={c.primary} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={c.primary} stopOpacity="0"/>
        </radialGradient>
        <radialGradient id={`${k}-body`} cx="40%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#3a3a48"/>
          <stop offset="50%" stopColor="#1c1c28"/>
          <stop offset="100%" stopColor="#08080F"/>
        </radialGradient>
        <radialGradient id={`${k}-head`} cx="35%" cy="25%" r="75%">
          <stop offset="0%" stopColor="#52525e"/>
          <stop offset="55%" stopColor="#1d1d2a"/>
          <stop offset="100%" stopColor="#08080F"/>
        </radialGradient>
        <linearGradient id={`${k}-flame`} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor={c.accent}/>
          <stop offset="50%" stopColor={c.primary}/>
          <stop offset="100%" stopColor={c.ember}/>
        </linearGradient>
        <radialGradient id={`${k}-visor`} cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor={c.accent} stopOpacity="0.9"/>
          <stop offset="40%" stopColor={c.primary} stopOpacity="0.4"/>
          <stop offset="100%" stopColor="#000" stopOpacity="0.6"/>
        </radialGradient>
        <filter id={`${k}-blur`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5"/>
        </filter>
        <filter id={`${k}-soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6"/>
        </filter>
      </defs>

      {/* Aura halo */}
      <circle cx="100" cy="105" r="92" fill={`url(#${k}-aura)`}/>

      {/* Soft flame trail behind body */}
      <g filter={`url(#${k}-soft)`} opacity="0.85">
        <path d="M 100 175 Q 70 160 75 130 Q 80 100 100 90 Q 120 100 125 130 Q 130 160 100 175 Z" fill={c.primary} opacity="0.6"/>
      </g>

      {/* Back leg */}
      <g>
        <path d="M 113 140 Q 132 152 138 175 L 124 178 Q 116 158 108 148 Z" fill={`url(#${k}-body)`} stroke={c.dark} strokeWidth="1"/>
        <path d="M 116 142 Q 128 152 134 168 L 130 169 Q 122 156 114 147 Z" fill={c.primary} opacity="0.4"/>
      </g>

      {/* Front leg (kicking) */}
      <g>
        <path d="M 88 138 Q 70 150 64 172 L 78 176 Q 86 158 96 145 Z" fill={`url(#${k}-body)`} stroke={c.dark} strokeWidth="1"/>
        <path d="M 92 140 Q 78 150 72 168 L 76 169 Q 86 154 94 144 Z" fill={c.primary} opacity="0.4"/>
      </g>

      {/* Arms */}
      <path d="M 60 102 Q 48 118 50 135 L 58 137 Q 62 122 68 110 Z" fill={`url(#${k}-body)`} stroke={c.dark} strokeWidth="1"/>
      <path d="M 142 100 Q 156 108 158 122 L 150 126 Q 142 116 134 108 Z" fill={`url(#${k}-body)`} stroke={c.dark} strokeWidth="1"/>
      <circle cx="52" cy="138" r="8" fill={`url(#${k}-body)`} stroke={c.primary} strokeWidth="1.5"/>
      <circle cx="153" cy="125" r="8" fill={`url(#${k}-body)`} stroke={c.primary} strokeWidth="1.5"/>

      {/* Torso */}
      <path d="M 73 92 Q 66 125 76 150 L 124 150 Q 134 125 127 92 Q 100 84 73 92 Z"
            fill={`url(#${k}-body)`} stroke={c.primary} strokeWidth="2"/>
      {/* Torso highlight */}
      <path d="M 78 95 Q 73 115 78 130 L 90 132 Q 86 110 90 96 Z" fill={c.primary} opacity="0.25"/>
      {/* Star core glow */}
      <circle cx="100" cy="118" r="14" fill={c.glow} opacity="0.4" filter={`url(#${k}-blur)`}/>
      {/* Chest star */}
      <path d="M 100 108 L 104 117 L 113 118 L 106 124 L 109 133 L 100 128 L 91 133 L 94 124 L 87 118 L 96 117 Z"
            fill={`url(#${k}-flame)`}/>
      <path d="M 100 110 L 102 117 L 100 122 L 98 117 Z" fill="#fff" opacity="0.7"/>

      {/* Head */}
      <ellipse cx="100" cy="72" rx="32" ry="34" fill={`url(#${k}-head)`} stroke={c.primary} strokeWidth="2.5"/>
      {/* Head rim light */}
      <ellipse cx="92" cy="58" rx="14" ry="8" fill={c.glow} opacity="0.3"/>
      <ellipse cx="82" cy="62" rx="4" ry="14" fill={c.primary} opacity="0.5" transform="rotate(-20 82 62)"/>

      {/* Visor frame */}
      <ellipse cx="100" cy="73" rx="24" ry="15" fill="#0a0a14" stroke={c.primary} strokeWidth="1.5"/>
      {/* Visor glass */}
      <ellipse cx="100" cy="73" rx="22" ry="13" fill={`url(#${k}-visor)`}/>
      {/* Eye lights */}
      <ellipse cx="91" cy="73" rx="3.5" ry="4" fill={c.spark}/>
      <ellipse cx="91" cy="71" rx="2" ry="1.5" fill="#fff"/>
      <ellipse cx="109" cy="73" rx="3.5" ry="4" fill={c.spark}/>
      <ellipse cx="109" cy="71" rx="2" ry="1.5" fill="#fff"/>
      {/* Eye glow */}
      <circle cx="91" cy="73" r="6" fill={c.accent} opacity="0.35" filter={`url(#${k}-blur)`}/>
      <circle cx="109" cy="73" r="6" fill={c.accent} opacity="0.35" filter={`url(#${k}-blur)`}/>

      {/* Antenna flame */}
      <g>
        <ellipse cx="100" cy="32" rx="10" ry="14" fill={c.primary} opacity="0.3" filter={`url(#${k}-blur)`}/>
        <path d="M 100 14 Q 92 22 94 32 Q 96 38 100 36 Q 104 38 106 32 Q 108 22 100 14 Z" fill={`url(#${k}-flame)`}/>
        <path d="M 100 20 Q 96 26 98 32 Q 100 34 100 32 Q 102 34 102 32 Q 104 26 100 20 Z" fill={c.accent} opacity="0.9"/>
        <path d="M 100 24 Q 98 28 100 32 Q 102 28 100 24 Z" fill="#fff" opacity="0.9"/>
      </g>
      <circle cx="100" cy="38" r="2.5" fill={c.spark}/>

      {/* Speed embers around */}
      <g filter={`url(#${k}-blur)`}>
        <circle cx="40" cy="80" r="3" fill={c.primary} opacity="0.7"/>
        <circle cx="36" cy="100" r="2" fill={c.accent} opacity="0.7"/>
        <circle cx="44" cy="120" r="2.5" fill={c.primary} opacity="0.6"/>
        <circle cx="166" cy="70" r="2" fill={c.accent} opacity="0.7"/>
        <circle cx="168" cy="95" r="3" fill={c.primary} opacity="0.5"/>
      </g>
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────
// MONK — The Mindful Mentor
// ────────────────────────────────────────────────────────────────
function Monk({ theme = 'solar', size = 200 }) {
  const c = THEMES[theme];
  const k = `mk${theme}`;
  const robe = theme === 'solar' ? ['#2C5F5D','#1A3D3B','#4A8B85'] : theme === 'lunar' ? ['#1E3A5F','#0C1F3D','#3A6BA8'] : ['#3F2A5A','#231144','#6B4A9C'];
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      <defs>
        <radialGradient id={`${k}-aura`} cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor={c.glow} stopOpacity="0.5"/>
          <stop offset="50%" stopColor={c.accent} stopOpacity="0.2"/>
          <stop offset="100%" stopColor={c.primary} stopOpacity="0"/>
        </radialGradient>
        <radialGradient id={`${k}-halo`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={c.spark} stopOpacity="0.9"/>
          <stop offset="50%" stopColor={c.accent} stopOpacity="0.5"/>
          <stop offset="100%" stopColor={c.glow} stopOpacity="0"/>
        </radialGradient>
        <radialGradient id={`${k}-robe`} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor={robe[2]}/>
          <stop offset="60%" stopColor={robe[0]}/>
          <stop offset="100%" stopColor={robe[1]}/>
        </radialGradient>
        <radialGradient id={`${k}-skin`} cx="35%" cy="25%" r="75%">
          <stop offset="0%" stopColor="#FFE8C9"/>
          <stop offset="50%" stopColor="#F2D0A0"/>
          <stop offset="100%" stopColor="#B88A5E"/>
        </radialGradient>
        <filter id={`${k}-soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4"/>
        </filter>
        <filter id={`${k}-blur`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2"/>
        </filter>
      </defs>

      {/* Aura */}
      <circle cx="100" cy="95" r="92" fill={`url(#${k}-aura)`}/>

      {/* Backlight halo behind head */}
      <circle cx="100" cy="60" r="42" fill={`url(#${k}-halo)`} filter={`url(#${k}-soft)`} opacity="0.9"/>

      {/* Lotus base */}
      <g>
        <ellipse cx="100" cy="165" rx="62" ry="14" fill={c.primary} opacity="0.15" filter={`url(#${k}-blur)`}/>
        <ellipse cx="100" cy="162" rx="58" ry="12" fill={robe[1]}/>
        <ellipse cx="100" cy="158" rx="50" ry="9" fill={`url(#${k}-robe)`}/>
        {/* Lotus petals */}
        <path d="M 60 158 Q 50 148 55 138 Q 65 144 68 158 Z" fill={c.accent} opacity="0.7"/>
        <path d="M 140 158 Q 150 148 145 138 Q 135 144 132 158 Z" fill={c.accent} opacity="0.7"/>
        <path d="M 80 162 Q 70 158 70 150 Q 80 152 84 162 Z" fill={c.spark} opacity="0.5"/>
        <path d="M 120 162 Q 130 158 130 150 Q 120 152 116 162 Z" fill={c.spark} opacity="0.5"/>
      </g>

      {/* Crossed legs (folded robes) */}
      <path d="M 55 155 Q 50 135 60 120 Q 75 110 100 110 Q 125 110 140 120 Q 150 135 145 155 Q 130 165 100 165 Q 70 165 55 155 Z"
            fill={`url(#${k}-robe)`} stroke={robe[1]} strokeWidth="1.5"/>
      {/* Robe folds shading */}
      <path d="M 60 150 Q 55 140 62 128 Q 70 122 80 125 L 78 145 Q 70 148 60 150 Z" fill="#000" opacity="0.2"/>
      <path d="M 140 150 Q 145 140 138 128 Q 130 122 120 125 L 122 145 Q 130 148 140 150 Z" fill="#000" opacity="0.2"/>
      <path d="M 80 130 L 100 124 L 120 130 L 118 148 L 100 144 L 82 148 Z" fill="#000" opacity="0.15"/>

      {/* Feet peeking */}
      <ellipse cx="78" cy="158" rx="10" ry="5" fill={`url(#${k}-skin)`} stroke="#B88A5E" strokeWidth="1"/>
      <ellipse cx="122" cy="158" rx="10" ry="5" fill={`url(#${k}-skin)`} stroke="#B88A5E" strokeWidth="1"/>

      {/* Hands meditation mudra */}
      <g>
        <ellipse cx="100" cy="138" rx="22" ry="8" fill={`url(#${k}-skin)`} stroke="#C9A57F" strokeWidth="1"/>
        <ellipse cx="100" cy="135" rx="20" ry="3" fill="#FFE8C9" opacity="0.6"/>
        {/* Thumbs */}
        <ellipse cx="92" cy="135" rx="3" ry="4" fill={`url(#${k}-skin)`}/>
        <ellipse cx="108" cy="135" rx="3" ry="4" fill={`url(#${k}-skin)`}/>
      </g>

      {/* Body (top robe) */}
      <path d="M 78 120 Q 75 95 88 80 L 112 80 Q 125 95 122 120 Q 100 124 78 120 Z"
            fill={`url(#${k}-robe)`} stroke={robe[1]} strokeWidth="1.5"/>
      {/* Robe collar (V shape) */}
      <path d="M 92 80 L 100 95 L 108 80 L 100 90 Z" fill={robe[1]}/>
      {/* Belt */}
      <rect x="78" y="115" width="44" height="5" rx="2" fill={c.primary}/>
      <rect x="78" y="115" width="44" height="2" fill={c.accent} opacity="0.6"/>

      {/* Neck */}
      <path d="M 92 70 L 92 82 Q 100 86 108 82 L 108 70 Z" fill={`url(#${k}-skin)`}/>
      <path d="M 92 72 Q 100 76 108 72" fill="none" stroke="#B88A5E" strokeWidth="1" opacity="0.5"/>

      {/* Head */}
      <ellipse cx="100" cy="55" rx="28" ry="30" fill={`url(#${k}-skin)`} stroke="#B88A5E" strokeWidth="1.2"/>
      {/* Head highlight */}
      <ellipse cx="88" cy="42" rx="10" ry="14" fill="#FFE8C9" opacity="0.6" filter={`url(#${k}-blur)`}/>
      {/* Ears */}
      <ellipse cx="74" cy="55" rx="5" ry="8" fill={`url(#${k}-skin)`} stroke="#B88A5E" strokeWidth="1"/>
      <ellipse cx="126" cy="55" rx="5" ry="8" fill={`url(#${k}-skin)`} stroke="#B88A5E" strokeWidth="1"/>
      <ellipse cx="74" cy="57" rx="2" ry="4" fill="#D8A878" opacity="0.7"/>
      <ellipse cx="126" cy="57" rx="2" ry="4" fill="#D8A878" opacity="0.7"/>

      {/* Closed peaceful eyes (curved lines) */}
      <path d="M 84 55 Q 89 60 94 55" fill="none" stroke="#3D2817" strokeWidth="2" strokeLinecap="round"/>
      <path d="M 106 55 Q 111 60 116 55" fill="none" stroke="#3D2817" strokeWidth="2" strokeLinecap="round"/>
      {/* Eyelashes hint */}
      <path d="M 85 55 L 84 53 M 89 56 L 89 53 M 93 55 L 94 53" stroke="#3D2817" strokeWidth="0.8" strokeLinecap="round"/>
      <path d="M 107 55 L 106 53 M 111 56 L 111 53 M 115 55 L 116 53" stroke="#3D2817" strokeWidth="0.8" strokeLinecap="round"/>

      {/* Eyebrows soft */}
      <path d="M 84 50 Q 89 48 94 50" fill="none" stroke="#5C3920" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
      <path d="M 106 50 Q 111 48 116 50" fill="none" stroke="#5C3920" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>

      {/* Cheek blush */}
      <ellipse cx="80" cy="62" rx="5" ry="3" fill="#FF9F8C" opacity="0.4"/>
      <ellipse cx="120" cy="62" rx="5" ry="3" fill="#FF9F8C" opacity="0.4"/>

      {/* Serene smile */}
      <path d="M 92 66 Q 100 71 108 66" fill="none" stroke="#3D2817" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M 94 67 Q 100 69 106 67" fill="#A85C4F" opacity="0.4"/>

      {/* Bindi (3rd eye) */}
      <circle cx="100" cy="40" r="3.5" fill={c.primary}/>
      <circle cx="100" cy="40" r="2" fill={c.accent}/>
      <circle cx="100" cy="40" r="1" fill="#fff" opacity="0.9"/>

      {/* Floating energy motes */}
      <g filter={`url(#${k}-blur)`}>
        <circle cx="40" cy="80" r="2.5" fill={c.spark}/>
        <circle cx="160" cy="65" r="2" fill={c.accent}/>
        <circle cx="172" cy="110" r="1.5" fill={c.spark}/>
        <circle cx="35" cy="125" r="2" fill={c.accent}/>
        <circle cx="155" cy="135" r="1.8" fill={c.spark}/>
      </g>
      {/* Tiny sparkle stars */}
      <g fill={c.spark}>
        <path d="M 36 50 L 38 54 L 42 56 L 38 58 L 36 62 L 34 58 L 30 56 L 34 54 Z" opacity="0.7"/>
        <path d="M 170 145 L 172 149 L 176 151 L 172 153 L 170 157 L 168 153 L 164 151 L 168 149 Z" opacity="0.6"/>
      </g>
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────
// BEAST — The Discipline Beast (chibi werewolf)
// ────────────────────────────────────────────────────────────────
function Beast({ theme = 'solar', size = 200 }) {
  const c = THEMES[theme];
  const k = `bs${theme}`;
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      <defs>
        <radialGradient id={`${k}-aura`} cx="50%" cy="55%" r="55%">
          <stop offset="0%" stopColor={c.ember} stopOpacity="0.6"/>
          <stop offset="50%" stopColor={c.primary} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={c.primary} stopOpacity="0"/>
        </radialGradient>
        <radialGradient id={`${k}-fur`} cx="40%" cy="25%" r="85%">
          <stop offset="0%" stopColor="#3a2a2a"/>
          <stop offset="40%" stopColor="#1c1014"/>
          <stop offset="80%" stopColor="#0a0608"/>
          <stop offset="100%" stopColor="#000"/>
        </radialGradient>
        <radialGradient id={`${k}-furHead`} cx="35%" cy="20%" r="85%">
          <stop offset="0%" stopColor="#4a3535"/>
          <stop offset="35%" stopColor="#22141a"/>
          <stop offset="80%" stopColor="#0a0608"/>
        </radialGradient>
        <radialGradient id={`${k}-eye`}>
          <stop offset="0%" stopColor={c.spark}/>
          <stop offset="50%" stopColor={c.accent}/>
          <stop offset="100%" stopColor={c.ember}/>
        </radialGradient>
        <linearGradient id={`${k}-band`} x1="0%" x2="0%" y1="0%" y2="100%">
          <stop offset="0%" stopColor={c.secondary}/>
          <stop offset="50%" stopColor={c.primary}/>
          <stop offset="100%" stopColor={c.ember}/>
        </linearGradient>
        <filter id={`${k}-blur`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5"/>
        </filter>
        <filter id={`${k}-soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5"/>
        </filter>
      </defs>

      {/* Background aura */}
      <circle cx="100" cy="115" r="90" fill={`url(#${k}-aura)`}/>

      {/* Soft fur silhouette glow */}
      <g filter={`url(#${k}-soft)`} opacity="0.6">
        <ellipse cx="100" cy="120" rx="55" ry="48" fill="#000"/>
      </g>

      {/* TAIL — bushy, swept up */}
      <g>
        <path d="M 145 132 Q 168 122 175 100 Q 172 92 165 100 Q 158 118 148 128 Z" fill={`url(#${k}-fur)`} stroke="#1c1014" strokeWidth="1"/>
        {/* Tail tuft tips */}
        <path d="M 172 98 Q 174 92 168 90 L 170 98 Z" fill={c.primary} opacity="0.6"/>
      </g>

      {/* BACK LEG */}
      <g>
        <path d="M 117 148 Q 128 162 130 180 L 142 178 Q 138 162 130 148 Z" fill={`url(#${k}-fur)`} stroke="#1c1014" strokeWidth="1"/>
        {/* Claws */}
        <path d="M 132 178 L 130 184 M 136 179 L 137 185 M 140 178 L 142 184" stroke="#d8d4cc" strokeWidth="1.5" strokeLinecap="round"/>
      </g>

      {/* FRONT LEG */}
      <g>
        <path d="M 83 148 Q 72 162 70 180 L 58 178 Q 62 162 70 148 Z" fill={`url(#${k}-fur)`} stroke="#1c1014" strokeWidth="1"/>
        <path d="M 60 178 L 58 184 M 64 179 L 63 185 M 68 178 L 66 184" stroke="#d8d4cc" strokeWidth="1.5" strokeLinecap="round"/>
      </g>

      {/* BODY */}
      <ellipse cx="100" cy="125" rx="48" ry="40" fill={`url(#${k}-fur)`} stroke={c.primary} strokeWidth="1.5"/>
      {/* Body fur tufts (chest) */}
      <path d="M 78 110 Q 75 100 82 95 L 85 110 Z" fill="#1c1014"/>
      <path d="M 122 110 Q 125 100 118 95 L 115 110 Z" fill="#1c1014"/>
      {/* Body rim light */}
      <path d="M 80 105 Q 75 125 82 145 L 88 142 Q 84 125 86 108 Z" fill={c.primary} opacity="0.25"/>
      {/* Belly highlight */}
      <ellipse cx="100" cy="135" rx="20" ry="10" fill="#2a1c20" opacity="0.5"/>

      {/* ARMS in fight pose (fists raised) */}
      {/* Left arm */}
      <path d="M 60 110 Q 48 100 50 86 Q 60 80 72 92 Z" fill={`url(#${k}-fur)`} stroke="#1c1014" strokeWidth="1"/>
      <circle cx="52" cy="88" r="10" fill={`url(#${k}-fur)`} stroke={c.primary} strokeWidth="1.5"/>
      <path d="M 48 84 L 46 86 M 52 82 L 52 84 M 56 84 L 58 86" stroke="#d8d4cc" strokeWidth="1.2" strokeLinecap="round"/>
      {/* Right arm */}
      <path d="M 140 110 Q 152 100 150 86 Q 140 80 128 92 Z" fill={`url(#${k}-fur)`} stroke="#1c1014" strokeWidth="1"/>
      <circle cx="148" cy="88" r="10" fill={`url(#${k}-fur)`} stroke={c.primary} strokeWidth="1.5"/>
      <path d="M 152 84 L 154 86 M 148 82 L 148 84 M 144 84 L 142 86" stroke="#d8d4cc" strokeWidth="1.2" strokeLinecap="round"/>

      {/* MANE — fierce tufts radiating from head */}
      <g fill={`url(#${k}-fur)`}>
        <path d="M 62 80 Q 52 65 58 50 L 70 70 Z"/>
        <path d="M 72 65 Q 68 48 78 45 L 80 65 Z"/>
        <path d="M 86 55 Q 86 38 96 40 L 92 60 Z"/>
        <path d="M 100 50 L 100 30 L 108 48 Z"/>
        <path d="M 114 55 Q 118 38 128 42 L 120 60 Z"/>
        <path d="M 128 65 Q 132 48 142 50 L 130 70 Z"/>
        <path d="M 138 80 Q 148 65 142 50 L 132 70 Z"/>
      </g>

      {/* HEAD */}
      <ellipse cx="100" cy="92" rx="36" ry="33" fill={`url(#${k}-furHead)`} stroke={c.primary} strokeWidth="2"/>
      {/* Head shadow under chin */}
      <ellipse cx="100" cy="110" rx="28" ry="8" fill="#000" opacity="0.4"/>

      {/* EARS — wolf style */}
      <g>
        <path d="M 76 78 L 70 52 L 88 68 Z" fill={`url(#${k}-furHead)`} stroke={c.primary} strokeWidth="1.5"/>
        <path d="M 78 75 L 75 60 L 84 70 Z" fill={c.primary} opacity="0.7"/>
        <path d="M 124 78 L 130 52 L 112 68 Z" fill={`url(#${k}-furHead)`} stroke={c.primary} strokeWidth="1.5"/>
        <path d="M 122 75 L 125 60 L 116 70 Z" fill={c.primary} opacity="0.7"/>
      </g>

      {/* HEADBAND */}
      <path d="M 68 82 Q 100 76 132 82 L 132 90 Q 100 84 68 90 Z" fill={`url(#${k}-band)`}/>
      <path d="M 68 82 Q 100 76 132 82" fill="none" stroke={c.accent} strokeWidth="1" opacity="0.6"/>
      {/* Headband emblem */}
      <circle cx="100" cy="86" r="5" fill={c.dark}/>
      <circle cx="100" cy="86" r="3.5" fill={c.spark}/>
      <path d="M 100 84 L 101 86 L 100 88 L 99 86 Z" fill={c.ember}/>
      {/* Headband ties trailing */}
      <path d="M 70 86 L 60 96 L 62 104 L 68 92 Z" fill={c.primary}/>
      <path d="M 130 86 L 140 96 L 138 104 L 132 92 Z" fill={c.primary}/>

      {/* EYES — fierce glowing */}
      <g>
        {/* Eye glow halo */}
        <ellipse cx="88" cy="98" rx="9" ry="7" fill={c.ember} opacity="0.5" filter={`url(#${k}-blur)`}/>
        <ellipse cx="112" cy="98" rx="9" ry="7" fill={c.ember} opacity="0.5" filter={`url(#${k}-blur)`}/>
        {/* Eye whites (angry slant) */}
        <path d="M 80 96 Q 88 91 96 96 Q 92 104 88 104 Q 84 104 80 96 Z" fill={`url(#${k}-eye)`} stroke="#000" strokeWidth="0.8"/>
        <path d="M 104 96 Q 112 91 120 96 Q 116 104 112 104 Q 108 104 104 96 Z" fill={`url(#${k}-eye)`} stroke="#000" strokeWidth="0.8"/>
        {/* Pupils */}
        <ellipse cx="88" cy="99" rx="2.5" ry="3.5" fill="#000"/>
        <ellipse cx="112" cy="99" rx="2.5" ry="3.5" fill="#000"/>
        {/* Specular highlight */}
        <ellipse cx="89" cy="97" rx="1.2" ry="1.5" fill="#fff"/>
        <ellipse cx="113" cy="97" rx="1.2" ry="1.5" fill="#fff"/>
      </g>

      {/* SNARLING MOUTH */}
      <g>
        {/* Snout */}
        <path d="M 88 105 Q 100 115 112 105 Q 110 113 100 117 Q 90 113 88 105 Z" fill="#0a0608" stroke="#1c1014" strokeWidth="0.8"/>
        {/* Snout highlight */}
        <ellipse cx="100" cy="106" rx="6" ry="2" fill="#2a1c20" opacity="0.8"/>
        {/* Nose */}
        <ellipse cx="100" cy="103" rx="4" ry="3" fill="#0a0608" stroke={c.primary} strokeWidth="0.8"/>
        <ellipse cx="100" cy="102" rx="2" ry="1" fill="#3a2a2a"/>
        {/* Mouth opening */}
        <path d="M 90 112 Q 100 120 110 112 L 108 114 Q 100 118 92 114 Z" fill="#3a0a0f"/>
        {/* Top fangs */}
        <path d="M 91 112 L 89 119 L 93 116 Z" fill="#fff" stroke="#aaa" strokeWidth="0.5"/>
        <path d="M 109 112 L 111 119 L 107 116 Z" fill="#fff" stroke="#aaa" strokeWidth="0.5"/>
        {/* Bottom small fangs */}
        <path d="M 94 117 L 95 121 L 96 117 Z" fill="#fff"/>
        <path d="M 106 117 L 105 121 L 104 117 Z" fill="#fff"/>
        {/* Tongue */}
        <path d="M 97 118 Q 100 121 103 118 L 100 120 Z" fill="#a8362e" opacity="0.8"/>
      </g>

      {/* Scar/whisker hint */}
      <path d="M 82 102 Q 75 104 70 106" stroke="#fff" strokeWidth="0.8" opacity="0.3" strokeLinecap="round"/>
      <path d="M 118 102 Q 125 104 130 106" stroke="#fff" strokeWidth="0.8" opacity="0.3" strokeLinecap="round"/>

      {/* Atmospheric embers */}
      <g filter={`url(#${k}-blur)`}>
        <circle cx="35" cy="60" r="2.5" fill={c.ember}/>
        <circle cx="40" cy="40" r="2" fill={c.primary}/>
        <circle cx="160" cy="50" r="3" fill={c.ember}/>
        <circle cx="170" cy="78" r="2" fill={c.primary}/>
        <circle cx="30" cy="135" r="2.5" fill={c.ember}/>
      </g>
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────
// FURIOUS — The Firestarter (chibi anime fighter)
// ────────────────────────────────────────────────────────────────
function FuriousBoy({ theme = 'solar', size = 200 }) {
  const c = THEMES[theme];
  const k = `fr${theme}`;
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      <defs>
        <radialGradient id={`${k}-aura`} cx="50%" cy="55%" r="55%">
          <stop offset="0%" stopColor={c.primary} stopOpacity="0.55"/>
          <stop offset="50%" stopColor={c.ember} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={c.primary} stopOpacity="0"/>
        </radialGradient>
        <linearGradient id={`${k}-flame-bg`} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor={c.accent} stopOpacity="0.4"/>
          <stop offset="60%" stopColor={c.primary} stopOpacity="0.5"/>
          <stop offset="100%" stopColor={c.ember} stopOpacity="0.2"/>
        </linearGradient>
        <radialGradient id={`${k}-skin`} cx="30%" cy="25%" r="80%">
          <stop offset="0%" stopColor="#FFE4C7"/>
          <stop offset="60%" stopColor="#F0C399"/>
          <stop offset="100%" stopColor="#A86B43"/>
        </radialGradient>
        <radialGradient id={`${k}-hair`} cx="50%" cy="20%" r="70%">
          <stop offset="0%" stopColor="#3a2a2a"/>
          <stop offset="50%" stopColor="#1c1014"/>
          <stop offset="100%" stopColor="#000"/>
        </radialGradient>
        <linearGradient id={`${k}-shirt`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c.secondary}/>
          <stop offset="50%" stopColor={c.primary}/>
          <stop offset="100%" stopColor={c.ember}/>
        </linearGradient>
        <linearGradient id={`${k}-pants`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2a1820"/>
          <stop offset="100%" stopColor="#0a0608"/>
        </linearGradient>
        <linearGradient id={`${k}-bolt`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFF099"/>
          <stop offset="50%" stopColor="#FFE15C"/>
          <stop offset="100%" stopColor="#D89A12"/>
        </linearGradient>
        <filter id={`${k}-blur`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5"/>
        </filter>
        <filter id={`${k}-soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6"/>
        </filter>
      </defs>

      {/* Aura */}
      <circle cx="100" cy="105" r="92" fill={`url(#${k}-aura)`}/>

      {/* Flame backlight */}
      <g filter={`url(#${k}-soft)`} opacity="0.8">
        <path d="M 100 30 Q 60 60 50 105 Q 45 150 75 178 L 125 178 Q 155 150 150 105 Q 140 60 100 30 Z" fill={`url(#${k}-flame-bg)`}/>
      </g>

      {/* FOOT FLAMES */}
      <g>
        <path d="M 58 168 Q 64 154 70 168 Q 72 178 66 180 Q 60 178 58 168 Z" fill={c.primary}/>
        <path d="M 60 170 Q 64 160 68 170 Q 68 176 64 176 Q 60 176 60 170 Z" fill={c.accent}/>
        <path d="M 132 168 Q 138 154 144 168 Q 146 178 140 180 Q 134 178 132 168 Z" fill={c.primary}/>
        <path d="M 134 170 Q 138 160 142 170 Q 142 176 138 176 Q 134 176 134 170 Z" fill={c.accent}/>
      </g>

      {/* PANTS / LEGS */}
      <g>
        <path d="M 80 140 Q 75 160 70 178 L 88 180 Q 92 160 92 142 Z" fill={`url(#${k}-pants)`} stroke="#000" strokeWidth="1"/>
        <path d="M 108 142 Q 108 160 112 180 L 130 178 Q 125 160 120 140 Z" fill={`url(#${k}-pants)`} stroke="#000" strokeWidth="1"/>
        {/* Pant highlights */}
        <path d="M 82 145 Q 80 160 76 174" stroke={c.primary} strokeWidth="1.5" fill="none" opacity="0.5"/>
        <path d="M 122 145 Q 124 160 128 174" stroke={c.primary} strokeWidth="1.5" fill="none" opacity="0.5"/>
        {/* Shoes */}
        <ellipse cx="80" cy="180" rx="13" ry="5" fill={`url(#${k}-shirt)`} stroke="#000" strokeWidth="1"/>
        <ellipse cx="120" cy="180" rx="13" ry="5" fill={`url(#${k}-shirt)`} stroke="#000" strokeWidth="1"/>
        {/* Shoe laces */}
        <line x1="76" y1="179" x2="84" y2="179" stroke="#fff" strokeWidth="0.8"/>
        <line x1="116" y1="179" x2="124" y2="179" stroke="#fff" strokeWidth="0.8"/>
      </g>

      {/* ARMS — battle stance */}
      {/* Left arm raised */}
      <g>
        <path d="M 70 108 Q 52 112 46 130 L 56 138 Q 66 124 75 116 Z" fill={`url(#${k}-shirt)`} stroke="#000" strokeWidth="1"/>
        {/* Fist */}
        <circle cx="50" cy="135" r="11" fill={`url(#${k}-skin)`} stroke="#B88A5E" strokeWidth="1"/>
        <path d="M 44 132 L 48 132 M 44 136 L 48 136" stroke="#A86B43" strokeWidth="0.8"/>
        <ellipse cx="48" cy="131" rx="4" ry="2" fill="#FFE4C7" opacity="0.6"/>
      </g>
      {/* Right arm */}
      <g>
        <path d="M 130 108 Q 148 112 154 130 L 144 138 Q 134 124 125 116 Z" fill={`url(#${k}-shirt)`} stroke="#000" strokeWidth="1"/>
        <circle cx="150" cy="135" r="11" fill={`url(#${k}-skin)`} stroke="#B88A5E" strokeWidth="1"/>
        <path d="M 152 132 L 156 132 M 152 136 L 156 136" stroke="#A86B43" strokeWidth="0.8"/>
        <ellipse cx="152" cy="131" rx="4" ry="2" fill="#FFE4C7" opacity="0.6"/>
      </g>

      {/* SHIRT body */}
      <path d="M 72 92 Q 66 130 78 148 L 122 148 Q 134 130 128 92 Q 100 86 72 92 Z"
            fill={`url(#${k}-shirt)`} stroke="#000" strokeWidth="1.5"/>
      {/* Shirt highlight */}
      <path d="M 78 95 Q 73 120 80 138 L 86 138 Q 82 118 84 96 Z" fill="#fff" opacity="0.15"/>
      {/* Shirt shadow under arms */}
      <path d="M 122 95 Q 128 120 122 138" stroke="#000" strokeWidth="2" fill="none" opacity="0.3"/>
      {/* Belt of pants */}
      <rect x="78" y="138" width="44" height="6" fill="#0a0608"/>
      <circle cx="100" cy="141" r="3" fill={c.accent}/>

      {/* LIGHTNING BOLT */}
      <g>
        <path d="M 105 96 L 92 124 L 100 124 L 95 142 L 110 110 L 102 110 L 108 96 Z"
              fill={`url(#${k}-bolt)`} stroke="#000" strokeWidth="1.2"/>
        {/* Bolt highlight */}
        <path d="M 104 100 L 96 118 L 100 118 L 98 130 L 106 115 L 102 115 L 105 100 Z" fill="#FFF8D9" opacity="0.7"/>
      </g>

      {/* NECK */}
      <path d="M 92 78 L 92 92 Q 100 96 108 92 L 108 78 Z" fill={`url(#${k}-skin)`}/>
      <path d="M 92 80 Q 100 84 108 80" fill="none" stroke="#B88A5E" strokeWidth="0.8" opacity="0.6"/>

      {/* HEAD */}
      <ellipse cx="100" cy="62" rx="28" ry="30" fill={`url(#${k}-skin)`} stroke="#B88A5E" strokeWidth="1.2"/>
      {/* Head highlight */}
      <ellipse cx="88" cy="50" rx="9" ry="13" fill="#FFE4C7" opacity="0.7" filter={`url(#${k}-blur)`}/>
      {/* Ears */}
      <ellipse cx="74" cy="64" rx="4" ry="6" fill={`url(#${k}-skin)`} stroke="#B88A5E" strokeWidth="1"/>
      <ellipse cx="126" cy="64" rx="4" ry="6" fill={`url(#${k}-skin)`} stroke="#B88A5E" strokeWidth="1"/>

      {/* SPIKY HAIR — wild radiating spikes */}
      <g fill={`url(#${k}-hair)`} stroke="#000" strokeWidth="1">
        {/* Center main spikes */}
        <path d="M 72 60 L 74 38 L 82 50 L 86 28 L 90 48 L 96 22 L 100 46 L 104 22 L 110 48 L 114 28 L 118 50 L 126 38 L 128 60 Q 122 52 110 50 Q 100 48 90 50 Q 78 52 72 60 Z"/>
        {/* Side strands */}
        <path d="M 70 52 L 64 36 L 70 50 Z"/>
        <path d="M 130 52 L 136 36 L 130 50 Z"/>
        {/* Bangs falling over forehead */}
        <path d="M 80 48 L 86 60 L 92 50 L 96 62 L 100 50 L 104 62 L 108 50 L 114 60 L 120 48"
              fill="none" stroke="#000" strokeWidth="1.5"/>
      </g>
      {/* Hair highlight streaks */}
      <g stroke={c.primary} strokeWidth="1.5" fill="none" opacity="0.6" strokeLinecap="round">
        <path d="M 92 30 L 96 42"/>
        <path d="M 106 32 L 102 44"/>
      </g>

      {/* EYEBROWS — fierce, slanted down */}
      <path d="M 82 56 L 95 60" stroke="#000" strokeWidth="3" strokeLinecap="round"/>
      <path d="M 118 56 L 105 60" stroke="#000" strokeWidth="3" strokeLinecap="round"/>

      {/* EYES — big determined */}
      <g>
        {/* Eye whites */}
        <ellipse cx="89" cy="65" rx="5" ry="6" fill="#fff" stroke="#000" strokeWidth="1"/>
        <ellipse cx="111" cy="65" rx="5" ry="6" fill="#fff" stroke="#000" strokeWidth="1"/>
        {/* Pupils with fierce shape */}
        <ellipse cx="89" cy="66" rx="3" ry="4" fill="#0a0a14"/>
        <ellipse cx="111" cy="66" rx="3" ry="4" fill="#0a0a14"/>
        {/* Iris hint of color */}
        <circle cx="89" cy="65" r="1.5" fill={c.primary} opacity="0.5"/>
        <circle cx="111" cy="65" r="1.5" fill={c.primary} opacity="0.5"/>
        {/* Specular highlights */}
        <circle cx="90" cy="63" r="1.2" fill="#fff"/>
        <circle cx="112" cy="63" r="1.2" fill="#fff"/>
        <circle cx="88" cy="67" r="0.5" fill="#fff"/>
        <circle cx="110" cy="67" r="0.5" fill="#fff"/>
      </g>

      {/* Nose hint */}
      <path d="M 100 70 L 99 74 L 101 74 Z" fill="#B88A5E" opacity="0.5"/>

      {/* Cheek blush from exertion */}
      <ellipse cx="82" cy="74" rx="5" ry="3" fill={c.primary} opacity="0.35"/>
      <ellipse cx="118" cy="74" rx="5" ry="3" fill={c.primary} opacity="0.35"/>

      {/* SHOUTING MOUTH */}
      <g>
        <path d="M 92 80 Q 100 90 108 80 Q 104 88 100 88 Q 96 88 92 80 Z" fill="#3a0a0f" stroke="#000" strokeWidth="1.2"/>
        {/* Teeth top */}
        <path d="M 93 81 L 107 81 L 105 84 L 95 84 Z" fill="#fff"/>
        <line x1="100" y1="81" x2="100" y2="84" stroke="#aaa" strokeWidth="0.5"/>
        {/* Tongue */}
        <ellipse cx="100" cy="86" rx="4" ry="2" fill="#cc5555"/>
      </g>

      {/* Energy sparks around */}
      <g filter={`url(#${k}-blur)`}>
        <path d="M 30 100 L 28 105 L 32 103 L 30 108 L 36 102 L 32 102 Z" fill="#FFE15C"/>
        <path d="M 168 90 L 166 95 L 170 93 L 168 98 L 174 92 L 170 92 Z" fill="#FFE15C"/>
      </g>
      <g fill={c.ember} filter={`url(#${k}-blur)`}>
        <circle cx="35" cy="130" r="2.5"/>
        <circle cx="165" cy="125" r="2.5"/>
        <circle cx="40" cy="60" r="2"/>
        <circle cx="160" cy="65" r="2"/>
      </g>
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────
// BUDDY — The Friendly Pal (cute astronaut robot)
// ────────────────────────────────────────────────────────────────
function Buddy({ theme = 'solar', size = 200 }) {
  const c = THEMES[theme];
  const k = `bd${theme}`;
  const heart = theme === 'solar' ? '#22D39E' : theme === 'lunar' ? c.primary : c.primary;
  const heartDark = theme === 'solar' ? '#0F8A65' : theme === 'lunar' ? c.ember : c.ember;
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      <defs>
        <radialGradient id={`${k}-aura`} cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor={heart} stopOpacity="0.4"/>
          <stop offset="60%" stopColor={c.glow} stopOpacity="0.2"/>
          <stop offset="100%" stopColor={c.primary} stopOpacity="0"/>
        </radialGradient>
        <radialGradient id={`${k}-suit`} cx="35%" cy="25%" r="85%">
          <stop offset="0%" stopColor="#FAFAF6"/>
          <stop offset="50%" stopColor="#E5E2D8"/>
          <stop offset="100%" stopColor="#A8A498"/>
        </radialGradient>
        <radialGradient id={`${k}-helmet`} cx="35%" cy="20%" r="80%">
          <stop offset="0%" stopColor="#FAFAF6"/>
          <stop offset="60%" stopColor="#E5E2D8"/>
          <stop offset="100%" stopColor="#B8B4A8"/>
        </radialGradient>
        <radialGradient id={`${k}-visor`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor={c.glow} stopOpacity="0.5"/>
          <stop offset="40%" stopColor="#1a2540"/>
          <stop offset="100%" stopColor="#0a1020"/>
        </radialGradient>
        <radialGradient id={`${k}-heart`}>
          <stop offset="0%" stopColor={c.spark}/>
          <stop offset="40%" stopColor={heart}/>
          <stop offset="100%" stopColor={heartDark}/>
        </radialGradient>
        <filter id={`${k}-blur`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2"/>
        </filter>
        <filter id={`${k}-soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4"/>
        </filter>
      </defs>

      {/* Aura */}
      <circle cx="100" cy="105" r="90" fill={`url(#${k}-aura)`}/>

      {/* Soft heart glow */}
      <ellipse cx="100" cy="130" rx="22" ry="18" fill={heart} opacity="0.3" filter={`url(#${k}-soft)`}/>

      {/* LEGS */}
      <g>
        <rect x="78" y="150" width="18" height="32" rx="6" fill={`url(#${k}-suit)`} stroke="#A8A498" strokeWidth="1.2"/>
        <rect x="104" y="150" width="18" height="32" rx="6" fill={`url(#${k}-suit)`} stroke="#A8A498" strokeWidth="1.2"/>
        {/* Knee joints */}
        <circle cx="87" cy="162" r="4" fill={heart} stroke={heartDark} strokeWidth="0.8"/>
        <circle cx="113" cy="162" r="4" fill={heart} stroke={heartDark} strokeWidth="0.8"/>
        <circle cx="87" cy="162" r="2" fill={c.spark} opacity="0.8"/>
        <circle cx="113" cy="162" r="2" fill={c.spark} opacity="0.8"/>
        {/* Leg shading */}
        <rect x="78" y="150" width="4" height="30" fill="#fff" opacity="0.3" rx="2"/>
        <rect x="104" y="150" width="4" height="30" fill="#fff" opacity="0.3" rx="2"/>
        {/* Boots */}
        <ellipse cx="87" cy="182" rx="12" ry="5" fill="#A8A498"/>
        <ellipse cx="113" cy="182" rx="12" ry="5" fill="#A8A498"/>
        <ellipse cx="85" cy="180" rx="4" ry="1.5" fill="#fff" opacity="0.5"/>
        <ellipse cx="111" cy="180" rx="4" ry="1.5" fill="#fff" opacity="0.5"/>
      </g>

      {/* RIGHT ARM (waving!) */}
      <g>
        <path d="M 130 100 Q 152 80 158 55 L 166 60 Q 162 88 142 110 Z" fill={`url(#${k}-suit)`} stroke="#A8A498" strokeWidth="1.2"/>
        <path d="M 132 102 Q 150 88 156 70" stroke="#fff" strokeWidth="2" fill="none" opacity="0.5"/>
        {/* Wrist joint */}
        <circle cx="160" cy="58" r="4" fill={heart} stroke={heartDark} strokeWidth="0.8"/>
        {/* Hand (mitten shape) */}
        <ellipse cx="158" cy="55" rx="12" ry="11" fill={`url(#${k}-suit)`} stroke="#A8A498" strokeWidth="1.2"/>
        {/* Thumb */}
        <ellipse cx="150" cy="50" rx="4" ry="5" fill={`url(#${k}-suit)`} stroke="#A8A498" strokeWidth="1"/>
        <ellipse cx="156" cy="52" rx="5" ry="2" fill="#fff" opacity="0.4"/>
      </g>

      {/* LEFT ARM */}
      <g>
        <path d="M 70 100 Q 55 115 50 138 L 60 142 Q 66 122 76 116 Z" fill={`url(#${k}-suit)`} stroke="#A8A498" strokeWidth="1.2"/>
        <circle cx="55" cy="140" r="4" fill={heart} stroke={heartDark} strokeWidth="0.8"/>
        <ellipse cx="55" cy="142" rx="10" ry="9" fill={`url(#${k}-suit)`} stroke="#A8A498" strokeWidth="1.2"/>
        <ellipse cx="53" cy="140" rx="3" ry="2" fill="#fff" opacity="0.4"/>
      </g>

      {/* BODY */}
      <path d="M 72 88 Q 65 132 76 156 L 124 156 Q 135 132 128 88 Q 100 82 72 88 Z"
            fill={`url(#${k}-suit)`} stroke="#A8A498" strokeWidth="1.5"/>
      {/* Body chest panel */}
      <path d="M 80 95 Q 76 130 82 150 L 118 150 Q 124 130 120 95 Q 100 92 80 95 Z" fill="#fff" opacity="0.4"/>
      {/* Body side shadow */}
      <path d="M 122 95 Q 128 130 120 150" stroke="#A8A498" strokeWidth="2" fill="none" opacity="0.5"/>
      {/* Stripe chest */}
      <rect x="80" y="103" width="40" height="2.5" fill={heart} opacity="0.7"/>
      <rect x="80" y="153" width="40" height="2.5" fill={heart} opacity="0.7"/>

      {/* HEART CHEST EMBLEM */}
      <g>
        {/* Heart glow */}
        <circle cx="100" cy="130" r="14" fill={heart} opacity="0.4" filter={`url(#${k}-blur)`}/>
        {/* Heart shape */}
        <path d="M 100 128 C 92 116 78 122 84 134 C 88 142 100 150 100 150 C 100 150 112 142 116 134 C 122 122 108 116 100 128 Z"
              fill={`url(#${k}-heart)`} stroke={heartDark} strokeWidth="1"/>
        {/* Heart highlight */}
        <ellipse cx="91" cy="128" rx="3" ry="4" fill="#fff" opacity="0.7"/>
      </g>

      {/* HELMET (glass dome) */}
      <g>
        {/* Helmet ring/base */}
        <ellipse cx="100" cy="82" rx="38" ry="6" fill="#A8A498"/>
        <ellipse cx="100" cy="82" rx="36" ry="4" fill="#fff" opacity="0.3"/>
        {/* Glass dome */}
        <ellipse cx="100" cy="60" rx="38" ry="38" fill={`url(#${k}-helmet)`} stroke="#A8A498" strokeWidth="1.5"/>
        {/* Glass highlight (large) */}
        <ellipse cx="84" cy="42" rx="12" ry="18" fill="#fff" opacity="0.5" transform="rotate(-25 84 42)"/>
        {/* Glass highlight (small) */}
        <ellipse cx="118" cy="42" rx="3" ry="5" fill="#fff" opacity="0.8" transform="rotate(20 118 42)"/>

        {/* Visor screen (inner dark area showing face) */}
        <path d="M 76 56 Q 76 38 100 36 Q 124 38 124 56 Q 124 78 100 80 Q 76 78 76 56 Z"
              fill={`url(#${k}-visor)`} stroke="#5a5a5a" strokeWidth="0.8"/>

        {/* CUTE EYES — happy */}
        <g>
          {/* Eye glow */}
          <ellipse cx="88" cy="58" rx="6" ry="5" fill={heart} opacity="0.5" filter={`url(#${k}-blur)`}/>
          <ellipse cx="112" cy="58" rx="6" ry="5" fill={heart} opacity="0.5" filter={`url(#${k}-blur)`}/>
          {/* Happy closed eyes */}
          <path d="M 84 60 Q 88 53 92 60 Q 88 64 84 60 Z" fill={c.spark}/>
          <path d="M 108 60 Q 112 53 116 60 Q 112 64 108 60 Z" fill={c.spark}/>
          {/* Eye sparkle */}
          <circle cx="89" cy="58" r="0.8" fill="#fff"/>
          <circle cx="113" cy="58" r="0.8" fill="#fff"/>
        </g>

        {/* Big friendly smile */}
        <path d="M 90 68 Q 100 76 110 68" fill="none" stroke={c.spark} strokeWidth="2.5" strokeLinecap="round"/>
        {/* Cheek blush */}
        <ellipse cx="83" cy="68" rx="3" ry="2" fill={c.primary} opacity="0.5"/>
        <ellipse cx="117" cy="68" rx="3" ry="2" fill={c.primary} opacity="0.5"/>

        {/* HELMET LIGHT/CAMERA */}
        <circle cx="100" cy="32" r="4" fill="#A8A498" stroke="#888" strokeWidth="0.8"/>
        <circle cx="100" cy="32" r="2.5" fill={heart}/>
        <circle cx="100" cy="32" r="1.2" fill={c.spark}/>
      </g>

      {/* ANTENNA */}
      <g>
        <line x1="100" y1="22" x2="100" y2="12" stroke="#A8A498" strokeWidth="2"/>
        <circle cx="100" cy="10" r="3.5" fill={heart}/>
        <circle cx="100" cy="10" r="2" fill={c.spark}/>
        <circle cx="100" cy="10" r="6" fill={heart} opacity="0.4" filter={`url(#${k}-blur)`}/>
      </g>

      {/* SPARKLES around */}
      <g fill={c.spark}>
        <path d="M 35 60 L 37 64 L 41 66 L 37 68 L 35 72 L 33 68 L 29 66 L 33 64 Z" opacity="0.8"/>
        <path d="M 165 100 L 167 104 L 171 106 L 167 108 L 165 112 L 163 108 L 159 106 L 163 104 Z" opacity="0.8"/>
        <path d="M 30 130 L 31 132 L 33 133 L 31 134 L 30 136 L 29 134 L 27 133 L 29 132 Z" opacity="0.6"/>
        <path d="M 170 50 L 171 52 L 173 53 L 171 54 L 170 56 L 169 54 L 167 53 L 169 52 Z" opacity="0.6"/>
      </g>
      <g fill={heart} filter={`url(#${k}-blur)`}>
        <circle cx="50" cy="170" r="2"/>
        <circle cx="150" cy="170" r="2"/>
      </g>
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────
// COSMIC SAGE — The Wise Guide (hooded mage)
// ────────────────────────────────────────────────────────────────
function CosmicSage({ theme = 'solar', size = 200 }) {
  const c = THEMES[theme];
  const k = `sg${theme}`;
  const robeColors = theme === 'solar' ? ['#3D1F4A','#1F0F26','#6B3D7E'] : theme === 'lunar' ? ['#1A2752','#0A132E','#3D5B9C'] : ['#2D1248','#180625','#5A2D8A'];
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      <defs>
        <radialGradient id={`${k}-aura`} cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor={c.glow} stopOpacity="0.5"/>
          <stop offset="40%" stopColor={c.primary} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={c.primary} stopOpacity="0"/>
        </radialGradient>
        <radialGradient id={`${k}-robe`} cx="40%" cy="30%" r="85%">
          <stop offset="0%" stopColor={robeColors[2]}/>
          <stop offset="50%" stopColor={robeColors[0]}/>
          <stop offset="100%" stopColor={robeColors[1]}/>
        </radialGradient>
        <radialGradient id={`${k}-hood`} cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#000"/>
          <stop offset="60%" stopColor="#000"/>
          <stop offset="100%" stopColor={robeColors[1]}/>
        </radialGradient>
        <radialGradient id={`${k}-crystal`}>
          <stop offset="0%" stopColor={c.spark}/>
          <stop offset="40%" stopColor={c.accent}/>
          <stop offset="100%" stopColor={c.primary}/>
        </radialGradient>
        <linearGradient id={`${k}-staff`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8B6F47"/>
          <stop offset="50%" stopColor="#5C4128"/>
          <stop offset="100%" stopColor="#382712"/>
        </linearGradient>
        <filter id={`${k}-blur`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5"/>
        </filter>
        <filter id={`${k}-soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5"/>
        </filter>
        <filter id={`${k}-bigGlow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8"/>
        </filter>
      </defs>

      {/* Aura */}
      <circle cx="100" cy="110" r="95" fill={`url(#${k}-aura)`}/>

      {/* COSMIC SWIRL background */}
      <g opacity="0.6" filter={`url(#${k}-soft)`}>
        <path d="M 100 30 Q 145 60 150 100 Q 145 145 100 170 Q 55 145 50 100 Q 55 60 100 30 Z"
              fill="none" stroke={c.primary} strokeWidth="2" strokeDasharray="3 8"/>
      </g>

      {/* Starfield */}
      <g fill={c.spark}>
        <circle cx="32" cy="48" r="1.5"/>
        <circle cx="168" cy="38" r="2"/>
        <circle cx="172" cy="98" r="1.5"/>
        <circle cx="36" cy="128" r="2"/>
        <circle cx="158" cy="148" r="1.5"/>
        <circle cx="28" cy="90" r="1"/>
        <circle cx="174" cy="65" r="1"/>
        <path d="M 30 75 L 32 79 L 36 81 L 32 83 L 30 87 L 28 83 L 24 81 L 28 79 Z" opacity="0.7"/>
        <path d="M 170 120 L 172 124 L 176 126 L 172 128 L 170 132 L 168 128 L 164 126 L 168 124 Z" opacity="0.7"/>
        <path d="M 50 35 L 51 37 L 53 38 L 51 39 L 50 41 L 49 39 L 47 38 L 49 37 Z" opacity="0.6"/>
      </g>

      {/* SLEEVE LEFT (resting at side) */}
      <path d="M 70 105 Q 60 130 65 160 L 80 158 Q 78 130 84 110 Z" fill={`url(#${k}-robe)`} stroke={robeColors[1]} strokeWidth="1.5"/>

      {/* SLEEVE RIGHT (holding staff) */}
      <path d="M 130 105 Q 144 95 152 80 L 158 88 Q 152 110 138 122 Z" fill={`url(#${k}-robe)`} stroke={robeColors[1]} strokeWidth="1.5"/>

      {/* STAFF */}
      <g>
        <line x1="158" y1="30" x2="140" y2="175" stroke={`url(#${k}-staff)`} strokeWidth="4" strokeLinecap="round"/>
        {/* Staff bindings */}
        <ellipse cx="155" cy="50" rx="4" ry="2" fill="#5C4128"/>
        <ellipse cx="150" cy="90" rx="4" ry="2" fill="#5C4128"/>
        <ellipse cx="145" cy="130" rx="3.5" ry="2" fill="#5C4128"/>
      </g>

      {/* CRYSTAL on top of staff */}
      <g>
        {/* Big glow */}
        <circle cx="158" cy="28" r="14" fill={c.glow} opacity="0.6" filter={`url(#${k}-bigGlow)`}/>
        {/* Inner glow */}
        <circle cx="158" cy="28" r="9" fill={c.accent} opacity="0.5" filter={`url(#${k}-blur)`}/>
        {/* Crystal core */}
        <path d="M 158 16 L 165 28 L 158 42 L 151 28 Z" fill={`url(#${k}-crystal)`} stroke={c.primary} strokeWidth="0.8"/>
        {/* Crystal highlight */}
        <path d="M 158 18 L 161 28 L 158 38 L 156 28 Z" fill="#fff" opacity="0.6"/>
        <path d="M 158 18 L 158 28" stroke="#fff" strokeWidth="0.8"/>
        {/* Magic swirl */}
        <path d="M 150 50 Q 175 50 170 75 Q 168 80 162 72 Q 160 65 168 60" fill="none" stroke={c.secondary} strokeWidth="1.5" opacity="0.6" strokeLinecap="round"/>
      </g>

      {/* ROBE BODY (wide cloak) */}
      <path d="M 56 178 Q 48 150 54 110 Q 65 78 100 70 Q 135 78 146 110 Q 152 150 144 178 Z"
            fill={`url(#${k}-robe)`} stroke={robeColors[1]} strokeWidth="2"/>
      {/* Robe inner darker fold */}
      <path d="M 76 178 Q 70 150 78 122 L 122 122 Q 130 150 124 178 Z" fill={robeColors[1]} opacity="0.6"/>
      {/* Robe outer highlight (rim light) */}
      <path d="M 56 178 Q 48 150 54 110 Q 60 92 70 84" stroke={c.primary} strokeWidth="2" fill="none" opacity="0.5"/>
      {/* Center fold lines */}
      <path d="M 100 95 L 100 178" stroke={robeColors[1]} strokeWidth="1.5" opacity="0.5"/>

      {/* BELT/SASH */}
      <path d="M 70 130 Q 100 140 130 130 L 128 140 Q 100 148 72 140 Z" fill={c.secondary}/>
      {/* Belt buckle */}
      <circle cx="100" cy="138" r="5" fill={c.dark}/>
      <circle cx="100" cy="138" r="3.5" fill={c.accent}/>
      <circle cx="100" cy="138" r="2" fill={c.spark}/>
      <circle cx="100" cy="138" r="7" fill={c.accent} opacity="0.5" filter={`url(#${k}-blur)`}/>

      {/* HOOD (outer) */}
      <g>
        <path d="M 64 95 Q 56 60 100 48 Q 144 60 136 95 Q 138 110 126 116 L 74 116 Q 62 110 64 95 Z"
              fill={`url(#${k}-robe)`} stroke={robeColors[1]} strokeWidth="2"/>
        {/* Hood tip */}
        <path d="M 100 50 L 88 32 Q 100 22 112 32 Z" fill={`url(#${k}-robe)`} stroke={robeColors[1]} strokeWidth="2"/>
        <path d="M 100 50 L 92 36 Q 100 30 108 36 Z" fill={robeColors[1]}/>
        {/* Hood rim light */}
        <path d="M 64 95 Q 56 60 100 48" stroke={c.primary} strokeWidth="2" fill="none" opacity="0.6"/>
        {/* Hood rim accent */}
        <path d="M 70 105 Q 100 96 130 105" stroke={c.secondary} strokeWidth="2" fill="none" opacity="0.8"/>
      </g>

      {/* HOOD INNER SHADOW (face cavity) */}
      <ellipse cx="100" cy="90" rx="26" ry="28" fill={`url(#${k}-hood)`}/>
      <ellipse cx="100" cy="92" rx="22" ry="24" fill="#000"/>

      {/* GLOWING FACE inside hood */}
      <g>
        {/* Face glow halo */}
        <ellipse cx="100" cy="92" rx="18" ry="18" fill={c.glow} opacity="0.4" filter={`url(#${k}-blur)`}/>

        {/* GLOWING EYES — large */}
        <g>
          <ellipse cx="92" cy="88" rx="8" ry="6" fill={c.glow} opacity="0.6" filter={`url(#${k}-blur)`}/>
          <ellipse cx="108" cy="88" rx="8" ry="6" fill={c.glow} opacity="0.6" filter={`url(#${k}-blur)`}/>
          {/* Cute closed/squinting smile eyes */}
          <path d="M 88 88 Q 92 84 96 88 Q 92 92 88 88 Z" fill={c.spark}/>
          <path d="M 104 88 Q 108 84 112 88 Q 108 92 104 88 Z" fill={c.spark}/>
          {/* Eye sparkles */}
          <circle cx="92" cy="87" r="1" fill="#fff"/>
          <circle cx="108" cy="87" r="1" fill="#fff"/>
        </g>

        {/* Mystic smile */}
        <path d="M 92 100 Q 100 106 108 100" fill="none" stroke={c.accent} strokeWidth="2.5" strokeLinecap="round"/>

        {/* Wisdom mark on forehead */}
        <circle cx="100" cy="78" r="2.5" fill={c.spark}/>
        <circle cx="100" cy="78" r="5" fill={c.accent} opacity="0.5" filter={`url(#${k}-blur)`}/>
      </g>

      {/* Foreground magic dust */}
      <g fill={c.spark} opacity="0.9">
        <circle cx="60" cy="155" r="1.5"/>
        <circle cx="65" cy="170" r="1"/>
        <circle cx="55" cy="138" r="1"/>
        <circle cx="135" cy="158" r="1.5"/>
        <circle cx="142" cy="170" r="1"/>
      </g>
      <g filter={`url(#${k}-blur)`}>
        <circle cx="40" cy="155" r="3" fill={c.primary} opacity="0.7"/>
        <circle cx="158" cy="65" r="3" fill={c.secondary} opacity="0.7"/>
      </g>
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────
const COMPANIONS = [
  { id:'zenith',  Comp: Zenith,      name:'Zenith',       role:'The Challenger',     tags:['Focused','Competitive'], color:'#FF6B2B', quotes:[
    "Beast mode: ON. Let's outrun yesterday.",
    "Champions are made on slow days. Show up.",
    "Pace is just fear in disguise. Crush it." ]},
  { id:'monk',    Comp: Monk,        name:'Monk',         role:'The Mindful Mentor', tags:['Calm','Mindful'],        color:'#22D39E', quotes:[
    "Breathe in strength, breathe out doubt.",
    "Slow is smooth. Smooth is fast. Trust the rhythm.",
    "One mindful step beats a thousand rushed ones." ]},
  { id:'beast',   Comp: Beast,       name:'Beast',        role:'The Discipline Beast',tags:['Strong','Determined'],   color:'#E74C3C', quotes:[
    "No excuses. Just movement. Now.",
    "Discipline is doing it when no one's watching.",
    "Your limits are lying. Push." ]},
  { id:'furious', Comp: FuriousBoy,  name:'Furious',      role:'The Firestarter',    tags:['Energetic','Intense'],   color:'#FF8800', quotes:[
    "CHALO! Let's light up the streets!",
    "Energy levels: maximum. Let's GO!",
    "Power up — the day is yours to claim." ]},
  { id:'buddy',   Comp: Buddy,       name:'Buddy',        role:'The Friendly Pal',   tags:['Supportive','Positive'], color:'#22D39E', quotes:[
    "Hey champ! Even one extra step counts. 💚",
    "I'm proud of you. Seriously.",
    "Whatever you did today — it's enough." ]},
  { id:'sage',    Comp: CosmicSage,  name:'Cosmic Sage',  role:'The Wise Guide',     tags:['Wise','Insightful'],     color:'#A855F7', quotes:[
    "Rest is part of the run, young one.",
    "Your body whispers before it shouts. Listen.",
    "Tomorrow's strength is built in today's calm." ]},
];

Object.assign(window, {
  Zenith, Monk, Beast, FuriousBoy, Buddy, CosmicSage,
  COMPANIONS, COMPANION_THEMES: THEMES,
});
