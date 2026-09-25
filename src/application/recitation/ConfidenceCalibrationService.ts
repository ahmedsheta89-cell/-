/**
 * @file ConfidenceCalibrationService.ts
 * @module application/recitation
 * @description Multi-factor Confidence Calibration Engine.
 * Replaces arbitrary single thresholds with versioned, traceable multi-evidence calibration.
 */

import {
  IConfidenceCalibrationService,
  CalibrationThresholds,
  DetailedConfidenceEvidence,
} from '../../domain/recitation/calibrationTypes.ts';
import { AudioQualityAssessment, AudioQualityStatus } from '../../domain/recitation/audioCaptureTypes.ts';
import { AlignmentResult, AlignmentStatus } from '../../domain/recitation/alignmentTypes.ts';
import { ConfidenceLevel } from '../../domain/confidence/types.ts';

export const CURRENT_CALIBRATION_VERSION = 'v1.0-deterministic-calibrated';

export const DEFAULT_CALIBRATION_THRESHOLDS: CalibrationThresholds = {
  version: CURRENT_CALIBRATION_VERSION,
  minSnrDbForHighConfidence: 18,
  minSnrDbForMediumConfidence: 10,
  maxClippingRatioAllowed: 0.02,
  highConfidenceScoreThreshold: 0.85,
  mediumConfidenceScoreThreshold: 0.65,
  maxTemporalDeviationRatio: 2.2,
};

export class ConfidenceCalibrationService implements IConfidenceCalibrationService {
  constructor(private readonly thresholds: CalibrationThresholds = DEFAULT_CALIBRATION_THRESHOLDS) {}

  getCalibrationVersion(): string {
    return this.thresholds.version;
  }

  getThresholds(): CalibrationThresholds {
    return { ...this.thresholds };
  }

  calibrateEvidence(
    quality: AudioQualityAssessment,
    alignment: AlignmentResult,
    isLahnJaliCandidate: boolean
  ): DetailedConfidenceEvidence {
    const factorsArabic: string[] = [];

    // 1. Audio Quality Score (0.0 - 1.0)
    let audioQualityScore = 1.0;
    if (quality.status === AudioQualityStatus.UNUSABLE) {
      audioQualityScore = 0.0;
      factorsArabic.push('الإشارة الصوتية غير صالحة إطلاقاً (انعدام الثقة).');
    } else if (quality.status === AudioQualityStatus.POOR) {
      audioQualityScore = 0.45;
      factorsArabic.push('جودة صوت منخفضة أو بها تشويش/تقطيع أثرت سلباً على درجة الثقة.');
    } else if (quality.status === AudioQualityStatus.ACCEPTABLE) {
      audioQualityScore = 0.78;
      factorsArabic.push('جودة صوت مقبولة مع نسبة طفيفة من الضوضاء.');
    } else {
      audioQualityScore = 0.98;
      factorsArabic.push('إشارة صوتية نقية بنسبة إشارة إلى ضجيج ممتازة.');
    }

    // 2. Alignment Score (0.0 - 1.0)
    const rawScore = alignment.alignmentScore ?? alignment.overallScore ?? 0;
    const alignmentScore = Math.max(0, Math.min(1.0, rawScore));
    factorsArabic.push(`درجة المحاذاة الزمنية للكلمة: ${Math.round(alignmentScore * 100)}%.`);

    // 3. Acoustic Model Confidence (0.0 - 1.0)
    const acousticModelConfidence = alignment.status === AlignmentStatus.ALIGNED ? 0.95 : 0.6;

    // 4. Temporal Plausibility (0.0 - 1.0)
    let temporalPlausibility = 1.0;
    const durRatio = alignment.evidence?.temporalDurationRatio ?? 1.0;
    if (durRatio > this.thresholds.maxTemporalDeviationRatio || (durRatio < 0.35 && durRatio > 0)) {
      temporalPlausibility = 0.55;
      factorsArabic.push(`تفاوت زمني في مدة الكلمة (نسبة المدة الفعلية: ${durRatio}x).`);
    }

    // 5. Ambiguity Penalty
    let ambiguityPenalty = 0.0;
    if (alignment.status === AlignmentStatus.UNCERTAIN) {
      ambiguityPenalty = 0.25;
      factorsArabic.push('تم خصم نقطة غموض صوتي لوجود التباس في فواصل الكلمة.');
    }

    // Combined Weighted Calibrated Score
    // Weightings: Audio Quality (30%), Alignment Score (40%), Acoustic (20%), Temporal (10%)
    let weightedScore =
      audioQualityScore * 0.3 +
      alignmentScore * 0.4 +
      acousticModelConfidence * 0.2 +
      temporalPlausibility * 0.1 -
      ambiguityPenalty;

    const finalCalibratedScore = Math.max(0, Math.min(1.0, Math.round(weightedScore * 100) / 100));

    // Resolve Confidence Level
    let resolvedLevel = ConfidenceLevel.LOW;
    if (quality.status === AudioQualityStatus.UNUSABLE || alignment.status === AlignmentStatus.UNOBSERVABLE) {
      resolvedLevel = ConfidenceLevel.UNKNOWN;
      factorsArabic.push('تم تعيين المستوى إلى [UNKNOWN]: أدلة غير مرئية لا تسمح بإصدار حكم.');
    } else if (finalCalibratedScore >= this.thresholds.highConfidenceScoreThreshold) {
      resolvedLevel = ConfidenceLevel.HIGH;
      factorsArabic.push('المستوى المحسوب: [HIGH] — ثقة عالية تؤهل للتنبيه والتصحيح المباشر.');
    } else if (finalCalibratedScore >= this.thresholds.mediumConfidenceScoreThreshold) {
      resolvedLevel = ConfidenceLevel.MEDIUM;
      factorsArabic.push('المستوى المحسوب: [MEDIUM] — ثقة متوسطة تتطلب طلب الإعادة للتثبت دون تخطئة.');
    } else {
      resolvedLevel = ConfidenceLevel.LOW;
      factorsArabic.push('المستوى المحسوب: [LOW] — ثقة منخفضة تمنع إصدار أي حكم على الطالب.');
    }

    return {
      calibrationVersion: this.thresholds.version,
      audioQualityScore,
      alignmentScore,
      acousticModelConfidence,
      phoneticReliability: alignmentScore,
      temporalPlausibility,
      ambiguityPenalty,
      finalCalibratedScore,
      resolvedLevel,
      evidenceFactorsArabic: factorsArabic,
    };
  }
}
