import { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { generateViralVideoBlueprint } from '../../../lib/agency-marketing-engine';

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

export async function handleScriptsRoute(req: Request, res: Response) {
  try {
    const {
      topic = 'Secret Everglades Radar Glitch & Fast Handling Meta',
      serverName = 'Vice City Roleplay',
      vibe = 'High-Energy Phonk / Synthwave',
      platform = 'TikTok'
    } = req.body || {};

    const ai = getGemini();

    let scriptBlueprint = null;

    if (ai) {
      const prompt = `Generate a structured 9:16 TikTok / YouTube Shorts viral production blueprint for a gaming campaign.
Topic: ${topic}
Server Name: ${serverName}
Target Platform: ${platform}
Audio Vibe: ${vibe}

Respond strictly with a JSON object:
{
  "hook": "0-3s high retention psychological trigger text",
  "retentionFormula": "formula description",
  "targetPlatform": "${platform}",
  "durationSeconds": 30,
  "storyboard": [
    {"time": "0:00 - 0:03", "visual": "visual direction", "audio": "voiceover text", "textOnScreen": "on-screen caption"},
    {"time": "0:03 - 0:15", "visual": "visual direction", "audio": "voiceover text", "textOnScreen": "on-screen caption"},
    {"time": "0:15 - 0:25", "visual": "visual direction", "audio": "voiceover text", "textOnScreen": "on-screen caption"},
    {"time": "0:25 - 0:30", "visual": "visual direction", "audio": "voiceover text", "textOnScreen": "on-screen caption"}
  ],
  "hashtags": ["#GTA6", "#FiveM", "#ViceCity", "#GTA6Leaks"],
  "cta": "clear call to action instruction",
  "recommendedAudio": "recommended trending sound"
}`;

      const modelsToTry = ['gemini-3.7-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.1-pro-preview'];
      for (const modelName of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt
          });

          if (response && response.text) {
            const jsonText = response.text.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(jsonText);
            scriptBlueprint = {
              id: `script_${Date.now()}`,
              vibe,
              ...parsed
            };
            break;
          }
        } catch (geminiErr: any) {
          const errMsg = String(geminiErr?.message || geminiErr);
          const isRateLimitOrQuota = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota') || errMsg.includes('rate limit');
          if (isRateLimitOrQuota) {
            console.warn(`[Marketing Scripts] Model ${modelName} reached rate/quota limit. Downgrading to next model...`);
            await new Promise((r) => setTimeout(r, 400));
          } else {
            console.log(`[Marketing Scripts] Model ${modelName} unavailable, trying fallback...`);
          }
        }
      }
    }

    if (!scriptBlueprint) {
      scriptBlueprint = generateViralVideoBlueprint({
        topic,
        serverName,
        vibe,
        platform: platform as any
      });
    }

    return res.json({
      success: true,
      script: scriptBlueprint,
      timestamp: Date.now()
    });
  } catch (err: any) {
    console.error('Error in /api/marketing/scripts:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to generate video script.' });
  }
}
