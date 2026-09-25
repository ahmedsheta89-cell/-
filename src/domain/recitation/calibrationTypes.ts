/**
 * @file calibrationTypes.ts
 * @module domain/recitation
 * @description Confidence calibration contracts, versioned thresholds, and multi-source evidence tracking.
 */

import { ConfidenceLevel, ConfidenceAssessment } from '../confidence/types.ts';
import { AudioQualityAssessment } from './audioCaptureTypes.ts';
import { AlignmentResult } from './alignmentTypes.ts';

export interface CalibrationThresholds {
  version: string;
  minSnrDbForHighConfidence: number;      // e.g. 18 dB
  minSnrDbForMediumConfidence: number;    // e.g. 10 dB
  maxClippingRatioAllowed: number;       // e.g. 0.02 (2%)
  highConfidenceScoreThreshold: number;  // e.g. 0.88
  mediumConfidenceScoreThreshold: number;// e.g. 0.65
  maxTemporalDeviationRatio: number;     // e.g. 2.5x
}

export interface DetailedConfidenceEvidence {
  calibrationVersion: string;
  audioQualityScore: number;       // 0.0 - 1.0 based on SNR & clipping
  alignmentScore: number;          // 0.0 - 1.0 from aligner
  acousticModelConfidence: number; // 0.0 - 1.0
  phoneticReliability: number;     // 0.0 - 1.0
  temporalPlausibility: number;    // 0.0 - 1.0
  ambiguityPenalty: number;        // deduction for similar phonetic units
  finalCalibratedScore: number;    // 0.0 - 1.0
  resolvedLevel: ConfidenceLevel;
  evidenceFactorsArabic: string[];
}

export interface IConfidenceCalibrationService {
  getCalibrationVersion(): string;
  getThresholds(): CalibrationThresholds;
  calibrateEvidence(
    quality: AudioQualityAssessment,
    alignment: AlignmentResult,
    isLahnJaliCandidate: boolean
  ): DetailedConfidenceEvidence;
}
