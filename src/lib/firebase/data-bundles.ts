import { db as clientDb } from './client';
import { loadBundle } from 'firebase/firestore';

/**
 * CLIENT-SIDE: Loads a binary Firestore Data Bundle from a URL into the local persistent cache.
 * This completely avoids billable reads for static collections because future queries will resolve from the cache.
 */
export async function loadFirestoreBundle(bundleUrl: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const response = await fetch(bundleUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch Firestore bundle from ${bundleUrl}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    // Load the bundle into the client's local Firestore cache
    const result = await loadBundle(clientDb, arrayBuffer);
    console.log(`[Firestore Bundle] Loaded bundle from ${bundleUrl}. Docs loaded: ${result.documentsLoaded}, status: ${result.taskState}`);
    return true;
  } catch (error) {
    console.error('[Firestore Bundle] Error loading bundle:', error);
    return false;
  }
}

/**
 * SERVER-SIDE: Generates a pre-compiled binary Firestore Bundle for specified collections.
 * Call this from server-side routes (e.g., Express /api/bundles/static-data).
 */
export async function generateFirestoreBundle(
  adminDb: any, // Pass the firebase-admin Firestore instance
  bundleId: string,
  collections: string[]
): Promise<Buffer> {
  const bundle = adminDb.bundle(bundleId);

  for (const collectionName of collections) {
    const querySnap = await adminDb.collection(collectionName).get();
    // Add the query snapshot to the bundle under a unique query alias
    bundle.add(`${collectionName}-query`, querySnap);
  }

  // Build and return the binary bundle as a Buffer
  const bundleBuffer = bundle.build();
  return bundleBuffer;
}
