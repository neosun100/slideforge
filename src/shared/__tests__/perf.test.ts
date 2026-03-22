import { describe, it, expect } from 'vitest';
import { perfMark, perfEnd } from '../utils/perf';

describe('perf', () => {
  it('perfMark returns a number', () => {
    const t = perfMark('test');
    expect(typeof t).toBe('number');
    expect(t).toBeGreaterThan(0);
  });

  it('perfEnd returns positive duration', () => {
    const start = perfMark('test');
    const dur = perfEnd('test', start);
    expect(dur).toBeGreaterThanOrEqual(0);
  });

  it('perfEnd duration is reasonable', async () => {
    const start = perfMark('test');
    await new Promise(r => setTimeout(r, 10));
    const dur = perfEnd('test', start);
    expect(dur).toBeGreaterThanOrEqual(5); // at least ~5ms
  });
});
