/**
 * @file types.ts
 * @module domain/recitation
 * @description Domain contracts for Recitation Sessions, real-time tracking,
 * audio segment analysis, and assessment records.
 */

import { RiwayahType, QuranWord, QuranAyah } from '../quran/types.ts';
import { RecitationErrorDetail } from '../errors/types.ts';
import { ConfidenceAssessment, ConfidenceLevel } from '../confidence/types.ts';

export enum RecitationSessionStatus {
  INITIALIZING = 'INITIALIZING',
  ACTIVE_LISTENING = 'ACTIVE_LISTENING',
  PAUSED = 'PAUSED',
  INTERRUPTED_FOR_CORRECTION = 'INTERRUPTED_FOR_CORRECTION',
  WAITING_FOR_REPETITION = 'WAITING_FOR_REPETITION',
  CONFIRMING_REPETITION = 'CONFIRMING_REPETITION',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum RecitationMode {
  MEMORIZATION_RECITE = 'MEMORIZATION_RECITE', // تسميع غيبًا
  REVISION_RECITE = 'REVISION_RECITE',         // مراجعة محفوظ سابق
  CORRECTION_PRACTICE = 'CORRECTION_PRACTICE', // تلاوة مع مصحف لتصحيح النطق والتجويد
  FREE_RECITE = 'FREE_RECITE',                 // تلاوة حرة وممارسة
}

export interface AudioSegment {
  id: string;
  sessionId: string;
  startTimeMs: number;
  endTimeMs: number;
  durationMs: number;
  sampleRateHz: number;
  channels: number;
  audioBlobUri?: string;           // Abstract URI in StorageProvider
  snrEstimateDb: number;
  silenceDetected: boolean;
}

export interface DetectedWordMatch {
  wordId: string;                  // QuranWord ID (e.g. "1:1:2")
  expectedTextUthmani: string;
  detectedTextHypothesis: string;
  startTimeMs: number;
  endTimeMs: number;
  confidence: ConfidenceAssessment;
  matchedPhoneticUnitsCount: number;
  totalPhoneticUnitsCount: number;
  isCorrect: boolean;
  errorsDetected: RecitationErrorDetail[];
}

export interface RecitationCorrectionEvent {
  id: string;
  timestampMs: number;
  targetWordId: string;
  errorDetail: RecitationErrorDetail;
  confidence: ConfidenceAssessment;
  teacherSpokenExplanationArabic: string;
  visualPromptType: 'HIGHLIGHT_WORD' | 'SHOW_MAKHRAJ_DIAGRAM' | 'SHOW_TAJWEED_CARD';
  repetitionAttemptNumber: number;
  isResolved: boolean;
}

export interface RecitationRepetitionRecord {
  id: string;
  correctionEventId: string;
  targetWordId: string;
  startTimeMs: number;
  endTimeMs: number;
  detectedMatch: DetectedWordMatch;
  isAccepted: boolean;
  scholarReviewRequired: boolean;
}

export interface RecitationFinalAssessment {
  id: string;
  sessionId: string;
  overallScorePercentage: number;  // 0 - 100
  accuracyScore: number;           // Hifz / word accuracy
  tajweedScore: number;            // Tajweed compliance score
  totalWordsRecited: number;
  totalErrorsDetected: number;
  lahnJaliCount: number;
  lahnKhafiCount: number;
  overallConfidence: ConfidenceLevel;
  teacherRemarksArabic: string;
  recommendedFocusAreas: string[];
  passed: boolean;
  completedAt: string;
}

export interface RecitationSession {
  id: string;
  studentId: string;
  selectedRiwayah: RiwayahType;
  mode: RecitationMode;
  status: RecitationSessionStatus;
  
  // Scope of recitation
  surahNumber: number;
  fromAyah: number;
  toAyah: number;
  expectedAyahs: QuranAyah[];
  expectedWords: QuranWord[];

  // Session state tracking
  currentAyahIndex: number;
  currentWordIndex: number;
  
  // Accumulated data
  audioSegments: AudioSegment[];
  detectedWords: DetectedWordMatch[];
  detectedErrors: RecitationErrorDetail[];
  corrections: RecitationCorrectionEvent[];
  repetitions: RecitationRepetitionRecord[];
  
  // Timestamps & metrics
  startedAt: string;
  lastActiveAt: string;
  endedAt?: string;
  totalRecitationTimeSeconds: number;
  
  finalAssessment?: RecitationFinalAssessment;
}
