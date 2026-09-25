/**
 * @file StudentIdentityService.ts
 * @module domain/identity
 * @description Core Domain Service managing StudentIdentity and StudentAccount lifecycles (Sections 2, 3, 4, 5, 7, 20).
 * 
 * CORE INVARIANTS:
 * - Deterministic lifecycle state machine.
 * - Anonymous identities receive cryptographically strong random IDs (never email, IP, device, timestamp alone).
 * - Account suspension or deletion request NEVER silently destroys longitudinal learning history.
 * - Adheres strictly to Data Minimization (no medical, psychological, or religious profiling).
 */

import {
  StudentIdentity,
  StudentIdentityType,
  StudentIdentityStatus,
  StudentAccount,
  AccountStatus,
  DeviceIdentity,
} from './types.ts';
import { SecureIdGenerator } from './SecureIdGenerator.ts';
import {
  AccountStateInvalidError,
  MalformedIdentityError,
} from './errorRegistry.ts';

export class StudentIdentityService {
  public static readonly CURRENT_IDENTITY_VERSION = 'identity-v1.0.0-phase8a';

  /**
   * Creates a new cryptographically strong anonymous local identity.
   */
  public static createAnonymousIdentity(customStudentId?: string): StudentIdentity {
    const studentId = customStudentId ?? SecureIdGenerator.generateStudentId('ANON');
    const now = Date.now();

    const identity: StudentIdentity = Object.freeze({
      studentId,
      accountId: null,
      identityType: StudentIdentityType.ANONYMOUS_LOCAL,
      createdAt: now,
      updatedAt: now,
      status: StudentIdentityStatus.ACTIVE,
      version: this.CURRENT_IDENTITY_VERSION,
      isAnonymous: true,
    });

    this.validateIdentity(identity);
    return identity;
  }

  /**
   * Creates a new authenticated student identity paired with a student account.
   */
  public static createAuthenticatedIdentity(params: {
    email?: string | null;
    displayName?: string | null;
    emailVerified?: boolean;
    customStudentId?: string;
    customAccountId?: string;
  }): { identity: StudentIdentity; account: StudentAccount } {
    const studentId = params.customStudentId ?? SecureIdGenerator.generateStudentId('AUTH');
    const accountId = params.customAccountId ?? SecureIdGenerator.generateAccountId();
    const now = Date.now();

    const identity: StudentIdentity = Object.freeze({
      studentId,
      accountId,
      identityType: StudentIdentityType.AUTHENTICATED,
      createdAt: now,
      updatedAt: now,
      status: StudentIdentityStatus.ACTIVE,
      version: this.CURRENT_IDENTITY_VERSION,
      isAnonymous: false,
    });

    const account: StudentAccount = Object.freeze({
      accountId,
      primaryStudentId: studentId,
      status: params.emailVerified ? AccountStatus.ACTIVE : AccountStatus.PENDING_VERIFICATION,
      createdAt: now,
      updatedAt: now,
      emailVerified: Boolean(params.emailVerified),
      email: params.email ? params.email.toLowerCase().trim() : null,
      displayName: params.displayName ?? null,
      identityVersion: this.CURRENT_IDENTITY_VERSION,
      deletionRequestedAt: null,
    });

    this.validateIdentity(identity);
    this.validateAccount(account);

    return { identity, account };
  }

  /**
   * Validates structural integrity of a StudentIdentity.
   */
  public static validateIdentity(identity: StudentIdentity): void {
    if (!identity) {
      throw new MalformedIdentityError('Identity object is null or undefined');
    }
    if (!identity.studentId || typeof identity.studentId !== 'string' || identity.studentId.trim().length === 0) {
      throw new MalformedIdentityError('studentId must be a non-empty string', { identity });
    }
    if (!Object.values(StudentIdentityType).includes(identity.identityType)) {
      throw new MalformedIdentityError(`Invalid identityType: ${identity.identityType}`, { identity });
    }
    if (!Object.values(StudentIdentityStatus).includes(identity.status)) {
      throw new MalformedIdentityError(`Invalid status: ${identity.status}`, { identity });
    }
    if (identity.identityType === StudentIdentityType.AUTHENTICATED && !identity.accountId) {
      throw new MalformedIdentityError('Authenticated identity MUST have an associated accountId', { identity });
    }
    if (identity.identityType === StudentIdentityType.ANONYMOUS_LOCAL && identity.accountId !== null) {
      throw new MalformedIdentityError('Anonymous local identity MUST have accountId === null', { identity });
    }
    if (typeof identity.createdAt !== 'number' || identity.createdAt <= 0) {
      throw new MalformedIdentityError('createdAt must be a valid positive epoch timestamp', { identity });
    }
  }

  /**
   * Validates structural integrity of a StudentAccount.
   */
  public static validateAccount(account: StudentAccount): void {
    if (!account) {
      throw new MalformedIdentityError('Account object is null or undefined');
    }
    if (!account.accountId || typeof account.accountId !== 'string' || account.accountId.trim().length === 0) {
      throw new MalformedIdentityError('accountId must be a non-empty string', { account });
    }
    if (!account.primaryStudentId || typeof account.primaryStudentId !== 'string' || account.primaryStudentId.trim().length === 0) {
      throw new MalformedIdentityError('primaryStudentId must be a non-empty string', { account });
    }
    if (!Object.values(AccountStatus).includes(account.status)) {
      throw new MalformedIdentityError(`Invalid account status: ${account.status}`, { account });
    }
    if (typeof account.createdAt !== 'number' || account.createdAt <= 0) {
      throw new MalformedIdentityError('createdAt must be a valid positive epoch timestamp', { account });
    }
  }

  /**
   * Executes deterministic account state transition (Section 4).
   * Valid transitions:
   * PENDING_VERIFICATION -> ACTIVE, DELETED
   * ACTIVE -> SUSPENDED, DELETION_REQUESTED
   * SUSPENDED -> ACTIVE, DELETION_REQUESTED
   * DELETION_REQUESTED -> DELETED, ACTIVE (cancellation)
   * DELETED -> NONE (Terminal state)
   */
  public static transitionAccountStatus(account: StudentAccount, targetStatus: AccountStatus): StudentAccount {
    this.validateAccount(account);
    const current = account.status;

    if (current === targetStatus) {
      return account;
    }

    if (current === AccountStatus.DELETED) {
      throw new AccountStateInvalidError(
        account.accountId,
        current,
        `Transition to ${targetStatus} rejected: DELETED is a terminal state.`
      );
    }

    const validTransitions: Record<AccountStatus, AccountStatus[]> = {
      [AccountStatus.PENDING_VERIFICATION]: [AccountStatus.ACTIVE, AccountStatus.DELETED],
      [AccountStatus.ACTIVE]: [AccountStatus.SUSPENDED, AccountStatus.DELETION_REQUESTED],
      [AccountStatus.SUSPENDED]: [AccountStatus.ACTIVE, AccountStatus.DELETION_REQUESTED],
      [AccountStatus.DELETION_REQUESTED]: [AccountStatus.DELETED, AccountStatus.ACTIVE],
      [AccountStatus.DELETED]: [],
    };

    if (!validTransitions[current].includes(targetStatus)) {
      throw new AccountStateInvalidError(
        account.accountId,
        current,
        `Transition from ${current} to ${targetStatus} is prohibited.`
      );
    }

    const now = Date.now();
    return Object.freeze({
      ...account,
      status: targetStatus,
      updatedAt: now,
      deletionRequestedAt: targetStatus === AccountStatus.DELETION_REQUESTED ? (account.deletionRequestedAt ?? now) : null,
    });
  }

  /**
   * Section 20: Initiates account deletion request.
   * Does NOT physically destroy learning data immediately. Exposes explicit DELETION_REQUESTED state.
   */
  public static requestAccountDeletion(account: StudentAccount): StudentAccount {
    return this.transitionAccountStatus(account, AccountStatus.DELETION_REQUESTED);
  }

  /**
   * Cancels a pending account deletion request.
   */
  public static cancelAccountDeletion(account: StudentAccount): StudentAccount {
    if (account.status !== AccountStatus.DELETION_REQUESTED) {
      throw new AccountStateInvalidError(
        account.accountId,
        account.status,
        'Cannot cancel deletion: Account is not in DELETION_REQUESTED state.'
      );
    }
    return this.transitionAccountStatus(account, AccountStatus.ACTIVE);
  }

  /**
   * Section 7: Creates Device Identity.
   * Uses non-invasive device metadata only.
   */
  public static createDeviceIdentity(platform: string = 'web-browser', appVersion: string = '1.0.0'): DeviceIdentity {
    const now = Date.now();
    return Object.freeze({
      deviceId: SecureIdGenerator.generateDeviceId(),
      createdAt: now,
      lastSeenAt: now,
      platform,
      appVersion,
    });
  }

  /**
   * Updates last seen timestamp for a device.
   */
  public static updateDeviceLastSeen(device: DeviceIdentity): DeviceIdentity {
    return Object.freeze({
      ...device,
      lastSeenAt: Date.now(),
    });
  }
}
