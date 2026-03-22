/**
 * ONNX Runtime execution provider selection with WebGPU auto-detection.
 * WebGPU can provide 20-50x speedup over WASM for inference.
 */
import { createLogger } from './logger';

const log = createLogger('onnx-provider');

let cachedProvider: string | null = null;

/** Detect if WebGPU is available in the current environment */
export async function detectWebGPU(): Promise<boolean> {
  try {
    if (typeof navigator === 'undefined') return false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gpu = (navigator as any).gpu;
    if (!gpu) return false;
    const adapter = await gpu.requestAdapter();
    return !!adapter;
  } catch {
    return false;
  }
}

/** Get the best available execution provider: webgpu > wasm */
export async function getBestProvider(): Promise<string> {
  if (cachedProvider) return cachedProvider;
  // WebGPU has incomplete operator support (e.g. MaxPool ceil_mode).
  // Default to WASM which supports all ONNX operators.
  cachedProvider = 'wasm';
  log.info('ONNX provider: wasm');
  return cachedProvider;
}

/** Get execution providers array for ONNX session creation */
export async function getExecutionProviders(): Promise<string[]> {
  return ['wasm'];
}
