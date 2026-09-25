/**
 * @file MaddDurationAcousticExtractor.ts
 * @module domain/recitation/extractors
 * @description Real Physical Madd Duration Acoustic Extractor (Section 7).
 * 
 * CORE CONTRACT:
 * Measures actual acoustic segment duration (seconds) and computes speech-rate-normalized
 * mora count relative to the speaker session baseline.
 * 
 * STRICT PROHIBITIONS:
 * - Never uses CTC token count as duration.
 * - Never assumes 1 phoneme = fixed duration.
 * - Never outputs a religious violation status.
 */

import {
  AcousticFeatureType,
  AcousticEvidenceStatus,
  AcousticFeatureEvidence,
  AcousticFeatureExtractionInput,
  IAcousticFeatureExtractor,
  SignalQualityLevel,
  SpeakerBaselineState,
} from '../acousticFeatureTypes.ts';
import { OFFICIAL_MODEL_HASH } from '../RecitationErrorDecisionEngine.ts';

export class MaddDurationAcousticExtractor implements IAcousticFeatureExtractor {
  public readonly featureType = AcousticFeatureType.MADD_DURATION;
  public readonly algorithmVersion = 'madd-duration-v1.0.0-mora-normalized';

  public extract(input: AcousticFeatureExtractionInput): AcousticFeatureEvidence {
    const evidenceId = `madd-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const duration = Math.max(0, input.endTime - input.startTime);

    // Contextual expected mora count
    let expectedMora = 2; // Default Madd Tabii (2 harakat)
    if (input.ruleId?.includes('lazim')) {
      expectedMora = 6;
    } else if (input.ruleId?.includes('munfasil') || input.ruleId?.includes('muttasil')) {
      expectedMora = 4; // 4-5 harakat
    } else if (input.expectedPhoneme === 'a' || input.expectedPhoneme === 'u' || input.expectedPhoneme === 'i') {
      expectedMora = 1; // Short vowel
    }

    const baselineMoraSec = input.speakerBaseline?.meanMoraSeconds || 0.20;
    const normalizedMora = duration / baselineMoraSec;

    const refMin = expectedMora * 0.75;
    const refMax = expectedMora * 1.35;

    // Signal and alignment gating
    if (input.signalQuality.overallQuality === SignalQualityLevel.DEGRADED) {
      return Object.freeze({
        evidenceId,
        ayahId: input.ayahId,
        wordIndex: input.wordIndex,
        phonemeIndex: input.phonemeIndex,
        featureType: this.featureType,
        expectedContext: {
          canonicalPhoneme: input.expectedPhoneme,
          ruleId: input.ruleId,
          expectedMora,
        },
        observedMeasurement: {
          durationSeconds: duration,
          normalizedRatio: normalizedMora,
        },
        normalizedValue: normalizedMora,
        referenceRange: { min: refMin, max: refMax, unit: 'mora' },
        confidence: 0.1,
        quality: input.signalQuality.overallQuality,
        startTime: input.startTime,
        endTime: input.endTime,
        signalQuality: input.signalQuality,
        modelVersion: '3.1.0-int8-hardened',
        modelHash: OFFICIAL_MODEL_HASH,
        featureAlgorithmVersion: this.algorithmVersion,
        sourceEvidenceIds: [],
        evidenceStatus: AcousticEvidenceStatus.INSUFFICIENT_SIGNAL,
        limitation: 'ERR-ACOUSTIC-007: Low SNR or clipping invalidates duration estimation',
        timestamp: new Date().toISOString(),
      });
    }

    if (!input.isAlignmentStable || input.alignmentConfidence < 0.75) {
      return Object.freeze({
        evidenceId,
        ayahId: input.ayahId,
        wordIndex: input.wordIndex,
        phonemeIndex: input.phonemeIndex,
        featureType: this.featureType,
        expectedContext: {
          canonicalPhoneme: input.expectedPhoneme,
          ruleId: input.ruleId,
          expectedMora,
        },
        observedMeasurement: {
          durationSeconds: duration,
          normalizedRatio: normalizedMora,
        },
        normalizedValue: normalizedMora,
        referenceRange: { min: refMin, max: refMax, unit: 'mora' },
        confidence: input.alignmentConfidence * 0.5,
        quality: input.signalQuality.overallQuality,
        startTime: input.startTime,
        endTime: input.endTime,
        signalQuality: input.signalQuality,
        modelVersion: '3.1.0-int8-hardened',
        modelHash: OFFICIAL_MODEL_HASH,
        featureAlgorithmVersion: this.algorithmVersion,
        sourceEvidenceIds: [],
        evidenceStatus: AcousticEvidenceStatus.INCONCLUSIVE,
        limitation: 'ERR-ACOUSTIC-006: Unstable alignment boundary precludes exact duration segmentation',
        timestamp: new Date().toISOString(),
      });
    }

    // Determine status based on normalized mora vs reference range
    let status = AcousticEvidenceStatus.SUPPORTED;
    let limitation = 'ERR-ACOUSTIC-001: Sub-frame acoustic calibration unbenchmarked on children/elderly';

    if (input.speakerBaseline?.baselineState !== SpeakerBaselineState.VALID_BASELINE) {
      status = AcousticEvidenceStatus.EXPERIMENTAL;
      limitation = 'ERR-ACOUSTIC-009: Insufficient speaker session baseline for robust mora normalization';
    } else if (normalizedMora < refMin || normalizedMora > refMax) {
      status = AcousticEvidenceStatus.PARTIALLY_SUPPORTED;
    }

    return Object.freeze({
      evidenceId,
      ayahId: input.ayahId,
      wordIndex: input.wordIndex,
      phonemeIndex: input.phonemeIndex,
      featureType: this.featureType,
      expectedContext: {
        canonicalPhoneme: input.expectedPhoneme,
        ruleId: input.ruleId,
        expectedMora,
      },
      observedMeasurement: {
        durationSeconds: duration,
        normalizedRatio: normalizedMora,
        rawDetails: {
          baselineMoraSec,
          sampleCount: input.speakerBaseline?.sampleCount || 0,
        },
      },
      normalizedValue: normalizedMora,
      referenceRange: { min: refMin, max: refMax, unit: 'mora' },
      confidence: Math.min(0.95, input.alignmentConfidence * 0.95),
      quality: input.signalQuality.overallQuality,
      startTime: input.startTime,
      endTime: input.endTime,
      signalQuality: input.signalQuality,
      modelVersion: '3.1.0-int8-hardened',
      modelHash: OFFICIAL_MODEL_HASH,
      featureAlgorithmVersion: this.algorithmVersion,
      sourceEvidenceIds: [],
      evidenceStatus: status,
      limitation,
      timestamp: new Date().toISOString(),
    });
  }
}
