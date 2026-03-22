import { describe, it, expect } from 'vitest';

describe('imageLoader', () => {
  it('exports loadImageFile function', async () => {
    const mod = await import('../services/imageLoader');
    expect(typeof mod.loadImageFile).toBe('function');
  });
});
