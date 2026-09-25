/**
 * @file observationTypes.ts
 * @module domain/recitation
 * @description Strict separation between Audio/Alignment Observation and Religious Error Classification.
 * Mandate: An acoustic observation MUST NEVER directly issue a religious verdict without passing through
 * the dedicated Religious Rule Evaluation Layer.
 */

import { AlignmentResult } from './alignmentTypes.ts';
import { ConfidenceAssessment, ConfidenceLevel } from '../confidence/types.ts';
import { LahnCategory, RecitationErrorType } from '../errors/types.ts';
import { TajweedMatchResult } from '../tajweed/types.ts';

export enum AcousticObservationType {
  EXACT_MATCH = 'EXACT_MATCH',
  DELETION = 'DELETION',                 // Word or letter omitted
  INSERTION = 'INSERTION',               // Extra word or letter spoken
  SUBSTITUTION = 'SUBSTITUTION',         // Word or letter replaced with another
  REPETITION = 'REPETITION',             // Word repeated by reader
  SKIP = 'SKIP',                         // Ayah or multi-word jump
  ORDER_MISMATCH = 'ORDER_MISMATCH',     // Word spoken out of sequence
  UNEXPECTED_PAUSE = 'UNEXPECTED_PAUSE', // Unnatural silence cutting a word or unit
  UNCERTAIN = 'UNCERTAIN',               // Unclear acoustic trace / ambiguous
  UNOBSERVABLE = 'UNOBSERVABLE',         // Corrupted audio / noise floor
}

export interface RecitationObservation {
  id: string;
  type: AcousticObservationType;
  wordId: string;
  ayahNumber: number;
  expectedText: string;
  observedText?: string;
  alignment: AlignmentResult;
  observedStartMs: number;
  observedEndMs: number;
  durationMs: number;
  acousticDeviationScore: number; // 0.0 - 1.0
  notesArabic: string;
}

export enum ReligiousClassificationCategory {
  NO_ERROR = 'NO_ERROR',
  LAHN_JALI = 'LAHN_JALI',                             // Clear error (Altering word, vowel, meaning)
  LAHN_KHAFI = 'LAHN_KHAFI',                           // Subtle error (Ghunnah, Madd length, Sifat)
  POTENTIAL_TEXTUAL_DEVIATION = 'POTENTIAL_TEXTUAL_DEVIATION', // Non-standard recitation / word shift
  PERMISSIBLE_STOP = 'PERMISSIBLE_STOP',               // Halal waqf
  IMPERMISSIBLE_STOP = 'IMPERMISSIBLE_STOP',           // Waqf Qabih (stops changing theology/meaning)
  INCONCLUSIVE_EVIDENCE = 'INCONCLUSIVE_EVIDENCE',     // Insufficient evidence to rule
}

export interface ReligiousErrorClassification {
  id: string;
  observationId: string;
  category: ReligiousClassificationCategory;
  fiqhSeverity: 'CRITICAL_MUST_STOP' | 'EDUCATIONAL_NOTICE' | 'TOLERABLE' | 'DISMISSED';
  ruleViolatedId?: string;
  ruleNameArabic: string;
  descriptionArabic: string;
  pedagogicalTipArabic: string;
  makhrajSifahContextArabic?: string;
  matchedTajweedRule?: TajweedMatchResult;
  isConfirmedByDeterministicEngine: boolean;
  classifiedAt: string;
}

export interface IRecitationErrorDetector {
  detectWordObservations(alignments: AlignmentResult[]): RecitationObservation[];
}

export interface IReligiousErrorClassifier {
  classifyObservation(
    observation: RecitationObservation,
    activeTajweedMatches: TajweedMatchResult[]
  ): ReligiousErrorClassification;
}
