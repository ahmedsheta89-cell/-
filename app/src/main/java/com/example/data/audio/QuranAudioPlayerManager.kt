package com.example.data.audio

import android.media.AudioAttributes
import android.media.MediaPlayer
import android.os.Build
import android.util.Log
import com.example.data.local.ItqanSeedData
import com.example.domain.model.ReciterProfile
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

private const val TAG = "QuranAudioPlayer"

data class PlaybackUiState(
    val isPlaying: Boolean = false,
    val isBuffering: Boolean = false,
    val isWaitingInSilenceGap: Boolean = false,
    val currentSurah: Int = 1,
    val currentAyah: Int = 1,
    val currentAyahUthmani: String = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
    val highlightedWordIndex: Int = -1,
    val selectedReciter: ReciterProfile = ItqanSeedData.reciters.first(),
    val repeatTarget: Int = 1,          // 1, 3, 5, or 99 (infinite)
    val currentRepeatIteration: Int = 1,
    val playbackSpeed: Float = 1.0f,    // 0.75f, 1.0f, 1.25f, 1.5f
    val silenceGapSeconds: Int = 0,     // 0, 2, 4 seconds for student repetition
    val sleepTimerRemainingMinutes: Int = 0,
    val errorMessage: String? = null
)

class QuranAudioPlayerManager {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private var mediaPlayer: MediaPlayer? = null
    private var wordTrackerJob: Job? = null
    private var sleepTimerJob: Job? = null
    private var playlistAyahs: List<Pair<Int, String>> = emptyList() // Pair(ayahNumber, uthmaniText)

    private val _state = MutableStateFlow(PlaybackUiState())
    val state: StateFlow<PlaybackUiState> = _state.asStateFlow()

    fun buildEveryAyahUrl(reciter: ReciterProfile, surahNumber: Int, ayahNumber: Int): String {
        val sss = surahNumber.toString().padStart(3, '0')
        val aaa = ayahNumber.toString().padStart(3, '0')
        return "https://everyayah.com/data/${reciter.everyAyahFolder}/$sss$aaa.mp3"
    }

    fun playAyah(
        surahNumber: Int,
        ayahNumber: Int,
        uthmaniText: String,
        surahPlaylist: List<Pair<Int, String>> = emptyList()
    ) {
        if (surahPlaylist.isNotEmpty()) {
            playlistAyahs = surahPlaylist
        }
        _state.update {
            it.copy(
                currentSurah = surahNumber,
                currentAyah = ayahNumber,
                currentAyahUthmani = uthmaniText,
                currentRepeatIteration = 1,
                isWaitingInSilenceGap = false,
                errorMessage = null
            )
        }
        startStreamingCurrentAyah()
    }

    private fun startStreamingCurrentAyah() {
        val currentState = _state.value
        val url = buildEveryAyahUrl(
            reciter = currentState.selectedReciter,
            surahNumber = currentState.currentSurah,
            ayahNumber = currentState.currentAyah
        )

        releaseMediaPlayer()
        _state.update { it.copy(isBuffering = true, isPlaying = false, highlightedWordIndex = 0) }

        try {
            val player = MediaPlayer().apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .build()
                )
                setDataSource(url)
                setOnPreparedListener { mp ->
                    applyPlaybackSpeed(mp, _state.value.playbackSpeed)
                    mp.start()
                    _state.update { it.copy(isBuffering = false, isPlaying = true, errorMessage = null) }
                    startWordHighlightTracking(mp)
                }
                setOnCompletionListener {
                    handleAyahCompletion()
                }
                setOnErrorListener { _, what, extra ->
                    Log.w(TAG, "MediaPlayer error what=$what extra=$extra for $url")
                    _state.update {
                        it.copy(
                            isBuffering = false,
                            isPlaying = false,
                            highlightedWordIndex = -1,
                            errorMessage = "تعذر بث الملف الصوتي حالياً. تأكد من الاتصال بالإنترنت."
                        )
                    }
                    true
                }
                prepareAsync()
            }
            mediaPlayer = player
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start audio stream", e)
            _state.update {
                it.copy(
                    isBuffering = false,
                    isPlaying = false,
                    errorMessage = "تعذر تشغيل التلاوة الصوتية: ${e.localizedMessage ?: ""}"
                )
            }
        }
    }

    private fun startWordHighlightTracking(mp: MediaPlayer) {
        wordTrackerJob?.cancel()
        wordTrackerJob = scope.launch {
            val words = _state.value.currentAyahUthmani.trim().split(Regex("\\s+")).filter { it.isNotBlank() }
            if (words.isEmpty()) return@launch

            while (_state.value.isPlaying) {
                try {
                    if (mp.isPlaying) {
                        val duration = mp.duration.coerceAtLeast(1000)
                        val position = mp.currentPosition.coerceAtLeast(0)
                        val fraction = (position.toFloat() / duration.toFloat()).coerceIn(0f, 0.99f)
                        val wordIdx = (fraction * words.size).toInt().coerceIn(0, words.lastIndex)
                        _state.update { it.copy(highlightedWordIndex = wordIdx) }
                    }
                } catch (_: Exception) {
                    break
                }
                delay(120L)
            }
        }
    }

    private fun handleAyahCompletion() {
        wordTrackerJob?.cancel()
        scope.launch {
            val snapshot = _state.value
            if (snapshot.silenceGapSeconds > 0) {
                _state.update { it.copy(isPlaying = false, isWaitingInSilenceGap = true) }
                delay(snapshot.silenceGapSeconds * 1000L)
                _state.update { it.copy(isWaitingInSilenceGap = false) }
            }

            if (snapshot.currentRepeatIteration < snapshot.repeatTarget) {
                _state.update {
                    it.copy(currentRepeatIteration = snapshot.currentRepeatIteration + 1)
                }
                startStreamingCurrentAyah()
            } else {
                // Move to next ayah in playlist if available
                val currentIdx = playlistAyahs.indexOfFirst { it.first == snapshot.currentAyah }
                if (currentIdx != -1 && currentIdx + 1 < playlistAyahs.size) {
                    val nextAyah = playlistAyahs[currentIdx + 1]
                    _state.update {
                        it.copy(
                            currentAyah = nextAyah.first,
                            currentAyahUthmani = nextAyah.second,
                            currentRepeatIteration = 1,
                            highlightedWordIndex = 0
                        )
                    }
                    startStreamingCurrentAyah()
                } else {
                    _state.update {
                        it.copy(
                            isPlaying = false,
                            isBuffering = false,
                            highlightedWordIndex = -1,
                            currentRepeatIteration = 1
                        )
                    }
                }
            }
        }
    }

    fun togglePlayPause() {
        val mp = mediaPlayer
        if (mp != null) {
            try {
                if (mp.isPlaying) {
                    mp.pause()
                    _state.update { it.copy(isPlaying = false) }
                } else {
                    mp.start()
                    _state.update { it.copy(isPlaying = true) }
                    startWordHighlightTracking(mp)
                }
                return
            } catch (_: Exception) {
                // Fallback to restart stream
            }
        }
        startStreamingCurrentAyah()
    }

    fun stopPlayback() {
        wordTrackerJob?.cancel()
        releaseMediaPlayer()
        _state.update {
            it.copy(
                isPlaying = false,
                isBuffering = false,
                isWaitingInSilenceGap = false,
                highlightedWordIndex = -1
            )
        }
    }

    fun selectReciter(reciter: ReciterProfile) {
        val wasPlaying = _state.value.isPlaying
        _state.update { it.copy(selectedReciter = reciter) }
        if (wasPlaying) {
            startStreamingCurrentAyah()
        }
    }

    fun cycleRepeatTarget() {
        val nextRepeat = when (_state.value.repeatTarget) {
            1 -> 3
            3 -> 5
            5 -> 99
            else -> 1
        }
        _state.update { it.copy(repeatTarget = nextRepeat, currentRepeatIteration = 1) }
    }

    fun cyclePlaybackSpeed() {
        val nextSpeed = when (_state.value.playbackSpeed) {
            0.75f -> 1.0f
            1.0f -> 1.25f
            1.25f -> 1.5f
            else -> 0.75f
        }
        _state.update { it.copy(playbackSpeed = nextSpeed) }
        mediaPlayer?.let { mp ->
            if (mp.isPlaying) applyPlaybackSpeed(mp, nextSpeed)
        }
    }

    fun cycleSilenceGap() {
        val nextGap = when (_state.value.silenceGapSeconds) {
            0 -> 2
            2 -> 4
            else -> 0
        }
        _state.update { it.copy(silenceGapSeconds = nextGap) }
    }

    fun cycleSleepTimer() {
        sleepTimerJob?.cancel()
        val nextMinutes = when (_state.value.sleepTimerRemainingMinutes) {
            0 -> 15
            15 -> 30
            else -> 0
        }
        _state.update { it.copy(sleepTimerRemainingMinutes = nextMinutes) }
        if (nextMinutes > 0) {
            sleepTimerJob = scope.launch {
                var remaining = nextMinutes
                while (remaining > 0) {
                    delay(60_000L)
                    remaining--
                    _state.update { it.copy(sleepTimerRemainingMinutes = remaining) }
                }
                stopPlayback()
            }
        }
    }

    private fun applyPlaybackSpeed(mp: MediaPlayer, speed: Float) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            runCatching {
                mp.playbackParams = mp.playbackParams.setSpeed(speed)
            }
        }
    }

    fun releaseMediaPlayer() {
        wordTrackerJob?.cancel()
        try {
            mediaPlayer?.stop()
        } catch (_: Exception) {
        }
        try {
            mediaPlayer?.release()
        } catch (_: Exception) {
        }
        mediaPlayer = null
    }

    fun shutdownAll() {
        sleepTimerJob?.cancel()
        releaseMediaPlayer()
    }
}
