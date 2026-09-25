# PHASE 5B: DETERMINISTIC TAJWEED RULE MAPPING ENGINE
## Architectural Specification, Verification Manifest & Scientific Boundary Documentation

---

## 1. Executive Summary & Scientific Status

In accordance with Phase 5B directives, the **Deterministic Tajweed Rule Mapping Layer** bridges the verified Phase 5A acoustic evidence engine with classical Islamic phonetic jurisprudence.

### Global Scientific Validation Gate
```
STATUS: B — EVALUATED BUT INSUFFICIENT
```
- Real acoustic model verified (Zipformer2-CTC onnxruntime-node).
- Exact Kaldi 80-bin Mel FBank verified.
- Monotonic Viterbi / DP Quran-aware alignment verified.
- Deterministic Tajweed rule mapping verified across 19 canonical rules.
- Local golden regression verified across 8 master reciters and 82 test conditions.
- Upstream benchmark reproduction remains gated by Hugging Face access constraints (`ERR-ASR-001`).
- **No commercial or unverified production accuracy claim is permitted.**

---

## 2. Fundamental Architecture & Boundary Enforcement

The system strictly enforces the sacred one-way causal separation:

```
                  ┌─────────────────────────────────────┐
                  │    Authentic Audio Stream (16kHz)   │
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │      Kaldi FBank (80 Mel Bins)      │
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │     Zipformer2-CTC Acoustic Model   │
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │ Auditable Phonetic Alignment Engine │
                  │  (Monotonic Viterbi / DP Alignment) │
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │   Quranic Alignment Evidence (5A)   │
                  │   { MATCH, SUB, DEL, INS, UNCERTAIN }│
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │         Phase 5B: Deterministic Tajweed Context Evaluator       │
  │                                                                 │
  │   Inputs:                                                       │
  │     1. Verified Quran Location (Surah, Ayah, Word, Phoneme)     │
  │     2. Canonical Uthmani Word Context                           │
  │     3. Canonical Phoneme Context (Target, Prev, Next)           │
  │     4. Cryptographically Verified Tajweed Knowledge Base        │
  │        (SHA-256: 4d67db2644cf57dd98609126e5081a50d3f8ede876...│
  │     5. Phase 5A Acoustic Alignment Evidence                     │
  │                                                                 │
  │   Output:                                                       │
  │     Immutable, Deeply-Frozen TajweedRuleEvidence                │
  │     { SUPPORTED, NOT_SUPPORTED, INCONCLUSIVE, NOT_VERIFIED }    │
  └──────────────────────────────────┬──────────────────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │       Downstream Teacher AI         │
                  │   (Pedagogical Explanations ONLY;   │
                  │   ZERO Authority to Alter Decisions)│
                  └─────────────────────────────────────┘
```

### Absolute Negative Rules:
1. **ZERO LLM Rule Generation**: Never use an LLM to invent, infer, parse, or decide Tajweed rules.
2. **ZERO Religious Accusations**: The engine never outputs words of religious sin or ritual invalidity (`HARAM`, `HALAL`, `SIN`, `SAWAB`, `INVALID`, `BATIL`, `ITHM`).
3. **Applicability != Compliance**: A Tajweed rule being APPLICABLE does not imply the student violated or satisfied it.
4. **Safety Preference**: The engine prefers `INCONCLUSIVE` / `NOT_VERIFIED` over false religious correction.

---

## 3. Verified Tajweed Knowledge Base & Cryptographic Integrity

The Knowledge Base is formalized in `src/domain/tajweed/rulesCatalog.ts` and managed by `src/domain/tajweed/VerifiedTajweedKnowledgeBase.ts`.

### Canonical Certificate
- **Knowledge Base Version**: `1.0.0`
- **Riwayah Scope**: `HAFS_AN_ASIM` (via Tareeq ash-Shatibiyyah)
- **Primary Source Citations**:
  - *Tuhfat al-Atfal* (تحفة الأطفال) — Imam Sulayman al-Jamzuri
  - *Al-Muqaddimah al-Jazariyyah* (المقدمة الجزرية) — Imam Ibn al-Jazari
- **Cryptographic SHA-256 Checksum**:
  `4d67db2644cf57dd98609126e5081a50d3f8ede876cd832a125257fea5a0cec3`
- **Total Certified Rules**: 19 active rules

### Verified Rules Catalog

| Rule ID | Arabic Name | Category | Primary Classical Authority |
| :--- | :--- | :--- | :--- |
| `noon_izhar_halqi` | إظهار حلقي | أحكام النون الساكنة والتنوين | تحفة الأطفال — للنون إن تسكن وللتنوين أربع أحكام... فالأول الإظهار |
| `noon_idgham_bi_ghunnah` | إدغام بغنة | أحكام النون الساكنة والتنوين | تحفة الأطفال — والثانِ إدغام بستة أتت... لكنها قسمان قسم يدغما فيه بغنة بينمو علما |
| `noon_idgham_bila_ghunnah` | إدغام بغير غنة | أحكام النون الساكنة والتنوين | تحفة الأطفال — والثانِ إدغام بغير غنة... في اللام والرا ثم كررنه |
| `noon_iqlab` | إقلاب | أحكام النون الساكنة والتنوين | تحفة الأطفال — والثالث الإقلاب عند الباء ميما بغنة مع الإخفاء |
| `noon_ikhfa_haqiqi` | إخفاء حقيقي | أحكام النون الساكنة والتنوين | تحفة الأطفال — والرابع الإخفاء عند الفاضل من الحروف... صف ذا ثنا كم جاد شخص قد سما |
| `meem_ikhfa_shafawi` | إخفاء شفوي | أحكام الميم الساكنة | تحفة الأطفال — فالأول الإخفاء عند الباء وسمه الشفوي للقراء |
| `meem_idgham_shafawi` | إدغام شفوي (إدغام مثلين صغير) | أحكام الميم الساكنة | تحفة الأطفال — والثانِ إدغام بمثلها أتى وسم إدغاما صغيرا يا فتى |
| `meem_izhar_shafawi` | إظهار شفوي | أحكام الميم الساكنة | تحفة الأطفال — والثالث الإظهار في البقية من أحرف وسمها شفوية |
| `ghunnah_mushaddadah` | غنة النون والميم المشددتين | أحكام الغنة | تحفة الأطفال — وغن نونا ثم ميما شددا وسم كلا حرف غنة بدا |
| `lam_shamsiyyah` | لام أل الشمسية (إدغام) | أحكام لام أل ولام الفعل | تحفة الأطفال — للام أل حالان قبل الأحرف أولاهما إظهارها... ثانيهما إدغامها في أربع |
| `lam_qamariyyah` | لام أل القمرية (إظهار) | أحكام لام أل ولام الفعل | تحفة الأطفال — أولاهما إظهارها فلتعرف قبل اربع مع عشرة خذ علمه من ابغ حجك وخف عقيمه |
| `qalqalah_sughra` | قلقلة صغرى | أحكام القلقلة | الجزرية — وبَيِّنَنْ مُقَلْقَلاً إِنْ سَكَنَا وَإِنْ يَكُنْ فِي الْوَقْفِ كَانَ أَبْيَنَا |
| `qalqalah_kubra` | قلقلة كبرى | أحكام القلقلة | الجزرية — وَإِنْ يَكُنْ فِي الْوَقْفِ كَانَ أَبْيَنَا |
| `madd_tabii` | مد طبيعي (أصلي) | أحكام المدود | تحفة الأطفال — والمد أصلي وفرعي له وسم أولا طبيعيا وهو ما لا توقف له على سبب |
| `madd_muttasil` | مد واجب متصل | أحكام المدود | تحفة الأطفال — فواجب إن جاء همز بعد مد في كلمة وذا بمتصل يعد |
| `madd_munfasil` | مد جائز منفصل | أحكام المدود | تحفة الأطفال — وجائز مد وقصر إن فصل كل بكلمة وهذا المنفصل |
| `madd_aridh_lis_sukun` | مد عارض للسكون | أحكام المدود | تحفة الأطفال — ومثل ذا إن عرض السكون وقفا كتعلمون نستعين |
| `madd_lazim_kalimi_muthaqqal` | مد لازم كلمي مثقل | أحكام المدود | تحفة الأطفال — فإن بكلمة سكون اجتمع مع حرف مد فهو كلمي وقع كلاهما مثقل إن أدغما |
| `tafkheem_isti_la` | تفخيم حروف الاستعلاء | أحكام التفخيم والترقيق | الجزرية — وحرف الاستعلاء فخم واخصصا الإطباق أقوى نحو قال والعصا |

---

## 4. Acoustic Evidence Thresholds & Verification Policies

### Calibrated Safety Thresholds
| Parameter | Threshold Value | Enforcement Action if Breached |
| :--- | :--- | :--- |
| `MIN_CONFIDENCE` | `0.90` (90%) | Degrades decision status to `INCONCLUSIVE` |
| `MIN_MARGIN_PEAK` | `0.80` (80%) | Degrades decision status to `INCONCLUSIVE` |
| `MIN_SNR_DB` | `10.0 dB` | Degrades decision status to `INCONCLUSIVE` |
| `IS_AMBIGUOUS` | `false` | If `true`, strictly forces `INCONCLUSIVE` |

### Deterministic Decision Matrix

```
If Riwayah != HAFS_AN_ASIM
   └──> THROW RuleEvaluationBlockedError (RIWAYAH_NOT_ACTIVATED)

If Quran/KB Hash Tampered
   └──> THROW TajweedKnowledgeBaseIntegrityError (TAJWEED_KB_INTEGRITY_MISMATCH)

If No Specific Classical Rule Applies
   └──> Return NO_SPECIFIC_TAJWEED_RULE (NOT_ACTIVE, NOT_VERIFIED)

If Rule Category == MADD
   └──> Return INCONCLUSIVE (ERR-TAJ-001: Sub-frame tempo calibration unavailable)

If Rule Category == GHUNNAH
   └──> Return INCONCLUSIVE (ERR-TAJ-002: Nasal cavity acoustic resonance unavailable)

If Rule Category == TAFKHEEM_ISTILA
   └──> Return INCONCLUSIVE (ERR-TAJ-003: Formant pharyngealization tracking unavailable)

If Rule Category == QALQALAH
   └──> Return INCONCLUSIVE (ERR-TAJ-004: Transient burst acoustic detector unavailable)

If Phase 5A Evidence Status == INCONCLUSIVE or UNCERTAIN
   └──> Return INCONCLUSIVE (INCONCLUSIVE_PROPAGATED_FROM_PHASE5A)

If Confidence < 0.90 OR Margin < 0.80 OR SNR < 10.0 dB OR isAmbiguous
   └──> Return INCONCLUSIVE (EVIDENCE_BELOW_SAFETY_THRESHOLDS)

If Observed Token Matches Expected Canonical Token
   └──> Return SUPPORTED (HIGH_CONFIDENCE_MATCH)

If Observed Token Disagrees with Expected Canonical Token
   └──> Return NOT_SUPPORTED (HIGH_CONFIDENCE_SUBSTITUTION)
```

---

## 5. Explicit Scientific Limitations & Error Registry

As documented in `docs/ERROR_REGISTRY.md`:

1. **`ERR-TAJ-001` (Madd Timing Safety)**:
   The Zipformer2-CTC temporal resolution is bounded by 40ms frame hops. Using CTC token counts or duration frames as a proxy for Madd length (2, 4, 5, 6 Harakat) is scientifically invalid. The engine returns `INCONCLUSIVE` until sub-frame tempo-normalized vocalic mora tracking is implemented.
2. **`ERR-TAJ-002` (Ghunnah Resonance Safety)**:
   Acoustic phoneme classification detects phonetic label identity (`n`, `m`), but cannot measure oral vs. nasal sound pressure ratio or prolonged resonance quality. The engine returns `INCONCLUSIVE` rather than guessing nasal resonance.
3. **`ERR-TAJ-003` (Articulation & Formants Safety)**:
   Evaluating Tafkheem and Isti'la requires tracking F1/F2 formant trajectories and tongue-root retraction. Standard CTC output does not extract formants; the engine returns `INCONCLUSIVE`.
4. **`ERR-TAJ-004` (Qalqalah Release Burst Safety)**:
   Qalqalah requires detecting a 5–20ms unvoiced closure followed by an audible release burst. A 40ms acoustic model cannot resolve burst transients without a specialized detector; the engine returns `INCONCLUSIVE`.
5. **`ERR-TAJ-005` (Riwayah Governance Lock)**:
   Non-Hafs recitations (Warsh, Qalun, etc.) are strictly blocked to prevent cross-riwayah confusion.
6. **`ERR-TAJ-006` (Teacher AI Immutability Contract)**:
   All rule evidence emitted by `ITajweedEvidenceProvider` is deeply frozen with `Object.freeze()`. Downstream LLMs have read-only access.

---

## 6. Verification & Test Suite Summary

The test suite in `src/tests/Phase5bTajweedRuleMapping.test.ts` executes **82 comprehensive tests**, validating:
- All 20 mandatory requirement scenarios (Sections 1-20, 23)
- 13 Golden Tajweed rule logic benchmarks (Section 18)
- 4 Audio edge cases (Section 19: silence, noise, deletions, ambiguous alignments)
- 45 Anti-Condemnation linguistic checks (Section 20: 0 occurrences of religious condemnation words)
- 100-run bit-for-bit deterministic repeatability

```
TEST SUMMARY:
  Total Executed: 82
  Passed:         82
  Failed:         0
  Deterministic:  100%
  Result:         VERIFIED GREEN
```
