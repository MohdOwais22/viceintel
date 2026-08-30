/**
 * Vice City Central — Ad & Promo Display Toggle Store
 *
 * Manages global and per-page ad display settings with persistent localStorage sync
 * and realtime window event propagation.
 */

export interface PageAdSetting {
  key: string;
  name: string;
  pathPattern: string;
  enabled: boolean;
  category: 'Core Portal' | 'Database & Wiki' | 'Calculators & Tools';
}

export const DEFAULT_PAGE_AD_SETTINGS: PageAdSetting[] = [
  { key: 'home', name: 'Homepage & Portal Hub', pathPattern: '/', enabled: true, category: 'Core Portal' },
  { key: 'rp_directory', name: 'FiveM RP Server Directory', pathPattern: '/servers', enabled: true, category: 'Core Portal' },
  { key: 'map', name: 'Interactive Map & POI Radar', pathPattern: '/map', enabled: true, category: 'Core Portal' },
  { key: 'vehicles', name: 'Vehicles Wiki Database', pathPattern: '/vehicles', enabled: true, category: 'Database & Wiki' },
  { key: 'weapons', name: 'Weapons Arsenal & Meta', pathPattern: '/weapons', enabled: true, category: 'Database & Wiki' },
  { key: 'news', name: 'News, Leaks & pSEO Hub', pathPattern: '/seo-hub', enabled: true, category: 'Database & Wiki' },
  { key: 'config_builder', name: 'txAdmin & Script Configurator', pathPattern: '/config-builder', enabled: true, category: 'Calculators & Tools' },
  { key: 'mod_calculator', name: 'Vehicle Modding Performance Calc', pathPattern: '/mod-calculator', enabled: true, category: 'Calculators & Tools' },
  { key: 'roi_calculator', name: 'Business ROI & Profitability Calc', pathPattern: '/roi-calculator', enabled: true, category: 'Calculators & Tools' },
  { key: 'comparison', name: 'Vehicle & Weapon Comparison', pathPattern: '/comparison', enabled: true, category: 'Calculators & Tools' }
];

const GLOBAL_ADS_KEY = 'vcc_global_ads_enabled';
const PAGE_ADS_KEY = 'vcc_page_ads_enabled_map';
const AD_TOGGLE_EVENT = 'vcc_ad_toggles_updated';

/**
 * Get current global ad enabled status
 */
export function getGlobalAdsEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const stored = localStorage.getItem(GLOBAL_ADS_KEY);
    return stored === null ? true : stored === 'true';
  } catch (e) {
    return true;
  }
}

/**
 * Set global ad enabled status
 */
export function setGlobalAdsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GLOBAL_ADS_KEY, String(enabled));
    window.dispatchEvent(new CustomEvent(AD_TOGGLE_EVENT, { detail: { type: 'global', enabled } }));
  } catch (e) {
    console.warn('Failed to save global ad setting:', e);
  }
}

/**
 * Get page ad map from localStorage
 */
export function getPageAdStateMap(): Record<string, boolean> {
  if (typeof window === 'undefined') {
    return DEFAULT_PAGE_AD_SETTINGS.reduce((acc, p) => ({ ...acc, [p.key]: true }), {});
  }
  try {
    const stored = localStorage.getItem(PAGE_ADS_KEY);
    if (!stored) {
      return DEFAULT_PAGE_AD_SETTINGS.reduce((acc, p) => ({ ...acc, [p.key]: true }), {});
    }
    return JSON.parse(stored);
  } catch (e) {
    return DEFAULT_PAGE_AD_SETTINGS.reduce((acc, p) => ({ ...acc, [p.key]: true }), {});
  }
}

/**
 * Check if ads are enabled for a specific page key
 */
export function isAdEnabledForPage(pageKey: string): boolean {
  if (!getGlobalAdsEnabled()) return false;
  const map = getPageAdStateMap();
  return map[pageKey] !== false; // Default to true if not explicitly set to false
}

/**
 * Check if ads are enabled for a given URL pathname
 */
export function isAdEnabledForPathname(pathname: string): boolean {
  if (!getGlobalAdsEnabled()) return false;
  const normalized = (pathname || '/').toLowerCase();

  const map = getPageAdStateMap();
  for (const page of DEFAULT_PAGE_AD_SETTINGS) {
    if (normalized === page.pathPattern || normalized.startsWith(page.pathPattern + '/')) {
      return map[page.key] !== false;
    }
  }
  return true;
}

/**
 * Set single page ad enabled status
 */
export function setPageAdEnabled(pageKey: string, enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    const map = getPageAdStateMap();
    map[pageKey] = enabled;
    localStorage.setItem(PAGE_ADS_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent(AD_TOGGLE_EVENT, { detail: { type: 'single', pageKey, enabled } }));
  } catch (e) {
    console.warn('Failed to save single page ad setting:', e);
  }
}

/**
 * Toggle all pages at once
 */
export function setAllPagesAdEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    const map: Record<string, boolean> = {};
    DEFAULT_PAGE_AD_SETTINGS.forEach((page) => {
      map[page.key] = enabled;
    });
    localStorage.setItem(PAGE_ADS_KEY, JSON.stringify(map));
    setGlobalAdsEnabled(enabled);
    window.dispatchEvent(new CustomEvent(AD_TOGGLE_EVENT, { detail: { type: 'all_pages', enabled } }));
  } catch (e) {
    console.warn('Failed to bulk toggle all page ad settings:', e);
  }
}

/**
 * Subscribe to ad toggle state changes
 */
export function subscribeAdToggles(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = () => callback();
  window.addEventListener(AD_TOGGLE_EVENT, handler);
  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener(AD_TOGGLE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}
