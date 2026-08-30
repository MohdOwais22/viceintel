export type MarketingAgencySubTab = 
  | 'overview'
  | 'keywords'
  | 'meta-manager'
  | 'audit'
  | 'links'
  | 'content'
  | 'social'
  | 'graphics'
  | 'knowledge'
  | 'scheduler';

export type AgencySubTab = MarketingAgencySubTab;

export interface MarketingAgentStatus {
  id: string;
  name: string;
  role?: string;
  description?: string;
  status: 'active' | 'idle' | 'running' | 'paused';
  model: string;
  lastRun: string;
  metricsSummary?: string;
  metrics?: {
    tasksCompleted?: number;
    successRate?: number;
    avgLatencyMs?: number;
  };
  actionCount?: number;
}

export type AgentLogItem = AgentRunLog;

export type SearchIntent = 'Informational' | 'Commercial' | 'Transactional' | 'Navigational';

export interface KeywordOpportunity {
  id: string;
  keyword: string;
  searchVolume: number;
  difficulty: number; // 0 - 100
  intent: SearchIntent;
  cpc: number; // in USD
  serpScore: number; // 0 - 100
  cluster: string;
  priority: 'High' | 'Medium' | 'Low';
  potentialTraffic: number;
  competitorUrl?: string;
  notes?: string;
}

export interface SeoIssue {
  id: string;
  severity: 'Critical' | 'Warning' | 'Optimization';
  category: 'Meta & Titles' | 'Performance' | 'Schema & JSON-LD' | 'Links & Crawl' | 'Content Quality';
  title: string;
  description: string;
  recommendation: string;
  impactScore: number;
  autoFixAvailable: boolean;
  fixed?: boolean;
}

export interface SeoAuditReport {
  id: string;
  targetUrl: string;
  analyzedAt: string;
  overallScore: number;
  performanceScore: number;
  seoScore: number;
  readabilityScore: number;
  crawlStatus: 'Indexed' | 'Noindex' | 'Blocked' | 'Redirect';
  pageWordCount: number;
  metaTags: {
    title: string;
    titleLength: number;
    description: string;
    descLength: number;
    canonical: string;
    robots: string;
    openGraphImage: string;
  };
  coreWebVitals: {
    lcp: string; // e.g. "1.2s" (Good)
    fid: string; // e.g. "18ms" (Good)
    cls: string; // e.g. "0.02" (Good)
    fcp: string; // e.g. "0.8s"
    ttfb: string; // e.g. "120ms"
  };
  issues: SeoIssue[];
}

export interface InternalLinkOpportunity {
  id: string;
  sourceUrl: string;
  sourceTitle: string;
  targetUrl: string;
  targetTitle: string;
  recommendedAnchorText: string;
  contextSentence: string;
  relevanceScore: number; // 0 - 100
  priority: 'High' | 'Medium' | 'Low';
  applied?: boolean;
  appliedAt?: string;
  injectedMarkdown?: string;
  injectedHtml?: string;
}

export interface BlogPostDraft {
  id: string;
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  targetKeywords: string[];
  tone: 'Authoritative' | 'Gaming Hype' | 'Technical Guide' | 'News Analysis';
  estimatedReadTime: string;
  outline: string[];
  contentMarkdown: string;
  faqItems: { question: string; answer: string }[];
  keyTakeaways: string[];
  status: 'Draft' | 'Review' | 'Published';
  imageUrl?: string;
  category?: string;
  author?: string;
  authorRole?: string;
  authorAvatar?: string;
  modelUsed?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SocialPostItem {
  id: string;
  platform: 'bleeter_twitter' | 'snapmatic_instagram' | 'shorts_tiktok' | 'discord';
  title: string;
  content: string;
  hook: string;
  hashtags: string[];
  callToAction: string;
  visualPrompt: string;
  characterCount: number;
  predictedEngagement: string;
}

export interface BrandGraphicBrief {
  id: string;
  title: string;
  channel: 'Hero Banner' | 'Snapmatic Square' | 'Bleeter Wide' | 'YouTube Thumbnail' | 'Discord Header';
  aspectRatio: '16:9' | '1:1' | '9:16' | '4:3' | '21:9';
  dimensions: string;
  visualDescription: string;
  colorPalette: { name: string; hex: string }[];
  typographyNotes: string;
  aiGenerationPrompt: string;
  negativePrompt: string;
  status: 'Ready' | 'Generated' | 'Archived';
  createdAt: string;
  imageUrl?: string;
  subtitle?: string;
  badgeText?: string;
  ctaText?: string;
}

export interface KnowledgeDoc {
  id: string;
  title: string;
  category: 'Game Lore & City' | 'Vehicle Tuning' | 'RP Server Standards' | 'Platform Features' | 'Brand Voice';
  content: string;
  tags: string[];
  tokenCount: number;
  updatedAt: string;
  author: string;
}

export interface AgentRunLog {
  id: string;
  agentName: string;
  action: string;
  status: 'success' | 'running' | 'failed';
  timestamp: string;
  durationMs?: number;
  duration?: string;
  outputSummary?: string;
  details?: string;
}
