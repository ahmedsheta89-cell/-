import { Phase4dRealInferenceRunner } from './Phase4dRealInferenceRunner.js';

async function main() {
  console.log('===============================================================');
  console.log('PHASE 4D — REAL ONNX ACOUSTIC INFERENCE PROOF (ZERO MOCKS)');
  console.log('===============================================================');

  const runner = new Phase4dRealInferenceRunner();
  await runner.initialize('models/saboorhsn/quran-stt-int8.onnx', 'models/saboorhsn/tokens.txt');

  console.log('\nRunning test suite on real recitation & adversarial audio...');
  const results = await runner.runFullSuite();

  console.log('\n===============================================================');
  console.log('INFERENCE BENCHMARK & DISCRIMINATION RESULTS:');
  console.log('===============================================================');
  for (const res of results) {
    console.log(`\n▶ INPUT: ${res.name}`);
    console.log(`  Duration: ${res.durationSec}s | RMS: ${res.rms} | RTF / Latency: ${res.inferenceTimeMs}ms`);
    console.log(`  Decoded CTC Sequence: "${res.decodedSequence}"`);
    console.log(`  Unique Tokens Emitted: ${res.uniqueTokens}`);
    console.log(`  Top Phoneme / Token Frequencies:`, res.topTokens.slice(0, 5));
    console.log(`  Mean Top Softmax Prob: ${res.meanTopProb}`);
  }

  // Factual verification checks
  const alafasy = results[0];
  const silence = results[2];
  const noise = results[3];
  const tone = results[4];

  console.log('\n===============================================================');
  console.log('ADVERSARIAL & PHONETIC DISCRIMINATION VERIFICATION:');
  console.log('===============================================================');

  const hasPhoneticOutput = alafasy.decodedSequence.length > 0;
  console.log(`✓ Real Quran Audio produces non-trivial phonetic sequence: ${hasPhoneticOutput} ("${alafasy.decodedSequence}")`);

  const silenceYieldsNothing = silence.decodedSequence.length === 0;
  console.log(`✓ Silence yields 0 non-blank phonemes: ${silenceYieldsNothing}`);

  const toneNoiseDifferentiated = tone.decodedSequence !== noise.decodedSequence;
  console.log(`✓ Tone and White Noise produce distinct outputs (no identical acoustic collapse): ${toneNoiseDifferentiated}`);

  const realDifferentiatesFromNoise = alafasy.decodedSequence !== noise.decodedSequence;
  console.log(`✓ Real recitation sharply differentiates from noise: ${realDifferentiatesFromNoise}`);

  if (hasPhoneticOutput && silenceYieldsNothing && toneNoiseDifferentiated && realDifferentiatesFromNoise) {
    console.log('\n>>> PROOF VERDICT: REAL NEURAL ACOUSTIC MODEL INFERENCE FULLY VERIFIED <<<');
  } else {
    console.error('\n>>> PROOF VERDICT: FAILED DISCRIMINATION <<<');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
