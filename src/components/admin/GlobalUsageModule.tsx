import React, { useState } from 'react';
import { GlobalUsageStats } from '../../types/admin';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Layers, 
  FileEdit, 
  ArrowRightLeft, 
  FileBarChart2, 
  TableProperties, 
  Maximize2, 
  ShieldCheck, 
  Cpu, 
  HardDrive, 
  Zap, 
  Coins, 
  Clock, 
  Sparkles,
  Calendar,
  CheckCircle2
} from 'lucide-react';

interface GlobalUsageModuleProps {
  stats: GlobalUsageStats;
  onShowToast: (msg: string) => void;
}

type MetricKey = 'totalSheets' | 'conversions' | 'pdfEdits' | 'wpsRuns' | 'activeUsers';

const METRIC_CONFIGS: Record<MetricKey, { label: string; color: string; fill: string; unit: string }> = {
  totalSheets: { label: 'A4 Sheets Generated', color: '#4f46e5', fill: '#e0e7ff', unit: 'sheets' },
  conversions: { label: 'Format Conversions', color: '#0284c7', fill: '#e0f2fe', unit: 'files' },
  pdfEdits: { label: 'PDF Edits & Signatures', color: '#059669', fill: '#d1fae5', unit: 'docs' },
  wpsRuns: { label: 'WPS SIF Reports', color: '#d97706', fill: '#fef3c7', unit: 'batches' },
  activeUsers: { label: 'Active Users', color: '#7c3aed', fill: '#ede9fe', unit: 'users' },
};

export const GlobalUsageModule: React.FC<GlobalUsageModuleProps> = ({ stats, onShowToast }) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('totalSheets');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  const activeConfig = METRIC_CONFIGS[selectedMetric];
  const maxMetricValue = Math.max(...stats.dailyTrend.map((p) => p[selectedMetric]), 1);

  const handleExportTelemetryCsv = () => {
    const headers = 'Date,A4_Sheets_Generated,Format_Conversions,PDF_Edits,WPS_SIF_Runs,Active_Users\n';
    const rows = stats.dailyTrend
      .map((d) => `${d.date},${d.totalSheets},${d.conversions},${d.pdfEdits},${d.wpsRuns},${d.activeUsers}`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `gulf-way-global-usage-telemetry-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowToast('Exported global usage telemetry report (CSV)');
  };

  return (
    <div id="admin-global-usage-module" className="space-y-6">
      {/* Top Header & Export */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Global Application Usage &amp; Telemetry
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time throughput metrics, client-side zero-leakage bandwidth savings, and multi-tool activity trends.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportTelemetryCsv}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Export Telemetry (CSV)</span>
        </button>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Metric 1: Total Sheets */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">A4 Sheets</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-mono font-bold text-slate-900">
            {stats.totalProcessedSheets.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-1">
            <TrendingUp className="w-3 h-3" />
            <span>+24.2% this month</span>
          </div>
        </div>

        {/* Metric 2: Bandwidth Saved */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Bandwidth Saved</span>
            <HardDrive className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-mono font-bold text-slate-900">
            {stats.totalSavedBandwidthGb} GB
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">
            77.3% ratio in-memory
          </div>
        </div>

        {/* Metric 3: Active Today */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Today</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-mono font-bold text-slate-900">
            {stats.totalActiveToday}
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">
            out of {stats.totalRegisteredUsers} users
          </div>
        </div>

        {/* Metric 4: Cost Savings */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Estimated Savings</span>
            <Coins className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-mono font-bold text-slate-900">
            AED {(stats.costSavingsEstimatedAed / 1000).toFixed(1)}k
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">
            Local browser processing
          </div>
        </div>

        {/* Metric 5: Average Speed */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Avg Latency</span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-xl font-mono font-bold text-slate-900">
            {stats.averageProcessingTimeMs} ms
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-1">
            Zero cloud lag
          </div>
        </div>

        {/* Metric 6: Uptime */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Engine Uptime</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-mono font-bold text-slate-900">
            {stats.uptimePercentage}%
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-1">
            High Availability SLA
          </div>
        </div>
      </div>

      {/* Interactive Daily Throughput Trend Chart */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span>14-Day Throughput &amp; Activity Trend</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a dimension to inspect volumetric daily processing across all active tenant accounts.
            </p>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            {(Object.keys(METRIC_CONFIGS) as MetricKey[]).map((key) => {
              const cfg = METRIC_CONFIGS[key];
              const isSelected = selectedMetric === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedMetric(key)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* SVG Interactive Chart Canvas */}
        <div className="relative pt-4 pb-2">
          {/* Hover tooltip */}
          {hoveredPointIndex !== null && (
            <div
              className="absolute -top-3 z-20 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-xl border border-slate-700 pointer-events-none transform -translate-x-1/2"
              style={{
                left: `${(hoveredPointIndex / (stats.dailyTrend.length - 1)) * 90 + 5}%`,
              }}
            >
              <div className="font-bold text-[11px] text-indigo-300">
                {stats.dailyTrend[hoveredPointIndex].displayDate} (
                {stats.dailyTrend[hoveredPointIndex].date})
              </div>
              <div className="font-mono text-sm font-bold">
                {stats.dailyTrend[hoveredPointIndex][selectedMetric].toLocaleString()}{' '}
                {activeConfig.unit}
              </div>
            </div>
          )}

          {/* Bar Chart Representation */}
          <div className="h-52 flex items-end justify-between gap-1.5 sm:gap-3 px-2 pt-6 border-b border-slate-200">
            {stats.dailyTrend.map((point, idx) => {
              const val = point[selectedMetric];
              const heightPercent = Math.max(8, Math.round((val / maxMetricValue) * 100));
              const isHovered = hoveredPointIndex === idx;

              return (
                <div
                  key={point.date}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                  onMouseEnter={() => setHoveredPointIndex(idx)}
                  onMouseLeave={() => setHoveredPointIndex(null)}
                >
                  {/* Bar */}
                  <div
                    className={`w-full rounded-t-md transition-all duration-150 ${
                      isHovered ? 'brightness-110 ring-2 ring-indigo-400' : 'opacity-90 hover:opacity-100'
                    }`}
                    style={{
                      height: `${heightPercent}%`,
                      backgroundColor: activeConfig.color,
                    }}
                  />
                  {/* Date Label */}
                  <span
                    className={`text-[9px] font-mono mt-2 truncate w-full text-center ${
                      isHovered ? 'text-indigo-700 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {point.displayDate}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono pt-2">
            <span>Peak Day: {maxMetricValue.toLocaleString()} {activeConfig.unit}</span>
            <span>14-Day Cumulative: {stats.dailyTrend.reduce((acc, p) => acc + p[selectedMetric], 0).toLocaleString()} {activeConfig.unit}</span>
          </div>
        </div>
      </div>

      {/* Module Utilization Breakdown & Architecture Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Module breakdown (2 cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">
              Module Distribution &amp; Operational Share
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              6 Core Engines Active
            </span>
          </div>

          <div className="space-y-3.5">
            {stats.moduleBreakdown.map((mod) => {
              const totalOpsAll = stats.moduleBreakdown.reduce((acc, m) => acc + m.totalOperations, 0);
              const sharePercent = Math.round((mod.totalOperations / totalOpsAll) * 100);

              return (
                <div key={mod.moduleKey} className="text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: mod.color }}
                      />
                      <span className="font-bold text-slate-800">{mod.name}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-slate-500">{mod.totalVolume}</span>
                      <span className="font-bold text-slate-700 w-12 text-right">
                        {sharePercent}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${sharePercent}%`,
                        backgroundColor: mod.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gulf Way Group Core Business Model Card (1 col) */}
        <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-2xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-sm tracking-tight">
                Core Business Architecture
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Gulf Way Group provides an air-gapped, zero-leakage document processing standard for UAE &amp; GCC government and enterprise compliance.
            </p>
          </div>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Client-Side Engine:</strong> Raw salary files &amp; commercial contracts never leave browser memory.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>MOL &amp; WPS Ready:</strong> 100% compliant with Ministry of Human Resources payroll regulations.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>A4 ISO 216 Optimizer:</strong> Reduces print and archive storage overhead by up to 60%.</span>
            </div>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700 text-[11px] font-mono text-slate-300 flex items-center justify-between">
            <span>ENGINE INTEGRITY</span>
            <span className="text-emerald-400 font-bold">100% VERIFIED</span>
          </div>
        </div>
      </div>
    </div>
  );
};
