/**
 * @file VoiceActivityDetectorImpl.ts
 * @module application/recitation
 * @description Voice Activity Detection using adaptive dual-threshold energy & zero-crossing rate.
 * Distinguishes recitation speech from natural pauses and acoustic silence.
 * Enforces startMs, endMs, confidence without treating every noise as speech or silence as error.
 */

import { AudioChunk } from '../../domain/recitation/audioCaptureTypes.ts';
import {
  IVoiceActivityDetector,
  VadActivityState,
  VadEventType,
  VadSegment,
  VadStreamState,
} from '../../domain/recitation/vadTypes.ts';

export class VoiceActivityDetectorImpl implements IVoiceActivityDetector {
  private segments: VadSegment[] = [];
  private currentSegment: VadSegment | null = null;
  private energyThresholdRms = 0.025; // Adaptive base threshold
  private noiseFloorRms = 0.005;
  private hangoverRemainingFrames = 0;
  private readonly HANGOVER_FRAMES_COUNT = 3; // ~150-200ms hangover to preserve ending consonants

  private isSpeaking = false;
  private currentSegmentStartMs = 0;
  private lastSpeechDetectedMs = 0;
  private consecutiveSilenceMs = 0;
  private totalSpeechDurationMs = 0;
  private totalSilenceDurationMs = 0;

  getDetectorName(): string {
    return 'Adaptive Energy-ZCR Quranic VAD (Dual Threshold)';
  }

  reset(): void {
    this.segments = [];
    this.currentSegment = null;
    this.hangoverRemainingFrames = 0;
    this.isSpeaking = false;
    this.currentSegmentStartMs = 0;
    this.lastSpeechDetectedMs = 0;
    this.consecutiveSilenceMs = 0;
    this.totalSpeechDurationMs = 0;
    this.totalSilenceDurationMs = 0;
    this.energyThresholdRms = 0.025;
    this.noiseFloorRms = 0.005;
  }

  processChunk(
    chunkOrPcm: AudioChunk | Float32Array,
    timestampMsParam?: number,
    sampleRateHzParam?: number
  ): VadSegment {
    let pcmData: Float32Array;
    let timestampMs: number;
    let sampleRateHz: number;

    if (chunkOrPcm instanceof Float32Array) {
      pcmData = chunkOrPcm;
      timestampMs = timestampMsParam ?? 0;
      sampleRateHz = sampleRateHzParam ?? 16000;
    } else {
      pcmData = chunkOrPcm.pcmData;
      timestampMs = chunkOrPcm.timestampMs;
      sampleRateHz = chunkOrPcm.sampleRateHz || 16000;
    }

    const len = pcmData.length;

    if (len === 0) {
      return {
        id: `vad-${timestampMs}`,
        segmentId: `vad-${timestampMs}`,
        type: VadEventType.SILENCE,
        state: VadActivityState.SILENCE,
        startTimeMs: timestampMs,
        endTimeMs: timestampMs,
        startMs: timestampMs,
        endMs: timestampMs,
        durationMs: 0,
        energyLevelRms: 0,
        averageEnergyRms: 0,
        confidence: 1.0,
        isRecitationCandidate: false,
        isConfirmed: true,
      };
    }

    let sumSquares = 0;
    let zeroCrossings = 0;

    for (let i = 0; i < len; i++) {
      const val = pcmData[i];
      sumSquares += val * val;
      if (i > 0 && ((val >= 0 && pcmData[i - 1] < 0) || (val < 0 && pcmData[i - 1] >= 0))) {
        zeroCrossings++;
      }
    }

    const rms = Math.sqrt(sumSquares / len);
    const zcr = zeroCrossings / len;
    const durationMs = Math.round((len / sampleRateHz) * 1000);

    // Adaptive noise floor tracking
    if (rms < this.noiseFloorRms * 1.5) {
      this.noiseFloorRms = this.noiseFloorRms * 0.95 + rms * 0.05;
      this.energyThresholdRms = Math.max(0.015, this.noiseFloorRms * 3.5);
    }

    let detectedState: VadActivityState;
    let detectedType: VadEventType;
    let confidence: number;
    let isCandidate = false;

    const isHighEnergy = rms > this.energyThresholdRms;
    const isMediumEnergy = rms > this.energyThresholdRms * 0.55;

    if (isHighEnergy) {
      detectedState = VadActivityState.SPEECH;
      detectedType = VadEventType.SPEECH_START;
      this.hangoverRemainingFrames = this.HANGOVER_FRAMES_COUNT;
      confidence = Math.min(1.0, 0.7 + (rms / (this.energyThresholdRms * 2)) * 0.3);
      isCandidate = true;
      this.isSpeaking = true;
      this.lastSpeechDetectedMs = timestampMs + durationMs;
      this.consecutiveSilenceMs = 0;
      this.totalSpeechDurationMs += durationMs;
    } else if (this.hangoverRemainingFrames > 0 && isMediumEnergy) {
      // Hangover region preserves ending consonants (e.g. sukoon, tanween)
      detectedState = VadActivityState.SPEECH;
      detectedType = VadEventType.SPEECH_START;
      this.hangoverRemainingFrames--;
      confidence = 0.82;
      isCandidate = true;
      this.isSpeaking = true;
      this.lastSpeechDetectedMs = timestampMs + durationMs;
      this.consecutiveSilenceMs = 0;
      this.totalSpeechDurationMs += durationMs;
    } else if (isMediumEnergy && zcr > 0.08) {
      // Soft fricative consonant (س، ش، ف، ث)
      detectedState = VadActivityState.UNCERTAIN;
      detectedType = VadEventType.UNCERTAIN;
      confidence = 0.55;
      isCandidate = true;
    } else if (rms > this.noiseFloorRms * 1.8) {
      // Natural pause between words
      detectedState = VadActivityState.PAUSE;
      detectedType = VadEventType.PAUSE;
      confidence = 0.88;
      isCandidate = false;
      this.isSpeaking = false;
      this.consecutiveSilenceMs += durationMs;
    } else {
      detectedState = VadActivityState.SILENCE;
      detectedType = this.isSpeaking ? VadEventType.SPEECH_END : VadEventType.SILENCE;
      confidence = 0.95;
      isCandidate = false;
      this.isSpeaking = false;
      this.consecutiveSilenceMs += durationMs;
      this.totalSilenceDurationMs += durationMs;
    }

    const segment: VadSegment = {
      id: `vad-${timestampMs}`,
      segmentId: `vad-${timestampMs}`,
      type: detectedType,
      state: detectedState,
      startTimeMs: timestampMs,
      endTimeMs: timestampMs + durationMs,
      startMs: timestampMs,
      endMs: timestampMs + durationMs,
      durationMs,
      energyLevelRms: Math.round(rms * 1000) / 1000,
      averageEnergyRms: Math.round(rms * 1000) / 1000,
      confidence: Math.round(confidence * 100) / 100,
      isRecitationCandidate: isCandidate,
      isConfirmed: confidence >= 0.7,
    };

    // Coalesce continuous states if contiguous
    if (this.currentSegment && this.currentSegment.state === detectedState) {
      this.currentSegment.endMs = segment.endMs;
      this.currentSegment.endTimeMs = segment.endMs;
      this.currentSegment.durationMs += segment.durationMs;
      this.currentSegment.averageEnergyRms =
        ((this.currentSegment.averageEnergyRms || 0) + (segment.averageEnergyRms || 0)) / 2;
    } else {
      if (this.currentSegment) {
        this.segments.push(this.currentSegment);
      }
      this.currentSegment = { ...segment };
      this.currentSegmentStartMs = segment.startMs;
    }

    return segment;
  }

  getCurrentState(): VadStreamState {
    return {
      isSpeaking: this.isSpeaking,
      currentSegmentStartMs: this.currentSegmentStartMs,
      lastSpeechDetectedMs: this.lastSpeechDetectedMs,
      consecutiveSilenceMs: this.consecutiveSilenceMs,
      totalSpeechDurationMs: this.totalSpeechDurationMs,
      totalSilenceDurationMs: this.totalSilenceDurationMs,
    };
  }

  getSegments(): VadSegment[] {
    const list = [...this.segments];
    if (this.currentSegment) {
      list.push(this.currentSegment);
    }
    return list;
  }

  getActiveSpeechDurationMs(): number {
    return this.getSegments()
      .filter((s) => s.state === VadActivityState.SPEECH)
      .reduce((acc, s) => acc + s.durationMs, 0);
  }

  getTotalPauseDurationMs(): number {
    return this.getSegments()
      .filter((s) => s.state === VadActivityState.PAUSE)
      .reduce((acc, s) => acc + s.durationMs, 0);
  }
}
