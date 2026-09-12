export type SupportedLangCode = 
  | 'en' // English
  | 'ar' // Arabic
  | 'fr' // French
  | 'ur' // Urdu
  | 'hi' // Hindi
  | 'es' // Spanish
  | 'de' // German
  | 'zh'; // Chinese

export interface SupportedLanguage {
  code: SupportedLangCode;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  flag: string;
}

export type TranslationDomain = 'general' | 'legal' | 'hr' | 'technical';

export interface TranslationHistoryItem {
  id: string;
  sourceLang: SupportedLangCode;
  targetLang: SupportedLangCode;
  sourceText: string;
  translatedText: string;
  domain: TranslationDomain;
  timestamp: number;
}

export interface DocumentTranslationJob {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string; // 'pdf' | 'docx' | 'xlsx' | 'txt'
  status: 'waiting' | 'extracting' | 'translating' | 'completed' | 'failed';
  sourceLang: SupportedLangCode;
  targetLang: SupportedLangCode;
  domain: TranslationDomain;
  extractedText?: string;
  translatedText?: string;
  translatedBlob?: Blob;
  downloadUrl?: string;
  downloadFileName?: string;
  progressPercent: number;
  errorMessage?: string;
}
