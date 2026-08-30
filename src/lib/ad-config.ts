/**
 * Vice City Central — Ad Injection & Script Management Engine Configuration
 *
 * Provides route pattern matching, standard IAB ad unit specifications,
 * layout shift (CLS) reservation dimensions, and VIP/Pro session ad suppression logic.
 */

import { ENV } from './envConfig';

export type AdSlotType =
  | 'leaderboard'
  | 'mrec'
  | 'half_page'
  | 'billboard'
  | 'mobile_banner'
  | 'map_dock'
  | 'native_feed'
  | 'responsive';

export type AdPosition =
  | 'header'
  | 'footer'
  | 'sidebar'
  | 'inline'
  | 'map_dock'
  | 'sticky_bottom';

export interface AdUnitDimension {
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  aspectRatio: string;
  className: string;
}

/**
 * Standard IAB Slot Dimensions & CLS Reservation Profiles
 */
export const AD_SLOT_DIMENSIONS: Record<AdSlotType, AdUnitDimension> = {
  leaderboard: {
    width: 728,
    height: 90,
    minWidth: 728,
    minHeight: 90,
    aspectRatio: '728 / 90',
    className: 'w-[728px] h-[90px] min-h-[90px]'
  },
  mrec: {
    width: 300,
    height: 250,
    minWidth: 300,
    minHeight: 250,
    aspectRatio: '300 / 250',
    className: 'w-[300px] h-[250px] min-h-[250px]'
  },
  half_page: {
    width: 300,
    height: 600,
    minWidth: 300,
    minHeight: 600,
    aspectRatio: '300 / 600',
    className: 'w-[300px] h-[600px] min-h-[600px]'
  },
  billboard: {
    width: 970,
    height: 250,
    minWidth: 970,
    minHeight: 250,
    aspectRatio: '970 / 250',
    className: 'w-[970px] h-[250px] min-h-[250px]'
  },
  mobile_banner: {
    width: 320,
    height: 50,
    minWidth: 320,
    minHeight: 50,
    aspectRatio: '320 / 50',
    className: 'w-[320px] h-[50px] min-h-[50px]'
  },
  map_dock: {
    width: 320,
    height: 100,
    minWidth: 300,
    minHeight: 100,
    aspectRatio: '320 / 100',
    className: 'w-[320px] h-[100px] min-h-[100px]'
  },
  native_feed: {
    width: 600,
    height: 140,
    minWidth: 320,
    minHeight: 120,
    aspectRatio: '600 / 140',
    className: 'w-full max-w-[600px] min-h-[120px]'
  },
  responsive: {
    width: 0,
    height: 0,
    minWidth: 300,
    minHeight: 90,
    aspectRatio: 'auto',
    className: 'w-full min-h-[90px]'
  }
};

/**
 * Route-Based Ad Exclusion Blacklist Patterns
 * These mission-critical or interactive tool workflows must remain 100% ad-free.
 */
export const EXCLUDED_ROUTE_PATTERNS: RegExp[] = [
  /^\/servers\/[^/]+\/manage(\/.*)?$/i,    // Owner Dashboard & Form Builder (/servers/*/manage*)
  /^\/servers\/[^/]+\/review(\/.*)?$/i,    // Staff Review Queue (/servers/*/review*)
  /^\/servers\/[^/]+\/apply(\/.*)?$/i,     // Whitelist Application Portal (/servers/*/apply*)
  /^\/servers\/[^/]+\/status(\/.*)?$/i,    // Application Status (/servers/*/status*)
  /^\/servers\/[^/]+\/billing(\/.*)?$/i,   // SaaS Checkout & Subscriptions (/servers/*/billing*)
  /^\/pricing(\/.*)?$/i,                   // Subscription Pricing
  /^\/checkout(\/.*)?$/i,                  // Payment Gateway Checkout
  /^\/onboarding(\/.*)?$/i,                // Server Onboarding Flow
  /^\/servers\/onboarding(\/.*)?$/i,       // Server Post-Checkout Onboarding
  /^\/for-servers(\/.*)?$/i,               // B2B Server Landing / Checkout
  /^\/login(\/.*)?$/i,                     // User Login Flow
  /^\/auth(\/.*)?$/i,                      // Authentication & OAuth callbacks
  /^\/admin(\/.*)?$/i                      // Admin Dashboard HQ
];

/**
 * Route-Based Ad Inclusion Whitelist Patterns
 * High-traffic public content and discovery routes where monetization is active.
 */
export const INCLUDED_ROUTE_PATTERNS: RegExp[] = [
  /^\/$/i,                                 // Homepage
  /^\/servers(\/)?$/i,                     // Public RP Server Directory
  /^\/rp-servers(\/)?$/i,                  // Public RP Server Directory Alternate
  /^\/vehicles(\/.*)?$/i,                  // Vehicles Wiki & pSEO pages
  /^\/weapons(\/.*)?$/i,                   // Weapons Database & pSEO pages
  /^\/locations(\/.*)?$/i,                 // Locations & Map Wiki pSEO pages
  /^\/map(\/)?$/i,                         // Interactive Map (Docked Banners with Policy Isolation)
  /^\/news(\/.*)?$/i,                      // Editorial Guides, Leaks & pSEO News
  /^\/blog(\/.*)?$/i,                      // Blog Posts & Updates
  /^\/seo-hub(\/.*)?$/i,                   // GTA 6 Knowledge Hub
  /^\/pseo(\/.*)?$/i,                      // Programmatic SEO Database
  /^\/comparison(\/)?$/i,                  // Vehicle & Weapon Comparison
  /^\/mod-calculator(\/)?$/i,              // Vehicle Mod Performance Calculator
  /^\/roi-calculator(\/)?$/i               // Business ROI Profitability Calculator
];

/**
 * Ad Network Configuration Defaults
 */
export const AD_NETWORK_CONFIG = {
  // Google AdSense Publisher Client ID & Ads Key
  adsenseClientId: ENV.ADS_KEY || ENV.ADSENSE_CLIENT_ID || 'ca-pub-4929828472918402',

  // Google Ad Manager (GPT) Network ID
  gptNetworkCode: ENV.GPT_NETWORK_CODE || '/218471928/ViceCityCentral_Display',

  // Script Source URLs
  adsenseScriptUrl: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
  gptScriptUrl: 'https://securepubads.g.doubleclick.net/tag/js/gpt.js',

  // Map Dock Compliance: Minimum 24px safety distance from canvas pins
  mapDockSafetyMarginPx: 24,

  // Lazy loading root margin for IntersectionObserver
  defaultLazyRootMargin: '200px'
};

export const IAB_AD_DIMENSIONS: Record<string, AdUnitDimension> = new Proxy(AD_SLOT_DIMENSIONS as Record<string, AdUnitDimension>, {
  get(target, prop: string) {
    if (prop === 'medium_rectangle') return target.mrec;
    if (prop in target) return target[prop];
    return target.mrec || {
      width: 300,
      height: 250,
      minWidth: 300,
      minHeight: 250,
      aspectRatio: '300 / 250',
      className: 'w-[300px] h-[250px] min-h-[250px]'
    };
  }
});

export interface AdRuleMeta {
  id: string;
  name: string;
  patterns: string[];
  description: string;
}

export const AD_EXCLUSION_RULES: AdRuleMeta[] = [
  { id: 'server_manage', name: 'Server Owner Dashboard', patterns: ['/servers/*/manage*'], description: 'Form Builder & Management' },
  { id: 'server_review', name: 'Staff Review Queue', patterns: ['/servers/*/review*'], description: 'Whitelist applicant queue' },
  { id: 'server_apply', name: 'Applicant Portal', patterns: ['/servers/*/apply*'], description: 'Player submission flow' },
  { id: 'server_status', name: 'Application Status', patterns: ['/servers/*/status*'], description: 'Player status tracking' },
  { id: 'server_billing', name: 'SaaS Billing & Plans', patterns: ['/servers/*/billing*', '/checkout*'], description: 'Payment gateway transactions' },
  { id: 'admin_hq', name: 'Admin Headquarters', patterns: ['/admin*'], description: 'Staff moderation suite' },
  { id: 'auth_flow', name: 'Authentication & OAuth', patterns: ['/login*', '/auth*'], description: 'Sign-in & OAuth callbacks' }
];

export const AD_WHITELIST_RULES: AdRuleMeta[] = [
  { id: 'home', name: 'Homepage & Hub', patterns: ['/'], description: 'Main portal landing' },
  { id: 'servers', name: 'FiveM RP Directory', patterns: ['/servers', '/rp-servers'], description: 'Public server directory' },
  { id: 'vehicles', name: 'Vehicles Wiki Database', patterns: ['/vehicles/*'], description: 'Vehicle specs & tuning' },
  { id: 'weapons', name: 'Weapons & Loadouts', patterns: ['/weapons/*'], description: 'Weapon stats & comparisons' },
  { id: 'locations_map', name: 'Map & Locations Wiki', patterns: ['/map', '/locations/*'], description: 'Interactive Map & POIs' },
  { id: 'news_seo', name: 'News & pSEO Knowledge Hub', patterns: ['/news/*', '/blog/*', '/seo-hub/*'], description: 'Editorial & news updates' }
];

/**
 * Validates whether a route pathname is excluded from showing ads.
 */
export function isRouteExcludedFromAds(pathname: string): boolean {
  if (!pathname) return false;
  const normalized = pathname.split('?')[0].split('#')[0].trim() || '/';

  for (const pattern of EXCLUDED_ROUTE_PATTERNS) {
    if (pattern.test(normalized)) {
      return true;
    }
  }
  return false;
}

/**
 * Validates whether a route pathname is explicitly eligible for ads.
 */
export function isRouteEligibleForAds(pathname: string): boolean {
  if (!pathname) return false;
  const normalized = pathname.split('?')[0].split('#')[0].trim() || '/';

  // Exclusion blacklist takes absolute precedence
  if (isRouteExcludedFromAds(normalized)) {
    return false;
  }

  // Check against explicit inclusion whitelist
  for (const pattern of INCLUDED_ROUTE_PATTERNS) {
    if (pattern.test(normalized)) {
      return true;
    }
  }

  // Default to non-excluded routes
  return true;
}

/**
 * VIP & Pro Subscription Suppression Check
 * Returns true if the user holds VIP status, Staff/Admin status, or an active Server Owner Pass,
 * which grants a 100% ad-free experience.
 */
export function isUserAdFree(user: any): boolean {
  if (!user) return false;

  // Direct boolean flag
  if (user.isVip === true) return true;

  // Clearance and Role hierarchy
  if (user.isAdmin === true || user.isStaff === true) return true;
  if (user.role === 'Admin' || user.role === 'Staff' || user.role === 'VIP Member') return true;
  if (user.clearanceLevel === 'L4' || user.clearanceLevel === 'L3' || user.clearanceLevel === 'L2') return true;

  // Active Server Owner Pro / Enterprise Pass
  if (user.isServerOwner === true && user.subscriptionStatus === 'active') return true;
  if (user.tier === 'pro' || user.tier === 'mega_server' || user.tier === 'enterprise') return true;

  // VIP Expiration timestamp check
  if (user.vipExpires) {
    if (user.vipExpires === 'Lifetime' || user.vipExpires === 'Staff Account') return true;
    if (typeof user.vipExpires === 'string' && user.vipExpires !== 'Expired') {
      const expiry = new Date(user.vipExpires).getTime();
      if (!isNaN(expiry) && expiry > Date.now()) {
        return true;
      }
    } else if (typeof user.vipExpires === 'number' && user.vipExpires > Date.now()) {
      return true;
    }
  }

  return false;
}

/**
 * Helper to get computed dimension values for an ad slot type.
 */
export function getAdSlotDimensions(slotType: AdSlotType): AdUnitDimension {
  return AD_SLOT_DIMENSIONS[slotType] || AD_SLOT_DIMENSIONS.responsive;
}

export interface AdaptiveAdResult {
  activeSlotType: AdSlotType;
  dimensions: AdUnitDimension;
  isAdapted: boolean;
  adaptationLabel?: string;
  adaptationReason?: string;
}

/**
 * Dynamically adjusts ad slot type and dimensions based on user's viewport width.
 * Prevents horizontal overflow/CLS on mobile while upgrading desktop units to high-engagement formats.
 */
export function getAdaptiveAdDimensions(
  requestedSlotType: AdSlotType,
  viewportWidth: number,
  enableDynamicSizing: boolean = true
): AdaptiveAdResult {
  const baseDimensions = getAdSlotDimensions(requestedSlotType);

  if (!enableDynamicSizing || viewportWidth <= 0) {
    return {
      activeSlotType: requestedSlotType,
      dimensions: baseDimensions,
      isAdapted: false
    };
  }

  // Viewport Breakpoint Categories
  const isMobile = viewportWidth < 640;
  const isTablet = viewportWidth >= 640 && viewportWidth < 1024;
  const isDesktop = viewportWidth >= 1024 && viewportWidth < 1280;
  const isUltraWide = viewportWidth >= 1280;

  // Rule 1: Mobile Viewports (< 640px) - Downscale large desktop units to mobile-optimized formats
  if (isMobile) {
    if (requestedSlotType === 'billboard' || requestedSlotType === 'leaderboard') {
      if (viewportWidth >= 360) {
        const mrecDims = getAdSlotDimensions('mrec');
        return {
          activeSlotType: 'mrec',
          dimensions: mrecDims,
          isAdapted: true,
          adaptationLabel: 'Mobile MREC (300×250)',
          adaptationReason: `Viewport width (${viewportWidth}px) dynamically adapted ${requestedSlotType} to 300×250 MREC to fit mobile width and maximize CTR.`
        };
      } else {
        const mobileBannerDims = getAdSlotDimensions('mobile_banner');
        return {
          activeSlotType: 'mobile_banner',
          dimensions: mobileBannerDims,
          isAdapted: true,
          adaptationLabel: 'Mobile Banner (320×50)',
          adaptationReason: `Viewport width (${viewportWidth}px) dynamically adapted ${requestedSlotType} to 320×50 Mobile Banner to eliminate layout overflow.`
        };
      }
    }

    if (requestedSlotType === 'half_page') {
      const mrecDims = getAdSlotDimensions('mrec');
      return {
        activeSlotType: 'mrec',
        dimensions: mrecDims,
        isAdapted: true,
        adaptationLabel: 'Mobile MREC (300×250)',
        adaptationReason: `Viewport width (${viewportWidth}px) adapted 300×600 Half-Page to 300×250 MREC for compact mobile UX.`
      };
    }
  }

  // Rule 2: Tablet Viewports (640px - 1023px)
  if (isTablet) {
    if (requestedSlotType === 'billboard') {
      const leaderboardDims = getAdSlotDimensions('leaderboard');
      return {
        activeSlotType: 'leaderboard',
        dimensions: leaderboardDims,
        isAdapted: true,
        adaptationLabel: 'Tablet Leaderboard (728×90)',
        adaptationReason: `Viewport width (${viewportWidth}px) adapted 970px Billboard to 728px Leaderboard.`
      };
    }
  }

  // Rule 3: UltraWide Desktop Viewports (>= 1280px) - Upgrade leaderboard to billboard for higher engagement
  if (isUltraWide) {
    if (requestedSlotType === 'leaderboard') {
      const billboardDims = getAdSlotDimensions('billboard');
      return {
        activeSlotType: 'billboard',
        dimensions: billboardDims,
        isAdapted: true,
        adaptationLabel: 'High-Impact Billboard (970×250)',
        adaptationReason: `Ultra-wide viewport (${viewportWidth}px) upgraded Leaderboard to 970×250 Billboard for 45% higher viewability and engagement.`
      };
    }
  }

  // Rule 4: Responsive / Native Feed dynamic fluid calculation
  if (requestedSlotType === 'responsive' || requestedSlotType === 'native_feed') {
    const calculatedWidth = Math.min(viewportWidth - 32, baseDimensions.width || 1200);
    const calculatedHeight = Math.max(90, Math.round(calculatedWidth * 0.25));
    return {
      activeSlotType: requestedSlotType,
      dimensions: {
        ...baseDimensions,
        width: calculatedWidth,
        height: calculatedHeight,
        className: `w-full max-w-[${calculatedWidth}px] min-h-[${calculatedHeight}px]`
      },
      isAdapted: true,
      adaptationLabel: `Fluid Responsive (${calculatedWidth}×${calculatedHeight})`,
      adaptationReason: `Fluid responsive unit dynamically calculated to ${calculatedWidth}px container width.`
    };
  }

  return {
    activeSlotType: requestedSlotType,
    dimensions: baseDimensions,
    isAdapted: false
  };
}

