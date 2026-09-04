export type ImageFitMode = 'contain' | 'cover';
export type PageOrientation = 'portrait' | 'landscape';
export type OutputFormat = 'jpg' | 'pdf' | 'both';
export type Layout3Style = 'featured-top' | 'equal-rows' | 'equal-cols';
export type ImageFilterType = 'none' | 'grayscale' | 'sepia' | 'contrast';

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
