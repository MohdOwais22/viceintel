'use client';

import React, { useEffect, useState, useRef } from 'react';
import { AD_NETWORK_CONFIG } from '../../lib/ad-config';
import { useAdEligibility } from '../../hooks/useAdEligibility';

declare global {
  interface Window {
    googletag?: any;
    vccIsInteractingWithCalculator?: () => boolean;
    vccLastCalculatorInteraction?: number;
  }
}

export interface AdScriptLoaderProps {
  /**
   * Google AdSense Client ID override
   */
  clientId?: string;

  /**
   * Whether to also load Google Publisher Tag (GPT)
   */
  enableGpt?: boolean;

  /**
   * Optional custom user object override
   */
  user?: any;

  /**
   * Additional custom ad network script URLs
   */
  additionalScripts?: string[];
}

/**
 * Context-Aware Third-Party Ad Script Injector.
 *
 * Implements lazyOnload strategy to ensure zero impact on First Input Delay (FID)
 * and Largest Contentful Paint (LCP).
 * Completely suppresses third-party ad scripts for VIP members and excluded routes.
 */
export const AdScriptLoader: React.FC<AdScriptLoaderProps> = ({
  clientId = AD_NETWORK_CONFIG.adsenseClientId,
  enableGpt = false,
  user,
  additionalScripts = []
}) => {
  const { isEligible, isVip, isExcluded, pathname } = useAdEligibility({ user });
  const [scriptsInjected, setScriptsInjected] = useState(false);
  const isHydratedRef = useRef(false);

  useEffect(() => {
    isHydratedRef.current = true;
  }, []);

  // Centralized interaction tracker to pause ad refreshes while using ModBuilder or ROI calculator
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.vccLastCalculatorInteraction = 0;
    window.vccIsInteractingWithCalculator = () => {
      const isCalcPath = window.location.pathname.includes('mod-calculator') || 
                         window.location.pathname.includes('roi-calculator');
      if (!isCalcPath) return false;

      const lastInt = window.vccLastCalculatorInteraction || 0;
      // Consider user actively interacting if they performed an action within the last 60 seconds
      return (Date.now() - lastInt) < 60000;
    };

    const handleInteraction = () => {
      const isCalcPath = window.location.pathname.includes('mod-calculator') || 
                         window.location.pathname.includes('roi-calculator');
      if (isCalcPath) {
        window.vccLastCalculatorInteraction = Date.now();
      }
    };

    const events = ['click', 'input', 'change', 'keydown', 'mousedown', 'pointerdown', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, handleInteraction, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleInteraction);
      });
    };
  }, []);

  useEffect(() => {
    // If not eligible (e.g. user is VIP or route is excluded), do not inject any ad scripts
    if (!isEligible) {
      return;
    }

    if (scriptsInjected || typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    // Lazy load after window load / main thread hydration is idle
    const injectScripts = () => {
      // 1. Inject Google AdSense Tag
      const existingAdSense = document.querySelector(`script[src*="pagead2.googlesyndication.com"]`);
      if (!existingAdSense && clientId) {
        const adSenseScript = document.createElement('script');
        adSenseScript.id = 'vcc-adsense-sdk';
        adSenseScript.src = `${AD_NETWORK_CONFIG.adsenseScriptUrl}?client=${clientId}`;
        adSenseScript.async = true;
        adSenseScript.crossOrigin = 'anonymous';
        adSenseScript.setAttribute('data-ad-client', clientId);
        document.head.appendChild(adSenseScript);
      }

      // 2. Inject Google Publisher Tag (GPT) if enabled
      if (enableGpt) {
        const existingGpt = document.querySelector(`script[src*="securepubads.g.doubleclick.net"]`);
        if (!existingGpt) {
          const gptScript = document.createElement('script');
          gptScript.id = 'vcc-gpt-sdk';
          gptScript.src = AD_NETWORK_CONFIG.gptScriptUrl;
          gptScript.async = true;
          gptScript.crossOrigin = 'anonymous';
          document.head.appendChild(gptScript);

          window.googletag = window.googletag || { cmd: [] };
        }
      }

      // 3. Additional Custom Network Scripts (NitroPay, Playwire, etc.)
      for (const scriptUrl of additionalScripts) {
        const existingCustom = document.querySelector(`script[src="${scriptUrl}"]`);
        if (!existingCustom) {
          const customScript = document.createElement('script');
          customScript.src = scriptUrl;
          customScript.async = true;
          document.head.appendChild(customScript);
        }
      }

      setScriptsInjected(true);
    };

    // Schedule lazyOnload using requestIdleCallback or setTimeout
    if ('requestIdleCallback' in window) {
      const handle = (window as any).requestIdleCallback(injectScripts, { timeout: 2000 });
      return () => {
        if ('cancelIdleCallback' in window) {
          (window as any).cancelIdleCallback(handle);
        }
      };
    } else {
      const timer = setTimeout(injectScripts, 1200);
      return () => clearTimeout(timer);
    }
  }, [isEligible, scriptsInjected, clientId, enableGpt, additionalScripts, pathname]);

  // Zero DOM footprint
  return null;
};
