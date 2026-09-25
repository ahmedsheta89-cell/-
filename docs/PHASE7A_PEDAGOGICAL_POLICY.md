# PHASE 7A: PEDAGOGICAL POLICY SPECIFICATION
## Student-Centered Escalation, Modes, and Feedback Norms

---

## 1. Classical Quranic Pedagogy (Talaqqi & Musyafahah)

The pedagogical policy aligns artificial intelligence behavior with the time-tested norms of traditional Quranic recitation instruction (*Talaqqi wa Musyafahah*):

1. **Gentle Gradualism (*Al-Tadarruj*)**:
   - A student making an error on their first attempt should not be confronted with an exhaustive technical critique or micro-phonetic breakdown.
   - The initial response must always be a gentle signal to re-try (*Request Repeat*).
2. **Locational Precision Only Upon Need**:
   - If the student repeats the mistake on attempt 2, the teacher narrows focus to the specific word or letter (*Highlight Position*).
3. **Teacher Guidance Before Frustration**:
   - On attempt 3, the teacher leads by example (*Guided Repeat*), rather than leaving the student to flounder.
4. **Knowledge Before Deferral**:
   - On attempt 4, the teacher briefly explains the anatomical articulation point (*Pause & Explain*).
5. **Scholarly Deferral (*Al-Ihalah ila al-Shaykh*)**:
   - On attempt 5, if discrepancy persists, the software recognizes its algorithmic limitations and directs the student to a certified human instructor (*Defer to Teacher*).

---

## 2. Pedagogical Escalation Ladder (Levels 0 – 5)

| Level | Name | Trigger Condition | Teacher Action | Pedagogical Prompt (Arabic) |
| :--- | :--- | :--- | :--- | :--- |
| **0** | Silent Continue | Clean match, high confidence | `CONTINUE` | (Silent / No interruption) |
| **0** | Praise & Continue | Milestone completion | `PRAISE_AND_CONTINUE` | "ممتاز، أحسنت النطق. تابع التلاوة." |
| **1** | Short Indication | Attempt 1 phonetic error | `REQUEST_REPEAT` | "جرّب الكلمة دي مرة تانية." |
| **2** | Specific Location | Attempt 2 identical error | `HIGHLIGHT_POSITION` | "راجع نطق الحرف هنا مرة تانية." |
| **3** | Guided Repetition | Attempt 3 identical error | `START_GUIDED_REPEAT` | "اسمع المثال وركز في النطق، ثم أعد." |
| **4** | Pause & Explain | Attempt 4 identical error | `PAUSE_AND_EXPLAIN` | "المخرج الصحيح لهذا الحرف يتطلب انتباهًا، راجع الشرح." |
| **5** | Defer to Teacher | Attempt 5+ persistent error | `DEFER_TO_TEACHER` | "يُفضل مراجعة هذا الموضع مع معلم مجاز." |

---

## 3. Learning Modes and Pedagogical Specialization

### 1. Memorization Mode (`MEMORIZATION`)
- **Primary Focus**: Ayah sequence, word omission, and verbal recall.
- **Interruption Behavior**: Immediate, gentle halt upon verified word omission or sequence error. The learner must not continue reciting an inverted or truncated verse.
- **Granularity**: Word-level by default.

### 2. Revision Mode (`REVISION`)
- **Primary Focus**: Fluency and retention across long passages.
- **Interruption Behavior**: Interruption is restrained. Discrepancies are queued in `reviewCandidates` to be reviewed at the end of the quarter or surah.

### 3. Tajweed Practice Mode (`TAJWEED_PRACTICE`)
- **Primary Focus**: Precision of phonetic rules and articulation.
- **Acoustic Limitation Handling**: Uncalibrated acoustic features (Madd duration, Ghunnah nasalance, Qalqalah transient) trigger `MARK_FOR_REVIEW`, rather than silent continuation, allowing dedicated asynchronous review without false accusations.

### 4. Free Recitation Mode (`FREE_RECITATION`)
- **Primary Focus**: Spiritual presence and continuous flow (*Tilawah*).
- **Interruption Behavior**: Real-time interruptions are strictly disabled (`shouldInterrupt = false`). All feedback is presented in a post-recitation review summary.

---

## 4. Multi-Error Aggregation & Anti-Overload Policy

When an acoustic segment contains multiple simultaneous discrepancies (e.g. 2 or 3 phonemes mispronounced in the same word):
- The engine aggregates them into `HIGHLIGHT_WORD` with word-level granularity.
- The student is never presented with a rapid-fire list of 3 separate phonetic failure notices for a single word.
- This prevents cognitive overload and anxiety, ensuring a supportive educational experience.
