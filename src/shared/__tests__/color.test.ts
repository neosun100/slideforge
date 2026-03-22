import { describe, it, expect } from 'vitest';
import { rgbToHex, hexToRgb, luminance } from '../utils/color';

describe('color utils', () => {
  describe('rgbToHex', () => {
    it('converts black', () => expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000'));
    it('converts white', () => expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#FFFFFF'));
    it('converts red', () => expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe('#FF0000'));
    it('clamps values', () => expect(rgbToHex({ r: 300, g: -1, b: 128 })).toBe('#FF0080'));
  });

  describe('hexToRgb', () => {
    it('parses #FF0000', () => expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 }));
    it('parses without hash', () => expect(hexToRgb('00ff00')).toEqual({ r: 0, g: 255, b: 0 }));
    it('returns null for invalid', () => expect(hexToRgb('xyz')).toBeNull());
    it('returns null for short hex', () => expect(hexToRgb('#FFF')).toBeNull());
  });

  describe('luminance', () => {
    it('black is 0', () => expect(luminance({ r: 0, g: 0, b: 0 })).toBe(0));
    it('white is 255', () => expect(luminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(255));
  });
});
