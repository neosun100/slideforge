import type { RGB } from '@/shared/types';

/** Convert pixels to inches (96 DPI) */
export function pxToInches(px: number): number {
  return px / 96;
}

/** Convert pixels to points (72 pt/inch at 96 DPI) */
export function pxToPoints(px: number): number {
  return px / 96 * 72;
}

/** Convert RGB to hex string for pptxgenjs (no # prefix) */
export function rgbToPptxHex(c: RGB): string {
  return [c.r, c.g, c.b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('').toUpperCase();
}
