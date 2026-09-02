import { useState, useEffect } from 'react';
import { ENV } from './envConfig';
import { db } from './firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { safeFirestoreWrite, markFirestoreQuotaExhausted, isResourceExhaustedError } from './firebase/firestoreCircuitBreaker';

export interface SystemPricingConfig {
  vipPrice: number;
  vipVcValue: number;
  vcRatePerDollar: number;
  sponsorPrice12: number;
  sponsorPrice29: number;
  b2bSponsorPrice: number;
  sponsorPrice99: number;
  sponsorPrice199: number;
  currencySymbol: string;
  promoBadgeText: string;
  updatedAt?: string;
  updatedBy?: string;
}

// Global pricing state in memory initialized from ENV defaults
let currentPricing: SystemPricingConfig = {
  vipPrice: isNaN(ENV.VIP_PRICE) ? 3.99 : ENV.VIP_PRICE,
  vipVcValue: 19995,
  vcRatePerDollar: 5000,
  sponsorPrice12: isNaN(ENV.PAYMENT_PRICE_12) ? 12.00 : ENV.PAYMENT_PRICE_12,
  sponsorPrice29: isNaN(ENV.PAYMENT_PRICE_29) ? 29.00 : ENV.PAYMENT_PRICE_29,
  b2bSponsorPrice: isNaN(ENV.B2B_SPONSOR_PRICE) ? 49.00 : ENV.B2B_SPONSOR_PRICE,
  sponsorPrice99: isNaN(ENV.PAYMENT_PRICE_99) ? 99.00 : ENV.PAYMENT_PRICE_99,
  sponsorPrice199: isNaN(ENV.PAYMENT_PRICE_199) ? 199.00 : ENV.PAYMENT_PRICE_199,
  currencySymbol: '$',
  promoBadgeText: 'SPECIAL COMMUNITY DISCOUNT',
  updatedAt: new Date().toISOString(),
  updatedBy: 'System Environment'
};

const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach(listener => listener());
}

// Initialize real-time Firestore synchronization for pricing in client environment
let isFirestoreListenerInitialized = false;

export function initPricingListener() {
  if (typeof window === 'undefined' || isFirestoreListenerInitialized) return;
  isFirestoreListenerInitialized = true;

  try {
    const docRef = doc(db, 'systemConfig', 'pricing');
    onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        currentPricing = {
          vipPrice: typeof data.vipPrice === 'number' && !isNaN(data.vipPrice) ? data.vipPrice : currentPricing.vipPrice,
          vipVcValue: typeof data.vipVcValue === 'number' && !isNaN(data.vipVcValue) ? data.vipVcValue : currentPricing.vipVcValue,
          vcRatePerDollar: typeof data.vcRatePerDollar === 'number' && !isNaN(data.vcRatePerDollar) ? data.vcRatePerDollar : currentPricing.vcRatePerDollar,
          sponsorPrice12: typeof data.sponsorPrice12 === 'number' && !isNaN(data.sponsorPrice12) ? data.sponsorPrice12 : currentPricing.sponsorPrice12,
          sponsorPrice29: typeof data.sponsorPrice29 === 'number' && !isNaN(data.sponsorPrice29) ? data.sponsorPrice29 : currentPricing.sponsorPrice29,
          b2bSponsorPrice: typeof data.b2bSponsorPrice === 'number' && !isNaN(data.b2bSponsorPrice) ? data.b2bSponsorPrice : currentPricing.b2bSponsorPrice,
          sponsorPrice99: typeof data.sponsorPrice99 === 'number' && !isNaN(data.sponsorPrice99) ? data.sponsorPrice99 : currentPricing.sponsorPrice99,
          sponsorPrice199: typeof data.sponsorPrice199 === 'number' && !isNaN(data.sponsorPrice199) ? data.sponsorPrice199 : currentPricing.sponsorPrice199,
          currencySymbol: data.currencySymbol || currentPricing.currencySymbol,
          promoBadgeText: data.promoBadgeText || currentPricing.promoBadgeText,
          updatedAt: data.updatedAt || currentPricing.updatedAt,
          updatedBy: data.updatedBy || currentPricing.updatedBy
        };
        notifyListeners();
      }
    }, (err) => {
      if (isResourceExhaustedError(err)) {
        markFirestoreQuotaExhausted(err);
      } else {
        console.warn('Pricing Firestore onSnapshot warning:', err);
      }
    });
  } catch (e) {
    console.warn('Failed to attach pricing listener:', e);
  }
}

// Auto-boot listener in browser
if (typeof window !== 'undefined') {
  initPricingListener();
}

/**
 * Get current numeric B2C VIP price
 */
export function getVipPriceNumber(): number {
  return currentPricing.vipPrice;
}

/**
 * Get formatted B2C VIP price (e.g. "$3.99")
 */
export function getVipPriceFormatted(): string {
  const symbol = currentPricing.currencySymbol || '$';
  return `${symbol}${currentPricing.vipPrice.toFixed(2)}`;
}

/**
 * Get formatted B2C VIP price text with interval (e.g. "$3.99/mo")
 */
export function getVipPriceText(interval: string = '/mo'): string {
  return `${getVipPriceFormatted()}${interval}`;
}

/**
 * Get configured VC granted when purchasing VIP Subscription Pass
 */
export function getVipVcGrantedNumber(): number {
  return currentPricing.vipVcValue || 19995;
}

/**
 * Get configured VC exchange rate per $1.00 USD
 */
export function getVcRatePerDollar(): number {
  return currentPricing.vcRatePerDollar || 5000;
}

/**
 * Calculate Vice Cash (VC) from USD dollar amount based on CMS exchange rates
 */
export function calculateVcForUsd(usdAmount: number): number {
  if (usdAmount <= 0) return 0;
  // If exact VIP pass price, return exact VIP pass VC allocation
  if (Math.abs(usdAmount - currentPricing.vipPrice) < 0.05) {
    return currentPricing.vipVcValue || 19995;
  }
  const rate = currentPricing.vcRatePerDollar || 5000;
  return Math.round(usdAmount * rate);
}

/**
 * Get current numeric B2B Sponsor price
 */
export function getB2bSponsorPriceNumber(): number {
  return currentPricing.b2bSponsorPrice;
}

/**
 * Get formatted B2B Sponsor price (e.g. "$49.00")
 */
export function getB2bSponsorPriceFormatted(): string {
  const symbol = currentPricing.currencySymbol || '$';
  return `${symbol}${currentPricing.b2bSponsorPrice.toFixed(2)}`;
}

/**
 * Get formatted B2B Sponsor price text with interval (e.g. "$49.00/mo")
 */
export function getB2bSponsorPriceText(interval: string = '/mo'): string {
  return `${getB2bSponsorPriceFormatted()}${interval}`;
}

/**
 * React hook for components needing real-time reactive pricing updates
 */
export function usePricingConfig(): SystemPricingConfig & {
  vipFormatted: string;
  vipText: string;
  sponsorFormatted: string;
  sponsorText: string;
} {
  const [pricing, setPricing] = useState<SystemPricingConfig>(currentPricing);

  useEffect(() => {
    initPricingListener();
    const handleUpdate = () => setPricing({ ...currentPricing });
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  return {
    ...pricing,
    vipFormatted: `${pricing.currencySymbol || '$'}${pricing.vipPrice.toFixed(2)}`,
    vipText: `${pricing.currencySymbol || '$'}${pricing.vipPrice.toFixed(2)}/mo`,
    sponsorFormatted: `${pricing.currencySymbol || '$'}${pricing.b2bSponsorPrice.toFixed(2)}`,
    sponsorText: `${pricing.currencySymbol || '$'}${pricing.b2bSponsorPrice.toFixed(2)}/mo`
  };
}

/**
 * Update pricing configuration in Firestore & Server API
 */
export async function updatePricingConfigInFirestore(newConfig: Partial<SystemPricingConfig>, updatedBy: string = 'Admin HQ') {
  const updated: SystemPricingConfig = {
    ...currentPricing,
    ...newConfig,
    updatedAt: new Date().toISOString(),
    updatedBy
  };

  // 1. Local Memory Update
  currentPricing = updated;
  notifyListeners();

  // 2. Firestore Sync
  await safeFirestoreWrite(async () => {
    const docRef = doc(db, 'systemConfig', 'pricing');
    await setDoc(docRef, updated, { merge: true });
  });

  // 3. Server API Sync
  try {
    await fetch('/api/system/pricing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
  } catch (apiErr) {
    console.warn('Failed to update pricing on server API:', apiErr);
  }

  return updated;
}
