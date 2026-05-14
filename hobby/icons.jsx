// icons.jsx — flat stroke icon set for RunAstra
// All icons are 24×24 viewBox, currentColor stroke
const Icon = ({ d, size = 22, fill = false, sw = 1.8, viewBox = "0 0 24 24", children }) => (
  <svg width={size} height={size} viewBox={viewBox} fill={fill ? 'currentColor' : 'none'}
       stroke={fill ? 'none' : 'currentColor'} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {d ? <path d={d}/> : children}
  </svg>
);

const IconHome = (p) => <Icon {...p}><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9"/></Icon>;
const IconTrophy = (p) => <Icon {...p}><path d="M8 3h8v4a4 4 0 0 1-8 0V3z"/><path d="M8 5H5a2 2 0 0 0 2 5"/><path d="M16 5h3a2 2 0 0 1-2 5"/><path d="M9 14h6l-1 5h-4l-1-5z"/><path d="M8 21h8"/></Icon>;
const IconChart = (p) => <Icon {...p}><path d="M5 21V11"/><path d="M12 21V3"/><path d="M19 21v-7"/></Icon>;
const IconCompass = (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2z"/></Icon>;
const IconUser = (p) => <Icon {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></Icon>;
const IconRun = (p) => <Icon {...p}><circle cx="15" cy="4.5" r="1.8"/><path d="m6 18 3-4 2 1 3-4 1 3 4 1"/><path d="m9 14-2 5"/><path d="m13 10-3-2-2 3"/></Icon>;
const IconFire = (p) => <Icon {...p}><path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4-1 3 1 4 2 3 0-3 1-6 1-9z"/></Icon>;
const IconRoute = (p) => <Icon {...p}><circle cx="6" cy="5" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M6 7.5v3a3.5 3.5 0 0 0 3.5 3.5h5a3.5 3.5 0 0 1 3.5 3.5"/></Icon>;
const IconBolt = (p) => <Icon {...p}><path d="M13 3 5 14h6l-1 7 8-11h-6l1-7z"/></Icon>;
const IconHeart = (p) => <Icon {...p}><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/></Icon>;
const IconClock = (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>;
const IconChevR = (p) => <Icon {...p}><path d="m9 6 6 6-6 6"/></Icon>;
const IconChevL = (p) => <Icon {...p}><path d="m15 6-6 6 6 6"/></Icon>;
const IconChevD = (p) => <Icon {...p}><path d="m6 9 6 6 6-6"/></Icon>;
const IconArrowUR = (p) => <Icon {...p}><path d="M7 17 17 7"/><path d="M9 7h8v8"/></Icon>;
const IconArrowR = (p) => <Icon {...p}><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></Icon>;
const IconPlus = (p) => <Icon {...p}><path d="M12 5v14"/><path d="M5 12h14"/></Icon>;
const IconBell = (p) => <Icon {...p}><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10 18a2 2 0 0 0 4 0"/></Icon>;
const IconSettings = (p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.7l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.7-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.7.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.7 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.7.3h0a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.7-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.7v0a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/></Icon>;
const IconSparkle = (p) => <Icon {...p}><path d="M12 4v4M12 16v4M4 12h4M16 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M6.3 17.7l2.8-2.8M14.9 9.1l2.8-2.8"/></Icon>;
const IconShare = (p) => <Icon {...p}><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8 11 8-4M8 13l8 4"/></Icon>;
const IconMedal = (p) => <Icon {...p}><circle cx="12" cy="15" r="5"/><path d="M8 4h8l-2 6h-4z"/><path d="M12 13v4M10.3 15h3.4"/></Icon>;
const IconTarget = (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></Icon>;
const IconPlay = (p) => <Icon {...p} fill><path d="M8 5v14l11-7z"/></Icon>;
const IconPause = (p) => <Icon {...p} fill><path d="M7 5h3v14H7zM14 5h3v14h-3z"/></Icon>;
const IconStop = (p) => <Icon {...p} fill><path d="M6 6h12v12H6z"/></Icon>;
const IconLock = (p) => <Icon {...p}><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></Icon>;
const IconCheck = (p) => <Icon {...p}><path d="m5 12 5 5 9-11"/></Icon>;
const IconCal = (p) => <Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></Icon>;
const IconLeaf = (p) => <Icon {...p}><path d="M5 19c0-9 7-14 16-14-1 9-5 14-12 14a4 4 0 0 1-4 0z"/><path d="M5 19s5-3 8-8"/></Icon>;
const IconWind = (p) => <Icon {...p}><path d="M4 8h11a3 3 0 1 0-3-3"/><path d="M3 12h17a3 3 0 1 1-3 3"/><path d="M5 16h6"/></Icon>;
const IconStar = (p) => <Icon {...p}><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.8L6.6 19.7l1-6L3.2 9.4l6.1-.9L12 3z"/></Icon>;
const IconLink = (p) => <Icon {...p}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7L11 7"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7L13 17"/></Icon>;
const IconLoc = (p) => <Icon {...p}><path d="M12 22s-7-7-7-12a7 7 0 1 1 14 0c0 5-7 12-7 12z"/><circle cx="12" cy="10" r="2.5"/></Icon>;

Object.assign(window, {
  IconHome, IconTrophy, IconChart, IconCompass, IconUser, IconRun, IconFire,
  IconRoute, IconBolt, IconHeart, IconClock, IconChevR, IconChevL, IconChevD,
  IconArrowUR, IconArrowR, IconPlus, IconBell, IconSettings, IconSparkle,
  IconShare, IconMedal, IconTarget, IconPlay, IconPause, IconStop, IconLock,
  IconCheck, IconCal, IconLeaf, IconWind, IconStar, IconLink, IconLoc,
});
