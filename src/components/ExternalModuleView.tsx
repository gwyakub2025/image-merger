import React, { useState } from 'react';
import { 
  ExternalLink, 
  RotateCw, 
  ShieldCheck, 
  Sparkles, 
  Globe, 
  CheckCircle2, 
  ArrowUpRight, 
  FileSpreadsheet, 
  FileText,
  Info
} from 'lucide-react';
import { GulfWayLogo } from './GulfWayLogo';

interface ExternalModuleViewProps {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  iconType: 'wps' | 'merger';
  tag: string;
  description: string;
  features: string[];
}

export const ExternalModuleView: React.FC<ExternalModuleViewProps> = ({
  id,
  title,
  subtitle,
  url,
  iconType,
  tag,
  description,
  features,
}) => {
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    setHasLoadError(false);
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div id={`external-module-${id}`} className="flex-1 flex flex-col min-w-0 bg-[#0f172a] text-slate-100 min-h-[calc(100vh-4rem)]">
      {/* Top Header Bar */}
      <div className="bg-[#1e293b] border-b border-slate-700/80 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-800/90 rounded-xl border border-slate-700 flex items-center justify-center shadow-inner">
            <GulfWayLogo className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                {title}
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {tag}
              </span>
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Connected
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              {subtitle} • <span className="font-mono text-slate-400">{url}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            title="Reload Module View"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md hover:shadow-indigo-500/25 cursor-pointer"
          >
            <span>Open in New Tab</span>
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Feature & Description Ribbon */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2 shrink-0">
        <div className="flex items-center gap-2 max-w-2xl truncate">
          <Info className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="truncate">{description}</span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          {features.slice(0, 3).map((feat, idx) => (
            <span key={idx} className="flex items-center gap-1 text-slate-300">
              <CheckCircle2 className="w-3 h-3 text-indigo-400" />
              {feat}
            </span>
          ))}
        </div>
      </div>

      {/* Main Interactive Stage / Iframe View */}
      <div className="flex-1 relative w-full h-[calc(100vh-10rem)] min-h-[550px] bg-[#0b1120]">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-[#0b1120]/90 backdrop-blur-xs flex flex-col items-center justify-center z-10 p-6 text-center">
            <GulfWayLogo className="w-12 h-12 animate-bounce mb-4" />
            <h3 className="text-sm font-bold text-white mb-1">
              Connecting to {title}...
            </h3>
            <p className="text-xs text-slate-400 max-w-md mb-4 font-mono">
              {url}
            </p>
            <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="w-full h-full bg-indigo-500 animate-pulse"></div>
            </div>
          </div>
        )}

        {/* Embedded Iframe */}
        <iframe
          key={iframeKey}
          src={url}
          title={title}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-popups allow-modals"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasLoadError(true);
          }}
        />

        {/* Fallback & Helper Notice if iframe is restricted by browser security policies */}
        {hasLoadError && (
          <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-6 text-center z-20">
            <div className="p-3 bg-indigo-950/60 border border-indigo-800 rounded-2xl mb-4">
              <GulfWayLogo className="w-12 h-12" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Launch {title}
            </h3>
            <p className="text-sm text-slate-400 max-w-lg mb-6">
              This module is hosted securely on Vercel at <span className="text-indigo-400 font-mono">{url}</span>. Click below to open the dedicated workspace in a new tab.
            </p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-2 text-sm shadow-lg transition-all"
            >
              <span>Launch {title}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
