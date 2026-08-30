// GTA VI Thematic Image Resolver and Curated Visual Asset Library
// Provides high-resolution, diverse GTA VI & Vice City imagery with intelligent topic-matching

export interface ThematicImageItem {
  id: string;
  url: string;
  title: string;
  category: 'Supercars & Racing' | 'Ocean Drive & Neon City' | 'Downtown & Skyline' | 'Florida Keys & Marine' | 'Everglades & Wetlands' | 'Heists & Underground' | 'Weapons & Armory' | 'Nightlife & VIP' | 'Roleplay & Police' | 'PC Tech & Ray Tracing';
  tags: string[];
  description: string;
}

export interface AuthorPersona {
  id: string;
  name: string;
  role: string;
  avatar: string;
  bio: string;
}

export const GTA6_THEMATIC_IMAGES: ThematicImageItem[] = [
  // 1. Supercars & Racing
  {
    id: 'img-supercar-neon-drift',
    url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
    title: 'Neon Supercar Night Drag',
    category: 'Supercars & Racing',
    tags: ['supercar', 'drag', 'tuning', 'speed', 'racing', 'handling', 'acceleration', 'quarter-mile', 'top speed', 'drifting', 'engine', 'boost'],
    description: 'High-speed sports vehicle tearing down neon-lit coastal highway.'
  },
  {
    id: 'img-muscle-car-burnout',
    url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
    title: 'Vice City Muscle Car Burnout',
    category: 'Supercars & Racing',
    tags: ['muscle', 'burnout', 'v8', 'drag', 'tuning', 'custom', 'classic', 'modding', 'drift'],
    description: 'American classic muscle car spinning tires on asphalt.'
  },
  {
    id: 'img-tuning-garage-customs',
    url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&q=80',
    title: 'Ocean Drive Underground Mod Garage',
    category: 'Supercars & Racing',
    tags: ['garage', 'mod', 'custom', 'mechanic', 'tuning', 'physics', 'fmass', 'suspension', 'turbo', 'handling.meta'],
    description: 'Custom performance tuner shop with hydraulic lift and tool racks.'
  },
  {
    id: 'img-hypercar-sunset-beach',
    url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
    title: 'Vice Beach Hypercar Showcase',
    category: 'Supercars & Racing',
    tags: ['hypercar', 'luxury', 'vice beach', 'sunset', 'speed', 'top speed', 'aero', 'downforce'],
    description: 'Exotic hypercar parked overlooking the turquoise ocean at sunset.'
  },

  // 2. Ocean Drive & Neon City
  {
    id: 'img-ocean-drive-sunset-palms',
    url: 'https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?auto=format&fit=crop&w=1200&q=80',
    title: 'Ocean Drive Art Deco & Neon Palms',
    category: 'Ocean Drive & Neon City',
    tags: ['ocean drive', 'vice beach', 'palm trees', 'sunset', 'art deco', 'neon', 'miami', 'leonida', 'atmosphere'],
    description: 'Iconic South Beach pastel sunset with glowing neon hotels and palm silhouettes.'
  },
  {
    id: 'img-neon-city-retro-twilight',
    url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80',
    title: 'Vice City Twilight Glow',
    category: 'Ocean Drive & Neon City',
    tags: ['twilight', 'synthwave', 'retro', 'vice city', 'pink sky', 'neon', 'atmosphere', 'district'],
    description: 'Pastel magenta twilight over coastal boulevard.'
  },
  {
    id: 'img-night-street-reflections',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    title: 'Rain-Slicked Vice City Boulevard',
    category: 'Ocean Drive & Neon City',
    tags: ['rain', 'puddles', 'reflections', 'ray tracing', 'night', 'street', 'city lights', 'weather'],
    description: 'Wet pavement reflecting vibrant neon hotel marquees after a tropical storm.'
  },

  // 3. Downtown & Skyline
  {
    id: 'img-downtown-skyline-night',
    url: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1200&q=80',
    title: 'Downtown Vice City Skyscrapers',
    category: 'Downtown & Skyline',
    tags: ['downtown', 'skyline', 'skyscrapers', 'city', 'night', 'lights', 'towers', 'helipad', 'penthouse'],
    description: 'Illuminated metropolitan skyscrapers along the coastal bay.'
  },
  {
    id: 'img-bridge-highway-overpass',
    url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80',
    title: 'Biscayne Bay Bridge & Highway Overpass',
    category: 'Downtown & Skyline',
    tags: ['bridge', 'highway', 'overpass', 'expressway', 'traffic', 'pursuit', 'getaway', 'causeway'],
    description: 'Multi-lane causeway bridge connecting Downtown to Vice Beach.'
  },

  // 4. Florida Keys & Marine
  {
    id: 'img-florida-keys-speedboat',
    url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80',
    title: 'Florida Keys Contraband Speedboat',
    category: 'Florida Keys & Marine',
    tags: ['keys', 'florida keys', 'boat', 'speedboat', 'smuggling', 'contraband', 'ocean', 'marina', 'cutter', 'coast guard'],
    description: 'High-horsepower offshore racing boat cutting through crystal blue waters.'
  },
  {
    id: 'img-tropical-island-aerial',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    title: 'Leonida Archipelago & Hidden Coves',
    category: 'Florida Keys & Marine',
    tags: ['island', 'cove', 'beach', 'tropical', 'secret cache', 'drone', 'aerial', 'map leaks'],
    description: 'Aerial view of tropical islands, sandbars, and emerald waters.'
  },
  {
    id: 'img-luxury-yacht-marina',
    url: 'https://images.unsplash.com/photo-1569263979104-865ab7cd8d17?auto=format&fit=crop&w=1200&q=80',
    title: 'Vice Port Superyacht Slip',
    category: 'Florida Keys & Marine',
    tags: ['yacht', 'marina', 'luxury', 'heist', 'port', 'dock', 'bribe', 'vice port'],
    description: 'Private luxury megayacht docked at the Vice City harbor.'
  },

  // 5. Everglades & Wetlands
  {
    id: 'img-everglades-airboat-swamp',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    title: 'Grassrivers Everglades Airboat Run',
    category: 'Everglades & Wetlands',
    tags: ['everglades', 'grassrivers', 'swamp', 'wetlands', 'airboat', 'alligator', 'bayou', 'survival', 'moonshine'],
    description: 'Misty marshland channel surrounded by tall cypress trees and Spanish moss.'
  },
  {
    id: 'img-rural-swamp-cabin',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
    title: 'Ambrosia Bayou Hidden Moonshine Camp',
    category: 'Everglades & Wetlands',
    tags: ['bayou', 'forest', 'rural', 'stash', 'outlaw', 'cabin', 'creek', 'leonida wilderness'],
    description: 'Remote backwoods hideout deep within the Leonida wetlands.'
  },

  // 6. Heists & Underground
  {
    id: 'img-bank-vault-safe',
    url: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1200&q=80',
    title: 'First National Bank Heavy Vault Door',
    category: 'Heists & Underground',
    tags: ['vault', 'bank', 'safe', 'heist', 'lockpick', 'security', 'bypass', 'alarm', 'payout', 'lucia', 'jason'],
    description: 'Reinforced steel vault door with digital keypad security locks.'
  },
  {
    id: 'img-cash-money-stacks',
    url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80',
    title: 'Syndicate Laundered Cash Stash',
    category: 'Heists & Underground',
    tags: ['cash', 'money', 'business', 'roi', 'laundering', 'payout', 'million', 'capital', 'shark card', 'profit'],
    description: 'Bundles of banknotes prepared for business investment and safe deposits.'
  },
  {
    id: 'img-night-stealth-infil',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
    title: 'Covert Compound Infiltration',
    category: 'Heists & Underground',
    tags: ['stealth', 'infiltrate', 'covert', 'hacking', 'cctv', 'alarm', 'silenced', 'night vision'],
    description: 'Night tactical reconnaissance outside a fortified cartel compound.'
  },

  // 7. Weapons & Armory
  {
    id: 'img-tactical-rifle-bench',
    url: 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?auto=format&fit=crop&w=1200&q=80',
    title: 'Ammu-Nation Custom Armory Bench',
    category: 'Weapons & Armory',
    tags: ['weapon', 'gun', 'rifle', 'ttk', 'dps', 'ammu-nation', 'attachments', 'suppressor', 'optic', 'firearm'],
    description: 'Precision rifle with tactical optics on an armorer workbench.'
  },
  {
    id: 'img-shooting-range-target',
    url: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&w=1200&q=80',
    title: 'Ballistic Recoil & TTK Testing Facility',
    category: 'Weapons & Armory',
    tags: ['ballistics', 'recoil', 'range', 'target', 'bullet', 'headshot', 'marksmanship', 'firefight'],
    description: 'Tactical target testing range analyzing bullet spread and damage dropoff.'
  },

  // 8. Nightlife & VIP
  {
    id: 'img-nightclub-dj-lights',
    url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
    title: 'Malibu Club Neon VIP Dancefloor',
    category: 'Nightlife & VIP',
    tags: ['nightclub', 'dj', 'malibu club', 'vip', 'dance', 'lights', 'party', 'drinks', 'lounge', 'ocean drive'],
    description: 'Atmospheric nightclub illuminated with neon lasers, strobes, and crowd.'
  },
  {
    id: 'img-cocktail-bar-luxury',
    url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1200&q=80',
    title: 'Vice Beach Penthouse Cocktail Lounge',
    category: 'Nightlife & VIP',
    tags: ['luxury', 'cocktail', 'lounge', 'penthouse', 'vip pass', 'casino', 'high-roller'],
    description: 'Sleek luxury bar serving handcrafted drinks in an upscale setting.'
  },

  // 9. Roleplay & Police
  {
    id: 'img-police-cruiser-pursuit',
    url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=1200&q=80',
    title: 'VCPD Interceptor Pursuit Unit',
    category: 'Roleplay & Police',
    tags: ['police', 'vcpd', 'pursuit', 'siren', 'flashing lights', 'swat', 'fivem', 'rp', 'server', 'whitelist', 'cop'],
    description: 'Law enforcement emergency response cruiser with active flashing strobe lightbar.'
  },
  {
    id: 'img-tactical-dispatch-center',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    title: 'Emergency 911 CAD / MDT Dispatch Hub',
    category: 'Roleplay & Police',
    tags: ['dispatch', 'cad', 'mdt', 'roleplay', 'fivem', 'community', 'discord', 'server management'],
    description: 'High-tech dispatch command center monitoring real-time tactical radar feeds.'
  },

  // 10. PC Tech & Ray Tracing
  {
    id: 'img-gaming-pc-setup-neon',
    url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
    title: 'Ultra-Wide 4K Ray Tracing Rig',
    category: 'PC Tech & Ray Tracing',
    tags: ['pc', 'graphics', 'ray tracing', 'rtx', 'fps', 'hardware', 'ultrawide', 'specs', 'modding', 'benchmark'],
    description: 'High-end liquid-cooled gaming PC rig running ultra graphics with ambient RGB glow.'
  },
  {
    id: 'img-gpu-hardware-circuit',
    url: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=1200&q=80',
    title: 'Next-Gen GPU Architecture & AI Upscaling',
    category: 'PC Tech & Ray Tracing',
    tags: ['gpu', 'dlss', 'fsr', 'frame generation', 'hardware', 'benchmark', 'engine', 'directx'],
    description: 'Microchip architecture and circuit board representing cutting-edge rendering silicon.'
  }
];

export const GTA6_AUTHOR_PERSONAS: AuthorPersona[] = [
  {
    id: 'persona-lucia',
    name: 'Lucia Infiltrator',
    role: 'Covert Ops & Infiltration Specialist',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=LuciaVice2026',
    bio: 'Heist hacker and stealth strategist. Author of high-stakes vault break-ins and police evasion tactics.'
  },
  {
    id: 'persona-jason',
    name: 'Jason Marksman',
    role: 'Lead Ballistics & Getaway Driver',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=JasonLeonida',
    bio: 'Precision firearm marksmanship and combat driving analyst with 10+ years of high-speed pursuit experience.'
  },
  {
    id: 'persona-tommy',
    name: 'ViceIntel Tommy',
    role: 'Senior Strategic Editor & Cartographer',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ViceIntelTommy',
    bio: 'Chief editor at ViceIntel. Tracking all verified Rockstar Games Newswire bulletins and map coordinates.'
  },
  {
    id: 'persona-mateo',
    name: 'CartelDon Mateo',
    role: 'Underground Empire & Contraband Specialist',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=CartelDonMateo',
    bio: 'Maritime logistics and business ROI optimizer running offshore speeder routes across the Keys.'
  },
  {
    id: 'persona-dominic',
    name: 'Dominic "Drift King"',
    role: 'Handling.meta Chief Physics Tuner',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=DriftKingDominic',
    bio: 'Vehicle dynamics engineer specializing in drag bias, slip angles, and downforce tuning.'
  },
  {
    id: 'persona-miller',
    name: 'Officer Miller',
    role: 'FiveM RP & Law Enforcement Consultant',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=OfficerMillerVCPD',
    bio: 'VCPD patrol veteran and server whitelist administrator focusing on community RP balance.'
  },
  {
    id: 'persona-krose',
    name: 'DJ K-Rose',
    role: 'Ocean Drive Nightlife & Culture Lead',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=DJKRoseViceCity',
    bio: 'Music producer and nightclub owner reviewing the hottest VIP venues in Vice Beach.'
  }
];

// Helper to sanitize any incoming image URL (replaces the old static default if needed)
const OLD_DEFAULT_IMAGE_HASH = '1542751371-adc38448a05e';

// Memoization cache for resolved images
const imageResolutionCache = new Map<string, ThematicImageItem>();
const MAX_CACHE_SIZE = 250;

// Pre-computed image token maps for O(1) / fast lookups
interface IndexedImageItem {
  item: ThematicImageItem;
  tagSet: Set<string>;
  categoryLower: string;
  titleTokens: Set<string>;
}

const PRE_INDEXED_IMAGES: IndexedImageItem[] = GTA6_THEMATIC_IMAGES.map((img) => ({
  item: img,
  tagSet: new Set(img.tags.map((t) => t.toLowerCase())),
  categoryLower: img.category.toLowerCase(),
  titleTokens: new Set(
    img.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 3)
  )
}));

export function sanitizeBlogImageUrl(existingUrl: string | undefined | null, title?: string, keywords?: string[]): string {
  if (!existingUrl || existingUrl.includes(OLD_DEFAULT_IMAGE_HASH)) {
    return resolveThematicBlogImage(title || 'GTA VI Vice City', keywords).url;
  }
  return existingUrl;
}

// Fast 32-bit integer string hash
function quickHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

// Deterministic Topic-Aware Image Resolver
export function resolveThematicBlogImage(
  topicOrTitle: string = '',
  keywords: string[] = [],
  preferredCategory?: string
): ThematicImageItem {
  const cacheKey = `${topicOrTitle}::${keywords.join(',')}::${preferredCategory || ''}`;
  const cached = imageResolutionCache.get(cacheKey);
  if (cached) return cached;

  const normalizedText = `${topicOrTitle} ${keywords.join(' ')} ${preferredCategory || ''}`
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ');

  const textTokens = normalizedText
    .split(/\s+/)
    .filter((t) => t.length >= 3);

  const prefCatLower = preferredCategory ? preferredCategory.toLowerCase() : null;

  let bestMatch: ThematicImageItem | null = null;
  let bestScore = -1;

  for (const { item, tagSet, categoryLower, titleTokens } of PRE_INDEXED_IMAGES) {
    let score = 0;

    for (const token of textTokens) {
      // 1. Direct tag set lookup
      if (tagSet.has(token)) {
        score += 4;
      } else {
        for (const tag of tagSet) {
          if (tag.includes(token)) {
            score += 2;
            break;
          }
        }
      }

      // 2. Category matching
      if (categoryLower.includes(token)) {
        score += 3;
      }

      // 3. Title token matching
      if (titleTokens.has(token)) {
        score += 2;
      }
    }

    if (prefCatLower && categoryLower === prefCatLower) {
      score += 5;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
  }

  let result: ThematicImageItem;
  if (bestMatch && bestScore > 0) {
    result = bestMatch;
  } else {
    // Fallback: deterministic hash of the topic string
    const str = topicOrTitle || 'GTA VI Vice City';
    const hash = quickHash(str);
    const index = Math.abs(hash) % GTA6_THEMATIC_IMAGES.length;
    result = GTA6_THEMATIC_IMAGES[index];
  }

  // Manage cache size
  if (imageResolutionCache.size >= MAX_CACHE_SIZE) {
    const firstKey = imageResolutionCache.keys().next().value;
    if (firstKey) imageResolutionCache.delete(firstKey);
  }
  imageResolutionCache.set(cacheKey, result);

  return result;
}
