/**
 * @file errorRegistry.ts
 * @module domain/sync
 * @description Centralized Error Registry for Phase 8C Offline-First Synchronization (Section 45).
 */

import { SyncErrorCode } from './types.ts';

export class SyncError extends Error {
  public readonly code: SyncErrorCode;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: number;

  constructor(code: SyncErrorCode, message: string, context?: Record<string, unknown>) {
    super(`[${code}] ${message}`);
    this.name = 'SyncError';
    this.code = code;
    this.context = context;
    this.timestamp = Date.now();
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * SYNC-001: Outbox conflict or conflicting write operation.
 */
export class OutboxConflictError extends SyncError {
  constructor(outboxId: string, message: string, context?: Record<string, unknown>) {
    super(SyncErrorCode.OUTBOX_CONFLICT, `Outbox conflict on record '${outboxId}': ${message}`, {
      outboxId,
      ...context,
    });
  }
}

/**
 * SYNC-002: Replayed or duplicate sync event envelope.
 */
export class DuplicateSyncEventError extends SyncError {
  constructor(syncEventId: string, eventId: string, context?: Record<string, unknown>) {
    super(
      SyncErrorCode.DUPLICATE_EVENT,
      `Sync event '${syncEventId}' (event '${eventId}') already processed or present in inbox.`,
      { syncEventId, eventId, ...context }
    );
  }
}

/**
 * SYNC-003: Payload or envelope hash verification failure.
 */
export class SyncHashMismatchError extends SyncError {
  constructor(identifier: string, expectedHash: string, calculatedHash: string, context?: Record<string, unknown>) {
    super(
      SyncErrorCode.HASH_MISMATCH,
      `Cryptographic hash verification failed for '${identifier}'. Expected '${expectedHash}', got '${calculatedHash}'.`,
      { identifier, expectedHash, calculatedHash, ...context }
    );
  }
}

/**
 * SYNC-004: Cross-student or unauthorized identity access attempt.
 */
export class SyncOwnershipMismatchError extends SyncError {
  constructor(resourceStudentId: string, requestingStudentId: string, context?: Record<string, unknown>) {
    super(
      SyncErrorCode.OWNERSHIP_MISMATCH,
      `Sync ownership violation: Resource belongs to student '${resourceStudentId}', but operation requested for '${requestingStudentId}'.`,
      { resourceStudentId, requestingStudentId, ...context }
    );
  }
}

/**
 * SYNC-005: Unsupported or future protocol version.
 */
export class UnsupportedProtocolError extends SyncError {
  constructor(receivedVersion: string, expectedVersion: string, context?: Record<string, unknown>) {
    super(
      SyncErrorCode.UNSUPPORTED_PROTOCOL,
      `Unsupported sync protocol version: received '${receivedVersion}', expected '${expectedVersion}'.`,
      { receivedVersion, expectedVersion, ...context }
    );
  }
}

/**
 * SYNC-006: Schema version mismatch.
 */
export class SyncSchemaMismatchError extends SyncError {
  constructor(receivedVersion: string, expectedVersion: string, context?: Record<string, unknown>) {
    super(
      SyncErrorCode.SCHEMA_MISMATCH,
      `Unsupported sync envelope schema version: received '${receivedVersion}', expected '${expectedVersion}'.`,
      { receivedVersion, expectedVersion, ...context }
    );
  }
}

/**
 * SYNC-007: Corrupted or invalid synchronization cursor.
 */
export class InvalidCursorError extends SyncError {
  constructor(studentId: string, details: string, context?: Record<string, unknown>) {
    super(
      SyncErrorCode.CURSOR_INVALID,
      `Invalid synchronization cursor for student '${studentId}': ${details}`,
      { studentId, details, ...context }
    );
  }
}

/**
 * SYNC-008: Transport communication or connectivity failure.
 */
export class TransportFailureError extends SyncError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(SyncErrorCode.TRANSPORT_FAILURE, `Sync transport failed: ${message}`, context);
  }
}

/**
 * SYNC-009: Authentication required or invalid session token.
 */
export class AuthRequiredError extends SyncError {
  constructor(studentId: string, message: string = 'Valid authenticated session required to synchronize.') {
    super(SyncErrorCode.AUTH_REQUIRED, `Authentication required for student '${studentId}': ${message}`, {
      studentId,
    });
  }
}

/**
 * SYNC-010: Immutable event conflict quarantined.
 */
export class ConflictQuarantinedError extends SyncError {
  constructor(eventId: string, localHash: string, remoteHash: string, context?: Record<string, unknown>) {
    super(
      SyncErrorCode.CONFLICT_QUARANTINED,
      `Immutable event conflict detected and quarantined for event '${eventId}'. Local hash: '${localHash}', Remote hash: '${remoteHash}'.`,
      { eventId, localHash, remoteHash, ...context }
    );
  }
}

/**
 * SYNC-011: Recovery or full resync required.
 */
export class SyncRecoveryRequiredError extends SyncError {
  constructor(studentId: string, reason: string, context?: Record<string, unknown>) {
    super(
      SyncErrorCode.RECOVERY_REQUIRED,
      `Full resynchronization recovery required for student '${studentId}': ${reason}`,
      { studentId, reason, ...context }
    );
  }
}

/**
 * SYNC-012: Invariant violation: Raw audio data detected in sync envelope or payload.
 */
export class RawAudioSyncRejectedError extends SyncError {
  constructor(reason: string, context?: Record<string, unknown>) {
    super(
      SyncErrorCode.RAW_AUDIO_REJECTED,
      `[Privacy Invariant Violation] Raw audio transmission strictly prohibited: ${reason}`,
      context
    );
  }
}
