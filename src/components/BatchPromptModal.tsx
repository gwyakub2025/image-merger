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
  X
} from 'lucide-react';
import { BatchConfig, Layout3Style, OutputFormat, PageOrientation, ImageFitMode } from '../types';

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
