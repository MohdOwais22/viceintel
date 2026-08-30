export type AvatarHierarchyTier = 'L1' | 'L2' | 'L3' | 'L4';

export interface AvatarPreset {
  id: string;
  label: string;
  character: string;
  game: 'GTA V' | 'GTA VI' | 'Classics' | 'Special' | 'Syndicate';
  category: string;
  role: string;
  url: string;
  fallbackSvgDataUri?: string;
  tier: AvatarHierarchyTier;
  minLevel: number;
  tierLabel: string;
  isSpecialModerator?: boolean;
  lockReason?: string;
}

export type GTA6Avatar = AvatarPreset;

// Generates an authentic, detailed cartoon vector character portrait SVG Data URI
const createCartoonFaceSvgUri = ({
  bg1,
  bg2,
  skinColor,
  hairColor,
  hairType, // 'slick' | 'buzz' | 'balding' | 'long' | 'cap' | 'curly' | 'dreads' | '80s' | 'canine'
  clothingColor,
  clothingStyle, // 'suit' | 'hoodie' | 'vneck' | 'hawaiian' | 'tank' | 'cop' | 'dj' | 'biker'
  eyewear, // 'none' | 'sunglasses' | 'wayfarer' | 'aviator' | 'glasses'
  facialHair, // 'none' | 'stubble' | 'beard' | 'mustache' | 'goatee'
  characterTag,
  gameTag,
  mouthStyle = 'smile', // 'smile' | 'smirk' | 'serious' | 'crazy' | 'dog'
}: {
  bg1: string;
  bg2: string;
  skinColor: string;
  hairColor: string;
  hairType: string;
  clothingColor: string;
  clothingStyle: string;
  eyewear: string;
  facialHair: string;
  characterTag: string;
  gameTag: string;
  mouthStyle?: string;
}) => {
  const uid = characterTag.toLowerCase().replace(/[^a-z0-9]/g, '_');
  
  // Custom SVG path elements for cartoon features
  let hairSvg = '';
  if (hairType === 'slick') {
    hairSvg = `<path d="M35 48 C35 24 50 18 64 18 C78 18 93 24 93 48 C85 36 75 32 64 32 C53 32 43 36 35 48 Z" fill="${hairColor}"/>
               <path d="M33 46 C32 54 34 60 36 65 C38 60 40 50 42 45 Z" fill="${hairColor}"/>
               <path d="M95 46 C96 54 94 60 92 65 C90 60 88 50 86 45 Z" fill="${hairColor}"/>`;
  } else if (hairType === 'buzz') {
    hairSvg = `<path d="M36 50 C36 28 48 22 64 22 C80 22 92 28 92 50 C85 40 76 36 64 36 C52 36 43 40 36 50 Z" fill="${hairColor}"/>`;
  } else if (hairType === 'balding') {
    hairSvg = `<path d="M33 48 C30 55 31 66 35 70 C37 64 38 54 39 48 Z" fill="${hairColor}"/>
               <path d="M95 48 C98 55 97 66 93 70 C91 64 90 54 89 48 Z" fill="${hairColor}"/>
               <path d="M42 32 C48 30 52 32 55 35 C52 33 48 31 43 33 Z" fill="${hairColor}" opacity="0.7"/>
               <path d="M73 32 C78 30 82 32 85 35 C82 33 78 31 74 33 Z" fill="${hairColor}" opacity="0.7"/>`;
  } else if (hairType === 'long') {
    hairSvg = `<path d="M32 46 C32 20 48 16 64 16 C80 16 96 20 96 46 C98 62 97 82 92 92 C88 80 88 64 88 52 C82 36 74 32 64 32 C54 32 46 36 40 52 C40 64 40 80 36 92 C31 82 30 62 32 46 Z" fill="${hairColor}"/>
               <circle cx="34" cy="68" r="4" fill="none" stroke="#f59e0b" stroke-width="1.5"/>
               <circle cx="94" cy="68" r="4" fill="none" stroke="#f59e0b" stroke-width="1.5"/>`;
  } else if (hairType === 'cap') {
    hairSvg = `<path d="M30 42 C30 24 45 18 64 18 C83 18 98 24 98 42 Z" fill="#18181b"/>
               <path d="M26 42 Q64 38 102 42 Q64 48 26 42 Z" fill="#27272a"/>
               <rect x="58" y="24" width="12" height="10" rx="2" fill="#3b82f6"/>`;
  } else if (hairType === '80s') {
    hairSvg = `<path d="M30 46 C28 20 45 14 64 14 C83 14 100 20 98 46 C95 34 85 26 64 26 C43 26 33 34 30 46 Z" fill="${hairColor}"/>
               <path d="M28 42 C22 52 26 68 34 72 C32 62 34 50 38 44 Z" fill="${hairColor}"/>
               <path d="M100 42 C106 52 102 68 94 72 C96 62 94 50 90 44 Z" fill="${hairColor}"/>`;
  } else if (hairType === 'dreads') {
    hairSvg = `<path d="M30 38 C32 18 48 16 64 16 C80 16 96 18 98 38 Z" fill="${hairColor}"/>
               <rect x="28" y="36" width="6" height="34" rx="3" fill="${hairColor}"/>
               <rect x="36" y="38" width="6" height="38" rx="3" fill="${hairColor}"/>
               <rect x="86" y="38" width="6" height="38" rx="3" fill="${hairColor}"/>
               <rect x="94" y="36" width="6" height="34" rx="3" fill="${hairColor}"/>`;
  }

  // Eyewear SVG
  let eyeSvg = '';
  if (eyewear === 'wayfarer' || eyewear === 'sunglasses') {
    eyeSvg = `<path d="M38 52 Q49 50 58 54 Q56 66 42 66 Q36 62 38 52 Z" fill="#09090b" stroke="#27272a" stroke-width="1.5"/>
              <path d="M70 54 Q79 50 90 52 Q92 62 86 66 Q72 66 70 54 Z" fill="#09090b" stroke="#27272a" stroke-width="1.5"/>
              <path d="M58 54 Q64 51 70 54" fill="none" stroke="#27272a" stroke-width="2.5"/>
              <path d="M41 54 L52 56" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" opacity="0.6"/>
              <path d="M73 56 L84 54" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" opacity="0.6"/>`;
  } else if (eyewear === 'aviator') {
    eyeSvg = `<path d="M38 50 Q50 48 58 52 Q58 68 44 68 Q36 64 38 50 Z" fill="#1e293b" stroke="#eab308" stroke-width="1.5"/>
              <path d="M70 52 Q78 48 90 50 Q92 64 84 68 Q70 68 70 52 Z" fill="#1e293b" stroke="#eab308" stroke-width="1.5"/>
              <path d="M58 52 L70 52" stroke="#eab308" stroke-width="2"/>
              <path d="M42 52 L52 64" stroke="#ffffff" stroke-width="1" opacity="0.5"/>
              <path d="M74 52 L84 64" stroke="#ffffff" stroke-width="1" opacity="0.5"/>`;
  } else if (eyewear === 'glasses') {
    eyeSvg = `<rect x="38" y="48" width="20" height="15" rx="3" fill="#e0f2fe" fill-opacity="0.4" stroke="#0f172a" stroke-width="2"/>
              <rect x="70" y="48" width="20" height="15" rx="3" fill="#e0f2fe" fill-opacity="0.4" stroke="#0f172a" stroke-width="2"/>
              <path d="M58 54 L70 54" stroke="#0f172a" stroke-width="2"/>
              <circle cx="48" cy="55" r="3" fill="#0f172a"/>
              <circle cx="80" cy="55" r="3" fill="#0f172a"/>`;
  } else {
    // Normal cartoon eyes
    eyeSvg = `<ellipse cx="48" cy="54" rx="4.5" ry="5.5" fill="#ffffff" stroke="#18181b" stroke-width="1"/>
              <circle cx="49" cy="54" r="2.8" fill="#18181b"/>
              <circle cx="50.2" cy="52.8" r="1" fill="#ffffff"/>
              <ellipse cx="80" cy="54" rx="4.5" ry="5.5" fill="#ffffff" stroke="#18181b" stroke-width="1"/>
              <circle cx="79" cy="54" r="2.8" fill="#18181b"/>
              <circle cx="80.2" cy="52.8" r="1" fill="#ffffff"/>
              <!-- Eyebrows -->
              <path d="M41 46 Q49 43 56 46" fill="none" stroke="${hairColor}" stroke-width="2.5" stroke-linecap="round"/>
              <path d="M72 46 Q79 43 87 46" fill="none" stroke="${hairColor}" stroke-width="2.5" stroke-linecap="round"/>`;
  }

  // Mouth & Facial Hair
  let mouthSvg = '';
  if (mouthStyle === 'crazy') {
    mouthSvg = `<path d="M50 72 Q64 84 78 72 Q64 78 50 72 Z" fill="#991b1b" stroke="#18181b" stroke-width="1.5"/>
                <path d="M54 74 Q64 78 74 74" fill="none" stroke="#ffffff" stroke-width="2"/>`;
  } else if (mouthStyle === 'smirk') {
    mouthSvg = `<path d="M52 74 Q64 76 77 70" fill="none" stroke="#18181b" stroke-width="2.5" stroke-linecap="round"/>`;
  } else if (mouthStyle === 'serious') {
    mouthSvg = `<path d="M52 73 Q64 72 76 73" fill="none" stroke="#18181b" stroke-width="2.5" stroke-linecap="round"/>`;
  } else {
    mouthSvg = `<path d="M52 72 Q64 80 76 72" fill="none" stroke="#18181b" stroke-width="2.5" stroke-linecap="round"/>`;
  }

  let beardSvg = '';
  if (facialHair === 'stubble') {
    beardSvg = `<path d="M44 66 C44 80 52 86 64 86 C76 86 84 80 84 66 C80 74 72 80 64 80 C56 80 48 74 44 66 Z" fill="${hairColor}" opacity="0.35"/>`;
  } else if (facialHair === 'beard') {
    beardSvg = `<path d="M42 64 C42 82 50 90 64 90 C78 90 86 82 86 64 C82 72 74 80 64 80 C54 80 46 72 42 64 Z" fill="${hairColor}"/>`;
  } else if (facialHair === 'goatee') {
    beardSvg = `<path d="M54 68 Q64 67 74 68 Q72 76 64 86 Q56 76 54 68 Z" fill="${hairColor}"/>`;
  } else if (facialHair === 'mustache') {
    beardSvg = `<path d="M48 68 Q64 64 80 68 Q64 72 48 68 Z" fill="${hairColor}"/>`;
  }

  // Clothing SVG
  let clothSvg = '';
  if (clothingStyle === 'suit') {
    clothSvg = `<path d="M24 116 Q36 86 64 86 Q92 86 104 116 Z" fill="${clothingColor}"/>
                <path d="M52 86 L64 116 L76 86 Z" fill="#f8fafc"/>
                <path d="M61 92 L64 116 L67 92 Z" fill="#0284c7"/>
                <path d="M44 90 L54 116" stroke="#0f172a" stroke-width="2"/>
                <path d="M84 90 L74 116" stroke="#0f172a" stroke-width="2"/>`;
  } else if (clothingStyle === 'hoodie') {
    clothSvg = `<path d="M24 116 Q36 86 64 86 Q92 86 104 116 Z" fill="${clothingColor}"/>
                <path d="M48 86 Q64 100 80 86 Q64 92 48 86 Z" fill="#18181b" opacity="0.3"/>
                <path d="M58 94 L56 110 M70 94 L72 110" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>`;
  } else if (clothingStyle === 'hawaiian') {
    clothSvg = `<path d="M24 116 Q36 86 64 86 Q92 86 104 116 Z" fill="${clothingColor}"/>
                <path d="M54 86 Q64 100 74 86 Z" fill="${skinColor}"/>
                <circle cx="44" cy="100" r="3" fill="#f59e0b" opacity="0.8"/>
                <circle cx="84" cy="100" r="3" fill="#f59e0b" opacity="0.8"/>
                <circle cx="64" cy="108" r="3" fill="#f59e0b" opacity="0.8"/>`;
  } else if (clothingStyle === 'vneck') {
    clothSvg = `<path d="M24 116 Q36 86 64 86 Q92 86 104 116 Z" fill="${clothingColor}"/>
                <path d="M50 86 L64 104 L78 86 Z" fill="${skinColor}"/>`;
  } else if (clothingStyle === 'tank') {
    clothSvg = `<path d="M32 116 Q38 88 50 88 L52 116 Z" fill="${clothingColor}"/>
                <path d="M96 116 Q90 88 78 88 L76 116 Z" fill="${clothingColor}"/>
                <path d="M50 88 Q64 98 78 88 L76 116 L52 116 Z" fill="${clothingColor}"/>`;
  } else {
    clothSvg = `<path d="M24 116 Q36 86 64 86 Q92 86 104 116 Z" fill="${clothingColor}"/>
                <path d="M52 86 Q64 96 76 86 Z" fill="${skinColor}"/>`;
  }

  // Full composite cartoon SVG
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="100%" height="100%">
    <defs>
      <linearGradient id="bg_${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bg1}"/>
        <stop offset="100%" stop-color="${bg2}"/>
      </linearGradient>
      <radialGradient id="glow_${uid}" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.4"/>
      </radialGradient>
      <filter id="shadow_${uid}" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.4"/>
      </filter>
    </defs>

    <!-- Canvas & Frame Background -->
    <rect width="128" height="128" rx="26" fill="url(#bg_${uid})"/>
    <rect width="128" height="128" rx="26" fill="url(#glow_${uid})"/>
    <rect x="2" y="2" width="124" height="124" rx="24" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.2"/>

    <!-- GTA Comic Halftone Dot Accent -->
    <circle cx="106" cy="22" r="14" fill="#ffffff" opacity="0.08"/>
    <circle cx="106" cy="22" r="8" fill="#ffffff" opacity="0.12"/>

    <!-- Body & Clothing -->
    <g filter="url(#shadow_${uid})">
      ${clothSvg}
    </g>

    <!-- Neck -->
    <rect x="54" y="74" width="20" height="18" fill="${skinColor}"/>
    <path d="M54 78 Q64 84 74 78" fill="none" stroke="#18181b" stroke-width="1" opacity="0.2"/>

    <!-- Head & Ears -->
    <circle cx="36" cy="58" r="6" fill="${skinColor}"/>
    <circle cx="92" cy="58" r="6" fill="${skinColor}"/>
    <path d="M38 52 C38 34 50 30 64 30 C78 30 90 34 90 52 C90 70 78 84 64 84 C50 84 38 70 38 52 Z" fill="${skinColor}"/>
    
    <!-- Facial Hair (Under) -->
    ${beardSvg}

    <!-- Nose -->
    <path d="M62 58 Q64 64 67 63" fill="none" stroke="#18181b" stroke-width="2" stroke-linecap="round"/>

    <!-- Eyes & Eyewear -->
    ${eyeSvg}

    <!-- Mouth -->
    ${mouthSvg}

    <!-- Hair (Over) -->
    ${hairSvg}

    <!-- Game & Character Rockstar Badge -->
    <g transform="translate(6, 102)">
      <rect width="116" height="20" rx="6" fill="#09090b" fill-opacity="0.88" stroke="#27272a" stroke-width="0.8"/>
      <text x="58" y="10" font-family="'Impact', 'Arial Black', sans-serif" font-size="8.5" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="0.5">${characterTag.toUpperCase()}</text>
      <text x="58" y="17" font-family="system-ui, sans-serif" font-size="5.5" font-weight="800" fill="${bg1}" text-anchor="middle" letter-spacing="0.8">${gameTag.toUpperCase()}</text>
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const GTA6_AVATARS: AvatarPreset[] = [
  // ==========================================
  // L1 STANDARD TIER: GTA V LEGENDS (LOS SANTOS)
  // ==========================================
  {
    id: 'michael_de_santa',
    label: 'Michael De Santa',
    character: 'Michael',
    game: 'GTA V',
    category: 'GTA V Protagonists',
    role: 'The Mastermind / Heist Leader',
    tier: 'L1',
    minLevel: 1,
    tierLabel: 'L1 Standard User',
    url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=MichaelDeSanta&top=theCaesarAndSidePart&hairColor=brownDark&facialHair=beardLight&facialHairProbability=100&clothing=blazerAndShirt&clothesColor=gray02&accessories=wayfarers&accessoriesProbability=100&skinColor=light&mouth=serious&eyebrows=defaultNatural&backgroundColor=0284c7',
    fallbackSvgDataUri: createCartoonFaceSvgUri({
      bg1: '#0284c7',
      bg2: '#082f49',
      skinColor: '#fed7aa',
      hairColor: '#451a03',
      hairType: 'slick',
      clothingColor: '#1e293b',
      clothingStyle: 'suit',
      eyewear: 'wayfarer',
      facialHair: 'stubble',
      mouthStyle: 'serious',
      characterTag: 'Michael De Santa',
      gameTag: 'GTA V • Los Santos'
    })
  },
  {
    id: 'franklin_clinton',
    label: 'Franklin Clinton',
    character: 'Franklin',
    game: 'GTA V',
    category: 'GTA V Protagonists',
    role: 'The Hustler / Getaway Specialist',
    tier: 'L1',
    minLevel: 1,
    tierLabel: 'L1 Standard User',
    url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=FranklinClinton&top=theCaesar&hairColor=black&clothing=hoodie&clothesColor=pastelGreen&skinColor=darkBrown&facialHair=beardLight&facialHairProbability=100&mouth=smile&eyebrows=default&backgroundColor=15803d',
    fallbackSvgDataUri: createCartoonFaceSvgUri({
      bg1: '#16a34a',
      bg2: '#052e16',
      skinColor: '#78350f',
      hairColor: '#0f172a',
      hairType: 'buzz',
      clothingColor: '#15803d',
      clothingStyle: 'hoodie',
      eyewear: 'none',
      facialHair: 'goatee',
      mouthStyle: 'smile',
      characterTag: 'Franklin Clinton',
      gameTag: 'GTA V • Families'
    })
  },
  {
    id: 'trevor_philips',
    label: 'Trevor Philips',
    character: 'Trevor',
    game: 'GTA V',
    category: 'GTA V Protagonists',
    role: 'Trevor Philips Enterprises / Chaos',
    tier: 'L1',
    minLevel: 1,
    tierLabel: 'L1 Standard User',
    url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=TrevorCrazyPhilips&top=shortFlat&hairColor=silverGray&facialHair=beardMedium&facialHairProbability=100&clothing=shirtVNeck&clothesColor=white&skinColor=light&mouth=scream&eyebrows=angry&eyes=squint&backgroundColor=ea580c',
    fallbackSvgDataUri: createCartoonFaceSvgUri({
      bg1: '#ea580c',
      bg2: '#431407',
      skinColor: '#ffedd5',
      hairColor: '#78716c',
      hairType: 'balding',
      clothingColor: '#f8fafc',
      clothingStyle: 'vneck',
      eyewear: 'none',
      facialHair: 'stubble',
      mouthStyle: 'crazy',
      characterTag: 'Trevor Philips',
      gameTag: 'GTA V • Blaine County'
    })
  },
  {
    id: 'lester_crest',
    label: 'Lester Crest',
    character: 'Lester',
    game: 'GTA V',
    category: 'GTA V Heist Crew',
    role: 'The Architect / Master Hacker',
    tier: 'L1',
    minLevel: 1,
    tierLabel: 'L1 Standard User',
    url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=LesterCrestHacker&top=hat&hairColor=brown&accessories=prescription02&accessoriesProbability=100&clothing=collarAndSweater&clothesColor=pastelOrange&skinColor=pale&mouth=concerned&eyebrows=sadConcerned&backgroundColor=4f46e5',
    fallbackSvgDataUri: createCartoonFaceSvgUri({
      bg1: '#4f46e5',
      bg2: '#1e1b4b',
      skinColor: '#fef08a',
      hairColor: '#713f12',
      hairType: 'cap',
      clothingColor: '#ea580c',
      clothingStyle: 'suit',
      eyewear: 'glasses',
      facialHair: 'none',
      mouthStyle: 'smirk',
      characterTag: 'Lester Crest',
      gameTag: 'GTA V • Mastermind'
    })
  },
  {
    id: 'lamar_davis',
    label: 'Lamar Davis',
    character: 'Lamar',
    game: 'GTA V',
    category: 'GTA V Heist Crew',
    role: 'LD Organics / Forum Gangster',
    tier: 'L1',
    minLevel: 1,
    tierLabel: 'L1 Standard User',
    url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=LamarDavisForum&top=dreads01&hairColor=black&facialHair=moustacheFancy&facialHairProbability=100&clothing=graphicShirt&clothesColor=pastelGreen&skinColor=black&mouth=twinkle&eyebrows=raisedExcited&backgroundColor=059669',
    fallbackSvgDataUri: createCartoonFaceSvgUri({
      bg1: '#059669',
      bg2: '#022c22',
      skinColor: '#451a03',
      hairColor: '#09090b',
      hairType: 'dreads',
      clothingColor: '#10b981',
      clothingStyle: 'hoodie',
      eyewear: 'none',
      facialHair: 'mustache',
      mouthStyle: 'smirk',
      characterTag: 'Lamar Davis',
      gameTag: 'GTA V • LD Organics'
    })
  },
  {
    id: 'chop_rottweiler',
    label: 'Chop the Rottweiler',
    character: 'Chop',
    game: 'GTA V',
    category: 'GTA V Heist Crew',
    role: 'Franklin\'s Loyal Canine Boss',
    tier: 'L1',
    minLevel: 1,
    tierLabel: 'L1 Standard User',
    url: 'https://api.dicebear.com/9.x/bottts/svg?seed=ChopRottweiler2026&texture=circuits&backgroundColor=78350f',
    fallbackSvgDataUri: createCartoonFaceSvgUri({
      bg1: '#78350f',
      bg2: '#271005',
      skinColor: '#451a03',
      hairColor: '#f59e0b',
      hairType: 'canine',
      clothingColor: '#d97706',
      clothingStyle: 'hoodie',
      eyewear: 'sunglasses',
      facialHair: 'none',
      mouthStyle: 'smile',
      characterTag: 'Chop Rottweiler',
      gameTag: 'GTA V • Vinewood'
    })
  },

  // ==========================================
  // L1 STANDARD TIER: ROCKSTAR CLASSICS
  // ==========================================
  {
    id: 'tommy_vercetti',
    label: 'Tommy Vercetti',
    character: 'Tommy',
    game: 'Classics',
    category: 'Rockstar Classics',
    role: 'The Original King of Vice City (1986)',
    tier: 'L1',
    minLevel: 1,
    tierLabel: 'L1 Standard User',
    url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=TommyVercetti80s&top=shortWaved&hairColor=black&clothing=shirtCrewNeck&clothesColor=pastelBlue&skinColor=tanned&mouth=serious&eyebrows=upDown&backgroundColor=0d9488',
    fallbackSvgDataUri: createCartoonFaceSvgUri({
      bg1: '#0d9488',
      bg2: '#042f2e',
      skinColor: '#fed7aa',
      hairColor: '#09090b',
      hairType: '80s',
      clothingColor: '#06b6d4',
      clothingStyle: 'hawaiian',
      eyewear: 'none',
      facialHair: 'stubble',
      mouthStyle: 'serious',
      characterTag: 'Tommy Vercetti',
      gameTag: 'Vice City • 1986'
    })
  },
  {
    id: 'carl_cj_johnson',
    label: 'Carl "CJ" Johnson',
    character: 'CJ',
    game: 'Classics',
    category: 'Rockstar Classics',
    role: 'Grove Street Legend (San Andreas)',
    tier: 'L1',
    minLevel: 1,
    tierLabel: 'L1 Standard User',
    url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=CarlJohnsonGroveSt&top=theCaesar&hairColor=black&clothing=shirtScoopNeck&clothesColor=white&skinColor=darkBrown&mouth=serious&eyebrows=default&backgroundColor=16a34a',
    fallbackSvgDataUri: createCartoonFaceSvgUri({
      bg1: '#16a34a',
      bg2: '#052e16',
      skinColor: '#78350f',
      hairColor: '#09090b',
      hairType: 'buzz',
      clothingColor: '#f8fafc',
      clothingStyle: 'tank',
      eyewear: 'none',
      facialHair: 'none',
      mouthStyle: 'serious',
      characterTag: 'Carl "CJ" Johnson',
      gameTag: 'San Andreas • 1992'
    })
  },
  {
    id: 'claude_speed',
    label: 'Claude Speed',
    character: 'Claude',
    game: 'Classics',
    category: 'Rockstar Classics',
    role: 'The Silent Assassin (Liberty City)',
    tier: 'L1',
    minLevel: 1,
    tierLabel: 'L1 Standard User',
    url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=ClaudeSpeedLiberty&top=shortFlat&hairColor=black&clothing=collarAndSweater&clothesColor=black&skinColor=light&mouth=serious&eyes=squint&backgroundColor=3f3f46',
    fallbackSvgDataUri: createCartoonFaceSvgUri({
      bg1: '#3f3f46',
      bg2: '#18181b',
      skinColor: '#fed7aa',
      hairColor: '#18181b',
      hairType: 'slick',
      clothingColor: '#166534',
      clothingStyle: 'suit',
      eyewear: 'none',
      facialHair: 'stubble',
      mouthStyle: 'serious',
      characterTag: 'Claude Speed',
      gameTag: 'GTA III • Liberty City'
    })
  },

  // ==========================================
  // L2 VIP TIER: GTA VI VICE CITY PROTAGONISTS & CREW
  // ==========================================
  {
    id: 'lucia_caminos',
    label: 'Lucia Caminos',
    character: 'Lucia',
    game: 'GTA VI',
    category: 'GTA VI Vice City',
    role: 'The Outlaw / Vice City Survivor',
    tier: 'L2',
    minLevel: 2,
    tierLabel: 'L2 VIP Pass Exclusive',
    lockReason: 'Requires L2 VIP Membership Pass to equip GTA VI Protagonists.',
    url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=LuciaViceCity2026&top=straight01&hairColor=black&clothing=graphicShirt&clothesColor=pink&skinColor=tanned&mouth=smile&eyebrows=defaultNatural&backgroundColor=e11d48',
    fallbackSvgDataUri: createCartoonFaceSvgUri({
      bg1: '#e11d48',
      bg2: '#4c0519',
      skinColor: '#d97706',
      hairColor: '#09090b',
      hairType: 'long',
      clothingColor: '#f43f5e',
      clothingStyle: 'hoodie',
      eyewear: 'none',
      facialHair: 'none',
      mouthStyle: 'smile',
      characterTag: 'Lucia Caminos',
      gameTag: 'GTA VI • Vice City'
    })
  },
  {
    id: 'jason_duval',
    label: 'Jason Duval',
    character: 'Jason',
    game: 'GTA VI',
    category: 'GTA VI Vice City',
    role: 'The Specialist / Tactical Enforcer',
    tier: 'L2',
    minLevel: 2,
    tierLabel: 'L2 VIP Pass Exclusive',
    lockReason: 'Requires L2 VIP Membership Pass to equip GTA VI Protagonists.',
    url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=JasonViceTactical&top=shortWaved&hairColor=brown&facialHair=beardLight&facialHairProbability=100&clothing=hoodie&clothesColor=blue02&skinColor=tanned&mouth=serious&eyebrows=default&backgroundColor=2563eb',
    fallbackSvgDataUri: createCartoonFaceSvgUri({
      bg1: '#2563eb',
      bg2: '#172554',
      skinColor: '#fed7aa',
      hairColor: '#78350f',
      hairType: 'slick',
      clothingColor: '#1d4ed8',
      clothingStyle: 'hoodie',
      eyewear: 'none',
      facialHair: 'stubble',
      mouthStyle: 'serious',
      characterTag: 'Jason Duval',
      gameTag: 'GTA VI • Leonida'
    })
  },
  {
    id: 'ocean_drive_dj',
    label: 'Ocean Drive Neon DJ',
    character: 'Neon DJ',
    game: 'GTA VI',
    category: 'GTA VI Vice City',
    role: 'Club Vice Nightlife Resident',
    tier: 'L2',
    minLevel: 2,
    tierLabel: 'L2 VIP Pass Exclusive',
    lockReason: 'Requires L2 VIP Membership Pass to equip GTA VI Crew.',
    url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=OceanDriveNeonDJ&top=dreads02&hairColor=red&accessories=sunglasses&accessoriesProbability=100&clothing=graphicShirt&clothesColor=pink&skinColor=tanned&mouth=twinkle&backgroundColor=c026d3',
    fallbackSvgDataUri: createCartoonFaceSvgUri({
      bg1: '#c026d3',
      bg2: '#4a044e',
      skinColor: '#fcd34d',
      hairColor: '#f43f5e',
      hairType: 'dreads',
      clothingColor: '#d946ef',
      clothingStyle: 'hawaiian',
      eyewear: 'sunglasses',
      facialHair: 'none',
      mouthStyle: 'smile',
      characterTag: 'Neon DJ',
      gameTag: 'GTA VI • Ocean Drive'
    })
  },
  {
    id: 'everglades_outlaw',
    label: 'Everglades Mud Biker',
    character: 'Outlaw Biker',
    game: 'GTA VI',
    category: 'GTA VI Vice City',
    role: 'Port Gellhorn Outlaw Syndicate',
    tier: 'L2',
    minLevel: 2,
    tierLabel: 'L2 VIP Pass Exclusive',
    lockReason: 'Requires L2 VIP Membership Pass to equip GTA VI Crew.',
    url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=EvergladesBiker&top=turban&hairColor=black&facialHair=beardMajestic&facialHairProbability=100&clothing=overall&clothesColor=heather&skinColor=tanned&accessories=sunglasses&accessoriesProbability=100&backgroundColor=d97706',
    fallbackSvgDataUri: createCartoonFaceSvgUri({
      bg1: '#d97706',
      bg2: '#451a03',
      skinColor: '#b45309',
      hairColor: '#1c1917',
      hairType: 'slick',
      clothingColor: '#292524',
      clothingStyle: 'biker',
      eyewear: 'sunglasses',
      facialHair: 'beard',
      mouthStyle: 'serious',
      characterTag: 'Outlaw Biker',
      gameTag: 'GTA VI • Gellhorn'
    })
  },

  // ==========================================
  // L2 VIP TIER: VICE SYNDICATES
  // ==========================================
  {
    id: 'cartel_kingpin',
    label: 'Cartel Kingpin',
    character: 'Don Mateo',
    game: 'Syndicate',
    category: 'Vice Syndicates',
    role: 'Biscayne Cartel Syndicate Leader',
    tier: 'L2',
    minLevel: 2,
    tierLabel: 'L2 VIP Pass Exclusive',
    lockReason: 'Requires L2 VIP Membership Pass to equip Vice Syndicates.',
    url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=BiscayneCartelDon&top=shortFlat&hairColor=black&facialHair=moustacheMagnum&facialHairProbability=100&clothing=blazerAndShirt&clothesColor=white&skinColor=tanned&accessories=sunglasses&accessoriesProbability=100&backgroundColor=b91c1c',
    fallbackSvgDataUri: createCartoonFaceSvgUri({
      bg1: '#b91c1c',
      bg2: '#450a0a',
      skinColor: '#d97706',
      hairColor: '#09090b',
      hairType: 'slick',
      clothingColor: '#f8fafc',
      clothingStyle: 'suit',
      eyewear: 'sunglasses',
      facialHair: 'mustache',
      mouthStyle: 'serious',
      characterTag: 'Don Mateo',
      gameTag: 'Biscayne Cartel'
    })
  },
  {
    id: 'neon_drifter',
    label: 'Neon Drifter',
    character: 'Kira Vance',
    game: 'Syndicate',
    category: 'Vice Syndicates',
    role: 'Midnight Ocean Drive Street Racer',
    tier: 'L2',
    minLevel: 2,
    tierLabel: 'L2 VIP Pass Exclusive',
    lockReason: 'Requires L2 VIP Membership Pass to equip Vice Syndicates.',
    url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=NeonDrifterKira&top=straight02&hairColor=auburn&clothing=hoodie&clothesColor=pastelRed&skinColor=light&mouth=twinkle&accessories=eyepatch&backgroundColor=ec4899',
    fallbackSvgDataUri: createCartoonFaceSvgUri({
      bg1: '#ec4899',
      bg2: '#831843',
      skinColor: '#fed7aa',
      hairColor: '#db2777',
      hairType: 'long',
      clothingColor: '#be185d',
      clothingStyle: 'hoodie',
      eyewear: 'none',
      facialHair: 'none',
      mouthStyle: 'smirk',
      characterTag: 'Kira Vance',
      gameTag: 'Neon Drifters'
    })
  },
  {
    id: 'vice_hacker',
    label: 'Vice Cyber Hacker',
    character: 'Zero Byte',
    game: 'Syndicate',
    category: 'Vice Syndicates',
    role: 'Encrypted Darknet Specialist',
    tier: 'L2',
    minLevel: 2,
    tierLabel: 'L2 VIP Pass Exclusive',
    lockReason: 'Requires L2 VIP Membership Pass to equip Vice Syndicates.',
    url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=ViceCyberZeroByte&top=hat&hairColor=black&accessories=prescription01&accessoriesProbability=100&clothing=graphicShirt&clothesColor=black&skinColor=pale&backgroundColor=6366f1',
    fallbackSvgDataUri: createCartoonFaceSvgUri({
      bg1: '#6366f1',
      bg2: '#1e1b4b',
      skinColor: '#fef08a',
      hairColor: '#0f172a',
      hairType: 'cap',
      clothingColor: '#09090b',
      clothingStyle: 'hoodie',
      eyewear: 'glasses',
      facialHair: 'none',
      mouthStyle: 'smirk',
      characterTag: 'Zero Byte',
      gameTag: 'Darknet Hacker'
    })
  },
  {
    id: 'nightclub_mogul',
    label: 'Nightclub Mogul',
    character: 'Sasha Vance',
    game: 'Syndicate',
    category: 'Vice Syndicates',
    role: 'Malibu Club VIP Executive',
    tier: 'L2',
    minLevel: 2,
    tierLabel: 'L2 VIP Pass Exclusive',
    lockReason: 'Requires L2 VIP Membership Pass to equip Vice Syndicates.',
    url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=MalibuClubSasha&top=curvy&hairColor=blonde&clothing=overall&clothesColor=pink&skinColor=light&mouth=smile&accessories=sunglasses&accessoriesProbability=100&backgroundColor=a855f7',
    fallbackSvgDataUri: createCartoonFaceSvgUri({
      bg1: '#a855f7',
      bg2: '#3b0764',
      skinColor: '#ffedd5',
      hairColor: '#facc15',
      hairType: 'long',
      clothingColor: '#c026d3',
      clothingStyle: 'vneck',
      eyewear: 'sunglasses',
      facialHair: 'none',
      mouthStyle: 'smile',
      characterTag: 'Sasha Vance',
      gameTag: 'Malibu Club VIP'
    })
  },

  // ==========================================
  // L3 SPECIAL MODERATOR TIER: EXCLUSIVE TO L3 STAFF / MODERATORS
  // ==========================================
  {
    id: 'vice_detective',
    label: 'Vice Squad Detective (Special Moderator Avatar)',
    character: 'Detective',
    game: 'Special',
    category: 'Special Moderator',
    role: 'Leonida Metro Police Dept • Staff Moderator',
    tier: 'L3',
    minLevel: 3,
    tierLabel: 'L3 Staff / Moderator Exclusive',
    isSpecialModerator: true,
    lockReason: 'Special Moderator Avatar is exclusively reserved for L3 Vice Squad Staff & Moderators.',
    url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=ViceSquadDetective&top=hat&hairColor=black&accessories=sunglasses&accessoriesProbability=100&facialHair=moustacheMagnum&facialHairProbability=100&clothing=blazerAndShirt&clothesColor=black&skinColor=light&backgroundColor=0284c7',
    fallbackSvgDataUri: createCartoonFaceSvgUri({
      bg1: '#0284c7',
      bg2: '#0c4a6e',
      skinColor: '#fed7aa',
      hairColor: '#09090b',
      hairType: 'cap',
      clothingColor: '#0f172a',
      clothingStyle: 'suit',
      eyewear: 'aviator',
      facialHair: 'mustache',
      mouthStyle: 'serious',
      characterTag: 'Special Moderator',
      gameTag: 'VCPD • Staff L3'
    })
  },
  {
    id: 'vice_squad_enforcer',
    label: 'Vice Squad Tactical Enforcer (Special Moderator Avatar)',
    character: 'Tactical Officer',
    game: 'Special',
    category: 'Special Moderator',
    role: 'Leonida Special Response Unit • Staff Moderator',
    tier: 'L3',
    minLevel: 3,
    tierLabel: 'L3 Staff / Moderator Exclusive',
    isSpecialModerator: true,
    lockReason: 'Special Moderator Avatar is exclusively reserved for L3 Vice Squad Staff & Moderators.',
    url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=ViceSquadEnforcerL3&top=shortFlat&hairColor=black&accessories=sunglasses&accessoriesProbability=100&facialHair=beardLight&facialHairProbability=100&clothing=hoodie&clothesColor=black&skinColor=tanned&backgroundColor=0369a1',
    fallbackSvgDataUri: createCartoonFaceSvgUri({
      bg1: '#0369a1',
      bg2: '#082f49',
      skinColor: '#fed7aa',
      hairColor: '#0f172a',
      hairType: 'buzz',
      clothingColor: '#0f172a',
      clothingStyle: 'biker',
      eyewear: 'sunglasses',
      facialHair: 'beard',
      mouthStyle: 'serious',
      characterTag: 'Vice Tactical Mod',
      gameTag: 'Leonida SRU • L3'
    })
  }
];

// Cache-invalidation token: force recompile 2026-08-23
export const generateCustomGtaAvatar = (seed: string, style = 'avataaars') => {
  const cleanSeed = (seed || 'ViceCityPlayer').trim();
  return createCartoonFaceSvgUri({
    bg1: '#0284c7',
    bg2: '#0f172a',
    skinColor: '#fed7aa',
    hairColor: '#09090b',
    hairType: 'slick',
    clothingColor: '#2563eb',
    clothingStyle: 'vneck',
    eyewear: 'none',
    facialHair: 'stubble',
    mouthStyle: 'smile',
    characterTag: cleanSeed.length > 14 ? cleanSeed.slice(0, 14) : cleanSeed,
    gameTag: 'GTA VI • Vice City'
  });
};

// Ensure all preset URLs use their high-fidelity vector SVG data URIs so they work 100% reliably offline & in all browser frames
GTA6_AVATARS.forEach(preset => {
  (preset as any).shortUrl = preset.url; // Keep the original short URL before overwriting with SVG Data URI
  if (preset.fallbackSvgDataUri) {
    preset.url = preset.fallbackSvgDataUri;
  }
});

export const DEFAULT_GTA6_AVATAR = GTA6_AVATARS[0]?.fallbackSvgDataUri || GTA6_AVATARS[0]?.url || generateCustomGtaAvatar('Lucia');

/**
 * Returns a shortened, safe, valid HTTP URL suitable for Firebase Auth's photoURL attribute.
 * Prevents the "Photo URL too long" (auth/invalid-profile-attribute) error by ensuring
 * that any long inline SVG data URIs (which exceed 2048 characters) are replaced with
 * a short, standard, valid Dicebear HTTP URL.
 */
export function getSafePhotoURL(avatarUrl?: string | null, usernameOrSeed?: string | null): string {
  if (!avatarUrl || typeof avatarUrl !== 'string' || avatarUrl.trim().length === 0) {
    return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(usernameOrSeed || 'ViceLegend')}`;
  }

  const cleanUrl = avatarUrl.trim();

  // If it's a short HTTP URL, it's already safe (Firebase limit is 2048 characters)
  if (cleanUrl.startsWith('http') && cleanUrl.length < 1500) {
    return cleanUrl;
  }

  // If it's a long inline SVG data URI, check if it matches any preset in GTA6_AVATARS
  const matchedPreset = GTA6_AVATARS.find(a => 
    a.id === cleanUrl || 
    a.url === cleanUrl || 
    a.fallbackSvgDataUri === cleanUrl ||
    (a as any).shortUrl === cleanUrl
  );

  if (matchedPreset) {
    return (matchedPreset as any).shortUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(matchedPreset.id)}`;
  }

  // For custom generated avatars (long SVGs), fallback to a safe short Dicebear URL using the username/seed
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(usernameOrSeed || 'ViceLegend')}`;
}

/**
 * Resolves an applicant's avatar into a clean GTA VI stylized character vector avatar.
 * Guarantees zero broken image links by preferring self-contained vector SVG data URIs.
 */
export function resolveApplicantAvatar(avatarUrl?: string | null, usernameOrTag?: string | null): string {
  if (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.trim().length > 0) {
    const cleanUrl = avatarUrl.trim();

    // 1. If it's already an inline SVG Data URI
    if (cleanUrl.startsWith('data:image/')) {
      return cleanUrl;
    }

    // 2. Match against preset ID, label, character name, or URL
    const matchedPreset = GTA6_AVATARS.find(a => 
      a.id === cleanUrl || 
      a.url === cleanUrl || 
      (a as any).shortUrl === cleanUrl ||
      a.character.toLowerCase() === cleanUrl.toLowerCase() ||
      a.label.toLowerCase() === cleanUrl.toLowerCase()
    );
    if (matchedPreset) {
      return matchedPreset.fallbackSvgDataUri || matchedPreset.url;
    }

    // 3. If it's a valid external HTTP(S) image URL (and not an old broken api.dicebear endpoint)
    if ((cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) && !cleanUrl.includes('api.dicebear.com/7.x') && !cleanUrl.includes('api.dicebear.com/9.x')) {
      return cleanUrl;
    }
  }

  // 4. Default fallback: generate a custom vector SVG avatar based on the player's username or tag
  return generateCustomGtaAvatar(usernameOrTag || 'ViceCityPlayer');
}

/**
 * Resolves user clearance level into a normalized hierarchy representation:
 * - L4: Admin (Unrestricted) -> "don't do anything for L4"
 * - L3: Staff / Moderator (Has access to special moderator avatar + L1 + L2)
 * - L2: VIP Member (Has access to L1 + L2 avatars, locked from L3 special moderator avatar)
 * - L1: Regular User (Has access only to L1 standard avatars, locked from L2 VIP & L3 special moderator)
 */
export function getUserHierarchyLevel(options: {
  isAdmin?: boolean;
  isStaff?: boolean;
  isVip?: boolean;
  role?: string;
  userLevel?: string;
  clearanceLevel?: string;
}): {
  level: AvatarHierarchyTier;
  levelNum: number;
  label: string;
  badgeColor: string;
  isUnrestricted: boolean;
} {
  if (
    options.isAdmin ||
    options.role === 'Admin' ||
    options.role === 'L4' ||
    options.userLevel === 'L4' ||
    options.clearanceLevel === 'L4'
  ) {
    return {
      level: 'L4',
      levelNum: 4,
      label: 'Level 4 Admin',
      badgeColor: 'bg-red-500/20 text-red-400 border-red-500/40',
      isUnrestricted: true
    };
  }

  if (
    options.isStaff ||
    options.role === 'Staff' ||
    options.role === 'L3' ||
    options.userLevel === 'L3' ||
    options.clearanceLevel === 'L3'
  ) {
    return {
      level: 'L3',
      levelNum: 3,
      label: 'Level 3 Staff / Moderator',
      badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
      isUnrestricted: false
    };
  }

  if (
    options.isVip ||
    options.role === 'VIP Member' ||
    options.role === 'L2' ||
    options.userLevel === 'L2' ||
    options.userLevel === 'VIP' ||
    options.clearanceLevel === 'L2'
  ) {
    return {
      level: 'L2',
      levelNum: 2,
      label: 'Level 2 VIP Member',
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
      isUnrestricted: false
    };
  }

  return {
    level: 'L1',
    levelNum: 1,
    label: 'Level 1 Standard User',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    isUnrestricted: false
  };
}

/**
 * Evaluates whether an avatar is unlocked for a given user hierarchy level:
 * - L4 (Admin): "don't do anything for L4" -> Always unlocked, zero restrictions.
 * - L3 (Staff / Mod): Unlocks L1, L2, and L3 Special Moderator avatars.
 * - L2 (VIP): Unlocks L1 and L2 avatars. Locked for L3 Special Moderator avatars.
 * - L1 (User): Unlocks only L1 avatars. Locked for L2 VIP and L3 Special Moderator avatars.
 */
export function checkAvatarAccess(
  avatar: AvatarPreset | string,
  userLevelInfo: { levelNum: number; level: AvatarHierarchyTier; isUnrestricted?: boolean }
): {
  isUnlocked: boolean;
  reason?: string;
  requiredTier: AvatarHierarchyTier;
} {
  // L4 Admin: "don't do anything for L4" -> full unrestricted access
  if (userLevelInfo.level === 'L4' || userLevelInfo.levelNum >= 4 || userLevelInfo.isUnrestricted) {
    return { isUnlocked: true, requiredTier: 'L1' };
  }

  const preset = typeof avatar === 'string'
    ? GTA6_AVATARS.find(a => a.url === avatar)
    : avatar;

  if (!preset) {
    return { isUnlocked: true, requiredTier: 'L1' };
  }

  // L3 Special Moderator Avatar Check
  if (preset.isSpecialModerator || preset.tier === 'L3') {
    if (userLevelInfo.levelNum >= 3) {
      return { isUnlocked: true, requiredTier: 'L3' };
    }
    return {
      isUnlocked: false,
      reason: 'Special Moderator Avatar is strictly reserved for Level 3 (L3) Vice Squad Staff & Moderators.',
      requiredTier: 'L3'
    };
  }

  // L2 VIP Tier Check
  if (preset.tier === 'L2') {
    if (userLevelInfo.levelNum >= 2) {
      return { isUnlocked: true, requiredTier: 'L2' };
    }
    return {
      isUnlocked: false,
      reason: 'L2 VIP Membership Pass required to unlock GTA VI Protagonists & Syndicates.',
      requiredTier: 'L2'
    };
  }

  // L1 Standard Tier
  return { isUnlocked: true, requiredTier: 'L1' };
}




