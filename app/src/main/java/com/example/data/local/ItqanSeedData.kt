package com.example.data.local

import com.example.domain.model.AcademicLevel
import com.example.domain.model.ClassicalMatnVerse
import com.example.domain.model.ContentAttributionType
import com.example.domain.model.QuizQuestion
import com.example.domain.model.ReciterProfile
import com.example.domain.model.ScienceLesson
import com.example.domain.model.ScienceTrackId
import com.example.domain.model.SourceChunk
import com.example.domain.model.SourceRegistryItem
import com.example.domain.model.SurahMetadata
import com.example.domain.usecase.ArabicTextNormalizer

object ItqanSeedData {

    val reciters: List<ReciterProfile> = listOf(
        ReciterProfile(
            id = "husary_muallim",
            nameAr = "الشيخ محمود خليل الحصري (المصحف المعلم)",
            styleAr = "تحقيق وتعليم التلاوة",
            everyAyahFolder = "Husary_128kbps",
            descriptionAr = "مرجع ضبط المخارج والصفات ومقادير المدود للمتعلمين."
        ),
        ReciterProfile(
            id = "minshawi_murattal",
            nameAr = "الشيخ محمد صديق المنشاوي",
            styleAr = "ترتيل خاشع متقن",
            everyAyahFolder = "Minshawy_Murattal_128kbps",
            descriptionAr = "تلاوة تجمع بين إتقان الأحكام وروحانية التدبر."
        ),
        ReciterProfile(
            id = "abdulbasit_murattal",
            nameAr = "الشيخ عبد الباسط عبد الصمد",
            styleAr = "ترتيل مجود",
            everyAyahFolder = "Abdul_Basit_Murattal_192kbps",
            descriptionAr = "بيان ناصع للحروف والوقف والابتداء."
        ),
        ReciterProfile(
            id = "afasy_murattal",
            nameAr = "الشيخ مشاري راشد العفاسي",
            styleAr = "ترتيل معاصر",
            everyAyahFolder = "Alafasy_128kbps",
            descriptionAr = "وضوح الأداء الصوتي للمراجعة والحفظ اليومي."
        )
    )

    val sourceRegistry: List<SourceRegistryItem> = listOf(
        SourceRegistryItem(
            id = "src_muyassar",
            bookTitle = "التفسير الميسر",
            author = "نخبة من علماء التفسير",
            deathHijri = "معاصر",
            editionInfo = "طبعة مجمع الملك فهد لطباعة المصحف الشريف",
            category = "التفسير",
            licenseStatus = "مرخص للاستخدام العلمي والقرآني المفتوح",
            contentVersion = "v2025.1"
        ),
        SourceRegistryItem(
            id = "src_saadi",
            bookTitle = "تيسير الكريم الرحمن في تفسير كلام المنان",
            author = "الشيخ عبد الرحمن بن ناصر السعدي",
            deathHijri = "١٣٧٦ هـ",
            editionInfo = "تحقيق مؤسسة الرسالة",
            category = "التفسير والقواعد الحسان",
            licenseStatus = "وقف علمي مشاع لطلبة العلم",
            contentVersion = "v2025.1"
        ),
        SourceRegistryItem(
            id = "src_ibn_kathir",
            bookTitle = "تفسير القرآن العظيم",
            author = "الإمام إسماعيل بن عمر بن كثير",
            deathHijri = "٧٧٤ هـ",
            editionInfo = "تراث إسلامي محقق",
            category = "التفسير بالمأثور",
            licenseStatus = "تراث إسلامي عام (Public Domain)",
            contentVersion = "v2025.1"
        ),
        SourceRegistryItem(
            id = "src_tabari",
            bookTitle = "جامع البيان عن تأويل آي القرآن",
            author = "الإمام محمد بن جرير الطبري",
            deathHijri = "٣١٠ هـ",
            editionInfo = "تراث إسلامي محقق",
            category = "التفسير واللغة",
            licenseStatus = "تراث إسلامي عام (Public Domain)",
            contentVersion = "v2025.1"
        ),
        SourceRegistryItem(
            id = "src_itqan",
            bookTitle = "الإتقان في علوم القرآن",
            author = "الإمام جلال الدين السيوطي",
            deathHijri = "٩١١ هـ",
            editionInfo = "تحقيق مركز الدراسات القرآنية",
            category = "علوم القرآن",
            licenseStatus = "تراث إسلامي عام (Public Domain)",
            contentVersion = "v2025.1"
        ),
        SourceRegistryItem(
            id = "src_jazariyyah",
            bookTitle = "المقدمة فيما يجب على قارئ القرآن أن يعلمه (الجزرية)",
            author = "الإمام محمد بن محمد بن الجزري",
            deathHijri = "٨٣٣ هـ",
            editionInfo = "متن علمي محقق",
            category = "التجويد ومخارج الحروف",
            licenseStatus = "تراث إسلامي عام (Public Domain)",
            contentVersion = "v2025.1"
        ),
        SourceRegistryItem(
            id = "src_tuhfah",
            bookTitle = "تحفة الأطفال والغلمان في تجويد القرآن",
            author = "الشيخ سليمان الجمزوري",
            deathHijri = "١٢٠٨ هـ",
            editionInfo = "متن علمي محقق",
            category = "أحكام التجويد التأسيسية",
            licenseStatus = "تراث إسلامي عام (Public Domain)",
            contentVersion = "v2025.1"
        ),
        SourceRegistryItem(
            id = "src_wahidi",
            bookTitle = "أسباب النزول",
            author = "الإمام أبو الحسن علي بن أحمد الواحدي",
            deathHijri = "٤٦٨ هـ",
            editionInfo = "تراث إسلامي محقق",
            category = "أسباب النزول",
            licenseStatus = "تراث إسلامي عام (Public Domain)",
            contentVersion = "v2025.1"
        ),
        SourceRegistryItem(
            id = "src_raghib",
            bookTitle = "المفردات في غريب القرآن",
            author = "الإمام الراغب الأصفهاني",
            deathHijri = "٥٠٢ هـ",
            editionInfo = "تراث إسلامي محقق",
            category = "غريب القرآن واللغة",
            licenseStatus = "تراث إسلامي عام (Public Domain)",
            contentVersion = "v2025.1"
        )
    )

    val surahCatalog: List<SurahMetadata> = listOf(
        SurahMetadata(1, "الفاتحة", "Al-Fatihah", "مكية", 7, 1, 1, "أم الكتاب ومفتاح العبودية والهداية للصراط المستقيم."),
        SurahMetadata(2, "البقرة", "Al-Baqarah", "مدنية", 286, 2, 1, "إقامة الخلافة في الأرض ومنهج الاستجابة لأوامر الله."),
        SurahMetadata(3, "آل عمران", "Ali 'Imran", "مدنية", 200, 50, 3, "الثبات على الحق بعد معرفته والحوار بالحجة."),
        SurahMetadata(18, "الكهف", "Al-Kahf", "مكية", 110, 293, 15, "العصمة من الفتن الأربع: فتنة الدين والمال والعلم والسلطان."),
        SurahMetadata(19, "مريم", "Maryam", "مكية", 98, 305, 16, "تجليات الرحمة الإلهية في هبة الذرية الصالحة وتنزيه الرحمن."),
        SurahMetadata(36, "يس", "Ya-Sin", "مكية", 83, 440, 22, "إثبات البعث والنشور وصدق الرسالة المحمدية."),
        SurahMetadata(55, "الرحمن", "Ar-Rahman", "مدنية", 78, 531, 27, "تعداد آلاء الله الدينية والدنيوية وعلى رأسها تعليم القرآن."),
        SurahMetadata(56, "الواقعة", "Al-Waqi'ah", "مكية", 96, 534, 27, "منازل الناس يوم القيامة: السابقون وأصحاب اليمين وأصحاب الشمال."),
        SurahMetadata(67, "الملك", "Al-Mulk", "مكية", 30, 562, 29, "إظهار كمال الملك الإلهي في الخلق والابتلاء بالحياة والموت."),
        SurahMetadata(73, "المزمل", "Al-Muzzammil", "مكية", 20, 574, 29, "زاد الداعية بالقيام وترتيل القرآن ترتيلاً."),
        SurahMetadata(78, "النبأ", "An-Naba", "مكية", 40, 582, 30, "دلائل القدرة الكونية على حتمية يوم الفصل."),
        SurahMetadata(87, "الأعلى", "Al-A'la", "مكية", 19, 591, 30, "تنزيه الله الأعلى وبشرى تيسير الوحي وحفظه."),
        SurahMetadata(93, "الضحى", "Ad-Duha", "مكية", 11, 596, 30, "تثبيت فؤاد النبي ﷺ وتذكيره بنعم ربه عليه."),
        SurahMetadata(94, "الشرح", "Ash-Sharh", "مكية", 8, 596, 30, "انشراح الصدر ورفع الذكر واقتران العسر باليسرين."),
        SurahMetadata(96, "العلق", "Al-'Alaq", "مكية", 19, 597, 30, "مفتتح الوحي بالقراءة والعلم والعبودية بالركوع والسجود."),
        SurahMetadata(97, "القدر", "Al-Qadr", "مكية", 5, 598, 30, "شرف ليلة إنزال القرآن وفضلها على ألف شهر."),
        SurahMetadata(103, "العصر", "Al-'Asr", "مكية", 3, 601, 30, "أركان النجاة الأربعة: الإيمان والعمل الصالح والتواصي بالحق والصبر."),
        SurahMetadata(108, "الكوثر", "Al-Kawthar", "مكية", 3, 602, 30, "الامتنان بالعطاء الكثير وشكره بالصلاة والنحر."),
        SurahMetadata(112, "الإخلاص", "Al-Ikhlas", "مكية", 4, 604, 30, "تجريد التوحيد الخالص لله الواحد الأحد الصمد."),
        SurahMetadata(113, "الفلق", "Al-Falaq", "مكية", 5, 604, 30, "الاستعاذة برب الفلق من الشرور الظاهرة والخفية."),
        SurahMetadata(114, "الناس", "An-Nas", "مكية", 6, 604, 30, "الاستعاذة برب الناس وملكهم وإلههم من وسواس الخناس.")
    )

    fun buildInitialAyahEntities(): List<AyahEntity> {
        val rawAyahs = listOf(
            AyahEntity(
                compositeKey = "1:1",
                surahNumber = 1,
                surahNameAr = "الفاتحة",
                revelationType = "مكية",
                ayahNumber = 1,
                pageNumber = 1,
                juzNumber = 1,
                hizbNumber = 1,
                uthmaniText = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
                plainSearchText = ArabicTextNormalizer.normalizeForSearch("بسم الله الرحمن الرحيم"),
                tafsirMuyassar = "أبتدئ قراءتي مستعيناً باسم الله المتصف بكمال الرحمة العامة والخاصة.",
                tafsirSaadi = "استعانة وتبرك بذكر اسم الله الجامع لصفات الكمال، والرحمن ذي الرحمة الواسعة، والرحيم بالمؤمنين.",
                tafsirIbnKathir = "افتتح الصحابة كتاب الله بها، ويستحب ابتداؤها في كل عمل وقول ذي بال، واسم الله الأعظم الذي لا يتسمى به غيره.",
                tafsirTabari = "تأويل قوله (بسم الله): تأدب العباد بتعليم الله إياهم ذكر اسمه في مفتتح القراءة والعمل.",
                gharibKalimat = "الرحمن: ذو الرحمة الشاملة لجميع الخلق في الدنيا؛ الرحيم: ذو الرحمة الخاصة بالمؤمنين (مفردات الراغب).",
                asbabNuzul = "أول ما نزل من الفاتحة بمكة، وكانت مفتتح السور للفصل بينها (أسباب النزول للواحدي).",
                irabAndBalaghah = "جار ومجرور متعلق بمحذوف تقديره (أبتدئ)؛ وفي تقديم الجار والمجرور اختصاص وقصر للاستعانة بالله وحده.",
                tajweedAndQiraat = "ترقيق لام لفظ الجلالة لأن ما قبلها مكسور (بِسْمِ اللَّهِ)؛ والمد العارض للسكون في (الرحيم) عند الوقف ٢ أو ٤ أو ٦ حركات."
            ),
            AyahEntity(
                compositeKey = "1:2",
                surahNumber = 1,
                surahNameAr = "الفاتحة",
                revelationType = "مكية",
                ayahNumber = 2,
                pageNumber = 1,
                juzNumber = 1,
                hizbNumber = 1,
                uthmaniText = "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ",
                plainSearchText = ArabicTextNormalizer.normalizeForSearch("الحمد لله رب العالمين"),
                tafsirMuyassar = "الثناء الكامل بصفات الجلال والكمال لله وحده؛ لأنه مالك الخلق ومدبر شؤونهم.",
                tafsirSaadi = "الحمد هو الثناء على الله بصفات الكمال وبأفعاله الدائرة بين الفضل والعدل، وربوبيته للعالمين تربية بنعمه.",
                tafsirIbnKathir = "الألف واللام في الحمد للاستغراق لجميع أجناس المحامد لله تعالى، والعالمون كل ما سوى الله.",
                tafsirTabari = "معنى الحمد لله: الشكر خالصاً لله دون سائر ما يُعبد من دونه، وبما أنعم على عباده من الهداية.",
                gharibKalimat = "الرب: المربي والمنشئ للشيء حالاً فحالاً إلى حد التمام؛ العالمين: جمع عالَم وهو كل موجود سوى الله (الراغب).",
                asbabNuzul = "سورة الفاتحة مكية من أوائل ما نزل لتعليم العباد كيفية الثناء على الله ودعائه.",
                irabAndBalaghah = "(الحمدُ) مبتدأ مرفوع، و(لله) شبه جملة في محل رفع خبر؛ والجملة الاسمية تفيد الدوام والثبوت.",
                tajweedAndQiraat = "إظهار لام التعريف القمرية في (الحمد) و(العالمين) لوقوع الحاء والعين من حروف (ابغ حجك وخف عقيمه)."
            ),
            AyahEntity(
                compositeKey = "1:3",
                surahNumber = 1,
                surahNameAr = "الفاتحة",
                revelationType = "مكية",
                ayahNumber = 3,
                pageNumber = 1,
                juzNumber = 1,
                hizbNumber = 1,
                uthmaniText = "ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
                plainSearchText = ArabicTextNormalizer.normalizeForSearch("الرحمن الرحيم"),
                tafsirMuyassar = "المتصف بالرحمة الواسعة التي شملت الخلائق، وبالرحمة الواصلة للمؤمنين.",
                tafsirSaadi = "بنى ربوبيته للعالمين على الرحمة والاحسان لا على القهر المجرد، فتربيته لخلقه رحمة.",
                tafsirIbnKathir = "إعادة الاسمين الكريمين بعد قوله (رب العالمين) لجمع الترغيب بعد الترهيب والهيبة.",
                tafsirTabari = "نعت لله بعد قوله رب العالمين لبيان عموم فضله على البر والفاجر في الدنيا واختصاص المؤمنين في الآخرة.",
                gharibKalimat = "فعيل بمعنى فاعل دال على الثبوت واللزوم، وفعلان دال على السعة والامتلاء (مفردات الراغب).",
                asbabNuzul = "متصلة بنسق الثناء في مطلع سورة الفاتحة قبل آية الجزاء.",
                irabAndBalaghah = "(الرحمنِ الرحيمِ) نعتان لاسم الجلالة مجروران، وفيهما إطناب بالتكرير لتعظيم شأن الرحمة.",
                tajweedAndQiraat = "إدغام اللام الشمسية في الراء من (الرحمن الرحيم) مع تفخيم الراء لأنها مفتوحة، ومد طبيعي في الألف الخنجرية."
            ),
            AyahEntity(
                compositeKey = "1:4",
                surahNumber = 1,
                surahNameAr = "الفاتحة",
                revelationType = "مكية",
                ayahNumber = 4,
                pageNumber = 1,
                juzNumber = 1,
                hizbNumber = 1,
                uthmaniText = "مَٰلِكِ يَوْمِ ٱلدِّينِ",
                plainSearchText = ArabicTextNormalizer.normalizeForSearch("مالك يوم الدين"),
                tafsirMuyassar = "المتفرد بملك يوم القيامة وهو يوم الحساب والجزاء على الأعمال.",
                tafsirSaadi = "المتصرف وحده في يوم الجزاء بالعدل والحكمة حيث تنقطع أملاك الخلائق.",
                tafsirIbnKathir = "تخصيص الملك بيوم الدين لأنه لا يدعي أحد يومئذ شيئاً ولا يتكلم إلا بإذنه.",
                tafsirTabari = "الدين في هذا الموضع: الحساب والمجازاة بالأعمال؛ وجمعت القراءتان بين (مالك) و(ملك).",
                gharibKalimat = "الدين: الجزاء والطاعة والحساب، ومنه قولهم: كما تدين تدان (مفردات الراغب).",
                asbabNuzul = "تتمة آيات الثناء والتمجيد في الحديث القدسي (قسمت الصلاة بيني وبين عبدي نصفين).",
                irabAndBalaghah = "(مالكِ) صفة مجرورة وهو مضاف و(يومِ) مضاف إليه؛ وإضافة الملك إلى اليوم للمبالغة في الإحاطة.",
                tajweedAndQiraat = "قرأ عاصم والكسائي ويعقوب وخلف (مَالِكِ) بالألف، وقرأ الباقون من العشرة (مَلِكِ) بغير ألف، وكلاهما متواتر."
            ),
            AyahEntity(
                compositeKey = "1:5",
                surahNumber = 1,
                surahNameAr = "الفاتحة",
                revelationType = "مكية",
                ayahNumber = 5,
                pageNumber = 1,
                juzNumber = 1,
                hizbNumber = 1,
                uthmaniText = "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
                plainSearchText = ArabicTextNormalizer.normalizeForSearch("اياك نعبد واياك نستعين"),
                tafsirMuyassar = "نخصك وحدك بالعبادة والطاعة، ونستعين بك وحدك في جميع أمورنا.",
                tafsirSaadi = "تقديم المعمول (إياك) يفيد الحصر، أي نثبت العبادة والاستعانة لك وحدك وننفيها عمن سواك.",
                tafsirIbnKathir = "سر الفاتحة؛ فالأول تبرؤ من الشرك، والثاني تبرؤ من الحول والقوة وتفويض إلى الله عز وجل.",
                tafsirTabari = "معنى نعبد: نخضع لك ونذل بالطاعة؛ ومعنى نستعين: نطلب معونتك على عبادتك وطاعتك.",
                gharibKalimat = "العبادة: غاية التذلل والخضوع مع كمال المحبة والتعظيم (مفردات الراغب).",
                asbabNuzul = "قال الله تعالى في الحديث الصحيح: (هذا بيني وبين عبدي ولعبدي ما سأل).",
                irabAndBalaghah = "(إياك) ضمير منفصل مبني في محل نصب مفعول به مقدم على الفعل (نعبد) لإفادة القصر والاختصاص، وفيها التفات من الغيبة إلى الخطاب.",
                tajweedAndQiraat = "تحقيق تشديد الياء في (إيَّاك) من غير رخاوة زائدة ولا اختلاس، وإتمام ضم الدال في (نعبدُ) قبل الواو."
            ),
            AyahEntity(
                compositeKey = "1:6",
                surahNumber = 1,
                surahNameAr = "الفاتحة",
                revelationType = "مكية",
                ayahNumber = 6,
                pageNumber = 1,
                juzNumber = 1,
                hizbNumber = 1,
                uthmaniText = "ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ",
                plainSearchText = ArabicTextNormalizer.normalizeForSearch("اهدنا الصراط المستقيم"),
                tafsirMuyassar = "دلنا وأرشدنا ووفقنا إلى الطريق الواضح الذي لا اعوجاج فيه وثبتنا عليه.",
                tafsirSaadi = "الهداية المطلوبة تشمل هداية الإرشاد والعلم بالحق، وهداية التوفيق للعمل به والثبات عليه.",
                tafsirIbnKathir = "لما تقدم الثناء على المسؤول ناسب أن يعقبه السؤال لأشرف المطالب وهو الهداية للصراط المستقيم.",
                tafsirTabari = "أجمعت الأمة من أهل التأويل على أن الصراط المستقيم هو الطريق الواضح الذي لا اعوجاج فيه وهو الإسلام والقرآن.",
                gharibKalimat = "الصراط: الطريق الجادة الواضحة المستوية (مفردات الراغب الأصفهاني).",
                asbabNuzul = "أعظم دعاء افترضه الله على عباده في كل ركعة من صلاتهم.",
                irabAndBalaghah = "(اهدنا) فعل دعاء، و(نا) مفعول أول، و(الصراط) مفعول ثانٍ؛ وتعديته بنفسه دون حرف جر لتضمينه معنى الثبات والملازمة.",
                tajweedAndQiraat = "الابتداء بهمزة الوصل في (اهدنا) مكسورة لأن ثالث الفعل مكسور؛ وقرأ قنبل بالسين (السراط) وحمزة بالزاي المشمة وباقي القراء بالصاد."
            ),
            AyahEntity(
                compositeKey = "1:7",
                surahNumber = 1,
                surahNameAr = "الفاتحة",
                revelationType = "مكية",
                ayahNumber = 7,
                pageNumber = 1,
                juzNumber = 1,
                hizbNumber = 1,
                uthmaniText = "صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ",
                plainSearchText = ArabicTextNormalizer.normalizeForSearch("صراط الذين انعمت عليهم غير المغضوب عليهم ولا الضالين"),
                tafsirMuyassar = "طريق الذين أنعمت عليهم من النبيين والصديقين والشهداء والصالحين، غير طريق من علموا الحق وتركوه ومن جهلوه فضلوا.",
                tafsirSaadi = "أصناف الناس ثلاثة: منعم عليهم عرفوا الحق وعملوا به، ومغضوب عليهم تركوا العمل، وضالون عبدوا على جهل.",
                tafsirIbnKathir = "تفسير الصراط المستقيم بأنه طريق أهل الطاعة، وإسناد النعمة إلى الله صريحاً وحذف فاعل الغضب أدباً في الخطاب.",
                tafsirTabari = "بيان أن كمال الهداية باجتماع العلم النافع والعمل الصالح ومجانبة مسلك التفريط والإفراط.",
                gharibKalimat = "الضلال: العدول عن الطريق المستقيم عمداً أو خطأً (مفردات الراغب).",
                asbabNuzul = "فسرها النبي ﷺ في الأحاديث الصحيحة بالمجانبة لطريق من فسد عمله أو فسد علمه (الواحدي).",
                irabAndBalaghah = "(صراطَ) بدل كل من كل من الصراط الأول لزيادة البيان والتقرير؛ وفي نسبة الإنعام لله وبناء (المغضوب) للمفعول أدب قرآني رفيع.",
                tajweedAndQiraat = "إظهار النون الساكنة في (أنعمت) لوقوع العين بعدها؛ ومد لازم كلمي مثقل في (الضَّآلِّينَ) يمد ٦ حركات لزوماً عند جميع القراء."
            ),
            AyahEntity(
                compositeKey = "2:255",
                surahNumber = 2,
                surahNameAr = "البقرة",
                revelationType = "مدنية",
                ayahNumber = 255,
                pageNumber = 42,
                juzNumber = 3,
                hizbNumber = 5,
                uthmaniText = "ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ ۚ لَا تَأْخُذُهُۥ سِنَةٌ وَلَا نَوْمٌ",
                plainSearchText = ArabicTextNormalizer.normalizeForSearch("الله لا اله الا هو الحي القيوم لا تاخذه سنه ولا نوم"),
                tafsirMuyassar = "أعظم آية في كتاب الله، تقرر تفرد الله بالألوهية وحياته الكاملة وقيوميته على جميع المخلوقات وتنزهه عن الغفلة والنوم.",
                tafsirSaadi = "جمعت آية الكرسي توحيد الألوهية والربوبية والأسماء والصفات، فالحي كامل الحياة، والقيوم القائم بنفسه المقيم لغيره.",
                tafsirIbnKathir = "ثبت في الصحيح عن أبي بن كعب رضي الله عنه أن النبي ﷺ قال: (يا أبا المنذر أتدري أي آية من كتاب الله معك أعظم؟) قال: آية الكرسي.",
                tafsirTabari = "السِّنة: النعاس في الرأس، والنوم في القلب؛ فنفى الله عن نفسه كل آفة ونقص لأن القيوم لا يغفل عن تدبير ملكه.",
                gharibKalimat = "القيوم: القائم الحافظ لكل شيء والرزاق له؛ السِّنة: فتور يتقدم النوم (مفردات الراغب).",
                asbabNuzul = "نزلت بالمدينة، وثبت في الأحاديث الصحيحة فضل قراءتها دبر كل صلاة مكتوبة وعند النوم للحفظ (الواحدي).",
                irabAndBalaghah = "جمل متتابعة مستأنفة غير معطوفة (فصل بلاغي) لكمال الاتصال وتقرير عظمة الذات الإلهية حكماً بعد حكم.",
                tajweedAndQiraat = "مد جائز منفصل في (لَآ إِلَٰهَ)، وإدغام بغنة في (سِنَةٌ وَلَا)، ومد صلة صغرى في هاء (تَأْخُذُهُۥ) بمقدار حركتين."
            ),
            AyahEntity(
                compositeKey = "73:4",
                surahNumber = 73,
                surahNameAr = "المزمل",
                revelationType = "مكية",
                ayahNumber = 4,
                pageNumber = 574,
                juzNumber = 29,
                hizbNumber = 58,
                uthmaniText = "أَوْ زِدْ عَلَيْهِ وَرَتِّلِ ٱلْقُرْءَانَ تَرْتِيلًا",
                plainSearchText = ArabicTextNormalizer.normalizeForSearch("او زد عليه ورتل القران ترتيلا"),
                tafsirMuyassar = "واقرأ القرآن على تمهل وتبيين للحروف والوقوف؛ فإن ذلك أعون على الفهم والتدبر.",
                tafsirSaadi = "ترتيل القرآن به يحصل التدبر والتفكر وتحريك القلوب بآياته وتعظيم كلام الله.",
                tafsirIbnKathir = "سئل علي بن أبي طالب رضي الله عنه عن هذه الآية فقال: الترتيل هو تجويد الحروف ومعرفة الوقوف.",
                tafsirTabari = "بيّن قراءتك ترسلاً وتثبتاً دون عجلة؛ وتأكيد الفعل بالمصدر (ترتيلاً) للدلالة على وجوب العناية بحسن الأداء.",
                gharibKalimat = "الترتيل: إرسال الكلمة من الفم بسهولة واستقامة واتساق (مفردات الراغب الأصفهاني).",
                asbabNuzul = "نزلت في أوائل العهد المكي تأسيساً لقيام الليل وتلاوة الوحي بتمهل وتدبر (الواحدي).",
                irabAndBalaghah = "(ترتيلاً) مفعول مطلق مؤكد لعامله (رتل) لتعظيم شأن الترتيل ونفي القراءة العجلى التي تخل بالمعنى.",
                tajweedAndQiraat = "الأصل القرآني لعلم التجويد؛ وفي (عَلَيْهِ) رخاوة الياء الساكنة المفتوح ما قبلها (ياء لين)، ومد عوض في الوقف على (تَرْتِيلًا)."
            ),
            AyahEntity(
                compositeKey = "112:1",
                surahNumber = 112,
                surahNameAr = "الإخلاص",
                revelationType = "مكية",
                ayahNumber = 1,
                pageNumber = 604,
                juzNumber = 30,
                hizbNumber = 60,
                uthmaniText = "قُلْ هُوَ ٱللَّهُ أَحَدٌ",
                plainSearchText = ArabicTextNormalizer.normalizeForSearch("قل هو الله احد"),
                tafsirMuyassar = "قل أيها الرسول: هو الله المتفرد بالألوهية والربوبية والكمال الذي لا شريك له ولا نظير.",
                tafsirSaadi = "الأحد هو الذي توحد بجميع الكمالات، فليس له سمي ولا كفؤ ولا مثيل.",
                tafsirIbnKathir = "سورة الإخلاص تعدل ثلث القرآن لأنها أخلصت في صفة الرحمن عز وجل وتنزيهه عن الولد والشريك.",
                tafsirTabari = "هو الله الواحد الذي لا ثاني له في ربوبيته وإلهيته.",
                gharibKalimat = "أحد: أبلغ من واحد في نفي التركيب والتعدد والشبيه (مفردات الراغب).",
                asbabNuzul = "سأل المشركون النبي ﷺ: انسب لنا ربك، فأنزل الله سورة الإخلاص (أسباب النزول للواحدي).",
                irabAndBalaghah = "(هو) ضمير الشأن في محل رفع مبتدأ، و(الله أحد) جملة خبرية تفيد عظمة المتحدث عنه.",
                tajweedAndQiraat = "قلقلة الدال في (أَحَدٌ) عند الوقف عليها قلقلة كبرى لأنها من حروف (قطب جد) متطرفة."
            ),
            AyahEntity(
                compositeKey = "112:2",
                surahNumber = 112,
                surahNameAr = "الإخلاص",
                revelationType = "مكية",
                ayahNumber = 2,
                pageNumber = 604,
                juzNumber = 30,
                hizbNumber = 60,
                uthmaniText = "ٱللَّهُ ٱلصَّمَدُ",
                plainSearchText = ArabicTextNormalizer.normalizeForSearch("الله الصمد"),
                tafsirMuyassar = "الله وحده المقصود في قضاء الحوائج والرغائب، الكامل في صفاته الغني عن كل أحد.",
                tafsirSaadi = "الصمد: السيد الذي كمل في سؤدده وعلمه وحكمته، وتفتقر إليه جميع المخلوقات.",
                tafsirIbnKathir = "قال ابن عباس رضي الله عنهما: الصمد هو السيد الذي قد كمل في سؤدده والشريف الذي قد كمل في شرفه.",
                tafsirTabari = "المصمود إليه في الحوائج، الباقي الدائم الذي لا جوف له ولا يفتقر إلى غيره.",
                gharibKalimat = "الصمد: السيد المقصود في النوازل والحاجات الذي لا يُقضى دونه أمر (مفردات الراغب).",
                asbabNuzul = "تتمة بيان صفات الكمال الإلهي في سورة الإخلاص.",
                irabAndBalaghah = "تعريف الجزأين (اللهُ الصمدُ) يفيد قصر الصمدية الكاملة على الله عز وجل وحده.",
                tajweedAndQiraat = "إدغام اللام الشمسية في الصاد المشددة من (الصَّمَدُ) مع تفخيم الصاد وإطباقها، وقلقلة الدال وقفاً."
            )
        )
        return rawAyahs + ItqanPhase2SeedData.buildExpandedOfflineAyahs()
    }

    fun buildInitialFsrsReviews(nowMillis: Long = System.currentTimeMillis()): List<FsrsReviewEntity> {
        val hourMillis = 60L * 60L * 1000L
        return listOf(
            FsrsReviewEntity(
                itemId = "hifz_1_1_7",
                title = "سورة الفاتحة (الآيات ١ - ٧)",
                surahNumber = 1,
                ayahStart = 1,
                ayahEnd = 7,
                targetRepetitions = 5,
                completedRepetitions = 5,
                stability = 4.2,
                difficulty = 2.8,
                elapsedDays = 3,
                scheduledDays = 3,
                reps = 4,
                lapses = 0,
                lastGrade = 4,
                dueTimestamp = nowMillis - (2 * hourMillis), // Due today
                lastReviewTimestamp = nowMillis - (72 * hourMillis)
            ),
            FsrsReviewEntity(
                itemId = "hifz_2_255_255",
                title = "آية الكرسي — سورة البقرة (٢٥٥)",
                surahNumber = 2,
                ayahStart = 255,
                ayahEnd = 255,
                targetRepetitions = 7,
                completedRepetitions = 4,
                stability = 2.5,
                difficulty = 4.1,
                elapsedDays = 2,
                scheduledDays = 2,
                reps = 3,
                lapses = 0,
                lastGrade = 3,
                dueTimestamp = nowMillis - hourMillis, // Due today
                lastReviewTimestamp = nowMillis - (48 * hourMillis)
            ),
            FsrsReviewEntity(
                itemId = "hifz_73_1_10",
                title = "فواتح سورة المزمل (١ - ١٠)",
                surahNumber = 73,
                ayahStart = 1,
                ayahEnd = 10,
                targetRepetitions = 5,
                completedRepetitions = 2,
                stability = 1.6,
                difficulty = 5.4,
                elapsedDays = 1,
                scheduledDays = 2,
                reps = 2,
                lapses = 1,
                lastGrade = 2,
                dueTimestamp = nowMillis + (20 * hourMillis), // Tomorrow
                lastReviewTimestamp = nowMillis - (24 * hourMillis)
            ),
            FsrsReviewEntity(
                itemId = "hifz_112_1_4",
                title = "سورة الإخلاص والمعوذتان",
                surahNumber = 112,
                ayahStart = 1,
                ayahEnd = 4,
                targetRepetitions = 3,
                completedRepetitions = 3,
                stability = 8.5,
                difficulty = 2.1,
                elapsedDays = 5,
                scheduledDays = 8,
                reps = 6,
                lapses = 0,
                lastGrade = 4,
                dueTimestamp = nowMillis - (30 * 60 * 1000L), // Due today
                lastReviewTimestamp = nowMillis - (120 * hourMillis)
            )
        )
    }

    val academyLessons: List<ScienceLesson> = listOf(
        // 1. TAJWEED TRACK (Foundational, Intermediate, Advanced)
        ScienceLesson(
            id = "lesson_tajweed_1",
            trackId = ScienceTrackId.TAJWEED,
            level = AcademicLevel.FOUNDATIONAL,
            orderIndex = 1,
            title = "مخارج الحروف السبعة عشر وأقسامها الخمسة",
            summary = "دراسة مواضع خروج الحروف العربية على مذهب الإمام ابن الجزري والخليل بن أحمد.",
            matnText = "مَخَارِجُ الحُرُوفِ سَبْعَةَ عَشَرْ ... عَلَى الَّذِي يَخْتَارُهُ مَنِ اخْتَبَرْ",
            detailedExplanation = """
                تنقسم مخارج الحروف الرئيسية إلى خمسة مخارج عامة تشتمل على سبعة عشر مخرجاً خاصاً عند الإمام ابن الجزري:
                ١. الجوف (مخرج واحد): وتخرج منه حروف المد الثلاثة (الألف، والواو الساكنة المضموم ما قبلها، والياء الساكنة المكسور ما قبلها).
                ٢. الحلق (٣ مخارج): أقصى الحلق (الهمزة والهاء)، وسط الحلق (العين والحاء)، أدنى الحلق (الغين والخاء).
                ٣. اللسان (١٠ مخارج): ويخرج منه ١٨ حرفاً، من أقصى اللسان (القاف والكاف) ووسطه (الجيم والشين والياء) وحافتيه (الضاد واللام) وطرفه.
                ٤. الشفتان (مخرجان): الفاء من بطن الشفة السفلى مع أطراف الثنايا العليا، والشفتان معاً للباء والميم والواو غير المدية.
                ٥. الخيشوم (مخرج واحد): وتخرج منه صفة الغنة المركبة في جسم النون والميم.
            """.trimIndent(),
            quranicEvidenceRefs = listOf("73:4", "1:1"),
            sourceCitation = "المقدمة الجزرية لابن الجزري — باب مخارج الحروف (الأبيات ٩ - ٢٠)",
            sourceRegistryId = "src_jazariyyah",
            attribution = ContentAttributionType.TEAM_SIMPLIFIED,
            practiceTask = "انطق همزة قطع ساكنة قبل الحرف (نحو: أَقْ، أَكْ، أَعْ) ولاحظ موضع انقطاع الصوت لتحديد المخرج بدقة.",
            quizQuestions = listOf(
                QuizQuestion(
                    id = "q_taj_1_1",
                    questionText = "كم عدد مخارج الحروف الخاصة على القول المختار عند الإمام ابن الجزري؟",
                    options = listOf("١٧ مخرجاً في ٥ مخارج عامة", "١٤ مخرجاً", "١٦ مخرجاً", "٢٨ مخرجاً بعدد الحروف"),
                    correctIndex = 0,
                    explanation = "اختار الإمام ابن الجزري مذهب الخليل بن أحمد وهو أن المخارج الخاصة سبعة عشر مخرجاً.",
                    sourceCitation = "المقدمة الجزرية لابن الجزري، البيت ٩"
                ),
                QuizQuestion(
                    id = "q_taj_1_2",
                    questionText = "ما الحروف التي تخرج من وسط الحلق؟",
                    options = listOf("العين والحاء", "الهمزة والهاء", "الغين والخاء", "القاف والكاف"),
                    correctIndex = 0,
                    explanation = "أقصى الحلق للهمزة والهاء، ووسطه للعين والحاء المهملتين، وأدناه للغين والخاء المعجمتين.",
                    sourceCitation = "المقدمة الجزرية لابن الجزري، البيتان ١١-١٢"
                )
            )
        ),
        ScienceLesson(
            id = "lesson_tajweed_2",
            trackId = ScienceTrackId.TAJWEED,
            level = AcademicLevel.INTERMEDIATE,
            orderIndex = 2,
            title = "أحكام النون الساكنة والتنوين الأربعة",
            summary = "التفريق العلمي والتطبيقي بين الإظهار الحلقي والإدغام بقسميه والإقلاب والإخفاء الحقيقي.",
            matnText = "لِلنُّونِ إِنْ تَسْكُنْ وَلِلتَّنْوِينِ ... أَرْبَعُ أَحْكَامٍ فَخُذْ تَبْيِينِي",
            detailedExplanation = """
                للنون الساكنة والتنوين أربعة أحكام عند التقاء حروف الهجاء:
                ١. الإظهار الحلقي: إخراج النون من مخرجها بغير غنة زائدة عند حروف الحلق الستة (ء هـ ع ح غ خ).
                ٢. الإدغام: إدخال النون الساكنة في حروف (يرملون)، وينقسم إلى إدغام بغنة في (ينمو) وإدغام بغير غنة في (اللام والراء).
                ٣. الإقلاب: قلب النون الساكنة أو التنوين ميماً مخفاة بغنة عند ملاقاتها حرف الباء.
                ٤. الإخفاء الحقيقي: النطق بالحرف بصفة بين الإظهار والإدغام عارياً عن التشديد مع بقاء الغنة عند الحروف الخمسة عشر الباقية.
            """.trimIndent(),
            quranicEvidenceRefs = listOf("1:7", "2:255"),
            sourceCitation = "تحفة الأطفال للجمزوري — باب أحكام النون الساكنة والتنوين (الأبيات ٦ - ٢٣)",
            sourceRegistryId = "src_tuhfah",
            attribution = ContentAttributionType.TEAM_SIMPLIFIED,
            practiceTask = "استخرج حكم النون الساكنة في قوله تعالى (أَنْعَمْتَ عَلَيْهِمْ) والتنوين في (سِنَةٌ وَلَا نَوْمٌ).",
            quizQuestions = listOf(
                QuizQuestion(
                    id = "q_taj_2_1",
                    questionText = "ما حكم النون الساكنة في قوله تعالى (أَنْعَمْتَ)؟",
                    options = listOf("إظهار حلقي لوقوع العين بعدها", "إخفاء حقيقي", "إدغام بغير غنة", "إقلاب"),
                    correctIndex = 0,
                    explanation = "العين من حروف الحلق الستة، فيجب إظهار النون الساكنة قبلها إظهاراً حلقياً.",
                    sourceCitation = "تحفة الأطفال للجمزوري، الأبيات ٧-١٠"
                )
            )
        ),
        ScienceLesson(
            id = "lesson_tajweed_3",
            trackId = ScienceTrackId.TAJWEED,
            level = AcademicLevel.ADVANCED,
            orderIndex = 3,
            title = "صفات الحروف اللازمة والوقف والابتداء",
            summary = "الصفات المتضادة وغير المتضادة وضوابط الوقف التام والكافي والحسن والقبيح.",
            matnText = "صِفَاتُهَا جَهْرٌ وَرِخْوٌ مُسْتَفِلْ ... مُنْفَتِحٌ مُصْمَتَةٌ وَالضِّدَّ قُلْ",
            detailedExplanation = """
                تُعرف صفات الحروف لتمييز الحروف المشتركة في المخرج:
                • الصفات ذوات الأضداد خمس: الهمس وضده الجهر، الشدة والتوسط وضدهما الرخاوة، الاستعلاء وضده الاستفال، الإطباق وضده الانفتاح، الإذلاق وضده الإصمات.
                • الصفات التي لا ضد لها سبع: الصفير (ص ز س)، القلقلة (قطب جد)، اللين، الانحراف، التكرير، التفشي، والاستطالة في الضاد.
                • وفي باب الوقف والابتداء: ينقسم الوقف الاختياري إلى تام وكافٍ وحسن، ولا يوجد في القرآن وقف واجب شرعاً يأثم تاركه إلا ما تعمد فيه القارئ فساد المعنى.
            """.trimIndent(),
            quranicEvidenceRefs = listOf("112:1", "1:7"),
            sourceCitation = "المقدمة الجزرية لابن الجزري — باب الصفات وباب الوقف والابتداء",
            sourceRegistryId = "src_jazariyyah",
            attribution = ContentAttributionType.TEAM_SIMPLIFIED,
            practiceTask = "طبّق صفة القلقلة الكبرى عند الوقف على دال (أَحَدٌ) و(الصَّمَدُ) وصفة الاستطالة في ضاد (الضَّآلِّينَ).",
            quizQuestions = listOf(
                QuizQuestion(
                    id = "q_taj_3_1",
                    questionText = "ما الحروف المجموعة في صفة القلقلة؟",
                    options = listOf("قطب جد", "خص ضغط قظ", "فر من لب", "سكت فحثه شخص"),
                    correctIndex = 0,
                    explanation = "حروف القلقلة خمسة يجمعها قول ابن الجزري (قلقلة قطب جد).",
                    sourceCitation = "المقدمة الجزرية لابن الجزري، البيت ٢٤"
                )
            )
        ),

        // 2. TAFSIR TRACK
        ScienceLesson(
            id = "lesson_tafsir_1",
            trackId = ScienceTrackId.TAFSIR,
            level = AcademicLevel.FOUNDATIONAL,
            orderIndex = 1,
            title = "أصول التفسير ومراتبه المعتمدة",
            summary = "المنهج الأصيل في تفسير القرآن بالقرآن ثم بالسنة النبوية ثم بأقوال الصحابة واللغة.",
            matnText = "أصح الطرق في التفسير أن يُفسر القرآن بالقرآن، فما أُجمل في مكان فإنه قد فُصّل في موضع آخر.",
            detailedExplanation = """
                يستند علم التفسير عند أئمة التفسير كالطبري وابن كثير والسعدي إلى أربع مراتب أصولية:
                ١. تفسير القرآن بالقرآن: كبيان (الصراط المستقيم) في الفاتحة بقوله في سورة النساء (مَعَ الَّذِينَ أَنْعَمَ اللَّهُ عَلَيْهِمْ مِنَ النَّبِيِّينَ وَالصِّدِّيقِينَ وَالشُّهَدَاءِ وَالصَّالِحِينَ).
                ٢. تفسير القرآن بالسنة النبوية الصحيحة: لأنها شارحة للقرآن ومبينة لمجمله.
                ٣. تفسير الصحابة رضي الله عنهم: لشهادتهم التنزيل ومعرفتهم بأحواله وأسبابه ولغتهم السليمة.
                ٤. دلالة اللغة العربية السليمة وسياق الآيات: كما اعتنى به الطبري والراغب الأصفهاني في المفردات.
            """.trimIndent(),
            quranicEvidenceRefs = listOf("1:6", "1:7"),
            sourceCitation = "مقدمة تفسير القرآن العظيم لابن كثير • الإتقان للسيوطي (النوع الثامن والسبعون)",
            sourceRegistryId = "src_ibn_kathir",
            attribution = ContentAttributionType.TEAM_SIMPLIFIED,
            practiceTask = "قارن بين عرض التفسير الميسر وتفسير ابن كثير للآية السابعة من سورة الفاتحة من بطاقة علوم الآية.",
            quizQuestions = listOf(
                QuizQuestion(
                    id = "q_taf_1_1",
                    questionText = "ما أولى وأصح مراتب تفسير القرآن الكريم عند علماء التفسير؟",
                    options = listOf("تفسير القرآن بالقرآن ثم بالسنة النبوية", "التفسير بالرأي المجرد", "الإسرائيليات", "الشواهد المتأخرة"),
                    correctIndex = 0,
                    explanation = "اتفق الأئمة على أن أصح طرق التفسير هو تفسير القرآن بالقرآن ثم بالسنة الصحيحة.",
                    sourceCitation = "مقدمة تفسير ابن كثير، ج١"
                )
            )
        ),
        ScienceLesson(
            id = "lesson_tafsir_2",
            trackId = ScienceTrackId.TAFSIR,
            level = AcademicLevel.INTERMEDIATE,
            orderIndex = 2,
            title = "ضوابط علم أسباب النزول وفوائده",
            summary = "العبرة بعموم اللفظ لا بخصوص السبب، وطريق معرفة سبب النزول بالنقل الصحيح.",
            matnText = "لا يحل القول في أسباب نزول الكتاب إلا بالرواية والسماع ممن شاهدوا التنزيل ووقفوا على الأسباب.",
            detailedExplanation = """
                قرر الإمام الواحدي والسيوطي قواعد محكمة في علم أسباب النزول:
                • طريق معرفته: النقل الصحيح الصريح عن الصحابة، ولا مجال للاجتهاد العقلي المجرد فيه.
                • فوائده الجليلة: معرفة وجه الحكمة الباعثة على تشريع الحكم، وتعيين المراد ودفع توهم الحصر، وتيسير الحفظ والفهم.
                • القاعدة الأصولية الكبرى: (العبرة بعموم اللفظ لا بخصوص السبب)؛ فالآية تنزل في واقعة معينة لكن حكمها يشمل كل من اتصف بصفة تلك الواقعة.
            """.trimIndent(),
            quranicEvidenceRefs = listOf("112:1", "2:255"),
            sourceCitation = "أسباب النزول للواحدي (المقدمة) • الإتقان في علوم القرآن للسيوطي (النوع التاسع)",
            sourceRegistryId = "src_wahidi",
            attribution = ContentAttributionType.TEAM_SIMPLIFIED,
            practiceTask = "راجع سبب نزول سورة الإخلاص في بطاقة علوم الآية وكيف جاء الرد جامعاً لأصول التوحيد.",
            quizQuestions = listOf(
                QuizQuestion(
                    id = "q_taf_2_1",
                    questionText = "ما القاعدة المعتمدة عند جمهور العلماء إذا نزلت آية بلفظ عام على سبب خاص؟",
                    options = listOf("العبرة بعموم اللفظ لا بخصوص السبب", "قصر الحكم على الشخص الذي نزلت فيه فقط", "نسخ الآية", "توقف العمل بها"),
                    correctIndex = 0,
                    explanation = "القاعدة المقررة أن العبرة بعموم ألفاظ الشريعة لا بخصوص أسبابها.",
                    sourceCitation = "الإتقان في علوم القرآن للسيوطي — النوع التاسع"
                )
            )
        ),
        ScienceLesson(
            id = "lesson_tafsir_3",
            trackId = ScienceTrackId.TAFSIR,
            level = AcademicLevel.ADVANCED,
            orderIndex = 3,
            title = "غريب القرآن والقواعد الحسان في التفسير",
            summary = "منهج الراغب الأصفهاني في رد المفردات إلى أصولها، وقواعد السعدي في فهم العموم القرآني.",
            matnText = "أول ما يُحتاج إلى الاشتغال به من علوم القرآن العلوم اللفظية، ومن تحقيق الألفاظ المفردة.",
            detailedExplanation = """
                تميّز كتاب (المفردات في غريب القرآن) للراغب الأصفهاني برد الكلمات القرآنية إلى جذرها اللغوي الأصلي وبيان العلاقة بين المعنى الحسي والمعنى الشرعي، كبيان الفرق بين (الرحمن) و(الرحيم) وبين (السِّنة) و(النوم).
                وجمع الشيخ السعدي في (القواعد الحسان) أصولاً كلية، منها: أن حذف المتعلق في القرآن يفيد تعميم المعنى المناسب للمقام، وأن اقتران الأسماء الحسنى في خواتيم الآيات مرتبط ارتباطاً وثيقاً بمعنى الآية وحكمها.
            """.trimIndent(),
            quranicEvidenceRefs = listOf("2:255", "1:1"),
            sourceCitation = "مفردات غريب القرآن للراغب الأصفهاني • القواعد الحسان لتفسير القرآن للسعدي",
            sourceRegistryId = "src_raghib",
            attribution = ContentAttributionType.TEAM_SIMPLIFIED,
            practiceTask = "تأمل ختم آية الكرسي بـ (وهو العلي العظيم) وعلاقته بصفات الملك والقيومية في أول الآية.",
            quizQuestions = listOf(
                QuizQuestion(
                    id = "q_taf_3_1",
                    questionText = "ما الفرق اللغوي بين (السِّنة) و(النوم) كما في آية الكرسي عند أئمة الغريب والتفسير؟",
                    options = listOf("السِّنة مقدمة النعاس في الرأس والعين، والنوم استثقال في القلب", "هما مترادفان بلا فرق", "السِّنة النوم العميق", "السِّنة الغفلة الطويلة"),
                    correctIndex = 0,
                    explanation = "السِّنة فتور ونعاس يتقدم النوم، فنفى الله عن نفسه البداية والغاية لكمال قيوميته.",
                    sourceCitation = "تفسير الطبري ومفردات الراغب الأصفهاني — مادة (وسن)"
                )
            )
        ),

        // 3. TANZEEL TRACK (Makki/Madani, Nasikh/Mansukh, Qasas)
        ScienceLesson(
            id = "lesson_tanzeel_1",
            trackId = ScienceTrackId.TANZEEL,
            level = AcademicLevel.FOUNDATIONAL,
            orderIndex = 1,
            title = "المكي والمدني: ضوابطه وخصائصه",
            summary = "الضابط الزماني للهجرة النبوية وخصائص السور المكية والمدنية موضوعاً وأسلوباً.",
            matnText = "الاصطلاح المشهور الصحيح أن المكي ما نزل قبل الهجرة وإن كان بغير مكة، والمدني ما نزل بعد الهجرة.",
            detailedExplanation = """
                حرر السيوطي في (الإتقان) أن الضابط الأدق للمكي والمدني هو الضابط الزماني باعتبار الهجرة النبوية:
                • المكي: ما نزل قبل الهجرة إلى المدينة، ومن أبرز سماته تقرير التوحيد والبعث والجزاء، ومجادلة المشركين بالبراهين الكونية، وقصر الفواصل في كثير من سوره، وكل سورة فيها (كلا) أو سجدة تلاوة فهي مكية على المشهور.
                • المدني: ما نزل بعد الهجرة، ويمتاز بتفصيل الأحكام التشريعية والعبادات والمعاملات، ومخاطبة أهل الكتاب، وفضح المنافقين.
            """.trimIndent(),
            quranicEvidenceRefs = listOf("1:1", "2:255"),
            sourceCitation = "الإتقان في علوم القرآن للسيوطي — النوع الأول: معرفة المكي والمدني",
            sourceRegistryId = "src_itqan",
            attribution = ContentAttributionType.TEAM_SIMPLIFIED,
            practiceTask = "ميز بين طابع سورة الإخلاص (المكية) وآية الكرسي من سورة البقرة (المدنية).",
            quizQuestions = listOf(
                QuizQuestion(
                    id = "q_tan_1_1",
                    questionText = "ما الضابط الأصح عند جمهور علماء القرآن في تعريف المكي والمدني؟",
                    options = listOf("المكي ما نزل قبل الهجرة والمدني ما نزل بعدها", "المكان الجغرافي فقط", "طول الآيات وقصرها فقط", "خطاب الناس أو المؤمنين فقط"),
                    correctIndex = 0,
                    explanation = "الضابط الزماني باعتبار الهجرة هو الأشهر والأعمق لأنه مضطرد وشامل لجميع الآيات.",
                    sourceCitation = "الإتقان في علوم القرآن للسيوطي — النوع الأول"
                )
            )
        ),
        ScienceLesson(
            id = "lesson_tanzeel_2",
            trackId = ScienceTrackId.TANZEEL,
            level = AcademicLevel.INTERMEDIATE,
            orderIndex = 2,
            title = "الناسخ والمنسوخ والمحكم والمتشابه",
            summary = "حقيقة النسخ في الشريعة وحكمته التدرجية، ورد المتشابه إلى المحكم.",
            matnText = "النسخ رفع الشارع حكماً شرعياً بدليل شرعي متأخر رعاية لمصالح العباد في التدرج.",
            detailedExplanation = """
                • المحكم والمتشابه: القرآن كله محكم في نظمه وصدقه، ومنه آيات محكمات واضحـات الدلالة هن (أم الكتاب) يُردّ إليهن المتشابه المحتمل لأكثر من وجه.
                • الناسخ والمنسوخ: يقع النسخ في الأحكام العملية (الأمر والنهي) ولا يقع في الأخبار ولا في أصول العقائد والأخلاق الكلية. وقد حرر السيوطي أن الآيات التي صح فيها النسخ بالمعنى الأصولي الدقيق معدودة ومحدودة، كالتدرج في فرض قيام الليل في سورة المزمل.
            """.trimIndent(),
            quranicEvidenceRefs = listOf("73:4"),
            sourceCitation = "الإتقان في علوم القرآن للسيوطي — النوع الثالث والأربعون والنوع السابع والأربعون",
            sourceRegistryId = "src_itqan",
            attribution = ContentAttributionType.TEAM_SIMPLIFIED,
            practiceTask = "اقرأ أول سورة المزمل وآخرها لتلاحظ التيسير التشريعي والتدرج الحكيم.",
            quizQuestions = listOf(
                QuizQuestion(
                    id = "q_tan_2_1",
                    questionText = "في أي أبواب الشريعة يدخل النسخ الأصولي؟",
                    options = listOf("في الأحكام التكليفية الفرعية (الأمر والنهي) دون العقائد والأخبار", "في الأخبار التاريخية", "في صفات الله عز وجل", "في جميع الآيات بلا استثناء"),
                    correctIndex = 0,
                    explanation = "الأخبار والعقائد لا يدخلها النسخ لأن نسخ الخبر تكذيب وهو محال على كلام الله.",
                    sourceCitation = "الإتقان للسيوطي ومباحث في علوم القرآن لمنّاع القطان"
                )
            )
        ),
        ScienceLesson(
            id = "lesson_tanzeel_3",
            trackId = ScienceTrackId.TANZEEL,
            level = AcademicLevel.ADVANCED,
            orderIndex = 3,
            title = "مقاصد القصص القرآني وخصائصه البيانية",
            summary = "المنهج القرآني في عرض القصة للعبرة وتثبيت الفؤاد وتقرير التوحيد.",
            matnText = "نحن نقص عليك أحسن القصص بما أوحينا إليك هذا القرآن.",
            detailedExplanation = """
                يمتاز القصص القرآني عن السرد التاريخي البشري بخصائص فريدة:
                ١. الصدق المطلق والبرهان العلمي (الحق).
                ٢. اختيار الحلقات والمواقف التي تخدم مقصد السورة التربوي والعقدي.
                ٣. التكرار الهادف بتنويع الأسلوب والزوايا دون تناقض، فيُذكر في كل موضع ما يناسب سياق السورة ومقصدها.
                ٤. تثبيت قلب النبي ﷺ والمؤمنين وبيان سنن الله في نصر أوليائه.
            """.trimIndent(),
            quranicEvidenceRefs = listOf("1:7"),
            sourceCitation = "مباحث في علوم القرآن لمنّاع القطان — مبحث القصص القرآني",
            sourceRegistryId = "src_itqan",
            attribution = ContentAttributionType.TEAM_SIMPLIFIED,
            practiceTask = "تأمل كيف أشارت سورة الفاتحة في آيتها الأخيرة إلى خلاصة تاريخ الأمم في سطر واحد.",
            quizQuestions = listOf(
                QuizQuestion(
                    id = "q_tan_3_1",
                    questionText = "ما الحكمة من ورود بعض القصص القرآني في أكثر من سورة بأساليب متنوعة؟",
                    options = listOf("خدمة المقصد الخاص بكل سورة وإظهار الإعجاز البياني في أداء المعنى بطرق شتى", "مجرد الإعادة اللفظية", "اختلاف الروايات التاريخية", "نسخ القصة الأولى"),
                    correctIndex = 0,
                    explanation = "ذكر السيوطي أن تنويع الأسلوب في القصة الواحدة من أعظم وجوه الإعجاز البلاغي ومناسبة سياق كل سورة.",
                    sourceCitation = "الإتقان في علوم القرآن للسيوطي — النوع الرابع والستون"
                )
            )
        ),

        // 4. QIRA'AT & BALAGHAH TRACK
        ScienceLesson(
            id = "lesson_qiraat_1",
            trackId = ScienceTrackId.QIRAAT_LUGHAH,
            level = AcademicLevel.FOUNDATIONAL,
            orderIndex = 1,
            title = "أركان القراءة الصحيحة والأئمة العشرة ورواتهم",
            summary = "الشروط الثلاثة لقبول القراءة المتواترة والتعريف بالقراء العشرة.",
            matnText = "فَكُلُّ مَا وَافَقَ وَجْهَ نَحْوِ ... وَكَانَ لِلرَّسْمِ احْتِمَالاً يَحْوِي / وَصَحَّ إِسْنَاداً هُوَ القُرْآنُ ... فَهَذِهِ الثَّلَاثَةُ الأَرْكَانُ",
            detailedExplanation = """
                جمع الإمام ابن الجزري في طيبة النشر والنشر أركان القراءة القرآنية الصحيحة في ثلاثة شروط:
                ١. التواتر وصحة السند المتصل إلى النبي ﷺ.
                ٢. موافقة خط أحد المصاحف العثمانية ولو احتمالاً (كـ مالكِ وملكِ في الفاتحة).
                ٣. موافقة وجه من وجوه اللغة العربية الفصيحة.
                والقراء العشرة المتواترون هم: نافع المدني، وابن كثير المكي، وأبو عمرو البصري، وابن عامر الشامي، وعاصم الكوفي (ومن رواته حفص وشعبة)، وحمزة، والكسائي، وأبو جعفر، ويعقوب، وخلف العاشر.
            """.trimIndent(),
            quranicEvidenceRefs = listOf("1:4"),
            sourceCitation = "النشر في القراءات العشر لابن الجزري (ج١) • الإتقان للسيوطي",
            sourceRegistryId = "src_jazariyyah",
            attribution = ContentAttributionType.TEAM_SIMPLIFIED,
            practiceTask = "تأمل كيف جمعت القراءتان المتواترتان (مَالِكِ يوم الدين) و(مَلِكِ يوم الدين) بين كمال الملك والسلطان.",
            quizQuestions = listOf(
                QuizQuestion(
                    id = "q_qir_1_1",
                    questionText = "ما الأركان الثلاثة للقراءة القرآنية المقبولة عند الإمام ابن الجزري؟",
                    options = listOf("صحة السند والتواتر، وموافقة الرسم العثماني، وموافقة العربية", "موافقة القياس النحوي وحده", "الانتشار في بلد واحد فقط", "الاجتهاد اللغوي"),
                    correctIndex = 0,
                    explanation = "إذا اختل ركن من الأركان الثلاثة (السند، الرسم، العربية) عُدّت القراءة شاذة لا يُقرأ بها.",
                    sourceCitation = "النشر في القراءات العشر لابن الجزري، ج١ ص٩"
                )
            )
        ),
        ScienceLesson(
            id = "lesson_qiraat_2",
            trackId = ScienceTrackId.QIRAAT_LUGHAH,
            level = AcademicLevel.INTERMEDIATE,
            orderIndex = 2,
            title = "ضوابط إعراب القرآن الكريم وأثره في المعنى",
            summary = "ارتباط الإعراب القرآني بالمعنى التفسيري وصون اللسان عن اللحن الجلي.",
            matnText = "الإعراب فرع المعنى؛ فينبغي للمعرب أن يراعي صحة المعنى التفسيري السياقي قبل الصناعة اللفظية.",
            detailedExplanation = """
                وضع العلماء ضوابط دقيقة عند إعراب القرآن الكريم:
                ١. أن الإعراب خادم للمعنى التفسيري؛ فيُختار الوجه الإعرابي الذي يوافق التفسير المأثور ويزيد المعنى جلاءً.
                ٢. تجنب التقديرات المتكلفة التي تخرج الآية عن فصاحتها وبلاغتها.
                ٣. مراعاة الرسم العثماني والقراءات المتواترة في توجيه أوجه الإعراب.
            """.trimIndent(),
            quranicEvidenceRefs = listOf("1:2", "1:5"),
            sourceCitation = "الإتقان في علوم القرآن للسيوطي — النوع الحادي والأربعون: معرفة إعرابه",
            sourceRegistryId = "src_itqan",
            attribution = ContentAttributionType.TEAM_SIMPLIFIED,
            practiceTask = "ادرس إعراب (إِيَّاكَ نَعْبُدُ) في بطاقة علوم الآية وكيف أفاد تقديم المفعول به الحصر والاختصاص.",
            quizQuestions = listOf(
                QuizQuestion(
                    id = "q_qir_2_1",
                    questionText = "ما الفائدة البلاغية والنحوية من تقديم الضمير المنفصل (إِيَّاكَ) على الفعل (نَعْبُدُ)؟",
                    options = listOf("إفادة القصر والاختصاص، أي نعبدك وحدك ولا نعبد غيرك", "مجرد مراعاة الفاصلة", "التخفيف اللفظي فقط", "لا أثر له في المعنى"),
                    correctIndex = 0,
                    explanation = "تقديم ما حقه التأخير (المفعول به) من أشهر طرق القصر في البلاغة العربية.",
                    sourceCitation = "الإتقان للسيوطي وتفسير السعدي — سورة الفاتحة"
                )
            )
        ),
        ScienceLesson(
            id = "lesson_qiraat_3",
            trackId = ScienceTrackId.QIRAAT_LUGHAH,
            level = AcademicLevel.ADVANCED,
            orderIndex = 3,
            title = "وجوه الإعجاز البلاغي والنظم القرآني",
            summary = "نظرية النظم عند الجرجاني ومظاهر الإيجاز والإطناب والالتفات في القرآن.",
            matnText = "أعجزهم القرآن بنظمه البديع وتآلف ألفاظه مع معانيه بحيث لو نُزعت لفظة لم يقم مقامها في فصاحتها غيرها.",
            detailedExplanation = """
                تتجلى بلاغة القرآن الكريم وإعجازه البياني في دقائق نظمه:
                • الالتفات البلاغي: الانتقال من الغيبة إلى الخطاب كما في الفاتحة من (الحمد لله رب العالمين) إلى (إياك نعبد) استحضاراً لمقام القرب والمناجاة.
                • الفصل والوصل: ترك العطف بين الجمل لكمال الاتصال كما في جمل آية الكرسي.
                • مناسبة الفواصل القرآنية للمعنى العام للآية دون تكلف.
            """.trimIndent(),
            quranicEvidenceRefs = listOf("1:5", "2:255"),
            sourceCitation = "الإتقان في علوم القرآن للسيوطي — النوع الرابع والستون: في إعجاز القرآن",
            sourceRegistryId = "src_itqan",
            attribution = ContentAttributionType.TEAM_SIMPLIFIED,
            practiceTask = "استخرج مظهر الالتفات البلاغي في سورة الفاتحة من بطاقة علوم الآية الخامسة.",
            quizQuestions = listOf(
                QuizQuestion(
                    id = "q_qir_3_1",
                    questionText = "ما الفن البلاغي في الانتقال من أسلوب الغيبة في أول الفاتحة إلى الخطاب في (إِيَّاكَ نَعْبُدُ)؟",
                    options = listOf("الالتفات البلاغي لاستحضار هيبة المخاطَب وقربه", "الجناس التام", "التورية", "الاقتباس"),
                    correctIndex = 0,
                    explanation = "الالتفات من الغيبة إلى الخطاب ينبه القلب ويستحضر مقام المثول بين يدي الله عز وجل.",
                    sourceCitation = "الإتقان في علوم القرآن للسيوطي — باب الالتفات"
                )
            )
        )
    )

    val classicalMatnVerses: List<ClassicalMatnVerse> = listOf(
        ClassicalMatnVerse(
            id = "tuhfah_1",
            matnName = "تحفة الأطفال",
            author = "الشيخ سليمان الجمزوري",
            chapterTitle = "مقدمة الناظم",
            verseNumber = 1,
            hemistichOne = "يَقُولُ رَاجِي رَحْمَةِ الْغَفُورِ",
            hemistichTwo = "دَوْماً سُلَيْمَانُ هُوَ الْجَمْزُورِي",
            explanation = "افتتح الناظم رحمه الله منظومته بالتواضع ورجاء رحمة الله الغفور الدائمة، معرفاً بنفسه ونسبته إلى بلدة جمزور.",
            sourceCitation = "تحفة الأطفال والغلمان — البيت ١"
        ),
        ClassicalMatnVerse(
            id = "tuhfah_6",
            matnName = "تحفة الأطفال",
            author = "الشيخ سليمان الجمزوري",
            chapterTitle = "أحكام النون الساكنة والتنوين",
            verseNumber = 6,
            hemistichOne = "لِلنُّونِ إِنْ تَسْكُنْ وَلِلتَّنْوِينِ",
            hemistichTwo = "أَرْبَعُ أَحْكَامٍ فَخُذْ تَبْيِينِي",
            explanation = "بيان أن للنون الساكنة (الخالية من الحركة) والتنوين (نون ساكنة زائدة تلحق آخر الاسم لفظاً لا خطاً) أربعة أحكام تفصيلية.",
            sourceCitation = "تحفة الأطفال والغلمان — البيت ٦"
        ),
        ClassicalMatnVerse(
            id = "tuhfah_7",
            matnName = "تحفة الأطفال",
            author = "الشيخ سليمان الجمزوري",
            chapterTitle = "أحكام النون الساكنة والتنوين",
            verseNumber = 7,
            hemistichOne = "فَالأَوَّلُ الإِظْهَارُ قَبْلَ أَحْرُفِ",
            hemistichTwo = "لِلْحَلْقِ سِتٌّ رُتِّبَتْ فَلْتَعْرِفِ",
            explanation = "الحكم الأول الإظهار الحلقي عند ملاقاة أحد حروف الحلق الستة المرتبة من أقصى الحلق إلى أدناه: همز فهاء ثم عين حاء مهملتان ثم غين خاء.",
            sourceCitation = "تحفة الأطفال والغلمان — البيتان ٧-٨"
        ),
        ClassicalMatnVerse(
            id = "tuhfah_18",
            matnName = "تحفة الأطفال",
            author = "الشيخ سليمان الجمزوري",
            chapterTitle = "أحكام النون والميم المشددتين",
            verseNumber = 18,
            hemistichOne = "وَغُنَّ مِيماً ثُمَّ نُوناً شُدِّدَا",
            hemistichTwo = "وَسَمِّ كُلاًّ حَرْفَ غُنَّةٍ بَدَا",
            explanation = "وجوب إظهار الغنة بمقدار حركتين في كل ميم أو نون مشددة وصلاً ووقفاً.",
            sourceCitation = "تحفة الأطفال والغلمان — البيت ١٨"
        ),
        ClassicalMatnVerse(
            id = "jazariyyah_9",
            matnName = "المقدمة الجزرية",
            author = "الإمام ابن الجزري",
            chapterTitle = "باب مخارج الحروف",
            verseNumber = 9,
            hemistichOne = "مَخَارِجُ الحُرُوفِ سَبْعَةَ عَشَرْ",
            hemistichTwo = "عَلَى الَّذِي يَخْتَارُهُ مَنِ اخْتَبَرْ",
            explanation = "تقرير العدد المختار لمخارج الحروف الخاصة وهو سبعة عشر مخرجاً عند أئمة الأداء والتحقيق.",
            sourceCitation = "المقدمة الجزرية لابن الجزري — البيت ٩"
        ),
        ClassicalMatnVerse(
            id = "jazariyyah_20",
            matnName = "المقدمة الجزرية",
            author = "الإمام ابن الجزري",
            chapterTitle = "باب صفات الحروف",
            verseNumber = 20,
            hemistichOne = "صِفَاتُهَا جَهْرٌ وَرِخْوٌ مُسْتَفِلْ",
            hemistichTwo = "مُنْفَتِحٌ مُصْمَتَةٌ وَالضِّدَّ قُلْ",
            explanation = "حصر الصفات اللازمة للحروف في قسمين: صفات لها ضد وصفات لا ضد لها، وبها تتميز الحروف المشتركة في المخرج.",
            sourceCitation = "المقدمة الجزرية لابن الجزري — البيت ٢٠"
        ),
        ClassicalMatnVerse(
            id = "jazariyyah_27",
            matnName = "المقدمة الجزرية",
            author = "الإمام ابن الجزري",
            chapterTitle = "باب التجويد",
            verseNumber = 27,
            hemistichOne = "وَالأَخْذُ بِالتَّجْوِيدِ حَتْمٌ لَازِمُ",
            hemistichTwo = "مَنْ لَمْ يُجَوِّدِ القُرَآنَ آثِمُ",
            explanation = "بيان أهمية التزام القراءة الصحيحة الموافقة لما نُقل بالتواتر وصون القرآن عن اللحن الجلي المخل بالمعنى أو الإعراب.",
            sourceCitation = "المقدمة الجزرية لابن الجزري — البيت ٢٧"
        )
    )

    val sourceChunksForRag: List<SourceChunk> = listOf(
        SourceChunk(
            chunkId = "chunk_tajweed_idgham",
            bookTitle = "تحفة الأطفال وشرح المقدمة الجزرية",
            author = "الجمزوري وابن الجزري",
            reference = "باب أحكام النون الساكنة والتنوين",
            topicKeywords = listOf("إدغام", "غنة", "بغنة", "بغير غنة", "يرملون", "ينمو", "نون ساكنة", "تنوين"),
            content = "الإدغام هو إدخال حرف ساكن في حرف متحرك بحيث يصيران حرفاً واحداً مشدداً. وحروفه ستة مجموعة في (يرملون)، وينقسم إلى قسمين: الأول إدغام بغنة في أربعة أحرف مجموعة في لفظ (ينمو: الياء والنون والميم والواو) بشرط أن يكون من كلمتين، فإن وقع في كلمة واحدة وجب الإظهار المطلق في أربع كلمات في القرآن (دنيا، بنيان، قنوان، صنوان). والقسم الثاني إدغام بغير غنة في حرفي (اللام والراء) كمالاً للتخفيف.",
            relatedAyahRefs = listOf("2:255", "1:7")
        ),
        SourceChunk(
            chunkId = "chunk_tajweed_makharij",
            bookTitle = "المقدمة الجزرية",
            author = "الإمام محمد بن الجزري",
            reference = "باب مخارج الحروف (الأبيات ٩ - ١٩)",
            topicKeywords = listOf("مخارج", "مخرج", "حروف", "سبعة عشر", "جوف", "حلق", "لسان", "شفتان", "خيشوم", "صفات", "قلقلة"),
            content = "مخارج الحروف سبعة عشر مخرجاً خاصاً موزعة على خمسة مخارج عامة: الجوف لحروف المد الثلاثة، والحلق بثلاثة مخارج لستة أحرف (الهمز والهاء، العين والحاء، الغين والخاء)، واللسان بعشرة مخارج لثمانية عشر حرفاً، والشفتان بمخرجين لأربعة أحرف (الفاء، والباء والميم والواو غير المدية)، والخيشوم لمخرج الغنة. وحروف القلقلة خمسة مجموعة في (قطب جد).",
            relatedAyahRefs = listOf("73:4", "112:1")
        ),
        SourceChunk(
            chunkId = "chunk_tafsir_kursi",
            bookTitle = "تفسير القرآن العظيم وأسباب النزول",
            author = "الإمام ابن كثير والواحدي",
            reference = "سورة البقرة الآية ٢٥٥ (آية الكرسي)",
            topicKeywords = listOf("آية الكرسي", "الكرسي", "البقرة", "255", "الحي", "القيوم", "سنة", "نوم", "سبب نزول", "فضل"),
            content = "آية الكرسي هي الآية ٢٥٥ من سورة البقرة المدنية، وهي أعظم آية في كتاب الله كما ثبت في صحيح مسلم من حديث أبي بن كعب رضي الله عنه. اشتملت على توحيد الألوهية والأسماء والصفات، فـ (الحي) الكامل الحياة، و(القيوم) القائم بنفسه المقيم لغيره من المخلوقات، و(السِّنة) فتور ونعاس يتقدم النوم فنفاهما الله عن نفسه لكمال قيوميته وحفظه للسماوات والأرض.",
            relatedAyahRefs = listOf("2:255")
        ),
        SourceChunk(
            chunkId = "chunk_tafsir_fatihah",
            bookTitle = "جامع البيان للطبري وتيسير الكريم الرحمن للسعدي",
            author = "الإمام الطبري والشيخ السعدي",
            reference = "تفسير سورة الفاتحة (١ - ٧)",
            topicKeywords = listOf("الفاتحة", "الحمد", "الصراط", "إياك نعبد", "مالك يوم الدين", "المغضوب", "الضالين", "قراءات", "التفات"),
            content = "سورة الفاتحة مكية وآياتها سبع باتفاق، وتسمى أم القرآن والسبع المثاني. جمعت بين الثناء على الله بأسمائه الحسنى (الله، الرب، الرحمن، الرحيم، مالك يوم الدين) وبين إفراده بالعبادة والاستعانة في (إياك نعبد وإياك نستعين) بتقديم المعمول لإفادة الحصر، وفيها التفات بلاغي من الغيبة إلى الخطاب، ثم طلب الهداية للصراط المستقيم طريق المنعم عليهم بالعلم والعمل.",
            relatedAyahRefs = listOf("1:1", "1:2", "1:4", "1:5", "1:6", "1:7")
        ),
        SourceChunk(
            chunkId = "chunk_ulum_makki_nasikh",
            bookTitle = "الإتقان في علوم القرآن ومباحث في علوم القرآن",
            author = "الإمام جلال الدين السيوطي ومنّاع القطان",
            reference = "النوع الأول (المكي والمدني) والنوع السابع والأربعون (الناسخ والمنسوخ)",
            topicKeywords = listOf("مكي", "مدني", "ناسخ", "منسوخ", "نسخ", "محكم", "متشابه", "قصص", "علوم القرآن", "السيوطي"),
            content = "الضابط الصحيح للمكي والمدني عند المحققين هو الزمان: فالمكي ما نزل قبل الهجرة وإن كان بغير مكة، والمدني ما نزل بعد الهجرة. أما النسخ فهو رفع الشارع حكماً شرعياً عملياً بدليل شرعي متأخر تيسيراً وتدرجاً في التشريع، ولا يدخل النسخ في العقائد ولا في الأخبار.",
            relatedAyahRefs = listOf("73:4")
        ),
        SourceChunk(
            chunkId = "chunk_ikhlas_wahidi",
            bookTitle = "أسباب النزول ومفردات غريب القرآن",
            author = "الواحدي والراغب الأصفهاني",
            reference = "سورة الإخلاص (١١٢)",
            topicKeywords = listOf("الإخلاص", "الصمد", "أحد", "سبب نزول الإخلاص", "غريب"),
            content = "نزلت سورة الإخلاص جواباً لمن سأل عن صفة الرب سبحانه، فبيّنت أنه (أحد) متفرد بالكمال لا شبيه له، و(الصمد) هو السيد المقصود في جميع الحوائج الغني عن كل ما سواه.",
            relatedAyahRefs = listOf("112:1", "112:2")
        )
    )

    val dailyBenefitsFromItqan: List<Pair<String, String>> = listOf(
        "قال الإمام السيوطي: شرف العلم بشرف معلومه، ولا أشرف من كلام الله تعالى، فكان الاشتغال بعلومه وتدبره أجمع للخير في الدارين." to "الإتقان في علوم القرآن للسيوطي — خطبة الكتاب",
        "قاعدة في التفسير: إذا جُمع بين الاسمين الكريمين (الرحمن الرحيم) دلّ الرحمن على سعة الرحمة في ذاتها، والرحيم على إيصالها للمؤمنين." to "تيسير الكريم الرحمن للسعدي — مقدمة القواعد",
        "ضابط في التجويد: ليس بين التجويد وتركه إلا رياضة امرئ بفكه؛ وذلك بالتلقي المتقن والممارسة الهادئة لمخارج الحروف." to "المقدمة الجزرية لابن الجزري — باب التجويد"
    )
}
