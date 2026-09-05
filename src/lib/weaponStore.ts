import { Weapon } from '../types';
import { WEAPONS_DATA } from '../data/weapons';
import { BundledStoreEngine } from './firebase/bundledStoreEngine';

export const WEAPONS_UPDATED_EVENT = 'gtavi_weapons_updated';

function sortWeapons(wpnList: Weapon[]): Weapon[] {
  const defaultIds = WEAPONS_DATA.map(w => w.id);
  return [...wpnList].sort((a, b) => {
    const indexA = defaultIds.indexOf(a.id);
    const indexB = defaultIds.indexOf(b.id);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.id.localeCompare(b.id);
  });
}

/**
 * 2,000x Optimized Weapon Catalog Bundled Store Engine (Thanh Le Pattern).
 * Packs all weapons into a single Firestore master bundle document.
 * Reduces Firestore billable reads from N (e.g. 50+ document reads) down to 1 single read!
 */
export const weaponBundleEngine = new BundledStoreEngine<Weapon>({
  bundleCollection: 'weapon_catalog_bundles',
  bundleDocId: 'master_weapon_bundle',
  apiCollection: 'weapons',
  storageKey: 'gtavi_cached_weapons',
  updateEventName: WEAPONS_UPDATED_EVENT,
  defaultItems: WEAPONS_DATA,
  sortFn: sortWeapons
});

/**
 * Initializes single 1-document onSnapshot subscription to Firestore for weapons.
 */
export function initializeRealtimeWeaponSync() {
  weaponBundleEngine.initializeSync();
}

/**
 * Retrieves the current weapons list immediately from memory, local cache, or master bundle.
 */
export async function getStoredWeapons(): Promise<Weapon[]> {
  return weaponBundleEngine.getItems();
}

/**
 * Saves or updates a single weapon in 1 single Firestore document write.
 */
export async function saveOrUpdateWeapon(weapon: Weapon): Promise<Weapon[]> {
  return weaponBundleEngine.saveOrUpdateItem(weapon);
}

/**
 * Deletes a single weapon in 1 single Firestore document write.
 */
export async function deleteWeapon(weaponId: string): Promise<Weapon[]> {
  return weaponBundleEngine.deleteItem(weaponId);
}

/**
 * Resets the weapon catalog to original Rockstar defaults in 1 single Firestore write.
 */
export async function resetWeaponsToDefault(): Promise<Weapon[]> {
  return weaponBundleEngine.resetToDefault();
}
