/**
 * @file acousticProcessor.worker.ts
 * @module infrastructure/workers
 * @description Dedicated Web Worker for audio feature extraction (Mel-Spectrogram DSP).
 * Ensures mathematical DSP loops do not block the UI main thread.
 */

import { MelSpectrogramExtractor } from '../../application/recitation/acoustic/MelSpectrogramExtractor.ts';
import { AcousticWorkerRequest, AcousticWorkerResponse } from './acousticWorkerProtocol.ts';

const melExtractor = new MelSpectrogramExtractor({
  sampleRate: 16000,
  numMelBands: 80,
  fftSize: 512,
  hopSize: 160,
});

self.onmessage = (event: MessageEvent<AcousticWorkerRequest>) => {
  const request = event.data;
  const start = performance.now();

  switch (request.type) {
    case 'EXTRACT_MEL': {
      const pcm = request.payload?.audioPcm;
      if (!pcm || pcm.length === 0) {
        const resp: AcousticWorkerResponse = {
          taskId: request.taskId,
          type: 'EXTRACT_MEL',
          success: false,
          error: 'EMPTY_AUDIO_BUFFER',
        };
        self.postMessage(resp);
        return;
      }

      try {
        const frames = melExtractor.extract(pcm);
        const processingMs = performance.now() - start;
        const resp: AcousticWorkerResponse = {
          taskId: request.taskId,
          type: 'EXTRACT_MEL',
          success: true,
          payload: {
            melFrames: frames,
            metrics: { processingMs },
          },
        };
        self.postMessage(resp);
      } catch (err: any) {
        self.postMessage({
          taskId: request.taskId,
          type: 'EXTRACT_MEL',
          success: false,
          error: err?.message || 'MEL_EXTRACTION_FAILED',
        });
      }
      break;
    }

    case 'INIT_MODEL': {
      // Model procurement gate: Reports blocked since no ONNX model is bundled
      self.postMessage({
        taskId: request.taskId,
        type: 'INIT_MODEL',
        success: false,
        error: 'MODEL_BLOCKED: No ONNX model artifact packaged in repository.',
        payload: {
          modelLoaded: false,
          executionProvider: 'NONE',
        },
      });
      break;
    }

    case 'TERMINATE': {
      self.close();
      break;
    }

    default:
      self.postMessage({
        taskId: request.taskId,
        type: request.type,
        success: false,
        error: `UNKNOWN_WORKER_COMMAND: ${request.type}`,
      });
  }
};
