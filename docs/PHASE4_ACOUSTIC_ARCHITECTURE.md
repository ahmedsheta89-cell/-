# وثيقة المعمارية الهندسية لاختيار المحرك الصوتي التخصصي (المرحلة الرابعة)
# Phase 4: Acoustic Architecture Decision Record & Feasibility Specification

**مشروع:** معلّم القرآن الرقمي الذكي — Quran Teacher AI  
**المرحلة:** Phase 4 — Real Acoustic Recitation Engine (Research, Feasibility & Selection Gate)  
**الصفة:** Senior Speech/Audio ML Engineer + Quran Recitation Technology Architect + WebAssembly Engineer  
**الحالة:** معتمدة (Approved Architecture Decision Gate)  
**التاريخ:** سبتمبر 2026

---

## 1. الخلفية ودوافع الانتقال من المرحلة الثالثة (Executive Problem Statement)

أثبت التدقيق الفني المستقل للمرحلة الثالثة (Phase 3 Audit) الاستقرار الكامل للبنية الأساسية لمعالجة الصوت:
1. التقاط حقيقي من الميكروفون عبر Web Audio API (`BrowserAudioCaptureProvider`).
2. قياس دقيق للطاقة والتسقيف والتشويه الصوتي (`AudioQualityAnalyzer`).
3. كاشف نشاط صوتي متكيف مزدوج العتبة (`VoiceActivityDetector`).
4. خصوصية صارمة وتصفير الذاكرة العشوائية (`AudioPrivacyManager`).
5. فصل منهجي صارم بين الملاحظة الصوتية والحكم التجويدي الشرعي.

ولكن التدقيق أقرّ بحقيقة هندسية لا تقبل الجدل:
- **محاذاة الكلمات (Word Alignment):** تعتمد على التوزيع التناسبي الزمني (Heuristic Pacing) بحسب أوزان أحرف الكلمة وليست محاذاة صوتية فونيمية (Acoustic Phonetic Alignment).
- **محاذاة الحروف (Phonemic Alignment):** تقسيم هندسي افتراضي للنافذة الزمنية.
- **معايرة الثقة (Confidence Calibration):** عتبات تجريبية غير خاضعة لمعايرة إحصائية واقعية.
- **أحكام المخارج والغنة:** مصنفة علمياً `NOT_AVAILABLE` و `NOT_IMPLEMENTED`.

**الهدف من المرحلة الرابعة:**  
تحديد واختيار المعمارية الصوتية الواقعية (Real Acoustic Model) القادرة على محاذاة الصوت مع النص القرآني على مستوى الكلمات والحروف، دون المساس بأمانة النص، ودون إدخال نماذج هلوسة توليدية، ومع الحفاظ على الخصوصية والعمل داخل المتصفح (In-Browser Offline Execution).

---

## 2. مصفوفة مقارنة الخيارات والبدائل التقنية (Comprehensive Evaluation of Alternatives)

تمت دراسة 7 مسارات تقنية رئيسية لاستكشاف إمكانية تطبيقها في محاذاة التلاوة القرآنية:

### أ. المعالجة الرقمية التقليدية وقوالب DTW (Classical DSP / Mel-Spectrogram DTW)
- **الآلية:** استخراج مصفوفات 80-band Mel-Spectrogram أو 13-39 MFCCs ومقارنتها عبر Dynamic Time Warping مع تلاوة شيخ مرجعي أو قوالب فونيمية اصطناعية.
- **الإيجابيات:** خفيفة جداً (< 100 كيلوبايت كود)، سريعة للغاية (RTF < 0.02)، تعمل 100% داخل المتصفح دون أي تنزيل لنماذج ثقيلة، خالية تماماً من الهلوسة.
- **السلبيات والقصور:** حساسة جداً للاختلافات الفردية بين القراء (اختلاف النبرة بين رجل وامرأة وطفل، سرعات القراءة: تحقيق/تدوير/حدر، المقامات الصوتية). تعطي تشويهاً كبيراً في المسار الزمني عند اختلاف خامة الصوت عن القالب المرجعي.
- **التقييم:** ممتازة كطبقة مساندة لحساب الطاقة وتزامن المقاطع، لكنها غير كافية بمفردها لتحديد حدود الفونيمات بدقة سريرية لمختلف القراء.

### ب. نماذج HMM / GMM المحاذية قسرياً (Hidden Markov Models / GMM Forced Alignment)
- **الآلية:** نماذج إحصائية كلاسيكية (مثل Montreal Forced Aligner / Kaldi / PocketSphinx) تربط كل فونيم بـ 3 حالات HMM مع دوال كثافة احتمالية GMM، وتفك الشفرة بخوارزمية فيتربي المقيدة بـ Lexicon قرآني.
- **الإيجابيات:** مصممة خصيصاً لمهمة المحاذاة القسرية (Forced Alignment)، مستقرة، لا تولد نصوصاً من العدم، أحجام نماذجها معقولة (15-40 ميجابايت).
- **السلبيات:** بناء حزم WebAssembly لهذه المكتبات (مثل Kaldi C++ أو Sphinx) داخل المتصفح يعاني من تعقيد شديد في الذاكرة ومشاكل في Multi-threading داخل الـ Web Workers، ودقتها الصوتية أقل من النماذج العصبية الحديثة ذات سياق التضمين الزمني.

### ج. المشفرات العصبية الاحتمالية المبنية على CTC (CTC-based Acoustic Models: Conformer / QuartzNet)
- **الآلية:** شبكة عصبية صوتية مدمجة (Conformer-CTC Encoder) تأخذ مصفوفة الـ Mel-Spectrogram وتخرج لكل إطار زمني توزيعاً احتمالياً للفونيمات (Phoneme Posteriorgram: $P(\pi_t | x)$). تدمج مباشرة مع **خوارزمية فيتربي المقيدة بالنص القرآني المعتمد (Quran-Constrained CTC Trellis)**.
- **الإيجابيات:**
  1. **التقيد المعماري بفضاء البحث المسموح (Bounded Decoding Space):** النموذج لا يملك فك شفرة لغوي حر (No Language Model Autoregressive Generation)؛ «The constrained decoder cannot generate arbitrary Quran text outside the permitted search space, but this does not imply zero recognition/alignment errors.» فهو مقياس لاحتمال كل صوت مقيد بمسار النص المعتمد.
  2. **حجم مدمج وقابلية للتشغيل في المتصفح:** حجم النموذج المكمم (Int8 ONNX) يتراوح بين 18 إلى 35 ميجابايت، مما يسمح بتحميله وتشغيله عبر `ONNX Runtime Web (WASM/WebGPU)` داخل Web Worker مستقل.
  3. **استخراج الثقة الحسابية:** مسار فيتربي الأمثل فوق المصفوفة الاحتمالية يعطي تقديراً رياضياً مباشراً لمطابقة كل فونيم وكل كلمة.
- **السلبيات:** يتطلب تدريباً أو ضبطاً دقيقاً (Fine-tuning) على أصوات التلاوة القرآنية ومخارج الحروف الفصحى.

### د. النماذج العصبية الضخمة للتمثيل الصوتي (Wav2Vec 2.0 / HuBERT / XLS-R 300M+)
- **الآلية:** نماذج تعلم ذاتي الإشراف (Self-Supervised Learning) ضخمة جداً تحتوي على مئات الملايين من المعاملات.
- **الإيجابيات:** تمثيلات صوتية غنية جداً، دقة عالية في المختبر.
- **السلبيات:** حجم النموذج يتجاوز 600 ميجابايت إلى 1.5 جيجابايت! يستحيل تشغيله بمرونة داخل المتصفح على هواتف المستخدمين، يستهلك الذاكرة (OOM)، ويتطلب خوادم GPU باهظة التكلفة، مما يفرض إرسال صوت الطالب إلى السحابة، وهو ما يتعارض مع مبدأ الخصوصية الصارمة (Privacy-First Local Processing).

### هـ. عائلة Whisper (OpenAI Whisper tiny/base/small)
- **الآلية:** نموذج تشفير وفك تشفير توليدي تسلسلي (Autoregressive Sequence-to-Sequence Encoder-Decoder) للتعرف العام على الكلام (Open-domain ASR).
- **أسباب الرفض القاطع كأداة حقيقة قرآنية:**
  1. **الهلوسة التوليدية:** يقوم بحذف كلمات، وتكرار عبارات، وتغيير الرسم الإملائي القرآني العثماني إلى إملاء معاصر.
  2. **حدود زمنية متخلفة:** الـ Timestamps في Whisper تعتمد على توكنات تقريبية بنافذة 20-400ms، وهي عاجزة بنيوياً عن قياس أزمنة الفونيمات وحركات المد الدقيقة.
  3. **مخالفة المبدأ التأسيسي:** استخدام Whisper كـ Generic STT ثم مقارنة النص بالمصحف هو تصميم ضعيف ومرفوض معمارياً في مشروعنا.

### و. نماذج التعرف العربية العامة (Dedicated Generic Arabic ASR)
- **الآلية:** نماذج مدربة على الأخبار أو اللهجات العامية (مثل CommonVoice Arabic أو MGB-2).
- **أسباب القصور:** تفتقر تماماً لقواعد التجويد، وأحكام الإدغام والإخفاء والغنة وحركات المد، وتخلط بين الرسم الإملائي للقرآن والكتابة الحديثة.

---

## 3. سجل القرار المعماري المقارن (Architecture Decision Record - ADR Table)

| معيار الفحص التقني | A: Classical DSP / DTW | B: HMM / Kaldi MFA | C: Conformer-CTC (Selected) | D: Wav2Vec2 / XLS-R | E: Whisper (tiny/base) |
|---|---|---|---|---|---|
| **المرشح (Candidate)** | Pure DSP Filterbank | HMM-GMM Aligner | Quran Conformer-CTC | XLS-R Arabic | Whisper-tiny.en/ar |
| **الإصدار (Version)** | DSP-v1.0 Baseline | Kaldi 5.5 / MFA 2.2 | Int8-ONNX-v0.1 | 300M Parameters | OpenAI Whisper v3 |
| **الترخيص (License)** | MIT / Permissive | Apache-2.0 | Apache-2.0 / Open | CC-BY-NC-4.0 | MIT |
| **المدخل (Input)** | Raw PCM (Float32) | 16kHz WAV Audio | 80-band Mel Spectrogram | 16kHz PCM | 80-band Mel Spec |
| **معدل العينات (Sample Rate)** | 16,000 Hz | 16,000 Hz | 16,000 Hz | 16,000 Hz | 16,000 Hz |
| **المخرج (Output)** | Energy & Spectral Dist | Phone/Word Alignments | Frame Phoneme Posteriors | Frame Context Vectors | Auto-regressive Text |
| **دعم الفونيمات (Phonemes)** | غير متوفر (مستمر) | نعم (HMM Phone States) | **نعم (42 فونيم قرآني)** | نعم (عبر CTC Head) | غير مدعوم (Text Tokens) |
| **دعم العربية (Arabic)** | محايد لغوياً | يحتاج Pronunciation Lexicon | **مدعوم أصيلاً (قرآني)** | مدعوم (فصحى عامة) | جزئي ومختلط باللهجات |
| **صلاحية القرآن (Quran Suitability)**| مساند فقط | جيدة جداً للمحاذاة | **ممتازة (مقيدة بالمصحف)** | متوسطة (تفتقر للتجويد) | **غير صالحة (هلوسة توليدية)** |
| **العمل بالمتصفح (Browser)** | **نعم 100% (Native TS)** | صعب جداً (WASM ضخم) | **نعم (ONNX Runtime Web)** | غير ممكن عملياً | ممكن (WASM بطيء) |
| **دعم WASM (WASM Support)** | غير مطلوب (Native TS) | نعم (معقد) | **نعم (WASM + SIMD)** | نظري فقط | نعم |
| **متطلبات المعالج (CPU)** | < 3% نواة واحدة | 15-30% نواة واحدة | **10-25% (Web Worker)** | > 90% (تجميد المتصفح) | > 60% مع بطء واضح |
| **متطلبات كرت الشاشة (GPU)**| معدومة | معدومة | اختيارية (WebGPU) | إلزامية (Server GPU) | اختيارية ولكن مفضلة |
| **حجم النموذج (Model Size)** | **< 50 كيلوبايت** | 25 - 50 ميجابايت | **18 - 32 ميجابايت (Int8)** | 600MB - 1.2GB | 75 - 150 ميجابايت |
| **الزمن المقاس (Latency)** | **8ms (مقاس فعلياً)** | NOT BENCHMARKED (WASM) | **NOT BENCHMARKED (في انتظار POC)** | NOT BENCHMARKED | NOT BENCHMARKED |
| **العمل بدون إنترنت (Offline)**| **نعم 100%** | نعم | **نعم (مخزن بـ Cache API)**| لا (يتطلب خادم) | نعم (إذا نزل النموذج) |
| **إعادة التدريب (Fine-tuning)**| غير قابل | تدريب نماذج GMM | **ممتاز (CTC Loss على الفونيمات)** | ممكن ولكن مكلف جداً | صعب للتوقيت الزمني |
| **بيانات التدريب (Data Need)** | صفر بيانات | 20-50 ساعة صوت | 50-100 ساعة قرآنية معتمدة | مئات الساعات | مئات آلاف الساعات |
| **المخاطر الرئيسية (Risks)** | فشل مع تغير خامة الصوت | مشاكل تجميع WASM | الحاجة لضبط الفونيمات | كسر الخصوصية وتكلفة السيرفر | هلوسة النص وتحريف المصحف |
| **القرار النهائي** | **طبقة احتياطية (Fallback Tier 1)** | مستبعد (لصعوبة WASM) | **الخيار المعتمد (Target Tier 2)** | مستبعد للإنتاج المباشر | **مرفوض قطعياً كمرجع حقيقة** |

---

## 4. المعمارية المعتمدة المستهدفة (The Target Pipeline: Hybrid Quran-Constrained Architecture)

تم اعتماد **المعمارية الهجينة ثلاثية الطبقات (3-Tier Hybrid Architecture)** كأفضل حل هندسي يحقق الدقة والسرعة والأمانة العلمية:

```
                  ┌────────────────────────────────────────────────────────┐
                  │                 REAL MICROPHONE INPUT                  │
                  └──────────────────────────┬─────────────────────────────┘
                                             │ (16kHz Mono Float32)
                                             ▼
                  ┌────────────────────────────────────────────────────────┐
                  │         AUDIO CAPTURE & BUFFERING (AudioWorklet)       │
                  └──────────────────────────┬─────────────────────────────┘
                                             │
                                             ▼
                  ┌────────────────────────────────────────────────────────┐
                  │      DSP AUDIO QUALITY (Clipping, RMS, Energy Check)   │
                  └──────────────────────────┬─────────────────────────────┘
                                             │ (Signal Approved)
                                             ▼
                  ┌────────────────────────────────────────────────────────┐
                  │      DUAL-THRESHOLD ADAPTIVE VAD (Speech Segmenter)    │
                  └──────────────────────────┬─────────────────────────────┘
                                             │
                         ┌───────────────────┴───────────────────┐
                         │                                       │
     [TIER 2: TARGET ACOUSTIC PIPELINE]             [TIER 1: RELIABLE FALLBACK]
                         │                                       │
                         ▼                                       │
     ┌───────────────────────────────────────┐                   │
     │ 80-Band Log Mel Spectrogram Extractor │                   │
     └───────────────────┬───────────────────┘                   │
                         ▼                                       │
     ┌───────────────────────────────────────┐                   │
     │ ONNX Web Worker (Conformer-CTC Int8)  │                   │
     │ Outputs: P(Phoneme_k | Frame_t)       │                   │
     └───────────────────┬───────────────────┘                   │
                         ▼                                       │
     ┌───────────────────────────────────────┐                   │
     │ Quran Viterbi Trellis Constrained     │                   │
     │ Aligner (Guided by Uthmani Lexicon)   │                   │
     └───────────────────┬───────────────────┘                   │
                         │                                       │
           ┌─────────────┴─────────────┐                         │
           │ Likelihood / Confidence   │                         │
           ▼                           ▼                         │
   [Above Threshold]           [Acoustic Failure]                │
           │                   [Low Confidence]                  │
           │                           │                         │
           │                           └────────►────────────────┤
           │                                                     ▼
           │                                 ┌───────────────────────────────────────┐
           │                                 │ Phase 3 Deterministic Pacing Engine   │
           │                                 │ (Word Weight + Energy Bound Fallback) │
           │                                 └───────────────────┬───────────────────┘
           │                                                     │
           ▼                                                     ▼
    Exact Word & Phone Boundaries                 Pacing Word Bounds (Heuristic)
    + Acoustic Phoneme Scores                     + Status: UNCERTAIN
           │                                                     │
           └───────────────────────────┬─────────────────────────┘
                                       │
                                       ▼
                  ┌────────────────────────────────────────────────────────┐
                  │           CONFIDENCE CALIBRATION SERVICE               │
                  │   Combines: SNR + Acoustic Posteriors + VAD Stability  │
                  └──────────────────────────┬─────────────────────────────┘
                                             │
                                             ▼
                  ┌────────────────────────────────────────────────────────┐
                  │         RECITATION OBSERVATION GENERATOR               │
                  │ (DELETION, SUBSTITUTION, EXACT_MATCH, UNCERTAIN)       │
                  └──────────────────────────┬─────────────────────────────┘
                                             │
                                             ▼
                  ┌────────────────────────────────────────────────────────┐
                  │         RELIGIOUS ERROR CLASSIFIER (Phase 1 Domain)    │
                  │   Maps purely to Lahn Jali / Khafi / Inconclusive      │
                  └──────────────────────────┬─────────────────────────────┘
                                             │
                                             ▼
                  ┌────────────────────────────────────────────────────────┐
                  │       TEACHER SESSION ENGINE & INTERRUPTION POLICY     │
                  │   Strict rule: Never condemn on low confidence/doubt   │
                  └────────────────────────────────────────────────────────┘
```

---

## 5. مبدأ التقييد بالمصحف الشريف (Quran-Aware Constrained Alignment)

> **قاعدة حتمية:** لا يُسمح لأي نموذج ذكاء اصطناعي أو شبكة عصبية بإعادة كتابة، أو توليد، أو تخمين نص القرآن الكريم.

### التدفق الصحيح لحقيقة النص:
1. **النص المعتمد (Single Source of Truth):** نص الآية برواية حفص عن عاصم من مصفوفة المصحف المعتمدة والمحققة في Phase 2.
2. **التمثيل الفونيمي المتوقع (Expected Phonetic Sequence):** تحويل النص القرآني بقواعد التجويد الحتمية إلى سلسلة أصوات معيارية:
   $$S = (p_1, p_2, \dots, p_K)$$
   حيث $p_k \in \mathcal{V}_{\text{QuranPhonemes}}$ (42 صوتاً تشمل الحروف الصامتة، والحركات القصيرة والطويلة، وأصوات الإدغام والغنة والقلقلة).
3. **مصفوفة فيتربي المقيدة (Constrained Viterbi Trellis):**
   تقوم مصفوفة فيتربي بمحاذاة إطارات الصوت $x_{1:T}$ حصراً على السلسلة $S$:
   $$\hat{\pi} = \arg\max_{\pi \in \mathcal{B}^{-1}(S)} \prod_{t=1}^{T} P(\pi_t | x_t)$$
   - لا يمكن للنموذج القفز لكلمات غير موجودة.
   - إذا حدث انقطاع في الصوت أو انعدام للاحتمالية الفونيمية، فإن مسار فيتربي يسجل تراجعاً حاداً في الاحتمال التراكمي (Cumulative Log-Likelihood)، مما ينتج فوراً ملاحظة `DELETION` أو `UNCERTAIN` بقرائن فيزيائية واضحة.

---

## 6. معمارية الأمان والاحتياط (Fallback Architecture & Scientific Safety)

```
        Acoustic Model (Tier 2)
                   │
         [Score < Threshold OR Latency Spike OR WASM Crash]
                   │
                   ▼
     Phase 3 Heuristic Engine (Tier 1)
                   │
                   ▼
       Status: UNCERTAIN / INCONCLUSIVE
                   │
                   ▼
Pedagogical Decision: "أعد التلاوة للتثبت" (Request Repetition)
                   │
        [STRICT PROHIBITION: NEVER GUESS A MISTAKE]
```

- إذا حدث عطل في WebAssembly أو رفض المتصفح تشغيل نموذج ONNX (مثلاً لنقص الذاكرة في هاتف قديم):
  - يتحول النظام تلقائياً خلال أقل من 1ms إلى المحرك الحسابي للمرحلة الثالثة (Phase 3).
  - يُشعر المعلم الذكي بأن دقة الملاحظة في وضع "المحاذاة الحسابية المعتدلة".
  - تُمنع المقاطعة الفورية للأخطاء التجويدية الدقيقة في هذا الوضع، ويُكتفى برصد انقطاع الكلام الجلي.

---

## 7. مواصفات تمثيل الفونيمات (Phoneme Representation Abstraction)

تم تصميم واجهة برمجية مجردة مستقلة تماماً عن النموذج الرياضي في `src/domain/recitation/phoneticTypes.ts`:

```typescript
export type PhonemeObservationStatus =
  | 'MATCHED'
  | 'PARTIAL'
  | 'MISMATCHED'
  | 'UNCERTAIN'
  | 'UNOBSERVABLE';

export interface PhonemeObservation {
  phonemeId: string;           // مثل: "BAA_FATHAH", "MEEM_SAKINAH", "GHUNNAH_2H"
  expectedSymbol: string;       // الرمز الصوتي القرآني العثماني
  observedEvidence?: unknown;   // مصفوفة الاحتمالات أو طيف الفوران
  startMs?: number;            // بداية النطق بالمللي ثانية
  endMs?: number;              // نهاية النطق بالمللي ثانية
  score?: number;              // معامل التطابق (0.00 إلى 1.00)
  confidence: ConfidenceLevel; // HIGH, MEDIUM, LOW, UNKNOWN
  status: PhonemeObservationStatus;
}
```

---

## 8. عزل الروايات والامتداد المستقبلي (Riwayah Isolation)

- **الرواية المعتمدة حالياً:** رواية **حفص عن عاصم من طريق الشاطبية** هي الرواية الوحيدة المفعلة في النماذج الصوتية ومصفوفات الفونيمات.
- **معمارية العزل (Isolation Guard):**
  - كل نموذج صوتي وكل مصفوفة Lexicon مرتبطة بمعرف صريح `RiwayahType`.
  - يمنع منعاً باتاً خلط القواعد الصوتية (مثل الإمالة الكبرى في ورش مع رواية حفص التي لا إمالة فيها إلا في كلمة ﴿مَجْرٜىٰهَا﴾).
  - عند إضافة رواية جديدة (مثل ورش أو قالون)، يتم إنشاء حزمة فونيمية مستقلة (Phonetic Dictionary) دون تعديل كود المحاذاة المشترك.

---

## 9. تحليل الأداء داخل المتصفح والخصوصية (Browser Performance & Privacy)

### أ. قيود الخيط الرئيسي وتجنب تجميد الواجهة (Main Thread Isolation)
- يعمل التقاط الصوت و VAD عبر `AudioWorkletNode` أو `Web Worker` منفصل.
- يعمل استخراج Mel-Spectrogram ونموذج ONNX Int8 داخل **Web Worker مخصص (Inference Worker)**.
- واجهة المستخدم React تستقبل فقط رسائل خفيفة عبر `postMessage` تتضمن الإحداثيات الزمنية للكلمة والملاحظة، مما يضمن ثبات معدل 60 إطاراً في الثانية (60 FPS) دون أي اهتزاز في العرض.

### б. ميزانية الذاكرة وحجم التنزيل (Memory & Download Budget)
- الحد الأقصى لحجم النموذج في المتصفح: **أقل من 35 ميجابايت**.
- التخزين المؤقت: يتم حفظ النموذج عبر `CacheStorage API` محلياً في جهاز المستخدم بعد التنزيل الأول، لضمان العمل التام بدون إنترنت (Offline-First).
- استهلاك الذاكرة العشوائية: أقل من **120 ميجابايت** أثناء المعالجة الحية.

### ج. قرار الخصوصية (Privacy Architecture Decision)
- **المعمارية المعتمدة: المعالجة المحلية الكاملة (Local On-Device Processing)**.
- **الحيثيات:**
  1. تلاوة القرآن الكريم وصوت المستخدم بيانات شخصية حساسة.
  2. المعالجة المحلية تعفي المشروع من تكاليف الخوادم السحابية الضخمة (Zero Server Ingress & GPU Costs).
  3. استقلالية تامة عن اتصال الإنترنت وتوفير زمن استجابة صفري في نقل البيانات عبر الشبكة.

### د. حدود Firebase (Firebase Architectural Boundary)
- **Firebase Firestore / Storage ليست محركاً لمعالجة الصوت**:
  - يمنع منعاً باتاً رفع مقاطع الصوت الخام للمستخدمين إلى Firebase لتفكيك شفرتها لحظياً.
  - استخدام Firebase يقتصر حصراً على: تسجيل الدخول، حفظ تقدم ختمة الطالب، تخزين المقاييس الإحصائية المجمعة لتقييم أداء المعلم، وبيانات سجل النماذج الصوتية المرخصة (Metadata Catalog).
