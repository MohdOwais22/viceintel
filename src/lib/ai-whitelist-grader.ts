/**
 * @file ai-whitelist-grader.ts
 * AI Whitelist Lore & Rule Grader
 * Evaluates GTA RP whitelist applicant answers for Metagaming, Powergaming, Fail RP,
 * New Life Rule (NLR) comprehension, and character lore depth.
 */

import { GoogleGenAI } from '@google/genai';
import { AiWhitelistAudit, WhitelistQuestion } from '../types';

export interface WhitelistGradingInput {
  answers: Record<string, string>;
  questions?: WhitelistQuestion[];
  serverName?: string;
  applicantUsername?: string;
  discordTag?: string;
}

/**
 * Detects random keysmashing, non-meaningful text, gibberish, or extreme lack of effort.
 */
export function detectGibberishOrLowQuality(answers: Record<string, string>): {
  isGibberish: boolean;
  reason?: string;
} {
  const values = Object.values(answers).map(v => (v || '').trim()).filter(Boolean);
  const combinedText = values.join(' ').toLowerCase();

  const totalChars = combinedText.length;
  const words = combinedText.split(/\s+/).filter(w => w.length > 0);
  const totalWordCount = words.length;

  if (totalChars < 25 || totalWordCount < 5) {
    return {
      isGibberish: true,
      reason: 'Extremely short, empty, or incomplete submission.'
    };
  }

  let nonsenseWordsCount = 0;
  let keysmashCount = 0;

  const COMMON_ENGLISH_WORDS = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not',
    'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from',
    'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would',
    'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which',
    'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
    'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see',
    'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think',
    'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well',
    'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most',
    'us', 'is', 'was', 'are', 'am', 'been', 'had', 'has', 'were', 'character', 'roleplay',
    'city', 'vice', 'server', 'rules', 'police', 'car', 'life', 'money', 'friend',
    'help', 'dead', 'kill', 'fear', 'cops', 'shoot', 'getaway', 'job', 'rp', 'gta',
    'age', 'name', 'mateo', 'lucia', 'jason', 'years', 'old', 'street', 'drive',
    'club', 'business', 'gun', 'police', 'officer', 'hospital', 'comply', 'hands'
  ]);

  let recognizedWordCount = 0;

  for (const word of words) {
    const cleanWord = word.replace(/[^a-z]/g, '');
    if (!cleanWord) continue;

    // Check for 4+ consecutive identical characters (e.g. "aaaaaa", "zzzzzz")
    if (/(.)\1{3,}/.test(cleanWord)) {
      keysmashCount++;
    }

    // Check for long words without vowels (e.g. "asdfghjk", "qwrtpsdf", "zxcvbnm")
    if (cleanWord.length >= 5 && !/[aeiouy]/.test(cleanWord)) {
      nonsenseWordsCount++;
    }

    // Check common English word list
    if (COMMON_ENGLISH_WORDS.has(cleanWord) || cleanWord.length <= 2) {
      recognizedWordCount++;
    }
  }

  const recognizedRatio = recognizedWordCount / Math.max(1, words.length);

  if (keysmashCount >= 1 || nonsenseWordsCount >= 2) {
    return {
      isGibberish: true,
      reason: 'Detected random key-mashing or nonsense character strings.'
    };
  }

  if (words.length >= 8 && recognizedRatio < 0.25) {
    return {
      isGibberish: true,
      reason: 'Answers consist of non-meaningful words or low-coherence random text.'
    };
  }

  const uniqueWords = new Set(words);
  if (words.length >= 10 && uniqueWords.size <= 3) {
    return {
      isGibberish: true,
      reason: 'Detected repetitive word or phrase spam.'
    };
  }

  return { isGibberish: false };
}

/**
 * Heuristic fallback evaluation when Gemini API is offline or unconfigured
 */
export function evaluateHeuristics(
  answers: Record<string, string>,
  questions?: WhitelistQuestion[]
): AiWhitelistAudit {
  const gibberishCheck = detectGibberishOrLowQuality(answers);
  if (gibberishCheck.isGibberish) {
    return {
      score: 15,
      loreScore: 10,
      rulesScore: 15,
      flags: [
        'CRITICAL: Non-meaningful / random text detected.',
        gibberishCheck.reason || 'Submission failed baseline roleplay quality inspection.'
      ],
      summary: `Application rejected (Score: 15/100): The submitted answers contain random letters, key-mashing, or non-meaningful text. Please write a coherent backstory and scenario answer to re-apply.`,
      recommendation: 'Flagged',
      analyzedAt: new Date().toISOString(),
      modelUsed: 'heuristic-engine-v2'
    };
  }

  const flags: string[] = [];
  let loreScore = 70;
  let rulesScore = 75;

  const combinedText = Object.entries(answers)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n\n')
    .toLowerCase();

  const totalWordCount = Object.values(answers).reduce(
    (acc, val) => acc + (val ? val.trim().split(/\s+/).length : 0),
    0
  );

  // 1. Check length & depth
  if (totalWordCount < 60) {
    flags.push('Critically low word count (under 60 words total)');
    loreScore -= 30;
  } else if (totalWordCount < 140) {
    flags.push('Relatively brief responses; limited character motivation');
    loreScore -= 15;
  } else if (totalWordCount > 300) {
    loreScore = Math.min(98, loreScore + 18);
  }

  // 2. Powergaming check
  const powergamingKeywords = [
    'never miss', 'invincible', 'super soldier', 'immortal', 'dodge bullets',
    'knows martial arts and kills everyone', 'forces them to give money', 'undefeated'
  ];
  if (powergamingKeywords.some(kw => combinedText.includes(kw))) {
    flags.push('Potential Powergaming / Godmoding traits detected in backstory');
    rulesScore -= 35;
  }

  // 3. Metagaming check
  const metagamingKeywords = [
    'saw on stream', 'stream snipe', 'discord call in game', 'voice chat out of character',
    'saw their name tag', 'checked their steam'
  ];
  if (metagamingKeywords.some(kw => combinedText.includes(kw))) {
    flags.push('Potential Metagaming indicators (using OOC info in-character)');
    rulesScore -= 40;
  }

  // 4. NLR (New Life Rule) check
  const nlrMentions = ['new life', 'forget', 'memory', 'hospital', 'respawn', 'nlr'];
  const hasNlrContext = nlrMentions.some(kw => combinedText.includes(kw));
  if (!hasNlrContext && totalWordCount > 100) {
    // only flag if extensive questions were asked without NLR understanding
    if (combinedText.includes('die') || combinedText.includes('killed') || combinedText.includes('death')) {
      if (!combinedText.includes('forget') && !combinedText.includes('new life')) {
        flags.push('Vague or absent New Life Rule (NLR) comprehension upon character death');
        rulesScore -= 15;
      }
    }
  }

  // 5. Fail RP check
  const failRpKeywords = ['jump off mountain without pain', 'ram car at 200mph and walk away', 'no fear', 'dont fear cops'];
  if (failRpKeywords.some(kw => combinedText.includes(kw))) {
    flags.push('Fail RP / Value of Life (No Fear RP) violation indicators');
    rulesScore -= 30;
  }

  // Calculate composite score
  loreScore = Math.max(10, Math.min(100, loreScore));
  rulesScore = Math.max(10, Math.min(100, rulesScore));
  const score = Math.round((loreScore * 0.45) + (rulesScore * 0.55));

  let recommendation: 'Fast-Track' | 'Standard Review' | 'Flagged' = 'Standard Review';
  if (score >= 85 && flags.length === 0) {
    recommendation = 'Fast-Track';
  } else if (score < 60 || flags.length >= 2) {
    recommendation = 'Flagged';
  }

  let summary = '';
  if (recommendation === 'Fast-Track') {
    summary = `Applicant demonstrates strong RP maturity (Score: ${score}/100) with detailed backstory depth, realistic character flaws, and solid understanding of NLR and Powergaming boundaries.`;
  } else if (recommendation === 'Flagged') {
    summary = `Application flagged (Score: ${score}/100) due to ${flags.length} potential rule violations or insufficient character depth. Staff manual intervention recommended before whitelist approval.`;
  } else {
    summary = `Application meets baseline standards (Score: ${score}/100). Backstory is coherent with acceptable rule knowledge; standard staff review queue recommended.`;
  }

  return {
    score,
    loreScore,
    rulesScore,
    flags,
    summary,
    recommendation,
    analyzedAt: new Date().toISOString(),
    modelUsed: 'heuristic-engine-v2'
  };
}

/**
 * Grades whitelist application answers using Gemini 3.7 Flash or heuristic fallback
 */
export async function gradeWhitelistApplication(
  input: WhitelistGradingInput
): Promise<AiWhitelistAudit> {
  const { answers, questions = [], serverName = 'Vice City Life RP', applicantUsername = 'Applicant' } = input;

  // Immediate gibberish / keysmash / non-meaningful text rejection
  const gibberishCheck = detectGibberishOrLowQuality(answers);
  if (gibberishCheck.isGibberish) {
    return evaluateHeuristics(answers, questions);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return evaluateHeuristics(answers, questions);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    // Format Q&A pairs for prompt
    const qaFormatted = Object.entries(answers).map(([key, answer]) => {
      const qObj = questions.find(q => q.id === key || q.question === key);
      const questionText = qObj ? qObj.question : key;
      return `Q: ${questionText}\nA: ${answer}`;
    }).join('\n\n');

    const prompt = `You are a Senior Roleplay Staff Lead and Whitelist Auditor for the GTA VI FiveM/VMP server "${serverName}".
Evaluate the following player's whitelist application for roleplay quality, server safety, and rule compliance.

### APPLICATION DETAILS:
Applicant GamerTag: ${applicantUsername}
Q&A SUBMISSIONS:
${qaFormatted}

### EVALUATION CRITERIA:
1. RULE COMPLIANCE & SAFETY:
   - CRITICAL: If the applicant submits random typing, keysmashing (e.g. 'asdfghjkl', 'qwerty'), nonsense words, repetitive spam, or unreadable non-meaningful text, you MUST give a score below 25 (e.g. 15), set recommendation to 'Flagged', add a flag 'Non-meaningful or random text detected', and summarize why it was rejected.
   - Powergaming (acting invincibly, forcing actions on others without allowing counter-play).
   - Metagaming (using Out-Of-Character information in In-Character situations).
   - Fail RP / Value of Life (Fear RP, acting unrealistically suicidal or ignoring pain/injuries).
   - New Life Rule (NLR) (remembering killer/events after respawning).
2. CHARACTER LORE & DEPTH (0-100):
   - Motivations, origin, flaws, occupation aspirations in Vice City / Leonida.
   - Avoidance of cliché '1 man army' / 'edgy ex-CIA assassin' tropes.
3. EFFORT & COHERENCE (0-100).

### OUTPUT REQUIREMENT:
Respond ONLY with a valid, clean JSON object matching this exact TypeScript schema:
{
  "score": number (0 to 100 integer overall),
  "loreScore": number (0 to 100 integer for backstory),
  "rulesScore": number (0 to 100 integer for rule mastery),
  "flags": string[] (list of any rule concerns or red flags, empty array if none),
  "summary": string (concise 2-3 sentence staff verdict highlighting strengths and weaknesses),
  "recommendation": "Fast-Track" | "Standard Review" | "Flagged"
}

Recommendation rules:
- "Fast-Track": Score >= 85 and zero serious red flags.
- "Standard Review": Score 60-84 and minor areas to clarify.
- "Flagged": Score < 60 or serious Powergaming/Metagaming/Trolling/Random text flags.`;

    const modelsToTry = ['gemini-3.7-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.1-pro-preview'];
    let responseText = '';
    let usedModel = 'gemini-3.7-flash';

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        const txt = response.text?.trim() || '';
        if (txt) {
          responseText = txt;
          usedModel = modelName;
          break;
        }
      } catch (mErr: any) {
        const errMsg = String(mErr?.message || mErr);
        const isRateLimitOrQuota = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota') || errMsg.includes('rate limit');
        if (isRateLimitOrQuota) {
          console.info(`[AI Whitelist Grader] Model ${modelName} reached rate/quota limit. Cascading to next model...`);
          await new Promise((r) => setTimeout(r, 300));
        } else {
          const isTransient = errMsg.includes('503') || errMsg.includes('UNAVAILABLE');
          if (isTransient) {
            await new Promise((r) => setTimeout(r, 250));
          }
          console.info(`[AI Whitelist Grader] Model ${modelName} busy, cascading to fallback...`);
        }
      }
    }

    if (!responseText) {
      return evaluateHeuristics(answers, questions);
    }

    try {
      const parsed = JSON.parse(responseText);
      const score = typeof parsed.score === 'number' ? Math.max(0, Math.min(100, Math.round(parsed.score))) : 75;
      const flags = Array.isArray(parsed.flags) ? parsed.flags.map(String) : [];
      const summary = parsed.summary || 'Application graded by AI Whitelist Auditor.';
      
      let recommendation: 'Fast-Track' | 'Standard Review' | 'Flagged' = 'Standard Review';
      if (parsed.recommendation === 'Fast-Track' || parsed.recommendation === 'Flagged') {
        recommendation = parsed.recommendation;
      } else if (score >= 85 && flags.length === 0) {
        recommendation = 'Fast-Track';
      } else if (score < 60 || flags.length >= 2) {
        recommendation = 'Flagged';
      }

      return {
        score,
        loreScore: typeof parsed.loreScore === 'number' ? parsed.loreScore : score,
        rulesScore: typeof parsed.rulesScore === 'number' ? parsed.rulesScore : score,
        flags,
        summary,
        recommendation,
        analyzedAt: new Date().toISOString(),
        modelUsed: usedModel
      };
    } catch (parseErr) {
      console.warn('[AI Whitelist Grader] JSON parsing failed, using heuristic analysis:', parseErr);
      return evaluateHeuristics(answers, questions);
    }
  } catch (err: any) {
    console.error('[AI Whitelist Grader] Gemini API error, falling back to heuristics:', err);
    return evaluateHeuristics(answers, questions);
  }
}
