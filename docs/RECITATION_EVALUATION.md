# Recitation Evaluation & Benchmark Framework
## إطار تقييم ومعايرة محرك الاستماع القرآني

### 1. معايير القياس (Evaluation Metrics)
1. **Alignment Error Rate (AER)**:
   - نسبة الكلمات التي وُضعت في فواصل زمنية غير صحيحة مقارنة بتحديد الشيوخ والمصححين.
2. **Word Boundary Error (WBE)**:
   - متوسط الخطأ الزمني بالملي ثانية بين البداية الحقيقية للكلمة والبداية المقدرة من المحرك.
3. **False Positive Rate (FPR - نسبة التخطئة الكاذبة)**:
   - أخطر مقياس تربوي: نسبة تخطئة الطالب في حين كانت قراءته صحيحة. يجب أن تكون < 1%.
4. **False Negative Rate (FNR - نسبة تفويت الخطأ)**:
   - نسبة مرور خطأ جلي دون تنبيه. يجب أن تكون < 2% في اللحن الجلي.
5. **Real-Time Factor (RTF)**:
   - زمن المعالجة / مدة الصوت. المستهدف < 0.20.

---

### 2. هيكل البيانات المرجعي (Evaluation Dataset Schema)
يتم ربط كل عينة مرجعية بهوية واضحة وتدقيق موثق:
```json
{
  "datasetId": "golden-recitation-v1",
  "version": "1.0.0",
  "samples": [
    {
      "sampleId": "fatihah-clean-01",
      "surahNumber": 1,
      "ayahNumber": 1,
      "riwayah": "HAFS_AN_ASIM",
      "expectedTextUthmani": "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
      "audioDurationMs": 4200,
      "expertAnnotation": {
        "annotatorScholar": "لجنة التدقيق الصوتي المرجعي",
        "actualWordErrors": [],
        "expectedWordBoundariesMs": [
          { "wordIndex": 1, "startMs": 150, "endMs": 850 },
          { "wordIndex": 2, "startMs": 900, "endMs": 1750 },
          { "wordIndex": 3, "startMs": 1800, "endMs": 2800 },
          { "wordIndex": 4, "startMs": 2850, "endMs": 4100 }
        ]
      }
    }
  ]
}
```

---

### 3. سيناريوهات الاختبار الذهبية (Golden Test Suite)
- **T1: Clean Speech**: تلاوة متأنية واضحة بنسبة نقاء عالية -> يجب تحقيق Aligned بنسبة > 90%.
- **T2: Total Silence / Muted**: ميكروفون مغلق -> يرفض التحليل برمز `UNUSABLE / SIGNAL_TOO_LOW`.
- **T3: High Noise Floor**: ضوضاء حادة -> رفض أو تخفيض الثقة إلى `LOW / UNKNOWN`.
- **T4: Clipping Distorted**: تشويه مفرط في الإشارة -> تنبيه الطالب بخفض الحساسية.
- **T5: Word Substitution (Lahn Jali)**: إبدال كلمة بأخرى -> رصد `SUBSTITUTION` ورفعه إلى `LAHN_JALI` ذي الأولوية العالية.
- **T6: Skipped Word**: قفز كلمة -> رصد `DELETION` وطلب إعادة الكلمة.
- **T7: Ambiguous Signal**: إشارة غير واضحة -> الامتناع عن إصدار حكم وإرجاء التصويب.
