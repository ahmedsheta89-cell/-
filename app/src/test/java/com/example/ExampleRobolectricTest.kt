package com.example

import android.content.Context
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import com.example.data.local.BookmarkNoteEntity
import com.example.data.local.ErrorReportEntity
import com.example.data.local.ItqanDatabase
import com.example.data.local.LessonProgressEntity
import com.example.data.repository.AiScholarRagRepository
import com.example.data.repository.ItqanLocalRepository
import com.example.domain.model.ScienceTrackId
import com.example.domain.usecase.GradeQuizAndIssueCertificateUseCase
import com.example.ui.theme.ItqanTheme
import com.example.ui.theme.ItqanThemeMode
import com.example.ui.viewmodel.ItqanViewModel
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class ExampleRobolectricTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    private lateinit var context: Context
    private lateinit var database: ItqanDatabase
    private lateinit var localRepository: ItqanLocalRepository
    private lateinit var aiScholarRepository: AiScholarRagRepository

    @Before
    fun setUp() {
        context = ApplicationProvider.getApplicationContext()
        database = Room.inMemoryDatabaseBuilder(context, ItqanDatabase::class.java)
            .allowMainThreadQueries()
            .build()
        localRepository = ItqanLocalRepository(context, database.itqanDao())
        aiScholarRepository = AiScholarRagRepository(localRepository)
    }

    @After
    fun tearDown() {
        database.close()
    }

    @Test
    fun verifyAppResourcesAndConfiguration() {
        val appName = context.getString(R.string.app_name)
        assertEquals("إتقان - معلم القرآن", appName)

        val dbId = context.getString(R.string.firestore_database_id)
        assertTrue(dbId.isNotBlank())
    }

    @Test
    fun verifyRoomSeedSearchBookmarksCertificatesAndErrorReports() = runBlocking {
        localRepository.ensureSeeded()

        val fatihaAyahs = localRepository.observeAyahsBySurah(1).first()
        assertEquals(7, fatihaAyahs.size)

        // Verify QuranVerse entity progress update
        localRepository.recordVerseProgress(
            compositeKey = "1:1",
            isMemorized = true,
            score = 98
        )
        val memorizedVerses = localRepository.observeMemorizedVerses().first()
        assertEquals(1, memorizedVerses.size)
        assertTrue(memorizedVerses.first().isMemorized)
        assertEquals(98, memorizedVerses.first().memorizationScore)
        assertEquals(1, memorizedVerses.first().recitationCount)

        val ikhlasResults = localRepository.searchAyahsInstant("قل هو الله احد")
        assertTrue(ikhlasResults.any { it.surahNumber == 112 && it.ayahNumber == 1 })

        // Save and verify Bookmark
        val targetAyah = fatihaAyahs.first()
        localRepository.saveBookmarkNote(
            BookmarkNoteEntity(
                compositeKey = targetAyah.compositeKey,
                surahNumber = targetAyah.surahNumber,
                surahNameAr = targetAyah.surahNameAr,
                ayahNumber = targetAyah.ayahNumber,
                uthmaniSnippet = targetAyah.uthmaniText,
                personalNote = "تدبر البسملة والاستعانة بالله",
                isFavorite = true
            )
        )
        val bookmarks = localRepository.observeBookmarks().first()
        assertEquals(1, bookmarks.size)
        assertEquals("1:1", bookmarks.first().compositeKey)

        // Save and verify Lesson Progress & Certificate (>= 80%)
        localRepository.saveLessonProgress(
            LessonProgressEntity(
                lessonId = "tajweed_1",
                trackId = ScienceTrackId.TAJWEED.id,
                completed = true,
                quizScorePercent = 95,
                attemptsCount = 1
            )
        )
        val cert = GradeQuizAndIssueCertificateUseCase().createCertificate(
            studentName = "أحمد شتا",
            track = ScienceTrackId.TAJWEED,
            scorePercent = 95
        )
        assertNotNull(cert)
        localRepository.saveCertificate(cert!!)
        val certs = localRepository.observeCertificates().first()
        assertEquals(1, certs.size)
        assertEquals("أحمد شتا", certs.first().studentName)

        // Submit Content Governance Error Report
        localRepository.submitErrorReport(
            ErrorReportEntity(
                screenName = "المصحف التفاعلي",
                referenceKey = "1:1",
                itemTitle = "سورة الفاتحة",
                reportDetails = "تدقيق علامة الوقف"
            )
        )
        val reports = localRepository.observeErrorReports().first()
        assertEquals(1, reports.size)
    }

    @Test
    fun verifyAiScholarRagHallucinationGuardAndFatwaReferral() = runBlocking {
        localRepository.ensureSeeded()

        val chunks = aiScholarRepository.retrieveRelevantChunks("ما الفرق بين الإدغام بغنة وبغير غنة؟", topK = 3)
        assertFalse(chunks.isEmpty())

        // Test Hallucination Guard: valid ref "1:1" resolves from local Room DB, fake ref "999:999" is stripped
        val sampleLlmJson = """
            {
              "answer": "ينقسم الإدغام في أحكام النون الساكنة والتنوين إلى إدغام بغنة في حروف (ينمو) وإدغام بغير غنة في اللام والراء.",
              "citations": [
                {
                  "book": "تحفة الأطفال والغلمان",
                  "author": "الإمام سليمان الجمزوري",
                  "reference": "باب أحكام النون الساكنة والتنوين"
                }
              ],
              "ayah_refs": ["1:1", "999:999"],
              "confidence": 0.94,
              "needs_scholar_referral": false
            }
        """.trimIndent()

        val validated = aiScholarRepository.parseAndValidateStructuredOutput(
            question = "ما أقسام الإدغام؟",
            jsonString = sampleLlmJson,
            retrievedChunks = chunks,
            isExplicitFatwaRequest = false,
            modelUsed = "gemini-2.5-flash"
        ).getOrThrow()

        assertEquals(1, validated.resolvedAyahs.size)
        assertEquals(1, validated.resolvedAyahs.first().surahNumber)
        assertEquals(1, validated.resolvedAyahs.first().ayahNumber)
        assertFalse(validated.needsScholarReferral)
        assertFalse(validated.citations.isEmpty())

        // Test Fatwa Referral Guard
        val fatwaValidated = aiScholarRepository.buildOfflineGroundedResponse(
            question = "أفتني ما حكم طلاق الغضبان وكفارة يمين؟",
            retrievedChunks = chunks,
            isExplicitFatwaRequest = true,
            modelLabel = "gemini-3.8-flash"
        ).getOrThrow()

        assertTrue(fatwaValidated.needsScholarReferral)
        assertTrue(fatwaValidated.answer.contains("لا يصدر فتاوى فقهية"))
    }

    @Test
    fun verifyLiveHalqahTeacherRealTimeTrackingAndInterruption() = runBlocking {
        localRepository.ensureSeeded()
        val ikhlasAyahOne = localRepository.getAyahByKey("112:1")
        assertNotNull(ikhlasAyahOne)

        var completedScore = -1
        val halqahManager = com.example.data.audio.LiveHalqahTeacherManager(
            context = context,
            onVerseCompletedWithScore = { _, score -> completedScore = score }
        )
        halqahManager.loadVerseForHalqah(ikhlasAyahOne!!)

        // 1. First two words spoken accurately -> pointer advances in real time
        assertTrue(halqahManager.evaluateNextSpokenWordLive("قل"))
        assertEquals(1, halqahManager.state.value.activeWordIndex)
        assertTrue(halqahManager.evaluateNextSpokenWordLive("هو"))
        assertEquals(2, halqahManager.state.value.activeWordIndex)

        // 2. Student makes a mistake on the 3rd word -> Sheikh immediately interrupts!
        assertFalse(halqahManager.evaluateNextSpokenWordLive("الرحمن"))
        assertEquals(
            com.example.data.audio.HalqahTeacherPersonaStatus.INTERRUPTING_CORRECTING,
            halqahManager.state.value.personaStatus
        )
        assertNotNull(halqahManager.state.value.activeInterruption)
        assertEquals("رحمن", halqahManager.state.value.activeInterruption!!.spokenWord.removePrefix("ال"))

        // 3. Resume from corrected word and complete the Ayah
        halqahManager.resumeFromCorrectedWord()
        assertTrue(halqahManager.evaluateNextSpokenWordLive("الله"))
        assertFalse(halqahManager.evaluateNextSpokenWordLive("أحد")) // Last word finishes the Ayah!
        assertEquals(
            com.example.data.audio.HalqahTeacherPersonaStatus.PRAISING_COMPLETION,
            halqahManager.state.value.personaStatus
        )
        assertTrue(completedScore >= 50)

        // 4. Test Husary voice recording & waveform comparison
        halqahManager.recordAndCompareWithHusary()
        assertTrue(halqahManager.state.value.husaryReferenceWaveform.isNotEmpty())
        assertTrue(halqahManager.state.value.studentWaveformSamples.isNotEmpty())
        assertTrue(halqahManager.state.value.waveformSimilarityPercent >= 65)
        assertTrue(halqahManager.state.value.makhrajDiagnosisSummary.isNotBlank())

        halqahManager.release()
    }

    @Test
    fun verifyPhase2ExpandedSurahsMistakeLogAndKhatmahPlanner() = runBlocking {
        localRepository.ensureSeeded()

        // 1. Verify expanded offline Surahs (Al-Ikhlas 4 ayahs, Al-Falaq 5 ayahs, An-Nas 6 ayahs, Al-Asr 3 ayahs)
        val ikhlasAyahs = localRepository.observeAyahsBySurah(112).first()
        assertEquals(4, ikhlasAyahs.size)
        val falaqAyahs = localRepository.observeAyahsBySurah(113).first()
        assertEquals(5, falaqAyahs.size)
        val nasAyahs = localRepository.observeAyahsBySurah(114).first()
        assertEquals(6, nasAyahs.size)
        val asrAyahs = localRepository.observeAyahsBySurah(103).first()
        assertEquals(3, asrAyahs.size)

        // 2. Verify recurring mistake log increments occurrence count
        localRepository.recordRecitationMistake(
            surahNumber = 112,
            surahNameAr = "الإخلاص",
            ayahNumber = 2,
            wordIndex = 1,
            expectedWord = "الصَّمَدُ",
            spokenMistakeWord = "السمد",
            tajweedHint = "تفخيم الصاد وإطباقها دون قلبها سيناً"
        )
        val logsAfterFirst = localRepository.observeMistakeLogs().first()
        val firstLog = logsAfterFirst.first { it.mistakeId == "112:2:1" }
        assertTrue(firstLog.occurrenceCount >= 1)

        localRepository.recordRecitationMistake(
            surahNumber = 112,
            surahNameAr = "الإخلاص",
            ayahNumber = 2,
            wordIndex = 1,
            expectedWord = "الصَّمَدُ",
            spokenMistakeWord = "السمد",
            tajweedHint = "تفخيم الصاد وإطباقها دون قلبها سيناً"
        )
        val logsAfterSecond = localRepository.observeMistakeLogs().first()
        val secondLog = logsAfterSecond.first { it.mistakeId == "112:2:1" }
        assertEquals(firstLog.occurrenceCount + 1, secondLog.occurrenceCount)

        // 3. Verify Khatmah planner creation and persistence
        val initialPlans = localRepository.observeKhatmahPlans().first()
        assertFalse(initialPlans.isEmpty())
    }

    @Test
    fun verifyComposeNavigationAndCriticalUserJourneys() {
        runBlocking {
            localRepository.ensureSeeded()
        }
        val viewModel = ItqanViewModel(
            localRepository = localRepository,
            aiScholarRepository = aiScholarRepository,
            cloudSyncRepository = null,
            authenticatedUserId = null
        )

        composeTestRule.setContent {
            val guestClickedState = androidx.compose.runtime.remember {
                androidx.compose.runtime.mutableStateOf(false)
            }
            ItqanTheme(themeMode = ItqanThemeMode.PARCHMENT_LIGHT) {
                if (!guestClickedState.value) {
                    AuthOrGuestGateScreen(
                        isSigningIn = false,
                        authErrorMessage = null,
                        onSignInWithGoogle = {},
                        onContinueAsGuest = { guestClickedState.value = true }
                    )
                } else {
                    ItqanMainShell(
                        viewModel = viewModel,
                        currentUser = null,
                        onSignInWithGoogle = {},
                        onSignOut = {}
                    )
                }
            }
        }

        composeTestRule.waitForIdle()
        composeTestRule.onNodeWithTag("google_sign_in_button").assertExists()
        composeTestRule.onNodeWithTag("continue_guest_button").assertExists()

        // Scroll to and click Guest Offline-First Mode button
        composeTestRule.onNodeWithTag("continue_guest_button")
            .performScrollTo()
            .performClick()
        composeTestRule.waitForIdle()

        // 1. Verify Home Rawdah Screen
        composeTestRule.onNodeWithTag("home_rawdah_screen").assertIsDisplayed()

        // 2. Navigate to Interactive Mushaf Tab
        composeTestRule.onNodeWithTag("nav_tab_mushaf").performClick()
        composeTestRule.waitForIdle()
        composeTestRule.onNodeWithTag("mushaf_interactive_screen").assertIsDisplayed()

        // 3. Navigate to Academy & Matn Tab
        composeTestRule.onNodeWithTag("nav_tab_academy").performClick()
        composeTestRule.waitForIdle()

        // 4. Navigate to Hifz & Voice Tasmee' Tab
        composeTestRule.onNodeWithTag("nav_tab_hifz").performClick()
        composeTestRule.waitForIdle()

        // 5. Navigate to AI Scholar RAG Tab
        composeTestRule.onNodeWithTag("nav_tab_ai_scholar").performClick()
        composeTestRule.waitForIdle()
        composeTestRule.onNodeWithTag("ai_scholar_screen").assertIsDisplayed()

        // 6. Open Settings Modal
        composeTestRule.onNodeWithTag("top_bar_settings_button").performClick()
        composeTestRule.waitForIdle()
    }
}
