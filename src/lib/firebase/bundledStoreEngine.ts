import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import localforage from 'localforage';

export interface BundledCatalog<T> {
  id: string;
  updatedAt: number;
  version: number;
  itemCount: number;
  items: T[];
}

/**
 * Creates an IndexedDB storage instance for a specific store name
 */
export function createBundleLocalStore(storeName: string) {
  return localforage.createInstance({
    name: 'gtavi_central_db',
    storeName,
    description: `IndexedDB Local Cache for ${storeName}`
  });
}

/**
 * Generic Bundled Firestore Store Engine
 * Implements the 2,000x Read/Write Firestore Optimization (Thanh Le Pattern).
 * Packs multiple items into single bucket/bundle documents in Firestore.
 * Subscribes to 1 document instead of N separate collection documents,
 * reducing billable read operations from N to 1 (up to 99.5%-99.9% cost reduction).
 */
export class BundledStoreEngine<T extends { id: string }> {
  private bundleCollection: string;
  private bundleDocId: string;
  private storageKey: string;
  private updateEventName: string;
  private defaultItems: T[];
  private sortFn: (items: T[]) => T[];
  private localStore: LocalForage;
  
  private inMemoryCache: T[] | null = null;
  private isSyncInitialized = false;
  private unsubscribeListener: (() => void) | null = null;

  constructor(options: {
    bundleCollection: string;
    bundleDocId: string;
    storageKey: string;
    updateEventName: string;
    defaultItems: T[];
    sortFn?: (items: T[]) => T[];
  }) {
    this.bundleCollection = options.bundleCollection;
    this.bundleDocId = options.bundleDocId;
    this.storageKey = options.storageKey;
    this.updateEventName = options.updateEventName;
    this.defaultItems = options.defaultItems;
    this.sortFn = options.sortFn || ((items) => items);
    this.localStore = createBundleLocalStore(`gtavi_${options.bundleDocId}_store`);
  }

  /**
   * Initializes real-time listener on the SINGLE bundled document.
   * Reads 1 document instead of N collection documents!
   */
  public initializeSync(): void {
    if (this.isSyncInitialized || !db || typeof window === 'undefined') return;
    this.isSyncInitialized = true;

    try {
      const docRef = doc(db, this.bundleCollection, this.bundleDocId);
      this.unsubscribeListener = onSnapshot(docRef, async (docSnap) => {
        if (!docSnap.exists()) {
          console.log(`[BundledEngine] Bundle doc ${this.bundleCollection}/${this.bundleDocId} is missing. Auto-seeding master bundle...`);
          try {
            await this.writeBundleToFirestore(this.defaultItems);
          } catch (seedErr) {
            console.warn(`[BundledEngine] Failed to seed bundle doc:`, seedErr);
          }
          return;
        }

        const data = docSnap.data() as BundledCatalog<T>;
        if (data && Array.isArray(data.items)) {
          const sorted = this.sortFn(data.items);
          this.inMemoryCache = sorted;

          // Save to local offline caches
          await this.localStore.setItem(this.storageKey, sorted);
          try {
            localStorage.setItem(this.storageKey, JSON.stringify(sorted));
          } catch (e) {}

          // Notify UI listeners
          window.dispatchEvent(new CustomEvent(this.updateEventName, { detail: sorted }));
        }
      }, (err) => {
        console.warn(`[BundledEngine] Real-time sync error for ${this.bundleCollection}:`, err);
      });
    } catch (err) {
      console.warn(`[BundledEngine] Could not establish Firestore listener for ${this.bundleCollection}:`, err);
    }
  }

  /**
   * Reads stored items from memory, IndexedDB, localStorage, or defaults.
   */
  public async getItems(): Promise<T[]> {
    this.initializeSync();

    if (this.inMemoryCache && this.inMemoryCache.length > 0) {
      return this.inMemoryCache;
    }

    try {
      const cached = await this.localStore.getItem<T[]>(this.storageKey);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        this.inMemoryCache = cached;
        return cached;
      }
    } catch (err) {
      console.warn(`[BundledEngine] Error reading localforage for ${this.storageKey}:`, err);
    }

    if (typeof window !== 'undefined') {
      try {
        const rawLocal = localStorage.getItem(this.storageKey);
        if (rawLocal) {
          const parsed = JSON.parse(rawLocal);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.inMemoryCache = parsed;
            await this.localStore.setItem(this.storageKey, parsed);
            return parsed;
          }
        }
      } catch (e) {}
    }

    return this.defaultItems;
  }

  /**
   * Saves or updates a single item inside the master bundle (1 write total).
   */
  public async saveOrUpdateItem(item: T): Promise<T[]> {
    const current = await this.getItems();
    const index = current.findIndex(i => i.id === item.id);

    let updatedList: T[];
    if (index >= 0) {
      updatedList = [...current];
      updatedList[index] = { ...updatedList[index], ...item };
    } else {
      updatedList = [item, ...current];
    }

    const sorted = this.sortFn(updatedList);
    this.inMemoryCache = sorted;
    
    // Write 1 single document to Firestore
    await this.writeBundleToFirestore(sorted);

    // Update local caches
    await this.localStore.setItem(this.storageKey, sorted);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(sorted));
      } catch (e) {}
      window.dispatchEvent(new CustomEvent(this.updateEventName, { detail: sorted }));
    }

    return sorted;
  }

  /**
   * Deletes an item from the master bundle (1 write total).
   */
  public async deleteItem(itemId: string): Promise<T[]> {
    const current = await this.getItems();
    const updatedList = current.filter(i => i.id !== itemId);
    const sorted = this.sortFn(updatedList);

    this.inMemoryCache = sorted;
    await this.writeBundleToFirestore(sorted);

    await this.localStore.setItem(this.storageKey, sorted);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(sorted));
      } catch (e) {}
      window.dispatchEvent(new CustomEvent(this.updateEventName, { detail: sorted }));
    }

    return sorted;
  }

  /**
   * Resets the entire bundle to default items (1 write total).
   */
  public async resetToDefault(): Promise<T[]> {
    const sorted = this.sortFn(this.defaultItems);
    this.inMemoryCache = sorted;

    await this.writeBundleToFirestore(sorted);

    await this.localStore.setItem(this.storageKey, sorted);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(sorted));
      } catch (e) {}
      window.dispatchEvent(new CustomEvent(this.updateEventName, { detail: sorted }));
    }

    return sorted;
  }

  /**
   * Replaces the full bundle items array in 1 single Firestore document write.
   */
  public async saveFullList(items: T[]): Promise<T[]> {
    const sorted = this.sortFn(items);
    this.inMemoryCache = sorted;

    await this.writeBundleToFirestore(sorted);

    await this.localStore.setItem(this.storageKey, sorted);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(sorted));
      } catch (e) {}
      window.dispatchEvent(new CustomEvent(this.updateEventName, { detail: sorted }));
    }

    return sorted;
  }

  /**
   * Writes the master bundle document to Firestore as 1 single operation.
   */
  private async writeBundleToFirestore(items: T[]): Promise<void> {
    if (!db) return;
    try {
      const docRef = doc(db, this.bundleCollection, this.bundleDocId);
      const payload: BundledCatalog<T> = {
        id: this.bundleDocId,
        updatedAt: Date.now(),
        version: 1,
        itemCount: items.length,
        items
      };
      await setDoc(docRef, payload, { merge: true });
    } catch (fsErr) {
      console.warn(`[BundledEngine] Firestore bundle write warning for ${this.bundleCollection}:`, fsErr);
    }
  }

  /**
   * Destroys listener on cleanup if needed.
   */
  public destroy(): void {
    if (this.unsubscribeListener) {
      this.unsubscribeListener();
      this.unsubscribeListener = null;
    }
    this.isSyncInitialized = false;
  }
}
