import type { BBox, InpaintMode } from '@/shared/types';

const VARIANCE_THRESHOLD = 50;

/** Analyze boundary complexity to decide inpaint mode */
export function analyzeInpaintMode(imageData: ImageData, bbox: BBox): InpaintMode {
  const data = imageData.data;
  const imgW = imageData.width;
  const imgH = imageData.height;

  const rSamples: number[] = [];
  const gSamples: number[] = [];
  const bSamples: number[] = [];

  const sample = (px: number, py: number) => {
    const cx = Math.max(0, Math.min(imgW - 1, Math.round(px)));
    const cy = Math.max(0, Math.min(imgH - 1, Math.round(py)));
    const idx = (cy * imgW + cx) * 4;
    rSamples.push(data[idx]!);
    gSamples.push(data[idx + 1]!);
    bSamples.push(data[idx + 2]!);
  };

  // Sample 1px ring around bbox
  const { x, y, width: w, height: h } = bbox;
  for (let i = 0; i <= w; i += 3) {
    sample(x + i, y - 1);
    sample(x + i, y + h);
  }
  for (let i = 0; i <= h; i += 3) {
    sample(x - 1, y + i);
    sample(x + w, y + i);
  }

  if (rSamples.length === 0) return 'laplace';

  const variance = (arr: number[]) => {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length;
  };

  const avgVariance = (variance(rSamples) + variance(gSamples) + variance(bSamples)) / 3;
  return avgVariance > VARIANCE_THRESHOLD ? 'lama' : 'laplace';
}

export { VARIANCE_THRESHOLD };
