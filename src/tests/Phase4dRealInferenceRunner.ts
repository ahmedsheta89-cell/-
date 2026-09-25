/**
 * @file Phase4dRealInferenceRunner.ts
 * @module tests
 * @description Hardened inference runner for Phase 4D.1.
 * Supports exact Kaldi FBank extraction as primary pipeline and retains generic Mel
 * extractor for comparative regression gating.
 */

import fs from 'fs';
import * as ort from 'onnxruntime-node';
import { KaldiFbankExtractor } from '../infrastructure/acoustic/KaldiFbankExtractor.js';
import { MelSpectrogramExtractor } from '../application/recitation/acoustic/MelSpectrogramExtractor.js';

export interface DecodedToken {
  symbol: string;
  tokenId: number;
  confidence: number;
  marginPeak: number;
  timeSeconds: number;
  frameIndex: number;
}

export interface TestResult {
  name: string;
  extractorType: 'kaldi' | 'mel';
  durationSec: number;
  rms: number;
  inferenceTimeMs: number;
  frameCount: number;
  totalTokensEmitted: number;
  blankRatio: number;
  decodedSequence: string;
  uniqueTokens: number;
  topTokens: Array<{ token: string; count: number }>;
  meanTopProb: number;
  decodedTokens: DecodedToken[];
  chunkLatenciesMs?: number[];
  rtf?: number;
}

export class Phase4dRealInferenceRunner {
  private session: ort.InferenceSession | null = null;
  private tokens: string[] = [];
  private kaldiExtractor: KaldiFbankExtractor;
  private melExtractor: MelSpectrogramExtractor;

  constructor() {
    this.kaldiExtractor = new KaldiFbankExtractor();
    this.melExtractor = new MelSpectrogramExtractor({
      sampleRate: 16000,
      fftSize: 512,
      hopSize: 160,
      numMelBands: 80,
      fMin: 50,
      fMax: 8000
    });
  }

  public async initialize(modelPath: string, tokensPath: string): Promise<void> {
    const t0 = Date.now();
    const InferenceSession = ort.InferenceSession || (ort as any).default.InferenceSession;
    this.session = await InferenceSession.create(modelPath);
    const loadMs = Date.now() - t0;
    console.log(`[Phase4D.1] Model loaded into ONNXRuntime in ${loadMs} ms`);

    const rawTokens = fs.readFileSync(tokensPath, 'utf-8');
    this.tokens = new Array(251).fill('<unk>');
    for (const line of rawTokens.split('\n')) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 2) {
        const symbol = parts[0];
        const id = parseInt(parts[1], 10);
        if (!isNaN(id)) {
          this.tokens[id] = symbol;
        }
      }
    }
    console.log(`[Phase4D.1] Loaded ${this.tokens.length} token symbols from tokens.txt`);
  }

  public readWav(filePath: string): Float32Array {
    const buffer = fs.readFileSync(filePath);
    const data = buffer.subarray(44);
    const int16 = new Int16Array(data.buffer, data.byteOffset, data.length / 2);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768.0;
    }
    return float32;
  }

  public generateSynthetic(type: 'silence' | 'white_noise' | 'sine_tone', durationSec = 3.0): Float32Array {
    const samples = Math.floor(durationSec * 16000);
    const pcm = new Float32Array(samples);
    if (type === 'silence') {
      return pcm;
    } else if (type === 'white_noise') {
      for (let i = 0; i < samples; i++) {
        pcm[i] = (Math.random() * 2 - 1) * 0.08;
      }
    } else if (type === 'sine_tone') {
      const freq = 440;
      for (let i = 0; i < samples; i++) {
        pcm[i] = Math.sin((2 * Math.PI * freq * i) / 16000) * 0.15;
      }
    }
    return pcm;
  }

  public async runInferenceOnPcm(
    pcm: Float32Array,
    label: string,
    extractorType: 'kaldi' | 'mel' = 'kaldi',
    carryStates = true,
    flushChunk = true
  ): Promise<TestResult> {
    if (!this.session) {
      throw new Error('Model not initialized');
    }

    let sumSq = 0;
    for (let i = 0; i < pcm.length; i++) sumSq += pcm[i] * pcm[i];
    const rms = Math.sqrt(sumSq / (pcm.length || 1));
    const durationSec = pcm.length / 16000;

    // Feature extraction based on selected pipeline
    const frames = extractorType === 'kaldi'
      ? this.kaldiExtractor.extract(pcm)
      : this.melExtractor.extract(pcm);
    const numFrames = frames.length;

    const chunkFrames = 61;
    let states = this.initStates();
    let processedLens = 0n;

    const emittedTokens: number[] = [];
    const emittedLogProbs: number[] = [];
    const blankId = 250;
    let blankCount = 0;
    let totalOutputSteps = 0;

    const tInf0 = Date.now();

    const totalFramesToProcess = flushChunk ? numFrames + chunkFrames : numFrames;

    const chunkLatenciesMs: number[] = [];
    const emittedMargins: number[] = [];

    for (let offset = 0; offset < totalFramesToProcess; offset += chunkFrames) {
      const chunk = new Float32Array(1 * chunkFrames * 80);
      for (let f = 0; f < chunkFrames; f++) {
        const frameIdx = offset + f;
        if (frameIdx < numFrames) {
          const m = frames[frameIdx];
          for (let b = 0; b < 80; b++) {
            chunk[f * 80 + b] = m[b];
          }
        } else {
          // Trailing padding with silence log energy
          for (let b = 0; b < 80; b++) {
            chunk[f * 80 + b] = -15.9;
          }
        }
      }

      const feeds: Record<string, ort.Tensor> = {};
      feeds['x'] = new ort.Tensor('float32', chunk, [1, chunkFrames, 80]);

      for (const [key, tensor] of Object.entries(states)) {
        feeds[key] = tensor;
      }
      feeds['processed_lens'] = new ort.Tensor('int64', new BigInt64Array([processedLens]), [1]);

      const tChunk0 = Date.now();
      const outputs = await this.session.run(feeds);
      chunkLatenciesMs.push(Date.now() - tChunk0);

      if (carryStates) {
        states = this.extractNewStates(outputs);
      } else {
        states = this.initStates();
      }
      processedLens += BigInt(chunkFrames);

      const logProbsTensor = outputs['log_probs'];
      const logProbsData = logProbsTensor.data as Float32Array;
      const dims = logProbsTensor.dims;
      const T = dims[1];
      const V = dims[2];

      for (let t = 0; t < T; t++) {
        let maxVal = -Infinity;
        let secondVal = -Infinity;
        let maxIdx = 0;
        for (let v = 0; v < V; v++) {
          const val = logProbsData[t * V + v];
          if (val > maxVal) {
            secondVal = maxVal;
            maxVal = val;
            maxIdx = v;
          } else if (val > secondVal) {
            secondVal = val;
          }
        }
        emittedTokens.push(maxIdx);
        const topP = Math.exp(maxVal);
        const secP = secondVal > -Infinity ? Math.exp(secondVal) : 0;
        emittedLogProbs.push(topP);
        emittedMargins.push(topP - secP);
        if (maxIdx === blankId) blankCount++;
        totalOutputSteps++;
      }
    }

    const inferenceTimeMs = Date.now() - tInf0;

    // CTC Greedy Collapse with detailed token tracking
    const collapsedTokens: number[] = [];
    const decodedTokens: DecodedToken[] = [];
    let prev = -1;
    for (let i = 0; i < emittedTokens.length; i++) {
      const tid = emittedTokens[i];
      if (tid !== prev) {
        if (tid !== blankId && tid !== 0) {
          collapsedTokens.push(tid);
          const sym = this.tokens[tid] || `[${tid}]`;
          const prob = emittedLogProbs[i] || 0.9;
          const margin = emittedMargins[i] !== undefined ? emittedMargins[i] : 0.85;
          decodedTokens.push({
            symbol: sym,
            tokenId: tid,
            confidence: parseFloat(prob.toFixed(4)),
            marginPeak: parseFloat(margin.toFixed(4)),
            timeSeconds: parseFloat((i * 0.05).toFixed(3)),
            frameIndex: i,
          });
        }
        prev = tid;
      }
    }

    const decodedSequence = collapsedTokens.map(id => this.tokens[id] || `[${id}]`).join('');

    const tokenCounts = new Map<string, number>();
    for (const tid of collapsedTokens) {
      const sym = this.tokens[tid] || `[${tid}]`;
      tokenCounts.set(sym, (tokenCounts.get(sym) || 0) + 1);
    }
    const topTokens = Array.from(tokenCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([token, count]) => ({ token, count }));

    const meanTopProb = emittedLogProbs.length > 0
      ? emittedLogProbs.reduce((a, b) => a + b, 0) / emittedLogProbs.length
      : 0;

    const blankRatio = blankCount / (totalOutputSteps || 1);
    const rtf = durationSec > 0 ? parseFloat((inferenceTimeMs / 1000 / durationSec).toFixed(4)) : 0;

    return {
      name: label,
      extractorType,
      durationSec: parseFloat(durationSec.toFixed(2)),
      rms: parseFloat(rms.toFixed(4)),
      inferenceTimeMs,
      frameCount: numFrames,
      totalTokensEmitted: collapsedTokens.length,
      blankRatio: parseFloat(blankRatio.toFixed(3)),
      decodedSequence,
      uniqueTokens: tokenCounts.size,
      topTokens,
      meanTopProb: parseFloat(meanTopProb.toFixed(4)),
      decodedTokens,
      chunkLatenciesMs,
      rtf,
    };
  }

  public async runFullSuite(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // Real audio test cases
    const alafasyWav = this.readWav('audio_samples/alafasy_001001_16k.wav');
    const husaryWav = this.readWav('audio_samples/husary_001001_16k.wav');

    // Synthetic adversarial test cases
    const silence = this.generateSynthetic('silence', 3.0);
    const noise = this.generateSynthetic('white_noise', 3.0);
    const tone = this.generateSynthetic('sine_tone', 3.0);

    results.push(await this.runInferenceOnPcm(alafasyWav, 'Alafasy Recitation 001001 (Real Audio - Kaldi FBank)', 'kaldi'));
    results.push(await this.runInferenceOnPcm(husaryWav, 'Husary Recitation 001001 (Real Audio - Kaldi FBank)', 'kaldi'));
    results.push(await this.runInferenceOnPcm(silence, 'Digital Silence (Adversarial - Kaldi FBank)', 'kaldi'));
    results.push(await this.runInferenceOnPcm(noise, 'White Noise (Adversarial - Kaldi FBank)', 'kaldi'));
    results.push(await this.runInferenceOnPcm(tone, '440Hz Sine Tone (Adversarial - Kaldi FBank)', 'kaldi'));

    return results;
  }

  public initStates(): Record<string, ort.Tensor> {
    const key_dims = [
      [256, 128], [256, 128], [128, 128], [128, 128],
      [64, 128], [64, 128], [64, 128], [32, 256],
      [32, 256], [32, 256], [32, 256], [64, 128],
      [64, 128], [64, 128], [128, 128], [128, 128]
    ];
    const nonlin_dims = [
      [1, 256, 144], [1, 256, 144], [1, 128, 192], [1, 128, 192],
      [1, 64, 288], [1, 64, 288], [1, 64, 288], [1, 32, 384],
      [1, 32, 384], [1, 32, 384], [1, 32, 384], [1, 64, 288],
      [1, 64, 288], [1, 64, 288], [1, 128, 192], [1, 128, 192]
    ];
    const val_dims = [
      [256, 48], [256, 48], [128, 48], [128, 48],
      [64, 48], [64, 48], [64, 48], [32, 96],
      [32, 96], [32, 96], [32, 96], [64, 48],
      [64, 48], [64, 48], [128, 48], [128, 48]
    ];
    const conv_dims = [
      [192, 15], [192, 15], [256, 15], [256, 15],
      [384, 7], [384, 7], [384, 7], [512, 7],
      [512, 7], [512, 7], [512, 7], [384, 7],
      [384, 7], [384, 7], [256, 15], [256, 15]
    ];

    const states: Record<string, ort.Tensor> = {};
    for (let i = 0; i < 16; i++) {
      const [kd0, kd1] = key_dims[i];
      states[`cached_key_${i}`] = new ort.Tensor('float32', new Float32Array(kd0 * 1 * kd1), [kd0, 1, kd1]);

      const [nd0, nd1, nd2] = nonlin_dims[i];
      states[`cached_nonlin_attn_${i}`] = new ort.Tensor('float32', new Float32Array(nd0 * 1 * nd1 * nd2), [nd0, 1, nd1, nd2]);

      const [vd0, vd1] = val_dims[i];
      states[`cached_val1_${i}`] = new ort.Tensor('float32', new Float32Array(vd0 * 1 * vd1), [vd0, 1, vd1]);
      states[`cached_val2_${i}`] = new ort.Tensor('float32', new Float32Array(vd0 * 1 * vd1), [vd0, 1, vd1]);

      const [cd0, cd1] = conv_dims[i];
      states[`cached_conv1_${i}`] = new ort.Tensor('float32', new Float32Array(1 * cd0 * cd1), [1, cd0, cd1]);
      states[`cached_conv2_${i}`] = new ort.Tensor('float32', new Float32Array(1 * cd0 * cd1), [1, cd0, cd1]);
    }
    states['embed_states'] = new ort.Tensor('float32', new Float32Array(1 * 128 * 3 * 19), [1, 128, 3, 19]);
    return states;
  }

  public extractNewStates(outputs: Record<string, ort.Tensor>): Record<string, ort.Tensor> {
    const states: Record<string, ort.Tensor> = {};
    for (let i = 0; i < 16; i++) {
      states[`cached_key_${i}`] = outputs[`new_cached_key_${i}`];
      states[`cached_nonlin_attn_${i}`] = outputs[`new_cached_nonlin_attn_${i}`];
      states[`cached_val1_${i}`] = outputs[`new_cached_val1_${i}`];
      states[`cached_val2_${i}`] = outputs[`new_cached_val2_${i}`];
      states[`cached_conv1_${i}`] = outputs[`new_cached_conv1_${i}`];
      states[`cached_conv2_${i}`] = outputs[`new_cached_conv2_${i}`];
    }
    states['embed_states'] = outputs['new_embed_states'];
    return states;
  }
}
