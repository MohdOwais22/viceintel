// Types & Interfaces matching firebase/firestore
export interface DocumentData {
  [field: string]: any;
}

export interface SetOptions {
  merge?: boolean;
  mergeFields?: string[];
}

export interface DocumentReference<T = DocumentData> {
  id: string;
  path: string;
  parent: CollectionReference<T>;
  type: 'document';
  firestore: Firestore;
}

export interface CollectionReference<T = DocumentData> {
  id: string;
  path: string;
  parent: DocumentReference<DocumentData> | null;
  type: 'collection';
  firestore: Firestore;
}

export interface QueryConstraint {
  type: 'where' | 'orderBy' | 'limit' | 'startAfter' | 'endBefore';
  field?: string;
  op?: string;
  value?: any;
  direction?: 'asc' | 'desc';
  limitCount?: number;
}

export interface Query<T = DocumentData> {
  type: 'query';
  collectionPath: string;
  constraints: QueryConstraint[];
  firestore: Firestore;
}

export interface DocumentSnapshot<T = DocumentData> {
  id: string;
  ref: DocumentReference<T>;
  exists: () => boolean;
  data: () => T | undefined;
  get: (fieldPath: string) => any;
}

export interface QueryDocumentSnapshot<T = DocumentData> extends DocumentSnapshot<T> {
  data: () => T;
}

export interface QuerySnapshot<T = DocumentData> {
  docs: QueryDocumentSnapshot<T>[];
  empty: boolean;
  size: number;
  forEach: (callback: (result: QueryDocumentSnapshot<T>) => void) => void;
  docChanges: () => any[];
}

export interface Firestore {
  type: 'mongo-firestore-adapter';
  app?: any;
}

export type Unsubscribe = () => void;

export class Timestamp {
  seconds: number;
  nanoseconds: number;

  constructor(seconds: number, nanoseconds: number) {
    this.seconds = seconds;
    this.nanoseconds = nanoseconds;
  }

  static now(): Timestamp {
    const ms = Date.now();
    return new Timestamp(Math.floor(ms / 1000), (ms % 1000) * 1e6);
  }

  static fromDate(date: Date): Timestamp {
    const ms = date.getTime();
    return new Timestamp(Math.floor(ms / 1000), (ms % 1000) * 1e6);
  }

  static fromMillis(milliseconds: number): Timestamp {
    return new Timestamp(Math.floor(milliseconds / 1000), (milliseconds % 1000) * 1e6);
  }

  toDate(): Date {
    return new Date(this.seconds * 1000 + this.nanoseconds / 1e6);
  }

  toMillis(): number {
    return this.seconds * 1000 + Math.floor(this.nanoseconds / 1e6);
  }

  toISOString(): string {
    return this.toDate().toISOString();
  }
}

// Global default adapter Firestore instance
export const defaultFirestoreInstance: Firestore = {
  type: 'mongo-firestore-adapter',
};

// Event bus for real-time reactivity across active onSnapshot listeners
type ListenerCallback = (data: any) => void;
const listeners = new Map<string, Set<ListenerCallback>>();

function getChannelKey(type: 'doc' | 'collection', path: string): string {
  return `${type}:${path}`;
}

export function notifyListeners(type: 'doc' | 'collection', path: string, data: any) {
  const key = getChannelKey(type, path);
  const set = listeners.get(key);
  if (set) {
    set.forEach((cb) => {
      try {
        cb(data);
      } catch (e) {
        console.warn('[MongoDB Adapter Listener Error]:', e);
      }
    });
  }

  // If a document updated, also notify its collection listeners
  if (type === 'doc') {
    const parts = path.split('/');
    if (parts.length > 1) {
      const colPath = parts[0];
      const colKey = getChannelKey('collection', colPath);
      const colSet = listeners.get(colKey);
      if (colSet) {
        colSet.forEach((cb) => {
          try {
            cb({ type: 'doc_changed', path, data });
          } catch (e) {}
        });
      }
    }
  }
}

function getBaseApiUrl(): string {
  if (typeof window !== 'undefined') return '';
  return `http://127.0.0.1:${process.env.PORT || 3000}`;
}

async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  try {
    const fullUrl = `${getBaseApiUrl()}${endpoint}`;
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = setTimeout(() => controller?.abort(), 4000);

    const res = await fetch(fullUrl, {
      ...options,
      signal: controller?.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    }).catch(() => null);

    clearTimeout(timer);

    if (!res || !res.ok) {
      return null;
    }
    return await res.json().catch(() => null);
  } catch (err: any) {
    return null;
  }
}

/**
 * Creates or retrieves a CollectionReference pointing to a MongoDB collection.
 */
export function collection(
  firestoreOrDoc: Firestore | DocumentReference | any,
  ...pathSegments: string[]
): CollectionReference {
  const parts: string[] = [];
  if (firestoreOrDoc && firestoreOrDoc.type === 'document') {
    parts.push(firestoreOrDoc.path);
  }
  parts.push(...pathSegments.filter(Boolean));
  const fullPath = parts.join('/');
  const lastId = parts[parts.length - 1] || 'default';

  return {
    id: lastId,
    path: fullPath,
    parent: null,
    type: 'collection',
    firestore: defaultFirestoreInstance,
  };
}

/**
 * Creates or retrieves a DocumentReference pointing to a MongoDB document.
 */
export function doc(
  firestoreOrCol: Firestore | CollectionReference | any,
  ...pathSegments: string[]
): DocumentReference {
  const parts: string[] = [];
  if (firestoreOrCol && (firestoreOrCol.type === 'collection' || firestoreOrCol.type === 'document')) {
    parts.push(firestoreOrCol.path);
  }
  parts.push(...pathSegments.filter(Boolean));

  if (parts.length % 2 !== 0 && parts.length > 0) {
    parts.push(`doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  }

  const fullPath = parts.join('/');
  const docId = parts[parts.length - 1] || `doc_${Date.now()}`;
  const colPath = parts.slice(0, -1).join('/') || 'default';

  return {
    id: docId,
    path: fullPath,
    parent: collection(defaultFirestoreInstance, colPath),
    type: 'document',
    firestore: defaultFirestoreInstance,
  };
}

/**
 * Reads a single document from MongoDB via API.
 */
export async function getDoc<T = DocumentData>(docRef: DocumentReference<T>): Promise<DocumentSnapshot<T>> {
  const colName = docRef.parent.id;
  const docId = docRef.id;

  let docData: any = null;

  try {
    const res = await apiRequest(`/api/db/${encodeURIComponent(colName)}/${encodeURIComponent(docId)}`);
    if (res && res.success && res.data) {
      docData = res.data;
    }
  } catch (err) {
    // Suppress
  }

  const exists = docData !== null && docData !== undefined;
  const cleanData = exists ? { ...docData, id: docData.id || docId } : undefined;

  return {
    id: docId,
    ref: docRef,
    exists: () => exists,
    data: () => cleanData as T,
    get: (fieldPath: string) => cleanData?.[fieldPath],
  };
}

/**
 * Reads multiple documents from MongoDB matching a query or collection.
 */
export async function getDocs<T = DocumentData>(
  queryOrCol: CollectionReference<T> | Query<T>
): Promise<QuerySnapshot<T>> {
  const colName = queryOrCol.type === 'collection' ? queryOrCol.id : queryOrCol.collectionPath;
  const constraints = queryOrCol.type === 'query' ? queryOrCol.constraints : [];

  let items: any[] = [];

  try {
    const res = await apiRequest(`/api/db/query/${encodeURIComponent(colName)}`, {
      method: 'POST',
      body: JSON.stringify({ constraints }),
    });
    if (res && res.success && Array.isArray(res.data)) {
      items = res.data;
    }
  } catch (err) {
    try {
      const fallbackRes = await apiRequest(`/api/db/${encodeURIComponent(colName)}`);
      if (fallbackRes && fallbackRes.success && Array.isArray(fallbackRes.data)) {
        items = fallbackRes.data;
      }
    } catch (e) {
      // Suppress
    }
  }

  const docs: QueryDocumentSnapshot<T>[] = (items || []).map((item: any) => {
    const docId = item.id || item.docId || item.uid || item._id || `doc_${Date.now()}`;
    const cleanItem = { ...item, id: docId };
    return {
      id: docId,
      ref: doc(collection(defaultFirestoreInstance, colName), docId) as DocumentReference<T>,
      exists: () => true,
      data: () => cleanItem as T,
      get: (fieldPath: string) => cleanItem[fieldPath],
    };
  });

  return {
    docs,
    empty: docs.length === 0,
    size: docs.length,
    forEach: (cb) => docs.forEach(cb),
    docChanges: () => [],
  };
}

/**
 * Saves/Upserts a document into MongoDB.
 */
export async function setDoc<T = DocumentData>(
  docRef: DocumentReference<T>,
  data: Partial<T>,
  options: SetOptions = {}
): Promise<void> {
  const colName = docRef.parent.id;
  const docId = docRef.id;

  const payload = {
    ...data,
    id: docId,
    docId,
    updatedAt: new Date().toISOString(),
  };

  await apiRequest(`/api/db/${encodeURIComponent(colName)}/${encodeURIComponent(docId)}`, {
    method: 'POST',
    body: JSON.stringify({ ...payload, merge: options.merge ?? true }),
  });

  notifyListeners('doc', docRef.path, payload);
}

/**
 * Adds a new document to MongoDB with an auto-generated ID.
 */
export async function addDoc<T = DocumentData>(
  colRef: CollectionReference<T>,
  data: T
): Promise<DocumentReference<T>> {
  const colName = colRef.id;
  const autoId = (data as any)?.id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const payload = {
    ...data,
    id: autoId,
    docId: autoId,
    createdAt: (data as any)?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await apiRequest(`/api/db/${encodeURIComponent(colName)}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const newDocRef = doc(colRef, autoId) as DocumentReference<T>;
  notifyListeners('collection', colRef.path, payload);
  return newDocRef;
}

/**
 * Updates an existing document in MongoDB.
 */
export async function updateDoc<T = DocumentData>(
  docRef: DocumentReference<T>,
  dataOrField: any,
  ...moreFieldsAndValues: any[]
): Promise<void> {
  const colName = docRef.parent.id;
  const docId = docRef.id;

  let updatePayload: any = {};
  if (typeof dataOrField === 'string' && moreFieldsAndValues.length > 0) {
    updatePayload[dataOrField] = moreFieldsAndValues[0];
    for (let i = 1; i < moreFieldsAndValues.length; i += 2) {
      if (i + 1 < moreFieldsAndValues.length) {
        updatePayload[moreFieldsAndValues[i]] = moreFieldsAndValues[i + 1];
      }
    }
  } else if (typeof dataOrField === 'object' && dataOrField !== null) {
    updatePayload = { ...dataOrField };
  }

  updatePayload.updatedAt = new Date().toISOString();

  await apiRequest(`/api/db/${encodeURIComponent(colName)}/${encodeURIComponent(docId)}`, {
    method: 'PATCH',
    body: JSON.stringify(updatePayload),
  });

  notifyListeners('doc', docRef.path, updatePayload);
}

/**
 * Deletes a document from MongoDB.
 */
export async function deleteDoc<T = DocumentData>(docRef: DocumentReference<T>): Promise<void> {
  const colName = docRef.parent.id;
  const docId = docRef.id;

  await apiRequest(`/api/db/${encodeURIComponent(colName)}/${encodeURIComponent(docId)}`, {
    method: 'DELETE',
  });

  notifyListeners('doc', docRef.path, { deleted: true, id: docId });
}

/**
 * Real-time listener for MongoDB queries or documents.
 * Fetches immediately and polls periodically / listens to local change events.
 */
export function onSnapshot<T = DocumentData>(
  target: DocumentReference<T> | CollectionReference<T> | Query<T>,
  onNextOrObserver: any,
  onError?: (error: any) => void
): Unsubscribe {
  const onNext = typeof onNextOrObserver === 'function' ? onNextOrObserver : onNextOrObserver?.next;
  let isSubscribed = true;

  if (target.type === 'document') {
    const docRef = target as DocumentReference<T>;
    const fetchLatest = async () => {
      if (!isSubscribed) return;
      try {
        const snap = await getDoc(docRef);
        if (isSubscribed && onNext) onNext(snap);
      } catch (err) {
        if (onError) onError(err);
      }
    };

    fetchLatest();

    const channelKey = getChannelKey('doc', docRef.path);
    if (!listeners.has(channelKey)) {
      listeners.set(channelKey, new Set());
    }
    const cb = () => fetchLatest();
    listeners.get(channelKey)!.add(cb);

    const interval = setInterval(fetchLatest, 3000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
      listeners.get(channelKey)?.delete(cb);
    };
  } else {
    const queryOrCol = target as CollectionReference<T> | Query<T>;
    const colPath = queryOrCol.type === 'collection' ? queryOrCol.id : queryOrCol.collectionPath;

    const fetchLatest = async () => {
      if (!isSubscribed) return;
      try {
        const snap = await getDocs(queryOrCol);
        if (isSubscribed && onNext) onNext(snap);
      } catch (err) {
        if (onError) onError(err);
      }
    };

    fetchLatest();

    const channelKey = getChannelKey('collection', colPath);
    if (!listeners.has(channelKey)) {
      listeners.set(channelKey, new Set());
    }
    const cb = () => fetchLatest();
    listeners.get(channelKey)!.add(cb);

    const interval = setInterval(fetchLatest, 3000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
      listeners.get(channelKey)?.delete(cb);
    };
  }
}

/**
 * Builds a Query object.
 */
export function query<T = DocumentData>(
  target: CollectionReference<T> | Query<T>,
  ...queryConstraints: QueryConstraint[]
): Query<T> {
  const collectionPath = target.type === 'collection' ? target.id : target.collectionPath;
  const existingConstraints = target.type === 'query' ? target.constraints : [];
  return {
    type: 'query',
    collectionPath,
    constraints: [...existingConstraints, ...queryConstraints.filter(Boolean)],
    firestore: defaultFirestoreInstance,
  };
}

export async function getDocsFromCache<T = DocumentData>(
  queryOrCol: CollectionReference<T> | Query<T>
): Promise<QuerySnapshot<T>> {
  return getDocs(queryOrCol);
}

export async function getDocsFromServer<T = DocumentData>(
  queryOrCol: CollectionReference<T> | Query<T>
): Promise<QuerySnapshot<T>> {
  return getDocs(queryOrCol);
}

export async function getCountFromServer<T = DocumentData>(
  queryOrCol: CollectionReference<T> | Query<T>
): Promise<{ data: () => { count: number } }> {
  const snapshot = await getDocs(queryOrCol);
  return {
    data: () => ({ count: snapshot.size }),
  };
}

export async function getAggregateFromServer<T = DocumentData>(
  queryOrCol: CollectionReference<T> | Query<T>,
  aggregateSpec: any
): Promise<{ data: () => any }> {
  const snapshot = await getDocs(queryOrCol);
  const result: any = {};
  for (const [key, spec] of Object.entries(aggregateSpec || {})) {
    if ((spec as any)?.__type === 'count') {
      result[key] = snapshot.size;
    } else if ((spec as any)?.__type === 'sum') {
      const field = (spec as any).field;
      let total = 0;
      snapshot.docs.forEach((d) => {
        const val = d.data()?.[field];
        if (typeof val === 'number') total += val;
      });
      result[key] = total;
    } else if ((spec as any)?.__type === 'average') {
      const field = (spec as any).field;
      let total = 0;
      let count = 0;
      snapshot.docs.forEach((d) => {
        const val = d.data()?.[field];
        if (typeof val === 'number') {
          total += val;
          count++;
        }
      });
      result[key] = count > 0 ? total / count : 0;
    }
  }
  return {
    data: () => result,
  };
}

export function sum(field: string): any {
  return { __type: 'sum', field };
}

export function average(field: string): any {
  return { __type: 'average', field };
}

export function count(): any {
  return { __type: 'count' };
}

/**
 * Creates a where query constraint.
 */
export function where(field: string, op: any, value: any): QueryConstraint {
  return {
    type: 'where',
    field,
    op: op as string,
    value,
  };
}

/**
 * Creates an orderBy query constraint.
 */
export function orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): QueryConstraint {
  return {
    type: 'orderBy',
    field,
    direction,
  };
}

/**
 * Creates a limit query constraint.
 */
export function limit(limitCount: number): QueryConstraint {
  return {
    type: 'limit',
    limitCount,
  };
}

export function limitToLast(limitCount: number): QueryConstraint {
  return {
    type: 'limit',
    limitCount,
  };
}

export function startAfter(value: any): QueryConstraint {
  return { type: 'startAfter', value };
}

export function endBefore(value: any): QueryConstraint {
  return { type: 'endBefore', value };
}

export function startAt(value: any): QueryConstraint {
  return { type: 'startAfter', value };
}

export function endAt(value: any): QueryConstraint {
  return { type: 'endBefore', value };
}

// Sentinel & Atomic field transformations
export function serverTimestamp(): string {
  return new Date().toISOString();
}

export function increment(n: number) {
  return { __op: 'increment', value: n };
}

export function arrayUnion(...elements: any[]) {
  return { __op: 'arrayUnion', value: elements };
}

export function arrayRemove(...elements: any[]) {
  return { __op: 'arrayRemove', value: elements };
}

export function deleteField() {
  return { __op: 'deleteField' };
}

export function documentId(): string {
  return '__id__';
}

// WriteBatch & Transaction Support for MongoDB
export class MongoWriteBatch {
  private ops: Array<{ type: 'set' | 'update' | 'delete'; col: string; id: string; data?: any }> = [];

  set(docRef: DocumentReference, data: any, options?: SetOptions): MongoWriteBatch {
    this.ops.push({ type: 'set', col: docRef.parent.id, id: docRef.id, data });
    return this;
  }

  update(docRef: DocumentReference, data: any): MongoWriteBatch {
    this.ops.push({ type: 'update', col: docRef.parent.id, id: docRef.id, data });
    return this;
  }

  delete(docRef: DocumentReference): MongoWriteBatch {
    this.ops.push({ type: 'delete', col: docRef.parent.id, id: docRef.id });
    return this;
  }

  async commit(): Promise<void> {
    for (const op of this.ops) {
      if (op.type === 'set') {
        await apiRequest(`/api/db/${op.col}/${op.id}`, { method: 'POST', body: JSON.stringify(op.data) });
      } else if (op.type === 'update') {
        await apiRequest(`/api/db/${op.col}/${op.id}`, { method: 'PATCH', body: JSON.stringify(op.data) });
      } else if (op.type === 'delete') {
        await apiRequest(`/api/db/${op.col}/${op.id}`, { method: 'DELETE' });
      }
    }
  }
}

export function writeBatch(firestore?: Firestore): MongoWriteBatch {
  return new MongoWriteBatch();
}

export async function runTransaction<T>(
  firestore: Firestore | any,
  updateFunction: (transaction: {
    get: <U>(ref: DocumentReference<U>) => Promise<DocumentSnapshot<U>>;
    set: <U>(ref: DocumentReference<U>, data: Partial<U>, options?: SetOptions) => void;
    update: <U>(ref: DocumentReference<U>, data: any) => void;
    delete: (ref: DocumentReference) => void;
  }) => Promise<T>
): Promise<T> {
  const pendingSets: Array<{ ref: DocumentReference; data: any; options?: SetOptions }> = [];
  const pendingUpdates: Array<{ ref: DocumentReference; data: any }> = [];
  const pendingDeletes: Array<DocumentReference> = [];

  const tx = {
    get: async <U>(ref: DocumentReference<U>) => {
      return await getDoc(ref);
    },
    set: <U>(ref: DocumentReference<U>, data: Partial<U>, options?: SetOptions) => {
      pendingSets.push({ ref, data, options });
    },
    update: <U>(ref: DocumentReference<U>, data: any) => {
      pendingUpdates.push({ ref, data });
    },
    delete: (ref: DocumentReference) => {
      pendingDeletes.push(ref);
    },
  };

  const result = await updateFunction(tx);

  for (const item of pendingSets) {
    await setDoc(item.ref, item.data, item.options);
  }
  for (const item of pendingUpdates) {
    await updateDoc(item.ref, item.data);
  }
  for (const ref of pendingDeletes) {
    await deleteDoc(ref);
  }

  return result;
}

// SDK Init Compatibility Stubs
export function getFirestore(app?: any, databaseId?: string): Firestore {
  return defaultFirestoreInstance;
}

export function initializeFirestore(app?: any, settings?: any, databaseId?: string): Firestore {
  return defaultFirestoreInstance;
}

export function setLogLevel(level: string): void {
  // no-op
}

export function persistentLocalCache(options?: any): any {
  return {};
}

export function persistentMultipleTabManager(): any {
  return {};
}

export function enableIndexedDbPersistence(): Promise<void> {
  return Promise.resolve();
}

export function enableMultiTabIndexedDbPersistence(): Promise<void> {
  return Promise.resolve();
}

export function clearIndexedDbPersistence(): Promise<void> {
  return Promise.resolve();
}

export function terminate(): Promise<void> {
  return Promise.resolve();
}

export function waitForPendingWrites(): Promise<void> {
  return Promise.resolve();
}

export function disableNetwork(): Promise<void> {
  return Promise.resolve();
}

export function enableNetwork(): Promise<void> {
  return Promise.resolve();
}

export function loadBundle(db: any, bundleData: any): Promise<any> {
  return Promise.resolve();
}

export function namedQuery(db: any, name: string): Promise<any> {
  return Promise.resolve();
}
