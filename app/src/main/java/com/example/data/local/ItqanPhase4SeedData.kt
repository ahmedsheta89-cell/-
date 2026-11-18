package com.example.data.local

import com.example.domain.model.HafsSpecialPerformanceItem
import com.example.domain.model.MorphologicalRootEntry
import com.example.domain.model.QuranicStoryAtlasItem
import com.example.domain.model.QuizQuestion
import com.example.domain.model.SpecializedScienceModule
import com.example.domain.model.ThematicQuranCategory
import com.example.domain.model.WaqfAndIbtidaExample
import com.example.domain.model.WaqfTypeCategory

object ItqanPhase4SeedData {

    /**
     * Phase 4: Thematic Quran Index linked to Al-Qawa'id Al-Hisan by Imam Al-Sa'di.
     */
    val thematicQuranIndex: List<ThematicQuranCategory> = listOf(
        ThematicQuranCategory(
            id = "theme_tawheed_asma",
            branchAr = "العقيدة والتوحيد",
            topicTitleAr = "توحيد الربوبية والألوهية والأسماء الحسنى",
            saadiPrincipleTitleAr = "القاعدة الحسان (٥): دلالة الأسماء الحسنى بالمطابقة والتضمن والالتزام",
            saadiPrincipleExplanationAr = "كل اسم من أسماء الله الحسنى يدل على الذات والصفة الكاملة، وختم الآيات بالأسماء الحسنى يعلل الحكم المذكور في الآية.",
            relatedAyahKeys = listOf("1:1", "1:2", "2:255", "112:1", "112:2"),
            comparativeInsightAr = "جمعت آية الكرسي وسورة الإخلاص بين إثبات الكمال المطلق في القيومية والصمدية ونفي الشبيه والند.",
            sourceCitation = "القواعد الحسان لتفسير القرآن للسعدي • تفسير الطبري"
        ),
        ThematicQuranCategory(
            id = "theme_ibadah_isti_anah",
            branchAr = "العبادات والشعائر",
            topicTitleAr = "الجمع بين الإخلاص في العبادة والاستعانة والتوكل",
            saadiPrincipleTitleAr = "القاعدة الحسان (١٢): اقتران العبادة بالتوكل والاستعانة في القرآن",
            saadiPrincipleExplanationAr = "العبادة بلا استعانة عجز، والاستعانة بلا عبادة تفريط؛ ولهذا قرن الله بينهما في الفاتحة وسورة هود والملك.",
            relatedAyahKeys = listOf("1:5", "1:6", "73:4", "97:1"),
            comparativeInsightAr = "تقديم المعمول في ﴿إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ﴾ يفيد قصر العبادة والاستعانة على الله وحده.",
            sourceCitation = "القواعد الحسان للسعدي • مدارج السالكين لابن القيم"
        ),
        ThematicQuranCategory(
            id = "theme_akhlaq_sabr",
            branchAr = "الأخلاق وتزكية النفوس",
            topicTitleAr = "فقه الوقت والعمل الصالح والتواصي بالحق والصبر",
            saadiPrincipleTitleAr = "القاعدة الحسان (٢١): إطلاق الإيمان والعمل الصالح يشمل الدين كله",
            saadiPrincipleExplanationAr = "إذا اقترن الإيمان بالعمل الصالح انصرف الإيمان لما في القلوب من العقائد، والعمل الصالح لشرائع الجوارح والأخلاق.",
            relatedAyahKeys = listOf("103:1", "103:2", "103:3", "67:2"),
            comparativeInsightAr = "سورة العصر ميزان شامل لنجاة الفرد والأمة بتكامل العلم والعمل والدعوة والصبر.",
            sourceCitation = "تفسير ابن كثير • القواعد الحسان للسعدي"
        ),
        ThematicQuranCategory(
            id = "theme_istiadhah_tahassun",
            branchAr = "الأحكام والسنن",
            topicTitleAr = "التحصن بالله من الشرور الظاهرة والباطنة والوساوس",
            saadiPrincipleTitleAr = "القاعدة الحسان (٣٤): مقابلة الشرور بصفات الربوبية والملك والإلهية",
            saadiPrincipleExplanationAr = "في سورة الفلق استعيذ بصفة الربوبية من الشرور الخارجية، وفي سورة الناس استعيذ بالرب والملك والإله من الشر الداخلي (الوسواس).",
            relatedAyahKeys = listOf("113:1", "113:2", "114:1", "114:4"),
            comparativeInsightAr = "الجمع بين المعوذتين يحقق كمال الوقاية من آفات الدنيا والدين.",
            sourceCitation = "بدائع الفوائد لابن القيم • تفسير السعدي"
        )
    )

    /**
     * Phase 4: Quranic Stories Atlas & Makki/Madani Revelation Context.
     */
    val quranicStoriesAtlas: List<QuranicStoryAtlasItem> = listOf(
        QuranicStoryAtlasItem(
            id = "story_ashab_al_kahf",
            storyTitleAr = "قصة فتية أصحاب الكهف (فتنة الدين والثبات على التوحيد)",
            centralFiguresAr = "الفتية المؤمنون في زمن الملك دقيانوس",
            primarySurahNameAr = "الكهف",
            surahNumber = 18,
            ayahRangeAr = "الآيات ٩ - ٢٦",
            revelationPlaceAr = "مكية",
            historicalLocationAr = "الرقيم / أفسس (بلاد الروم القديمة)",
            centralMaqsadAr = "تثبيت الفئة المؤمنة المستضعفة وبيان أن من يأوي إلى الله يهيئ له من أمره مرفقاً ورشداً.",
            pedagogicalLessons = listOf(
                "الاعتزاز بعقيدة التوحيد: ﴿إِنَّهُمْ فِتْيَةٌ آمَنُوا بِرَبِّهِمْ وَزِدْنَاهُمْ هُدًى﴾.",
                "الفرار بالدين عند خوف الفتنة مع التوكل على الله وطلب الرحمة والرشد.",
                "بركة الصحبة الصالحة حتى نال كلبهم الذكر في القرآن لمرافقته الصالحين."
            ),
            sourceCitation = "تفسير ابن كثير • البداية والنهاية • الإتقان للسيوطي"
        ),
        QuranicStoryAtlasItem(
            id = "story_musa_and_khadir",
            storyTitleAr = "قصة كليم الله موسى مع العبد الصالح الخضر (فتنة العلم والقدر)",
            centralFiguresAr = "نبي الله موسى عليه السلام، وفتاه يوشع بن نون، والخضر",
            primarySurahNameAr = "الكهف",
            surahNumber = 18,
            ayahRangeAr = "الآيات ٦٠ - ٨٢",
            revelationPlaceAr = "مكية",
            historicalLocationAr = "مجمع البحرين (ملتقى بحر القلزم وبحر الروم)",
            centralMaqsadAr = "الأدب في طلب العلم، والتسليم لحكمة أقدار الله الخفية التي قد يظهر ظاهرها مؤلماً وباطنها رحمة محضة.",
            pedagogicalLessons = listOf(
                "تواضع العلماء ورحلتهم في طلب العلم: ﴿هَلْ أَتَّبِعُكَ عَلَىٰ أَن تُعَلِّمَنِ مِمَّا عُلِّمْتَ رُشْدًا﴾.",
                "تأدب الخضر مع الله في نسبة العيب لنفسه ﴿فَأَرَدتُّ أَنْ أَعِيبَهَا﴾ ونسبة الخير لله ﴿فَأَرَادَ رَبُّكَ﴾.",
                "صلاح الآباء يحفظ الأبناء: ﴿وَكَانَ أَبُوهُمَا صَالِحًا﴾."
            ),
            sourceCitation = "صحيح البخاري • تفسير الطبري • تفسير السعدي"
        ),
        QuranicStoryAtlasItem(
            id = "story_ashab_al_qaryah",
            storyTitleAr = "قصة أصحاب القرية ومؤمن آل يس (التضحية في سبيل الدعوة)",
            centralFiguresAr = "المرسلون الثلاثة، والرجل الصالح (حبيب النجار)",
            primarySurahNameAr = "يس",
            surahNumber = 36,
            ayahRangeAr = "الآيات ١٣ - ٣٢",
            revelationPlaceAr = "مكية",
            historicalLocationAr = "أنطاكية (على قول جمهور المفسرين)",
            centralMaqsadAr = "بيان عاقبة المكذبين للرسل وكرامة الداعية المخلص الذي نصح قومه حياً وتمنى هدايتهم بعد استشهاده.",
            pedagogicalLessons = listOf(
                "المبادرة لنصرة الحق من أقصى المدينة: ﴿وَجَاءَ مِنْ أَقْصَى الْمَدِينَةِ رَجُلٌ يَسْعَىٰ﴾.",
                "معيار صدق الدعاة: ﴿اتَّبِعُوا مَن لَّا يَسْأَلُكُمْ أَجْرًا وَهُم مُّهْتَدُونَ﴾.",
                "سلامة صدر المؤمن على قومه حتى بعد دخوله الجنة: ﴿قِيلَ ادْخُلِ الْجَنَّةَ قَالَ يَا لَيْتَ قَوْمِي يَعْلَمُونَ﴾."
            ),
            sourceCitation = "تفسير ابن كثير • التحرير والتنوير لابن عاشور"
        )
    )

    /**
     * Phase 4: Morphological Root Search Catalog (البحث بالجذر اللغوي الصرفي).
     */
    val morphologicalRootsCatalog: List<MorphologicalRootEntry> = listOf(
        MorphologicalRootEntry(
            rootId = "root_r_h_m",
            rootSpacedAr = "ر ح م",
            rootPlainAr = "رحم",
            raghibCoreMeaningAr = "الرحمة: رقة تقتضي الإحسان إلى المرحوم، وتستعمل تارة في الرقة المجردة وتارة في الإحسان المجرد عن الرقة؛ فإذا وُصف بها الباري عز وجل فالمراد الإحسان والإنعام لا الرقة الجبلية.",
            derivativesWithAyahs = listOf(
                "الرَّحْمَٰنِ" to "﴿بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ﴾ [الفاتحة: ١] — ذو الرحمة الواسعة لجميع الخلق",
                "الرَّحِيمِ" to "﴿الرَّحْمَٰنِ الرَّحِيمِ﴾ [الفاتحة: ٣] — الموصل رحمته الخاصة بالمؤمنين",
                "رَحْمَةً" to "﴿آتَيْنَاهُ رَحْمَةً مِّنْ عِندِنَا﴾ [الكهف: ٦٥] — النبوة والعلم اللدني النافع",
                "مَرْحَمَةٍ" to "﴿وَتَوَاصَوْا بِالصَّبْرِ وَتَوَاصَوْا بِالْمَرْحَمَةِ﴾ [البلد: ١٧]"
            ),
            relatedCompositeKeys = listOf("1:1", "1:3", "55:1"),
            sourceCitation = "المفردات في غريب القرآن للراغب الأصفهاني — مادة (رحم)"
        ),
        MorphologicalRootEntry(
            rootId = "root_a_b_d",
            rootSpacedAr = "ع ب د",
            rootPlainAr = "عبد",
            raghibCoreMeaningAr = "العبودية: إظهار التذلل والخضوع، والعبادة أبلغ منها لأنها غاية التذلل مع غاية المحبة، ولا يستحقها إلا من له غاية الإفضال وهو الله تعالى.",
            derivativesWithAyahs = listOf(
                "نَعْبُدُ" to "﴿إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ﴾ [الفاتحة: ٥] — نخصك بالعبادة والخضوع",
                "عَبْدِهِ" to "﴿الْحَمْدُ لِلَّهِ الَّذِي أَنزَلَ عَلَىٰ عَبْدِهِ الْكِتَابَ﴾ [الكهف: ١] — أشرف مقامات النبي ﷺ",
                "عِبَادُ" to "﴿وَعِبَادُ الرَّحْمَٰنِ الَّذِينَ يَمْشُونَ عَلَى الْأَرْضِ هَوْنًا﴾ [الفرقان: ٦٣]"
            ),
            relatedCompositeKeys = listOf("1:5", "18:1"),
            sourceCitation = "المفردات في غريب القرآن للراغب الأصفهاني — مادة (عبد)"
        ),
        MorphologicalRootEntry(
            rootId = "root_s_m_d",
            rootSpacedAr = "ص م د",
            rootPlainAr = "صمد",
            raghibCoreMeaningAr = "الصمد: السيد المقصود في الحوائج كلها، والمصمت الذي لا جوف له؛ فالله الصمد الذي يصمد إليه الخلائق في كل حاجة لعظيم كماله وغناه المطلق.",
            derivativesWithAyahs = listOf(
                "الصَّمَدُ" to "﴿اللَّهُ الصَّمَدُ﴾ [الإخلاص: ٢] — لم يرد هذا الجذر في القرآن إلا في هذا الموضع الفريد"
            ),
            relatedCompositeKeys = listOf("112:2"),
            sourceCitation = "المفردات في غريب القرآن للراغب الأصفهاني — مادة (صمد)"
        ),
        MorphologicalRootEntry(
            rootId = "root_f_l_q",
            rootSpacedAr = "ف ل ق",
            rootPlainAr = "فلق",
            raghibCoreMeaningAr = "الفَلْق: شق الشيء وإبانة بعضه عن بعض، ومنه فلق الصبح وفلق الحب والنوى لإخراج الحياة.",
            derivativesWithAyahs = listOf(
                "الْفَلَقِ" to "﴿قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ﴾ [الفلق: ١] — الصبح المنفلق من ظلمة الليل",
                "فَالِقُ" to "﴿إِنَّ اللَّهَ فَالِقُ الْحَبِّ وَالنَّوَىٰ﴾ [الأنعام: ٩٥]"
            ),
            relatedCompositeKeys = listOf("113:1"),
            sourceCitation = "المفردات في غريب القرآن للراغب الأصفهاني — مادة (فلق)"
        ),
        MorphologicalRootEntry(
            rootId = "root_q_d_r",
            rootSpacedAr = "ق د ر",
            rootPlainAr = "قدر",
            raghibCoreMeaningAr = "القَدْر والتقدير: بيان كمية الشيء ومقداره وحكمته، والقَدْر أيضاً الشرف والعظمة ومنه ليلة القدر.",
            derivativesWithAyahs = listOf(
                "الْقَدْرِ" to "﴿إِنَّا أَنزَلْنَاهُ فِي لَيْلَةِ الْقَدْرِ﴾ [القدر: ١] — ليلة الشرف والتقدير الحولي",
                "قَدِيرٌ" to "﴿وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ﴾ [الملك: ١] — تام القدرة بلا عجز"
            ),
            relatedCompositeKeys = listOf("97:1", "97:2", "97:3", "67:1"),
            sourceCitation = "المفردات في غريب القرآن للراغب الأصفهاني — مادة (قدر)"
        )
    )

    /**
     * Phase 4: Interactive Waqf & Ibtida' Lab Examples & Quizzes.
     */
    val waqfAndIbtidaExamples: List<WaqfAndIbtidaExample> = listOf(
        WaqfAndIbtidaExample(
            id = "waqf_lazim_1",
            waqfCategory = WaqfTypeCategory.LAZIM,
            surahNameAr = "الأنعام",
            ayahNumber = 36,
            uthmaniWithMarker = "إِنَّمَا يَسْتَجِيبُ الَّذِينَ يَسْمَعُونَ  وَالْمَوْتَىٰ يَبْعَثُهُمُ اللَّهُ",
            stopWordTargetAr = "يَسْمَعُونَ ",
            ibtidaRuleAr = "يلزم الوقف على ﴿يَسْمَعُونَ﴾ والابتداء بـ ﴿وَالْمَوْتَىٰ يَبْعَثُهُمُ اللَّهُ﴾.",
            grammaticalAndSemanticAnalysisAr = "لو وُصلت الكلمة لتُوُهِّم أن الموتى معطوفون على الذين يسمعون في الاستجابة في الدنيا، بينما الجملة الثانية مستأنفة.",
            jazariyyahEvidenceAr = "وَبَعْدَ تَجْوِيدِكَ لِلْحُرُوفِ ... لاَبُدَّ مِنْ مَعْرِفَةِ الْوُقُوفِ / وَالابْتِدَاءِ وَهْيَ تُقْسَمُ إِذَنْ ... ثَلاَثَةً تَامٌّ وَكَافٍ وَحَسَنْ",
            interactiveQuestionAr = "ما حكم الوقف على كلمة ﴿يَسْمَعُونَ ﴾ وعلامتها الميم الأفقية في المصحف؟",
            optionsAr = listOf(
                "وقف لازم بياني، لأن الوصل يوهم عطف الموتى على المستجيبين",
                "وقف قبيح يمنع الوقف عليه",
                "وقف حسن لا يجوز الابتداء بما بعده"
            ),
            correctOptionIndex = 0
        ),
        WaqfAndIbtidaExample(
            id = "waqf_tam_1",
            waqfCategory = WaqfTypeCategory.TAM,
            surahNameAr = "الفاتحة",
            ayahNumber = 4,
            uthmaniWithMarker = "مَالِكِ يَوْمِ الدِّينِ ۝ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
            stopWordTargetAr = "مَالِكِ يَوْمِ الدِّينِ",
            ibtidaRuleAr = "وقف تام على رأس الآية لانتهاء الثناء على الله والانتقال إلى الخطاب والدعاء، يحسن الوقف عليه والابتداء بما بعده.",
            grammaticalAndSemanticAnalysisAr = "انقطع التعلق اللفظي (الإعرابي) والمعنوي بانتهاء جمل الثناء بالغيبة والانتقال إلى الحضور والخطاب في ﴿إِيَّاكَ نَعْبُدُ﴾.",
            jazariyyahEvidenceAr = "فَالتَّامُّ مَا تَمَّ وَلاَ تَعَلُّقَا ... بِمَا يَلِيهِ لَفْظاً اوْ مَعْناً بَقَى",
            interactiveQuestionAr = "لماذا عُدَّ الوقف على ﴿مَالِكِ يَوْمِ الدِّينِ﴾ وقفاً تاماً؟",
            optionsAr = listOf(
                "لتمام المعنى وانقطاع التعلق اللفظي والمعنوي بالانتقال من الغيبة للخطاب",
                "لأن ما بعده نعت لما قبله",
                "لأنه وقف اضطراري فقط"
            ),
            correctOptionIndex = 0
        ),
        WaqfAndIbtidaExample(
            id = "waqf_kafi_1",
            waqfCategory = WaqfTypeCategory.KAFI,
            surahNameAr = "البقرة",
            ayahNumber = 255,
            uthmaniWithMarker = "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ",
            stopWordTargetAr = "الْحَيُّ الْقَيُّومُ ۚ",
            ibtidaRuleAr = "وقف كافٍ؛ يحسن الوقف عليه والابتداء بـ ﴿لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ﴾.",
            grammaticalAndSemanticAnalysisAr = "تم الكلام إعراباً عند ﴿الْقَيُّومُ﴾، وما بعده متعلق به من جهة المعنى (بيان كمال حياته وقيوميته) لا من جهة الإعراب.",
            jazariyyahEvidenceAr = "وَهْوَ لِمَا تَمَّ فَإِنْ لَمْ يُوجَدِ ... تَعَلُّقٌ أَوْ كَانَ مَعْنًى فَابْتَدِي / فَالتَّامُّ فَالكَافِي...",
            interactiveQuestionAr = "ما العلاقة بين الجملة بعد الوقف الكافي وما قبلها؟",
            optionsAr = listOf(
                "تعلق معنوي فقط مع استقلال الإعراب، فيحسن الوقف والابتداء بما بعده",
                "تعلق لفظي كالمضاف والمضاف إليه",
                "لا يوجد أي تعلق معنوي أو لفظي"
            ),
            correctOptionIndex = 0
        ),
        WaqfAndIbtidaExample(
            id = "waqf_hasan_1",
            waqfCategory = WaqfTypeCategory.HASAN,
            surahNameAr = "الفاتحة",
            ayahNumber = 2,
            uthmaniWithMarker = "الْحَمْدُ لِلَّهِ (وقف حسن) رَبِّ الْعَالَمِينَ",
            stopWordTargetAr = "الْحَمْدُ لِلَّهِ",
            ibtidaRuleAr = "الوقف على ﴿الْحَمْدُ لِلَّهِ﴾ حسن لإفادته معنى تاماً، لكن لا يحسن الابتداء بـ ﴿رَبِّ الْعَالَمِينَ﴾ وحدها لأنها نعت مجرور تابع لما قبله، إلا إذا كان الوقف على رأس آية مثل ﴿الْعَالَمِينَ ۝﴾.",
            grammaticalAndSemanticAnalysisAr = "تعلق ما بعده بما قبله لفظاً (نعت ومنعوت) ومعنى، ولذلك سُمي حسناً في الوقف دون الابتداء بغير رؤوس الآي.",
            jazariyyahEvidenceAr = "وَلَفْظاً امْنَعَنْ ... إِلاَّ رُؤُوسَ الآيِ جَوِّزْ فَالْحَسَنْ",
            interactiveQuestionAr = "إذا وقف القارئ على ﴿الْحَمْدُ لِلَّهِ﴾، فما حكم الابتداء بكلمة ﴿رَبِّ الْعَالَمِينَ﴾ مباشرة؟",
            optionsAr = listOf(
                "لا يحسن الابتداء بها وحدها لتعلقها الإعرابي بما قبلها، بل يعود فيصلها بـ ﴿الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ﴾",
                "يجب الابتداء بها مع رفع الباء",
                "الوقف على الحمد لله قبيح لا يجوز"
            ),
            correctOptionIndex = 0
        ),
        WaqfAndIbtidaExample(
            id = "waqf_qabih_1",
            waqfCategory = WaqfTypeCategory.QABIH,
            surahNameAr = "الماعون",
            ayahNumber = 4,
            uthmaniWithMarker = "فَوَيْلٌ لِّلْمُصَلِّينَ (لا يوقف هنا اختياراً إلا مع الوصل ببيانهم) ۝ الَّذِينَ هُمْ عَن صَلَاتِهِمْ سَاهُونَ",
            stopWordTargetAr = "بِسْمِ (دون الله) أو فَوَيْلٌ لِّلْمُصَلِّينَ (مع قطع القراءة)",
            ibtidaRuleAr = "الوقف على المضاف دون المضاف إليه أو المبتدأ دون الخبر أو ما يقلب المعنى وقف قبيح، لا يُقف عليه إلا لضرورة انقطاع نفس ثم يعود لما قبله.",
            grammaticalAndSemanticAnalysisAr = "لعدم تمام الكلام أو لإيهام معنى فاسد لم يرده الله عز وجل.",
            jazariyyahEvidenceAr = "وَغَيْرُ مَا تَمَّ قَبِيحٌ وَلَهُ ... يُوقَفُ مُضْطَرّاً وَيُبْدَا قَبْلَهُ / وَلَيْسَ فِي الْقُرْآنِ مِنْ وَقْفٍ وَجَبْ ... وَلاَ حَرَامٌ غَيْرَ مَا لَهُ سَبَبْ",
            interactiveQuestionAr = "ماذا يفعل القارئ إذا انقطع نفسه اضطراراً على موضع وقف قبيح؟",
            optionsAr = listOf(
                "يرجع إلى الكلمة أو الجملة السابقة التي يحسن الابتداء بها ليتم المعنى",
                "يكمل مما بعده مباشرة دون رجوع",
                "يعيد السورة من أولها وجوباً"
            ),
            correctOptionIndex = 0
        )
    )

    /**
     * Phase 4: Special Performance Rules in Hafs 'an 'Asim (السكتات الأربع، الروم والإشمام، الإمالة والتسهيل).
     */
    val hafsSpecialPerformanceCatalog: List<HafsSpecialPerformanceItem> = listOf(
        HafsSpecialPerformanceItem(
            id = "hafs_sakt_4_obligatory",
            categoryAr = "السكتات الأربع الواجبة",
            titleAr = "السكتات الأربع الواجبة لحفص من طريق الشاطبية",
            surahAndAyahAr = "الكهف (١-٢) • يس (٥٢) • القيامة (٢٧) • المطففين (١٤)",
            uthmaniSnippetAr = "١) ﴿عِوَجًا ۜ قَيِّمًا﴾  ٢) ﴿مِن مَّرْقَدِنَا ۜ هَٰذَا﴾  ٣) ﴿وَقِيلَ مَنْ ۜ رَاقٍ﴾  ٤) ﴿كَلَّا بَلْ ۜ رَانَ﴾",
            definitionAndPerformanceAr = "السكت هو قطع الصوت زمناً يسيراً (حركتين تقريباً) من غير تنفس بنية استئناف القراءة في حال الوصل، وعلامته في المصحف حرف (س) صغير فوق الكلمة.",
            acousticCoachingTipAr = "في ﴿عِوَجًا ۜ﴾ نقف بألف العوض سكتاً دون تنفس ثم نبدأ ﴿قَيِّمًا﴾؛ وفي ﴿مَنْ ۜ رَاقٍ﴾ و﴿بَلْ ۜ رَانَ﴾ يمنع السكتُ إدغامَ النون واللام في الراء.",
            shatibiyyahAndJazariyyahEvidenceAr = "وَسَكْتَةُ حَفْصٍ دُونَ قَطْعٍ لَطِيفَةٌ ... عَلَى أَلِفِ التَّنْوِينِ فِي عِوَجًا بَلاَ / وَفِي نُونِ مَنْ رَاقٍ وَمَرْقَدِنَا وَلاَمِ بَلْ رَانَ (الشاطبية)"
        ),
        HafsSpecialPerformanceItem(
            id = "hafs_sakt_2_permissible",
            categoryAr = "السكتات الجائزة",
            titleAr = "السكتتان الجائزتان لحفص (الحاقة، وبين الأنفال والتوبة)",
            surahAndAyahAr = "الحاقة (٢٨-٢٩) • بين الأنفال والتوبة",
            uthmaniSnippetAr = "﴿مَا أَغْنَىٰ عَنِّي مَالِيَهْ ۜ ۝ هَلَكَ عَنِّي سُلْطَانِيَهْ﴾",
            definitionAndPerformanceAr = "يجوز لحفص عند وصل ﴿مَالِيَهْ﴾ بـ ﴿هَلَكَ﴾ وجهان: السكت اللطيف مع إظهار الهاء (وهو المقدم أداءً)، أو الإدغام المتماثلين. وبين الأنفال والتوبة ثلاثة أوجه: القطع، السكت، الوصل.",
            acousticCoachingTipAr = "احرص عند وجه السكت في ﴿مَالِيَهْ﴾ على بيان همس الهاء الساكنة سكتاً لطيفاً بلا تنفس ثم انطق ﴿هَلَكَ﴾.",
            shatibiyyahAndJazariyyahEvidenceAr = "وَمَالِيَهْ هَلَكَ عَنِّي سَكْتُهُ مُقَدَّمُ ... وَالإِدْغَامُ أَيْضاً جَائِزٌ فَتَأَمَّلاَ"
        ),
        HafsSpecialPerformanceItem(
            id = "hafs_rawm_and_ishmam",
            categoryAr = "الروم والإشمام",
            titleAr = "الروم والإشمام في الوقف وفي كلمة ﴿تَأْمَنَّا﴾",
            surahAndAyahAr = "يوسف (١١) • وأواخر الكلم المرفوعة والمضمومة والمكسورة",
            uthmaniSnippetAr = "﴿مَا لَكَ لَا تَأْمَنَّا عَلَىٰ يُوسُفَ﴾ • الوقف على ﴿نَسْتَعِينُ﴾",
            definitionAndPerformanceAr = "الروم: الإتيان ببعض الحركة (ثلثها) بصوت خفي يسمعه القريب دون البعيد ويدخل في المرفوع والمكسور. الإشمام: ضم الشفتين بعيد تسكين الحرف إشارةً للضم بلا صوت يراه المبصر فقط.",
            acousticCoachingTipAr = "في ﴿تَأْمَنَّا﴾ أصلها (تأمنُنا) بنونين، فيُؤدى فيها الإشمام (ضم الشفتين مقارناً للغنة) أو الروم (الاختلاس النطقي بثلثي ضمة النون الأولى).",
            shatibiyyahAndJazariyyahEvidenceAr = "وَحَاذِرْ بِوَقْفٍ كُلَّ حَرَكَةٍ إِذَا ... إِلاَّ إِذَا رُمْتَ فَبَعْضُ حَرَكَهْ / إِلاَّ بِفَتْحٍ أَوْ بِنَصْبٍ وَأَشِمْ ... إِشَارَةً بِالضَّمِّ فِي رَفْعٍ وَضَمْ (المقدمة الجزرية)"
        ),
        HafsSpecialPerformanceItem(
            id = "hafs_imalah_tasheel_duaf",
            categoryAr = "الإمالة والتسهيل والاختلاس",
            titleAr = "الإمالة الكبرى في ﴿مَجْرَاهَا﴾ والتسهيل في ﴿أَأَعْجَمِيٌّ﴾",
            surahAndAyahAr = "هود (٤١) • فصلت (٤٤) • الروم (٥٤)",
            uthmaniSnippetAr = "﴿بِسْمِ اللَّهِ مَجْر۪ىٰهَا﴾ • ﴿ءَاعْجَمِيٌّ وَعَرَبِيٌّ﴾ • ﴿مِّن بَعْدِ ضَعْفٍ﴾",
            definitionAndPerformanceAr = "١) يميل حفص ألف ﴿مَجْر۪ىٰهَا﴾ إمالة كبرى نحو الياء مع ترقيق الراء. ٢) يسهل الهمزة الثانية من ﴿ءَاعْجَمِيٌّ﴾ بين الهمزة والألف. ٣) يقرأ ﴿ضَعْفٍ﴾ في الروم بفتح الضاد وضمها.",
            acousticCoachingTipAr = "في ﴿مَجْر۪ىٰهَا﴾ احذر فتح الألف أو نطقها ياءً خالصة، بل اجعلها بين الألف والياء تماماً مع ترقيق الراء.",
            shatibiyyahAndJazariyyahEvidenceAr = "وَحَفْصٌ مَجْرَاهَا أَمَالَ وَفِي فُصِّلَتْ ... أَأَعْجَمِيٌّ سَهِّلِ الثَّانِيَ كَيْ تَعْلاَ"
        )
    )

    /**
     * Phase 4: Specialized Quranic Sciences Modules (Naskh, Asbab Al-Nuzul, I'rab Al-Jumal).
     */
    val specializedScienceModules: List<SpecializedScienceModule> = listOf(
        SpecializedScienceModule(
            id = "mod_naskh_mansukh",
            disciplineAr = "الناسخ والمنسوخ",
            titleAr = "ضوابط الناسخ والمنسوخ وأقسامه الثلاثة عند المحققين",
            foundationalRuleAr = "النسخ لغةً: الإزالة أو النقل، واصطلاحاً: رفع الشارع حكماً شرعياً بدليل شرعي متأخر لحكمة التدرج في التشريع ومصلحة العباد.",
            detailedExplanationAr = "لا يدخل النسخ في الأخبار ولا في العقائد ولا في أصول الأخلاق، وإنما يدخل في الأوامر والنواهي الفرعية. وقد حرر الإمام السيوطي في «الإتقان» المنسوخ في القرآن في نحو عشرين آية فقط بعد استبعاد ما هو من باب التخصيص أو البيان.",
            quranicExampleUthmani = "﴿مَا نَنسَخْ مِنْ آيَةٍ أَوْ نُنسِهَا نَأْتِ بِخَيْرٍ مِّنْهَا أَوْ مِثْلِهَا﴾ [البقرة: ١٠٦]",
            sourceCitation = "الإتقان في علوم القرآن للسيوطي — النوع السابع والأربعون (في ناسخه ومنسوخه)"
        ),
        SpecializedScienceModule(
            id = "mod_asbab_nuzul_rules",
            disciplineAr = "ضوابط أسباب النزول",
            titleAr = "الصريح وغير الصريح وقاعدة عموم اللفظ وخصوص السبب",
            foundationalRuleAr = "«العبرة بعموم اللفظ لا بخصوص السبب» — فالحكم يتناول من نزلت فيه الآية وكل من اتصف بصفته إلى يوم القيامة.",
            detailedExplanationAr = "يُفرّق المحدثون والمفسرون بين صيغة (سبب نزول هذه الآية كذا) فهي نص صريح في السببية، وبين قول الصحابي (نزلت هذه الآية في كذا) فإنه قد يريد دخول هذه الصورة في معنى الآية وتفسيرها لا أنها سبب النزول الحادث.",
            quranicExampleUthmani = "﴿إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ ۝ فَصَلِّ لِرَبِّكَ وَانْحَرْ﴾ [الكوثر: ١-٢]",
            sourceCitation = "أسباب النزول للواحدي • مباحث في علوم القرآن لمنّاع القطان"
        ),
        SpecializedScienceModule(
            id = "mod_irab_al_jumal",
            disciplineAr = "إعراب الجمل القرآنية",
            titleAr = "الجمل التي لها محل من الإعراب والتي لا محل لها وأثرها في الوقف",
            foundationalRuleAr = "معرفة محل الجملة من الإعراب (حال، صفة، خبر، أو مستأنفة) هي الأساس العلمي لمعرفة الوقف التام والكافي والحسن.",
            detailedExplanationAr = "إذا كانت الجملة استئنافية لا محل لها من الإعراب (مثل ﴿لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ﴾ في آية الكرسي) جاز الوقف قبلها والابتداء بها (وقف كافٍ). أما إذا كانت الجملة نعتاً أو حالاً متعلقة بصاحبها لفظاً فالوصل أولى.",
            quranicExampleUthmani = "﴿ذَٰلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ﴾ [البقرة: ٢]",
            sourceCitation = "الدر المصون للسمين الحلبي • مغني اللبيب لابن هشام الأنصاري"
        )
    )

    /**
     * Phase 4: Comprehensive Simulation Exam for the Entire Quranic Sciences Encyclopedia.
     */
    val comprehensiveEncyclopediaExamQuestions: List<QuizQuestion> = listOf(
        QuizQuestion(
            id = "comp_exam_1",
            questionText = "ما حكم الوقف على كلمة ﴿الْحَمْدُ لِلَّهِ﴾ ثم الابتداء بكلمة ﴿رَبِّ الْعَالَمِينَ﴾ وحدها؟",
            optionsAr = listOf(
                "الوقف حسن، ولكن لا يحسن الابتداء بـ ﴿رَبِّ الْعَالَمِينَ﴾ وحدها لشدة تعلقها الإعرابي بما قبلها",
                "وقف لازم يجب الابتداء بما بعده",
                "وقف قبيح يحرم الوقف عليه"
            ),
            correctIndex = 0,
            explanation = "قال ابن الجزري: «وَلَفْظاً امْنَعَنْ إِلاَّ رُؤُوسَ الآيِ جَوِّزْ فَالْحَسَنْ»؛ لأن ﴿رَبِّ﴾ نعت تابع لاسم الجلالة.",
            sourceCitation = "المقدمة الجزرية لابن الجزري — باب الوقف والابتداء"
        ),
        QuizQuestion(
            id = "comp_exam_2",
            questionText = "كم عدد السكتات الواجبة في رواية حفص عن عاصم من طريق الشاطبية؟",
            optionsAr = listOf(
                "سكتتان فقط",
                "أربع سكتات واجبة (عوجا، مرقدنا، من راق، بل ران)",
                "سبع سكتات في السور السبع الطوال"
            ),
            correctIndex = 1,
            explanation = "السكتات الأربع الواجبة لحفص من الشاطبية هي: ﴿عِوَجًا ۜ قَيِّمًا﴾، ﴿مِن مَّرْقَدِنَا ۜ هَٰذَا﴾، ﴿وَقِيلَ مَنْ ۜ رَاقٍ﴾، ﴿كَلَّا بَلْ ۜ رَانَ﴾.",
            sourceCitation = "حرز الأماني ووجه التهاني (الشاطبية)"
        ),
        QuizQuestion(
            id = "comp_exam_3",
            questionText = "ما الكلمة الوحيدة في القرآن التي أمال فيها حفص عن عاصم الألف إمالة كبرى؟",
            optionsAr = listOf(
                "﴿مَجْر۪ىٰهَا﴾ في سورة هود الآية ٤١",
                "﴿الضُّحَىٰ﴾ في سورة الضحى",
                "﴿مُوسَىٰ﴾ في جميع مواضعها"
            ),
            correctIndex = 0,
            explanation = "لم يُمل حفص عن عاصم في القرآن كله إلا ألف ﴿بِسْمِ اللَّهِ مَجْر۪ىٰهَا وَمُرْسَاهَا﴾ في سورة هود مع ترقيق الراء.",
            sourceCitation = "النشر في القراءات العشر لابن الجزري"
        ),
        QuizQuestion(
            id = "comp_exam_4",
            questionText = "ما القاعدة الأصولية المعتمدة عند علماء القرآن في التعامل مع أسباب النزول؟",
            optionsAr = listOf(
                "العبرة بعموم اللفظ لا بخصوص السبب",
                "قصر حكم الآية على الشخص الذي نزلت فيه فقط",
                "النسخ يقع في الأخبار والقصص القرآني"
            ),
            correctIndex = 0,
            explanation = "القاعدة المقررة عند جمهور المفسرين والأصوليين أن العبرة بعموم اللفظ لا بخصوص السبب، ولا يدخل النسخ في الأخبار.",
            sourceCitation = "الإتقان في علوم القرآن للسيوطي • أسباب النزول للواحدي"
        )
    )

    private fun QuizQuestion(
        id: String,
        questionText: String,
        optionsAr: List<String>,
        correctIndex: Int,
        explanation: String,
        sourceCitation: String
    ): QuizQuestion = QuizQuestion(
        id = id,
        questionText = questionText,
        options = optionsAr,
        correctIndex = correctIndex,
        explanation = explanation,
        sourceCitation = sourceCitation
    )

    private fun escapeJson(raw: String): String =
        raw.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n")

    /**
     * Generates a complete JSON Backup Snapshot of the user's local Room progress, FSRS schedule,
     * recurring mistakes log, Tadabbur journal, bookmarks, and certificates.
     */
    fun buildFullBackupJson(
        studentName: String,
        streakDays: Int,
        memorizedVerses: List<QuranVerse>,
        fsrsReviews: List<FsrsReviewEntity>,
        mistakeLogs: List<MistakeLogEntity>,
        tadabburJournals: List<TadabburJournalEntity>,
        bookmarks: List<BookmarkNoteEntity>,
        certificates: List<CertificateEntity>
    ): String {
        val versesJson = memorizedVerses.joinToString(",\n    ") { v ->
            """{"compositeKey":"${escapeJson(v.compositeKey)}","surahNumber":${v.surahNumber},"ayahNumber":${v.ayahNumber},"isMemorized":${v.isMemorized},"memorizationScore":${v.memorizationScore},"recitationCount":${v.recitationCount}}"""
        }
        val fsrsJson = fsrsReviews.joinToString(",\n    ") { r ->
            """{"itemId":"${escapeJson(r.itemId)}","title":"${escapeJson(r.title)}","surahNumber":${r.surahNumber},"stability":${r.stability},"difficulty":${r.difficulty},"scheduledDays":${r.scheduledDays}}"""
        }
        val mistakesJson = mistakeLogs.joinToString(",\n    ") { m ->
            """{"mistakeId":"${escapeJson(m.mistakeId)}","expectedWord":"${escapeJson(m.expectedWord)}","spokenMistakeWord":"${escapeJson(m.spokenMistakeWord)}","occurrenceCount":${m.occurrenceCount},"isResolved":${m.isResolved}}"""
        }
        val tadabburJson = tadabburJournals.joinToString(",\n    ") { t ->
            """{"journalId":"${escapeJson(t.journalId)}","compositeKey":"${escapeJson(t.compositeKey)}","surahNameAr":"${escapeJson(t.surahNameAr)}","ayahNumber":${t.ayahNumber},"hidayahInsightAr":"${escapeJson(t.hidayahInsightAr)}","practicalActionPlanAr":"${escapeJson(t.practicalActionPlanAr)}"}"""
        }

        return buildString {
            appendLine("{")
            appendLine("  \"backupVersion\": \"itqan-v4.0-2025\",")
            appendLine("  \"exportedAtMillis\": ${System.currentTimeMillis()},")
            appendLine("  \"studentName\": \"${escapeJson(studentName)}\",")
            appendLine("  \"streakDays\": $streakDays,")
            appendLine("  \"memorizedVerses\": [${if (versesJson.isNotEmpty()) "\n    $versesJson\n  " else ""}],")
            appendLine("  \"fsrsReviews\": [${if (fsrsJson.isNotEmpty()) "\n    $fsrsJson\n  " else ""}],")
            appendLine("  \"mistakeLogs\": [${if (mistakesJson.isNotEmpty()) "\n    $mistakesJson\n  " else ""}],")
            appendLine("  \"tadabburJournals\": [${if (tadabburJson.isNotEmpty()) "\n    $tadabburJson\n  " else ""}],")
            appendLine("  \"bookmarksCount\": ${bookmarks.size},")
            appendLine("  \"certificatesCount\": ${certificates.size}")
            append("}")
        }
    }

    /**
     * Generates a human-readable formatted Arabic Hifz & Tadabbur Portfolio document for sharing.
     */
    fun buildFormattedPortfolioText(
        studentName: String,
        streakDays: Int,
        memorizedVersesCount: Int,
        fsrsReviews: List<FsrsReviewEntity>,
        tadabburJournals: List<TadabburJournalEntity>,
        certificates: List<CertificateEntity>
    ): String {
        return buildString {
            appendLine("📖 سجل الإتقان القرآني والتدبر الموثق (نسخة محفظة الطالب)")
            appendLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            appendLine("👤 طالب العلم: $studentName | المواظبة: $streakDays يوماً")
            appendLine("✨ الآيات المتقنة: $memorizedVersesCount | أوراد FSRS المجدولة: ${fsrsReviews.size}")
            appendLine("🏅 الشهادات المنهجية الصادرة: ${certificates.size}")
            appendLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            appendLine("🌿 مقتطفات من دفتر التدبر والخلوة القرآنية:")
            tadabburJournals.take(4).forEach { entry ->
                appendLine("• [سورة ${entry.surahNameAr}: ${entry.ayahNumber}] ﴿${entry.uthmaniText}﴾")
                appendLine("  - الهداية: ${entry.hidayahInsightAr}")
                appendLine("  - العمل: ${entry.practicalActionPlanAr}")
            }
            appendLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            appendLine("تم التصدير من تطبيق «إتقان (Itqan) — معلم القرآن الكريم وموسوعة علومه الموثقة»")
        }
    }
}
