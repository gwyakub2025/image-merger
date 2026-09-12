import React, { useState, useRef } from 'react';
import { 
  Languages, 
  ArrowRightLeft, 
  Copy, 
  Check, 
  Download, 
  UploadCloud, 
  FileText, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2, 
  Trash2, 
  Volume2, 
  Globe, 
  ShieldCheck,
  FileCheck,
  Layers,
  ArrowRight
} from 'lucide-react';
import { 
  SupportedLangCode, 
  TranslationDomain, 
  DocumentTranslationJob 
} from '../../types/translator';
import { 
  SUPPORTED_LANGUAGES, 
  translateText, 
  extractTextFromDocument, 
  exportTranslatedFile 
} from '../../utils/translatorEngine';
import { useLanguage } from '../../i18n/LanguageContext';
import { formatBytes } from '../../utils/imageOptimizer';

interface TranslatorViewProps {
  onShowToast?: (msg: string) => void;
}

export const TranslatorView: React.FC<TranslatorViewProps> = ({ onShowToast }) => {
  const { t, isRtl } = useLanguage();

  // Active subtab: 'text' | 'document'
  const [activeTab, setActiveTab] = useState<'text' | 'document'>('text');

  // Text translation states
  const [sourceLang, setSourceLang] = useState<string>('auto');
  const [targetLang, setTargetLang] = useState<SupportedLangCode>('ar');
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [domain, setDomain] = useState<TranslationDomain>('general');
  const [isTranslatingText, setIsTranslatingText] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  // Document translation states
  const [docJob, setDocJob] = useState<DocumentTranslationJob | null>(null);
  const [isProcessingDoc, setIsProcessingDoc] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Swap languages
  const handleSwapLanguages = () => {
    if (sourceLang === 'auto') {
      setSourceLang(targetLang);
      setTargetLang('en');
    } else {
      const prevSource = sourceLang as SupportedLangCode;
      const prevTarget = targetLang;
      setSourceLang(prevTarget);
      setTargetLang(prevSource);
    }
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  // Perform text translation
  const handleTranslateText = async () => {
    if (!sourceText.trim()) return;
    setIsTranslatingText(true);
    try {
      const res = await translateText(sourceText, sourceLang, targetLang, domain);
      setTranslatedText(res.translatedText);
      onShowToast?.(t('translator.accuracyBadge'));
    } catch (err: any) {
      onShowToast?.(`Translation error: ${err?.message || err}`);
    } finally {
      setIsTranslatingText(false);
    }
  };

  // Copy translated text
  const handleCopyTranslated = () => {
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText);
    setHasCopied(true);
    onShowToast?.(t('action.copied'));
    setTimeout(() => setHasCopied(false), 2500);
  };

  // Handle document file upload
  const handleDocFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedDoc(e.target.files[0]);
      e.target.value = '';
    }
  };

  const processUploadedDoc = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const allowed = ['pdf', 'docx', 'xlsx', 'xls', 'csv', 'txt'];
    if (!allowed.includes(ext)) {
      onShowToast?.('Supported formats: PDF, DOCX, XLSX, TXT.');
      return;
    }

    const job: DocumentTranslationJob = {
      id: `doc_${Date.now()}`,
      file,
      name: file.name,
      size: file.size,
      type: ext,
      status: 'extracting',
      sourceLang: (sourceLang === 'auto' ? 'en' : sourceLang) as SupportedLangCode,
      targetLang,
      domain,
      progressPercent: 20,
    };
    setDocJob(job);
    setIsProcessingDoc(true);

    try {
      // Step 1: Extract Text
      const extractedText = await extractTextFromDocument(file);
      setDocJob((prev) =>
        prev
          ? {
              ...prev,
              status: 'translating',
              extractedText,
              progressPercent: 50,
            }
          : null
      );

      // Step 2: Translate via high-accuracy engine
      const res = await translateText(extractedText, sourceLang, targetLang, domain);

      // Step 3: Package translated file for download
      const exported = await exportTranslatedFile(file.name, res.translatedText, targetLang);
      const downloadUrl = URL.createObjectURL(exported.blob);

      setDocJob((prev) =>
        prev
          ? {
              ...prev,
              status: 'completed',
              translatedText: res.translatedText,
              translatedBlob: exported.blob,
              downloadUrl,
              downloadFileName: exported.filename,
              progressPercent: 100,
            }
          : null
      );

      onShowToast?.('Document translated successfully with layout preservation!');
    } catch (err: any) {
      setDocJob((prev) =>
        prev
          ? {
              ...prev,
              status: 'failed',
              errorMessage: err?.message || 'Document translation failed',
            }
          : null
      );
      onShowToast?.(`Document translation error: ${err?.message || err}`);
    } finally {
      setIsProcessingDoc(false);
    }
  };

  // Download translated document
  const handleDownloadDoc = () => {
    if (!docJob?.downloadUrl) return;
    const a = document.createElement('a');
    a.href = docJob.downloadUrl;
    a.download = docJob.downloadFileName || `translated_${docJob.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Languages className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {t('translator.title')}
            </h1>
            <span className="text-2xs font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-2 py-0.5 rounded-full">
              EN ⟷ AR Certified
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            {t('translator.subtitle')}
          </p>
        </div>

        {/* Domain Preset Selector */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 shrink-0">
          <span className="text-2xs font-semibold text-slate-500 px-1">
            {t('translator.style')}:
          </span>
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value as TranslationDomain)}
            className="text-xs font-semibold bg-white border border-slate-200 rounded-md px-2.5 py-1 text-slate-800 outline-none shadow-2xs"
          >
            <option value="general">{t('translator.style.general')}</option>
            <option value="legal">{t('translator.style.legal')}</option>
            <option value="hr">{t('translator.style.hr')}</option>
            <option value="technical">{t('translator.style.technical')}</option>
          </select>
        </div>
      </div>

      {/* Mode Subtabs: Text Translation vs Document Translation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('text')}
          className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'text'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          {t('translator.textTab')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('document')}
          className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'document'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          {t('translator.docTab')}
        </button>
      </div>

      {/* TEXT TRANSLATION VIEW */}
      {activeTab === 'text' && (
        <div className="space-y-4">
          {/* Language Selector Bar */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
            {/* Source Language */}
            <div className="flex items-center gap-2">
              <span className="text-2xs font-bold text-slate-400 uppercase">From</span>
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 outline-none"
              >
                <option value="auto">{t('translator.autoDetect')}</option>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Swap Button */}
            <button
              type="button"
              onClick={handleSwapLanguages}
              className="p-2 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-colors shadow-2xs cursor-pointer"
              title={t('action.swap')}
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>

            {/* Target Language */}
            <div className="flex items-center gap-2">
              <span className="text-2xs font-bold text-slate-400 uppercase">To</span>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value as SupportedLangCode)}
                className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 outline-none"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bilingual Dual Panes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Pane: Source Text */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col h-80 sm:h-96">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-2xs text-slate-400">
                <span className="font-semibold text-slate-700">Source Text</span>
                <div className="flex items-center gap-2">
                  <span>{sourceText.length} {t('translator.chars')}</span>
                  {sourceText && (
                    <button
                      type="button"
                      onClick={() => setSourceText('')}
                      className="text-slate-400 hover:text-rose-500 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder={t('translator.placeholder')}
                className="flex-1 w-full p-2 resize-none outline-none text-sm text-slate-800 placeholder:text-slate-300 font-sans"
              />

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleTranslateText}
                  disabled={isTranslatingText || !sourceText.trim()}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isTranslatingText ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Translating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      {t('action.translate')}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Pane: Translated Text */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col h-80 sm:h-96">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-2xs text-slate-400">
                <span className="font-semibold text-indigo-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Translated ({targetLang.toUpperCase()})
                </span>
                <div className="flex items-center gap-2">
                  <span>{translatedText.length} {t('translator.chars')}</span>
                </div>
              </div>

              <textarea
                readOnly
                value={translatedText}
                placeholder={t('translator.translatedPlaceholder')}
                dir={targetLang === 'ar' || targetLang === 'ur' ? 'rtl' : 'ltr'}
                className="flex-1 w-full p-2 resize-none outline-none text-sm text-slate-900 placeholder:text-slate-300 font-sans bg-slate-50/40 rounded"
              />

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-2xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                  {t('translator.accuracyBadge')}
                </span>

                <button
                  type="button"
                  onClick={handleCopyTranslated}
                  disabled={!translatedText}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer shadow-2xs"
                >
                  {hasCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      {t('action.copy')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT TRANSLATION VIEW */}
      {activeTab === 'document' && (
        <div className="space-y-5">
          {/* Document Upload Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                processUploadedDoc(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 cursor-pointer ${
              isDragOver
                ? 'border-indigo-500 bg-indigo-50/60 ring-4 ring-indigo-500/10'
                : 'border-slate-200/90 hover:border-slate-300 bg-white shadow-xs'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.xlsx,.xls,.csv,.txt"
              onChange={handleDocFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="p-4 rounded-full bg-indigo-50 text-indigo-600 shadow-2xs">
                <FileCheck className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {t('translator.uploadDocHint')}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports PDF, Microsoft Word (.docx), Excel (.xlsx), and Text files
                </p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer"
              >
                {t('action.upload')}
              </button>
            </div>
          </div>

          {/* Document Job Status Card */}
          {docJob && (
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 space-y-4 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block truncate max-w-sm">
                      {docJob.name}
                    </span>
                    <span className="text-2xs text-slate-400 font-mono">
                      {formatBytes(docJob.size)} • {docJob.type.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {docJob.status === 'completed' && (
                    <button
                      type="button"
                      onClick={handleDownloadDoc}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      {t('translator.downloadDoc')}
                    </button>
                  )}
                  {docJob.status !== 'completed' && docJob.status !== 'failed' && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{docJob.status === 'extracting' ? 'Extracting text...' : 'Translating...'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {docJob.status !== 'completed' && docJob.status !== 'failed' && (
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                    style={{ width: `${docJob.progressPercent}%` }}
                  />
                </div>
              )}

              {/* Side-by-Side Bilingual Comparison */}
              {docJob.translatedText && (
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <span className="text-xs font-bold text-slate-800 block">
                    {t('translator.bilingualCompare')}
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 max-h-64 overflow-y-auto font-mono text-2xs text-slate-700 whitespace-pre-wrap">
                      <span className="font-bold text-slate-400 block mb-1">ORIGINAL EXTRACT</span>
                      {docJob.extractedText}
                    </div>
                    <div
                      dir={docJob.targetLang === 'ar' || docJob.targetLang === 'ur' ? 'rtl' : 'ltr'}
                      className="p-3 bg-indigo-50/40 rounded-lg border border-indigo-100 max-h-64 overflow-y-auto text-slate-900 whitespace-pre-wrap"
                    >
                      <span className="font-bold text-indigo-400 block mb-1">TRANSLATION</span>
                      {docJob.translatedText}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
