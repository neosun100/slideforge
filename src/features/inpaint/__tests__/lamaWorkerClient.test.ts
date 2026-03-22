import { describe, it, expect } from 'vitest';

describe('lamaWorkerClient', () => {
  it('exports preloadLama function', async () => {
    const mod = await import('../workers/lamaWorkerClient');
    expect(typeof mod.preloadLama).toBe('function');
  });

  it('exports lamaInpaintRegion function', async () => {
    const mod = await import('../workers/lamaWorkerClient');
    expect(typeof mod.lamaInpaintRegion).toBe('function');
  });

  it('exports terminateLamaWorker function', async () => {
    const mod = await import('../workers/lamaWorkerClient');
    expect(typeof mod.terminateLamaWorker).toBe('function');
  });

  it('exports isLamaWorkerAvailable function', async () => {
    const mod = await import('../workers/lamaWorkerClient');
    expect(typeof mod.isLamaWorkerAvailable).toBe('function');
  });
});
