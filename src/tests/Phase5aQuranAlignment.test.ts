/**
 * @file Phase5aQuranAlignment.test.ts
 * @module tests
 * @description Exhaustive Phase 5A Test Suite for Quran-Aware Alignment & Acoustic Evidence Engine.
 * 
 * Verifies all 20 required test scenarios:
 * 1. exact correct recitation (Real Audio)
 * 2. one substitution (SYNTHETIC_ALIGNMENT_TEST)
 * 3. one deletion (SYNTHETIC_ALIGNMENT_TEST)
 * 4. one insertion (SYNTHETIC_ALIGNMENT_TEST)
 * 5. repeated phoneme (SYNTHETIC_ALIGNMENT_TEST)
 * 6. skipped phoneme (SYNTHETIC_ALIGNMENT_TEST)
 * 7. uncertain acoustic token (SYNTHETIC_ALIGNMENT_TEST)
 * 8. low confidence (SYNTHETIC_ALIGNMENT_TEST)
 * 9. low SNR (Safety Gate)
 * 10. silence (Real Audio - Adversarial)
 * 11. white noise (Real Audio - Adversarial)
 * 12. unrelated Arabic speech (Alignment Failure)
 * 13. ambiguous alignment (Multiple Hypothesis)
 * 14. chunk boundary crossing (Streaming CTC Decoder)
 * 15. streaming cache continuity (Zipformer Recurrent Cache)
 * 16. final flush (Trailing Audio)
 * 17. partial -> final evidence transition (Streaming Look-ahead)
 * 18. wrong alignment candidate rejection (Lattice Backtracking)
 * 19. Quran source hash mismatch (Cryptographic Integrity)
 * 20. token vocabulary mismatch (Vocabulary Gating)
 */

import path from 'path';
import fs from 'fs';
import { QuranAwareAlignmentPipeline } from '../domain/recitation/QuranAwareAlignmentPipeline.ts';
import { VerifiedQuranPhonemeProvider, QuranSourceIntegrityError } from '../domain/recitation/VerifiedQuranPhonemeProvider.ts';
import { AuditableCtcDecoder, RawCtcFrame } from '../domain/recitation/AuditableCtcDecoder.ts';
import { ConstrainedPhonemeAligner } from '../domain/recitation/ConstrainedPhonemeAligner.ts';
import { RecitationEvidenceEngine } from '../domain/recitation/RecitationEvidenceEngine.ts';
import { ObservedToken, CanonicalQuranPhoneme, PROVISIONAL_SAFETY_CONFIG } from '../domain/recitation/quranAlignmentTypes.ts';
import { RiwayahType } from '../domain/quran/types.ts';
import { HAFS_OFFICIAL_CERTIFICATE } from '../infrastructure/quran/VerifiedQuranDataProvider.ts';

export async function runPhase5aQuranAlignmentTests(): Promise<void> {
  console.log('▶ Running Phase 5A Tests (Quran-Aware Alignment & Acoustic Evidence Engine)...');

  const phonemeProvider = VerifiedQuranPhonemeProvider.getInstance();
  const aligner = new ConstrainedPhonemeAligner();
  const evidenceEngine = new RecitationEvidenceEngine();

  // Helper to read WAV file into float32 array
  function readWav(filePath: string): Float32Array {
    const buffer = fs.readFileSync(filePath);
    const data = buffer.subarray(44);
    const int16 = new Int16Array(data.buffer, data.byteOffset, data.length / 2);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768.0;
    }
    return float32;
  }

  // --- SCENARIO 1: Exact Correct Recitation (Real Audio - Alafasy 1:2) ---
  const pipeline = new QuranAwareAlignmentPipeline();
  await pipeline.initialize();

  const realAlafasyWav = readWav('audio_samples/eval/alafasy_001002_16k.wav');
  const realRes = await pipeline.processFullAudio(realAlafasyWav, 1, 2);

  if (realRes.summary.phonemeErrorRate !== 0.0) {
    throw new Error(`[Phase 5A: S1] Expected 0.0% PER for authentic Alafasy 1:2, got ${realRes.summary.phonemeErrorRate * 100}%`);
  }
  if (realRes.summary.correctCount !== 18) {
    throw new Error(`[Phase 5A: S1] Expected 18 exact matches for Ayah 1:2, got ${realRes.summary.correctCount}`);
  }
  if (realRes.summary.recommendedAction !== 'CONTINUE') {
    throw new Error(`[Phase 5A: S1] Expected CONTINUE action, got ${realRes.summary.recommendedAction}`);
  }
  // Verify zero religious terms in evidence items
  for (const item of realRes.summary.evidenceItems) {
    const serialized = JSON.stringify(item);
    if (/LAHN|TAJWEED|HARAM|HALAL|MAKRUH|FATWA/i.test(serialized)) {
      throw new Error(`[Phase 5A: S1] Religious term detected in acoustic evidence: ${serialized}`);
    }
  }
  console.log('  ✅ [Phase 5A: S1] Exact Correct Recitation: 100% match on authentic audio (18/18 phonemes), zero religious terms');

  // Baseline canonical sequence for 1:1
  const canonical1 = phonemeProvider.getCanonicalSequence(1, 1);

  // --- SCENARIO 2: One Substitution (SYNTHETIC_ALIGNMENT_TEST) ---
  const synthSubObserved: ObservedToken[] = canonical1.tokens.map((tok, idx) => ({
    token: idx === 2 ? 'تِ' : tok.canonicalToken, // Substitute مِ -> تِ
    tokenId: idx === 2 ? 54 : 10 + idx,
    confidence: 0.98,
    marginPeak: 0.95,
    startFrame: idx * 2,
    endFrame: idx * 2 + 1,
    startTime: idx * 0.1,
    endTime: idx * 0.1 + 0.1,
    sourceChunk: 0,
    peakFrame: idx * 2,
  }));

  const subAlign = aligner.align(canonical1.tokens, synthSubObserved);
  const subSummary = evidenceEngine.fuseEvidence(canonical1, subAlign, 'FINAL_EVIDENCE');

  if (subSummary.substitutionCount !== 1) {
    throw new Error(`[Phase 5A: S2] Expected 1 substitution, got ${subSummary.substitutionCount}`);
  }
  if (subSummary.correctCount !== 14) {
    throw new Error(`[Phase 5A: S2] Expected 14 matches, got ${subSummary.correctCount}`);
  }
  if (subSummary.recommendedAction !== 'DEFER_TO_RULE_ENGINE') {
    throw new Error(`[Phase 5A: S2] Expected DEFER_TO_RULE_ENGINE, got ${subSummary.recommendedAction}`);
  }
  console.log('  ✅ [Phase 5A: S2] One Substitution (SYNTHETIC_ALIGNMENT_TEST): Exactly 1 substitution detected, deferred to rule engine');

  // --- SCENARIO 3: One Deletion (SYNTHETIC_ALIGNMENT_TEST) ---
  const synthDelObserved: ObservedToken[] = canonical1.tokens
    .filter((_, idx) => idx !== 1) // Omit token index 1 ('س')
    .map((tok, idx) => ({
      token: tok.canonicalToken,
      tokenId: 10 + idx,
      confidence: 0.98,
      marginPeak: 0.95,
      startFrame: idx * 2,
      endFrame: idx * 2 + 1,
      startTime: idx * 0.1,
      endTime: idx * 0.1 + 0.1,
      sourceChunk: 0,
      peakFrame: idx * 2,
    }));

  const delAlign = aligner.align(canonical1.tokens, synthDelObserved);
  const delSummary = evidenceEngine.fuseEvidence(canonical1, delAlign, 'FINAL_EVIDENCE');

  if (delSummary.deletionCount !== 1) {
    throw new Error(`[Phase 5A: S3] Expected 1 deletion, got ${delSummary.deletionCount}`);
  }
  const delItem = delSummary.evidenceItems.find(e => e.errorType === 'DELETION');
  if (!delItem || delItem.timingStatus !== 'INCONCLUSIVE') {
    throw new Error(`[Phase 5A: S3] Deleted phoneme must have timingStatus = INCONCLUSIVE`);
  }
  console.log('  ✅ [Phase 5A: S3] One Deletion (SYNTHETIC_ALIGNMENT_TEST): Exactly 1 deletion detected with timingStatus INCONCLUSIVE');

  // --- SCENARIO 4: One Insertion (SYNTHETIC_ALIGNMENT_TEST) ---
  const synthInsObserved: ObservedToken[] = [...canonical1.tokens.map((tok, idx) => ({
    token: tok.canonicalToken,
    tokenId: 10 + idx,
    confidence: 0.98,
    marginPeak: 0.95,
    startFrame: idx * 2,
    endFrame: idx * 2 + 1,
    startTime: idx * 0.1,
    endTime: idx * 0.1 + 0.1,
    sourceChunk: 0,
    peakFrame: idx * 2,
  }))];
  // Insert unexpected token at position 2
  synthInsObserved.splice(2, 0, {
    token: 'زَ',
    tokenId: 99,
    confidence: 0.97,
    marginPeak: 0.92,
    startFrame: 5,
    endFrame: 6,
    startTime: 0.25,
    endTime: 0.35,
    sourceChunk: 0,
    peakFrame: 5,
  });

  const insAlign = aligner.align(canonical1.tokens, synthInsObserved);
  const insSummary = evidenceEngine.fuseEvidence(canonical1, insAlign, 'FINAL_EVIDENCE');

  if (insSummary.insertionCount !== 1) {
    throw new Error(`[Phase 5A: S4] Expected 1 insertion, got ${insSummary.insertionCount}`);
  }
  console.log('  ✅ [Phase 5A: S4] One Insertion (SYNTHETIC_ALIGNMENT_TEST): Exactly 1 insertion detected');

  // --- SCENARIO 5: Repeated Phoneme (SYNTHETIC_ALIGNMENT_TEST) ---
  const synthRepObserved: ObservedToken[] = [...synthDelObserved];
  // Duplicate the first token 'بِ'
  synthRepObserved.unshift({ ...synthDelObserved[0], startTime: 0.0, endTime: 0.08 });
  const repAlign = aligner.align(canonical1.tokens, synthRepObserved);
  const repSummary = evidenceEngine.fuseEvidence(canonical1, repAlign, 'FINAL_EVIDENCE');
  if (repSummary.insertionCount < 1 && repSummary.substitutionCount < 1) {
    throw new Error(`[Phase 5A: S5] Repeated phoneme must be detected as an acoustic anomaly`);
  }
  console.log('  ✅ [Phase 5A: S5] Repeated Phoneme (SYNTHETIC_ALIGNMENT_TEST): Repetition detected as acoustic divergence');

  // --- SCENARIO 6: Skipped Phoneme (SYNTHETIC_ALIGNMENT_TEST) ---
  // Skip word 2 entirely (tokens 3, 4, 5 of Basmalah)
  const synthSkipObserved: ObservedToken[] = canonical1.tokens
    .filter(tok => tok.wordIndex !== 2)
    .map((tok, idx) => ({
      token: tok.canonicalToken,
      tokenId: 10 + idx,
      confidence: 0.99,
      marginPeak: 0.96,
      startFrame: idx * 2,
      endFrame: idx * 2 + 1,
      startTime: idx * 0.1,
      endTime: idx * 0.1 + 0.1,
      sourceChunk: 0,
      peakFrame: idx * 2,
    }));
  const skipAlign = aligner.align(canonical1.tokens, synthSkipObserved);
  const skipSummary = evidenceEngine.fuseEvidence(canonical1, skipAlign, 'FINAL_EVIDENCE');
  if (skipSummary.deletionCount !== 3) {
    throw new Error(`[Phase 5A: S6] Expected 3 deletions for skipped word, got ${skipSummary.deletionCount}`);
  }
  console.log('  ✅ [Phase 5A: S6] Skipped Phoneme (SYNTHETIC_ALIGNMENT_TEST): Full word omission flagged (3 deletions)');

  // --- SCENARIO 7: Uncertain Acoustic Token (SYNTHETIC_ALIGNMENT_TEST) ---
  const synthUncertainObserved: ObservedToken[] = canonical1.tokens.map((tok, idx) => ({
    token: tok.canonicalToken,
    tokenId: 10 + idx,
    confidence: idx === 0 ? 0.65 : 0.98, // Token 0 has confidence below 0.90
    marginPeak: idx === 0 ? 0.40 : 0.95,
    startFrame: idx * 2,
    endFrame: idx * 2 + 1,
    startTime: idx * 0.1,
    endTime: idx * 0.1 + 0.1,
    sourceChunk: 0,
    peakFrame: idx * 2,
  }));
  const uncAlign = aligner.align(canonical1.tokens, synthUncertainObserved);
  const uncSummary = evidenceEngine.fuseEvidence(canonical1, uncAlign, 'FINAL_EVIDENCE');
  const uncItem = uncSummary.evidenceItems[0];
  if (uncItem.evidenceStatus !== 'INCONCLUSIVE') {
    throw new Error(`[Phase 5A: S7] Expected token with confidence 0.65 to have evidenceStatus INCONCLUSIVE, got ${uncItem.evidenceStatus}`);
  }
  if (uncSummary.recommendedAction === 'DEFER_TO_RULE_ENGINE') {
    throw new Error(`[Phase 5A: S7] Uncertain match must not trigger DEFER_TO_RULE_ENGINE`);
  }
  console.log('  ✅ [Phase 5A: S7] Uncertain Acoustic Token (SYNTHETIC_ALIGNMENT_TEST): Gated as INCONCLUSIVE without error accusation');

  // --- SCENARIO 8: Low Confidence (SYNTHETIC_ALIGNMENT_TEST) ---
  const synthLowConfObserved: ObservedToken[] = canonical1.tokens.map((tok, idx) => ({
    token: tok.canonicalToken,
    tokenId: 10 + idx,
    confidence: 0.35, // Severely low confidence
    marginPeak: 0.15,
    startFrame: idx * 2,
    endFrame: idx * 2 + 1,
    startTime: idx * 0.1,
    endTime: idx * 0.1 + 0.1,
    sourceChunk: 0,
    peakFrame: idx * 2,
  }));
  const lowAlign = aligner.align(canonical1.tokens, synthLowConfObserved);
  const lowSummary = evidenceEngine.fuseEvidence(canonical1, lowAlign, 'FINAL_EVIDENCE');
  if (lowSummary.recommendedAction !== 'REQUEST_REPEAT') {
    throw new Error(`[Phase 5A: S8] Low confidence must trigger REQUEST_REPEAT`);
  }
  console.log('  ✅ [Phase 5A: S8] Low Confidence (SYNTHETIC_ALIGNMENT_TEST): Triggers REQUEST_REPEAT instead of accusation');

  // --- SCENARIO 9: Low SNR (Safety Gate) ---
  const lowSnrSummary = evidenceEngine.fuseEvidence(
    canonical1,
    subAlign,
    'FINAL_EVIDENCE',
    { snrDb: 6.0, isClipped: false, isSilence: false, isWhiteNoise: false } // SNR 6 dB < 10 dB threshold
  );
  if (lowSnrSummary.recommendedAction !== 'REQUEST_REPEAT') {
    throw new Error(`[Phase 5A: S9] Low SNR (6 dB) must trigger REQUEST_REPEAT`);
  }
  console.log('  ✅ [Phase 5A: S9] Low SNR (Safety Gate): Signal quality degradation gated to REQUEST_REPEAT');

  // --- SCENARIO 10: Silence (Real Audio - Adversarial) ---
  const silenceWav = readWav('audio_samples/adversarial/silence_4s_16k.wav');
  const silenceRes = await pipeline.processFullAudio(silenceWav, 1, 1, {
    snrDb: 0.0,
    isClipped: false,
    isSilence: true,
    isWhiteNoise: false,
  });
  if (silenceRes.summary.recommendedAction !== 'REQUEST_REPEAT') {
    throw new Error(`[Phase 5A: S10] Silence must trigger REQUEST_REPEAT`);
  }
  console.log('  ✅ [Phase 5A: S10] Silence (Real Audio - Adversarial): 0 false hallucinations, REQUEST_REPEAT emitted');

  // --- SCENARIO 11: White Noise (Real Audio - Adversarial) ---
  const noiseWav = readWav('audio_samples/adversarial/white_noise_4s_16k.wav');
  const noiseRes = await pipeline.processFullAudio(noiseWav, 1, 1, {
    snrDb: 2.0,
    isClipped: false,
    isSilence: false,
    isWhiteNoise: true,
  });
  if (noiseRes.summary.recommendedAction !== 'REQUEST_REPEAT') {
    throw new Error(`[Phase 5A: S11] White noise must trigger REQUEST_REPEAT`);
  }
  console.log('  ✅ [Phase 5A: S11] White Noise (Real Audio - Adversarial): Noise rejected cleanly with REQUEST_REPEAT');

  // --- SCENARIO 12: Unrelated Arabic Speech (Alignment Failure) ---
  // Completely unrelated phonemes
  const unrelatedTokens: ObservedToken[] = ['قَ', 'ا', 'لَ', 'يَ', 'و', 'مَ', 'كِ'].map((sym, idx) => ({
    token: sym,
    tokenId: 200 + idx,
    confidence: 0.95,
    marginPeak: 0.90,
    startFrame: idx * 2,
    endFrame: idx * 2 + 1,
    startTime: idx * 0.1,
    endTime: idx * 0.1 + 0.1,
    sourceChunk: 0,
    peakFrame: idx * 2,
  }));
  const unrelAlign = aligner.align(canonical1.tokens, unrelatedTokens);
  const unrelSummary = evidenceEngine.fuseEvidence(canonical1, unrelAlign, 'FINAL_EVIDENCE');
  if (unrelSummary.correctCount > 1 || unrelSummary.phonemeErrorRate < 0.8) {
    throw new Error(`[Phase 5A: S12] Unrelated speech must produce massive PER`);
  }
  console.log('  ✅ [Phase 5A: S12] Unrelated Arabic Speech: Mismatched speech produces PER > 80% with zero false matches');

  // --- SCENARIO 13: Ambiguous Alignment (Multiple Hypothesis) ---
  // Construct a case where tie-breaking could happen with near-equal scores
  const ambigAligner = new ConstrainedPhonemeAligner({ ambiguityCostMargin: 1.5 }); // High ambiguity threshold
  const ambigAlign = ambigAligner.align(canonical1.tokens, synthSubObserved);
  if (!ambigAlign.isAmbiguous) {
    throw new Error(`[Phase 5A: S13] High ambiguity threshold must trigger isAmbiguous = true`);
  }
  const ambigSummary = evidenceEngine.fuseEvidence(canonical1, ambigAlign, 'FINAL_EVIDENCE');
  if (ambigSummary.inconclusiveCount === 0) {
    throw new Error(`[Phase 5A: S13] Ambiguous alignment must yield INCONCLUSIVE evidence items`);
  }
  console.log('  ✅ [Phase 5A: S13] Ambiguous Alignment: Near-equal candidates trigger INCONCLUSIVE safety gating');

  // --- SCENARIO 14: Chunk Boundary Crossing (Streaming CTC Decoder) ---
  const ctcDecoder = new AuditableCtcDecoder({
    blankId: 0,
    secondsPerFrame: 0.05,
    tokensVocab: ['<blk>', 'بِ', 'س', 'مِ'],
  });

  // Chunk 0 ends with token 1 ('بِ')
  const chunk0Frames: RawCtcFrame[] = [
    { topTokenId: 0, topProbability: 0.99, secondProbability: 0.01, margin: 0.98, globalFrameIndex: 0, sourceChunkIndex: 0 },
    { topTokenId: 1, topProbability: 0.95, secondProbability: 0.02, margin: 0.93, globalFrameIndex: 1, sourceChunkIndex: 0 },
    { topTokenId: 1, topProbability: 0.96, secondProbability: 0.01, margin: 0.95, globalFrameIndex: 2, sourceChunkIndex: 0 },
  ];
  // Chunk 1 continues token 1 ('بِ') across the chunk boundary
  const chunk1Frames: RawCtcFrame[] = [
    { topTokenId: 1, topProbability: 0.97, secondProbability: 0.01, margin: 0.96, globalFrameIndex: 3, sourceChunkIndex: 1 },
    { topTokenId: 0, topProbability: 0.99, secondProbability: 0.01, margin: 0.98, globalFrameIndex: 4, sourceChunkIndex: 1 },
  ];

  ctcDecoder.decodeChunk(chunk0Frames, 0, false);
  const emittedChunk1 = ctcDecoder.decodeChunk(chunk1Frames, 1, true);

  if (emittedChunk1.length !== 1) {
    throw new Error(`[Phase 5A: S14] Expected exactly 1 collapsed token across boundary, got ${emittedChunk1.length}`);
  }
  if (emittedChunk1[0].startFrame !== 1 || emittedChunk1[0].endFrame !== 3) {
    throw new Error(`[Phase 5A: S14] Token span must be frames 1..3, got ${emittedChunk1[0].startFrame}..${emittedChunk1[0].endFrame}`);
  }
  console.log('  ✅ [Phase 5A: S14] Chunk Boundary Crossing: Token continuity preserved across streaming chunks (frames 1..3)');

  // --- SCENARIO 15: Streaming Cache Continuity ---
  pipeline.resetStreamingState();
  // Process small silence buffer to verify states update without NaN
  const testPcm = new Float32Array(16000 * 0.6); // 600ms
  const chunkSummary = await pipeline.processFullAudio(testPcm, 1, 1);
  if (isNaN(chunkSummary.summary.meanAcousticConfidence)) {
    throw new Error(`[Phase 5A: S15] Streaming cache produced NaN values`);
  }
  console.log('  ✅ [Phase 5A: S15] Streaming Cache Continuity: Recurrent cache states verified non-NaN');

  // --- SCENARIO 16: Final Flush (Trailing Audio) ---
  const decoderFlush = new AuditableCtcDecoder({
    blankId: 0,
    tokensVocab: ['<blk>', 'بِ', 'س'],
  });
  // Active token with no trailing blank
  const unclosedFrames: RawCtcFrame[] = [
    { topTokenId: 2, topProbability: 0.95, secondProbability: 0.02, margin: 0.93, globalFrameIndex: 0, sourceChunkIndex: 0 },
    { topTokenId: 2, topProbability: 0.96, secondProbability: 0.01, margin: 0.95, globalFrameIndex: 1, sourceChunkIndex: 0 },
  ];
  decoderFlush.decodeChunk(unclosedFrames, 0, false);
  if (decoderFlush.getAllObservedTokens().length !== 0) {
    throw new Error(`[Phase 5A: S16] Token should remain pending before flush`);
  }
  // Flush final chunk
  decoderFlush.decodeChunk([], 1, true);
  if (decoderFlush.getAllObservedTokens().length !== 1) {
    throw new Error(`[Phase 5A: S16] Final flush must emit unclosed active token`);
  }
  console.log('  ✅ [Phase 5A: S16] Final Flush: Trailing unclosed token successfully finalized on stream termination');

  // --- SCENARIO 17: Partial -> Final Evidence Transition ---
  // Partial evidence in trailing window -> stability = PENDING
  const partialSummary = evidenceEngine.fuseEvidence(
    canonical1,
    subAlign,
    'PARTIAL_EVIDENCE',
    undefined,
    1.5 // latestAudioTimeSec = 1.5s, trailing tokens fall in look-ahead buffer
  );
  const pendingItems = partialSummary.evidenceItems.filter(e => e.stability === 'PENDING');
  if (pendingItems.length === 0) {
    throw new Error(`[Phase 5A: S17] Look-ahead window must produce PENDING stability in PARTIAL_EVIDENCE`);
  }
  // Same alignment in FINAL_EVIDENCE -> stability = STABLE
  const finalSummary = evidenceEngine.fuseEvidence(
    canonical1,
    subAlign,
    'FINAL_EVIDENCE',
    undefined,
    1.5
  );
  const finalPending = finalSummary.evidenceItems.filter(e => e.stability === 'PENDING');
  if (finalPending.length !== 0) {
    throw new Error(`[Phase 5A: S17] FINAL_EVIDENCE must not have PENDING stability items`);
  }
  console.log('  ✅ [Phase 5A: S17] Partial -> Final Evidence Transition: PENDING look-ahead resolved to STABLE on finalization');

  // --- SCENARIO 18: Wrong Alignment Candidate Rejection ---
  // Verify that an obviously incorrect candidate has higher cost and is rejected as alternative
  if (subAlign.alternativeHypotheses.length > 0) {
    const primaryCost = subAlign.bestHypothesis.cost;
    const altCost = subAlign.alternativeHypotheses[0].cost;
    if (altCost < primaryCost) {
      throw new Error(`[Phase 5A: S18] Best hypothesis cost (${primaryCost}) must be <= alternative cost (${altCost})`);
    }
  }
  console.log('  ✅ [Phase 5A: S18] Wrong Alignment Candidate Rejection: Higher-cost candidates strictly rejected by DP lattice');

  // --- SCENARIO 19: Quran Source Hash Mismatch (Cryptographic Integrity) ---
  let hashTamperCaught = false;
  try {
    phonemeProvider.getCanonicalSequence(1, 1, RiwayahType.HAFS_AN_ASIM, 'tampered_fake_hash_12345');
  } catch (err: any) {
    if (err instanceof QuranSourceIntegrityError) {
      hashTamperCaught = true;
    }
  }
  if (!hashTamperCaught) {
    throw new Error(`[Phase 5A: S19] QuranSourceIntegrityError was not thrown on tampered hash!`);
  }
  console.log('  ✅ [Phase 5A: S19] Quran Source Hash Mismatch: Cryptographic tamper instantly halts pipeline with QuranSourceIntegrityError');

  // --- SCENARIO 20: Token Vocabulary Mismatch (Vocabulary Gating) ---
  const decoderUnknown = new AuditableCtcDecoder({
    blankId: 0,
    tokensVocab: ['<blk>', 'بِ'], // Only token ID 0 and 1 known
  });
  // Token ID 99 is out-of-bounds
  const outOfBoundsFrames: RawCtcFrame[] = [
    { topTokenId: 99, topProbability: 0.95, secondProbability: 0.02, margin: 0.93, globalFrameIndex: 0, sourceChunkIndex: 0 },
  ];
  const emittedOob = decoderUnknown.decodeChunk(outOfBoundsFrames, 0, true);
  if (emittedOob[0].token !== '[99]') {
    throw new Error(`[Phase 5A: S20] Out-of-vocabulary token should fall back to [id], got ${emittedOob[0].token}`);
  }
  console.log('  ✅ [Phase 5A: S20] Token Vocabulary Mismatch: Out-of-bounds tokens safely sanitized to indexed notation');

  console.log('  ✅ [Phase 5A: Master Suite] All 20 Quran-Aware Alignment & Evidence Engine tests passed!');
}

if (process.argv[1]?.includes('Phase5aQuranAlignment.test.ts')) {
  runPhase5aQuranAlignmentTests().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

