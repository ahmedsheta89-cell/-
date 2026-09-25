/**
 * @file types.ts
 * @module domain/memorization_revision
 * @description Domain contracts, state machines, and data structures for Phase 7D Memorization & Revision Intelligence.
 * 
 * CORE ARCHITECTURAL INVARIANT:
 * Authority Chain:
 * Verified Quran Dataset -> Real Recitation Evidence -> Deterministic Tajweed Knowledge ->
 * Phase 5C Decision Engine -> Phase 7A Teacher Policy -> Phase 7B Language Layer ->
 * Phase 7C Real-Time Interaction -> Phase 7D Learning Memory -> Revision Scheduling.
 * 
 * Phase 7D CANNOT override upstream evidence, nor can AI models mutate learning states.
 * This is a pedagogical scheduling system, NOT a religious certification or Ijazah system.
 */

import { RecitationDecisionState } from '../recitation/decisionTypes.ts';
import { PedagogicalAction } from '../teacher_policy/types.ts';

/**
 * Section 4: Validated Learning Event Types.
 * Only deterministic validated events can affect mastery state.
 */
export enum MemorizationEventType {
  ATTEMPT = 'ATTEMPT',
  CONFIRMED = 'CONFIRMED',
  RETRY = 'RETRY',
  ERROR_CONFIRMED = 'ERROR_CONFIRMED',
  INCONCLUSIVE = 'INCONCLUSIVE',
  AYAH_COMPLETED = 'AYAH_COMPLETED',
  REVIEW_STARTED = 'REVIEW_STARTED',
  REVIEW_COMPLETED = 'REVIEW_COMPLETED',
  REVIEW_FAILED = 'REVIEW_FAILED',
  SESSION_COMPLETED = 'SESSION_COMPLETED',
}

/**
 * Section 5: Evidence Status.
 * INCONCLUSIVE != FAILURE, INCONCLUSIVE != SUCCESS.
 * POSSIBLE != CONFIRMED. A possible error must never downgrade memorization.
 */
export enum EvidenceStatus {
  CONFIRMED = 'CONFIRMED',
  POSSIBLE = 'POSSIBLE',
  INCONCLUSIVE = 'INCONCLUSIVE',
  NO_EVIDENCE = 'NO_EVIDENCE',
}

/**
 * Section 6 & 7: Pedagogical Memorization States.
 * IMPORTANT: MASTERED is strictly a pedagogical scheduling state.
 * It is NOT an Ijazah, scholarly certification, permanent memory, or claim of perfection.
 */
export enum MemorizationState {
  NOT_STARTED = 'NOT_STARTED',
  INTRODUCED = 'INTRODUCED',
  LEARNING = 'LEARNING',
  PRACTICING = 'PRACTICING',
  STABLE = 'STABLE',
  REVIEW_DUE = 'REVIEW_DUE',
  WEAKENING = 'WEAKENING',
  NEEDS_REINFORCEMENT = 'NEEDS_REINFORCEMENT',
  MASTERED = 'MASTERED',
}

/**
 * Quran passage location coordinate.
 */
export interface QuranPassageLocation {
  readonly surahId: number;
  readonly ayahNumber: number;
  readonly wordRange?: {
    readonly startWord: number;
    readonly endWord: number;
  };
}

/**
 * Section 3: Immutable Memorization Event.
 * Guaranteed to NEVER contain raw audio buffers or Floats.
 */
export interface MemorizationEvent {
  readonly eventId: string;
  readonly studentId: string;
  readonly sessionId: string;
  readonly quranLocation: QuranPassageLocation;
  readonly surahId: number;
  readonly ayahNumber: number;
  readonly wordRange?: {
    readonly startWord: number;
    readonly endWord: number;
  };
  readonly eventType: MemorizationEventType;
  readonly evidenceStatus: EvidenceStatus;
  readonly decisionStatus: RecitationDecisionState;
  readonly teacherAction: PedagogicalAction;
  readonly timestamp: number;
  readonly attemptNumber: number;
  readonly retryNumber: number;
  readonly attemptClusterId: string;
  readonly isIndependentReview: boolean;
  
  // Cryptographic & Integrity Audit Signatures
  readonly quranDatasetVersion: string;
  readonly quranDatasetHash: string;
  readonly modelVersion: string;
  readonly modelHash: string;
  readonly tajweedKnowledgeVersion: string;
  readonly tajweedKnowledgeHash: string;
  readonly decisionEngineVersion: string;
  readonly policyVersion: string;
  readonly revisionAlgorithmVersion: string;

  // Optional Performance Metrics (No Audio)
  readonly durationMs?: number;
  readonly confidence?: number;
  readonly alignmentScore?: number;
  readonly evidenceHash?: string;
  readonly eventHash?: string;
}

/**
 * Section 8 & 9: Attempt Clustering & Review Distinction.
 */
export enum ClusterInteractionType {
  PRACTICE_ATTEMPT = 'PRACTICE_ATTEMPT',
  INDEPENDENT_REVIEW = 'INDEPENDENT_REVIEW',
}

export interface AttemptCluster {
  readonly clusterId: string;
  readonly sessionId: string;
  readonly passageKey: string;
  readonly startedAt: number;
  readonly endedAt: number;
  readonly interactionType: ClusterInteractionType;
  readonly attempts: readonly MemorizationEvent[];
  readonly aggregateAccuracy: number;
  readonly isResolvedSuccessfully: boolean;
  readonly retryCount: number;
}

/**
 * Section 11: Canonical Passage Learning Record.
 */
export interface PassageLearningRecord {
  readonly passageKey: string; // Format: "surah:ayah" or "surah:start-end"
  readonly studentId?: string;
  readonly surahId: number;
  readonly ayahNumber: number;
  readonly wordRange?: {
    readonly startWord: number;
    readonly endWord: number;
  };

  // Temporal Milestones
  readonly firstIntroducedAt: number;
  readonly lastAttemptAt: number;
  readonly lastConfirmedAt: number;
  readonly lastReviewAt: number;

  // Cluster & Review Counts
  readonly practiceClusterCount: number;
  readonly independentReviewCount: number;

  // Evidence Counts
  readonly confirmedSuccessCount: number;
  readonly confirmedErrorCount: number;
  readonly inconclusiveCount: number;

  // Accuracy Statistics (Separating recent vs historical per Part 18)
  readonly recentAccuracy: number; // e.g. exponential moving average of last clusters
  readonly historicalAccuracy: number; // total cumulative confirmed ratio

  // Recurrence Tracking (Part 17)
  readonly errorOccurrences: number;
  readonly recentErrorOccurrences: number;
  readonly successfulCorrections: number;
  readonly lastErrorAt: number;

  // Pedagogical State & Scheduling
  readonly currentState: MemorizationState;
  readonly nextReviewAt: number;
  readonly stabilityIndex: number; // Continuous score for interval computation
}

/**
 * Active Quran target range for a student.
 */
export interface StudentMemorizationRange {
  readonly surahId: number;
  readonly startAyah: number;
  readonly endAyah: number;
}

/**
 * Section 10: Longitudinal Student Memorization Profile.
 * Strictly pedagogical — contains NO psychological inferences or assumptions.
 */
export interface StudentMemorizationProfile {
  readonly studentId: string;
  readonly activeMemorizationRange: readonly StudentMemorizationRange[];
  readonly passageStates: Record<string, PassageLearningRecord>;
  readonly lastActivityAt: number;
  readonly lastReviewAt: number;
  readonly revisionDueCount: number;
  readonly weakPassageCount: number;
  readonly stablePassageCount: number;
  readonly masteredPassageCount: number;
}

/**
 * Section 14: Revision Urgency Levels (5-Level Canonical Semantic Model).
 * Every urgency level has deterministic, evidence-grounded criteria.
 */
export enum ReviewUrgency {
  CRITICAL_WEAKNESS = 'CRITICAL_WEAKNESS',
  REVIEW_OVERDUE = 'REVIEW_OVERDUE',
  REVIEW_DUE = 'REVIEW_DUE',
  REVIEW_SOON = 'REVIEW_SOON',
  NO_REVIEW_REQUIRED = 'NO_REVIEW_REQUIRED',

  /** @deprecated Backward compatibility alias for CRITICAL_WEAKNESS */
  REVIEW_NOW = 'CRITICAL_WEAKNESS',
  /** @deprecated Backward compatibility alias for NO_REVIEW_REQUIRED */
  STABLE = 'NO_REVIEW_REQUIRED',
}

/**
 * Machine-readable reason codes for revision recommendation (Part 14).
 */
export enum RevisionReasonCode {
  REVIEW_INTERVAL_REACHED = 'REVIEW_INTERVAL_REACHED',
  RECENT_CONFIRMED_ERROR = 'RECENT_CONFIRMED_ERROR',
  DECLINING_RECENT_ACCURACY = 'DECLINING_RECENT_ACCURACY',
  LONG_ABSENCE = 'LONG_ABSENCE',
  NEW_UNCONSOLIDATED_PASSAGE = 'NEW_UNCONSOLIDATED_PASSAGE',
  INSUFFICIENT_INDEPENDENT_REVIEWS = 'INSUFFICIENT_INDEPENDENT_REVIEWS',
  PERIODIC_MAINTENANCE = 'PERIODIC_MAINTENANCE',
  NEEDS_REINFORCEMENT_FOLLOWUP = 'NEEDS_REINFORCEMENT_FOLLOWUP',
}

/**
 * Section 21: Revision Priority Calculation Factors.
 */
export interface RevisionPriorityFactors {
  readonly recencyFactor: number;       // Weight based on elapsed time relative to schedule
  readonly errorFactor: number;         // Weight based on confirmed error recurrence
  readonly reviewDueFactor: number;     // Weight based on urgency threshold
  readonly stabilityFactor: number;     // Inverse weight of passage stability
  readonly totalPriority: number;       // Deterministic composite priority score (0.0 to 100.0)
}

/**
 * Revision schedule outcome for a single passage.
 */
export interface RevisionScheduleResult {
  readonly passageKey: string;
  readonly urgency: ReviewUrgency;
  readonly nextReviewAt: number;
  readonly intervalHours: number;
  readonly reasonCodes: readonly RevisionReasonCode[];
  readonly naturalLanguageExplanationArabic: string;
  readonly priorityFactors: RevisionPriorityFactors;
}

/**
 * Section 16: Versioned Revision Schedule Configuration.
 * 
 * SCIENTIFIC HEURISTIC NOTICE:
 * These intervals are deterministic application heuristics and have not been established
 * as universally optimal by independent longitudinal research.
 */
export interface RevisionScheduleConfig {
  readonly configVersion: string;
  readonly firstReviewIntervalHours: number;    // e.g. 24h
  readonly secondReviewIntervalHours: number;   // e.g. 72h (3 days)
  readonly stableIntervalHours: number;         // e.g. 168h (7 days)
  readonly masteredIntervalHours: number;       // e.g. 336h (14 days)
  readonly weakIntervalHours: number;           // e.g. 12h
  readonly independentReviewMinGapHours: number;// Minimum hours separating independent reviews (e.g. 4h)
  readonly maxClusterGapMs: number;             // Maximum ms between attempts in same cluster (10 mins = 600,000ms)
  readonly maxRecentErrorsThreshold: number;    // Errors in recent window that trigger WEAKENING
  readonly stabilityGrowthMultiplier: number;   // Multiplier for successive clean reviews (e.g. 1.6)
  readonly masteredMinIndependentReviews: number; // Configurable pedagogical threshold for MASTERED state (default 4)
}

export const CANONICAL_REVISION_CONFIG: RevisionScheduleConfig = Object.freeze({
  configVersion: 'revision-config-v1.0.0-phase7d',
  firstReviewIntervalHours: 24,
  secondReviewIntervalHours: 72,
  stableIntervalHours: 168,
  masteredIntervalHours: 336,
  weakIntervalHours: 12,
  independentReviewMinGapHours: 4,
  maxClusterGapMs: 600000, // 10 minutes default configurable window
  maxRecentErrorsThreshold: 2,
  stabilityGrowthMultiplier: 1.6,
  masteredMinIndependentReviews: 4,
});

/**
 * Section 20: Revision Set Generation Modes.
 */
export enum RevisionSetMode {
  DAILY = 'DAILY',         // Recently learned material
  WEAKNESS = 'WEAKNESS',   // Passages with recurring confirmed difficulty
  SPACED = 'SPACED',       // Passages reaching configured review time
  MIXED = 'MIXED',         // Combination of new, recent, older stable, and weak
}

export interface PassageTarget {
  readonly passageKey: string;
  readonly surahId: number;
  readonly ayahNumber: number;
  readonly reason: RevisionReasonCode;
  readonly priority: number;
  readonly estimatedMinutes: number;
}

/**
 * Section 22: Daily Revision Plan.
 */
export interface DailyRevisionPlan {
  readonly planId: string;
  readonly studentId: string;
  readonly date: string; // YYYY-MM-DD
  readonly mode: RevisionSetMode;
  readonly newTargets: readonly PassageTarget[];
  readonly revisionTargets: readonly PassageTarget[];
  readonly weakTargets: readonly PassageTarget[];
  readonly estimatedMinutes: number;
  readonly completedTargets: readonly string[]; // passageKeys
  readonly remainingTargets: readonly string[];
  readonly algorithmVersion: string;
}

/**
 * Part 41: Phase 7D Explicit Error Codes.
 */
export enum MemorizationErrorCode {
  INVALID_LEARNING_EVENT = 'MEM-001: INVALID_LEARNING_EVENT',
  DUPLICATE_LEARNING_EVENT = 'MEM-002: DUPLICATE_LEARNING_EVENT',
  OUT_OF_ORDER_EVENT = 'MEM-003: OUT_OF_ORDER_EVENT',
  INVALID_QURAN_LOCATION = 'MEM-004: INVALID_QURAN_LOCATION',
  VERSION_MISMATCH = 'MEM-005: VERSION_MISMATCH',
  STATE_TRANSITION_REJECTED = 'MEM-006: STATE_TRANSITION_REJECTED',
  REVISION_PLAN_INVALID = 'MEM-007: REVISION_PLAN_INVALID',
  HISTORY_INTEGRITY_FAILURE = 'MEM-008: HISTORY_INTEGRITY_FAILURE',
  UNKNOWN_LEARNING_STATE = 'MEM-009: UNKNOWN_LEARNING_STATE',
  SCHEDULER_CONFIGURATION_INVALID = 'MEM-010: SCHEDULER_CONFIGURATION_INVALID',
}
