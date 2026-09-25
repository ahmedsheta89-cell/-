/**
 * @file RecitationAudioPipelineCoordinator.ts
 * @module application/recitation
 * @description Master Coordinator executing the end-to-end Recitation Audio Pipeline:
 * Audio Capture -> Validation & Quality -> VAD -> Forced Alignment -> Acoustic Observation ->
 * Religious Classification -> Confidence Calibration -> Interruption Policy -> Teacher Session Engine.
 */

import {
  IAudioCaptureProvider,
  AudioChunk,
  AudioQualityAssessment,
  AudioQualityStatus,
  IAudioQualityAnalyzer,
} from '../../domain/recitation/audioCaptureTypes.ts';
import {
  IVoiceActivityDetector,
  VadActivityState,
  VadSegment,
} from '../../domain/recitation/vadTypes.ts';
import {
  IRecitationAligner,
  RecitationSessionContext,
  AlignmentResult,
  AyahAlignmentSummary,
  AlignmentStatus,
} from '../../domain/recitation/alignmentTypes.ts';
import {
  IRecitationErrorDetector,
  IReligiousErrorClassifier,
  RecitationObservation,
  ReligiousErrorClassification,
  AcousticObservationType,
  ReligiousClassificationCategory,
} from '../../domain/recitation/observationTypes.ts';
import {
  IConfidenceCalibrationService,
  DetailedConfidenceEvidence,
} from '../../domain/recitation/calibrationTypes.ts';
import {
  IRecitationInterruptionPolicy,
  InterruptionDecision,
  InterruptionContext,
} from '../../domain/recitation/interruptionTypes.ts';
import { ITeacherSessionEngine } from '../../domain/teacher/types.ts';
import { PerformanceTelemetry } from './PerformanceTelemetry.ts';

export interface PipelineStageEvent {
  stage: string;
  timestamp: string;
  data: any;
}

export interface PipelineRecitationFinding {
  wordId: string;
  expectedText: string;
  alignment: AlignmentResult;
  observation: RecitationObservation;
  classification: ReligiousErrorClassification;
  confidence: DetailedConfidenceEvidence;
  interruption: InterruptionDecision;
}

export class RecitationAudioPipelineCoordinator {
  private chunks: AudioChunk[] = [];
  private accumulatedVadSegments: VadSegment[] = [];
  private latestQuality: AudioQualityAssessment | null = null;
  private isProcessing = false;
  private listeners: ((event: PipelineStageEvent) => void)[] = [];
  private findingsListeners: ((finding: PipelineRecitationFinding) => void)[] = [];

  constructor(
    private readonly captureProvider: IAudioCaptureProvider,
    private readonly qualityAnalyzer: IAudioQualityAnalyzer,
    private readonly vadDetector: IVoiceActivityDetector,
    private readonly forcedAligner: IRecitationAligner,
    private readonly errorDetector: IRecitationErrorDetector,
    private readonly religiousClassifier: IReligiousErrorClassifier,
    private readonly calibrationService: IConfidenceCalibrationService,
    private readonly interruptionPolicy: IRecitationInterruptionPolicy,
    private readonly teacherEngine: ITeacherSessionEngine,
    private readonly telemetry: PerformanceTelemetry
  ) {}

  subscribeEvents(listener: (event: PipelineStageEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  subscribeFindings(listener: (finding: PipelineRecitationFinding) => void): () => void {
    this.findingsListeners.push(listener);
    return () => {
      this.findingsListeners = this.findingsListeners.filter((l) => l !== listener);
    };
  }

  private emit(stage: string, data: any): void {
    const event: PipelineStageEvent = {
      stage,
      timestamp: new Date().toISOString(),
      data,
    };
    this.listeners.forEach((l) => l(event));
  }

  async startRecitation(context: RecitationSessionContext): Promise<void> {
    this.chunks = [];
    this.accumulatedVadSegments = [];
    this.vadDetector.reset();
    this.telemetry.reset();

    const tStart = performance.now();
    this.emit('PIPELINE_START', { context });

    await this.captureProvider.start(async (chunk) => {
      await this.handleAudioChunk(chunk, context);
    });

    this.telemetry.recordMicStartup(performance.now() - tStart);
  }

  async stopRecitation(): Promise<void> {
    await this.captureProvider.stop();
    this.emit('PIPELINE_STOP', { totalChunks: this.chunks.length });
  }

  async pauseRecitation(): Promise<void> {
    await this.captureProvider.pause();
    this.emit('PIPELINE_PAUSE', {});
  }

  async resumeRecitation(): Promise<void> {
    await this.captureProvider.resume();
    this.emit('PIPELINE_RESUME', {});
  }

  private async handleAudioChunk(
    chunk: AudioChunk,
    context: RecitationSessionContext
  ): Promise<void> {
    const chunkProcessingStart = performance.now();
    this.chunks.push(chunk);

    // 1. Audio Quality Analysis
    const quality = this.qualityAnalyzer.analyzeChunk(chunk);
    this.latestQuality = quality;
    this.emit('AUDIO_QUALITY', quality);

    // If audio is completely UNUSABLE, halt alignment and notify user safely
    if (quality.status === AudioQualityStatus.UNUSABLE) {
      this.emit('AUDIO_QUALITY_REJECTED', {
        reason: quality.recommendationArabic,
        issues: quality.issues,
      });
      this.telemetry.incrementDroppedFrames();
      return;
    }

    // 2. Voice Activity Detection (VAD)
    const vadStart = performance.now();
    const vadSeg = this.vadDetector.processChunk(
      chunk.pcmData,
      chunk.timestampMs,
      chunk.sampleRateHz
    );
    this.accumulatedVadSegments.push(vadSeg);
    this.telemetry.recordVadLatency(performance.now() - vadStart);
    this.emit('VAD_SEGMENT', vadSeg);

    // Run alignment periodically or on speech boundary
    if (this.chunks.length % 3 === 0 || vadSeg.state === VadActivityState.PAUSE) {
      await this.runAlignmentPass(context);
    }

    const chunkProcessingTime = performance.now() - chunkProcessingStart;
    this.telemetry.recordChunk(chunk.durationMs, chunkProcessingTime);
  }

  async runAlignmentPass(context: RecitationSessionContext): Promise<PipelineRecitationFinding[]> {
    if (this.isProcessing) return [];
    this.isProcessing = true;
    const findings: PipelineRecitationFinding[] = [];

    try {
      const alignStart = performance.now();

      // 3. Recitation Forced Alignment (Words & Phonetics)
      const alignments = this.forcedAligner?.alignAudioToWords
        ? await this.forcedAligner.alignAudioToWords(
            this.chunks,
            this.accumulatedVadSegments,
            context
          )
        : [];
      this.telemetry.recordAlignmentLatency(performance.now() - alignStart);
      this.emit('FORCED_ALIGNMENT', alignments);

      // 4. Acoustic Error Detection (Lexical Observation Layer)
      const observations = this.errorDetector.detectWordObservations(alignments);
      this.emit('RECITATION_OBSERVATIONS', observations);

      // 5. Religious Error Classification & Pedagogical Decision
      for (const obs of observations) {
        const classification = this.religiousClassifier.classifyObservation(
          obs,
          context.expectedTajweedMatches || []
        );

        // 6. Confidence Calibration
        const confidenceEvidence = this.calibrationService.calibrateEvidence(
          this.latestQuality || this.qualityAnalyzer.analyzeChunk(this.chunks[this.chunks.length - 1]),
          obs.alignment,
          classification.category === ReligiousClassificationCategory.LAHN_JALI
        );

        // 7. Interruption Policy Evaluation
        const interruptionContext: InterruptionContext = {
          mode: (context as any).mode || ('MEMORIZATION_RECITE' as any),
          consecutiveErrorCount: 0,
          ayahWordPosition: 1,
          isEndOfAyah: false,
          studentPreferenceAllowImmediateInterruption: true,
          totalInterruptionsInSession: 0,
        };

        const interruption = this.interruptionPolicy.evaluateInterruption(
          classification,
          confidenceEvidence.resolvedLevel,
          interruptionContext
        );

        const finding: PipelineRecitationFinding = {
          wordId: obs.wordId,
          expectedText: obs.expectedText,
          alignment: obs.alignment,
          observation: obs,
          classification,
          confidence: confidenceEvidence,
          interruption,
        };

        findings.push(finding);
        this.findingsListeners.forEach((l) => l(finding));

        // Dispatch finding and decision to TeacherSessionEngine
        if (this.teacherEngine) {
          await this.teacherEngine.dispatch({
            type: 'RECITATION_FINDING_TRIGGERED',
            finding,
            decision: interruption,
          });
        }

        if (interruption.shouldInterruptAudioNow) {
          this.emit('INTERRUPTION_TRIGGERED', { finding });
        }
      }
    } finally {
      this.isProcessing = false;
    }

    return findings;
  }

  getLatestQuality(): AudioQualityAssessment | null {
    return this.latestQuality;
  }

  getTelemetry(): PerformanceTelemetry {
    return this.telemetry;
  }
}
