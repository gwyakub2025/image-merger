import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  Layers, 
  FileStack, 
  FileArchive, 
  Edit3, 
  Archive, 
  CopyCheck, 
  FileText, 
  ArrowRightLeft, 
  Files, 
  GitCompare, 
  ScanText, 
  FileSpreadsheet, 
  Scissors, 
  FileCheck, 
  FileLock, 
  Stamp, 
  EyeOff, 
  Filter, 
  Split, 
  BarChart3, 
  Calculator, 
  Presentation, 
  FileVideo, 
  Image as ImageIcon, 
  Maximize2, 
  QrCode, 
  Languages, 
  LayoutGrid,
  CheckCircle2,
  Zap,
  Lock,
  Cpu,
  UserCheck,
  Car
} from 'lucide-react';
import { ActiveTab, SuiteCategoryId } from '../../types';
import { SUITE_CATEGORIES, SUITE_TOOLS, SuiteToolItem } from '../../utils/suiteRegistry';
import { GulfWayLogo } from '../GulfWayLogo';
import { useLanguage } from '../../i18n/LanguageContext';

interface SuiteHubViewProps {
  onSelectTab: (tab: ActiveTab) => void;
}

export const SuiteHubView: React.FC<SuiteHubViewProps> = ({ onSelectTab }) => {
  const { t, isRtl } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SuiteCategoryId | 'all'>('all');

  // Filter tools based on search and category
  const filteredTools = useMemo(() => {
    let result = SUITE_TOOLS;
    if (selectedCategory !== 'all') {
      result = result.filter((tool) => tool.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (tool) =>
          tool.name.toLowerCase().includes(q) ||
          tool.description.toLowerCase().includes(q) ||
          tool.keywords.some((k) => k.toLowerCase().includes(q))
      );
    }
    return result;
  }, [selectedCategory, searchQuery]);

  // Dynamic icon resolver
  const renderToolIcon = (iconName: string, category: SuiteCategoryId) => {
    const iconClass = "w-5 h-5";
    switch (iconName) {
      case 'FileStack': return <FileStack className={iconClass} />;
      case 'FileArchive': return <FileArchive className={iconClass} />;
      case 'Edit3': return <Edit3 className={iconClass} />;
      case 'Layers': return <Layers className={iconClass} />;
      case 'Archive': return <Archive className={iconClass} />;
      case 'CopyCheck': return <CopyCheck className={iconClass} />;
      case 'FileText': return <FileText className={iconClass} />;
      case 'ArrowRightLeft': return <ArrowRightLeft className={iconClass} />;
      case 'Files': return <Files className={iconClass} />;
      case 'GitCompare': return <GitCompare className={iconClass} />;
      case 'ScanText': return <ScanText className={iconClass} />;
      case 'FileCheck': return <FileCheck className={iconClass} />;
      case 'Scissors': return <Scissors className={iconClass} />;
      case 'FileSpreadsheet': return <FileSpreadsheet className={iconClass} />;
      case 'ImageIcon': return <ImageIcon className={iconClass} />;
      case 'FileLock': return <FileLock className={iconClass} />;
      case 'Stamp': return <Stamp className={iconClass} />;
      case 'EyeOff': return <EyeOff className={iconClass} />;
      case 'Filter': return <Filter className={iconClass} />;
      case 'Split': return <Split className={iconClass} />;
      case 'BarChart3': return <BarChart3 className={iconClass} />;
      case 'Calculator': return <Calculator className={iconClass} />;
      case 'Presentation': return <Presentation className={iconClass} />;
      case 'FileVideo': return <FileVideo className={iconClass} />;
      case 'Maximize2': return <Maximize2 className={iconClass} />;
      case 'QrCode': return <QrCode className={iconClass} />;
      case 'Languages': return <Languages className={iconClass} />;
      case 'ShieldCheck': return <ShieldCheck className={iconClass} />;
      case 'UserCheck': return <UserCheck className={iconClass} />;
      case 'Car': return <Car className={iconClass} />;
      default: return <Sparkles className={iconClass} />;
    }
  };

  const getCategoryColor = (catId: SuiteCategoryId) => {
    switch (catId) {
      case 'file-management': return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', iconBg: 'bg-blue-600 text-white' };
      case 'documents': return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', iconBg: 'bg-emerald-600 text-white' };
      case 'pdf-tools': return { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', iconBg: 'bg-indigo-600 text-white' };
      case 'excel-sheets': return { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', iconBg: 'bg-teal-700 text-white' };
      case 'presentations': return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', iconBg: 'bg-amber-600 text-white' };
      case 'image-tools': return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', iconBg: 'bg-purple-600 text-white' };
      case 'language': return { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', iconBg: 'bg-cyan-600 text-white' };
      case 'admin': return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', iconBg: 'bg-slate-700 text-white' };
    }
  };

  return (
    <div id="suite-hub-view" className="flex-1 min-w-0 bg-[#f8fafc] text-slate-900 pb-16 overflow-y-auto">
      {/* Enterprise Suite Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-indigo-900/60 px-4 sm:px-8 py-8 relative overflow-hidden shadow-sm">
        {/* Subtle background circuit accents */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner">
                  <GulfWayLogo className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                      GulfWay Enterprise Suite
                    </h1>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                      v3.2 UNIFIED
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-indigo-200/90 font-medium">
                    Integrated 8-pillar workplace platform: File Management, Documents, PDF, Excel, Slides, Media, Language, & Admin.
                  </p>
                </div>
              </div>
            </div>

            {/* Enterprise Security Pill Badges */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-medium text-indigo-100">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% Client-Side Private</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-medium text-indigo-100">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Zero Server Uploads</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-medium text-indigo-100">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>WebAssembly Speed</span>
              </div>
            </div>
          </div>

          {/* Interactive Search Bar */}
          <div className="mt-6 relative max-w-2xl">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-indigo-300 absolute left-4 pointer-events-none" />
              <input
                type="text"
                id="suite-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across all 38 enterprise tools (e.g. 'pdf to word', 'vlookup', 'watermark', 'compress', 'rename')..."
                className="w-full pl-12 pr-10 py-3.5 bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-slate-900 placeholder:text-indigo-200/70 focus:placeholder:text-slate-400 rounded-xl border border-white/20 focus:border-indigo-500 focus:outline-hidden transition-all text-sm shadow-inner font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-xs font-mono text-indigo-300 hover:text-white px-1.5 py-0.5 rounded cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Suite Explorer Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 space-y-6">
        {/* Category Filter Pills Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-thin">
          <button
            type="button"
            id="cat-pill-all"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>All Tools</span>
            <span className={`text-[10px] font-mono px-1 rounded ${
              selectedCategory === 'all' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
            }`}>
              {SUITE_TOOLS.length}
            </span>
          </button>

          {SUITE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                id={`cat-pill-${cat.id}`}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isSelected
                    ? `${cat.colorClass} text-white shadow-xs`
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{cat.iconSymbol}</span>
                <span>{cat.title}</span>
                <span className={`text-[10px] font-mono px-1 rounded ${
                  isSelected ? 'bg-black/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {cat.toolCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* Results Counter & Search Indicator */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <div className="flex items-center gap-2">
            <span>Showing <strong>{filteredTools.length}</strong> enterprise module{filteredTools.length !== 1 ? 's' : ''}</span>
            {searchQuery && (
              <span className="text-indigo-600 font-medium">
                matching "{searchQuery}"
              </span>
            )}
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Client-Side Execution Engine
          </span>
        </div>

        {/* Tools Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTools.map((tool) => {
            const style = getCategoryColor(tool.category);
            return (
              <div
                key={tool.id}
                id={`suite-tool-card-${tool.id}`}
                className="bg-white rounded-xl border border-slate-200/90 hover:border-indigo-400 hover:shadow-md transition-all p-4 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
                onClick={() => onSelectTab(tool.id)}
              >
                {/* Top: Icon & Status Badge */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className={`p-2.5 rounded-xl ${style.iconBg} shadow-xs group-hover:scale-105 transition-transform`}>
                      {renderToolIcon(tool.iconName, tool.category)}
                    </div>
                    <div className="flex items-center gap-1">
                      {tool.badge && (
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${style.bg} ${style.text} border ${style.border}`}>
                          {tool.badge}
                        </span>
                      )}
                      {tool.status === 'pro' && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                          PRO
                        </span>
                      )}
                      {tool.status === 'ai' && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                          AI
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5 mb-1.5">
                    <span>{tool.name}</span>
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-4">
                    {tool.description}
                  </p>
                </div>

                {/* Footer: Category indicator & Launch Button */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <span className="text-[10px] font-medium text-slate-400 capitalize">
                    {tool.category.replace('-', ' ')}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                    <span>Launch</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty Search Fallback */}
        {filteredTools.length === 0 && (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 max-w-lg mx-auto">
            <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 mb-1">No matching tools found</h3>
            <p className="text-xs text-slate-500 mb-4">
              We couldn't find any enterprise tool matching "{searchQuery}". Try searching for PDF, Excel, Word, or Image.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Reset Search & Filters
            </button>
          </div>
        )}

        {/* Category Blueprint Summary Section */}
        <div className="pt-8 border-t border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
              GulfWay Enterprise Suite Taxonomy
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              38 Active Modules
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {SUITE_CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                className={`p-4 rounded-xl border ${cat.borderClass} ${cat.bgLightClass} space-y-2`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{cat.iconSymbol}</span>
                    <h4 className={`text-xs font-bold uppercase tracking-wide ${cat.accentTextClass}`}>
                      {cat.title}
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-white rounded border border-slate-200">
                    {cat.toolCount} tools
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-normal">
                  {cat.description}
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`text-[11px] font-bold ${cat.accentTextClass} hover:underline flex items-center gap-1 cursor-pointer`}
                  >
                    <span>View all {cat.title}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
