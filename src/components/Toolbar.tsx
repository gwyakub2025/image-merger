import React, { useState } from 'react';
import { 
  Sliders, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Trash2, 
  FileArchive, 
  ChevronDown,
  Loader2,
  Menu,
  Sparkles
} from 'lucide-react';
import { BatchConfig, OutputFormat, BatchSet } from '../types';

interface ToolbarProps {
  config: BatchConfig;
  batches: BatchSet[];
  totalImagesCount: number;
  onOpenPromptModal: () => void;
  onOpenCreateImageModal?: () => void;
  onExportAll: (format?: OutputFormat) => void;
  onClearAll: () => void;
  isExporting: boolean;
  onToggleSidebar?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  config,
  batches,
  totalImagesCount,
  onOpenPromptModal,
  onOpenCreateImageModal,
  onExportAll,
  onClearAll,
  isExporting,
  onToggleSidebar,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const hasBatches = batches.length > 0;

  return (
    <header 
      id="high-density-header"
      className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0 z-20"
    >
      {/* Title & Constraint description */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-100"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 shadow-2xs">
              Gulf Way Group
            </span>
            <h1 className="text-sm font-bold text-slate-800 tracking-tight hidden xs:inline">
              Active Batch Processor
            </h1>
            <span className="hidden sm:inline-block px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-600 rounded">
              ISO 216
            </span>
          </div>
          <p className="text-xs text-slate-500 font-sans">
            Constraint: Max {config.imagesPerPage} assets per A4 sheet • {config.orientation.toUpperCase()}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* CLEAR ALL button */}
        {hasBatches && (
          <button
            type="button"
            id="header-clear-all-btn"
            onClick={onClearAll}
            className="px-3 sm:px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Clear All
          </button>
        )}

        {/* CREATE AI IMAGE button */}
        {onOpenCreateImageModal && (
          <button
            type="button"
            id="header-create-ai-image-btn"
            onClick={onOpenCreateImageModal}
            className="px-3 sm:px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Create with AI</span>
          </button>
        )}

        {/* TUNE RULES button */}
        <button
          type="button"
          id="header-configure-btn"
          onClick={onOpenPromptModal}
          className="px-3 sm:px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-2xs"
        >
          <Sliders className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Tune Prompt</span>
        </button>

        {/* PROCESS QUEUE / EXPORT ALL button with split dropdown */}
        <div className="relative">
          <div className="inline-flex rounded-md shadow-sm shadow-indigo-100">
            <button
              type="button"
              id="header-process-queue-btn"
              disabled={!hasBatches || isExporting}
              onClick={() => onExportAll(config.outputFormat)}
              className={`px-3.5 sm:px-4 py-2 text-white text-xs font-bold uppercase tracking-wider rounded-l-md transition-all flex items-center gap-1.5 ${
                !hasBatches || isExporting
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-xs'
              }`}
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>
                {isExporting
                  ? 'PROCESSING...'
                  : `PROCESS QUEUE (${batches.length})`}
              </span>
            </button>

            <button
              type="button"
              id="header-export-dropdown-toggle"
              disabled={!hasBatches || isExporting}
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`px-2 py-2 text-white border-l border-indigo-500 rounded-r-md transition-colors ${
                !hasBatches || isExporting
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          {/* Export Options Dropdown */}
          {dropdownOpen && hasBatches && (
            <div 
              id="header-export-dropdown"
              className="absolute right-0 mt-1.5 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 text-xs animate-in fade-in slide-in-from-top-1 duration-100"
            >
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                EXPORT FORMAT
              </div>

              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  onExportAll('pdf');
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-semibold"
              >
                <FileText className="w-4 h-4 text-indigo-600" />
                <div>
                  <div className="text-xs">PDF (Multi-page document)</div>
                  <div className="text-[10px] text-slate-400 font-normal">All A4 sheets in one file</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  onExportAll('jpg');
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-semibold"
              >
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                <div>
                  <div className="text-xs">JPG (Archive &amp; Sets)</div>
                  <div className="text-[10px] text-slate-400 font-normal">Zipped high-res JPG sheets</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  onExportAll('both');
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-semibold"
              >
                <FileArchive className="w-4 h-4 text-amber-600" />
                <div>
                  <div className="text-xs">Complete Bundle (ZIP + PDF)</div>
                  <div className="text-[10px] text-slate-400 font-normal">Both formats included</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
