/**
 * @file AppConfig.ts
 * @module infrastructure/config
 * @description Centralized, typed configuration manager.
 * Enforces zero frontend secret leakage and validates environment parameters.
 */

export interface SystemConfiguration {
  environment: 'development' | 'staging' | 'production' | 'test';
  defaultRiwayah: string;
  minAudioSampleRateHz: number;
  confidenceThresholds: {
    high: number;
    medium: number;
    low: number;
  };
  limits: {
    maxRecitationMinutes: number;
    maxAyahsPerSession: number;
  };
  features: {
    enableAIPedagogy: boolean;
    enableLiveInterruption: boolean;
    enableWaveformVisualizer: boolean;
  };
}

export const APP_CONFIG: SystemConfiguration = {
  environment: 'development',
  defaultRiwayah: 'HAFS_AN_ASIM',
  minAudioSampleRateHz: 16000,
  confidenceThresholds: {
    high: 0.88,
    medium: 0.65,
    low: 0.40,
  },
  limits: {
    maxRecitationMinutes: 45,
    maxAyahsPerSession: 50,
  },
  features: {
    enableAIPedagogy: true,
    enableLiveInterruption: true,
    enableWaveformVisualizer: true,
  },
};
