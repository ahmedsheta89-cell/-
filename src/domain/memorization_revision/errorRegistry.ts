/**
 * @file errorRegistry.ts
 * @module domain/memorization_revision
 * @description Centralized Error Registry for Phase 7D Memorization & Revision Intelligence (Part 41).
 */

import { MemorizationErrorCode } from './types.ts';

export class MemorizationError extends Error {
  public readonly code: MemorizationErrorCode;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: number;

  constructor(code: MemorizationErrorCode, message: string, context?: Record<string, unknown>) {
    super(`[${code}] ${message}`);
    this.name = 'MemorizationError';
    this.code = code;
    this.context = context;
    this.timestamp = Date.now();
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InvalidLearningEventError extends MemorizationError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(MemorizationErrorCode.INVALID_LEARNING_EVENT, message, context);
  }
}

export class DuplicateLearningEventError extends MemorizationError {
  constructor(eventId: string, context?: Record<string, unknown>) {
    super(
      MemorizationErrorCode.DUPLICATE_LEARNING_EVENT,
      `Event ${eventId} has already been recorded or replayed. Duplicate rejected to prevent mastery inflation.`,
      context
    );
  }
}

export class OutOfOrderEventError extends MemorizationError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(MemorizationErrorCode.OUT_OF_ORDER_EVENT, message, context);
  }
}

export class InvalidQuranLocationError extends MemorizationError {
  constructor(surahId: number, ayahNumber: number, context?: Record<string, unknown>) {
    super(
      MemorizationErrorCode.INVALID_QURAN_LOCATION,
      `Invalid canonical Quran coordinate: Surah ${surahId}, Ayah ${ayahNumber} does not exist in Hafs canon.`,
      context
    );
  }
}

export class VersionMismatchError extends MemorizationError {
  constructor(expectedVersion: string, providedVersion: string, context?: Record<string, unknown>) {
    super(
      MemorizationErrorCode.VERSION_MISMATCH,
      `Integrity version mismatch: expected ${expectedVersion}, received ${providedVersion}`,
      context
    );
  }
}

export class StateTransitionRejectedError extends MemorizationError {
  constructor(fromState: string, toState: string, reason: string, context?: Record<string, unknown>) {
    super(
      MemorizationErrorCode.STATE_TRANSITION_REJECTED,
      `State transition from ${fromState} to ${toState} rejected: ${reason}`,
      context
    );
  }
}

export class RevisionPlanInvalidError extends MemorizationError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(MemorizationErrorCode.REVISION_PLAN_INVALID, message, context);
  }
}

export class HistoryIntegrityFailureError extends MemorizationError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(MemorizationErrorCode.HISTORY_INTEGRITY_FAILURE, message, context);
  }
}

export class SchedulerConfigurationInvalidError extends MemorizationError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(MemorizationErrorCode.SCHEDULER_CONFIGURATION_INVALID, message, context);
  }
}
