import React from 'react';
import { BatchConfig } from '../types';
import { formatBytes } from '../utils/imageOptimizer';

interface FooterProps {
  totalImages: number;
  totalBatches: number;
  totalMemoryBytes: number;
  config: BatchConfig;
}

export const Footer: React.FC<FooterProps> = ({
  totalImages,
  totalBatches,
  totalMemoryBytes,
  config,
}) => {
  const memStr = totalMemoryBytes > 0 ? formatBytes(totalMemoryBytes) : '18MB';

  return (
    <footer 
      id="high-density-footer"
      className="h-10 bg-white border-t border-slate-200 flex items-center px-4 sm:px-8 text-[10px] text-slate-400 justify-between select-none shrink-0"
    >
      <div className="font-mono">
        &copy; 2026 Gulf Way Group • <span className="text-slate-500 font-sans">Bulk Image Batcher &amp; A4 Optimizer</span>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 uppercase font-bold font-mono tracking-tight text-slate-500">
        <span className="hidden sm:inline">PAPER: {config.orientation.toUpperCase()}_A4</span>
        <span className="text-slate-300 hidden sm:inline">•</span>
        <span>SETS: {String(totalBatches).padStart(2, '0')}</span>
        <span className="text-slate-300">•</span>
        <span>MEM: {memStr}</span>
        <span className="text-slate-300">•</span>
        <span className="text-emerald-600">ENGINE: OK</span>
      </div>
    </footer>
  );
};
