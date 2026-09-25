/**
 * @file interruptionTypes.ts
 * @module domain/recitation
 * @description Pedagogical interruption policy contracts to prevent cognitive overload.
 */

import { ReligiousErrorClassification } from './observationTypes.ts';
import { ConfidenceLevel } from '../confidence/types.ts';
import { RecitationMode } from './types.ts';

export interface InterruptionContext {
  mode: RecitationMode;
  consecutiveErrorCount: number;
  ayahWordPosition: number;
  isEndOfAyah: boolean;
  studentPreferenceAllowImmediateInterruption: boolean;
  totalInterruptionsInSession: number;
}

export interface InterruptionDecision {
  shouldInterruptAudioNow: boolean;
  deferredToAyahEnd: boolean;
  reasonArabic: string;
  recommendedPedagogicalPromptArabic?: string;
}

export interface IRecitationInterruptionPolicy {
  evaluateInterruption(
    classification: ReligiousErrorClassification,
    confidence: ConfidenceLevel,
    context: InterruptionContext
  ): InterruptionDecision;
}
