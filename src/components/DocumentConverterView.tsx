import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  FileCode, 
  ArrowRightLeft, 
  ArrowRight, 
  UploadCloud, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  FileArchive, 
  ExternalLink, 
  Trash2, 
  Sliders, 
  Plus, 
  Sparkles,
  Eye,
  FileCheck
} from 'lucide-react';
import { 
  CONVERSION_OPTIONS, 
  ConversionPair, 
  ConversionDirection, 
  ConversionTypeOption, 
  ExtractedImagePage, 
  ConversionResult,
  convertPdfToJpg,
  convertJpgToPdf,
  convertPdfToExcel,
  convertExcelToPdf,
  convertPdfToDocx,
  convertDocxToPdf,
  createZipFromImages
} from '../utils/documentConverter';
import { formatBytes } from '../utils/imageOptimizer';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import { GulfWayLogo } from './GulfWayLogo';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { useLanguage } from '../i18n/LanguageContext';

interface DocumentConverterViewProps {
  onSendImagesToBatchQueue?: (files: File[]) => void;
  onSwitchToBatcher?: () => void;
}

export const DocumentConverterView: React.FC<DocumentConverterViewProps> = ({
  onSendImagesToBatchQueue,
  onSwitchToBatcher,
}) => {
  const { t, isRtl } = useLanguage();
  // Selected conversion state
  const [selectedPair, setSelectedPair] = useState<ConversionPair>('pdf-jpg');
  const [direction, setDirection] = useState<ConversionDirection>('forward');

  // Input files
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Conversion options
  const [pdfJpgScale, setPdfJpgScale] = useState<number>(2.0); // 1.5, 2.0, 3.0
  const [jpgPdfOrientation, setJpgPdfOrientation] = useState<'auto' | 'portrait' | 'landscape'>('auto');
  const [jpgPdfMargin, setJpgPdfMargin] = useState<number>(10);

  // Processing & Results
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [progressPercent, setProgressPercent] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<ConversionResult | null>(null);

  // For PDF to JPG extracted images
  const [extractedPages, setExtractedPages] = useState<ExtractedImagePage[]>([]);
  const [previewPageIndex, setPreviewPageIndex] = useState<number | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [zipDownloadUrl, setZipDownloadUrl] = useState<string | null>(null);

  // Current active configuration item
  const currentOption: ConversionTypeOption = CONVERSION_OPTIONS.find(
    (opt) => opt.pair === selectedPair && opt.direction === direction
  ) || CONVERSION_OPTIONS[0];

  // Toggle conversion direction (Vice-Versa)
  const handleToggleDirection = () => {
    setDirection((prev) => (prev === 'forward' ? 'reverse' : 'forward'));
    setSelectedFiles([]);
    setResult(null);
    setExtractedPages([]);
    setErrorMsg(null);
  };

  // Switch conversion pair
  const handleSelectPair = (pair: ConversionPair) => {
    setSelectedPair(pair);
    setSelectedFiles([]);
    setResult(null);
    setExtractedPages([]);
    setErrorMsg(null);
  };

  // Handle file input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const addFiles = (files: File[]) => {
    setErrorMsg(null);
    setResult(null);
    setExtractedPages([]);

    // Check format compatibility
    const acceptedExts = currentOption.acceptedExtensions;
    const valid = files.filter((f) => {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase();
      return acceptedExts.includes(ext) || currentOption.mimeAccept.includes(f.type);
    });

    if (valid.length === 0) {
      setErrorMsg(`Please upload a valid ${currentOption.fromFormat} file (${acceptedExts.join(', ')}).`);
      return;
    }

    // Support multiple files across all conversion types
    setSelectedFiles((prev) => [...prev, ...valid]);
  };

  // Drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  // Remove file from multi-selection (JPG to PDF)
  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Generate Sample File for Testing
  const handleLoadSample = async () => {
    setErrorMsg(null);
    setResult(null);
    setExtractedPages([]);

    try {
      if (currentOption.fromFormat.includes('PDF')) {
        // Create sample PDF using jsPDF
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        doc.setFontSize(20);
        doc.setTextColor(79, 70, 229);
        doc.text('Gulf Way Group — Sample Document', 20, 25);
        doc.setFontSize(11);
        doc.setTextColor(51, 65, 85);
        doc.text('This is an official demo document for testing bidirectional file conversion.', 20, 35);
        doc.text('Page 1: Overview & Performance Records', 20, 42);

        // Simple table content
        doc.setFontSize(10);
        doc.text('ID', 20, 55);
        doc.text('Asset Item', 50, 55);
        doc.text('Category', 110, 55);
        doc.text('Status', 160, 55);
        doc.line(20, 58, 190, 58);

        const sampleRows = [
          ['001', 'Commercial Fleet Spec', 'Logistics', 'Verified'],
          ['002', 'Warehouse Terminal A', 'Facility', 'Active'],
          ['003', 'Cargo Waybill 4492', 'Freight', 'Cleared'],
          ['004', 'Corporate Asset Audit', 'Finance', 'Completed'],
        ];

        sampleRows.forEach((r, idx) => {
          const y = 66 + idx * 8;
          doc.text(r[0], 20, y);
          doc.text(r[1], 50, y);
          doc.text(r[2], 110, y);
          doc.text(r[3], 160, y);
        });

        // Add page 2
        doc.addPage('a4', 'portrait');
        doc.setFontSize(18);
        doc.setTextColor(79, 70, 229);
        doc.text('Gulf Way Group — Page 2 Specifications', 20, 25);
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        doc.text('Detailed technical appendix and high-resolution layout preview.', 20, 35);
        doc.text('Extracted automatically into JPG, Excel, or editable DOCX formats.', 20, 42);

        const blob = doc.output('blob');
        const file = new File([blob], 'gulf-way-sample-document.pdf', { type: 'application/pdf' });
        setSelectedFiles([file]);
      } else if (currentOption.fromFormat.includes('Excel')) {
        // Create sample Excel workbook
        const wb = XLSX.utils.book_new();
        const wsData = [
          ['Asset Code', 'Equipment Name', 'Location', 'Value (USD)', 'Status'],
          ['GW-101', 'Heavy Duty Transport Truck', 'Dubai Hub', 145000, 'Operational'],
          ['GW-102', 'Forklift Electric 3T', 'Abu Dhabi Depot', 32000, 'Operational'],
          ['GW-103', 'Refrigerated Cargo Container', 'Sharjah Port', 28500, 'In Transit'],
          ['GW-104', 'Inspection Crane Unit', 'Fujairah Terminal', 210000, 'Maintenance'],
          ['GW-105', 'Fleet Dispatch Van', 'Doha Office', 42000, 'Operational'],
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'Asset Inventory');

        const excelArray = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelArray], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const file = new File([blob], 'gulf-way-sample-inventory.xlsx', {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        setSelectedFiles([file]);
      } else if (currentOption.fromFormat.includes('Word')) {
        // Create sample Word document
        const doc = new Document({
          sections: [
            {
              children: [
                new Paragraph({
                  heading: HeadingLevel.TITLE,
                  children: [new TextRun({ text: 'Gulf Way Group — Corporate Brief', bold: true, size: 28, color: '4F46E5' })],
                }),
                new Paragraph({
                  children: [new TextRun({ text: 'Commercial operations memorandum and asset management profile.', size: 20 })],
                  spacing: { after: 200 },
                }),
                new Paragraph({
                  heading: HeadingLevel.HEADING_2,
                  children: [new TextRun({ text: '1. Executive Summary', bold: true, size: 24 })],
                  spacing: { before: 200, after: 100 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'Gulf Way Group maintains enterprise logistics, heavy fleet deployment, and infrastructure asset operations across the region.',
                      size: 20,
                    }),
                  ],
                }),
              ],
            },
          ],
        });
        const blob = await Packer.toBlob(doc);
        const file = new File([blob], 'gulf-way-sample-brief.docx', {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });
        setSelectedFiles([file]);
      } else {
        // JPG samples - render a canvas sample image
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 900;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const grad = ctx.createLinearGradient(0, 0, 1200, 900);
          grad.addColorStop(0, '#4338CA');
          grad.addColorStop(1, '#065F46');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 1200, 900);

          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 48px system-ui, sans-serif';
          ctx.fillText('Gulf Way Group', 80, 120);

          ctx.font = '24px system-ui, sans-serif';
          ctx.fillStyle = '#E2E8F0';
          ctx.fillText('Sample High-Res Image 01 — Asset Specification', 80, 180);

          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(80, 230, 1040, 560);

          ctx.fillStyle = '#1E293B';
          ctx.font = 'bold 32px system-ui, sans-serif';
          ctx.fillText('ISO-Compliant Document Imaging', 120, 320);
          ctx.font = '20px system-ui, sans-serif';
          ctx.fillStyle = '#64748B';
          ctx.fillText('Ready for conversion into clean multi-page PDF documents.', 120, 380);
        }

        const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/jpeg', 0.9));
        const file = new File([blob], 'gulf-way-sample-image-1.jpg', { type: 'image/jpeg' });
        setSelectedFiles([file]);
      }
    } catch (err: any) {
      setErrorMsg(`Failed to generate sample: ${err?.message || err}`);
    }
  };

  // Run Conversion
  const handleConvert = async () => {
    if (selectedFiles.length === 0) {
      setErrorMsg('Please select at least one file to convert.');
      return;
    }

    setIsProcessing(true);
    setProgressPercent(null);
    setProgressText('Initializing converter engine...');
    setErrorMsg(null);
    setResult(null);
    setExtractedPages([]);
    setZipDownloadUrl(null);

    try {
      if (selectedFiles.length > 1 && currentOption.id !== 'jpg-to-pdf') {
        // Bulk Multi-File Conversion
        setProgressText(`Converting ${selectedFiles.length} files in bulk...`);
        const zip = new JSZip();
        let processedCount = 0;

        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          setProgressText(`Processing file ${i + 1} of ${selectedFiles.length}: ${file.name}...`);
          setProgressPercent(Math.round(((i + 1) / selectedFiles.length) * 100));

          try {
            if (currentOption.id === 'pdf-to-jpg') {
              const pages = await convertPdfToJpg(file, pdfJpgScale);
              const folder = zip.folder(file.name.replace(/\.[^/.]+$/, ''));
              for (const p of pages) {
                folder?.file(p.filename, p.blob);
              }
            } else if (currentOption.id === 'pdf-to-excel') {
              const res = await convertPdfToExcel(file);
              zip.file(res.filename, res.blob);
            } else if (currentOption.id === 'excel-to-pdf') {
              const res = await convertExcelToPdf(file, { companyTitle: 'Gulf Way Group' });
              zip.file(res.filename, res.blob);
            } else if (currentOption.id === 'pdf-to-docx') {
              const res = await convertPdfToDocx(file, { companyTitle: 'Gulf Way Group' });
              zip.file(res.filename, res.blob);
            } else if (currentOption.id === 'docx-to-pdf') {
              const res = await convertDocxToPdf(file, { companyTitle: 'Gulf Way Group' });
              zip.file(res.filename, res.blob);
            }
            processedCount++;
          } catch (itemErr) {
            console.error(`Error converting ${file.name}:`, itemErr);
          }
        }

        setProgressText('Packaging bulk conversion ZIP archive...');
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const zipUrl = URL.createObjectURL(zipBlob);
        const zipName = `gulf-way-bulk-${currentOption.id}-${Date.now()}.zip`;

        setZipDownloadUrl(zipUrl);
        setResult({
          success: true,
          message: `Successfully converted ${processedCount} of ${selectedFiles.length} file(s) in bulk.`,
          filename: zipName,
          blob: zipBlob,
          downloadUrl: zipUrl,
          summary: {
            pageCount: processedCount,
            fileSize: zipBlob.size,
          },
        });
      } else if (currentOption.id === 'pdf-to-jpg') {
        setProgressText('Extracting pages from PDF...');
        const pages = await convertPdfToJpg(selectedFiles[0], pdfJpgScale, (cur, tot) => {
          setProgressText(`Rendering page ${cur} of ${tot}...`);
          setProgressPercent(Math.round((cur / tot) * 100));
        });

        setExtractedPages(pages);

        // Pre-generate ZIP
        setProgressText('Packaging ZIP archive...');
        const zipRes = await createZipFromImages(pages, `${selectedFiles[0].name.replace(/\.[^/.]+$/, '')}-pages.zip`);
        setZipDownloadUrl(zipRes.downloadUrl);

        setResult({
          success: true,
          message: `Successfully extracted ${pages.length} page(s) into high-resolution JPG images.`,
          filename: `${selectedFiles[0].name.replace(/\.[^/.]+$/, '')}-pages.zip`,
          blob: zipRes.blob,
          downloadUrl: zipRes.downloadUrl,
          pages,
          summary: {
            pageCount: pages.length,
            fileSize: zipRes.blob.size,
          },
        });
      } else if (currentOption.id === 'jpg-to-pdf') {
        setProgressText('Composing multi-page PDF...');
        const res = await convertJpgToPdf(selectedFiles, {
          orientation: jpgPdfOrientation,
          marginMm: jpgPdfMargin,
          companyTitle: 'Gulf Way Group',
        });
        setResult(res);
      } else if (currentOption.id === 'pdf-to-excel') {
        setProgressText('Extracting tables & text structures...');
        const res = await convertPdfToExcel(selectedFiles[0]);
        setResult(res);
      } else if (currentOption.id === 'excel-to-pdf') {
        setProgressText('Styling workbook and generating PDF tables...');
        const res = await convertExcelToPdf(selectedFiles[0], {
          companyTitle: 'Gulf Way Group',
        });
        setResult(res);
      } else if (currentOption.id === 'pdf-to-docx') {
        setProgressText('Parsing headings & layout into Word document...');
        const res = await convertPdfToDocx(selectedFiles[0], {
          companyTitle: 'Gulf Way Group',
        });
        setResult(res);
      } else if (currentOption.id === 'docx-to-pdf') {
        setProgressText('Parsing Word typography and building PDF...');
        const res = await convertDocxToPdf(selectedFiles[0], {
          companyTitle: 'Gulf Way Group',
        });
        setResult(res);
      }
    } catch (err: any) {
      console.error('Conversion failed:', err);
      setErrorMsg(err?.message || 'An error occurred during file conversion.');
    } finally {
      setIsProcessing(false);
      setProgressText('');
      setProgressPercent(null);
    }
  };

  // Forward extracted JPG pages to the A4 Batch Optimizer queue
  const handleSendToBatcher = () => {
    if (extractedPages.length === 0 || !onSendImagesToBatchQueue) return;

    const files: File[] = extractedPages.map(
      (p) => new File([p.blob], p.filename, { type: 'image/jpeg' })
    );

    onSendImagesToBatchQueue(files);
    if (onSwitchToBatcher) {
      onSwitchToBatcher();
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner: Gulf Way Group Format Converter */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-slate-50 border border-slate-200/80 rounded-2xl shadow-xs flex items-center justify-center shrink-0">
            <GulfWayLogo className="w-10 h-10" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                Gulf Way Group
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Bidirectional Engine
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Document &amp; Format Converter
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
              Convert documents seamlessly: PDF to JPG Extractor, PDF to Excel, PDF to Word (DOCX), JPG to PDF, and vice versa.
            </p>
          </div>
        </div>

        {/* Quick actions & cross-tab link */}
        {onSwitchToBatcher && (
          <button
            type="button"
            onClick={onSwitchToBatcher}
            className="self-start md:self-center px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors flex items-center gap-2"
          >
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Go to A4 Batch Optimizer</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}
      </div>

      {/* Conversion Pair Selector Tabs & Vice-Versa Swap Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          {/* Pair Category Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              id="pair-pdf-jpg-btn"
              onClick={() => handleSelectPair('pdf-jpg')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                selectedPair === 'pdf-jpg'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>PDF ⇄ JPG</span>
            </button>

            <button
              type="button"
              id="pair-pdf-excel-btn"
              onClick={() => handleSelectPair('pdf-excel')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                selectedPair === 'pdf-excel'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>PDF ⇄ Excel</span>
            </button>

            <button
              type="button"
              id="pair-pdf-docx-btn"
              onClick={() => handleSelectPair('pdf-docx')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                selectedPair === 'pdf-docx'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF ⇄ Word (.docx)</span>
            </button>
          </div>

          {/* Vice-Versa Swap Direction Button */}
          <button
            type="button"
            id="toggle-direction-btn"
            onClick={handleToggleDirection}
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl border border-amber-300/80 transition-all flex items-center gap-2 shadow-2xs self-start sm:self-auto"
            title="Swap conversion direction (Vice-Versa)"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600" />
            <span>Swap Direction (Vice Versa)</span>
          </button>
        </div>

        {/* Current Active Mode Spotlight */}
        <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-mono text-sm font-bold">
              <span className="px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-indigo-700 shadow-2xs">
                {currentOption.fromFormat}
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <span className="px-2.5 py-1 bg-indigo-600 rounded-lg text-white shadow-2xs">
                {currentOption.toFormat}
              </span>
            </div>
            <div className="hidden md:block h-6 w-px bg-slate-200"></div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">{currentOption.title}</h2>
              <p className="text-[11px] text-slate-500">{currentOption.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-mono font-bold rounded border border-emerald-200">
              {currentOption.badge}
            </span>
            <button
              type="button"
              id="load-sample-file-btn"
              onClick={handleLoadSample}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-2xs transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Load Sample</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Dropzone & Settings vs. Execution & Result */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Upload & Fine-Tuning (col-span-7) */}
        <div className="lg:col-span-7 space-y-5">
          {/* File Upload Zone */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              id="converter-file-input"
              multiple={true}
              accept={currentOption.mimeAccept}
              className="hidden"
              onChange={handleFileChange}
            />

            <div
              id="converter-drop-zone"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-indigo-600 bg-indigo-50/70'
                  : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50/80'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-3 shadow-2xs">
                <UploadCloud className="w-6 h-6" />
              </div>

              <h3 className="text-sm font-bold text-slate-800 tracking-tight">
                Drop {currentOption.fromFormat} files here or click to browse
              </h3>

              <p className="text-xs text-slate-500 mt-1">
                Accepted: <span className="font-mono text-indigo-600">{currentOption.acceptedExtensions.join(', ')}</span>
                {' · Bulk multi-upload supported'}
              </p>

              <button
                type="button"
                id="converter-browse-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-2xs transition-colors"
              >
                Browse {currentOption.fromFormat}
              </button>
            </div>

            {/* Selected File(s) List */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Selected Files ({selectedFiles.length})</span>
                  <button
                    type="button"
                    onClick={() => setSelectedFiles([])}
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-medium"
                  >
                    Clear All
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={`${file.name}-${idx}`}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-semibold text-slate-800 truncate">{file.name}</span>
                        <span className="font-mono text-[10px] text-slate-400 shrink-0">
                          ({formatBytes(file.size)})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="Remove file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Mode-Specific Fine Tuning Controls */}
          {currentOption.id === 'pdf-to-jpg' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                <span>PDF Extraction Resolution</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { scale: 1.5, label: 'Standard (1.5x)', desc: '~150 DPI Fast' },
                  { scale: 2.0, label: 'High-Res (2.0x)', desc: '~200 DPI Crisp' },
                  { scale: 3.0, label: 'Ultra HD (3.0x)', desc: '~300 DPI Print' },
                ].map((item) => (
                  <button
                    key={item.scale}
                    type="button"
                    onClick={() => setPdfJpgScale(item.scale)}
                    className={`p-3 rounded-xl border text-left transition-colors ${
                      pdfJpgScale === item.scale
                        ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold">{item.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentOption.id === 'jpg-to-pdf' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                <span>PDF Document Formatting</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { mode: 'auto', label: 'Auto Orientation', desc: 'Detects photo shape' },
                  { mode: 'portrait', label: 'Portrait A4', desc: 'Standard vertical' },
                  { mode: 'landscape', label: 'Landscape A4', desc: 'Wide horizontal' },
                ].map((item) => (
                  <button
                    key={item.mode}
                    type="button"
                    onClick={() => setJpgPdfOrientation(item.mode as any)}
                    className={`p-3 rounded-xl border text-left transition-colors ${
                      jpgPdfOrientation === item.mode
                        ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold">{item.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action: Convert Now Button */}
          <button
            type="button"
            id="start-conversion-btn"
            disabled={selectedFiles.length === 0 || isProcessing}
            onClick={handleConvert}
            className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 ${
              selectedFiles.length > 0 && !isProcessing
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{progressText || 'Converting Document...'}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Convert to {currentOption.toFormat}</span>
              </>
            )}
          </button>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Right Column: Results, Previews & Export Options (col-span-5) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Status / Results Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">Conversion Results</h3>
              {result && (
                <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded border border-emerald-200">
                  COMPLETED
                </span>
              )}
            </div>

            {!result && !isProcessing && (
              <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400">
                <FileCode className="w-10 h-10 stroke-1 mb-2 text-slate-300" />
                <p className="text-xs font-medium text-slate-500">Ready to convert</p>
                <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                  Upload your {currentOption.fromFormat} document and click Convert to generate {currentOption.toFormat}.
                </p>
              </div>
            )}

            {isProcessing && (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800">{progressText}</p>
                  {progressPercent !== null && (
                    <p className="text-[11px] font-mono text-indigo-600 font-bold">
                      {progressPercent}% Complete
                    </p>
                  )}
                </div>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {/* Success alert */}
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Conversion Successful!</span>
                    <p className="text-[11px] text-emerald-700 mt-0.5">{result.message}</p>
                  </div>
                </div>

                {/* Telemetry summary */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {result.summary?.pageCount !== undefined && (
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase block font-sans">Pages</span>
                      <span className="font-bold text-slate-800">{result.summary.pageCount}</span>
                    </div>
                  )}
                  {result.summary?.rowCount !== undefined && (
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase block font-sans">Rows Extracted</span>
                      <span className="font-bold text-slate-800">{result.summary.rowCount}</span>
                    </div>
                  )}
                  {result.summary?.fileSize !== undefined && (
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase block font-sans">File Size</span>
                      <span className="font-bold text-slate-800">{formatBytes(result.summary.fileSize)}</span>
                    </div>
                  )}
                  {result.summary?.sheetCount !== undefined && (
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase block font-sans">Worksheets</span>
                      <span className="font-bold text-slate-800">{result.summary.sheetCount}</span>
                    </div>
                  )}
                </div>

                {/* Primary Download Button */}
                {result.downloadUrl && (
                  <a
                    href={result.downloadUrl}
                    download={result.filename}
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download {result.filename}</span>
                  </a>
                )}

                {/* Extra superpower: If PDF to JPG, offer "Send to A4 Batch Queue" */}
                {extractedPages.length > 0 && onSendImagesToBatchQueue && (
                  <button
                    type="button"
                    id="send-extracted-to-a4-btn"
                    onClick={handleSendToBatcher}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Layers className="w-4 h-4" />
                    <span>Add {extractedPages.length} Pages to A4 Batch Queue</span>
                  </button>
                )}

                {/* Table Preview for PDF -> Excel or Excel -> PDF */}
                {result.tableDataPreview && result.tableDataPreview.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-700 uppercase">
                      Table Preview (First {result.tableDataPreview.length} rows)
                    </span>
                    <div className="overflow-x-auto max-h-44 border border-slate-200 rounded-lg text-[11px] bg-slate-50/50">
                      <table className="w-full text-left border-collapse">
                        <tbody>
                          {result.tableDataPreview.map((row, rIdx) => (
                            <tr key={rIdx} className={rIdx === 0 ? 'bg-indigo-50/80 font-bold text-indigo-950' : 'border-t border-slate-200 hover:bg-white'}>
                              {row.map((cell: any, cIdx: number) => (
                                <td key={cIdx} className="p-1.5 border-r border-slate-200 truncate max-w-[120px]">
                                  {String(cell)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Text Preview for DOCX */}
                {result.extractedTextPreview && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-700 uppercase">Document Excerpt</span>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 font-serif italic max-h-32 overflow-y-auto">
                      "{result.extractedTextPreview}..."
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PDF to JPG Extracted Pages Grid */}
          {extractedPages.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Extracted Pages ({extractedPages.length})
                </span>
                {zipDownloadUrl && (
                  <a
                    href={zipDownloadUrl}
                    download="extracted-pages.zip"
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                  >
                    <FileArchive className="w-3.5 h-3.5" />
                    <span>Download All (ZIP)</span>
                  </a>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
                {extractedPages.map((page, idx) => (
                  <div
                    key={page.pageNumber}
                    className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 group hover:border-indigo-500 transition-all flex flex-col"
                  >
                    <div className="relative aspect-[3/4] bg-slate-200 flex items-center justify-center overflow-hidden">
                      <img
                        src={page.dataUrl}
                        alt={`Page ${page.pageNumber}`}
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <a
                          href={page.dataUrl}
                          download={page.filename}
                          className="p-1.5 bg-white text-slate-800 rounded-lg shadow-sm hover:bg-slate-100 transition-colors"
                          title="Download this page"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                    <div className="p-2 text-[10px] flex items-center justify-between bg-white border-t border-slate-100 font-mono">
                      <span className="font-bold text-slate-700">P.{page.pageNumber}</span>
                      <span className="text-slate-400">{formatBytes(page.size)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
