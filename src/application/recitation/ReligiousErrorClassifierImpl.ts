/**
 * @file ReligiousErrorClassifierImpl.ts
 * @module application/recitation
 * @description Religious Error Classification Layer.
 * Evaluates acoustic observations through the verified rules of Tajweed and Islamic recitation science.
 * Bridges the gap between raw DSP observations and classical Fiqh / Tajweed categories (Lahn Jali vs Lahn Khafi).
 */

import {
  AcousticObservationType,
  IReligiousErrorClassifier,
  ReligiousClassificationCategory,
  ReligiousErrorClassification,
  RecitationObservation,
} from '../../domain/recitation/observationTypes.ts';
import { TajweedMatchResult } from '../../domain/tajweed/types.ts';

export class ReligiousErrorClassifierImpl implements IReligiousErrorClassifier {
  classifyObservation(
    observation: RecitationObservation,
    activeTajweedMatches: TajweedMatchResult[]
  ): ReligiousErrorClassification {
    const id = `rel-err-${observation.id}`;
    const classifiedAt = new Date().toISOString();

    // 1. Inconclusive or unobservable audio must NEVER be classified as a religious error
    if (
      observation.type === AcousticObservationType.UNCERTAIN ||
      observation.type === AcousticObservationType.UNOBSERVABLE
    ) {
      return {
        id,
        observationId: observation.id,
        category: ReligiousClassificationCategory.INCONCLUSIVE_EVIDENCE,
        fiqhSeverity: 'DISMISSED',
        ruleNameArabic: 'دليل صوتي غير كافٍ',
        descriptionArabic:
          'الإشارة الصوتية في هذا المقطع غير كافية لإصدار حكم تجويدي موثوق؛ تم حفظ حق الطالب دون تقييد خطأ عليه.',
        pedagogicalTipArabic: 'يرجى إعادة قراءة هذه الكلمة بصوت واضح ونبرة مستقرة.',
        isConfirmedByDeterministicEngine: false,
        classifiedAt,
      };
    }

    // 2. Exact match = No Error
    if (observation.type === AcousticObservationType.EXACT_MATCH) {
      return {
        id,
        observationId: observation.id,
        category: ReligiousClassificationCategory.NO_ERROR,
        fiqhSeverity: 'TOLERABLE',
        ruleNameArabic: 'تلاوة صحيحة',
        descriptionArabic: 'التلاوة موافقة للرسم العثماني المنطوق.',
        pedagogicalTipArabic: 'أحسنت، واصل القراءة بخشوع وتمهل.',
        isConfirmedByDeterministicEngine: true,
        classifiedAt,
      };
    }

    // 3. Clear Textual Alterations (Lahn Jali - لحن جلي)
    // Changing a word, dropping a word, or altering sequence affects the structure and meaning of the Quran.
    if (
      observation.type === AcousticObservationType.DELETION ||
      observation.type === AcousticObservationType.SUBSTITUTION ||
      observation.type === AcousticObservationType.SKIP ||
      observation.type === AcousticObservationType.ORDER_MISMATCH
    ) {
      const isCritical =
        observation.type === AcousticObservationType.DELETION ||
        observation.type === AcousticObservationType.SUBSTITUTION;

      return {
        id,
        observationId: observation.id,
        category: ReligiousClassificationCategory.LAHN_JALI,
        fiqhSeverity: isCritical ? 'CRITICAL_MUST_STOP' : 'EDUCATIONAL_NOTICE',
        ruleViolatedId: 'LAHN_JALI_TEXTUAL_INTEGRITY',
        ruleNameArabic: 'لحن جلي (خلل في بنية الكلمة أو إسقاطها)',
        descriptionArabic: `تم رصد ${
          observation.type === AcousticObservationType.DELETION
            ? 'إسقاط للكلمة أو نطق غير مسموع'
            : 'تغيير أو استبدال في الكلمة'
        } عند: «${observation.expectedText}». وهذا يخل بنص القرآن الكريم.`,
        pedagogicalTipArabic: `توقف وأعد قراءة الكلمة: «${observation.expectedText}» بتأنٍ وضبط للحركات.`,
        isConfirmedByDeterministicEngine: true,
        classifiedAt,
      };
    }

    // 4. Subtle errors (Lahn Khafi - لحن خفي) such as Tajweed rule deviations
    const matchingTajweed = activeTajweedMatches.find(
      (m) =>
        m.ruleId.toLowerCase().includes('ghunnah') ||
        m.ruleId.toLowerCase().includes('madd') ||
        m.ruleId.toLowerCase().includes('qalqalah')
    );

    if (matchingTajweed) {
      return {
        id,
        observationId: observation.id,
        category: ReligiousClassificationCategory.LAHN_KHAFI,
        fiqhSeverity: 'EDUCATIONAL_NOTICE',
        ruleViolatedId: matchingTajweed.ruleId,
        ruleNameArabic: `لحن خفي: ${matchingTajweed.ruleNameArabic}`,
        descriptionArabic: `تنبيه تجويدي متعلق بحكم: ${matchingTajweed.ruleNameArabic} عند الكلمة «${observation.expectedText}».`,
        pedagogicalTipArabic: matchingTajweed.descriptionArabic,
        matchedTajweedRule: matchingTajweed,
        isConfirmedByDeterministicEngine: true,
        classifiedAt,
      };
    }

    // 5. Repetitions
    if (observation.type === AcousticObservationType.REPETITION) {
      return {
        id,
        observationId: observation.id,
        category: ReligiousClassificationCategory.PERMISSIBLE_STOP,
        fiqhSeverity: 'EDUCATIONAL_NOTICE',
        ruleNameArabic: 'إعادة وتكرار الكلمة',
        descriptionArabic: `تم تكرار كلمة «${observation.expectedText}». يستحب عدم التكرار إلا بنية تصحيح أو استئناف حسن.`,
        pedagogicalTipArabic: 'إذا أردت الاستئناف، فابدأ من بداية الآية أو من موضع وقف حسن.',
        isConfirmedByDeterministicEngine: false,
        classifiedAt,
      };
    }

    // Fallback default
    return {
      id,
      observationId: observation.id,
      category: ReligiousClassificationCategory.NO_ERROR,
      fiqhSeverity: 'TOLERABLE',
      ruleNameArabic: 'ملاحظة عامة',
      descriptionArabic: observation.notesArabic,
      pedagogicalTipArabic: 'واصل التلاوة بانتظام.',
      isConfirmedByDeterministicEngine: false,
      classifiedAt,
    };
  }
}
