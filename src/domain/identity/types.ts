/**
 * @file types.ts
 * @module domain/identity
 * @description Production-grade Student Identity, Account, Device, and Session domain contracts for Phase 8A.
 * 
 * NON-NEGOTIABLE ARCHITECTURAL PRINCIPLE:
 * Identity is infrastructure. Identity must NOT become the source of truth for:
 * - Quran text or interpretation
 * - Tajweed rules or recitation correctness
 * - 5C Recitation decisions or 7A Teacher policies
 * - 7D Memorization state or revision priority
 * 
 * Identity ONLY determines:
 * - WHO owns the learning data
 * - WHO may access it
 * - WHICH device/session generated it
 * - WHICH account may synchronize it
 */

/**
 * Identity classification: Anonymous Local (pre-account) vs Authenticated.
 */
export enum StudentIdentityType {
  ANONYMOUS_LOCAL = 'ANONYMOUS_LOCAL',
  AUTHENTICATED = 'AUTHENTICATED',
}

/**
 * Deterministic lifecycle states for Student Identity.
 */
export enum StudentIdentityStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  MIGRATED = 'MIGRATED',
}

/**
 * Section 2: Canonical Student Identity model.
 */
export interface StudentIdentity {
  readonly studentId: string;
  readonly accountId: string | null;
  readonly identityType: StudentIdentityType;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly status: StudentIdentityStatus;
  readonly version: string;
  readonly isAnonymous: boolean;
}

/**
 * Deterministic account lifecycle states.
 */
export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  DELETION_REQUESTED = 'DELETION_REQUESTED',
}

/**
 * Section 3: Canonical Student Account model.
 * Strictly adheres to Data Minimization (Section 22).
 * NO medical information, NO religious/psychological profiling, NO sensitive behavioral labels.
 */
export interface StudentAccount {
  readonly accountId: string;
  readonly primaryStudentId: string;
  readonly status: AccountStatus;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly emailVerified: boolean;
  readonly email: string | null;
  readonly displayName?: string | null;
  readonly identityVersion: string;
  readonly deletionRequestedAt?: number | null;
}

/**
 * Section 7: Device Identity.
 * Strictly independent from studentId and accountId.
 * No invasive fingerprinting; device is never the authority over account.
 */
export interface DeviceIdentity {
  readonly deviceId: string;
  readonly createdAt: number;
  readonly lastSeenAt: number;
  readonly platform: string;
  readonly appVersion: string;
}

/**
 * Section 8: Session Identity for Teacher Interactions.
 */
export interface SessionIdentity {
  readonly sessionId: string;
  readonly studentId: string;
  readonly deviceId: string;
  readonly startedAt: number;
  readonly endedAt: number | null;
  readonly isActive: boolean;
}

/**
 * Section 18: Student Authorization Capabilities.
 * Granular capabilities; authentication does NOT grant administrative permissions.
 */
export enum StudentCapability {
  READ_OWN_PROGRESS = 'READ_OWN_PROGRESS',
  WRITE_OWN_PROGRESS = 'WRITE_OWN_PROGRESS',
  START_OWN_SESSION = 'START_OWN_SESSION',
  MANAGE_OWN_ACCOUNT = 'MANAGE_OWN_ACCOUNT',
  EXPORT_OWN_DATA = 'EXPORT_OWN_DATA',
  DELETE_OWN_ACCOUNT = 'DELETE_OWN_ACCOUNT',
}

/**
 * Section 15: Authentication Provider Connection Status.
 * Must be explicit — mock auth is NEVER labeled as real production auth.
 */
export enum AuthProviderStatus {
  NOT_CONNECTED = 'NOT_CONNECTED',
  MOCK = 'MOCK',
  REAL = 'REAL',
}

/**
 * Section 16: Authentication Runtime States.
 */
export enum AuthState {
  SIGNED_OUT = 'SIGNED_OUT',
  ANONYMOUS = 'ANONYMOUS',
  AUTHENTICATED = 'AUTHENTICATED',
  AUTHENTICATION_PENDING = 'AUTHENTICATION_PENDING',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
}

/**
 * Section 11 & 13: Identity Migration Lifecycle States.
 */
export enum MigrationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  ROLLED_BACK = 'ROLLED_BACK',
}

/**
 * Section 13: Auditable Identity Migration Record.
 */
export interface IdentityMigrationRecord {
  readonly migrationId: string;
  readonly sourceStudentId: string;
  readonly targetStudentId: string;
  readonly sourceAccountId: string | null;
  readonly targetAccountId: string;
  readonly timestamp: number;
  readonly status: MigrationStatus;
  readonly migratedEventsCount: number;
  readonly migratedPassagesCount: number;
  readonly algorithmVersion: string;
  readonly checksum: string;
  readonly failureReason?: string;
}

/**
 * Section 32: Phase 8A Explicit Error Codes.
 */
export enum AuthErrorCode {
  SESSION_OWNERSHIP_MISMATCH = 'AUTH-001: SESSION_OWNERSHIP_MISMATCH',
  IDENTITY_NOT_FOUND = 'AUTH-002: IDENTITY_NOT_FOUND',
  UNAUTHORIZED_OPERATION = 'AUTH-003: UNAUTHORIZED_OPERATION',
  AUTHENTICATION_REQUIRED = 'AUTH-004: AUTHENTICATION_REQUIRED',
  IDENTITY_MIGRATION_FAILED = 'AUTH-005: IDENTITY_MIGRATION_FAILED',
  DUPLICATE_MIGRATION = 'AUTH-006: DUPLICATE_MIGRATION',
  ACCOUNT_STATE_INVALID = 'AUTH-007: ACCOUNT_STATE_INVALID',
  ACCOUNT_SWITCH_LEAK = 'AUTH-008: ACCOUNT_SWITCH_LEAK',
  INVALID_AUTH_PROVIDER_STATE = 'AUTH-009: INVALID_AUTH_PROVIDER_STATE',
  CREDENTIAL_EXPOSURE_ATTEMPT = 'AUTH-010: CREDENTIAL_EXPOSURE_ATTEMPT',
  MALFORMED_IDENTITY = 'AUTH-011: MALFORMED_IDENTITY',
  DEVICE_IDENTITY_MISMATCH = 'AUTH-012: DEVICE_IDENTITY_MISMATCH',
  AI_IDENTITY_TAMPERING = 'AUTH-013: AI_IDENTITY_TAMPERING',
  ACCOUNT_DELETION_IN_PROGRESS = 'AUTH-014: ACCOUNT_DELETION_IN_PROGRESS',
  CROSS_STUDENT_DATA_ACCESS_DENIED = 'AUTH-015: CROSS_STUDENT_DATA_ACCESS_DENIED',
}
