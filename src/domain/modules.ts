/**
 * @file modules.ts
 * @description Catalog and architectural boundaries of the 18 Domain Modules.
 * Ensures Clean Architecture, Domain-Driven Design separation, and zero vendor coupling.
 */

export enum DomainModuleId {
  QURAN = 'QURAN',
  RECITATION = 'RECITATION',
  TAJWEED = 'TAJWEED',
  MEMORIZATION = 'MEMORIZATION',
  REVISION = 'REVISION',
  STUDENT = 'STUDENT',
  LEARNING_PLAN = 'LEARNING_PLAN',
  LESSON = 'LESSON',
  ASSESSMENT = 'ASSESSMENT',
  TEACHER_AI = 'TEACHER_AI',
  AUDIO = 'AUDIO',
  PROGRESS = 'PROGRESS',
  AUTHENTICATION = 'AUTHENTICATION',
  CONTENT = 'CONTENT',
  ADMINISTRATION = 'ADMINISTRATION',
  ANALYTICS = 'ANALYTICS',
  NOTIFICATIONS = 'NOTIFICATIONS',
  SAFETY_AND_QUALITY = 'SAFETY_AND_QUALITY',
}

export interface DomainModuleDefinition {
  id: DomainModuleId;
  nameArabic: string;
  nameEnglish: string;
  description: string;
  responsibilities: string[];
  inboundDependencies: DomainModuleId[];
  outboundDependencies: DomainModuleId[];
  isDeterministicOnly: boolean;
}

export const DOMAIN_MODULES_REGISTRY: Record<DomainModuleId, DomainModuleDefinition> = {
  [DomainModuleId.QURAN]: {
    id: DomainModuleId.QURAN,
    nameArabic: 'نطاق القرآن الكريم',
    nameEnglish: 'Quran Core Domain',
    description: 'المستودع المعرفي الحتمي لنص المصحف الشريف والسور والآيات والكلمات والرسم العثماني وعلامات الضبط.',
    responsibilities: [
      'توفير بيانات النص القرآني المعتمد والمتحقق منه',
      'دعم الروايات القرآنية بدءًا برواية حفص عن عاصم من طريق الشاطبية',
      'حفظ علامات الوقف، والسجدات، وأرقام الصفحات والأجزاء والأحزاب والأرباع',
      'منع أي تعديل أو صياغة غير موثقة للنص القرآني',
    ],
    inboundDependencies: [
      DomainModuleId.RECITATION,
      DomainModuleId.TAJWEED,
      DomainModuleId.MEMORIZATION,
      DomainModuleId.LESSON,
      DomainModuleId.TEACHER_AI,
    ],
    outboundDependencies: [DomainModuleId.SAFETY_AND_QUALITY],
    isDeterministicOnly: true,
  },

  [DomainModuleId.RECITATION]: {
    id: DomainModuleId.RECITATION,
    nameArabic: 'نطاق جلسات التلاوة',
    nameEnglish: 'Recitation Domain',
    description: 'إدارة جلسة التسميع اللحظية ومحاذاة الكلمات واكتشاف الانحرافات والتكرار.',
    responsibilities: [
      'تنسيق جلسة التلاوة الحية للطالب',
      'محاذاة تدفق الصوت المكتشف مع النص القرآني المتوقع',
      'تسجيل الانحرافات اللفظية والوقف والابتداء',
      'تتبع الكلمات المقروءة كلمة بكلمة',
    ],
    inboundDependencies: [DomainModuleId.TEACHER_AI, DomainModuleId.ASSESSMENT, DomainModuleId.PROGRESS],
    outboundDependencies: [DomainModuleId.QURAN, DomainModuleId.AUDIO, DomainModuleId.TAJWEED],
    isDeterministicOnly: false,
  },

  [DomainModuleId.TAJWEED]: {
    id: DomainModuleId.TAJWEED,
    nameArabic: 'نطاق أحكام التجويد',
    nameEnglish: 'Tajweed Rules Domain',
    description: 'القواعد الحتمية لأحكام التجويد (المدود، الغنن، المخارج، الصفات، الإدغام، إلخ).',
    responsibilities: [
      'فهرسة أحكام التجويد النظرية والعملية بدقة رياضية حتمية',
      'وسم الكلمات والحروف القرآنية بالأحكام الواجبة والجائزة',
      'تحديد معايير اللحن الجلي واللحن الخفي',
    ],
    inboundDependencies: [DomainModuleId.RECITATION, DomainModuleId.LESSON, DomainModuleId.TEACHER_AI],
    outboundDependencies: [DomainModuleId.QURAN],
    isDeterministicOnly: true,
  },

  [DomainModuleId.MEMORIZATION]: {
    id: DomainModuleId.MEMORIZATION,
    nameArabic: 'نطاق الحفظ الجديد',
    nameEnglish: 'Memorization Domain',
    description: 'تتبع الآيات المحفوظة جديدًا ودرجة ثباتها وإتقانها في الذاكرة.',
    responsibilities: [
      'تسجيل المقاطع المسمعة والمحفوظة حديثًا',
      'احتساب نسبة إتقان كل ربع وحزب وسورة',
      'تحديث حالة الآية من قيد الحفظ إلى محفوظ معتمد',
    ],
    inboundDependencies: [DomainModuleId.PROGRESS, DomainModuleId.LEARNING_PLAN],
    outboundDependencies: [DomainModuleId.QURAN, DomainModuleId.STUDENT],
    isDeterministicOnly: true,
  },

  [DomainModuleId.REVISION]: {
    id: DomainModuleId.REVISION,
    nameArabic: 'نطاق المراجعة والتكرار',
    nameEnglish: 'Revision & Spaced Repetition Domain',
    description: 'تنظيم المراجعة الصغرى والكبرى وجدولة التكرار لمنع تفلت المحفوظ.',
    responsibilities: [
      'جدولة أوراد المراجعة اليومية والأسبوعية',
      'تطبيق خوارزميات التكرار المنظم للمقاطع المعرضة للنسيان',
      'اكتشاف المتشابهات اللفظية التي يلتبس فيها الطالب أثناء المراجعة',
    ],
    inboundDependencies: [DomainModuleId.LEARNING_PLAN, DomainModuleId.PROGRESS],
    outboundDependencies: [DomainModuleId.MEMORIZATION, DomainModuleId.STUDENT],
    isDeterministicOnly: true,
  },

  [DomainModuleId.STUDENT]: {
    id: DomainModuleId.STUDENT,
    nameArabic: 'نطاق بيانات الطالب',
    nameEnglish: 'Student Profile & History Domain',
    description: 'الملف الشخصي للمتعلم، وتاريخه القرآني، ونقاط القوة والضعف.',
    responsibilities: [
      'حفظ تفضيلات الطالب (الرواية، القارئ المفضل للنمذجة، السرعة)',
      'سجل مواضع الضعف في المخارج والصفات',
      'تاريخ الإنجاز والمسار التعليمي',
    ],
    inboundDependencies: [DomainModuleId.MEMORIZATION, DomainModuleId.REVISION, DomainModuleId.LEARNING_PLAN],
    outboundDependencies: [DomainModuleId.AUTHENTICATION],
    isDeterministicOnly: true,
  },

  [DomainModuleId.LEARNING_PLAN]: {
    id: DomainModuleId.LEARNING_PLAN,
    nameArabic: 'نطاق الخطط التعليمية',
    nameEnglish: 'Learning Plan Domain',
    description: 'هندسة المناهج ومسارات الحفظ (مثل ختمة سنتين، حفظ جزء عم، تصحيح التلاوة).',
    responsibilities: [
      'إنشاء وتعيين مسار الحفظ أو التسميع المناسب لمستوى الطالب',
      'توزيع الأوراد اليومية بتوازن دون إرهاق',
      'إعادة ضبط الجدولة عند التخلف أو التقدم السريع',
    ],
    inboundDependencies: [DomainModuleId.STUDENT, DomainModuleId.NOTIFICATIONS],
    outboundDependencies: [DomainModuleId.MEMORIZATION, DomainModuleId.REVISION],
    isDeterministicOnly: true,
  },

  [DomainModuleId.LESSON]: {
    id: DomainModuleId.LESSON,
    nameArabic: 'نطاق الدروس التعليمية',
    nameEnglish: 'Pedagogical Lessons Domain',
    description: 'الوحدات التعليمية التفاعلية لشرح التجويد والمخارج بالصوت والصورة.',
    responsibilities: [
      'تقديم شروح معتمدة لمخارج الحروف وصفاتها',
      'تمارين تدريبية مخصصة للأحكام التجويدية الصعبة',
      'أمثلة تطبيقية ونماذج تلاوة نموذجية لأئمة متقنين',
    ],
    inboundDependencies: [DomainModuleId.TEACHER_AI, DomainModuleId.LEARNING_PLAN],
    outboundDependencies: [DomainModuleId.TAJWEED, DomainModuleId.CONTENT],
    isDeterministicOnly: true,
  },

  [DomainModuleId.ASSESSMENT]: {
    id: DomainModuleId.ASSESSMENT,
    nameArabic: 'نطاق التقييم والإجازة المرحلية',
    nameEnglish: 'Assessment & Evaluation Domain',
    description: 'تقييم شامل لإتقان الطالب لسورة أو حزب وفق معايير الإتقان المعتمدة.',
    responsibilities: [
      'إجراء اختبارات تسميع تراكمية',
      'حساب معيار جودة التلاوة (نسبة الحفظ، دقة الحركات، تطبيق التجويد)',
      'إصدار تقارير إتقان تفصيلية معتمدة على قواعد موضوعية',
    ],
    inboundDependencies: [DomainModuleId.PROGRESS, DomainModuleId.LEARNING_PLAN],
    outboundDependencies: [DomainModuleId.RECITATION, DomainModuleId.STUDENT],
    isDeterministicOnly: true,
  },

  [DomainModuleId.TEACHER_AI]: {
    id: DomainModuleId.TEACHER_AI,
    nameArabic: 'نطاق المعلم الذكي',
    nameEnglish: 'Teacher AI Pedagogical Layer',
    description: 'طبقة الذكاء الاصطناعي البيداغوجي الموجه والمقيد بصرامة لشرح الأخطاء وإرشاد الطالب.',
    responsibilities: [
      'تنفيذ حلقة دورة المعلم التفاعلية (TeacherSessionEngine)',
      'تقديم شرح لطيف وتربوي ومبسط للأخطاء التي حددها المحرك الحتمي',
      'توليد عبارات تشجيعية منضبطة وتوجيه نطق الحرف',
      'حظر تام لأي تأليف أو مساس بالنص القرآني',
    ],
    inboundDependencies: [DomainModuleId.RECITATION],
    outboundDependencies: [DomainModuleId.QURAN, DomainModuleId.TAJWEED, DomainModuleId.SAFETY_AND_QUALITY],
    isDeterministicOnly: false,
  },

  [DomainModuleId.AUDIO]: {
    id: DomainModuleId.AUDIO,
    nameArabic: 'نطاق معالجة الصوت',
    nameEnglish: 'Audio Processing & Phonetics Domain',
    description: 'إدارة تدفق الصوت، والتقطيع الصوتي (VAD)، والتحليل الطيفي والفونيمي.',
    responsibilities: [
      'استقبال دفق الصوت بصيغة قياسية ومعايرته (16kHz Mono)',
      'اكتشاف مواضع السكوت ونهاية النفس',
      'استخلاص الخصائص الصوتية لدعم محرك المحاذاة',
    ],
    inboundDependencies: [DomainModuleId.RECITATION],
    outboundDependencies: [],
    isDeterministicOnly: true,
  },

  [DomainModuleId.PROGRESS]: {
    id: DomainModuleId.PROGRESS,
    nameArabic: 'نطاق سجل التقدم والإنجاز',
    nameEnglish: 'Progress & Analytics Domain',
    description: 'حفظ وتتبع سجل الورد اليومي، والإحصائيات، ومعدلات الإتقان.',
    responsibilities: [
      'حفظ عدد الآيات والصفحات المسمعة يوميًا',
      'تتبع استمرارية الطالب في ورده اليومي',
      'إبراز التقدم نحو إتمام الختمة دون ابتذال أو لعب',
    ],
    inboundDependencies: [],
    outboundDependencies: [DomainModuleId.STUDENT, DomainModuleId.MEMORIZATION],
    isDeterministicOnly: true,
  },

  [DomainModuleId.AUTHENTICATION]: {
    id: DomainModuleId.AUTHENTICATION,
    nameArabic: 'نطاق المصادقة والأدوار',
    nameEnglish: 'Authentication & Access Control Domain',
    description: 'الهوية الرقمية وإدارة الصلاحيات الصارمة (طالب، مراجع ديني، مدير نظام).',
    responsibilities: [
      'إدارة جلسة المستخدم وهوية الحساب',
      'تطبيق التحكم في الوصول المبني على الأدوار (RBAC)',
      'منع الوصول غير المصرح به للبيانات والتحكم في الخصوصية',
    ],
    inboundDependencies: [DomainModuleId.STUDENT, DomainModuleId.ADMINISTRATION],
    outboundDependencies: [],
    isDeterministicOnly: true,
  },

  [DomainModuleId.CONTENT]: {
    id: DomainModuleId.CONTENT,
    nameArabic: 'نطاق المحتوى العلمي والتفاسير',
    nameEnglish: 'Verified Content & Exegesis Domain',
    description: 'المتون العلمية المعتمدة (تحفة الأطفال، الجزرية) والتفاسير الميسرة الموثقة.',
    responsibilities: [
      'توفير شواهد المنظومات التجويدية المعتمدة',
      'إتاحة معاني الكلمات والتفسير الميسر المعتمد لفهم الآيات أثناء الحفظ',
      'ضمان التوثيق الديني والمصدري لكل معلومة معروضة',
    ],
    inboundDependencies: [DomainModuleId.LESSON, DomainModuleId.TEACHER_AI],
    outboundDependencies: [DomainModuleId.SAFETY_AND_QUALITY],
    isDeterministicOnly: true,
  },

  [DomainModuleId.ADMINISTRATION]: {
    id: DomainModuleId.ADMINISTRATION,
    nameArabic: 'نطاق الإدارة والحوكمة',
    nameEnglish: 'Administration & Governance Domain',
    description: 'إدارة إصدارات نصوص القرآن، وقواعد التجويد، وسجلات التدقيق (Audit Logs).',
    responsibilities: [
      'حوكمة إصدارات البيانات الدينية والتوقيع الرقمي عليها',
      'إدارة صلاحيات المراجعين العلميين والمديرين',
      'مراجعة سجلات تدقيق النظام والعمليات الحساسة',
    ],
    inboundDependencies: [],
    outboundDependencies: [DomainModuleId.AUTHENTICATION, DomainModuleId.QURAN, DomainModuleId.SAFETY_AND_QUALITY],
    isDeterministicOnly: true,
  },

  [DomainModuleId.ANALYTICS]: {
    id: DomainModuleId.ANALYTICS,
    nameArabic: 'نطاق التحليلات ومقاييس الجودة',
    nameEnglish: 'Observability & Quality Analytics Domain',
    description: 'قياس دقة المحاذاة ونسب الخطأ ومقاييس زمن الاستجابة وجودة الخدمة.',
    responsibilities: [
      'تتبع زمن استجابة محرك الصوت والـAI (Latencies)',
      'رصد توزيع درجات الثقة (Confidence Distribution)',
      'قياس نسب الإيجابية الخاطئة والسلبية الخاطئة مع مراعاة خصوصية الصوت',
    ],
    inboundDependencies: [],
    outboundDependencies: [DomainModuleId.RECITATION],
    isDeterministicOnly: true,
  },

  [DomainModuleId.NOTIFICATIONS]: {
    id: DomainModuleId.NOTIFICATIONS,
    nameArabic: 'نطاق التنبيهات والتذكير',
    nameEnglish: 'Notifications Domain',
    description: 'تذكير الطالب بأوقات الورد اليومي وجلسات المراجعة بوقار ورقي.',
    responsibilities: [
      'إرسال إشعارات التذكير بالورد القرآني في الوقت المفضل للطالب',
      'تنبيهات المراجعة للمقاطع المعرضة للنسيان',
      'حظر الإشعارات المزعجة أو التجارية',
    ],
    inboundDependencies: [],
    outboundDependencies: [DomainModuleId.STUDENT, DomainModuleId.LEARNING_PLAN],
    isDeterministicOnly: true,
  },

  [DomainModuleId.SAFETY_AND_QUALITY]: {
    id: DomainModuleId.SAFETY_AND_QUALITY,
    nameArabic: 'نطاق الأمان والجودة الشرعية',
    nameEnglish: 'Safety & Religious Quality Assurance Domain',
    description: 'الحصن الرقابي الحتمي لمنع أي هلوسة دينية أو تشويه لنص القرآن أو فتاوى عشوائية.',
    responsibilities: [
      'فحص مخرجات الذكاء الاصطناعي لمنع المساس بنص القرآن الكريم',
      'التأكد من أن كل نص معروض موثق بـ ContentVerification',
      'عزل وإلغاء أي رد غير متطابق مع قواعد التجويد أو الضوابط الدينية',
    ],
    inboundDependencies: [DomainModuleId.TEACHER_AI, DomainModuleId.CONTENT, DomainModuleId.QURAN],
    outboundDependencies: [],
    isDeterministicOnly: true,
  },
};
