import React, { useState, useEffect, useRef } from 'react';
import {
  Type,
  Link as LinkIcon,
  CheckSquare,
  Image as ImageIcon,
  PenTool,
  Eraser,
  Square,
  Circle,
  Highlighter,
  SlidersHorizontal,
  RotateCw,
  RotateCcw,
  Trash2,
  Copy,
  Plus,
  ZoomIn,
  ZoomOut,
  Undo2,
  Redo2,
  Download,
  FileText,
  Upload,
  Layers,
  CheckCircle2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Stamp,
  Move,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  X
} from 'lucide-react';
import {
  PdfPageModel,
  AnyAnnotation,
  TextAnnotation,
  WhiteoutAnnotation,
  ShapeAnnotation,
  ImageAnnotation,
  SignatureAnnotation,
  PdfHeaderFooterConfig,
  PdfWatermarkConfig,
  PdfMetadataConfig,
  PdfEditorTool,
  ShapeType
} from '../../types/pdfEditor';
import {
  loadPdfDocument,
  renderPdfPageToCanvas,
  createSampleBusinessPdf,
  compileAndSaveModifiedPdf
} from '../../utils/pdfEditorEngine';
import { SignatureModal } from './SignatureModal';
import { WatermarkBatesModal } from './WatermarkBatesModal';
import { GulfWayLogo } from '../GulfWayLogo';

export const PdfEditorView: React.FC = () => {
  // Document State
  const [pdfDocProxy, setPdfDocProxy] = useState<any>(null);
  const [originalBytes, setOriginalBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState<string>('Document.pdf');
  const [pages, setPages] = useState<PdfPageModel[]>([]);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Tools & Settings
  const [activeTool, setActiveTool] = useState<PdfEditorTool>('select');
  const [zoom, setZoom] = useState<number>(1.0);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(true);

  // Annotations
  const [annotations, setAnnotations] = useState<AnyAnnotation[]>([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);

  // Active Tool Options
  const [textColor, setTextColor] = useState<string>('#0f172a');
  const [textSize, setTextSize] = useState<number>(14);
  const [textFont, setTextFont] = useState<'Helvetica' | 'Times-Roman' | 'Courier'>('Helvetica');
  const [textBold, setTextBold] = useState<boolean>(false);
  const [textItalic, setTextItalic] = useState<boolean>(false);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');

  // Shapes & Whiteout Options
  const [activeShape, setActiveShape] = useState<ShapeType>('rectangle');
  const [shapeStrokeColor, setShapeStrokeColor] = useState<string>('#2563eb');
  const [shapeFillColor, setShapeFillColor] = useState<string>('transparent');
  const [shapeStrokeWidth, setShapeStrokeWidth] = useState<number>(2);
  const [whiteoutColor, setWhiteoutColor] = useState<string>('#ffffff'); // white or black

  // Header, Footer & Watermark
  const [headerFooter, setHeaderFooter] = useState<PdfHeaderFooterConfig>({
    enabled: false,
    headerLeft: 'Gulf Way Group',
    headerCenter: '',
    headerRight: 'CONFIDENTIAL',
    footerLeft: '',
    footerCenter: 'Page {page} of {total}',
    footerRight: '',
    fontSize: 9,
    color: '#475569',
    startPage: 1,
  });

  const [watermark, setWatermark] = useState<PdfWatermarkConfig>({
    enabled: false,
    type: 'text',
    text: 'GULF WAY GROUP',
    opacity: 0.15,
    rotationAngle: -45,
    fontSize: 42,
    color: '#4f8ec2',
    allPages: true,
  });

  const [metadata, setMetadata] = useState<PdfMetadataConfig>({
    title: 'Gulf Way Document',
    author: 'Gulf Way Group',
    subject: 'WPS & Operations',
    keywords: 'Gulf Way, WPS, PDF',
    creator: 'Gulf Way Sejda Editor',
  });

  // Modals
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState<boolean>(false);
  const [isWatermarkModalOpen, setIsWatermarkModalOpen] = useState<boolean>(false);

  // History Stack for Undo / Redo
  const [history, setHistory] = useState<AnyAnnotation[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Canvas Refs for pages
  const pageCanvasRefs = useRef<{ [key: number]: HTMLCanvasElement | null }>({});

  // Push to history
  const pushToHistory = (newAnnotations: AnyAnnotation[]) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newAnnotations);
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setAnnotations(prev);
      setHistoryIndex(historyIndex - 1);
      setSelectedAnnotationId(null);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setAnnotations(next);
      setHistoryIndex(historyIndex + 1);
      setSelectedAnnotationId(null);
    }
  };

  // Load sample business PDF initially if empty
  const handleLoadSample = async () => {
    setIsLoading(true);
    try {
      const { arrayBuffer, fileName: sampleName } = await createSampleBusinessPdf();
      setFileName(sampleName);
      // Keep untouched cloned copy of bytes for pdf-lib export
      setOriginalBytes(new Uint8Array(arrayBuffer.slice(0)));
      const { pages: loadedPages, pdfDocProxy: proxy } = await loadPdfDocument(arrayBuffer.slice(0));
      setPdfDocProxy(proxy);
      setPages(loadedPages);
      setActivePageIndex(0);
      setAnnotations([]);
      setHistory([[]]);
      setHistoryIndex(0);
    } catch (err) {
      console.error('Failed to load sample business PDF:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Upload user PDF file
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      setFileName(file.name);
      // Keep untouched cloned copy of bytes for pdf-lib export
      setOriginalBytes(new Uint8Array(arrayBuffer.slice(0)));
      const { pages: loadedPages, pdfDocProxy: proxy } = await loadPdfDocument(arrayBuffer.slice(0));
      setPdfDocProxy(proxy);
      setPages(loadedPages);
      setActivePageIndex(0);
      setAnnotations([]);
      setHistory([[]]);
      setHistoryIndex(0);
    } catch (err) {
      console.error('Error loading uploaded PDF:', err);
      alert('Failed to parse PDF document. Please ensure it is a valid, unencrypted PDF.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render pages when pages, proxy, or zoom changes
  useEffect(() => {
    if (!pdfDocProxy || pages.length === 0) return;

    pages.forEach((pageModel) => {
      if (pageModel.isDeleted) return;
      const canvas = pageCanvasRefs.current[pageModel.pageIndex];
      if (!canvas) return;

      if (pageModel.isBlankInserted) {
        // Clear canvas with white for blank inserted page
        canvas.width = (pageModel.width || 595.28) * zoom;
        canvas.height = (pageModel.height || 841.89) * zoom;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        return;
      }

      const sourceNum = (pageModel.originalPageIndex !== undefined ? pageModel.originalPageIndex : pageModel.pageIndex) + 1;
      if (sourceNum <= pdfDocProxy.numPages) {
        renderPdfPageToCanvas(pdfDocProxy, sourceNum, zoom, canvas);
      }
    });
  }, [pdfDocProxy, pages, zoom]);

  // Page interaction: Click to insert or drag to draw
  const handlePageStageClick = (
    e: React.MouseEvent<HTMLDivElement>,
    pageIndex: number,
    pageModel: PdfPageModel
  ) => {
    // If click is on existing annotation, select handled separately
    if ((e.target as HTMLElement).closest('.annotation-element')) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / zoom;
    const clickY = (e.clientY - rect.top) / zoom;

    if (activeTool === 'text') {
      const newText: TextAnnotation = {
        id: `text-${Date.now()}`,
        type: 'text',
        pageIndex,
        x: Math.max(10, clickX),
        y: Math.max(10, clickY),
        width: 180,
        height: textSize * 2.2,
        text: 'Type text here...',
        fontSize: textSize,
        fontFamily: textFont,
        color: textColor,
        bold: textBold,
        italic: textItalic,
        align: textAlign,
        backgroundColor: 'transparent',
      };
      const updated = [...annotations, newText];
      setAnnotations(updated);
      pushToHistory(updated);
      setSelectedAnnotationId(newText.id);
      setActiveTool('select');
    } else if (activeTool === 'whiteout') {
      const newWhiteout: WhiteoutAnnotation = {
        id: `whiteout-${Date.now()}`,
        type: 'whiteout',
        pageIndex,
        x: Math.max(10, clickX - 60),
        y: Math.max(10, clickY - 15),
        width: 120,
        height: 30,
        fillColor: whiteoutColor,
      };
      const updated = [...annotations, newWhiteout];
      setAnnotations(updated);
      pushToHistory(updated);
      setSelectedAnnotationId(newWhiteout.id);
      setActiveTool('select');
    } else if (activeTool === 'shape') {
      const newShape: ShapeAnnotation = {
        id: `shape-${Date.now()}`,
        type: 'shape',
        pageIndex,
        x: Math.max(10, clickX - 75),
        y: Math.max(10, clickY - 40),
        width: 150,
        height: 80,
        shapeType: activeShape,
        strokeColor: shapeStrokeColor,
        fillColor: shapeFillColor,
        strokeWidth: shapeStrokeWidth,
        opacity: activeShape === 'highlight' ? 0.35 : 1,
      };
      const updated = [...annotations, newShape];
      setAnnotations(updated);
      pushToHistory(updated);
      setSelectedAnnotationId(newShape.id);
      setActiveTool('select');
    } else if (activeTool === 'select') {
      setSelectedAnnotationId(null);
    }
  };

  // Applying signature from modal
  const handleApplySignature = (dataUrl: string, name?: string) => {
    const activePage = pages[activePageIndex] || pages[0];
    if (!activePage) return;

    const newSig: SignatureAnnotation = {
      id: `sig-${Date.now()}`,
      type: 'signature',
      pageIndex: activePage.pageIndex,
      x: (activePage.width || 595) / 2 - 90,
      y: (activePage.height || 842) / 2 - 35,
      width: 180,
      height: 70,
      dataUrl,
      signerName: name,
    };

    const updated = [...annotations, newSig];
    setAnnotations(updated);
    pushToHistory(updated);
    setSelectedAnnotationId(newSig.id);
    setActiveTool('select');
  };

  // Page Operations
  const handleRotatePage = (pageIndex: number, delta: number) => {
    const updated = pages.map((p) => {
      if (p.pageIndex === pageIndex) {
        const newRot = ((p.rotation + delta + 360) % 360) as 0 | 90 | 180 | 270;
        return { ...p, rotation: newRot };
      }
      return p;
    });
    setPages(updated);
  };

  const handleDeletePage = (pageIndex: number) => {
    if (pages.filter((p) => !p.isDeleted).length <= 1) {
      alert('Cannot delete the only remaining page in document.');
      return;
    }
    const updated = pages.map((p) => {
      if (p.pageIndex === pageIndex) return { ...p, isDeleted: true };
      return p;
    });
    setPages(updated);
  };

  const handleDuplicatePage = (pageIndex: number) => {
    const pageToDup = pages.find((p) => p.pageIndex === pageIndex);
    if (!pageToDup) return;

    const newPage: PdfPageModel = {
      ...pageToDup,
      id: `page-dup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      pageIndex: pages.length,
      originalPageIndex: pageToDup.originalPageIndex !== undefined ? pageToDup.originalPageIndex : pageToDup.pageIndex,
      displayNumber: pages.length + 1,
    };
    setPages([...pages, newPage]);
  };

  const handleAddBlankPage = () => {
    const newPage: PdfPageModel = {
      id: `page-blank-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      pageIndex: pages.length,
      originalPageIndex: undefined,
      displayNumber: pages.length + 1,
      rotation: 0,
      width: 595.28,
      height: 841.89,
      aspectRatio: 595.28 / 841.89,
      isDeleted: false,
      isBlankInserted: true,
    };
    setPages([...pages, newPage]);
    setActivePageIndex(pages.length);
  };

  // Export modified PDF
  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      const blob = await compileAndSaveModifiedPdf({
        originalBytes,
        pages,
        annotations,
        headerFooter,
        watermark,
        metadata,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanName = fileName.replace(/\.pdf$/i, '');
      a.download = `${cleanName}_GulfWay_Edited.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export edited PDF:', err);
      alert('An error occurred during PDF generation. Please check console.');
    } finally {
      setIsExporting(false);
    }
  };

  // Delete selected annotation
  const handleDeleteSelectedAnnotation = () => {
    if (!selectedAnnotationId) return;
    const updated = annotations.filter((a) => a.id !== selectedAnnotationId);
    setAnnotations(updated);
    pushToHistory(updated);
    setSelectedAnnotationId(null);
  };

  // Active selected annotation object
  const selectedAnnotation = annotations.find((a) => a.id === selectedAnnotationId);

  return (
    <div id="sejda-pdf-editor-module" className="flex-1 flex flex-col min-w-0 bg-[#0f172a] text-slate-100 min-h-[calc(100vh-4rem)]">
      {/* 1. SEJDA-STYLE PRIMARY TOP TOOLBAR */}
      <div className="bg-[#1e293b] border-b border-slate-700/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md shrink-0 z-30">
        {/* Left Brand & File info */}
        <div className="flex items-center gap-2.5">
          <div className="p-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xs flex items-center justify-center shrink-0">
            <GulfWayLogo className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white tracking-tight flex items-center gap-1.5">
                PDF Editor
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase">
                Sejda Pro
              </span>
            </div>
            <span className="text-xs text-slate-400 font-mono truncate max-w-[200px] block">
              {fileName}
            </span>
          </div>
        </div>

        {/* Central Sejda Floating Toolset */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-700/80 shadow-inner gap-1 overflow-x-auto max-w-full">
          {/* Select Tool */}
          <button
            type="button"
            onClick={() => setActiveTool('select')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTool === 'select'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Select & Move Tool"
          >
            <Move className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Select</span>
          </button>

          {/* Text Tool */}
          <button
            type="button"
            onClick={() => setActiveTool('text')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTool === 'text'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Add text to document"
          >
            <Type className="w-3.5 h-3.5" />
            <span>Text</span>
          </button>

          {/* Sign Tool */}
          <button
            type="button"
            onClick={() => setIsSignatureModalOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 text-slate-300 hover:bg-slate-800 transition-all"
            title="Draw, type, or upload digital signature"
          >
            <PenTool className="w-3.5 h-3.5 text-amber-400" />
            <span>Sign</span>
          </button>

          {/* Whiteout / Redact Tool */}
          <button
            type="button"
            onClick={() => setActiveTool('whiteout')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTool === 'whiteout'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Clean Whiteout / Blackout Redaction"
          >
            <Eraser className="w-3.5 h-3.5 text-rose-400" />
            <span>Whiteout</span>
          </button>

          {/* Shapes & Annotate Tool */}
          <button
            type="button"
            onClick={() => setActiveTool('shape')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTool === 'shape'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Rectangles, ellipses, highlights, and arrows"
          >
            <Square className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline">Shapes</span>
          </button>

          {/* More: Watermark & Bates */}
          <button
            type="button"
            onClick={() => setIsWatermarkModalOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 text-slate-300 hover:bg-slate-800 transition-all"
            title="Watermark & Bates Page Numbering"
          >
            <Stamp className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden lg:inline">Watermark / Bates</span>
          </button>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700 p-0.5 text-slate-300">
            <button
              type="button"
              onClick={() => setZoom(Math.max(0.5, zoom - 0.15))}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-1.5 font-bold">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom(Math.min(2.0, zoom + 0.15))}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Undo / Redo */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg border border-slate-700 text-slate-300"
            title="Undo"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg border border-slate-700 text-slate-300"
            title="Redo"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          {/* Famous Sejda Green "Apply Changes" Export Button */}
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExporting || pages.length === 0}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Compiling PDF...' : 'Apply Changes'}</span>
          </button>
        </div>
      </div>

      {/* 2. DYNAMIC FORMATTING PROPERTY RIBBON */}
      {(activeTool === 'text' || (selectedAnnotation && selectedAnnotation.type === 'text')) && (
        <div className="bg-[#182234] border-b border-slate-700/60 px-6 py-2 flex flex-wrap items-center gap-4 text-xs shrink-0 animate-in fade-in">
          <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">
            Text Properties:
          </span>

          {/* Font Family */}
          <select
            value={textFont}
            onChange={(e) => setTextFont(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
          >
            <option value="Helvetica">Helvetica (Standard)</option>
            <option value="Times-Roman">Times New Roman</option>
            <option value="Courier">Courier Monospace</option>
          </select>

          {/* Font Size */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Size:</span>
            <input
              type="number"
              min={8}
              max={72}
              value={textSize}
              onChange={(e) => setTextSize(parseInt(e.target.value) || 14)}
              className="w-14 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
            />
          </div>

          {/* Bold / Italic */}
          <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded border border-slate-700">
            <button
              type="button"
              onClick={() => setTextBold(!textBold)}
              className={`p-1 rounded ${textBold ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setTextItalic(!textItalic)}
              className={`p-1 rounded ${textItalic ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Color Palette */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Color:</span>
            {['#0f172a', '#ffffff', '#dc2626', '#2563eb', '#16a34a'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setTextColor(c)}
                className={`w-4 h-4 rounded-full border ${
                  textColor === c ? 'ring-2 ring-indigo-400' : 'border-slate-600'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {selectedAnnotation && (
            <button
              type="button"
              onClick={handleDeleteSelectedAnnotation}
              className="ml-auto text-rose-400 hover:text-rose-300 flex items-center gap-1 text-xs font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Element</span>
            </button>
          )}
        </div>
      )}

      {/* Shapes & Whiteout Properties */}
      {activeTool === 'shape' && (
        <div className="bg-[#182234] border-b border-slate-700/60 px-6 py-2 flex flex-wrap items-center gap-4 text-xs shrink-0 animate-in fade-in">
          <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">
            Shape Type:
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveShape('rectangle')}
              className={`px-2.5 py-1 rounded text-xs font-semibold ${
                activeShape === 'rectangle' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              Rectangle
            </button>
            <button
              type="button"
              onClick={() => setActiveShape('highlight')}
              className={`px-2.5 py-1 rounded text-xs font-semibold ${
                activeShape === 'highlight' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              Highlighter
            </button>
            <button
              type="button"
              onClick={() => setActiveShape('ellipse')}
              className={`px-2.5 py-1 rounded text-xs font-semibold ${
                activeShape === 'ellipse' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              Circle
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Color:</span>
            {['#2563eb', '#dc2626', '#f59e0b', '#10b981'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setShapeStrokeColor(c)}
                className={`w-4 h-4 rounded-full border ${
                  shapeStrokeColor === c ? 'ring-2 ring-indigo-400' : 'border-slate-600'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      )}

      {activeTool === 'whiteout' && (
        <div className="bg-[#182234] border-b border-slate-700/60 px-6 py-2 flex flex-wrap items-center gap-4 text-xs shrink-0 animate-in fade-in">
          <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">
            Whiteout &amp; Redaction Mode:
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setWhiteoutColor('#ffffff')}
              className={`px-3 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${
                whiteoutColor === '#ffffff'
                  ? 'bg-white text-slate-900 border-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <div className="w-3 h-3 bg-white border border-slate-400 rounded-xs" />
              <span>Whiteout (Erase)</span>
            </button>
            <button
              type="button"
              onClick={() => setWhiteoutColor('#000000')}
              className={`px-3 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${
                whiteoutColor === '#000000'
                  ? 'bg-black text-white border-slate-600 shadow-xs ring-2 ring-indigo-500'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <div className="w-3 h-3 bg-black border border-slate-700 rounded-xs" />
              <span>Blackout (Redact Secret)</span>
            </button>
          </div>
          <span className="text-[11px] text-slate-400">
            Click anywhere on the document to place a redaction box, then drag to reposition.
          </span>
        </div>
      )}

      {/* 3. MAIN WORKSPACE: SIDEBAR + DOCUMENT STAGE */}
      <div className="flex-1 flex min-w-0 overflow-hidden relative">
        {/* Left Thumbnail Drawer */}
        {pages.length > 0 && showThumbnails && (
          <div className="w-48 sm:w-56 bg-[#131b2e] border-r border-slate-800/80 flex flex-col shrink-0 overflow-hidden">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Pages ({pages.filter((p) => !p.isDeleted).length})
              </span>
              <button
                type="button"
                onClick={handleAddBlankPage}
                className="p-1 hover:bg-slate-800 text-indigo-400 rounded"
                title="Insert Blank Page"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {pages.map((pageModel, idx) => {
                if (pageModel.isDeleted) return null;
                const isActive = activePageIndex === idx;
                return (
                  <div
                    key={pageModel.pageIndex}
                    onClick={() => {
                      setActivePageIndex(idx);
                      // Scroll page into view
                      const el = document.getElementById(`pdf-page-container-${pageModel.pageIndex}`);
                      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className={`group relative p-2 rounded-xl border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600/20 border-indigo-500 shadow-md'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="aspect-[1/1.414] bg-white rounded overflow-hidden flex items-center justify-center">
                      {pageModel.thumbnailUrl ? (
                        <img
                          src={pageModel.thumbnailUrl}
                          alt={`Page ${idx + 1}`}
                          className="w-full h-full object-contain"
                          style={{ transform: `rotate(${pageModel.rotation}deg)` }}
                        />
                      ) : (
                        <FileText className="w-8 h-8 text-slate-400" />
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-bold text-slate-300">Page {idx + 1}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRotatePage(pageModel.pageIndex, 90);
                          }}
                          className="p-1 hover:text-white"
                          title="Rotate 90°"
                        >
                          <RotateCw className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePage(pageModel.pageIndex);
                          }}
                          className="p-1 hover:text-rose-400"
                          title="Delete Page"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Center Document Stage */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 flex flex-col items-center bg-[#090d16]">
          {pages.length === 0 ? (
            /* EMPTY STATE / WELCOME DROPZONE */
            <div className="max-w-xl w-full my-auto text-center p-8 bg-[#182234] border border-slate-700/80 rounded-3xl shadow-2xl">
              <div className="w-16 h-16 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
                <GulfWayLogo className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2 tracking-tight">
                Gulf Way Sejda-Grade PDF Editor
              </h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
                Edit text inline, add digital signatures, apply whiteout/redaction to censor sensitive WPS numbers, insert shapes, and organize pages directly in your browser.
              </p>

              {/* Upload Drop Area */}
              <label className="border-2 border-dashed border-indigo-500/40 hover:border-indigo-400 bg-slate-900/60 hover:bg-slate-900/90 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all mb-4 group">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f);
                  }}
                  className="hidden"
                />
                <Upload className="w-10 h-10 text-indigo-400 group-hover:scale-110 transition-transform mb-3" />
                <span className="text-sm font-bold text-white">Choose a PDF to Edit</span>
                <span className="text-xs text-slate-400 mt-1">or drag and drop PDF file here</span>
              </label>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-700"></div>
                <span className="flex-shrink mx-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Or test immediately
                </span>
                <div className="flex-grow border-t border-slate-700"></div>
              </div>

              <button
                type="button"
                onClick={handleLoadSample}
                disabled={isLoading}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Load Sample Multi-Page Business Agreement</span>
              </button>
            </div>
          ) : (
            /* PAGES CONTAINER */
            <div className="flex flex-col items-center gap-8 max-w-full pb-16">
              {pages.map((pageModel, idx) => {
                if (pageModel.isDeleted) return null;

                const pageWidth = (pageModel.width || 595.28) * zoom;
                const pageHeight = (pageModel.height || 841.89) * zoom;

                return (
                  <div
                    key={pageModel.pageIndex}
                    id={`pdf-page-container-${pageModel.pageIndex}`}
                    className="flex flex-col items-center"
                  >
                    {/* Page Control Header (Sejda style: Page number, Rotate, Delete) */}
                    <div
                      className="flex items-center justify-between w-full mb-2 px-3 py-1.5 bg-[#182234] border border-slate-700/80 rounded-xl shadow-xs text-xs text-slate-300"
                      style={{ width: `${pageWidth}px`, maxWidth: '100%' }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">Page {idx + 1}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {Math.round(pageModel.width)} × {Math.round(pageModel.height)} pt
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRotatePage(pageModel.pageIndex, -90)}
                          className="p-1 hover:bg-slate-700 rounded text-slate-300"
                          title="Rotate Left 90°"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRotatePage(pageModel.pageIndex, 90)}
                          className="p-1 hover:bg-slate-700 rounded text-slate-300"
                          title="Rotate Right 90°"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicatePage(pageModel.pageIndex)}
                          className="p-1 hover:bg-slate-700 rounded text-slate-300"
                          title="Duplicate Page"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePage(pageModel.pageIndex)}
                          className="p-1 hover:bg-rose-900/50 hover:text-rose-400 rounded text-slate-400"
                          title="Delete Page"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Interactive Canvas & Annotation Layer */}
                    <div
                      className="relative bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-400/20"
                      style={{
                        width: `${pageWidth}px`,
                        height: `${pageHeight}px`,
                        transform: `rotate(${pageModel.rotation}deg)`,
                      }}
                      onClick={(e) => handlePageStageClick(e, pageModel.pageIndex, pageModel)}
                    >
                      {/* Backing PDF Canvas */}
                      <canvas
                        ref={(el) => {
                          pageCanvasRefs.current[pageModel.pageIndex] = el;
                        }}
                        className="absolute inset-0 pointer-events-none"
                      />

                      {/* Annotations rendered onto this page */}
                      {annotations
                        .filter((a) => a.pageIndex === pageModel.pageIndex)
                        .map((ann) => {
                          const isSelected = selectedAnnotationId === ann.id;
                          const scaledX = ann.x * zoom;
                          const scaledY = ann.y * zoom;
                          const scaledW = ann.width * zoom;
                          const scaledH = ann.height * zoom;

                          return (
                            <div
                              key={ann.id}
                              className={`annotation-element absolute cursor-move select-none transition-shadow ${
                                isSelected ? 'ring-2 ring-indigo-500 shadow-lg' : ''
                              }`}
                              style={{
                                left: `${scaledX}px`,
                                top: `${scaledY}px`,
                                width: `${scaledW}px`,
                                height: `${scaledH}px`,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAnnotationId(ann.id);
                              }}
                            >
                              {/* TEXT ANNOTATION */}
                              {ann.type === 'text' && (
                                <textarea
                                  value={ann.text}
                                  onChange={(e) => {
                                    const updated = annotations.map((a) =>
                                      a.id === ann.id ? { ...a, text: e.target.value } : a
                                    );
                                    setAnnotations(updated);
                                  }}
                                  className="w-full h-full p-1 bg-transparent border-none outline-none resize-none overflow-hidden leading-tight"
                                  style={{
                                    fontSize: `${ann.fontSize * zoom}px`,
                                    color: ann.color,
                                    fontWeight: ann.bold ? 'bold' : 'normal',
                                    fontStyle: ann.italic ? 'italic' : 'normal',
                                    textAlign: ann.align,
                                    fontFamily:
                                      ann.fontFamily === 'Times-Roman'
                                        ? 'serif'
                                        : ann.fontFamily === 'Courier'
                                        ? 'monospace'
                                        : 'sans-serif',
                                  }}
                                />
                              )}

                              {/* WHITEOUT ANNOTATION */}
                              {ann.type === 'whiteout' && (
                                <div
                                  className="w-full h-full shadow-xs flex items-center justify-center"
                                  style={{
                                    backgroundColor: ann.fillColor,
                                    border: isSelected ? '1px dashed #6366f1' : 'none',
                                  }}
                                >
                                  {isSelected && (
                                    <span className="text-[9px] text-slate-400 font-bold uppercase pointer-events-none select-none">
                                      {ann.fillColor === '#ffffff' ? 'Whiteout' : 'Redacted'}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* SHAPE ANNOTATION */}
                              {ann.type === 'shape' && (
                                <div
                                  className="w-full h-full"
                                  style={{
                                    borderColor: ann.strokeColor,
                                    borderWidth: `${(ann.strokeWidth || 2) * zoom}px`,
                                    borderStyle: 'solid',
                                    borderRadius: ann.shapeType === 'ellipse' ? '9999px' : '4px',
                                    backgroundColor:
                                      ann.shapeType === 'highlight'
                                        ? '#fef08a'
                                        : ann.fillColor || 'transparent',
                                    opacity: ann.opacity ?? 1,
                                  }}
                                />
                              )}

                              {/* SIGNATURE / IMAGE */}
                              {(ann.type === 'signature' || ann.type === 'image') && (
                                <img
                                  src={ann.dataUrl}
                                  alt="Signature"
                                  className="w-full h-full object-contain pointer-events-none"
                                />
                              )}

                              {/* SELECTION CONTROLS */}
                              {isSelected && (
                                <div className="absolute -top-7 right-0 flex items-center gap-1 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 shadow-md">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteSelectedAnnotation();
                                    }}
                                    className="text-rose-400 hover:text-rose-300 p-0.5"
                                    title="Delete Element"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* SIGNATURE MODAL */}
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onApplySignature={handleApplySignature}
      />

      {/* WATERMARK & BATES MODAL */}
      <WatermarkBatesModal
        isOpen={isWatermarkModalOpen}
        onClose={() => setIsWatermarkModalOpen(false)}
        headerFooter={headerFooter}
        watermark={watermark}
        metadata={metadata}
        onSave={({ headerFooter: newHF, watermark: newWM, metadata: newMeta }) => {
          setHeaderFooter(newHF);
          setWatermark(newWM);
          setMetadata(newMeta);
        }}
      />
    </div>
  );
};
