package com.example.data.remote

import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import retrofit2.http.GET
import retrofit2.http.Path
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import java.util.concurrent.TimeUnit

data class AlQuranSurahResponse(
    val code: Int = 200,
    val status: String = "",
    val data: AlQuranSurahData? = null
)

data class AlQuranSurahData(
    val number: Int = 1,
    val name: String = "",
    val englishName: String = "",
    val revelationType: String = "",
    val numberOfAyahs: Int = 0,
    val ayahs: List<AlQuranAyahDto> = emptyList()
)

data class AlQuranAyahDto(
    val number: Int = 1,
    val text: String = "",
    val numberInSurah: Int = 1,
    val juz: Int = 1,
    val page: Int = 1,
    val hizbQuarter: Int = 1
)

interface AlQuranApiService {
    @GET("surah/{surahNumber}/quran-uthmani")
    suspend fun getSurahUthmani(@Path("surahNumber") surahNumber: Int): AlQuranSurahResponse

    @GET("surah/{surahNumber}/ar.muyassar")
    suspend fun getSurahMuyassar(@Path("surahNumber") surahNumber: Int): AlQuranSurahResponse

    companion object {
        fun create(): AlQuranApiService {
            val moshi = Moshi.Builder()
                .add(KotlinJsonAdapterFactory())
                .build()
            val client = OkHttpClient.Builder()
                .connectTimeout(15, TimeUnit.SECONDS)
                .readTimeout(20, TimeUnit.SECONDS)
                .build()
            return Retrofit.Builder()
                .baseUrl("https://api.alquran.cloud/v1/")
                .client(client)
                .addConverterFactory(MoshiConverterFactory.create(moshi))
                .build()
                .create(AlQuranApiService::class.java)
        }
    }
}
