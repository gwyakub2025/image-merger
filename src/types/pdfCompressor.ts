export type CompressionPreset = 'recommended' | 'maximum' | 'high-quality' | 'custom';

export type CompressionItemStatus = 'waiting' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface CustomCompressionOptions {
  imageQuality: number; // 0.1 to 0.95 (e.g., 0.65)
  maxDpi: number; // e.g. 72, 100, 150, 200, 300
  grayscale: boolean;
  removeMetadata: boolean;
  optimizeStructure: boolean;
  optimizeFonts: boolean;
  removeDuplicateObjects: boolean;
  linearizeFastWeb: boolean;
}

export interface CompressedFileItem {
  id: string;
  file: File;
  name: string;
  originalSize: number;
  compressedSize: number;
  pageCount: number;
  status: CompressionItemStatus;
  progressPercent: number; // 0 to 100
  statusText?: string;
  compressedBlob?: Blob;
  downloadUrl?: string;
  errorMessage?: string;
  startTime?: number;
  completedTime?: number;
}

export interface CompressionBatchSummary {
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  totalOriginalBytes: number;
  totalCompressedBytes: number;
  totalSavedBytes: number;
  averageReductionPercent: number;
}
