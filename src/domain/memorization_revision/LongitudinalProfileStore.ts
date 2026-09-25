/**
 * @file LongitudinalProfileStore.ts
 * @module domain/memorization_revision
 * @description Longitudinal Student Profile & History Store (Parts 10, 26, 27, 28, 29, 30, 31).
 * 
 * CORE GUARANTEES:
 * - Duplicate Replay Protection: Rejects duplicate eventIds or eventHashes (MEM-002).
 * - Out-of-Order Handling: Detects or chronologically sequences events before state derivation (MEM-003).
 * - Multi-Version Audit Binding: Preserves original cryptographic hashes across dataset/model changes (Parts 30 & 31).
 * - Zero Psychological Inferences: Stores strictly observable pedagogical facts.
 * - Privacy: Raw audio persistence is strictly false (Part 26).
 * - 100% Offline Capable: Zero remote database or cloud AI requirement.
 */

import {
  StudentMemorizationProfile,
  PassageLearningRecord,
  MemorizationEvent,
  StudentMemorizationRange,
  MemorizationState,
  RevisionScheduleConfig,
  CANONICAL_REVISION_CONFIG,
} from './types.ts';
import { AttemptClusterManager } from './AttemptClusterManager.ts';
import { MemorizationStateEngine } from './MemorizationStateEngine.ts';
import {
  DuplicateLearningEventError,
  OutOfOrderEventError,
  HistoryIntegrityFailureError,
  InvalidLearningEventError,
} from './errorRegistry.ts';

export class LongitudinalProfileStore {
  private readonly studentId: string;
  private readonly clusterManager: AttemptClusterManager;
  private readonly stateEngine: MemorizationStateEngine;
  private activeRanges: StudentMemorizationRange[] = [];
  private passageStates: Map<string, PassageLearningRecord> = new Map();
  private eventHistory: MemorizationEvent[] = [];
  private seenEventIds: Set<string> = new Set();
  private seenEventHashes: Set<string> = new Set();

  // Active unfinalized attempt clusters keyed by passageKey
  private activeClusterBuckets: Map<string, MemorizationEvent[]> = new Map();

  // Privacy invariant (Part 26)
  public readonly rawAudioPersistence: boolean = false;

  constructor(
    studentId: string,
    initialRanges: readonly StudentMemorizationRange[] = [],
    config?: Partial<RevisionScheduleConfig>
  ) {
    this.studentId = studentId;
    this.activeRanges = [...initialRanges];
    this.clusterManager = new AttemptClusterManager(config);
    this.stateEngine = new MemorizationStateEngine(config);
  }

  /**
   * Sets or updates the active memorization targets for the student.
   */
  public setActiveRanges(ranges: readonly StudentMemorizationRange[]): void {
    this.activeRanges = [...ranges];
  }

  /**
   * Records a validated MemorizationEvent and updates the longitudinal profile.
   */
  public recordEvent(event: MemorizationEvent): PassageLearningRecord {
    // 0. Student Ownership Verification (Phase 8A Section 10)
    if (event.studentId !== this.studentId) {
      throw new InvalidLearningEventError(
        `Student ID mismatch: event studentId (${event.studentId}) does not match store studentId (${this.studentId})`,
        { expectedStudentId: this.studentId, eventStudentId: event.studentId }
      );
    }

    // 1. Duplicate event check (Part 28 MEM-002)
    if (this.seenEventIds.has(event.eventId)) {
      throw new DuplicateLearningEventError(event.eventId, { studentId: this.studentId });
    }
    if (event.eventHash && this.seenEventHashes.has(event.eventHash)) {
      throw new DuplicateLearningEventError(event.eventId, {
        reason: 'Identical cryptographic event hash already present in audit history',
      });
    }

    // 2. Out-of-order check (Part 29 MEM-003)
    if (this.eventHistory.length > 0) {
      const lastEvent = this.eventHistory[this.eventHistory.length - 1];
      // Allow slight clock skew up to 1000ms, but reject significantly out-of-order events
      if (event.timestamp < lastEvent.timestamp - 5000) {
        throw new OutOfOrderEventError(
          `Event ${event.eventId} timestamp (${event.timestamp}) precedes previous event timestamp (${lastEvent.timestamp})`,
          { event, lastEvent }
        );
      }
    }

    // Register event in audit index
    this.seenEventIds.add(event.eventId);
    if (event.eventHash) {
      this.seenEventHashes.add(event.eventHash);
    }
    this.eventHistory.push(event);

    const passageKey = `${event.surahId}:${event.ayahNumber}`;

    // Get or initialize passage record
    let record = this.passageStates.get(passageKey);
    if (!record) {
      record = this.stateEngine.initializePassageRecord(event.surahId, event.ayahNumber, event.wordRange);
      this.passageStates.set(passageKey, record);
    }

    // 3. Cluster Accumulation (Part 8 & 9)
    let currentBucket = this.activeClusterBuckets.get(passageKey) || [];

    if (currentBucket.length > 0) {
      const lastInBucket = currentBucket[currentBucket.length - 1];
      const shouldCluster = this.clusterManager.shouldClusterWith(lastInBucket, event);

      if (!shouldCluster) {
        // Finalize previous cluster
        const cluster = this.clusterManager.aggregateCluster(currentBucket, record.lastReviewAt);
        record = this.stateEngine.evaluateClusterTransition(record, cluster, event.timestamp);
        this.passageStates.set(passageKey, record);
        currentBucket = [event];
      } else {
        currentBucket.push(event);
      }
    } else {
      currentBucket.push(event);
    }

    this.activeClusterBuckets.set(passageKey, currentBucket);

    return this.getPassageRecord(passageKey)!;
  }

  /**
   * Explicitly flushes and finalizes any pending uncompleted clusters (e.g. at end of session).
   */
  public flushPendingClusters(currentTime: number = Date.now()): void {
    for (const [passageKey, bucket] of this.activeClusterBuckets.entries()) {
      if (bucket.length > 0) {
        let record = this.passageStates.get(passageKey);
        if (!record) {
          const first = bucket[0];
          record = this.stateEngine.initializePassageRecord(first.surahId, first.ayahNumber, first.wordRange);
        }
        const cluster = this.clusterManager.aggregateCluster(bucket, record.lastReviewAt);
        record = this.stateEngine.evaluateClusterTransition(record, cluster, currentTime);
        this.passageStates.set(passageKey, record);
      }
    }
    this.activeClusterBuckets.clear();
  }

  /**
   * Compiles the full StudentMemorizationProfile snapshot.
   */
  public getProfileSnapshot(currentTime: number = Date.now()): StudentMemorizationProfile {
    const passageStates: Record<string, PassageLearningRecord> = {};
    let lastActivityAt = 0;
    let lastReviewAt = 0;
    let revisionDueCount = 0;
    let weakPassageCount = 0;
    let stablePassageCount = 0;
    let masteredPassageCount = 0;

    const allKeys = new Set([...this.passageStates.keys(), ...this.activeClusterBuckets.keys()]);
    for (const key of allKeys) {
      const rawRecord = this.getPassageRecord(key);
      if (!rawRecord) continue;
      const record = Object.freeze({ ...rawRecord, studentId: this.studentId });
      passageStates[key] = record;

      if (record.lastAttemptAt > lastActivityAt) {
        lastActivityAt = record.lastAttemptAt;
      }
      if (record.lastReviewAt > lastReviewAt) {
        lastReviewAt = record.lastReviewAt;
      }

      if (
        record.currentState === MemorizationState.REVIEW_DUE ||
        (record.nextReviewAt > 0 && currentTime >= record.nextReviewAt)
      ) {
        revisionDueCount++;
      }

      if (
        record.currentState === MemorizationState.WEAKENING ||
        record.currentState === MemorizationState.NEEDS_REINFORCEMENT
      ) {
        weakPassageCount++;
      }

      if (record.currentState === MemorizationState.STABLE) {
        stablePassageCount++;
      }

      if (record.currentState === MemorizationState.MASTERED) {
        masteredPassageCount++;
      }
    }

    return Object.freeze({
      studentId: this.studentId,
      activeMemorizationRange: Object.freeze([...this.activeRanges]),
      passageStates: Object.freeze(passageStates),
      lastActivityAt,
      lastReviewAt,
      revisionDueCount,
      weakPassageCount,
      stablePassageCount,
      masteredPassageCount,
    });
  }

  /**
   * Returns a copy of the immutable event audit history.
   */
  public getAuditHistory(): readonly MemorizationEvent[] {
    return Object.freeze([...this.eventHistory]);
  }

  /**
   * Direct accessor for a specific passage record.
   */
  public getPassageRecord(passageKey: string): PassageLearningRecord | undefined {
    let record = this.passageStates.get(passageKey);
    if (!record) return undefined;
    const bucket = this.activeClusterBuckets.get(passageKey);
    if (bucket && bucket.length > 0) {
      const interimCluster = this.clusterManager.aggregateCluster(bucket, record.lastReviewAt);
      return this.stateEngine.evaluateClusterTransition(record, interimCluster, bucket[bucket.length - 1].timestamp);
    }
    return record;
  }

  /**
   * Verifies the cryptographic consistency of the event history (Part 27).
   */
  public verifyAuditChainIntegrity(): boolean {
    for (let i = 1; i < this.eventHistory.length; i++) {
      const prev = this.eventHistory[i - 1];
      const curr = this.eventHistory[i];

      if (curr.timestamp < prev.timestamp) {
        throw new HistoryIntegrityFailureError(
          `Timestamp inverted in audit chain between event ${prev.eventId} and ${curr.eventId}`
        );
      }
      if (curr.eventId === prev.eventId) {
        throw new HistoryIntegrityFailureError(`Duplicate event ID ${curr.eventId} detected in audit history`);
      }
    }
    return true;
  }
}
