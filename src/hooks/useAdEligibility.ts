'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  isRouteExcludedFromAds,
  isRouteEligibleForAds,
  isUserAdFree,
  getAdSlotDimensions,
  getAdaptiveAdDimensions,
  AdSlotType,
  AdUnitDimension
} from '../lib/ad-config';
import { isAdEnabledForPathname, subscribeAdToggles } from '../lib/adToggleStore';

/**
 * Safely resolves the current browser or Next.js route pathname.
 */
function resolveCurrentPathname(): string {
  if (typeof window === 'undefined') return '/';
  return window.location.pathname || '/';
}

/**
 * Hook to inspect whether the current active route matches ad exclusion blacklists.
 *
 * @param customPathname Optional explicit pathname override (e.g. for SSR / Next.js layout)
 */
export function useAdExclusion(customPathname?: string) {
  const [pathname, setPathname] = useState<string>(() => customPathname || resolveCurrentPathname());

  useEffect(() => {
    if (customPathname) {
      setPathname(customPathname);
      return;
    }

    const updatePathname = () => {
      setPathname(resolveCurrentPathname());
    };

    updatePathname();

    // Listen to client-side popstate and pushState navigation
    window.addEventListener('popstate', updatePathname);

    // Custom route change events
    window.addEventListener('locationchange', updatePathname);

    return () => {
      window.removeEventListener('popstate', updatePathname);
      window.removeEventListener('locationchange', updatePathname);
    };
  }, [customPathname]);

  const isExcluded = useMemo(() => isRouteExcludedFromAds(pathname), [pathname]);
  const isEligibleRoute = useMemo(() => isRouteEligibleForAds(pathname), [pathname]);

  const reason = useMemo(() => {
    if (isExcluded) return 'Route is blacklisted from ad monetization (mission-critical workflow).';
    if (!isEligibleRoute) return 'Route is outside the monetization whitelist.';
    return null;
  }, [isExcluded, isEligibleRoute]);

  return {
    isExcluded,
    isEligibleRoute,
    pathname,
    reason
  };
}

export interface AdEligibilityOptions {
  slotType?: AdSlotType;
  minWidth?: number;
  user?: any;
  customPathname?: string;
  enableDynamicSizing?: boolean;
}

export interface AdEligibilityResult {
  isEligible: boolean;
  isVip: boolean;
  isExcluded: boolean;
  pathname: string;
  reason: string | null;
  dimensions: AdUnitDimension;
  activeSlotType: AdSlotType;
  isAdapted: boolean;
  adaptationLabel?: string;
  adaptationReason?: string;
  viewportWidth: number;
}

/**
 * Comprehensive React Hook evaluating pathnames, VIP/subscriber status,
 * and viewport constraints to determine ad slot display eligibility.
 */
export function useAdEligibility(options: AdEligibilityOptions = {}): AdEligibilityResult {
  const {
    slotType = 'responsive',
    minWidth = 0,
    user: explicitUser,
    customPathname,
    enableDynamicSizing = true
  } = options;
  const { user: authUser, profile } = useAuth();

  // Combine auth state
  const currentUser = explicitUser || profile || authUser;

  // Track route exclusion
  const { isExcluded, pathname, reason: routeReason } = useAdExclusion(customPathname);

  // Track viewport width for responsive rendering
  const [viewportWidth, setViewportWidth] = useState<number>(() => {
    if (typeof window === 'undefined') return 1200;
    return window.innerWidth || 1200;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setViewportWidth(window.innerWidth || 1200);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Track admin ad toggle state
  const [adminAdTogglesEnabled, setAdminAdTogglesEnabled] = useState<boolean>(() => isAdEnabledForPathname(pathname));

  useEffect(() => {
    setAdminAdTogglesEnabled(isAdEnabledForPathname(pathname));
    const unsubscribe = subscribeAdToggles(() => {
      setAdminAdTogglesEnabled(isAdEnabledForPathname(pathname));
    });
    return unsubscribe;
  }, [pathname]);

  // Compute VIP ad-free status
  const isVip = useMemo(() => isUserAdFree(currentUser), [currentUser]);

  // Compute Dynamic Adaptive Slot Dimensions
  const adaptiveResult = useMemo(
    () => getAdaptiveAdDimensions(slotType, viewportWidth, enableDynamicSizing),
    [slotType, viewportWidth, enableDynamicSizing]
  );

  const { activeSlotType, dimensions, isAdapted, adaptationLabel, adaptationReason } = adaptiveResult;

  // Viewport minimum constraint check
  const meetsViewportConstraint = useMemo(() => {
    const requiredWidth = minWidth > 0 ? minWidth : dimensions.minWidth;
    if (requiredWidth <= 0) return true;
    return viewportWidth >= requiredWidth;
  }, [viewportWidth, minWidth, dimensions.minWidth]);

  // Final composite eligibility calculation
  const { isEligible, reason } = useMemo(() => {
    if (!adminAdTogglesEnabled) {
      return {
        isEligible: false,
        reason: 'Ads are disabled for this page or globally in Admin Panel.'
      };
    }

    if (isVip) {
      return {
        isEligible: false,
        reason: 'User holds active VIP / Pro subscription (Ad-Free Experience).'
      };
    }

    if (isExcluded) {
      return {
        isEligible: false,
        reason: routeReason || 'Route is excluded from ad placements.'
      };
    }

    if (!meetsViewportConstraint) {
      return {
        isEligible: false,
        reason: `Viewport width (${viewportWidth}px) is smaller than required minimum (${dimensions.minWidth}px).`
      };
    }

    return {
      isEligible: true,
      reason: null
    };
  }, [isVip, isExcluded, routeReason, meetsViewportConstraint, viewportWidth, dimensions.minWidth]);

  return {
    isEligible,
    isVip,
    isExcluded,
    pathname,
    reason,
    dimensions,
    activeSlotType,
    isAdapted,
    adaptationLabel,
    adaptationReason,
    viewportWidth
  };
}
