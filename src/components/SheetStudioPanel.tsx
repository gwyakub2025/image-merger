import React, { useState } from 'react';
import {
  Layers,
  LayoutGrid,
  Sliders,
  Sparkles,
  Check,
  ChevronRight,
  Info,
  Maximize2,
  Columns,
  Grid2X2,
  Grid3X3,
  HelpCircle,
  Calculator,
  ArrowRight
} from 'lucide-react';
import { BatchConfig, SheetTemplateId } from '../types';
import {
  DEFAULT_SHEET_TEMPLATES,
  calculateTargetSheetLayout,
  applyTemplateToConfig,
} from '../utils/sheetTemplates';
import { useLanguage } from '../i18n/LanguageContext';

interface SheetStudioPanelProps {
  config: BatchConfig;
  onUpdateConfig: (partial: Partial<BatchConfig>) => void;
  totalImages: number;
  totalBatches: number;
}

export const SheetStudioPanel: React.FC<SheetStudioPanelProps> = ({
  config,
  onUpdateConfig,
  totalImages,
  totalBatches,
}) => {
  const { t } = useLanguage();
  const [studioMode, setStudioMode] = useState<'templates' | 'target-sheets' | 'custom'>('templates');

  // Local state for target sheets planner
  const initialTargetSheets = config.targetSheetCount || Math.max(1, Math.ceil((totalImages || 4) / config.imagesPerPage));
  const [targetSheetsInput, setTargetSheetsInput] = useState<number>(initialTargetSheets);

  // Dynamic calculation based on current total images
  const effectiveImagesCount = Math.max(1, totalImages || 6);
  const targetPlan = calculateTargetSheetLayout(effectiveImagesCount, targetSheetsInput);

  // Render miniature layout wireframe icon for templates
  const renderTemplateWireframe = (id: SheetTemplateId) => {
    switch (id) {
      case 'single-hero':
        return (
          <div className="w-5 h-6 bg-slate-100 rounded border border-slate-300 p-0.5 flex flex-col justify-center">
            <div className="w-full h-full bg-indigo-500 rounded-2xs" />
          </div>
        );
      case 'dual-stacked':
        return (
          <div className="w-5 h-6 bg-slate-100 rounded border border-slate-300 p-0.5 flex flex-col gap-0.5">
            <div className="w-full flex-1 bg-indigo-500 rounded-2xs" />
            <div className="w-full flex-1 bg-indigo-500 rounded-2xs" />
          </div>
        );
      case 'dual-split':
        return (
          <div className="w-6 h-5 bg-slate-100 rounded border border-slate-300 p-0.5 flex gap-0.5">
            <div className="flex-1 h-full bg-indigo-500 rounded-2xs" />
            <div className="flex-1 h-full bg-indigo-500 rounded-2xs" />
          </div>
        );
      case 'triple-featured':
        return (
          <div className="w-5 h-6 bg-slate-100 rounded border border-slate-300 p-0.5 flex flex-col gap-0.5">
            <div className="w-full h-2.5 bg-indigo-500 rounded-2xs" />
            <div className="w-full flex-1 flex gap-0.5">
              <div className="flex-1 bg-indigo-400 rounded-2xs" />
              <div className="flex-1 bg-indigo-400 rounded-2xs" />
            </div>
          </div>
        );
      case 'triple-rows':
        return (
          <div className="w-5 h-6 bg-slate-100 rounded border border-slate-300 p-0.5 flex flex-col gap-0.5">
            <div className="w-full flex-1 bg-indigo-500 rounded-2xs" />
            <div className="w-full flex-1 bg-indigo-500 rounded-2xs" />
            <div className="w-full flex-1 bg-indigo-500 rounded-2xs" />
          </div>
        );
      case 'triple-cols':
        return (
          <div className="w-6 h-5 bg-slate-100 rounded border border-slate-300 p-0.5 flex gap-0.5">
            <div className="flex-1 h-full bg-indigo-500 rounded-2xs" />
            <div className="flex-1 h-full bg-indigo-500 rounded-2xs" />
            <div className="flex-1 h-full bg-indigo-500 rounded-2xs" />
          </div>
        );
      case 'quad-grid':
        return (
          <div className="w-5 h-6 bg-slate-100 rounded border border-slate-300 p-0.5 grid grid-cols-2 gap-0.5">
            <div className="bg-indigo-500 rounded-2xs" />
            <div className="bg-indigo-500 rounded-2xs" />
            <div className="bg-indigo-500 rounded-2xs" />
            <div className="bg-indigo-500 rounded-2xs" />
          </div>
        );
      case 'contact-6':
        return (
          <div className="w-5 h-6 bg-slate-100 rounded border border-slate-300 p-0.5 grid grid-cols-2 gap-0.5">
            <div className="bg-indigo-500 rounded-2xs" />
            <div className="bg-indigo-500 rounded-2xs" />
            <div className="bg-indigo-500 rounded-2xs" />
            <div className="bg-indigo-500 rounded-2xs" />
            <div className="bg-indigo-500 rounded-2xs" />
            <div className="bg-indigo-500 rounded-2xs" />
          </div>
        );
      case 'catalog-8':
        return (
          <div className="w-5 h-6 bg-slate-100 rounded border border-slate-300 p-0.5 grid grid-cols-2 gap-0.5">
            <div className="bg-indigo-400 rounded-2xs" />
            <div className="bg-indigo-400 rounded-2xs" />
            <div className="bg-indigo-400 rounded-2xs" />
            <div className="bg-indigo-400 rounded-2xs" />
            <div className="bg-indigo-400 rounded-2xs" />
            <div className="bg-indigo-400 rounded-2xs" />
            <div className="bg-indigo-400 rounded-2xs" />
            <div className="bg-indigo-400 rounded-2xs" />
          </div>
        );
      case 'gallery-9':
        return (
          <div className="w-5 h-6 bg-slate-100 rounded border border-slate-300 p-0.5 grid grid-cols-3 gap-0.5">
            <div className="bg-indigo-500 rounded-2xs" />
            <div className="bg-indigo-500 rounded-2xs" />
            <div className="bg-indigo-500 rounded-2xs" />
            <div className="bg-indigo-500 rounded-2xs" />
            <div className="bg-indigo-500 rounded-2xs" />
            <div className="bg-indigo-500 rounded-2xs" />
            <div className="bg-indigo-500 rounded-2xs" />
            <div className="bg-indigo-500 rounded-2xs" />
            <div className="bg-indigo-500 rounded-2xs" />
          </div>
        );
      default:
        return (
          <div className="w-5 h-6 bg-slate-100 rounded border border-slate-300 p-0.5 grid grid-cols-3 gap-0.5">
            <div className="bg-indigo-400 rounded-2xs" />
            <div className="bg-indigo-400 rounded-2xs" />
            <div className="bg-indigo-400 rounded-2xs" />
            <div className="bg-indigo-400 rounded-2xs" />
            <div className="bg-indigo-400 rounded-2xs" />
            <div className="bg-indigo-400 rounded-2xs" />
          </div>
        );
    }
  };

  const handleSelectTemplate = (templateId: SheetTemplateId) => {
    const partial = applyTemplateToConfig(templateId, config);
    onUpdateConfig(partial);
  };

  const handleApplyTargetPlan = () => {
    onUpdateConfig({
      targetSheetCount: targetSheetsInput,
      imagesPerPage: targetPlan.imagesPerPage,
      templateId: targetPlan.suggestedTemplate,
    });
  };

  return (
    <div id="sheet-studio-panel" className="space-y-3">
      {/* Studio Header */}
      <div className="flex items-center justify-between px-1">
        <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-indigo-600" />
          <span>Sheet & Layout Strategy</span>
        </div>
        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-200">
          {config.imagesPerPage} / Sheet
        </span>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-lg border border-slate-200 text-[10px] font-semibold text-slate-600">
        <button
          type="button"
          id="sheet-tab-templates"
          onClick={() => setStudioMode('templates')}
          className={`py-1 rounded text-center transition-all cursor-pointer ${
            studioMode === 'templates'
              ? 'bg-white text-indigo-700 shadow-2xs font-bold'
              : 'hover:text-slate-900'
          }`}
        >
          Templates
        </button>
        <button
          type="button"
          id="sheet-tab-target"
          onClick={() => setStudioMode('target-sheets')}
          className={`py-1 rounded text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
            studioMode === 'target-sheets'
              ? 'bg-white text-indigo-700 shadow-2xs font-bold'
              : 'hover:text-slate-900'
          }`}
        >
          <span>Target Sheets</span>
        </button>
        <button
          type="button"
          id="sheet-tab-custom"
          onClick={() => setStudioMode('custom')}
          className={`py-1 rounded text-center transition-all cursor-pointer ${
            studioMode === 'custom'
              ? 'bg-white text-indigo-700 shadow-2xs font-bold'
              : 'hover:text-slate-900'
          }`}
        >
          Custom N
        </button>
      </div>

      {/* TAB 1: DEFAULT TEMPLATES GALLERY */}
      {studioMode === 'templates' && (
        <div className="space-y-2">
          <div className="text-[10px] text-slate-500 px-1 flex items-center justify-between">
            <span>Pre-engineered A4 Sheet Presets</span>
            <span className="font-mono text-indigo-600 font-bold">
              {DEFAULT_SHEET_TEMPLATES.length} Options
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 max-h-[320px] overflow-y-auto pr-0.5">
            {DEFAULT_SHEET_TEMPLATES.map((tmpl) => {
              const isSelected =
                config.templateId === tmpl.id ||
                (!config.templateId && config.imagesPerPage === tmpl.imagesPerPage);

              return (
                <button
                  key={tmpl.id}
                  type="button"
                  id={`template-btn-${tmpl.id}`}
                  onClick={() => handleSelectTemplate(tmpl.id)}
                  className={`p-2 rounded-lg text-left transition-all border flex flex-col justify-between relative group cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-500 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 w-full mb-1.5">
                    <div className="shrink-0">{renderTemplateWireframe(tmpl.id)}</div>
                    <span
                      className={`text-[9px] font-mono px-1 py-0.2 rounded font-bold ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700'
                      }`}
                    >
                      {tmpl.badge}
                    </span>
                  </div>

                  <div>
                    <h5
                      className={`text-xs font-bold truncate leading-tight ${
                        isSelected ? 'text-indigo-950' : 'text-slate-800'
                      }`}
                    >
                      {tmpl.name}
                    </h5>
                    <p className="text-[9px] text-slate-400 line-clamp-1 mt-0.5">
                      {tmpl.description}
                    </p>
                  </div>

                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-indigo-600 text-white rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: DESCRIBE TARGET NUMBER OF SHEETS (AUTO-PLANNER) */}
      {studioMode === 'target-sheets' && (
        <div className="p-3 bg-gradient-to-br from-indigo-50/80 to-purple-50/40 rounded-xl border border-indigo-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
              <Calculator className="w-3.5 h-3.5 text-indigo-600" />
              <span>Target Sheet Planner</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-indigo-100 text-indigo-800 rounded font-bold">
              DYNAMIC
            </span>
          </div>

          <p className="text-[10px] text-slate-600 leading-relaxed">
            Specify how many total A4 sheets you want. The engine automatically balances
            and arranges your images across that exact number of sheets.
          </p>

          {/* Stepper Control */}
          <div className="bg-white p-2 rounded-lg border border-indigo-200/70 shadow-2xs flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700">Target Sheets:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="target-sheets-dec-btn"
                onClick={() => setTargetSheetsInput((prev) => Math.max(1, prev - 1))}
                className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors cursor-pointer"
              >
                -
              </button>
              <input
                type="number"
                id="target-sheets-input"
                min={1}
                max={50}
                value={targetSheetsInput}
                onChange={(e) =>
                  setTargetSheetsInput(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-10 text-center text-sm font-mono font-bold text-indigo-900 border-b border-indigo-300 focus:outline-hidden"
              />
              <button
                type="button"
                id="target-sheets-inc-btn"
                onClick={() => setTargetSheetsInput((prev) => prev + 1)}
                className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Quick Target Sheet Presets */}
          <div className="grid grid-cols-4 gap-1">
            {[1, 2, 3, 5].map((count) => (
              <button
                key={count}
                type="button"
                id={`target-sheet-quick-${count}`}
                onClick={() => setTargetSheetsInput(count)}
                className={`py-1 text-[10px] font-bold rounded border transition-colors cursor-pointer ${
                  targetSheetsInput === count
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                }`}
              >
                {count} {count === 1 ? 'Sheet' : 'Sheets'}
              </button>
            ))}
          </div>

          {/* Real-time Math Summary Card */}
          <div className="p-2.5 bg-white rounded-lg border border-indigo-100 text-[11px] space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>Total Assets:</span>
              <span className="font-mono font-bold text-slate-900">
                {totalImages > 0 ? `${totalImages} images` : '6 images (Sample)'}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Desired Sheets:</span>
              <span className="font-mono font-bold text-indigo-700">
                {targetPlan.targetSheets} A4 sheet{targetPlan.targetSheets > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Density per Sheet:</span>
              <span className="font-mono font-bold text-purple-700">
                ~{targetPlan.imagesPerPage} images / sheet
              </span>
            </div>

            <div className="pt-1 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-slate-500">
              <Sparkles className="w-3 h-3 text-indigo-500 shrink-0" />
              <span>Recommended layout: <strong>{targetPlan.suggestedTemplate.replace('-', ' ')}</strong></span>
            </div>
          </div>

          {/* Apply Button */}
          <button
            type="button"
            id="apply-target-sheets-btn"
            onClick={handleApplyTargetPlan}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span>Apply {targetPlan.targetSheets} Sheet Plan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* TAB 3: CUSTOM N IMAGES PER SHEET */}
      {studioMode === 'custom' && (
        <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">Custom Sheet Density</span>
            <span className="font-mono font-bold text-sm text-indigo-600">
              {config.imagesPerPage} / Sheet
            </span>
          </div>

          {/* Density Slider */}
          <div className="space-y-1">
            <input
              type="range"
              id="custom-images-slider"
              min={1}
              max={12}
              step={1}
              value={config.imagesPerPage}
              onChange={(e) =>
                onUpdateConfig({
                  imagesPerPage: parseInt(e.target.value),
                  templateId: 'custom-grid',
                })
              }
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] font-mono text-slate-400">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>6</span>
              <span>8</span>
              <span>9</span>
              <span>12</span>
            </div>
          </div>

          {/* Direct Density Quick Buttons */}
          <div className="grid grid-cols-4 gap-1">
            {[1, 2, 3, 4, 6, 8, 9, 12].map((num) => (
              <button
                key={num}
                type="button"
                id={`custom-density-btn-${num}`}
                onClick={() =>
                  onUpdateConfig({
                    imagesPerPage: num,
                    templateId: 'custom-grid',
                  })
                }
                className={`py-1 rounded text-xs font-mono font-bold transition-all border cursor-pointer ${
                  config.imagesPerPage === num
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {num} / page
              </button>
            ))}
          </div>

          {/* Image Fit Mode */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1.5">
              <span>Slot Fit Behavior</span>
              <span className="font-mono text-indigo-600 uppercase">
                {config.fitMode}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                id="fit-mode-contain-btn"
                onClick={() => onUpdateConfig({ fitMode: 'contain' })}
                className={`py-1 px-2 rounded text-[11px] font-medium border text-center transition-colors cursor-pointer ${
                  config.fitMode === 'contain'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Contain (Full View)
              </button>
              <button
                type="button"
                id="fit-mode-cover-btn"
                onClick={() => onUpdateConfig({ fitMode: 'cover' })}
                className={`py-1 px-2 rounded text-[11px] font-medium border text-center transition-colors cursor-pointer ${
                  config.fitMode === 'cover'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Cover (Crop Fill)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
