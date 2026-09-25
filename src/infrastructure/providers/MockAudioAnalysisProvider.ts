/**
 * @file MockAudioAnalysisProvider.ts
 * @module infrastructure/providers
 * @description Baseline contract implementation of IAudioAnalysisProvider for architecture validation.
 */

import {
  IAudioAnalysisProvider,
  ForcedAlignmentInput,
  ForcedAlignmentResult,
} from '../interfaces/IAudioAnalysisProvider.ts';
import { ConfidenceLevel } from '../../domain/confidence/types.ts';

export class MockAudioAnalysisProvider implements IAudioAnalysisProvider {
  async alignAudioToExpectedText(input: ForcedAlignmentInput): Promise<ForcedAlignmentResult> {
    const matches = input.expectedWords.map((word, idx) => ({
      wordId: word.id,
      expectedTextUthmani: word.textUthmani,
      detectedTextHypothesis: word.textUthmani,
      startTimeMs: idx * 600,
      endTimeMs: (idx + 1) * 600,
      confidence: {
        level: ConfidenceLevel.HIGH,
        score: 0.94,
        reasonArabic: 'تطابق فونيمي وصوتي مستقر بنسبة عالية',
      },
      matchedPhoneticUnitsCount: word.phoneticUnits.length,
      totalPhoneticUnitsCount: word.phoneticUnits.length,
      isCorrect: true,
      errorsDetected: [],
    }));

    return {
      matches,
      overallConfidence: 0.94,
      processingTimeMs: 145,
      silenceRegions: [],
    };
  }

  async detectVAD(audioChunk: ArrayBuffer): Promise<{ isSpeech: boolean; energyDb: number }> {
    const byteLength = audioChunk.byteLength;
    const isSpeech = byteLength > 256;
    return {
      isSpeech,
      energyDb: isSpeech ? -18.5 : -52.0,
    };
  }
}
