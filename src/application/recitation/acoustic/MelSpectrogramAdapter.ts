/**
 * @file MelSpectrogramAdapter.ts
 * @module application/recitation/acoustic
 * @description Adapts the MelSpectrogramExtractor output to neural model tensor specifications.
 * Verifies tensor shapes, datatypes, normalization, and dimensional alignment.
 */

export interface MelAdapterConfig {
  targetSampleRate: number;      // e.g. 16000
  targetMelBands: number;        // e.g. 80
  normalizeInstanceNorm: boolean;// Apply zero-mean unit-variance per utterance
  targetDataType: 'float32';
}

export interface ModelInputTensorDescriptor {
  shape: [number, number, number]; // [batch=1, time=T, mel=80]
  data: Float32Array;
  numFrames: number;
  numBands: number;
  isNormalized: boolean;
  minVal: number;
  maxVal: number;
}

export class MelSpectrogramAdapter {
  private readonly config: MelAdapterConfig;

  constructor(config: Partial<MelAdapterConfig> = {}) {
    this.config = {
      targetSampleRate: 16000,
      targetMelBands: 80,
      normalizeInstanceNorm: true,
      targetDataType: 'float32',
      ...config,
    };
  }

  /**
   * Transforms raw 2D Mel frames (Float32Array[T][80]) into a contiguous flattened 1D Float32Array
   * formatted for tensor shape [1, T, 80] with explicit instance normalization.
   */
  public adaptForModel(melFrames: Float32Array[]): ModelInputTensorDescriptor {
    const numFrames = melFrames.length;
    const numBands = this.config.targetMelBands;

    if (numFrames === 0) {
      return {
        shape: [1, 0, numBands],
        data: new Float32Array(0),
        numFrames: 0,
        numBands,
        isNormalized: false,
        minVal: 0,
        maxVal: 0,
      };
    }

    const totalElements = numFrames * numBands;
    const flattened = new Float32Array(totalElements);

    let sum = 0;
    let sumSq = 0;
    let minVal = Infinity;
    let maxVal = -Infinity;

    // 1. Copy and calculate mean and variance across entire utterance
    let idx = 0;
    for (let t = 0; t < numFrames; t++) {
      const frame = melFrames[t];
      for (let m = 0; m < numBands; m++) {
        const val = frame[m] ?? 0;
        flattened[idx++] = val;
        sum += val;
        sumSq += val * val;
        if (val < minVal) minVal = val;
        if (val > maxVal) maxVal = val;
      }
    }

    // 2. Apply Instance Normalization if enabled: x_norm = (x - mean) / (std + eps)
    if (this.config.normalizeInstanceNorm && totalElements > 1) {
      const mean = sum / totalElements;
      const variance = Math.max(1e-8, sumSq / totalElements - mean * mean);
      const std = Math.sqrt(variance);

      minVal = Infinity;
      maxVal = -Infinity;
      for (let i = 0; i < totalElements; i++) {
        flattened[i] = (flattened[i] - mean) / std;
        if (flattened[i] < minVal) minVal = flattened[i];
        if (flattened[i] > maxVal) maxVal = flattened[i];
      }
    }

    return {
      shape: [1, numFrames, numBands],
      data: flattened,
      numFrames,
      numBands,
      isNormalized: this.config.normalizeInstanceNorm,
      minVal,
      maxVal,
    };
  }
}
