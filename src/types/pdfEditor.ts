export type PdfEditorTool =
  | 'select'
  | 'text'
  | 'link'
  | 'form'
  | 'image'
  | 'signature'
  | 'whiteout'
  | 'annotate'
  | 'shape'
  | 'draw'
  | 'organize';

export type ShapeType = 'rectangle' | 'ellipse' | 'line' | 'arrow' | 'highlight';

export type WhiteoutColor = '#ffffff' | '#000000' | '#e2e8f0';

export interface BaseAnnotation {
  id: string;
  pageIndex: number; // 0-based page index
  x: number; // in points (or relative % if preferred, pt is standard for PDF 72dpi)
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

export interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: 'Helvetica' | 'Times-Roman' | 'Courier';
  color: string;
  bold?: boolean;
  italic?: boolean;
  align: 'left' | 'center' | 'right';
  backgroundColor?: string;
}

export interface LinkAnnotation extends BaseAnnotation {
  type: 'link';
  url: string;
  pageTarget?: number;
}

export interface FormFieldAnnotation extends BaseAnnotation {
  type: 'form';
  fieldType: 'text' | 'checkbox' | 'radio';
  fieldName: string;
  value: string;
  checked?: boolean;
}

export interface ImageAnnotation extends BaseAnnotation {
  type: 'image';
  dataUrl: string;
  opacity: number;
  aspectRatio?: number;
}

export interface SignatureAnnotation extends BaseAnnotation {
  type: 'signature';
  dataUrl: string;
  signerName?: string;
  dateStr?: string;
  opacity?: number;
}

export interface WhiteoutAnnotation extends BaseAnnotation {
  type: 'whiteout';
  fillColor: string; // '#ffffff' for whiteout, '#000000' for black redaction
  strokeColor?: string;
  strokeWidth?: number;
}

export interface ShapeAnnotation extends BaseAnnotation {
  type: 'shape';
  shapeType: ShapeType;
  strokeColor: string;
  fillColor: string; // transparent or color
  strokeWidth: number;
  opacity: number;
}

export interface DrawAnnotation extends BaseAnnotation {
  type: 'draw';
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
  opacity: number;
}

export type AnyAnnotation =
  | TextAnnotation
  | LinkAnnotation
  | FormFieldAnnotation
  | ImageAnnotation
  | SignatureAnnotation
  | WhiteoutAnnotation
  | ShapeAnnotation
  | DrawAnnotation;

export interface PdfPageModel {
  id?: string;
  pageIndex: number; // unique index in editor
  originalPageIndex?: number; // index in the source PDF file (if not blank)
  displayNumber: number; // current sequential order
  rotation: 0 | 90 | 180 | 270;
  width: number; // in PDF points (e.g. 595.28 for A4)
  height: number; // in PDF points (e.g. 841.89 for A4)
  aspectRatio: number;
  thumbnailUrl?: string;
  isDeleted?: boolean;
  isBlankInserted?: boolean;
}

export interface PdfHeaderFooterConfig {
  enabled: boolean;
  headerLeft: string;
  headerCenter: string;
  headerRight: string;
  footerLeft: string;
  footerCenter: string; // e.g. "Page {page} of {total}"
  footerRight: string;
  fontSize: number;
  color: string;
  startPage: number;
}

export interface PdfWatermarkConfig {
  enabled: boolean;
  type: 'text' | 'image';
  text: string;
  imageUrl?: string;
  opacity: number; // 0.05 to 0.8
  rotationAngle: number; // e.g. -45
  fontSize: number;
  color: string;
  allPages: boolean;
}

export interface PdfMetadataConfig {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
}

export interface PdfEditorState {
  fileName: string;
  fileSize: number;
  originalBytes: Uint8Array | null;
  pages: PdfPageModel[];
  currentPageIndex: number;
  annotations: AnyAnnotation[];
  selectedAnnotationId: string | null;
  activeTool: PdfEditorTool;
  zoom: number; // 0.5 to 2.5
  history: AnyAnnotation[][];
  historyIndex: number;
  headerFooter: PdfHeaderFooterConfig;
  watermark: PdfWatermarkConfig;
  metadata: PdfMetadataConfig;
}
