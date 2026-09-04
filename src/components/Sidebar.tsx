import React from 'react';
import { 
  Sliders, 
  FileText, 
  Image as ImageIcon, 
  Layers, 
  Cpu, 
  Check, 
  Sparkles,
  Maximize,
  Ratio,
  ArrowRightLeft,
  FileSpreadsheet,
  Stamp,
  Maximize2
} from 'lucide-react';
import { BatchConfig, OutputFormat } from '../types';

interface SidebarProps {
  config: BatchConfig;
  onUpdateConfig: (partial: Partial<BatchConfig>) => void;
  onOpenModal: () => void;
  onOpenCreateImageModal?: () => void;
  totalBatches: number;
  totalImages: number;
  activeTab?: 'batcher' | 'converter' | 'resizer';
  onSelectTab?: (tab: 'batcher' | 'converter' | 'resizer') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  config,
  onUpdateConfig,
  onOpenModal,
  onOpenCreateImageModal,
  totalBatches,
  totalImages,
  activeTab = 'batcher',
  onSelectTab,
}) => {
  return (
    <aside 
      id="high-density-sidebar"
      className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 select-none z-30"
    >
      {/* Brand & Title Header */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shadow-xs text-white font-black text-xs tracking-tight">
            GW
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm tracking-tight text-slate-900 truncate">
              Gulf Way Group
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Enterprise Tools</span>
          </div>
          <span className="text-[9px] font-mono px-1.5 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded ml-auto">
            v2.5
          </span>
        </div>
        <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-widest">
          A4 Batch &amp; Format Studio
        </p>
      </div>

      {/* Configuration Navigation */}
      <nav className="flex-1 p-4 space-y-4 overflow-y-auto text-xs">
        {/* Navigation Mode Switcher */}
        {onSelectTab && (
          <div className="pb-3 border-b border-slate-100 space-y-1.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase px-2 mb-1 tracking-wider">
              Tool Module
            </div>
            <button
              type="button"
              id="sidebar-nav-batcher-btn"
              onClick={() => onSelectTab('batcher')}
              className={`w-full p-2.5 rounded-lg flex items-center justify-between text-left transition-colors ${
                activeTab === 'batcher'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200/80 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>A4 Batch Optimizer</span>
              </div>
              {totalImages > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-indigo-100 text-indigo-800 font-bold rounded">
                  {totalImages}
                </span>
              )}
            </button>

            <button
              type="button"
              id="sidebar-nav-converter-btn"
              onClick={() => onSelectTab('converter')}
              className={`w-full p-2.5 rounded-lg flex items-center justify-between text-left transition-colors ${
                activeTab === 'converter'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200/80 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Format Converter</span>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-bold">
                NEW
              </span>
            </button>

            <button
              type="button"
              id="sidebar-nav-resizer-btn"
              onClick={() => onSelectTab('resizer')}
              className={`w-full p-2.5 rounded-lg flex items-center justify-between text-left transition-colors ${
                activeTab === 'resizer'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200/80 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <Maximize2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Image Sizer</span>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.2 bg-blue-50 text-blue-700 border border-blue-200 rounded font-bold">
                HOT
              </span>
            </button>
          </div>
        )}

        {/* Section 1: Batch Constraint */}
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase px-2 mb-2 tracking-wider flex items-center justify-between">
            <span>Constraint</span>
            <span className="font-mono text-indigo-600">MAX {config.imagesPerPage}</span>
          </div>

          <div className="space-y-1.5">
            {/* Toggle 2 Images */}
            <button
              type="button"
              id="sidebar-toggle-2-images"
              onClick={() => onUpdateConfig({ imagesPerPage: 2 })}
              className={`w-full p-2.5 rounded-lg flex items-center justify-between transition-colors ${
                config.imagesPerPage === 2
                  ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200/80'
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 border border-current rounded flex flex-col gap-0.5 p-0.5">
                  <div className="w-full h-1 bg-current rounded-2xs" />
                  <div className="w-full h-1 bg-current rounded-2xs" />
                </div>
                <span>2 Images / Sheet</span>
              </div>
              <div className={`w-7 h-3.5 rounded-full relative transition-colors ${
                config.imagesPerPage === 2 ? 'bg-indigo-600' : 'bg-slate-200'
              }`}>
                <div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-transform ${
                  config.imagesPerPage === 2 ? 'right-0.5' : 'left-0.5'
                }`} />
              </div>
            </button>

            {/* Toggle 3 Images */}
            <button
              type="button"
              id="sidebar-toggle-3-images"
              onClick={() => onUpdateConfig({ imagesPerPage: 3 })}
              className={`w-full p-2.5 rounded-lg flex items-center justify-between transition-colors ${
                config.imagesPerPage === 3
                  ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200/80'
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 border border-current rounded flex flex-col gap-0.5 p-0.5">
                  <div className="w-full h-0.5 bg-current rounded-2xs" />
                  <div className="w-full flex-1 flex gap-0.5">
                    <div className="flex-1 bg-current rounded-2xs" />
                    <div className="flex-1 bg-current rounded-2xs" />
                  </div>
                </div>
                <span>3 Images / Sheet</span>
              </div>
              <div className={`w-7 h-3.5 rounded-full relative transition-colors ${
                config.imagesPerPage === 3 ? 'bg-indigo-600' : 'bg-slate-200'
              }`}>
                <div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-transform ${
                  config.imagesPerPage === 3 ? 'right-0.5' : 'left-0.5'
                }`} />
              </div>
            </button>
          </div>
        </div>

        {/* Section 2: Canvas Geometry */}
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase px-2 mb-2 tracking-wider">
            A4 Canvas Geometry
          </div>

          <div className="space-y-1.5">
            {/* Orientation Toggle */}
            <div 
              onClick={() => onUpdateConfig({ orientation: config.orientation === 'portrait' ? 'landscape' : 'portrait' })}
              className="p-2.5 rounded-lg flex items-center justify-between text-slate-600 hover:bg-slate-50 cursor-pointer border border-slate-100 transition-colors"
            >
              <span className="font-medium capitalize">{config.orientation} Mode</span>
              <div className="w-7 h-3.5 bg-indigo-600 rounded-full relative">
                <div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-transform ${
                  config.orientation === 'portrait' ? 'left-0.5' : 'right-0.5'
                }`} />
              </div>
            </div>

            {/* Preserve Ratio / Fit Mode Toggle */}
            <div 
              onClick={() => onUpdateConfig({ fitMode: config.fitMode === 'contain' ? 'cover' : 'contain' })}
              className="p-2.5 rounded-lg flex items-center justify-between text-slate-600 hover:bg-slate-50 cursor-pointer border border-slate-100 transition-colors"
            >
              <span>{config.fitMode === 'contain' ? 'Preserve Ratio' : 'Fill Container'}</span>
              <div className={`w-7 h-3.5 rounded-full relative transition-colors ${
                config.fitMode === 'contain' ? 'bg-indigo-600' : 'bg-slate-200'
              }`}>
                <div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-transform ${
                  config.fitMode === 'contain' ? 'right-0.5' : 'left-0.5'
                }`} />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Output Format */}
        <div className="pt-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase px-2 mb-2 tracking-wider">
            Output Format
          </div>
          <div className="space-y-2 px-2">
            <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 hover:text-indigo-600 transition-colors">
              <input 
                type="radio" 
                name="sidebar-output-format" 
                value="pdf"
                checked={config.outputFormat === 'pdf'}
                onChange={() => onUpdateConfig({ outputFormat: 'pdf' })}
                className="accent-indigo-600 w-3.5 h-3.5 cursor-pointer" 
              />
              <span className="text-xs font-medium">PDF (Multi-page)</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 hover:text-indigo-600 transition-colors">
              <input 
                type="radio" 
                name="sidebar-output-format" 
                value="jpg"
                checked={config.outputFormat === 'jpg'}
                onChange={() => onUpdateConfig({ outputFormat: 'jpg' })}
                className="accent-indigo-600 w-3.5 h-3.5 cursor-pointer" 
              />
              <span className="text-xs font-medium">JPG (Archive &amp; Sets)</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 hover:text-indigo-600 transition-colors">
              <input 
                type="radio" 
                name="sidebar-output-format" 
                value="both"
                checked={config.outputFormat === 'both'}
                onChange={() => onUpdateConfig({ outputFormat: 'both' })}
                className="accent-indigo-600 w-3.5 h-3.5 cursor-pointer" 
              />
              <span className="text-xs font-medium">Both (PDF + JPG Zip)</span>
            </label>
          </div>
        </div>

        {/* Section 4: Watermark Layer */}
        <div className="pt-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase px-2 mb-2 tracking-wider flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Stamp className="w-3 h-3 text-indigo-600" />
              <span>Watermark</span>
            </div>
            <span className={`font-mono text-[9px] font-bold px-1.5 py-0.2 rounded ${
              config.watermark?.enabled
                ? 'bg-amber-100 text-amber-800'
                : 'bg-slate-100 text-slate-500'
            }`}>
              {config.watermark?.enabled ? 'ACTIVE' : 'OFF'}
            </span>
          </div>

          <div className="space-y-1.5">
            <div 
              id="sidebar-toggle-watermark"
              onClick={() => {
                const isCurrentlyEnabled = !!config.watermark?.enabled;
                onUpdateConfig({
                  watermark: {
                    ...(config.watermark || {
                      type: 'text',
                      text: 'GULF WAY GROUP',
                      fontSize: 54,
                      opacity: 0.16,
                      color: '#334155',
                      position: 'center-diagonal',
                      rotationAngle: -30,
                      imageScale: 0.35,
                    }),
                    enabled: !isCurrentlyEnabled,
                  }
                });
              }}
              className={`p-2.5 rounded-lg flex items-center justify-between cursor-pointer border transition-colors ${
                config.watermark?.enabled
                  ? 'bg-amber-50/70 text-slate-900 border-amber-300 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50 border-slate-100'
              }`}
            >
              <div className="flex flex-col min-w-0 pr-2">
                <span className="font-semibold truncate text-xs">PDF Watermark</span>
                <span className="text-[10px] text-slate-500 truncate">
                  {config.watermark?.enabled 
                    ? (config.watermark.type === 'text' ? `"${config.watermark.text || 'CONFIDENTIAL'}"` : 'Logo Stamp')
                    : 'Disabled (Click to enable)'}
                </span>
              </div>
              <div className={`w-7 h-3.5 rounded-full relative transition-colors shrink-0 ${
                config.watermark?.enabled ? 'bg-indigo-600' : 'bg-slate-200'
              }`}>
                <div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-transform ${
                  config.watermark?.enabled ? 'right-0.5' : 'left-0.5'
                }`} />
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Advanced Tuning & AI Creator buttons */}
        <div className="pt-1 space-y-2">
          {onOpenCreateImageModal && (
            <button
              type="button"
              id="sidebar-create-ai-btn"
              onClick={onOpenCreateImageModal}
              className="w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] uppercase tracking-wider rounded-lg border border-indigo-200/80 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Sparkles className="w-3 h-3 text-indigo-600" />
              <span>Create with AI</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenModal}
            className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <Sliders className="w-3 h-3 text-slate-500" />
            <span>Tune Parameters</span>
          </button>
        </div>
      </nav>

      {/* High Density System Status Widget */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50 shrink-0">
        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <div className="text-[10px] text-slate-400 mb-1.5 font-bold tracking-wider">SYSTEM STATUS</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-mono font-bold text-slate-800">ENGINE_READY</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">{totalImages} imgs</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between text-[10px] font-mono text-slate-400">
            <span>A4_RATIO: 1.414</span>
            <span className="text-indigo-600 font-bold">{totalBatches} SHEETS</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
