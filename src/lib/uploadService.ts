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

async function compressImageFile(file: File, targetMaxBytes: number): Promise<File> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !file.type.startsWith('image/')) {
      return resolve(file);
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const maxDim = 1920;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.webp', {
              type: 'image/webp',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/webp',
          0.82
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
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

  let uploadFile = file;
  const maxBytes = endpoint === 'avatar' ? 2 * 1024 * 1024 : 4 * 1024 * 1024;
  if (uploadFile.size > maxBytes && typeof window !== 'undefined') {
    try {
      uploadFile = await compressImageFile(file, maxBytes);
    } catch {}
  }

  const formData = new FormData();
  formData.append('file', uploadFile);
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
