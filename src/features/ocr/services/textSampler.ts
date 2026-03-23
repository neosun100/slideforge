import type { RGB, BBox } from '@/shared/types';
import { luminance } from '@/shared/utils/color';

/** Estimate font size from bounding box height */
export function estimateFontSize(height: number): number {
  return Math.max(8, Math.round(height * 0.85));
}

/** Sample text color by finding the dominant foreground color inside the bbox */
export function sampleTextColor(imageData: ImageData, x: number, y: number, w: number, h: number): RGB {
  const data = imageData.data;
  const imgW = imageData.width;
  const imgH = imageData.height;

  // First, sample background from boundary ring
  const bgSamples: RGB[] = [];
  const ring = 3;
  const sampleBg = (px: number, py: number) => {
    const cx = Math.max(0, Math.min(imgW - 1, Math.round(px)));
    const cy = Math.max(0, Math.min(imgH - 1, Math.round(py)));
    const idx = (cy * imgW + cx) * 4;
    bgSamples.push({ r: data[idx]!, g: data[idx + 1]!, b: data[idx + 2]! });
  };
  for (let i = 0; i <= 6; i++) {
    const px = x + w * i / 6;
    sampleBg(px, y - ring);
    sampleBg(px, y + h + ring);
  }
  let bgR = 0, bgG = 0, bgB = 0;
  for (const s of bgSamples) { bgR += s.r; bgG += s.g; bgB += s.b; }
  const n = bgSamples.length || 1;
  const bg: RGB = { r: Math.round(bgR / n), g: Math.round(bgG / n), b: Math.round(bgB / n) };
  const bgLum = luminance(bg);

  // Then, sample interior pixels and find the one most different from background
  const interior: { r: number; g: number; b: number; dist: number }[] = [];
  const stepX = Math.max(1, Math.floor(w / 10));
  const stepY = Math.max(1, Math.floor(h / 5));
  for (let py = y + 1; py < y + h - 1; py += stepY) {
    for (let px = x + 1; px < x + w - 1; px += stepX) {
      const cx = Math.max(0, Math.min(imgW - 1, Math.round(px)));
      const cy = Math.max(0, Math.min(imgH - 1, Math.round(py)));
      const idx = (cy * imgW + cx) * 4;
      const r = data[idx]!, g = data[idx + 1]!, b = data[idx + 2]!;
      const lum = luminance({ r, g, b });
      const dist = Math.abs(lum - bgLum);
      interior.push({ r, g, b, dist });
    }
  }

  if (interior.length === 0) {
    // Fallback: if bg is dark, text is white; if bg is light, text is black
    return bgLum < 0.5 ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 };
  }

  // Sort by distance from background, take top 30% most different pixels
  interior.sort((a, b) => b.dist - a.dist);
  const topN = Math.max(1, Math.floor(interior.length * 0.3));
  let rSum = 0, gSum = 0, bSum = 0;
  for (let i = 0; i < topN; i++) {
    rSum += interior[i]!.r; gSum += interior[i]!.g; bSum += interior[i]!.b;
  }
  return { r: Math.round(rSum / topN), g: Math.round(gSum / topN), b: Math.round(bSum / topN) };
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
