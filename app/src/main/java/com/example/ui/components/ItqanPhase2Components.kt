package com.example.ui.components

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
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
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material.icons.filled.AddCircleOutline
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.GraphicEq
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.Hub
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Translate
import androidx.compose.material.icons.filled.WarningAmber
import androidx.compose.material.icons.filled.Widgets
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.example.data.local.AyahEntity
import com.example.data.local.KhatmahPlanEntity
import com.example.data.local.MistakeLogEntity
import com.example.data.notifications.SmartWirdNotificationHelper
import com.example.domain.model.CloudGroupHalqah
import com.example.domain.model.GharibLexiconEntry
import com.example.domain.model.MutashabihatRule
import com.example.domain.model.QiraatComparisonEntry
import com.example.domain.model.SurahMaqasidMindMap
import com.example.ui.theme.AmiriFontFamily
import com.example.ui.theme.IlluminatedGold
import com.example.ui.theme.IlluminatedGoldBright
import com.example.ui.theme.RoyalEmerald
import com.example.ui.theme.TajweedGhunnahGreen
import com.example.ui.theme.TajweedIkhfaOrange
import com.example.ui.theme.TajweedMaddRed
import com.example.ui.theme.toArabicDigits
import com.example.widget.ItqanDailyWirdWidgetProvider

@Composable
fun HusaryWaveformComparisonCard(
    studentWaveform: List<Float>,
    husaryWaveform: List<Float>,
    similarityPercent: Int,
    makhrajSummary: String,
    useEasternDigits: Boolean,
    onRecordAndCompare: () -> Unit,
    onPlayHusaryReference: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        border = BorderStroke(1.5.dp, IlluminatedGold),
        modifier = modifier
            .fillMaxWidth()
            .testTag("husary_waveform_comparison_card")
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.GraphicEq,
                        contentDescription = null,
                        tint = IlluminatedGold
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Column {
                        Text(
                            text = "مقارنة الموجة الصوتية ومقادير المدود مع الشيخ الحصري",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "تحليل زمن المد والغنة ومخارج الحروف مقارنةً بالمصحف المعلم",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                Surface(
                    color = RoyalEmerald,
                    shape = RoundedCornerShape(10.dp),
                    border = BorderStroke(1.dp, IlluminatedGold)
                ) {
                    Text(
                        text = "${similarityPercent.toArabicDigits(useEasternDigits)}%",
                        color = IlluminatedGoldBright,
                        fontWeight = FontWeight.Bold,
                        style = MaterialTheme.typography.labelMedium,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Phonetic Makharij & Sifaat Diagnosis Strip
            Surface(
                color = MaterialTheme.colorScheme.surface,
                shape = RoundedCornerShape(12.dp),
                border = BorderStroke(1.dp, IlluminatedGold.copy(alpha = 0.5f)),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("makhraj_diagnosis_banner")
            ) {
                Text(
                    text = "🔬 التحليل الصوتي للمخرج والصفات: $makhrajSummary",
                    style = MaterialTheme.typography.bodySmall,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.padding(10.dp)
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Dual Waveform Bars (Top: Sheikh Al-Husary Reference in Gold, Bottom: Student Voice in Emerald)
            Text(
                text = "موجة الشيخ محمود خليل الحصري (الميزان المعياري للمدود):",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(4.dp))
            WaveformBarsRow(
                amplitudes = husaryWaveform,
                barColor = IlluminatedGold
            )

            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "موجة تلاوة الطالب المسجلة:",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(4.dp))
            WaveformBarsRow(
                amplitudes = studentWaveform,
                barColor = TajweedGhunnahGreen
            )

            Spacer(modifier = Modifier.height(12.dp))
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Button(
                    onClick = onRecordAndCompare,
                    colors = ButtonDefaults.buttonColors(containerColor = RoyalEmerald),
                    modifier = Modifier
                        .weight(1f)
                        .testTag("compare_waveform_husary_button")
                ) {
                    Icon(Icons.Default.GraphicEq, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("مقارنة بصوتي الآن", style = MaterialTheme.typography.labelSmall)
                }
                OutlinedButton(
                    onClick = onPlayHusaryReference,
                    border = BorderStroke(1.dp, IlluminatedGold),
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(Icons.AutoMirrored.Filled.VolumeUp, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("استماع للشيخ الحصري", style = MaterialTheme.typography.labelSmall)
                }
            }
        }
    }
}

@Composable
private fun WaveformBarsRow(
    amplitudes: List<Float>,
    barColor: Color
) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(5.dp),
        verticalAlignment = Alignment.Bottom,
        modifier = Modifier
            .fillMaxWidth()
            .height(34.dp)
            .background(
                color = MaterialTheme.colorScheme.surface.copy(alpha = 0.6f),
                shape = RoundedCornerShape(8.dp)
            )
            .padding(horizontal = 10.dp, vertical = 4.dp)
    ) {
        amplitudes.forEach { amp ->
            Box(
                modifier = Modifier
                    .weight(1f)
                    .height((amp.coerceIn(0.15f, 1.0f) * 26f).dp)
                    .clip(RoundedCornerShape(3.dp))
                    .background(barColor)
            )
        }
    }
}

@Composable
fun RecurringMistakesLogTabContent(
    mistakeLogs: List<MistakeLogEntity>,
    useEasternDigits: Boolean,
    onToggleResolved: (String, Boolean) -> Unit,
    onPracticeMistakeAyah: (Int, Int) -> Unit,
    modifier: Modifier = Modifier
) {
    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        modifier = modifier
            .fillMaxSize()
            .testTag("recurring_mistakes_tab_content")
    ) {
        item {
            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = RoyalEmerald),
                border = BorderStroke(1.dp, IlluminatedGold),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "السجل الذكي للأخطاء المتكررة في الحفظ والتجويد",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = IlluminatedGoldBright
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "يرصد التطبيق تلقائياً الكلمات التي استوقفك فيها الشيخ المقرئ مع تشخيص المخرج والصفة لتكثيف مراجعتها.",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFFFAF6EE)
                    )
                }
            }
        }

        items(mistakeLogs, key = { it.mistakeId }) { item ->
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (item.isResolved) {
                        MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f)
                    } else {
                        MaterialTheme.colorScheme.surface
                    }
                ),
                border = BorderStroke(
                    width = 1.5.dp,
                    color = if (item.isResolved) TajweedGhunnahGreen else TajweedMaddRed
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("mistake_log_card_${item.mistakeId}")
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = if (item.isResolved) Icons.Default.CheckCircle else Icons.Default.WarningAmber,
                                contentDescription = null,
                                tint = if (item.isResolved) TajweedGhunnahGreen else TajweedMaddRed
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "سورة ${item.surahNameAr} — الآية ${item.ayahNumber.toArabicDigits(useEasternDigits)}",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Surface(
                            color = if (item.isResolved) TajweedGhunnahGreen.copy(alpha = 0.15f) else TajweedMaddRed.copy(alpha = 0.15f),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text(
                                text = if (item.isResolved) "تم الضبط ✓" else "تكرر ${item.occurrenceCount.toArabicDigits(useEasternDigits)} مرات",
                                style = MaterialTheme.typography.labelSmall,
                                color = if (item.isResolved) TajweedGhunnahGreen else TajweedMaddRed,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "• الصواب القرآني: ﴿ ${item.expectedWord} ﴾  |  اللفظ المسجل: «${item.spokenMistakeWord}»",
                        fontFamily = AmiriFontFamily,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "• التصنيف: ${item.mistakeCategory}",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = "• تشخيص المخرج والتجويد: ${item.tajweedCoachingHint}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    Spacer(modifier = Modifier.height(10.dp))
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        OutlinedButton(
                            onClick = { onPracticeMistakeAyah(item.surahNumber, item.ayahNumber) },
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("تدرب مع الشيخ", style = MaterialTheme.typography.labelSmall)
                        }
                        Button(
                            onClick = { onToggleResolved(item.mistakeId, !item.isResolved) },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (item.isResolved) TajweedIkhfaOrange else TajweedGhunnahGreen
                            ),
                            modifier = Modifier
                                .weight(1f)
                                .testTag("resolve_mistake_${item.mistakeId}")
                        ) {
                            Text(
                                text = if (item.isResolved) "إعادة للمراجعة" else "تم إتقان الكلمة ✓",
                                style = MaterialTheme.typography.labelSmall
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun CloudGroupHalqahsTabContent(
    groupHalqahs: List<CloudGroupHalqah>,
    useEasternDigits: Boolean,
    onJoinOrLogWird: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        modifier = modifier
            .fillMaxSize()
            .testTag("cloud_group_halqahs_tab_content")
    ) {
        item {
            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = RoyalEmerald),
                border = BorderStroke(1.dp, IlluminatedGold),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Groups,
                            contentDescription = null,
                            tint = IlluminatedGoldBright
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "حلقات التسميع الجماعية والتنافس القرآني السحابي",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = IlluminatedGoldBright
                        )
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "﴿ وَفِي ذَٰلِكَ فَلْيَتَنَافَسِ الْمُتَنَافِسُونَ ﴾ — انضم إلى حلقات الورد المشترك ووثّق إنجازك اليومي.",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFFFAF6EE)
                    )
                }
            }
        }

        items(groupHalqahs, key = { it.halqahId }) { halqah ->
            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                border = BorderStroke(1.5.dp, if (halqah.isJoined) IlluminatedGold else MaterialTheme.colorScheme.outline),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("group_halqah_card_${halqah.halqahId}")
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = halqah.titleAr,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                            Text(
                                text = "${halqah.supervisorSheikhAr} • ${halqah.participantsCount.toArabicDigits(useEasternDigits)} مشارك",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Surface(
                            color = IlluminatedGold.copy(alpha = 0.2f),
                            shape = RoundedCornerShape(10.dp),
                            border = BorderStroke(1.dp, IlluminatedGold)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.EmojiEvents,
                                    contentDescription = null,
                                    tint = IlluminatedGold,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = "${halqah.userMasteryPoints.toArabicDigits(useEasternDigits)} نقطة",
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "الورد المشترك: ${halqah.wirdTargetAr}",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium
                    )

                    Spacer(modifier = Modifier.height(8.dp))
                    Surface(
                        color = MaterialTheme.colorScheme.surface,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(10.dp)) {
                            Text(
                                text = "لوحة شرف المواظبة والإتقان:",
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                            halqah.leaderboardPreview.forEachIndexed { idx, (memberName, pts) ->
                                Row(
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 2.dp)
                                ) {
                                    Text(
                                        text = "${(idx + 1).toArabicDigits(useEasternDigits)}. $memberName",
                                        style = MaterialTheme.typography.bodySmall,
                                        fontWeight = if (memberName.contains("أنت")) FontWeight.Bold else FontWeight.Normal
                                    )
                                    Text(
                                        text = "${pts.toArabicDigits(useEasternDigits)} نقطة إتقان",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = IlluminatedGold
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))
                    Button(
                        onClick = { onJoinOrLogWird(halqah.halqahId) },
                        colors = ButtonDefaults.buttonColors(containerColor = RoyalEmerald),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("join_or_log_halqah_${halqah.halqahId}")
                    ) {
                        Text(
                            text = if (halqah.isJoined) {
                                "تسجيل إتمام ورد اليوم في الحلقة (+٥٠ نقطة)"
                            } else {
                                "الانضمام إلى الحلقة الجماعية وبدء الورد"
                            },
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun KhatmahPlannerAndWidgetCard(
    khatmahPlans: List<KhatmahPlanEntity>,
    dueReviewsCount: Int,
    recurringMistakesCount: Int,
    useEasternDigits: Boolean,
    onLogDailyWird: (KhatmahPlanEntity) -> Unit,
    onCreateNewKhatmahPlan: (String, String, Int) -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    var showCreateDialog by remember { mutableStateOf(false) }
    var notificationStatusText by remember { mutableStateOf<String?>(null) }

    val activePlan = khatmahPlans.firstOrNull()
    val notifPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted && activePlan != null) {
            SmartWirdNotificationHelper.sendSmartWirdReminder(
                context = context,
                khatmahTitle = activePlan.titleAr,
                dueReviewsCount = dueReviewsCount,
                recurringMistakesCount = recurringMistakesCount
            )
            notificationStatusText = "تم إرسال إشعار الورد الذكي وتحديث ويدجت الشاشة الرئيسية بنجاح"
        } else {
            notificationStatusText = "تم تحديث بيانات ويدجت الشاشة الرئيسية بنجاح"
        }
    }

    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.5.dp, IlluminatedGold),
        modifier = modifier
            .fillMaxWidth()
            .testTag("khatmah_planner_card")
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Widgets,
                        contentDescription = null,
                        tint = IlluminatedGold
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Column {
                        Text(
                            text = "نظام الختمات المجدولة والورد اليومي والويدجت",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "متابعة آلية للورد اليومي مع إشعارات ذكية وويدجت الشاشة الرئيسية",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                IconButtonOrChip(onClick = { showCreateDialog = true })
            }

            if (activePlan != null) {
                Spacer(modifier = Modifier.height(10.dp))
                val progressFraction = (activePlan.completedPages.toFloat() / activePlan.totalPages.coerceAtLeast(1))
                    .coerceIn(0f, 1f)
                val progressPercent = (progressFraction * 100).toInt()

                Surface(
                    color = MaterialTheme.colorScheme.surfaceVariant,
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(
                            horizontalArrangement = Arrangement.SpaceBetween,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = activePlan.titleAr,
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                            Text(
                                text = "${progressPercent.toArabicDigits(useEasternDigits)}%",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold,
                                color = IlluminatedGold
                            )
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "الورد اليومي المقرر: ${activePlan.dailyPagesTarget.toArabicDigits(useEasternDigits)} صفحة • المنجز: ${activePlan.completedPages.toArabicDigits(useEasternDigits)} من ${activePlan.totalPages.toArabicDigits(useEasternDigits)} صفحة",
                            style = MaterialTheme.typography.bodySmall
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        LinearProgressIndicator(
                            progress = { progressFraction },
                            color = RoyalEmerald,
                            trackColor = IlluminatedGold.copy(alpha = 0.25f),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(8.dp)
                                .clip(RoundedCornerShape(4.dp))
                        )
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Button(
                        onClick = {
                            onLogDailyWird(activePlan)
                            ItqanDailyWirdWidgetProvider.refreshAllWidgets(
                                context = context,
                                ayahSnippet = "﴿ أَوْ زِدْ عَلَيْهِ وَرَتِّلِ ٱلْقُرْءَانَ تَرْتِيلًا ﴾",
                                statusLine = "${activePlan.titleAr} • المنجز: ${activePlan.completedPages + activePlan.dailyPagesTarget} ص"
                            )
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = RoyalEmerald),
                        modifier = Modifier
                            .weight(1f)
                            .testTag("log_daily_khatmah_wird_button")
                    ) {
                        Icon(Icons.Default.CheckCircle, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("إنجاز ورد اليوم", style = MaterialTheme.typography.labelSmall)
                    }

                    OutlinedButton(
                        onClick = {
                            ItqanDailyWirdWidgetProvider.refreshAllWidgets(
                                context = context,
                                ayahSnippet = "﴿ أَوْ زِدْ عَلَيْهِ وَرَتِّلِ ٱلْقُرْءَانَ تَرْتِيلًا ﴾",
                                statusLine = "${activePlan.titleAr} • مواظبة ${activePlan.completedDaysStreak} أيام"
                            )
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
                                ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
                            ) {
                                notifPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                            } else {
                                val sent = SmartWirdNotificationHelper.sendSmartWirdReminder(
                                    context = context,
                                    khatmahTitle = activePlan.titleAr,
                                    dueReviewsCount = dueReviewsCount,
                                    recurringMistakesCount = recurringMistakesCount
                                )
                                notificationStatusText = if (sent) {
                                    "تم إرسال إشعار المراجعة الذكي وتحديث ويدجت الشاشة الرئيسية"
                                } else {
                                    "تم تحديث ويدجت الشاشة الرئيسية بورد اليوم"
                                }
                            }
                        },
                        border = BorderStroke(1.dp, IlluminatedGold),
                        modifier = Modifier
                            .weight(1f)
                            .testTag("trigger_smart_reminder_widget_button")
                    ) {
                        Icon(Icons.Default.NotificationsActive, contentDescription = null, modifier = Modifier.size(16.dp), tint = IlluminatedGold)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("تذكير وتحديث الويدجت", style = MaterialTheme.typography.labelSmall)
                    }
                }

                if (notificationStatusText != null) {
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = notificationStatusText!!,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }
        }
    }

    if (showCreateDialog) {
        var planTitle by remember { mutableStateOf("ختمة تلاوة وتدبر جديدة") }
        var selectedDays by remember { mutableIntStateOf(30) }
        AlertDialog(
            onDismissRequest = { showCreateDialog = false },
            title = { Text("إنشاء ختمة مجدولة جديدة") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = planTitle,
                        onValueChange = { planTitle = it },
                        label = { Text("عنوان الختمة") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Text("اختر المدة المستهدفة للختمة:", style = MaterialTheme.typography.labelMedium)
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        listOf(7, 15, 30, 60).forEach { days ->
                            FilterChip(
                                selected = selectedDays == days,
                                onClick = { selectedDays = days },
                                label = { Text("${days.toArabicDigits(useEasternDigits)} يوم") }
                            )
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        onCreateNewKhatmahPlan(planTitle, "ختمة تلاوة وتدبر", selectedDays)
                        showCreateDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = RoyalEmerald)
                ) {
                    Text("حفظ وجدولة الورد")
                }
            },
            dismissButton = {
                TextButton(onClick = { showCreateDialog = false }) {
                    Text("إلغاء")
                }
            }
        )
    }
}

@Composable
private fun IconButtonOrChip(onClick: () -> Unit) {
    OutlinedButton(
        onClick = onClick,
        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
        modifier = Modifier.testTag("open_new_khatmah_dialog_button")
    ) {
        Icon(Icons.Default.AddCircleOutline, contentDescription = null, modifier = Modifier.size(16.dp))
        Spacer(modifier = Modifier.width(4.dp))
        Text("ختمة جديدة", style = MaterialTheme.typography.labelSmall)
    }
}
