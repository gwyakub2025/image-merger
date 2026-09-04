import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { SizerImageItem, SizerPreset, SizerUnit, SizerExportFormat } from '../types';
import { downloadBlob } from './exportUtils';

export const SOCIAL_PRESETS: SizerPreset[] = [
  // Social
  { id: 'ig-square', category: 'social', name: 'Instagram Square', width: 1080, height: 1080, description: '1:1 Feed Post', aspectRatio: '1:1' },
  { id: 'ig-portrait', category: 'social', name: 'Instagram Portrait', width: 1080, height: 1350, description: '4:5 Feed Portrait', aspectRatio: '4:5' },
  { id: 'ig-story', category: 'social', name: 'Instagram Story / Reel', width: 1080, height: 1920, description: '9:16 Full Screen', aspectRatio: '9:16' },
  { id: 'yt-thumb', category: 'social', name: 'YouTube Thumbnail', width: 1280, height: 720, description: '16:9 HD Thumbnail', aspectRatio: '16:9' },
  { id: 'fb-post', category: 'social', name: 'Facebook Post', width: 1200, height: 630, description: 'Standard Feed Post', aspectRatio: '1.91:1' },
  { id: 'fb-cover', category: 'social', name: 'Facebook Cover', width: 820, height: 312, description: 'Profile Header Banner', aspectRatio: '2.6:1' },
  { id: 'tw-post', category: 'social', name: 'X / Twitter Post', width: 1200, height: 675, description: 'Feed Image Card', aspectRatio: '16:9' },
  { id: 'tw-header', category: 'social', name: 'X / Twitter Header', width: 1500, height: 500, description: 'Profile Banner', aspectRatio: '3:1' },
  { id: 'li-post', category: 'social', name: 'LinkedIn Post', width: 1200, height: 627, description: 'Shared Feed Post', aspectRatio: '1.91:1' },

  // Document & Passport
  { id: 'passport-in', category: 'document', name: 'Passport Size (3.5 × 4.5 cm)', width: 413, height: 531, description: 'Official Passport (300 DPI)', aspectRatio: '3.5:4.5' },
  { id: 'passport-us', category: 'document', name: 'Passport 2×2 Inch (US/Visa)', width: 600, height: 600, description: '2×2 inch Square (300 DPI)', aspectRatio: '1:1' },
  { id: 'stamp-photo', category: 'document', name: 'Stamp Size Photo (2 × 2.5 cm)', width: 236, height: 295, description: 'Small Official Stamp (300 DPI)', aspectRatio: '4:5' },
  { id: 'id-card', category: 'document', name: 'ID Card (CR80 Standard)', width: 1011, height: 638, description: '85.6 × 53.98 mm (300 DPI)', aspectRatio: '1.58:1' },
  { id: 'a4-print-150', category: 'document', name: 'ISO A4 Sheet (150 DPI)', width: 1240, height: 1754, description: '210 × 297 mm Document', aspectRatio: '1:1.414' },
  { id: 'a4-print-300', category: 'document', name: 'ISO A4 Sheet (300 DPI)', width: 2480, height: 3508, description: 'Ultra Crisp High-Res Print', aspectRatio: '1:1.414' },

  // Web & Wallpaper
  { id: 'full-hd', category: 'web', name: 'Full HD 1080p', width: 1920, height: 1080, description: '1920 × 1080 Standard HD', aspectRatio: '16:9' },
  { id: '4k-uhd', category: 'web', name: '4K Ultra HD', width: 3840, height: 2160, description: '3840 × 2160 UHD Display', aspectRatio: '16:9' },
  { id: 'web-banner', category: 'web', name: 'Web Banner Leaderboard', width: 728, height: 90, description: '728 × 90 Ad Header', aspectRatio: '8:1' },
];

export interface ResizeOptions {
  mode: 'by-size' | 'percentage' | 'social-media';
  width: number;
  height: number;
  unit: SizerUnit;
  lockAspectRatio: boolean;
  percentage: number;
  presetId: string;
  dpi: number;
  fitMode: 'contain' | 'cover' | 'stretch';
  backgroundColor: string;
  outputFormat: SizerExportFormat;
  quality: number; // 0.1 to 1.0
  targetFileSizeKb?: number; // optional target file size cap
}

/**
 * Calculates target pixel dimensions based on original image size and user options
 */
export function calculateTargetDimensions(
  originalW: number,
  originalH: number,
  options: ResizeOptions
): { width: number; height: number } {
  const { mode, width, height, unit, percentage, presetId, dpi, lockAspectRatio } = options;

  if (mode === 'percentage') {
    const scale = Math.max(0.01, percentage / 100);
    return {
      width: Math.max(1, Math.round(originalW * scale)),
      height: Math.max(1, Math.round(originalH * scale)),
    };
  }

  if (mode === 'social-media') {
    const preset = SOCIAL_PRESETS.find((p) => p.id === presetId) || SOCIAL_PRESETS[0];
    return {
      width: preset.width,
      height: preset.height,
    };
  }

  // mode === 'by-size'
  // Convert unit to px
  const toPx = (val: number): number => {
    switch (unit) {
      case 'in':
        return Math.round(val * dpi);
      case 'cm':
        return Math.round((val / 2.54) * dpi);
      case 'mm':
        return Math.round((val / 25.4) * dpi);
      case '%':
        return Math.round((originalW * val) / 100);
      case 'px':
      default:
        return Math.round(val);
    }
  };

  const targetW = toPx(width);
  const targetH = unit === '%' ? Math.round((originalH * height) / 100) : toPx(height);

  return {
    width: Math.max(1, targetW || originalW),
    height: Math.max(1, targetH || originalH),
  };
}

/**
 * Loads an image from an URL or data URL
 */
export function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image source: ' + e));
    img.src = src;
  });
}

export interface ProcessedImageResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
  format: string;
}

/**
 * Processes and resizes a single image item onto an HTML canvas
 */
export async function processImage(
  item: SizerImageItem,
  options: ResizeOptions
): Promise<ProcessedImageResult> {
  const img = await loadImg(item.originalUrl);

  const { width: targetW, height: targetH } = calculateTargetDimensions(
    item.originalWidth,
    item.originalHeight,
    options
  );

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to create canvas context');

  // Fill background
  if (options.outputFormat === 'jpg' || (options.backgroundColor && options.backgroundColor !== 'transparent')) {
    ctx.fillStyle = options.backgroundColor || '#FFFFFF';
    ctx.fillRect(0, 0, targetW, targetH);
  }

  // Draw image with rotation and flips
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Apply transformations
  const rot = (item.rotation || 0) % 360;
  const rad = (rot * Math.PI) / 180;

  // Source aspect ratio vs target aspect ratio
  const srcW = item.originalWidth;
  const srcH = item.originalHeight;

  let drawX = 0;
  let drawY = 0;
  let drawW = targetW;
  let drawH = targetH;

  if (options.fitMode === 'contain') {
    const srcAspect = srcW / srcH;
    const tgtAspect = targetW / targetH;
    if (srcAspect > tgtAspect) {
      drawW = targetW;
      drawH = targetW / srcAspect;
      drawX = 0;
      drawY = (targetH - drawH) / 2;
    } else {
      drawH = targetH;
      drawW = targetH * srcAspect;
      drawY = 0;
      drawX = (targetW - drawW) / 2;
    }
  } else if (options.fitMode === 'cover') {
    const srcAspect = srcW / srcH;
    const tgtAspect = targetW / targetH;
    if (srcAspect > tgtAspect) {
      drawH = targetH;
      drawW = targetH * srcAspect;
      drawY = 0;
      drawX = (targetW - drawW) / 2;
    } else {
      drawW = targetW;
      drawH = targetW / srcAspect;
      drawX = 0;
      drawY = (targetH - drawH) / 2;
    }
  }

  // Center translation for rotation/flipping
  const centerX = drawX + drawW / 2;
  const centerY = drawY + drawH / 2;

  ctx.translate(centerX, centerY);
  if (rad !== 0) ctx.rotate(rad);
  if (item.flipH) ctx.scale(-1, 1);
  if (item.flipV) ctx.scale(1, -1);

  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();

  // Determine mime type
  let mimeType = 'image/jpeg';
  let ext = 'jpg';
  if (options.outputFormat === 'png') {
    mimeType = 'image/png';
    ext = 'png';
  } else if (options.outputFormat === 'webp') {
    mimeType = 'image/webp';
    ext = 'webp';
  } else if (options.outputFormat === 'original') {
    if (item.originalType.includes('png')) {
      mimeType = 'image/png';
      ext = 'png';
    } else if (item.originalType.includes('webp')) {
      mimeType = 'image/webp';
      ext = 'webp';
    } else {
      mimeType = 'image/jpeg';
      ext = 'jpg';
    }
  }

  // If Target File Size (KB) is specified and mimeType is compressible
  let finalQuality = options.quality ?? 0.85;
  if (options.targetFileSizeKb && options.targetFileSizeKb > 0 && (mimeType === 'image/jpeg' || mimeType === 'image/webp')) {
    const targetBytes = options.targetFileSizeKb * 1024;
    // Binary search quality to stay strictly under target size
    let minQ = 0.05;
    let maxQ = 0.98;
    let bestQuality = 0.5;

    for (let iter = 0; iter < 6; iter++) {
      const testQ = (minQ + maxQ) / 2;
      const testBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b || new Blob()), mimeType, testQ);
      });

      if (testBlob.size <= targetBytes) {
        bestQuality = testQ;
        minQ = testQ; // can we get higher quality?
      } else {
        maxQ = testQ; // need lower quality
      }
    }
    finalQuality = bestQuality;
  }

  // Generate output blob and dataUrl
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Canvas toBlob failed'));
      },
      mimeType,
      finalQuality
    );
  });

  const dataUrl = canvas.toDataURL(mimeType, finalQuality);

  return {
    blob,
    dataUrl,
    width: targetW,
    height: targetH,
    sizeBytes: blob.size,
    format: ext,
  };
}

/**
 * Exports selected images as individual downloads, ZIP, or PDF
 */
export async function exportSelectedImages(
  selectedItems: SizerImageItem[],
  options: ResizeOptions,
  onProgress?: (current: number, total: number, status: string) => void
): Promise<void> {
  if (selectedItems.length === 0) return;

  const total = selectedItems.length;

  // Single item direct download
  if (total === 1) {
    onProgress?.(1, 1, 'Processing image...');
    const item = selectedItems[0];
    const result = await processImage(item, options);

    const baseName = item.name.replace(/\.[^/.]+$/, '');
    const filename = `${baseName}_resized_${result.width}x${result.height}.${result.format}`;

    if (options.outputFormat === 'pdf') {
      const pdf = new jsPDF({
        orientation: result.width > result.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [result.width, result.height],
      });
      pdf.addImage(result.dataUrl, 'JPEG', 0, 0, result.width, result.height, undefined, 'FAST');
      pdf.save(`${baseName}_resized.pdf`);
    } else {
      downloadBlob(result.blob, filename);
    }
    return;
  }

  // If format is PDF, combine all selected images into a single clean PDF
  if (options.outputFormat === 'pdf') {
    onProgress?.(1, total, 'Creating multi-page PDF document...');
    const firstResult = await processImage(selectedItems[0], options);

    const pdf = new jsPDF({
      orientation: firstResult.width > firstResult.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [firstResult.width, firstResult.height],
    });

    pdf.addImage(firstResult.dataUrl, 'JPEG', 0, 0, firstResult.width, firstResult.height, undefined, 'FAST');

    for (let i = 1; i < total; i++) {
      onProgress?.(i + 1, total, `Rendering page ${i + 1} of ${total}...`);
      const res = await processImage(selectedItems[i], options);
      pdf.addPage([res.width, res.height], res.width > res.height ? 'landscape' : 'portrait');
      pdf.addImage(res.dataUrl, 'JPEG', 0, 0, res.width, res.height, undefined, 'FAST');
    }

    onProgress?.(total, total, 'Saving PDF document...');
    pdf.save(`Resized_Batch_${total}_Pages.pdf`);
    return;
  }

  // Bulk ZIP archive for multiple image exports
  const zip = new JSZip();
  const folder = zip.folder('resized_images') || zip;

  for (let i = 0; i < total; i++) {
    const item = selectedItems[i];
    onProgress?.(i + 1, total, `Resizing ${i + 1} of ${total}: ${item.name}...`);
    const result = await processImage(item, options);

    const baseName = item.name.replace(/\.[^/.]+$/, '');
    const filename = `${String(i + 1).padStart(2, '0')}_${baseName}_${result.width}x${result.height}.${result.format}`;

    folder.file(filename, result.blob);
  }

  onProgress?.(total, total, 'Compressing ZIP package...');
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  downloadBlob(zipBlob, `Resized_Images_Package_${total}_Items.zip`);
}
