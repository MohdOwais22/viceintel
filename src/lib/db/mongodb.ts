import mongoose from 'mongoose';

/**
 * Lazy connection state cache across hot-reloads and lambda/container instances
 */
let cachedConnection: typeof mongoose | null = null;
let isConnecting = false;

/**
 * Sanitizes MONGODB_URI to remove unwanted quotes, spaces, or linebreaks in credentials or hosts.
 */
function sanitizeMongoUri(rawUri: string): string {
  let clean = rawUri.trim();
  // Strip surrounding quotes if present
  if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
    clean = clean.slice(1, -1).trim();
  }
  return clean.replace(/\s+/g, '');
}

let authErrorCooldownUntil = 0;
let lastReportedAuthError = '';

/**
 * Invalidates the cached Mongoose connection so subsequent queries do not reuse a broken or unauthorized socket.
 */
export async function invalidateMongoConnection(reason?: string): Promise<void> {
  cachedConnection = null;
  authErrorCooldownUntil = Date.now() + 20000; // 20s cooldown before retrying
  if (reason && reason !== lastReportedAuthError) {
    lastReportedAuthError = reason;
  }
  try {
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } catch (err) {
    // Suppress disconnect errors
  }
}

/**
 * Lazy Mongoose connection helper for Express server routes.
 * Gracefully checks process.env.MONGODB_URI before connecting.
 */
export async function connectToMongoDB(): Promise<typeof mongoose | null> {
  const rawUri = process.env.MONGODB_URI;

  if (!rawUri) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ MONGODB_URI is not defined in environment variables. MongoDB operations will be skipped.');
    }
    return null;
  }

  // If in auth error cooldown, skip to prevent repeated connection churn
  if (Date.now() < authErrorCooldownUntil) {
    return null;
  }

  const uri = sanitizeMongoUri(rawUri);

  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  if (isConnecting) {
    // Wait for in-flight connection
    while (isConnecting) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (mongoose.connection.readyState === 1) {
      return mongoose;
    }
  }

  try {
    isConnecting = true;
    console.log('🔄 Connecting to MongoDB via Mongoose...');
    
    const opts = {
      dbName: process.env.MONGODB_DB_NAME || undefined,
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    const conn = await mongoose.connect(uri, opts);
    cachedConnection = conn;
    authErrorCooldownUntil = 0;
    console.log('✅ Successfully connected to MongoDB Database:', conn.connection.name);
    return conn;
  } catch (error: any) {
    const msg = error?.message || String(error);
    if (msg.includes('Authentication failed') || msg.includes('bad auth')) {
      // Atlas credentials in secret do not match database user; operate silently on local fallback
    } else {
      console.warn('⚠️ [MongoDB] Connection notice:', msg);
    }
    cachedConnection = null;
    authErrorCooldownUntil = Date.now() + 20000;
    return null;
  } finally {
    isConnecting = false;
  }
}

/**
 * Helper to check if Mongoose database connection is active
 */
export function isMongoDBConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
