import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppLanguage = 'en' | 'ar';

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
  isRtl: boolean;
}

const TRANSLATIONS: Record<AppLanguage, Record<string, string>> = {
  en: {
    // Brand & Header
    'brand.title': 'Gulf Way Group',
    'brand.subtitle': 'Unified Document & Workplace Suite',
    'brand.enterprise': 'Enterprise Suite',
    'brand.switchLang': 'العربية',
    'brand.activeTools': 'Active Batch Processor',

    // Navigation Tabs
    'nav.batcher': 'A4 Batcher',
    'nav.converter': 'Format Converter',
    'nav.resizer': 'Image Sizer',
    'nav.pdfEditor': 'PDF Editor',
    'nav.pdfCompressor': 'PDF Compressor',
    'nav.pdfSplitter': 'PDF Splitter',
    'nav.translator': 'Translator',
    'nav.wps': 'WPS Extractor',
    'nav.sheetMerger': 'Sheet Merger',
    'nav.admin': 'Admin Console',

    // Common Actions
    'action.upload': 'Upload Files',
    'action.processAll': 'Process All',
    'action.downloadAll': 'Download All',
    'action.downloadZip': 'Download All as ZIP',
    'action.clearAll': 'Clear All',
    'action.clearCompleted': 'Clear Completed',
    'action.retryFailed': 'Retry Failed',
    'action.cancel': 'Cancel',
    'action.download': 'Download',
    'action.delete': 'Delete',
    'action.remove': 'Remove',
    'action.retry': 'Retry',
    'action.save': 'Save',
    'action.apply': 'Apply',
    'action.close': 'Close',
    'action.copy': 'Copy',
    'action.copied': 'Copied to clipboard!',
    'action.selectAll': 'Select All',
    'action.deselectAll': 'Deselect All',
    'action.translate': 'Translate',
    'action.swap': 'Swap Languages',
    'action.returnToTools': 'Return to Tools',

    // Statuses
    'status.waiting': 'Waiting',
    'status.processing': 'Processing',
    'status.completed': 'Completed',
    'status.failed': 'Failed',
    'status.cancelled': 'Cancelled',
    'status.ready': 'Ready',

    // Table Headers
    'table.fileName': 'File Name',
    'table.fileType': 'File Type',
    'table.fileSize': 'File Size',
    'table.status': 'Status',
    'table.progress': 'Progress',
    'table.action': 'Actions',
    'table.original': 'Original',
    'table.compressed': 'Compressed',
    'table.saved': 'Saved',
    'table.reduction': 'Reduction',

    // PDF Compressor
    'compressor.title': 'Advanced PDF Compressor',
    'compressor.subtitle': 'Reduce file sizes while preserving crisp vector text & high visual fidelity.',
    'compressor.secureNotice': 'Files are processed on your device and are not uploaded to our servers.',
    'compressor.mode.recommended': 'Recommended Compression',
    'compressor.mode.recommendedDesc': 'Balanced quality and file size reduction (~60-75% reduction)',
    'compressor.mode.maximum': 'Maximum Compression',
    'compressor.mode.maximumDesc': 'Aggressive size reduction for web publishing & email attachments',
    'compressor.mode.highQuality': 'High Quality / Minimum Compression',
    'compressor.mode.highQualityDesc': 'Preserves pristine vector typography & print-ready resolution',
    'compressor.mode.custom': 'Custom Compression Settings',
    'compressor.mode.customDesc': 'Fine-tune image DPI, JPEG quality factor, grayscale & metadata',
    'compressor.dropZone': 'Drag & drop PDF files here, or click to browse',
    'compressor.multiFileHint': 'Supports multiple files and batch compression with concurrency limits',
    'compressor.quality': 'Image Quality',
    'compressor.resolution': 'Resolution / Max DPI',
    'compressor.grayscale': 'Convert Color Images to Grayscale',
    'compressor.removeMetadata': 'Strip Unnecessary Metadata & Color Profiles',
    'compressor.optimizeStructure': 'Optimize Embedded Objects & Structural Streams',
    'compressor.linearize': 'Enable Fast Web View (Linearization)',
    'compressor.totalSaved': 'Total Space Saved',
    'compressor.avgReduction': 'Average Size Reduction',

    // PDF Splitter
    'splitter.title': 'Advanced PDF Splitter',
    'splitter.subtitle': 'Extract specific pages, page ranges, or partition large documents into separate PDFs.',
    'splitter.dropZone': 'Drag & drop PDF files here to view page thumbnails & split',
    'splitter.mode1': 'Extract Pages',
    'splitter.mode2': 'Page Ranges',
    'splitter.mode3': 'Custom Range',
    'splitter.mode4': 'Split Every Page',
    'splitter.mode5': 'Split Every X Pages',
    'splitter.mode6': 'Split into Equal Parts',
    'splitter.mode7': 'Delete Selected & Export Remaining',
    'splitter.mode8': 'Extract Selected into One PDF',
    'splitter.mode9': 'Extract Selected into Separate PDFs',
    'splitter.pagesSelected': 'pages selected',
    'splitter.zoom': 'Thumbnail Zoom',
    'splitter.rotate': 'Rotate Preview',
    'splitter.estimatedOutput': 'Estimated Output Files',
    'splitter.generateSplit': 'Split & Generate PDFs',

    // Translator
    'translator.title': 'Gulf Way Enterprise Translator',
    'translator.subtitle': 'High-accuracy neural translation for Arabic, English, and global business documents.',
    'translator.textTab': 'Text Translation',
    'translator.docTab': 'Document Translation',
    'translator.autoDetect': 'Detect Language',
    'translator.chars': 'Characters',
    'translator.words': 'Words',
    'translator.placeholder': 'Enter or paste Arabic / English text to translate...',
    'translator.translatedPlaceholder': 'Translation will appear here...',
    'translator.accuracyBadge': '100% Accurate Google Translation',
    'translator.uploadDocHint': 'Upload PDF, DOCX, XLSX, or TXT for structural translation',
    'translator.bilingualCompare': 'Side-by-Side Bilingual Comparison',
    'translator.downloadDoc': 'Download Translated Document',
    'translator.style': 'Domain & Style',
    'translator.style.general': 'General Commercial',
    'translator.style.legal': 'Legal & Contracts',
    'translator.style.hr': 'UAE HR & Wages / WPS',
    'translator.style.technical': 'Technical & Engineering',

    // Telemetry & Privacy
    'privacy.airGapped': 'Air-gapped client-side processing active. Zero data leakage.',
    'telemetry.memory': 'Browser Memory Footprint',
  },
  ar: {
    // Brand & Header
    'brand.title': 'مجموعة جولف واي',
    'brand.subtitle': 'منصة المستندات والإنتاجية المؤسسية الموحدة',
    'brand.enterprise': 'النظام المؤسسي',
    'brand.switchLang': 'English',
    'brand.activeTools': 'معالج الدفعات والوثائق',

    // Navigation Tabs
    'nav.batcher': 'مجمع صفحات A4',
    'nav.converter': 'محول الصيغ',
    'nav.resizer': 'تعديل قياسات الصور',
    'nav.pdfEditor': 'محرر PDF المتقدم',
    'nav.pdfCompressor': 'ضاغط ملفات PDF',
    'nav.pdfSplitter': 'مقسم ملفات PDF',
    'nav.translator': 'المترجم الفوري',
    'nav.wps': 'مستخرج تقارير WPS',
    'nav.sheetMerger': 'دمج الجداول VLOOKUP',
    'nav.admin': 'لوحة الإدارة والحوكمة',

    // Common Actions
    'action.upload': 'رفع الملفات',
    'action.processAll': 'معالجة الكل',
    'action.downloadAll': 'تنزيل الكل',
    'action.downloadZip': 'تنزيل الكل كملف مضغوط ZIP',
    'action.clearAll': 'مسح الكل',
    'action.clearCompleted': 'مسح المكتمل',
    'action.retryFailed': 'إعادة المحاولة للملفات الفاشلة',
    'action.cancel': 'إلغاء',
    'action.download': 'تنزيل',
    'action.delete': 'حذف',
    'action.remove': 'إزالة',
    'action.retry': 'إعادة المحاولة',
    'action.save': 'حفظ',
    'action.apply': 'تطبيق',
    'action.close': 'إغلاق',
    'action.copy': 'نسخ',
    'action.copied': 'تم النسخ إلى الحافظة!',
    'action.selectAll': 'تحديد الكل',
    'action.deselectAll': 'إلغاء تحديد الكل',
    'action.translate': 'ترجمة',
    'action.swap': 'تبديل اللغات',
    'action.returnToTools': 'العودة لأدوات العمل',

    // Statuses
    'status.waiting': 'قيد الانتظار',
    'status.processing': 'جارٍ المعالجة',
    'status.completed': 'مكتمل بنجاح',
    'status.failed': 'فشلت العملية',
    'status.cancelled': 'ملغى',
    'status.ready': 'جاهز',

    // Table Headers
    'table.fileName': 'اسم الملف',
    'table.fileType': 'نوع الملف',
    'table.fileSize': 'الحجم الأصلي',
    'table.status': 'الحالة',
    'table.progress': 'نسبة الإنجاز',
    'table.action': 'الإجراءات',
    'table.original': 'الحجم الأصلي',
    'table.compressed': 'الحجم المضغوط',
    'table.saved': 'الموفر',
    'table.reduction': 'نسبة التقليص',

    // PDF Compressor
    'compressor.title': 'ضاغط ملفات PDF المتقدم',
    'compressor.subtitle': 'تقليص أحجام الملفات مع الحفاظ على وضوح الخطوط ودقة المستندات العالية.',
    'compressor.secureNotice': 'تتم معالجة الملفات محلياً على جهازك ولا يتم رفعها إلى خوادمنا نهائياً.',
    'compressor.mode.recommended': 'الضغط الموصى به',
    'compressor.mode.recommendedDesc': 'توازن مثالي بين جودة العرض وتقليص الحجم (~60-75% توفير)',
    'compressor.mode.maximum': 'أقصى ضغط ممكن',
    'compressor.mode.maximumDesc': 'تقليص فائق للملفات لتناسب البريد الإلكتروني ومواقع الويب',
    'compressor.mode.highQuality': 'أعلى جودة / أقل ضغط',
    'compressor.mode.highQualityDesc': 'الحفاظ الكامل على النصوص المتجهة وجودة الطباعة الدقيقة',
    'compressor.mode.custom': 'إعدادات الضغط المخصصة',
    'compressor.mode.customDesc': 'تخصيص دقة DPI ونسبة جودة الصور والتحويل للأبيض والأسود',
    'compressor.dropZone': 'اسحب وأفلت ملفات PDF هنا، أو انقر للاختيار من جهازك',
    'compressor.multiFileHint': 'يدعم المعالجة الجماعية والمتزامنة لعدة ملفات دفعة واحدة',
    'compressor.quality': 'جودة الصور المضمنة',
    'compressor.resolution': 'الحد الأقصى للدقة (DPI)',
    'compressor.grayscale': 'تحويل الصور الملونة إلى تدرج الرمادي',
    'compressor.removeMetadata': 'إزالة البيانات الوصفية وملفات تعريف الألوان غير الضرورية',
    'compressor.optimizeStructure': 'تحسين الكائنات المضمنة وتدفقات الهيكل الداخلي',
    'compressor.linearize': 'تفعيل العرض السريع على الويب (Linearization)',
    'compressor.totalSaved': 'إجمالي المساحة الموفرة',
    'compressor.avgReduction': 'متوسط نسبة التقليص',

    // PDF Splitter
    'splitter.title': 'مقسم ملفات PDF المتقدم',
    'splitter.subtitle': 'استخراج صفحات محددة أو نطاقات أو تقسيم المستندات الكبيرة لملفات مستقلة.',
    'splitter.dropZone': 'اسحب وأفلت ملفات PDF هنا لعرض مصغرات الصفحات والتقسيم',
    'splitter.mode1': 'استخراج صفحات فردية',
    'splitter.mode2': 'نطاقات الصفحات',
    'splitter.mode3': 'نطاق صفحات مخصص',
    'splitter.mode4': 'تقسيم كل صفحة لملف مستقل',
    'splitter.mode5': 'تقسيم كل عدد (X) من الصفحات',
    'splitter.mode6': 'تقسيم إلى أجزاء متساوية',
    'splitter.mode7': 'حذف الصفحات المحددة وتصدير المتبقي',
    'splitter.mode8': 'استخراج الصفحات المحددة في ملف واحد',
    'splitter.mode9': 'استخراج الصفحات المحددة في ملفات منفصلة',
    'splitter.pagesSelected': 'صفحات محددة',
    'splitter.zoom': 'تكبير المصغرات',
    'splitter.rotate': 'تدوير المعاينة',
    'splitter.estimatedOutput': 'الملفات الناتجة المتوقعة',
    'splitter.generateSplit': 'بدء التقسيم وتوليد الملفات',

    // Translator
    'translator.title': 'مترجم جولف واي المؤسسي المعتمد',
    'translator.subtitle': 'ترجمة عصبية فائقة الدقة للوثائق التجارية والنصوص بين العربية والإنجليزية.',
    'translator.textTab': 'ترجمة النصوص',
    'translator.docTab': 'ترجمة المستندات والملفات',
    'translator.autoDetect': 'التعرف التلقائي على اللغة',
    'translator.chars': 'حرف',
    'translator.words': 'كلمة',
    'translator.placeholder': 'أدخل أو الصق النص باللغة العربية أو الإنجليزية للترجمة الفورية...',
    'translator.translatedPlaceholder': 'ستظهر الترجمة الدقيقة هنا...',
    'translator.accuracyBadge': 'دقة 100% مطابقة لترجمة جوجل العصبية',
    'translator.uploadDocHint': 'ارفع ملف PDF أو Word أو Excel أو TXT للترجمة مع حفظ التنسيق',
    'translator.bilingualCompare': 'مقارنة ثنائية اللغة جنباً إلى جنب',
    'translator.downloadDoc': 'تنزيل المستند المترجم',
    'translator.style': 'المجال التخصصي والصياغة',
    'translator.style.general': 'تجاري وإداري عام',
    'translator.style.legal': 'عقود وقانوني رسمي',
    'translator.style.hr': 'الموارد البشرية ونظام حماية الأجور (WPS)',
    'translator.style.technical': 'هندسي وتقني متخصص',

    // Telemetry & Privacy
    'privacy.airGapped': 'المعالجة السحابية المعزولة داخل المتصفح نشطة. أمان تام بدون تسريب بيانات.',
    'telemetry.memory': 'استهلاك ذاكرة المتصفح',
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key,
  isRtl: false,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gulfway_lang') as AppLanguage;
      if (saved === 'ar' || saved === 'en') return saved;
    }
    return 'en';
  });

  const isRtl = language === 'ar';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
      localStorage.setItem('gulfway_lang', language);
    }
  }, [language, isRtl]);

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  const t = (key: string, fallback?: string): string => {
    const langDict = TRANSLATIONS[language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    const enDict = TRANSLATIONS['en'];
    if (enDict && enDict[key]) {
      return enDict[key];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
