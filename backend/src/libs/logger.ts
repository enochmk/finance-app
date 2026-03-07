import 'winston-daily-rotate-file';
import rtracer from 'cls-rtracer';
import winston, { format } from 'winston';

import '../env';

const dirname = process.env.LOG_DIRECTORY ?? 'logs';
const LEVEL = process.env.LOG_LEVEL ?? 'debug';
const DATE_PATTERN = process.env.LOG_DATE_PATTERN ?? 'YYYYMMDD';
const CONSOLE_LEVEL = process.env.LOG_CONSOLE_LEVEL ?? 'debug';

function normalizeEnv(env: string | undefined): string {
  if (!env) return '';
  const lower = env.toLowerCase();
  if (lower === 'development') return 'dev';
  if (lower === 'production') return 'prod';
  return lower;
}

export function sanitizeSensitiveInfo(
  body: Record<string, unknown>
): Record<string, unknown> | unknown[] {
  const sensitiveFields = [
    'password',
    'confirm-password',
    'token',
    'pin',
    'ssn',
    'authorization',
  ];
  function redact(
    obj: Record<string, unknown>
  ): Record<string, unknown> | unknown[] {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    const redactedObj: Record<string, unknown> | unknown[] = Array.isArray(obj)
      ? []
      : {};
    return redactedObj;
  }
  return redact(body);
}

const formatter = {
  file: format.printf((log: any): string => {
    const requestId = rtracer.id() as string;
    const { message, level, timestamp, label, ...rest } = log;

    return JSON.stringify({
      timestamp,
      requestId,
      level,
      label,
      message,
      metadata: sanitizeSensitiveInfo(rest),
    });
  }),
  console: format.printf((log: any): string => {
    const requestId = rtracer.id() as string;
    const { timestamp, level, message, label, ...rest } = log;
    const sanitizeInfo = sanitizeSensitiveInfo(rest);
    const restInfo = Object.keys(rest).length
      ? JSON.stringify(sanitizeInfo)
      : '';

    const env = normalizeEnv(process.env.NODE_ENV);
    const reqShort = requestId ? requestId.slice(0, 8) : '';
    const lvl = `[${(level ?? '').toUpperCase().padEnd(5)}]`;

    const parts = [
      String(timestamp ?? ''),
      lvl,
      env,
      reqShort ? `req=${reqShort}` : '',
      label ? String(label) : '',
      String(message ?? ''),
      restInfo,
    ].filter(Boolean);

    return parts.join('  ');
  }),
};

const transporter = {
  file: new winston.transports.DailyRotateFile({
    level: LEVEL,
    dirname,
    datePattern: DATE_PATTERN,
    filename: '%DATE%.log',
    format: winston.format.combine(formatter.file),
  }),
  console: new winston.transports.Console({
    level: CONSOLE_LEVEL,
    format: winston.format.combine(
      formatter.console,
      winston.format.colorize({ all: true })
    ),
  }),
};

const logger = winston.createLogger({
  transports: [transporter.console, transporter.file],
  levels: winston.config.npm.levels,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true })
  ),
});

export const getLogger = (label: string, service?: string) => {
  const childLogger = logger.child({ label });
  if (service) {
    childLogger.defaultMeta = { ...childLogger.defaultMeta, service };
  }
  return childLogger;
};

export default logger;
