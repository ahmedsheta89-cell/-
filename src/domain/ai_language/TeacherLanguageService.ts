/**
 * @file TeacherLanguageService.ts
 * @module domain/ai_language
 * @description Orchestrates the Phase 7B AI Language & Conversation Layer pipeline (Sections 30-37).
 * 
 * CORE RESPONSIBILITY:
 * - Realizes authorized TeacherFeedbackIntent into natural Arabic.
 * - Protects pipeline with cryptographic snapshots, sequence tracking, and validation gates.
 * - Handles conversational questions with strict scholar deferral for religious queries.
 * - Guarantees 100% offline uptime via deterministic fallback.
 */

import {
  TeacherLanguageContext,
  TeacherLanguageOutput,
  ConversationalQueryContext,
  ConversationalQueryOutput,
  LanguageAuditTrail,
} from './types.ts';
import { IAILanguageProvider, ITeacherLanguageService } from './IAILanguageProvider.ts';
import { DeterministicFallbackProvider } from './DeterministicFallbackProvider.ts';
import { TeacherLanguageValidator, EXTENDED_FORBIDDEN_CLAIMS, PROMPT_INJECTION_INDICATORS } from './TeacherLanguageValidator.ts';
import { createLanguageSnapshot, deepFreeze, computeSha256 } from './LanguageSnapshot.ts';

export class TeacherLanguageService implements ITeacherLanguageService {
  private readonly provider: IAILanguageProvider;
  private readonly fallbackProvider: DeterministicFallbackProvider;
  private sessionSequence: number = 1;
  private eventSequence: number = 1;
  private lastFeedbackHash: string = '';
  private lastFeedbackEventId: string = '';

  constructor(provider?: IAILanguageProvider) {
    this.fallbackProvider = DeterministicFallbackProvider.getInstance();
    this.provider = provider || this.fallbackProvider;
  }

  public getCurrentSequence(): { sessionSequence: number; eventSequence: number } {
    return {
      sessionSequence: this.sessionSequence,
      eventSequence: this.eventSequence,
    };
  }

  public advanceEventSequence(): number {
    this.eventSequence += 1;
    return this.eventSequence;
  }

  public resetSequence(sessionSequence: number = 1, eventSequence: number = 1): void {
    this.sessionSequence = sessionSequence;
    this.eventSequence = eventSequence;
    this.lastFeedbackHash = '';
    this.lastFeedbackEventId = '';
  }

  /**
   * Main pipeline realizing teacher feedback intent into verified natural language.
   */
  public async generateTeacherResponse(context: TeacherLanguageContext): Promise<TeacherLanguageOutput> {
    const currentSeq = this.getCurrentSequence();

    // 1. Cryptographic Snapshot Binding
    const snapshot = createLanguageSnapshot(context);

    // 2. Stale Response Pre-check
    if (
      context.sessionSequence !== currentSeq.sessionSequence ||
      context.eventSequence !== currentSeq.eventSequence
    ) {
      return this.fallbackProvider.generateLanguageResponse(
        context,
        true,
        'STALE_TEACHER_RESPONSE'
      );
    }

    // 3. Fast-path optimization: Real-time MINIMAL mode can directly use deterministic templates
    // if provider is unavailable or when cost/latency minimization is prioritized
    if (!this.provider.isAvailable) {
      return this.fallbackProvider.generateLanguageResponse(
        context,
        true,
        'AI_PROVIDER_FAILURE'
      );
    }

    // 4. Invocation of AI Provider with Safe Error Containment
    let candidateOutput: TeacherLanguageOutput;
    try {
      candidateOutput = await this.provider.generateLanguageResponse(context);
    } catch (err: any) {
      const failureReason = err?.message?.includes('LLM_SCHEMA_FAILURE')
        ? 'LLM_SCHEMA_FAILURE'
        : 'AI_PROVIDER_FAILURE';
      return this.fallbackProvider.generateLanguageResponse(context, true, failureReason);
    }

    // 5. Rigorous Multi-Stage Validation Gate
    const validationResult = await TeacherLanguageValidator.validate(
      candidateOutput,
      context,
      currentSeq
    );

    if (!validationResult.isValid) {
      return validationResult.sanitizedOutput;
    }

    // 6. Duplicate Response Tracking (Section 32)
    const currentEventId = `${context.sessionId}:${context.eventSequence}`;
    if (
      this.lastFeedbackEventId === currentEventId &&
      this.lastFeedbackHash === candidateOutput.auditTrail.responseHash
    ) {
      return this.fallbackProvider.generateLanguageResponse(
        context,
        true,
        'DUPLICATE_TEACHER_RESPONSE'
      );
    }

    this.lastFeedbackEventId = currentEventId;
    this.lastFeedbackHash = candidateOutput.auditTrail.responseHash;

    return deepFreeze(candidateOutput);
  }

  /**
   * Handles interactive conversational queries from the student (Section 23, 24, 25, 26).
   */
  public async handleConversationalQuery(
    query: ConversationalQueryContext
  ): Promise<ConversationalQueryOutput> {
    const questionLower = query.userQuestionText.toLowerCase();
    const ctx = query.currentLanguageContext;

    // Check Prompt Injection in User Question
    for (const indicator of PROMPT_INJECTION_INDICATORS) {
      if (questionLower.includes(indicator)) {
        return this.createConversationalResponse(
          'لا يمكن تنفيذ هذا الطلب. نحن نلتزم بتوجيهات المعلم المعتمدة ومراجعة التلاوة فقط.',
          'UNKNOWN',
          false,
          ctx,
          'PROMPT_INJECTION_DETECTED'
        );
      }
    }

    // Check Religious / Fiqh Jurisprudence Questions (Section 24)
    // E.g.: "هل قراءتي دي تبطل الصلاة؟", "هل هذا حرام؟", "هل صلاتي صحيحة؟"
    const isFiqhQuery =
      questionLower.includes('تبطل الصلاة') ||
      questionLower.includes('صلاة باطلة') ||
      questionLower.includes('هل صلاتي') ||
      questionLower.includes('هل هذا حرام') ||
      questionLower.includes('هل هذا حلال') ||
      questionLower.includes('فتوى') ||
      questionLower.includes('حكم شرعي') ||
      questionLower.includes('هل أعيد صلاتي');

    if (isFiqhQuery) {
      const responseArabic =
        'هذه مسألة فقهية تتعلق بأحكام صحة الصلاة والأحكام الشرعية، ونظام المعلم الرقمي لا يصدر فتاوى دينية. يُرجى توجيه هذا السؤال إلى دار الإفتاء أو عالم فقهي متخصص.';
      return this.createConversationalResponse(
        responseArabic,
        'RELIGIOUS_FIQH_QUERY',
        true,
        ctx,
        'DEFER_TO_QUALIFIED_SCHOLAR'
      );
    }

    // Check Quran Content / Tafsir Questions (Section 25)
    // E.g.: "ما معنى هذه الكلمة؟", "ما هو سبب نزول هذه الآية؟"
    const isQuranTafsirQuery =
      questionLower.includes('معنى الآية') ||
      questionLower.includes('سبب نزول') ||
      questionLower.includes('تفسير') ||
      questionLower.includes('معنى كلمة');

    if (isQuranTafsirQuery) {
      const responseArabic =
        'المعلومات التفسيرية التفصيلية غير متوفرة في قاعدة المعرفة المعتمدة حاليًا للتطبيق. يُرجى مراجعة كتب التفسير المعتمدة.';
      return this.createConversationalResponse(
        responseArabic,
        'QURAN_CONTENT_QUERY',
        false,
        ctx,
        'KNOWLEDGE_SOURCE_UNAVAILABLE'
      );
    }

    // Pedagogical Reason Question (Section 23)
    // E.g.: "ليه طلبت مني أعيد؟", "إيه اللي حصل؟"
    let explanation = 'طُلب إعادة القراءة للتثبت من ضبط الكلمة والتلاوة بهدوء.';
    if (ctx.reasonCode.includes('SIGNAL') || ctx.reasonCode.includes('SNR')) {
      explanation = 'طُلب إعادة القراءة لأن وضوح التقاط الصوت من الميكروفون لم يكن كافيًا للتأكد.';
    } else if (ctx.reasonCode.includes('INCONCLUSIVE')) {
      explanation = 'طُلب إعادة القراءة لأن الدليل الصوتي غير حاسم، ومن الأفضل القراءة بوضوح.';
    } else if (ctx.action === 'HIGHLIGHT_POSITION') {
      explanation = 'انتبهنا لموضع الحرف المحدد للتأكد من مخرجه وحركته.';
    } else if (ctx.action === 'DEFER_TO_TEACHER') {
      explanation = 'هذا الموضع دقيق ويحتاج للتلقي والمشافهة المباشرة مع معلّم قرآن مجاز.';
    }

    return this.createConversationalResponse(
      explanation,
      'PEDAGOGICAL_EXPLANATION',
      false,
      ctx
    );
  }

  private createConversationalResponse(
    responseArabic: string,
    queryCategory: 'PEDAGOGICAL_EXPLANATION' | 'RELIGIOUS_FIQH_QUERY' | 'QURAN_CONTENT_QUERY' | 'UNKNOWN',
    isScholarDeferral: boolean,
    ctx: TeacherLanguageContext,
    failureReason?: string
  ): ConversationalQueryOutput {
    const intentId = `${ctx.sessionId}:${ctx.teacherFeedbackIntent.intentType}:${ctx.teacherFeedbackIntent.targetWordIndex}`;
    const auditTrail: LanguageAuditTrail = {
      languageRequestId: `conv-req-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      teacherDecisionId: intentId,
      timestamp: Date.now(),
      policyVersion: ctx.policyVersion,
      provider: this.provider.providerName,
      modelVersion: this.provider.modelName,
      promptPolicyVersion: 'conversational-policy-v1.0.0',
      responseValidationStatus: failureReason ? 'FALLBACK_APPLIED' : 'PASSED',
      responseHash: computeSha256(responseArabic),
      latencyMs: 0,
      sessionSequence: ctx.sessionSequence,
      eventSequence: ctx.eventSequence,
      isFallback: !!failureReason,
      failureReason,
      violations: failureReason ? [failureReason] : [],
    };

    return deepFreeze({
      responseArabic,
      queryCategory,
      isScholarDeferral,
      auditTrail,
    });
  }
}
