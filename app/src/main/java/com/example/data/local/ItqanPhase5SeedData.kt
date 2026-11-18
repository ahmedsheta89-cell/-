package com.example.data.local

import com.example.domain.model.QiraatImamIsnadNode
import com.example.domain.model.SurahMunasabahAndAnchor
import com.example.domain.model.UthmaniOrthographyRule
import com.example.domain.usecase.ArabicTextNormalizer

object ItqanPhase5SeedData {

    /**
     * Phase 5: Additional Complete Offline Surahs (Surah Ash-Sharh 94 [8 Ayahs] & Surah Al-Kawthar 108 [3 Ayahs])
     * with full 4 Tafsirs, Gharib, Asbab Al-Nuzul, I'rab, and Tajweed.
     */
    fun buildPhase5OfflineAyahs(): List<AyahEntity> = listOf(
        // سورة الشرح كاملة (94: 1..8)
        AyahEntity(
            compositeKey = "94:1",
            surahNumber = 94,
            surahNameAr = "الشرح",
            revelationType = "مكية",
            ayahNumber = 1,
            pageNumber = 596,
            juzNumber = 30,
            hizbNumber = 60,
            uthmaniText = "أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ",
            plainSearchText = ArabicTextNormalizer.normalizeForSearch("الم نشرح لك صدرك"),
            tafsirMuyassar = "ألم نوسع لك -أيها النبي- صدرك لشرائع الدين والدعوة إلى الله، واتصافه بمكارم الأخلاق؟",
            tafsirSaadi = "امتنّ الله على رسوله ﷺ بتوسيع صدره وتنويره بالإيمان والحكمة والقرآن فصار فسيحاً مطمئناً.",
            tafsirIbnKathir = "نورنا صدرك وجعلناه فسيحاً رحباً سمحاً، كما قال تعالى: (فمن يرد الله أن يهديه يشرح صدره للإسلام).",
            tafsirTabari = "ألم نفتح لك قلبك للهدى والإيمان ونلينه لتلقي الوحي؟",
            gharibKalimat = "الشرح: بسط الشيء وتوسعته، وشرح الصدر بسطه بنور إلهي وسكينة (مفردات الراغب).",
            asbabNuzul = "نزلت بمكة عقب سورة الضحى تثبيتاً لقلب النبي ﷺ وتذكيراً بآلاء الله عليه (الواحدي).",
            irabAndBalaghah = "استفهام تقريري (ألم نشرح) معناه الإثبات والتذكير بالنعمة، وجزم المضارع بـ (لم) مع قلب معناه للماضي.",
            tajweedAndQiraat = "إظهار الميم الساكنة في (أَلَمْ نَشْرَحْ)، وتفشي الشين وهمس الحاء الساكنة في (نَشْرَحْ)، وقلقلة الدال في (صَدْرَكَ)."
        ),
        AyahEntity(
            compositeKey = "94:2",
            surahNumber = 94,
            surahNameAr = "الشرح",
            revelationType = "مكية",
            ayahNumber = 2,
            pageNumber = 596,
            juzNumber = 30,
            hizbNumber = 60,
            uthmaniText = "وَوَضَعْنَا عَنكَ وِزْرَكَ",
            plainSearchText = ArabicTextNormalizer.normalizeForSearch("ووضعنا عنك وزرك"),
            tafsirMuyassar = "وحططنا عنك عبء الرسالة الثقيل وما سلف، وعصمناك وحفظناك؟",
            tafsirSaadi = "أي غفرنا لك ما تقدم من ذنبك وما تأخر، وخففنا عنك أعباء النبوة الثقيلة.",
            tafsirIbnKathir = "هذه الآية بمعنى قوله تعالى في سورة الفتح: (ليغفر لك الله ما تقدم من ذنبك وما تأخر).",
            tafsirTabari = "حططنا عنك ثقل أعباء الرسالة وهموم دعوة قومك.",
            gharibKalimat = "الوزر: الثقل والحمل الثقيل، وأصله الجبل الذي يُلتجأ إليه (مفردات الراغب).",
            asbabNuzul = "تتمة تعداد النعم الجليلة على النبي ﷺ.",
            irabAndBalaghah = "عطف على (نشرح) داخل في حيز التقرير بالامتنان؛ وفي (وضعنا) استعارة لطيفة لحط الثقل المعنوي.",
            tajweedAndQiraat = "إخفاء النون الساكنة عند الكاف في (عَنكَ) بغنة مرققة، وترقيق الراء في (وِزْرَكَ) وقفاً لو سُكنت بعد كسر أو تفخيمها وصلاً لأنها مفتوحة."
        ),
        AyahEntity(
            compositeKey = "94:3",
            surahNumber = 94,
            surahNameAr = "الشرح",
            revelationType = "مكية",
            ayahNumber = 3,
            pageNumber = 596,
            juzNumber = 30,
            hizbNumber = 60,
            uthmaniText = "ٱلَّذِىٓ أَنقَضَ ظَهْرَكَ",
            plainSearchText = ArabicTextNormalizer.normalizeForSearch("الذي انقض ظهرك"),
            tafsirMuyassar = "الذي أثقل ظهرك حمله وسمع له صوت من شدة ثقله؟",
            tafsirSaadi = "أي أتعبه وأثقله من شدة حرصك على هداية الخلق وقيامك بأعباء الرسالة.",
            tafsirIbnKathir = "الإنقاض: الصوت، يقال أنقض الحمل ظهر البعير إذا سُمع له أطيط من شدة الثقل.",
            tafsirTabari = "أثقل ظهرك حتى سُمع له نقيض، وهو تصوير لشدة ما كان يعانيه ﷺ في تبليغ الوحي.",
            gharibKalimat = "أنقض: أثقل الحملُ الظهرَ حتى سُمع له نقيض أي صوت خفي (مفردات الراغب).",
            asbabNuzul = "متصلة بالآية قبلها في بيان عظم أعباء الدعوة التي أعانه الله عليها.",
            irabAndBalaghah = "(الذي) اسم موصول في محل نصب نعت لـ (وزرك)؛ وفيه كناية بليغة عن غاية المشقة.",
            tajweedAndQiraat = "مد جائز منفصل في (ٱلَّذِىٓ أَنقَضَ)، وإخفاء النون الساكنة عند القاف بغنة مفخمة لمجاورة حرف الاستعلاء (ق)."
        ),
        AyahEntity(
            compositeKey = "94:4",
            surahNumber = 94,
            surahNameAr = "الشرح",
            revelationType = "مكية",
            ayahNumber = 4,
            pageNumber = 596,
            juzNumber = 30,
            hizbNumber = 60,
            uthmaniText = "وَرَفَعْنَا لَكَ ذِكْرَكَ",
            plainSearchText = ArabicTextNormalizer.normalizeForSearch("ورفعنا لك ذكرك"),
            tafsirMuyassar = "وجعلنا لك ذكراً رفيعاً في الدنيا والآخرة، فلا يُذكر الله في الشهادتين والأذان إلا ذُكرتَ معه؟",
            tafsirSaadi = "أعلينا قدرك وجعلنا لك الثناء الحسن العالي الذي لم يبلغه أحد من الخلق.",
            tafsirIbnKathir = "روى قتادة عن حسان بن ثابت: ضم الإله اسم النبي إلى اسمه ... إذ قال في الخمس المؤذن أشهد.",
            tafsirTabari = "لا أُذكر يا محمد إلا ذُكرتَ معي في الأذان والإقامة والتشهد والخطب.",
            gharibKalimat = "الذكر: الصيت الحسن والشرف الرفيع الباقي على مر الدهور (مفردات الراغب).",
            asbabNuzul = "بشارة للنبي ﷺ بعلو ذكره رغم محاولات المشركين طمس دعوته.",
            irabAndBalaghah = "تقديم الجار والمجرور (لك) على المفعول به (ذكرك) للاهتمام والتشريف والاختصاص.",
            tajweedAndQiraat = "همس الكاف الساكنة في (ذِكْرَكَ) دون قلقلة، وتفخيم الراء لأنها مفتوحة."
        ),
        AyahEntity(
            compositeKey = "94:5",
            surahNumber = 94,
            surahNameAr = "الشرح",
            revelationType = "مكية",
            ayahNumber = 5,
            pageNumber = 596,
            juzNumber = 30,
            hizbNumber = 60,
            uthmaniText = "فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا",
            plainSearchText = ArabicTextNormalizer.normalizeForSearch("فان مع العسر يسرا"),
            tafsirMuyassar = "فلا يثنك أذى أعدائك؛ فإن مع الضيق والشدة سعةً وفرجاً قريباً.",
            tafsirSaadi = "بشارة عظيمة أنه كلما وجد عسر وصعوبة، فإن اليسر يقارنه ويصاحبه.",
            tafsirIbnKathir = "جاءت (مع) للدلالة على المصاحبة والمقارنة، فالفرج مقارن للشدة لا يتأخر عنها.",
            tafsirTabari = "فإن مع الضيق الذي أنت فيه من أذى المشركين رخاءً وظفراً.",
            gharibKalimat = "العسر: الضيق والشدة؛ واليسر: السهولة والسعة والفرج (مفردات الراغب).",
            asbabNuzul = "نزلت تسلية للنبي ﷺ وأصحابه لما عيّرهم المشركون بالفقر والشدة (الواحدي).",
            irabAndBalaghah = "تعريف (العسر) بأل العهدية وتنكير (يسراً) للتعظيم والتفخيم.",
            tajweedAndQiraat = "غنة النون المشددة في (فَإِنَّ) بمقدار حركتين، وإظهار لام التعريف القمرية في (ٱلْعُسْرِ)."
        ),
        AyahEntity(
            compositeKey = "94:6",
            surahNumber = 94,
            surahNameAr = "الشرح",
            revelationType = "مكية",
            ayahNumber = 6,
            pageNumber = 596,
            juzNumber = 30,
            hizbNumber = 60,
            uthmaniText = "إِنَّ مَعَ ٱلْعُسْرِ يُسْرًا",
            plainSearchText = ArabicTextNormalizer.normalizeForSearch("ان مع العسر يسرا"),
            tafsirMuyassar = "تأكيد للوعد الإلهي الصادق بأن العسر الواحد يحف به يسران: يسر في الدنيا ويسر في الآخرة.",
            tafsirSaadi = "قال النبي ﷺ: «لن يغلب عسر يسرين» لأن العسر معرّف فهو واحد، واليسر منكّر فتعدد.",
            tafsirIbnKathir = "قاعدة عربية بلاغية: إذا أعيدت المعرفة كانت عين الأولى، وإذا أعيدت النكرة كانت غير الأولى.",
            tafsirTabari = "تأكيد للبشارة وتثبيت لليقين في قلوب المؤمنين.",
            gharibKalimat = "تكرير الجملة لتقرير سنة الله في تفريج الكروب.",
            asbabNuzul = "خرج النبي ﷺ مسروراً يضحك وهو يقول: «لن يغلب عسر يسرين، إن مع العسر يسراً إن مع العسر يسراً».",
            irabAndBalaghah = "إطناب بالتكرار لتأكيد الوعد، وتنكير (يسراً) الثانية أفاد أنه يسر ثانٍ مغاير للأول.",
            tajweedAndQiraat = "مد عوض بمقدار حركتين عند الوقف على التنوين المنصوب في (يُسْرًا)."
        ),
        AyahEntity(
            compositeKey = "94:7",
            surahNumber = 94,
            surahNameAr = "الشرح",
            revelationType = "مكية",
            ayahNumber = 7,
            pageNumber = 596,
            juzNumber = 30,
            hizbNumber = 60,
            uthmaniText = "فَإِذَا فَرَغْتَ فَٱنصَبْ",
            plainSearchText = ArabicTextNormalizer.normalizeForSearch("فاذا فرغت فانصب"),
            tafsirMuyassar = "فإذا فرغت من أشغال الدنيا وتبليغ الرسالة، فاجتهد في العبادة والدعاء.",
            tafsirSaadi = "لا تخلي وقتك من عمل صالح؛ فإذا فرغت من عبادة أو شغل فأعقبها بعبادة أخرى.",
            tafsirIbnKathir = "قال ابن عباس وقتادة: إذا فرغت من صلاتك المكتوبة فانصب في الدعاء والمسألة.",
            tafsirTabari = "اجعل فراغك موصولاً بالنصب في طاعة الله عز وجل.",
            gharibKalimat = "النَّصَب: التعب والاجتهاد في العمل الجاد (مفردات الراغب).",
            asbabNuzul = "توجيه ختامي لشكر النعم بالاجتهاد في الطاعة.",
            irabAndBalaghah = "طباق بديع بين (فرغت) و(انصب) يجمع بين الراحة من شاغل والجد في طاعة.",
            tajweedAndQiraat = "إظهار الغين الساكنة المفخمة في (فَرَغْتَ)، وإخفاء النون عند الصاد بغنة مفخمة، وقلقلة الباء قلقلة كبرى وقفاً في (فَٱنصَبْ)."
        ),
        AyahEntity(
            compositeKey = "94:8",
            surahNumber = 94,
            surahNameAr = "الشرح",
            revelationType = "مكية",
            ayahNumber = 8,
            pageNumber = 596,
            juzNumber = 30,
            hizbNumber = 60,
            uthmaniText = "وَإِلَىٰ رَبِّكَ فَٱرْغَب",
            plainSearchText = ArabicTextNormalizer.normalizeForSearch("والى ربك فارغب"),
            tafsirMuyassar = "وإلى ربك وحده فاجعل رغبتك وتضرعك وتوكلك في جميع حاجاتك.",
            tafsirSaadi = "عظّم الرغبة في إجابة دعائك وقبول عملك من ربك وحده دون سواه.",
            tafsirIbnKathir = "اجعل نيتك ورغبتك إلى الله عز وجل وحده.",
            tafsirTabari = "ارغب إلى ربك في كل ما تطلب وترجو.",
            gharibKalimat = "الرغبة: سعة الإرادة والحرص على نيل الفضل؛ فإذا عديت بـ (إلى) أفادت الإقبال والالتجاء (الراغب).",
            asbabNuzul = "ختام السورة بإخلاص التوجه إلى الله.",
            irabAndBalaghah = "تقديم الجار والمجرور (وإلى ربك) على الفعل (فارغب) يفيد الحصر والاختصاص، أي ارغب إليه لا إلى غيره.",
            tajweedAndQiraat = "تفخيم الراء الساكنة بعد همزة الوصل في (فَٱرْغَب)، وقلقلة الباء الساكنة قلقلة كبرى عند الوقف."
        ),

        // سورة الكوثر كاملة (108: 1..3)
        AyahEntity(
            compositeKey = "108:1",
            surahNumber = 108,
            surahNameAr = "الكوثر",
            revelationType = "مكية",
            ayahNumber = 1,
            pageNumber = 602,
            juzNumber = 30,
            hizbNumber = 60,
            uthmaniText = "إِنَّآ أَعْطَيْنَٰكَ ٱلْكَوْثَرَ",
            plainSearchText = ArabicTextNormalizer.normalizeForSearch("انا اعطيناك الكوثر"),
            tafsirMuyassar = "إنا أعطيناك -أيها النبي- الخير الكثير الدائم في الدنيا والآخرة، ومنه نهر الكوثر في الجنة.",
            tafsirSaadi = "امتنّ الله على رسوله ﷺ بالخير الكثير وأعظمه نهر الكوثر الذي ماؤه أشد بياضاً من اللبن وأحلى من العسل.",
            tafsirIbnKathir = "ثبت في الصحيحين أن الكوثر نهر في الجنة حافتاه قباب اللؤلؤ المجوف، ويدخل فيه الخير الكثير كالنبوة والقرآن.",
            tafsirTabari = "الكوثر: فَوْعل من الكثرة، وهو النهر الذي أعطاه الله نبيه ﷺ في الجنة والخير العميم.",
            gharibKalimat = "الكوثر: الخير المفرط في الكثرة، واسم النهر الموعود في الجنة (مفردات الراغب).",
            asbabNuzul = "أغفى النبي ﷺ إغفاءة ثم رفع رأسه متبسماً وقال: «أُنزلت عليّ آنفاً سورة» فقرأ سورة الكوثر (رواه مسلم والواحدي).",
            irabAndBalaghah = "صيغة الفعل الماضي (أعطيناك) بدلاً من المضارع لتحقق وقوع الوعد كأنه قد تم وحصل، وضمير العظمة (إنا) لتفخيم العطية.",
            tajweedAndQiraat = "غنة النون المشددة حركتين، ومد جائز منفصل في (إِنَّآ أَعْطَيْنَٰكَ)، وتفخيم الراء وقفاً في (ٱلْكَوْثَرَ)."
        ),
        AyahEntity(
            compositeKey = "108:2",
            surahNumber = 108,
            surahNameAr = "الكوثر",
            revelationType = "مكية",
            ayahNumber = 2,
            pageNumber = 602,
            juzNumber = 30,
            hizbNumber = 60,
            uthmaniText = "فَصَلِّ لِرَبِّكَ وَٱنْحَرْ",
            plainSearchText = ArabicTextNormalizer.normalizeForSearch("فصل لربك وانحر"),
            tafsirMuyassar = "فأخلص لربك صلاتك كلها، واذبح ذبيحتك له وحده وعلى اسمه شكراً على هذا العطاء.",
            tafsirSaadi = "خصّ هاتين العبادتين (الصلاة والنحر) لأنهما من أفضل القربات؛ فالصلاة عبادة بدنية قلبية، والنحر عبادة مالية.",
            tafsirIbnKathir = "كما أعطيناك الخير الكثير في الدنيا والآخرة فأخلص لربك صلاتك ونحرك خلافاً للمشركين.",
            tafsirTabari = "اجعل صلاتك كلها لربك خالصة، ونحرك له دون الأوثان.",
            gharibKalimat = "النحر: موضع القلادة من الصدر، ونحر البُدن ذبحها في ذلك الموضع تقرباً لله (الراغب).",
            asbabNuzul = "بيان طريق شكر النعمة بإخلاص العبادة البدنية والمالية لله.",
            irabAndBalaghah = "الفاء في (فصلِّ) فاء الفصيحة أو السببية المترتبة على نعمة الكوثر؛ وفيه التفات من ضمير المتكلم (إنا) إلى الاسم الظاهر (لربك) لتعليل الأمر بالعبادة.",
            tajweedAndQiraat = "ترقيق اللام المشددة في (فَصَلِّ) مع الحذر من تفخيمها لمجاورة الصاد، وإظهار النون الساكنة عند الحاء في (وَٱنْحَرْ)، وتفخيم الراء الساكنة وقفاً."
        ),
        AyahEntity(
            compositeKey = "108:3",
            surahNumber = 108,
            surahNameAr = "الكوثر",
            revelationType = "مكية",
            ayahNumber = 3,
            pageNumber = 602,
            juzNumber = 30,
            hizbNumber = 60,
            uthmaniText = "إِنَّ شَانِئَكَ هُوَ ٱلْأَبْتَرُ",
            plainSearchText = ArabicTextNormalizer.normalizeForSearch("ان شانئك هو الابتر"),
            tafsirMuyassar = "إن مبغضك ومبغض ما جئت به من الهدى والنور، هو المقطوع أثره، المقطوع من كل خير.",
            tafsirSaadi = "أما أنت يا محمد فسيبقى ذكرك وأتباعك وأجرك إلى يوم القيامة، ومبغضك هو المقطوع الذكر والخير.",
            tafsirIbnKathir = "نزلت في العاص بن وائل السهمي وأمثاله ممن قالوا عن النبي ﷺ عند وفاة ابنه القاسم إنه أبتر لا عقب له.",
            tafsirTabari = "إن مبغضك وعدوك يا محمد هو الأذل الأقل المنقطع دابره.",
            gharibKalimat = "الشانئ: المبغض المعادي؛ الأبتر: المقطوع من الخير والذكر والعقب (مفردات الراغب).",
            asbabNuzul = "لما مات القاسم ابن رسول الله ﷺ بمكة قال العاص بن وائل: قد انقطع نسله فهو أبتر، فأنزل الله السورة (الواحدي).",
            irabAndBalaghah = "ضمير الفصل (هو) بين اسم إنّ وخبرها يفيد القصر والحصر وتوكيد انقطاع الشانئ وحده.",
            tajweedAndQiraat = "غنة النون المشددة في (إِنَّ)، وهمس التاء وقلقلة الباء الساكنة في (ٱلْأَبْتَرُ) مع تفخيم الراء وقفاً."
        )
    )

    /**
     * Phase 5: Uthmani Orthography (الرسم العثماني), Diacritical Dabt (علم الضبط), and Verse Counting (علم الفواصل وعدّ الآي).
     */
    val uthmaniOrthographyAndFawasilCatalog: List<UthmaniOrthographyRule> = listOf(
        UthmaniOrthographyRule(
            id = "rasm_rule_1_hadhf",
            categoryAr = "القواعد الست للرسم العثماني",
            ruleTitleAr = "القاعدة الأولى: باب الحذف (حذف الألف والواو والياء واللام)",
            uthmaniWordExample = "﴿ٱلْعَٰلَمِينَ﴾ • ﴿ٱلرَّحْمَٰنِ﴾ • ﴿مَٰلِكِ﴾",
            standardImlaiComparison = "في الرسم الإملائي: (العالمين، الرحمن، مالك) بإثبات الألف الصريحة.",
            surahAndAyahRefAr = "الفاتحة (١ - ٤) وسائر سور المصحف",
            scholarlySecretAndRuleAr = "حُذفت الألف خطاً وعُوِّض عنها بالألف الخنجرية ضبطاً لتحتمل الكلمة القراءات المتواترة في نحو ﴿مَٰلِكِ / مَلِكِ﴾، وتنبيهاً على أن التلقي في القرآن أصله المشافهة لا مجرد الاعتماد على الهجاء الخطي.",
            qiraatConnectionAr = "رسم ﴿مَٰلِكِ﴾ بحذف الألف يحتمل قراءة عاصم والكسائي ويعقوب وخلف بالألف، وقراءة الجمهور بغير ألف.",
            sourceCitation = "المقنع في رسم مصاحف الأمصار لأبي عمرو الداني • الإتقان للسيوطي"
        ),
        UthmaniOrthographyRule(
            id = "rasm_rule_2_ziyadah",
            categoryAr = "القواعد الست للرسم العثماني",
            ruleTitleAr = "القاعدة الثانية: باب الزيادة (زيادة الألف والواو والياء)",
            uthmaniWordExample = "﴿بِأَيْيدٍ﴾ • ﴿أُوْلَٰٓئِكَ﴾ • ﴿لَئِنْ﴾",
            standardImlaiComparison = "في الرسم الإملائي: (بأيدٍ) بياء واحدة.",
            surahAndAyahRefAr = "الذاريات (٤٧) • البقرة (٥)",
            scholarlySecretAndRuleAr = "تُزاد بعض الحروف في الرسم العثماني ولا يُنطق بها في التلاوة (وعلامتها في الضبط وضع الصفر المستدير ۝ فوق الحرف الزائد) تعظيماً للمعنى كزيادة الياء في ﴿بِأَيْيدٍ﴾ إشارةً لعظم القدرة الإلهية في بناء السماء.",
            qiraatConnectionAr = "أجمع القراء العشرة على عدم النطق بالحرف الموضوع عليه الصفر المستدير وصلاً ووقفاً.",
            sourceCitation = "المقنع لأبي عمرو الداني • لطائف الإشارات للقسطلاني"
        ),
        UthmaniOrthographyRule(
            id = "rasm_rule_3_badal",
            categoryAr = "القواعد الست للرسم العثماني",
            ruleTitleAr = "القاعدة الثالثة: باب البدل (رسم الألف واواً أو ياءً، والتاء المفتوحة)",
            uthmaniWordExample = "﴿ٱلصَّلَوٰةَ﴾ • ﴿ٱلزَّكَوٰةَ﴾ • ﴿رَحْمَتَ ٱللَّهِ﴾",
            standardImlaiComparison = "في الرسم الإملائي: (الصلاة، الزكاة، رحمة).",
            surahAndAyahRefAr = "البقرة (٣، ٢١٨) • مريم (٢)",
            scholarlySecretAndRuleAr = "رُسمت الألف واواً في ﴿ٱلصَّلَوٰةَ﴾ و﴿ٱلزَّكَوٰةَ﴾ و﴿ٱلْحَيَوٰةِ﴾ إشارةً إلى أصلها اللغوي وتفخيم الألف عند ورش، ورُسمت تاء (رحمت) مفتوحة في سبعة مواضع لموافقة من يقف عليها بالتاء من القراء العشرة.",
            qiraatConnectionAr = "يقف ابن كثير وأبو عمرو والكسائي ويعقوب بالتاء المفتوحة على ما رُسم بالتاء المفتوحة مثل ﴿رَحْمَتَ﴾، ويقف حفص بالهاء.",
            sourceCitation = "المقدمة الجزرية لابن الجزري (باب التاءات) • النشر في القراءات العشر"
        ),
        UthmaniOrthographyRule(
            id = "dabt_rule_tanween_sukoon",
            categoryAr = "علم الضبط وعلامات المصحف",
            ruleTitleAr = "دلالة تراكب الحركات وتتابعها ورأس الخاء في ضبط التجويد",
            uthmaniWordExample = "﴿كُفُوًا أَحَدٌ﴾ (متراكب = إظهار) • ﴿مِن شَرِّ﴾ (تعرية النون = إخفاء)",
            standardImlaiComparison = "في الخط المعتاد يُكتب التنوين والسكون بصورة واحدة دون تفريق تجويدي.",
            surahAndAyahRefAr = "الإخلاص (٤) • الفلق (١-٥)",
            scholarlySecretAndRuleAr = "ابتكر علماء الضبط (الخليل بن أحمد والداني والتنسي) نظاماً بصرياً عبقرياً: فوضع رأس الخاء الصغيرة (حـ) يدل على الإظهار، وتعرية الحرف الساكن من السكون يدل على الإخفاء أو الإدغام، وتركيب الفتحتين/الضمتين فوق بعضهما يدل على الإظهار الحلقي.",
            qiraatConnectionAr = "علامات الضبط تتبع الرواية المطبوع بها المصحف؛ ففي مصحف حفص تُعرّى النون عند الإخفاء وتوضع الميم الصغيرة عند الإقلاب.",
            sourceCitation = "الطراز في شرح ضبط الخراز للتنسي • تعريف المصحف المدني"
        ),
        UthmaniOrthographyRule(
            id = "fawasil_rule_kufi_madani",
            categoryAr = "علم الفواصل وعدّ الآي",
            ruleTitleAr = "المدارس الست في عدّ الآي (المدني الأول والأخير، المكي، الشامي، البصري، الكوفي)",
            uthmaniWordExample = "﴿بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ۝١﴾ • ﴿صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ﴾",
            standardImlaiComparison = "مجموع آيات القرآن في العدّ الكوفي (المعتمد لحفص): ٦٢٣٦ آية.",
            surahAndAyahRefAr = "سورة الفاتحة (٧ آيات باتفاق العادّين)",
            scholarlySecretAndRuleAr = "اتفق علماء الأمصار على أن سورة الفاتحة ٧ آيات، لكن عدّ الكوفيون والمكيون البسملةَ الآيةَ الأولى ولم يعدّوا ﴿أَنْعَمْتَ عَلَيْهِمْ﴾ رأس آية، بينما لم يعدّ المدنيون والشاميون والبصريون البسملة آيةً وعدّوا ﴿أَنْعَمْتَ عَلَيْهِمْ﴾ الآية السادسة.",
            qiraatConnectionAr = "العدّ الكوفي مروي بسند أبي عبد الرحمن السلمي عن علي بن أبي طالب رضي الله عنه وهو الموافق لرواية حفص عن عاصم.",
            sourceCitation = "البيان في عدّ آي القرآن لأبي عمرو الداني • ناظمة الزهر للشاطبي"
        )
    )

    /**
     * Phase 5: Science of Surah & Ayah Cohesion (علم المناسبات بين الآيات والسور) & Memorization Anchors.
     */
    val surahMunasabatAndAnchorsCatalog: List<SurahMunasabahAndAnchor> = listOf(
        SurahMunasabahAndAnchor(
            id = "munasabah_fatihah_baqarah",
            surahNumber = 1,
            surahNameAr = "الفاتحة والبقرة",
            openingAndClosingHarmonyAr = "افتتحت الفاتحة بالحمد لله رب العالمين (الربوبية والرحمة والملك) وختمت بطلب الهداية للصراط المستقيم؛ فكأن أولها ثناء ومقدمة، وآخرها دعاء وثمرة.",
            connectionWithPreviousSurahAr = "ختمت الفاتحة بالدعاء ﴿ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ﴾، فافتتحت سورة البقرة مباشرةً بإجابة هذا الدعاء: ﴿ذَٰلِكَ ٱلْكِتَٰبُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ﴾ أي: هذا الكتاب هو الهداية التي سألتموها!",
            hifzSequentialAnchors = listOf(
                "الآيات (١-٤): ثناء وتمجيد لله بأسمائه الحسنى (الله، الرب، الرحمن، الرحيم، المالك).",
                "الآية (٥): العهد الوسط الجامع بين حق الله (إياك نعبد) وحاجة العبد (وإياك نستعين).",
                "الآيات (٦-٧): دعاء الهداية وتفصيل أصناف الناس الثلاثة (المنعَم عليهم، المغضوب عليهم، الضالين)."
            ),
            sourceCitation = "نظم الدرر في تناسب الآيات والسور للبقاعي • تناسق الدرر للسيوطي"
        ),
        SurahMunasabahAndAnchor(
            id = "munasabah_duha_sharh",
            surahNumber = 94,
            surahNameAr = "الشرح (الانشراح)",
            openingAndClosingHarmonyAr = "افتتحت السورة بشرح الصدر وحط الوزر ورفع الذكر (نعم الله على نبيه ﷺ)، وختمت بواجب الشكر العملي والقلبي: ﴿فَإِذَا فَرَغْتَ فَٱنصَبْ ۝ وَإِلَىٰ رَبِّكَ فَٱرْغَب﴾.",
            connectionWithPreviousSurahAr = "في ختام سورة الضحى قال تعالى: ﴿وَأَمَّا بِنِعْمَةِ رَبِّكَ فَحَدِّثْ﴾، فجاءت سورة الشرح تفصيلاً لأعظم النعم القلبية والمعنوية بعد النعم الحسية المذكورة في الضحى (الإيواء والغنى والهدى).",
            hifzSequentialAnchors = listOf(
                "الآيات (١-٤): ثلاث نعم كبرى (شرح الصدر، وضع الوزر الذي أنقض الظهر، رفع الذكر).",
                "الآيتان (٥-٦): القاعدة الإيمانية المكررة (فإن مع العسر يسراً • إن مع العسر يسراً).",
                "الآيتان (٧-٨): وصيتان ختاميتان بالجوارح والقلب (فانصب • وإلى ربك فارغب)."
            ),
            sourceCitation = "تناسق الدرر في تناسب السور للسيوطي • التحرير والتنوير لابن عاشور"
        ),
        SurahMunasabahAndAnchor(
            id = "munasabah_asr_kawthar_ikhlas",
            surahNumber = 108,
            surahNameAr = "الكوثر والإخلاص والمعوذتان",
            openingAndClosingHarmonyAr = "افتتحت سورة الكوثر بـ ﴿إِنَّآ أَعْطَيْنَٰكَ ٱلْكَوْثَرَ﴾ (الكثرة والبقاء للنبي ﷺ)، وختمت بـ ﴿إِنَّ شَانِئَكَ هُوَ ٱلْأَبْتَرُ﴾ (القلة والانقطاع لمبغضه) في مقابلة بلاغية تامة.",
            connectionWithPreviousSurahAr = "في سورة الماعون ذَمَّ الله المنافق البخيل الذي (يسهو عن صلاته ويمنع الماعون)، فجاءت سورة الكوثر بضد تلك الصفات الأربع: أعطيناك الكوثر (بدل البخل)، فصلِّ لربك (بدل السهو عن الصلاة)، وانحر (بدل منع الماعون).",
            hifzSequentialAnchors = listOf(
                "الكوثر (١): العطية الإلهية العظمى (إنا أعطيناك الكوثر).",
                "الكوثر (٢): شكر النعمة بالعبادة البدنية والمالية (فصل لربك وانحر).",
                "الكوثر (٣): البشارة بكبت العدو وانقطاعه (إن شانئك هو الأبتر)."
            ),
            sourceCitation = "نظم الدرر للبقاعي • بدائع الفوائد لابن القيم"
        )
    )

    /**
     * Phase 5: Ten Canonical Qira'at Imams & 20 Narrators Lineage Tree (شجرة أسانيد القراء العشرة ورواتهم العشرين).
     */
    val tenReadersIsnadTree: List<QiraatImamIsnadNode> = listOf(
        QiraatImamIsnadNode(
            id = "imam_1_nafi",
            imamRankNumber = 1,
            imamNameAndCityAr = "١. الإمام نافع بن عبد الرحمن المدني (ت ١٦٩ هـ)",
            firstRawiAr = "قالون (عيسى بن مينا المدني)",
            secondRawiAr = "ورش (عثمان بن سعيد المصري)",
            sahabiSanadChainAr = "قرأ على سبعين من التابعين منهم أبو جعفر، عن عبد الله بن عياش وابن عباس وأبي هريرة، عن أُبيّ بن كعب وزيد بن ثابت، عن رسول الله ﷺ.",
            distinctMethodologySummaryAr = "إمام أهل المدينة؛ يتميز ورش بنقل حركة الهمز وتغليظ اللام وترقيق الراء ومد البدل، ويتميز قالون بتخيير صلة ميم الجمع وقصر وتوسط المنفصل.",
            sourceCitation = "النشر في القراءات العشر لابن الجزري • غاية النهاية في طبقات القراء"
        ),
        QiraatImamIsnadNode(
            id = "imam_2_ibn_kathir",
            imamRankNumber = 2,
            imamNameAndCityAr = "٢. الإمام عبد الله بن كثير المكي (ت ١٢٠ هـ)",
            firstRawiAr = "البزّي (أحمد بن محمد المكي)",
            secondRawiAr = "قُنبل (محمد بن عبد الرحمن المكي)",
            sahabiSanadChainAr = "قرأ على مجاهد بن جبر ودرباس، عن ابن عباس وعبد الله بن السائب، عن أُبيّ بن كعب وعمر بن الخطاب، عن رسول الله ﷺ.",
            distinctMethodologySummaryAr = "إمام أهل مكة من التابعين؛ يصل ميم الجمع وهاء الكناية مطلقاً إذا وقعت بعد ساكن، ويقصر المنفصل.",
            sourceCitation = "النشر في القراءات العشر لابن الجزري • التيسير للداني"
        ),
        QiraatImamIsnadNode(
            id = "imam_3_abu_amr",
            imamRankNumber = 3,
            imamNameAndCityAr = "٣. الإمام أبو عمرو بن العلاء البصري (ت ١٥٤ هـ)",
            firstRawiAr = "الدوري (حفص بن عمر)",
            secondRawiAr = "السوسي (صالح بن زياد)",
            sahabiSanadChainAr = "قرأ على الحسن البصري وأبي جعفر ومجاهد، عن ابن عباس وأبي بن كعب، عن رسول الله ﷺ.",
            distinctMethodologySummaryAr = "إمام أهل البصرة وأعلم الناس بالعربية؛ ينفرد السوسي بالإدغام الكبير، ويميل أبو عمرو ذوات الراء.",
            sourceCitation = "النشر في القراءات العشر لابن الجزري"
        ),
        QiraatImamIsnadNode(
            id = "imam_4_ibn_amir",
            imamRankNumber = 4,
            imamNameAndCityAr = "٤. الإمام عبد الله بن عامر الشامي (ت ١١٨ هـ)",
            firstRawiAr = "هشام بن عمار الدمشقي",
            secondRawiAr = "ابن ذكوان (عبد الله بن أحمد)",
            sahabiSanadChainAr = "قرأ على المغيرة بن أبي شهاب، عن عثمان بن عفان رضي الله عنه، وعلى الصحابي أبي الدرداء، عن رسول الله ﷺ.",
            distinctMethodologySummaryAr = "إمام أهل الشام وكبير التابعين؛ يتوسط المنفصل والمتصل وله اختيارات متواترة موافقة لمصحف الشام.",
            sourceCitation = "النشر في القراءات العشر لابن الجزري"
        ),
        QiraatImamIsnadNode(
            id = "imam_5_asim",
            imamRankNumber = 5,
            imamNameAndCityAr = "٥. الإمام عاصم بن أبي النَّجود الكوفي (ت ١٢٧ هـ)",
            firstRawiAr = "شُعبة (أبو بكر بن عياش)",
            secondRawiAr = "حفص بن سليمان الأسدي (الرواية الأشهر في العالم الإسلامي)",
            sahabiSanadChainAr = "قرأ على أبي عبد الرحمن السلمي وزرّ بن حبيش، عن عثمان بن عفان وعلي بن أبي طالب وعبد الله بن مسعود وأبيّ وزيد، عن رسول الله ﷺ.",
            distinctMethodologySummaryAr = "إمام الكوفة الجامع بين الفصاحة والإتقان؛ رواية حفص عنه هي أوسع الروايات انتشاراً بوضوح أصولها وتوسط مدودها.",
            sourceCitation = "النشر في القراءات العشر لابن الجزري • الشاطبية"
        ),
        QiraatImamIsnadNode(
            id = "imam_6_hamzah",
            imamRankNumber = 6,
            imamNameAndCityAr = "٦. الإمام حمزة بن حبيب الزيات الكوفي (ت ١٥٦ هـ)",
            firstRawiAr = "خلف بن هشام البزار",
            secondRawiAr = "خلّاد بن خالد الصيرفي",
            sahabiSanadChainAr = "قرأ على الأعمش وجعفر الصادق وحمران، عن أصحاب عبد الله بن مسعود وعلي بن أبي طالب، عن رسول الله ﷺ.",
            distinctMethodologySummaryAr = "يُشبع المدين المتصل والمنفصل ست حركات، وله السكت على الساكن قبل الهمز وتغيير الهمز عند الوقف.",
            sourceCitation = "النشر في القراءات العشر لابن الجزري"
        ),
        QiraatImamIsnadNode(
            id = "imam_7_kisai",
            imamRankNumber = 7,
            imamNameAndCityAr = "٧. الإمام علي بن حمزة الكسائي الكوفي (ت ١٨٩ هـ)",
            firstRawiAr = "أبو الحارث (الليث بن خالد)",
            secondRawiAr = "الدوري (حفص بن عمر)",
            sahabiSanadChainAr = "قرأ على حمزة الزيات ومحمد بن أبي ليلى، بالسند المتصل إلى علي وابن مسعود، عن رسول الله ﷺ.",
            distinctMethodologySummaryAr = "إمام النحاة والقراء؛ يميل ذوات الياء ويميل هاء التأنيث وما قبلها في الوقف بشروطها.",
            sourceCitation = "النشر في القراءات العشر لابن الجزري"
        ),
        QiraatImamIsnadNode(
            id = "imam_8_abu_jafar",
            imamRankNumber = 8,
            imamNameAndCityAr = "٨. الإمام أبو جعفر يزيد بن القعقاع المدني (ت ١٣٠ هـ)",
            firstRawiAr = "ابن وردان (عيسى بن وردان)",
            secondRawiAr = "ابن جمّاز (سليمان بن مسلم)",
            sahabiSanadChainAr = "قرأ على مولاه عبد الله بن عياش وابن عباس وأبي هريرة، عن أُبيّ بن كعب وزيد بن ثابت، عن رسول الله ﷺ.",
            distinctMethodologySummaryAr = "شيخ الإمام نافع بالمدينة؛ يصل ميم الجمع، ويقصر المنفصل، ويخفي النون الساكنة والتنوين عند الغين والخاء، ويبدل الهمز الساكن.",
            sourceCitation = "الدرة المضية في القراءات الثلاث لابن الجزري • النشر"
        ),
        QiraatImamIsnadNode(
            id = "imam_9_yaqub",
            imamRankNumber = 9,
            imamNameAndCityAr = "٩. الإمام يعقوب بن إسحاق الحضرمي البصري (ت ٢٠٥ هـ)",
            firstRawiAr = "رُوَيس (محمد بن المتوكل)",
            secondRawiAr = "رَوْح بن عبد المؤمن",
            sahabiSanadChainAr = "قرأ على سلّام الطويل وشهاب وأبي الأشهب، بالسند إلى أبي موسى الأشعري وابن عباس، عن رسول الله ﷺ.",
            distinctMethodologySummaryAr = "إمام جامع البصرة؛ يقف بهاء السكت على ياءات الإضافة والملحق بها، ويوافق البصريين في كثير من الأصول.",
            sourceCitation = "الدرة المضية لابن الجزري • النشر"
        ),
        QiraatImamIsnadNode(
            id = "imam_10_khalaf",
            imamRankNumber = 10,
            imamNameAndCityAr = "١٠. الإمام خلف بن هشام البزار (العاشر) (ت ٢٢٩ هـ)",
            firstRawiAr = "إسحاق الوراق",
            secondRawiAr = "إدريس الحداد",
            sahabiSanadChainAr = "قرأ على سليم بن عيسى عن حمزة، وعلى يعقوب بن خليفة الأعشى عن أبي بكر بن عياش، بالسند إلى الصحابة عن رسول الله ﷺ.",
            distinctMethodologySummaryAr = "له اختياره العاشر المستقل عن روايته عن حمزة؛ فيترك السكت ويدغم بغير غنة في الواو والياء كخلف عن حمزة مع التوسط في المدود.",
            sourceCitation = "الدرة المضية لابن الجزري • النشر في القراءات العشر"
        )
    )

    /**
     * Generates a comprehensive Ijazah & Mushafahah Readiness Report evaluating the student's readiness
     * across Hifz stability, Tajweed Makharij, Waqf & Ibtida, and Recurring Mistake resolution.
     */
    fun buildComprehensiveIjazahReadinessReport(
        studentName: String,
        memorizedVersesCount: Int,
        completedLessonsCount: Int,
        certificatesCount: Int,
        unresolvedMistakesCount: Int,
        averageFsrsStability: Double
    ): String {
        val readinessScore = (
            45 +
                (memorizedVersesCount * 3).coerceAtMost(25) +
                (completedLessonsCount * 3).coerceAtMost(15) +
                (certificatesCount * 5).coerceAtMost(10) -
                (unresolvedMistakesCount * 4)
            ).coerceIn(50, 99)

        val readinessVerdict = when {
            readinessScore >= 85 -> "مؤهل للعرض والمشافهة على المشايخ المجيزين (مستوى الإتقان العالي)"
            readinessScore >= 70 -> "قريب من التأهل الكامل (يُنصح بتصفية مواضع الأخطاء المتكررة ومختبر الوقف)"
            else -> "مرحلة التأسيس والضبط (استمر في حلقة التسميع الصوتية وجدولة FSRS)"
        }

        return buildString {
            appendLine("📜 وثيقة تقييم الجاهزية للعرض والمشافهة القرآنية (مدرسة إتقان)")
            appendLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            appendLine("👤 طالب العلم: $studentName")
            appendLine("📊 مؤشر الجاهزية الشامل للعرض: $readinessScore%")
            appendLine("🏛️ التوصية العلمية: $readinessVerdict")
            appendLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            appendLine("• الآيات المضبوطة بالتسميع الصوتي: $memorizedVersesCount آية")
            appendLine("• متوسط استقرار الذاكرة (FSRS Stability): ${String.format(java.util.Locale.US, "%.1f", averageFsrsStability)} يوم")
            appendLine("• الدروس العلمية المجتازة: $completedLessonsCount درساً | الشهادات: $certificatesCount")
            appendLine("• المواضع المتبقية في سجل الأخطاء للتصفية: $unresolvedMistakesCount موضع")
            appendLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            appendLine("تنبيه منهجي: هذا التقرير يقيس جاهزية الضبط العلمي والتجويدي داخل تطبيق «إتقان» تمهيداً للعرض المباشر بالمشافهة على شيخ متقن متصل السند.")
        }
    }
}
