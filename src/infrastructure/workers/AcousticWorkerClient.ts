/**
 * @file AcousticWorkerClient.ts
 * @module infrastructure/workers
 * @description Main-thread client wrapper managing the AcousticProcessor Web Worker.
 * Handles task IDs, transferable ArrayBuffers, timeouts, and safe termination.
 */

import {
  AcousticWorkerRequest,
  AcousticWorkerResponse,
  AcousticWorkerMessageType,
} from './acousticWorkerProtocol.ts';

export class AcousticWorkerClient {
  private worker: Worker | null = null;
  private nextTaskId = 1;
  private pendingTasks: Map<
    string,
    {
      resolve: (value: AcousticWorkerResponse) => void;
      reject: (reason: any) => void;
      timeoutTimer: any;
    }
  > = new Map();

  constructor() {
    this.initWorker();
  }

  private initWorker(): void {
    if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
      try {
        this.worker = new Worker(
          new URL('./acousticProcessor.worker.ts', import.meta.url),
          { type: 'module' }
        );
        this.worker.onmessage = this.handleWorkerMessage.bind(this);
        this.worker.onerror = this.handleWorkerError.bind(this);
      } catch (err) {
        console.warn('[AcousticWorkerClient] Worker instantiation fallback to main thread:', err);
        this.worker = null;
      }
    }
  }

  public isWorkerAvailable(): boolean {
    return this.worker !== null;
  }

  private handleWorkerMessage(event: MessageEvent<AcousticWorkerResponse>): void {
    const response = event.data;
    const task = this.pendingTasks.get(response.taskId);
    if (task) {
      clearTimeout(task.timeoutTimer);
      this.pendingTasks.delete(response.taskId);
      if (response.success) {
        task.resolve(response);
      } else {
        task.reject(new Error(response.error || 'Acoustic worker task failed'));
      }
    }
  }

  private handleWorkerError(error: ErrorEvent): void {
    console.error('[AcousticWorkerClient] Unhandled Worker error:', error);
    for (const [taskId, task] of this.pendingTasks.entries()) {
      clearTimeout(task.timeoutTimer);
      task.reject(new Error(`Worker encountered fatal error: ${error.message}`));
    }
    this.pendingTasks.clear();
  }

  /**
   * Dispatches a request to the worker with timeout protection.
   */
  public async sendRequest(
    type: AcousticWorkerMessageType,
    payload?: AcousticWorkerRequest['payload'],
    timeoutMs = 5000
  ): Promise<AcousticWorkerResponse> {
    if (!this.worker) {
      throw new Error('WORKER_UNAVAILABLE: Web Worker environment not available.');
    }

    const taskId = `task_${this.nextTaskId++}_${Date.now()}`;
    const request: AcousticWorkerRequest = { taskId, type, payload };

    return new Promise((resolve, reject) => {
      const timeoutTimer = setTimeout(() => {
        this.pendingTasks.delete(taskId);
        reject(new Error(`Acoustic worker task timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pendingTasks.set(taskId, { resolve, reject, timeoutTimer });
      this.worker!.postMessage(request);
    });
  }

  public terminate(): void {
    if (this.worker) {
      this.worker.postMessage({ type: 'TERMINATE', taskId: 'term' });
      this.worker.terminate();
      this.worker = null;
    }
    this.pendingTasks.clear();
  }
}
