export type ImageFitMode = 'contain' | 'cover';
export type PageOrientation = 'portrait' | 'landscape';
export type OutputFormat = 'jpg' | 'pdf' | 'both';
export type Layout3Style = 'featured-top' | 'equal-rows' | 'equal-cols';
export type ImageFilterType = 'none' | 'grayscale' | 'sepia' | 'contrast';

export type SheetTemplateId = 
  | 'single-hero'       // 1 per sheet
  | 'dual-stacked'      // 2 per sheet (stacked rows)
  | 'dual-split'        // 2 per sheet (side-by-side columns)
  | 'triple-featured'   // 3 per sheet (featured top + 2 bottom)
  | 'triple-rows'       // 3 per sheet (equal horizontal strips)
  | 'triple-cols'       // 3 per sheet (equal vertical strips)
  | 'quad-grid'         // 4 per sheet (2x2 equal quadrants)
  | 'contact-6'         // 6 per sheet (2x3 contact sheet)
  | 'catalog-8'         // 8 per sheet (2x4 compact catalog)
  | 'gallery-9'         // 9 per sheet (3x3 gallery grid)
  | 'dense-12'          // 12 per sheet (3x4 index)
  | 'target-sheets'     // dynamic based on user-described target number of sheets
  | 'custom-grid';      // custom rows & cols

export interface SheetTemplate {
  id: SheetTemplateId;
  name: string;
  shortLabel: string;
  imagesPerPage: number;
  description: string;
  iconType: string;
  recommendedOrientation?: PageOrientation;
  badge?: string;
}

export type ActiveTab = 
  | 'bulk-merger'
  | 'batcher' 
  | 'converter' 
  | 'resizer' 
  | 'pdf-editor' 
  | 'compressor' 
  | 'splitter' 
  | 'translator' 
  | 'wps' 
  | 'sheet-merger' 
  | 'admin';

export * from './types/admin';
export * from './types/pdfCompressor';
export * from './types/pdfSplitter';
export * from './types/translator';
export * from './types/bulkMerger';

export type WatermarkType = 'text' | 'image';
export type WatermarkPosition = 'center-diagonal' | 'center' | 'bottom-right' | 'top-right' | 'repeat-pattern';

export interface WatermarkConfig {
  enabled: boolean;
  type: WatermarkType;
  text: string;
  fontSize?: number; // e.g. 36-72
  opacity: number; // 0.05 to 0.6
  color: string; // e.g. '#334155'
  position: WatermarkPosition;
  rotationAngle?: number; // in degrees, e.g. -30
  imageUrl?: string; // base64 or object URL for custom watermark image
  imageScale?: number; // 0.15 to 0.7 relative to sheet width
}

export interface UploadedImage {
  id: string;
  name: string;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  compressedBlob: Blob;
  compressedDataUrl: string;
  compressedSize: number;
  compressedWidth: number;
  compressedHeight: number;
  aspectRatio: number;
  filter?: ImageFilterType;
}

export interface BatchConfig {
  imagesPerPage: number; // 1 to 16
  orientation: PageOrientation;
  fitMode: ImageFitMode;
  layout3Style: Layout3Style;
  templateId?: SheetTemplateId;
  targetSheetCount?: number; // target total sheets
  gridRows?: number;
  gridCols?: number;
  quality: number; // 0.5 to 0.95
  maxDimension: number; // e.g. 1920
  showCaptions: boolean;
  showPageNumbers: boolean;
  pageHeaderTitle: string;
  outputFormat: OutputFormat;
  backgroundColor: string;
  marginMm: number; // margin in mm (standard e.g. 10mm)
  spacingMm: number; // spacing between images in mm
  watermark?: WatermarkConfig;
}

export interface BatchSet {
  id: string;
  batchIndex: number;
  images: UploadedImage[];
  renderedJpgUrl?: string;
  renderedBlob?: Blob;
}

export interface ProcessingProgress {
  total: number;
  current: number;
  statusText: string;
  isProcessing: boolean;
}

// Image Sizer / Resizer Types
export type SizerResizeMode = 'by-size' | 'percentage' | 'social-media';
export type SizerUnit = 'px' | '%' | 'in' | 'cm' | 'mm';
export type SizerExportFormat = 'original' | 'jpg' | 'png' | 'webp' | 'pdf';

export interface SizerImageItem {
  id: string;
  file?: File;
  name: string;
  originalUrl: string;
  originalWidth: number;
  originalHeight: number;
  originalSize: number; // in bytes
  originalType: string;
  rotation: number; // 0, 90, 180, 270
  flipH: boolean;
  flipV: boolean;
  selected: boolean;
  targetWidth?: number;
  targetHeight?: number;
  previewUrl?: string;
  previewSize?: number;
  isProcessing?: boolean;
}

export interface SizerPreset {
  id: string;
  category: 'social' | 'document' | 'web';
  name: string;
  width: number;
  height: number;
  description: string;
  aspectRatio: string;
}
