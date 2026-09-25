/**
 * @file types.ts
 * @module domain/ai_language
 * @description Domain contracts, data structures, and invariants for Phase 7B AI Language & Conversation Layer.
 * 
 * CORE CONTRACTUAL INVARIANT:
 * The AI Language Layer is a language-realization component only.
 * It does NOT establish Quranic text, recitation correctness, Tajweed rulings,
 * scientific conclusions, or religious judgments.
 * All teaching actions originate from the verified evidence and deterministic Teacher Policy Engine.
 */

import {
  PedagogicalAction,
  TeacherFeedbackIntent,
  LearningMode,
  TeacherActionAuthorizationStatus,
  PedagogicalEscalationLevel,
  TeachingErrorCategory,
  CorrectionGranularity,
} from '../teacher_policy/types.ts';

/**
 * Supported Arabic dialect modes for pedagogical realization.
 */
export type ArabicDialect = 'ARABIC_STANDARD' | 'EGYPTIAN_ARABIC';

/**
 * Supported interaction granularity/modes for language output.
 */
export type LanguageMode = 'MINIMAL' | 'EXPLANATION' | 'CONVERSATIONAL';

/**
 * Text match result when validating Quranic citations against verified datasets.
 */
export type LanguageTextMatchStatus = 
  | 'EXACT_MATCH'
  | 'DISPLAY_NORMALIZATION_MATCH'
  | 'MISMATCH';

/**
 * Failure codes emitted during language realization and validation.
 */
export type LanguageFailureCode =
  | 'LLM_ACTION_TAMPERING'
  | 'QURAN_TEXT_INTEGRITY_FAILURE'
  | 'FORBIDDEN_RELIGIOUS_CLAIM'
  | 'UNAUTHORIZED_CLAIM_DETECTED'
  | 'STALE_TEACHER_RESPONSE'
  | 'DUPLICATE_TEACHER_RESPONSE'
  | 'PROMPT_INJECTION_DETECTED'
  | 'AI_PROVIDER_FAILURE'
  | 'LLM_SCHEMA_FAILURE'
  | 'DEFER_TO_QUALIFIED_SCHOLAR'
  | 'DEFER_TO_VERIFIED_KNOWLEDGE'
  | 'KNOWLEDGE_SOURCE_UNAVAILABLE';

/**
 * Minimum student learning context summary passed to the language layer.
 * PRIVACY GUARANTEE: Does NOT contain student PII, credentials, or raw audio.
 */
export interface StudentLearningContextSummary {
  readonly attemptNumber: number;
  readonly learningMode: LearningMode;
  readonly preferredGranularity: CorrectionGranularity;
  readonly recentInteractionSummary?: string;
  readonly isFatigued?: boolean;
}

/**
 * Controlled, immutable input contract passed into the AI Language Layer.
 * The AI model receives ONLY this controlled contract.
 */
export interface TeacherLanguageContext {
  readonly sessionId: string;
  readonly timestamp: number;
  readonly language: string; // e.g., 'ar'
  readonly dialect: ArabicDialect;
  readonly languageMode: LanguageMode;
  readonly learningMode: LearningMode;

  // Authoritative Teacher Policy Outputs
  readonly teacherFeedbackIntent: TeacherFeedbackIntent;
  readonly action: PedagogicalAction;
  readonly authorizationStatus: TeacherActionAuthorizationStatus;
  readonly escalationLevel: PedagogicalEscalationLevel;
  readonly reasonCode: string;

  // Quran Reference & Scripture Context
  readonly targetQuranLocation: string; // e.g. "1:1:1"
  readonly targetWordIndex?: number;
  readonly targetPhonemeIndex?: number;
  readonly verifiedQuranReference: string; // e.g. "سورة الفاتحة - آية 1"
  readonly verifiedQuranText: string; // Canonical Uthmani word/ayah text

  // Epistemic Claims Boundaries
  readonly allowedClaims: readonly string[];
  readonly forbiddenClaims: readonly string[];

  // Student State
  readonly studentLearningContext: StudentLearningContextSummary;
  readonly attemptNumber: number;

  // Provenance & Version Hashes
  readonly policyVersion: string;
  readonly quranDatasetHash: string;
  readonly tajweedKBHash: string;
  readonly modelVersion: string;

  // Latency & Sequence Tracking
  readonly sessionSequence: number;
  readonly eventSequence: number;
  readonly intentSnapshotHash: string;
}

/**
 * Provider metadata for logging and forensics.
 */
export interface LanguageProviderInfo {
  readonly providerName: string;
  readonly modelName: string;
  readonly apiVersion?: string;
  readonly latencyMs: number;
  readonly temperature: number;
  readonly promptPolicyVersion: string;
}

/**
 * Full forensic audit trail for language requests.
 */
export interface LanguageAuditTrail {
  readonly languageRequestId: string;
  readonly teacherDecisionId: string;
  readonly timestamp: number;
  readonly policyVersion: string;
  readonly provider: string;
  readonly modelVersion: string;
  readonly promptPolicyVersion: string;
  readonly responseValidationStatus: 'PASSED' | 'FAILED' | 'FALLBACK_APPLIED';
  readonly responseHash: string;
  readonly latencyMs: number;
  readonly sessionSequence: number;
  readonly eventSequence: number;
  readonly isFallback: boolean;
  readonly failureReason?: LanguageFailureCode | string;
  readonly violations: readonly string[];
}

/**
 * Structured output envelope produced by the AI Language Layer.
 * The LLM MUST NOT return free-form text directly; it must conform to this schema.
 */
export interface TeacherLanguageOutput {
  readonly message: string;
  readonly language: string;
  readonly tone: string;
  readonly action: PedagogicalAction;
  readonly targetReference: string;
  readonly usedQuranText?: string;
  readonly claims: readonly string[];
  readonly warnings: readonly string[];
  readonly providerInfo: LanguageProviderInfo;
  readonly auditTrail: LanguageAuditTrail;
  readonly isFallback: boolean;
  readonly fallbackReason?: LanguageFailureCode | string;
}

/**
 * Result of validating a candidate language output against the context snapshot.
 */
export interface LanguageValidationResult {
  readonly isValid: boolean;
  readonly failureCode?: LanguageFailureCode;
  readonly violations: readonly string[];
  readonly sanitizedOutput: TeacherLanguageOutput;
  readonly wasFallbackTriggered: boolean;
}

/**
 * Conversational question query from learner.
 */
export interface ConversationalQueryContext {
  readonly userQuestionText: string;
  readonly currentLanguageContext: TeacherLanguageContext;
  readonly previousDecisionOutput?: TeacherLanguageOutput;
}

/**
 * Conversational response for learner query.
 */
export interface ConversationalQueryOutput {
  readonly responseArabic: string;
  readonly responseEnglish?: string;
  readonly queryCategory: 'PEDAGOGICAL_EXPLANATION' | 'RELIGIOUS_FIQH_QUERY' | 'QURAN_CONTENT_QUERY' | 'UNKNOWN';
  readonly isScholarDeferral: boolean;
  readonly auditTrail: LanguageAuditTrail;
}
