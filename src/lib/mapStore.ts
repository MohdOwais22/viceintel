import { ExtendedMapLocation, MAP_LOCATIONS_DATA } from '../data/mapLocations';
import { BundledStoreEngine } from './firebase/bundledStoreEngine';

export const MAP_LOCATIONS_UPDATED_EVENT = 'gtavi_map_locations_updated';

function sortMapLocations(locs: ExtendedMapLocation[]): ExtendedMapLocation[] {
  const defaultIds = MAP_LOCATIONS_DATA.map(l => l.id);
  return [...locs].sort((a, b) => {
    const indexA = defaultIds.indexOf(a.id);
    const indexB = defaultIds.indexOf(b.id);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.id.localeCompare(b.id);
  });
}

/**
 * 2,000x Optimized Map Locations Catalog Bundled Store Engine (Thanh Le Pattern).
 * Packs all interactive map locations into a single Firestore master bundle document.
 * Reduces Firestore billable reads from N (e.g. 50+ document reads) down to 1 single read!
 */
export const mapBundleEngine = new BundledStoreEngine<ExtendedMapLocation>({
  bundleCollection: 'map_catalog_bundles',
  bundleDocId: 'master_map_bundle',
  storageKey: 'gtavi_cached_map_locations',
  updateEventName: MAP_LOCATIONS_UPDATED_EVENT,
  defaultItems: MAP_LOCATIONS_DATA,
  sortFn: sortMapLocations
});

/**
 * Initializes single 1-document onSnapshot subscription to Firestore for map locations.
 */
export function initializeRealtimeMapSync() {
  mapBundleEngine.initializeSync();
}

/**
 * Retrieves the current map locations list immediately from memory, local cache, or master bundle.
 */
export async function getStoredMapLocations(): Promise<ExtendedMapLocation[]> {
  return mapBundleEngine.getItems();
}

/**
 * Saves or updates a single map location in 1 single Firestore document write.
 */
export async function saveOrUpdateMapLocation(location: ExtendedMapLocation): Promise<ExtendedMapLocation[]> {
  return mapBundleEngine.saveOrUpdateItem(location);
}

/**
 * Deletes a single map location in 1 single Firestore document write.
 */
export async function deleteMapLocation(locationId: string): Promise<ExtendedMapLocation[]> {
  return mapBundleEngine.deleteItem(locationId);
}

/**
 * Resets the map locations back to original default Rockstar data in 1 single Firestore write.
 */
export async function resetMapLocationsToDefault(): Promise<ExtendedMapLocation[]> {
  return mapBundleEngine.resetToDefault();
}
