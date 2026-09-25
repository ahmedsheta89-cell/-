/**
 * @file run_phase4e1_evaluation.ts
 * @description Executes the rigorous Phase 4E.1 independent scientific evaluation runner.
 * Evaluates all 8 authentic golden recitations and 5 synthetic adversarial audio files.
 * Calculates exact calibration metrics (ECE, MCE, Brier score), margin distributions,
 * reciter breakdowns, condition breakdowns, and prints the audit report.
 */

import { Phase4dRealInferenceRunner } from './Phase4dRealInferenceRunner.ts';
import { CanonicalPhonemeService } from '../domain/recitation/CanonicalPhonemes.ts';
import { PhonemeAligner } from '../domain/recitation/PhonemeAligner.ts';
import { 
  RecitationEvidenceEvaluator, 
  RecitationEvidence 
} from '../domain/recitation/RecitationEvidence.ts';
import { 
  ConfidenceCalibrator, 
  PredictionSample,
  PROVISIONAL_SAFETY_THRESHOLDS 
} from '../domain/recitation/ConfidenceCalibrator.ts';
import { 
  GOLDEN_RECITATION_SET,
  SYNTHETIC_ADVERSARIAL_SET,
  LOCAL_GOLDEN_REGRESSION_SET 
} from '../domain/recitation/GoldenRecitationSet.ts';

export async function runPhase4e1Evaluation() {
  console.log('========================================================================');
  console.log('  PHASE 4E.1 — INDEPENDENT SCIENTIFIC EVALUATION EXPANSION AUDIT');
  console.log('========================================================================\n');

  const runner = new Phase4dRealInferenceRunner();
  await runner.initialize('models/saboorhsn/quran-stt-int8.onnx', 'models/saboorhsn/tokens.txt');
  const canon = CanonicalPhonemeService.getInstance();
  const aligner = new PhonemeAligner();
  const calibrator = new ConfidenceCalibrator(10);
  const evaluator = new RecitationEvidenceEvaluator();

  const ref1 = canon.getVersePhonemes('1:1')!.tokens;
  const ref2 = canon.getVersePhonemes('1:2')!.tokens;

  console.log('--- 1. EVALUATING ALL 8 AUTHENTIC GOLDEN RECORDINGS ---');
  const authenticResults: any[] = [];
  const allPredictionSamples: PredictionSample[] = [];

  for (const entry of GOLDEN_RECITATION_SET) {
    const pcm = runner.readWav(entry.audioPath);
    const res = await runner.runInferenceOnPcm(pcm, `${entry.reciter} (${entry.ayahId})`);
    const refTokens = entry.ayahId === '1:1' ? ref1 : ref2;
    const summary = aligner.align(refTokens, res.decodedTokens);
    const evidence = aligner.generateEvidence(entry.ayahId, refTokens, res.decodedTokens, summary);
    const disposition = evaluator.evaluateDisposition(evidence);

    authenticResults.push({
      id: entry.id,
      reciter: entry.reciter,
      style: entry.reciterStyle,
      ayahId: entry.ayahId,
      referenceTokensCount: refTokens.length,
      decodedTokensCount: res.decodedTokens.length,
      correctCount: summary.correctCount,
      substitutions: summary.substitutionCount,
      deletions: summary.deletionCount,
      insertions: summary.insertionCount,
      per: summary.phonemeErrorRate,
      rtf: res.rtf,
      disposition: disposition.disposition,
      confidenceStatus: disposition.confidenceStatus,
    });

    // Pair aligned tokens for calibration samples
    for (const op of summary.operations) {
      if (op.hypIndex >= 0 && op.refIndex >= 0) {
        const hyp = res.decodedTokens[op.hypIndex];
        allPredictionSamples.push({
          predictedToken: op.hypToken,
          groundTruthToken: op.refToken,
          confidence: hyp.confidence,
          marginPeak: hyp.marginPeak,
          reciter: entry.reciter,
          condition: entry.reciterStyle,
        });
      }
    }

    console.log(`  [${entry.id}] ${entry.reciter} | Ayah ${entry.ayahId} | PER: ${(summary.phonemeErrorRate * 100).toFixed(2)}% | Sub: ${summary.substitutionCount}, Del: ${summary.deletionCount}, Ins: ${summary.insertionCount} | RTF: ${res.rtf?.toFixed(3)} | Disposition: ${disposition.disposition}`);
  }

  console.log('\n--- 2. EVALUATING SYNTHETIC ADVERSARIAL AUDIO ---');
  const adversarialResults: any[] = [];
  for (const entry of SYNTHETIC_ADVERSARIAL_SET) {
    const pcm = runner.readWav(entry.audioPath);
    const res = await runner.runInferenceOnPcm(pcm, entry.id);
    const refTokens = entry.ayahId === '1:1' ? ref1 : ref2;
    const summary = aligner.align(refTokens, res.decodedTokens);
    const evidence = aligner.generateEvidence(entry.ayahId, refTokens, res.decodedTokens, summary);
    const disposition = evaluator.evaluateDisposition(evidence);

    adversarialResults.push({
      id: entry.id,
      errorType: entry.groundTruthError,
      decodedCount: res.decodedTokens.length,
      disposition: disposition.disposition,
      confidenceStatus: disposition.confidenceStatus,
      deletions: summary.deletionCount,
      insertions: summary.insertionCount,
      substitutions: summary.substitutionCount,
    });

    console.log(`  [${entry.id}] ${entry.groundTruthError} | Decoded: ${res.decodedTokens.length} tokens | Disposition: ${disposition.disposition} (${disposition.confidenceStatus}) | Del: ${summary.deletionCount}, Ins: ${summary.insertionCount}, Sub: ${summary.substitutionCount}`);
  }

  console.log('\n--- 3. CONFIDENCE CALIBRATION & RELIABILITY CURVE (N = ' + allPredictionSamples.length + ') ---');
  const calReport = calibrator.evaluateCalibration(allPredictionSamples);
  console.log(`  Sample Count (N):              ${calReport.numSamples}`);
  console.log(`  Average Confidence:           ${(calReport.averageConfidence * 100).toFixed(2)}%`);
  console.log(`  Average Empirical Accuracy:   ${(calReport.averageAccuracy * 100).toFixed(2)}%`);
  console.log(`  Expected Calibration Error:   ${(calReport.expectedCalibrationError * 100).toFixed(3)}%`);
  console.log(`  Maximum Calibration Error:    ${(calReport.maximumCalibrationError * 100).toFixed(3)}%`);
  console.log(`  Brier Score:                  ${calReport.brierScore.toFixed(5)}`);
  console.log(`  Threshold Classification:     ${calReport.thresholdClassification}`);
  console.log('\n  10-Bin Calibration Table:');
  console.log('  -------------------------------------------------------------------------');
  console.log('  Bin Range      | Count | Mean Conf | Empirical Acc | Calibration Error');
  console.log('  -------------------------------------------------------------------------');
  for (const b of calReport.bins) {
    if (b.sampleCount > 0) {
      console.log(`  [${b.binLower.toFixed(1)} - ${b.binUpper.toFixed(1)}) | ${b.sampleCount.toString().padStart(5)} | ${(b.meanConfidence * 100).toFixed(1).padStart(8)}% | ${(b.empiricalAccuracy * 100).toFixed(1).padStart(12)}% | ${(b.calibrationError * 100).toFixed(2).padStart(16)}%`);
    } else {
      console.log(`  [${b.binLower.toFixed(1)} - ${b.binUpper.toFixed(1)}) |     0 |         - |            - |                -`);
    }
  }
  console.log('  -------------------------------------------------------------------------');

  console.log('\n--- 4. MARGIN_PEAK DISTRIBUTION ---');
  const marginStats = calibrator.evaluateMarginDistribution(allPredictionSamples);
  console.log(`  Samples evaluated:            ${marginStats.sampleCount}`);
  console.log(`  Mean margin_peak:             ${marginStats.meanMargin}`);
  console.log(`  Median margin_peak:           ${marginStats.medianMargin}`);
  console.log(`  Min margin_peak:              ${marginStats.minMargin}`);
  console.log(`  Max margin_peak:              ${marginStats.maxMargin}`);
  console.log(`  Fraction >= 0.80 threshold:   ${(marginStats.fractionAboveThreshold * 100).toFixed(2)}%`);

  console.log('\n--- 5. BREAKDOWN BY RECITER ---');
  const reciterStats = calibrator.evaluateByReciter(allPredictionSamples);
  for (const [rec, s] of Object.entries(reciterStats)) {
    console.log(`  ${rec.padEnd(38)} | Tokens: ${s.count.toString().padStart(3)} | Acc: ${(s.accuracy * 100).toFixed(1)}% | Mean Conf: ${(s.meanConfidence * 100).toFixed(1)}% | Mean Margin: ${s.meanMargin.toFixed(3)}`);
  }

  console.log('\n--- 6. BREAKDOWN BY CONDITION ---');
  const conditionStats = calibrator.evaluateByCondition(allPredictionSamples);
  for (const [cond, s] of Object.entries(conditionStats)) {
    console.log(`  ${cond.padEnd(28)} | Tokens: ${s.count.toString().padStart(3)} | Acc: ${(s.accuracy * 100).toFixed(1)}% | Mean Conf: ${(s.meanConfidence * 100).toFixed(1)}% | Brier: ${s.brierScore.toFixed(4)}`);
  }

  return {
    authenticResults,
    adversarialResults,
    calReport,
    marginStats,
    reciterStats,
    conditionStats,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runPhase4e1Evaluation().catch((err) => {
    console.error('Fatal error during evaluation:', err);
    process.exit(1);
  });
}
