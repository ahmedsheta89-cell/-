package com.example.ui.components

import android.content.Intent
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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountTree
import androidx.compose.material.icons.filled.AutoFixHigh
import androidx.compose.material.icons.filled.HistoryEdu
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Verified
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
import androidx.compose.material3.ScrollableTabRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.local.ItqanPhase5SeedData
import com.example.domain.model.ContentAttributionType
import com.example.domain.model.QiraatImamIsnadNode
import com.example.domain.model.SurahMunasabahAndAnchor
import com.example.domain.model.UthmaniOrthographyRule
import com.example.ui.theme.AmiriFontFamily
import com.example.ui.theme.IlluminatedGold
import com.example.ui.theme.IlluminatedGoldBright
import com.example.ui.theme.RoyalEmerald
import com.example.ui.theme.toArabicDigits

/**
 * Phase 5: Interactive Sheet for Uthmani Orthography & Fawasil (الرسم العثماني وعد الآي),
 * Surah Munasabat & Hifz Anchors (تناسب الآيات والسور), and Ten Readers Isnad Tree (أسانيد القراء العشرة).
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrthographyMunasabatAndIsnadSheet(
    initialTab: Int = 0,
    studentName: String = "طالب علم بمدرسة إتقان",
    memorizedVersesCount: Int = 18,
    completedLessonsCount: Int = 6,
    certificatesCount: Int = 2,
    unresolvedMistakesCount: Int = 1,
    averageFsrsStability: Double = 3.8,
    orthographyRules: List<UthmaniOrthographyRule> = ItqanPhase5SeedData.uthmaniOrthographyAndFawasilCatalog,
    munasabatList: List<SurahMunasabahAndAnchor> = ItqanPhase5SeedData.surahMunasabatAndAnchorsCatalog,
    isnadNodes: List<QiraatImamIsnadNode> = ItqanPhase5SeedData.tenReadersIsnadTree,
    useEasternDigits: Boolean = true,
    onSelectSurah: (Int) -> Unit = {},
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    var activeTab by remember { mutableIntStateOf(initialTab.coerceIn(0, 2)) }
    var selectedCategoryFilter by remember { mutableStateOf("الكل") }

    val rasmCategories = listOf(
        "الكل",
        "القواعد الست للرسم العثماني",
        "علم الضبط وعلامات المصحف",
        "علم الفواصل وعدّ الآي"
    )

    val filteredRasmRules = remember(selectedCategoryFilter, orthographyRules) {
        if (selectedCategoryFilter == "الكل") orthographyRules
        else orthographyRules.filter { it.categoryAr == selectedCategoryFilter }
    }

    val readinessReportText = remember(
        studentName,
        memorizedVersesCount,
        completedLessonsCount,
        certificatesCount,
        unresolvedMistakesCount,
        averageFsrsStability
    ) {
        ItqanPhase5SeedData.buildComprehensiveIjazahReadinessReport(
            studentName = studentName,
            memorizedVersesCount = memorizedVersesCount,
            completedLessonsCount = completedLessonsCount,
            certificatesCount = certificatesCount,
            unresolvedMistakesCount = unresolvedMistakesCount,
            averageFsrsStability = averageFsrsStability
        )
    }

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .testTag("orthography_munasabat_isnad_sheet")
        ) {
            ScrollableTabRow(
                selectedTabIndex = activeTab,
                edgePadding = 12.dp
            ) {
                Tab(
                    selected = activeTab == 0,
                    onClick = { activeTab = 0 },
                    text = { Text("الرسم العثماني والضبط وعدّ الآي") },
                    icon = { Icon(Icons.Default.HistoryEdu, contentDescription = null) },
                    modifier = Modifier.testTag("phase5_tab_rasm_fawasil")
                )
                Tab(
                    selected = activeTab == 1,
                    onClick = { activeTab = 1 },
                    text = { Text("علم المناسبات وروابط الحفظ") },
                    icon = { Icon(Icons.Default.AutoFixHigh, contentDescription = null) },
                    modifier = Modifier.testTag("phase5_tab_munasabat")
                )
                Tab(
                    selected = activeTab == 2,
                    onClick = { activeTab = 2 },
                    text = { Text("أسانيد القراء العشرة والجاهزية") },
                    icon = { Icon(Icons.Default.AccountTree, contentDescription = null) },
                    modifier = Modifier.testTag("phase5_tab_isnad_tree")
                )
            }

            LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(490.dp)
            ) {
                when (activeTab) {
                    0 -> {
                        item {
                            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                items(rasmCategories) { cat ->
                                    FilterChip(
                                        selected = selectedCategoryFilter == cat,
                                        onClick = { selectedCategoryFilter = cat },
                                        label = { Text(cat) }
                                    )
                                }
                            }
                        }

                        items(filteredRasmRules, key = { it.id }) { rule ->
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
                                                text = rule.categoryAr,
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
                                        text = rule.ruleTitleAr,
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = "الشاهد من المصحف: ${rule.surahAndAyahRefAr}",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.primary
                                    )

                                    Spacer(modifier = Modifier.height(8.dp))
                                    Surface(
                                        color = MaterialTheme.colorScheme.surface,
                                        shape = RoundedCornerShape(12.dp),
                                        border = BorderStroke(1.dp, IlluminatedGold.copy(alpha = 0.5f)),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Column(modifier = Modifier.padding(10.dp)) {
                                            Text(
                                                text = rule.uthmaniWordExample,
                                                fontFamily = AmiriFontFamily,
                                                fontSize = 21.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = MaterialTheme.colorScheme.primary
                                            )
                                            Text(
                                                text = rule.standardImlaiComparison,
                                                style = MaterialTheme.typography.bodySmall,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = "🔍 سر الرسم والضبط: ${rule.scholarlySecretAndRuleAr}",
                                        style = MaterialTheme.typography.bodySmall
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = "🎙️ اتصال الرسم بالقراءات العشر: ${rule.qiraatConnectionAr}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.primary,
                                        fontWeight = FontWeight.Medium
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = "المصدر: ${rule.sourceCitation}",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }

                    1 -> {
                        items(munasabatList, key = { it.id }) { munasabah ->
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
                                                text = "بصيرة ومناسبات سورة ${munasabah.surahNameAr}",
                                                style = MaterialTheme.typography.labelMedium,
                                                color = IlluminatedGoldBright,
                                                fontWeight = FontWeight.Bold,
                                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                            )
                                        }
                                        TextButton(
                                            onClick = {
                                                onSelectSurah(munasabah.surahNumber)
                                                onDismiss()
                                            }
                                        ) {
                                            Text("فتح السورة ←")
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        text = "🔗 تناسب الفاتحة والخاتمة: ${munasabah.openingAndClosingHarmonyAr}",
                                        style = MaterialTheme.typography.bodyMedium
                                    )
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        text = "🧭 تناسب السورة مع ما قبلها: ${munasabah.connectionWithPreviousSurahAr}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.primary
                                    )

                                    HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
                                    Text(
                                        text = "🧠 مراسي تثبيت الحفظ الذهنية (لمنع التفلت):",
                                        style = MaterialTheme.typography.labelLarge,
                                        fontWeight = FontWeight.Bold
                                    )
                                    munasabah.hifzSequentialAnchors.forEach { anchor ->
                                        Text(
                                            text = "• $anchor",
                                            style = MaterialTheme.typography.bodySmall,
                                            modifier = Modifier.padding(vertical = 2.dp)
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = "المصدر: ${munasabah.sourceCitation}",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }

                    2 -> {
                        // Comprehensive Mushafahah & Ijazah Readiness Card
                        item {
                            Card(
                                shape = RoundedCornerShape(18.dp),
                                colors = CardDefaults.cardColors(containerColor = RoyalEmerald),
                                border = BorderStroke(1.5.dp, IlluminatedGold),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(14.dp)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            imageVector = Icons.Default.Verified,
                                            contentDescription = null,
                                            tint = IlluminatedGoldBright
                                        )
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text(
                                            text = "فحص الجاهزية للعرض والمشافهة بالسند المتصل",
                                            style = MaterialTheme.typography.titleSmall,
                                            fontWeight = FontWeight.Bold,
                                            color = IlluminatedGoldBright
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        text = readinessReportText,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = Color(0xFFFAF6EE)
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Button(
                                        onClick = {
                                            val sendIntent = Intent(Intent.ACTION_SEND).apply {
                                                type = "text/plain"
                                                putExtra(Intent.EXTRA_SUBJECT, "تقرير الجاهزية للعرض والمشافهة — إتقان")
                                                putExtra(Intent.EXTRA_TEXT, readinessReportText)
                                            }
                                            val chooser = Intent.createChooser(sendIntent, "مشاركة تقرير الجاهزية للعرض")
                                            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                                            runCatching { context.startActivity(chooser) }
                                        },
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = IlluminatedGold,
                                            contentColor = Color(0xFF06231B)
                                        ),
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .testTag("share_ijazah_readiness_report_button")
                                    ) {
                                        Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("تصدير ومشاركة تقرير الجاهزية للمشايخ", fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }

                        items(isnadNodes, key = { it.id }) { node ->
                            Card(
                                shape = RoundedCornerShape(16.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                                border = BorderStroke(1.dp, IlluminatedGold.copy(alpha = 0.7f)),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(14.dp)) {
                                    Text(
                                        text = node.imamNameAndCityAr,
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = "الراوي الأول: ${node.firstRawiAr} • الراوي الثاني: ${node.secondRawiAr}",
                                        style = MaterialTheme.typography.labelMedium,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Surface(
                                        color = MaterialTheme.colorScheme.surface,
                                        shape = RoundedCornerShape(10.dp),
                                        border = BorderStroke(1.dp, IlluminatedGold.copy(alpha = 0.4f)),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Text(
                                            text = "📜 سلسلة السند المتصل: ${node.sahabiSanadChainAr}",
                                            style = MaterialTheme.typography.bodySmall,
                                            modifier = Modifier.padding(10.dp)
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        text = "منهج القراءة والأصول: ${node.distinctMethodologySummaryAr}",
                                        style = MaterialTheme.typography.bodySmall
                                    )
                                    Text(
                                        text = "المصدر: ${node.sourceCitation}",
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
