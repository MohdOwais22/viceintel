import { auth } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
  isQuotaExceeded?: boolean;
}

// Global state for quota exceeded status
let isQuotaExceededGlobal = false;
const quotaExceededListeners: Set<(isExceeded: boolean) => void> = new Set();

export function isFirestoreQuotaExceeded(): boolean {
  return isQuotaExceededGlobal;
}

export function subscribeQuotaExceeded(callback: (isExceeded: boolean) => void): () => void {
  quotaExceededListeners.add(callback);
  if (isQuotaExceededGlobal) {
    callback(true);
  }
  return () => {
    quotaExceededListeners.delete(callback);
  };
}

export function notifyQuotaExceeded() {
  if (!isQuotaExceededGlobal) {
    isQuotaExceededGlobal = true;
    quotaExceededListeners.forEach(cb => cb(true));
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): FirestoreErrorInfo {
  const errStr = error instanceof Error ? error.message : String(error);
  const isQuota = errStr.includes('RESOURCE_EXHAUSTED') || 
                  errStr.includes('Quota limit exceeded') || 
                  errStr.includes('Quota exceeded') ||
                  errStr.includes('code=resource-exhausted') ||
                  errStr.includes('8 RESOURCE_EXHAUSTED');

  if (isQuota) {
    notifyQuotaExceeded();
  }

  const errInfo: FirestoreErrorInfo = {
    error: errStr,
    isQuotaExceeded: isQuota,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  console.warn(`[Firestore ${operationType.toUpperCase()} Notification at ${path || 'unknown'}]:`, JSON.stringify(errInfo));
  return errInfo;
}
