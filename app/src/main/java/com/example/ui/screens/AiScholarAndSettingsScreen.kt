package com.example.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.CloudDone
import androidx.compose.material.icons.filled.Flag
import androidx.compose.material.icons.filled.Gavel
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.ThumbDownOffAlt
import androidx.compose.material.icons.filled.ThumbUpOffAlt
import androidx.compose.material.icons.filled.Verified
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
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Slider
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
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
import com.example.data.local.ErrorReportEntity
import com.example.data.repository.UserPreferencesState
import com.example.domain.model.ContentAttributionType
import com.example.domain.model.ScholarStructuredResponse
import com.example.domain.model.SourceChunk
import com.example.ui.components.ContentAttributionBadge
import com.example.ui.components.ReportScholarlyErrorDialog
import com.example.ui.theme.AmiriFontFamily
import com.example.ui.theme.IlluminatedGold
import com.example.ui.theme.IlluminatedGoldBright
import com.example.ui.theme.ItqanThemeMode
import com.example.ui.theme.RoyalEmerald
import com.example.ui.theme.toArabicDigits
import com.example.ui.viewmodel.CloudSyncUiState
import com.example.ui.viewmodel.ScholarUiState

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun AiScholarScreen(
    userPrefs: UserPreferencesState,
    scholarUiState: ScholarUiState,
    scholarHistory: List<ScholarStructuredResponse>,
    initialPrompt: String?,
    onConsumeInitialPrompt: () -> Unit,
    onAskQuestion: (String) -> Unit,
    onSubmitErrorReport: (String, String, String, String) -> Unit,
    modifier: Modifier = Modifier
) {
    var questionInput by remember { mutableStateOf("") }
    var selectedChunkForModal by remember { mutableStateOf<SourceChunk?>(null) }
    var responseForErrorReport by remember { mutableStateOf<ScholarStructuredResponse?>(null) }
    var feedbackToast by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(initialPrompt) {
        if (!initialPrompt.isNullOrBlank()) {
            questionInput = initialPrompt
            onAskQuestion(initialPrompt)
            onConsumeInitialPrompt()
        }
    }

    val suggestedQuestions = listOf(
        "ما الفرق بين الإدغام بغنة وبغير غنة في النون الساكنة؟",
        "ما سبب نزول وفضل آية الكرسي ومعنى الحي القيوم؟",
        "كم عدد مخارج الحروف عند الإمام ابن الجزري وما أقسامها؟",
        "ما الضابط المعتمد للمكي والمدني والناسخ والمنسوخ عند السيوطي؟"
    )

    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        modifier = modifier
            .fillMaxSize()
            .testTag("ai_scholar_screen")
    ) {
        // 1. RAG & Hallucination Guard Header Card
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
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.AutoAwesome,
                                contentDescription = null,
                                tint = IlluminatedGoldBright
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "المعلم القرآني الذكي الموثق (RAG)",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = IlluminatedGoldBright
                            )
                        }
                        Surface(
                            color = Color.Black.copy(alpha = 0.35f),
                            shape = RoundedCornerShape(50),
                            border = BorderStroke(1.dp, IlluminatedGold.copy(alpha = 0.6f))
                        ) {
                            Text(
                                text = "النموذج: ${userPrefs.remoteConfigAiModel}",
                                style = MaterialTheme.typography.labelSmall,
                                color = Color(0xFFFAF6EE),
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "محكوم بـ ٣ ضوابط صارمة: (١) استرجاع المقاطع الموثقة من أمهات الكتب أولاً، (٢) حارس الهلوسة الذي يسحب نص الآيات من قاعدة Room المحلية حصراً، (٣) عدم الإفتاء وإحالة المسائل الفقهية لأهل العلم.",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFFE5DFD3)
                    )
                }
            }
        }

        // 2. Suggested Scholarly Questions
        item {
            Text(
                text = "أسئلة علمية مقترحة:",
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.primary
            )
            Spacer(modifier = Modifier.height(6.dp))
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                suggestedQuestions.forEachIndexed { idx, q ->
                    Surface(
                        color = MaterialTheme.colorScheme.surfaceVariant,
                        shape = RoundedCornerShape(12.dp),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
                        modifier = Modifier
                            .clickable {
                                questionInput = q
                                onAskQuestion(q)
                            }
                            .testTag("scholar_suggested_q_$idx")
                    ) {
                        Text(
                            text = q,
                            style = MaterialTheme.typography.labelMedium,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)
                        )
                    }
                }
            }
        }

        // 3. Question Input Box
        item {
            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    OutlinedTextField(
                        value = questionInput,
                        onValueChange = { questionInput = it },
                        label = { Text("اسأل في التجويد، التفسير، أسباب النزول، الغريب، أو علوم القرآن...") },
                        minLines = 2,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("scholar_question_input")
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Button(
                        onClick = { onAskQuestion(questionInput) },
                        enabled = questionInput.isNotBlank() && scholarUiState !is ScholarUiState.Loading,
                        colors = ButtonDefaults.buttonColors(containerColor = RoyalEmerald),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("scholar_submit_button")
                    ) {
                        if (scholarUiState is ScholarUiState.Loading) {
                            CircularProgressIndicator(
                                color = IlluminatedGoldBright,
                                strokeWidth = 2.dp,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("جاري الاسترجاع من المصادر والتحقق من الآيات...")
                        } else {
                            Icon(Icons.AutoMirrored.Filled.Send, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("استفتِ المصادر العلمية المعتمدة")
                        }
                    }
                }
            }
        }

        // 4. Error Banner if AI call fails
        if (scholarUiState is ScholarUiState.Error) {
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text(
                            text = "تعذر إتمام الاستعلام عبر النموذج السحابي",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onErrorContainer
                        )
                        Text(
                            text = scholarUiState.message,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onErrorContainer
                        )
                    }
                }
            }
        }

        if (feedbackToast != null) {
            item {
                Surface(
                    color = MaterialTheme.colorScheme.primaryContainer,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = feedbackToast!!,
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onPrimaryContainer,
                        modifier = Modifier.padding(10.dp)
                    )
                }
            }
        }

        // 5. History of Grounded Structured Responses
        items(scholarHistory, key = { it.question + it.hashCode() }) { resp ->
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                border = BorderStroke(1.5.dp, IlluminatedGold.copy(alpha = 0.7f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        ContentAttributionBadge(attribution = ContentAttributionType.AI_ASSISTED)
                        Text(
                            text = "درجة التوثيق: ${(resp.confidence * 100).toInt().toArabicDigits(userPrefs.useEasternArabicDigits)}%",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.primary,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "السؤال: ${resp.question}",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )

                    if (resp.needsScholarReferral) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Surface(
                            color = Color(0xFF795548).copy(alpha = 0.16f),
                            shape = RoundedCornerShape(12.dp),
                            border = BorderStroke(1.dp, Color(0xFF795548)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.padding(10.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Gavel,
                                    contentDescription = null,
                                    tint = Color(0xFF795548)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "تنبيه: المعلم الذكي معلّم لعلوم القرآن وليس مفتياً؛ يُرجى مراجعة أهل العلم في مسائل الفتوى الفقهية.",
                                    style = MaterialTheme.typography.labelMedium
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = resp.answer,
                        style = MaterialTheme.typography.bodyLarge
                    )

                    // Local Room Authenticated Ayah Quotes (Hallucination Guard Output)
                    if (resp.resolvedAyahs.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(12.dp))
                        Surface(
                            color = MaterialTheme.colorScheme.surface,
                            shape = RoundedCornerShape(14.dp),
                            border = BorderStroke(1.dp, IlluminatedGold),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Default.Security,
                                        contentDescription = null,
                                        tint = IlluminatedGold,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = "الشواهد القرآنية (مُستخرجة من القاعدة المحلية المحققة — حارس الهلوسة):",
                                        style = MaterialTheme.typography.labelMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                }
                                Spacer(modifier = Modifier.height(6.dp))
                                resp.resolvedAyahs.forEach { quote ->
                                    Text(
                                        text = "﴿ ${quote.uthmaniText} ﴾ [سورة ${quote.surahNameAr}: ${quote.ayahNumber.toArabicDigits(userPrefs.useEasternArabicDigits)}]",
                                        fontFamily = AmiriFontFamily,
                                        fontSize = 20.sp,
                                        lineHeight = 34.sp,
                                        modifier = Modifier.padding(vertical = 3.dp)
                                    )
                                }
                            }
                        }
                    }

                    // Mandatory Citations with Clickable Original Source Viewer
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "📚 المصادر المعتمدة (انقر لعرض النص الأصلي المسترجع):",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    resp.citations.forEach { cit ->
                        val matchedChunk = resp.retrievedChunks.find {
                            it.chunkId == cit.chunkId || it.bookTitle.contains(cit.book) || cit.book.contains(it.bookTitle)
                        } ?: resp.retrievedChunks.firstOrNull()

                        Surface(
                            color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.55f),
                            shape = RoundedCornerShape(10.dp),
                            border = BorderStroke(1.dp, IlluminatedGold.copy(alpha = 0.5f)),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 3.dp)
                                .clickable {
                                    if (matchedChunk != null) {
                                        selectedChunkForModal = matchedChunk
                                    }
                                }
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.MenuBook,
                                    contentDescription = null,
                                    tint = IlluminatedGold,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = "${cit.book} — ${cit.author}",
                                        style = MaterialTheme.typography.labelLarge,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = "الموضع: ${cit.reference}",
                                        style = MaterialTheme.typography.labelSmall
                                    )
                                }
                                Text(
                                    text = "عرض الأصل ←",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.primary,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }

                    HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

                    // Feedback 👍/👎 and Report Error Row
                    Row(
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row {
                            IconButton(
                                onClick = { feedbackToast = "شكراً لتقييمك الإيجابي؛ يُسهم ذلك في تحسين جودة الاسترجاع (RAG)." }
                            ) {
                                Icon(Icons.Default.ThumbUpOffAlt, contentDescription = "إجابة مفيدة")
                            }
                            IconButton(
                                onClick = { feedbackToast = "تم تسجيل ملاحظتك لتحسين دقة الاسترجاع المصدري." }
                            ) {
                                Icon(Icons.Default.ThumbDownOffAlt, contentDescription = "تحتاج تحسين")
                            }
                        }

                        TextButton(
                            onClick = { responseForErrorReport = resp }
                        ) {
                            Icon(Icons.Default.Flag, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("الإبلاغ عن خطأ علمي")
                        }
                    }
                }
            }
        }
    }

    // Original Retrieved Source Chunk Viewer Modal
    selectedChunkForModal?.let { chunk ->
        AlertDialog(
            onDismissRequest = { selectedChunkForModal = null },
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Verified, contentDescription = null, tint = IlluminatedGold)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(chunk.bookTitle, style = MaterialTheme.typography.titleMedium)
                }
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    ContentAttributionBadge(attribution = ContentAttributionType.AUTHENTIC_QUOTE)
                    Text(
                        text = "المؤلف: ${chunk.author} • الموضع: ${chunk.reference}",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = chunk.content,
                        style = MaterialTheme.typography.bodyLarge
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = { selectedChunkForModal = null },
                    colors = ButtonDefaults.buttonColors(containerColor = RoyalEmerald)
                ) {
                    Text("إغلاق المصدر")
                }
            }
        )
    }

    responseForErrorReport?.let { targetResp ->
        ReportScholarlyErrorDialog(
            screenName = "المعلم الذكي الموثق (RAG)",
            referenceKey = "scholar_q_${targetResp.question.take(25)}",
            itemTitle = targetResp.question,
            onDismiss = { responseForErrorReport = null },
            onSubmitReport = { details ->
                onSubmitErrorReport(
                    "المعلم الذكي الموثق",
                    "scholar_rag",
                    targetResp.question,
                    details
                )
            }
        )
    }
}

/**
 * Settings, Accessibility, Remote Config AI Model, Content Governance Reports, and Cloud Sync Dialog.
 */
@Composable
fun ItqanSettingsModalDialog(
    userPrefs: UserPreferencesState,
    cloudSyncState: CloudSyncUiState,
    errorReports: List<ErrorReportEntity>,
    isAuthenticated: Boolean,
    userEmailOrId: String?,
    onSelectThemeMode: (ItqanThemeMode) -> Unit,
    onChangeFontScale: (Float) -> Unit,
    onToggleEasternDigits: (Boolean) -> Unit,
    onUpdateStudentName: (String) -> Unit,
    onUpdateAiModel: (String) -> Unit,
    onTriggerGoogleSignIn: () -> Unit,
    onSignOut: () -> Unit,
    onDismiss: () -> Unit
) {
    var nameInput by remember(userPrefs.studentName) { mutableStateOf(userPrefs.studentName) }
    var modelInput by remember(userPrefs.remoteConfigAiModel) { mutableStateOf(userPrefs.remoteConfigAiModel) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Settings, contentDescription = null, tint = IlluminatedGold)
                Spacer(modifier = Modifier.width(8.dp))
                Text("إعدادات إتقان والمزامنة السحابية")
            }
        },
        text = {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.height(430.dp)
            ) {
                // 1. Visual Theme Mode (Parchment Light / Royal Emerald Dark / AMOLED Black)
                item {
                    Text(
                        text = "المظهر البصري:",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        ItqanThemeMode.entries.forEach { mode ->
                            FilterChip(
                                selected = userPrefs.themeMode == mode,
                                onClick = { onSelectThemeMode(mode) },
                                label = { Text(mode.labelAr) },
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                    }
                }

                // 2. Font Scale (Accessibility up to 1.8x) & Eastern Arabic Numerals
                item {
                    HorizontalDivider()
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "حجم الخط وإمكانية الوصول (${(userPrefs.fontScale * 100).toInt()}%):",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold
                    )
                    Slider(
                        value = userPrefs.fontScale,
                        onValueChange = onChangeFontScale,
                        valueRange = 0.85f..1.65f
                    )
                    Row(
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("استخدام الأرقام العربية المشرقية (١٢٣)", style = MaterialTheme.typography.bodyMedium)
                        Switch(
                            checked = userPrefs.useEasternArabicDigits,
                            onCheckedChange = onToggleEasternDigits
                        )
                    }
                }

                // 3. Student Name for Certificates & Remote Config AI Model Name
                item {
                    HorizontalDivider()
                    Spacer(modifier = Modifier.height(6.dp))
                    OutlinedTextField(
                        value = nameInput,
                        onValueChange = { nameInput = it },
                        label = { Text("اسم طالب العلم (يظهر في شهادات الإتمام)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    OutlinedButton(
                        onClick = { onUpdateStudentName(nameInput) },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("حفظ الاسم للشهادات")
                    }

                    Spacer(modifier = Modifier.height(10.dp))
                    OutlinedTextField(
                        value = modelInput,
                        onValueChange = { modelInput = it },
                        label = { Text("معرف نموذج الذكاء الاصطناعي (Remote Config)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        FilterChip(
                            selected = modelInput == "gemini-3.8-flash",
                            onClick = {
                                modelInput = "gemini-3.8-flash"
                                onUpdateAiModel("gemini-3.8-flash")
                            },
                            label = { Text("gemini-3.8-flash") }
                        )
                        FilterChip(
                            selected = modelInput == "gemini-3.5-flash-lite",
                            onClick = {
                                modelInput = "gemini-3.5-flash-lite"
                                onUpdateAiModel("gemini-3.5-flash-lite")
                            },
                            label = { Text("gemini-3.5-flash-lite") }
                        )
                    }
                }

                // 4. Google Sign-In & Cloud Sync Status
                item {
                    HorizontalDivider()
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.CloudDone, contentDescription = null, tint = IlluminatedGold)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "المزامنة السحابية عبر Firebase Firestore:",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    if (isAuthenticated) {
                        Text(
                            text = "متصل بالحساب: ${userEmailOrId ?: "مستخدم موثق"}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.primary
                        )
                        if (cloudSyncState is CloudSyncUiState.Synced) {
                            Text(
                                text = "عدد السجلات المتزامنة سحابياً: ${cloudSyncState.records.size}",
                                style = MaterialTheme.typography.bodySmall
                            )
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        OutlinedButton(
                            onClick = onSignOut,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("تسجيل الخروج والعودة لوضع الضيف المحلي")
                        }
                    } else {
                        Text(
                            text = "أنت تستخدم حالياً «وضع الضيف دون حساب» (قاعدة Room المحلية). يمكنك تسجيل الدخول بحساب Google لمزامنة تقدمك وشهاداتك.",
                            style = MaterialTheme.typography.bodySmall
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Button(
                            onClick = onTriggerGoogleSignIn,
                            colors = ButtonDefaults.buttonColors(containerColor = RoyalEmerald),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("تسجيل الدخول باستخدام Google (Sign in with Google)")
                        }
                    }
                }

                // 5. Submitted Scholarly Error Reports Log
                if (errorReports.isNotEmpty()) {
                    item {
                        HorizontalDivider()
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "سجل بلاغات المراجعة العلمية (${errorReports.size}):",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold
                        )
                        errorReports.take(3).forEach { rep ->
                            Text(
                                text = "• ${rep.itemTitle}: ${rep.reportDetails} [${rep.status}]",
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
                Text("تم")
            }
        }
    )
}
