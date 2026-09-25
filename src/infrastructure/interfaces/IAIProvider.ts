/**
 * @file IAIProvider.ts
 * @module infrastructure/interfaces
 * @description Generative AI service abstraction (decoupled from Google GenAI / Gemini / OpenAI).
 * STRICT BOUNDARY: AI is exclusively used for pedagogical explanations, student dialogue,
 * and adaptive exercise generation. It is FORBIDDEN from generating or verifying Quranic text.
 */

import { RecitationErrorDetail } from '../../domain/errors/types.ts';

export interface PedagogicalExplanationRequest {
  error: RecitationErrorDetail;
  studentLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  targetWordTextUthmani: string;
  surahNameArabic: string;
}

export interface PedagogicalExplanationResponse {
  explanationArabic: string;
  makhrajAdviceArabic: string;
  motivationalNoteArabic: string;
  exercisePromptArabic?: string;
}

export interface StudentWeaknessAnalysisRequest {
  recentErrors: RecitationErrorDetail[];
  totalWordsRecited: number;
}

export interface StudentWeaknessAnalysisResponse {
  summaryArabic: string;
  primaryAreaOfFocus: string;
  suggestedDrillsArabic: string[];
}

export interface IAIProvider {
  explainRecitationError(request: PedagogicalExplanationRequest): Promise<PedagogicalExplanationResponse>;
  analyzeWeaknessPattern(request: StudentWeaknessAnalysisRequest): Promise<StudentWeaknessAnalysisResponse>;
}
