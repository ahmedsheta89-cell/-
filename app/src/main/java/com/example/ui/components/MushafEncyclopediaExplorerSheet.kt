package com.example.ui.components

import androidx.compose.foundation.BorderStroke
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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CompareArrows
import androidx.compose.material.icons.filled.Hub
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.ScrollableTabRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.local.AyahEntity
import com.example.domain.model.ContentAttributionType
import com.example.domain.model.GharibLexiconEntry
import com.example.domain.model.MutashabihatRule
import com.example.domain.model.QiraatComparisonEntry
import com.example.domain.model.SurahMaqasidMindMap
import com.example.domain.usecase.ArabicTextNormalizer
import com.example.ui.theme.AmiriFontFamily
import com.example.ui.theme.IlluminatedGold
import com.example.ui.theme.RoyalEmerald
import com.example.ui.theme.toArabicDigits

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MushafEncyclopediaExplorerSheet(
    initialTab: Int,
    selectedSurahNumber: Int,
    currentSurahAyahs: List<AyahEntity>,
    mindMaps: List<SurahMaqasidMindMap>,
    mutashabihatRules: List<MutashabihatRule>,
    qiraatComparisons: List<QiraatComparisonEntry>,
    gharibLexicon: List<GharibLexiconEntry>,
    useEasternDigits: Boolean,
    onDismiss: () -> Unit
) {
    var activeTab by remember { mutableIntStateOf(initialTab.coerceIn(0, 2)) }
    var lexiconQuery by remember { mutableStateOf("") }

    val filteredLexicon = remember(lexiconQuery, gharibLexicon) {
        val norm = ArabicTextNormalizer.normalizeForSearch(lexiconQuery)
        if (norm.isBlank()) {
            gharibLexicon
        } else {
            gharibLexicon.filter { entry ->
                ArabicTextNormalizer.normalizeForSearch(entry.quranicWordAr).contains(norm) ||
                    ArabicTextNormalizer.normalizeForSearch(entry.wordRootAr).contains(norm) ||
                    ArabicTextNormalizer.normalizeForSearch(entry.raghibMeaningAr).contains(norm) ||
                    ArabicTextNormalizer.normalizeForSearch(entry.surahNameAr).contains(norm)
            }
        }
    }

    val activeSurahMindMap = mindMaps.find { it.surahNumber == selectedSurahNumber } ?: mindMaps.first()
    val sampleComparisonAyah = currentSurahAyahs.firstOrNull()

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = MaterialTheme.colorScheme.surface,
        modifier = Modifier.testTag("mushaf_encyclopedia_explorer_sheet")
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp)
        ) {
            Text(
                text = "موسوعة المصحف التفاعلية المقارنة",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
            Spacer(modifier = Modifier.height(8.dp))

            ScrollableTabRow(
                selectedTabIndex = activeTab,
                edgePadding = 0.dp
            ) {
                Tab(
                    selected = activeTab == 0,
                    onClick = { activeTab = 0 },
                    text = { Text("مقارنة القراءات والتفاسير") },
                    icon = { Icon(Icons.Default.CompareArrows, contentDescription = null, modifier = Modifier.size(18.dp)) },
                    modifier = Modifier.testTag("encyclopedia_tab_qiraat")
                )
                Tab(
                    selected = activeTab == 1,
                    onClick = { activeTab = 1 },
                    text = { Text("خرائط المقاصد والمتشابهات") },
                    icon = { Icon(Icons.Default.Hub, contentDescription = null, modifier = Modifier.size(18.dp)) },
                    modifier = Modifier.testTag("encyclopedia_tab_mindmap")
                )
                Tab(
                    selected = activeTab == 2,
                    onClick = { activeTab = 2 },
                    text = { Text("معجم الغريب وأسباب النزول") },
                    icon = { Icon(Icons.Default.MenuBook, contentDescription = null, modifier = Modifier.size(18.dp)) },
                    modifier = Modifier.testTag("encyclopedia_tab_lexicon")
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(12.dp),
                contentPadding = PaddingValues(bottom = 24.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(440.dp)
            ) {
                when (activeTab) {
                    0 -> {
                        // Side-by-Side 4 Tafsirs & Ten Qira'at Comparison
                        if (sampleComparisonAyah != null) {
                            item {
                                Card(
                                    shape = RoundedCornerShape(16.dp),
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                                    border = BorderStroke(1.dp, IlluminatedGold)
                                ) {
                                    Column(modifier = Modifier.padding(14.dp)) {
                                        Text(
                                            text = "مقارنة التفاسير الأربعة المتقابلة — سورة ${sampleComparisonAyah.surahNameAr} (${sampleComparisonAyah.ayahNumber.toArabicDigits(useEasternDigits)})",
                                            style = MaterialTheme.typography.titleSmall,
                                            fontWeight = FontWeight.Bold,
                                            color = MaterialTheme.colorScheme.primary
                                        )
                                        Spacer(modifier = Modifier.height(6.dp))
                                        Text(
                                            text = "﴿ ${sampleComparisonAyah.uthmaniText} ﴾",
                                            fontFamily = AmiriFontFamily,
                                            fontSize = 20.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                            Surface(
                                                color = MaterialTheme.colorScheme.surface,
                                                shape = RoundedCornerShape(10.dp),
                                                modifier = Modifier.weight(1f)
                                            ) {
                                                Column(modifier = Modifier.padding(8.dp)) {
                                                    Text("التفسير الميسر", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = IlluminatedGold)
                                                    Text(sampleComparisonAyah.tafsirMuyassar, style = MaterialTheme.typography.bodySmall)
                                                }
                                            }
                                            Surface(
                                                color = MaterialTheme.colorScheme.surface,
                                                shape = RoundedCornerShape(10.dp),
                                                modifier = Modifier.weight(1f)
                                            ) {
                                                Column(modifier = Modifier.padding(8.dp)) {
                                                    Text("تفسير السعدي", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = IlluminatedGold)
                                                    Text(sampleComparisonAyah.tafsirSaadi, style = MaterialTheme.typography.bodySmall)
                                                }
                                            }
                                        }
                                        Spacer(modifier = Modifier.height(6.dp))
                                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                            Surface(
                                                color = MaterialTheme.colorScheme.surface,
                                                shape = RoundedCornerShape(10.dp),
                                                modifier = Modifier.weight(1f)
                                            ) {
                                                Column(modifier = Modifier.padding(8.dp)) {
                                                    Text("تفسير ابن كثير", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = IlluminatedGold)
                                                    Text(sampleComparisonAyah.tafsirIbnKathir, style = MaterialTheme.typography.bodySmall)
                                                }
                                            }
                                            Surface(
                                                color = MaterialTheme.colorScheme.surface,
                                                shape = RoundedCornerShape(10.dp),
                                                modifier = Modifier.weight(1f)
                                            ) {
                                                Column(modifier = Modifier.padding(8.dp)) {
                                                    Text("تفسير الطبري", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = IlluminatedGold)
                                                    Text(sampleComparisonAyah.tafsirTabari, style = MaterialTheme.typography.bodySmall)
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        items(qiraatComparisons, key = { it.compositeKey }) { entry ->
                            Card(
                                shape = RoundedCornerShape(16.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                            ) {
                                Column(modifier = Modifier.padding(14.dp)) {
                                    Row(
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Text(
                                            text = "فرش القراءات العشر: سورة ${entry.surahNameAr} (${entry.ayahNumber.toArabicDigits(useEasternDigits)})",
                                            style = MaterialTheme.typography.titleSmall,
                                            fontWeight = FontWeight.Bold,
                                            color = MaterialTheme.colorScheme.primary
                                        )
                                        ContentAttributionBadge(attribution = ContentAttributionType.AUTHENTIC_QUOTE)
                                    }
                                    Text(
                                        text = "الموضع القرآني: ﴿ ${entry.targetWordUthmani} ﴾",
                                        fontFamily = AmiriFontFamily,
                                        fontSize = 20.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Spacer(modifier = Modifier.height(6.dp))
                                    entry.variants.forEach { v ->
                                        Surface(
                                            color = MaterialTheme.colorScheme.surface,
                                            shape = RoundedCornerShape(10.dp),
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .padding(vertical = 3.dp)
                                        ) {
                                            Column(modifier = Modifier.padding(8.dp)) {
                                                Text(
                                                    text = "• ${v.imamAndRawiAr}: «${v.readingTextAr}»",
                                                    style = MaterialTheme.typography.labelMedium,
                                                    fontWeight = FontWeight.Bold
                                                )
                                                Text(
                                                    text = "الأداء: ${v.phoneticAndTajweedRuleAr} | التوجيه: ${v.linguisticDirectionAr}",
                                                    style = MaterialTheme.typography.bodySmall
                                                )
                                            }
                                        }
                                    }
                                    Text(
                                        text = "المصدر: ${entry.sourceCitation}",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }

                    1 -> {
                        // Surah Maqasid Mind Map & Mutashabihat Explorer
                        item {
                            Card(
                                shape = RoundedCornerShape(18.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                                border = BorderStroke(1.5.dp, IlluminatedGold)
                            ) {
                                Column(modifier = Modifier.padding(14.dp)) {
                                    Text(
                                        text = "🗺️ الخريطة الذهنية لمقاصد سورة ${activeSurahMindMap.surahNameAr}",
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = "المحور العام (عمود السورة): ${activeSurahMindMap.centralAxisAr}",
                                        style = MaterialTheme.typography.bodyMedium,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    activeSurahMindMap.mainPillars.forEach { (pillar, desc) ->
                                        Surface(
                                            color = MaterialTheme.colorScheme.surface,
                                            shape = RoundedCornerShape(10.dp),
                                            border = BorderStroke(1.dp, IlluminatedGold.copy(alpha = 0.5f)),
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .padding(vertical = 3.dp)
                                        ) {
                                            Column(modifier = Modifier.padding(10.dp)) {
                                                Text(
                                                    text = "◈ $pillar",
                                                    style = MaterialTheme.typography.labelLarge,
                                                    fontWeight = FontWeight.Bold,
                                                    color = MaterialTheme.colorScheme.primary
                                                )
                                                Text(
                                                    text = desc,
                                                    style = MaterialTheme.typography.bodySmall
                                                )
                                            }
                                        }
                                    }
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        text = "المصدر: ${activeSurahMindMap.sourceCitation}",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }

                        items(mutashabihatRules, key = { it.id }) { rule ->
                            Card(
                                shape = RoundedCornerShape(16.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                            ) {
                                Column(modifier = Modifier.padding(14.dp)) {
                                    Text(
                                        text = "🔗 ضابط المتشابهات: ${rule.topicTitleAr}",
                                        style = MaterialTheme.typography.titleSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        text = "١. سورة ${rule.firstSurahNameAr}: ﴿ ${rule.firstAyahSnippet} ﴾",
                                        fontFamily = AmiriFontFamily,
                                        fontSize = 18.sp
                                    )
                                    Text(
                                        text = "٢. سورة ${rule.secondSurahNameAr}: ﴿ ${rule.secondAyahSnippet} ﴾",
                                        fontFamily = AmiriFontFamily,
                                        fontSize = 18.sp
                                    )
                                    HorizontalDivider(modifier = Modifier.padding(vertical = 6.dp))
                                    Text(
                                        text = rule.goldenRuleExplanation,
                                        style = MaterialTheme.typography.bodySmall
                                    )
                                    Text(
                                        text = "المصدر: ${rule.sourceCitation}",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }

                    2 -> {
                        // Searchable Gharib Al-Quran & Asbab Al-Nuzul Lexicon
                        item {
                            OutlinedTextField(
                                value = lexiconQuery,
                                onValueChange = { lexiconQuery = it },
                                placeholder = { Text("ابحث بالجذر اللغوي أو الكلمة القرآنية (مثال: الصمد، القيوم، الكوثر)...") },
                                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                                singleLine = true,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .testTag("gharib_lexicon_search_input")
                            )
                        }

                        items(filteredLexicon, key = { it.id }) { item ->
                            Card(
                                shape = RoundedCornerShape(16.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                                border = BorderStroke(1.dp, IlluminatedGold.copy(alpha = 0.6f))
                            ) {
                                Column(modifier = Modifier.padding(14.dp)) {
                                    Row(
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Text(
                                            text = "﴿ ${item.quranicWordAr} ﴾ • الجذر: (${item.wordRootAr})",
                                            fontFamily = AmiriFontFamily,
                                            fontSize = 20.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = MaterialTheme.colorScheme.primary
                                        )
                                        Text(
                                            text = "سورة ${item.surahNameAr} (${item.ayahNumber.toArabicDigits(useEasternDigits)})",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = IlluminatedGold
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        text = "📖 بيان الغريب (الراغب الأصفهاني): ${item.raghibMeaningAr}",
                                        style = MaterialTheme.typography.bodySmall
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = "📜 السياق وسبب النزول (الواحدي): ${item.asbabNuzulSummaryAr}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    Text(
                                        text = "المصدر: ${item.sourceCitation}",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                }
                            }
                        }
                    }
                }
            }

            Button(
                onClick = onDismiss,
                colors = ButtonDefaults.buttonColors(containerColor = RoyalEmerald),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("إغلاق الموسوعة المقارنة")
            }
            Spacer(modifier = Modifier.height(12.dp))
        }
    }
}
