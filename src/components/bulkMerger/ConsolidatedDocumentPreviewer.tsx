import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ExternalLink,
  FileText,
  Archive,
  Loader2,
  AlertCircle,
  LayoutGrid,
  Download,
  CheckCircle2,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
} from 'lucide-react';
import { MergeOutputFormat } from '../../types/bulkMerger';

// Ensure PDF.js worker is properly configured
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

interface ConsolidatedDocumentPreviewerProps {
  blob: Blob;
  downloadUrl: string;
  filename: string;
  format: MergeOutputFormat;
  totalPages?: number;
  fileSize?: number;
}

interface ZipEntryInfo {
  name: string;
  size: number;
  isDir: boolean;
}

interface PageThumb {
  pageNumber: number;
  url: string;
}

export const ConsolidatedDocumentPreviewer: React.FC<ConsolidatedDocumentPreviewerProps> = ({
  blob,
  downloadUrl,
  filename,
  format,
  totalPages = 1,
  fileSize = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // PDF State
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalDocPages, setTotalDocPages] = useState<number>(totalPages || 1);
  const [scale, setScale] = useState<number>(0.95);
  const [rotation, setRotation] = useState<number>(0);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(true);
  const [isRenderingPage, setIsRenderingPage] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Thumbnails
  const [thumbnails, setThumbnails] = useState<PageThumb[]>([]);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(false);

  // ZIP State
  const [zipEntries, setZipEntries] = useState<ZipEntryInfo[]>([]);
  const [isLoadingZip, setIsLoadingZip] = useState<boolean>(false);

  // Format bytes helper
  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // 1. Load document when blob changes
  useEffect(() => {
    let isCancelled = false;

    if (format === 'pdf') {
      setIsLoadingPdf(true);
      setLoadError(null);
      setPdfDoc(null);
      setCurrentPage(1);
      setThumbnails([]);

      const loadPdf = async () => {
        try {
          const arrayBuffer = await blob.arrayBuffer();
          if (isCancelled) return;

          // Clone buffer for PDF.js to avoid worker neutering
          const clonedBuffer = arrayBuffer.slice(0);

          const loadingTask = pdfjsLib.getDocument({
            data: new Uint8Array(clonedBuffer),
            cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
            cMapPacked: true,
          });

          const doc = await loadingTask.promise;
          if (isCancelled) return;

          setPdfDoc(doc);
          setTotalDocPages(doc.numPages);
          setIsLoadingPdf(false);

          // Generate lightweight page thumbnails in the background
          generateThumbnails(doc);
        } catch (err: any) {
          if (isCancelled) return;
          console.warn('PDF.js canvas preview initialization notice:', err);
          setLoadError(err?.message || 'Could not render PDF preview in canvas');
          setIsLoadingPdf(false);
        }
      };

      loadPdf();
    } else if (format === 'zip') {
      setIsLoadingZip(true);
      const inspectZip = async () => {
        try {
          const zip = await JSZip.loadAsync(blob);
          const entries: ZipEntryInfo[] = [];
          zip.forEach((relativePath, entry) => {
            entries.push({
              name: relativePath,
              // @ts-ignore
              size: (entry as any)._data?.uncompressedSize || 0,
              isDir: entry.dir,
            });
          });
          setZipEntries(entries);
        } catch (e) {
          console.error('Failed to parse ZIP manifest:', e);
        } finally {
          setIsLoadingZip(false);
        }
      };
      inspectZip();
    }

    return () => {
      isCancelled = true;
    };
  }, [blob, format]);

  // Generate lightweight thumbnails for page strip
  const generateThumbnails = async (doc: any) => {
    const thumbs: PageThumb[] = [];
    const count = Math.min(doc.numPages, 30); // Generate up to 30 thumbnails for quick nav
    for (let p = 1; p <= count; p++) {
      try {
        const page = await doc.getPage(p);
        const thumbViewport = page.getViewport({ scale: 0.18 });
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(thumbViewport.width);
        canvas.height = Math.floor(thumbViewport.height);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport: thumbViewport }).promise;
          thumbs.push({
            pageNumber: p,
            url: canvas.toDataURL('image/jpeg', 0.75),
          });
          setThumbnails([...thumbs]);
        }
      } catch {
        // Continue gracefully
      }
    }
  };

  // 2. Render current page on canvas
  useEffect(() => {
    let isCancelled = false;

    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current) return;

      try {
        setIsRenderingPage(true);
        const page = await pdfDoc.getPage(currentPage);
        if (isCancelled) return;

        // Base viewport with rotation
        const baseViewport = page.getViewport({ scale: 1.0, rotation });
        
        // Auto-scale to container width if container exists
        const containerWidth = containerRef.current?.clientWidth || 700;
        const targetWidth = Math.min(containerWidth - 48, 800);
        const calculatedScale = (targetWidth / baseViewport.width) * scale;

        const viewport = page.getViewport({ scale: calculatedScale, rotation });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, viewport.width, viewport.height);

        // @ts-ignore
        await page.render({
          canvasContext: ctx,
          viewport,
        }).promise;
        ctx.restore();

        if (!isCancelled) {
          setIsRenderingPage(false);
        }
      } catch (err) {
        if (!isCancelled) {
          console.warn('Error rendering canvas page:', err);
          setIsRenderingPage(false);
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, currentPage, scale, rotation]);

  // Page navigation helpers
  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalDocPages, prev + 1));
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(2.0, parseFloat((prev + 0.15).toFixed(2))));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(0.4, parseFloat((prev - 0.15).toFixed(2))));
  };

  const handleResetZoom = () => {
    setScale(0.95);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleOpenInNewTab = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // ----------------------------------------------------
  // Render: ZIP Archive Format
  // ----------------------------------------------------
  if (format === 'zip') {
    return (
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col min-h-[360px] max-h-[420px]">
        <div className="p-3.5 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Archive className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold text-slate-800">
              ZIP Archive Contents ({zipEntries.length} items)
            </span>
          </div>
          <span className="text-2xs font-mono text-slate-500">
            {formatBytes(fileSize)}
          </span>
        </div>

        <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100">
          {isLoadingZip ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-xs">Reading archive manifest...</span>
            </div>
          ) : zipEntries.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Archive contains 1 bundle package
            </div>
          ) : (
            zipEntries.map((entry, idx) => (
              <div
                key={idx}
                className="py-2 flex items-center justify-between text-xs hover:bg-slate-100/60 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {entry.name.endsWith('.pdf') ? (
                    <FileText className="w-4 h-4 text-red-500 shrink-0" />
                  ) : entry.name.endsWith('.xlsx') || entry.name.endsWith('.csv') ? (
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : entry.name.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                    <ImageIcon className="w-4 h-4 text-purple-500 shrink-0" />
                  ) : (
                    <FileCode className="w-4 h-4 text-blue-500 shrink-0" />
                  )}
                  <span className="font-mono text-slate-700 truncate">{entry.name}</span>
                </div>
                <span className="text-2xs font-mono text-slate-400 shrink-0 ml-2">
                  {formatBytes(entry.size)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // Render: PDF Format with Canvas Preview
  // ----------------------------------------------------
  return (
    <div
      ref={containerRef}
      id="consolidated-doc-previewer"
      className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900/5 flex flex-col shadow-xs"
    >
      {/* Interactive PDF Control Toolbar */}
      <div className="p-2.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 text-xs">
        {/* Page Nav */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            id="pdf-prev-page-btn"
            onClick={handlePrevPage}
            disabled={currentPage <= 1 || isLoadingPdf}
            className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1 font-mono text-xs px-2 py-0.5 bg-slate-800/80 rounded border border-slate-700">
            <span className="text-slate-400">Page</span>
            <input
              type="number"
              min={1}
              max={totalDocPages}
              value={currentPage}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1 && val <= totalDocPages) {
                  setCurrentPage(val);
                }
              }}
              className="w-10 text-center bg-transparent text-white font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-0.5"
            />
            <span className="text-slate-400">of {totalDocPages}</span>
          </div>

          <button
            type="button"
            id="pdf-next-page-btn"
            onClick={handleNextPage}
            disabled={currentPage >= totalDocPages || isLoadingPdf}
            className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Toggle Thumbnails */}
          {thumbnails.length > 1 && (
            <button
              type="button"
              id="pdf-toggle-thumbnails-btn"
              onClick={() => setShowThumbnails(!showThumbnails)}
              className={`px-2 py-1 rounded text-2xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                showThumbnails
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="Toggle page thumbnails"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Thumbnails</span>
            </button>
          )}
        </div>

        {/* Zoom & Rotation Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            id="pdf-zoom-out-btn"
            onClick={handleZoomOut}
            disabled={isLoadingPdf}
            className="p-1.5 rounded hover:bg-slate-800 cursor-pointer transition-colors text-slate-300 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            type="button"
            id="pdf-reset-zoom-btn"
            onClick={handleResetZoom}
            disabled={isLoadingPdf}
            className="px-2 py-0.5 text-2xs font-mono rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            title="Reset Zoom"
          >
            {Math.round(scale * 100)}%
          </button>

          <button
            type="button"
            id="pdf-zoom-in-btn"
            onClick={handleZoomIn}
            disabled={isLoadingPdf}
            className="p-1.5 rounded hover:bg-slate-800 cursor-pointer transition-colors text-slate-300 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-slate-700 mx-1" />

          <button
            type="button"
            id="pdf-rotate-btn"
            onClick={handleRotate}
            disabled={isLoadingPdf}
            className="p-1.5 rounded hover:bg-slate-800 cursor-pointer transition-colors text-slate-300 hover:text-white"
            title="Rotate 90° Clockwise"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            id="pdf-open-new-tab-btn"
            onClick={handleOpenInNewTab}
            className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-2xs font-bold flex items-center gap-1 cursor-pointer transition-colors ml-1 shadow-2xs"
            title="Open raw PDF in full browser tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in Tab</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport Area */}
      <div className="relative flex-1 min-h-[380px] max-h-[500px] overflow-auto bg-slate-200/70 p-4 flex items-center justify-center">
        {isLoadingPdf ? (
          <div className="flex flex-col items-center justify-center text-slate-600 gap-3 py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <div className="text-center">
              <p className="text-xs font-bold text-slate-800">Generating Document Canvas Preview...</p>
              <p className="text-2xs text-slate-500 mt-0.5">
                Rendering {totalDocPages} consolidated pages with high fidelity
              </p>
            </div>
          </div>
        ) : loadError ? (
          /* Graceful Fallback Card when PDF.js cannot render (e.g. security sandbox) */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-md w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Consolidated Master Document Ready</h4>
              <p className="text-xs text-slate-500 mt-1">
                Your master PDF ({totalDocPages} pages, {formatBytes(fileSize)}) was generated successfully.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left font-mono text-2xs space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">File:</span>
                <span className="font-bold truncate max-w-[200px]">{filename}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Pages:</span>
                <span className="font-bold text-blue-600">{totalDocPages}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Size:</span>
                <span className="font-bold text-slate-800">{formatBytes(fileSize)}</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleOpenInNewTab}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open in Full Tab</span>
              </button>
              <a
                href={downloadUrl}
                download={filename}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 cursor-pointer border border-slate-300"
              >
                <Download className="w-4 h-4" />
                <span>Direct Download</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="relative transition-all duration-150 ease-out my-auto">
            {/* Page Canvas */}
            <canvas
              ref={canvasRef}
              className="bg-white shadow-xl rounded-sm border border-slate-300/80 block mx-auto transition-transform duration-100"
            />

            {/* Rendering Overlay Indicator */}
            {isRenderingPage && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-2xs flex items-center justify-center rounded-sm">
                <div className="flex items-center gap-2 bg-slate-900/80 text-white text-2xs px-3 py-1.5 rounded-full font-mono">
                  <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                  <span>Rendering Page {currentPage}...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Optional Thumbnails Carousel Strip */}
      {showThumbnails && thumbnails.length > 0 && (
        <div className="p-2.5 bg-slate-900 border-t border-slate-800 overflow-x-auto flex items-center gap-2 scrollbar-thin">
          {thumbnails.map((thumb) => (
            <button
              key={thumb.pageNumber}
              type="button"
              onClick={() => setCurrentPage(thumb.pageNumber)}
              className={`shrink-0 flex flex-col items-center gap-1 p-1 rounded transition-all cursor-pointer ${
                currentPage === thumb.pageNumber
                  ? 'ring-2 ring-blue-500 bg-slate-800'
                  : 'opacity-70 hover:opacity-100 hover:bg-slate-800/60'
              }`}
            >
              <img
                src={thumb.url}
                alt={`Page ${thumb.pageNumber}`}
                className="w-12 h-16 object-cover bg-white rounded-xs shadow-2xs"
              />
              <span className="text-[10px] font-mono text-slate-300">
                {thumb.pageNumber}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Bottom Status Bar */}
      <div className="px-3 py-1.5 bg-white border-t border-slate-200 flex items-center justify-between text-2xs text-slate-500 font-mono">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          <span>Interactive Canvas View</span>
          <span>•</span>
          <span>High-DPI 2D Renderer</span>
        </div>
        <div>
          Showing page {currentPage} of {totalDocPages} ({Math.round(scale * 100)}% zoom)
        </div>
      </div>
    </div>
  );
};
