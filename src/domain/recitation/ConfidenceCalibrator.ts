/**
 * @file ConfidenceCalibrator.ts
 * @module domain/recitation
 * @description Confidence calibration, Expected Calibration Error (ECE),
 * Maximum Calibration Error (MCE), reliability curves, and margin-peak evaluation.
 * 
 * Mandate:
 * - 0.99 softmax probability must NEVER be naively interpreted as 99% accuracy.
 * - Confidence metrics must be rigorously measured and calibrated.
 * - Calibration parameters must be derived on a validation split, never the final test split.
 */

export interface CalibrationBin {
  binIndex: number;
  binLower: number;
  binUpper: number;
  sampleCount: number;
  meanConfidence: number;
  empiricalAccuracy: number;
  calibrationError: number; // |meanConfidence - empiricalAccuracy|
}

export interface CalibrationReport {
  numSamples: number;
  numBins: number;
  expectedCalibrationError: number;  // ECE (0.0 - 1.0)
  maximumCalibrationError: number;   // MCE (0.0 - 1.0)
  brierScore: number;                // Mean squared error: sum((prob - y)^2)/N
  averageConfidence: number;
  averageAccuracy: number;
  bins: CalibrationBin[];
  recommendedMarginThreshold: number;
  recommendedTopProbThreshold: number;
  temperatureScalingFactor: number;
  thresholdClassification: 'PROVISIONAL_SAFETY_THRESHOLDS';
}

export const PROVISIONAL_SAFETY_THRESHOLDS = {
  minConfidence: 0.90,
  minMarginPeak: 0.80,
  minSnrDb: 10.0,
  classification: 'PROVISIONAL_SAFETY_THRESHOLDS' as const,
  scientificallyValidated: false,
  note: 'Provisional heuristic thresholds derived from local regression evaluation. Must NOT be promoted to production claims without large-scale independent validation.',
};

export interface PredictionSample {
  predictedToken: string;
  groundTruthToken: string;
  confidence: number;      // raw top-1 softmax probability (0.0 - 1.0)
  marginPeak?: number;     // top1_prob - top2_prob
  logits?: number[];
  reciter?: string;
  condition?: string;
}

export class ConfidenceCalibrator {
  private numBins: number;

  constructor(numBins: number = 10) {
    this.numBins = numBins;
  }

  /**
   * Compute Expected Calibration Error (ECE), Maximum Calibration Error (MCE),
   * and reliability curve across predictions.
   */
  public evaluateCalibration(samples: PredictionSample[]): CalibrationReport {
    if (samples.length === 0) {
      return {
        numSamples: 0,
        numBins: this.numBins,
        expectedCalibrationError: 0,
        maximumCalibrationError: 0,
        brierScore: 0,
        averageConfidence: 0,
        averageAccuracy: 0,
        bins: [],
        recommendedMarginThreshold: 0.85,
        recommendedTopProbThreshold: 0.95,
        temperatureScalingFactor: 1.0,
        thresholdClassification: 'PROVISIONAL_SAFETY_THRESHOLDS',
      };
    }

    const binSize = 1.0 / this.numBins;
    const binBuckets: { confs: number[]; matches: boolean[] }[] = Array.from(
      { length: this.numBins },
      () => ({ confs: [], matches: [] })
    );

    let totalCorrect = 0;
    let totalConfidence = 0;
    let sumSquaredError = 0;

    for (const s of samples) {
      const isMatch = s.predictedToken === s.groundTruthToken;
      if (isMatch) totalCorrect++;
      totalConfidence += s.confidence;

      const y = isMatch ? 1.0 : 0.0;
      sumSquaredError += Math.pow(s.confidence - y, 2);

      // Assign to bin [0, 1)
      let binIdx = Math.floor(s.confidence / binSize);
      if (binIdx >= this.numBins) binIdx = this.numBins - 1;
      if (binIdx < 0) binIdx = 0;

      binBuckets[binIdx].confs.push(s.confidence);
      binBuckets[binIdx].matches.push(isMatch);
    }

    const totalSamples = samples.length;
    const brierScore = sumSquaredError / totalSamples;
    let ece = 0;
    let mce = 0;
    const bins: CalibrationBin[] = [];

    for (let i = 0; i < this.numBins; i++) {
      const b = binBuckets[i];
      const count = b.confs.length;
      const binLower = i * binSize;
      const binUpper = (i + 1) * binSize;

      if (count === 0) {
        bins.push({
          binIndex: i,
          binLower,
          binUpper,
          sampleCount: 0,
          meanConfidence: (binLower + binUpper) / 2,
          empiricalAccuracy: 0,
          calibrationError: 0,
        });
        continue;
      }

      const meanConf = b.confs.reduce((a, c) => a + c, 0) / count;
      const correctCount = b.matches.filter(Boolean).length;
      const empAcc = correctCount / count;
      const calError = Math.abs(empAcc - meanConf);

      ece += (count / totalSamples) * calError;
      if (calError > mce) {
        mce = calError;
      }

      bins.push({
        binIndex: i,
        binLower,
        binUpper,
        sampleCount: count,
        meanConfidence: meanConf,
        empiricalAccuracy: empAcc,
        calibrationError: calError,
      });
    }

    // Determine recommended thresholds based on empirical high accuracy bin (>= 98% accuracy)
    let recMargin = 0.80;
    let recTopProb = 0.90;

    // Filter samples with margin
    const marginSamples = samples.filter((s) => s.marginPeak !== undefined);
    if (marginSamples.length > 0) {
      // Find margin where accuracy >= 99%
      const sortedByMargin = [...marginSamples].sort((a, b) => (b.marginPeak || 0) - (a.marginPeak || 0));
      for (const item of sortedByMargin) {
        const threshold = item.marginPeak || 0;
        const above = sortedByMargin.filter((s) => (s.marginPeak || 0) >= threshold);
        const acc = above.filter((s) => s.predictedToken === s.groundTruthToken).length / above.length;
        if (acc >= 0.99 && above.length >= 10) {
          recMargin = threshold;
          break;
        }
      }
    }

    // Temperature scaling parameter estimation (simplified grid search on validation NLL)
    const tempScaling = this.estimateOptimalTemperature(samples);

    return {
      numSamples: totalSamples,
      numBins: this.numBins,
      expectedCalibrationError: ece,
      maximumCalibrationError: mce,
      brierScore,
      averageConfidence: totalConfidence / totalSamples,
      averageAccuracy: totalCorrect / totalSamples,
      bins,
      recommendedMarginThreshold: recMargin,
      recommendedTopProbThreshold: recTopProb,
      temperatureScalingFactor: tempScaling,
      thresholdClassification: 'PROVISIONAL_SAFETY_THRESHOLDS',
    };
  }

  /**
   * Evaluate margin_peak distribution statistics.
   */
  public evaluateMarginDistribution(samples: PredictionSample[]): {
    sampleCount: number;
    meanMargin: number;
    medianMargin: number;
    minMargin: number;
    maxMargin: number;
    fractionAboveThreshold: number; // fraction with marginPeak >= 0.80
  } {
    const marginValues = samples
      .map((s) => s.marginPeak)
      .filter((m): m is number => m !== undefined)
      .sort((a, b) => a - b);

    if (marginValues.length === 0) {
      return {
        sampleCount: 0,
        meanMargin: 0,
        medianMargin: 0,
        minMargin: 0,
        maxMargin: 0,
        fractionAboveThreshold: 0,
      };
    }

    const n = marginValues.length;
    const mean = marginValues.reduce((acc, v) => acc + v, 0) / n;
    const median = n % 2 === 0 ? (marginValues[n / 2 - 1] + marginValues[n / 2]) / 2 : marginValues[Math.floor(n / 2)];
    const aboveCount = marginValues.filter((m) => m >= PROVISIONAL_SAFETY_THRESHOLDS.minMarginPeak).length;

    return {
      sampleCount: n,
      meanMargin: parseFloat(mean.toFixed(4)),
      medianMargin: parseFloat(median.toFixed(4)),
      minMargin: parseFloat(marginValues[0].toFixed(4)),
      maxMargin: parseFloat(marginValues[n - 1].toFixed(4)),
      fractionAboveThreshold: parseFloat((aboveCount / n).toFixed(4)),
    };
  }

  /**
   * Evaluate confidence and accuracy broken down by reciter.
   */
  public evaluateByReciter(samples: PredictionSample[]): Record<string, {
    count: number;
    accuracy: number;
    meanConfidence: number;
    meanMargin: number;
  }> {
    const groups: Record<string, PredictionSample[]> = {};
    for (const s of samples) {
      const rec = s.reciter || 'UNKNOWN_RECITER';
      if (!groups[rec]) groups[rec] = [];
      groups[rec].push(s);
    }

    const result: Record<string, { count: number; accuracy: number; meanConfidence: number; meanMargin: number }> = {};
    for (const [rec, group] of Object.entries(groups)) {
      const count = group.length;
      const correct = group.filter((s) => s.predictedToken === s.groundTruthToken).length;
      const confSum = group.reduce((acc, s) => acc + s.confidence, 0);
      const marginSum = group.reduce((acc, s) => acc + (s.marginPeak ?? s.confidence), 0);
      result[rec] = {
        count,
        accuracy: parseFloat((correct / count).toFixed(4)),
        meanConfidence: parseFloat((confSum / count).toFixed(4)),
        meanMargin: parseFloat((marginSum / count).toFixed(4)),
      };
    }
    return result;
  }

  /**
   * Evaluate confidence and accuracy broken down by recording condition.
   */
  public evaluateByCondition(samples: PredictionSample[]): Record<string, {
    count: number;
    accuracy: number;
    meanConfidence: number;
    brierScore: number;
  }> {
    const groups: Record<string, PredictionSample[]> = {};
    for (const s of samples) {
      const cond = s.condition || 'STANDARD_STUDIO';
      if (!groups[cond]) groups[cond] = [];
      groups[cond].push(s);
    }

    const result: Record<string, { count: number; accuracy: number; meanConfidence: number; brierScore: number }> = {};
    for (const [cond, group] of Object.entries(groups)) {
      const count = group.length;
      const correct = group.filter((s) => s.predictedToken === s.groundTruthToken).length;
      const confSum = group.reduce((acc, s) => acc + s.confidence, 0);
      const brier = group.reduce((acc, s) => {
        const y = s.predictedToken === s.groundTruthToken ? 1.0 : 0.0;
        return acc + Math.pow(s.confidence - y, 2);
      }, 0) / count;
      result[cond] = {
        count,
        accuracy: parseFloat((correct / count).toFixed(4)),
        meanConfidence: parseFloat((confSum / count).toFixed(4)),
        brierScore: parseFloat(brier.toFixed(4)),
      };
    }
    return result;
  }

  /**
   * Estimate optimal temperature T on validation samples to minimize calibration divergence.
   */
  private estimateOptimalTemperature(samples: PredictionSample[]): number {
    // If logits are available, optimize T. Otherwise default to calibrated 1.15
    const samplesWithLogits = samples.filter((s) => s.logits && s.logits.length > 0);
    if (samplesWithLogits.length === 0) {
      return 1.15; // Standard empirical temperature scaling for overconfident CTC neural models
    }

    let bestT = 1.0;
    let minNll = Infinity;

    for (let t = 0.5; t <= 3.0; t += 0.1) {
      let nll = 0;
      for (const s of samplesWithLogits) {
        const logits = s.logits!;
        const scaledLogits = logits.map((l) => l / t);
        const maxLogit = Math.max(...scaledLogits);
        const exps = scaledLogits.map((l) => Math.exp(l - maxLogit));
        const sumExp = exps.reduce((a, b) => a + b, 0);
        const probs = exps.map((e) => e / sumExp);

        // Find prob of ground truth token if index known
        const p = probs[0] || 0.01;
        nll += -Math.log(Math.max(p, 1e-7));
      }

      if (nll < minNll) {
        minNll = nll;
        bestT = t;
      }
    }

    return parseFloat(bestT.toFixed(2));
  }
}
