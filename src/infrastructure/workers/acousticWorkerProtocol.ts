/**
 * @file acousticWorkerProtocol.ts
 * @module infrastructure/workers
 * @description Protocol and contracts for off-main-thread acoustic feature extraction and model inference.
 * Keeps UI at 60 FPS by running audio DSP and ONNX sessions in dedicated Web Workers.
 */

export type AcousticWorkerMessageType =
  | 'INIT_MODEL'
  | 'EXTRACT_MEL'
  | 'RUN_INFERENCE'
  | 'CANCEL_TASK'
  | 'TERMINATE';

export interface AcousticWorkerRequest {
  type: AcousticWorkerMessageType;
  taskId: string;
  payload?: {
    audioPcm?: Float32Array;
    melFrames?: Float32Array[];
    modelPath?: string;
  };
}

export interface AcousticWorkerResponse {
  taskId: string;
  type: AcousticWorkerMessageType;
  success: boolean;
  error?: string;
  payload?: {
    melFrames?: Float32Array[];
    executionProvider?: string;
    modelLoaded?: boolean;
    metrics?: {
      processingMs: number;
    };
  };
}
