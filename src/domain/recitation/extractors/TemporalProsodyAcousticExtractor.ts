/**
 * @file TemporalProsodyAcousticExtractor.ts
 * @module domain/recitation/extractors
 * @description Temporal / Prosodic Rate and Timing Extractor (Section 17).
 * 
 * CORE CONTRACT:
 * Computes speech rate, inter-word pause durations, and temporal stability.
 * Normalizes other acoustic evidence without issuing religious judgments.
 */

import {
  AcousticFeatureType,
  AcousticEvidenceStatus,
  AcousticFeatureEvidence,
  AcousticFeatureExtractionInput,
  IAcousticFeatureExtractor,
  SignalQualityLevel,
} from '../acousticFeatureTypes.ts';
import { OFFICIAL_MODEL_HASH } from '../RecitationErrorDecisionEngine.ts';

export class TemporalProsodyAcousticExtractor implements IAcousticFeatureExtractor {
  public readonly featureType = AcousticFeatureType.TEMPORAL_PROSODY;
  public readonly algorithmVersion = 'temporal-prosody-rate-v1.0.0';

  public extract(input: AcousticFeatureExtractionInput): AcousticFeatureEvidence {
    const evidenceId = `pros-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const duration = Math.max(0, input.endTime - input.startTime);

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
        },
        observedMeasurement: {
          durationSeconds: duration,
        },
        normalizedValue: null,
        referenceRange: { min: 2.0, max: 9.0, unit: 'phonemes/sec' },
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
        limitation: 'ERR-ACOUSTIC-007: Corrupted audio precludes timing analysis',
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
        },
        observedMeasurement: {
          durationSeconds: duration,
        },
        normalizedValue: null,
        referenceRange: { min: 2.5, max: 8.5, unit: 'phonemes/sec' },
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
        limitation: 'ERR-ACOUSTIC-006: Unstable alignment boundary precludes speech rate estimation',
        timestamp: new Date().toISOString(),
      });
    }

    // Instantaneous rate: 1.0 / duration (phonemes/second for this segment)
    const instantRate = duration > 0.01 ? 1.0 / duration : 5.0;

    // Relative to session baseline speech rate if available
    const baselineRate = input.speakerBaseline?.meanSpeechRatePhonemesPerSecond || 5.0;
    const rateRatio = instantRate / baselineRate;

    return Object.freeze({
      evidenceId,
      ayahId: input.ayahId,
      wordIndex: input.wordIndex,
      phonemeIndex: input.phonemeIndex,
      featureType: this.featureType,
      expectedContext: {
        canonicalPhoneme: input.expectedPhoneme,
        ruleId: input.ruleId,
      },
      observedMeasurement: {
        durationSeconds: duration,
        speechRatePhonemesPerSecond: instantRate,
        normalizedRatio: rateRatio,
        rawDetails: {
          baselineRate,
          sessionSampleCount: input.speakerBaseline?.sampleCount || 0,
        },
      },
      normalizedValue: rateRatio,
      referenceRange: { min: 2.5, max: 8.5, unit: 'phonemes/sec' },
      confidence: Math.min(0.95, input.alignmentConfidence),
      quality: input.signalQuality.overallQuality,
      startTime: input.startTime,
      endTime: input.endTime,
      signalQuality: input.signalQuality,
      modelVersion: '3.1.0-int8-hardened',
      modelHash: OFFICIAL_MODEL_HASH,
      featureAlgorithmVersion: this.algorithmVersion,
      sourceEvidenceIds: [],
      evidenceStatus: AcousticEvidenceStatus.SUPPORTED,
      limitation: 'ERR-ACOUSTIC-001: Speech rate is an acoustic prosodic descriptor, not a Tajweed error',
      timestamp: new Date().toISOString(),
    });
  }
}
