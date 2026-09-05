import { Vehicle } from '../types';
import { VEHICLES_DATA } from '../data/vehicles';
import { BundledStoreEngine } from './firebase/bundledStoreEngine';

export const VEHICLES_UPDATED_EVENT = 'gtavi_vehicles_updated';

function sortVehicles(vehList: Vehicle[]): Vehicle[] {
  const defaultIds = VEHICLES_DATA.map(v => v.id);
  return [...vehList].sort((a, b) => {
    const indexA = defaultIds.indexOf(a.id);
    const indexB = defaultIds.indexOf(b.id);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.id.localeCompare(b.id);
  });
}

/**
 * 2,000x Optimized Vehicle Catalog Bundled Store Engine (Thanh Le Pattern).
 * Packs all vehicles into a single Firestore master bundle document.
 * Reduces Firestore billable reads from N (e.g. 100+ document reads) down to 1 single read!
 */
export const vehicleBundleEngine = new BundledStoreEngine<Vehicle>({
  bundleCollection: 'vehicle_catalog_bundles',
  bundleDocId: 'master_vehicle_bundle',
  apiCollection: 'vehicles',
  storageKey: 'gtavi_cached_vehicles',
  updateEventName: VEHICLES_UPDATED_EVENT,
  defaultItems: VEHICLES_DATA,
  sortFn: sortVehicles
});

/**
 * Initializes single 1-document onSnapshot subscription to Firestore for vehicles.
 */
export function initializeRealtimeVehicleSync() {
  vehicleBundleEngine.initializeSync();
}

/**
 * Retrieves the current vehicles list immediately from memory, local cache, or master bundle.
 */
export async function getStoredVehicles(): Promise<Vehicle[]> {
  return vehicleBundleEngine.getItems();
}

/**
 * Saves or updates a single vehicle in 1 single Firestore document write.
 */
export async function saveOrUpdateVehicle(vehicle: Vehicle): Promise<Vehicle[]> {
  return vehicleBundleEngine.saveOrUpdateItem(vehicle);
}

/**
 * Deletes a single vehicle in 1 single Firestore document write.
 */
export async function deleteVehicle(vehicleId: string): Promise<Vehicle[]> {
  return vehicleBundleEngine.deleteItem(vehicleId);
}

/**
 * Resets the vehicle catalog to original Rockstar defaults in 1 single Firestore write.
 */
export async function resetVehiclesToDefault(): Promise<Vehicle[]> {
  return vehicleBundleEngine.resetToDefault();
}
