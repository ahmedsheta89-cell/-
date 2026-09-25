# سياسة التحقق العلمي والشرعي لنظام معلّم القرآن الرقمي
## Scientific Verification & Religious Data Governance

---

### 1. المبادئ الشرعية والتقنية الحاكمة (Guiding Principles)
1. **القرآن الكريم وحي معصوم محفوظ**:
   - لا مجال للاجتهاد البرمجي في نص القرآن الكريم، أو حركاته، أو علامات وقفه، أو رسمه العثماني.
   - النموذج اللغوي التوليدي (LLM) ليس مرجعًا علميًا ولا فقيهًا ولا قارئًا مجازًا، ولا يجوز اعتماده كمصدر توثيق للآيات.

2. **عزل النص القرآني عن التوليد الآلي (Isolation Principle)**:
   - يُمنع برمجيًا منعًا باتًا السماح لأي خدمة ذكاء اصطناعي بتوليد آيات، أو إكمال آيات ناقصة في قاعدة البيانات، أو صياغة آيات بديلة.
   - جميع نصوص المصحف الشريف تُستجلب حصريًا من نسخ موثقة ومعتمدة من مجمعات طباعة المصحف الشريف المعترف بها (مثل مجمع الملك فهد لطباعة المصحف الشريف).

3. **سلسلة التحقيق والتوثيق (Verification Provenance)**:
   - كل سجل بيانات قرآني أو حكم تجويدي يجب أن يحمل وسم التحقق `ContentVerification`:
     ```typescript
     interface ContentVerification {
       source: string;              // e.g., "King Fahd Quran Complex - Madinah Mushaf"
       editionVersion: string;      // e.g., "v2.1.0-hafs"
       riwayah: RiwayahType;        // e.g., "HAFS_AN_ASIM"
       tareeq: string;              // e.g., "Shatibiyyah"
       verificationStatus: VerificationStatus; // VERIFIED | PENDING_REVIEW | REJECTED
       verifiedBy: string;          // Identifier of qualified human reviewer
       verifiedAt: string;          // ISO Timestamp
       checksumSha256: string;      // Immutable cryptographic hash of payload
     }
     ```

4. **سياسة عدم التخطئة الجازمة مع انخفاض الثقة (The Humility Principle)**:
   - في حال كانت جودة الصوت غير كافية، أو درجة ثقة نموذج التعرف الصوتي دون الحد الآمن (High Confidence):
     - يُحظر على النظام إصدار حكم جازم بأن الطالب أخطأ أو لحن في القرآن.
     - يتحول النظام تلقائيًا إلى وضع: "اطلب إعادة القراءة للتأكد" أو "لم يتضح الصوت جيدًا، أعد الآية رعاك الله".

5. **استقلال الروايات القرآنية (Riwayah Independence)**:
   - كل رواية وقراءة هي منظومة مستقلة بفرشها وأصولها ورسمها، ولا يجوز خلط أحكام رواية بأخرى.
   - يبدأ النظام برواية **حفص عن عاصم من طريق الشاطبية**، ومصمم هندسيًا ليستوعب رواية **ورش عن نافع** و**قالون عن نافع** و**الدوري عن أبي عمرو** دون تغيير في المعمارية.
