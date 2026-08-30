import { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { KeywordMetric, discoverKeywords } from '../../../lib/marketing-engine';
import { resolveMarketingTier, verifyMarketingAccess } from '../../../lib/marketing-auth';

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

export interface AnalyzeKeywordsInput {
  query?: string;
  scope?: 'internal_platform' | 'client_server';
  niche?: 'gtavi_portal' | 'fivem_rp' | 'gaming_tools' | 'creator_hub' | string;
  serverName?: string;
  userTier?: string;
  currentUsage?: number;
}

/**
 * Analyzes provided keyword topics using Gemini API (gemini-3.7-flash)
 * to return realistic SERP volume, keyword difficulty, search intent, and ranking actions.
 */
export async function analyzeKeywordsWithGemini(
  input: AnalyzeKeywordsInput
): Promise<KeywordMetric[]> {
  const {
    query = '',
    scope = 'client_server',
    niche = 'fivem_rp',
    serverName = 'Vice City Roleplay'
  } = input;

  const ai = getGemini();
  if (!ai) {
    return discoverKeywords(query, scope, niche as any);
  }

  const prompt = `You are a top-tier SEO specialist & gaming growth architect specializing in GTA VI, Rockstar Games, FiveM RP servers, and gaming utility portals.

Task: Analyze the search landscape and generate a high-precision list of 6 to 10 actionable search keywords, search volumes, keyword difficulty, and intent metrics based on the following input:

Input Context:
- Target Search Query / Seed: "${query || (scope === 'internal_platform' ? 'GTA 6 Vice City tools and radar map' : `${serverName} whitelist FiveM server`)}"
- Marketing Scope: ${scope === 'internal_platform' ? 'Internal Platform Engine (GTA VI web companion, vehicle database, interactive map)' : `Server Studio (Custom FiveM / GTA VI Roleplay server: "${serverName}")`}
- Niche Category: ${niche}

Generate a valid JSON array of objects where each object adheres strictly to this schema:
[
  {
    "term": "string (lowercase target search query)",
    "volumeEst": number (estimated monthly search volume, e.g. 24500),
    "difficulty": "Low" | "Medium" | "High",
    "difficultyScore": number (integer 0-100),
    "intent": "Informational" | "Transactional" | "Navigational",
    "cpcEst": "string (e.g. '$1.45')",
    "searchTrend": "string (e.g. '+32%' or '+18%')",
    "topCompetitors": ["string (e.g. tracky-server.com)", "string (e.g. cfx.re)"],
    "serpFeatures": ["string (e.g. People Also Ask)", "string (e.g. Video Carousel)"],
    "suggestedAction": "string (concrete content/SEO action to rank #1)"
  }
]

Return ONLY the raw JSON array without markdown formatting or code blocks if possible, or inside a clean json block.`;

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
        const match = text.match(/\[[\s\S]*\]/);
        if (match) {
          parsed = JSON.parse(match[0]);
        }
      }

      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: any) => ({
          term: String(item.term || query).toLowerCase(),
          volumeEst: Number(item.volumeEst) || 12500,
          difficulty: (['Low', 'Medium', 'High'].includes(item.difficulty) ? item.difficulty : 'Medium') as 'Low' | 'Medium' | 'High',
          difficultyScore: Math.min(100, Math.max(0, Number(item.difficultyScore) || 45)),
          intent: (['Informational', 'Transactional', 'Navigational'].includes(item.intent) ? item.intent : 'Informational') as 'Informational' | 'Transactional' | 'Navigational',
          cpcEst: String(item.cpcEst || '$1.20'),
          searchTrend: String(item.searchTrend || '+20%'),
          topCompetitors: Array.isArray(item.topCompetitors) && item.topCompetitors.length > 0 ? item.topCompetitors : ['cfx.re', 'fivem.net'],
          serpFeatures: Array.isArray(item.serpFeatures) && item.serpFeatures.length > 0 ? item.serpFeatures : ['Organic Results', 'Featured Snippets'],
          suggestedAction: String(item.suggestedAction || 'Publish keyword-targeted landing page with rich schema markup.')
        }));
      }
    } catch (err: any) {
      const errMsg = String(err?.message || err);
      const isRateLimitOrQuota = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota') || errMsg.includes('rate limit');
      if (isRateLimitOrQuota) {
        console.warn(`[Marketing Research] Model ${modelName} reached rate/quota limit. Downgrading to next model in cascade...`);
        await new Promise((r) => setTimeout(r, 400));
      } else {
        const isTransient = errMsg.includes('503') || errMsg.includes('UNAVAILABLE');
        if (isTransient) {
          await new Promise((r) => setTimeout(r, 250));
        }
        console.log(`[Marketing Research] Model ${modelName} unavailable, switching to next model...`);
      }
    }
  }

  // Fallback to local heuristic seed algorithm if all Gemini attempts fail
  return discoverKeywords(query, scope, niche as any);
}

/**
 * Express Request Handler for /api/marketing/research
 */
export async function handleMarketingResearch(req: Request, res: Response): Promise<Response | void> {
  try {
    const queryParam = (req.method === 'POST' ? req.body?.query : req.query.q) || '';
    const scope = (req.method === 'POST' ? req.body?.scope : req.query.scope) || 'client_server';
    const niche = (req.method === 'POST' ? req.body?.niche : req.query.niche) || 'fivem_rp';
    const serverName = (req.method === 'POST' ? req.body?.serverName : req.query.serverName) || 'Vice City RP';
    const userTier = (req.method === 'POST' ? req.body?.userTier : req.query.tier) || 'pro';
    const currentUsage = Number(req.method === 'POST' ? req.body?.currentUsage : req.query.usage) || 0;

    const tierCapabilities = resolveMarketingTier({ serverTier: userTier });
    const accessCheck = verifyMarketingAccess(tierCapabilities, 'keyword_audit', currentUsage);

    if (!accessCheck.allowed) {
      return res.status(403).json({
        success: false,
        error: accessCheck.reason,
        requiredTier: accessCheck.requiredTier
      });
    }

    const keywords = await analyzeKeywordsWithGemini({
      query: String(queryParam),
      scope,
      niche,
      serverName: String(serverName),
      userTier,
      currentUsage
    });

    return res.json({
      success: true,
      scope,
      niche,
      totalFound: keywords.length,
      keywords,
      tier: tierCapabilities.tier,
      timestamp: Date.now()
    });
  } catch (err: any) {
    console.error('Error in handleMarketingResearch:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to analyze keywords.' });
  }
}

/**
 * Web Fetch Handler (POST/GET) for universal compatibility
 */
export async function POST(request: Request | any): Promise<any> {
  const body = typeof request.json === 'function' ? await request.json() : request.body;
  const keywords = await analyzeKeywordsWithGemini(body || {});
  return {
    success: true,
    totalFound: keywords.length,
    keywords,
    timestamp: Date.now()
  };
}

export async function GET(request: Request | any): Promise<any> {
  const keywords = await analyzeKeywordsWithGemini({});
  return {
    success: true,
    totalFound: keywords.length,
    keywords,
    timestamp: Date.now()
  };
}
