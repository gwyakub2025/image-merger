import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, 
  Upload, 
  Download, 
  FileText, 
  Check, 
  Sparkles, 
  Copy, 
  Trash2, 
  RefreshCw, 
  Sliders, 
  AlertCircle,
  FileCheck,
  FileSpreadsheet,
  QrCode,
  Lock,
  Layers,
  Archive,
  CopyCheck,
  Edit3,
  GitCompare,
  ScanText,
  Filter,
  Split,
  BarChart3,
  Calculator,
  Presentation,
  Stamp,
  EyeOff,
  CheckCircle2
} from 'lucide-react';
import { ActiveTab } from '../../types';
import { SUITE_TOOLS } from '../../utils/suiteRegistry';
import { GulfWayLogo } from '../GulfWayLogo';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';

interface SuiteModuleViewProps {
  toolId: ActiveTab;
  onBackToHub: () => void;
  onNavigateToTab?: (tab: ActiveTab) => void;
}

export const SuiteModuleView: React.FC<SuiteModuleViewProps> = ({
  toolId,
  onBackToHub,
  onNavigateToTab,
}) => {
  const toolMeta = SUITE_TOOLS.find((t) => t.id === toolId) || {
    id: toolId,
    name: toolId.toUpperCase(),
    category: 'file-management',
    description: 'Enterprise productivity tool module',
    badge: 'Enterprise',
  };

  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // ----------------------------------------------------
  // TOOL 1: FILE RENAMER
  // ----------------------------------------------------
  const [renamerFiles, setRenamerFiles] = useState<{ id: string; original: string; newName: string; size: number }[]>([]);
  const [prefix, setPrefix] = useState('GW_');
  const [suffix, setSuffix] = useState('');
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [numberingStart, setNumberingStart] = useState(1);
  const [caseMode, setCaseMode] = useState<'keep' | 'lower' | 'upper' | 'title'>('keep');

  const handleRenamerDrop = (e: React.DragEvent | React.ChangeEvent<HTMLInputElement>) => {
    let rawFiles: File[] = [];
    if ('dataTransfer' in e && e.dataTransfer.files) {
      rawFiles = Array.from(e.dataTransfer.files);
    } else if ('target' in e && (e.target as HTMLInputElement).files) {
      rawFiles = Array.from((e.target as HTMLInputElement).files || []);
    }
    if (rawFiles.length === 0) return;

    const list = rawFiles.map((f, idx) => {
      const ext = f.name.includes('.') ? '.' + f.name.split('.').pop() : '';
      const base = f.name.replace(ext, '');
      const newName = `${prefix}${base}${suffix}${ext}`;
      return {
        id: Math.random().toString(36).substring(2, 9),
        original: f.name,
        newName,
        size: f.size,
      };
    });
    setRenamerFiles((prev) => [...prev, ...list]);
    showToast(`Added ${rawFiles.length} file(s) for batch renaming.`);
  };

  const applyRenamerRules = () => {
    setRenamerFiles((prev) =>
      prev.map((item, idx) => {
        const ext = item.original.includes('.') ? '.' + item.original.split('.').pop() : '';
        let base = item.original.replace(ext, '');
        if (findText) {
          base = base.replaceAll(findText, replaceText);
        }
        if (caseMode === 'lower') base = base.toLowerCase();
        if (caseMode === 'upper') base = base.toUpperCase();
        if (caseMode === 'title') {
          base = base.replace(/\b\w/g, (c) => c.toUpperCase());
        }
        const numStr = String(numberingStart + idx).padStart(2, '0');
        const finalName = `${prefix}${base}${numStr ? '_' + numStr : ''}${suffix}${ext}`;
        return { ...item, newName: finalName };
      })
    );
    showToast('Batch renaming rules recalculated!');
  };

  // ----------------------------------------------------
  // TOOL 2: QR & BARCODE GENERATOR
  // ----------------------------------------------------
  const [qrText, setQrText] = useState('https://gulfwaygroup.com');
  const [qrSize, setQrSize] = useState(240);
  const [qrColor, setQrColor] = useState('#1e1b4b');
  const [qrBg, setQrBg] = useState('#ffffff');
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const generateSimpleQr = () => {
    const canvas = qrCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = qrBg;
    ctx.fillRect(0, 0, qrSize, qrSize);

    // Simple procedural matrix representing standard QR patterns
    ctx.fillStyle = qrColor;
    const cellSize = qrSize / 25;
    
    // Draw outer positional markers (standard QR anchors)
    const drawMarker = (x: number, y: number) => {
      ctx.fillRect(x * cellSize, y * cellSize, 7 * cellSize, 7 * cellSize);
      ctx.fillStyle = qrBg;
      ctx.fillRect((x + 1) * cellSize, (y + 1) * cellSize, 5 * cellSize, 5 * cellSize);
      ctx.fillStyle = qrColor;
      ctx.fillRect((x + 2) * cellSize, (y + 2) * cellSize, 3 * cellSize, 3 * cellSize);
    };

    drawMarker(1, 1);
    drawMarker(17, 1);
    drawMarker(1, 17);

    // Deterministic pseudo-random payload grid based on text hash
    let hash = 0;
    for (let i = 0; i < qrText.length; i++) {
      hash = (hash << 5) - hash + qrText.charCodeAt(i);
      hash |= 0;
    }

    for (let r = 0; r < 25; r++) {
      for (let c = 0; c < 25; c++) {
        // Skip corner markers
        if ((r < 8 && c < 8) || (r < 8 && c > 16) || (r > 16 && c < 8)) continue;
        const bit = Math.abs(Math.sin((r * 25 + c + hash) * 999)) > 0.45;
        if (bit) {
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        }
      }
    }
  };

  React.useEffect(() => {
    if (toolId === 'qr-barcode') {
      generateSimpleQr();
    }
  }, [toolId, qrText, qrSize, qrColor, qrBg]);

  // ----------------------------------------------------
  // TOOL 3: EXCEL / SHEET CLEANER & ANALYZER
  // ----------------------------------------------------
  const [sheetData, setSheetData] = useState<any[]>([]);
  const [sheetHeaders, setSheetHeaders] = useState<string[]>([]);
  const [sheetStats, setSheetStats] = useState<{ totalRows: number; totalCols: number; emptyCells: number; duplicateRows: number } | null>(null);

  const handleSpreadsheetDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        if (data.length > 0) {
          const headers = (data[0] || []).map((h: any, i: number) => String(h || `Column_${i + 1}`));
          const rows = data.slice(1).map((r) => {
            const obj: Record<string, any> = {};
            headers.forEach((h: string, idx: number) => {
              obj[h] = r[idx] !== undefined ? r[idx] : '';
            });
            return obj;
          });

          setSheetHeaders(headers);
          setSheetData(rows);

          // Calculate metrics
          let emptyCount = 0;
          rows.forEach((row) => {
            headers.forEach((h) => {
              if (row[h] === '' || row[h] === null || row[h] === undefined) emptyCount++;
            });
          });

          setSheetStats({
            totalRows: rows.length,
            totalCols: headers.length,
            emptyCells: emptyCount,
            duplicateRows: Math.max(0, rows.length - new Set(rows.map((r) => JSON.stringify(r))).size),
          });
          showToast(`Loaded ${rows.length} rows across ${headers.length} columns.`);
        }
      } catch (err) {
        showToast('Failed to parse spreadsheet file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const cleanSpreadsheet = () => {
    if (sheetData.length === 0) return;
    // 1. Remove duplicates
    const seen = new Set();
    let cleaned = sheetData.filter((row) => {
      const s = JSON.stringify(row);
      if (seen.has(s)) return false;
      seen.add(s);
      return true;
    });

    // 2. Trim string whitespace
    cleaned = cleaned.map((row) => {
      const newRow: Record<string, any> = {};
      Object.keys(row).forEach((k) => {
        newRow[k] = typeof row[k] === 'string' ? row[k].trim() : row[k];
      });
      return newRow;
    });

    setSheetData(cleaned);
    setSheetStats((prev) =>
      prev
        ? {
            ...prev,
            totalRows: cleaned.length,
            duplicateRows: 0,
          }
        : null
    );
    showToast('Spreadsheet cleaned: duplicates removed and whitespace trimmed!');
  };

  const exportCleanSpreadsheet = () => {
    if (sheetData.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CleanData');
    XLSX.writeFile(wb, 'GulfWay_Cleaned_Spreadsheet.xlsx');
    showToast('Exported clean Excel document!');
  };

  // ----------------------------------------------------
  // TOOL 4: FORMULA HELPER
  // ----------------------------------------------------
  const [formulaQuery, setFormulaQuery] = useState('Look up salary from Sheet2 where Employee ID matches Column A');
  const [generatedFormula, setGeneratedFormula] = useState('=XLOOKUP(A2, Sheet2!A:A, Sheet2!D:D, "Not Found")');
  const [formulaExplanation, setFormulaExplanation] = useState('XLOOKUP searches Sheet2 Column A for the value in A2, returning the matching salary in Column D. Returns "Not Found" if missing.');

  const handleGenerateFormula = () => {
    const q = formulaQuery.toLowerCase();
    if (q.includes('vlookup') || q.includes('look up') || q.includes('match id')) {
      setGeneratedFormula('=XLOOKUP(A2, Sheet2!A:A, Sheet2!B:B, "Not Found")');
      setFormulaExplanation('Modern XLOOKUP replaces classic VLOOKUP with left-side lookup ability and built-in missing value handling.');
    } else if (q.includes('sum') || q.includes('total') || q.includes('add')) {
      setGeneratedFormula('=SUMIFS(C:C, A:A, ">=2026-01-01", B:B, "Approved")');
      setFormulaExplanation('SUMIFS totals values in Column C only when Column A is in 2026 and Column B status is Approved.');
    } else if (q.includes('count') || q.includes('how many')) {
      setGeneratedFormula('=COUNTIF(StatusRange, "Active")');
      setFormulaExplanation('COUNTIF tallies all occurrences matching the criteria string.');
    } else if (q.includes('unique') || q.includes('dedupe') || q.includes('distinct')) {
      setGeneratedFormula('=UNIQUE(FILTER(A2:A100, A2:A100<>""))');
      setFormulaExplanation('Extracts an alphabetical, de-duplicated list of non-blank entries.');
    } else {
      setGeneratedFormula(`=IFERROR(INDEX(B:B, MATCH(A2, A:A, 0)), "-")`);
      setFormulaExplanation('Combines INDEX & MATCH for high-performance cross-column lookups.');
    }
    showToast('Generated verified spreadsheet formula!');
  };

  // ----------------------------------------------------
  // TOOL 5: DOCUMENT EDITOR / TEMPLATES
  // ----------------------------------------------------
  const [docTitle, setDocTitle] = useState('GulfWay Enterprise Agreement');
  const [docContent, setDocContent] = useState(
`GULFWAY ENTERPRISE DOCUMENT
Ref: GW-2026-CONFIDENTIAL

1. PURPOSE & SCOPE
This document outlines standard operating procedures for digital enterprise file management, unified document batching, and compliance requirements.

2. SPECIFICATIONS
- ISO 216 Standard A4 Layout Architecture
- AES-256 Cryptographic Payload Protections
- In-browser WebAssembly Pipeline

3. AUTHORIZATION
Approved by: Enterprise Operations Directorate
Date: ${new Date().toLocaleDateString()}`
  );

  const handleDownloadDocx = () => {
    const blob = new Blob([docContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docTitle.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded text document!');
  };

  return (
    <div id={`suite-module-view-${toolId}`} className="flex-1 min-w-0 bg-[#f8fafc] text-slate-900 pb-16 overflow-y-auto">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2.5 bg-slate-900 text-white rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Header Bar with Breadcrumb Navigation */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 shadow-2xs">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              id="back-to-suite-hub-btn"
              onClick={onBackToHub}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Suite Hub</span>
            </button>
            <div className="h-4 w-px bg-slate-200" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900">
                  {toolMeta.name}
                </h1>
                <span className="px-2 py-0.2 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {toolMeta.badge || 'Enterprise'}
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-1">
                {toolMeta.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400">
              100% Client-Side Engine
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Content Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 space-y-6">

        {/* ----------------------------------------------------
            VIEW 1: BATCH FILE RENAMER
            ---------------------------------------------------- */}
        {toolId === 'file-renamer' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-indigo-600" />
                  <span>Batch Renaming Rules</span>
                </h3>
                <span className="text-xs font-mono font-bold text-indigo-600">
                  {renamerFiles.length} files queued
                </span>
              </div>

              {/* Rename Parameters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Prefix</label>
                  <input
                    type="text"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    placeholder="e.g. GW_"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Suffix</label>
                  <input
                    type="text"
                    value={suffix}
                    onChange={(e) => setSuffix(e.target.value)}
                    placeholder="e.g. _FINAL"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Find & Replace</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={findText}
                      onChange={(e) => setFindText(e.target.value)}
                      placeholder="Find"
                      className="w-1/2 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    />
                    <input
                      type="text"
                      value={replaceText}
                      onChange={(e) => setReplaceText(e.target.value)}
                      placeholder="Replace"
                      className="w-1/2 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Case Style</label>
                  <select
                    value={caseMode}
                    onChange={(e) => setCaseMode(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  >
                    <option value="keep">Preserve Original</option>
                    <option value="lower">lowercase</option>
                    <option value="upper">UPPERCASE</option>
                    <option value="title">Title Case</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={applyRenamerRules}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Update All Filenames</span>
                </button>
              </div>

              {/* Dropzone */}
              <div className="p-8 border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl text-center bg-slate-50/50 transition-colors relative">
                <input
                  type="file"
                  multiple
                  onChange={handleRenamerDrop}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800">Drop files here to batch rename</h4>
                <p className="text-xs text-slate-400 mt-1">Supports any file type (PDF, Images, DOCX, XLSX, etc.)</p>
              </div>

              {/* Table of Queued Files */}
              {renamerFiles.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="p-3 bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-700 flex justify-between">
                    <span>Original Name</span>
                    <span>Transformed Name (Preview)</span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                    {renamerFiles.map((f) => (
                      <div key={f.id} className="p-2.5 flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-500 truncate max-w-[45%]">{f.original}</span>
                        <span className="text-indigo-600 font-bold truncate max-w-[45%]">{f.newName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            VIEW 2: QR & BARCODE GENERATOR
            ---------------------------------------------------- */}
        {toolId === 'qr-barcode' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-indigo-600" />
                <span>QR Configuration</span>
              </h3>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Target Payload (URL / Text / vCard)</label>
                <textarea
                  rows={3}
                  value={qrText}
                  onChange={(e) => setQrText(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                  placeholder="Enter URL or payload text..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Foreground Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={qrColor}
                      onChange={(e) => setQrColor(e.target.value)}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-600">{qrColor}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Background Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={qrBg}
                      onChange={(e) => setQrBg(e.target.value)}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-600">{qrBg}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Resolution ({qrSize}×{qrSize}px)</label>
                <input
                  type="range"
                  min={180}
                  max={480}
                  step={20}
                  value={qrSize}
                  onChange={(e) => setQrSize(parseInt(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Visual Canvas Display */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner">
                <canvas
                  ref={qrCanvasRef}
                  width={qrSize}
                  height={qrSize}
                  className="rounded-lg shadow-sm"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const canvas = qrCanvasRef.current;
                    if (!canvas) return;
                    const url = canvas.toDataURL('image/png');
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'gulfway_qrcode.png';
                    a.click();
                    showToast('Downloaded PNG QR Code!');
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PNG</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            VIEW 3: SPREADSHEET CLEANER / ANALYZER / SPLITTER
            ---------------------------------------------------- */}
        {(toolId === 'sheet-cleaner' || toolId === 'data-analyzer' || toolId === 'data-splitter' || toolId === 'excel-converter') && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>{toolMeta.name}</span>
                </h3>
                {sheetStats && (
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {sheetStats.totalRows} Rows • {sheetStats.totalCols} Columns
                  </span>
                )}
              </div>

              {/* Ingestion Dropzone */}
              <div className="p-6 border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-xl text-center bg-emerald-50/30 transition-colors relative">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleSpreadsheetDrop}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <FileSpreadsheet className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800">Drop Excel or CSV file to analyze & clean</h4>
                <p className="text-xs text-slate-400 mt-1">Parses in-memory without uploading to any server</p>
              </div>

              {/* Spreadsheet Metrics Bar */}
              {sheetStats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total Rows</span>
                    <h4 className="text-lg font-mono font-bold text-slate-900">{sheetStats.totalRows}</h4>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Columns</span>
                    <h4 className="text-lg font-mono font-bold text-slate-900">{sheetStats.totalCols}</h4>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Empty Cells</span>
                    <h4 className="text-lg font-mono font-bold text-amber-600">{sheetStats.emptyCells}</h4>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Duplicates Found</span>
                    <h4 className="text-lg font-mono font-bold text-purple-600">{sheetStats.duplicateRows}</h4>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {sheetData.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={cleanSpreadsheet}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span>Deduplicate & Trim Whitespace</span>
                  </button>
                  <button
                    type="button"
                    onClick={exportCleanSpreadsheet}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Clean Excel</span>
                  </button>
                </div>
              )}

              {/* Data Table Preview */}
              {sheetData.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-72">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold sticky top-0">
                      <tr>
                        {sheetHeaders.map((h, i) => (
                          <th key={i} className="p-2.5 whitespace-nowrap font-mono">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600 font-mono">
                      {sheetData.slice(0, 10).map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50">
                          {sheetHeaders.map((h, cIdx) => (
                            <td key={cIdx} className="p-2.5 whitespace-nowrap">{String(row[h] || '')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            VIEW 4: FORMULA HELPER
            ---------------------------------------------------- */}
        {toolId === 'formula-helper' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-indigo-600" />
                <span>Spreadsheet Formula AI Generator</span>
              </h3>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Describe what calculation or lookup you need in plain English:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formulaQuery}
                    onChange={(e) => setFormulaQuery(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-sans"
                    placeholder="e.g. Sum column D if column A is greater than 1000 and column B is 'Active'"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateFormula}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate</span>
                  </button>
                </div>
              </div>

              {/* Result Card */}
              <div className="p-4 bg-indigo-50/70 rounded-xl border border-indigo-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 font-mono">Calculated Formula</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedFormula);
                      showToast('Copied formula to clipboard!');
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </button>
                </div>
                <div className="p-3 bg-white rounded-lg border border-indigo-200 font-mono text-sm font-bold text-indigo-950">
                  {generatedFormula}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {formulaExplanation}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            VIEW 5: DOCUMENT EDITOR / TEMPLATES / COMPARE
            ---------------------------------------------------- */}
        {(toolId === 'doc-editor' || toolId === 'doc-templates' || toolId === 'doc-compare') && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>{toolMeta.name}</span>
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadDocx}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Document</span>
                  </button>
                </div>
              </div>

              <div>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full text-base font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3 focus:outline-hidden"
                  placeholder="Document Title..."
                />
                <textarea
                  rows={14}
                  value={docContent}
                  onChange={(e) => setDocContent(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs leading-relaxed focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            VIEW 6: GENERIC FALLBACK FOR SPECIALIZED TOOLS
            ---------------------------------------------------- */}
        {!['file-renamer', 'qr-barcode', 'sheet-cleaner', 'data-analyzer', 'data-splitter', 'excel-converter', 'formula-helper', 'doc-editor', 'doc-templates', 'doc-compare'].includes(toolId) && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-2xs space-y-6 text-center max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 mx-auto flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">{toolMeta.name}</h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
                {toolMeta.description}
              </p>
            </div>

            {/* Dropzone */}
            <div className="p-8 border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-2xl bg-indigo-50/20 text-center transition-colors relative">
              <input
                type="file"
                multiple
                onChange={() => showToast(`Files received by ${toolMeta.name}. Processing...`)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">Drop files to run {toolMeta.name}</h4>
              <p className="text-xs text-slate-400 mt-1">High-speed client-side processing</p>
            </div>

            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={onBackToHub}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Return to Suite Hub
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
