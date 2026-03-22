/**
 * Main-thread client that proxies OCR calls to the Web Worker.
 * Falls back to main-thread execution if Worker creation fails.
 */
import { createLogger } from '@/shared/utils/logger';
import type { TextRegion, OCRProgress } from '@/shared/types';
import type { WorkerRequest, WorkerResponse } from './ocrWorker';

const log = createLogger('ocr-worker-client');

let worker: Worker | null = null;
let workerFailed = false;

function getWorker(): Worker | null {
  if (workerFailed) return null;
  if (worker) return worker;
  try {
    worker = new Worker(new URL('./ocrWorker.ts', import.meta.url), { type: 'module' });
    log.info('OCR Worker created');
    return worker;
  } catch (e) {
    log.warn('Failed to create OCR Worker, falling back to main thread', e);
    workerFailed = true;
    return null;
  }
}

function postAndWait<T>(
  msg: WorkerRequest,
  onProgress?: (p: OCRProgress) => void,
  transfer?: Transferable[],
): Promise<T> {
  const w = getWorker();
  if (!w) return Promise.reject(new Error('Worker unavailable'));

  return new Promise((resolve, reject) => {
    const handler = (e: MessageEvent<WorkerResponse>) => {
      const resp = e.data;
      if (resp.type === 'progress') {
        onProgress?.(resp.data);
      } else if (resp.type === 'error') {
        w.removeEventListener('message', handler);
        reject(new Error(resp.message));
      } else {
        w.removeEventListener('message', handler);
        resolve(resp as unknown as T);
      }
    };
    w.addEventListener('message', handler);
    if (transfer?.length) {
      w.postMessage(msg, transfer);
    } else {
      w.postMessage(msg);
    }
  });
}

export async function preloadEngineWorker(
  engineId: string,
  onProgress?: (p: OCRProgress) => void,
): Promise<void> {
  const w = getWorker();
  if (!w) {
    // Fallback: main-thread preload
    const { preloadEngine } = await import('../services/ocrManager');
    return preloadEngine(engineId, onProgress);
  }
  await postAndWait<{ type: 'preload-done' }>({ type: 'preload', engineId }, onProgress);
  log.info(`Engine preloaded in worker: ${engineId}`);
}

export async function recognizeInWorker(
  imageData: ImageData,
  engineId: string,
  onProgress?: (p: OCRProgress) => void,
): Promise<TextRegion[]> {
  const w = getWorker();
  if (!w) {
    // Fallback: main-thread recognize
    const { recognizeTextRegions } = await import('../services/ocrManager');
    const { merged } = await recognizeTextRegions(imageData, onProgress, engineId);
    return merged;
  }
  const result = await postAndWait<{ type: 'recognize-done'; regions: TextRegion[] }>(
    { type: 'recognize', engineId, imageData },
    onProgress,
  );
  return result.regions;
}

export function terminateOCRWorker(): void {
  if (worker) {
    worker.terminate();
    worker = null;
    log.info('OCR Worker terminated');
  }
}

/** Check if worker is available (for testing) */
export function isWorkerAvailable(): boolean {
  return !workerFailed;
}
