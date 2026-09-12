import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  UploadCloud, 
  Download, 
  Trash2, 
  RefreshCw, 
  Sliders, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  X, 
  ShieldCheck, 
  FileArchive, 
  Sparkles,
  ArrowDown,
  Layers,
  Zap,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  CompressionPreset, 
  CustomCompressionOptions, 
  CompressedFileItem, 
  CompressionBatchSummary 
} from '../../types/pdfCompressor';
import { 
  compressPdfFile, 
  DEFAULT_CUSTOM_OPTIONS 
} from '../../utils/pdfCompressorEngine';
import { formatBytes } from '../../utils/imageOptimizer';
import { useLanguage } from '../../i18n/LanguageContext';
import JSZip from 'jszip';

interface PdfCompressorViewProps {
  onShowToast?: (msg: string) => void;
}

export const PdfCompressorView: React.FC<PdfCompressorViewProps> = ({ onShowToast }) => {
  const { t, isRtl } = useLanguage();

  const [files, setFiles] = useState<CompressedFileItem[]>([]);
  const [preset, setPreset] = useState<CompressionPreset>('recommended');
  const [customOptions, setCustomOptions] = useState<CustomCompressionOptions>(DEFAULT_CUSTOM_OPTIONS);
  const [showCustomDetails, setShowCustomDetails] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  // Concurrency control: max 2 simultaneous files
  const MAX_CONCURRENCY = 2;
  const cancelTokensRef = useRef<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Handle drag and drop
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
      addUploadedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addUploadedFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const addUploadedFiles = (newFiles: File[]) => {
    const validPdfFiles = newFiles.filter((f) => 
      f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );

    if (validPdfFiles.length === 0) {
      onShowToast?.(t('compressor.invalidFormat', 'Please upload valid PDF documents.'));
      return;
    }

    const newItems: CompressedFileItem[] = validPdfFiles.map((file) => ({
      id: `pdf_comp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      file,
      name: file.name,
      originalSize: file.size,
      compressedSize: 0,
      pageCount: 0,
      status: 'waiting',
      progressPercent: 0,
      statusText: t('status.waiting', 'Waiting in queue...'),
    }));

    setFiles((prev) => [...prev, ...newItems]);
    onShowToast?.(`${validPdfFiles.length} ${t('compressor.filesAdded', 'PDF files added to queue')}`);
  };

  // Remove single file
  const handleRemoveFile = (id: string) => {
    cancelTokensRef.current[id] = true;
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Clear all
  const handleClearAll = () => {
    files.forEach((f) => {
      cancelTokensRef.current[f.id] = true;
      if (f.downloadUrl) URL.revokeObjectURL(f.downloadUrl);
    });
    setFiles([]);
    setIsBatchProcessing(false);
  };

  // Clear completed
  const handleClearCompleted = () => {
    setFiles((prev) => prev.filter((f) => f.status !== 'completed'));
  };

  // Cancel processing for a specific file
  const handleCancelFile = (id: string) => {
    cancelTokensRef.current[id] = true;
    setFiles((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'cancelled', statusText: t('status.cancelled', 'Cancelled') } : item
      )
    );
  };

  // Process a single file
  const processSingleFile = async (item: CompressedFileItem): Promise<void> => {
    cancelTokensRef.current[item.id] = false;

    setFiles((prev) =>
      prev.map((f) =>
        f.id === item.id
          ? { ...f, status: 'processing', progressPercent: 5, statusText: 'Initializing...' }
          : f
      )
    );

    try {
      const result = await compressPdfFile(item.file, {
        preset,
        custom: preset === 'custom' ? customOptions : undefined,
        checkCancelled: () => !!cancelTokensRef.current[item.id],
        onProgress: (percent, statusText) => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === item.id ? { ...f, progressPercent: percent, statusText } : f
            )
          );
        },
      });

      const downloadUrl = URL.createObjectURL(result.compressedBlob);

      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id
            ? {
                ...f,
                status: 'completed',
                progressPercent: 100,
                compressedSize: result.compressedSize,
                pageCount: result.pageCount,
                compressedBlob: result.compressedBlob,
                downloadUrl,
                statusText: 'Completed',
              }
            : f
        )
      );
    } catch (err: any) {
      if (cancelTokensRef.current[item.id]) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? { ...f, status: 'cancelled', statusText: 'Cancelled by user' }
              : f
          )
        );
      } else {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? {
                  ...f,
                  status: 'failed',
                  errorMessage: err?.message || 'Compression error',
                  statusText: 'Failed',
                }
              : f
          )
        );
      }
    }
  };

  // Process all files in queue with concurrency limit (2-3 simultaneous)
  const handleProcessAll = async () => {
    const queue = files.filter((f) => f.status === 'waiting' || f.status === 'failed' || f.status === 'cancelled');
    if (queue.length === 0) return;

    setIsBatchProcessing(true);

    const executeQueue = async () => {
      let activeJobs = 0;
      let index = 0;

      return new Promise<void>((resolve) => {
        const checkNext = () => {
          if (index >= queue.length && activeJobs === 0) {
            setIsBatchProcessing(false);
            resolve();
            return;
          }

          while (activeJobs < MAX_CONCURRENCY && index < queue.length) {
            const currentItem = queue[index++];
            activeJobs++;
            processSingleFile(currentItem).finally(() => {
              activeJobs--;
              checkNext();
            });
          }
        };

        checkNext();
      });
    };

    await executeQueue();
    onShowToast?.(t('compressor.batchComplete', 'Batch compression finished!'));
  };

  // Retry failed file
  const handleRetryFile = (id: string) => {
    const target = files.find((f) => f.id === id);
    if (target) {
      processSingleFile(target);
    }
  };

  // Retry all failed files
  const handleRetryFailed = () => {
    const failedList = files.filter((f) => f.status === 'failed');
    failedList.forEach((f) => processSingleFile(f));
  };

  // Download individual file
  const handleDownloadSingle = (item: CompressedFileItem) => {
    if (!item.downloadUrl) return;
    const a = document.createElement('a');
    a.href = item.downloadUrl;
    const baseName = item.name.replace(/\.pdf$/i, '');
    a.download = `${baseName}_compressed.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Download all as ZIP
  const handleDownloadAllZip = async () => {
    const completedItems = files.filter((f) => f.status === 'completed' && f.compressedBlob);
    if (completedItems.length === 0) {
      onShowToast?.(t('compressor.noCompleted', 'No completed files to download.'));
      return;
    }

    setIsZipping(true);
    try {
      const zip = new JSZip();
      for (const item of completedItems) {
        if (item.compressedBlob) {
          const baseName = item.name.replace(/\.pdf$/i, '');
          zip.file(`${baseName}_compressed.pdf`, item.compressedBlob);
        }
      }

      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      const zipUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = `GulfWay_Compressed_PDFs_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(zipUrl);

      onShowToast?.(t('compressor.zipReady', 'ZIP archive downloaded successfully!'));
    } catch (err: any) {
      onShowToast?.(`Error creating ZIP archive: ${err?.message || err}`);
    } finally {
      setIsZipping(false);
    }
  };

  // Calculate batch metrics
  const summary: CompressionBatchSummary = React.useMemo(() => {
    const completed = files.filter((f) => f.status === 'completed');
    const failed = files.filter((f) => f.status === 'failed');
    const totalOriginalBytes = completed.reduce((acc, f) => acc + f.originalSize, 0);
    const totalCompressedBytes = completed.reduce((acc, f) => acc + f.compressedSize, 0);
    const totalSavedBytes = Math.max(0, totalOriginalBytes - totalCompressedBytes);
    const avgReduction = totalOriginalBytes > 0
      ? Math.round((totalSavedBytes / totalOriginalBytes) * 100)
      : 0;

    return {
      totalFiles: files.length,
      completedFiles: completed.length,
      failedFiles: failed.length,
      totalOriginalBytes,
      totalCompressedBytes,
      totalSavedBytes,
      averageReductionPercent: avgReduction,
    };
  }, [files]);

  const totalWaiting = files.filter((f) => f.status === 'waiting').length;
  const totalProcessing = files.filter((f) => f.status === 'processing').length;

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {t('compressor.title')}
            </h1>
            <span className="text-2xs font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-full">
              WASM / In-Memory
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            {t('compressor.subtitle')}
          </p>
        </div>

        {/* Verified Privacy Notice */}
        <div className="flex items-center gap-2.5 bg-emerald-50/80 border border-emerald-200/70 rounded-lg px-3.5 py-2 text-emerald-800 text-xs shrink-0 shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">
            {t('compressor.secureNotice')}
          </span>
        </div>
      </div>

      {/* Preset Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Recommended */}
        <button
          type="button"
          onClick={() => { setPreset('recommended'); setShowCustomDetails(false); }}
          className={`text-start p-4 rounded-xl border transition-all duration-150 relative cursor-pointer ${
            preset === 'recommended'
              ? 'bg-indigo-50/70 border-indigo-500/80 ring-2 ring-indigo-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              {t('compressor.mode.recommended')}
            </span>
            <span className="text-2xs font-semibold px-1.5 py-0.5 rounded bg-indigo-100/80 text-indigo-700">
              ~65%
            </span>
          </div>
          <p className="text-2xs text-slate-500 line-clamp-2">
            {t('compressor.mode.recommendedDesc')}
          </p>
        </button>

        {/* Maximum */}
        <button
          type="button"
          onClick={() => { setPreset('maximum'); setShowCustomDetails(false); }}
          className={`text-start p-4 rounded-xl border transition-all duration-150 relative cursor-pointer ${
            preset === 'maximum'
              ? 'bg-amber-50/70 border-amber-500/80 ring-2 ring-amber-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              {t('compressor.mode.maximum')}
            </span>
            <span className="text-2xs font-semibold px-1.5 py-0.5 rounded bg-amber-100/80 text-amber-700">
              ~80%
            </span>
          </div>
          <p className="text-2xs text-slate-500 line-clamp-2">
            {t('compressor.mode.maximumDesc')}
          </p>
        </button>

        {/* High Quality */}
        <button
          type="button"
          onClick={() => { setPreset('high-quality'); setShowCustomDetails(false); }}
          className={`text-start p-4 rounded-xl border transition-all duration-150 relative cursor-pointer ${
            preset === 'high-quality'
              ? 'bg-emerald-50/70 border-emerald-500/80 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              {t('compressor.mode.highQuality')}
            </span>
            <span className="text-2xs font-semibold px-1.5 py-0.5 rounded bg-emerald-100/80 text-emerald-700">
              Print-Ready
            </span>
          </div>
          <p className="text-2xs text-slate-500 line-clamp-2">
            {t('compressor.mode.highQualityDesc')}
          </p>
        </button>

        {/* Custom */}
        <button
          type="button"
          onClick={() => { setPreset('custom'); setShowCustomDetails(true); }}
          className={`text-start p-4 rounded-xl border transition-all duration-150 relative cursor-pointer ${
            preset === 'custom'
              ? 'bg-purple-50/70 border-purple-500/80 ring-2 ring-purple-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-purple-600" />
              {t('compressor.mode.custom')}
            </span>
            <span className="text-2xs font-semibold px-1.5 py-0.5 rounded bg-purple-100/80 text-purple-700">
              Granular
            </span>
          </div>
          <p className="text-2xs text-slate-500 line-clamp-2">
            {t('compressor.mode.customDesc')}
          </p>
        </button>
      </div>

      {/* Granular Custom Controls Accordion */}
      {preset === 'custom' && (
        <div className="bg-white rounded-xl border border-purple-200/80 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-600" />
              Advanced Custom Compression Parameters
            </h3>
            <button
              type="button"
              onClick={() => setShowCustomDetails(!showCustomDetails)}
              className="text-xs font-semibold text-purple-700 hover:underline flex items-center gap-1"
            >
              {showCustomDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showCustomDetails ? 'Collapse Parameters' : 'Expand Parameters'}
            </button>
          </div>

          {showCustomDetails && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-2 border-t border-slate-100 text-xs">
              {/* Image Quality Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>{t('compressor.quality')}</span>
                  <span className="text-indigo-600">{Math.round(customOptions.imageQuality * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.15"
                  max="0.95"
                  step="0.05"
                  value={customOptions.imageQuality}
                  onChange={(e) =>
                    setCustomOptions({ ...customOptions, imageQuality: parseFloat(e.target.value) })
                  }
                  className="w-full accent-indigo-600"
                />
                <span className="text-3xs text-slate-400">Lower quality results in smaller file size</span>
              </div>

              {/* Resolution / DPI */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 block">
                  {t('compressor.resolution')}
                </label>
                <select
                  value={customOptions.maxDpi}
                  onChange={(e) =>
                    setCustomOptions({ ...customOptions, maxDpi: parseInt(e.target.value, 10) })
                  }
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-purple-500/20 outline-none"
                >
                  <option value={72}>72 DPI (Extreme Screen Optimization)</option>
                  <option value={100}>100 DPI (Web & Email attachments)</option>
                  <option value={150}>150 DPI (Balanced Office Standard)</option>
                  <option value={200}>200 DPI (High Clarity)</option>
                  <option value={300}>300 DPI (Archival / Print Grade)</option>
                </select>
              </div>

              {/* Toggles */}
              <div className="space-y-2.5 sm:col-span-2 lg:col-span-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={customOptions.grayscale}
                    onChange={(e) =>
                      setCustomOptions({ ...customOptions, grayscale: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-purple-600 accent-purple-600"
                  />
                  <span className="font-medium text-slate-700">{t('compressor.grayscale')}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={customOptions.removeMetadata}
                    onChange={(e) =>
                      setCustomOptions({ ...customOptions, removeMetadata: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-purple-600 accent-purple-600"
                  />
                  <span className="font-medium text-slate-700">{t('compressor.removeMetadata')}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={customOptions.optimizeStructure}
                    onChange={(e) =>
                      setCustomOptions({ ...customOptions, optimizeStructure: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-purple-600 accent-purple-600"
                  />
                  <span className="font-medium text-slate-700">{t('compressor.optimizeStructure')}</span>
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 sm:p-10 text-center transition-all duration-200 cursor-pointer ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-50/60 ring-4 ring-indigo-500/10'
            : 'border-slate-200/90 hover:border-slate-300 bg-white shadow-xs'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />
        <input
          ref={folderInputRef}
          type="file"
          // @ts-ignore
          webkitdirectory=""
          directory=""
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="p-4 rounded-full bg-indigo-50 text-indigo-600 shadow-2xs">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {t('compressor.dropZone')}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {t('compressor.multiFileHint')}
            </p>
          </div>
          <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 shadow-xs transition-colors"
            >
              {t('action.upload')}
            </button>
            <button
              type="button"
              onClick={() => folderInputRef.current?.click()}
              className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors"
            >
              Select Folder
            </button>
          </div>
        </div>
      </div>

      {/* Batch Stats KPI Bar (When items exist) */}
      {summary.completedFiles > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-2xs font-semibold uppercase text-slate-400 block">{t('compressor.totalSaved')}</span>
            <span className="text-lg sm:text-xl font-bold text-emerald-600 mt-0.5 block">
              {formatBytes(summary.totalSavedBytes)}
            </span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-2xs font-semibold uppercase text-slate-400 block">{t('compressor.avgReduction')}</span>
            <span className="text-lg sm:text-xl font-bold text-indigo-600 mt-0.5 block">
              {summary.averageReductionPercent}%
            </span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-2xs font-semibold uppercase text-slate-400 block">Completed Files</span>
            <span className="text-lg sm:text-xl font-bold text-slate-800 mt-0.5 block">
              {summary.completedFiles} / {summary.totalFiles}
            </span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-2xs font-semibold uppercase text-slate-400 block">Compressed Size</span>
            <span className="text-lg sm:text-xl font-bold text-slate-800 mt-0.5 block">
              {formatBytes(summary.totalCompressedBytes)}
            </span>
          </div>
        </div>
      )}

      {/* Queue Toolbar & Action Controls */}
      {files.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-800">
                Batch Compression Queue ({files.length})
              </span>
              {totalWaiting > 0 && (
                <span className="text-2xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-medium">
                  {totalWaiting} Waiting
                </span>
              )}
              {totalProcessing > 0 && (
                <span className="text-2xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold animate-pulse">
                  {totalProcessing} Active
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleProcessAll}
                disabled={isBatchProcessing || (totalWaiting === 0 && summary.failedFiles === 0)}
                className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                {isBatchProcessing ? t('status.processing') : t('action.processAll')}
              </button>

              {summary.completedFiles > 0 && (
                <button
                  type="button"
                  onClick={handleDownloadAllZip}
                  disabled={isZipping}
                  className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileArchive className="w-3.5 h-3.5" />
                  {isZipping ? 'Zipping...' : t('action.downloadZip')}
                </button>
              )}

              {summary.failedFiles > 0 && (
                <button
                  type="button"
                  onClick={handleRetryFailed}
                  className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-medium hover:bg-amber-100 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {t('action.retryFailed')}
                </button>
              )}

              {summary.completedFiles > 0 && (
                <button
                  type="button"
                  onClick={handleClearCompleted}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 cursor-pointer"
                >
                  {t('action.clearCompleted')}
                </button>
              )}

              <button
                type="button"
                onClick={handleClearAll}
                className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium cursor-pointer"
              >
                {t('action.clearAll')}
              </button>
            </div>
          </div>

          {/* Table of Files */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="p-3 text-start">{t('table.fileName')}</th>
                  <th className="p-3 text-start">{t('table.original')}</th>
                  <th className="p-3 text-start">{t('table.compressed')}</th>
                  <th className="p-3 text-start">{t('table.saved')}</th>
                  <th className="p-3 text-start">{t('table.reduction')}</th>
                  <th className="p-3 text-start">{t('table.status')}</th>
                  <th className="p-3 text-end">{t('table.action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {files.map((item) => {
                  const saved = item.status === 'completed' ? Math.max(0, item.originalSize - item.compressedSize) : 0;
                  const reduction = item.status === 'completed' && item.originalSize > 0
                    ? Math.round((saved / item.originalSize) * 100)
                    : 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3 font-medium text-slate-800 max-w-[200px] sm:max-w-xs truncate">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="truncate">{item.name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-600 font-mono">
                        {formatBytes(item.originalSize)}
                      </td>
                      <td className="p-3 font-mono">
                        {item.status === 'completed' ? (
                          <span className="text-slate-800 font-semibold">{formatBytes(item.compressedSize)}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="p-3 font-mono">
                        {item.status === 'completed' ? (
                          <span className="text-emerald-600 font-medium">{formatBytes(saved)}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        {item.status === 'completed' ? (
                          <span className="inline-flex items-center gap-0.5 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold text-2xs">
                            <ArrowDown className="w-3 h-3" />
                            {reduction}%
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        {item.status === 'processing' && (
                          <div className="space-y-1 w-32">
                            <div className="flex justify-between text-2xs font-medium text-indigo-600">
                              <span>{item.statusText || 'Processing'}</span>
                              <span>{item.progressPercent}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-600 rounded-full transition-all duration-150"
                                style={{ width: `${item.progressPercent}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {item.status === 'waiting' && (
                          <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-2xs font-medium">
                            <Clock className="w-3 h-3" />
                            {t('status.waiting')}
                          </span>
                        )}
                        {item.status === 'completed' && (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-2xs font-medium">
                            <CheckCircle2 className="w-3 h-3" />
                            {t('status.completed')} ({item.pageCount} pgs)
                          </span>
                        )}
                        {item.status === 'failed' && (
                          <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-2xs font-medium" title={item.errorMessage}>
                            <AlertCircle className="w-3 h-3" />
                            {t('status.failed')}
                          </span>
                        )}
                        {item.status === 'cancelled' && (
                          <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-2xs font-medium">
                            <X className="w-3 h-3" />
                            {t('status.cancelled')}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-end space-x-1 whitespace-nowrap">
                        {item.status === 'completed' && (
                          <button
                            type="button"
                            onClick={() => handleDownloadSingle(item)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                            title="Download Compressed PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                        {item.status === 'processing' && (
                          <button
                            type="button"
                            onClick={() => handleCancelFile(item.id)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                            title="Cancel Processing"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        {(item.status === 'failed' || item.status === 'cancelled') && (
                          <button
                            type="button"
                            onClick={() => handleRetryFile(item.id)}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                            title="Retry Compression"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="Remove from queue"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
