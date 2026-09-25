/**
 * @file PerformanceTelemetry.ts
 * @module application/recitation
 * @description Performance and latency telemetry logger for the audio pipeline.
 * Measures microphone startup latency, chunk processing latency, VAD latency,
 * alignment latency, end-to-feedback latency, and real-time factor (RTF).
 */

export interface LatencyRecord {
  stage: string;
  durationMs: number;
  timestamp: string;
}

export interface RecitationPipelineTelemetry {
  totalChunksProcessed: number;
  totalAudioDurationMs: number;
  totalProcessingTimeMs: number;
  microphoneStartupLatencyMs: number;
  averageChunkProcessingLatencyMs: number;
  vadAverageLatencyMs: number;
  alignmentAverageLatencyMs: number;
  endToFeedbackLatencyMs: number;
  realTimeFactor: number; // processingTime / audioDuration
  droppedFramesCount: number;
  recentLatencies: LatencyRecord[];
}

export class PerformanceTelemetry {
  private startTime = 0;
  private micStartupTime = 0;
  private totalAudioMs = 0;
  private totalProcessingMs = 0;
  private chunksCount = 0;
  private vadTimes: number[] = [];
  private alignmentTimes: number[] = [];
  private feedbackTimes: number[] = [];
  private records: LatencyRecord[] = [];
  private droppedFrames = 0;

  recordMicStartup(durationMs: number): void {
    this.micStartupTime = durationMs;
    this.addRecord('MIC_STARTUP', durationMs);
  }

  recordChunk(audioDurationMs: number, processingTimeMs: number): void {
    this.totalAudioMs += audioDurationMs;
    this.totalProcessingMs += processingTimeMs;
    this.chunksCount++;
  }

  recordVadLatency(ms: number): void {
    this.vadTimes.push(ms);
    this.addRecord('VAD', ms);
  }

  recordAlignmentLatency(ms: number): void {
    this.alignmentTimes.push(ms);
    this.addRecord('ALIGNMENT', ms);
  }

  recordEndToFeedbackLatency(ms: number): void {
    this.feedbackTimes.push(ms);
    this.addRecord('END_TO_FEEDBACK', ms);
  }

  incrementDroppedFrames(): void {
    this.droppedFrames++;
  }

  private addRecord(stage: string, durationMs: number): void {
    this.records.push({
      stage,
      durationMs: Math.round(durationMs * 10) / 10,
      timestamp: new Date().toISOString(),
    });
    if (this.records.length > 50) {
      this.records.shift();
    }
  }

  getSnapshot(): RecitationPipelineTelemetry {
    const avgVad =
      this.vadTimes.length > 0
        ? this.vadTimes.reduce((a, b) => a + b, 0) / this.vadTimes.length
        : 0;
    const avgAlign =
      this.alignmentTimes.length > 0
        ? this.alignmentTimes.reduce((a, b) => a + b, 0) / this.alignmentTimes.length
        : 0;
    const avgFeedback =
      this.feedbackTimes.length > 0
        ? this.feedbackTimes.reduce((a, b) => a + b, 0) / this.feedbackTimes.length
        : 0;
    const rtf = this.totalAudioMs > 0 ? this.totalProcessingMs / this.totalAudioMs : 0;

    return {
      totalChunksProcessed: this.chunksCount,
      totalAudioDurationMs: this.totalAudioMs,
      totalProcessingTimeMs: Math.round(this.totalProcessingMs * 10) / 10,
      microphoneStartupLatencyMs: Math.round(this.micStartupTime * 10) / 10,
      averageChunkProcessingLatencyMs:
        this.chunksCount > 0
          ? Math.round((this.totalProcessingMs / this.chunksCount) * 10) / 10
          : 0,
      vadAverageLatencyMs: Math.round(avgVad * 10) / 10,
      alignmentAverageLatencyMs: Math.round(avgAlign * 10) / 10,
      endToFeedbackLatencyMs: Math.round(avgFeedback * 10) / 10,
      realTimeFactor: Math.round(rtf * 1000) / 1000,
      droppedFramesCount: this.droppedFrames,
      recentLatencies: [...this.records],
    };
  }

  reset(): void {
    this.startTime = Date.now();
    this.micStartupTime = 0;
    this.totalAudioMs = 0;
    this.totalProcessingMs = 0;
    this.chunksCount = 0;
    this.vadTimes = [];
    this.alignmentTimes = [];
    this.feedbackTimes = [];
    this.records = [];
    this.droppedFrames = 0;
  }
}
