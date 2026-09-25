/**
 * @file progressSemanticsCatalog.ts
 * @module domain/progress
 * @description Canonical semantic dictionary and mapping rules for Phase 8D.
 * Guarantees zero-gamification, dignified Arabic wording, and strict adherence
 * to Phase 7D pedagogical boundaries.
 */

import { MemorizationState, ReviewUrgency, EvidenceStatus } from '../memorization_revision/types.ts';
import { MemorizationStateMeta, ReviewUrgencyMeta } from './types.ts';

/**
 * 1. Memorization State Semantic Definitions
 */
export const MEMORIZATION_STATE_METAS: Record<MemorizationState, MemorizationStateMeta> = {
  [MemorizationState.NOT_STARTED]: {
    state: MemorizationState.NOT_STARTED,
    labelArabic: 'لم تبدأ بعد',
    descriptionArabic: 'آيات كريمة لم تُسجَّل لها جلسات تلاوة أو حفظ في المنظومة حتى الآن.',
    isConsolidated: false,
    schedulingNote: 'جاهزة للبدء في خطة التلقي والتسميع.',
  },
  [MemorizationState.INTRODUCED]: {
    state: MemorizationState.INTRODUCED,
    labelArabic: 'تقديم أولي',
    descriptionArabic: 'تم الاستماع للآية للمرة الأولى والبدء في تلقيها.',
    isConsolidated: false,
    schedulingNote: 'تحتاج إلى جلسات تكرار متقاربة لتثبيت الحفظ الأولي.',
  },
  [MemorizationState.LEARNING]: {
    state: MemorizationState.LEARNING,
    labelArabic: 'قيد التعلّم',
    descriptionArabic: 'مرحلة التلقي والتكرار لترسيخ ألفاظ الآيات وأحكام تجويدها.',
    isConsolidated: false,
    schedulingNote: 'مجدولة للتسميع المتكرر على فترات متقاربة.',
  },
  [MemorizationState.PRACTICING]: {
    state: MemorizationState.PRACTICING,
    labelArabic: 'مرحلة التمرين',
    descriptionArabic: 'تكرار التلاوة بإشراف المعلم للوصول إلى الانسيابية وحسن الأداء.',
    isConsolidated: false,
    schedulingNote: 'تتطلب مراجعة منتظمة لتجاوز مواضع التردد.',
  },
  [MemorizationState.STABLE]: {
    state: MemorizationState.STABLE,
    labelArabic: 'مستقر في الحفظ',
    descriptionArabic: 'استقرار مرحلي متوازن للتلاوة عبر جلسات تسميع متتالية.',
    isConsolidated: true,
    schedulingNote: 'مجدولة في فترات التعاهد الدوري المعتاد.',
  },
  [MemorizationState.REVIEW_DUE]: {
    state: MemorizationState.REVIEW_DUE,
    labelArabic: 'مستحق للتعاهد',
    descriptionArabic: 'حان موعد تعاهد الآيات الكريمة للمحافظة على ثباتها في الصدر.',
    isConsolidated: true,
    schedulingNote: 'موصى بتسميعها في ورد اليوم لتجديد الحفظ.',
  },
  [MemorizationState.WEAKENING]: {
    state: MemorizationState.WEAKENING,
    labelArabic: 'يحتاج تثبيتًا',
    descriptionArabic: 'لوحظ بعض التردد في الاسترجاع الأخير، مما يستوجب المراجعة اللطيفة.',
    isConsolidated: false,
    schedulingNote: 'موصى بتكرارها قبل الانتقال للحفظ الجديد.',
  },
  [MemorizationState.NEEDS_REINFORCEMENT]: {
    state: MemorizationState.NEEDS_REINFORCEMENT,
    labelArabic: 'يحتاج عناية وتصحيحًا',
    descriptionArabic: 'موضع يحتاج تركيزًا خاصًا لضبط أحكام التجويد أو تصحيح مواضع الشبهة.',
    isConsolidated: false,
    schedulingNote: 'أولوية متقدمة في جدول التسميع لتأكيد التصحيح.',
  },
  [MemorizationState.MASTERED]: {
    state: MemorizationState.MASTERED,
    labelArabic: 'إتقان مرحلي (جدولة متباعدة)',
    descriptionArabic: 'ثبات الاسترجاع والتجويد بدقة عالية على فترات متباعدة.',
    isConsolidated: true,
    schedulingNote: 'حالة جدولية تربوية: تخضع للتعاهد المتباعد، وليست إجازة شرعية أو تصديقًا إسناديًا.',
  },
};

/**
 * 2. Revision Urgency Semantic Definitions
 */
export const REVIEW_URGENCY_METAS: Record<ReviewUrgency, ReviewUrgencyMeta> = {
  [ReviewUrgency.CRITICAL_WEAKNESS]: {
    urgency: ReviewUrgency.CRITICAL_WEAKNESS,
    labelArabic: 'أولوية قصوى',
    descriptionArabic: 'موضع رُصدت فيه ملاحظات متكررة، يُستحب البدء بتعاهده وتصحيحه أولاً.',
    badgeVariant: 'critical',
  },
  [ReviewUrgency.REVIEW_OVERDUE]: {
    urgency: ReviewUrgency.REVIEW_OVERDUE,
    labelArabic: 'مراجعة متأخرة',
    descriptionArabic: 'تجاوزت الآية موعد التعاهد المجدول، ومراجعتها اليوم تصونها من التفلت.',
    badgeVariant: 'warning',
  },
  [ReviewUrgency.REVIEW_DUE]: {
    urgency: ReviewUrgency.REVIEW_DUE,
    labelArabic: 'مستحقة اليوم',
    descriptionArabic: 'مقرر تعاهدها في جدول مراجعة اليوم المبارك.',
    badgeVariant: 'info',
  },
  [ReviewUrgency.REVIEW_SOON]: {
    urgency: ReviewUrgency.REVIEW_SOON,
    labelArabic: 'مراجعة قادمة',
    descriptionArabic: 'حفظ مستقر حاليًا، وموعد مراجعتها يقترب خلال الأيام القادمة.',
    badgeVariant: 'upcoming',
  },
  [ReviewUrgency.NO_REVIEW_REQUIRED]: {
    urgency: ReviewUrgency.NO_REVIEW_REQUIRED,
    labelArabic: 'مستقر جدولياً',
    descriptionArabic: 'الحفظ راسخ والآية مجدولة في وقت لاحق بحسب التكرار المتباعد.',
    badgeVariant: 'stable',
  },
};

/**
 * 3. Evidence Status Safe Presentation Mapping
 */
export function formatEvidenceStatusArabic(status: EvidenceStatus): { title: string; note: string; isError: boolean } {
  switch (status) {
    case EvidenceStatus.CONFIRMED:
      return {
        title: 'موضع مؤكد يحتاج عناية',
        note: 'تم التحقق من موضع الملاحظة بوضوح في التسجيل.',
        isError: true,
      };
    case EvidenceStatus.POSSIBLE:
      return {
        title: 'ملاحظة محتملة تحتاج تثبتاً',
        note: 'يُفضل إعادة التلاوة بروية للتأكد من تمام الأداء والتجويد.',
        isError: false,
      };
    case EvidenceStatus.INCONCLUSIVE:
      return {
        title: 'إشارة صوتية غير كافية',
        note: 'لم يكن الصوت واضحًا بالقدر الكافي للتقييم، ولا يؤثر ذلك على تقدمك في الحفظ.',
        isError: false,
      };
    case EvidenceStatus.NO_EVIDENCE:
    default:
      return {
        title: 'بانتظار التسميع',
        note: 'لم تُسجل تلاوة لهذه الآية بعد.',
        isError: false,
      };
  }
}
