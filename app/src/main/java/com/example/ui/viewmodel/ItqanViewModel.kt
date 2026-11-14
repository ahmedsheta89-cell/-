package com.example.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.CreationExtras
import com.example.R
import com.example.data.audio.PlaybackUiState
import com.example.data.audio.QuranAudioPlayerManager
import com.example.data.firebase.CloudSyncRepository
import com.example.data.firebase.StudySyncRecord
import com.example.data.local.AyahEntity
import com.example.data.local.BookmarkNoteEntity
import com.example.data.local.CertificateEntity
import com.example.data.local.ErrorReportEntity
import com.example.data.local.FsrsReviewEntity
import com.example.data.local.ItqanDatabase
import com.example.data.local.ItqanSeedData
import com.example.data.local.LessonProgressEntity
import com.example.data.repository.AiScholarRagRepository
import com.example.data.repository.ItqanLocalRepository
import com.example.data.repository.UserPreferencesState
import com.example.domain.model.ClassicalMatnVerse
import com.example.domain.model.ReciterProfile
import com.example.domain.model.ScholarStructuredResponse
import com.example.domain.model.ScienceLesson
import com.example.domain.model.ScienceTrackId
import com.example.domain.model.SourceChunk
import com.example.domain.model.SourceRegistryItem
import com.example.domain.model.SurahMetadata
import com.example.domain.model.VoiceRecitationReport
import com.example.domain.usecase.GradeQuizAndIssueCertificateUseCase
import com.example.domain.usecase.ScheduleFsrsReviewUseCase
import com.example.domain.usecase.VerifyVoiceRecitationUseCase
import com.example.ui.theme.ItqanThemeMode
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.FirebaseFirestoreException
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

sealed interface ScholarUiState {
    data object Idle : ScholarUiState
    data object Loading : ScholarUiState
    data class Success(val response: ScholarStructuredResponse) : ScholarUiState
    data class Error(val message: String) : ScholarUiState
}

sealed interface CloudSyncUiState {
    data object GuestOffline : CloudSyncUiState
    data object Loading : CloudSyncUiState
    data class Synced(val records: List<StudySyncRecord>) : CloudSyncUiState
    data class Error(val message: String) : CloudSyncUiState
}

@OptIn(ExperimentalCoroutinesApi::class)
class ItqanViewModel(
    private val localRepository: ItqanLocalRepository,
    private val aiScholarRepository: AiScholarRagRepository,
    private val cloudSyncRepository: CloudSyncRepository?,
    private val authenticatedUserId: String?
) : ViewModel() {

    private val fsrsScheduler = ScheduleFsrsReviewUseCase()
    private val voiceVerifier = VerifyVoiceRecitationUseCase()
    private val certificateIssuer = GradeQuizAndIssueCertificateUseCase()
    val audioPlayer = QuranAudioPlayerManager()

    val surahCatalog: List<SurahMetadata> = ItqanSeedData.surahCatalog
    val reciters: List<ReciterProfile> = ItqanSeedData.reciters
    val sourceRegistry: List<SourceRegistryItem> = ItqanSeedData.sourceRegistry
    val academyLessons: List<ScienceLesson> = ItqanSeedData.academyLessons
    val matnVerses: List<ClassicalMatnVerse> = ItqanSeedData.classicalMatnVerses
    val dailyBenefits: List<Pair<String, String>> = ItqanSeedData.dailyBenefitsFromItqan
    val surahMindMaps = com.example.data.local.ItqanPhase2SeedData.surahMindMaps
    val mutashabihatRules = com.example.data.local.ItqanPhase2SeedData.mutashabihatRules
    val qiraatComparisons = com.example.data.local.ItqanPhase2SeedData.qiraatComparisons
    val gharibLexiconEntries = com.example.data.local.ItqanPhase2SeedData.gharibLexiconEntries
    val makharijDictionary = com.example.data.local.ItqanPhase2SeedData.makharijDictionary
    val seventeenMakharijAtlas = com.example.data.local.ItqanPhase3SeedData.seventeenMakharijAtlas
    val teacherClassrooms = com.example.data.local.ItqanPhase3SeedData.teacherClassrooms
    val qiraatNarratorProfiles = com.example.data.local.ItqanPhase3SeedData.qiraatNarratorProfiles
    val diagnosticPlacementQuestions = com.example.data.local.ItqanPhase3SeedData.diagnosticPlacementQuestions

    private val _groupHalqahs = MutableStateFlow(com.example.data.local.ItqanPhase2SeedData.defaultGroupHalqahs)
    val groupHalqahs: StateFlow<List<com.example.domain.model.CloudGroupHalqah>> = _groupHalqahs.asStateFlow()

    private val _studentSubmissions = MutableStateFlow(com.example.data.local.ItqanPhase3SeedData.initialStudentSubmissions)
    val studentSubmissions: StateFlow<List<com.example.domain.model.StudentSubmissionItem>> = _studentSubmissions.asStateFlow()

    private val _selectedQiraatNarratorId = MutableStateFlow("hafs_asim")
    val selectedQiraatNarratorId: StateFlow<String> = _selectedQiraatNarratorId.asStateFlow()

    val userPrefs: StateFlow<UserPreferencesState> = localRepository.userPreferencesFlow
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000L),
            initialValue = UserPreferencesState()
        )

    private val _selectedSurahNumber = MutableStateFlow(1)
    val selectedSurahNumber: StateFlow<Int> = _selectedSurahNumber.asStateFlow()

    private val _isDownloadingSurah = MutableStateFlow(false)
    val isDownloadingSurah: StateFlow<Boolean> = _isDownloadingSurah.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _searchResults = MutableStateFlow<List<AyahEntity>>(emptyList())
    val searchResults: StateFlow<List<AyahEntity>> = _searchResults.asStateFlow()

    private val _selectedAyahForSheet = MutableStateFlow<AyahEntity?>(null)
    val selectedAyahForSheet: StateFlow<AyahEntity?> = _selectedAyahForSheet.asStateFlow()

    val currentSurahAyahs: StateFlow<List<AyahEntity>> = _selectedSurahNumber
        .flatMapLatest { surahNum -> localRepository.observeAyahsBySurah(surahNum) }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000L),
            initialValue = emptyList()
        )

    val allCachedAyahs: StateFlow<List<AyahEntity>> = localRepository.observeAllAyahs()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000L),
            initialValue = emptyList()
        )

    val bookmarks: StateFlow<List<BookmarkNoteEntity>> = localRepository.observeBookmarks()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000L),
            initialValue = emptyList()
        )

    val lessonProgress: StateFlow<List<LessonProgressEntity>> = localRepository.observeLessonProgress()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000L),
            initialValue = emptyList()
        )

    val fsrsReviews: StateFlow<List<FsrsReviewEntity>> = localRepository.observeFsrsReviews()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000L),
            initialValue = emptyList()
        )

    val certificates: StateFlow<List<CertificateEntity>> = localRepository.observeCertificates()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000L),
            initialValue = emptyList()
        )

    val errorReports: StateFlow<List<ErrorReportEntity>> = localRepository.observeErrorReports()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000L),
            initialValue = emptyList()
        )

    val mistakeLogs: StateFlow<List<com.example.data.local.MistakeLogEntity>> = localRepository.observeMistakeLogs()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000L),
            initialValue = emptyList()
        )

    val khatmahPlans: StateFlow<List<com.example.data.local.KhatmahPlanEntity>> = localRepository.observeKhatmahPlans()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000L),
            initialValue = emptyList()
        )

    val tadabburJournals: StateFlow<List<com.example.data.local.TadabburJournalEntity>> = localRepository.observeTadabburJournals()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000L),
            initialValue = emptyList()
        )

    val wirdAssignments: StateFlow<List<com.example.data.local.WirdAssignmentEntity>> = localRepository.observeWirdAssignments()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000L),
            initialValue = emptyList()
        )

    val playbackState: StateFlow<PlaybackUiState> = audioPlayer.state

    // AI Scholar State
    private val _scholarUiState = MutableStateFlow<ScholarUiState>(ScholarUiState.Idle)
    val scholarUiState: StateFlow<ScholarUiState> = _scholarUiState.asStateFlow()

    private val _scholarHistory = MutableStateFlow<List<ScholarStructuredResponse>>(emptyList())
    val scholarHistory: StateFlow<List<ScholarStructuredResponse>> = _scholarHistory.asStateFlow()

    // Voice Recitation Report State
    private val _voiceReport = MutableStateFlow<VoiceRecitationReport?>(null)
    val voiceReport: StateFlow<VoiceRecitationReport?> = _voiceReport.asStateFlow()

    // Status Toast / Snackbar message
    private val _statusBannerMessage = MutableStateFlow<String?>(null)
    val statusBannerMessage: StateFlow<String?> = _statusBannerMessage.asStateFlow()

    // Cloud Sync State (Strictly auth-gated: only observes Firestore when authenticatedUserId != null)
    val cloudSyncState: StateFlow<CloudSyncUiState> = if (authenticatedUserId != null && cloudSyncRepository != null) {
        cloudSyncRepository.observeRecords()
            .map<List<StudySyncRecord>, CloudSyncUiState> { CloudSyncUiState.Synced(it) }
            .catch { error ->
                val firestoreError = generateSequence(error) { it.cause }
                    .filterIsInstance<FirebaseFirestoreException>()
                    .firstOrNull()
                if (firestoreError == null && error is CancellationException) throw error
                val rootError = firestoreError ?: error
                emit(CloudSyncUiState.Error(rootError.message ?: "تعذرت المزامنة السحابية"))
            }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(5000L),
                initialValue = CloudSyncUiState.Loading
            )
    } else {
        flowOf(CloudSyncUiState.GuestOffline).stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000L),
            initialValue = CloudSyncUiState.GuestOffline
        )
    }

    init {
        viewModelScope.launch {
            localRepository.ensureSeeded()
        }
    }

    fun clearStatusBanner() {
        _statusBannerMessage.value = null
    }

    fun selectSurah(surahNumber: Int) {
        _selectedSurahNumber.value = surahNumber
        viewModelScope.launch {
            localRepository.updateLastRead(surahNumber, 1)
            val currentList = localRepository.getAyahsByKeys(listOf("$surahNumber:1", "$surahNumber:2"))
            if (currentList.size < 2 && surahNumber != 1 && surahNumber != 112) {
                downloadAndCacheSurah(surahNumber)
            }
        }
    }

    fun downloadAndCacheSurah(surahNumber: Int) {
        viewModelScope.launch {
            _isDownloadingSurah.value = true
            val result = localRepository.fetchAndCacheSurahIfNeeded(surahNumber)
            _isDownloadingSurah.value = false
            result.onSuccess { count ->
                _statusBannerMessage.value = "تم تنزيل وتخزين آيات السورة ($count آية) للعمل دون إنترنت"
            }.onFailure {
                _statusBannerMessage.value = "يعمل التطبيق حالياً بالنسخة المحلية المحفوظة دون إنترنت"
            }
        }
    }

    fun updateSearchQuery(query: String) {
        _searchQuery.value = query
        viewModelScope.launch {
            if (query.trim().isEmpty()) {
                _searchResults.value = emptyList()
            } else {
                _searchResults.value = localRepository.searchAyahsInstant(query)
            }
        }
    }

    fun openAyahSciencesSheet(ayah: AyahEntity) {
        _selectedAyahForSheet.value = ayah
        viewModelScope.launch {
            localRepository.updateLastRead(ayah.surahNumber, ayah.ayahNumber)
        }
    }

    fun closeAyahSciencesSheet() {
        _selectedAyahForSheet.value = null
    }

    fun playAyahAudio(ayah: AyahEntity) {
        val playlist = currentSurahAyahs.value.map { it.ayahNumber to it.uthmaniText }
        audioPlayer.playAyah(
            surahNumber = ayah.surahNumber,
            ayahNumber = ayah.ayahNumber,
            uthmaniText = ayah.uthmaniText,
            surahPlaylist = playlist
        )
        viewModelScope.launch {
            localRepository.updateLastRead(ayah.surahNumber, ayah.ayahNumber)
        }
    }

    fun saveBookmarkOrNote(ayah: AyahEntity, note: String, isFavorite: Boolean = true) {
        viewModelScope.launch {
            val entity = BookmarkNoteEntity(
                compositeKey = ayah.compositeKey,
                surahNumber = ayah.surahNumber,
                surahNameAr = ayah.surahNameAr,
                ayahNumber = ayah.ayahNumber,
                uthmaniSnippet = ayah.uthmaniText,
                personalNote = note.trim(),
                isFavorite = isFavorite
            )
            localRepository.saveBookmarkNote(entity)
            syncToCloudIfAuthenticated(
                recordType = "bookmark",
                title = "علامة مرجعية: سورة ${ayah.surahNameAr} (${ayah.ayahNumber})",
                referenceKey = ayah.compositeKey,
                scoreOrCount = 1L,
                notes = note.trim().ifBlank { null }
            )
            _statusBannerMessage.value = "تم حفظ العلامة المرجعية والملاحظة التدبرية"
        }
    }

    fun deleteBookmark(compositeKey: String) {
        viewModelScope.launch {
            localRepository.removeBookmark(compositeKey)
            _statusBannerMessage.value = "تمت إزالة العلامة المرجعية"
        }
    }

    // Academy & Certificates
    fun submitLessonQuizScore(
        lesson: ScienceLesson,
        scorePercent: Int
    ) {
        viewModelScope.launch {
            val existing = lessonProgress.value.find { it.lessonId == lesson.id }
            val attempts = (existing?.attemptsCount ?: 0) + 1
            val bestScore = maxOf(existing?.quizScorePercent ?: 0, scorePercent)
            val progress = LessonProgressEntity(
                lessonId = lesson.id,
                trackId = lesson.trackId.id,
                completed = bestScore >= 70,
                quizScorePercent = bestScore,
                attemptsCount = attempts
            )
            localRepository.saveLessonProgress(progress)
            syncToCloudIfAuthenticated(
                recordType = "lesson_progress",
                title = lesson.title,
                referenceKey = lesson.id,
                scoreOrCount = bestScore.toLong(),
                notes = "المسار: ${lesson.trackId.titleAr}"
            )

            // Check if student qualifies for Track Study Completion Certificate (>= 80%)
            if (scorePercent >= 80) {
                val cert = certificateIssuer.createCertificate(
                    studentName = userPrefs.value.studentName,
                    track = lesson.trackId,
                    scorePercent = scorePercent
                )
                if (cert != null) {
                    localRepository.saveCertificate(cert)
                    syncToCloudIfAuthenticated(
                        recordType = "certificate",
                        title = cert.trackTitleAr,
                        referenceKey = cert.verificationCode,
                        scoreOrCount = cert.scorePercent.toLong(),
                        notes = cert.qrPayload
                    )
                    _statusBannerMessage.value = "مبارك! أصدرت لك شهادة إتمام دراسة منهجية برمز تحقق (${cert.verificationCode})"
                }
            } else {
                _statusBannerMessage.value = "تم تسجيل نتيجتك ($scorePercent%). يلزم 80% فأعلى لإصدار شهادة الإتمام."
            }
        }
    }

    // FSRS Spaced Repetition & Hifz Plan
    fun gradeFsrsReview(review: FsrsReviewEntity, grade: Int) {
        viewModelScope.launch {
            val updated = fsrsScheduler.scheduleNext(review, grade)
            localRepository.saveFsrsReview(updated)
            syncToCloudIfAuthenticated(
                recordType = "fsrs_review",
                title = updated.title,
                referenceKey = updated.itemId,
                scoreOrCount = updated.scheduledDays.toLong(),
                notes = "الاستقرار: ${updated.stability} يوم | الصعوبة: ${updated.difficulty}"
            )
            _statusBannerMessage.value = "تم تحديث جدولة المراجعة المتباعدة (FSRS): الموعد القادم بعد ${updated.scheduledDays} يوم"
        }
    }

    fun addCustomHifzPlan(
        surahNumber: Int,
        ayahStart: Int,
        ayahEnd: Int,
        targetRepetitions: Int
    ) {
        viewModelScope.launch {
            val surahMeta = surahCatalog.find { it.number == surahNumber }
            val surahName = surahMeta?.nameAr ?: "سورة رقم $surahNumber"
            val itemId = "hifz_${surahNumber}_${ayahStart}_${ayahEnd}"
            val entity = FsrsReviewEntity(
                itemId = itemId,
                title = "ورد حفظ: سورة $surahName ($ayahStart - $ayahEnd)",
                surahNumber = surahNumber,
                ayahStart = ayahStart,
                ayahEnd = ayahEnd,
                targetRepetitions = targetRepetitions.coerceIn(1, 20),
                completedRepetitions = 0,
                stability = 1.5,
                difficulty = 3.5,
                elapsedDays = 0,
                scheduledDays = 1,
                reps = 0,
                lapses = 0,
                lastGrade = 3,
                dueTimestamp = System.currentTimeMillis(),
                lastReviewTimestamp = System.currentTimeMillis()
            )
            localRepository.saveFsrsReview(entity)
            _statusBannerMessage.value = "تمت إضافة خطة الحفظ إلى جدول المراجعة المتباعدة (FSRS)"
        }
    }

    // Voice Recitation Verification
    fun evaluateVoiceRecitation(
        ayah: AyahEntity,
        spokenTranscript: String
    ) {
        val report = voiceVerifier.evaluateRecitation(
            surahNumber = ayah.surahNumber,
            ayahNumber = ayah.ayahNumber,
            expectedUthmani = ayah.uthmaniText,
            spokenTranscript = spokenTranscript
        )
        _voiceReport.value = report
        viewModelScope.launch {
            localRepository.recordVerseProgress(
                compositeKey = ayah.compositeKey,
                isMemorized = report.accuracyPercent >= 85,
                score = report.accuracyPercent
            )
        }
    }

    fun clearVoiceReport() {
        _voiceReport.value = null
    }

    // AI Scholar with RAG + Hallucination Guard
    fun askAiScholar(question: String) {
        val cleanQuestion = question.trim()
        if (cleanQuestion.isEmpty()) return

        viewModelScope.launch {
            _scholarUiState.value = ScholarUiState.Loading
            val configuredModel = userPrefs.value.remoteConfigAiModel
            val result = aiScholarRepository.askScholarWithRag(
                question = cleanQuestion,
                configuredModelName = configuredModel
            )
            result.onSuccess { structured ->
                _scholarUiState.value = ScholarUiState.Success(structured)
                _scholarHistory.value = listOf(structured) + _scholarHistory.value
            }.onFailure { err ->
                _scholarUiState.value = ScholarUiState.Error(
                    err.localizedMessage ?: "تعذر الحصول على إجابة موثقة حالياً."
                )
            }
        }
    }

    // Content Governance Error Reporting
    fun submitContentErrorReport(
        screenName: String,
        referenceKey: String,
        itemTitle: String,
        details: String
    ) {
        if (details.isBlank()) return
        viewModelScope.launch {
            val report = ErrorReportEntity(
                screenName = screenName,
                referenceKey = referenceKey,
                itemTitle = itemTitle,
                reportDetails = details.trim()
            )
            localRepository.submitErrorReport(report)
            syncToCloudIfAuthenticated(
                recordType = "error_report",
                title = "بلاغ مراجعة علمية: $itemTitle",
                referenceKey = referenceKey,
                scoreOrCount = 1L,
                notes = details.trim()
            )
            _statusBannerMessage.value = "تم إرسال بلاغ المراجعة العلمية إلى لجنة التدقيق بنجاح"
        }
    }

    // Smart Recurring Mistakes Log Actions
    fun recordRecitationMistake(
        surahNumber: Int,
        surahNameAr: String,
        ayahNumber: Int,
        wordIndex: Int,
        expectedWord: String,
        spokenMistakeWord: String,
        tajweedHint: String
    ) {
        viewModelScope.launch {
            localRepository.recordRecitationMistake(
                surahNumber = surahNumber,
                surahNameAr = surahNameAr,
                ayahNumber = ayahNumber,
                wordIndex = wordIndex,
                expectedWord = expectedWord,
                spokenMistakeWord = spokenMistakeWord,
                tajweedHint = tajweedHint
            )
            syncToCloudIfAuthenticated(
                recordType = "fsrs_review",
                title = "سجل تنبيهات التسميع: سورة $surahNameAr ($ayahNumber)",
                referenceKey = "${surahNumber}_${ayahNumber}_${wordIndex}",
                scoreOrCount = 1L,
                notes = "الكلمة: $expectedWord | المنطوق: $spokenMistakeWord | $tajweedHint"
            )
        }
    }

    fun toggleMistakeResolved(mistakeId: String, resolved: Boolean) {
        viewModelScope.launch {
            localRepository.toggleMistakeResolved(mistakeId, resolved)
            _statusBannerMessage.value = if (resolved) {
                "تم تعليم الموضع كـ «تم إتقانه وضبطه» في سجل الأخطاء"
            } else {
                "أُعيد الموضع إلى قائمة التركيز والمراجعة"
            }
        }
    }

    // Scheduled Khatmah Planner & Daily Wird Actions
    fun createKhatmahPlan(
        titleAr: String,
        khatmahTypeAr: String,
        targetDays: Int
    ) {
        viewModelScope.launch {
            val cleanDays = targetDays.coerceIn(3, 365)
            val dailyPages = (604 / cleanDays).coerceAtLeast(1)
            val plan = com.example.data.local.KhatmahPlanEntity(
                planId = "khatmah_${System.currentTimeMillis()}",
                titleAr = titleAr.ifBlank { "ختمة إتقان ($cleanDays يوماً)" },
                khatmahTypeAr = khatmahTypeAr,
                targetDays = cleanDays,
                totalPages = 604,
                completedPages = 0,
                dailyPagesTarget = dailyPages,
                currentSurahNumber = 1,
                currentSurahNameAr = "الفاتحة",
                currentAyahNumber = 1,
                completedDaysStreak = 1,
                isActive = true
            )
            localRepository.saveKhatmahPlan(plan)
            syncToCloudIfAuthenticated(
                recordType = "lesson_progress",
                title = plan.titleAr,
                referenceKey = plan.planId,
                scoreOrCount = dailyPages.toLong(),
                notes = "النوع: $khatmahTypeAr | الهدف اليومي: $dailyPages صفحة"
            )
            _statusBannerMessage.value = "تم إنشاء «${plan.titleAr}» بورد يومي قدره $dailyPages صفحة"
        }
    }

    fun logDailyKhatmahWirdProgress(plan: com.example.data.local.KhatmahPlanEntity) {
        viewModelScope.launch {
            val nextCompletedPages = (plan.completedPages + plan.dailyPagesTarget).coerceAtMost(plan.totalPages)
            val nextStreak = plan.completedDaysStreak + 1
            val updated = plan.copy(
                completedPages = nextCompletedPages,
                completedDaysStreak = nextStreak,
                lastUpdatedTimestamp = System.currentTimeMillis()
            )
            localRepository.saveKhatmahPlan(updated)
            syncToCloudIfAuthenticated(
                recordType = "lesson_progress",
                title = "إنجاز ورد الختمة: ${plan.titleAr}",
                referenceKey = plan.planId,
                scoreOrCount = nextCompletedPages.toLong(),
                notes = "الصفحات المنجزة: $nextCompletedPages من ${plan.totalPages}"
            )
            _statusBannerMessage.value =
                "تقبل الله! تم تسجيل إنجاز الورد اليومي (${nextCompletedPages}/${plan.totalPages} صفحة)"
        }
    }

    // Cloud Group Recitation Halqahs & Friendly Competition
    fun joinOrCompleteGroupHalqahWird(halqahId: String) {
        viewModelScope.launch {
            val currentList = _groupHalqahs.value
            val target = currentList.find { it.halqahId == halqahId } ?: return@launch
            val updatedHalqah = if (!target.isJoined) {
                target.copy(
                    isJoined = true,
                    participantsCount = target.participantsCount + 1,
                    userCompletedWirds = target.userCompletedWirds + 1,
                    userMasteryPoints = target.userMasteryPoints + 50
                )
            } else {
                target.copy(
                    userCompletedWirds = target.userCompletedWirds + 1,
                    userMasteryPoints = target.userMasteryPoints + 50,
                    leaderboardPreview = target.leaderboardPreview.map { (name, pts) ->
                        if (name.contains("أنت")) name to (pts + 50) else name to pts
                    }.sortedByDescending { it.second }
                )
            }
            _groupHalqahs.value = currentList.map { if (it.halqahId == halqahId) updatedHalqah else it }
            syncToCloudIfAuthenticated(
                recordType = "lesson_progress",
                title = "حلقة جماعية: ${updatedHalqah.titleAr}",
                referenceKey = halqahId,
                scoreOrCount = updatedHalqah.userMasteryPoints.toLong(),
                notes = "الأوراد المنجزة في الحلقة: ${updatedHalqah.userCompletedWirds}"
            )
            _statusBannerMessage.value = if (!target.isJoined) {
                "تم الانضمام إلى «${target.titleAr}» وتسجيل أول ورد جماعي (+٥٠ نقطة إتقان)"
            } else {
                "بارك الله فيك! تم توثيق وردك اليومي في «${target.titleAr}» (+٥٠ نقطة إتقان)"
            }
        }
    }

    // Phase 3: Colored Qira'at Narrator Selection
    fun selectQiraatNarrator(narratorId: String) {
        _selectedQiraatNarratorId.value = narratorId
        val profile = qiraatNarratorProfiles.find { it.narratorId == narratorId }
        if (profile != null) {
            _statusBannerMessage.value = "تم تفعيل عرض مصحف القراءات الملون: ${profile.shortLabelAr}"
        }
    }

    // Phase 3: Quranic Khalwah & Tadabbur Journal Actions
    fun saveTadabburJournalEntry(
        surahNumber: Int,
        surahNameAr: String,
        ayahNumber: Int,
        uthmaniText: String,
        meaningFromTafsirAr: String,
        hidayahInsightAr: String,
        practicalActionPlanAr: String,
        khalwahMinutes: Int
    ) {
        if (hidayahInsightAr.isBlank() && practicalActionPlanAr.isBlank()) return
        viewModelScope.launch {
            val entry = com.example.data.local.TadabburJournalEntity(
                journalId = "tadabbur_${surahNumber}_${ayahNumber}_${System.currentTimeMillis()}",
                compositeKey = "$surahNumber:$ayahNumber",
                surahNumber = surahNumber,
                surahNameAr = surahNameAr,
                ayahNumber = ayahNumber,
                uthmaniText = uthmaniText,
                meaningFromTafsirAr = meaningFromTafsirAr.ifBlank { "تدبر معنى الآية الكريمة من التفاسير المعتمدة" },
                hidayahInsightAr = hidayahInsightAr.trim(),
                practicalActionPlanAr = practicalActionPlanAr.trim(),
                khalwahMinutes = khalwahMinutes.coerceIn(5, 120),
                sourceCitation = "دفتر الخلوة القرآنية والتدبر المنهجي"
            )
            localRepository.saveTadabburJournal(entry)
            syncToCloudIfAuthenticated(
                recordType = "bookmark",
                title = "تدبر سورة $surahNameAr ($ayahNumber)",
                referenceKey = entry.compositeKey,
                scoreOrCount = khalwahMinutes.toLong(),
                notes = "${entry.hidayahInsightAr} | العمل: ${entry.practicalActionPlanAr}"
            )
            _statusBannerMessage.value = "تم حفظ تدوينتك في دفتر التدبرات والخلوة القرآنية ومزامنتها"
        }
    }

    // Phase 3: Teacher & Muhaffiz Portal Actions
    fun createTeacherWirdAssignment(
        classroomId: String,
        surahNumber: Int,
        ayahStart: Int,
        ayahEnd: Int,
        requiredRepetitions: Int,
        focusTajweedRuleAr: String,
        teacherInstructionsAr: String
    ) {
        viewModelScope.launch {
            val classroom = teacherClassrooms.find { it.classroomId == classroomId } ?: teacherClassrooms.first()
            val surahMeta = surahCatalog.find { it.number == surahNumber }
            val surahNameAr = surahMeta?.nameAr ?: "الفاتحة"
            val assignment = com.example.data.local.WirdAssignmentEntity(
                assignmentId = "assign_${surahNumber}_${ayahStart}_${System.currentTimeMillis()}",
                classroomId = classroom.classroomId,
                classroomTitleAr = classroom.titleAr,
                supervisorNameAr = classroom.supervisorNameAr,
                surahNumber = surahNumber,
                surahNameAr = surahNameAr,
                ayahStart = ayahStart.coerceAtLeast(1),
                ayahEnd = ayahEnd.coerceAtLeast(ayahStart),
                requiredRepetitions = requiredRepetitions.coerceIn(1, 30),
                focusTajweedRuleAr = focusTajweedRuleAr.ifBlank { "تحقيق مخارج الحروف ومقادير المدود" },
                teacherInstructionsAr = teacherInstructionsAr.ifBlank { "تسميع المقطع في حلقة الشيخ الصوتية الحية" },
                completedStudentsCount = 1,
                totalStudentsCount = classroom.studentsCount,
                isCompletedByCurrentStudent = false,
                dueDateLabelAr = "خلال ٣ أيام"
            )
            localRepository.saveWirdAssignment(assignment)
            syncToCloudIfAuthenticated(
                recordType = "lesson_progress",
                title = "تكليف ورد جديد: سورة $surahNameAr ($ayahStart-$ayahEnd)",
                referenceKey = assignment.assignmentId,
                scoreOrCount = requiredRepetitions.toLong(),
                notes = "${classroom.titleAr} | ${assignment.focusTajweedRuleAr}"
            )
            _statusBannerMessage.value = "تم إصدار تكليف الورد الجديد لطلاب «${classroom.titleAr}»"
        }
    }

    fun markWirdAssignmentCompleted(assignment: com.example.data.local.WirdAssignmentEntity) {
        viewModelScope.launch {
            val updated = assignment.copy(
                isCompletedByCurrentStudent = true,
                completedStudentsCount = (assignment.completedStudentsCount + 1).coerceAtMost(assignment.totalStudentsCount),
                dueDateLabelAr = "مكتمل ✓"
            )
            localRepository.saveWirdAssignment(updated)
            syncToCloudIfAuthenticated(
                recordType = "lesson_progress",
                title = "إتمام تكليف المعلم: سورة ${assignment.surahNameAr}",
                referenceKey = assignment.assignmentId,
                scoreOrCount = 100L,
                notes = "أتم الطالب الورد المكلف به (${assignment.requiredRepetitions} تكرارات)"
            )
            _statusBannerMessage.value = "تقبل الله! تم توثيق إنجاز تكليف المعلم في سورة ${assignment.surahNameAr}"
        }
    }

    fun submitTeacherFeedbackOnStudentSubmission(
        submissionId: String,
        feedbackNote: String
    ) {
        if (feedbackNote.isBlank()) return
        viewModelScope.launch {
            val list = _studentSubmissions.value
            val target = list.find { it.submissionId == submissionId } ?: return@launch
            val updated = target.copy(
                teacherFeedbackNote = feedbackNote.trim(),
                isReviewedByTeacher = true
            )
            _studentSubmissions.value = list.map { if (it.submissionId == submissionId) updated else it }
            syncToCloudIfAuthenticated(
                recordType = "lesson_progress",
                title = "ملاحظة المعلم للطالب: ${target.studentNameAr}",
                referenceKey = submissionId,
                scoreOrCount = target.autoAccuracyPercent.toLong(),
                notes = feedbackNote.trim()
            )
            _statusBannerMessage.value = "تم إرسال الملاحظة التجويدية الموثقة للطالب «${target.studentNameAr}»"
        }
    }

    fun issueStageCertificateForStudentSubmission(submissionId: String) {
        viewModelScope.launch {
            val list = _studentSubmissions.value
            val target = list.find { it.submissionId == submissionId } ?: return@launch
            val updated = target.copy(
                isReviewedByTeacher = true,
                stageCertificateIssued = true
            )
            _studentSubmissions.value = list.map { if (it.submissionId == submissionId) updated else it }

            val cert = certificateIssuer.createCertificate(
                studentName = target.studentNameAr,
                track = ScienceTrackId.TAJWEED,
                scorePercent = target.autoAccuracyPercent.coerceAtLeast(85)
            )
            if (cert != null) {
                localRepository.saveCertificate(cert)
                syncToCloudIfAuthenticated(
                    recordType = "certificate",
                    title = "شهادة إتمام مرحلية: ${target.studentNameAr}",
                    referenceKey = cert.verificationCode,
                    scoreOrCount = cert.scorePercent.toLong(),
                    notes = cert.qrPayload
                )
                _statusBannerMessage.value = "تم اعتماد وإصدار شهادة الإتمام المرحلية للطالب «${target.studentNameAr}» برمز (${cert.verificationCode})"
            }
        }
    }

    fun submitDiagnosticPlacementScore(scorePercent: Int) {
        viewModelScope.launch {
            val recommendedLevel = when {
                scorePercent >= 85 -> "المستوى المتقدم (القراءات العشر وتحقيق المخارج)"
                scorePercent >= 60 -> "المستوى المتوسط (تحفة الأطفال والمقدمة الجزرية)"
                else -> "المستوى التأسيسي (مخارج الحروف الـ ١٧ وأحكام النون الساكنة)"
            }
            syncToCloudIfAuthenticated(
                recordType = "lesson_progress",
                title = "الاختبار التشخيصي لتحديد المستوى",
                referenceKey = "diagnostic_placement_quiz",
                scoreOrCount = scorePercent.toLong(),
                notes = "المسار الموصى به: $recommendedLevel"
            )
            _statusBannerMessage.value = "نتيجة الاختبار التشخيصي: $scorePercent% — المسار الموصى به: $recommendedLevel"
        }
    }

    // Settings updates
    fun setThemeMode(mode: ItqanThemeMode) {
        viewModelScope.launch { localRepository.updateThemeMode(mode) }
    }

    fun setFontScale(scale: Float) {
        viewModelScope.launch { localRepository.updateFontScale(scale) }
    }

    fun setUseEasternDigits(enabled: Boolean) {
        viewModelScope.launch { localRepository.updateEasternDigits(enabled) }
    }

    fun setShowTajweedColors(enabled: Boolean) {
        viewModelScope.launch { localRepository.updateTajweedColors(enabled) }
    }

    fun setMushafPageMode(isPageMode: Boolean) {
        viewModelScope.launch { localRepository.updateMushafPageMode(isPageMode) }
    }

    fun setStudentName(name: String) {
        viewModelScope.launch {
            localRepository.updateStudentName(name)
            _statusBannerMessage.value = "تم تحديث اسم طالب العلم للشهادات"
        }
    }

    fun setRemoteConfigAiModel(modelName: String) {
        viewModelScope.launch {
            localRepository.updateRemoteConfigAiModel(modelName)
            _statusBannerMessage.value = "تم تحديث معرف نموذج المعلم الذكي إلى: $modelName"
        }
    }

    private suspend fun syncToCloudIfAuthenticated(
        recordType: String,
        title: String,
        referenceKey: String,
        scoreOrCount: Long,
        notes: String? = null
    ) {
        if (authenticatedUserId != null && cloudSyncRepository != null) {
            cloudSyncRepository.createRecord(
                recordType = recordType,
                title = title,
                referenceKey = referenceKey,
                scoreOrCount = scoreOrCount,
                notes = notes
            )
        }
    }

    override fun onCleared() {
        super.onCleared()
        audioPlayer.releaseMediaPlayer()
    }

    companion object {
        fun provideFactory(
            authenticatedUserId: String?
        ): ViewModelProvider.Factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>, extras: CreationExtras): T {
                val app = checkNotNull(extras[ViewModelProvider.AndroidViewModelFactory.APPLICATION_KEY])
                val db = ItqanDatabase.getInstance(app)
                val localRepo = ItqanLocalRepository(app, db.itqanDao())
                val aiRepo = AiScholarRagRepository(localRepo)
                val cloudRepo = if (authenticatedUserId != null) {
                    val databaseId = app.getString(R.string.firestore_database_id)
                    val firestore = FirebaseFirestore.getInstance(databaseId)
                    CloudSyncRepository(firestore)
                } else {
                    null
                }
                return ItqanViewModel(
                    localRepository = localRepo,
                    aiScholarRepository = aiRepo,
                    cloudSyncRepository = cloudRepo,
                    authenticatedUserId = authenticatedUserId
                ) as T
            }
        }
    }
}
