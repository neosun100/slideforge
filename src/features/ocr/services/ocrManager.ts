import { createLogger } from '@/shared/utils/logger';
import type { TextRegion, OCRProgress } from '@/shared/types';
import { PaddleOCREngine } from '../engines/PaddleOCREngine';
import { TesseractEngine } from '../engines/TesseractEngine';
import { mergeNearbyRegions } from './mergeRegions';

const log = createLogger('ocr-manager');

interface OCREngineBase {
  preload(onProgress?: (p: OCRProgress) => void): Promise<void>;
  recognize(imageData: ImageData, opts?: { onProgress?: (p: OCRProgress) => void }): Promise<TextRegion[]>;
  destroy(): Promise<void>;
}

const engines: Record<string, () => OCREngineBase> = {
  'paddle-ocr': () => new PaddleOCREngine(),
  'tesseract': () => new TesseractEngine(),
};

let currentEngine: OCREngineBase | null = null;
let currentEngineId = '';

export function getAvailableEngines() {
  return [
    { id: 'paddle-ocr', name: 'PP-OCRv5 (PaddleOCR)', description: 'High-accuracy OCR via PaddleOCR ONNX models.' },
    { id: 'tesseract', name: 'Tesseract.js', description: 'Open-source OCR engine running in WebAssembly.' },
  ];
}

export async function preloadEngine(engineId: string, onProgress?: (p: OCRProgress) => void): Promise<void> {
  if (currentEngineId === engineId && currentEngine) return;
  if (currentEngine) await currentEngine.destroy();

  const factory = engines[engineId];
  if (!factory) throw new Error(`Unknown OCR engine: ${engineId}`);

  currentEngine = factory();
  currentEngineId = engineId;
  await currentEngine.preload(onProgress);
  log.info(`Engine preloaded: ${engineId}`);
}

export async function recognizeTextRegions(
  imageData: ImageData,
  onProgress?: (p: OCRProgress) => void,
  engineId = 'paddle-ocr',
  opts?: { minConfidence?: number; mergeRowOnly?: boolean },
): Promise<{ raw: TextRegion[]; merged: TextRegion[] }> {
  if (currentEngineId !== engineId || !currentEngine) {
    await preloadEngine(engineId, onProgress);
  }

  const raw = await currentEngine!.recognize(imageData, { onProgress });
  const merged = mergeNearbyRegions(
    raw.filter((r: TextRegion) => r.confidence >= (opts?.minConfidence ?? 0)),
    opts?.mergeRowOnly ?? true,
  );

  log.info(`OCR complete: ${raw.length} raw → ${merged.length} merged`);
  return { raw, merged };
}
