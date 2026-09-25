/**
 * @file AyahTajweedAnalysis.ts
 * @module domain/tajweed
 * @description Provides authoritative, classical tajweed analysis per Ayah and word.
 * Grounded in the works of Ibn al-Jazari (المقدمة الجزرية) and Sulayman al-Jamzuri (تحفة الأطفال).
 */

export interface TajweedHighlight {
  wordIndex: number;
  wordText: string;
  ruleTitleArabic: string;
  category: string;
  classicalCitation: string;
  practicalTipArabic: string;
  commonMistakeArabic: string;
}

export const VERIFIED_AYAH_TAJWEED_MAP: Record<string, TajweedHighlight[]> = {
  // Surah 1: Al-Fatihah
  '1:1': [
    {
      wordIndex: 1,
      wordText: 'ٱللَّهِ',
      ruleTitleArabic: 'ترقيق لام لفظ الجلالة',
      category: 'أحكام اللامات',
      classicalCitation: 'ورقّقِ الراءَ إذا ما كُسِرت ** كذاك بعدَ الكسرِ حيثُ سكنتْ (وفخم اللام من اسم الله عن فتح او ضم)',
      practicalTipArabic: 'رقّق اللام من اسم الجلالة لسبقها بكسرة ميم (بِسْمِ).',
      commonMistakeArabic: 'تغليظ اللام مع الكسر.',
    },
    {
      wordIndex: 2,
      wordText: 'ٱلرَّحْمَـٰنِ',
      ruleTitleArabic: 'إدغام شمسي وتفخيم الراء',
      category: 'أحكام الراء واللام',
      classicalCitation: 'لِلاَمِ أَلْ حَالاَنِ قَبْلَ الأَحْرُفِ ** أُولاَهُمَا إِظْهَارُهَا فَلْتَعْرِفِ',
      practicalTipArabic: 'أدغم اللام في الراء إدغاماً شمسياً وفخّم الراء المفتوحة المشددة دون تكرير زائد.',
      commonMistakeArabic: 'تكرير الراء بشكل مفرط (ارتعاد اللسان).',
    },
    {
      wordIndex: 3,
      wordText: 'ٱلرَّحِيمِ',
      ruleTitleArabic: 'مد عارض للسكون (2، 4، 6 حركات)',
      category: 'أحكام المدود',
      classicalCitation: 'ومِثلُ ذا إنْ عرضَ السكونُ ** وقفاً كـ: تَعْلَمُونَ، نَسْتَعِينُ',
      practicalTipArabic: 'يجوز فيه القصر (حركتان)، أو التوسط (4 حركات - وهو الأفضل)، أو الطول (6 حركات) عند الوقف.',
      commonMistakeArabic: 'عدم توحيد زمن المدود العارضة للسكون أثناء القراءة الواحدة.',
    },
  ],
  '1:2': [
    {
      wordIndex: 0,
      wordText: 'ٱلْحَمْدُ',
      ruleTitleArabic: 'إظهار قمري للام أل',
      category: 'أحكام اللامات',
      classicalCitation: 'فَالأَوَّلُ الإِظْهَارُ قَبْلَ ارْبَعِ ** مَعْ عَشْرَةٍ خُذْ عِلْمَهُ مِنِ ابْغِ حَجَّكَ وَخَفْ عَقِيمَهُ',
      practicalTipArabic: 'انطق اللام الساكنة بإظهار تام دون قلقلة أو سكت.',
      commonMistakeArabic: 'قلقلة اللام أو السكت عليها.',
    },
    {
      wordIndex: 2,
      wordText: 'ٱلْعَـٰلَمِينَ',
      ruleTitleArabic: 'مد عارض للسكون وإظهار قمري',
      category: 'أحكام المدود',
      classicalCitation: 'ومِثلُ ذا إنْ عرضَ السكونُ ** وقفاً كـ: تَعْلَمُونَ، نَسْتَعِينُ',
      practicalTipArabic: 'أظهر العين بفصاحة وتوسط الياء بمقدار 4 حركات عند الوقف.',
      commonMistakeArabic: 'إمالة فتحة العين أو عصر الحلق.',
    },
  ],
  '1:7': [
    {
      wordIndex: 8,
      wordText: 'ٱلضَّآلِّينَ',
      ruleTitleArabic: 'مد لازم كلمي مثقل (6 حركات وجوباً)',
      category: 'أحكام المدود',
      classicalCitation: 'فإنْ بكلمةٍ سكونٌ اجتمعْ ** معْ حرفِ مدٍّ فهو كِلْمِيٌّ وقعْ ... مُثَقَّلٌ إنْ أُدْغِمَا',
      practicalTipArabic: 'مد الألف 6 حركات كاملة وجوباً، ثم اضغط على اللام المشددة بنبرٍ خفيف دون انفصال.',
      commonMistakeArabic: 'تقصير المد عن 6 حركات أو تفويت تشديد اللام.',
    },
  ],

  // Surah 112: Al-Ikhlas
  '112:1': [
    {
      wordIndex: 0,
      wordText: 'قُلْ',
      ruleTitleArabic: 'استعلاء القاف وإظهار اللام',
      category: 'مخارج وصفات',
      classicalCitation: 'وحرفَ الاستعلاءِ فخّم واخصُصا ** الإطباقَ أقوى نحو قالَ والعصا',
      practicalTipArabic: 'فخّم القاف من أقصى اللسان مع إسكان اللام دون قلقلة.',
      commonMistakeArabic: 'نطق القاف كالكاف أو قلقلة اللام.',
    },
    {
      wordIndex: 3,
      wordText: 'أَحَدٌ',
      ruleTitleArabic: 'قلقلة كبرى عند الوقف',
      category: 'أحكام القلقلة',
      classicalCitation: 'وبيّنَنْ مُقَلْقَلاً إنْ سَكَنا ** وإنْ يَكُنْ في الوقفِ كانَ أَبْيَنا',
      practicalTipArabic: 'عند الوقف على الدال، انطق قلقلة واضحة قوية في مخرج الدال دون كسر أو فتح.',
      commonMistakeArabic: 'ابتلاع القلقلة أو خلط صوتها بحركة (كالكسرة).',
    },
  ],
  '112:2': [
    {
      wordIndex: 1,
      wordText: 'ٱلصَّمَدُ',
      ruleTitleArabic: 'إدغام شمسي وتفخيم الصاد وقلقلة كبرى وقفاً',
      category: 'أحكام اللامات والقلقلة',
      classicalCitation: 'ثانيهما إدغامها في أربعِ ** وعشرةٍ أيضاً ورمزها فعِ: طِبْ ثم صل رحماً ...',
      practicalTipArabic: 'أدغم اللام في الصاد المستعلية المطبقة واقلقل الدال عند الوقف.',
      commonMistakeArabic: 'ترقيق الصاد أو إهمال صفة الإطباق.',
    },
  ],
  '112:4': [
    {
      wordIndex: 1,
      wordText: 'يَكُن لَّهُۥ',
      ruleTitleArabic: 'إدغام كامل بغير غنة (نون مع لام)',
      category: 'أحكام النون الساكنة',
      classicalCitation: 'والثانِ إدغامٌ بغيرِ غُنّة ** في اللام والرا ثم كرّرنّه',
      practicalTipArabic: 'أدغم النون الساكنة تماماً في اللام بغير غنة: (ولم يكُ لَّه).',
      commonMistakeArabic: 'إبقاء شيء من الغنة في اللام.',
    },
  ],

  // Surah 113: Al-Falaq
  '113:1': [
    {
      wordIndex: 3,
      wordText: 'ٱلْفَلَقِ',
      ruleTitleArabic: 'قلقلة كبرى عند الوقف على القاف',
      category: 'أحكام القلقلة',
      classicalCitation: 'وبيّنَنْ مُقَلْقَلاً إنْ سَكَنا ** وإنْ يَكُنْ في الوقفِ كانَ أَبْيَنا',
      practicalTipArabic: 'اضرب مخرج القاف بقوة ليخرج صوت القلقلة الكبرى صافياً مفخماً عند الوقف.',
      commonMistakeArabic: 'ترقيق القاف أو همسها كالكاف.',
    },
  ],
  '113:2': [
    {
      wordIndex: 0,
      wordText: 'مِن شَرِّ',
      ruleTitleArabic: 'إخفاء حقيقي بغنة مرققة (حركتان)',
      category: 'أحكام النون الساكنة',
      classicalCitation: 'والرابعُ الإخفاءُ عند الفاضلِ ** من الحروفِ واجبٌ للفاضلِ',
      practicalTipArabic: 'أخفِ النون الساكنة عند الشين مع غنة مرققة بمقدار حركتين.',
      commonMistakeArabic: 'تفخيم الغنة قبل الشين، أو إلصاق طرف اللسان بأصول الثنايا.',
    },
  ],
  '113:4': [
    {
      wordIndex: 2,
      wordText: 'ٱلنَّفَّـٰثَـٰتِ',
      ruleTitleArabic: 'غنة النون المشددة (حركتان وجوباً)',
      category: 'أحكام النون والميم المشددتين',
      classicalCitation: 'وغُنَّ ميماً ثم نوناً شُدّدا ** وسَمِّ كُلاًّ حرفَ غنةٍ بَدا',
      practicalTipArabic: 'احرص على غنة النون المشددة بمقدار حركتين أكمل ما تكون الغنة.',
      commonMistakeArabic: 'استعجال نطق النون واختلاس زمن الغنة.',
    },
  ],

  // Surah 114: An-Nas
  '114:1': [
    {
      wordIndex: 3,
      wordText: 'ٱلنَّاسِ',
      ruleTitleArabic: 'غنة مشددة ومد عارض للسكون وقفاً',
      category: 'أحكام النون المشددة والمدود',
      classicalCitation: 'وغُنَّ ميماً ثم نوناً شُدّدا ** وسَمِّ كُلاًّ حرفَ غنةٍ بَدا',
      practicalTipArabic: 'غنّ النون المشددة حركتين، وعند الوقف مد الألف من حركتين إلى ست حركات واهمس السين.',
      commonMistakeArabic: 'كتم صوت السين عند الوقف.',
    },
  ],
};

export function getAyahTajweedHighlights(surahNumber: number, ayahNumber: number): TajweedHighlight[] {
  const key = `${surahNumber}:${ayahNumber}`;
  return VERIFIED_AYAH_TAJWEED_MAP[key] || [
    {
      wordIndex: 0,
      wordText: 'الآية الكريمة',
      ruleTitleArabic: 'التجويد والإتقان برواية حفص عن عاصم',
      category: 'أحكام عامة',
      classicalCitation: 'والأخذُ بالتجويدِ حتمٌ لازمُ ** من لم يجوّدِ القرآنَ آثمُ (الجزرية)',
      practicalTipArabic: 'حافظ على تحقيق الحركات وأزمنة الحروف والمدود والغنن.',
      commonMistakeArabic: 'السرعة الزائدة المؤدية لاختلاس الحركات.',
    },
  ];
}
