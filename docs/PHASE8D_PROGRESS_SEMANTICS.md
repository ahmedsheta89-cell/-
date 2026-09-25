# PHASE 8D — PROGRESS & PEDAGOGICAL SEMANTICS SPECIFICATION

## Strict Religious, Pedagogical, and Technical Invariants

### 1. Pedagogical Memorization States (Phase 7D State Machine)

Every ayah or passage in the student's memorization journey resides in exactly one deterministic state.

| State Key | Arabic Label | Technical Meaning | Permitted UI Description | Prohibited Descriptions |
| :--- | :--- | :--- | :--- | :--- |
| `NOT_STARTED` | لم يبدأ بعد | No recorded practice attempts | آيات لم تبدأ تلاوتها أو حفظها بعد في البرنامج | "آيات مهملة", "معدومة" |
| `INTRODUCED` | تم البدء (تقديم أولي) | 1 practice attempt recorded | تم الاستماع للتلاوة للمرة الأولى | "محفوظة مبدئيًا" |
| `LEARNING` | قيد التعلّم | Active attempts, consolidating | مرحلة التلقي والتكرار لترسيخ الآيات | "نصف إتقان" |
| `PRACTICING` | مرحلة التمرين | Multiple sessions, improving | تكرار وتثبيت بإشراف المعلم | "قريب من الحفظ التام" |
| `STABLE` | مستقر في الحفظ | Consistently confirmed across clusters | استقرار مرحلي معتاد للتلاوة الحالية | "حفظ لا يُنسى" |
| `REVIEW_DUE` | مستحق للمراجعة | Scheduled interval elapsed | حان موعد تعاهد الآيات للمحافظة عليها | "نسيان الحفظ", "ضياع الآيات" |
| `WEAKENING` | يحتاج تثبيتًا | Declining recent accuracy | تذبذب في الاسترجاع يستوجب المراجعة اللطيفة | "فشل الحفظ", "تردّي المستوى" |
| `NEEDS_REINFORCEMENT` | يحتاج تصحيحًا ومتابعة | Confirmed recurring errors | موضع يحتاج تركيزًا خاصًا لتصحيح الخطأ وتثبيته | "خطأ فادح", "آيات غير مقبولة" |
| `MASTERED` | إتقان مرحلي (جدولة متباعدة) | Longest spaced repetition interval reached | **حالة جدولية تربوية**: ثبات الاسترجاع على فترات متباعدة | **إجازة بالسند**, **شهادة إتقان شرعية**, **إتقان مطلق** |

#### Crucial Invariant: The "MASTERED" Rule
- The UI MUST explicitly display the helper note:
  *«الإتقان هنا هو تصنيف تربوي وجدولة متباعدة للمراجعة، ولا يمثل إجازة شرعية أو تصديقًا إسناديًا مطلقًا»*.
- Automatic Ijazah or religious qualification is strictly banned.

---

### 2. Evidence Status Presentation Rules

Recitation signals come from Phase 5C and Phase 7A. The UI must never convert inconclusive acoustic signals into accusations or failures.

| Evidence Status | Internal Code | User-Facing Arabic Phrasing | Pedagogical Meaning |
| :--- | :--- | :--- | :--- |
| `CONFIRMED` | `CONFIRMED` | **موضع يحتاج إلى عناية وتصحيح** | تم رصد الخطأ بوضوح وصوت نقي مطابق للمعايير |
| `POSSIBLE` | `POSSIBLE` | **ملاحظة محتملة تحتاج إلى مراجعة وتثبّت** | احتمال وجود لحن خفي أو عدم ضبط، يُفضّل إعادة التلاوة |
| `INCONCLUSIVE` | `INCONCLUSIVE` | **لم تكن الإشارة الصوتية كافية للحكم، جرّب مرة أخرى** | ضوضاء، تقطع صوت، أو انخفاض في الميكروفون؛ لا يؤثر سلبًا على الحفظ |
| `NO_EVIDENCE` | `NO_EVIDENCE` | **لا توجد بيانات مسجلة بعد** | لم يتم التسميع بعد |

**Prohibited UI Phrases**:
- ❌ *"أنت أخطأت"* (when inconclusive)
- ❌ *"حرام" / "باطل" / "تأثم على هذا"* (religious legal judgments are strictly forbidden)
- ❌ *"صلاتك باطلة"*

---

### 3. Revision Urgency Semantic Hierarchy

Derived from Phase 7D Revision Scheduler:

1. **`CRITICAL_WEAKNESS` (أولوية قصوى - موضع ضعف مؤكد)**:
   - Ayah with confirmed recurring errors or immediate post-correction review needed.
   - Action: *«ابدأ بمراجعة هذا الموضع أولاً»*.
2. **`REVIEW_OVERDUE` (مراجعة متأخرة)**:
   - Review window has elapsed past threshold.
   - Action: *«مستحقة منذ أيام، يُستحب تعاهدها اليوم»*.
3. **`REVIEW_DUE` (مستحقة اليوم)**:
   - Review interval matured for today's session.
   - Action: *«مقرر مراجعتها اليوم»*.
4. **`REVIEW_SOON` (مراجعة قادمة قريباً)**:
   - Review will mature within 24–48 hours.
   - Action: *«مستقرة حالياً، مراجعتها قريبة»*.
5. **`NO_REVIEW_REQUIRED` (مستقر - لا تتطلب مراجعة حالية)**:
   - Scheduled for future interval.
   - Action: *«حفظ مستقر بحسب الجدولة»*.

---

### 4. Non-Gamified Scientific Progress Philosophy

- **No "XP", "Streaks", or "Levels"**: The Quran is an act of worship and sacred learning. It must not be turned into an addictive casino loop.
- **Dignified Metrics**:
  - عدد الآيات التي تم تعاهدها (Reviewed Ayat count)
  - الآيات المتقنة مرحلياً (Pedagogically consolidated Ayat)
  - المواضع التي تحتاج عناية وتكرار (Reinforcement focal points)
  - انتظام الجلسات (Session consistency over days/weeks without punitive streak breaks)
