/**
 * OCR Web Worker — runs PaddleOCR / Tesseract ONNX inference off the main thread.
 * Communication via postMessage with transferable ImageData buffers.
 */
import type { TextRegion, OCRProgress } from '@/shared/types';

// Lazy-loaded engine instances inside the worker
let engine: { preload(onProgress?: (p: OCRProgress) => void): Promise<void>; recognize(imageData: ImageData, opts?: { onProgress?: (p: OCRProgress) => void }): Promise<TextRegion[]>; destroy(): Promise<void> } | null = null;
let currentEngineId = '';

async function getEngine(engineId: string) {
  if (currentEngineId === engineId && engine) return engine;
  if (engine) await engine.destroy();

  if (engineId === 'paddle-ocr') {
    const { PaddleOCREngine } = await import('../engines/PaddleOCREngine');
    engine = new PaddleOCREngine();
  } else {
    const { TesseractEngine } = await import('../engines/TesseractEngine');
    engine = new TesseractEngine();
  }
  currentEngineId = engineId;
  return engine;
}

export type WorkerRequest =
  | { type: 'preload'; engineId: string }
  | { type: 'recognize'; engineId: string; imageData: ImageData };

export type WorkerResponse =
  | { type: 'progress'; data: OCRProgress }
  | { type: 'preload-done' }
  | { type: 'recognize-done'; regions: TextRegion[] }
  | { type: 'error'; message: string };

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const msg = e.data;
  try {
    if (msg.type === 'preload') {
      const eng = await getEngine(msg.engineId);
      await eng.preload((p) => self.postMessage({ type: 'progress', data: p } satisfies WorkerResponse));
      self.postMessage({ type: 'preload-done' } satisfies WorkerResponse);
    } else if (msg.type === 'recognize') {
      const eng = await getEngine(msg.engineId);
      const regions = await eng.recognize(msg.imageData, {
        onProgress: (p) => self.postMessage({ type: 'progress', data: p } satisfies WorkerResponse),
      });
      self.postMessage({ type: 'recognize-done', regions } satisfies WorkerResponse);
    }
  } catch (err) {
    self.postMessage({ type: 'error', message: err instanceof Error ? err.message : String(err) } satisfies WorkerResponse);
  }
};
