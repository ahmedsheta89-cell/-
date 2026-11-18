package com.example.domain.model

enum class ContentAttributionType(val badgeLabelAr: String, val descriptionAr: String) {
    AUTHENTIC_QUOTE(
        badgeLabelAr = "نص أصيل منقول",
        descriptionAr = "مقتبس بنصه من المصدر المرجعي المعتمد مع العزو للطبعة والباب."
    ),
    TEAM_SIMPLIFIED(
        badgeLabelAr = "شرح مبسّط من إعداد الفريق",
        descriptionAr = "صياغة تعليمية ميسرة مستخلصة من أمهات الكتب ومراجعة علمياً."
    ),
    AI_ASSISTED(
        badgeLabelAr = "توليد آلي مساعد موثق",
        descriptionAr = "إجابة مولدة بالاسترجاع الموثق (RAG) ومقيدة بالمصادر وحارس الآيات المحلي."
    )
}

data class SourceRegistryItem(
    val id: String,
    val bookTitle: String,
    val author: String,
    val deathHijri: String,
    val editionInfo: String,
    val category: String,
    val licenseStatus: String,
    val contentVersion: String
)

data class SurahMetadata(
    val number: Int,
    val nameAr: String,
    val nameEn: String,
    val revelationType: String, // "مكية" or "مدنية"
    val ayahCount: Int,
    val startPage: Int,
    val juzNumber: Int,
    val maqasidSummary: String
)

enum class TajweedRuleCategory(
    val titleAr: String,
    val descriptionAr: String,
    val matnEvidenceAr: String
) {
    MADD(
        titleAr = "أحكام المدود",
        descriptionAr = "إطالة الصوت بحرف من حروف المد (الألف، الواو، الياء) من ٢ إلى ٦ حركات بحسب نوع المد.",
        matnEvidenceAr = "وَالمَدُّ أَصْلِيٌّ وَفَرْعِيٌّ لَهُ ... وَسَمِّ أَوَّلاً طَبِيعِيّاً وَهُو (تحفة الأطفال)"
    ),
    GHUNNAH(
        titleAr = "الغنة والإدغام",
        descriptionAr = "صوت لذيذ مركب في جسم النون والميم يخرج من الخيشوم بمقدار حركتين.",
        matnEvidenceAr = "وَغُنَّ مِيماً ثُمَّ نُوناً شُدِّدَا ... وَسَمِّ كُلاًّ حَرْفَ غُنَّةٍ بَدَا (المقدمة الجزرية)"
    ),
    QALQALAH(
        titleAr = "القلقلة (قطب جد)",
        descriptionAr = "اضطراب المخرج عند النطق بالحرف ساكناً حتى يُسمع له نبرة قوية، وحروفها خمسة: ق ط ب ج د.",
        matnEvidenceAr = "قَلْقَلَةٌ قُطْبُ جَدٍّ وَالبَيَانْ ... فِي الوَقْفِ كَانَ أَبْيَنَ المَكَانْ (المقدمة الجزرية)"
    ),
    IKHFA(
        titleAr = "الإخفاء الحقيقي والشفوي",
        descriptionAr = "النطق بالحرف بصفة بين الإظهار والإدغام عارياً عن التشديد مع بقاء الغنة في الحرف الأول.",
        matnEvidenceAr = "وَالرَّابِعُ الإِخْفَاءُ عِنْدَ الفَاضِلِ ... مِنَ الحُرُوفِ وَاجِبٌ لِلْفَاضِلِ (تحفة الأطفال)"
    ),
    TAFKHEEM(
        titleAr = "التفخيم والاستعلاء",
        descriptionAr = "سِمَن يدخل على صوت الحرف عند النطق به فيمتلئ الفم بصداه، وحروفه (خص ضغط قظ) والراء واللام بشروطها.",
        matnEvidenceAr = "وَحَرْفَ الاسْتِعْلاَءِ فَخِّمْ وَاخْصُصَا ... الاطْبَاقَ أَقْوَى نَحْوُ قَالَ وَالعَصَا (المقدمة الجزرية)"
    )
}

data class TajweedAnnotation(
    val wordSnippet: String,
    val category: TajweedRuleCategory,
    val detailedRule: String
)

enum class ScienceTrackId(
    val id: String,
    val titleAr: String,
    val subtitleAr: String,
    val primarySourcesAr: String
) {
    TAJWEED(
        id = "tajweed",
        titleAr = "التجويد ومخارج الحروف والصفات",
        subtitleAr = "المخارج الـ ١٧، صفات الحروف، النون والميم الساكنتان، المدود، والوقف والابتداء",
        primarySourcesAr = "المقدمة الجزرية لابن الجزري • تحفة الأطفال للجمزوري"
    ),
    TAFSIR(
        id = "tafsir",
        titleAr = "التفسير وأسباب النزول وغريب القرآن",
        subtitleAr = "أصول التفسير، القواعد الحسان، مفردات الغريب، وضوابط أسباب النزول",
        primarySourcesAr = "الطبري • ابن كثير • السعدي • الواحدي • الراغب الأصفهاني"
    ),
    TANZEEL(
        id = "tanzeel",
        titleAr = "علوم التنزيل والناسخ والمنسوخ والقصص",
        subtitleAr = "المكي والمدني، الناسخ والمنسوخ وأقسامه، المحكم والمتشابه، ومقاصد القصص القرآني",
        primarySourcesAr = "الإتقان في علوم القرآن للسيوطي • مباحث في علوم القرآن لمنّاع القطان"
    ),
    QIRAAT_LUGHAH(
        id = "qiraat_lughah",
        titleAr = "القراءات العشر وإعراب القرآن والبلاغة",
        subtitleAr = "الأئمة العشرة ورواتهم وأصولهم، الإعراب البياني، ووجوه الإعجاز البلاغي",
        primarySourcesAr = "النشر في القراءات العشر لابن الجزري • الإتقان للسيوطي • دلائل الإعجاز"
    )
}

enum class AcademicLevel(val levelOrder: Int, val labelAr: String) {
    FOUNDATIONAL(1, "المستوى التأسيسي"),
    INTERMEDIATE(2, "المستوى المتوسط"),
    ADVANCED(3, "المستوى المتقدم")
}

data class QuizQuestion(
    val id: String,
    val questionText: String,
    val options: List<String>,
    val correctIndex: Int,
    val explanation: String,
    val sourceCitation: String
)

data class ScienceLesson(
    val id: String,
    val trackId: ScienceTrackId,
    val level: AcademicLevel,
    val orderIndex: Int,
    val title: String,
    val summary: String,
    val matnText: String,
    val detailedExplanation: String,
    val quranicEvidenceRefs: List<String>, // e.g., ["73:4", "2:255"] resolved from local DB
    val sourceCitation: String,
    val sourceRegistryId: String,
    val attribution: ContentAttributionType,
    val practiceTask: String,
    val quizQuestions: List<QuizQuestion>
)

data class ClassicalMatnVerse(
    val id: String,
    val matnName: String, // "تحفة الأطفال" or "المقدمة الجزرية"
    val author: String,
    val chapterTitle: String,
    val verseNumber: Int,
    val hemistichOne: String,
    val hemistichTwo: String,
    val explanation: String,
    val sourceCitation: String
)

data class ReciterProfile(
    val id: String,
    val nameAr: String,
    val styleAr: String,
    val everyAyahFolder: String,
    val descriptionAr: String
)

data class SourceChunk(
    val chunkId: String,
    val bookTitle: String,
    val author: String,
    val reference: String,
    val topicKeywords: List<String>,
    val content: String,
    val relatedAyahRefs: List<String> = emptyList()
)

data class ScholarCitation(
    val book: String,
    val author: String,
    val reference: String,
    val chunkId: String? = null
)

data class ResolvedAyahQuote(
    val surahNumber: Int,
    val surahNameAr: String,
    val ayahNumber: Int,
    val uthmaniText: String // Strictly populated from local Room DB, NEVER from LLM output
)

data class ScholarStructuredResponse(
    val question: String,
    val answer: String,
    val citations: List<ScholarCitation>,
    val resolvedAyahs: List<ResolvedAyahQuote>,
    val confidence: Double,
    val needsScholarReferral: Boolean,
    val attribution: ContentAttributionType = ContentAttributionType.AI_ASSISTED,
    val modelUsed: String,
    val retrievedChunks: List<SourceChunk> = emptyList()
)

enum class WordDiffStatus {
    MATCHED,
    SUBSTITUTED,
    MISSED
}

data class RecitationWordDiff(
    val expectedWord: String,
    val spokenWord: String?,
    val status: WordDiffStatus
)

data class VoiceRecitationReport(
    val surahNumber: Int,
    val ayahNumber: Int,
    val expectedUthmani: String,
    val spokenTranscript: String,
    val accuracyPercent: Int,
    val wordDiffs: List<RecitationWordDiff>
)

data class MutashabihatRule(
    val id: String,
    val topicTitleAr: String,
    val firstAyahRef: String,
    val firstSurahNameAr: String,
    val firstAyahSnippet: String,
    val secondAyahRef: String,
    val secondSurahNameAr: String,
    val secondAyahSnippet: String,
    val goldenRuleExplanation: String,
    val sourceCitation: String
)

data class SurahMaqasidMindMap(
    val surahNumber: Int,
    val surahNameAr: String,
    val centralAxisAr: String,
    val mainPillars: List<Pair<String, String>>,
    val thematicSections: List<String>,
    val keyMutashabihatIds: List<String>,
    val sourceCitation: String
)

data class QiraatReadingVariant(
    val imamAndRawiAr: String,
    val readingTextAr: String,
    val phoneticAndTajweedRuleAr: String,
    val linguisticDirectionAr: String
)

data class QiraatComparisonEntry(
    val compositeKey: String,
    val surahNameAr: String,
    val ayahNumber: Int,
    val targetWordUthmani: String,
    val variants: List<QiraatReadingVariant>,
    val sourceCitation: String
)

data class GharibLexiconEntry(
    val id: String,
    val wordRootAr: String,
    val quranicWordAr: String,
    val compositeKey: String,
    val surahNameAr: String,
    val ayahNumber: Int,
    val raghibMeaningAr: String,
    val asbabNuzulSummaryAr: String,
    val sourceCitation: String
)

data class MakharijPhoneticDiagnosis(
    val letterAr: String,
    val generalMakhrajAr: String,
    val specificMakhrajAr: String,
    val sifaatAr: String,
    val commonErrorWarningAr: String,
    val jazariyyahVerseAr: String
)

data class CloudGroupHalqah(
    val halqahId: String,
    val titleAr: String,
    val supervisorSheikhAr: String,
    val wirdTargetAr: String,
    val categoryAr: String,
    val participantsCount: Int,
    val userCompletedWirds: Int,
    val userMasteryPoints: Int,
    val isJoined: Boolean,
    val leaderboardPreview: List<Pair<String, Int>>
)

/**
 * Phase 3: Interactive 17 Makharij Anatomical Point on Imam Ibn Al-Jazari's system.
 */
data class AnatomicalMakhrajPoint(
    val makhrajNumber: Int,            // 1..17
    val generalRegionId: String,       // "jawf", "halq", "lisan", "shafatan", "khayshoom"
    val generalRegionAr: String,       // الجوف | الحلق | اللسان | الشفتان | الخيشوم
    val specificTitleAr: String,       // e.g. "أقصى الحلق", "طرف اللسان مع أصول الثنايا العليا"
    val lettersAr: String,             // e.g. "ء ، هـ"
    val normX: Float,                  // 0.0f..1.0f relative X on sagittal vocal tract canvas
    val normY: Float,                  // 0.0f..1.0f relative Y on sagittal vocal tract canvas
    val airflowAngleDeg: Float,        // Direction of sound/air projection
    val hasNasalGhunnah: Boolean = false,
    val sifaatSummaryAr: String,
    val mechanismExplanationAr: String,
    val jazariyyahEvidenceAr: String,
    val practiceWordUthmani: String,
    val commonErrorWarningAr: String
)

/**
 * Phase 3: Teacher & Muhaffiz Portal Classroom model.
 */
data class TeacherClassroom(
    val classroomId: String,
    val titleAr: String,
    val levelAr: String,
    val supervisorNameAr: String,
    val studentsCount: Int,
    val activeWirdSummaryAr: String,
    val scheduleAr: String
)

/**
 * Phase 3: Student Voice Recitation Submission for Teacher Review.
 */
data class StudentSubmissionItem(
    val submissionId: String,
    val studentNameAr: String,
    val classroomId: String,
    val classroomTitleAr: String,
    val surahNumber: Int,
    val surahNameAr: String,
    val ayahRangeAr: String,
    val recitedSnippetUthmani: String,
    val autoAccuracyPercent: Int,
    val waveformSamples: List<Float>,
    val durationSeconds: Int,
    val focusMistakeWord: String,
    val teacherFeedbackNote: String,
    val tajweedCategoryBadgeAr: String,
    val isReviewedByTeacher: Boolean,
    val stageCertificateIssued: Boolean = false
)

/**
 * Phase 3: Colored Qira'at Narrator Profile for Comparative Mushaf View.
 */
data class QiraatNarratorColorProfile(
    val narratorId: String,
    val shortLabelAr: String,
    val imamAndRawiAr: String,
    val tariqAr: String,
    val badgeColorHex: Long,
    val usoolMethodologyAr: String,
    val keyExampleDifferenceAr: String,
    val shatibiyyahEvidenceAr: String
)

/**
 * Phase 3: Mushaf Mastery Heatmap Cell per Surah.
 */
data class SurahHeatmapCell(
    val surahNumber: Int,
    val surahNameAr: String,
    val juzNumber: Int,
    val masteryStatus: Int, // 0 = لم يبدأ, 1 = يحتاج مراجعة عاجلة, 2 = قيد التثبيت, 3 = متقن راسخ
    val stabilityDays: Double,
    val accuracyPercent: Int,
    val activeMistakesCount: Int
)

/**
 * Phase 4: Thematic Quran Index Node linked to Al-Qawa'id Al-Hisan by Al-Sa'di.
 */
data class ThematicQuranCategory(
    val id: String,
    val branchAr: String,           // "العقيدة والتوحيد", "العبادات والشعائر", "الأخلاق وتزكية النفوس", "الأحكام والسنن"
    val topicTitleAr: String,
    val saadiPrincipleTitleAr: String,
    val saadiPrincipleExplanationAr: String,
    val relatedAyahKeys: List<String>,
    val comparativeInsightAr: String,
    val sourceCitation: String
)

/**
 * Phase 4: Quranic Stories Atlas & Makki/Madani Revelation Context.
 */
data class QuranicStoryAtlasItem(
    val id: String,
    val storyTitleAr: String,
    val centralFiguresAr: String,
    val primarySurahNameAr: String,
    val surahNumber: Int,
    val ayahRangeAr: String,
    val revelationPlaceAr: String,   // "مكية" | "مدنية"
    val historicalLocationAr: String,
    val centralMaqsadAr: String,
    val pedagogicalLessons: List<String>,
    val sourceCitation: String
)

/**
 * Phase 4: Morphological Root Entry for Root-Based Quranic Search.
 */
data class MorphologicalRootEntry(
    val rootId: String,
    val rootSpacedAr: String,        // e.g. "ر ح م"
    val rootPlainAr: String,         // e.g. "رحم"
    val raghibCoreMeaningAr: String,
    val derivativesWithAyahs: List<Pair<String, String>>, // Pair(DerivativeWord, AyahReferenceAndSnippet)
    val relatedCompositeKeys: List<String>,
    val sourceCitation: String
)

/**
 * Phase 4: Waqf & Ibtida' Classification & Interactive Lab Models.
 */
enum class WaqfTypeCategory(
    val labelAr: String,
    val mushafSignAr: String,
    val rulingSummaryAr: String
) {
    LAZIM(
        labelAr = "الوقف اللازم (البياني)",
        mushafSignAr = "مـ",
        rulingSummaryAr = "يلزم الوقف عليه لأن الوصل يوهم معنى غير مراد، ويبتدأ بما بعده."
    ),
    TAM(
        labelAr = "الوقف التام",
        mushafSignAr = "قلى",
        rulingSummaryAr = "الوقف على كلام تم معناه ولم يتعلق بما بعده لا لفظاً ولا معنى، يحسن الوقف عليه والابتداء بما بعده."
    ),
    KAFI(
        labelAr = "الوقف الكافي",
        mushafSignAr = "ج / قلى",
        rulingSummaryAr = "الوقف على كلام تم معناه وتعلق بما بعده معنى لا لفظاً (إعراباً)، يحسن الوقف عليه والابتداء بما بعده."
    ),
    HASAN(
        labelAr = "الوقف الحسن",
        mushafSignAr = "صلى",
        rulingSummaryAr = "الوقف على كلام تم معناه وتعلق بما بعده لفظاً ومعنى؛ يجوز الوقف عليه ولا يحسن الابتداء بما بعده إلا على رأس آية."
    ),
    QABIH(
        labelAr = "الوقف القبيح",
        mushafSignAr = "لا",
        rulingSummaryAr = "الوقف على ما لم يتم معناه لشدة تعلقه بما بعده لفظاً ومعنى، أو ما يفسد المعنى؛ لا يجوز تعمده إلا لضرورة انقطاع نفس."
    )
}

data class WaqfAndIbtidaExample(
    val id: String,
    val waqfCategory: WaqfTypeCategory,
    val surahNameAr: String,
    val ayahNumber: Int,
    val uthmaniWithMarker: String,
    val stopWordTargetAr: String,
    val ibtidaRuleAr: String,
    val grammaticalAndSemanticAnalysisAr: String,
    val jazariyyahEvidenceAr: String,
    val interactiveQuestionAr: String,
    val optionsAr: List<String>,
    val correctOptionIndex: Int
)

/**
 * Phase 4: Special Performance Rules in Hafs 'an 'Asim (Sakt, Rawm, Ishmam, Imalah, Tasheel).
 */
data class HafsSpecialPerformanceItem(
    val id: String,
    val categoryAr: String,          // "السكتات الأربع الواجبة", "السكتات الجائزة", "الروم والإشمام", "الإمالة والتسهيل والاختلاس"
    val titleAr: String,
    val surahAndAyahAr: String,
    val uthmaniSnippetAr: String,
    val definitionAndPerformanceAr: String,
    val acousticCoachingTipAr: String,
    val shatibiyyahAndJazariyyahEvidenceAr: String
)

/**
 * Phase 4: Specialized Quranic Sciences Modules (Naskh, Asbab Al-Nuzul, I'rab Al-Jumal).
 */
data class SpecializedScienceModule(
    val id: String,
    val disciplineAr: String,        // "الناسخ والمنسوخ" | "ضوابط أسباب النزول" | "إعراب الجمل القرآنية"
    val titleAr: String,
    val foundationalRuleAr: String,
    val detailedExplanationAr: String,
    val quranicExampleUthmani: String,
    val sourceCitation: String
)

/**
 * Phase 5: Uthmani Orthography (الرسم العثماني), Diacritical Dabt (علم الضبط), and Verse Counting (علم الفواصل وعد الآي).
 */
data class UthmaniOrthographyRule(
    val id: String,
    val categoryAr: String,          // "القواعد الست للرسم العثماني" | "علم الضبط وعلامات المصحف" | "علم الفواصل وعدّ الآي"
    val ruleTitleAr: String,
    val uthmaniWordExample: String,
    val standardImlaiComparison: String,
    val surahAndAyahRefAr: String,
    val scholarlySecretAndRuleAr: String,
    val qiraatConnectionAr: String,
    val sourceCitation: String
)

/**
 * Phase 5: Science of Surah & Ayah Cohesion (علم المناسبات بين الآيات والسور) & Memorization Anchors (روابط تثبيت الحفظ).
 */
data class SurahMunasabahAndAnchor(
    val id: String,
    val surahNumber: Int,
    val surahNameAr: String,
    val openingAndClosingHarmonyAr: String,
    val connectionWithPreviousSurahAr: String,
    val hifzSequentialAnchors: List<String>,
    val sourceCitation: String
)

/**
 * Phase 5: Ten Canonical Qira'at Imams & 20 Narrators Lineage Tree (شجرة أسانيد القراء العشرة ورواتهم العشرين).
 */
data class QiraatImamIsnadNode(
    val id: String,
    val imamRankNumber: Int,         // 1..10
    val imamNameAndCityAr: String,   // e.g. "١. الإمام نافع المدني (ت ١٦٩ هـ)"
    val firstRawiAr: String,
    val secondRawiAr: String,
    val sahabiSanadChainAr: String,  // Chain up to the Companions & Prophet ﷺ
    val distinctMethodologySummaryAr: String,
    val sourceCitation: String
)

/**
 * Phase 6: Science of Polysemous Quranic Terms (علم الوجوه والنظائر في القرآن الكريم).
 */
data class WujuhMeaningWitness(
    val meaningTitleAr: String,
    val uthmaniWitnessAr: String,
    val surahAndAyahRefAr: String,
    val targetSurahNumber: Int
)

data class WujuhWaNazairEntry(
    val id: String,
    val quranicTermAr: String,
    val rootAr: String,
    val summaryAr: String,
    val meanings: List<WujuhMeaningWitness>,
    val sourceCitation: String
)

/**
 * Phase 6: Rhetorical & Linguistic Distinctions between Near-Synonyms (الفروق اللغوية ولطائف البيان القرآني).
 */
data class QuranicLinguisticFurukEntry(
    val id: String,
    val pairTitleAr: String,
    val firstTermAr: String,
    val firstTermMeaningAndWitnessAr: String,
    val secondTermAr: String,
    val secondTermMeaningAndWitnessAr: String,
    val rhetoricalSecretAr: String,
    val sourceCitation: String
)

/**
 * Phase 6: Interactive Mutashabihat Hifz Drill & Mnemonic Anchor (مختبر وتدريب ضبط المتشابهات اللفظية).
 */
data class MutashabihatDrillExercise(
    val id: String,
    val categoryAr: String,
    val questionPromptAr: String,
    val firstAyahSnippetAr: String,
    val secondAyahSnippetAr: String,
    val options: List<String>,
    val correctOptionIndex: Int,
    val mnemonicAnchorRuleAr: String,
    val sourceCitation: String
)

/**
 * Phase 6: Breath Control & Long-Ayah Recitation Endurance Drill (مدرب ضبط النَّفَس والوقفات في الآيات الطوال).
 */
data class BreathAndEnduranceDrill(
    val id: String,
    val titleAr: String,
    val surahAndAyahRefAr: String,
    val targetBreathSeconds: Int,
    val segmentedStopsAr: List<String>,
    val resumptionRuleAfterBreathStopAr: String,
    val vocalTipAr: String,
    val sourceCitation: String
)





