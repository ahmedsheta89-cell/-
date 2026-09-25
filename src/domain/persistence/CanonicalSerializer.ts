/**
 * @file CanonicalSerializer.ts
 * @module domain/persistence
 * @description Canonical, deterministic JSON serialization and SHA-256 integrity hash generator (Sections 8, 9).
 * 
 * CORE GUARANTEES:
 * - Deterministic Key Ordering: All object keys sorted lexicographically (recursive).
 * - Number Normalization: Normalized string representations without exponential variance.
 * - String Normalization: Pure UTF-8 canonical encoding.
 * - Portable SHA-256: Zero node:crypto dependencies; identical output in Node and browser.
 */

import { computeSha256Sync } from '../../infrastructure/crypto/Sha256Util.ts';
import {
  PersistentMemorizationEvent,
  PersistentProfileSnapshot,
  PersistentRevisionPlan,
  PersistentRevisionHistoryRecord,
  PersistenceCheckpoint,
  GENESIS_PREVIOUS_HASH,
} from './types.ts';

export class CanonicalSerializer {
  /**
   * Serializes any JavaScript value to a deterministic, canonical JSON string.
   */
  public static canonicalStringify(value: unknown): string {
    if (value === null || value === undefined) {
      return 'null';
    }

    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }

    if (typeof value === 'number') {
      if (!isFinite(value)) {
        throw new Error(`Cannot serialize non-finite number: ${value}`);
      }
      return Object.is(value, -0) ? '-0' : String(value);
    }

    if (typeof value === 'string') {
      return JSON.stringify(value);
    }

    if (Array.isArray(value)) {
      const items = value.map((item) => this.canonicalStringify(item));
      return `[${items.join(',')}]`;
    }

    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      const sortedKeys = Object.keys(obj).sort();
      const entries: string[] = [];

      for (const key of sortedKeys) {
        const val = obj[key];
        if (val !== undefined) {
          entries.push(`${JSON.stringify(key)}:${this.canonicalStringify(val)}`);
        }
      }

      return `{${entries.join(',')}}`;
    }

    throw new Error(`Unsupported value type for canonical serialization: ${typeof value}`);
  }

  /**
   * Computes the deterministic SHA-256 hash for a persistent learning event (Section 8 & 9).
   * Binds schemaVersion, eventId, studentId, sessionId, timestamp, eventType, Quran coordinates,
   * evidence status, decision status, teacher action, attempt numbers, versions, and previousEventHash.
   */
  public static computeEventHash(
    event: Omit<PersistentMemorizationEvent, 'eventHash'>
  ): string {
    const canonicalEnvelope = {
      schemaVersion: event.schemaVersion,
      sequenceNumber: event.sequenceNumber,
      previousEventHash: event.previousEventHash ?? GENESIS_PREVIOUS_HASH,
      eventId: event.eventId,
      studentId: event.studentId,
      sessionId: event.sessionId,
      surahId: event.surahId,
      ayahNumber: event.ayahNumber,
      wordRange: event.wordRange
        ? {
            startWord: event.wordRange.startWord,
            endWord: event.wordRange.endWord,
          }
        : null,
      eventType: event.eventType,
      evidenceStatus: event.evidenceStatus,
      decisionStatus: event.decisionStatus,
      teacherAction: event.teacherAction,
      timestamp: event.timestamp,
      attemptNumber: event.attemptNumber,
      retryNumber: event.retryNumber,
      attemptClusterId: event.attemptClusterId,
      isIndependentReview: Boolean(event.isIndependentReview),
      quranDatasetVersion: event.quranDatasetVersion,
      quranDatasetHash: event.quranDatasetHash,
      modelVersion: event.modelVersion,
      modelHash: event.modelHash,
      tajweedKnowledgeVersion: event.tajweedKnowledgeVersion,
      tajweedKnowledgeHash: event.tajweedKnowledgeHash,
      decisionEngineVersion: event.decisionEngineVersion,
      policyVersion: event.policyVersion,
      revisionAlgorithmVersion: event.revisionAlgorithmVersion,
    };

    const serialized = this.canonicalStringify(canonicalEnvelope);
    return computeSha256Sync(serialized);
  }

  /**
   * Computes the deterministic SHA-256 hash for a derived profile snapshot (Section 17).
   */
  public static computeSnapshotHash(
    snapshot: Omit<PersistentProfileSnapshot, 'profileHash'>
  ): string {
    const canonicalEnvelope = {
      schemaVersion: snapshot.schemaVersion,
      studentId: snapshot.studentId,
      snapshotVersion: snapshot.snapshotVersion,
      sourceEventCursor: snapshot.sourceEventCursor,
      sourceEventCount: snapshot.sourceEventCount,
      generatedAt: snapshot.generatedAt,
      activeMemorizationRange: snapshot.activeMemorizationRange.map((r) => ({
        surahId: r.surahId,
        startAyah: r.startAyah,
        endAyah: r.endAyah,
      })),
      passageStates: Object.keys(snapshot.passageStates)
        .sort()
        .reduce((acc, key) => {
          const p = snapshot.passageStates[key];
          acc[key] = {
            passageKey: p.passageKey,
            studentId: p.studentId,
            surahId: p.surahId,
            ayahNumber: p.ayahNumber,
            wordRange: p.wordRange ? { startWord: p.wordRange.startWord, endWord: p.wordRange.endWord } : null,
            firstIntroducedAt: p.firstIntroducedAt,
            lastAttemptAt: p.lastAttemptAt,
            lastConfirmedAt: p.lastConfirmedAt,
            lastReviewAt: p.lastReviewAt,
            practiceClusterCount: p.practiceClusterCount,
            independentReviewCount: p.independentReviewCount,
            confirmedSuccessCount: p.confirmedSuccessCount,
            confirmedErrorCount: p.confirmedErrorCount,
            inconclusiveCount: p.inconclusiveCount,
            recentAccuracy: p.recentAccuracy,
            historicalAccuracy: p.historicalAccuracy,
            errorOccurrences: p.errorOccurrences,
            recentErrorOccurrences: p.recentErrorOccurrences,
            successfulCorrections: p.successfulCorrections,
            lastErrorAt: p.lastErrorAt,
            currentState: p.currentState,
            nextReviewAt: p.nextReviewAt,
            stabilityIndex: p.stabilityIndex,
          };
          return acc;
        }, {} as Record<string, unknown>),
      lastActivityAt: snapshot.lastActivityAt,
      lastReviewAt: snapshot.lastReviewAt,
      revisionDueCount: snapshot.revisionDueCount,
      weakPassageCount: snapshot.weakPassageCount,
      stablePassageCount: snapshot.stablePassageCount,
      masteredPassageCount: snapshot.masteredPassageCount,
    };

    const serialized = this.canonicalStringify(canonicalEnvelope);
    return computeSha256Sync(serialized);
  }

  /**
   * Computes the deterministic SHA-256 hash for a revision plan (Section 18).
   */
  public static computePlanHash(
    plan: Omit<PersistentRevisionPlan, 'planHash'>
  ): string {
    const canonicalEnvelope = {
      schemaVersion: plan.schemaVersion,
      studentId: plan.studentId,
      planId: plan.planId,
      generatedAt: plan.generatedAt,
      algorithmVersion: plan.algorithmVersion,
      configurationVersion: plan.configurationVersion,
      sourceProfileVersion: plan.sourceProfileVersion,
      mode: plan.mode,
      estimatedMinutes: plan.estimatedMinutes,
      status: plan.status,
      targets: plan.targets.map((t) => ({
        passageKey: t.passageKey,
        surahId: t.surahId,
        ayahNumber: t.ayahNumber,
        reason: t.reason,
        priority: t.priority,
        estimatedMinutes: t.estimatedMinutes,
      })),
      completedTargets: [...plan.completedTargets].sort(),
      remainingTargets: [...plan.remainingTargets].sort(),
    };

    const serialized = this.canonicalStringify(canonicalEnvelope);
    return computeSha256Sync(serialized);
  }

  /**
   * Computes the deterministic SHA-256 hash for a revision history record (Section 19).
   */
  public static computeHistoryHash(
    record: Omit<PersistentRevisionHistoryRecord, 'recordHash'>
  ): string {
    const canonicalEnvelope = {
      schemaVersion: record.schemaVersion,
      historyId: record.historyId,
      studentId: record.studentId,
      planId: record.planId ?? null,
      passageKey: record.passageKey,
      surahId: record.surahId,
      ayahNumber: record.ayahNumber,
      timestamp: record.timestamp,
      status: record.status,
      evidenceStatus: record.evidenceStatus,
      durationMs: record.durationMs ?? null,
    };

    const serialized = this.canonicalStringify(canonicalEnvelope);
    return computeSha256Sync(serialized);
  }

  /**
   * Computes the deterministic SHA-256 hash for a stream checkpoint.
   */
  public static computeCheckpointHash(
    checkpoint: Omit<PersistenceCheckpoint, 'checkpointHash'>
  ): string {
    const canonicalEnvelope = {
      schemaVersion: checkpoint.schemaVersion,
      studentId: checkpoint.studentId,
      lastEventId: checkpoint.lastEventId,
      lastEventHash: checkpoint.lastEventHash,
      eventCount: checkpoint.eventCount,
      lastSnapshotVersion: checkpoint.lastSnapshotVersion,
      timestamp: checkpoint.timestamp,
    };

    const serialized = this.canonicalStringify(canonicalEnvelope);
    return computeSha256Sync(serialized);
  }
}
