import { describe, it, expect } from 'vitest';
import { laplaceInpaint } from '../services/laplaceInpaint';

describe('laplaceInpaint', () => {
  it('fills interior with boundary average for uniform boundary', () => {
    // 10x10 image, all white
    const img = new ImageData(10, 10);
    for (let i = 0; i < img.data.length; i += 4) {
      img.data[i] = 200; img.data[i + 1] = 200; img.data[i + 2] = 200; img.data[i + 3] = 255;
    }
    // Inpaint center region
    laplaceInpaint(img, { x: 2, y: 2, width: 6, height: 6 });
    // Interior pixels should be close to 200 (boundary color)
    const centerIdx = (5 * 10 + 5) * 4;
    expect(img.data[centerIdx]).toBeGreaterThan(190);
    expect(img.data[centerIdx]).toBeLessThan(210);
  });

  it('handles zero-size bbox gracefully', () => {
    const img = new ImageData(10, 10);
    expect(() => laplaceInpaint(img, { x: 5, y: 5, width: 0, height: 0 })).not.toThrow();
  });

  it('handles bbox at image edge', () => {
    const img = new ImageData(10, 10);
    for (let i = 0; i < img.data.length; i += 4) {
      img.data[i] = 128; img.data[i + 1] = 128; img.data[i + 2] = 128; img.data[i + 3] = 255;
    }
    expect(() => laplaceInpaint(img, { x: 0, y: 0, width: 10, height: 10 })).not.toThrow();
  });
});
