import { describe, it, expect } from 'vitest';

describe('modelCache', () => {
  it('exports getCacheKey function', async () => {
    const mod = await import('../utils/modelCache');
    expect(typeof mod.getCacheKey).toBe('function');
  });

  it('getCacheKey returns versioned key for paddle-ocr-models', async () => {
    const { getCacheKey } = await import('../utils/modelCache');
    const key = getCacheKey('paddle-ocr-models');
    expect(key).toBe('paddle-ocr-models-v1');
  });

  it('getCacheKey returns versioned key for lama-model', async () => {
    const { getCacheKey } = await import('../utils/modelCache');
    const key = getCacheKey('lama-model');
    expect(key).toBe('lama-model-v1');
  });

  it('getCacheKey throws for unknown prefix', async () => {
    const { getCacheKey } = await import('../utils/modelCache');
    expect(() => getCacheKey('unknown')).toThrow('Unknown cache prefix');
  });

  it('exports cleanupOldCaches function', async () => {
    const mod = await import('../utils/modelCache');
    expect(typeof mod.cleanupOldCaches).toBe('function');
  });
});
