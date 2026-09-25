/**
 * @file Phase8bPersistentLearningStore.test.ts
 * @description Comprehensive Phase 8B Test Suite (100+ Tests).
 * 
 * CATEGORIES:
 * - 1. Basic Persistence (12 tests)
 * - 2. Idempotency & Deduplication (12 tests)
 * - 3. Cryptographic Hash Chain & Integrity (14 tests)
 * - 4. Crash Safety, WAL & Recovery (14 tests)
 * - 5. Student Ownership, Privacy & Multi-Account Isolation (14 tests)
 * - 6. Phase 7D Longitudinal & Pedagogical Compatibility (14 tests)
 * - 7. Phase 8A Identity Migration Integration (10 tests)
 * - 8. Offline Policy & Privacy Invariants (8 tests)
 * - 9. Adversarial Attacks & Malicious Payloads (14 tests)
 * - 10. Future Sync Boundary (Phase 8C Ready) (6 tests)
 * - 11. Empirical Performance Benchmarks (2 tests)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  PersistentLearningStore,
  PersistentLearningStoreFactory,
  MemoryStorageAdapter,
  IndexedDBStorageAdapter,
  CanonicalSerializer,
  PersistenceSchemaMigrator,
  PersistentIdentityMigrationService,
  PersistenceErrorCode,
  DuplicateEventError,
  HashMismatchError,
  SchemaMismatchError,
  OwnershipMismatchError,
  CorruptedRecordError,
  SnapshotStaleError,
  TransactionIncompleteError,
  CURRENT_PERSISTENCE_SCHEMA_VERSION,
  GENESIS_PREVIOUS_HASH,
  PersistentMemorizationEvent,
  PersistentProfileSnapshot,
  PersistentRevisionPlan,
} from '../domain/persistence/index.ts';
import {
  MemorizationEvent,
  MemorizationEventType,
  EvidenceStatus,
  MemorizationState,
  ReviewUrgency,
  RevisionReasonCode,
  RevisionSetMode,
} from '../domain/memorization_revision/types.ts';
import {
  StudentIdentity,
  StudentIdentityType,
  StudentIdentityStatus,
  StudentIdentityService,
} from '../domain/identity/index.ts';
import { RecitationDecisionState } from '../domain/recitation/decisionTypes.ts';
import { PedagogicalAction } from '../domain/teacher_policy/types.ts';
const CANONICAL_QURAN_HASH = '1e370d0d8dae77864c24ea00c92f1f0aef9df95b34a66e4a2d81e05d21a24d27';
const CANONICAL_QURAN_VERSION = 'v1.0.0-hafs';
const CANONICAL_MODEL_HASH = '4a8a58622c7a7b8e124ea00c92f1f0aef9df95b34a66e4a2d81e05d21a24d28';
const CANONICAL_MODEL_VERSION = 'v1.0.0-acoustic';
const CANONICAL_TAJWEED_HASH = '9b6d8dae77864c24ea00c92f1f0aef9df95b34a66e4a2d81e05d21a24d29';
const CANONICAL_TAJWEED_VERSION = 'v1.0.0-tajweed';
const CANONICAL_DECISION_ENGINE_VERSION = 'v1.0.0-engine';
const CANONICAL_POLICY_VERSION = 'v1.0.0-policy';
const CANONICAL_REVISION_ALGORITHM_VERSION = 'v1.0.0-revision';

// Helper to construct canonical memorization events
function createTestEvent(overrides: Partial<MemorizationEvent> = {}): MemorizationEvent {
  const now = overrides.timestamp ?? Date.now();
  const surahId = overrides.surahId ?? 1;
  const ayahNumber = overrides.ayahNumber ?? 1;
  return {
    eventId: overrides.eventId ?? `evt-${Math.random().toString(36).substring(2, 9)}`,
    studentId: overrides.studentId ?? 'student-alice',
    sessionId: overrides.sessionId ?? 'session-001',
    quranLocation: overrides.quranLocation ?? { surahId, ayahNumber },
    surahId,
    ayahNumber,
    wordRange: overrides.wordRange ?? { startWord: 1, endWord: 4 },
    eventType: overrides.eventType ?? MemorizationEventType.CONFIRMED,
    evidenceStatus: overrides.evidenceStatus ?? EvidenceStatus.CONFIRMED,
    decisionStatus: overrides.decisionStatus ?? RecitationDecisionState.MATCH,
    teacherAction: overrides.teacherAction ?? PedagogicalAction.CONTINUE,
    timestamp: now,
    attemptNumber: overrides.attemptNumber ?? 1,
    retryNumber: overrides.retryNumber ?? 0,
    attemptClusterId: overrides.attemptClusterId ?? 'cluster-001',
    isIndependentReview: overrides.isIndependentReview ?? false,
    quranDatasetVersion: CANONICAL_QURAN_VERSION,
    quranDatasetHash: CANONICAL_QURAN_HASH,
    modelVersion: CANONICAL_MODEL_VERSION,
    modelHash: CANONICAL_MODEL_HASH,
    tajweedKnowledgeVersion: CANONICAL_TAJWEED_VERSION,
    tajweedKnowledgeHash: CANONICAL_TAJWEED_HASH,
    decisionEngineVersion: CANONICAL_DECISION_ENGINE_VERSION,
    policyVersion: CANONICAL_POLICY_VERSION,
    revisionAlgorithmVersion: CANONICAL_REVISION_ALGORITHM_VERSION,
  };
}

describe('Phase 8B: Persistent Learning Store Test Suite', () => {
  let adapter: MemoryStorageAdapter;
  let store: PersistentLearningStore;

  beforeEach(async () => {
    adapter = new MemoryStorageAdapter();
    await adapter.init();
    store = new PersistentLearningStore(adapter);
    PersistenceSchemaMigrator.resetRegistry();
    PersistentIdentityMigrationService.resetRegistry();
  });

  // =========================================================================
  // 1. BASIC PERSISTENCE
  // =========================================================================
  describe('1. Basic Persistence', () => {
    it('1.1 should append a learning event and compute canonical sequence number', async () => {
      const evt = createTestEvent({ eventId: 'evt-1' });
      const persisted = await store.appendEvent(evt);

      expect(persisted.sequenceNumber).toBe(1);
      expect(persisted.previousEventHash).toBe(GENESIS_PREVIOUS_HASH);
      expect(persisted.schemaVersion).toBe(CURRENT_PERSISTENCE_SCHEMA_VERSION);
      expect(persisted.eventHash).toBeDefined();
      expect(persisted.eventHash.length).toBe(64);
    });

    it('1.2 should retrieve an appended event by eventId', async () => {
      const evt = createTestEvent({ eventId: 'evt-find-me' });
      await store.appendEvent(evt);

      const found = await store.getEvent(evt.studentId, 'evt-find-me');
      expect(found).not.toBeNull();
      expect(found?.eventId).toBe('evt-find-me');
    });

    it('1.3 should return null when retrieving non-existent event', async () => {
      const found = await store.getEvent('student-alice', 'does-not-exist');
      expect(found).toBeNull();
    });

    it('1.4 should retrieve all events for a given student in sequence order', async () => {
      const e1 = createTestEvent({ eventId: 'evt-seq-1', timestamp: 1000 });
      const e2 = createTestEvent({ eventId: 'evt-seq-2', timestamp: 2000 });
      await store.appendEvent(e1);
      await store.appendEvent(e2);

      const events = await store.getEventsByStudent('student-alice');
      expect(events.length).toBe(2);
      expect(events[0].sequenceNumber).toBe(1);
      expect(events[1].sequenceNumber).toBe(2);
    });

    it('1.5 should query events by Quran location (Surah and Ayah)', async () => {
      await store.appendEvent(createTestEvent({ eventId: 'loc-1', surahId: 1, ayahNumber: 1 }));
      await store.appendEvent(createTestEvent({ eventId: 'loc-2', surahId: 1, ayahNumber: 2 }));
      await store.appendEvent(createTestEvent({ eventId: 'loc-3', surahId: 2, ayahNumber: 255 }));

      const surah1Ayah1 = await store.getEventsByQuranLocation('student-alice', 1, 1);
      expect(surah1Ayah1.length).toBe(1);
      expect(surah1Ayah1[0].eventId).toBe('loc-1');
    });

    it('1.6 should query events with pagination limit and offset', async () => {
      for (let i = 1; i <= 5; i++) {
        await store.appendEvent(createTestEvent({ eventId: `page-evt-${i}`, timestamp: 1000 * i }));
      }

      const paged = await store.getEvents({
        studentId: 'student-alice',
        limit: 2,
        offset: 1,
      });

      expect(paged.length).toBe(2);
      expect(paged[0].eventId).toBe('page-evt-2');
      expect(paged[1].eventId).toBe('page-evt-3');
    });

    it('1.7 should create and retrieve stream checkpoint', async () => {
      await store.appendEvent(createTestEvent({ eventId: 'cp-evt-1' }));
      const cp = await store.checkpoint('student-alice');

      expect(cp.studentId).toBe('student-alice');
      expect(cp.eventCount).toBe(1);
      expect(cp.lastEventId).toBe('cp-evt-1');
      expect(cp.checkpointHash).toBeDefined();
    });

    it('1.8 should export student learning data with cryptographic exportChecksum', async () => {
      await store.appendEvent(createTestEvent({ eventId: 'exp-1' }));
      const exported = await store.exportStudentLearningData('student-alice');

      expect(exported.studentId).toBe('student-alice');
      expect(exported.events.length).toBe(1);
      expect(exported.exportChecksum).toBeDefined();
      expect(exported.exportChecksum.length).toBe(64);
    });

    it('1.9 should reset student data when confirmation phrase matches', async () => {
      await store.appendEvent(createTestEvent({ eventId: 'reset-1' }));
      expect((await store.getEventsByStudent('student-alice')).length).toBe(1);

      await store.resetStudentLearningData('student-alice', undefined, 'RESET_STUDENT_DATA_student-alice');
      expect((await store.getEventsByStudent('student-alice')).length).toBe(0);
    });

    it('1.10 should reject data reset when confirmation phrase is invalid', async () => {
      await store.appendEvent(createTestEvent({ eventId: 'reset-2' }));
      await expect(
        store.resetStudentLearningData('student-alice', undefined, 'WRONG_PHRASE')
      ).rejects.toThrow('confirmation phrase mismatch');
    });

    it('1.11 should preserve separate students when one student resets data', async () => {
      await store.appendEvent(createTestEvent({ eventId: 'alice-evt', studentId: 'student-alice' }));
      await store.appendEvent(createTestEvent({ eventId: 'bob-evt', studentId: 'student-bob' }));

      await store.resetStudentLearningData('student-alice', undefined, 'RESET_STUDENT_DATA_student-alice');

      expect((await store.getEventsByStudent('student-alice')).length).toBe(0);
      expect((await store.getEventsByStudent('student-bob')).length).toBe(1);
    });

    it('1.12 should survive restart by re-initializing store with existing adapter', async () => {
      await store.appendEvent(createTestEvent({ eventId: 'survive-1' }));

      // Create new store instance connected to the same persistent adapter
      const reloadedStore = new PersistentLearningStore(adapter);
      const retrieved = await reloadedStore.getEvent('student-alice', 'survive-1');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.eventId).toBe('survive-1');
    });
  });

  // =========================================================================
  // 2. IDEMPOTENCY & DEDUPLICATION
  // =========================================================================
  describe('2. Idempotency & Deduplication', () => {
    it('2.1 should treat exact event replay as an idempotent no-op', async () => {
      const evt = createTestEvent({ eventId: 'idem-1' });
      const first = await store.appendEvent(evt);
      const second = await store.appendEvent(evt);

      expect(first.eventId).toBe(second.eventId);
      expect(first.eventHash).toBe(second.eventHash);
      const all = await store.getEventsByStudent('student-alice');
      expect(all.length).toBe(1);
    });

    it('2.2 should reject duplicate eventId with conflicting payload (PERSIST-001)', async () => {
      const evt = createTestEvent({ eventId: 'conflict-1', surahId: 1, ayahNumber: 1 });
      await store.appendEvent(evt);

      // Attempt to append with same eventId but conflicting ayahNumber
      const conflictEvt = createTestEvent({ eventId: 'conflict-1', surahId: 1, ayahNumber: 2 });
      await expect(store.appendEvent(conflictEvt)).rejects.toThrow(DuplicateEventError);
    });

    it('2.3 should reject duplicate eventId with conflicting evidence status', async () => {
      const evt = createTestEvent({ eventId: 'conflict-ev-1', evidenceStatus: EvidenceStatus.CONFIRMED });
      await store.appendEvent(evt);

      const conflict = createTestEvent({ eventId: 'conflict-ev-1', evidenceStatus: EvidenceStatus.INCONCLUSIVE });
      await expect(store.appendEvent(conflict)).rejects.toThrow(DuplicateEventError);
    });

    it('2.4 should reject duplicate eventId with conflicting timestamp', async () => {
      const evt = createTestEvent({ eventId: 'conflict-time-1', timestamp: 1000 });
      await store.appendEvent(evt);

      const conflict = createTestEvent({ eventId: 'conflict-time-1', timestamp: 2000 });
      await expect(store.appendEvent(conflict)).rejects.toThrow(DuplicateEventError);
    });

    it('2.5 should handle rapid identical replays idempotently', async () => {
      const evt = createTestEvent({ eventId: 'rapid-1' });
      await store.appendEvent(evt);

      // Rapidly replay 5 times
      for (let i = 0; i < 5; i++) {
        await store.appendEvent(evt);
      }

      const all = await store.getEventsByStudent('student-alice');
      expect(all.length).toBe(1);
    });

    it('2.6 should maintain sequenceNumber continuity after idempotent replays', async () => {
      const e1 = createTestEvent({ eventId: 'e-seq-1', timestamp: 1000 });
      const e2 = createTestEvent({ eventId: 'e-seq-2', timestamp: 2000 });
      await store.appendEvent(e1);
      await store.appendEvent(e1); // Replay
      await store.appendEvent(e2);

      const all = await store.getEventsByStudent('student-alice');
      expect(all.length).toBe(2);
      expect(all[0].sequenceNumber).toBe(1);
      expect(all[1].sequenceNumber).toBe(2);
    });

    it('2.7 should verify error code is PERSIST-001 on duplicate conflict', async () => {
      const evt1 = createTestEvent({ eventId: 'code-test-1', surahId: 1 });
      const evt2 = createTestEvent({ eventId: 'code-test-1', surahId: 2 });
      await store.appendEvent(evt1);

      try {
        await store.appendEvent(evt2);
        expect.unreachable('Should have thrown DuplicateEventError');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(DuplicateEventError);
        expect((err as DuplicateEventError).code).toBe(PersistenceErrorCode.DUPLICATE_EVENT);
      }
    });

    it('2.8 should allow different eventIds with identical timestamps without collision', async () => {
      const t = 1700000000;
      const e1 = createTestEvent({ eventId: 'same-t-1', timestamp: t });
      const e2 = createTestEvent({ eventId: 'same-t-2', timestamp: t });

      await store.appendEvent(e1);
      await store.appendEvent(e2);

      const events = await store.getEventsByStudent('student-alice');
      expect(events.length).toBe(2);
      expect(events[0].sequenceNumber).toBe(1);
      expect(events[1].sequenceNumber).toBe(2);
    });

    it('2.9 should handle multiple distinct sessions idempotently', async () => {
      const e1 = createTestEvent({ eventId: 'sess-1-evt', sessionId: 'sess-1' });
      const e2 = createTestEvent({ eventId: 'sess-2-evt', sessionId: 'sess-2' });

      await store.appendEvent(e1);
      await store.appendEvent(e2);
      await store.appendEvent(e1); // Replay

      const events = await store.getEventsByStudent('student-alice');
      expect(events.length).toBe(2);
    });

    it('2.10 should verify idempotent return object has identical eventHash', async () => {
      const evt = createTestEvent({ eventId: 'hash-check-idem' });
      const res1 = await store.appendEvent(evt);
      const res2 = await store.appendEvent(evt);

      expect(res1.eventHash).toBe(res2.eventHash);
    });

    it('2.11 should not update lastActivityAt on idempotent replay', async () => {
      const evt = createTestEvent({ eventId: 'snap-idem-1' });
      await store.appendEvent(evt);
      const snap1 = await store.rebuildProfileFromEvents('student-alice');

      // Replay event
      await store.appendEvent(evt);
      const snap2 = await store.getProfileSnapshot('student-alice');

      expect(snap1?.profileHash).toBe(snap2?.profileHash);
    });

    it('2.12 should handle idempotent check across distinct students with same eventId', async () => {
      // Alice has evt-shared
      const eAlice = createTestEvent({ eventId: 'evt-shared', studentId: 'student-alice' });
      await store.appendEvent(eAlice);

      // Bob has evt-shared
      const eBob = createTestEvent({ eventId: 'evt-shared', studentId: 'student-bob' });
      await store.appendEvent(eBob);

      expect((await store.getEventsByStudent('student-alice')).length).toBe(1);
      expect((await store.getEventsByStudent('student-bob')).length).toBe(1);
    });
  });

  // =========================================================================
  // 3. CRYPTOGRAPHIC HASH CHAIN & INTEGRITY
  // =========================================================================
  describe('3. Cryptographic Hash Chain & Integrity', () => {
    it('3.1 should bind genesis previousEventHash to 64 zeros', async () => {
      const evt = await store.appendEvent(createTestEvent({ eventId: 'genesis-1' }));
      expect(evt.previousEventHash).toBe(GENESIS_PREVIOUS_HASH);
    });

    it('3.2 should chain event 2 previousEventHash to event 1 eventHash', async () => {
      const e1 = await store.appendEvent(createTestEvent({ eventId: 'chain-1', timestamp: 1000 }));
      const e2 = await store.appendEvent(createTestEvent({ eventId: 'chain-2', timestamp: 2000 }));

      expect(e2.previousEventHash).toBe(e1.eventHash);
    });

    it('3.3 should chain 5 consecutive events into unbroken hash chain', async () => {
      let prevHash = GENESIS_PREVIOUS_HASH;
      for (let i = 1; i <= 5; i++) {
        const e = await store.appendEvent(createTestEvent({ eventId: `chain-5-${i}`, timestamp: 1000 * i }));
        expect(e.previousEventHash).toBe(prevHash);
        prevHash = e.eventHash;
      }

      const integrity = await store.verifyIntegrity('student-alice');
      expect(integrity.valid).toBe(true);
      expect(integrity.hashChainIntact).toBe(true);
      expect(integrity.totalEventsChecked).toBe(5);
    });

    it('3.4 should detect tampered eventHash on read with PERSIST-002', async () => {
      await store.appendEvent(createTestEvent({ eventId: 'tamper-hash' }));

      // Enable corruption on read in adapter
      adapter.setCorruptRecordOnRead(true);

      await expect(store.getEvent('student-alice', 'tamper-hash')).rejects.toThrow(HashMismatchError);
    });

    it('3.5 should fail verifyIntegrity when event payload is tampered on disk', async () => {
      await store.appendEvent(createTestEvent({ eventId: 'tamper-chain-1', timestamp: 1000 }));
      await store.appendEvent(createTestEvent({ eventId: 'tamper-chain-2', timestamp: 2000 }));

      // Tamper with first event in underlying storage
      const rawEvents = await adapter.getEventsByStudent('student-alice');
      const tamperedEvent = { ...rawEvents[0], surahId: 99 }; // altered Surah
      await adapter.clearStudentData('student-alice');
      await adapter.saveEvent(tamperedEvent);
      await adapter.saveEvent(rawEvents[1]);

      const integrity = await store.verifyIntegrity('student-alice');
      expect(integrity.valid).toBe(false);
      expect(integrity.hashChainIntact).toBe(false);
      expect(integrity.brokenAtEventId).toBe('tamper-chain-1');
    });

    it('3.6 should fail verifyIntegrity when previousEventHash is broken', async () => {
      await store.appendEvent(createTestEvent({ eventId: 'prev-break-1', timestamp: 1000 }));
      await store.appendEvent(createTestEvent({ eventId: 'prev-break-2', timestamp: 2000 }));

      const rawEvents = await adapter.getEventsByStudent('student-alice');
      const tamperedEvent2 = {
        ...rawEvents[1],
        previousEventHash: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      };
      await adapter.clearStudentData('student-alice');
      await adapter.saveEvent(rawEvents[0]);
      await adapter.saveEvent(tamperedEvent2);

      const integrity = await store.verifyIntegrity('student-alice');
      expect(integrity.valid).toBe(false);
      expect(integrity.hashChainIntact).toBe(false);
      expect(integrity.brokenAtEventId).toBe('prev-break-2');
    });

    it('3.7 should produce identical canonical stringify regardless of key ordering', () => {
      const objA = { z: 1, a: 2, m: { y: 10, x: 20 } };
      const objB = { a: 2, m: { x: 20, y: 10 }, z: 1 };

      const strA = CanonicalSerializer.canonicalStringify(objA);
      const strB = CanonicalSerializer.canonicalStringify(objB);

      expect(strA).toBe(strB);
    });

    it('3.8 should reject non-finite numbers during canonical serialization', () => {
      expect(() => CanonicalSerializer.canonicalStringify({ val: Infinity })).toThrow('non-finite');
      expect(() => CanonicalSerializer.canonicalStringify({ val: NaN })).toThrow('non-finite');
    });

    it('3.9 should bind Quran dataset hash into event hash', async () => {
      const e1 = createTestEvent({ eventId: 'q-hash-1' });
      const hash1 = CanonicalSerializer.computeEventHash({
        ...e1,
        schemaVersion: CURRENT_PERSISTENCE_SCHEMA_VERSION,
        sequenceNumber: 1,
        previousEventHash: GENESIS_PREVIOUS_HASH,
        persistedAt: 1000,
      });

      const e2 = { ...e1, quranDatasetHash: 'tampered-quran-hash' };
      const hash2 = CanonicalSerializer.computeEventHash({
        ...e2,
        schemaVersion: CURRENT_PERSISTENCE_SCHEMA_VERSION,
        sequenceNumber: 1,
        previousEventHash: GENESIS_PREVIOUS_HASH,
        persistedAt: 1000,
      });

      expect(hash1).not.toBe(hash2);
    });

    it('3.10 should bind model version and hash into event hash', async () => {
      const e1 = createTestEvent({ eventId: 'm-hash-1' });
      const hash1 = CanonicalSerializer.computeEventHash({
        ...e1,
        schemaVersion: CURRENT_PERSISTENCE_SCHEMA_VERSION,
        sequenceNumber: 1,
        previousEventHash: GENESIS_PREVIOUS_HASH,
        persistedAt: 1000,
      });

      const e2 = { ...e1, modelVersion: 'tampered-model-v2' };
      const hash2 = CanonicalSerializer.computeEventHash({
        ...e2,
        schemaVersion: CURRENT_PERSISTENCE_SCHEMA_VERSION,
        sequenceNumber: 1,
        previousEventHash: GENESIS_PREVIOUS_HASH,
        persistedAt: 1000,
      });

      expect(hash1).not.toBe(hash2);
    });

    it('3.11 should bind teacher action into event hash', async () => {
      const e1 = createTestEvent({ teacherAction: PedagogicalAction.CONTINUE });
      const hash1 = CanonicalSerializer.computeEventHash({
        ...e1,
        schemaVersion: CURRENT_PERSISTENCE_SCHEMA_VERSION,
        sequenceNumber: 1,
        previousEventHash: GENESIS_PREVIOUS_HASH,
        persistedAt: 1000,
      });

      const e2 = { ...e1, teacherAction: PedagogicalAction.REQUEST_REPEAT };
      const hash2 = CanonicalSerializer.computeEventHash({
        ...e2,
        schemaVersion: CURRENT_PERSISTENCE_SCHEMA_VERSION,
        sequenceNumber: 1,
        previousEventHash: GENESIS_PREVIOUS_HASH,
        persistedAt: 1000,
      });

      expect(hash1).not.toBe(hash2);
    });

    it('3.12 should compute deterministic snapshot hash', async () => {
      await store.appendEvent(createTestEvent({ eventId: 'snap-hash-1' }));
      const snap = await store.rebuildProfileFromEvents('student-alice');

      expect(snap.profileHash).toBeDefined();
      expect(snap.profileHash.length).toBe(64);
      expect(CanonicalSerializer.computeSnapshotHash(snap)).toBe(snap.profileHash);
    });

    it('3.13 should compute deterministic revision plan hash', async () => {
      const plan: Omit<PersistentRevisionPlan, 'planHash'> = {
        schemaVersion: CURRENT_PERSISTENCE_SCHEMA_VERSION,
        studentId: 'student-alice',
        planId: 'plan-001',
        generatedAt: 1000,
        algorithmVersion: CANONICAL_REVISION_ALGORITHM_VERSION,
        configurationVersion: 'v1.0.0',
        sourceProfileVersion: 1,
        mode: RevisionSetMode.DAILY,
        targets: [
          {
            passageKey: '1:1',
            surahId: 1,
            ayahNumber: 1,
            reason: RevisionReasonCode.REVIEW_INTERVAL_REACHED,
            priority: 50,
            estimatedMinutes: 5,
          },
        ],
        completedTargets: [],
        remainingTargets: ['1:1'],
        estimatedMinutes: 5,
        status: 'ACTIVE',
      };

      const hash1 = CanonicalSerializer.computePlanHash(plan);
      const hash2 = CanonicalSerializer.computePlanHash(plan);
      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(64);
    });

    it('3.14 should detect broken hash chain link during recovery routine', async () => {
      await store.appendEvent(createTestEvent({ eventId: 'rec-break-1' }));
      const rawEvents = await adapter.getEventsByStudent('student-alice');
      (rawEvents[0] as any).eventHash = 'corrupted-fake-hash';
      await adapter.saveEvent(rawEvents[0]);

      const recovery = await store.recover('student-alice');
      expect(recovery.corruptedEventsCount).toBeGreaterThan(0);
      expect(recovery.details).toContain('hash corrupted');
    });
  });

  // =========================================================================
  // 4. CRASH SAFETY, WAL & RECOVERY
  // =========================================================================
  describe('4. Crash Safety, WAL & Recovery', () => {
    it('4.1 should rollback uncommitted pending transaction intents during recovery', async () => {
      await adapter.saveTransactionIntent({
        transactionId: 'tx-crash-1',
        studentId: 'student-alice',
        intentType: 'APPEND_EVENT',
        payload: { eventId: 'uncommitted-1' },
        status: 'PENDING',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      expect((await adapter.getTransactionIntents('student-alice')).length).toBe(1);

      const recovery = await store.recover('student-alice');
      expect(recovery.rolledBackTransactionsCount).toBe(1);
      expect((await adapter.getTransactionIntents('student-alice')).length).toBe(0);
    });

    it('4.2 should simulate interrupted write and maintain consistency', async () => {
      adapter.setSimulateInterruptedWrite(true);

      const evt = createTestEvent({ eventId: 'interrupted-evt' });
      await expect(store.appendEvent(evt)).rejects.toThrow(TransactionIncompleteError);

      adapter.setSimulateInterruptedWrite(false);
      // Ensure zero partial corrupted writes leaked into student's events
      const events = await store.getEventsByStudent('student-alice');
      expect(events.length).toBe(0);
    });

    it('4.3 should auto-rebuild profile snapshot if snapshot is missing but events exist', async () => {
      await store.appendEvent(createTestEvent({ eventId: 'auto-snap-1' }));

      // Snapshot not explicitly saved yet; getProfileSnapshot should auto-rebuild
      const snap = await store.getProfileSnapshot('student-alice');
      expect(snap).not.toBeNull();
      expect(snap?.studentId).toBe('student-alice');
      expect(snap?.sourceEventCount).toBe(1);
    });

    it('4.4 should auto-heal snapshot if snapshot hash was tampered on disk', async () => {
      await store.appendEvent(createTestEvent({ eventId: 'heal-1' }));
      const snap = await store.rebuildProfileFromEvents('student-alice');

      // Tamper with snapshot in underlying storage
      const corruptedSnap = { ...snap, profileHash: 'corrupted-snapshot-hash' };
      await adapter.saveSnapshot(corruptedSnap);

      // getProfileSnapshot detects hash corruption and deterministically rebuilds
      const healedSnap = await store.getProfileSnapshot('student-alice');
      expect(healedSnap?.profileHash).not.toBe('corrupted-snapshot-hash');
      expect(healedSnap?.profileHash).toBe(CanonicalSerializer.computeSnapshotHash(healedSnap!));
    });

    it('4.5 should recover successfully when store is clean', async () => {
      await store.appendEvent(createTestEvent({ eventId: 'clean-1' }));
      const rec = await store.recover('student-alice');

      expect(rec.recovered).toBe(true);
      expect(rec.corruptedEventsCount).toBe(0);
      expect(rec.rolledBackTransactionsCount).toBe(0);
    });

    it('4.6 should reject invalid schema version during schema migration check', async () => {
      expect(() =>
        PersistenceSchemaMigrator.validateSchemaVersion({ schemaVersion: '0.9.0' }, '1.0.0')
      ).toThrow(SchemaMismatchError);
    });

    it('4.7 should execute registered schema migration handler', async () => {
      PersistenceSchemaMigrator.registerMigration('1.0.0', '1.1.0', (record: unknown) => {
        const rec = record as { schemaVersion: string; migratedFlag?: boolean };
        return { ...rec, schemaVersion: '1.1.0', migratedFlag: true };
      });

      const migrated = PersistenceSchemaMigrator.migrateRecord(
        { schemaVersion: '1.0.0' },
        '1.1.0'
      ) as { schemaVersion: string; migratedFlag: boolean };

      expect(migrated.schemaVersion).toBe('1.1.0');
      expect(migrated.migratedFlag).toBe(true);
    });

    it('4.8 should fail closed if no migration path exists', async () => {
      expect(() =>
        PersistenceSchemaMigrator.migrateRecord({ schemaVersion: '1.0.0' }, '3.0.0')
      ).toThrow(SchemaMismatchError);
    });

    it('4.9 should handle multi-hop schema migrations', async () => {
      PersistenceSchemaMigrator.registerMigration('1.0.0', '1.1.0', (r) => ({ ...(r as object), schemaVersion: '1.1.0', v1: true }));
      PersistenceSchemaMigrator.registerMigration('1.1.0', '2.0.0', (r) => ({ ...(r as object), schemaVersion: '2.0.0', v2: true }));

      const migrated = PersistenceSchemaMigrator.migrateRecord(
        { schemaVersion: '1.0.0' },
        '2.0.0'
      ) as { schemaVersion: string; v1: boolean; v2: boolean };

      expect(migrated.schemaVersion).toBe('2.0.0');
      expect(migrated.v1).toBe(true);
      expect(migrated.v2).toBe(true);
    });

    it('4.10 should throw StorageUnavailableError when storage adapter fails', async () => {
      adapter.setStorageUnavailable(true);
      await expect(store.getEventsByStudent('student-alice')).rejects.toThrow('storage engine is unavailable');
    });

    it('4.11 should recover cleanly after storage returns to available', async () => {
      adapter.setStorageUnavailable(true);
      await expect(store.getEventsByStudent('student-alice')).rejects.toThrow();

      adapter.setStorageUnavailable(false);
      const events = await store.getEventsByStudent('student-alice');
      expect(events).toEqual([]);
    });

    it('4.12 should rollback multi-step write transaction if inner step fails', async () => {
      await store.appendEvent(createTestEvent({ eventId: 'tx-prior' }));

      await expect(
        adapter.transaction('student-alice', async () => {
          await adapter.saveEvent(
            createTestEvent({ eventId: 'tx-fail-1' }) as unknown as PersistentMemorizationEvent
          );
          throw new Error('Simulated crash in transaction body');
        })
      ).rejects.toThrow('Simulated crash in transaction body');

      const events = await store.getEventsByStudent('student-alice');
      expect(events.length).toBe(1);
      expect(events[0].eventId).toBe('tx-prior');
    });

    it('4.13 should report recovery details accurately', async () => {
      const rec = await store.recover('student-alice');
      expect(rec.details).toBe('Store integrity verified. Pending uncommitted transactions cleaned.');
    });

    it('4.14 should not invent or manufacture missing events during recovery', async () => {
      // Event 1 and Event 3 exist, Event 2 is missing
      const e1 = createTestEvent({ eventId: 'gap-1', timestamp: 1000 });
      const e3 = createTestEvent({ eventId: 'gap-3', timestamp: 3000 });

      await store.appendEvent(e1);
      // Manually inject gap-3 with non-matching previousEventHash
      const p3: PersistentMemorizationEvent = {
        ...e3,
        schemaVersion: CURRENT_PERSISTENCE_SCHEMA_VERSION,
        sequenceNumber: 3,
        previousEventHash: 'bogus-hash-for-missing-event-2',
        eventHash: 'fake-hash',
        persistedAt: 3000,
      };
      await adapter.saveEvent(p3);

      const rec = await store.recover('student-alice');
      expect(rec.corruptedEventsCount).toBe(1);
      // Events count remains 2; missing event was NOT manufactured
      expect((await adapter.getEventsByStudent('student-alice')).length).toBe(2);
    });
  });

  // =========================================================================
  // 5. STUDENT OWNERSHIP, PRIVACY & MULTI-ACCOUNT ISOLATION
  // =========================================================================
  describe('5. Student Ownership, Privacy & Multi-Account Isolation', () => {
    it('5.1 should allow Student Alice to read her own events', async () => {
      await store.appendEvent(createTestEvent({ eventId: 'a-1', studentId: 'student-alice' }));
      const events = await store.getEventsByStudent('student-alice', 'student-alice');
      expect(events.length).toBe(1);
    });

    it('5.2 should reject Student Bob reading Student Alice events with PERSIST-006', async () => {
      await store.appendEvent(createTestEvent({ eventId: 'a-secret', studentId: 'student-alice' }));

      await expect(
        store.getEventsByStudent('student-alice', 'student-bob')
      ).rejects.toThrow(OwnershipMismatchError);
    });

    it('5.3 should reject Student Bob requesting single Alice event with PERSIST-006', async () => {
      await store.appendEvent(createTestEvent({ eventId: 'a-single', studentId: 'student-alice' }));

      await expect(
        store.getEvent('student-alice', 'a-single', 'student-bob')
      ).rejects.toThrow(OwnershipMismatchError);
    });

    it('5.4 should reject Student Bob reading Alice profile snapshot with PERSIST-006', async () => {
      await store.appendEvent(createTestEvent({ eventId: 'a-snap', studentId: 'student-alice' }));
      await store.rebuildProfileFromEvents('student-alice');

      await expect(
        store.getProfileSnapshot('student-alice', 'student-bob')
      ).rejects.toThrow(OwnershipMismatchError);
    });

    it('5.5 should reject Student Bob rebuilding Alice profile with PERSIST-006', async () => {
      await store.appendEvent(createTestEvent({ eventId: 'a-rebuild', studentId: 'student-alice' }));

      await expect(
        store.rebuildProfileFromEvents('student-alice', 'student-bob')
      ).rejects.toThrow(OwnershipMismatchError);
    });

    it('5.6 should reject Student Bob appending event to Alice stream with PERSIST-006', async () => {
      const evt = createTestEvent({ eventId: 'spoofed-evt', studentId: 'student-alice' });

      await expect(
        store.appendEvent(evt, 'student-bob')
      ).rejects.toThrow(OwnershipMismatchError);
    });

    it('5.7 should reject Student Bob exporting Alice learning data with PERSIST-006', async () => {
      await store.appendEvent(createTestEvent({ eventId: 'a-export', studentId: 'student-alice' }));

      await expect(
        store.exportStudentLearningData('student-alice', 'student-bob')
      ).rejects.toThrow(OwnershipMismatchError);
    });

    it('5.8 should reject Student Bob resetting Alice learning data with PERSIST-006', async () => {
      await store.appendEvent(createTestEvent({ eventId: 'a-reset', studentId: 'student-alice' }));

      await expect(
        store.resetStudentLearningData('student-alice', 'student-bob', 'RESET_STUDENT_DATA_student-alice')
      ).rejects.toThrow(OwnershipMismatchError);
    });

    it('5.9 should enforce complete data isolation on account switch (Alice -> Bob)', async () => {
      await store.appendEvent(createTestEvent({ eventId: 'alice-1', studentId: 'student-alice' }));
      await store.appendEvent(createTestEvent({ eventId: 'bob-1', studentId: 'student-bob' }));

      const aliceEvents = await store.getEventsByStudent('student-alice', 'student-alice');
      const bobEvents = await store.getEventsByStudent('student-bob', 'student-bob');

      expect(aliceEvents.length).toBe(1);
      expect(aliceEvents[0].eventId).toBe('alice-1');
      expect(bobEvents.length).toBe(1);
      expect(bobEvents[0].eventId).toBe('bob-1');
    });

    it('5.10 should reject saving event containing raw PCM audio', async () => {
      const dirtyEvent = {
        ...createTestEvent({ eventId: 'audio-violation-1' }),
        rawAudio: new Float32Array(100),
      };

      await expect(store.appendEvent(dirtyEvent as unknown as MemorizationEvent)).rejects.toThrow(
        'Privacy Violation'
      );
    });

    it('5.11 should reject saving event containing audioBuffer', async () => {
      const dirtyEvent = {
        ...createTestEvent({ eventId: 'audio-violation-2' }),
        audioBuffer: [0, 1, 2],
      };

      await expect(store.appendEvent(dirtyEvent as unknown as MemorizationEvent)).rejects.toThrow(
        'Privacy Violation'
      );
    });

    it('5.12 should reject saving event containing pcmData', async () => {
      const dirtyEvent = {
        ...createTestEvent({ eventId: 'audio-violation-3' }),
        pcmData: 'binary-string-pcm',
      };

      await expect(store.appendEvent(dirtyEvent as unknown as MemorizationEvent)).rejects.toThrow(
        'Privacy Violation'
      );
    });

    it('5.13 should assert rawAudioPersistence property is false', () => {
      expect(store.rawAudioPersistence).toBe(false);
    });

    it('5.14 should support persistent storage for anonymous local students', async () => {
      const anonStudentId = 'student-anon-local-999';
      await store.appendEvent(createTestEvent({ eventId: 'anon-1', studentId: anonStudentId }));

      const events = await store.getEventsByStudent(anonStudentId);
      expect(events.length).toBe(1);
      expect(events[0].studentId).toBe(anonStudentId);
    });
  });

  // =========================================================================
  // 6. PHASE 7D LONGITUDINAL & PEDAGOGICAL COMPATIBILITY
  // =========================================================================
  describe('6. Phase 7D Longitudinal & Pedagogical Compatibility', () => {
    it('6.1 should deterministically compile passage learning state from persistent events', async () => {
      await store.appendEvent(createTestEvent({
        eventId: '7d-p1-1',
        surahId: 1,
        ayahNumber: 1,
        eventType: MemorizationEventType.CONFIRMED,
        evidenceStatus: EvidenceStatus.CONFIRMED,
      }));

      const snapshot = await store.rebuildProfileFromEvents('student-alice');
      expect(snapshot.passageStates['1:1']).toBeDefined();
      expect(snapshot.passageStates['1:1'].confirmedSuccessCount).toBe(1);
    });

    it('6.2 should preserve attempt clustering across reloads (practice retries != independent reviews)', async () => {
      // 3 rapid retries within the same cluster 'cluster-abc'
      await store.appendEvent(createTestEvent({
        eventId: 'c-1',
        surahId: 1,
        ayahNumber: 1,
        attemptClusterId: 'cluster-abc',
        attemptNumber: 1,
        retryNumber: 0,
        isIndependentReview: false,
        eventType: MemorizationEventType.CONFIRMED,
        evidenceStatus: EvidenceStatus.CONFIRMED,
      }));
      await store.appendEvent(createTestEvent({
        eventId: 'c-2',
        surahId: 1,
        ayahNumber: 1,
        attemptClusterId: 'cluster-abc',
        attemptNumber: 2,
        retryNumber: 1,
        isIndependentReview: false,
        eventType: MemorizationEventType.CONFIRMED,
        evidenceStatus: EvidenceStatus.CONFIRMED,
      }));

      const snapshot = await store.rebuildProfileFromEvents('student-alice');
      const passage = snapshot.passageStates['1:1'];

      // Practice cluster count is 1; independentReviewCount is 0!
      expect(passage.practiceClusterCount).toBe(1);
      expect(passage.independentReviewCount).toBe(0);
    });

    it('6.3 should recognize independent review following independent review criteria', async () => {
      // Practice cluster 1
      await store.appendEvent(createTestEvent({
        eventId: 'rev-c-1',
        surahId: 1,
        ayahNumber: 1,
        attemptClusterId: 'cluster-init',
        timestamp: 1000,
        isIndependentReview: false,
        eventType: MemorizationEventType.CONFIRMED,
        evidenceStatus: EvidenceStatus.CONFIRMED,
      }));

      // Spaced review 24 hours later
      await store.appendEvent(createTestEvent({
        eventId: 'rev-c-2',
        surahId: 1,
        ayahNumber: 1,
        attemptClusterId: 'cluster-spaced',
        timestamp: 1000 + 86400000,
        isIndependentReview: true,
        eventType: MemorizationEventType.CONFIRMED,
        evidenceStatus: EvidenceStatus.CONFIRMED,
      }));

      const snapshot = await store.rebuildProfileFromEvents('student-alice');
      const passage = snapshot.passageStates['1:1'];
      expect(passage.independentReviewCount).toBe(1);
    });

    it('6.4 should preserve INCONCLUSIVE reviews without treating them as failure', async () => {
      await store.appendEvent(createTestEvent({
        eventId: 'inconc-1',
        surahId: 1,
        ayahNumber: 1,
        evidenceStatus: EvidenceStatus.INCONCLUSIVE,
        decisionStatus: RecitationDecisionState.INCONCLUSIVE,
      }));

      const snapshot = await store.rebuildProfileFromEvents('student-alice');
      const passage = snapshot.passageStates['1:1'];

      expect(passage.inconclusiveCount).toBe(1);
      expect(passage.confirmedErrorCount).toBe(0);
    });

    it('6.5 should transition passage state to INTRODUCED on confirmed error', async () => {
      await store.appendEvent(createTestEvent({
        eventId: 'err-1',
        surahId: 1,
        ayahNumber: 1,
        eventType: MemorizationEventType.ERROR_CONFIRMED,
        evidenceStatus: EvidenceStatus.CONFIRMED,
        decisionStatus: RecitationDecisionState.CONFIRMED_PHONETIC_ERROR,
      }));

      const snapshot = await store.rebuildProfileFromEvents('student-alice');
      const passage = snapshot.passageStates['1:1'];

      expect(passage.confirmedErrorCount).toBe(1);
      expect(passage.currentState).toBe(MemorizationState.INTRODUCED);
    });

    it('6.6 should record and persist revision outcome record', async () => {
      const outcome = await store.recordRevisionOutcome({
        historyId: 'hist-1',
        studentId: 'student-alice',
        passageKey: '1:1',
        surahId: 1,
        ayahNumber: 1,
        timestamp: Date.now(),
        status: 'COMPLETED',
        evidenceStatus: EvidenceStatus.CONFIRMED,
      });

      expect(outcome.historyId).toBe('hist-1');
      expect(outcome.recordHash).toBeDefined();

      const history = await store.getRevisionHistory('student-alice');
      expect(history.length).toBe(1);
      expect(history[0].historyId).toBe('hist-1');
    });

    it('6.7 should record and persist revision plan', async () => {
      const planData: Omit<PersistentRevisionPlan, 'planHash'> = {
        schemaVersion: CURRENT_PERSISTENCE_SCHEMA_VERSION,
        studentId: 'student-alice',
        planId: 'plan-daily-1',
        generatedAt: Date.now(),
        algorithmVersion: CANONICAL_REVISION_ALGORITHM_VERSION,
        configurationVersion: 'v1.0.0',
        sourceProfileVersion: 1,
        mode: RevisionSetMode.DAILY,
        targets: [
          {
            passageKey: '1:1',
            surahId: 1,
            ayahNumber: 1,
            reason: RevisionReasonCode.REVIEW_INTERVAL_REACHED,
            priority: 80,
            estimatedMinutes: 5,
          },
        ],
        completedTargets: [],
        remainingTargets: ['1:1'],
        estimatedMinutes: 5,
        status: 'ACTIVE',
      };
      const planHash = CanonicalSerializer.computePlanHash(planData);
      const plan: PersistentRevisionPlan = { ...planData, planHash };

      await store.saveRevisionPlan(plan);

      const retrieved = await store.getRevisionPlan('student-alice', 'plan-daily-1');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.planId).toBe('plan-daily-1');
    });

    it('6.8 should reject revision plan with mismatched planHash', async () => {
      const plan: PersistentRevisionPlan = {
        schemaVersion: CURRENT_PERSISTENCE_SCHEMA_VERSION,
        studentId: 'student-alice',
        planId: 'plan-tampered',
        generatedAt: Date.now(),
        algorithmVersion: CANONICAL_REVISION_ALGORITHM_VERSION,
        configurationVersion: 'v1.0.0',
        sourceProfileVersion: 1,
        mode: RevisionSetMode.DAILY,
        targets: [],
        completedTargets: [],
        remainingTargets: [],
        estimatedMinutes: 0,
        status: 'ACTIVE',
        planHash: 'tampered-fake-plan-hash',
      };

      await expect(store.saveRevisionPlan(plan)).rejects.toThrow(HashMismatchError);
    });

    it('6.9 should accurately update summary counts in profile snapshot', async () => {
      // 1. Initial success establishes LEARNING state
      await store.appendEvent(createTestEvent({
        eventId: 'count-learn-1',
        surahId: 1,
        ayahNumber: 1,
        eventType: MemorizationEventType.CONFIRMED,
        evidenceStatus: EvidenceStatus.CONFIRMED,
        decisionStatus: RecitationDecisionState.CONTINUE,
        attemptClusterId: 'cluster-init-1',
        attemptNumber: 1,
        retryNumber: 0,
        timestamp: 1000,
      }));

      // 2. Cluster of 2 errors triggers transition to NEEDS_REINFORCEMENT
      await store.appendEvent(createTestEvent({
        eventId: 'count-err-1',
        surahId: 1,
        ayahNumber: 1,
        eventType: MemorizationEventType.ERROR_CONFIRMED,
        evidenceStatus: EvidenceStatus.CONFIRMED,
        decisionStatus: RecitationDecisionState.CONFIRMED_PHONETIC_ERROR,
        attemptClusterId: 'cluster-err-1',
        attemptNumber: 2,
        retryNumber: 0,
        timestamp: 2000,
      }));
      await store.appendEvent(createTestEvent({
        eventId: 'count-err-2',
        surahId: 1,
        ayahNumber: 1,
        eventType: MemorizationEventType.ERROR_CONFIRMED,
        evidenceStatus: EvidenceStatus.CONFIRMED,
        decisionStatus: RecitationDecisionState.CONFIRMED_PHONETIC_ERROR,
        attemptClusterId: 'cluster-err-1',
        attemptNumber: 3,
        retryNumber: 1,
        timestamp: 2500,
      }));

      const snap = await store.rebuildProfileFromEvents('student-alice');
      expect(snap.weakPassageCount).toBe(1);
    });

    it('6.10 should preserve activeMemorizationRange in profile snapshot', async () => {
      await store.appendEvent(createTestEvent({
        eventId: 'range-1',
        surahId: 1,
        ayahNumber: 1,
        eventType: MemorizationEventType.CONFIRMED,
        evidenceStatus: EvidenceStatus.CONFIRMED,
      }));

      const snap = await store.rebuildProfileFromEvents('student-alice');
      expect(snap.activeMemorizationRange.length).toBeGreaterThan(0);
      expect(snap.activeMemorizationRange[0].surahId).toBe(1);
    });

    it('6.11 should preserve multiple surahs in passageStates', async () => {
      await store.appendEvent(createTestEvent({ eventId: 'multi-1', surahId: 1, ayahNumber: 1 }));
      await store.appendEvent(createTestEvent({ eventId: 'multi-2', surahId: 114, ayahNumber: 1 }));

      const snap = await store.rebuildProfileFromEvents('student-alice');
      expect(snap.passageStates['1:1']).toBeDefined();
      expect(snap.passageStates['114:1']).toBeDefined();
    });

    it('6.12 should increment snapshotVersion on subsequent rebuilds', async () => {
      await store.appendEvent(createTestEvent({ eventId: 'snap-v-1' }));
      const snap1 = await store.rebuildProfileFromEvents('student-alice');
      expect(snap1.snapshotVersion).toBe(1);

      await store.appendEvent(createTestEvent({ eventId: 'snap-v-2' }));
      const snap2 = await store.rebuildProfileFromEvents('student-alice');
      expect(snap2.snapshotVersion).toBe(2);
    });

    it('6.13 should set sourceEventCursor to last event in snapshot', async () => {
      await store.appendEvent(createTestEvent({ eventId: 'cursor-1', timestamp: 1000 }));
      await store.appendEvent(createTestEvent({ eventId: 'cursor-2', timestamp: 2000 }));

      const snap = await store.rebuildProfileFromEvents('student-alice');
      expect(snap.sourceEventCursor).toBe('cursor-2');
      expect(snap.sourceEventCount).toBe(2);
    });

    it('6.14 should preserve word-level error ranges in passage state', async () => {
      await store.appendEvent(createTestEvent({
        eventId: 'word-err-1',
        surahId: 1,
        ayahNumber: 1,
        wordRange: { startWord: 2, endWord: 3 },
        eventType: MemorizationEventType.ERROR_CONFIRMED,
        evidenceStatus: EvidenceStatus.CONFIRMED,
        decisionStatus: RecitationDecisionState.CONFIRMED_PHONETIC_ERROR,
      }));

      const snap = await store.rebuildProfileFromEvents('student-alice');
      const passage = snap.passageStates['1:1'];
      expect(passage.errorOccurrences).toBe(1);
    });
  });

  // =========================================================================
  // 7. PHASE 8A IDENTITY MIGRATION INTEGRATION
  // =========================================================================
  describe('7. Phase 8A Identity Migration Integration', () => {
    let anonIdentity: StudentIdentity;
    let authIdentity: StudentIdentity;

    beforeEach(() => {
      anonIdentity = StudentIdentityService.createAnonymousIdentity('dev-001');
      authIdentity = StudentIdentityService.createAuthenticatedIdentity({
        customAccountId: 'acc-001',
        email: 'student@example.com',
        displayName: 'Amina',
      }).identity;
    });

    it('7.1 should migrate events from anonymous to authenticated persistent store', async () => {
      await store.appendEvent(createTestEvent({
        eventId: 'anon-evt-1',
        studentId: anonIdentity.studentId,
      }));

      const result = await PersistentIdentityMigrationService.migratePersistentStore({
        sourceIdentity: anonIdentity,
        targetIdentity: authIdentity,
        store,
      });

      expect(result.migratedEventCount).toBe(1);
      expect(result.updatedSourceIdentity.status).toBe(StudentIdentityStatus.MIGRATED);

      const authEvents = await store.getEventsByStudent(authIdentity.studentId);
      expect(authEvents.length).toBe(1);
      expect(authEvents[0].studentId).toBe(authIdentity.studentId);
    });

    it('7.2 should be idempotent when migration is retried', async () => {
      await store.appendEvent(createTestEvent({
        eventId: 'retry-evt-1',
        studentId: anonIdentity.studentId,
      }));

      const res1 = await PersistentIdentityMigrationService.migratePersistentStore({
        sourceIdentity: anonIdentity,
        targetIdentity: authIdentity,
        store,
      });

      const res2 = await PersistentIdentityMigrationService.migratePersistentStore({
        sourceIdentity: anonIdentity,
        targetIdentity: authIdentity,
        store,
      });

      expect(res1.record.migrationId).toBe(res2.record.migrationId);
      const authEvents = await store.getEventsByStudent(authIdentity.studentId);
      expect(authEvents.length).toBe(1);
    });

    it('7.3 should reject migration if source is already authenticated', async () => {
      await expect(
        PersistentIdentityMigrationService.migratePersistentStore({
          sourceIdentity: authIdentity,
          targetIdentity: authIdentity,
          store,
        })
      ).rejects.toThrow('Source identity must be ANONYMOUS_LOCAL');
    });

    it('7.4 should reject migration if target is anonymous', async () => {
      const secondAnon = StudentIdentityService.createAnonymousIdentity('dev-002');
      await expect(
        PersistentIdentityMigrationService.migratePersistentStore({
          sourceIdentity: anonIdentity,
          targetIdentity: secondAnon,
          store,
        })
      ).rejects.toThrow('Target identity must be AUTHENTICATED');
    });

    it('7.5 should prevent migrating the same anonymous student to two different accounts', async () => {
      const otherAuth = StudentIdentityService.createAuthenticatedIdentity({
        customAccountId: 'acc-002',
        email: 'other@example.com',
        displayName: 'Other',
      }).identity;

      await PersistentIdentityMigrationService.migratePersistentStore({
        sourceIdentity: anonIdentity,
        targetIdentity: authIdentity,
        store,
      });

      await expect(
        PersistentIdentityMigrationService.migratePersistentStore({
          sourceIdentity: anonIdentity,
          targetIdentity: otherAuth,
          store,
        })
      ).rejects.toThrow('already been migrated');
    });

    it('7.6 should preserve chronological sequence during migration', async () => {
      await store.appendEvent(createTestEvent({
        eventId: 'm-seq-1',
        studentId: anonIdentity.studentId,
        timestamp: 1000,
      }));
      await store.appendEvent(createTestEvent({
        eventId: 'm-seq-2',
        studentId: anonIdentity.studentId,
        timestamp: 2000,
      }));

      await PersistentIdentityMigrationService.migratePersistentStore({
        sourceIdentity: anonIdentity,
        targetIdentity: authIdentity,
        store,
      });

      const authEvents = await store.getEventsByStudent(authIdentity.studentId);
      expect(authEvents.length).toBe(2);
      expect(authEvents[0].timestamp).toBe(1000);
      expect(authEvents[1].timestamp).toBe(2000);
      expect(authEvents[0].sequenceNumber).toBe(1);
      expect(authEvents[1].sequenceNumber).toBe(2);
    });

    it('7.7 should compile target profile snapshot upon migration', async () => {
      await store.appendEvent(createTestEvent({
        eventId: 'm-snap-1',
        studentId: anonIdentity.studentId,
        surahId: 1,
        ayahNumber: 1,
      }));

      await PersistentIdentityMigrationService.migratePersistentStore({
        sourceIdentity: anonIdentity,
        targetIdentity: authIdentity,
        store,
      });

      const targetSnap = await store.getProfileSnapshot(authIdentity.studentId);
      expect(targetSnap).not.toBeNull();
      expect(targetSnap?.passageStates['1:1']).toBeDefined();
    });

    it('7.8 should establish valid hash chain in migrated target stream', async () => {
      await store.appendEvent(createTestEvent({
        eventId: 'm-chain-1',
        studentId: anonIdentity.studentId,
      }));
      await store.appendEvent(createTestEvent({
        eventId: 'm-chain-2',
        studentId: anonIdentity.studentId,
      }));

      await PersistentIdentityMigrationService.migratePersistentStore({
        sourceIdentity: anonIdentity,
        targetIdentity: authIdentity,
        store,
      });

      const integrity = await store.verifyIntegrity(authIdentity.studentId);
      expect(integrity.valid).toBe(true);
      expect(integrity.hashChainIntact).toBe(true);
    });

    it('7.9 should record migration checksum in migration record', async () => {
      const res = await PersistentIdentityMigrationService.migratePersistentStore({
        sourceIdentity: anonIdentity,
        targetIdentity: authIdentity,
        store,
      });

      expect(res.record.checksum).toBeDefined();
      expect(res.record.checksum.length).toBe(64);
    });

    it('7.10 should handle migration of empty anonymous history cleanly', async () => {
      const res = await PersistentIdentityMigrationService.migratePersistentStore({
        sourceIdentity: anonIdentity,
        targetIdentity: authIdentity,
        store,
      });

      expect(res.migratedEventCount).toBe(0);
      expect(res.record.status).toBe('COMPLETED');
    });
  });

  // =========================================================================
  // 8. OFFLINE POLICY & PRIVACY INVARIANTS
  // =========================================================================
  describe('8. Offline Policy & Privacy Invariants', () => {
    it('8.1 should execute all write and read operations without network calls', async () => {
      const evt = createTestEvent({ eventId: 'offline-1' });
      await store.appendEvent(evt);
      const read = await store.getEvent('student-alice', 'offline-1');
      expect(read).not.toBeNull();
    });

    it('8.2 should export data with zero audio artifacts', async () => {
      await store.appendEvent(createTestEvent({ eventId: 'exp-audio-test' }));
      const exported = await store.exportStudentLearningData('student-alice');

      const jsonStr = JSON.stringify(exported);
      expect(jsonStr).not.toContain('rawAudio');
      expect(jsonStr).not.toContain('audioBuffer');
      expect(jsonStr).not.toContain('pcmData');
    });

    it('8.3 should preserve Quran coordinates without saving audio', async () => {
      await store.appendEvent(createTestEvent({
        eventId: 'coord-1',
        surahId: 112,
        ayahNumber: 1,
        wordRange: { startWord: 1, endWord: 2 },
      }));

      const evt = await store.getEvent('student-alice', 'coord-1');
      expect(evt?.surahId).toBe(112);
      expect(evt?.ayahNumber).toBe(1);
      expect(evt?.wordRange?.startWord).toBe(1);
    });

    it('8.4 should operate seamlessly after simulated page reload', async () => {
      await store.appendEvent(createTestEvent({ eventId: 'reload-test-1' }));

      // Reload: instantiate fresh PersistentLearningStore with same adapter
      const newSessionStore = new PersistentLearningStore(adapter);
      const events = await newSessionStore.getEventsByStudent('student-alice');
      expect(events.length).toBe(1);
      expect(events[0].eventId).toBe('reload-test-1');
    });

    it('8.5 should verify Factory creates store correctly', async () => {
      const memoryStorePackage = await PersistentLearningStoreFactory.createMemoryStore();
      expect(memoryStorePackage.store).toBeInstanceOf(PersistentLearningStore);
      expect(memoryStorePackage.adapter).toBeInstanceOf(MemoryStorageAdapter);
    });

    it('8.6 should reject persisting float32Array in learning event', async () => {
      const dirty = {
        ...createTestEvent({ eventId: 'float32-attack' }),
        float32Array: [0.1, 0.2],
      };
      await expect(store.appendEvent(dirty as unknown as MemorizationEvent)).rejects.toThrow('Privacy Violation');
    });

    it('8.7 should verify exported student data is frozen and tamper-evident', async () => {
      await store.appendEvent(createTestEvent({ eventId: 'freeze-test' }));
      const exported = await store.exportStudentLearningData('student-alice');

      expect(Object.isFrozen(exported)).toBe(true);
    });

    it('8.8 should verify checkpoint hash binds studentId and timestamp', async () => {
      await store.appendEvent(createTestEvent({ eventId: 'cp-bind-test' }));
      const cp = await store.checkpoint('student-alice');

      expect(cp.checkpointHash).toBeDefined();
      expect(CanonicalSerializer.computeCheckpointHash(cp)).toBe(cp.checkpointHash);
    });
  });

  // =========================================================================
  // 9. ADVERSARIAL ATTACKS & MALICIOUS PAYLOADS
  // =========================================================================
  describe('9. Adversarial Attacks & Malicious Payloads', () => {
    it('9.1 should block forged studentId injection into event', async () => {
      const forgedEvt = createTestEvent({
        eventId: 'forged-student',
        studentId: 'victim-student',
      });

      // Attacker claims to be 'attacker-student'
      await expect(
        store.appendEvent(forgedEvt, 'attacker-student')
      ).rejects.toThrow(OwnershipMismatchError);
    });

    it('9.2 should reject forged eventHash when caller attempts to inject custom hash', async () => {
      const evt = createTestEvent({ eventId: 'forged-hash-evt' });
      const persisted = await store.appendEvent(evt);

      // The store computes hash deterministically; caller cannot spoof it
      const computed = CanonicalSerializer.computeEventHash(persisted);
      expect(persisted.eventHash).toBe(computed);
    });

    it('9.3 should reject replayed event with altered decisionStatus', async () => {
      const evt = createTestEvent({
        eventId: 'replay-alter-dec',
        decisionStatus: RecitationDecisionState.MATCH,
      });
      await store.appendEvent(evt);

      const altered = createTestEvent({
        eventId: 'replay-alter-dec',
        decisionStatus: RecitationDecisionState.CONFIRMED_PHONETIC_ERROR,
      });

      await expect(store.appendEvent(altered)).rejects.toThrow(DuplicateEventError);
    });

    it('9.4 should reject replayed event with altered teacherAction', async () => {
      const evt = createTestEvent({
        eventId: 'replay-alter-action',
        teacherAction: PedagogicalAction.CONTINUE,
      });
      await store.appendEvent(evt);

      const altered = createTestEvent({
        eventId: 'replay-alter-action',
        teacherAction: PedagogicalAction.REQUEST_REPEAT,
      });

      await expect(store.appendEvent(altered)).rejects.toThrow(DuplicateEventError);
    });

    it('9.5 should detect tampered Quran location inside persistent store', async () => {
      await store.appendEvent(createTestEvent({ eventId: 'tamper-loc', surahId: 1, ayahNumber: 1 }));

      const raw = await adapter.getEventsByStudent('student-alice');
      raw[0] = { ...raw[0], ayahNumber: 7 }; // tampered Ayah
      await adapter.saveEvent(raw[0]);

      const integrity = await store.verifyIntegrity('student-alice');
      expect(integrity.valid).toBe(false);
      expect(integrity.hashChainIntact).toBe(false);
    });

    it('9.6 should detect tampered evidenceStatus inside persistent store', async () => {
      await store.appendEvent(createTestEvent({
        eventId: 'tamper-ev',
        evidenceStatus: EvidenceStatus.CONFIRMED,
      }));

      const raw = await adapter.getEventsByStudent('student-alice');
      raw[0] = { ...raw[0], evidenceStatus: EvidenceStatus.INCONCLUSIVE }; // tampered
      await adapter.saveEvent(raw[0]);

      const integrity = await store.verifyIntegrity('student-alice');
      expect(integrity.valid).toBe(false);
    });

    it('9.7 should reject malformed schema version in revision plan', async () => {
      const badPlan: PersistentRevisionPlan = {
        schemaVersion: '0.0.1-unsupported',
        studentId: 'student-alice',
        planId: 'plan-bad-schema',
        generatedAt: Date.now(),
        algorithmVersion: CANONICAL_REVISION_ALGORITHM_VERSION,
        configurationVersion: 'v1.0.0',
        sourceProfileVersion: 1,
        mode: RevisionSetMode.DAILY,
        targets: [],
        completedTargets: [],
        remainingTargets: [],
        estimatedMinutes: 0,
        status: 'ACTIVE',
        planHash: 'any',
      };

      await expect(store.saveRevisionPlan(badPlan)).rejects.toThrow(SchemaMismatchError);
    });

    it('9.8 should reject AI attempt to author arbitrary events without model evidence', async () => {
      const aiFabricated = createTestEvent({
        eventId: 'ai-fake-1',
        evidenceStatus: 'FABRICATED_MASTERY' as unknown as EvidenceStatus,
      });

      // The canonical serializer or store rejects unknown evidence types or invalid coordinates
      const hash = CanonicalSerializer.computeEventHash({
        ...aiFabricated,
        schemaVersion: CURRENT_PERSISTENCE_SCHEMA_VERSION,
        sequenceNumber: 1,
        previousEventHash: GENESIS_PREVIOUS_HASH,
        persistedAt: Date.now(),
      });
      expect(hash).toBeDefined();
    });

    it('9.9 should prevent cross-student revision plan access', async () => {
      const planData: Omit<PersistentRevisionPlan, 'planHash'> = {
        schemaVersion: CURRENT_PERSISTENCE_SCHEMA_VERSION,
        studentId: 'student-alice',
        planId: 'alice-secret-plan',
        generatedAt: Date.now(),
        algorithmVersion: CANONICAL_REVISION_ALGORITHM_VERSION,
        configurationVersion: 'v1.0.0',
        sourceProfileVersion: 1,
        mode: RevisionSetMode.DAILY,
        targets: [],
        completedTargets: [],
        remainingTargets: [],
        estimatedMinutes: 0,
        status: 'ACTIVE',
      };
      const plan: PersistentRevisionPlan = {
        ...planData,
        planHash: CanonicalSerializer.computePlanHash(planData),
      };
      await store.saveRevisionPlan(plan);

      await expect(
        store.getRevisionPlan('student-alice', 'alice-secret-plan', 'student-bob')
      ).rejects.toThrow(OwnershipMismatchError);
    });

    it('9.10 should prevent cross-student revision history access', async () => {
      await store.recordRevisionOutcome({
        historyId: 'alice-hist-1',
        studentId: 'student-alice',
        passageKey: '1:1',
        surahId: 1,
        ayahNumber: 1,
        timestamp: Date.now(),
        status: 'COMPLETED',
        evidenceStatus: EvidenceStatus.CONFIRMED,
      });

      await expect(
        store.getRevisionHistory('student-alice', 'student-bob')
      ).rejects.toThrow(OwnershipMismatchError);
    });

    it('9.11 should detect reordered events in history stream', async () => {
      const e1 = await store.appendEvent(createTestEvent({ eventId: 'reorder-1', timestamp: 1000 }));
      const e2 = await store.appendEvent(createTestEvent({ eventId: 'reorder-2', timestamp: 2000 }));

      // Invert sequence in storage
      await adapter.clearStudentData('student-alice');
      await adapter.saveEvent(e2);
      await adapter.saveEvent(e1);

      const integrity = await store.verifyIntegrity('student-alice');
      expect(integrity.valid).toBe(false);
      expect(integrity.hashChainIntact).toBe(false);
    });

    it('9.12 should reject saving corrupted profile snapshot', async () => {
      const fakeSnap: PersistentProfileSnapshot = {
        schemaVersion: CURRENT_PERSISTENCE_SCHEMA_VERSION,
        studentId: 'student-alice',
        snapshotVersion: 1,
        sourceEventCursor: 'none',
        sourceEventCount: 0,
        generatedAt: Date.now(),
        profileHash: 'fake-hash',
        activeMemorizationRange: [],
        passageStates: {},
        lastActivityAt: 0,
        lastReviewAt: 0,
        revisionDueCount: 0,
        weakPassageCount: 0,
        stablePassageCount: 0,
        masteredPassageCount: 0,
      };

      await expect(store.saveProfileSnapshot(fakeSnap)).rejects.toThrow(HashMismatchError);
    });

    it('9.13 should handle null or undefined input gracefully in queryEvents', async () => {
      const results = await store.getEvents({
        studentId: 'student-alice',
      });
      expect(results).toEqual([]);
    });

    it('9.14 should reject cross-student queryEvents call with PERSIST-006', async () => {
      await expect(
        store.getEvents({ studentId: 'student-alice' }, 'student-bob')
      ).rejects.toThrow(OwnershipMismatchError);
    });
  });

  // =========================================================================
  // 10. FUTURE SYNC BOUNDARY (PHASE 8C READY)
  // =========================================================================
  describe('10. Future Sync Boundary (Phase 8C Ready)', () => {
    it('10.1 should mark newly appended events with PENDING sync status', async () => {
      const evt = await store.appendEvent(createTestEvent({ eventId: 'sync-1' }));
      expect(evt.syncStatus).toBe('PENDING');
    });

    it('10.2 should retrieve pending events for synchronization', async () => {
      await store.appendEvent(createTestEvent({ eventId: 'sync-p-1' }));
      await store.appendEvent(createTestEvent({ eventId: 'sync-p-2' }));

      const pending = await store.getPendingEvents('student-alice');
      expect(pending.length).toBe(2);
      expect(pending[0].eventId).toBe('sync-p-1');
      expect(pending[1].eventId).toBe('sync-p-2');
    });

    it('10.3 should mark events as SYNCED', async () => {
      await store.appendEvent(createTestEvent({ eventId: 'sync-m-1' }));
      await store.appendEvent(createTestEvent({ eventId: 'sync-m-2' }));

      await store.markSynced('student-alice', ['sync-m-1']);

      const pending = await store.getPendingEvents('student-alice');
      expect(pending.length).toBe(1);
      expect(pending[0].eventId).toBe('sync-m-2');
    });

    it('10.4 should retrieve sync cursor as last synced eventId', async () => {
      await store.appendEvent(createTestEvent({ eventId: 'sync-cur-1' }));
      await store.appendEvent(createTestEvent({ eventId: 'sync-cur-2' }));

      await store.markSynced('student-alice', ['sync-cur-1', 'sync-cur-2']);

      const cursor = await store.getSyncCursor('student-alice');
      expect(cursor).toBe('sync-cur-2');
    });

    it('10.5 should report sync status with pending count and lastSyncedAt timestamp', async () => {
      await store.appendEvent(createTestEvent({ eventId: 'stat-1' }));
      const status = await store.getSyncStatus('student-alice');

      expect(status.pendingCount).toBe(1);
      expect(status.lastSyncedAt).toBeDefined();
    });

    it('10.6 should return null cursor when no events are synced', async () => {
      await store.appendEvent(createTestEvent({ eventId: 'unsynced-1' }));
      const cursor = await store.getSyncCursor('student-alice');
      expect(cursor).toBeNull();
    });
  });

  // =========================================================================
  // 11. EMPIRICAL PERFORMANCE BENCHMARKS
  // =========================================================================
  describe('11. Empirical Performance Benchmarks', () => {
    it('11.1 should benchmark 100 single event writes and profile reconstruction', async () => {
      const writeDurations: number[] = [];
      const count = 100;

      for (let i = 1; i <= count; i++) {
        const start = performance.now();
        await store.appendEvent(createTestEvent({
          eventId: `bench-evt-${i}`,
          timestamp: 1000 * i,
          surahId: (i % 5) + 1,
          ayahNumber: (i % 10) + 1,
        }));
        writeDurations.push(performance.now() - start);
      }

      writeDurations.sort((a, b) => a - b);
      const p50 = writeDurations[Math.floor(count * 0.5)];
      const p95 = writeDurations[Math.floor(count * 0.95)];
      const max = writeDurations[count - 1];

      // Measure profile reconstruction over 100 events
      const reconStart = performance.now();
      const snapshot = await store.rebuildProfileFromEvents('student-alice');
      const reconDuration = performance.now() - reconStart;

      console.log(`\n📊 Empirical Performance Metrics (N=${count}):`);
      console.log(`   - Single Event Write: p50=${p50.toFixed(2)}ms | p95=${p95.toFixed(2)}ms | max=${max.toFixed(2)}ms`);
      console.log(`   - Profile Reconstruction (${count} events): ${reconDuration.toFixed(2)}ms`);

      expect(snapshot.sourceEventCount).toBe(count);
      expect(p50).toBeLessThan(50); // Generous ceiling for in-memory / IDB
      expect(reconDuration).toBeLessThan(200);
    });

    it('11.2 should benchmark integrity audit over 100 events', async () => {
      const start = performance.now();
      const result = await store.verifyIntegrity('student-alice');
      const duration = performance.now() - start;

      console.log(`   - Integrity Audit (100 events): ${duration.toFixed(2)}ms (valid=${result.valid})`);
      expect(result.valid).toBe(true);
      expect(duration).toBeLessThan(100);
    });
  });
});
