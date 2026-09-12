import React, { useState, useMemo } from 'react';
import { AuditLogEntry } from '../../types/admin';
import { 
  ShieldAlert, 
  Search, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Filter, 
  FileText, 
  MapPin, 
  Layers, 
  FileEdit, 
  ArrowRightLeft, 
  FileBarChart2, 
  TableProperties, 
  Maximize2 
} from 'lucide-react';

interface AuditLogModuleProps {
  logs: AuditLogEntry[];
  onShowToast: (msg: string) => void;
}

export const AuditLogModule: React.FC<AuditLogModuleProps> = ({ logs, onShowToast }) => {
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      const matchesSearch =
        l.userName.toLowerCase().includes(search.toLowerCase()) ||
        l.userEmail.toLowerCase().includes(search.toLowerCase()) ||
        l.action.toLowerCase().includes(search.toLowerCase()) ||
        l.details.toLowerCase().includes(search.toLowerCase()) ||
        l.location.toLowerCase().includes(search.toLowerCase());

      const matchesModule = moduleFilter === 'all' || l.module === moduleFilter;
      const matchesStatus = statusFilter === 'all' || l.status === statusFilter;

      return matchesSearch && matchesModule && matchesStatus;
    });
  }, [logs, search, moduleFilter, statusFilter]);

  const handleExportLogs = () => {
    const jsonStr = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `gulf-way-audit-trail-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowToast(`Exported ${filteredLogs.length} audit trail records as JSON`);
  };

  return (
    <div id="admin-audit-log-module" className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Enterprise Security &amp; Compliance Audit Logs
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {filteredLogs.length} Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Immutable transaction records of all batch rendering, format conversions, payroll SIF runs, and redaction actions.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportLogs}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Export Audit Trail (JSON)</span>
        </button>
      </div>

      {/* Filter and search bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit trail by user, action, IP, or location..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 font-medium text-slate-700 outline-none"
          >
            <option value="all">All Modules</option>
            <option value="batcher">A4 Batcher</option>
            <option value="pdf_editor">PDF Editor</option>
            <option value="converter">Format Converter</option>
            <option value="wps">WPS Extractor</option>
            <option value="sheet_merger">Sheet Merger</option>
            <option value="resizer">Image Sizer</option>
            <option value="admin">Admin Portal</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 font-medium text-slate-700 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Action &amp; Module</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">Origin IP &amp; Location</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No audit records match your filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{log.userName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.userEmail}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-700">{log.action}</div>
                      <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-mono uppercase font-bold bg-slate-100 text-slate-600">
                        {log.module}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs text-slate-600 text-[11px]">
                      {log.details}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-500">
                      <div className="font-mono">{log.ipAddress}</div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <MapPin className="w-2.5 h-2.5" />
                        <span>{log.location}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {log.status === 'success' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          Success
                        </span>
                      ) : log.status === 'warning' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                          Warning
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3 h-3 text-rose-500" />
                          Error
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
