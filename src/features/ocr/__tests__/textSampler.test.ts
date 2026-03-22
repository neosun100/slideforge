import { describe, it, expect } from 'vitest';
import { estimateFontSize, sampleTextColor, sampleBackgroundColor } from '../services/textSampler';

describe('textSampler', () => {
  describe('estimateFontSize', () => {
    it('returns 85% of height', () => {
      expect(estimateFontSize(20)).toBe(17);
    });
    it('minimum is 8', () => {
      expect(estimateFontSize(5)).toBe(8);
    });
    it('rounds to integer', () => {
      expect(estimateFontSize(15)).toBe(13);
    });
  });

  describe('sampleTextColor', () => {
    it('returns darkest boundary pixel', () => {
      // Create 20x20 white image with a dark pixel at boundary
      const img = new ImageData(20, 20);
      // Fill white
      for (let i = 0; i < img.data.length; i += 4) {
        img.data[i] = 255; img.data[i + 1] = 255; img.data[i + 2] = 255; img.data[i + 3] = 255;
      }
      // Put dark pixel at (5, 2) which is in the boundary ring of bbox (3,5,10,10)
      const idx = (2 * 20 + 5) * 4;
      img.data[idx] = 10; img.data[idx + 1] = 10; img.data[idx + 2] = 10;

      const color = sampleTextColor(img, 3, 5, 10, 10);
      // Should find a dark-ish color from boundary sampling
      expect(color.r).toBeLessThan(256);
    });

    it('returns black for empty image data', () => {
      const img = new ImageData(1, 1);
      const color = sampleTextColor(img, 0, 0, 1, 1);
      expect(color).toEqual({ r: 0, g: 0, b: 0 });
    });
  });

  describe('sampleBackgroundColor', () => {
    it('returns white for all-white image', () => {
      const img = new ImageData(50, 50);
      for (let i = 0; i < img.data.length; i += 4) {
        img.data[i] = 255; img.data[i + 1] = 255; img.data[i + 2] = 255; img.data[i + 3] = 255;
      }
      const bg = sampleBackgroundColor(img, { x: 10, y: 10, width: 20, height: 20 });
      expect(bg.r).toBe(255);
      expect(bg.g).toBe(255);
      expect(bg.b).toBe(255);
    });
  });
});
