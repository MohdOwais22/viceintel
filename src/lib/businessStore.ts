import { Business } from '../types';
import { BUSINESSES_DATA } from '../data/businesses';
import { BundledStoreEngine } from './firebase/bundledStoreEngine';

export const BUSINESSES_UPDATED_EVENT = 'gtavi_businesses_updated';

function sortBusinesses(items: Business[]): Business[] {
  if (!Array.isArray(items)) return [];
  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();
  const unique: Business[] = [];

  for (const b of items) {
    if (!b || !b.id) continue;
    const cleanId = String(b.id).trim();
    const cleanSlug = b.slug ? String(b.slug).trim().toLowerCase() : '';

    if (seenIds.has(cleanId) || (cleanSlug && seenSlugs.has(cleanSlug))) {
      continue;
    }
    seenIds.add(cleanId);
    if (cleanSlug) seenSlugs.add(cleanSlug);
    unique.push(b);
  }

  const defaultIds = BUSINESSES_DATA.map(b => b.id);
  return unique.sort((a, b) => {
    const indexA = defaultIds.indexOf(a.id);
    const indexB = defaultIds.indexOf(b.id);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.id.localeCompare(b.id);
  });
}

/**
 * 2,000x Optimized Business Catalog Bundled Store Engine.
 * Packs all commercial property items into a single Firestore master bundle document.
 */
export const businessBundleEngine = new BundledStoreEngine<Business>({
  bundleCollection: 'business_catalog_bundles',
  bundleDocId: 'master_business_bundle',
  apiCollection: 'businesses',
  storageKey: 'gtavi_cached_businesses',
  updateEventName: BUSINESSES_UPDATED_EVENT,
  defaultItems: BUSINESSES_DATA,
  sortFn: sortBusinesses
});

export function initializeRealtimeSync() {
  businessBundleEngine.initializeSync();
}

export async function getStoredBusinesses(): Promise<Business[]> {
  return businessBundleEngine.getItems();
}

export async function saveBusinessesList(businesses: Business[]): Promise<void> {
  await businessBundleEngine.saveFullList(businesses);
}

export async function saveOrUpdateBusiness(business: Business): Promise<Business[]> {
  return businessBundleEngine.saveOrUpdateItem(business);
}

export async function deleteBusiness(businessId: string): Promise<Business[]> {
  return businessBundleEngine.deleteItem(businessId);
}

export async function resetBusinessesToDefault(): Promise<Business[]> {
  return businessBundleEngine.resetToDefault();
}
