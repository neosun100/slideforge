import { createLogger } from '@/shared/utils/logger';
import { estimateFontSize, sampleTextColor } from '../services/textSampler';
import type { TextRegion, OCRProgress } from '@/shared/types';

const log = createLogger('tesseract');

let regionCounter = 0;
function nextId(): string { return `tess-${Date.now()}-${++regionCounter}`; }

export class TesseractEngine {
  readonly id = 'tesseract';
  readonly name = 'Tesseract.js';

  async preload(_onProgress?: (p: OCRProgress) => void): Promise<void> {
    log.info('Tesseract preload (lazy — loads on first recognize)');
  }

  async recognize(imageData: ImageData, opts?: { onProgress?: (p: OCRProgress) => void }): Promise<TextRegion[]> {
    const start = performance.now();
    log.info('Starting Tesseract recognition', { w: imageData.width, h: imageData.height });

    const Tesseract = await import('tesseract.js');
    const worker = await Tesseract.createWorker('eng', undefined, {
      logger: (m: { progress: number; status: string }) => {
        opts?.onProgress?.({ progress: Math.round(m.progress * 100), message: m.status });
      },
    });

    try {
      // Convert ImageData to canvas for Tesseract
      const canvas = new OffscreenCanvas(imageData.width, imageData.height);
      canvas.getContext('2d')!.putImageData(imageData, 0, 0);
      const blob = await canvas.convertToBlob({ type: 'image/png' });
      const arrayBuf = await blob.arrayBuffer();

      const result = await worker.recognize(new Uint8Array(arrayBuf) as never);
      const regions = this.convertResults(result.data, imageData);
      log.perf(`Tesseract: ${regions.length} regions`, start);
      return regions;
    } finally {
      await worker.terminate();
    }
  }

  async destroy(): Promise<void> { /* no-op, worker terminated after each recognize */ }

  private convertResults(data: Tesseract.Page, imageData: ImageData): TextRegion[] {
    const regions: TextRegion[] = [];
    if (!data.blocks) return regions;

    for (const block of data.blocks) {
      for (const para of block.paragraphs) {
        for (const line of para.lines) {
          const words = line.words;
          if (!words?.length) continue;

          const text = words.map(w => w.text).join('').trim();
          if (!text) continue;

          const x = Math.min(...words.map(w => w.bbox.x0));
          const y = Math.min(...words.map(w => w.bbox.y0));
          const x1 = Math.max(...words.map(w => w.bbox.x1));
          const y1 = Math.max(...words.map(w => w.bbox.y1));
          const w = x1 - x;
          const h = y1 - y;
          if (w <= 0 || h <= 0) continue;

          regions.push({
            id: nextId(),
            text,
            boundingBox: { x, y, width: w, height: h },
            fontSize: estimateFontSize(h),
            textColor: sampleTextColor(imageData, x, y, w, h),
            confidence: words.reduce((s, wd) => s + wd.confidence, 0) / words.length,
            language: 'en',
          });
        }
      }
    }
    return regions;
  }
}
