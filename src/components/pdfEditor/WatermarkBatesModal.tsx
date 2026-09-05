import React, { useState } from 'react';
import { X, Stamp, Hash, Check, Shield } from 'lucide-react';
import { PdfHeaderFooterConfig, PdfWatermarkConfig, PdfMetadataConfig } from '../../types/pdfEditor';

interface WatermarkBatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  headerFooter: PdfHeaderFooterConfig;
  watermark: PdfWatermarkConfig;
  metadata: PdfMetadataConfig;
  onSave: (configs: {
    headerFooter: PdfHeaderFooterConfig;
    watermark: PdfWatermarkConfig;
    metadata: PdfMetadataConfig;
  }) => void;
}

export const WatermarkBatesModal: React.FC<WatermarkBatesModalProps> = ({
  isOpen,
  onClose,
  headerFooter: initialHF,
  watermark: initialWM,
  metadata: initialMeta,
  onSave,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'watermark' | 'bates' | 'metadata'>('watermark');
  
  const [hf, setHf] = useState<PdfHeaderFooterConfig>({ ...initialHF });
  const [wm, setWm] = useState<PdfWatermarkConfig>({ ...initialWM });
  const [meta, setMeta] = useState<PdfMetadataConfig>({ ...initialMeta });

  if (!isOpen) return null;

  const handleApply = () => {
    onSave({
      headerFooter: hf,
      watermark: wm,
      metadata: meta,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <Stamp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Advanced PDF Configuration</h2>
              <p className="text-xs text-slate-500">Watermarks, Bates numbering, headers &amp; document metadata</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 pt-3 border-b border-slate-100 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('watermark')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all ${
              activeSubTab === 'watermark'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Watermark
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('bates')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all ${
              activeSubTab === 'bates'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Header, Footer &amp; Bates
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('metadata')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all ${
              activeSubTab === 'metadata'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Doc Security &amp; Meta
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          {/* WATERMARK TAB */}
          {activeSubTab === 'watermark' && (
            <div className="space-y-4">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wm.enabled}
                  onChange={(e) => setWm({ ...wm, enabled: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-slate-800">Enable Diagonal Watermark</span>
              </label>

              {wm.enabled && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Watermark Text
                    </label>
                    <input
                      type="text"
                      value={wm.text}
                      onChange={(e) => setWm({ ...wm, text: e.target.value })}
                      placeholder="e.g. CONFIDENTIAL, DRAFT, GULF WAY"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Opacity: {Math.round(wm.opacity * 100)}%
                      </label>
                      <input
                        type="range"
                        min={0.05}
                        max={0.8}
                        step={0.05}
                        value={wm.opacity}
                        onChange={(e) => setWm({ ...wm, opacity: parseFloat(e.target.value) })}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Rotation: {wm.rotationAngle}°
                      </label>
                      <input
                        type="range"
                        min={-90}
                        max={90}
                        step={5}
                        value={wm.rotationAngle}
                        onChange={(e) => setWm({ ...wm, rotationAngle: parseInt(e.target.value) })}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                  </div>

                  {/* Preset quick buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 font-medium">Quick Presets:</span>
                    {['GULF WAY GROUP', 'CONFIDENTIAL', 'APPROVED FOR WPS', 'DO NOT COPY', 'SAMPLE'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setWm({ ...wm, text: preset, enabled: true })}
                        className="px-2 py-1 bg-white border border-slate-200 hover:border-indigo-400 rounded text-[10px] font-medium text-slate-700"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BATES / HEADER FOOTER TAB */}
          {activeSubTab === 'bates' && (
            <div className="space-y-4">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hf.enabled}
                  onChange={(e) => setHf({ ...hf, enabled: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-slate-800">Enable Headers, Footers &amp; Page Numbers</span>
              </label>

              {hf.enabled && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Header Left (e.g. Company Name)
                      </label>
                      <input
                        type="text"
                        value={hf.headerLeft}
                        onChange={(e) => setHf({ ...hf, headerLeft: e.target.value })}
                        placeholder="Gulf Way Group"
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Header Right (e.g. Doc Ref)
                      </label>
                      <input
                        type="text"
                        value={hf.headerRight}
                        onChange={(e) => setHf({ ...hf, headerRight: e.target.value })}
                        placeholder="REF: GW-WPS-2026"
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Footer Center Format (Bates Numbering)
                    </label>
                    <input
                      type="text"
                      value={hf.footerCenter}
                      onChange={(e) => setHf({ ...hf, footerCenter: e.target.value })}
                      placeholder="Page {page} of {total}"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Supports tokens like <span className="font-mono text-indigo-600">{'{page}'}</span> and <span className="font-mono text-indigo-600">{'{total}'}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* METADATA TAB */}
          {activeSubTab === 'metadata' && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  value={meta.title}
                  onChange={(e) => setMeta({ ...meta, title: e.target.value })}
                  placeholder="Official Service Agreement"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Author / Organization
                  </label>
                  <input
                    type="text"
                    value={meta.author}
                    onChange={(e) => setMeta({ ...meta, author: e.target.value })}
                    placeholder="Gulf Way Group"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Subject / Department
                  </label>
                  <input
                    type="text"
                    value={meta.subject}
                    onChange={(e) => setMeta({ ...meta, subject: e.target.value })}
                    placeholder="WPS & Compliance"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
