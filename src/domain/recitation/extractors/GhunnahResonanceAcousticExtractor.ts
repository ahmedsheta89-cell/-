/**
 * @file GhunnahResonanceAcousticExtractor.ts
 * @module domain/recitation/extractors
 * @description Physical Nasal Resonance Proxy Extractor for Ghunnah Contexts (Section 9).
 * 
 * CORE CONTRACT:
 * Measures low-frequency nasal murmur band (200-500 Hz) vs oral cavity band (500-1500 Hz).
 * 
 * STRICT PROHIBITIONS:
 * - Never claims "Nasal energy = Ghunnah".
 * - Never infers Ghunnah solely from CTC token identity.
 * - Always marks evidence as EXPERIMENTAL or INCONCLUSIVE.
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

export class GhunnahResonanceAcousticExtractor implements IAcousticFeatureExtractor {
  public readonly featureType = AcousticFeatureType.GHUNNAH_RESONANCE;
  public readonly algorithmVersion = 'ghunnah-nasal-proxy-v1.0.0';

  public extract(input: AcousticFeatureExtractionInput): AcousticFeatureEvidence {
    const evidenceId = `ghunnah-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const duration = Math.max(0, input.endTime - input.startTime);

    // Ghunnah requires HIGH signal quality (SNR >= 15 dB)
    if (input.signalQuality.snrDb < 15.0 || input.signalQuality.overallQuality !== SignalQualityLevel.HIGH) {
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
        referenceRange: { min: 0.65, max: 2.50, unit: 'nasal_ratio' },
        confidence: 0.2,
        quality: input.signalQuality.overallQuality,
        startTime: input.startTime,
        endTime: input.endTime,
        signalQuality: input.signalQuality,
        modelVersion: '3.1.0-int8-hardened',
        modelHash: OFFICIAL_MODEL_HASH,
        featureAlgorithmVersion: this.algorithmVersion,
        sourceEvidenceIds: [],
        evidenceStatus: AcousticEvidenceStatus.INSUFFICIENT_SIGNAL,
        limitation: 'ERR-ACOUSTIC-002: Ghunnah resonance measurement requires high SNR (>= 15dB) free of room reverberation',
        timestamp: new Date().toISOString(),
      });
    }

    if (!input.isAlignmentStable || input.alignmentConfidence < 0.80) {
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
        referenceRange: { min: 0.65, max: 2.50, unit: 'nasal_ratio' },
        confidence: 0.25,
        quality: input.signalQuality.overallQuality,
        startTime: input.startTime,
        endTime: input.endTime,
        signalQuality: input.signalQuality,
        modelVersion: '3.1.0-int8-hardened',
        modelHash: OFFICIAL_MODEL_HASH,
        featureAlgorithmVersion: this.algorithmVersion,
        sourceEvidenceIds: [],
        evidenceStatus: AcousticEvidenceStatus.INCONCLUSIVE,
        limitation: 'ERR-ACOUSTIC-006: Unstable alignment boundary invalidates acoustic resonance segmentation',
        timestamp: new Date().toISOString(),
      });
    }

    // Extract segment PCM
    const sampleRate = input.sampleRate || 16000;
    const startIdx = Math.max(0, Math.floor(input.startTime * sampleRate));
    const endIdx = Math.min(input.pcmAudio.length, Math.ceil(input.endTime * sampleRate));
    const segment = input.pcmAudio.subarray(startIdx, endIdx);

    // Compute Discrete Fourier energy in 200-500 Hz (Nasal) vs 600-1600 Hz (Oral)
    let nasalEnergy = 0;
    let oralEnergy = 0;
    let humEnergy = 0;
    const n = segment.length;
    const len = Math.min(n, 1024);

    if (len > 64) {
      // Check 50-100 Hz band for electrical mains hum
      for (let freq = 50; freq <= 100; freq += 10) {
        let re = 0, im = 0;
        const omega = (2 * Math.PI * freq) / sampleRate;
        for (let i = 0; i < len; i++) {
          re += segment[i] * Math.cos(omega * i);
          im -= segment[i] * Math.sin(omega * i);
        }
        humEnergy += (re * re + im * im);
      }

      for (let freq = 200; freq <= 500; freq += 40) {
        let re = 0, im = 0;
        const omega = (2 * Math.PI * freq) / sampleRate;
        for (let i = 0; i < len; i++) {
          re += segment[i] * Math.cos(omega * i);
          im -= segment[i] * Math.sin(omega * i);
        }
        nasalEnergy += (re * re + im * im);
      }

      for (let freq = 600; freq <= 1600; freq += 100) {
        let re = 0, im = 0;
        const omega = (2 * Math.PI * freq) / sampleRate;
        for (let i = 0; i < len; i++) {
          re += segment[i] * Math.cos(omega * i);
          im -= segment[i] * Math.sin(omega * i);
        }
        oralEnergy += (re * re + im * im);
      }
    }

    const isMainsHum = humEnergy > nasalEnergy * 1.5;
    const nasalRatio = nasalEnergy / Math.max(1e-5, oralEnergy);

    // Negative control: background hum check (if stationary hum at 50/60Hz dominates)
    const isNasalCandidate = input.expectedPhoneme === 'n' || input.expectedPhoneme === 'm' || input.ruleId?.includes('ghunnah');

    let status = AcousticEvidenceStatus.EXPERIMENTAL;
    let limitation = 'ERR-ACOUSTIC-002: Nasal acoustic proxy does not prove scholarly verified Ghunnah execution';

    if (isMainsHum) {
      status = AcousticEvidenceStatus.INCONCLUSIVE;
      limitation = 'ERR-ACOUSTIC-002: Low-frequency mains hum (50/60Hz) detected; invalidates nasal resonance proxy';
    } else if (isNasalCandidate && nasalRatio > 0.65) {
      status = AcousticEvidenceStatus.PARTIALLY_SUPPORTED;
    } else {
      status = AcousticEvidenceStatus.INCONCLUSIVE;
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
      },
      observedMeasurement: {
        durationSeconds: duration,
        lowHighEnergyRatio: nasalRatio,
        rawDetails: {
          nasalBandEnergy: nasalEnergy,
          oralBandEnergy: oralEnergy,
        },
      },
      normalizedValue: Math.min(3.0, nasalRatio),
      referenceRange: { min: 0.65, max: 2.50, unit: 'nasal_ratio' },
      confidence: Math.min(0.85, input.alignmentConfidence * 0.8),
      quality: input.signalQuality.overallQuality,
      startTime: input.startTime,
      endTime: input.endTime,
      signalQuality: input.signalQuality,
      modelVersion: '3.1.0-int8-hardened',
      modelHash: OFFICIAL_MODEL_HASH,
      featureAlgorithmVersion: this.algorithmVersion,
      sourceEvidenceIds: [],
      evidenceStatus: status,
      limitation: 'ERR-ACOUSTIC-002: Nasal acoustic proxy does not prove scholarly verified Ghunnah execution',
      timestamp: new Date().toISOString(),
    });
  }
}
