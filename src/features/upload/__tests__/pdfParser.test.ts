import { describe, it, expect } from 'vitest';
import { isPdfByMagicBytes } from '../services/pdfParser';

describe('pdfParser', () => {
  describe('isPdfByMagicBytes', () => {
    it('returns true for valid PDF header', async () => {
      const file = new File(['%PDF-1.4 test content'], 'test.pdf');
      expect(await isPdfByMagicBytes(file)).toBe(true);
    });

    it('returns false for non-PDF content', async () => {
      const file = new File(['not a pdf file'], 'test.pdf');
      expect(await isPdfByMagicBytes(file)).toBe(false);
    });

    it('returns false for empty file', async () => {
      const file = new File([], 'empty.pdf');
      expect(await isPdfByMagicBytes(file)).toBe(false);
    });

    it('returns false for short file', async () => {
      const file = new File(['%P'], 'short.pdf');
      expect(await isPdfByMagicBytes(file)).toBe(false);
    });
  });
});
