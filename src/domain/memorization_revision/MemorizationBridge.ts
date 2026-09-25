/**
 * @file MemorizationBridge.ts
 * @module domain/memorization_revision
 * @description Bridges Phase 7C Real-Time Session Orchestrator progress events into Phase 7D Memorization Intelligence (Parts 34 & 35).
 * 
 * CORE PIPELINE FLOW:
 * RealTimeSessionOrchestrator -> VerifiedProgressRecord -> MemorizationBridge ->
 * MemorizationEventFactory (validation & SHA-256) -> LongitudinalProfileStore ->
 * MemorizationStateEngine -> RevisionScheduler.
 */

import {
  MemorizationEvent,
  MemorizationEventType,
  EvidenceStatus,
  PassageLearningRecord,
  StudentMemorizationProfile,
} from './types.ts';
import { VerifiedProgressRecord, ProgressEventType } from '../realtime_teacher/types.ts';
import { MemorizationEventFactory } from './MemorizationEventFactory.ts';
import { LongitudinalProfileStore } from './LongitudinalProfileStore.ts';
import { RecitationDecisionState } from '../recitation/decisionTypes.ts';
import { PedagogicalAction } from '../teacher_policy/types.ts';
import {
  CANONICAL_QURAN_HASH,
  TAJWEED_KB_CHECKSUM_SHA256,
  OFFICIAL_MODEL_HASH,
} from '../recitation/RecitationErrorDecisionEngine.ts';
import { OFFICIAL_DATASET_VERSION } from '../../infrastructure/quran/VerifiedQuranDataProvider.ts';

export class MemorizationBridge {
  private readonly profileStore: LongitudinalProfileStore;
  private readonly studentId: string;

  constructor(studentId: string, profileStore?: LongitudinalProfileStore) {
    this.studentId = studentId;
    this.profileStore = profileStore ?? new LongitudinalProfileStore(studentId);
  }

  public getProfileStore(): LongitudinalProfileStore {
    return this.profileStore;
  }

  /**
   * Translates a Phase 7C VerifiedProgressRecord into a Phase 7D MemorizationEvent
   * and ingests it into the longitudinal profile.
   */
  public ingestProgressRecord(
    record: VerifiedProgressRecord,
    options?: {
      attemptNumber?: number;
      retryNumber?: number;
      isIndependentReview?: boolean;
    }
  ): PassageLearningRecord | null {
    const eventType = this.mapProgressEventType(record.eventType);
    if (!eventType) {
      return null; // Non-learning progress event (e.g. initial start)
    }

    const evidenceStatus = this.deriveEvidenceStatus(record.decisionState);

    const event = MemorizationEventFactory.createEvent({
      eventId: `mem-from-${record.recordId}`,
      studentId: this.studentId,
      sessionId: record.sessionId,
      quranLocation: {
        surahId: record.surah,
        ayahNumber: record.ayah,
        wordRange: {
          startWord: record.wordIndex,
          endWord: record.wordIndex,
        },
      },
      eventType,
      evidenceStatus,
      decisionStatus: record.decisionState,
      teacherAction: record.action ?? PedagogicalAction.CONTINUE,
      timestamp: record.timestamp,
      attemptNumber: options?.attemptNumber ?? 1,
      retryNumber: options?.retryNumber ?? 0,
      isIndependentReview: options?.isIndependentReview ?? false,
      quranDatasetVersion: OFFICIAL_DATASET_VERSION.semver,
      quranDatasetHash: CANONICAL_QURAN_HASH,
      modelVersion: 'zipformer-ctc-int8-quran-v1.0.0',
      modelHash: OFFICIAL_MODEL_HASH,
      tajweedKnowledgeVersion: 'tajweed-rules-v1.0.0-hafs',
      tajweedKnowledgeHash: TAJWEED_KB_CHECKSUM_SHA256,
      decisionEngineVersion: 'recitation-decision-v1.0.0-phase5c',
      policyVersion: 'teacher-policy-v1.0.0-phase7a',
      evidenceHash: record.evidenceHash,
    });

    return this.profileStore.recordEvent(event);
  }

  /**
   * Ingests a complete set of progress records collected at session completion.
   */
  public ingestSessionRecords(
    records: readonly VerifiedProgressRecord[],
    options?: { isIndependentReview?: boolean }
  ): StudentMemorizationProfile {
    let attemptCount = 1;
    let retryCount = 0;

    for (const rec of records) {
      if (rec.eventType === ProgressEventType.RETRY_REQUESTED) {
        retryCount++;
      }

      this.ingestProgressRecord(rec, {
        attemptNumber: attemptCount,
        retryNumber: retryCount,
        isIndependentReview: options?.isIndependentReview ?? false,
      });

      if (rec.eventType === ProgressEventType.WORD_CONFIRMED || rec.eventType === ProgressEventType.AYAH_COMPLETED) {
        attemptCount++;
      }
    }

    this.profileStore.flushPendingClusters();
    return this.profileStore.getProfileSnapshot();
  }

  private mapProgressEventType(type: ProgressEventType): MemorizationEventType | null {
    switch (type) {
      case ProgressEventType.WORD_ATTEMPTED:
        return MemorizationEventType.ATTEMPT;
      case ProgressEventType.WORD_CONFIRMED:
        return MemorizationEventType.CONFIRMED;
      case ProgressEventType.AYAH_COMPLETED:
        return MemorizationEventType.AYAH_COMPLETED;
      case ProgressEventType.RETRY_REQUESTED:
        return MemorizationEventType.RETRY;
      case ProgressEventType.PHONETIC_ERROR_CONFIRMED:
        return MemorizationEventType.ERROR_CONFIRMED;
      case ProgressEventType.REVIEW_REQUIRED:
        return MemorizationEventType.REVIEW_STARTED;
      case ProgressEventType.SESSION_COMPLETED:
        return MemorizationEventType.SESSION_COMPLETED;
      default:
        return null;
    }
  }

  private deriveEvidenceStatus(decision: RecitationDecisionState): EvidenceStatus {
    switch (decision) {
      case RecitationDecisionState.MATCH:
      case RecitationDecisionState.CONTINUE:
      case RecitationDecisionState.CONFIRMED_PHONETIC_ERROR:
        return EvidenceStatus.CONFIRMED;
      case RecitationDecisionState.INCONCLUSIVE:
      case RecitationDecisionState.DEFER_TO_TEACHER:
        return EvidenceStatus.INCONCLUSIVE;
      case RecitationDecisionState.POSSIBLE_ERROR:
      case RecitationDecisionState.REQUEST_REPEAT:
      case RecitationDecisionState.TAJWEED_EVIDENCE_PENDING:
      case RecitationDecisionState.INTERRUPT_RECOMMENDED:
      default:
        return EvidenceStatus.POSSIBLE;
    }
  }
}
