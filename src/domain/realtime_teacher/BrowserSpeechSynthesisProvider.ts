/**
 * @file BrowserSpeechSynthesisProvider.ts
 * @module domain/realtime_teacher
 * @description Real-time Web Speech API Voice synthesis provider with echo protection and text fallback (Sections 19, 21, 22).
 */

import { ITeacherVoiceProvider, VoicePlaybackResult } from './ITeacherVoiceProvider.ts';
import { TeacherLanguageOutput } from '../ai_language/types.ts';

export class BrowserSpeechSynthesisProvider implements ITeacherVoiceProvider {
  public readonly providerName = 'BrowserSpeechSynthesisProvider';
  private _isTeacherSpeaking = false;
  private activeUtterance: any = null;
  private readonly timeoutMs: number;

  constructor(timeoutMs: number = 4000) {
    this.timeoutMs = timeoutMs;
  }

  public get isVoiceAvailable(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public get isTeacherSpeaking(): boolean {
    return this._isTeacherSpeaking;
  }

  public async speakValidatedFeedback(
    output: TeacherLanguageOutput,
    onPlaybackStart?: () => void,
    onPlaybackEnd?: () => void
  ): Promise<VoicePlaybackResult> {
    if (!this.isVoiceAvailable) {
      // Fallback: VOICE_FAILURE -> TEXT_FEEDBACK
      if (onPlaybackStart) onPlaybackStart();
      if (onPlaybackEnd) onPlaybackEnd();
      return {
        success: false,
        spokenText: output.message,
        durationMs: 0,
        failureReason: 'UNSUPPORTED_VOICE',
        fallbackToText: true,
      };
    }

    return new Promise((resolve) => {
      const synth = window.speechSynthesis;
      const textToSpeak = output.message;
      const startTime = Date.now();

      // Guard timeout to prevent hanging turns
      const timer = setTimeout(() => {
        this.stop();
        if (onPlaybackEnd) onPlaybackEnd();
        resolve({
          success: false,
          spokenText: textToSpeak,
          durationMs: Date.now() - startTime,
          failureReason: 'VOICE_SYNTHESIS_ERROR',
          fallbackToText: true,
        });
      }, this.timeoutMs);

      try {
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = output.language === 'ar' ? 'ar-SA' : 'ar';
        utterance.rate = 0.95; // Clear deliberate recitation teacher cadence
        utterance.pitch = 1.0;

        // Select Arabic voice if available
        const voices = synth.getVoices();
        const arVoice = voices.find((v) => v.lang.startsWith('ar'));
        if (arVoice) {
          utterance.voice = arVoice;
        }

        utterance.onstart = () => {
          this._isTeacherSpeaking = true;
          if (onPlaybackStart) onPlaybackStart();
        };

        utterance.onend = () => {
          clearTimeout(timer);
          this._isTeacherSpeaking = false;
          this.activeUtterance = null;
          if (onPlaybackEnd) onPlaybackEnd();
          resolve({
            success: true,
            spokenText: textToSpeak,
            durationMs: Date.now() - startTime,
            fallbackToText: false,
          });
        };

        utterance.onerror = (err) => {
          clearTimeout(timer);
          this._isTeacherSpeaking = false;
          this.activeUtterance = null;
          if (onPlaybackEnd) onPlaybackEnd();
          resolve({
            success: false,
            spokenText: textToSpeak,
            durationMs: Date.now() - startTime,
            failureReason: 'VOICE_SYNTHESIS_ERROR',
            fallbackToText: true,
          });
        };

        this.activeUtterance = utterance;
        synth.speak(utterance);
      } catch (err) {
        clearTimeout(timer);
        this._isTeacherSpeaking = false;
        this.activeUtterance = null;
        if (onPlaybackEnd) onPlaybackEnd();
        resolve({
          success: false,
          spokenText: textToSpeak,
          durationMs: Date.now() - startTime,
          failureReason: 'VOICE_SYNTHESIS_ERROR',
          fallbackToText: true,
        });
      }
    });
  }

  public stop(): void {
    if (this.isVoiceAvailable) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    this._isTeacherSpeaking = false;
    this.activeUtterance = null;
  }
}
