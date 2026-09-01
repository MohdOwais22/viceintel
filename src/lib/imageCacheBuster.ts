/**
 * Image Cache-Buster & Real-Time Versioning Engine for GTA VI Vice City Portal.
 * Ensures that when vehicles, characters, weapons, or map locations are updated
 * by admins in Firestore, all connected client tabs, devices, and browser HTTP caches
 * immediately load and render the new images without stale cache lag.
 */

/**
 * Strips existing cache-busting tokens and appends a fresh version query parameter
 * to standard HTTP/HTTPS URLs. Preserves Base64 Data URLs and Blob URIs as-is.
 */
export function applyCacheBusterToUrl(
  url: string | undefined | null,
  versionToken?: number | string
): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Data URLs (e.g. data:image/jpeg;base64,...) and Blob URLs should never have query params attached
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  const vToken = versionToken ? String(versionToken) : String(Date.now());

  try {
    // Handle standard absolute or relative URLs
    const isAbsolute = /^https?:\/\//i.test(trimmed);
    const dummyBase = 'https://viceintel.local';
    const parsed = isAbsolute ? new URL(trimmed) : new URL(trimmed, dummyBase);

    // Remove any previous version or timestamp params to avoid param bloating
    parsed.searchParams.delete('v');
    parsed.searchParams.delete('_v');
    parsed.searchParams.delete('t');
    parsed.searchParams.delete('cacheBust');

    // Append our fresh version token
    parsed.searchParams.set('v', vToken);

    if (isAbsolute) {
      return parsed.toString();
    } else {
      return parsed.pathname + parsed.search + parsed.hash;
    }
  } catch {
    // Fallback regex query appending if URL parsing fails
    const cleanUrl = trimmed.replace(/([?&])(_?v|t|cacheBust)=[^&]*(&|$)/g, '$1').replace(/[?&]$/, '');
    const separator = cleanUrl.includes('?') ? '&' : '?';
    return `${cleanUrl}${separator}v=${vToken}`;
  }
}

/**
 * Returns a guaranteed cache-busted image URL for React component rendering.
 * Provides a fallback URL if the target URL is invalid or empty.
 */
export function getCacheBustedImageUrl(
  url: string | undefined | null,
  versionToken?: number | string,
  fallback: string = 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&q=80'
): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return fallback;
  }
  return applyCacheBusterToUrl(url, versionToken);
}

/**
 * Automatically stamps and versions any catalog entity (Vehicle, Character, Weapon, etc.)
 * before committing to Firestore and local IndexedDB.
 */
export function withItemVersioning<
  T extends {
    id: string;
    imageUrl?: string;
    avatarUrl?: string;
    updatedAt?: number;
    version?: number;
    imageVersion?: number;
  }
>(item: T, existingItem?: T | null, forceNewTimestamp?: boolean): T {
  const now = Date.now();
  const prevVersion = existingItem?.version ?? item.version ?? 0;
  const nextVersion = prevVersion + 1;

  const hasImageChanged =
    forceNewTimestamp ||
    !existingItem ||
    (item.imageUrl && item.imageUrl !== existingItem.imageUrl) ||
    (item.avatarUrl && item.avatarUrl !== existingItem.avatarUrl);

  const imageVersion = hasImageChanged ? now : (item.imageVersion ?? existingItem?.imageVersion ?? now);

  let updatedImageUrl = item.imageUrl;
  if (updatedImageUrl && typeof updatedImageUrl === 'string' && !updatedImageUrl.startsWith('data:') && !updatedImageUrl.startsWith('blob:')) {
    updatedImageUrl = applyCacheBusterToUrl(updatedImageUrl, imageVersion);
  }

  let updatedAvatarUrl = item.avatarUrl;
  if (updatedAvatarUrl && typeof updatedAvatarUrl === 'string' && !updatedAvatarUrl.startsWith('data:') && !updatedAvatarUrl.startsWith('blob:')) {
    updatedAvatarUrl = applyCacheBusterToUrl(updatedAvatarUrl, imageVersion);
  }

  return {
    ...item,
    ...(updatedImageUrl !== undefined ? { imageUrl: updatedImageUrl } : {}),
    ...(updatedAvatarUrl !== undefined ? { avatarUrl: updatedAvatarUrl } : {}),
    updatedAt: now,
    version: nextVersion,
    imageVersion
  };
}
