/**
 * @file types.ts
 * @module domain/teacher_policy
 * @description Phase 7A Evidence-Grounded Quran Teacher Policy & Pedagogical Decision Engine domain contracts.
 * 
 * CORE ARCHITECTURAL INVARIANT:
 * Verified Quran Context
 *         ↓
 * Real Recitation Evidence
 *         ↓
 * Deterministic Tajweed Evidence
 *         ↓
 * Phase 5C Decision Engine
 *         ↓
 * Teacher Policy Engine
 *         ↓
 * Pedagogical Action
 *         ↓
 * Future AI Language Layer
 *         ↓
 * Learner
 * 
 * STRICT PROHIBITIONS:
 * - Never: Audio → LLM → Religious Judgment
 * - Never: LLM → Tajweed Decision
 * - Never: LLM → Quran Text Generation
 * - Lower layers may NEVER override higher-authority evidence.
 */

import {
  RecitationDecisionState,
  PhoneticDecisionErrorType,
  AlignmentStabilityState,
  PhoneticErrorDetail,
  RecitationDecisionOutput,
} from '../recitation/decisionTypes.ts';
import { RecitationEvidence } from '../recitation/RecitationEvidence.ts';
import { TajweedRuleEvidence } from '../tajweed/types.ts';

/**
 * Deterministic Pedagogical Action Vocabulary (Section 5).
 * Strictly controlled action enum; no arbitrary strings permitted.
 */
export enum PedagogicalAction {
  CONTINUE = 'CONTINUE',
  PRAISE_AND_CONTINUE = 'PRAISE_AND_CONTINUE',
  REQUEST_REPEAT = 'REQUEST_REPEAT',
  REQUEST_CLEARER_AUDIO = 'REQUEST_CLEARER_AUDIO',
  CORRECT_PHONETICALLY = 'CORRECT_PHONETICALLY',
  HIGHLIGHT_WORD = 'HIGHLIGHT_WORD',
  HIGHLIGHT_POSITION = 'HIGHLIGHT_POSITION',
  PAUSE_AND_EXPLAIN = 'PAUSE_AND_EXPLAIN',
  RETRY_AFTER_EXPLANATION = 'RETRY_AFTER_EXPLANATION',
  DEFER_TO_TEACHER = 'DEFER_TO_TEACHER',
  MARK_FOR_REVIEW = 'MARK_FOR_REVIEW',
  START_GUIDED_REPEAT = 'START_GUIDED_REPEAT',
  END_ATTEMPT = 'END_ATTEMPT',
  SESSION_RECAP = 'SESSION_RECAP',
  NO_ACTION = 'NO_ACTION',
}

/**
 * Status Vocabulary (Section 32).
 */
export enum TeacherActionAuthorizationStatus {
  TEACHER_ACTION_AUTHORIZED = 'TEACHER_ACTION_AUTHORIZED',
  TEACHER_ACTION_BLOCKED = 'TEACHER_ACTION_BLOCKED',
  TEACHER_ACTION_DEFERRED = 'TEACHER_ACTION_DEFERRED',
  TEACHER_ACTION_REQUIRES_REPEAT = 'TEACHER_ACTION_REQUIRES_REPEAT',
  TEACHER_ACTION_REQUIRES_CLEAR_AUDIO = 'TEACHER_ACTION_REQUIRES_CLEAR_AUDIO',
  TEACHER_ACTION_REQUIRES_TEACHER = 'TEACHER_ACTION_REQUIRES_TEACHER',
}

/**
 * Recitation and Learning Modes (Section 21).
 */
export enum LearningMode {
  MEMORIZATION = 'MEMORIZATION',       // Focus: sequence, omissions, substitutions, repetitions, word order
  REVISION = 'REVISION',               // Focus: retrieval, continuity, previously observed weak points
  TAJWEED_PRACTICE = 'TAJWEED_PRACTICE', // Focus: verified rule applicability, supported evidence
  FREE_RECITATION = 'FREE_RECITATION',   // Focus: listening, alignment, minimal interruption
}

/**
 * Student-Centered Error Escalation Levels (Section 14).
 */
export enum PedagogicalEscalationLevel {
  LEVEL_0_SILENT_CONTINUE = 0,
  LEVEL_1_SHORT_INDICATION = 1,     // e.g. "جرّب الكلمة دي مرة تانية"
  LEVEL_2_SPECIFIC_LOCATION = 2,    // e.g. "راجع نطق الحرف هنا مرة تانية"
  LEVEL_3_GUIDED_REPEAT = 3,       // Verified reference audio demonstration workflow
  LEVEL_4_PAUSE_AND_EXPLAIN = 4,   // Methodical explanation of articulation
  LEVEL_5_DEFER_TO_TEACHER = 5,    // Defer to certified human Shaykh/Teacher
}

/**
 * Teaching Error Taxonomy (Section 10).
 * Absolute requirement: Never merge these distinct epistemological categories.
 */
export enum TeachingErrorCategory {
  A_IDENTITY_ALIGNMENT_ERROR = 'A_IDENTITY_ALIGNMENT_ERROR',
  B_PHONETIC_ERROR = 'B_PHONETIC_ERROR',
  C_TAJWEED_APPLICABILITY = 'C_TAJWEED_APPLICABILITY',
  D_TAJWEED_EXECUTION_EVIDENCE = 'D_TAJWEED_EXECUTION_EVIDENCE',
  E_UNKNOWN_INSUFFICIENT = 'E_UNKNOWN_INSUFFICIENT',
}

/**
 * Correction Granularity (Section 11).
 * Smallest useful unit priority: PHONEME → LETTER_POSITION → WORD → PHRASE → AYAH.
 */
export enum CorrectionGranularity {
  PHONEME = 'PHONEME',
  LETTER_POSITION = 'LETTER_POSITION',
  WORD = 'WORD',
  PHRASE = 'PHRASE',
  AYAH = 'AYAH',
}

/**
 * Student Learning State (Section 19).
 * Stores evidence-based learning facts; never stores religious rulings.
 */
export interface StudentLearningState {
  readonly currentSurah: number;
  readonly currentAyah: number;
  readonly currentWord: number;
  readonly currentLesson?: string;
  readonly attemptNumber: number;
  readonly memorizationStatus: 'NEW' | 'IN_PROGRESS' | 'MEMORIZED' | 'NEEDS_REVISION';
  readonly revisionStatus: 'STABLE' | 'NEEDS_ATTENTION' | 'DUE';
  readonly attemptCount: number;
  readonly recentAttempts: readonly {
    readonly timestamp: number;
    readonly success: boolean;
    readonly wordIndex: number;
    readonly errorType?: string;
  }[];
  readonly recentErrors: readonly {
    readonly errorType: string;
    readonly token: string;
    readonly wordIndex: number;
    readonly timestamp: number;
  }[];
  readonly recentUncertainEvents: number;
  readonly confirmedPhoneticErrors: number;
  readonly reviewCandidates: readonly string[];
  readonly lastSuccessfulAttempt?: number;
  readonly lastInterruptionTimestamp?: number;
  readonly interruptionCountInCurrentAttempt: number;
  readonly fatigueSignals: {
    readonly consecutiveErrors: number;
    readonly longPausesCount: number;
    readonly sessionDurationMinutes: number;
    readonly isFatigued: boolean;
  };
  readonly preferredCorrectionGranularity: CorrectionGranularity;
}

/**
 * Teacher Interruption Policy Specification (Section 13).
 * Controlled cooldown and debouncing to prevent cognitive harassment.
 */
export interface TeacherInterruptionPolicy {
  readonly label: 'PROVISIONAL_INTERRUPTION_POLICY';
  readonly policyVersion: string;
  readonly minimumIntervalMs: number;          // e.g. 3000ms minimum between interruptions
  readonly maxInterruptionsPerAttempt: number; // e.g. 3 maximum per recitation attempt
  readonly escalationThresholds: {
    readonly level1Attempts: number; // e.g. 1
    readonly level2Attempts: number; // e.g. 2
    readonly level3Attempts: number; // e.g. 3
    readonly level4Attempts: number; // e.g. 4
    readonly level5DeferralAttempts: number; // e.g. 5
  };
  readonly resetConditions: {
    readonly resetOnNewAyah: boolean;
    readonly resetOnCleanAttempt: boolean;
  };
}

export const PROVISIONAL_TEACHER_INTERRUPTION_POLICY: TeacherInterruptionPolicy = {
  label: 'PROVISIONAL_INTERRUPTION_POLICY',
  policyVersion: 'provisional-v1.0.0-phase7a',
  minimumIntervalMs: 3000,
  maxInterruptionsPerAttempt: 3,
  escalationThresholds: {
    level1Attempts: 1,
    level2Attempts: 2,
    level3Attempts: 3,
    level4Attempts: 4,
    level5DeferralAttempts: 5,
  },
  resetConditions: {
    resetOnNewAyah: true,
    resetOnCleanAttempt: true,
  },
};

/**
 * Feedback Content Contract for Future LLM Layer (Section 15).
 * The language layer consumes this contract and CANNOT invent additional claims.
 */
export interface TeacherFeedbackIntent {
  readonly intentType:
    | 'CONTINUATION'
    | 'ENCOURAGEMENT'
    | 'REPEAT_REQUEST'
    | 'AUDIO_CLARIFICATION'
    | 'PHONETIC_CORRECTION'
    | 'LOCATION_HIGHLIGHT'
    | 'EXPLANATION'
    | 'GUIDED_PRACTICE'
    | 'TEACHER_DEFERRAL'
    | 'SESSION_SUMMARY';
  readonly targetQuranLocation: {
    readonly surah: number;
    readonly ayah: number;
    readonly wordIndex: number;
    readonly phonemeIndex?: number;
  };
  readonly targetWordIndex: number;
  readonly targetPhonemeIndex?: number;
  readonly action: PedagogicalAction;
  readonly reasonCode: string;
  readonly evidenceIds: readonly string[];
  readonly verifiedTextSource: {
    readonly uthmaniText: string;
    readonly ayahId: string;
    readonly wordPosition: number;
    readonly hash: string;
  };
  readonly allowedClaims: readonly string[];
  readonly forbiddenClaims: readonly string[];
  readonly pedagogicalPromptArabic: string;
  readonly pedagogicalPromptEnglish: string;
}

/**
 * Immutable Teacher Decision Context (Section 4).
 * Master input envelope to the Teacher Policy Engine.
 */
export interface TeacherDecisionContext {
  readonly sessionId: string;
  readonly studentId: string;
  readonly timestamp: number;
  readonly riwayah: string;
  readonly quranDatasetHash: string;
  readonly tajweedKBHash: string;
  readonly modelVersion: string;
  readonly modelHash: string;
  readonly phonemeVocabularyHash: string;
  readonly alignmentVersion: string;
  readonly decisionVersion: string;
  readonly policyVersion: string;
  readonly learningMode: LearningMode;

  // Authoritative Evidence Sources
  readonly verifiedQuranContext: {
    readonly surah: number;
    readonly ayah: number;
    readonly ayahId: string;
    readonly textUthmani: string;
    readonly words: readonly string[];
    readonly datasetHash: string;
  };
  readonly recitationEvidence: readonly RecitationEvidence[];
  readonly tajweedRuleEvidence: readonly TajweedRuleEvidence[];
  readonly recitationDecision: RecitationDecisionOutput;
  readonly signalQuality: {
    readonly snrDb: number;
    readonly isClipping?: boolean;
    readonly isSilence?: boolean;
    readonly isWhiteNoise?: boolean;
    readonly hasDropouts?: boolean;
    readonly isDegraded?: boolean;
  };

  // Confidence Envelope
  readonly acousticConfidence: number;
  readonly alignmentConfidence: number;
  readonly decisionConfidence: number;

  // Student State
  readonly studentLearningState: StudentLearningState;
}

/**
 * Immutable Audit Trail for Policy Decisions (Section 26).
 */
export interface TeacherPolicyAuditTrail {
  readonly teacherDecisionId: string;
  readonly timestamp: number;
  readonly sessionId: string;
  readonly studentId: string;
  readonly inputDecisionId: string;
  readonly evidenceIds: readonly string[];
  readonly ruleEvidenceIds: readonly string[];
  readonly action: PedagogicalAction;
  readonly actionReason: string;
  readonly policyVersion: string;
  readonly quranDatasetHash: string;
  readonly tajweedKBHash: string;
  readonly modelVersion: string;
  readonly modelHash: string;
  readonly riwayah: string;
  readonly learningMode: LearningMode;
  readonly confidenceSnapshot: {
    readonly acousticConfidence: number;
    readonly alignmentConfidence: number;
    readonly decisionConfidence: number;
  };
  readonly integrityStatus: 'PASSED' | 'INTEGRITY_FAILURE';
  readonly interruptionCount: number;
}

/**
 * Teacher Policy Engine Output Contract.
 */
export interface TeacherPolicyDecisionOutput {
  readonly teacherDecisionId: string;
  readonly action: PedagogicalAction;
  readonly authorizationStatus: TeacherActionAuthorizationStatus;
  readonly escalationLevel: PedagogicalEscalationLevel;
  readonly actionReason: string;
  readonly taxonomyCategory: TeachingErrorCategory;
  readonly correctionGranularity: CorrectionGranularity;
  readonly shouldInterrupt: boolean;
  readonly interruptionReason?: string;
  readonly feedbackIntent: TeacherFeedbackIntent;
  readonly auditTrail: TeacherPolicyAuditTrail;
  readonly isReplayIdentical: boolean;
}

/**
 * Interface for the Teacher Policy Engine.
 */
export interface ITeacherPolicyEngine {
  /**
   * Evaluates an immutable TeacherDecisionContext and deterministically produces
   * an authorized PedagogicalAction and TeacherFeedbackIntent.
   */
  evaluate(context: TeacherDecisionContext): TeacherPolicyDecisionOutput;

  /**
   * Verifies that identical contexts produce bit-for-bit identical outputs (Section 27).
   */
  verifyDeterministicReplay(
    contextA: TeacherDecisionContext,
    contextB: TeacherDecisionContext
  ): { isDeterministic: boolean; differences?: string[] };
}
