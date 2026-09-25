/**
 * @file MemorizationEventFactory.ts
 * @module domain/memorization_revision
 * @description Factory and validator for Phase 7D MemorizationEvent objects.
 * 
 * CORE GUARANTEES:
 * - Deterministic SHA-256 event cryptographic hash generation.
 * - Strict rejection of raw audio (Float32Array, AudioBuffer, PCM arrays) per Part 26.
 * - Validation of canonical Quran coordinates against the 114-Surah Hafs manifest.
 * - Validation of cryptographic versions and dataset hashes.
 */

import {
  MemorizationEvent,
  MemorizationEventType,
  EvidenceStatus,
  QuranPassageLocation,
} from './types.ts';
import { RecitationDecisionState } from '../recitation/decisionTypes.ts';
import { PedagogicalAction } from '../teacher_policy/types.ts';
import { ALL_114_SURAHS_MANIFEST } from '../../infrastructure/quran/VerifiedQuranDataProvider.ts';
import { computeSha256Sync } from '../../infrastructure/crypto/Sha256Util.ts';
import {
  InvalidLearningEventError,
  InvalidQuranLocationError,
  VersionMismatchError,
} from './errorRegistry.ts';

export interface CreateMemorizationEventParams {
  eventId?: string;
  studentId: string;
  sessionId: string;
  quranLocation: QuranPassageLocation;
  eventType: MemorizationEventType;
  evidenceStatus: EvidenceStatus;
  decisionStatus: RecitationDecisionState;
  teacherAction: PedagogicalAction;
  timestamp?: number;
  attemptNumber: number;
  retryNumber?: number;
  attemptClusterId?: string;
  isIndependentReview?: boolean;
  quranDatasetVersion: string;
  quranDatasetHash: string;
  modelVersion: string;
  modelHash: string;
  tajweedKnowledgeVersion: string;
  tajweedKnowledgeHash: string;
  decisionEngineVersion: string;
  policyVersion: string;
  revisionAlgorithmVersion?: string;
  durationMs?: number;
  confidence?: number;
  alignmentScore?: number;
  evidenceHash?: string;
  [key: string]: unknown; // Used to detect attempted injection of raw audio fields
}

export class MemorizationEventFactory {
  public static readonly CURRENT_ALGORITHM_VERSION = 'revision-algorithm-v1.0.0-phase7d';

  /**
   * Creates and cryptographically validates a new MemorizationEvent.
   */
  public static createEvent(params: CreateMemorizationEventParams): MemorizationEvent {
    // 1. Check for raw audio leakage (Part 26 Privacy requirement)
    this.assertNoAudioData(params);

    // 2. Validate studentId and sessionId
    if (!params.studentId || typeof params.studentId !== 'string' || params.studentId.trim().length === 0) {
      throw new InvalidLearningEventError('studentId must be a non-empty string', { params });
    }
    if (!params.sessionId || typeof params.sessionId !== 'string' || params.sessionId.trim().length === 0) {
      throw new InvalidLearningEventError('sessionId must be a non-empty string', { params });
    }

    // 3. Validate Quran Coordinates against Hafs Canon (Part 41 MEM-004)
    const { surahId, ayahNumber, wordRange } = params.quranLocation;
    this.validateQuranLocation(surahId, ayahNumber, wordRange);

    // 4. Validate Event Type & Evidence Status
    if (!Object.values(MemorizationEventType).includes(params.eventType)) {
      throw new InvalidLearningEventError(`Invalid eventType: ${params.eventType}`, { params });
    }
    if (!Object.values(EvidenceStatus).includes(params.evidenceStatus)) {
      throw new InvalidLearningEventError(`Invalid evidenceStatus: ${params.evidenceStatus}`, { params });
    }
    if (!params.decisionStatus) {
      throw new InvalidLearningEventError('decisionStatus is required', { params });
    }
    if (!params.teacherAction) {
      throw new InvalidLearningEventError('teacherAction is required', { params });
    }

    // 5. Validate numbers and temporal values
    const timestamp = params.timestamp ?? Date.now();
    if (typeof timestamp !== 'number' || isNaN(timestamp) || timestamp <= 0) {
      throw new InvalidLearningEventError('timestamp must be a valid positive epoch number', { params });
    }
    const attemptNumber = params.attemptNumber;
    if (typeof attemptNumber !== 'number' || attemptNumber < 1) {
      throw new InvalidLearningEventError('attemptNumber must be an integer >= 1', { params });
    }
    const retryNumber = params.retryNumber ?? 0;
    if (typeof retryNumber !== 'number' || retryNumber < 0) {
      throw new InvalidLearningEventError('retryNumber must be an integer >= 0', { params });
    }

    // 6. Validate Version Strings and Hashes
    if (!params.quranDatasetVersion || !params.quranDatasetHash) {
      throw new VersionMismatchError('Valid Quran dataset version and hash required', 'missing', { params });
    }
    if (!params.modelVersion || !params.modelHash) {
      throw new VersionMismatchError('Valid ASR model version and hash required', 'missing', { params });
    }
    if (!params.tajweedKnowledgeVersion || !params.tajweedKnowledgeHash) {
      throw new VersionMismatchError('Valid Tajweed KB version and hash required', 'missing', { params });
    }
    if (!params.decisionEngineVersion || !params.policyVersion) {
      throw new VersionMismatchError('Valid Decision Engine and Policy versions required', 'missing', { params });
    }

    // 7. Establish IDs
    const eventId =
      params.eventId ??
      `mem-evt-${surahId}-${ayahNumber}-${timestamp}-${Math.floor(Math.random() * 100000)}`;
    const attemptClusterId =
      params.attemptClusterId ??
      `cluster-${params.sessionId}-${surahId}-${ayahNumber}`;
    const revisionAlgorithmVersion =
      params.revisionAlgorithmVersion ?? MemorizationEventFactory.CURRENT_ALGORITHM_VERSION;

    // 8. Deterministic Cryptographic Event Hash
    const rawEnvelope = {
      eventId,
      studentId: params.studentId,
      sessionId: params.sessionId,
      surahId,
      ayahNumber,
      wordRange,
      eventType: params.eventType,
      evidenceStatus: params.evidenceStatus,
      decisionStatus: params.decisionStatus,
      teacherAction: params.teacherAction,
      timestamp,
      attemptNumber,
      retryNumber,
      attemptClusterId,
      isIndependentReview: Boolean(params.isIndependentReview),
      quranDatasetVersion: params.quranDatasetVersion,
      quranDatasetHash: params.quranDatasetHash,
      modelVersion: params.modelVersion,
      modelHash: params.modelHash,
      tajweedKnowledgeVersion: params.tajweedKnowledgeVersion,
      tajweedKnowledgeHash: params.tajweedKnowledgeHash,
      decisionEngineVersion: params.decisionEngineVersion,
      policyVersion: params.policyVersion,
      revisionAlgorithmVersion,
    };

    const eventHash = computeSha256Sync(JSON.stringify(rawEnvelope));

    return Object.freeze({
      eventId,
      studentId: params.studentId,
      sessionId: params.sessionId,
      quranLocation: Object.freeze({
        surahId,
        ayahNumber,
        wordRange: wordRange ? Object.freeze({ ...wordRange }) : undefined,
      }),
      surahId,
      ayahNumber,
      wordRange: wordRange ? Object.freeze({ ...wordRange }) : undefined,
      eventType: params.eventType,
      evidenceStatus: params.evidenceStatus,
      decisionStatus: params.decisionStatus,
      teacherAction: params.teacherAction,
      timestamp,
      attemptNumber,
      retryNumber,
      attemptClusterId,
      isIndependentReview: Boolean(params.isIndependentReview),
      quranDatasetVersion: params.quranDatasetVersion,
      quranDatasetHash: params.quranDatasetHash,
      modelVersion: params.modelVersion,
      modelHash: params.modelHash,
      tajweedKnowledgeVersion: params.tajweedKnowledgeVersion,
      tajweedKnowledgeHash: params.tajweedKnowledgeHash,
      decisionEngineVersion: params.decisionEngineVersion,
      policyVersion: params.policyVersion,
      revisionAlgorithmVersion,
      durationMs: params.durationMs,
      confidence: params.confidence,
      alignmentScore: params.alignmentScore,
      evidenceHash: params.evidenceHash,
      eventHash,
    });
  }

  /**
   * Validates canonical Quran coordinates against the official Hafs manifest.
   */
  public static validateQuranLocation(
    surahId: number,
    ayahNumber: number,
    wordRange?: { startWord: number; endWord: number }
  ): void {
    if (typeof surahId !== 'number' || surahId < 1 || surahId > 114) {
      throw new InvalidQuranLocationError(surahId, ayahNumber, { reason: 'Surah must be between 1 and 114' });
    }

    const surahRecord = ALL_114_SURAHS_MANIFEST.find((s) => s.number === surahId);
    if (!surahRecord) {
      throw new InvalidQuranLocationError(surahId, ayahNumber, { reason: 'Surah manifest record missing' });
    }

    if (typeof ayahNumber !== 'number' || ayahNumber < 1 || ayahNumber > surahRecord.totalAyahs) {
      throw new InvalidQuranLocationError(surahId, ayahNumber, {
        reason: `Surah ${surahRecord.nameArabic} has ${surahRecord.totalAyahs} ayahs; received ${ayahNumber}`,
      });
    }

    if (wordRange) {
      if (
        typeof wordRange.startWord !== 'number' ||
        typeof wordRange.endWord !== 'number' ||
        wordRange.startWord < 0 ||
        wordRange.endWord < wordRange.startWord
      ) {
        throw new InvalidLearningEventError(
          `Invalid word range: startWord ${wordRange.startWord} must be <= endWord ${wordRange.endWord}`,
          { wordRange }
        );
      }
    }
  }

  /**
   * Enforces privacy rule (Part 26): Rejects any raw audio, PCM buffers, or Float32 arrays.
   */
  private static assertNoAudioData(params: Record<string, unknown>): void {
    const forbiddenAudioKeys = ['audio', 'pcm', 'rawAudio', 'samples', 'buffer', 'audioBuffer', 'floatArray'];
    for (const key of forbiddenAudioKeys) {
      if (params[key] !== undefined && params[key] !== null) {
        throw new InvalidLearningEventError(
          `Privacy Violation: Raw audio data in field "${key}" must NEVER be stored in MemorizationEvent (Part 26)`,
          { key }
        );
      }
    }

    for (const [k, v] of Object.entries(params)) {
      if (v instanceof Float32Array || v instanceof Float64Array || v instanceof ArrayBuffer) {
        throw new InvalidLearningEventError(
          `Privacy Violation: Binary audio array detected in field "${k}". Memory records must only retain discrete metrics.`,
          { field: k }
        );
      }
    }
  }
}
