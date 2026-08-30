// Content Moderation & Phishing Protection Utility for Vice City Central

// List of trusted domain patterns
const TRUSTED_DOMAINS = [
  'rockstargames.com',
  'youtube.com',
  'youtu.be',
  'twitter.com',
  'x.com',
  'twitch.tv',
  'discord.gg',
  'reddit.com',
  'wikipedia.org',
  'gtagames.nl',
  'fandom.com'
];

// List of prohibited adult, explicit, and phishing keyword patterns
const ADULT_EXPLICIT_KEYWORDS = [
  'porn', 'xxx', 'hentai', 'onlyfans', 'nsfw', 'naked', 'sex', 'xvideos', 'pornhub',
  'erotic', 'adult-only', 'stripchat', 'camgirl', 'escort', 'camster'
];

const PHISHING_SCAM_PATTERNS = [
  'free-gta-money',
  'shark-card-generator',
  'free-gta6-key',
  'discord-nitro-claim',
  'discord-gift-login',
  'free-shark-cards',
  'rockstar-verify-account',
  'steam-gift-card-claim',
  'free-robux',
  'gta-hacks-download',
  'mod-menu-keygen'
];

const SUSPICIOUS_TLDS = ['.xyz', '.top', '.click', '.zip', '.mov', '.kim', '.gq', '.cf', '.tk', '.ml', '.ga'];

export interface ContentValidationResult {
  isValid: boolean;
  reason?: string;
  isFlagged?: boolean;
}

export function validateMessageContent(text: string): ContentValidationResult {
  if (!text) return { isValid: true };

  const lower = text.toLowerCase();

  // 1. Check for explicit adult keywords
  for (const kw of ADULT_EXPLICIT_KEYWORDS) {
    // Word boundary check or substring match for clear keywords
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    if (regex.test(lower)) {
      return {
        isValid: false,
        reason: 'Message contains prohibited adult, explicit, or NSFW content.'
      };
    }
  }

  // 2. Check for phishing scam patterns
  for (const pattern of PHISHING_SCAM_PATTERNS) {
    if (lower.includes(pattern)) {
      return {
        isValid: false,
        reason: 'Message blocked: Contains known phishing or scam URL pattern.'
      };
    }
  }

  // 3. Check for raw IP address URLs (e.g. http://123.45.67.89/login)
  if (/https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/i.test(text)) {
    return {
      isValid: false,
      reason: 'Message blocked: Direct IP address URLs are restricted to prevent phishing.'
    };
  }

  // 4. Check for suspicious TLDs in links
  const urlMatches = text.match(/(https?:\/\/[^\s]+|www\.[^\s]+)/gi) || [];
  for (const urlStr of urlMatches) {
    for (const tld of SUSPICIOUS_TLDS) {
      if (urlStr.toLowerCase().includes(tld)) {
        return {
          isValid: true,
          isFlagged: true,
          reason: 'Contains unverified domain extension.'
        };
      }
    }
  }

  return { isValid: true };
}

export interface DomainSafetyInfo {
  domain: string;
  fullUrl: string;
  category: 'trusted' | 'external' | 'suspicious';
  categoryLabel: string;
  badgeColor: string;
}

export function getDomainSafetyInfo(rawUrl: string): DomainSafetyInfo {
  let href = rawUrl.trim();
  if (/^www\./i.test(href)) {
    href = `https://${href}`;
  }

  let domain = href;
  try {
    const parsed = new URL(href);
    domain = parsed.hostname.toLowerCase();
  } catch {
    domain = href.replace(/^https?:\/\//i, '').split('/')[0].toLowerCase();
  }

  const isTrusted = TRUSTED_DOMAINS.some(d => domain === d || domain.endsWith(`.${d}`));
  const isSuspicious = SUSPICIOUS_TLDS.some(tld => domain.endsWith(tld)) ||
    PHISHING_SCAM_PATTERNS.some(p => href.toLowerCase().includes(p));

  if (isTrusted) {
    return {
      domain,
      fullUrl: href,
      category: 'trusted',
      categoryLabel: 'Verified / Trusted Community Domain',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    };
  }

  if (isSuspicious) {
    return {
      domain,
      fullUrl: href,
      category: 'suspicious',
      categoryLabel: 'High Risk / Unverified Domain',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
    };
  }

  return {
    domain,
    fullUrl: href,
    category: 'external',
    categoryLabel: 'External Third-Party Website',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
  };
}
