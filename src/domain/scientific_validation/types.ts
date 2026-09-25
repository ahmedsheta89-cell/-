/**
 * @file types.ts
 * @module domain/scientific_validation
 * @description Formal contracts and domain types for Phase 6.1:
 * Independent Acoustic Scientific Validation Subsystem.
 * 
 * CORE CONTRACT:
 * Strictly separates:
 * 1. WHAT THE MICROPHONE MEASURED
 * 2. WHAT THE ACOUSTIC ALGORITHM INFERRED
 * 3. WHAT THE ALIGNMENT ENGINE ESTABLISHED
 * 4. WHAT THE DETERMINISTIC TAJWEED ENGINE KNOWS
 * 5. WHAT A QUALIFIED HUMAN TEACHER/SCHOLAR MAY CONCLUDE
 * 
 * Under NO circumstances may these layers be collapsed.
 */

import {
  AcousticFeatureType,
  AcousticEvidenceStatus,
  SignalQualityLevel,
} from '../recitation/acousticFeatureTypes.ts';

/**
 * Phase 6.1 Status Vocabulary (Section 33).
 */
export enum ScientificValidationStatus {
  SUPPORTED = 'SUPPORTED',
  PARTIALLY_SUPPORTED = 'PARTIALLY_SUPPORTED',
  INCONCLUSIVE = 'INCONCLUSIVE',
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA',
  INSUFFICIENT_SIGNAL = 'INSUFFICIENT_SIGNAL',
  EXPERIMENTAL = 'EXPERIMENTAL',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  BLOCKED_NO_DATA = 'BLOCKED_NO_DATA',
}

/**
 * Final Phase 6.1 Validation Gates (Section 34).
 */
export enum Phase61FinalGate {
  GATE_A = 'A — INDEPENDENT SCIENTIFIC VALIDATION SUPPORTED',
  GATE_B = 'B — ENGINEERING VALIDATED / SCIENTIFIC EVIDENCE INSUFFICIENT',
  GATE_C = 'C — SAFETY / VALIDATION FAILURE',
  GATE_D = 'D — IMPLEMENTATION FAILURE',
}

/**
 * Provenance Status for Datasets and Recordings.
 */
export enum ProvenanceStatus {
  VERIFIED_HUMAN_RECORDING = 'VERIFIED_HUMAN_RECORDING',
  SYNTHETIC_EVALUATION_ONLY = 'SYNTHETIC_EVALUATION_ONLY',
  UNVERIFIED = 'UNVERIFIED',
  PROVENANCE_BLOCKED = 'PROVENANCE_BLOCKED',
}

/**
 * License Audit Status (Section 6).
 */
export enum LicenseAuditStatus {
  PERMITTED_LOCAL_RESEARCH = 'PERMITTED_LOCAL_RESEARCH',
  RESTRICTED_NON_COMMERCIAL = 'RESTRICTED_NON_COMMERCIAL',
  LICENSE_UNVERIFIED = 'LICENSE_UNVERIFIED',
  PROHIBITED = 'PROHIBITED',
}

/**
 * Split Classifications (Section 8).
 */
export enum SplitType {
  SPLIT_A_SPEAKER_INDEPENDENT = 'SPLIT_A_SPEAKER_INDEPENDENT',
  SPLIT_B_DEVICE_INDEPENDENT = 'SPLIT_B_DEVICE_INDEPENDENT',
  SPLIT_C_CONDITION_INDEPENDENT = 'SPLIT_C_CONDITION_INDEPENDENT',
  SPLIT_D_SPEED_ROBUSTNESS = 'SPLIT_D_SPEED_ROBUSTNESS',
  SPLIT_E_NOISE_ROBUSTNESS = 'SPLIT_E_NOISE_ROBUSTNESS',
  SPLIT_F_UNSEEN_RECITER = 'SPLIT_F_UNSEEN_RECITER',
}

/**
 * Formal Recording Manifest Entry (Section 5).
 */
export interface RecordingManifestEntry {
  readonly recordingId: string;
  readonly audioHash: string; // SHA-256
  readonly source: string;
  readonly sourceUrl: string;
  readonly license: string;
  readonly licenseVersion: string;
  readonly reciterId: string;
  readonly reciterMetadata: {
    readonly name: string;
    readonly style: string;
    readonly gender: string;
    readonly approximateF0Range?: { readonly minHz: number; readonly maxHz: number };
    readonly nationalityOrSchool?: string;
  };
  readonly surah: number;
  readonly ayah: number;
  readonly wordIndex?: number;
  readonly phonemeReference: readonly string[];
  readonly recordingDevice: string;
  readonly sampleRate: number;
  readonly channels: number;
  readonly environment: string;
  readonly estimatedSNR: number;
  readonly recordingDate: string;
  readonly annotationStatus: 'ANNOTATED_EXPERT' | 'AUTOMATIC_DETERMINISTIC' | 'SYNTHETIC' | 'UNANNOTATED';
  readonly annotationSource: string;
  readonly split: 'TRAIN' | 'CALIBRATION' | 'FINAL_TEST' | 'BENCHMARK_HELD_OUT';
  readonly provenanceStatus: ProvenanceStatus;
}

/**
 * Data Leakage Audit Result (Section 7).
 */
export interface LeakageReport {
  readonly reciterLeakageDetected: boolean;
  readonly reciterLeakageDetails: readonly string[];
  readonly recordingLeakageDetected: boolean;
  readonly recordingLeakageDetails: readonly string[];
  readonly segmentLeakageDetected: boolean;
  readonly segmentLeakageDetails: readonly string[];
  readonly audioHashLeakageDetected: boolean;
  readonly audioHashLeakageDetails: readonly string[];
  readonly overallLeakageClean: boolean;
  readonly auditTimestamp: string;
}

/**
 * Feature Scientific Evaluation Metric (Section 10-18).
 */
export interface FeatureValidationMetric {
  readonly featureType: AcousticFeatureType;
  readonly status: ScientificValidationStatus;
  readonly sampleCountN: number;
  readonly populationDescription: string;
  readonly splitEvaluated: string;
  readonly primaryMetricName: string;
  readonly primaryMetricValue: number | null;
  readonly confidenceInterval95: { readonly lower: number; readonly upper: number } | null;
  readonly rootMeanSquareError?: number | null;
  readonly meanAbsoluteError?: number | null;
  readonly correlationR?: number | null;
  readonly precision?: number | null;
  readonly recall?: number | null;
  readonly f1Score?: number | null;
  readonly truePositives?: number;
  readonly trueNegatives?: number;
  readonly falsePositives?: number;
  readonly falseNegatives?: number;
  readonly knownFailureModes: readonly string[];
  readonly generalizationAssessment: string;
}

/**
 * Comprehensive Calibration Evaluation Result (Section 16).
 */
export interface CalibrationEvaluationResult {
  readonly status: 'CALIBRATED' | 'CALIBRATION_INSUFFICIENT_DATA';
  readonly expectedCalibrationError: number | null;
  readonly maximumCalibrationError: number | null;
  readonly brierScore: number | null;
  readonly sampleCount: number;
  readonly calibrationDatasetProvenance: string;
  readonly heldOutDatasetProvenance: string;
  readonly isCalibrationHeldOutSeparate: boolean;
  readonly notes: string;
}

/**
 * Negative Control Test Outcome (Section 21).
 */
export interface NegativeControlEvaluation {
  readonly controlType: string;
  readonly description: string;
  readonly sampleRate: number;
  readonly durationSeconds: number;
  readonly observedConfidence: number;
  readonly resultingStatus: AcousticEvidenceStatus;
  readonly safelyRejectedWithoutFalseVerdict: boolean;
  readonly notes: string;
}

/**
 * Speaker Normalization Evaluation (Section 24).
 */
export interface SpeakerNormalizationEvaluation {
  readonly featureType: AcousticFeatureType;
  readonly varianceRaw: number;
  readonly varianceNormalized: number;
  readonly varianceReductionRatio: number;
  readonly isNormalizationEffective: boolean;
}

/**
 * Phase 6.1 Scientific Validation Master Report (Section 36).
 */
export interface Phase61ValidationMasterReport {
  readonly evaluationId: string;
  readonly timestamp: string;
  readonly codeVersion: string;
  readonly modelVersion: string;
  readonly modelHash: string;
  readonly phonemeVocabularyHash: string;
  readonly quranDatasetHash: string;
  readonly tajweedKBHash: string;
  readonly featureAlgorithmVersion: string;
  readonly thresholdVersion: string;

  readonly executiveStatus: {
    readonly phase: string;
    readonly finalGate: Phase61FinalGate;
    readonly scientificStatus: 'A' | 'B' | 'C' | 'D';
    readonly religiousStatus: 'A' | 'B' | 'C' | 'D';
    readonly reason: string;
  };

  readonly datasetSummary: {
    readonly totalRecordings: number;
    readonly totalReciters: number;
    readonly totalDevices: number;
    readonly totalAyahs: number;
    readonly totalPhonemeObservations: number;
    readonly licenseStatus: LicenseAuditStatus;
    readonly provenanceStatus: ProvenanceStatus;
  };

  readonly splitSummary: {
    readonly speakerIndependentStatus: string;
    readonly deviceIndependentStatus: string;
    readonly conditionIndependentStatus: string;
    readonly unseenReciterStatus: string;
  };

  readonly featureResults: readonly FeatureValidationMetric[];
  readonly calibration: CalibrationEvaluationResult;
  readonly leakage: LeakageReport;
  readonly negativeControls: readonly NegativeControlEvaluation[];
  readonly speakerNormalization: readonly SpeakerNormalizationEvaluation[];

  readonly safetyCertifications: {
    readonly noFabricatedData: boolean;
    readonly noFabricatedMetrics: boolean;
    readonly noRawAudioInLogs: boolean;
    readonly noLlmReligiousDecisions: boolean;
    readonly noNewTajweedRules: boolean;
    readonly noUnsupportedScholarlyClaims: boolean;
    readonly lowConfidenceRemainsInconclusive: boolean;
  };

  readonly regressionStatus: {
    readonly phase5A: 'PASS' | 'FAIL';
    readonly phase5B: 'PASS' | 'FAIL';
    readonly phase5C: 'PASS' | 'FAIL';
    readonly phase6: 'PASS' | 'FAIL';
    readonly phase61: 'PASS' | 'FAIL';
    readonly typescript: 'PASS' | 'FAIL';
    readonly build: 'PASS' | 'FAIL';
  };
}
