'use client';

import { useState, useEffect } from 'react';

/**
 * Lightweight client-side ad-block detection utility.
 * Checks for script blocking, DOM bait filtering, and network rule triggers.
 */
export function useAdBlockDetector(): { isAdBlockActive: boolean; isChecking: boolean } {
  const [isAdBlockActive, setIsAdBlockActive] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;

    const performAdBlockCheck = async () => {
      // 1. Create a honeypot DOM element with standard ad classes and attributes that popular ad-blockers hide
      const bait = document.createElement('div');
      bait.setAttribute('aria-hidden', 'true');
      bait.className = 'adsbox ad-unit ad-placement banner-ad textads sponsor-ad google-ad';
      bait.style.position = 'absolute';
      bait.style.left = '-9999px';
      bait.style.top = '-9999px';
      bait.style.width = '1px';
      bait.style.height = '1px';
      bait.style.pointerEvents = 'none';
      bait.innerHTML = '&nbsp;';

      document.body.appendChild(bait);

      // Brief delay to allow cosmetic filtering / style injection to apply
      await new Promise((resolve) => setTimeout(resolve, 150));

      let blocked = false;

      // Check bait visibility / computed style
      if (
        bait.offsetParent === null ||
        bait.offsetHeight === 0 ||
        bait.offsetLeft === 0 ||
        bait.offsetTop === 0 ||
        bait.offsetWidth === 0 ||
        bait.clientHeight === 0 ||
        bait.clientWidth === 0
      ) {
        blocked = true;
      }

      if (window.getComputedStyle) {
        const style = window.getComputedStyle(bait);
        if (
          style.display === 'none' ||
          style.visibility === 'hidden' ||
          style.opacity === '0'
        ) {
          blocked = true;
        }
      }

      // 2. Perform a probe to a standard dummy ad resource endpoint (fails with ERR_BLOCKED_BY_CLIENT if adblocker is active)
      if (!blocked) {
        try {
          const testRequest = new Request(
            'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
            { method: 'HEAD', mode: 'no-cors' }
          );
          await fetch(testRequest);
        } catch {
          // If fetch fails in browser, might be blocked by uBlock Origin / AdGuard / Brave Shields
          blocked = true;
        }
      }

      // Cleanup honeypot DOM node
      if (bait.parentNode) {
        bait.parentNode.removeChild(bait);
      }

      if (isMounted) {
        setIsAdBlockActive(blocked);
        setIsChecking(false);
      }
    };

    // Defer check using requestIdleCallback / setTimeout
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(performAdBlockCheck, { timeout: 1500 });
    } else {
      setTimeout(performAdBlockCheck, 300);
    }

    return () => {
      isMounted = false;
    };
  }, []);

  return { isAdBlockActive, isChecking };
}
