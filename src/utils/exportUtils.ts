import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { BatchConfig, BatchSet } from '../types';

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export async function exportBatchAsPdf(
  batch: BatchSet,
  config: BatchConfig,
  filename?: string
): Promise<void> {
  if (!batch.renderedJpgUrl) return;

  const pdf = new jsPDF({
    orientation: config.orientation,
    unit: 'mm',
    format: 'a4',
  });

  const pageW = config.orientation === 'portrait' ? 210 : 297;
  const pageH = config.orientation === 'portrait' ? 297 : 210;

  pdf.addImage(batch.renderedJpgUrl, 'JPEG', 0, 0, pageW, pageH, undefined, 'FAST');
  const name = filename || `batch-sheet-${batch.batchIndex + 1}.pdf`;
  pdf.save(name);
}

export async function exportAllBatchesAsPdf(
  batches: BatchSet[],
  config: BatchConfig,
  filename = 'a4-batch-sheets.pdf'
): Promise<void> {
  if (batches.length === 0) return;

  const pdf = new jsPDF({
    orientation: config.orientation,
    unit: 'mm',
    format: 'a4',
  });

  const pageW = config.orientation === 'portrait' ? 210 : 297;
  const pageH = config.orientation === 'portrait' ? 297 : 210;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    if (!batch.renderedJpgUrl) continue;

    if (i > 0) {
      pdf.addPage('a4', config.orientation);
    }
    pdf.addImage(batch.renderedJpgUrl, 'JPEG', 0, 0, pageW, pageH, undefined, 'FAST');
  }

  pdf.save(filename);
}

export async function exportAllBatchesAsZip(
  batches: BatchSet[],
  config: BatchConfig,
  includePdf = false
): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder('a4-optimized-batches');

  batches.forEach((b, idx) => {
    if (b.renderedBlob) {
      folder?.file(`batch-${idx + 1}-page.jpg`, b.renderedBlob);
    }
  });

  if (includePdf) {
    const pdf = new jsPDF({
      orientation: config.orientation,
      unit: 'mm',
      format: 'a4',
    });

    const pageW = config.orientation === 'portrait' ? 210 : 297;
    const pageH = config.orientation === 'portrait' ? 297 : 210;

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      if (!batch.renderedJpgUrl) continue;
      if (i > 0) pdf.addPage('a4', config.orientation);
      pdf.addImage(batch.renderedJpgUrl, 'JPEG', 0, 0, pageW, pageH, undefined, 'FAST');
    }

    const pdfBlob = pdf.output('blob');
    folder?.file('all-batches-multipage.pdf', pdfBlob);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(zipBlob, `a4-batch-images-${Date.now()}.zip`);
}
