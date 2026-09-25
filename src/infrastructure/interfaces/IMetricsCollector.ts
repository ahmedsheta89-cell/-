/**
 * @file IMetricsCollector.ts
 * @module infrastructure/interfaces
 * @description Telemetry and observability contract for latencies, confidence distribution, and error rates.
 */

export interface IMetricsCollector {
  recordLatency(metricName: string, durationMs: number, tags?: Record<string, string>): void;
  incrementCounter(metricName: string, value?: number, tags?: Record<string, string>): void;
  recordGauge(metricName: string, value: number, tags?: Record<string, string>): void;
}
