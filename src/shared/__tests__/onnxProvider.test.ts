import { describe, it, expect } from 'vitest';

describe('onnxProvider', () => {
  it('exports detectWebGPU function', async () => {
    const mod = await import('../utils/onnxProvider');
    expect(typeof mod.detectWebGPU).toBe('function');
  });

  it('exports getBestProvider function', async () => {
    const mod = await import('../utils/onnxProvider');
    expect(typeof mod.getBestProvider).toBe('function');
  });

  it('exports getExecutionProviders function', async () => {
    const mod = await import('../utils/onnxProvider');
    expect(typeof mod.getExecutionProviders).toBe('function');
  });

  it('detectWebGPU returns false in test environment (no navigator.gpu)', async () => {
    const mod = await import('../utils/onnxProvider');
    const result = await mod.detectWebGPU();
    expect(result).toBe(false);
  });

  it('getExecutionProviders returns wasm when no WebGPU', async () => {
    const mod = await import('../utils/onnxProvider');
    const eps = await mod.getExecutionProviders();
    expect(eps).toContain('wasm');
  });
});
