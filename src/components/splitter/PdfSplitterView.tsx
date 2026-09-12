import React, { useState, useRef, useEffect } from 'react';
import { 
  Scissors, 
  UploadCloud, 
  Download, 
  Trash2, 
  RefreshCw, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  CheckCircle2, 
  Layers, 
  FileText, 
  FileArchive, 
  CheckSquare, 
  Square, 
  Sparkles,
  Info,
  ChevronRight,
  ListOrdered
} from 'lucide-react';
import { 
  SplitMode, 
  SplitFileItem, 
  PageThumbnailItem, 
  GeneratedSplitPdf, 
  EstimatedSplitOutput 
} from '../../types/pdfSplitter';
import { 
  generatePdfThumbnails, 
  calculateEstimatedOutputs, 
  executePdfSplit, 
  createZipFromSplitPdfs 
} from '../../utils/pdfSplitterEngine';
import { formatBytes } from '../../utils/imageOptimizer';
import { useLanguage } from '../../i18n/LanguageContext';

interface PdfSplitterViewProps {
  onShowToast?: (msg: string) => void;
}

export const PdfSplitterView: React.FC<PdfSplitterViewProps> = ({ onShowToast }) => {
  const { t } = useLanguage();

  // Loaded PDF files
  const [files, setFiles] = useState<SplitFileItem[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);

  // Active split configurations
  const [splitMode, setSplitMode] = useState<SplitMode>('extract-into-one');
  const [customRangeText, setCustomRangeText] = useState('1-3, 5, 7-10');
  const [splitEveryX, setSplitEveryX] = useState(5);
  const [equalPartsCount, setEqualPartsCount] = useState(2);

  // Preview & view controls
  const [zoomScale, setZoomScale] = useState<number>(1.0); // 0.7 to 1.5
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active file being viewed/split
  const activeFile = files.find((f) => f.id === activeFileId) || files[0] || null;

  // Selected pages (1-indexed)
  const selectedPageNumbers = activeFile
    ? activeFile.pages.filter((p) => p.selected).map((p) => p.pageNumber)
    : [];

  // Drag & drop handlers
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
      loadNewFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      loadNewFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  // Load and render thumbnails for uploaded PDFs
  const loadNewFiles = async (uploadedFiles: File[]) => {
    const validPdfFiles = uploadedFiles.filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );

    if (validPdfFiles.length === 0) {
      onShowToast?.('Please upload valid PDF files.');
      return;
    }

    for (const file of validPdfFiles) {
      const fileId = `split_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newItem: SplitFileItem = {
        id: fileId,
        file,
        name: file.name,
        size: file.size,
        pageCount: 0,
        status: 'loading',
        pages: [],
        outputFiles: [],
      };

      setFiles((prev) => [...prev, newItem]);
      if (!activeFileId) setActiveFileId(fileId);

      try {
        const pages = await generatePdfThumbnails(file);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  status: 'ready',
                  pageCount: pages.length,
                  pages,
                }
              : f
          )
        );
      } catch (err: any) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? { ...f, status: 'failed', errorMessage: err?.message || 'Failed to parse PDF' }
              : f
          )
        );
      }
    }

    onShowToast?.(`${validPdfFiles.length} PDF(s) loaded for splitting.`);
  };

  // Toggle page selection in active file
  const handleTogglePage = (pageNumber: number) => {
    if (!activeFile) return;
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== activeFile.id) return f;
        return {
          ...f,
          pages: f.pages.map((p) =>
            p.pageNumber === pageNumber ? { ...p, selected: !p.selected } : p
          ),
        };
      })
    );
  };

  // Select all pages
  const handleSelectAllPages = () => {
    if (!activeFile) return;
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== activeFile.id) return f;
        return {
          ...f,
          pages: f.pages.map((p) => ({ ...p, selected: true })),
        };
      })
    );
  };

  // Deselect all pages
  const handleDeselectAllPages = () => {
    if (!activeFile) return;
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== activeFile.id) return f;
        return {
          ...f,
          pages: f.pages.map((p) => ({ ...p, selected: false })),
        };
      })
    );
  };

  // Rotate single page 90 degrees
  const handleRotatePage = (e: React.MouseEvent, pageNumber: number) => {
    e.stopPropagation();
    if (!activeFile) return;
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== activeFile.id) return f;
        return {
          ...f,
          pages: f.pages.map((p) =>
            p.pageNumber === pageNumber
              ? { ...p, rotation: (p.rotation + 90) % 360 }
              : p
          ),
        };
      })
    );
  };

  // Calculate estimated output partitions
  const estimatedOutputs: EstimatedSplitOutput[] = React.useMemo(() => {
    if (!activeFile || activeFile.pageCount === 0) return [];
    return calculateEstimatedOutputs(
      activeFile.name,
      activeFile.pageCount,
      splitMode,
      selectedPageNumbers,
      {
        customRangeText,
        splitEveryX,
        equalPartsCount,
      }
    );
  }, [activeFile, splitMode, selectedPageNumbers, customRangeText, splitEveryX, equalPartsCount]);

  // Execute the split
  const handleExecuteSplit = async () => {
    if (!activeFile || estimatedOutputs.length === 0) {
      onShowToast?.('No pages or output partitions defined for splitting.');
      return;
    }

    setIsProcessing(true);
    try {
      // Build rotations map
      const rotationsMap: Record<number, number> = {};
      activeFile.pages.forEach((p) => {
        if (p.rotation !== 0) rotationsMap[p.pageNumber] = p.rotation;
      });

      const outputFiles = await executePdfSplit(activeFile.file, estimatedOutputs, rotationsMap);

      setFiles((prev) =>
        prev.map((f) =>
          f.id === activeFile.id
            ? { ...f, status: 'completed', outputFiles }
            : f
        )
      );

      onShowToast?.(`Successfully split into ${outputFiles.length} PDF file(s)!`);
    } catch (err: any) {
      onShowToast?.(`Splitting error: ${err?.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Download a single generated split PDF
  const handleDownloadSinglePdf = (splitPdf: GeneratedSplitPdf) => {
    const a = document.createElement('a');
    a.href = splitPdf.downloadUrl;
    a.download = splitPdf.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Download all as ZIP
  const handleDownloadZip = async () => {
    if (!activeFile || activeFile.outputFiles.length === 0) return;
    setIsZipping(true);
    try {
      const baseName = activeFile.name.replace(/\.pdf$/i, '');
      const { downloadUrl } = await createZipFromSplitPdfs(
        activeFile.outputFiles,
        `${baseName}_split_package.zip`
      );

      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${baseName}_split_package.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      onShowToast?.('Downloaded all split files as ZIP archive!');
    } catch (err: any) {
      onShowToast?.(`Failed to generate ZIP: ${err?.message || err}`);
    } finally {
      setIsZipping(false);
    }
  };

  // Remove file
  const handleRemoveFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    if (activeFileId === fileId) {
      const remaining = files.filter((f) => f.id !== fileId);
      setActiveFileId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Scissors className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {t('splitter.title')}
            </h1>
            <span className="text-2xs font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-2 py-0.5 rounded-full">
              9 Split Modes
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            {t('splitter.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            {t('action.upload')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Multi-File Tab Bar (When multiple PDFs are loaded) */}
      {files.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {files.map((file) => (
            <button
              key={file.id}
              type="button"
              onClick={() => setActiveFileId(file.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 border shrink-0 transition-all cursor-pointer ${
                activeFile?.id === file.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="max-w-[160px] truncate">{file.name}</span>
              <span className={`text-2xs px-1.5 py-0.2 rounded-full ${
                activeFile?.id === file.id ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 text-slate-500'
              }`}>
                {file.pageCount} pgs
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile(file.id);
                }}
                className="hover:opacity-70 ml-1 p-0.5 cursor-pointer"
              >
                ×
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Main Splitter Body */}
      {activeFile ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / Center 2 Columns: Visual Page Thumbnails Grid */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-5 space-y-4 shadow-xs flex flex-col">
            {/* Thumbnail Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  {activeFile.name}
                </span>
                <span className="text-2xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                  {selectedPageNumbers.length} / {activeFile.pageCount} {t('splitter.pagesSelected')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllPages}
                  className="px-2.5 py-1 text-2xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                >
                  {t('action.selectAll')}
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAllPages}
                  className="px-2.5 py-1 text-2xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                >
                  {t('action.deselectAll')}
                </button>

                {/* Zoom Controls */}
                <div className="flex items-center gap-1 border-s border-slate-200 ps-2 ms-1">
                  <button
                    type="button"
                    onClick={() => setZoomScale((z) => Math.max(0.7, z - 0.15))}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-2xs font-mono text-slate-500 w-8 text-center">
                    {Math.round(zoomScale * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomScale((z) => Math.min(1.4, z + 0.15))}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Thumbnails Grid */}
            <div className="flex-1 max-h-[600px] overflow-y-auto p-2">
              {activeFile.status === 'loading' ? (
                <div className="py-20 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                  <p className="text-xs font-semibold text-slate-600">
                    Generating page thumbnails...
                  </p>
                </div>
              ) : activeFile.pages.length === 0 ? (
                <div className="py-20 text-center text-slate-400 text-xs">
                  No pages loaded.
                </div>
              ) : (
                <div
                  className="grid gap-3 transition-all duration-150"
                  style={{
                    gridTemplateColumns: `repeat(auto-fill, minmax(${Math.floor(130 * zoomScale)}px, 1fr))`,
                  }}
                >
                  {activeFile.pages.map((p) => (
                    <div
                      key={p.pageNumber}
                      onClick={() => handleTogglePage(p.pageNumber)}
                      className={`group relative rounded-lg border-2 p-1.5 transition-all duration-150 cursor-pointer select-none flex flex-col items-center justify-between ${
                        p.selected
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-2 ring-indigo-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                      }`}
                    >
                      {/* Checkbox Badge */}
                      <div className="w-full flex items-center justify-between px-1 mb-1">
                        <span className="text-2xs font-bold text-slate-700">
                          #{p.pageNumber}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => handleRotatePage(e, p.pageNumber)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-indigo-600 rounded transition-opacity"
                            title="Rotate Page 90°"
                          >
                            <RotateCw className="w-3 h-3" />
                          </button>
                          {p.selected ? (
                            <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* Thumbnail Canvas Preview */}
                      <div className="w-full aspect-3/4 bg-white rounded border border-slate-100 overflow-hidden flex items-center justify-center relative shadow-2xs">
                        {p.thumbnailDataUrl ? (
                          <img
                            src={p.thumbnailDataUrl}
                            alt={`Page ${p.pageNumber}`}
                            style={{ transform: `rotate(${p.rotation}deg)` }}
                            className="w-full h-full object-contain transition-transform duration-200"
                          />
                        ) : (
                          <span className="text-2xs text-slate-300"># {p.pageNumber}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Split Mode Selection & Estimated Output Breakdown */}
          <div className="space-y-5">
            {/* Split Mode Selector Card */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 space-y-4 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Scissors className="w-4 h-4 text-indigo-600" />
                Select Split Mode (9 Modes)
              </h3>

              <div className="space-y-1.5">
                <select
                  value={splitMode}
                  onChange={(e) => setSplitMode(e.target.value as SplitMode)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                >
                  <option value="extract-into-one">Mode 8: Extract Selected Pages into One PDF</option>
                  <option value="extract-into-separate">Mode 9: Extract Selected into Separate PDFs</option>
                  <option value="delete-selected">Mode 7: Delete Selected & Export Remaining PDF</option>
                  <option value="extract-pages">Mode 1: Extract Pages (e.g. 1, 3, 5, 8)</option>
                  <option value="page-ranges">Mode 2: Page Ranges (e.g. 1-5, 6-10)</option>
                  <option value="custom-range">Mode 3: Custom Range (e.g. 1-3, 5, 8-11)</option>
                  <option value="split-every-page">Mode 4: Split Every Page (1 Page = 1 PDF)</option>
                  <option value="split-every-x">Mode 5: Split Every X Pages</option>
                  <option value="equal-parts">Mode 6: Split into Equal Parts</option>
                </select>
              </div>

              {/* Mode-Specific Parameter Inputs */}
              {(splitMode === 'page-ranges' || splitMode === 'custom-range') && (
                <div className="space-y-1 pt-1">
                  <label className="text-2xs font-semibold text-slate-600 block">
                    Page Ranges Expression (comma separated)
                  </label>
                  <input
                    type="text"
                    value={customRangeText}
                    onChange={(e) => setCustomRangeText(e.target.value)}
                    placeholder="e.g. 1-5, 6-10, 11-20"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <span className="text-3xs text-slate-400">Example: 1-3, 5, 8-11, 14</span>
                </div>
              )}

              {splitMode === 'split-every-x' && (
                <div className="space-y-1 pt-1">
                  <label className="text-2xs font-semibold text-slate-600 block">
                    Pages per Split Output
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={activeFile.pageCount || 100}
                    value={splitEveryX}
                    onChange={(e) => setSplitEveryX(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              )}

              {splitMode === 'equal-parts' && (
                <div className="space-y-1 pt-1">
                  <label className="text-2xs font-semibold text-slate-600 block">
                    Number of Equal Parts
                  </label>
                  <input
                    type="number"
                    min="2"
                    max={activeFile.pageCount || 10}
                    value={equalPartsCount}
                    onChange={(e) => setEqualPartsCount(parseInt(e.target.value, 10) || 2)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              )}

              {/* Estimated Output Preview Card */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">
                    {t('splitter.estimatedOutput')}
                  </span>
                  <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {estimatedOutputs.length} PDF files
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
                  {estimatedOutputs.length === 0 ? (
                    <span className="text-2xs text-slate-400 italic block py-2 text-center">
                      No matching pages for current split parameters.
                    </span>
                  ) : (
                    estimatedOutputs.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-2xs p-1.5 rounded bg-white border border-slate-200/70">
                        <span className="font-semibold text-slate-800 truncate max-w-[140px]">
                          {item.name}
                        </span>
                        <span className="text-slate-500 font-mono">
                          {item.pageRangeDesc}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleExecuteSplit}
                disabled={isProcessing || estimatedOutputs.length === 0}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Splitting Document...
                  </>
                ) : (
                  <>
                    <Scissors className="w-4 h-4" />
                    {t('splitter.generateSplit')} ({estimatedOutputs.length})
                  </>
                )}
              </button>
            </div>

            {/* Generated Results & Downloads */}
            {activeFile.outputFiles.length > 0 && (
              <div className="bg-white rounded-xl border border-emerald-200/80 p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-bold text-slate-900">
                      Generated Split Files ({activeFile.outputFiles.length})
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadZip}
                    disabled={isZipping}
                    className="px-2.5 py-1 bg-emerald-600 text-white rounded-md text-2xs font-semibold hover:bg-emerald-700 shadow-2xs flex items-center gap-1 cursor-pointer"
                  >
                    <FileArchive className="w-3 h-3" />
                    {isZipping ? 'Zipping...' : t('action.downloadZip')}
                  </button>
                </div>

                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {activeFile.outputFiles.map((item) => (
                    <div
                      key={item.id}
                      className="p-2 bg-slate-50 rounded-lg border border-slate-200/60 flex items-center justify-between text-xs hover:bg-slate-100/70 transition-colors"
                    >
                      <div className="truncate max-w-[170px]">
                        <span className="font-semibold text-slate-800 block truncate">{item.name}</span>
                        <span className="text-3xs text-slate-500">{item.pageRangeDesc} • {formatBytes(item.sizeBytes)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownloadSinglePdf(item)}
                        className="p-1.5 text-indigo-600 hover:bg-white rounded border border-slate-200 shadow-2xs cursor-pointer"
                        title="Download file"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty Dropzone State */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 cursor-pointer ${
            isDragOver
              ? 'border-indigo-500 bg-indigo-50/60 ring-4 ring-indigo-500/10'
              : 'border-slate-200/90 hover:border-slate-300 bg-white shadow-xs'
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="p-4 rounded-full bg-indigo-50 text-indigo-600 shadow-2xs">
              <Scissors className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {t('splitter.dropZone')}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Upload one or multiple PDF documents to inspect pages and generate split partitions
              </p>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer"
            >
              {t('action.upload')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
