/**
 * Centralized Affiliate Partner Engine & Configuration
 * Vice City Central Platform
 */

export interface AffiliatePartner {
  id: string; // e.g. "zap_hosting", "exitlag", "kinguin"
  name: string;
  category: 'hosting' | 'vpn' | 'game_keys' | 'hardware';
  targetUrl: string;
  discountBadge?: string; // e.g. "20% OFF CODE: VCC20"
  couponCode?: string;
  isActive: boolean;
  commissionType: 'recurring' | 'cpa' | 'percentage';
  description?: string;
  logoUrl?: string;
  features?: string[];
  allowedRedirectDomains: string[];
}

export interface AffiliateClickLog {
  id: string;
  partnerId: string;
  placement: string; // e.g. "lua_generator_footer", "directory_card"
  userDiscordId?: string;
  referrer: string;
  userAgent: string;
  timestamp: number;
}

export const FTC_AFFILIATE_DISCLOSURE =
  "Sponsored / Affiliate Disclosure: Vice City Central partners with trusted gaming brands. When you click our links and make a purchase, we may earn an affiliate commission at no extra cost to you.";

export const AFFILIATE_PARTNERS: Record<string, AffiliatePartner> = {
  zap_hosting: {
    id: 'zap_hosting',
    name: 'ZAP-Hosting (FiveM Official Partner)',
    category: 'hosting',
    targetUrl: 'https://zap-hosting.com/a/vicecitycentral',
    discountBadge: '20% OFF CODE: VCC20',
    couponCode: 'VCC20',
    isActive: true,
    commissionType: 'recurring',
    description: 'Official FiveM txAdmin Server Hosting with automated DDoS mitigation, instant server deployment, and 1-click MySQL setup.',
    features: ['Instant txAdmin Setup', 'Anti-DDoS Shielded', 'One-Click MySQL Database'],
    allowedRedirectDomains: ['zap-hosting.com', 'www.zap-hosting.com']
  },
  hostinger_vps: {
    id: 'hostinger_vps',
    name: 'Hostinger VPS',
    category: 'hosting',
    targetUrl: 'https://hostinger.com/vps/vicecitycentral',
    discountBadge: '10% OFF CODE: VCC10',
    couponCode: 'VCC10',
    isActive: true,
    commissionType: 'percentage',
    description: 'High-performance KVM NVMe VPS hosting for custom Linux & Windows dedicated game server deployments.',
    features: ['Dedicated KVM CPU', 'Ultra-fast NVMe Storage', 'Full Root Access'],
    allowedRedirectDomains: ['hostinger.com', 'www.hostinger.com']
  },
  ovh_cloud: {
    id: 'ovh_cloud',
    name: 'OVHcloud Game Servers',
    category: 'hosting',
    targetUrl: 'https://www.ovhcloud.com/en/bare-metal/game/vicecitycentral',
    discountBadge: 'SPECIAL PROMO',
    isActive: true,
    commissionType: 'cpa',
    description: 'Enterprise-grade bare metal hardware with custom game DDoS mitigation filtering for high-population FiveM communities.',
    features: ['Water-Cooled Hardware', 'Game DDoS Filter', 'Unmetered Bandwidth'],
    allowedRedirectDomains: ['ovhcloud.com', 'www.ovhcloud.com']
  },
  exitlag: {
    id: 'exitlag',
    name: 'ExitLag Routing Optimizer',
    category: 'vpn',
    targetUrl: 'https://www.exitlag.com/aff.php?aff=vicecitycentral',
    discountBadge: '15% OFF CODE: VCC15',
    couponCode: 'VCC15',
    isActive: true,
    commissionType: 'recurring',
    description: 'Optimize connection routes, reduce packet loss, and lower in-game ping by up to 40ms on FiveM & GTA VI servers.',
    features: ['Lower Ping by up to 40ms', 'Zero Packet Loss Routing', 'Multi-Path Traffic Protection'],
    allowedRedirectDomains: ['exitlag.com', 'www.exitlag.com']
  },
  nordvpn: {
    id: 'nordvpn',
    name: 'NordVPN Gaming Shield',
    category: 'vpn',
    targetUrl: 'https://nordvpn.com/vicecitycentral',
    discountBadge: '68% OFF + 3 MO EXTRA',
    couponCode: 'VCC68',
    isActive: true,
    commissionType: 'cpa',
    description: 'DDoS defense & high-speed VPN mesh networks tailored for uninterrupted online GTA RP gaming.',
    features: ['DDoS Attack Defense', 'Ultra-Fast Meshnet', 'No-Logs Privacy'],
    allowedRedirectDomains: ['nordvpn.com', 'www.nordvpn.com']
  },
  kinguin: {
    id: 'kinguin',
    name: 'Kinguin Digital Keys',
    category: 'game_keys',
    targetUrl: 'https://www.kinguin.net/gta-vi-keys?r=vicecitycentral',
    discountBadge: 'BEST PRICE GUARANTEE',
    couponCode: 'VCC5',
    isActive: true,
    commissionType: 'percentage',
    description: 'Verified digital game key marketplace for GTA VI pre-orders, PC activation keys, and bonus shark cards.',
    features: ['Instant Key Delivery', 'Buyer Protection Shield', 'Lowest Price Guarantee'],
    allowedRedirectDomains: ['kinguin.net', 'www.kinguin.net']
  },
  g2a: {
    id: 'g2a',
    name: 'G2A Marketplace',
    category: 'game_keys',
    targetUrl: 'https://www.g2a.com/r/vicecitycentral',
    discountBadge: '5% OFF CODE: VCC5',
    couponCode: 'VCC5',
    isActive: true,
    commissionType: 'percentage',
    description: 'Global digital gaming marketplace for Rockstar Games activation keys, Steam balance, and Xbox gift cards.',
    features: ['Global Digital Keys', '24/7 Support', 'Secure Pay'],
    allowedRedirectDomains: ['g2a.com', 'www.g2a.com']
  },
  amazon_hardware: {
    id: 'amazon_hardware',
    name: 'Amazon Proximity Gear',
    category: 'hardware',
    targetUrl: 'https://www.amazon.com/dp/B08X5Z9VCC?tag=vicecitycentral-20',
    discountBadge: 'PRIME ELIGIBLE',
    isActive: true,
    commissionType: 'percentage',
    description: 'Pro-grade noise-canceling headsets, studio condenser microphones, and directional audio gear built for proximity RP voice comms.',
    features: ['Studio Broadcast Mic', 'Crystal Clear Proximity Audio', 'Prime Fast Delivery'],
    allowedRedirectDomains: ['amazon.com', 'www.amazon.com', 'amzn.to']
  }
};

export const AFFILIATE_PARTNERS_LIST: AffiliatePartner[] = Object.values(AFFILIATE_PARTNERS);

/**
  Generates a tracked outbound redirect URL routing through /api/affiliates/redirect
 */
export function getAffiliateRedirectUrl(
  partnerId: string,
  placement: string = 'default',
  refUserDiscordId?: string
): string {
  const params = new URLSearchParams();
  params.set('partner', partnerId);
  params.set('placement', placement);
  if (refUserDiscordId) {
    params.set('ref', refUserDiscordId);
  }
  return `/api/affiliates/redirect?${params.toString()}`;
}

/**
  Checks if a target URL domain matches the partner's allowed redirect whitelist
 */
export function isAllowedRedirectDomain(partner: AffiliatePartner, urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    const host = parsed.hostname.toLowerCase();
    return partner.allowedRedirectDomains.some((allowed) => {
      const cleanAllowed = allowed.toLowerCase();
      return host === cleanAllowed || host.endsWith('.' + cleanAllowed);
    });
  } catch {
    return false;
  }
}
