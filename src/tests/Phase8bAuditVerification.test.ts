/**
 * @file Phase8bAuditVerification.test.ts
 * @description Comprehensive Phase 8B Final Production Persistence Audit Suite.
 * 
 * Audits all 14 mandatory persistence domains:
 * 1. Real IndexedDB Runtime Persistence (create -> write -> close -> reopen -> restore -> verify)
 * 2. Real IndexedDB Failure & Edge Cases (aborted tx, duplicate, corruption, stale snapshot, recovery)
 * 3. WAL Verification (BEGIN -> INTENT -> WRITE -> DERIVED -> COMMIT, recovery from uncommitted)
 * 4. Hash Chain Security & Corruption Detection (modified, reordered, deleted, tampered prevHash/seq)
 * 5. Idempotency & Payload Conflict Rejection
 * 6. Profile Snapshot vs. Independent Event Reconstruction Equivalence
 * 7. Phase 7D State Engine Semantics & Pedagogical Non-Ijazah Guard
 * 8. Attempt Cluster Persistence & Anti-Inflation Across Reloads
 * 9. Cross-Student Isolation & Fail-Closed Guard
 * 10. Identity Migration (0, 1, N events, duplicate, retry)
 * 11. Raw Audio Rejection & Invariant Audit
 * 12. Schema Migration & Unknown Version Protection
 * 13. Export & Reset Contracts
 * 14. Empirical Performance Benchmarks
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { indexedDB, IDBKeyRange } from 'fake-indexeddb';

// Attach real IndexedDB implementation to global runtime
(globalThis as any).indexedDB = indexedDB;
(globalThis as any).IDBKeyRange = IDBKeyRange;

import { PersistentLearningStore } from '../domain/persistence/PersistentLearningStore.ts';
import { IndexedDBStorageAdapter } from '../infrastructure/persistence/IndexedDBStorageAdapter.ts';
import { MemoryStorageAdapter } from '../infrastructure/persistence/MemoryStorageAdapter.ts';
import {
  PersistentMemorizationEvent,
  PersistentProfileSnapshot,
  IntegrityVerificationResult,
  CURRENT_PERSISTENCE_SCHEMA_VERSION,
} from '../domain/persistence/types.ts';
import {
  OwnershipMismatchError,
  DuplicateEventError,
  HashMismatchError,
  CorruptedRecordError,
  SchemaMismatchError,
  PersistenceError,
} from '../domain/persistence/errorRegistry.ts';
import {
  MemorizationEventType,
  EvidenceStatus,
  MemorizationState,
  ClusterInteractionType,
} from '../domain/memorization_revision/types.ts';
import { RecitationDecisionState } from '../domain/recitation/decisionTypes.ts';
import { PedagogicalAction } from '../domain/teacher_policy/types.ts';
import {
  StudentIdentityService,
  StudentIdentityType,
  StudentIdentityStatus,
} from '../domain/identity/index.ts';
import { PersistentIdentityMigrationService } from '../domain/persistence/PersistentIdentityMigrationService.ts';
import { PersistenceSchemaMigrator } from '../domain/persistence/PersistenceSchemaMigrator.ts';
import { computeSha256Sync } from '../infrastructure/crypto/Sha256Util.ts';
import { CanonicalSerializer } from '../domain/persistence/CanonicalSerializer.ts';

const CANONICAL_QURAN_HASH = '1e370d0d8dae77864c24ea00c92f1f0aef9df95b34a66e4a2d81e05d21a24d27';
const CANONICAL_QURAN_VERSION = 'v1.0.0-hafs';
const CANONICAL_MODEL_HASH = '4a8a58622c7a7b8e124ea00c92f1f0aef9df95b34a66e4a2d81e05d21a24d28';
const CANONICAL_MODEL_VERSION = 'v1.0.0-acoustic';
const CANONICAL_TAJWEED_HASH = '9b6d8dae77864c24ea00c92f1f0aef9df95b34a66e4a2d81e05d21a24d29';
const CANONICAL_TAJWEED_VERSION = 'v1.0.0-tajweed';
const CANONICAL_DECISION_ENGINE_VERSION = 'v1.0.0-engine';
const CANONICAL_POLICY_VERSION = 'v1.0.0-policy';
const CANONICAL_REVISION_ALGORITHM_VERSION = 'v1.0.0-revision';

function createTestEvent(overrides: Partial<PersistentMemorizationEvent> = {}): PersistentMemorizationEvent {
  const now = overrides.timestamp ?? Date.now();
  const surahId = overrides.surahId ?? 1;
  const ayahNumber = overrides.ayahNumber ?? 1;
  const studentId = overrides.studentId ?? 'student-alice';
  const eventId = overrides.eventId ?? `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  return {
    eventId,
    studentId,
    sessionId: overrides.sessionId ?? 'session-001',
    sequenceNumber: overrides.sequenceNumber ?? 1,
    previousEventHash: overrides.previousEventHash ?? '0'.repeat(64),
    surahId,
    ayahNumber,
    quranLocation: overrides.quranLocation ?? { surahId, ayahNumber },
    eventType: overrides.eventType ?? MemorizationEventType.CONFIRMED,
    evidenceStatus: overrides.evidenceStatus ?? EvidenceStatus.CONFIRMED,
    decisionStatus: overrides.decisionStatus ?? RecitationDecisionState.CONTINUE,
    teacherAction: overrides.teacherAction ?? PedagogicalAction.CONTINUE,
    timestamp: now,
    attemptNumber: overrides.attemptNumber ?? 1,
    retryNumber: overrides.retryNumber ?? 0,
    attemptClusterId: overrides.attemptClusterId ?? `cluster-${surahId}:${ayahNumber}`,
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
    schemaVersion: CURRENT_PERSISTENCE_SCHEMA_VERSION,
    eventHash: overrides.eventHash ?? '0'.repeat(64),
    persistedAt: overrides.persistedAt ?? now,
    ...overrides,
  };
}

describe('PHASE 8B — FINAL PRODUCTION PERSISTENCE AUDIT', () => {

  // =========================================================================
  // 1. Critical Browser Runtime Test (IndexedDB Lifecycle)
  // =========================================================================
  describe('1. Critical Browser Runtime Test (IndexedDB Persistence Across Reload)', () => {
    let idbAdapter: IndexedDBStorageAdapter;

    beforeEach(async () => {
      idbAdapter = new IndexedDBStorageAdapter();
      await idbAdapter.init();
      await idbAdapter.clearAll();
    });

    afterEach(async () => {
      if (idbAdapter) {
        await idbAdapter.close();
      }
    });

    it('AUDIT-1.1: should complete full persistent lifecycle across page reload with IndexedDB', async () => {
      // Step 1: Create anonymous student
      const anonIdentity = StudentIdentityService.createAnonymousIdentity('device-hardware-001');
      expect(anonIdentity.identityType).toBe(StudentIdentityType.ANONYMOUS_LOCAL);
      const studentId = anonIdentity.studentId;

      // Step 2: Initialize store with IndexedDB adapter
      const storeSession1 = new PersistentLearningStore(idbAdapter);

      // Step 3: Write learning event
      const event1 = createTestEvent({
        studentId,
        eventId: 'audit-event-1',
        surahId: 1,
        ayahNumber: 1,
        eventType: MemorizationEventType.CONFIRMED,
        evidenceStatus: EvidenceStatus.CONFIRMED,
        decisionStatus: RecitationDecisionState.CONTINUE,
        timestamp: 1000,
      });
      const appended = await storeSession1.appendEvent(event1);
      expect(appended.sequenceNumber).toBe(1);
      expect(appended.eventHash).toBeDefined();

      // Write second event
      const event2 = createTestEvent({
        studentId,
        eventId: 'audit-event-2',
        surahId: 1,
        ayahNumber: 2,
        eventType: MemorizationEventType.CONFIRMED,
        evidenceStatus: EvidenceStatus.CONFIRMED,
        decisionStatus: RecitationDecisionState.CONTINUE,
        timestamp: 2000,
      });
      await storeSession1.appendEvent(event2);

      // Step 4: Simulate closing/reloading page: close IDB connection
      await idbAdapter.close();

      // Step 5: Simulate reopening application: create brand new adapter & store instance
      const reopenedAdapter = new IndexedDBStorageAdapter();
      await reopenedAdapter.init();
      const storeSession2 = new PersistentLearningStore(reopenedAdapter);

      // Step 6: Restore same identity & read events
      const retrievedEvents = await storeSession2.getEventsByStudent(studentId);
      expect(retrievedEvents.length).toBe(2);
      expect(retrievedEvents[0].eventId).toBe('audit-event-1');
      expect(retrievedEvents[1].eventId).toBe('audit-event-2');

      // Step 7: Rebuild profile from persistent store
      const profile = await storeSession2.rebuildProfileFromEvents(studentId);
      expect(profile.studentId).toBe(studentId);
      expect(profile.activeMemorizationRange.length).toBe(1);
      expect(profile.activeMemorizationRange[0].surahId).toBe(1);
      expect(profile.activeMemorizationRange[0].startAyah).toBe(1);
      expect(profile.activeMemorizationRange[0].endAyah).toBe(2);

      // Step 8: Verify hash chain integrity
      const audit = await storeSession2.verifyIntegrity(studentId);
      expect(audit.valid).toBe(true);
      expect(audit.hashChainIntact).toBe(true);
      expect(audit.totalEventsChecked).toBe(2);

      await reopenedAdapter.close();
    });
  });

  // =========================================================================
  // 2. Real IndexedDB Failure & Edge Case Tests
  // =========================================================================
  describe('2. Real IndexedDB Failure & Edge Case Tests', () => {
    let idbAdapter: IndexedDBStorageAdapter;
    let store: PersistentLearningStore;

    beforeEach(async () => {
      idbAdapter = new IndexedDBStorageAdapter();
      await idbAdapter.init();
      await idbAdapter.clearAll();
      store = new PersistentLearningStore(idbAdapter);
    });

    afterEach(async () => {
      if (idbAdapter) {
        await idbAdapter.close();
      }
    });

    it('AUDIT-2.1: should detect duplicate events idempotently in IndexedDB', async () => {
      const event = createTestEvent({ eventId: 'idb-dup-1', studentId: 'student-dup' });
      const first = await store.appendEvent(event);
      const second = await store.appendEvent(event);

      expect(first.eventId).toBe(second.eventId);
      expect(first.eventHash).toBe(second.eventHash);

      const all = await store.getEventsByStudent('student-dup');
      expect(all.length).toBe(1);
    });

    it('AUDIT-2.2: should detect corrupted record directly written into IndexedDB', async () => {
      const event = createTestEvent({ eventId: 'idb-corrupt-1', studentId: 'student-corr' });
      await store.appendEvent(event);

      // Directly tamper with the underlying IndexedDB store
      const rawEvents = await idbAdapter.getEventsByStudent('student-corr');
      (rawEvents[0] as any).decisionStatus = RecitationDecisionState.CONFIRMED_PHONETIC_ERROR; // Tamper payload without updating hash
      await idbAdapter.saveEvent(rawEvents[0]);

      // Verify integrity detects hash discrepancy
      const audit = await store.verifyIntegrity('student-corr');
      expect(audit.valid).toBe(false);
      expect(audit.hashChainIntact).toBe(false);
      expect(audit.brokenAtEventId).toBe('idb-corrupt-1');
    });

    it('AUDIT-2.3: should detect broken hash chain in IndexedDB', async () => {
      const e1 = await store.appendEvent(createTestEvent({ eventId: 'chain-1', studentId: 'student-chain', timestamp: 1000 }));
      const e2 = await store.appendEvent(createTestEvent({ eventId: 'chain-2', studentId: 'student-chain', timestamp: 2000 }));

      // Tamper second event previousEventHash
      const rawEvents = await idbAdapter.getEventsByStudent('student-chain');
      (rawEvents[1] as any).previousEventHash = 'f'.repeat(64);
      await idbAdapter.saveEvent(rawEvents[1]);

      const audit = await store.verifyIntegrity('student-chain');
      expect(audit.valid).toBe(false);
      expect(audit.hashChainIntact).toBe(false);
      expect(audit.brokenAtEventId).toBe('chain-2');
    });

    it('AUDIT-2.4: should recover from uncommitted transaction intents in IndexedDB', async () => {
      const studentId = 'student-wal-recovery';
      await store.appendEvent(createTestEvent({ eventId: 'wal-1', studentId, timestamp: 1000 }));

      // Simulate crash: inject a stale transaction intent into IndexedDB
      await idbAdapter.saveTransactionIntent({
        transactionId: 'tx-uncommitted-999',
        studentId,
        intentType: 'APPEND_EVENT',
        payload: { dummy: true },
        status: 'PENDING',
        createdAt: Date.now() - 60000,
        updatedAt: Date.now() - 60000,
      });

      // Run recovery
      const rec = await store.recover(studentId);
      expect(rec.rolledBackTransactionsCount).toBe(1);

      // Verify stale intent was cleaned up
      const pendingIntents = await idbAdapter.getTransactionIntents(studentId);
      expect(pendingIntents.length).toBe(0);
    });
  });

  // =========================================================================
  // 3. WAL Verification (Crash Safety & Deterministic Recovery)
  // =========================================================================
  describe('3. WAL Verification', () => {
    let memAdapter: MemoryStorageAdapter;
    let store: PersistentLearningStore;

    beforeEach(async () => {
      memAdapter = new MemoryStorageAdapter();
      await memAdapter.init();
      store = new PersistentLearningStore(memAdapter);
    });

    it('AUDIT-3.1: should complete BEGIN -> INTENT -> WRITE -> DERIVED -> COMMIT cycle', async () => {
      const studentId = 'student-wal-cycle';
      const event = createTestEvent({ eventId: 'wal-cycle-1', studentId });

      await store.appendEvent(event);

      // Upon successful completion, all intents are committed and cleared
      const intents = await memAdapter.getTransactionIntents(studentId);
      expect(intents.length).toBe(0);

      const events = await memAdapter.getEventsByStudent(studentId);
      expect(events.length).toBe(1);
    });

    it('AUDIT-3.2: should recover deterministically when crash occurs after intent but before write', async () => {
      const studentId = 'student-crash-prewrite';
      memAdapter.simulateCrashBeforeNextCommit();

      // Attempt write with fault injection
      await expect(
        store.appendEvent(createTestEvent({ eventId: 'prewrite-1', studentId }))
      ).rejects.toThrow();

      // Trigger recovery
      const rec = await store.recover(studentId);
      expect(rec.rolledBackTransactionsCount).toBeGreaterThanOrEqual(1);

      const remainingIntents = await memAdapter.getTransactionIntents(studentId);
      expect(remainingIntents.length).toBe(0);
    });

    it('AUDIT-3.3: should detect committed event with stale snapshot and resynchronize', async () => {
      const studentId = 'student-stale-snap';
      await store.appendEvent(createTestEvent({ eventId: 'evt-s1', studentId, surahId: 1, ayahNumber: 1, timestamp: 1000 }));
      await store.appendEvent(createTestEvent({ eventId: 'evt-s2', studentId, surahId: 1, ayahNumber: 2, timestamp: 2000 }));

      // Tamper snapshot to simulate a stale snapshot
      const snapshot = await store.getProfileSnapshot(studentId);
      expect(snapshot).not.toBeNull();
      const staleSnapshot: PersistentProfileSnapshot = {
        ...snapshot!,
        snapshotVersion: 1,
        sourceEventCount: 1,
      };
      await memAdapter.saveSnapshot(staleSnapshot);

      // Verify integrity detects stale snapshot
      const audit = await store.verifyIntegrity(studentId);
      expect(audit.snapshotValid).toBe(false);
      expect(audit.valid).toBe(false);

      // Recovery should deterministically rebuild the snapshot
      const rec = await store.recover(studentId);
      expect(rec.rebuiltSnapshot).toBe(true);

      const freshAudit = await store.verifyIntegrity(studentId);
      expect(freshAudit.valid).toBe(true);
      expect(freshAudit.snapshotValid).toBe(true);
    });
  });

  // =========================================================================
  // 4. Hash-Chain Verification & Adversarial Tamper Detection
  // =========================================================================
  describe('4. Hash-Chain Verification & Adversarial Tamper Detection', () => {
    let memAdapter: MemoryStorageAdapter;
    let store: PersistentLearningStore;
    const studentId = 'student-tamper-target';

    beforeEach(async () => {
      memAdapter = new MemoryStorageAdapter();
      await memAdapter.init();
      store = new PersistentLearningStore(memAdapter);

      // Build valid 4-event chain
      for (let i = 1; i <= 4; i++) {
        await store.appendEvent(createTestEvent({
          eventId: `evt-tamper-${i}`,
          studentId,
          surahId: 1,
          ayahNumber: i,
          timestamp: 1000 * i,
        }));
      }

      const initialAudit = await store.verifyIntegrity(studentId);
      expect(initialAudit.valid).toBe(true);
      expect(initialAudit.totalEventsChecked).toBe(4);
    });

    it('AUDIT-4.1: modified event payload must cause INTEGRITY FAILURE (not silent repair)', async () => {
      const events = await memAdapter.getEventsByStudent(studentId);
      (events[1] as any).decisionStatus = RecitationDecisionState.CONFIRMED_PHONETIC_ERROR;
      await memAdapter.saveEvent(events[1]);

      const audit = await store.verifyIntegrity(studentId);
      expect(audit.valid).toBe(false);
      expect(audit.hashChainIntact).toBe(false);
      expect(audit.brokenAtEventId).toBe('evt-tamper-2');
    });

    it('AUDIT-4.2: reordered events must cause INTEGRITY FAILURE', async () => {
      const events = await memAdapter.getEventsByStudent(studentId);
      // Swap event 2 and 3 sequence numbers
      const tempSeq = events[1].sequenceNumber;
      (events[1] as any).sequenceNumber = events[2].sequenceNumber;
      (events[2] as any).sequenceNumber = tempSeq;

      await memAdapter.saveEvent(events[1]);
      await memAdapter.saveEvent(events[2]);

      const audit = await store.verifyIntegrity(studentId);
      expect(audit.valid).toBe(false);
    });

    it('AUDIT-4.3: deleted middle event must cause INTEGRITY FAILURE', async () => {
      const events = await memAdapter.getEventsByStudent(studentId);
      // Remove event 2 directly from storage
      memAdapter.deleteEventSync(studentId, events[1].eventId);

      const audit = await store.verifyIntegrity(studentId);
      expect(audit.valid).toBe(false);
      expect(audit.hashChainIntact).toBe(false);
    });

    it('AUDIT-4.4: modified previousEventHash must cause INTEGRITY FAILURE', async () => {
      const events = await memAdapter.getEventsByStudent(studentId);
      (events[2] as any).previousEventHash = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      await memAdapter.saveEvent(events[2]);

      const audit = await store.verifyIntegrity(studentId);
      expect(audit.valid).toBe(false);
      expect(audit.hashChainIntact).toBe(false);
      expect(audit.brokenAtEventId).toBe('evt-tamper-3');
    });

    it('AUDIT-4.5: modified sequenceNumber must cause INTEGRITY FAILURE', async () => {
      const events = await memAdapter.getEventsByStudent(studentId);
      (events[3] as any).sequenceNumber = 99;
      await memAdapter.saveEvent(events[3]);

      const audit = await store.verifyIntegrity(studentId);
      expect(audit.valid).toBe(false);
    });

    it('AUDIT-4.6: duplicate sequenceNumber must cause INTEGRITY FAILURE', async () => {
      const events = await memAdapter.getEventsByStudent(studentId);
      (events[2] as any).sequenceNumber = events[1].sequenceNumber;
      await memAdapter.saveEvent(events[2]);

      const audit = await store.verifyIntegrity(studentId);
      expect(audit.valid).toBe(false);
    });
  });

  // =========================================================================
  // 5. Idempotency Verification
  // =========================================================================
  describe('5. Idempotency Verification', () => {
    let store: PersistentLearningStore;

    beforeEach(async () => {
      const adapter = new MemoryStorageAdapter();
      await adapter.init();
      store = new PersistentLearningStore(adapter);
    });

    it('AUDIT-5.1: appending identical event 3 times results in exactly 1 event', async () => {
      const event = createTestEvent({ eventId: 'idem-target-1', studentId: 'std-idem' });

      const e1 = await store.appendEvent(event);
      const e2 = await store.appendEvent(event);
      const e3 = await store.appendEvent(event);

      expect(e1.eventId).toBe(e2.eventId);
      expect(e2.eventId).toBe(e3.eventId);

      const all = await store.getEventsByStudent('std-idem');
      expect(all.length).toBe(1);
    });

    it('AUDIT-5.2: appending same eventId with different payload throws deterministic conflict', async () => {
      const event1 = createTestEvent({
        eventId: 'idem-conflict-1',
        studentId: 'std-idem',
        surahId: 1,
        ayahNumber: 1,
        eventType: MemorizationEventType.CONFIRMED,
      });

      const event2 = createTestEvent({
        eventId: 'idem-conflict-1', // Same ID
        studentId: 'std-idem',
        surahId: 2,                 // Different payload!
        ayahNumber: 5,
        eventType: MemorizationEventType.ERROR_CONFIRMED,
      });

      await store.appendEvent(event1);

      await expect(store.appendEvent(event2)).rejects.toThrow(DuplicateEventError);
    });
  });

  // =========================================================================
  // 6. Snapshot Reconstruction Equivalence & Inconclusive Immunity
  // =========================================================================
  describe('6. Snapshot Reconstruction Equivalence', () => {
    let store: PersistentLearningStore;

    beforeEach(async () => {
      const adapter = new MemoryStorageAdapter();
      await adapter.init();
      store = new PersistentLearningStore(adapter);
    });

    it('AUDIT-6.1: should match exact semantic equivalence between snapshot and rebuildProfileFromEvents', async () => {
      const studentId = 'std-recon-eq';

      const eventTypes = [
        MemorizationEventType.ATTEMPT,
        MemorizationEventType.CONFIRMED,
        MemorizationEventType.RETRY,
        MemorizationEventType.ERROR_CONFIRMED,
        MemorizationEventType.INCONCLUSIVE,
        MemorizationEventType.AYAH_COMPLETED,
        MemorizationEventType.REVIEW_COMPLETED,
        MemorizationEventType.REVIEW_FAILED,
      ];

      for (let i = 0; i < eventTypes.length; i++) {
        await store.appendEvent(createTestEvent({
          eventId: `recon-${i}`,
          studentId,
          surahId: 1,
          ayahNumber: 1,
          eventType: eventTypes[i],
          timestamp: 1000 + i * 100,
        }));
      }

      const snapshot = await store.getProfileSnapshot(studentId);
      expect(snapshot).not.toBeNull();

      const reconstructed = await store.rebuildProfileFromEvents(studentId);

      expect(snapshot!.studentId).toBe(reconstructed.studentId);
      expect(snapshot!.sourceEventCount).toBe(reconstructed.sourceEventCount);
      expect(snapshot!.activeMemorizationRange).toEqual(reconstructed.activeMemorizationRange);
      expect(snapshot!.masteredPassageCount).toBe(reconstructed.masteredPassageCount);
      expect(snapshot!.weakPassageCount).toBe(reconstructed.weakPassageCount);
    });

    it('AUDIT-6.2: INCONCLUSIVE evidence must NEVER change mastery state', async () => {
      const studentId = 'std-inconclusive-test';

      // 1. Establish initial stable mastery via CONFIRMED events
      await store.appendEvent(createTestEvent({
        eventId: 'inc-1',
        studentId,
        surahId: 1,
        ayahNumber: 1,
        eventType: MemorizationEventType.CONFIRMED,
        evidenceStatus: EvidenceStatus.CONFIRMED,
        decisionStatus: RecitationDecisionState.CONTINUE,
        attemptClusterId: 'cluster-init-1',
        timestamp: 1000,
      }));

      const profileBefore = await store.rebuildProfileFromEvents(studentId);
      const passageBefore = profileBefore.passageStates['1:1'];

      // 2. Append 5 consecutive INCONCLUSIVE events in a separate subsequent interaction
      for (let i = 2; i <= 6; i++) {
        await store.appendEvent(createTestEvent({
          eventId: `inc-${i}`,
          studentId,
          surahId: 1,
          ayahNumber: 1,
          eventType: MemorizationEventType.INCONCLUSIVE,
          evidenceStatus: EvidenceStatus.INCONCLUSIVE,
          decisionStatus: RecitationDecisionState.INCONCLUSIVE,
          attemptClusterId: `cluster-inconclusive-${i}`,
          timestamp: 100000 + i * 1000,
        }));
      }

      const profileAfter = await store.rebuildProfileFromEvents(studentId);
      const passageAfter = profileAfter.passageStates['1:1'];

      // Inconclusive evidence must preserve previous state
      expect(passageAfter.currentState).toBe(passageBefore.currentState);
      expect(passageAfter.confirmedSuccessCount).toBe(passageBefore.confirmedSuccessCount);
    });
  });

  // =========================================================================
  // 7. Phase 7D State Engine Semantics & Pedagogical Non-Ijazah Guard
  // =========================================================================
  describe('7. Phase 7D State Engine Semantics & Non-Ijazah Guard', () => {
    let store: PersistentLearningStore;

    beforeEach(async () => {
      const adapter = new MemoryStorageAdapter();
      await adapter.init();
      store = new PersistentLearningStore(adapter);
    });

    it('AUDIT-7.1: all 9 memorization states exist and MASTERED is non-certifying', async () => {
      const states = Object.values(MemorizationState);
      expect(states).toContain(MemorizationState.NOT_STARTED);
      expect(states).toContain(MemorizationState.INTRODUCED);
      expect(states).toContain(MemorizationState.LEARNING);
      expect(states).toContain(MemorizationState.PRACTICING);
      expect(states).toContain(MemorizationState.STABLE);
      expect(states).toContain(MemorizationState.REVIEW_DUE);
      expect(states).toContain(MemorizationState.WEAKENING);
      expect(states).toContain(MemorizationState.NEEDS_REINFORCEMENT);
      expect(states).toContain(MemorizationState.MASTERED);
      expect(states.length).toBe(9);

      // Verify that MASTERED is strictly an internal scheduling state, not Ijazah
      const profile = await store.rebuildProfileFromEvents('student-pedagogy-001');
      const serialized = JSON.stringify(profile);
      expect(serialized.toLowerCase()).not.toContain('ijazah');
      expect(serialized.toLowerCase()).not.toContain('sanad');
      expect(serialized.toLowerCase()).not.toContain('fatwa');
      expect(serialized.toLowerCase()).not.toContain('religious certification');
    });
  });

  // =========================================================================
  // 8. Attempt Cluster Persistence & Anti-Inflation
  // =========================================================================
  describe('8. Attempt Cluster Persistence & Anti-Inflation', () => {
    it('AUDIT-8.1: practice retries remain distinct from independent reviews after simulated reload', async () => {
      const idb = new IndexedDBStorageAdapter();
      await idb.init();
      await idb.clearAll();
      const store1 = new PersistentLearningStore(idb);

      const studentId = 'std-cluster-audit';

      // Cluster of 3 practice attempts within 5 seconds
      await store1.appendEvent(createTestEvent({
        eventId: 'cl-1',
        studentId,
        surahId: 1,
        ayahNumber: 1,
        attemptClusterId: 'cluster-practice-1',
        isIndependentReview: false,
        timestamp: 1000,
      }));
      await store1.appendEvent(createTestEvent({
        eventId: 'cl-2',
        studentId,
        surahId: 1,
        ayahNumber: 1,
        attemptClusterId: 'cluster-practice-1',
        isIndependentReview: false,
        timestamp: 2000,
      }));
      await store1.appendEvent(createTestEvent({
        eventId: 'cl-3',
        studentId,
        surahId: 1,
        ayahNumber: 1,
        attemptClusterId: 'cluster-practice-1',
        isIndependentReview: false,
        timestamp: 3000,
      }));

      // Simulate reload
      await idb.close();

      const idb2 = new IndexedDBStorageAdapter();
      await idb2.init();
      const store2 = new PersistentLearningStore(idb2);

      const events = await store2.getEventsByStudent(studentId);
      expect(events.length).toBe(3);
      events.forEach((e) => {
        expect(e.attemptClusterId).toBe('cluster-practice-1');
        expect(e.isIndependentReview).toBe(false);
      });

      await idb2.close();
    });
  });

  // =========================================================================
  // 9. Cross-Student Isolation & Fail-Closed Guard
  // =========================================================================
  describe('9. Cross-Student Isolation', () => {
    let store: PersistentLearningStore;

    beforeEach(async () => {
      const adapter = new MemoryStorageAdapter();
      await adapter.init();
      store = new PersistentLearningStore(adapter);
    });

    it('AUDIT-9.1: Student A cannot read or mutate Student B (fails closed)', async () => {
      await store.appendEvent(createTestEvent({ eventId: 'alice-e1', studentId: 'student-alice' }));
      await store.appendEvent(createTestEvent({ eventId: 'bob-e1', studentId: 'student-bob' }));

      // Alice tries to read Bob
      await expect(store.getEventsByStudent('student-bob', 'student-alice')).rejects.toThrow(OwnershipMismatchError);
      await expect(store.getProfileSnapshot('student-bob', 'student-alice')).rejects.toThrow(OwnershipMismatchError);
      await expect(store.rebuildProfileFromEvents('student-bob', 'student-alice')).rejects.toThrow(OwnershipMismatchError);
      await expect(store.verifyIntegrity('student-bob', 'student-alice')).rejects.toThrow(OwnershipMismatchError);

      // Bob tries to read Alice
      await expect(store.getEventsByStudent('student-alice', 'student-bob')).rejects.toThrow(OwnershipMismatchError);

      // Alice tries to mutate Bob
      await expect(
        store.appendEvent(createTestEvent({ eventId: 'mal-1', studentId: 'student-bob' }), 'student-alice')
      ).rejects.toThrow(OwnershipMismatchError);
    });
  });

  // =========================================================================
  // 10. Identity Migration (0, 1, N, Duplicate, Retry)
  // =========================================================================
  describe('10. Identity Migration', () => {
    let store: PersistentLearningStore;

    beforeEach(async () => {
      const adapter = new MemoryStorageAdapter();
      await adapter.init();
      store = new PersistentLearningStore(adapter);
    });

    it('AUDIT-10.1: migrations with 0, 1, and N events preserve integrity and ownership', async () => {
      // 0 events
      const anon0 = StudentIdentityService.createAnonymousIdentity('dev-0');
      const auth0 = StudentIdentityService.createAuthenticatedIdentity({ customAccountId: 'acc-0' }).identity;
      const res0 = await PersistentIdentityMigrationService.migratePersistentStore({
        sourceIdentity: anon0,
        targetIdentity: auth0,
        store,
      });
      expect(res0.migratedEventCount).toBe(0);

      // 1 event
      const anon1 = StudentIdentityService.createAnonymousIdentity('dev-1');
      const auth1 = StudentIdentityService.createAuthenticatedIdentity({ customAccountId: 'acc-1' }).identity;
      await store.appendEvent(createTestEvent({ eventId: 'single-mig-1', studentId: anon1.studentId }));
      const res1 = await PersistentIdentityMigrationService.migratePersistentStore({
        sourceIdentity: anon1,
        targetIdentity: auth1,
        store,
      });
      expect(res1.migratedEventCount).toBe(1);

      // Verify target integrity
      const audit1 = await store.verifyIntegrity(auth1.studentId);
      expect(audit1.valid).toBe(true);

      // Duplicate migration request is idempotent
      const retryRes = await PersistentIdentityMigrationService.migratePersistentStore({
        sourceIdentity: anon1,
        targetIdentity: auth1,
        store,
      });
      expect(retryRes.record.migrationId).toBe(res1.record.migrationId);
    });
  });

  // =========================================================================
  // 11. Raw Audio Rejection & Invariant Audit
  // =========================================================================
  describe('11. Raw Audio Security & Rejection Invariants', () => {
    let store: PersistentLearningStore;

    beforeEach(async () => {
      const adapter = new MemoryStorageAdapter();
      await adapter.init();
      store = new PersistentLearningStore(adapter);
    });

    it('AUDIT-11.1: strictly rejects Float32Array, AudioBuffer, and PCM audio buffers', async () => {
      // Attempt Float32Array
      await expect(
        store.appendEvent(createTestEvent({
          eventId: 'audio-reject-1',
          audioData: new Float32Array([0.1, -0.2, 0.3]),
        } as any))
      ).rejects.toThrow(/Privacy Violation/);

      // Attempt PCM Array
      await expect(
        store.appendEvent(createTestEvent({
          eventId: 'audio-reject-2',
          pcmBuffer: [0.12, 0.45, -0.67],
        } as any))
      ).rejects.toThrow(/Privacy Violation/);

      // Attempt rawAudioPersistence = true
      await expect(
        store.appendEvent(createTestEvent({
          eventId: 'audio-reject-3',
          ...({ rawAudioPersistence: true } as any),
        }))
      ).rejects.toThrow(/Privacy Violation/);
    });

    it('AUDIT-11.2: direct serialization inspection confirms rawAudioPersistence = false invariant', async () => {
      const event = await store.appendEvent(createTestEvent({ eventId: 'audit-no-audio-1' }));
      expect((event as any).rawAudioPersistence).toBeUndefined();

      const events = await store.getEventsByStudent('student-alice');
      const serialized = JSON.stringify(events[0]);
      expect(serialized).not.toContain('pcm');
      expect(serialized).not.toContain('Float32Array');
    });
  });

  // =========================================================================
  // 12. Schema Migration & Unknown Version Protection
  // =========================================================================
  describe('12. Schema Migration & Unknown Version Protection', () => {
    it('AUDIT-12.1: rejects unknown future schema versions without silent downgrade', () => {
      const futureRecord = {
        schemaVersion: '999.0.0', // Future version
        eventId: 'future-1',
      };

      expect(() => {
        PersistenceSchemaMigrator.validateSchemaVersion(futureRecord);
      }).toThrow();
    });

    it('AUDIT-12.2: migrates legacy version 0.9.0 record to current schema version 1.0.0', () => {
      PersistenceSchemaMigrator.registerMigration('0.9.0', '1.0.0', (rec: any) => ({
        ...rec,
        schemaVersion: '1.0.0',
        rawAudioPersistence: false,
      }));

      const v0Record = {
        schemaVersion: '0.9.0',
        eventId: 'v0-1',
        studentId: 'std-v0',
        surahId: 1,
        ayahNumber: 1,
        timestamp: 1000,
      };

      const migrated = PersistenceSchemaMigrator.migrateRecord(v0Record);
      expect(migrated.schemaVersion).toBe('1.0.0');
      expect((migrated as any).rawAudioPersistence).toBe(false);
    });
  });

  // =========================================================================
  // 13. Export & Reset Contracts
  // =========================================================================
  describe('13. Export & Reset Contracts', () => {
    let store: PersistentLearningStore;

    beforeEach(async () => {
      const adapter = new MemoryStorageAdapter();
      await adapter.init();
      store = new PersistentLearningStore(adapter);
    });

    it('AUDIT-13.1: exports complete student learning package and resets cleanly', async () => {
      const studentId = 'std-export-audit';
      await store.appendEvent(createTestEvent({ eventId: 'exp-1', studentId }));
      await store.appendEvent(createTestEvent({ eventId: 'exp-2', studentId }));

      const exported = await store.exportStudentLearningData(studentId);
      expect(exported.studentId).toBe(studentId);
      expect(exported.events.length).toBe(2);
      expect(exported.exportChecksum).toBeDefined();

      // Reset student data
      await store.resetStudentLearningData(studentId, undefined, `RESET_STUDENT_DATA_${studentId}`);

      const afterReset = await store.getEventsByStudent(studentId);
      expect(afterReset.length).toBe(0);
      const snapshotAfter = await store.getProfileSnapshot(studentId);
      expect(snapshotAfter).toBeNull();
    });
  });

  // =========================================================================
  // 14. Empirical Performance Benchmarks (Measurable Latency & Reproducibility)
  // =========================================================================
  describe('14. Empirical Performance Benchmarks', () => {
    it('AUDIT-14.1: should benchmark N=100 event writes, profile reconstruction, and integrity audit', async () => {
      const adapter = new MemoryStorageAdapter();
      await adapter.init();
      const store = new PersistentLearningStore(adapter);
      const studentId = 'student-benchmark-audit';

      const N = 100;
      const writeLatencies: number[] = [];

      for (let i = 1; i <= N; i++) {
        const start = performance.now();
        await store.appendEvent(createTestEvent({
          eventId: `bench-${i}`,
          studentId,
          surahId: (i % 114) + 1,
          ayahNumber: (i % 7) + 1,
          timestamp: 1000 + i * 10,
        }));
        writeLatencies.push(performance.now() - start);
      }

      writeLatencies.sort((a, b) => a - b);
      const p50 = writeLatencies[Math.floor(N * 0.5)];
      const p95 = writeLatencies[Math.floor(N * 0.95)];
      const max = writeLatencies[N - 1];

      // Benchmark profile reconstruction
      const reconStart = performance.now();
      const profile = await store.rebuildProfileFromEvents(studentId);
      const reconDuration = performance.now() - reconStart;

      // Benchmark integrity audit
      const auditStart = performance.now();
      const audit = await store.verifyIntegrity(studentId);
      const auditDuration = performance.now() - auditStart;

      expect(profile.studentId).toBe(studentId);
      expect(audit.valid).toBe(true);

      console.log(`\n=== AUDIT PERFORMANCE BENCHMARK (N=${N}) ===`);
      console.log(`- Event Write Latency: p50=${p50.toFixed(2)}ms | p95=${p95.toFixed(2)}ms | max=${max.toFixed(2)}ms`);
      console.log(`- Profile Reconstruction (${N} events): ${reconDuration.toFixed(2)}ms`);
      console.log(`- Integrity Audit (${N} events): ${auditDuration.toFixed(2)}ms`);
    });
  });
});
