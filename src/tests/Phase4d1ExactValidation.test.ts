/**
 * @file Phase4d1ExactValidation.test.ts
 * @module tests
 * @description Formal regression test suite for Phase 4D.1 hardening.
 * Validates exact Kaldi FBank extraction, ONNX 99-tensor contract, streaming cache carry-over,
 * final flush, adversarial rejection, and real audio reproduction.
 */

import fs from 'fs';
import crypto from 'crypto';
import * as ort from 'onnxruntime-node';
import { KaldiFbankExtractor, DEFAULT_KALDI_FBANK_CONFIG } from '../infrastructure/acoustic/KaldiFbankExtractor.js';
import { Phase4dRealInferenceRunner } from './Phase4dRealInferenceRunner.js';

export interface TestResultItem {
  name: string;
  category: string;
  passed: boolean;
  message?: string;
}

export async function runPhase4d1TestSuite(): Promise<TestResultItem[]> {
  const results: TestResultItem[] = [];

  // Helper to record result
  const record = (name: string, passed: boolean, message?: string) => {
    results.push({ name, category: 'Phase 4D.1: Exact Validation', passed, message });
  };

  // -------------------------------------------------------------
  // Test 1: Kaldi FBank Output Dimensions
  // -------------------------------------------------------------
  try {
    const extractor = new KaldiFbankExtractor();
    const pcm1Sec = new Float32Array(16000);
    const frames = extractor.extract(pcm1Sec);
    // With snip_edges=false: floor((16000 + 80) / 160) = 100 frames
    const expectedFrames = Math.floor((16000 + 80) / 160);
    const valid = frames.length === expectedFrames && frames[0].length === 80;
    record(
      'Kaldi FBank Output Dimensions (80 bins, snip_edges=false frame count)',
      valid,
      valid ? undefined : `Expected ${expectedFrames} frames of 80 bins, got ${frames.length}x${frames[0]?.length}`
    );
  } catch (err: any) {
    record('Kaldi FBank Output Dimensions', false, err.message);
  }

  // -------------------------------------------------------------
  // Test 2: Kaldi FBank Deterministic Extraction
  // -------------------------------------------------------------
  try {
    const extractor = new KaldiFbankExtractor();
    const pcm = new Float32Array(8000);
    for (let i = 0; i < 8000; i++) pcm[i] = Math.sin(2 * Math.PI * 440 * (i / 16000));
    const run1 = extractor.extract(pcm);
    const run2 = extractor.extract(pcm);
    let maxDiff = 0;
    for (let f = 0; f < run1.length; f++) {
      for (let b = 0; b < 80; b++) {
        const diff = Math.abs(run1[f][b] - run2[f][b]);
        if (diff > maxDiff) maxDiff = diff;
      }
    }
    const passed = maxDiff === 0;
    record('Kaldi FBank Deterministic Extraction (zero dither)', passed, `Max diff: ${maxDiff}`);
  } catch (err: any) {
    record('Kaldi FBank Deterministic Extraction', false, err.message);
  }

  // -------------------------------------------------------------
  // Test 3: Parameter Configuration & Mathematical Constants
  // -------------------------------------------------------------
  try {
    const cfg = DEFAULT_KALDI_FBANK_CONFIG;
    const windowSize = 16000 * 0.025; // 400
    const windowShift = 16000 * 0.010; // 160
    const melLow = KaldiFbankExtractor.melScale(20);
    const melHigh = KaldiFbankExtractor.melScale(7600);
    const passed =
      cfg.sampleRate === 16000 &&
      cfg.featureDim === 80 &&
      windowSize === 400 &&
      windowShift === 160 &&
      cfg.preemphCoeff === 0.97 &&
      cfg.removeDcOffset === true &&
      cfg.snipEdges === false &&
      Math.abs(melLow - 31.7485) < 0.01 &&
      Math.abs(melHigh - 2786.992) < 0.01;
    record('Parameter Configuration & Kaldi Mel Formulas', passed);
  } catch (err: any) {
    record('Parameter Configuration & Kaldi Mel Formulas', false, err.message);
  }

  // -------------------------------------------------------------
  // Test 4: Checksum & Integrity of Artifacts
  // -------------------------------------------------------------
  try {
    const modelBuf = fs.readFileSync('models/saboorhsn/quran-stt-int8.onnx');
    const modelSha = crypto.createHash('sha256').update(modelBuf).digest('hex');
    const expectedModelSha = '31755836528da336a6192121cd7bc82cb41752dddb65566fd000b89c8686da6b';

    const tokensBuf = fs.readFileSync('models/saboorhsn/tokens.txt');
    const tokensSha = crypto.createHash('sha256').update(tokensBuf).digest('hex');
    const expectedTokensSha = '252c10687e442aa9291973065fae19fa39bcd681c4f5612ec496a647e20b43a1';

    const passed = modelSha === expectedModelSha && tokensSha === expectedTokensSha;
    record(
      'Artifact Integrity SHA-256 Checksums',
      passed,
      passed ? undefined : `Model: ${modelSha}, Tokens: ${tokensSha}`
    );
  } catch (err: any) {
    record('Artifact Integrity SHA-256 Checksums', false, err.message);
  }

  // -------------------------------------------------------------
  // Test 5: ONNX Input/Output Contract (99 Inputs & Fixed T=61)
  // -------------------------------------------------------------
  try {
    const InferenceSession = ort.InferenceSession || (ort as any).default.InferenceSession;
    const session = await InferenceSession.create('models/saboorhsn/quran-stt-int8.onnx');
    const numInputs = session.inputNames.length;
    const numOutputs = session.outputNames.length;
    const hasX = session.inputNames.includes('x');
    const hasLogProbs = session.outputNames.includes('log_probs');
    const hasKeyCache = session.inputNames.includes('cached_key_0') && session.inputNames.includes('cached_key_15');
    const hasProcessedLens = session.inputNames.includes('processed_lens');

    const passed = numInputs === 99 && numOutputs === 99 && hasX && hasLogProbs && hasKeyCache && hasProcessedLens;
    record('ONNX Graph Contract (99 inputs, 99 outputs, cache state names)', passed);
  } catch (err: any) {
    record('ONNX Graph Contract', false, err.message);
  }

  // -------------------------------------------------------------
  // Test 6: Cache Initialization Tensor Shapes
  // -------------------------------------------------------------
  try {
    const runner = new Phase4dRealInferenceRunner();
    const states = runner.initStates();
    const stateKeys = Object.keys(states);
    const key0Dims = states['cached_key_0'].dims;
    const embedDims = states['embed_states'].dims;
    const passed =
      stateKeys.length === 97 && // 96 cache tensors + embed_states
      key0Dims[0] === 256 &&
      key0Dims[1] === 1 &&
      key0Dims[2] === 128 &&
      embedDims[0] === 1 &&
      embedDims[1] === 128 &&
      embedDims[2] === 3 &&
      embedDims[3] === 19;
    record('Cache Initialization Shapes & Dimension Alignment', passed);
  } catch (err: any) {
    record('Cache Initialization Shapes', false, err.message);
  }

  // -------------------------------------------------------------
  // Test 7: Cache State Carry-Over vs Zeroed State Rejection
  // -------------------------------------------------------------
  try {
    const runner = new Phase4dRealInferenceRunner();
    await runner.initialize('models/saboorhsn/quran-stt-int8.onnx', 'models/saboorhsn/tokens.txt');
    const alafasyPcm = runner.readWav('audio_samples/alafasy_001001_16k.wav');

    // Run with cache carry-over
    const carryResult = await runner.runInferenceOnPcm(alafasyPcm, 'Carry Over', 'kaldi', true, false);
    // Run with zeroed cache (adversarial broken streaming)
    const zeroResult = await runner.runInferenceOnPcm(alafasyPcm, 'Zero Cache', 'kaldi', false, false);

    const passed =
      carryResult.decodedSequence.length > 20 &&
      zeroResult.decodedSequence.length < carryResult.decodedSequence.length &&
      carryResult.meanTopProb > zeroResult.meanTopProb;
    record(
      'Cache State Carry-Over vs Zeroed State Phoneme Decay',
      passed,
      `Carry seq: "${carryResult.decodedSequence}", Zero seq: "${zeroResult.decodedSequence}"`
    );
  } catch (err: any) {
    record('Cache State Carry-Over vs Zeroed State', false, err.message);
  }

  // -------------------------------------------------------------
  // Test 8: Trailing Audio Flush Verification
  // -------------------------------------------------------------
  try {
    const runner = new Phase4dRealInferenceRunner();
    await runner.initialize('models/saboorhsn/quran-stt-int8.onnx', 'models/saboorhsn/tokens.txt');
    const alafasyPcm = runner.readWav('audio_samples/alafasy_001001_16k.wav');

    const flushResult = await runner.runInferenceOnPcm(alafasyPcm, 'With Flush', 'kaldi', true, true);
    const noFlushResult = await runner.runInferenceOnPcm(alafasyPcm, 'Without Flush', 'kaldi', true, false);

    // Both should decode Basmalah, but flush preserves complete tail ending
    const passed =
      flushResult.decodedSequence.includes('م') &&
      flushResult.meanTopProb >= noFlushResult.meanTopProb - 0.001;
    record('Trailing Audio Flush Mechanism', passed);
  } catch (err: any) {
    record('Trailing Audio Flush Mechanism', false, err.message);
  }

  // -------------------------------------------------------------
  // Test 9: Blank Token Rejection on Synthetic Audio
  // -------------------------------------------------------------
  try {
    const runner = new Phase4dRealInferenceRunner();
    await runner.initialize('models/saboorhsn/quran-stt-int8.onnx', 'models/saboorhsn/tokens.txt');
    const silence = runner.generateSynthetic('silence', 2.0);
    const tone = runner.generateSynthetic('sine_tone', 2.0);
    const noise = runner.generateSynthetic('white_noise', 2.0);

    const silenceRes = await runner.runInferenceOnPcm(silence, 'Silence', 'kaldi');
    const toneRes = await runner.runInferenceOnPcm(tone, 'Tone', 'kaldi');
    const noiseRes = await runner.runInferenceOnPcm(noise, 'Noise', 'kaldi');

    const passed =
      silenceRes.decodedSequence.length === 0 &&
      silenceRes.blankRatio === 1.0 &&
      toneRes.decodedSequence.length === 0 &&
      toneRes.blankRatio === 1.0 &&
      noiseRes.decodedSequence.length === 0 &&
      noiseRes.blankRatio === 1.0;
    record('Adversarial Silence & Noise 100% Blank Rejection', passed);
  } catch (err: any) {
    record('Adversarial Silence & Noise Blank Rejection', false, err.message);
  }

  // -------------------------------------------------------------
  // Test 10: Real Audio Regression (Alafasy & Husary)
  // -------------------------------------------------------------
  try {
    const runner = new Phase4dRealInferenceRunner();
    await runner.initialize('models/saboorhsn/quran-stt-int8.onnx', 'models/saboorhsn/tokens.txt');
    const alafasy = runner.readWav('audio_samples/alafasy_001001_16k.wav');
    const husary = runner.readWav('audio_samples/husary_001001_16k.wav');

    const alafasyRes = await runner.runInferenceOnPcm(alafasy, 'Alafasy', 'kaldi');
    const husaryRes = await runner.runInferenceOnPcm(husary, 'Husary', 'kaldi');

    // Both must decode Basmalah tokens and exhibit high confidence (> 0.98)
    const passed =
      alafasyRes.decodedSequence.includes('بِسمِللَااهِ') &&
      alafasyRes.meanTopProb > 0.99 &&
      husaryRes.decodedSequence.includes('بِسمِللَااهِ') &&
      husaryRes.meanTopProb > 0.98;
    record(
      'Real Audio Recitation Regression (Alafasy & Husary Basmalah)',
      passed,
      `Alafasy Conf: ${alafasyRes.meanTopProb}, Husary Conf: ${husaryRes.meanTopProb}`
    );
  } catch (err: any) {
    record('Real Audio Recitation Regression', false, err.message);
  }

  return results;
}
