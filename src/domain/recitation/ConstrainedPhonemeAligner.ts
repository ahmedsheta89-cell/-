/**
 * @file ConstrainedPhonemeAligner.ts
 * @module domain/recitation
 * @description Constrained Dynamic Programming alignment engine between canonical Quranic
 * phonemes and observed CTC tokens. Features multi-hypothesis tracking, ambiguity margin detection,
 * and exact frame/temporal provenance preservation.
 */

import {
  CanonicalQuranPhoneme,
  ObservedToken,
  AlignedEvent,
  AlignmentEventType,
  AlignmentHypothesis,
  TimingProvenanceStatus,
  PROVISIONAL_SAFETY_CONFIG,
} from './quranAlignmentTypes.ts';
import { EvidenceConfidenceStatus } from './RecitationEvidence.ts';

export interface AlignmentEngineOptions {
  ambiguityCostMargin?: number;
  deletionCost?: number;
  insertionCost?: number;
  substitutionCost?: number;
  vowelSubstitutionCost?: number;
}

export class ConstrainedPhonemeAligner {
  private readonly ambiguityCostMargin: number;
  private readonly deletionCost: number;
  private readonly insertionCost: number;
  private readonly substitutionCost: number;
  private readonly vowelSubstitutionCost: number;

  constructor(options: AlignmentEngineOptions = {}) {
    this.ambiguityCostMargin = options.ambiguityCostMargin ?? PROVISIONAL_SAFETY_CONFIG.ambiguityCostMargin;
    this.deletionCost = options.deletionCost ?? 1.0;
    this.insertionCost = options.insertionCost ?? 1.0;
    this.substitutionCost = options.substitutionCost ?? 1.0;
    this.vowelSubstitutionCost = options.vowelSubstitutionCost ?? 0.5;
  }

  /**
   * Align canonical expected phonemes against observed CTC tokens.
   */
  public align(
    canonicalTokens: CanonicalQuranPhoneme[],
    observedTokens: ObservedToken[]
  ): {
    bestHypothesis: AlignmentHypothesis;
    alternativeHypotheses: AlignmentHypothesis[];
    scoreMargin: number;
    isAmbiguous: boolean;
  } {
    const N = canonicalTokens.length;
    const M = observedTokens.length;

    // Handle edge case: empty observed tokens (e.g. silence or total non-emission)
    if (M === 0) {
      const events: AlignedEvent[] = canonicalTokens.map((c, i) => ({
        eventType: 'DELETION' as AlignmentEventType,
        expectedToken: c,
        observedToken: undefined,
        expectedPhonemeIndex: i,
        observedTokenIndex: -1,
        startTime: 0,
        endTime: 0,
        timingStatus: 'INCONCLUSIVE' as TimingProvenanceStatus,
        acousticConfidence: 0.0,
        alignmentConfidence: 1.0,
        evidenceStatus: 'INCONCLUSIVE' as EvidenceConfidenceStatus,
        isAmbiguous: false,
      }));

      const emptyHyp: AlignmentHypothesis = {
        id: 'hyp_deletions_all',
        cost: N * this.deletionCost,
        events,
        marginToNext: 99.0,
        isAmbiguous: false,
      };

      return {
        bestHypothesis: emptyHyp,
        alternativeHypotheses: [],
        scoreMargin: 99.0,
        isAmbiguous: false,
      };
    }

    // 1. Dynamic Programming Cost Matrix
    const dp: number[][] = Array.from({ length: N + 1 }, () => new Array(M + 1).fill(0));

    for (let i = 0; i <= N; i++) {
      dp[i][0] = i * this.deletionCost;
    }
    for (let j = 0; j <= M; j++) {
      dp[0][j] = j * this.insertionCost;
    }

    for (let i = 1; i <= N; i++) {
      const expSym = canonicalTokens[i - 1].canonicalToken;
      for (let j = 1; j <= M; j++) {
        const obsSym = observedTokens[j - 1].token;
        const subCost = this.computeSubCost(expSym, obsSym);

        const matchOrSub = dp[i - 1][j - 1] + subCost;
        const del = dp[i - 1][j] + this.deletionCost;
        const ins = dp[i][j - 1] + this.insertionCost;

        dp[i][j] = Math.min(matchOrSub, del, ins);
      }
    }

    // 2. Backtrack to extract Primary Hypothesis (H1) and Second Candidate (H2)
    const bestPath = this.backtrack(dp, canonicalTokens, observedTokens, 'PRIMARY');
    const altPath = this.backtrack(dp, canonicalTokens, observedTokens, 'ALTERNATIVE');

    const isDifferentPath = Boolean(
      altPath && (
        altPath.events.length !== bestPath.events.length ||
        altPath.events.some((ev, idx) => {
          const b = bestPath.events[idx];
          return !b || ev.eventType !== b.eventType || ev.expectedPhonemeIndex !== b.expectedPhonemeIndex || ev.observedTokenIndex !== b.observedTokenIndex;
        })
      )
    );

    const cost1 = dp[N][M];
    // If a distinct path exists on a tie, scoreMargin is |altPath.cost - cost1| (which is 0 on tie).
    // If no distinct path exists on a tie, the next best alternative costs at least 1.0 more (deletion + insertion vs substitution).
    const cost2 = isDifferentPath ? altPath!.cost : cost1 + 1.0;
    const scoreMargin = Math.abs(cost2 - cost1);
    const isAmbiguous = scoreMargin < this.ambiguityCostMargin;

    const bestHypothesis: AlignmentHypothesis = {
      id: 'hyp_primary',
      cost: cost1,
      events: bestPath.events,
      marginToNext: parseFloat(scoreMargin.toFixed(4)),
      isAmbiguous,
    };

    const alternativeHypotheses: AlignmentHypothesis[] = [];
    if (altPath && isDifferentPath) {
      alternativeHypotheses.push({
        id: 'hyp_secondary',
        cost: altPath.cost,
        events: altPath.events,
        marginToNext: parseFloat(scoreMargin.toFixed(4)),
        isAmbiguous,
      });
    }

    // If ambiguous, mark contested events with INCONCLUSIVE evidence status
    if (isAmbiguous) {
      for (const ev of bestHypothesis.events) {
        if (ev.eventType !== 'MATCH') {
          ev.isAmbiguous = true;
          ev.evidenceStatus = 'INCONCLUSIVE';
        }
      }
    }

    return {
      bestHypothesis,
      alternativeHypotheses,
      scoreMargin: parseFloat(scoreMargin.toFixed(4)),
      isAmbiguous,
    };
  }

  /**
   * Distance metric between expected canonical symbol and observed CTC symbol.
   */
  private computeSubCost(expected: string, observed: string): number {
    if (expected === observed) {
      return 0.0;
    }
    // Harakah / Madd variants share root consonant
    if (this.isPhoneticVariant(expected, observed)) {
      return this.vowelSubstitutionCost;
    }
    return this.substitutionCost;
  }

  /**
   * Checks if two tokens are subtle vowel / elongation variants of the same base consonant.
   */
  private isPhoneticVariant(a: string, b: string): boolean {
    if (a.length === 0 || b.length === 0) return false;
    // Shared base Arabic character
    const baseA = a[0];
    const baseB = b[0];
    if (baseA === baseB) return true;
    // Elongation Madd symbols
    if ((a.includes('ۦ') || a.includes('اا')) && (b.includes('ۦ') || b.includes('اا'))) {
      return true;
    }
    return false;
  }

  /**
   * Deterministic backtracking through the DP lattice.
   */
  private backtrack(
    dp: number[][],
    canonical: CanonicalQuranPhoneme[],
    observed: ObservedToken[],
    mode: 'PRIMARY' | 'ALTERNATIVE'
  ): { events: AlignedEvent[]; cost: number } {
    let i = canonical.length;
    let j = observed.length;
    const rawEvents: AlignedEvent[] = [];
    let pathCost = 0;

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0) {
        const exp = canonical[i - 1];
        const obs = observed[j - 1];
        const subCost = this.computeSubCost(exp.canonicalToken, obs.token);

        const fromDiag = dp[i - 1][j - 1] + subCost;
        const fromUp = dp[i - 1][j] + this.deletionCost;
        const fromLeft = dp[i][j - 1] + this.insertionCost;

        // In primary mode, prioritize diagonal (MATCH/SUB) > UP (DEL) > LEFT (INS)
        // In alternative mode, prioritize UP or LEFT if costs are identical
        if (mode === 'PRIMARY') {
          if (Math.abs(dp[i][j] - fromDiag) < 1e-5) {
            const evType: AlignmentEventType = subCost === 0.0 ? 'MATCH' : 'SUBSTITUTION';
            rawEvents.unshift(this.createEvent(evType, exp, obs, i - 1, j - 1));
            pathCost += subCost;
            i--;
            j--;
            continue;
          } else if (Math.abs(dp[i][j] - fromUp) < 1e-5) {
            rawEvents.unshift(this.createEvent('DELETION', exp, undefined, i - 1, -1));
            pathCost += this.deletionCost;
            i--;
            continue;
          } else {
            rawEvents.unshift(this.createEvent('INSERTION', undefined, obs, -1, j - 1));
            pathCost += this.insertionCost;
            j--;
            continue;
          }
        } else {
          // Alternative mode: explore alternative branch on tie
          if (Math.abs(dp[i][j] - fromUp) < 1e-5 && fromUp <= fromDiag) {
            rawEvents.unshift(this.createEvent('DELETION', exp, undefined, i - 1, -1));
            pathCost += this.deletionCost;
            i--;
            continue;
          } else if (Math.abs(dp[i][j] - fromDiag) < 1e-5) {
            const evType: AlignmentEventType = subCost === 0.0 ? 'MATCH' : 'SUBSTITUTION';
            rawEvents.unshift(this.createEvent(evType, exp, obs, i - 1, j - 1));
            pathCost += subCost;
            i--;
            j--;
            continue;
          } else {
            rawEvents.unshift(this.createEvent('INSERTION', undefined, obs, -1, j - 1));
            pathCost += this.insertionCost;
            j--;
            continue;
          }
        }
      } else if (i > 0) {
        // Only deletions left
        const exp = canonical[i - 1];
        rawEvents.unshift(this.createEvent('DELETION', exp, undefined, i - 1, -1));
        pathCost += this.deletionCost;
        i--;
      } else {
        // Only insertions left
        const obs = observed[j - 1];
        rawEvents.unshift(this.createEvent('INSERTION', undefined, obs, -1, j - 1));
        pathCost += this.insertionCost;
        j--;
      }
    }

    return { events: rawEvents, cost: pathCost };
  }

  /**
   * Helper to instantiate an AlignedEvent preserving exact temporal provenance.
   */
  private createEvent(
    eventType: AlignmentEventType,
    expectedToken?: CanonicalQuranPhoneme,
    observedToken?: ObservedToken,
    expectedPhonemeIndex: number = -1,
    observedTokenIndex: number = -1
  ): AlignedEvent {
    let startTime = 0;
    let endTime = 0;
    let timingStatus: TimingProvenanceStatus = 'VALID';
    let acousticConfidence = 0.0;

    if (observedToken) {
      startTime = observedToken.startTime;
      endTime = observedToken.endTime;
      acousticConfidence = observedToken.confidence;
      timingStatus = 'VALID';
    } else {
      // Deletion: No acoustic manifestation in time
      startTime = 0;
      endTime = 0;
      timingStatus = 'INCONCLUSIVE';
      acousticConfidence = 1.0; // High certainty that audio token was deleted
    }

    let alignmentConfidence = 1.0;
    if (eventType === 'SUBSTITUTION') {
      alignmentConfidence = 0.85;
    } else if (eventType === 'DELETION' || eventType === 'INSERTION') {
      alignmentConfidence = 0.90;
    }

    let evidenceStatus: EvidenceConfidenceStatus = 'HIGH';
    if (acousticConfidence < PROVISIONAL_SAFETY_CONFIG.minConfidence) {
      evidenceStatus = 'LOW';
    } else if (observedToken && observedToken.marginPeak < PROVISIONAL_SAFETY_CONFIG.minMarginPeak) {
      evidenceStatus = 'MEDIUM';
    }

    return {
      eventType,
      expectedToken,
      observedToken,
      expectedPhonemeIndex,
      observedTokenIndex,
      startTime,
      endTime,
      timingStatus,
      acousticConfidence: parseFloat(acousticConfidence.toFixed(4)),
      alignmentConfidence: parseFloat(alignmentConfidence.toFixed(4)),
      evidenceStatus,
      isAmbiguous: false,
    };
  }
}
