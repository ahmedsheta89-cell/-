import React from 'react';
import { CheckCircle2, Clock, ArrowLeft, Shield, Sparkles, Smartphone } from 'lucide-react';

export const RoadmapView: React.FC = () => {
  const phases = [
    {
      number: '1',
      title: 'المرحلة 1: التأسيس والمعمارية (Foundation Phase)',
      status: 'CURRENT',
      badge: 'المرحلة الحالية - جاهزة ومكتملة',
      description:
        'بناء النطاق الأصيل (Domain Core)، وعقود البيانات، وميثاق النزاهة الدينية، وآلة حالة دورة المعلم (TeacherSessionEngine)، وتجريد الخدمات، ومنصة الاختبارات الحتمية.',
      deliverables: [
        'نموذج النطاق لـ 18 وحدة مستقلة',
        'مصفوفة الثقة والقرار التربوي الحتمي',
        'محرك دورة المعلم (TeacherSessionEngine) بـ 10 حالات',
        'تجريدات الخدمات (AuthProvider, DatabaseProvider, AIProvider, AudioProvider)',
        'حوكمة الاعتماد الشرعي وفصل الصلاحيات (RBAC)',
      ],
    },
    {
      number: '2',
      title: 'المرحلة 2: محرك القرآن الموثق وقواعد التجويد الحتمية',
      status: 'UPCOMING',
      badge: 'Prompt 2 القادم',
      description:
        'استيراد قاعدة بيانات القرآن الكريم الكاملة برواية حفص عن عاصم من طريق الشاطبية برسم المصحف العثماني، وبناء محرك أحكام التجويد الحتمي (Rule-based Tajweed Engine) دون الاعتماد على الذكاء التوليدي.',
      deliverables: [
        'المصحف كاملاً (6236 آية، 114 سورة) موثق بختم رقمي',
        'فهرسة أحكام النون الساكنة والتنوين والميم والمدود الحتمية',
        'مستودع علامات الوقف وأحكام الابتداء',
        'ربط خدمة التخزين Firestore عبر IDatabaseProvider',
      ],
    },
    {
      number: '3',
      title: 'المرحلة 3: هندسة الصوت والمحاذاة الفونيمية والبيانات المرجعية (Golden Dataset)',
      status: 'PLANNED',
      badge: 'مرحلة مستقبلية',
      description:
        'تطوير بروتوكول تدفق الصوت الحي (16kHz PCM/Opus)، والتقطيع الصوتي الدقيق (VAD)، والمحاذاة القسرية (Forced Phonetic Alignment)، وبناء مجموعة التلاوات الذهبية المعتمدة بشريًا.',
      deliverables: [
        'محرك Forced Alignment لمطابقة الصوت مع الكلمات والوحدات الفونيمية',
        'Golden Dataset لقياس دقة الاكتشاف بدقة إحصائية',
        'تكامل الـ AudioAnalysisProvider في بيئة الخادم',
      ],
    },
    {
      number: '4',
      title: 'المرحلة 4: طبقة المعلم الذكي والشرح البيداغوجي (Teacher AI Layer)',
      status: 'PLANNED',
      badge: 'مرحلة مستقبلية',
      description:
        'تفعيل طبقة الذكاء الاصطناعي التوليدي لشرح الأخطاء بأسلوب تربوي لطيف، وتقديم نصائح المخارج مع الحظر التام لمساس الذكاء بالنص القرآني.',
      deliverables: [
        'ربط Gemini API من خلال خادم Node.js مع حماية كاملة للمفاتيح',
        'توليد الشروح البيداغوجية المتكيفة مع مستوى الطالب',
        'محاورة الطالب حول صفات الحروف ومخارجها',
      ],
    },
    {
      number: '5',
      title: 'المرحلة 5: رحلة الطالب والحفظ والتكرار المتباعد',
      status: 'PLANNED',
      badge: 'مرحلة مستقبلية',
      description:
        'بناء أنظمة إدارة الورد اليومي، وجدولة المراجعة بالتكرار المتباعد (Spaced Repetition)، ومتابعة المتشابهات اللفظية، وتقارير الإتقان.',
      deliverables: [
        'خوارزمية مراجعة المحفوظ القريب والبعيد',
        'تتبع نقاط الضعف في مخارج الحروف',
        'سجل الختمة ومؤشرات الإتقان التراكمية',
      ],
    },
    {
      number: '6',
      title: 'المرحلة 6: تعدد الروايات والتوسع لتطبيقات الموبايل (Android / iOS)',
      status: 'PLANNED',
      badge: 'مرحلة مستقبلية',
      description:
        'إضافة روايات أخرى (ورش عن نافع، قالون عن نافع) وإطلاق الواجهات الأصلية لتطبيقات الهواتف الذكية مع إعادة استخدام كامل لنفس النطاق المعماري والعقود.',
      deliverables: [
        'دعم فرش وأصول رواية ورش وقالون',
        'واجهات Kotlin Multiplatform / Native Mobile متوافقة مع الـContracts',
      ],
    },
  ];

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/80 shadow-xs space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-2 border border-emerald-200/60">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            خطة العمل المنهجية الممتدة
          </div>
          <h2 className="text-xl font-bold text-stone-900 font-arabic-heading">
            خريطة طريق تطوير مشروع معلّم القرآن الرقمي (Roadmap)
          </h2>
          <p className="text-xs text-stone-500 mt-1 max-w-3xl">
            بناء متدرج يلتزم بصرامة بأولويات: الصحة والنزاهة العلمية &gt; المعمارية &gt; الأمان &gt; جودة التجربة.
          </p>
        </div>

        <div className="space-y-4">
          {phases.map((phase) => {
            const isCurrent = phase.status === 'CURRENT';
            return (
              <div
                key={phase.number}
                className={`p-5 rounded-xl border transition ${
                  isCurrent
                    ? 'bg-emerald-50/50 border-emerald-200/90 shadow-xs ring-1 ring-emerald-300/40'
                    : 'bg-stone-50/70 border-stone-200/80'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-stone-200/60">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                        isCurrent ? 'bg-emerald-900 text-white' : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {phase.number}
                    </span>
                    <h3 className="text-sm font-bold text-stone-900 font-arabic-heading">{phase.title}</h3>
                  </div>

                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      isCurrent
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-stone-200/80 text-stone-700'
                    }`}
                  >
                    {phase.badge}
                  </span>
                </div>

                <p className="text-xs text-stone-600 mt-3 leading-relaxed">{phase.description}</p>

                <div className="mt-3 pt-3 border-t border-stone-200/50">
                  <div className="text-[11px] font-semibold text-stone-700 mb-1.5">أبرز المخرجات المخططة:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {phase.deliverables.map((item, i) => (
                      <div key={i} className="text-xs text-stone-600 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
