/**
 * @file AppError.ts
 * @module infrastructure/errors
 * @description Standardized error hierarchy for domain, religious data integrity,
 * verification failures, and infrastructure errors.
 */

export class AppError extends Error {
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, unknown>;

  constructor(message: string, code: string, isOperational = true, context?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.isOperational = isOperational;
    this.context = context;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when an invariant in the religious data (Quran text, verification stamp, Riwayah) is breached
 */
export class ReligiousDataIntegrityError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'RELIGIOUS_DATA_INTEGRITY_VIOLATION', false, context);
  }
}

/**
 * Thrown when an invalid domain state transition or parameter is passed
 */
export class DomainValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'DOMAIN_VALIDATION_ERROR', true, context);
  }
}

/**
 * Thrown when an external provider (AI, Audio Engine, Database) fails
 */
export class ProviderUnavailableError extends AppError {
  constructor(providerName: string, originalMessage: string) {
    super(`Provider [${providerName}] is unavailable: ${originalMessage}`, 'PROVIDER_UNAVAILABLE', true);
  }
}
