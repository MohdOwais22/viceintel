/**
 * ViceIntel Cookie & Privacy Consent Management Engine
 * Provides GDPR / ePrivacy / CCPA compliant consent management,
 * Google Tag Consent Mode v2 updates, and client-side persistence.
 */

export interface CookiePreferences {
  hasChosen: boolean;
  timestamp: number;
  essential: boolean; // Strictly necessary (Auth, CSRF, Core State) - always true
  analytics: boolean; // Google Analytics 4 telemetry
  functional: boolean; // IndexedDB offline vehicle/map caching, audio prefs
  marketing: boolean; // Ad networks, sponsored server spots
}

export const COOKIE_CONSENT_STORAGE_KEY = 'vice_cookie_consent_v1';
export const COOKIE_CONSENT_EVENT = 'vice:cookie-consent-updated';
export const OPEN_COOKIE_MODAL_EVENT = 'vice:open-cookie-preferences';

export const DEFAULT_PREFERENCES: CookiePreferences = {
  hasChosen: false,
  timestamp: 0,
  essential: true,
  analytics: true,
  functional: true,
  marketing: true
};

/**
 * Safely reads stored cookie preferences from localStorage.
 */
export function getCookiePreferences(): CookiePreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw);
    return {
      hasChosen: Boolean(parsed.hasChosen),
      timestamp: Number(parsed.timestamp) || 0,
      essential: true, // Always locked to true
      analytics: parsed.analytics !== undefined ? Boolean(parsed.analytics) : true,
      functional: parsed.functional !== undefined ? Boolean(parsed.functional) : true,
      marketing: true // Revenue and sponsored server spots remain active (ad-free via VIP Pass)
    };
  } catch (err) {
    console.warn('[CookieConsent] Failed to read stored preferences:', err);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Updates Google Analytics Consent Mode v2 based on user preferences.
 */
export function updateGoogleAnalyticsConsent(analyticsAllowed: boolean, marketingAllowed: boolean) {
  if (typeof window === 'undefined') return;

  const dataLayer = (window.dataLayer = window.dataLayer || []);
  const gtag = (window.gtag = window.gtag || function () {
    dataLayer.push(arguments);
  });

  try {
    gtag('consent', 'update', {
      analytics_storage: analyticsAllowed ? 'granted' : 'denied',
      ad_storage: marketingAllowed ? 'granted' : 'denied',
      ad_user_data: marketingAllowed ? 'granted' : 'denied',
      ad_personalization: marketingAllowed ? 'granted' : 'denied'
    });
  } catch (err) {
    // Non-blocking fallback
  }
}

/**
 * Persists cookie preferences to localStorage and dispatches a global update event.
 */
export function saveCookiePreferences(newPrefs: Partial<CookiePreferences>): CookiePreferences {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_PREFERENCES, ...newPrefs, hasChosen: true, timestamp: Date.now() };
  }

  const updated: CookiePreferences = {
    hasChosen: true,
    timestamp: Date.now(),
    essential: true,
    analytics: newPrefs.analytics !== undefined ? Boolean(newPrefs.analytics) : true,
    functional: newPrefs.functional !== undefined ? Boolean(newPrefs.functional) : true,
    marketing: true // Ad revenue & sponsored spots remain active (ad-free via VIP Pass)
  };

  try {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('[CookieConsent] Failed to write preferences to localStorage:', err);
  }

  // Update GA Consent Mode
  updateGoogleAnalyticsConsent(updated.analytics, updated.marketing);

  // Notify listeners across components
  try {
    window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: updated }));
  } catch (err) {
    // Non-blocking fallback
  }

  return updated;
}

/**
 * Accept all cookies (Analytics, Functional, Marketing).
 */
export function acceptAllCookies(): CookiePreferences {
  return saveCookiePreferences({
    essential: true,
    analytics: true,
    functional: true,
    marketing: true
  });
}

/**
 * Accept essential cookies only (Strictly necessary, no tracking).
 */
export function acceptEssentialOnly(): CookiePreferences {
  return saveCookiePreferences({
    essential: true,
    analytics: false,
    functional: true,
    marketing: true
  });
}

/**
 * Checks whether the user has already made an explicit consent choice.
 */
export function hasUserConsented(): boolean {
  return getCookiePreferences().hasChosen;
}

/**
 * Checks if analytics cookies have been granted.
 */
export function hasAnalyticsConsent(): boolean {
  const prefs = getCookiePreferences();
  return prefs.hasChosen && prefs.analytics;
}

/**
 * Re-opens the cookie preferences modal anywhere in the app.
 */
export function openCookiePreferencesModal() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(OPEN_COOKIE_MODAL_EVENT));
}

/**
 * Subscribes to cookie consent changes.
 */
export function subscribeCookiePreferences(callback: (prefs: CookiePreferences) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<CookiePreferences>;
    if (customEvent.detail) {
      callback(customEvent.detail);
    } else {
      callback(getCookiePreferences());
    }
  };

  window.addEventListener(COOKIE_CONSENT_EVENT, handler);
  return () => {
    window.removeEventListener(COOKIE_CONSENT_EVENT, handler);
  };
}

/**
 * Subscribes to requests to open the cookie preferences modal.
 */
export function subscribeOpenPreferencesModal(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = () => {
    callback();
  };

  window.addEventListener(OPEN_COOKIE_MODAL_EVENT, handler);
  return () => {
    window.removeEventListener(OPEN_COOKIE_MODAL_EVENT, handler);
  };
}
