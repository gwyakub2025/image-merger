import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, degrees } from 'pdf-lib';
import JSZip from 'jszip';
import { 
  SplitMode, 
  PageThumbnailItem, 
  GeneratedSplitPdf, 
  EstimatedSplitOutput 
} from '../types/pdfSplitter';

// Ensure worker is configured
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

/**
 * Loads a PDF file and generates thumbnail data URLs for all pages.
 */
export async function generatePdfThumbnails(
  file: File,
  onProgress?: (loadedPages: number, totalPages: number) => void
): Promise<PageThumbnailItem[]> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
    cMapPacked: true,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const items: PageThumbnailItem[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 0.35 }); // Lightweight thumbnail scale

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
    }

    items.push({
      pageNumber: pageNum,
      thumbnailDataUrl: canvas.toDataURL('image/jpeg', 0.8),
      selected: false,
      rotation: 0,
      aspectRatio: viewport.width / viewport.height,
    });

    onProgress?.(pageNum, numPages);
  }

  return items;
}

/**
 * Parses user input like "1,3,5,8" or "1-5,6-10" into array of page indices (0-indexed).
 */
export function parseRangeExpression(expr: string, totalPages: number): number[][] {
  const clean = expr.replace(/\s+/g, '');
  if (!clean) return [];

  const parts = clean.split(',');
  const result: number[][] = [];

  for (const part of parts) {
    if (!part) continue;
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = Math.max(1, Math.min(totalPages, parseInt(startStr, 10) || 1));
      const end = Math.max(start, Math.min(totalPages, parseInt(endStr, 10) || start));
      const range: number[] = [];
      for (let p = start; p <= end; p++) {
        range.push(p - 1); // 0-indexed
      }
      if (range.length > 0) result.push(range);
    } else {
      const p = parseInt(part, 10);
      if (!isNaN(p) && p >= 1 && p <= totalPages) {
        result.push([p - 1]);
      }
    }
  }

  return result;
}

/**
 * Calculates estimated split output partitions based on selected mode and options.
 */
export function calculateEstimatedOutputs(
  baseName: string,
  totalPages: number,
  mode: SplitMode,
  selectedPages: number[], // 1-indexed
  options?: {
    customRangeText?: string;
    splitEveryX?: number;
    equalPartsCount?: number;
  }
): EstimatedSplitOutput[] {
  const safeBase = baseName.replace(/\.pdf$/i, '');
  const outputs: EstimatedSplitOutput[] = [];

  if (totalPages <= 0) return [];

  switch (mode) {
    case 'extract-pages': {
      // Each selected page or single list
      if (selectedPages.length === 0) return [];
      const sorted = [...selectedPages].sort((a, b) => a - b);
      outputs.push({
        name: `${safeBase}_extracted_pages.pdf`,
        pageRangeDesc: `Pages: ${sorted.join(', ')}`,
        pageIndices: sorted.map((p) => p - 1),
      });
      break;
    }

    case 'page-ranges':
    case 'custom-range': {
      const expr = options?.customRangeText || '1-5';
      const parsedGroups = parseRangeExpression(expr, totalPages);
      parsedGroups.forEach((group, idx) => {
        const start = group[0] + 1;
        const end = group[group.length - 1] + 1;
        outputs.push({
          name: `${safeBase}_part_${String(idx + 1).padStart(2, '0')}.pdf`,
          pageRangeDesc: start === end ? `Page ${start}` : `Pages ${start}–${end}`,
          pageIndices: group,
        });
      });
      break;
    }

    case 'split-every-page': {
      for (let i = 0; i < totalPages; i++) {
        outputs.push({
          name: `${safeBase}_page_${String(i + 1).padStart(3, '0')}.pdf`,
          pageRangeDesc: `Page ${i + 1}`,
          pageIndices: [i],
        });
      }
      break;
    }

    case 'split-every-x': {
      const step = Math.max(1, options?.splitEveryX || 5);
      let part = 1;
      for (let i = 0; i < totalPages; i += step) {
        const end = Math.min(i + step, totalPages);
        const indices: number[] = [];
        for (let p = i; p < end; p++) indices.push(p);
        outputs.push({
          name: `${safeBase}_part_${String(part).padStart(2, '0')}.pdf`,
          pageRangeDesc: `Pages ${i + 1}–${end}`,
          pageIndices: indices,
        });
        part++;
      }
      break;
    }

    case 'equal-parts': {
      const parts = Math.max(2, Math.min(totalPages, options?.equalPartsCount || 2));
      const pagesPerPart = Math.ceil(totalPages / parts);
      let currentIdx = 0;
      for (let p = 0; p < parts && currentIdx < totalPages; p++) {
        const endIdx = Math.min(currentIdx + pagesPerPart, totalPages);
        const indices: number[] = [];
        for (let j = currentIdx; j < endIdx; j++) indices.push(j);
        outputs.push({
          name: `${safeBase}_part_${String(p + 1).padStart(2, '0')}.pdf`,
          pageRangeDesc: `Pages ${currentIdx + 1}–${endIdx}`,
          pageIndices: indices,
        });
        currentIdx = endIdx;
      }
      break;
    }

    case 'delete-selected': {
      const selectedSet = new Set(selectedPages);
      const remainingIndices: number[] = [];
      for (let i = 1; i <= totalPages; i++) {
        if (!selectedSet.has(i)) remainingIndices.push(i - 1);
      }
      if (remainingIndices.length > 0) {
        outputs.push({
          name: `${safeBase}_remaining.pdf`,
          pageRangeDesc: `${remainingIndices.length} remaining pages (${totalPages - remainingIndices.length} deleted)`,
          pageIndices: remainingIndices,
        });
      }
      break;
    }

    case 'extract-into-one': {
      if (selectedPages.length > 0) {
        const sorted = [...selectedPages].sort((a, b) => a - b);
        outputs.push({
          name: `${safeBase}_selected_merged.pdf`,
          pageRangeDesc: `${sorted.length} selected pages: ${sorted.join(', ')}`,
          pageIndices: sorted.map((p) => p - 1),
        });
      }
      break;
    }

    case 'extract-into-separate': {
      if (selectedPages.length > 0) {
        const sorted = [...selectedPages].sort((a, b) => a - b);
        sorted.forEach((p, idx) => {
          outputs.push({
            name: `${safeBase}_page_${String(p).padStart(2, '0')}.pdf`,
            pageRangeDesc: `Page ${p}`,
            pageIndices: [p - 1],
          });
        });
      }
      break;
    }
  }

  return outputs;
}

/**
 * Executes PDF splitting based on calculated output partitions and rotation states.
 */
export async function executePdfSplit(
  file: File,
  outputs: EstimatedSplitOutput[],
  rotations?: Record<number, number>, // pageNumber -> degrees (0, 90, 180, 270)
  onProgress?: (done: number, total: number) => void
): Promise<GeneratedSplitPdf[]> {
  const arrayBuffer = await file.arrayBuffer();
  const sourceDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const results: GeneratedSplitPdf[] = [];

  for (let i = 0; i < outputs.length; i++) {
    const item = outputs[i];
    const subDoc = await PDFDocument.create();

    // Copy required page indices from source document
    const copiedPages = await subDoc.copyPages(sourceDoc, item.pageIndices);

    for (let idx = 0; idx < copiedPages.length; idx++) {
      const originalPageNum = item.pageIndices[idx] + 1;
      const extraRotation = (rotations && rotations[originalPageNum]) || 0;
      const page = copiedPages[idx];

      if (extraRotation !== 0) {
        const currentRot = page.getRotation().angle;
        page.setRotation(degrees((currentRot + extraRotation) % 360));
      }

      subDoc.addPage(page);
    }

    const bytes = await subDoc.save({ useObjectStreams: true });
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const downloadUrl = URL.createObjectURL(blob);

    results.push({
      id: `split_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`,
      name: item.name,
      pageRangeDesc: item.pageRangeDesc,
      pageCount: item.pageIndices.length,
      sizeBytes: blob.size,
      blob,
      downloadUrl,
    });

    onProgress?.(i + 1, outputs.length);
  }

  return results;
}

/**
 * Bundles multiple generated PDFs into a single ZIP file.
 */
export async function createZipFromSplitPdfs(
  files: GeneratedSplitPdf[],
  zipFilename: string = 'gulf_way_split_documents.zip'
): Promise<{ blob: Blob; downloadUrl: string }> {
  const zip = new JSZip();

  for (const file of files) {
    zip.file(file.name, file.blob);
  }

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const downloadUrl = URL.createObjectURL(zipBlob);
  return { blob: zipBlob, downloadUrl };
}
