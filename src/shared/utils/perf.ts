import { createLogger } from './logger';

const log = createLogger('perf');

export function perfMark(_label: string): number {
  return performance.now();
}

export function perfEnd(label: string, start: number): number {
  const duration = performance.now() - start;
  log.perf(label, start);
  return duration;
}
