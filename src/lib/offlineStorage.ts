import { Vehicle, Weapon, MapLocation, Business, RpServer, BlogPost, Character } from '../types';
import { VEHICLES_DATA } from '../data/vehicles';
import { WEAPONS_DATA } from '../data/weapons';
import { MAP_LOCATIONS_DATA } from '../data/mapLocations';
import { CHARACTERS_DATA } from '../data/characters';
import { BUSINESSES_DATA } from '../data/businesses';
import { RP_SERVERS_DATA } from '../data/rpServers';
import { BLOG_POSTS as BLOG_POSTS_DATA } from '../data/blogPosts';
import { getStoredVehicles, vehicleBundleEngine } from './vehicleStore';
import { getStoredWeapons, weaponBundleEngine } from './weaponStore';
import { getStoredMapLocations, mapBundleEngine } from './mapStore';
import { getStoredCharacters, characterBundleEngine } from './characterStore';
import { getStoredBusinesses, businessBundleEngine } from './businessStore';

export interface CacheMetadata {
  lastSyncedAt: string | null;
  vehiclesCount: number;
  weaponsCount: number;
  mapLocationsCount: number;
  charactersCount: number;
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
  CHARACTERS: 'gtavi_cached_characters_gallery',
  BUSINESSES: 'gtavi_cached_businesses',
  RP_SERVERS: 'gtavi_cached_rp_servers',
  BLOG_POSTS: 'gtavi_cached_blog_posts',
  SAVED_BUILDS: 'gtavi_cached_user_builds',
  METADATA: 'gtavi_cache_metadata'
};

// Safe localStorage helpers
function getLocalItem<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setLocalItem(key: string, value: any): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

/**
 * Preloads and warms critical datasets into local cache.
 */
export async function preloadAllCriticalData(): Promise<CacheMetadata> {
  try {
    const [vehicles, weapons, mapLocations, characters, businesses, rpServers, blogPosts] = await Promise.all([
      getStoredVehicles(),
      getStoredWeapons(),
      getStoredMapLocations(),
      getStoredCharacters(),
      getStoredBusinesses(),
      getCachedRpServers(),
      getCachedBlogPosts()
    ]);

    setLocalItem(STORAGE_KEYS.VEHICLES, vehicles);
    setLocalItem(STORAGE_KEYS.WEAPONS, weapons);
    setLocalItem(STORAGE_KEYS.MAP_LOCATIONS, mapLocations);
    setLocalItem(STORAGE_KEYS.CHARACTERS, characters);
    setLocalItem(STORAGE_KEYS.BUSINESSES, businesses);
    setLocalItem(STORAGE_KEYS.RP_SERVERS, rpServers);
    setLocalItem(STORAGE_KEYS.BLOG_POSTS, blogPosts);

    const totalJson = JSON.stringify({
      vehicles,
      weapons,
      map: mapLocations,
      characters,
      businesses,
      rp: rpServers,
      blogs: blogPosts
    });
    const sizeKb = Math.round(new Blob([totalJson]).size / 1024);

    const metadata: CacheMetadata = {
      lastSyncedAt: new Date().toISOString(),
      vehiclesCount: vehicles.length,
      weaponsCount: weapons.length,
      mapLocationsCount: mapLocations.length,
      charactersCount: characters.length,
      businessesCount: businesses.length,
      rpServersCount: rpServers.length,
      blogPostsCount: blogPosts.length,
      isFullyPreloaded: true,
      estimatedSizeKb: sizeKb
    };

    setLocalItem(STORAGE_KEYS.METADATA, metadata);
    return metadata;
  } catch (err) {
    console.error('[Storage] Error preloading datasets:', err);
    throw err;
  }
}

/**
 * Forcefully queries the active catalogs from database and refreshes local cache.
 */
export async function forceSyncFirestoreToLocal(): Promise<CacheMetadata> {
  try {
    const liveVehicles = await vehicleBundleEngine.forceFetchFromServer();
    const liveWeapons = await weaponBundleEngine.forceFetchFromServer();
    const liveMapLocations = await mapBundleEngine.forceFetchFromServer();
    const liveCharacters = await characterBundleEngine.forceFetchFromServer();
    const liveBusinesses = await businessBundleEngine.forceFetchFromServer();

    setLocalItem(STORAGE_KEYS.VEHICLES, liveVehicles);
    setLocalItem(STORAGE_KEYS.WEAPONS, liveWeapons);
    setLocalItem(STORAGE_KEYS.MAP_LOCATIONS, liveMapLocations);
    setLocalItem(STORAGE_KEYS.CHARACTERS, liveCharacters);
    setLocalItem(STORAGE_KEYS.BUSINESSES, liveBusinesses);

    const totalJson = JSON.stringify({
      vehicles: liveVehicles,
      weapons: liveWeapons,
      map: liveMapLocations,
      characters: liveCharacters,
      businesses: liveBusinesses,
      rp: RP_SERVERS_DATA,
      blogs: BLOG_POSTS_DATA
    });
    const sizeKb = Math.round(new Blob([totalJson]).size / 1024);

    const metadata: CacheMetadata = {
      lastSyncedAt: new Date().toISOString(),
      vehiclesCount: liveVehicles.length,
      weaponsCount: liveWeapons.length,
      mapLocationsCount: liveMapLocations.length,
      charactersCount: liveCharacters.length,
      businessesCount: BUSINESSES_DATA.length,
      rpServersCount: RP_SERVERS_DATA.length,
      blogPostsCount: BLOG_POSTS_DATA.length,
      isFullyPreloaded: true,
      estimatedSizeKb: sizeKb
    };

    setLocalItem(STORAGE_KEYS.METADATA, metadata);
    return metadata;
  } catch (err) {
    console.error('[Storage] Error synchronizing database data:', err);
    throw err;
  }
}

export async function getCachedVehicles(): Promise<Vehicle[]> {
  return getStoredVehicles();
}

export async function saveCachedVehicles(vehicles: Vehicle[]): Promise<void> {
  setLocalItem(STORAGE_KEYS.VEHICLES, vehicles);
}

export async function getCachedWeapons(): Promise<Weapon[]> {
  return getStoredWeapons();
}

export async function getCachedMapLocations(): Promise<MapLocation[]> {
  return getStoredMapLocations() as Promise<MapLocation[]>;
}

export async function getCachedCharacters(): Promise<Character[]> {
  return getStoredCharacters();
}

export async function saveCachedCharacters(characters: Character[]): Promise<void> {
  setLocalItem(STORAGE_KEYS.CHARACTERS, characters);
}

export async function getCachedBusinesses(): Promise<Business[]> {
  return getStoredBusinesses();
}

export async function getCachedRpServers(): Promise<RpServer[]> {
  const cached = getLocalItem<RpServer[]>(STORAGE_KEYS.RP_SERVERS);
  if (cached && Array.isArray(cached) && cached.length > 0) {
    return cached;
  }
  return RP_SERVERS_DATA;
}

export async function setCachedRpServers(servers: RpServer[]): Promise<void> {
  setLocalItem(STORAGE_KEYS.RP_SERVERS, servers);
}

export async function getCachedBlogPosts(): Promise<BlogPost[]> {
  const cached = getLocalItem<BlogPost[]>(STORAGE_KEYS.BLOG_POSTS);
  if (cached && Array.isArray(cached) && cached.length > 0) {
    return cached;
  }
  return BLOG_POSTS_DATA;
}

export async function getCacheMetadata(): Promise<CacheMetadata | null> {
  return getLocalItem<CacheMetadata>(STORAGE_KEYS.METADATA);
}

export async function clearAllOfflineCache(): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEYS.VEHICLES);
      localStorage.removeItem(STORAGE_KEYS.WEAPONS);
      localStorage.removeItem(STORAGE_KEYS.MAP_LOCATIONS);
      localStorage.removeItem(STORAGE_KEYS.CHARACTERS);
      localStorage.removeItem(STORAGE_KEYS.BUSINESSES);
      localStorage.removeItem(STORAGE_KEYS.RP_SERVERS);
      localStorage.removeItem(STORAGE_KEYS.BLOG_POSTS);
      localStorage.removeItem(STORAGE_KEYS.METADATA);
    } catch {}

    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k).catch(() => {})));
      }
    } catch {}
  }
}

export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  if (process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('[ServiceWorker] New content available; please refresh.');
                  }
                }
              };
            }
          };
        })
        .catch(() => {});
    });
  } else {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().catch(() => {});
      }
    }).catch(() => {});

    if ('caches' in window) {
      caches.keys().then((keys) => {
        return Promise.all(keys.map((k) => caches.delete(k)));
      }).catch(() => {});
    }
  }
}
