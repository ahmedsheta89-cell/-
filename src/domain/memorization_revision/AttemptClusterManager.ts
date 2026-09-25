/**
 * @file AttemptClusterManager.ts
 * @module domain/memorization_revision
 * @description Manages attempt clustering and enforces the distinction between immediate retries and independent reviews (Parts 8 & 9).
 * 
 * PEDAGOGICAL INVARIANT:
 * Immediate retries within the same teaching interaction (read -> error -> repeat -> error -> repeat -> pass)
 * must be represented as ONE practice cluster with multiple attempts.
 * They must NEVER be counted as multiple independent successful reviews to inflate long-term mastery.
 */

import {
  MemorizationEvent,
  MemorizationEventType,
  EvidenceStatus,
  AttemptCluster,
  ClusterInteractionType,
  RevisionScheduleConfig,
  CANONICAL_REVISION_CONFIG,
} from './types.ts';
import { RecitationDecisionState } from '../recitation/decisionTypes.ts';

export class AttemptClusterManager {
  private readonly config: RevisionScheduleConfig;

  constructor(config?: Partial<RevisionScheduleConfig>) {
    this.config = { ...CANONICAL_REVISION_CONFIG, ...config };
  }

  /**
   * Determines whether an incoming event should belong to the same existing cluster
   * or start a new cluster.
   */
  public shouldClusterWith(
    lastEventInCluster: MemorizationEvent,
    newEvent: MemorizationEvent
  ): boolean {
    // 1. Must be the exact same passage and student
    if (
      lastEventInCluster.studentId !== newEvent.studentId ||
      lastEventInCluster.surahId !== newEvent.surahId ||
      lastEventInCluster.ayahNumber !== newEvent.ayahNumber
    ) {
      return false;
    }

    // 2. If explicitly assigned different cluster IDs, keep separate
    if (
      lastEventInCluster.attemptClusterId &&
      newEvent.attemptClusterId &&
      lastEventInCluster.attemptClusterId !== newEvent.attemptClusterId
    ) {
      return false;
    }

    // 3. Check time gap between attempts
    const timeDiffMs = Math.abs(newEvent.timestamp - lastEventInCluster.timestamp);
    if (timeDiffMs > this.config.maxClusterGapMs) {
      return false; // Time gap too large: belongs to new cluster
    }

    // 4. Same session continuity
    if (lastEventInCluster.sessionId === newEvent.sessionId) {
      return true;
    }

    return false;
  }

  /**
   * Distinguishes whether a cluster represents an INDEPENDENT_REVIEW or a PRACTICE_ATTEMPT (Part 9).
   */
  public determineClusterInteractionType(
    events: readonly MemorizationEvent[],
    lastPassageReviewAt: number
  ): ClusterInteractionType {
    if (events.length === 0) {
      return ClusterInteractionType.PRACTICE_ATTEMPT;
    }

    // If any event was explicitly flagged as independent review and is not an immediate retry
    const hasExplicitIndependentFlag = events.some((e) => e.isIndependentReview);
    const clusterStartTime = events[0].timestamp;

    const minGapMs = this.config.independentReviewMinGapHours * 60 * 60 * 1000;
    const elapsedSinceLastReview = lastPassageReviewAt > 0 ? clusterStartTime - lastPassageReviewAt : Infinity;

    if (hasExplicitIndependentFlag && elapsedSinceLastReview >= minGapMs) {
      return ClusterInteractionType.INDEPENDENT_REVIEW;
    }

    if (elapsedSinceLastReview >= minGapMs && lastPassageReviewAt > 0) {
      return ClusterInteractionType.INDEPENDENT_REVIEW;
    }

    return ClusterInteractionType.PRACTICE_ATTEMPT;
  }

  /**
   * Evaluates a completed group of events into a unified AttemptCluster object.
   */
  public aggregateCluster(
    events: readonly MemorizationEvent[],
    lastPassageReviewAt: number = 0
  ): AttemptCluster {
    if (events.length === 0) {
      throw new Error('Cannot aggregate an empty attempt cluster');
    }

    const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);
    const first = sortedEvents[0];
    const last = sortedEvents[sortedEvents.length - 1];

    const passageKey = `${first.surahId}:${first.ayahNumber}`;
    const clusterId = first.attemptClusterId || `cluster-${first.sessionId}-${passageKey}`;

    // Count confirmed successes and confirmed errors within this cluster
    let confirmedSuccesses = 0;
    let confirmedErrors = 0;
    let retryCount = 0;

    for (const evt of sortedEvents) {
      if (evt.eventType === MemorizationEventType.CONFIRMED || evt.eventType === MemorizationEventType.AYAH_COMPLETED) {
        if (evt.evidenceStatus === EvidenceStatus.CONFIRMED && evt.decisionStatus === RecitationDecisionState.CONTINUE) {
          confirmedSuccesses++;
        }
      } else if (
        evt.eventType === MemorizationEventType.ERROR_CONFIRMED ||
        evt.eventType === MemorizationEventType.REVIEW_FAILED
      ) {
        if (evt.evidenceStatus === EvidenceStatus.CONFIRMED) {
          confirmedErrors++;
        }
      } else if (evt.eventType === MemorizationEventType.RETRY) {
        retryCount++;
      }
    }

    // Total decisive events
    const decisiveEvents = confirmedSuccesses + confirmedErrors;
    const aggregateAccuracy =
      decisiveEvents > 0
        ? confirmedSuccesses / decisiveEvents
        : sortedEvents.some((e) => e.decisionStatus === RecitationDecisionState.CONTINUE)
        ? 1.0
        : 0.5;

    // Did the cluster end successfully?
    const isResolvedSuccessfully =
      last.decisionStatus === RecitationDecisionState.CONTINUE &&
      last.evidenceStatus === EvidenceStatus.CONFIRMED;

    const interactionType = this.determineClusterInteractionType(sortedEvents, lastPassageReviewAt);

    return Object.freeze({
      clusterId,
      sessionId: first.sessionId,
      passageKey,
      startedAt: first.timestamp,
      endedAt: last.timestamp,
      interactionType,
      attempts: Object.freeze(sortedEvents),
      aggregateAccuracy,
      isResolvedSuccessfully,
      retryCount: Math.max(retryCount, sortedEvents.length - 1),
    });
  }
}
