import crypto from 'crypto';

/**
 * Derives a secure 32-byte encryption key from the environment secret.
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.DISCORD_CLIENT_SECRET || process.env.TOKEN_ENCRYPTION_KEY || 'vice-city-discord-master-key-2026';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypts an OAuth token or string using AES-256-GCM authenticated encryption.
 * Format: "gcm:<ivHex>:<authTagHex>:<cipherHex>"
 */
export function encryptDiscordToken(plainText: string): string {
  if (!plainText) return '';
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(12); // 12-byte IV for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    return `gcm:${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error('Discord token encryption failure:', error);
    throw new Error('Failed to securely encrypt Discord token');
  }
}

/**
 * Decrypts an AES-256-GCM encrypted token string.
 */
export function decryptDiscordToken(encryptedString: string): string | null {
  if (!encryptedString) return null;
  try {
    const parts = encryptedString.split(':');
    if (parts.length !== 4 || parts[0] !== 'gcm') {
      // Backwards compatibility or unsupported format
      return null;
    }
    const iv = Buffer.from(parts[1], 'hex');
    const authTag = Buffer.from(parts[2], 'hex');
    const ciphertext = parts[3];

    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Discord token decryption failure:', error);
    return null;
  }
}

/**
 * Masks a token for safe logging/display (e.g., "d_tok_••••••••8f2a")
 */
export function maskDiscordToken(token: string): string {
  if (!token || token.length < 8) return '••••••••';
  const prefix = token.slice(0, 4);
  const suffix = token.slice(-4);
  return `${prefix}••••••••${suffix}`;
}
