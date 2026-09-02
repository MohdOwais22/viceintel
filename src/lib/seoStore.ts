import { doc, getDoc, getDocs, setDoc, deleteDoc, collection, onSnapshot, query } from 'firebase/firestore';
import { db } from './firebase';
import { safeFirestoreWrite, markFirestoreQuotaExhausted, isResourceExhaustedError } from './firebase/firestoreCircuitBreaker';
import { SeoMetaOverride, ActiveTab } from '../types';
import { TAB_TITLES, TAB_DESCRIPTIONS, TAB_TO_PATH, updatePageSeoMeta } from './seoRouting';

const STORAGE_KEY = 'viceintel_seo_meta_overrides_cache';

export interface SeoSectionDefinition {
  id: string;
  tabKey: ActiveTab;
  name: string;
  category: 'Core Hubs' | 'Database & Armory' | 'Calculators & Editors' | 'Community & RP' | 'SaaS & Infrastructure' | 'System & Legal';
  path: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultOgImage: string;
  defaultKeywords: string[];
  defaultSchemaType: string;
  optimalTitleLength: string;
  recommendedKeywords: string[];
}

export const CURATED_GTA6_OG_PRESETS = [
  {
    name: 'Lucia & Jason 4K Neon Key Art',
    url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
    tag: 'Official Key Art'
  },
  {
    name: 'Ocean Drive Neon Supercar Sunset',
    url: 'https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=1200&q=80',
    tag: 'Vehicles & Street'
  },
  {
    name: 'Vice Port Police Interceptor Vault',
    url: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=80',
    tag: 'Custom Builds'
  },
  {
    name: 'Tactical Weapon Armory & Ballistics',
    url: 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?auto=format&fit=crop&w=1200&q=80',
    tag: 'Armory TTK'
  },
  {
    name: 'Interactive Leonida Radar Map Satellite',
    url: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80',
    tag: 'Map & Telemetry'
  },
  {
    name: 'FiveM RP Server Multi-Tenant City',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    tag: 'RP Community'
  },
  {
    name: 'Executive Dark Luxury Penthouse',
    url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    tag: 'Real Estate & ROI'
  },
  {
    name: 'High-Octane Everglades Airboat Chase',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    tag: 'Leonida Districts'
  }
];

export const SEO_SECTIONS_REGISTRY: SeoSectionDefinition[] = [
  {
    id: 'home',
    tabKey: 'home',
    name: 'Master Portal Home',
    category: 'Core Hubs',
    path: '/',
    defaultTitle: 'ViceIntel — Vice City Master Utility Suite & Database',
    defaultDescription: 'Comprehensive Vice City player portal with real-time chat, vehicle database, interactive map, and ROI tools.',
    defaultOgImage: CURATED_GTA6_OG_PRESETS[0].url,
    defaultKeywords: ['GTA VI', 'Vice City', 'GTA 6 Portal', 'Database', 'Interactive Map', 'ViceIntel'],
    defaultSchemaType: 'WebSite',
    optimalTitleLength: '50-60 Chars',
    recommendedKeywords: ['GTA 6 companion', 'Vice City tools', 'GTA VI news', 'Lucia Jason']
  },
  {
    id: 'vehicles',
    tabKey: 'vehicles',
    name: 'Vehicle Telemetry & Topspeed Database',
    category: 'Database & Armory',
    path: '/vehicles',
    defaultTitle: 'Vice City Vehicle Database — Topspeed, Acceleration & Tuning | ViceIntel',
    defaultDescription: 'Explore verified GTA VI vehicles with stats, top speeds, prices, and mod compatibility.',
    defaultOgImage: CURATED_GTA6_OG_PRESETS[1].url,
    defaultKeywords: ['GTA 6 Cars', 'Vice City Supercars', 'Top Speed MPH', 'Vehicle Database', 'Tuning Builds'],
    defaultSchemaType: 'ItemPage',
    optimalTitleLength: '55-65 Chars',
    recommendedKeywords: ['fastest cars GTA 6', 'Bravado Buffalo EV', 'Grotti Cheetah', 'handling specs']
  },
  {
    id: 'weapons',
    tabKey: 'weapons',
    name: 'Weapon Armory & TTK Calculator',
    category: 'Database & Armory',
    path: '/weapons',
    defaultTitle: 'Vice City Armory & Weapon TTK Calculator — ViceIntel',
    defaultDescription: 'Compare Vice City weapons, damage output, TTK metrics, and fire rates.',
    defaultOgImage: CURATED_GTA6_OG_PRESETS[3].url,
    defaultKeywords: ['GTA 6 Weapons', 'Time to Kill TTK', 'Damage Multipliers', 'Weapon Attachments', 'Vice City Gun Meta'],
    defaultSchemaType: 'ItemPage',
    optimalTitleLength: '50-60 Chars',
    recommendedKeywords: ['GTA 6 best weapons', 'Combat MG TTK', 'Heavy Sniper damage', 'weapon attachments']
  },
  {
    id: 'comparison',
    tabKey: 'comparison',
    name: '1v1 Spec Matrix Comparison',
    category: 'Database & Armory',
    path: '/comparison',
    defaultTitle: '1v1 Vehicle & Weapon Spec Matrix Comparison — ViceIntel',
    defaultDescription: 'Head-to-head 1v1 spec comparison for GTA VI vehicles and weapons.',
    defaultOgImage: CURATED_GTA6_OG_PRESETS[1].url,
    defaultKeywords: ['GTA 6 Comparison', 'Vehicle Spec Matrix', 'Weapon Compare', 'Vice City Stats', '1v1 Benchmark'],
    defaultSchemaType: 'WebPage',
    optimalTitleLength: '50-60 Chars',
    recommendedKeywords: ['car comparison GTA 6', 'weapon comparison', 'stats breakdown', 'DPS showdown']
  },
  {
    id: 'mod-calculator',
    tabKey: 'mod-calculator',
    name: 'Vice Customs Mod Builder',
    category: 'Calculators & Editors',
    path: '/mod-calculator',
    defaultTitle: 'Vice Customs Mod Builder & Performance Calculator — ViceIntel',
    defaultDescription: 'Calculate performance gains and mod costs for custom Vice City vehicle builds.',
    defaultOgImage: CURATED_GTA6_OG_PRESETS[2].url,
    defaultKeywords: ['GTA 6 Mod Builder', 'Custom Car Tuning', 'Performance Calculator', 'Vice Customs', 'Turbo Upgrade Costs'],
    defaultSchemaType: 'SoftwareApplication',
    optimalTitleLength: '55-65 Chars',
    recommendedKeywords: ['vehicle mod calculator', 'tuning costs GTA 6', 'turbo boost calculator', 'performance delta']
  },
  {
    id: 'roi-calculator',
    tabKey: 'roi-calculator',
    name: 'Business ROI & Real Estate Calculator',
    category: 'Calculators & Editors',
    path: '/roi-calculator',
    defaultTitle: 'Real Estate & Business Profit ROI Calculator — ViceIntel',
    defaultDescription: 'Analyze hourly profit margins and pay-back periods for Vice City business investments.',
    defaultOgImage: CURATED_GTA6_OG_PRESETS[6].url,
    defaultKeywords: ['GTA 6 Business ROI', 'Real Estate Profits', 'Nightclub Hourly Income', 'Chop Shop Profit Calculator', 'Vice City Economy'],
    defaultSchemaType: 'SoftwareApplication',
    optimalTitleLength: '55-65 Chars',
    recommendedKeywords: ['best businesses GTA 6', 'hourly passive income', 'payback period', 'business upgrades ROI']
  },
  {
    id: 'handling-editor',
    tabKey: 'handling-editor',
    name: 'handling.meta Visual Physics Editor',
    category: 'Calculators & Editors',
    path: '/calculators/handling-editor',
    defaultTitle: 'Interactive Vehicle Telemetry & handling.meta Visual Editor — ViceIntel',
    defaultDescription: 'Visual FiveM & GTA VI handling.meta physics editor with live 3D/2D telemetry visualizers, torque split calculators, and community presets.',
    defaultOgImage: CURATED_GTA6_OG_PRESETS[2].url,
    defaultKeywords: ['handling.meta Editor', 'FiveM Physics', 'Torque Split Calculator', 'Traction Curve Max', 'Downforce Modifier'],
    defaultSchemaType: 'SoftwareApplication',
    optimalTitleLength: '55-65 Chars',
    recommendedKeywords: ['handling meta generator', 'drift physics GTA 6', 'FiveM handling tuning', 'suspension bias']
  },
  {
    id: 'economy-balancer',
    tabKey: 'economy-balancer',
    name: 'RP Server Economy & Wage Balancer',
    category: 'Calculators & Editors',
    path: '/calculators/economy-balancer',
    defaultTitle: 'RP Server Economy & Wage Balancer (QBCore, ESX, QBX) — ViceIntel',
    defaultDescription: 'Model FiveM/GTA RP server inflation, simulate 30-day money velocity, balance legal vs illegal job payouts, and export QBCore/ESX/QBX config.lua files.',
    defaultOgImage: CURATED_GTA6_OG_PRESETS[5].url,
    defaultKeywords: ['Economy Balancer', 'FiveM Wage Balancer', 'QBCore Economy Config', 'Money Velocity Simulation', 'RP Inflation'],
    defaultSchemaType: 'SoftwareApplication',
    optimalTitleLength: '55-65 Chars',
    recommendedKeywords: ['FiveM economy balance', 'QBCore config.lua export', 'job payouts balance', 'black market pricing']
  },
  {
    id: 'script-generator',
    tabKey: 'script-generator',
    name: 'FiveM Script Studio & Lua Generator',
    category: 'Calculators & Editors',
    path: '/scripts/generator',
    defaultTitle: 'FiveM Script Studio & Lua/XML Config Generator (QBCore & ESX) — ViceIntel',
    defaultDescription: 'Zero-syntax-error FiveM no-code Lua and XML config generator with dynamic job grade hierarchies, item registries, and economy balance simulation.',
    defaultOgImage: CURATED_GTA6_OG_PRESETS[5].url,
    defaultKeywords: ['FiveM Script Generator', 'Lua Generator', 'QBCore Jobs Config', 'ESX Items Lua', 'No-Code FiveM Dev'],
    defaultSchemaType: 'SoftwareApplication',
    optimalTitleLength: '55-65 Chars',
    recommendedKeywords: ['generate FiveM scripts', 'QBCore jobs generator', 'custom items lua', 'server config creator']
  },
  {
    id: 'map',
    tabKey: 'map',
    name: 'Interactive Leonida & Vice Map Tracker',
    category: 'Core Hubs',
    path: '/map',
    defaultTitle: 'Interactive Leonida & Vice City Map Tracker — ViceIntel',
    defaultDescription: 'Track collectibles, safehouses, weapon spawns, and turf zones in Vice City.',
    defaultOgImage: CURATED_GTA6_OG_PRESETS[4].url,
    defaultKeywords: ['GTA 6 Map', 'Leonida Interactive Map', 'Vice City Collectibles', 'Weapon Spawns', 'Safehouses', 'Stunt Jumps'],
    defaultSchemaType: 'WebPage',
    optimalTitleLength: '50-60 Chars',
    recommendedKeywords: ['GTA 6 interactive map', 'Vice Beach coordinates', 'Port Gellhorn safehouses', 'Easter eggs map']
  },
  {
    id: 'blog',
    tabKey: 'blog',
    name: 'Vice City Intel Blog & News Hub',
    category: 'Core Hubs',
    path: '/blog',
    defaultTitle: 'Vice City Intel Blog & News Bulletins — ViceIntel',
    defaultDescription: 'Latest GTA VI leaks, trailers analysis, map guides, and game update news.',
    defaultOgImage: CURATED_GTA6_OG_PRESETS[0].url,
    defaultKeywords: ['GTA 6 News', 'Vice City Leaks', 'Rockstar Games Updates', 'GTA VI Trailer Breakdown', 'Release Countdown'],
    defaultSchemaType: 'Blog',
    optimalTitleLength: '50-60 Chars',
    recommendedKeywords: ['GTA 6 release date news', 'Newswire leaks', 'PC requirements leaks', 'trailer 2 analysis']
  },
  {
    id: 'rp-servers',
    tabKey: 'rp-servers',
    name: 'RP Server Directory & Whitelist Hub',
    category: 'Community & RP',
    path: '/rp-servers',
    defaultTitle: 'GTA VI Vice City RP Server Directory & Whitelist Apps — ViceIntel',
    defaultDescription: 'Discover top FiveM and GTA VI Roleplay servers with whitelist application access.',
    defaultOgImage: CURATED_GTA6_OG_PRESETS[5].url,
    defaultKeywords: ['GTA RP Servers', 'FiveM Server Directory', 'Vice City Roleplay', 'Whitelist Application', 'Server Connect F8'],
    defaultSchemaType: 'ItemList',
    optimalTitleLength: '55-65 Chars',
    recommendedKeywords: ['best GTA RP servers', 'FiveM whitelist servers', 'realistic voice RP', 'server connect command']
  },
  {
    id: 'chat',
    tabKey: 'chat',
    name: 'Community Live Chat & VIP Hubs',
    category: 'Community & RP',
    path: '/chat',
    defaultTitle: 'Community Live Chat & VIP Player Hubs — ViceIntel',
    defaultDescription: 'Join Vice City player channels, chat in real-time, and host private VIP gamer hubs.',
    defaultOgImage: CURATED_GTA6_OG_PRESETS[0].url,
    defaultKeywords: ['GTA VI Live Chat', 'Vice City Player Hubs', 'Heist Party Finder', 'Tuning Discussions', 'VIP Channels'],
    defaultSchemaType: 'WebPage',
    optimalTitleLength: '50-60 Chars',
    recommendedKeywords: ['GTA 6 live chat', 'LFG party finder', 'crew voice comms', 'player messaging']
  },
  {
    id: 'profile',
    tabKey: 'profile',
    name: 'GamerTag Profile & VIP Management',
    category: 'Community & RP',
    path: '/profile',
    defaultTitle: 'GamerTag Profile & VIP Membership Manager — ViceIntel',
    defaultDescription: 'Manage your verified Vice City GamerTag, custom GTA VI avatars, and VIP status.',
    defaultOgImage: CURATED_GTA6_OG_PRESETS[0].url,
    defaultKeywords: ['GamerTag Profile', 'VIP Membership Pass', 'GTA 6 Vector Avatars', 'VC Credits', 'Daily Rewards'],
    defaultSchemaType: 'ProfilePage',
    optimalTitleLength: '50-60 Chars',
    recommendedKeywords: ['GamerTag verification', 'claim VIP perks', 'custom avatar creator', 'daily login streak']
  },
  {
    id: 'challenges',
    tabKey: 'challenges',
    name: 'Community Tuning Championship',
    category: 'Community & RP',
    path: '/challenges',
    defaultTitle: 'Weekly Community Tuning Championship & Leaderboard — ViceIntel',
    defaultDescription: 'Weekly community vehicle physics challenges, handling.meta tuning competitions, and live leaderboards.',
    defaultOgImage: CURATED_GTA6_OG_PRESETS[2].url,
    defaultKeywords: ['Tuning Championship', 'handling.meta Leaderboard', 'Top Speed Contest', 'Quarter Mile Drag', 'Vice City Esports'],
    defaultSchemaType: 'Event',
    optimalTitleLength: '55-65 Chars',
    recommendedKeywords: ['weekly tuning contest', 'physics benchmark leaderboard', 'win VC credits', 'master tuner badge']
  },
  {
    id: 'for-servers',
    tabKey: 'for-servers',
    name: 'Vice City Central for RP Server Owners ($29–$49/mo)',
    category: 'SaaS & Infrastructure',
    path: '/for-servers',
    defaultTitle: 'Vice City Central for FiveM & GTA RP Server Owners ($29–$49/mo SaaS)',
    defaultDescription: 'Enterprise SaaS infrastructure for FiveM and GTA RP servers: automate whitelist screening, Discord role syncing, and no-code Lua economy bundles.',
    defaultOgImage: CURATED_GTA6_OG_PRESETS[5].url,
    defaultKeywords: ['FiveM Whitelist SaaS', 'RP Server Automation', 'Discord Role Sync Bot', 'No-Code Whitelist Form Builder', 'Server Management'],
    defaultSchemaType: 'Product',
    optimalTitleLength: '55-65 Chars',
    recommendedKeywords: ['automate FiveM whitelist', 'Discord bot role sync', 'server owner SaaS', 'whitelist applications review']
  },
  {
    id: 'servers-onboarding',
    tabKey: 'servers-onboarding',
    name: 'Server Onboarding & Bot Provisioning Wizard',
    category: 'SaaS & Infrastructure',
    path: '/servers/onboarding',
    defaultTitle: 'Self-Serve Server Onboarding & Discord Bot Provisioning — ViceIntel',
    defaultDescription: '4-step self-serve onboarding wizard: link Discord guild, configure custom whitelist form, assign auto-roles, and deploy custom application portal.',
    defaultOgImage: CURATED_GTA6_OG_PRESETS[5].url,
    defaultKeywords: ['Server Onboarding', 'FiveM Whitelist Setup', 'Discord Bot Provisioning', 'Auto-Role Whitelist', 'RP Server Deploy'],
    defaultSchemaType: 'SoftwareApplication',
    optimalTitleLength: '55-65 Chars',
    recommendedKeywords: ['onboard FiveM server', 'link Discord guild', 'configure whitelist form', 'auto bot invite']
  },
  {
    id: 'giftcards',
    tabKey: 'giftcards',
    name: 'Shark Cards & VIP Voucher System',
    category: 'Core Hubs',
    path: '/giftcards',
    defaultTitle: 'Shark Cards & Vice City VIP Voucher Redemption System — ViceIntel',
    defaultDescription: 'Redeem Shark Cash cards, send VIP pass vouchers, and generate custom in-game credit gift codes.',
    defaultOgImage: CURATED_GTA6_OG_PRESETS[0].url,
    defaultKeywords: ['Shark Cash Cards', 'VIP Vouchers', 'Redeem Gift Codes', 'Vice City Cash Vouchers', 'In-Game Credits'],
    defaultSchemaType: 'Product',
    optimalTitleLength: '55-65 Chars',
    recommendedKeywords: ['redeem Shark cards', 'send VIP pass gift', 'GTA 6 gift codes', 'voucher activation']
  },
  {
    id: 'seo-hub',
    tabKey: 'seo-hub',
    name: 'Master Knowledge Hub & Leaks Index',
    category: 'Core Hubs',
    path: '/seo-hub',
    defaultTitle: 'ViceIntel Master Knowledge Hub: Cheats, Release Date, Map & System Specs',
    defaultDescription: 'Ultimate Vice City search hub: verified cheat codes, release date countdown, PS5/Xbox/PC specs, heist guides, and map locations.',
    defaultOgImage: CURATED_GTA6_OG_PRESETS[0].url,
    defaultKeywords: ['GTA 6 Cheats', 'Release Date Countdown', 'PC System Requirements', 'Heist Guides', 'Vice City Cheats PS5 Xbox'],
    defaultSchemaType: 'FAQPage',
    optimalTitleLength: '55-65 Chars',
    recommendedKeywords: ['GTA 6 cheat codes', 'PS5 system specs', 'PC minimum requirements', 'heist walkthrough']
  },
  {
    id: 'docs',
    tabKey: 'docs',
    name: 'Developer REST API & Webhook Docs',
    category: 'SaaS & Infrastructure',
    path: '/docs',
    defaultTitle: 'Developer REST API Documentation & Webhook Specs — ViceIntel',
    defaultDescription: 'Full REST API documentation and developer integrations for ViceIntel.',
    defaultOgImage: CURATED_GTA6_OG_PRESETS[0].url,
    defaultKeywords: ['Developer API', 'REST API Docs', 'Webhook Specs', 'Discord Bot Integration', 'GTA 6 Data Endpoints'],
    defaultSchemaType: 'TechArticle',
    optimalTitleLength: '50-60 Chars',
    recommendedKeywords: ['ViceIntel API docs', 'API authentication', 'webhook payloads', 'JSON telemetry endpoints']
  },
  {
    id: 'monetization',
    tabKey: 'monetization',
    name: 'Sponsor Ads & CPM Publisher Dashboard',
    category: 'SaaS & Infrastructure',
    path: '/monetization',
    defaultTitle: 'Sponsor Ads & CPM Publisher Dashboard — ViceIntel',
    defaultDescription: 'Manage ad spots, sponsor inventory, and CPM revenue for ViceIntel.',
    defaultOgImage: CURATED_GTA6_OG_PRESETS[0].url,
    defaultKeywords: ['Sponsor Ads', 'Ad Placement', 'CPM Publisher', 'B2B Advertising', 'Vice City Ad Inventory'],
    defaultSchemaType: 'WebPage',
    optimalTitleLength: '50-60 Chars',
    recommendedKeywords: ['advertise on ViceIntel', 'sponsor FiveM servers', 'ad placement RPM', 'ad-free VIP toggle']
  },
  {
    id: 'admin',
    tabKey: 'admin',
    name: 'Executive Admin Control Plane HQ',
    category: 'System & Legal',
    path: '/admin',
    defaultTitle: 'Admin Control Panel & System Analytics — ViceIntel',
    defaultDescription: 'Platform moderation, account verification, and system analytics.',
    defaultOgImage: CURATED_GTA6_OG_PRESETS[0].url,
    defaultKeywords: ['Admin Control Panel', 'System Analytics', 'HRBAC Verification', 'Content Moderation Queue'],
    defaultSchemaType: 'WebPage',
    optimalTitleLength: '50-60 Chars',
    recommendedKeywords: ['admin control panel', 'moderation queue', 'audit ledger', 'system health']
  },
  {
    id: 'pseo',
    tabKey: 'pseo',
    name: 'pSEO Architecture & Security Blueprint',
    category: 'System & Legal',
    path: '/pseo',
    defaultTitle: 'pSEO Architecture, QA & Security Testing Blueprint — ViceIntel',
    defaultDescription: 'Programmatic SEO architecture, sitemap generators, load testing scenarios, and security safeguards.',
    defaultOgImage: CURATED_GTA6_OG_PRESETS[0].url,
    defaultKeywords: ['pSEO Architecture', 'Automated Spider', 'Sitemap Generator', 'Security Blueprint', 'QA Load Testing'],
    defaultSchemaType: 'TechArticle',
    optimalTitleLength: '55-65 Chars',
    recommendedKeywords: ['programmatic SEO GTA 6', 'spider crawler architecture', 'sitemap XML', 'security load tests']
  },
  {
    id: 'privacy',
    tabKey: 'privacy',
    name: 'Copyright, Trademark & Legal Hub',
    category: 'System & Legal',
    path: '/privacy',
    defaultTitle: 'Copyright, Trademark & Privacy Policy — ViceIntel Legal Hub',
    defaultDescription: 'Official non-commercial fan disclaimer, Take-Two Interactive trademark acknowledgement, DMCA takedown procedures, and user privacy protections.',
    defaultOgImage: CURATED_GTA6_OG_PRESETS[0].url,
    defaultKeywords: ['Copyright Disclaimer', 'Trademark Notice', 'Privacy Policy', 'Take-Two Acknowledgement', 'DMCA Procedures'],
    defaultSchemaType: 'WebPage',
    optimalTitleLength: '50-60 Chars',
    recommendedKeywords: ['fan site disclaimer', 'Take-Two Interactive policy', 'privacy rights GDPR CCPA', 'DMCA notice']
  }
];

// Reactive in-memory store
let memoryOverrides: Record<string, SeoMetaOverride> = {};
let subscribers: Array<(overrides: Record<string, SeoMetaOverride>) => void> = [];
let isRealtimeSyncInitialized = false;

// Load cache from localStorage
try {
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      memoryOverrides = JSON.parse(cached);
    }
  }
} catch (e) {
  console.debug('Failed to parse cached SEO overrides from localStorage:', e);
}

/**
 * Initializes real-time Firestore synchronization for SEO Meta Overrides.
 * Any admin change is instantly broadcast to all connected clients without redeployment!
 */
export function initSeoRealtimeSync(onActiveTabChanged?: () => void): () => void {
  if (isRealtimeSyncInitialized) {
    return () => {};
  }
  isRealtimeSyncInitialized = true;

  try {
    const docRef = doc(db, 'seo_meta_overrides', 'master_seo_bundle');
    const unsub = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && data.overrides && typeof data.overrides === 'object') {
            memoryOverrides = data.overrides;
          }
        }

        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryOverrides));
          }
        } catch (e) {
          console.debug('Failed to write SEO overrides to localStorage:', e);
        }

        // Notify all subscribers
        subscribers.forEach((cb) => cb(memoryOverrides));

        // Re-trigger active page SEO tags dynamically if browser is running
        if (typeof window !== 'undefined') {
          if (onActiveTabChanged) {
            onActiveTabChanged();
          }
        }
      },
      (err) => {
        if (isResourceExhaustedError(err)) {
          markFirestoreQuotaExhausted(err);
        } else {
          console.warn('Firestore onSnapshot warning for seo_meta_overrides master bundle:', err);
        }
      }
    );

    return unsub;
  } catch (e) {
    console.warn('Failed to attach SEO real-time sync listener:', e);
    return () => {};
  }
}

/**
 * Subscribes a React component to real-time SEO overrides updates.
 */
export function subscribeToSeoOverrides(callback: (overrides: Record<string, SeoMetaOverride>) => void): () => void {
  subscribers.push(callback);
  // Immediate initial emit
  callback(memoryOverrides);

  return () => {
    subscribers = subscribers.filter((cb) => cb !== callback);
  };
}

/**
 * Gets the active SEO override for a specific section ID if configured.
 */
export function getSeoOverride(sectionId: string): SeoMetaOverride | null {
  return memoryOverrides[sectionId] || null;
}

/**
 * Recursively cleans an object before writing to Firestore by removing keys with undefined values.
 */
export function sanitizeFirestoreData<T extends Record<string, any>>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => (typeof item === 'object' && item !== null ? sanitizeFirestoreData(item) : item)) as unknown as T;
  }

  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) {
        continue;
      }
      if (value !== null && typeof value === 'object') {
        cleaned[key] = sanitizeFirestoreData(value);
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned as T;
  }

  return data;
}

/**
 * Gets all active SEO overrides as an object map.
 */
export function getAllSeoOverrides(): Record<string, SeoMetaOverride> {
  return { ...memoryOverrides };
}

/**
 * Saves a single SEO override to Firestore and updates local cache in real-time.
 */
export async function saveSeoOverride(override: Partial<SeoMetaOverride> & { sectionId: string; title: string; description: string }): Promise<boolean> {
  const sectionId = override.sectionId;
  const existing: Partial<SeoMetaOverride> = memoryOverrides[sectionId] || {};

  const payload: SeoMetaOverride = {
    ...existing,
    ...override,
    sectionId,
    isCustomOverride: true,
    lastUpdatedAt: new Date().toISOString(),
    version: (existing.version || 0) + 1
  };

  // Sanitize payload to strip any undefined fields before writing
  const sanitizedPayload = sanitizeFirestoreData(payload);

  // Immediate local update
  memoryOverrides[sectionId] = sanitizedPayload;
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryOverrides));
    }
  } catch (e) {}

  subscribers.forEach((cb) => cb(memoryOverrides));

  // Write directly to Firestore master bundle (1 write total - Thanh Le pattern)
  await safeFirestoreWrite(async () => {
    const docRef = doc(db, 'seo_meta_overrides', 'master_seo_bundle');
    await setDoc(docRef, { overrides: memoryOverrides, updatedAt: Date.now() }, { merge: true });
  });
  return true;
}

/**
 * Deletes an SEO override from Firestore and reverts the section to system defaults.
 */
export async function deleteSeoOverride(sectionId: string): Promise<boolean> {
  // Immediate local removal
  delete memoryOverrides[sectionId];
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryOverrides));
    }
  } catch (e) {}

  subscribers.forEach((cb) => cb(memoryOverrides));

  await safeFirestoreWrite(async () => {
    const docRef = doc(db, 'seo_meta_overrides', 'master_seo_bundle');
    await setDoc(docRef, { overrides: memoryOverrides, updatedAt: Date.now() }, { merge: true });
  });
  return true;
}

/**
 * Resets all overrides to factory defaults in Firestore.
 */
export async function resetAllSeoOverrides(): Promise<void> {
  memoryOverrides = {};
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {}

  subscribers.forEach((cb) => cb(memoryOverrides));

  try {
    const docRef = doc(db, 'seo_meta_overrides', 'master_seo_bundle');
    await setDoc(docRef, { overrides: {}, updatedAt: Date.now() }, { merge: true });
  } catch (e) {}
}

/**
 * Saves multiple SEO overrides at once to Firestore and updates local cache synchronously.
 */
export async function saveBulkSeoOverrides(overridesList: (Partial<SeoMetaOverride> & { sectionId: string; title: string; description: string })[]): Promise<boolean> {
  const firestorePromises: Promise<any>[] = [];

  for (const override of overridesList) {
    const sectionId = override.sectionId;
    const existing: Partial<SeoMetaOverride> = memoryOverrides[sectionId] || {};

    const payload: SeoMetaOverride = {
      ...existing,
      ...override,
      sectionId,
      isCustomOverride: true,
      lastUpdatedAt: new Date().toISOString(),
      version: (existing.version || 0) + 1
    };

    const sanitizedPayload = sanitizeFirestoreData(payload);
    memoryOverrides[sectionId] = sanitizedPayload;

    // Queue Firestore setDoc write
    firestorePromises.push(
      setDoc(doc(db, 'seo_meta_overrides', sectionId), sanitizedPayload, { merge: true }).catch((err) => {
        console.warn(`Firestore setDoc failed for ${sectionId}:`, err);
      })
    );
  }

  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryOverrides));
    }
  } catch (e) {}

  // Broadcast immediate sync to all UI components
  subscribers.forEach((cb) => cb({ ...memoryOverrides }));

  // Wait for background Firestore persistence
  await Promise.allSettled(firestorePromises);
  return true;
}

/**
 * Generates smart high-CTR metadata tailored specifically for GTA VI player search intent.
 */
export function generateSmartSeoFields(section: SeoSectionDefinition): Partial<SeoMetaOverride> {
  // Craft optimal 50-60 character title with power words
  let smartTitle = `${section.name} — GTA 6 Vice City | ViceIntel`;
  if (smartTitle.length > 60) {
    smartTitle = `${section.name} — GTA 6 | ViceIntel`;
  }
  if (smartTitle.length > 60) {
    smartTitle = `${section.name} | ViceIntel GTA 6`;
  }
  if (smartTitle.length < 45) {
    smartTitle = `${section.name} — GTA VI Vice City Database | ViceIntel`;
  }

  // Craft optimal 140-160 character description
  let baseDesc = section.defaultDescription;
  let smartDesc = `${baseDesc} Explore live telemetry, verified updates, 1v1 specs, and Vice City player guides.`;
  
  if (smartDesc.length > 160) {
    smartDesc = `${baseDesc} Real-time GTA 6 telemetry, verified stats & Vice City player guides.`;
  }
  if (smartDesc.length > 160) {
    smartDesc = smartDesc.slice(0, 155) + '...';
  }
  if (smartDesc.length < 130) {
    smartDesc = `${smartDesc} Access instant Vice City database lookups, TTK calculators, and GTA 6 leaks.`;
  }

  const smartKeywords = Array.from(
    new Set([
      ...section.defaultKeywords,
      ...section.recommendedKeywords,
      'GTA 6',
      'Vice City',
      '2026 Database'
    ])
  );

  return {
    sectionId: section.id,
    title: smartTitle,
    description: smartDesc,
    keywords: smartKeywords,
    ogTitle: smartTitle,
    ogDescription: smartDesc,
    ogImage: section.defaultOgImage,
    ogType: section.category === 'Core Hubs' ? 'website' : 'article',
    ogSiteName: 'ViceIntel — Vice City Master Utility Suite',
    twitterCard: 'summary_large_image',
    twitterTitle: smartTitle,
    twitterDescription: smartDesc,
    twitterImage: section.defaultOgImage,
    twitterSite: '@ViceIntelApp',
    twitterCreator: '@ViceIntelApp',
    robots: 'index, follow',
    schemaType: section.defaultSchemaType,
    isCustomOverride: true
  };
}
