/**
 * Dynamic Affiliate Partner Store & Synchronization Engine
 * Vice City Central Platform
 */

import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { AFFILIATE_PARTNERS, AffiliatePartner } from './affiliate-config';

const EVENT_AFFILIATES_UPDATED = 'vcc_affiliates_updated';

// In-memory runtime cache of active partner configurations
let runtimeAffiliatesCache: Record<string, AffiliatePartner> = { ...AFFILIATE_PARTNERS };
let isInitialized = false;

/**
 * Initializes the affiliate cache by reading custom overrides from Firestore
 */
export async function initializeAffiliatesStore(): Promise<Record<string, AffiliatePartner>> {
  if (isInitialized) return runtimeAffiliatesCache;

  try {
    const snap = await getDocs(collection(db, 'affiliate_partners'));
    if (!snap.empty) {
      const loadedMap: Record<string, AffiliatePartner> = { ...AFFILIATE_PARTNERS };
      snap.forEach((docSnap) => {
        const data = docSnap.data() as AffiliatePartner;
        if (data && data.id) {
          loadedMap[data.id] = {
            ...AFFILIATE_PARTNERS[data.id],
            ...data
          };
        }
      });
      runtimeAffiliatesCache = loadedMap;
    }
    isInitialized = true;
  } catch (err) {
    console.warn('[Affiliate Store] Initialization warning (using fallback defaults):', err);
  }

  return runtimeAffiliatesCache;
}

/**
 * Returns the current runtime map of affiliate partners
 */
export function getActiveAffiliatePartners(): Record<string, AffiliatePartner> {
  return runtimeAffiliatesCache;
}

/**
 * Get a single partner configuration by ID
 */
export function getAffiliatePartnerById(id: string): AffiliatePartner {
  return runtimeAffiliatesCache[id] || AFFILIATE_PARTNERS[id] || {
    id,
    name: 'Official Partner',
    category: 'hosting',
    targetUrl: 'https://viceintel.app',
    isActive: true,
    commissionType: 'recurring',
    allowedRedirectDomains: ['viceintel.app']
  };
}

/**
 * Saves or updates an affiliate partner configuration in Firestore and updates local state
 */
export async function updateAffiliatePartner(partner: Partial<AffiliatePartner> & { id: string }): Promise<AffiliatePartner> {
  const existing = getAffiliatePartnerById(partner.id);
  const updated: AffiliatePartner = {
    ...existing,
    ...partner,
    id: partner.id
  };

  runtimeAffiliatesCache[partner.id] = updated;

  // Persist to Firestore
  try {
    await setDoc(doc(db, 'affiliate_partners', partner.id), updated, { merge: true });
  } catch (err) {
    console.error('[Affiliate Store] Firestore save error:', err);
  }

  // Dispatch custom browser event so open UI components re-render instantly
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_AFFILIATES_UPDATED, { detail: partner.id }));
  }

  return updated;
}

/**
 * Subscribes to affiliate partner configuration updates
 */
export function subscribeAffiliatesStore(callback: (partnerId?: string) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleUpdate = (e: Event) => {
    const customEvt = e as CustomEvent;
    callback(customEvt.detail);
  };

  window.addEventListener(EVENT_AFFILIATES_UPDATED, handleUpdate);
  return () => {
    window.removeEventListener(EVENT_AFFILIATES_UPDATED, handleUpdate);
  };
}
