import { SeoKeywordPage, SEO_KEYWORD_PAGES } from '../data/seoKeywordsData';

export const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Normalizes an article title for accurate duplicate detection by:
 * - Converting to lowercase
 * - Stripping date stamps e.g. (Aug 12, 2026), (2026-08-12), [Aug 2026]
 * - Stripping generic repetitive prefixes like 'GTA 6 Midnight Intel: ', 'GTA VI Daily Report: '
 * - Stripping punctuation and non-alphanumeric noise
 */
export function normalizeTitleForDeduplication(title: string): string {
  if (!title || typeof title !== 'string') return '';
  return title
    .toLowerCase()
    .replace(/\((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4}-\d{2}-\d{2}|\d{1,2}[,\s]+\d{4}|latest|verified|update)[^)]*\)/gi, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/^gta\s*(?:6|vi)\s*(?:midnight\s*intel|daily\s*report|development\s*briefing|latest\s*news|news\s*briefing|official\s*news)?\s*[:\-–—]?\s*/gi, '')
    .replace(/^rockstar\s*games\s*updates\s*[:\-–—]?\s*/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Normalizes a URL slug for deduplication by:
 * - Converting to lowercase
 * - Stripping trailing date timestamps e.g. -2026-08-12
 * - Stripping random hash suffixes e.g. -k8s9x2-a1b2
 */
export function normalizeSlugForDeduplication(slug: string): string {
  if (!slug || typeof slug !== 'string') return '';
  return slug
    .toLowerCase()
    .replace(/-\d{4}-\d{2}-\d{2}(?:-[a-z0-9]+)?$/g, '')
    .replace(/-[a-z0-9]{6,12}-[a-z0-9]{3,6}$/g, '')
    .replace(/[^a-z0-9-]/g, '')
    .trim();
}

/**
 * Normalizes a section heading or FAQ question for comparison
 */
export function normalizeHeading(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/^\d+[\.\)]\s*/, '') // strip leading numbers like "1. "
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Extracts key GTA 6 entity topic cluster keys to detect closely related articles.
 * e.g. "taketwo-earnings", "trailer-2", "rage9-physics", "pc-release", "leonida-map", "gellhorn", "preorder"
 */
export function extractTopicClusterKey(article: any): string | null {
  if (!article) return null;
  const combinedText = `${article.title || ''} ${article.h1 || ''} ${article.slug || ''} ${article.summary || ''} ${(article.keywords || []).join(' ')}`.toLowerCase();

  const clusterRules: { key: string; patterns: RegExp[] }[] = [
    {
      key: 'taketwo-earnings-roadmap',
      patterns: [/take[\s-]?two/i, /earnings/i, /financial\s*(?:report|briefing)/i, /strauss\s*zelnick/i, /fiscal\s*year/i]
    },
    {
      key: 'trailer-2-reveal',
      patterns: [/trailer\s*2/i, /second\s*trailer/i, /reveal\s*trailer/i, /promotional\s*(?:asset|teaser)/i]
    },
    {
      key: 'rage9-engine-physics',
      patterns: [/rage\s*9/i, /engine\s*tech/i, /hurricane\s*physics/i, /water\s*physics/i, /dynamic\s*weather/i, /volumetric/i]
    },
    {
      key: 'pc-system-requirements-specs',
      patterns: [/system\s*requirements/i, /pc\s*specs/i, /rtx\s*\d{4}/i, /directx/i, /ram\s*specs/i, /pc\s*port/i]
    },
    {
      key: 'preorder-editions-pricing',
      patterns: [/pre[\s-]?order/i, /collector(?:'s)?\s*edition/i, /steelbook/i, /pricing\s*tier/i, /standard\s*edition/i]
    },
    {
      key: 'lucia-jason-storyline',
      patterns: [/lucia\s*(?:and|&)\s*jason/i, /protagonists/i, /story\s*campaign/i, /dual\s*character/i]
    },
    {
      key: 'leonida-map-gellhorn-keys',
      patterns: [/leonida\s*map/i, /port\s*gellhorn/i, /gator\s*keys/i, /everglades/i, /vice\s*city\s*metro/i, /map\s*size/i]
    },
    {
      key: 'soundtrack-radio-stations',
      patterns: [/radio\s*station/i, /soundtrack/i, /licensed\s*music/i, /dj\s*hosts/i]
    },
    {
      key: 'vehicle-customization-handling',
      patterns: [/handling\.meta/i, /vehicle\s*customization/i, /tuning\s*garage/i, /supercar\s*physics/i]
    },
    {
      key: 'weapons-ttk-arsenal',
      patterns: [/weapon\s*arsenal/i, /gunplay/i, /weapon\s*wheel/i, /tactical\s*carbine/i]
    },
    {
      key: 'heists-businesses-economy',
      patterns: [/business\s*empires/i, /heist\s*mechanics/i, /money\s*making/i, /nightclubs/i, /real\s*estate/i]
    }
  ];

  for (const rule of clusterRules) {
    let matchCount = 0;
    for (const pattern of rule.patterns) {
      if (pattern.test(combinedText)) {
        matchCount++;
      }
    }
    if (matchCount >= 2) {
      return rule.key;
    }
  }

  return null;
}

/**
 * Calculates token-based word similarity (Jaccard similarity) between two title strings
 */
export function calculateTitleSimilarity(titleA: string, titleB: string): number {
  if (!titleA || !titleB) return 0;
  const stopWords = new Set(['gta', 'vi', 'gta6', 'gtavi', 'rockstar', 'games', 'and', 'the', 'in', 'of', 'for', 'to', 'a', 'with', 'new', 'update', 'latest', 'news']);
  
  const getTokens = (t: string) => {
    return new Set(
      t.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.has(word))
    );
  };

  const tokensA = getTokens(titleA);
  const tokensB = getTokens(titleB);

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersectionCount = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersectionCount++;
  }

  const unionSize = new Set([...tokensA, ...tokensB]).size;
  return unionSize > 0 ? intersectionCount / unionSize : 0;
}

/**
 * Evaluates whether two articles share identical or closely related news subjects
 */
export function areArticlesRelated(articleA: any, articleB: any): boolean {
  if (!articleA || !articleB) return false;
  if (articleA.id === articleB.id) return true;

  // 1. Exact or normalized title match
  const normTitleA = normalizeTitleForDeduplication(articleA.title || articleA.h1 || '');
  const normTitleB = normalizeTitleForDeduplication(articleB.title || articleB.h1 || '');
  if (normTitleA && normTitleB && normTitleA === normTitleB) return true;

  // 2. Normalized slug match
  const normSlugA = normalizeSlugForDeduplication(articleA.slug || '');
  const normSlugB = normalizeSlugForDeduplication(articleB.slug || '');
  if (normSlugA && normSlugB && normSlugA === normSlugB) return true;

  // 3. High title word overlap (Jaccard similarity >= 0.55)
  const titleSim = calculateTitleSimilarity(articleA.title || articleA.h1 || '', articleB.title || articleB.h1 || '');
  if (titleSim >= 0.55) return true;

  // 4. Matching Topic Cluster Key + Same Category
  const clusterA = extractTopicClusterKey(articleA);
  const clusterB = extractTopicClusterKey(articleB);
  if (clusterA && clusterB && clusterA === clusterB) {
    if (articleA.category === articleB.category || titleSim >= 0.35) {
      return true;
    }
  }

  return false;
}

/**
 * Intelligently merges two related articles into a single consolidated, richer intel report.
 */
export function mergeTwoArticles(primary: any, secondary: any): any {
  if (!primary) return secondary;
  if (!secondary) return primary;

  // Resolve dates: keep the latest timestamp
  const datePrimary = parseArticleDate(primary);
  const dateSecondary = parseArticleDate(secondary);
  const latestDateIso = dateSecondary > datePrimary ? (secondary.lastUpdated || secondary.updatedAt) : (primary.lastUpdated || primary.updatedAt);
  const latestDateStr = latestDateIso ? (typeof latestDateIso === 'string' && latestDateIso.includes('T') ? latestDateIso.split('T')[0] : latestDateIso) : primary.lastUpdated;

  // Prefer the longer/more detailed title or update with merged indicators
  const title = (primary.title && primary.title.length >= (secondary.title?.length || 0)) ? primary.title : secondary.title;
  const h1 = (primary.h1 && primary.h1.length >= (secondary.h1?.length || 0)) ? primary.h1 : secondary.h1;
  const metaTitle = primary.metaTitle || secondary.metaTitle || title;
  const metaDescription = (primary.metaDescription && primary.metaDescription.length >= (secondary.metaDescription?.length || 0)) ? primary.metaDescription : secondary.metaDescription;
  
  // Combine summaries if secondary has unique sentences
  let summary = primary.summary || secondary.summary || '';
  if (secondary.summary && !summary.includes(secondary.summary.slice(0, 30))) {
    summary = `${summary} ${secondary.summary}`.trim();
  }

  // Merge Keywords (unique set)
  const allKeywords = Array.from(new Set([
    ...(Array.isArray(primary.keywords) ? primary.keywords : []),
    ...(Array.isArray(secondary.keywords) ? secondary.keywords : [])
  ])).filter(Boolean);

  // Merge Content Sections:
  // If a section with matching heading exists, merge body paragraphs and bullet points without duplicates;
  // otherwise append new distinct sections.
  const mergedSections: any[] = [];
  const existingSectionMap = new Map<string, any>();

  const primarySections = Array.isArray(primary.contentSections) ? primary.contentSections : [];
  const secondarySections = Array.isArray(secondary.contentSections) ? secondary.contentSections : [];

  for (const sec of primarySections) {
    if (!sec || !sec.heading) continue;
    const normH = normalizeHeading(sec.heading);
    const cloned = {
      heading: sec.heading,
      body: Array.isArray(sec.body) ? [...sec.body] : [],
      bulletPoints: Array.isArray(sec.bulletPoints) ? [...sec.bulletPoints] : [],
      tableData: sec.tableData || undefined
    };
    mergedSections.push(cloned);
    existingSectionMap.set(normH, cloned);
  }

  for (const sec of secondarySections) {
    if (!sec || !sec.heading) continue;
    const normH = normalizeHeading(sec.heading);
    if (existingSectionMap.has(normH)) {
      const targetSec = existingSectionMap.get(normH);
      // Merge unique body paragraphs
      if (Array.isArray(sec.body)) {
        for (const p of sec.body) {
          if (p && typeof p === 'string' && !targetSec.body.some((existP: string) => existP.includes(p.slice(0, 30)))) {
            targetSec.body.push(p);
          }
        }
      }
      // Merge unique bullet points
      if (Array.isArray(sec.bulletPoints)) {
        for (const bp of sec.bulletPoints) {
          if (bp && typeof bp === 'string' && !targetSec.bulletPoints.some((existBp: string) => existBp.includes(bp.slice(0, 25)))) {
            targetSec.bulletPoints.push(bp);
          }
        }
      }
      if (!targetSec.tableData && sec.tableData) {
        targetSec.tableData = sec.tableData;
      }
    } else {
      // Append distinct section
      mergedSections.push({
        heading: sec.heading,
        body: Array.isArray(sec.body) ? [...sec.body] : [],
        bulletPoints: Array.isArray(sec.bulletPoints) ? [...sec.bulletPoints] : [],
        tableData: sec.tableData || undefined
      });
    }
  }

  // Merge FAQs (deduplicated by normalized question)
  const mergedFaqs: any[] = [];
  const seenFaqQuestions = new Set<string>();

  const primaryFaqs = Array.isArray(primary.faqs) ? primary.faqs : [];
  const secondaryFaqs = Array.isArray(secondary.faqs) ? secondary.faqs : [];

  for (const f of [...primaryFaqs, ...secondaryFaqs]) {
    if (!f || !f.question) continue;
    const normQ = normalizeHeading(f.question);
    if (!seenFaqQuestions.has(normQ)) {
      seenFaqQuestions.add(normQ);
      mergedFaqs.push(f);
    }
  }

  // Merge Confirmed Assets (vehicles, weapons, mapLocations)
  const mergedAssets: any = {
    vehicles: [],
    weapons: [],
    mapLocations: []
  };

  const getAssets = (art: any) => art.confirmedAssets || {};
  const aVeh = [...(getAssets(primary).vehicles || []), ...(getAssets(secondary).vehicles || [])];
  const aWep = [...(getAssets(primary).weapons || []), ...(getAssets(secondary).weapons || [])];
  const aMap = [...(getAssets(primary).mapLocations || []), ...(getAssets(secondary).mapLocations || [])];

  const seenV = new Set<string>();
  for (const v of aVeh) {
    const k = (v?.name || v?.id || '').toLowerCase();
    if (k && !seenV.has(k)) { seenV.add(k); mergedAssets.vehicles.push(v); }
  }

  const seenW = new Set<string>();
  for (const w of aWep) {
    const k = (w?.name || w?.id || '').toLowerCase();
    if (k && !seenW.has(k)) { seenW.add(k); mergedAssets.weapons.push(w); }
  }

  const seenM = new Set<string>();
  for (const m of aMap) {
    const k = (m?.name || m?.id || '').toLowerCase();
    if (k && !seenM.has(k)) { seenM.add(k); mergedAssets.mapLocations.push(m); }
  }

  const prevMergedCount = primary.mergedCount || 1;
  const mergedIds = Array.from(new Set([
    ...(primary.mergedArticleIds || [primary.id]),
    ...(secondary.mergedArticleIds || [secondary.id])
  ]));

  return {
    ...primary,
    title,
    h1,
    metaTitle,
    metaDescription,
    summary,
    lastUpdated: latestDateStr,
    badgeText: primary.isPillar ? primary.badgeText : (primary.badgeText || '⚡ UPDATED INTEL'),
    keywords: allKeywords,
    contentSections: mergedSections.length > 0 ? mergedSections : primarySections,
    faqs: mergedFaqs,
    confirmedAssets: (mergedAssets.vehicles.length || mergedAssets.weapons.length || mergedAssets.mapLocations.length) ? mergedAssets : primary.confirmedAssets,
    isMerged: true,
    mergedCount: prevMergedCount + 1,
    mergedArticleIds: mergedIds,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Parses article date into milliseconds epoch
 */
export function parseArticleDate(article: any): number {
  if (!article) return 0;
  
  // Direct ISO strings or timestamps
  if (article.updatedAt) {
    const t = new Date(article.updatedAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (article.lastUpdated) {
    const t = new Date(article.lastUpdated).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (article.createdAt) {
    const t = new Date(article.createdAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }

  // Extract from ID or Slug e.g. "2026-08-18" or "2026-07-20"
  const dateMatch = (article.id || article.slug || '').match(/(\d{4})-(\d{2})-(\d{2})/);
  if (dateMatch) {
    const parsed = new Date(`${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`).getTime();
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  // Default fallback: recent date
  return Date.now() - (7 * 24 * 60 * 60 * 1000);
}

/**
 * Checks whether an article is older than 30 days.
 * Never flags foundational pillar guides (starts with 'page-gta6-' or marked isPillar).
 */
export function isArticleOlderThan30Days(article: any, referenceTimeMs: number = Date.now()): boolean {
  if (!article) return false;

  // Foundational Pillar Guides are permanent evergreen documents
  if (article.id && (article.id.startsWith('page-gta6-') || article.isPillar === true)) {
    return false;
  }

  // Articles explicitly marked as evergreen
  if (article.category === 'Cheats & Codes' || article.badgeText?.includes('Trending')) {
    if (article.id?.startsWith('page-gta6-')) return false;
  }

  const articleTime = parseArticleDate(article);
  if (!articleTime || articleTime <= 0) return false;

  const ageMs = referenceTimeMs - articleTime;
  return ageMs > THIRTY_DAYS_MS;
}

export interface DeduplicationAndMergeResult {
  finalArticles: SeoKeywordPage[];
  mergedArticlesCount: number;
  prunedArticlesCount: number;
  retainedArticlesCount: number;
  mergedPairs: { targetId: string; targetTitle: string; mergedSourceId: string; sourceTitle: string }[];
  prunedArticles: { id: string; title: string; ageDays: number }[];
}

/**
 * Master Deduplication, Clustering, Merging & 30-Day Retention Pruning Engine.
 *
 * 1. Preserves foundational pillar guides.
 * 2. Prunes dynamic crawled news older than 30 days to keep the index fresh.
 * 3. Clusters and merges articles with identical or closely related topics into unified deep-dives.
 * 4. Orders news chronologically while maintaining search ranking signals.
 */
export function deduplicateKnowledgeArticles(
  pillarGuides: SeoKeywordPage[],
  incomingArticles: any[] = [],
  options: { pruneOlderThan30Days?: boolean; referenceTimeMs?: number } = {}
): SeoKeywordPage[] {
  const result = processPseoArticlesWithMergeAndPrune(pillarGuides, incomingArticles, options);
  return result.finalArticles;
}

/**
 * Detailed processor returning full operation telemetry (merged count, pruned count, retained count).
 */
export function processPseoArticlesWithMergeAndPrune(
  pillarGuides: SeoKeywordPage[],
  incomingArticles: any[] = [],
  options: { pruneOlderThan30Days?: boolean; referenceTimeMs?: number } = {}
): DeduplicationAndMergeResult {
  const { pruneOlderThan30Days = true, referenceTimeMs = Date.now() } = options;

  const finalMap = new Map<string, any>();
  const mergedPairs: { targetId: string; targetTitle: string; mergedSourceId: string; sourceTitle: string }[] = [];
  const prunedArticles: { id: string; title: string; ageDays: number }[] = [];

  // 1. Register foundational pillar guides
  for (const guide of pillarGuides) {
    if (!guide || !guide.id) continue;
    finalMap.set(guide.id, { ...guide, isPillar: true });
  }

  // 2. Process incoming dynamic articles
  for (const rawArticle of incomingArticles) {
    if (!rawArticle || !rawArticle.id) continue;

    // Check if older than 30 days
    if (pruneOlderThan30Days && isArticleOlderThan30Days(rawArticle, referenceTimeMs)) {
      const ageDays = Math.round((referenceTimeMs - parseArticleDate(rawArticle)) / (24 * 60 * 60 * 1000));
      prunedArticles.push({
        id: rawArticle.id,
        title: rawArticle.title || rawArticle.h1 || rawArticle.id,
        ageDays
      });
      continue; // Skip expired news article
    }

    // Exact ID match: update existing
    if (finalMap.has(rawArticle.id)) {
      const existing = finalMap.get(rawArticle.id);
      finalMap.set(rawArticle.id, { ...existing, ...rawArticle });
      continue;
    }

    // Search for related/similar existing articles to merge
    let foundRelatedKey: string | null = null;
    for (const [existingId, existingArticle] of finalMap.entries()) {
      if (areArticlesRelated(existingArticle, rawArticle)) {
        foundRelatedKey = existingId;
        break;
      }
    }

    if (foundRelatedKey) {
      const target = finalMap.get(foundRelatedKey);
      const merged = mergeTwoArticles(target, rawArticle);
      finalMap.set(foundRelatedKey, merged);
      mergedPairs.push({
        targetId: foundRelatedKey,
        targetTitle: target.title || target.h1 || foundRelatedKey,
        mergedSourceId: rawArticle.id,
        sourceTitle: rawArticle.title || rawArticle.h1 || rawArticle.id
      });
    } else {
      finalMap.set(rawArticle.id, rawArticle);
    }
  }

  // 3. Separate pillar guides and news articles, sort chronologically
  const pillarList: SeoKeywordPage[] = [];
  const newsList: SeoKeywordPage[] = [];

  for (const art of finalMap.values()) {
    if (art.id && (art.id.startsWith('page-gta6-') || art.isPillar === true || art.badgeText === '🏎️ Fast Cars' || art.badgeText === '🔫 Gun Benchmarks')) {
      pillarList.push(art);
    } else {
      newsList.push(art);
    }
  }

  newsList.sort((a, b) => {
    const timeA = parseArticleDate(a);
    const timeB = parseArticleDate(b);
    return timeB - timeA;
  });

  const finalArticles = [...newsList, ...pillarList];

  return {
    finalArticles,
    mergedArticlesCount: mergedPairs.length,
    prunedArticlesCount: prunedArticles.length,
    retainedArticlesCount: finalArticles.length,
    mergedPairs,
    prunedArticles
  };
}
