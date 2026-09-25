/**
 * @file RecitationPipelineCoordinator.ts
 * @module application/recitation
 * @description Orchestrates the full 10-stage Recitation Alignment and Error Detection Pipeline.
 * Connects Audio Capture -> Quality -> VAD -> Alignment -> Phonetics -> Observation ->
 * Religious Classification -> Confidence Calibration -> Interruption Policy -> Teacher Engine.
 */

import { IAudioCaptureProvider, AudioChunk, AudioQualityAssessment } from '../../domain/recitation/audioCaptureTypes.ts';
import { IVoiceActivityDetector, VadSegment, VadStreamState } from '../../domain/recitation/vadTypes.ts';
import {
  AlignmentResult,
  IRecitationAligner,
  RecitationAlignmentContext,
} from '../../domain/recitation/alignmentTypes.ts';
import { IPhoneticAnalyzer } from '../../domain/recitation/phoneticTypes.ts';
import {
  IRecitationErrorDetector,
  IReligiousErrorClassifier,
  RecitationObservation,
  ReligiousErrorClassification,
} from '../../domain/recitation/observationTypes.ts';
import {
  DetailedConfidenceEvidence,
  IConfidenceCalibrationService,
} from '../../domain/recitation/calibrationTypes.ts';
import {
  InterruptionDecision,
  IRecitationInterruptionPolicy,
} from '../../domain/recitation/interruptionTypes.ts';
import { ITajweedRuleEngine } from '../tajweed/TajweedRuleEngine.ts';
import { AudioQualityAnalyzerImpl } from './AudioQualityAnalyzerImpl.ts';
import { VoiceActivityDetectorImpl } from './VoiceActivityDetectorImpl.ts';
import { RecitationForcedAlignerImpl } from './RecitationForcedAlignerImpl.ts';
import { PhoneticAnalyzerImpl } from './PhoneticAnalyzerImpl.ts';
import { RecitationErrorDetectorImpl } from './RecitationErrorDetectorImpl.ts';
import { ReligiousErrorClassifierImpl } from './ReligiousErrorClassifierImpl.ts';
import { ConfidenceCalibrationServiceImpl } from './ConfidenceCalibrationServiceImpl.ts';
import { RecitationInterruptionPolicyImpl } from './RecitationInterruptionPolicyImpl.ts';
import { AudioPrivacyManager } from './AudioPrivacyManager.ts';
import { RecitationMode } from '../../domain/recitation/types.ts';

export interface RecitationPipelineTelemetry {
  chunksProcessed: number;
  totalAudioDurationMs: number;
  lastQualityAssessment: AudioQualityAssessment | null;
  lastVadState: VadStreamState | null;
  lastAlignment: AlignmentResult | null;
  activeObservations: RecitationObservation[];
  classifications: ReligiousErrorClassification[];
  lastConfidenceEvidence: DetailedConfidenceEvidence | null;
  lastInterruptionDecision: InterruptionDecision | null;
  isProcessing: boolean;
  pipelineLatencyMs: number;
}

export class RecitationPipelineCoordinator {
  private captureProvider: IAudioCaptureProvider;
  private qualityAnalyzer: AudioQualityAnalyzerImpl;
  private vadDetector: IVoiceActivityDetector;
  private aligner: IRecitationAligner;
  private phoneticAnalyzer: IPhoneticAnalyzer;
  private errorDetector: IRecitationErrorDetector;
  private religiousClassifier: IReligiousErrorClassifier;
  private calibrationService: IConfidenceCalibrationService;
  private interruptionPolicy: IRecitationInterruptionPolicy;
  private tajweedEngine: ITajweedRuleEngine;
  private privacyManager: AudioPrivacyManager;

  private accumulatedChunks: AudioChunk[] = [];
  private activeContext: RecitationAlignmentContext | null = null;
  private mode: RecitationMode = RecitationMode.MEMORIZATION_RECITE;
  private consecutiveErrors = 0;
  private telemetryListeners: ((telemetry: RecitationPipelineTelemetry) => void)[] = [];

  private currentTelemetry: RecitationPipelineTelemetry = {
    chunksProcessed: 0,
    totalAudioDurationMs: 0,
    lastQualityAssessment: null,
    lastVadState: null,
    lastAlignment: null,
    activeObservations: [],
    classifications: [],
    lastConfidenceEvidence: null,
    lastInterruptionDecision: null,
    isProcessing: false,
    pipelineLatencyMs: 0,
  };

  constructor(
    captureProvider: IAudioCaptureProvider,
    tajweedEngine: ITajweedRuleEngine
  ) {
    this.captureProvider = captureProvider;
    this.tajweedEngine = tajweedEngine;
    this.qualityAnalyzer = new AudioQualityAnalyzerImpl();
    this.vadDetector = new VoiceActivityDetectorImpl();
    this.aligner = new RecitationForcedAlignerImpl();
    this.phoneticAnalyzer = new PhoneticAnalyzerImpl();
    this.errorDetector = new RecitationErrorDetectorImpl();
    this.religiousClassifier = new ReligiousErrorClassifierImpl();
    this.calibrationService = new ConfidenceCalibrationServiceImpl();
    this.interruptionPolicy = new RecitationInterruptionPolicyImpl();
    this.privacyManager = new AudioPrivacyManager();
  }

  setCaptureProvider(provider: IAudioCaptureProvider): void {
    this.captureProvider = provider;
  }

  getPrivacyManager(): AudioPrivacyManager {
    return this.privacyManager;
  }

  getAligner(): IRecitationAligner {
    return this.aligner;
  }

  getCalibrationService(): IConfidenceCalibrationService {
    return this.calibrationService;
  }

  registerTelemetryListener(listener: (telemetry: RecitationPipelineTelemetry) => void): () => void {
    this.telemetryListeners.push(listener);
    return () => {
      this.telemetryListeners = this.telemetryListeners.filter((l) => l !== listener);
    };
  }

  private notifyTelemetry(): void {
    this.telemetryListeners.forEach((l) => l({ ...this.currentTelemetry }));
  }

  async startSession(
    context: RecitationAlignmentContext,
    mode: RecitationMode = RecitationMode.MEMORIZATION_RECITE
  ): Promise<void> {
    this.activeContext = context;
    this.mode = mode;
    this.accumulatedChunks = [];
    this.consecutiveErrors = 0;
    this.vadDetector.reset();

    this.currentTelemetry = {
      chunksProcessed: 0,
      totalAudioDurationMs: 0,
      lastQualityAssessment: null,
      lastVadState: null,
      lastAlignment: null,
      activeObservations: [],
      classifications: [],
      lastConfidenceEvidence: null,
      lastInterruptionDecision: null,
      isProcessing: true,
      pipelineLatencyMs: 0,
    };
    this.notifyTelemetry();

    await this.captureProvider.start(async (chunk: AudioChunk) => {
      await this.processIncomingChunk(chunk);
    });
  }

  private async processIncomingChunk(chunk: AudioChunk): Promise<void> {
    const startT = performance.now();
    this.accumulatedChunks.push(chunk);
    this.privacyManager.registerBuffer(chunk.pcmData);

    const totalDurationMs = this.accumulatedChunks.reduce((acc, c) => acc + c.durationMs, 0);

    // 1. Audio Quality Assessment
    const quality = this.qualityAnalyzer.analyzeChunk(chunk);

    // 2. VAD Segmentation
    const vadSegments = this.vadDetector.processChunk(chunk);
    const vadState = this.vadDetector.getCurrentState();

    let alignment: AlignmentResult | null = null;
    let observations: RecitationObservation[] = [];
    let classifications: ReligiousErrorClassification[] = [];
    let confidenceEvidence: DetailedConfidenceEvidence | null = null;
    let interruptionDecision: InterruptionDecision | null = null;

    if (this.activeContext && quality.isUsableForAlignment) {
      // 3. Forced Alignment
      if (this.aligner.alignChunk) {
        alignment = await this.aligner.alignChunk(chunk, this.activeContext, this.accumulatedChunks);
      }

      if (alignment) {
        // 4. Observation Extraction
        observations = this.errorDetector.detectWordObservations([alignment]);

        // 5. Tajweed Rules Evaluation & Religious Classification
        for (const obs of observations) {
          const tajweedRules = this.tajweedEngine.analyzeText(obs.expectedText);
          const classification = this.religiousClassifier.classifyObservation(
            obs,
            tajweedRules
          );
          classifications.push(classification);
        }

        // 6. Confidence Calibration
        const hasLahnJali = classifications.some((c) => c.category === 'LAHN_JALI');
        confidenceEvidence = this.calibrationService.calibrateEvidence(
          quality,
          alignment,
          hasLahnJali
        );

        // 7. Interruption Policy Decision
        const primaryIssue =
          classifications.find((c) => c.category === 'LAHN_JALI') ||
          classifications.find((c) => c.category === 'LAHN_KHAFI');

        if (primaryIssue) {
          if (primaryIssue.category === 'LAHN_JALI') {
            this.consecutiveErrors++;
          }
          interruptionDecision = this.interruptionPolicy.evaluateInterruption(
            primaryIssue,
            confidenceEvidence.resolvedLevel,
            {
              mode: this.mode,
              consecutiveErrorCount: this.consecutiveErrors,
              ayahWordPosition: 1,
              isEndOfAyah: false,
              studentPreferenceAllowImmediateInterruption: false,
              totalInterruptionsInSession: 0,
            }
          );
        }
      }
    }

    const endT = performance.now();
    const latency = Math.round(endT - startT);

    this.currentTelemetry = {
      chunksProcessed: this.accumulatedChunks.length,
      totalAudioDurationMs: totalDurationMs,
      lastQualityAssessment: quality,
      lastVadState: vadState,
      lastAlignment: alignment,
      activeObservations: observations,
      classifications,
      lastConfidenceEvidence: confidenceEvidence,
      lastInterruptionDecision: interruptionDecision,
      isProcessing: true,
      pipelineLatencyMs: latency,
    };

    this.notifyTelemetry();
  }

  async stopSession(): Promise<AlignmentResult | null> {
    await this.captureProvider.stop();
    this.currentTelemetry.isProcessing = false;

    if (this.activeContext && this.accumulatedChunks.length > 0 && this.aligner.alignSession) {
      const finalAlignment = await this.aligner.alignSession(
        this.accumulatedChunks,
        this.activeContext
      );
      this.currentTelemetry.lastAlignment = finalAlignment;
      this.notifyTelemetry();
      return finalAlignment;
    }

    this.notifyTelemetry();
    return null;
  }

  async cancelAndPurge(): Promise<void> {
    await this.captureProvider.cancel();
    this.accumulatedChunks = [];
    this.privacyManager.purgeAllAudioMemory();
    this.vadDetector.reset();
    this.currentTelemetry.isProcessing = false;
    this.notifyTelemetry();
  }
}
