import type { RGB, BBox } from '@/shared/types';
import { luminance } from '@/shared/utils/color';

/** Estimate font size from bounding box height */
export function estimateFontSize(height: number): number {
  return Math.max(8, Math.round(height * 0.85));
}

/** Sample text color by finding darkest pixel in boundary ring */
export function sampleTextColor(imageData: ImageData, x: number, y: number, w: number, h: number): RGB {
  const data = imageData.data;
  const imgW = imageData.width;
  const imgH = imageData.height;

  const ring = 3;
  const samples: { r: number; g: number; b: number; lum: number }[] = [];

  const sample = (px: number, py: number) => {
    const cx = Math.max(0, Math.min(imgW - 1, Math.round(px)));
    const cy = Math.max(0, Math.min(imgH - 1, Math.round(py)));
    const idx = (cy * imgW + cx) * 4;
    const r = data[idx]!, g = data[idx + 1]!, b = data[idx + 2]!;
    samples.push({ r, g, b, lum: luminance({ r, g, b }) });
  };

  // Sample boundary ring
  for (let i = 0; i <= 8; i++) {
    const px = x + w * i / 8;
    sample(px, y - ring);
    sample(px, y + h + ring);
  }
  for (let i = 1; i < 8; i++) {
    const py = y + h * i / 8;
    sample(x - ring, py);
    sample(x + w + ring, py);
  }

  if (samples.length === 0) return { r: 0, g: 0, b: 0 };

  // Find darkest pixel (likely text color)
  let darkest = samples[0]!;
  for (const s of samples) {
    if (s.lum < darkest.lum) darkest = s;
  }
  return { r: darkest.r, g: darkest.g, b: darkest.b };
}

/** Sample background color from boundary pixels */
export function sampleBackgroundColor(imageData: ImageData, bbox: BBox): RGB {
  const data = imageData.data;
  const imgW = imageData.width;
  const imgH = imageData.height;
  const pad = 5;
  let rSum = 0, gSum = 0, bSum = 0, count = 0;

  const add = (px: number, py: number) => {
    const cx = Math.max(0, Math.min(imgW - 1, Math.round(px)));
    const cy = Math.max(0, Math.min(imgH - 1, Math.round(py)));
    const idx = (cy * imgW + cx) * 4;
    rSum += data[idx]!; gSum += data[idx + 1]!; bSum += data[idx + 2]!;
    count++;
  };

  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < (i < 2 ? bbox.width : bbox.height); j += 3) {
      switch (i) {
        case 0: add(bbox.x + j, Math.max(0, bbox.y - pad)); break;
        case 1: add(bbox.x + j, Math.min(imgH - 1, bbox.y + bbox.height + pad)); break;
        case 2: add(Math.max(0, bbox.x - pad), bbox.y + j); break;
        case 3: add(Math.min(imgW - 1, bbox.x + bbox.width + pad), bbox.y + j); break;
      }
    }
  }

  return count === 0
    ? { r: 255, g: 255, b: 255 }
    : { r: Math.round(rSum / count), g: Math.round(gSum / count), b: Math.round(bSum / count) };
}
