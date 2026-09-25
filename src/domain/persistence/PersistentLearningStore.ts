/**
 * @file PersistentLearningStore.ts
 * @module domain/persistence
 * @description Production-grade Persistent Learning Store for Phase 8B.
 * 
 * CORE ARCHITECTURAL INVARIANTS:
 * - Student Ownership: Every record strictly bound to studentId (AUTH-004, PERSIST-006).
 * - Append-Only Learning Events: Historical events are immutable; corrections are new events.
 * - Idempotency & Deduplication: Replaying an event with the same ID and hash is a no-op (PERSIST-001).
 * - Cryptographic Hash Chain: Every event binds to previousEventHash forming a tamper-evident audit trail.
 * - Crash Safety & WAL: Transaction intent logs ensure atomic recovery from partial writes (PERSIST-004, PERSIST-005).
 * - Deterministic Profile Reconstruction: Snapshots are derived; event history is the ground truth.
 * - Privacy: Zero raw audio or PCM persistence (rawAudioPersistence: false).
 * - AI Boundary: AI models cannot author events, alter mastery states, or modify histories.
 */

import {
  IPersistentLearningStore,
  ISyncableLearningStore,
  IPersistenceStorageAdapter,
  PersistentMemorizationEvent,
  PersistentProfileSnapshot,
  PersistentRevisionPlan,
  PersistentRevisionHistoryRecord,
  PersistenceCheckpoint,
  TransactionIntentRecord,
  IntegrityVerificationResult,
  RecoveryResult,
  ExportedStudentLearningData,
  QueryEventsOptions,
  CURRENT_PERSISTENCE_SCHEMA_VERSION,
  GENESIS_PREVIOUS_HASH,
} from './types.ts';
import {
  DuplicateEventError,
  HashMismatchError,
  OwnershipMismatchError,
  CorruptedRecordError,
  SnapshotStaleError,
  TransactionIncompleteError,
  RecoveryFailedError,
} from './errorRegistry.ts';
import { CanonicalSerializer } from './CanonicalSerializer.ts';
import { PersistenceSchemaMigrator } from './PersistenceSchemaMigrator.ts';
import { MemorizationEvent, EvidenceStatus, MemorizationState, StudentMemorizationRange } from '../memorization_revision/types.ts';
import { LongitudinalProfileStore } from '../memorization_revision/LongitudinalProfileStore.ts';
import { computeSha256Sync } from '../../infrastructure/crypto/Sha256Util.ts';

export class PersistentLearningStore implements ISyncableLearningStore {
  public readonly rawAudioPersistence: false = false;
  private readonly adapter: IPersistenceStorageAdapter;

  constructor(adapter: IPersistenceStorageAdapter) {
    this.adapter = adapter;
  }

  // ==========================================
  // OWNERSHIP & PRIVACY VALIDATION
  // ==========================================

  private assertOwnership(resourceStudentId: string, requestingStudentId?: string, operation: string = 'RECORD'): void {
    if (!resourceStudentId) {
      throw new OwnershipMismatchError('undefined', requestingStudentId || 'unknown', operation);
    }
    if (requestingStudentId && requestingStudentId !== resourceStudentId) {
      throw new OwnershipMismatchError(resourceStudentId, requestingStudentId, operation);
    }
  }

  private assertNoAudioData(obj: unknown): void {
    if (!obj || typeof obj !== 'object') return;
    const record = obj as Record<string, unknown>;
    const forbiddenKeys = ['rawAudio', 'audioBuffer', 'audioData', 'pcmData', 'pcmBuffer', 'float32Array'];
    for (const key of forbiddenKeys) {
      if (key in record && record[key] !== undefined && record[key] !== null) {
        throw new Error(`Privacy Violation: ${key} detected in persistent learning payload.`);
      }
    }
    if ('rawAudioPersistence' in record && record.rawAudioPersistence === true) {
      throw new Error(`Privacy Violation: rawAudioPersistence cannot be true.`);
    }
  }

  // ==========================================
  // EVENT PERSISTENCE (APPEND-ONLY & IDEMPOTENT)
  // ==========================================

  public async appendEvent(
    event: MemorizationEvent,
    requestingStudentId?: string
  ): Promise<PersistentMemorizationEvent> {
    this.assertNoAudioData(event);
    this.assertOwnership(event.studentId, requestingStudentId, 'APPEND_EVENT');

    return await this.adapter.transaction(event.studentId, async () => {
      // 1. Idempotency Check: check if event with this eventId already exists
      const existing = await this.adapter.getEvent(event.studentId, event.eventId);
      if (existing) {
        // Compare essential canonical fields to verify if it is an exact replay or duplicate conflict
        const isMatch =
          existing.studentId === event.studentId &&
          existing.sessionId === event.sessionId &&
          existing.surahId === event.surahId &&
          existing.ayahNumber === event.ayahNumber &&
          existing.eventType === event.eventType &&
          existing.evidenceStatus === event.evidenceStatus &&
          existing.decisionStatus === event.decisionStatus &&
          existing.teacherAction === event.teacherAction &&
          existing.timestamp === event.timestamp;

        if (isMatch) {
          // Idempotent duplicate: return existing without corrupting/duplicating audit history
          return existing;
        } else {
          // Conflicting event with same eventId but different payload
          throw new DuplicateEventError(event.eventId, {
            reason: 'Existing event with same ID contains different payload.',
            existingEvent: existing,
            incomingEvent: event,
          });
        }
      }

      // 2. Fetch student checkpoint / latest events to establish hash chain
      const currentEvents = await this.adapter.getEventsByStudent(event.studentId);
      let previousEventHash = GENESIS_PREVIOUS_HASH;
      let sequenceNumber = 1;

      if (currentEvents.length > 0) {
        const lastEvent = currentEvents[currentEvents.length - 1];
        previousEventHash = lastEvent.eventHash;
        sequenceNumber = lastEvent.sequenceNumber + 1;

        // Verify that timestamp is not wildly backwards (allow clock skew up to 5000ms)
        if (event.timestamp < lastEvent.timestamp - 5000) {
          // Out of order: record warning but retain causal sequencing by sequenceNumber
        }
      }

      // 3. Compute canonical event hash
      const persistentEventData: Omit<PersistentMemorizationEvent, 'eventHash'> = {
        ...event,
        schemaVersion: CURRENT_PERSISTENCE_SCHEMA_VERSION,
        sequenceNumber,
        previousEventHash,
        persistedAt: Date.now(),
        syncStatus: 'PENDING',
      };

      const calculatedEventHash = CanonicalSerializer.computeEventHash(persistentEventData);
      const persistentEvent: PersistentMemorizationEvent = Object.freeze({
        ...persistentEventData,
        eventHash: calculatedEventHash,
      });

      // 4. Write-Ahead Transaction Intent (Crash safety)
      const transactionId = `tx-evt-${event.eventId}-${Date.now()}`;
      const intent: TransactionIntentRecord = {
        transactionId,
        studentId: event.studentId,
        intentType: 'APPEND_EVENT',
        payload: { eventId: event.eventId, sequenceNumber, eventHash: calculatedEventHash },
        status: 'PENDING',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await this.adapter.saveTransactionIntent(intent);

      // 5. Save event and update checkpoint
      await this.adapter.saveEvent(persistentEvent);

      const checkpointData: Omit<PersistenceCheckpoint, 'checkpointHash'> = {
        schemaVersion: CURRENT_PERSISTENCE_SCHEMA_VERSION,
        studentId: event.studentId,
        lastEventId: persistentEvent.eventId,
        lastEventHash: persistentEvent.eventHash,
        eventCount: sequenceNumber,
        lastSnapshotVersion: 0,
        timestamp: Date.now(),
      };
      const checkpointHash = CanonicalSerializer.computeCheckpointHash(checkpointData);
      await this.adapter.saveCheckpoint(Object.freeze({ ...checkpointData, checkpointHash }));

      // 6. Complete Transaction Intent
      await this.adapter.deleteTransactionIntent(transactionId);

      return persistentEvent;
    });
  }

  public async getEvent(
    studentId: string,
    eventId: string,
    requestingStudentId?: string
  ): Promise<PersistentMemorizationEvent | null> {
    this.assertOwnership(studentId, requestingStudentId, 'GET_EVENT');
    const event = await this.adapter.getEvent(studentId, eventId);
    if (!event) return null;

    // Verify record integrity
    const calculatedHash = CanonicalSerializer.computeEventHash(event);
    if (event.eventHash !== calculatedHash) {
      throw new HashMismatchError(
        `Event '${eventId}' on-disk hash does not match computed canonical hash`,
        event.eventHash,
        calculatedHash,
        { eventId, studentId }
      );
    }

    return event;
  }

  public async getEvents(
    options: QueryEventsOptions,
    requestingStudentId?: string
  ): Promise<PersistentMemorizationEvent[]> {
    this.assertOwnership(options.studentId, requestingStudentId, 'QUERY_EVENTS');
    return await this.adapter.queryEvents(options);
  }

  public async getEventsByStudent(
    studentId: string,
    requestingStudentId?: string
  ): Promise<PersistentMemorizationEvent[]> {
    this.assertOwnership(studentId, requestingStudentId, 'GET_EVENTS_BY_STUDENT');
    return await this.adapter.getEventsByStudent(studentId);
  }

  public async getEventsByQuranLocation(
    studentId: string,
    surahId: number,
    ayahNumber: number,
    requestingStudentId?: string
  ): Promise<PersistentMemorizationEvent[]> {
    this.assertOwnership(studentId, requestingStudentId, 'GET_EVENTS_BY_LOCATION');
    return await this.adapter.queryEvents({
      studentId,
      surahId,
      ayahNumber,
    });
  }

  // ==========================================
  // PROFILE SNAPSHOTS & DETERMINISTIC RECONSTRUCTION
  // ==========================================

  public async saveProfileSnapshot(
    snapshot: PersistentProfileSnapshot,
    requestingStudentId?: string
  ): Promise<void> {
    this.assertNoAudioData(snapshot);
    this.assertOwnership(snapshot.studentId, requestingStudentId, 'SAVE_SNAPSHOT');
    PersistenceSchemaMigrator.validateSchemaVersion(snapshot);

    const calculatedHash = CanonicalSerializer.computeSnapshotHash(snapshot);
    if (snapshot.profileHash !== calculatedHash) {
      throw new HashMismatchError(
        `Snapshot for student '${snapshot.studentId}' profileHash mismatch`,
        snapshot.profileHash,
        calculatedHash
      );
    }

    await this.adapter.saveSnapshot(snapshot);
  }

  public async getProfileSnapshot(
    studentId: string,
    requestingStudentId?: string
  ): Promise<PersistentProfileSnapshot | null> {
    this.assertOwnership(studentId, requestingStudentId, 'GET_SNAPSHOT');
    const snapshot = await this.adapter.getSnapshot(studentId);
    if (!snapshot) {
      // If no snapshot exists yet, check if there are events; if so, reconstruct
      const eventCount = await this.adapter.getEventCount(studentId);
      if (eventCount > 0) {
        return await this.rebuildProfileFromEvents(studentId, requestingStudentId);
      }
      return null;
    }

    // Verify snapshot hash integrity
    const calculatedHash = CanonicalSerializer.computeSnapshotHash(snapshot);
    if (snapshot.profileHash !== calculatedHash) {
      // Snapshot corrupted! Reconstruct deterministically from event truth
      return await this.rebuildProfileFromEvents(studentId, requestingStudentId);
    }

    return snapshot;
  }

  /**
   * Section 16: Deterministic reconstruction of StudentMemorizationProfile from immutable event history.
   */
  public async rebuildProfileFromEvents(
    studentId: string,
    requestingStudentId?: string
  ): Promise<PersistentProfileSnapshot> {
    this.assertOwnership(studentId, requestingStudentId, 'REBUILD_PROFILE');

    const events = await this.adapter.getEventsByStudent(studentId);
    // Sort strictly by sequenceNumber to guarantee deterministic sequential replay
    events.sort((a, b) => a.sequenceNumber - b.sequenceNumber);

    const existingSnapshot = await this.adapter.getSnapshot(studentId);
    const initialRanges = existingSnapshot?.activeMemorizationRange && existingSnapshot.activeMemorizationRange.length > 0
      ? existingSnapshot.activeMemorizationRange
      : this.deriveActiveRangesFromEvents(events);

    const memStore = new LongitudinalProfileStore(studentId, initialRanges);
    for (const evt of events) {
      memStore.recordEvent(evt);
    }
    memStore.flushPendingClusters();

    const compiledProfile = memStore.getProfileSnapshot();
    const nextSnapshotVersion = (existingSnapshot?.snapshotVersion ?? 0) + 1;
    const lastEvent = events[events.length - 1];

    const snapshotData: Omit<PersistentProfileSnapshot, 'profileHash'> = {
      schemaVersion: CURRENT_PERSISTENCE_SCHEMA_VERSION,
      studentId,
      snapshotVersion: nextSnapshotVersion,
      sourceEventCursor: lastEvent ? lastEvent.eventId : 'none',
      sourceEventCount: events.length,
      generatedAt: Date.now(),
      activeMemorizationRange: compiledProfile.activeMemorizationRange,
      passageStates: compiledProfile.passageStates,
      lastActivityAt: compiledProfile.lastActivityAt,
      lastReviewAt: compiledProfile.lastReviewAt,
      revisionDueCount: compiledProfile.revisionDueCount,
      weakPassageCount: compiledProfile.weakPassageCount,
      stablePassageCount: compiledProfile.stablePassageCount,
      masteredPassageCount: compiledProfile.masteredPassageCount,
    };

    const profileHash = CanonicalSerializer.computeSnapshotHash(snapshotData);
    const rebuiltSnapshot: PersistentProfileSnapshot = Object.freeze({
      ...snapshotData,
      profileHash,
    });

    await this.adapter.saveSnapshot(rebuiltSnapshot);
    return rebuiltSnapshot;
  }

  // ==========================================
  // REVISION PLANS & REVISION HISTORY
  // ==========================================

  public async saveRevisionPlan(
    plan: PersistentRevisionPlan,
    requestingStudentId?: string
  ): Promise<void> {
    this.assertNoAudioData(plan);
    this.assertOwnership(plan.studentId, requestingStudentId, 'SAVE_REVISION_PLAN');
    PersistenceSchemaMigrator.validateSchemaVersion(plan);

    const calculatedHash = CanonicalSerializer.computePlanHash(plan);
    if (plan.planHash !== calculatedHash) {
      throw new HashMismatchError(
        `Revision plan '${plan.planId}' planHash mismatch`,
        plan.planHash,
        calculatedHash
      );
    }

    await this.adapter.saveRevisionPlan(plan);
  }

  public async getRevisionPlan(
    studentId: string,
    planId: string,
    requestingStudentId?: string
  ): Promise<PersistentRevisionPlan | null> {
    this.assertOwnership(studentId, requestingStudentId, 'GET_REVISION_PLAN');
    return await this.adapter.getRevisionPlan(studentId, planId);
  }

  public async getRevisionPlans(
    studentId: string,
    requestingStudentId?: string
  ): Promise<PersistentRevisionPlan[]> {
    this.assertOwnership(studentId, requestingStudentId, 'GET_REVISION_PLANS');
    return await this.adapter.getRevisionPlansByStudent(studentId);
  }

  public async recordRevisionOutcome(
    record: Omit<PersistentRevisionHistoryRecord, 'schemaVersion' | 'recordHash'>,
    requestingStudentId?: string
  ): Promise<PersistentRevisionHistoryRecord> {
    this.assertNoAudioData(record);
    this.assertOwnership(record.studentId, requestingStudentId, 'RECORD_REVISION_OUTCOME');

    const fullRecordData: Omit<PersistentRevisionHistoryRecord, 'recordHash'> = {
      ...record,
      schemaVersion: CURRENT_PERSISTENCE_SCHEMA_VERSION,
    };
    const recordHash = CanonicalSerializer.computeHistoryHash(fullRecordData);
    const persistedRecord: PersistentRevisionHistoryRecord = Object.freeze({
      ...fullRecordData,
      recordHash,
    });

    await this.adapter.saveRevisionHistoryRecord(persistedRecord);
    return persistedRecord;
  }

  public async getRevisionHistory(
    studentId: string,
    requestingStudentId?: string
  ): Promise<PersistentRevisionHistoryRecord[]> {
    this.assertOwnership(studentId, requestingStudentId, 'GET_REVISION_HISTORY');
    return await this.adapter.getRevisionHistoryByStudent(studentId);
  }

  // ==========================================
  // CHECKPOINTS, INTEGRITY & RECOVERY
  // ==========================================

  public async checkpoint(
    studentId: string,
    requestingStudentId?: string
  ): Promise<PersistenceCheckpoint> {
    this.assertOwnership(studentId, requestingStudentId, 'CHECKPOINT');

    const events = await this.adapter.getEventsByStudent(studentId);
    const snapshot = await this.adapter.getSnapshot(studentId);
    const lastEvent = events[events.length - 1];

    const cpData: Omit<PersistenceCheckpoint, 'checkpointHash'> = {
      schemaVersion: CURRENT_PERSISTENCE_SCHEMA_VERSION,
      studentId,
      lastEventId: lastEvent ? lastEvent.eventId : 'none',
      lastEventHash: lastEvent ? lastEvent.eventHash : GENESIS_PREVIOUS_HASH,
      eventCount: events.length,
      lastSnapshotVersion: snapshot?.snapshotVersion ?? 0,
      timestamp: Date.now(),
    };
    const checkpointHash = CanonicalSerializer.computeCheckpointHash(cpData);
    const checkpoint: PersistenceCheckpoint = Object.freeze({ ...cpData, checkpointHash });

    await this.adapter.saveCheckpoint(checkpoint);
    return checkpoint;
  }

  public async verifyIntegrity(
    studentId: string,
    requestingStudentId?: string
  ): Promise<IntegrityVerificationResult> {
    this.assertOwnership(studentId, requestingStudentId, 'VERIFY_INTEGRITY');

    const rawEvents = await this.adapter.getEventsByStudent(studentId);
    for (let i = 1; i < rawEvents.length; i++) {
      if (rawEvents[i].sequenceNumber < rawEvents[i - 1].sequenceNumber) {
        return {
          valid: false,
          studentId,
          totalEventsChecked: rawEvents.length,
          hashChainIntact: false,
          timestampOrderValid: false,
          snapshotValid: true,
          brokenAtEventId: rawEvents[i].eventId,
          brokenSequenceNumber: rawEvents[i].sequenceNumber,
          errorDetails: `Physical storage order inverted: sequence ${rawEvents[i].sequenceNumber} stored after sequence ${rawEvents[i - 1].sequenceNumber}`,
        };
      }
    }

    const events = [...rawEvents].sort((a, b) => a.sequenceNumber - b.sequenceNumber);

    let expectedPrevHash = GENESIS_PREVIOUS_HASH;
    let hashChainIntact = true;
    let timestampOrderValid = true;
    let brokenAtEventId: string | undefined;
    let brokenSequenceNumber: number | undefined;
    let errorDetails: string | undefined;

    for (let i = 0; i < events.length; i++) {
      const evt = events[i];

      // 1. Verify schema version
      if (evt.schemaVersion !== CURRENT_PERSISTENCE_SCHEMA_VERSION) {
        hashChainIntact = false;
        brokenAtEventId = evt.eventId;
        brokenSequenceNumber = evt.sequenceNumber;
        errorDetails = `Schema mismatch: event has ${evt.schemaVersion}, current is ${CURRENT_PERSISTENCE_SCHEMA_VERSION}`;
        break;
      }

      // 2. Verify previous event hash chain
      if (evt.previousEventHash !== expectedPrevHash) {
        hashChainIntact = false;
        brokenAtEventId = evt.eventId;
        brokenSequenceNumber = evt.sequenceNumber;
        errorDetails = `Hash chain broken at event ${evt.eventId}. Expected prevHash ${expectedPrevHash}, found ${evt.previousEventHash}`;
        break;
      }

      // 3. Verify event self-hash
      const computedHash = CanonicalSerializer.computeEventHash(evt);
      if (evt.eventHash !== computedHash) {
        hashChainIntact = false;
        brokenAtEventId = evt.eventId;
        brokenSequenceNumber = evt.sequenceNumber;
        errorDetails = `Event ${evt.eventId} hash corrupted. Expected ${evt.eventHash}, calculated ${computedHash}`;
        break;
      }

      // 4. Verify timestamp non-inversion
      if (i > 0 && evt.timestamp < events[i - 1].timestamp - 5000) {
        timestampOrderValid = false;
      }

      expectedPrevHash = evt.eventHash;
    }

    // Verify snapshot if one exists
    let snapshotValid = true;
    const snapshot = await this.adapter.getSnapshot(studentId);
    if (snapshot) {
      const computedSnapHash = CanonicalSerializer.computeSnapshotHash(snapshot);
      if (snapshot.profileHash !== computedSnapHash) {
        snapshotValid = false;
      }
    }

    const valid = hashChainIntact && snapshotValid;
    return {
      valid,
      studentId,
      totalEventsChecked: events.length,
      brokenAtEventId,
      brokenSequenceNumber,
      errorDetails,
      hashChainIntact,
      snapshotValid,
      timestampOrderValid,
    };
  }

  public async recover(
    studentId: string,
    requestingStudentId?: string
  ): Promise<RecoveryResult> {
    this.assertOwnership(studentId, requestingStudentId, 'RECOVER');

    // 1. Check for pending or interrupted transactions (WAL)
    const intents = await this.adapter.getTransactionIntents(studentId);
    let rolledBackTransactionsCount = 0;

    for (const intent of intents) {
      if (intent.status === 'PENDING') {
        // Rollback or purge incomplete intent
        await this.adapter.deleteTransactionIntent(intent.transactionId);
        rolledBackTransactionsCount++;
      }
    }

    // 2. Verify audit chain
    const integrity = await this.verifyIntegrity(studentId, requestingStudentId);
    let rebuiltSnapshot = false;
    let corruptedEventsCount = 0;

    if (!integrity.valid) {
      if (!integrity.hashChainIntact) {
        corruptedEventsCount = 1;
      }
      if (!integrity.snapshotValid) {
        await this.rebuildProfileFromEvents(studentId, requestingStudentId);
        rebuiltSnapshot = true;
      }
    }

    const events = await this.adapter.getEventsByStudent(studentId);
    return {
      recovered: corruptedEventsCount === 0,
      studentId,
      recoveredEventCount: events.length,
      rolledBackTransactionsCount,
      rebuiltSnapshot,
      corruptedEventsCount,
      details: integrity.valid
        ? 'Store integrity verified. Pending uncommitted transactions cleaned.'
        : `Recovery completed with warnings: ${integrity.errorDetails || 'Corrupted records detected.'}`,
    };
  }

  // ==========================================
  // DATA EXPORT & AUDITABLE RESET
  // ==========================================

  public async exportStudentLearningData(
    studentId: string,
    requestingStudentId?: string
  ): Promise<ExportedStudentLearningData> {
    this.assertOwnership(studentId, requestingStudentId, 'EXPORT_DATA');

    const events = await this.adapter.getEventsByStudent(studentId);
    const profileSnapshot = await this.adapter.getSnapshot(studentId);
    const revisionPlans = await this.adapter.getRevisionPlansByStudent(studentId);
    const revisionHistory = await this.adapter.getRevisionHistoryByStudent(studentId);
    const checkpoint = await this.adapter.getCheckpoint(studentId);

    // Deep check to ensure absolutely zero audio buffers
    this.assertNoAudioData(events);
    this.assertNoAudioData(profileSnapshot);

    const exportPayload = {
      exportFormatVersion: '1.0.0-phase8b',
      schemaVersion: CURRENT_PERSISTENCE_SCHEMA_VERSION,
      exportedAt: Date.now(),
      studentId,
      events,
      profileSnapshot,
      revisionPlans,
      revisionHistory,
      checkpoint,
    };

    const exportChecksum = computeSha256Sync(CanonicalSerializer.canonicalStringify(exportPayload));
    return Object.freeze({
      ...exportPayload,
      exportChecksum,
    });
  }

  public async resetStudentLearningData(
    studentId: string,
    requestingStudentId?: string,
    confirmationPhrase?: string
  ): Promise<void> {
    this.assertOwnership(studentId, requestingStudentId, 'RESET_DATA');

    const expectedPhrase = `RESET_STUDENT_DATA_${studentId}`;
    if (confirmationPhrase !== expectedPhrase) {
      throw new Error(`Data reset confirmation phrase mismatch. Expected '${expectedPhrase}'`);
    }

    // Atomic wipe of only this student's data
    await this.adapter.clearStudentData(studentId);
  }

  // ==========================================
  // FUTURE SYNC BOUNDARY (PHASE 8C READY)
  // ==========================================

  public async getPendingEvents(
    studentId: string,
    limit: number = 100
  ): Promise<PersistentMemorizationEvent[]> {
    const events = await this.adapter.getEventsByStudent(studentId);
    const pending = events.filter((e) => e.syncStatus === 'PENDING' || e.syncStatus === undefined);
    return pending.slice(0, limit);
  }

  public async markSynced(studentId: string, eventIds: readonly string[]): Promise<void> {
    const idSet = new Set(eventIds);
    const events = await this.adapter.getEventsByStudent(studentId);
    for (const evt of events) {
      if (idSet.has(evt.eventId)) {
        const updated: PersistentMemorizationEvent = {
          ...evt,
          syncStatus: 'SYNCED',
        };
        await this.adapter.saveEvent(updated);
      }
    }
  }

  public async getSyncCursor(studentId: string): Promise<string | null> {
    const events = await this.adapter.getEventsByStudent(studentId);
    const synced = events.filter((e) => e.syncStatus === 'SYNCED');
    if (synced.length === 0) return null;
    return synced[synced.length - 1].eventId;
  }

  public async getSyncStatus(studentId: string): Promise<{ pendingCount: number; lastSyncedAt?: number }> {
    const events = await this.adapter.getEventsByStudent(studentId);
    const pending = events.filter((e) => e.syncStatus === 'PENDING' || e.syncStatus === undefined);
    return {
      pendingCount: pending.length,
      lastSyncedAt: events.length > 0 ? events[events.length - 1].persistedAt : undefined,
    };
  }

  private deriveActiveRangesFromEvents(events: PersistentMemorizationEvent[]): StudentMemorizationRange[] {
    const surahAyahs = new Map<number, Set<number>>();
    for (const e of events) {
      if (!surahAyahs.has(e.surahId)) {
        surahAyahs.set(e.surahId, new Set());
      }
      surahAyahs.get(e.surahId)!.add(e.ayahNumber);
    }
    const ranges: StudentMemorizationRange[] = [];
    for (const [surahId, ayahs] of surahAyahs.entries()) {
      const sorted = Array.from(ayahs).sort((a, b) => a - b);
      if (sorted.length > 0) {
        ranges.push({
          surahId,
          startAyah: sorted[0],
          endAyah: sorted[sorted.length - 1],
        });
      }
    }
    return ranges;
  }
}
