import React, { useState, useRef } from 'react';
import {
  X,
  Check,
  CheckCircle2,
  XCircle,
  Square,
  CheckSquare,
  Award,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Plus,
} from 'lucide-react';
import { SYMBOL_PRESETS, SymbolPreset } from '../../utils/pdfSymbols';

interface SymbolsImagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertSymbol: (
    dataUrl: string,
    width: number,
    height: number,
    label?: string,
    targetPageIndex?: number,
    applyToAllPages?: boolean
  ) => void;
  pages?: { pageIndex: number; displayNumber?: number; isDeleted?: boolean }[];
  activePageIndex?: number;
}

export const SymbolsImagesModal: React.FC<SymbolsImagesModalProps> = ({
  isOpen,
  onClose,
  onInsertSymbol,
  pages = [],
  activePageIndex = 0,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'check' | 'cross' | 'checkbox' | 'stamp' | 'upload'>('all');
  const [customImageSrc, setCustomImageSrc] = useState<string | null>(null);
  const [customImageName, setCustomImageName] = useState<string>('');
  const [customWidth, setCustomWidth] = useState<number>(120);
  const [customHeight, setCustomHeight] = useState<number>(120);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedTargetPage, setSelectedTargetPage] = useState<number>(activePageIndex);
  const [applyToAllPages, setApplyToAllPages] = useState<boolean>(false);

  // Sync selected page whenever modal opens or activePageIndex updates
  React.useEffect(() => {
    if (isOpen) {
      setSelectedTargetPage(activePageIndex);
    }
  }, [isOpen, activePageIndex]);

  if (!isOpen) return null;

  const validPages = pages.filter((p) => !p.isDeleted);

  const filteredPresets =
    activeCategory === 'all'
      ? SYMBOL_PRESETS
      : activeCategory === 'upload'
      ? []
      : SYMBOL_PRESETS.filter((p) => p.category === activeCategory);

  const handleSelectPreset = (preset: SymbolPreset) => {
    onInsertSymbol(
      preset.dataUrl,
      preset.width,
      preset.height,
      preset.name,
      selectedTargetPage,
      applyToAllPages
    );
    onClose();
  };

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, SVG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const aspect = img.width / img.height;
        let initW = 140;
        let initH = 140 / aspect;
        if (initH > 180) {
          initH = 180;
          initW = 180 * aspect;
        }
        setCustomWidth(Math.round(initW));
        setCustomHeight(Math.round(initH));
        setCustomImageSrc(dataUrl);
        setCustomImageName(file.name);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleInsertCustomImage = () => {
    if (!customImageSrc) return;
    onInsertSymbol(
      customImageSrc,
      customWidth,
      customHeight,
      customImageName || 'Custom Image',
      selectedTargetPage,
      applyToAllPages
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Check className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Insert Symbols, Ticks &amp; Images
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  VECTOR STAMPS
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Click any tick mark, cross, checkbox, or upload custom graphics to place onto your document.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Page Selector Banner */}
        {validPages.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 bg-slate-950/90 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-slate-400 font-medium">Place on Page:</span>
              <select
                value={selectedTargetPage}
                onChange={(e) => setSelectedTargetPage(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 hover:border-emerald-500 text-emerald-300 font-bold rounded-lg px-2.5 py-1 text-xs outline-none cursor-pointer"
              >
                {validPages.map((p, idx) => (
                  <option key={p.pageIndex} value={p.pageIndex}>
                    Page {idx + 1} {p.pageIndex === activePageIndex ? '(Currently Active)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white select-none bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
              <input
                type="checkbox"
                checked={applyToAllPages}
                onChange={(e) => setApplyToAllPages(e.target.checked)}
                className="rounded border-slate-700 text-emerald-500 focus:ring-0 accent-emerald-500 cursor-pointer"
              />
              <span className="text-xs font-semibold text-emerald-400">
                Place on all pages ({validPages.length})
              </span>
            </label>
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-950/40 border-b border-slate-800 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeCategory === 'all'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            All Symbols
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('check')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeCategory === 'check'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Tick Marks (✓)
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('cross')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeCategory === 'cross'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            X &amp; Cross Marks (✗)
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('checkbox')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeCategory === 'checkbox'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
            Checkboxes
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('stamp')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeCategory === 'stamp'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            Stamps &amp; Seals
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('upload')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeCategory === 'upload'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-indigo-300" />
            Upload Custom Image
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeCategory !== 'upload' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="group relative flex flex-col items-center justify-center p-3.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500 rounded-xl transition-all hover:scale-[1.02] hover:shadow-lg text-center"
                >
                  <div className="h-16 w-full flex items-center justify-center p-1">
                    <img
                      src={preset.dataUrl}
                      alt={preset.name}
                      className="max-h-full max-w-full object-contain filter drop-shadow-xs group-hover:scale-110 transition-transform"
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-300 group-hover:text-emerald-300 mt-2 line-clamp-1">
                    {preset.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {preset.width} × {preset.height} px
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Custom Upload Tab */}
          {activeCategory === 'upload' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileChange(file);
                }}
              />

              {!customImageSrc ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(true);
                  }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFileChange(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    isDraggingFile
                      ? 'border-emerald-400 bg-emerald-950/20'
                      : 'border-slate-700 hover:border-slate-500 bg-slate-950/40 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mb-3">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-white mb-1">
                    Drag and drop your image here, or browse
                  </p>
                  <p className="text-xs text-slate-400 text-center max-w-sm">
                    Supports transparent PNG, JPEG, vector SVG, and WebP logos, signatures, or checkmarks.
                  </p>
                  <button
                    type="button"
                    className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Browse Image File
                  </button>
                </div>
              ) : (
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-semibold text-white truncate max-w-xs">
                        {customImageName}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCustomImageSrc(null)}
                      className="text-xs text-rose-400 hover:text-rose-300 font-medium"
                    >
                      Change Image
                    </button>
                  </div>

                  {/* Preview container */}
                  <div className="h-44 bg-slate-900/90 border border-slate-800 rounded-lg flex items-center justify-center p-3 relative overflow-hidden bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px]">
                    <img
                      src={customImageSrc}
                      alt="Uploaded preview"
                      className="max-h-full max-w-full object-contain filter drop-shadow-md"
                    />
                  </div>

                  {/* Size controls */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 font-medium block mb-1">
                        Initial Width (px): {customWidth}
                      </label>
                      <input
                        type="range"
                        min="30"
                        max="400"
                        value={customWidth}
                        onChange={(e) => {
                          const w = parseInt(e.target.value);
                          setCustomWidth(w);
                          setCustomHeight(Math.round(w * (customHeight / customWidth)));
                        }}
                        className="w-full accent-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 font-medium block mb-1">
                        Initial Height (px): {customHeight}
                      </label>
                      <input
                        type="range"
                        min="30"
                        max="400"
                        value={customHeight}
                        onChange={(e) => setCustomHeight(parseInt(e.target.value))}
                        className="w-full accent-indigo-500"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleInsertCustomImage}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Insert Image onto PDF Page
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Once placed, symbols can be freely dragged, resized, duplicated, or deleted.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
