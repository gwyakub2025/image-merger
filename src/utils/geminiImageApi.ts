import { UploadedImage } from '../types';

export interface GenerateImageResult {
  success: boolean;
  dataUrl: string;
  modelUsed: string;
  text?: string;
}

export interface EditImageResult {
  success: boolean;
  dataUrl: string;
  modelUsed: string;
  text?: string;
}

/**
 * Generate a new image from a text prompt using Gemini 3.1 Flash Image Preview.
 */
export async function generateImageWithGemini(
  prompt: string,
  aspectRatio: string = '1:1'
): Promise<GenerateImageResult> {
  const response = await fetch('/api/gemini/create-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, aspectRatio }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Image generation failed with status ${response.status}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Edit an existing image with a text prompt using Gemini 3.1 Flash Image Preview.
 */
export async function editImageWithGemini(
  prompt: string,
  imageBase64OrDataUrl: string,
  mimeType: string = 'image/png'
): Promise<EditImageResult> {
  const response = await fetch('/api/gemini/edit-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      imageBase64: imageBase64OrDataUrl,
      mimeType,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Image edit failed with status ${response.status}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Converts a generated/edited image dataUrl into an UploadedImage instance
 * so it integrates directly with the A4 batch grouping and optimization engine.
 */
export async function convertDataUrlToUploadedImage(
  dataUrl: string,
  filename: string = 'gemini-generated.jpg',
  quality: number = 0.88
): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const origW = img.naturalWidth || img.width;
      const origH = img.naturalHeight || img.height;
      const aspectRatio = origW / origH;

      const canvas = document.createElement('canvas');
      canvas.width = origW;
      canvas.height = origH;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, origW, origH);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create image blob'));
            return;
          }

          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          const compressedSize = blob.size;

          resolve({
            id: `gemini-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: filename,
            originalSize: compressedSize,
            originalWidth: origW,
            originalHeight: origH,
            compressedBlob: blob,
            compressedDataUrl,
            compressedSize,
            compressedWidth: origW,
            compressedHeight: origH,
            aspectRatio,
          });
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load generated image into canvas'));
    img.src = dataUrl;
  });
}
