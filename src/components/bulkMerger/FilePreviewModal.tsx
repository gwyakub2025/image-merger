import React, { useState } from 'react';
import {
  X,
  FileText,
  Image as ImageIcon,
  RotateCw,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Hash,
  Maximize2,
  Trash2,
} from 'lucide-react';
import { MergeQueueItem } from '../../types/bulkMerger';
import { parsePageRange, validatePageRange } from '../../utils/bulkMergerEngine';

interface FilePreviewModalProps {
  item: MergeQueueItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateRotation: (id: string, rotation: number) => void;
  onUpdatePageRange: (id: string, range: string) => void;
  onRemoveItem: (id: string) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  item,
  isOpen,
  onClose,
  onUpdateRotation,
  onUpdatePageRange,
  onRemoveItem,
}) => {
  if (!isOpen || !item) return null;

  const [localRange, setLocalRange] = useState(item.pageRange);
  const isValidRange = validatePageRange(localRange, item.pageCount);
  const parsedPages = isValidRange ? parsePageRange(localRange, item.pageCount) : [];

  const handleRangeChange = (val: string) => {
    setLocalRange(val);
    if (validatePageRange(val, item.pageCount)) {
      onUpdatePageRange(item.id, val);
    }
  };

  const handleRotate = () => {
    const nextRot = (item.rotation + 90) % 360;
    onUpdateRotation(item.id, nextRot);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div
      id="file-preview-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="file-preview-modal-content"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shrink-0">
              {item.type === 'pdf' ? (
                <FileText className="w-5 h-5" />
              ) : item.type === 'image' ? (
                <ImageIcon className="w-5 h-5" />
              ) : item.type === 'excel' ? (
                <FileSpreadsheet className="w-5 h-5" />
              ) : (
                <FileCode className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-800 truncate" title={item.name}>
                {item.name}
              </h3>
              <div className="flex items-center gap-2 text-2xs text-slate-500 font-mono mt-0.5">
                <span className="uppercase font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded">
                  {item.type}
                </span>
                <span>•</span>
                <span>{formatSize(item.size)}</span>
                <span>•</span>
                <span>{item.pageCount} page(s)</span>
                {item.dimensions && (
                  <>
                    <span>•</span>
                    <span>{item.dimensions.width} × {item.dimensions.height} px</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="file-modal-rotate-btn"
              onClick={handleRotate}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Rotate 90 degrees clockwise"
            >
              <RotateCw className="w-4 h-4 text-blue-600" />
              <span>{item.rotation}°</span>
            </button>
            <button
              type="button"
              id="file-modal-close-btn"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Main Visual Preview Area */}
          <div className="relative bg-slate-100/70 border border-slate-200 rounded-xl p-4 flex items-center justify-center min-h-[260px] max-h-[380px] overflow-hidden">
            {item.thumbnailUrl ? (
              <img
                src={item.thumbnailUrl}
                alt={item.name}
                className="max-h-[320px] max-w-full object-contain rounded shadow-xs transition-transform duration-200"
                style={{ transform: `rotate(${item.rotation}deg)` }}
              />
            ) : (
              <div className="text-center text-slate-400 py-12">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Preview unavailable for this format</p>
              </div>
            )}
          </div>

          {/* PDF Page Range Picker (Only for PDF with multiple pages) */}
          {item.type === 'pdf' && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-blue-600" />
                  <span>Pages to Include in Merge</span>
                </label>
                <span className="text-2xs text-slate-500 font-mono">
                  Total in Document: {item.pageCount}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  id="file-modal-page-range-input"
                  value={localRange}
                  onChange={(e) => handleRangeChange(e.target.value)}
                  placeholder="e.g. all, 1-3, 5, 7-10"
                  className={`flex-1 px-3 py-1.5 text-xs font-mono rounded-lg border bg-white focus:outline-hidden transition-all ${
                    isValidRange
                      ? 'border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                      : 'border-red-300 focus:border-red-500 bg-red-50/30'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => handleRangeChange('all')}
                  className="px-2.5 py-1.5 text-2xs font-semibold bg-white border border-slate-200 hover:border-blue-300 rounded-lg text-slate-600 hover:text-blue-700 cursor-pointer transition-colors"
                >
                  All Pages
                </button>
              </div>

              {/* Range Validation Status */}
              <div className="flex items-center gap-1.5 text-2xs">
                {isValidRange ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-emerald-700">
                      Including <strong>{parsedPages.length}</strong> of {item.pageCount} page(s):{' '}
                      <span className="font-mono">{parsedPages.slice(0, 10).join(', ')}{parsedPages.length > 10 ? '...' : ''}</span>
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span className="text-red-600">
                      Invalid page range syntax. Use numbers separated by commas or hyphens (e.g. 1-3, 5).
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Text / Data preview snippet if available */}
          {item.previewText && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">
                Content Synopsis
              </span>
              <p className="text-xs text-slate-700 font-mono leading-relaxed line-clamp-4 bg-white p-2.5 rounded border border-slate-200/70 select-text">
                {item.previewText}
              </p>
            </div>
          )}

          {/* Excel Table Data Preview */}
          {item.tableData && item.tableData.length > 0 && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">
                Sample Spreadsheet Rows (First Sheet)
              </span>
              <div className="overflow-x-auto border border-slate-200 rounded bg-white max-h-40">
                <table className="w-full text-2xs text-left">
                  <tbody>
                    {item.tableData.slice(0, 6).map((row, rIdx) => (
                      <tr key={rIdx} className={rIdx === 0 ? 'bg-slate-100 font-bold' : 'border-t border-slate-100'}>
                        {row.map((cell: any, cIdx: number) => (
                          <td key={cIdx} className="px-2 py-1 truncate max-w-[120px] text-slate-700">
                            {cell != null ? String(cell) : ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            id="file-modal-delete-btn"
            onClick={() => {
              onRemoveItem(item.id);
              onClose();
            }}
            className="text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Remove from Queue</span>
          </button>

          <button
            type="button"
            id="file-modal-done-btn"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
