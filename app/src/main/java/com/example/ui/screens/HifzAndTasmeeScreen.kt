package com.example.ui.screens

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.speech.RecognizerIntent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
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
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.GraphicEq
import androidx.compose.material.icons.filled.Lightbulb
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.PanTool
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material.icons.filled.Quiz
import androidx.compose.material.icons.filled.RecordVoiceOver
import androidx.compose.material.icons.filled.Replay
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material.icons.filled.WarningAmber
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.data.audio.HalqahTeacherPersonaStatus
import com.example.data.audio.LiveHalqahTeacherManager
import com.example.data.audio.LiveWordStatus
import com.example.data.local.AyahEntity
import com.example.data.local.FsrsReviewEntity
import com.example.data.repository.UserPreferencesState
import com.example.domain.model.SurahMetadata
import com.example.domain.model.VoiceRecitationReport
import com.example.domain.model.WordDiffStatus
import com.example.ui.theme.AmiriFontFamily
import com.example.ui.theme.CairoFontFamily
import com.example.ui.theme.IlluminatedGold
import com.example.ui.theme.IlluminatedGoldBright
import com.example.ui.theme.RoyalEmerald
import com.example.ui.theme.RoyalEmeraldDark
import com.example.ui.theme.TajweedGhunnahGreen
import com.example.ui.theme.TajweedIkhfaOrange
import com.example.ui.theme.TajweedMaddRed
import com.example.ui.theme.toArabicDigits

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun HifzAndTasmeeScreen(
    userPrefs: UserPreferencesState,
    surahCatalog: List<SurahMetadata>,
    allCachedAyahs: List<AyahEntity>,
    fsrsReviews: List<FsrsReviewEntity>,
    voiceReport: VoiceRecitationReport?,
    onGradeFsrsReview: (FsrsReviewEntity, Int) -> Unit,
    onAddHifzPlan: (Int, Int, Int, Int) -> Unit,
    onEvaluateVoiceRecitation: (AyahEntity, String) -> Unit,
    onClearVoiceReport: () -> Unit,
    onPlayReferenceAyahAudio: (AyahEntity) -> Unit = {},
    mistakeLogs: List<com.example.data.local.MistakeLogEntity> = com.example.data.local.ItqanPhase2SeedData.buildInitialMistakeLogs(),
    groupHalqahs: List<com.example.domain.model.CloudGroupHalqah> = com.example.data.local.ItqanPhase2SeedData.defaultGroupHalqahs,
    onRecordRecitationMistake: (Int, String, Int, Int, String, String, String) -> Unit = { _, _, _, _, _, _, _ -> },
    onToggleMistakeResolved: (String, Boolean) -> Unit = { _, _ -> },
    onJoinOrCompleteGroupHalqahWird: (String) -> Unit = {},
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    // 0 = حلقة الشيخ الصوتية, 1 = جدولة FSRS, 2 = اختبارات التسميع, 3 = سجل الأخطاء, 4 = الحلقات الجماعية
    var selectedTab by remember { mutableIntStateOf(0) }
    var showAddPlanDialog by remember { mutableStateOf(false) }

    // Interactive Tasmee' state
    var tasmeeSubMode by remember { mutableIntStateOf(0) }
    var activeAyahIndex by remember { mutableIntStateOf(0) }
    var isAyahRevealed by remember { mutableStateOf(false) }
    var selectedWordChoice by remember { mutableStateOf<String?>(null) }

    // Voice Halqah state
    var voiceAyahIndex by remember { mutableIntStateOf(0) }
    var manualTranscriptInput by remember { mutableStateOf("") }
    var customQuestionForSheikh by remember { mutableStateOf("") }
    var voicePermissionMessage by remember { mutableStateOf<String?>(null) }

    val availableAyahs = if (allCachedAyahs.isNotEmpty()) allCachedAyahs else emptyList()
    val currentTasmeeAyah = availableAyahs.getOrNull(activeAyahIndex % availableAyahs.size.coerceAtLeast(1))
    val currentVoiceAyah = availableAyahs.getOrNull(voiceAyahIndex % availableAyahs.size.coerceAtLeast(1))
    val latestAvailableAyahs by androidx.compose.runtime.rememberUpdatedState(availableAyahs)
    val latestVoiceAyah by androidx.compose.runtime.rememberUpdatedState(currentVoiceAyah)

    // Real-Time Live Halqah Teacher Engine 2.0
    val halqahManager = remember(context) {
        LiveHalqahTeacherManager(
            context = context,
            onVerseCompletedWithScore = { completedKey, _ ->
                val matchedAyah = latestAvailableAyahs.find { it.compositeKey == completedKey } ?: latestVoiceAyah
                if (matchedAyah != null) {
                    onEvaluateVoiceRecitation(matchedAyah, matchedAyah.uthmaniText)
                }
            },
            onMistakeLogged = { surahNum, surahName, ayahNum, wordIdx, expectedW, spokenW, tajweedH ->
                onRecordRecitationMistake(surahNum, surahName, ayahNum, wordIdx, expectedW, spokenW, tajweedH)
            },
            onAdvanceToNextAyahInQueue = {
                voiceAyahIndex++
            }
        )
    }
    val halqahState by halqahManager.state.collectAsStateWithLifecycle()

    DisposableEffect(halqahManager) {
        onDispose {
            halqahManager.release()
        }
    }

    LaunchedEffect(availableAyahs, voiceAyahIndex) {
        if (availableAyahs.isNotEmpty()) {
            halqahManager.setMultiAyahQueue(availableAyahs, voiceAyahIndex % availableAyahs.size)
        }
    }

    LaunchedEffect(currentVoiceAyah?.compositeKey) {
        if (currentVoiceAyah != null && !halqahState.isContinuousMicActive) {
            halqahManager.loadVerseForHalqah(currentVoiceAyah)
        }
    }

    // Fallback System SpeechRecognizer Intent Launcher (when continuous recognizer is unavailable)
    val speechRecognizerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val matches = result.data?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)
            val bestTranscript = matches?.firstOrNull().orEmpty()
            if (bestTranscript.isNotBlank() && currentVoiceAyah != null) {
                manualTranscriptInput = bestTranscript
                halqahManager.processStreamingTranscript(bestTranscript, isFinalChunk = true)
                onEvaluateVoiceRecitation(currentVoiceAyah, bestTranscript)
            }
        }
    }

    val recordAudioPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            voicePermissionMessage = null
            halqahManager.startLiveHalqahSession()
        } else {
            voicePermissionMessage =
                "لم يتم منح إذن الميكروفون؛ يمكنك استخدام أزرار المحاكاة الحية أو التسميع المباشر أدناه لتجربة استيقاف الشيخ وتصحيحه الفوري."
        }
    }

    val unresolvedMistakesCount = mistakeLogs.count { !it.isResolved }

    Column(
        modifier = modifier
            .fillMaxSize()
            .testTag("hifz_and_tasmee_screen")
    ) {
        androidx.compose.material3.ScrollableTabRow(
            selectedTabIndex = selectedTab,
            edgePadding = 4.dp
        ) {
            Tab(
                selected = selectedTab == 0,
                onClick = { selectedTab = 0 },
                text = { Text("حلقة الشيخ الصوتية") },
                icon = { Icon(Icons.Default.RecordVoiceOver, contentDescription = null) },
                modifier = Modifier.testTag("hifz_voice_tab")
            )
            Tab(
                selected = selectedTab == 1,
                onClick = { selectedTab = 1 },
                text = { Text("جدولة FSRS") },
                icon = { Icon(Icons.Default.Psychology, contentDescription = null) },
                modifier = Modifier.testTag("hifz_fsrs_tab")
            )
            Tab(
                selected = selectedTab == 2,
                onClick = { selectedTab = 2 },
                text = { Text("اختبارات التسميع") },
                icon = { Icon(Icons.Default.Quiz, contentDescription = null) },
                modifier = Modifier.testTag("hifz_interactive_tab")
            )
            Tab(
                selected = selectedTab == 3,
                onClick = { selectedTab = 3 },
                text = { Text("سجل الأخطاء (${unresolvedMistakesCount.toArabicDigits(userPrefs.useEasternArabicDigits)})") },
                icon = { Icon(Icons.Default.WarningAmber, contentDescription = null) },
                modifier = Modifier.testTag("hifz_mistakes_tab")
            )
            Tab(
                selected = selectedTab == 4,
                onClick = { selectedTab = 4 },
                text = { Text("الحلقات الجماعية") },
                icon = { Icon(Icons.Default.AutoAwesome, contentDescription = null) },
                modifier = Modifier.testTag("hifz_group_halqah_tab")
            )
        }

        when (selectedTab) {
            0 -> {
                // LIVE INTERACTIVE VOICE HALQAH WITH THE SHEIKH (حلقة التسميع الحي مع الشيخ المقرئ)
                LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp),
                    modifier = Modifier
                        .fillMaxSize()
                        .testTag("live_halqah_voice_container")
                ) {
                    // 1. Live Sheikh Persona & Spoken Feedback Console
                    item {
                        val isInterrupted = halqahState.personaStatus == HalqahTeacherPersonaStatus.INTERRUPTING_CORRECTING
                        val headerContainerColor = when (halqahState.personaStatus) {
                            HalqahTeacherPersonaStatus.INTERRUPTING_CORRECTING -> Color(0xFF6A1B1B)
                            HalqahTeacherPersonaStatus.PROMPTING_HESITATION -> Color(0xFF4E342E)
                            HalqahTeacherPersonaStatus.PRAISING_COMPLETION -> Color(0xFF0B3B2E)
                            else -> RoyalEmerald
                        }

                        Card(
                            shape = RoundedCornerShape(22.dp),
                            colors = CardDefaults.cardColors(containerColor = headerContainerColor),
                            border = BorderStroke(
                                width = if (isInterrupted) 2.5.dp else 1.5.dp,
                                color = if (isInterrupted) Color(0xFFFF8A80) else IlluminatedGold
                            ),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("sheikh_live_persona_card")
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Surface(
                                            shape = CircleShape,
                                            color = IlluminatedGold.copy(alpha = 0.22f),
                                            border = BorderStroke(1.dp, IlluminatedGoldBright)
                                        ) {
                                            Icon(
                                                imageVector = if (isInterrupted) Icons.Default.PanTool else Icons.Default.RecordVoiceOver,
                                                contentDescription = null,
                                                tint = IlluminatedGoldBright,
                                                modifier = Modifier
                                                    .padding(10.dp)
                                                    .size(24.dp)
                                            )
                                        }
                                        Spacer(modifier = Modifier.width(10.dp))
                                        Column {
                                            Text(
                                                text = "الشيخ المقرئ التفاعلي (حلقة تسميع حية)",
                                                fontFamily = CairoFontFamily,
                                                style = MaterialTheme.typography.titleMedium,
                                                fontWeight = FontWeight.Bold,
                                                color = IlluminatedGoldBright
                                            )
                                            Text(
                                                text = halqahState.personaStatus.labelAr,
                                                fontFamily = CairoFontFamily,
                                                style = MaterialTheme.typography.labelSmall,
                                                color = Color.White.copy(alpha = 0.9f)
                                            )
                                        }
                                    }

                                    // Accuracy Badge
                                    Surface(
                                        color = Color.Black.copy(alpha = 0.28f),
                                        shape = RoundedCornerShape(12.dp),
                                        border = BorderStroke(1.dp, IlluminatedGoldBright.copy(alpha = 0.6f))
                                    ) {
                                        Text(
                                            text = "الإتقان: ${halqahState.accuracyPercent.toArabicDigits(userPrefs.useEasternArabicDigits)}%",
                                            style = MaterialTheme.typography.labelMedium,
                                            color = IlluminatedGoldBright,
                                            fontWeight = FontWeight.Bold,
                                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(12.dp))

                                // Live Audio Level Wave Indicator when Listening or Speaking
                                if (halqahState.isContinuousMicActive || halqahState.isSheikhSpeaking) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Icon(
                                            imageVector = if (halqahState.isSheikhSpeaking) Icons.AutoMirrored.Filled.VolumeUp else Icons.Default.GraphicEq,
                                            contentDescription = null,
                                            tint = IlluminatedGoldBright,
                                            modifier = Modifier.size(18.dp)
                                        )
                                        LinearProgressIndicator(
                                            progress = {
                                                if (halqahState.isSheikhSpeaking) 0.85f
                                                else halqahState.rmsLevel.coerceIn(0.12f, 1.0f)
                                            },
                                            color = IlluminatedGoldBright,
                                            trackColor = Color.White.copy(alpha = 0.2f),
                                            modifier = Modifier
                                                .weight(1f)
                                                .height(6.dp)
                                                .clip(RoundedCornerShape(4.dp))
                                        )
                                        Text(
                                            text = if (halqahState.isSheikhSpeaking) "الشيخ يتحدث..." else "يستمع لصوتك...",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = IlluminatedGoldBright
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(10.dp))
                                }

                                // Sheikh Spoken Bubble
                                Surface(
                                    color = Color.Black.copy(alpha = 0.25f),
                                    shape = RoundedCornerShape(14.dp),
                                    border = BorderStroke(1.dp, IlluminatedGold.copy(alpha = 0.45f)),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Column(modifier = Modifier.padding(12.dp)) {
                                        Text(
                                            text = "🗣️ توجيه الشيخ الصوتي الآن:",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = IlluminatedGoldBright,
                                            fontWeight = FontWeight.Bold
                                        )
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(
                                            text = halqahState.sheikhSpeechBubble,
                                            fontFamily = CairoFontFamily,
                                            style = MaterialTheme.typography.bodyMedium,
                                            color = Color.White,
                                            fontWeight = FontWeight.Medium
                                        )
                                        if (halqahState.livePartialTranscript.isNotBlank()) {
                                            Spacer(modifier = Modifier.height(6.dp))
                                            Text(
                                                text = "🎙️ ما التقطه الميكروفون اللحظي: «${halqahState.livePartialTranscript}»",
                                                style = MaterialTheme.typography.labelSmall,
                                                color = IlluminatedGoldBright
                                            )
                                        }
                                    }
                                }

                                Spacer(modifier = Modifier.height(10.dp))

                                // Repeat Sheikh Voice & Listen to Reference Reciter Row
                                Row(
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    OutlinedButton(
                                        onClick = { halqahManager.speakAsSheikh(halqahState.sheikhSpeechBubble) },
                                        border = BorderStroke(1.dp, IlluminatedGoldBright),
                                        colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White),
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Icon(Icons.AutoMirrored.Filled.VolumeUp, contentDescription = null, modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("إعادة نطق الشيخ", style = MaterialTheme.typography.labelSmall)
                                    }

                                    if (currentVoiceAyah != null) {
                                        OutlinedButton(
                                            onClick = { onPlayReferenceAyahAudio(currentVoiceAyah) },
                                            border = BorderStroke(1.dp, IlluminatedGoldBright),
                                            colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White),
                                            modifier = Modifier.weight(1f)
                                        ) {
                                            Icon(Icons.Default.PlayArrow, contentDescription = null, modifier = Modifier.size(16.dp))
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("تلاوة الشيخ الحصري", style = MaterialTheme.typography.labelSmall)
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // 2. Immediate Interruption Alert Card (shown when the Sheikh stops the student on a mistake!)
                    item {
                        AnimatedVisibility(visible = halqahState.activeInterruption != null) {
                            val alert = halqahState.activeInterruption
                            if (alert != null) {
                                Card(
                                    shape = RoundedCornerShape(18.dp),
                                    colors = CardDefaults.cardColors(
                                        containerColor = MaterialTheme.colorScheme.errorContainer
                                    ),
                                    border = BorderStroke(2.dp, TajweedMaddRed),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .testTag("sheikh_interruption_alert_card")
                                ) {
                                    Column(modifier = Modifier.padding(16.dp)) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Icon(
                                                imageVector = Icons.Default.PanTool,
                                                contentDescription = null,
                                                tint = TajweedMaddRed
                                            )
                                            Spacer(modifier = Modifier.width(8.dp))
                                            Text(
                                                text = "استيقاف وتصحيح فوري من الشيخ المقرئ!",
                                                style = MaterialTheme.typography.titleMedium,
                                                fontWeight = FontWeight.Bold,
                                                color = MaterialTheme.colorScheme.onErrorContainer
                                            )
                                        }
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Text(
                                            text = "• الكلمة التي نطقتَها: «${alert.spokenWord}»\n" +
                                                "• الصواب في المصحف الشريف: ﴿ ${alert.expectedWord} ﴾\n" +
                                                "• التنبيه التجويدي: ${alert.tajweedCoachingNote}",
                                            style = MaterialTheme.typography.bodyMedium,
                                            color = MaterialTheme.colorScheme.onErrorContainer,
                                            fontWeight = FontWeight.SemiBold
                                        )
                                        Spacer(modifier = Modifier.height(10.dp))
                                        Row(
                                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                                            modifier = Modifier.fillMaxWidth()
                                        ) {
                                            Button(
                                                onClick = { halqahManager.resumeFromCorrectedWord() },
                                                colors = ButtonDefaults.buttonColors(
                                                    containerColor = RoyalEmerald,
                                                    contentColor = Color.White
                                                ),
                                                modifier = Modifier
                                                    .weight(1f)
                                                    .testTag("resume_after_interruption_button")
                                            ) {
                                                Icon(Icons.Default.Replay, contentDescription = null, modifier = Modifier.size(16.dp))
                                                Spacer(modifier = Modifier.width(6.dp))
                                                Text("أعد الكلمة وتابع التسميع")
                                            }
                                            OutlinedButton(
                                                onClick = {
                                                    halqahManager.askAiSheikhByVoice(
                                                        "أخطأت في كلمة ${alert.expectedWord} فنطقتها ${alert.spokenWord}، اشرح لي مخرجها وحكمها التجويدي وكيف أتقنها"
                                                    )
                                                },
                                                modifier = Modifier.weight(1f)
                                            ) {
                                                Icon(Icons.Default.AutoAwesome, contentDescription = null, modifier = Modifier.size(16.dp))
                                                Spacer(modifier = Modifier.width(4.dp))
                                                Text("اشرح لي الخطأ صوتياً", style = MaterialTheme.typography.labelSmall)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // 3. Real-Time Word-by-Word Mushaf Follow-Along Board (لوح المتابعة اللحظية كلمة بكلمة)
                    if (currentVoiceAyah != null) {
                        item {
                            Card(
                                shape = RoundedCornerShape(20.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                border = BorderStroke(1.5.dp, IlluminatedGold),
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
                                                text = "سورة ${currentVoiceAyah.surahNameAr} — الآية ${currentVoiceAyah.ayahNumber.toArabicDigits(userPrefs.useEasternArabicDigits)}",
                                                style = MaterialTheme.typography.titleMedium,
                                                fontWeight = FontWeight.Bold,
                                                color = MaterialTheme.colorScheme.primary
                                            )
                                            Text(
                                                text = "انقر على أي كلمة لسماع نطقها وتنبيهها التجويدي من الشيخ",
                                                style = MaterialTheme.typography.labelSmall,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }
                                        Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                            OutlinedButton(
                                                onClick = {
                                                    if (voiceAyahIndex > 0) voiceAyahIndex-- else voiceAyahIndex = (availableAyahs.size - 1).coerceAtLeast(0)
                                                    onClearVoiceReport()
                                                }
                                            ) {
                                                Text("السابقة", style = MaterialTheme.typography.labelSmall)
                                            }
                                            Button(
                                                onClick = {
                                                    voiceAyahIndex++
                                                    onClearVoiceReport()
                                                },
                                                colors = ButtonDefaults.buttonColors(containerColor = RoyalEmerald)
                                            ) {
                                                Text("الآية التالية ←", style = MaterialTheme.typography.labelSmall)
                                            }
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(14.dp))

                                    // Word-by-Word Interactive Grid
                                    FlowRow(
                                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                                        verticalArrangement = Arrangement.spacedBy(10.dp),
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .testTag("live_word_by_word_board")
                                    ) {
                                        halqahState.words.forEach { wordItem ->
                                            val isCurrent = wordItem.status == LiveWordStatus.CURRENT_TARGET
                                            val isMatched = wordItem.status == LiveWordStatus.MATCHED_CORRECT
                                            val isError = wordItem.status == LiveWordStatus.INTERRUPTED_MISTAKE
                                            val isPrompted = wordItem.status == LiveWordStatus.PROMPTED_BY_SHEIKH

                                            val chipBg = when (wordItem.status) {
                                                LiveWordStatus.MATCHED_CORRECT -> TajweedGhunnahGreen.copy(alpha = 0.16f)
                                                LiveWordStatus.INTERRUPTED_MISTAKE -> TajweedMaddRed.copy(alpha = 0.22f)
                                                LiveWordStatus.PROMPTED_BY_SHEIKH -> TajweedIkhfaOrange.copy(alpha = 0.20f)
                                                LiveWordStatus.CURRENT_TARGET -> IlluminatedGold.copy(alpha = 0.24f)
                                                LiveWordStatus.PENDING -> MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.55f)
                                            }

                                            val chipBorder = when (wordItem.status) {
                                                LiveWordStatus.MATCHED_CORRECT -> TajweedGhunnahGreen
                                                LiveWordStatus.INTERRUPTED_MISTAKE -> TajweedMaddRed
                                                LiveWordStatus.PROMPTED_BY_SHEIKH -> TajweedIkhfaOrange
                                                LiveWordStatus.CURRENT_TARGET -> IlluminatedGold
                                                LiveWordStatus.PENDING -> MaterialTheme.colorScheme.outline.copy(alpha = 0.4f)
                                            }

                                            val displayedWordText = when {
                                                isMatched || isError || isPrompted -> wordItem.uthmaniWord
                                                isCurrent && !halqahState.hideUnrecitedWords -> wordItem.uthmaniWord
                                                isCurrent && halqahState.hideUnrecitedWords -> "﴿ ؟؟؟ ﴾"
                                                !halqahState.hideUnrecitedWords -> wordItem.uthmaniWord
                                                else -> "• • •"
                                            }

                                            val statusCaption = when (wordItem.status) {
                                                LiveWordStatus.MATCHED_CORRECT -> "✓ متقن"
                                                LiveWordStatus.INTERRUPTED_MISTAKE -> "✗ نطقت: ${wordItem.spokenAttempt ?: ""}"
                                                LiveWordStatus.PROMPTED_BY_SHEIKH -> "💡 فتح الشيخ"
                                                LiveWordStatus.CURRENT_TARGET -> "🎙️ اقرأ الآن"
                                                LiveWordStatus.PENDING -> "الكلـمة ${(wordItem.index + 1).toArabicDigits(userPrefs.useEasternArabicDigits)}"
                                            }

                                            Surface(
                                                color = chipBg,
                                                shape = RoundedCornerShape(14.dp),
                                                border = BorderStroke(if (isCurrent || isError) 2.dp else 1.dp, chipBorder),
                                                modifier = Modifier
                                                    .clickable {
                                                        halqahManager.speakAsSheikh(
                                                            "كلمة ${wordItem.uthmaniWord}، ${wordItem.tajweedHint}"
                                                        )
                                                    }
                                                    .testTag("halqah_word_${wordItem.index}")
                                            ) {
                                                Column(
                                                    horizontalAlignment = Alignment.CenterHorizontally,
                                                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp)
                                                ) {
                                                    Text(
                                                        text = displayedWordText,
                                                        fontFamily = AmiriFontFamily,
                                                        fontSize = 24.sp,
                                                        fontWeight = FontWeight.Bold,
                                                        color = MaterialTheme.colorScheme.onSurface
                                                    )
                                                    Text(
                                                        text = statusCaption,
                                                        style = MaterialTheme.typography.labelSmall,
                                                        color = if (isError) TajweedMaddRed else MaterialTheme.colorScheme.onSurfaceVariant,
                                                        fontWeight = if (isCurrent || isError) FontWeight.Bold else FontWeight.Normal
                                                    )
                                                }
                                            }
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(14.dp))

                                    // Primary Live Halqah Microphone & Prompt Buttons
                                    Row(
                                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Button(
                                            onClick = {
                                                if (halqahState.isContinuousMicActive) {
                                                    halqahManager.stopLiveHalqahSession()
                                                } else {
                                                    val hasPerm = ContextCompat.checkSelfPermission(
                                                        context,
                                                        Manifest.permission.RECORD_AUDIO
                                                    ) == PackageManager.PERMISSION_GRANTED
                                                    if (hasPerm) {
                                                        halqahManager.startLiveHalqahSession()
                                                    } else {
                                                        recordAudioPermissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
                                                    }
                                                }
                                            },
                                            colors = ButtonDefaults.buttonColors(
                                                containerColor = if (halqahState.isContinuousMicActive) TajweedMaddRed else RoyalEmerald,
                                                contentColor = Color.White
                                            ),
                                            modifier = Modifier
                                                .weight(1.3f)
                                                .height(52.dp)
                                                .testTag("start_voice_tasmee_mic_button")
                                        ) {
                                            Icon(
                                                imageVector = if (halqahState.isContinuousMicActive) Icons.Default.Stop else Icons.Default.Mic,
                                                contentDescription = null
                                            )
                                            Spacer(modifier = Modifier.width(6.dp))
                                            Text(
                                                text = if (halqahState.isContinuousMicActive) "إيقاف الحلقة الصوتية" else "بدء التسميع الحي بالصوت",
                                                fontWeight = FontWeight.Bold
                                            )
                                        }

                                        OutlinedButton(
                                            onClick = { halqahManager.promptCurrentWordBySheikh() },
                                            border = BorderStroke(1.5.dp, IlluminatedGold),
                                            modifier = Modifier
                                                .weight(1f)
                                                .height(52.dp)
                                                .testTag("sheikh_prompt_word_button")
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.Lightbulb,
                                                contentDescription = null,
                                                tint = IlluminatedGold
                                            )
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("افتح عليّ يا شيخ", fontWeight = FontWeight.Bold)
                                        }
                                    }

                                    if (voicePermissionMessage != null) {
                                        Spacer(modifier = Modifier.height(6.dp))
                                        Text(
                                            text = voicePermissionMessage!!,
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.primary
                                        )
                                    }

                                    Spacer(modifier = Modifier.height(12.dp))
                                    HorizontalDivider()
                                    Spacer(modifier = Modifier.height(10.dp))

                                    // 4. Interactive Live Halqah Simulation Controls (for immediate testing of real-time follow-along & interruption)
                                    Text(
                                        text = "⚡ معاينة تفاعلية فورية لسلوك الشيخ المقرئ (متابعة حية + استيقاف وتصحيح بالصوت والشاشة):",
                                        style = MaterialTheme.typography.labelMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Row(
                                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Button(
                                            onClick = { halqahManager.simulateLiveCorrectRecitationFlow() },
                                            colors = ButtonDefaults.buttonColors(
                                                containerColor = TajweedGhunnahGreen,
                                                contentColor = Color.White
                                            ),
                                            modifier = Modifier
                                                .weight(1f)
                                                .testTag("simulate_live_correct_flow_button")
                                        ) {
                                            Icon(Icons.Default.PlayArrow, contentDescription = null, modifier = Modifier.size(16.dp))
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("محاكاة متابعة كلمة بكلمة", style = MaterialTheme.typography.labelSmall)
                                        }

                                        Button(
                                            onClick = { halqahManager.simulateStudentMistakeAndSheikhInterruption() },
                                            colors = ButtonDefaults.buttonColors(
                                                containerColor = TajweedMaddRed,
                                                contentColor = Color.White
                                            ),
                                            modifier = Modifier
                                                .weight(1f)
                                                .testTag("simulate_sheikh_interruption_button")
                                        ) {
                                            Icon(Icons.Default.PanTool, contentDescription = null, modifier = Modifier.size(16.dp))
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("محاكاة خطأ واستيقاف الشيخ", style = MaterialTheme.typography.labelSmall)
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(12.dp))

                                    // Halqah Behavior Toggles
                                    Row(
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Text(
                                            text = "استيقاف الشيخ الفوري عند الخطأ بالصوت والشاشة",
                                            style = MaterialTheme.typography.bodySmall
                                        )
                                        Switch(
                                            checked = halqahState.autoInterruptOnMistake,
                                            onCheckedChange = { halqahManager.toggleAutoInterrupt(it) }
                                        )
                                    }
                                    Row(
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Text(
                                            text = "إخفاء كلمات الآية قبل نطقها (تسميع غيبي حقيقي)",
                                            style = MaterialTheme.typography.bodySmall
                                        )
                                        Switch(
                                            checked = halqahState.hideUnrecitedWords,
                                            onCheckedChange = { halqahManager.toggleHideUnrecitedWords(it) }
                                        )
                                    }
                                    Row(
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Text(
                                            text = "الفتح التلقائي على الطالب عند التوقف ٥ ثوانٍ",
                                            style = MaterialTheme.typography.bodySmall
                                        )
                                        Switch(
                                            checked = halqahState.autoPromptOnHesitation,
                                            onCheckedChange = { halqahManager.toggleAutoPromptOnHesitation(it) }
                                        )
                                    }
                                    Row(
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Text(
                                            text = "تسميع مقطع متعدد الآيات متواصل دون توقف بين الآيات",
                                            style = MaterialTheme.typography.bodySmall,
                                            fontWeight = FontWeight.SemiBold,
                                            color = MaterialTheme.colorScheme.primary
                                        )
                                        Switch(
                                            checked = halqahState.continuousMultiAyahMode,
                                            onCheckedChange = { halqahManager.toggleContinuousMultiAyahMode(it) },
                                            modifier = Modifier.testTag("toggle_continuous_multi_ayah_switch")
                                        )
                                    }
                                }
                            }
                        }

                        // 4b. Student Voice Recording & Waveform Comparison with Sheikh Al-Husary + Makharij Diagnosis
                        item {
                            com.example.ui.components.HusaryWaveformComparisonCard(
                                studentWaveform = halqahState.studentWaveformSamples,
                                husaryWaveform = halqahState.husaryReferenceWaveform,
                                similarityPercent = halqahState.waveformSimilarityPercent,
                                makhrajSummary = halqahState.makhrajDiagnosisSummary,
                                useEasternDigits = userPrefs.useEasternArabicDigits,
                                onRecordAndCompare = { halqahManager.recordAndCompareWithHusary() },
                                onPlayHusaryReference = { onPlayReferenceAyahAudio(currentVoiceAyah) }
                            )
                        }

                        // 5. Conversational Voice Model with the AI Sheikh (تحدث صوتياً مع الشيخ المقرئ الذكي)
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
                                            imageVector = Icons.Default.AutoAwesome,
                                            contentDescription = null,
                                            tint = IlluminatedGold
                                        )
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Column {
                                            Text(
                                                text = "المحادثة الصوتية مع الشيخ المقرئ الذكي (Gemini Voice Halqah)",
                                                style = MaterialTheme.typography.titleSmall,
                                                fontWeight = FontWeight.Bold
                                            )
                                            Text(
                                                text = "تحدث مع الشيخ أو اسأله عن حكم تجويدي أو مخرج حرف وسيجيبك صوتياً ونصياً كالمعلم الطبيعي",
                                                style = MaterialTheme.typography.bodySmall,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(10.dp))

                                    OutlinedTextField(
                                        value = customQuestionForSheikh,
                                        onValueChange = { customQuestionForSheikh = it },
                                        placeholder = { Text("مثال: يا شيخ كيف أحقق مخرج هذه الكلمة وما حكم التجويد فيها؟") },
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .testTag("ask_ai_sheikh_voice_input")
                                    )

                                    Spacer(modifier = Modifier.height(8.dp))

                                    Row(
                                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Button(
                                            onClick = {
                                                val q = customQuestionForSheikh.ifBlank {
                                                    "اشرح لي كيف أقرأ هذه الآية الكريمة بإتقان وما أهم أحكام التجويد فيها"
                                                }
                                                halqahManager.askAiSheikhByVoice(q)
                                            },
                                            enabled = !halqahState.isAiThinking,
                                            colors = ButtonDefaults.buttonColors(containerColor = RoyalEmerald),
                                            modifier = Modifier
                                                .weight(1f)
                                                .testTag("ask_ai_sheikh_voice_button")
                                        ) {
                                            if (halqahState.isAiThinking) {
                                                CircularProgressIndicator(
                                                    color = IlluminatedGoldBright,
                                                    strokeWidth = 2.dp,
                                                    modifier = Modifier.size(18.dp)
                                                )
                                                Spacer(modifier = Modifier.width(6.dp))
                                                Text("الشيخ يحضر الجواب...")
                                            } else {
                                                Icon(Icons.AutoMirrored.Filled.VolumeUp, contentDescription = null, modifier = Modifier.size(16.dp))
                                                Spacer(modifier = Modifier.width(6.dp))
                                                Text("تحدث مع الشيخ واستمع لجوابه")
                                            }
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(12.dp))
                                    HorizontalDivider()
                                    Spacer(modifier = Modifier.height(10.dp))

                                    // Direct Full-Verse or Word Verification Input
                                    Text(
                                        text = "إدخال أو لصق تسميع نصي/صوتي مباشر للمطابقة الكاملة:",
                                        style = MaterialTheme.typography.labelMedium
                                    )
                                    Spacer(modifier = Modifier.height(6.dp))
                                    OutlinedTextField(
                                        value = manualTranscriptInput,
                                        onValueChange = { manualTranscriptInput = it },
                                        placeholder = { Text("اكتب أو انطق الكلمة أو الآية هنا...") },
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .testTag("voice_transcript_input")
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Row(
                                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        OutlinedButton(
                                            onClick = {
                                                manualTranscriptInput = currentVoiceAyah.plainSearchText
                                                halqahManager.processStreamingTranscript(manualTranscriptInput, isFinalChunk = true)
                                                onEvaluateVoiceRecitation(currentVoiceAyah, manualTranscriptInput)
                                            },
                                            modifier = Modifier.weight(1f)
                                        ) {
                                            Text("تجربة تسميع متقن ١٠٠٪", style = MaterialTheme.typography.labelSmall)
                                        }
                                        Button(
                                            onClick = {
                                                halqahManager.processStreamingTranscript(manualTranscriptInput, isFinalChunk = true)
                                                onEvaluateVoiceRecitation(currentVoiceAyah, manualTranscriptInput)
                                            },
                                            colors = ButtonDefaults.buttonColors(
                                                containerColor = IlluminatedGold,
                                                contentColor = Color(0xFF06231B)
                                            ),
                                            modifier = Modifier
                                                .weight(1f)
                                                .testTag("verify_voice_recitation_button")
                                        ) {
                                            Icon(Icons.Default.GraphicEq, contentDescription = null, modifier = Modifier.size(16.dp))
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("فحص التسميع", fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // 6. Comprehensive Word Diff Report Card
                    if (voiceReport != null) {
                        item {
                            Card(
                                shape = RoundedCornerShape(20.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                                border = BorderStroke(1.5.dp, IlluminatedGold),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .testTag("voice_recitation_report_card")
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Row(
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Text(
                                            text = "تقرير المطابقة اللفظية التفصيلي للآية",
                                            style = MaterialTheme.typography.titleSmall,
                                            fontWeight = FontWeight.Bold
                                        )
                                        Text(
                                            text = "${voiceReport.accuracyPercent.toArabicDigits(userPrefs.useEasternArabicDigits)}%",
                                            style = MaterialTheme.typography.titleLarge,
                                            fontWeight = FontWeight.Bold,
                                            color = if (voiceReport.accuracyPercent >= 80) TajweedGhunnahGreen else TajweedMaddRed
                                        )
                                    }

                                    Spacer(modifier = Modifier.height(10.dp))

                                    FlowRow(
                                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                                        verticalArrangement = Arrangement.spacedBy(8.dp),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        voiceReport.wordDiffs.forEach { diff ->
                                            val bgColor = when (diff.status) {
                                                WordDiffStatus.MATCHED -> TajweedGhunnahGreen.copy(alpha = 0.16f)
                                                WordDiffStatus.SUBSTITUTED -> TajweedIkhfaOrange.copy(alpha = 0.18f)
                                                WordDiffStatus.MISSED -> TajweedMaddRed.copy(alpha = 0.18f)
                                            }
                                            val borderColor = when (diff.status) {
                                                WordDiffStatus.MATCHED -> TajweedGhunnahGreen
                                                WordDiffStatus.SUBSTITUTED -> TajweedIkhfaOrange
                                                WordDiffStatus.MISSED -> TajweedMaddRed
                                            }
                                            val statusLabel = when (diff.status) {
                                                WordDiffStatus.MATCHED -> "مطابق"
                                                WordDiffStatus.SUBSTITUTED -> "مبدّل (${diff.spokenWord ?: ""})"
                                                WordDiffStatus.MISSED -> "متروك"
                                            }

                                            Surface(
                                                color = bgColor,
                                                shape = RoundedCornerShape(10.dp),
                                                border = BorderStroke(1.dp, borderColor)
                                            ) {
                                                Column(
                                                    horizontalAlignment = Alignment.CenterHorizontally,
                                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                                                ) {
                                                    Text(
                                                        text = diff.expectedWord,
                                                        fontFamily = AmiriFontFamily,
                                                        fontSize = 20.sp,
                                                        fontWeight = FontWeight.Bold
                                                    )
                                                    Text(
                                                        text = statusLabel,
                                                        style = MaterialTheme.typography.labelSmall,
                                                        color = borderColor
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
            }
            1 -> {
                // FSRS Spaced Repetition Dashboard
                LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.fillMaxSize()
                ) {
                    item {
                        Card(
                            shape = RoundedCornerShape(18.dp),
                            colors = CardDefaults.cardColors(containerColor = RoyalEmerald),
                            border = BorderStroke(1.dp, IlluminatedGold),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp)
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = "نظام الحفظ والمراجعة المتباعدة (FSRS)",
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = IlluminatedGold
                                    )
                                    Text(
                                        text = "يضبط فترات المراجعة تلقائياً وفق استقرار الحفظ (Stability) وصعوبة المقطع (Difficulty).",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = Color(0xFFFAF6EE)
                                    )
                                }
                                Spacer(modifier = Modifier.width(10.dp))
                                Button(
                                    onClick = { showAddPlanDialog = true },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = IlluminatedGold,
                                        contentColor = Color(0xFF06231B)
                                    ),
                                    modifier = Modifier.testTag("add_hifz_plan_button")
                                ) {
                                    Icon(Icons.Default.AddCircleOutline, contentDescription = null)
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("خطة جديدة")
                                }
                            }
                        }
                    }

                    items(fsrsReviews, key = { it.itemId }) { review ->
                        Card(
                            shape = RoundedCornerShape(18.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("fsrs_card_${review.itemId}")
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Text(
                                        text = review.title,
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Surface(
                                        color = MaterialTheme.colorScheme.primaryContainer,
                                        shape = RoundedCornerShape(8.dp)
                                    ) {
                                        Text(
                                            text = "الفاصل القادم: ${review.scheduledDays.toArabicDigits(userPrefs.useEasternArabicDigits)} يوم",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.onPrimaryContainer,
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(6.dp))
                                Text(
                                    text = "معامل الاستقرار (S): ${review.stability} يوم • الصعوبة (D): ${review.difficulty}/١٠ • المراجعات: ${review.reps.toArabicDigits(userPrefs.useEasternArabicDigits)}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )

                                Spacer(modifier = Modifier.height(10.dp))
                                Text(
                                    text = "قيّم جودة تسميعك لهذا الورد لتحديث جدولة FSRS:",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = MaterialTheme.colorScheme.primary
                                )
                                Spacer(modifier = Modifier.height(6.dp))
                                Row(
                                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    OutlinedButton(
                                        onClick = { onGradeFsrsReview(review, 1) },
                                        modifier = Modifier.weight(1f).testTag("fsrs_grade_1_${review.itemId}")
                                    ) {
                                        Text("ضعيف", style = MaterialTheme.typography.labelSmall)
                                    }
                                    OutlinedButton(
                                        onClick = { onGradeFsrsReview(review, 2) },
                                        modifier = Modifier.weight(1f).testTag("fsrs_grade_2_${review.itemId}")
                                    ) {
                                        Text("بصعوبة", style = MaterialTheme.typography.labelSmall)
                                    }
                                    OutlinedButton(
                                        onClick = { onGradeFsrsReview(review, 3) },
                                        modifier = Modifier.weight(1f).testTag("fsrs_grade_3_${review.itemId}")
                                    ) {
                                        Text("جيد", style = MaterialTheme.typography.labelSmall)
                                    }
                                    Button(
                                        onClick = { onGradeFsrsReview(review, 4) },
                                        colors = ButtonDefaults.buttonColors(containerColor = RoyalEmerald),
                                        modifier = Modifier.weight(1f).testTag("fsrs_grade_4_${review.itemId}")
                                    ) {
                                        Text("ممتاز", style = MaterialTheme.typography.labelSmall)
                                    }
                                }
                            }
                        }
                    }
                }
            }
            2 -> {
                // Interactive Tasmee' Modes (1. Word Hiding, 2. Ayah Endings, 3. Self-Evaluation Reveal)
                LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp),
                    modifier = Modifier.fillMaxSize()
                ) {
                    item {
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            FilterChip(
                                selected = tasmeeSubMode == 0,
                                onClick = {
                                    tasmeeSubMode = 0
                                    selectedWordChoice = null
                                },
                                label = { Text("إكمال الكلمات") }
                            )
                            FilterChip(
                                selected = tasmeeSubMode == 1,
                                onClick = {
                                    tasmeeSubMode = 1
                                    isAyahRevealed = false
                                },
                                label = { Text("خواتيم الآيات") }
                            )
                            FilterChip(
                                selected = tasmeeSubMode == 2,
                                onClick = {
                                    tasmeeSubMode = 2
                                    isAyahRevealed = false
                                },
                                label = { Text("كشف التقييم الذاتي") }
                            )
                        }
                    }

                    if (currentTasmeeAyah != null) {
                        val words = currentTasmeeAyah.uthmaniText.trim().split(Regex("\\s+")).filter { it.isNotBlank() }
                        val targetHiddenWord = words.lastOrNull() ?: ""
                        val prefixWords = if (words.size > 1) words.dropLast(1).joinToString(" ") else ""

                        item {
                            Card(
                                shape = RoundedCornerShape(20.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                                border = BorderStroke(1.5.dp, IlluminatedGold),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    modifier = Modifier.padding(18.dp)
                                ) {
                                    Text(
                                        text = "سورة ${currentTasmeeAyah.surahNameAr} — الآية ${currentTasmeeAyah.ayahNumber.toArabicDigits(userPrefs.useEasternArabicDigits)}",
                                        style = MaterialTheme.typography.titleSmall,
                                        color = MaterialTheme.colorScheme.primary,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Spacer(modifier = Modifier.height(12.dp))

                                    when (tasmeeSubMode) {
                                        0 -> {
                                            Text(
                                                text = "﴿ $prefixWords [ ........ ] ﴾",
                                                fontFamily = AmiriFontFamily,
                                                fontSize = 24.sp,
                                                lineHeight = 40.sp,
                                                textAlign = TextAlign.Center
                                            )
                                            Spacer(modifier = Modifier.height(12.dp))
                                            Text(
                                                text = "اختر الكلمة الصحيحة المكملة للآية الكريمة:",
                                                style = MaterialTheme.typography.labelMedium
                                            )
                                            Spacer(modifier = Modifier.height(8.dp))
                                            val distractors = listOf(targetHiddenWord, "ٱلْعَلِيمُ", "ٱلْحَكِيمُ", "تَرْتِيلًا").distinct()
                                            FlowRow(
                                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                                verticalArrangement = Arrangement.spacedBy(8.dp)
                                            ) {
                                                distractors.forEach { option ->
                                                    OutlinedButton(
                                                        onClick = { selectedWordChoice = option }
                                                    ) {
                                                        Text(option, fontFamily = AmiriFontFamily, fontSize = 18.sp)
                                                    }
                                                }
                                            }
                                            if (selectedWordChoice != null) {
                                                Spacer(modifier = Modifier.height(10.dp))
                                                val isCorrect = selectedWordChoice == targetHiddenWord
                                                Text(
                                                    text = if (isCorrect) "✓ أحسنت! إكمال صحيح ومتقن" else "✗ الكلمة الصحيحة هي: $targetHiddenWord",
                                                    style = MaterialTheme.typography.titleSmall,
                                                    color = if (isCorrect) TajweedGhunnahGreen else TajweedMaddRed,
                                                    fontWeight = FontWeight.Bold
                                                )
                                            }
                                        }
                                        1 -> {
                                            val firstHalf = words.take((words.size / 2).coerceAtLeast(1)).joinToString(" ")
                                            Text(
                                                text = if (isAyahRevealed) "﴿ ${currentTasmeeAyah.uthmaniText} ﴾" else "﴿ $firstHalf ... [أكمل خاتمة الآية غيباً] ﴾",
                                                fontFamily = AmiriFontFamily,
                                                fontSize = 24.sp,
                                                lineHeight = 40.sp,
                                                textAlign = TextAlign.Center
                                            )
                                            Spacer(modifier = Modifier.height(12.dp))
                                            Button(
                                                onClick = { isAyahRevealed = !isAyahRevealed },
                                                colors = ButtonDefaults.buttonColors(containerColor = RoyalEmerald)
                                            ) {
                                                Icon(
                                                    imageVector = if (isAyahRevealed) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                                    contentDescription = null
                                                )
                                                Spacer(modifier = Modifier.width(6.dp))
                                                Text(if (isAyahRevealed) "إخفاء الخاتمة" else "كشف خاتمة الآية للتحقق")
                                            }
                                        }
                                        else -> {
                                            Text(
                                                text = if (isAyahRevealed) "﴿ ${currentTasmeeAyah.uthmaniText} ﴾" else "• • • [اقرأ الآية غيباً ثم اكشف النص للتقييم الذاتي] • • •",
                                                fontFamily = AmiriFontFamily,
                                                fontSize = 24.sp,
                                                lineHeight = 40.sp,
                                                textAlign = TextAlign.Center
                                            )
                                            Spacer(modifier = Modifier.height(12.dp))
                                            Button(
                                                onClick = { isAyahRevealed = !isAyahRevealed },
                                                colors = ButtonDefaults.buttonColors(containerColor = RoyalEmerald)
                                            ) {
                                                Text(if (isAyahRevealed) "إخفاء الآية" else "كشف نص الآية الكريمة")
                                            }
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(14.dp))
                                    OutlinedButton(
                                        onClick = {
                                            activeAyahIndex++
                                            isAyahRevealed = false
                                            selectedWordChoice = null
                                        },
                                        modifier = Modifier.testTag("next_tasmee_ayah_button")
                                    ) {
                                        Text("الانتقال للآية التالية في الاختبار ←")
                                    }
                                }
                            }
                        }
                    }
                }
            }
            3 -> {
                com.example.ui.components.RecurringMistakesLogTabContent(
                    mistakeLogs = mistakeLogs,
                    useEasternDigits = userPrefs.useEasternArabicDigits,
                    onToggleResolved = onToggleMistakeResolved,
                    onPracticeMistakeAyah = { surahNum, ayahNum ->
                        val foundIndex = availableAyahs.indexOfFirst {
                            it.surahNumber == surahNum && it.ayahNumber == ayahNum
                        }
                        if (foundIndex >= 0) {
                            voiceAyahIndex = foundIndex
                        }
                        selectedTab = 0
                    }
                )
            }
            4 -> {
                com.example.ui.components.CloudGroupHalqahsTabContent(
                    groupHalqahs = groupHalqahs,
                    useEasternDigits = userPrefs.useEasternArabicDigits,
                    onJoinOrLogWird = onJoinOrCompleteGroupHalqahWird
                )
            }
        }
    }

    if (showAddPlanDialog) {
        AddHifzPlanModalDialog(
            surahCatalog = surahCatalog,
            onDismiss = { showAddPlanDialog = false },
            onConfirm = { surahNum, startAyah, endAyah, reps ->
                onAddHifzPlan(surahNum, startAyah, endAyah, reps)
                showAddPlanDialog = false
            }
        )
    }
}

@Composable
private fun AddHifzPlanModalDialog(
    surahCatalog: List<SurahMetadata>,
    onDismiss: () -> Unit,
    onConfirm: (Int, Int, Int, Int) -> Unit
) {
    var selectedSurah by remember { mutableIntStateOf(surahCatalog.first().number) }
    var startAyahStr by remember { mutableStateOf("1") }
    var endAyahStr by remember { mutableStateOf("7") }
    var repsStr by remember { mutableStateOf("5") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("إنشاء خطة حفظ ومراجعة (FSRS)") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("اختر السورة:", style = MaterialTheme.typography.labelMedium)
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    surahCatalog.take(4).forEach { s ->
                        FilterChip(
                            selected = selectedSurah == s.number,
                            onClick = {
                                selectedSurah = s.number
                                endAyahStr = s.ayahCount.coerceAtMost(10).toString()
                            },
                            label = { Text(s.nameAr) }
                        )
                    }
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = startAyahStr,
                        onValueChange = { startAyahStr = it },
                        label = { Text("من الآية") },
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = endAyahStr,
                        onValueChange = { endAyahStr = it },
                        label = { Text("إلى الآية") },
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )
                }
                OutlinedTextField(
                    value = repsStr,
                    onValueChange = { repsStr = it },
                    label = { Text("عدد مرات التكرار اليومي") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val sAyah = startAyahStr.toIntOrNull()?.coerceAtLeast(1) ?: 1
                    val eAyah = endAyahStr.toIntOrNull()?.coerceAtLeast(sAyah) ?: sAyah
                    val reps = repsStr.toIntOrNull()?.coerceIn(1, 20) ?: 5
                    onConfirm(selectedSurah, sAyah, eAyah, reps)
                },
                colors = ButtonDefaults.buttonColors(containerColor = RoyalEmerald)
            ) {
                Text("إضافة لجدول FSRS")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("إلغاء")
            }
        }
    )
}
