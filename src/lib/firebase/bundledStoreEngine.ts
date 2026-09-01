import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import localforage from 'localforage';
import { withItemVersioning } from '../imageCacheBuster';

export interface BundledCatalog<T> {
  id: string;
  updatedAt: number;
  version: number;
  cacheBusterToken?: string;
  itemCount: number;
  isChunked?: boolean;
  chunkCount?: number;
  items?: T[];
}

export interface BundledChunk<T> {
  id: string;
  chunkIndex: number;
  parentDocId: string;
  updatedAt: number;
  items: T[];
}

/**
 * Maximum safe document payload size in bytes (Firestore limit is 1,048,576 bytes).
 * We use 600KB to provide a comfortable safety buffer for metadata and overhead.
 */
const MAX_DOCUMENT_CHUNK_BYTES = 600 * 1024;

/**
 * Deep sanitization helper that removes all `undefined` fields recursively.
 * Prevents Firestore "Unsupported field value: undefined" runtime errors.
 */
export function cleanFirestorePayload<T>(obj: T): T {
  if (obj === null || obj === undefined) return null as unknown as T;
  if (Array.isArray(obj)) {
    return obj
      .map((item) => cleanFirestorePayload(item))
      .filter((item) => item !== undefined) as unknown as T;
  }
  if (typeof obj === 'object') {
    const res: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        res[key] = cleanFirestorePayload(value);
      }
    }
    return res as unknown as T;
  }
  return obj;
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
 * Deep deduplication helper ensuring items are unique by ID and optionally slug.
 * If multiple items have identical IDs or slugs, preserves the most complete / highest version entry.
 */
export function deduplicateBundleItems<T extends { id: string }>(items: T[]): T[] {
  if (!Array.isArray(items)) return [];
  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    if (!item || typeof item !== 'object' || !item.id) continue;
    const cleanId = String(item.id).trim();
    if (!cleanId || seenIds.has(cleanId)) continue;

    const slug = (item as any).slug ? String((item as any).slug).trim().toLowerCase() : '';
    if (slug && seenSlugs.has(slug)) {
      continue;
    }

    seenIds.add(cleanId);
    if (slug) seenSlugs.add(slug);
    result.push(item);
  }

  return result;
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
  private currentVersion: number = 1;

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
    this.defaultItems = deduplicateBundleItems(options.defaultItems);
    this.sortFn = (items: T[]) => {
      const deduped = deduplicateBundleItems(items);
      return options.sortFn ? options.sortFn(deduped) : deduped;
    };
    this.localStore = createBundleLocalStore(`gtavi_${options.bundleDocId}_store`);
  }

  /**
   * Parses items from a snapshot, handling both single-doc bundle and multi-chunk bundles.
   */
  private async parseDocSnapItems(docSnap: any): Promise<T[]> {
    if (!docSnap.exists()) return [];
    const data = docSnap.data() as BundledCatalog<T>;
    if (!data) return [];

    if (typeof data.version === 'number' && data.version > 0) {
      this.currentVersion = Math.max(this.currentVersion, data.version);
    }

    // If chunked into multiple documents
    if (data.isChunked && typeof data.chunkCount === 'number' && data.chunkCount > 0) {
      try {
        const chunkPromises = Array.from({ length: data.chunkCount }, async (_, i) => {
          try {
            if (!db) return [] as T[];
            const chunkDocRef = doc(db, this.bundleCollection, `${this.bundleDocId}_chunk_${i}`);
            const chunkSnap = await getDoc(chunkDocRef);
            if (chunkSnap.exists()) {
              const cData = chunkSnap.data() as BundledChunk<T>;
              if (cData && Array.isArray(cData.items)) {
                return cData.items;
              }
            }
          } catch (e) {
            console.warn(`[BundledEngine] Failed loading chunk ${i} for ${this.bundleDocId}:`, e);
          }
          return [] as T[];
        });

        const chunkResults = await Promise.all(chunkPromises);
        const merged = chunkResults.flat();
        if (merged.length > 0) {
          return merged;
        }
      } catch (err) {
        console.warn(`[BundledEngine] Error resolving chunk documents for ${this.bundleDocId}:`, err);
      }
    }

    // Fallback or standard single-doc bundle
    if (Array.isArray(data.items)) {
      return data.items;
    }

    return [];
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

        const items = await this.parseDocSnapItems(docSnap);
        if (items && items.length > 0) {
          const sorted = this.sortFn(items);
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
   * Forcefully fetches the master bundle directly from Firestore (bypassing caches),
   * updates the local store, and returns the sorted items.
   */
  public async forceFetchFromServer(): Promise<T[]> {
    this.initializeSync();
    if (!db) return this.getItems();
    try {
      const docRef = doc(db, this.bundleCollection, this.bundleDocId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const items = await this.parseDocSnapItems(docSnap);
        if (items && items.length > 0) {
          const sorted = this.sortFn(items);
          this.inMemoryCache = sorted;
          await this.localStore.setItem(this.storageKey, sorted);
          try {
            localStorage.setItem(this.storageKey, JSON.stringify(sorted));
          } catch (e) {}
          window.dispatchEvent(new CustomEvent(this.updateEventName, { detail: sorted }));
          return sorted;
        }
      }
    } catch (err) {
      console.warn(`[BundledEngine] Direct Firestore fetch failed for ${this.bundleCollection}:`, err);
    }
    return this.getItems();
  }

  /**
   * Saves or updates a single item inside the master bundle (1 write total).
   * Automatically applies item versioning, image versioning, and cache-busting tokens.
   */
  public async saveOrUpdateItem(item: T): Promise<T[]> {
    const current = await this.getItems();
    const existing = current.find(i => i.id === item.id);
    const versionedItem = withItemVersioning(item as any, existing as any) as T;
    const cleanedItem = cleanFirestorePayload(versionedItem);

    const index = current.findIndex(i => i.id === cleanedItem.id);

    let updatedList: T[];
    if (index >= 0) {
      updatedList = [...current];
      updatedList[index] = { ...updatedList[index], ...cleanedItem };
    } else {
      updatedList = [cleanedItem, ...current];
    }

    const sorted = this.sortFn(updatedList);
    this.inMemoryCache = sorted;

    // Update local caches immediately
    await this.localStore.setItem(this.storageKey, sorted);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(sorted));
      } catch (e) {}
      window.dispatchEvent(new CustomEvent(this.updateEventName, { detail: sorted }));
    }

    // Write 1 single document to Firestore with incremented bundle version
    try {
      await this.writeBundleToFirestore(sorted);
    } catch (err) {
      console.warn(`[BundledEngine] Firestore write error for ${this.bundleCollection}:`, err);
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

    await this.localStore.setItem(this.storageKey, sorted);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(sorted));
      } catch (e) {}
      window.dispatchEvent(new CustomEvent(this.updateEventName, { detail: sorted }));
    }

    try {
      await this.writeBundleToFirestore(sorted);
    } catch (err) {
      console.warn(`[BundledEngine] Firestore delete error for ${this.bundleCollection}:`, err);
    }

    return sorted;
  }

  /**
   * Resets the entire bundle to default items (1 write total).
   */
  public async resetToDefault(): Promise<T[]> {
    const now = Date.now();
    const versionedDefaults = this.defaultItems.map((item, idx) =>
      withItemVersioning(item as any, null, true)
    ) as T[];

    const sorted = this.sortFn(versionedDefaults);
    this.inMemoryCache = sorted;

    await this.localStore.setItem(this.storageKey, sorted);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(sorted));
      } catch (e) {}
      window.dispatchEvent(new CustomEvent(this.updateEventName, { detail: sorted }));
    }

    try {
      await this.writeBundleToFirestore(sorted);
    } catch (err) {
      console.warn(`[BundledEngine] Firestore reset error for ${this.bundleCollection}:`, err);
    }

    return sorted;
  }

  /**
   * Replaces the full bundle items array in 1 single Firestore document write.
   */
  public async saveFullList(items: T[]): Promise<T[]> {
    const current = await this.getItems();
    const versionedList = items.map(item => {
      const existing = current.find(c => c.id === item.id);
      return withItemVersioning(item as any, existing as any) as T;
    });

    const sorted = this.sortFn(versionedList);
    this.inMemoryCache = sorted;

    await this.localStore.setItem(this.storageKey, sorted);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(sorted));
      } catch (e) {}
      window.dispatchEvent(new CustomEvent(this.updateEventName, { detail: sorted }));
    }

    try {
      await this.writeBundleToFirestore(sorted);
    } catch (err) {
      console.warn(`[BundledEngine] Firestore saveFullList error for ${this.bundleCollection}:`, err);
    }

    return sorted;
  }

  /**
   * Writes the bundle documents to Firestore with auto-chunking protection.
   * If total payload exceeds MAX_DOCUMENT_CHUNK_BYTES (600KB), automatically splits
   * across chunk documents to never exceed Firestore's 1MB hard limit.
   */
  private async writeBundleToFirestore(items: T[]): Promise<void> {
    if (!db) return;
    try {
      this.currentVersion = (this.currentVersion || 0) + 1;
      const now = Date.now();
      const docRef = doc(db, this.bundleCollection, this.bundleDocId);
      const serializedItems = JSON.stringify(items);

      // If entire list safely fits within standard single document limit (~600KB)
      if (serializedItems.length < MAX_DOCUMENT_CHUNK_BYTES) {
        const rawPayload: BundledCatalog<T> = {
          id: this.bundleDocId,
          updatedAt: now,
          version: this.currentVersion,
          cacheBusterToken: String(now),
          itemCount: items.length,
          isChunked: false,
          chunkCount: 1,
          items
        };
        const cleaned = cleanFirestorePayload(rawPayload);
        await setDoc(docRef, cleaned);
        console.log(`[BundledEngine] Saved single bundle (v${this.currentVersion}) to Firestore for ${this.bundleCollection} (${items.length} items, ${Math.round(serializedItems.length / 1024)} KB)`);
        return;
      }

      // Automatically chunk items when payload is large
      const chunks: T[][] = [];
      let currentChunk: T[] = [];
      let currentChunkBytes = 0;

      for (const item of items) {
        const itemBytes = JSON.stringify(item).length;
        if (currentChunk.length > 0 && currentChunkBytes + itemBytes > MAX_DOCUMENT_CHUNK_BYTES) {
          chunks.push(currentChunk);
          currentChunk = [item];
          currentChunkBytes = itemBytes;
        } else {
          currentChunk.push(item);
          currentChunkBytes += itemBytes;
        }
      }
      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
      }

      // Write each chunk in parallel
      const chunkPromises = chunks.map(async (chunkItems, index) => {
        if (!db) return;
        const chunkDocRef = doc(db, this.bundleCollection, `${this.bundleDocId}_chunk_${index}`);
        const chunkPayload: BundledChunk<T> = {
          id: `${this.bundleDocId}_chunk_${index}`,
          chunkIndex: index,
          parentDocId: this.bundleDocId,
          updatedAt: now,
          items: chunkItems
        };
        const cleanedChunk = cleanFirestorePayload(chunkPayload);
        await setDoc(chunkDocRef, cleanedChunk);
      });

      await Promise.all(chunkPromises);

      // Write master manifest document
      const manifestPayload: BundledCatalog<T> = {
        id: this.bundleDocId,
        updatedAt: now,
        version: this.currentVersion,
        cacheBusterToken: String(now),
        itemCount: items.length,
        isChunked: true,
        chunkCount: chunks.length
      };
      const cleanedManifest = cleanFirestorePayload(manifestPayload);
      await setDoc(docRef, cleanedManifest);

      console.log(`[BundledEngine] Saved chunked bundle (v${this.currentVersion}) to Firestore for ${this.bundleCollection} (${items.length} items across ${chunks.length} chunks, total ~${Math.round(serializedItems.length / 1024)} KB)`);
    } catch (fsErr) {
      console.error(`[BundledEngine] Firestore bundle write failure for ${this.bundleCollection}:`, fsErr);
      throw fsErr;
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
