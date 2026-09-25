/**
 * @file StructuredLogger.ts
 * @module infrastructure/logging
 * @description Production-oriented structured logger with privacy and security filters.
 */

import { ILogger, LogLevel, LogContext } from '../interfaces/ILogger.ts';

export class StructuredLogger implements ILogger {
  private moduleName: string;

  constructor(moduleName = 'QuranTeacherAI') {
    this.moduleName = moduleName;
  }

  private sanitize(context?: LogContext): LogContext {
    if (!context) return {};
    const sanitized = { ...context };
    
    // Privacy policy: Never log raw audio streams, audio buffers, or sensitive credentials
    for (const key of Object.keys(sanitized)) {
      if (/audio|buffer|password|token|secret/i.test(key)) {
        sanitized[key] = '[REDACTED_BY_SECURITY_POLICY]';
      }
    }
    return sanitized;
  }

  private emit(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    const payload = {
      timestamp: new Date().toISOString(),
      level,
      module: this.moduleName,
      message,
      context: this.sanitize(context),
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
    };

    const outputString = `[${payload.timestamp}] [${payload.level}] [${payload.module}]: ${payload.message}`;
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(outputString, payload.context);
        break;
      case LogLevel.INFO:
        console.info(outputString, payload.context);
        break;
      case LogLevel.WARN:
        console.warn(outputString, payload.context);
        break;
      case LogLevel.ERROR:
        console.error(outputString, payload.error || '', payload.context);
        break;
    }
  }

  debug(message: string, context?: LogContext): void {
    this.emit(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.emit(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.emit(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.emit(LogLevel.ERROR, message, context, error);
  }
}
