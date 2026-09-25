/**
 * @file acousticFeatureTypes.ts
 * @module domain/recitation
 * @description Phase 6 Advanced Acoustic / Phonetic Feature Evidence Contracts.
 * 
 * CORE ARCHITECTURAL INVARIANT:
 * AcousticFeatureEvidence characterizes physical speech acoustics (duration, spectral tilt,
 * formant proxies, transient energy) WITHOUT turning acoustic measurements into unsupported
 * religious judgments.
 * 
 * Under NO circumstances may an acoustic feature extractor produce a status of TAJWEED_ERROR.
 */

/**
 * Allowed acoustic feature types (Section 6).
 */
export enum AcousticFeatureType {
  MADD_DURATION = 'MADD_DURATION',
  GHUNNAH_RESONANCE = 'GHUNNAH_RESONANCE',
  ARTICULATION = 'ARTICULATION',
  TAFKHEEM = 'TAFKHEEM',
  TARQEEQ = 'TARQEEQ',
  QALQALAH_TRANSIENT = 'QALQALAH_TRANSIENT',
  TEMPORAL_PROSODY = 'TEMPORAL_PROSODY',
  PHONEME_ACOUSTIC_PROFILE = 'PHONEME_ACOUSTIC_PROFILE',
  SIGNAL_QUALITY = 'SIGNAL_QUALITY',
}

/**
 * Allowed evidence statuses (Section 6).
 * Explicitly excludes any religious condemnation or automated Tajweed verdict.
 */
export enum AcousticEvidenceStatus {
  SUPPORTED = 'SUPPORTED',
  PARTIALLY_SUPPORTED = 'PARTIALLY_SUPPORTED',
  INCONCLUSIVE = 'INCONCLUSIVE',
  INSUFFICIENT_SIGNAL = 'INSUFFICIENT_SIGNAL',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  EXPERIMENTAL = 'EXPERIMENTAL',
}

/**
 * Signal Quality Classification (Section 19).
 */
export enum SignalQualityLevel {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  DEGRADED = 'DEGRADED',
}

/**
 * Comprehensive physical signal quality metrics.
 */
export interface SignalQualityMetrics {
  readonly rms: number;
  readonly peak: number;
  readonly isClipping: boolean;
  readonly snrDb: number;
  readonly silenceRatio: number;
  readonly speechRatio: number;
  readonly stationaryNoiseRatio: number;
  readonly hasDropout: boolean;
  readonly overallQuality: SignalQualityLevel;
}

/**
 * Threshold Governance Classifications (Section 37).
 */
export enum ThresholdClassification {
  ENGINEERING_DEFAULT = 'ENGINEERING_DEFAULT',
  EMPIRICAL = 'EMPIRICAL',
  CALIBRATED = 'CALIBRATED',
  LITERATURE_DERIVED = 'LITERATURE_DERIVED',
  SCHOLARLY_REVIEWED = 'SCHOLARLY_REVIEWED',
}

/**
 * Auditable Threshold Governance Record.
 */
export interface ThresholdGovernanceRecord {
  readonly thresholdId: string;
  readonly value: number;
  readonly unit: string;
  readonly feature: AcousticFeatureType;
  readonly source: string;
  readonly version: string;
  readonly rationale: string;
  readonly calibrationStatus: ThresholdClassification;
  readonly validationDataset: string;
}

/**
 * Speaker Session Baseline State (Section 18).
 */
export enum SpeakerBaselineState {
  NO_BASELINE = 'NO_BASELINE',
  INSUFFICIENT_BASELINE = 'INSUFFICIENT_BASELINE',
  VALID_BASELINE = 'VALID_BASELINE',
}

export interface SpeakerSessionBaseline {
  readonly baselineState: SpeakerBaselineState;
  readonly sampleCount: number;
  readonly meanMoraSeconds: number;
  readonly meanSpeechRatePhonemesPerSecond: number;
  readonly pitchMedianHz?: number;
  readonly f2VowelBaselineHz?: number;
}

/**
 * Formal Immutable Acoustic Feature Evidence (Section 6).
 */
export interface AcousticFeatureEvidence {
  readonly evidenceId: string;
  readonly ayahId: string;
  readonly wordIndex: number;
  readonly phonemeIndex: number;

  readonly featureType: AcousticFeatureType;

  readonly expectedContext: {
    readonly canonicalPhoneme: string;
    readonly ruleId?: string;
    readonly expectedMora?: number;
    readonly phoneticClass?: string;
  };

  readonly observedMeasurement: {
    readonly durationSeconds?: number;
    readonly normalizedRatio?: number;
    readonly spectralCentroidHz?: number;
    readonly lowHighEnergyRatio?: number;
    readonly burstEnergyRiseDb?: number;
    readonly burstDurationMs?: number;
    readonly f2FormantProxyHz?: number;
    readonly speechRatePhonemesPerSecond?: number;
    readonly rawDetails?: Record<string, number | string | boolean>;
  };

  readonly normalizedValue: number | null;
  readonly referenceRange: {
    readonly min: number;
    readonly max: number;
    readonly unit: string;
  };

  readonly confidence: number;
  readonly quality: SignalQualityLevel;

  readonly startTime: number;
  readonly endTime: number;

  readonly signalQuality: SignalQualityMetrics;

  readonly modelVersion: string;
  readonly modelHash: string;

  readonly featureAlgorithmVersion: string;
  readonly sourceEvidenceIds: readonly string[];

  readonly evidenceStatus: AcousticEvidenceStatus;
  readonly limitation: string; // e.g. ERR-ACOUSTIC-001
  readonly timestamp: string;
}

/**
 * Feature Extraction Request Input.
 */
export interface AcousticFeatureExtractionInput {
  readonly pcmAudio: Float32Array;
  readonly sampleRate: number;
  readonly ayahId: string;
  readonly wordIndex: number;
  readonly phonemeIndex: number;
  readonly expectedPhoneme: string;
  readonly ruleId?: string;
  readonly startTime: number;
  readonly endTime: number;
  readonly alignmentConfidence: number;
  readonly isAlignmentStable: boolean;
  readonly signalQuality: SignalQualityMetrics;
  readonly speakerBaseline?: SpeakerSessionBaseline;
  readonly surroundingPhonemes?: {
    readonly prevPhoneme?: string;
    readonly nextPhoneme?: string;
    readonly prevEndTime?: number;
    readonly nextStartTime?: number;
  };
}

/**
 * Feature Extractor Interface.
 */
export interface IAcousticFeatureExtractor {
  readonly featureType: AcousticFeatureType;
  readonly algorithmVersion: string;
  extract(input: AcousticFeatureExtractionInput): AcousticFeatureEvidence;
}
