/**
 * @file quranAlignmentTypes.ts
 * @module domain/recitation
 * @description Domain types and contracts for Phase 5A: Quran-Aware Alignment & Acoustic Evidence Engine.
 * 
 * CORE SCIENTIFIC & RELIGIOUS PRINCIPLE:
 * The acoustic model produces ACOUSTIC / PHONETIC EVIDENCE ONLY.
 * It answers: "What phonetic sequence did the model observe, where did it occur in time,
 * and how does it align with the expected Quranic sequence?"
 * 
 * It does NOT answer: "Is this recitation religiously wrong?"
 * All Fiqh/Tajweed classifications remain downstream.
 */

import { RiwayahType } from '../quran/types.ts';
import { EvidenceErrorType, EvidenceConfidenceStatus, RecitationEvidence } from './RecitationEvidence.ts';

/**
 * Exact frame-level acoustic provenance of an observed CTC token.
 */
export interface ObservedToken {
  token: string;
  tokenId: number;
  confidence: number;      // Calibrated posterior probability (0.0 - 1.0)
  marginPeak: number;      // Margin between top-1 and top-2 softmax probabilities
  startFrame: number;      // Output time-step start frame index
  endFrame: number;        // Output time-step end frame index
  startTime: number;       // In seconds from audio onset
  endTime: number;         // In seconds from audio onset
  sourceChunk: number;     // Streaming chunk index that produced this token
  peakFrame: number;       // Frame index of maximum activation
}

/**
 * A canonical Quranic phonetic token with complete scholarly and dataset provenance.
 */
export interface CanonicalQuranPhoneme {
  riwayah: RiwayahType;
  surah: number;
  ayah: number;
  wordIndex: number;            // 1-based index of word within the Ayah
  phonemeIndex: number;         // 0-based index of phoneme within the full Ayah
  phonemeIndexInWord: number;   // 0-based index of phoneme within its parent word
  canonicalToken: string;       // Verified token symbol (matches tokens.txt 251 vocabulary)
  wordTextUthmani: string;      // Word text in official Uthmani script
  sourceDatasetVersion: string; // e.g. "v1.0.0-hafs.verified"
  datasetHash: string;          // Cryptographic SHA-256 hash of verified Quran text
}

/**
 * Complete canonical expected sequence for an Ayah.
 */
export interface QuranCanonicalSequence {
  ayahId: string;               // e.g. "1:1", "1:2"
  surah: number;
  ayah: number;
  riwayah: RiwayahType;
  datasetVersion: string;
  datasetHash: string;
  textUthmani: string;
  tokens: CanonicalQuranPhoneme[];
}

/**
 * Supported alignment event types.
 * Strictly phonetic: zero religious terminology.
 */
export type AlignmentEventType = 
  | 'MATCH'
  | 'SUBSTITUTION'
  | 'DELETION'
  | 'INSERTION'
  | 'UNCERTAIN';

/**
 * Status of temporal alignment timing.
 */
export type TimingProvenanceStatus = 'VALID' | 'INCONCLUSIVE';

/**
 * A single aligned event linking expected canonical phoneme and observed CTC token.
 */
export interface AlignedEvent {
  eventType: AlignmentEventType;
  expectedToken?: CanonicalQuranPhoneme;
  observedToken?: ObservedToken;
  expectedPhonemeIndex: number;    // -1 for INSERTION
  observedTokenIndex: number;      // -1 for DELETION
  startTime: number;               // Seconds
  endTime: number;                 // Seconds
  timingStatus: TimingProvenanceStatus;
  acousticConfidence: number;      // 0.0 - 1.0
  alignmentConfidence: number;     // 0.0 - 1.0
  evidenceStatus: EvidenceConfidenceStatus;
  isAmbiguous: boolean;
}

/**
 * Candidate alignment hypothesis for multiple-hypothesis tracking.
 */
export interface AlignmentHypothesis {
  id: string;
  cost: number;
  events: AlignedEvent[];
  marginToNext: number;
  isAmbiguous: boolean;
}

/**
 * Streaming evidence type: whether frames are partial or final.
 */
export type StreamEvidenceType = 'PARTIAL_EVIDENCE' | 'FINAL_EVIDENCE';

/**
 * Stability of the emitted evidence.
 */
export type EvidenceStability = 'STABLE' | 'PENDING' | 'TRANSIENT';

/**
 * Recommended downstream pedagogical safety action.
 * Exposes safety status WITHOUT forcing premature learner interruption.
 */
export type RecommendedAction = 
  | 'CONTINUE'
  | 'WAIT_FOR_MORE_AUDIO'
  | 'REQUEST_REPEAT'
  | 'DEFER_TO_RULE_ENGINE';

/**
 * Quran-aware acoustic evidence contract extending RecitationEvidence with deep provenance.
 */
export interface QuranAlignmentEvidence extends RecitationEvidence {
  streamEvidenceType: StreamEvidenceType;
  stability: EvidenceStability;
  recommendedAction: RecommendedAction;
  timingStatus: TimingProvenanceStatus;
  canonicalMetadata: {
    riwayah: RiwayahType;
    sourceDatasetVersion: string;
    datasetHash: string;
    surah: number;
    ayah: number;
    wordTextUthmani: string;
  };
  observedTokenDetails?: {
    startFrame: number;
    endFrame: number;
    sourceChunk: number;
    peakFrame: number;
  };
  isSyntheticAudio?: boolean;
}

/**
 * Aggregated summary of Quran-aware alignment session.
 */
export interface QuranAlignmentSummary {
  ayahId: string;
  surah: number;
  ayah: number;
  riwayah: RiwayahType;
  datasetHash: string;
  streamEvidenceType: StreamEvidenceType;
  totalExpectedTokens: number;
  totalObservedTokens: number;
  correctCount: number;
  substitutionCount: number;
  deletionCount: number;
  insertionCount: number;
  uncertainCount: number;
  inconclusiveCount: number;
  phonemeErrorRate: number;
  meanAcousticConfidence: number;
  meanAlignmentConfidence: number;
  recommendedAction: RecommendedAction;
  evidenceItems: QuranAlignmentEvidence[];
  hypothesesTracked: number;
  scoreMargin: number;
}

/**
 * Provisional safety thresholds configuration with audit provenance metadata.
 */
export interface ProvisionalSafetyConfig {
  minConfidence: number;       // Default: 0.90
  minMarginPeak: number;       // Default: 0.80
  minSnrDb: number;            // Default: 10.0 dB
  minAlignmentConfidence: number; // Default: 0.60
  ambiguityCostMargin: number; // Default: 0.35 (cost difference below which multiple hypotheses are ambiguous)
  classification: string;
  scientificallyValidated: boolean;
  provenance: string;
}

export const PROVISIONAL_SAFETY_CONFIG: ProvisionalSafetyConfig = {
  minConfidence: 0.90,
  minMarginPeak: 0.80,
  minSnrDb: 10.0,
  minAlignmentConfidence: 0.60,
  ambiguityCostMargin: 0.35,
  classification: 'PROVISIONAL_SAFETY_THRESHOLDS',
  scientificallyValidated: false,
  provenance: 'Derived from Phase 4E.1 local regression on 8 golden recordings. Provisional heuristic only - not general population validated.',
};
