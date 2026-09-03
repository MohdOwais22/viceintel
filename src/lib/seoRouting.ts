import { ActiveTab, SeoMetaOverride } from '../types';
import { trackPageView } from './analytics';
import { getSeoOverride } from './seoStore';

export const TAB_TO_PATH: Record<ActiveTab, string> = {
  home: '/',
  about: '/about',
  vehicles: '/vehicles',
  weapons: '/weapons',
  characters: '/characters',
  comparison: '/comparison',
  'mod-calculator': '/mod-calculator',
  'roi-calculator': '/roi-calculator',
  'handling-editor': '/calculators/handling-editor',
  'economy-balancer': '/calculators/economy-balancer',
  'script-generator': '/scripts/generator',
  'cad-mdt': '/cad-mdt',
  identity: '/identity',
  'rules-generator': '/generator',
  generator: '/generator',
  economy: '/economy',
  map: '/map',
  blog: '/blog',
  'rp-servers': '/rp-servers',
  chat: '/chat',
  profile: '/profile',
  monetization: '/monetization',
  admin: '/admin',
  docs: '/docs',
  pseo: '/pseo',
  giftcards: '/giftcards',
  'seo-hub': '/seo-hub',
  challenges: '/challenges',
  privacy: '/privacy',
  copyright: '/privacy',
  'server-manage': '/servers/manage',
  'server-apply': '/servers/apply',
  'server-review': '/servers/review',
  'server-status': '/servers/status',
  'server-dashboard': '/servers/dashboard',
  'server-billing': '/servers/billing',
  'server-growth': '/servers/growth',
  'server-studio': '/servers/studio',
  marketing: '/marketing',
  'whitelist-manage': '/servers/manage',
  'whitelist-apply': '/servers/apply',
  'whitelist-review': '/servers/review',
  'whitelist-status': '/servers/status',
  'for-servers': '/for-servers',
  'servers-onboarding': '/servers/onboarding',
  'admin-business': '/admin/business',
  'market-agency': '/admin/marketagency',
  marketagency: '/admin/marketagency',
  pitch: '/pitch',
  investors: '/investors'
};

export const PATH_TO_TAB: Record<string, ActiveTab> = {
  '/': 'home',
  '/pitch': 'pitch',
  '/investors': 'investors',
  '/vehicles': 'vehicles',
  '/weapons': 'weapons',
  '/characters': 'characters',
  '/comparison': 'comparison',
  '/mod-calculator': 'mod-calculator',
  '/roi-calculator': 'roi-calculator',
  '/calculators/handling-editor': 'handling-editor',
  '/handling-editor': 'handling-editor',
  '/calculators/economy-balancer': 'economy-balancer',
  '/economy-balancer': 'economy-balancer',
  '/scripts/generator': 'script-generator',
  '/script-generator': 'script-generator',
  '/cad-mdt': 'cad-mdt',
  '/app/cad-mdt': 'cad-mdt',
  '/cad': 'cad-mdt',
  '/mdt': 'cad-mdt',
  '/identity': 'identity',
  '/app/identity': 'identity',
  '/license': 'identity',
  '/id-generator': 'identity',
  '/generator': 'rules-generator',
  '/rules-generator': 'rules-generator',
  '/app/generator': 'rules-generator',
  '/economy': 'economy',
  '/app/economy': 'economy',
  '/dynasty8': 'economy',
  '/real-estate': 'economy',
  '/map': 'map',
  '/blog': 'blog',
  '/rp-servers': 'rp-servers',
  '/chat': 'chat',
  '/profile': 'profile',
  '/monetization': 'monetization',
  '/admin': 'admin',
  '/admin/business': 'admin-business',
  '/admin/marketagency': 'market-agency',
  '/admin/market-agency': 'market-agency',
  '/admin/agency': 'market-agency',
  '/marketagency': 'market-agency',
  '/market-agency': 'market-agency',
  '/agency': 'market-agency',
  '/for-servers': 'for-servers',
  '/servers/onboarding': 'servers-onboarding',
  '/marketing': 'marketing',
  '/growth': 'marketing',
  '/sentinel': 'marketing',
  '/about': 'about',
  '/about-us': 'about',
  '/docs': 'docs',
  '/pseo': 'pseo',
  '/architecture': 'pseo',
  '/giftcards': 'giftcards',
  '/vouchers': 'giftcards',
  '/challenges': 'challenges',
  '/tuning-challenges': 'challenges',
  '/tuning-championship': 'challenges',
  '/tuning-championships': 'challenges',
  '/tuning-championship/leaderboard': 'challenges',
  '/tuning-leaderboard': 'challenges',
  '/privacy': 'privacy',
  '/privacy-policy': 'privacy',
  '/copyright': 'privacy',
  '/terms': 'privacy',
  '/legal': 'privacy',
  '/dmca': 'privacy',
  '/seo-hub': 'seo-hub',
  '/gta6-cheats': 'seo-hub',
  '/gta-cheats': 'seo-hub',
  '/cheats': 'seo-hub',
  '/gta6-release-date': 'seo-hub',
  '/gta6-system-requirements': 'seo-hub',
  '/gta6-heist-guides': 'seo-hub',
  '/gta6-map-locations': 'seo-hub',
  '/gta6-vehicles-top-speeds': 'seo-hub',
  '/gta6-weapons-damage': 'seo-hub',
  '/gta6-characters-lucia-jason': 'seo-hub',
  '/gta6-radio-stations': 'seo-hub',
  '/gta6-rp-servers-modding': 'seo-hub',
  '/servers/manage': 'server-manage',
  '/servers/apply': 'server-apply',
  '/servers/review': 'server-review',
  '/servers/status': 'server-status',
  '/servers/dashboard': 'server-dashboard',
  '/servers/growth': 'server-growth',
  '/servers/studio': 'server-studio'
};

export const TAB_TITLES: Record<ActiveTab, string> = {
  home: 'ViceIntel — Vice City Master Utility Suite & Database',
  about: 'About ViceIntel — Official Platform Guide, Target Audience & Core Mission',
  vehicles: 'Vice City Vehicle Database — Topspeed, Acceleration & Tuning | ViceIntel',
  weapons: 'Vice City Armory & Weapon TTK Calculator — ViceIntel',
  characters: 'GTA VI Vice City Characters & Syndicate Intelligence — ViceIntel',
  comparison: '1v1 Vehicle & Weapon Spec Matrix Comparison — ViceIntel',
  'mod-calculator': 'Vice Customs Mod Builder & Performance Calculator — ViceIntel',
  'roi-calculator': 'Real Estate & Business Profit ROI Calculator — ViceIntel',
  'handling-editor': 'Interactive Vehicle Telemetry & handling.meta Visual Editor — ViceIntel',
  'economy-balancer': 'RP Server Economy & Wage Balancer (QBCore, ESX, QBX) — ViceIntel',
  'script-generator': 'FiveM Script Studio & Lua/XML Config Generator (QBCore & ESX) — ViceIntel',
  'cad-mdt': 'Emergency CAD / MDT Terminal & Dispatch Board — ViceIntel',
  identity: 'State of Leonida Driver License & Character ID Generator — ViceIntel',
  'rules-generator': 'No-Code Server Rules & Event Dispatch Engine — ViceIntel',
  generator: 'No-Code Server Rules & Event Dispatch Engine — ViceIntel',
  economy: 'Dynasty 8 Real Estate & Business Directory — ViceIntel',
  map: 'Interactive Leonida & Vice City Map Tracker — ViceIntel',
  blog: 'Vice City Intel Blog & News Bulletins — ViceIntel',
  'rp-servers': 'GTA VI Vice City RP Server Directory & Whitelist Apps — ViceIntel',
  chat: 'Community Live Chat & VIP Player Hubs — ViceIntel',
  profile: 'GamerTag Profile & VIP Membership Manager — ViceIntel',
  monetization: 'Sponsor Ads & CPM Publisher Dashboard — ViceIntel',
  admin: 'Admin Control Panel & System Analytics — ViceIntel',
  docs: 'Developer REST API Documentation & Webhook Specs — ViceIntel',
  pseo: 'pSEO Architecture, QA & Security Testing Blueprint — ViceIntel',
  giftcards: 'Shark Cards & Vice City VIP Voucher Redemption System — ViceIntel',
  challenges: 'Weekly Community Tuning Championship & Leaderboard — ViceIntel',
  privacy: 'Copyright, Trademark & Privacy Policy — ViceIntel Legal Hub',
  copyright: 'Copyright, Trademark & Privacy Policy — ViceIntel Legal Hub',
  'seo-hub': 'ViceIntel Master Knowledge Hub: Cheats, Release Date, Map & System Specs',
  'server-manage': 'No-Code Whitelist Form Builder & Discord Gate — ViceIntel',
  'server-apply': 'Player Whitelist Application Portal — ViceIntel',
  'server-review': 'Staff Whitelist Queue & Review Dashboard — ViceIntel',
  'server-status': 'Live Whitelist Application Status Tracker — ViceIntel',
  'server-dashboard': 'Owner Server Dashboard & Queue Command Center — ViceIntel',
  'server-billing': 'Server Subscription Plan & Billing Paywall — ViceIntel',
  'server-growth': 'Server Growth Engine — Server Acquisition Studio',
  'server-studio': 'Server Operating Suite — Enterprise FiveM Dashboard',
  marketing: 'Growth Engine — Dual-Mode Organic Search & Growth Studio',
  'whitelist-manage': 'No-Code Whitelist Form Builder & Discord Gate — ViceIntel',
  'whitelist-apply': 'Player Whitelist Application Portal — ViceIntel',
  'whitelist-review': 'Staff Whitelist Queue & Review Dashboard — ViceIntel',
  'whitelist-status': 'Live Whitelist Application Status Tracker — ViceIntel',
  'for-servers': 'Vice City Central for FiveM & GTA RP Server Owners ($29–$49/mo SaaS)',
  'servers-onboarding': 'Self-Serve Server Onboarding & Discord Bot Provisioning — ViceIntel',
  'admin-business': 'B2B SaaS Executive Control Plane & MRR Analytics — ViceIntel',
  'market-agency': 'AI Agent Console & Subdomain Routing — ViceIntel',
  marketagency: 'AI Agent Console & Subdomain Routing — ViceIntel',
  pitch: 'Investor Growth Deck & Unit Economics — ViceIntel Series Seed',
  investors: 'Investor Growth Deck & Unit Economics — ViceIntel Series Seed'
};

export const TAB_DESCRIPTIONS: Record<ActiveTab, string> = {
  home: 'Comprehensive Vice City player portal with real-time chat, vehicle database, interactive map, and ROI tools.',
  about: 'Discover what ViceIntel is, who can use the platform, and the core community gaming & roleplay challenges solved.',
  vehicles: 'Explore verified GTA VI vehicles with stats, top speeds, prices, and mod compatibility.',
  weapons: 'Compare Vice City weapons, damage output, TTK metrics, and fire rates.',
  characters: 'Explore GTA VI Lucia, Jason, and Vice City syndicate character backstories, abilities, and heist roles.',
  comparison: 'Head-to-head 1v1 spec comparison for GTA VI vehicles and weapons.',
  'mod-calculator': 'Calculate performance gains and mod costs for custom Vice City vehicle builds.',
  'roi-calculator': 'Analyze hourly profit margins and pay-back periods for Vice City business investments.',
  'handling-editor': 'Visual FiveM & GTA VI handling.meta physics editor with live 3D/2D telemetry visualizers, torque split calculators, and community presets.',
  'economy-balancer': 'Model FiveM/GTA RP server inflation, simulate 30-day money velocity, balance legal vs illegal job payouts, and export QBCore/ESX/QBX config.lua files.',
  'script-generator': 'Zero-syntax-error FiveM no-code Lua and XML config generator with dynamic job grade hierarchies, item registries, and economy balance simulation.',
  'cad-mdt': 'Emergency 911 dispatch queue, officer unit 10-codes, NCIC criminal and vehicle lookup, arrest warrants, and EMS hospital trauma triage.',
  identity: 'Generate skeuomorphic State of Leonida driver licenses, concealed carry weapons permits, and export high-resolution PNGs or Discord markdown.',
  'rules-generator': 'Build clear FiveM/GTA RP server rulebooks, FailRP and FearRP violation matrices, and schedule community racing/auction tournaments.',
  generator: 'Build clear FiveM/GTA RP server rulebooks, FailRP and FearRP violation matrices, and schedule community racing/auction tournaments.',
  economy: 'Dynasty 8 Executive Real Estate and commercial business directory with daily tax calculations and interactive escrow purchase bids.',
  map: 'Track collectibles, safehouses, weapon spawns, and turf zones in Vice City.',
  blog: 'Latest GTA VI leaks, trailers analysis, map guides, and game update news.',
  'rp-servers': 'Discover top FiveM and GTA VI Roleplay servers with whitelist application access.',
  chat: 'Join Vice City player channels, chat in real-time, and host private VIP gamer hubs.',
  profile: 'Manage your verified Vice City GamerTag, custom GTA VI avatars, and VIP status.',
  monetization: 'Manage ad spots, sponsor inventory, and CPM revenue for ViceIntel.',
  admin: 'Platform moderation, account verification, and system analytics.',
  'admin-business': 'Executive SaaS dashboard tracking MRR, ARR, active subscribed servers, churn rate, and manual billing overrides.',
  'market-agency': 'Autonomous AI agent suite, custom DNS subdomain gateway, campaign simulation, and prompt configuration.',
  marketagency: 'Autonomous AI agent suite, custom DNS subdomain gateway, campaign simulation, and prompt configuration.',
  'for-servers': 'Enterprise SaaS infrastructure for FiveM and GTA RP servers: automate whitelist screening, Discord role syncing, and no-code Lua economy bundles.',
  'servers-onboarding': '4-step self-serve onboarding wizard: link Discord guild, configure custom whitelist form, assign auto-roles, and deploy custom application portal.',
  'server-growth': 'Dedicated growth engine for server owners: keyword research, viral TikTok scripts, anti-spam Reddit launch kits, and streamer sponsorships.',
  'server-studio': 'All-in-one Server Operating Suite for GTA RP & FiveM owners: resource health audit, AI ban appeal evaluator, dynamic economy simulator, streamer CRM, and squad referral engine.',
  marketing: 'Centralized Growth Engine for organic platform scaling, pSEO matrix generation, viral short-form videos, and partnership outreach.',
  docs: 'Full REST API documentation and developer integrations for ViceIntel.',
  pseo: 'Programmatic SEO architecture, sitemap generators, load testing scenarios, and security safeguards.',
  giftcards: 'Redeem Shark Cash cards, send VIP pass vouchers, and generate custom in-game credit gift codes.',
  challenges: 'Weekly community vehicle physics challenges, handling.meta tuning competitions, and live leaderboards.',
  privacy: 'Official non-commercial fan disclaimer, Take-Two Interactive trademark acknowledgement, DMCA takedown procedures, and user privacy protections.',
  copyright: 'Official non-commercial fan disclaimer, Take-Two Interactive trademark acknowledgement, DMCA takedown procedures, and user privacy protections.',
  'seo-hub': 'Ultimate Vice City search hub: verified cheat codes, release date countdown, PS5/Xbox/PC specs, heist guides, and map locations.',
  'server-manage': 'No-code dynamic application form builder, Discord OAuth player verification gate, and automated staff queue dispatcher.',
  'server-apply': 'Submit character background, scenario responses, and verified Discord identity for RP server whitelist approval.',
  'server-review': 'Staff review queue for inspecting applicant backstories, saving internal notes, and triggering 1-click Discord webhook approvals.',
  'server-status': 'Track the real-time review progress of your RP server whitelist application.',
  'server-dashboard': 'Exclusive server owner command center aggregating live pending applications, form configuration settings, Discord bot auto-roles, and webhook status toggles.',
  'server-billing': 'Select subscription tier, manage billing details, and activate B2B server benefits.',
  'whitelist-manage': 'No-code dynamic application form builder, Discord OAuth player verification gate, and automated staff queue dispatcher.',
  'whitelist-apply': 'Submit character background, scenario responses, and verified Discord identity for RP server whitelist approval.',
  'whitelist-review': 'Staff review queue for inspecting applicant backstories, saving internal notes, and triggering 1-click Discord webhook approvals.',
  'whitelist-status': 'Track the real-time review progress of your RP server whitelist application.',
  pitch: 'Executive investor memorandum, TAM analysis, unit economics simulator, and Series Seed pitch deck for ViceIntel.',
  investors: 'Executive investor memorandum, TAM analysis, unit economics simulator, and Series Seed pitch deck for ViceIntel.'
};

/**
 * Returns the matching ActiveTab for a given URL path, supporting dynamic /servers/:slug/:action routes.
 */
export function getTabFromPath(pathname: string): { tab: ActiveTab; slug?: string } {
  const cleanPath = pathname.toLowerCase().replace(/\/$/, '') || '/';

  // Dynamic /blog/[slug] parser
  const blogMatch = cleanPath.match(/^\/blog\/([^/]+)$/);
  if (blogMatch) {
    return { tab: 'blog', slug: blogMatch[1] };
  }

  // Dynamic /servers/[slug]/[action] parser
  const serverMatch = cleanPath.match(/^\/servers\/([^/]+)(?:\/([^/]+))?$/);
  if (serverMatch) {
    const slug = serverMatch[1];
    const action = serverMatch[2] || 'apply';

    if (action === 'manage') return { tab: 'server-manage', slug };
    if (action === 'review') return { tab: 'server-review', slug };
    if (action === 'status') return { tab: 'server-status', slug };
    if (action === 'dashboard') return { tab: 'server-dashboard', slug };
    if (action === 'billing' || action === 'claim') return { tab: 'server-billing', slug };
    if (action === 'growth' || action === 'marketing') return { tab: 'server-growth', slug };
    if (action === 'studio') return { tab: 'server-studio', slug };
    return { tab: 'server-apply', slug };
  }

  const tab = PATH_TO_TAB[cleanPath] || 'home';
  return { tab };
}

/**
 * Helper to update or create a meta tag dynamically in document head.
 */
export function setMetaTag(nameOrProperty: string, content: string, isProperty = false) {
  if (typeof document === 'undefined' || !nameOrProperty) return;
  try {
    const escaped = CSS.escape ? CSS.escape(nameOrProperty) : nameOrProperty.replace(/["\\]/g, '\\$&');
    const selector = isProperty
      ? `meta[property="${escaped}"]`
      : `meta[name="${escaped}"]`;

    let meta = document.querySelector(selector) as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      if (isProperty) {
        meta.setAttribute('property', nameOrProperty);
      } else {
        meta.setAttribute('name', nameOrProperty);
      }
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', content || '');
  } catch (err) {
    // Ignore DOM selector or head manipulation errors in restricted environments
  }
}

/**
 * Updates or injects the canonical URL tag <link rel="canonical" href="...">
 */
export function setCanonicalUrl(url: string) {
  if (typeof document === 'undefined' || !url) return;
  try {
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  } catch (err) {
    // Ignore DOM manipulation errors
  }
}

export interface SeoOptions {
  title: string;
  description: string;
  url?: string;
  imageUrl?: string;
  keywords?: string[];
  type?: 'website' | 'article' | string;
  author?: string;
  publishedDate?: string;
  jsonLd?: Record<string, any>;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  ogSiteName?: string;
  twitterCard?: 'summary_large_image' | 'summary' | string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterSite?: string;
  twitterCreator?: string;
  robots?: string;
  schemaType?: string;
}

/**
 * Full-spectrum SEO update tool managing Title, Description, Canonical, OG tags, Twitter Cards, and JSON-LD.
 */
export function updateSeoTags(options: SeoOptions) {
  if (typeof document === 'undefined') return;

  const {
    title,
    description,
    url = typeof window !== 'undefined' ? window.location.href : 'https://viceintel.app',
    imageUrl = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
    keywords = ['GTA VI', 'Vice City', 'GTA 6', 'ViceIntel', 'Database', 'Guides'],
    type = 'website',
    author = 'Vice City Central Staff',
    publishedDate,
    jsonLd,
    ogTitle,
    ogDescription,
    ogImage,
    ogType,
    ogSiteName = 'ViceIntel — Vice City Master Utility Suite',
    twitterCard = 'summary_large_image',
    twitterTitle,
    twitterDescription,
    twitterImage,
    twitterSite = '@ViceIntelApp',
    twitterCreator = '@ViceIntelApp',
    robots = 'index, follow'
  } = options;

  // 1. Title
  document.title = title;

  // 2. Standard Meta
  setMetaTag('description', description);
  if (keywords && keywords.length > 0) {
    setMetaTag('keywords', keywords.join(', '));
  }
  if (robots) {
    setMetaTag('robots', robots);
  }

  // 3. Canonical Link
  setCanonicalUrl(url);

  // 4. OpenGraph Tags
  setMetaTag('og:title', ogTitle || title, true);
  setMetaTag('og:description', ogDescription || description, true);
  setMetaTag('og:url', url, true);
  setMetaTag('og:type', ogType || type, true);
  setMetaTag('og:image', ogImage || imageUrl, true);
  setMetaTag('og:site_name', ogSiteName, true);

  // 5. Twitter Card Tags
  setMetaTag('twitter:card', twitterCard);
  setMetaTag('twitter:title', twitterTitle || ogTitle || title);
  setMetaTag('twitter:description', twitterDescription || ogDescription || description);
  setMetaTag('twitter:image', twitterImage || ogImage || imageUrl);
  if (twitterSite) {
    setMetaTag('twitter:site', twitterSite);
  }
  if (twitterCreator) {
    setMetaTag('twitter:creator', twitterCreator);
  }

  if (publishedDate) {
    setMetaTag('article:published_time', publishedDate, true);
  }
  if (author) {
    setMetaTag('article:author', author, true);
  }

  // 6. JSON-LD Schema
  if (jsonLd) {
    const schemaId = 'seo-page-jsonld';
    let scriptEl = document.getElementById(schemaId) as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = schemaId;
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify(jsonLd, null, 2);
  }
}

/**
 * Specifically updates SEO tags for an individual Blog Post or Knowledge Hub Article.
 */
export function updateArticleSeoMeta(article: {
  title: string;
  description: string;
  slug: string;
  imageUrl?: string;
  author?: string;
  date?: string;
  keywords?: string[];
  faqs?: Array<{ question: string; answer: string }>;
  isBlog?: boolean;
}) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://viceintel.app';
  const cleanSlug = article.slug.replace(/^\//, '');
  const path = article.isBlog ? `/blog/${cleanSlug}` : `/${cleanSlug}`;
  const fullUrl = `${origin}${path}`;
  const siteName = 'ViceIntel Vice City Central';

  const defaultImage = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80';
  const image = article.imageUrl || defaultImage;

  const articleSchema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': article.isBlog ? 'BlogPosting' : 'NewsArticle',
    '@id': fullUrl,
    headline: article.title,
    description: article.description,
    image: [image],
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': fullUrl
    },
    author: {
      '@type': 'Person',
      name: article.author || 'Vice City Staff'
    },
    publisher: {
      '@type': 'Organization',
      name: siteName,
      url: origin,
      logo: {
        '@type': 'ImageObject',
        url: `${origin}/favicon.ico`
      }
    },
    datePublished: article.date || '2026-08-01',
    dateModified: article.date || '2026-08-01',
    keywords: (article.keywords || ['GTA 6', 'Vice City', 'Leaks', 'Guides']).join(', ')
  };

  const graph: any[] = [articleSchema];

  if (article.faqs && article.faqs.length > 0) {
    graph.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: article.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    });
  }

  const jsonLdData = graph.length === 1 ? graph[0] : { '@context': 'https://schema.org', '@graph': graph };

  updateSeoTags({
    title: `${article.title} — ${article.isBlog ? 'ViceIntel Blog' : 'Vice City Knowledge Hub'}`,
    description: article.description,
    url: fullUrl,
    imageUrl: image,
    keywords: article.keywords,
    type: 'article',
    author: article.author,
    publishedDate: article.date,
    jsonLd: jsonLdData
  });
}

/**
 * Dynamically injects SEO document title, meta description, Schema.org JSON-LD tag, and triggers GA4 Pageviews.
 * Fully checks real-time Admin SEO-Meta overrides before applying fallbacks.
 */
export function updatePageSeoMeta(tabInput?: ActiveTab | { tab?: ActiveTab } | string | null) {
  if (typeof document === 'undefined') return;

  const tab: ActiveTab = typeof tabInput === 'string'
    ? (tabInput as ActiveTab)
    : (typeof tabInput === 'object' && tabInput && 'tab' in tabInput && typeof (tabInput as { tab?: string }).tab === 'string')
      ? ((tabInput as { tab: ActiveTab }).tab)
      : 'home';

  // Check if an Admin SEO-Meta Override exists in real-time
  const override = getSeoOverride(tab);

  const defaultTitle = TAB_TITLES[tab] || TAB_TITLES.home;
  const defaultDescription = TAB_DESCRIPTIONS[tab] || TAB_DESCRIPTIONS.home;
  const path = TAB_TO_PATH[tab] || '/';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://viceintel.app';
  const currentUrl = override?.canonicalUrl || `${origin}${path}`;
  const tabDisplayName = typeof tab === 'string' ? tab.toUpperCase() : 'PORTAL';

  const title = (override?.title && override.title.trim()) || defaultTitle;
  const description = (override?.description && override.description.trim()) || defaultDescription;
  const defaultOgImage = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80';

  let jsonLdData: Record<string, any>;
  if (override?.customJsonLd) {
    if (typeof override.customJsonLd === 'string') {
      try {
        jsonLdData = JSON.parse(override.customJsonLd);
      } catch (e) {
        jsonLdData = {
          '@context': 'https://schema.org',
          '@type': override.schemaType || 'WebPage',
          name: title,
          description: description,
          url: currentUrl
        };
      }
    } else {
      jsonLdData = override.customJsonLd;
    }
  } else {
    jsonLdData = {
      '@context': 'https://schema.org',
      '@type': override?.schemaType || (tab === 'home' ? 'WebSite' : 'WebPage'),
      name: title,
      description: description,
      url: currentUrl,
      isPartOf: {
        '@type': 'WebSite',
        name: 'ViceIntel Vice City Master Utility Suite',
        url: origin
      },
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: origin },
          { '@type': 'ListItem', position: 2, name: tabDisplayName, item: currentUrl }
        ]
      }
    };
  }

  updateSeoTags({
    title,
    description,
    url: currentUrl,
    imageUrl: override?.ogImage || override?.twitterImage || defaultOgImage,
    keywords: override?.keywords,
    type: (override?.ogType as any) || 'website',
    ogTitle: override?.ogTitle || title,
    ogDescription: override?.ogDescription || description,
    ogImage: override?.ogImage || defaultOgImage,
    ogType: override?.ogType,
    ogSiteName: override?.ogSiteName || 'ViceIntel — Vice City Master Utility Suite',
    twitterCard: (override?.twitterCard as any) || 'summary_large_image',
    twitterTitle: override?.twitterTitle || override?.ogTitle || title,
    twitterDescription: override?.twitterDescription || override?.ogDescription || description,
    twitterImage: override?.twitterImage || override?.ogImage || defaultOgImage,
    twitterSite: override?.twitterSite || '@ViceIntelApp',
    twitterCreator: override?.twitterCreator || '@ViceIntelApp',
    robots: override?.robots || 'index, follow',
    jsonLd: jsonLdData
  });

  // Trigger Google Analytics Pageview
  try {
    trackPageView(path, title);
  } catch (err) {
    console.debug('Analytics pageview error:', err);
  }
}

