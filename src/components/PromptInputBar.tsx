import React, { useState } from 'react';
import { Sparkles, Terminal, CheckCircle2 } from 'lucide-react';
import { BatchConfig, OutputFormat } from '../types';

interface PromptInputBarProps {
  config: BatchConfig;
  onApplyPrompt: (text: string) => void;
  onOpenCreateImageModal?: () => void;
  totalBatches: number;
  totalImages: number;
}

export const PromptInputBar: React.FC<PromptInputBarProps> = ({
  config,
  onApplyPrompt,
  onOpenCreateImageModal,
  totalBatches,
  totalImages,
}) => {
  const [promptText, setPromptText] = useState(
    `Process batches with max ${config.imagesPerPage} images each into ${config.orientation} A4 ${config.outputFormat.toUpperCase()} format`
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (promptText.trim()) {
      onApplyPrompt(promptText.trim());
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setPromptText(prompt);
    onApplyPrompt(prompt);
  };

  return (
    <div 
      id="high-density-prompt-bar"
      className="w-full bg-indigo-900 rounded-xl p-5 sm:p-6 text-white shadow-sm border border-indigo-800"
    >
      <div className="flex flex-col lg:flex-row gap-5 items-stretch lg:items-center">
        {/* Left: Interactive Prompt Form */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-300 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              Prompt Input Upload
            </h4>
            <span className="text-[10px] text-indigo-300/80 font-mono">
              Auto-Batching Engine Active
            </span>
          </div>

          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              id="prompt-text-input"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="E.g. Upload batches of 2 images each into A4 PDF format in portrait..."
              className="w-full bg-indigo-950 border border-indigo-700 rounded-lg py-3 pl-4 pr-20 text-sm text-white placeholder-indigo-400/60 focus:outline-hidden focus:ring-2 focus:ring-indigo-400 font-sans"
            />
            <button
              type="submit"
              id="apply-prompt-btn"
              className="absolute right-1.5 top-1.5 bottom-1.5 px-3.5 bg-indigo-600 hover:bg-indigo-500 rounded-md text-[10px] font-bold uppercase tracking-wider text-white transition-colors flex items-center gap-1"
            >
              Apply
            </button>
          </form>

          {/* Prompt Suggestion Quick Chips */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            <span className="text-[10px] text-indigo-300 font-semibold uppercase tracking-wider mr-1">
              Suggestions:
            </span>
            <button
              type="button"
              onClick={() => handleQuickPrompt('Set max 2 images per A4 sheet in portrait mode')}
              className="px-2 py-0.5 rounded bg-indigo-950/70 hover:bg-indigo-800 text-indigo-200 text-[10px] font-mono border border-indigo-700/60 transition-colors"
            >
              2 Img / Sheet (Portrait)
            </button>
            <button
              type="button"
              onClick={() => handleQuickPrompt('Set max 3 images per A4 sheet in landscape mode')}
              className="px-2 py-0.5 rounded bg-indigo-950/70 hover:bg-indigo-800 text-indigo-200 text-[10px] font-mono border border-indigo-700/60 transition-colors"
            >
              3 Img / Sheet (Landscape)
            </button>
            <button
              type="button"
              onClick={() => handleQuickPrompt('Export output format to PDF document')}
              className="px-2 py-0.5 rounded bg-indigo-950/70 hover:bg-indigo-800 text-indigo-200 text-[10px] font-mono border border-indigo-700/60 transition-colors"
            >
              Output PDF
            </button>
            <button
              type="button"
              onClick={() => handleQuickPrompt('Export output format to JPG archive')}
              className="px-2 py-0.5 rounded bg-indigo-950/70 hover:bg-indigo-800 text-indigo-200 text-[10px] font-mono border border-indigo-700/60 transition-colors"
            >
              Output JPG
            </button>

            {onOpenCreateImageModal && (
              <button
                type="button"
                onClick={onOpenCreateImageModal}
                className="px-2 py-0.5 rounded bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 text-[10px] font-mono border border-amber-400/40 transition-colors flex items-center gap-1 font-bold"
              >
                <span>✨ Create with Gemini AI</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Queue Summary Widget */}
        <div className="w-full lg:w-56 bg-indigo-800/50 p-3.5 rounded-lg border border-indigo-700 shrink-0 select-none">
          <div className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Queue Summary</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-indigo-100">
              <span className="text-indigo-300">Total Batches</span>
              <span className="font-mono font-bold">
                {String(totalBatches).padStart(2, '0')}
              </span>
            </div>
            <div className="flex justify-between text-xs text-indigo-100">
              <span className="text-indigo-300">Images Found</span>
              <span className="font-mono font-bold">
                {String(totalImages).padStart(2, '0')}
              </span>
            </div>
            <div className="flex justify-between text-xs text-indigo-100">
              <span className="text-indigo-300">Batch Rule</span>
              <span className="font-mono text-indigo-200">
                MAX {config.imagesPerPage} / FILE
              </span>
            </div>
            <div className="flex justify-between text-xs font-bold text-indigo-200 border-t border-indigo-700 pt-1.5 mt-1.5">
              <span>Target Size</span>
              <span className="font-mono text-white">ISO 216 A4</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
