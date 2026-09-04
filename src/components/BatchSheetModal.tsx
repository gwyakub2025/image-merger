import React, { useState } from 'react';
import { 
  X, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  FileText, 
  Image as ImageIcon,
  Check
} from 'lucide-react';
import { BatchSet, BatchConfig } from '../types';
import { exportBatchAsPdf, downloadDataUrl } from '../utils/exportUtils';

interface BatchSheetModalProps {
  batch: BatchSet | null;
  totalBatches: number;
  config: BatchConfig;
  onClose: () => void;
  onSelectBatch: (index: number) => void;
}

export const BatchSheetModal: React.FC<BatchSheetModalProps> = ({
  batch,
  totalBatches,
  config,
  onClose,
  onSelectBatch,
}) => {
  const [zoom, setZoom] = useState(1);
  const [isCopied, setIsCopied] = useState(false);

  if (!batch) return null;

  const handlePrev = () => {
    if (batch.batchIndex > 0) {
      onSelectBatch(batch.batchIndex - 1);
    }
  };

  const handleNext = () => {
    if (batch.batchIndex < totalBatches - 1) {
      onSelectBatch(batch.batchIndex + 1);
    }
  };

  const handleDownloadJpg = () => {
    if (batch.renderedJpgUrl) {
      downloadDataUrl(batch.renderedJpgUrl, `a4-batch-sheet-${batch.batchIndex + 1}.jpg`);
    }
  };

  const handleDownloadPdf = async () => {
    await exportBatchAsPdf(batch, config);
  };

  return (
    <div
      id="batch-sheet-modal-backdrop"
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/85 backdrop-blur-md overflow-hidden text-white"
    >
      {/* Top Navbar */}
      <div className="h-16 px-4 sm:px-6 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200">
            <span>A4 Sheet Preview</span>
            <span className="text-indigo-400">•</span>
            <span>
              Batch {batch.batchIndex + 1} of {totalBatches}
            </span>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            ({batch.images.length} images • {config.orientation} A4)
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 mr-2">
            <button
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
              className="p-1.5 hover:bg-slate-700 text-slate-300 rounded"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono px-2 text-slate-300">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(1.8, z + 0.2))}
              className="p-1.5 hover:bg-slate-700 text-slate-300 rounded"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <button
            id="modal-download-jpg-btn"
            onClick={handleDownloadJpg}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Download JPG</span>
          </button>

          <button
            id="modal-download-pdf-btn"
            onClick={handleDownloadPdf}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>

          <button
            id="modal-close-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Preview Canvas Body */}
      <div className="flex-1 relative flex items-center justify-center p-4 sm:p-8 overflow-auto">
        {/* Navigation arrows */}
        {batch.batchIndex > 0 && (
          <button
            onClick={handlePrev}
            id="modal-prev-batch-btn"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white border border-slate-700 flex items-center justify-center transition-all shadow-lg"
            title="Previous Sheet"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {batch.batchIndex < totalBatches - 1 && (
          <button
            onClick={handleNext}
            id="modal-next-batch-btn"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white border border-slate-700 flex items-center justify-center transition-all shadow-lg"
            title="Next Sheet"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* The rendered A4 page image */}
        <div
          className="transition-transform duration-150 ease-out shadow-2xl bg-white rounded-sm overflow-hidden"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
            maxWidth: '92vw',
            maxHeight: '82vh',
          }}
        >
          {batch.renderedJpgUrl ? (
            <img
              src={batch.renderedJpgUrl}
              alt={`Batch Sheet ${batch.batchIndex + 1}`}
              className="w-auto h-auto max-h-[82vh] object-contain select-none pointer-events-none"
            />
          ) : (
            <div className="p-12 text-slate-500 text-sm">Rendering preview...</div>
          )}
        </div>
      </div>

      {/* Footer thumbnail list of images in this batch */}
      <div className="h-16 px-6 bg-slate-900/95 border-t border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">Included in this A4 batch:</span>
          <div className="flex items-center gap-2">
            {batch.images.map((img, idx) => (
              <div
                key={img.id}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 rounded-md border border-slate-700 text-xs text-slate-300"
              >
                <span className="font-mono text-indigo-400 font-semibold">#{idx + 1}</span>
                <span className="truncate max-w-[140px]">{img.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          ISO 216 standard A4: 210 × 297 mm
        </div>
      </div>
    </div>
  );
};
