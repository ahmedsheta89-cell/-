/**
 * @file errorRegistry.ts
 * @module domain/persistence
 * @description Centralized Error Registry for Phase 8B Persistent Learning Store (Section 32).
 */

import { PersistenceErrorCode } from './types.ts';

export class PersistenceError extends Error {
  public readonly code: PersistenceErrorCode;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: number;

  constructor(code: PersistenceErrorCode, message: string, context?: Record<string, unknown>) {
    super(`[${code}] ${message}`);
    this.name = 'PersistenceError';
    this.code = code;
    this.context = context;
    this.timestamp = Date.now();
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * PERSIST-001: Event replay, conflicting duplicate, or duplicate attempt with conflicting payload.
 */
export class DuplicateEventError extends PersistenceError {
  constructor(eventId: string, context?: Record<string, unknown>) {
    super(
      PersistenceErrorCode.DUPLICATE_EVENT,
      `Event '${eventId}' already exists with a different cryptographic payload or conflicting hash.`,
      { eventId, ...context }
    );
  }
}

/**
 * PERSIST-002: Cryptographic hash mismatch or broken hash chain link.
 */
export class HashMismatchError extends PersistenceError {
  constructor(message: string, expectedHash: string, calculatedHash: string, context?: Record<string, unknown>) {
    super(
      PersistenceErrorCode.HASH_MISMATCH,
      `Hash integrity failure: ${message}. Expected '${expectedHash}', got '${calculatedHash}'.`,
      { expectedHash, calculatedHash, ...context }
    );
  }
}

/**
 * PERSIST-003: Schema version mismatch or unsupported schema.
 */
export class SchemaMismatchError extends PersistenceError {
  constructor(expectedVersion: string, receivedVersion: string, context?: Record<string, unknown>) {
    super(
      PersistenceErrorCode.SCHEMA_MISMATCH,
      `Incompatible schema version: expected '${expectedVersion}', received '${receivedVersion}'.`,
      { expectedVersion, receivedVersion, ...context }
    );
  }
}

/**
 * PERSIST-004: Incomplete, interrupted, or uncommitted transaction detected.
 */
export class TransactionIncompleteError extends PersistenceError {
  constructor(transactionId: string, details?: string, context?: Record<string, unknown>) {
    super(
      PersistenceErrorCode.TRANSACTION_INCOMPLETE,
      `Transaction '${transactionId}' was incomplete or interrupted.${details ? ` Details: ${details}` : ''}`,
      { transactionId, details, ...context }
    );
  }
}

/**
 * PERSIST-005: Recovery routine failed to restore consistent state.
 */
export class RecoveryFailedError extends PersistenceError {
  constructor(studentId: string, reason: string, context?: Record<string, unknown>) {
    super(
      PersistenceErrorCode.RECOVERY_FAILED,
      `Recovery failed for student '${studentId}': ${reason}`,
      { studentId, reason, ...context }
    );
  }
}

/**
 * PERSIST-006: Student identity mismatch or unauthorized cross-student access.
 */
export class OwnershipMismatchError extends PersistenceError {
  constructor(resourceOwnerStudentId: string, requestingStudentId: string, resourceType: string = 'RECORD') {
    super(
      PersistenceErrorCode.OWNERSHIP_MISMATCH,
      `Ownership mismatch on ${resourceType}: Resource belongs to student '${resourceOwnerStudentId}', but was requested by '${requestingStudentId}'.`,
      { resourceOwnerStudentId, requestingStudentId, resourceType }
    );
  }
}

/**
 * PERSIST-007: Corrupted or structurally invalid record detected.
 */
export class CorruptedRecordError extends PersistenceError {
  constructor(recordIdentifier: string, reason: string, context?: Record<string, unknown>) {
    super(
      PersistenceErrorCode.CORRUPTED_RECORD,
      `Corrupted persistent record '${recordIdentifier}': ${reason}`,
      { recordIdentifier, reason, ...context }
    );
  }
}

/**
 * PERSIST-008: Derived profile snapshot is stale or inconsistent with underlying events.
 */
export class SnapshotStaleError extends PersistenceError {
  constructor(studentId: string, snapshotVersion: number, currentEventCount: number, context?: Record<string, unknown>) {
    super(
      PersistenceErrorCode.SNAPSHOT_STALE,
      `Profile snapshot for student '${studentId}' (v${snapshotVersion}) is stale compared to event history count (${currentEventCount}).`,
      { studentId, snapshotVersion, currentEventCount, ...context }
    );
  }
}

/**
 * PERSIST-009: Identity migration conflict or concurrent migration collision.
 */
export class MigrationConflictError extends PersistenceError {
  constructor(sourceStudentId: string, targetStudentId: string, details: string, context?: Record<string, unknown>) {
    super(
      PersistenceErrorCode.MIGRATION_CONFLICT,
      `Migration conflict migrating '${sourceStudentId}' to '${targetStudentId}': ${details}`,
      { sourceStudentId, targetStudentId, details, ...context }
    );
  }
}

/**
 * PERSIST-010: Underlying persistence adapter or hardware storage unavailable.
 */
export class StorageUnavailableError extends PersistenceError {
  constructor(reason: string, context?: Record<string, unknown>) {
    super(
      PersistenceErrorCode.STORAGE_UNAVAILABLE,
      `Persistent storage engine is unavailable: ${reason}`,
      { reason, ...context }
    );
  }
}
