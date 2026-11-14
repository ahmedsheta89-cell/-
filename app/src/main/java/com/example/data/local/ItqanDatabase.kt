package com.example.data.local

import android.content.Context
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

/**
 * Primary Room Entity representing a Quranic verse with offline Uthmani text,
 * classical Quranic sciences commentary, and user memorization/recitation progress.
 */
@Entity(tableName = "quran_ayahs")
data class QuranVerse(
    @PrimaryKey val compositeKey: String, // "surah:ayah" e.g. "1:1", "2:255"
    val surahNumber: Int,
    val surahNameAr: String,
    val revelationType: String,
    val ayahNumber: Int,
    val pageNumber: Int,
    val juzNumber: Int,
    val hizbNumber: Int,
    val uthmaniText: String,
    val plainSearchText: String,
    val tafsirMuyassar: String,
    val tafsirSaadi: String,
    val tafsirIbnKathir: String,
    val tafsirTabari: String,
    val gharibKalimat: String,     // مفردات الراغب الأصفهاني
    val asbabNuzul: String,        // أسباب النزول للواحدي
    val irabAndBalaghah: String,   // الإعراب والوجوه البلاغية
    val tajweedAndQiraat: String,  // أحكام التجويد وفرش القراءات العشر
    val contentVersion: String = "v2025.1",
    // Offline User Progress Data per Verse
    val isMemorized: Boolean = false,
    val recitationCount: Int = 0,
    val memorizationScore: Int = 0,
    val lastReviewedTimestamp: Long = 0L
)

typealias AyahEntity = QuranVerse

@Entity(tableName = "bookmarks_notes")
data class BookmarkNoteEntity(
    @PrimaryKey val compositeKey: String, // "surah:ayah"
    val surahNumber: Int,
    val surahNameAr: String,
    val ayahNumber: Int,
    val uthmaniSnippet: String,
    val personalNote: String,
    val isFavorite: Boolean,
    val updatedAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "lesson_progress")
data class LessonProgressEntity(
    @PrimaryKey val lessonId: String,
    val trackId: String,
    val completed: Boolean,
    val quizScorePercent: Int,
    val attemptsCount: Int,
    val completedAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "fsrs_reviews")
data class FsrsReviewEntity(
    @PrimaryKey val itemId: String, // e.g. "hifz_1_1_7" or "hifz_2_255_255"
    val title: String,
    val surahNumber: Int,
    val ayahStart: Int,
    val ayahEnd: Int,
    val targetRepetitions: Int,
    val completedRepetitions: Int,
    val stability: Double,       // FSRS Stability (days)
    val difficulty: Double,      // FSRS Difficulty (1.0 - 10.0)
    val elapsedDays: Int,
    val scheduledDays: Int,
    val reps: Int,
    val lapses: Int,
    val lastGrade: Int,          // 1 = ضعيف (Again), 2 = مقبول (Hard), 3 = جيد (Good), 4 = ممتاز (Easy)
    val dueTimestamp: Long,
    val lastReviewTimestamp: Long
)

@Entity(tableName = "study_certificates")
data class CertificateEntity(
    @PrimaryKey val certificateId: String,
    val studentName: String,
    val trackId: String,
    val trackTitleAr: String,
    val scorePercent: Int,
    val gradeLabelAr: String,
    val primarySourcesStudied: String,
    val verificationCode: String,
    val qrPayload: String,
    val issuedAtTimestamp: Long = System.currentTimeMillis()
)

@Entity(tableName = "content_error_reports")
data class ErrorReportEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val screenName: String,
    val referenceKey: String,
    val itemTitle: String,
    val reportDetails: String,
    val status: String = "قيد المراجعة العلمية",
    val createdAt: Long = System.currentTimeMillis()
)

/**
 * Smart Recurring Mistakes Log for Hifz & Tajweed per Surah/Ayah/Word.
 */
@Entity(tableName = "recitation_mistakes")
data class MistakeLogEntity(
    @PrimaryKey val mistakeId: String, // e.g. "1:7:9" (surah:ayah:wordIndex)
    val compositeKey: String,          // "surah:ayah"
    val surahNumber: Int,
    val surahNameAr: String,
    val ayahNumber: Int,
    val wordIndex: Int,
    val expectedWord: String,
    val spokenMistakeWord: String,
    val mistakeCategory: String,       // "خطأ حفظ وإبدال لفظي", "خطأ مخرج أو صفة", "خطأ مد أو غنة"
    val tajweedCoachingHint: String,
    val makhrajDiagnosis: String,
    val occurrenceCount: Int = 1,
    val isResolved: Boolean = false,
    val lastOccurredTimestamp: Long = System.currentTimeMillis()
)

/**
 * Scheduled Khatmah Planner & Automatic Daily Wird Tracker Entity.
 */
@Entity(tableName = "khatmah_plans")
data class KhatmahPlanEntity(
    @PrimaryKey val planId: String,
    val titleAr: String,
    val khatmahTypeAr: String,         // "ختمة تلاوة وتدبر" | "ختمة حفظ ومراجعة" | "ختمة القراءات"
    val targetDays: Int,
    val totalPages: Int = 604,
    val completedPages: Int = 0,
    val dailyPagesTarget: Int = 20,
    val currentSurahNumber: Int = 1,
    val currentSurahNameAr: String = "الفاتحة",
    val currentAyahNumber: Int = 1,
    val completedDaysStreak: Int = 1,
    val reminderHour24: Int = 20,
    val notificationsEnabled: Boolean = true,
    val isActive: Boolean = true,
    val startedAtTimestamp: Long = System.currentTimeMillis(),
    val lastUpdatedTimestamp: Long = System.currentTimeMillis()
)

/**
 * Phase 3: Documented Personal Tadabbur & Khalwah Reflection Journal Entity.
 */
@Entity(tableName = "tadabbur_journal")
data class TadabburJournalEntity(
    @PrimaryKey val journalId: String,
    val compositeKey: String,          // "surah:ayah"
    val surahNumber: Int,
    val surahNameAr: String,
    val ayahNumber: Int,
    val uthmaniText: String,
    val meaningFromTafsirAr: String,   // الخطوة ١: فهم المعنى من التفسير المعتمد
    val hidayahInsightAr: String,      // الخطوة ٢: الهداية القرآنية المستنبطة
    val practicalActionPlanAr: String, // الخطوة ٣: العمل التطبيقي بالآية
    val khalwahMinutes: Int = 15,
    val sourceCitation: String = "تفسير السعدي • ابن كثير",
    val createdAtTimestamp: Long = System.currentTimeMillis()
)

/**
 * Phase 3: Teacher / Muhaffiz Classroom Wird Assignment Entity.
 */
@Entity(tableName = "teacher_wird_assignments")
data class WirdAssignmentEntity(
    @PrimaryKey val assignmentId: String,
    val classroomId: String,
    val classroomTitleAr: String,
    val supervisorNameAr: String,
    val surahNumber: Int,
    val surahNameAr: String,
    val ayahStart: Int,
    val ayahEnd: Int,
    val requiredRepetitions: Int,
    val focusTajweedRuleAr: String,
    val teacherInstructionsAr: String,
    val completedStudentsCount: Int,
    val totalStudentsCount: Int,
    val isCompletedByCurrentStudent: Boolean = false,
    val dueDateLabelAr: String = "نهاية الأسبوع الحالي",
    val createdAtTimestamp: Long = System.currentTimeMillis()
)

@Dao
interface ItqanDao {
    @Query("SELECT * FROM quran_ayahs ORDER BY surahNumber ASC, ayahNumber ASC")
    fun observeAllAyahs(): Flow<List<QuranVerse>>

    @Query("SELECT * FROM quran_ayahs ORDER BY surahNumber ASC, ayahNumber ASC")
    fun observeAllVerses(): Flow<List<QuranVerse>>

    @Query("SELECT * FROM quran_ayahs WHERE isMemorized = 1 ORDER BY surahNumber ASC, ayahNumber ASC")
    fun observeMemorizedVerses(): Flow<List<QuranVerse>>

    @Query("SELECT * FROM quran_ayahs WHERE surahNumber = :surahNumber ORDER BY ayahNumber ASC")
    fun observeAyahsBySurah(surahNumber: Int): Flow<List<QuranVerse>>

    @Query("SELECT * FROM quran_ayahs WHERE pageNumber = :pageNumber ORDER BY surahNumber ASC, ayahNumber ASC")
    fun observeAyahsByPage(pageNumber: Int): Flow<List<QuranVerse>>

    @Query("SELECT * FROM quran_ayahs WHERE compositeKey = :compositeKey LIMIT 1")
    suspend fun getAyahByKey(compositeKey: String): QuranVerse?

    @Query("SELECT * FROM quran_ayahs WHERE compositeKey IN (:keys)")
    suspend fun getAyahsByKeys(keys: List<String>): List<QuranVerse>

    @Query(
        """
        SELECT * FROM quran_ayahs 
        WHERE plainSearchText LIKE '%' || :query || '%' 
           OR uthmaniText LIKE '%' || :query || '%' 
           OR surahNameAr LIKE '%' || :query || '%'
           OR tafsirMuyassar LIKE '%' || :query || '%'
           OR gharibKalimat LIKE '%' || :query || '%'
        ORDER BY surahNumber ASC, ayahNumber ASC
        """
    )
    suspend fun searchAyahs(query: String): List<QuranVerse>

    @Query("SELECT COUNT(*) FROM quran_ayahs")
    suspend fun getAyahCount(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAyahs(ayahs: List<QuranVerse>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertVerse(verse: QuranVerse)

    @Update
    suspend fun updateVerse(verse: QuranVerse)

    @Query(
        """
        UPDATE quran_ayahs 
        SET isMemorized = :isMemorized,
            recitationCount = recitationCount + 1,
            memorizationScore = :score,
            lastReviewedTimestamp = :timestamp
        WHERE compositeKey = :compositeKey
        """
    )
    suspend fun updateVerseProgress(
        compositeKey: String,
        isMemorized: Boolean,
        score: Int,
        timestamp: Long = System.currentTimeMillis()
    )

    // Bookmarks & Notes
    @Query("SELECT * FROM bookmarks_notes ORDER BY updatedAt DESC")
    fun observeBookmarks(): Flow<List<BookmarkNoteEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertBookmark(bookmark: BookmarkNoteEntity)

    @Query("DELETE FROM bookmarks_notes WHERE compositeKey = :key")
    suspend fun deleteBookmark(key: String)

    // Lesson Progress
    @Query("SELECT * FROM lesson_progress")
    fun observeLessonProgress(): Flow<List<LessonProgressEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertLessonProgress(progress: LessonProgressEntity)

    // FSRS Spaced Repetition
    @Query("SELECT * FROM fsrs_reviews ORDER BY dueTimestamp ASC")
    fun observeFsrsReviews(): Flow<List<FsrsReviewEntity>>

    @Query("SELECT COUNT(*) FROM fsrs_reviews")
    suspend fun getFsrsCount(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertFsrsReview(review: FsrsReviewEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertFsrsReviews(reviews: List<FsrsReviewEntity>)

    // Certificates
    @Query("SELECT * FROM study_certificates ORDER BY issuedAtTimestamp DESC")
    fun observeCertificates(): Flow<List<CertificateEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCertificate(certificate: CertificateEntity)

    // Error Reports
    @Query("SELECT * FROM content_error_reports ORDER BY createdAt DESC")
    fun observeErrorReports(): Flow<List<ErrorReportEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertErrorReport(report: ErrorReportEntity)

    // Recurring Mistakes Log
    @Query("SELECT * FROM recitation_mistakes ORDER BY isResolved ASC, occurrenceCount DESC, lastOccurredTimestamp DESC")
    fun observeMistakeLogs(): Flow<List<MistakeLogEntity>>

    @Query("SELECT * FROM recitation_mistakes WHERE mistakeId = :mistakeId LIMIT 1")
    suspend fun getMistakeById(mistakeId: String): MistakeLogEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertMistakeLog(mistake: MistakeLogEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMistakeLogs(mistakes: List<MistakeLogEntity>)

    @Query("UPDATE recitation_mistakes SET isResolved = :resolved WHERE mistakeId = :mistakeId")
    suspend fun setMistakeResolved(mistakeId: String, resolved: Boolean)

    @Query("SELECT COUNT(*) FROM recitation_mistakes")
    suspend fun getMistakeCount(): Int

    // Khatmah Planner & Daily Wird
    @Query("SELECT * FROM khatmah_plans ORDER BY isActive DESC, lastUpdatedTimestamp DESC")
    fun observeKhatmahPlans(): Flow<List<KhatmahPlanEntity>>

    @Query("SELECT COUNT(*) FROM khatmah_plans")
    suspend fun getKhatmahPlanCount(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertKhatmahPlan(plan: KhatmahPlanEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertKhatmahPlans(plans: List<KhatmahPlanEntity>)

    // Phase 3: Tadabbur & Khalwah Journal
    @Query("SELECT * FROM tadabbur_journal ORDER BY createdAtTimestamp DESC")
    fun observeTadabburJournals(): Flow<List<TadabburJournalEntity>>

    @Query("SELECT COUNT(*) FROM tadabbur_journal")
    suspend fun getTadabburJournalCount(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertTadabburJournal(entry: TadabburJournalEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTadabburJournals(entries: List<TadabburJournalEntity>)

    // Phase 3: Teacher Wird Assignments
    @Query("SELECT * FROM teacher_wird_assignments ORDER BY createdAtTimestamp DESC")
    fun observeWirdAssignments(): Flow<List<WirdAssignmentEntity>>

    @Query("SELECT COUNT(*) FROM teacher_wird_assignments")
    suspend fun getWirdAssignmentCount(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertWirdAssignment(assignment: WirdAssignmentEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertWirdAssignments(assignments: List<WirdAssignmentEntity>)
}

typealias QuranVerseDao = ItqanDao

@Database(
    entities = [
        QuranVerse::class,
        BookmarkNoteEntity::class,
        LessonProgressEntity::class,
        FsrsReviewEntity::class,
        CertificateEntity::class,
        ErrorReportEntity::class,
        MistakeLogEntity::class,
        KhatmahPlanEntity::class,
        TadabburJournalEntity::class,
        WirdAssignmentEntity::class
    ],
    version = 4,
    exportSchema = false
)
abstract class ItqanDatabase : RoomDatabase() {
    abstract fun itqanDao(): ItqanDao
    fun quranVerseDao(): QuranVerseDao = itqanDao()

    companion object {
        @Volatile
        private var INSTANCE: ItqanDatabase? = null

        fun getInstance(context: Context): ItqanDatabase {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: Room.databaseBuilder(
                    context.applicationContext,
                    ItqanDatabase::class.java,
                    "itqan_quran_ssot.db"
                )
                    .fallbackToDestructiveMigration(true)
                    .build()
                    .also { INSTANCE = it }
            }
        }
    }
}

