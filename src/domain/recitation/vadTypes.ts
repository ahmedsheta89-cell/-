/**
 * @file vadTypes.ts
 * @module domain/recitation
 * @description Domain contracts for Voice Activity Detection (VAD) and speech segmentation.
 */

import { AudioChunk } from './audioCaptureTypes.ts';

export enum VadActivityState {
  SILENCE = 'SILENCE',
  SPEECH = 'SPEECH',
  PAUSE = 'PAUSE',
  UNCERTAIN = 'UNCERTAIN',
}

export enum VadEventType {
  SPEECH_START = 'SPEECH_START',
  SPEECH_END = 'SPEECH_END',
  PAUSE = 'PAUSE',
  SILENCE = 'SILENCE',
  UNCERTAIN = 'UNCERTAIN',
}

export interface VadSegment {
  id?: string;
  segmentId?: string;
  type?: VadEventType;
  state: VadActivityState;
  startTimeMs?: number;
  endTimeMs?: number;
  startMs: number;
  endMs: number;
  durationMs: number;
  energyLevelRms?: number;
  averageEnergyRms?: number;
  confidence: number; // 0.0 to 1.0
  isRecitationCandidate?: boolean;
  isConfirmed?: boolean;
}

export interface VadStreamState {
  isSpeaking: boolean;
  currentSegmentStartMs: number;
  lastSpeechDetectedMs: number;
  consecutiveSilenceMs: number;
  totalSpeechDurationMs: number;
  totalSilenceDurationMs: number;
}

export interface IVoiceActivityDetector {
  reset(): void;
  getDetectorName(): string;
  processChunk(
    chunkOrPcm: AudioChunk | Float32Array,
    timestampMs?: number,
    sampleRateHz?: number
  ): VadSegment;
  getCurrentState(): VadStreamState;
  getSegments?(): VadSegment[];
}
