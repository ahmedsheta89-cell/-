package com.example.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Flag
import androidx.compose.material.icons.filled.GraphicEq
import androidx.compose.material.icons.filled.HistoryEdu
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.VerifiedUser
import androidx.compose.material.icons.filled.WorkspacePremium
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.R
import com.example.data.local.BookmarkNoteEntity
import com.example.data.local.CertificateEntity
import com.example.data.local.FsrsReviewEntity
import com.example.data.local.LessonProgressEntity
import com.example.data.repository.UserPreferencesState
import com.example.domain.model.ContentAttributionType
import com.example.domain.model.SourceRegistryItem
import com.example.domain.model.SurahMetadata
import com.example.ui.components.ContentAttributionBadge
import com.example.ui.components.ReportScholarlyErrorDialog
import com.example.ui.theme.AmiriFontFamily
import com.example.ui.theme.IlluminatedGold
import com.example.ui.theme.IlluminatedGoldBright
import com.example.ui.theme.RoyalEmerald
import com.example.ui.theme.toArabicDigits

@Composable
fun HomeRawdahScreen(
    userPrefs: UserPreferencesState,
    surahCatalog: List<SurahMetadata>,
    fsrsReviews: List<FsrsReviewEntity>,
    lessonProgress: List<LessonProgressEntity>,
    certificates: List<CertificateEntity>,
    bookmarks: List<BookmarkNoteEntity>,
    dailyBenefits: List<Pair<String, String>>,
    sourceRegistry: List<SourceRegistryItem>,
    onNavigateToMushaf: (Int) -> Unit,
    onNavigateToAcademy: () -> Unit,
    onNavigateToHifz: () -> Unit,
    onNavigateToScholar: (String?) -> Unit,
    onSubmitErrorReport: (String, String, String, String) -> Unit,
    khatmahPlans: List<com.example.data.local.KhatmahPlanEntity> = com.example.data.local.ItqanPhase2SeedData.buildInitialKhatmahPlans(),
    mistakeLogs: List<com.example.data.local.MistakeLogEntity> = emptyList(),
    allCachedAyahs: List<com.example.data.local.AyahEntity> = emptyList(),
    tadabburJournals: List<com.example.data.local.TadabburJournalEntity> = com.example.data.local.ItqanPhase3SeedData.buildInitialTadabburJournal(),
    onLogDailyKhatmahWird: (com.example.data.local.KhatmahPlanEntity) -> Unit = {},
    onCreateNewKhatmahPlan: (String, String, Int) -> Unit = { _, _, _ -> },
    onSaveTadabburJournalEntry: (Int, String, Int, String, String, String, String, Int) -> Unit = { _, _, _, _, _, _, _, _ -> },
    modifier: Modifier = Modifier
) {
    var benefitIndex by remember { mutableIntStateOf(0) }
    var showSourceRegistryDialog by remember { mutableStateOf(false) }
    var showReportDialog by remember { mutableStateOf(false) }
    var showKhalwahTadabburSheet by remember { mutableStateOf(false) }

    val nowMillis = System.currentTimeMillis()
    val dueReviews = remember(fsrsReviews, nowMillis) {
        fsrsReviews.filter { it.dueTimestamp <= nowMillis + (6 * 60 * 60 * 1000L) }
    }
    val completedLessonsCount = lessonProgress.count { it.completed }
    val lastSurahMeta = surahCatalog.find { it.number == userPrefs.lastReadSurah } ?: surahCatalog.first()
    val currentBenefit = dailyBenefits.getOrElse(benefitIndex % dailyBenefits.size) {
        "شرف العلم بشرف معلومه، ولا أشرف من كلام الله تعالى." to "الإتقان في علوم القرآن للسيوطي"
    }

    LazyColumn(
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 14.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        modifier = modifier
            .fillMaxSize()
            .testTag("home_rawdah_screen")
    ) {
        // 1. Hero Illuminated Banner
        item {
            Card(
                shape = RoundedCornerShape(24.dp),
                border = BorderStroke(1.5.dp, IlluminatedGold),
                modifier = Modifier.fillMaxWidth()
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(210.dp)
                ) {
                    Image(
                        painter = painterResource(id = R.drawable.img_hero_quran_1794416409808),
                        contentDescription = "محراب إتقان المذهب",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(
                                Brush.verticalGradient(
                                    listOf(
                                        Color(0x9906231B),
                                        Color(0xE606231B)
                                    )
                                )
                            )
                    )
                    Column(
                        verticalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(18.dp)
                    ) {
                        Row(
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Surface(
                                color = IlluminatedGold.copy(alpha = 0.22f),
                                shape = RoundedCornerShape(50),
                                border = BorderStroke(1.dp, IlluminatedGold)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 5.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.LocalFireDepartment,
                                        contentDescription = "سلسلة المواظبة",
                                        tint = IlluminatedGoldBright,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(5.dp))
                                    Text(
                                        text = "ورد هادئ: ${userPrefs.streakDays.toArabicDigits(userPrefs.useEasternArabicDigits)} أيام متتالية",
                                        style = MaterialTheme.typography.labelMedium,
                                        color = Color(0xFFFAF6EE)
                                    )
                                }
                            }

                            Surface(
                                color = Color.Black.copy(alpha = 0.35f),
                                shape = RoundedCornerShape(50),
                                border = BorderStroke(1.dp, IlluminatedGold.copy(alpha = 0.5f)),
                                modifier = Modifier
                                    .clickable { showSourceRegistryDialog = true }
                                    .testTag("open_source_registry_button")
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.VerifiedUser,
                                        contentDescription = "سجل المصادر المعتمدة",
                                        tint = IlluminatedGoldBright,
                                        modifier = Modifier.size(15.dp)
                                    )
                                    Spacer(modifier = Modifier.width(5.dp))
                                    Text(
                                        text = "سجل المصادر (${sourceRegistry.size.toArabicDigits(userPrefs.useEasternArabicDigits)})",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = Color(0xFFFAF6EE)
                                    )
                                }
                            }
                        }

                        Column {
                            Text(
                                text = "الرَّوْضَةُ العِلْمِيَّةُ — إِتْقَان",
                                fontFamily = AmiriFontFamily,
                                fontWeight = FontWeight.Bold,
                                fontSize = 26.sp,
                                color = IlluminatedGoldBright
                            )
                            Text(
                                text = "وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا • تلاوة وتدبر وعلوم موثقة من أمهات الكتب",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color(0xFFF4EFE6)
                            )
                            Spacer(modifier = Modifier.height(10.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                Button(
                                    onClick = { onNavigateToMushaf(userPrefs.lastReadSurah) },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = IlluminatedGold,
                                        contentColor = Color(0xFF06231B)
                                    ),
                                    modifier = Modifier.testTag("continue_werd_button")
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.PlayArrow,
                                        contentDescription = null,
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = "متابعة الورد: سورة ${lastSurahMeta.nameAr} (${userPrefs.lastReadAyah.toArabicDigits(userPrefs.useEasternArabicDigits)})",
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // 2. Progress Summary Metrics Row
        item {
            Row(
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                MetricStatCard(
                    title = "المراجعات المستحقة",
                    value = "${dueReviews.size.toArabicDigits(userPrefs.useEasternArabicDigits)} أوراد",
                    subtitle = "خوارزمية FSRS",
                    icon = Icons.Default.GraphicEq,
                    onClick = onNavigateToHifz,
                    modifier = Modifier.weight(1f)
                )
                MetricStatCard(
                    title = "دروس الأكاديمية",
                    value = "${completedLessonsCount.toArabicDigits(userPrefs.useEasternArabicDigits)}/١٢",
                    subtitle = "٤ مسارات علمية",
                    icon = Icons.Default.School,
                    onClick = onNavigateToAcademy,
                    modifier = Modifier.weight(1f)
                )
                MetricStatCard(
                    title = "شهادات الإتمام",
                    value = certificates.size.toArabicDigits(userPrefs.useEasternArabicDigits),
                    subtitle = "موثقة برمز QR",
                    icon = Icons.Default.WorkspacePremium,
                    onClick = onNavigateToAcademy,
                    modifier = Modifier.weight(1f)
                )
            }
        }

        // 2b. Scheduled Khatmah Planner, Daily Wird & Home Widget Card
        item {
            com.example.ui.components.KhatmahPlannerAndWidgetCard(
                khatmahPlans = khatmahPlans,
                dueReviewsCount = dueReviews.size,
                recurringMistakesCount = mistakeLogs.count { !it.isResolved },
                useEasternDigits = userPrefs.useEasternArabicDigits,
                onLogDailyWird = onLogDailyKhatmahWird,
                onCreateNewKhatmahPlan = onCreateNewKhatmahPlan
            )
        }

        // 2c. Phase 3: Mushaf Mastery Heatmap & Quranic Khalwah Launcher
        item {
            com.example.ui.components.MushafMasteryHeatmapCard(
                surahCatalog = surahCatalog,
                cachedAyahs = allCachedAyahs,
                fsrsReviews = fsrsReviews,
                mistakeLogs = mistakeLogs,
                useEasternDigits = userPrefs.useEasternArabicDigits,
                onSelectSurah = onNavigateToMushaf,
                onOpenKhalwahMode = { showKhalwahTadabburSheet = true }
            )
        }

        // 3. Daily Benefit from Al-Itqan by Al-Suyuti ("فائدة اليوم")
        item {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                ),
                border = BorderStroke(1.dp, IlluminatedGold.copy(alpha = 0.55f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.HistoryEdu,
                                contentDescription = "فائدة اليوم",
                                tint = IlluminatedGold
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "فائدة اليوم من أمهات الكتب",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        ContentAttributionBadge(attribution = ContentAttributionType.AUTHENTIC_QUOTE)
                    }

                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = "«${currentBenefit.first}»",
                        fontFamily = AmiriFontFamily,
                        fontSize = 20.sp,
                        lineHeight = 32.sp,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = "المصدر: ${currentBenefit.second}",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Row {
                            TextButton(
                                onClick = { benefitIndex++ },
                                modifier = Modifier.testTag("next_daily_benefit_button")
                            ) {
                                Text("فائدة أخرى")
                            }
                            TextButton(
                                onClick = { showReportDialog = true },
                                modifier = Modifier.testTag("report_benefit_error_button")
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Flag,
                                    contentDescription = "الإبلاغ عن خطأ",
                                    modifier = Modifier.size(15.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("إبلاغ")
                            }
                        }
                    }
                }
            }
        }

        // 4. Due FSRS Spaced Repetition Reviews Today
        item {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column {
                            Text(
                                text = "مراجعات الحفظ المستحقة اليوم (FSRS)",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "جدولة ذكية تحسب استقرار الحفظ (Stability) وصعوبة المقطع",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        OutlinedButton(
                            onClick = onNavigateToHifz,
                            modifier = Modifier.testTag("open_hifz_hub_button")
                        ) {
                            Text("بدء التسميع")
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))
                    dueReviews.take(3).forEach { review ->
                        Surface(
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp)
                                .clickable { onNavigateToHifz() }
                        ) {
                            Row(
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp)
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = review.title,
                                        style = MaterialTheme.typography.bodyMedium,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                    Text(
                                        text = "استقرار الذاكرة: ${review.stability} يوم • الصعوبة: ${review.difficulty}/١٠",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                                Icon(
                                    imageVector = Icons.Default.CheckCircle,
                                    contentDescription = null,
                                    tint = IlluminatedGold
                                )
                            }
                        }
                    }
                }
            }
        }

        // 5. Quick Ask the Authoritative AI Scholar
        item {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                ),
                border = BorderStroke(1.dp, IlluminatedGold.copy(alpha = 0.6f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.AutoAwesome,
                            contentDescription = null,
                            tint = IlluminatedGold
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "اسأل المعلم القرآني الذكي الموثق (RAG)",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "يجيب حصراً من أمهات كتب التفسير والتجويد وعلوم القرآن مع عزو كل معلومة لمصدرها وسحب الآيات من القاعدة المحلية.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.85f)
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        OutlinedButton(
                            onClick = { onNavigateToScholar("ما الفرق بين الإدغام بغنة وبغير غنة مع الشاهد من تحفة الأطفال؟") },
                            modifier = Modifier.weight(1f).testTag("quick_question_idgham")
                        ) {
                            Text("الإدغام بغنة وبغير غنة", style = MaterialTheme.typography.labelSmall)
                        }
                        OutlinedButton(
                            onClick = { onNavigateToScholar("ما سبب نزول وفضل آية الكرسي ومعنى الحي القيوم؟") },
                            modifier = Modifier.weight(1f).testTag("quick_question_kursi")
                        ) {
                            Text("علوم آية الكرسي", style = MaterialTheme.typography.labelSmall)
                        }
                    }
                }
            }
        }

        // 6. Saved Bookmarks & Reflections
        if (bookmarks.isNotEmpty()) {
            item {
                Text(
                    text = "العلامات المرجعية والخواطر التدبرية المحفوظة",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }
            items(bookmarks.take(3), key = { it.compositeKey }) { bm ->
                Card(
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onNavigateToMushaf(bm.surahNumber) }
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(12.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Bookmark,
                            contentDescription = null,
                            tint = IlluminatedGold
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "سورة ${bm.surahNameAr} — الآية ${bm.ayahNumber.toArabicDigits(userPrefs.useEasternArabicDigits)}",
                                style = MaterialTheme.typography.labelLarge,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = bm.uthmaniSnippet,
                                fontFamily = AmiriFontFamily,
                                fontSize = 18.sp
                            )
                            if (bm.personalNote.isNotBlank()) {
                                Text(
                                    text = "تأمل: ${bm.personalNote}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    if (showSourceRegistryDialog) {
        SourceRegistryModalDialog(
            sources = sourceRegistry,
            onDismiss = { showSourceRegistryDialog = false }
        )
    }

    if (showReportDialog) {
        ReportScholarlyErrorDialog(
            screenName = "الروضة العلمية — فائدة اليوم",
            referenceKey = "daily_benefit_${benefitIndex % dailyBenefits.size}",
            itemTitle = currentBenefit.second,
            onDismiss = { showReportDialog = false },
            onSubmitReport = { details ->
                onSubmitErrorReport(
                    "الروضة العلمية",
                    "daily_benefit_${benefitIndex % dailyBenefits.size}",
                    currentBenefit.second,
                    details
                )
            }
        )
    }

    if (showKhalwahTadabburSheet) {
        com.example.ui.components.QuranicKhalwahAndTadabburSheet(
            currentAyah = allCachedAyahs.firstOrNull { it.surahNumber == userPrefs.lastReadSurah }
                ?: allCachedAyahs.firstOrNull(),
            tadabburJournals = tadabburJournals,
            useEasternDigits = userPrefs.useEasternArabicDigits,
            onSaveJournalEntry = onSaveTadabburJournalEntry,
            onDismiss = { showKhalwahTadabburSheet = false }
        )
    }
}

@Composable
private fun MetricStatCard(
    title: String,
    value: String,
    subtitle: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.6f)),
        modifier = modifier.clickable { onClick() }
    ) {
        Column(
            horizontalAlignment = Alignment.Start,
            modifier = Modifier.padding(12.dp)
        ) {
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .size(32.dp)
                    .clip(CircleShape)
                    .background(IlluminatedGold.copy(alpha = 0.2f))
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = title,
                    tint = IlluminatedGold,
                    modifier = Modifier.size(18.dp)
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = value,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
            Text(
                text = title,
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.SemiBold
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
fun SourceRegistryModalDialog(
    sources: List<SourceRegistryItem>,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.MenuBook,
                    contentDescription = null,
                    tint = IlluminatedGold
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "سجل المصادر المعتمدة وحوكمة المحتوى",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }
        },
        text = {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.height(380.dp)
            ) {
                item {
                    Text(
                        text = "جميع النصوص العلمية والتفاسير والمتون في «إتقان» موثقة من طبعات محققة ومعتمدة من لجنة المراجعة العلمية:",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                items(sources, key = { it.id }) { src ->
                    Surface(
                        color = MaterialTheme.colorScheme.surfaceVariant,
                        shape = RoundedCornerShape(12.dp),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                    ) {
                        Column(modifier = Modifier.padding(10.dp)) {
                            Text(
                                text = src.bookTitle,
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                            Text(
                                text = "المؤلف: ${src.author} (${src.deathHijri}) • القسم: ${src.category}",
                                style = MaterialTheme.typography.bodySmall
                            )
                            Text(
                                text = "الطبعة: ${src.editionInfo} | الرخصة: ${src.licenseStatus} | الإصدار: ${src.contentVersion}",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = onDismiss,
                colors = ButtonDefaults.buttonColors(containerColor = RoyalEmerald)
            ) {
                Text("إغلاق")
            }
        }
    )
}
