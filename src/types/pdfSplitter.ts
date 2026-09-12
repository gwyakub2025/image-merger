export type SplitMode = 
  | 'extract-pages'        // Mode 1: 1,3,5,8
  | 'page-ranges'          // Mode 2: 1-5, 6-10
  | 'custom-range'         // Mode 3: 1-3,5,8-11,14
  | 'split-every-page'     // Mode 4: 50 pages -> 50 PDFs
  | 'split-every-x'        // Mode 5: Every 5 pages
  | 'equal-parts'          // Mode 6: 100 pages -> 4 PDFs of ~25 pages
  | 'delete-selected'      // Mode 7: Delete selected pages and export remaining PDF
  | 'extract-into-one'     // Mode 8: Extract selected pages into One PDF
  | 'extract-into-separate'; // Mode 9: Extract selected pages into Separate PDFs

export interface SplitFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount: number;
  status: 'ready' | 'loading' | 'processing' | 'completed' | 'failed';
  pages: PageThumbnailItem[];
  outputFiles: GeneratedSplitPdf[];
  errorMessage?: string;
}

export interface PageThumbnailItem {
  pageNumber: number; // 1-indexed
  thumbnailDataUrl?: string;
  selected: boolean;
  rotation: number; // 0, 90, 180, 270 degrees
  aspectRatio: number;
}

export interface GeneratedSplitPdf {
  id: string;
  name: string;
  pageRangeDesc: string;
  pageCount: number;
  sizeBytes: number;
  blob: Blob;
  downloadUrl: string;
}

export interface EstimatedSplitOutput {
  name: string;
  pageRangeDesc: string;
  pageIndices: number[]; // 0-indexed
}
