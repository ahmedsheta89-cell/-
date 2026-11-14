package com.example.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoStories
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ColorLens
import androidx.compose.material.icons.filled.GridView
import androidx.compose.material.icons.filled.Quiz
import androidx.compose.material.icons.filled.SelfImprovement
import androidx.compose.material.icons.filled.Timer
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
import androidx.compose.material3.Surface
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.local.AyahEntity
import com.example.data.local.FsrsReviewEntity
import com.example.data.local.ItqanPhase3SeedData
import com.example.data.local.MistakeLogEntity
import com.example.data.local.TadabburJournalEntity
import com.example.domain.model.QiraatNarratorColorProfile
import com.example.domain.model.QuizQuestion
import com.example.domain.model.SurahHeatmapCell
import com.example.domain.model.SurahMetadata
import com.example.ui.theme.AmiriFontFamily
import com.example.ui.theme.IlluminatedGold
import com.example.ui.theme.IlluminatedGoldBright
import com.example.ui.theme.RoyalEmerald
import com.example.ui.theme.toArabicDigits
import kotlin.math.roundToInt

/**
 * Phase 3: Mushaf Mastery Heatmap Card (الخريطة الحرارية لإتقان سور وأجزاء المصحف).
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun MushafMasteryHeatmapCard(
    surahCatalog: List<SurahMetadata>,
    cachedAyahs: List<AyahEntity>,
    fsrsReviews: List<FsrsReviewEntity>,
    mistakeLogs: List<MistakeLogEntity>,
    useEasternDigits: Boolean,
    onSelectSurah: (Int) -> Unit,
    onOpenKhalwahMode: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    val heatmapCells = remember(surahCatalog, cachedAyahs, fsrsReviews, mistakeLogs) {
        ItqanPhase3SeedData.buildSurahMasteryHeatmap(
            surahCatalog = surahCatalog,
            cachedAyahs = cachedAyahs,
            fsrsReviews = fsrsReviews,
            mistakeLogs = mistakeLogs
        )
    }

    var selectedCell by remember(heatmapCells) {
        mutableStateOf<SurahHeatmapCell?>(heatmapCells.firstOrNull())
    }

    val masteredCount = heatmapCells.count { it.masteryStatus == 3 }
    val inProgressCount = heatmapCells.count { it.masteryStatus == 2 }
    val urgentReviewCount = heatmapCells.count { it.masteryStatus == 1 }

    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        border = BorderStroke(1.2.dp, IlluminatedGold.copy(alpha = 0.7f)),
        modifier = modifier
            .fillMaxWidth()
            .testTag("mushaf_mastery_heatmap_card")
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.GridView,
                        contentDescription = null,
                        tint = IlluminatedGold
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Column {
                        Text(
                            text = "الخريطة الحرارية لإتقان سور المصحف",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "متقن: ${masteredCount.toArabicDigits(useEasternDigits)} • قيد التثبيت: ${inProgressCount.toArabicDigits(useEasternDigits)} • مراجعة عاجلة: ${urgentReviewCount.toArabicDigits(useEasternDigits)}",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                OutlinedButton(
                    onClick = onOpenKhalwahMode,
                    modifier = Modifier.testTag("open_khalwah_tadabbur_button")
                ) {
                    Icon(
                        imageVector = Icons.Default.SelfImprovement,
                        contentDescription = null,
                        tint = IlluminatedGold,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("خلوة التدبر", style = MaterialTheme.typography.labelMedium)
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Heatmap Grid Cells
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                heatmapCells.forEach { cell ->
                    val cellBgColor = when (cell.masteryStatus) {
                        3 -> RoyalEmerald
                        2 -> IlluminatedGold.copy(alpha = 0.85f)
                        1 -> Color(0xFFC62828)
                        else -> MaterialTheme.colorScheme.surface
                    }
                    val cellTextColor = when (cell.masteryStatus) {
                        3, 1 -> Color.White
                        2 -> Color(0xFF06231B)
                        else -> MaterialTheme.colorScheme.onSurfaceVariant
                    }
                    val isSelected = selectedCell?.surahNumber == cell.surahNumber

                    Surface(
                        color = cellBgColor,
                        shape = RoundedCornerShape(10.dp),
                        border = BorderStroke(
                            width = if (isSelected) 2.dp else 1.dp,
                            color = if (isSelected) IlluminatedGoldBright else MaterialTheme.colorScheme.outline.copy(alpha = 0.4f)
                        ),
                        modifier = Modifier
                            .clickable { selectedCell = cell }
                            .testTag("heatmap_cell_${cell.surahNumber}")
                    ) {
                        Text(
                            text = "${cell.surahNumber.toArabicDigits(useEasternDigits)}. ${cell.surahNameAr}",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = cellTextColor,
                            modifier = Modifier.padding(horizontal = 9.dp, vertical = 6.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Legend Row
            Row(
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                HeatmapLegendDot(color = RoyalEmerald, label = "إتقان راسخ")
                HeatmapLegendDot(color = IlluminatedGold, label = "قيد التثبيت")
                HeatmapLegendDot(color = Color(0xFFC62828), label = "أخطاء متكررة")
                HeatmapLegendDot(color = MaterialTheme.colorScheme.outline, label = "لم يبدأ")
            }

            selectedCell?.let { cell ->
                Spacer(modifier = Modifier.height(10.dp))
                Surface(
                    color = MaterialTheme.colorScheme.surface,
                    shape = RoundedCornerShape(12.dp),
                    border = BorderStroke(1.dp, IlluminatedGold.copy(alpha = 0.4f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(12.dp)
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "سورة ${cell.surahNameAr} (الجزء ${cell.juzNumber.toArabicDigits(useEasternDigits)})",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "الاستقرار: ${cell.stabilityDays.roundToInt().toArabicDigits(useEasternDigits)} يوم • الدقة: ${cell.accuracyPercent.toArabicDigits(useEasternDigits)}% • تنبيهات المخارج: ${cell.activeMistakesCount.toArabicDigits(useEasternDigits)}",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        TextButton(onClick = { onSelectSurah(cell.surahNumber) }) {
                            Text("فتح السورة")
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun HeatmapLegendDot(color: Color, label: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(
            modifier = Modifier
                .size(10.dp)
                .clip(CircleShape)
                .background(color)
        )
        Spacer(modifier = Modifier.width(4.dp))
        Text(text = label, style = MaterialTheme.typography.labelSmall)
    }
}

/**
 * Phase 3: Colored Qira'at Mushaf Narrator Ribbon & Methodology Card.
 */
@Composable
fun ColoredQiraatMushafRibbon(
    profiles: List<QiraatNarratorColorProfile> = ItqanPhase3SeedData.qiraatNarratorProfiles,
    selectedNarratorId: String,
    onSelectNarrator: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val activeProfile = remember(selectedNarratorId, profiles) {
        profiles.find { it.narratorId == selectedNarratorId } ?: profiles.first()
    }

    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        border = BorderStroke(1.dp, IlluminatedGold.copy(alpha = 0.65f)),
        modifier = modifier
            .fillMaxWidth()
            .testTag("colored_qiraat_mushaf_ribbon")
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.ColorLens,
                        contentDescription = null,
                        tint = IlluminatedGold,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "مصحف القراءات الملون ومقارنة الروايات المتواترة",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold
                    )
                }
                Text(
                    text = activeProfile.shortLabelAr,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.height(6.dp))

            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(profiles, key = { it.narratorId }) { prof ->
                    FilterChip(
                        selected = prof.narratorId == selectedNarratorId,
                        onClick = { onSelectNarrator(prof.narratorId) },
                        label = { Text(prof.shortLabelAr) },
                        modifier = Modifier.testTag("qiraat_narrator_chip_${prof.narratorId}")
                    )
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            Surface(
                color = Color(activeProfile.badgeColorHex).copy(alpha = 0.12f),
                shape = RoundedCornerShape(10.dp),
                border = BorderStroke(1.dp, Color(activeProfile.badgeColorHex).copy(alpha = 0.5f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(10.dp)) {
                    Text(
                        text = "${activeProfile.imamAndRawiAr} (${activeProfile.tariqAr})",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = "أصول الرواية: ${activeProfile.usoolMethodologyAr}",
                        style = MaterialTheme.typography.bodySmall
                    )
                    Text(
                        text = "فرش تطبيقي: ${activeProfile.keyExampleDifferenceAr}",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

/**
 * Phase 3: Quranic Khalwah & Deep-Focus Tadabbur Mode Sheet with Documented Personal Journal.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QuranicKhalwahAndTadabburSheet(
    currentAyah: AyahEntity?,
    tadabburJournals: List<TadabburJournalEntity>,
    useEasternDigits: Boolean,
    onSaveJournalEntry: (Int, String, Int, String, String, String, String, Int) -> Unit,
    onDismiss: () -> Unit
) {
    val targetSurahNumber = currentAyah?.surahNumber ?: 1
    val targetSurahName = currentAyah?.surahNameAr ?: "الفاتحة"
    val targetAyahNumber = currentAyah?.ayahNumber ?: 5
    val targetUthmani = currentAyah?.uthmaniText ?: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ"
    val defaultTafsir = currentAyah?.tafsirSaadi
        ?: "إخلاص العبادة لله وحده والاستعانة به في جميع الأمور."

    var selectedDurationMin by remember { mutableIntStateOf(15) }
    var isTimerActive by remember { mutableStateOf(false) }
    var hidayahInput by remember { mutableStateOf("") }
    var practicalActionInput by remember { mutableStateOf("") }

    ModalBottomSheet(
        onDismissRequest = onDismiss
    ) {
        LazyColumn(
            contentPadding = PaddingValues(horizontal = 18.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
            modifier = Modifier
                .fillMaxWidth()
                .testTag("quranic_khalwah_tadabbur_sheet")
        ) {
            item {
                Card(
                    shape = RoundedCornerShape(22.dp),
                    colors = CardDefaults.cardColors(containerColor = RoyalEmerald),
                    border = BorderStroke(1.5.dp, IlluminatedGold),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(18.dp)) {
                        Row(
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.SelfImprovement,
                                    contentDescription = null,
                                    tint = IlluminatedGoldBright
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "خلوة التدبر القرآني والتركيز العميق",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = IlluminatedGoldBright
                                )
                            }
                            Surface(
                                color = IlluminatedGold.copy(alpha = 0.25f),
                                shape = RoundedCornerShape(50),
                                border = BorderStroke(1.dp, IlluminatedGold)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier
                                        .clickable { isTimerActive = !isTimerActive }
                                        .padding(horizontal = 10.dp, vertical = 4.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Timer,
                                        contentDescription = null,
                                        tint = IlluminatedGoldBright,
                                        modifier = Modifier.size(15.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = if (isTimerActive) "جلسة خلوة نشطة (${selectedDurationMin.toArabicDigits(useEasternDigits)} د)"
                                        else "بدء مؤقت الخلوة (${selectedDurationMin.toArabicDigits(useEasternDigits)} د)",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = Color.White
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        Text(
                            text = "﴿ $targetUthmani ﴾",
                            fontFamily = AmiriFontFamily,
                            fontSize = 24.sp,
                            lineHeight = 38.sp,
                            color = Color.White
                        )
                        Text(
                            text = "[سورة $targetSurahName — الآية ${targetAyahNumber.toArabicDigits(useEasternDigits)}]",
                            style = MaterialTheme.typography.labelMedium,
                            color = IlluminatedGoldBright
                        )
                    }
                }
            }

            // Guided 3-Step Tadabbur Form
            item {
                Card(
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "منهجية التدبر الثلاثية الموثقة",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "١. المعنى التفسيري المعتمد: $defaultTafsir",
                            style = MaterialTheme.typography.bodySmall
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        OutlinedTextField(
                            value = hidayahInput,
                            onValueChange = { hidayahInput = it },
                            label = { Text("٢. الهداية القرآنية والرسالة الإيمانية للآية") },
                            placeholder = { Text("ما الذي تخاطبني به هذه الآية في إيماني وقلبي؟") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("tadabbur_hidayah_input")
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = practicalActionInput,
                            onValueChange = { practicalActionInput = it },
                            label = { Text("٣. العمل التطبيقي بالآية (خطة عملية)") },
                            placeholder = { Text("كيف سأطبق هذه الآية اليوم في عبادتي وخلقي؟") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("tadabbur_action_input")
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        Button(
                            onClick = {
                                if (hidayahInput.isNotBlank() || practicalActionInput.isNotBlank()) {
                                    onSaveJournalEntry(
                                        targetSurahNumber,
                                        targetSurahName,
                                        targetAyahNumber,
                                        targetUthmani,
                                        defaultTafsir,
                                        hidayahInput,
                                        practicalActionInput,
                                        selectedDurationMin
                                    )
                                    hidayahInput = ""
                                    practicalActionInput = ""
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = RoyalEmerald),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("save_tadabbur_journal_button")
                        ) {
                            Icon(
                                imageVector = Icons.Default.AutoStories,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("توثيق في دفتر التدبرات الشخصي")
                        }
                    }
                }
            }

            // Saved Tadabbur Journal Entries
            item {
                Text(
                    text = "دفتر التدبرات والخلوات القرآنية المحفوظة (${tadabburJournals.size.toArabicDigits(useEasternDigits)})",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold
                )
            }

            items(tadabburJournals, key = { it.journalId }) { entry ->
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(1.dp, IlluminatedGold.copy(alpha = 0.5f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(
                            horizontalArrangement = Arrangement.SpaceBetween,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = "سورة ${entry.surahNameAr} — الآية ${entry.ayahNumber.toArabicDigits(useEasternDigits)}",
                                style = MaterialTheme.typography.labelLarge,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                            Text(
                                text = "خلوة ${entry.khalwahMinutes.toArabicDigits(useEasternDigits)} د",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Text(
                            text = "﴿ ${entry.uthmaniText} ﴾",
                            fontFamily = AmiriFontFamily,
                            fontSize = 19.sp
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "💡 الهداية: ${entry.hidayahInsightAr}",
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = FontWeight.SemiBold
                        )
                        if (entry.practicalActionPlanAr.isNotBlank()) {
                            Text(
                                text = "🌱 العمل التطبيقي: ${entry.practicalActionPlanAr}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                        Text(
                            text = "المصدر: ${entry.sourceCitation}",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }
}

/**
 * Phase 3: Diagnostic Placement Quiz Dialog for Academy Level Assessment.
 */
@Composable
fun DiagnosticPlacementQuizDialog(
    questions: List<QuizQuestion> = ItqanPhase3SeedData.diagnosticPlacementQuestions,
    useEasternDigits: Boolean,
    onDismiss: () -> Unit,
    onSubmitDiagnosticScore: (Int) -> Unit
) {
    val selectedOptions = remember { mutableStateMapOf<String, Int>() }
    var isEvaluated by remember { mutableStateOf(false) }
    var finalPercent by remember { mutableIntStateOf(0) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.Quiz,
                    contentDescription = null,
                    tint = IlluminatedGold
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "الاختبار التشخيصي لتحديد المستوى المنهجي",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }
        },
        text = {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.height(400.dp)
            ) {
                items(questions, key = { it.id }) { q ->
                    Column {
                        Text(
                            text = q.questionText,
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold
                        )
                        q.options.forEachIndexed { idx, optText ->
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { selectedOptions[q.id] = idx }
                                    .padding(vertical = 2.dp)
                            ) {
                                RadioButton(
                                    selected = selectedOptions[q.id] == idx,
                                    onClick = { selectedOptions[q.id] = idx }
                                )
                                Text(text = optText, style = MaterialTheme.typography.bodySmall)
                            }
                        }
                        if (isEvaluated) {
                            Text(
                                text = "الشاهد: ${q.explanation} (${q.sourceCitation})",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                        HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp))
                    }
                }
                if (isEvaluated) {
                    item {
                        Surface(
                            color = RoyalEmerald,
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(
                                    text = "النتيجة التشخيصية: ${finalPercent.toArabicDigits(useEasternDigits)}%",
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = IlluminatedGoldBright
                                )
                                Text(
                                    text = if (finalPercent >= 75) "يُوصى لك بالبدء في المستوى المتقدم ومقارنة القراءات العشر."
                                    else "يُوصى لك بالبدء في المستوى التأسيسي ومختبر مخارج الحروف الـ ١٧.",
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
                    val correct = questions.count { selectedOptions[it.id] == it.correctIndex }
                    val scorePct = ((correct.toDouble() / total.toDouble()) * 100.0).roundToInt()
                    finalPercent = scorePct
                    isEvaluated = true
                    onSubmitDiagnosticScore(scorePct)
                },
                colors = ButtonDefaults.buttonColors(containerColor = RoyalEmerald)
            ) {
                Text("اعتماد التشخيص وتوصية المسار")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("إغلاق")
            }
        }
    )
}
