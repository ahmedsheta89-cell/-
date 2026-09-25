# PHASE 8D — MULTI-AGENT COORDINATION & EXECUTION PLAN

## Master Integration Contract & Architectural Governance

**Phase**: 8D — Student Progress UX  
**Lead & Integrator**: Agent 0  
**Current Date**: September 2026  
**Status**: IN PROGRESS  
**Scientific Validation**: Status B (Deterministic, transparent provenance; no fake neuroscience claims)  
**Religious/Scholarly Validation**: Status B (Pedagogical scheduling states; zero automatic Ijazah/certification claims)  

---

## 1. Multi-Agent Workstream Matrix & File Ownership

To prevent merge collisions, architecture drift, or circular dependencies, file ownership is strictly enforced.

| Agent | Workstream Role | Files & Directories Owned | Strictly Forbidden Files | Dependencies |
| :--- | :--- | :--- | :--- | :--- |
| **Agent 0** | Lead / Integrator | `docs/PHASE8D_*.md`, `src/App.tsx` (Integration), Global Registry | No domain logic bypass | All Agents |
| **Agent 1** | UX / Design System | `src/components/progress/design_system/*` (Cards, Rows, EmptyStates, Metrics, Buttons, Status) | `src/domain/*` (Read-only) | Agent 0 |
| **Agent 2** | Domain Read Models / View Models | `src/domain/progress/*` (`StudentProgressViewModel.ts`, `SurahProgressViewModel.ts`, `AyahProgressViewModel.ts`, `RevisionOverviewViewModel.ts`, `WeaknessOverviewViewModel.ts`, `SessionHistoryViewModel.ts`) | Direct database/store mutation | Phase 7D, 8A, 8B, 8C |
| **Agent 3** | Memorization & Revision UX | `src/components/progress/views/TodayView.tsx`, `src/components/progress/views/MemorizationView.tsx`, `src/components/progress/views/RevisionScheduleView.tsx` | Phase 7D state engine internals | Agent 1, Agent 2 |
| **Agent 4** | Visualization & Analytics | `src/components/progress/analytics/*` (`ProgressCoverageChart.tsx`, `SurahDistributionMatrix.tsx`, `ErrorTrendVisualizer.tsx`, `ReviewConsistencyGraph.tsx`) | Fictional retention formulas | Agent 1, Agent 2 |
| **Agent 5** | Offline-First / Sync UX | `src/components/progress/sync/*` (`SyncStatusBanner.tsx`, `ConflictQuarantineModal.tsx`, `OfflineIndicator.tsx`) | Direct cryptographic mutation | Phase 8C, Agent 1 |
| **Agent 6** | Responsive & Accessibility UX | `src/components/progress/a11y/*`, RTL stylesheets, ARIA decorators, Screen Reader helpers | Core domain algorithms | Agent 1, Agent 3, Agent 4 |
| **Agent 7** | Adversarial QA & Testing | `src/tests/Phase8d*.test.ts` (Minimum 150 dedicated tests) | Modifying existing regression tests | All components & models |

---

## 2. Inviolable Architectural Boundaries

1. **Hierarchy of Authority**:
   ```
   Verified Quran Data
           ↓
   Recitation Evidence (Audio/Phonetic)
           ↓
   Deterministic Tajweed Knowledge Base
           ↓
   Phase 5C Error Decision Engine
           ↓
   Phase 7A Teacher Policy
           ↓
   Phase 7B AI Language Layer
           ↓
   Phase 7C Real-Time Interaction
           ↓
   Phase 7D Memorization / Revision Intelligence
           ↓
   Phase 8A Identity
           ↓
   Phase 8B Persistence
           ↓
   Phase 8C Synchronization
           ↓
   Phase 8D Student Progress UX (Presentation Layer ONLY)
   ```
2. **Zero Domain Mutation from UI**: The UI must NEVER directly mutate `MemorizationState`, `ReviewPriority`, or `RevisionSchedule`. All reads are projected through View Models.
3. **Mastered State Semantics**: `MASTERED` (متقن تربويًا) is strictly defined as a «pedagogical scheduling interval milestone». It must NEVER be presented as an Ijazah (إجازة بالسند), formal Sanad certification, or religious qualification.
4. **Evidence Honesty**:
   - `INCONCLUSIVE` is NEVER displayed as a student mistake, failure, or negative regression. It is mapped to: *"لم تكن الإشارة الصوتية كافية للحكم، يُرجى إعادة التلاوة بنقاء أكبر"*.
   - `POSSIBLE` is mapped to: *"ملاحظة محتملة تحتاج إلى مراجعة وتثبّت"*.
   - `CONFIRMED` is mapped to: *"موضع يحتاج إلى عناية وتصحيح"*.
5. **No AI Theological or Judgment Override**: Gemini and LLM layers may explain and summarize, but are strictly prohibited from altering student progress, declaring religious rulings (حلال/حرام/بطلان الصلاة), or overriding Phase 7D deterministic data.
6. **Zero Raw Audio**: No raw audio PCM, Float32Array, or Blobs are ever displayed, stored in progress models, or transmitted.
7. **Zero-Pill Visual Discipline & Anti-Gamification**: No childish casino streaks, no competitive leaderboards, no rainbow pills for static metadata. Clean, calm, dignified Quran-focused Islamic aesthetics.

---

## 3. Integration Sequencing

1. **Phase 8D.1 (Agent 2)**: Core View Models and Selectors derived from Phase 7D, 8A, 8B, and 8C.
2. **Phase 8D.2 (Agent 1)**: Design System components following Zero-Pill discipline and WCAG AA contrast.
3. **Phase 8D.3 (Agent 3)**: Today Dashboard, Memorization Hierarchy, and Revision Urgency Views.
4. **Phase 8D.4 (Agent 4)**: Longitudinal Analytics and Progress Distribution with honest provenance.
5. **Phase 8D.5 (Agent 5)**: Offline & Sync status integration with explicit human conflict resolution.
6. **Phase 8D.6 (Agent 6)**: Responsive breakpoints (320px–1280px+), Arabic RTL typography, and keyboard/ARIA accessibility.
7. **Phase 8D.7 (Agent 7)**: 150+ Adversarial tests covering corner cases, empty states, and invariants.
8. **Phase 8D.8 (Agent 0)**: Master UI integration into `src/App.tsx`, performance benchmarks, and release gate decision.
