import { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { synthesizeCreatorPitch } from '../../../lib/agency-marketing-engine';

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

export async function handleCreatorsRoute(req: Request, res: Response) {
  try {
    const {
      creatorName = 'Summit1g',
      platform = 'twitch',
      avgViewers = 150,
      serverName = 'Vice City Roleplay',
      perkPackage,
      includeDmcaAntiMetaTerms = true
    } = req.body || {};

    const ai = getGemini();

    let pitchText = '';

    if (ai) {
      const prompt = `Synthesize a high-converting, professional partnership pitch email/DM for a gaming streamer outreach campaign.
Creator Name: ${creatorName}
Platform: ${platform}
Average CCV / Viewers: ${avgViewers}
Server Name: ${serverName}
Perks: Priority queue bypass, custom nightclub property, partner role badge, revenue share.
Requirements: Include stream safety safeguards (DMCA-safe audio, dedicated staff moderation shadow, strict anti-meta policies). Keep it concise, engaging, and professional without robotic corporate filler.`;

      // Fast timeout race: max 1200ms for Gemini generation
      const fetchWithTimeout = async () => {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3.7-flash',
            contents: prompt
          });
          return response?.text || '';
        } catch (e) {
          return '';
        }
      };

      const timeoutPromise = new Promise<string>((resolve) => setTimeout(() => resolve(''), 1200));
      pitchText = await Promise.race([fetchWithTimeout(), timeoutPromise]);
    }

    if (!pitchText) {
      pitchText = synthesizeCreatorPitch({
        creatorName,
        platform: platform as any,
        avgViewers,
        serverName,
        perkPackage,
        includeDmcaAntiMetaTerms
      });
    }

    return res.json({
      success: true,
      creatorName,
      platform,
      avgViewers,
      pitchProposal: pitchText,
      timestamp: Date.now()
    });
  } catch (err: any) {
    console.error('Error in /api/marketing/creators:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to generate creator proposal.' });
  }
}
