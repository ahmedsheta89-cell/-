/**
 * @file IAudioAnalysisProvider.ts
 * @module infrastructure/interfaces
 * @description Contract for speech recognition, phonetic alignment, and acoustic feature extraction.
 * Note: Decoupled from any specific Whisper / Kaldi / Vosk / ML service.
 */

import { QuranWord, RiwayahType } from '../../domain/quran/types.ts';
import { DetectedWordMatch } from '../../domain/recitation/types.ts';

export interface ForcedAlignmentInput {
  audioBuffer: ArrayBuffer;
  sampleRateHz: number;
  expectedWords: QuranWord[];
  riwayah: RiwayahType;
}

export interface ForcedAlignmentResult {
  matches: DetectedWordMatch[];
  overallConfidence: number;
  processingTimeMs: number;
  silenceRegions: { startMs: number; endMs: number }[];
}

export interface IAudioAnalysisProvider {
  alignAudioToExpectedText(input: ForcedAlignmentInput): Promise<ForcedAlignmentResult>;
  detectVAD(audioChunk: ArrayBuffer): Promise<{ isSpeech: boolean; energyDb: number }>;
}
