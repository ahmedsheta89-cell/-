/**
 * @file PhonemeAligner.ts
 * @module domain/recitation
 * @description Levenshtein dynamic programming alignment for phoneme sequences,
 * PER calculation, error decomposition (Sub, Del, Ins, Cor), and RecitationEvidence collection.
 */

import { RecitationEvidence, EvidenceErrorType, EvidenceConfidenceStatus, EMPIRICALLY_CALIBRATED_THRESHOLDS } from './RecitationEvidence.ts';
import { DecodedToken } from '../../tests/Phase4dRealInferenceRunner.ts';

export interface AlignmentOp {
  type: 'MATCH' | 'SUBSTITUTION' | 'DELETION' | 'INSERTION';
  refIndex: number;      // index in reference (-1 for INSERTION)
  hypIndex: number;      // index in hypothesis (-1 for DELETION)
  refToken: string;      // empty for INSERTION
  hypToken: string;      // empty for DELETION
  cost: number;
}

export interface AlignmentSummary {
  referenceLength: number;
  hypothesisLength: number;
  correctCount: number;
  substitutionCount: number;
  deletionCount: number;
  insertionCount: number;
  phonemeErrorRate: number;    // (S + D + I) / N
  accuracy: number;            // C / N
  substitutionRate: number;    // S / N
  deletionRate: number;        // D / N
  insertionRate: number;       // I / N
  operations: AlignmentOp[];
  confusionPairs: { expected: string; observed: string }[];
}

export class PhonemeAligner {
  /**
   * Align reference phonemes and hypothesis decoded tokens using Levenshtein distance.
   */
  public align(
    refTokens: string[],
    hypTokens: DecodedToken[]
  ): AlignmentSummary {
    const N = refTokens.length;
    const M = hypTokens.length;

    // DP Cost Matrix
    const dp: number[][] = Array.from({ length: N + 1 }, () => new Array(M + 1).fill(0));
    const opMatrix: ('MATCH' | 'SUB' | 'DEL' | 'INS')[][] = Array.from(
      { length: N + 1 },
      () => new Array(M + 1).fill('MATCH')
    );

    for (let i = 0; i <= N; i++) {
      dp[i][0] = i; // Deletions cost 1
      opMatrix[i][0] = 'DEL';
    }
    for (let j = 0; j <= M; j++) {
      dp[0][j] = j; // Insertions cost 1
      opMatrix[0][j] = 'INS';
    }

    for (let i = 1; i <= N; i++) {
      const r = refTokens[i - 1];
      for (let j = 1; j <= M; j++) {
        const h = hypTokens[j - 1].symbol;

        const isSame = r === h;
        const matchSubCost = isSame ? 0 : 1.1;

        const costSub = dp[i - 1][j - 1] + matchSubCost;
        const costDel = dp[i - 1][j] + 1;
        const costIns = dp[i][j - 1] + 1;

        let bestCost = costSub;
        let bestOp: 'MATCH' | 'SUB' | 'DEL' | 'INS' = isSame ? 'MATCH' : 'SUB';

        if (costDel < bestCost) {
          bestCost = costDel;
          bestOp = 'DEL';
        }
        if (costIns < bestCost) {
          bestCost = costIns;
          bestOp = 'INS';
        }

        dp[i][j] = bestCost;
        opMatrix[i][j] = bestOp;
      }
    }

    // Traceback to reconstruct operations
    let i = N;
    let j = M;
    const opsReversed: AlignmentOp[] = [];
    const confusionPairs: { expected: string; observed: string }[] = [];

    let correctCount = 0;
    let substitutionCount = 0;
    let deletionCount = 0;
    let insertionCount = 0;

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && (opMatrix[i][j] === 'MATCH' || opMatrix[i][j] === 'SUB')) {
        const isMatch = opMatrix[i][j] === 'MATCH';
        const opType: AlignmentOp['type'] = isMatch ? 'MATCH' : 'SUBSTITUTION';
        if (isMatch) {
          correctCount++;
        } else {
          substitutionCount++;
          confusionPairs.push({ expected: refTokens[i - 1], observed: hypTokens[j - 1].symbol });
        }
        opsReversed.push({
          type: opType,
          refIndex: i - 1,
          hypIndex: j - 1,
          refToken: refTokens[i - 1],
          hypToken: hypTokens[j - 1].symbol,
          cost: isMatch ? 0 : 1,
        });
        i--;
        j--;
      } else if (i > 0 && (j === 0 || opMatrix[i][j] === 'DEL')) {
        deletionCount++;
        opsReversed.push({
          type: 'DELETION',
          refIndex: i - 1,
          hypIndex: -1,
          refToken: refTokens[i - 1],
          hypToken: '',
          cost: 1,
        });
        i--;
      } else {
        insertionCount++;
        opsReversed.push({
          type: 'INSERTION',
          refIndex: -1,
          hypIndex: j - 1,
          refToken: '',
          hypToken: hypTokens[j - 1].symbol,
          cost: 1,
        });
        j--;
      }
    }

    const operations = opsReversed.reverse();
    const refLen = Math.max(1, N);

    const per = (substitutionCount + deletionCount + insertionCount) / refLen;
    const acc = correctCount / refLen;
    const subRate = substitutionCount / refLen;
    const delRate = deletionCount / refLen;
    const insRate = insertionCount / refLen;

    return {
      referenceLength: N,
      hypothesisLength: M,
      correctCount,
      substitutionCount,
      deletionCount,
      insertionCount,
      phonemeErrorRate: per,
      accuracy: acc,
      substitutionRate: subRate,
      deletionRate: delRate,
      insertionRate: insRate,
      operations,
      confusionPairs,
    };
  }

  /**
   * Convert alignment operations into deterministic RecitationEvidence domain objects.
   */
  public generateEvidence(
    ayahId: string,
    refTokens: string[],
    hypTokens: DecodedToken[],
    alignment: AlignmentSummary
  ): RecitationEvidence[] {
    const evidenceList: RecitationEvidence[] = [];

    for (let k = 0; k < alignment.operations.length; k++) {
      const op = alignment.operations[k];
      let errorType: EvidenceErrorType;
      let observedToken = '';
      let acousticConf = 0;
      let startTime = 0;
      let endTime = 0;

      if (op.type === 'MATCH') {
        errorType = 'MATCH';
        const hyp = hypTokens[op.hypIndex];
        observedToken = hyp.symbol;
        acousticConf = hyp.confidence;
        startTime = hyp.timeSeconds;
        endTime = hyp.timeSeconds + 0.05; // ~50ms Zipformer subsampled frame
      } else if (op.type === 'SUBSTITUTION') {
        errorType = 'SUBSTITUTION';
        const hyp = hypTokens[op.hypIndex];
        observedToken = hyp.symbol;
        acousticConf = hyp.confidence;
        startTime = hyp.timeSeconds;
        endTime = hyp.timeSeconds + 0.05;
      } else if (op.type === 'DELETION') {
        errorType = 'DELETION';
        observedToken = '<omitted>';
        acousticConf = 0.90; // High confidence of omission relative to reference
        // Use neighbor time or 0
        startTime = k > 0 && alignment.operations[k - 1].hypIndex >= 0 
          ? hypTokens[alignment.operations[k - 1].hypIndex].timeSeconds 
          : 0;
        endTime = startTime;
      } else { // INSERTION
        errorType = 'INSERTION';
        const hyp = hypTokens[op.hypIndex];
        observedToken = hyp.symbol;
        acousticConf = hyp.confidence;
        startTime = hyp.timeSeconds;
        endTime = hyp.timeSeconds + 0.05;
      }

      // Determine confidence status
      let evidenceStatus: EvidenceConfidenceStatus = 'MEDIUM';
      if (acousticConf >= EMPIRICALLY_CALIBRATED_THRESHOLDS.highThreshold) {
        evidenceStatus = 'HIGH';
      } else if (acousticConf < EMPIRICALLY_CALIBRATED_THRESHOLDS.minAcousticConfidence) {
        evidenceStatus = 'INCONCLUSIVE';
      }

      evidenceList.push({
        ayahId,
        wordIndex: Math.floor(Math.max(0, op.refIndex) / 4), // Approximate word grouping
        phonemeIndex: Math.max(0, op.refIndex),
        expectedToken: op.refToken || '<none>',
        observedToken,
        errorType,
        acousticConfidence: acousticConf,
        alignmentConfidence: 0.95, // High confidence from constrained dynamic programming
        startTime,
        endTime,
        evidenceStatus,
      });
    }

    return evidenceList;
  }
}
