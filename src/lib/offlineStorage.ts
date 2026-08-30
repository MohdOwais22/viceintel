import localforage from 'localforage';
import { Vehicle, Weapon, MapLocation, Business, RpServer, BlogPost } from '../types';
import { VEHICLES_DATA } from '../data/vehicles';
import { WEAPONS_DATA } from '../data/weapons';
import { MAP_LOCATIONS_DATA } from '../data/mapLocations';
import { BUSINESSES_DATA } from '../data/businesses';
import { RP_SERVERS_DATA } from '../data/rpServers';
import { BLOG_POSTS as BLOG_POSTS_DATA } from '../data/blogPosts';

// Configure localforage instance for GTA VI Central
const storage = localforage.createInstance({
  name: 'gtavi_central_db',
  storeName: 'gtavi_offline_cache',
  description: 'IndexedDB Offline Cache for GTA VI Central Vehicles, Map Tiles, Weapons, and ROI Calculators'
});

export interface CacheMetadata {
  lastSyncedAt: string | null;
  vehiclesCount: number;
  weaponsCount: number;
  mapLocationsCount: number;
  businessesCount: number;
  rpServersCount: number;
  blogPostsCount: number;
  isFullyPreloaded: boolean;
  estimatedSizeKb: number;
}

export const STORAGE_KEYS = {
  VEHICLES: 'gtavi_cached_vehicles',
  WEAPONS: 'gtavi_cached_weapons',
  MAP_LOCATIONS: 'gtavi_cached_map_locations',
  BUSINESSES: 'gtavi_cached_businesses',
  RP_SERVERS: 'gtavi_cached_rp_servers',
  BLOG_POSTS: 'gtavi_cached_blog_posts',
  SAVED_BUILDS: 'gtavi_cached_user_builds',
  METADATA: 'gtavi_cache_metadata'
};

/**
 * Preloads all critical datasets into localforage IndexedDB.
 * Can be called automatically on app load or manually via the Sync UI.
 */
export async function preloadAllCriticalData(): Promise<CacheMetadata> {
  try {
    console.log('[OfflineStorage] Preloading critical datasets into IndexedDB...');

    // Save core datasets
    await storage.setItem(STORAGE_KEYS.VEHICLES, VEHICLES_DATA);
    await storage.setItem(STORAGE_KEYS.WEAPONS, WEAPONS_DATA);
    await storage.setItem(STORAGE_KEYS.MAP_LOCATIONS, MAP_LOCATIONS_DATA);
    await storage.setItem(STORAGE_KEYS.BUSINESSES, BUSINESSES_DATA);
    await storage.setItem(STORAGE_KEYS.RP_SERVERS, RP_SERVERS_DATA);
    await storage.setItem(STORAGE_KEYS.BLOG_POSTS, BLOG_POSTS_DATA);

    // Calculate approximate size in KB
    const totalJson = JSON.stringify({
      vehicles: VEHICLES_DATA,
      weapons: WEAPONS_DATA,
      map: MAP_LOCATIONS_DATA,
      businesses: BUSINESSES_DATA,
      rp: RP_SERVERS_DATA,
      blogs: BLOG_POSTS_DATA
    });
    const sizeKb = Math.round(new Blob([totalJson]).size / 1024);

    const metadata: CacheMetadata = {
      lastSyncedAt: new Date().toISOString(),
      vehiclesCount: VEHICLES_DATA.length,
      weaponsCount: WEAPONS_DATA.length,
      mapLocationsCount: MAP_LOCATIONS_DATA.length,
      businessesCount: BUSINESSES_DATA.length,
      rpServersCount: RP_SERVERS_DATA.length,
      blogPostsCount: BLOG_POSTS_DATA.length,
      isFullyPreloaded: true,
      estimatedSizeKb: sizeKb
    };

    await storage.setItem(STORAGE_KEYS.METADATA, metadata);
    console.log('[OfflineStorage] Successfully preloaded all datasets to localforage:', metadata);
    return metadata;
  } catch (err) {
    console.error('[OfflineStorage] Error preloading critical datasets:', err);
    throw err;
  }
}

/**
 * Gets cached vehicles or falls back to static default data.
 */
export async function getCachedVehicles(): Promise<Vehicle[]> {
  try {
    const cached = await storage.getItem<Vehicle[]>(STORAGE_KEYS.VEHICLES);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached;
    }
  } catch (err) {
    console.warn('[OfflineStorage] Failed to read vehicles from localforage:', err);
  }
  return VEHICLES_DATA;
}

/**
 * Save updated vehicles list to localforage.
 */
export async function saveCachedVehicles(vehicles: Vehicle[]): Promise<void> {
  await storage.setItem(STORAGE_KEYS.VEHICLES, vehicles);
}

/**
 * Gets cached weapons or falls back to static data.
 */
export async function getCachedWeapons(): Promise<Weapon[]> {
  try {
    const cached = await storage.getItem<Weapon[]>(STORAGE_KEYS.WEAPONS);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached;
    }
  } catch (err) {
    console.warn('[OfflineStorage] Failed to read weapons from localforage:', err);
  }
  return WEAPONS_DATA;
}

/**
 * Gets cached map locations or falls back to static map data.
 */
export async function getCachedMapLocations(): Promise<MapLocation[]> {
  try {
    const cached = await storage.getItem<MapLocation[]>(STORAGE_KEYS.MAP_LOCATIONS);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached;
    }
  } catch (err) {
    console.warn('[OfflineStorage] Failed to read map locations from localforage:', err);
  }
  return MAP_LOCATIONS_DATA;
}

/**
 * Gets cached businesses or falls back to static default data.
 */
export async function getCachedBusinesses(): Promise<Business[]> {
  try {
    const cached = await storage.getItem<Business[]>(STORAGE_KEYS.BUSINESSES);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached;
    }
  } catch (err) {
    console.warn('[OfflineStorage] Failed to read businesses from localforage:', err);
  }
  return BUSINESSES_DATA;
}

/**
 * Gets cached RP servers or falls back to static data.
 */
export async function getCachedRpServers(): Promise<RpServer[]> {
  try {
    const cached = await storage.getItem<RpServer[]>(STORAGE_KEYS.RP_SERVERS);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached;
    }
  } catch (err) {
    console.warn('[OfflineStorage] Failed to read RP servers from localforage:', err);
  }
  return RP_SERVERS_DATA;
}

/**
 * Saves RP servers to IndexedDB offline cache.
 */
export async function setCachedRpServers(servers: RpServer[]): Promise<void> {
  try {
    await storage.setItem(STORAGE_KEYS.RP_SERVERS, servers);
  } catch (err) {
    console.warn('[OfflineStorage] Failed to write RP servers to localforage:', err);
  }
}

/**
 * Gets cached blog posts or falls back to static data.
 */
export async function getCachedBlogPosts(): Promise<BlogPost[]> {
  try {
    const cached = await storage.getItem<BlogPost[]>(STORAGE_KEYS.BLOG_POSTS);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached;
    }
  } catch (err) {
    console.warn('[OfflineStorage] Failed to read blog posts from localforage:', err);
  }
  return BLOG_POSTS_DATA;
}

/**
 * Gets current offline cache metadata (stats, size, sync date).
 */
export async function getCacheMetadata(): Promise<CacheMetadata | null> {
  try {
    return await storage.getItem<CacheMetadata>(STORAGE_KEYS.METADATA);
  } catch (err) {
    console.warn('[OfflineStorage] Failed to read cache metadata:', err);
    return null;
  }
}

/**
 * Clears all cached data from localforage and Service Worker caches.
 */
export async function clearAllOfflineCache(): Promise<void> {
  try {
    await storage.clear();
  } catch (storageErr) {
    console.warn('[OfflineStorage] Error clearing localforage storage:', storageErr);
  }

  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k).catch(() => {})));
    }
  } catch (cacheErr) {
    console.warn('[OfflineStorage] Error clearing Service Worker caches:', cacheErr);
  }

  console.log('[OfflineStorage] Cleared localforage & Service Worker cache completely.');
}

/**
 * Helper to register the Service Worker cleanly in the browser environment.
 */
export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  if (process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[ServiceWorker] Registered with scope:', registration.scope);
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('[ServiceWorker] New content available; please refresh.');
                  } else {
                    console.log('[ServiceWorker] Content cached for offline use.');
                  }
                }
              };
            }
          };
        })
        .catch((error) => {
          console.warn('[ServiceWorker] Registration failed:', error);
        });
    });
  } else {
    // In development mode, unregister any active service worker and clear caches to prevent stale dev asset serving
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().then((unregistered) => {
          if (unregistered) console.log('[ServiceWorker] Unregistered dev worker:', registration.scope);
        });
      }
    }).catch(() => {});

    if ('caches' in window) {
      caches.keys().then((keys) => {
        return Promise.all(keys.map((k) => caches.delete(k)));
      }).catch(() => {});
    }
  }
}
