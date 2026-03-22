import { createLogger } from '@/shared/utils/logger';
import { estimateFontSize, sampleTextColor } from '../services/textSampler';
import type { TextRegion, OCRProgress } from '@/shared/types';

const log = createLogger('paddle-ocr');

const MODEL_BASE = 'https://huggingface.co/marsena/paddleocr-onnx-models/resolve/main';
const DET_URL = `${MODEL_BASE}/PP-OCRv5_server_det_infer.onnx`;
const REC_URL = `${MODEL_BASE}/PP-OCRv5_server_rec_infer.onnx`;
const KEYS_URL = '/models/paddle-ocr/ppocr_v5_keys.txt';
const CACHE_NAME = 'paddle-ocr-models-v1';
const MAX_SIDE = 1920;
const DET_THRESHOLD = 0.3;
const UNCLIP_RATIO = 1.5;
const REC_HEIGHT = 48;
const REC_MAX_WIDTH = 2048;
const MEAN = [0.485, 0.456, 0.406] as const;
const STD = [0.229, 0.224, 0.225] as const;

let regionCounter = 0;
function nextId(): string { return `paddle-${Date.now()}-${++regionCounter}`; }

async function fetchWithCache(url: string, onProgress?: (loaded: number, total: number) => void): Promise<ArrayBuffer> {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(url);
  if (cached) {
    const buf = await cached.arrayBuffer();
    onProgress?.(buf.byteLength, buf.byteLength);
    return buf;
  }

  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const total = Number(resp.headers.get('content-length') || 0);

  if (!total || !resp.body) {
    const buf = await resp.arrayBuffer();
    await cache.put(url, new Response(buf));
    return buf;
  }

  const reader = resp.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.byteLength;
    onProgress?.(loaded, total);
  }

  const result = new Uint8Array(loaded);
  let offset = 0;
  for (const c of chunks) { result.set(c, offset); offset += c.byteLength; }
  await cache.put(url, new Response(result.buffer));
  return result.buffer;
}

export class PaddleOCREngine {
  readonly id = 'paddle-ocr';
  readonly name = 'PP-OCRv5 (PaddleOCR)';

  private detSession: unknown = null;
  private recSession: unknown = null;
  private dictionary: string[] = [];
  private initialized = false;

  async preload(onProgress?: (p: OCRProgress) => void): Promise<void> {
    if (this.initialized) return;
    await this.init((pct, msg) => onProgress?.({ progress: pct, message: msg }));
  }

  async recognize(imageData: ImageData, opts?: { onProgress?: (p: OCRProgress) => void }): Promise<TextRegion[]> {
    const start = performance.now();
    const report = (pct: number, msg: string) => opts?.onProgress?.({ progress: pct, message: msg });

    if (!this.initialized) {
      report(0, 'Loading PP-OCRv5 models...');
      await this.init((pct, msg) => report(pct, msg));
    }

    report(15, 'Detecting text regions...');
    const boxes = await this.runDetection(imageData);
    log.info(`Detected ${boxes.length} boxes`);
    report(35, `Detected ${boxes.length} text regions`);

    if (boxes.length === 0) { report(100, 'No text detected'); return []; }

    report(40, `Recognizing ${boxes.length} regions...`);
    const regions = await this.runRecognition(imageData, boxes, (i, total) => {
      report(40 + (i / total) * 55, `Recognizing ${i + 1}/${total}...`);
    });

    report(100, 'PP-OCRv5 complete');
    log.perf(`PaddleOCR: ${regions.length} regions`, start);
    return regions;
  }

  async destroy(): Promise<void> {
    this.detSession = null;
    this.recSession = null;
    this.initialized = false;
  }

  private async init(report: (pct: number, msg: string) => void): Promise<void> {
    const ort = await import('onnxruntime-web');
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.3/dist/';

    const { getExecutionProviders } = await import('@/shared/utils/onnxProvider');
    const eps = await getExecutionProviders();

    report(0, 'Downloading detection model...');
    const detBuf = await fetchWithCache(DET_URL, (loaded, total) => {
      report(Math.round(loaded / total * 45), `Detection model: ${(loaded / 1e6).toFixed(1)}/${(total / 1e6).toFixed(0)} MB`);
    });
    report(45, 'Initializing detection model...');
    this.detSession = await ort.InferenceSession.create(detBuf, { executionProviders: eps });

    report(48, 'Downloading recognition model...');
    const recBuf = await fetchWithCache(REC_URL, (loaded, total) => {
      report(48 + Math.round(loaded / total * 42), `Recognition model: ${(loaded / 1e6).toFixed(1)}/${(total / 1e6).toFixed(0)} MB`);
    });
    report(90, 'Initializing recognition model...');
    this.recSession = await ort.InferenceSession.create(recBuf, { executionProviders: eps });

    report(95, 'Loading dictionary...');
    const resp = await fetch(KEYS_URL);
    if (!resp.ok) throw new Error(`Dictionary HTTP ${resp.status}`);
    const text = await resp.text();
    this.dictionary = ['', ...text.split('\n').filter(l => l.length > 0), ' '];

    this.initialized = true;
    report(12, 'PP-OCRv5 ready');
    log.info('PaddleOCR initialized', { dictSize: this.dictionary.length });
  }

  private async runDetection(imageData: ImageData): Promise<Array<{ x: number; y: number; w: number; h: number }>> {
    const ort = await import('onnxruntime-web');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = this.detSession as any;
    const { width: imgW, height: imgH } = imageData;

    let scale = 1;
    if (Math.max(imgW, imgH) > MAX_SIDE) scale = MAX_SIDE / Math.max(imgW, imgH);
    const resW = Math.max(32, Math.ceil(imgW * scale / 32) * 32);
    const resH = Math.max(32, Math.ceil(imgH * scale / 32) * 32);
    const scaleX = imgW / resW;
    const scaleY = imgH / resH;

    // Resize + normalize
    const canvas = new OffscreenCanvas(resW, resH);
    const srcCanvas = new OffscreenCanvas(imgW, imgH);
    srcCanvas.getContext('2d')!.putImageData(imageData, 0, 0);
    canvas.getContext('2d')!.drawImage(srcCanvas, 0, 0, resW, resH);
    const pixels = canvas.getContext('2d')!.getImageData(0, 0, resW, resH).data;

    const size = resW * resH;
    const input = new Float32Array(3 * size);
    for (let i = 0; i < size; i++) {
      const p = i * 4;
      input[i] = (pixels[p]! / 255 - MEAN[0]) / STD[0];
      input[size + i] = (pixels[p + 1]! / 255 - MEAN[1]) / STD[1];
      input[2 * size + i] = (pixels[p + 2]! / 255 - MEAN[2]) / STD[2];
    }

    const tensor = new ort.Tensor('float32', input, [1, 3, resH, resW]);
    const results = await session.run({ x: tensor });
    const output = Object.values(results)[0]!;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const probMap = (output as any).data as Float32Array;

    return this.dbPostprocess(probMap, resW, resH, scaleX, scaleY);
  }

  private dbPostprocess(probMap: Float32Array, w: number, h: number, scaleX: number, scaleY: number): Array<{ x: number; y: number; w: number; h: number }> {
    // Binarize
    const binary = new Uint8Array(w * h);
    for (let i = 0; i < probMap.length; i++) {
      binary[i] = probMap[i]! > DET_THRESHOLD ? 1 : 0;
    }

    // Connected components (simple flood fill)
    const visited = new Uint8Array(w * h);
    const boxes: Array<{ x: number; y: number; w: number; h: number }> = [];

    for (let y0 = 0; y0 < h; y0++) {
      for (let x0 = 0; x0 < w; x0++) {
        const idx = y0 * w + x0;
        if (!binary[idx] || visited[idx]) continue;

        let minX = x0, maxX = x0, minY = y0, maxY = y0;
        let area = 0;
        const stack = [idx];
        while (stack.length > 0) {
          const ci = stack.pop()!;
          if (visited[ci]) continue;
          visited[ci] = 1;
          area++;
          const cx = ci % w, cy = Math.floor(ci / w);
          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;

          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
            const nx = cx + dx, ny = cy + dy;
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
              const ni = ny * w + nx;
              if (binary[ni] && !visited[ni]) stack.push(ni);
            }
          }
        }

        if (area < 10) continue; // skip tiny components
        const bw = maxX - minX + 1;
        const bh = maxY - minY + 1;
        if (bw < 3 || bh < 3) continue;

        // Standard DB post-processing unclip (Vatti clipping)
        // dist = (area / perimeter) * unclipRatio
        const perimeter = 2 * (bw + bh);
        const dist = (bw * bh) / perimeter * UNCLIP_RATIO;

        const ux = Math.max(0, Math.round((minX - dist) * scaleX));
        const uy = Math.max(0, Math.round((minY - dist) * scaleY));
        const ux2 = Math.round((maxX + 1 + dist) * scaleX);
        const uy2 = Math.round((maxY + 1 + dist) * scaleY);
        boxes.push({ x: ux, y: uy, w: ux2 - ux, h: uy2 - uy });
      }
    }

    return boxes;
  }

  private async runRecognition(
    imageData: ImageData,
    boxes: Array<{ x: number; y: number; w: number; h: number }>,
    onBox?: (i: number, total: number) => void,
  ): Promise<TextRegion[]> {
    const ort = await import('onnxruntime-web');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = this.recSession as any;
    const srcCanvas = new OffscreenCanvas(imageData.width, imageData.height);
    srcCanvas.getContext('2d')!.putImageData(imageData, 0, 0);

    const regions: TextRegion[] = [];

    for (let i = 0; i < boxes.length; i++) {
      onBox?.(i, boxes.length);
      const box = boxes[i]!;

      // Crop region
      const cropW = Math.min(box.w, imageData.width - box.x);
      const cropH = Math.min(box.h, imageData.height - box.y);
      if (cropW <= 0 || cropH <= 0) continue;

      const recW = Math.min(REC_MAX_WIDTH, Math.max(1, Math.round(cropW * REC_HEIGHT / cropH)));
      const cropCanvas = new OffscreenCanvas(recW, REC_HEIGHT);
      cropCanvas.getContext('2d')!.drawImage(srcCanvas, box.x, box.y, cropW, cropH, 0, 0, recW, REC_HEIGHT);
      const pixels = cropCanvas.getContext('2d')!.getImageData(0, 0, recW, REC_HEIGHT).data;

      const size = recW * REC_HEIGHT;
      const input = new Float32Array(3 * size);
      for (let j = 0; j < size; j++) {
        const p = j * 4;
        input[j] = (pixels[p]! / 255 - 0.5) / 0.5;
        input[size + j] = (pixels[p + 1]! / 255 - 0.5) / 0.5;
        input[2 * size + j] = (pixels[p + 2]! / 255 - 0.5) / 0.5;
      }

      const tensor = new ort.Tensor('float32', input, [1, 3, REC_HEIGHT, recW]);
      const results = await session.run({ x: tensor });
      const output = Object.values(results)[0]!;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const probs = (output as any).data as Float32Array;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dims = (output as any).dims as number[];
      const seqLen = dims[1]!;
      const vocabSize = dims[2]!;

      // CTC decode
      let text = '';
      let totalConf = 0;
      let confCount = 0;
      let prevIdx = 0;

      for (let t = 0; t < seqLen; t++) {
        let maxVal = -Infinity, maxIdx = 0;
        for (let v = 0; v < vocabSize; v++) {
          const val = probs[t * vocabSize + v]!;
          if (val > maxVal) { maxVal = val; maxIdx = v; }
        }
        if (maxIdx !== 0 && maxIdx !== prevIdx && maxIdx < this.dictionary.length) {
          text += this.dictionary[maxIdx]!;
          totalConf += maxVal;
          confCount++;
        }
        prevIdx = maxIdx;
      }

      if (!text.trim()) continue;

      regions.push({
        id: nextId(),
        text: text.trim(),
        boundingBox: { x: box.x, y: box.y, width: cropW, height: cropH },
        fontSize: estimateFontSize(cropH),
        textColor: sampleTextColor(imageData, box.x, box.y, cropW, cropH),
        confidence: confCount > 0 ? (totalConf / confCount) * 100 : 0,
        language: 'ch',
      });
    }

    return regions;
  }
}
