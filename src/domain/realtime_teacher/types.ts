/**
 * @file types.ts
 * @module domain/realtime_teacher
 * @description Domain contracts, state machines, timing policies, and events for Phase 7C.
 * 
 * CORE ARCHITECTURAL INVARIANT:
 * Phase 7C orchestrates existing verified layers:
 * Phase 2 (Quran Data) -> Phase 4D/4D.1 (Zipformer CTC/FBank) -> Phase 5A (Alignment)
 * -> Phase 5B (Tajweed KB) -> Phase 5C (Recitation Decision Engine) -> Phase 7A (Teacher Policy)
 * -> Phase 7B (Language Realization) -> Phase 7C (Real-Time Teacher Interaction & Recitation UX).
 * 
 * Under NO circumstances does Phase 7C bypass any authoritative layer or introduce unverified rulings.
 */

import { RiwayahType } from '../quran/types.ts';
import { RecitationDecisionState, WordRecitationDecision, AyahRecitationDecision } from '../recitation/decisionTypes.ts';
import { PedagogicalAction, TeacherFeedbackIntent, PedagogicalEscalationLevel } from '../teacher_policy/types.ts';
import { TeacherLanguageOutput } from '../ai_language/types.ts';

/**
 * Section 3: Deterministic Real-Time Session State Machine States.
 */
export enum RealTimeTeacherSessionState {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  LISTENING = 'LISTENING',
  STUDENT_SPEAKING = 'STUDENT_SPEAKING',
  WAITING_FOR_BOUNDARY = 'WAITING_FOR_BOUNDARY',
  ANALYZING = 'ANALYZING',
  DECIDING = 'DECIDING',
  TEACHER_PREPARING_RESPONSE = 'TEACHER_PREPARING_RESPONSE',
  TEACHER_SPEAKING = 'TEACHER_SPEAKING',
  WAITING_FOR_REPEAT = 'WAITING_FOR_REPEAT',
  CONFIRMING = 'CONFIRMING',
  CONTINUING = 'CONTINUING',
  PAUSED = 'PAUSED',
  RECOVERY = 'RECOVERY',
  ENDED = 'ENDED',
  ERROR_SAFE_STATE = 'ERROR_SAFE_STATE',
}

/**
 * Section 5: Mandatory Audio Separation Categories.
 */
export enum AudioSeparationType {
  STUDENT_AUDIO = 'STUDENT_AUDIO',
  TEACHER_AUDIO = 'TEACHER_AUDIO',
  SYSTEM_AUDIO = 'SYSTEM_AUDIO',
  SILENCE = 'SILENCE',
  NOISE = 'NOISE',
}

/**
 * Section 9: Interruption Controller States.
 */
export enum InterruptionState {
  INTERRUPTION_ALLOWED = 'INTERRUPTION_ALLOWED',
  INTERRUPTION_DELAYED = 'INTERRUPTION_DELAYED',
  INTERRUPTION_BLOCKED = 'INTERRUPTION_BLOCKED',
  INTERRUPTION_CANCELLED = 'INTERRUPTION_CANCELLED',
}

/**
 * Section 23: User Interaction Modes.
 */
export enum UserInteractionMode {
  REAL_TIME_TUTOR = 'REAL_TIME_TUTOR',
  LISTEN_ONLY = 'LISTEN_ONLY',
  GUIDED_REPEAT = 'GUIDED_REPEAT',
  REVIEW_MODE = 'REVIEW_MODE',
  PRACTICE_MODE = 'PRACTICE_MODE',
}

/**
 * Section 27: Verified Progress Event Types.
 * Invariant: INCONCLUSIVE is NEVER a learner failure.
 */
export enum ProgressEventType {
  RECITATION_STARTED = 'RECITATION_STARTED',
  WORD_ATTEMPTED = 'WORD_ATTEMPTED',
  WORD_CONFIRMED = 'WORD_CONFIRMED',
  AYAH_COMPLETED = 'AYAH_COMPLETED',
  RETRY_REQUESTED = 'RETRY_REQUESTED',
  PHONETIC_ERROR_CONFIRMED = 'PHONETIC_ERROR_CONFIRMED',
  REVIEW_REQUIRED = 'REVIEW_REQUIRED',
  SESSION_COMPLETED = 'SESSION_COMPLETED',
}

/**
 * Word Visual State for Mobile-First Quran Display (Section 36).
 */
export enum WordVisualState {
  CURRENT = 'CURRENT',
  COMPLETED = 'COMPLETED',
  TARGET_FOR_REPEAT = 'TARGET_FOR_REPEAT',
  UNCERTAIN = 'UNCERTAIN',
  REVIEW = 'REVIEW',
}

/**
 * Speech Boundary Evidence Contract (Section 7).
 */
export interface SpeechBoundaryEvidence {
  readonly speechStartMs: number;
  readonly speechEndCandidateMs: number;
  readonly speechEndConfirmedMs: number;
  readonly silenceDurationMs: number;
  readonly boundaryConfidence: number; // 0.0 - 1.0
  readonly isConfirmedBoundary: boolean;
  readonly boundaryType: 'INTRA_WORD_PAUSE' | 'BREATH_PAUSE' | 'INTENTIONAL_WAQF' | 'SPEECH_END' | 'DROPOUT';
}

/**
 * Centralized, Versioned Interaction Timing Policy (Section 10).
 */
export interface TeacherInteractionTimingPolicy {
  readonly policyVersion: string;
  readonly minInterruptionIntervalMs: number;
  readonly minAnalysisWindowMs: number;
  readonly speechBoundarySilenceThresholdMs: number;
  readonly intraWordPauseToleranceMs: number;
  readonly breathPauseToleranceMs: number;
  readonly maxLlmLatencyMs: number;
  readonly ttsTimeoutMs: number;
  readonly staleEventThresholdMs: number;
}

export const CANONICAL_TIMING_POLICY: TeacherInteractionTimingPolicy = Object.freeze({
  policyVersion: 'timing-policy-v1.0.0-phase7c',
  minInterruptionIntervalMs: 3000,
  minAnalysisWindowMs: 200,
  speechBoundarySilenceThresholdMs: 450,
  intraWordPauseToleranceMs: 250,
  breathPauseToleranceMs: 700,
  maxLlmLatencyMs: 1500,
  ttsTimeoutMs: 4000,
  staleEventThresholdMs: 5000,
});

/**
 * Standard Real-Time Event Envelope for Stale & Out-of-Order Protection (Section 11, 12).
 */
export interface RealTimeEventEnvelope<T = any> {
  readonly eventId: string;
  readonly sessionId: string;
  readonly sessionSequence: number;
  readonly utteranceId: string;
  readonly eventSequence: number;
  readonly targetQuranLocation: {
    readonly surah: number;
    readonly ayah: number;
    readonly wordIndex: number;
  };
  readonly timestamp: number;
  readonly payload: T;
  readonly isHistorical?: boolean;
}

/**
 * Evidence Lookahead / Stabilization State (Section 16).
 */
export enum EvidenceStabilizationState {
  PROVISIONAL = 'PROVISIONAL',
  STABLE = 'STABLE',
  FINAL = 'FINAL',
}

/**
 * Real-Time Latency Metrics Profile (Section 17, 42).
 */
export interface RealTimeLatencyMetrics {
  captureMs: number;
  vadMs: number;
  fbankMs: number;
  zipformerMs: number;
  alignmentMs: number;
  evidenceMs: number;
  decision5cMs: number;
  policy7aMs: number;
  language7bMs: number;
  ttsMs: number;
  totalFeedbackMs: number;
}

/**
 * Real-Time Session Configuration (Section 40, 41).
 */
export interface RealTimeSessionConfig {
  readonly sessionId: string;
  readonly studentId?: string;
  readonly deviceId?: string;
  readonly startedAt?: number;
  readonly surahNumber: number;
  readonly ayahNumber: number;
  readonly riwayah: RiwayahType;
  readonly mode: UserInteractionMode;
  readonly voiceFeedbackEnabled: boolean;
  readonly textOnlyFeedback: boolean;
  readonly interruptionEnabled: boolean;
  readonly languageDialect: 'ARABIC_STANDARD' | 'EGYPTIAN_ARABIC';
  readonly explanationLevel: 'MINIMAL' | 'EXPLANATION';
  readonly rawAudioPersistence: boolean; // MANDATORY: FALSE by default
  readonly timingPolicy?: TeacherInteractionTimingPolicy;
}

/**
 * Feedback Delivery Item passed to Voice / UI Output.
 */
export interface RealTimeFeedbackDelivery {
  readonly feedbackEventId: string;
  readonly utteranceId: string;
  readonly evidenceHash: string;
  readonly targetWordIndex: number;
  readonly action: PedagogicalAction;
  readonly languageOutput: TeacherLanguageOutput;
  readonly timestamp: number;
  readonly wasVoiceDelivered: boolean;
  readonly wasVoiceFallback: boolean;
  readonly deliveryLatencyMs: number;
}

/**
 * Deterministic Event Journal Record (Section 50).
 */
export interface JournalRecord {
  readonly eventId: string;
  readonly sessionId: string;
  readonly sequence: number;
  readonly timestamp: number;
  readonly type: string;
  readonly source: string;
  readonly target: string;
  readonly payloadHash: string;
  readonly previousEventHash: string;
}

/**
 * Progress Record (Section 27).
 */
export interface VerifiedProgressRecord {
  readonly recordId: string;
  readonly sessionId: string;
  readonly eventType: ProgressEventType;
  readonly surah: number;
  readonly ayah: number;
  readonly wordIndex: number;
  readonly timestamp: number;
  readonly evidenceHash: string;
  readonly decisionState: RecitationDecisionState;
  readonly action?: PedagogicalAction;
}
