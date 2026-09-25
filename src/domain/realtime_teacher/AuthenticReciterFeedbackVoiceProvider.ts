/**
 * @file AuthenticReciterFeedbackVoiceProvider.ts
 * @module domain/realtime_teacher
 * @description Advanced pedagogical voice provider combining Arabic teacher guidance
 * with authentic benchmark reciter audio (Sheikh Al-Husary, Sheikh Al-Minshawi, etc.).
 * 
 * Strict safety invariants:
 * - Echo prevention via active teacher speaking state
 * - Safe fallback to browser speech synthesis or high-fidelity text feedback
 * - Strict non-blocking async execution
 */

import { ITeacherVoiceProvider, VoicePlaybackResult } from './ITeacherVoiceProvider.ts';
import { TeacherLanguageOutput } from '../ai_language/types.ts';
import { CANONICAL_RECITERS, buildAyahAudioUrl } from '../reciter/reciters.ts';

export class AuthenticReciterFeedbackVoiceProvider implements ITeacherVoiceProvider {
  public readonly providerName = 'AuthenticReciterFeedbackVoiceProvider';
  private _isTeacherSpeaking = false;
  private currentAudioElement: HTMLAudioElement | null = null;
  private currentUtterance: any = null;
  private activeReciterId = 'husary_murattal';

  constructor(reciterId: string = 'husary_murattal') {
    this.activeReciterId = reciterId;
  }

  public setReciter(reciterId: string): void {
    if (CANONICAL_RECITERS.some((r) => r.id === reciterId)) {
      this.activeReciterId = reciterId;
    }
  }

  public get currentReciterId(): string {
    return this.activeReciterId;
  }

  public get isVoiceAvailable(): boolean {
    return typeof window !== 'undefined';
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

    this._isTeacherSpeaking = true;
    if (onPlaybackStart) onPlaybackStart();

    const startTime = Date.now();
    const textToSpeak = output.message;

    // Use SpeechSynthesis for the pedagogical advice
    return new Promise<VoicePlaybackResult>((resolve) => {
      const handleComplete = (success: boolean) => {
        this._isTeacherSpeaking = false;
        this.currentUtterance = null;
        if (onPlaybackEnd) onPlaybackEnd();
        resolve({
          success,
          spokenText: textToSpeak,
          durationMs: Date.now() - startTime,
          fallbackToText: !success,
        });
      };

      if (!('speechSynthesis' in window)) {
        handleComplete(false);
        return;
      }

      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = 'ar-SA';
        utterance.rate = 0.92;
        utterance.pitch = 1.0;

        // Choose best available Arabic voice
        const voices = window.speechSynthesis.getVoices();
        const arabicVoice = voices.find((v) => v.lang.startsWith('ar') || v.name.includes('Arabic'));
        if (arabicVoice) {
          utterance.voice = arabicVoice;
        }

        utterance.onend = () => handleComplete(true);
        utterance.onerror = () => handleComplete(false);

        // Safety timeout (5 seconds max for feedback message)
        const timer = setTimeout(() => {
          window.speechSynthesis.cancel();
          handleComplete(false);
        }, 5000);

        utterance.addEventListener('end', () => clearTimeout(timer), { once: true });
        utterance.addEventListener('error', () => clearTimeout(timer), { once: true });

        this.currentUtterance = utterance;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        handleComplete(false);
      }
    });
  }

  /**
   * Plays the authentic recitation of an Ayah from the selected benchmark reciter.
   * e.g. Al-Husary or Al-Minshawi, so student listens to divine precision.
   */
  public async playAuthenticAyah(
    surahNumber: number,
    ayahNumber: number,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: string) => void
  ): Promise<HTMLAudioElement | null> {
    this.stop();

    const audioUrl = buildAyahAudioUrl(this.activeReciterId, surahNumber, ayahNumber);
    const audio = new Audio(audioUrl);
    this.currentAudioElement = audio;
    this._isTeacherSpeaking = true;

    return new Promise((resolve) => {
      audio.onplay = () => {
        this._isTeacherSpeaking = true;
        if (onStart) onStart();
      };

      audio.onended = () => {
        this._isTeacherSpeaking = false;
        this.currentAudioElement = null;
        if (onEnd) onEnd();
        resolve(audio);
      };

      audio.onerror = () => {
        this._isTeacherSpeaking = false;
        this.currentAudioElement = null;
        const errMsg = `تعذر تحميل تلاوة الشيخ المعتمدة من المصدر الموثق.`;
        if (onError) onError(errMsg);
        if (onEnd) onEnd();
        resolve(null);
      };

      audio.play().then(() => {
        resolve(audio);
      }).catch((err) => {
        this._isTeacherSpeaking = false;
        if (onError) onError(err?.message || 'خطأ في تشغيل الصوت');
        if (onEnd) onEnd();
        resolve(null);
      });
    });
  }

  public stop(): void {
    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
        this.currentAudioElement.currentTime = 0;
      } catch (e) {
        // Safe ignore
      }
      this.currentAudioElement = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // Safe ignore
      }
    }

    this._isTeacherSpeaking = false;
    this.currentUtterance = null;
  }
}
