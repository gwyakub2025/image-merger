import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import {
  PdfPageModel,
  AnyAnnotation,
  PdfHeaderFooterConfig,
  PdfWatermarkConfig,
  PdfMetadataConfig,
} from '../types/pdfEditor';

// Ensure PDF.js worker is properly configured
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

/**
 * Parses a hex color string ('#4f8ec2') or rgb into pdf-lib rgb(r, g, b) (0..1)
 */
export function hexToPdfRgb(hex: string, fallback = rgb(0, 0, 0)) {
  if (!hex || typeof hex !== 'string') return fallback;
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16) / 255;
    const g = parseInt(clean[1] + clean[1], 16) / 255;
    const b = parseInt(clean[2] + clean[2], 16) / 255;
    return rgb(r, g, b);
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16) / 255;
    const g = parseInt(clean.substring(2, 4), 16) / 255;
    const b = parseInt(clean.substring(4, 6), 16) / 255;
    return rgb(r, g, b);
  }
  return fallback;
}

/**
 * Load and inspect a PDF file into memory models
 */
export async function loadPdfDocument(arrayBuffer: ArrayBuffer): Promise<{
  pages: PdfPageModel[];
  pdfDocProxy: any;
}> {
  // CRITICAL: Clone the arrayBuffer because PDF.js Web Worker may transfer/neuter the underlying buffer!
  const bufferForPdfJs = arrayBuffer.slice(0);
  const loadingTask = pdfjsLib.getDocument({ data: bufferForPdfJs });
  const pdfDocProxy = await loadingTask.promise;
  const numPages = pdfDocProxy.numPages;
  const pages: PdfPageModel[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDocProxy.getPage(i);
    const viewport = page.getViewport({ scale: 1.0 });

    // Generate quick thumbnail for sidebar
    const thumbScale = 0.25;
    const thumbViewport = page.getViewport({ scale: thumbScale });
    const canvas = document.createElement('canvas');
    canvas.width = thumbViewport.width;
    canvas.height = thumbViewport.height;
    const ctx = canvas.getContext('2d');

    let thumbnailUrl = '';
    if (ctx) {
      // @ts-ignore
      await page.render({ canvasContext: ctx, viewport: thumbViewport }).promise;
      thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
    }

    pages.push({
      id: `page-${i}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      pageIndex: i - 1,
      originalPageIndex: i - 1,
      displayNumber: i,
      rotation: 0,
      width: viewport.width,
      height: viewport.height,
      aspectRatio: viewport.width / viewport.height,
      thumbnailUrl,
      isDeleted: false,
      isBlankInserted: false,
    });
  }

  return { pages, pdfDocProxy };
}

/**
 * Render a specific page to an HTML5 canvas at a given display scale
 */
export async function renderPdfPageToCanvas(
  pdfDocProxy: any,
  pageNumber: number,
  scale: number,
  canvas: HTMLCanvasElement
): Promise<void> {
  const page = await pdfDocProxy.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  
  // High DPI backing store
  const dpr = window.devicePixelRatio || 1;
  canvas.width = viewport.width * dpr;
  canvas.height = viewport.height * dpr;
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.scale(dpr, dpr);
  // @ts-ignore
  await page.render({ canvasContext: ctx, viewport }).promise;
}

/**
 * Generate a professional 3-page sample PDF document for instant testing
 */
export async function createSampleBusinessPdf(): Promise<{
  arrayBuffer: ArrayBuffer;
  fileName: string;
}> {
  const pdfDoc = await PDFDocument.create();
  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontTimes = await pdfDoc.embedFont(StandardFonts.TimesRoman);

  // Page 1: Executive Proposal & Cover
  const page1 = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width: p1W, height: p1H } = page1.getSize();

  // Top banner
  page1.drawRectangle({
    x: 0,
    y: p1H - 120,
    width: p1W,
    height: 120,
    color: rgb(0.12, 0.16, 0.24), // Dark Navy
  });

  page1.drawText('GULF WAY GROUP', {
    x: 40,
    y: p1H - 60,
    size: 24,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page1.drawText('Enterprise Operations & Technology Services • WPS Compliant', {
    x: 40,
    y: p1H - 85,
    size: 11,
    font: fontHelvetica,
    color: rgb(0.55, 0.7, 0.9),
  });

  // Body of Page 1
  page1.drawText('SERVICE LEVEL AGREEMENT & CONTRACT SPECIFICATION', {
    x: 40,
    y: p1H - 170,
    size: 14,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.25),
  });

  page1.drawText('Document Reference: GW-CONTRACT-2026-09X', {
    x: 40,
    y: p1H - 192,
    size: 10,
    font: fontHelvetica,
    color: rgb(0.4, 0.45, 0.5),
  });

  const introText = [
    'This Document outlines the enterprise integration specifications, automated batch data processing,',
    'and secure document management architecture for client operations across regional headquarters.',
    '',
    '1. SCOPE OF SERVICES',
    'The provider guarantees 99.9% uptime for A4 batch generation, high-speed document format converters,',
    'and direct Wages Protection System (WPS) extraction pipelines. All transmissions undergo TLS 1.3 cryptographic',
    'protocols in adherence to regional compliance directives.',
    '',
    '2. DATA RETENTION & REDACTION PROTOCOLS',
    'Sensitive employee identifiers, bank accounts, and corporate IBAN strings are subject to automated or manual',
    'whiteout redaction before multi-channel dissemination. Use the built-in Sejda-grade editor to inspect and redact.',
  ];

  let textY = p1H - 240;
  for (const line of introText) {
    if (line.startsWith('1.') || line.startsWith('2.')) {
      page1.drawText(line, { x: 40, y: textY, size: 11, font: fontBold, color: rgb(0.15, 0.2, 0.3) });
    } else {
      page1.drawText(line, { x: 40, y: textY, size: 10, font: fontHelvetica, color: rgb(0.3, 0.35, 0.4) });
    }
    textY -= 18;
  }

  // Sample watermark box
  page1.drawRectangle({
    x: 40,
    y: 120,
    width: p1W - 80,
    height: 90,
    color: rgb(0.96, 0.97, 0.99),
    borderColor: rgb(0.8, 0.85, 0.92),
    borderWidth: 1,
  });

  page1.drawText('INTERNAL AUDIT & VERIFICATION NOTICE', {
    x: 55,
    y: 185,
    size: 10,
    font: fontBold,
    color: rgb(0.3, 0.4, 0.6),
  });

  page1.drawText('This sample document is pre-populated with text fields, inspection tables, and signature blocks.', {
    x: 55,
    y: 165,
    size: 9,
    font: fontHelvetica,
    color: rgb(0.4, 0.45, 0.5),
  });

  page1.drawText('Test adding text, whiteout redaction, signing, annotating, and rearranging pages with Sejda-style speed.', {
    x: 55,
    y: 145,
    size: 9,
    font: fontHelvetica,
    color: rgb(0.4, 0.45, 0.5),
  });

  // Footer Page 1
  page1.drawText('Page 1 of 3 • Confidential Gulf Way Document', {
    x: p1W / 2 - 90,
    y: 35,
    size: 9,
    font: fontHelvetica,
    color: rgb(0.6, 0.65, 0.7),
  });

  // Page 2: Operational Schedule & Metric Table
  const page2 = pdfDoc.addPage([595.28, 841.89]);
  const { width: p2W, height: p2H } = page2.getSize();

  page2.drawText('SECTION 3: OPERATIONAL MILESTONES & PERFORMANCE METRICS', {
    x: 40,
    y: p2H - 60,
    size: 13,
    font: fontBold,
    color: rgb(0.12, 0.16, 0.24),
  });

  // Simple Table Header
  const tableTop = p2H - 100;
  page2.drawRectangle({
    x: 40,
    y: tableTop,
    width: p2W - 80,
    height: 26,
    color: rgb(0.2, 0.35, 0.55),
  });

  page2.drawText('Milestone ID', { x: 50, y: tableTop + 8, size: 9, font: fontBold, color: rgb(1, 1, 1) });
  page2.drawText('Service Component', { x: 130, y: tableTop + 8, size: 9, font: fontBold, color: rgb(1, 1, 1) });
  page2.drawText('Batch Throughput', { x: 280, y: tableTop + 8, size: 9, font: fontBold, color: rgb(1, 1, 1) });
  page2.drawText('Target SLA', { x: 420, y: tableTop + 8, size: 9, font: fontBold, color: rgb(1, 1, 1) });

  const rows = [
    { id: 'MS-01', comp: 'A4 Image Batch Engine', tp: '2,500 assets / min', sla: '99.95%' },
    { id: 'MS-02', comp: 'Doc Format Converter', tp: '500 MB / batch', sla: '99.90%' },
    { id: 'MS-03', comp: 'WPS Report Extractor', tp: '20,000 records / run', sla: '100.0%' },
    { id: 'MS-04', comp: 'Sheet VLOOKUP Merger', tp: '100,000 rows', sla: '99.98%' },
    { id: 'MS-05', comp: 'Client-Side PDF Editor', tp: 'Sub-second real-time', sla: 'Zero Latency' },
  ];

  let rY = tableTop - 26;
  rows.forEach((r, idx) => {
    page2.drawRectangle({
      x: 40,
      y: rY,
      width: p2W - 80,
      height: 24,
      color: idx % 2 === 0 ? rgb(0.97, 0.98, 0.99) : rgb(1, 1, 1),
      borderColor: rgb(0.88, 0.9, 0.94),
      borderWidth: 0.5,
    });
    page2.drawText(r.id, { x: 50, y: rY + 7, size: 9, font: fontHelvetica, color: rgb(0.2, 0.25, 0.3) });
    page2.drawText(r.comp, { x: 130, y: rY + 7, size: 9, font: fontBold, color: rgb(0.15, 0.2, 0.28) });
    page2.drawText(r.tp, { x: 280, y: rY + 7, size: 9, font: fontHelvetica, color: rgb(0.3, 0.35, 0.4) });
    page2.drawText(r.sla, { x: 420, y: rY + 7, size: 9, font: fontBold, color: rgb(0.1, 0.6, 0.3) });
    rY -= 24;
  });

  page2.drawText('Page 2 of 3 • Operational Schedule', {
    x: p2W / 2 - 70,
    y: 35,
    size: 9,
    font: fontHelvetica,
    color: rgb(0.6, 0.65, 0.7),
  });

  // Page 3: Signatures & Compliance
  const page3 = pdfDoc.addPage([595.28, 841.89]);
  const { width: p3W, height: p3H } = page3.getSize();

  page3.drawText('SECTION 4: AUTHORIZATION & SIGN-OFF', {
    x: 40,
    y: p3H - 60,
    size: 13,
    font: fontBold,
    color: rgb(0.12, 0.16, 0.24),
  });

  page3.drawText('By applying digital signatures below, both parties confirm adherence to specifications.', {
    x: 40,
    y: p3H - 85,
    size: 10,
    font: fontHelvetica,
    color: rgb(0.4, 0.45, 0.5),
  });

  // Sign box 1
  page3.drawRectangle({
    x: 40,
    y: p3H - 240,
    width: 230,
    height: 120,
    color: rgb(0.98, 0.99, 1),
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 1,
  });
  page3.drawText('FOR GULF WAY GROUP:', { x: 50, y: p3H - 145, size: 9, font: fontBold, color: rgb(0.2, 0.25, 0.3) });
  page3.drawText('Authorized Officer: M. Yakub', { x: 50, y: p3H - 165, size: 9, font: fontHelvetica, color: rgb(0.3, 0.35, 0.4) });
  page3.drawText('Date: September 5, 2026', { x: 50, y: p3H - 185, size: 9, font: fontHelvetica, color: rgb(0.3, 0.35, 0.4) });
  page3.drawText('[Place Signature Here]', { x: 50, y: p3H - 225, size: 8, font: fontTimes, color: rgb(0.6, 0.65, 0.7) });

  // Sign box 2
  page3.drawRectangle({
    x: 320,
    y: p3H - 240,
    width: 230,
    height: 120,
    color: rgb(0.98, 0.99, 1),
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 1,
  });
  page3.drawText('FOR CLIENT REPRESENTATIVE:', { x: 330, y: p3H - 145, size: 9, font: fontBold, color: rgb(0.2, 0.25, 0.3) });
  page3.drawText('Authorized Signatory: _____________', { x: 330, y: p3H - 165, size: 9, font: fontHelvetica, color: rgb(0.3, 0.35, 0.4) });
  page3.drawText('Date: ________________________', { x: 330, y: p3H - 185, size: 9, font: fontHelvetica, color: rgb(0.3, 0.35, 0.4) });
  page3.drawText('[Place Signature Here]', { x: 330, y: p3H - 225, size: 8, font: fontTimes, color: rgb(0.6, 0.65, 0.7) });

  page3.drawText('Page 3 of 3 • Execution & Close', {
    x: p3W / 2 - 60,
    y: 35,
    size: 9,
    font: fontHelvetica,
    color: rgb(0.6, 0.65, 0.7),
  });

  const pdfBytes = await pdfDoc.save();
  return {
    arrayBuffer: pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength),
    fileName: 'GulfWay_Service_Agreement_Sample.pdf',
  };
}

/**
 * Compile, apply all annotations, whiteouts, reorders, rotations, and save modified PDF
 */
export async function compileAndSaveModifiedPdf(params: {
  originalBytes: Uint8Array | null;
  pages: PdfPageModel[];
  annotations: AnyAnnotation[];
  headerFooter: PdfHeaderFooterConfig;
  watermark: PdfWatermarkConfig;
  metadata: PdfMetadataConfig;
}): Promise<Blob> {
  const { originalBytes, pages, annotations, headerFooter, watermark, metadata } = params;

  let baseDoc: PDFDocument | null = null;
  let basePageCount = 0;

  if (originalBytes && originalBytes.byteLength > 0) {
    try {
      // Clone originalBytes to prevent detached buffer issues
      const clonedBytes = new Uint8Array(
        originalBytes.buffer.slice(
          originalBytes.byteOffset,
          originalBytes.byteOffset + originalBytes.byteLength
        )
      );
      baseDoc = await PDFDocument.load(clonedBytes, { ignoreEncryption: true });
      basePageCount = baseDoc.getPageCount();
    } catch (loadErr) {
      console.warn('Could not parse originalBytes with PDFDocument.load, fallback to blank pages:', loadErr);
      baseDoc = null;
      basePageCount = 0;
    }
  }

  // Create clean output PDF document
  const outDoc = await PDFDocument.create();

  // Pre-embed standard fonts
  const fontHelvetica = await outDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await outDoc.embedFont(StandardFonts.HelveticaBold);
  const fontTimes = await outDoc.embedFont(StandardFonts.TimesRoman);
  const fontCourier = await outDoc.embedFont(StandardFonts.Courier);

  // Filter out deleted pages
  const activePages = pages.filter((p) => !p.isDeleted);
  const totalActive = activePages.length;

  // Process and copy pages in the chosen active order
  for (let newIdx = 0; newIdx < activePages.length; newIdx++) {
    const pageModel = activePages[newIdx];
    let pageObj: any;

    const sourceIdx =
      pageModel.originalPageIndex !== undefined
        ? pageModel.originalPageIndex
        : pageModel.pageIndex;

    const canCopy =
      baseDoc !== null &&
      !pageModel.isBlankInserted &&
      sourceIdx >= 0 &&
      sourceIdx < basePageCount;

    if (canCopy) {
      try {
        const copiedPages = await outDoc.copyPages(baseDoc!, [sourceIdx]);
        const copied = copiedPages && copiedPages[0];
        if (copied) {
          pageObj = outDoc.addPage(copied);
        } else {
          pageObj = outDoc.addPage([pageModel.width || 595.28, pageModel.height || 841.89]);
        }
      } catch (copyErr) {
        console.warn(`Failed to copy page at index ${sourceIdx}:`, copyErr);
        pageObj = outDoc.addPage([pageModel.width || 595.28, pageModel.height || 841.89]);
      }
    } else {
      pageObj = outDoc.addPage([pageModel.width || 595.28, pageModel.height || 841.89]);
    }

    // Apply rotation
    if (pageModel.rotation) {
      const currentRot = pageObj.getRotation().angle || 0;
      pageObj.setRotation(degrees((currentRot + pageModel.rotation) % 360));
    }

    const { width: pW, height: pH } = pageObj.getSize();

    // 1. Draw Page Annotations associated with this page
    // Note: annotations reference pageModel.pageIndex or the new sequential index
    const pageAnnotations = annotations.filter(
      (a) => a.pageIndex === pageModel.pageIndex || a.pageIndex === newIdx
    );

    for (const ann of pageAnnotations) {
      // Coordinate translation: In PDF, (0,0) is bottom-left, while in web canvas it is top-left
      const pdfY = pH - ann.y - ann.height;

      if (ann.type === 'whiteout') {
        // Redaction or Whiteout box
        const fillColor = hexToPdfRgb(ann.fillColor, rgb(1, 1, 1));
        pageObj.drawRectangle({
          x: ann.x,
          y: pdfY,
          width: ann.width,
          height: ann.height,
          color: fillColor,
          borderColor: ann.strokeColor ? hexToPdfRgb(ann.strokeColor) : undefined,
          borderWidth: ann.strokeWidth || 0,
        });
      } else if (ann.type === 'text') {
        // Background color if any
        if (ann.backgroundColor && ann.backgroundColor !== 'transparent') {
          pageObj.drawRectangle({
            x: ann.x,
            y: pdfY,
            width: ann.width,
            height: ann.height,
            color: hexToPdfRgb(ann.backgroundColor),
          });
        }

        let font = fontHelvetica;
        if (ann.bold) font = fontHelveticaBold;
        else if (ann.fontFamily === 'Times-Roman') font = fontTimes;
        else if (ann.fontFamily === 'Courier') font = fontCourier;

        const textColor = hexToPdfRgb(ann.color, rgb(0, 0, 0));
        // Split multiline text
        const lines = (ann.text || '').split('\n');
        const lineHeight = ann.fontSize * 1.25;

        lines.forEach((line, lineIdx) => {
          const lineY = pdfY + ann.height - (lineIdx + 1) * lineHeight + 4;
          pageObj.drawText(line, {
            x: ann.x + 4,
            y: lineY,
            size: ann.fontSize || 12,
            font,
            color: textColor,
          });
        });
      } else if (ann.type === 'shape') {
        const strokeColor = hexToPdfRgb(ann.strokeColor, rgb(0, 0, 0));
        const hasFill = ann.fillColor && ann.fillColor !== 'transparent';
        const fillColor = hasFill ? hexToPdfRgb(ann.fillColor) : undefined;

        if (ann.shapeType === 'rectangle') {
          pageObj.drawRectangle({
            x: ann.x,
            y: pdfY,
            width: ann.width,
            height: ann.height,
            borderColor: strokeColor,
            borderWidth: ann.strokeWidth || 2,
            color: fillColor,
            opacity: ann.opacity ?? 1,
          });
        } else if (ann.shapeType === 'highlight') {
          // Semi-transparent highlighter rectangle
          pageObj.drawRectangle({
            x: ann.x,
            y: pdfY,
            width: ann.width,
            height: ann.height,
            color: hexToPdfRgb(ann.fillColor || '#fef08a', rgb(1, 0.95, 0.4)),
            opacity: 0.35,
          });
        } else if (ann.shapeType === 'ellipse') {
          pageObj.drawEllipse({
            x: ann.x + ann.width / 2,
            y: pdfY + ann.height / 2,
            xScale: ann.width / 2,
            yScale: ann.height / 2,
            borderColor: strokeColor,
            borderWidth: ann.strokeWidth || 2,
            color: fillColor,
            opacity: ann.opacity ?? 1,
          });
        } else if (ann.shapeType === 'line' || ann.shapeType === 'arrow') {
          pageObj.drawLine({
            start: { x: ann.x, y: pdfY + ann.height },
            end: { x: ann.x + ann.width, y: pdfY },
            thickness: ann.strokeWidth || 2,
            color: strokeColor,
            opacity: ann.opacity ?? 1,
          });
        }
      } else if (ann.type === 'image' || ann.type === 'signature') {
        try {
          let embeddedImage: any;
          if (ann.dataUrl.startsWith('data:image/png')) {
            embeddedImage = await outDoc.embedPng(ann.dataUrl);
          } else if (
            ann.dataUrl.startsWith('data:image/jpeg') ||
            ann.dataUrl.startsWith('data:image/jpg')
          ) {
            embeddedImage = await outDoc.embedJpg(ann.dataUrl);
          } else {
            // For SVG, WebP, or non-standard base64, render to canvas first
            const img = new Image();
            img.crossOrigin = 'anonymous';
            await new Promise((resolve, reject) => {
              img.onload = () => resolve(true);
              img.onerror = () => resolve(false);
              img.src = ann.dataUrl;
            });
            const c = document.createElement('canvas');
            c.width = img.naturalWidth || 300;
            c.height = img.naturalHeight || 150;
            const cx = c.getContext('2d');
            if (cx) {
              cx.drawImage(img, 0, 0);
              const pngData = c.toDataURL('image/png');
              embeddedImage = await outDoc.embedPng(pngData);
            }
          }

          if (embeddedImage) {
            pageObj.drawImage(embeddedImage, {
              x: ann.x,
              y: pdfY,
              width: ann.width,
              height: ann.height,
              opacity: ann.opacity ?? 1,
            });
          }
        } catch (imgErr) {
          console.warn('Failed to embed image annotation:', imgErr);
        }
      }
    }

    // 2. Draw Header & Footer if enabled
    if (headerFooter.enabled && newIdx + 1 >= (headerFooter.startPage || 1)) {
      const hfColor = hexToPdfRgb(headerFooter.color || '#475569', rgb(0.3, 0.35, 0.4));
      const hfSize = headerFooter.fontSize || 9;

      // Header
      if (headerFooter.headerLeft) {
        pageObj.drawText(headerFooter.headerLeft, { x: 40, y: pH - 30, size: hfSize, font: fontHelvetica, color: hfColor });
      }
      if (headerFooter.headerRight) {
        pageObj.drawText(headerFooter.headerRight, { x: pW - 180, y: pH - 30, size: hfSize, font: fontHelvetica, color: hfColor });
      }

      // Footer
      let footerText = headerFooter.footerCenter || `Page ${newIdx + 1} of ${totalActive}`;
      footerText = footerText
        .replace('{page}', String(newIdx + 1))
        .replace('{total}', String(totalActive));

      pageObj.drawText(footerText, {
        x: pW / 2 - 40,
        y: 25,
        size: hfSize,
        font: fontHelvetica,
        color: hfColor,
      });
    }

    // 3. Draw Watermark if enabled
    if (watermark.enabled) {
      const wmColor = hexToPdfRgb(watermark.color || '#94a3b8', rgb(0.6, 0.65, 0.7));
      const wmText = watermark.text || 'CONFIDENTIAL';
      const wmSize = watermark.fontSize || 42;
      const wmOpacity = watermark.opacity || 0.15;
      const wmAngle = watermark.rotationAngle || -45;

      pageObj.drawText(wmText, {
        x: pW / 4,
        y: pH / 2,
        size: wmSize,
        font: fontHelveticaBold,
        color: wmColor,
        opacity: wmOpacity,
        rotate: degrees(wmAngle),
      });
    }
  }

  // Set Document Metadata
  if (metadata.title) outDoc.setTitle(metadata.title);
  if (metadata.author) outDoc.setAuthor(metadata.author);
  if (metadata.subject) outDoc.setSubject(metadata.subject);
  if (metadata.keywords) outDoc.setKeywords(metadata.keywords.split(',').map((s) => s.trim()));
  outDoc.setProducer('Gulf Way Group Sejda-Grade PDF Editor');

  const finalPdfBytes = await outDoc.save();
  return new Blob([finalPdfBytes], { type: 'application/pdf' });
}
