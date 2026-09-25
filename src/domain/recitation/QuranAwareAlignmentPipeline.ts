/**
 * @file QuranAwareAlignmentPipeline.ts
 * @module domain/recitation
 * @description Master Quran-Aware Alignment & Acoustic Evidence Pipeline for Phase 5A.
 * 
 * ARCHITECTURE:
 * REAL AUDIO 
 *   → REAL KALDI FBANK 
 *   → REAL ZIPFORMER CTC (ONNX Runtime)
 *   → AUDITABLE CTC DECODER 
 *   → PHONEME TIMELINE 
 *   → QURAN CANONICAL PHONEME SEQUENCE (Phase 2 Verified Dataset)
 *   → CONSTRAINED ALIGNMENT (Multi-hypothesis DP)
 *   → EVIDENCE FUSION & SAFETY GATE
 *   → QuranAlignmentEvidence[] (Zero Fiqh/Tajweed classifications)
 */

import path from 'path';
import fs from 'fs';
import * as ort from 'onnxruntime-node';
import { KaldiFbankExtractor } from '../../infrastructure/acoustic/KaldiFbankExtractor.js';
import { AuditableCtcDecoder, RawCtcFrame } from './AuditableCtcDecoder.ts';
import { VerifiedQuranPhonemeProvider } from './VerifiedQuranPhonemeProvider.ts';
import { ConstrainedPhonemeAligner } from './ConstrainedPhonemeAligner.ts';
import { RecitationEvidenceEngine, AudioSignalQuality } from './RecitationEvidenceEngine.ts';
import {
  QuranAlignmentSummary,
  StreamEvidenceType,
  PROVISIONAL_SAFETY_CONFIG,
  ProvisionalSafetyConfig,
} from './quranAlignmentTypes.ts';

export interface PipelineLatencyProfile {
  fbankTimeMs: number;
  onnxInferenceTimeMs: number;
  ctcDecodeTimeMs: number;
  alignmentTimeMs: number;
  evidenceFusionTimeMs: number;
  totalTimeMs: number;
}

export class QuranAwareAlignmentPipeline {
  private session: ort.InferenceSession | null = null;
  private tokens: string[] = [];
  private kaldiExtractor: KaldiFbankExtractor;
  private ctcDecoder: AuditableCtcDecoder | null = null;
  private phonemeProvider: VerifiedQuranPhonemeProvider;
  private aligner: ConstrainedPhonemeAligner;
  private evidenceEngine: RecitationEvidenceEngine;
  private config: ProvisionalSafetyConfig;

  // Streaming Recurrent Cache State
  private streamingStates: Record<string, ort.Tensor> | null = null;
  private processedLens: bigint = BigInt(0);
  private globalFrameOffset: number = 0;

  constructor(config: ProvisionalSafetyConfig = PROVISIONAL_SAFETY_CONFIG) {
    this.config = config;
    this.kaldiExtractor = new KaldiFbankExtractor();
    this.phonemeProvider = VerifiedQuranPhonemeProvider.getInstance();
    this.aligner = new ConstrainedPhonemeAligner({ ambiguityCostMargin: config.ambiguityCostMargin });
    this.evidenceEngine = new RecitationEvidenceEngine(config);
  }

  /**
   * Initialize ONNX Runtime model and load canonical 251 token symbols.
   */
  public async initialize(
    modelPath: string = path.resolve('models/saboorhsn/quran-stt-int8.onnx'),
    tokensPath: string = path.resolve('models/saboorhsn/tokens.txt')
  ): Promise<void> {
    const InferenceSession = ort.InferenceSession || (ort as any).default.InferenceSession;
    this.session = await InferenceSession.create(modelPath);

    const rawTokens = fs.readFileSync(tokensPath, 'utf-8');
    this.tokens = new Array(251).fill('<unk>');
    for (const line of rawTokens.split('\n')) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 2) {
        const sym = parts[0];
        const id = parseInt(parts[1], 10);
        if (!isNaN(id)) {
          this.tokens[id] = sym;
        }
      }
    }

    this.ctcDecoder = new AuditableCtcDecoder({
      blankId: 250,
      secondsPerFrame: 0.05,
      tokensVocab: this.tokens,
    });

    this.resetStreamingState();
  }

  /**
   * Reset streaming state between distinct audio recordings or ayahs.
   */
  public resetStreamingState(): void {
    if (this.ctcDecoder) {
      this.ctcDecoder.reset();
    }
    this.streamingStates = this.initStates();
    this.processedLens = BigInt(0);
    this.globalFrameOffset = 0;
  }

  /**
   * Process a complete audio PCM buffer against a verified Quranic Ayah.
   */
  public async processFullAudio(
    pcm: Float32Array,
    surahNumber: number,
    ayahNumber: number,
    signalQuality?: AudioSignalQuality,
    flushChunk: boolean = true
  ): Promise<{
    summary: QuranAlignmentSummary;
    latencyProfile: PipelineLatencyProfile;
  }> {
    if (!this.session || !this.ctcDecoder) {
      throw new Error('[Phase 5A] Pipeline not initialized. Call initialize() first.');
    }

    const t0 = Date.now();
    this.resetStreamingState();

    // 1. Exact Kaldi 80-bin Filterbank Feature Extraction
    const tFbank0 = Date.now();
    const frames = this.kaldiExtractor.extract(pcm);
    const numFrames = frames.length;
    const tFbank = Date.now() - tFbank0;

    // 2. Real Zipformer CTC ONNX Inference Loop with Cache Carry-Over
    const tOnnx0 = Date.now();
    const rawFrames: RawCtcFrame[] = [];
    const chunkFrames = 61;
    const totalFramesToProcess = flushChunk ? numFrames + chunkFrames : numFrames;

    let states = this.initStates();
    let processedLens = BigInt(0);
    let globalStep = 0;
    let chunkIdx = 0;

    for (let offset = 0; offset < totalFramesToProcess; offset += chunkFrames) {
      const chunk = new Float32Array(chunkFrames * 80);

      for (let f = 0; f < chunkFrames; f++) {
        const frameIdx = offset + f;
        if (frameIdx < numFrames) {
          const m = frames[frameIdx];
          for (let b = 0; b < 80; b++) {
            chunk[f * 80 + b] = m[b];
          }
        } else {
          // Trailing padding with Kaldi log floor (-15.94)
          for (let b = 0; b < 80; b++) {
            chunk[f * 80 + b] = -15.9;
          }
        }
      }

      const feeds: Record<string, ort.Tensor> = {};
      feeds['x'] = new ort.Tensor('float32', chunk, [1, chunkFrames, 80]);
      for (const [k, v] of Object.entries(states)) {
        feeds[k] = v;
      }
      feeds['processed_lens'] = new ort.Tensor('int64', new BigInt64Array([processedLens]), [1]);

      const outputs = await this.session.run(feeds);
      states = this.extractNewStates(outputs);
      processedLens += BigInt(chunkFrames);

      const logProbsTensor = outputs['log_probs'];
      const logProbsData = logProbsTensor.data as Float32Array;
      const dims = logProbsTensor.dims;
      const T = dims[1];
      const V = dims[2];

      for (let t = 0; t < T; t++) {
        let maxVal = -Infinity;
        let secVal = -Infinity;
        let maxIdx = 0;

        for (let v = 0; v < V; v++) {
          const val = logProbsData[t * V + v];
          if (val > maxVal) {
            secVal = maxVal;
            maxVal = val;
            maxIdx = v;
          } else if (val > secVal) {
            secVal = val;
          }
        }

        const topProb = Math.exp(maxVal);
        const secProb = secVal > -Infinity ? Math.exp(secVal) : 0;
        const margin = topProb - secProb;

        rawFrames.push({
          topTokenId: maxIdx,
          topProbability: topProb,
          secondProbability: secProb,
          margin,
          globalFrameIndex: globalStep,
          sourceChunkIndex: chunkIdx,
        });
        globalStep++;
      }
      chunkIdx++;
    }
    const tOnnx = Date.now() - tOnnx0;

    // 3. Auditable CTC Decoding
    const tCtc0 = Date.now();
    this.ctcDecoder.decodeChunk(rawFrames, 0, true);
    const observedTokens = this.ctcDecoder.getAllObservedTokens();
    const tCtc = Date.now() - tCtc0;

    // 4. Query Verified Quran Canonical Sequence (Phase 2 Dataset)
    const canonicalSeq = this.phonemeProvider.getCanonicalSequence(surahNumber, ayahNumber);

    // 5. Constrained Multi-Hypothesis Alignment
    const tAlign0 = Date.now();
    const alignment = this.aligner.align(canonicalSeq.tokens, observedTokens);
    const tAlign = Date.now() - tAlign0;

    // 6. Evidence Fusion & Safety Gating (FINAL_EVIDENCE)
    const tFusion0 = Date.now();
    const audioDurationSec = pcm.length / 16000;
    const summary = this.evidenceEngine.fuseEvidence(
      canonicalSeq,
      alignment,
      'FINAL_EVIDENCE' as StreamEvidenceType,
      signalQuality,
      audioDurationSec
    );
    const tFusion = Date.now() - tFusion0;

    const totalTimeMs = Date.now() - t0;

    return {
      summary,
      latencyProfile: {
        fbankTimeMs: tFbank,
        onnxInferenceTimeMs: tOnnx,
        ctcDecodeTimeMs: tCtc,
        alignmentTimeMs: tAlign,
        evidenceFusionTimeMs: tFusion,
        totalTimeMs,
      },
    };
  }

  // --- State initialization and extraction helpers for ONNX runtime ---
  private initStates(): Record<string, ort.Tensor> {
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

  private extractNewStates(outputs: Record<string, ort.Tensor>): Record<string, ort.Tensor> {
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
