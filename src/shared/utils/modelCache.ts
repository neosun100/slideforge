/**
 * Model cache version manager.
 * Ensures old model caches are cleaned up when versions change.
 */
import { createLogger } from './logger';

const log = createLogger('model-cache');

/** All known cache prefixes and their current versions */
const CACHE_VERSIONS: Record<string, string> = {
  'paddle-ocr-models': 'v1',
  'lama-model': 'v1',
};

/** Build the full cache key for a given prefix */
export function getCacheKey(prefix: string): string {
  const version = CACHE_VERSIONS[prefix];
  if (!version) throw new Error(`Unknown cache prefix: ${prefix}`);
  return `${prefix}-${version}`;
}

/** Clean up old cache versions that don't match current versions */
export async function cleanupOldCaches(): Promise<number> {
  if (typeof caches === 'undefined') return 0;

  const validKeys = new Set(Object.entries(CACHE_VERSIONS).map(([p, v]) => `${p}-${v}`));
  const allKeys = await caches.keys();
  let cleaned = 0;

  for (const key of allKeys) {
    // Check if this cache belongs to our model caches
    const isOurs = Object.keys(CACHE_VERSIONS).some(prefix => key.startsWith(prefix));
    if (isOurs && !validKeys.has(key)) {
      await caches.delete(key);
      log.info(`Cleaned old cache: ${key}`);
      cleaned++;
    }
  }

  if (cleaned > 0) log.info(`Cleaned ${cleaned} old cache(s)`);
  return cleaned;
}
