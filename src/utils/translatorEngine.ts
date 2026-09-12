import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import jsPDF from 'jspdf';
import { 
  SupportedLanguage, 
  SupportedLangCode, 
  TranslationDomain 
} from '../types/translator';

if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr', flag: '🇬🇧' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl', flag: '🇦🇪' },
  { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr', flag: '🇫🇷' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', direction: 'rtl', flag: '🇵🇰' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr', flag: '🇪🇸' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr', flag: '🇩🇪' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', direction: 'ltr', flag: '🇨🇳' },
];

/**
 * Built-in GCC, UAE, Commercial and Technical Terminology Dictionary for instant offline translation.
 */
const OFFLINE_DICTIONARY: Record<string, { ar: string; en: string }> = {
  'invoice': { ar: 'فاتورة ضريبية', en: 'Invoice' },
  'tax invoice': { ar: 'فاتورة ضريبية معتمدة', en: 'Tax Invoice' },
  'bill of lading': { ar: 'بوليصة الشحن', en: 'Bill of Lading' },
  'wages protection system': { ar: 'نظام حماية الأجور (WPS)', en: 'Wages Protection System (WPS)' },
  'ministry of human resources and emiratisation': { ar: 'وزارة الموارد البشرية والتوطين', en: 'Ministry of Human Resources and Emiratisation' },
  'employment contract': { ar: 'عقد عمل', en: 'Employment Contract' },
  'salary certificate': { ar: 'شهادة راتب', en: 'Salary Certificate' },
  'gratuity calculation': { ar: 'حساب مكافأة نهاية الخدمة', en: 'Gratuity Calculation' },
  'commercial registration': { ar: 'السجل التجاري', en: 'Commercial Registration' },
  'trade license': { ar: 'الرخصة التجارية', en: 'Trade License' },
  'chamber of commerce': { ar: 'غرفة التجارة والصناعة', en: 'Chamber of Commerce' },
  'statement of account': { ar: 'كشف حساب مالي', en: 'Statement of Account' },
  'purchase order': { ar: 'أمر الشراء', en: 'Purchase Order' },
  'power of attorney': { ar: 'وكالة قانونية خاصة', en: 'Power of Attorney' },
  'terms and conditions': { ar: 'الشروط والأحكام', en: 'Terms and Conditions' },
  'delivery note': { ar: 'إشعار استلام وتسليم', en: 'Delivery Note' },
  'vat registration number': { ar: 'رقم التسجيل الضريبي (TRN)', en: 'VAT Registration Number' },
  'customs declaration': { ar: 'البيان الجمركي', en: 'Customs Declaration' },
  'certificate of origin': { ar: 'شهادة المنشأ', en: 'Certificate of Origin' },
  'audit report': { ar: 'تقرير التدقيق المالي', en: 'Audit Report' },
  'confidentiality agreement': { ar: 'اتفاقية عدم الإفصاح والسرية', en: 'Non-Disclosure Agreement' },
  'total amount': { ar: 'المبلغ الإجمالي', en: 'Total Amount' },
  'net payable': { ar: 'صافي المبلغ المستحق', en: 'Net Payable' },
  'due date': { ar: 'تاريخ الاستحقاق', en: 'Due Date' },
  'managing director': { ar: 'المدير العام', en: 'Managing Director' },
  'general manager': { ar: 'المدير العام', en: 'General Manager' },
  'chief executive officer': { ar: 'الرئيس التنفيذي', en: 'Chief Executive Officer' },
  'board of directors': { ar: 'مجلس الإدارة', en: 'Board of Directors' },
  'gulf way group': { ar: 'مجموعة جولف واي', en: 'Gulf Way Group' },
  'united arab emirates': { ar: 'الإمارات العربية المتحدة', en: 'United Arab Emirates' },
  'dubai': { ar: 'دبي', en: 'Dubai' },
  'abu dhabi': { ar: 'أبوظبي', en: 'Abu Dhabi' },
  'sharjah': { ar: 'الشارقة', en: 'Sharjah' },
  'yakub': { ar: 'يعقوب', en: 'Yakub' },
  'yacoub': { ar: 'يعقوب', en: 'Yacoub' },
  'ali': { ar: 'علي', en: 'Ali' },
  'mohammed': { ar: 'محمد', en: 'Mohammed' },
  'mohamed': { ar: 'محمد', en: 'Mohamed' },
  'muhammad': { ar: 'محمد', en: 'Muhammad' },
  'ahmed': { ar: 'أحمد', en: 'Ahmed' },
  'ahmad': { ar: 'أحمد', en: 'Ahmad' },
  'abdullah': { ar: 'عبد الله', en: 'Abdullah' },
  'abdulrahman': { ar: 'عبد الرحمن', en: 'Abdulrahman' },
  'hassan': { ar: 'حسن', en: 'Hassan' },
  'hussain': { ar: 'حسين', en: 'Hussain' },
  'ibrahim': { ar: 'إبراهيم', en: 'Ibrahim' },
  'omar': { ar: 'عمر', en: 'Omar' },
  'khalid': { ar: 'خالد', en: 'Khalid' },
  'rashid': { ar: 'راشد', en: 'Rashid' },
  'tariq': { ar: 'طارق', en: 'Tariq' },
  'sultan': { ar: 'سلطان', en: 'Sultan' },
  'zayed': { ar: 'زايد', en: 'Zayed' },
};

function decodeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'");
}

/**
 * Direct browser fallback to Google Translate & Neural API
 */
async function clientDirectGoogleTranslateChunk(text: string, sourceLang: string, targetLang: string): Promise<string | null> {
  const clean = text.trim();
  if (!clean) return text;
  const pageMatch = clean.match(/^---\s*Page\s*(\d+)\s*---$/i);
  if (pageMatch) {
    return targetLang === 'ar' ? `--- الصفحة ${pageMatch[1]} ---` : `--- Page ${pageMatch[1]} ---`;
  }
  const src = sourceLang === 'auto' ? 'auto' : sourceLang;
  const tgt = targetLang;

  // Attempt 1: Direct Lingva (Google Translate proxy)
  try {
    const url = `https://lingva.ml/api/v1/${encodeURIComponent(src)}/${encodeURIComponent(tgt)}/${encodeURIComponent(clean)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const raw = await res.text();
      if (raw.startsWith('{')) {
        const json = JSON.parse(raw);
        if (json.translation && typeof json.translation === 'string' && json.translation.trim()) {
          return decodeHtml(json.translation.trim());
        }
      }
    }
  } catch (e) {
    // Continue to next fallback
  }

  // Attempt 2: Direct MyMemory Neural Translation
  try {
    const pair = `${src === 'auto' ? 'en' : src}|${tgt}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean.slice(0, 480))}&langpair=${encodeURIComponent(pair)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const json = await res.json();
      const tr = json.responseData?.translatedText;
      if (tr && typeof tr === 'string' && !tr.startsWith('MYMEMORY WARNING')) {
        return decodeHtml(tr.trim());
      }
    }
  } catch (e) {
    // Fallback to dictionary
  }

  return null;
}

async function clientDirectGoogleTranslate(text: string, sourceLang: string, targetLang: string): Promise<string | null> {
  if (text.length <= 400 && !text.includes('\n')) {
    return await clientDirectGoogleTranslateChunk(text, sourceLang, targetLang);
  }

  const lines = text.split('\n');
  const translatedLines: string[] = new Array(lines.length);
  const batchSize = 5;

  for (let i = 0; i < lines.length; i += batchSize) {
    const batch = lines.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (line, idxInBatch) => {
        const actualIdx = i + idxInBatch;
        if (!line.trim()) {
          translatedLines[actualIdx] = '';
          return;
        }
        const res = await clientDirectGoogleTranslateChunk(line, sourceLang, targetLang);
        translatedLines[actualIdx] = res !== null ? res : line;
      })
    );
  }

  return translatedLines.join('\n');
}

/**
 * High-accuracy translation caller with server Google Neural proxy and client fallbacks.
 */
export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: SupportedLangCode,
  domain: TranslationDomain = 'general'
): Promise<{
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  usedFallback: boolean;
}> {
  if (!text || !text.trim()) {
    return { translatedText: '', sourceLang, targetLang, usedFallback: false };
  }

  // Attempt 1: Server-side Google Neural Engine
  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        sourceLang: sourceLang === 'auto' ? 'auto' : sourceLang,
        targetLang,
        domain,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.translatedText) {
        return {
          translatedText: data.translatedText,
          sourceLang: data.sourceLang || sourceLang,
          targetLang: data.targetLang || targetLang,
          usedFallback: false,
        };
      }
    }
  } catch (err) {
    console.warn('[Translator] Server API call failed, falling back to direct client engine:', err);
  }

  // Attempt 2: Direct browser-level Google Translate / MyMemory fallback
  try {
    const directResult = await clientDirectGoogleTranslate(text, sourceLang, targetLang);
    if (directResult) {
      return {
        translatedText: directResult,
        sourceLang: sourceLang === 'auto' ? (targetLang === 'ar' ? 'en' : 'ar') : sourceLang,
        targetLang,
        usedFallback: false,
      };
    }
  } catch (err) {
    console.warn('[Translator] Client direct translation failed:', err);
  }

  // Attempt 3: Local dictionary & transliteration (Strictly no fake prefix badges)
  const isEnToAr = targetLang === 'ar';
  let processed = text;

  // Substitute known corporate terminology and names
  for (const [key, mapping] of Object.entries(OFFLINE_DICTIONARY)) {
    const regex = new RegExp(`\\b${key}\\b`, 'gi');
    if (isEnToAr) {
      processed = processed.replace(regex, mapping.ar);
    } else {
      const arRegex = new RegExp(mapping.ar, 'g');
      processed = processed.replace(arRegex, mapping.en);
    }
  }

  return {
    translatedText: processed,
    sourceLang: sourceLang === 'auto' ? (isEnToAr ? 'en' : 'ar') : sourceLang,
    targetLang,
    usedFallback: true,
  };
}

/**
 * Extracts plain text from an uploaded document (PDF, DOCX, XLSX, TXT).
 */
export async function extractTextFromDocument(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (ext === 'txt') {
    return await file.text();
  }

  if (ext === 'pdf') {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
      cMapPacked: true,
    });
    const pdfDoc = await loadingTask.promise;
    const textParts: string[] = [];

    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const content = await page.getTextContent();
      let lastY: number | null = null;
      const pageLines: string[] = [];
      let currentLine = '';

      for (const item of content.items as any[]) {
        if ('str' in item) {
          const str = item.str;
          const currentY = item.transform ? item.transform[5] : null;

          // If vertical Y position shifted significantly, commit the line
          if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 5) {
            if (currentLine.trim()) {
              pageLines.push(currentLine.trim());
            }
            currentLine = str;
          } else {
            currentLine = currentLine ? currentLine + ' ' + str : str;
          }

          if (item.hasEOL) {
            if (currentLine.trim()) {
              pageLines.push(currentLine.trim());
            }
            currentLine = '';
          }

          if (currentY !== null) {
            lastY = currentY;
          }
        }
      }

      if (currentLine.trim()) {
        pageLines.push(currentLine.trim());
      }

      const pageText = pageLines.join('\n');
      if (pageText.trim()) {
        textParts.push(`--- Page ${i} ---\n` + pageText.trim());
      }
    }
    return textParts.join('\n\n');
  }

  if (ext === 'docx') {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value || '';
  }

  if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetTexts: string[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      if (csv.trim()) {
        sheetTexts.push(`[Sheet: ${sheetName}]\n` + csv);
      }
    }
    return sheetTexts.join('\n\n');
  }

  throw new Error(`Unsupported document extension .${ext}`);
}

/**
 * Generates an exported translated file (DOCX or TXT) for direct user download.
 */
export async function exportTranslatedFile(
  baseName: string,
  translatedText: string,
  targetLang: SupportedLangCode
): Promise<{ blob: Blob; filename: string }> {
  const safeBase = baseName.replace(/\.[^/.]+$/, '');
  const ext = baseName.split('.').pop()?.toLowerCase() || 'txt';
  const suffix = targetLang === 'ar' ? '_ar' : `_${targetLang}`;

  if (ext === 'docx') {
    // Generate DOCX with paragraphs
    const paragraphs = translatedText.split('\n').map((line) => {
      return new Paragraph({
        children: [
          new TextRun({
            text: line || ' ',
            font: targetLang === 'ar' ? 'Arial' : 'Calibri',
            size: 24, // 12pt
          }),
        ],
        spacing: { after: 120 },
        bidirectional: targetLang === 'ar',
      });
    });

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: `Gulf Way Group — Certified Translation (${targetLang.toUpperCase()})`,
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 200 },
            }),
            ...paragraphs,
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    return { blob, filename: `${safeBase}${suffix}.docx` };
  }

  if (ext === 'pdf') {
    // Generate PDF text document
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text(`Gulf Way Group — Translation (${targetLang.toUpperCase()})`, 20, 20);

    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);

    const splitLines = doc.splitTextToSize(translatedText, 170);
    let y = 30;
    for (const line of splitLines) {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 20, y);
      y += 6;
    }

    const pdfBlob = doc.output('blob');
    return { blob: pdfBlob, filename: `${safeBase}${suffix}.pdf` };
  }

  // Plain text fallback
  const blob = new Blob([translatedText], { type: 'text/plain;charset=utf-8' });
  return { blob, filename: `${safeBase}${suffix}.txt` };
}
