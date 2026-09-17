import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  FileCode,
  Layers,
  Trash2,
  RotateCw,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  Download,
  Eye,
  Sliders,
  Sparkles,
  FileCheck,
  RefreshCw,
  Copy,
  FolderArchive,
  FilePlus,
  Grid,
  List,
  ChevronRight,
  Shield,
  FileEdit,
  Scissors,
  Maximize2,
  X,
  PlusCircle,
  Info,
} from 'lucide-react';
import {
  MergeQueueItem,
  MergeConfig,
  MergeProgress,
  MergeResult,
  MergeFileType,
  MergeOutputFormat,
  PageSizePreset,
} from '../../types/bulkMerger';
import {
  detectFileType,
  generateFileMetadata,
  validatePageRange,
  mergeFilesToPdf,
  mergeFilesToDocx,
  mergeFilesToZip,
} from '../../utils/bulkMergerEngine';
import { FilePreviewModal } from './FilePreviewModal';
import { GulfWayLogo } from '../GulfWayLogo';
import { useLanguage } from '../../i18n/LanguageContext';

interface BulkMergerViewProps {
  onShowToast?: (msg: string) => void;
  onNavigateToTab?: (tab: string, fileData?: { file: File; name: string }) => void;
}

export const BulkMergerView: React.FC<BulkMergerViewProps> = ({
  onShowToast,
  onNavigateToTab,
}) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queue state
  const [queue, setQueue] = useState<MergeQueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Active file for Preview Modal
  const [previewItem, setPreviewItem] = useState<MergeQueueItem | null>(null);

  // Settings Panel state
  const [activeSettingsTab, setActiveSettingsTab] = useState<'layout' | 'toc' | 'header' | 'watermark'>('layout');
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);

  // Merge Configuration
  const [config, setConfig] = useState<MergeConfig>({
    outputFormat: 'pdf',
    pageSize: 'a4-portrait',
    marginsMm: 10,
    compressionQuality: 'balanced',
    tableOfContents: {
      enabled: true,
      title: 'Executive Document Summary',
      subtitle: 'GulfWay Enterprise Suite • Consolidated Master Dossier',
      includePageNumbers: true,
      includeFileSizes: true,
    },
    headerFooter: {
      enabled: true,
      headerLeft: 'GulfWay Enterprise Suite',
      headerRight: 'OFFICIAL DOCUMENT',
      showPageNumbers: true,
      pageNumberStyle: 'page-x-of-y',
      pageNumberPosition: 'bottom-center',
      skipFirstPage: true,
      fontSize: 8.5,
      color: '#475569',
    },
    watermark: {
      enabled: false,
      text: 'CONFIDENTIAL',
      opacity: 0.12,
      color: '#475569',
      fontSize: 44,
      rotation: -45,
      allPages: false,
    },
    customOutputName: '',
  });

  // Progress state
  const [progress, setProgress] = useState<MergeProgress>({
    isProcessing: false,
    totalSteps: 0,
    currentStep: 0,
    percent: 0,
    currentFileName: '',
    statusMessage: '',
  });

  // Result state
  const [mergeResult, setMergeResult] = useState<MergeResult | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  // Telemetry
  const totalPagesEstimate = queue.reduce((acc, item) => acc + (item.pageCount || 1), 0);
  const totalRawBytes = queue.reduce((acc, item) => acc + item.size, 0);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  /**
   * Add uploaded files to queue
   */
  const handleAddFiles = async (files: FileList | File[]) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    onShowToast?.(`Adding ${fileList.length} file(s) to merger queue...`);

    const newItems: MergeQueueItem[] = fileList.map((file) => {
      const type = detectFileType(file);
      const ext = file.name.split('.').pop() || '';
      return {
        id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        file,
        name: file.name,
        size: file.size,
        type,
        extension: ext.toLowerCase(),
        thumbnailUrl: '',
        pageCount: 1,
        rotation: 0,
        selected: false,
        pageRange: 'all',
        validPageRange: true,
        status: 'processing',
      };
    });

    setQueue((prev) => [...prev, ...newItems]);

    // Load thumbnails and metadata asynchronously
    for (const item of newItems) {
      try {
        const meta = await generateFileMetadata(item.file, item.type);
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  thumbnailUrl: meta.thumbnailUrl,
                  pageCount: meta.pageCount,
                  dimensions: meta.dimensions,
                  previewText: meta.previewText,
                  tableData: meta.tableData,
                  sheetNames: meta.sheetNames,
                  status: 'ready',
                }
              : q
          )
        );
      } catch (err) {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  status: 'ready',
                }
              : q
          )
        );
      }
    }

    onShowToast?.(`Loaded ${fileList.length} file(s) ready for consolidation.`);
  };

  /**
   * Load rich demo batch with mixed PDF, image, text, and data
   */
  const handleLoadDemoBatch = async () => {
    onShowToast?.('Generating demo mixed batch (PDF, JPG, PNG, DOCX, Data)...');

    // 1. Demo Image 1 (JPG via canvas)
    const c1 = document.createElement('canvas');
    c1.width = 600;
    c1.height = 400;
    const ctx1 = c1.getContext('2d');
    if (ctx1) {
      ctx1.fillStyle = '#1e3a8a';
      ctx1.fillRect(0, 0, 600, 400);
      ctx1.fillStyle = '#ffffff';
      ctx1.font = 'bold 28px sans-serif';
      ctx1.textAlign = 'center';
      ctx1.fillText('GulfWay Executive Summary', 300, 180);
      ctx1.font = '16px sans-serif';
      ctx1.fillStyle = '#93c5fd';
      ctx1.fillText('Operations & Workforce Compliance Report 2026', 300, 220);
    }
    const b1 = await new Promise<Blob>((res) => c1.toBlob((b) => res(b!), 'image/jpeg', 0.9));
    const f1 = new File([b1], '01_Executive_Banner.jpg', { type: 'image/jpeg' });

    // 2. Demo Image 2 (PNG badge via canvas)
    const c2 = document.createElement('canvas');
    c2.width = 500;
    c2.height = 500;
    const ctx2 = c2.getContext('2d');
    if (ctx2) {
      ctx2.fillStyle = '#0f172a';
      ctx2.fillRect(0, 0, 500, 500);
      ctx2.strokeStyle = '#38bdf8';
      ctx2.lineWidth = 6;
      ctx2.strokeRect(20, 20, 460, 460);
      ctx2.fillStyle = '#38bdf8';
      ctx2.font = 'bold 36px sans-serif';
      ctx2.textAlign = 'center';
      ctx2.fillText('GULFWAY®', 250, 230);
      ctx2.fillStyle = '#ffffff';
      ctx2.font = '18px sans-serif';
      ctx2.fillText('ISO 9001 Certified System', 250, 280);
    }
    const b2 = await new Promise<Blob>((res) => c2.toBlob((b) => res(b!), 'image/png'));
    const f2 = new File([b2], '02_Corporate_Badge.png', { type: 'image/png' });

    // 3. Demo Text / Compliance Dossier
    const textContent = `GULFWAY ENTERPRISE SUITE — WORKPLACE AUDIT REPORT
==================================================
Date of Audit: September 2026
Branch: Abu Dhabi Global Market HQ
Department: Wages Protection & Financial Systems (WPS)

1. SYSTEM COMPLIANCE OVERVIEW
- Wages Protection System SIF File Validation: 100% Passed
- Ministry of Human Resources & Emiratisation (MOHRE) Submissions: Active
- Document Retention Compliance: 10-Year Secure Encrypted Archive

2. OPERATIONAL SUMMARY
All active batches have been verified with automated column cross-checks,
checksum reconciliations, and digital stamps.
`;
    const f3 = new File([textContent], '03_Audit_Summary.txt', { type: 'text/plain' });

    // 4. Demo CSV / Sheet Data
    const csvContent = `Employee ID,Full Name,Department,Designation,WPS Salary (AED),Status
GW-101,Ahmad Al-Mansoor,Operations,Director,28500,Paid
GW-102,Fatima Al-Nuaimi,Finance,Senior Accountant,16200,Paid
GW-103,Rajesh Kumar,Logistics,Fleet Supervisor,9400,Paid
GW-104,Sarah Jenkins,Human Resources,HR Manager,18500,Paid
GW-105,Zaid Al-Harbi,Legal,Compliance Officer,21000,Paid
`;
    const f4 = new File([csvContent], '04_Payroll_Roster.csv', { type: 'text/csv' });

    await handleAddFiles([f1, f2, f3, f4]);
  };

  /**
   * Reorder Queue items
   */
  const handleMoveItem = (index: number, direction: 'up' | 'down' | 'top' | 'bottom') => {
    setQueue((prev) => {
      const copy = [...prev];
      if (direction === 'up' && index > 0) {
        const [moved] = copy.splice(index, 1);
        copy.splice(index - 1, 0, moved);
      } else if (direction === 'down' && index < copy.length - 1) {
        const [moved] = copy.splice(index, 1);
        copy.splice(index + 1, 0, moved);
      } else if (direction === 'top') {
        const [moved] = copy.splice(index, 1);
        copy.unshift(moved);
      } else if (direction === 'bottom') {
        const [moved] = copy.splice(index, 1);
        copy.push(moved);
      }
      return copy;
    });
  };

  /**
   * Sort queue by criteria
   */
  const handleSortQueue = (criteria: 'name-asc' | 'name-desc' | 'size-asc' | 'size-desc' | 'type') => {
    setQueue((prev) => {
      const copy = [...prev];
      if (criteria === 'name-asc') {
        copy.sort((a, b) => a.name.localeCompare(b.name));
      } else if (criteria === 'name-desc') {
        copy.sort((a, b) => b.name.localeCompare(a.name));
      } else if (criteria === 'size-asc') {
        copy.sort((a, b) => a.size - b.size);
      } else if (criteria === 'size-desc') {
        copy.sort((a, b) => b.size - a.size);
      } else if (criteria === 'type') {
        const typeOrder: Record<string, number> = { pdf: 1, docx: 2, image: 3, excel: 4, text: 5, unknown: 6 };
        copy.sort((a, b) => (typeOrder[a.type] || 9) - (typeOrder[b.type] || 9));
      }
      return copy;
    });
    onShowToast?.(`Queue sorted by ${criteria}`);
  };

  /**
   * Rotate specific item by 90 degrees
   */
  const handleRotateItem = (id: string, newRotation?: number) => {
    setQueue((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              rotation: newRotation !== undefined ? newRotation : (item.rotation + 90) % 360,
            }
          : item
      )
    );
  };

  /**
   * Update page range for PDF
   */
  const handleUpdatePageRange = (id: string, range: string) => {
    setQueue((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              pageRange: range,
              validPageRange: validatePageRange(range, item.pageCount),
            }
          : item
      )
    );
  };

  /**
   * Remove item from queue
   */
  const handleRemoveItem = (id: string) => {
    setQueue((prev) => prev.filter((i) => i.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  /**
   * Duplicate item in queue
   */
  const handleDuplicateItem = (item: MergeQueueItem) => {
    const copy: MergeQueueItem = {
      ...item,
      id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      name: `Copy_of_${item.name}`,
    };
    setQueue((prev) => [...prev, copy]);
    onShowToast?.(`Duplicated ${item.name}`);
  };

  /**
   * Selection helpers
   */
  const toggleSelectAll = () => {
    if (selectedIds.size === queue.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(queue.map((q) => q.id)));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleRemoveSelected = () => {
    if (selectedIds.size === 0) return;
    setQueue((prev) => prev.filter((q) => !selectedIds.has(q.id)));
    onShowToast?.(`Removed ${selectedIds.size} selected file(s).`);
    setSelectedIds(new Set());
  };

  const handleRotateSelected = () => {
    if (selectedIds.size === 0) return;
    setQueue((prev) =>
      prev.map((q) => (selectedIds.has(q.id) ? { ...q, rotation: (q.rotation + 90) % 360 } : q))
    );
    onShowToast?.(`Rotated ${selectedIds.size} selected item(s).`);
  };

  /**
   * PRIMARY: Run the consolidation engine
   */
  const handleExecuteMerge = async () => {
    if (queue.length === 0) {
      onShowToast?.('Please upload files to merge.');
      return;
    }

    setProgress({
      isProcessing: true,
      totalSteps: queue.length + 2,
      currentStep: 0,
      percent: 5,
      currentFileName: 'Initializing',
      statusMessage: 'Preparing consolidation pipeline...',
    });

    try {
      let result: MergeResult;

      if (config.outputFormat === 'docx') {
        result = await mergeFilesToDocx(queue, config, (p) => setProgress(p));
      } else if (config.outputFormat === 'zip') {
        result = await mergeFilesToZip(queue, config, (p) => setProgress(p));
      } else {
        result = await mergeFilesToPdf(queue, config, (p) => setProgress(p));
      }

      setMergeResult(result);
      setIsResultModalOpen(true);
      onShowToast?.(`Consolidation complete! Generated ${result.filename} (${formatBytes(result.fileSize)})`);
    } catch (err: any) {
      console.error('Merge error:', err);
      onShowToast?.(`Merge failed: ${err.message || 'Unknown error'}`);
    } finally {
      setProgress((prev) => ({ ...prev, isProcessing: false }));
    }
  };

  /**
   * Cross-module routing: Send generated PDF to PDF Editor
   */
  const handleSendToPdfEditor = () => {
    if (!mergeResult) return;
    if (onNavigateToTab) {
      const file = new File([mergeResult.blob], mergeResult.filename, { type: 'application/pdf' });
      onNavigateToTab('pdf-editor', { file, name: mergeResult.filename });
    } else {
      window.location.hash = '#pdf-editor';
    }
  };

  /**
   * Cross-module routing: Send generated PDF to PDF Compressor
   */
  const handleSendToPdfCompressor = () => {
    if (!mergeResult) return;
    if (onNavigateToTab) {
      const file = new File([mergeResult.blob], mergeResult.filename, { type: 'application/pdf' });
      onNavigateToTab('pdf-compressor', { file, name: mergeResult.filename });
    } else {
      window.location.hash = '#pdf-compressor';
    }
  };

  return (
    <div id="bulk-merger-view" className="flex-1 flex flex-col bg-slate-50 min-h-0 overflow-y-auto">
      {/* Hidden File Picker Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.webp,.bmp,.svg,.docx,.doc,.xlsx,.xls,.csv,.txt,.md"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleAddFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {/* Module Banner & Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-20 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shadow-2xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  Bulk Files Upload &amp; Merger
                </h1>
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 rounded">
                  v3.2 PRO
                </span>
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded">
                  MULTI-FORMAT
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Consolidate PDFs, Images, Word (.docx), Excel spreadsheets &amp; Text into a single Master Document.
              </p>
            </div>
          </div>

          {/* Header Quick Telemetry & Actions */}
          <div className="flex items-center gap-2">
            {queue.length > 0 && (
              <div className="hidden md:flex items-center gap-2 text-2xs font-mono bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg text-slate-600">
                <span>
                  <strong>{queue.length}</strong> file(s)
                </span>
                <span>•</span>
                <span>~{totalPagesEstimate} pages</span>
                <span>•</span>
                <span>{formatBytes(totalRawBytes)}</span>
              </div>
            )}

            <button
              type="button"
              id="bulk-merger-add-files-btn"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
            >
              <FilePlus className="w-3.5 h-3.5 text-blue-600" />
              <span>Add Files</span>
            </button>

            {queue.length === 0 && (
              <button
                type="button"
                id="bulk-merger-demo-batch-btn"
                onClick={handleLoadDemoBatch}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Load Demo Batch</span>
              </button>
            )}

            <button
              type="button"
              id="bulk-merger-execute-btn"
              disabled={queue.length === 0 || progress.isProcessing}
              onClick={handleExecuteMerge}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer ${
                queue.length === 0 || progress.isProcessing
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-98'
              }`}
            >
              {progress.isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Merging ({progress.percent}%)...</span>
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4" />
                  <span>Merge All ({queue.length})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Real-time Progress Bar */}
        {progress.isProcessing && (
          <div className="mt-3 pt-3 border-t border-slate-100 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-2xs mb-1">
              <span className="font-semibold text-blue-700 flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3 animate-spin" />
                {progress.statusMessage}
              </span>
              <span className="font-mono font-bold text-slate-600">{progress.percent}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-200"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        )}
      </header>

      {/* Main Container Layout */}
      <div className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Drag & Drop Upload Zone (Expansive if queue is empty, compact if queue has items) */}
        <div
          id="bulk-merger-dropzone"
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files) handleAddFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
            isDragging
              ? 'border-blue-500 bg-blue-50/60 scale-[1.005]'
              : 'border-slate-300 hover:border-blue-400 bg-white hover:bg-slate-50/70'
          } ${queue.length === 0 ? 'py-14 px-6 shadow-xs' : 'py-5 px-4 shadow-2xs'}`}
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-2.5">
            <UploadCloud className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-bold text-slate-800">
            {queue.length === 0 ? 'Drop your bulk files here or click to browse' : 'Drop more files to append to queue'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-lg">
            Supports <strong className="text-slate-700">PDF documents</strong>,{' '}
            <strong className="text-slate-700">Images (JPG, PNG, WebP)</strong>,{' '}
            <strong className="text-slate-700">Word (.docx)</strong>,{' '}
            <strong className="text-slate-700">Excel / CSV (.xlsx)</strong> &amp;{' '}
            <strong className="text-slate-700">Text files</strong>.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3">
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
              PDF
            </span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              JPG / PNG
            </span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              DOCX
            </span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              XLSX / CSV
            </span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              TXT
            </span>
          </div>
        </div>

        {/* When Queue has items: Queue Management Toolbar + Settings Panel */}
        {queue.length > 0 && (
          <div className="space-y-4">
            {/* Batch Controls & Filter Toolbar */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="bulk-merger-select-all-btn"
                  onClick={toggleSelectAll}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors"
                >
                  {selectedIds.size === queue.length ? 'Deselect All' : `Select All (${queue.length})`}
                </button>

                {selectedIds.size > 0 && (
                  <>
                    <button
                      type="button"
                      id="bulk-merger-delete-selected-btn"
                      onClick={handleRemoveSelected}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Selected ({selectedIds.size})</span>
                    </button>
                    <button
                      type="button"
                      id="bulk-merger-rotate-selected-btn"
                      onClick={handleRotateSelected}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Rotate Selected (+90°)</span>
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Sort Dropdown */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium hidden sm:inline">Sort:</span>
                  <select
                    id="bulk-merger-sort-select"
                    onChange={(e) => handleSortQueue(e.target.value as any)}
                    defaultValue="default"
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-hidden font-medium cursor-pointer"
                  >
                    <option value="default" disabled>
                      Choose order...
                    </option>
                    <option value="name-asc">Name (A → Z)</option>
                    <option value="name-desc">Name (Z → A)</option>
                    <option value="size-asc">Size (Smallest first)</option>
                    <option value="size-desc">Size (Largest first)</option>
                    <option value="type">Type (PDFs first)</option>
                  </select>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                      viewMode === 'grid' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="Grid Card View"
                  >
                    <Grid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                      viewMode === 'list' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="Dense List View"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Clear All Queue */}
                <button
                  type="button"
                  id="bulk-merger-clear-all-btn"
                  onClick={() => {
                    if (window.confirm('Clear all files from the merge queue?')) {
                      setQueue([]);
                      setSelectedIds(new Set());
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 cursor-pointer transition-colors"
                  title="Clear entire queue"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Queue Items Render: Grid vs List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {queue.map((item, index) => {
                  const isSelected = selectedIds.has(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`bg-white rounded-xl border transition-all flex flex-col overflow-hidden group ${
                        isSelected
                          ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      {/* Card Header with Order Badge & Quick Actions */}
                      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-slate-50/60">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectItem(item.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-2xs font-mono font-bold flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                            {item.type}
                          </span>
                        </div>

                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleMoveItem(index, 'up')}
                            disabled={index === 0}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer transition-colors"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveItem(index, 'down')}
                            disabled={index === queue.length - 1}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer transition-colors"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1 rounded text-slate-400 hover:text-red-600 cursor-pointer transition-colors"
                            title="Remove"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Card Thumbnail Preview */}
                      <div
                        onClick={() => setPreviewItem(item)}
                        className="relative bg-slate-100/60 h-36 flex items-center justify-center p-3 cursor-pointer overflow-hidden group/img"
                      >
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt={item.name}
                            className="max-h-full max-w-full object-contain rounded shadow-2xs transition-transform duration-200 group-hover/img:scale-102"
                            style={{ transform: `rotate(${item.rotation}deg)` }}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-400">
                            <FileText className="w-8 h-8 opacity-40 mb-1" />
                            <span className="text-2xs">Processing...</span>
                          </div>
                        )}

                        {/* Hover Overlay Icon */}
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white transition-opacity">
                          <Eye className="w-6 h-6" />
                        </div>

                        {/* Rotation pill if rotated */}
                        {item.rotation !== 0 && (
                          <span className="absolute bottom-2 right-2 text-2xs font-mono font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded shadow-xs">
                            {item.rotation}°
                          </span>
                        )}
                      </div>

                      {/* Card Info & Controls */}
                      <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-800 truncate" title={item.name}>
                            {item.name}
                          </p>
                          <div className="flex items-center justify-between text-2xs text-slate-500 font-mono mt-0.5">
                            <span>{formatBytes(item.size)}</span>
                            <span>{item.pageCount} page(s)</span>
                          </div>
                        </div>

                        {/* PDF Page Range (Inline) */}
                        {item.type === 'pdf' && (
                          <div className="pt-1">
                            <div className="flex items-center justify-between text-2xs text-slate-500 mb-1">
                              <span className="font-semibold text-slate-600">Pages:</span>
                              <span className="font-mono">{item.pageRange}</span>
                            </div>
                            <input
                              type="text"
                              value={item.pageRange}
                              onChange={(e) => handleUpdatePageRange(item.id, e.target.value)}
                              placeholder="all or 1-3, 5"
                              className={`w-full px-2 py-1 text-2xs font-mono rounded border bg-slate-50 focus:bg-white focus:outline-hidden transition-all ${
                                item.validPageRange ? 'border-slate-200 focus:border-blue-400' : 'border-red-300 bg-red-50/40'
                              }`}
                            />
                          </div>
                        )}

                        {/* Bottom Actions */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-2xs">
                          <button
                            type="button"
                            onClick={() => handleRotateItem(item.id)}
                            className="text-slate-600 hover:text-blue-700 flex items-center gap-1 font-semibold cursor-pointer"
                          >
                            <RotateCw className="w-3 h-3 text-blue-600" />
                            <span>Rotate</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDuplicateItem(item)}
                            className="text-slate-500 hover:text-slate-800 cursor-pointer"
                          >
                            Duplicate
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Dense List View */
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-2xs uppercase text-slate-500 font-mono">
                    <tr>
                      <th className="p-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === queue.length}
                          onChange={toggleSelectAll}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </th>
                      <th className="p-3 w-12 text-center">#</th>
                      <th className="p-3 w-14 text-center">Preview</th>
                      <th className="p-3">File Name</th>
                      <th className="p-3 w-24">Type</th>
                      <th className="p-3 w-24">Size</th>
                      <th className="p-3 w-24">Pages</th>
                      <th className="p-3 w-36">Page Range</th>
                      <th className="p-3 w-28 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {queue.map((item, index) => {
                      const isSelected = selectedIds.has(item.id);
                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-blue-50/30' : ''}`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectItem(item.id)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-slate-400">
                            {index + 1}
                          </td>
                          <td className="p-2 text-center">
                            <div
                              onClick={() => setPreviewItem(item)}
                              className="w-10 h-10 rounded bg-slate-100 border border-slate-200 mx-auto flex items-center justify-center cursor-pointer overflow-hidden"
                            >
                              {item.thumbnailUrl ? (
                                <img
                                  src={item.thumbnailUrl}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                  style={{ transform: `rotate(${item.rotation}deg)` }}
                                />
                              ) : (
                                <FileText className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                          </td>
                          <td className="p-3 font-semibold text-slate-800 max-w-[200px] truncate" title={item.name}>
                            {item.name}
                          </td>
                          <td className="p-3">
                            <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                              {item.type}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-slate-500">
                            {formatBytes(item.size)}
                          </td>
                          <td className="p-3 font-mono text-slate-600">
                            {item.pageCount}
                          </td>
                          <td className="p-3">
                            {item.type === 'pdf' ? (
                              <input
                                type="text"
                                value={item.pageRange}
                                onChange={(e) => handleUpdatePageRange(item.id, e.target.value)}
                                className={`w-28 px-2 py-0.5 text-2xs font-mono rounded border bg-slate-50 ${
                                  item.validPageRange ? 'border-slate-200' : 'border-red-300 bg-red-50/40'
                                }`}
                              />
                            ) : (
                              <span className="text-slate-400 text-2xs">—</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleRotateItem(item.id)}
                                className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                                title="Rotate"
                              >
                                <RotateCw className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveItem(index, 'up')}
                                disabled={index === 0}
                                className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                                title="Move Up"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveItem(index, 'down')}
                                disabled={index === queue.length - 1}
                                className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                                title="Move Down"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.id)}
                                className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                title="Delete"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Consolidation Settings Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Settings Tab Navigation */}
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-3 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Consolidation &amp; Document Formatting
              </h3>
            </div>

            {/* Target Output Format Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/80 text-xs">
              <button
                type="button"
                onClick={() => setConfig((prev) => ({ ...prev, outputFormat: 'pdf' }))}
                className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  config.outputFormat === 'pdf'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Merged PDF
              </button>
              <button
                type="button"
                onClick={() => setConfig((prev) => ({ ...prev, outputFormat: 'docx' }))}
                className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  config.outputFormat === 'docx'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Word (.docx)
              </button>
              <button
                type="button"
                onClick={() => setConfig((prev) => ({ ...prev, outputFormat: 'zip' }))}
                className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  config.outputFormat === 'zip'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ZIP Archive
              </button>
            </div>
          </div>

          {/* Sub-tab Navigation */}
          <div className="flex border-b border-slate-100 px-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveSettingsTab('layout')}
              className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
                activeSettingsTab === 'layout'
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Page Layout &amp; Margins
            </button>
            <button
              type="button"
              onClick={() => setActiveSettingsTab('toc')}
              className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
                activeSettingsTab === 'toc'
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Table of Contents
            </button>
            <button
              type="button"
              onClick={() => setActiveSettingsTab('header')}
              className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
                activeSettingsTab === 'header'
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Headers &amp; Page Numbers
            </button>
            <button
              type="button"
              onClick={() => setActiveSettingsTab('watermark')}
              className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
                activeSettingsTab === 'watermark'
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Security Watermark
            </button>
          </div>

          {/* Settings Tab Content */}
          <div className="p-6">
            {activeSettingsTab === 'layout' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Page Size Preset</label>
                  <select
                    value={config.pageSize}
                    onChange={(e) => setConfig((p) => ({ ...p, pageSize: e.target.value as PageSizePreset }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-medium focus:outline-hidden"
                  >
                    <option value="a4-portrait">Standard A4 Portrait (210 × 297 mm)</option>
                    <option value="a4-landscape">Standard A4 Landscape (297 × 210 mm)</option>
                    <option value="letter">US Letter (8.5 × 11 in)</option>
                    <option value="auto">Auto (Preserve source dimensions)</option>
                  </select>
                  <p className="text-2xs text-slate-400 mt-1">
                    Standardizes image and document page sizes into consistent print sheets.
                  </p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Page Margins</label>
                  <select
                    value={config.marginsMm}
                    onChange={(e) => setConfig((p) => ({ ...p, marginsMm: Number(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-medium focus:outline-hidden"
                  >
                    <option value={0}>None / Edge-to-Edge (0 mm)</option>
                    <option value={10}>Standard (10 mm)</option>
                    <option value={15}>Document Normal (15 mm)</option>
                    <option value={20}>Wide Binder Margins (20 mm)</option>
                  </select>
                  <p className="text-2xs text-slate-400 mt-1">
                    Controls breathing space around embedded images and content.
                  </p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Compression Quality</label>
                  <select
                    value={config.compressionQuality}
                    onChange={(e) => setConfig((p) => ({ ...p, compressionQuality: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-medium focus:outline-hidden"
                  >
                    <option value="lossless">High Quality (Lossless Streams)</option>
                    <option value="balanced">Balanced (Web &amp; Print)</option>
                    <option value="compact">Compact / Small Size (Email Uploads)</option>
                  </select>
                  <p className="text-2xs text-slate-400 mt-1">
                    Optimizes embedded images and PDF streams for fast distribution.
                  </p>
                </div>
              </div>
            )}

            {activeSettingsTab === 'toc' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <span className="font-bold text-slate-800">Generate Executive Cover &amp; Table of Contents</span>
                    <p className="text-2xs text-slate-500">
                      Prepends a formal index sheet listing all included documents with their starting page numbers.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.tableOfContents.enabled}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        tableOfContents: { ...p.tableOfContents, enabled: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                {config.tableOfContents.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Index Header Title</label>
                      <input
                        type="text"
                        value={config.tableOfContents.title}
                        onChange={(e) =>
                          setConfig((p) => ({
                            ...p,
                            tableOfContents: { ...p.tableOfContents, title: e.target.value },
                          }))
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-medium focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Subtitle / Dossier Label</label>
                      <input
                        type="text"
                        value={config.tableOfContents.subtitle}
                        onChange={(e) =>
                          setConfig((p) => ({
                            ...p,
                            tableOfContents: { ...p.tableOfContents, subtitle: e.target.value },
                          }))
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-medium focus:outline-hidden"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeSettingsTab === 'header' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <span className="font-bold text-slate-800">Enable Running Header &amp; Footer</span>
                    <p className="text-2xs text-slate-500">
                      Renders continuous corporate headers, divider lines, and page numbers across all sheets.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.headerFooter.enabled}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        headerFooter: { ...p.headerFooter, enabled: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                {config.headerFooter.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Header Left Label</label>
                      <input
                        type="text"
                        value={config.headerFooter.headerLeft}
                        onChange={(e) =>
                          setConfig((p) => ({
                            ...p,
                            headerFooter: { ...p.headerFooter, headerLeft: e.target.value },
                          }))
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Header Right Reference</label>
                      <input
                        type="text"
                        value={config.headerFooter.headerRight}
                        onChange={(e) =>
                          setConfig((p) => ({
                            ...p,
                            headerFooter: { ...p.headerFooter, headerRight: e.target.value },
                          }))
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Page Number Style</label>
                      <select
                        value={config.headerFooter.pageNumberStyle}
                        onChange={(e) =>
                          setConfig((p) => ({
                            ...p,
                            headerFooter: { ...p.headerFooter, pageNumberStyle: e.target.value as any },
                          }))
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs"
                      >
                        <option value="page-x-of-y">Page X of Y</option>
                        <option value="x-of-y">X / Y</option>
                        <option value="page-x">Page X</option>
                        <option value="numbers-only">Numbers Only (1, 2...)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeSettingsTab === 'watermark' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <span className="font-bold text-slate-800">Security &amp; Confidentiality Watermark</span>
                    <p className="text-2xs text-slate-500">
                      Imprints a semi-transparent diagonal watermark across the merged document.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.watermark.enabled}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        watermark: { ...p.watermark, enabled: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                {config.watermark.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Watermark Text</label>
                      <input
                        type="text"
                        value={config.watermark.text}
                        onChange={(e) =>
                          setConfig((p) => ({
                            ...p,
                            watermark: { ...p.watermark, text: e.target.value },
                          }))
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Opacity ({Math.round(config.watermark.opacity * 100)}%)
                      </label>
                      <input
                        type="range"
                        min="0.05"
                        max="0.4"
                        step="0.01"
                        value={config.watermark.opacity}
                        onChange={(e) =>
                          setConfig((p) => ({
                            ...p,
                            watermark: { ...p.watermark, opacity: Number(e.target.value) },
                          }))
                        }
                        className="w-full mt-2 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Angle / Rotation</label>
                      <select
                        value={config.watermark.rotation}
                        onChange={(e) =>
                          setConfig((p) => ({
                            ...p,
                            watermark: { ...p.watermark, rotation: Number(e.target.value) },
                          }))
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs"
                      >
                        <option value={-45}>-45° (Diagonal Left-to-Right)</option>
                        <option value={45}>45° (Diagonal Right-to-Left)</option>
                        <option value={0}>0° (Horizontal Center)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* File Preview Modal */}
      {previewItem && (
        <FilePreviewModal
          item={previewItem}
          isOpen={!!previewItem}
          onClose={() => setPreviewItem(null)}
          onUpdateRotation={handleRotateItem}
          onUpdatePageRange={handleUpdatePageRange}
          onRemoveItem={handleRemoveItem}
        />
      )}

      {/* Final Merge Result Modal */}
      {isResultModalOpen && mergeResult && (
        <div
          id="merge-result-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsResultModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Consolidation Complete
                  </h3>
                  <p className="text-xs text-slate-500">
                    Master document ready for download or further editing.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsResultModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Telemetry Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
                  <span className="text-2xs text-slate-500 uppercase font-mono block">Format</span>
                  <span className="text-base font-bold text-slate-800 uppercase">{mergeResult.format}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
                  <span className="text-2xs text-slate-500 uppercase font-mono block">Total Pages</span>
                  <span className="text-base font-bold text-blue-600">{mergeResult.totalPages}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
                  <span className="text-2xs text-slate-500 uppercase font-mono block">File Size</span>
                  <span className="text-base font-bold text-slate-800">{formatBytes(mergeResult.fileSize)}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
                  <span className="text-2xs text-slate-500 uppercase font-mono block">Source Files</span>
                  <span className="text-base font-bold text-emerald-600">{mergeResult.totalSourceFiles}</span>
                </div>
              </div>

              {/* Embedded Document Preview */}
              {mergeResult.format === 'pdf' && (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100 h-[380px]">
                  <iframe
                    src={`${mergeResult.downloadUrl}#toolbar=0&navpanes=0`}
                    title="Merged PDF Preview"
                    className="w-full h-full border-0"
                  />
                </div>
              )}

              {/* Cross-Module Handoff Actions */}
              {mergeResult.format === 'pdf' && (
                <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Advanced Post-Processing</h4>
                      <p className="text-2xs text-slate-500">
                        Continue directly into PDF Editor to sign/stamp, or PDF Compressor to reduce size.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id="result-send-to-editor-btn"
                      onClick={handleSendToPdfEditor}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                      <span>Open in PDF Editor</span>
                    </button>
                    <button
                      type="button"
                      id="result-send-to-compressor-btn"
                      onClick={handleSendToPdfCompressor}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                    >
                      <Scissors className="w-3.5 h-3.5" />
                      <span>Compress File</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
              <span className="text-xs font-mono text-slate-500">
                Filename: <strong>{mergeResult.filename}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsResultModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 cursor-pointer"
                >
                  Close
                </button>
                <a
                  href={mergeResult.downloadUrl}
                  download={mergeResult.filename}
                  id="bulk-merger-download-result-btn"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download File ({formatBytes(mergeResult.fileSize)})</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
