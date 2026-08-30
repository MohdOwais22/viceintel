import { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import {
  MarketingCampaign,
  ViralVideoScript,
  RedditCampaignPost,
  DiscordEmbedPayload,
  StreamerPitchKit,
  generateViralVideoStoryboards,
  generateRedditLaunchPost,
  generateDiscordAnnouncementEmbed,
  generateStreamerOutreachKit,
  generatePseoMatrixDataset,
  saveMarketingCampaignToFirestore
} from '../../../../lib/marketing-engine';
import { resolveMarketingTier, verifyMarketingAccess } from '../../../../lib/marketing-auth';

let aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });
  }
  return aiClient;
}

export interface GenerateCampaignInput {
  topic?: string;
  scope?: 'internal_platform' | 'client_server';
  niche?: 'gtavi_portal' | 'fivem_rp' | 'gaming_tools' | 'creator_hub' | string;
  serverId?: string;
  serverName?: string;
  targetAudience?: string;
  ownerDiscordId?: string;
  targetDomain?: string;
  selectedSubreddit?: string;
  creatorTier?: 'Nano (1k-10k)' | 'Micro (10k-50k)' | 'Partner / Macro (50k-500k+)';
  streamerHandle?: string;
  userTier?: string;
  currentDraftUsage?: number;
  includeVideoScripts?: boolean;
  includeRedditPost?: boolean;
  includeDiscordEmbed?: boolean;
  includeStreamerPitch?: boolean;
  includePseoMatrix?: boolean;
}

/**
 * Synthesizes multi-platform marketing assets using Gemini 3.7 Flash:
 * - TikTok / Reels / Shorts viral hooks & scene storyboards
 * - Anti-spam authentic Reddit launch threads
 * - Rich Discord webhook announcement embeds
 * - Streamer sponsorship pitch kits
 */
export async function generateCampaignWithGemini(
  input: GenerateCampaignInput
): Promise<MarketingCampaign> {
  const {
    topic = '2026 Season Launch & Fast Whitelist',
    scope = 'client_server',
    niche = 'fivem_rp',
    serverId = 'vice-city-rp',
    serverName = 'Vice City Roleplay',
    targetAudience = 'Serious RP enthusiasts, FiveM roleplayers, and GTA VI content creators',
    ownerDiscordId = 'system_owner',
    targetDomain = 'https://viceintel.app',
    selectedSubreddit = 'r/FiveMServers',
    creatorTier = 'Micro (10k-50k)',
    streamerHandle = 'Summit1g'
  } = input;

  const campaignId = `mkt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const currentBrand = scope === 'internal_platform' ? 'ViceIntel Platform' : serverName;

  const ai = getGemini();

  if (!ai) {
    // Algorithmic synthesis fallback
    const scripts = generateViralVideoStoryboards({ topic, niche: niche as any, serverName: currentBrand });
    const reddit = generateRedditLaunchPost({ topic, niche: niche as any, serverName: currentBrand, targetSubreddit: selectedSubreddit });
    const discord = generateDiscordAnnouncementEmbed({
      title: `${currentBrand} — 2026 Community Launch`,
      description: `Fast-track whitelist open. High-fps custom vehicles & balanced economy.`,
      serverName: currentBrand,
      ctaUrl: `${targetDomain}/servers/${serverId}/apply`
    });
    const streamer = generateStreamerOutreachKit({ creatorTier, serverName: currentBrand, streamerHandle });
    const pseo = generatePseoMatrixDataset({ niche: niche as any, targetDomain, scope, serverSlug: serverId });

    const fallbackCampaign: MarketingCampaign = {
      id: campaignId,
      scope,
      serverId: scope === 'client_server' ? serverId : undefined,
      ownerDiscordId,
      targetDomain,
      niche: niche as any,
      keywords: [{ term: topic, volumeEst: 22000, difficulty: 'Low', intent: 'Transactional' }],
      generatedAssets: {
        videoScripts: scripts.map(s => ({ hook: s.hook, scenes: s.scenes, cta: s.cta })),
        detailedVideoScripts: scripts,
        redditPost: { title: reddit.title, body: reddit.body, targetSubreddit: reddit.targetSubreddit },
        discordEmbed: { title: discord.title, description: discord.description, fields: discord.fields },
        streamerPitch: { creatorTier: streamer.creatorTier, pitchEmail: streamer.pitchEmail, terms: streamer.terms },
        pseoMatrixPreview: pseo.matrix
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await saveMarketingCampaignToFirestore(fallbackCampaign).catch(() => {});
    return fallbackCampaign;
  }

  const prompt = `You are an elite viral gaming growth strategist and social media marketing director for GTA VI and high-population FiveM Roleplay servers.

Generate a comprehensive, high-converting, multi-channel marketing campaign payload tailored to the following specifications:

Server / Brand Name: "${currentBrand}"
Campaign Topic: "${topic}"
Target Audience: "${targetAudience}"
Niche: "${niche}"
Scope: "${scope}"
Target Subreddit: "${selectedSubreddit}"
Target Creator Tier: "${creatorTier}"
Featured Streamer Handle: "${streamerHandle}"
Website / Application URL: "${targetDomain}/servers/${serverId}/apply"

You must output a single JSON object with this exact structure:
{
  "keywords": [
    {
      "term": "string (targeted search query)",
      "volumeEst": 28500,
      "difficulty": "Low" | "Medium" | "High",
      "intent": "Transactional" | "Informational" | "Navigational"
    }
  ],
  "videoScripts": [
    {
      "id": "vid_1",
      "hook": "string (explosive 3-second pattern interrupt for TikTok/Shorts)",
      "retentionFormula": "string (e.g., Problem -> Unexpected Twist -> Solution)",
      "targetPlatform": "TikTok",
      "durationSeconds": 28,
      "scenes": ["Scene 1 description", "Scene 2 description", "Scene 3 description"],
      "detailedScenes": [
        {
          "timeframe": "0:00 - 0:03",
          "visualCue": "Fast cut cinematic chase in Vice City neon rain",
          "audioVoiceover": "Stop playing dead FiveM servers that die in 2 weeks...",
          "onScreenText": "WAIT TILL YOU SEE THIS 🚨"
        },
        {
          "timeframe": "0:03 - 0:15",
          "visualCue": "Custom vehicle mechanics, dynamic police dispatch, and player-owned nightclubs",
          "audioVoiceover": "We built custom handling physics and an instant AI whitelist that grades you in 30 seconds.",
          "onScreenText": "INSTANT AI WHITELIST ⚡"
        },
        {
          "timeframe": "0:15 - 0:28",
          "visualCue": "Discord join overlay and starter vehicle claim voucher",
          "audioVoiceover": "First 100 players this weekend get a tier-1 starter pack. Link in bio to apply.",
          "onScreenText": "APPLY NOW 👉 LINK IN BIO"
        }
      ],
      "cta": "string (High-urgency call to action)",
      "recommendedAudio": "string (e.g., Synthwave Phonk / Vice City 80s Dark Synth)",
      "hashtagStrategy": ["#FiveM", "#GTARP", "#GTA6", "#Gaming"]
    }
  ],
  "redditPost": {
    "title": "string (Authentic gamer title, non-spammy, high engagement)",
    "body": "string (Formatted markdown Reddit post body with backstory, custom mechanics, community rules, and invite link)",
    "targetSubreddit": "${selectedSubreddit}",
    "postFlair": "Server Showcase",
    "spamFilterSafeguards": ["No URL shorteners", "Disclosed server affiliation", "Focus on organic storytelling"],
    "recommendedPostingTime": "Friday 5:00 PM EST / Saturday 1:00 PM EST"
  },
  "discordEmbed": {
    "title": "string (Formatted announcement headline)",
    "description": "string (Vibrant markdown announcement copy)",
    "colorHex": "#ec4899",
    "fields": {
      "⚡ Server Connect": "connect cfx.re/join/example",
      "🎟️ Fast-Track Whitelist": "Instant AI review in < 60s",
      "🚗 Custom Features": "90+ Tuned Vehicles, Player Businesses, Gang Territories",
      "🎁 Launch Bonus": "$50,000 In-Game Cash + Free Garage Slot"
    },
    "footerText": "${currentBrand} • Official 2026 Roleplay Experience",
    "timestamp": "${new Date().toISOString()}",
    "actionButtons": [
      { "label": "🚀 Apply for Whitelist", "url": "${targetDomain}/servers/${serverId}/apply", "style": "primary" },
      { "label": "💬 Join Discord", "url": "https://discord.gg/example", "style": "link" }
    ]
  },
  "streamerPitch": {
    "creatorTier": "${creatorTier}",
    "streamerNamePlaceholder": "${streamerHandle}",
    "pitchEmail": "string (Professional, non-cringe creator sponsorship email with clear value props)",
    "streamRulesAgreement": "No stream-sniping protection guarantee & dedicated staff moderation during live broadcasts.",
    "terms": "Exclusive in-game business + 30% affiliate code revenue share + priority queue.",
    "suggestedPerkPackage": {
      "vipClearance": "Tier 4 Creator God-Mode Staff Shield",
      "customInGameBusiness": "Custom Nightclub / Chop Shop with custom interior MLO",
      "priorityQueueTier": "Top-Rank VIP Queue (Instant 0-wait connect)",
      "affiliateRevenueShare": "30% recurring creator payout on VIP donations"
    }
  }
}

Return ONLY valid JSON matching this schema.`;

  const modelsToTry = ['gemini-3.7-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.1-pro-preview'];

  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const text = response.text?.trim() || '';
      if (!text) continue;

      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          parsed = JSON.parse(match[0]);
        }
      }

      if (parsed) {
        const pseo = generatePseoMatrixDataset({ niche: niche as any, targetDomain, scope, serverSlug: serverId });

        const videoScripts: ViralVideoScript[] = Array.isArray(parsed.videoScripts) && parsed.videoScripts.length > 0
          ? parsed.videoScripts.map((v: any, idx: number) => ({
              id: v.id || `vid_${idx + 1}`,
              hook: String(v.hook || 'You need to see this server...'),
              retentionFormula: String(v.retentionFormula || 'Curiosity Hook -> Fast Showcase -> CTA'),
              targetPlatform: (['TikTok', 'YouTube Shorts', 'Instagram Reels'].includes(v.targetPlatform) ? v.targetPlatform : 'TikTok') as any,
              durationSeconds: Number(v.durationSeconds) || 30,
              scenes: Array.isArray(v.scenes) ? v.scenes : ['Hook', 'Showcase', 'CTA'],
              detailedScenes: Array.isArray(v.detailedScenes) ? v.detailedScenes : [],
              cta: String(v.cta || 'Link in bio to join whitelist.'),
              recommendedAudio: String(v.recommendedAudio || 'Vice City Synthwave'),
              hashtagStrategy: Array.isArray(v.hashtagStrategy) ? v.hashtagStrategy : ['#FiveM', '#GTARP']
            }))
          : generateViralVideoStoryboards({ topic, niche: niche as any, serverName: currentBrand });

        const redditPost: RedditCampaignPost = {
          title: String(parsed.redditPost?.title || `[FiveM] ${currentBrand} — Custom Mechanics, Balanced Economy & Instant AI Whitelist`),
          body: String(parsed.redditPost?.body || 'Check out our new season launch with custom assets and active community.'),
          targetSubreddit: String(parsed.redditPost?.targetSubreddit || selectedSubreddit),
          postFlair: parsed.redditPost?.postFlair || 'Server Showcase',
          spamFilterSafeguards: Array.isArray(parsed.redditPost?.spamFilterSafeguards)
            ? parsed.redditPost.spamFilterSafeguards
            : [
                'Organic storytelling style to prevent auto-moderator triggers',
                'No banned URL shorteners or direct redirects',
                'Disclosed server affiliation and transparent community rules'
              ],
          recommendedPostingTime: String(parsed.redditPost?.recommendedPostingTime || 'Friday 6:00 PM EST')
        };

        const discordEmbed: DiscordEmbedPayload = {
          title: String(parsed.discordEmbed?.title || `${currentBrand} — Official Launch`),
          description: String(parsed.discordEmbed?.description || 'Fast-track whitelist is now live.'),
          colorHex: String(parsed.discordEmbed?.colorHex || '#ec4899'),
          fields: parsed.discordEmbed?.fields || { '🚀 Connect': `${targetDomain}/servers/${serverId}` },
          footerText: String(parsed.discordEmbed?.footerText || `${currentBrand} 2026`),
          timestamp: new Date().toISOString(),
          actionButtons: Array.isArray(parsed.discordEmbed?.actionButtons) ? parsed.discordEmbed.actionButtons : []
        };

        const streamerPitch: StreamerPitchKit = {
          creatorTier: (['Nano (1k-10k)', 'Micro (10k-50k)', 'Partner / Macro (50k-500k+)'].includes(parsed.streamerPitch?.creatorTier)
            ? parsed.streamerPitch.creatorTier
            : creatorTier) as any,
          streamerNamePlaceholder: String(parsed.streamerPitch?.streamerNamePlaceholder || streamerHandle),
          pitchEmail: String(parsed.streamerPitch?.pitchEmail || `Hey ${streamerHandle}, we'd love to host your next GTA RP season...`),
          streamRulesAgreement: String(parsed.streamerPitch?.streamRulesAgreement || 'Dedicated moderation and anti-stream sniping protections.'),
          terms: String(parsed.streamerPitch?.terms || 'Custom In-Game Business + 30% Rev-Share on Creator Code'),
          suggestedPerkPackage: parsed.streamerPitch?.suggestedPerkPackage || {
            vipClearance: 'Tier 4 Creator Pass',
            customInGameBusiness: 'Custom Nightclub',
            priorityQueueTier: 'Instant Connect',
            affiliateRevenueShare: '30%'
          }
        };

        const campaign: MarketingCampaign = {
          id: campaignId,
          scope,
          serverId: scope === 'client_server' ? serverId : undefined,
          ownerDiscordId,
          targetDomain,
          niche: niche as any,
          keywords: Array.isArray(parsed.keywords) && parsed.keywords.length > 0
            ? parsed.keywords.map((k: any) => ({
                term: String(k.term || topic),
                volumeEst: Number(k.volumeEst) || 20000,
                difficulty: (['Low', 'Medium', 'High'].includes(k.difficulty) ? k.difficulty : 'Medium') as any,
                intent: (['Informational', 'Transactional', 'Navigational'].includes(k.intent) ? k.intent : 'Transactional') as any
              }))
            : [{ term: topic, volumeEst: 25000, difficulty: 'Low', intent: 'Transactional' }],
          generatedAssets: {
            videoScripts: videoScripts.map(v => ({ hook: v.hook, scenes: v.scenes, cta: v.cta })),
            detailedVideoScripts: videoScripts,
            redditPost: {
              title: redditPost.title,
              body: redditPost.body,
              targetSubreddit: redditPost.targetSubreddit,
              spamFilterSafeguards: redditPost.spamFilterSafeguards,
              postFlair: redditPost.postFlair,
              recommendedPostingTime: redditPost.recommendedPostingTime
            },
            discordEmbed: { title: discordEmbed.title, description: discordEmbed.description, fields: discordEmbed.fields },
            streamerPitch: { creatorTier: streamerPitch.creatorTier, pitchEmail: streamerPitch.pitchEmail, terms: streamerPitch.terms },
            pseoMatrixPreview: pseo.matrix
          },
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        await saveMarketingCampaignToFirestore(campaign).catch(() => {});
        return campaign;
      }
    } catch (err: any) {
      const errMsg = String(err?.message || err);
      const isRateLimitOrQuota = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota') || errMsg.includes('rate limit');
      if (isRateLimitOrQuota) {
        console.warn(`[Campaign Generator] Model ${modelName} reached rate/quota limit. Downgrading to next model in cascade...`);
        await new Promise((r) => setTimeout(r, 400));
      } else {
        const isTransient = errMsg.includes('503') || errMsg.includes('UNAVAILABLE');
        if (isTransient) {
          await new Promise((r) => setTimeout(r, 250));
        }
        console.log(`[Campaign Generator] Model ${modelName} unavailable, switching to next model...`);
      }
    }
  }

  // Fallback if parsing or Gemini fails
  const scripts = generateViralVideoStoryboards({ topic, niche: niche as any, serverName: currentBrand });
  const reddit = generateRedditLaunchPost({ topic, niche: niche as any, serverName: currentBrand, targetSubreddit: selectedSubreddit });
  const discord = generateDiscordAnnouncementEmbed({
    title: `${currentBrand} — 2026 Community Launch`,
    description: `Fast-track whitelist open with AI grading.`,
    serverName: currentBrand,
    ctaUrl: `${targetDomain}/servers/${serverId}/apply`
  });
  const streamer = generateStreamerOutreachKit({ creatorTier, serverName: currentBrand, streamerHandle });
  const pseo = generatePseoMatrixDataset({ niche: niche as any, targetDomain, scope, serverSlug: serverId });

  const campaign: MarketingCampaign = {
    id: campaignId,
    scope,
    serverId: scope === 'client_server' ? serverId : undefined,
    ownerDiscordId,
    targetDomain,
    niche: niche as any,
    keywords: [{ term: topic, volumeEst: 24000, difficulty: 'Low', intent: 'Transactional' }],
    generatedAssets: {
      videoScripts: scripts.map(s => ({ hook: s.hook, scenes: s.scenes, cta: s.cta })),
      detailedVideoScripts: scripts,
      redditPost: {
        title: reddit.title,
        body: reddit.body,
        targetSubreddit: reddit.targetSubreddit,
        spamFilterSafeguards: reddit.spamFilterSafeguards,
        postFlair: reddit.postFlair,
        recommendedPostingTime: reddit.recommendedPostingTime
      },
      discordEmbed: { title: discord.title, description: discord.description, fields: discord.fields },
      streamerPitch: { creatorTier: streamer.creatorTier, pitchEmail: streamer.pitchEmail, terms: streamer.terms },
      pseoMatrixPreview: pseo.matrix
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  await saveMarketingCampaignToFirestore(campaign).catch(() => {});
  return campaign;
}

/**
 * Express Request Handler for /api/marketing/campaigns/generate
 */
export async function handleGenerateCampaign(req: Request, res: Response): Promise<Response | void> {
  try {
    const {
      topic = '2026 Season Launch & Fast Whitelist',
      scope = 'client_server',
      niche = 'fivem_rp',
      serverId = 'vice-city-rp',
      serverName = 'Vice City Roleplay',
      targetAudience,
      ownerDiscordId = 'system_owner',
      targetDomain = 'https://viceintel.app',
      selectedSubreddit,
      creatorTier,
      streamerHandle,
      userTier = 'pro',
      currentDraftUsage = 0
    } = req.body || {};

    const tierCapabilities = resolveMarketingTier({ serverTier: userTier });
    const accessCheck = verifyMarketingAccess(tierCapabilities, 'campaign_draft', currentDraftUsage);

    if (!accessCheck.allowed) {
      return res.status(403).json({
        success: false,
        error: accessCheck.reason,
        requiredTier: accessCheck.requiredTier
      });
    }

    const campaign = await generateCampaignWithGemini({
      topic,
      scope,
      niche,
      serverId,
      serverName,
      targetAudience,
      ownerDiscordId,
      targetDomain,
      selectedSubreddit,
      creatorTier,
      streamerHandle,
      userTier,
      currentDraftUsage
    });

    return res.json({
      success: true,
      campaignId: campaign.id,
      campaign,
      tier: tierCapabilities.tier,
      timestamp: Date.now()
    });
  } catch (err: any) {
    console.error('Error in handleGenerateCampaign:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to generate marketing campaign.' });
  }
}

/**
 * Universal Web POST handler
 */
export async function POST(request: Request | any): Promise<any> {
  const body = typeof request.json === 'function' ? await request.json() : request.body;
  const campaign = await generateCampaignWithGemini(body || {});
  return {
    success: true,
    campaignId: campaign.id,
    campaign,
    timestamp: Date.now()
  };
}
