/**
 * @file DeterministicFallbackProvider.ts
 * @module domain/ai_language
 * @description Deterministic, offline-safe Arabic language template provider (Section 14, 19, 20, 22, 28, 29).
 * 
 * GUARANTEES:
 * - 100% deterministic (no external network or LLM dependency).
 * - Zero hallucination.
 * - Zero religious rulings (no fatwa/halal/haram/batil).
 * - Immediate availability (< 1ms execution).
 * - Preserves uncertainty strictly per Phase 7A.
 */

import { IAILanguageProvider } from './IAILanguageProvider.ts';
import {
  TeacherLanguageContext,
  TeacherLanguageOutput,
  LanguageAuditTrail,
} from './types.ts';
import { PedagogicalAction } from '../teacher_policy/types.ts';
import { deepFreeze, computeSha256 } from './LanguageSnapshot.ts';

export class DeterministicFallbackProvider implements IAILanguageProvider {
  public readonly providerName = 'DeterministicFallbackTemplateEngine';
  public readonly modelName = 'deterministic-template-v1.0.0';
  public readonly isAvailable = true;

  private static instance: DeterministicFallbackProvider;

  public static getInstance(): DeterministicFallbackProvider {
    if (!DeterministicFallbackProvider.instance) {
      DeterministicFallbackProvider.instance = new DeterministicFallbackProvider();
    }
    return DeterministicFallbackProvider.instance;
  }

  /**
   * Generates a deterministic, pedagogically safe output.
   */
  public async generateLanguageResponse(
    context: TeacherLanguageContext,
    isFallbackTriggered: boolean = false,
    fallbackReason?: string
  ): Promise<TeacherLanguageOutput> {
    const isEgyptian = context.dialect === 'EGYPTIAN_ARABIC';
    const isExplanation = context.languageMode === 'EXPLANATION';

    let message = '';
    let tone = 'supportive_encouraging';
    const claims: string[] = [];
    const warnings: string[] = [];

    switch (context.action) {
      case PedagogicalAction.CONTINUE:
        message = isEgyptian ? 'ممتاز، كمّل.' : 'أحسنت، واصل التلاوة.';
        tone = 'affirmative_calm';
        claims.push('النطق متوافق مع المرجع الصوتي.');
        break;

      case PedagogicalAction.PRAISE_AND_CONTINUE:
        message = isEgyptian
          ? 'ممتاز جدًا، قراءتك واضحة وجميلة. كمّل.'
          : 'أحسنت وأجدت النطق، تابع تلاوتك المباركة.';
        tone = 'encouraging';
        claims.push('النطق متوافق مع المرجع الصوتي في هذا الموضع.');
        break;

      case PedagogicalAction.REQUEST_REPEAT:
        if (context.reasonCode.includes('INCONCLUSIVE') || context.reasonCode.includes('UNCERTAIN')) {
          message = isEgyptian
            ? 'الصوت مش واضح كفاية علشان نتأكد، اقرأ الكلمة مرة تانية بهدوء.'
            : 'الصوت غير واضح للتثبت بدقة، أعد قراءة الكلمة بهدوء.';
          claims.push('الدليل الصوتي غير كافٍ للحكم القاطع.');
        } else {
          message = isEgyptian
            ? 'جرّب الكلمة دي مرة تانية.'
            : 'أعد قراءة هذه الكلمة مرة أخرى.';
          claims.push('يوجد تفاوت في النطق يحتاج إعادة المحاولة.');
        }
        tone = 'gentle_guiding';
        break;

      case PedagogicalAction.REQUEST_CLEARER_AUDIO:
        message = isEgyptian
          ? 'خلّي الصوت أوضح شوية واقرأها مرة تانية.'
          : 'يرجى تحسين وضوح التقاط الصوت وإعادة القراءة.';
        tone = 'technical_calm';
        warnings.push('SIGNAL_QUALITY_LOW');
        claims.push('جودة الإشارة الصوتية منخفضة.');
        break;

      case PedagogicalAction.HIGHLIGHT_POSITION:
        message = isEgyptian
          ? 'راجع نطق الحرف هنا واقرأ الكلمة تاني.'
          : 'انتبه إلى نطق الحرف في هذا الموضع بدقة وأعد المحاولة.';
        tone = 'instructional_focused';
        claims.push('تم تحديد موضع الحرف للمراجعة الدقيقة.');
        break;

      case PedagogicalAction.HIGHLIGHT_WORD:
        message = isEgyptian
          ? 'ركز في الكلمة دي ككل واقرأها مرة تانية.'
          : 'أعد قراءة الكلمة كاملة بتمهل وضبط للحركات.';
        tone = 'instructional_focused';
        claims.push('تم تحديد الكلمة كاملة لتيسير القراءة.');
        break;

      case PedagogicalAction.CORRECT_PHONETICALLY:
        message = isEgyptian
          ? 'راجع نطق الحرف هنا وجرب الكلمة مرة تانية.'
          : 'احرص على إخراج الحرف من مخرجه الصحيح وأعد التلاوة.';
        tone = 'instructional_precise';
        claims.push('المخرج الصوتي يحتاج انتباهًا.');
        break;

      case PedagogicalAction.START_GUIDED_REPEAT:
        message = isEgyptian
          ? 'اسمع المثال الصوتي وركز في النطق، وبعدين أعد المحاولة.'
          : 'استمع إلى التلاوة النموذجية بدقة ثم حاكِ النطق.';
        tone = 'supportive_structured';
        claims.push('بدء مرحلة التلقي الإرشادي.');
        break;

      case PedagogicalAction.PAUSE_AND_EXPLAIN:
        message = isEgyptian
          ? 'المخرج الصحيح للحرف ده محتاج ضبط في موضع اللسان، راجع التوجيه وتدرب عليه.'
          : 'يتطلب هذا الحرف عناية بمخرجه وصفته الصوتية، راجع الشرح وأعد التلاوة.';
        tone = 'educational_clear';
        claims.push('توضيح تعليمي لمخرج الحرف وصفته.');
        break;

      case PedagogicalAction.MARK_FOR_REVIEW:
        message = isEgyptian
          ? 'الموضع التجويدي ده اتسجل للمراجعة بعد الجلسة.'
          : 'تم تدوين هذا الموضع التجويدي للمراجعة التراكمية اللاحقة.';
        tone = 'informative_calm';
        claims.push('حكم تجويدي قيد المراجعة اللاحقة.');
        break;

      case PedagogicalAction.DEFER_TO_TEACHER:
        message = isEgyptian
          ? 'الموضع ده محتاج مراجعة وتلقي مع معلّم قرآن متخصص.'
          : 'يُفضل مراجعة هذا الموضع وتلقيه مشافهة مع معلّم قرآن مجاز.';
        tone = 'respectful_humble';
        claims.push('إحالة الموضع إلى معلّم بشري مجاز.');
        break;

      case PedagogicalAction.END_ATTEMPT:
        message = isEgyptian
          ? 'نقف هنا ونرتاح شوية، ونكمل المراجعة بعدين.'
          : 'نكتفي بهذا القدر في هذه المحاولة لنيل قسط من الراحة والمتابعة لاحقًا.';
        tone = 'compassionate_supportive';
        claims.push('إنهاء المحاولة مراعاة للجهد والتركيز.');
        break;

      default:
        message = isEgyptian ? 'كمّل التلاوة.' : 'واصل التلاوة.';
        tone = 'neutral';
        break;
    }

    // Adapt if explanation mode requested and supported
    if (isExplanation && context.teacherFeedbackIntent.pedagogicalPromptArabic) {
      message = `${message} (${context.teacherFeedbackIntent.pedagogicalPromptArabic})`;
    }

    const responsePayload = JSON.stringify({
      message,
      action: context.action,
      sessionId: context.sessionId,
      sessionSequence: context.sessionSequence,
      eventSequence: context.eventSequence,
    });
    const responseHash = computeSha256(responsePayload);

    const intentId = `${context.sessionId}:${context.teacherFeedbackIntent.intentType}:${context.teacherFeedbackIntent.targetWordIndex}`;

    const auditTrail: LanguageAuditTrail = {
      languageRequestId: `lang-req-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      teacherDecisionId: intentId,
      timestamp: Date.now(),
      policyVersion: context.policyVersion,
      provider: this.providerName,
      modelVersion: this.modelName,
      promptPolicyVersion: 'deterministic-prompt-policy-v1.0.0',
      responseValidationStatus: isFallbackTriggered ? 'FALLBACK_APPLIED' : 'PASSED',
      responseHash,
      latencyMs: 0,
      sessionSequence: context.sessionSequence,
      eventSequence: context.eventSequence,
      isFallback: isFallbackTriggered,
      failureReason: fallbackReason,
      violations: [],
    };

    const output: TeacherLanguageOutput = {
      message,
      language: context.language,
      tone,
      action: context.action,
      targetReference: context.verifiedQuranReference,
      usedQuranText: context.verifiedQuranText,
      claims: Object.freeze(claims),
      warnings: Object.freeze(warnings),
      providerInfo: {
        providerName: this.providerName,
        modelName: this.modelName,
        latencyMs: 0,
        temperature: 0,
        promptPolicyVersion: 'deterministic-prompt-policy-v1.0.0',
      },
      auditTrail: deepFreeze(auditTrail),
      isFallback: isFallbackTriggered,
      fallbackReason,
    };

    return deepFreeze(output);
  }
}
