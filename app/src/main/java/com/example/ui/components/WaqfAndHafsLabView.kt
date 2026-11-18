package com.example.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.RecordVoiceOver
import androidx.compose.material.icons.filled.WorkspacePremium
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Surface
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.local.ItqanPhase4SeedData
import com.example.domain.model.ContentAttributionType
import com.example.domain.model.HafsSpecialPerformanceItem
import com.example.domain.model.SpecializedScienceModule
import com.example.domain.model.WaqfAndIbtidaExample
import com.example.domain.model.WaqfTypeCategory
import com.example.ui.theme.AmiriFontFamily
import com.example.ui.theme.IlluminatedGold
import com.example.ui.theme.IlluminatedGoldBright
import com.example.ui.theme.RoyalEmerald
import com.example.ui.theme.toArabicDigits

@Composable
fun WaqfAndHafsLabView(
    waqfExamples: List<WaqfAndIbtidaExample> = ItqanPhase4SeedData.waqfAndIbtidaExamples,
    hafsSpecialItems: List<HafsSpecialPerformanceItem> = ItqanPhase4SeedData.hafsSpecialPerformanceCatalog,
    specializedModules: List<SpecializedScienceModule> = ItqanPhase4SeedData.specializedScienceModules,
    useEasternDigits: Boolean = true,
    onOpenComprehensiveExam: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    // 0 = مختبر الوقف والابتداء, 1 = السكتات والروم والإشمام لحفص, 2 = الناسخ والمنسوخ وإعراب الجمل
    var activeLabSection by remember { mutableIntStateOf(0) }
    var selectedWaqfCategory by remember { mutableStateOf<WaqfTypeCategory?>(null) }
    val selectedQuizAnswers = remember { mutableStateMapOf<String, Int>() }

    val filteredWaqfExamples = remember(selectedWaqfCategory, waqfExamples) {
        if (selectedWaqfCategory == null) waqfExamples
        else waqfExamples.filter { it.waqfCategory == selectedWaqfCategory }
    }

    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        modifier = modifier
            .fillMaxSize()
            .testTag("waqf_and_hafs_lab_view")
    ) {
        // 1. Header Card + Comprehensive Encyclopedia Exam Button
        item {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = RoyalEmerald),
                border = BorderStroke(1.5.dp, IlluminatedGold),
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
                                text = "مختبر الوقف والابتداء ودقائق الأداء وعلوم القرآن",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = IlluminatedGoldBright
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "«وَبَعْدَ تَجْوِيدِكَ لِلْحُرُوفِ ... لاَبُدَّ مِنْ مَعْرِفَةِ الْوُقُوفِ» — تدريب تطبيقي على الوقف التام والكافي والحسن والقبيح، والسكتات الأربع والروم والإشمام، والناسخ والمنسوخ.",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color(0xFFFAF6EE)
                            )
                        }
                        Button(
                            onClick = onOpenComprehensiveExam,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = IlluminatedGold,
                                contentColor = Color(0xFF06231B)
                            ),
                            modifier = Modifier.testTag("open_comprehensive_exam_button")
                        ) {
                            Icon(
                                imageVector = Icons.Default.WorkspacePremium,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("الاختبار الشامل", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        // 2. Section Selector Chips
        item {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                item {
                    FilterChip(
                        selected = activeLabSection == 0,
                        onClick = { activeLabSection = 0 },
                        label = { Text("الوقف والابتداء وعلامات المصحف") },
                        modifier = Modifier.testTag("lab_section_waqf")
                    )
                }
                item {
                    FilterChip(
                        selected = activeLabSection == 1,
                        onClick = { activeLabSection = 1 },
                        label = { Text("السكتات الأربع والروم والإشمام") },
                        modifier = Modifier.testTag("lab_section_hafs_sakt")
                    )
                }
                item {
                    FilterChip(
                        selected = activeLabSection == 2,
                        onClick = { activeLabSection = 2 },
                        label = { Text("الناسخ والمنسوخ وإعراب الجمل") },
                        modifier = Modifier.testTag("lab_section_naskh_irab")
                    )
                }
            }
        }

        when (activeLabSection) {
            0 -> {
                // Waqf Type Filter Chips
                item {
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        item {
                            FilterChip(
                                selected = selectedWaqfCategory == null,
                                onClick = { selectedWaqfCategory = null },
                                label = { Text("جميع أقسام الوقف") }
                            )
                        }
                        items(WaqfTypeCategory.entries) { cat ->
                            FilterChip(
                                selected = selectedWaqfCategory == cat,
                                onClick = { selectedWaqfCategory = cat },
                                label = { Text("${cat.labelAr} (${cat.mushafSignAr})") }
                            )
                        }
                    }
                }

                items(filteredWaqfExamples, key = { it.id }) { ex ->
                    val chosenOption = selectedQuizAnswers[ex.id]
                    val badgeColor = when (ex.waqfCategory) {
                        WaqfTypeCategory.LAZIM, WaqfTypeCategory.TAM -> RoyalEmerald
                        WaqfTypeCategory.KAFI -> Color(0xFF1565C0)
                        WaqfTypeCategory.HASAN -> Color(0xFFE65100)
                        WaqfTypeCategory.QABIH -> Color(0xFFC62828)
                    }

                    Card(
                        shape = RoundedCornerShape(18.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        border = BorderStroke(1.2.dp, badgeColor.copy(alpha = 0.7f)),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("waqf_example_card_${ex.id}")
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Surface(
                                    color = badgeColor,
                                    shape = RoundedCornerShape(10.dp)
                                ) {
                                    Text(
                                        text = "${ex.waqfCategory.labelAr} • علامة المصحف: (${ex.waqfCategory.mushafSignAr})",
                                        style = MaterialTheme.typography.labelMedium,
                                        color = Color.White,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                    )
                                }
                                Text(
                                    text = "سورة ${ex.surahNameAr}: ${ex.ayahNumber.toArabicDigits(useEasternDigits)}",
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.Bold
                                )
                            }

                            Spacer(modifier = Modifier.height(8.dp))

                            Surface(
                                color = MaterialTheme.colorScheme.surface,
                                shape = RoundedCornerShape(12.dp),
                                border = BorderStroke(1.dp, IlluminatedGold.copy(alpha = 0.45f)),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    Text(
                                        text = "﴿ ${ex.uthmaniWithMarker} ﴾",
                                        fontFamily = AmiriFontFamily,
                                        fontSize = 21.sp,
                                        lineHeight = 34.sp
                                    )
                                    Text(
                                        text = "موضع الاختبار: الوقف على ﴿${ex.stopWordTargetAr}﴾",
                                        style = MaterialTheme.typography.labelMedium,
                                        color = MaterialTheme.colorScheme.primary,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(8.dp))

                            Text(
                                text = "⚖️ حكم الوقف والابتداء: ${ex.ibtidaRuleAr}",
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.SemiBold
                            )
                            Text(
                                text = "🔍 التعليل الإعرابي والمعنوي: ${ex.grammaticalAndSemanticAnalysisAr}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "📜 شاهد الجزرية: «${ex.jazariyyahEvidenceAr}»",
                                fontFamily = AmiriFontFamily,
                                fontSize = 17.sp,
                                color = MaterialTheme.colorScheme.primary
                            )

                            Spacer(modifier = Modifier.height(8.dp))
                            HorizontalDivider()
                            Spacer(modifier = Modifier.height(8.dp))

                            Text(
                                text = "🎯 تدريب تفاعلي: ${ex.interactiveQuestionAr}",
                                style = MaterialTheme.typography.labelLarge,
                                fontWeight = FontWeight.Bold
                            )
                            ex.optionsAr.forEachIndexed { idx, opt ->
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable { selectedQuizAnswers[ex.id] = idx }
                                        .padding(vertical = 2.dp)
                                ) {
                                    RadioButton(
                                        selected = chosenOption == idx,
                                        onClick = { selectedQuizAnswers[ex.id] = idx }
                                    )
                                    Text(text = opt, style = MaterialTheme.typography.bodySmall)
                                }
                            }
                            if (chosenOption != null) {
                                val isCorrect = chosenOption == ex.correctOptionIndex
                                Text(
                                    text = if (isCorrect) "✓ إجابة صحيحة متقنة! أحسنت فقه الوقف والابتداء."
                                    else "✗ الصواب: ${ex.optionsAr[ex.correctOptionIndex]}",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = if (isCorrect) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }
            }

            1 -> {
                // Hafs Special Performance Catalog (4 Obligatory Saktahs, 2 Permissible Saktahs, Rawm & Ishmam, Imalah & Tasheel)
                items(hafsSpecialItems, key = { it.id }) { item ->
                    Card(
                        shape = RoundedCornerShape(18.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        border = BorderStroke(1.2.dp, IlluminatedGold),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("hafs_special_card_${item.id}")
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
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
                                        text = item.categoryAr,
                                        style = MaterialTheme.typography.labelSmall,
                                        color = IlluminatedGoldBright,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                    )
                                }
                                ContentAttributionBadge(attribution = ContentAttributionType.AUTHENTIC_QUOTE)
                            }

                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = item.titleAr,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "المواضع القرآنية: ${item.surahAndAyahAr}",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.primary
                            )

                            Spacer(modifier = Modifier.height(8.dp))
                            Surface(
                                color = MaterialTheme.colorScheme.surface,
                                shape = RoundedCornerShape(12.dp),
                                border = BorderStroke(1.dp, IlluminatedGold.copy(alpha = 0.5f)),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    text = item.uthmaniSnippetAr,
                                    fontFamily = AmiriFontFamily,
                                    fontSize = 21.sp,
                                    lineHeight = 34.sp,
                                    modifier = Modifier.padding(12.dp)
                                )
                            }

                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "📖 التحرير العلمي: ${item.definitionAndPerformanceAr}",
                                style = MaterialTheme.typography.bodyMedium
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "🎙️ كيفية الأداء التطبيقي: ${item.acousticCoachingTipAr}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.primary,
                                fontWeight = FontWeight.SemiBold
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "الشاهد: «${item.shatibiyyahAndJazariyyahEvidenceAr}»",
                                fontFamily = AmiriFontFamily,
                                fontSize = 17.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }

            2 -> {
                // Specialized Quranic Sciences Modules (Naskh, Asbab Al-Nuzul Rules, I'rab Al-Jumal)
                items(specializedModules, key = { it.id }) { mod ->
                    Card(
                        shape = RoundedCornerShape(18.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        border = BorderStroke(1.2.dp, IlluminatedGold.copy(alpha = 0.7f)),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("specialized_science_card_${mod.id}")
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
                                        text = mod.disciplineAr,
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onPrimaryContainer,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                    )
                                }
                                ContentAttributionBadge(attribution = ContentAttributionType.AUTHENTIC_QUOTE)
                            }

                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = mod.titleAr,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Surface(
                                color = RoyalEmerald.copy(alpha = 0.1f),
                                shape = RoundedCornerShape(10.dp),
                                border = BorderStroke(1.dp, RoyalEmerald.copy(alpha = 0.35f)),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    text = "القاعدة الأصولية: ${mod.foundationalRuleAr}",
                                    style = MaterialTheme.typography.bodySmall,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.padding(10.dp)
                                )
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = mod.detailedExplanationAr,
                                style = MaterialTheme.typography.bodyMedium
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "الشاهد القرآني: ${mod.quranicExampleUthmani}",
                                fontFamily = AmiriFontFamily,
                                fontSize = 20.sp,
                                color = MaterialTheme.colorScheme.primary
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "المصدر المعتمد: ${mod.sourceCitation}",
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
