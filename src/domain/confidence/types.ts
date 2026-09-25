/**
 * @file types.ts
 * @module domain/confidence
 * @description Confidence Model & Deterministic Decision Policies.
 * Crucial rule: The system NEVER treats an AI or acoustic inference as unquestionable truth
 * unless statistical confidence is proven beyond the established threshold.
 */

export enum ConfidenceLevel {
  HIGH = 'HIGH',         // ثقة عالية: النتيجة قطعية حسابيًا ولا توجد ضوضاء مؤثرة
  MEDIUM = 'MEDIUM',     // ثقة متوسطة: احتمالية خطأ واردة ولكن توجد علامات شك أو ارتباك
  LOW = 'LOW',           // ثقة منخفضة: تشويش، انقطاع نفس، أو تطابق صوتي غير حاسم
  UNKNOWN = 'UNKNOWN',   // غير محدد: تعذر التحليل لعدم اكتمال الإشارة أو عطل فني
}

export enum PedagogicalDecision {
  DIRECT_CORRECTION = 'DIRECT_CORRECTION',         // تصحيح مباشر وإيقاف فوري لطيف
  REQUEST_REPETITION = 'REQUEST_REPETITION',       // طلب إعادة الآية أو الكلمة للتثبت
  PROCEED_WITHOUT_JUDGMENT = 'PROCEED_WITHOUT_JUDGMENT', // عدم إصدار حكم قطعي والسماح بالاستمرار
  FLAG_FOR_HUMAN_REVIEW = 'FLAG_FOR_HUMAN_REVIEW', // توثيق الحالة للمراجعة العلمية أو المعلم البشري
}

export interface ConfidenceAssessment {
  level: ConfidenceLevel;
  score: number; // Value between 0.00 and 1.00
  snrDb?: number; // Signal-to-Noise ratio in decibels
  alignmentStabilityScore?: number; // Temporal stability of phoneme alignment
  acousticModelConfidence?: number;
  reasonArabic: string;
}

export interface ConfidencePolicyThresholds {
  highThreshold: number;   // e.g. >= 0.88
  mediumThreshold: number; // e.g. >= 0.65
  lowThreshold: number;    // e.g. < 0.65
}

export const DEFAULT_CONFIDENCE_THRESHOLDS: ConfidencePolicyThresholds = {
  highThreshold: 0.88,
  mediumThreshold: 0.65,
  lowThreshold: 0.40,
};

/**
 * Deterministic resolution function mapping error severity and confidence level to pedagogical decision
 */
export function resolvePedagogicalDecision(
  confidence: ConfidenceLevel,
  isCriticalLahnJali: boolean
): PedagogicalDecision {
  switch (confidence) {
    case ConfidenceLevel.HIGH:
      return PedagogicalDecision.DIRECT_CORRECTION;
    case ConfidenceLevel.MEDIUM:
      // Even if Lahn Jali, if confidence is only medium, ask to repeat rather than falsely accuse
      return PedagogicalDecision.REQUEST_REPETITION;
    case ConfidenceLevel.LOW:
      return PedagogicalDecision.PROCEED_WITHOUT_JUDGMENT;
    case ConfidenceLevel.UNKNOWN:
    default:
      return PedagogicalDecision.FLAG_FOR_HUMAN_REVIEW;
  }
}
