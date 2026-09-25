/**
 * @file MockAIProvider.ts
 * @module infrastructure/providers
 * @description Baseline pedagogical AI provider implementing IAIProvider.
 * Conforms strictly to religious integrity constraints: never generates or alters Quran text.
 */

import {
  IAIProvider,
  PedagogicalExplanationRequest,
  PedagogicalExplanationResponse,
  StudentWeaknessAnalysisRequest,
  StudentWeaknessAnalysisResponse,
} from '../interfaces/IAIProvider.ts';
import { RecitationErrorType } from '../../domain/errors/types.ts';

export class MockAIProvider implements IAIProvider {
  async explainRecitationError(
    request: PedagogicalExplanationRequest
  ): Promise<PedagogicalExplanationResponse> {
    const errorType = request.error.errorType;

    switch (errorType) {
      case RecitationErrorType.HARAKAH_MISMATCH:
        return {
          explanationArabic: `انتبه رعاك الله إلى ضبط حركة الحرف في كلمة (${request.targetWordTextUthmani})؛ فالحركة الصحيحة هي ${request.error.expectedToken}.`,
          makhrajAdviceArabic: 'تمكين الحركة بفتح الفم عند الفتح، وضمه عند الضم، وخفض الفك السفلي عند الكسر دون تمطيط.',
          motivationalNoteArabic: 'أحسنت في استمرارك، والضبط بالحركات يتطلب تمهلًا يسيرًا.',
        };

      case RecitationErrorType.MADD_DURATION_DEFECT:
        return {
          explanationArabic: `في كلمة (${request.targetWordTextUthmani}) يوجد موضع مد يستوجب التوفية بالمقدار المعتمد في الرواية.`,
          makhrajAdviceArabic: 'امتداد الصوت بحرف المد بلين وسهولة دون كزازة أو ضغط على الحنجرة.',
          motivationalNoteArabic: 'تلاوتك طيبة، وميزان المدود يزداد دقة بالتكرار والمشافهة.',
        };

      case RecitationErrorType.TAFKHEEM_TARQEEQ_DEFECT:
        return {
          explanationArabic: `لاحظ ترقيق أو تفخيم الحرف في كلمة (${request.targetWordTextUthmani}) بحسب مجاورته للحركات المرققة.`,
          makhrajAdviceArabic: 'التفخيم سِمَن يدخل على صوت الحرف يمتلئ الفم بصداه، بينما الترقيق نحول يعتري الحرف.',
          motivationalNoteArabic: 'بارك الله في حرصك على تجويد كتاب الله.',
        };

      default:
        return {
          explanationArabic: `أعد نطق كلمة (${request.targetWordTextUthmani}) متأنيًا ومحققًا لمخارج حروفها كما في المصحف.`,
          makhrajAdviceArabic: 'المحافظة على صفات الحروف وموازينها الصوتية.',
          motivationalNoteArabic: 'استعن بالله وكرر المقطع بتؤدة وخشوع.',
        };
    }
  }

  async analyzeWeaknessPattern(
    request: StudentWeaknessAnalysisRequest
  ): Promise<StudentWeaknessAnalysisResponse> {
    const count = request.recentErrors.length;
    if (count === 0) {
      return {
        summaryArabic: 'تلاوة متقنة وثابتة، لا توجد أنماط لحن ملحوظة في المقاطع الأخيرة.',
        primaryAreaOfFocus: 'تثبيت الحفظ والمداومة على المراجعة',
        suggestedDrillsArabic: ['مواصلة الورد اليومي', 'الاستماع لنماذج التلاوة المتقنة'],
      };
    }

    return {
      summaryArabic: `تم رصد ${count} انحرافات لفظية في الجلسات السابقة، تركز معظمها حول ضبط الحركات والمدود.`,
      primaryAreaOfFocus: 'تحقيق أزمنة المدود وتثبيت الحركات الإعرابية',
      suggestedDrillsArabic: [
        'تكرار مقاطع المد العارض للسكون بصوت هادئ',
        'تسميع الآيات ببطء (مرتبة التحقيق) قبل التسميع السريع',
      ],
    };
  }
}
