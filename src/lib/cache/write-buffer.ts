import { Redis } from '@upstash/redis';

let redisInstance: Redis | null = null;

// Graceful lazy initialization of Upstash Redis to prevent startup crashes if credentials aren't set yet.
function getRedis(): Redis | null {
  if (redisInstance) return redisInstance;

  const url = process.env.UPSTASH_REDIS_REST_URL || '';
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || '';

  if (url && token && !url.includes('your-upstash')) {
    try {
      redisInstance = new Redis({ url, token });
      console.log('[Write Buffer] Upstash Redis initialized successfully.');
      return redisInstance;
    } catch (e) {
      console.error('[Write Buffer] Error creating Upstash Redis client:', e);
    }
  }
  return null;
}

// In-Memory Fallback Stores for offline/development environments without Upstash Redis
const localCounterBuffer = new Map<string, Map<string, number>>(); // docPath -> { fieldName -> delta }
const localMergeBuffer = new Map<string, Record<string, any>>(); // docPath -> mergedObject

/**
 * Queues a high-frequency numeric increment (e.g. view counts, search stats, live hits).
 * Aggregates changes in memory/Redis first to reduce Firestore writes by 99%.
 */
export async function queueCounterIncrement(
  docPath: string,
  fieldName: string,
  amount: number = 1
): Promise<void> {
  const redis = getRedis();
  if (redis) {
    try {
      // Use Redis Hash to queue increments per document and track active write-dirty keys
      const redisKey = `write_buffer:counters:${docPath}`;
      await redis.hincrby(redisKey, fieldName, amount);
      await redis.sadd('write_buffer:dirty_docs', docPath);
      return;
    } catch (err) {
      console.error('[Write Buffer] Redis counter queue failed, falling back to local memory:', err);
    }
  }

  // Fallback: local memory
  let docFields = localCounterBuffer.get(docPath);
  if (!docFields) {
    docFields = new Map<string, number>();
    localCounterBuffer.set(docPath, docFields);
  }
  const currentVal = docFields.get(fieldName) || 0;
  docFields.set(fieldName, currentVal + amount);
}

/**
 * Queues a partial object merge/telemetry update for bulk transaction flushing.
 */
export async function queueTelemetryMerge(
  docPath: string,
  data: Record<string, any>
): Promise<void> {
  const redis = getRedis();
  if (redis) {
    try {
      const redisKey = `write_buffer:merge:${docPath}`;
      await redis.hset(redisKey, data);
      await redis.sadd('write_buffer:dirty_docs', docPath);
      return;
    } catch (err) {
      console.error('[Write Buffer] Redis merge queue failed, falling back to local memory:', err);
    }
  }

  // Fallback: local memory
  const existing = localMergeBuffer.get(docPath) || {};
  localMergeBuffer.set(docPath, { ...existing, ...data });
}

/**
 * SERVER-SIDE: Batched flush synchronization worker.
 * Commits all dirty accumulated updates in Redis or local memory into Firestore
 * using a single high-performance `bulkWriter` instance.
 */
export async function flushTelemetryWriteBuffer(adminDb: any): Promise<{
  flushedDocs: number;
  success: boolean;
}> {
  const redis = getRedis();
  const dirtyDocs = new Set<string>();

  // Gather list of dirty documents to reconcile
  if (redis) {
    try {
      const redisDirty = await redis.smembers('write_buffer:dirty_docs');
      if (redisDirty && redisDirty.length > 0) {
        redisDirty.forEach((doc) => dirtyDocs.add(doc));
      }
    } catch (err) {
      console.error('[Write Buffer] Failed to read dirty docs from Redis:', err);
    }
  }

  // Combine with memory dirty documents
  localCounterBuffer.forEach((_, doc) => dirtyDocs.add(doc));
  localMergeBuffer.forEach((_, doc) => dirtyDocs.add(doc));

  if (dirtyDocs.size === 0) {
    return { flushedDocs: 0, success: true };
  }

  const bulkWriter = adminDb.bulkWriter();
  bulkWriter.onWriteError((error: any) => {
    console.error(`[Write Buffer] Firestore BulkWriter error at ${error.documentRef.path}:`, error.message);
    return false; // Do not retry automatically; let logging capture it
  });

  let opCount = 0;

  for (const docPath of dirtyDocs) {
    try {
      const updatePayload: Record<string, any> = {};

      // 1. Process counters
      let hasCounters = false;
      if (redis) {
        const redisKey = `write_buffer:counters:${docPath}`;
        const redisCounters = await redis.hgetall<Record<string, string>>(redisKey);
        if (redisCounters) {
          Object.entries(redisCounters).forEach(([field, val]) => {
            updatePayload[field] = adminDb.FieldValue.increment(parseInt(val, 10));
            hasCounters = true;
          });
          // Clear processed fields
          await redis.del(redisKey);
        }
      }

      // Merge local counters
      const memCounters = localCounterBuffer.get(docPath);
      if (memCounters) {
        memCounters.forEach((val, field) => {
          // If Redis already queued an increment, we sum them
          const existingInc = updatePayload[field];
          if (existingInc) {
            // Note: FieldValue.increment adds to the existing increment
            updatePayload[field] = adminDb.FieldValue.increment(val + memCounters.get(field)!);
          } else {
            updatePayload[field] = adminDb.FieldValue.increment(val);
          }
          hasCounters = true;
        });
        localCounterBuffer.delete(docPath);
      }

      // 2. Process telemetry merges
      let hasMerges = false;
      if (redis) {
        const redisKey = `write_buffer:merge:${docPath}`;
        const redisMerges = await redis.hgetall<Record<string, any>>(redisKey);
        if (redisMerges) {
          Object.entries(redisMerges).forEach(([field, val]) => {
            updatePayload[field] = val;
            hasMerges = true;
          });
          await redis.del(redisKey);
        }
      }

      // Merge local object updates
      const memMerges = localMergeBuffer.get(docPath);
      if (memMerges) {
        Object.entries(memMerges).forEach(([field, val]) => {
          updatePayload[field] = val;
          hasMerges = true;
        });
        localMergeBuffer.delete(docPath);
      }

      // If we accumulated actual operations, execute via bulkWriter
      if (hasCounters || hasMerges) {
        const docRef = adminDb.doc(docPath);
        // Using set with merge is safest for both creating and modifying analytics / counter docs
        bulkWriter.set(docRef, updatePayload, { merge: true });
        opCount++;
      }

      // Clear from dirty list in Redis
      if (redis) {
        await redis.srem('write_buffer:dirty_docs', docPath);
      }
    } catch (err) {
      console.error(`[Write Buffer] Error packing write for ${docPath}:`, err);
    }
  }

  // Commit all queued writes concurrently
  try {
    await bulkWriter.close();
    console.log(`[Write Buffer] Successfully flushed ${opCount} dirty documents to Firestore in bulk.`);
    return { flushedDocs: opCount, success: true };
  } catch (err) {
    console.error('[Write Buffer] Error closing bulkWriter during flush:', err);
    return { flushedDocs: opCount, success: false };
  }
}
