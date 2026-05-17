import React from 'react';
import { Image, ViewStyle, StyleProp, View } from 'react-native';
import Svg, { 
  Circle, 
  Ellipse, 
  Path, 
  Defs, 
  RadialGradient, 
  LinearGradient, 
  Stop, 
  G, 
  Rect, 
  Line 
} from 'react-native-svg';

export const MASCOT_THEMES = {
  solar:  { primary:'#FF6B2B', secondary:'#FFB347', glow:'#FF8C42', accent:'#FFD27D', spark:'#FFE5A8', dark:'#2A0F05', ember:'#FF3A1A' },
  lunar:  { primary:'#5EA0FF', secondary:'#7CD4FF', glow:'#8FC4FF', accent:'#B8E0FF', spark:'#E6F2FF', dark:'#08132A', ember:'#3D7BD8' },
  nebula: { primary:'#C026D3', secondary:'#EC4899', glow:'#D946EF', accent:'#F0ABFC', spark:'#FCE7FF', dark:'#1A0828', ember:'#9D2EC8' },
};

export type MascotTheme = keyof typeof MASCOT_THEMES;

interface MascotProps {
  theme?: MascotTheme;
  size?: number;
}

// ────────────────────────────────────────────────────────────────
// ZENITH — The Challenger (energy robot warrior)
// ────────────────────────────────────────────────────────────────
// ... rest of Zenith component ...
export function Zenith({ theme = 'solar', size = 200 }: MascotProps) {
  const c = MASCOT_THEMES[theme];
  const k = `zn${theme}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <RadialGradient id={`${k}-aura`} cx="50%" cy="55%" r="55%">
          <Stop offset="0%" stopColor={c.glow} stopOpacity="0.55"/>
          <Stop offset="50%" stopColor={c.primary} stopOpacity="0.25"/>
          <Stop offset="100%" stopColor={c.primary} stopOpacity="0"/>
        </RadialGradient>
        <RadialGradient id={`${k}-body`} cx="40%" cy="30%" r="80%">
          <Stop offset="0%" stopColor="#3a3a48"/>
          <Stop offset="50%" stopColor="#1c1c28"/>
          <Stop offset="100%" stopColor="#08080F"/>
        </RadialGradient>
        <RadialGradient id={`${k}-head`} cx="35%" cy="25%" r="75%">
          <Stop offset="0%" stopColor="#52525e"/>
          <Stop offset="55%" stopColor="#1d1d2a"/>
          <Stop offset="100%" stopColor="#08080F"/>
        </RadialGradient>
        <LinearGradient id={`${k}-flame`} x1="50%" y1="0%" x2="50%" y2="100%">
          <Stop offset="0%" stopColor={c.accent}/>
          <Stop offset="50%" stopColor={c.primary}/>
          <Stop offset="100%" stopColor={c.ember}/>
        </LinearGradient>
        <RadialGradient id={`${k}-visor`} cx="50%" cy="35%" r="65%">
          <Stop offset="0%" stopColor={c.accent} stopOpacity="0.9"/>
          <Stop offset="40%" stopColor={c.primary} stopOpacity="0.4"/>
          <Stop offset="100%" stopColor="#000" stopOpacity="0.6"/>
        </RadialGradient>
        {/* Note: Filters like feGaussianBlur are not directly supported in react-native-svg without extra steps, 
            so we approximate or omit them for now. We can use opacity and layering for soft effects. */}
      </Defs>

      {/* Aura halo */}
      <Circle cx="100" cy="105" r="92" fill={`url(#${k}-aura)`}/>

      {/* Soft flame trail behind body */}
      <G opacity="0.85">
        <Path d="M 100 175 Q 70 160 75 130 Q 80 100 100 90 Q 120 100 125 130 Q 130 160 100 175 Z" fill={c.primary} opacity={0.6}/>
      </G>

      {/* Back leg */}
      <G>
        <Path d="M 113 140 Q 132 152 138 175 L 124 178 Q 116 158 108 148 Z" fill={`url(#${k}-body)`} stroke={c.dark} strokeWidth="1"/>
        <Path d="M 116 142 Q 128 152 134 168 L 130 169 Q 122 156 114 147 Z" fill={c.primary} opacity={0.4}/>
      </G>

      {/* Front leg (kicking) */}
      <G>
        <Path d="M 88 138 Q 70 150 64 172 L 78 176 Q 86 158 96 145 Z" fill={`url(#${k}-body)`} stroke={c.dark} strokeWidth="1"/>
        <Path d="M 92 140 Q 78 150 72 168 L 76 169 Q 86 154 94 144 Z" fill={c.primary} opacity={0.4}/>
      </G>

      {/* Arms */}
      <Path d="M 60 102 Q 48 118 50 135 L 58 137 Q 62 122 68 110 Z" fill={`url(#${k}-body)`} stroke={c.dark} strokeWidth="1"/>
      <Path d="M 142 100 Q 156 108 158 122 L 150 126 Q 142 116 134 108 Z" fill={`url(#${k}-body)`} stroke={c.dark} strokeWidth="1"/>
      <Circle cx="52" cy="138" r="8" fill={`url(#${k}-body)`} stroke={c.primary} strokeWidth="1.5"/>
      <Circle cx="153" cy="125" r="8" fill={`url(#${k}-body)`} stroke={c.primary} strokeWidth="1.5"/>

      {/* Torso */}
      <Path d="M 73 92 Q 66 125 76 150 L 124 150 Q 134 125 127 92 Q 100 84 73 92 Z"
            fill={`url(#${k}-body)`} stroke={c.primary} strokeWidth="2"/>
      {/* Torso highlight */}
      <Path d="M 78 95 Q 73 115 78 130 L 90 132 Q 86 110 90 96 Z" fill={c.primary} opacity={0.25}/>
      {/* Star core glow */}
      <Circle cx="100" cy="118" r="14" fill={c.glow} opacity={0.4}/>
      {/* Chest star */}
      <Path d="M 100 108 L 104 117 L 113 118 L 106 124 L 109 133 L 100 128 L 91 133 L 94 124 L 87 118 L 96 117 Z"
            fill={`url(#${k}-flame)`}/>
      <Path d="M 100 110 L 102 117 L 100 122 L 98 117 Z" fill="#fff" opacity={0.7}/>

      {/* Head */}
      <Ellipse cx="100" cy="72" rx="32" ry="34" fill={`url(#${k}-head)`} stroke={c.primary} strokeWidth="2.5"/>
      {/* Head rim light */}
      <Ellipse cx="92" cy="58" rx="14" ry="8" fill={c.glow} opacity={0.3}/>
      <Ellipse cx="82" cy="62" rx="4" ry="14" fill={c.primary} opacity={0.5} transform="rotate(-20 82 62)"/>

      {/* Visor frame */}
      <Ellipse cx="100" cy="73" rx="24" ry="15" fill="#0a0a14" stroke={c.primary} strokeWidth="1.5"/>
      {/* Visor glass */}
      <Ellipse cx="100" cy="73" rx="22" ry="13" fill={`url(#${k}-visor)`}/>
      {/* Eye lights */}
      <Ellipse cx="91" cy="73" rx="3.5" ry="4" fill={c.spark}/>
      <Ellipse cx="91" cy="71" rx="2" ry="1.5" fill="#fff"/>
      <Ellipse cx="109" cy="73" rx="3.5" ry="4" fill={c.spark}/>
      <Ellipse cx="109" cy="71" rx="2" ry="1.5" fill="#fff"/>
      {/* Eye glow */}
      <Circle cx="91" cy="73" r="6" fill={c.accent} opacity={0.35}/>
      <Circle cx="109" cy="73" r="6" fill={c.accent} opacity={0.35}/>

      {/* Antenna flame */}
      <G>
        <Ellipse cx="100" cy="32" rx="10" ry="14" fill={c.primary} opacity={0.3}/>
        <Path d="M 100 14 Q 92 22 94 32 Q 96 38 100 36 Q 104 38 106 32 Q 108 22 100 14 Z" fill={`url(#${k}-flame)`}/>
        <Path d="M 100 20 Q 96 26 98 32 Q 100 34 100 32 Q 102 34 102 32 Q 104 26 100 20 Z" fill={c.accent} opacity={0.9}/>
        <Path d="M 100 24 Q 98 28 100 32 Q 102 28 100 24 Z" fill="#fff" opacity={0.9}/>
      </G>
      <Circle cx="100" cy="38" r="2.5" fill={c.spark}/>

      {/* Speed embers around */}
      <G>
        <Circle cx="40" cy="80" r="3" fill={c.primary} opacity={0.7}/>
        <Circle cx="36" cy="100" r="2" fill={c.accent} opacity={0.7}/>
        <Circle cx="44" cy="120" r="2.5" fill={c.primary} opacity={0.6}/>
        <Circle cx="166" cy="70" r="2" fill={c.accent} opacity={0.7}/>
        <Circle cx="168" cy="95" r="3" fill={c.primary} opacity={0.5}/>
      </G>
    </Svg>
  );
}

// ────────────────────────────────────────────────────────────────
// MONK — The Mindful Mentor
// ────────────────────────────────────────────────────────────────
export function Monk({ theme = 'solar', size = 200 }: MascotProps) {
  const c = MASCOT_THEMES[theme];
  const k = `mk${theme}`;
  const robe = theme === 'solar' ? ['#2C5F5D','#1A3D3B','#4A8B85'] : theme === 'lunar' ? ['#1E3A5F','#0C1F3D','#3A6BA8'] : ['#3F2A5A','#231144','#6B4A9C'];
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <RadialGradient id={`${k}-aura`} cx="50%" cy="40%" r="55%">
          <Stop offset="0%" stopColor={c.glow} stopOpacity="0.5"/>
          <Stop offset="50%" stopColor={c.accent} stopOpacity="0.2"/>
          <Stop offset="100%" stopColor={c.primary} stopOpacity="0"/>
        </RadialGradient>
        <RadialGradient id={`${k}-halo`} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={c.spark} stopOpacity="0.9"/>
          <Stop offset="50%" stopColor={c.accent} stopOpacity="0.5"/>
          <Stop offset="100%" stopColor={c.glow} stopOpacity="0"/>
        </RadialGradient>
        <RadialGradient id={`${k}-robe`} cx="35%" cy="30%" r="80%">
          <Stop offset="0%" stopColor={robe[2]}/>
          <Stop offset="60%" stopColor={robe[0]}/>
          <Stop offset="100%" stopColor={robe[1]}/>
        </RadialGradient>
        <RadialGradient id={`${k}-skin`} cx="35%" cy="25%" r="75%">
          <Stop offset="0%" stopColor="#FFE8C9"/>
          <Stop offset="50%" stopColor="#F2D0A0"/>
          <Stop offset="100%" stopColor="#B88A5E"/>
        </RadialGradient>
      </Defs>

      {/* Aura */}
      <Circle cx="100" cy="95" r="92" fill={`url(#${k}-aura)`}/>

      {/* Backlight halo behind head */}
      <Circle cx="100" cy="60" r="42" fill={`url(#${k}-halo)`} opacity={0.9}/>

      {/* Lotus base */}
      <G>
        <Ellipse cx="100" cy="165" rx="62" ry="14" fill={c.primary} opacity={0.15}/>
        <Ellipse cx="100" cy="162" rx="58" ry="12" fill={robe[1]}/>
        <Ellipse cx="100" cy="158" rx="50" ry="9" fill={`url(#${k}-robe)`}/>
        {/* Lotus petals */}
        <Path d="M 60 158 Q 50 148 55 138 Q 65 144 68 158 Z" fill={c.accent} opacity={0.7}/>
        <Path d="M 140 158 Q 150 148 145 138 Q 135 144 132 158 Z" fill={c.accent} opacity={0.7}/>
        <Path d="M 80 162 Q 70 158 70 150 Q 80 152 84 162 Z" fill={c.spark} opacity={0.5}/>
        <Path d="M 120 162 Q 130 158 130 150 Q 120 152 116 162 Z" fill={c.spark} opacity={0.5}/>
      </G>

      {/* Crossed legs (folded robes) */}
      <Path d="M 55 155 Q 50 135 60 120 Q 75 110 100 110 Q 125 110 140 120 Q 150 135 145 155 Q 130 165 100 165 Q 70 165 55 155 Z"
            fill={`url(#${k}-robe)`} stroke={robe[1]} strokeWidth="1.5"/>
      {/* Robe folds shading */}
      <Path d="M 60 150 Q 55 140 62 128 Q 70 122 80 125 L 78 145 Q 70 148 60 150 Z" fill="#000" opacity={0.2}/>
      <Path d="M 140 150 Q 145 140 138 128 Q 130 122 120 125 L 122 145 Q 130 148 140 150 Z" fill="#000" opacity={0.2}/>
      <Path d="M 80 130 L 100 124 L 120 130 L 118 148 L 100 144 L 82 148 Z" fill="#000" opacity={0.15}/>

      {/* Feet peeking */}
      <Ellipse cx="78" cy="158" rx="10" ry="5" fill={`url(#${k}-skin)`} stroke="#B88A5E" strokeWidth="1"/>
      <Ellipse cx="122" cy="158" rx="10" ry="5" fill={`url(#${k}-skin)`} stroke="#B88A5E" strokeWidth="1"/>

      {/* Hands meditation mudra */}
      <G>
        <Ellipse cx="100" cy="138" rx="22" ry="8" fill={`url(#${k}-skin)`} stroke="#C9A57F" strokeWidth="1"/>
        <Ellipse cx="100" cy="135" rx="20" ry="3" fill="#FFE8C9" opacity={0.6}/>
        {/* Thumbs */}
        <Ellipse cx="92" cy="135" rx="3" ry="4" fill={`url(#${k}-skin)`}/>
        <Ellipse cx="108" cy="135" rx="3" ry="4" fill={`url(#${k}-skin)`}/>
      </G>

      {/* Body (top robe) */}
      <Path d="M 78 120 Q 75 95 88 80 L 112 80 Q 125 95 122 120 Q 100 124 78 120 Z"
            fill={`url(#${k}-robe)`} stroke={robe[1]} strokeWidth="1.5"/>
      {/* Robe collar (V shape) */}
      <Path d="M 92 80 L 100 95 L 108 80 L 100 90 Z" fill={robe[1]}/>
      {/* Belt */}
      <Rect x="78" y="115" width="44" height="5" rx="2" fill={c.primary}/>
      <Rect x="78" y="115" width="44" height="2" fill={c.accent} opacity={0.6}/>

      {/* Neck */}
      <Path d="M 92 70 L 92 82 Q 100 86 108 82 L 108 70 Z" fill={`url(#${k}-skin)`}/>
      <Path d="M 92 72 Q 100 76 108 72" fill="none" stroke="#B88A5E" strokeWidth="1" opacity={0.5}/>

      {/* Head */}
      <Ellipse cx="100" cy="55" rx="28" ry="30" fill={`url(#${k}-skin)`} stroke="#B88A5E" strokeWidth="1.2"/>
      {/* Head highlight */}
      <Ellipse cx="88" cy="42" rx="10" ry="14" fill="#FFE8C9" opacity={0.6}/>
      {/* Ears */}
      <Ellipse cx="74" cy="55" rx="5" ry="8" fill={`url(#${k}-skin)`} stroke="#B88A5E" strokeWidth="1"/>
      <Ellipse cx="126" cy="55" rx="5" ry="8" fill={`url(#${k}-skin)`} stroke="#B88A5E" strokeWidth="1"/>
      <Ellipse cx="74" cy="57" rx="2" ry="4" fill="#D8A878" opacity={0.7}/>
      <Ellipse cx="126" cy="57" rx="2" ry="4" fill="#D8A878" opacity={0.7}/>

      {/* Closed peaceful eyes (curved lines) */}
      <Path d="M 84 55 Q 89 60 94 55" fill="none" stroke="#3D2817" strokeWidth="2" strokeLinecap="round"/>
      <Path d="M 106 55 Q 111 60 116 55" fill="none" stroke="#3D2817" strokeWidth="2" strokeLinecap="round"/>
      {/* Eyelashes hint */}
      <Path d="M 85 55 L 84 53 M 89 56 L 89 53 M 93 55 L 94 53" stroke="#3D2817" strokeWidth="0.8" strokeLinecap="round"/>
      <Path d="M 107 55 L 106 53 M 111 56 L 111 53 M 115 55 L 116 53" stroke="#3D2817" strokeWidth="0.8" strokeLinecap="round"/>

      {/* Eyebrows soft */}
      <Path d="M 84 50 Q 89 48 94 50" fill="none" stroke="#5C3920" strokeWidth="1.5" strokeLinecap="round" opacity={0.6}/>
      <Path d="M 106 50 Q 111 48 116 50" fill="none" stroke="#5C3920" strokeWidth="1.5" strokeLinecap="round" opacity={0.6}/>

      {/* Cheek blush */}
      <Ellipse cx="80" cy="62" rx="5" ry="3" fill="#FF9F8C" opacity={0.4}/>
      <Ellipse cx="120" cy="62" rx="5" ry="3" fill="#FF9F8C" opacity={0.4}/>

      {/* Serene smile */}
      <Path d="M 92 66 Q 100 71 108 66" fill="none" stroke="#3D2817" strokeWidth="1.8" strokeLinecap="round"/>
      <Path d="M 94 67 Q 100 69 106 67" fill="#A85C4F" opacity={0.4}/>

      {/* Bindi (3rd eye) */}
      <Circle cx="100" cy="40" r="3.5" fill={c.primary}/>
      <Circle cx="100" cy="40" r="2" fill={c.accent}/>
      <Circle cx="100" cy="40" r="1" fill="#fff" opacity={0.9}/>

      {/* Floating energy motes */}
      <G>
        <Circle cx="40" cy="80" r="2.5" fill={c.spark}/>
        <Circle cx="160" cy="65" r="2" fill={c.accent}/>
        <Circle cx="172" cy="110" r="1.5" fill={c.spark}/>
        <Circle cx="35" cy="125" r="2" fill={c.accent}/>
        <Circle cx="155" cy="135" r="1.8" fill={c.spark}/>
      </G>
      {/* Tiny sparkle stars */}
      <G fill={c.spark}>
        <Path d="M 36 50 L 38 54 L 42 56 L 38 58 L 36 62 L 34 58 L 30 56 L 34 54 Z" opacity={0.7}/>
        <Path d="M 170 145 L 172 149 L 176 151 L 172 153 L 170 157 L 168 153 L 164 151 L 168 149 Z" opacity={0.6}/>
      </G>
    </Svg>
  );
}

// ────────────────────────────────────────────────────────────────
// BEAST — The Discipline Beast (chibi werewolf)
// ────────────────────────────────────────────────────────────────
export function Beast({ theme = 'solar', size = 200 }: MascotProps) {
  const c = MASCOT_THEMES[theme];
  const k = `bs${theme}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <RadialGradient id={`${k}-aura`} cx="50%" cy="55%" r="55%">
          <Stop offset="0%" stopColor={c.ember} stopOpacity="0.6"/>
          <Stop offset="50%" stopColor={c.primary} stopOpacity="0.25"/>
          <Stop offset="100%" stopColor={c.primary} stopOpacity="0"/>
        </RadialGradient>
        <RadialGradient id={`${k}-fur`} cx="40%" cy="25%" r="85%">
          <Stop offset="0%" stopColor="#3a2a2a"/>
          <Stop offset="40%" stopColor="#1c1014"/>
          <Stop offset="80%" stopColor="#0a0608"/>
          <Stop offset="100%" stopColor="#000"/>
        </RadialGradient>
        <RadialGradient id={`${k}-furHead`} cx="35%" cy="20%" r="85%">
          <Stop offset="0%" stopColor="#4a3535"/>
          <Stop offset="35%" stopColor="#22141a"/>
          <Stop offset="80%" stopColor="#0a0608"/>
        </RadialGradient>
        <RadialGradient id={`${k}-eye`} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={c.spark}/>
          <Stop offset="50%" stopColor={c.accent}/>
          <Stop offset="100%" stopColor={c.ember}/>
        </RadialGradient>
        <LinearGradient id={`${k}-band`} x1="0%" x2="0%" y1="0%" y2="100%">
          <Stop offset="0%" stopColor={c.secondary}/>
          <Stop offset="50%" stopColor={c.primary}/>
          <Stop offset="100%" stopColor={c.ember}/>
        </LinearGradient>
      </Defs>

      {/* Background aura */}
      <Circle cx="100" cy="115" r="90" fill={`url(#${k}-aura)`}/>

      {/* Soft fur silhouette glow */}
      <G opacity={0.6}>
        <Ellipse cx="100" cy="120" rx="55" ry="48" fill="#000"/>
      </G>

      {/* TAIL — bushy, swept up */}
      <G>
        <Path d="M 145 132 Q 168 122 175 100 Q 172 92 165 100 Q 158 118 148 128 Z" fill={`url(#${k}-fur)`} stroke="#1c1014" strokeWidth="1"/>
        {/* Tail tuft tips */}
        <Path d="M 172 98 Q 174 92 168 90 L 170 98 Z" fill={c.primary} opacity={0.6}/>
      </G>

      {/* BACK LEG */}
      <G>
        <Path d="M 117 148 Q 128 162 130 180 L 142 178 Q 138 162 130 148 Z" fill={`url(#${k}-fur)`} stroke="#1c1014" strokeWidth="1"/>
        {/* Claws */}
        <Path d="M 132 178 L 130 184 M 136 179 L 137 185 M 140 178 L 142 184" stroke="#d8d4cc" strokeWidth="1.5" strokeLinecap="round"/>
      </G>

      {/* FRONT LEG */}
      <G>
        <Path d="M 83 148 Q 72 162 70 180 L 58 178 Q 62 162 70 148 Z" fill={`url(#${k}-fur)`} stroke="#1c1014" strokeWidth="1"/>
        <Path d="M 60 178 L 58 184 M 64 179 L 63 185 M 68 178 L 66 184" stroke="#d8d4cc" strokeWidth="1.5" strokeLinecap="round"/>
      </G>

      {/* BODY */}
      <Ellipse cx="100" cy="125" rx="48" ry="40" fill={`url(#${k}-fur)`} stroke={c.primary} strokeWidth="1.5"/>
      {/* Body fur tufts (chest) */}
      <Path d="M 78 110 Q 75 100 82 95 L 85 110 Z" fill="#1c1014"/>
      <Path d="M 122 110 Q 125 100 118 95 L 115 110 Z" fill="#1c1014"/>
      {/* Body rim light */}
      <Path d="M 80 105 Q 75 125 82 145 L 88 142 Q 84 125 86 108 Z" fill={c.primary} opacity={0.25}/>
      {/* Belly highlight */}
      <Ellipse cx="100" cy="135" rx="20" ry="10" fill="#2a1c20" opacity={0.5}/>

      {/* ARMS in fight pose (fists raised) */}
      {/* Left arm */}
      <G>
        <Path d="M 60 110 Q 48 100 50 86 Q 60 80 72 92 Z" fill={`url(#${k}-fur)`} stroke="#1c1014" strokeWidth="1"/>
        <Circle cx="52" cy="88" r="10" fill={`url(#${k}-fur)`} stroke={c.primary} strokeWidth="1.5"/>
        <Path d="M 48 84 L 46 86 M 52 82 L 52 84 M 56 84 L 58 86" stroke="#d8d4cc" strokeWidth="1.2" strokeLinecap="round"/>
      </G>
      {/* Right arm */}
      <G>
        <Path d="M 140 110 Q 152 100 150 86 Q 140 80 128 92 Z" fill={`url(#${k}-fur)`} stroke="#1c1014" strokeWidth="1"/>
        <Circle cx="148" cy="88" r="10" fill={`url(#${k}-fur)`} stroke={c.primary} strokeWidth="1.5"/>
        <Path d="M 152 84 L 154 86 M 148 82 L 148 84 M 144 84 L 142 86" stroke="#d8d4cc" strokeWidth="1.2" strokeLinecap="round"/>
      </G>

      {/* MANE — fierce tufts radiating from head */}
      <G fill={`url(#${k}-fur)`}>
        <Path d="M 62 80 Q 52 65 58 50 L 70 70 Z"/>
        <Path d="M 72 65 Q 68 48 78 45 L 80 65 Z"/>
        <Path d="M 86 55 Q 86 38 96 40 L 92 60 Z"/>
        <Path d="M 100 50 L 100 30 L 108 48 Z"/>
        <Path d="M 114 55 Q 118 38 128 42 L 120 60 Z"/>
        <Path d="M 128 65 Q 132 48 142 50 L 130 70 Z"/>
        <Path d="M 138 80 Q 148 65 142 50 L 132 70 Z"/>
      </G>

      {/* HEAD */}
      <Ellipse cx="100" cy="92" rx="36" ry="33" fill={`url(#${k}-furHead)`} stroke={c.primary} strokeWidth="2"/>
      {/* Head shadow under chin */}
      <Ellipse cx="100" cy="110" rx="28" ry="8" fill="#000" opacity={0.4}/>

      {/* EARS — wolf style */}
      <G>
        <Path d="M 76 78 L 70 52 L 88 68 Z" fill={`url(#${k}-furHead)`} stroke={c.primary} strokeWidth="1.5"/>
        <Path d="M 78 75 L 75 60 L 84 70 Z" fill={c.primary} opacity={0.7}/>
        <Path d="M 124 78 L 130 52 L 112 68 Z" fill={`url(#${k}-furHead)`} stroke={c.primary} strokeWidth="1.5"/>
        <Path d="M 122 75 L 125 60 L 116 70 Z" fill={c.primary} opacity={0.7}/>
      </G>

      {/* HEADBAND */}
      <G>
        <Path d="M 68 82 Q 100 76 132 82 L 132 90 Q 100 84 68 90 Z" fill={`url(#${k}-band)`}/>
        <Path d="M 68 82 Q 100 76 132 82" fill="none" stroke={c.accent} strokeWidth="1" opacity={0.6}/>
        {/* Headband emblem */}
        <Circle cx="100" cy="86" r="5" fill={c.dark}/>
        <Circle cx="100" cy="86" r="3.5" fill={c.spark}/>
        <Path d="M 100 84 L 101 86 L 100 88 L 99 86 Z" fill={c.ember}/>
        {/* Headband ties trailing */}
        <Path d="M 70 86 L 60 96 L 62 104 L 68 92 Z" fill={c.primary}/>
        <Path d="M 130 86 L 140 96 L 138 104 L 132 92 Z" fill={c.primary}/>
      </G>

      {/* EYES — fierce glowing */}
      <G>
        {/* Eye glow halo */}
        <Ellipse cx="88" cy="98" rx="9" ry="7" fill={c.ember} opacity={0.5}/>
        <Ellipse cx="112" cy="98" rx="9" ry="7" fill={c.ember} opacity={0.5}/>
        {/* Eye whites (angry slant) */}
        <Path d="M 80 96 Q 88 91 96 96 Q 92 104 88 104 Q 84 104 80 96 Z" fill={`url(#${k}-eye)`} stroke="#000" strokeWidth="0.8"/>
        <Path d="M 104 96 Q 112 91 120 96 Q 116 104 112 104 Q 108 104 104 96 Z" fill={`url(#${k}-eye)`} stroke="#000" strokeWidth="0.8"/>
        {/* Pupils */}
        <Ellipse cx="88" cy="99" rx="2.5" ry="3.5" fill="#000"/>
        <Ellipse cx="112" cy="99" rx="2.5" ry="3.5" fill="#000"/>
        {/* Specular highlight */}
        <Ellipse cx="89" cy="97" rx="1.2" ry="1.5" fill="#fff"/>
        <Ellipse cx="113" cy="97" rx="1.2" ry="1.5" fill="#fff"/>
      </G>

      {/* SNARLING MOUTH */}
      <G>
        {/* Snout */}
        <Path d="M 88 105 Q 100 115 112 105 Q 110 113 100 117 Q 90 113 88 105 Z" fill="#0a0608" stroke="#1c1014" strokeWidth="0.8"/>
        {/* Snout highlight */}
        <Ellipse cx="100" cy="106" rx="6" ry="2" fill="#2a1c20" opacity={0.8}/>
        {/* Nose */}
        <Ellipse cx="100" cy="103" rx="4" ry="3" fill="#0a0608" stroke={c.primary} strokeWidth="0.8"/>
        <Ellipse cx="100" cy="102" rx="2" ry="1" fill="#3a2a2a"/>
        {/* Mouth opening */}
        <Path d="M 90 112 Q 100 120 110 112 L 108 114 Q 100 118 92 114 Z" fill="#3a0a0f"/>
        {/* Top fangs */}
        <Path d="M 91 112 L 89 119 L 93 116 Z" fill="#fff" stroke="#aaa" strokeWidth="0.5"/>
        <Path d="M 109 112 L 111 119 L 107 116 Z" fill="#fff" stroke="#aaa" strokeWidth="0.5"/>
        {/* Bottom small fangs */}
        <Path d="M 94 117 L 95 121 L 96 117 Z" fill="#fff"/>
        <Path d="M 106 117 L 105 121 L 104 117 Z" fill="#fff"/>
        {/* Tongue */}
        <Path d="M 97 118 Q 100 121 103 118 L 100 120 Z" fill="#a8362e" opacity={0.8}/>
      </G>

      {/* Scar/whisker hint */}
      <Path d="M 82 102 Q 75 104 70 106" stroke="#fff" strokeWidth="0.8" opacity={0.3} strokeLinecap="round"/>
      <Path d="M 118 102 Q 125 104 130 106" stroke="#fff" strokeWidth="0.8" opacity={0.3} strokeLinecap="round"/>

      {/* Atmospheric embers */}
      <G>
        <Circle cx="35" cy="60" r="2.5" fill={c.ember}/>
        <Circle cx="40" cy="40" r="2" fill={c.primary}/>
        <Circle cx="160" cy="50" r="3" fill={c.ember}/>
        <Circle cx="170" cy="78" r="2" fill={c.primary}/>
        <Circle cx="30" cy="135" r="2.5" fill={c.ember}/>
      </G>
    </Svg>
  );
}

// ────────────────────────────────────────────────────────────────
// FURIOUS — The Firestarter (chibi anime fighter)
// ────────────────────────────────────────────────────────────────
export function Furious({ theme = 'solar', size = 200 }: MascotProps) {
  const c = MASCOT_THEMES[theme];
  const k = `fr${theme}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <RadialGradient id={`${k}-aura`} cx="50%" cy="55%" r="55%">
          <Stop offset="0%" stopColor={c.primary} stopOpacity="0.55"/>
          <Stop offset="50%" stopColor={c.ember} stopOpacity="0.25"/>
          <Stop offset="100%" stopColor={c.primary} stopOpacity="0"/>
        </RadialGradient>
        <LinearGradient id={`${k}-flame-bg`} x1="50%" y1="0%" x2="50%" y2="100%">
          <Stop offset="0%" stopColor={c.accent} stopOpacity="0.4"/>
          <Stop offset="60%" stopColor={c.primary} stopOpacity="0.5"/>
          <Stop offset="100%" stopColor={c.ember} stopOpacity="0.2"/>
        </LinearGradient>
        <RadialGradient id={`${k}-skin`} cx="30%" cy="25%" r="80%">
          <Stop offset="0%" stopColor="#FFE4C7"/>
          <Stop offset="60%" stopColor="#F0C399"/>
          <Stop offset="100%" stopColor="#A86B43"/>
        </RadialGradient>
        <RadialGradient id={`${k}-hair`} cx="50%" cy="20%" r="70%">
          <Stop offset="0%" stopColor="#3a2a2a"/>
          <Stop offset="50%" stopColor="#1c1014"/>
          <Stop offset="100%" stopColor="#000"/>
        </RadialGradient>
        <LinearGradient id={`${k}-shirt`} x1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={c.secondary}/>
          <Stop offset="50%" stopColor={c.primary}/>
          <Stop offset="100%" stopColor={c.ember}/>
        </LinearGradient>
        <LinearGradient id={`${k}-pants`} x1="0%" x2="0%" y1="0%" y2="100%">
          <Stop offset="0%" stopColor="#2a1820"/>
          <Stop offset="100%" stopColor="#0a0608"/>
        </LinearGradient>
        <LinearGradient id={`${k}-bolt`} x1="0%" x2="0%" y1="0%" y2="100%">
          <Stop offset="0%" stopColor="#FFF099"/>
          <Stop offset="50%" stopColor="#FFE15C"/>
          <Stop offset="100%" stopColor="#D89A12"/>
        </LinearGradient>
      </Defs>

      {/* Aura */}
      <Circle cx="100" cy="105" r="92" fill={`url(#${k}-aura)`}/>

      {/* Flame backlight */}
      <G opacity={0.8}>
        <Path d="M 100 30 Q 60 60 50 105 Q 45 150 75 178 L 125 178 Q 155 150 150 105 Q 140 60 100 30 Z" fill={`url(#${k}-flame-bg)`}/>
      </G>

      {/* FOOT FLAMES */}
      <G>
        <Path d="M 58 168 Q 64 154 70 168 Q 72 178 66 180 Q 60 178 58 168 Z" fill={c.primary}/>
        <Path d="M 60 170 Q 64 160 68 170 Q 68 176 64 176 Q 60 176 60 170 Z" fill={c.accent}/>
        <Path d="M 132 168 Q 138 154 144 168 Q 146 178 140 180 Q 134 178 132 168 Z" fill={c.primary}/>
        <Path d="M 134 170 Q 138 160 142 170 Q 142 176 138 176 Q 134 176 134 170 Z" fill={c.accent}/>
      </G>

      {/* PANTS / LEGS */}
      <G>
        <Path d="M 80 140 Q 75 160 70 178 L 88 180 Q 92 160 92 142 Z" fill={`url(#${k}-pants)`} stroke="#000" strokeWidth="1"/>
        <Path d="M 108 142 Q 108 160 112 180 L 130 178 Q 125 160 120 140 Z" fill={`url(#${k}-pants)`} stroke="#000" strokeWidth="1"/>
        {/* Pant highlights */}
        <Path d="M 82 145 Q 80 160 76 174" stroke={c.primary} strokeWidth="1.5" fill="none" opacity={0.5}/>
        <Path d="M 122 145 Q 124 160 128 174" stroke={c.primary} strokeWidth="1.5" fill="none" opacity={0.5}/>
        {/* Shoes */}
        <Ellipse cx="80" cy="180" rx="13" ry="5" fill={`url(#${k}-shirt)`} stroke="#000" strokeWidth="1"/>
        <Ellipse cx="120" cy="180" rx="13" ry="5" fill={`url(#${k}-shirt)`} stroke="#000" strokeWidth="1"/>
        {/* Shoe laces */}
        <Line x1="76" y1="179" x2="84" y2="179" stroke="#fff" strokeWidth="0.8"/>
        <Line x1="116" y1="179" x2="124" y2="179" stroke="#fff" strokeWidth="0.8"/>
      </G>

      {/* ARMS — battle stance */}
      {/* Left arm raised */}
      <G>
        <Path d="M 70 108 Q 52 112 46 130 L 56 138 Q 66 124 75 116 Z" fill={`url(#${k}-shirt)`} stroke="#000" strokeWidth="1"/>
        {/* Fist */}
        <Circle cx="50" cy="135" r="11" fill={`url(#${k}-skin)`} stroke="#B88A5E" strokeWidth="1"/>
        <Path d="M 44 132 L 48 132 M 44 136 L 48 136" stroke="#A86B43" strokeWidth="0.8"/>
        <Ellipse cx="48" cy="131" rx="4" ry="2" fill="#FFE4C7" opacity={0.6}/>
      </G>
      {/* Right arm */}
      <G>
        <Path d="M 130 108 Q 148 112 154 130 L 144 138 Q 134 124 125 116 Z" fill={`url(#${k}-shirt)`} stroke="#000" strokeWidth="1"/>
        <Circle cx="150" cy="135" r="11" fill={`url(#${k}-skin)`} stroke="#B88A5E" strokeWidth="1"/>
        <Path d="M 152 132 L 156 132 M 152 136 L 156 136" stroke="#A86B43" strokeWidth="0.8"/>
        <Ellipse cx="152" cy="131" rx="4" ry="2" fill="#FFE4C7" opacity={0.6}/>
      </G>

      {/* SHIRT body */}
      <Path d="M 72 92 Q 66 130 78 148 L 122 148 Q 134 130 128 92 Q 100 86 72 92 Z"
            fill={`url(#${k}-shirt)`} stroke="#000" strokeWidth="1.5"/>
      {/* Shirt highlight */}
      <Path d="M 78 95 Q 73 120 80 138 L 86 138 Q 82 118 84 96 Z" fill="#fff" opacity={0.15}/>
      {/* Shirt shadow under arms */}
      <Path d="M 122 95 Q 128 120 122 138" stroke="#000" strokeWidth="2" fill="none" opacity={0.3}/>
      {/* Belt of pants */}
      <Rect x="78" y="138" width="44" height="6" fill="#0a0608"/>
      <Circle cx="100" cy="141" r="3" fill={c.accent}/>

      {/* LIGHTNING BOLT */}
      <G>
        <Path d="M 105 96 L 92 124 L 100 124 L 95 142 L 110 110 L 102 110 L 108 96 Z"
              fill={`url(#${k}-bolt)`} stroke="#000" strokeWidth="1.2"/>
        {/* Bolt highlight */}
        <Path d="M 104 100 L 96 118 L 100 118 L 98 130 L 106 115 L 102 115 L 105 100 Z" fill="#FFF8D9" opacity={0.7}/>
      </G>

      {/* NECK */}
      <Path d="M 92 78 L 92 92 Q 100 96 108 92 L 108 78 Z" fill={`url(#${k}-skin)`}/>
      <Path d="M 92 80 Q 100 84 108 80" fill="none" stroke="#B88A5E" strokeWidth="0.8" opacity={0.6}/>

      {/* HEAD */}
      <Ellipse cx="100" cy="62" rx="28" ry="30" fill={`url(#${k}-skin)`} stroke="#B88A5E" strokeWidth="1.2"/>
      {/* Head highlight */}
      <Ellipse cx="88" cy="50" rx="9" ry="13" fill="#FFE4C7" opacity={0.7}/>
      {/* Ears */}
      <Ellipse cx="74" cy="64" rx="4" ry="6" fill={`url(#${k}-skin)`} stroke="#B88A5E" strokeWidth="1"/>
      <Ellipse cx="126" cy="64" rx="4" ry="6" fill={`url(#${k}-skin)`} stroke="#B88A5E" strokeWidth="1"/>

      {/* SPIKY HAIR — wild radiating spikes */}
      <G fill={`url(#${k}-hair)`} stroke="#000" strokeWidth="1">
        {/* Center main spikes */}
        <Path d="M 72 60 L 74 38 L 82 50 L 86 28 L 90 48 L 96 22 L 100 46 L 104 22 L 110 48 L 114 28 L 118 50 L 126 38 L 128 60 Q 122 52 110 50 Q 100 48 90 50 Q 78 52 72 60 Z"/>
        {/* Side strands */}
        <Path d="M 70 52 L 64 36 L 70 50 Z"/>
        <Path d="M 130 52 L 136 36 L 130 50 Z"/>
        {/* Bangs falling over forehead */}
        <Path d="M 80 48 L 86 60 L 92 50 L 96 62 L 100 50 L 104 62 L 108 50 L 114 60 L 120 48"
              fill="none" stroke="#000" strokeWidth="1.5"/>
      </G>
      {/* Hair highlight streaks */}
      <G stroke={c.primary} strokeWidth="1.5" fill="none" opacity={0.6} strokeLinecap="round">
        <Path d="M 92 30 L 96 42"/>
        <Path d="M 106 32 L 102 44"/>
      </G>

      {/* EYEBROWS — fierce, slanted down */}
      <Path d="M 82 56 L 95 60" stroke="#000" strokeWidth="3" strokeLinecap="round"/>
      <Path d="M 118 56 L 105 60" stroke="#000" strokeWidth="3" strokeLinecap="round"/>

      {/* EYES — big determined */}
      <G>
        {/* Eye whites */}
        <Ellipse cx="89" cy="65" rx="5" ry="6" fill="#fff" stroke="#000" strokeWidth="1"/>
        <Ellipse cx="111" cy="65" rx="5" ry="6" fill="#fff" stroke="#000" strokeWidth="1"/>
        {/* Pupils with fierce shape */}
        <Ellipse cx="89" cy="66" rx="3" ry="4" fill="#0a0a14"/>
        <Ellipse cx="111" cy="66" rx="3" ry="4" fill="#0a0a14"/>
        {/* Iris hint of color */}
        <Circle cx="89" cy="65" r="1.5" fill={c.primary} opacity={0.5}/>
        <Circle cx="111" cy="65" r="1.5" fill={c.primary} opacity={0.5}/>
        {/* Specular highlights */}
        <Circle cx="90" cy="63" r="1.2" fill="#fff"/>
        <Circle cx="112" cy="63" r="1.2" fill="#fff"/>
        <Circle cx="88" cy="67" r="0.5" fill="#fff"/>
        <Circle cx="110" cy="67" r="0.5" fill="#fff"/>
      </G>

      {/* Nose hint */}
      <Path d="M 100 70 L 99 74 L 101 74 Z" fill="#B88A5E" opacity={0.5}/>

      {/* Cheek blush from exertion */}
      <Ellipse cx="82" cy="74" rx="5" ry="3" fill={c.primary} opacity={0.35}/>
      <Ellipse cx="118" cy="74" rx="5" ry="3" fill={c.primary} opacity={0.35}/>

      {/* SHOUTING MOUTH */}
      <G>
        <Path d="M 92 80 Q 100 90 108 80 Q 104 88 100 88 Q 96 88 92 80 Z" fill="#3a0a0f" stroke="#000" strokeWidth="1.2"/>
        {/* Teeth top */}
        <Path d="M 93 81 L 107 81 L 105 84 L 95 84 Z" fill="#fff"/>
        <Line x1="100" y1="81" x2="100" y2="84" stroke="#aaa" strokeWidth="0.5"/>
        {/* Tongue */}
        <Ellipse cx="100" cy="86" rx="4" ry="2" fill="#cc5555"/>
      </G>

      {/* Energy sparks around */}
      <G>
        <Path d="M 30 100 L 28 105 L 32 103 L 30 108 L 36 102 L 32 102 Z" fill="#FFE15C"/>
        <Path d="M 168 90 L 166 95 L 170 93 L 168 98 L 174 92 L 170 92 Z" fill="#FFE15C"/>
      </G>
      <G fill={c.ember}>
        <Circle cx="35" cy="130" r="2.5"/>
        <Circle cx="165" cy="125" r="2.5"/>
        <Circle cx="40" cy="60" r="2"/>
        <Circle cx="160" cy="65" r="2"/>
      </G>
    </Svg>
  );
}

// ────────────────────────────────────────────────────────────────
// BUDDY — The Friendly Pal (cute astronaut robot)
// ────────────────────────────────────────────────────────────────
export function Buddy({ theme = 'solar', size = 200 }: MascotProps) {
  const c = MASCOT_THEMES[theme];
  const k = `bd${theme}`;
  const heart = theme === 'solar' ? '#22D39E' : theme === 'lunar' ? c.primary : c.primary;
  const heartDark = theme === 'solar' ? '#0F8A65' : theme === 'lunar' ? c.ember : c.ember;
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <RadialGradient id={`${k}-aura`} cx="50%" cy="50%" r="55%">
          <Stop offset="0%" stopColor={heart} stopOpacity="0.4"/>
          <Stop offset="60%" stopColor={c.glow} stopOpacity="0.2"/>
          <Stop offset="100%" stopColor={c.primary} stopOpacity="0"/>
        </RadialGradient>
        <RadialGradient id={`${k}-suit`} cx="35%" cy="25%" r="85%">
          <Stop offset="0%" stopColor="#FAFAF6"/>
          <Stop offset="50%" stopColor="#E5E2D8"/>
          <Stop offset="100%" stopColor="#A8A498"/>
        </RadialGradient>
        <RadialGradient id={`${k}-helmet`} cx="35%" cy="20%" r="80%">
          <Stop offset="0%" stopColor="#FAFAF6"/>
          <Stop offset="60%" stopColor="#E5E2D8"/>
          <Stop offset="100%" stopColor="#B8B4A8"/>
        </RadialGradient>
        <RadialGradient id={`${k}-visor`} cx="35%" cy="30%" r="70%">
          <Stop offset="0%" stopColor={c.glow} stopOpacity="0.5"/>
          <Stop offset="40%" stopColor="#1a2540"/>
          <Stop offset="100%" stopColor="#0a1020"/>
        </RadialGradient>
        <RadialGradient id={`${k}-heart`} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={c.spark}/>
          <Stop offset="40%" stopColor={heart}/>
          <Stop offset="100%" stopColor={heartDark}/>
        </RadialGradient>
      </Defs>

      {/* Aura */}
      <Circle cx="100" cy="105" r="90" fill={`url(#${k}-aura)`}/>

      {/* Soft heart glow */}
      <Ellipse cx="100" cy="130" rx="22" ry="18" fill={heart} opacity={0.3}/>

      {/* LEGS */}
      <G>
        <Rect x="78" y="150" width="18" height="32" rx="6" fill={`url(#${k}-suit)`} stroke="#A8A498" strokeWidth="1.2"/>
        <Rect x="104" y="150" width="18" height="32" rx="6" fill={`url(#${k}-suit)`} stroke="#A8A498" strokeWidth="1.2"/>
        {/* Knee joints */}
        <Circle cx="87" cy="162" r="4" fill={heart} stroke={heartDark} strokeWidth="0.8"/>
        <Circle cx="113" cy="162" r="4" fill={heart} stroke={heartDark} strokeWidth="0.8"/>
        <Circle cx="87" cy="162" r="2" fill={c.spark} opacity={0.8}/>
        <Circle cx="113" cy="162" r="2" fill={c.spark} opacity={0.8}/>
        {/* Leg shading */}
        <Rect x="78" y="150" width="4" height="30" fill="#fff" opacity={0.3} rx="2"/>
        <Rect x="104" y="150" width="4" height="30" fill="#fff" opacity={0.3} rx="2"/>
        {/* Boots */}
        <Ellipse cx="87" cy="182" rx="12" ry="5" fill="#A8A498"/>
        <Ellipse cx="113" cy="182" rx="12" ry="5" fill="#A8A498"/>
        <Ellipse cx="85" cy="180" rx="4" ry="1.5" fill="#fff" opacity={0.5}/>
        <Ellipse cx="111" cy="180" rx="4" ry="1.5" fill="#fff" opacity={0.5}/>
      </G>

      {/* RIGHT ARM (waving!) */}
      <G>
        <Path d="M 130 100 Q 152 80 158 55 L 166 60 Q 162 88 142 110 Z" fill={`url(#${k}-suit)`} stroke="#A8A498" strokeWidth="1.2"/>
        <Path d="M 132 102 Q 150 88 156 70" stroke="#fff" strokeWidth="2" fill="none" opacity={0.5}/>
        {/* Wrist joint */}
        <Circle cx="160" cy="58" r="4" fill={heart} stroke={heartDark} strokeWidth="0.8"/>
        {/* Hand (mitten shape) */}
        <Ellipse cx="158" cy="55" rx="12" ry="11" fill={`url(#${k}-suit)`} stroke="#A8A498" strokeWidth="1.2"/>
        {/* Thumb */}
        <Ellipse cx="150" cy="50" rx="4" ry="5" fill={`url(#${k}-suit)`} stroke="#A8A498" strokeWidth="1"/>
        <Ellipse cx="156" cy="52" rx="5" ry="2" fill="#fff" opacity={0.4}/>
      </G>

      {/* LEFT ARM */}
      <G>
        <Path d="M 70 100 Q 55 115 50 138 L 60 142 Q 66 122 76 116 Z" fill={`url(#${k}-suit)`} stroke="#A8A498" strokeWidth="1.2"/>
        <Circle cx="55" cy="140" r="4" fill={heart} stroke={heartDark} strokeWidth="0.8"/>
        <Ellipse cx="55" cy="142" rx="10" ry="9" fill={`url(#${k}-suit)`} stroke="#A8A498" strokeWidth="1.2"/>
        <Ellipse cx="53" cy="140" rx="3" ry="2" fill="#fff" opacity={0.4}/>
      </G>

      {/* BODY */}
      <Path d="M 72 88 Q 65 132 76 156 L 124 156 Q 135 132 128 88 Q 100 82 72 88 Z"
            fill={`url(#${k}-suit)`} stroke="#A8A498" strokeWidth="1.5"/>
      {/* Body chest panel */}
      <Path d="M 80 95 Q 76 130 82 150 L 118 150 Q 124 130 120 95 Q 100 92 80 95 Z" fill="#fff" opacity={0.4}/>
      {/* Body side shadow */}
      <Path d="M 122 95 Q 128 130 120 150" stroke="#A8A498" strokeWidth="2" fill="none" opacity={0.5}/>
      {/* Stripe chest */}
      <Rect x="80" y="103" width="40" height="2.5" fill={heart} opacity={0.7}/>
      <Rect x="80" y="153" width="40" height="2.5" fill={heart} opacity={0.7}/>

      {/* HEART CHEST EMBLEM */}
      <G>
        {/* Heart glow */}
        <Circle cx="100" cy="130" r="14" fill={heart} opacity={0.4}/>
        {/* Heart shape */}
        <Path d="M 100 128 C 92 116 78 122 84 134 C 88 142 100 150 100 150 C 100 150 112 142 116 134 C 122 122 108 116 100 128 Z"
              fill={`url(#${k}-heart)`} stroke={heartDark} strokeWidth="1"/>
        {/* Heart highlight */}
        <Ellipse cx="91" cy="128" rx="3" ry="4" fill="#fff" opacity={0.7}/>
      </G>

      {/* HELMET (glass dome) */}
      <G>
        {/* Helmet ring/base */}
        <Ellipse cx="100" cy="82" rx="38" ry="6" fill="#A8A498"/>
        <Ellipse cx="100" cy="82" rx="36" ry="4" fill="#fff" opacity={0.3}/>
        {/* Glass dome */}
        <Ellipse cx="100" cy="60" rx="38" ry="38" fill={`url(#${k}-helmet)`} stroke="#A8A498" strokeWidth="1.5"/>
        {/* Glass highlight (large) */}
        <Ellipse cx="84" cy="42" rx="12" ry="18" fill="#fff" opacity={0.5} transform="rotate(-25 84 42)"/>
        {/* Glass highlight (small) */}
        <Ellipse cx="118" cy="42" rx="3" ry="5" fill="#fff" opacity={0.8} transform="rotate(20 118 42)"/>

        {/* Visor screen (inner dark area showing face) */}
        <Path d="M 76 56 Q 76 38 100 36 Q 124 38 124 56 Q 124 78 100 80 Q 76 78 76 56 Z"
              fill={`url(#${k}-visor)`} stroke="#5a5a5a" strokeWidth="0.8"/>

        {/* CUTE EYES — happy */}
        <G>
          {/* Eye glow */}
          <Ellipse cx="88" cy="58" rx="6" ry="5" fill={heart} opacity={0.5}/>
          <Ellipse cx="112" cy="58" rx="6" ry="5" fill={heart} opacity={0.5}/>
          {/* Happy closed eyes */}
          <Path d="M 84 60 Q 88 53 92 60 Q 88 64 84 60 Z" fill={c.spark}/>
          <Path d="M 108 60 Q 112 53 116 60 Q 112 64 108 60 Z" fill={c.spark}/>
          {/* Eye sparkle */}
          <Circle cx="89" cy="58" r="0.8" fill="#fff"/>
          <Circle cx="113" cy="58" r="0.8" fill="#fff"/>
        </G>

        {/* Big friendly smile */}
        <Path d="M 90 68 Q 100 76 110 68" fill="none" stroke={c.spark} strokeWidth="2.5" strokeLinecap="round"/>
        {/* Cheek blush */}
        <Ellipse cx="83" cy="68" rx="3" ry="2" fill={c.primary} opacity={0.5}/>
        <Ellipse cx="117" cy="68" rx="3" ry="2" fill={c.primary} opacity={0.5}/>

        {/* HELMET LIGHT/CAMERA */}
        <Circle cx="100" cy="32" r="4" fill="#A8A498" stroke="#888" strokeWidth="0.8"/>
        <Circle cx="100" cy="32" r="2.5" fill={heart}/>
        <Circle cx="100" cy="32" r="1.2" fill={c.spark}/>
      </G>

      {/* ANTENNA */}
      <G>
        <Line x1="100" y1="22" x2="100" y2="12" stroke="#A8A498" strokeWidth="2"/>
        <Circle cx="100" cy="10" r="3.5" fill={heart}/>
        <Circle cx="100" cy="10" r="2" fill={c.spark}/>
        <Circle cx="100" cy="10" r="6" fill={heart} opacity={0.4}/>
      </G>

      {/* SPARKLES around */}
      <G fill={c.spark}>
        <Path d="M 35 60 L 37 64 L 41 66 L 37 68 L 35 72 L 33 68 L 29 66 L 33 64 Z" opacity={0.8}/>
        <Path d="M 165 100 L 167 104 L 171 106 L 167 108 L 165 112 L 163 108 L 159 106 L 163 104 Z" opacity={0.8}/>
        <Path d="M 30 130 L 31 132 L 33 133 L 31 134 L 30 136 L 29 134 L 27 133 L 29 132 Z" opacity={0.6}/>
        <Path d="M 170 50 L 171 52 L 173 53 L 171 54 L 170 56 L 169 54 L 167 53 L 169 52 Z" opacity={0.6}/>
      </G>
      <G fill={heart}>
        <Circle cx="50" cy="170" r="2"/>
        <Circle cx="150" cy="170" r="2"/>
      </G>
    </Svg>
  );
}

// ────────────────────────────────────────────────────────────────
// COSMIC SAGE — The Wise Guide (hooded mage)
// ────────────────────────────────────────────────────────────────
export function CosmicSage({ theme = 'solar', size = 200 }: MascotProps) {
  const c = MASCOT_THEMES[theme];
  const k = `sg${theme}`;
  const robeColors = theme === 'solar' ? ['#3D1F4A','#1F0F26','#6B3D7E'] : theme === 'lunar' ? ['#1A2752','#0A132E','#3D5B9C'] : ['#2D1248','#180625','#5A2D8A'];
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <RadialGradient id={`${k}-aura`} cx="50%" cy="50%" r="60%">
          <Stop offset="0%" stopColor={c.glow} stopOpacity="0.5"/>
          <Stop offset="40%" stopColor={c.primary} stopOpacity="0.3"/>
          <Stop offset="100%" stopColor={c.primary} stopOpacity="0"/>
        </RadialGradient>
        <RadialGradient id={`${k}-robe`} cx="40%" cy="30%" r="85%">
          <Stop offset="0%" stopColor={robeColors[2]}/>
          <Stop offset="50%" stopColor={robeColors[0]}/>
          <Stop offset="100%" stopColor={robeColors[1]}/>
        </RadialGradient>
        <RadialGradient id={`${k}-hood`} cx="50%" cy="50%" r="60%">
          <Stop offset="0%" stopColor="#000"/>
          <Stop offset="60%" stopColor="#000"/>
          <Stop offset="100%" stopColor={robeColors[1]}/>
        </RadialGradient>
        <RadialGradient id={`${k}-crystal`} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={c.spark}/>
          <Stop offset="40%" stopColor={c.accent}/>
          <Stop offset="100%" stopColor={c.primary}/>
        </RadialGradient>
        <LinearGradient id={`${k}-staff`} x1="0%" x2="0%" y1="0%" y2="100%">
          <Stop offset="0%" stopColor="#8B6F47"/>
          <Stop offset="50%" stopColor="#5C4128"/>
          <Stop offset="100%" stopColor="#382712"/>
        </LinearGradient>
      </Defs>

      {/* Aura */}
      <Circle cx="100" cy="110" r="95" fill={`url(#${k}-aura)`}/>

      {/* COSMIC SWIRL background */}
      <G opacity={0.6}>
        <Path d="M 100 30 Q 145 60 150 100 Q 145 145 100 170 Q 55 145 50 100 Q 55 60 100 30 Z"
              fill="none" stroke={c.primary} strokeWidth="2" strokeDasharray="3, 8"/>
      </G>

      {/* Starfield */}
      <G fill={c.spark}>
        <Circle cx="32" cy="48" r="1.5"/>
        <Circle cx="168" cy="38" r="2"/>
        <Circle cx="172" cy="98" r="1.5"/>
        <Circle cx="36" cy="128" r="2"/>
        <Circle cx="158" cy="148" r="1.5"/>
        <Circle cx="28" cy="90" r="1"/>
        <Circle cx="174" cy="65" r="1"/>
        <Path d="M 30 75 L 32 79 L 36 81 L 32 83 L 30 87 L 28 83 L 24 81 L 28 79 Z" opacity={0.7}/>
        <Path d="M 170 120 L 172 124 L 176 126 L 172 128 L 170 132 L 168 128 L 164 126 L 168 124 Z" opacity={0.7}/>
        <Path d="M 50 35 L 51 37 L 53 38 L 51 39 L 50 41 L 49 39 L 47 38 L 49 37 Z" opacity={0.6}/>
      </G>

      {/* SLEEVE LEFT (resting at side) */}
      <Path d="M 70 105 Q 60 130 65 160 L 80 158 Q 78 130 84 110 Z" fill={`url(#${k}-robe)`} stroke={robeColors[1]} strokeWidth="1.5"/>

      {/* SLEEVE RIGHT (holding staff) */}
      <Path d="M 130 105 Q 144 95 152 80 L 158 88 Q 152 110 138 122 Z" fill={`url(#${k}-robe)`} stroke={robeColors[1]} strokeWidth="1.5"/>

      {/* STAFF */}
      <G>
        <Line x1="158" y1="30" x2="140" y2="175" stroke={`url(#${k}-staff)`} strokeWidth="4" strokeLinecap="round"/>
        {/* Staff bindings */}
        <Ellipse cx="155" cy="50" rx="4" ry="2" fill="#5C4128"/>
        <Ellipse cx="150" cy="90" rx="4" ry="2" fill="#5C4128"/>
        <Ellipse cx="145" cy="130" rx="3.5" ry="2" fill="#5C4128"/>
      </G>

      {/* CRYSTAL on top of staff */}
      <G>
        {/* Big glow */}
        <Circle cx="158" cy="28" r="14" fill={c.glow} opacity={0.6}/>
        {/* Inner glow */}
        <Circle cx="158" cy="28" r="9" fill={c.accent} opacity={0.5}/>
        {/* Crystal core */}
        <Path d="M 158 16 L 165 28 L 158 42 L 151 28 Z" fill={`url(#${k}-crystal)`} stroke={c.primary} strokeWidth="0.8"/>
        {/* Crystal highlight */}
        <Path d="M 158 18 L 161 28 L 158 38 L 156 28 Z" fill="#fff" opacity={0.6}/>
        <Path d="M 158 18 L 158 28" stroke="#fff" strokeWidth="0.8"/>
        {/* Magic swirl */}
        <Path d="M 150 50 Q 175 50 170 75 Q 168 80 162 72 Q 160 65 168 60" fill="none" stroke={c.secondary} strokeWidth="1.5" opacity={0.6} strokeLinecap="round"/>
      </G>

      {/* ROBE BODY (wide cloak) */}
      <Path d="M 56 178 Q 48 150 54 110 Q 65 78 100 70 Q 135 78 146 110 Q 152 150 144 178 Z"
            fill={`url(#${k}-robe)`} stroke={robeColors[1]} strokeWidth="2"/>
      {/* Robe inner darker fold */}
      <Path d="M 76 178 Q 70 150 78 122 L 122 122 Q 130 150 124 178 Z" fill={robeColors[1]} opacity={0.6}/>
      {/* Robe outer highlight (rim light) */}
      <Path d="M 56 178 Q 48 150 54 110 Q 60 92 70 84" stroke={c.primary} strokeWidth="2" fill="none" opacity={0.5}/>
      {/* Center fold lines */}
      <Path d="M 100 95 L 100 178" stroke={robeColors[1]} strokeWidth="1.5" opacity={0.5}/>

      {/* BELT/SASH */}
      <Path d="M 70 130 Q 100 140 130 130 L 128 140 Q 100 148 72 140 Z" fill={c.secondary}/>
      {/* Belt buckle */}
      <Circle cx="100" cy="138" r="5" fill={c.dark}/>
      <Circle cx="100" cy="138" r="3.5" fill={c.accent}/>
      <Circle cx="100" cy="138" r="2" fill={c.spark}/>
      <Circle cx="100" cy="138" r="7" fill={c.accent} opacity={0.5}/>

      {/* HOOD (outer) */}
      <G>
        <Path d="M 64 95 Q 56 60 100 48 Q 144 60 136 95 Q 138 110 126 116 L 74 116 Q 62 110 64 95 Z"
              fill={`url(#${k}-robe)`} stroke={robeColors[1]} strokeWidth="2"/>
        {/* Hood tip */}
        <Path d="M 100 50 L 88 32 Q 100 22 112 32 Z" fill={`url(#${k}-robe)`} stroke={robeColors[1]} strokeWidth="2"/>
        <Path d="M 100 50 L 92 36 Q 100 30 108 36 Z" fill={robeColors[1]}/>
        {/* Hood rim light */}
        <Path d="M 64 95 Q 56 60 100 48" stroke={c.primary} strokeWidth="2" fill="none" opacity={0.6}/>
        {/* Hood rim accent */}
        <Path d="M 70 105 Q 100 96 130 105" stroke={c.secondary} strokeWidth="2" fill="none" opacity={0.8}/>
      </G>

      {/* HOOD INNER SHADOW (face cavity) */}
      <Ellipse cx="100" cy="90" rx="26" ry="28" fill={`url(#${k}-hood)`}/>
      <Ellipse cx="100" cy="92" rx="22" ry="24" fill="#000"/>

      {/* GLOWING FACE inside hood */}
      <G>
        {/* Face glow halo */}
        <Ellipse cx="100" cy="92" rx="18" ry="18" fill={c.glow} opacity={0.4}/>

        {/* GLOWING EYES — large */}
        <G>
          <Ellipse cx="92" cy="88" rx="8" ry="6" fill={c.glow} opacity={0.6}/>
          <Ellipse cx="108" cy="88" rx="8" ry="6" fill={c.glow} opacity={0.6}/>
          {/* Cute closed/squinting smile eyes */}
          <Path d="M 88 88 Q 92 84 96 88 Q 92 92 88 88 Z" fill={c.spark}/>
          <Path d="M 104 88 Q 108 84 112 88 Q 108 92 104 88 Z" fill={c.spark}/>
          {/* Eye sparkles */}
          <Circle cx="92" cy="87" r="1" fill="#fff"/>
          <Circle cx="108" cy="87" r="1" fill="#fff"/>
        </G>

        {/* Mystic smile */}
        <Path d="M 92 100 Q 100 106 108 100" fill="none" stroke={c.accent} strokeWidth="2.5" strokeLinecap="round"/>

        {/* Wisdom mark on forehead */}
        <Circle cx="100" cy="78" r="2.5" fill={c.spark}/>
        <Circle cx="100" cy="78" r="5" fill={c.accent} opacity={0.5}/>
      </G>

      {/* Foreground magic dust */}
      <G fill={c.spark} opacity={0.9}>
        <Circle cx="60" cy="155" r="1.5"/>
        <Circle cx="65" cy="170" r="1"/>
        <Circle cx="55" cy="138" r="1"/>
        <Circle cx="135" cy="158" r="1.5"/>
        <Circle cx="142" cy="170" r="1"/>
      </G>
      <G>
        <Circle cx="40" cy="155" r="3" fill={c.primary} opacity={0.7}/>
        <Circle cx="158" cy="65" r="3" fill={c.secondary} opacity={0.7}/>
      </G>
    </Svg>
  );
}

export const MASCOTS = [
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
  { id:'furious', Comp: Furious,     name:'Furious',      role:'The Firestarter',    tags:['Energetic','Intense'],   color:'#FF8800', quotes:[
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

export type MascotId = 'zenith' | 'monk' | 'beast' | 'furious' | 'buddy' | 'sage' | string;

interface MascotRendererProps extends MascotProps {
  id: MascotId;
  useImage?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Centralized Mascot Renderer
 * Supports both SVG components and future PNG image assets.
 * Implements the finalized mood -> persona mapping.
 */
const PNG_MAP: Record<string, any> = {
  'zenith': require('../assets/images/zenith.png'),
  'monk': require('../assets/images/monk.png'),
  'beast': require('../assets/images/beast.png'),
  'furious': require('../assets/images/furious_boy.png'),
  'buddy': require('../assets/images/buddy.png'),
  'sage': require('../assets/images/cosmic_sage.png'),
};

export function MascotRenderer({ id, theme = 'solar', size = 200, useImage = false, style }: MascotRendererProps) {
  // Plan-mandated mapping: Mood -> Mascot
  const moodMap: Record<string, MascotId> = {
    'Steady': 'monk',
    'Surge': 'furious',
    'Growth': 'beast',
    'Zenith Overdrive': 'zenith',
    'Recovery': 'buddy',
    'Maintain': 'sage'
  };

  const effectiveId = moodMap[id] || id || 'monk';
  const asset = PNG_MAP[effectiveId] || PNG_MAP['monk'];

  return (
    <View style={style}>
      <Image source={asset} style={{ width: size, height: size }} resizeMode="contain" />
    </View>
  );
}
