/**
 * @file ITeacherVoiceProvider.ts
 * @module domain/realtime_teacher
 * @description TTS and Voice output abstraction ensuring strict safety gating (Sections 19, 20, 21, 22).
 * 
 * CORE ARCHITECTURAL INVARIANT:
 * TTS may speak ONLY validated TeacherLanguageOutput.
 * Never raw LLM text, never raw model output, never unvalidated Quran text.
 * If voice synthesis fails: VOICE_FAILURE -> TEXT_FEEDBACK (Section 21).
 * When active, marks teacherSpeaking = true to prevent acoustic echo ingestion (Section 22).
 */

import { TeacherLanguageOutput } from '../ai_language/types.ts';

export interface VoicePlaybackResult {
  readonly success: boolean;
  readonly spokenText: string;
  readonly durationMs: number;
  readonly failureReason?: 'VOICE_SYNTHESIS_ERROR' | 'VOICE_MUTED' | 'UNSUPPORTED_VOICE' | 'TEXT_ONLY_MODE';
  readonly fallbackToText: boolean;
}

export interface ITeacherVoiceProvider {
  readonly providerName: string;
  readonly isVoiceAvailable: boolean;
  readonly isTeacherSpeaking: boolean;

  /**
   * Speaks the validated teacher response safely.
   * Emits audio while guarding against echo and unvalidated input.
   */
  speakValidatedFeedback(
    output: TeacherLanguageOutput,
    onPlaybackStart?: () => void,
    onPlaybackEnd?: () => void
  ): Promise<VoicePlaybackResult>;

  /**
   * Immediately aborts any ongoing speech (e.g. on user interruption, session pause).
   */
  stop(): void;
}
