/**
 * @file phase4b_verification.test.ts
 * @module tests
 * @description Comprehensive verification test suite for Phase 4B Real Model Integration & Governance.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ModelRegistry, ModelCertificationStatus, ModelProcurementGateStatus } from '../domain/recitation/ModelRegistry.ts';
import { MelSpectrogramExtractor } from '../application/recitation/acoustic/MelSpectrogramExtractor.ts';
import { MelSpectrogramAdapter } from '../application/recitation/acoustic/MelSpectrogramAdapter.ts';
import { OnnxAcousticModelRunner } from '../infrastructure/acoustic/OnnxAcousticModelRunner.ts';
import { QuranEvaluationDatasetRegistry } from '../domain/evaluation/QuranEvaluationDatasetSpec.ts';
import { ScientificBenchmarkSuite } from '../domain/evaluation/ScientificBenchmarkSuite.ts';
import { AcousticAlignmentEngine } from '../application/recitation/acoustic/AcousticAlignmentEngine.ts';
import { ConfidenceLevel } from '../domain/confidence/types.ts';

describe('Phase 4B — Real Model Integration & Scientific Governance', () => {
  it('1. Model Registry: Conformer-CTC correctly classified as MODEL_BLOCKED without fabrication', () => {
    const model = ModelRegistry.getModel('quran-conformer-ctc-int8');
    assert.ok(model, 'Conformer-CTC entry must exist in formal ModelRegistry');
    assert.equal(model.procurementStatus, ModelProcurementGateStatus.MODEL_BLOCKED);
    assert.equal(model.certificationStatus, ModelCertificationStatus.UNVERIFIED);
    assert.equal(model.checksumSha256, null, 'No fake checksum allowed when model is not packaged');
    assert.ok(model.limitations.some(l => l.includes('MODEL_BLOCKED')));
  });

  it('2. Evaluated Candidate: Wav2Vec2 Arabic is disqualified due to size (317MB) and domain shift', () => {
    const model = ModelRegistry.getModel('wav2vec2-arabic-tashkeel-quantized');
    assert.ok(model);
    assert.equal(model.procurementStatus, ModelProcurementGateStatus.MODEL_BLOCKED);
    assert.ok(model.modelSizeBytes > 300000000, 'Model size is ~317MB');
    assert.ok(model.limitations.some(l => l.includes('exceeds 50MB budget')));
  });

  it('3. MelSpectrogramAdapter: Correctly converts Mel frames into [1, T, 80] tensor format with normalization', () => {
    const extractor = new MelSpectrogramExtractor();
    const adapter = new MelSpectrogramAdapter();

    // 16000 samples = 1.0 second of audio
    const pcm = new Float32Array(16000);
    for (let i = 0; i < pcm.length; i++) {
      pcm[i] = 0.4 * Math.sin((2 * Math.PI * 440 * i) / 16000);
    }

    const melFrames = extractor.extract(pcm);
    assert.ok(melFrames.length > 90, 'Should extract ~98 frames for 1 second');

    const tensorDesc = adapter.adaptForModel(melFrames);
    assert.equal(tensorDesc.shape[0], 1);
    assert.equal(tensorDesc.shape[1], melFrames.length);
    assert.equal(tensorDesc.shape[2], 80);
    assert.equal(tensorDesc.data.length, melFrames.length * 80);
    assert.equal(tensorDesc.isNormalized, true);
    assert.ok(!Number.isNaN(tensorDesc.minVal));
    assert.ok(!Number.isNaN(tensorDesc.maxVal));
  });

  it('4. OnnxAcousticModelRunner: Strictly reports MODEL_BLOCKED and refuses to generate fake logits', async () => {
    const runner = new OnnxAcousticModelRunner();
    assert.equal(runner.getProcurementStatus(), ModelProcurementGateStatus.MODEL_BLOCKED);

    const loadResult = await runner.loadModel();
    assert.equal(loadResult.success, false);
    assert.ok(loadResult.reason.includes('MODEL_BLOCKED'));

    await assert.rejects(
      async () => {
        await runner.runInference([new Float32Array(80)]);
      },
      /INFERENCE_BLOCKED/,
      'Must reject inference when model is not loaded rather than synthesizing fake logits'
    );
  });

  it('5. QuranEvaluationDatasetRegistry & ScientificBenchmarkSuite: Accurately report BLOCKED_NO_DATASET', () => {
    const datasetStatus = QuranEvaluationDatasetRegistry.getDatasetStatus();
    assert.equal(datasetStatus.status, 'BLOCKED');
    assert.equal(datasetStatus.certifiedRecordingsCount, 0);

    const benchmarkStatus = ScientificBenchmarkSuite.getBenchmarkStatus();
    assert.equal(benchmarkStatus.status, 'BLOCKED_NO_DATASET');
    assert.equal(ScientificBenchmarkSuite.canMakeScientificAccuracyClaim(), false);
  });

  it('6. Silence Safety: Silence strictly produces LOW confidence and zero religious errors', () => {
    const engine = new AcousticAlignmentEngine();
    const silencePcm = new Float32Array(16000); // 1 second absolute silence

    const result = engine.alignRecitation(silencePcm, ['الْحَمْدُ', 'لِلَّهِ']);
    assert.equal(result.engineMode, 'FALLBACK_HEURISTIC_TIER1');
    assert.equal(result.overallConfidence, ConfidenceLevel.LOW);
    assert.ok(result.wordTimings.every(w => w.isUncertain));
  });
});
