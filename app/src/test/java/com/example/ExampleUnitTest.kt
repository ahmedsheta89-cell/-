package com.example

import com.example.data.local.FsrsReviewEntity
import com.example.domain.model.ScienceTrackId
import com.example.domain.model.WordDiffStatus
import com.example.domain.usecase.ArabicTextNormalizer
import com.example.domain.usecase.GradeQuizAndIssueCertificateUseCase
import com.example.domain.usecase.ScheduleFsrsReviewUseCase
import com.example.domain.usecase.VerifyVoiceRecitationUseCase
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class ExampleUnitTest {

    private val fsrsScheduler = ScheduleFsrsReviewUseCase()
    private val voiceVerifier = VerifyVoiceRecitationUseCase()
    private val certificateIssuer = GradeQuizAndIssueCertificateUseCase()

    @Test
    fun arabicNormalizer_stripsTashkeelAndNormalizesAlef() {
        val raw = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"
        val normalized = ArabicTextNormalizer.normalizeForSearch(raw)
        assertTrue(normalized.contains("بسم"))
        assertTrue(normalized.contains("الرحمن"))
    }

    @Test
    fun fsrsScheduler_increasesStabilityOnEasyGrade() {
        val initial = FsrsReviewEntity(
            itemId = "hifz_1_1_7",
            title = "سورة الفاتحة",
            surahNumber = 1,
            ayahStart = 1,
            ayahEnd = 7,
            targetRepetitions = 5,
            completedRepetitions = 2,
            stability = 2.0,
            difficulty = 4.0,
            elapsedDays = 2,
            scheduledDays = 2,
            reps = 1,
            lapses = 0,
            lastGrade = 3,
            dueTimestamp = 1000L,
            lastReviewTimestamp = 1000L
        )

        val scheduledEasy = fsrsScheduler.scheduleNext(initial, grade = 4, nowMillis = 5000L)
        assertTrue(scheduledEasy.stability > initial.stability)
        assertTrue(scheduledEasy.scheduledDays >= 2)
        assertEquals(2, scheduledEasy.reps)

        val scheduledAgain = fsrsScheduler.scheduleNext(initial, grade = 1, nowMillis = 5000L)
        assertEquals(1, scheduledAgain.scheduledDays)
        assertEquals(1, scheduledAgain.lapses)
    }

    @Test
    fun voiceVerifier_scoresAccurateAndPartialRecitations() {
        val expected = "قُلْ هُوَ اللَّهُ أَحَدٌ"
        val exactReport = voiceVerifier.evaluateRecitation(
            surahNumber = 112,
            ayahNumber = 1,
            expectedUthmani = expected,
            spokenTranscript = "قل هو الله احد"
        )
        assertEquals(100, exactReport.accuracyPercent)
        assertTrue(exactReport.wordDiffs.none { it.status == WordDiffStatus.MISSED })

        val partialReport = voiceVerifier.evaluateRecitation(
            surahNumber = 112,
            ayahNumber = 1,
            expectedUthmani = expected,
            spokenTranscript = "قل هو الله"
        )
        assertEquals(75, partialReport.accuracyPercent)
        assertEquals(1, partialReport.wordDiffs.count { it.status == WordDiffStatus.MISSED })
    }

    @Test
    fun certificateIssuer_enforces80PercentThresholdAndQrCode() {
        val failedAttempt = certificateIssuer.createCertificate(
            studentName = "أحمد محمد",
            track = ScienceTrackId.TAJWEED,
            scorePercent = 75
        )
        assertNull(failedAttempt)

        val passedAttempt = certificateIssuer.createCertificate(
            studentName = "أحمد محمد",
            track = ScienceTrackId.TAJWEED,
            scorePercent = 90
        )
        assertNotNull(passedAttempt)
        assertTrue(passedAttempt!!.verificationCode.startsWith("ITQAN-"))
        assertTrue(passedAttempt.qrPayload.contains("VerifyCertificate"))
        assertTrue(passedAttempt.trackTitleAr.contains("شهادة إتمام دراسة منهجية داخل التطبيق"))
    }

    @Test
    fun phase2EncyclopediaAndMakharijDiagnosis_providesVerifiedReferences() {
        val diagnosis = com.example.data.local.ItqanPhase2SeedData.diagnoseWordMakharij("الصَّمَدُ")
        assertTrue(diagnosis.letterAr.isNotBlank())
        assertTrue(diagnosis.specificMakhrajAr.isNotBlank())
        assertTrue(diagnosis.sifaatAr.isNotBlank())

        assertTrue(com.example.data.local.ItqanPhase2SeedData.qiraatComparisons.isNotEmpty())
        assertTrue(com.example.data.local.ItqanPhase2SeedData.surahMindMaps.isNotEmpty())
        assertTrue(com.example.data.local.ItqanPhase2SeedData.mutashabihatRules.isNotEmpty())
        assertTrue(com.example.data.local.ItqanPhase2SeedData.gharibLexiconEntries.isNotEmpty())
    }

    @Test
    fun phase3SeventeenMakharijAtlasAndTeacherReport_isCompleteAndVerified() {
        val atlas = com.example.data.local.ItqanPhase3SeedData.seventeenMakharijAtlas
        assertEquals(17, atlas.size)
        assertTrue(atlas.any { it.generalRegionId == "jawf" })
        assertTrue(atlas.any { it.generalRegionId == "halq" })
        assertTrue(atlas.any { it.generalRegionId == "lisan" })
        assertTrue(atlas.any { it.generalRegionId == "shafatan" })
        assertTrue(atlas.any { it.generalRegionId == "khayshoom" })

        val report = com.example.data.local.ItqanPhase3SeedData.buildWeeklyStudentReportText(
            studentName = "أحمد شتا",
            streakDays = 10,
            completedLessonsCount = 6,
            certificatesCount = 2,
            memorizedVersesCount = 25,
            unresolvedMistakes = emptyList(),
            activeWirdAssignments = com.example.data.local.ItqanPhase3SeedData.buildInitialWirdAssignments()
        )
        assertTrue(report.contains("أحمد شتا"))
        assertTrue(report.contains("تقرير الأداء الأسبوعي"))
        assertEquals(4, com.example.data.local.ItqanPhase3SeedData.qiraatNarratorProfiles.size)
    }

    @Test
    fun phase4ThematicIndexWaqfLabHafsSpecialsAndBackupJson_isCompleteAndVerified() {
        val thematic = com.example.data.local.ItqanPhase4SeedData.thematicQuranIndex
        assertEquals(4, thematic.size)
        assertTrue(thematic.all { it.saadiPrincipleTitleAr.isNotBlank() && it.sourceCitation.isNotBlank() })

        val stories = com.example.data.local.ItqanPhase4SeedData.quranicStoriesAtlas
        assertTrue(stories.size >= 3)
        assertTrue(stories.all { it.pedagogicalLessons.isNotEmpty() })

        val roots = com.example.data.local.ItqanPhase4SeedData.morphologicalRootsCatalog
        assertTrue(roots.any { it.rootSpacedAr.contains("ر ح م") })
        assertTrue(roots.any { it.rootSpacedAr.contains("ع ب د") })

        val waqfExamples = com.example.data.local.ItqanPhase4SeedData.waqfAndIbtidaExamples
        assertEquals(5, waqfExamples.size)

        val hafsSpecials = com.example.data.local.ItqanPhase4SeedData.hafsSpecialPerformanceCatalog
        assertTrue(hafsSpecials.any { it.categoryAr.contains("السكتات الأربع الواجبة") })
        assertTrue(hafsSpecials.any { it.categoryAr.contains("الروم والإشمام") })

        val specialized = com.example.data.local.ItqanPhase4SeedData.specializedScienceModules
        assertEquals(3, specialized.size)

        val backupJson = com.example.data.local.ItqanPhase4SeedData.buildFullBackupJson(
            studentName = "أحمد شتا",
            streakDays = 14,
            memorizedVerses = emptyList(),
            fsrsReviews = emptyList(),
            mistakeLogs = emptyList(),
            tadabburJournals = emptyList(),
            bookmarks = emptyList(),
            certificates = emptyList()
        )
        assertTrue(backupJson.contains("itqan-v4.0-2025"))
        assertTrue(backupJson.contains("أحمد شتا"))
    }

    @Test
    fun phase5OfflineSurahsOrthographyMunasabatAndIsnadTree_isCompleteAndVerified() {
        val phase5Ayahs = com.example.data.local.ItqanPhase5SeedData.buildPhase5OfflineAyahs()
        assertEquals(8, phase5Ayahs.count { it.surahNumber == 94 }) // Ash-Sharh complete
        assertEquals(3, phase5Ayahs.count { it.surahNumber == 108 }) // Al-Kawthar complete

        val rasmCatalog = com.example.data.local.ItqanPhase5SeedData.uthmaniOrthographyAndFawasilCatalog
        assertTrue(rasmCatalog.size >= 5)
        assertTrue(rasmCatalog.any { it.categoryAr.contains("الفواصل وعدّ الآي") })

        val munasabat = com.example.data.local.ItqanPhase5SeedData.surahMunasabatAndAnchorsCatalog
        assertTrue(munasabat.size >= 3)
        assertTrue(munasabat.all { it.hifzSequentialAnchors.isNotEmpty() })

        val isnadTree = com.example.data.local.ItqanPhase5SeedData.tenReadersIsnadTree
        assertEquals(10, isnadTree.size)

        val readinessReport = com.example.data.local.ItqanPhase5SeedData.buildComprehensiveIjazahReadinessReport(
            studentName = "أحمد شتا",
            memorizedVersesCount = 24,
            completedLessonsCount = 8,
            certificatesCount = 3,
            unresolvedMistakesCount = 0,
            averageFsrsStability = 4.5
        )
        assertTrue(readinessReport.contains("مؤشر الجاهزية الشامل للعرض"))
        assertTrue(readinessReport.contains("أحمد شتا"))
    }

    @Test
    fun phase6OfflineSurahsWujuhFurukMutashabihatAndBreathDrills_isCompleteAndVerified() {
        val phase6Ayahs = com.example.data.local.ItqanPhase6SeedData.buildPhase6OfflineAyahs()
        assertEquals(4, phase6Ayahs.count { it.surahNumber == 106 }) // Quraysh complete
        assertEquals(3, phase6Ayahs.count { it.surahNumber == 110 }) // An-Nasr complete
        assertEquals(5, phase6Ayahs.count { it.surahNumber == 111 }) // Al-Masad complete

        val wujuh = com.example.data.local.ItqanPhase6SeedData.wujuhWaNazairCatalog
        assertTrue(wujuh.size >= 5)
        assertTrue(wujuh.all { it.meanings.isNotEmpty() && it.sourceCitation.isNotBlank() })

        val furuk = com.example.data.local.ItqanPhase6SeedData.linguisticFurukCatalog
        assertTrue(furuk.size >= 6)
        assertTrue(furuk.all { it.rhetoricalSecretAr.isNotBlank() })

        val drills = com.example.data.local.ItqanPhase6SeedData.mutashabihatDrillExercises
        assertTrue(drills.size >= 5)
        assertTrue(drills.all { it.mnemonicAnchorRuleAr.isNotBlank() })

        val breathDrills = com.example.data.local.ItqanPhase6SeedData.breathAndEnduranceDrills
        assertTrue(breathDrills.size >= 4)
        assertTrue(breathDrills.all { it.segmentedStopsAr.isNotEmpty() && it.targetBreathSeconds >= 10 })
    }
}

