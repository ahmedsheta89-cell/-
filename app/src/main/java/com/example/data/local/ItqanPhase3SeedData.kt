package com.example.data.local

import com.example.domain.model.AnatomicalMakhrajPoint
import com.example.domain.model.QiraatNarratorColorProfile
import com.example.domain.model.QuizQuestion
import com.example.domain.model.StudentSubmissionItem
import com.example.domain.model.SurahHeatmapCell
import com.example.domain.model.SurahMetadata
import com.example.domain.model.TeacherClassroom

object ItqanPhase3SeedData {

    /**
     * Complete 17 Articulation Points (مخارج الحروف السبعة عشر) on the chosen school
     * of Imam Ibn Al-Jazari & Al-Khalil ibn Ahmad:
     * «مَخَارِجُ الحُرُوفِ سَبْعَةَ عَشَرْ ... عَلَى الَّذِي يَخْتَارُهُ مَنِ اخْتَبَرْ»
     */
    val seventeenMakharijAtlas: List<AnatomicalMakhrajPoint> = listOf(
        AnatomicalMakhrajPoint(
            makhrajNumber = 1,
            generalRegionId = "jawf",
            generalRegionAr = "الجوف (الخلاء الواقع في الفم والحلق)",
            specificTitleAr = "١. الجوف — حروف المد الثلاثة",
            lettersAr = "ا ، و ، ي (المدية)",
            normX = 0.56f,
            normY = 0.52f,
            airflowAngleDeg = 180f,
            hasNasalGhunnah = false,
            sifaatSummaryAr = "الجهر، الرخاوة، الاستفال، الانفتاح، الخفاء",
            mechanismExplanationAr = "تخرج بامتداد الصوت في خلاء الحلق والفم دون اعتراض عضوي، وتنتهي بانتهاء هواء الفم.",
            jazariyyahEvidenceAr = "فَأَلِفُ الجَوْفِ وَأُخْتَاهَا وَهِي ... حُرُوفُ مَدٍّ لِلْهَوَاءِ تَنْتَهِي",
            practiceWordUthmani = "نُوحِيهَا • قَالُوا • فِي",
            commonErrorWarningAr = "احذر خلط صوت الألف والواو والياء المدية بشائبة غنة من الخيشوم."
        ),
        AnatomicalMakhrajPoint(
            makhrajNumber = 2,
            generalRegionId = "halq",
            generalRegionAr = "الحلق",
            specificTitleAr = "٢. أقصى الحلق (مما يلي الصدر)",
            lettersAr = "ء ، هـ",
            normX = 0.78f,
            normY = 0.80f,
            airflowAngleDeg = 250f,
            hasNasalGhunnah = false,
            sifaatSummaryAr = "الهمزة: جهر وشدة • الهاء: همس ورخاوة وخفاء",
            mechanismExplanationAr = "تخرج الهمزة الساكنة بانطباق الوترين الصوتيين، وتخرج الهاء بانفتاحهما الجزئي في أقصى الحلق.",
            jazariyyahEvidenceAr = "ثُمَّ لأَقْصَى الحَلْقِ هَمْزٌ هَاءُ ... ثُمَّ لِوَسْطِهِ فَعَيْنٌ حَاءُ",
            practiceWordUthmani = "اهْدِنَا • يَشَاءُ • الْمُهْتَدِي",
            commonErrorWarningAr = "احذر قلقلة الهمزة الساكنة أو تضييع بيان الهاء لضعفها وخفائها."
        ),
        AnatomicalMakhrajPoint(
            makhrajNumber = 3,
            generalRegionId = "halq",
            generalRegionAr = "الحلق",
            specificTitleAr = "٣. وسط الحلق (منطقة لسان المزمار)",
            lettersAr = "ع ، ح",
            normX = 0.76f,
            normY = 0.68f,
            airflowAngleDeg = 240f,
            hasNasalGhunnah = false,
            sifaatSummaryAr = "العين: جهر وتوسط (بينية) • الحاء: همس ورخاوة وبحّة",
            mechanismExplanationAr = "تخرج برجوع لسان المزمار إلى الجدار الخلفي لوسط الحلق تضييقاً بلا انغلاق تام.",
            jazariyyahEvidenceAr = "ثُمَّ لِوَسْطِهِ فَعَيْنٌ حَاءُ ... أَدْنَاهُ غَيْنٌ خَاؤُهَا وَالقَافُ",
            practiceWordUthmani = "نَعْبُدُ • الرَّحْمَٰنِ • فَاصْفَحْ",
            commonErrorWarningAr = "احذر بتر زمن العين الساكنة أو تفخيم الحاء إذا جاورت حرفاً مفخماً."
        ),
        AnatomicalMakhrajPoint(
            makhrajNumber = 4,
            generalRegionId = "halq",
            generalRegionAr = "الحلق",
            specificTitleAr = "٤. أدنى الحلق (مما يلي أقصى اللسان)",
            lettersAr = "غ ، خ",
            normX = 0.72f,
            normY = 0.56f,
            airflowAngleDeg = 220f,
            hasNasalGhunnah = false,
            sifaatSummaryAr = "الغين: جهر ورخاوة واستعلاء • الخاء: همس ورخاوة واستعلاء",
            mechanismExplanationAr = "تخرج من منطقة التقاء أدنى الحلق بالحنك اللحمي مع استعلاء أقصى اللسان.",
            jazariyyahEvidenceAr = "أَدْنَاهُ غَيْنٌ خَاؤُهَا وَالقَافُ ... أَقْصَى اللِّسَانِ فَوْقُ ثُمَّ الكَافُ",
            practiceWordUthmani = "غَيْرِ الْمَغْضُوبِ • يَخْشَى",
            commonErrorWarningAr = "احذر إدغام الغين في القاف أو الشخير الزائد عند النطق بالخاء الساكنة."
        ),
        AnatomicalMakhrajPoint(
            makhrajNumber = 5,
            generalRegionId = "lisan",
            generalRegionAr = "اللسان",
            specificTitleAr = "٥. أقصى اللسان فوق (مع الحنك اللحمي)",
            lettersAr = "ق",
            normX = 0.63f,
            normY = 0.44f,
            airflowAngleDeg = 200f,
            hasNasalGhunnah = false,
            sifaatSummaryAr = "الجهر، الشدة، الاستعلاء، الانفتاح، القلقلة",
            mechanismExplanationAr = "يقرع أقصى اللسان الحنك اللحمي الرخو مع ارتفاع أقصى اللسان فتفخم القاف وتقلقل عند سكونها.",
            jazariyyahEvidenceAr = "وَالقَافُ أَقْصَى اللِّسَانِ فَوْقُ ثُمَّ الكَافُ ... أَسْفَلُ وَالوَسْطُ فَجِيمُ الشِّينُ يَا",
            practiceWordUthmani = "الْمُسْتَقِيمَ • خَلَقَ • الْفَلَقِ",
            commonErrorWarningAr = "احذر خلط صوت القاف بالكاف أو الغين، وحقق قلقلتها عند الوقف."
        ),
        AnatomicalMakhrajPoint(
            makhrajNumber = 6,
            generalRegionId = "lisan",
            generalRegionAr = "اللسان",
            specificTitleAr = "٦. أقصى اللسان أسفل مخرج القاف",
            lettersAr = "ك",
            normX = 0.57f,
            normY = 0.42f,
            airflowAngleDeg = 195f,
            hasNasalGhunnah = false,
            sifaatSummaryAr = "الهمس، الشدة، الاستفال، الانفتاح",
            mechanismExplanationAr = "ينحبس الصوت أولاً بانطباق أقصى اللسان على الحنك العظمي واللحمي ثم يعقبه جريان النفس (الهمس).",
            jazariyyahEvidenceAr = "ثُمَّ الكَافُ أَسْفَلُ وَالوَسْطُ فَجِيمُ الشِّينُ يَا",
            practiceWordUthmani = "إِيَّاكَ • كُفُوًا • الْمَلِكِ",
            commonErrorWarningAr = "أعطِ الكاف شدتها أولاً ثم همسها اللطيف دون مبالغة تحولها إلى شين."
        ),
        AnatomicalMakhrajPoint(
            makhrajNumber = 7,
            generalRegionId = "lisan",
            generalRegionAr = "اللسان",
            specificTitleAr = "٧. وسط اللسان مع ما يحاذيه من الحنك الأعلى",
            lettersAr = "ج ، ش ، ي (غير المدية)",
            normX = 0.48f,
            normY = 0.39f,
            airflowAngleDeg = 185f,
            hasNasalGhunnah = false,
            sifaatSummaryAr = "الجيم: شدة وقلقلة • الشين: همس وتفشٍّ • الياء: جهر ولين",
            mechanismExplanationAr = "يرتفع وسط اللسان إلى قبة الحنك الأعلى؛ فينقفل المخرج في الجيم، ويضيق في الشين والياء.",
            jazariyyahEvidenceAr = "وَالوَسْطُ فَجِيمُ الشِّينُ يَا ... وَالضَّادُ مِنْ حَافَتِهِ إِذْ وَلِيَا",
            practiceWordUthmani = "الْحَجُّ • الشَّيْطَانِ • إِيَّاكَ",
            commonErrorWarningAr = "احذر رخاوة الجيم (عطش الجيم الشامية/المصرية) بل احبس الصوت فيها مع القلقلة."
        ),
        AnatomicalMakhrajPoint(
            makhrajNumber = 8,
            generalRegionId = "lisan",
            generalRegionAr = "اللسان",
            specificTitleAr = "٨. حافة اللسان مع ما يليها من الأضراس العليا",
            lettersAr = "ض",
            normX = 0.44f,
            normY = 0.47f,
            airflowAngleDeg = 180f,
            hasNasalGhunnah = false,
            sifaatSummaryAr = "الجهر، الرخاوة، الاستعلاء، الإطباق، الاستطالة",
            mechanismExplanationAr = "تخرج بانطباق إحدى حافتي اللسان أو كلتيهما على الصفحة الداخلية للأضراس العليا مع اندفاع اللسان للأمام قليلاً (الاستطالة).",
            jazariyyahEvidenceAr = "وَالضَّادُ مِنْ حَافَتِهِ إِذْ وَلِيَا ... لاَضْرَاسَ مِنْ أَيْسَرَ أَوْ يُمْنَاهَا",
            practiceWordUthmani = "وَلَا الضَّالِّينَ • الْمَغْضُوبِ • فَاضْرِبْ",
            commonErrorWarningAr = "احذر إخراج طرف اللسان بين الأسنان فتصير ظاءً، أو حبس الصوت فتصير دالاً مفخمة."
        ),
        AnatomicalMakhrajPoint(
            makhrajNumber = 9,
            generalRegionId = "lisan",
            generalRegionAr = "اللسان",
            specificTitleAr = "٩. أدنى حافتي اللسان إلى منتهى طرفه",
            lettersAr = "ل",
            normX = 0.36f,
            normY = 0.39f,
            airflowAngleDeg = 175f,
            hasNasalGhunnah = false,
            sifaatSummaryAr = "الجهر، التوسط (البينية)، الاستفال، الانفتاح، الانحراف",
            mechanismExplanationAr = "يقرع أدنى حافتي اللسان لثة الأسنان العليا فينحرف الصوت عن يمين اللسان ويساره.",
            jazariyyahEvidenceAr = "وَاللاَّمُ أَدْنَاهَا لِمُنْتَهَاهَا ... وَالنُّونُ مِنْ طَرَفِهِ تَحْتُ اجْعَلُوا",
            practiceWordUthmani = "الْحَمْدُ لِلَّهِ • قُلْ • ضَلُّوا",
            commonErrorWarningAr = "احذر تفخيم اللام في غير لفظ الجلالة أو إدغام لام (قل) في النون."
        ),
        AnatomicalMakhrajPoint(
            makhrajNumber = 10,
            generalRegionId = "lisan",
            generalRegionAr = "اللسان",
            specificTitleAr = "١٠. طرف اللسان مع لثة الثنيتين العلويين (تحت اللام)",
            lettersAr = "ن",
            normX = 0.33f,
            normY = 0.38f,
            airflowAngleDeg = 170f,
            hasNasalGhunnah = true,
            sifaatSummaryAr = "الجهر، التوسط (البينية)، الاستفال، الانفتاح، الغنة",
            mechanismExplanationAr = "مكون من جزء لساني (قرع طرف اللسان للثة الثنايا) وجزء خيشومي (مركب الغنة).",
            jazariyyahEvidenceAr = "وَالنُّونُ مِنْ طَرَفِهِ تَحْتُ اجْعَلُوا ... وَالرَّا يُدَانِيهِ لِظَهْرٍ أَدْخَلُوا",
            practiceWordUthmani = "نَسْتَعِينُ • الْإِنسَانَ • مِّن نِّعْمَةٍ",
            commonErrorWarningAr = "حقق زمن البينية في النون الساكنة المظهرة دون تمطيط أو بتر."
        ),
        AnatomicalMakhrajPoint(
            makhrajNumber = 11,
            generalRegionId = "lisan",
            generalRegionAr = "اللسان",
            specificTitleAr = "١١. طرف اللسان مائلاً إلى ظهره قليلاً",
            lettersAr = "ر",
            normX = 0.35f,
            normY = 0.36f,
            airflowAngleDeg = 172f,
            hasNasalGhunnah = false,
            sifaatSummaryAr = "الجهر، التوسط، الانحراف، التكرير (يُحذر المبالغة فيه)",
            mechanismExplanationAr = "يبقى فُرجة صغيرة في وسط طرف اللسان يمر منها الصوت مانعاً ارتعاد اللسان وتكرار الراءات.",
            jazariyyahEvidenceAr = "وَالرَّا يُدَانِيهِ لِظَهْرٍ أَدْخَلُوا ... وَالطَّاءُ وَالدَّالُ وَتَا مِنْهُ وَمِنْ",
            practiceWordUthmani = "الرَّحْمَٰنِ الرَّحِيمِ • فِرْعَوْنَ • وَالْعَصْرِ",
            commonErrorWarningAr = "أخفِ تكرير الراء إذا تشددت، ورققها إذا سكنت بعد كسر أصلي."
        ),
        AnatomicalMakhrajPoint(
            makhrajNumber = 12,
            generalRegionId = "lisan",
            generalRegionAr = "اللسان",
            specificTitleAr = "١٢. طرف اللسان العريض مع أصول الثنايا العليا (النطعية)",
            lettersAr = "ط ، د ، ت",
            normX = 0.30f,
            normY = 0.39f,
            airflowAngleDeg = 175f,
            hasNasalGhunnah = false,
            sifaatSummaryAr = "الطاء: استعلاء وإطباق وقلقلة • الدال: جهر وقلقلة • التاء: همس وشدة",
            mechanismExplanationAr = "تخرج بقرع ظهر طرف اللسان لمنبت الثنيتين العلويين (نطع الغار الأعلى).",
            jazariyyahEvidenceAr = "وَالطَّاءُ وَالدَّالُ وَتَا مِنْهُ وَمِنْ ... عُلْيَا الثَّنَايَا والصَّفِيرُ مُسْتَكِنْ",
            practiceWordUthmani = "الصِّرَاطَ • أَحَدٌ • كُوِّرَتْ",
            commonErrorWarningAr = "احذر همس الطاء والدال، واحذر المبالغة في همس التاء فتصير سيناً."
        ),
        AnatomicalMakhrajPoint(
            makhrajNumber = 13,
            generalRegionId = "lisan",
            generalRegionAr = "اللسان",
            specificTitleAr = "١٣. منتهى طرف اللسان مع الصفحة الداخلية للثنايا السفلى (الأسلية)",
            lettersAr = "ص ، س ، ز",
            normX = 0.27f,
            normY = 0.48f,
            airflowAngleDeg = 180f,
            hasNasalGhunnah = false,
            sifaatSummaryAr = "الصفير والرخاوة • الصاد: استعلاء وإطباق وهمس • الزاي: جهر",
            mechanismExplanationAr = "يستقر رأس اللسان عند أسفل الثنايا السفلى فيمر الهواء بقوة بين الثنايا العليا والسفلى محدثاً الصفير.",
            jazariyyahEvidenceAr = "والصَّفِيرُ مُسْتَكِنْ ... مِنْهُ وَمِنْ فَوْقِ الثَّنَايَا السُّفْلَى",
            practiceWordUthmani = "الصَّمَدُ • النَّاسِ • زُلْزِلَتِ",
            commonErrorWarningAr = "احذر ضم الشفتين عند النطق بالصاد، وحافظ على إطباقها لئلا تتحول سيناً."
        ),
        AnatomicalMakhrajPoint(
            makhrajNumber = 14,
            generalRegionId = "lisan",
            generalRegionAr = "اللسان",
            specificTitleAr = "١٤. ظهر طرف اللسان مع أطراف الثنايا العليا (اللثوية)",
            lettersAr = "ظ ، ذ ، ث",
            normX = 0.25f,
            normY = 0.43f,
            airflowAngleDeg = 180f,
            hasNasalGhunnah = false,
            sifaatSummaryAr = "الرخاوة • الظاء: جهر واستعلاء وإطباق • الذال: جهر • الثاء: همس",
            mechanismExplanationAr = "يخرج طرف اللسان يسيراً ليلامس رؤوس الثنايا العليا برفق دون ضغط شديد يمنع جريان الصوت.",
            jazariyyahEvidenceAr = "وَالظَّاءُ وَالذَّالُ وَثَا لِلْعُلْيَا ... مِنْ طَرَفَيْهِمَا وَمِنْ بَطْنِ الشَّفَهْ",
            practiceWordUthmani = "الظَّالِمِينَ • الَّذِينَ • الْكَثِيرَ",
            commonErrorWarningAr = "احذر عدم إخراج طرف اللسان فتتحول الظاء والذال إلى زاي والثاء إلى سين."
        ),
        AnatomicalMakhrajPoint(
            makhrajNumber = 15,
            generalRegionId = "shafatan",
            generalRegionAr = "الشفتان",
            specificTitleAr = "١٥. بطن الشفة السفلى مع أطراف الثنايا العليا",
            lettersAr = "ف",
            normX = 0.20f,
            normY = 0.49f,
            airflowAngleDeg = 185f,
            hasNasalGhunnah = false,
            sifaatSummaryAr = "الهمس، الرخاوة، الاستفال، الانفتاح",
            mechanismExplanationAr = "تلامس أطراف الثنيتين العلويين باطن الشفة السفلى فيجري النفس والصوت بيسر.",
            jazariyyahEvidenceAr = "وَمِنْ بَطْنِ الشَّفَهْ ... فَالفَا مَعَ اطْرَافِ الثَّنَايَا المُشْرِفَهْ",
            practiceWordUthmani = "فِي • الْفَلَقِ • يَفْعَلُونَ",
            commonErrorWarningAr = "أظهر الفاء إذا جاورت الواو أو الميم مثل (تلقف ما صنعوا)."
        ),
        AnatomicalMakhrajPoint(
            makhrajNumber = 16,
            generalRegionId = "shafatan",
            generalRegionAr = "الشفتان",
            specificTitleAr = "١٦. ما بين الشفتين (انطباقاً في الباء والميم، وانضماماً في الواو)",
            lettersAr = "ب ، م ، و (غير المدية)",
            normX = 0.16f,
            normY = 0.46f,
            airflowAngleDeg = 180f,
            hasNasalGhunnah = true,
            sifaatSummaryAr = "الباء: شدة وقلقلة • الميم: توسط وغنة • الواو: جهر ورخاوة ولين",
            mechanismExplanationAr = "تخرج الباء والميم بانطباق الشفتين، وتخرج الواو غير المدية بانضمام الشفتين للأمام مع بقاء فرجة.",
            jazariyyahEvidenceAr = "لِلشَّفَتَيْنِ الْوَاوُ بَاءٌ مِيمُ ... وَغُنَّةٌ مَخْرَجُهَا الخَيْشُومُ",
            practiceWordUthmani = "بِسْمِ • أَنْعَمْتَ • يَوْمِ",
            commonErrorWarningAr = "احذر إخفاء الميم الساكنة عند الواو والفاء: (وَاحْذَرْ لَدَى وَاوٍ وَفَا أَنْ تَخْتَفِي)."
        ),
        AnatomicalMakhrajPoint(
            makhrajNumber = 17,
            generalRegionId = "khayshoom",
            generalRegionAr = "الخيشوم (التجويف الأنفي)",
            specificTitleAr = "١٧. الخيشوم — مركب صوت الغنة في النون والميم",
            lettersAr = "مركب الغنة (ن ، م)",
            normX = 0.44f,
            normY = 0.22f,
            airflowAngleDeg = 155f,
            hasNasalGhunnah = true,
            sifaatSummaryAr = "صوت أغنّ مجهور يجري في التجويف الأنفي ويتبع ما بعده تفخيماً وترقيقاً في الإخفاء",
            mechanismExplanationAr = "ينفتح الممر الأنفي خلف الحنك اللحمي فيمر صوت الغنة من الخيشوم في النون والميم بجميع مراتبهما.",
            jazariyyahEvidenceAr = "وَغُنَّةٌ مَخْرَجُهَا الخَيْشُومُ ... صِفَاتُهَا جَهْرٌ وَرِخْوٌ مُسْتَفِلْ",
            practiceWordUthmani = "إِنَّا • عَمَّ • مَن يَقُولُ",
            commonErrorWarningAr = "فخم الغنة إذا وقع بعد النون الساكنة حرف استعلاء مثل (مَن قَالَ)، ورققها فيما سوى ذلك."
        )
    )

    /**
     * Phase 3: Teacher & Muhaffiz Classrooms (بوابة المعلم والمحفّظ).
     */
    val teacherClassrooms: List<TeacherClassroom> = listOf(
        TeacherClassroom(
            classroomId = "class_hafs_mastery",
            titleAr = "حلقة الإتقان وضبط المخارج (رواية حفص)",
            levelAr = "المستوى التأسيسي والمتوسط",
            supervisorNameAr = "الشيخ د. عبد الرحمن المقرئ (مجيز بالقراءات العشر)",
            studentsCount = 18,
            activeWirdSummaryAr = "سورة الملك (١ - ١٠) + تحفة الأطفال (١ - ١٥)",
            scheduleAr = "الأحد والثلاثاء والخميس — بعد صلاة العصر"
        ),
        TeacherClassroom(
            classroomId = "class_juz_amma_mutashabihat",
            titleAr = "حلقة الحفاظ وضبط المتشابهات (جزء عم وتبارك)",
            levelAr = "المستوى المتقدم",
            supervisorNameAr = "الشيخ محمود الشاطبي",
            studentsCount = 24,
            activeWirdSummaryAr = "تسميع متواصل لسور المعوذات والقدر والعصر",
            scheduleAr = "يومياً — الورد الصباحي والمسائي"
        ),
        TeacherClassroom(
            classroomId = "class_jazariyyah_matn",
            titleAr = "مجلس شرح وتسميع المقدمة الجزرية",
            levelAr = "طلبة العلم والمجيزون",
            supervisorNameAr = "الشيخ د. محمد الجزري",
            studentsCount = 14,
            activeWirdSummaryAr = "باب مخارج الحروف وصفاتها (الأبيات ٩ - ٢٦)",
            scheduleAr = "السبت والاثنين — ٨:٠٠ مساءً"
        )
    )

    fun buildInitialWirdAssignments(): List<WirdAssignmentEntity> = listOf(
        WirdAssignmentEntity(
            assignmentId = "assign_mulk_1_5",
            classroomId = "class_hafs_mastery",
            classroomTitleAr = "حلقة الإتقان وضبط المخارج (رواية حفص)",
            supervisorNameAr = "الشيخ د. عبد الرحمن المقرئ",
            surahNumber = 67,
            surahNameAr = "الملك",
            ayahStart = 1,
            ayahEnd = 5,
            requiredRepetitions = 7,
            focusTajweedRuleAr = "تحقيق قلقلة الباء والدال وتفخيم الراء في (تَبَارَكَ)",
            teacherInstructionsAr = "يُرجى تسميع الآيات الخمس متصلة في حلقة الشيخ الحية مع مقارنة الموجة الصوتية بتلاوة الشيخ الحصري.",
            completedStudentsCount = 14,
            totalStudentsCount = 18,
            isCompletedByCurrentStudent = false,
            dueDateLabelAr = "الخميس القادم"
        ),
        WirdAssignmentEntity(
            assignmentId = "assign_ikhlas_muawwidhat",
            classroomId = "class_juz_amma_mutashabihat",
            classroomTitleAr = "حلقة الحفاظ وضبط المتشابهات (جزء عم وتبارك)",
            supervisorNameAr = "الشيخ محمود الشاطبي",
            surahNumber = 112,
            surahNameAr = "الإخلاص",
            ayahStart = 1,
            ayahEnd = 4,
            requiredRepetitions = 10,
            focusTajweedRuleAr = "القلقلة الكبرى في أواخر الآيات وإطباق الصاد في (الصَّمَدُ)",
            teacherInstructionsAr = "تسميع السور الثلاث (الإخلاص والفلق والناس) غيباً دون أخطاء في المخارج.",
            completedStudentsCount = 21,
            totalStudentsCount = 24,
            isCompletedByCurrentStudent = true,
            dueDateLabelAr = "مكتمل"
        )
    )

    val initialStudentSubmissions: List<StudentSubmissionItem> = listOf(
        StudentSubmissionItem(
            submissionId = "sub_student_1",
            studentNameAr = "عمر بن الخطاب الأنصاري",
            classroomId = "class_hafs_mastery",
            classroomTitleAr = "حلقة الإتقان وضبط المخارج (رواية حفص)",
            surahNumber = 1,
            surahNameAr = "الفاتحة",
            ayahRangeAr = "الآيات ١ - ٧",
            recitedSnippetUthmani = "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
            autoAccuracyPercent = 94,
            waveformSamples = listOf(0.35f, 0.72f, 0.88f, 0.50f, 0.95f, 0.82f, 0.60f, 0.90f, 0.75f, 0.45f),
            durationSeconds = 38,
            focusMistakeWord = "الْمَغْضُوبِ",
            teacherFeedbackNote = "تلاوة متقنة، انتبه فقط لعدم ضم الشفتين عند النطق بالضاد في (المغضوب) وحقق المد اللازم ٦ حركات في (الضالين).",
            tajweedCategoryBadgeAr = "مخرج الضاد والمد اللازم",
            isReviewedByTeacher = true,
            stageCertificateIssued = false
        ),
        StudentSubmissionItem(
            submissionId = "sub_student_2",
            studentNameAr = "صهيب الرومي الكندي",
            classroomId = "class_juz_amma_mutashabihat",
            classroomTitleAr = "حلقة الحفاظ وضبط المتشابهات (جزء عم وتبارك)",
            surahNumber = 113,
            surahNameAr = "الفلق",
            ayahRangeAr = "الآيات ١ - ٥",
            recitedSnippetUthmani = "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِن شَرِّ مَا خَلَقَ",
            autoAccuracyPercent = 89,
            waveformSamples = listOf(0.28f, 0.60f, 0.78f, 0.65f, 0.42f, 0.84f, 0.70f, 0.55f, 0.88f, 0.40f),
            durationSeconds = 26,
            focusMistakeWord = "الْفَلَقِ",
            teacherFeedbackNote = "بانتظار اعتماد الملاحظة التوجيهية من المعلم حول قلقلة القاف الموقوف عليها.",
            tajweedCategoryBadgeAr = "القلقلة الكبرى والإخفاء",
            isReviewedByTeacher = false,
            stageCertificateIssued = false
        ),
        StudentSubmissionItem(
            submissionId = "sub_student_3",
            studentNameAr = "معاذ بن جبل الخزرجي",
            classroomId = "class_jazariyyah_matn",
            classroomTitleAr = "مجلس شرح وتسميع المقدمة الجزرية",
            surahNumber = 73,
            surahNameAr = "المزمل",
            ayahRangeAr = "الآية ٤ + باب المخارج",
            recitedSnippetUthmani = "أَوْ زِدْ عَلَيْهِ وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا",
            autoAccuracyPercent = 98,
            waveformSamples = listOf(0.45f, 0.80f, 0.92f, 0.76f, 0.85f, 0.94f, 0.68f, 0.89f, 0.81f, 0.58f),
            durationSeconds = 44,
            focusMistakeWord = "تَرْتِيلًا",
            teacherFeedbackNote = "أداء متميز جداً في تحقيق مخارج الحروف ومد العوض عند الوقف. يستحق شهادة إتمام المرحلة.",
            tajweedCategoryBadgeAr = "تحقيق المخارج ومد العوض",
            isReviewedByTeacher = true,
            stageCertificateIssued = true
        )
    )

    /**
     * Phase 3: Colored Qira'at Narrator Profiles for the Interactive Mushaf.
     */
    val qiraatNarratorProfiles: List<QiraatNarratorColorProfile> = listOf(
        QiraatNarratorColorProfile(
            narratorId = "hafs_asim",
            shortLabelAr = "حفص عن عاصم",
            imamAndRawiAr = "حفص بن سليمان عن الإمام عاصم الكوفي",
            tariqAr = "من طريق الشاطبية (التوسط ٤ حركات في المتصل والمنفصل)",
            badgeColorHex = 0xFF0A4D3C,
            usoolMethodologyAr = "تحقيق الهمزتين، توسط المنفصل والمتصل (٤-٥ حركات)، قصر البدل، وفتح ذوات الياء إلا (مَجْرَاهَا).",
            keyExampleDifferenceAr = "﴿مَالِكِ يَوْمِ الدِّينِ﴾ بالألف، ﴿كُفُوًا﴾ بالواو المفتوحة.",
            shatibiyyahEvidenceAr = "وَعَنْ عَاصِمٍ شُعْبَةٌ وَحَفْصٌ كِلاَهُمَا ... بِإِتْقَانِ أَصْلٍ فِي القِرَاءَةِ يُعْتَلَى"
        ),
        QiraatNarratorColorProfile(
            narratorId = "warsh_nafi",
            shortLabelAr = "ورش عن نافع",
            imamAndRawiAr = "عثمان بن سعيد (ورش) عن الإمام نافع المدني",
            tariqAr = "من طريق الأزرق عبر الشاطبية",
            badgeColorHex = 0xFF1565C0,
            usoolMethodologyAr = "إشباع المد المتصل والمنفصل (٦ حركات)، ثلاثة البدل، نقل حركة الهمز للساكن قبله، تغليظ اللام وترقيق الراء.",
            keyExampleDifferenceAr = "﴿مَلِكِ يَوْمِ الدِّينِ﴾ بغير ألف، ﴿الصِّرَاطَ﴾ مع تغليظ اللام في ﴿الصَّلَاةَ﴾.",
            shatibiyyahEvidenceAr = "وَرَقَّقَ وَرْشٌ كُلَّ رَاءٍ وَقَبْلَهَا ... مُسَكَّنَةً يَاءٌ أَوِ الكَسْرُ مُوصَلاَ"
        ),
        QiraatNarratorColorProfile(
            narratorId = "qalun_nafi",
            shortLabelAr = "قالون عن نافع",
            imamAndRawiAr = "عيسى بن مينا (قالون) عن الإمام نافع المدني",
            tariqAr = "من طريق الشاطبية",
            badgeColorHex = 0xFF6A1B9A,
            usoolMethodologyAr = "قصر وتوسط المنفصل، صلة ميم الجمع بخلف عنه، وتسهيل الهمزة الثانية من الكلمة.",
            keyExampleDifferenceAr = "﴿عَلَيْهِمُ وَلَا الضَّالِّينَ﴾ بصلة ميم الجمع واواً لفظية على وجه الصلة.",
            shatibiyyahEvidenceAr = "وَقَالُونُ عِيسَى ثُمَّ عُثْمَانُ وَرْشُهُمْ ... بِصُحْبَةِ مَجْدٍ فِي المَدِينَةِ أَصَّلاَ"
        ),
        QiraatNarratorColorProfile(
            narratorId = "duri_abi_amr",
            shortLabelAr = "الدوري عن أبي عمرو",
            imamAndRawiAr = "حفص الدوري عن الإمام أبي عمرو البصري",
            tariqAr = "من طريق الشاطبية",
            badgeColorHex = 0xFFB71C1C,
            usoolMethodologyAr = "الإدغام الكبير (مع السوسي)، إمالة ذوات الراء وذوات الياء، وكسر هاء الضمير في مواضع.",
            keyExampleDifferenceAr = "الإمالة الكبرى في فواصل السور وذوات الراء مثل ﴿الْكَافِرِينَ﴾.",
            shatibiyyahEvidenceAr = "وَأَمَّا الإِمَامُ المَازِنِيُّ صَرِيحُهُمْ ... أَبُو عَمْرٍو البَصْرِي فَوَالِدُهُ العَلاَ"
        )
    )

    /**
     * Phase 3: Initial Tadabbur & Khalwah Reflection Entries.
     */
    fun buildInitialTadabburJournal(): List<TadabburJournalEntity> = listOf(
        TadabburJournalEntity(
            journalId = "tadabbur_fatiha_5",
            compositeKey = "1:5",
            surahNumber = 1,
            surahNameAr = "الفاتحة",
            ayahNumber = 5,
            uthmaniText = "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
            meaningFromTafsirAr = "نخصك وحدك يا الله بالعبادة والذل والمحبة، ونخصك وحدك بطلب العون والتوفيق؛ فالعبادة غاية والاستعانة وسيلة.",
            hidayahInsightAr = "تقديم المعمول (إياك) يفيد الحصر والاختصاص، والجمع بين العبادة والاستعانة يورث الإخلاص والتبرؤ من الحول والقوة.",
            practicalActionPlanAr = "تجديد النية قبل كل عمل صالح، والإكثار من دعاء: اللهم أعني على ذكرك وشكرك وحسن عبادتك.",
            khalwahMinutes = 20,
            sourceCitation = "تفسير السعدي • مدارج السالكين لابن القيم"
        ),
        TadabburJournalEntity(
            journalId = "tadabbur_asr_1_3",
            compositeKey = "103:1",
            surahNumber = 103,
            surahNameAr = "العصر",
            ayahNumber = 1,
            uthmaniText = "وَالْعَصْرِ ۝ إِنَّ الْإِنسَانَ لَفِي خُسْرٍ",
            meaningFromTafsirAr = "أقسم الله بالدهر الذي هو وعاء أعمال العباد أن كل إنسان في خسارة إلا من جمع أربع مراتب: الإيمان، والعمل الصالح، والتواصي بالحق، والتواصي بالصبر.",
            hidayahInsightAr = "رأس مال المؤمن عمره وأنفاسه؛ فإذا لم يستثمرها في العلم والعمل والدعوة والصبر كان في خسران.",
            practicalActionPlanAr = "محاسبة النفس يومياً على استثمار الأوقات في ورد القرآن وطلب العلم النافع.",
            khalwahMinutes = 15,
            sourceCitation = "تفسير ابن كثير • تفسير الطبري"
        )
    )

    /**
     * Phase 3: Diagnostic Placement Quiz for Academy Track Recommendation.
     */
    val diagnosticPlacementQuestions: List<QuizQuestion> = listOf(
        QuizQuestion(
            id = "diag_q1",
            questionText = "كم عدد مخارج الحروف التفصيلية على مذهب الإمام ابن الجزري والخليل بن أحمد؟",
            options = listOf(
                "١٤ مخرجاً",
                "١٦ مخرجاً",
                "١٧ مخرجاً موزعة على ٥ مخارج عامة",
                "٢٩ مخرجاً بعدد الحروف"
            ),
            correctIndex = 2,
            explanation = "قال ابن الجزري: «مَخَارِجُ الحُرُوفِ سَبْعَةَ عَشَرْ ... عَلَى الَّذِي يَخْتَارُهُ مَنِ اخْتَبَرْ».",
            sourceCitation = "المقدمة الجزرية لابن الجزري — باب مخارج الحروف"
        ),
        QuizQuestion(
            id = "diag_q2",
            questionText = "من أي مخرج تخرج الضاد العربية الفصيحة كما في قوله تعالى: ﴿وَلَا الضَّالِّينَ﴾؟",
            options = listOf(
                "من طرف اللسان مع أطراف الثنايا العليا",
                "من إحدى حافتي اللسان أو كلتيهما مع ما يليها من الأضراس العليا",
                "من وسط اللسان مع الجيم والشين",
                "من أقصى اللسان مع الحنك اللحمي"
            ),
            correctIndex = 1,
            explanation = "قال ابن الجزري: «وَالضَّادُ مِنْ حَافَتِهِ إِذْ وَلِيَا ... لاَضْرَاسَ مِنْ أَيْسَرَ أَوْ يُمْنَاهَا».",
            sourceCitation = "المقدمة الجزرية لابن الجزري"
        ),
        QuizQuestion(
            id = "diag_q3",
            questionText = "ما حكم النون الساكنة إذا وقع بعدها حرف الواو أو الياء في كلمتين مثل: ﴿مَن يَقُولُ﴾؟",
            options = listOf(
                "إظهار حلقي",
                "إدغام ناقص بغنة بمقدار حركتين",
                "إدغام كامل بغير غنة",
                "إقلاب إلى ميم مخفاة"
            ),
            correctIndex = 1,
            explanation = "حروف الإدغام بغنة مجموعة في كلمة (ينمو)، ويكون ناقصاً عند الواو والياء لبقاء صفة الغنة.",
            sourceCitation = "تحفة الأطفال والغلمان للجمزوري"
        ),
        QuizQuestion(
            id = "diag_q4",
            questionText = "ما المرجع الأصيل المعتمد في التطبيق لبيان معاني مفردات غريب القرآن على الجذور اللغوية؟",
            options = listOf(
                "المفردات في غريب القرآن للراغب الأصفهاني",
                "أسباب النزول للواحدي",
                "الشاطبية للإمام الشاطبي",
                "البرهان للزركشي"
            ),
            correctIndex = 0,
            explanation = "كتاب «المفردات في غريب القرآن» للراغب الأصفهاني (ت ٥٠٢ هـ) هو العمدة في تحقيق أصول المفردات القرآنية.",
            sourceCitation = "الإتقان في علوم القرآن للسيوطي"
        )
    )

    /**
     * Computes the Mushaf Mastery Heatmap cells across the Surah catalog based on
     * FSRS reviews, cached verses memorization progress, and active mistake logs.
     */
    fun buildSurahMasteryHeatmap(
        surahCatalog: List<SurahMetadata>,
        cachedAyahs: List<QuranVerse>,
        fsrsReviews: List<FsrsReviewEntity>,
        mistakeLogs: List<MistakeLogEntity>
    ): List<SurahHeatmapCell> {
        return surahCatalog.map { surah ->
            val surahVerses = cachedAyahs.filter { it.surahNumber == surah.number }
            val surahReviews = fsrsReviews.filter { it.surahNumber == surah.number }
            val unresolvedMistakes = mistakeLogs.count { it.surahNumber == surah.number && !it.isResolved }

            val avgStability = if (surahReviews.isNotEmpty()) {
                surahReviews.map { it.stability }.average()
            } else if (surahVerses.any { it.isMemorized }) {
                5.5
            } else {
                0.0
            }

            val avgAccuracy = when {
                surahVerses.any { it.memorizationScore > 0 } ->
                    surahVerses.filter { it.memorizationScore > 0 }.map { it.memorizationScore }.average().toInt()
                surahReviews.isNotEmpty() -> 92
                else -> 0
            }

            val masteryStatus = when {
                unresolvedMistakes >= 2 -> 1 // يحتاج مراجعة عاجلة (أخطاء متكررة)
                avgStability >= 5.0 || (surahVerses.isNotEmpty() && surahVerses.all { it.isMemorized }) -> 3 // متقن راسخ
                avgStability > 0.0 || surahVerses.any { it.recitationCount > 0 } || unresolvedMistakes == 1 -> 2 // قيد التثبيت
                else -> 0 // لم يبدأ بعد
            }

            SurahHeatmapCell(
                surahNumber = surah.number,
                surahNameAr = surah.nameAr,
                juzNumber = surah.juzNumber,
                masteryStatus = masteryStatus,
                stabilityDays = avgStability,
                accuracyPercent = avgAccuracy,
                activeMistakesCount = unresolvedMistakes
            )
        }
    }

    /**
     * Generates a formatted Weekly Performance Report for students and parents.
     */
    fun buildWeeklyStudentReportText(
        studentName: String,
        streakDays: Int,
        completedLessonsCount: Int,
        certificatesCount: Int,
        memorizedVersesCount: Int,
        unresolvedMistakes: List<MistakeLogEntity>,
        activeWirdAssignments: List<WirdAssignmentEntity>
    ): String {
        val topFocusWords = if (unresolvedMistakes.isEmpty()) {
            "لا توجد أخطاء متكررة معلقة — أداء متقن ولله الحمد"
        } else {
            unresolvedMistakes.take(3).joinToString(" ، ") {
                "﴿${it.expectedWord}﴾ [سورة ${it.surahNameAr}:${it.ayahNumber}] (${it.mistakeCategory})"
            }
        }

        val wirdStatus = if (activeWirdAssignments.isEmpty()) {
            "الورد اليومي المنتظم في الروضة العلمية"
        } else {
            activeWirdAssignments.joinToString(" | ") {
                "سورة ${it.surahNameAr} (${it.ayahStart}-${it.ayahEnd}): ${if (it.isCompletedByCurrentStudent) "مكتمل ✓" else "قيد الإنجاز"}"
            }
        }

        return buildString {
            appendLine("📜 تقرير الأداء الأسبوعي الموثق — تطبيق «إتقان (Itqan)»")
            appendLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            appendLine("👤 اسم طالب العلم: $studentName")
            appendLine("🔥 سلسلة المواظبة الهادئة: $streakDays أيام متتالية")
            appendLine("📖 الآيات المتقنة والمدروسة: $memorizedVersesCount موضعاً قرآنياً")
            appendLine("🎓 الدروس المنهجية المكتملة: $completedLessonsCount درساً علمياً")
            appendLine("🏅 شهادات الإتمام الصادرة: $certificatesCount شهادة موثقة برمز QR")
            appendLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            appendLine("📌 حالة تكليفات المعلم والحلقة:")
            appendLine("• $wirdStatus")
            appendLine("🎯 مواضع التركيز التجويدي ومخارج الحروف:")
            appendLine("• $topFocusWords")
            appendLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            appendLine("صادر عن بوابة المعلم والمحفّظ — إتقان لعلوم القرآن الكريم")
        }
    }
}
