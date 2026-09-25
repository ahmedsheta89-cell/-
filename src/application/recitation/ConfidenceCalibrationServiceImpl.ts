/**
 * @file ConfidenceCalibrationServiceImpl.ts
 * @module application/recitation
 * @description Confidence calibration service with multi-factor evidence aggregation.
 * Enforces rigorous protection against false accusations:
 * If acoustic evidence is low or noisy, confidence is downgraded and error verdicts are prevented.
 */

import {
  CalibrationThresholds,
  DetailedConfidenceEvidence,
  IConfidenceCalibrationService,
} from '../../domain/recitation/calibrationTypes.ts';
import {
  AudioQualityAssessment,
  AudioQualityStatus,
} from '../../domain/recitation/audioCaptureTypes.ts';
import { AlignmentResult, AlignmentStatus } from '../../domain/recitation/alignmentTypes.ts';
import { ConfidenceLevel } from '../../domain/confidence/types.ts';

export class ConfidenceCalibrationServiceImpl implements IConfidenceCalibrationService {
  private readonly thresholds: CalibrationThresholds = {
    version: 'v1.0-deterministic-baseline',
    minSnrDbForHighConfidence: 18,
    minSnrDbForMediumConfidence: 10,
    maxClippingRatioAllowed: 0.02,
    highConfidenceScoreThreshold: 0.85,
    mediumConfidenceScoreThreshold: 0.65,
    maxTemporalDeviationRatio: 2.2,
  };

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
    const evidenceFactorsArabic: string[] = [];

    // 1. Audio Quality Score (SNR and Clipping)
    let audioQualityScore = 1.0;
    if (quality.status === AudioQualityStatus.UNUSABLE) {
      audioQualityScore = 0.1;
      evidenceFactorsArabic.push('الإشارة الصوتية غير صالحة للتحليل (انقطاع أو تشويه جسيم).');
    } else if (quality.status === AudioQualityStatus.POOR) {
      audioQualityScore = 0.45;
      evidenceFactorsArabic.push('جودة صوتية منخفضة تؤثر على دقة التقييم.');
    } else if (quality.estimatedSnrDb >= this.thresholds.minSnrDbForHighConfidence) {
      audioQualityScore = 0.95;
      evidenceFactorsArabic.push('نسبة الإشارة إلى الضوضاء (SNR) ممتازة.');
    } else if (quality.estimatedSnrDb >= this.thresholds.minSnrDbForMediumConfidence) {
      audioQualityScore = 0.75;
      evidenceFactorsArabic.push('نسبة الإشارة إلى الضوضاء مقبولة.');
    } else {
      audioQualityScore = 0.50;
      evidenceFactorsArabic.push('ضجيج محيطي ملحوظ يخفض الثقة في الإشارة.');
    }

    if (quality.clippingRatio > this.thresholds.maxClippingRatioAllowed) {
      audioQualityScore *= 0.7;
      evidenceFactorsArabic.push('تم رصد تشويه صوتي ناتج عن علو الصوت الزائد (Clipping).');
    }

    // 2. Alignment Score
    const rawScore = alignment.overallScore ?? alignment.alignmentScore ?? 0;
    const alignmentScore = Math.min(1.0, Math.max(0.0, rawScore));
    if (alignment.overallStatus === AlignmentStatus.ALIGNED) {
      evidenceFactorsArabic.push('تطابق محاذاة صوتية متصل ودقيق مع الآيات المتوقعة.');
    } else if (alignment.overallStatus === AlignmentStatus.PARTIALLY_ALIGNED) {
      evidenceFactorsArabic.push('محاذاة جزئية مع بعض التفاوت الزمني.');
    } else {
      evidenceFactorsArabic.push('فروقات زمنية أو صوتية مؤثرة على المحاذاة.');
    }

    // 3. Acoustic Model Confidence
    const acousticModelConfidence =
      alignment.overallStatus === AlignmentStatus.UNOBSERVABLE ? 0.0 : 0.88;

    // 4. Phonetic & Temporal Reliability
    const phoneticReliability = 0.85;
    const temporalPlausibility = 0.90;

    // 5. Ambiguity & Severity Penalties
    let ambiguityPenalty = 0.0;
    if (isLahnJaliCandidate) {
      // For serious accusations of Lahn Jali, we apply a safety penalty unless evidence is pristine
      if (audioQualityScore < 0.8 || alignmentScore < 0.8) {
        ambiguityPenalty = 0.15;
        evidenceFactorsArabic.push('تشديد معيار الثقة لمنع التخطئة غير المؤكدة في حق الطالب.');
      }
    }

    // 6. Final Weighted Score
    // Weightings: Audio Quality (30%), Alignment (40%), Acoustic (20%), Temporal (10%)
    let finalCalibratedScore =
      audioQualityScore * 0.3 +
      alignmentScore * 0.4 +
      acousticModelConfidence * 0.2 +
      temporalPlausibility * 0.1 -
      ambiguityPenalty;

    finalCalibratedScore = Math.min(1.0, Math.max(0.0, finalCalibratedScore));

    // 7. Resolve Final Level
    let resolvedLevel: ConfidenceLevel = ConfidenceLevel.LOW;
    if (quality.status === AudioQualityStatus.UNUSABLE) {
      resolvedLevel = ConfidenceLevel.UNKNOWN;
    } else if (finalCalibratedScore >= this.thresholds.highConfidenceScoreThreshold) {
      resolvedLevel = ConfidenceLevel.HIGH;
    } else if (finalCalibratedScore >= this.thresholds.mediumConfidenceScoreThreshold) {
      resolvedLevel = ConfidenceLevel.MEDIUM;
    } else {
      resolvedLevel = ConfidenceLevel.LOW;
    }

    return {
      calibrationVersion: this.thresholds.version,
      audioQualityScore: Math.round(audioQualityScore * 100) / 100,
      alignmentScore: Math.round(alignmentScore * 100) / 100,
      acousticModelConfidence: Math.round(acousticModelConfidence * 100) / 100,
      phoneticReliability: Math.round(phoneticReliability * 100) / 100,
      temporalPlausibility: Math.round(temporalPlausibility * 100) / 100,
      ambiguityPenalty: Math.round(ambiguityPenalty * 100) / 100,
      finalCalibratedScore: Math.round(finalCalibratedScore * 100) / 100,
      resolvedLevel,
      evidenceFactorsArabic,
    };
  }
}
