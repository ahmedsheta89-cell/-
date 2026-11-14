package com.example.data.repository

import android.util.Log
import com.example.data.local.ItqanSeedData
import com.example.domain.model.ContentAttributionType
import com.example.domain.model.ResolvedAyahQuote
import com.example.domain.model.ScholarCitation
import com.example.domain.model.ScholarStructuredResponse
import com.example.domain.model.SourceChunk
import com.example.domain.usecase.ArabicTextNormalizer
import com.google.firebase.Firebase
import com.google.firebase.ai.ai
import com.google.firebase.ai.type.Schema
import com.google.firebase.ai.type.generationConfig
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.withTimeout
import org.json.JSONObject

private const val TAG = "AiScholarRagRepo"
private const val DEFAULT_VERIFIED_MODEL = "gemini-3.8-flash"

class AiScholarRagRepository(
    private val localRepository: ItqanLocalRepository
) {
    private val fatwaKeywords = listOf(
        "فتوى", "أفتني", "ما حكم طلاق", "حكم الميراث", "ربا البنوك", "كفارة يمين", "يجوز أم حرام"
    )

    private val scholarResponseSchema = Schema.obj(
        properties = mapOf(
            "answer" to Schema.string(
                description = "Detailed Arabic scholarly explanation strictly grounded in the provided sources without writing raw Quranic verse text directly."
            ),
            "citations" to Schema.array(
                items = Schema.obj(
                    properties = mapOf(
                        "book" to Schema.string(description = "Title of the classical source book"),
                        "author" to Schema.string(description = "Name of the classical scholar/author"),
                        "reference" to Schema.string(description = "Chapter, section, or surah/ayah reference")
                    )
                ),
                description = "Mandatory list of authoritative source citations used in the answer"
            ),
            "ayah_refs" to Schema.array(
                items = Schema.string(description = "Canonical surah:ayah identifier e.g. 2:255 or 1:5"),
                description = "List of surah:ayah identifiers referenced so the app loads the exact Uthmani verse from its local database"
            ),
            "confidence" to Schema.double(description = "Confidence score between 0.0 and 1.0"),
            "needs_scholar_referral" to Schema.boolean(
                description = "True if the question asks for a personal Fiqh fatwa or is outside Quranic sciences"
            )
        )
    )

    private val structuredConfig = generationConfig {
        temperature = 0.2f
        responseMimeType = "application/json"
        responseSchema = scholarResponseSchema
    }

    /**
     * Step 1: Local RAG Retriever over authoritative SourceChunks & local Tafsir entries.
     */
    fun retrieveRelevantChunks(question: String, topK: Int = 3): List<SourceChunk> {
        val normQuery = ArabicTextNormalizer.normalizeForSearch(question)
        val queryTokens = normQuery.split(" ").filter { it.length >= 2 }

        val scored = ItqanSeedData.sourceChunksForRag.map { chunk ->
            val normContent = ArabicTextNormalizer.normalizeForSearch(
                "${chunk.bookTitle} ${chunk.reference} ${chunk.content} ${chunk.topicKeywords.joinToString(" ")}"
            )
            var score = 0
            for (kw in chunk.topicKeywords) {
                val normKw = ArabicTextNormalizer.normalizeForSearch(kw)
                if (normQuery.contains(normKw)) score += 5
            }
            for (token in queryTokens) {
                if (normContent.contains(token)) score += 2
            }
            chunk to score
        }.sortedByDescending { it.second }

        val matched = scored.filter { it.second > 0 }.take(topK).map { it.first }
        return matched.ifEmpty { ItqanSeedData.sourceChunksForRag.take(2) }
    }

    /**
     * Step 2 & 3: RAG-grounded generation via Firebase AI Logic + Post-Validation & Local Ayah Guard.
     */
    suspend fun askScholarWithRag(
        question: String,
        configuredModelName: String = DEFAULT_VERIFIED_MODEL
    ): Result<ScholarStructuredResponse> {
        val retrievedChunks = retrieveRelevantChunks(question, topK = 3)
        val normQuestion = ArabicTextNormalizer.normalizeForSearch(question)
        val isExplicitFatwaRequest = fatwaKeywords.any {
            normQuestion.contains(ArabicTextNormalizer.normalizeForSearch(it))
        }

        val contextBlock = retrievedChunks.joinToString("\n---\n") { chunk ->
            """
            [معرف المقطع: ${chunk.chunkId}]
            الكتاب: ${chunk.bookTitle} | المؤلف: ${chunk.author} | الموضع: ${chunk.reference}
            النص العلمي: ${chunk.content}
            الآيات المرتبطة: ${chunk.relatedAyahRefs.joinToString(", ")}
            """.trimIndent()
        }

        val systemAndUserPrompt = """
            أنت "المعلم القرآني الموثق" في تطبيق إتقان لعلوم القرآن الكريم.
            الضوابط الإلزامية غير القابلة للتجاوز:
            1. اعتمد حصراً على المقاطع العلمية الموثقة المرفقة أدناه وعلى أمهات كتب التفسير والتجويد وعلوم القرآن المعتمدة (الطبري، ابن كثير، السعدي، الميسر، الإتقان للسيوطي، الواحدي، الراغب الأصفهاني، المقدمة الجزرية، تحفة الأطفال).
            2. لا تكتب نص الآيات القرآنية من ذاكرتك داخل الحقل النصي إطلاقاً حرصاً على قدسية النص، بل ضع معرف الآية بصيغة (رقم_السورة:رقم_الآية مثل 2:255 أو 1:5 أو 73:4) في مصفوفة ayah_refs وسيقوم التطبيق بعرض نصها العثماني المحقق من قاعدة البيانات المحلية.
            3. يجب إرفاق مصدر واحد على الأقل في مصفوفة citations يحدد الكتاب والمؤلف والموضع.
            4. إذا كان السؤال طلب فتوى فقهية شخصية أو طلاق أو مواريث أو خارج علوم القرآن، اجعل needs_scholar_referral = true ووجّه السائل بأدب إلى سؤال أهل العلم والجهات الإفتائية المعتمدة.

            المقاطع العلمية المسترجعة من المكتبة الموثقة (RAG Context):
            $contextBlock

            سؤال طالب العلم:
            $question
        """.trimIndent()

        val activeModelName = configuredModelName.trim().ifBlank { DEFAULT_VERIFIED_MODEL }

        return try {
            val jsonText = generateStructuredJsonWithFallbackModel(
                prompt = systemAndUserPrompt,
                requestedModelName = activeModelName
            )
            parseAndValidateStructuredOutput(
                question = question,
                jsonString = jsonText,
                retrievedChunks = retrievedChunks,
                isExplicitFatwaRequest = isExplicitFatwaRequest,
                modelUsed = activeModelName
            )
        } catch (e: CancellationException) {
            if (e is TimeoutCancellationException) {
                Log.e(TAG, "AI Scholar request timed out", e)
                buildOfflineGroundedResponse(
                    question = question,
                    retrievedChunks = retrievedChunks,
                    isExplicitFatwaRequest = isExplicitFatwaRequest,
                    modelLabel = "$activeModelName (استرجاع محلي عند انتهاء المهلة)"
                )
            } else {
                throw e
            }
        } catch (e: Exception) {
            Log.w(TAG, "Firebase AI generation unavailable; using local RAG synthesis", e)
            buildOfflineGroundedResponse(
                question = question,
                retrievedChunks = retrievedChunks,
                isExplicitFatwaRequest = isExplicitFatwaRequest,
                modelLabel = "$activeModelName (استرجاع محلي موثق RAG)"
            )
        }
    }

    private suspend fun generateStructuredJsonWithFallbackModel(
        prompt: String,
        requestedModelName: String
    ): String {
        return try {
            val model = Firebase.ai.generativeModel(
                modelName = requestedModelName,
                generationConfig = structuredConfig
            )
            val response = withTimeout(60_000L) {
                model.generateContent(prompt)
            }
            response.text ?: throw IllegalStateException("Empty response from $requestedModelName")
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            if (requestedModelName != DEFAULT_VERIFIED_MODEL) {
                Log.w(TAG, "Model $requestedModelName failed, retrying with $DEFAULT_VERIFIED_MODEL", e)
                val fallbackModel = Firebase.ai.generativeModel(
                    modelName = DEFAULT_VERIFIED_MODEL,
                    generationConfig = structuredConfig
                )
                val fallbackResponse = withTimeout(60_000L) {
                    fallbackModel.generateContent(prompt)
                }
                fallbackResponse.text ?: throw IllegalStateException("Empty response from $DEFAULT_VERIFIED_MODEL")
            } else {
                throw e
            }
        }
    }

    internal suspend fun buildOfflineGroundedResponse(
        question: String,
        retrievedChunks: List<SourceChunk>,
        isExplicitFatwaRequest: Boolean,
        modelLabel: String
    ): Result<ScholarStructuredResponse> = runCatching {
        val fallbackJson = JSONObject().apply {
            val synthesizedAnswer = buildString {
                append("استناداً إلى المصادر العلمية الموثقة في مكتبة «إتقان» المحلية:\n\n")
                retrievedChunks.forEachIndexed { index, chunk ->
                    append("${index + 1}. من كتاب «${chunk.bookTitle}» (${chunk.author} — ${chunk.reference}):\n")
                    append("${chunk.content}\n\n")
                }
            }.trim()
            put("answer", synthesizedAnswer)
            put("confidence", 0.92)
            put("needs_scholar_referral", isExplicitFatwaRequest)
        }.toString()

        parseAndValidateStructuredOutput(
            question = question,
            jsonString = fallbackJson,
            retrievedChunks = retrievedChunks,
            isExplicitFatwaRequest = isExplicitFatwaRequest,
            modelUsed = modelLabel
        ).getOrThrow()
    }

    internal suspend fun parseAndValidateStructuredOutput(
        question: String,
        jsonString: String,
        retrievedChunks: List<SourceChunk>,
        isExplicitFatwaRequest: Boolean,
        modelUsed: String
    ): Result<ScholarStructuredResponse> = runCatching {
        val json = JSONObject(jsonString)
        val rawAnswer = json.optString("answer", "").trim()
        val confidence = json.optDouble("confidence", 0.85)
        val needsReferral = json.optBoolean("needs_scholar_referral", false) || isExplicitFatwaRequest

        // Parse citations
        val citationsArray = json.optJSONArray("citations")
        val parsedCitations = mutableListOf<ScholarCitation>()
        if (citationsArray != null) {
            for (i in 0 until citationsArray.length()) {
                val item = citationsArray.optJSONObject(i) ?: continue
                val book = item.optString("book", "").trim()
                val author = item.optString("author", "").trim()
                val ref = item.optString("reference", "").trim()
                if (book.isNotBlank()) {
                    val matchedChunk = retrievedChunks.find {
                        it.bookTitle.contains(book) || book.contains(it.bookTitle)
                    }
                    parsedCitations.add(
                        ScholarCitation(
                            book = book,
                            author = author.ifBlank { matchedChunk?.author ?: "علماء التفسير والتجويد" },
                            reference = ref.ifBlank { matchedChunk?.reference ?: "المصدر المعتمد" },
                            chunkId = matchedChunk?.chunkId
                        )
                    )
                }
            }
        }

        // Post-validation rule: Never allow an answer without citations
        if (parsedCitations.isEmpty()) {
            retrievedChunks.forEach { chunk ->
                parsedCitations.add(
                    ScholarCitation(
                        book = chunk.bookTitle,
                        author = chunk.author,
                        reference = chunk.reference,
                        chunkId = chunk.chunkId
                    )
                )
            }
        }

        // Hallucination Guard: Resolve ayah_refs strictly from local Room database
        val refsArray = json.optJSONArray("ayah_refs")
        val requestedKeys = mutableSetOf<String>()
        if (refsArray != null) {
            for (i in 0 until refsArray.length()) {
                val refStr = refsArray.optString(i, "").trim()
                if (refStr.matches(Regex("^\\d+:\\d+$"))) {
                    requestedKeys.add(refStr)
                }
            }
        }
        if (requestedKeys.isEmpty()) {
            retrievedChunks.flatMap { it.relatedAyahRefs }.forEach { requestedKeys.add(it) }
        }

        val localAyahEntities = localRepository.getAyahsByKeys(requestedKeys.toList())
        val resolvedQuotes = localAyahEntities.map { entity ->
            ResolvedAyahQuote(
                surahNumber = entity.surahNumber,
                surahNameAr = entity.surahNameAr,
                ayahNumber = entity.ayahNumber,
                uthmaniText = entity.uthmaniText
            )
        }

        val finalAnswer = if (needsReferral) {
            buildString {
                if (rawAnswer.isNotBlank()) {
                    append(rawAnswer)
                    append("\n\n")
                }
                append("تنبيه منهجي: المعلم الذكي في تطبيق «إتقان» مخصص لتعليم علوم القرآن والتجويد والتفسير الموثق، ولا يصدر فتاوى فقهية. يُرجى الرجوع في مسائل الإفتاء والأحكام العملية إلى العلماء والجهات الإفتائية المعتمدة.")
            }
        } else {
            rawAnswer.ifBlank {
                "وفق المصادر المعتمدة في مكتبة إتقان:\n" + retrievedChunks.joinToString("\n\n") {
                    "• ${it.content} (${it.bookTitle} — ${it.reference})"
                }
            }
        }

        ScholarStructuredResponse(
            question = question,
            answer = finalAnswer,
            citations = parsedCitations,
            resolvedAyahs = resolvedQuotes,
            confidence = confidence.coerceIn(0.0, 1.0),
            needsScholarReferral = needsReferral,
            attribution = ContentAttributionType.AI_ASSISTED,
            modelUsed = modelUsed,
            retrievedChunks = retrievedChunks
        )
    }
}
