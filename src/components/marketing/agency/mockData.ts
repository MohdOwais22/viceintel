import {
  KeywordOpportunity,
  SeoAuditReport,
  InternalLinkOpportunity,
  BlogPostDraft,
  SocialPostItem,
  BrandGraphicBrief,
  KnowledgeDoc,
  AgentRunLog
} from './types';

export const SEED_KEYWORDS: KeywordOpportunity[] = [
  {
    id: 'kw-1',
    keyword: 'gta 6 vice city ocean drive map locations',
    searchVolume: 165000,
    difficulty: 42,
    intent: 'Informational',
    cpc: 2.85,
    serpScore: 88,
    cluster: 'Map & World Exploration',
    priority: 'High',
    potentialTraffic: 48000,
    competitorUrl: 'https://ign.com/wikis/gta-6-map',
    notes: 'Primary anchor cluster for interactive map features & hidden collectibles.'
  },
  {
    id: 'kw-2',
    keyword: 'gta vi handling meta tuning physics calculator',
    searchVolume: 74000,
    difficulty: 28,
    intent: 'Transactional',
    cpc: 4.10,
    serpScore: 94,
    cluster: 'Vehicle Physics & Tuning',
    priority: 'High',
    potentialTraffic: 31000,
    competitorUrl: 'https://gtacars.net/handling-calc',
    notes: 'Direct conversion funnel into Handling Editor and Championship Leaderboard.'
  },
  {
    id: 'kw-3',
    keyword: 'best fivem vice city roleplay servers 2026',
    searchVolume: 110000,
    difficulty: 54,
    intent: 'Commercial',
    cpc: 3.40,
    serpScore: 82,
    cluster: 'RP Servers & Communities',
    priority: 'High',
    potentialTraffic: 39000,
    competitorUrl: 'https://topfivemservers.com',
    notes: 'Drives server owners to sponsored placements and whitelist applications.'
  },
  {
    id: 'kw-4',
    keyword: 'gta 6 lucia jason vehicle heist guide',
    searchVolume: 92000,
    difficulty: 35,
    intent: 'Informational',
    cpc: 1.95,
    serpScore: 79,
    cluster: 'Missions & Story Guides',
    priority: 'Medium',
    potentialTraffic: 24000,
    notes: 'High organic engagement with long on-page dwell times.'
  },
  {
    id: 'kw-5',
    keyword: 'gta 6 weapons stats damage recoil tier list',
    searchVolume: 85000,
    difficulty: 38,
    intent: 'Informational',
    cpc: 2.20,
    serpScore: 86,
    cluster: 'Weapons & Loadouts',
    priority: 'High',
    potentialTraffic: 29000,
    notes: 'Direct entry point to weapons tab and comparison matrix.'
  },
  {
    id: 'kw-6',
    keyword: 'vice city nightclub business roi profit calculator',
    searchVolume: 58000,
    difficulty: 22,
    intent: 'Transactional',
    cpc: 5.20,
    serpScore: 96,
    cluster: 'Economy & Business ROI',
    priority: 'High',
    potentialTraffic: 26000,
    notes: 'Extremely high conversion rate to VIP memberships.'
  },
  {
    id: 'kw-7',
    keyword: 'gta vi pc release date leaks ray tracing specs',
    searchVolume: 240000,
    difficulty: 72,
    intent: 'Informational',
    cpc: 1.45,
    serpScore: 68,
    cluster: 'News & Leaks',
    priority: 'Medium',
    potentialTraffic: 52000,
    notes: 'High volume top-of-funnel spider target.'
  }
];

export const SEED_SEO_AUDIT: SeoAuditReport = {
  id: 'audit-vice-portal',
  targetUrl: 'https://viceintel.app/vehicles',
  analyzedAt: new Date().toISOString(),
  overallScore: 94,
  performanceScore: 96,
  seoScore: 95,
  readabilityScore: 91,
  crawlStatus: 'Indexed',
  pageWordCount: 3420,
  metaTags: {
    title: 'GTA VI Vehicle Database & Handling Physics Telemetry | ViceIntel',
    titleLength: 64,
    description: 'Explore 150+ GTA VI supercars, classic muscle, and watercraft with live handling.meta physics simulations, top speed telemetry, and 0-60 calculators.',
    descLength: 154,
    canonical: 'https://viceintel.app/vehicles',
    robots: 'index, follow, max-image-preview:large',
    openGraphImage: 'https://viceintel.app/assets/og-vehicles.jpg'
  },
  coreWebVitals: {
    lcp: '0.94s',
    fid: '14ms',
    cls: '0.008',
    fcp: '0.62s',
    ttfb: '92ms'
  },
  issues: [
    {
      id: 'iss-1',
      severity: 'Optimization',
      category: 'Schema & JSON-LD',
      title: 'Vehicle Product Schema Structured Data Enhancement',
      description: 'Add individual ItemList and Vehicle structured data models to all dynamic supercar pages.',
      recommendation: 'Inject JSON-LD schema with horsepower, top speed mph, and category classification tags.',
      impactScore: 12,
      autoFixAvailable: true,
      fixed: false
    },
    {
      id: 'iss-2',
      severity: 'Warning',
      category: 'Links & Crawl',
      title: '3 Deep Vehicle Sub-Models Lack Inbound Anchor Links',
      description: 'The Pegassi Infernus Classic handling profile is only accessible via direct search filter.',
      recommendation: 'Add direct internal contextual links from the Muscle vs Supercar comparison matrix.',
      impactScore: 18,
      autoFixAvailable: true,
      fixed: false
    },
    {
      id: 'iss-3',
      severity: 'Optimization',
      category: 'Meta & Titles',
      title: 'OpenGraph Aspect Ratio Tuning for Discord Previews',
      description: 'Discord rich embed image could benefit from 1200x630px high-contrast neon banner.',
      recommendation: 'Regenerate social card with Brand Graphics Agent and deploy to static asset cache.',
      impactScore: 8,
      autoFixAvailable: true,
      fixed: true
    }
  ]
};

export const SEED_INTERNAL_LINKS: InternalLinkOpportunity[] = [
  {
    id: 'link-1',
    sourceUrl: '/blog/ocean-drive-supercar-tuning-guide',
    sourceTitle: 'Ocean Drive Supercar Tuning Guide',
    targetUrl: '/tuning-championship',
    targetTitle: 'GTA VI Tuning Championship Leaderboard',
    recommendedAnchorText: 'enter the weekly Tuning Championship',
    contextSentence: 'Once you have optimized your drive bias and downforce curve, test your build and enter the weekly Tuning Championship to win exclusive VC Cash.',
    relevanceScore: 98,
    priority: 'High',
    applied: false
  },
  {
    id: 'link-2',
    sourceUrl: '/weapons',
    sourceTitle: 'Weapon Arsenal & Damage Matrix',
    targetUrl: '/rp-servers',
    targetTitle: 'FiveM RP Server Directory',
    recommendedAnchorText: 'custom FiveM server weapon balances',
    contextSentence: 'Looking for servers with realistic bullet physics? Check out our list of custom FiveM server weapon balances in the server directory.',
    relevanceScore: 92,
    priority: 'High',
    applied: false
  },
  {
    id: 'link-3',
    sourceUrl: '/roi-calculator',
    sourceTitle: 'Vice City Business ROI Calculator',
    targetUrl: '/map',
    targetTitle: 'Interactive Vice City Map',
    recommendedAnchorText: 'locating optimal high-yield commercial real estate',
    contextSentence: 'Maximizing your nightclub income starts with locating optimal high-yield commercial real estate on the interactive Vice City map.',
    relevanceScore: 89,
    priority: 'Medium',
    applied: true
  },
  {
    id: 'link-4',
    sourceUrl: '/vehicles/pegassi-tempesta',
    sourceTitle: 'Pegassi Tempesta Telemetry',
    targetUrl: '/handling-editor',
    targetTitle: 'handling.meta Physics Editor',
    recommendedAnchorText: 'fine-tune this suspension in the handling editor',
    contextSentence: 'To eliminate high-speed understeer on wet asphalt, fine-tune this suspension in the handling editor and test live slip angles.',
    relevanceScore: 95,
    priority: 'High',
    applied: false
  }
];

export const SEED_BLOG_DRAFTS: BlogPostDraft[] = [
  {
    id: 'blog-1',
    title: 'The Definitive Guide to GTA VI Handling.meta Physics & Downforce Telemetry',
    slug: 'gta-6-handling-meta-physics-guide',
    metaTitle: 'GTA VI Handling.meta Physics & Downforce Tuning Guide | ViceIntel',
    metaDescription: 'Master vehicle physics in GTA VI. Learn how fInitialDriveForce, fDownforceModifier, and traction curves dictate drift angles and top speed.',
    targetKeywords: ['gta 6 handling meta', 'vice city car physics tuning', 'fDownforceModifier guide', 'gta vi top speed calculator'],
    tone: 'Authoritative',
    estimatedReadTime: '8 min read',
    imageUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
    category: 'Vehicle Tuning Specs',
    author: 'Dominic "Drift King"',
    authorRole: 'Handling.meta Chief Physics Tuner',
    authorAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=DriftKingDominic',
    modelUsed: 'gemini-3.7-flash',
    outline: [
      '1. Introduction to Next-Gen Vice City Physics',
      '2. Decoding fInitialDriveForce & Drivetrain Bias',
      '3. Traction Curve Max vs Min for Precision Drift Control',
      '4. Aero & Downforce Multipliers for Cornering Speed',
      '5. Step-by-Step Handling.meta Optimization Walkthrough',
      '6. Telemetry Comparison Table & Community Benchmarks'
    ],
    contentMarkdown: `## 🏁 Mastering GTA VI Vehicle Dynamics

In Grand Theft Auto VI, Rockstar Games has completely rewritten the tire slip and aerodynamic simulation model. Vehicle handling is no longer a simple arcade friction coefficient—it is an intricate interaction of mass displacement, aero downforce curves, and differential drive distribution.

### ⚙️ Core Telemetry Parameters

When tuning your vehicle inside the **ViceIntel Handling Editor**, keep these key attributes balanced:

| Parameter | Function | Recommended Range | Tuning Effect |
| :--- | :--- | :--- | :--- |
| **\`fMass\`** | Vehicle curb weight | 1,200kg - 1,800kg | Affects inertia and collision impact |
| **\`fInitialDriveForce\`** | Engine torque output | 0.32 - 0.48 | Dictates raw acceleration off the line |
| **\`fDriveBiasFront\`** | AWD / RWD balance | 0.0 (Pure RWD) to 0.5 (50/50 AWD) | Eliminates understeer on corner exit |
| **\`fDownforceModifier\`** | High-speed aero grip | 1.2 - 4.5 | Increases high-speed cornering stability |

### 🚀 Pro-Tuner Protip for Ocean Drive Drag Runs
To maximize your quarter-mile ET in the Everglades drag strip:
1. Keep \`fDriveBiasFront\` between **0.15 and 0.25** for slight front-wheel claw on launch without robbing top-end speed.
2. Dial \`fTractionCurveMax\` to **2.45** and minimize initial wheelspin by modulating throttle.`,
    faqItems: [
      {
        question: 'Does handling.meta affect vehicle top speed in GTA VI?',
        answer: 'Yes! Top speed is governed by the equilibrium between fInitialDriveForce and fInitialDragCoeff alongside gear ratios.'
      },
      {
        question: 'Can I import my custom handling.meta into FiveM servers?',
        answer: 'Absolutely. Use the 1-click XML Export button in our Handling Editor to copy server-ready handling lines.'
      }
    ],
    keyTakeaways: [
      'fDownforceModifier increases high-speed cornering grip exponentially without adding rolling resistance.',
      'A 20/80 AWD bias delivers faster 0-60 mph launch times than pure rear-wheel drive.',
      'Brake force above 1.1 requires ABS calibration to avoid immediate tire lockup.'
    ],
    status: 'Published',
    createdAt: '2026-08-20T14:30:00Z',
    updatedAt: '2026-08-22T09:15:00Z'
  },
  {
    id: 'blog-2',
    title: 'Top 10 Hidden Collectibles & Secret Locations Across Vice City & The Keys',
    slug: 'top-10-hidden-collectibles-vice-city-map',
    metaTitle: 'Top 10 Hidden Collectibles in GTA VI Vice City Map Guide',
    metaDescription: 'Find all rare weapon caches, sunken shipwrecks, and drug runner airstrips with high-resolution coordinates and interactive map pins.',
    targetKeywords: ['gta 6 hidden collectibles', 'vice city map secrets', 'vice city underwater shipwrecks', 'gta vi weapon caches'],
    tone: 'Gaming Hype',
    estimatedReadTime: '6 min read',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    category: 'Map Leaks & Districts',
    author: 'ViceIntel Tommy',
    authorRole: 'Senior Strategic Editor & Cartographer',
    authorAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ViceIntelTommy',
    modelUsed: 'gemini-3.7-flash',
    outline: [
      '1. The Sunken Smuggler Submarine off Key Biscayne',
      '2. Abandoned Everglades Airfield Military Crate',
      '3. Downtown Art Deco Rooftop Safehouses',
      '4. Coral Gables Cartel Mansion Underground Vault'
    ],
    contentMarkdown: `## 🗺️ Uncovering Vice City's Deepest Secrets

The expansive Leonida map in GTA VI spans from glittering Ocean Drive high-rises to murky alligator-infested Everglades bayous. Here are the top 4 hidden locations you need to mark on your map immediately:

### 📍 Verified Map Hotspots

| District | Coordinate Sector | Notable Loot / Feature | Risk Level |
| :--- | :--- | :--- | :--- |
| **Key Biscayne Trench** | X: 88.4, Y: 92.1 | Sunken Drug Submarine ($75,000 Cash) | 🌊 High (Scuba Gear Required) |
| **Everglades Marsh Airfield** | X: 24.1, Y: 58.7 | Heavy Sniper Mk II & Airboat Spawn | 🐊 Medium (Alligator Hazards) |
| **Downtown Vice Bank Rooftop** | X: 52.0, Y: 44.3 | Buzzard Attack Chopper Helipad | 🚨 High (3-Star VCPD Response) |
| **Little Haiti Safehouse Basement** | X: 41.5, Y: 33.2 | Contraband Hacking Terminal | 🟢 Low (Covert Entry) |

### 💡 Pro-Tip
Always sync your waypoint on the **ViceIntel Interactive Map** before heading out into deep water sectors to avoid running out of oxygen.`,
    faqItems: [
      {
        question: 'Do map collectibles respawn after collection?',
        answer: 'Certain weapon caches and cash drops respawn every 48 in-game hours, while unique vehicle blueprints are permanent.'
      },
      {
        question: 'How do I reach the deep ocean trench collectibles?',
        answer: 'Equip the Rebreather Scuba Gear from any Vice Beach Marina dive shop before diving.'
      }
    ],
    keyTakeaways: [
      'Scuba gear is required for the Key Biscayne offshore submarine crate.',
      'Everglades airfield contains a rare Heavy Sniper Mk II spawn point.',
      'Rooftop helipads can be accessed via exterior emergency service elevators.'
    ],
    status: 'Draft',
    createdAt: '2026-08-22T11:00:00Z',
    updatedAt: '2026-08-23T04:20:00Z'
  }
];

export const SEED_SOCIAL_POSTS: SocialPostItem[] = [
  {
    id: 'soc-1',
    platform: 'bleeter_twitter',
    title: 'Tuning Championship Launch Announcement',
    hook: '🏎️ 500,000 VC Cash on the line this weekend.',
    content: 'Tires scream on Ocean Drive. 500k VC Prize Pool. Our GTA VI Handling Championship is officially live! Upload your handling.meta build, test top speeds & claim the Master Tuner badge. \n\nLeaderboard closes Sunday midnight: viceintel.app/tuning-championship',
    hashtags: ['#GTAVI', '#ViceCity', '#GTATuning', '#GamingNews'],
    callToAction: 'Check live leaderboard positions now ↗',
    visualPrompt: 'Cinematic wide photo of neon pink Pegassi Tempesta drifting past Ocean Drive palm trees at twilight with tire smoke.',
    characterCount: 268,
    predictedEngagement: 'High (4.8% CTR)'
  },
  {
    id: 'soc-2',
    platform: 'snapmatic_instagram',
    title: 'Everglades Map Secret Carousel Post',
    hook: '🌴 3 Map Locations Rockstar Didn\'t Show in the Trailer.',
    content: 'Swipe through to uncover the top 3 hidden stash locations across Leonida! 📍 \n\n1️⃣ Key Biscayne Sunken Cargo Sub\n2️⃣ Everglades Smuggler Airstrip\n3️⃣ Little Haiti Rooftop Helipad\n\nFull GPS coordinates & interactive waypoint pins available on ViceIntel Map. Link in bio! 🗺️⚡',
    hashtags: ['#GTAVI', '#GTA6', '#ViceCityMap', '#GamingCommunity', '#RockstarGames'],
    callToAction: 'Tap link in bio to inspect the interactive 4K map.',
    visualPrompt: 'Multi-slide square cards with high-contrast glowing GPS markers over realistic GTA 6 satellite terrain.',
    characterCount: 385,
    predictedEngagement: 'Viral Potential (12.4k Likes)'
  },
  {
    id: 'soc-3',
    platform: 'shorts_tiktok',
    title: '0-60 MPH Physics Breakdown Video Script',
    hook: 'Why your GTA 6 car feels slow (and how to fix it in 30 seconds)',
    content: `[HOOK - 0:00 to 0:04]
"If your supercar is spinning out on Ocean Drive in GTA 6, stop touching the suspension. The secret is in this one line of code."

[BODY - 0:05 to 0:22]
"Rockstar added real AWD differential bias. Open the ViceIntel Handling Editor, find 'fDriveBiasFront', and switch it from 0.0 to 0.22. That sends 22% of raw engine torque to the front wheels, locking down your launch without sacrificing top speed."

[CTA - 0:23 to 0:30]
"Test your 0-60 time on our free physics simulator right now at ViceIntel.app. Link in comments!"`,
    hashtags: ['#gta6', '#gtavi', '#gamertok', '#gamingtips', '#vicecity'],
    callToAction: 'Comment "TUNING" to get the direct handling cheat sheet.',
    visualPrompt: 'Fast-paced screen recording of handling editor sliders moving, transitioning to high-speed in-game drag launch.',
    characterCount: 540,
    predictedEngagement: 'High Retention (68% Complete Rate)'
  },
  {
    id: 'soc-4',
    platform: 'discord',
    title: 'Server Directory Spotlight Notification',
    hook: '📢 New FiveM Roleplay Servers Verified!',
    content: `**🌴 VICEINTEL RP DIRECTORY UPDATE**
We just verified 3 elite Vice City FiveM RP servers for this month:

👑 **Vice City Chronicles** — Realistic Police & EMS, Custom Economy, Whitelist Open.
🏙️ **Ocean Drive RP** — 200+ Custom GTA VI Vehicles, Gang Wars & Luxury Nightclubs.
⚓ **Leonida State Roleplay** — Heavy Law Enforcement & Courtroom System.

Apply for whitelists or check live server population: <https://viceintel.app/rp-servers>`,
    hashtags: ['#FiveM', '#GTA6RP', '#ViceCityRP'],
    callToAction: 'Click below to submit your server application.',
    visualPrompt: 'Rich Discord embed with gold border, custom server banner, and inline field statuses.',
    characterCount: 460,
    predictedEngagement: 'Very High (180+ server connects)'
  }
];

export const SEED_BRAND_GRAPHICS: BrandGraphicBrief[] = [
  {
    id: 'gfx-1',
    title: 'Championship Ocean Drive Twilight Hero Banner',
    channel: 'Hero Banner',
    aspectRatio: '21:9',
    dimensions: '2560 x 1080 px',
    visualDescription: 'Ultra-wide cinematic vista of Ocean Drive at twilight. High-gloss neon cyan and hot magenta light reflecting off wet asphalt. A customized sports coupe in the foreground with glowing LED taillights and subtle carbon fiber aero.',
    imageUrl: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1600&q=80',
    subtitle: 'Ocean Drive Sports Coupe Cruise & Custom Tuning Telemetry',
    badgeText: 'VICE CITY HERO BANNER • 21:9',
    ctaText: 'Explore Database ➔',
    colorPalette: [
      { name: 'Vice Magenta', hex: '#FF007F' },
      { name: 'Neon Cyan', hex: '#00F0FF' },
      { name: 'Sunset Amber', hex: '#FF8800' },
      { name: 'Deep Asphalt', hex: '#090B10' }
    ],
    typographyNotes: 'Bold geometric display sans-serif (e.g. Plus Jakarta Sans ExtraBold) with letter-spacing +2px and subtle ambient drop shadow.',
    aiGenerationPrompt: 'Hyper-realistic GTA VI Vice City Ocean Drive night scene, wet street reflections, Art Deco hotels with neon glow, customized sports car in foreground, cinematic lighting, 8k resolution, Unreal Engine 5 aesthetic, photorealistic',
    negativePrompt: 'blurry, cartoonish, low resolution, artifacts, distorted car wheels, daytime, plain text',
    status: 'Ready',
    createdAt: '2026-08-21T18:00:00Z'
  },
  {
    id: 'gfx-2',
    title: 'YouTube 4K Thumbnail - Secret Map Locations',
    channel: 'YouTube Thumbnail',
    aspectRatio: '16:9',
    dimensions: '1920 x 1080 px',
    visualDescription: 'High-contrast split image with an ominous red glowing GPS pin over the Florida Keys mangrove swamp, paired with an open military weapons crate glowing in gold light.',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=80',
    subtitle: 'Top Secret Military Bunkers & Mangrove Swamp Crate Drops',
    badgeText: 'YOUTUBE 4K THUMBNAIL • 16:9',
    ctaText: 'Watch Map Guide ➔',
    colorPalette: [
      { name: 'Alert Crimson', hex: '#FF2A4D' },
      { name: 'Loot Gold', hex: '#FFD700' },
      { name: 'Night Bayou Green', hex: '#0D2818' },
      { name: 'Pure White', hex: '#FFFFFF' }
    ],
    typographyNotes: 'Massive high-impact display font with 4px black outline and vibrant yellow fill.',
    aiGenerationPrompt: 'High impact gaming thumbnail GTA 6 secret location, glowing red map waypoint marker pointing at hidden jungle bunker, dramatic sunset rim lighting, intense contrast',
    negativePrompt: 'cluttered, tiny unreadable text, low contrast, washed out colors',
    status: 'Generated',
    createdAt: '2026-08-22T08:30:00Z'
  },
  {
    id: 'gfx-3',
    title: 'Snapmatic Square Promo - Handling Editor',
    channel: 'Snapmatic Square',
    aspectRatio: '1:1',
    dimensions: '1080 x 1080 px',
    visualDescription: 'Clean product-style showcase with a transparent 3D wireframe car chassis overlaying real-time telemetry speed graphs and neon HUD dials.',
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80',
    subtitle: 'Handling.meta Physics Dyno Charts & Slip Angle Modding',
    badgeText: 'SNAPMATIC SQUARE • 1:1',
    ctaText: 'Tune Vehicle ➔',
    colorPalette: [
      { name: 'Electric Cyan', hex: '#00E5FF' },
      { name: 'HUD Amber', hex: '#FFA000' },
      { name: 'Dark Slate', hex: '#121824' }
    ],
    typographyNotes: 'Technical monospace paired with sleek modern sans-serif.',
    aiGenerationPrompt: 'Futuristic vehicle telemetry blueprint HUD overlay on modern sports car, neon wireframe glowing vectors, dark minimalist background, high tech racing telemetry interface',
    negativePrompt: 'cluttered, messy lines, low res, vintage',
    status: 'Ready',
    createdAt: '2026-08-23T01:15:00Z'
  },
  {
    id: 'gfx-4',
    title: 'Discord Community Header - FiveM RP Hub',
    channel: 'Discord Header',
    aspectRatio: '16:9',
    dimensions: '1280 x 480 px',
    visualDescription: 'Sleek banner for Discord server headers featuring bank vault heist doors, golden bullion bars, and high-tech comms headset icons.',
    imageUrl: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=1600&q=80',
    subtitle: 'Whitelisted RP Server Directory & Voice Channel Hubs',
    badgeText: 'DISCORD HEADER • 1280x480',
    ctaText: 'Join Discord Server ➔',
    colorPalette: [
      { name: 'Vault Gold', hex: '#FFD700' },
      { name: 'Crimson Amber', hex: '#FF2A4D' },
      { name: 'Dark Metal', hex: '#0A0E17' }
    ],
    typographyNotes: 'Bold condensed block lettering with metallic sheen.',
    aiGenerationPrompt: 'Discord header banner GTA 6 heist vault doors, glowing gold stacks, dark glossy reflections, high impact server header',
    negativePrompt: 'overcrowded text, low quality, washed out',
    status: 'Ready',
    createdAt: '2026-08-23T04:20:00Z'
  },
  {
    id: 'gfx-5',
    title: 'Bleeter Wide Promo - Midnight News Spider',
    channel: 'Bleeter Wide',
    aspectRatio: '16:9',
    dimensions: '1200 x 630 px',
    visualDescription: 'Dynamic social media card with Everglades swamp airboat patrol at dusk and glowing neon breaking news ticker overlay.',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
    subtitle: 'Live AI Crawled GTA 6 Leaks & Rockstar Games Newswire',
    badgeText: 'BLEETER BREAKING NEWS • 1200x630',
    ctaText: 'Read News Hub ➔',
    colorPalette: [
      { name: 'Everglades Green', hex: '#00FF88' },
      { name: 'Cyan Wave', hex: '#00E5FF' },
      { name: 'Midnight Charcoal', hex: '#0B0F19' }
    ],
    typographyNotes: 'High-contrast headline typography with breaking news alert styling.',
    aiGenerationPrompt: 'Social media promo card Everglades airboat dusk patrol, neon green water reflections, breaking news banner style',
    negativePrompt: 'blurry, dull colors, low resolution',
    status: 'Ready',
    createdAt: '2026-08-23T06:10:00Z'
  }
];

export const SEED_KNOWLEDGE_DOCS: KnowledgeDoc[] = [
  {
    id: 'doc-1',
    title: 'Vice City Map Geography & District Names Reference',
    category: 'Game Lore & City',
    tags: ['Geography', 'Districts', 'Ocean Drive', 'Everglades', 'Leonida'],
    tokenCount: 1450,
    updatedAt: '2026-08-22',
    author: 'Chief Intelligence Analyst',
    content: `Vice City and the greater State of Leonida features several distinct operational zones:
- Ocean Beach & Washington Beach: Classic Art Deco hotel strip, beachfront boardwalk, high-density supercar cruising area.
- Downtown Vice City: Financial towers, corporate headquarters, police helipads, and high-rise penthouses.
- Little Haiti & Little Havana: Cultural hubs, chop shops, street market bazaars, and industrial warehouse districts.
- Port Gellhorn: Heavy shipping port, container terminals, shipyard cranes, and contraband drop points.
- The Keys (Grassrivers / Everglades): Mangrove swamps, airboat channels, alligator habitats, and clandestine airstrips.`
  },
  {
    id: 'doc-2',
    title: 'Handling.meta Physics Parameter Formula Specifications',
    category: 'Vehicle Tuning',
    tags: ['Physics', 'Handling', 'Engine', 'Drag', 'Downforce'],
    tokenCount: 2200,
    updatedAt: '2026-08-23',
    author: 'Master Vehicle Engineer',
    content: `Vehicle physics calculation rules in ViceIntel Engine:
1. Top Speed MPH = (fInitialDriveForce / fInitialDragCoeff)^0.55 * GearEfficiencyRatio * 188.5
2. Quarter Mile ET = 14.8 - (fInitialDriveForce * 12.2) + (fMass / 3500)
3. Drift Score Slip Angle = (fTractionCurveMax - fTractionCurveMin) * (1.0 - fDriveBiasFront) * 100
4. Drivetrain Classification:
   - fDriveBiasFront == 0.0 -> Rear Wheel Drive (RWD)
   - fDriveBiasFront == 1.0 -> Front Wheel Drive (FWD)
   - 0.0 < fDriveBiasFront < 1.0 -> All Wheel Drive (AWD)`
  },
  {
    id: 'doc-3',
    title: 'Brand Voice & Social Copy Guidelines',
    category: 'Brand Voice',
    tags: ['Voice', 'Tone', 'Copywriting', 'Bleeter', 'Social'],
    tokenCount: 980,
    updatedAt: '2026-08-21',
    author: 'Creative Director',
    content: `ViceIntel Brand Voice Guidelines:
- Tone: Confident, authoritative, insider knowledge, fast-paced, high energy.
- Language: Use authentic in-universe GTA terminology (e.g. Bleeter instead of Twitter, Snapmatic instead of Instagram, VC Cash instead of dollars where appropriate, Leonida instead of Florida).
- Formatting: High contrast bullet points, clear actionable CTAs, exact numeric telemetry over vague adjectives.`
  }
];

export const SEED_AGENT_LOGS: AgentRunLog[] = [
  {
    id: 'log-1',
    agentName: 'Keyword Opportunity Analyst',
    action: 'Discovered & scored 18 new long-tail keywords for "GTA 6 Vehicle Tuning"',
    status: 'success',
    timestamp: '2 mins ago',
    durationMs: 640,
    outputSummary: 'Mapped 18 keywords to 3 clusters. Found high-opportunity gap: "handling meta slip angle calculator".'
  },
  {
    id: 'log-2',
    agentName: 'SEO Audit Coordinator',
    action: 'Scanned /vehicles directory and validated Schema.org models',
    status: 'success',
    timestamp: '14 mins ago',
    durationMs: 820,
    outputSummary: 'Calculated 94/100 overall score. Flagged 1 minor OpenGraph image ratio recommendation.'
  },
  {
    id: 'log-3',
    agentName: 'Internal Link Strategist',
    action: 'Analyzed link graph across 42 blog posts and tools',
    status: 'success',
    timestamp: '45 mins ago',
    durationMs: 410,
    outputSummary: 'Generated 4 high-priority sentence-level anchor insertion suggestions.'
  },
  {
    id: 'log-4',
    agentName: 'Social Content Creator',
    action: 'Auto-drafted multi-channel campaign for Weekly Championship',
    status: 'success',
    timestamp: '1 hour ago',
    durationMs: 950,
    outputSummary: 'Generated 4 ready-to-post drafts for Bleeter, Snapmatic, TikTok, and Discord.'
  }
];

export const SEED_AGENT_STATUSES = [
  {
    id: 'agent-keywords',
    name: 'SERP & Keyword Strategist',
    role: 'Discovers high-intent GTA VI keyword clusters, calculates difficulty & CPC value.',
    description: 'Discovers high-intent GTA VI keyword clusters, calculates difficulty & CPC value.',
    status: 'active' as const,
    model: 'Gemini 3.7 Flash',
    lastRun: '2 mins ago',
    metricsSummary: '12 active target keywords • 89.4 Avg SERP Score',
    metrics: { successRate: 98, tasksCompleted: 38, avgLatencyMs: 420 },
    actionCount: 38
  },
  {
    id: 'agent-audit',
    name: 'Technical SEO Auditor',
    role: 'Monitors Core Web Vitals, Schema.org structures, canonicals, and crawler telemetry.',
    description: 'Monitors Core Web Vitals, Schema.org structures, canonicals, and crawler telemetry.',
    status: 'active' as const,
    model: 'Gemini 3.7 Flash',
    lastRun: '14 mins ago',
    metricsSummary: '94/100 Overall Health Score • 0 Critical Errors',
    metrics: { successRate: 100, tasksCompleted: 24, avgLatencyMs: 650 },
    actionCount: 24
  },
  {
    id: 'agent-links',
    name: 'Internal Link Strategist',
    role: 'Analyzes cross-content link graphs and proposes high-conversion in-context anchors.',
    description: 'Analyzes cross-content link graphs and proposes high-conversion in-context anchors.',
    status: 'active' as const,
    model: 'Gemini 3.7 Flash',
    lastRun: '45 mins ago',
    metricsSummary: '4 pending contextual link insertions mapped',
    metrics: { successRate: 95, tasksCompleted: 19, avgLatencyMs: 380 },
    actionCount: 19
  },
  {
    id: 'agent-content',
    name: 'SEO Copywriter & Studio',
    role: 'Drafts long-form guides, FAQs, takeaways, and multi-channel social blitz scripts.',
    description: 'Drafts long-form guides, FAQs, takeaways, and multi-channel social blitz scripts.',
    status: 'active' as const,
    model: 'Gemini 3.7 Flash',
    lastRun: '1 hour ago',
    metricsSummary: '6 guides drafted • Bleeter/Snapmatic campaign ready',
    metrics: { successRate: 97, tasksCompleted: 52, avgLatencyMs: 1200 },
    actionCount: 52
  },
  {
    id: 'agent-graphics',
    name: 'Brand Visual Director',
    role: 'Generates creative asset briefs, art direction prompts, and social cover specs.',
    description: 'Generates creative asset briefs, art direction prompts, and social cover specs.',
    status: 'active' as const,
    model: 'Gemini 3.7 Flash',
    lastRun: '3 hours ago',
    metricsSummary: '4 active design briefs generated with color palettes',
    metrics: { successRate: 92, tasksCompleted: 14, avgLatencyMs: 890 },
    actionCount: 14
  },
  {
    id: 'agent-knowledge',
    name: 'RAG Knowledge Integrator',
    role: 'Indexes Vice City game lore, vehicle physics formulas, and brand voice guidelines.',
    description: 'Indexes Vice City game lore, vehicle physics formulas, and brand voice guidelines.',
    status: 'active' as const,
    model: 'Gemini 3.7 Flash',
    lastRun: '5 hours ago',
    metricsSummary: '3 authoritative documents indexed (4,860 tokens)',
    metrics: { successRate: 100, tasksCompleted: 8, avgLatencyMs: 310 },
    actionCount: 8
  },
  {
    id: 'agent-scheduler',
    name: 'Autonomous Orchestrator',
    role: 'Manages cron pipelines, recurring audits, and midnight background crawls.',
    description: 'Manages cron pipelines, recurring audits, and midnight background crawls.',
    status: 'active' as const,
    model: 'Gemini 3.7 Flash',
    lastRun: 'Continuous / 30m',
    metricsSummary: '4 recurring cron tasks scheduled & running healthy',
    metrics: { successRate: 99, tasksCompleted: 120, avgLatencyMs: 250 },
    actionCount: 120
  }
];
