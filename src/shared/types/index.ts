// ─── Core Types ───

export interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export type InpaintMode = 'laplace' | 'lama';

export type ActiveTool = 'select' | 'erase' | 'region';

// ─── Document ───

export interface FileMetadata {
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface Page {
  index: number;
  width: number;
  height: number;
  imageData: ImageData;
}

export interface AppDocument {
  id: string;
  type: 'pdf' | 'image';
  metadata: FileMetadata;
  pages: Page[];
}

// ─── Text Region ───

export interface TextRegion {
  id: string;
  text: string;
  boundingBox: BBox;
  fontSize: number;
  textColor: RGB;
  confidence: number;
  language: string;
  sourceIds?: string[];
  inpaintMode?: InpaintMode;
}

// ─── Erased Region ───

export interface ErasedRegion {
  id: string;
  boundingBox: BBox;
  fillColor: RGB;
  inpaintMode: InpaintMode;
  hybridSuggested: InpaintMode;
}

// ─── Page Edit State ───

export interface PageEditState {
  textRegions: TextRegion[];
  rawTextRegions: TextRegion[];
  erasedRegions: ErasedRegion[];
}

// ─── History ───

export type HistoryAction =
  | { type: 'text_edit'; regionId: string; oldText: string; newText: string; oldFontSize?: number; newFontSize?: number; oldTextColor?: RGB; newTextColor?: RGB }
  | { type: 'erase'; regionId: string; region: TextRegion; fillColor: RGB; inpaintMode: InpaintMode; hybridSuggested: InpaintMode }
  | { type: 'restore'; regionId: string; region: TextRegion }
  | { type: 'split'; mergedRegion: TextRegion; rawRegions: TextRegion[] }
  | { type: 'merge'; sourceRegions: TextRegion[]; mergedRegion: TextRegion }
  | { type: 'delete'; regions: TextRegion[] }
  | { type: 'move'; regionId: string; oldBBox: BBox; newBBox: BBox }
  | { type: 'resize'; regionId: string; oldBBox: BBox; newBBox: BBox };

// ─── Export ───

export interface ExportOptions {
  width: number;
  height: number;
  backgroundFormat: 'jpeg' | 'png';
  jpegQuality: number;
}

// ─── OCR ───

export interface OCREngineInfo {
  id: string;
  name: string;
  description: string;
}

export interface OCRProgress {
  progress: number;
  message: string;
}

// ─── Worker Protocol ───

export interface WorkerRequest {
  type: string;
  id: number;
  payload: unknown;
}

export interface WorkerResponse {
  type: 'result' | 'progress' | 'error';
  id: number;
  payload: unknown;
}
