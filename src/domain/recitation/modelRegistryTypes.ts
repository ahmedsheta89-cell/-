/**
 * @file modelRegistryTypes.ts
 * @module domain/recitation
 * @description Catalog and governance contracts for acoustic and forced-alignment models.
 * Enforces transparency: Any model not thoroughly benchmarked on Quranic Arabic is strictly tagged EXPERIMENTAL.
 */

import { RiwayahType } from '../quran/types.ts';

export enum ModelBenchmarkStatus {
  NOT_BENCHMARKED = 'NOT_BENCHMARKED',
  BENCHMARK_IN_PROGRESS = 'BENCHMARK_IN_PROGRESS',
  BENCHMARKED_CERTIFIED = 'BENCHMARKED_CERTIFIED',
  DEPRECATED = 'DEPRECATED',
}

export enum ModelDeploymentMode {
  ON_DEVICE_WASM = 'ON_DEVICE_WASM',
  ON_DEVICE_WEB_WORKER = 'ON_DEVICE_WEB_WORKER',
  HYBRID = 'HYBRID',
  SERVER_CONTAINER = 'SERVER_CONTAINER',
  MOCK_SIMULATOR = 'MOCK_SIMULATOR',
}

export interface AudioModelEntry {
  modelId: string;
  nameArabic: string;
  provider: string;
  version: string;
  license: string;
  task: 'VAD' | 'FORCED_ALIGNMENT' | 'PHONETIC_RECOGNITION' | 'ACOUSTIC_MAKHRAJ' | 'CTC_ACOUSTIC_ENCODER';
  inputFormat: string; // e.g. 'PCM_FLOAT32_16KHZ_MONO'
  inputSamplingRateHz: number;
  supportedRiwayat: RiwayahType[];
  phonemeSupport: boolean;
  arabicSupport: 'NATIVE_QURAN' | 'STANDARD_ARABIC' | 'MULTILINGUAL' | 'NONE';
  offlineSupport: boolean;
  browserSupport: boolean;
  wasmSupport: boolean;
  streamingSupported: boolean;
  benchmarkStatus: ModelBenchmarkStatus;
  validationStatus: 'VALIDATED_EXPERT' | 'EXPERIMENTAL_UNVALIDATED' | 'SYNTHETIC_ONLY' | 'NOT_VALIDATED';
  deploymentMode: ModelDeploymentMode;
  averageInferenceLatencyMs: number;
  realTimeFactor: number; // e.g. 0.15 (15% of real time)
  isCertifiedForFiqhDecisions: boolean; // Must be false unless certified by scientific committee
  notesArabic: string;
}

export interface IAudioModelRegistry {
  getAllModels(): AudioModelEntry[];
  getModel(modelId: string): AudioModelEntry | undefined;
  getActiveAlignmentModel(): AudioModelEntry;
  getActiveVadModel(): AudioModelEntry;
}
