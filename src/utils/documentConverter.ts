import * as pdfjsLib from 'pdfjs-dist';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } from 'docx';
import mammoth from 'mammoth';
import JSZip from 'jszip';

// Configure PDF.js worker safely
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

export type ConversionPair = 'pdf-jpg' | 'pdf-excel' | 'pdf-docx';
export type ConversionDirection = 'forward' | 'reverse';

export interface ConversionTypeOption {
  id: string;
  pair: ConversionPair;
  direction: ConversionDirection;
  fromFormat: string;
  toFormat: string;
  title: string;
  shortLabel: string;
  description: string;
  acceptedExtensions: string[];
  mimeAccept: string;
  badge: string;
}

export const CONVERSION_OPTIONS: ConversionTypeOption[] = [
  {
    id: 'pdf-to-jpg',
    pair: 'pdf-jpg',
    direction: 'forward',
    fromFormat: 'PDF',
    toFormat: 'JPG',
    title: 'PDF to JPG Extractor',
    shortLabel: 'PDF → JPG',
    description: 'Extract every PDF page into high-resolution JPG images with instant preview and ZIP download.',
    acceptedExtensions: ['.pdf'],
    mimeAccept: 'application/pdf',
    badge: 'Extract & Split',
  },
  {
    id: 'jpg-to-pdf',
    pair: 'pdf-jpg',
    direction: 'reverse',
    fromFormat: 'JPG/PNG',
    toFormat: 'PDF',
    title: 'JPG to PDF Converter',
    shortLabel: 'JPG → PDF',
    description: 'Merge multiple JPG, PNG, or WebP images into a single professional multi-page PDF document.',
    acceptedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    mimeAccept: 'image/jpeg,image/png,image/webp',
    badge: 'Merge & Create',
  },
  {
    id: 'pdf-to-excel',
    pair: 'pdf-excel',
    direction: 'forward',
    fromFormat: 'PDF',
    toFormat: 'Excel (.xlsx)',
    title: 'PDF to Excel Converter',
    shortLabel: 'PDF → Excel',
    description: 'Extract tabular columns, financial grids, and text structures from PDF into a formatted Excel spreadsheet.',
    acceptedExtensions: ['.pdf'],
    mimeAccept: 'application/pdf',
    badge: 'Table Extraction',
  },
  {
    id: 'excel-to-pdf',
    pair: 'pdf-excel',
    direction: 'reverse',
    fromFormat: 'Excel (.xlsx/.csv)',
    toFormat: 'PDF',
    title: 'Excel to PDF Converter',
    shortLabel: 'Excel → PDF',
    description: 'Convert Excel spreadsheets, workbooks, and CSV tables into print-ready styled PDF reports.',
    acceptedExtensions: ['.xlsx', '.xls', '.csv'],
    mimeAccept: '.xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv',
    badge: 'Table Report',
  },
  {
    id: 'pdf-to-docx',
    pair: 'pdf-docx',
    direction: 'forward',
    fromFormat: 'PDF',
    toFormat: 'Word (.docx)',
    title: 'PDF to Word Converter',
    shortLabel: 'PDF → DOCX',
    description: 'Convert PDF documents into editable Microsoft Word (.docx) documents preserving paragraphs and headings.',
    acceptedExtensions: ['.pdf'],
    mimeAccept: 'application/pdf',
    badge: 'Document Parsing',
  },
  {
    id: 'docx-to-pdf',
    pair: 'pdf-docx',
    direction: 'reverse',
    fromFormat: 'Word (.docx)',
    toFormat: 'PDF',
    title: 'Word to PDF Converter',
    shortLabel: 'DOCX → PDF',
    description: 'Convert Microsoft Word (.docx) files into clean, shareable PDF documents with formatted typography.',
    acceptedExtensions: ['.docx'],
    mimeAccept: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    badge: 'Doc Layout',
  },
];

export interface ExtractedImagePage {
  pageNumber: number;
  dataUrl: string;
  blob: Blob;
  filename: string;
  width: number;
  height: number;
  size: number;
}

export interface ConversionResult {
  success: boolean;
  message: string;
  filename: string;
  blob?: Blob;
  downloadUrl?: string;
  pages?: ExtractedImagePage[];
  extractedTextPreview?: string;
  tableDataPreview?: any[][];
  summary?: {
    pageCount?: number;
    rowCount?: number;
    sheetCount?: number;
    fileSize?: number;
  };
}

/**
 * 1. Convert PDF to High-Res JPG Images (Page by Page)
 */
export async function convertPdfToJpg(
  file: File,
  scale: number = 2.0,
  onProgress?: (current: number, total: number) => void
): Promise<ExtractedImagePage[]> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const pages: ExtractedImagePage[] = [];

  const baseName = file.name.replace(/\.[^/.]+$/, '');

  for (let i = 1; i <= numPages; i++) {
    onProgress?.(i, numPages);
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Fill white background (PDF pages can be transparent)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport: viewport,
    }).promise;

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error(`Failed to convert page ${i} to JPG blob`));
        },
        'image/jpeg',
        0.92
      );
    });

    const pageFilename = `${baseName}-page-${String(i).padStart(2, '0')}.jpg`;

    pages.push({
      pageNumber: i,
      dataUrl,
      blob,
      filename: pageFilename,
      width: viewport.width,
      height: viewport.height,
      size: blob.size,
    });
  }

  return pages;
}

/**
 * 2. Convert JPG/PNG Images to PDF
 */
export async function convertJpgToPdf(
  files: File[],
  options: {
    orientation?: 'portrait' | 'landscape' | 'auto';
    fitToPage?: boolean;
    marginMm?: number;
    companyTitle?: string;
  } = {}
): Promise<ConversionResult> {
  if (files.length === 0) {
    throw new Error('No image files provided for conversion.');
  }

  const {
    orientation = 'auto',
    fitToPage = true,
    marginMm = 10,
    companyTitle = 'Gulf Way Group',
  } = options;

  let doc: jsPDF | null = null;
  const baseName = files.length === 1 
    ? files[0].name.replace(/\.[^/.]+$/, '') 
    : 'gulf-way-group-images';
  const outFilename = `${baseName}.pdf`;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const dataUrl = await readFileAsDataUrl(file);
    const imgDims = await getImageDimensions(dataUrl);

    const isLandscape = imgDims.width > imgDims.height;
    const pageOrientation = orientation === 'auto' 
      ? (isLandscape ? 'landscape' : 'portrait') 
      : orientation;

    if (!doc) {
      doc = new jsPDF({
        orientation: pageOrientation,
        unit: 'mm',
        format: 'a4',
      });
    } else {
      doc.addPage('a4', pageOrientation);
    }

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Calculate margins & available box
    const availW = pageWidth - marginMm * 2;
    const availH = pageHeight - marginMm * 2 - (companyTitle ? 8 : 0);

    let drawW = availW;
    let drawH = availH;
    let drawX = marginMm;
    let drawY = marginMm + (companyTitle ? 6 : 0);

    if (fitToPage) {
      const imgAspect = imgDims.width / imgDims.height;
      const boxAspect = availW / availH;

      if (imgAspect > boxAspect) {
        drawW = availW;
        drawH = availW / imgAspect;
        drawY = marginMm + (companyTitle ? 6 : 0) + (availH - drawH) / 2;
      } else {
        drawH = availH;
        drawW = availH * imgAspect;
        drawX = marginMm + (availW - drawW) / 2;
      }
    }

    // Optional subtle header
    if (companyTitle) {
      doc.setFontSize(8);
      doc.setTextColor(140, 150, 170);
      doc.text(companyTitle, marginMm, marginMm + 3);
      doc.text(`Page ${i + 1} of ${files.length}`, pageWidth - marginMm, marginMm + 3, { align: 'right' });
    }

    doc.addImage(dataUrl, 'JPEG', drawX, drawY, drawW, drawH, undefined, 'FAST');
  }

  if (!doc) {
    throw new Error('Failed to generate PDF document.');
  }

  const pdfBlob = doc.output('blob');
  const downloadUrl = URL.createObjectURL(pdfBlob);

  return {
    success: true,
    message: `Successfully converted ${files.length} image(s) to PDF.`,
    filename: outFilename,
    blob: pdfBlob,
    downloadUrl,
    summary: {
      pageCount: files.length,
      fileSize: pdfBlob.size,
    },
  };
}

/**
 * Helper: Read text items with geometry from a PDF
 */
interface PdfTextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

async function extractPdfTextItemsByPage(arrayBuffer: ArrayBuffer): Promise<{ pageNumber: number; items: PdfTextItem[] }[]> {
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const result: { pageNumber: number; items: PdfTextItem[] }[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const items: PdfTextItem[] = [];

    for (const item of textContent.items as any[]) {
      if (!item.str || item.str.trim() === '') continue;
      const tx = item.transform;
      items.push({
        str: item.str,
        x: tx[4],
        y: tx[5], // in PDF coordinates, 0 is bottom
        width: item.width || 0,
        height: item.height || 0,
      });
    }

    result.push({ pageNumber: i, items });
  }

  return result;
}

/**
 * 3. Convert PDF to Excel (.xlsx)
 * Groups text coordinates into rows and columns, or detects tabular records.
 */
export async function convertPdfToExcel(file: File): Promise<ConversionResult> {
  const arrayBuffer = await file.arrayBuffer();
  const pagesData = await extractPdfTextItemsByPage(arrayBuffer);

  const wb = XLSX.utils.book_new();
  let totalRows = 0;
  let sampleTableData: any[][] = [];

  pagesData.forEach(({ pageNumber, items }) => {
    if (items.length === 0) {
      const emptySheet = XLSX.utils.aoa_to_sheet([['(No text detected on this page)']]);
      XLSX.utils.book_append_sheet(wb, emptySheet, `Page ${pageNumber}`);
      return;
    }

    // Sort items top-to-bottom (PDF y is reversed: higher Y is higher on page)
    // Group items with close Y into the same row (tolerance ~6-8px)
    const yTolerance = 7;
    const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);

    const rows: { y: number; cells: PdfTextItem[] }[] = [];

    sorted.forEach((item) => {
      const existingRow = rows.find((r) => Math.abs(r.y - item.y) <= yTolerance);
      if (existingRow) {
        existingRow.cells.push(item);
      } else {
        rows.push({ y: item.y, cells: [item] });
      }
    });

    // Sort rows from top to bottom
    rows.sort((a, b) => b.y - a.y);

    // Within each row, sort cells left-to-right
    const pageGrid: string[][] = rows.map((row) => {
      row.cells.sort((a, b) => a.x - b.x);

      // Separate into columns by x distance
      const rowColumns: string[] = [];
      let currentCol = '';
      let lastX = -1;
      const colGapThreshold = 18; // px gap between columns

      row.cells.forEach((cell) => {
        if (lastX >= 0 && cell.x - lastX > colGapThreshold) {
          if (currentCol) rowColumns.push(currentCol.trim());
          currentCol = cell.str;
        } else {
          currentCol = currentCol ? `${currentCol} ${cell.str}` : cell.str;
        }
        lastX = cell.x + cell.width;
      });

      if (currentCol) {
        rowColumns.push(currentCol.trim());
      }

      return rowColumns;
    });

    totalRows += pageGrid.length;
    if (sampleTableData.length === 0 && pageGrid.length > 0) {
      sampleTableData = pageGrid.slice(0, 10);
    }

    const ws = XLSX.utils.aoa_to_sheet(pageGrid);

    // Auto calculate column widths
    const maxCols = Math.max(...pageGrid.map((r) => r.length), 1);
    ws['!cols'] = Array.from({ length: maxCols }, () => ({ wch: 18 }));

    XLSX.utils.book_append_sheet(wb, ws, `Page ${pageNumber}`);
  });

  const excelData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelData], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const outFilename = `${file.name.replace(/\.[^/.]+$/, '')}.xlsx`;
  const downloadUrl = URL.createObjectURL(blob);

  return {
    success: true,
    message: `Extracted ${totalRows} rows across ${pagesData.length} page(s) into Excel (.xlsx).`,
    filename: outFilename,
    blob,
    downloadUrl,
    tableDataPreview: sampleTableData,
    summary: {
      pageCount: pagesData.length,
      rowCount: totalRows,
      sheetCount: wb.SheetNames.length,
      fileSize: blob.size,
    },
  };
}

/**
 * 4. Convert Excel (.xlsx, .xls, .csv) to PDF
 */
export async function convertExcelToPdf(
  file: File,
  options: {
    companyTitle?: string;
  } = {}
): Promise<ConversionResult> {
  const { companyTitle = 'Gulf Way Group' } = options;
  const arrayBuffer = await file.arrayBuffer();
  const wb = XLSX.read(arrayBuffer, { type: 'array' });

  if (wb.SheetNames.length === 0) {
    throw new Error('The uploaded Excel file contains no readable worksheets.');
  }

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  let isFirstSheet = true;
  let totalRowsRendered = 0;
  let samplePreview: any[][] = [];

  for (let s = 0; s < wb.SheetNames.length; s++) {
    const sheetName = wb.SheetNames[s];
    const sheet = wb.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

    if (rawData.length === 0) continue;

    if (!isFirstSheet) {
      doc.addPage('a4', 'landscape');
    }
    isFirstSheet = false;

    // Header title and sheet name
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`${companyTitle} — ${sheetName}`, 14, 15);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on ${new Date().toLocaleDateString()} • Source: ${file.name}`, 14, 20);

    const headers = (rawData[0] || []).map((cell: any) => String(cell ?? ''));
    const bodyRows = rawData.slice(1).map((row: any[]) =>
      row.map((cell: any) => (cell !== undefined && cell !== null ? String(cell) : ''))
    );

    totalRowsRendered += rawData.length;
    if (samplePreview.length === 0) {
      samplePreview = rawData.slice(0, 8);
    }

    autoTable(doc, {
      startY: 24,
      head: [headers],
      body: bodyRows,
      theme: 'striped',
      headStyles: {
        fillColor: [79, 70, 229], // Indigo 600
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'left',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 14, right: 14, bottom: 14 },
      didDrawPage: (data) => {
        // Page footer
        const pageNum = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `${companyTitle} • Document Exporter • Sheet: ${sheetName}`,
          14,
          doc.internal.pageSize.getHeight() - 8
        );
        doc.text(
          `Page ${pageNum}`,
          doc.internal.pageSize.getWidth() - 14,
          doc.internal.pageSize.getHeight() - 8,
          { align: 'right' }
        );
      },
    });
  }

  const pdfBlob = doc.output('blob');
  const downloadUrl = URL.createObjectURL(pdfBlob);
  const outFilename = `${file.name.replace(/\.[^/.]+$/, '')}.pdf`;

  return {
    success: true,
    message: `Converted ${wb.SheetNames.length} sheet(s) and ${totalRowsRendered} row(s) to formatted PDF.`,
    filename: outFilename,
    blob: pdfBlob,
    downloadUrl,
    tableDataPreview: samplePreview,
    summary: {
      pageCount: doc.getNumberOfPages(),
      sheetCount: wb.SheetNames.length,
      rowCount: totalRowsRendered,
      fileSize: pdfBlob.size,
    },
  };
}

/**
 * 5. Convert PDF to Microsoft Word (.docx)
 */
export async function convertPdfToDocx(
  file: File,
  options: {
    companyTitle?: string;
  } = {}
): Promise<ConversionResult> {
  const { companyTitle = 'Gulf Way Group' } = options;
  const arrayBuffer = await file.arrayBuffer();
  const pagesData = await extractPdfTextItemsByPage(arrayBuffer);

  const docParagraphs: Paragraph[] = [];
  let fullTextPreview = '';

  // Document title header
  docParagraphs.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [
        new TextRun({
          text: `${companyTitle} — Document Export`,
          bold: true,
          size: 32,
          color: '4F46E5',
        }),
      ],
      spacing: { after: 200 },
    })
  );

  docParagraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Extracted from PDF: ${file.name} • Total Pages: ${pagesData.length}`,
          italics: true,
          size: 18,
          color: '64748B',
        }),
      ],
      spacing: { after: 400 },
    })
  );

  pagesData.forEach(({ pageNumber, items }) => {
    // Page separator heading
    docParagraphs.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [
          new TextRun({
            text: `Page ${pageNumber}`,
            bold: true,
            size: 24,
            color: '1E293B',
          }),
        ],
        spacing: { before: 300, after: 150 },
      })
    );

    if (items.length === 0) {
      docParagraphs.push(
        new Paragraph({
          children: [new TextRun({ text: '(No text found on this page)', italics: true })],
        })
      );
      return;
    }

    // Group items into lines based on Y
    const yTolerance = 6;
    const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
    const lines: { y: number; text: string }[] = [];

    sorted.forEach((item) => {
      const existing = lines.find((l) => Math.abs(l.y - item.y) <= yTolerance);
      if (existing) {
        existing.text += ` ${item.str}`;
      } else {
        lines.push({ y: item.y, text: item.str });
      }
    });

    lines.sort((a, b) => b.y - a.y);

    lines.forEach((line) => {
      const trimmed = line.text.trim();
      if (!trimmed) return;

      if (!fullTextPreview && trimmed.length > 20) {
        fullTextPreview = trimmed.slice(0, 300);
      }

      // Check if looks like heading (short, all caps or starts with number)
      const isShortHeading = trimmed.length < 50 && (trimmed === trimmed.toUpperCase() && trimmed.length > 4);

      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed,
              bold: isShortHeading,
              size: isShortHeading ? 22 : 20,
              color: isShortHeading ? '1E293B' : '334155',
            }),
          ],
          spacing: { after: 120 },
        })
      );
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docParagraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const downloadUrl = URL.createObjectURL(blob);
  const outFilename = `${file.name.replace(/\.[^/.]+$/, '')}.docx`;

  return {
    success: true,
    message: `Extracted ${pagesData.length} page(s) into editable Word (.docx) document.`,
    filename: outFilename,
    blob,
    downloadUrl,
    extractedTextPreview: fullTextPreview,
    summary: {
      pageCount: pagesData.length,
      fileSize: blob.size,
    },
  };
}

/**
 * 6. Convert Word (.docx) to PDF
 */
export async function convertDocxToPdf(
  file: File,
  options: {
    companyTitle?: string;
  } = {}
): Promise<ConversionResult> {
  const { companyTitle = 'Gulf Way Group' } = options;
  const arrayBuffer = await file.arrayBuffer();

  // Extract raw text and structure from Word doc
  const mammothResult = await mammoth.extractRawText({ arrayBuffer });
  const rawText = mammothResult.value;

  if (!rawText.trim()) {
    throw new Error('No readable text found in the uploaded Word document.');
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginMm = 16;
  const contentWidth = pageWidth - marginMm * 2;

  // Header
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(79, 70, 229); // Indigo 600
  doc.text(companyTitle, marginMm, marginMm);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Document: ${file.name}`, marginMm, marginMm + 5);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(marginMm, marginMm + 8, pageWidth - marginMm, marginMm + 8);

  let currentY = marginMm + 15;
  const lines = rawText.split('\n');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      currentY += 4; // Paragraph spacing
      continue;
    }

    const isHeading = line.length < 60 && (line === line.toUpperCase() && line.length > 5);

    if (isHeading) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      currentY += 3;
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
    }

    // Split text to fit page width
    const wrappedLines = doc.splitTextToSize(line, contentWidth);

    for (const wLine of wrappedLines) {
      if (currentY > pageHeight - marginMm - 10) {
        // Add footer to current page
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `${companyTitle} • Word to PDF Document`,
          marginMm,
          pageHeight - 8
        );
        doc.text(
          `Page ${doc.getNumberOfPages()}`,
          pageWidth - marginMm,
          pageHeight - 8,
          { align: 'right' }
        );

        // New page
        doc.addPage('a4', 'portrait');
        currentY = marginMm + 6;

        // Reset styling for continued lines
        if (isHeading) {
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 41, 59);
        } else {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(51, 65, 85);
        }
      }

      doc.text(wLine, marginMm, currentY);
      currentY += isHeading ? 6 : 5;
    }

    if (isHeading) {
      currentY += 2;
    }
  }

  // Draw footer on the final page
  const totalPages = doc.getNumberOfPages();
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `${companyTitle} • Word to PDF Document`,
    marginMm,
    pageHeight - 8
  );
  doc.text(
    `Page ${totalPages}`,
    pageWidth - marginMm,
    pageHeight - 8,
    { align: 'right' }
  );

  const pdfBlob = doc.output('blob');
  const downloadUrl = URL.createObjectURL(pdfBlob);
  const outFilename = `${file.name.replace(/\.[^/.]+$/, '')}.pdf`;

  return {
    success: true,
    message: `Converted Word document into a ${totalPages}-page PDF.`,
    filename: outFilename,
    blob: pdfBlob,
    downloadUrl,
    extractedTextPreview: rawText.slice(0, 300),
    summary: {
      pageCount: totalPages,
      fileSize: pdfBlob.size,
    },
  };
}

/**
 * 7. Utility: Generate a ZIP file from multiple extracted images
 */
export async function createZipFromImages(
  pages: ExtractedImagePage[],
  zipFilename: string = 'gulf-way-extracted-pages.zip'
): Promise<{ blob: Blob; downloadUrl: string }> {
  const zip = new JSZip();

  pages.forEach((page) => {
    zip.file(page.filename, page.blob);
  });

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const downloadUrl = URL.createObjectURL(zipBlob);
  return { blob: zipBlob, downloadUrl };
}

// Helpers
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = (e) => reject(e);
    img.src = dataUrl;
  });
}
