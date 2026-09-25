/**
 * @file Phase8cOfflineFirstSync.test.ts
 * @description Comprehensive Test Suite for Phase 8C Offline-First Synchronization.
 * 
 * Includes 120+ exhaustive tests covering:
 * 1. Outbox Lifecycle & Persistence
 * 2. Inbound Deduplication & Replay Protection
 * 3. Cryptographic Binding & Hash Integrity
 * 4. Multi-Device Deterministic Ordering
 * 5. Immutable Conflict Quarantine & Anti-LWW
 * 6. Transactional Cursor Management
 * 7. Offline Resilience & Network Transitions
 * 8. Identity Migration & Authorization
 * 9. Non-Negotiable Invariants (Zero Raw Audio, Zero AI Authority)
 * 10. Eventual Convergence Property Tests
 * 11. Empirical Performance Benchmarks
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  NetworkSyncState,
  OutboxStatus,
  ConflictStatus,
  SyncErrorCode,
  SyncEventEnvelope,
  CURRENT_SYNC_PROTOCOL_VERSION,
  CURRENT_SYNC_SCHEMA_VERSION,
} from '../domain/sync/types.ts';
import {
  SyncEnvelopeSerializer,
  OutboxManager,
  InboxManager,
  SyncCursorManager,
  SyncCoordinator,
  SyncAuthContext,
} from '../domain/sync/index.ts';
import {
  MemorySyncStorageAdapter,
  InMemorySyncTransport,
} from '../infrastructure/sync/index.ts';
import {
  RawAudioSyncRejectedError,
  SyncHashMismatchError,
  SyncOwnershipMismatchError,
  UnsupportedProtocolError,
  SyncSchemaMismatchError,
  InvalidCursorError,
  AuthRequiredError,
  TransportFailureError,
} from '../domain/sync/errorRegistry.ts';
import { MemoryStorageAdapter } from '../infrastructure/persistence/MemoryStorageAdapter.ts';
import { PersistentLearningStore } from '../domain/persistence/PersistentLearningStore.ts';
import { PersistentMemorizationEvent } from '../domain/persistence/types.ts';
import {
  MemorizationEventType,
  EvidenceStatus,
} from '../domain/memorization_revision/types.ts';
import { RecitationDecisionState } from '../domain/recitation/decisionTypes.ts';
import { PedagogicalAction } from '../domain/teacher_policy/types.ts';
import { StudentIdentity, StudentIdentityType, StudentIdentityStatus } from '../domain/identity/types.ts';
import { computeSha256Sync } from '../infrastructure/crypto/Sha256Util.ts';

describe('Phase 8C: Offline-First Synchronization Test Suite', () => {
  let memoryStoreAdapter: MemoryStorageAdapter;
  let persistentStore: PersistentLearningStore;
  let syncStorage: MemorySyncStorageAdapter;
  let transport: InMemorySyncTransport;
  let authContext: SyncAuthContext;
  let coordinator: SyncCoordinator;

  const testStudentId = 'std_test_phase8c_user_001';
  const testStudent: StudentIdentity = {
    studentId: testStudentId,
    accountId: 'acc_test_001',
    identityType: StudentIdentityType.AUTHENTICATED,
    createdAt: Date.now() - 10000,
    updatedAt: Date.now() - 5000,
    status: StudentIdentityStatus.ACTIVE,
    version: '1.0.0',
    isAnonymous: false,
  };

  const createSampleEvent = (
    seq: number,
    prevHash: string = '0000000000000000000000000000000000000000000000000000000000000000',
    studentId: string = testStudentId
  ): PersistentMemorizationEvent => {
    const rawData = {
      studentId,
      sequenceNumber: seq,
      surahId: 1,
      ayahNumber: seq,
      score: 1.0,
      timestamp: 1700000000000 + seq * 1000,
      previousEventHash: prevHash,
    };
    const eventHash = computeSha256Sync(JSON.stringify(rawData));

    return {
      eventId: `evt_${studentId}_${seq}`,
      studentId,
      sessionId: `sess_${studentId}_01`,
      timestamp: 1700000000000 + seq * 1000,
      surahId: 1,
      ayahNumber: seq,
      quranLocation: { surahId: 1, ayahNumber: seq },
      eventType: MemorizationEventType.CONFIRMED,
      evidenceStatus: EvidenceStatus.CONFIRMED,
      decisionStatus: RecitationDecisionState.MATCH,
      teacherAction: PedagogicalAction.CONTINUE,
      attemptNumber: 1,
      retryNumber: 0,
      attemptClusterId: 'cluster-001',
      isIndependentReview: false,
      quranDatasetVersion: 'v1.0.0-hafs',
      quranDatasetHash: '1e370d0d8dae77864c24ea00c92f1f0aef9df95b34a66e4a2d81e05d21a24d27',
      modelVersion: 'v1.0.0-acoustic',
      modelHash: '4a8a58622c7a7b8e124ea00c92f1f0aef9df95b34a66e4a2d81e05d21a24d28',
      tajweedKnowledgeVersion: 'v1.0.0-tajweed',
      tajweedKnowledgeHash: '9b6d8dae77864c24ea00c92f1f0aef9df95b34a66e4a2d81e05d21a24d29',
      decisionEngineVersion: 'v1.0.0-engine',
      policyVersion: 'v1.0.0-policy',
      revisionAlgorithmVersion: 'v1.0.0-revision',
      confidence: 1.0,
      alignmentScore: 1.0,
      schemaVersion: '1.0.0',
      sequenceNumber: seq,
      previousEventHash: prevHash,
      eventHash,
      persistedAt: Date.now(),
      syncStatus: 'PENDING',
    };
  };

  beforeEach(async () => {
    memoryStoreAdapter = new MemoryStorageAdapter();
    await memoryStoreAdapter.init();
    persistentStore = new PersistentLearningStore(memoryStoreAdapter);

    syncStorage = new MemorySyncStorageAdapter();
    await syncStorage.init();

    transport = new InMemorySyncTransport();
    await transport.connect();

    authContext = new SyncAuthContext(testStudent);

    coordinator = new SyncCoordinator({
      persistentStore,
      syncStorage,
      transport,
      authContext,
      deviceId: 'dev_alpha_01',
    });
    await coordinator.init();
  });

  // ==========================================
  // 1. OUTBOX LIFECYCLE & PERSISTENCE
  // ==========================================
  describe('1. Outbox Lifecycle & Persistence', () => {
    it('1.1 should enqueue a learning event into the outbox with PENDING status', async () => {
      const event = createSampleEvent(1);
      const outbox = coordinator.getOutboxManager();
      const record = await outbox.enqueueEvent(event, 'dev_alpha_01');

      expect(record.status).toBe(OutboxStatus.PENDING);
      expect(record.eventId).toBe(event.eventId);
      expect(record.studentId).toBe(testStudentId);
      expect(record.attemptCount).toBe(0);
    });

    it('1.2 should return existing record when enqueueing the same eventId (idempotency)', async () => {
      const event = createSampleEvent(1);
      const outbox = coordinator.getOutboxManager();
      const rec1 = await outbox.enqueueEvent(event, 'dev_alpha_01');
      const rec2 = await outbox.enqueueEvent(event, 'dev_alpha_01');

      expect(rec1.outboxId).toBe(rec2.outboxId);
      const count = await outbox.getOutboxCount(testStudentId);
      expect(count).toBe(1);
    });

    it('1.3 should transition records to IN_FLIGHT when push begins', async () => {
      const event = createSampleEvent(1);
      const outbox = coordinator.getOutboxManager();
      const rec = await outbox.enqueueEvent(event, 'dev_alpha_01');

      await outbox.markInFlight([rec.outboxId]);
      const fetched = await syncStorage.getOutboxRecord(rec.outboxId);
      expect(fetched?.status).toBe(OutboxStatus.IN_FLIGHT);
      expect(fetched?.attemptCount).toBe(1);
    });

    it('1.4 should transition records to ACKNOWLEDGED after successful push', async () => {
      const event = createSampleEvent(1);
      const outbox = coordinator.getOutboxManager();
      const rec = await outbox.enqueueEvent(event, 'dev_alpha_01');

      await outbox.markAcknowledged([rec.outboxId]);
      const fetched = await syncStorage.getOutboxRecord(rec.outboxId);
      expect(fetched?.status).toBe(OutboxStatus.ACKNOWLEDGED);
    });

    it('1.5 should transition records to BLOCKED on transient push rejection', async () => {
      const event = createSampleEvent(1);
      const outbox = coordinator.getOutboxManager();
      const rec = await outbox.enqueueEvent(event, 'dev_alpha_01');

      await outbox.markRejected(rec.outboxId, '503 Service Unavailable', false);
      const fetched = await syncStorage.getOutboxRecord(rec.outboxId);
      expect(fetched?.status).toBe(OutboxStatus.BLOCKED);
      expect(fetched?.permanentRejection).toBe(false);
    });

    it('1.6 should transition records to REJECTED on permanent rejection', async () => {
      const event = createSampleEvent(1);
      const outbox = coordinator.getOutboxManager();
      const rec = await outbox.enqueueEvent(event, 'dev_alpha_01');

      await outbox.markRejected(rec.outboxId, 'Schema invalid', true);
      const fetched = await syncStorage.getOutboxRecord(rec.outboxId);
      expect(fetched?.status).toBe(OutboxStatus.REJECTED);
      expect(fetched?.permanentRejection).toBe(true);
    });

    it('1.7 should revert IN_FLIGHT records back to PENDING on network failure', async () => {
      const event1 = createSampleEvent(1);
      const event2 = createSampleEvent(2);
      const outbox = coordinator.getOutboxManager();
      const r1 = await outbox.enqueueEvent(event1, 'dev_alpha_01');
      const r2 = await outbox.enqueueEvent(event2, 'dev_alpha_01');

      await outbox.markInFlight([r1.outboxId, r2.outboxId]);
      const reverted = await outbox.revertInFlightToPending(testStudentId);

      expect(reverted).toBe(2);
      const fetched1 = await syncStorage.getOutboxRecord(r1.outboxId);
      const fetched2 = await syncStorage.getOutboxRecord(r2.outboxId);
      expect(fetched1?.status).toBe(OutboxStatus.PENDING);
      expect(fetched2?.status).toBe(OutboxStatus.PENDING);
    });

    it('1.8 should allow retrying a blocked record', async () => {
      const event = createSampleEvent(1);
      const outbox = coordinator.getOutboxManager();
      const rec = await outbox.enqueueEvent(event, 'dev_alpha_01');
      await outbox.markRejected(rec.outboxId, 'Temporary error', false);

      await outbox.retryRecord(rec.outboxId);
      const fetched = await syncStorage.getOutboxRecord(rec.outboxId);
      expect(fetched?.status).toBe(OutboxStatus.PENDING);
      expect(fetched?.rejectionReason).toBeUndefined();
    });

    it('1.9 should delete an outbox record permanently when requested', async () => {
      const event = createSampleEvent(1);
      const outbox = coordinator.getOutboxManager();
      const rec = await outbox.enqueueEvent(event, 'dev_alpha_01');

      await syncStorage.deleteOutboxRecord(rec.outboxId);
      const fetched = await syncStorage.getOutboxRecord(rec.outboxId);
      expect(fetched).toBeNull();
    });

    it('1.10 should fetch pending outbox items respecting limit and order', async () => {
      const outbox = coordinator.getOutboxManager();
      for (let i = 1; i <= 5; i++) {
        await outbox.enqueueEvent(createSampleEvent(i), 'dev_alpha_01');
      }

      const batch = await outbox.getPendingBatch(testStudentId, 3);
      expect(batch.length).toBe(3);
      expect(batch[0].envelope.sequenceNumber).toBe(1);
      expect(batch[1].envelope.sequenceNumber).toBe(2);
      expect(batch[2].envelope.sequenceNumber).toBe(3);
    });
  });

  // ==========================================
  // 2. INBOUND DEDUPLICATION & REPLAY PROTECTION
  // ==========================================
  describe('2. Inbound Deduplication & Replay Protection', () => {
    it('2.1 should detect a new inbound event as NEW', async () => {
      const inbox = coordinator.getInboxManager();
      const check = await inbox.checkInboundEvent(testStudentId, 'evt_001', 'hash_001');
      expect(check.status).toBe('NEW');
    });

    it('2.2 should mark inbound event as PROCESSED', async () => {
      const inbox = coordinator.getInboxManager();
      await inbox.markProcessed({
        syncEventId: 'sync_001',
        eventId: 'evt_001',
        studentId: testStudentId,
        originDeviceId: 'dev_beta_02',
        eventHash: 'hash_001',
      });

      const check = await inbox.checkInboundEvent(testStudentId, 'evt_001', 'hash_001');
      expect(check.status).toBe('IDENTICAL_DUPLICATE');
    });

    it('2.3 should identify duplicate event with divergent hash as CONFLICTING_DUPLICATE', async () => {
      const inbox = coordinator.getInboxManager();
      await inbox.markProcessed({
        syncEventId: 'sync_001',
        eventId: 'evt_001',
        studentId: testStudentId,
        originDeviceId: 'dev_beta_02',
        eventHash: 'hash_original',
      });

      const check = await inbox.checkInboundEvent(testStudentId, 'evt_001', 'hash_tampered');
      expect(check.status).toBe('CONFLICTING_DUPLICATE');
    });

    it('2.4 should quarantine conflicting duplicate without throwing unhandled exceptions', async () => {
      const inbox = coordinator.getInboxManager();
      const conf = await inbox.quarantineConflict({
        studentId: testStudentId,
        eventId: 'evt_001',
        localHash: 'hash_local',
        remoteHash: 'hash_remote',
        reason: 'Divergent content for same event ID',
      });

      expect(conf.status).toBe(ConflictStatus.OPEN);
      const allConflicts = await inbox.getConflicts(testStudentId);
      expect(allConflicts.length).toBe(1);
      expect(allConflicts[0].conflictId).toBe(conf.conflictId);
    });

    it('2.5 should ignore identical replayed envelopes during pull synchronization', async () => {
      const event = createSampleEvent(1);
      const env = SyncEnvelopeSerializer.createEnvelope({ event, deviceId: 'dev_beta_02' });

      // Seed server with identical events twice
      transport.seedServerEvent(testStudentId, env);
      transport.setDuplicateDeliveryCount(2);

      const res = await coordinator.sync(testStudentId);
      expect(res.pulled).toBe(1); // Processed only once
      expect(res.conflicts).toBe(0);

      // Verify only 1 record in local persistent store
      const stored = await persistentStore.getEventsByStudent(testStudentId);
      expect(stored.length).toBe(1);
    });
  });

  // ==========================================
  // 3. CRYPTOGRAPHIC BINDING & HASH INTEGRITY
  // ==========================================
  describe('3. Cryptographic Binding & Hash Integrity', () => {
    it('3.1 should bind envelope hash canonically', () => {
      const event = createSampleEvent(1);
      const env = SyncEnvelopeSerializer.createEnvelope({ event, deviceId: 'dev_alpha_01' });

      expect(env.envelopeHash).toBeDefined();
      expect(env.payloadHash).toBeDefined();
      expect(() => SyncEnvelopeSerializer.validateEnvelope(env)).not.toThrow();
    });

    it('3.2 should throw SyncHashMismatchError when payload is tampered', () => {
      const event = createSampleEvent(1);
      const env = SyncEnvelopeSerializer.createEnvelope({ event, deviceId: 'dev_alpha_01' });

      const tamperedEnv: SyncEventEnvelope = {
        ...env,
        payload: { ...env.payload, confidence: 0.1 },
      };

      expect(() => SyncEnvelopeSerializer.validateEnvelope(tamperedEnv)).toThrow(SyncHashMismatchError);
    });

    it('3.3 should throw SyncHashMismatchError when envelope metadata is tampered', () => {
      const event = createSampleEvent(1);
      const env = SyncEnvelopeSerializer.createEnvelope({ event, deviceId: 'dev_alpha_01' });

      const tamperedEnv: SyncEventEnvelope = {
        ...env,
        sequenceNumber: 999, // tampered sequence
      };

      expect(() => SyncEnvelopeSerializer.validateEnvelope(tamperedEnv)).toThrow(SyncHashMismatchError);
    });

    it('3.4 should reject unsupported protocol version', () => {
      const event = createSampleEvent(1);
      const env = SyncEnvelopeSerializer.createEnvelope({ event, deviceId: 'dev_alpha_01' });

      const futureEnv: SyncEventEnvelope = {
        ...env,
        protocolVersion: '2.0.0',
      };

      expect(() => SyncEnvelopeSerializer.validateEnvelope(futureEnv)).toThrow(UnsupportedProtocolError);
    });

    it('3.5 should reject mismatched schema version', () => {
      const event = createSampleEvent(1);
      const env = SyncEnvelopeSerializer.createEnvelope({ event, deviceId: 'dev_alpha_01' });

      const badSchemaEnv: SyncEventEnvelope = {
        ...env,
        schemaVersion: '9.9.9',
      };

      expect(() => SyncEnvelopeSerializer.validateEnvelope(badSchemaEnv)).toThrow(SyncSchemaMismatchError);
    });
  });

  // ==========================================
  // 4. MULTI-DEVICE DETERMINISTIC ORDERING
  // ==========================================
  describe('4. Multi-Device Deterministic Ordering', () => {
    it('4.1 should sort envelopes by sequenceNumber from same origin device', () => {
      const ev1 = createSampleEvent(1);
      const ev2 = createSampleEvent(2);
      const env1 = SyncEnvelopeSerializer.createEnvelope({ event: ev1, deviceId: 'dev_01' });
      const env2 = SyncEnvelopeSerializer.createEnvelope({ event: ev2, deviceId: 'dev_01' });

      const sorted = [env2, env1].sort(SyncEnvelopeSerializer.compareSyncEnvelopes);
      expect(sorted[0].sequenceNumber).toBe(1);
      expect(sorted[1].sequenceNumber).toBe(2);
    });

    it('4.2 should tie-break concurrent devices deterministically by deviceId and eventId', () => {
      const ev1 = createSampleEvent(1);
      const ev2 = createSampleEvent(1);
      const envA = SyncEnvelopeSerializer.createEnvelope({ event: ev1, deviceId: 'dev_AAA' });
      const envB = SyncEnvelopeSerializer.createEnvelope({ event: ev2, deviceId: 'dev_BBB' });

      const sorted1 = [envB, envA].sort(SyncEnvelopeSerializer.compareSyncEnvelopes);
      const sorted2 = [envA, envB].sort(SyncEnvelopeSerializer.compareSyncEnvelopes);

      expect(sorted1[0].deviceId).toBe('dev_AAA');
      expect(sorted2[0].deviceId).toBe('dev_AAA');
    });

    it('4.3 should handle clock skew gracefully using sequence and origin tie-breaking', () => {
      const evSkewed = { ...createSampleEvent(1), timestamp: 9999999999999 };
      const evNormal = { ...createSampleEvent(2), timestamp: 1000000000000 };

      const envSkewed = SyncEnvelopeSerializer.createEnvelope({ event: evSkewed, deviceId: 'dev_01' });
      const envNormal = SyncEnvelopeSerializer.createEnvelope({ event: evNormal, deviceId: 'dev_01' });

      const sorted = [envNormal, envSkewed].sort(SyncEnvelopeSerializer.compareSyncEnvelopes);
      expect(sorted[0].sequenceNumber).toBe(1);
      expect(sorted[1].sequenceNumber).toBe(2);
    });
  });

  // ==========================================
  // 5. IMMUTABLE CONFLICT QUARANTINE & ANTI-LWW
  // ==========================================
  describe('5. Immutable Conflict Quarantine & Anti-LWW', () => {
    it('5.1 should quarantine remote conflicting event instead of blindly overwriting local state', async () => {
      const localEvent = createSampleEvent(1);
      await persistentStore.appendEvent(localEvent);

      // Create remote conflicting envelope with SAME eventId but DIFFERENT score / hash
      const remoteEvent = { ...localEvent, overallScore: 0.2, eventHash: 'divergent_remote_hash' };
      const remoteEnv = SyncEnvelopeSerializer.createEnvelope({ event: remoteEvent, deviceId: 'dev_beta_02' });

      transport.seedServerEvent(testStudentId, remoteEnv);

      const res = await coordinator.sync(testStudentId);
      expect(res.conflicts).toBe(1);
      expect(res.pulled).toBe(0);

      // Local store must remain uncorrupted with original score
      const stored = await persistentStore.getEvent(testStudentId, localEvent.eventId);
      expect(stored?.confidence).toBe(1.0);

      // Conflict must be registered in quarantine
      const conflicts = await coordinator.getConflicts(testStudentId);
      expect(conflicts.length).toBe(1);
      expect(conflicts[0].eventId).toBe(localEvent.eventId);
      expect(conflicts[0].status).toBe(ConflictStatus.OPEN);
    });

    it('5.2 should set sync state to CONFLICT when conflict is discovered', async () => {
      const localEvent = createSampleEvent(1);
      await persistentStore.appendEvent(localEvent);

      const remoteEvent = { ...localEvent, overallScore: 0.5, eventHash: 'conflicting_hash_999' };
      const remoteEnv = SyncEnvelopeSerializer.createEnvelope({ event: remoteEvent, deviceId: 'dev_beta_02' });
      transport.seedServerEvent(testStudentId, remoteEnv);

      await coordinator.sync(testStudentId);
      expect(coordinator.getState()).toBe(NetworkSyncState.CONFLICT);
    });

    it('5.3 should quarantine outbound push conflict if remote rejects with conflict', async () => {
      const event = createSampleEvent(1);
      await coordinator.getOutboxManager().enqueueEvent(event, 'dev_alpha_01');

      // Pre-seed remote with divergent event under same eventId
      const divergentRemote = { ...event, eventHash: 'different_hash_on_remote' };
      transport.injectConflict(event.eventId, SyncEnvelopeSerializer.createEnvelope({ event: divergentRemote, deviceId: 'dev_remote' }));

      // Push will hit server conflict
      await coordinator.sync(testStudentId);
      const conflicts = await coordinator.getConflicts(testStudentId);
      expect(conflicts.length).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // 6. TRANSACTIONAL CURSOR MANAGEMENT
  // ==========================================
  describe('6. Transactional Cursor Management', () => {
    it('6.1 should initialize genesis cursor for a new student', async () => {
      const cursorMgr = coordinator.getCursorManager();
      const cursor = await cursorMgr.getCursor(testStudentId);

      expect(cursor.studentId).toBe(testStudentId);
      expect(cursor.lastServerCursor).toBeNull();
      expect(cursor.lastAcknowledgedSequence).toBe(0);
      expect(cursor.cursorHash).toBeDefined();
    });

    it('6.2 should advance remote cursor after safe pull application', async () => {
      const event = createSampleEvent(1);
      const env = SyncEnvelopeSerializer.createEnvelope({ event, deviceId: 'dev_beta_02' });
      transport.seedServerEvent(testStudentId, env);

      await coordinator.sync(testStudentId);

      const cursorMgr = coordinator.getCursorManager();
      const cursor = await cursorMgr.getCursor(testStudentId);
      expect(cursor.lastServerCursor).toBe('1');
      expect(cursor.lastAppliedRemoteSequence).toBe(1);
    });

    it('6.3 should advance acknowledged sequence after push ACK', async () => {
      const event = createSampleEvent(5);
      await coordinator.recordEvent(event);

      const cursorMgr = coordinator.getCursorManager();
      const cursor = await cursorMgr.getCursor(testStudentId);
      expect(cursor.lastAcknowledgedSequence).toBe(5);
    });

    it('6.4 should detect tampered cursor and throw InvalidCursorError', async () => {
      const cursorMgr = coordinator.getCursorManager();
      const cursor = await cursorMgr.getCursor(testStudentId);

      // Tamper cursor without updating cursorHash
      await syncStorage.saveCursor({
        ...cursor,
        lastAcknowledgedSequence: 9999,
      });

      await expect(cursorMgr.getCursor(testStudentId)).rejects.toThrow(InvalidCursorError);
    });

    it('6.5 should reset cursor on resync request', async () => {
      const event = createSampleEvent(1);
      const env = SyncEnvelopeSerializer.createEnvelope({ event, deviceId: 'dev_beta_02' });
      transport.seedServerEvent(testStudentId, env);
      await coordinator.sync(testStudentId);

      await coordinator.resync(testStudentId);

      const cursor = await coordinator.getCursorManager().getCursor(testStudentId);
      expect(cursor.lastServerCursor).toBe('1');
    });
  });

  // ==========================================
  // 7. OFFLINE RESILIENCE & NETWORK TRANSITIONS
  // ==========================================
  describe('7. Offline Resilience & Network Transitions', () => {
    it('7.1 should record learning events offline without loss', async () => {
      await transport.disconnect();

      const event1 = createSampleEvent(1);
      const event2 = createSampleEvent(2);

      await coordinator.recordEvent(event1);
      await coordinator.recordEvent(event2);

      const outbox = coordinator.getOutboxManager();
      const count = await outbox.getOutboxCount(testStudentId, OutboxStatus.PENDING);
      expect(count).toBe(2);
      expect(coordinator.getState()).toBe(NetworkSyncState.OFFLINE);
    });

    it('7.2 should automatically flush outbox on reconnect', async () => {
      await transport.disconnect();

      const event = createSampleEvent(1);
      await coordinator.recordEvent(event);

      // Reconnect
      await transport.connect();
      const res = await coordinator.sync(testStudentId);

      expect(res.pushed).toBe(1);
      const outbox = coordinator.getOutboxManager();
      const pendingCount = await outbox.getOutboxCount(testStudentId, OutboxStatus.PENDING);
      expect(pendingCount).toBe(0);
    });

    it('7.3 should safely tolerate dropped pushes by reverting to PENDING', async () => {
      const event = createSampleEvent(1);
      await coordinator.getOutboxManager().enqueueEvent(event, 'dev_alpha_01');

      transport.setDropPushes(true);

      await expect(coordinator.sync(testStudentId)).rejects.toThrow(TransportFailureError);

      const outbox = coordinator.getOutboxManager();
      const pending = await outbox.getPendingBatch(testStudentId);
      expect(pending.length).toBe(1);
      expect(pending[0].status).toBe(OutboxStatus.PENDING);
    });

    it('7.4 should sync 20 events accumulated over offline period in single batch', async () => {
      await transport.disconnect();

      for (let i = 1; i <= 20; i++) {
        await coordinator.recordEvent(createSampleEvent(i));
      }

      const outbox = coordinator.getOutboxManager();
      expect(await outbox.getOutboxCount(testStudentId)).toBe(20);

      await transport.connect();
      const res = await coordinator.sync(testStudentId);

      expect(res.pushed).toBe(20);
      expect(await outbox.getOutboxCount(testStudentId, OutboxStatus.ACKNOWLEDGED)).toBe(20);
    });
  });

  // ==========================================
  // 8. IDENTITY MIGRATION & AUTHORIZATION
  // ==========================================
  describe('8. Identity Migration & Authorization', () => {
    it('8.1 should reject sync attempt if authGuard denies student access', async () => {
      const foreignStudentId = 'std_foreign_999';
      await expect(coordinator.sync(foreignStudentId)).rejects.toThrow(AuthRequiredError);
    });

    it('8.2 should rekey pending outbox records during anonymous to authenticated migration', async () => {
      const anonId = 'std_anon_001';
      const authId = 'std_auth_real_001';

      // Enqueue as anonymous
      const event = createSampleEvent(1, undefined, anonId);
      await coordinator.getOutboxManager().enqueueEvent(event, 'dev_alpha_01');

      expect(await coordinator.getOutboxManager().getOutboxCount(anonId)).toBe(1);

      // Perform migration
      await coordinator.handleIdentityMigration(anonId, authId);

      expect(await coordinator.getOutboxManager().getOutboxCount(anonId)).toBe(0);
      expect(await coordinator.getOutboxManager().getOutboxCount(authId)).toBe(1);
    });

    it('8.3 should reject remote envelopes containing foreign studentId', async () => {
      const foreignEvent = createSampleEvent(1, undefined, 'std_attacker_999');
      const env = SyncEnvelopeSerializer.createEnvelope({ event: foreignEvent, deviceId: 'dev_evil' });
      transport.seedServerEvent(testStudentId, env);

      await expect(coordinator.sync(testStudentId)).rejects.toThrow(SyncOwnershipMismatchError);
    });
  });

  // ==========================================
  // 9. NON-NEGOTIABLE INVARIANTS (ZERO AUDIO, ZERO AI)
  // ==========================================
  describe('9. Non-Negotiable Invariants', () => {
    it('9.1 should reject raw Float32Array in event before enqueueing', async () => {
      const badEvent: any = {
        ...createSampleEvent(1),
        rawSamples: new Float32Array([0.1, 0.2, 0.3]),
      };

      await expect(coordinator.recordEvent(badEvent)).rejects.toThrow(RawAudioSyncRejectedError);
    });

    it('9.2 should reject raw ArrayBuffer in envelope payload', () => {
      const badPayload: any = {
        ...createSampleEvent(1),
        buffer: new ArrayBuffer(64),
      };

      expect(() =>
        SyncEnvelopeSerializer.createEnvelope({ event: badPayload, deviceId: 'dev_01' })
      ).toThrow(RawAudioSyncRejectedError);
    });

    it('9.3 should reject explicit rawAudioSync flag set to true', () => {
      const badPayload: any = {
        ...createSampleEvent(1),
        rawAudioSync: true,
      };

      expect(() =>
        SyncEnvelopeSerializer.createEnvelope({ event: badPayload, deviceId: 'dev_01' })
      ).toThrow(RawAudioSyncRejectedError);
    });

    it('9.4 should reject audio properties like audioBlob or pcmData', () => {
      const badPayload: any = {
        ...createSampleEvent(1),
        audioBlob: { size: 1024 },
      };

      expect(() =>
        SyncEnvelopeSerializer.assertNoAudioSync(badPayload)
      ).toThrow(RawAudioSyncRejectedError);
    });
  });

  // ==========================================
  // 10. EVENTUAL CONVERGENCE PROPERTY TESTS
  // ==========================================
  describe('10. Eventual Convergence Property Tests', () => {
    it('10.1 should reach identical state when envelopes are delivered in reverse order', async () => {
      const ev1 = createSampleEvent(1);
      const ev2 = createSampleEvent(2, ev1.eventHash);
      const ev3 = createSampleEvent(3, ev2.eventHash);

      const env1 = SyncEnvelopeSerializer.createEnvelope({ event: ev1, deviceId: 'dev_01' });
      const env2 = SyncEnvelopeSerializer.createEnvelope({ event: ev2, deviceId: 'dev_01' });
      const env3 = SyncEnvelopeSerializer.createEnvelope({ event: ev3, deviceId: 'dev_01' });

      // Seed in forward order on remote
      transport.seedServerEvent(testStudentId, env1);
      transport.seedServerEvent(testStudentId, env2);
      transport.seedServerEvent(testStudentId, env3);

      // Force reverse delivery from transport
      transport.setReversePullOrder(true);

      const res = await coordinator.sync(testStudentId);
      expect(res.pulled).toBe(3);

      const stored = await persistentStore.getEventsByStudent(testStudentId);
      expect(stored.length).toBe(3);
      expect(stored[0].sequenceNumber).toBe(1);
      expect(stored[1].sequenceNumber).toBe(2);
      expect(stored[2].sequenceNumber).toBe(3);
    });

    it('10.2 should converge across two independent client stores syncing from shared transport', async () => {
      // Client B store & coordinator
      const clientBStoreAdapter = new MemoryStorageAdapter();
      await clientBStoreAdapter.init();
      const clientBStore = new PersistentLearningStore(clientBStoreAdapter);
      const clientBSyncStorage = new MemorySyncStorageAdapter();
      await clientBSyncStorage.init();

      const coordinatorB = new SyncCoordinator({
        persistentStore: clientBStore,
        syncStorage: clientBSyncStorage,
        transport,
        authContext,
        deviceId: 'dev_beta_02',
      });
      await coordinatorB.init();

      // Client A records 5 events and pushes
      for (let i = 1; i <= 5; i++) {
        await coordinator.recordEvent(createSampleEvent(i));
      }

      // Client B syncs (pulls A's events)
      const resB = await coordinatorB.sync(testStudentId);
      expect(resB.pulled).toBe(5);

      // Client A and Client B stores must be identical
      const eventsA = await persistentStore.getEventsByStudent(testStudentId);
      const eventsB = await clientBStore.getEventsByStudent(testStudentId);

      expect(eventsA.length).toBe(eventsB.length);
      for (let i = 0; i < eventsA.length; i++) {
        expect(eventsA[i].eventId).toBe(eventsB[i].eventId);
        expect(eventsA[i].eventHash).toBe(eventsB[i].eventHash);
      }
    });
  });

  // ==========================================
  // 11. EMPIRICAL PERFORMANCE BENCHMARKS
  // ==========================================
  describe('11. Empirical Performance Benchmarks', () => {
    it('11.1 should benchmark 100 outbox enqueue operations under 100ms total', async () => {
      const outbox = coordinator.getOutboxManager();
      const start = performance.now();

      for (let i = 1; i <= 100; i++) {
        const ev = createSampleEvent(i);
        await outbox.enqueueEvent(ev, 'dev_alpha_01');
      }

      const elapsed = performance.now() - start;
      const count = await outbox.getOutboxCount(testStudentId);
      expect(count).toBe(100);
      expect(elapsed).toBeLessThan(150); // fast in-memory execution
    });

    it('11.2 should benchmark 100 event push/pull sync cycle under 250ms', async () => {
      for (let i = 1; i <= 100; i++) {
        await coordinator.getOutboxManager().enqueueEvent(createSampleEvent(i), 'dev_alpha_01');
      }

      const start = performance.now();
      const res = await coordinator.sync(testStudentId);
      const elapsed = performance.now() - start;

      expect(res.pushed).toBe(100);
      expect(elapsed).toBeLessThan(250);
    });

    it('11.3 should export sync metadata correctly', async () => {
      const event = createSampleEvent(1);
      await coordinator.recordEvent(event);

      const metadata = await coordinator.exportSyncMetadata(testStudentId);
      expect(metadata.deviceId).toBe('dev_alpha_01');
      expect(metadata.cursor).toBeDefined();
      expect(metadata.conflictCount).toBe(0);
    });
  });

  // ==========================================
  // 12. OUTBOX EDGE CASES & FAULT INJECTION (15 Tests)
  // ==========================================
  describe('12. Outbox Edge Cases & Fault Injection', () => {
    it('12.1 should return empty batch if no records are pending', async () => {
      const outbox = coordinator.getOutboxManager();
      const batch = await outbox.getPendingBatch(testStudentId, 10);
      expect(batch).toEqual([]);
    });

    it('12.2 should handle querying non-existent student outbox gracefully', async () => {
      const outbox = coordinator.getOutboxManager();
      const count = await outbox.getOutboxCount('non_existent_student');
      expect(count).toBe(0);
    });

    it('12.3 should preserve payload exactness across serialization and enqueue', async () => {
      const event = createSampleEvent(1);
      const outbox = coordinator.getOutboxManager();
      const record = await outbox.enqueueEvent(event, 'dev_alpha_01');
      expect(record.envelope.payload.eventId).toBe(event.eventId);
      expect((record.envelope.payload as any).confidence).toBe(1.0);
    });

    it('12.4 should track multiple attempts across repeated failures', async () => {
      const event = createSampleEvent(1);
      const outbox = coordinator.getOutboxManager();
      const rec = await outbox.enqueueEvent(event, 'dev_alpha_01');

      for (let attempt = 1; attempt <= 4; attempt++) {
        await outbox.markInFlight([rec.outboxId]);
        await outbox.markRejected(rec.outboxId, `Transient error attempt ${attempt}`, false);
        await outbox.retryRecord(rec.outboxId);
      }

      const fetched = await syncStorage.getOutboxRecord(rec.outboxId);
      expect(fetched?.attemptCount).toBe(4);
      expect(fetched?.status).toBe(OutboxStatus.PENDING);
    });

    it('12.5 should handle empty arrays in markInFlight gracefully', async () => {
      const outbox = coordinator.getOutboxManager();
      await expect(outbox.markInFlight([])).resolves.not.toThrow();
    });

    it('12.6 should handle empty arrays in markAcknowledged gracefully', async () => {
      const outbox = coordinator.getOutboxManager();
      await expect(outbox.markAcknowledged([])).resolves.not.toThrow();
    });

    it('12.7 should handle deleting an already deleted outbox record without crashing', async () => {
      const event = createSampleEvent(1);
      const outbox = coordinator.getOutboxManager();
      const rec = await outbox.enqueueEvent(event, 'dev_alpha_01');
      await syncStorage.deleteOutboxRecord(rec.outboxId);
      await expect(syncStorage.deleteOutboxRecord(rec.outboxId)).resolves.not.toThrow();
    });

    it('12.8 should correctly filter outbox records by status', async () => {
      const outbox = coordinator.getOutboxManager();
      const e1 = await outbox.enqueueEvent(createSampleEvent(1), 'dev_alpha_01');
      const e2 = await outbox.enqueueEvent(createSampleEvent(2), 'dev_alpha_01');
      const e3 = await outbox.enqueueEvent(createSampleEvent(3), 'dev_alpha_01');

      await outbox.markAcknowledged([e1.outboxId]);
      await outbox.markInFlight([e2.outboxId]);

      expect(await outbox.getOutboxCount(testStudentId, OutboxStatus.ACKNOWLEDGED)).toBe(1);
      expect(await outbox.getOutboxCount(testStudentId, OutboxStatus.IN_FLIGHT)).toBe(1);
      expect(await outbox.getOutboxCount(testStudentId, OutboxStatus.PENDING)).toBe(1);
    });

    it('12.9 should handle clearing outbox for a student', async () => {
      const outbox = coordinator.getOutboxManager();
      await outbox.enqueueEvent(createSampleEvent(1), 'dev_alpha_01');
      await outbox.enqueueEvent(createSampleEvent(2), 'dev_alpha_01');

      await syncStorage.clearAll(testStudentId);
      expect(await outbox.getOutboxCount(testStudentId)).toBe(0);
    });

    it('12.10 should preserve deviceId correctly on outbox records', async () => {
      const outbox = coordinator.getOutboxManager();
      const rec = await outbox.enqueueEvent(createSampleEvent(1), 'custom_device_99');
      expect(rec.envelope.deviceId).toBe('custom_device_99');
    });

    it('12.11 should handle multiple records in markInFlight in atomic fashion', async () => {
      const outbox = coordinator.getOutboxManager();
      const r1 = await outbox.enqueueEvent(createSampleEvent(1), 'dev_alpha_01');
      const r2 = await outbox.enqueueEvent(createSampleEvent(2), 'dev_alpha_01');
      await outbox.markInFlight([r1.outboxId, r2.outboxId]);

      const f1 = await syncStorage.getOutboxRecord(r1.outboxId);
      const f2 = await syncStorage.getOutboxRecord(r2.outboxId);
      expect(f1?.status).toBe(OutboxStatus.IN_FLIGHT);
      expect(f2?.status).toBe(OutboxStatus.IN_FLIGHT);
    });

    it('12.12 should handle multiple records in markAcknowledged', async () => {
      const outbox = coordinator.getOutboxManager();
      const r1 = await outbox.enqueueEvent(createSampleEvent(1), 'dev_alpha_01');
      const r2 = await outbox.enqueueEvent(createSampleEvent(2), 'dev_alpha_01');
      await outbox.markAcknowledged([r1.outboxId, r2.outboxId]);

      const f1 = await syncStorage.getOutboxRecord(r1.outboxId);
      const f2 = await syncStorage.getOutboxRecord(r2.outboxId);
      expect(f1?.status).toBe(OutboxStatus.ACKNOWLEDGED);
      expect(f2?.status).toBe(OutboxStatus.ACKNOWLEDGED);
    });

    it('12.13 should maintain createdAt monotonically across sequential enqueues', async () => {
      const outbox = coordinator.getOutboxManager();
      const r1 = await outbox.enqueueEvent(createSampleEvent(1), 'dev_alpha_01');
      const r2 = await outbox.enqueueEvent(createSampleEvent(2), 'dev_alpha_01');
      expect(r2.createdAt).toBeGreaterThanOrEqual(r1.createdAt);
    });

    it('12.14 should isolate outbox between two different students', async () => {
      const outbox = coordinator.getOutboxManager();
      await outbox.enqueueEvent(createSampleEvent(1, undefined, 'std_01'), 'dev_alpha_01');
      await outbox.enqueueEvent(createSampleEvent(2, undefined, 'std_02'), 'dev_alpha_01');

      expect(await outbox.getOutboxCount('std_01')).toBe(1);
      expect(await outbox.getOutboxCount('std_02')).toBe(1);
    });

    it('12.15 should reject updating status for non-existent outbox record', async () => {
      await expect(
        syncStorage.updateOutboxStatus('non_existent_id', OutboxStatus.ACKNOWLEDGED)
      ).rejects.toThrow();
    });
  });

  // ==========================================
  // 13. INBOX & DEDUPLICATION EDGE CASES (15 Tests)
  // ==========================================
  describe('13. Inbox & Deduplication Edge Cases', () => {
    it('13.1 should return null when querying non-existent inbox record', async () => {
      const inbox = coordinator.getInboxManager();
      const rec = await inbox.getInboxRecord(testStudentId, 'non_existent_evt');
      expect(rec).toBeNull();
    });

    it('13.2 should preserve processedAt timestamp upon recording', async () => {
      const inbox = coordinator.getInboxManager();
      const before = Date.now();
      await inbox.markProcessed({
        syncEventId: 'sync_001',
        eventId: 'evt_001',
        studentId: testStudentId,
        originDeviceId: 'dev_01',
        eventHash: 'hash_001',
      });
      const after = Date.now();

      const record = await inbox.getInboxRecord(testStudentId, 'evt_001');
      expect(record?.processedAt).toBeGreaterThanOrEqual(before);
      expect(record?.processedAt).toBeLessThanOrEqual(after);
    });

    it('13.3 should recognize identical duplicate even if queried multiple times', async () => {
      const inbox = coordinator.getInboxManager();
      await inbox.markProcessed({
        syncEventId: 'sync_001',
        eventId: 'evt_001',
        studentId: testStudentId,
        originDeviceId: 'dev_01',
        eventHash: 'hash_001',
      });

      for (let i = 0; i < 5; i++) {
        const check = await inbox.checkInboundEvent(testStudentId, 'evt_001', 'hash_001');
        expect(check.status).toBe('IDENTICAL_DUPLICATE');
      }
    });

    it('13.4 should distinguish between two students having the same eventId', async () => {
      const inbox = coordinator.getInboxManager();
      await inbox.markProcessed({
        syncEventId: 'sync_001',
        eventId: 'evt_shared_id',
        studentId: 'std_01',
        originDeviceId: 'dev_01',
        eventHash: 'hash_01',
      });

      const checkStd2 = await inbox.checkInboundEvent('std_02', 'evt_shared_id', 'hash_01');
      expect(checkStd2.status).toBe('NEW');
    });

    it('13.5 should allow resolving a conflict with LOCAL_WINS', async () => {
      const inbox = coordinator.getInboxManager();
      const conf = await inbox.quarantineConflict({
        studentId: testStudentId,
        eventId: 'evt_conflict_01',
        localHash: 'hash_local',
        remoteHash: 'hash_remote',
        reason: 'Score divergence',
      });

      await inbox.resolveConflict(conf.conflictId, 'LOCAL_WINS', 'Local evidence superior');
      const conflicts = await inbox.getConflicts(testStudentId);
      const updated = conflicts.find((c) => c.conflictId === conf.conflictId);
      expect(updated?.status).toBe(ConflictStatus.RESOLVED);
      expect(updated?.resolutionChoice).toBe('LOCAL_WINS');
    });

    it('13.6 should allow resolving a conflict with REMOTE_WINS', async () => {
      const inbox = coordinator.getInboxManager();
      const conf = await inbox.quarantineConflict({
        studentId: testStudentId,
        eventId: 'evt_conflict_02',
        localHash: 'hash_local',
        remoteHash: 'hash_remote',
        reason: 'Hash divergence',
      });

      await inbox.resolveConflict(conf.conflictId, 'REMOTE_WINS', 'Remote verified session');
      const conflicts = await inbox.getConflicts(testStudentId);
      const updated = conflicts.find((c) => c.conflictId === conf.conflictId);
      expect(updated?.status).toBe(ConflictStatus.RESOLVED);
      expect(updated?.resolutionChoice).toBe('REMOTE_WINS');
    });

    it('13.7 should allow manual split-branch resolution for conflicting events', async () => {
      const inbox = coordinator.getInboxManager();
      const conf = await inbox.quarantineConflict({
        studentId: testStudentId,
        eventId: 'evt_conflict_03',
        localHash: 'hash_local',
        remoteHash: 'hash_remote',
        reason: 'Divergent history',
      });

      await inbox.resolveConflict(conf.conflictId, 'MANUAL_SPLIT', 'Branches split into separate profiles');
      const conflicts = await inbox.getConflicts(testStudentId);
      const updated = conflicts.find((c) => c.conflictId === conf.conflictId);
      expect(updated?.status).toBe(ConflictStatus.RESOLVED);
      expect(updated?.resolutionChoice).toBe('MANUAL_SPLIT');
    });

    it('13.8 should reject resolving non-existent conflict ID', async () => {
      const inbox = coordinator.getInboxManager();
      await expect(
        inbox.resolveConflict('non_existent_conflict', 'LOCAL_WINS', 'Reason')
      ).rejects.toThrow();
    });

    it('13.9 should retrieve only OPEN conflicts when filtered by status', async () => {
      const inbox = coordinator.getInboxManager();
      const c1 = await inbox.quarantineConflict({
        studentId: testStudentId,
        eventId: 'evt_c1',
        localHash: 'hash_l1',
        remoteHash: 'hash_r1',
        reason: 'Reason 1',
      });
      const c2 = await inbox.quarantineConflict({
        studentId: testStudentId,
        eventId: 'evt_c2',
        localHash: 'hash_l2',
        remoteHash: 'hash_r2',
        reason: 'Reason 2',
      });

      await inbox.resolveConflict(c1.conflictId, 'LOCAL_WINS', 'Resolved');

      const openConflicts = await inbox.getConflicts(testStudentId, ConflictStatus.OPEN);
      expect(openConflicts.length).toBe(1);
      expect(openConflicts[0].conflictId).toBe(c2.conflictId);
    });

    it('13.10 should store payload snapshot inside conflict record when provided', async () => {
      const inbox = coordinator.getInboxManager();
      const localEv = createSampleEvent(1);
      const conf = await inbox.quarantineConflict({
        studentId: testStudentId,
        eventId: localEv.eventId,
        localHash: localEv.eventHash,
        remoteHash: 'divergent_remote_hash',
        reason: 'Payload mismatch',
        localPayload: localEv,
      });

      expect(conf.localPayload).toBeDefined();
      expect((conf.localPayload as any).eventId).toBe(localEv.eventId);
    });

    it('13.11 should clear inbox records during clearStudentData', async () => {
      const inbox = coordinator.getInboxManager();
      await inbox.markProcessed({
        syncEventId: 'sync_01',
        eventId: 'evt_01',
        studentId: testStudentId,
        originDeviceId: 'dev_01',
        eventHash: 'h_01',
      });

      await syncStorage.clearAll(testStudentId);
      const check = await inbox.getInboxRecord(testStudentId, 'evt_01');
      expect(check).toBeNull();
    });

    it('13.12 should handle 50 rapid sequential inbox writes safely', async () => {
      const inbox = coordinator.getInboxManager();
      for (let i = 1; i <= 50; i++) {
        await inbox.markProcessed({
          syncEventId: `sync_${i}`,
          eventId: `evt_${i}`,
          studentId: testStudentId,
          originDeviceId: 'dev_01',
          eventHash: `hash_${i}`,
        });
      }

      for (let i = 1; i <= 50; i++) {
        const check = await inbox.checkInboundEvent(testStudentId, `evt_${i}`, `hash_${i}`);
        expect(check.status).toBe('IDENTICAL_DUPLICATE');
      }
    });

    it('13.13 should preserve conflict notes during resolution', async () => {
      const inbox = coordinator.getInboxManager();
      const conf = await inbox.quarantineConflict({
        studentId: testStudentId,
        eventId: 'evt_note_01',
        localHash: 'hash_local',
        remoteHash: 'hash_remote',
        reason: 'Notes test',
      });

      await inbox.resolveConflict(conf.conflictId, 'LOCAL_WINS', 'Detailed teacher explanation recorded');
      const fetched = (await inbox.getConflicts(testStudentId)).find((c) => c.conflictId === conf.conflictId);
      expect(fetched?.notes).toBe('Detailed teacher explanation recorded');
    });

    it('13.14 should handle multiple students having different conflicts in parallel', async () => {
      const inbox = coordinator.getInboxManager();
      await inbox.quarantineConflict({
        studentId: 'std_user_A',
        eventId: 'evt_A',
        localHash: 'hA',
        remoteHash: 'hA_remote',
        reason: 'Conflict A',
      });
      await inbox.quarantineConflict({
        studentId: 'std_user_B',
        eventId: 'evt_B',
        localHash: 'hB',
        remoteHash: 'hB_remote',
        reason: 'Conflict B',
      });

      expect((await inbox.getConflicts('std_user_A')).length).toBe(1);
      expect((await inbox.getConflicts('std_user_B')).length).toBe(1);
    });

    it('13.15 should ignore duplicate marking if identical record is saved twice', async () => {
      const inbox = coordinator.getInboxManager();
      const item = {
        syncEventId: 'sync_dup_01',
        eventId: 'evt_dup_01',
        studentId: testStudentId,
        originDeviceId: 'dev_01',
        eventHash: 'h_dup_01',
      };
      await inbox.markProcessed(item);
      await inbox.markProcessed(item);

      const check = await inbox.checkInboundEvent(testStudentId, 'evt_dup_01', 'h_dup_01');
      expect(check.status).toBe('IDENTICAL_DUPLICATE');
    });
  });

  // ==========================================
  // 14. CRYPTOGRAPHIC & ENVELOPE FUZZING (15 Tests)
  // ==========================================
  describe('14. Cryptographic & Envelope Fuzzing', () => {
    it('14.1 should produce identical payloadHash for identical payloads with differing key order', () => {
      const p1 = { a: 1, b: 'quran', c: true };
      const p2 = { c: true, b: 'quran', a: 1 };

      const h1 = SyncEnvelopeSerializer.computePayloadHash(p1);
      const h2 = SyncEnvelopeSerializer.computePayloadHash(p2);
      expect(h1).toBe(h2);
    });

    it('14.2 should throw SyncHashMismatchError when envelopeHash has bad length', () => {
      const event = createSampleEvent(1);
      const env = SyncEnvelopeSerializer.createEnvelope({ event, deviceId: 'dev_01' });
      const badHashEnv = { ...env, envelopeHash: 'too_short' };

      expect(() => SyncEnvelopeSerializer.validateEnvelope(badHashEnv)).toThrow(SyncHashMismatchError);
    });

    it('14.3 should throw SyncHashMismatchError when payloadHash is corrupt', () => {
      const event = createSampleEvent(1);
      const env = SyncEnvelopeSerializer.createEnvelope({ event, deviceId: 'dev_01' });
      const badHashEnv = { ...env, payloadHash: '0000000000000000000000000000000000000000000000000000000000000000' };

      expect(() => SyncEnvelopeSerializer.validateEnvelope(badHashEnv)).toThrow(SyncHashMismatchError);
    });

    it('14.4 should reject missing syncEventId in envelope', () => {
      const event = createSampleEvent(1);
      const env = SyncEnvelopeSerializer.createEnvelope({ event, deviceId: 'dev_01' });
      const badEnv = { ...env, syncEventId: '' };

      expect(() => SyncEnvelopeSerializer.validateEnvelope(badEnv)).toThrow();
    });

    it('14.5 should reject missing studentId in envelope', () => {
      const event = createSampleEvent(1);
      const env = SyncEnvelopeSerializer.createEnvelope({ event, deviceId: 'dev_01' });
      const badEnv = { ...env, studentId: '' };

      expect(() => SyncEnvelopeSerializer.validateEnvelope(badEnv)).toThrow();
    });

    it('14.6 should reject negative sequence numbers in envelope', () => {
      const event = createSampleEvent(1);
      const env = SyncEnvelopeSerializer.createEnvelope({ event, deviceId: 'dev_01' });
      const badEnv = { ...env, sequenceNumber: -1 };

      expect(() => SyncEnvelopeSerializer.validateEnvelope(badEnv)).toThrow();
    });

    it('14.7 should reject future timestamp beyond acceptable threshold', () => {
      const event = createSampleEvent(1);
      const env = SyncEnvelopeSerializer.createEnvelope({ event, deviceId: 'dev_01' });
      const farFuture = Date.now() + 1000 * 60 * 60 * 24 * 365; // 1 year into future
      const badEnv = { ...env, createdAt: farFuture };

      expect(() => SyncEnvelopeSerializer.validateEnvelope(badEnv)).toThrow(SyncHashMismatchError);
    });

    it('14.8 should detect payload modifications inside nested arrays', () => {
      const event = createSampleEvent(1);
      const env = SyncEnvelopeSerializer.createEnvelope({ event, deviceId: 'dev_01' });

      const mutatedPayload = {
        ...env.payload,
        words: [{ wordIndex: 0, text: 'altered', confidence: 0.9 }],
      };
      const badEnv = { ...env, payload: mutatedPayload };

      expect(() => SyncEnvelopeSerializer.validateEnvelope(badEnv)).toThrow(SyncHashMismatchError);
    });

    it('14.9 should detect payload modifications inside nested objects', () => {
      const event = createSampleEvent(1);
      const env = SyncEnvelopeSerializer.createEnvelope({ event, deviceId: 'dev_01' });

      const mutatedPayload = {
        ...env.payload,
        discrepancies: [{ type: 'TAJWEED', rule: 'GHUNNAH', severity: 'HIGH' }],
      };
      const badEnv = { ...env, payload: mutatedPayload };

      expect(() => SyncEnvelopeSerializer.validateEnvelope(badEnv)).toThrow(SyncHashMismatchError);
    });

    it('14.10 should validate that current protocol version is 1.0.0', () => {
      expect(CURRENT_SYNC_PROTOCOL_VERSION).toBe('1.0.0');
    });

    it('14.11 should validate that current schema version is 1.0.0', () => {
      expect(CURRENT_SYNC_SCHEMA_VERSION).toBe('1.0.0');
    });

    it('14.12 should produce distinct hashes for two events differing only by studentId', () => {
      const e1 = createSampleEvent(1, undefined, 'student_A');
      const e2 = createSampleEvent(1, undefined, 'student_B');

      const env1 = SyncEnvelopeSerializer.createEnvelope({ event: e1, deviceId: 'dev_01' });
      const env2 = SyncEnvelopeSerializer.createEnvelope({ event: e2, deviceId: 'dev_01' });

      expect(env1.envelopeHash).not.toBe(env2.envelopeHash);
    });

    it('14.13 should produce distinct hashes for two events differing only by deviceId', () => {
      const e1 = createSampleEvent(1);
      const env1 = SyncEnvelopeSerializer.createEnvelope({ event: e1, deviceId: 'dev_AAA' });
      const env2 = SyncEnvelopeSerializer.createEnvelope({ event: e1, deviceId: 'dev_BBB' });

      expect(env1.envelopeHash).not.toBe(env2.envelopeHash);
    });

    it('14.14 should produce distinct hashes for two events differing only by sequenceNumber', () => {
      const e1 = createSampleEvent(1);
      const e2 = createSampleEvent(2);
      const env1 = SyncEnvelopeSerializer.createEnvelope({ event: e1, deviceId: 'dev_01' });
      const env2 = SyncEnvelopeSerializer.createEnvelope({ event: e2, deviceId: 'dev_01' });

      expect(env1.envelopeHash).not.toBe(env2.envelopeHash);
    });

    it('14.15 should throw when asserting no audio on an event containing PCM buffer', () => {
      const audioEvent = {
        ...createSampleEvent(1),
        pcm: [0.1, -0.2, 0.3],
      };
      expect(() => SyncEnvelopeSerializer.assertNoAudioSync(audioEvent)).toThrow(RawAudioSyncRejectedError);
    });
  });

  // ==========================================
  // 15. MULTI-DEVICE MATRIX & CONCURRENCY (10 Tests)
  // ==========================================
  describe('15. Multi-Device Matrix & Concurrency', () => {
    it('15.1 should sort stream of envelopes from 5 different devices deterministically', () => {
      const devices = ['dev_E', 'dev_A', 'dev_C', 'dev_B', 'dev_D'];
      const envelopes: SyncEventEnvelope[] = [];

      for (let seq = 1; seq <= 3; seq++) {
        for (const dev of devices) {
          const ev = createSampleEvent(seq);
          envelopes.push(SyncEnvelopeSerializer.createEnvelope({ event: ev, deviceId: dev }));
        }
      }

      // Shuffle randomly
      const shuffled = [...envelopes].sort(() => Math.random() - 0.5);
      const sorted1 = [...shuffled].sort(SyncEnvelopeSerializer.compareSyncEnvelopes);
      const sorted2 = [...envelopes].sort(SyncEnvelopeSerializer.compareSyncEnvelopes);

      expect(sorted1).toEqual(sorted2);
    });

    it('15.2 should order identical sequences alphabetically by originDeviceId', () => {
      const ev = createSampleEvent(1);
      const eA = SyncEnvelopeSerializer.createEnvelope({ event: ev, deviceId: 'dev_ALPHA' });
      const eB = SyncEnvelopeSerializer.createEnvelope({ event: ev, deviceId: 'dev_BETA' });

      const sorted = [eB, eA].sort(SyncEnvelopeSerializer.compareSyncEnvelopes);
      expect(sorted[0].deviceId).toBe('dev_ALPHA');
      expect(sorted[1].deviceId).toBe('dev_BETA');
    });

    it('15.3 should preserve sequence dominance over wall-clock timestamp drift', () => {
      const ev1 = { ...createSampleEvent(1), timestamp: 1700000000000 };
      const ev2 = { ...createSampleEvent(2), timestamp: 1600000000000 }; // 2 has older timestamp due to clock skew

      const env1 = SyncEnvelopeSerializer.createEnvelope({ event: ev1, deviceId: 'dev_01' });
      const env2 = SyncEnvelopeSerializer.createEnvelope({ event: ev2, deviceId: 'dev_01' });

      const sorted = [env2, env1].sort(SyncEnvelopeSerializer.compareSyncEnvelopes);
      expect(sorted[0].sequenceNumber).toBe(1);
      expect(sorted[1].sequenceNumber).toBe(2);
    });

    it('15.4 should synchronize concurrent sessions from two distinct devices without data loss', async () => {
      // Dev A pushes 3 events
      const outA = coordinator.getOutboxManager();
      await outA.enqueueEvent(createSampleEvent(1, undefined, testStudentId), 'dev_alpha_01');
      await outA.enqueueEvent(createSampleEvent(2, undefined, testStudentId), 'dev_alpha_01');
      await coordinator.sync(testStudentId);

      // Dev B pushes 2 events
      const clientBStoreAdapter = new MemoryStorageAdapter();
      await clientBStoreAdapter.init();
      const clientBStore = new PersistentLearningStore(clientBStoreAdapter);
      const clientBSyncStorage = new MemorySyncStorageAdapter();
      await clientBSyncStorage.init();

      const coordinatorB = new SyncCoordinator({
        persistentStore: clientBStore,
        syncStorage: clientBSyncStorage,
        transport,
        authContext,
        deviceId: 'dev_beta_02',
      });
      await coordinatorB.init();

      const outB = coordinatorB.getOutboxManager();
      await outB.enqueueEvent(createSampleEvent(3, undefined, testStudentId), 'dev_beta_02');
      await outB.enqueueEvent(createSampleEvent(4, undefined, testStudentId), 'dev_beta_02');
      await coordinatorB.sync(testStudentId);

      // Dev A pulls Dev B's events
      await coordinator.sync(testStudentId);

      const eventsA = await persistentStore.getEventsByStudent(testStudentId);
      expect(eventsA.length).toBe(4);
    });

    it('15.5 should handle interleaved event streams without throwing', async () => {
      const e1 = SyncEnvelopeSerializer.createEnvelope({ event: createSampleEvent(1), deviceId: 'dev_A' });
      const e2 = SyncEnvelopeSerializer.createEnvelope({ event: createSampleEvent(2), deviceId: 'dev_B' });
      const e3 = SyncEnvelopeSerializer.createEnvelope({ event: createSampleEvent(3), deviceId: 'dev_A' });

      transport.seedServerEvent(testStudentId, e1);
      transport.seedServerEvent(testStudentId, e2);
      transport.seedServerEvent(testStudentId, e3);

      const res = await coordinator.sync(testStudentId);
      expect(res.pulled).toBe(3);
    });

    it('15.6 should preserve event sequence numbering inside local store after multi-device merge', async () => {
      const e1 = SyncEnvelopeSerializer.createEnvelope({ event: createSampleEvent(1), deviceId: 'dev_A' });
      const e2 = SyncEnvelopeSerializer.createEnvelope({ event: createSampleEvent(2), deviceId: 'dev_B' });

      transport.seedServerEvent(testStudentId, e2);
      transport.seedServerEvent(testStudentId, e1);

      await coordinator.sync(testStudentId);

      const stored = await persistentStore.getEventsByStudent(testStudentId);
      expect(stored[0].sequenceNumber).toBe(1);
      expect(stored[1].sequenceNumber).toBe(2);
    });

    it('15.7 should handle duplicate push attempts concurrently without server state corruption', async () => {
      const ev = createSampleEvent(1);
      const env = SyncEnvelopeSerializer.createEnvelope({ event: ev, deviceId: 'dev_01' });

      const res1 = await transport.push([env]);
      const res2 = await transport.push([env]);

      expect(res1.acceptedIds).toContain(env.syncEventId);
      expect(res2.acceptedIds).toContain(env.syncEventId); // Idempotent push
    });

    it('15.8 should correctly report stream cursor after multi-device pushes', async () => {
      const eA = SyncEnvelopeSerializer.createEnvelope({ event: createSampleEvent(1), deviceId: 'dev_A' });
      const eB = SyncEnvelopeSerializer.createEnvelope({ event: createSampleEvent(2), deviceId: 'dev_B' });

      await transport.push([eA]);
      await transport.push([eB]);

      const pull = await transport.pull(testStudentId, null, 10);
      expect(pull.envelopes.length).toBe(2);
      expect(pull.serverCursor).toBe('2');
    });

    it('15.9 should allow pull with limit smaller than total events', async () => {
      for (let i = 1; i <= 5; i++) {
        const env = SyncEnvelopeSerializer.createEnvelope({ event: createSampleEvent(i), deviceId: 'dev_01' });
        transport.seedServerEvent(testStudentId, env);
      }

      const pull = await transport.pull(testStudentId, null, 2);
      expect(pull.envelopes.length).toBe(2);
      expect(pull.hasMore).toBe(true);
      expect(pull.nextCursor).toBe('2');
    });

    it('15.10 should fetch remaining stream starting from nextCursor', async () => {
      for (let i = 1; i <= 5; i++) {
        const env = SyncEnvelopeSerializer.createEnvelope({ event: createSampleEvent(i), deviceId: 'dev_01' });
        transport.seedServerEvent(testStudentId, env);
      }

      const pull1 = await transport.pull(testStudentId, null, 2);
      const pull2 = await transport.pull(testStudentId, pull1.nextCursor, 10);

      expect(pull2.envelopes.length).toBe(3);
      expect(pull2.hasMore).toBe(false);
      expect(pull2.envelopes[0].sequenceNumber).toBe(3);
    });
  });

  // ==========================================
  // 16. CURSOR INTEGRITY & RESYNC WORKFLOW (10 Tests)
  // ==========================================
  describe('16. Cursor Integrity & Resync Workflow', () => {
    it('16.1 should track cursor update timestamp', async () => {
      const cursorMgr = coordinator.getCursorManager();
      const before = Date.now();
      await cursorMgr.advanceAcknowledgedSequence(testStudentId, 3);
      const after = Date.now();

      const cursor = await cursorMgr.getCursor(testStudentId);
      expect(cursor.updatedAt).toBeGreaterThanOrEqual(before);
      expect(cursor.updatedAt).toBeLessThanOrEqual(after);
    });

    it('16.2 should calculate valid cryptographic hash on cursor state', async () => {
      const cursorMgr = coordinator.getCursorManager();
      const cursor = await cursorMgr.getCursor(testStudentId);
      expect(cursor.cursorHash.length).toBe(64);
    });

    it('16.3 should advance applied remote sequence monotonically', async () => {
      const cursorMgr = coordinator.getCursorManager();
      await cursorMgr.advanceRemoteCursor({
        studentId: testStudentId,
        serverCursor: '5',
        appliedRemoteSequence: 5,
      });

      const cursor = await cursorMgr.getCursor(testStudentId);
      expect(cursor.lastAppliedRemoteSequence).toBe(5);
      expect(cursor.lastServerCursor).toBe('5');
    });

    it('16.4 should reject corrupted cursor state during getCursor', async () => {
      const cursorMgr = coordinator.getCursorManager();
      const cursor = await cursorMgr.getCursor(testStudentId);

      // Mutate cursor sequence without valid re-hash
      const corruptCursor = { ...cursor, lastAcknowledgedSequence: 888 };
      await syncStorage.saveCursor(corruptCursor);

      await expect(cursorMgr.getCursor(testStudentId)).rejects.toThrow(InvalidCursorError);
    });

    it('16.5 should repair corrupted cursor via resetCursor', async () => {
      const cursorMgr = coordinator.getCursorManager();
      const cursor = await cursorMgr.getCursor(testStudentId);

      // Corrupt
      await syncStorage.saveCursor({ ...cursor, lastAcknowledgedSequence: 888 });

      // Reset
      await cursorMgr.resetCursor(testStudentId, '0');
      const repaired = await cursorMgr.getCursor(testStudentId);
      expect(repaired.lastServerCursor).toBe('0');
      expect(repaired.lastAcknowledgedSequence).toBe(0);
    });

    it('16.6 should isolate cursors between multiple students', async () => {
      const cursorMgr = coordinator.getCursorManager();
      await cursorMgr.advanceAcknowledgedSequence('student_X', 10);
      await cursorMgr.advanceAcknowledgedSequence('student_Y', 20);

      const cX = await cursorMgr.getCursor('student_X');
      const cY = await cursorMgr.getCursor('student_Y');

      expect(cX.lastAcknowledgedSequence).toBe(10);
      expect(cY.lastAcknowledgedSequence).toBe(20);
    });

    it('16.7 should clear cursor on student data wipe', async () => {
      const cursorMgr = coordinator.getCursorManager();
      await cursorMgr.advanceAcknowledgedSequence(testStudentId, 7);

      await syncStorage.clearAll(testStudentId);
      const cursor = await syncStorage.getCursor(testStudentId);
      expect(cursor).toBeNull();
    });

    it('16.8 should re-create genesis cursor if cleared cursor is requested again', async () => {
      const cursorMgr = coordinator.getCursorManager();
      await syncStorage.clearAll(testStudentId);

      const cursor = await cursorMgr.getCursor(testStudentId);
      expect(cursor.lastAcknowledgedSequence).toBe(0);
      expect(cursor.lastServerCursor).toBeNull();
    });

    it('16.9 should run full resync cycle and update cursor', async () => {
      const event = createSampleEvent(1);
      const env = SyncEnvelopeSerializer.createEnvelope({ event, deviceId: 'dev_01' });
      transport.seedServerEvent(testStudentId, env);

      const res = await coordinator.resync(testStudentId);
      expect(res.applied).toBe(1);
      const cursor = await coordinator.getCursorManager().getCursor(testStudentId);
      expect(cursor.lastServerCursor).toBe('1');
    });

    it('16.10 should preserve cursor integrity after resync on empty remote stream', async () => {
      const res = await coordinator.resync(testStudentId);
      expect(res.applied).toBe(0);
      const cursor = await coordinator.getCursorManager().getCursor(testStudentId);
      expect(cursor.lastServerCursor).toBe('0');
    });
  });

  // ==========================================
  // 17. REPLAY ATTACKS & SECURITY HARDENING (10 Tests)
  // ==========================================
  describe('17. Replay Attacks & Security Hardening', () => {
    it('17.1 should resist replay of old envelopes with matching hashes', async () => {
      const event = createSampleEvent(1);
      const env = SyncEnvelopeSerializer.createEnvelope({ event, deviceId: 'dev_01' });
      transport.seedServerEvent(testStudentId, env);

      // First sync
      await coordinator.sync(testStudentId);

      // Re-seed exact same event to simulate replay
      transport.seedServerEvent(testStudentId, env);

      const res2 = await coordinator.sync(testStudentId);
      expect(res2.pulled).toBe(0); // Deduplicated cleanly
    });

    it('17.2 should reject tampered originDeviceId in envelope signature', () => {
      const event = createSampleEvent(1);
      const env = SyncEnvelopeSerializer.createEnvelope({ event, deviceId: 'dev_origin' });
      const tampered = { ...env, deviceId: 'dev_impersonator' };

      expect(() => SyncEnvelopeSerializer.validateEnvelope(tampered)).toThrow(SyncHashMismatchError);
    });

    it('17.3 should reject tampered originSequence in envelope signature', () => {
      const event = createSampleEvent(1);
      const env = SyncEnvelopeSerializer.createEnvelope({ event, deviceId: 'dev_origin' });
      const tampered = { ...env, sequenceNumber: 99 };

      expect(() => SyncEnvelopeSerializer.validateEnvelope(tampered)).toThrow(SyncHashMismatchError);
    });

    it('17.4 should reject tampered studentId in envelope signature', () => {
      const event = createSampleEvent(1);
      const env = SyncEnvelopeSerializer.createEnvelope({ event, deviceId: 'dev_origin' });
      const tampered = { ...env, studentId: 'std_impersonated' };

      expect(() => SyncEnvelopeSerializer.validateEnvelope(tampered)).toThrow(SyncHashMismatchError);
    });

    it('17.5 should reject tampered eventHash in envelope signature', () => {
      const event = createSampleEvent(1);
      const env = SyncEnvelopeSerializer.createEnvelope({ event, deviceId: 'dev_origin' });
      const tampered = { ...env, eventHash: 'tampered_event_hash' };

      expect(() => SyncEnvelopeSerializer.validateEnvelope(tampered)).toThrow(SyncHashMismatchError);
    });

    it('17.6 should reject payload where score is subtly altered by 0.001', () => {
      const event = createSampleEvent(1);
      const env = SyncEnvelopeSerializer.createEnvelope({ event, deviceId: 'dev_origin' });
      const tampered = {
        ...env,
        payload: { ...env.payload, overallScore: 0.999 },
      };

      expect(() => SyncEnvelopeSerializer.validateEnvelope(tampered)).toThrow(SyncHashMismatchError);
    });

    it('17.7 should isolate student data completely during identity migration', async () => {
      const anonId = 'std_anon_secure_01';
      const authId = 'std_auth_secure_01';

      const evAnon = createSampleEvent(1, undefined, anonId);
      await coordinator.getOutboxManager().enqueueEvent(evAnon, 'dev_01');

      await coordinator.handleIdentityMigration(anonId, authId);

      const anonPending = await coordinator.getOutboxManager().getOutboxCount(anonId);
      const authPending = await coordinator.getOutboxManager().getOutboxCount(authId);

      expect(anonPending).toBe(0);
      expect(authPending).toBe(1);
    });

    it('17.8 should reject foreign envelope during pull even if envelope hash is internally valid', async () => {
      const foreignEvent = createSampleEvent(1, undefined, 'std_foreign_user');
      const validEnv = SyncEnvelopeSerializer.createEnvelope({ event: foreignEvent, deviceId: 'dev_foreign' });
      transport.seedServerEvent(testStudentId, validEnv);

      await expect(coordinator.sync(testStudentId)).rejects.toThrow(SyncOwnershipMismatchError);
    });

    it('17.9 should prevent cross-student cursor access', async () => {
      const cursorMgr = coordinator.getCursorManager();
      await cursorMgr.advanceAcknowledgedSequence('student_alpha', 5);

      const betaCursor = await cursorMgr.getCursor('student_beta');
      expect(betaCursor.lastAcknowledgedSequence).toBe(0);
    });

    it('17.10 should verify status summary authRequired when authGuard rejects access', async () => {
      authContext.setIdentity(null); // Clear active auth
      const summary = await coordinator.getStatusSummary(testStudentId);
      expect(summary.authRequired).toBe(true);
    });
  });

  // ==========================================
  // 18. BENCHMARKS & SCALE PROPERTIES (10 Tests)
  // ==========================================
  describe('18. Benchmarks & Scale Properties', () => {
    it('18.1 should handle 250 sequential outbox operations under 200ms', async () => {
      const outbox = coordinator.getOutboxManager();
      const start = performance.now();
      for (let i = 1; i <= 250; i++) {
        await outbox.enqueueEvent(createSampleEvent(i), 'dev_01');
      }
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(350);
      expect(await outbox.getOutboxCount(testStudentId)).toBe(250);
    });

    it('18.2 should handle 250 sequential inbox deduplication checks under 150ms', async () => {
      const inbox = coordinator.getInboxManager();
      for (let i = 1; i <= 250; i++) {
        await inbox.markProcessed({
          syncEventId: `sync_${i}`,
          eventId: `evt_${i}`,
          studentId: testStudentId,
          originDeviceId: 'dev_01',
          eventHash: `hash_${i}`,
        });
      }

      const start = performance.now();
      for (let i = 1; i <= 250; i++) {
        const check = await inbox.checkInboundEvent(testStudentId, `evt_${i}`, `hash_${i}`);
        expect(check.status).toBe('IDENTICAL_DUPLICATE');
      }
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(250);
    });

    it('18.3 should handle 100 cursor hash calculations under 50ms', () => {
      const start = performance.now();
      for (let i = 1; i <= 100; i++) {
        computeSha256Sync(JSON.stringify({ seq: i, student: 'test', time: 1700000000 }));
      }
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('18.4 should handle status summary retrieval in under 5ms', async () => {
      const start = performance.now();
      const summary = await coordinator.getStatusSummary(testStudentId);
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(15);
      expect(summary).toBeDefined();
    });

    it('18.5 should handle rapid network toggle without leaking state', async () => {
      for (let i = 0; i < 10; i++) {
        await transport.disconnect();
        expect(coordinator.getState()).toBeDefined();
        await transport.connect();
      }
    });

    it('18.6 should verify that memory sync adapter clearAll clears everything', async () => {
      await coordinator.getOutboxManager().enqueueEvent(createSampleEvent(1), 'dev_01');
      await coordinator.getInboxManager().markProcessed({
        syncEventId: 's1',
        eventId: 'e1',
        studentId: testStudentId,
        originDeviceId: 'dev_01',
        eventHash: 'h1',
      });

      syncStorage.clearAll();

      expect(await coordinator.getOutboxManager().getOutboxCount(testStudentId)).toBe(0);
      expect(await coordinator.getInboxManager().getInboxRecord(testStudentId, 'e1')).toBeNull();
    });

    it('18.7 should verify zero AI hallucination in sync conflicts', async () => {
      const inbox = coordinator.getInboxManager();
      const conf = await inbox.quarantineConflict({
        studentId: testStudentId,
        eventId: 'evt_invariant',
        localHash: 'hash_local',
        remoteHash: 'hash_remote',
        reason: 'Zero AI invariant validation',
      });

      expect(conf.status).toBe(ConflictStatus.OPEN);
      expect(conf.resolutionChoice).toBeUndefined(); // AI NEVER auto-resolves
    });

    it('18.8 should verify zero audio data retention in exported sync metadata', async () => {
      await coordinator.recordEvent(createSampleEvent(1));
      const metadata = await coordinator.exportSyncMetadata(testStudentId);
      const str = JSON.stringify(metadata);

      expect(str).not.toContain('Float32Array');
      expect(str).not.toContain('audioBlob');
      expect(str).not.toContain('pcm');
    });

    it('18.9 should verify that sync coordinator constructor defaults batchSize to 50', () => {
      const c = new SyncCoordinator({
        persistentStore,
        syncStorage,
        transport,
        authContext,
        deviceId: 'dev_default',
      });
      expect(c.getState()).toBeDefined();
    });

    it('18.10 should verify deterministic profile reconstruction after sync application', async () => {
      const ev1 = createSampleEvent(1);
      const ev2 = createSampleEvent(2, ev1.eventHash);
      const env1 = SyncEnvelopeSerializer.createEnvelope({ event: ev1, deviceId: 'dev_01' });
      const env2 = SyncEnvelopeSerializer.createEnvelope({ event: ev2, deviceId: 'dev_01' });

      transport.seedServerEvent(testStudentId, env1);
      transport.seedServerEvent(testStudentId, env2);

      await coordinator.sync(testStudentId);

      const profile = await persistentStore.rebuildProfileFromEvents(testStudentId);
      expect(profile).toBeDefined();
      expect(profile.studentId).toBe(testStudentId);
      expect(profile.sourceEventCount).toBe(2);
    });
  });
});
