/**
 * @file PhoneticAnalyzerImpl.ts
 * @module application/recitation
 * @description Phonetic, Madd duration, Ghunnah nasalization, and Articulation analyzers.
 * Strictly adheres to truthfulness: Any acoustic capability lacking a benchmarked acoustic model
 * returns NOT_AVAILABLE or NOT_IMPLEMENTED with a clear disclaimer.
 */

import {
  AcousticFeatureStatus,
  ArticulationAnalysis,
  GhunnahAnalysis,
  IArticulationAnalyzer,
  IGhunnahAnalyzer,
  IMaddAnalyzer,
  IPhoneticAnalyzer,
  MaddTimingAnalysis,
} from '../../domain/recitation/phoneticTypes.ts';

export class MaddTimingAnalyzerImpl implements IMaddAnalyzer {
  getStatus(): AcousticFeatureStatus {
    return AcousticFeatureStatus.EXPERIMENTAL;
  }

  analyzeMaddDuration(
    observedDurationMs: number,
    recitationTempoMsPerHarakah: number,
    expectedHarakahCount: number,
    ruleId: string
  ): MaddTimingAnalysis {
    // If tempo is invalid, report uncertain
    if (recitationTempoMsPerHarakah <= 0 || observedDurationMs <= 0) {
      return {
        status: AcousticFeatureStatus.EXPERIMENTAL,
        ruleId,
        expectedHarakahCount,
        expectedDurationMs: 0,
        observedDurationMs,
        calculatedHarakahRatio: 0,
        isWithinAcceptableTolerance: false,
        confidence: 0.3,
        isUncertain: true,
        remarksArabic: 'لم يتم رصد وتيرة زمنية مستقرة لحساب الحركات بدقة.',
      };
    }

    const expectedDurationMs = expectedHarakahCount * recitationTempoMsPerHarakah;
    const ratio = observedDurationMs / expectedDurationMs;
    // Allowable tolerance in recitation is ±25%
    const isWithinTolerance = ratio >= 0.75 && ratio <= 1.30;
    const confidence = isWithinTolerance ? 0.75 : 0.65;

    return {
      status: AcousticFeatureStatus.EXPERIMENTAL,
      ruleId,
      expectedHarakahCount,
      expectedDurationMs: Math.round(expectedDurationMs),
      observedDurationMs: Math.round(observedDurationMs),
      calculatedHarakahRatio: Math.round(ratio * 100) / 100,
      isWithinAcceptableTolerance: isWithinTolerance,
      confidence,
      isUncertain: false,
      remarksArabic: isWithinTolerance
        ? `زمن المد مقارب للمطلوب (${expectedHarakahCount} حركات) وفق تقدير تجريبي للوتيرة.`
        : ratio < 0.75
        ? `زمن المد أقصر من المتوقع (${expectedHarakahCount} حركات).`
        : `زمن المد أطول من المتوقع (${expectedHarakahCount} حركات).`,
    };
  }
}

export class GhunnahAnalyzerImpl implements IGhunnahAnalyzer {
  getStatus(): AcousticFeatureStatus {
    return AcousticFeatureStatus.NOT_AVAILABLE;
  }

  analyzeGhunnah(
    audioPcm: Float32Array,
    sampleRateHz: number,
    ruleId: string
  ): GhunnahAnalysis {
    // We intentionally return NOT_AVAILABLE because a specialized acoustic nasal resonance model
    // is required to certify Ghunnah with religious integrity.
    return {
      status: AcousticFeatureStatus.NOT_AVAILABLE,
      ruleId,
      isNasalEnergyDetected: false,
      confidence: 0.0,
      remarksArabic:
        'تحليل رنين الغنة الدقيق يتطلب نموذجاً صوتياً تخصصياً معتمداً غير متوفر محلياً حالياً. لا يصدر حكم قطعي.',
    };
  }
}

export class ArticulationAnalyzerImpl implements IArticulationAnalyzer {
  getStatus(): AcousticFeatureStatus {
    return AcousticFeatureStatus.NOT_IMPLEMENTED;
  }

  analyzeArticulation(
    audioPcm: Float32Array,
    letterArabic: string
  ): ArticulationAnalysis {
    return {
      status: AcousticFeatureStatus.NOT_IMPLEMENTED,
      consonantLetterArabic: letterArabic,
      makhrajCategoryArabic: 'مخارج الحروف',
      sifatDetected: [],
      confidence: 0.0,
      remarksArabic:
        'تحليل صفات ومخارج الحروف الدقيقة قيد التطوير والتوثيق الأكاديمي. لا يصدر حكم قطعي لمنع الخطأ في حق الطالب.',
    };
  }
}

export class PhoneticAnalyzerImpl implements IPhoneticAnalyzer {
  private maddAnalyzer = new MaddTimingAnalyzerImpl();
  private ghunnahAnalyzer = new GhunnahAnalyzerImpl();
  private articulationAnalyzer = new ArticulationAnalyzerImpl();

  getMaddAnalyzer(): IMaddAnalyzer {
    return this.maddAnalyzer;
  }

  getGhunnahAnalyzer(): IGhunnahAnalyzer {
    return this.ghunnahAnalyzer;
  }

  getArticulationAnalyzer(): IArticulationAnalyzer {
    return this.articulationAnalyzer;
  }
}
