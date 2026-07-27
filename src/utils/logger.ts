import type { LogLevel } from '../config/env.js';

interface LogData {
  message: string;
  [key: string]: unknown;
}
const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warning: 2, error: 3 };
const SENSITIVE = ['password', 'token', 'secret', 'key', 'authorization'];
let currentLevel: LogLevel = 'info';
function sanitize(value: unknown, key = ''): unknown {
  if (SENSITIVE.some((part) => key.toLowerCase().includes(part))) return '[REDACTED]';
  if (Array.isArray(value)) return value.map((entry) => sanitize(entry, key));
  if (value && typeof value === 'object') {
    if (value instanceof Error) return { name: value.name, message: value.message };
    return Object.fromEntries(
      Object.entries(value).map(([name, entry]) => [name, sanitize(entry, name)]),
    );
  }
  return value;
}
function write(level: LogLevel, scope: string, data: LogData): void {
  if (LEVELS[level] < LEVELS[currentLevel]) return;
  const { message, ...fields } = data;
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    scope,
    message,
    ...(sanitize(fields) as object),
  });
  if (level === 'error') console.error(line);
  else if (level === 'warning') console.warn(line);
  else if (level === 'debug') console.debug(line);
  else console.info(line);
}
export const logger = {
  setLevel(level: LogLevel): void {
    currentLevel = level;
  },
  debug(scope: string, data: LogData): void {
    write('debug', scope, data);
  },
  info(scope: string, data: LogData): void {
    write('info', scope, data);
  },
  warning(scope: string, data: LogData): void {
    write('warning', scope, data);
  },
  error(scope: string, data: LogData): void {
    write('error', scope, data);
  },
};
export const sharedLogger = logger;
