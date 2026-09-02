/**
 * Centralized Image Upload Service for GTA VI Vice City Utility Suite
 * Eliminates all base64 data URLs from storage and replaces them with permanent CDN URLs.
 */

export type UploadEndpointKey =
  | 'serverBanner'
  | 'newsThumbnail'
  | 'avatar'
  | 'vehicleImage'
  | 'weaponImage'
  | 'characterImage'
  | 'reportScreenshot'
  | 'generalImage';

export interface UploadResult {
  url: string;
  name: string;
  size: number;
  key?: string;
}

/**
 * Uploads a local image File to UploadThing through the backend upload gateway
 * @param file The image File to upload
 * @param endpoint The target FileRouter endpoint category
 * @returns The permanent CDN image URL
 */
export async function uploadImageAsset(
  file: File,
  endpoint: UploadEndpointKey = 'generalImage'
): Promise<string> {
  if (!file) {
    throw new Error('No file provided for upload');
  }

  // Validate image MIME type
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file (PNG, JPG, WEBP, GIF, SVG)');
  }

  // Check file size (max 4MB for general, 2MB for avatar)
  const maxBytes = endpoint === 'avatar' ? 2 * 1024 * 1024 : 4 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(
      `File size exceeds ${endpoint === 'avatar' ? '2MB' : '4MB'} limit. Please compress or choose a smaller image.`
    );
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('endpoint', endpoint);

  const response = await fetch('/api/upload/direct', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorText = 'Upload failed';
    try {
      const errJson = await response.json();
      errorText = errJson.message || errJson.error || errorText;
    } catch {
      errorText = await response.text() || errorText;
    }
    throw new Error(errorText);
  }

  const data = await response.json();
  if (!data.url) {
    throw new Error('Invalid response from upload service: missing URL');
  }

  return data.url;
}
