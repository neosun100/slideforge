/**
 * LaMa Inpainting Web Worker — runs LaMa ONNX inference off the main thread.
 * Model: Carve/LaMa-ONNX (512x512 fixed input, fp32)
 */
const MODEL_URL = 'https://huggingface.co/Carve/LaMa-ONNX/resolve/main/lama_fp32.onnx';
const CACHE_KEY = 'lama-model-v1';
const SIZE = 512;

let session: unknown = null;

async function fetchWithCache(url: string, onProgress?: (msg: string) => void): Promise<ArrayBuffer> {
  const cache = await caches.open(CACHE_KEY);
  const cached = await cache.match(url);
  if (cached) { onProgress?.('Loading LaMa from cache...'); return cached.arrayBuffer(); }

  onProgress?.('Downloading LaMa model (~200MB)...');
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const buf = await resp.arrayBuffer();
  await cache.put(url, new Response(buf.slice(0)));
  return buf;
}

async function ensureSession(onProgress?: (msg: string) => void) {
  if (session) return;
  const ort = await import('onnxruntime-web');
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.3/dist/';

  // Detect WebGPU in worker context
  let eps: string[] = ['wasm'];
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gpu = (navigator as any).gpu;
    if (gpu) { const adapter = await gpu.requestAdapter(); if (adapter) eps = ['webgpu', 'wasm']; }
  } catch { /* no WebGPU */ }

  const buf = await fetchWithCache(MODEL_URL, onProgress);
  onProgress?.('Initializing LaMa session...');
  session = await ort.InferenceSession.create(buf, { executionProviders: eps });
  onProgress?.('LaMa ready');
}

async function inpaint(
  imageBuffer: ArrayBuffer, width: number, height: number,
  bboxX: number, bboxY: number, bboxW: number, bboxH: number,
  onProgress?: (msg: string) => void,
): Promise<ArrayBuffer> {
  const ort = await import('onnxruntime-web');
  await ensureSession(onProgress);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sess = session as any;

  onProgress?.('Preparing LaMa input...');

  // Reconstruct ImageData from buffer
  const srcData = new Uint8ClampedArray(imageBuffer);

  // Crop bbox from source, resize to 512x512
  const cropCanvas = new OffscreenCanvas(bboxW, bboxH);
  const cropCtx = cropCanvas.getContext('2d')!;
  const srcImg = new ImageData(srcData, width, height);
  const fullCanvas = new OffscreenCanvas(width, height);
  fullCanvas.getContext('2d')!.putImageData(srcImg, 0, 0);
  cropCtx.drawImage(fullCanvas, bboxX, bboxY, bboxW, bboxH, 0, 0, bboxW, bboxH);

  const resized = new OffscreenCanvas(SIZE, SIZE);
  resized.getContext('2d')!.drawImage(cropCanvas, 0, 0, SIZE, SIZE);
  const pixels = resized.getContext('2d')!.getImageData(0, 0, SIZE, SIZE).data;

  // Build image tensor [1,3,512,512] normalized to [0,1]
  const imgArr = new Float32Array(3 * SIZE * SIZE);
  for (let i = 0; i < SIZE * SIZE; i++) {
    imgArr[i] = pixels[i * 4]! / 255;
    imgArr[SIZE * SIZE + i] = pixels[i * 4 + 1]! / 255;
    imgArr[2 * SIZE * SIZE + i] = pixels[i * 4 + 2]! / 255;
  }

  // Build mask tensor [1,1,512,512] — all 1s (inpaint entire bbox)
  const maskArr = new Float32Array(SIZE * SIZE).fill(1);

  const imgTensor = new ort.Tensor('float32', imgArr, [1, 3, SIZE, SIZE]);
  const maskTensor = new ort.Tensor('float32', maskArr, [1, 1, SIZE, SIZE]);

  onProgress?.('Running LaMa inference...');
  const results = await sess.run({ image: imgTensor, mask: maskTensor });
  const output = Object.values(results)[0]!;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const outData = (output as any).data as Float32Array;

  // Convert output to ImageData
  const outCanvas = new OffscreenCanvas(SIZE, SIZE);
  const outCtx = outCanvas.getContext('2d')!;
  const outImg = outCtx.createImageData(SIZE, SIZE);
  for (let i = 0; i < SIZE * SIZE; i++) {
    outImg.data[i * 4] = Math.max(0, Math.min(255, Math.round(outData[i]! * 255)));
    outImg.data[i * 4 + 1] = Math.max(0, Math.min(255, Math.round(outData[SIZE * SIZE + i]! * 255)));
    outImg.data[i * 4 + 2] = Math.max(0, Math.min(255, Math.round(outData[2 * SIZE * SIZE + i]! * 255)));
    outImg.data[i * 4 + 3] = 255;
  }
  outCtx.putImageData(outImg, 0, 0);

  // Resize back to bbox size and paste into source
  const patchCanvas = new OffscreenCanvas(bboxW, bboxH);
  patchCanvas.getContext('2d')!.drawImage(outCanvas, 0, 0, bboxW, bboxH);
  const patchData = patchCanvas.getContext('2d')!.getImageData(0, 0, bboxW, bboxH).data;

  // Write patch back into source buffer
  for (let py = 0; py < bboxH; py++) {
    for (let px = 0; px < bboxW; px++) {
      const srcIdx = ((bboxY + py) * width + (bboxX + px)) * 4;
      const pIdx = (py * bboxW + px) * 4;
      srcData[srcIdx] = patchData[pIdx]!;
      srcData[srcIdx + 1] = patchData[pIdx + 1]!;
      srcData[srcIdx + 2] = patchData[pIdx + 2]!;
    }
  }

  onProgress?.('LaMa inpainting complete');
  return srcData.buffer;
}

export type LamaRequest =
  | { type: 'preload' }
  | { type: 'inpaint'; imageBuffer: ArrayBuffer; width: number; height: number; bboxX: number; bboxY: number; bboxW: number; bboxH: number };

export type LamaResponse =
  | { type: 'progress'; message: string }
  | { type: 'preload-done'; success: boolean }
  | { type: 'inpaint-done'; imageBuffer: ArrayBuffer }
  | { type: 'error'; message: string };

self.onmessage = async (e: MessageEvent<LamaRequest>) => {
  const msg = e.data;
  try {
    if (msg.type === 'preload') {
      await ensureSession((m) => self.postMessage({ type: 'progress', message: m } satisfies LamaResponse));
      self.postMessage({ type: 'preload-done', success: true } satisfies LamaResponse);
    } else if (msg.type === 'inpaint') {
      const result = await inpaint(
        msg.imageBuffer, msg.width, msg.height,
        msg.bboxX, msg.bboxY, msg.bboxW, msg.bboxH,
        (m) => self.postMessage({ type: 'progress', message: m } satisfies LamaResponse),
      );
      self.postMessage({ type: 'inpaint-done', imageBuffer: result } satisfies LamaResponse, { transfer: [result] });
    }
  } catch (err) {
    self.postMessage({ type: 'error', message: err instanceof Error ? err.message : String(err) } satisfies LamaResponse);
  }
};
