/**
 * @file LLMBoundaryContract.ts
 * @module domain/teacher_policy
 * @description Future LLM Boundary Contract and Runtime Safety Validator (Section 15, 25).
 * 
 * CORE CONTRACTUAL GUARANTEE:
 * The Teacher Policy Engine is the authoritative controller.
 * The future LLM layer must consume this policy output and CANNOT override it.
 * 
 * THE LLM MAY:
 * - Phrase feedback naturally in standard spoken or formal Arabic/English.
 * - Adapt tone to student age/proficiency level.
 * - Explain concepts grounded in verified Tajweed texts (*Tuhfat al-Atfal*, *Al-Jazariyyah*).
 * - Answer general pedagogical learning questions using verified sources.
 * 
 * THE LLM MAY NOT:
 * - Change the PedagogicalAction decided by the Policy Engine.
 * - Override or inflate acoustic/alignment confidence scores.
 * - Classify Tajweed rules independently or invent non-canonical rules.
 * - Generate or alter Quranic scripture text.
 * - Invent acoustic or phonetic evidence.
 * - Upgrade INCONCLUSIVE or TAJWEED_EVIDENCE_PENDING to ERROR.
 * - Issue religious verdicts (*Fatwa*, *Hukm*, *Haram*, *Batil*, *Takfeer*).
 */

import { TeacherFeedbackIntent, PedagogicalAction } from './types.ts';

/**
 * Standard forbidden claims in Islamic pedagogy system (Section 17).
 * Any feedback containing these claims must be rejected immediately.
 */
export const FORBIDDEN_PEDAGOGICAL_CLAIMS: readonly string[] = Object.freeze([
  'قراءتك حرام',
  'أنت أخطأت في الدين',
  'هذه القراءة باطلة',
  'هذا حرام',
  'هذا صحيح شرعًا',
  'قراءتك صحيحة شرعًا 100%',
  'صحيح شرعا',
  'باطل شرعا',
  'آثم',
  'اثم',
]);

/**
 * Standard approved Arabic pedagogical concepts (Section 17).
 */
export const ALLOWED_PEDAGOGICAL_CONCEPTS: readonly string[] = Object.freeze([
  'جرّب مرة تانية.',
  'الصوت مش واضح كفاية.',
  'راجع نطق الحرف هنا.',
  'خلينا نعيد الكلمة بهدوء.',
  'ممتاز، كمّل.',
  'نحتاج قراءة أوضح للتأكد.',
  'النطق متوافق مع المرجع الصوتي في هذا الموضع.',
  'استمع إلى التلاوة النموذجية ثم أعد المحاولة.',
]);

/**
 * Proposed LLM response envelope before delivery to the learner.
 */
export interface LLMFeedbackProposal {
  readonly requestedAction: PedagogicalAction;
  readonly proposedArabicText: string;
  readonly proposedEnglishText?: string;
  readonly quotedQuranText?: string;
  readonly intentToken: string;
}

/**
 * Validation result emitted by the boundary gate.
 */
export interface LLMBoundaryValidationResult {
  readonly isValid: boolean;
  readonly sanitizedArabicText: string;
  readonly sanitizedEnglishText: string;
  readonly violations: readonly string[];
  readonly wasOverridden: boolean;
}

/**
 * Validates any candidate LLM response against the immutable TeacherFeedbackIntent.
 */
export class LLMBoundaryValidator {
  /**
   * Validates a proposed LLM output against the authoritative TeacherFeedbackIntent.
   */
  public static validate(
    proposal: LLMFeedbackProposal,
    intent: TeacherFeedbackIntent
  ): LLMBoundaryValidationResult {
    const violations: string[] = [];

    // 1. Action Override Guard: The LLM may NEVER alter the PedagogicalAction
    if (proposal.requestedAction !== intent.action) {
      violations.push(
        `ACTION_MUTATION_FORBIDDEN: LLM attempted to change action from ${intent.action} to ${proposal.requestedAction}`
      );
    }

    // 2. Religious Verdict / Forbidden Claims Guard: Reject fatwa/theological rulings
    const textToCheck = `${proposal.proposedArabicText} ${proposal.proposedEnglishText || ''}`.toLowerCase();
    for (const forbidden of [...FORBIDDEN_PEDAGOGICAL_CLAIMS, ...intent.forbiddenClaims]) {
      if (textToCheck.includes(forbidden.toLowerCase())) {
        violations.push(
          `FORBIDDEN_CLAIM_DETECTED: Output contains theological or religious ruling "${forbidden}"`
        );
      }
    }

    // 3. Quranic Text Integrity Guard: The LLM must not alter or generate Quran text
    if (proposal.quotedQuranText) {
      // If Quran text is quoted, it must exactly match the verified text source
      const normalizedQuoted = proposal.quotedQuranText.trim();
      const normalizedVerified = intent.verifiedTextSource.uthmaniText.trim();
      if (normalizedQuoted !== normalizedVerified && !normalizedVerified.includes(normalizedQuoted)) {
        violations.push(
          `QURAN_TEXT_TAMPERING: Quoted text "${normalizedQuoted}" differs from verified scripture "${normalizedVerified}"`
        );
      }
    }

    // 4. Safe fallback if violations occur: Revert to authoritative policy prompt
    const isValid = violations.length === 0;
    const sanitizedArabicText = isValid
      ? proposal.proposedArabicText
      : intent.pedagogicalPromptArabic;
    const sanitizedEnglishText = isValid
      ? (proposal.proposedEnglishText || intent.pedagogicalPromptEnglish)
      : intent.pedagogicalPromptEnglish;

    return Object.freeze({
      isValid,
      sanitizedArabicText,
      sanitizedEnglishText,
      violations: Object.freeze(violations),
      wasOverridden: !isValid,
    });
  }
}
