/**
 * Main-thread client for LaMa inpainting Web Worker.
 * Falls back to Laplace inpainting if Worker fails.
 */
import { createLogger } from '@/shared/utils/logger';
import type { BBox } from '@/shared/types';
import type { LamaRequest, LamaResponse } from './lamaWorker';

const log = createLogger('lama-worker-client');

let worker: Worker | null = null;
let workerFailed = false;

function getWorker(): Worker | null {
  if (workerFailed) return null;
  if (worker) return worker;
  try {
    worker = new Worker(new URL('./lamaWorker.ts', import.meta.url), { type: 'module' });
    log.info('LaMa Worker created');
    return worker;
  } catch (e) {
    log.warn('Failed to create LaMa Worker', e);
    workerFailed = true;
    return null;
  }
}

function postAndWait<T>(
  msg: LamaRequest,
  onProgress?: (message: string) => void,
  transfer?: Transferable[],
): Promise<T> {
  const w = getWorker();
  if (!w) return Promise.reject(new Error('LaMa Worker unavailable'));

  return new Promise((resolve, reject) => {
    const handler = (e: MessageEvent<LamaResponse>) => {
      const resp = e.data;
      if (resp.type === 'progress') {
        onProgress?.(resp.message);
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

export async function preloadLama(onProgress?: (msg: string) => void): Promise<boolean> {
  const w = getWorker();
  if (!w) { log.warn('LaMa Worker not available'); return false; }
  try {
    const result = await postAndWait<{ type: 'preload-done'; success: boolean }>({ type: 'preload' }, onProgress);
    log.info('LaMa preloaded in worker');
    return result.success;
  } catch (e) {
    log.error('LaMa preload failed', e);
    return false;
  }
}

export async function lamaInpaintRegion(
  imageData: ImageData,
  bbox: BBox,
  onProgress?: (msg: string) => void,
): Promise<ImageData> {
  const w = getWorker();
  if (!w) throw new Error('LaMa Worker not available');

  const buf = imageData.data.buffer.slice(0);
  const result = await postAndWait<{ type: 'inpaint-done'; imageBuffer: ArrayBuffer }>(
    { type: 'inpaint', imageBuffer: buf, width: imageData.width, height: imageData.height, bboxX: bbox.x, bboxY: bbox.y, bboxW: bbox.width, bboxH: bbox.height },
    onProgress,
    [buf],
  );
  return new ImageData(new Uint8ClampedArray(result.imageBuffer), imageData.width, imageData.height);
}

export function terminateLamaWorker(): void {
  if (worker) { worker.terminate(); worker = null; log.info('LaMa Worker terminated'); }
}

export function isLamaWorkerAvailable(): boolean { return !workerFailed; }
