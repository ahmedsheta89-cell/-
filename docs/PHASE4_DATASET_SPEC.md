# مواصفات ومخطط قاعدة بيانات التلاوة القرآنية المرجعية (المرحلة الرابعة)
# Phase 4: Quranic Recitation Acoustic Dataset Specification & Annotation Strategy

**مشروع:** معلّم القرآن الرقمي الذكي — Quran Teacher AI  
**المرحلة:** Phase 4 — Acoustic Ground Truth Dataset Specification  
**الحالة:** معتمدة كمرجع تصميمي (Approved Specification)  
**التاريخ:** سبتمبر 2026

---

## 1. المبدأ المنهجي التأسيسي (Fundamental Scientific Principle)

> **قاعدة حاسمة:** **توليد الشروح والوسوم عبر الذكاء الاصطناعي لا يُعد بأي حال من الأحوال حقيقة علمية مطلقة (AI Annotation $\neq$ Ground Truth)**.
> 
> لا يجوز تدريب أو قياس دقة نموذج التلاوة القرآنية بالاعتماد على مخرجات نماذج آلية أخرى غير موثقة بشرياً. المرجع الحقيقي الوحيد المعتمد للتحكيم والتصحيح هو **التوثيق البشري المزدوج من شيوخ مجازين بالقراءات المتواترة بالسند المتصل**.

---

## 2. مخطط البيانات المعياري (Dataset Record Schema)

كل تسجيل صوتي في قاعدة البيانات المرجعية يخضع للمخطط الشامل التالي (JSON / Parquet Schema):

```typescript
export interface RecitationDatasetRecord {
  // معرفات التسجيل والقارئ
  audioId: string;                     // UUID فريد لكل مقطع صوتي (مثال: "rec_7f8a9b2c-1234")
  readerId: string;                    // معرف القارئ المشفر لحماية الخصوصية (مثال: "rdr_usr_9041")
  readerMetadata: {
    ageGroup: 'CHILD' | 'ADOLESCENT' | 'ADULT' | 'SENIOR'; // الشريحة العمرية
    gender: 'MALE' | 'FEMALE';
    nativeDialect: string;              // اللهجة الأم (مثال: "EGYPTIAN", "GULF", "LEVANTINE", "NON_ARABIC_URDU")
    recitationExperience: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'CERTIFIED_MUJAZ';
    pitchClassHz?: number;              // التردد الأساسي التقريبي لصوت القارئ (F0 Mean)
  };

  // الموضع القرآني والرواية
  riwayah: 'HAFS_AN_ASIM' | 'WARSH_AN_NAFI' | 'QALOON_AN_NAFI'; // الرواية القرآنية
  surahId: number;                     // رقم السورة (1 إلى 114)
  ayahId: number;                      // رقم الآية
  wordId?: number;                     // ترتيب الكلمة داخل الآية (إذا كان التسجيل لكلمة مفردة)
  quranTextUthmani: string;            // النص القرآني المعتمد بالرسم العثماني
  expectedPhoneticSequence: string[];  // سلسلة الفونيمات القرآنية المتوقعة

  // بيئة التسجيل والمواصفات الصوتية
  recordingCondition: 'STUDIO_CLEAN' | 'QUIET_ROOM' | 'NOISY_BACKGROUND' | 'FAR_FIELD' | 'LOW_SNR';
  microphone: {
    deviceCategory: 'BUILTIN_PHONE' | 'BUILTIN_LAPTOP' | 'HEADSET' | 'STUDIO_CONDENSER';
    modelName?: string;
  };
  sampleRate: 16000 | 44100 | 48000;  // معدل العينات الأصلي بالهرتز
  bitDepth: 16 | 24 | 32;             // عمق العينات (Bit Depth)
  channels: 1;                        // صوت أحادي نقي (Mono)
  durationMs: number;                 // مدة التسجيل الإجمالية بالمللي ثانية
  audioFileSha256: string;            // التوقيع الرقمي للملف لمنع أي تعديل أو تلف

  // الشروح والتدقيق التجويدي (Ground Truth Annotations)
  annotation: {
    speechSegments: Array<{
      startMs: number;
      endMs: number;
      type: 'RECITATION' | 'BREATH' | 'PAUSE' | 'COUGH_ARTIFACT';
    }>;
    wordBoundaries: Array<{
      wordIndex: number;
      wordText: string;
      startMs: number;
      endMs: number;
      isOmitted: boolean;             // هل أُسقطت الكلمة تماماً أثناء التلاوة؟
      isSubstituted: boolean;         // هل أُبدلت بكلمة أخرى؟
      substitutedText?: string;
    }>;
    phonemeBoundaries: Array<{
      phonemeIndex: number;
      symbol: string;
      startMs: number;
      endMs: number;
      isAccurate: boolean;
    }>;
    tajweedAnnotations: Array<{
      ruleId: string;                 // مثل: "IDGHAM_GHUNNAH", "IKHFA_HAQIQI", "MADD_MUTTASIL"
      wordIndex: number;
      expectedDurationHarakah?: number;
      observedDurationHarakah?: number;
      isFulfilled: boolean;
      errorSeverity?: 'LAHN_JALI' | 'LAHN_KHAFI' | 'NONE';
      tajweedDescriptionArabic: string;
    }>;
  };

  // المراجعة العلمية وتوثيق الإجازة
  review: {
    primaryReviewer: {
      reviewerId: string;
      certificationLevel: 'MUJAZ_TEN_QIRAAT' | 'MUJAZ_HAFS' | 'TAJWEED_SCHOLAR';
      approvalTimestamp: string;
    };
    secondaryReviewer?: {
      reviewerId: string;
      certificationLevel: 'MUJAZ_TEN_QIRAAT' | 'MUJAZ_HAFS' | 'TAJWEED_SCHOLAR';
      approvalTimestamp: string;
    };
    conflictResolution?: {
      arbitratorId: string;
      notesArabic: string;
      finalDecisionDate: string;
    };
    reviewStatus: 'PENDING_REVIEW' | 'SINGLE_APPROVED' | 'CONSENSUS_CERTIFIED' | 'REJECTED';
  };

  // الترخيص والخصوصية
  license: 'CC-BY-NC-SA-4.0-QURANIC-RESEARCH' | 'OPEN_ACADEMIC_RESTRICTED';
  consent: {
    hasInformedConsent: boolean;        // موافقة صريحة وموقعة من القارئ
    allowsAcousticResearch: boolean;   // السماح بالاستخدام في تدريب المحاذي الصوتي
    anonymizationVerified: boolean;    // التأكد من حجب أي بيانات شخصية تدل على الهوية
  };
}
```

---

## 3. مسار توثيق وتدقيق البيانات الذهبية (Golden Dataset Annotation Workflow)

لضمان أعلى معايير النزاهة العلمية، تم تصميم مسار متعدد المراحل لا يقبل أي تنازل:

```
                      ┌─────────────────────────────────┐
                      │    Raw Recitation Recording     │
                      │  (Verified Audio & Metadata)    │
                      └────────────────┬────────────────┘
                                       │
                                       ▼
                      ┌─────────────────────────────────┐
                      │    Stage 1: Pre-Segmentation    │
                      │ (Semi-automated Praat Alignment)│
                      └────────────────┬────────────────┘
                                       │
                                       ▼
                      ┌─────────────────────────────────┐
                      │  Stage 2: Primary Expert Review │
                      │  (Certified Tajweed Sheikh 1)   │
                      │ - Verifies word boundaries      │
                      │ - Labels Lahn Jali & Khafi      │
                      └────────────────┬────────────────┘
                                       │
                                       ▼
                      ┌─────────────────────────────────┐
                      │ Stage 3: Blind Secondary Review │
                      │  (Certified Tajweed Sheikh 2)   │
                      │ Independent verification audit  │
                      └────────────────┬────────────────┘
                                       │
                         ┌─────────────┴─────────────┐
                         │ Agreement Check (Kappa>0.9)
                         ▼                           ▼
                 [Full Consensus]            [Discrepancy / Split]
                         │                           │
                         │                           ▼
                         │               ┌───────────────────────┐
                         │               │ Stage 4: Arbitration  │
                         │               │ Senior Sanad Committee│
                         │               └───────────┬───────────┘
                         │                           │
                         └─────────────┬─────────────┘
                                       │
                                       ▼
                      ┌─────────────────────────────────┐
                      │     CERTIFIED GOLDEN DATASET    │
                      │   (Frozen & Digitally Signed)   │
                      └─────────────────────────────────┘
```

### معايير حسم الخلاف بين المحكمين:
- في حال اختلف المحكّم الأول مع الثاني في اعتبار مد معين ناقصاً (لحن خفي بمقدار نصف حركة مثلاً):
  1. يُرفع المقطع للجنة التحكيم المكونة من ثلاثة مشايخ مجازين بالقراءات العشر.
  2. إذا تعذر الإجماع على الخطأ، يُلزم المبدأ الشرعي والتقني باعتبار الحالة **`INCONCLUSIVE` (تُسقط الشبهة عن القارئ)**، ولا تُدرج كخطأ قطعي في البيانات الذهبية.

---

## 4. خطة توزيع العينات وتنوعها (Dataset Diversity & Partitions)

لضمان متانة النموذج الصوتي في العالم الحقيقي، تنقسم قاعدة البيانات إلى 5 حزم تخصصية:

| الحزمة (Partition) | النسبة | المواصفات والأهداف الصوتية |
|---|---|---|
| **حزمة الإتقان المرجعي (Reference Clean)** | 25% | تسجيلات عالية النقاء بأصوات مشايخ مجازين متقنين للرواية (لتدريب الحدود الزمنية المثالية وقوالب الفونيمات). |
| **حزمة الطلاب المتنوعة (Student Heterogeneous)** | 35% | تسجيلات لطلاب من مختلف الأقطار (عرب، عجم، آسيا، إفريقيا) لإكساب النموذج مناعة ضد اختلاف اللهجات في غير القرآن. |
| **حزمة الأطفال والناشئة (Children & Youth)** | 15% | تسجيلات لأطفال (6 - 14 سنة) يتميزون بترددات أساسية حادة (High F0) ونبرات صوتية خاصة لاختبار مرونة النموذج. |
| **حزمة الأخطاء المجدولة (Cataloged Errors)** | 15% | تسجيلات تحوي أخطاء متعمدة وموثقة: لحن جلي (إبدال، إسقاط، تحريك ساكن) ولحن خفي (ترك الغنة، قصر المد اللازم) لاختبار كاشف الأخطاء. |
| **حزمة التحدي الصوتي والضجيج (Stress & Noise)** | 10% | تسجيلات مصحوبة بضوضاء حقيقية (غرفة معيشة، أجهزة تكييف، هواتف رخيصة) لاختبار سياسة الثقة والتحول الاحتياطي (Fallback). |

---

## 5. ميثاق الخصوصية وأخلاقيات البحث (Ethics & Governance Protocol)

1. **الموافقة المستنيرة المسبقة (Informed Consent):** كل مشارك يقدم تسجيله يوقع إلكترونياً على موافقة صريحة ومفصلة تسمح باستخدام صوته في تدريب وتطوير أنظمة الذكاء الاصطناعي لخدمة القرآن الكريم.
2. **الحجب التام للهوية (Strict Anonymization):** تُفصل الأسماء الحقيقية وعناوين البريد وأرقام الهواتف فصلاً تاماً عن الملفات الصوتية، وتُمنح معرفات مشفرة لا رجعة فيها (One-way Hash IDs).
3. **عدم الاستغلال التجاري المجحف:** ترخص قاعدة البيانات البحثية برخصة غير تجارية (Non-Commercial Research License) لحماية كلام الله تعالى من المتاجرة غير الأخلاقية.
