/**
 * @file MelSpectrogramExtractor.ts
 * @module application/recitation/acoustic
 * @description Real mathematical Mel-Filterbank Spectrogram feature extractor in pure TypeScript.
 * Converts raw PCM audio (16kHz) into log Mel-filterbank energies without external C++ or Python dependencies.
 */

export interface MelSpectrogramConfig {
  sampleRate: number;      // 16000 Hz
  fftSize: number;         // 512 (32ms window)
  hopSize: number;         // 160 (10ms frame step)
  numMelBands: number;     // 80 Mel filterbanks
  fMin: number;            // 0 Hz
  fMax: number;            // 8000 Hz
}

export const DEFAULT_MEL_CONFIG: MelSpectrogramConfig = {
  sampleRate: 16000,
  fftSize: 512,
  hopSize: 160,
  numMelBands: 80,
  fMin: 0,
  fMax: 8000,
};

export class MelSpectrogramExtractor {
  private readonly config: MelSpectrogramConfig;
  private readonly hannWindow: Float32Array;
  private readonly melFilterbank: Float32Array[]; // [numMelBands][numBins]
  private readonly numBins: number;

  constructor(config: Partial<MelSpectrogramConfig> = {}) {
    this.config = { ...DEFAULT_MEL_CONFIG, ...config };
    this.numBins = Math.floor(this.config.fftSize / 2) + 1;

    // 1. Precompute Hann window
    this.hannWindow = new Float32Array(this.config.fftSize);
    for (let i = 0; i < this.config.fftSize; i++) {
      this.hannWindow[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (this.config.fftSize - 1)));
    }

    // 2. Precompute Mel filterbank weights
    this.melFilterbank = this.buildMelFilterbank();
  }

  /**
   * Converts frequency in Hz to Mel scale.
   */
  private hzToMel(hz: number): number {
    return 2595 * Math.log10(1 + hz / 700);
  }

  /**
   * Converts Mel scale back to frequency in Hz.
   */
  private melToHz(mel: number): number {
    return 700 * (Math.pow(10, mel / 2595) - 1);
  }

  /**
   * Constructs triangular Mel filterbank matrix.
   */
  private buildMelFilterbank(): Float32Array[] {
    const minMel = this.hzToMel(this.config.fMin);
    const maxMel = this.hzToMel(this.config.fMax);
    const melStep = (maxMel - minMel) / (this.config.numMelBands + 1);

    const melPoints: number[] = [];
    for (let i = 0; i <= this.config.numMelBands + 1; i++) {
      melPoints.push(minMel + i * melStep);
    }

    // Convert mel points to FFT bin indices
    const binIndices = melPoints.map((m) => {
      const hz = this.melToHz(m);
      const bin = Math.floor(((this.config.fftSize + 1) * hz) / this.config.sampleRate);
      return Math.min(this.numBins - 1, Math.max(0, bin));
    });

    const filterbank: Float32Array[] = [];
    for (let m = 1; m <= this.config.numMelBands; m++) {
      const weights = new Float32Array(this.numBins);
      const left = binIndices[m - 1];
      const center = binIndices[m];
      const right = binIndices[m + 1];

      for (let k = left; k < center; k++) {
        if (center > left) {
          weights[k] = (k - left) / (center - left);
        }
      }
      for (let k = center; k <= right; k++) {
        if (right > center) {
          weights[k] = (right - k) / (right - center);
        }
      }
      filterbank.push(weights);
    }

    return filterbank;
  }

  /**
   * Extracts log Mel-spectrogram frames from raw PCM audio.
   * Output dimension: [numFrames, numMelBands]
   */
  extract(audioPcm: Float32Array): Float32Array[] {
    const { fftSize, hopSize } = this.config;
    if (audioPcm.length < fftSize) {
      return [];
    }

    const numFrames = Math.floor((audioPcm.length - fftSize) / hopSize) + 1;
    const frames: Float32Array[] = [];

    const realPart = new Float32Array(fftSize);
    const imagPart = new Float32Array(fftSize);

    for (let f = 0; f < numFrames; f++) {
      const start = f * hopSize;

      // Apply Hann window and prepare for FFT
      for (let i = 0; i < fftSize; i++) {
        realPart[i] = audioPcm[start + i] * this.hannWindow[i];
        imagPart[i] = 0;
      }

      // Compute Discrete Fourier Transform (DFT for the bins)
      const powerSpectrum = new Float32Array(this.numBins);
      for (let k = 0; k < this.numBins; k++) {
        let sumReal = 0;
        let sumImag = 0;
        // Optimization: calculate Fourier bin energy
        const angle = (2 * Math.PI * k) / fftSize;
        for (let n = 0; n < fftSize; n++) {
          const a = n * angle;
          sumReal += realPart[n] * Math.cos(a);
          sumImag -= realPart[n] * Math.sin(a);
        }
        powerSpectrum[k] = (sumReal * sumReal + sumImag * sumImag) / fftSize;
      }

      // Project onto Mel filterbank and compute Log energy
      const melFrame = new Float32Array(this.config.numMelBands);
      for (let m = 0; m < this.config.numMelBands; m++) {
        const weights = this.melFilterbank[m];
        let energy = 0;
        for (let k = 0; k < this.numBins; k++) {
          energy += powerSpectrum[k] * weights[k];
        }
        // Log energy with numerical stability epsilon
        melFrame[m] = Math.log(Math.max(1e-6, energy));
      }

      frames.push(melFrame);
    }

    return frames;
  }
}
