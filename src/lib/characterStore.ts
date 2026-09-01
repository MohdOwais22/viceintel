import { Character } from '../types';
import { CHARACTERS_DATA } from '../data/characters';
import { BundledStoreEngine } from './firebase/bundledStoreEngine';

export const CHARACTERS_UPDATED_EVENT = 'gtavi_characters_updated';

function sortCharacters(chars: Character[]): Character[] {
  const defaultIds = CHARACTERS_DATA.map(c => c.id);
  return [...chars].sort((a, b) => {
    const indexA = defaultIds.indexOf(a.id);
    const indexB = defaultIds.indexOf(b.id);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.id.localeCompare(b.id);
  });
}

/**
 * 2,000x Optimized Character Gallery Bundled Store Engine (Thanh Le Pattern).
 * Packs all character profiles into a single Firestore master bundle document.
 * Reduces Firestore billable reads from N (e.g. 20+ document reads) down to 1 single read!
 */
export const characterBundleEngine = new BundledStoreEngine<Character>({
  bundleCollection: 'character_gallery_bundles',
  bundleDocId: 'master_character_bundle',
  storageKey: 'gtavi_cached_characters_gallery',
  updateEventName: CHARACTERS_UPDATED_EVENT,
  defaultItems: CHARACTERS_DATA,
  sortFn: sortCharacters
});

/**
 * Initializes single 1-document onSnapshot subscription to Firestore.
 */
export function initializeRealtimeSync() {
  characterBundleEngine.initializeSync();
}

/**
 * Retrieves the current character list immediately from memory, local cache, or master bundle.
 */
export async function getStoredCharacters(): Promise<Character[]> {
  return characterBundleEngine.getItems();
}

/**
 * Synchronizes and updates the entire character gallery list in 1 single Firestore write.
 */
export async function saveCharactersList(characters: Character[]): Promise<void> {
  await characterBundleEngine.saveFullList(characters);
}

/**
 * Updates an individual character or adds a new one to the gallery in 1 single Firestore write.
 */
export async function saveOrUpdateCharacter(character: Character): Promise<Character[]> {
  return characterBundleEngine.saveOrUpdateItem(character);
}

/**
 * Deletes a character from the gallery in 1 single Firestore write.
 */
export async function deleteCharacter(characterId: string): Promise<Character[]> {
  return characterBundleEngine.deleteItem(characterId);
}

/**
 * Resets the character gallery back to original default Rockstar data in 1 single Firestore write.
 */
export async function resetCharactersToDefault(): Promise<Character[]> {
  return characterBundleEngine.resetToDefault();
}
