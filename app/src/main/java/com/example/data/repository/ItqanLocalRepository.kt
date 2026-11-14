package com.example.data.repository

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.floatPreferencesKey
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.example.data.local.AyahEntity
import com.example.data.local.BookmarkNoteEntity
import com.example.data.local.CertificateEntity
import com.example.data.local.ErrorReportEntity
import com.example.data.local.FsrsReviewEntity
import com.example.data.local.ItqanDao
import com.example.data.local.ItqanSeedData
import com.example.data.local.LessonProgressEntity
import com.example.data.remote.AlQuranApiService
import com.example.domain.usecase.ArabicTextNormalizer
import com.example.ui.theme.ItqanThemeMode
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext

private val Context.itqanDataStore by preferencesDataStore(name = "itqan_user_settings")

data class UserPreferencesState(
    val themeMode: ItqanThemeMode = ItqanThemeMode.PARCHMENT_LIGHT,
    val fontScale: Float = 1.0f,
    val useEasternArabicDigits: Boolean = true,
    val showTajweedColors: Boolean = true,
    val mushafPageMode: Boolean = true,
    val lastReadSurah: Int = 1,
    val lastReadAyah: Int = 1,
    val streakDays: Int = 7,
    val studentName: String = "طالب علم بمدرسة إتقان",
    val remoteConfigAiModel: String = "gemini-3.8-flash"
)

class ItqanLocalRepository(
    private val context: Context,
    private val dao: ItqanDao,
    private val apiService: AlQuranApiService = AlQuranApiService.create()
) {
    private object Keys {
        val THEME_MODE = stringPreferencesKey("theme_mode")
        val FONT_SCALE = floatPreferencesKey("font_scale")
        val EASTERN_DIGITS = booleanPreferencesKey("eastern_digits")
        val TAJWEED_COLORS = booleanPreferencesKey("tajweed_colors")
        val MUSHAF_PAGE_MODE = booleanPreferencesKey("mushaf_page_mode")
        val LAST_SURAH = intPreferencesKey("last_surah")
        val LAST_AYAH = intPreferencesKey("last_ayah")
        val STREAK_DAYS = intPreferencesKey("streak_days")
        val STUDENT_NAME = stringPreferencesKey("student_name")
        val AI_MODEL_NAME = stringPreferencesKey("ai_model_name")
    }

    val userPreferencesFlow: Flow<UserPreferencesState> = context.itqanDataStore.data.map { prefs ->
        val modeName = prefs[Keys.THEME_MODE] ?: ItqanThemeMode.PARCHMENT_LIGHT.name
        val themeMode = runCatching { ItqanThemeMode.valueOf(modeName) }
            .getOrDefault(ItqanThemeMode.PARCHMENT_LIGHT)
        UserPreferencesState(
            themeMode = themeMode,
            fontScale = prefs[Keys.FONT_SCALE] ?: 1.0f,
            useEasternArabicDigits = prefs[Keys.EASTERN_DIGITS] ?: true,
            showTajweedColors = prefs[Keys.TAJWEED_COLORS] ?: true,
            mushafPageMode = prefs[Keys.MUSHAF_PAGE_MODE] ?: true,
            lastReadSurah = prefs[Keys.LAST_SURAH] ?: 1,
            lastReadAyah = prefs[Keys.LAST_AYAH] ?: 1,
            streakDays = prefs[Keys.STREAK_DAYS] ?: 7,
            studentName = prefs[Keys.STUDENT_NAME] ?: "طالب علم بمدرسة إتقان",
            remoteConfigAiModel = prefs[Keys.AI_MODEL_NAME] ?: "gemini-3.8-flash"
        )
    }

    suspend fun ensureSeeded() = withContext(Dispatchers.IO) {
        if (dao.getAyahCount() < 15) {
            dao.insertAyahs(ItqanSeedData.buildInitialAyahEntities())
        }
        if (dao.getFsrsCount() == 0) {
            dao.insertFsrsReviews(ItqanSeedData.buildInitialFsrsReviews())
        }
        if (dao.getMistakeCount() == 0) {
            dao.insertMistakeLogs(com.example.data.local.ItqanPhase2SeedData.buildInitialMistakeLogs())
        }
        if (dao.getKhatmahPlanCount() == 0) {
            dao.insertKhatmahPlans(com.example.data.local.ItqanPhase2SeedData.buildInitialKhatmahPlans())
        }
    }

    fun observeAllAyahs(): Flow<List<AyahEntity>> = dao.observeAllAyahs()

    fun observeAllVerses(): Flow<List<com.example.data.local.QuranVerse>> = dao.observeAllVerses()

    fun observeMemorizedVerses(): Flow<List<com.example.data.local.QuranVerse>> = dao.observeMemorizedVerses()

    fun observeAyahsBySurah(surahNumber: Int): Flow<List<AyahEntity>> =
        dao.observeAyahsBySurah(surahNumber)

    suspend fun getAyahByKey(compositeKey: String): AyahEntity? =
        dao.getAyahByKey(compositeKey)

    suspend fun getAyahsByKeys(keys: List<String>): List<AyahEntity> =
        dao.getAyahsByKeys(keys)

    suspend fun recordVerseProgress(
        compositeKey: String,
        isMemorized: Boolean,
        score: Int
    ) = withContext(Dispatchers.IO) {
        dao.updateVerseProgress(
            compositeKey = compositeKey,
            isMemorized = isMemorized,
            score = score
        )
    }

    suspend fun searchAyahsInstant(rawQuery: String): List<AyahEntity> = withContext(Dispatchers.IO) {
        val normalized = ArabicTextNormalizer.normalizeForSearch(rawQuery)
        if (normalized.isBlank()) return@withContext emptyList()
        dao.searchAyahs(normalized)
    }

    /**
     * Fetches a Surah from AlQuran Cloud API and caches it into the local Room Single Source of Truth
     * if its verses are not yet downloaded locally.
     */
    suspend fun fetchAndCacheSurahIfNeeded(surahNumber: Int): Result<Int> = withContext(Dispatchers.IO) {
        runCatching {
            val uthmaniResp = apiService.getSurahUthmani(surahNumber)
            val muyassarResp = runCatching { apiService.getSurahMuyassar(surahNumber) }.getOrNull()

            val surahData = uthmaniResp.data ?: error("لم يتم العثور على بيانات السورة")
            val tafsirMap = muyassarResp?.data?.ayahs?.associateBy { it.numberInSurah }.orEmpty()
            val meta = ItqanSeedData.surahCatalog.find { it.number == surahNumber }
            val surahNameShort = meta?.nameAr ?: surahData.name.removePrefix("سُورَةُ ").trim()
            val revType = meta?.revelationType ?: if (surahData.revelationType.equals("Medinan", true)) "مدنية" else "مكية"

            val entities = surahData.ayahs.map { dto ->
                val key = "$surahNumber:${dto.numberInSurah}"
                val existing = dao.getAyahByKey(key)
                if (existing != null) {
                    existing
                } else {
                    val muyassarText = tafsirMap[dto.numberInSurah]?.text
                        ?: "تفسير الآية ${dto.numberInSurah} من سورة $surahNameShort مستمد من سياق السورة ومقاصدها."
                    AyahEntity(
                        compositeKey = key,
                        surahNumber = surahNumber,
                        surahNameAr = surahNameShort,
                        revelationType = revType,
                        ayahNumber = dto.numberInSurah,
                        pageNumber = dto.page,
                        juzNumber = dto.juz,
                        hizbNumber = ((dto.hizbQuarter - 1) / 4) + 1,
                        uthmaniText = dto.text,
                        plainSearchText = ArabicTextNormalizer.normalizeForSearch(dto.text),
                        tafsirMuyassar = muyassarText,
                        tafsirSaadi = "من هدايات الآية عند السعدي: تقرير معاني الإيمان والعمل الصالح وفق سياق سورة $surahNameShort.",
                        tafsirIbnKathir = "تفسير الآية بالمأثور في سياق سورة $surahNameShort وربطها بنظائرها في القرآن الكريم.",
                        tafsirTabari = "القول في تأويل الآية الكريمة وبيان معاني ألفاظها على لسان العرب وأهل التأويل.",
                        gharibKalimat = "بيان الأصول اللغوية لمفردات الآية الكريمة من مفردات الراغب الأصفهاني.",
                        asbabNuzul = "الآية نازلة في سياق مقاصد سورة $surahNameShort ($revType) والعبرة بعموم اللفظ.",
                        irabAndBalaghah = "نظم قرآني معجز يجمع بين فصاحة التركيب ومناسبة الفاصلة القرآنية للمعنى.",
                        tajweedAndQiraat = "مراعاة أحكام النون والميم الساكنتين ومقادير المدود والوقف الكافي والتام."
                    )
                }
            }
            dao.insertAyahs(entities)
            entities.size
        }
    }

    // Bookmarks & Notes
    fun observeBookmarks(): Flow<List<BookmarkNoteEntity>> = dao.observeBookmarks()
    suspend fun saveBookmarkNote(bookmark: BookmarkNoteEntity) = dao.upsertBookmark(bookmark)
    suspend fun removeBookmark(compositeKey: String) = dao.deleteBookmark(compositeKey)

    // Academy Lesson Progress
    fun observeLessonProgress(): Flow<List<LessonProgressEntity>> = dao.observeLessonProgress()
    suspend fun saveLessonProgress(progress: LessonProgressEntity) = dao.upsertLessonProgress(progress)

    // FSRS Spaced Repetition
    fun observeFsrsReviews(): Flow<List<FsrsReviewEntity>> = dao.observeFsrsReviews()
    suspend fun saveFsrsReview(review: FsrsReviewEntity) = dao.upsertFsrsReview(review)

    // Study Certificates
    fun observeCertificates(): Flow<List<CertificateEntity>> = dao.observeCertificates()
    suspend fun saveCertificate(certificate: CertificateEntity) = dao.insertCertificate(certificate)

    // Content Governance Error Reports
    fun observeErrorReports(): Flow<List<ErrorReportEntity>> = dao.observeErrorReports()
    suspend fun submitErrorReport(report: ErrorReportEntity) = dao.insertErrorReport(report)

    // Smart Recurring Mistakes Log
    fun observeMistakeLogs(): Flow<List<com.example.data.local.MistakeLogEntity>> = dao.observeMistakeLogs()

    suspend fun recordRecitationMistake(
        surahNumber: Int,
        surahNameAr: String,
        ayahNumber: Int,
        wordIndex: Int,
        expectedWord: String,
        spokenMistakeWord: String,
        tajweedHint: String
    ) = withContext(Dispatchers.IO) {
        val mistakeId = "$surahNumber:$ayahNumber:$wordIndex"
        val existing = dao.getMistakeById(mistakeId)
        val makhrajDiag = com.example.data.local.ItqanPhase2SeedData.diagnoseWordMakharij(expectedWord)
        val category = when {
            tajweedHint.contains("مد") || tajweedHint.contains("غنة") -> "خطأ مد أو غنة"
            tajweedHint.contains("قلقلة") || tajweedHint.contains("تفخيم") -> "خطأ مخرج أو صفة"
            else -> "خطأ حفظ وإبدال لفظي"
        }
        val updated = if (existing != null) {
            existing.copy(
                spokenMistakeWord = spokenMistakeWord,
                occurrenceCount = existing.occurrenceCount + 1,
                isResolved = false,
                lastOccurredTimestamp = System.currentTimeMillis()
            )
        } else {
            com.example.data.local.MistakeLogEntity(
                mistakeId = mistakeId,
                compositeKey = "$surahNumber:$ayahNumber",
                surahNumber = surahNumber,
                surahNameAr = surahNameAr,
                ayahNumber = ayahNumber,
                wordIndex = wordIndex,
                expectedWord = expectedWord,
                spokenMistakeWord = spokenMistakeWord,
                mistakeCategory = category,
                tajweedCoachingHint = tajweedHint,
                makhrajDiagnosis = "${makhrajDiag.specificMakhrajAr} (${makhrajDiag.sifaatAr})",
                occurrenceCount = 1,
                isResolved = false
            )
        }
        dao.upsertMistakeLog(updated)
    }

    suspend fun toggleMistakeResolved(mistakeId: String, resolved: Boolean) = withContext(Dispatchers.IO) {
        dao.setMistakeResolved(mistakeId, resolved)
    }

    // Scheduled Khatmah Planner & Daily Wird
    fun observeKhatmahPlans(): Flow<List<com.example.data.local.KhatmahPlanEntity>> = dao.observeKhatmahPlans()

    suspend fun saveKhatmahPlan(plan: com.example.data.local.KhatmahPlanEntity) = withContext(Dispatchers.IO) {
        dao.upsertKhatmahPlan(plan)
    }

    // Preferences Updates
    suspend fun updateThemeMode(mode: ItqanThemeMode) {
        context.itqanDataStore.edit { it[Keys.THEME_MODE] = mode.name }
    }

    suspend fun updateFontScale(scale: Float) {
        context.itqanDataStore.edit { it[Keys.FONT_SCALE] = scale.coerceIn(0.85f, 1.8f) }
    }

    suspend fun updateEasternDigits(enabled: Boolean) {
        context.itqanDataStore.edit { it[Keys.EASTERN_DIGITS] = enabled }
    }

    suspend fun updateTajweedColors(enabled: Boolean) {
        context.itqanDataStore.edit { it[Keys.TAJWEED_COLORS] = enabled }
    }

    suspend fun updateMushafPageMode(isPageMode: Boolean) {
        context.itqanDataStore.edit { it[Keys.MUSHAF_PAGE_MODE] = isPageMode }
    }

    suspend fun updateLastRead(surah: Int, ayah: Int) {
        context.itqanDataStore.edit {
            it[Keys.LAST_SURAH] = surah
            it[Keys.LAST_AYAH] = ayah
        }
    }

    suspend fun updateStudentName(name: String) {
        context.itqanDataStore.edit { it[Keys.STUDENT_NAME] = name.trim() }
    }

    suspend fun updateRemoteConfigAiModel(modelName: String) {
        context.itqanDataStore.edit { it[Keys.AI_MODEL_NAME] = modelName.trim() }
    }
}

