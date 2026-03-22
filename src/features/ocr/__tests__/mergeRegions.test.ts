import { describe, it, expect } from 'vitest';
import { mergeNearbyRegions } from '../services/mergeRegions';
import type { TextRegion } from '@/shared/types';

function makeRegion(id: string, x: number, y: number, w: number, h: number, text = 'text'): TextRegion {
  return {
    id, text,
    boundingBox: { x, y, width: w, height: h },
    fontSize: Math.round(h * 0.85),
    textColor: { r: 0, g: 0, b: 0 },
    confidence: 90,
    language: 'en',
  };
}

describe('mergeNearbyRegions', () => {
  it('returns empty for empty input', () => {
    expect(mergeNearbyRegions([])).toEqual([]);
  });

  it('returns single region unchanged', () => {
    const r = makeRegion('r1', 10, 10, 100, 20);
    const result = mergeNearbyRegions([r]);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('r1');
  });

  it('merges two regions on same row', () => {
    const r1 = makeRegion('r1', 10, 10, 50, 20, 'hello');
    const r2 = makeRegion('r2', 65, 10, 50, 20, 'world'); // same row, small horizontal gap
    const result = mergeNearbyRegions([r1, r2], true);
    expect(result).toHaveLength(1);
    expect(result[0]!.sourceIds).toContain('r1');
    expect(result[0]!.sourceIds).toContain('r2');
  });

  it('does not merge regions with very different font sizes', () => {
    const r1 = makeRegion('r1', 10, 10, 100, 20);
    const r2 = makeRegion('r2', 10, 35, 100, 50); // much taller = different font size
    const result = mergeNearbyRegions([r1, r2]);
    expect(result).toHaveLength(2);
  });

  it('does not merge distant regions', () => {
    const r1 = makeRegion('r1', 10, 10, 100, 20);
    const r2 = makeRegion('r2', 10, 200, 100, 20); // far apart
    const result = mergeNearbyRegions([r1, r2]);
    expect(result).toHaveLength(2);
  });

  it('sameRowOnly prevents cross-row merge', () => {
    const r1 = makeRegion('r1', 10, 10, 100, 20);
    const r2 = makeRegion('r2', 10, 32, 100, 20); // vertically stacked, small gap
    // sameRowOnly=true should NOT merge vertically stacked boxes
    const result = mergeNearbyRegions([r1, r2], true);
    expect(result).toHaveLength(2);
  });

  it('merges chain of overlapping regions', () => {
    const r1 = makeRegion('r1', 10, 10, 100, 20);
    const r2 = makeRegion('r2', 10, 28, 100, 20); // overlaps with r1
    const r3 = makeRegion('r3', 10, 46, 100, 20); // overlaps with r2
    const result = mergeNearbyRegions([r1, r2, r3]);
    expect(result).toHaveLength(1);
    expect(result[0]!.sourceIds).toHaveLength(3);
  });

  it('preserves lama inpaint mode if any child has it', () => {
    const r1 = makeRegion('r1', 10, 10, 100, 20);
    const r2 = { ...makeRegion('r2', 10, 28, 100, 20), inpaintMode: 'lama' as const };
    const result = mergeNearbyRegions([r1, r2]);
    expect(result[0]!.inpaintMode).toBe('lama');
  });
});
