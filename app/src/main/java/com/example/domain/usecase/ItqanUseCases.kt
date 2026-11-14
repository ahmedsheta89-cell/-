package com.example.domain.usecase

import com.example.data.local.CertificateEntity
import com.example.data.local.FsrsReviewEntity
import com.example.domain.model.RecitationWordDiff
import com.example.domain.model.ScienceTrackId
import com.example.domain.model.VoiceRecitationReport
import com.example.domain.model.WordDiffStatus
import java.util.UUID
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.roundToInt

object ArabicTextNormalizer {
    private val DIACRITICS_REGEX = Regex("[\\u064B-\\u065F\\u0670\\u06D6-\\u06ED\\u0640]")

    fun normalizeForSearch(input: String): String {
        return input
            .replace(DIACRITICS_REGEX, "")
            .replace('أ', 'ا')
            .replace('إ', 'ا')
            .replace('آ', 'ا')
            .replace('ٱ', 'ا')
            .replace('ة', 'ه')
            .replace('ى', 'ي')
            .replace(Regex("\\s+"), " ")
            .trim()
    }
}

/**
 * Free Spaced Repetition Scheduler (FSRS v4 inspired) for Quranic Hifz & Revision.
 * Grade scale:
 * 1 = ضعيف / إعادة (Again)
 * 2 = مقبول بصعوبة (Hard)
 * 3 = جيد ومتقن (Good)
 * 4 = ممتاز راسخ (Easy)
 */
class ScheduleFsrsReviewUseCase {
    fun scheduleNext(
        current: FsrsReviewEntity,
        grade: Int,
        nowMillis: Long = System.currentTimeMillis()
    ): FsrsReviewEntity {
        val clampedGrade = grade.coerceIn(1, 4)
        val dayMillis = 24L * 60L * 60L * 1000L
        val elapsedDays = if (current.lastReviewTimestamp > 0L) {
            max(0, ((nowMillis - current.lastReviewTimestamp) / dayMillis).toInt())
        } else {
            0
        }

        // Update Difficulty (1.0 .. 10.0)
        val deltaD = when (clampedGrade) {
            1 -> 1.2
            2 -> 0.4
            3 -> -0.2
            else -> -0.6
        }
        val newDifficulty = (current.difficulty + deltaD).coerceIn(1.0, 10.0)

        // Update Stability (in days)
        val prevStability = max(0.5, current.stability)
        val newStability = when (clampedGrade) {
            1 -> max(0.5, prevStability * 0.45)
            2 -> prevStability * 1.25
            3 -> prevStability * (1.8 + (10.0 - newDifficulty) * 0.08)
            else -> prevStability * (2.5 + (10.0 - newDifficulty) * 0.12)
        }.coerceIn(0.5, 365.0)

        val scheduledDays = if (clampedGrade == 1) {
            1
        } else {
            max(1, newStability.roundToInt())
        }

        val nextDueMillis = nowMillis + scheduledDays * dayMillis

        return current.copy(
            completedRepetitions = current.completedRepetitions + 1,
            stability = (newStability * 10.0).roundToInt() / 10.0,
            difficulty = (newDifficulty * 10.0).roundToInt() / 10.0,
            elapsedDays = elapsedDays,
            scheduledDays = scheduledDays,
            reps = current.reps + 1,
            lapses = if (clampedGrade == 1) current.lapses + 1 else current.lapses,
            lastGrade = clampedGrade,
            dueTimestamp = nextDueMillis,
            lastReviewTimestamp = nowMillis
        )
    }
}

/**
 * Compares spoken Arabic transcript against the authenticated local Quranic text word-by-word.
 */
class VerifyVoiceRecitationUseCase {
    fun evaluateRecitation(
        surahNumber: Int,
        ayahNumber: Int,
        expectedUthmani: String,
        spokenTranscript: String
    ): VoiceRecitationReport {
        val expectedWords = expectedUthmani
            .trim()
            .split(Regex("\\s+"))
            .filter { it.isNotBlank() }

        val spokenWords = spokenTranscript
            .trim()
            .split(Regex("\\s+"))
            .filter { it.isNotBlank() }

        if (expectedWords.isEmpty()) {
            return VoiceRecitationReport(
                surahNumber = surahNumber,
                ayahNumber = ayahNumber,
                expectedUthmani = expectedUthmani,
                spokenTranscript = spokenTranscript,
                accuracyPercent = 0,
                wordDiffs = emptyList()
            )
        }

        val diffs = mutableListOf<RecitationWordDiff>()
        var matchedCount = 0
        var spokenIdx = 0

        for (expected in expectedWords) {
            val normExpected = ArabicTextNormalizer.normalizeForSearch(expected)
            val currentSpoken = spokenWords.getOrNull(spokenIdx)
            val nextSpoken = spokenWords.getOrNull(spokenIdx + 1)

            val normCurrent = currentSpoken?.let { ArabicTextNormalizer.normalizeForSearch(it) }
            val normNext = nextSpoken?.let { ArabicTextNormalizer.normalizeForSearch(it) }

            when {
                normCurrent != null && isWordMatch(normExpected, normCurrent) -> {
                    diffs.add(RecitationWordDiff(expected, currentSpoken, WordDiffStatus.MATCHED))
                    matchedCount++
                    spokenIdx++
                }
                normNext != null && isWordMatch(normExpected, normNext) -> {
                    diffs.add(RecitationWordDiff(expected, nextSpoken, WordDiffStatus.MATCHED))
                    matchedCount++
                    spokenIdx += 2
                }
                currentSpoken != null -> {
                    diffs.add(RecitationWordDiff(expected, currentSpoken, WordDiffStatus.SUBSTITUTED))
                    spokenIdx++
                }
                else -> {
                    diffs.add(RecitationWordDiff(expected, null, WordDiffStatus.MISSED))
                }
            }
        }

        val accuracy = ((matchedCount.toDouble() / expectedWords.size.toDouble()) * 100.0)
            .roundToInt()
            .coerceIn(0, 100)

        return VoiceRecitationReport(
            surahNumber = surahNumber,
            ayahNumber = ayahNumber,
            expectedUthmani = expectedUthmani,
            spokenTranscript = spokenTranscript,
            accuracyPercent = accuracy,
            wordDiffs = diffs
        )
    }

    private fun isWordMatch(expectedNorm: String, spokenNorm: String): Boolean {
        if (expectedNorm == spokenNorm) return true
        if (expectedNorm.length >= 3 && spokenNorm.length >= 3) {
            val distance = levenshteinDistance(expectedNorm, spokenNorm)
            return distance <= 1
        }
        return false
    }

    private fun levenshteinDistance(a: String, b: String): Int {
        val dp = Array(a.length + 1) { IntArray(b.length + 1) }
        for (i in 0..a.length) dp[i][0] = i
        for (j in 0..b.length) dp[0][j] = j
        for (i in 1..a.length) {
            for (j in 1..b.length) {
                val cost = if (a[i - 1] == b[j - 1]) 0 else 1
                dp[i][j] = min(
                    min(dp[i - 1][j] + 1, dp[i][j - 1] + 1),
                    dp[i - 1][j - 1] + cost
                )
            }
        }
        return dp[a.length][b.length]
    }
}

/**
 * Grades curriculum quizzes and issues a verifiable Study Completion Certificate
 * strictly when score >= 80%.
 */
class GradeQuizAndIssueCertificateUseCase {
    fun canIssueCertificate(scorePercent: Int): Boolean = scorePercent >= 80

    fun createCertificate(
        studentName: String,
        track: ScienceTrackId,
        scorePercent: Int,
        issuedAtMillis: Long = System.currentTimeMillis()
    ): CertificateEntity? {
        if (!canIssueCertificate(scorePercent)) return null

        val cleanName = studentName.trim().ifBlank { "طالب علم بمدرسة إتقان" }
        val shortHash = UUID.randomUUID().toString().uppercase().take(8)
        val verificationCode = "ITQAN-${track.id.uppercase().take(3)}-$scorePercent-$shortHash"
        val gradeLabel = when {
            scorePercent >= 95 -> "ممتاز مع مرتبة الشرف"
            scorePercent >= 90 -> "ممتاز"
            scorePercent >= 85 -> "جيد جداً مرتفع"
            else -> "جيد جداً"
        }
        val qrPayload = "https://itqan.VerifyCertificate/v1?code=$verificationCode&track=${track.id}&score=$scorePercent"

        return CertificateEntity(
            certificateId = verificationCode,
            studentName = cleanName,
            trackId = track.id,
            trackTitleAr = "شهادة إتمام دراسة منهجية داخل التطبيق: ${track.titleAr}",
            scorePercent = scorePercent,
            gradeLabelAr = gradeLabel,
            primarySourcesStudied = track.primarySourcesAr,
            verificationCode = verificationCode,
            qrPayload = qrPayload,
            issuedAtTimestamp = issuedAtMillis
        )
    }
}
