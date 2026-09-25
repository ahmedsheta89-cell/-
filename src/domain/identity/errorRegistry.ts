/**
 * @file errorRegistry.ts
 * @module domain/identity
 * @description Centralized Security and Authentication Error Registry for Phase 8A (Section 32).
 */

import { AuthErrorCode } from './types.ts';

export class AuthError extends Error {
  public readonly code: AuthErrorCode;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: number;

  constructor(code: AuthErrorCode, message: string, context?: Record<string, unknown>) {
    super(`[${code}] ${message}`);
    this.name = 'AuthError';
    this.code = code;
    this.context = context;
    this.timestamp = Date.now();
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class SessionOwnershipMismatchError extends AuthError {
  constructor(sessionId: string, sessionOwnerId: string, attemptedStudentId: string) {
    super(
      AuthErrorCode.SESSION_OWNERSHIP_MISMATCH,
      `Session ownership mismatch: Session ${sessionId} is owned by student ${sessionOwnerId}, but access was attempted by student ${attemptedStudentId}.`,
      { sessionId, sessionOwnerId, attemptedStudentId }
    );
  }
}

export class IdentityNotFoundError extends AuthError {
  constructor(studentId: string) {
    super(
      AuthErrorCode.IDENTITY_NOT_FOUND,
      `Student identity not found for identifier: ${studentId}`,
      { studentId }
    );
  }
}

export class UnauthorizedOperationError extends AuthError {
  constructor(operation: string, studentId?: string, reason?: string) {
    super(
      AuthErrorCode.UNAUTHORIZED_OPERATION,
      `Unauthorized operation '${operation}' attempted by student ${studentId || 'unknown'}.${reason ? ` Reason: ${reason}` : ''}`,
      { operation, studentId, reason }
    );
  }
}

export class AuthenticationRequiredError extends AuthError {
  constructor(operation: string) {
    super(
      AuthErrorCode.AUTHENTICATION_REQUIRED,
      `Authentication is strictly required to perform operation: ${operation}`,
      { operation }
    );
  }
}

export class IdentityMigrationError extends AuthError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(AuthErrorCode.IDENTITY_MIGRATION_FAILED, message, context);
  }
}

export class DuplicateMigrationError extends AuthError {
  constructor(sourceStudentId: string, existingTargetStudentId: string, attemptedTargetStudentId: string) {
    super(
      AuthErrorCode.DUPLICATE_MIGRATION,
      `Duplicate migration rejected: Source identity ${sourceStudentId} has already been migrated to ${existingTargetStudentId}. Cannot migrate to ${attemptedTargetStudentId}.`,
      { sourceStudentId, existingTargetStudentId, attemptedTargetStudentId }
    );
  }
}

export class AccountStateInvalidError extends AuthError {
  constructor(accountId: string, currentState: string, attemptedAction: string) {
    super(
      AuthErrorCode.ACCOUNT_STATE_INVALID,
      `Account ${accountId} is in state ${currentState}. Cannot perform action: ${attemptedAction}.`,
      { accountId, currentState, attemptedAction }
    );
  }
}

export class AccountSwitchLeakError extends AuthError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(AuthErrorCode.ACCOUNT_SWITCH_LEAK, message, context);
  }
}

export class InvalidAuthProviderStateError extends AuthError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(AuthErrorCode.INVALID_AUTH_PROVIDER_STATE, message, context);
  }
}

export class CredentialExposureError extends AuthError {
  constructor(location: string, detectedField: string) {
    super(
      AuthErrorCode.CREDENTIAL_EXPOSURE_ATTEMPT,
      `Security violation: Sensitive credential or authentication secret detected in prohibited location [${location}]: field '${detectedField}'.`,
      { location, detectedField }
    );
  }
}

export class MalformedIdentityError extends AuthError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(AuthErrorCode.MALFORMED_IDENTITY, message, context);
  }
}

export class DeviceIdentityMismatchError extends AuthError {
  constructor(sessionId: string, expectedDeviceId: string, providedDeviceId: string) {
    super(
      AuthErrorCode.DEVICE_IDENTITY_MISMATCH,
      `Device mismatch for session ${sessionId}: expected ${expectedDeviceId}, received ${providedDeviceId}.`,
      { sessionId, expectedDeviceId, providedDeviceId }
    );
  }
}

export class AIIdentityTamperingError extends AuthError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(AuthErrorCode.AI_IDENTITY_TAMPERING, message, context);
  }
}

export class CrossStudentDataAccessDeniedError extends AuthError {
  constructor(resourceType: string, ownerStudentId: string, requestingStudentId: string) {
    super(
      AuthErrorCode.CROSS_STUDENT_DATA_ACCESS_DENIED,
      `Cross-student access denied: Resource '${resourceType}' owned by ${ownerStudentId} cannot be accessed by ${requestingStudentId}.`,
      { resourceType, ownerStudentId, requestingStudentId }
    );
  }
}
