import React, { useState } from 'react';
import { 
  Sliders, 
  FileText, 
  Image as ImageIcon, 
  Check, 
  Layers, 
  Sparkles, 
  Settings2,
  FileCheck2,
  X,
  Stamp,
  Type,
  Upload
} from 'lucide-react';
import { 
  BatchConfig, 
  Layout3Style, 
  OutputFormat, 
  PageOrientation, 
  ImageFitMode,
  WatermarkType,
  WatermarkPosition,
  WatermarkConfig
} from '../types';

const DEFAULT_WATERMARK_LOGO =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'><circle cx='120' cy='120' r='108' fill='none' stroke='%23334155' stroke-width='4' stroke-dasharray='8 6'/><circle cx='120' cy='120' r='94' fill='none' stroke='%23334155' stroke-width='2'/><polygon points='65,120 120,65 175,120 120,175' fill='none' stroke='%23334155' stroke-width='4'/><text x='120' y='114' font-family='system-ui,sans-serif' font-weight='900' font-size='20' text-anchor='middle' fill='%23334155'>GULF WAY</text><text x='120' y='136' font-family='system-ui,sans-serif' font-weight='700' font-size='13' text-anchor='middle' fill='%23334155'>OFFICIAL SEAL</text></svg>";

interface BatchPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BatchConfig;
  onSaveConfig: (config: BatchConfig) => void;
  isInitialPrompt?: boolean;
}

export const BatchPromptModal: React.FC<BatchPromptModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  isInitialPrompt = false,
}) => {
  const [imagesPerPage, setImagesPerPage] = useState<2 | 3>(config.imagesPerPage);
  const [orientation, setOrientation] = useState<PageOrientation>(config.orientation);
  const [fitMode, setFitMode] = useState<ImageFitMode>(config.fitMode);
  const [layout3Style, setLayout3Style] = useState<Layout3Style>(config.layout3Style);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>(config.outputFormat);
  const [qualityPreset, setQualityPreset] = useState<'balanced' | 'ultralight' | 'high'>('balanced');
  const [showCaptions, setShowCaptions] = useState<boolean>(config.showCaptions);
  const [showPageNumbers, setShowPageNumbers] = useState<boolean>(config.showPageNumbers);
  const [pageHeaderTitle, setPageHeaderTitle] = useState<string>(config.pageHeaderTitle);

  // Watermark state
  const [watermarkEnabled, setWatermarkEnabled] = useState<boolean>(config.watermark?.enabled ?? false);
  const [watermarkType, setWatermarkType] = useState<WatermarkType>(config.watermark?.type ?? 'text');
  const [watermarkText, setWatermarkText] = useState<string>(config.watermark?.text ?? 'GULF WAY GROUP');
  const [watermarkFontSize, setWatermarkFontSize] = useState<number>(config.watermark?.fontSize ?? 54);
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(config.watermark?.opacity ?? 0.16);
  const [watermarkColor, setWatermarkColor] = useState<string>(config.watermark?.color ?? '#334155');
  const [watermarkPosition, setWatermarkPosition] = useState<WatermarkPosition>(config.watermark?.position ?? 'center-diagonal');
  const [watermarkRotationAngle, setWatermarkRotationAngle] = useState<number>(config.watermark?.rotationAngle ?? -30);
  const [watermarkImageUrl, setWatermarkImageUrl] = useState<string | undefined>(config.watermark?.imageUrl);
  const [watermarkImageScale, setWatermarkImageScale] = useState<number>(config.watermark?.imageScale ?? 0.35);

  if (!isOpen) return null;

  const handleApply = () => {
    let quality = 0.82;
    let maxDimension = 1920;
    if (qualityPreset === 'ultralight') {
      quality = 0.68;
      maxDimension = 1400;
    } else if (qualityPreset === 'high') {
      quality = 0.92;
      maxDimension = 2400;
    }

    onSaveConfig({
      ...config,
      imagesPerPage,
      orientation,
      fitMode,
      layout3Style,
      outputFormat,
      quality,
      maxDimension,
      showCaptions,
      showPageNumbers,
      pageHeaderTitle,
      watermark: {
        enabled: watermarkEnabled,
        type: watermarkType,
        text: watermarkText,
        fontSize: watermarkFontSize,
        opacity: watermarkOpacity,
        color: watermarkColor,
        position: watermarkPosition,
        rotationAngle: watermarkRotationAngle,
        imageUrl: watermarkImageUrl,
        imageScale: watermarkImageScale,
      },
    });
    onClose();
  };

  return (
    <div 
      id="batch-prompt-modal-backdrop" 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div 
        id="batch-prompt-dialog" 
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 transition-all"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-950/70 px-2 py-0.5 rounded border border-indigo-400/30">
                  Gulf Way Group
                </span>
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-white flex items-center gap-2">
                {isInitialPrompt ? 'Batch Prompt Configuration' : 'A4 Batch Sheet Settings'}
                {isInitialPrompt && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 font-medium">
                    Setup
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Set batch limits (max 2 or 3 images per A4 sheet), optimization, and export format
              </p>
            </div>
          </div>
          {!isInitialPrompt && (
            <button
              id="close-batch-modal-btn"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Key requirement 1: Max 2 or 3 images in one file */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                Images Per A4 Sheet (Batch Capacity)
              </span>
              <span className="text-xs text-slate-500 font-normal">
                Files auto-chunked into sets
              </span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                id="select-2-images-batch-btn"
                onClick={() => setImagesPerPage(2)}
                className={`p-4 rounded-xl border-2 text-left transition-all relative ${
                  imagesPerPage === 2
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base font-bold">2 Images / File</span>
                  {imagesPerPage === 2 && (
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                  Evenly divided into top/bottom halves. High visibility per photo.
                </p>
                {/* Visual miniature representation */}
                <div className="w-full h-12 rounded bg-slate-200/70 p-1 flex flex-col gap-1">
                  <div className="w-full flex-1 bg-white rounded border border-slate-300/80 flex items-center justify-center text-[9px] text-slate-400 font-medium">
                    Image 1
                  </div>
                  <div className="w-full flex-1 bg-white rounded border border-slate-300/80 flex items-center justify-center text-[9px] text-slate-400 font-medium">
                    Image 2
                  </div>
                </div>
              </button>

              <button
                type="button"
                id="select-3-images-batch-btn"
                onClick={() => setImagesPerPage(3)}
                className={`p-4 rounded-xl border-2 text-left transition-all relative ${
                  imagesPerPage === 3
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base font-bold">3 Images / File</span>
                  {imagesPerPage === 3 && (
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                  Compact 3-photo presentation. Ideal for cataloging & contact sheets.
                </p>
                {/* Visual miniature representation */}
                <div className="w-full h-12 rounded bg-slate-200/70 p-1 flex flex-col gap-1">
                  <div className="w-full h-5 bg-white rounded border border-slate-300/80 flex items-center justify-center text-[9px] text-slate-400 font-medium">
                    Image 1 (Featured)
                  </div>
                  <div className="w-full flex-1 flex gap-1">
                    <div className="flex-1 bg-white rounded border border-slate-300/80 flex items-center justify-center text-[8px] text-slate-400 font-medium">
                      Img 2
                    </div>
                    <div className="flex-1 bg-white rounded border border-slate-300/80 flex items-center justify-center text-[8px] text-slate-400 font-medium">
                      Img 3
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Orientation & Layout Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* A4 Paper Orientation */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">A4 Orientation</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="orientation-portrait-btn"
                  onClick={() => setOrientation('portrait')}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors flex items-center justify-center gap-1.5 ${
                    orientation === 'portrait'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-2.5 h-3.5 border border-current rounded-xs" />
                  Portrait (210×297)
                </button>
                <button
                  type="button"
                  id="orientation-landscape-btn"
                  onClick={() => setOrientation('landscape')}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors flex items-center justify-center gap-1.5 ${
                    orientation === 'landscape'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-3.5 h-2.5 border border-current rounded-xs" />
                  Landscape (297×210)
                </button>
              </div>
            </div>

            {/* Image Fit Mode */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Image Fitting Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="fit-contain-btn"
                  onClick={() => setFitMode('contain')}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                    fitMode === 'contain'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Contain (Full Image)
                </button>
                <button
                  type="button"
                  id="fit-cover-btn"
                  onClick={() => setFitMode('cover')}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                    fitMode === 'cover'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Cover (Fill Slot)
                </button>
              </div>
            </div>
          </div>

          {/* 3-Image Specific Layout Selector */}
          {imagesPerPage === 3 && (
            <div className="space-y-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <label className="text-xs font-semibold text-slate-800">3-Image Arrangement Style</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="layout3-featured-btn"
                  onClick={() => setLayout3Style('featured-top')}
                  className={`px-3 py-2 text-xs rounded-lg border font-medium text-left transition-colors ${
                    layout3Style === 'featured-top'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  1 Featured Top + 2 Bottom
                </button>
                <button
                  type="button"
                  id="layout3-rows-btn"
                  onClick={() => setLayout3Style('equal-rows')}
                  className={`px-3 py-2 text-xs rounded-lg border font-medium text-left transition-colors ${
                    layout3Style === 'equal-rows'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  3 Equal Stacked Rows
                </button>
              </div>
            </div>
          )}

          {/* Performance Optimization Preset */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Automatic Web Performance Optimization
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                id="preset-ultralight-btn"
                onClick={() => setQualityPreset('ultralight')}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  qualityPreset === 'ultralight'
                    ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-bold text-slate-900">Ultra-Light</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Max ~85% reduction</div>
                <div className="text-[10px] text-emerald-700 font-medium mt-1">1400px • 68% Q</div>
              </button>

              <button
                type="button"
                id="preset-balanced-btn"
                onClick={() => setQualityPreset('balanced')}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  qualityPreset === 'balanced'
                    ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-bold text-slate-900">Balanced Web</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Recommended</div>
                <div className="text-[10px] text-emerald-700 font-medium mt-1">1920px • 82% Q</div>
              </button>

              <button
                type="button"
                id="preset-high-btn"
                onClick={() => setQualityPreset('high')}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  qualityPreset === 'high'
                    ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-bold text-slate-900">High Fidelity</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Crisp detail</div>
                <div className="text-[10px] text-emerald-700 font-medium mt-1">2400px • 92% Q</div>
              </button>
            </div>
          </div>

          {/* Export Output Format */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-indigo-600" />
              Target Export Output Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                id="output-pdf-btn"
                onClick={() => setOutputFormat('pdf')}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  outputFormat === 'pdf'
                    ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-bold text-slate-900">PDF Document</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Exact A4 Multipage</div>
              </button>

              <button
                type="button"
                id="output-jpg-btn"
                onClick={() => setOutputFormat('jpg')}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  outputFormat === 'jpg'
                    ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-bold text-slate-900">JPG Images</div>
                <div className="text-[11px] text-slate-500 mt-0.5">High-res sheets / ZIP</div>
              </button>

              <button
                type="button"
                id="output-both-btn"
                onClick={() => setOutputFormat('both')}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  outputFormat === 'both'
                    ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-bold text-slate-900">Both (PDF + JPG)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Complete bundle</div>
              </button>
            </div>
          </div>

          {/* Annotations & Page Header Title */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div>
              <label className="text-xs font-semibold text-slate-700">A4 Header Title (Optional)</label>
              <input
                type="text"
                id="page-header-title-input"
                value={pageHeaderTitle}
                onChange={(e) => setPageHeaderTitle(e.target.value)}
                placeholder="e.g. Gulf Way Group, Portfolio Batch Sheet..."
                className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  id="toggle-page-numbers-checkbox"
                  checked={showPageNumbers}
                  onChange={(e) => setShowPageNumbers(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Include Page Numbers (Page X of Y)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  id="toggle-captions-checkbox"
                  checked={showCaptions}
                  onChange={(e) => setShowCaptions(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Display Filename & Dimensions</span>
              </label>
            </div>
          </div>

          {/* Custom Watermark Layer Section (A4 Sheets & PDF Export) */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200/60 shrink-0">
                  <Stamp className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Custom Watermark Layer</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                      PDF EXPORT
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Overlay a custom text or logo watermark onto every generated A4 page during PDF export.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="toggle-watermark-checkbox"
                  checked={watermarkEnabled}
                  onChange={(e) => setWatermarkEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {watermarkEnabled && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3 mt-2 animate-fadeIn">
                {/* Type Selector: Text vs Image */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="watermark-type-text-btn"
                    onClick={() => setWatermarkType('text')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                      watermarkType === 'text'
                        ? 'bg-white border-indigo-600 text-indigo-700 shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-white'
                    }`}
                  >
                    <Type className="w-3.5 h-3.5" />
                    <span>Text Watermark</span>
                  </button>

                  <button
                    type="button"
                    id="watermark-type-image-btn"
                    onClick={() => {
                      setWatermarkType('image');
                      if (!watermarkImageUrl) {
                        setWatermarkImageUrl(DEFAULT_WATERMARK_LOGO);
                      }
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                      watermarkType === 'image'
                        ? 'bg-white border-indigo-600 text-indigo-700 shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-white'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Image / Logo Watermark</span>
                  </button>
                </div>

                {/* Text Settings */}
                {watermarkType === 'text' ? (
                  <div className="space-y-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Watermark Text
                      </label>
                      <input
                        type="text"
                        id="watermark-text-input"
                        value={watermarkText}
                        onChange={(e) => setWatermarkText(e.target.value)}
                        placeholder="e.g. CONFIDENTIAL, GULF WAY GROUP, DRAFT..."
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
                      />
                      {/* Quick text presets */}
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {['CONFIDENTIAL', 'GULF WAY GROUP', 'DRAFT', 'DO NOT COPY', 'INTERNAL ONLY'].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setWatermarkText(preset)}
                            className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                              watermarkText === preset
                                ? 'bg-indigo-100 text-indigo-800 border-indigo-300 font-bold'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Font Size */}
                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 flex items-center justify-between">
                          <span>Text Size</span>
                          <span className="font-mono text-indigo-600 font-bold">{watermarkFontSize}px</span>
                        </label>
                        <input
                          type="range"
                          min="28"
                          max="84"
                          step="2"
                          value={watermarkFontSize}
                          onChange={(e) => setWatermarkFontSize(Number(e.target.value))}
                          className="w-full mt-1 accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                        />
                      </div>

                      {/* Color */}
                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                          Watermark Tint
                        </label>
                        <div className="flex items-center gap-1.5">
                          {[
                            { label: 'Slate', color: '#334155' },
                            { label: 'Charcoal', color: '#0F172A' },
                            { label: 'Navy', color: '#1E3A8A' },
                            { label: 'Crimson', color: '#991B1B' },
                            { label: 'Amber', color: '#B45309' },
                          ].map((c) => (
                            <button
                              key={c.color}
                              type="button"
                              title={c.label}
                              onClick={() => setWatermarkColor(c.color)}
                              className={`w-6 h-6 rounded-full border-2 transition-transform ${
                                watermarkColor === c.color ? 'scale-110 ring-2 ring-indigo-500 border-white' : 'border-transparent hover:scale-105'
                              }`}
                              style={{ backgroundColor: c.color }}
                            />
                          ))}
                          <input
                            type="color"
                            value={watermarkColor}
                            onChange={(e) => setWatermarkColor(e.target.value)}
                            className="w-6 h-6 p-0 border border-slate-200 rounded cursor-pointer ml-1"
                            title="Custom Color"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Image Watermark Settings */
                  <div className="space-y-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Watermark Image (PNG with transparency recommended)
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 p-1">
                          {watermarkImageUrl ? (
                            <img src={watermarkImageUrl} alt="Watermark preview" className="w-full h-full object-contain" />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-slate-300" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <label className="cursor-pointer px-3 py-1.5 bg-white border border-slate-300 hover:border-indigo-500 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5">
                              <Upload className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Upload Image</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = () => {
                                      if (typeof reader.result === 'string') {
                                        setWatermarkImageUrl(reader.result);
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => setWatermarkImageUrl(DEFAULT_WATERMARK_LOGO)}
                              className="px-2.5 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-200 font-medium"
                            >
                              Official GW Emblem
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-500">Supports transparent PNG, SVG, JPG, or WebP</p>
                        </div>
                      </div>
                    </div>

                    {/* Image Scale Slider */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 flex items-center justify-between">
                        <span>Logo Size Relative to Sheet</span>
                        <span className="font-mono text-indigo-600 font-bold">{Math.round(watermarkImageScale * 100)}%</span>
                      </label>
                      <input
                        type="range"
                        min="0.15"
                        max="0.65"
                        step="0.05"
                        value={watermarkImageScale}
                        onChange={(e) => setWatermarkImageScale(Number(e.target.value))}
                        className="w-full mt-1 accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* Position & Angle Controls */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200/80">
                  <label className="text-[11px] font-semibold text-slate-700 block">
                    Placement &amp; Geometry
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                    {[
                      { id: 'center-diagonal', label: 'Diagonal', icon: '↗' },
                      { id: 'center', label: 'Center Flat', icon: '—' },
                      { id: 'bottom-right', label: 'Bottom Right', icon: '↘' },
                      { id: 'top-right', label: 'Top Right', icon: '↗' },
                      { id: 'repeat-pattern', label: 'Repeat Grid', icon: '⸬' },
                    ].map((pos) => (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() => setWatermarkPosition(pos.id as WatermarkPosition)}
                        className={`p-2 rounded-lg border text-center transition-all ${
                          watermarkPosition === pos.id
                            ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 text-xs'
                        }`}
                      >
                        <div className="text-sm font-black">{pos.icon}</div>
                        <div className="text-[10px] leading-tight truncate mt-0.5">{pos.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Opacity Slider */}
                <div className="pt-2 border-t border-slate-200/80">
                  <label className="text-[11px] font-semibold text-slate-700 flex items-center justify-between">
                    <span>Watermark Transparency / Opacity</span>
                    <span className="font-mono text-indigo-600 font-bold">{Math.round(watermarkOpacity * 100)}%</span>
                  </label>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-slate-400 font-mono">5%</span>
                    <input
                      type="range"
                      min="0.05"
                      max="0.55"
                      step="0.01"
                      value={watermarkOpacity}
                      onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                      className="flex-1 accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-400 font-mono">55%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Current: <strong className="text-slate-800">Max {imagesPerPage} images</strong> per A4 sheet
          </div>
          <div className="flex items-center gap-2">
            {!isInitialPrompt && (
              <button
                type="button"
                id="cancel-batch-config-btn"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              id="apply-batch-prompt-btn"
              onClick={handleApply}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              {isInitialPrompt ? 'Start With These Rules' : 'Apply Configuration'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
