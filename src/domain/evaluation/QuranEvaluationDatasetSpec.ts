/**
 * @file QuranEvaluationDatasetSpec.ts
 * @module domain/evaluation
 * @description Formal Specification for Real Ground-Truth Quran Recitation Dataset.
 * Mandatory gate: No scientific accuracy claim is permitted on synthetic or single-speaker unannotated audio.
 */

import { RiwayahType } from '../quran/types.ts';

export type RecordingEnvironmentType =
  | 'STUDIO_CONDENSER'
  | 'MOBILE_BUILTIN'
  | 'HEADSET_DYNAMIC'
  | 'REVERBERANT_ROOM'
  | 'NOISY_BACKGROUND';

export type TajweedAnnotationType =
  | 'CORRECT'
  | 'OMISSION'
  | 'REPETITION'
  | 'SUBSTITUTION'
  | 'UNWARRANTED_PAUSE'
  | 'MADD_SHORTENED'
  | 'MADD_EXCESSIVE'
  | 'GHUNNAH_DROPPED'
  | 'QALQALAH_DROPPED'
  | 'HEAVY_LETTER_THINNED'
  | 'THIN_LETTER_HEAVIED';

export interface PhoneticAnnotationSpan {
  phonemeId: string;
  startMs: number;
  endMs: number;
  confidence: number;
  annotatorId: string;
}

export interface WordAnnotationSpan {
  wordIndex: number;
  wordText: string;
  startMs: number;
  endMs: number;
  tajweedLabel: TajweedAnnotationType;
  expectedTajweedRule?: string;
  observedTajweedBehavior?: string;
}

export interface QuranEvaluationRecordingRecord {
  recordingId: string;
  reciterId: string; // Anonymized reciter identifier e.g. "RECITER_042"
  gender: 'MALE' | 'FEMALE';
  skillLevel: 'MUTQIN_IJAZAH' | 'INTERMEDIATE_STUDENT' | 'BEGINNER_CHILD';
  riwayah: RiwayahType;
  surahNumber: number;
  ayahNumber: number;
  wordRange: [number, number];
  audioPath: string;
  audioSha256: string;
  samplingRateHz: 16000 | 44100 | 48000;
  durationMs: number;
  recordingEnvironment: RecordingEnvironmentType;
  microphoneModel?: string;
  snrDb?: number;
  annotationVersion: string;
  scholarlyReviewerId: string;
  annotatedWordSpans: WordAnnotationSpan[];
  annotatedPhonemeSpans?: PhoneticAnnotationSpan[];
  license: string;
  consentGranted: boolean;
  permittedUsage: 'ACADEMIC_EVALUATION_ONLY' | 'OPEN_BENCHMARK' | 'COMMERCIAL_TRAINING_PROHIBITED';
}

export class QuranEvaluationDatasetRegistry {
  private static readonly records: Map<string, QuranEvaluationRecordingRecord> = new Map();

  /**
   * Current status of real ground-truth dataset in repository.
   */
  public static getDatasetStatus(): {
    status: 'BLOCKED' | 'AVAILABLE';
    certifiedRecordingsCount: number;
    reasonArabic: string;
  } {
    const count = this.records.size;
    if (count === 0) {
      return {
        status: 'BLOCKED',
        certifiedRecordingsCount: 0,
        reasonArabic: 'قاعدة البيانات الصوتية الحقيقية غير متوفرة محلياً في المستودع (BLOCKED BY DATASET). يتطلب استيراد تسجيلات مرخصة وموسومة بشهادة مشايخ معتمدين.',
      };
    }
    return {
      status: 'AVAILABLE',
      certifiedRecordingsCount: count,
      reasonArabic: `متوفر ${count} تسجيل قرآني حقيقي موسوم وفق المعايير.`,
    };
  }

  public static registerRecording(record: QuranEvaluationRecordingRecord): void {
    this.records.set(record.recordingId, record);
  }

  public static getRecording(id: string): QuranEvaluationRecordingRecord | undefined {
    return this.records.get(id);
  }
}
