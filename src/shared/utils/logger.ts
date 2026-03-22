export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  module: string;
  message: string;
  data?: unknown;
  duration?: number;
}

const LOG_HISTORY: LogEntry[] = [];
const MAX_HISTORY = 500;
let globalLevel: LogLevel = LogLevel.DEBUG;

function formatDuration(ms: number): string {
  return ms < 1000 ? `${ms.toFixed(1)}ms` : `${(ms / 1000).toFixed(2)}s`;
}

function emit(entry: LogEntry) {
  LOG_HISTORY.push(entry);
  if (LOG_HISTORY.length > MAX_HISTORY) LOG_HISTORY.shift();

  if (entry.level < globalLevel) return;

  const prefix = `[${entry.module}]`;
  const dur = entry.duration != null ? ` (${formatDuration(entry.duration)})` : '';
  const msg = `${prefix} ${entry.message}${dur}`;

  switch (entry.level) {
    case LogLevel.DEBUG: console.debug(msg, entry.data ?? ''); break;
    case LogLevel.INFO:  console.log(msg, entry.data ?? '');   break;
    case LogLevel.WARN:  console.warn(msg, entry.data ?? '');  break;
    case LogLevel.ERROR: console.error(msg, entry.data ?? ''); break;
  }
}

export interface Logger {
  debug(message: string, data?: unknown): void;
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, data?: unknown): void;
  perf(message: string, startTime: number, data?: unknown): void;
}

export function createLogger(module: string): Logger {
  const log = (level: LogLevel, message: string, data?: unknown, duration?: number) => {
    emit({ timestamp: Date.now(), level, module, message, data, duration });
  };

  return {
    debug: (msg, data) => log(LogLevel.DEBUG, msg, data),
    info:  (msg, data) => log(LogLevel.INFO, msg, data),
    warn:  (msg, data) => log(LogLevel.WARN, msg, data),
    error: (msg, data) => log(LogLevel.ERROR, msg, data),
    perf:  (msg, start, data) => log(LogLevel.INFO, msg, data, performance.now() - start),
  };
}

export function setLogLevel(level: LogLevel) { globalLevel = level; }
export function getLogHistory(): readonly LogEntry[] { return LOG_HISTORY; }
export function clearLogHistory() { LOG_HISTORY.length = 0; }
