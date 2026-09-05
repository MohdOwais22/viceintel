import mongoose from 'mongoose';

/**
 * Lazy connection state cache across hot-reloads and lambda/container instances
 */
let cachedConnection: typeof mongoose | null = null;
let isConnecting = false;

/**
 * Sanitizes MONGODB_URI to remove unwanted leading/trailing spaces in credentials or hosts.
 */
function sanitizeMongoUri(rawUri: string): string {
  let clean = rawUri.trim();
  const match = clean.match(/^(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@(.+)$/);
  if (match) {
    const scheme = match[1];
    const username = match[2].trim();
    const password = match[3].trim();
    const rest = match[4].trim();
    return `${scheme}${username}:${password}@${rest}`;
  }
  return clean;
}

/**
 * Lazy Mongoose connection helper for Express server routes.
 * Gracefully checks process.env.MONGODB_URI before connecting.
 */
export async function connectToMongoDB(): Promise<typeof mongoose | null> {
  const rawUri = process.env.MONGODB_URI;

  if (!rawUri) {
    // Graceful warning without throwing crash-on-boot errors
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ MONGODB_URI is not defined in environment variables. MongoDB operations will be skipped.');
    }
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
    console.log('✅ Successfully connected to MongoDB Database:', conn.connection.name);
    return conn;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
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
