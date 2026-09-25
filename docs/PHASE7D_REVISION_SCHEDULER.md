# Phase 7D: Deterministic Revision Scheduler & Heuristic

## 1. Mathematical Formulation
The retention and revision interval $\Delta t$ (in hours) is calculated using a transparent deterministic heuristic:

$$\Delta t = I_0 \times M^{(S - 1)} \times A \times P$$

Where:
- $I_0$: Configured base interval (default 24 hours).
- $M$: Stability growth multiplier (default 1.6).
- $S$: Continuous stability index, bounded to $[0.5, 6.0]$:
  $$S = 1.0 + \min(0.6 \times R_{\text{independent}}, 3.0) + \min(0.15 \times C_{\text{practice}}, 1.0) - 0.8 \times E_{\text{recent}}$$
- $A$: Accuracy factor, bounded to $[0.5, 1.0]$:
  $$A = 0.4 + 0.6 \times \text{EffectiveAccuracy}$$
- $P$: Error penalty factor:
  $$P = \frac{1.0}{1.0 + 0.6 \times E_{\text{recent}}}$$

$\Delta t$ is bounded between `weakIntervalHours` (12 hours) and `masteredIntervalHours` (336 hours / 14 days).

## 2. Machine-Readable Reason Codes
The scheduler assigns explicit reason codes:
- `REVIEW_INTERVAL_REACHED`: Scheduled time has passed.
- `RECENT_CONFIRMED_ERROR`: Recent verified mistakes require follow-up.
- `DECLINING_RECENT_ACCURACY`: Recent accuracy is falling below historical baseline.
- `LONG_ABSENCE`: No independent review in over 7 days.
- `NEW_UNCONSOLIDATED_PASSAGE`: Newly introduced passage in consolidation stage.
- `INSUFFICIENT_INDEPENDENT_REVIEWS`: Less than 2 independent review sessions.
- `NEEDS_REINFORCEMENT_FOLLOWUP`: Passage is on the reinforcement watch-list.
- `PERIODIC_MAINTENANCE`: Standard routine maintenance of stable passages.

## 3. Priority Calculation Factors
Exposes transparent numerical factors:
- `recencyFactor`: How overdue the passage is.
- `errorFactor`: Weight from recent and historical error occurrences.
- `reviewDueFactor`: Proximity to urgency deadline.
- `stabilityFactor`: Inverse stability (lower stability = higher priority).
- `totalPriority`: Composite score bounded between 0.0 and 100.0.
