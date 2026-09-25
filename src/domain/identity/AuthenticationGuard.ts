/**
 * @file AuthenticationGuard.ts
 * @module domain/identity
 * @description Production-grade Authentication, Authorization, and Data Ownership Guard (Sections 17, 18, 19).
 * 
 * CORE ARCHITECTURAL INVARIANT:
 * Authentication !== Authorization !== Ownership.
 * - Authentication: Is the student who they claim to be?
 * - Authorization: Does this identity have the legal capability to perform this action?
 * - Ownership: Does this student own this specific resource?
 * 
 * An authenticated user is NEVER granted permissions over another user's learning data.
 * An authenticated user is NEVER granted administrative permissions merely because they are authenticated.
 */

import {
  StudentIdentity,
  StudentIdentityStatus,
  StudentIdentityType,
  StudentCapability,
} from './types.ts';
import {
  AuthenticationRequiredError,
  UnauthorizedOperationError,
  CrossStudentDataAccessDeniedError,
} from './errorRegistry.ts';

export class AuthenticationGuard {
  /**
   * Allowed capabilities for each identity type.
   */
  private static readonly CAPABILITY_MATRIX: Record<StudentIdentityType, StudentCapability[]> = {
    [StudentIdentityType.ANONYMOUS_LOCAL]: [
      StudentCapability.READ_OWN_PROGRESS,
      StudentCapability.WRITE_OWN_PROGRESS,
      StudentCapability.START_OWN_SESSION,
      StudentCapability.EXPORT_OWN_DATA,
    ],
    [StudentIdentityType.AUTHENTICATED]: [
      StudentCapability.READ_OWN_PROGRESS,
      StudentCapability.WRITE_OWN_PROGRESS,
      StudentCapability.START_OWN_SESSION,
      StudentCapability.MANAGE_OWN_ACCOUNT,
      StudentCapability.EXPORT_OWN_DATA,
      StudentCapability.DELETE_OWN_ACCOUNT,
    ],
  };

  /**
   * 1. Authentication Check: Verifies identity is present and in ACTIVE status.
   */
  public static assertAuthenticated(identity: StudentIdentity | null | undefined, operation: string = 'OPERATION'): StudentIdentity {
    if (!identity) {
      throw new AuthenticationRequiredError(operation);
    }

    if (identity.status === StudentIdentityStatus.SUSPENDED) {
      throw new UnauthorizedOperationError(
        operation,
        identity.studentId,
        'Identity is SUSPENDED. Access to learning operations is temporarily restricted.'
      );
    }

    if (identity.status === StudentIdentityStatus.DELETED) {
      throw new UnauthorizedOperationError(
        operation,
        identity.studentId,
        'Identity is DELETED. Access denied.'
      );
    }

    if (identity.status === StudentIdentityStatus.MIGRATED) {
      throw new UnauthorizedOperationError(
        operation,
        identity.studentId,
        'Identity has been MIGRATED to an authenticated account. Please use the authenticated identity.'
      );
    }

    return identity;
  }

  /**
   * 2. Authorization Check: Verifies student has the requested capability.
   */
  public static assertAuthorized(
    identity: StudentIdentity | null | undefined,
    capability: StudentCapability,
    resourceDescription: string = 'resource'
  ): void {
    const verifiedIdentity = this.assertAuthenticated(identity, capability);
    const allowed = this.CAPABILITY_MATRIX[verifiedIdentity.identityType] ?? [];

    if (!allowed.includes(capability)) {
      throw new UnauthorizedOperationError(
        capability,
        verifiedIdentity.studentId,
        `Identity type ${verifiedIdentity.identityType} does not possess capability ${capability} on ${resourceDescription}.`
      );
    }
  }

  /**
   * 3. Ownership Check: Enforces strict data isolation between students.
   */
  public static assertOwnership(
    resourceOwnerStudentId: string,
    requestingStudentId: string,
    resourceType: string = 'LEARNING_RECORD'
  ): void {
    if (!resourceOwnerStudentId || !requestingStudentId) {
      throw new UnauthorizedOperationError(
        'DATA_ACCESS',
        requestingStudentId,
        'Missing owner or requesting student identifier.'
      );
    }

    if (resourceOwnerStudentId !== requestingStudentId) {
      throw new CrossStudentDataAccessDeniedError(
        resourceType,
        resourceOwnerStudentId,
        requestingStudentId
      );
    }
  }

  /**
   * Combined check: Asserts identity is authenticated, has capability, AND owns the target resource.
   */
  public static assertAuthorizedOwnership(
    identity: StudentIdentity | null | undefined,
    capability: StudentCapability,
    resourceOwnerStudentId: string,
    resourceType: string = 'LEARNING_RECORD'
  ): StudentIdentity {
    const verified = this.assertAuthenticated(identity, capability);
    this.assertAuthorized(verified, capability, resourceType);
    this.assertOwnership(resourceOwnerStudentId, verified.studentId, resourceType);
    return verified;
  }

  /**
   * Safe boolean check for capability.
   */
  public static hasCapability(identity: StudentIdentity | null | undefined, capability: StudentCapability): boolean {
    if (!identity || identity.status !== StudentIdentityStatus.ACTIVE) return false;
    const allowed = this.CAPABILITY_MATRIX[identity.identityType] ?? [];
    return allowed.includes(capability);
  }
}
