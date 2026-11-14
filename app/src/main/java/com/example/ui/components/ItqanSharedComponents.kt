package com.example.ui.components

import android.content.Intent
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Flag
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Repeat
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.audio.PlaybackUiState
import com.example.domain.model.ContentAttributionType
import com.example.ui.theme.AmiriFontFamily
import com.example.ui.theme.BadgeAiGroundedAmber
import com.example.ui.theme.BadgeAuthenticGreen
import com.example.ui.theme.BadgeTeamSimplifiedBlue
import com.example.ui.theme.IlluminatedGold
import com.example.ui.theme.IlluminatedGoldBright
import com.example.ui.theme.RoyalEmerald
import com.example.ui.theme.TajweedGhunnahGreen
import com.example.ui.theme.TajweedIkhfaOrange
import com.example.ui.theme.TajweedMaddRed
import com.example.ui.theme.TajweedQalqalahBlue
import com.example.ui.theme.toArabicDigits

/**
 * Content Governance Attribution Badge:
 * Clearly distinguishes Authentic Quoted Text, Team Simplified Explanation, and AI-Assisted RAG Output.
 */
@Composable
fun ContentAttributionBadge(
    attribution: ContentAttributionType,
    modifier: Modifier = Modifier
) {
    val badgeColor = when (attribution) {
        ContentAttributionType.AUTHENTIC_QUOTE -> BadgeAuthenticGreen
        ContentAttributionType.TEAM_SIMPLIFIED -> BadgeTeamSimplifiedBlue
        ContentAttributionType.AI_ASSISTED -> BadgeAiGroundedAmber
    }
    val icon = when (attribution) {
        ContentAttributionType.AUTHENTIC_QUOTE -> Icons.Default.Verified
        ContentAttributionType.TEAM_SIMPLIFIED -> Icons.Default.MenuBook
        ContentAttributionType.AI_ASSISTED -> Icons.Default.AutoAwesome
    }

    Surface(
        color = badgeColor.copy(alpha = 0.14f),
        shape = RoundedCornerShape(50),
        border = BorderStroke(1.dp, badgeColor.copy(alpha = 0.45f)),
        modifier = modifier
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = attribution.badgeLabelAr,
                tint = badgeColor,
                modifier = Modifier.size(14.dp)
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = attribution.badgeLabelAr,
                style = MaterialTheme.typography.labelSmall,
                color = badgeColor,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

/**
 * Ornamental Surah Header Banner inspired by illuminated Islamic manuscripts.
 */
@Composable
fun IlluminatedSurahHeader(
    surahNumber: Int,
    surahNameAr: String,
    revelationType: String,
    ayahCount: Int,
    juzNumber: Int,
    maqasidSummary: String,
    useEasternDigits: Boolean = true,
    modifier: Modifier = Modifier
) {
    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = RoyalEmerald),
        border = BorderStroke(1.5.dp, IlluminatedGold),
        modifier = modifier.fillMaxWidth()
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.horizontalGradient(
                        listOf(
                            Color(0xFF07281F),
                            RoyalEmerald,
                            Color(0xFF07281F)
                        )
                    )
                )
                .padding(horizontal = 18.dp, vertical = 14.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Surface(
                    color = IlluminatedGold.copy(alpha = 0.2f),
                    shape = RoundedCornerShape(12.dp),
                    border = BorderStroke(1.dp, IlluminatedGold.copy(alpha = 0.6f))
                ) {
                    Text(
                        text = "$revelationType • ${ayahCount.toArabicDigits(useEasternDigits)} آية",
                        style = MaterialTheme.typography.labelMedium,
                        color = IlluminatedGoldBright,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                    )
                }

                Text(
                    text = "سُورَةُ $surahNameAr",
                    fontFamily = AmiriFontFamily,
                    fontWeight = FontWeight.Bold,
                    fontSize = 26.sp,
                    color = Color(0xFFFAF6EE)
                )

                Surface(
                    color = IlluminatedGold.copy(alpha = 0.2f),
                    shape = RoundedCornerShape(12.dp),
                    border = BorderStroke(1.dp, IlluminatedGold.copy(alpha = 0.6f))
                ) {
                    Text(
                        text = "الجزء ${juzNumber.toArabicDigits(useEasternDigits)}",
                        style = MaterialTheme.typography.labelMedium,
                        color = IlluminatedGoldBright,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                    )
                }
            }

            if (maqasidSummary.isNotBlank()) {
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "محور السورة: $maqasidSummary",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFFE5DFD3),
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}

/**
 * Renders Uthmani Quranic verse text with optional Tajweed color-coding and live word-by-word highlight.
 */
@Composable
fun TajweedUthmaniText(
    uthmaniText: String,
    ayahNumber: Int,
    showTajweedColors: Boolean,
    highlightedWordIndex: Int = -1,
    useEasternDigits: Boolean = true,
    modifier: Modifier = Modifier
) {
    val words = remember(uthmaniText) {
        uthmaniText.trim().split(Regex("\\s+")).filter { it.isNotBlank() }
    }
    val baseColor = MaterialTheme.colorScheme.onSurface

    val annotated = buildAnnotatedString {
        words.forEachIndexed { idx, word ->
            val isHighlightedWord = idx == highlightedWordIndex
            val wordColor = when {
                isHighlightedWord -> RoyalEmerald
                !showTajweedColors -> baseColor
                word.contains("آ") || word.contains("ـٰ") || word.contains("ٓ") -> TajweedMaddRed
                word.contains("نَّ") || word.contains("مَّ") || word.contains("ٌ") || word.contains("ٍ") -> TajweedGhunnahGreen
                word.contains("قْ") || word.contains("طْ") || word.contains("بْ") || word.contains("جْ") || word.contains("دْ") || word.endsWith("دٌ") || word.endsWith("دُ") -> TajweedQalqalahBlue
                word.contains("نْ") -> TajweedIkhfaOrange
                else -> baseColor
            }

            withStyle(
                style = SpanStyle(
                    color = if (isHighlightedWord) Color.White else wordColor,
                    background = if (isHighlightedWord) IlluminatedGold else Color.Transparent,
                    fontWeight = if (isHighlightedWord) FontWeight.Bold else FontWeight.Normal
                )
            ) {
                append(word)
            }
            append(" ")
        }

        // Ornate Ayah Marker ﴿١﴾
        withStyle(
            style = SpanStyle(
                color = IlluminatedGold,
                fontWeight = FontWeight.Bold
            )
        ) {
            append("﴿${ayahNumber.toArabicDigits(useEasternDigits)}﴾")
        }
    }

    Text(
        text = annotated,
        fontFamily = AmiriFontFamily,
        fontSize = 25.sp,
        lineHeight = 46.sp,
        textAlign = TextAlign.Right,
        modifier = modifier
    )
}

/**
 * Tajweed Legend Strip shown when Tajweed color-coding is enabled.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun TajweedColorLegendStrip(modifier: Modifier = Modifier) {
    Surface(
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.7f),
        shape = RoundedCornerShape(14.dp),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.5f)),
        modifier = modifier.fillMaxWidth()
    ) {
        FlowRow(
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp),
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)
        ) {
            LegendDot(color = TajweedMaddRed, label = "المدود")
            LegendDot(color = TajweedGhunnahGreen, label = "الغنة والإدغام")
            LegendDot(color = TajweedQalqalahBlue, label = "القلقلة (قطب جد)")
            LegendDot(color = TajweedIkhfaOrange, label = "النون الساكنة والإخفاء")
        }
    }
}

@Composable
private fun LegendDot(color: Color, label: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(
            modifier = Modifier
                .size(10.dp)
                .clip(CircleShape)
                .background(color)
        )
        Spacer(modifier = Modifier.width(5.dp))
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurface
        )
    }
}

/**
 * Persistent Media Recitation Control Bar with Reciter selector, Repeat (1/3/5/∞), Speed, Silence Gap, and Sleep Timer.
 */
@Composable
fun RecitationPlayerBar(
    playbackState: PlaybackUiState,
    onTogglePlayPause: () -> Unit,
    onStop: () -> Unit,
    onCycleRepeat: () -> Unit,
    onCycleSpeed: () -> Unit,
    onCycleSilenceGap: () -> Unit,
    onCycleSleepTimer: () -> Unit,
    onOpenReciterPicker: () -> Unit,
    useEasternDigits: Boolean = true,
    modifier: Modifier = Modifier
) {
    Card(
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        ),
        border = BorderStroke(1.dp, IlluminatedGold.copy(alpha = 0.65f)),
        modifier = modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .clickable { onOpenReciterPicker() }
                ) {
                    Text(
                        text = playbackState.selectedReciter.nameAr,
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Bold
                    )
                    val statusSubtitle = when {
                        playbackState.isWaitingInSilenceGap ->
                            "فجوة صمت لترديد المتعلم خلف الشيخ (${playbackState.silenceGapSeconds} ث)..."
                        playbackState.isBuffering ->
                            "جاري تحضير التلاوة الصوتية..."
                        playbackState.errorMessage != null ->
                            playbackState.errorMessage
                        else ->
                            "الآية ${playbackState.currentAyah.toArabicDigits(useEasternDigits)} • التكرار ${playbackState.currentRepeatIteration.toArabicDigits(useEasternDigits)}/${if (playbackState.repeatTarget == 99) "∞" else playbackState.repeatTarget.toArabicDigits(useEasternDigits)}"
                    }
                    Text(
                        text = statusSubtitle,
                        style = MaterialTheme.typography.bodySmall,
                        color = if (playbackState.errorMessage != null) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(
                        onClick = onTogglePlayPause,
                        modifier = Modifier
                            .size(48.dp)
                            .clip(CircleShape)
                            .background(RoyalEmerald)
                            .testTag("audio_play_pause_button")
                    ) {
                        if (playbackState.isBuffering) {
                            CircularProgressIndicator(
                                color = IlluminatedGoldBright,
                                strokeWidth = 2.dp,
                                modifier = Modifier.size(22.dp)
                            )
                        } else {
                            Icon(
                                imageVector = if (playbackState.isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                                contentDescription = if (playbackState.isPlaying) "إيقاف مؤقت" else "تشغيل التلاوة",
                                tint = Color.White
                            )
                        }
                    }

                    if (playbackState.isPlaying || playbackState.isBuffering) {
                        Spacer(modifier = Modifier.width(6.dp))
                        IconButton(
                            onClick = onStop,
                            modifier = Modifier.size(48.dp).testTag("audio_stop_button")
                        ) {
                            Icon(
                                imageVector = Icons.Default.Stop,
                                contentDescription = "إيقاف",
                                tint = MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Interactive Recitation Controls Row
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth()
            ) {
                SmallControlChip(
                    icon = Icons.Default.Repeat,
                    label = "تكرار: ${if (playbackState.repeatTarget == 99) "∞" else "${playbackState.repeatTarget}×"}",
                    onClick = onCycleRepeat,
                    testTag = "repeat_cycle_chip"
                )
                SmallControlChip(
                    icon = Icons.Default.Speed,
                    label = "${playbackState.playbackSpeed}x",
                    onClick = onCycleSpeed,
                    testTag = "speed_cycle_chip"
                )
                SmallControlChip(
                    icon = Icons.Default.Timer,
                    label = if (playbackState.silenceGapSeconds == 0) "سكتة ترديد: ٠ث" else "سكتة: ${playbackState.silenceGapSeconds}ث",
                    onClick = onCycleSilenceGap,
                    testTag = "silence_gap_chip"
                )
                SmallControlChip(
                    icon = Icons.Default.Timer,
                    label = if (playbackState.sleepTimerRemainingMinutes == 0) "مؤقت نوم" else "${playbackState.sleepTimerRemainingMinutes} د",
                    onClick = onCycleSleepTimer,
                    testTag = "sleep_timer_chip"
                )
            }
        }
    }
}

@Composable
private fun SmallControlChip(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    onClick: () -> Unit,
    testTag: String
) {
    Surface(
        color = MaterialTheme.colorScheme.surface,
        shape = RoundedCornerShape(10.dp),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
        modifier = Modifier
            .clickable { onClick() }
            .testTag(testTag)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = IlluminatedGold,
                modifier = Modifier.size(14.dp)
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurface
            )
        }
    }
}

/**
 * Dialog for reporting a scholarly/content error ("الإبلاغ عن خطأ") per Content Governance rules.
 */
@Composable
fun ReportScholarlyErrorDialog(
    screenName: String,
    referenceKey: String,
    itemTitle: String,
    onDismiss: () -> Unit,
    onSubmitReport: (String) -> Unit
) {
    var reportText by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.Flag,
                    contentDescription = "الإبلاغ عن خطأ",
                    tint = IlluminatedGold
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "الإبلاغ عن ملاحظة أو خطأ علمي",
                    style = MaterialTheme.typography.titleMedium
                )
            }
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(
                    text = "الموضع: $itemTitle ($referenceKey)",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.primary
                )
                Text(
                    text = "تُعرض جميع الملاحظات على لجنة المراجعة العلمية (المجازين في التجويد وعلوم القرآن) لتدقيق النص أو العزو.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                OutlinedTextField(
                    value = reportText,
                    onValueChange = { reportText = it },
                    label = { Text("اكتب ملاحظتك العلمية أو التصحيح المقترح مع المصدر") },
                    minLines = 3,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("error_report_input")
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (reportText.isNotBlank()) {
                        onSubmitReport(reportText)
                        onDismiss()
                    }
                },
                enabled = reportText.isNotBlank(),
                colors = ButtonDefaults.buttonColors(containerColor = RoyalEmerald),
                modifier = Modifier.testTag("submit_error_report_button")
            ) {
                Text("إرسال للمراجعة العلمية")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("إلغاء")
            }
        }
    )
}

/**
 * Helper to share an Ayah with its verified citation via Android ShareSheet.
 */
fun shareFormattedAyahCard(
    context: android.content.Context,
    surahNameAr: String,
    ayahNumber: Int,
    uthmaniText: String,
    tafsirSnippet: String,
    tafsirSource: String
) {
    val shareBody = """
        ✨ من تطبيق إتقان — معلم القرآن وعلومه ✨
        
        ﴿ $uthmaniText ﴾
        [سورة $surahNameAr : الآية $ayahNumber]
        
        📖 $tafsirSource:
        $tafsirSnippet
    """.trimIndent()

    val sendIntent = Intent(Intent.ACTION_SEND).apply {
        type = "text/plain"
        putExtra(Intent.EXTRA_TEXT, shareBody)
    }
    val chooser = Intent.createChooser(sendIntent, "مشاركة الآية وتفسيرها الموثق")
    context.startActivity(chooser)
}
