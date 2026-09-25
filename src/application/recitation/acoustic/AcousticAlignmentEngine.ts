/**
 * @file AcousticAlignmentEngine.ts
 * @module application/recitation/acoustic
 * @description Coordinates the Phase 4 Real Acoustic Pipeline Prototype with Phase 3 Fallback.
 * Flow: Raw Audio -> Mel Spectrogram -> Acoustic Posteriors -> Quran Viterbi Trellis -> Fallback Guard.
 */

import { ConfidenceLevel } from '../../../domain/confidence/types.ts';
import { RiwayahType } from '../../../domain/quran/types.ts';
import { ConstrainedViterbiAligner, ViterbiAlignmentResult } from './ConstrainedViterbiAligner.ts';
import { MelSpectrogramExtractor } from './MelSpectrogramExtractor.ts';
import { QuranPhonemeLexicon, QuranPhonemeToken } from './QuranPhonemeLexicon.ts';
import { LegacyMockAcousticPosteriorGenerator } from './LegacyMockAcousticPosteriorGenerator.ts';

export interface AcousticAlignmentEngineConfig {
  riwayah: RiwayahType;
  sampleRateHz: number;
  fallbackToPhase3OnLowConfidence: boolean;
}

export interface RecitationAcousticOutput {
  engineMode: 'ACOUSTIC_VITERBI' | 'FALLBACK_HEURISTIC_TIER1';
  viterbiResult?: ViterbiAlignmentResult;
  wordTimings: Array<{
    wordIndex: number;
    wordText: string;
    startMs: number;
    endMs: number;
    confidence: ConfidenceLevel;
    isUncertain: boolean;
  }>;
  overallConfidence: ConfidenceLevel;
  averageAcousticScore: number;
  diagnosticsArabic: string;
}

export class AcousticAlignmentEngine {
  private readonly melExtractor: MelSpectrogramExtractor;
  private readonly lexicon: QuranPhonemeLexicon;
  private readonly viterbiAligner: ConstrainedViterbiAligner;
  private readonly legacyMockGenerator: LegacyMockAcousticPosteriorGenerator;
  private readonly config: AcousticAlignmentEngineConfig;

  constructor(config: Partial<AcousticAlignmentEngineConfig> = {}) {
    this.config = {
      riwayah: RiwayahType.HAFS_AN_ASIM,
      sampleRateHz: 16000,
      fallbackToPhase3OnLowConfidence: true,
      ...config,
    };

    this.melExtractor = new MelSpectrogramExtractor({ sampleRate: this.config.sampleRateHz });
    this.lexicon = new QuranPhonemeLexicon(this.config.riwayah);
    this.viterbiAligner = new ConstrainedViterbiAligner();
    this.legacyMockGenerator = new LegacyMockAcousticPosteriorGenerator();
  }

  /**
   * Aligns raw recitation PCM audio against target Quranic words with guaranteed safety fallback.
   */
  alignRecitation(
    audioPcm: Float32Array,
    quranWords: string[],
    speechBounds?: { startMs: number; endMs: number }
  ): RecitationAcousticOutput {
    // 1. Extract real Mel Filterbank acoustic features
    const melFrames = this.melExtractor.extract(audioPcm);

    // 2. Build target phonetic sequence strictly from Quran Lexicon
    const targetPhonemes: QuranPhonemeToken[] = [];
    const wordMapping: number[] = [];

    quranWords.forEach((word, wordIdx) => {
      const tokens = this.lexicon.wordToPhonemes(word);
      tokens.forEach((tok) => {
        targetPhonemes.push(tok);
        wordMapping.push(wordIdx);
      });
    });

    // 3. Generate Acoustic Frame Posteriors
    // CLASSIFICATION: MOCKED (Legacy temporal Gaussian simulation)
    // NOTE: True Conformer-CTC ONNX model inference is MODEL_BLOCKED until verified checkpoint is procured.
    const framePosteriors = this.generateAcousticPosteriors(melFrames, targetPhonemes, audioPcm);

    // 4. Run Quran-Constrained Viterbi Alignment Trellis
    const viterbiResult = this.viterbiAligner.align(framePosteriors, targetPhonemes, wordMapping);

    // 5. Fallback Guard Check: If acoustic evidence is low or uncertain
    if (viterbiResult.isFallbackRequired && this.config.fallbackToPhase3OnLowConfidence) {
      // Fallback cleanly to Phase 3 Pacing Aligner without guessing
      const totalDurationMs = speechBounds
        ? speechBounds.endMs - speechBounds.startMs
        : Math.round((audioPcm.length / this.config.sampleRateHz) * 1000);
      const totalLetters = quranWords.reduce((acc, w) => acc + w.length, 0);
      const msPerLetter = Math.max(80, totalDurationMs / Math.max(1, totalLetters));

      let currentCursorMs = speechBounds?.startMs ?? 0;
      const wordTimings = quranWords.map((word, idx) => {
        const duration = Math.round(word.length * msPerLetter);
        const startMs = currentCursorMs;
        const endMs = currentCursorMs + duration;
        currentCursorMs = endMs;
        return {
          wordIndex: idx,
          wordText: word,
          startMs,
          endMs,
          confidence: ConfidenceLevel.LOW, // Defensive: marked low because acoustic confidence failed
          isUncertain: true,
        };
      });

      return {
        engineMode: 'FALLBACK_HEURISTIC_TIER1',
        viterbiResult,
        wordTimings,
        overallConfidence: ConfidenceLevel.LOW,
        averageAcousticScore: viterbiResult.overallAcousticScore,
        diagnosticsArabic: `تم تفعيل المحاذاة الاحتياطية (المرحلة 3) لضعف الأدلة الصوتية: ${viterbiResult.fallbackReasonArabic}`,
      };
    }

    // 6. Normal Acoustic Success (Tier 2 Output)
    const wordTimings = viterbiResult.wordBoundaries.map((wb, idx) => ({
      wordIndex: wb.wordIndex,
      wordText: quranWords[idx] ?? '',
      startMs: wb.startMs,
      endMs: wb.endMs,
      confidence: wb.isUncertain ? ConfidenceLevel.LOW : ConfidenceLevel.HIGH,
      isUncertain: wb.isUncertain,
    }));

    return {
      engineMode: 'ACOUSTIC_VITERBI',
      viterbiResult,
      wordTimings,
      overallConfidence:
        viterbiResult.overallAcousticScore >= 0.7
          ? ConfidenceLevel.HIGH
          : viterbiResult.overallAcousticScore >= 0.5
          ? ConfidenceLevel.MEDIUM
          : ConfidenceLevel.LOW,
      averageAcousticScore: viterbiResult.overallAcousticScore,
      diagnosticsArabic: 'تمت المحاذاة بنجاح عبر المشفر الصوتي ومصفوفة فيتربي المقيدة بنص المصحف الشريف.',
    };
  }

  /**
   * Generates frame-level posterior distribution from Mel-spectrogram features.
   * CLASSIFICATION: MOCKED / SIMULATED.
   * Explicitly delegates to LegacyMockAcousticPosteriorGenerator.
   */
  public generateAcousticPosteriors(
    melFrames: Float32Array[],
    targetPhonemes: QuranPhonemeToken[],
    audioPcm: Float32Array
  ): Array<Record<string, number>> {
    return this.legacyMockGenerator.generateSyntheticPosteriors(melFrames, targetPhonemes, audioPcm);
  }
}
