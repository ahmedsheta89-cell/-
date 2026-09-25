/**
 * @file AuditableCtcDecoder.ts
 * @module domain/recitation
 * @description Auditable CTC Greedy Decoder preserving exact frame-level provenance,
 * start/end boundaries, peak activation frames, confidence, and streaming chunk provenance.
 */

import { ObservedToken } from './quranAlignmentTypes.ts';

export interface RawCtcFrame {
  topTokenId: number;
  topProbability: number;
  secondProbability: number;
  margin: number;
  globalFrameIndex: number;
  sourceChunkIndex: number;
}

export interface CtcDecoderOptions {
  blankId?: number;
  secondsPerFrame?: number;
  tokensVocab?: string[];
}

export class AuditableCtcDecoder {
  private readonly blankId: number;
  private readonly secondsPerFrame: number;
  private readonly tokensVocab: string[];

  // Streaming state for boundary preservation
  private activeTokenId: number = -1;
  private activeStartFrame: number = -1;
  private activeEndFrame: number = -1;
  private activeProbabilities: number[] = [];
  private activeMargins: number[] = [];
  private activePeakProb: number = 0;
  private activePeakFrame: number = -1;
  private activeSourceChunk: number = 0;

  private observedTokens: ObservedToken[] = [];
  private totalFramesProcessed: number = 0;

  constructor(options: CtcDecoderOptions = {}) {
    this.blankId = options.blankId !== undefined ? options.blankId : 250;
    this.secondsPerFrame = options.secondsPerFrame || 0.05; // ~50ms per Zipformer output step
    this.tokensVocab = options.tokensVocab || [];
  }

  /**
   * Reset the decoder state for a new audio stream.
   */
  public reset(): void {
    this.activeTokenId = -1;
    this.activeStartFrame = -1;
    this.activeEndFrame = -1;
    this.activeProbabilities = [];
    this.activeMargins = [];
    this.activePeakProb = 0;
    this.activePeakFrame = -1;
    this.activeSourceChunk = 0;
    this.observedTokens = [];
    this.totalFramesProcessed = 0;
  }

  /**
   * Decode a sequence of raw output frames from a streaming chunk.
   * Collapses identical consecutive tokens and strips blank tokens.
   */
  public decodeChunk(
    frames: RawCtcFrame[],
    chunkIndex: number,
    isFinalChunk: boolean = false
  ): ObservedToken[] {
    const newlyCompletedTokens: ObservedToken[] = [];

    for (const frame of frames) {
      const tid = frame.topTokenId;

      if (tid === this.blankId) {
        // Blank frame encountered -> finalize any currently active token
        if (this.activeTokenId !== -1 && this.activeTokenId !== this.blankId) {
          const completed = this.finalizeActiveToken();
          if (completed) {
            this.observedTokens.push(completed);
            newlyCompletedTokens.push(completed);
          }
        }
        this.activeTokenId = this.blankId;
      } else if (tid === this.activeTokenId) {
        // Consecutive repetition of same token -> extend active token duration
        this.activeEndFrame = frame.globalFrameIndex;
        this.activeProbabilities.push(frame.topProbability);
        this.activeMargins.push(frame.margin);
        if (frame.topProbability > this.activePeakProb) {
          this.activePeakProb = frame.topProbability;
          this.activePeakFrame = frame.globalFrameIndex;
        }
      } else {
        // Different non-blank token encountered -> finalize previous token and start new one
        if (this.activeTokenId !== -1 && this.activeTokenId !== this.blankId) {
          const completed = this.finalizeActiveToken();
          if (completed) {
            this.observedTokens.push(completed);
            newlyCompletedTokens.push(completed);
          }
        }

        // Start new active token
        this.activeTokenId = tid;
        this.activeStartFrame = frame.globalFrameIndex;
        this.activeEndFrame = frame.globalFrameIndex;
        this.activeProbabilities = [frame.topProbability];
        this.activeMargins = [frame.margin];
        this.activePeakProb = frame.topProbability;
        this.activePeakFrame = frame.globalFrameIndex;
        this.activeSourceChunk = chunkIndex;
      }

      this.totalFramesProcessed++;
    }

    // If this is the final chunk, finalize any remaining active token
    if (isFinalChunk && this.activeTokenId !== -1 && this.activeTokenId !== this.blankId) {
      const completed = this.finalizeActiveToken();
      if (completed) {
        this.observedTokens.push(completed);
        newlyCompletedTokens.push(completed);
      }
    }

    return newlyCompletedTokens;
  }

  /**
   * Finalize the currently accumulating active token.
   */
  private finalizeActiveToken(): ObservedToken | null {
    if (this.activeTokenId === -1 || this.activeTokenId === this.blankId) {
      return null;
    }

    const tokenSymbol = this.tokensVocab[this.activeTokenId] || `[${this.activeTokenId}]`;
    const meanProb = this.activeProbabilities.length > 0
      ? this.activeProbabilities.reduce((a, b) => a + b, 0) / this.activeProbabilities.length
      : 0.9;
    const maxMargin = this.activeMargins.length > 0
      ? Math.max(...this.activeMargins)
      : 0.85;

    const token: ObservedToken = {
      token: tokenSymbol,
      tokenId: this.activeTokenId,
      confidence: parseFloat(meanProb.toFixed(4)),
      marginPeak: parseFloat(maxMargin.toFixed(4)),
      startFrame: this.activeStartFrame,
      endFrame: this.activeEndFrame,
      startTime: parseFloat((this.activeStartFrame * this.secondsPerFrame).toFixed(3)),
      endTime: parseFloat(((this.activeEndFrame + 1) * this.secondsPerFrame).toFixed(3)),
      sourceChunk: this.activeSourceChunk,
      peakFrame: this.activePeakFrame,
    };

    this.activeTokenId = -1;
    this.activeStartFrame = -1;
    this.activeEndFrame = -1;
    this.activeProbabilities = [];
    this.activeMargins = [];
    this.activePeakProb = 0;
    this.activePeakFrame = -1;

    return token;
  }

  /**
   * Return all observed tokens accumulated across all chunks so far.
   */
  public getAllObservedTokens(): ObservedToken[] {
    return [...this.observedTokens];
  }

  /**
   * Get the current active unfinalized token if present.
   */
  public getPendingActiveToken(): ObservedToken | null {
    if (this.activeTokenId === -1 || this.activeTokenId === this.blankId) {
      return null;
    }
    const tokenSymbol = this.tokensVocab[this.activeTokenId] || `[${this.activeTokenId}]`;
    const meanProb = this.activeProbabilities.length > 0
      ? this.activeProbabilities.reduce((a, b) => a + b, 0) / this.activeProbabilities.length
      : 0.9;
    const maxMargin = this.activeMargins.length > 0
      ? Math.max(...this.activeMargins)
      : 0.85;

    return {
      token: tokenSymbol,
      tokenId: this.activeTokenId,
      confidence: parseFloat(meanProb.toFixed(4)),
      marginPeak: parseFloat(maxMargin.toFixed(4)),
      startFrame: this.activeStartFrame,
      endFrame: this.activeEndFrame,
      startTime: parseFloat((this.activeStartFrame * this.secondsPerFrame).toFixed(3)),
      endTime: parseFloat(((this.activeEndFrame + 1) * this.secondsPerFrame).toFixed(3)),
      sourceChunk: this.activeSourceChunk,
      peakFrame: this.activePeakFrame,
    };
  }
}
