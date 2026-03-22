import { describe, it, expect } from 'vitest';
import {
  validateFileSize,
  validateFileFormat,
  validatePageCount,
  validateFile,
  getFileExtension,
  isPdfFile,
  isImageFile,
  isSupportedFormat,
  getSupportedFormatsString,
  MAX_FILE_SIZE,
  MAX_PAGE_COUNT,
} from '../services/fileValidator';

describe('fileValidator', () => {
  describe('getFileExtension', () => {
    it('returns extension for normal file', () => {
      expect(getFileExtension('test.pdf')).toBe('pdf');
    });
    it('returns lowercase', () => {
      expect(getFileExtension('test.PDF')).toBe('pdf');
    });
    it('returns empty for no extension', () => {
      expect(getFileExtension('noext')).toBe('');
    });
    it('returns empty for trailing dot', () => {
      expect(getFileExtension('file.')).toBe('');
    });
    it('handles multiple dots', () => {
      expect(getFileExtension('my.file.png')).toBe('png');
    });
  });

  describe('isSupportedFormat', () => {
    it('accepts pdf', () => expect(isSupportedFormat('pdf')).toBe(true));
    it('accepts png', () => expect(isSupportedFormat('png')).toBe(true));
    it('accepts jpg', () => expect(isSupportedFormat('jpg')).toBe(true));
    it('accepts jpeg', () => expect(isSupportedFormat('jpeg')).toBe(true));
    it('accepts webp', () => expect(isSupportedFormat('webp')).toBe(true));
    it('rejects doc', () => expect(isSupportedFormat('doc')).toBe(false));
    it('rejects empty', () => expect(isSupportedFormat('')).toBe(false));
  });

  describe('isPdfFile', () => {
    it('true for .pdf', () => expect(isPdfFile('test.pdf')).toBe(true));
    it('false for .png', () => expect(isPdfFile('test.png')).toBe(false));
  });

  describe('isImageFile', () => {
    it('true for .png', () => expect(isImageFile('a.png')).toBe(true));
    it('true for .jpg', () => expect(isImageFile('a.jpg')).toBe(true));
    it('true for .webp', () => expect(isImageFile('a.webp')).toBe(true));
    it('false for .pdf', () => expect(isImageFile('a.pdf')).toBe(false));
  });

  describe('validateFileSize', () => {
    it('accepts 0 bytes', () => {
      expect(validateFileSize(0)).toEqual({ valid: true });
    });
    it('accepts under limit', () => {
      expect(validateFileSize(1024)).toEqual({ valid: true });
    });
    it('accepts exactly at limit', () => {
      expect(validateFileSize(MAX_FILE_SIZE)).toEqual({ valid: true });
    });
    it('rejects over limit', () => {
      const r = validateFileSize(MAX_FILE_SIZE + 1);
      expect(r.valid).toBe(false);
    });
  });

  describe('validateFileFormat', () => {
    it('accepts test.pdf', () => {
      expect(validateFileFormat('test.pdf')).toEqual({ valid: true });
    });
    it('rejects test.doc', () => {
      const r = validateFileFormat('test.doc');
      expect(r.valid).toBe(false);
    });
    it('rejects no extension', () => {
      const r = validateFileFormat('noext');
      expect(r.valid).toBe(false);
    });
  });

  describe('validatePageCount', () => {
    it('accepts 1 page', () => {
      expect(validatePageCount(1)).toEqual({ valid: true });
    });
    it('accepts max pages', () => {
      expect(validatePageCount(MAX_PAGE_COUNT)).toEqual({ valid: true });
    });
    it('rejects over max', () => {
      const r = validatePageCount(MAX_PAGE_COUNT + 1);
      expect(r.valid).toBe(false);
    });
  });

  describe('validateFile', () => {
    it('accepts valid pdf', () => {
      expect(validateFile({ name: 'test.pdf', size: 1024 })).toEqual({ valid: true });
    });
    it('rejects too large', () => {
      const r = validateFile({ name: 'test.pdf', size: MAX_FILE_SIZE + 1 });
      expect(r.valid).toBe(false);
    });
    it('rejects bad format', () => {
      const r = validateFile({ name: 'test.doc', size: 1024 });
      expect(r.valid).toBe(false);
    });
  });

  describe('getSupportedFormatsString', () => {
    it('returns comma-separated uppercase', () => {
      const s = getSupportedFormatsString();
      expect(s).toContain('PDF');
      expect(s).toContain('PNG');
    });
  });
});
