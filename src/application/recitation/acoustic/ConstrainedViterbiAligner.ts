/**
 * @file ConstrainedViterbiAligner.ts
 * @module application/recitation/acoustic
 * @description Constrained Viterbi Alignment Trellis over acoustic frame posteriors.
 * Structural constraint guarantee: The constrained decoder cannot generate arbitrary Quran text outside the permitted search space, but this does not imply zero recognition/alignment errors.
 */

import { ConfidenceLevel } from '../../../domain/confidence/types.ts';
import { PhonemeObservation, PhonemeObservationStatus } from '../../../domain/recitation/phoneticTypes.ts';
import { QuranPhonemeToken } from './QuranPhonemeLexicon.ts';

export interface ViterbiAlignmentResult {
  phonemeObservations: PhonemeObservation[];
  wordBoundaries: Array<{
    wordIndex: number;
    startMs: number;
    endMs: number;
    acousticScore: number;
    isUncertain: boolean;
  }>;
  overallAcousticScore: number;
  isFallbackRequired: boolean;
  fallbackReasonArabic?: string;
}

export interface AlignerConfig {
  frameStepMs: number;               // 10ms per frame
  fallbackPosteriorThreshold: number; // e.g. 0.35 (below which acoustic evidence is considered inconclusive)
}

export const DEFAULT_ALIGNER_CONFIG: AlignerConfig = {
  frameStepMs: 10,
  fallbackPosteriorThreshold: 0.35,
};

export class ConstrainedViterbiAligner {
  private readonly config: AlignerConfig;

  constructor(config: Partial<AlignerConfig> = {}) {
    this.config = { ...DEFAULT_ALIGNER_CONFIG, ...config };
  }

  /**
   * Aligns frame posteriors strictly to the sequence of target Quranic phonemes.
   * @param framePosteriors Array of Map<phonemeId, probability> or Record<phonemeId, number> per frame.
   * @param targetPhonemes Ordered array of expected Quranic phoneme tokens.
   * @param wordTokenMapping Array of word indices matching each phoneme in targetPhonemes.
   */
  align(
    framePosteriors: Array<Record<string, number>>,
    targetPhonemes: QuranPhonemeToken[],
    wordTokenMapping: number[]
  ): ViterbiAlignmentResult {
    const T = framePosteriors.length;
    const K = targetPhonemes.length;

    // Edge case: empty frames or empty target
    if (T === 0 || K === 0) {
      return {
        phonemeObservations: [],
        wordBoundaries: [],
        overallAcousticScore: 0,
        isFallbackRequired: true,
        fallbackReasonArabic: 'تعذر استخراج أطر صوتية كافية للمحاذاة.',
      };
    }

    // If frames are fewer than phonemes, alignment cannot complete reliably
    if (T < K) {
      return {
        phonemeObservations: targetPhonemes.map((p, idx) => ({
          phonemeId: p.phonemeId,
          expectedSymbol: p.arabicSymbol,
          confidence: ConfidenceLevel.LOW,
          status: 'UNCERTAIN' as PhonemeObservationStatus,
          score: 0.1,
        })),
        wordBoundaries: [],
        overallAcousticScore: 0.1,
        isFallbackRequired: true,
        fallbackReasonArabic: 'مدة الصوت أقصر من عدد الفونيمات القرآنية المتوقعة.',
      };
    }

    // 1. Initialize Viterbi Trellis in Log-domain: dp[t][k]
    // dp[t][k] = maximum log-likelihood of aligning frames 0..t to phonemes 0..k
    const NEG_INF = -1e9;
    const dp: Float32Array[] = Array.from({ length: T }, () => new Float32Array(K).fill(NEG_INF));
    const backtrace: Int32Array[] = Array.from({ length: T }, () => new Int32Array(K).fill(-1));

    // Initial state: frame 0 must align to phoneme 0
    const p0 = targetPhonemes[0].phonemeId;
    const prob0 = Math.max(1e-6, framePosteriors[0][p0] ?? 0.01);
    dp[0][0] = Math.log(prob0);

    // 2. Forward Trellis Recursion
    for (let t = 1; t < T; t++) {
      const frame = framePosteriors[t];

      for (let k = 0; k < K; k++) {
        const currentPhonemeId = targetPhonemes[k].phonemeId;
        const currentProb = Math.max(1e-6, frame[currentPhonemeId] ?? 0.01);
        const logProb = Math.log(currentProb);

        // Transition option 1: Stay on same phoneme (self-loop: k -> k)
        let bestPrev = dp[t - 1][k];
        let bestSource = k;

        // Transition option 2: Advance from previous phoneme (k-1 -> k)
        if (k > 0 && dp[t - 1][k - 1] > bestPrev) {
          bestPrev = dp[t - 1][k - 1];
          bestSource = k - 1;
        }

        if (bestPrev > NEG_INF / 2) {
          dp[t][k] = bestPrev + logProb;
          backtrace[t][k] = bestSource;
        }
      }
    }

    // 3. Backtracking: trace from dp[T-1][K-1] back to t=0
    const path: number[] = new Array(T);
    let currentK = K - 1;

    // In case the last state wasn't reached, pick the highest reached state at T-1
    if (dp[T - 1][currentK] <= NEG_INF / 2) {
      let maxK = 0;
      let maxVal = NEG_INF;
      for (let k = 0; k < K; k++) {
        if (dp[T - 1][k] > maxVal) {
          maxVal = dp[T - 1][k];
          maxK = k;
        }
      }
      currentK = maxK;
    }

    for (let t = T - 1; t >= 0; t--) {
      path[t] = currentK;
      currentK = backtrace[t][currentK];
      if (currentK < 0) currentK = 0;
    }

    // 4. Group aligned frames into phoneme durations & scores
    const phonemeStartFrames = new Int32Array(K).fill(-1);
    const phonemeEndFrames = new Int32Array(K).fill(-1);
    const phonemeScoresSum = new Float32Array(K).fill(0);
    const phonemeFrameCounts = new Int32Array(K).fill(0);

    for (let t = 0; t < T; t++) {
      const k = path[t];
      if (phonemeStartFrames[k] === -1) {
        phonemeStartFrames[k] = t;
      }
      phonemeEndFrames[k] = t;

      const pId = targetPhonemes[k].phonemeId;
      const prob = framePosteriors[t][pId] ?? 0.05;
      phonemeScoresSum[k] += prob;
      phonemeFrameCounts[k]++;
    }

    // 5. Construct PhonemeObservations
    const phonemeObservations: PhonemeObservation[] = [];
    let totalScoreSum = 0;
    let scoredPhonemeCount = 0;

    for (let k = 0; k < K; k++) {
      const token = targetPhonemes[k];
      const count = phonemeFrameCounts[k];
      const avgScore = count > 0 ? phonemeScoresSum[k] / count : 0;
      const startMs = phonemeStartFrames[k] >= 0 ? phonemeStartFrames[k] * this.config.frameStepMs : undefined;
      const endMs = phonemeEndFrames[k] >= 0 ? (phonemeEndFrames[k] + 1) * this.config.frameStepMs : undefined;

      totalScoreSum += avgScore;
      scoredPhonemeCount++;

      let status: PhonemeObservationStatus = 'MATCHED';
      let confidence = ConfidenceLevel.HIGH;

      if (count === 0 || avgScore < this.config.fallbackPosteriorThreshold) {
        status = avgScore < 0.2 ? 'MISMATCHED' : 'UNCERTAIN';
        confidence = ConfidenceLevel.LOW;
      } else if (avgScore < 0.65) {
        status = 'PARTIAL';
        confidence = ConfidenceLevel.MEDIUM;
      }

      phonemeObservations.push({
        phonemeId: token.phonemeId,
        expectedSymbol: token.arabicSymbol,
        startMs,
        endMs,
        score: Number(avgScore.toFixed(3)),
        confidence,
        status,
      });
    }

    const overallAcousticScore = scoredPhonemeCount > 0 ? totalScoreSum / scoredPhonemeCount : 0;
    const isFallbackRequired = overallAcousticScore < this.config.fallbackPosteriorThreshold;

    // 6. Aggregate into Word Boundaries
    const wordBoundaries: ViterbiAlignmentResult['wordBoundaries'] = [];
    const uniqueWordIndices = Array.from(new Set(wordTokenMapping));

    for (const wIdx of uniqueWordIndices) {
      const wordPhonemeIndices: number[] = [];
      wordTokenMapping.forEach((wi, pi) => {
        if (wi === wIdx) wordPhonemeIndices.push(pi);
      });

      let wStartMs = 1e9;
      let wEndMs = 0;
      let wScoreSum = 0;
      let validPhonemes = 0;

      for (const pi of wordPhonemeIndices) {
        const obs = phonemeObservations[pi];
        if (obs.startMs !== undefined && obs.startMs < wStartMs) wStartMs = obs.startMs;
        if (obs.endMs !== undefined && obs.endMs > wEndMs) wEndMs = obs.endMs;
        if (obs.score !== undefined) {
          wScoreSum += obs.score;
          validPhonemes++;
        }
      }

      const wAvgScore = validPhonemes > 0 ? wScoreSum / validPhonemes : 0;
      wordBoundaries.push({
        wordIndex: wIdx,
        startMs: wStartMs < 1e9 ? wStartMs : 0,
        endMs: wEndMs,
        acousticScore: Number(wAvgScore.toFixed(3)),
        isUncertain: wAvgScore < this.config.fallbackPosteriorThreshold,
      });
    }

    return {
      phonemeObservations,
      wordBoundaries,
      overallAcousticScore: Number(overallAcousticScore.toFixed(3)),
      isFallbackRequired,
      fallbackReasonArabic: isFallbackRequired
        ? 'متوسط الاحتمال الصوتي الفونيمي أقل من عتبة التحقق (تفعيل المحاذاة الاحتياطية).'
        : undefined,
    };
  }
}
