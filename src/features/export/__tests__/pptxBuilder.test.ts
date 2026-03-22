import { describe, it, expect } from 'vitest';
import { pxToInches, pxToPoints, rgbToPptxHex } from '../services/pptxBuilder';

describe('pptxBuilder', () => {
  describe('pxToInches', () => {
    it('converts 96px to 1 inch', () => expect(pxToInches(96)).toBe(1));
    it('converts 0 to 0', () => expect(pxToInches(0)).toBe(0));
    it('converts 48 to 0.5', () => expect(pxToInches(48)).toBe(0.5));
  });

  describe('pxToPoints', () => {
    it('converts 96px to 72pt', () => expect(pxToPoints(96)).toBe(72));
    it('converts 0 to 0', () => expect(pxToPoints(0)).toBe(0));
  });

  describe('rgbToPptxHex', () => {
    it('converts black', () => expect(rgbToPptxHex({ r: 0, g: 0, b: 0 })).toBe('000000'));
    it('converts white', () => expect(rgbToPptxHex({ r: 255, g: 255, b: 255 })).toBe('FFFFFF'));
    it('converts red', () => expect(rgbToPptxHex({ r: 255, g: 0, b: 0 })).toBe('FF0000'));
    it('clamps out of range', () => expect(rgbToPptxHex({ r: 300, g: -5, b: 128 })).toBe('FF0080'));
  });
});
