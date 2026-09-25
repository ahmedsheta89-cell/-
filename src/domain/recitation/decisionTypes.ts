/**
 * @file decisionTypes.ts
 * @module domain/recitation
 * @description Conservative, auditable recitation error decision layer domain contracts.
 * 
 * CORE ARCHITECTURAL INVARIANT:
 * This layer converts acoustic RecitationEvidence and deterministic TajweedRuleEvidence
 * into a safe, auditable decision.
 * 
 * It does NOT inspect raw Quran text independently, generate Quran text, invent Tajweed
 * rules, call an LLM, alter incoming evidence, or override uncertainty.
 */

import { RecitationEvidence, EvidenceConfidenceStatus } from './RecitationEvidence.ts';
import { TajweedRuleEvidence, TajweedDecisionStatus } from '../tajweed/types.ts';

/**
 * Strict Decision States (Section 4).
 * Internal decision states representing the evidence-based judgment.
 */
export enum RecitationDecisionState {
  MATCH = 'MATCH',
  POSSIBLE_ERROR = 'POSSIBLE_ERROR',
  CONFIRMED_PHONETIC_ERROR = 'CONFIRMED_PHONETIC_ERROR',
  TAJWEED_EVIDENCE_PENDING = 'TAJWEED_EVIDENCE_PENDING',
  INCONCLUSIVE = 'INCONCLUSIVE',
  REQUEST_REPEAT = 'REQUEST_REPEAT',
  CONTINUE = 'CONTINUE',
  INTERRUPT_RECOMMENDED = 'INTERRUPT_RECOMMENDED',
  DEFER_TO_TEACHER = 'DEFER_TO_TEACHER',
}

/**
 * Evidence Classification Categories (Section 6).
 */
export enum EvidenceCategory {
  IDENTITY_EVIDENCE = 'IDENTITY_EVIDENCE',
  ALIGNMENT_EVIDENCE = 'ALIGNMENT_EVIDENCE',
  ACOUSTIC_EVIDENCE = 'ACOUSTIC_EVIDENCE',
  RULE_EVIDENCE = 'RULE_EVIDENCE',
  SIGNAL_EVIDENCE = 'SIGNAL_EVIDENCE',
}

/**
 * Supported Phonetic Decision Error Types (Section 11).
 */
export enum PhoneticDecisionErrorType {
  SUBSTITUTION = 'SUBSTITUTION',
  DELETION = 'DELETION',
  INSERTION = 'INSERTION',
  REPETITION = 'REPETITION',
  ORDER_ERROR = 'ORDER_ERROR',
  WORD_OMISSION = 'WORD_OMISSION',
  WORD_ADDITION = 'WORD_ADDITION',
  UNEXPECTED_PAUSE = 'UNEXPECTED_PAUSE',
  EXCESSIVE_PAUSE = 'EXCESSIVE_PAUSE',
  UNRESOLVED = 'UNRESOLVED',
}

/**
 * Error Escalation Levels (Section 17).
 */
export enum EscalationLevel {
  LEVEL_0_MATCH = 'LEVEL_0_MATCH',
  LEVEL_1_UNCERTAIN = 'LEVEL_1_UNCERTAIN',
  LEVEL_2_REQUEST_REPEAT = 'LEVEL_2_REQUEST_REPEAT',
  LEVEL_3_CONFIRMED_PHONETIC_ERROR = 'LEVEL_3_CONFIRMED_PHONETIC_ERROR',
  LEVEL_4_TAJWEED_EVIDENCE_PENDING = 'LEVEL_4_TAJWEED_EVIDENCE_PENDING',
}

/**
 * Alignment Stability States for Cascading Error Protection (Section 20).
 */
export enum AlignmentStabilityState {
  STABLE = 'STABLE',
  UNSTABLE = 'UNSTABLE',
  PENDING_REALIGNMENT = 'PENDING_REALIGNMENT',
  RECOVERING = 'RECOVERING',
  COLLAPSED = 'COLLAPSED',
}

/**
 * Provisional Safety Thresholds (Section 9).
 * Explicitly labeled as PROVISIONAL_SAFETY_THRESHOLD until validated
 * on real-world diverse learner populations.
 */
export interface DecisionSafetyThresholds {
  readonly label: 'PROVISIONAL_SAFETY_THRESHOLD';
  readonly minConfidence: number;        // e.g. 0.90
  readonly minMarginPeak: number;        // e.g. 0.80
  readonly minSnrDb: number;             // e.g. 10.0 dB
  readonly minAlignmentConfidence: number;// e.g. 0.80
  readonly maxAmbiguityCostMargin: number;// e.g. 0.35
  readonly thresholdVersion: string;
}

export const PROVISIONAL_DECISION_SAFETY_THRESHOLDS: DecisionSafetyThresholds = {
  label: 'PROVISIONAL_SAFETY_THRESHOLD',
  minConfidence: 0.90,
  minMarginPeak: 0.80,
  minSnrDb: 10.0,
  minAlignmentConfidence: 0.80,
  maxAmbiguityCostMargin: 0.35,
  thresholdVersion: 'provisional-v1.0.0-phase5c',
};

/**
 * Decision Input Contract (Section 7).
 */
export interface RecitationDecisionInput {
  readonly recitationEvidence: readonly RecitationEvidence[];
  readonly tajweedRuleEvidence: readonly TajweedRuleEvidence[];
  readonly signalQuality: {
    readonly snrDb: number;
    readonly isClipping?: boolean;
    readonly isSilence?: boolean;
    readonly isWhiteNoise?: boolean;
  };
  readonly acousticConfidence: number;
  readonly alignmentConfidence: number;
  readonly ambiguityState: {
    readonly isAmbiguous: boolean;
    readonly ambiguityReason?: string;
    readonly costMargin?: number;
  };
  readonly modelVersion: string;
  readonly modelHash: string;
  readonly quranDatasetHash: string;
  readonly tajweedKBHash: string;
  readonly riwayah: string;
  readonly evidenceTimestamp: string;
  readonly phonemeVocabularyHash?: string;
  readonly alignmentVersion?: string;

  // Optional contextual bindings
  readonly ayahId?: string;
  readonly chunkIndex?: number;
  readonly isStreamingContinuation?: boolean;
}

/**
 * Structured Phonetic Error Detail retaining complete temporal and provenance bounds (Section 11).
 */
export interface PhoneticErrorDetail {
  readonly errorType: PhoneticDecisionErrorType;
  readonly expectedToken: string;
  readonly observedToken: string;
  readonly expectedLocation: {
    readonly ayahId: string;
    readonly wordIndex: number;
    readonly phonemeIndex: number;
  };
  readonly observedLocation: {
    readonly startTime: number;
    readonly endTime: number;
  };
  readonly startTime: number;
  readonly endTime: number;
  readonly confidence: number;
  readonly alignmentConfidence: number;
  readonly evidenceStatus: EvidenceConfidenceStatus;
  readonly sourceChunk?: number;
  readonly isCascadingSuppressed?: boolean;
  readonly repetitionCount?: number;
}

/**
 * Interruption Recommendation Contract (Section 19).
 */
export interface InterruptionRecommendation {
  readonly shouldInterrupt: boolean;
  readonly reason: string;
  readonly severity: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  readonly confidence: number;
  readonly evidenceId?: string;
  readonly recommendedAction: 'PROCEED' | 'DEFER' | 'REQUEST_REPEAT' | 'INTERRUPT_IMMEDIATELY';
}

/**
 * Word-Level Aggregation Decision (Section 21).
 */
export interface WordRecitationDecision {
  readonly wordIndex: number;
  readonly wordTextUthmani?: string;
  readonly status: RecitationDecisionState;
  readonly phonemeDecisions: readonly PhoneticErrorDetail[];
  readonly alignmentStability: AlignmentStabilityState;
  readonly hasAlignmentInstability: boolean;
  readonly confidence: number;
}

/**
 * Ayah-Level Aggregation Decision (Section 22).
 */
export interface AyahRecitationDecision {
  readonly ayahId: string;
  readonly overallStatus: RecitationDecisionState;
  readonly wordDecisions: readonly WordRecitationDecision[];
  readonly errorCount: number;
  readonly uncertainCount: number;
  readonly confirmedCount: number;
  readonly tajweedPendingCount: number;
  readonly alignmentQuality: 'EXCELLENT' | 'GOOD' | 'UNSTABLE' | 'DEGRADED';
  readonly signalQuality: 'EXCELLENT' | 'ACCEPTABLE' | 'DEGRADED' | 'UNUSABLE';
  readonly canContinue: boolean;
  readonly shouldRepeat: boolean;
  readonly auditTrail: DecisionAuditTrail;
}

/**
 * Learner-Facing Feedback Model (Section 23).
 * Clean, respectful, non-condemning language free of internal technical or religious jargon.
 */
export interface LearnerRecitationFeedback {
  readonly feedbackId: string;
  readonly decisionState: RecitationDecisionState;
  readonly messageArabic: string;
  readonly messageEnglish: string;
  readonly pedagogicalActionArabic: string;
  readonly verifiedWordContext?: string;
  readonly verifiedAyahContext?: string;
  readonly isTajweedPending: boolean;
  readonly repeatRequested: boolean;
}

/**
 * Immutable Decision Audit Trail (Section 25).
 */
export interface DecisionAuditTrail {
  readonly decisionId: string;
  readonly evidenceIds: readonly string[];
  readonly ruleEvidenceIds: readonly string[];
  readonly modelVersion: string;
  readonly modelHash: string;
  readonly quranHash: string;
  readonly tajweedHash: string;
  readonly riwayah: string;
  readonly thresholdVersion: string;
  readonly decisionTimestamp: string;
  readonly decisionReason: string;
  readonly finalStatus: RecitationDecisionState;
  readonly integrityStatus: 'PASSED' | 'INTEGRITY_FAILURE';
}

/**
 * Comprehensive Recitation Decision Output produced by the engine.
 */
export interface RecitationDecisionOutput {
  readonly decisionId: string;
  readonly finalStatus: RecitationDecisionState;
  readonly escalationLevel: EscalationLevel;
  readonly confirmedErrors: readonly PhoneticErrorDetail[];
  readonly candidateErrors: readonly PhoneticErrorDetail[];
  readonly tajweedPendingRules: readonly TajweedRuleEvidence[];
  readonly alignmentStability: AlignmentStabilityState;
  readonly interruption: InterruptionRecommendation;
  readonly learnerFeedback: LearnerRecitationFeedback;
  readonly auditTrail: DecisionAuditTrail;
  readonly canContinue: boolean;
  readonly shouldRepeat: boolean;
}

/**
 * Interface for the Recitation Error Decision Engine (Section 3).
 */
export interface IRecitationErrorDecisionEngine {
  /**
   * Evaluates structured input evidence and produces an immutable, conservative decision.
   */
  evaluate(input: RecitationDecisionInput): RecitationDecisionOutput;

  /**
   * Aggregates decisions across an entire Ayah context.
   */
  evaluateAyah(input: RecitationDecisionInput): AyahRecitationDecision;

  /**
   * Computes conservative interruption recommendations.
   */
  recommendInterruption(input: RecitationDecisionInput, currentOutput: RecitationDecisionOutput): InterruptionRecommendation;

  /**
   * Generates student-safe Arabic and English feedback from a verified decision output.
   */
  generateLearnerFeedback(output: RecitationDecisionOutput, verifiedAyahText?: string): LearnerRecitationFeedback;
}
