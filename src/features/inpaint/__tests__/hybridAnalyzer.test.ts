import { describe, it, expect } from 'vitest';
import { analyzeInpaintMode } from '../services/hybridAnalyzer';

describe('hybridAnalyzer', () => {
  it('returns laplace for uniform boundary', () => {
    const img = new ImageData(50, 50);
    // Fill with uniform color
    for (let i = 0; i < img.data.length; i += 4) {
      img.data[i] = 128; img.data[i + 1] = 128; img.data[i + 2] = 128; img.data[i + 3] = 255;
    }
    expect(analyzeInpaintMode(img, { x: 10, y: 10, width: 20, height: 20 })).toBe('laplace');
  });

  it('returns lama for high-variance boundary', () => {
    const img = new ImageData(50, 50);
    // Fill with alternating colors to create high variance
    for (let y = 0; y < 50; y++) {
      for (let x = 0; x < 50; x++) {
        const idx = (y * 50 + x) * 4;
        const v = (x + y) % 2 === 0 ? 0 : 255;
        img.data[idx] = v; img.data[idx + 1] = v; img.data[idx + 2] = v; img.data[idx + 3] = 255;
      }
    }
    expect(analyzeInpaintMode(img, { x: 10, y: 10, width: 20, height: 20 })).toBe('lama');
  });

  it('returns laplace for empty image', () => {
    const img = new ImageData(10, 10);
    expect(analyzeInpaintMode(img, { x: 2, y: 2, width: 5, height: 5 })).toBe('laplace');
  });
});
