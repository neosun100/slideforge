import { describe, it, expect } from 'vitest';

// We can't easily test the full exportToPPTX (needs PptxGenJS + canvas),
// but we can test the helper functions and verify the module exports correctly.

describe('exportService', () => {
  it('exports exportToPPTX function', async () => {
    const mod = await import('../services/exportService');
    expect(typeof mod.exportToPPTX).toBe('function');
  });

  it('exportToPPTX requires slides array', async () => {
    const { exportToPPTX } = await import('../services/exportService');
    // Empty slides should complete without error
    const progress: Array<{ pct: number; msg: string }> = [];
    await exportToPPTX([], { width: 13.333, height: 7.5, backgroundFormat: 'jpeg', jpegQuality: 0.85 }, (pct, msg) => {
      progress.push({ pct, msg });
    });
    // Should have called progress at least once
    expect(progress.length).toBeGreaterThan(0);
  });
});
