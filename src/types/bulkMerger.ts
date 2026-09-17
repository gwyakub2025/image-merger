export type MergeFileType = 'pdf' | 'image' | 'docx' | 'excel' | 'text' | 'unknown';

export type MergeOutputFormat = 'pdf' | 'docx' | 'zip';

export type PageSizePreset = 'auto' | 'a4-portrait' | 'a4-landscape' | 'letter';

export type PageNumberStyle = 'none' | 'page-x-of-y' | 'x-of-y' | 'page-x' | 'numbers-only';

export type PageNumberPosition = 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-right';

export interface WatermarkSettings {
  enabled: boolean;
  text: string;
  opacity: number; // 0.05 to 0.5
  color: string;
  fontSize: number;
  rotation: number; // in degrees, e.g. -45
  allPages: boolean;
}

export interface HeaderFooterSettings {
  enabled: boolean;
  headerLeft: string;
  headerRight: string;
  showPageNumbers: boolean;
  pageNumberStyle: PageNumberStyle;
  pageNumberPosition: PageNumberPosition;
  skipFirstPage: boolean;
  fontSize: number;
  color: string;
}

export interface TableOfContentsSettings {
  enabled: boolean;
  title: string;
  subtitle: string;
  includePageNumbers: boolean;
  includeFileSizes: boolean;
}

export interface MergeConfig {
  outputFormat: MergeOutputFormat;
  pageSize: PageSizePreset;
  marginsMm: number; // 0, 10, 15, 20
  compressionQuality: 'lossless' | 'balanced' | 'compact';
  tableOfContents: TableOfContentsSettings;
  headerFooter: HeaderFooterSettings;
  watermark: WatermarkSettings;
  customOutputName: string;
}

export interface MergeQueueItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: MergeFileType;
  extension: string;
  thumbnailUrl: string;
  pageCount: number;
  rotation: number; // 0, 90, 180, 270
  selected: boolean;
  pageRange: string; // "all", "1-3", "2,4,6", etc.
  validPageRange: boolean;
  previewText?: string;
  dimensions?: { width: number; height: number };
  tableData?: any[][];
  sheetNames?: string[];
  status: 'idle' | 'processing' | 'ready' | 'error';
  errorMessage?: string;
}

export interface MergeProgress {
  isProcessing: boolean;
  totalSteps: number;
  currentStep: number;
  percent: number;
  currentFileName: string;
  statusMessage: string;
}

export interface MergeResult {
  blob: Blob;
  downloadUrl: string;
  filename: string;
  fileSize: number;
  format: MergeOutputFormat;
  totalPages: number;
  totalSourceFiles: number;
  durationMs: number;
}
