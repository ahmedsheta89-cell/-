/**
 * @file AudioTurnTakingDetector.ts
 * @module domain/realtime_teacher
 * @description Real-time audio turn-taking and speech boundary detection (Sections 5, 6, 7, 22).
 * 
 * CORE CONTRACT:
 * - Distinguishes STUDENT_AUDIO, TEACHER_AUDIO, SYSTEM_AUDIO, SILENCE, NOISE.
 * - Suppresses microphone inputs during teacher speech (Echo & Feedback Loop Protection).
 * - Distinguishes intra-word pause, breath, intentional waqf, dropout, and speech cessation.
 */

import {
  AudioSeparationType,
  SpeechBoundaryEvidence,
  TeacherInteractionTimingPolicy,
  CANONICAL_TIMING_POLICY,
} from './types.ts';
import { VadActivityState, VadSegment } from '../recitation/vadTypes.ts';

export interface AudioClassificationResult {
  readonly separationType: AudioSeparationType;
  readonly isStudentSpeaking: boolean;
  readonly isEchoSuppressed: boolean;
  readonly rmsEnergy: number;
  readonly snrDb: number;
}

export class AudioTurnTakingDetector {
  private readonly timingPolicy: TeacherInteractionTimingPolicy;
  private isTeacherSpeaking: boolean = false;
  private speechStartMs: number = 0;
  private lastSpeechDetectedMs: number = 0;
  private speechEndCandidateMs: number = 0;
  private isCurrentlySpeaking: boolean = false;
  private silenceDurationMs: number = 0;
  private consecutiveSilenceChunks: number = 0;

  constructor(timingPolicy: TeacherInteractionTimingPolicy = CANONICAL_TIMING_POLICY) {
    this.timingPolicy = timingPolicy;
  }

  public setTeacherSpeaking(speaking: boolean): void {
    this.isTeacherSpeaking = speaking;
  }

  public getTeacherSpeaking(): boolean {
    return this.isTeacherSpeaking;
  }

  public reset(): void {
    this.speechStartMs = 0;
    this.lastSpeechDetectedMs = 0;
    this.speechEndCandidateMs = 0;
    this.isCurrentlySpeaking = false;
    this.silenceDurationMs = 0;
    this.consecutiveSilenceChunks = 0;
    this.isTeacherSpeaking = false;
  }

  /**
   * Classifies an incoming audio frame or VAD state (Section 5, 22).
   */
  public classifyAudio(
    vadState: VadActivityState,
    rmsEnergy: number,
    snrDb: number,
    isExternalSystemAudio: boolean = false
  ): AudioClassificationResult {
    // 1. If teacher is currently speaking, classify as TEACHER_AUDIO (Echo protection)
    if (this.isTeacherSpeaking) {
      return {
        separationType: AudioSeparationType.TEACHER_AUDIO,
        isStudentSpeaking: false,
        isEchoSuppressed: true,
        rmsEnergy,
        snrDb,
      };
    }

    // 2. System audio check
    if (isExternalSystemAudio) {
      return {
        separationType: AudioSeparationType.SYSTEM_AUDIO,
        isStudentSpeaking: false,
        isEchoSuppressed: true,
        rmsEnergy,
        snrDb,
      };
    }

    // 3. Absolute silence or sub-threshold energy
    if (rmsEnergy < 0.005 || vadState === VadActivityState.SILENCE) {
      return {
        separationType: AudioSeparationType.SILENCE,
        isStudentSpeaking: false,
        isEchoSuppressed: false,
        rmsEnergy,
        snrDb,
      };
    }

    // 4. Noise classification: energy present but low SNR or uncertain speech
    if (snrDb < 6.0 || (vadState === VadActivityState.UNCERTAIN && rmsEnergy < 0.015)) {
      return {
        separationType: AudioSeparationType.NOISE,
        isStudentSpeaking: false,
        isEchoSuppressed: false,
        rmsEnergy,
        snrDb,
      };
    }

    // 5. Valid student recitation speech
    return {
      separationType: AudioSeparationType.STUDENT_AUDIO,
      isStudentSpeaking: true,
      isEchoSuppressed: false,
      rmsEnergy,
      snrDb,
    };
  }

  /**
   * Evaluates speech boundary dynamics across incoming chunks (Section 6, 7).
   */
  public processBoundaryTracking(
    classification: AudioClassificationResult,
    chunkDurationMs: number,
    timestampMs: number
  ): SpeechBoundaryEvidence {
    // If echo suppressed, reset student speech detection
    if (classification.isEchoSuppressed) {
      return {
        speechStartMs: this.speechStartMs,
        speechEndCandidateMs: this.speechEndCandidateMs,
        speechEndConfirmedMs: 0,
        silenceDurationMs: this.silenceDurationMs,
        boundaryConfidence: 0.0,
        isConfirmedBoundary: false,
        boundaryType: 'DROPOUT',
      };
    }

    if (classification.isStudentSpeaking) {
      if (!this.isCurrentlySpeaking) {
        this.speechStartMs = timestampMs;
        this.isCurrentlySpeaking = true;
      }
      this.lastSpeechDetectedMs = timestampMs;
      this.silenceDurationMs = 0;
      this.speechEndCandidateMs = 0;
      this.consecutiveSilenceChunks = 0;

      return {
        speechStartMs: this.speechStartMs,
        speechEndCandidateMs: 0,
        speechEndConfirmedMs: 0,
        silenceDurationMs: 0,
        boundaryConfidence: 0.95,
        isConfirmedBoundary: false,
        boundaryType: 'SPEECH_END',
      };
    }

    // Otherwise, student is silent / paused
    if (this.isCurrentlySpeaking) {
      if (this.speechEndCandidateMs === 0) {
        this.speechEndCandidateMs = timestampMs;
      }
      this.silenceDurationMs += chunkDurationMs;
      this.consecutiveSilenceChunks += 1;

      // Classify pause type by duration
      if (this.silenceDurationMs < this.timingPolicy.intraWordPauseToleranceMs) {
        return {
          speechStartMs: this.speechStartMs,
          speechEndCandidateMs: this.speechEndCandidateMs,
          speechEndConfirmedMs: 0,
          silenceDurationMs: this.silenceDurationMs,
          boundaryConfidence: 0.3,
          isConfirmedBoundary: false,
          boundaryType: 'INTRA_WORD_PAUSE',
        };
      }

      if (this.silenceDurationMs < this.timingPolicy.speechBoundarySilenceThresholdMs) {
        return {
          speechStartMs: this.speechStartMs,
          speechEndCandidateMs: this.speechEndCandidateMs,
          speechEndConfirmedMs: 0,
          silenceDurationMs: this.silenceDurationMs,
          boundaryConfidence: 0.65,
          isConfirmedBoundary: false,
          boundaryType: 'BREATH_PAUSE',
        };
      }

      // Beyond silence threshold -> Confirmed speech boundary
      this.isCurrentlySpeaking = false;
      const confirmedEndMs = this.speechEndCandidateMs;

      return {
        speechStartMs: this.speechStartMs,
        speechEndCandidateMs: this.speechEndCandidateMs,
        speechEndConfirmedMs: confirmedEndMs,
        silenceDurationMs: this.silenceDurationMs,
        boundaryConfidence: 0.98,
        isConfirmedBoundary: true,
        boundaryType: 'SPEECH_END',
      };
    }

    return {
      speechStartMs: this.speechStartMs,
      speechEndCandidateMs: this.speechEndCandidateMs,
      speechEndConfirmedMs: 0,
      silenceDurationMs: this.silenceDurationMs,
      boundaryConfidence: 0.9,
      isConfirmedBoundary: false,
      boundaryType: 'SPEECH_END',
    };
  }
}
