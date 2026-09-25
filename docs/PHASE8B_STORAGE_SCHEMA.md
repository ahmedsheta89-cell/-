# Phase 8B: Storage Schema & Versioning

## 1. Storage Schemas

### 1.1 PersistentMemorizationEvent (`learning_events`)
| Field | Type | Description |
|---|---|---|
| `schemaVersion` | `string` | Canonical schema version (e.g. `'1.0.0'`) |
| `sequenceNumber` | `number` | Strictly monotonic integer sequence for the student |
| `previousEventHash` | `string` | SHA-256 hash of previous event (genesis = 64 zeros) |
| `eventHash` | `string` | Canonical SHA-256 hash of this event |
| `eventId` | `string` | Unique event identifier (Primary Key) |
| `studentId` | `string` | Owner student identifier (Indexed) |
| `sessionId` | `string` | Active session identifier |
| `surahId` | `number` | Quran Surah (1-114) |
| `ayahNumber` | `number` | Quran Ayah |
| `wordRange` | `object \| null` | Word start and end index |
| `eventType` | `MemorizationEventType` | Learning event type |
| `evidenceStatus` | `EvidenceStatus` | Recitation evidence status |
| `decisionStatus` | `DecisionStatus` | Decision status |
| `teacherAction` | `TeacherAction` | Pedagogical intervention |
| `timestamp` | `number` | Epoch millisecond timestamp |
| `attemptNumber` | `number` | Attempt counter |
| `retryNumber` | `number` | Retry counter |
| `attemptClusterId` | `string` | Cluster identifier separating retries from reviews |
| `isIndependentReview` | `boolean` | True only for spaced, independent reviews |
| `persistedAt` | `number` | Local persistence timestamp |
| `syncStatus` | `'PENDING' \| 'SYNCED' \| 'FAILED'` | Future Phase 8C synchronization flag |

---

### 1.2 PersistentProfileSnapshot (`profile_snapshots`)
| Field | Type | Description |
|---|---|---|
| `schemaVersion` | `string` | Canonical schema version (`'1.0.0'`) |
| `studentId` | `string` | Owner student identifier (Primary Key) |
| `snapshotVersion` | `number` | Incremental snapshot revision number |
| `sourceEventCursor` | `string` | ID of the last event incorporated |
| `sourceEventCount` | `number` | Total number of events compiled into snapshot |
| `generatedAt` | `number` | Snapshot creation timestamp |
| `profileHash` | `string` | Canonical SHA-256 hash of compiled snapshot |
| `activeMemorizationRange`| `array` | Memorization ranges |
| `passageStates` | `record` | Compiled `PassageLearningRecord` per passage key |
| `revisionDueCount` | `number` | Count of passages due for review |
| `weakPassageCount` | `number` | Count of passages in weak/review state |
| `stablePassageCount` | `number` | Count of passages in stable state |
| `masteredPassageCount`| `number` | Count of passages in mastered state |

---

### 1.3 PersistentRevisionPlan (`revision_plans`)
| Field | Type | Description |
|---|---|---|
| `schemaVersion` | `string` | Schema version (`'1.0.0'`) |
| `studentId` | `string` | Owner student identifier |
| `planId` | `string` | Unique plan ID (Primary Key) |
| `generatedAt` | `number` | Plan generation timestamp |
| `algorithmVersion` | `string` | Version of the 7D revision algorithm |
| `configurationVersion` | `string` | Revision interval configuration version |
| `sourceProfileVersion` | `number` | Snapshot version used as source |
| `mode` | `RevisionSetMode` | DAILY, WEAKNESS, SPACED, MIXED |
| `targets` | `array` | Deterministic passage targets with priority |
| `completedTargets` | `array` | Completed passage keys |
| `remainingTargets` | `array` | Remaining passage keys |
| `estimatedMinutes` | `number` | Time budget |
| `status` | `string` | ACTIVE, COMPLETED, SUPERSEDED, ABANDONED |
| `planHash` | `string` | Canonical SHA-256 hash of plan |

---

### 1.4 PersistentRevisionHistoryRecord (`revision_history`)
Tracks review attempts and outcomes:
- `STARTED`: Session began.
- `COMPLETED`: Review successfully verified.
- `FAILED`: Review error detected.
- `INCONCLUSIVE`: Review incomplete or low confidence (preserved; never treated as failure).

---

## 2. Schema Evolution & Migration Framework
The `PersistenceSchemaMigrator` guarantees:
1. Every persisted record contains an explicit `schemaVersion`.
2. Missing or incompatible versions throw `PERSIST-003: SCHEMA_MISMATCH`.
3. Upgrades are performed stepwise through registered migration handlers without silent background mutation.
