'use client';

import React, { useEffect, useRef, useState, useId, useTransition } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
  AdSlotType,
  AdPosition,
  AD_NETWORK_CONFIG,
  getAdSlotDimensions,
  AdUnitDimension
} from '../../lib/ad-config';
import { useAdEligibility } from '../../hooks/useAdEligibility';
import { useAdBlockDetector } from '../../hooks/useAdBlockDetector';
import { AdBlockSupportBanner } from './AdBlockSupportBanner';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Sparkles, Maximize2, Layers, X } from 'lucide-react';

export interface AdImpressionMetric {
  slotDomId: string;
  slotType: AdSlotType;
  activeSlotType?: AdSlotType;
  isAdapted?: boolean;
  adaptationLabel?: string;
  position: AdPosition;
  adSlotId?: string;
  pathname: string;
  viewportWidth: number;
  isViewable: boolean;
  intersectionRatio: number;
  deviceType: string;
  timestamp: string;
  timestampMs: number;
  refreshCycle?: number;
}

export interface AdSlotProps {
  /**
   * Standard IAB ad unit format
   * Default: 'responsive'
   */
  slotType?: AdSlotType;

  /**
   * Whether to dynamically adjust ad unit dimensions based on user's viewport width to improve engagement & prevent CLS
   * Default: true
   */
  enableDynamicSizing?: boolean;

  /**
   * Ad Unit Placement or Target Section
   */
  position?: AdPosition;

  /**
   * Google AdSense data-ad-slot ID
   */
  adSlotId?: string;

  /**
   * Google Ad Manager (GPT) ad unit path (e.g. /218471928/ViceCity_Header)
   */
  gptAdUnitPath?: string;

  /**
   * Custom publisher client ID override
   */
  adClient?: string;

  /**
   * Ad format for responsive tags (e.g. 'auto', 'horizontal', 'rectangle')
   */
  adFormat?: string;

  /**
   * Whether to enable full-width responsive tag
   */
  fullWidthResponsive?: boolean;

  /**
   * Custom CSS class name for the wrapper container
   */
  className?: string;

  /**
   * Whether to display the policy-compliant "ADVERTISEMENT" badge
   * Default: true
   */
  showLabel?: boolean;

  /**
   * Custom label text
   * Default: 'ADVERTISEMENT'
   */
  labelText?: string;

  /**
   * Lazy load root margin for IntersectionObserver
   * Default: '200px'
   */
  lazyOffset?: string;

  /**
   * Custom fallback React node when ads are blocked, unfilled, or in test mode
   */
  fallbackContent?: React.ReactNode;

  /**
   * Explicit user object override for VIP check
   */
  user?: any;

  /**
   * Test mode flag for development preview
   */
  isTestMode?: boolean;

  /**
   * Auto-refresh cycle duration in seconds (0 to disable)
   * Default: 60 (IAB standard view-time refresh)
   */
  refreshIntervalSeconds?: number;

  /**
   * Callback to open VIP checkout if ad-block banner is interacted with
   */
  onOpenVipCheckout?: () => void;
}

declare global {
  interface Window {
    adsbygoogle?: any[];
    googletag?: any;
  }
}

/**
 * High-performance, CLS-protected Ad Unit component with:
 * 1. 60-Second In-View Auto-Refresh Engine (cycles creative without page reload)
 * 2. Framer-Motion viewport entry transition animations
 * 3. Integrated gentle 'Support ViceIntel' Ad-Blocker detection callout
 * 4. IAB Viewable impression telemetry logged to Firestore
 */
export const AdSlot: React.FC<AdSlotProps> = ({
  slotType = 'responsive',
  enableDynamicSizing = true,
  position = 'inline',
  adSlotId = '1234567890',
  gptAdUnitPath,
  adClient = AD_NETWORK_CONFIG.adsenseClientId,
  adFormat = 'auto',
  fullWidthResponsive = true,
  className = '',
  showLabel = true,
  labelText = 'ADVERTISEMENT',
  lazyOffset = AD_NETWORK_CONFIG.defaultLazyRootMargin,
  fallbackContent,
  user,
  isTestMode = false,
  refreshIntervalSeconds = 60,
  onOpenVipCheckout
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rawId = useId().replace(/:/g, '');
  const slotDomId = `vcc-ad-${slotType}-${position}-${rawId}`;

  // Viewport & state indicators
  const [isInViewport, setIsInViewport] = useState(false);
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [hasAdError, setHasAdError] = useState(false);
  const [refreshCycle, setRefreshCycle] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewTimeSeconds, setViewTimeSeconds] = useState(0);
  const [isDockDismissed, setIsDockDismissed] = useState(false);
  const [isCalcInteracting, setIsCalcInteracting] = useState(false);

  // AdBlock detection state
  const { isAdBlockActive, isChecking: isAdBlockChecking } = useAdBlockDetector();

  const adPushedRef = useRef(false);
  const reportedImpressionRef = useRef(false);
  const isDocumentVisibleRef = useRef(true);

  // Evaluate route eligibility, user VIP suppression, and viewport dynamic dimensions
  const {
    isEligible,
    dimensions,
    activeSlotType,
    isAdapted,
    adaptationLabel,
    adaptationReason
  } = useAdEligibility({
    slotType,
    user,
    enableDynamicSizing
  });

  // Track document tab visibility so view-time timer only accumulates when active
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleVisibilityChange = () => {
      isDocumentVisibleRef.current = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Report impression visibility metrics to Firestore in a non-blocking background queue
  const recordImpressionMetric = (ratio: number, currentCycle: number) => {
    const reportTask = async () => {
      try {
        const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
        const deviceType = width < 640 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop';
        const pathname = typeof window !== 'undefined' ? window.location.pathname || '/' : '/';

        const metricData: AdImpressionMetric = {
          slotDomId,
          slotType,
          activeSlotType,
          isAdapted,
          adaptationLabel,
          position,
          adSlotId,
          pathname,
          viewportWidth: width,
          isViewable: ratio >= 0.5,
          intersectionRatio: Math.round(ratio * 100) / 100,
          deviceType,
          timestamp: new Date().toISOString(),
          timestampMs: Date.now(),
          refreshCycle: currentCycle
        };

        // Asynchronous non-blocking write to Firestore
        await addDoc(collection(db, 'ad_impressions'), metricData);
      } catch (err) {
        // Silently catch to prevent interrupting UI rendering if offline
        console.debug('[AdSlot] Impression telemetry notice (offline-safe):', err);
      }
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        reportTask();
      }, { timeout: 2000 });
    } else {
      setTimeout(reportTask, 150);
    }
  };

  // Setup Intersection Observer for lazy loading, viewability tracking & impression telemetry
  useEffect(() => {
    if (!isEligible) return;
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsInViewport(true);
      if (!reportedImpressionRef.current) {
        reportedImpressionRef.current = true;
        recordImpressionMetric(1.0, 0);
      }
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const isIntersecting = entry.isIntersecting && entry.intersectionRatio >= 0.35;
          setIsInViewport(isIntersecting);

          if (isIntersecting && !reportedImpressionRef.current) {
            reportedImpressionRef.current = true;
            recordImpressionMetric(entry.intersectionRatio, refreshCycle);
          }
        });
      },
      {
        rootMargin: lazyOffset,
        threshold: [0.05, 0.35, 0.5, 0.75, 1.0]
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [isEligible, lazyOffset, slotDomId, slotType, position, adSlotId, refreshCycle]);

  // 60-Second In-View Auto-Refresh Timer Engine
  useEffect(() => {
    if (!isEligible || refreshIntervalSeconds <= 0 || !isInViewport || isTestMode || isAdBlockActive) {
      return;
    }

    const interval = setInterval(() => {
      // Dynamic query: check if the user is actively interacting with ModBuilder or ROI calculator
      const interacting = typeof window !== 'undefined' &&
                           window.vccIsInteractingWithCalculator &&
                           window.vccIsInteractingWithCalculator();
      
      setIsCalcInteracting(interacting);

      if (interacting) {
        // Pause ad refresh timer during active tool interactions to optimize UX
        return;
      }

      // Only increment view-time if user has tab in focus and container is in viewport
      if (isDocumentVisibleRef.current && isInViewport) {
        setViewTimeSeconds((prev) => {
          const next = prev + 1;
          if (next >= refreshIntervalSeconds) {
            // Trigger seamless ad cycle
            triggerAdRefresh();
            return 0;
          }
          return next;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isEligible, refreshIntervalSeconds, isInViewport, isTestMode, isAdBlockActive]);

  // Handle ad cycle transition
  const triggerAdRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setRefreshCycle((prev) => {
        const nextCycle = prev + 1;
        adPushedRef.current = false;
        recordImpressionMetric(0.85, nextCycle);
        return nextCycle;
      });
      setIsRefreshing(false);
    }, 350);
  };

  // Push ad to AdSense / GPT queue once visible or refreshed
  useEffect(() => {
    if (!isEligible || !isInViewport || adPushedRef.current || isTestMode || isAdBlockActive) {
      return;
    }

    try {
      if (typeof window !== 'undefined') {
        // Google AdSense flow
        if (window.adsbygoogle && Array.isArray(window.adsbygoogle)) {
          window.adsbygoogle.push({});
          adPushedRef.current = true;
          setIsAdLoaded(true);
        } else {
          // If script is lazy loading, retry briefly
          const timer = setTimeout(() => {
            try {
              if (window.adsbygoogle && !adPushedRef.current) {
                window.adsbygoogle.push({});
                adPushedRef.current = true;
                setIsAdLoaded(true);
              }
            } catch (err) {
              console.debug('[AdSlot] AdSense push notice:', err);
              setHasAdError(true);
            }
          }, 600);
          return () => clearTimeout(timer);
        }
      }
    } catch (err) {
      console.debug('[AdSlot] Failed to initialize ad tag:', err);
      setHasAdError(true);
    }
  }, [isEligible, isInViewport, isTestMode, refreshCycle, isAdBlockActive]);

  // If user is VIP, on excluded route, or dismissed, completely unmount slot (0 layout footprint)
  if ((!isEligible && !isTestMode) || isDockDismissed) {
    return null;
  }

  // Pre-calculated styling dimensions to prevent Cumulative Layout Shift (CLS)
  const isMapDock = position === 'map_dock';
  const widthStyle = dimensions.width > 0 ? `${dimensions.width}px` : '100%';
  const heightStyle = dimensions.height > 0 ? `${dimensions.height}px` : 'auto';
  const minHeightStyle = `${dimensions.minHeight}px`;

  return (
    <motion.div
      ref={containerRef}
      id={`${slotDomId}-wrapper`}
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`relative mx-auto my-3 sm:my-5 md:my-6 px-1 sm:px-2 w-full max-w-full ${
        isMapDock
          ? 'fixed bottom-6 right-6 z-40 p-3 bg-zinc-900/95 backdrop-blur-md rounded-2xl border border-zinc-800 shadow-2xl shadow-black/80 ring-1 ring-cyan-500/20 max-w-[340px] sm:max-w-[420px]'
          : 'grid grid-cols-1 place-items-center'
      } ${className}`}
      style={{
        maxWidth: dimensions.width > 0 ? `${dimensions.width}px` : '100%',
        minHeight: dimensions.minHeight > 0 ? `${dimensions.minHeight + 24}px` : '90px',
        marginBottom: isMapDock ? `${AD_NETWORK_CONFIG.mapDockSafetyMarginPx}px` : undefined,
        marginRight: isMapDock ? `${AD_NETWORK_CONFIG.mapDockSafetyMarginPx}px` : undefined
      }}
      onClick={(e) => {
        // Prevent map click propagation on docked units (Accidental Click Protection)
        if (isMapDock) {
          e.stopPropagation();
        }
      }}
    >
      {/* Policy-Compliant Label Badge & In-View Auto-Refresh Indicator */}
      {showLabel && (
        <div className="flex items-center justify-between w-full mb-1.5 px-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase select-none">
              {labelText}
            </span>
            {refreshCycle > 0 && (
              <span className="px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 text-[9px] font-mono flex items-center gap-1">
                <RefreshCw className={`w-2.5 h-2.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Cycle #{refreshCycle}</span>
              </span>
            )}
            {isAdapted && adaptationLabel && (
              <span
                className="px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[9px] font-mono flex items-center gap-1"
                title={adaptationReason}
              >
                <Maximize2 className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                <span>{adaptationLabel}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isInViewport && refreshIntervalSeconds > 0 && !isAdBlockActive && (
              <span className="text-[9px] font-mono text-zinc-500 hidden sm:inline" title="In-view auto-refresh timer">
                {isCalcInteracting ? (
                  <span className="text-amber-400 font-bold animate-pulse">Refreshes Paused</span>
                ) : (
                  `Refresh in ${Math.max(0, refreshIntervalSeconds - viewTimeSeconds)}s`
                )}
              </span>
            )}
            <span className="text-[9px] text-zinc-600 font-mono select-none">
              {activeSlotType.toUpperCase()}
            </span>
            {isMapDock && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDockDismissed(true);
                }}
                className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
                title="Dismiss Ad"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Zero-CLS Container with Pre-Allocated Layout Space */}
      <div
        id={slotDomId}
        className={`relative overflow-hidden rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-center ${
          dimensions.className
        }`}
        style={{
          width: widthStyle,
          height: heightStyle,
          minHeight: minHeightStyle,
          aspectRatio: dimensions.aspectRatio !== 'auto' ? dimensions.aspectRatio : undefined
        }}
      >
        {/* Ad-Blocker Detected Banner Fallback */}
        {isAdBlockActive && !isAdBlockChecking ? (
          <div className="w-full h-full p-2 flex items-center justify-center">
            <AdBlockSupportBanner
              onOpenVipCheckout={onOpenVipCheckout}
              className="w-full h-full my-0 border-amber-500/40"
              variant="compact"
            />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`ad-creative-cycle-${refreshCycle}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full flex items-center justify-center"
            >
              {/* Pre-allocated Skeleton Placeholder (Active while loading creative) */}
              {!isAdLoaded && !hasAdError && !isTestMode && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/40 p-4 animate-pulse pointer-events-none"
                  aria-hidden="true"
                >
                  <div className="w-8 h-8 rounded-lg bg-zinc-800/80 mb-2 border border-zinc-700/50 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-cyan-500/40 animate-ping" />
                  </div>
                  <div className="h-2 w-24 bg-zinc-800 rounded mb-1" />
                  <div className="h-1.5 w-16 bg-zinc-800/60 rounded" />
                </div>
              )}

              {/* Test Mode Mock Creative */}
              {isTestMode ? (
                <div className="w-full h-full p-4 flex flex-col items-center justify-center text-center bg-gradient-to-br from-zinc-900 to-zinc-950 border border-rose-500/30 rounded-xl relative">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap justify-center">
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold uppercase tracking-wider">
                      Test Creative Preview
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-mono font-bold">
                      60s Refresh Active
                    </span>
                    {isAdapted && (
                      <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-mono font-bold">
                        Adapted: {activeSlotType}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-zinc-300">
                    {activeSlotType.toUpperCase()} ({dimensions.width || 'Auto'}x{dimensions.height || dimensions.minHeight})
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Client: {adClient} | Slot: {adSlotId} | Cycle: {refreshCycle}
                  </p>
                </div>
              ) : hasAdError && fallbackContent ? (
                /* Fallback Slot Content (e.g. Server Sponsorship or VIP Promo) */
                <div className="w-full h-full flex items-center justify-center">{fallbackContent}</div>
              ) : (
                /* Google AdSense / GPT Tag Container */
                isInViewport && (
                  <ins
                    className="adsbygoogle"
                    style={{
                      display: 'block',
                      width: widthStyle,
                      height: heightStyle,
                      minHeight: minHeightStyle
                    }}
                    data-ad-client={adClient}
                    data-ad-slot={adSlotId}
                    data-ad-format={adFormat}
                    data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
                  />
                )
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
};
