import type { RGB, BBox } from '@/shared/types';

/** Estimate font size from bounding box height */
export function estimateFontSize(height: number): number {
  return Math.max(8, Math.round(height * 0.85));
}

/** Sample text color — matches original deckeditpro logic:
 *  1. Sample boundary ring to get average background color + luminance
 *  2. Sample 13 interior points near bbox center
 *  3. Return the interior pixel most different from background luminance
 */
export function sampleTextColor(imageData: ImageData, x: number, y: number, w: number, h: number): RGB {
  const data = imageData.data;
  const imgW = imageData.width;
  const imgH = imageData.height;

  function getPixel(px: number, py: number): RGB {
    const cx = Math.max(0, Math.min(imgW - 1, Math.round(px)));
    const cy = Math.max(0, Math.min(imgH - 1, Math.round(py)));
    const idx = (cy * imgW + cx) * 4;
    return { r: data[idx]!, g: data[idx + 1]!, b: data[idx + 2]! };
  }

  function lum(c: RGB): number {
    return c.r * 0.299 + c.g * 0.587 + c.b * 0.114;
  }

  // 1. Sample boundary ring (2px outside bbox)
  const ring = 2;
  const boundary: RGB[] = [];
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const px = x + w * i / steps;
    boundary.push(getPixel(px, y - ring));
    boundary.push(getPixel(px, y + h + ring));
  }
  for (let i = 1; i < steps; i++) {
    const py = y + h * i / steps;
    boundary.push(getPixel(x - ring, py));
    boundary.push(getPixel(x + w + ring, py));
  }

  // 2. Average boundary → background color + luminance
  let bgR = 0, bgG = 0, bgB = 0;
  for (const p of boundary) { bgR += p.r; bgG += p.g; bgB += p.b; }
  const n = boundary.length;
  const bgLum = lum({ r: Math.round(bgR / n), g: Math.round(bgG / n), b: Math.round(bgB / n) });

  // 3. Sample 13 interior points near center
  const cx = Math.round(x + w / 2);
  const cy = Math.round(y + h / 2);
  const offsets: [number, number][] = [
    [0, 0], [-2, -2], [2, -2], [-2, 2], [2, 2],
    [-4, 0], [4, 0], [0, -4], [0, 4],
    [Math.round(-w * 0.25), 0], [Math.round(w * 0.25), 0],
    [0, Math.round(-h * 0.25)], [0, Math.round(h * 0.25)],
  ];

  // 4. Pick the pixel most different from background luminance
  let bestR = 0, bestG = 0, bestB = 0, bestDist = -1;
  for (const [dx, dy] of offsets) {
    const p = getPixel(cx + dx, cy + dy);
    const dist = Math.abs(lum(p) - bgLum);
    if (dist > bestDist) {
      bestDist = dist;
      bestR = p.r; bestG = p.g; bestB = p.b;
    }
  }

  return { r: bestR, g: bestG, b: bestB };
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
