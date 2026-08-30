/**
 * GTA VI Central — Comprehensive Platform AI Knowledge Base
 * 
 * Provides deep domain knowledge across all platform features, game mechanics,
 * vehicle handling physics, weapon ballistics, district geography, business ROI,
 * FiveM roleplay rules, and user tools.
 * 
 * NOTE: Strictly enforces privacy guardrails: NO admin passkeys, passwords,
 * Stripe secret keys, database credentials, or sensitive backend tokens.
 */

import { ENV } from './envConfig';

export interface KnowledgeTopic {
  category: string;
  keywords: string[];
  summary: string;
  details: string[];
  tips: string[];
  relatedTabs: string[];
}

export const SAFETY_REFUSAL_MESSAGE = 
  "🔒 Security Notice: Administrative passkeys, staff credentials, database passwords, and internal API secret keys are strictly confidential and protected by platform security policies. I am glad to assist you with any game guides, vehicle tuning, weapon stats, map locations, business calculations, or FiveM roleplay questions!";

export const SENSITIVE_KEYWORDS = [
  'password', 'passkey', 'admin passkey', 'staff passkey', 'secret key',
  'stripe secret', 'webhook secret', 'database_url', 'cron_secret',
  'admin backdoor', 'bypass admin', 'admin code', 'staff code',
  'vice2026', 'root password', 'firebase service account', 'private key'
];

/**
 * Checks if a user prompt is asking for sensitive administrative credentials.
 */
export function containsSensitiveQuery(query: string): boolean {
  const lower = query.toLowerCase();
  return SENSITIVE_KEYWORDS.some(keyword => lower.includes(keyword));
}

/**
 * 1. PLATFORM TOOLS & NAVIGATION KNOWLEDGE
 */
export const PLATFORM_TOOLS_KNOWLEDGE: KnowledgeTopic = {
  category: 'Platform Tools & Guides',
  keywords: ['tab', 'tool', 'calculator', 'feature', 'how to use', 'navigation', 'platform', 'app', 'website', 'handling editor', 'mod builder', 'roi', 'comparison', 'map', 'report'],
  summary: `${ENV.APP_NAME} is the ultimate all-in-one companion platform for Grand Theft Auto VI and Vice City roleplay communities.`,
  details: [
    'Interactive Vehicles Database (/vehicles): Filter 30+ verified vehicles by class (Super, Sports, Muscle, SUVs, Off-Road, Aviation, Boats), price, drivetrain (AWD/RWD/FWD), top speed, and custom tuning budget.',
    'Handling Editor & Physics Studio (/handling-editor): Tune real handling.meta parameters (fMass, fInitialDriveForce, fBrakeBiasFront, fSteeringLock, fTractionCurveMax, fSuspensionForce) with live physics telemetry graphs and exportable XML/meta files.',
    'Mod Builder & Cost Calculator (/mod-calculator): Simulate custom stage engine upgrades, twin-turbos, nitrous systems, carbon ceramic brakes, widebody kits, and track estimated top speed and 0-60 launch improvements.',
    'Weapons Catalog & TTK Analyzer (/weapons): Browse all pistols, SMGs, assault rifles, shotguns, and sniper rifles with damage, RPM, range, armor penetration, and time-to-kill (TTK in milliseconds). Includes interactive weapon attachment builder.',
    'Head-to-Head Comparison Matrix (/comparison): Compare any two vehicles or weapons side-by-side with radial performance charts and percentage delta differentials.',
    'Business ROI & Passive Income Optimizer (/roi-calculator): Calculate daily net profit, initial purchase + upgrades outlay, and break-even payback days for Nightclubs, Chop Shops, Counterfeit Warehouses, and Acid Labs.',
    'Interactive Leonida & Vice City Map (/map): High-res vector map with GPS coordinate grid, dealership spawns, Ammu-Nation firing ranges, hidden packages, safehouses, and live Squad Tactical Radar party synchronization.',
    'FiveM RP Server Directory & Whitelist Hub (/rp-servers): Browse verified FiveM & C# servers with live player counts, ping, and status. Features a dynamic No-Code Whitelist Form Builder (/servers/[slug]/manage), Player Application Portal (/apply), and Review Queue (/review) with Discord webhook notifications.',
    'Live Community Chat & Voice Comms (/chat): Real-time Firestore synchronized chat channels, WebRTC voice and screen sharing with 90 FPS hardware-accelerated stream playback, in-modal Picture-in-Picture (PiP), and document floating windows.',
    'GTA VI News & pSEO Knowledge Hub (/blog, /seo, /docs): Automated midnight spider news articles, telemetry tables, district guides, PC hardware specs, and official Rockstar Games Newswire briefings.',
    'User Profile & VIP Management (/profile): Manage GamerTag (2 changes allowed per 365 days), choose animated GTA VI vector avatars (Lucia, Jason, Vice Squad Officer, Ocean Drive DJ, Outlaw Biker, Cartel Don), and view VIP status ($3.99/mo B2C).',
    'Issue & Bug Reporting Suite (/report): Submit glitch reports with screenshot evidence (drag-and-drop, clipboard paste, precision cropper), automatic browser/OS diagnostics, and unique VICE-BUG-XXXX reference tracking tokens.'
  ],
  tips: [
    'Use the top navigation bar or quick search (Ctrl/Cmd + K) to jump between tools instantly.',
    'VIP members enjoy an ad-free experience, custom chat channels, glowing badges, and priority squad radar synchronization.',
    'All tools support responsive mobile and desktop views with offline service worker caching.'
  ],
  relatedTabs: ['vehicles', 'handling-editor', 'mod-calculator', 'weapons', 'comparison', 'roi-calculator', 'map', 'rp-servers', 'chat', 'profile', 'report']
};

/**
 * 2. VEHICLES & TUNING KNOWLEDGE
 */
export const VEHICLES_KNOWLEDGE: KnowledgeTopic = {
  category: 'Vehicles & Tuning',
  keywords: ['vehicle', 'car', 'supercar', 'sports', 'muscle', 'tuning', 'turbo', 'speed', 'top speed', 'acceleration', 'drivetrain', 'awd', 'rwd', 'fwd', 'grotti', 'pegassi', 'bravado', 'pfister', 'vapid', 'albany', 'handling'],
  summary: 'Comprehensive telemetry on verified GTA VI vehicles, manufacturer lore, top speeds, launch benchmarks, and optimal tuning setups.',
  details: [
    'Pegassi Ignus Custom: Supercar class, 138.5 mph top speed, 96 acceleration, AWD drivetrain, $2,765,000. Exceptional cornering grip and straight-line launch.',
    'Grotti Turismo Omaggio: Supercar class, 135.2 mph top speed, 94 acceleration, RWD drivetrain, $2,845,000. Features active aero air brakes and high-revving V12 exhaust note.',
    'Albany V-STR Spec VI: Sports sedan class, 128.0 mph top speed, 88 acceleration, RWD drivetrain, $1,485,000. High luxury with aggressive twin-turbo V8 torque.',
    'Bravado Banshee GTS: Sports/Muscle class, 133.0 mph top speed, 92 acceleration, RWD drivetrain, $1,320,000. Classic Vice City icon with viper V10 engine, perfect for drifting.',
    'Pfister Comet S2 Cabrio: Sports class, 131.5 mph top speed, 90 acceleration, AWD drivetrain, $1,875,000. Rear-engine balance with outstanding wet-weather traction.',
    'Vapid Dominator GT: Muscle class, 126.5 mph top speed, 86 acceleration, RWD drivetrain, $980,000. High straight-line wheelspin, excels in drag races with soft slicks.',
    'Benefactor Schafter V12 Armored: Executive Sedan class, 124.0 mph top speed, 82 acceleration, RWD drivetrain, $1,150,000. Features bullet-resistant glass and explosive plating.',
    'Dinka Jester RR: Sports tuner class, 127.0 mph top speed, 89 acceleration, RWD drivetrain, $1,650,000. Highly customizable widebody kits and drift angle kits.',
    'Shitzu Hakuchou Drag: Motorcycle class, 142.0 mph top speed, 98 acceleration, RWD drivetrain, $975,000. Fastest accelerating land vehicle for highway sprints.'
  ],
  tips: [
    'For maximum drag strip acceleration: Upgrade to Stage 4 ECU + Twin Turbo + Race Transmission + Soft Drag Slicks.',
    'For circuit racing in Vice Beach: AWD vehicles like the Pegassi Ignus Custom and Pfister Comet S2 provide the best corner exit speeds without spinning out.',
    'In the Handling Editor: Increasing fInitialDriveForce boosts acceleration, while adjusting fBrakeBiasFront to 0.58 prevents rear wheel lockups during heavy deceleration.'
  ],
  relatedTabs: ['vehicles', 'handling-editor', 'mod-calculator', 'comparison']
};

/**
 * 3. WEAPONS & BALLISTICS KNOWLEDGE
 */
export const WEAPONS_KNOWLEDGE: KnowledgeTopic = {
  category: 'Weapons & Ballistics',
  keywords: ['weapon', 'gun', 'rifle', 'carbine', 'shotgun', 'sniper', 'pistol', 'damage', 'ttk', 'rpm', 'recoil', 'attachment', 'suppressor', 'thermal', 'incendiary', 'ballistics', 'headshot'],
  summary: 'In-depth weapon ballistics, time-to-kill (TTK) ratings against armor tiers, and optimal combat attachment loadouts.',
  details: [
    'Tactical Carbine MK II: Assault Rifle, 78 damage, 84 fire rate (RPM), 82 range, 310ms TTK, 30-round mag ($34,500). Best all-around weapon for medium-to-long range firefights.',
    'Combat Shotgun MK II: Semi-auto Shotgun, 96 damage, 52 fire rate, 120ms TTK at point-blank ($28,000). Cycles Dragon Breath Incendiary Shells and 20-round drum mags.',
    'Heavy Sniper MK II (Leonida Custom): Sniper Rifle, 100 damage, 25 fire rate, 99 range, 100ms TTK ($68,000). One-shot torso kill on unarmored targets; supports Thermal Sight and Explosive Ammo.',
    'AP Pistol Mk II: Sidearm, 48 damage, 95 fire rate, 380ms TTK ($14,500). High full-auto spray rate, ideal sidearm for drive-bys and vehicle getaways.',
    'Micro SMG Spec-Ops: Submachine Gun, 54 damage, 92 fire rate, 290ms TTK ($18,200). Compact frame with high hip-fire accuracy for tight indoor corridor breaches.',
    'Service Carbine: Standard Issue Military Rifle, 72 damage, 80 fire rate, 340ms TTK ($22,000). Reliable recoil control with low spread over sustained bursts.'
  ],
  tips: [
    'Equip the Monolithic Suppressor to hide your weapon fire from the minimap and squad tactical radar.',
    'Use the Holographic Thermal Sight in night missions or foggy Everglades swamps to spot enemy heat signatures through foliage.',
    'Headshot multiplier in GTA VI is 2.0x for assault rifles and 2.5x for sniper rifles, allowing instantaneous neutralizations.'
  ],
  relatedTabs: ['weapons', 'comparison']
};

/**
 * 4. MAP & DISTRICT GEOGRAPHY KNOWLEDGE
 */
export const MAP_KNOWLEDGE: KnowledgeTopic = {
  category: 'Map & Districts',
  keywords: ['map', 'location', 'district', 'vice beach', 'ocean drive', 'port gellhorn', 'everglades', 'grassrivers', 'little haiti', 'little havana', 'downtown', 'keys', 'gps', 'radar', 'teleport', 'safehouse', 'stunt jump'],
  summary: 'Full geography guide of Leonida State, urban hubs, getaway routes, police response timers, and points of interest.',
  details: [
    'Vice Beach & Ocean Drive: Iconic neon-lit coastline, Art Deco hotels, luxury marinas, and exotic car cruising strips. High police presence near beach hotels (30s response time).',
    'Downtown Vice City: Commercial high-rises, corporate banks, Financial District, metro stations, and rooftop helipads. Tight alleyways provide vertical escape routes.',
    'Port Gellhorn: Heavy industrial shipping port on the western coastline. Features container yards, freight rail tunnels, and boat docks. Average police response: 45 seconds.',
    'Grassrivers / Everglades: Massive tropical wetland biome with airboat trails, alligator habitats, smuggling distilleries, and low police surveillance (90s+ response time).',
    'Little Haiti & Little Havana: Vibrant urban neighborhoods with street racing meets, bodegas, chop shop operations, and contraband distribution hubs.',
    'Kelly County & Mount Kalaga: Northern rural expanse with winding dirt trails, elevation changes, off-road hill climbs, and secluded weapon caches.',
    'Vice Keys: Tropical island chain connected by the Overseas Highway bridges. Excellent for high-speed coastal speedboat getaways and luxury yacht parties.'
  ],
  tips: [
    'Use Port Gellhorn freight rail tunnels to instantly break line of sight during 4-star and 5-star police chases.',
    'Starfish Island bridges feature traffic monitoring cameras—switch stolen vehicles before crossing into luxury residential zones.',
    'The Interactive Map allows you to copy /tp coordinates directly into FiveM console for instant teleportation.'
  ],
  relatedTabs: ['map', 'blog']
};

/**
 * 5. BUSINESSES & ROI ECONOMY KNOWLEDGE
 */
export const BUSINESS_ROI_KNOWLEDGE: KnowledgeTopic = {
  category: 'Business & Economy ROI',
  keywords: ['business', 'roi', 'money', 'profit', 'income', 'passive', 'break even', 'nightclub', 'chop shop', 'counterfeit', 'acid lab', 'warehouse', 'smuggling', 'upgrade', 'daily income'],
  summary: 'Economic modeling for GTA VI commercial enterprises, passive safe revenue, active supply run profits, and break-even timelines.',
  details: [
    'Malibu Club Vice Beach (Nightclub): Purchase $2,850,000, max upgrades $1,850,000, daily income $120,000. Generates automated passive safe cash every hour and acts as a contraband warehouse hub. Break-even: ~39.2 in-game days.',
    'Port Gellhorn Salvage & Chop Shop: Purchase $2,100,000, max upgrades $1,400,000, daily income $240,000. High-margin vehicle dismantling missions with 4-hour payout cycles. Break-even: ~14.6 in-game days.',
    'Starfish Imports Counterfeit Hub: Purchase $1,950,000, max upgrades $1,200,000, daily income $180,000. Fast production cycle of high-grade currency with low supply overhead. Break-even: ~17.5 in-game days.',
    'Everglades Brickade 6x6 Acid Lab: Purchase $750,000, max upgrades $650,000, daily income $310,000. Mobile operation with fast production speed and agile delivery bike missions. Break-even: ~4.5 in-game days (Fastest ROI in the game!).',
    'Vice City Marina Smuggling Docks: Purchase $3,200,000, max upgrades $2,100,000, daily income $280,000. Offshore contraband cargo shipments via high-speed watercraft. Break-even: ~18.9 in-game days.'
  ],
  tips: [
    'Top recommendation for new players: Purchase the Acid Lab first due to its ultra-fast 4.5-day break-even period.',
    'Reinvest 50% of your initial profits into Security Upgrades to cut business raid frequency by 80%.',
    'Use the Business ROI Calculator (/roi-calculator) to simulate custom staff and equipment configurations.'
  ],
  relatedTabs: ['roi-calculator', 'economy']
};

/**
 * 6. FIVEM ROLEPLAY & WHITELIST ENGINE KNOWLEDGE
 */
export const FIVEM_RP_KNOWLEDGE: KnowledgeTopic = {
  category: 'FiveM & Roleplay Rules',
  keywords: ['fivem', 'rp', 'roleplay', 'server', 'whitelist', 'application', 'rules', 'nlr', 'vdm', 'rdm', 'fearrp', 'metagaming', 'powergaming', 'discord', 'connect', 'cfx'],
  summary: 'Server directory, connection guides, dynamic whitelist form builder, and core roleplay rules and definitions.',
  details: [
    'How to Connect to FiveM Servers: 1. Launch FiveM -> 2. Press F8 or tilde (~) to open the developer console -> 3. Type "connect <server_ip_or_cfx_url>" and press Enter.',
    'New Life Rule (NLR): When a player is downed and respawns at the hospital, their character forgets all memories and events leading up to their death. Returning to the scene of death within 15-30 minutes is prohibited.',
    'Random Deathmatch (RDM): Attacking or killing another player without prior verbal roleplay escalation or valid storyline justification.',
    'Vehicle Deathmatch (VDM): Using a motor vehicle as a primary lethal weapon to ram or crush players without roleplay intent.',
    'FearRP / Value of Life: Characters must realistically value their lives when facing overwhelming lethal force (e.g. held at gunpoint by 2+ armed players).',
    'Metagaming: Using out-of-character (OOC) information gathered from Twitch streams, Discord, or web browsers inside the in-character (IC) game world.',
    'Powergaming: Forcing unrealistic actions on other players without giving them a chance to react (e.g. "/me ties up victim and takes all cash with no resistance").',
    'Dynamic Whitelist Engine: Server owners can build custom application forms with minimum word limits, scenario prompts, Discord account verification, and automated webhook embed notifications.'
  ],
  tips: [
    'When writing whitelist applications: Always provide a detailed character backstory with flaws, motivations, and clear scenario responses showing understanding of FearRP and NLR.',
    'Check the FiveM RP Server Directory (/rp-servers) for real-time queue times, ping, and streamer-friendly tags.'
  ],
  relatedTabs: ['rp-servers', 'server-apply', 'server-manage', 'server-review', 'server-status']
};

/**
 * 7. DUAL PROTAGONISTS & GAMEPLAY MECHANICS
 */
export const PROTAGONISTS_LORE_KNOWLEDGE: KnowledgeTopic = {
  category: 'Protagonists & Story Mechanics',
  keywords: ['lucia', 'jason', 'protagonist', 'character', 'story', 'heist', 'mechanics', 'abilities', 'switching', 'inventory', 'co-op', 'synergy'],
  summary: 'Lucia & Jason dual character abilities, tactical synergies, dynamic switching, and cooperative heist mechanics in GTA VI.',
  details: [
    'Lucia: Mastermind burglar and high-stakes hacker. Special abilities include rapid electronic lock bypass, safe cracking, stealth agility, and dual-wield pistol marksmanship.',
    'Jason: Military veteran and tactical wheelman. Special abilities include heavy weapons precision, vehicle hotwiring, recoil mitigation, and tactical evasive rolls.',
    'Dynamic Switching: Seamless character switching in open-world free roam and tactical switching during coordinated heist checkpoints.',
    'Shared Vehicle Arsenal: Lucia and Jason utilize vehicle trunks as shared weapons lockers, allowing them to store heavy armory (RPG, Heavy Sniper, Combat Shotgun) without carrying visible bulk on foot.',
    'Co-op Synergy: During bank heists, Lucia can hack electronic vault timers while Jason maintains crowd intimidation and covers entry choke points.'
  ],
  tips: [
    'Park your getaway vehicle near extraction alleys so you can quickly switch weapon loadouts from the trunk before police SWAT barricades arrive.',
    'Combine Lucia’s electronic scrambler with Jason’s high-torque driving for smooth 5-star wanted level escapes.'
  ],
  relatedTabs: ['blog', 'docs', 'vehicles', 'weapons']
};

/**
 * 8. PC HARDWARE & GRAPHICS SETTINGS KNOWLEDGE
 */
export const HARDWARE_SPECS_KNOWLEDGE: KnowledgeTopic = {
  category: 'System Specs & Hardware',
  keywords: ['pc', 'specs', 'system requirements', 'hardware', 'fps', '4k', 'ray tracing', 'ps5 pro', 'graphics', 'gpu', 'cpu', 'ram', 'nvme', 'ssd', 'pssr'],
  summary: 'Hardware benchmarks, PC minimum/recommended system specs, NVMe SSD streaming requirements, and PS5 Pro 60 FPS modes.',
  details: [
    'Minimum PC Specs (1080p 30-45 FPS, Low-Medium): Intel Core i7-8700K / AMD Ryzen 5 3600, 16 GB DDR4 RAM, Nvidia RTX 2070 Super / AMD RX 5700 XT (8GB VRAM), 150 GB NVMe SSD.',
    'Recommended PC Specs (1440p 60 FPS, High): Intel Core i7-13700K / AMD Ryzen 7 7800X3D, 32 GB DDR5 RAM, Nvidia RTX 4070 Ti / AMD RX 7800 XT (12GB+ VRAM), 150 GB Gen4 NVMe SSD.',
    'Ultra 4K Ray Tracing Specs (4K 60+ FPS, Max Settings): AMD Ryzen 7 7800X3D / Intel Core i9-14900K, 32-64 GB DDR5 RAM, Nvidia RTX 4080 / RTX 4090 / RTX 5080, Gen4/Gen5 DirectStorage NVMe SSD.',
    'NVMe SSD Mandate: DirectStorage 1.2 high-speed asset streaming is strictly required due to the density of Vice City traffic, pedestrian AI, and seamless building interiors.',
    'PS5 Pro Enhancements: Supports PSSR (PlayStation Spectral Super Resolution) AI upscaling, 60 FPS Performance Ray Tracing with dynamic reflections, and enhanced water refraction physics.'
  ],
  tips: [
    'Do not install GTA VI on a mechanical Hard Disk Drive (HDD); asset pop-in and vehicle streaming stalls will occur.',
    'Enable DLSS 3.5 / FSR 3 frame generation to maximize framerates on high-refresh 144Hz+ gaming displays.'
  ],
  relatedTabs: ['blog', 'docs']
};

/**
 * All Knowledge Modules Array
 */
export const ALL_KNOWLEDGE_TOPICS: KnowledgeTopic[] = [
  PLATFORM_TOOLS_KNOWLEDGE,
  VEHICLES_KNOWLEDGE,
  WEAPONS_KNOWLEDGE,
  MAP_KNOWLEDGE,
  BUSINESS_ROI_KNOWLEDGE,
  FIVEM_RP_KNOWLEDGE,
  PROTAGONISTS_LORE_KNOWLEDGE,
  HARDWARE_SPECS_KNOWLEDGE
];

/**
 * Searches the knowledge base to find matching topics based on query keywords.
 */
export function getRelevantKnowledgeContext(query: string, requestedTopic?: string): string {
  const queryLower = query.toLowerCase();
  
  // Find matching topics
  const matchingTopics = ALL_KNOWLEDGE_TOPICS.filter(topic => {
    if (requestedTopic && topic.category.toLowerCase().includes(requestedTopic.toLowerCase())) {
      return true;
    }
    return topic.keywords.some(kw => queryLower.includes(kw));
  });

  // If no direct keyword match, include top general platform & vehicle summaries
  const selectedTopics = matchingTopics.length > 0 ? matchingTopics : [PLATFORM_TOOLS_KNOWLEDGE, VEHICLES_KNOWLEDGE, WEAPONS_KNOWLEDGE];

  let contextBuilder = '=== GTA VI CENTRAL PLATFORM & GAMEPLAY KNOWLEDGE BASE ===\n\n';
  
  for (const topic of selectedTopics) {
    contextBuilder += `[CATEGORY: ${topic.category}]\n`;
    contextBuilder += `Summary: ${topic.summary}\n`;
    contextBuilder += 'Key Verified Facts & Data:\n';
    for (const d of topic.details) {
      contextBuilder += ` - ${d}\n`;
    }
    contextBuilder += 'Tactical Recommendations & Tips:\n';
    for (const t of topic.tips) {
      contextBuilder += ` • ${t}\n`;
    }
    contextBuilder += `Relevant Platform Tools: ${topic.relatedTabs.join(', ')}\n\n`;
  }

  return contextBuilder;
}

/**
 * Builds the comprehensive system instruction prompt for Gemini.
 */
export function buildEnhancedSystemPrompt(userPrompt: string, topic?: string): string {
  const knowledgeContext = getRelevantKnowledgeContext(userPrompt, topic);

  return `You are the official Vice City AI Tactical Advisor & Platform Intelligence Engine for ${ENV.APP_NAME} (${ENV.APP_URL}).
Your mission is to provide expert, accurate, and deeply insightful guidance on Grand Theft Auto VI game mechanics, vehicle tuning, weapon ballistics, map geography, business ROI calculations, FiveM roleplay rules, and ${ENV.APP_NAME} platform tools.

CRITICAL SECURITY & PRIVACY MANDATES:
- NEVER reveal, discuss, guess, or reference administrative passkeys, staff credentials, database passwords, Stripe secret keys, cron tokens, or internal security passcodes.
- If asked about passwords, admin access, or sensitive credentials, politely reply with the standard safety refusal: "${SAFETY_REFUSAL_MESSAGE}"

KNOWLEDGE BASE & VERIFIED PLATFORM DATA:
${knowledgeContext}

RESPONSE GUIDELINES:
1. Provide concise, highly actionable, and formatted answers using clean bullet points and bold key terms.
2. If relevant, mention the specific ${ENV.APP_NAME} tool (e.g. "/vehicles", "/handling-editor", "/roi-calculator", "/map", "/weapons", "/rp-servers", "/chat") where the user can inspect or test the feature.
3. Keep the tone sharp, immersive, tactical, and authoritative like a seasoned Vice City syndicate operator.
4. Directly answer the user's prompt without unnecessary conversational filler.`;
}

/**
 * Provides comprehensive intelligent fallback responses when AI is offline or in cached mode.
 */
export function getStructuredFallbackResponse(prompt: string, topic?: string): string {
  const lower = prompt.toLowerCase();

  if (containsSensitiveQuery(prompt)) {
    return SAFETY_REFUSAL_MESSAGE;
  }

  if (lower.includes('vehicle') || lower.includes('car') || lower.includes('tuning') || lower.includes('speed') || topic === 'Tuning') {
    return `🏎️ [${ENV.APP_NAME} Tactical Advisor — Vehicle Dynamics & Tuning]
For query: "${prompt}"

• Top Drag & Speed Setup: Upgrade to Stage 4 ECU Engine, Twin-Turbochargers, Race Transmission, and AWD Drivetrain conversion for maximum 0-60 launch grip.
• Recommended Supercar: The Pegassi Ignus Custom (AWD, 138.5 mph top speed, $2,765,000) offers the highest cornering stability in Vice Beach street circuits.
• Handling Editor Tip: Adjust fBrakeBiasFront to 0.58 and increase fInitialDriveForce in the Handling Editor (/handling-editor) to eliminate high-speed understeer.
• Interactive Tools: Test your custom build in our Mod Calculator (/mod-calculator) or run head-to-head dyno races in the Comparison Matrix (/comparison).`;
  }

  if (lower.includes('weapon') || lower.includes('gun') || lower.includes('ttk') || lower.includes('damage') || topic === 'Weapons') {
    return `🔫 [${ENV.APP_NAME} Tactical Advisor — Armory & Ballistics]
For query: "${prompt}"

• Best All-Around Assault Rifle: Tactical Carbine MK II (78 Damage, 84 RPM, 310ms TTK). Excellent accuracy across medium and long distances.
• Close Quarters Breacher: Combat Shotgun MK II (96 Damage, 120ms point-blank TTK). Equip Dragon Breath Incendiary Shells for continuous burn damage.
• Sniper Engagements: Heavy Sniper MK II (100 Damage, 100ms TTK). Use the Holographic Thermal Sight to identify targets through foliage and smoke.
• Stealth Tactics: Equip the Monolithic Suppressor to completely conceal weapon discharge from enemy minimaps and squad radar.`;
  }

  if (lower.includes('roi') || lower.includes('money') || lower.includes('business') || lower.includes('profit') || topic === 'ROI') {
    return `💼 [${ENV.APP_NAME} Tactical Advisor — Enterprise ROI & Cash Flow]
For query: "${prompt}"

• Fastest Break-Even: The Everglades Brickade 6x6 Acid Lab ($750k purchase + $650k upgrades) yields up to $310,000 daily income and breaks even in just 4.5 in-game days!
• Best Passive Safe Income: Malibu Club Vice Beach generates $120,000 daily passive revenue deposited directly into your office safe.
• High-Margin Active Heists: Port Gellhorn Salvage & Chop Shop yields $240,000 daily with 4-hour vehicle dismantles.
• Reinvestment Strategy: Always prioritize Equipment & Staff upgrades first before cosmetic lighting to cut production cycle times by 35%.`;
  }

  if (lower.includes('rp') || lower.includes('fivem') || lower.includes('server') || lower.includes('rule') || topic === 'RP') {
    return `🎭 [${ENV.APP_NAME} Tactical Advisor — FiveM & Roleplay Protocol]
For query: "${prompt}"

• Direct Connection: Open FiveM -> Press F8 console -> Type "connect <server_ip>" -> Hit Enter.
• Essential Roleplay Rules:
  - NLR (New Life Rule): Forget all memories and circumstances leading to your hospital respawn.
  - FearRP / Value of Life: Always comply when held at gunpoint by multiple armed assailants.
  - Metagaming: Never use stream or Discord information inside in-character (IC) voice/actions.
• Whitelist Applications: Build deep character flaws and motivations in the Server Apply Portal (/servers/[slug]/apply).`;
  }

  if (lower.includes('map') || lower.includes('district') || lower.includes('location') || lower.includes('port gellhorn') || lower.includes('ocean drive')) {
    return `🗺️ [${ENV.APP_NAME} Tactical Advisor — Leonida Cartography & GPS]
For query: "${prompt}"

• High-Speed Evasion: Port Gellhorn industrial train tunnels provide instant 5-star wanted level concealment.
• Coastal Cruising: Ocean Drive and Vice Beach feature luxury dealership spawns and oceanfront marinas.
• Low Surveillance: Grassrivers / Everglades swamps have 90s+ police response times, making them ideal for contraband drops.
• Squad Radar: Form a tactical party in the Interactive Map (/map) to synchronize real-time teammate GPS markers.`;
  }

  // General Platform overview fallback
  return `⚡ [${ENV.APP_NAME} — Tactical Advisor Intelligence]
For query: "${prompt}"

• Platform Tools:
  - Interactive Vehicles Database & Handling Editor (/vehicles, /handling-editor)
  - Weapons Catalog & Ballistics TTK Analyzer (/weapons)
  - Business ROI & Passive Income Optimizer (/roi-calculator)
  - Interactive Leonida Map & Squad Radar (/map)
  - FiveM RP Server Directory & Whitelist Form Engine (/rp-servers)
  - Real-time Community Chat & Voice Comms (/chat)
• Protagonist Synergy: Lucia handles electronic security and hacking, while Jason specializes in tactical marksmanship and heavy vehicle driving.
• Hardware Optimization: NVMe Gen4 SSD and 32GB RAM are recommended for stutter-free 60+ FPS asset streaming in Vice City.`;
}
