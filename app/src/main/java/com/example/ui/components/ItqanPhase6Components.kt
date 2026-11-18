package com.example.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.ScrollableTabRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.local.ItqanPhase6SeedData
import com.example.domain.model.ContentAttributionType
import com.example.ui.theme.AmiriFontFamily
import com.example.ui.theme.IlluminatedGold
import com.example.ui.theme.RoyalEmerald
import com.example.ui.theme.toArabicDigits
import kotlinx.coroutines.delay

/**
 * Phase 6 Interactive Modal Sheet:
 * 1. Al-Wujuh wa Al-Naza'ir (علم الوجوه والنظائر في القرآن الكريم).
 * 2. Rhetorical & Linguistic Distinctions (الفروق اللغوية ولطائف البيان القرآني).
 * 3. Interactive Mutashabihat Hifz Drill & Quiz (مختبر ضبط المتشابهات اللفظية).
 * 4. Breath Control & Long-Ayah Endurance Trainer (مدرب ضبط النَّفَس والوقفات في الآيات الطوال).
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BalaghahWujuhAndMutashabihatLabSheet(
    useEasternDigits: Boolean,
    onSelectSurah: (Int) -> Unit,
    onDismiss: () -> Unit
) {
    var selectedTab by remember { mutableIntStateOf(0) }
    var selectedWujuhId by remember { mutableStateOf(ItqanPhase6SeedData.wujuhWaNazairCatalog.first().id) }
    val selectedDrillAnswers = remember { mutableStateMapOf<String, Int>() }

    // Breath pacing timer state for Tab 3
    var activeBreathDrillId by remember { mutableStateOf<String?>(null) }
    var elapsedBreathSeconds by remember { mutableIntStateOf(0) }

    LaunchedEffect(activeBreathDrillId) {
        val currentId = activeBreathDrillId ?: return@LaunchedEffect
        val targetSec = ItqanPhase6SeedData.breathAndEnduranceDrills
            .find { it.id == currentId }?.targetBreathSeconds ?: 16
        elapsedBreathSeconds = 0
        while (activeBreathDrillId == currentId && elapsedBreathSeconds < targetSec) {
            delay(1000L)
            elapsedBreathSeconds += 1
        }
        if (elapsedBreathSeconds >= targetSec) {
            activeBreathDrillId = null
        }
    }

    val tabs = listOf(
        "الوجوه والنظائر",
        "الفروق اللغوية والبيان",
        "مختبر المتشابهات التفاعلي",
        "مدرب النَّفَس والآيات الطوال"
    )

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = MaterialTheme.colorScheme.surface
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(min = 440.dp, max = 680.dp)
                .padding(horizontal = 16.dp, vertical = 8.dp)
                .testTag("wujuh_furuk_mutashabihat_sheet")
        ) {
            Row(
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.AutoAwesome,
                        contentDescription = null,
                        tint = IlluminatedGold
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "أطلس الوجوه والنظائر والفروق ومختبر المتشابهات",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
                TextButton(onClick = onDismiss) {
                    Text("إغلاق")
                }
            }

            ScrollableTabRow(
                selectedTabIndex = selectedTab,
                edgePadding = 0.dp
            ) {
                tabs.forEachIndexed { index, title ->
                    Tab(
                        selected = selectedTab == index,
                        onClick = { selectedTab = index },
                        text = { Text(title, style = MaterialTheme.typography.labelMedium) }
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            when (selectedTab) {
                // TAB 0: AL-WUJUH WA AL-NAZA'IR
                0 -> {
                    val entries = ItqanPhase6SeedData.wujuhWaNazairCatalog
                    val currentEntry = entries.find { it.id == selectedWujuhId } ?: entries.first()

                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        items(entries, key = { it.id }) { entry ->
                            FilterChip(
                                selected = entry.id == currentEntry.id,
                                onClick = { selectedWujuhId = entry.id },
                                label = {
                                    Text(
                                        text = "${entry.quranicTermAr} (${entry.meanings.size.toArabicDigits(useEasternDigits)} وجوه)",
                                        fontWeight = if (entry.id == currentEntry.id) FontWeight.Bold else FontWeight.Normal
                                    )
                                }
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                        contentPadding = PaddingValues(bottom = 24.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        item {
                            Card(
                                shape = RoundedCornerShape(16.dp),
                                colors = CardDefaults.cardColors(
                                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                                ),
                                border = BorderStroke(1.dp, IlluminatedGold.copy(alpha = 0.6f)),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(14.dp)) {
                                    Row(
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Text(
                                            text = "لفظ «${currentEntry.quranicTermAr}» — الجذر: (${currentEntry.rootAr})",
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.Bold,
                                            color = MaterialTheme.colorScheme.primary
                                        )
                                        ContentAttributionBadge(attribution = ContentAttributionType.AUTHENTIC_QUOTE)
                                    }
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        text = currentEntry.summaryAr,
                                        style = MaterialTheme.typography.bodyMedium
                                    )
                                }
                            }
                        }

                        items(currentEntry.meanings) { witness ->
                            Card(
                                shape = RoundedCornerShape(14.dp),
                                border = BorderStroke(1.dp, IlluminatedGold.copy(alpha = 0.4f)),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    Text(
                                        text = witness.meaningTitleAr,
                                        style = MaterialTheme.typography.titleSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = RoyalEmerald
                                    )
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Surface(
                                        color = MaterialTheme.colorScheme.surfaceVariant,
                                        shape = RoundedCornerShape(10.dp),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Text(
                                            text = "﴿ ${witness.uthmaniWitnessAr} ﴾",
                                            fontFamily = AmiriFontFamily,
                                            fontSize = 19.sp,
                                            modifier = Modifier.padding(10.dp)
                                        )
                                    }
                                    Row(
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(top = 4.dp)
                                    ) {
                                        Text(
                                            text = "الشاهد: [${witness.surahAndAyahRefAr}]",
                                            style = MaterialTheme.typography.labelMedium,
                                            color = IlluminatedGold
                                        )
                                        TextButton(onClick = { onSelectSurah(witness.targetSurahNumber) }) {
                                            Icon(
                                                imageVector = Icons.Default.MenuBook,
                                                contentDescription = null
                                            )
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("افتح السورة")
                                        }
                                    }
                                }
                            }
                        }

                        item {
                            Text(
                                text = "المصدر المعتمد: ${currentEntry.sourceCitation}",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }

                // TAB 1: LINGUISTIC FURUK & RHETORICAL SECRETS
                1 -> {
                    val furukList = ItqanPhase6SeedData.linguisticFurukCatalog
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                        contentPadding = PaddingValues(bottom = 24.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        items(furukList, key = { it.id }) { item ->
                            Card(
                                shape = RoundedCornerShape(16.dp),
                                border = BorderStroke(1.dp, IlluminatedGold.copy(alpha = 0.55f)),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(14.dp)) {
                                    Row(
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Text(
                                            text = item.pairTitleAr,
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.Bold,
                                            color = MaterialTheme.colorScheme.primary
                                        )
                                        ContentAttributionBadge(attribution = ContentAttributionType.AUTHENTIC_QUOTE)
                                    }
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = "• ${item.firstTermAr}: ${item.firstTermMeaningAndWitnessAr}",
                                        style = MaterialTheme.typography.bodyMedium
                                    )
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        text = "• ${item.secondTermAr}: ${item.secondTermMeaningAndWitnessAr}",
                                        style = MaterialTheme.typography.bodyMedium
                                    )
                                    HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
                                    Text(
                                        text = "✨ اللطيفة البيانية: ${item.rhetoricalSecretAr}",
                                        style = MaterialTheme.typography.bodySmall,
                                        fontWeight = FontWeight.SemiBold,
                                        color = RoyalEmerald
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = "المصدر: ${item.sourceCitation}",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }
                }

                // TAB 2: INTERACTIVE MUTASHABIHAT DRILL & QUIZ
                2 -> {
                    val drills = ItqanPhase6SeedData.mutashabihatDrillExercises
                    val answeredCount = selectedDrillAnswers.size
                    val correctCount = drills.count { drill ->
                        selectedDrillAnswers[drill.id] == drill.correctOptionIndex
                    }

                    Row(
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 8.dp)
                    ) {
                        Text(
                            text = "نتيجة التدريب: ${correctCount.toArabicDigits(useEasternDigits)} / ${drills.size.toArabicDigits(useEasternDigits)} (أجبت على ${answeredCount.toArabicDigits(useEasternDigits)})",
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                        if (answeredCount > 0) {
                            TextButton(onClick = { selectedDrillAnswers.clear() }) {
                                Icon(imageVector = Icons.Default.Refresh, contentDescription = null)
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("إعادة التدريب")
                            }
                        }
                    }

                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                        contentPadding = PaddingValues(bottom = 24.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        items(drills, key = { it.id }) { drill ->
                            val chosenIndex = selectedDrillAnswers[drill.id]
                            Card(
                                shape = RoundedCornerShape(16.dp),
                                border = BorderStroke(1.dp, IlluminatedGold.copy(alpha = 0.5f)),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(14.dp)) {
                                    Text(
                                        text = drill.categoryAr,
                                        style = MaterialTheme.typography.labelMedium,
                                        color = IlluminatedGold
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = drill.questionPromptAr,
                                        style = MaterialTheme.typography.titleSmall,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Surface(
                                        color = MaterialTheme.colorScheme.surfaceVariant,
                                        shape = RoundedCornerShape(10.dp),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Column(modifier = Modifier.padding(10.dp)) {
                                            Text(text = "١) ${drill.firstAyahSnippetAr}", style = MaterialTheme.typography.bodySmall)
                                            Spacer(modifier = Modifier.height(4.dp))
                                            Text(text = "٢) ${drill.secondAyahSnippetAr}", style = MaterialTheme.typography.bodySmall)
                                        }
                                    }
                                    Spacer(modifier = Modifier.height(8.dp))

                                    drill.options.forEachIndexed { idx, optText ->
                                        val isSelected = chosenIndex == idx
                                        val isCorrect = idx == drill.correctOptionIndex
                                        OutlinedButton(
                                            onClick = { selectedDrillAnswers[drill.id] = idx },
                                            border = BorderStroke(
                                                width = if (isSelected) 2.dp else 1.dp,
                                                color = when {
                                                    chosenIndex == null -> IlluminatedGold.copy(alpha = 0.5f)
                                                    isCorrect -> RoyalEmerald
                                                    isSelected -> MaterialTheme.colorScheme.error
                                                    else -> IlluminatedGold.copy(alpha = 0.3f)
                                                }
                                            ),
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .padding(vertical = 2.dp)
                                        ) {
                                            Row(
                                                horizontalArrangement = Arrangement.SpaceBetween,
                                                verticalAlignment = Alignment.CenterVertically,
                                                modifier = Modifier.fillMaxWidth()
                                            ) {
                                                Text(
                                                    text = optText,
                                                    style = MaterialTheme.typography.bodySmall,
                                                    modifier = Modifier.weight(1f)
                                                )
                                                if (chosenIndex != null && isCorrect) {
                                                    Icon(
                                                        imageVector = Icons.Default.CheckCircle,
                                                        contentDescription = null,
                                                        tint = RoyalEmerald
                                                    )
                                                }
                                            }
                                        }
                                    }

                                    if (chosenIndex != null) {
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Text(
                                            text = "🔑 ${drill.mnemonicAnchorRuleAr}",
                                            style = MaterialTheme.typography.bodySmall,
                                            fontWeight = FontWeight.SemiBold,
                                            color = RoyalEmerald
                                        )
                                        Text(
                                            text = "المصدر: ${drill.sourceCitation}",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                // TAB 3: BREATH CONTROL & LONG-AYAH ENDURANCE TRAINER
                3 -> {
                    val breathDrills = ItqanPhase6SeedData.breathAndEnduranceDrills
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                        contentPadding = PaddingValues(bottom = 24.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        items(breathDrills, key = { it.id }) { drill ->
                            val isRunning = activeBreathDrillId == drill.id
                            val progress = if (isRunning && drill.targetBreathSeconds > 0) {
                                (elapsedBreathSeconds.toFloat() / drill.targetBreathSeconds.toFloat()).coerceIn(0f, 1f)
                            } else {
                                0f
                            }

                            Card(
                                shape = RoundedCornerShape(16.dp),
                                border = BorderStroke(1.dp, IlluminatedGold.copy(alpha = 0.55f)),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(14.dp)) {
                                    Row(
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(
                                                text = drill.titleAr,
                                                style = MaterialTheme.typography.titleSmall,
                                                fontWeight = FontWeight.Bold,
                                                color = MaterialTheme.colorScheme.primary
                                            )
                                            Text(
                                                text = "${drill.surahAndAyahRefAr} • زمن النَّفَس المقترح: ${drill.targetBreathSeconds.toArabicDigits(useEasternDigits)} ثانية",
                                                style = MaterialTheme.typography.labelSmall,
                                                color = IlluminatedGold
                                            )
                                        }
                                        Button(
                                            onClick = {
                                                activeBreathDrillId = if (isRunning) null else drill.id
                                            },
                                            colors = ButtonDefaults.buttonColors(
                                                containerColor = if (isRunning) MaterialTheme.colorScheme.error else RoyalEmerald
                                            )
                                        ) {
                                            Icon(
                                                imageVector = if (isRunning) Icons.Default.Stop else Icons.Default.PlayArrow,
                                                contentDescription = null
                                            )
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text(
                                                if (isRunning) {
                                                    "إيقاف (${elapsedBreathSeconds.toArabicDigits(useEasternDigits)} ث)"
                                                } else {
                                                    "بدء مؤقت النَّفَس"
                                                }
                                            )
                                        }
                                    }

                                    if (isRunning) {
                                        Spacer(modifier = Modifier.height(8.dp))
                                        LinearProgressIndicator(
                                            progress = { progress },
                                            color = IlluminatedGold,
                                            modifier = Modifier.fillMaxWidth()
                                        )
                                    }

                                    Spacer(modifier = Modifier.height(8.dp))
                                    drill.segmentedStopsAr.forEach { stopStep ->
                                        Text(
                                            text = "• $stopStep",
                                            style = MaterialTheme.typography.bodySmall,
                                            modifier = Modifier.padding(vertical = 2.dp)
                                        )
                                    }
                                    HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
                                    Text(
                                        text = "🔄 قاعدة العَوْد بعد انقطاع النَّفَس: ${drill.resumptionRuleAfterBreathStopAr}",
                                        style = MaterialTheme.typography.bodySmall,
                                        fontWeight = FontWeight.SemiBold,
                                        color = RoyalEmerald
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = "🫁 نصيحة الأداء الصوتي: ${drill.vocalTipAr}",
                                        style = MaterialTheme.typography.bodySmall
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = "المصدر: ${drill.sourceCitation}",
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
