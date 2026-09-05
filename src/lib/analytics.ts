/**
 * Google Analytics (GA4) Integration Helper for ViceIntel
 * Handles dynamic GA script loading, pageview tracking, and custom event tracking.
 */

import { ENV } from './envConfig';
import { getCookiePreferences } from './cookieConsent';

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export const GA_MEASUREMENT_ID = (
  ENV.GA_MEASUREMENT_ID ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.GA_MEASUREMENT_ID) ||
  (typeof process !== 'undefined' && process.env && process.env.GA_MEASUREMENT_ID) ||
  'G-VICE2026INTEL'
);

let isGaInitialized = false;

/**
 * Initializes Google Analytics 4 dynamically with Google Consent Mode v2.
 */
export function initGoogleAnalytics(measurementId: string = GA_MEASUREMENT_ID) {
  if (typeof window === 'undefined' || !measurementId) return;
  if (isGaInitialized) return;

  const prefs = getCookiePreferences();

  // Initialize dataLayer and gtag function
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };

  // Set initial consent state before config
  window.gtag('consent', 'default', {
    analytics_storage: prefs.hasChosen && prefs.analytics ? 'granted' : 'denied',
    ad_storage: prefs.hasChosen && prefs.marketing ? 'granted' : 'denied',
    ad_user_data: prefs.hasChosen && prefs.marketing ? 'granted' : 'denied',
    ad_personalization: prefs.hasChosen && prefs.marketing ? 'granted' : 'denied'
  });

  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: false, // Pageviews are triggered programmatically on route/tab switches
    cookie_flags: 'SameSite=None;Secure'
  });

  // Inject Google Tag Manager script if not already present
  const scriptId = 'ga-gtag-script';
  if (!document.getElementById(scriptId)) {
    const script = document.createElement('script');
    script.id = scriptId;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
  }

  isGaInitialized = true;
}

/**
 * Tracks a pageview event in GA4.
 */
export function trackPageView(path: string, title?: string) {
  if (typeof window === 'undefined') return;

  const prefs = getCookiePreferences();
  // If user made a choice and refused analytics, skip tracking
  if (prefs.hasChosen && !prefs.analytics) return;

  if (!isGaInitialized) {
    initGoogleAnalytics();
  }

  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title || document.title,
      page_location: window.location.href,
      send_to: GA_MEASUREMENT_ID
    });
  }
}

/**
 * Tracks custom user interactions and analytics events in GA4.
 */
export function trackEvent(
  action: string,
  category: string,
  label?: string,
  value?: number
) {
  if (typeof window === 'undefined') return;

  const prefs = getCookiePreferences();
  // If user made a choice and refused analytics, skip tracking
  if (prefs.hasChosen && !prefs.analytics) return;

  if (!isGaInitialized) {
    initGoogleAnalytics();
  }

  if (typeof window.gtag === 'function') {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      send_to: GA_MEASUREMENT_ID
    });
  }
}
