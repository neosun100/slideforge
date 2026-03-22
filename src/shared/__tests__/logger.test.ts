import { describe, it, expect, beforeEach } from 'vitest';
import { createLogger, getLogHistory, clearLogHistory, LogLevel } from '../utils/logger';

describe('logger', () => {
  beforeEach(() => clearLogHistory());

  it('creates a logger with module name', () => {
    const log = createLogger('test');
    expect(log).toBeDefined();
    expect(typeof log.info).toBe('function');
  });

  it('records log entries in history', () => {
    const log = createLogger('mod');
    log.info('hello');
    const history = getLogHistory();
    expect(history.length).toBe(1);
    expect(history[0]!.module).toBe('mod');
    expect(history[0]!.message).toBe('hello');
    expect(history[0]!.level).toBe(LogLevel.INFO);
  });

  it('records data in log entry', () => {
    const log = createLogger('mod');
    log.warn('oops', { code: 42 });
    expect(getLogHistory()[0]!.data).toEqual({ code: 42 });
  });

  it('perf records duration', () => {
    const log = createLogger('mod');
    const start = performance.now() - 100;
    log.perf('done', start);
    const entry = getLogHistory()[0]!;
    expect(entry.duration).toBeGreaterThanOrEqual(90);
  });

  it('clearLogHistory empties history', () => {
    const log = createLogger('mod');
    log.info('a');
    log.info('b');
    clearLogHistory();
    expect(getLogHistory().length).toBe(0);
  });
});
