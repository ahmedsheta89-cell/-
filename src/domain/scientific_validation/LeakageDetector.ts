/**
 * @file LeakageDetector.ts
 * @module domain/scientific_validation
 * @description Mandatory Data Leakage Auditor (Section 7).
 * 
 * CORE CONTRACT:
 * Verifies that:
 * 1. No reciter appears in both training/calibration and held-out test splits.
 * 2. No duplicate recording audio hashes cross splits.
 * 3. No segment from the same recording appears across train and test.
 */

import { RecordingManifestEntry, LeakageReport } from './types.ts';

export class LeakageDetector {
  public static auditSplits(manifest: readonly RecordingManifestEntry[]): LeakageReport {
    const trainReciters = new Set<string>();
    const calReciters = new Set<string>();
    const testReciters = new Set<string>();

    const trainHashes = new Set<string>();
    const calHashes = new Set<string>();
    const testHashes = new Set<string>();

    const reciterLeakageDetails: string[] = [];
    const hashLeakageDetails: string[] = [];
    const recordingLeakageDetails: string[] = [];
    const segmentLeakageDetails: string[] = [];

    for (const entry of manifest) {
      if (entry.split === 'TRAIN') {
        trainReciters.add(entry.reciterId);
        trainHashes.add(entry.audioHash);
      } else if (entry.split === 'CALIBRATION') {
        calReciters.add(entry.reciterId);
        calHashes.add(entry.audioHash);
      } else if (entry.split === 'FINAL_TEST') {
        testReciters.add(entry.reciterId);
        testHashes.add(entry.audioHash);
      }
    }

    // 1. Reciter Leakage check between (TRAIN U CALIBRATION) and FINAL_TEST
    for (const reciter of testReciters) {
      if (trainReciters.has(reciter)) {
        reciterLeakageDetails.push(`Reciter ${reciter} present in both TRAIN and FINAL_TEST`);
      }
      if (calReciters.has(reciter)) {
        reciterLeakageDetails.push(`Reciter ${reciter} present in both CALIBRATION and FINAL_TEST`);
      }
    }

    // 2. Audio Hash Leakage check
    for (const hash of testHashes) {
      if (trainHashes.has(hash)) {
        hashLeakageDetails.push(`Audio hash ${hash} present in both TRAIN and FINAL_TEST`);
      }
      if (calHashes.has(hash)) {
        hashLeakageDetails.push(`Audio hash ${hash} present in both CALIBRATION and FINAL_TEST`);
      }
    }

    // 3. Segment / Recording Leakage check
    const trainRecordings = manifest.filter(m => m.split === 'TRAIN').map(m => m.recordingId);
    const testRecordings = manifest.filter(m => m.split === 'FINAL_TEST').map(m => m.recordingId);
    for (const tId of testRecordings) {
      if (trainRecordings.includes(tId)) {
        recordingLeakageDetails.push(`Recording ID ${tId} duplicated across TRAIN and TEST`);
      }
    }

    const reciterLeakageDetected = reciterLeakageDetails.length > 0;
    const recordingLeakageDetected = recordingLeakageDetails.length > 0;
    const audioHashLeakageDetected = hashLeakageDetails.length > 0;
    const segmentLeakageDetected = segmentLeakageDetails.length > 0;

    const overallClean = !reciterLeakageDetected &&
                         !recordingLeakageDetected &&
                         !audioHashLeakageDetected &&
                         !segmentLeakageDetected;

    return Object.freeze({
      reciterLeakageDetected,
      reciterLeakageDetails: Object.freeze(reciterLeakageDetails),
      recordingLeakageDetected,
      recordingLeakageDetails: Object.freeze(recordingLeakageDetails),
      segmentLeakageDetected,
      segmentLeakageDetails: Object.freeze(segmentLeakageDetails),
      audioHashLeakageDetected,
      audioHashLeakageDetails: Object.freeze(hashLeakageDetails),
      overallLeakageClean: overallClean,
      auditTimestamp: new Date().toISOString(),
    });
  }
}
