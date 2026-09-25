/**
 * @file RealTimeLatencyProfiler.ts
 * @module domain/realtime_teacher
 * @description Comprehensive latency tracking and profiling across all pipeline stages (Sections 17, 42).
 */

import { RealTimeLatencyMetrics } from './types.ts';

export interface LatencyStageSummary {
  readonly count: number;
  readonly min: number;
  readonly median: number;
  readonly p95: number;
  readonly max: number;
}

export class RealTimeLatencyProfiler {
  private history: RealTimeLatencyMetrics[] = [];

  public recordMetrics(metrics: RealTimeLatencyMetrics): void {
    this.history.push({ ...metrics });
    if (this.history.length > 500) {
      this.history.shift(); // keep sliding window
    }
  }

  public getSummary(): Record<keyof RealTimeLatencyMetrics, LatencyStageSummary> {
    const keys: (keyof RealTimeLatencyMetrics)[] = [
      'captureMs',
      'vadMs',
      'fbankMs',
      'zipformerMs',
      'alignmentMs',
      'evidenceMs',
      'decision5cMs',
      'policy7aMs',
      'language7bMs',
      'ttsMs',
      'totalFeedbackMs',
    ];

    const result = {} as Record<keyof RealTimeLatencyMetrics, LatencyStageSummary>;

    for (const key of keys) {
      const values = this.history.map((h) => h[key]).sort((a, b) => a - b);
      if (values.length === 0) {
        result[key] = { count: 0, min: 0, median: 0, p95: 0, max: 0 };
        continue;
      }

      const count = values.length;
      const min = values[0];
      const max = values[count - 1];
      const median = values[Math.floor(count * 0.5)];
      const p95 = values[Math.floor(count * 0.95)];

      result[key] = { count, min, median, p95, max };
    }

    return result;
  }

  public getHistoryCount(): number {
    return this.history.length;
  }

  public clear(): void {
    this.history = [];
  }
}
