export type ImageFitMode = 'contain' | 'cover';
export type PageOrientation = 'portrait' | 'landscape';
export type OutputFormat = 'jpg' | 'pdf' | 'both';
export type Layout3Style = 'featured-top' | 'equal-rows' | 'equal-cols';
export type ImageFilterType = 'none' | 'grayscale' | 'sepia' | 'contrast';

export type ActiveTab = 
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
  imagesPerPage: 2 | 3;
  orientation: PageOrientation;
  fitMode: ImageFitMode;
  layout3Style: Layout3Style;
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
