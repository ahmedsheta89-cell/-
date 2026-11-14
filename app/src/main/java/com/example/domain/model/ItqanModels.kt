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

