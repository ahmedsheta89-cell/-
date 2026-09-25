/**
 * @file ILogger.ts
 * @module infrastructure/interfaces
 * @description Structured logging interface with privacy-first masking of sensitive audio and PII.
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogContext {
  module?: string;
  sessionId?: string;
  studentId?: string;
  correlationId?: string;
  [key: string]: unknown;
}

export interface ILogger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: Error, context?: LogContext): void;
}
