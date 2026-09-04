import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  RotateCw, 
  RotateCcw, 
  FlipHorizontal, 
  FlipVertical, 
  Info, 
  Download, 
  FileArchive, 
  FileText, 
  Check, 
  UploadCloud, 
  Sparkles, 
  Maximize2, 
  Layers, 
  Sliders, 
  Crop, 
  CheckSquare, 
  Square, 
  AlertCircle,
  Loader2,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';
import { SizerImageItem, SizerPreset, SizerUnit, SizerExportFormat } from '../types';
import { 
  SOCIAL_PRESETS, 
  ResizeOptions, 
  calculateTargetDimensions, 
  processImage, 
  exportSelectedImages 
} from '../utils/imageSizerEngine';
import { createSampleImages } from '../utils/imageOptimizer';

export const ImageSizer: React.FC = () => {
  // Image queue state
  const [images, setImages] = useState<SizerImageItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Resize settings state
  const [resizeMode, setResizeMode] = useState<'by-size' | 'percentage' | 'social-media'>('by-size');
  const [widthInput, setWidthInput] = useState<number>(1240);
  const [heightInput, setHeightInput] = useState<number>(1754);
  const [unit, setUnit] = useState<SizerUnit>('px');
  const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(true);
  const [percentage, setPercentage] = useState<number>(100);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('ig-square');
  const [presetCategory, setPresetCategory] = useState<'social' | 'document' | 'web'>('social');
  const [fitMode, setFitMode] = useState<'contain' | 'cover' | 'stretch'>('contain');

  // Export settings state
  const [targetFileSizeKb, setTargetFileSizeKb] = useState<number | ''>('');
  const [targetFileSizeUnit, setTargetFileSizeUnit] = useState<'KB' | 'MB'>('KB');
  const [outputFormat, setOutputFormat] = useState<SizerExportFormat>('jpg');
  const [quality, setQuality] = useState<number>(85); // 10 to 100
  const [dpi, setDpi] = useState<number>(150);
  const [backgroundColor, setBackgroundColor] = useState<string>('#FFFFFF');

  // Interactive modal / info state
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportStatus, setExportStatus] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active image
  const activeImage = useMemo(() => {
    if (!images.length) return null;
    return images.find((img) => img.id === activeId) || images[0];
  }, [images, activeId]);

  // Set initial width/height when active image changes if not edited
  useEffect(() => {
    if (activeImage && resizeMode === 'by-size' && unit === 'px') {
      // Default to active image's dimensions
      setWidthInput(activeImage.originalWidth);
      setHeightInput(activeImage.originalHeight);
    }
  }, [activeImage?.id]);

  // Target dimensions for active image
  const activeTargetDim = useMemo(() => {
    if (!activeImage) return { width: 1240, height: 1754 };
    const options: ResizeOptions = {
      mode: resizeMode,
      width: widthInput,
      height: heightInput,
      unit,
      lockAspectRatio,
      percentage,
      presetId: selectedPresetId,
      dpi,
      fitMode,
      backgroundColor,
      outputFormat,
      quality: quality / 100,
      targetFileSizeKb: targetFileSizeKb ? (targetFileSizeUnit === 'MB' ? targetFileSizeKb * 1024 : targetFileSizeKb) : undefined,
    };
    return calculateTargetDimensions(activeImage.originalWidth, activeImage.originalHeight, options);
  }, [activeImage, resizeMode, widthInput, heightInput, unit, lockAspectRatio, percentage, selectedPresetId, dpi]);

  // Selected images for bulk export
  const selectedImages = useMemo(() => images.filter((img) => img.selected), [images]);
  const allSelected = images.length > 0 && selectedImages.length === images.length;

  // Handle aspect-ratio locked width change
  const handleWidthChange = (newVal: number) => {
    setWidthInput(newVal);
    if (lockAspectRatio && activeImage && newVal > 0) {
      const ratio = activeImage.originalHeight / activeImage.originalWidth;
      setHeightInput(Math.round(newVal * ratio));
    }
  };

  // Handle aspect-ratio locked height change
  const handleHeightChange = (newVal: number) => {
    setHeightInput(newVal);
    if (lockAspectRatio && activeImage && newVal > 0) {
      const ratio = activeImage.originalWidth / activeImage.originalHeight;
      setWidthInput(Math.round(newVal * ratio));
    }
  };

  // Handle bulk file uploads
  const handleFiles = async (files: FileList | File[]) => {
    const newItems: SizerImageItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      const url = URL.createObjectURL(file);
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          newItems.push({
            id: `sizer-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            file,
            name: file.name,
            originalUrl: url,
            originalWidth: img.naturalWidth,
            originalHeight: img.naturalHeight,
            originalSize: file.size,
            originalType: file.type,
            rotation: 0,
            flipH: false,
            flipV: false,
            selected: true,
          });
          resolve();
        };
        img.onerror = () => resolve();
        img.src = url;
      });
    }

    if (newItems.length > 0) {
      setImages((prev) => {
        const next = [...prev, ...newItems];
        if (!activeId) setActiveId(next[0].id);
        return next;
      });
    }
  };

  // Load sample dataset
  const handleLoadSampleImages = async () => {
    try {
      const sampleFiles = await createSampleImages();
      await handleFiles(sampleFiles);
    } catch (err) {
      console.error('Failed to load sample images:', err);
    }
  };

  // Transformation actions on active image
  const handleRotateCw = () => {
    if (!activeImage) return;
    setImages((prev) =>
      prev.map((img) =>
        img.id === activeImage.id ? { ...img, rotation: (img.rotation + 90) % 360 } : img
      )
    );
  };

  const handleRotateCcw = () => {
    if (!activeImage) return;
    setImages((prev) =>
      prev.map((img) =>
        img.id === activeImage.id ? { ...img, rotation: (img.rotation + 270) % 360 } : img
      )
    );
  };

  const handleFlipH = () => {
    if (!activeImage) return;
    setImages((prev) =>
      prev.map((img) =>
        img.id === activeImage.id ? { ...img, flipH: !img.flipH } : img
      )
    );
  };

  const handleFlipV = () => {
    if (!activeImage) return;
    setImages((prev) =>
      prev.map((img) =>
        img.id === activeImage.id ? { ...img, flipV: !img.flipV } : img
      )
    );
  };

  const handleResetActive = () => {
    if (!activeImage) return;
    setImages((prev) =>
      prev.map((img) =>
        img.id === activeImage.id ? { ...img, rotation: 0, flipH: false, flipV: false } : img
      )
    );
  };

  const handleToggleSelect = (id: string) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, selected: !img.selected } : img))
    );
  };

  const handleToggleSelectAll = () => {
    const nextState = !allSelected;
    setImages((prev) => prev.map((img) => ({ ...img, selected: nextState })));
  };

  const handleDeleteImage = (id: string) => {
    setImages((prev) => {
      const updated = prev.filter((img) => img.id !== id);
      if (activeId === id) {
        setActiveId(updated.length > 0 ? updated[0].id : null);
      }
      return updated;
    });
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all uploaded images from the Image Sizer queue?')) {
      setImages([]);
      setActiveId(null);
    }
  };

  // Execute export on selected images
  const handleExport = async () => {
    const itemsToExport = selectedImages.length > 0 ? selectedImages : (activeImage ? [activeImage] : []);
    if (itemsToExport.length === 0) {
      alert('Please upload or select at least one image to export.');
      return;
    }

    setIsExporting(true);
    setExportStatus('Initializing export pipeline...');

    const options: ResizeOptions = {
      mode: resizeMode,
      width: widthInput,
      height: heightInput,
      unit,
      lockAspectRatio,
      percentage,
      presetId: selectedPresetId,
      dpi,
      fitMode,
      backgroundColor,
      outputFormat,
      quality: quality / 100,
      targetFileSizeKb: targetFileSizeKb ? (targetFileSizeUnit === 'MB' ? targetFileSizeKb * 1024 : targetFileSizeKb) : undefined,
    };

    try {
      await exportSelectedImages(itemsToExport, options, (cur, tot, status) => {
        setExportStatus(`[${cur}/${tot}] ${status}`);
      });
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to process and export images. Please try again.');
    } finally {
      setIsExporting(false);
      setExportStatus('');
    }
  };

  // Helper format bytes
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="flex-1 flex flex-col bg-[#12161f] text-slate-100 min-h-[calc(100vh-4rem)]">
      {/* Top Header Bar matching Screenshot */}
      <header className="h-14 bg-[#181d28] border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-xs">
              <Maximize2 className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
                ImageResizer
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  PRO
                </span>
              </span>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="hidden md:flex items-center gap-4 text-xs font-semibold text-slate-300">
            <button 
              type="button" 
              onClick={() => setResizeMode('by-size')}
              className={`px-2.5 py-1 rounded-md transition-colors ${resizeMode === 'by-size' ? 'text-white bg-slate-800' : 'hover:text-white'}`}
            >
              Resize
            </button>
            <button 
              type="button" 
              onClick={() => setResizeMode('social-media')}
              className={`px-2.5 py-1 rounded-md transition-colors ${resizeMode === 'social-media' ? 'text-white bg-slate-800' : 'hover:text-white'}`}
            >
              Presets
            </button>
            <button 
              type="button" 
              onClick={() => setOutputFormat('jpg')}
              className="px-2.5 py-1 rounded-md hover:text-white transition-colors"
            >
              Compress
            </button>
            <button 
              type="button" 
              onClick={() => setOutputFormat('pdf')}
              className="px-2.5 py-1 rounded-md hover:text-white transition-colors"
            >
              Convert to PDF
            </button>
          </div>
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-3">
          {images.length === 0 && (
            <button
              type="button"
              id="sizer-load-samples-header-btn"
              onClick={handleLoadSampleImages}
              className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Samples</span>
            </button>
          )}

          <label className="cursor-pointer px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            <span>Upload Images</span>
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files);
                e.target.value = '';
              }}
            />
          </label>
        </div>
      </header>

      {/* Main Grid: Left Control Panel + Right Interactive Stage */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Resize & Export Settings (Matching Screenshot) */}
        <div className="w-full lg:w-96 bg-[#161b25] border-r border-slate-800/80 flex flex-col shrink-0 overflow-y-auto max-h-[calc(100vh-7.5rem)]">
          {/* Top Quick Actions Row */}
          <div className="p-4 border-b border-slate-800/70 flex items-center gap-2.5">
            <button
              type="button"
              id="sizer-quick-add-btn"
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 flex flex-col items-center justify-center text-slate-300 hover:text-white transition-colors group cursor-pointer shrink-0"
              title="Add Image Files"
            >
              <Plus className="w-5 h-5 group-hover:scale-110 transition-transform text-slate-200" />
            </button>

            <button
              type="button"
              id="sizer-toggle-select-all-btn"
              onClick={handleToggleSelectAll}
              disabled={images.length === 0}
              className={`w-12 h-12 rounded-xl border flex flex-col items-center justify-center transition-colors shrink-0 ${
                allSelected
                  ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/70 text-slate-400 hover:text-white'
              }`}
              title={allSelected ? 'Deselect All' : 'Select All'}
            >
              <CheckSquare className="w-4 h-4" />
              <span className="text-[9px] font-mono mt-0.5">{selectedImages.length}</span>
            </button>

            <button
              type="button"
              id="sizer-clear-all-btn"
              onClick={handleClearAll}
              disabled={images.length === 0}
              className="w-12 h-12 rounded-xl bg-slate-800/80 hover:bg-red-950/40 border border-slate-700/70 hover:border-red-700/50 flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors shrink-0"
              title="Clear Queue"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <div className="ml-auto text-[11px] text-slate-400 font-medium">
              Max file size: <span className="text-slate-200 font-mono">25 MB</span>
            </div>
          </div>

          <div className="p-4 space-y-5">
            {/* Section: Resize Settings */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center justify-between">
                <span>Resize Settings</span>
                {activeImage && (
                  <span className="text-[10px] font-mono text-slate-400 font-normal">
                    Src: {activeImage.originalWidth}×{activeImage.originalHeight}
                  </span>
                )}
              </h2>

              {/* Mode Tabs: By Size | As Percentage | Social Media */}
              <div className="grid grid-cols-3 gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  id="sizer-mode-by-size-btn"
                  onClick={() => setResizeMode('by-size')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all truncate ${
                    resizeMode === 'by-size'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  By Size
                </button>

                <button
                  type="button"
                  id="sizer-mode-percentage-btn"
                  onClick={() => setResizeMode('percentage')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all truncate ${
                    resizeMode === 'percentage'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  As Percentage
                </button>

                <button
                  type="button"
                  id="sizer-mode-social-btn"
                  onClick={() => setResizeMode('social-media')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all truncate ${
                    resizeMode === 'social-media'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Social Media
                </button>
              </div>

              {/* By Size Inputs */}
              {resizeMode === 'by-size' && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Width
                      </label>
                      <input
                        type="number"
                        id="sizer-width-input"
                        value={widthInput || ''}
                        onChange={(e) => handleWidthChange(Number(e.target.value))}
                        placeholder="Enter Width"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm font-mono text-white focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-300">
                          Height
                        </label>
                        <select
                          value={unit}
                          onChange={(e) => setUnit(e.target.value as SizerUnit)}
                          className="bg-slate-800 text-[11px] font-mono font-bold text-indigo-400 border border-slate-700 rounded px-1.5 py-0.5 focus:outline-hidden cursor-pointer"
                        >
                          <option value="px">px</option>
                          <option value="%">%</option>
                          <option value="in">in</option>
                          <option value="cm">cm</option>
                          <option value="mm">mm</option>
                        </select>
                      </div>
                      <input
                        type="number"
                        id="sizer-height-input"
                        value={heightInput || ''}
                        onChange={(e) => handleHeightChange(Number(e.target.value))}
                        placeholder="Enter Height"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm font-mono text-white focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300">
                    <input
                      type="checkbox"
                      id="sizer-lock-aspect-ratio-checkbox"
                      checked={lockAspectRatio}
                      onChange={(e) => setLockAspectRatio(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="font-medium">Lock Aspect Ratio</span>
                  </label>
                </div>
              )}

              {/* As Percentage Inputs */}
              {resizeMode === 'percentage' && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-semibold">Scaling Ratio</span>
                    <span className="font-mono text-indigo-400 font-bold text-sm">{percentage}%</span>
                  </div>

                  <input
                    type="range"
                    min="10"
                    max="300"
                    step="5"
                    value={percentage}
                    onChange={(e) => setPercentage(Number(e.target.value))}
                    className="w-full accent-indigo-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[25, 50, 75, 100, 150, 200].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setPercentage(pct)}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-mono transition-colors ${
                          percentage === pct
                            ? 'bg-indigo-600 text-white border-indigo-500 font-bold'
                            : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Media & Document Presets */}
              {resizeMode === 'social-media' && (
                <div className="space-y-2.5 animate-fadeIn">
                  {/* Category switcher */}
                  <div className="flex gap-1 border-b border-slate-800 pb-2">
                    {[
                      { id: 'social', label: 'Social' },
                      { id: 'document', label: 'ID & Print' },
                      { id: 'web', label: 'Web & HD' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setPresetCategory(cat.id as any)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                          presetCategory === cat.id
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {SOCIAL_PRESETS.filter((p) => p.category === presetCategory).map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setSelectedPresetId(preset.id)}
                        className={`w-full p-2 rounded-lg border text-left flex items-center justify-between transition-colors ${
                          selectedPresetId === preset.id
                            ? 'bg-indigo-950/40 border-indigo-500 text-white'
                            : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-xs font-bold text-slate-200 truncate">{preset.name}</div>
                          <div className="text-[10px] text-slate-500 truncate">{preset.description}</div>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-indigo-400 shrink-0 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700">
                          {preset.width}×{preset.height}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Fit Mode Toggle */}
              <div className="pt-2 border-t border-slate-800/70">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Fitting Behavior
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {[
                    { id: 'contain', label: 'Fit (Contain)' },
                    { id: 'cover', label: 'Fill (Crop)' },
                    { id: 'stretch', label: 'Stretch' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFitMode(f.id as any)}
                      className={`py-1 px-1.5 rounded-md border text-center font-medium transition-colors ${
                        fitMode === f.id
                          ? 'bg-slate-800 text-white border-indigo-500/60 font-semibold'
                          : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Section: Export Settings (Matching Screenshot) */}
            <div className="space-y-3 pt-3 border-t border-slate-800/70">
              <h2 className="text-sm font-bold text-white tracking-tight">
                Export Settings
              </h2>

              {/* Target File Size (optional) */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 block">
                  Target File Size <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <div className="flex rounded-lg overflow-hidden border border-slate-700/80 bg-slate-900">
                  <input
                    type="number"
                    id="sizer-target-file-size-input"
                    value={targetFileSizeKb || ''}
                    onChange={(e) => setTargetFileSizeKb(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g. 100"
                    className="flex-1 px-3 py-2 bg-transparent text-sm font-mono text-white focus:outline-hidden"
                  />
                  <select
                    value={targetFileSizeUnit}
                    onChange={(e) => setTargetFileSizeUnit(e.target.value as 'KB' | 'MB')}
                    className="bg-slate-800 text-xs font-mono font-bold text-slate-200 px-3 border-l border-slate-700 focus:outline-hidden cursor-pointer"
                  >
                    <option value="KB">KB</option>
                    <option value="MB">MB</option>
                  </select>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Set a max output file size. Only works for JPG/WebP files.
                </p>
              </div>

              {/* Target Format */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 block">
                  Target Output Format
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['jpg', 'png', 'webp', 'pdf'] as SizerExportFormat[]).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setOutputFormat(fmt)}
                      className={`py-1.5 rounded-lg border text-center text-xs font-bold uppercase transition-all ${
                        outputFormat === fmt
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                          : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality Slider (for JPG/WebP) */}
              {(outputFormat === 'jpg' || outputFormat === 'webp') && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-semibold">Quality</span>
                    <span className="font-mono text-indigo-400 font-bold">{quality}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    step="1"
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              )}

              {/* DPI setting */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold">Print Resolution (DPI)</span>
                  <span className="font-mono text-slate-400">{dpi} DPI</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
                  {[72, 150, 300].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDpi(d)}
                      className={`py-1 rounded border text-center transition-colors ${
                        dpi === d
                          ? 'bg-slate-800 text-white border-indigo-500 font-bold'
                          : 'bg-slate-900/60 text-slate-400 border-slate-800'
                      }`}
                    >
                      {d} DPI
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Primary Export Action (Matching Screenshot Button) */}
          <div className="p-4 mt-auto border-t border-slate-800/80 bg-[#141822]">
            <button
              type="button"
              id="sizer-main-export-btn"
              onClick={handleExport}
              disabled={isExporting || images.length === 0}
              className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 disabled:pointer-events-none text-white font-extrabold text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>
                    Export {selectedImages.length > 0 ? `(${selectedImages.length})` : ''}
                  </span>
                  <span className="text-lg">→</span>
                </>
              )}
            </button>
            {exportStatus && (
              <p className="text-[11px] font-mono text-center text-indigo-400 mt-2 truncate animate-pulse">
                {exportStatus}
              </p>
            )}
          </div>
        </div>

        {/* Right Stage: Interactive Preview & Bulk Gallery */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-[#0d1017] p-4 sm:p-6 space-y-6">
          {/* Active Image Canvas & Controls */}
          {activeImage ? (
            <div className="bg-[#161b26] rounded-2xl border border-slate-800 p-4 sm:p-5 space-y-4 shadow-xl">
              {/* Active Image Toolbar */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/30">
                    ACTIVE
                  </span>
                  <span className="text-sm font-semibold text-white truncate max-w-xs">
                    {activeImage.name}
                  </span>
                </div>

                {/* Toolbar buttons: Rotate CW, Rotate CCW, Flip H, Flip V, Info */}
                <div className="flex items-center gap-1.5 text-slate-300">
                  <button
                    type="button"
                    onClick={handleRotateCw}
                    className="p-1.5 hover:bg-slate-800 rounded-lg hover:text-white transition-colors"
                    title="Rotate 90° Clockwise"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRotateCcw}
                    className="p-1.5 hover:bg-slate-800 rounded-lg hover:text-white transition-colors"
                    title="Rotate 90° Counter-Clockwise"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleFlipH}
                    className={`p-1.5 rounded-lg transition-colors ${activeImage.flipH ? 'bg-indigo-600/30 text-indigo-300' : 'hover:bg-slate-800 hover:text-white'}`}
                    title="Flip Horizontal"
                  >
                    <FlipHorizontal className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleFlipV}
                    className={`p-1.5 rounded-lg transition-colors ${activeImage.flipV ? 'bg-indigo-600/30 text-indigo-300' : 'hover:bg-slate-800 hover:text-white'}`}
                    title="Flip Vertical"
                  >
                    <FlipVertical className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInfoModal(true)}
                    className="p-1.5 hover:bg-slate-800 rounded-lg hover:text-white transition-colors"
                    title="File Properties"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleResetActive}
                    className="p-1.5 hover:bg-slate-800 rounded-lg hover:text-white transition-colors text-xs font-mono"
                    title="Reset Transformations"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Main Visual Display */}
              <div className="relative w-full h-80 sm:h-96 bg-[#0b0e14] rounded-xl border border-slate-800/80 flex items-center justify-center overflow-hidden p-4">
                <img
                  src={activeImage.originalUrl}
                  alt={activeImage.name}
                  style={{
                    transform: `rotate(${activeImage.rotation}deg) scaleX(${activeImage.flipH ? -1 : 1}) scaleY(${activeImage.flipV ? -1 : 1})`,
                    maxHeight: '100%',
                    maxWidth: '100%',
                    objectFit: fitMode === 'contain' ? 'contain' : (fitMode === 'cover' ? 'cover' : 'fill'),
                  }}
                  className="rounded shadow-md transition-transform duration-200"
                />
              </div>

              {/* Dimensions Badge (Matching Screenshot Exactly) */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 px-4 py-3 rounded-xl border border-slate-800">
                <div>
                  <div className="text-sm font-bold text-white truncate max-w-sm">
                    {activeImage.name}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Original: <strong className="text-slate-300 font-mono">{formatBytes(activeImage.originalSize)}</strong>
                  </div>
                </div>

                {/* Dimension Comparison Pill */}
                <div className="flex items-center gap-2 font-mono text-xs font-bold">
                  <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg border border-slate-700">
                    {activeImage.originalWidth} X {activeImage.originalHeight}
                  </span>
                  <span className="text-slate-500 font-sans">→</span>
                  <span className="px-3 py-1 bg-indigo-600/30 text-indigo-300 rounded-lg border border-indigo-500/50 shadow-xs">
                    {activeTargetDim.width} X {activeTargetDim.height}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Empty State / Upload Dropzone */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-4 ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-950/20'
                  : 'border-slate-800 hover:border-indigo-500/50 bg-[#161b26]/50'
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  Drop image files here to batch resize
                </h3>
                <p className="text-xs text-slate-400">
                  Bulk upload photos, documents, and graphics. Supports JPG, PNG, WEBP, GIF, SVG, BMP.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Browse Files
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLoadSampleImages();
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold border border-slate-700 transition-colors"
                >
                  Load Sample Photos
                </button>
              </div>
            </div>
          )}

          {/* Bulk Images Queue & Multi-Select Manager */}
          {images.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Bulk Images Queue</h3>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-indigo-400 font-semibold border border-slate-700">
                    {selectedImages.length} of {images.length} Selected
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="text-xs font-semibold text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-800 transition-colors"
                  >
                    {allSelected ? 'Deselect All' : 'Select All'}
                  </button>
                  <label className="cursor-pointer text-xs font-semibold text-indigo-400 hover:text-indigo-300 px-2.5 py-1 rounded bg-indigo-950/40 border border-indigo-500/30 transition-colors flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add More</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) handleFiles(e.target.files);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Grid of Image Cards with Checkboxes & Direct Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {images.map((item) => {
                  const isActive = activeId === item.id;
                  const itemDim = calculateTargetDimensions(item.originalWidth, item.originalHeight, {
                    mode: resizeMode,
                    width: widthInput,
                    height: heightInput,
                    unit,
                    lockAspectRatio,
                    percentage,
                    presetId: selectedPresetId,
                    dpi,
                    fitMode,
                    backgroundColor,
                    outputFormat,
                    quality: quality / 100,
                  });

                  return (
                    <div
                      key={item.id}
                      onClick={() => setActiveId(item.id)}
                      className={`relative p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                        isActive
                          ? 'bg-[#182030] border-indigo-500 shadow-md ring-1 ring-indigo-500/30'
                          : 'bg-[#161b26] border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSelect(item.id);
                          }}
                          className="mt-0.5 text-slate-400 hover:text-indigo-400 shrink-0"
                        >
                          {item.selected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>

                        {/* Thumbnail */}
                        <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                          <img
                            src={item.originalUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Metadata */}
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-white truncate" title={item.name}>
                            {item.name}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            {item.originalWidth}×{item.originalHeight} px
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">
                            {formatBytes(item.originalSize)}
                          </div>
                        </div>
                      </div>

                      {/* Footer: Target dimensions badge & actions */}
                      <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between text-[11px]">
                        <span className="font-mono text-[10px] text-indigo-300 font-bold bg-indigo-950/50 px-1.5 py-0.5 rounded border border-indigo-500/30 truncate">
                          → {itemDim.width}×{itemDim.height}
                        </span>

                        <div className="flex items-center gap-1">
                          {/* Single item export */}
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await exportSelectedImages([item], {
                                mode: resizeMode,
                                width: widthInput,
                                height: heightInput,
                                unit,
                                lockAspectRatio,
                                percentage,
                                presetId: selectedPresetId,
                                dpi,
                                fitMode,
                                backgroundColor,
                                outputFormat,
                                quality: quality / 100,
                                targetFileSizeKb: targetFileSizeKb ? (targetFileSizeUnit === 'MB' ? targetFileSizeKb * 1024 : targetFileSizeKb) : undefined,
                              });
                            }}
                            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-300 transition-colors"
                            title="Download this resized image"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteImage(item.id);
                            }}
                            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-red-400 transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Modal */}
      {showInfoModal && activeImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-[#181d28] border border-slate-700 rounded-2xl p-6 space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-400" />
                Image Properties
              </h3>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Filename:</span>
                <span className="text-white font-semibold truncate max-w-xs">{activeImage.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Original Dimensions:</span>
                <span className="text-white">{activeImage.originalWidth} × {activeImage.originalHeight} px</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Aspect Ratio:</span>
                <span className="text-white">{(activeImage.originalWidth / activeImage.originalHeight).toFixed(3)}:1</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Original File Size:</span>
                <span className="text-white">{formatBytes(activeImage.originalSize)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">MIME Type:</span>
                <span className="text-white">{activeImage.originalType || 'image/jpeg'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Rotation & Flips:</span>
                <span className="text-white">{activeImage.rotation}° {activeImage.flipH ? '(Flipped H)' : ''} {activeImage.flipV ? '(Flipped V)' : ''}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800 text-indigo-300">
                <span className="text-indigo-400">Target Dimensions:</span>
                <span className="font-bold">{activeTargetDim.width} × {activeTargetDim.height} px</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
