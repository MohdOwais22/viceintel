import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { withItemVersioning } from '../imageCacheBuster';
import { safeFirestoreWrite, markFirestoreQuotaExhausted, isResourceExhaustedError } from './firestoreCircuitBreaker';

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

const MAX_DOCUMENT_CHUNK_BYTES = 600 * 1024;

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

export class BundledStoreEngine<T extends { id: string }> {
  private bundleCollection: string;
  private bundleDocId: string;
  private apiCollection?: string;
  private storageKey: string;
  private updateEventName: string;
  private defaultItems: T[];
  private sortFn: (items: T[]) => T[];
  
  private inMemoryCache: T[] | null = null;
  private isSyncInitialized = false;
  private unsubscribeListener: (() => void) | null = null;
  private currentVersion: number = 1;

  constructor(options: {
    bundleCollection: string;
    bundleDocId: string;
    apiCollection?: string;
    storageKey: string;
    updateEventName: string;
    defaultItems: T[];
    sortFn?: (items: T[]) => T[];
  }) {
    this.bundleCollection = options.bundleCollection;
    this.bundleDocId = options.bundleDocId;
    this.apiCollection = options.apiCollection;
    this.storageKey = options.storageKey;
    this.updateEventName = options.updateEventName;
    this.defaultItems = deduplicateBundleItems(options.defaultItems);
    this.sortFn = (items: T[]) => {
      const deduped = deduplicateBundleItems(items);
      return options.sortFn ? options.sortFn(deduped) : deduped;
    };
  }

  private async parseDocSnapItems(docSnap: any): Promise<T[]> {
    if (!docSnap.exists()) return [];
    const data = docSnap.data() as BundledCatalog<T>;
    if (!data) return [];

    if (typeof data.version === 'number' && data.version > 0) {
      this.currentVersion = Math.max(this.currentVersion, data.version);
    }

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
            console.warn(`[StoreEngine] Failed loading chunk ${i} for ${this.bundleDocId}:`, e);
          }
          return [] as T[];
        });

        const chunkResults = await Promise.all(chunkPromises);
        const merged = chunkResults.flat();
        if (merged.length > 0) {
          return merged;
        }
      } catch (err) {
        console.warn(`[StoreEngine] Error resolving chunk documents for ${this.bundleDocId}:`, err);
      }
    }

    if (Array.isArray(data.items)) {
      return data.items;
    }

    return [];
  }

  public smartMergeItems(remoteItems: T[], localItems: T[]): T[] {
    // If DB returned remote items, DB is the absolute single source of truth!
    if (Array.isArray(remoteItems)) {
      return deduplicateBundleItems(remoteItems);
    }

    return deduplicateBundleItems(this.defaultItems);
  }

  public mergeWithDefaults(loadedItems: T[]): T[] {
    if (Array.isArray(loadedItems)) {
      return loadedItems;
    }
    return this.defaultItems;
  }

  public async initializeSync(): Promise<void> {
    if (this.isSyncInitialized || typeof window === 'undefined') return;
    this.isSyncInitialized = true;

    if (this.apiCollection) {
      try {
        const res = await fetch(`/api/admin/cms/${this.apiCollection}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            const merged = this.smartMergeItems(json.data, []);
            const sorted = this.sortFn(merged);
            this.inMemoryCache = sorted;
            window.dispatchEvent(new CustomEvent(this.updateEventName, { detail: sorted }));
          }
        }
      } catch (err) {
        console.warn(`[StoreEngine] Direct MongoDB API fetch error for ${this.apiCollection}:`, err);
      }
    }
  }

  private persistLocal(items: T[]): void {
    // IndexedDB & LocalStorage persistence disabled per user directive
  }

  private readLocal(): T[] | null {
    // IndexedDB & LocalStorage read disabled per user directive
    return null;
  }

  public async getItems(): Promise<T[]> {
    await this.initializeSync();

    if (this.inMemoryCache !== null) {
      return this.inMemoryCache;
    }

    return this.defaultItems;
  }

  public async forceFetchFromServer(): Promise<T[]> {
    if (this.apiCollection && typeof window !== 'undefined') {
      try {
        const res = await fetch(`/api/admin/cms/${this.apiCollection}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            const merged = this.smartMergeItems(json.data, []);
            const sorted = this.sortFn(merged);
            this.inMemoryCache = sorted;
            window.dispatchEvent(new CustomEvent(this.updateEventName, { detail: sorted }));
            return sorted;
          }
        }
      } catch (err) {
        console.warn(`[StoreEngine] Direct MongoDB API fetch failed for ${this.apiCollection}:`, err);
      }
    }
    return this.getItems();
  }

  private async syncItemToApi(item: T, method: 'POST' | 'DELETE' = 'POST'): Promise<void> {
    if (!this.apiCollection || typeof window === 'undefined') return;
    try {
      const url = `/api/admin/cms/${this.apiCollection}/${item.id}`;
      if (method === 'DELETE') {
        await fetch(url, { method: 'DELETE' });
      } else {
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
      }
    } catch (e) {
      console.warn(`[StoreEngine] API sync failed for ${this.apiCollection}/${item.id}:`, e);
    }
  }

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
    window.dispatchEvent(new CustomEvent(this.updateEventName, { detail: sorted }));

    await this.syncItemToApi(cleanedItem, 'POST');

    return sorted;
  }

  public async deleteItem(itemId: string): Promise<T[]> {
    const current = await this.getItems();
    const updatedList = current.filter(i => i.id !== itemId);
    const sorted = this.sortFn(updatedList);

    this.inMemoryCache = sorted;
    window.dispatchEvent(new CustomEvent(this.updateEventName, { detail: sorted }));

    await this.syncItemToApi({ id: itemId } as T, 'DELETE');

    return sorted;
  }

  public async resetToDefault(): Promise<T[]> {
    const versionedDefaults = this.defaultItems.map((item) =>
      withItemVersioning(item as any, null, true)
    ) as T[];

    const sorted = this.sortFn(versionedDefaults);
    this.inMemoryCache = sorted;
    window.dispatchEvent(new CustomEvent(this.updateEventName, { detail: sorted }));

    return sorted;
  }

  public async saveFullList(items: T[]): Promise<T[]> {
    const current = await this.getItems();
    const versionedList = items.map(item => {
      const existing = current.find(c => c.id === item.id);
      return withItemVersioning(item as any, existing as any) as T;
    });

    const sorted = this.sortFn(versionedList);
    this.inMemoryCache = sorted;
    window.dispatchEvent(new CustomEvent(this.updateEventName, { detail: sorted }));

    for (const item of sorted) {
      this.syncItemToApi(item, 'POST').catch(() => {});
    }

    return sorted;
  }

  private async writeBundleToFirestore(items: T[]): Promise<void> {
    // Firestore write disabled per user directive
    return;
  }

  public destroy(): void {
    if (this.unsubscribeListener) {
      this.unsubscribeListener();
      this.unsubscribeListener = null;
    }
    this.isSyncInitialized = false;
  }
}
