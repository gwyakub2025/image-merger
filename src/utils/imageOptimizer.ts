import { UploadedImage } from '../types';

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export async function optimizeImageFile(
  file: File,
  quality = 0.82,
  maxDimension = 1920
): Promise<UploadedImage> {
  const originalSize = file.size;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error(`Invalid image file: ${file.name}`));
      img.onload = () => {
        const origW = img.naturalWidth || img.width;
        const origH = img.naturalHeight || img.height;
        const aspectRatio = origW / origH;

        // Calculate downscaled dimensions if exceeding maxDimension
        let targetW = origW;
        let targetH = origH;

        if (origW > maxDimension || origH > maxDimension) {
          if (origW >= origH) {
            targetW = maxDimension;
            targetH = Math.round(maxDimension / aspectRatio);
          } else {
            targetH = maxDimension;
            targetW = Math.round(maxDimension * aspectRatio);
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas 2D context unavailable'));
          return;
        }

        // High quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetW, targetH);

        // Convert to optimized JPEG for universal A4/web compatibility
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to generate image blob'));
              return;
            }

            const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            const compressedSize = blob.size;

            resolve({
              id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              name: file.name,
              originalSize,
              originalWidth: origW,
              originalHeight: origH,
              compressedBlob: blob,
              compressedDataUrl,
              compressedSize,
              compressedWidth: targetW,
              compressedHeight: targetH,
              aspectRatio,
            });
          },
          'image/jpeg',
          quality
        );
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}

// Generate demo placeholder images so users can test immediately
export async function createSampleImages(): Promise<File[]> {
  const samples = [
    { title: 'Modern Architecture', hue: 210, width: 2400, height: 1600, tag: 'Building & Facade' },
    { title: 'Mountain Sunset', hue: 28, width: 1600, height: 2400, tag: 'Landscape' },
    { title: 'Emerald Rainforest', hue: 155, width: 2200, height: 1500, tag: 'Nature' },
    { title: 'Minimalist Interior', hue: 45, width: 2000, height: 2000, tag: 'Design' },
    { title: 'Coastal Waves', hue: 190, width: 2400, height: 1400, tag: 'Ocean View' },
    { title: 'Urban Geometry', hue: 270, width: 1500, height: 2200, tag: 'City Architecture' },
  ];

  const files: File[] = [];

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    const canvas = document.createElement('canvas');
    canvas.width = s.width;
    canvas.height = s.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    // Gradient background
    const grad = ctx.createLinearGradient(0, 0, s.width, s.height);
    grad.addColorStop(0, `hsl(${s.hue}, 65%, 45%)`);
    grad.addColorStop(0.5, `hsl(${(s.hue + 25) % 360}, 70%, 55%)`);
    grad.addColorStop(1, `hsl(${(s.hue + 55) % 360}, 60%, 35%)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, s.width, s.height);

    // Subtle geometrical pattern overlay
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let x = 0; x < s.width; x += 120) {
      for (let y = 0; y < s.height; y += 120) {
        ctx.beginPath();
        ctx.arc(x + 60, y + 60, 35, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Modern card/frame in center
    const cardW = Math.min(s.width * 0.75, 1200);
    const cardH = Math.min(s.height * 0.6, 800);
    const cardX = (s.width - cardW) / 2;
    const cardY = (s.height - cardH) / 2;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 24);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Text details
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.round(cardH * 0.12)}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(s.title, s.width / 2, s.height / 2 - 40);

    ctx.fillStyle = '#94A3B8';
    ctx.font = `${Math.round(cardH * 0.065)}px system-ui, -apple-system, sans-serif`;
    ctx.fillText(`${s.tag} • ${s.width} × ${s.height}px`, s.width / 2, s.height / 2 + 50);

    const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/jpeg', 0.95));
    const file = new File([blob], `sample-${i + 1}-${s.title.toLowerCase().replace(/\s+/g, '-')}.jpg`, {
      type: 'image/jpeg',
    });
    files.push(file);
  }

  return files;
}
