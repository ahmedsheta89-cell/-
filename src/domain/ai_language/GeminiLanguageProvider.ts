/**
 * @file GeminiLanguageProvider.ts
 * @module domain/ai_language
 * @description Gemini LLM Language Realization Provider using @google/genai (Sections 5, 6, 7, 8, 9, 35).
 * 
 * DESIGN INVARIANTS:
 * - Lazy initialization of GoogleGenAI client (never crashes if GEMINI_API_KEY is missing).
 * - Deterministic generation (temperature: 0).
 * - System prompt strictly confines the model to realization only.
 * - Enforces structured JSON output.
 * - On any API failure or parse error, throws AI_PROVIDER_FAILURE or LLM_SCHEMA_FAILURE for safe fallback.
 */

import { GoogleGenAI } from '@google/genai';
import { IAILanguageProvider } from './IAILanguageProvider.ts';
import {
  TeacherLanguageContext,
  TeacherLanguageOutput,
  LanguageAuditTrail,
} from './types.ts';
import { deepFreeze, computeSha256 } from './LanguageSnapshot.ts';

export interface GeminiProviderConfig {
  readonly modelName?: string;
  readonly temperature?: number;
  readonly maxOutputTokens?: number;
  readonly timeoutMs?: number;
  readonly promptPolicyVersion?: string;
}

export class GeminiLanguageProvider implements IAILanguageProvider {
  public readonly providerName = 'GeminiLanguageProvider';
  public readonly modelName: string;
  public readonly promptPolicyVersion: string;
  private readonly temperature: number;
  private readonly maxOutputTokens: number;
  private readonly timeoutMs: number;

  private aiClient: GoogleGenAI | null = null;

  constructor(config?: GeminiProviderConfig) {
    this.modelName = config?.modelName || 'gemini-3.8-flash';
    this.temperature = config?.temperature ?? 0.0;
    this.maxOutputTokens = config?.maxOutputTokens ?? 250;
    this.timeoutMs = config?.timeoutMs ?? 5000;
    this.promptPolicyVersion = config?.promptPolicyVersion || 'gemini-prompt-policy-v1.0.0';
  }

  public get isAvailable(): boolean {
    const key = process.env.GEMINI_API_KEY;
    return typeof key === 'string' && key.trim().length > 0;
  }

  private getClient(): GoogleGenAI {
    if (!this.aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('AI_PROVIDER_FAILURE: GEMINI_API_KEY environment variable is missing');
      }
      this.aiClient = new GoogleGenAI({ apiKey });
    }
    return this.aiClient;
  }

  /**
   * Constructs the strict system instruction boundary (Section 8).
   */
  private buildSystemInstruction(context: TeacherLanguageContext): string {
    const dialectInstruction =
      context.dialect === 'EGYPTIAN_ARABIC'
        ? 'Speak in natural, supportive Egyptian Arabic (اللهجة المصرية التربوية المحببة).'
        : 'Speak in clear, classical educational Arabic (اللغة العربية الفصحى التعليمية).';

    return `You are an AI Language Realization Layer for a Quran Teacher System.
You are a language realization layer ONLY.
You do NOT establish Quranic text, recitation correctness, Tajweed rulings, or religious judgments.
All pedagogical teaching actions originate strictly from the deterministic Teacher Policy Engine.

DIALECT DIRECTION:
${dialectInstruction}

YOU MAY:
- Phrase the authorized teaching action naturally and encouragingly.
- Express an already-authorized pedagogical concept concisely.
- Request repetition if authorized.
- Keep output to 1 short, focused sentence during recitation.

YOU MUST NOT:
- Change or tamper with the authorized action: "${context.action}".
- Invent Quran text or recite scripture from model memory.
- Invent Tajweed rules or acoustic measurements.
- Issue religious verdicts (Fatwa, Haram, Halal, Batil, invalidate prayer).
- Claim to be a certified scholar, Mufti, or 100% accurate.
- Convert INCONCLUSIVE into an ERROR.
- Override DEFER_TO_TEACHER or REQUEST_REPEAT.

AUTHORIZED TEACHER POLICY CONTEXT:
- Authorized Action: "${context.action}"
- Reason Code: "${context.reasonCode}"
- Verified Quran Reference: "${context.verifiedQuranReference}"
- Canonical Quran Text: "${context.verifiedQuranText}"
- Allowed Claims: ${JSON.stringify(context.allowedClaims)}
- Forbidden Claims: ${JSON.stringify(context.forbiddenClaims)}

OUTPUT FORMAT:
You MUST respond with a single valid JSON object with EXACTLY this structure:
{
  "message": "string (the natural Arabic feedback sentence)",
  "language": "ar",
  "tone": "string",
  "action": "${context.action}",
  "targetReference": "${context.verifiedQuranReference}",
  "usedQuranText": "${context.verifiedQuranText}",
  "claims": ["string (only from allowed claims)"],
  "warnings": []
}`;
  }

  public async generateLanguageResponse(context: TeacherLanguageContext): Promise<TeacherLanguageOutput> {
    const startTime = Date.now();

    if (!this.isAvailable) {
      throw new Error('AI_PROVIDER_FAILURE: Gemini API key is not configured');
    }

    try {
      const client = this.getClient();
      const systemInstruction = this.buildSystemInstruction(context);

      const promptContent = `Realize the following authorized teacher action into natural pedagogical feedback:
Action: ${context.action}
Dialect: ${context.dialect}
Learner Attempt: ${context.attemptNumber}
Mode: ${context.languageMode}
Canonical Verse Context: ${context.verifiedQuranText}`;

      // Enforce timeout using Promise.race
      const apiCallPromise = client.models.generateContent({
        model: this.modelName,
        contents: promptContent,
        config: {
          systemInstruction,
          temperature: this.temperature,
          maxOutputTokens: this.maxOutputTokens,
          responseMimeType: 'application/json',
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI_PROVIDER_FAILURE: Request timeout')), this.timeoutMs)
      );

      const response = await Promise.race([apiCallPromise, timeoutPromise]);
      const latencyMs = Date.now() - startTime;

      const rawText = response.text?.trim();
      if (!rawText) {
        throw new Error('LLM_SCHEMA_FAILURE: Empty response from model');
      }

      let parsed: any;
      try {
        parsed = JSON.parse(rawText);
      } catch (err) {
        throw new Error(`LLM_SCHEMA_FAILURE: Invalid JSON returned from model: ${rawText}`);
      }

      const responseHash = computeSha256(rawText);
      const intentId = `${context.sessionId}:${context.teacherFeedbackIntent.intentType}:${context.teacherFeedbackIntent.targetWordIndex}`;

      const auditTrail: LanguageAuditTrail = {
        languageRequestId: `gemini-req-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        teacherDecisionId: intentId,
        timestamp: Date.now(),
        policyVersion: context.policyVersion,
        provider: this.providerName,
        modelVersion: this.modelName,
        promptPolicyVersion: this.promptPolicyVersion,
        responseValidationStatus: 'PASSED',
        responseHash,
        latencyMs,
        sessionSequence: context.sessionSequence,
        eventSequence: context.eventSequence,
        isFallback: false,
        violations: [],
      };

      const output: TeacherLanguageOutput = {
        message: String(parsed.message || ''),
        language: String(parsed.language || context.language),
        tone: String(parsed.tone || 'supportive'),
        action: parsed.action, // Might be tampered; validator will catch if altered
        targetReference: String(parsed.targetReference || context.verifiedQuranReference),
        usedQuranText: parsed.usedQuranText ? String(parsed.usedQuranText) : undefined,
        claims: Array.isArray(parsed.claims) ? Object.freeze(parsed.claims.map(String)) : Object.freeze([]),
        warnings: Array.isArray(parsed.warnings) ? Object.freeze(parsed.warnings.map(String)) : Object.freeze([]),
        providerInfo: {
          providerName: this.providerName,
          modelName: this.modelName,
          latencyMs,
          temperature: this.temperature,
          promptPolicyVersion: this.promptPolicyVersion,
        },
        auditTrail: deepFreeze(auditTrail),
        isFallback: false,
      };

      return deepFreeze(output);
    } catch (err: any) {
      if (err?.message?.includes('LLM_SCHEMA_FAILURE')) {
        throw err;
      }
      throw new Error(`AI_PROVIDER_FAILURE: ${err?.message || 'Unknown provider error'}`);
    }
  }
}
