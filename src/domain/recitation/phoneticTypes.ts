/**
 * @file phoneticTypes.ts
 * @module domain/recitation
 * @description Phonetic, Madd timing, Ghunnah nasalization, and Articulation abstractions.
 * Rule: Any capability without an experimentally verified acoustic model MUST return
 * NOT_IMPLEMENTED, EXPERIMENTAL, or NOT_AVAILABLE to prevent fraudulent/hallucinated scores.
 */

import { ConfidenceLevel } from '../confidence/types.ts';

export enum AcousticFeatureStatus {
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  EXPERIMENTAL = 'EXPERIMENTAL',
  NOT_AVAILABLE = 'NOT_AVAILABLE',
  BENCHMARKED = 'BENCHMARKED',
}

export type PhonemeObservationStatus =
  | 'MATCHED'
  | 'PARTIAL'
  | 'MISMATCHED'
  | 'UNCERTAIN'
  | 'UNOBSERVABLE';

export interface PhonemeObservation {
  phonemeId: string;
  expectedSymbol: string;
  observedEvidence?: unknown;
  startMs?: number;
  endMs?: number;
  score?: number;
  confidence: ConfidenceLevel;
  status: PhonemeObservationStatus;
}

export interface MaddTimingAnalysis {
  status: AcousticFeatureStatus;
  ruleId: string;
  expectedHarakahCount: number;
  expectedDurationMs: number;
  observedDurationMs: number;
  calculatedHarakahRatio: number;
  isWithinAcceptableTolerance: boolean;
  confidence: number;
  isUncertain: boolean;
  remarksArabic: string;
}

export interface IMaddAnalyzer {
  getStatus(): AcousticFeatureStatus;
  analyzeMaddDuration(
    observedDurationMs: number,
    recitationTempoMsPerHarakah: number,
    expectedHarakahCount: number,
    ruleId: string
  ): MaddTimingAnalysis;
}

export interface GhunnahAnalysis {
  status: AcousticFeatureStatus;
  ruleId: string;
  isNasalEnergyDetected: boolean;
  confidence: number;
  remarksArabic: string;
}

export interface IGhunnahAnalyzer {
  getStatus(): AcousticFeatureStatus;
  analyzeGhunnah(
    audioPcm: Float32Array,
    sampleRateHz: number,
    ruleId: string
  ): GhunnahAnalysis;
}

export interface ArticulationAnalysis {
  status: AcousticFeatureStatus;
  consonantLetterArabic: string;
  makhrajCategoryArabic: string;
  sifatDetected: string[];
  confidence: number;
  remarksArabic: string;
}

export interface IArticulationAnalyzer {
  getStatus(): AcousticFeatureStatus;
  analyzeArticulation(
    audioPcm: Float32Array,
    letterArabic: string
  ): ArticulationAnalysis;
}

export interface IPhoneticAnalyzer {
  getMaddAnalyzer(): IMaddAnalyzer;
  getGhunnahAnalyzer(): IGhunnahAnalyzer;
  getArticulationAnalyzer(): IArticulationAnalyzer;
}
