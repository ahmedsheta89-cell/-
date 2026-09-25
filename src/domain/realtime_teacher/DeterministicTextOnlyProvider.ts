/**
 * @file DeterministicTextOnlyProvider.ts
 * @module domain/realtime_teacher
 * @description Safe, text-only voice provider implementation (zero synthesis failure risk).
 */

import { ITeacherVoiceProvider, VoicePlaybackResult } from './ITeacherVoiceProvider.ts';
import { TeacherLanguageOutput } from '../ai_language/types.ts';

export class DeterministicTextOnlyProvider implements ITeacherVoiceProvider {
  public readonly providerName = 'DeterministicTextOnlyProvider';
  public readonly isVoiceAvailable = false;
  private _isTeacherSpeaking = false;

  public get isTeacherSpeaking(): boolean {
    return this._isTeacherSpeaking;
  }

  public async speakValidatedFeedback(
    output: TeacherLanguageOutput,
    onPlaybackStart?: () => void,
    onPlaybackEnd?: () => void
  ): Promise<VoicePlaybackResult> {
    this._isTeacherSpeaking = false;
    if (onPlaybackStart) onPlaybackStart();
    if (onPlaybackEnd) onPlaybackEnd();

    return {
      success: true,
      spokenText: output.message,
      durationMs: 0,
      failureReason: 'TEXT_ONLY_MODE',
      fallbackToText: true,
    };
  }

  public stop(): void {
    this._isTeacherSpeaking = false;
  }
}
