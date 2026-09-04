import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Sliders, 
  Sparkles, 
  RotateCcw, 
  Check, 
  Layers, 
  SplitSquareVertical,
  Wand2,
  Loader2,
  AlertCircle,
  Plus,
  RefreshCw
} from 'lucide-react';
import { UploadedImage, ImageFilterType } from '../types';
import { FILTER_OPTIONS, getFilterCss, getFilterOption } from '../utils/filterUtils';
import { formatBytes } from '../utils/imageOptimizer';
import { editImageWithGemini, convertDataUrlToUploadedImage } from '../utils/geminiImageApi';

interface ImagePreviewMenuModalProps {
  image: UploadedImage | null;
  isOpen: boolean;
  onClose: () => void;
  onApplyFilter: (imageId: string, filter: ImageFilterType) => void;
  onApplyFilterToBatch?: (filter: ImageFilterType) => void;
  onApplyFilterToAll?: (filter: ImageFilterType) => void;
  onReplaceImage?: (oldId: string, newImage: UploadedImage) => void;
  onAddImage?: (newImage: UploadedImage) => void;
  allImages: UploadedImage[];
  onSelectImage: (image: UploadedImage) => void;
  batchIndex?: number;
  slotIndex?: number;
}

const AI_EDIT_SUGGESTIONS = [
  { label: 'Golden Hour', prompt: 'Add warm golden hour sunset lighting with soft orange highlights and gentle shadows' },
  { label: 'Clean Studio', prompt: 'Place subject against a clean, minimalist studio backdrop with professional softbox lighting' },
  { label: 'Watercolor Painting', prompt: 'Transform this photograph into an artistic watercolor painting with delicate pigment textures' },
  { label: 'Lush Garden', prompt: 'Add lush green botanical foliage, exotic flowers, and soft natural bokeh to the background' },
  { label: 'Vintage 35mm', prompt: 'Give this photo an authentic 35mm analog film aesthetic with subtle warm grain and retro color tone' },
];

export const ImagePreviewMenuModal: React.FC<ImagePreviewMenuModalProps> = ({
  image,
  isOpen,
  onClose,
  onApplyFilter,
  onApplyFilterToBatch,
  onApplyFilterToAll,
  onReplaceImage,
  onAddImage,
  allImages,
  onSelectImage,
  batchIndex,
  slotIndex,
}) => {
  const [activeTab, setActiveTab] = useState<'filters' | 'ai_edit'>('filters');
  const [selectedFilter, setSelectedFilter] = useState<ImageFilterType>('none');
  const [showOriginalComparison, setShowOriginalComparison] = useState(false);

  // AI Edit state
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editedDataUrl, setEditedDataUrl] = useState<string | null>(null);
  const [isSavingAiEdit, setIsSavingAiEdit] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (image) {
      setSelectedFilter(image.filter || 'none');
      setShowOriginalComparison(false);
      setEditedDataUrl(null);
      setEditError(null);
      setSaveSuccessMsg(null);
    }
  }, [image]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || !image) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && activeTab === 'filters') {
        handlePrev();
      } else if (e.key === 'ArrowRight' && activeTab === 'filters') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, image, allImages, activeTab]);

  if (!isOpen || !image) return null;

  const currentIdx = allImages.findIndex((img) => img.id === image.id);
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx < allImages.length - 1;

  const handlePrev = () => {
    if (hasPrev) {
      onSelectImage(allImages[currentIdx - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      onSelectImage(allImages[currentIdx + 1]);
    }
  };

  const handleSelectFilter = (filterId: ImageFilterType) => {
    setSelectedFilter(filterId);
    onApplyFilter(image.id, filterId);
  };

  const handleAiEditSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editPrompt.trim() || isEditing) return;

    setIsEditing(true);
    setEditError(null);
    setSaveSuccessMsg(null);

    try {
      const res = await editImageWithGemini(
        editPrompt.trim(),
        image.compressedDataUrl,
        'image/jpeg'
      );
      setEditedDataUrl(res.dataUrl);
    } catch (err: any) {
      setEditError(err?.message || 'Failed to edit image with Gemini.');
    } finally {
      setIsEditing(false);
    }
  };

  const handleApplyAiEditReplace = async () => {
    if (!editedDataUrl || !onReplaceImage || isSavingAiEdit) return;
    setIsSavingAiEdit(true);
    try {
      const filename = `gemini-edited-${image.name.replace(/\.[^/.]+$/, '')}.jpg`;
      const newImg = await convertDataUrlToUploadedImage(editedDataUrl, filename);
      onReplaceImage(image.id, newImg);
      setSaveSuccessMsg('Replaced original with AI edited image!');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err: any) {
      setEditError(`Failed to save replacement: ${err?.message || err}`);
    } finally {
      setIsSavingAiEdit(false);
    }
  };

  const handleApplyAiEditAddAsNew = async () => {
    if (!editedDataUrl || !onAddImage || isSavingAiEdit) return;
    setIsSavingAiEdit(true);
    try {
      const filename = `gemini-variant-${image.name.replace(/\.[^/.]+$/, '')}.jpg`;
      const newImg = await convertDataUrlToUploadedImage(editedDataUrl, filename);
      onAddImage(newImg);
      setSaveSuccessMsg('Added as new variant to batch queue!');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err: any) {
      setEditError(`Failed to add variant: ${err?.message || err}`);
    } finally {
      setIsSavingAiEdit(false);
    }
  };

  const activeOption = getFilterOption(selectedFilter);

  // Determine current image display src
  const displaySrc = (activeTab === 'ai_edit' && editedDataUrl && !showOriginalComparison)
    ? editedDataUrl
    : image.compressedDataUrl;

  const displayFilter = (activeTab === 'ai_edit' && editedDataUrl)
    ? 'none'
    : (showOriginalComparison ? 'none' : getFilterCss(selectedFilter));

  return (
    <div
      id="individual-image-preview-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              {activeTab === 'ai_edit' ? <Wand2 className="w-4 h-4" /> : <Sliders className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  {activeTab === 'ai_edit' ? 'AI Text Prompt Image Editor' : 'Individual Image Preview & Filters'}
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-200 text-slate-700 font-bold rounded">
                  IMG_{String(currentIdx + 1).padStart(2, '0')}
                </span>
                {batchIndex !== undefined && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-indigo-50 text-indigo-700 font-bold rounded border border-indigo-200">
                    BATCH #{batchIndex + 1}
                  </span>
                )}
                {activeTab === 'ai_edit' && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-indigo-100 text-indigo-800 font-bold rounded">
                    gemini-3.1-flash-image-preview
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-mono truncate max-w-sm sm:max-w-md">
                {image.name} • {image.compressedWidth} × {image.compressedHeight}px • {formatBytes(image.compressedSize)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Navigation Between Images */}
            <div className="flex items-center bg-slate-200/60 rounded-lg p-0.5 mr-2">
              <button
                type="button"
                id="preview-prev-img-btn"
                disabled={!hasPrev}
                onClick={handlePrev}
                className="p-1.5 rounded hover:bg-white text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="Previous Image (←)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono font-semibold px-2 text-slate-600 select-none">
                {currentIdx + 1} / {allImages.length}
              </span>
              <button
                type="button"
                id="preview-next-img-btn"
                disabled={!hasNext}
                onClick={handleNext}
                className="p-1.5 rounded hover:bg-white text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="Next Image (→)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              id="close-image-preview-modal-btn"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mode Navigation Tabs */}
        <div className="px-5 py-2 bg-slate-100/70 border-b border-slate-200 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('filters')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
              activeTab === 'filters'
                ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Preset Filters</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai_edit')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
              activeTab === 'ai_edit'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Prompt Edit</span>
            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-white/20 uppercase">
              Gemini
            </span>
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-y-auto min-h-0 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          {/* Left / Center: Interactive Preview Canvas Area */}
          <div className="flex-1 bg-slate-950/5 flex flex-col items-center justify-center p-4 sm:p-6 relative min-h-[280px] sm:min-h-[380px] select-none">
            {/* Display container */}
            <div className="relative max-w-full max-h-[50vh] sm:max-h-[54vh] rounded-xl overflow-hidden shadow-md border border-slate-200 bg-white flex items-center justify-center">
              <img
                id="modal-filtered-image-display"
                src={displaySrc}
                alt={image.name}
                style={{
                  filter: displayFilter,
                }}
                className="max-h-[48vh] w-auto object-contain transition-all duration-150"
              />

              {/* Status pill badge on preview */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-mono shadow-xs">
                <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                <span>
                  {showOriginalComparison
                    ? 'ORIGINAL SOURCE'
                    : (activeTab === 'ai_edit' && editedDataUrl)
                    ? 'GEMINI AI EDITED'
                    : activeOption.label.toUpperCase()}
                </span>
              </div>

              {/* Compare toggle button on bottom */}
              <button
                type="button"
                id="toggle-compare-original-btn"
                onMouseDown={() => setShowOriginalComparison(true)}
                onMouseUp={() => setShowOriginalComparison(false)}
                onMouseLeave={() => setShowOriginalComparison(false)}
                onTouchStart={() => setShowOriginalComparison(true)}
                onTouchEnd={() => setShowOriginalComparison(false)}
                className="absolute bottom-3 right-3 px-2.5 py-1.5 rounded-md bg-slate-900/80 hover:bg-slate-900 backdrop-blur-xs text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer select-none"
                title="Hold to see original without modifications"
              >
                <SplitSquareVertical className="w-3.5 h-3.5 text-indigo-400" />
                <span>Hold to Compare</span>
              </button>
            </div>

            {/* Quick helper tip */}
            <div className="mt-2.5 text-[11px] text-slate-400 font-mono text-center">
              {activeTab === 'ai_edit'
                ? 'AI prompt edits create high-fidelity generative transformations using gemini-3.1-flash-image-preview'
                : 'Filter applies in real-time to both this card and the compiled A4 sheet.'}
            </div>
          </div>

          {/* Right Panel: Controls */}
          <div className="w-full md:w-88 p-5 flex flex-col justify-between bg-white shrink-0 overflow-y-auto">
            {activeTab === 'filters' ? (
              /* TAB 1: PRESET FILTERS */
              <div>
                {/* Section Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Choose Filter Style</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectFilter('none')}
                    className="text-[10px] text-slate-500 hover:text-indigo-600 font-mono flex items-center gap-1 transition-colors"
                    title="Reset to original color"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>

                {/* 4 Filter Cards Grid */}
                <div className="space-y-2.5" id="image-filter-options-group">
                  {FILTER_OPTIONS.map((opt) => {
                    const isSelected = selectedFilter === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        id={`filter-opt-${opt.id}`}
                        onClick={() => handleSelectFilter(opt.id)}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/60 shadow-2xs ring-1 ring-indigo-500'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 bg-white'
                        }`}
                      >
                        {/* Mini Live Preview Thumbnail */}
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 relative">
                          <img
                            src={image.compressedDataUrl}
                            alt={opt.label}
                            style={{ filter: opt.cssFilter }}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Text details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-900">
                              {opt.label}
                            </span>
                            <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${opt.badgeBg} ${opt.badgeText}`}>
                              {opt.shortLabel}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                            {opt.description}
                          </p>
                        </div>

                        {/* Check indicator */}
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Batch Propagation Options */}
                <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Batch Sync Actions
                  </div>

                  {onApplyFilterToBatch && (
                    <button
                      type="button"
                      id="apply-filter-to-batch-btn"
                      onClick={() => onApplyFilterToBatch(selectedFilter)}
                      className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center justify-between"
                    >
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-slate-500" />
                        <span>Apply to this Sheet</span>
                      </span>
                      <span className="text-[10px] font-mono text-indigo-600 uppercase font-bold">
                        {activeOption.shortLabel}
                      </span>
                    </button>
                  )}

                  {onApplyFilterToAll && (
                    <button
                      type="button"
                      id="apply-filter-to-all-btn"
                      onClick={() => onApplyFilterToAll(selectedFilter)}
                      className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center justify-between"
                    >
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Apply to All Queued</span>
                      </span>
                      <span className="text-[10px] font-mono text-indigo-600 uppercase font-bold">
                        ALL ({allImages.length})
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* TAB 2: AI PROMPT EDIT (gemini-3.1-flash-image-preview) */
              <div className="space-y-4">
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Edit with Text Prompt</span>
                    </span>
                    <span className="text-[9px] font-mono text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
                      Gemini 3.1
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Instruct the AI model how to modify this specific image (e.g. change lighting, style, add elements, adjust background).
                  </p>

                  <form onSubmit={handleAiEditSubmit} className="space-y-2.5">
                    <textarea
                      id="gemini-edit-prompt-textarea"
                      rows={3}
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      placeholder="E.g. Add golden hour sunset lighting with soft reflections..."
                      className="w-full bg-slate-50 border border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 rounded-xl p-3 text-xs text-slate-900 placeholder:text-slate-400 font-sans"
                    />

                    {/* Suggestion Chips */}
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Quick Inspiration:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {AI_EDIT_SUGGESTIONS.map((sug, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setEditPrompt(sug.prompt)}
                            className="px-2 py-0.5 text-[10px] rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 border border-slate-200 transition-colors"
                          >
                            {sug.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      id="submit-ai-edit-btn"
                      disabled={!editPrompt.trim() || isEditing}
                      className={`w-full py-2.5 px-3 rounded-xl text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xs ${
                        !editPrompt.trim() || isEditing
                          ? 'bg-indigo-300 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      {isEditing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating AI Edit...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Apply AI Edit</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Edit Error */}
                {editError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Edit Error</div>
                      <div>{editError}</div>
                    </div>
                  </div>
                )}

                {/* Save success message */}
                {saveSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-semibold">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{saveSuccessMsg}</span>
                  </div>
                )}

                {/* AI Edit Result actions */}
                {editedDataUrl && (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Apply Edited Image
                    </div>

                    {onReplaceImage && (
                      <button
                        type="button"
                        id="replace-with-ai-edit-btn"
                        onClick={handleApplyAiEditReplace}
                        disabled={isSavingAiEdit}
                        className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        {isSavingAiEdit ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                        <span>Replace This Image in Queue</span>
                      </button>
                    )}

                    {onAddImage && (
                      <button
                        type="button"
                        id="add-ai-edit-as-new-btn"
                        onClick={handleApplyAiEditAddAsNew}
                        disabled={isSavingAiEdit}
                        className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add as New Variant</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Bottom Done / Save Button */}
            <div className="pt-4 border-t border-slate-100 mt-4">
              <button
                type="button"
                id="done-image-filter-btn"
                onClick={onClose}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Return to Grid</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
