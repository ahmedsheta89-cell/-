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
}
