# PHASE 8D — TESTING & VERIFICATION STRATEGY

## 1. Test Targets & Scope

Phase 8D requires at least **150 dedicated tests** with zero regression on all preceding 900+ tests.

### Required Test Categories:
1. **View Model & Selector Projections** ($\ge 35$ tests):
   - Derivation of StudentProgressViewModel from empty, partial, and full profiles.
   - Surah progress aggregation (all 114 Surahs manifest alignment).
   - Ayah progress state mapping.
   - Revision queue sorting by deterministic urgency.
   - Weakness recurrence extraction.
   - Session history aggregation.
2. **State & Semantics Mapping** ($\ge 25$ tests):
   - All 9 `MemorizationState` values mapped to correct Arabic labels and helper notes.
   - "MASTERED" invariant: verified as pedagogical scheduling state, never Ijazah.
   - `INCONCLUSIVE` evidence: verified that it never causes penalty, downgrade, or "أخطأت" message.
   - `POSSIBLE` vs `CONFIRMED` error distinctions.
3. **Empty States & Boundary Conditions** ($\ge 20$ tests):
   - Brand new student with 0 events.
   - Student with single Ayah.
   - Student with completed Surah.
   - Large event history ($N = 100$, $N = 1,000$).
4. **Offline & Synchronization State Presentation** ($\ge 25$ tests):
   - Offline transitions.
   - Pending count display.
   - Sync conflict quarantine display and human resolution.
   - Anonymous vs authenticated identity switching.
5. **AI Boundary Invariants** ($\ge 15$ tests):
   - Verify UI components cannot directly mutate domain states.
   - Verify no LLM call can alter mastery or revision schedule.
6. **Accessibility, RTL, and Responsive Layout Rules** ($\ge 20$ tests):
   - RTL attributes and Arabic text direction.
   - ARIA labels on all progress metrics and state indicators.
   - Mobile touch target compliance.
   - High contrast compliance.
7. **Empirical Performance Benchmarks** ($\ge 10$ tests):
   - View model computation latency ($N=100$, $N=1,000$ events).
   - Component rendering performance.
