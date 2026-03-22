import { describe, it, expect } from 'vitest';
import { getAvailableEngines } from '../services/ocrManager';

describe('ocrManager', () => {
  describe('getAvailableEngines', () => {
    it('returns paddle-ocr and tesseract', () => {
      const engines = getAvailableEngines();
      expect(engines).toHaveLength(2);
      expect(engines.map(e => e.id)).toContain('paddle-ocr');
      expect(engines.map(e => e.id)).toContain('tesseract');
    });

    it('each engine has id, name, description', () => {
      for (const e of getAvailableEngines()) {
        expect(e.id).toBeTruthy();
        expect(e.name).toBeTruthy();
        expect(e.description).toBeTruthy();
      }
    });
  });
});
