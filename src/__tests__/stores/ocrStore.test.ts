import { describe, it, expect, beforeEach } from 'vitest';
import { useOCRStore } from '@/stores/ocrStore';

describe('ocrStore', () => {
  beforeEach(() => {
    useOCRStore.setState({
      engineId: 'paddle-ocr',
      engineReady: false,
      engineLoadProgress: null,
      lamaReady: false,
      lamaLoadProgress: null,
      isProcessing: false,
      progressMessage: '',
      progressPercent: 0,
    });
  });

  it('defaults to paddle-ocr engine', () => {
    expect(useOCRStore.getState().engineId).toBe('paddle-ocr');
  });

  it('setEngineId changes engine and resets ready', () => {
    useOCRStore.getState().setEngineReady(true);
    useOCRStore.getState().setEngineId('tesseract');
    const s = useOCRStore.getState();
    expect(s.engineId).toBe('tesseract');
    expect(s.engineReady).toBe(false);
  });

  it('setEngineReady updates ready state', () => {
    useOCRStore.getState().setEngineReady(true);
    expect(useOCRStore.getState().engineReady).toBe(true);
  });

  it('setEngineLoadProgress updates progress message', () => {
    useOCRStore.getState().setEngineLoadProgress('Loading models...');
    expect(useOCRStore.getState().engineLoadProgress).toBe('Loading models...');
    useOCRStore.getState().setEngineLoadProgress(null);
    expect(useOCRStore.getState().engineLoadProgress).toBeNull();
  });

  it('setProcessing sets processing state and resets percent', () => {
    useOCRStore.getState().setProgress(50, 'halfway');
    useOCRStore.getState().setProcessing(true, 'Running OCR...');
    const s = useOCRStore.getState();
    expect(s.isProcessing).toBe(true);
    expect(s.progressMessage).toBe('Running OCR...');
    expect(s.progressPercent).toBe(0);
  });

  it('setProgress only increases percent (never decreases)', () => {
    useOCRStore.getState().setProgress(50, 'halfway');
    expect(useOCRStore.getState().progressPercent).toBe(50);
    useOCRStore.getState().setProgress(30, 'lower');
    expect(useOCRStore.getState().progressPercent).toBe(50); // stays at 50
    useOCRStore.getState().setProgress(80, 'higher');
    expect(useOCRStore.getState().progressPercent).toBe(80);
  });

  it('setProgress updates message when provided', () => {
    useOCRStore.getState().setProgress(10, 'page 1');
    expect(useOCRStore.getState().progressMessage).toBe('page 1');
    useOCRStore.getState().setProgress(20);
    expect(useOCRStore.getState().progressMessage).toBe('page 1'); // unchanged
  });

  it('setLamaReady updates lama state', () => {
    useOCRStore.getState().setLamaReady(true);
    expect(useOCRStore.getState().lamaReady).toBe(true);
  });

  it('setLamaLoadProgress updates lama progress', () => {
    useOCRStore.getState().setLamaLoadProgress('Initializing...');
    expect(useOCRStore.getState().lamaLoadProgress).toBe('Initializing...');
  });
});
