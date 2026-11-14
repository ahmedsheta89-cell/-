package com.example.ui.components

import android.content.Intent
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddTask
import androidx.compose.material.icons.filled.AssignmentTurnedIn
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.WorkspacePremium
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
import androidx.compose.material3.Surface
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
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.local.ItqanPhase3SeedData
import com.example.data.local.MistakeLogEntity
import com.example.data.local.WirdAssignmentEntity
import com.example.domain.model.StudentSubmissionItem
import com.example.domain.model.SurahMetadata
import com.example.domain.model.TeacherClassroom
import com.example.ui.theme.AmiriFontFamily
import com.example.ui.theme.IlluminatedGold
import com.example.ui.theme.IlluminatedGoldBright
import com.example.ui.theme.RoyalEmerald
import com.example.ui.theme.toArabicDigits

@Composable
fun TeacherMuhaffizPortalView(
    studentName: String,
    streakDays: Int,
    completedLessonsCount: Int,
    certificatesCount: Int,
    memorizedVersesCount: Int,
    useEasternDigits: Boolean,
    classrooms: List<TeacherClassroom> = ItqanPhase3SeedData.teacherClassrooms,
    wirdAssignments: List<WirdAssignmentEntity> = emptyList(),
    studentSubmissions: List<StudentSubmissionItem> = ItqanPhase3SeedData.initialStudentSubmissions,
    mistakeLogs: List<MistakeLogEntity> = emptyList(),
    surahCatalog: List<SurahMetadata> = emptyList(),
    onCreateWirdAssignment: (String, Int, Int, Int, Int, String, String) -> Unit = { _, _, _, _, _, _, _ -> },
    onCompleteWirdAssignment: (WirdAssignmentEntity) -> Unit = {},
    onSubmitTeacherFeedback: (String, String) -> Unit = { _, _ -> },
    onIssueStageCertificate: (String) -> Unit = {},
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    var portalSubTab by remember { mutableIntStateOf(0) } // 0 = الفصول وتكليف الأوراد, 1 = تقييم تسجيلات الطلاب, 2 = التقرير الأسبوعي
    var showCreateAssignmentDialog by remember { mutableStateOf(false) }
    var activePlayingSubmissionId by remember { mutableStateOf<String?>(null) }
    var feedbackDraftMap by remember { mutableStateOf(mapOf<String, String>()) }

    val weeklyReportText = remember(
        studentName,
        streakDays,
        completedLessonsCount,
        certificatesCount,
        memorizedVersesCount,
        mistakeLogs,
        wirdAssignments
    ) {
        ItqanPhase3SeedData.buildWeeklyStudentReportText(
            studentName = studentName,
            streakDays = streakDays,
            completedLessonsCount = completedLessonsCount,
            certificatesCount = certificatesCount,
            memorizedVersesCount = memorizedVersesCount,
            unresolvedMistakes = mistakeLogs.filter { !it.isResolved },
            activeWirdAssignments = wirdAssignments
        )
    }

    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        modifier = modifier
            .fillMaxSize()
            .testTag("teacher_muhaffiz_portal_view")
    ) {
        // 1. Header Card
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
                                imageVector = Icons.Default.Groups,
                                contentDescription = null,
                                tint = IlluminatedGoldBright
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "بوابة المعلم والمحفّظ والإشراف التعليمي",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = IlluminatedGoldBright
                            )
                        }
                        Button(
                            onClick = { showCreateAssignmentDialog = true },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = IlluminatedGold,
                                contentColor = Color(0xFF06231B)
                            ),
                            modifier = Modifier.testTag("open_create_wird_assignment_button")
                        ) {
                            Icon(
                                imageVector = Icons.Default.AddTask,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("تكليف ورد جديد", fontWeight = FontWeight.Bold)
                        }
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "إدارة الحلقات والفصول، تكليف الطلاب بأوراد الحفظ والمراجعة، الاستماع لتسجيلات التسميع وإرسال الملاحظات التجويدية الموثقة، وإصدار تقارير الأداء الأسبوعية.",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFFFAF6EE)
                    )
                }
            }
        }

        // 2. Sub-tab Selector Chips
        item {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                item {
                    FilterChip(
                        selected = portalSubTab == 0,
                        onClick = { portalSubTab = 0 },
                        label = { Text("الفصول وتكليفات الأوراد (${wirdAssignments.size.toArabicDigits(useEasternDigits)})") },
                        modifier = Modifier.testTag("teacher_subtab_assignments")
                    )
                }
                item {
                    FilterChip(
                        selected = portalSubTab == 1,
                        onClick = { portalSubTab = 1 },
                        label = { Text("تقييم تسجيلات الطلاب (${studentSubmissions.size.toArabicDigits(useEasternDigits)})") },
                        modifier = Modifier.testTag("teacher_subtab_submissions")
                    )
                }
                item {
                    FilterChip(
                        selected = portalSubTab == 2,
                        onClick = { portalSubTab = 2 },
                        label = { Text("تقارير الأداء الأسبوعية لأولياء الأمور") },
                        modifier = Modifier.testTag("teacher_subtab_weekly_report")
                    )
                }
            }
        }

        when (portalSubTab) {
            0 -> {
                // Active Teacher Classrooms Summary
                item {
                    Text(
                        text = "الحلقات والفصول الدراسية النشطة",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                }

                items(classrooms, key = { it.classroomId }) { classroom ->
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        border = BorderStroke(1.dp, IlluminatedGold.copy(alpha = 0.5f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    text = classroom.titleAr,
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold
                                )
                                Surface(
                                    color = MaterialTheme.colorScheme.primaryContainer,
                                    shape = RoundedCornerShape(50)
                                ) {
                                    Text(
                                        text = "${classroom.studentsCount.toArabicDigits(useEasternDigits)} طالباً",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onPrimaryContainer,
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                    )
                                }
                            }
                            Text(
                                text = "المشرف العلمي: ${classroom.supervisorNameAr} • ${classroom.levelAr}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "الورد الجاري: ${classroom.activeWirdSummaryAr} | الموعد: ${classroom.scheduleAr}",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                }

                item {
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "تكليفات الأوراد الصادرة للطلاب",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                }

                items(wirdAssignments, key = { it.assignmentId }) { assign ->
                    val progressFraction = (assign.completedStudentsCount.toFloat() / assign.totalStudentsCount.coerceAtLeast(1).toFloat())
                        .coerceIn(0f, 1f)
                    Card(
                        shape = RoundedCornerShape(18.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        border = BorderStroke(
                            1.dp,
                            if (assign.isCompletedByCurrentStudent) IlluminatedGold else MaterialTheme.colorScheme.outline
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("wird_assignment_card_${assign.assignmentId}")
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    text = "تكليف: سورة ${assign.surahNameAr} (الآيات ${assign.ayahStart.toArabicDigits(useEasternDigits)} - ${assign.ayahEnd.toArabicDigits(useEasternDigits)})",
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold
                                )
                                Surface(
                                    color = if (assign.isCompletedByCurrentStudent) Color(0xFF1B5E20).copy(alpha = 0.15f) else IlluminatedGold.copy(alpha = 0.2f),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Text(
                                        text = assign.dueDateLabelAr,
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                    )
                                }
                            }
                            Text(
                                text = "${assign.classroomTitleAr} • التكرار المطلوب: ${assign.requiredRepetitions.toArabicDigits(useEasternDigits)} مرات",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "🎯 التركيز التجويدي: ${assign.focusTajweedRuleAr}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.primary,
                                fontWeight = FontWeight.SemiBold
                            )
                            Text(
                                text = "توجيه المعلم: ${assign.teacherInstructionsAr}",
                                style = MaterialTheme.typography.bodySmall
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            LinearProgressIndicator(
                                progress = { progressFraction },
                                color = RoyalEmerald,
                                trackColor = MaterialTheme.colorScheme.surfaceVariant,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(7.dp)
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Row(
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    text = "إنجاز طلاب الحلقة: ${assign.completedStudentsCount.toArabicDigits(useEasternDigits)}/${assign.totalStudentsCount.toArabicDigits(useEasternDigits)}",
                                    style = MaterialTheme.typography.labelSmall
                                )
                                if (!assign.isCompletedByCurrentStudent) {
                                    Button(
                                        onClick = { onCompleteWirdAssignment(assign) },
                                        colors = ButtonDefaults.buttonColors(containerColor = RoyalEmerald),
                                        modifier = Modifier.testTag("complete_wird_assignment_${assign.assignmentId}")
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.AssignmentTurnedIn,
                                            contentDescription = null,
                                            modifier = Modifier.size(16.dp)
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("تسليم إنجاز الورد")
                                    }
                                } else {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            imageVector = Icons.Default.CheckCircle,
                                            contentDescription = null,
                                            tint = IlluminatedGold,
                                            modifier = Modifier.size(16.dp)
                                        )
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text(
                                            text = "تم تسليم الورد واعتماده",
                                            style = MaterialTheme.typography.labelMedium,
                                            color = MaterialTheme.colorScheme.primary,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

            1 -> {
                // Student Audio Recitation Submissions Review & Stage Certificates
                items(studentSubmissions, key = { it.submissionId }) { sub ->
                    val isPlaying = activePlayingSubmissionId == sub.submissionId
                    val draftText = feedbackDraftMap[sub.submissionId] ?: ""

                    Card(
                        shape = RoundedCornerShape(18.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        border = BorderStroke(1.dp, IlluminatedGold.copy(alpha = 0.6f)),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("student_submission_card_${sub.submissionId}")
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = "الطالب: ${sub.studentNameAr}",
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = "${sub.classroomTitleAr} • سورة ${sub.surahNameAr} (${sub.ayahRangeAr})",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                                Surface(
                                    color = RoyalEmerald,
                                    shape = RoundedCornerShape(10.dp),
                                    border = BorderStroke(1.dp, IlluminatedGold)
                                ) {
                                    Text(
                                        text = "الدقة: ${sub.autoAccuracyPercent.toArabicDigits(useEasternDigits)}%",
                                        style = MaterialTheme.typography.labelMedium,
                                        color = IlluminatedGoldBright,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(8.dp))

                            Surface(
                                color = MaterialTheme.colorScheme.surface,
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(10.dp)) {
                                    Text(
                                        text = "﴿ ${sub.recitedSnippetUthmani} ﴾",
                                        fontFamily = AmiriFontFamily,
                                        fontSize = 19.sp
                                    )
                                    Spacer(modifier = Modifier.height(6.dp))
                                    // Waveform & Play Button
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        OutlinedButton(
                                            onClick = {
                                                activePlayingSubmissionId =
                                                    if (isPlaying) null else sub.submissionId
                                            }
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.PlayArrow,
                                                contentDescription = "استماع لتسجيل الطالب",
                                                modifier = Modifier.size(16.dp)
                                            )
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text(
                                                if (isPlaying) "جاري الاستماع (${sub.durationSeconds.toArabicDigits(useEasternDigits)} ث)..."
                                                else "استماع للتسجيل (${sub.durationSeconds.toArabicDigits(useEasternDigits)} ث)"
                                            )
                                        }
                                        Spacer(modifier = Modifier.width(10.dp))
                                        Canvas(
                                            modifier = Modifier
                                                .weight(1f)
                                                .height(32.dp)
                                        ) {
                                            val barCount = sub.waveformSamples.size.coerceAtLeast(1)
                                            val barWidth = (size.width / (barCount * 2f)).coerceAtLeast(4f)
                                            sub.waveformSamples.forEachIndexed { idx, amp ->
                                                val barHeight = (size.height * amp).coerceAtLeast(6f)
                                                val x = idx * (size.width / barCount)
                                                val y = (size.height - barHeight) / 2f
                                                drawRoundRect(
                                                    color = if (isPlaying) IlluminatedGold else RoyalEmerald,
                                                    topLeft = Offset(x, y),
                                                    size = Size(barWidth, barHeight),
                                                    cornerRadius = CornerRadius(4f, 4f)
                                                )
                                            }
                                        }
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(8.dp))

                            Text(
                                text = "📌 تصنيف الملاحظة (${sub.tajweedCategoryBadgeAr}) — الكلمة المستهدفة: ﴿${sub.focusMistakeWord}﴾",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.primary,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "ملاحظة المعلم المعتمدة: ${sub.teacherFeedbackNote}",
                                style = MaterialTheme.typography.bodySmall
                            )

                            Spacer(modifier = Modifier.height(8.dp))

                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                OutlinedTextField(
                                    value = draftText,
                                    onValueChange = {
                                        feedbackDraftMap = feedbackDraftMap + (sub.submissionId to it)
                                    },
                                    placeholder = { Text("أضف توجيهك التجويدي للطالب...") },
                                    singleLine = true,
                                    modifier = Modifier.weight(1f)
                                )
                                Button(
                                    onClick = {
                                        if (draftText.isNotBlank()) {
                                            onSubmitTeacherFeedback(sub.submissionId, draftText)
                                            feedbackDraftMap = feedbackDraftMap - sub.submissionId
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = RoyalEmerald)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Send,
                                        contentDescription = "إرسال الملاحظة",
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(8.dp))
                            HorizontalDivider()
                            Spacer(modifier = Modifier.height(8.dp))

                            Row(
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    text = if (sub.stageCertificateIssued) "✓ صدرت شهادة الإتمام المرحلية للطالب" else "جاهز لاعتماد شهادة المرحلة (≥ ٨٥٪)",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = if (sub.stageCertificateIssued) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                if (!sub.stageCertificateIssued) {
                                    OutlinedButton(
                                        onClick = { onIssueStageCertificate(sub.submissionId) },
                                        modifier = Modifier.testTag("issue_stage_cert_${sub.submissionId}")
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.WorkspacePremium,
                                            contentDescription = null,
                                            tint = IlluminatedGold,
                                            modifier = Modifier.size(16.dp)
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("إصدار شهادة إتمام مرحلية")
                                    }
                                }
                            }
                        }
                    }
                }
            }

            2 -> {
                // Weekly Performance Report for Students & Parents
                item {
                    Card(
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        border = BorderStroke(1.5.dp, IlluminatedGold),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(
                                text = "تقرير الأداء الأسبوعي الموثق للطالب وولي الأمر",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Surface(
                                color = MaterialTheme.colorScheme.surface,
                                shape = RoundedCornerShape(14.dp),
                                border = BorderStroke(1.dp, IlluminatedGold.copy(alpha = 0.5f)),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    text = weeklyReportText,
                                    style = MaterialTheme.typography.bodyMedium,
                                    modifier = Modifier.padding(14.dp)
                                )
                            }
                            Spacer(modifier = Modifier.height(12.dp))
                            Button(
                                onClick = {
                                    val sendIntent = Intent(Intent.ACTION_SEND).apply {
                                        type = "text/plain"
                                        putExtra(Intent.EXTRA_SUBJECT, "تقرير الأداء الأسبوعي — إتقان")
                                        putExtra(Intent.EXTRA_TEXT, weeklyReportText)
                                    }
                                    val chooser = Intent.createChooser(sendIntent, "مشاركة تقرير الأداء الأسبوعي")
                                    chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                                    runCatching { context.startActivity(chooser) }
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = RoyalEmerald),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .testTag("share_weekly_report_button")
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Share,
                                    contentDescription = null,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("مشاركة التقرير الأسبوعي مع ولي الأمر أو المعلم")
                            }
                        }
                    }
                }
            }
        }
    }

    if (showCreateAssignmentDialog) {
        var selectedSurahNum by remember { mutableIntStateOf(67) }
        var ayahStartText by remember { mutableStateOf("1") }
        var ayahEndText by remember { mutableStateOf("5") }
        var repetitionsText by remember { mutableStateOf("7") }
        var tajweedFocusText by remember { mutableStateOf("تحقيق المخارج ومقادير المدود والقلقلة") }
        var instructionsText by remember { mutableStateOf("تسميع المقطع في حلقة الشيخ الصوتية الحية") }

        AlertDialog(
            onDismissRequest = { showCreateAssignmentDialog = false },
            title = {
                Text(
                    text = "إصدار تكليف ورد جديد للحلقة",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = "اختر السورة ونطاق الآيات والتوجيه التجويدي:",
                        style = MaterialTheme.typography.bodySmall
                    )
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        items(surahCatalog.take(8), key = { it.number }) { surah ->
                            FilterChip(
                                selected = selectedSurahNum == surah.number,
                                onClick = { selectedSurahNum = surah.number },
                                label = { Text(surah.nameAr) }
                            )
                        }
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = ayahStartText,
                            onValueChange = { ayahStartText = it },
                            label = { Text("من آية") },
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = ayahEndText,
                            onValueChange = { ayahEndText = it },
                            label = { Text("إلى آية") },
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = repetitionsText,
                            onValueChange = { repetitionsText = it },
                            label = { Text("التكرار") },
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                    }
                    OutlinedTextField(
                        value = tajweedFocusText,
                        onValueChange = { tajweedFocusText = it },
                        label = { Text("الحكم التجويدي المستهدف") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = instructionsText,
                        onValueChange = { instructionsText = it },
                        label = { Text("توجيهات المعلم للطلاب") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        onCreateWirdAssignment(
                            classrooms.first().classroomId,
                            selectedSurahNum,
                            ayahStartText.toIntOrNull() ?: 1,
                            ayahEndText.toIntOrNull() ?: 5,
                            repetitionsText.toIntOrNull() ?: 5,
                            tajweedFocusText,
                            instructionsText
                        )
                        showCreateAssignmentDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = RoyalEmerald)
                ) {
                    Text("اعتماد التكليف")
                }
            },
            dismissButton = {
                TextButton(onClick = { showCreateAssignmentDialog = false }) {
                    Text("إلغاء")
                }
            }
        )
    }
}
