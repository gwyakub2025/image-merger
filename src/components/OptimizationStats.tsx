import React from 'react';
import { TrendingDown, HardDrive, Layers, Image as ImageIcon } from 'lucide-react';
import { UploadedImage, BatchSet } from '../types';
import { formatBytes } from '../utils/imageOptimizer';

interface OptimizationStatsProps {
  images: UploadedImage[];
  batches: BatchSet[];
  maxImagesPerPage: number;
}

export const OptimizationStats: React.FC<OptimizationStatsProps> = ({
  images,
  batches,
  maxImagesPerPage,
}) => {
  if (images.length === 0) return null;

  const totalOriginalBytes = images.reduce((acc, img) => acc + img.originalSize, 0);
  const totalOptimizedBytes = images.reduce((acc, img) => acc + img.compressedSize, 0);
  const bytesSaved = Math.max(0, totalOriginalBytes - totalOptimizedBytes);
  const percentageSaved = totalOriginalBytes > 0 
    ? Math.round((bytesSaved / totalOriginalBytes) * 100) 
    : 0;

  return (
    <div 
      id="optimization-stats-banner" 
      className="w-full bg-white rounded-xl border border-slate-200 shadow-2xs p-3.5 sm:p-4"
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
        {/* Stat 1: Total Images */}
        <div className="flex items-center gap-3 pt-2 sm:pt-0 sm:pr-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <ImageIcon className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-widest">
              ASSETS LOADED
            </div>
            <div className="text-base font-bold font-mono text-slate-900 tracking-tight">
              {String(images.length).padStart(2, '0')}{' '}
              <span className="text-[10px] font-sans font-normal text-slate-400">files</span>
            </div>
          </div>
        </div>

        {/* Stat 2: A4 Sheets Created */}
        <div className="flex items-center gap-3 pt-2 sm:pt-0 sm:px-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-widest">
              A4 BATCH QUEUE
            </div>
            <div className="text-base font-bold font-mono text-indigo-600 tracking-tight">
              {String(batches.length).padStart(2, '0')}{' '}
              <span className="text-[10px] font-sans font-normal text-slate-400">
                (Max {maxImagesPerPage}/p)
              </span>
            </div>
          </div>
        </div>

        {/* Stat 3: Size Before vs After */}
        <div className="flex items-center gap-3 pt-2 sm:pt-0 sm:px-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <HardDrive className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-widest">
              WEB COMPRESSION
            </div>
            <div className="text-xs font-mono font-bold text-slate-900 tracking-tight">
              <span className="line-through text-slate-400 mr-1 font-normal">
                {formatBytes(totalOriginalBytes)}
              </span>
              <span>{formatBytes(totalOptimizedBytes)}</span>
            </div>
          </div>
        </div>

        {/* Stat 4: Bandwidth Saved % */}
        <div className="flex items-center gap-3 pt-2 sm:pt-0 sm:pl-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <TrendingDown className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-widest">
              BANDWIDTH SAVED
            </div>
            <div className="text-base font-bold font-mono text-emerald-600 tracking-tight flex items-center gap-1.5">
              <span>-{percentageSaved}%</span>
              <span className="text-[9px] font-sans font-semibold text-emerald-700 bg-emerald-100/70 px-1 py-0.2 rounded">
                {formatBytes(bytesSaved)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
