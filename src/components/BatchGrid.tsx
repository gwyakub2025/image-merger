import React, { useState } from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  Eye, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Layers, 
  Download,
  Plus,
  Check,
  Sliders,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { BatchSet, BatchConfig, UploadedImage, ImageFilterType } from '../types';
import { exportBatchAsPdf, downloadDataUrl } from '../utils/exportUtils';
import { formatBytes } from '../utils/imageOptimizer';
import { FILTER_OPTIONS, getFilterCss, getFilterOption } from '../utils/filterUtils';

interface BatchGridProps {
  batches: BatchSet[];
  config: BatchConfig;
  onPreviewBatch: (index: number) => void;
  onRemoveImage: (imageId: string) => void;
  onMoveImage: (imageId: string, direction: 'up' | 'down') => void;
  onUploadMore: () => void;
  onPreviewImage: (image: UploadedImage, batchIndex: number, slotIndex: number) => void;
  onUpdateFilter: (imageId: string, filter: ImageFilterType) => void;
  onApplyFilterToBatch?: (batchIndex: number, filter: ImageFilterType) => void;
}

export const BatchGrid: React.FC<BatchGridProps> = ({
  batches,
  config,
  onPreviewBatch,
  onRemoveImage,
  onMoveImage,
  onUploadMore,
  onPreviewImage,
  onUpdateFilter,
  onApplyFilterToBatch,
}) => {
  const [activeFilterPopoverId, setActiveFilterPopoverId] = useState<string | null>(null);
  const [activeBatchFilterMenuIdx, setActiveBatchFilterMenuIdx] = useState<number | null>(null);

  if (batches.length === 0) {
    return (
      <div 
        id="empty-batch-state"
        className="w-full bg-white rounded-xl border border-slate-200 shadow-2xs p-10 text-center flex flex-col items-center justify-center my-2"
      >
        <div className="w-12 h-12 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-3">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
          Batch Queue Empty
        </h3>
        <p className="text-xs text-slate-500 max-w-md mt-1 mb-5 leading-relaxed font-sans">
          Upload bulk files or load sample images. Each batch will automatically be chunked to <strong className="text-slate-900">max {config.imagesPerPage} images per A4 sheet</strong>.
        </p>
        <button
          onClick={onUploadMore}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Queue Images
        </button>
      </div>
    );
  }

  const maxSlots = config.imagesPerPage;

  return (
    <div className="w-full space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Active Batch Sheets
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded border border-indigo-200">
            {batches.length} {batches.length === 1 ? 'SHEET' : 'SHEETS'}
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-400">
          CONSTRAINT: MAX_{config.imagesPerPage}_PER_A4
        </div>
      </div>

      {/* Grid of A4 Batch Cards in High Density theme */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {batches.map((batch) => {
          const paddedIndex = String(batch.batchIndex + 1).padStart(3, '0');
          const isCapacityFull = batch.images.length === config.imagesPerPage;
          const emptySlotsCount = maxSlots - batch.images.length;
          const isBatchMenuOpen = activeBatchFilterMenuIdx === batch.batchIndex;

          return (
            <div
              key={batch.id}
              id={`batch-set-card-${paddedIndex}`}
              className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col shadow-2xs hover:border-indigo-300 transition-all group"
            >
              {/* Batch Card Header */}
              <div className="flex justify-between items-start mb-3 relative">
                <div>
                  <h3 className="text-xs font-bold font-mono text-slate-900 tracking-tight flex items-center gap-1.5">
                    <span>Batch_Set_{paddedIndex}</span>
                    <span className="text-slate-400 font-normal">
                      .{config.outputFormat === 'pdf' ? 'pdf' : 'jpg'}
                    </span>
                  </h3>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                    Paper: A4 ({config.orientation.toUpperCase()})
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Quick Batch Filter Menu */}
                  {onApplyFilterToBatch && (
                    <div className="relative">
                      <button
                        type="button"
                        id={`batch-${paddedIndex}-filter-menu-btn`}
                        onClick={() => setActiveBatchFilterMenuIdx(isBatchMenuOpen ? null : batch.batchIndex)}
                        className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold flex items-center gap-1 transition-colors"
                        title="Apply filter to all images in this sheet"
                      >
                        <Sparkles className="w-2.5 h-2.5 text-indigo-600" />
                        <span className="hidden sm:inline">Filter</span>
                        <ChevronDown className="w-2.5 h-2.5" />
                      </button>

                      {isBatchMenuOpen && (
                        <div 
                          className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-30 text-xs animate-in fade-in duration-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="px-2.5 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                            Apply Filter to Sheet
                          </div>
                          {FILTER_OPTIONS.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                onApplyFilterToBatch(batch.batchIndex, opt.id);
                                setActiveBatchFilterMenuIdx(null);
                              }}
                              className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 flex items-center justify-between text-slate-700 font-medium"
                            >
                              <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${
                                  opt.id === 'none' ? 'bg-slate-400' :
                                  opt.id === 'grayscale' ? 'bg-slate-800' :
                                  opt.id === 'sepia' ? 'bg-amber-600' : 'bg-indigo-600'
                                }`} />
                                <span>{opt.label}</span>
                              </div>
                              <span className="text-[9px] font-mono text-slate-400">
                                {opt.shortLabel}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold font-mono rounded uppercase tracking-wider ${
                      isCapacityFull
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {isCapacityFull ? 'READY' : `${batch.images.length}/${maxSlots} SLOTS`}
                  </span>
                </div>
              </div>

              {/* Visual Aspect Ratio Representation (High Density aspect-[1/1.414]) */}
              <div className="flex gap-2 mb-3 select-none">
                {batch.images.map((img, imgIdx) => {
                  const filterOption = getFilterOption(img.filter);
                  const isFiltered = img.filter && img.filter !== 'none';
                  const isFilterPopoverOpen = activeFilterPopoverId === img.id;

                  return (
                    <div
                      key={img.id}
                      id={`image-slot-${img.id}`}
                      className="flex-1 aspect-[1/1.414] bg-slate-100 border border-slate-200 rounded-lg p-1.5 flex flex-col items-center justify-between text-slate-500 relative group/slot cursor-pointer transition-all hover:shadow-xs"
                      onClick={() => onPreviewImage(img, batch.batchIndex, imgIdx)}
                    >
                      {/* Image Thumbnail with CSS Filter */}
                      <div className="w-full flex-1 rounded overflow-hidden bg-white border border-slate-200 mb-1 relative flex items-center justify-center">
                        <img 
                          src={img.compressedDataUrl} 
                          alt={img.name} 
                          style={{ filter: getFilterCss(img.filter) }}
                          className="w-full h-full object-cover transition-all duration-150"
                        />

                        {/* Filter Badge Pill if filtered */}
                        {isFiltered && (
                          <div className={`absolute top-1 right-1 px-1 py-0.2 rounded text-[8px] font-mono font-bold uppercase tracking-wider shadow-2xs ${filterOption.badgeBg} ${filterOption.badgeText}`}>
                            {filterOption.shortLabel}
                          </div>
                        )}
                      </div>

                      {/* Slot metadata line */}
                      <div className="w-full flex items-center justify-between px-0.5 text-[9px] font-mono text-slate-600">
                        <span>IMG_{String(imgIdx + 1).padStart(2, '0')}</span>
                        {isFiltered ? (
                          <span className="text-[8px] font-bold text-indigo-600 truncate max-w-[55px]">
                            {filterOption.shortLabel}
                          </span>
                        ) : (
                          <span className="text-[8px] text-slate-400">STD</span>
                        )}
                      </div>

                      {/* Slot hover overlay with individual preview & filter actions */}
                      <div 
                        className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover/slot:opacity-100 transition-opacity flex flex-col justify-between p-1.5 z-10 rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Top: Reorder & Delete Bar */}
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-0.5">
                            {imgIdx > 0 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMoveImage(img.id, 'up');
                                }}
                                className="p-1 bg-white/90 text-slate-800 rounded hover:bg-white transition-colors"
                                title="Move Earlier"
                              >
                                <ArrowUp className="w-2.5 h-2.5" />
                              </button>
                            )}
                            {imgIdx < batch.images.length - 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMoveImage(img.id, 'down');
                                }}
                                className="p-1 bg-white/90 text-slate-800 rounded hover:bg-white transition-colors"
                                title="Move Later"
                              >
                                <ArrowDown className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveImage(img.id);
                            }}
                            className="p-1 bg-red-600/90 text-white rounded hover:bg-red-700 transition-colors"
                            title="Remove from batch"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>

                        {/* Center: Inspect / Preview Menu button */}
                        <div className="flex flex-col items-center justify-center gap-1.5 my-auto">
                          <button
                            type="button"
                            id={`preview-menu-btn-${img.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onPreviewImage(img, batch.batchIndex, imgIdx);
                            }}
                            className="w-full py-1 px-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase tracking-wider rounded flex items-center justify-center gap-1 shadow-xs transition-colors"
                            title="Open Preview & Filters Menu"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Preview</span>
                          </button>

                          {/* Quick Filter Menu Trigger */}
                          <div className="relative w-full">
                            <button
                              type="button"
                              id={`quick-filter-btn-${img.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveFilterPopoverId(isFilterPopoverOpen ? null : img.id);
                              }}
                              className="w-full py-0.5 px-1.5 bg-white/90 hover:bg-white text-slate-800 text-[9px] font-bold font-mono rounded flex items-center justify-center gap-1 transition-colors"
                              title="Quick Filter Menu"
                            >
                              <Sliders className="w-2.5 h-2.5 text-indigo-600" />
                              <span className="truncate">{filterOption.shortLabel}</span>
                              <ChevronDown className="w-2 h-2 text-slate-400" />
                            </button>

                            {/* Inline Filter Selection Popover Menu */}
                            {isFilterPopoverOpen && (
                              <div
                                id={`filter-popover-${img.id}`}
                                className="absolute left-0 right-0 bottom-full mb-1 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-30 text-xs animate-in fade-in duration-100"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="px-2 py-0.5 text-[8px] font-bold font-mono text-slate-400 uppercase border-b border-slate-100">
                                  Filter Style
                                </div>
                                {FILTER_OPTIONS.map((opt) => (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => {
                                      onUpdateFilter(img.id, opt.id);
                                      setActiveFilterPopoverId(null);
                                    }}
                                    className={`w-full text-left px-2 py-1 flex items-center justify-between text-[10px] transition-colors ${
                                      img.filter === opt.id || (!img.filter && opt.id === 'none')
                                        ? 'bg-indigo-50 font-bold text-indigo-700'
                                        : 'hover:bg-slate-50 text-slate-700'
                                    }`}
                                  >
                                    <span>{opt.label}</span>
                                    {(img.filter === opt.id || (!img.filter && opt.id === 'none')) && (
                                      <Check className="w-2.5 h-2.5 text-indigo-600 stroke-[3]" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Bottom: Filter status label */}
                        <div className="text-[8px] font-mono text-center text-slate-300">
                          {isFiltered ? `${filterOption.label} Active` : 'Click to Inspect'}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Empty Slots if any */}
                {Array.from({ length: emptySlotsCount }).map((_, emptyIdx) => (
                  <div
                    key={`empty-${emptyIdx}`}
                    className="flex-1 aspect-[1/1.414] border border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-300 italic text-[10px] font-mono"
                  >
                    Empty Slot
                  </div>
                ))}
              </div>

              {/* Full A4 Sheet Thumbnail with Click Preview */}
              <div
                className="relative bg-slate-50 border border-slate-100 rounded-lg p-2.5 mb-3 flex items-center justify-center cursor-pointer hover:bg-slate-100/80 transition-colors"
                onClick={() => onPreviewBatch(batch.batchIndex)}
              >
                <div
                  className={`bg-white shadow-xs border border-slate-200 overflow-hidden relative ${
                    config.orientation === 'portrait' ? 'w-24 aspect-[210/297]' : 'w-32 aspect-[297/210]'
                  }`}
                >
                  {batch.renderedJpgUrl ? (
                    <img
                      src={batch.renderedJpgUrl}
                      alt={`Batch ${batch.batchIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-400">
                      ...
                    </div>
                  )}
                </div>
                <div className="ml-3 text-left flex-1">
                  <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                    <Eye className="w-3 h-3 text-indigo-600" />
                    <span>Inspect A4 Layout</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Click to view full 210×297mm print canvas
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => {
                    if (batch.renderedJpgUrl) {
                      downloadDataUrl(batch.renderedJpgUrl, `Batch_Set_${paddedIndex}.jpg`);
                    }
                  }}
                  className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-1"
                >
                  <ImageIcon className="w-3 h-3 text-indigo-600" />
                  <span>JPG Sheet</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportBatchAsPdf(batch, config, `Batch_Set_${paddedIndex}.pdf`)}
                  className="py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-1 shadow-2xs"
                >
                  <FileText className="w-3 h-3" />
                  <span>PDF A4</span>
                </button>
              </div>

              {/* High Density Status Footer */}
              <div className="mt-auto pt-2.5 border-t border-slate-100 flex justify-between items-center text-[11px] font-mono">
                <span className="text-slate-400">A4_CONTAINER_OK</span>
                <span className="text-indigo-600 font-bold">READY</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
