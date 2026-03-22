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
  const hasWebGPU = await detectWebGPU();
  cachedProvider = hasWebGPU ? 'webgpu' : 'wasm';
  log.info(`ONNX provider: ${cachedProvider}${hasWebGPU ? ' (GPU accelerated)' : ''}`);
  return cachedProvider;
}

/** Get execution providers array for ONNX session creation (with fallback) */
export async function getExecutionProviders(): Promise<string[]> {
  const best = await getBestProvider();
  return best === 'webgpu' ? ['webgpu', 'wasm'] : ['wasm'];
}
