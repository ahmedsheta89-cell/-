/**
 * @file reciters.ts
 * @module domain/reciter
 * @description Canonical, authentic Quran reciters registry (أكابر قراء العالم الإسلامي المعتمدين).
 * Sourced directly from verifiable, high-fidelity audio archives (EveryAyah / Quran.com CDN).
 * Enables reference listening, guided imitation ("اقرأ وردد معي"), and comparative tajweed training.
 */

export interface CanonicalReciter {
  id: string;
  nameArabic: string;
  nameEnglish: string;
  styleArabic: string;            // ترتيل، معلم، حدر...
  styleEnglish: string;
  schoolOrCountry: string;        // e.g. "مصر - المدرسة الكلاسيكية للتحقيق والإتقان"
  descriptionArabic: string;
  audioSubfolder: string;         // e.g. "Husary_128kbps", "Minshawy_Murattal_128kbps"
  sampleRate: number;
  isVerifiedTajweedBenchmark: boolean; // Flagged as master pedagogical reference
}

export const CANONICAL_RECITERS: CanonicalReciter[] = [
  {
    id: 'husary_murattal',
    nameArabic: 'الشيخ محمود خليل الحصري (رحمه الله)',
    nameEnglish: 'Mahmoud Khalil Al-Husary',
    styleArabic: 'المصحف المرتل (قمة التحقيق والضبط التجويدي)',
    styleEnglish: 'Murattal (Gold Standard of Precision)',
    schoolOrCountry: 'مصر - شيخ عموم المقارئ المصرية الأسبق',
    descriptionArabic: 'المرجع الأول والأدق عالمياً لضبط مخارج الحروف وأزمنة الغنن والمدود برواية حفص عن عاصم من طريق الشاطبية.',
    audioSubfolder: 'Husary_128kbps',
    sampleRate: 44100,
    isVerifiedTajweedBenchmark: true,
  },
  {
    id: 'minshawy_murattal',
    nameArabic: 'الشيخ محمد صديق المنشاوي (رحمه الله)',
    nameEnglish: 'Mohamed Siddiq Al-Minshawi',
    styleArabic: 'المصحف المرتل (خشوع وإتقان تام للأحكام)',
    styleEnglish: 'Murattal (Devotional & Reverent)',
    schoolOrCountry: 'مصر - المدرسة التعبيرية الخاشعة',
    descriptionArabic: 'تلاوة تمتاز بالخشوع البالغ وسلامة الوقف والابتداء مع تمام الإتقان لأحكام التجويد والصفات.',
    audioSubfolder: 'Minshawy_Murattal_128kbps',
    sampleRate: 44100,
    isVerifiedTajweedBenchmark: true,
  },
  {
    id: 'abdulbaset_murattal',
    nameArabic: 'الشيخ عبد الباسط عبد الصمد (رحمه الله)',
    nameEnglish: 'Abdul Basit Abdul Samad',
    styleArabic: 'المصحف المرتل',
    styleEnglish: 'Murattal',
    schoolOrCountry: 'مصر - صوت مكة المعتمد',
    descriptionArabic: 'صفاء نبرة الصوت وقوة النفس مع نطق فصيح مبين لكل حرف وفق قواعد الأداء المسندة.',
    audioSubfolder: 'Abdul_Basit_Murattal_192kbps',
    sampleRate: 44100,
    isVerifiedTajweedBenchmark: true,
  },
  {
    id: 'hudhaify_murattal',
    nameArabic: 'الشيخ علي بن عبد الرحمن الحذيفي',
    nameEnglish: 'Ali Al-Hudhaify',
    styleArabic: 'المصحف المرتل (إمام المسجد النبوي)',
    styleEnglish: 'Murattal (Prophet’s Mosque Imam)',
    schoolOrCountry: 'المملكة العربية السعودية - رئيس لجنة مراجعة مصحف المدينة',
    descriptionArabic: 'التزام حرفي صارم بالوقف اللازم والجائز، وتأني تعليمي نموذجي للتدريب والتصحيح.',
    audioSubfolder: 'Hudhaify_128kbps',
    sampleRate: 44100,
    isVerifiedTajweedBenchmark: true,
  },
  {
    id: 'ghamadi_murattal',
    nameArabic: 'الشيخ سعد الغامدي',
    nameEnglish: 'Saad Al-Ghamadi',
    styleArabic: 'المصحف المرتل (سهل عذب للمبتدئين)',
    styleEnglish: 'Murattal (Fluid & Accessible)',
    schoolOrCountry: 'المملكة العربية السعودية',
    descriptionArabic: 'إيقاع هادئ يساعد على الترديد وتثبيت الحفظ والمراجعة.',
    audioSubfolder: 'Ghamadi_40kbps',
    sampleRate: 44100,
    isVerifiedTajweedBenchmark: false,
  },
];

/**
 * Builds the canonical EveryAyah / Quran CDN direct URL for a given Surah and Ayah.
 * Format: https://everyayah.com/data/{subfolder}/{3-digit-surah}{3-digit-ayah}.mp3
 * Example: Surah 1 Ayah 1 with Husary -> https://everyayah.com/data/Husary_128kbps/001001.mp3
 */
export function buildAyahAudioUrl(reciterId: string, surahNumber: number, ayahNumber: number): string {
  const reciter = CANONICAL_RECITERS.find((r) => r.id === reciterId) || CANONICAL_RECITERS[0];
  const padSurah = String(surahNumber).padStart(3, '0');
  const padAyah = String(ayahNumber).padStart(3, '0');
  return `https://everyayah.com/data/${reciter.audioSubfolder}/${padSurah}${padAyah}.mp3`;
}
