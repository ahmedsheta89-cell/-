/**
 * @file MockAudioCaptureProvider.ts
 * @module infrastructure/audio
 * @description Mock Audio Capture Provider for automated testing and deterministic interactive simulation.
 * Never outputs fake confidence scores and clearly distinguishes simulated audio scenarios.
 */

import {
  IAudioCaptureProvider,
  AudioCaptureState,
  AudioStreamMetadata,
  AudioChunk,
} from '../../domain/recitation/audioCaptureTypes.ts';

export type MockScenarioType =
  | 'CLEAN_RECITATION'
  | 'NOISY_ENVIRONMENT'
  | 'MUTED_OR_SILENCE'
  | 'CLIPPING_DISTORTED'
  | 'WORD_SUBSTITUTION'
  | 'SKIPPED_WORD';

export class MockAudioCaptureProvider implements IAudioCaptureProvider {
  private state: AudioCaptureState = AudioCaptureState.UNINITIALIZED;
  private listeners: ((state: AudioCaptureState) => void)[] = [];
  private intervalId: any = null;
  private sequenceNumber = 0;
  private sessionId = 'mock-session-01';
  private scenario: MockScenarioType = 'CLEAN_RECITATION';
  private onChunkCallback: ((chunk: AudioChunk) => void) | null = null;

  constructor(scenario: MockScenarioType = 'CLEAN_RECITATION') {
    this.scenario = scenario;
  }

  setScenario(scenario: MockScenarioType): void {
    this.scenario = scenario;
  }

  getState(): AudioCaptureState {
    return this.state;
  }

  getMetadata(): AudioStreamMetadata | null {
    return {
      sampleRateHz: 16000,
      channels: 1,
      bitDepth: 16,
      durationMs: 3000,
      timestampMs: Date.now(),
      deviceId: 'mock-device-id',
      deviceLabel: `Mock Audio Device (${this.scenario})`,
      isMuted: this.scenario === 'MUTED_OR_SILENCE',
    };
  }

  registerStateListener(listener: (state: AudioCaptureState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private setState(newState: AudioCaptureState): void {
    this.state = newState;
    this.listeners.forEach((l) => l(newState));
  }

  async start(onChunk: (chunk: AudioChunk) => void): Promise<void> {
    this.onChunkCallback = onChunk;
    this.sequenceNumber = 0;
    this.sessionId = `mock-session-${Date.now()}`;
    this.setState(AudioCaptureState.RECORDING);

    const chunkDurationMs = 125; // 125ms per chunk
    const samplesPerChunk = 2000; // at 16000 Hz

    this.intervalId = setInterval(() => {
      if (this.state !== AudioCaptureState.RECORDING) return;

      const pcmData = new Float32Array(samplesPerChunk);

      for (let i = 0; i < samplesPerChunk; i++) {
        switch (this.scenario) {
          case 'CLEAN_RECITATION': {
            // Clean synthetic harmonic voice pattern (around 220Hz fundamental + formant)
            const t = (this.sequenceNumber * samplesPerChunk + i) / 16000;
            pcmData[i] =
              0.35 * Math.sin(2 * Math.PI * 220 * t) +
              0.2 * Math.sin(2 * Math.PI * 440 * t) +
              0.02 * (Math.random() - 0.5);
            break;
          }

          case 'NOISY_ENVIRONMENT': {
            // High noise floor
            const t = (this.sequenceNumber * samplesPerChunk + i) / 16000;
            pcmData[i] = 0.15 * Math.sin(2 * Math.PI * 220 * t) + 0.35 * (Math.random() - 0.5);
            break;
          }

          case 'MUTED_OR_SILENCE': {
            // Near-zero energy
            pcmData[i] = 0.0005 * (Math.random() - 0.5);
            break;
          }

          case 'CLIPPING_DISTORTED': {
            // Saturated clipped sine wave
            const t = (this.sequenceNumber * samplesPerChunk + i) / 16000;
            const raw = 1.8 * Math.sin(2 * Math.PI * 300 * t);
            pcmData[i] = Math.max(-0.99, Math.min(0.99, raw));
            break;
          }

          case 'WORD_SUBSTITUTION':
          case 'SKIPPED_WORD':
          default: {
            const t = (this.sequenceNumber * samplesPerChunk + i) / 16000;
            pcmData[i] = 0.3 * Math.sin(2 * Math.PI * 250 * t) + 0.02 * (Math.random() - 0.5);
            break;
          }
        }
      }

      const chunk: AudioChunk = {
        sequenceNumber: this.sequenceNumber++,
        sessionId: this.sessionId,
        timestampMs: Date.now(),
        durationMs: chunkDurationMs,
        pcmData,
        sampleRateHz: 16000,
        channels: 1,
        isFinal: false,
      };

      if (this.onChunkCallback) {
        this.onChunkCallback(chunk);
      }
    }, chunkDurationMs);
  }

  async pause(): Promise<void> {
    this.setState(AudioCaptureState.PAUSED);
  }

  async resume(): Promise<void> {
    this.setState(AudioCaptureState.RECORDING);
  }

  async stop(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.setState(AudioCaptureState.STOPPED);
  }

  async cancel(): Promise<void> {
    await this.stop();
    this.onChunkCallback = null;
  }
}
