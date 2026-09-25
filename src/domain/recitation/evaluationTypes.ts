/**
 * @file evaluationTypes.ts
 * @module domain/recitation
 * @description Benchmark metrics, evaluation dataset schema, and performance telemetry contracts.
 */

import { RiwayahType } from '../quran/types.ts';
import { AcousticObservationType, ReligiousClassificationCategory } from './observationTypes.ts';

export interface EvaluationGroundTruthSample {
  sampleId: string;
  surahNumber: number;
  ayahNumber: number;
  riwayah: RiwayahType;
  expectedTextUthmani: string;
  audioDurationMs: number;
  expertAnnotation: {
    annotatorScholar: string;
    actualWordErrors: {
      wordIndex: number;
      type: AcousticObservationType;
      religiousCategory: ReligiousClassificationCategory;
    }[];
    expectedWordBoundariesMs: { wordIndex: number; startMs: number; endMs: number }[];
  };
  consentHash: string;
}

export interface RecitationEvaluationDataset {
  datasetId: string;
  nameArabic: string;
  version: string;
  totalSamples: number;
  totalDurationMinutes: number;
  riwayatCovered: RiwayahType[];
  samples: EvaluationGroundTruthSample[];
  benchmarkStatus: 'NOT_BENCHMARKED' | 'PARTIALLY_EVALUATED' | 'OFFICIALLY_BENCHMARKED';
}

export interface BenchmarkMetricsReport {
  modelId: string;
  datasetId: string;
  evaluatedAt: string;
  status: 'NOT_BENCHMARKED' | 'COMPLETED';
  wordErrorRatePercentage?: number; // Word Error Rate
  alignmentErrorRatePercentage?: number; // Alignment Error Rate (AER)
  wordBoundaryMeanErrorMs?: number; // Mean Boundary Error in milliseconds
  falsePositiveRatePercentage?: number; // Flagging correct recitation as error (CRITICAL to keep low)
  falseNegativeRatePercentage?: number; // Missing an actual error
  interruptionPrecisionPercentage?: number;
  interruptionRecallPercentage?: number;
  realTimeFactor?: number;
  averageLatencyMs?: number;
  disclaimerArabic: string;
}
