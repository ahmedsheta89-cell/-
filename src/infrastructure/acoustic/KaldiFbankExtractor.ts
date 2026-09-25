/**
 * @file KaldiFbankExtractor.ts
 * @module infrastructure/acoustic
 * @description Exact Kaldi-compatible Filterbank (FBank) feature extractor matching
 * the sherpa-onnx / kaldifeat / k2-icefall specification for Zipformer models.
 *
 * Baseline Specification:
 * - Sampling Rate: 16,000 Hz
 * - Feature Dimension: 80 Mel bins
 * - Window Type: Povey (pow(0.5 - 0.5 * cos(2*PI*n/(N-1)), 0.85))
 * - Frame Length: 25.0 ms (400 samples)
 * - Frame Shift: 10.0 ms (160 samples)
 * - Padded Window Size: 512 samples (power of 2)
 * - Dither: 0.0 (deterministic)
 * - Snip Edges: false (reflective boundary padding)
 * - Low Frequency Cutoff: 20 Hz
 * - High Frequency Cutoff: -400 Hz (Nyquist - 400 = 7600 Hz)
 * - Remove DC Offset: true (subtract window mean before preemphasis)
 * - Preemphasis Coefficient: 0.97
 * - Use Energy: false
 * - Use Log Fbank: true
 * - Use Power: true
 * - Normalization / CMVN: None (raw log energies fed to Zipformer BiasNorm)
 */

export interface KaldiFbankConfig {
  sampleRate: number;        // default: 16000
  featureDim: number;        // default: 80
  frameLengthMs: number;     // default: 25.0 ms
  frameShiftMs: number;      // default: 10.0 ms
  dither: number;            // default: 0.0
  snipEdges: boolean;        // default: false
  lowFreq: number;           // default: 20 Hz
  highFreq: number;          // default: -400 Hz (relative to Nyquist)
  removeDcOffset: boolean;   // default: true
  preemphCoeff: number;      // default: 0.97
  useEnergy: boolean;        // default: false
  roundToPowerOfTwo: boolean;// default: true
}

export const DEFAULT_KALDI_FBANK_CONFIG: Readonly<KaldiFbankConfig> = Object.freeze({
  sampleRate: 16000,
  featureDim: 80,
  frameLengthMs: 25.0,
  frameShiftMs: 10.0,
  dither: 0.0,
  snipEdges: false,
  lowFreq: 20,
  highFreq: -400,
  removeDcOffset: true,
  preemphCoeff: 0.97,
  useEnergy: false,
  roundToPowerOfTwo: true,
});

export interface MelBinFilter {
  offset: number;
  weights: Float32Array;
}

export class KaldiFbankExtractor {
  public readonly config: Readonly<KaldiFbankConfig>;
  public readonly windowSize: number;       // 400 at 16k
  public readonly windowShift: number;      // 160 at 16k
  public readonly paddedWindowSize: number; // 512
  public readonly numFftBins: number;       // 257 (Nyquist included)

  private readonly windowFunction: Float32Array;
  private readonly melBins: MelBinFilter[];

  constructor(config: Partial<KaldiFbankConfig> = {}) {
    this.config = Object.freeze({ ...DEFAULT_KALDI_FBANK_CONFIG, ...config });

    this.windowSize = Math.floor(this.config.sampleRate * 0.001 * this.config.frameLengthMs);
    this.windowShift = Math.floor(this.config.sampleRate * 0.001 * this.config.frameShiftMs);

    this.paddedWindowSize = this.config.roundToPowerOfTwo
      ? this.roundUpToNearestPowerOfTwo(this.windowSize)
      : this.windowSize;

    this.numFftBins = Math.floor(this.paddedWindowSize / 2) + 1;

    // 1. Build Povey window
    this.windowFunction = this.buildPoveyWindow(this.windowSize);

    // 2. Build Kaldi Mel filterbank bins
    this.melBins = this.buildKaldiMelBanks();
  }

  private roundUpToNearestPowerOfTwo(n: number): number {
    let p = 1;
    while (p < n) p <<= 1;
    return p;
  }

  /**
   * Povey window formulation from Kaldi:
   * w[i] = (0.5 - 0.5 * cos(2 * PI * i / (N - 1))) ^ 0.85
   */
  private buildPoveyWindow(windowSize: number): Float32Array {
    const window = new Float32Array(windowSize);
    const a = (2.0 * Math.PI) / (windowSize - 1);
    for (let i = 0; i < windowSize; i++) {
      window[i] = Math.pow(0.5 - 0.5 * Math.cos(a * i), 0.85);
    }
    return window;
  }

  /**
   * Kaldi Mel scale: 1127.0 * ln(1.0 + f / 700.0)
   */
  public static melScale(freq: number): number {
    return 1127.0 * Math.log(1.0 + freq / 700.0);
  }

  public static inverseMelScale(mel: number): number {
    return 700.0 * (Math.exp(mel / 1127.0) - 1.0);
  }

  /**
   * Constructs Kaldi Mel filterbank matrix matching Kaldi's InitKaldiMelBanks.
   */
  private buildKaldiMelBanks(): MelBinFilter[] {
    const numBins = this.config.featureDim;
    const nyquist = 0.5 * this.config.sampleRate;
    const lowFreq = this.config.lowFreq;
    const highFreq = this.config.highFreq > 0
      ? this.config.highFreq
      : nyquist + this.config.highFreq;

    if (lowFreq < 0 || lowFreq >= nyquist || highFreq <= 0 || highFreq > nyquist || highFreq <= lowFreq) {
      throw new Error(`Invalid frequency bounds in KaldiFbank: low=${lowFreq}, high=${highFreq}, nyquist=${nyquist}`);
    }

    const fftBinWidth = this.config.sampleRate / this.paddedWindowSize;
    const melLowFreq = KaldiFbankExtractor.melScale(lowFreq);
    const melHighFreq = KaldiFbankExtractor.melScale(highFreq);
    const melDelta = (melHighFreq - melLowFreq) / (numBins + 1);

    const melBanks: MelBinFilter[] = [];

    for (let bin = 0; bin < numBins; bin++) {
      const leftMel = melLowFreq + bin * melDelta;
      const centerMel = melLowFreq + (bin + 1) * melDelta;
      const rightMel = melLowFreq + (bin + 2) * melDelta;

      let firstIndex = -1;
      let lastIndex = -1;
      const tempWeights: number[] = [];

      for (let i = 0; i < this.numFftBins; i++) {
        const freq = fftBinWidth * i;
        const mel = KaldiFbankExtractor.melScale(freq);

        if (mel > leftMel && mel < rightMel) {
          let weight: number;
          if (mel <= centerMel) {
            weight = (mel - leftMel) / (centerMel - leftMel);
          } else {
            weight = (rightMel - mel) / (rightMel - centerMel);
          }

          if (firstIndex === -1) {
            firstIndex = i;
          }
          lastIndex = i;
          tempWeights.push(weight);
        } else if (firstIndex !== -1 && lastIndex !== -1) {
          // Beyond the triangular peak
          break;
        }
      }

      if (firstIndex === -1 || lastIndex < firstIndex) {
        throw new Error(`Kaldi Mel filterbank bin ${bin} has zero active FFT bins`);
      }

      melBanks.push({
        offset: firstIndex,
        weights: new Float32Array(tempWeights)
      });
    }

    return melBanks;
  }

  /**
   * Computes the number of frames according to Kaldi:
   * If snipEdges is false:
   * num_frames = floor((num_samples + floor(frame_shift / 2)) / frame_shift)
   */
  public numFrames(numSamples: number): number {
    if (this.config.snipEdges) {
      if (numSamples < this.windowSize) return 0;
      return 1 + Math.floor((numSamples - this.windowSize) / this.windowShift);
    } else {
      return Math.floor((numSamples + Math.floor(this.windowShift / 2)) / this.windowShift);
    }
  }

  /**
   * Extracts Kaldi-compatible FBank log-energies from 16kHz PCM audio.
   * Output shape: [numFrames, 80]
   */
  public extract(pcm: Float32Array): Float32Array[] {
    const waveDim = pcm.length;
    const totalFrames = this.numFrames(waveDim);
    if (totalFrames <= 0) {
      return [];
    }

    const frames: Float32Array[] = [];
    const windowBuffer = new Float32Array(this.paddedWindowSize);
    const realPart = new Float32Array(this.paddedWindowSize);
    const imagPart = new Float32Array(this.paddedWindowSize);
    const powerSpectrum = new Float32Array(this.numFftBins);

    for (let f = 0; f < totalFrames; f++) {
      // 1. Determine frame boundaries
      let startSample: number;
      if (this.config.snipEdges) {
        startSample = f * this.windowShift;
      } else {
        const midpoint = f * this.windowShift + Math.floor(this.windowShift / 2);
        startSample = midpoint - Math.floor(this.windowSize / 2);
      }

      // 2. Extract window with boundary reflection if snipEdges is false
      for (let s = 0; s < this.windowSize; s++) {
        let sInWave = startSample + s;
        while (sInWave < 0 || sInWave >= waveDim) {
          if (sInWave < 0) {
            sInWave = -sInWave - 1;
          } else {
            sInWave = 2 * waveDim - 1 - sInWave;
          }
        }
        windowBuffer[s] = pcm[sInWave];
      }

      // Zero-pad remainder to power of two
      for (let s = this.windowSize; s < this.paddedWindowSize; s++) {
        windowBuffer[s] = 0;
      }

      // 3. Remove DC offset (subtract mean of unwindowed frame)
      if (this.config.removeDcOffset) {
        let sum = 0;
        for (let s = 0; s < this.windowSize; s++) {
          sum += windowBuffer[s];
        }
        const mean = sum / this.windowSize;
        for (let s = 0; s < this.windowSize; s++) {
          windowBuffer[s] -= mean;
        }
      }

      // 4. Preemphasis: frame[s] -= preemph * frame[s-1]
      if (this.config.preemphCoeff !== 0.0) {
        for (let s = this.windowSize - 1; s > 0; s--) {
          windowBuffer[s] -= this.config.preemphCoeff * windowBuffer[s - 1];
        }
        windowBuffer[0] -= this.config.preemphCoeff * windowBuffer[0];
      }

      // 5. Apply Povey window
      for (let s = 0; s < this.windowSize; s++) {
        windowBuffer[s] *= this.windowFunction[s];
      }

      // 6. Compute 512-point Real FFT
      for (let s = 0; s < this.paddedWindowSize; s++) {
        realPart[s] = windowBuffer[s];
        imagPart[s] = 0;
      }
      this.radix2Fft(realPart, imagPart);

      // 7. Power spectrum computation (real^2 + imag^2)
      // Kaldi: bin 0 is DC, bin N/2 is Nyquist
      powerSpectrum[0] = realPart[0] * realPart[0];
      for (let i = 1; i < this.numFftBins - 1; i++) {
        powerSpectrum[i] = realPart[i] * realPart[i] + imagPart[i] * imagPart[i];
      }
      powerSpectrum[this.numFftBins - 1] =
        realPart[this.numFftBins - 1] * realPart[this.numFftBins - 1] +
        imagPart[this.numFftBins - 1] * imagPart[this.numFftBins - 1];

      // 8. Mel filterbank integration and natural log
      const fbankFrame = new Float32Array(this.config.featureDim);
      const FLT_EPSILON = 1.1920929e-7;

      for (let b = 0; b < this.config.featureDim; b++) {
        const binFilter = this.melBins[b];
        const offset = binFilter.offset;
        const weights = binFilter.weights;
        let energy = 0;

        for (let k = 0; k < weights.length; k++) {
          energy += weights[k] * powerSpectrum[offset + k];
        }

        // Apply flooring and natural log
        fbankFrame[b] = Math.log(Math.max(energy, FLT_EPSILON));
      }

      frames.push(fbankFrame);
    }

    return frames;
  }

  /**
   * Fast In-Place Cooley-Tukey Radix-2 DIT FFT.
   */
  private radix2Fft(real: Float32Array, imag: Float32Array): void {
    const n = real.length;
    let j = 0;
    for (let i = 0; i < n - 1; i++) {
      if (i < j) {
        const tr = real[i]; real[i] = real[j]; real[j] = tr;
        const ti = imag[i]; imag[i] = imag[j]; imag[j] = ti;
      }
      let k = n >> 1;
      while (k <= j) {
        j -= k;
        k >>= 1;
      }
      j += k;
    }

    for (let l = 2; l <= n; l <<= 1) {
      const half = l >> 1;
      const angle = (-2 * Math.PI) / l;
      const wStepR = Math.cos(angle);
      const wStepI = Math.sin(angle);

      for (let i = 0; i < n; i += l) {
        let wr = 1.0;
        let wi = 0.0;
        for (let k = 0; k < half; k++) {
          const pos = i + k + half;
          const tr = wr * real[pos] - wi * imag[pos];
          const ti = wr * imag[pos] + wi * real[pos];

          real[pos] = real[i + k] - tr;
          imag[pos] = imag[i + k] - ti;
          real[i + k] += tr;
          imag[i + k] += ti;

          const nextWr = wr * wStepR - wi * wStepI;
          wi = wr * wStepI + wi * wStepR;
          wr = nextWr;
        }
      }
    }
  }
}
