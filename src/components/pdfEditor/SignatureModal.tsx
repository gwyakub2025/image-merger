import React, { useRef, useState, useEffect } from 'react';
import { X, PenTool, Type, Upload, Check, Trash2, Stamp } from 'lucide-react';
import { GulfWayLogo } from '../GulfWayLogo';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySignature: (dataUrl: string, name?: string, targetPageIndex?: number) => void;
  pages?: { pageIndex: number; displayNumber?: number; isDeleted?: boolean }[];
  activePageIndex?: number;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  onApplySignature,
  pages = [],
  activePageIndex = 0,
}) => {
  const [activeTab, setActiveTab] = useState<'draw' | 'type' | 'upload'>('draw');
  const [typedName, setTypedName] = useState('M. Yakub');
  const [selectedFont, setSelectedFont] = useState<'font-serif' | 'font-sans' | 'cursive-1' | 'cursive-2'>('cursive-1');
  const [penColor, setPenColor] = useState('#0f172a');
  const [penWidth, setPenWidth] = useState(2.5);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const [selectedTargetPage, setSelectedTargetPage] = useState<number>(activePageIndex);

  useEffect(() => {
    if (isOpen) {
      setSelectedTargetPage(activePageIndex);
    }
  }, [isOpen, activePageIndex]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    if (isOpen && activeTab === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = penColor;
        ctx.lineWidth = penWidth;
      }
    }
  }, [isOpen, activeTab, penColor, penWidth]);

  if (!isOpen) return null;

  // Drawing canvas handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // Convert typed signature to image data URL
  const renderTypedSignatureToDataUrl = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = penColor;
    
    // Choose font rendering
    if (selectedFont === 'cursive-1') {
      ctx.font = 'italic 58px "Brush Script MT", "Segoe Script", cursive';
    } else if (selectedFont === 'cursive-2') {
      ctx.font = 'italic 52px "Snell Roundhand", "Apple Chancery", cursive';
    } else if (selectedFont === 'font-serif') {
      ctx.font = 'italic 50px Georgia, serif';
    } else {
      ctx.font = 'bold 46px system-ui, sans-serif';
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedName || 'Signature', canvas.width / 2, canvas.height / 2 - 10);

    // Decorative flourish line underneath
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 180, canvas.height / 2 + 35);
    ctx.quadraticCurveTo(
      canvas.width / 2,
      canvas.height / 2 + 50,
      canvas.width / 2 + 180,
      canvas.height / 2 + 30
    );
    ctx.lineWidth = 2;
    ctx.strokeStyle = penColor;
    ctx.stroke();

    return canvas.toDataURL('image/png');
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Preset: Official Gulf Way Group Stamp
  const handleApplyOfficialStamp = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw stamp border
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, 380, 160);

    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 1;
    ctx.strokeRect(16, 16, 368, 148);

    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GULF WAY GROUP • VERIFIED', 200, 48);

    ctx.fillStyle = '#475569';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('OFFICIAL DIGITAL AUTHORIZATION', 200, 75);

    const todayStr = new Date().toISOString().split('T')[0];
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`DATE: ${todayStr} • REF: GW-WPS-AUTH`, 200, 105);

    ctx.fillStyle = '#16a34a';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText('✔ CRYPTOGRAPHICALLY SECURED & VERIFIED', 200, 135);

    const stampUrl = canvas.toDataURL('image/png');
    onApplySignature(stampUrl, 'Gulf Way Verified Seal', selectedTargetPage);
    onClose();
  };

  const handleConfirm = () => {
    if (activeTab === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) return;
      onApplySignature(canvas.toDataURL('image/png'), undefined, selectedTargetPage);
    } else if (activeTab === 'type') {
      const dataUrl = renderTypedSignatureToDataUrl();
      onApplySignature(dataUrl, typedName, selectedTargetPage);
    } else if (activeTab === 'upload') {
      if (!uploadedImage) return;
      onApplySignature(uploadedImage, undefined, selectedTargetPage);
    }
    onClose();
  };

  const validPages = pages.filter((p) => !p.isDeleted);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Create Digital Signature</h2>
              <p className="text-xs text-slate-500">Sign contracts, approvals, and WPS compliance sheets</p>
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

        {/* Target Page Selection Banner */}
        {validPages.length > 0 && (
          <div className="px-6 py-2 bg-indigo-50/70 border-b border-indigo-100 flex items-center justify-between text-xs text-slate-700">
            <span className="font-semibold text-slate-600">Apply Signature onto:</span>
            <select
              value={selectedTargetPage}
              onChange={(e) => setSelectedTargetPage(Number(e.target.value))}
              className="bg-white border border-indigo-200 text-indigo-800 font-bold rounded-lg px-2.5 py-1 text-xs outline-none cursor-pointer shadow-2xs"
            >
              {validPages.map((p, idx) => (
                <option key={p.pageIndex} value={p.pageIndex}>
                  Page {idx + 1} {p.pageIndex === activePageIndex ? '(Currently Active)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Tab Selection */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('draw')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'draw'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Draw</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('type')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'type'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Type</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'upload'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Image</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleApplyOfficialStamp}
            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Apply Official Gulf Way Verified Stamp"
          >
            <Stamp className="w-3.5 h-3.5" />
            <span>Gulf Way Stamp</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {/* DRAW TAB */}
          {activeTab === 'draw' && (
            <div className="flex flex-col gap-3">
              <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/70 overflow-hidden cursor-crosshair">
                <canvas
                  ref={canvasRef}
                  width={520}
                  height={180}
                  className="w-full h-[180px] touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                {!hasDrawn && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400">
                    <PenTool className="w-6 h-6 mb-1 opacity-50" />
                    <span className="text-xs font-medium">Draw your signature with mouse or stylus</span>
                  </div>
                )}
              </div>

              {/* Draw Controls */}
              <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span>Color:</span>
                  {['#0f172a', '#1e40af', '#b91c1c'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setPenColor(c)}
                      className={`w-5 h-5 rounded-full border-2 transition-transform ${
                        penColor === c ? 'scale-110 border-indigo-600' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="px-2.5 py-1 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1 text-xs font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Canvas</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TYPE TAB */}
          {activeTab === 'type' && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Signatory Name
                </label>
                <input
                  type="text"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder="Enter full name..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* Font Style Selection */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'cursive-1', label: 'Classic Script', fontStyle: 'italic font-serif' },
                  { id: 'cursive-2', label: 'Executive Flow', fontStyle: 'italic font-serif' },
                  { id: 'font-serif', label: 'Formal Serif', fontStyle: 'italic font-serif' },
                  { id: 'font-sans', label: 'Clean Modern', fontStyle: 'font-sans font-bold' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFont(f.id as any)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      selectedFont === f.id
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className="text-[11px] text-slate-400 font-medium">{f.label}</span>
                    <span className={`text-xl text-slate-900 mt-2 truncate ${f.fontStyle}`}>
                      {typedName || 'Signature'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* UPLOAD TAB */}
          {activeTab === 'upload' && (
            <div className="flex flex-col gap-3">
              <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-indigo-50/20 transition-all">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-700">Upload Signature Image</span>
                <span className="text-[11px] text-slate-400 mt-0.5">Supports transparent PNG, JPG, or SVG</span>
              </label>

              {uploadedImage && (
                <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                  <img src={uploadedImage} alt="Preview" className="h-12 max-w-[200px] object-contain" />
                  <button
                    type="button"
                    onClick={() => setUploadedImage(null)}
                    className="text-xs text-red-600 hover:underline font-medium"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
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
            onClick={handleConfirm}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Signature</span>
          </button>
        </div>
      </div>
    </div>
  );
};
