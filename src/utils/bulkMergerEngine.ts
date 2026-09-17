import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun } from 'docx';
import {
  MergeFileType,
  MergeQueueItem,
  MergeConfig,
  MergeProgress,
  MergeResult,
} from '../types/bulkMerger';

// Initialize PDF.js worker safely
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

/**
 * Detects the file category for supported formats
 */
export function detectFileType(file: File): MergeFileType {
  const ext = file.name.toLowerCase().split('.').pop() || '';
  const mime = file.type.toLowerCase();

  if (ext === 'pdf' || mime.includes('pdf')) {
    return 'pdf';
  }

  if (
    ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'svg', 'gif', 'tiff', 'ico'].includes(ext) ||
    mime.startsWith('image/')
  ) {
    return 'image';
  }

  if (['docx', 'doc'].includes(ext) || mime.includes('wordprocessingml') || mime.includes('msword')) {
    return 'docx';
  }

  if (
    ['xlsx', 'xls', 'csv'].includes(ext) ||
    mime.includes('spreadsheetml') ||
    mime.includes('excel') ||
    mime === 'text/csv'
  ) {
    return 'excel';
  }

  if (['txt', 'md', 'json', 'log', 'rtf'].includes(ext) || mime.startsWith('text/')) {
    return 'text';
  }

  return 'unknown';
}

/**
 * Generates an intuitive thumbnail and metadata for any queued file
 */
export async function generateFileMetadata(
  file: File,
  type: MergeFileType
): Promise<{
  thumbnailUrl: string;
  pageCount: number;
  dimensions?: { width: number; height: number };
  previewText?: string;
  tableData?: any[][];
  sheetNames?: string[];
}> {
  try {
    if (type === 'pdf') {
      const buffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(buffer),
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true,
      });
      const pdf = await loadingTask.promise;
      const pageCount = pdf.numPages;

      // Render first page thumbnail
      const firstPage = await pdf.getPage(1);
      const viewport = firstPage.getViewport({ scale: 0.35 });
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(Math.floor(viewport.width), 10);
      canvas.height = Math.max(Math.floor(viewport.height), 10);
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await firstPage.render({ canvasContext: ctx, viewport }).promise;
      }

      // Quick text preview from page 1
      let previewText = '';
      try {
        const textContent = await firstPage.getTextContent();
        previewText = textContent.items
          .map((item: any) => item.str)
          .join(' ')
          .slice(0, 200);
      } catch {
        // ignore preview extraction errors
      }

      return {
        thumbnailUrl: canvas.toDataURL('image/jpeg', 0.8),
        pageCount,
        dimensions: { width: Math.round(viewport.width / 0.35), height: Math.round(viewport.height / 0.35) },
        previewText,
      };
    }

    if (type === 'image') {
      return new Promise((resolve) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          const maxDim = 280;
          let w = img.naturalWidth;
          let h = img.naturalHeight;
          const scale = Math.min(maxDim / w, maxDim / h, 1);
          w = Math.round(w * scale);
          h = Math.round(h * scale);

          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
          }
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.85);
          URL.revokeObjectURL(url);

          resolve({
            thumbnailUrl,
            pageCount: 1,
            dimensions: { width: img.naturalWidth, height: img.naturalHeight },
          });
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve({
            thumbnailUrl: createDefaultFileThumbnail('image', file.name),
            pageCount: 1,
          });
        };
        img.src = url;
      });
    }

    if (type === 'docx') {
      const buffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      const text = result.value || '';
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      const estimatedPages = Math.max(1, Math.ceil(words / 380));

      const thumb = createDocThumbnail('DOCX', file.name, text.slice(0, 160));
      return {
        thumbnailUrl: thumb,
        pageCount: estimatedPages,
        previewText: text.slice(0, 400),
      };
    }

    if (type === 'excel') {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetNames = workbook.SheetNames;
      let sampleData: any[][] = [];
      let totalRows = 0;

      if (sheetNames.length > 0) {
        const firstSheet = workbook.Sheets[sheetNames[0]];
        const jsonRows: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        sampleData = jsonRows.slice(0, 8);
        totalRows = jsonRows.length;
      }

      const estimatedPages = Math.max(1, Math.ceil(totalRows / 35) * Math.max(1, sheetNames.length));
      const thumb = createDocThumbnail('EXCEL', file.name, `Sheets: ${sheetNames.join(', ')}`);

      return {
        thumbnailUrl: thumb,
        pageCount: estimatedPages,
        sheetNames,
        tableData: sampleData,
        previewText: `${sheetNames.length} sheet(s) • ~${totalRows} rows`,
      };
    }

    if (type === 'text') {
      const text = await file.text();
      const lines = text.split('\n');
      const estimatedPages = Math.max(1, Math.ceil(lines.length / 50));
      const thumb = createDocThumbnail('TXT', file.name, text.slice(0, 160));
      return {
        thumbnailUrl: thumb,
        pageCount: estimatedPages,
        previewText: text.slice(0, 400),
      };
    }
  } catch (err) {
    console.error('Failed to generate metadata for file:', file.name, err);
  }

  return {
    thumbnailUrl: createDefaultFileThumbnail(type, file.name),
    pageCount: 1,
  };
}

/**
 * Creates an attractive canvas-rendered document badge thumbnail
 */
function createDocThumbnail(badge: string, filename: string, snippet: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 240;
  canvas.height = 310;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background page with drop shadow effect
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(0, 0, 240, 310);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(8, 8, 224, 294);
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(8, 8, 224, 294);

  // Top header bar
  const headerColor = badge === 'DOCX' ? '#2563EB' : badge === 'EXCEL' ? '#059669' : '#475569';
  ctx.fillStyle = headerColor;
  ctx.fillRect(8, 8, 224, 34);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(badge, 20, 30);

  // Document title
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, sans-serif';
  const truncatedName = filename.length > 22 ? filename.slice(0, 20) + '...' : filename;
  ctx.fillText(truncatedName, 20, 68);

  // Snippet lines
  ctx.fillStyle = '#64748B';
  ctx.font = '9px -apple-system, BlinkMacSystemFont, sans-serif';
  const words = snippet.replace(/\s+/g, ' ').trim().split(' ');
  let line = '';
  let y = 92;
  for (const w of words) {
    if ((line + w).length > 28) {
      ctx.fillText(line, 20, y);
      line = w + ' ';
      y += 14;
      if (y > 270) break;
    } else {
      line += w + ' ';
    }
  }
  if (line && y <= 270) {
    ctx.fillText(line, 20, y);
  }

  return canvas.toDataURL('image/png');
}

function createDefaultFileThumbnail(type: string, filename: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 240;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#F1F5F9';
  ctx.fillRect(0, 0, 240, 300);
  ctx.fillStyle = '#334155';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(type.toUpperCase(), 120, 140);
  ctx.font = '11px sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText(filename.slice(0, 20), 120, 165);

  return canvas.toDataURL('image/png');
}

/**
 * Parses page range string e.g. "all", "1-4", "1, 3, 5-8" into 1-based page indices
 */
export function parsePageRange(rangeStr: string, totalPages: number): number[] {
  const trimmed = rangeStr.trim().toLowerCase();
  if (!trimmed || trimmed === 'all' || trimmed === '*') {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pagesSet = new Set<number>();
  const parts = trimmed.split(/[,;\s]+/).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(totalPages, Math.max(start, end));
        for (let p = min; p <= max; p++) {
          pagesSet.add(p);
        }
      }
    } else {
      const p = parseInt(part, 10);
      if (!isNaN(p) && p >= 1 && p <= totalPages) {
        pagesSet.add(p);
      }
    }
  }

  const result = Array.from(pagesSet).sort((a, b) => a - b);
  return result.length > 0 ? result : Array.from({ length: totalPages }, (_, i) => i + 1);
}

/**
 * Validates a page range string format against total pages
 */
export function validatePageRange(rangeStr: string, totalPages: number): boolean {
  const trimmed = rangeStr.trim().toLowerCase();
  if (!trimmed || trimmed === 'all' || trimmed === '*') return true;

  const regex = /^(\d+(-\d+)?)(,\s*\d+(-\d+)?)*$/;
  if (!regex.test(trimmed)) return false;

  const parsed = parsePageRange(rangeStr, totalPages);
  return parsed.length > 0;
}

/**
 * 1. PRIMARY: Merges bulk files (PDFs, Images, Word, Excel, Text) into a single Master PDF
 */
export async function mergeFilesToPdf(
  items: MergeQueueItem[],
  config: MergeConfig,
  onProgress: (p: MergeProgress) => void
): Promise<MergeResult> {
  const startTime = performance.now();
  const mergedPdf = await PDFDocument.create();

  // Selected or active items
  const activeItems = items.filter((i) => i.status !== 'error');
  if (activeItems.length === 0) {
    throw new Error('No valid files available in queue to merge.');
  }

  const totalSteps = activeItems.length + (config.tableOfContents.enabled ? 1 : 0) + 2;
  let currentStep = 0;

  // Track file entry for Table of Contents
  const tocEntries: {
    name: string;
    type: string;
    size: number;
    startPage: number;
    pageCount: number;
  }[] = [];

  // Helper to get standard page dimensions in points (72 pt / inch)
  const getPageDimensions = (preset: string): [number, number] => {
    switch (preset) {
      case 'a4-portrait':
        return [595.28, 841.89];
      case 'a4-landscape':
        return [841.89, 595.28];
      case 'letter':
        return [612.0, 792.0];
      default:
        return [595.28, 841.89];
    }
  };

  // 1. Process each queued file and append pages
  for (let i = 0; i < activeItems.length; i++) {
    const item = activeItems[i];
    currentStep++;
    onProgress({
      isProcessing: true,
      totalSteps,
      currentStep,
      percent: Math.round((currentStep / totalSteps) * 85),
      currentFileName: item.name,
      statusMessage: `Processing file ${i + 1} of ${activeItems.length}: ${item.name}`,
    });

    const startPage = mergedPdf.getPageCount() + 1;
    let addedPagesCount = 0;

    if (item.type === 'pdf') {
      const buffer = await item.file.arrayBuffer();
      const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const srcTotalPages = srcDoc.getPageCount();
      const pageNumbers = parsePageRange(item.pageRange, srcTotalPages);
      const pageIndices = pageNumbers.map((p) => p - 1);

      const copiedPages = await mergedPdf.copyPages(srcDoc, pageIndices);

      for (const page of copiedPages) {
        if (item.rotation) {
          page.setRotation(degrees((page.getRotation().angle + item.rotation) % 360));
        }
        mergedPdf.addPage(page);
        addedPagesCount++;
      }
    } else if (item.type === 'image') {
      const imageBytes = await item.file.arrayBuffer();
      let embeddedImage;

      const ext = item.file.name.toLowerCase().split('.').pop() || '';
      if (ext === 'jpg' || ext === 'jpeg' || item.file.type === 'image/jpeg') {
        try {
          embeddedImage = await mergedPdf.embedJpg(imageBytes);
        } catch {
          embeddedImage = await embedViaCanvasPng(mergedPdf, item.file);
        }
      } else if (ext === 'png' || item.file.type === 'image/png') {
        try {
          embeddedImage = await mergedPdf.embedPng(imageBytes);
        } catch {
          embeddedImage = await embedViaCanvasPng(mergedPdf, item.file);
        }
      } else {
        // WEBP, BMP, SVG, GIF etc -> Convert to PNG via canvas
        embeddedImage = await embedViaCanvasPng(mergedPdf, item.file);
      }

      if (embeddedImage) {
        const [targetW, targetH] =
          config.pageSize === 'auto'
            ? [embeddedImage.width, embeddedImage.height]
            : getPageDimensions(config.pageSize);

        const page = mergedPdf.addPage([targetW, targetH]);

        // Calculate fitted image dimensions with margin
        const marginPt = (config.marginsMm * 72) / 25.4;
        const availW = Math.max(targetW - marginPt * 2, 20);
        const availH = Math.max(targetH - marginPt * 2, 20);

        const scale = Math.min(availW / embeddedImage.width, availH / embeddedImage.height, 1);
        const drawW = embeddedImage.width * scale;
        const drawH = embeddedImage.height * scale;
        const drawX = marginPt + (availW - drawW) / 2;
        const drawY = marginPt + (availH - drawH) / 2;

        page.drawImage(embeddedImage, {
          x: drawX,
          y: drawY,
          width: drawW,
          height: drawH,
        });

        if (item.rotation) {
          page.setRotation(degrees((page.getRotation().angle + item.rotation) % 360));
        }
        addedPagesCount++;
      }
    } else if (item.type === 'docx') {
      // Convert Word document to PDF pages and copy into merged document
      const docxPdfBytes = await convertDocxToPdfBytes(item.file);
      const srcDoc = await PDFDocument.load(docxPdfBytes);
      const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());

      for (const page of copiedPages) {
        if (item.rotation) {
          page.setRotation(degrees((page.getRotation().angle + item.rotation) % 360));
        }
        mergedPdf.addPage(page);
        addedPagesCount++;
      }
    } else if (item.type === 'excel') {
      // Convert Excel tables to formatted PDF pages
      const excelPdfBytes = await convertExcelToPdfBytes(item.file);
      const srcDoc = await PDFDocument.load(excelPdfBytes);
      const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());

      for (const page of copiedPages) {
        if (item.rotation) {
          page.setRotation(degrees((page.getRotation().angle + item.rotation) % 360));
        }
        mergedPdf.addPage(page);
        addedPagesCount++;
      }
    } else if (item.type === 'text') {
      // Convert plain text into styled PDF pages
      const textPdfBytes = await convertTextToPdfBytes(item.file);
      const srcDoc = await PDFDocument.load(textPdfBytes);
      const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());

      for (const page of copiedPages) {
        if (item.rotation) {
          page.setRotation(degrees((page.getRotation().angle + item.rotation) % 360));
        }
        mergedPdf.addPage(page);
        addedPagesCount++;
      }
    }

    tocEntries.push({
      name: item.name,
      type: item.type.toUpperCase(),
      size: item.size,
      startPage,
      pageCount: addedPagesCount,
    });
  }

  // 2. Optional: Generate & Prepend Table of Contents Cover Page
  if (config.tableOfContents.enabled && tocEntries.length > 0) {
    currentStep++;
    onProgress({
      isProcessing: true,
      totalSteps,
      currentStep,
      percent: 90,
      currentFileName: 'Table of Contents',
      statusMessage: 'Generating Executive Cover Page and Table of Contents index...',
    });

    const tocPdfBytes = await generateTocPageBytes(tocEntries, config);
    const tocDoc = await PDFDocument.load(tocPdfBytes);
    const tocCopied = await mergedPdf.copyPages(tocDoc, tocDoc.getPageIndices());

    // Insert TOC pages at index 0 (start of document)
    for (let i = tocCopied.length - 1; i >= 0; i--) {
      mergedPdf.insertPage(0, tocCopied[i]);
    }
  }

  // 3. Apply Running Headers, Footers, Page Numbers, and Watermarks
  currentStep++;
  onProgress({
    isProcessing: true,
    totalSteps,
    currentStep,
    percent: 95,
    currentFileName: 'Finalizing',
    statusMessage: 'Applying running headers, page numbers, and security watermarks...',
  });

  const totalMergedPages = mergedPdf.getPageCount();
  const font = await mergedPdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await mergedPdf.embedFont(StandardFonts.HelveticaBold);

  const pages = mergedPdf.getPages();
  for (let idx = 0; idx < pages.length; idx++) {
    const page = pages[idx];
    const { width, height } = page.getSize();
    const isFirstPage = idx === 0;

    // A. Headers & Footers
    if (config.headerFooter.enabled && (!config.headerFooter.skipFirstPage || !isFirstPage)) {
      const headerY = height - 26;
      const footerY = 22;

      // Header Left
      if (config.headerFooter.headerLeft) {
        page.drawText(config.headerFooter.headerLeft, {
          x: 36,
          y: headerY,
          size: config.headerFooter.fontSize,
          font: boldFont,
          color: rgb(0.2, 0.3, 0.45),
        });
      }

      // Header Right
      if (config.headerFooter.headerRight) {
        const textW = font.widthOfTextAtSize(config.headerFooter.headerRight, config.headerFooter.fontSize);
        page.drawText(config.headerFooter.headerRight, {
          x: Math.max(width - 36 - textW, 40),
          y: headerY,
          size: config.headerFooter.fontSize,
          font,
          color: rgb(0.4, 0.45, 0.55),
        });
      }

      // Divider Lines
      page.drawLine({
        start: { x: 36, y: headerY - 6 },
        end: { x: width - 36, y: headerY - 6 },
        thickness: 0.5,
        color: rgb(0.85, 0.88, 0.92),
      });

      page.drawLine({
        start: { x: 36, y: footerY + 14 },
        end: { x: width - 36, y: footerY + 14 },
        thickness: 0.5,
        color: rgb(0.85, 0.88, 0.92),
      });
    }

    // B. Page Numbering
    if (config.headerFooter.showPageNumbers && (!config.headerFooter.skipFirstPage || !isFirstPage)) {
      let pageNumText = '';
      const curPageNum = idx + 1;

      switch (config.headerFooter.pageNumberStyle) {
        case 'page-x-of-y':
          pageNumText = `Page ${curPageNum} of ${totalMergedPages}`;
          break;
        case 'x-of-y':
          pageNumText = `${curPageNum} / ${totalMergedPages}`;
          break;
        case 'page-x':
          pageNumText = `Page ${curPageNum}`;
          break;
        case 'numbers-only':
          pageNumText = `${curPageNum}`;
          break;
        default:
          pageNumText = `${curPageNum} / ${totalMergedPages}`;
      }

      const pSize = config.headerFooter.fontSize;
      const textW = font.widthOfTextAtSize(pageNumText, pSize);
      let posX = (width - textW) / 2;
      let posY = 22;

      if (config.headerFooter.pageNumberPosition === 'bottom-right') {
        posX = width - 36 - textW;
      } else if (config.headerFooter.pageNumberPosition === 'bottom-left') {
        posX = 36;
      } else if (config.headerFooter.pageNumberPosition === 'top-right') {
        posY = height - 26;
        posX = width - 36 - textW;
      }

      page.drawText(pageNumText, {
        x: posX,
        y: posY,
        size: pSize,
        font,
        color: rgb(0.4, 0.45, 0.55),
      });
    }

    // C. Watermark
    if (config.watermark.enabled && config.watermark.text.trim()) {
      if (config.watermark.allPages || !isFirstPage) {
        const wmText = config.watermark.text.trim();
        const wmSize = config.watermark.fontSize || 48;
        const opacity = config.watermark.opacity || 0.12;
        const textWidth = boldFont.widthOfTextAtSize(wmText, wmSize);

        // Center watermark diagonally
        const angleRad = (config.watermark.rotation * Math.PI) / 180;
        const centerX = width / 2;
        const centerY = height / 2;

        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        const startX = centerX - (textWidth / 2) * cos;
        const startY = centerY - (textWidth / 2) * sin;

        page.drawText(wmText, {
          x: startX,
          y: startY,
          size: wmSize,
          font: boldFont,
          color: rgb(0.3, 0.4, 0.55),
          opacity,
          rotate: degrees(config.watermark.rotation),
        });
      }
    }
  }

  // 4. Save and return final binary
  const finalPdfBytes = await mergedPdf.save({
    useObjectStreams: config.compressionQuality !== 'lossless',
  });

  const blob = new Blob([finalPdfBytes], { type: 'application/pdf' });
  const downloadUrl = URL.createObjectURL(blob);
  const now = new Date();
  const dateStamp = now.toISOString().slice(0, 10);
  const filename = config.customOutputName
    ? `${config.customOutputName.replace(/\.pdf$/i, '')}.pdf`
    : `GulfWay_Merged_${dateStamp}.pdf`;

  const durationMs = Math.round(performance.now() - startTime);

  return {
    blob,
    downloadUrl,
    filename,
    fileSize: blob.size,
    format: 'pdf',
    totalPages: totalMergedPages,
    totalSourceFiles: activeItems.length,
    durationMs,
  };
}

/**
 * 2. Merges applicable files (Word, Text, and Images) into a consolidated .docx Word Document
 */
export async function mergeFilesToDocx(
  items: MergeQueueItem[],
  config: MergeConfig,
  onProgress: (p: MergeProgress) => void
): Promise<MergeResult> {
  const startTime = performance.now();
  const activeItems = items.filter((i) => i.status !== 'error');

  const children: any[] = [];

  // Title Header
  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [
        new TextRun({
          text: config.customOutputName || 'GulfWay Enterprise Suite — Consolidated Document',
          bold: true,
          size: 32,
          color: '2563EB',
        }),
      ],
      spacing: { after: 200 },
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Consolidated from ${activeItems.length} source file(s) • Generated: ${new Date().toLocaleDateString()}`,
          italics: true,
          size: 18,
          color: '64748B',
        }),
      ],
      spacing: { after: 400 },
    })
  );

  for (let idx = 0; idx < activeItems.length; idx++) {
    const item = activeItems[idx];
    onProgress({
      isProcessing: true,
      totalSteps: activeItems.length,
      currentStep: idx + 1,
      percent: Math.round(((idx + 1) / activeItems.length) * 90),
      currentFileName: item.name,
      statusMessage: `Adding ${item.name} to consolidated Word document...`,
    });

    // File Section Heading
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [
          new TextRun({
            text: `Document ${idx + 1}: ${item.name}`,
            bold: true,
            size: 24,
            color: '0F172A',
          }),
        ],
        spacing: { before: 300, after: 150 },
      })
    );

    if (item.type === 'docx') {
      const buffer = await item.file.arrayBuffer();
      const rawTextResult = await mammoth.extractRawText({ arrayBuffer: buffer });
      const paragraphs = rawTextResult.value.split('\n\n');
      for (const p of paragraphs) {
        if (p.trim()) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: p.trim(), size: 20, color: '334155' })],
              spacing: { after: 120 },
            })
          );
        }
      }
    } else if (item.type === 'text') {
      const text = await item.file.text();
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.trim()) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: line, size: 20, color: '334155' })],
              spacing: { after: 100 },
            })
          );
        }
      }
    } else if (item.type === 'image') {
      try {
        const imgBuffer = await item.file.arrayBuffer();
        const ext = item.extension.toLowerCase();
        const imgType: 'jpg' | 'png' | 'gif' | 'bmp' =
          ext === 'jpg' || ext === 'jpeg' ? 'jpg' : ext === 'gif' ? 'gif' : ext === 'bmp' ? 'bmp' : 'png';

        children.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: new Uint8Array(imgBuffer),
                type: imgType,
                transformation: {
                  width: Math.min(item.dimensions?.width || 500, 520),
                  height: Math.min(item.dimensions?.height || 350, 400),
                },
              }),
            ],
            spacing: { after: 200 },
          })
        );
      } catch (err) {
        console.warn('Could not embed image into DOCX:', err);
      }
    } else if (item.type === 'excel') {
      const buffer = await item.file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      for (const sheetName of workbook.SheetNames) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Sheet: ${sheetName}`,
                bold: true,
                size: 20,
                color: '059669',
              }),
            ],
            spacing: { before: 150, after: 100 },
          })
        );
        const rows: any[][] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
        for (const row of rows.slice(0, 30)) {
          if (row.length > 0) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: row.join('  |  '),
                    size: 18,
                    font: 'Consolas',
                    color: '475569',
                  }),
                ],
                spacing: { after: 60 },
              })
            );
          }
        }
      }
    } else if (item.type === 'pdf') {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `[PDF Source File: ${item.name} (${item.pageCount} page(s)) — Included in master archive]`,
              italics: true,
              size: 18,
              color: '64748B',
            }),
          ],
          spacing: { after: 120 },
        })
      );
    }
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  const blob = await Packer.toBlob(doc);
  const downloadUrl = URL.createObjectURL(blob);
  const filename = config.customOutputName
    ? `${config.customOutputName.replace(/\.docx$/i, '')}.docx`
    : `GulfWay_Merged_${new Date().toISOString().slice(0, 10)}.docx`;

  return {
    blob,
    downloadUrl,
    filename,
    fileSize: blob.size,
    format: 'docx',
    totalPages: activeItems.length,
    totalSourceFiles: activeItems.length,
    durationMs: Math.round(performance.now() - startTime),
  };
}

/**
 * 3. Merges and organizes all files into a standardized ZIP Archive
 */
export async function mergeFilesToZip(
  items: MergeQueueItem[],
  config: MergeConfig,
  onProgress: (p: MergeProgress) => void
): Promise<MergeResult> {
  const startTime = performance.now();
  const zip = new JSZip();
  const activeItems = items.filter((i) => i.status !== 'error');

  const manifestLines: string[] = [
    '====================================================',
    'GULFWAY ENTERPRISE SUITE — BULK FILES CONSOLIDATION',
    '====================================================',
    `Generated: ${new Date().toISOString()}`,
    `Total Files: ${activeItems.length}`,
    '',
    'INDEX OF FILES INCLUDED:',
    '----------------------------------------------------',
  ];

  for (let idx = 0; idx < activeItems.length; idx++) {
    const item = activeItems[idx];
    onProgress({
      isProcessing: true,
      totalSteps: activeItems.length,
      currentStep: idx + 1,
      percent: Math.round(((idx + 1) / activeItems.length) * 90),
      currentFileName: item.name,
      statusMessage: `Archiving file ${idx + 1} of ${activeItems.length}: ${item.name}`,
    });

    const paddedIdx = String(idx + 1).padStart(3, '0');
    const zipFilename = `${paddedIdx}_${item.name}`;
    zip.file(zipFilename, item.file);

    manifestLines.push(
      `[${paddedIdx}] ${item.name} (${item.type.toUpperCase()}) - ${Math.round(item.size / 1024)} KB - Pages: ${item.pageCount}`
    );
  }

  manifestLines.push('');
  manifestLines.push('Consolidated with GulfWay Enterprise Suite');
  zip.file('MANIFEST.txt', manifestLines.join('\n'));

  const blob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
    onProgress({
      isProcessing: true,
      totalSteps: 100,
      currentStep: Math.round(metadata.percent),
      percent: Math.round(metadata.percent),
      currentFileName: 'Compressing archive',
      statusMessage: `Compressing ZIP archive... ${Math.round(metadata.percent)}%`,
    });
  });

  const downloadUrl = URL.createObjectURL(blob);
  const filename = config.customOutputName
    ? `${config.customOutputName.replace(/\.zip$/i, '')}.zip`
    : `GulfWay_Archive_${new Date().toISOString().slice(0, 10)}.zip`;

  return {
    blob,
    downloadUrl,
    filename,
    fileSize: blob.size,
    format: 'zip',
    totalPages: activeItems.length,
    totalSourceFiles: activeItems.length,
    durationMs: Math.round(performance.now() - startTime),
  };
}

// ---------------------------------------------------------------------------
// HELPER CONVERTERS
// ---------------------------------------------------------------------------

/**
 * Fallback to embed any image format (WEBP, SVG, GIF, BMP) via HTML Canvas as PNG
 */
async function embedViaCanvasPng(pdfDoc: PDFDocument, file: File) {
  return new Promise<any>((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
      }
      canvas.toBlob(async (blob) => {
        URL.revokeObjectURL(url);
        if (blob) {
          const buffer = await blob.arrayBuffer();
          const embedded = await pdfDoc.embedPng(buffer);
          resolve(embedded);
        } else {
          resolve(null);
        }
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * Converts Word document into high-fidelity PDF pages binary
 */
async function convertDocxToPdfBytes(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const mammothResult = await mammoth.extractRawText({ arrayBuffer });
  const rawText = mammothResult.value;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const margin = 18;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;

  // Header banner
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235); // Blue 600
  doc.text('GulfWay Enterprise Suite • Document Converter', margin, margin);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Converted from: ${file.name}`, margin, margin + 6);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, margin + 10, pageWidth - margin, margin + 10);

  let currentY = margin + 18;
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);

  const paragraphs = rawText.split('\n');
  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) {
      currentY += 4;
      continue;
    }

    // Check heading pattern
    const isHeading = trimmed.length < 60 && trimmed === trimmed.toUpperCase();
    if (isHeading) {
      if (currentY > pageHeight - 30) {
        doc.addPage();
        currentY = margin;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text(trimmed, margin, currentY);
      currentY += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10.5);
      doc.setTextColor(51, 65, 85);
      continue;
    }

    const lines = doc.splitTextToSize(trimmed, contentWidth);
    for (const line of lines) {
      if (currentY > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
      }
      doc.text(line, margin, currentY);
      currentY += 6;
    }
    currentY += 2;
  }

  const output = doc.output('arraybuffer');
  return new Uint8Array(output);
}

/**
 * Converts Excel sheet data into styled PDF table pages
 */
async function convertExcelToPdfBytes(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const wb = XLSX.read(arrayBuffer, { type: 'array' });

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  wb.SheetNames.forEach((sheetName, sheetIdx) => {
    if (sheetIdx > 0) doc.addPage();

    const ws = wb.Sheets[sheetName];
    const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

    if (data.length === 0) {
      doc.setFontSize(12);
      doc.text(`Sheet: ${sheetName} (Empty)`, 14, 20);
      return;
    }

    const rawHeaders = (data[0] || []).map((h: any, i: number) =>
      h != null && String(h).trim() !== '' ? String(h).trim() : `Col ${i + 1}`
    );
    const bodyRows = data
      .slice(1)
      .filter((row) => row && row.some((c: any) => c != null && String(c).trim() !== ''))
      .map((row) => rawHeaders.map((_: any, colIdx: number) => (row[colIdx] != null ? String(row[colIdx]) : '')));

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Sheet: ${sheetName} • ${file.name}`, 14, 12);

    autoTable(doc, {
      head: [rawHeaders],
      body: bodyRows,
      startY: 18,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 14, right: 14, bottom: 14 },
    });
  });

  const output = doc.output('arraybuffer');
  return new Uint8Array(output);
}

/**
 * Converts plain text into clean paginated PDF bytes
 */
async function convertTextToPdfBytes(file: File): Promise<Uint8Array> {
  const text = await file.text();
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const margin = 18;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text(file.name, margin, margin);

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, margin + 4, pageWidth - margin, margin + 4);

  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  let currentY = margin + 14;
  const lines = text.split('\n');

  for (const rawLine of lines) {
    const splitLines = doc.splitTextToSize(rawLine || ' ', contentWidth);
    for (const line of splitLines) {
      if (currentY > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
      }
      doc.text(line, margin, currentY);
      currentY += 5;
    }
  }

  const output = doc.output('arraybuffer');
  return new Uint8Array(output);
}

/**
 * Generates an executive Table of Contents cover page
 */
async function generateTocPageBytes(
  entries: { name: string; type: string; size: number; startPage: number; pageCount: number }[],
  config: MergeConfig
): Promise<Uint8Array> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Corporate Badge Header
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, margin, pageWidth - margin * 2, 38, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, margin, pageWidth - margin * 2, 38, 3, 3, 'D');

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235); // Blue 600
  doc.text(config.tableOfContents.title || 'Executive Document Summary', margin + 8, margin + 14);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(
    config.tableOfContents.subtitle || 'GulfWay Enterprise Suite • Consolidated Master Document',
    margin + 8,
    margin + 22
  );

  doc.setFontSize(8.5);
  doc.text(
    `Date: ${new Date().toLocaleDateString()} • Total Source Files: ${entries.length} • Format: ${config.pageSize.toUpperCase()}`,
    margin + 8,
    margin + 30
  );

  // Table of Contents Rows
  const tableData = entries.map((entry, idx) => [
    String(idx + 1),
    entry.name,
    entry.type,
    `${Math.round(entry.size / 1024)} KB`,
    `${entry.pageCount} page(s)`,
    `Page ${entry.startPage + 1}`, // Account for TOC page prepended
  ]);

  autoTable(doc, {
    head: [['#', 'File Name', 'Format', 'File Size', 'Pages', 'Starting Page']],
    body: tableData,
    startY: margin + 46,
    theme: 'striped',
    styles: {
      fontSize: 8.5,
      cellPadding: 3.5,
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: margin, right: margin, bottom: margin },
  });

  // Footer stamp
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'GulfWay Enterprise Suite • Automated Bulk Consolidation Engine',
    pageWidth / 2,
    pageHeight - 12,
    { align: 'center' }
  );

  const output = doc.output('arraybuffer');
  return new Uint8Array(output);
}
