import { BatchConfig, UploadedImage, WatermarkConfig } from '../types';

export const A4_PORTRAIT_WIDTH = 1240;
export const A4_PORTRAIT_HEIGHT = 1754;

export interface SlotRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function getA4Dimensions(orientation: 'portrait' | 'landscape') {
  if (orientation === 'portrait') {
    return { width: A4_PORTRAIT_WIDTH, height: A4_PORTRAIT_HEIGHT };
  }
  return { width: A4_PORTRAIT_HEIGHT, height: A4_PORTRAIT_WIDTH };
}

export function computeSlots(
  config: BatchConfig,
  count: number,
  canvasW: number,
  canvasH: number
): SlotRect[] {
  // Convert mm to pixels roughly based on canvas size (210mm = canvasW in portrait)
  const pxPerMm = (config.orientation === 'portrait' ? canvasW : canvasH) / 210;
  const marginPx = Math.max(20, Math.round(config.marginMm * pxPerMm));
  const spacingPx = Math.max(12, Math.round(config.spacingMm * pxPerMm));

  const headerReserve = config.pageHeaderTitle || config.showPageNumbers ? 64 : 0;
  const footerReserve = config.showPageNumbers ? 44 : 0;

  const contentX = marginPx;
  const contentY = marginPx + headerReserve;
  const contentW = canvasW - marginPx * 2;
  const contentH = canvasH - marginPx * 2 - headerReserve - footerReserve;

  const slots: SlotRect[] = [];

  if (count === 1) {
    slots.push({
      x: contentX,
      y: contentY,
      width: contentW,
      height: contentH,
    });
    return slots;
  }

  if (config.imagesPerPage === 2 || count === 2) {
    if (config.orientation === 'portrait') {
      // 2 stacked rows
      const slotH = (contentH - spacingPx) / 2;
      slots.push({
        x: contentX,
        y: contentY,
        width: contentW,
        height: slotH,
      });
      slots.push({
        x: contentX,
        y: contentY + slotH + spacingPx,
        width: contentW,
        height: slotH,
      });
    } else {
      // Landscape: 2 side-by-side columns
      const slotW = (contentW - spacingPx) / 2;
      slots.push({
        x: contentX,
        y: contentY,
        width: slotW,
        height: contentH,
      });
      slots.push({
        x: contentX + slotW + spacingPx,
        y: contentY,
        width: slotW,
        height: contentH,
      });
    }
    return slots;
  }

  // 3 images per page
  if (config.orientation === 'portrait') {
    if (config.layout3Style === 'equal-rows') {
      // 3 horizontal rows
      const slotH = (contentH - spacingPx * 2) / 3;
      for (let i = 0; i < 3; i++) {
        slots.push({
          x: contentX,
          y: contentY + i * (slotH + spacingPx),
          width: contentW,
          height: slotH,
        });
      }
    } else {
      // 'featured-top' (1 prominent top image + 2 side-by-side bottom images)
      const topH = (contentH - spacingPx) * 0.52;
      const bottomH = contentH - spacingPx - topH;
      const bottomW = (contentW - spacingPx) / 2;

      // Slot 1: Top wide
      slots.push({
        x: contentX,
        y: contentY,
        width: contentW,
        height: topH,
      });
      // Slot 2: Bottom left
      slots.push({
        x: contentX,
        y: contentY + topH + spacingPx,
        width: bottomW,
        height: bottomH,
      });
      // Slot 3: Bottom right
      slots.push({
        x: contentX + bottomW + spacingPx,
        y: contentY + topH + spacingPx,
        width: bottomW,
        height: bottomH,
      });
    }
  } else {
    // Landscape 3 images
    if (config.layout3Style === 'equal-cols') {
      // 3 vertical columns
      const slotW = (contentW - spacingPx * 2) / 3;
      for (let i = 0; i < 3; i++) {
        slots.push({
          x: contentX + i * (slotW + spacingPx),
          y: contentY,
          width: slotW,
          height: contentH,
        });
      }
    } else {
      // 1 left featured + 2 stacked right
      const leftW = (contentW - spacingPx) * 0.55;
      const rightW = contentW - spacingPx - leftW;
      const rightH = (contentH - spacingPx) / 2;

      slots.push({
        x: contentX,
        y: contentY,
        width: leftW,
        height: contentH,
      });
      slots.push({
        x: contentX + leftW + spacingPx,
        y: contentY,
        width: rightW,
        height: rightH,
      });
      slots.push({
        x: contentX + leftW + spacingPx,
        y: contentY + rightH + spacingPx,
        width: rightW,
        height: rightH,
      });
    }
  }

  return slots;
}

export async function renderBatchToCanvas(
  images: UploadedImage[],
  batchIndex: number,
  totalBatches: number,
  config: BatchConfig
): Promise<{ dataUrl: string; blob: Blob }> {
  const { width, height } = getA4Dimensions(config.orientation);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  // Draw background
  ctx.fillStyle = config.backgroundColor || '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Draw Header if enabled
  const pxPerMm = (config.orientation === 'portrait' ? width : height) / 210;
  const marginPx = Math.max(20, Math.round(config.marginMm * pxPerMm));

  if (config.pageHeaderTitle || config.showPageNumbers) {
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const headerText = config.pageHeaderTitle || 'Gulf Way Group';
    ctx.fillText(headerText, marginPx, marginPx + 20);

    if (config.showPageNumbers) {
      ctx.textAlign = 'right';
      ctx.font = '500 18px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.fillText(`Batch Set ${batchIndex + 1} of ${totalBatches}`, width - marginPx, marginPx + 20);
    }

    // Divider line
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(marginPx, marginPx + 44);
    ctx.lineTo(width - marginPx, marginPx + 44);
    ctx.stroke();
  }

  // Compute Layout Slots
  const slots = computeSlots(config, images.length, width, height);

  // Load and draw images into slots
  for (let i = 0; i < images.length && i < slots.length; i++) {
    const imgData = images[i];
    const slot = slots[i];

    const img = await loadImageElement(imgData.compressedDataUrl);

    // Reserve caption height if captions enabled
    const captionHeight = config.showCaptions ? 28 : 0;
    const imgSlotH = slot.height - captionHeight;

    // Draw slot card background container
    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    ctx.roundRect(slot.x, slot.y, slot.width, imgSlotH, 8);
    ctx.fill();

    // Border
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(slot.x, slot.y, slot.width, imgSlotH, 8);
    ctx.clip();

    // Apply image filter (Grayscale, Sepia, High Contrast)
    if (imgData.filter === 'grayscale') {
      ctx.filter = 'grayscale(100%)';
    } else if (imgData.filter === 'sepia') {
      ctx.filter = 'sepia(100%)';
    } else if (imgData.filter === 'contrast') {
      ctx.filter = 'contrast(175%) brightness(105%)';
    } else {
      ctx.filter = 'none';
    }

    if (config.fitMode === 'cover') {
      // Cover: scale image so it completely covers the slot, center crop
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const slotRatio = slot.width / imgSlotH;
      let drawW: number;
      let drawH: number;
      let drawX: number;
      let drawY: number;

      if (imgRatio > slotRatio) {
        drawH = imgSlotH;
        drawW = imgSlotH * imgRatio;
        drawX = slot.x + (slot.width - drawW) / 2;
        drawY = slot.y;
      } else {
        drawW = slot.width;
        drawH = slot.width / imgRatio;
        drawX = slot.x;
        drawY = slot.y + (imgSlotH - drawH) / 2;
      }
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    } else {
      // Contain: scale image so entire image is visible, center inside slot
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const slotRatio = slot.width / imgSlotH;
      let drawW: number;
      let drawH: number;
      let drawX: number;
      let drawY: number;

      if (imgRatio > slotRatio) {
        drawW = slot.width - 16; // subtle padding
        drawH = drawW / imgRatio;
        drawX = slot.x + 8;
        drawY = slot.y + (imgSlotH - drawH) / 2;
      } else {
        drawH = imgSlotH - 16;
        drawW = drawH * imgRatio;
        drawX = slot.x + (slot.width - drawW) / 2;
        drawY = slot.y + 8;
      }
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    }
    ctx.restore();
    ctx.filter = 'none';

    // Caption
    if (config.showCaptions) {
      ctx.fillStyle = '#64748B';
      ctx.font = '14px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const capY = slot.y + imgSlotH + 14;

      // Truncate name if needed
      const maxTextW = slot.width - 120;
      let displayName = imgData.name;
      if (ctx.measureText(displayName).width > maxTextW) {
        while (displayName.length > 5 && ctx.measureText(displayName + '...').width > maxTextW) {
          displayName = displayName.slice(0, -1);
        }
        displayName += '...';
      }

      ctx.fillText(displayName, slot.x + 4, capY);

      // Resolution & size on right
      ctx.textAlign = 'right';
      ctx.fillStyle = '#94A3B8';
      ctx.font = '12px system-ui, -apple-system, sans-serif';
      ctx.fillText(
        `${imgData.compressedWidth}×${imgData.compressedHeight}px`,
        slot.x + slot.width - 4,
        capY
      );
    }
  }

  // Draw Footer if enabled
  if (config.showPageNumbers) {
    const footerY = height - marginPx - 10;
    ctx.strokeStyle = '#F1F5F9';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(marginPx, footerY - 14);
    ctx.lineTo(width - marginPx, footerY - 14);
    ctx.stroke();

    ctx.fillStyle = '#94A3B8';
    ctx.font = '13px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Gulf Way Group • Standard 210 × 297 mm A4', marginPx, footerY);

    ctx.textAlign = 'right';
    ctx.fillText(`Page ${batchIndex + 1} of ${totalBatches}`, width - marginPx, footerY);
  }

  // Draw Watermark Layer if configured
  if (config.watermark?.enabled) {
    await drawWatermarkLayer(ctx, width, height, config.watermark);
  }

  const quality = config.quality || 0.88;
  const dataUrl = canvas.toDataURL('image/jpeg', quality);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to create canvas blob'));
      },
      'image/jpeg',
      quality
    );
  });

  return { dataUrl, blob };
}

/**
 * Draws a custom watermark layer (text or image) on top of the A4 canvas
 */
export async function drawWatermarkLayer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  watermark: WatermarkConfig
): Promise<void> {
  if (!watermark || !watermark.enabled) return;

  ctx.save();
  const opacity = Math.max(0.02, Math.min(0.95, watermark.opacity ?? 0.18));
  ctx.globalAlpha = opacity;

  const pos = watermark.position || 'center-diagonal';

  if (watermark.type === 'text') {
    const text = watermark.text?.trim() || 'CONFIDENTIAL';
    const fontSize = watermark.fontSize || 54;
    const color = watermark.color || '#334155';

    ctx.fillStyle = color;
    ctx.font = `900 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

    if (pos === 'center-diagonal') {
      const angle = ((watermark.rotationAngle ?? -30) * Math.PI) / 180;
      ctx.translate(width / 2, height / 2);
      ctx.rotate(angle);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 0, 0);

      // Security stamp double outline
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.strokeText(text, 0, 0);
    } else if (pos === 'center') {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, width / 2, height / 2);
    } else if (pos === 'bottom-right') {
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(text, width - 60, height - 60);
    } else if (pos === 'top-right') {
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText(text, width - 60, 60);
    } else if (pos === 'repeat-pattern') {
      const angle = (-25 * Math.PI) / 180;
      const stepX = 360;
      const stepY = 240;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${Math.round(fontSize * 0.5)}px system-ui, -apple-system, sans-serif`;

      for (let y = -height * 0.2; y < height * 1.3; y += stepY) {
        for (let x = -width * 0.2; x < width * 1.3; x += stepX) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle);
          ctx.fillText(text, 0, 0);
          ctx.restore();
        }
      }
    }
  } else if (watermark.type === 'image' && watermark.imageUrl) {
    try {
      const img = await loadImageElement(watermark.imageUrl);
      const scale = watermark.imageScale || 0.35;
      const targetW = width * scale;
      const targetH = (targetW / img.naturalWidth) * img.naturalHeight;

      if (pos === 'center-diagonal') {
        const angle = ((watermark.rotationAngle ?? -30) * Math.PI) / 180;
        ctx.translate(width / 2, height / 2);
        ctx.rotate(angle);
        ctx.drawImage(img, -targetW / 2, -targetH / 2, targetW, targetH);
      } else if (pos === 'center') {
        ctx.drawImage(img, (width - targetW) / 2, (height - targetH) / 2, targetW, targetH);
      } else if (pos === 'bottom-right') {
        ctx.drawImage(img, width - targetW - 60, height - targetH - 60, targetW, targetH);
      } else if (pos === 'top-right') {
        ctx.drawImage(img, width - targetW - 60, 60, targetW, targetH);
      } else if (pos === 'repeat-pattern') {
        const stepX = targetW * 1.6;
        const stepY = targetH * 1.6;
        for (let y = 60; y < height - 60; y += stepY) {
          for (let x = 60; x < width - 60; x += stepX) {
            ctx.drawImage(img, x, y, targetW * 0.5, targetH * 0.5);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to render custom watermark image:', e);
    }
  }

  ctx.restore();
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Failed to load image: ${e}`));
    img.src = src;
  });
}
