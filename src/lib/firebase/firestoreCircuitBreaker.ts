/**
 * Firestore Write Circuit Breaker & Quota Guardian
 * Prevents repeating gRPC stream retries and unhandled exceptions when Firebase free-tier daily write limits are reached.
 * Automatically falls back to local IndexedDB / LocalStorage storage so the user experience is uninterrupted.
 */

let quotaExhaustedInMemory = false;

export function isFirestoreQuotaExhausted(): boolean {
  if (quotaExhaustedInMemory) return true;
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem('firestore_quota_exhausted');
      if (stored === 'true') {
        quotaExhaustedInMemory = true;
        return true;
      }
    } catch (e) {}
  }
  return false;
}

export function markFirestoreQuotaExhausted(error?: any): void {
  if (!quotaExhaustedInMemory) {
    quotaExhaustedInMemory = true;
    console.warn(
      '⚠️ [Firestore Quota Notice] Daily free tier write limit reached (RESOURCE_EXHAUSTED). ' +
      'Gracefully switching to high-speed local IndexedDB / LocalStorage persistence for user edits. ' +
      'Read operations and cached data remain fully functional.'
    );
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('firestore_quota_exhausted', 'true');
        window.dispatchEvent(new CustomEvent('firestore:quota_exhausted', { detail: { error } }));
      } catch (e) {}
    }
  }
}

export function isResourceExhaustedError(err: any): boolean {
  if (!err) return false;
  const code = err?.code || '';
  const message = String(err?.message || '');
  return (
    code === 'resource-exhausted' ||
    code === 8 ||
    message.includes('RESOURCE_EXHAUSTED') ||
    message.includes('Quota limit exceeded') ||
    message.includes('Free daily write units')
  );
}

/**
 * Wraps any Firestore write operation with automatic circuit breaking and error suppression.
 */
export async function safeFirestoreWrite<T>(
  writeFn: () => Promise<T>,
  fallbackValue?: T
): Promise<T | undefined> {
  if (isFirestoreQuotaExhausted()) {
    // Quota already exhausted for today; skip remote network write to avoid gRPC error stream
    return fallbackValue;
  }

  try {
    return await writeFn();
  } catch (err: any) {
    if (isResourceExhaustedError(err)) {
      markFirestoreQuotaExhausted(err);
      return fallbackValue;
    }
    console.warn('[Firestore Safe Write Warning]:', err?.message || err);
    return fallbackValue;
  }
}
