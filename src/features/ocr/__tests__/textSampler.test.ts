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
    it('detects dark text on white background', () => {
      // 30x30 white image with dark interior pixels in bbox (5,5,20,20)
      const img = new ImageData(30, 30);
      for (let i = 0; i < img.data.length; i += 4) {
        img.data[i] = 255; img.data[i + 1] = 255; img.data[i + 2] = 255; img.data[i + 3] = 255;
      }
      // Put dark pixels inside the bbox
      for (let y = 8; y < 22; y++) {
        for (let x = 8; x < 22; x++) {
          const idx = (y * 30 + x) * 4;
          img.data[idx] = 20; img.data[idx + 1] = 20; img.data[idx + 2] = 20;
        }
      }
      const color = sampleTextColor(img, 5, 5, 20, 20);
      // Should detect dark text
      expect(color.r).toBeLessThan(100);
    });

    it('detects white text on dark background', () => {
      // 30x30 dark image with white interior pixels
      const img = new ImageData(30, 30);
      for (let i = 0; i < img.data.length; i += 4) {
        img.data[i] = 10; img.data[i + 1] = 10; img.data[i + 2] = 20; img.data[i + 3] = 255;
      }
      // Put white pixels inside the bbox
      for (let y = 8; y < 22; y++) {
        for (let x = 8; x < 22; x++) {
          const idx = (y * 30 + x) * 4;
          img.data[idx] = 240; img.data[idx + 1] = 240; img.data[idx + 2] = 240;
        }
      }
      const color = sampleTextColor(img, 5, 5, 20, 20);
      // Should detect light text, not dark background
      expect(color.r).toBeGreaterThan(150);
    });

    it('returns fallback for empty bbox', () => {
      const img = new ImageData(1, 1);
      const color = sampleTextColor(img, 0, 0, 1, 1);
      expect(color).toBeDefined();
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
