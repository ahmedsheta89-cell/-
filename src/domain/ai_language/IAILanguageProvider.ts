/**
 * @file IAILanguageProvider.ts
 * @module domain/ai_language
 * @description Provider and service abstraction for AI Language realization (Section 5, 36).
 */

import {
  TeacherLanguageContext,
  TeacherLanguageOutput,
  ConversationalQueryContext,
  ConversationalQueryOutput,
} from './types.ts';

/**
 * Interface for AI Language Providers (e.g. Gemini, Offline Template Engine).
 * Allows future providers without changing Teacher Policy or domain logic.
 */
export interface IAILanguageProvider {
  readonly providerName: string;
  readonly modelName: string;
  readonly isAvailable: boolean;

  /**
   * Realizes the authorized TeacherFeedbackIntent into structured natural language.
   */
  generateLanguageResponse(context: TeacherLanguageContext): Promise<TeacherLanguageOutput>;
}

/**
 * Service orchestrating the complete Teacher Language pipeline.
 */
export interface ITeacherLanguageService {
  /**
   * Evaluates and produces an authorized, safe teacher response.
   * Guarantees output.action === input.action (or safe fallback).
   */
  generateTeacherResponse(context: TeacherLanguageContext): Promise<TeacherLanguageOutput>;

  /**
   * Processes conversational queries or questions from the learner.
   * Enforces scholar deferral for Fiqh/Fatwa and verified knowledge source bounds.
   */
  handleConversationalQuery(query: ConversationalQueryContext): Promise<ConversationalQueryOutput>;

  /**
   * Returns current sequence state for stale response detection.
   */
  getCurrentSequence(): { sessionSequence: number; eventSequence: number };

  /**
   * Advances event sequence upon new recitation milestone or audio chunk.
   */
  advanceEventSequence(): number;
}
