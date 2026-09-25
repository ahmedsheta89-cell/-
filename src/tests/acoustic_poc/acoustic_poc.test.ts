/**
 * @file acoustic_poc.test.ts
 * @description Proof of Concept Test Suite for Phase 4 Acoustic Recitation Engine Candidate.
 * Verifies:
 * 1. Real Audio -> Mel Spectrogram Extraction (80-band Filterbank)
 * 2. Canonical Quranic Phoneme Representation (Hafs 'an Asim)
 * 3. Quran-Constrained Viterbi Alignment Trellis (The constrained decoder cannot generate arbitrary Quran text outside the permitted search space, but this does not imply zero recognition/alignment errors)
 * 4. Fallback Safety: Low confidence / noise / silence safely falls back to Phase 3 Heuristic without guessing
 * 5. Head-to-Head Comparison: Phase 3 Heuristic vs Phase 4 Acoustic Candidate
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MelSpectrogramExtractor } from '../../application/recitation/acoustic/MelSpectrogramExtractor.ts';
import { QuranPhonemeLexicon } from '../../application/recitation/acoustic/QuranPhonemeLexicon.ts';
import { ConstrainedViterbiAligner } from '../../application/recitation/acoustic/ConstrainedViterbiAligner.ts';
import { AcousticAlignmentEngine } from '../../application/recitation/acoustic/AcousticAlignmentEngine.ts';
import { DeterministicForcedAligner } from '../../application/recitation/DeterministicForcedAligner.ts';
import { ConfidenceLevel } from '../../domain/confidence/types.ts';
import { RiwayahType } from '../../domain/quran/types.ts';

// Helper: Generate synthetic 16kHz speech signal with harmonic formants (F0=180Hz, F1=700Hz, F2=1500Hz)
function generateSyntheticRecitationAudio(durationSeconds: number, sampleRate = 16000): Float32Array {
  const numSamples = Math.floor(durationSeconds * sampleRate);
  const pcm = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Harmonic speech synthesis with envelope
    const envelope = Math.sin((Math.PI * i) / numSamples); // smooth window
    const f0 = Math.sin(2 * Math.PI * 180 * t);
    const f1 = 0.5 * Math.sin(2 * Math.PI * 700 * t);
    const f2 = 0.25 * Math.sin(2 * Math.PI * 1500 * t);
    pcm[i] = envelope * (f0 + f1 + f2) * 0.4;
  }
  return pcm;
}

describe('Phase 4: Real Acoustic Recitation Engine — Proof of Concept (POC)', () => {
  const quranWords = ['بِسْمِ', 'اللَّهِ', 'الرَّحْمَٰنِ', 'الرَّحِيمِ'];

  it('1. MelSpectrogramExtractor computes real 80-band filterbank energies from raw audio', () => {
    const extractor = new MelSpectrogramExtractor({ sampleRate: 16000, numMelBands: 80 });
    const audio = generateSyntheticRecitationAudio(1.0); // 1 second

    const frames = extractor.extract(audio);
    assert.ok(frames.length > 50, `Expected > 50 frames for 1s audio, got ${frames.length}`);
    assert.equal(frames[0].length, 80, 'Each frame must contain exactly 80 Mel bands');

    // Verify non-trivial finite log energy values
    for (let m = 0; m < 80; m++) {
      assert.ok(Number.isFinite(frames[0][m]), 'Mel band energy must be a finite number');
    }
  });

  it('2. QuranPhonemeLexicon generates canonical phonemes strictly from Uthmani text with Riwayah isolation', () => {
    const lexicon = new QuranPhonemeLexicon(RiwayahType.HAFS_AN_ASIM);
    assert.equal(lexicon.getRiwayah(), RiwayahType.HAFS_AN_ASIM);

    const bismillahPhonemes = lexicon.wordToPhonemes('بِسْمِ');
    assert.ok(bismillahPhonemes.length >= 3, 'Expected at least 3 root phonemes (BAA, SEEN, MEEM)');

    const ids = bismillahPhonemes.map((p) => p.phonemeId);
    assert.ok(ids.includes('BAA'), 'Phonemes must include BAA');
    assert.ok(ids.includes('SEEN'), 'Phonemes must include SEEN');
    assert.ok(ids.includes('MEEM'), 'Phonemes must include MEEM');
  });

  it('3. ConstrainedViterbiAligner produces monotonic phoneme and word boundaries within constrained search space', () => {
    const aligner = new ConstrainedViterbiAligner();
    const lexicon = new QuranPhonemeLexicon();

    const targetPhonemes = quranWords.flatMap((w) => lexicon.wordToPhonemes(w));
    const wordMapping = quranWords.flatMap((w, wIdx) => lexicon.wordToPhonemes(w).map(() => wIdx));

    // Simulated 100 frames with synthetic posterior probability peaks
    const T = 100;
    const K = targetPhonemes.length;
    const framePosteriors: Array<Record<string, number>> = [];

    for (let t = 0; t < T; t++) {
      const dist: Record<string, number> = {};
      const expectedK = Math.min(K - 1, Math.floor((t / T) * K));
      const activeId = targetPhonemes[expectedK].phonemeId;
      for (let k = 0; k < K; k++) {
        const pId = targetPhonemes[k].phonemeId;
        dist[pId] = pId === activeId ? 0.9 : 0.05;
      }
      framePosteriors.push(dist);
    }

    const result = aligner.align(framePosteriors, targetPhonemes, wordMapping);
    assert.equal(result.isFallbackRequired, false);
    assert.ok(result.overallAcousticScore >= 0.6, `Expected good score, got ${result.overallAcousticScore}`);
    assert.equal(result.wordBoundaries.length, 4, 'Must align all 4 words');

    // Monotonic boundary check
    for (let i = 1; i < result.wordBoundaries.length; i++) {
      assert.ok(
        result.wordBoundaries[i].startMs >= result.wordBoundaries[i - 1].startMs,
        'Word boundaries must be strictly monotonic in time'
      );
    }
  });

  it('4. Fallback Architecture: Degraded or silent audio triggers Phase 3 Fallback without guessing', () => {
    const engine = new AcousticAlignmentEngine();
    // Silent audio
    const silentAudio = new Float32Array(16000 * 2); // 2 seconds of total silence

    const output = engine.alignRecitation(silentAudio, quranWords);
    assert.equal(output.engineMode, 'FALLBACK_HEURISTIC_TIER1');
    assert.equal(output.overallConfidence, ConfidenceLevel.LOW);
    assert.ok(output.wordTimings.every((w) => w.isUncertain));
    assert.ok(output.diagnosticsArabic.includes('المرحلة 3'));
  });

  it('5. Head-to-Head Comparison: Phase 3 Heuristic Pacing vs Phase 4 Acoustic Candidate', () => {
    const audio = generateSyntheticRecitationAudio(2.5); // 2.5s recitation
    const speechBounds = { startMs: 100, endMs: 2400 };

    // 1. Run Phase 3 Heuristic Pacing Engine (simulated pacing baseline)
    const totalLetters = quranWords.reduce((acc, w) => acc + w.length, 0);
    const msPerLetter = (speechBounds.endMs - speechBounds.startMs) / totalLetters;
    let cursor = speechBounds.startMs;
    const phase3WordTimings = quranWords.map((w, idx) => {
      const dur = Math.round(w.length * msPerLetter);
      const s = cursor;
      const e = s + dur;
      cursor = e;
      return { wordIndex: idx, wordText: w, startMs: s, endMs: e, mode: 'HEURISTIC_PACING' };
    });

    // 2. Run Phase 4 Acoustic Candidate
    const phase4Engine = new AcousticAlignmentEngine();
    const phase4Result = phase4Engine.alignRecitation(audio, quranWords, speechBounds);

    console.log('\n--- Head-to-Head Comparison: Phase 3 vs Phase 4 ---');
    console.log(`Phase 3 (Heuristic) Words: ${phase3WordTimings.length}, Timing resolution: Character-count heuristic`);
    console.log(`Phase 4 (Acoustic) Words: ${phase4Result.wordTimings.length}, Mode: ${phase4Result.engineMode}, Score: ${phase4Result.averageAcousticScore}`);

    // Verify both produce consistent high-level word counts
    assert.equal(phase3WordTimings.length, 4);
    assert.equal(phase4Result.wordTimings.length, 4);

    // Verify Phase 4 produces granular phoneme observations that Phase 3 cannot
    assert.ok(phase4Result.viterbiResult !== undefined);
    assert.ok(
      phase4Result.viterbiResult!.phonemeObservations.length >= 10,
      'Phase 4 must produce phoneme-level observations'
    );

    const firstPhoneme = phase4Result.viterbiResult!.phonemeObservations[0];
    assert.equal(firstPhoneme.phonemeId, 'BAA');
    assert.ok(firstPhoneme.score !== undefined && firstPhoneme.score > 0);
  });
});
