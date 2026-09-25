import React, { useState } from 'react';
import { LahnCategory, RecitationErrorType } from '../domain/errors/types.ts';
import { ConfidenceLevel, PedagogicalDecision, resolvePedagogicalDecision } from '../domain/confidence/types.ts';
import { AlertOctagon, HelpCircle, BookOpenCheck, ShieldAlert, Sparkles } from 'lucide-react';

interface ErrorEntry {
  type: RecitationErrorType;
  category: LahnCategory;
  nameArabic: string;
  exampleArabic: string;
  consequence: string;
}

const ERROR_TAXONOMY_CATALOG: ErrorEntry[] = [
  // اللحن الجلي
  {
    type: RecitationErrorType.HARAKAH_MISMATCH,
    category: LahnCategory.JALI,
    nameArabic: 'تغيير حركة إعرابية أو بنائية (Harakah Mismatch)',
    exampleArabic: 'قراءة "صِرَاطَ الَّذِينَ أَنْعَمْتُ عَلَيْهِمْ" بضم التاء بدل فتحها',
    consequence: 'إخلال بالمعنى وإسناد النعمة إلى غير الله؛ لحن جلي محرم بالإجماع تجب مقاطعته فورًا.',
  },
  {
    type: RecitationErrorType.LETTER_SUBSTITUTION,
    category: LahnCategory.JALI,
    nameArabic: 'استبدال حرف بآخر (Letter Substitution)',
    exampleArabic: 'قراءة "عَسَىٰ" بالصاد فتصير "عَصَىٰ"',
    consequence: 'تغيير جوهري للكلمة والمعنى من الرجاء إلى العصيان.',
  },
  {
    type: RecitationErrorType.LETTER_OMISSION,
    category: LahnCategory.JALI,
    nameArabic: 'حذف حرف أو كلمة (Letter Omission)',
    exampleArabic: 'حذف حرف مد مثل قراءة "قَالَ" كأنها "قَلْ"',
    consequence: 'نقص في مبنى الكلمة القرآنية.',
  },
  {
    type: RecitationErrorType.LETTER_ADDITION,
    category: LahnCategory.JALI,
    nameArabic: 'زيادة حرف أو تمطيط حركة (Letter Addition)',
    exampleArabic: 'تمطيط الضمة حتى تتولد واو في "كُنتُمْ"',
    consequence: 'إدخال ما ليس من القرآن في التلاوة.',
  },
  {
    type: RecitationErrorType.UNAUTHORIZED_STOP,
    category: LahnCategory.JALI,
    nameArabic: 'الوقف القبيح (Unauthorized Stop)',
    exampleArabic: 'الوقف على "لَا إِلَـٰهَ" دون إتمام "إِلَّا اللَّهُ"',
    consequence: 'إيهام معنى فاسد لا يليق بجلال الله تعالى.',
  },

  // اللحن الخفي
  {
    type: RecitationErrorType.MADD_DURATION_DEFECT,
    category: LahnCategory.KHAFI,
    nameArabic: 'خلل في مقادير المدود (Madd Duration Defect)',
    exampleArabic: 'قصر المد المتصل في "جَاءَ" عن 4 أو 5 حركات في رواية حفص',
    consequence: 'ترك لواجب الرواية وخلل بحسن الأداء والتلقي.',
  },
  {
    type: RecitationErrorType.GHUNNAH_DEFECT,
    category: LahnCategory.KHAFI,
    nameArabic: 'ترك الغنة أو بتر زمنها (Ghunnah Defect)',
    exampleArabic: 'ترك غنة النون والميم المشددتين أو الإخفاء',
    consequence: 'نقص في صفات الحروف اللازمة.',
  },
  {
    type: RecitationErrorType.QALQALAH_DEFECT,
    category: LahnCategory.KHAFI,
    nameArabic: 'ترك القلقلة أو إضعافها (Qalqalah Defect)',
    exampleArabic: 'كتم صوت القاف الساكنة في "الْفَلَقِ"',
    consequence: 'عدم بيان مخرج الحرف المقلقل عند سكونه.',
  },
  {
    type: RecitationErrorType.TAFKHEEM_TARQEEQ_DEFECT,
    category: LahnCategory.KHAFI,
    nameArabic: 'خلل التفخيم والترقيق (Tafkheem / Tarqeeq)',
    exampleArabic: 'تفخيم باء "بَاطِلًا" لمجاورتها للطاء المستعلية',
    consequence: 'تأثر الحرف المرقق بالمفخم المجاور دون فصل المراتب.',
  },
  {
    type: RecitationErrorType.IDGHAM_DEFECT,
    category: LahnCategory.KHAFI,
    nameArabic: 'خلل الإدغام والتمييز (Idgham Defect)',
    exampleArabic: 'إظهار النون الساكنة عند الياء في "مَن يَقُولُ"',
    consequence: 'مخالفة قواعد الدمج الصوتي المتواترة في الرواية.',
  },
  {
    type: RecitationErrorType.IKHFA_DEFECT,
    category: LahnCategory.KHAFI,
    nameArabic: 'خلل الإخفاء الحقيقي (Ikhfa Defect)',
    exampleArabic: 'إلصاق اللسان بالحنك الأعلى عند إخفاء النون عند الدال أو التاء',
    consequence: 'تحول الإخفاء إلى إظهار غير صحيح.',
  },
  {
    type: RecitationErrorType.IQLAB_DEFECT,
    category: LahnCategory.KHAFI,
    nameArabic: 'خلل الإقلاب (Iqlab Defect)',
    exampleArabic: 'عدم قلب النون ميمًا مخفاة مع الباء في "مِن بَعْدِ"',
    consequence: 'مخالفة حكم الإقلاب المجمع عليه.',
  },
];

export const ErrorTaxonomyView: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'ALL' | LahnCategory>('ALL');
  const [testConfidence, setTestConfidence] = useState<ConfidenceLevel>(ConfidenceLevel.HIGH);
  const [isLahnJaliChecked, setIsLahnJaliChecked] = useState(true);

  const filteredErrors =
    activeCategory === 'ALL'
      ? ERROR_TAXONOMY_CATALOG
      : ERROR_TAXONOMY_CATALOG.filter((e) => e.category === activeCategory);

  const resolvedDecision = resolvePedagogicalDecision(testConfidence, isLahnJaliChecked);

  return (
    <div className="space-y-8">
      {/* Confidence Model Interactive Matrix */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/80 shadow-xs space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-800 text-xs font-semibold mb-2 border border-stone-200">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
            مبدأ الورع والاحتياط (Humility & Non-False Condemnation)
          </div>
          <h2 className="text-xl font-bold text-stone-900 font-arabic-heading">
            مصفوفة الثقة والقرار التربوي (Confidence-Based Decision Matrix)
          </h2>
          <p className="text-xs text-stone-500 mt-1 max-w-3xl">
            التطبيق لا يتعامل أبدًا مع استنتاجات الذكاء الاصطناعي أو المحاذاة الصوتية على أنها حقائق مطلقة؛
            إذ يُمنع تخطئة قارئ القرآن بحكم قطعي جازم إلا عند ثبوت اليقين الإحصائي (High Confidence).
          </p>
        </div>

        {/* Confidence Simulator */}
        <div className="p-5 bg-stone-50 rounded-xl border border-stone-200 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                مستوى ثقة المحرك الصوتي (Confidence Level):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { level: ConfidenceLevel.HIGH, label: 'High (عالية)' },
                  { level: ConfidenceLevel.MEDIUM, label: 'Medium (متوسطة)' },
                  { level: ConfidenceLevel.LOW, label: 'Low (منخفضة)' },
                  { level: ConfidenceLevel.UNKNOWN, label: 'Unknown (مجهولة)' },
                ].map((c) => (
                  <button
                    key={c.level}
                    onClick={() => setTestConfidence(c.level)}
                    className={`px-3 py-2 text-xs rounded-xl border font-medium transition ${
                      testConfidence === c.level
                        ? 'bg-stone-900 text-white border-stone-950 shadow-xs'
                        : 'bg-white hover:bg-stone-100 text-stone-800 border-stone-200'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                تصنيف جسامة الخطأ المفترض:
              </label>
              <div className="flex items-center gap-3 mt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-800">
                  <input
                    type="radio"
                    name="lahnType"
                    checked={isLahnJaliChecked}
                    onChange={() => setIsLahnJaliChecked(true)}
                    className="text-emerald-800 focus:ring-emerald-700"
                  />
                  <span>لحن جلي (حركة / حرف / إضافة / حذف)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-800">
                  <input
                    type="radio"
                    name="lahnType"
                    checked={!isLahnJaliChecked}
                    onChange={() => setIsLahnJaliChecked(false)}
                    className="text-emerald-800 focus:ring-emerald-700"
                  />
                  <span>لحن خفي (حكم تجويدي / ميزان مد أو غنة)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Decision Outcome */}
          <div className="p-4 bg-white rounded-xl border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-stone-500">القرار التربوي الحتمي للنظام (Deterministic Decision):</div>
              <div className="text-base font-bold text-stone-900 font-arabic-heading mt-0.5">
                {resolvedDecision === PedagogicalDecision.DIRECT_CORRECTION && (
                  <span className="text-rose-800 flex items-center gap-1.5">
                    <AlertOctagon className="w-5 h-5" />
                    تصحيح فوري ومباشر (DIRECT_CORRECTION)
                  </span>
                )}
                {resolvedDecision === PedagogicalDecision.REQUEST_REPETITION && (
                  <span className="text-amber-800 flex items-center gap-1.5">
                    <HelpCircle className="w-5 h-5" />
                    طلب إعادة القراءة للتثبت بلطف (REQUEST_REPETITION)
                  </span>
                )}
                {resolvedDecision === PedagogicalDecision.PROCEED_WITHOUT_JUDGMENT && (
                  <span className="text-emerald-800 flex items-center gap-1.5">
                    <BookOpenCheck className="w-5 h-5" />
                    المتابعة دون إصدار حكم لعدم كفاية الثقة (PROCEED_WITHOUT_JUDGMENT)
                  </span>
                )}
                {resolvedDecision === PedagogicalDecision.FLAG_FOR_HUMAN_REVIEW && (
                  <span className="text-purple-800 flex items-center gap-1.5">
                    <ShieldAlert className="w-5 h-5" />
                    إحالة المقطع للمراجعة البشرية (FLAG_FOR_HUMAN_REVIEW)
                  </span>
                )}
              </div>
            </div>

            <div className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-lg border border-stone-200 max-w-sm">
              {testConfidence === ConfidenceLevel.HIGH &&
                'ثقة عالية: يتم إيقاف الطالب عند اللحن الجلي، وتقديم الشرح التربوي والمطالبة بالإعادة.'}
              {testConfidence === ConfidenceLevel.MEDIUM &&
                'ثقة متوسطة: يُمنع اتهام الطالب بالخطأ، ويُطلب منه تكرار الكلمة برفق للتأكد.'}
              {testConfidence === ConfidenceLevel.LOW &&
                'ثقة منخفضة (ضوضاء أو سرعة): النظام يصمت ولا يقطع التلاوة تفاديًا للإزعاج.'}
              {testConfidence === ConfidenceLevel.UNKNOWN &&
                'ثقة غير محددة: تسجل الحالة للمراجعة العلمية وتظل الجلسة دون مقاطعة عشوائية.'}
            </div>
          </div>
        </div>
      </div>

      {/* Error Taxonomy Catalog */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-stone-900 font-arabic-heading flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-800" />
              فهرس تصنيف الأخطاء والتجويد (Error Taxonomy)
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              تصنيف منضبط مستمد من علم التجويد لتمييز اللحن الجلي المخل بالمبنى عن اللحن الخفي المخل بالكمال.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveCategory('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeCategory === 'ALL'
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              الكل ({ERROR_TAXONOMY_CATALOG.length})
            </button>
            <button
              onClick={() => setActiveCategory(LahnCategory.JALI)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeCategory === LahnCategory.JALI
                  ? 'bg-rose-900 text-white'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
              }`}
            >
              اللحن الجلي
            </button>
            <button
              onClick={() => setActiveCategory(LahnCategory.KHAFI)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeCategory === LahnCategory.KHAFI
                  ? 'bg-amber-900 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              اللحن الخفي وأحكام التجويد
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredErrors.map((err, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border transition ${
                err.category === LahnCategory.JALI
                  ? 'bg-rose-50/40 border-rose-200/80 hover:bg-rose-50/70'
                  : 'bg-amber-50/40 border-amber-200/80 hover:bg-amber-50/70'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-stone-200/60 mb-2">
                <span className="text-xs font-bold text-stone-900 font-arabic-heading">{err.nameArabic}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                    err.category === LahnCategory.JALI
                      ? 'bg-rose-100 text-rose-900'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {err.category}
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-stone-500 font-medium">مثال تطبيقي: </span>
                  <span className="font-semibold text-stone-800 font-quran">{err.exampleArabic}</span>
                </div>
                <div>
                  <span className="text-stone-500 font-medium">الأثر والتحذير: </span>
                  <span className="text-stone-700">{err.consequence}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
