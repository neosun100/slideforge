import type { TextRegion } from '@/shared/types';

const MERGE_GAP = 30;

/** Union-Find merge of nearby text regions */
export function mergeNearbyRegions(regions: TextRegion[], sameRowOnly = false): TextRegion[] {
  if (regions.length <= 1) return regions;

  const parent = regions.map((_, i) => i);
  function find(i: number): number {
    while (parent[i] !== i) { parent[i] = parent[parent[i]!]!; i = parent[i]!; }
    return i;
  }
  function union(a: number, b: number) { parent[find(a)] = find(b); }

  for (let i = 0; i < regions.length; i++) {
    for (let j = i + 1; j < regions.length; j++) {
      if (shouldMerge(regions[i]!, regions[j]!, sameRowOnly)) {
        union(i, j);
      }
    }
  }

  // Group by root
  const groups = new Map<number, number[]>();
  for (let i = 0; i < regions.length; i++) {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(i);
  }

  // Build merged regions
  const result: TextRegion[] = [];
  for (const indices of groups.values()) {
    if (indices.length === 1) {
      result.push(regions[indices[0]!]!);
      continue;
    }

    // Sort by position
    indices.sort((a, b) => {
      const dy = regions[a]!.boundingBox.y - regions[b]!.boundingBox.y;
      return Math.abs(dy) > 5 ? dy : regions[a]!.boundingBox.x - regions[b]!.boundingBox.x;
    });

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let maxFontSize = 0, totalConf = 0;
    const texts: string[] = [];
    const sourceIds: string[] = [];
    let bestColor = regions[indices[0]!]!.textColor;
    let bestArea = 0;
    let hasLama = false;

    for (const idx of indices) {
      const r = regions[idx]!;
      const bb = r.boundingBox;
      minX = Math.min(minX, bb.x);
      minY = Math.min(minY, bb.y);
      maxX = Math.max(maxX, bb.x + bb.width);
      maxY = Math.max(maxY, bb.y + bb.height);
      maxFontSize = Math.max(maxFontSize, r.fontSize);
      totalConf += r.confidence;
      texts.push(r.text);
      sourceIds.push(r.id);
      const area = bb.width * bb.height;
      if (area > bestArea) { bestArea = area; bestColor = r.textColor; }
      if (r.inpaintMode === 'lama') hasLama = true;
    }

    result.push({
      id: `merged-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text: texts.join(sameRowOnly ? ' ' : '\n'),
      boundingBox: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
      fontSize: maxFontSize,
      textColor: bestColor,
      confidence: totalConf / indices.length,
      language: regions[indices[0]!]!.language,
      sourceIds,
      inpaintMode: hasLama ? 'lama' : regions[indices[0]!]!.inpaintMode ?? 'laplace',
    });
  }

  return result;
}

function shouldMerge(a: TextRegion, b: TextRegion, sameRowOnly: boolean): boolean {
  const avgFontSize = (a.fontSize + b.fontSize) / 2;
  if (Math.max(a.fontSize, b.fontSize) / Math.max(1, Math.min(a.fontSize, b.fontSize)) > 1.5) return false;

  const aBox = a.boundingBox, bBox = b.boundingBox;

  // Same row check: vertical overlap + small horizontal gap
  const vOverlap = Math.min(aBox.y + aBox.height, bBox.y + bBox.height) - Math.max(aBox.y, bBox.y);
  const minH = Math.min(aBox.height, bBox.height);
  const vRatio = minH > 0 ? vOverlap / minH : 0;
  const hGap = Math.max(0, Math.max(aBox.x, bBox.x) - Math.min(aBox.x + aBox.width, bBox.x + bBox.width));
  const maxHGap = Math.min(MERGE_GAP, avgFontSize * 0.5);

  if (vRatio > 0.5 && hGap < maxHGap) return true;

  if (sameRowOnly) return false;

  // Cross-row: high horizontal overlap + small vertical gap
  const hOverlap = Math.min(aBox.x + aBox.width, bBox.x + bBox.width) - Math.max(aBox.x, bBox.x);
  const minW = Math.min(aBox.width, bBox.width);
  const hRatio = minW > 0 ? hOverlap / minW : 0;
  const vGap = Math.max(0, Math.max(aBox.y, bBox.y) - Math.min(aBox.y + aBox.height, bBox.y + bBox.height));
  const maxVGap = Math.min(MERGE_GAP, avgFontSize * 0.4);

  return hRatio > 0.7 && vGap < maxVGap;
}
