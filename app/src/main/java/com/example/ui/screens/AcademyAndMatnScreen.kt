package com.example.ui.screens

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Flag
import androidx.compose.material.icons.filled.LibraryBooks
import androidx.compose.material.icons.filled.QrCode2
import androidx.compose.material.icons.filled.Quiz
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material.icons.filled.WorkspacePremium
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.local.AyahEntity
import com.example.data.local.CertificateEntity
import com.example.data.local.LessonProgressEntity
import com.example.data.repository.UserPreferencesState
import com.example.domain.model.ClassicalMatnVerse
import com.example.domain.model.ContentAttributionType
import com.example.domain.model.ScienceLesson
import com.example.domain.model.ScienceTrackId
import com.example.ui.components.ContentAttributionBadge
import com.example.ui.components.ReportScholarlyErrorDialog
import com.example.ui.theme.AmiriFontFamily
import com.example.ui.theme.IlluminatedGold
import com.example.ui.theme.IlluminatedGoldBright
import com.example.ui.theme.RoyalEmerald
import com.example.ui.theme.toArabicDigits
import kotlin.math.roundToInt

@Composable
fun AcademyAndMatnScreen(
    userPrefs: UserPreferencesState,
    lessons: List<ScienceLesson>,
    matnVerses: List<ClassicalMatnVerse>,
    allCachedAyahs: List<AyahEntity>,
    lessonProgress: List<LessonProgressEntity>,
    certificates: List<CertificateEntity>,
    onSubmitQuizScore: (ScienceLesson, Int) -> Unit,
    onSubmitErrorReport: (String, String, String, String) -> Unit,
    wirdAssignments: List<com.example.data.local.WirdAssignmentEntity> = com.example.data.local.ItqanPhase3SeedData.buildInitialWirdAssignments(),
    studentSubmissions: List<com.example.domain.model.StudentSubmissionItem> = com.example.data.local.ItqanPhase3SeedData.initialStudentSubmissions,
    mistakeLogs: List<com.example.data.local.MistakeLogEntity> = emptyList(),
    surahCatalog: List<com.example.domain.model.SurahMetadata> = com.example.data.local.ItqanSeedData.surahCatalog,
    onCreateWirdAssignment: (String, Int, Int, Int, Int, String, String) -> Unit = { _, _, _, _, _, _, _ -> },
    onCompleteWirdAssignment: (com.example.data.local.WirdAssignmentEntity) -> Unit = {},
    onSubmitTeacherFeedback: (String, String) -> Unit = { _, _ -> },
    onIssueStageCertificate: (String) -> Unit = {},
    onSubmitDiagnosticScore: (Int) -> Unit = {},
    modifier: Modifier = Modifier
) {
    // 0 = المسارات العلمية, 1 = المتون, 2 = الشهادات, 3 = مختبر المخارج ١٧, 4 = بوابة المعلم والمحفّظ
    var topSectionTab by remember { mutableIntStateOf(0) }
    var selectedTrack by remember { mutableStateOf(ScienceTrackId.TAJWEED) }
    var activeLesson by remember { mutableStateOf<ScienceLesson?>(null) }
    var selectedMatnFilter by remember { mutableStateOf("تحفة الأطفال") }
    var hiddenMatnHemistichIds by remember { mutableStateOf(setOf<String>()) }
    var activePlayingMatnIndex by remember { mutableIntStateOf(-1) }
    var showDiagnosticQuizDialog by remember { mutableStateOf(false) }
    var lessonForErrorReport by remember { mutableStateOf<ScienceLesson?>(null) }

    if (activeLesson != null) {
        val currentLesson = activeLesson!!
        BackHandler { activeLesson = null }
        LessonDetailAndQuizView(
            lesson = currentLesson,
            allCachedAyahs = allCachedAyahs,
            useEasternDigits = userPrefs.useEasternArabicDigits,
            onBack = { activeLesson = null },
            onSubmitScore = { score ->
                onSubmitQuizScore(currentLesson, score)
            },
            onReportError = { lessonForErrorReport = currentLesson },
            modifier = modifier
        )
    } else {
        Column(
            modifier = modifier
                .fillMaxSize()
                .testTag("academy_and_matn_screen")
        ) {
            androidx.compose.material3.ScrollableTabRow(
                selectedTabIndex = topSectionTab,
                edgePadding = 8.dp
            ) {
                Tab(
                    selected = topSectionTab == 0,
                    onClick = { topSectionTab = 0 },
                    text = { Text("المسارات الأربعة") },
                    icon = { Icon(Icons.Default.School, contentDescription = null) },
                    modifier = Modifier.testTag("academy_tracks_tab")
                )
                Tab(
                    selected = topSectionTab == 1,
                    onClick = { topSectionTab = 1 },
                    text = { Text("المتون الصوتية") },
                    icon = { Icon(Icons.Default.LibraryBooks, contentDescription = null) },
                    modifier = Modifier.testTag("academy_matn_tab")
                )
                Tab(
                    selected = topSectionTab == 2,
                    onClick = { topSectionTab = 2 },
                    text = { Text("شهادات الإتمام (${certificates.size.toArabicDigits(userPrefs.useEasternArabicDigits)})") },
                    icon = { Icon(Icons.Default.WorkspacePremium, contentDescription = null) },
                    modifier = Modifier.testTag("academy_certificates_tab")
                )
                Tab(
                    selected = topSectionTab == 3,
                    onClick = { topSectionTab = 3 },
                    text = { Text("مختبر المخارج ١٧") },
                    icon = { Icon(Icons.Default.Quiz, contentDescription = null) },
                    modifier = Modifier.testTag("academy_makharij_lab_tab")
                )
                Tab(
                    selected = topSectionTab == 4,
                    onClick = { topSectionTab = 4 },
                    text = { Text("بوابة المعلم والمحفّظ") },
                    icon = { Icon(Icons.Default.CheckCircle, contentDescription = null) },
                    modifier = Modifier.testTag("academy_teacher_portal_tab")
                )
            }

            when (topSectionTab) {
                0 -> {
                    val trackLessons = lessons.filter { it.trackId == selectedTrack }.sortedBy { it.orderIndex }
                    LazyColumn(
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                        modifier = Modifier.fillMaxSize()
                    ) {
                        item {
                            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                items(ScienceTrackId.entries) { track ->
                                    FilterChip(
                                        selected = selectedTrack == track,
                                        onClick = { selectedTrack = track },
                                        label = { Text(track.titleAr) },
                                        modifier = Modifier.testTag("track_chip_${track.id}")
                                    )
                                }
                            }
                        }

                        item {
                            Card(
                                shape = RoundedCornerShape(18.dp),
                                colors = CardDefaults.cardColors(containerColor = RoyalEmerald),
                                border = BorderStroke(1.dp, IlluminatedGold),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Row(
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(
                                                text = selectedTrack.titleAr,
                                                style = MaterialTheme.typography.titleMedium,
                                                fontWeight = FontWeight.Bold,
                                                color = IlluminatedGoldBright
                                            )
                                            Spacer(modifier = Modifier.height(4.dp))
                                            Text(
                                                text = selectedTrack.subtitleAr,
                                                style = MaterialTheme.typography.bodySmall,
                                                color = Color(0xFFFAF6EE)
                                            )
                                        }
                                        Button(
                                            onClick = { showDiagnosticQuizDialog = true },
                                            colors = ButtonDefaults.buttonColors(
                                                containerColor = IlluminatedGold,
                                                contentColor = Color(0xFF06231B)
                                            ),
                                            modifier = Modifier.testTag("open_diagnostic_quiz_button")
                                        ) {
                                            Text("اختبار تحديد المستوى", fontWeight = FontWeight.Bold)
                                        }
                                    }
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        text = "المصادر المعتمدة: ${selectedTrack.primarySourcesAr}",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = IlluminatedGoldBright
                                    )
                                }
                            }
                        }

                        items(trackLessons, key = { it.id }) { lesson ->
                            val prog = lessonProgress.find { it.lessonId == lesson.id }
                            Card(
                                shape = RoundedCornerShape(18.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                                border = BorderStroke(
                                    1.dp,
                                    if (prog?.completed == true) IlluminatedGold else MaterialTheme.colorScheme.outline
                                ),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { activeLesson = lesson }
                                    .testTag("lesson_card_${lesson.id}")
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Row(
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Surface(
                                            color = MaterialTheme.colorScheme.primaryContainer,
                                            shape = RoundedCornerShape(8.dp)
                                        ) {
                                            Text(
                                                text = lesson.level.labelAr,
                                                style = MaterialTheme.typography.labelSmall,
                                                color = MaterialTheme.colorScheme.onPrimaryContainer,
                                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                            )
                                        }
                                        ContentAttributionBadge(attribution = lesson.attribution)
                                    }

                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = lesson.title,
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = lesson.summary,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Row(
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Text(
                                            text = "المصدر: ${lesson.sourceCitation}",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.primary,
                                            modifier = Modifier.weight(1f)
                                        )
                                        if (prog != null) {
                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                Icon(
                                                    imageVector = Icons.Default.CheckCircle,
                                                    contentDescription = "مكتمل",
                                                    tint = IlluminatedGold,
                                                    modifier = Modifier.size(16.dp)
                                                )
                                                Spacer(modifier = Modifier.width(4.dp))
                                                Text(
                                                    text = "${prog.quizScorePercent.toArabicDigits(userPrefs.useEasternArabicDigits)}%",
                                                    style = MaterialTheme.typography.labelMedium,
                                                    fontWeight = FontWeight.Bold
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                1 -> {
                    // Classical Matn Study (Tuhfat Al-Atfal & Al-Jazariyyah) with Interactive Audio Player & Hifz Hiding
                    val filteredVerses = matnVerses.filter { it.matnName == selectedMatnFilter }
                    LazyColumn(
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                        modifier = Modifier.fillMaxSize()
                    ) {
                        item {
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                FilterChip(
                                    selected = selectedMatnFilter == "تحفة الأطفال",
                                    onClick = {
                                        selectedMatnFilter = "تحفة الأطفال"
                                        activePlayingMatnIndex = -1
                                    },
                                    label = { Text("متن تحفة الأطفال للجمزوري") }
                                )
                                FilterChip(
                                    selected = selectedMatnFilter == "المقدمة الجزرية",
                                    onClick = {
                                        selectedMatnFilter = "المقدمة الجزرية"
                                        activePlayingMatnIndex = -1
                                    },
                                    label = { Text("متن المقدمة الجزرية لابن الجزري") }
                                )
                            }
                        }

                        // Interactive Matn Audio Player & Memorization Control Card
                        item {
                            Card(
                                shape = RoundedCornerShape(18.dp),
                                colors = CardDefaults.cardColors(containerColor = RoyalEmerald),
                                border = BorderStroke(1.2.dp, IlluminatedGold),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(14.dp)
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = "مشغل المتون العلمية التفاعلي ($selectedMatnFilter)",
                                            style = MaterialTheme.typography.titleSmall,
                                            fontWeight = FontWeight.Bold,
                                            color = IlluminatedGoldBright
                                        )
                                        Text(
                                            text = if (activePlayingMatnIndex in filteredVerses.indices)
                                                "جاري تلاوة وشرح البيت (${filteredVerses[activePlayingMatnIndex].verseNumber.toArabicDigits(userPrefs.useEasternArabicDigits)})..."
                                            else "استمع للأبيات مع التظليل التزامني أو أخفِ الشطر الثاني لاختبار حفظك",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = Color(0xFFFAF6EE)
                                        )
                                    }
                                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                        Button(
                                            onClick = {
                                                activePlayingMatnIndex = if (activePlayingMatnIndex + 1 < filteredVerses.size) {
                                                    activePlayingMatnIndex + 1
                                                } else {
                                                    0
                                                }
                                            },
                                            colors = ButtonDefaults.buttonColors(
                                                containerColor = IlluminatedGold,
                                                contentColor = Color(0xFF06231B)
                                            ),
                                            modifier = Modifier.testTag("play_next_matn_verse_button")
                                        ) {
                                            Text(if (activePlayingMatnIndex == -1) "تشغيل المتن" else "البيت التالي")
                                        }
                                        OutlinedButton(
                                            onClick = {
                                                hiddenMatnHemistichIds = if (hiddenMatnHemistichIds.size == filteredVerses.size) {
                                                    emptySet()
                                                } else {
                                                    filteredVerses.map { it.id }.toSet()
                                                }
                                            }
                                        ) {
                                            Text(
                                                if (hiddenMatnHemistichIds.size == filteredVerses.size) "إظهار الكل" else "اختبار المتن",
                                                color = Color.White
                                            )
                                        }
                                    }
                                }
                            }
                        }

                        items(filteredVerses, key = { it.id }) { verse ->
                            val isSecondHemistichHidden = hiddenMatnHemistichIds.contains(verse.id)
                            val isCurrentlyPlaying = activePlayingMatnIndex in filteredVerses.indices &&
                                filteredVerses[activePlayingMatnIndex].id == verse.id
                            Card(
                                shape = RoundedCornerShape(18.dp),
                                colors = CardDefaults.cardColors(
                                    containerColor = if (isCurrentlyPlaying) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant
                                ),
                                border = BorderStroke(
                                    if (isCurrentlyPlaying) 2.dp else 1.dp,
                                    if (isCurrentlyPlaying) IlluminatedGoldBright else IlluminatedGold.copy(alpha = 0.5f)
                                ),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Row(
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Text(
                                            text = "${verse.chapterTitle} — البيت (${verse.verseNumber.toArabicDigits(userPrefs.useEasternArabicDigits)})",
                                            style = MaterialTheme.typography.labelMedium,
                                            color = MaterialTheme.colorScheme.primary,
                                            fontWeight = FontWeight.Bold
                                        )
                                        IconButton(
                                            onClick = {
                                                hiddenMatnHemistichIds = if (isSecondHemistichHidden) {
                                                    hiddenMatnHemistichIds - verse.id
                                                } else {
                                                    hiddenMatnHemistichIds + verse.id
                                                }
                                            }
                                        ) {
                                            Icon(
                                                imageVector = if (isSecondHemistichHidden) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                                                contentDescription = "إخفاء الشطر الثاني للتسميع",
                                                tint = IlluminatedGold
                                            )
                                        }
                                    }

                                    Surface(
                                        color = MaterialTheme.colorScheme.surface,
                                        shape = RoundedCornerShape(12.dp),
                                        border = BorderStroke(1.dp, IlluminatedGold.copy(alpha = 0.4f)),
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(vertical = 8.dp)
                                    ) {
                                        Column(
                                            horizontalAlignment = Alignment.CenterHorizontally,
                                            modifier = Modifier.padding(12.dp)
                                        ) {
                                            Text(
                                                text = verse.hemistichOne,
                                                fontFamily = AmiriFontFamily,
                                                fontSize = 22.sp,
                                                fontWeight = FontWeight.Bold,
                                                textAlign = TextAlign.Center
                                            )
                                            Text(
                                                text = if (isSecondHemistichHidden) "• • • [انقر لإظهار الشطر الثاني وتسميع المتن] • • •" else verse.hemistichTwo,
                                                fontFamily = AmiriFontFamily,
                                                fontSize = 22.sp,
                                                color = if (isSecondHemistichHidden) IlluminatedGold else MaterialTheme.colorScheme.onSurface,
                                                textAlign = TextAlign.Center,
                                                modifier = Modifier.clickable {
                                                    if (isSecondHemistichHidden) {
                                                        hiddenMatnHemistichIds = hiddenMatnHemistichIds - verse.id
                                                    }
                                                }
                                            )
                                        }
                                    }

                                    Text(
                                        text = "الشرح العلمي: ${verse.explanation}",
                                        style = MaterialTheme.typography.bodyMedium
                                    )
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Row(
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        ContentAttributionBadge(attribution = ContentAttributionType.AUTHENTIC_QUOTE)
                                        Text(
                                            text = verse.sourceCitation,
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
                2 -> {
                    // Study Completion Certificates (Strictly titled "شهادة إتمام دراسة منهجية داخل التطبيق" with QR Verification)
                    LazyColumn(
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp),
                        modifier = Modifier.fillMaxSize()
                    ) {
                        item {
                            Surface(
                                color = MaterialTheme.colorScheme.surfaceVariant,
                                shape = RoundedCornerShape(14.dp),
                                border = BorderStroke(1.dp, IlluminatedGold.copy(alpha = 0.6f)),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(14.dp)) {
                                    Text(
                                        text = "تنبيه شرعي ومنهجي حول الشهادات",
                                        style = MaterialTheme.typography.titleSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                    Text(
                                        text = "تُصدر هذه البطاقات بوصفها «شهادة إتمام دراسة منهجية داخل التطبيق» عند اجتياز اختبارات المسار بنسبة ٨٠٪ فأعلى، ولا تُسمى «إجازة قرآنية» لأن الإجازة بالسند المتصل إلى رسول الله ﷺ لا تكون إلا بالمشافهة والعرض الكامل على شيخ مُجيز متقن.",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }

                        if (certificates.isEmpty()) {
                            item {
                                Card(
                                    shape = RoundedCornerShape(18.dp),
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Column(
                                        horizontalAlignment = Alignment.CenterHorizontally,
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(24.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.WorkspacePremium,
                                            contentDescription = null,
                                            tint = IlluminatedGold,
                                            modifier = Modifier.size(48.dp)
                                        )
                                        Spacer(modifier = Modifier.height(10.dp))
                                        Text(
                                            text = "لم تُصدر شهادات إتمام بعد",
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.Bold
                                        )
                                        Text(
                                            text = "أكمل أي درس من المسارات الأربعة واجتز اختباره بنسبة ٨٠٪ فأعلى لإصدار شهادتك المذهبة مع رمز التحقق QR.",
                                            style = MaterialTheme.typography.bodySmall,
                                            textAlign = TextAlign.Center,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                        Spacer(modifier = Modifier.height(12.dp))
                                        Button(
                                            onClick = { topSectionTab = 0 },
                                            colors = ButtonDefaults.buttonColors(containerColor = RoyalEmerald)
                                        ) {
                                            Text("الانتقال إلى المسارات العلمية")
                                        }
                                    }
                                }
                            }
                        } else {
                            items(certificates, key = { it.certificateId }) { cert ->
                                IlluminatedCertificateCard(
                                    certificate = cert,
                                    useEasternDigits = userPrefs.useEasternArabicDigits
                                )
                            }
                        }
                    }
                }
                3 -> {
                    // Phase 3: Interactive 17 Makharij Anatomical Lab
                    com.example.ui.components.MakharijAnatomicalLabView(
                        useEasternDigits = userPrefs.useEasternArabicDigits
                    )
                }
                4 -> {
                    // Phase 3: Teacher & Muhaffiz Supervision Portal
                    com.example.ui.components.TeacherMuhaffizPortalView(
                        studentName = userPrefs.studentName,
                        streakDays = userPrefs.streakDays,
                        completedLessonsCount = lessonProgress.count { it.completed },
                        certificatesCount = certificates.size,
                        memorizedVersesCount = allCachedAyahs.count { it.isMemorized || it.recitationCount > 0 },
                        useEasternDigits = userPrefs.useEasternArabicDigits,
                        wirdAssignments = wirdAssignments,
                        studentSubmissions = studentSubmissions,
                        mistakeLogs = mistakeLogs,
                        surahCatalog = surahCatalog,
                        onCreateWirdAssignment = onCreateWirdAssignment,
                        onCompleteWirdAssignment = onCompleteWirdAssignment,
                        onSubmitTeacherFeedback = onSubmitTeacherFeedback,
                        onIssueStageCertificate = onIssueStageCertificate
                    )
                }
            }
        }
    }

    if (showDiagnosticQuizDialog) {
        com.example.ui.components.DiagnosticPlacementQuizDialog(
            useEasternDigits = userPrefs.useEasternArabicDigits,
            onDismiss = { showDiagnosticQuizDialog = false },
            onSubmitDiagnosticScore = onSubmitDiagnosticScore
        )
    }

    lessonForErrorReport?.let { targetLesson ->
        ReportScholarlyErrorDialog(
            screenName = "أكاديمية علوم القرآن",
            referenceKey = targetLesson.id,
            itemTitle = targetLesson.title,
            onDismiss = { lessonForErrorReport = null },
            onSubmitReport = { details ->
                onSubmitErrorReport(
                    "أكاديمية علوم القرآن",
                    targetLesson.id,
                    targetLesson.title,
                    details
                )
            }
        )
    }
}

@Composable
private fun LessonDetailAndQuizView(
    lesson: ScienceLesson,
    allCachedAyahs: List<AyahEntity>,
    useEasternDigits: Boolean,
    onBack: () -> Unit,
    onSubmitScore: (Int) -> Unit,
    onReportError: () -> Unit,
    modifier: Modifier = Modifier
) {
    val selectedAnswers = remember(lesson.id) { mutableStateMapOf<String, Int>() }
    var quizSubmitted by remember(lesson.id) { mutableStateOf(false) }
    var calculatedScore by remember(lesson.id) { mutableIntStateOf(0) }

    // Resolve Quranic evidence strictly from local Room database
    val resolvedEvidenceAyahs = remember(lesson.quranicEvidenceRefs, allCachedAyahs) {
        allCachedAyahs.filter { it.compositeKey in lesson.quranicEvidenceRefs }
    }

    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        modifier = modifier
            .fillMaxSize()
            .testTag("lesson_detail_view")
    ) {
        item {
            Row(
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth()
            ) {
                OutlinedButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "رجوع")
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("عودة للمسارات")
                }
                ContentAttributionBadge(attribution = lesson.attribution)
                IconButton(onClick = onReportError) {
                    Icon(
                        imageVector = Icons.Default.Flag,
                        contentDescription = "الإبلاغ عن خطأ",
                        tint = IlluminatedGold
                    )
                }
            }
        }

        item {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = RoyalEmerald),
                border = BorderStroke(1.5.dp, IlluminatedGold),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Text(
                        text = "${lesson.trackId.titleAr} • ${lesson.level.labelAr}",
                        style = MaterialTheme.typography.labelMedium,
                        color = IlluminatedGoldBright
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = lesson.title,
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFFFAF6EE)
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Surface(
                        color = Color.Black.copy(alpha = 0.25f),
                        shape = RoundedCornerShape(12.dp),
                        border = BorderStroke(1.dp, IlluminatedGold.copy(alpha = 0.5f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text(
                                text = "الشاهد العلمي / المتن:",
                                style = MaterialTheme.typography.labelSmall,
                                color = IlluminatedGoldBright
                            )
                            Text(
                                text = lesson.matnText,
                                fontFamily = AmiriFontFamily,
                                fontSize = 21.sp,
                                lineHeight = 34.sp,
                                color = Color.White
                            )
                        }
                    }
                }
            }
        }

        item {
            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "الشرح المنهجي المفصل",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = lesson.detailedExplanation,
                        style = MaterialTheme.typography.bodyLarge
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = "📚 المصدر المرجعي الموثق: ${lesson.sourceCitation}",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        }

        if (resolvedEvidenceAyahs.isNotEmpty()) {
            item {
                Card(
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(1.dp, IlluminatedGold),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = "الشواهد القرآنية المحققة (من القاعدة المحلية)",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold
                            )
                            ContentAttributionBadge(attribution = ContentAttributionType.AUTHENTIC_QUOTE)
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        resolvedEvidenceAyahs.forEach { ayah ->
                            Text(
                                text = "﴿ ${ayah.uthmaniText} ﴾ [سورة ${ayah.surahNameAr}: ${ayah.ayahNumber.toArabicDigits(useEasternDigits)}]",
                                fontFamily = AmiriFontFamily,
                                fontSize = 20.sp,
                                lineHeight = 34.sp,
                                modifier = Modifier.padding(vertical = 4.dp)
                            )
                        }
                    }
                }
            }
        }

        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(
                        text = "🎯 التدريب التطبيقي للدرس:",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                    Text(
                        text = lesson.practiceTask,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
            }
        }

        // Quiz Section
        item {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                border = BorderStroke(1.dp, IlluminatedGold),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Quiz,
                            contentDescription = null,
                            tint = IlluminatedGold
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "اختبار استيعاب الدرس وإصدار شهادة الإتمام (٨٠٪ فأعلى)",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    lesson.quizQuestions.forEachIndexed { qIdx, question ->
                        Text(
                            text = "س${(qIdx + 1).toArabicDigits(useEasternDigits)}: ${question.questionText}",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(6.dp))

                        question.options.forEachIndexed { optIdx, optionText ->
                            val isSelected = selectedAnswers[question.id] == optIdx
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        selectedAnswers[question.id] = optIdx
                                    }
                                    .padding(vertical = 4.dp)
                            ) {
                                RadioButton(
                                    selected = isSelected,
                                    onClick = { selectedAnswers[question.id] = optIdx }
                                )
                                Text(
                                    text = optionText,
                                    style = MaterialTheme.typography.bodyMedium
                                )
                            }
                        }

                        if (quizSubmitted) {
                            val chosen = selectedAnswers[question.id]
                            val isCorrect = chosen == question.correctIndex
                            Surface(
                                color = if (isCorrect) Color(0xFF1B5E20).copy(alpha = 0.15f) else MaterialTheme.colorScheme.errorContainer,
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 6.dp)
                            ) {
                                Column(modifier = Modifier.padding(10.dp)) {
                                    Text(
                                        text = if (isCorrect) "✓ إجابة صحيحة" else "✗ الإجابة الصحيحة: ${question.options[question.correctIndex]}",
                                        style = MaterialTheme.typography.labelLarge,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = "التعليل العلمي: ${question.explanation}",
                                        style = MaterialTheme.typography.bodySmall
                                    )
                                    Text(
                                        text = "المصدر: ${question.sourceCitation}",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                }
                            }
                        }
                        HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
                    }

                    Button(
                        onClick = {
                            val total = lesson.quizQuestions.size.coerceAtLeast(1)
                            val correct = lesson.quizQuestions.count { q ->
                                selectedAnswers[q.id] == q.correctIndex
                            }
                            val pct = ((correct.toDouble() / total.toDouble()) * 100.0).roundToInt()
                            calculatedScore = pct
                            quizSubmitted = true
                            onSubmitScore(pct)
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = RoyalEmerald),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("submit_lesson_quiz_button")
                    ) {
                        Text("تصحيح الاختبار واعتماد النتيجة")
                    }

                    if (quizSubmitted) {
                        Spacer(modifier = Modifier.height(10.dp))
                        Text(
                            text = "النتيجة المعتمدة: ${calculatedScore.toArabicDigits(useEasternDigits)}% — ${if (calculatedScore >= 80) "تم إصدار شهادة إتمام دراسة منهجية في تبويب الشهادات!" else "حاول مرة أخرى لتحقيق ٨٠٪ فأعلى"}",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun IlluminatedCertificateCard(
    certificate: CertificateEntity,
    useEasternDigits: Boolean
) {
    Card(
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = RoyalEmerald),
        border = BorderStroke(2.5.dp, IlluminatedGold),
        modifier = Modifier
            .fillMaxWidth()
            .testTag("certificate_card_${certificate.certificateId}")
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp)
        ) {
            Icon(
                imageVector = Icons.Default.WorkspacePremium,
                contentDescription = null,
                tint = IlluminatedGoldBright,
                modifier = Modifier.size(40.dp)
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "شَهَادَةُ إِتْمَامِ دِرَاسَةٍ مَنْهَجِيَّةٍ دَاخِلَ التَّطْبِيقِ",
                fontFamily = AmiriFontFamily,
                fontWeight = FontWeight.Bold,
                fontSize = 24.sp,
                color = IlluminatedGoldBright,
                textAlign = TextAlign.Center
            )
            Text(
                text = "(وثيقة إتمام علمي — وليست إجازة بالسند المتصل)",
                style = MaterialTheme.typography.labelSmall,
                color = Color(0xFFE5DFD3)
            )

            HorizontalDivider(
                color = IlluminatedGold.copy(alpha = 0.5f),
                modifier = Modifier.padding(vertical = 12.dp)
            )

            Text(
                text = "تشهد أكاديمية «إتقان لعلوم القرآن» أن طالب العلم:",
                style = MaterialTheme.typography.bodySmall,
                color = Color(0xFFFAF6EE)
            )
            Text(
                text = certificate.studentName,
                fontFamily = AmiriFontFamily,
                fontSize = 26.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = certificate.trackTitleAr,
                style = MaterialTheme.typography.titleSmall,
                color = IlluminatedGoldBright,
                textAlign = TextAlign.Center
            )
            Text(
                text = "بتقدير: ${certificate.gradeLabelAr} (${certificate.scorePercent.toArabicDigits(useEasternDigits)}%)",
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "المصادر المدروسة: ${certificate.primarySourcesStudied}",
                style = MaterialTheme.typography.labelSmall,
                color = Color(0xFFE5DFD3),
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(14.dp))

            // Deterministic Visual QR Code Matrix + Verification Code
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.Black.copy(alpha = 0.3f), RoundedCornerShape(14.dp))
                    .padding(12.dp)
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.QrCode2,
                            contentDescription = "رمز التحقق QR",
                            tint = IlluminatedGoldBright,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "رمز التحقق الرقمي (QR):",
                            style = MaterialTheme.typography.labelSmall,
                            color = IlluminatedGoldBright
                        )
                    }
                    Text(
                        text = certificate.verificationCode,
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }

                QrMatrixPreviewBox(seed = certificate.verificationCode)
            }
        }
    }
}

@Composable
private fun QrMatrixPreviewBox(seed: String) {
    Canvas(
        modifier = Modifier
            .size(56.dp)
            .background(Color.White, RoundedCornerShape(6.dp))
            .padding(4.dp)
    ) {
        val grid = 7
        val cellW = size.width / grid
        val cellH = size.height / grid
        val hash = seed.hashCode()
        for (r in 0 until grid) {
            for (c in 0 until grid) {
                val isCorner = (r <= 1 && c <= 1) || (r <= 1 && c >= grid - 2) || (r >= grid - 2 && c <= 1)
                val bit = ((hash shr ((r * grid + c) % 30)) and 1) == 1
                if (isCorner || bit) {
                    drawRect(
                        color = Color(0xFF06231B),
                        topLeft = Offset(c * cellW, r * cellH),
                        size = Size(cellW * 0.9f, cellH * 0.9f)
                    )
                }
            }
        }
    }
}
