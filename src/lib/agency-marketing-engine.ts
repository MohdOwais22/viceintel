/**
 * Sentinel Growth & Marketing Engine — Core Business Logic & Algorithms
 * Powers Creator Outreach CRM, Automated Pitch Synthesis, Viral 9:16 Short Video Scripting,
 * Gamified Referral Quest Loops, Multi-Platform Copywriting, and pSEO Matrix Generation.
 */

import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, query, where, orderBy, limit, updateDoc, increment } from 'firebase/firestore';
import { db } from './firebase';
import { safeFirestoreWrite } from './firebase/firestoreCircuitBreaker';

export interface CreatorLead {
  id: string;
  creatorName: string;
  discordHandle?: string;
  platform: 'twitch' | 'kick' | 'youtube';
  avgViewers: number;
  status: 'pitch_ready' | 'contacted' | 'partnered' | 'rejected';
  contractTerms?: string;
  perkPackage?: {
    vipClearance?: string;
    customInGameBusiness?: string;
    priorityQueueTier?: string;
    affiliateRevenueShare?: string;
  };
  generatedPitch?: string;
  lastContactedAt?: number;
}

export interface VideoScriptBlueprint {
  id: string;
  vibe: string;
  hook: string;
  targetPlatform: 'TikTok' | 'YouTube Shorts' | 'Instagram Reels';
  durationSeconds: number;
  retentionFormula: string;
  storyboard: Array<{
    time: string;
    visual: string;
    audio: string;
    textOnScreen?: string;
  }>;
  hashtags: string[];
  cta: string;
  recommendedAudio: string;
}

export interface ReferralConversionRecord {
  vanityCode: string;
  serverId: string;
  discordId: string;
  clickCount: number;
  conversionCount: number;
  lastConvertedAt: number;
}

export interface MultiPlatformCopyBundle {
  redditPost: {
    title: string;
    body: string;
    targetSubreddit: string;
    flair?: string;
    antiSpamSafeguards: string[];
    recommendedTime: string;
  };
  discordAnnouncement: {
    title: string;
    description: string;
    fields: Record<string, string>;
    colorHex: string;
    footerText: string;
    actionButtons: Array<{ label: string; url: string; style: 'primary' | 'secondary' | 'link' }>;
  };
  twitterThread: string[];
}

export interface AgencyCampaign {
  id: string;
  scope: 'internal_platform' | 'client_server';
  serverId?: string;
  ownerDiscordId: string;
  targetDomain: string;
  creators: CreatorLead[];
  referrals: {
    totalClicks: number;
    totalConversions: number;
    topReferrers: Array<{ discordId: string; count: number; vanityCode?: string }>;
  };
  videoScripts: VideoScriptBlueprint[];
  copywriting?: MultiPlatformCopyBundle;
  tier: 'starter' | 'pro' | 'mega';
  createdAt: number;
  updatedAt: number;
}

/**
 * 1. AUTOMATED PITCH SYNTHESIZER
 * Generates customized streamer partnership proposals featuring server perks
 * (custom cars, priority queue, gang turf access) and strict DMCA/anti-meta terms.
 */
export function synthesizeCreatorPitch(params: {
  creatorName: string;
  platform: 'twitch' | 'kick' | 'youtube';
  avgViewers: number;
  serverName: string;
  perkPackage?: {
    vipClearance?: string;
    customInGameBusiness?: string;
    priorityQueueTier?: string;
    affiliateRevenueShare?: string;
  };
  includeDmcaAntiMetaTerms?: boolean;
}): string {
  const name = params.creatorName || '{Creator_Name}';
  const server = params.serverName || 'Vice City Central';
  const ccv = params.avgViewers || 50;
  const platformName = params.platform ? params.platform.toUpperCase() : 'STREAMING';
  const isHighTier = ccv >= 100;

  const perks = params.perkPackage || {
    vipClearance: 'Tier 1 Streamer Badge & Verified Icon',
    customInGameBusiness: '1x Custom Nightclub or Auto Chop Shop with private stash',
    priorityQueueTier: 'Instant Tier-0 Priority Queue Bypass (0s wait time)',
    affiliateRevenueShare: isHighTier ? '25% Creator Code Revenue Share' : '15% Creator Code Revenue Share'
  };

  const dmcaTerms = params.includeDmcaAntiMetaTerms !== false
    ? `\n### ⚖️ STREAM SAFETY & DMCA / ANTI-META COMPLIANCE:
- Dedicated Moderation Shadow: An active staff member will shadow your active live streams to instantly handle stream-snipers and rule breakers without interrupting your content.
- Strict Anti-Meta Policy: Information revealed on your stream chat is strictly embargoed from in-character police or gang decision-making.
- DMCA Safe Audio Engine: All server radio streams and custom club venues utilize licensed or royalty-free audio feeds for zero DMCA strikes on ${platformName}.`
    : '';

  return `Subject: Exclusive VIP Partnership & Priority Queue Access on ${server}

Hi ${name},

We’ve been following your ${platformName} broadcasts and loved the storyline and character development you bring to roleplay. Your improvisational energy and viewer engagement fit perfectly into the environment we’ve engineered on **${server}**.

We are a high-performance, serious 18+ Vice City RP server backed by automated whitelist reviews, custom MLOs, and a 100% player-driven economy.

### 🎁 YOUR EXCLUSIVE SPONSORSHIP PERK PACKAGE:
1. **${perks.priorityQueueTier || 'Tier-0 Priority Queue Bypass'}**: Never wait in queue during peak broadcast hours.
2. **${perks.customInGameBusiness || 'Custom MLO Business Property'}**: Handcrafted nightclub, import dealership, or gang turf with personal stash and crafting tables.
3. **${perks.vipClearance || 'Streamer Partner Badge'}**: Exclusive Discord roles, streamer badge in list, and custom vehicle handling preset.
4. **${perks.affiliateRevenueShare || 'Creator Code Revenue Share'}**: Earn revenue share on all cosmetic server store purchases made using your vanity creator code.
5. **Community Giveaway Passes**: 10x Fast-Track Whitelist Passes for your ${platformName} chat subscribers.${dmcaTerms}

There are zero forced script requirements — we simply want you to have fun, build unforgettable storylines, and enjoy a high-framerate, lag-free city.

Would you be open to a 5-minute Discord chat or a private tour of the city this week? We can activate your priority queue and set up your character assets immediately.

Best regards,

**Marketing & Creator Partnerships Lead**
${server} Community Operations
Portal: https://vicecitycentral.com
Discord Contact: @Server_Founder`;
}

/**
 * 2. VIRAL SHORT-FORM VIDEO SCRIPT STUDIO
 * Generates structured 9:16 TikTok / Shorts / Reels production blueprints.
 */
export function generateViralVideoBlueprint(params: {
  topic: string;
  serverName: string;
  vibe?: string;
  platform?: 'TikTok' | 'YouTube Shorts' | 'Instagram Reels';
}): VideoScriptBlueprint {
  const brand = params.serverName || 'Vice City Central';
  const topic = params.topic || 'Secret Everglades Radar Glitch & Fast Handling Meta';
  const targetPlatform = params.platform || 'TikTok';
  const vibe = params.vibe || 'High-Energy Cyberpunk Phonk';

  return {
    id: `script_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    vibe,
    hook: `Stop scrolling! Rockstar hid a secret testing zone in the Everglades map that literally breaks the game physics...`,
    targetPlatform,
    durationSeconds: 30,
    retentionFormula: 'Pattern Interrupt (0-3s) -> High Contrast Telemetry (3-25s) -> Fast CTA (25-30s)',
    storyboard: [
      {
        time: '0:00 - 0:03 (Hook)',
        visual: 'Fast zoom on radar map coordinates with pulsing red caution indicator.',
        audio: 'Stop scrolling! Nobody noticed this secret coordinate in the Vice City Everglades map.',
        textOnScreen: '🚨 SECRET MAP COORDINATE FOUND'
      },
      {
        time: '0:03 - 0:12 (Core Scene 1)',
        visual: 'In-game 60fps clip showing vehicle reaching 242 MPH straightaway with telemetry HUD overlays.',
        audio: 'If you adjust the handling traction curve and drive force values, the car refuses to spin out around tight corners.',
        textOnScreen: '⚡ 242 MPH ZERO-SLIP HANDLING'
      },
      {
        time: '0:12 - 0:24 (Core Scene 2)',
        visual: 'Live UI demo of the Sentinel handling calculator producing ready-to-run handling.meta XML.',
        audio: 'Instead of guessing values for 3 hours, you can export the exact XML file in 5 seconds for free.',
        textOnScreen: '🛠️ 1-CLICK XML EXPORT'
      },
      {
        time: '0:24 - 0:30 (Call to Action)',
        visual: 'Clean server URL with animated link-in-bio pointer and fast-track join button.',
        audio: `Check out ${brand} right now — link in bio to test your vehicle build today!`,
        textOnScreen: `👇 LINK IN BIO: ${brand.toUpperCase()}`
      }
    ],
    hashtags: ['#GTA6', '#GTAVI', '#FiveM', '#GTA6Leaks', '#GamingShorts', '#ViceCity', '#RPGame'],
    cta: `Test your custom tuning build for free on ${brand} (Link in Bio)!`,
    recommendedAudio: 'Trending Phonk / Bass Boosted Synthwave (128 BPM)'
  };
}

/**
 * 3. GAMIFIED REFERRAL & QUEST ENGINE
 * Generates unique vanity referral links and tracks conversions.
 */
export function buildReferralLink(serverSlug: string, userId: string, vanityAlias?: string): string {
  const code = vanityAlias || userId;
  return `https://vicecitycentral.com/join/${serverSlug}?ref=${encodeURIComponent(code)}`;
}

export async function trackReferralConversionInFirestore(params: {
  serverSlug: string;
  vanityCode: string;
  discordId: string;
  conversionType: 'click' | 'application' | 'join';
}): Promise<boolean> {
  return (await safeFirestoreWrite(async () => {
    const docId = `${params.serverSlug}_${params.vanityCode}`;
    const docRef = doc(db, 'marketing_referrals', docId);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      if (params.conversionType === 'click') {
        await updateDoc(docRef, { clickCount: increment(1), lastConvertedAt: Date.now() });
      } else {
        await updateDoc(docRef, { conversionCount: increment(1), lastConvertedAt: Date.now() });
      }
    } else {
      await setDoc(docRef, {
        vanityCode: params.vanityCode,
        serverId: params.serverSlug,
        discordId: params.discordId,
        clickCount: params.conversionType === 'click' ? 1 : 0,
        conversionCount: params.conversionType !== 'click' ? 1 : 0,
        createdAt: Date.now(),
        lastConvertedAt: Date.now()
      });
    }

    // Update Campaign Top Referrers in main campaign
    const campaignRef = doc(db, 'agency_campaigns', params.serverSlug);
    const cSnap = await getDoc(campaignRef);
    if (cSnap.exists()) {
      const data = cSnap.data() as AgencyCampaign;
      const refList = data.referrals?.topReferrers || [];
      const existing = refList.find((r) => r.discordId === params.discordId || r.vanityCode === params.vanityCode);
      if (existing) {
        existing.count += 1;
      } else {
        refList.push({ discordId: params.discordId, count: 1, vanityCode: params.vanityCode });
      }
      refList.sort((a, b) => b.count - a.count);
      await updateDoc(campaignRef, {
        'referrals.totalClicks': increment(params.conversionType === 'click' ? 1 : 0),
        'referrals.totalConversions': increment(params.conversionType !== 'click' ? 1 : 0),
        'referrals.topReferrers': refList.slice(0, 10),
        updatedAt: Date.now()
      });
    }

    return true;
  }, true)) ?? true;
}

/**
 * 4. MULTI-PLATFORM LAUNCH COPYWRITER
 * Formatted for Reddit, Discord, and Twitter/X.
 */
export function generateMultiPlatformLaunchCopy(params: {
  serverName: string;
  features?: string[];
  targetSubreddit?: string;
}): MultiPlatformCopyBundle {
  const brand = params.serverName || 'Vice City Central';
  const featureList = params.features || [
    'Custom Vice City MLO interiors & Everglades radar expansion',
    '100% Player-Driven economy & active DOJ / EMS careers',
    '60-Second AI-Verified fast-track whitelist portal',
    'Custom handling.meta physics with 240+ MPH tuning'
  ];

  return {
    redditPost: {
      title: `[QBCore/Custom] ${brand} | Vice City Lore | Player Economy | 60-Sec AI Whitelist | 18+ Serious RP`,
      body: `Hey everyone,

After 6 months of custom development, we are officially opening whitelist applications for **${brand}**.

We built this server with a single core rule: **Story and immersion come first.** No pay-to-win priority queues, no admin favoritism, and zero robotic 5-day wait times.

### 🌟 What Makes Our City Unique:
${featureList.map((f) => `* **${f}**`).join('\n')}

### 🔗 How to Get Whitelisted Tonight:
1. Visit our application portal: **https://vicecitycentral.com/servers/${brand.toLowerCase().replace(/\s+/g, '-')}/apply**
2. Link your Discord account for instant role assignment.
3. Launch FiveM and paste the direct F8 connect command from your status page.

Drop a comment below if you have any questions or want a personal tour of the city!`,
      targetSubreddit: params.targetSubreddit || 'r/FiveMServers',
      flair: 'Server Advertisement',
      antiSpamSafeguards: [
        'Zero shortened URLs (prevents auto-spam removal)',
        'Authentic backstory and verified feature breakdown',
        'Direct link to official HTTPS domain'
      ],
      recommendedTime: 'Friday or Saturday between 18:00 - 21:00 EST for peak roleplayer discovery.'
    },
    discordAnnouncement: {
      title: `🚀 ${brand} — Season 2 Official Server Launch & Whitelist Open`,
      description: `We are thrilled to announce that applications for ${brand} are officially open! Experience custom Vice City roleplay with high-framerate performance and 100% player-driven lore.`,
      colorHex: '#ec4899',
      fields: {
        '⚡ Fast Whitelist': 'Applications are reviewed in under 60 seconds via our automated AI portal.',
        '🏎️ Custom Vehicles': 'Over 150+ custom vehicles tuned with realistic handling.meta physics.',
        '💼 Business Grants': 'City Hall is accepting player business proposals starting tonight!'
      },
      footerText: `Sentinel Growth Suite • ${brand} 2026`,
      actionButtons: [
        { label: 'Apply for Whitelist', url: `https://vicecitycentral.com/servers/${brand.toLowerCase().replace(/\s+/g, '-')}/apply`, style: 'primary' },
        { label: 'View Live Map', url: 'https://vicecitycentral.com/map', style: 'secondary' }
      ]
    },
    twitterThread: [
      `🚨 BIG ANNOUNCEMENT: Applications for ${brand} are officially OPEN! Experience custom Vice City FiveM RP like never before. 🌴🏙️ #FiveM #GTARP #GTA6`,
      `1/4 🏎️ Realistic vehicle physics with 1-click handling adjustments & custom MLO interiors across Vice Beach and Port Gellhorn.`,
      `2/4 ⚡ No waiting 3 days for whitelist approval. Our automated portal verifies your Discord and reviews your backstory in 60 seconds.`,
      `3/4 💼 100% Player-led economy. Submit business plans to City Hall, manage nightclubs, or run underground chop shops.`,
      `4/4 🔗 Apply now and join the Discord: https://vicecitycentral.com/servers/${brand.toLowerCase().replace(/\s+/g, '-')}/apply`
    ]
  };
}

/**
 * 5. pSEO MATRIX & SCHEMA GENERATOR
 */
export function generatePseoMatrixAndSchema(params: {
  serverName: string;
  serverSlug: string;
  targetDomain: string;
}): { matrix: any[]; xmlSitemap: string } {
  const domain = params.targetDomain.replace(/\/$/, '');
  const brand = params.serverName;

  const routes = [
    { slug: 'apply', title: `Apply for ${brand} Whitelist — Fast AI Review`, category: 'Whitelist Portal' },
    { slug: 'growth', title: `${brand} Growth Studio & Creator Hub`, category: 'B2B Marketing' },
    { slug: 'status', title: `Live Server Queue & Player Stats — ${brand}`, category: 'Telemetry' },
    { slug: 'review', title: `Staff Application Review Portal — ${brand}`, category: 'Moderation' }
  ];

  const matrix = routes.map((r) => {
    const canonical = `${domain}/servers/${params.serverSlug}/${r.slug}`;
    return {
      slug: r.slug,
      canonicalUrl: canonical,
      metaTitle: `${r.title} | Vice City Central`,
      metaDescription: `Official ${r.category.toLowerCase()} for ${brand}. Access live queue stats, verified player applications, and growth tools.`,
      openGraphCard: {
        title: r.title,
        description: `Official ${brand} ${r.category} page on Vice City Central.`,
        url: canonical,
        badge: 'VERIFIED SERVER HUB'
      },
      jsonLdSchema: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: r.title,
        url: canonical,
        publisher: {
          '@type': 'Organization',
          name: brand,
          url: domain
        }
      }
    };
  });

  const xmlSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${matrix.map((m) => `  <url>\n    <loc>${m.canonicalUrl}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>`).join('\n')}
</urlset>`;

  return { matrix, xmlSitemap };
}

/**
 * CAMPAIGN HEALTH SCORER
 */
export function calculateCampaignHealthScore(campaign: AgencyCampaign): {
  score: number;
  tier: string;
  badges: string[];
  recommendations: string[];
} {
  let score = 50;
  const badges: string[] = [];
  const recommendations: string[] = [];

  if (campaign.creators && campaign.creators.length > 0) {
    score += Math.min(campaign.creators.length * 10, 25);
    badges.push('Active Streamer Pipeline');
  } else {
    recommendations.push('Add at least 3 Twitch/Kick streamer leads to initiate outreach.');
  }

  if (campaign.videoScripts && campaign.videoScripts.length > 0) {
    score += Math.min(campaign.videoScripts.length * 10, 15);
    badges.push('Viral Video Blueprints Ready');
  } else {
    recommendations.push('Generate at least 1 TikTok / Shorts video script for viral acquisition.');
  }

  if (campaign.copywriting) {
    score += 10;
    badges.push('Multi-Platform Copy Ready');
  }

  return {
    score: Math.min(score, 100),
    tier: score >= 85 ? 'MEGA' : score >= 65 ? 'PRO' : 'STARTER',
    badges,
    recommendations
  };
}

/**
 * FIRESTORE PERSISTENCE HELPERS
 */
export async function saveAgencyCampaignToFirestore(campaign: AgencyCampaign): Promise<boolean> {
  return (await safeFirestoreWrite(async () => {
    const docRef = doc(db, 'agency_campaigns', campaign.id);
    const sanitized = JSON.parse(JSON.stringify(campaign));
    sanitized.updatedAt = Date.now();
    await setDoc(docRef, sanitized, { merge: true });
    return true;
  }, true)) ?? false;
}

export async function fetchAgencyCampaignFromFirestore(campaignId: string): Promise<AgencyCampaign | null> {
  try {
    const docRef = doc(db, 'agency_campaigns', campaignId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as AgencyCampaign;
    }
    return null;
  } catch (err) {
    console.warn('Notice: Firestore fetch fallback:', err);
    return null;
  }
}
