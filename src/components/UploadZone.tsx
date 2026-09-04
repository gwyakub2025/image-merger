import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, FolderUp, Loader2 } from 'lucide-react';
import { ProcessingProgress } from '../types';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  onLoadSamples: () => void;
  onOpenCreateImageModal?: () => void;
  progress: ProcessingProgress;
  totalImagesCount: number;
  maxImagesPerPage: number;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFilesSelected,
  onLoadSamples,
  onOpenCreateImageModal,
  progress,
  maxImagesPerPage,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (folderInputRef.current) {
      folderInputRef.current.setAttribute('webkitdirectory', '');
      folderInputRef.current.setAttribute('directory', '');
    }
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fileList: File[] = Array.from(e.dataTransfer.files);
      const validFiles = fileList.filter((file) => file.type.startsWith('image/'));
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileList: File[] = Array.from(e.target.files);
      const validFiles = fileList.filter((file) => file.type.startsWith('image/'));
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
      e.target.value = '';
    }
  };

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        id="bulk-file-input"
        multiple
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        className="hidden"
        onChange={handleInputChange}
      />
      <input
        ref={folderInputRef}
        type="file"
        id="bulk-folder-input"
        multiple
        className="hidden"
        onChange={handleInputChange}
      />

      <div
        id="drop-zone-container"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`p-6 sm:p-7 transition-all border border-dashed rounded-lg m-2.5 flex flex-col items-center justify-center text-center cursor-pointer ${
          isDragOver
            ? 'border-indigo-600 bg-indigo-50/70'
            : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50/80'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-2.5 shadow-2xs">
          <UploadCloud className="w-5 h-5" />
        </div>

        <h3 className="text-sm font-bold text-slate-800 tracking-tight uppercase">
          Drop Bulk Images or Click to Browse
        </h3>

        <p className="text-xs text-slate-500 max-w-md mt-1 leading-relaxed">
          Batch engine automatically chunks photos into <strong className="text-indigo-600 font-mono">MAX {maxImagesPerPage} / A4 SHEET</strong> with web compression.
        </p>

        {/* Buttons inside dropzone */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-4" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            id="browse-files-btn"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold uppercase tracking-wider rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Select Files
          </button>

          <button
            type="button"
            id="browse-folder-btn"
            onClick={() => folderInputRef.current?.click()}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5"
          >
            <FolderUp className="w-3.5 h-3.5 text-slate-500" />
            Select Folder
          </button>

          <button
            type="button"
            id="load-sample-images-btn"
            onClick={onLoadSamples}
            className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Load 6 Demo Photos
          </button>

          {onOpenCreateImageModal && (
            <button
              type="button"
              id="uploadzone-create-ai-image-btn"
              onClick={onOpenCreateImageModal}
              className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-300 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Create with AI Prompt</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {progress.isProcessing && (
        <div id="upload-progress-container" className="px-5 py-3 bg-indigo-50/70 border-t border-indigo-100 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-indigo-900 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              {progress.statusText || 'Processing pipeline active...'}
            </span>
            <span className="font-mono text-indigo-700 font-bold">
              {progress.current} / {progress.total}
            </span>
          </div>
          <div className="w-full h-1.5 bg-indigo-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-150"
              style={{
                width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
