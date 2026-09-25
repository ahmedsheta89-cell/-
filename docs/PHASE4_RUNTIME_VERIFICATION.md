# Phase 4 — Runtime Reality Verification & Adversarial Audit
## تقرير التحقق الميداني والتدقيق الصوتي المعاكس للمرحلة الرابعة
### Conformer-CTC + Constrained Viterbi + Real Audio Reality Check

**تاريخ التدقيق**: 2026-09-19  
**صفة المدقق**: Senior Speech ML Engineer + ONNX Runtime Engineer + Audio DSP Engineer + Quran Recitation Systems Auditor + Adversarial QA Engineer  
**المشروع**: Quran Teacher AI — معلّم القرآن الرقمي  

---

### 1. الحكم النهائي للمدقق (Executive Verdict)

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                          FINAL CLASSIFICATION VERDICT:                               ║
║                                                                                      ║
║                 [ C — ACOUSTIC POC / PARTIAL IMPLEMENTATION ]                        ║
║                                                                                      ║
║  • CONFORMER_RUNTIME       : NOT_IMPLEMENTED (No ONNX/ORT artifact in repository)    ║
║  • ACOUSTIC_POSTERIORS     : MOCKED (Synthetic Gaussian progression formula)         ║
║  • ONNX RUNTIME WEB        : NOT_IMPLEMENTED (Missing from dependencies)             ║
║  • WEB WORKER / WASM SIMD  : NOT_IMPLEMENTED (Zero worker scripts in src/)           ║
║  • MEL SPECTROGRAM (DSP)   : REAL (Pure TypeScript 80-band filterbank, verified)     ║
║  • CONSTRAINED VITERBI     : REAL (Mathematically verified log-domain trellis)       ║
║  • PHASE 3 SAFETY FALLBACK : REAL & ACTIVE (Graceful fallback on silence/uncertainty)║
║  • REAL ACOUSTIC DATASET   : BLOCKED BY DATASET (No licensed audio corpus in repo)   ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

---

### 2. البحث الفعلي عن ملف النموذج (Actual Model Artifact Check)

تم إجراء مسح شامل لجميع مجلدات المشروع للبحث عن ملفات النماذج العصبية الثنائية (`*.onnx`, `*.ort`, `*.pb`, `*.bin`, `*.tflite`):

- **MODEL FILE**: غير موجود (None)
- **PATH**: غير موجود (None)
- **SIZE**: 0 بايت
- **FORMAT**: غير متوفر
- **QUANTIZATION**: غير متوفر
- **INPUT TENSOR**: غير متوفر
- **OUTPUT TENSOR**: غير متوفر
- **الحكم الملزم**:
  ```
  CONFORMER_RUNTIME = NOT_IMPLEMENTED
  ```
  لا يوجد أي ملف نموذج Conformer-CTC مدمج داخل المستودع. الكلاس `AcousticAlignmentEngine` يحتوي على هيكلية تنسيقية ومحاكاة حسابية، لكنه لا يستدعي شبكة عصبية حقيقية.

---

### 3. تدقيق مكتبة ONNX Runtime وبيئة التشغيل

فحص ملف الاعتماديات الأساسي `package.json`:
- حزمة `onnxruntime-web`: **غير موجودة** (غير مدرجة في `dependencies` أو `devDependencies`).
- فئات الاستدلال `InferenceSession`, `InferenceSession.create()`, `session.run()`: **غير موجودة وغير مستوردة مطلقاً في أي ملف كود**.
- مزود التشغيل (Execution Provider): **`NONE`**.
- المسار الفعلي المنفذ في الكود:
  $$\text{PCM Audio} \longrightarrow \text{MelSpectrogramExtractor (DSP)} \longrightarrow \text{Gaussian Formula (Simulation)} \longrightarrow \text{Viterbi Trellis}$$
  وليس:
  $$\text{PCM Audio} \longrightarrow \text{Feature Tensor} \longrightarrow \text{ONNX Session} \longrightarrow \text{Model Output Tensor}$$

---

### 4. تتبع مسار الاستدلال الفعلي (Actual Inference Path Tracing)

| الخطوة (Transition) | الملف والوظيفة (File & Function) | المدخلات (Input) | المخرجات (Output) | الحالة الفعلية (Status) |
| :--- | :--- | :--- | :--- | :--- |
| **Microphone $\to$ PCM** | `src/infrastructure/audio/AudioRecorder.ts` | Web Audio API Microphone Stream | `Float32Array` (16kHz PCM) | **`REAL`** |
| **PCM $\to$ MelSpectrogram** | `src/application/recitation/acoustic/MelSpectrogramExtractor.ts::extract` | `Float32Array` (PCM 16kHz) | `Float32Array[]` [T, 80] | **`REAL`** (Pure TS DSP) |
| **Mel $\to$ Tensor** | غير موجودة | `Float32Array[]` | Tensor object | **`NOT_IMPLEMENTED`** |
| **Tensor $\to$ Conformer ONNX** | غير موجودة | Tensor `[1, T, 80]` | Session inference | **`NOT_IMPLEMENTED`** |
| **Conformer $\to$ CTC Logits** | `src/application/recitation/acoustic/AcousticAlignmentEngine.ts::generateAcousticPosteriors` | Mel frames + expected phonemes | `Array<Record<string, number>>` | **`MOCKED`** (Gaussian simulation) |
| **CTC Posteriors $\to$ Viterbi** | `src/application/recitation/acoustic/ConstrainedViterbiAligner.ts::align` | Posteriors + Target phonemes | Viterbi Trellis matrix in log-domain | **`REAL`** (Mathematical DP) |
| **Viterbi $\to$ Phoneme Alignment**| `ConstrainedViterbiAligner.ts` (Grouping & Backtrace) | Viterbi path [T] | `PhonemeObservation[]` | **`REAL`** (Algorithm working on mock input) |
| **Phoneme $\to$ Word Alignment** | `ConstrainedViterbiAligner.ts` (Aggregation) | `PhonemeObservation[]` + Word Mapping | `wordBoundaries[]` | **`REAL`** |

---

### 5. التحقق الحرج من مخرجات نموذج CTC (CTC Output Reality Check)

عند فحص دالة `generateAcousticPosteriors` في الملف `src/application/recitation/acoustic/AcousticAlignmentEngine.ts` (السطور 131–168):
```typescript
// الكود الفعلي الموجود في المحرك:
const expectedPhonemeIdx = Math.min(numPhonemes - 1, Math.floor((t / (numFrames || 1)) * numPhonemes));

for (let k = 0; k < numPhonemes; k++) {
  const tok = targetPhonemes[k];
  const dist = Math.abs(k - expectedPhonemeIdx);
  const gaussianWeight = Math.exp(-(dist * dist) / 6.0);
  const prob = Math.min(0.95, Math.max(0.02, 0.15 + 0.8 * gaussianWeight));
  frameDist[tok.phonemeId] = Number(prob.toFixed(3));
}
```

**الأدلة القاطعة على المحاكاة الصورية (Mocked CTC Output):**
1. **أبعاد المخرجات (Output Dimensions)**: ليست مصفوفة موحدة الأبعاد بتوزيع احتمالي على كامل معجم الفونيمات $[T, V]$، بل قائمة كائنات متغيرة المفاتيح `Array<Record<string, number>>` تقتصر فقط على فونيمات الكلمات المتوقعة.
2. **رمز الفراغ (Blank Token)**: نموذج CTC العصبي الحقيقي يتطلب حتماً رمز فراغ `<blank>` (غالباً في المؤشر 0 أو $V-1$) للفصل بين الحروف المتكررة وتفريغ الصمت؛ في الكود الحالي **رمز الفراغ غير معرف أو مأخوذ بالاعتبار في مصفوفة فيتربي**.
3. **الاحتمالات**: ليست لوغاريتمات ناتجة عن طبقة Softmax لنموذج عصبي، بل ناتجة عن معادلة غاوسية رياضية تعتمد حصرياً على نسبة التقدم الزمني للإطار داخل التسجيل:
   $$\text{dist} = \left| k - \left( \frac{t}{T} \times K \right) \right|$$
   $$\text{prob} = 0.15 + 0.8 \times \exp\left( -\frac{\text{dist}^2}{6.0} \right)$$
4. **الحكم**:
   ```
   CTC_POSTERIORS = MOCKED
   ```

---

### 6. التحقق من Web Worker وتعدد المسارات (Worker Verification)

- تم مسح مجلد `src/` للبحث عن أي ملفات Worker (`*.worker.ts`, `Worker`, `postMessage`):
  **النتيجة**: لم يتم العثور على أي ملف Worker.
- الاستدلال الصوتي بالكامل يتم استدعاؤه على الخيط الرئيسي (Main Thread) بالتزامن.
- **الحكم**:
  ```
  WORKER = NOT_IMPLEMENTED
  ```

---

### 7. التحقق من تسريع العتاد WASM / SIMD

- بما أن `onnxruntime-web` غير مثبتة، فلا يوجد تهيئة أو تفعيل لـ WebAssembly SIMD أو Multi-threading.
- **مزود التشغيل (Execution Provider)**:
  ```
  Execution Provider: NONE / NOT_IMPLEMENTED
  ```

---

### 8. تدقيق معالج طيف الميل الصوتي (Mel Spectrogram DSP Audit)

تم اختبار الفئة `MelSpectrogramExtractor` حسابياً ومختبرياً عبر إشارة PCM حقيقية بتردد 16000 هرتز لمدة ثانية كاملة:

- **حجم النافذة (Window Size)**: 512 عينة (32ms عند 16kHz) بنافذة هانينج (Hann Window).
- **القافز الزمني (Hop Size)**: 160 عينة (10ms بين كل إطارين).
- **عدد حزم الميل (Mel Filterbanks)**: 80 حزمة ترددية متوازية على نطاق 0 إلى 8000 هرتز.
- **فحص القيم الشاذة (Numerical Sanity)**:
  - قيم `NaN`: **0 (معدومة)**.
  - قيم `Infinity`: **0 (معدومة)**.
  - نطاق طاقة السجل اللوغاريتمي: من `-13.82` (قاع الاستقرار العددي $\epsilon = 10^{-6}$) إلى `+2.07`.
- **الحكم**: **`REAL DSP IMPLEMENTATION`** (خوارزمية معالجة إشارة صحيحة وسليمة حسابياً).

---

### 9. تدقيق فهرس الفونيمات القرآنية (Phoneme Inventory Audit)

تم توثيق التدقيق الكامل في الملف المستقل: `docs/PHASE4_PHONEME_AUDIT.md`.
أهم النتائج:
1. **الحالة العلمية**: `ENGINEERED / NEEDS SCHOLAR + PHONETIC REVIEW`.
2. **العدد الفعلي**: 38 صوتاً معرفاً في الكود (وليس 42 كما ذُكر في التقارير النظرية السابقة).
3. **خلل الاشتقاق التجويدي (Critical Defect)**: دالة `wordToPhonemes()` تحذف علامات التشكيل والحركات عبر Regex، وبالتالي **تستبعد الحركات القصيرة (فتحة، ضمة، كسرة) والمدود التجويدية وأحكام الغنة من سلسلة فيتربي الصوتية**، مما يحصر فضاء البحث في الصوامت فقط، ويعجز عن رصد اللحن الجلي في الحركات الإعرابية.

---

### 10. التدقيق الرياضي لخوارزمية فيتربي المقيدة (Constrained Viterbi Audit)

تم فحص الفئة `ConstrainedViterbiAligner` من الناحية الرياضية والخوارزمية:
- **مصفوفة Trellis**: مبنية في المجال اللوغاريتمي `dp[t][k]` مع معاقبة الانتقالات المستحيلة بالقيمة $-10^9$.
- **الانتقالات المقيدة**: مسموح فقط بالبقاء على نفس الفونيم ($k \to k$) أو التقدم للفونيم التالي مباشرة ($k-1 \to k$). لا يُسمح بالقفز أو التراجع.
- **التتبع العكسي (Backtracking)**: خوارزمية صحيحة تتبع المؤشرات الخلفية من $dp[T-1][K-1]$ إلى $t=0$.
- **حساسية الخوارزمية للأدلة الصوتية**:
  - عند تغذية الخوارزمية بأدلة متطابقة مع التتابع القرآني: كانت النتيجة `0.436` (محاذاة ناجحة دون تراجع).
  - عند تغذيتها بأدلة معاكسة تماماً (الأدلة الصوتية تتناقض مع ترتيب الآية): انهار المجموع إلى `0.092`، وتفعل التراجع الإلزامي فوراً `isFallbackRequired = true`.
- **الحكم**: **`REAL ALGORITHM`** (خوارزمية فيتربي حقيقية ورياضية، وتستجيب بدقة لما يُغذى إليها من احتمالات).

---

### 11. التجربة المعاكسة الكبرى: ثبات النص وتغير الصوت (Adversarial Test — Same Text Constraint)

تم تطبيق تجربة قياس حساسية المحرك الفعلي للصوت الحقيقي:
- **المدخل أ (Audio A)**: نغمة صوتية متناسقة تشبه التردد البشري (Speech-like Harmonic Tone).
- **المدخل ب (Audio B)**: ضوضاء بيضاء عشوائية عالية الشدة (Pure White Noise).
- **المدخل ج (Audio C)**: صمت مطلق (Zero PCM).
- **النص القرآني الموحد لجميع التجارب**: سورة الفاتحة `["بِسْمِ", "اللَّهِ", "الرَّحْمَٰنِ", "الرَّحِيمِ"]`.

#### نتائج القياس الميداني:

| نوع الإشارة الصوتية | النمط المفعل (Engine Mode) | درجة الثقة (Confidence) | الدرجة الصوتية (Acoustic Score) | الملاحظة والنتيجة |
| :--- | :--- | :--- | :--- | :--- |
| **Audio A (Harmonic Tone)** | `ACOUSTIC_VITERBI` | `MEDIUM` | **`0.543`** | ناتج عن المحاكاة الغاوسية الزمنية |
| **Audio B (White Noise)** | `ACOUSTIC_VITERBI` | `MEDIUM` | **`0.543`** | **نفس الدرجة تماماً (فارق 0.000)** |
| **Audio C (Complete Silence)** | `FALLBACK_HEURISTIC_TIER1`| `LOW` | **`0.020`** | انهار بسبب فحص عتبة طاقة الصوت (RMS < 0.008) |

#### التحليل الهندسي للنتيجة:
الفارق الصوتي بين كلام بشري وضوضاء بيضاء عشوائية هو **`0.000`**!
هذا الدليل الرياضي القاطع يثبت بما لا يدع مجالاً للشك أن دالة الاحتمالات الصوتية `generateAcousticPosteriors` لا تحلل المحتوى الطيفي لترددات الفونيمات القرآنية إطلاقاً، وإنما تكتفي بالتحقق من وجود طاقة عامة ($RMS \ge 0.008$) ثم ترسم منحنى غاوسي يعتمد فقط على مؤشر الزمن $t$.

---

### 12. اختبار الصمت (Silence Test)

- **المدخل**: صمت تام ممتد (Zeroed Float32Array).
- **النتيجة المسجلة**:
  - `EngineMode`: `FALLBACK_HEURISTIC_TIER1`
  - `AverageAcousticScore`: `0.02`
  - `OverallConfidence`: `LOW`
  - `isUncertain`: `true` لجميع الكلمات.
- **الحكم**: نجاح تام في اختبار الصمت؛ المحرك لا يعطي أي ثقة وهمية أو تقييم إيجابي عند غياب الصوت.

---

### 13. اختبار الكلام العربي العشوائي أو الخاطئ (Random Speech Test)

- نظراً لاعتماد المحرك الحالي على المنحنى الغاوسي المعتمد على الزمن $t$، فإن أي كلام عربي عشوائي أو قراءة لآية مختلفة أو حتى حديث بلغة أجنبية طالما كانت طاقته أعلى من $0.008$ سيحصل على نفس الدرجة التقريبية (~`0.54`) ويتم فرضه داخل شبكة فيتربي قسراً!
- **هذا خلل بنيوي يمنع تصنيف المحرك كنموذج صوتي حقيقي حتى يتم دمج نموذج Conformer-CTC حقيقي**.

---

### 14. اختبار التلاوات الحقيقية الصحيحة مقابل الخاطئة (Correct vs. Incorrect Recitation Test)

- **حالة قاعدة البيانات الصوتية الحقيقية**:
  ```
  REAL ACOUSTIC VALIDATION = BLOCKED BY DATASET
  ```
  المشروع لا يحتوي حالياً على تسجيلات صوتية استوديو مرخصة وموسومة يدوياً لمقارنة الحالات الست المطلوبة (Correct, Omission, Repetition, Substitution, Pause, Noise).
- **تصنيف الـ Benchmark السابق**:
  تم تصنيفه كـ **`ENGINEERING SANITY CHECK`**، ولا يجوز علمياً ادعاء أي نسبة دقة عامة (General Accuracy).

---

### 15. إلغاء وتصحيح ادعاء "صفر هلوسة" (No Zero Hallucination Claim)

تم تنقيح جميع ملفات الكود والتوثيق والتعليقات، واستبدال أي عبارة "Zero Generative Hallucination" بالصيغة العلمية الدقيقة الإلزامية:
> «The constrained decoder cannot generate arbitrary Quran text outside the permitted search space, but this does not imply zero recognition/alignment errors.»

---

### 16. مصفوفة التحقق الشاملة: الحقيقي مقابل الصوري (Real vs. Mocked Matrix)

| المكون (Component) | الحالة الميدانية (Status) | الدليل البرمجي والملفات (Code & Runtime Evidence) |
| :--- | :--- | :--- |
| **Mel Spectrogram Extractor** | **`REAL`** | `MelSpectrogramExtractor.ts`: كود DSP كامل برياضيات Hann و DFT و 80-Mel filterbank، تم اختباره والتأكد من انعدام NaN/Inf. |
| **Constrained Viterbi Trellis** | **`REAL`** | `ConstrainedViterbiAligner.ts`: مصفوفة DP كاملة في المجال اللوغاريتمي مع التراجع العكسي، وحساسة للأدلة. |
| **Quran Phoneme Inventory** | **`PARTIAL`** | `QuranPhonemeLexicon.ts`: 38 رمزاً، يحذف التشكيل والمدود في الترجمة الفعلية، يحتاج تدقيق لجان الإجازة. |
| **Conformer-CTC ONNX Model** | **`NOT_IMPLEMENTED`** | لا يوجد أي ملف `.onnx` أو `.ort` في مستودع المشروع بأكمله. |
| **ONNX Runtime Web / WASM** | **`NOT_IMPLEMENTED`** | غير مدرج في `package.json` ولا توجد فئات `InferenceSession`. |
| **Off-thread Web Worker** | **`NOT_IMPLEMENTED`** | لا يوجد أي ملف worker في `src/`. |
| **Acoustic Posterior Modeling** | **`MOCKED`** | `AcousticAlignmentEngine.ts::generateAcousticPosteriors`: معادلة غاوسية محاكية لا تفرق بين كلام بشري وضوضاء. |
| **Phase 3 Fallback Safety** | **`REAL`** | تفعيل فوري لنمط `FALLBACK_HEURISTIC_TIER1` بوسم `LOW` عند انخفاض RMS أو الشك الصوتي. |
| **Dataset Benchmark** | **`NOT_VALIDATED`** | لا توجد تسجيلات حقيقية مرخصة للتحقق العلمي الكامل. |

---

### 17. تقرير انحدار الاختبارات من المرحلة 1 إلى 4 (Phase 1–4 Regression)

تم تنفيذ فحص التحقق الكامل عبر تشغيل مصفوفة الاختبارات الآلية الشاملة (`npm test`):
- **Phase 1 & 2 (المعمارية الشرعية، 114 سورة، التجويد، والتشفير)**: 37 اختباراً ناجحاً.
- **Phase 3 (جودة الصوت، VAD، الخصوصية، المعايرة، وفصل الاختصاصات)**: 30 اختباراً ناجحاً.
- **Phase 4 (استخلاص الميـل، مصفوفة فيتربي، الفحوصات المعاكسة، وتدقيق الواقع)**: 8 اختبارات ناجحة.
- **الإجمالي الكلي**: **75 اختباراً ناجحاً / 75 (100% نجاح، صفر إخفاقات)**، مع تضمين الفحوصات المعاكسة التي تثبت حقيقة النظام دون أي تمويه.

---

### 18. المعوقات والمتطلبات العلمية المتبقية (Blockers & Future Milestones)

1. **توفير ملف النموذج العصبي المكمم (`quran_conformer_ctc_int8.onnx`)**: تدريب أو تصدير نموذج Conformer-CTC مخصص لمخارج الحروف الفصحى وأحكام التلاوة بحجم مكمم لا يتجاوز 25-35 ميجابايت.
2. **تثبيت مكتبة `onnxruntime-web` وتفعيل مسار Web Worker**: نقل معالجة التنسورات وحساب اللوغاريتمات خارج الـ Main Thread باستخدام تقنيات WASM/SIMD.
3. **تطوير محرك G2P (Grapheme-to-Phoneme) التجويدي**: الحفاظ على التشكيل، استخراج حركات المدود (2، 4، 6 حركات)، وتوليد رموز الغنن المشروطة قبل إدخالها في شبكة فيتربي.
4. **توفير حزمة بيانات حقيقية مرخصة (Licensed Multi-Speaker Quran Dataset)**: تشمل تلاوات لقراء معتمدين وحالات لحن جلي وخفي مقصودة لإجراء التقييم العلمي الصارم (Scientific Benchmark).
