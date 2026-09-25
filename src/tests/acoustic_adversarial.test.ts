/**
 * @file acoustic_adversarial.test.ts
 * @description Adversarial and Runtime Reality Test Suite for Phase 4 Acoustic Pipeline.
 * Tests:
 * 1. MelSpectrogramExtractor numerical integrity (NaN, Inf, Range, Filterbank)
 * 2. ConstrainedViterbiAligner mathematical trellis sensitivity to evidence
 * 3. Adversarial evidence test: Audio sensitivity audit (revealing simulation vs real model)
 * 4. Silence test (guaranteed fallback to Phase 3 on muted audio)
 * 5. Lexicon diacritic inspection (documenting diacritic stripping behavior)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MelSpectrogramExtractor } from '../application/recitation/acoustic/MelSpectrogramExtractor.ts';
import { QuranPhonemeLexicon } from '../application/recitation/acoustic/QuranPhonemeLexicon.ts';
import { ConstrainedViterbiAligner } from '../application/recitation/acoustic/ConstrainedViterbiAligner.ts';
import { AcousticAlignmentEngine } from '../application/recitation/acoustic/AcousticAlignmentEngine.ts';
import { ConfidenceLevel } from '../domain/confidence/types.ts';

describe('Phase 4 Reality & Adversarial Audit Suite', () => {
  const quranWords = ['بِسْمِ', 'اللَّهِ', 'الرَّحْمَٰنِ', 'الرَّحِيمِ'];

  it('1. MelSpectrogramExtractor: Pure DSP calculations produce zero NaN/Inf with 80 bands', () => {
    const extractor = new MelSpectrogramExtractor({ sampleRate: 16000, numMelBands: 80, fftSize: 512, hopSize: 160 });
    const pcm = new Float32Array(16000); // 1 second
    for (let i = 0; i < pcm.length; i++) {
      pcm[i] = 0.4 * Math.sin((2 * Math.PI * 500 * i) / 16000);
    }

    const frames = extractor.extract(pcm);
    assert.ok(frames.length > 50, `Expected > 50 frames, got ${frames.length}`);

    for (const frame of frames) {
      assert.equal(frame.length, 80, 'Each frame must have exactly 80 Mel bands');
      for (let m = 0; m < 80; m++) {
        assert.ok(!Number.isNaN(frame[m]), 'Mel energy cannot be NaN');
        assert.ok(Number.isFinite(frame[m]), 'Mel energy must be finite');
      }
    }
  });

  it('2. ConstrainedViterbiAligner: Mathematical trellis is genuinely sensitive to contradictory evidence', () => {
    const aligner = new ConstrainedViterbiAligner();
    const lexicon = new QuranPhonemeLexicon();
    const targetTokens = quranWords.flatMap((w) => lexicon.wordToPhonemes(w));
    const wordMapping = quranWords.flatMap((w, idx) => lexicon.wordToPhonemes(w).map(() => idx));

    const T = 60;
    const K = targetTokens.length;

    // A: Strongly supporting evidence (diagonal progression)
    const strongPosteriors = Array.from({ length: T }, (_, t) => {
      const dist: Record<string, number> = {};
      const expected = Math.min(K - 1, Math.floor((t / T) * K));
      for (let k = 0; k < K; k++) {
        dist[targetTokens[k].phonemeId] = k === expected ? 0.95 : 0.01;
      }
      return dist;
    });
    const strongResult = aligner.align(strongPosteriors, targetTokens, wordMapping);

    // B: Contradictory evidence (reversed progression)
    const contradictoryPosteriors = Array.from({ length: T }, (_, t) => {
      const dist: Record<string, number> = {};
      const wrong = K - 1 - Math.min(K - 1, Math.floor((t / T) * K));
      for (let k = 0; k < K; k++) {
        dist[targetTokens[k].phonemeId] = k === wrong ? 0.95 : 0.01;
      }
      return dist;
    });
    const contradictoryResult = aligner.align(contradictoryPosteriors, targetTokens, wordMapping);

    // Verify mathematical sensitivity: Viterbi collapses score on contradictory acoustic evidence
    assert.ok(
      strongResult.overallAcousticScore > contradictoryResult.overallAcousticScore,
      `Strong score (${strongResult.overallAcousticScore}) must exceed contradictory score (${contradictoryResult.overallAcousticScore})`
    );
    assert.equal(contradictoryResult.isFallbackRequired, true, 'Contradictory evidence must trigger fallback requirement');
  });

  it('3. Adversarial Reality Check: generateAcousticPosteriors is uncoupled from acoustic spectral content (Simulation)', () => {
    const engine = new AcousticAlignmentEngine();

    // Audio A: Harmonic Tone
    const tonePcm = new Float32Array(32000);
    for (let i = 0; i < tonePcm.length; i++) {
      tonePcm[i] = 0.3 * Math.sin((2 * Math.PI * 300 * i) / 16000);
    }

    // Audio B: Pure White Noise with equal RMS
    const noisePcm = new Float32Array(32000);
    for (let i = 0; i < noisePcm.length; i++) {
      noisePcm[i] = (Math.random() * 2 - 1) * 0.3;
    }

    const toneResult = engine.alignRecitation(tonePcm, quranWords);
    const noiseResult = engine.alignRecitation(noisePcm, quranWords);

    // Technical Reality Evidence: Score difference between speech tone and random noise is zero/negligible
    const delta = Math.abs(toneResult.averageAcousticScore - noiseResult.averageAcousticScore);
    assert.ok(
      delta < 0.05,
      `Acoustic score delta (${delta}) reveals posterior generation is driven by synthetic Gaussian progression, not Conformer neural inference.`
    );
  });

  it('4. Silence Test: Zero PCM strictly collapses posteriors and forces Phase 3 Fallback', () => {
    const engine = new AcousticAlignmentEngine();
    const silencePcm = new Float32Array(32000); // Complete silence

    const result = engine.alignRecitation(silencePcm, quranWords);
    assert.equal(result.engineMode, 'FALLBACK_HEURISTIC_TIER1');
    assert.equal(result.overallConfidence, ConfidenceLevel.LOW);
    assert.ok(result.averageAcousticScore < 0.2);
    assert.ok(result.wordTimings.every((w) => w.isUncertain));
  });

  it('5. QuranPhonemeLexicon: Diacritics stripping audit confirms consonants-only target sequence', () => {
    const lexicon = new QuranPhonemeLexicon();
    const tokens = lexicon.wordToPhonemes('بِسْمِ');

    // Expected letters: BAA, SEEN, MEEM
    const ids = tokens.map((t) => t.phonemeId);
    assert.deepEqual(ids, ['BAA', 'SEEN', 'MEEM']);

    // Vowels like KASRAH are stripped and not present in tokens
    assert.ok(!ids.includes('KASRAH'), 'Diacritics are currently stripped from alignment target');
  });
});
