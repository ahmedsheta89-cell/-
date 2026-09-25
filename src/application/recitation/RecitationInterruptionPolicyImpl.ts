/**
 * @file RecitationInterruptionPolicyImpl.ts
 * @module application/recitation
 * @description Pedagogical Interruption Policy.
 * Prevents cognitive overload and preserves spiritual flow during Quranic recitation.
 * Mandate: Minor tajweed issues (Lahn Khafi) or low confidence detections MUST NEVER interrupt the reciter mid-ayah.
 */

import {
  InterruptionContext,
  InterruptionDecision,
  IRecitationInterruptionPolicy,
} from '../../domain/recitation/interruptionTypes.ts';
import {
  ReligiousClassificationCategory,
  ReligiousErrorClassification,
} from '../../domain/recitation/observationTypes.ts';
import { ConfidenceLevel } from '../../domain/confidence/types.ts';
import { RecitationMode } from '../../domain/recitation/types.ts';

export class RecitationInterruptionPolicyImpl implements IRecitationInterruptionPolicy {
  evaluateInterruption(
    classification: ReligiousErrorClassification,
    confidence: ConfidenceLevel,
    context: InterruptionContext
  ): InterruptionDecision {
    // 1. Zero Interruption on No Error or Inconclusive Evidence
    if (
      classification.category === ReligiousClassificationCategory.NO_ERROR ||
      classification.category === ReligiousClassificationCategory.INCONCLUSIVE_EVIDENCE ||
      classification.category === ReligiousClassificationCategory.PERMISSIBLE_STOP
    ) {
      return {
        shouldInterruptAudioNow: false,
        deferredToAyahEnd: false,
        reasonArabic: 'لا يوجد خطأ يستدعي التنبيه أو المقاطعة.',
      };
    }

    // 2. Strict Rule: Never interrupt on LOW or UNKNOWN confidence (False accusation prevention)
    if (confidence === ConfidenceLevel.LOW || confidence === ConfidenceLevel.UNKNOWN) {
      return {
        shouldInterruptAudioNow: false,
        deferredToAyahEnd: true,
        reasonArabic: 'درجة الثقة الصوتية منخفضة؛ تم تأجيل الملاحظة منعاً للمقاطعة الخاطئة.',
      };
    }

    // 3. Lahn Khafi (Subtle Tajweed rules: Madd, Ghunnah, etc.)
    // Under classical pedagogy, subtle tajweed errors are never interrupted mid-ayah.
    if (classification.category === ReligiousClassificationCategory.LAHN_KHAFI) {
      return {
        shouldInterruptAudioNow: false,
        deferredToAyahEnd: true,
        reasonArabic: 'لحن خفي (تجويدي)؛ يؤجل التنبيه لنهاية الآية للمحافظة على خشوع التلاوة.',
        recommendedPedagogicalPromptArabic: classification.pedagogicalTipArabic,
      };
    }

    // 4. Critical Textual Alterations (Lahn Jali)
    if (classification.category === ReligiousClassificationCategory.LAHN_JALI) {
      // If immediate mode is explicitly selected by student in practice mode
      if (
        context.mode === RecitationMode.CORRECTION_PRACTICE ||
        context.studentPreferenceAllowImmediateInterruption
      ) {
        return {
          shouldInterruptAudioNow: true,
          deferredToAyahEnd: false,
          reasonArabic: 'لحن جلي في النص القرآني؛ تم التدخل الفوري لتصحيح المعنى.',
          recommendedPedagogicalPromptArabic: classification.pedagogicalTipArabic,
        };
      }

      // In memorization test or revision, if it's end of ayah, notify now
      if (context.isEndOfAyah) {
        return {
          shouldInterruptAudioNow: true,
          deferredToAyahEnd: false,
          reasonArabic: 'تم الوصول لنهاية الآية مع وجود لحن جلي يستوجب التصحيح قبل الانتقال.',
          recommendedPedagogicalPromptArabic: classification.pedagogicalTipArabic,
        };
      }

      // If user had 3 consecutive errors, interrupt to stop cascade
      if (context.consecutiveErrorCount >= 3) {
        return {
          shouldInterruptAudioNow: true,
          deferredToAyahEnd: false,
          reasonArabic: 'تكرار عدة أخطاء جليّة متتالية؛ يرجى التوقف والمراجعة.',
          recommendedPedagogicalPromptArabic: classification.pedagogicalTipArabic,
        };
      }

      // Otherwise defer to end of current ayah
      return {
        shouldInterruptAudioNow: false,
        deferredToAyahEnd: true,
        reasonArabic: 'لحن جلي تم رصده، ومؤجل إلى رأس الآية للمحافظة على السرد.',
        recommendedPedagogicalPromptArabic: classification.pedagogicalTipArabic,
      };
    }

    // Default safe fallback
    return {
      shouldInterruptAudioNow: false,
      deferredToAyahEnd: true,
      reasonArabic: 'تنبيه تعليمي مؤجل.',
    };
  }
}
