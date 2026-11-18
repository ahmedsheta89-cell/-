package com.example.ui.components

import android.content.Intent
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
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
import androidx.compose.material.icons.filled.AccountTree
import androidx.compose.material.icons.filled.CloudDownload
import androidx.compose.material.icons.filled.CloudUpload
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.WorkspacePremium
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.ScrollableTabRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.local.AyahEntity
import com.example.data.local.BookmarkNoteEntity
import com.example.data.local.CertificateEntity
import com.example.data.local.FsrsReviewEntity
import com.example.data.local.ItqanPhase4SeedData
import com.example.data.local.MistakeLogEntity
import com.example.data.local.TadabburJournalEntity
import com.example.domain.model.ContentAttributionType
import com.example.domain.model.MorphologicalRootEntry
import com.example.domain.model.QuranicStoryAtlasItem
import com.example.domain.model.QuizQuestion
import com.example.domain.model.ThematicQuranCategory
import com.example.ui.theme.AmiriFontFamily
import com.example.ui.theme.IlluminatedGold
import com.example.ui.theme.IlluminatedGoldBright
import com.example.ui.theme.RoyalEmerald
import com.example.ui.theme.toArabicDigits
import kotlin.math.roundToInt

/**
 * Phase 4: Thematic Quran Index, Quranic Stories Atlas & Morphological Root Search Sheet.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ThematicIndexStoriesAndRootSheet(
    initialTab: Int = 0,
    allCachedAyahs: List<AyahEntity>,
    thematicCategories: List<ThematicQuranCategory> = ItqanPhase4SeedData.thematicQuranIndex,
    storiesAtlas: List<QuranicStoryAtlasItem> = ItqanPhase4SeedData.quranicStoriesAtlas,
    morphologicalRoots: List<MorphologicalRootEntry> = ItqanPhase4SeedData.morphologicalRootsCatalog,
    useEasternDigits: Boolean = true,
    onSelectSurah: (Int) -> Unit = {},
    onDismiss: () -> Unit
) {
    var activeTab by remember { mutableIntStateOf(initialTab.coerceIn(0, 2)) }
    var selectedBranchFilter by remember { mutableStateOf("الكل") }
    var rootSearchQuery by remember { mutableStateOf("") }

    val branches = listOf("الكل", "العقيدة والتوحيد", "العبادات والشعائر", "الأخلاق وتزكية النفوس", "الأحكام والسنن")

    val filteredThemes = remember(selectedBranchFilter, thematicCategories) {
        if (selectedBranchFilter == "الكل") thematicCategories
        else thematicCategories.filter { it.branchAr == selectedBranchFilter }
    }

    val filteredRoots = remember(rootSearchQuery, morphologicalRoots) {
        val clean = rootSearchQuery.trim().replace(" ", "")
        if (clean.isEmpty()) morphologicalRoots
        else morphologicalRoots.filter {
            it.rootPlainAr.contains(clean) ||
                it.rootSpacedAr.contains(rootSearchQuery.trim()) ||
                it.raghibCoreMeaningAr.contains(clean) ||
                it.derivativesWithAyahs.any { pair -> pair.first.contains(clean) }
        }
    }

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .testTag("thematic_stories_root_sheet")
        ) {
            ScrollableTabRow(
                selectedTabIndex = activeTab,
                edgePadding = 12.dp
            ) {
                Tab(
                    selected = activeTab == 0,
                    onClick = { activeTab = 0 },
                    text = { Text("الشجرة الموضوعية والقواعد الحسان") },
                    icon = { Icon(Icons.Default.AccountTree, contentDescription = null) },
                    modifier = Modifier.testTag("thematic_sheet_tab_tree")
                )
                Tab(
                    selected = activeTab == 1,
                    onClick = { activeTab = 1 },
                    text = { Text("أطلس القصص والمكي والمدني") },
                    icon = { Icon(Icons.Default.Map, contentDescription = null) },
                    modifier = Modifier.testTag("thematic_sheet_tab_stories")
                )
                Tab(
                    selected = activeTab == 2,
                    onClick = { activeTab = 2 },
                    text = { Text("البحث بالجذر اللغوي الصرفي") },
                    icon = { Icon(Icons.Default.Search, contentDescription = null) },
                    modifier = Modifier.testTag("thematic_sheet_tab_roots")
                )
            }

            LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(480.dp)
            ) {
                when (activeTab) {
                    0 -> {
                        item {
                            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                items(branches) { branch ->
                                    FilterChip(
                                        selected = selectedBranchFilter == branch,
                                        onClick = { selectedBranchFilter = branch },
                                        label = { Text(branch) }
                                    )
                                }
                            }
                        }

                        items(filteredThemes, key = { it.id }) { theme ->
                            val resolvedVerses = allCachedAyahs.filter { it.compositeKey in theme.relatedAyahKeys }
                            Card(
                                shape = RoundedCornerShape(18.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                                border = BorderStroke(1.2.dp, IlluminatedGold),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(14.dp)) {
                                    Row(
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Surface(
                                            color = RoyalEmerald,
                                            shape = RoundedCornerShape(8.dp)
                                        ) {
                                            Text(
                                                text = theme.branchAr,
                                                style = MaterialTheme.typography.labelSmall,
                                                color = IlluminatedGoldBright,
                                                fontWeight = FontWeight.Bold,
                                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                            )
                                        }
                                        ContentAttributionBadge(attribution = ContentAttributionType.AUTHENTIC_QUOTE)
                                    }

                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        text = theme.topicTitleAr,
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold
                                    )

                                    Spacer(modifier = Modifier.height(6.dp))
                                    Surface(
                                        color = MaterialTheme.colorScheme.surface,
                                        shape = RoundedCornerShape(10.dp),
                                        border = BorderStroke(1.dp, IlluminatedGold.copy(alpha = 0.45f)),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Column(modifier = Modifier.padding(10.dp)) {
                                            Text(
                                                text = theme.saadiPrincipleTitleAr,
                                                style = MaterialTheme.typography.labelMedium,
                                                fontWeight = FontWeight.Bold,
                                                color = MaterialTheme.colorScheme.primary
                                            )
                                            Text(
                                                text = theme.saadiPrincipleExplanationAr,
                                                style = MaterialTheme.typography.bodySmall
                                            )
                                        }
                                    }

                                    if (resolvedVerses.isNotEmpty()) {
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Text(
                                            text = "الآيات المتناظرة في الموضوع (من القاعدة المحلية):",
                                            style = MaterialTheme.typography.labelMedium,
                                            fontWeight = FontWeight.Bold
                                        )
                                        resolvedVerses.forEach { v ->
                                            Text(
                                                text = "• ﴿${v.uthmaniText}﴾ [سورة ${v.surahNameAr}: ${v.ayahNumber.toArabicDigits(useEasternDigits)}]",
                                                fontFamily = AmiriFontFamily,
                                                fontSize = 18.sp,
                                                modifier = Modifier
                                                    .clickable {
                                                        onSelectSurah(v.surahNumber)
                                                        onDismiss()
                                                    }
                                                    .padding(vertical = 2.dp)
                                            )
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        text = "💡 وجه التناسب والمقارنة: ${theme.comparativeInsightAr}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                    Text(
                                        text = "المصدر: ${theme.sourceCitation}",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }

                    1 -> {
                        items(storiesAtlas, key = { it.id }) { story ->
                            Card(
                                shape = RoundedCornerShape(18.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                                border = BorderStroke(1.2.dp, IlluminatedGold),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(14.dp)) {
                                    Row(
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Surface(
                                            color = RoyalEmerald,
                                            shape = RoundedCornerShape(8.dp)
                                        ) {
                                            Text(
                                                text = "سورة ${story.primarySurahNameAr} (${story.revelationPlaceAr}) • ${story.ayahRangeAr}",
                                                style = MaterialTheme.typography.labelSmall,
                                                color = IlluminatedGoldBright,
                                                fontWeight = FontWeight.Bold,
                                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                            )
                                        }
                                        TextButton(
                                            onClick = {
                                                onSelectSurah(story.surahNumber)
                                                onDismiss()
                                            }
                                        ) {
                                            Text("الانتقال للسورة ←")
                                        }
                                    }

                                    Text(
                                        text = story.storyTitleAr,
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = "الشخصيات: ${story.centralFiguresAr} | المكان التاريخي: ${story.historicalLocationAr}",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        text = "🎯 المقصد العقدي والتربوي: ${story.centralMaqsadAr}",
                                        style = MaterialTheme.typography.bodySmall,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                    Spacer(modifier = Modifier.height(6.dp))
                                    story.pedagogicalLessons.forEach { lesson ->
                                        Text(
                                            text = "• $lesson",
                                            style = MaterialTheme.typography.bodySmall
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        text = "المصدر: ${story.sourceCitation}",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }

                    2 -> {
                        item {
                            OutlinedTextField(
                                value = rootSearchQuery,
                                onValueChange = { rootSearchQuery = it },
                                label = { Text("ابحث بالجذر الثلاثي (مثل: رحم، عبد، صمد، فلق، قدر)...") },
                                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                                singleLine = true,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .testTag("morphological_root_search_input")
                            )
                        }

                        items(filteredRoots, key = { it.rootId }) { rootEntry ->
                            Card(
                                shape = RoundedCornerShape(18.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                                border = BorderStroke(1.2.dp, IlluminatedGold),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(14.dp)) {
                                    Row(
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Surface(
                                            color = RoyalEmerald,
                                            shape = RoundedCornerShape(10.dp),
                                            border = BorderStroke(1.dp, IlluminatedGold)
                                        ) {
                                            Text(
                                                text = "الجذر الصرفي: [ ${rootEntry.rootSpacedAr} ]",
                                                style = MaterialTheme.typography.titleSmall,
                                                fontWeight = FontWeight.Bold,
                                                color = IlluminatedGoldBright,
                                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 5.dp)
                                            )
                                        }
                                        ContentAttributionBadge(attribution = ContentAttributionType.AUTHENTIC_QUOTE)
                                    }

                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = "أصل المادة عند الراغب الأصفهاني: ${rootEntry.raghibCoreMeaningAr}",
                                        style = MaterialTheme.typography.bodyMedium
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = "تصريفات الجذر واشتقاقاته في سور القرآن:",
                                        style = MaterialTheme.typography.labelLarge,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                    rootEntry.derivativesWithAyahs.forEach { (word, refSnippet) ->
                                        Surface(
                                            color = MaterialTheme.colorScheme.surface,
                                            shape = RoundedCornerShape(8.dp),
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .padding(vertical = 3.dp)
                                        ) {
                                            Text(
                                                text = "🔹 $word : $refSnippet",
                                                style = MaterialTheme.typography.bodySmall,
                                                modifier = Modifier.padding(8.dp)
                                            )
                                        }
                                    }
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = "المصدر: ${rootEntry.sourceCitation}",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

/**
 * Phase 4: Comprehensive Simulation Exam Dialog for the Entire Quranic Sciences Encyclopedia.
 */
@Composable
fun ComprehensiveMasteryExamDialog(
    questions: List<QuizQuestion> = ItqanPhase4SeedData.comprehensiveEncyclopediaExamQuestions,
    useEasternDigits: Boolean = true,
    onDismiss: () -> Unit,
    onSubmitComprehensiveScore: (Int) -> Unit
) {
    val selectedMap = remember { mutableStateMapOf<String, Int>() }
    var submitted by remember { mutableStateOf(false) }
    var finalScorePct by remember { mutableIntStateOf(0) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.WorkspacePremium,
                    contentDescription = null,
                    tint = IlluminatedGold
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "اختبار المحاكاة الشامل لموسوعة علوم القرآن",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }
        },
        text = {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.height(410.dp)
            ) {
                items(questions, key = { it.id }) { q ->
                    Column {
                        Text(
                            text = q.questionText,
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold
                        )
                        q.options.forEachIndexed { idx, opt ->
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { selectedMap[q.id] = idx }
                                    .padding(vertical = 2.dp)
                            ) {
                                RadioButton(
                                    selected = selectedMap[q.id] == idx,
                                    onClick = { selectedMap[q.id] = idx }
                                )
                                Text(text = opt, style = MaterialTheme.typography.bodySmall)
                            }
                        }
                        if (submitted) {
                            Text(
                                text = "التعليل: ${q.explanation} (${q.sourceCitation})",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                        HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp))
                    }
                }

                if (submitted) {
                    item {
                        Surface(
                            color = RoyalEmerald,
                            shape = RoundedCornerShape(12.dp),
                            border = BorderStroke(1.dp, IlluminatedGold),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(
                                    text = "درجة الاختبار الشامل: ${finalScorePct.toArabicDigits(useEasternDigits)}%",
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = IlluminatedGoldBright
                                )
                                Text(
                                    text = if (finalScorePct >= 80) "مبارك! تم إصدار شهادة إتمام دراسة موسوعة علوم القرآن الشاملة في تبويب الشهادات."
                                    else "يلزم تحقيق ٨٠٪ فأعلى لإصدار الشهادة الشاملة.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = Color.White
                                )
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val total = questions.size.coerceAtLeast(1)
                    val correct = questions.count { selectedMap[it.id] == it.correctIndex }
                    val pct = ((correct.toDouble() / total.toDouble()) * 100.0).roundToInt()
                    finalScorePct = pct
                    submitted = true
                    onSubmitComprehensiveScore(pct)
                },
                colors = ButtonDefaults.buttonColors(containerColor = RoyalEmerald)
            ) {
                Text("تصحيح الاختبار الشامل واعتماد الشهادة")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("إغلاق")
            }
        }
    )
}

/**
 * Phase 4: Full Data Backup Export & Import + Formatted Student Portfolio Card.
 */
@Composable
fun BackupExportAndImportCard(
    studentName: String,
    streakDays: Int,
    allCachedAyahs: List<AyahEntity>,
    fsrsReviews: List<FsrsReviewEntity>,
    mistakeLogs: List<MistakeLogEntity>,
    tadabburJournals: List<TadabburJournalEntity>,
    bookmarks: List<BookmarkNoteEntity>,
    certificates: List<CertificateEntity>,
    useEasternDigits: Boolean = true,
    onRestoreBackupSnapshot: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    var showBackupJsonDialog by remember { mutableStateOf(false) }

    val memorizedVerses = remember(allCachedAyahs) {
        allCachedAyahs.filter { it.isMemorized || it.recitationCount > 0 }
    }

    val backupJson = remember(
        studentName,
        streakDays,
        memorizedVerses,
        fsrsReviews,
        mistakeLogs,
        tadabburJournals,
        bookmarks,
        certificates
    ) {
        ItqanPhase4SeedData.buildFullBackupJson(
            studentName = studentName,
            streakDays = streakDays,
            memorizedVerses = memorizedVerses,
            fsrsReviews = fsrsReviews,
            mistakeLogs = mistakeLogs,
            tadabburJournals = tadabburJournals,
            bookmarks = bookmarks,
            certificates = certificates
        )
    }

    val formattedPortfolio = remember(
        studentName,
        streakDays,
        memorizedVerses,
        fsrsReviews,
        tadabburJournals,
        certificates
    ) {
        ItqanPhase4SeedData.buildFormattedPortfolioText(
            studentName = studentName,
            streakDays = streakDays,
            memorizedVersesCount = memorizedVerses.size,
            fsrsReviews = fsrsReviews,
            tadabburJournals = tadabburJournals,
            certificates = certificates
        )
    }

    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        border = BorderStroke(1.2.dp, IlluminatedGold),
        modifier = modifier
            .fillMaxWidth()
            .testTag("backup_export_import_card")
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "النسخ الاحتياطي الكامل وتصدير محفظة الحفظ والتدبر",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "تصدير واستيراد نسخة احتياطية كاملة (JSON) أو وثيقة نصية منسقة تشمل: الآيات المتقنة (${memorizedVerses.size.toArabicDigits(useEasternDigits)})، جدول مراجعات FSRS (${fsrsReviews.size.toArabicDigits(useEasternDigits)})، دفتر التدبرات (${tadabburJournals.size.toArabicDigits(useEasternDigits)})، والشهادات (${certificates.size.toArabicDigits(useEasternDigits)}).",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Button(
                    onClick = {
                        val sendIntent = Intent(Intent.ACTION_SEND).apply {
                            type = "text/plain"
                            putExtra(Intent.EXTRA_SUBJECT, "محفظة الحفظ والتدبر — إتقان")
                            putExtra(Intent.EXTRA_TEXT, formattedPortfolio)
                        }
                        val chooser = Intent.createChooser(sendIntent, "تصدير ومشاركة سجل الحفظ والتدبر")
                        chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        runCatching { context.startActivity(chooser) }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = RoyalEmerald),
                    modifier = Modifier
                        .weight(1f)
                        .testTag("export_portfolio_button")
                ) {
                    Icon(
                        imageVector = Icons.Default.Share,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("تصدير السجل المنسق")
                }

                OutlinedButton(
                    onClick = { showBackupJsonDialog = true },
                    modifier = Modifier
                        .weight(1f)
                        .testTag("open_backup_json_dialog_button")
                ) {
                    Icon(
                        imageVector = Icons.Default.CloudDownload,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("نسخة احتياطية JSON")
                }
            }
        }
    }

    if (showBackupJsonDialog) {
        AlertDialog(
            onDismissRequest = { showBackupJsonDialog = false },
            title = {
                Text(
                    text = "تصدير واستيراد النسخة الاحتياطية الكاملة (JSON)",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = "معاينة ملف النسخة الاحتياطية المشفرة محلياً:",
                        style = MaterialTheme.typography.bodySmall
                    )
                    Surface(
                        color = MaterialTheme.colorScheme.surface,
                        shape = RoundedCornerShape(10.dp),
                        border = BorderStroke(1.dp, IlluminatedGold.copy(alpha = 0.5f)),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(220.dp)
                    ) {
                        LazyColumn(contentPadding = PaddingValues(10.dp)) {
                            item {
                                Text(
                                    text = backupJson,
                                    style = MaterialTheme.typography.bodySmall
                                )
                            }
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        onRestoreBackupSnapshot()
                        showBackupJsonDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = RoyalEmerald)
                ) {
                    Icon(
                        imageVector = Icons.Default.CloudUpload,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("استعادة وتحديث النسخة المحلية")
                }
            },
            dismissButton = {
                TextButton(onClick = { showBackupJsonDialog = false }) {
                    Text("إغلاق")
                }
            }
        )
    }
}
