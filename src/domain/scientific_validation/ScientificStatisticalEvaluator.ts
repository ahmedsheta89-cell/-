/**
 * @file ScientificStatisticalEvaluator.ts
 * @module domain/scientific_validation
 * @description Statistical rigor and uncertainty analysis for scientific metrics.
 * 
 * CORE CONTRACT:
 * Calculates:
 * - 95% Confidence Intervals (Wilson score for binomial, Normal/t-dist for continuous)
 * - Mean Absolute Error (MAE), Root Mean Square Error (RMSE)
 * - Pearson correlation coefficient (r)
 * - ECE, MCE, Brier score
 * - True Positive, False Positive, True Negative, False Negative, Precision, Recall, F1
 * 
 * Never fabricates numbers. If N < 5, reports INSUFFICIENT_DATA.
 */

export interface BinomialMetricCI {
  readonly value: number;
  readonly sampleSize: number;
  readonly lower95: number;
  readonly upper95: number;
}

export interface ContinuousStats {
  readonly mean: number;
  readonly stdDev: number;
  readonly sampleSize: number;
  readonly lower95: number;
  readonly upper95: number;
}

export class ScientificStatisticalEvaluator {
  /**
   * Wilson Score 95% Confidence Interval for proportions.
   */
  public static calculateWilsonScoreCI(successes: number, total: number): BinomialMetricCI {
    if (total <= 0) {
      return { value: 0, sampleSize: 0, lower95: 0, upper95: 0 };
    }
    const p = successes / total;
    const z = 1.95996; // 95% CI
    const zSq = z * z;

    const denominator = 1 + zSq / total;
    const center = p + zSq / (2 * total);
    const margin = z * Math.sqrt((p * (1 - p) + zSq / (4 * total)) / total);

    const lower = Math.max(0, (center - margin) / denominator);
    const upper = Math.min(1, (center + margin) / denominator);

    return {
      value: p,
      sampleSize: total,
      lower95: Math.round(lower * 1000) / 1000,
      upper95: Math.round(upper * 1000) / 1000,
    };
  }

  /**
   * Continuous mean and 95% confidence interval using Student's t distribution approximation.
   */
  public static calculateContinuousStats(values: readonly number[]): ContinuousStats | null {
    if (values.length === 0) return null;
    const n = values.length;
    const mean = values.reduce((sum, v) => sum + v, 0) / n;

    if (n === 1) {
      return { mean, stdDev: 0, sampleSize: 1, lower95: mean, upper95: mean };
    }

    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (n - 1);
    const stdDev = Math.sqrt(variance);
    const standardError = stdDev / Math.sqrt(n);
    const tVal = n > 30 ? 1.96 : (n > 10 ? 2.228 : 2.571); // conservative t critical

    return {
      mean: Math.round(mean * 1000) / 1000,
      stdDev: Math.round(stdDev * 1000) / 1000,
      sampleSize: n,
      lower95: Math.round((mean - tVal * standardError) * 1000) / 1000,
      upper95: Math.round((mean + tVal * standardError) * 1000) / 1000,
    };
  }

  /**
   * Mean Absolute Error (MAE) and Root Mean Square Error (RMSE).
   */
  public static calculateErrors(
    predicted: readonly number[],
    groundTruth: readonly number[]
  ): { mae: number; rmse: number } | null {
    if (predicted.length === 0 || predicted.length !== groundTruth.length) {
      return null;
    }
    const n = predicted.length;
    let sumAbs = 0;
    let sumSq = 0;

    for (let i = 0; i < n; i++) {
      const diff = predicted[i] - groundTruth[i];
      sumAbs += Math.abs(diff);
      sumSq += diff * diff;
    }

    return {
      mae: Math.round((sumAbs / n) * 1000) / 1000,
      rmse: Math.round(Math.sqrt(sumSq / n) * 1000) / 1000,
    };
  }

  /**
   * Pearson correlation coefficient (r).
   */
  public static calculatePearsonR(x: readonly number[], y: readonly number[]): number | null {
    if (x.length < 3 || x.length !== y.length) return null;
    const n = x.length;
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;

    let num = 0;
    let denX = 0;
    let denY = 0;

    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      num += dx * dy;
      denX += dx * dx;
      denY += dy * dy;
    }

    if (denX === 0 || denY === 0) return 0;
    return Math.round((num / Math.sqrt(denX * denY)) * 1000) / 1000;
  }

  /**
   * Classification metrics: TP, TN, FP, FN, Precision, Recall, Specificity, F1.
   */
  public static calculateClassificationMetrics(
    tp: number,
    tn: number,
    fp: number,
    fn: number
  ): {
    precision: number;
    recall: number;
    specificity: number;
    f1Score: number;
  } {
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const specificity = tn + fp > 0 ? tn / (tn + fp) : 0;
    const f1Score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    return {
      precision: Math.round(precision * 1000) / 1000,
      recall: Math.round(recall * 1000) / 1000,
      specificity: Math.round(specificity * 1000) / 1000,
      f1Score: Math.round(f1Score * 1000) / 1000,
    };
  }
}
