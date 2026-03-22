import type { BBox } from '@/shared/types';

/** Laplace diffusion inpainting — fills a bounding box region from boundary pixels */
export function laplaceInpaint(imageData: ImageData, bbox: BBox): void {
  const { x, y, width: w, height: h } = bbox;
  const data = imageData.data;
  const imgW = imageData.width;
  const imgH = imageData.height;

  // Clamp to image bounds
  const x0 = Math.max(0, Math.floor(x));
  const y0 = Math.max(0, Math.floor(y));
  const x1 = Math.min(imgW, Math.ceil(x + w));
  const y1 = Math.min(imgH, Math.ceil(y + h));
  const rw = x1 - x0;
  const rh = y1 - y0;
  if (rw <= 0 || rh <= 0) return;

  // Extract boundary colors for seeding
  const rBuf = new Float32Array(rw * rh);
  const gBuf = new Float32Array(rw * rh);
  const bBuf = new Float32Array(rw * rh);
  const mask = new Uint8Array(rw * rh); // 1 = interior (to fill), 0 = boundary (fixed)

  // Initialize: copy existing pixels, mark interior
  for (let ry = 0; ry < rh; ry++) {
    for (let rx = 0; rx < rw; rx++) {
      const px = x0 + rx, py = y0 + ry;
      const srcIdx = (py * imgW + px) * 4;
      const bufIdx = ry * rw + rx;
      rBuf[bufIdx] = data[srcIdx]!;
      gBuf[bufIdx] = data[srcIdx + 1]!;
      bBuf[bufIdx] = data[srcIdx + 2]!;

      // Interior = not on the edge of the region
      if (rx > 0 && rx < rw - 1 && ry > 0 && ry < rh - 1) {
        mask[bufIdx] = 1;
      }
    }
  }

  // Iterative Laplace diffusion
  const iterations = Math.max(rw, rh) * 2;
  for (let iter = 0; iter < iterations; iter++) {
    for (let ry = 1; ry < rh - 1; ry++) {
      for (let rx = 1; rx < rw - 1; rx++) {
        const idx = ry * rw + rx;
        if (!mask[idx]) continue;
        const t = (ry - 1) * rw + rx;
        const b = (ry + 1) * rw + rx;
        const l = idx - 1;
        const r = idx + 1;
        rBuf[idx] = (rBuf[t]! + rBuf[b]! + rBuf[l]! + rBuf[r]!) / 4;
        gBuf[idx] = (gBuf[t]! + gBuf[b]! + gBuf[l]! + gBuf[r]!) / 4;
        bBuf[idx] = (bBuf[t]! + bBuf[b]! + bBuf[l]! + bBuf[r]!) / 4;
      }
    }
  }

  // Write back
  for (let ry = 0; ry < rh; ry++) {
    for (let rx = 0; rx < rw; rx++) {
      const bufIdx = ry * rw + rx;
      if (!mask[bufIdx]) continue;
      const dstIdx = ((y0 + ry) * imgW + (x0 + rx)) * 4;
      data[dstIdx] = Math.round(rBuf[bufIdx]!);
      data[dstIdx + 1] = Math.round(gBuf[bufIdx]!);
      data[dstIdx + 2] = Math.round(bBuf[bufIdx]!);
    }
  }
}
