/**
 * @file alignmentTypes.ts
 * @module domain/recitation
 * @description Domain contracts for Quranic recitation alignment, forced alignment abstractions,
 * time-boundary models, and alignment status representations.
 */

import { QuranAyah, QuranWord, RiwayahType } from '../quran/types.ts';
import { ConfidenceAssessment } from '../confidence/types.ts';
import { AudioChunk } from './audioCaptureTypes.ts';

export enum AlignmentStatus {
  ALIGNED = 'ALIGNED',
  PARTIALLY_ALIGNED = 'PARTIALLY_ALIGNED',
  MISALIGNED = 'MISALIGNED',
  UNCERTAIN = 'UNCERTAIN',
  UNOBSERVABLE = 'UNOBSERVABLE',
}

export enum RecitationContextMode {
  FULL_SURAH = 'FULL_SURAH',
  TARGETED_AYAH_RANGE = 'TARGETED_AYAH_RANGE',
  OPEN_RECITE = 'OPEN_RECITE',
  CORRECTION_DRILL = 'CORRECTION_DRILL',
}

export interface PhoneticUnitAlignment {
  phoneticUnitId: string;
  symbol: string;
  expectedStartMs: number;
  expectedEndMs: number;
  observedStartMs?: number;
  observedEndMs?: number;
  acousticLikelihood: number;
  status: AlignmentStatus;
}

export interface WordAlignmentResult {
  wordId: string;
  surahNumber: number;
  ayahNumber: number;
  wordIndexInAyah: number;
  expectedTextUthmani: string;
  expectedTextAlignment: string;
  observedTextHypothesis?: string;
  expectedStartMs: number;
  expectedEndMs: number;
  observedStartMs?: number;
  observedEndMs?: number;
  alignmentScore: number; // 0.0 to 1.0 normalized score
  confidence: ConfidenceAssessment;
  status: AlignmentStatus;
  phoneticAlignments: PhoneticUnitAlignment[];
  detailsArabic?: string;
}

export interface AyahAlignmentResult {
  surahNumber: number;
  ayahNumber: number;
  expectedAyah: QuranAyah;
  wordsAlignment: WordAlignmentResult[];
  overallAlignmentScore: number;
  status: AlignmentStatus;
  startTimeMs: number;
  endTimeMs: number;
}

export interface AlignmentResult {
  sessionId: string;
  surahNumber?: number;
  fromAyah?: number;
  toAyah?: number;
  riwayah?: RiwayahType;
  ayahs?: AyahAlignmentResult[];
  currentWordUnderRecitation?: WordAlignmentResult;
  overallScore?: number;
  overallStatus?: AlignmentStatus;
  isRealTimePartial?: boolean;
  computedAtMs?: number;

  // Single word / unit alignment support
  ayahId?: string;
  wordId?: string;
  phoneticUnitId?: string;
  expectedTextUthmani?: string;
  expectedTextClean?: string;
  expectedStartMs?: number;
  expectedEndMs?: number;
  observedStartMs?: number;
  observedEndMs?: number;
  alignmentScore?: number;
  confidence?: any;
  status?: AlignmentStatus;
  evidence?: {
    acousticLikelihood: number;
    phoneticDistance: number;
    temporalDurationRatio: number;
    snrPenalty: number;
    notesArabic: string;
  };
  analyzedAt?: string;
}

export interface RecitationAlignmentContext {
  sessionId: string;
  riwayah: RiwayahType;
  surahNumber: number;
  fromAyah: number;
  toAyah: number;
  expectedAyahs: QuranAyah[];
  expectedWords: QuranWord[];
  isOpenRecitation: boolean;
}

export interface RecitationSessionContext {
  riwayah: RiwayahType;
  surahNumber: number;
  ayahStart: number;
  ayahEnd: number;
  mode: RecitationContextMode;
  expectedAyahs: QuranAyah[];
  expectedWords: QuranWord[];
  expectedTajweedMatches?: any[];
  datasetVersion?: string;
  sessionId?: string;
}

export interface AyahAlignmentSummary {
  ayahNumber: number;
  totalWords: number;
  alignedWordsCount: number;
  misalignedWordsCount: number;
  uncertainWordsCount: number;
  averageAlignmentScore: number;
  overallStatus: AlignmentStatus;
  wordAlignments: any[];
}

/**
 * Pluggable abstraction for Recitation Alignment.
 * Decouples domain from specific aligner implementations (Classical HMM, CTC/Neural forced aligners, or Custom Quran Acoustic Models).
 */
export interface IRecitationAligner {
  getAlignerName?(): string;
  getAlignerVersion?(): string;
  isRealTimeCapable?(): boolean;

  /**
   * Aligns streaming audio chunk with expected Quranic words in session
   */
  alignChunk?(
    chunk: AudioChunk,
    context: RecitationAlignmentContext,
    accumulatedChunks: AudioChunk[]
  ): Promise<AlignmentResult>;

  /**
   * Full session forced alignment (post-processing mode)
   */
  alignSession?(
    audioChunks: AudioChunk[],
    context: RecitationAlignmentContext
  ): Promise<AlignmentResult>;

  /**
   * Aligns audio specifically to an expected Ayah
   */
  alignAudioToAyah?(
    audioChunks: AudioChunk[],
    vadSegmentsOrExpectedAyah: any,
    context?: any,
    targetAyahNumber?: number
  ): Promise<any>;

  /**
   * Aligns audio specifically to an array of expected Quranic words
   */
  alignAudioToWords?(
    audioChunks: AudioChunk[],
    expectedWordsOrVad: any,
    context: any
  ): Promise<any>;

  /**
   * Aligns recognized word duration to expected phonetic units
   */
  alignWordsToPhoneticUnits?(
    wordAlignment: any,
    audioChunksOrContext: any
  ): Promise<any>;
}
