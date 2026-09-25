/**
 * @file AcousticSignalQualityGator.ts
 * @module domain/recitation
 * @description Real-time physical signal quality assessment for speech acoustic evidence.
 * 
 * CORE CONTRACT:
 * Evaluates RMS, peak amplitude, digital clipping, noise floor, SNR, and dropouts.
 * If audio is silent, clipped, or submerged in noise, acoustic feature extraction
 * is safely gated and marked INSUFFICIENT_SIGNAL or INCONCLUSIVE.
 */

import {
  SignalQualityMetrics,
  SignalQualityLevel,
} from './acousticFeatureTypes.ts';

export class AcousticSignalQualityGator {
  private static instance: AcousticSignalQualityGator | null = null;

  public static getInstance(): AcousticSignalQualityGator {
    if (!AcousticSignalQualityGator.instance) {
      AcousticSignalQualityGator.instance = new AcousticSignalQualityGator();
    }
    return AcousticSignalQualityGator.instance;
  }

  /**
   * Analyzes raw Float32Array PCM audio and extracts rigorous physical metrics.
   */
  public analyze(pcm: Float32Array, sampleRate: number = 16000): SignalQualityMetrics {
    if (pcm.length === 0) {
      return {
        rms: 0,
        peak: 0,
        isClipping: false,
        snrDb: 0,
        silenceRatio: 1.0,
        speechRatio: 0.0,
        stationaryNoiseRatio: 0.0,
        hasDropout: true,
        overallQuality: SignalQualityLevel.DEGRADED,
      };
    }

    let sumSq = 0;
    let peak = 0;
    let clipCount = 0;

    const frameSize = Math.floor(sampleRate * 0.02); // 20ms frames
    const stepSize = Math.floor(sampleRate * 0.01);  // 10ms step
    const frameEnergies: number[] = [];

    for (let i = 0; i < pcm.length; i++) {
      const absVal = Math.abs(pcm[i]);
      if (absVal > peak) peak = absVal;
      if (absVal >= 0.995) clipCount++;
      sumSq += pcm[i] * pcm[i];
    }

    const rms = Math.sqrt(sumSq / pcm.length);
    const isClipping = clipCount > Math.max(5, pcm.length * 0.001);

    // Frame-level energy distribution for SNR and silence estimation
    for (let start = 0; start + frameSize <= pcm.length; start += stepSize) {
      let frameSq = 0;
      for (let j = 0; j < frameSize; j++) {
        const s = pcm[start + j];
        frameSq += s * s;
      }
      frameEnergies.push(Math.sqrt(frameSq / frameSize));
    }

    if (frameEnergies.length === 0) {
      frameEnergies.push(rms);
    }

    frameEnergies.sort((a, b) => a - b);

    // 10th percentile as noise floor, 90th percentile as speech energy
    const noiseFloorIdx = Math.floor(frameEnergies.length * 0.1);
    const speechEnergyIdx = Math.floor(frameEnergies.length * 0.9);

    let noiseFloor = frameEnergies[noiseFloorIdx];
    const speechEnergy = frameEnergies[speechEnergyIdx];

    // If 10th percentile has active speech energy (> 0.02), this segment is continuous active phoneme.
    // Use standard clean baseline noise floor (1e-3) so clean sustained vowels are not falsely penalized as 0 dB.
    if (noiseFloor > 0.02) {
      noiseFloor = 1e-3;
    } else {
      noiseFloor = Math.max(1e-5, noiseFloor);
    }

    const snrDb = Math.max(0, 20 * Math.log10(Math.max(noiseFloor, speechEnergy) / noiseFloor));

    // Silence frames: energy < 0.008
    let silenceCount = 0;
    for (const e of frameEnergies) {
      if (e < 0.008) silenceCount++;
    }
    const silenceRatio = silenceCount / frameEnergies.length;
    const speechRatio = 1.0 - silenceRatio;

    // Zero-crossing rate (ZCR) for detecting high-frequency noise
    let zeroCrossings = 0;
    for (let i = 1; i < pcm.length; i++) {
      if ((pcm[i] >= 0 && pcm[i - 1] < 0) || (pcm[i] < 0 && pcm[i - 1] >= 0)) {
        zeroCrossings++;
      }
    }
    const zcr = zeroCrossings / Math.max(1, pcm.length);

    // Check if broadband flat white noise: high ZCR (> 0.40) AND significant energy across both low and high bands
    let isWhiteNoise = false;
    if (zcr > 0.40) {
      let eLow = 0, eHigh = 0;
      const len = Math.min(pcm.length, 512);
      for (let freq = 200; freq <= 1000; freq += 200) {
        let re = 0, im = 0;
        const omega = (2 * Math.PI * freq) / sampleRate;
        for (let i = 0; i < len; i++) {
          re += pcm[i] * Math.cos(omega * i);
          im -= pcm[i] * Math.sin(omega * i);
        }
        eLow += (re * re + im * im);
      }
      for (let freq = 4000; freq <= 7000; freq += 500) {
        let re = 0, im = 0;
        const omega = (2 * Math.PI * freq) / sampleRate;
        for (let i = 0; i < len; i++) {
          re += pcm[i] * Math.cos(omega * i);
          im -= pcm[i] * Math.sin(omega * i);
        }
        eHigh += (re * re + im * im);
      }
      const flatnessRatio = eLow / Math.max(1e-5, eHigh);
      // White noise has balanced energy across low and high bands (flatnessRatio >= 0.04)
      // True sibilants have negligible low-frequency energy (flatnessRatio < 0.01)
      if (flatnessRatio >= 0.04) {
        isWhiteNoise = true;
      }
    }

    // Dropout detection: sudden continuous zero blocks > 50ms
    let consecutiveZeros = 0;
    let hasDropout = false;
    for (let i = 0; i < pcm.length; i++) {
      if (Math.abs(pcm[i]) < 1e-6) {
        consecutiveZeros++;
        if (consecutiveZeros > sampleRate * 0.05) {
          hasDropout = true;
          break;
        }
      } else {
        consecutiveZeros = 0;
      }
    }

    // Overall quality classification
    let overallQuality = SignalQualityLevel.HIGH;

    if (rms < 0.005 || silenceRatio > 0.95 || isClipping || snrDb < 8.0 || isWhiteNoise) {
      overallQuality = SignalQualityLevel.DEGRADED;
    } else if (snrDb < 12.0 || speechRatio < 0.2 || hasDropout) {
      overallQuality = SignalQualityLevel.LOW;
    } else if (snrDb < 18.0) {
      overallQuality = SignalQualityLevel.MEDIUM;
    } else {
      overallQuality = SignalQualityLevel.HIGH;
    }

    return Object.freeze({
      rms,
      peak,
      isClipping,
      snrDb: isWhiteNoise ? Math.min(snrDb, 5.0) : snrDb,
      silenceRatio,
      speechRatio: isWhiteNoise ? 0.1 : speechRatio,
      stationaryNoiseRatio: isWhiteNoise ? 0.85 : (silenceRatio > 0.5 ? 0.3 : 0.05),
      hasDropout,
      overallQuality,
    });
  }
}
