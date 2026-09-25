/**
 * @file types.ts
 * @module domain/errors
 * @description Comprehensive taxonomy for Quran recitation errors.
 * Categorized rigorously according to Islamic Tajweed sciences (Lahn Jali vs Lahn Khafi)
 * and technical alignment uncertainty.
 */

export enum LahnCategory {
  JALI = 'JALI',       // اللحن الجلي: خطأ يطرأ على الألفاظ فيخل بعرف القراءة سواء أخل بالمعنى أم لم يخل (تغيير حركة، إبدال حرف، زيادة أو حذف)
  KHAFI = 'KHAFI',     // اللحن الخفي: خطأ يطرأ على الألفاظ فيخل بالعرف ولا يخل بالمعنى (ترك غنة، قصر مد واجب، ترك قلقلة، عدم ترقيق أو تفخيم)
  TECHNICAL = 'TECHNICAL', // أخطاء التزامن الصوتي، عدم وضوح الإشارة، أو الشك
}

export enum RecitationErrorType {
  // --- اللحن الجلي (Lahn Jali) ---
  HARAKAH_MISMATCH = 'HARAKAH_MISMATCH',               // حركة غير صحيحة (فتحة بدل ضمة، ضم كسرة، إلخ)
  LETTER_SUBSTITUTION = 'LETTER_SUBSTITUTION',         // استبدال حرف بآخر (كالسين بالصاد أو التاء بالطاء)
  LETTER_OMISSION = 'LETTER_OMISSION',                 // حذف حرف أو كلمة
  LETTER_ADDITION = 'LETTER_ADDITION',                 // زيادة حرف أو كلمة
  WORD_ORDER_ERROR = 'WORD_ORDER_ERROR',               // تقديم أو تأخير بين الكلمات
  UNAUTHORIZED_STOP = 'UNAUTHORIZED_STOP',             // وقف قبيح يغير المعنى (مثل الوقف على "فويل للمصلين")
  IMPROPER_START = 'IMPROPER_START',                   // ابتداء قبيح

  // --- اللحن الخفي (Lahn Khafi) - أحكام التجويد ---
  MADD_DURATION_DEFECT = 'MADD_DURATION_DEFECT',       // مد زائد أو ناقص عن مقداره الشرعي
  GHUNNAH_DEFECT = 'GHUNNAH_DEFECT',                   // ترك الغنة أو نقص زمنها
  QALQALAH_DEFECT = 'QALQALAH_DEFECT',                 // ترك القلقلة أو عدم توفيتها حقها
  TAFKHEEM_TARQEEQ_DEFECT = 'TAFKHEEM_TARQEEQ_DEFECT', // ترقيق المفخم أو تفخيم المرقق (كالراء واللام وحروف الاستعلاء)
  IDGHAM_DEFECT = 'IDGHAM_DEFECT',                     // ترك الإدغام أو عدم تمييز بغنة من بغير غنة
  IZHAR_DEFECT = 'IZHAR_DEFECT',                       // عدم تبيين الحرف عند الإظهار أو إحداث سكت
  IKHFA_DEFECT = 'IKHFA_DEFECT',                       // عدم تحقيق صفة الإخفاء الحقيقي أو الشفوي
  IQLAB_DEFECT = 'IQLAB_DEFECT',                       // عدم قلب النون الساكنة أو التنوين ميمًا عند الباء
  PHONETIC_ARTICULATION_DEFECT = 'PHONETIC_ARTICULATION_DEFECT', // نطق غير دقيق لمخرج الحرف (انحراف صوتي)
  WORD_TRANSITION_DEFECT = 'WORD_TRANSITION_DEFECT',   // تعثر أو خطأ في الانتقال السلس بين الكلمات

  // --- حالات الشك وعدم التأكد ---
  UNCERTAIN_DEVIATION = 'UNCERTAIN_DEVIATION',         // خطأ غير مؤكد (بسبب ضوضاء أو سرعة التلاوة)
  LOW_AUDIO_QUALITY = 'LOW_AUDIO_QUALITY',             // جودة صوتية منخفضة تحول دون التحقق القطعي
}

export interface RecitationErrorDetail {
  errorType: RecitationErrorType;
  category: LahnCategory;
  nameArabic: string;
  descriptionArabic: string;
  surahNumber: number;
  ayahNumber: number;
  wordIndex: number;
  charIndex?: number;
  expectedToken: string;            // Text or phonetic unit expected
  detectedToken?: string;           // What was detected from audio
  severity: 'CRITICAL' | 'WARNING' | 'NOTICE';
  pedagogicalTipArabic: string;     // نصيحة توجيهية تربوية مبسطة للطالب
}
