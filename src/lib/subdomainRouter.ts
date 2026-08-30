/**
 * Unified Domain Routing & Navigation Helper
 * 
 * Configured for unified single-domain deployment:
 *   - Main Portal:     / (home, vehicles, chat, etc.)
 *   - Documentation:   /docs
 *   - Admin Panel:     /admin
 *   - Whitelist Portal: /servers/[slug]/apply
 */

import { ENV } from './envConfig';

export type SubdomainMode = 'portal' | 'docs' | 'admin';

/**
 * Returns active mode (portal by default).
 */
export function detectSubdomainMode(): {
  mode: SubdomainMode;
  hostname: string;
  isSimulated: boolean;
  subdomainPrefix: string;
} {
  if (typeof window === 'undefined') {
    return { mode: 'portal', hostname: '', isSimulated: false, subdomainPrefix: '' };
  }
  return { mode: 'portal', hostname: window.location.hostname || '', isSimulated: false, subdomainPrefix: '' };
}

/**
 * Single-domain unified routing is active
 */
export function isSubdomainRoutingEnabled(): boolean {
  return false;
}

/**
 * Returns the destination URL for Documentation (always internal route /docs)
 */
export function getDocsNavigationTarget(): {
  isExternal: boolean;
  url: string;
} {
  return { isExternal: false, url: '/docs' };
}

/**
 * Returns the destination URL for Admin Panel (always internal route /admin)
 */
export function getAdminNavigationTarget(): {
  isExternal: boolean;
  url: string;
} {
  return { isExternal: false, url: '/admin' };
}

/**
 * Returns the destination URL for the Main App Portal
 */
export function getMainPortalUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'https://viceintel.app';
}

