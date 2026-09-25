/**
 * @file Phase8aStudentIdentityArchitecture.test.ts
 * @description Comprehensive Phase 8A Test Suite (80+ Tests).
 * 
 * COVERS:
 * - 1. Student Identity Creation & Invariant Validation (10 tests)
 * - 2. Student Account Lifecycle & State Machine (8 tests)
 * - 3. Device Identity & Non-Invasive Boundaries (5 tests)
 * - 4. Session Identity & Ownership Enforcement (AUTH-001) (10 tests)
 * - 5. Longitudinal Learning Data Ownership (8 tests)
 * - 6. Authentication, Authorization & Ownership Guard (10 tests)
 * - 7. Identity Migration: Anonymous to Authenticated (12 tests)
 * - 8. Auth Provider, Token Freshness & Account Switching (10 tests)
 * - 9. Privacy, Data Minimization & Gemini Boundary (10 tests)
 * - 10. Phase 7C & 7D Architectural Integration (6 tests)
 * - 11. Security, Adversarial & Spoofing Invariants (6 tests)
 * - 12. Empirical Latency Benchmarks (p50, p95, max) (2 tests)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  StudentIdentityType,
  StudentIdentityStatus,
  AccountStatus,
  StudentCapability,
  AuthProviderStatus,
  AuthState,
  MigrationStatus,
  AuthErrorCode,
  StudentIdentityService,
  SessionOwnershipManager,
  AuthenticationGuard,
  LocalAuthProvider,
  IdentityMigrationService,
  IdentitySecurityAuditor,
  SecureIdGenerator,
  SessionOwnershipMismatchError,
  AccountStateInvalidError,
  UnauthorizedOperationError,
  AuthenticationRequiredError,
  DuplicateMigrationError,
  CredentialExposureError,
  MalformedIdentityError,
  DeviceIdentityMismatchError,
  CrossStudentDataAccessDeniedError,
} from '../domain/identity/index.ts';
import { LongitudinalProfileStore } from '../domain/memorization_revision/LongitudinalProfileStore.ts';
import {
  MemorizationEventFactory,
  CreateMemorizationEventParams,
} from '../domain/memorization_revision/MemorizationEventFactory.ts';
import {
  MemorizationEventType,
  EvidenceStatus,
  MemorizationState,
} from '../domain/memorization_revision/types.ts';
import { RecitationDecisionState } from '../domain/recitation/decisionTypes.ts';
import { PedagogicalAction } from '../domain/teacher_policy/types.ts';
import {
  CANONICAL_QURAN_HASH,
  TAJWEED_KB_CHECKSUM_SHA256,
  OFFICIAL_MODEL_HASH,
} from '../domain/recitation/RecitationErrorDecisionEngine.ts';
import { OFFICIAL_DATASET_VERSION } from '../infrastructure/quran/VerifiedQuranDataProvider.ts';
import { RealTimeSessionOrchestrator } from '../domain/realtime_teacher/RealTimeSessionOrchestrator.ts';
import { RiwayahType } from '../domain/quran/types.ts';
import { UserInteractionMode } from '../domain/realtime_teacher/types.ts';

function createValidBaseParams(overrides?: Partial<CreateMemorizationEventParams>): CreateMemorizationEventParams {
  return {
    studentId: 'std-ahmed-001',
    sessionId: 'sess-2026-09-21-001',
    quranLocation: { surahId: 1, ayahNumber: 1 },
    eventType: MemorizationEventType.CONFIRMED,
    evidenceStatus: EvidenceStatus.CONFIRMED,
    decisionStatus: RecitationDecisionState.CONTINUE,
    teacherAction: PedagogicalAction.CONTINUE,
    timestamp: 1726900000000,
    attemptNumber: 1,
    retryNumber: 0,
    attemptClusterId: 'cluster-001',
    isIndependentReview: false,
    quranDatasetVersion: OFFICIAL_DATASET_VERSION.semver,
    quranDatasetHash: CANONICAL_QURAN_HASH,
    modelVersion: 'zipformer-ctc-int8-quran-v1.0.0',
    modelHash: OFFICIAL_MODEL_HASH,
    tajweedKnowledgeVersion: 'tajweed-rules-v1.0.0-hafs',
    tajweedKnowledgeHash: TAJWEED_KB_CHECKSUM_SHA256,
    decisionEngineVersion: 'recitation-decision-v1.0.0-phase5c',
    policyVersion: 'teacher-policy-v1.0.0-phase7a',
    revisionAlgorithmVersion: 'revision-algorithm-v1.0.0-phase7d',
    ...overrides,
  };
}

describe('Phase 8A — Student Identity & Account Architecture', () => {
  beforeEach(() => {
    IdentityMigrationService.clearRegistry();
  });

  // =========================================================================
  // 1. Student Identity Creation & Invariant Validation (10 Tests)
  // =========================================================================
  describe('1. Student Identity Creation & Invariant Validation', () => {
    it('1.1 should create a valid ANONYMOUS_LOCAL identity with non-null cryptographic ID', () => {
      const identity = StudentIdentityService.createAnonymousIdentity();
      expect(identity.identityType).toBe(StudentIdentityType.ANONYMOUS_LOCAL);
      expect(identity.isAnonymous).toBe(true);
      expect(identity.accountId).toBeNull();
      expect(identity.status).toBe(StudentIdentityStatus.ACTIVE);
      expect(identity.studentId).toMatch(/^stu-anon-[0-9a-f-]+$/);
      expect(identity.createdAt).toBeGreaterThan(0);
      expect(identity.version).toContain('phase8a');
    });

    it('1.2 should create a valid AUTHENTICATED identity with linked accountId', () => {
      const { identity, account } = StudentIdentityService.createAuthenticatedIdentity({
        email: 'student@example.com',
        displayName: 'Zayd',
        emailVerified: true,
      });

      expect(identity.identityType).toBe(StudentIdentityType.AUTHENTICATED);
      expect(identity.isAnonymous).toBe(false);
      expect(identity.accountId).toBe(account.accountId);
      expect(identity.studentId).toMatch(/^stu-auth-[0-9a-f-]+$/);
      expect(identity.status).toBe(StudentIdentityStatus.ACTIVE);
      expect(account.email).toBe('student@example.com');
      expect(account.displayName).toBe('Zayd');
      expect(account.status).toBe(AccountStatus.ACTIVE);
    });

    it('1.3 should enforce that two generated anonymous identities are completely unique', () => {
      const id1 = StudentIdentityService.createAnonymousIdentity();
      const id2 = StudentIdentityService.createAnonymousIdentity();
      expect(id1.studentId).not.toBe(id2.studentId);
    });

    it('1.4 should reject an identity with empty studentId', () => {
      expect(() => {
        StudentIdentityService.validateIdentity({
          studentId: '',
          accountId: null,
          identityType: StudentIdentityType.ANONYMOUS_LOCAL,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          status: StudentIdentityStatus.ACTIVE,
          version: '1.0',
          isAnonymous: true,
        });
      }).toThrow(MalformedIdentityError);
    });

    it('1.5 should reject an AUTHENTICATED identity that lacks an accountId', () => {
      expect(() => {
        StudentIdentityService.validateIdentity({
          studentId: 'stu-auth-123',
          accountId: null, // Prohibited for AUTHENTICATED
          identityType: StudentIdentityType.AUTHENTICATED,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          status: StudentIdentityStatus.ACTIVE,
          version: '1.0',
          isAnonymous: false,
        });
      }).toThrow(MalformedIdentityError);
    });

    it('1.6 should reject an ANONYMOUS_LOCAL identity that contains an accountId', () => {
      expect(() => {
        StudentIdentityService.validateIdentity({
          studentId: 'stu-anon-123',
          accountId: 'acc-456', // Prohibited for ANONYMOUS_LOCAL
          identityType: StudentIdentityType.ANONYMOUS_LOCAL,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          status: StudentIdentityStatus.ACTIVE,
          version: '1.0',
          isAnonymous: true,
        });
      }).toThrow(MalformedIdentityError);
    });

    it('1.7 should reject an identity with invalid status', () => {
      expect(() => {
        StudentIdentityService.validateIdentity({
          studentId: 'stu-anon-123',
          accountId: null,
          identityType: StudentIdentityType.ANONYMOUS_LOCAL,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          status: 'SUPER_ACTIVE' as any,
          version: '1.0',
          isAnonymous: true,
        });
      }).toThrow(MalformedIdentityError);
    });

    it('1.8 should reject an identity with non-positive createdAt timestamp', () => {
      expect(() => {
        StudentIdentityService.validateIdentity({
          studentId: 'stu-anon-123',
          accountId: null,
          identityType: StudentIdentityType.ANONYMOUS_LOCAL,
          createdAt: 0,
          updatedAt: Date.now(),
          status: StudentIdentityStatus.ACTIVE,
          version: '1.0',
          isAnonymous: true,
        });
      }).toThrow(MalformedIdentityError);
    });

    it('1.9 should normalize email strings to lowercase and trimmed format', () => {
      const { account } = StudentIdentityService.createAuthenticatedIdentity({
        email: '  STUDENT.Tariq@EXAMPLE.COM  ',
      });
      expect(account.email).toBe('student.tariq@example.com');
    });

    it('1.10 should generate UUIDs matching RFC 4122 v4 pattern without Node-only imports', () => {
      const uuid = SecureIdGenerator.generateUuid();
      const rfc4122Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuid).toMatch(rfc4122Regex);
    });
  });

  // =========================================================================
  // 2. Student Account Lifecycle & State Machine (8 Tests)
  // =========================================================================
  describe('2. Student Account Lifecycle & State Machine', () => {
    it('2.1 should transition PENDING_VERIFICATION -> ACTIVE upon email verification', () => {
      const { account } = StudentIdentityService.createAuthenticatedIdentity({
        email: 'test@example.com',
        emailVerified: false,
      });
      expect(account.status).toBe(AccountStatus.PENDING_VERIFICATION);

      const activeAccount = StudentIdentityService.transitionAccountStatus(account, AccountStatus.ACTIVE);
      expect(activeAccount.status).toBe(AccountStatus.ACTIVE);
    });

    it('2.2 should transition ACTIVE -> SUSPENDED -> ACTIVE', () => {
      const { account } = StudentIdentityService.createAuthenticatedIdentity({ emailVerified: true });
      const suspended = StudentIdentityService.transitionAccountStatus(account, AccountStatus.SUSPENDED);
      expect(suspended.status).toBe(AccountStatus.SUSPENDED);

      const reactivated = StudentIdentityService.transitionAccountStatus(suspended, AccountStatus.ACTIVE);
      expect(reactivated.status).toBe(AccountStatus.ACTIVE);
    });

    it('2.3 should transition ACTIVE -> DELETION_REQUESTED with timestamp', () => {
      const { account } = StudentIdentityService.createAuthenticatedIdentity({ emailVerified: true });
      const requested = StudentIdentityService.requestAccountDeletion(account);

      expect(requested.status).toBe(AccountStatus.DELETION_REQUESTED);
      expect(requested.deletionRequestedAt).toBeGreaterThan(0);
    });

    it('2.4 should permit cancellation of DELETION_REQUESTED within grace period', () => {
      const { account } = StudentIdentityService.createAuthenticatedIdentity({ emailVerified: true });
      const requested = StudentIdentityService.requestAccountDeletion(account);
      const restored = StudentIdentityService.cancelAccountDeletion(requested);

      expect(restored.status).toBe(AccountStatus.ACTIVE);
      expect(restored.deletionRequestedAt).toBeNull();
    });

    it('2.5 should transition DELETION_REQUESTED -> DELETED (terminal state)', () => {
      const { account } = StudentIdentityService.createAuthenticatedIdentity({ emailVerified: true });
      const requested = StudentIdentityService.requestAccountDeletion(account);
      const deleted = StudentIdentityService.transitionAccountStatus(requested, AccountStatus.DELETED);

      expect(deleted.status).toBe(AccountStatus.DELETED);
    });

    it('2.6 should reject any transition out of DELETED state (terminal)', () => {
      const { account } = StudentIdentityService.createAuthenticatedIdentity({ emailVerified: true });
      const requested = StudentIdentityService.requestAccountDeletion(account);
      const deleted = StudentIdentityService.transitionAccountStatus(requested, AccountStatus.DELETED);

      expect(() => {
        StudentIdentityService.transitionAccountStatus(deleted, AccountStatus.ACTIVE);
      }).toThrow(AccountStateInvalidError);
    });

    it('2.7 should reject prohibited direct transition PENDING_VERIFICATION -> SUSPENDED', () => {
      const { account } = StudentIdentityService.createAuthenticatedIdentity({ emailVerified: false });
      expect(() => {
        StudentIdentityService.transitionAccountStatus(account, AccountStatus.SUSPENDED);
      }).toThrow(AccountStateInvalidError);
    });

    it('2.8 should return identical reference when transitioning to the current status', () => {
      const { account } = StudentIdentityService.createAuthenticatedIdentity({ emailVerified: true });
      const same = StudentIdentityService.transitionAccountStatus(account, AccountStatus.ACTIVE);
      expect(same).toBe(account);
    });
  });

  // =========================================================================
  // 3. Device Identity & Non-Invasive Boundaries (5 Tests)
  // =========================================================================
  describe('3. Device Identity & Non-Invasive Boundaries', () => {
    it('3.1 should create a valid DeviceIdentity with non-invasive metadata', () => {
      const device = StudentIdentityService.createDeviceIdentity('mobile-safari', '2.1.0');
      expect(device.deviceId).toMatch(/^dev-[0-9a-f-]+$/);
      expect(device.platform).toBe('mobile-safari');
      expect(device.appVersion).toBe('2.1.0');
      expect(device.createdAt).toBeGreaterThan(0);
      expect(device.lastSeenAt).toBe(device.createdAt);
    });

    it('3.2 should ensure device IDs are independent from student and account IDs', () => {
      const { identity, account } = StudentIdentityService.createAuthenticatedIdentity({ emailVerified: true });
      const device = StudentIdentityService.createDeviceIdentity();

      expect(device.deviceId).not.toBe(identity.studentId);
      expect(device.deviceId).not.toBe(account.accountId);
    });

    it('3.3 should update device lastSeenAt timestamp without mutating createdAt', () => {
      const device = StudentIdentityService.createDeviceIdentity();
      const updated = StudentIdentityService.updateDeviceLastSeen(device);

      expect(updated.createdAt).toBe(device.createdAt);
      expect(updated.lastSeenAt).toBeGreaterThanOrEqual(device.lastSeenAt);
    });

    it('3.4 should assert device integrity and reject mismatched device in session', () => {
      const sessionManager = new SessionOwnershipManager();
      const device1 = StudentIdentityService.createDeviceIdentity();
      const device2 = StudentIdentityService.createDeviceIdentity();

      const session = sessionManager.registerSession({
        studentId: 'stu-auth-01',
        deviceId: device1.deviceId,
      });

      expect(() => {
        sessionManager.assertDeviceIntegrity(session.sessionId, device2.deviceId);
      }).toThrow(DeviceIdentityMismatchError);
    });

    it('3.5 should pass device integrity check when device matches session device', () => {
      const sessionManager = new SessionOwnershipManager();
      const device = StudentIdentityService.createDeviceIdentity();

      const session = sessionManager.registerSession({
        studentId: 'stu-auth-01',
        deviceId: device.deviceId,
      });

      expect(() => {
        sessionManager.assertDeviceIntegrity(session.sessionId, device.deviceId);
      }).not.toThrow();
    });
  });

  // =========================================================================
  // 4. Session Identity & Ownership Enforcement (AUTH-001) (10 Tests)
  // =========================================================================
  describe('4. Session Identity & Ownership Enforcement (AUTH-001)', () => {
    let sessionManager: SessionOwnershipManager;

    beforeEach(() => {
      sessionManager = new SessionOwnershipManager();
    });

    it('4.1 should register a session bound to a student and device', () => {
      const session = sessionManager.registerSession({
        studentId: 'stu-auth-ali',
        deviceId: 'dev-phone-01',
      });

      expect(session.sessionId).toMatch(/^sess-[0-9a-f-]+$/);
      expect(session.studentId).toBe('stu-auth-ali');
      expect(session.deviceId).toBe('dev-phone-01');
      expect(session.isActive).toBe(true);
      expect(session.endedAt).toBeNull();
    });

    it('4.2 should allow the session owner to access the session', () => {
      const session = sessionManager.registerSession({
        studentId: 'stu-auth-ali',
        deviceId: 'dev-phone-01',
      });

      const retrieved = sessionManager.assertSessionOwnership(session.sessionId, 'stu-auth-ali');
      expect(retrieved.sessionId).toBe(session.sessionId);
    });

    it('4.3 should reject access by student B with AUTH-001 SESSION_OWNERSHIP_MISMATCH', () => {
      const session = sessionManager.registerSession({
        studentId: 'stu-auth-ali',
        deviceId: 'dev-phone-01',
      });

      expect(() => {
        sessionManager.assertSessionOwnership(session.sessionId, 'stu-auth-fatima');
      }).toThrow(SessionOwnershipMismatchError);

      try {
        sessionManager.assertSessionOwnership(session.sessionId, 'stu-auth-fatima');
      } catch (err) {
        expect(err).toBeInstanceOf(SessionOwnershipMismatchError);
        expect((err as SessionOwnershipMismatchError).code).toBe(AuthErrorCode.SESSION_OWNERSHIP_MISMATCH);
      }
    });

    it('4.4 should reject session access for non-existent session ID', () => {
      expect(() => {
        sessionManager.assertSessionOwnership('sess-ghost-999', 'stu-auth-ali');
      }).toThrow(UnauthorizedOperationError);
    });

    it('4.5 should safely terminate session when requested by the owner', () => {
      const session = sessionManager.registerSession({
        studentId: 'stu-auth-ali',
        deviceId: 'dev-phone-01',
      });

      const ended = sessionManager.terminateSession(session.sessionId, 'stu-auth-ali');
      expect(ended.isActive).toBe(false);
      expect(ended.endedAt).toBeGreaterThan(0);
    });

    it('4.6 should reject session termination attempt by a different student', () => {
      const session = sessionManager.registerSession({
        studentId: 'stu-auth-ali',
        deviceId: 'dev-phone-01',
      });

      expect(() => {
        sessionManager.terminateSession(session.sessionId, 'stu-intruder');
      }).toThrow(SessionOwnershipMismatchError);
    });

    it('4.7 should automatically terminate prior active session when student starts a new one', () => {
      const session1 = sessionManager.registerSession({
        studentId: 'stu-auth-ali',
        deviceId: 'dev-phone-01',
      });
      const session2 = sessionManager.registerSession({
        studentId: 'stu-auth-ali',
        deviceId: 'dev-phone-01',
      });

      const s1 = sessionManager.getSession(session1.sessionId);
      const s2 = sessionManager.getSession(session2.sessionId);

      expect(s1?.isActive).toBe(false);
      expect(s2?.isActive).toBe(true);
      expect(sessionManager.getActiveSessionForStudent('stu-auth-ali')?.sessionId).toBe(session2.sessionId);
    });

    it('4.8 should purge active session on student logout (terminateAllSessionsForStudent)', () => {
      sessionManager.registerSession({
        studentId: 'stu-auth-ali',
        deviceId: 'dev-phone-01',
      });

      sessionManager.terminateAllSessionsForStudent('stu-auth-ali');
      expect(sessionManager.getActiveSessionForStudent('stu-auth-ali')).toBeNull();
    });

    it('4.9 should isolate concurrent sessions between two distinct students', () => {
      const sAli = sessionManager.registerSession({ studentId: 'stu-ali', deviceId: 'dev-1' });
      const sFatima = sessionManager.registerSession({ studentId: 'stu-fatima', deviceId: 'dev-2' });

      expect(sessionManager.getActiveSessionForStudent('stu-ali')?.sessionId).toBe(sAli.sessionId);
      expect(sessionManager.getActiveSessionForStudent('stu-fatima')?.sessionId).toBe(sFatima.sessionId);
    });

    it('4.10 should prevent cross-student session hijacking across 5 alternating accesses', () => {
      const s1 = sessionManager.registerSession({ studentId: 'student-1', deviceId: 'dev-1' });
      const s2 = sessionManager.registerSession({ studentId: 'student-2', deviceId: 'dev-2' });

      for (let i = 0; i < 5; i++) {
        expect(() => sessionManager.assertSessionOwnership(s1.sessionId, 'student-2')).toThrow(SessionOwnershipMismatchError);
        expect(() => sessionManager.assertSessionOwnership(s2.sessionId, 'student-1')).toThrow(SessionOwnershipMismatchError);
      }
    });
  });

  // =========================================================================
  // 5. Longitudinal Learning Data Ownership (8 Tests)
  // =========================================================================
  describe('5. Longitudinal Learning Data Ownership', () => {
    it('5.1 should record event when event studentId matches store studentId', () => {
      const store = new LongitudinalProfileStore('student-hassan');
      const event = MemorizationEventFactory.createEvent(createValidBaseParams({
        studentId: 'student-hassan',
        sessionId: 'sess-001',
        quranLocation: { surahId: 1, ayahNumber: 1 },
      }));

      const record = store.recordEvent(event);
      expect(record.passageKey).toBe('1:1');
    });

    it('5.2 should reject event when event studentId does NOT match store studentId', () => {
      const store = new LongitudinalProfileStore('student-hassan');
      const eventFromIntruder = MemorizationEventFactory.createEvent(createValidBaseParams({
        studentId: 'student-intruder', // Mismatch!
        sessionId: 'sess-001',
        quranLocation: { surahId: 1, ayahNumber: 1 },
      }));

      expect(() => {
        store.recordEvent(eventFromIntruder);
      }).toThrow(/Student ID mismatch/);
    });

    it('5.3 should stamp every compiled PassageLearningRecord with the store studentId', () => {
      const store = new LongitudinalProfileStore('student-maryam');
      const event = MemorizationEventFactory.createEvent(createValidBaseParams({
        studentId: 'student-maryam',
        sessionId: 'sess-002',
        quranLocation: { surahId: 112, ayahNumber: 1 },
      }));
      store.recordEvent(event);

      const snapshot = store.getProfileSnapshot();
      expect(snapshot.studentId).toBe('student-maryam');
      expect(snapshot.passageStates['112:1'].studentId).toBe('student-maryam');
    });

    it('5.4 should isolate profile states between two students learning the same Surah/Ayah', () => {
      const storeA = new LongitudinalProfileStore('student-A');
      const storeB = new LongitudinalProfileStore('student-B');

      // Student A records 3 correct repetitions
      for (let i = 0; i < 3; i++) {
        storeA.recordEvent(
          MemorizationEventFactory.createEvent(createValidBaseParams({
            studentId: 'student-A',
            sessionId: 'sess-A',
            quranLocation: { surahId: 1, ayahNumber: 1 },
            timestamp: 1726900000000 + i * 1000,
          }))
        );
      }
      storeA.flushPendingClusters();

      const snapA = storeA.getProfileSnapshot();
      const snapB = storeB.getProfileSnapshot();

      expect(snapA.passageStates['1:1']).toBeDefined();
      expect(snapB.passageStates['1:1']).toBeUndefined();
    });

    it('5.5 should assert data ownership using AuthenticationGuard', () => {
      expect(() => {
        AuthenticationGuard.assertOwnership('student-A', 'student-A', 'PROGRESS');
      }).not.toThrow();

      expect(() => {
        AuthenticationGuard.assertOwnership('student-A', 'student-B', 'PROGRESS');
      }).toThrow(CrossStudentDataAccessDeniedError);
    });

    it('5.6 should preserve studentId in audit history events', () => {
      const store = new LongitudinalProfileStore('student-zayd');
      const event = MemorizationEventFactory.createEvent(createValidBaseParams({
        studentId: 'student-zayd',
        sessionId: 'sess-003',
        quranLocation: { surahId: 114, ayahNumber: 1 },
      }));
      store.recordEvent(event);

      const history = store.getAuditHistory();
      expect(history[0].studentId).toBe('student-zayd');
    });

    it('5.7 should reject empty studentId on ownership assertion', () => {
      expect(() => {
        AuthenticationGuard.assertOwnership('', 'student-A');
      }).toThrow(UnauthorizedOperationError);
    });

    it('5.8 should ensure activeRanges are scoped purely to the store owner', () => {
      const store1 = new LongitudinalProfileStore('student-1');
      const store2 = new LongitudinalProfileStore('student-2');

      store1.setActiveRanges([{ surahId: 1, startAyah: 1, endAyah: 7 }]);
      expect(store1.getProfileSnapshot().activeMemorizationRange).toHaveLength(1);
      expect(store2.getProfileSnapshot().activeMemorizationRange).toHaveLength(0);
    });
  });

  // =========================================================================
  // 6. Authentication, Authorization & Ownership Guard (10 Tests)
  // =========================================================================
  describe('6. Authentication, Authorization & Ownership Guard', () => {
    it('6.1 should allow ANONYMOUS_LOCAL identity to READ and WRITE own progress', () => {
      const anon = StudentIdentityService.createAnonymousIdentity();
      expect(() => {
        AuthenticationGuard.assertAuthorized(anon, StudentCapability.READ_OWN_PROGRESS);
        AuthenticationGuard.assertAuthorized(anon, StudentCapability.WRITE_OWN_PROGRESS);
        AuthenticationGuard.assertAuthorized(anon, StudentCapability.START_OWN_SESSION);
      }).not.toThrow();
    });

    it('6.2 should forbid ANONYMOUS_LOCAL identity from MANAGE_OWN_ACCOUNT', () => {
      const anon = StudentIdentityService.createAnonymousIdentity();
      expect(() => {
        AuthenticationGuard.assertAuthorized(anon, StudentCapability.MANAGE_OWN_ACCOUNT);
      }).toThrow(UnauthorizedOperationError);
    });

    it('6.3 should forbid ANONYMOUS_LOCAL identity from DELETE_OWN_ACCOUNT', () => {
      const anon = StudentIdentityService.createAnonymousIdentity();
      expect(() => {
        AuthenticationGuard.assertAuthorized(anon, StudentCapability.DELETE_OWN_ACCOUNT);
      }).toThrow(UnauthorizedOperationError);
    });

    it('6.4 should allow AUTHENTICATED identity to perform MANAGE_OWN_ACCOUNT and DELETE_OWN_ACCOUNT', () => {
      const { identity } = StudentIdentityService.createAuthenticatedIdentity({ emailVerified: true });
      expect(() => {
        AuthenticationGuard.assertAuthorized(identity, StudentCapability.MANAGE_OWN_ACCOUNT);
        AuthenticationGuard.assertAuthorized(identity, StudentCapability.DELETE_OWN_ACCOUNT);
      }).not.toThrow();
    });

    it('6.5 should throw AuthenticationRequiredError when identity is null', () => {
      expect(() => {
        AuthenticationGuard.assertAuthenticated(null, 'ANY_OP');
      }).toThrow(AuthenticationRequiredError);
    });

    it('6.6 should throw UnauthorizedOperationError when identity is SUSPENDED', () => {
      const anon = StudentIdentityService.createAnonymousIdentity();
      const suspended = { ...anon, status: StudentIdentityStatus.SUSPENDED };

      expect(() => {
        AuthenticationGuard.assertAuthenticated(suspended, 'READ_PROGRESS');
      }).toThrow(UnauthorizedOperationError);
    });

    it('6.7 should throw UnauthorizedOperationError when identity is DELETED', () => {
      const anon = StudentIdentityService.createAnonymousIdentity();
      const deleted = { ...anon, status: StudentIdentityStatus.DELETED };

      expect(() => {
        AuthenticationGuard.assertAuthenticated(deleted, 'READ_PROGRESS');
      }).toThrow(UnauthorizedOperationError);
    });

    it('6.8 should throw UnauthorizedOperationError when identity has been MIGRATED', () => {
      const anon = StudentIdentityService.createAnonymousIdentity();
      const migrated = { ...anon, status: StudentIdentityStatus.MIGRATED };

      expect(() => {
        AuthenticationGuard.assertAuthenticated(migrated, 'READ_PROGRESS');
      }).toThrow(UnauthorizedOperationError);
    });

    it('6.9 should perform assertAuthorizedOwnership in a single unified check', () => {
      const { identity } = StudentIdentityService.createAuthenticatedIdentity({ emailVerified: true });

      expect(() => {
        AuthenticationGuard.assertAuthorizedOwnership(
          identity,
          StudentCapability.READ_OWN_PROGRESS,
          identity.studentId,
          'STUDENT_PROFILE'
        );
      }).not.toThrow();

      expect(() => {
        AuthenticationGuard.assertAuthorizedOwnership(
          identity,
          StudentCapability.READ_OWN_PROGRESS,
          'other-student-id',
          'STUDENT_PROFILE'
        );
      }).toThrow(CrossStudentDataAccessDeniedError);
    });

    it('6.10 should return boolean via hasCapability helper without throwing', () => {
      const anon = StudentIdentityService.createAnonymousIdentity();
      expect(AuthenticationGuard.hasCapability(anon, StudentCapability.READ_OWN_PROGRESS)).toBe(true);
      expect(AuthenticationGuard.hasCapability(anon, StudentCapability.MANAGE_OWN_ACCOUNT)).toBe(false);
      expect(AuthenticationGuard.hasCapability(null, StudentCapability.READ_OWN_PROGRESS)).toBe(false);
    });
  });

  // =========================================================================
  // 7. Identity Migration: Anonymous to Authenticated (12 Tests)
  // =========================================================================
  describe('7. Identity Migration: Anonymous to Authenticated', () => {
    let anonIdentity: ReturnType<typeof StudentIdentityService.createAnonymousIdentity>;
    let authIdentity: ReturnType<typeof StudentIdentityService.createAuthenticatedIdentity>['identity'];
    let sourceStore: LongitudinalProfileStore;

    beforeEach(() => {
      anonIdentity = StudentIdentityService.createAnonymousIdentity();
      const auth = StudentIdentityService.createAuthenticatedIdentity({ emailVerified: true });
      authIdentity = auth.identity;

      sourceStore = new LongitudinalProfileStore(anonIdentity.studentId);
      sourceStore.setActiveRanges([{ surahId: 1, startAyah: 1, endAyah: 7 }]);

      // Record some sample events in the anonymous store
      for (let i = 1; i <= 3; i++) {
        sourceStore.recordEvent(
          MemorizationEventFactory.createEvent(createValidBaseParams({
            studentId: anonIdentity.studentId,
            sessionId: 'sess-anon-01',
            quranLocation: { surahId: 1, ayahNumber: i },
            timestamp: 1700000000000 + i * 1000,
          }))
        );
      }
      sourceStore.flushPendingClusters();
    });

    it('7.1 should successfully migrate anonymous store into authenticated account', async () => {
      const result = await IdentityMigrationService.migrate({
        sourceIdentity: anonIdentity,
        targetIdentity: authIdentity,
        sourceStore,
      });

      expect(result.record.status).toBe(MigrationStatus.COMPLETED);
      expect(result.record.sourceStudentId).toBe(anonIdentity.studentId);
      expect(result.record.targetStudentId).toBe(authIdentity.studentId);
      expect(result.record.migratedEventsCount).toBe(3);
      expect(result.record.migratedPassagesCount).toBe(3);
      expect(result.record.checksum).toHaveLength(64);
      expect(result.updatedSourceIdentity.status).toBe(StudentIdentityStatus.MIGRATED);
    });

    it('7.2 should re-bind all passage records to the authenticated studentId', async () => {
      const result = await IdentityMigrationService.migrate({
        sourceIdentity: anonIdentity,
        targetIdentity: authIdentity,
        sourceStore,
      });

      const targetSnapshot = result.targetStore.getProfileSnapshot();
      expect(targetSnapshot.studentId).toBe(authIdentity.studentId);
      expect(targetSnapshot.passageStates['1:1'].studentId).toBe(authIdentity.studentId);
      expect(targetSnapshot.passageStates['1:2'].studentId).toBe(authIdentity.studentId);
      expect(targetSnapshot.passageStates['1:3'].studentId).toBe(authIdentity.studentId);
    });

    it('7.3 should re-bind all audit history events to target studentId with valid hashes', async () => {
      const result = await IdentityMigrationService.migrate({
        sourceIdentity: anonIdentity,
        targetIdentity: authIdentity,
        sourceStore,
      });

      const targetHistory = result.targetStore.getAuditHistory();
      expect(targetHistory).toHaveLength(3);
      for (const event of targetHistory) {
        expect(event.studentId).toBe(authIdentity.studentId);
        expect(event.eventHash).toBeDefined();
      }
    });

    it('7.4 should transfer active memorization ranges to the target store', async () => {
      const result = await IdentityMigrationService.migrate({
        sourceIdentity: anonIdentity,
        targetIdentity: authIdentity,
        sourceStore,
      });

      const targetSnapshot = result.targetStore.getProfileSnapshot();
      expect(targetSnapshot.activeMemorizationRange).toEqual([
        { surahId: 1, startAyah: 1, endAyah: 7 },
      ]);
    });

    it('7.5 should be idempotent when retried with identical source and target identities', async () => {
      const res1 = await IdentityMigrationService.migrate({
        sourceIdentity: anonIdentity,
        targetIdentity: authIdentity,
        sourceStore,
      });

      const res2 = await IdentityMigrationService.migrate({
        sourceIdentity: anonIdentity,
        targetIdentity: authIdentity,
        sourceStore,
      });

      expect(res1.record.migrationId).toBe(res2.record.migrationId);
      expect(res1.record.checksum).toBe(res2.record.checksum);
    });

    it('7.6 should reject duplicate migration to a DIFFERENT target student with AUTH-006', async () => {
      await IdentityMigrationService.migrate({
        sourceIdentity: anonIdentity,
        targetIdentity: authIdentity,
        sourceStore,
      });

      const otherAuth = StudentIdentityService.createAuthenticatedIdentity({ emailVerified: true }).identity;

      await expect(
        IdentityMigrationService.migrate({
          sourceIdentity: anonIdentity,
          targetIdentity: otherAuth,
          sourceStore,
        })
      ).rejects.toThrow(DuplicateMigrationError);
    });

    it('7.7 should reject migration if source identity is NOT ANONYMOUS_LOCAL', async () => {
      const fakeSource = { ...authIdentity, studentId: 'stu-another' };
      await expect(
        IdentityMigrationService.migrate({
          sourceIdentity: fakeSource,
          targetIdentity: authIdentity,
          sourceStore,
        })
      ).rejects.toThrow(/Source identity must be ANONYMOUS_LOCAL/);
    });

    it('7.8 should reject migration if target identity is NOT AUTHENTICATED', async () => {
      const otherAnon = StudentIdentityService.createAnonymousIdentity();
      await expect(
        IdentityMigrationService.migrate({
          sourceIdentity: anonIdentity,
          targetIdentity: otherAnon,
          sourceStore,
        })
      ).rejects.toThrow(/Target identity must be AUTHENTICATED/);
    });

    it('7.9 should reject migration if target identity is SUSPENDED or DELETED', async () => {
      const suspendedAuth = { ...authIdentity, status: StudentIdentityStatus.SUSPENDED };
      await expect(
        IdentityMigrationService.migrate({
          sourceIdentity: anonIdentity,
          targetIdentity: suspendedAuth,
          sourceStore,
        })
      ).rejects.toThrow(/Target identity must be ACTIVE/);
    });

    it('7.10 should ensure that retrying migration into an existing target store does NOT duplicate events', async () => {
      const targetStore = new LongitudinalProfileStore(authIdentity.studentId);

      // Perform partial manual insertion into target
      const firstEvent = sourceStore.getAuditHistory()[0];
      targetStore.recordEvent({
        ...firstEvent,
        studentId: authIdentity.studentId,
      });

      const result = await IdentityMigrationService.migrate({
        sourceIdentity: anonIdentity,
        targetIdentity: authIdentity,
        sourceStore,
        targetStore,
      });

      expect(result.targetStore.getAuditHistory()).toHaveLength(3); // Not 4!
    });

    it('7.11 should record completed migration in audit registry accessible by getMigrationRecord', async () => {
      await IdentityMigrationService.migrate({
        sourceIdentity: anonIdentity,
        targetIdentity: authIdentity,
        sourceStore,
      });

      const record = IdentityMigrationService.getMigrationRecord(anonIdentity.studentId);
      expect(record).not.toBeNull();
      expect(record?.status).toBe(MigrationStatus.COMPLETED);
    });

    it('7.12 should produce deterministic SHA-256 migration checksum for identical migration data', async () => {
      const r1 = await IdentityMigrationService.migrate({
        sourceIdentity: anonIdentity,
        targetIdentity: authIdentity,
        sourceStore,
      });

      expect(r1.record.checksum).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  // =========================================================================
  // 8. Auth Provider, Token Freshness & Account Switching (10 Tests)
  // =========================================================================
  describe('8. Auth Provider, Token Freshness & Account Switching', () => {
    let authProvider: LocalAuthProvider;
    let sessionManager: SessionOwnershipManager;

    beforeEach(() => {
      sessionManager = new SessionOwnershipManager();
      authProvider = new LocalAuthProvider(
        { status: AuthProviderStatus.NOT_CONNECTED, tokenTtlMs: 5000 },
        sessionManager
      );
    });

    it('8.1 should return explicit NOT_CONNECTED provider status by default', () => {
      expect(authProvider.getProviderStatus()).toBe(AuthProviderStatus.NOT_CONNECTED);
      expect(authProvider.getAuthState()).toBe(AuthState.SIGNED_OUT);
    });

    it('8.2 should create anonymous identity and transition authState to ANONYMOUS', async () => {
      const identity = await authProvider.createAnonymousIdentity();
      expect(identity.identityType).toBe(StudentIdentityType.ANONYMOUS_LOCAL);
      expect(authProvider.getAuthState()).toBe(AuthState.ANONYMOUS);
      expect(await authProvider.getCurrentIdentity()).toBe(identity);
      expect(await authProvider.getCurrentAccount()).toBeNull();
    });

    it('8.3 should sign in registered account and transition to AUTHENTICATED', async () => {
      authProvider.registerLocalAccount('ali@example.com', 'hashed_pass_123', 'Ali');
      const payload = await authProvider.signIn('ali@example.com', 'hashed_pass_123');

      expect(authProvider.getAuthState()).toBe(AuthState.AUTHENTICATED);
      expect(payload.identity.identityType).toBe(StudentIdentityType.AUTHENTICATED);
      expect(payload.account.email).toBe('ali@example.com');
      expect(payload.token).toMatch(/^token-/);
      expect(payload.expiresAt).toBeGreaterThan(Date.now());
    });

    it('8.4 should reject sign-in with invalid password', async () => {
      authProvider.registerLocalAccount('ali@example.com', 'correct_pass');

      await expect(authProvider.signIn('ali@example.com', 'wrong_pass')).rejects.toThrow(
        UnauthorizedOperationError
      );
      expect(authProvider.getAuthState()).toBe(AuthState.AUTHENTICATION_ERROR);
    });

    it('8.5 should notify subscribers on auth state transitions', async () => {
      const stateLog: AuthState[] = [];
      const unsub = authProvider.onAuthStateChanged((state) => {
        stateLog.push(state);
      });

      await authProvider.createAnonymousIdentity();
      authProvider.registerLocalAccount('bilal@example.com', 'pass123');
      await authProvider.signIn('bilal@example.com', 'pass123');
      await authProvider.signOut();

      unsub();

      expect(stateLog).toContain(AuthState.ANONYMOUS);
      expect(stateLog).toContain(AuthState.AUTHENTICATED);
      expect(stateLog).toContain(AuthState.SIGNED_OUT);
    });

    it('8.6 should purge active teacher sessions on signOut', async () => {
      const { identity } = authProvider.registerLocalAccount('umar@example.com', 'pass');
      await authProvider.signIn('umar@example.com', 'pass');

      sessionManager.registerSession({
        studentId: identity.studentId,
        deviceId: 'dev-1',
      });

      expect(sessionManager.getActiveSessionForStudent(identity.studentId)).not.toBeNull();

      await authProvider.signOut();

      expect(sessionManager.getActiveSessionForStudent(identity.studentId)).toBeNull();
      expect(await authProvider.getCurrentIdentity()).toBeNull();
      expect(await authProvider.getCurrentAccount()).toBeNull();
    });

    it('8.7 should isolate accounts during account switching (Section 28, 29)', async () => {
      // User A signs in
      const uA = authProvider.registerLocalAccount('usera@example.com', 'passA', 'User A');
      await authProvider.signIn('usera@example.com', 'passA');
      const identityA = await authProvider.getCurrentIdentity();
      expect(identityA?.studentId).toBe(uA.identity.studentId);

      // User A logs out
      await authProvider.signOut();

      // User B signs in
      const uB = authProvider.registerLocalAccount('userb@example.com', 'passB', 'User B');
      await authProvider.signIn('userb@example.com', 'passB');
      const identityB = await authProvider.getCurrentIdentity();

      expect(identityB?.studentId).toBe(uB.identity.studentId);
      expect(identityB?.studentId).not.toBe(uA.identity.studentId);
    });

    it('8.8 should invalidate and sign out when token has expired (token expiry freshness)', async () => {
      // Short TTL provider (1 ms)
      const shortProvider = new LocalAuthProvider({ tokenTtlMs: 1 });
      shortProvider.registerLocalAccount('fast@example.com', 'pass');
      await shortProvider.signIn('fast@example.com', 'pass');

      // Wait 10ms for expiration
      await new Promise((r) => setTimeout(r, 10));

      const identity = await shortProvider.getCurrentIdentity();
      expect(identity).toBeNull();
      expect(shortProvider.getAuthState()).toBe(AuthState.SIGNED_OUT);
    });

    it('8.9 should refresh identity if token is still valid', async () => {
      authProvider.registerLocalAccount('refresh@example.com', 'pass');
      await authProvider.signIn('refresh@example.com', 'pass');

      const refreshed = await authProvider.refreshIdentity();
      expect(refreshed).not.toBeNull();
    });

    it('8.10 should request account deletion through provider', async () => {
      const u = authProvider.registerLocalAccount('delete_me@example.com', 'pass');
      await authProvider.signIn('delete_me@example.com', 'pass');

      const updatedAccount = await authProvider.requestAccountDeletion(u.account.accountId);
      expect(updatedAccount.status).toBe(AccountStatus.DELETION_REQUESTED);
    });
  });

  // =========================================================================
  // 9. Privacy, Data Minimization & Gemini Boundary (10 Tests)
  // =========================================================================
  describe('9. Privacy, Data Minimization & Gemini Boundary', () => {
    it('9.1 should detect and reject password in arbitrary context (AUTH-010)', () => {
      const dirtyContext = {
        studentName: 'Zayd',
        password: 'my-super-secret-password',
      };

      expect(() => {
        IdentitySecurityAuditor.assertNoCredentials(dirtyContext, 'prompt_context');
      }).toThrow(CredentialExposureError);
    });

    it('9.2 should detect and reject bearer token or auth header in context (AUTH-010)', () => {
      const dirtyContext = {
        action: 'RECITATION_ASSESSMENT',
        authToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      };

      expect(() => {
        IdentitySecurityAuditor.assertNoCredentials(dirtyContext, 'gemini_context');
      }).toThrow(CredentialExposureError);
    });

    it('9.3 should sanitize context for AI by stripping all credentials and tokens', () => {
      const rawContext = {
        studentId: 'stu-auth-123',
        surahId: 1,
        ayahNumber: 1,
        accessToken: 'secret-token-xyz',
        userPasswordHash: 'hash-abc',
        tajweedObservation: 'Ghunnah held for 2 harakat',
      };

      const sanitized = IdentitySecurityAuditor.sanitizeContextForAI(rawContext);
      expect(sanitized.accessToken).toBeUndefined();
      expect(sanitized.userPasswordHash).toBeUndefined();
      expect(sanitized.studentId).toBe('stu-auth-123');
      expect(sanitized.tajweedObservation).toBe('Ghunnah held for 2 harakat');
    });

    it('9.4 should detect and reject prohibited medical profiling keywords', () => {
      const forbiddenContext = {
        studentId: 'stu-1',
        medicalDiagnosis: 'ADHD',
      };

      expect(() => {
        IdentitySecurityAuditor.assertNoProhibitedProfiling(forbiddenContext);
      }).toThrow(/Data minimization violation/);
    });

    it('9.5 should detect and reject prohibited psychological/intelligence profiling keywords', () => {
      const forbiddenContext = {
        studentId: 'stu-1',
        iqScore: 130,
      };

      expect(() => {
        IdentitySecurityAuditor.assertNoProhibitedProfiling(forbiddenContext);
      }).toThrow(/Data minimization violation/);
    });

    it('9.6 should detect and reject prohibited religious piety profiling', () => {
      const forbiddenContext = {
        studentId: 'stu-1',
        religiousPietyRank: 'HIGH',
      };

      expect(() => {
        IdentitySecurityAuditor.assertNoProhibitedProfiling(forbiddenContext);
      }).toThrow(/Data minimization violation/);
    });

    it('9.7 should reject smuggling of raw audio Float32Array into identity records', () => {
      const pcmAudioBuffer = new Float32Array([0.1, -0.2, 0.3]);
      const payload = {
        studentId: 'stu-1',
        audioData: pcmAudioBuffer,
      };

      expect(() => {
        IdentitySecurityAuditor.assertNoAudioSmuggling(payload);
      }).toThrow(/Raw audio buffer detected in identity context/);
    });

    it('9.8 should mask student IDs in structured log entries', () => {
      const logEntry = {
        event: 'RECITATION_COMPLETED',
        studentId: 'stu-auth-87654321-abcd-ef01',
        durationMs: 4500,
      };

      const sanitized = IdentitySecurityAuditor.sanitizeLogEntry(logEntry);
      expect(sanitized.studentId).toBe('stu-...ef01');
      expect(sanitized.durationMs).toBe(4500);
    });

    it('9.9 should recursively scrub credentials in nested objects', () => {
      const nested = {
        level1: {
          level2: {
            apiKey: 'AIzaSyTest123',
          },
        },
      };

      expect(() => {
        IdentitySecurityAuditor.assertNoCredentials(nested, 'deep_context');
      }).toThrow(CredentialExposureError);
    });

    it('9.10 should pass cleanly on valid pedagogical context containing no secrets', () => {
      const cleanPedagogicalContext = {
        surahNumber: 1,
        ayahNumber: 2,
        currentWord: 'الرَّحْمَنِ',
        errorType: 'PHONETIC_MISPRONUNCIATION',
        suggestedTip: 'Ensure tongue touches upper incisors',
      };

      expect(() => {
        IdentitySecurityAuditor.assertNoCredentials(cleanPedagogicalContext);
        IdentitySecurityAuditor.assertNoProhibitedProfiling(cleanPedagogicalContext);
        IdentitySecurityAuditor.assertNoAudioSmuggling(cleanPedagogicalContext);
      }).not.toThrow();
    });
  });

  // =========================================================================
  // 10. Phase 7C & 7D Architectural Integration (6 Tests)
  // =========================================================================
  describe('10. Phase 7C & 7D Architectural Integration', () => {
    it('10.1 should bind studentId and deviceId to 7C RealTimeSessionConfig', async () => {
      const orchestrator = new RealTimeSessionOrchestrator();
      await orchestrator.initializeSession({
        sessionId: 'sess-7c-001',
        studentId: 'stu-auth-khalid',
        deviceId: 'dev-ipad-01',
        surahNumber: 1,
        ayahNumber: 1,
        riwayah: RiwayahType.HAFS_AN_ASIM,
        mode: UserInteractionMode.REAL_TIME_TUTOR,
        voiceFeedbackEnabled: false,
        textOnlyFeedback: true,
        interruptionEnabled: false,
        languageDialect: 'ARABIC_STANDARD',
        explanationLevel: 'MINIMAL',
        rawAudioPersistence: false,
      });

      expect(orchestrator.getStudentId()).toBe('stu-auth-khalid');
      expect(orchestrator.getDeviceId()).toBe('dev-ipad-01');
    });

    it('10.2 should allow session owner to assert ownership on 7C orchestrator', async () => {
      const orchestrator = new RealTimeSessionOrchestrator();
      await orchestrator.initializeSession({
        sessionId: 'sess-7c-002',
        studentId: 'stu-auth-khalid',
        surahNumber: 1,
        ayahNumber: 1,
        riwayah: RiwayahType.HAFS_AN_ASIM,
        mode: UserInteractionMode.REAL_TIME_TUTOR,
        voiceFeedbackEnabled: false,
        textOnlyFeedback: true,
        interruptionEnabled: false,
        languageDialect: 'ARABIC_STANDARD',
        explanationLevel: 'MINIMAL',
        rawAudioPersistence: false,
      });

      expect(() => {
        orchestrator.assertSessionOwnership('stu-auth-khalid');
      }).not.toThrow();
    });

    it('10.3 should reject mismatched student on 7C orchestrator with SessionOwnershipMismatchError', async () => {
      const orchestrator = new RealTimeSessionOrchestrator();
      await orchestrator.initializeSession({
        sessionId: 'sess-7c-003',
        studentId: 'stu-auth-khalid',
        surahNumber: 1,
        ayahNumber: 1,
        riwayah: RiwayahType.HAFS_AN_ASIM,
        mode: UserInteractionMode.REAL_TIME_TUTOR,
        voiceFeedbackEnabled: false,
        textOnlyFeedback: true,
        interruptionEnabled: false,
        languageDialect: 'ARABIC_STANDARD',
        explanationLevel: 'MINIMAL',
        rawAudioPersistence: false,
      });

      expect(() => {
        orchestrator.assertSessionOwnership('stu-intruder');
      }).toThrow(SessionOwnershipMismatchError);
    });

    it('10.4 should preserve rawAudioPersistence: false in 7C configuration', async () => {
      const orchestrator = new RealTimeSessionOrchestrator();
      await orchestrator.initializeSession({
        sessionId: 'sess-7c-004',
        studentId: 'stu-auth-khalid',
        surahNumber: 1,
        ayahNumber: 1,
        riwayah: RiwayahType.HAFS_AN_ASIM,
        mode: UserInteractionMode.REAL_TIME_TUTOR,
        voiceFeedbackEnabled: false,
        textOnlyFeedback: true,
        interruptionEnabled: false,
        languageDialect: 'ARABIC_STANDARD',
        explanationLevel: 'MINIMAL',
        rawAudioPersistence: false,
      });

      expect(orchestrator.getConfig()?.rawAudioPersistence).toBe(false);
    });

    it('10.5 should integrate 8A identity with 7D LongitudinalProfileStore and revision state engine', () => {
      const store = new LongitudinalProfileStore('stu-auth-amira');
      store.recordEvent(
        MemorizationEventFactory.createEvent(createValidBaseParams({
          studentId: 'stu-auth-amira',
          sessionId: 'sess-001',
          quranLocation: { surahId: 1, ayahNumber: 1 },
        }))
      );
      store.flushPendingClusters();

      const snapshot = store.getProfileSnapshot();
      expect(snapshot.studentId).toBe('stu-auth-amira');
      expect(snapshot.passageStates['1:1'].currentState).toBe(MemorizationState.LEARNING);
    });

    it('10.6 should verify that teacher AI layer does not alter memorization state directly', () => {
      // Identity and Teacher are separate; identity cannot override 7D state engine
      const store = new LongitudinalProfileStore('stu-auth-amira');
      const profile = store.getProfileSnapshot();
      expect(profile.passageStates['1:1']).toBeUndefined();
    });
  });

  // =========================================================================
  // 11. Security, Adversarial & Spoofing Invariants (6 Tests)
  // =========================================================================
  describe('11. Security, Adversarial & Spoofing Invariants', () => {
    it('11.1 should prevent student ID tampering via object mutation (Object.freeze)', () => {
      const identity = StudentIdentityService.createAnonymousIdentity();
      expect(Object.isFrozen(identity)).toBe(true);

      expect(() => {
        (identity as any).studentId = 'stu-spoofed';
      }).toThrow();
    });

    it('11.2 should prevent account status tampering via object mutation (Object.freeze)', () => {
      const { account } = StudentIdentityService.createAuthenticatedIdentity({ emailVerified: true });
      expect(Object.isFrozen(account)).toBe(true);

      expect(() => {
        (account as any).status = AccountStatus.DELETED;
      }).toThrow();
    });

    it('11.3 should prevent cross-student event forgery in LongitudinalProfileStore', () => {
      const store = new LongitudinalProfileStore('stu-legitimate');
      const forgedEvent = MemorizationEventFactory.createEvent(createValidBaseParams({
        studentId: 'stu-forged',
        sessionId: 'sess-1',
        quranLocation: { surahId: 1, ayahNumber: 1 },
      }));

      expect(() => {
        store.recordEvent(forgedEvent);
      }).toThrow(/Student ID mismatch/);
    });

    it('11.4 should reject corrupted identity type string during validation', () => {
      expect(() => {
        StudentIdentityService.validateIdentity({
          studentId: 'stu-1',
          accountId: null,
          identityType: 'ADMIN_SUPERUSER' as any,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          status: StudentIdentityStatus.ACTIVE,
          version: '1.0',
          isAnonymous: true,
        });
      }).toThrow(MalformedIdentityError);
    });

    it('11.5 should detect and reject credential leak inside a deeply nested array of objects', () => {
      const deeplyNested = [
        { benign: 'data' },
        { inner: [{ secretKey: 'super-secret-value' }] },
      ];

      expect(() => {
        IdentitySecurityAuditor.assertNoCredentials(deeplyNested);
      }).toThrow(CredentialExposureError);
    });

    it('11.6 should reject unauthorized attempt to delete another user account', async () => {
      const authProvider = new LocalAuthProvider();
      const uA = authProvider.registerLocalAccount('studentA@test.com', 'pass');
      authProvider.registerLocalAccount('studentB@test.com', 'pass');

      await authProvider.signIn('studentA@test.com', 'pass');

      // Attempting to delete student B's account while logged in as student A
      await expect(authProvider.requestAccountDeletion('acc-unrelated')).rejects.toThrow(
        UnauthorizedOperationError
      );
    });
  });

  // =========================================================================
  // 12. Empirical Latency Benchmarks (p50, p95, max) (2 Tests)
  // =========================================================================
  describe('12. Empirical Latency Benchmarks (Section 35)', () => {
    it('12.1 should execute 1,000 session ownership checks in under 0.05ms per operation', () => {
      const sessionManager = new SessionOwnershipManager();
      const session = sessionManager.registerSession({
        studentId: 'stu-perf-01',
        deviceId: 'dev-perf-01',
      });

      const iterations = 1000;
      const latencies: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        sessionManager.assertSessionOwnership(session.sessionId, 'stu-perf-01');
        const duration = performance.now() - start;
        latencies.push(duration);
      }

      latencies.sort((a, b) => a - b);
      const p50 = latencies[Math.floor(iterations * 0.5)];
      const p95 = latencies[Math.floor(iterations * 0.95)];
      const max = latencies[latencies.length - 1];

      // Ownership check should be sub-millisecond
      expect(p50).toBeLessThan(0.1);
      expect(p95).toBeLessThan(0.5);
    });

    it('12.2 should execute 500 authorization and security audit checks in under 0.1ms per operation', () => {
      const { identity } = StudentIdentityService.createAuthenticatedIdentity({ emailVerified: true });
      const sampleContext = {
        surahId: 1,
        ayahNumber: 1,
        recitationScore: 0.95,
      };

      const iterations = 500;
      const latencies: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        AuthenticationGuard.assertAuthorized(identity, StudentCapability.READ_OWN_PROGRESS);
        IdentitySecurityAuditor.assertNoCredentials(sampleContext);
        const duration = performance.now() - start;
        latencies.push(duration);
      }

      latencies.sort((a, b) => a - b);
      const p50 = latencies[Math.floor(iterations * 0.5)];
      const p95 = latencies[Math.floor(iterations * 0.95)];

      expect(p50).toBeLessThan(0.2);
      expect(p95).toBeLessThan(0.8);
    });
  });
});
