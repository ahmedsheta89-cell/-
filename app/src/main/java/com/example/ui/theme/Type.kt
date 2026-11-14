package com.example.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.example.R

val AmiriFontFamily = FontFamily(
    Font(R.font.amiri, FontWeight.Normal),
    Font(R.font.amiri, FontWeight.Bold)
)

val CairoFontFamily = FontFamily(
    Font(R.font.cairo, FontWeight.Normal),
    Font(R.font.cairo, FontWeight.Medium),
    Font(R.font.cairo, FontWeight.SemiBold),
    Font(R.font.cairo, FontWeight.Bold)
)

fun buildItqanTypography(fontScale: Float = 1.0f): Typography {
    val scale = fontScale.coerceIn(0.85f, 2.0f)
    return Typography(
        displayLarge = TextStyle(
            fontFamily = AmiriFontFamily,
            fontWeight = FontWeight.Bold,
            fontSize = (36 * scale).sp,
            lineHeight = (50 * scale).sp
        ),
        displayMedium = TextStyle(
            fontFamily = AmiriFontFamily,
            fontWeight = FontWeight.Bold,
            fontSize = (28 * scale).sp,
            lineHeight = (42 * scale).sp
        ),
        displaySmall = TextStyle(
            fontFamily = AmiriFontFamily,
            fontWeight = FontWeight.Bold,
            fontSize = (24 * scale).sp,
            lineHeight = (38 * scale).sp
        ),
        headlineLarge = TextStyle(
            fontFamily = AmiriFontFamily,
            fontWeight = FontWeight.Bold,
            fontSize = (26 * scale).sp,
            lineHeight = (38 * scale).sp
        ),
        headlineMedium = TextStyle(
            fontFamily = CairoFontFamily,
            fontWeight = FontWeight.Bold,
            fontSize = (20 * scale).sp,
            lineHeight = (30 * scale).sp
        ),
        headlineSmall = TextStyle(
            fontFamily = CairoFontFamily,
            fontWeight = FontWeight.Bold,
            fontSize = (18 * scale).sp,
            lineHeight = (26 * scale).sp
        ),
        titleLarge = TextStyle(
            fontFamily = CairoFontFamily,
            fontWeight = FontWeight.Bold,
            fontSize = (18 * scale).sp,
            lineHeight = (26 * scale).sp
        ),
        titleMedium = TextStyle(
            fontFamily = CairoFontFamily,
            fontWeight = FontWeight.SemiBold,
            fontSize = (16 * scale).sp,
            lineHeight = (24 * scale).sp
        ),
        titleSmall = TextStyle(
            fontFamily = CairoFontFamily,
            fontWeight = FontWeight.Medium,
            fontSize = (14 * scale).sp,
            lineHeight = (20 * scale).sp
        ),
        bodyLarge = TextStyle(
            fontFamily = CairoFontFamily,
            fontWeight = FontWeight.Normal,
            fontSize = (16 * scale).sp,
            lineHeight = (26 * scale).sp
        ),
        bodyMedium = TextStyle(
            fontFamily = CairoFontFamily,
            fontWeight = FontWeight.Normal,
            fontSize = (14 * scale).sp,
            lineHeight = (22 * scale).sp
        ),
        bodySmall = TextStyle(
            fontFamily = CairoFontFamily,
            fontWeight = FontWeight.Normal,
            fontSize = (12 * scale).sp,
            lineHeight = (18 * scale).sp
        ),
        labelLarge = TextStyle(
            fontFamily = CairoFontFamily,
            fontWeight = FontWeight.SemiBold,
            fontSize = (14 * scale).sp,
            lineHeight = (20 * scale).sp
        ),
        labelMedium = TextStyle(
            fontFamily = CairoFontFamily,
            fontWeight = FontWeight.Medium,
            fontSize = (12 * scale).sp,
            lineHeight = (16 * scale).sp
        ),
        labelSmall = TextStyle(
            fontFamily = CairoFontFamily,
            fontWeight = FontWeight.Medium,
            fontSize = (11 * scale).sp,
            lineHeight = (15 * scale).sp
        )
    )
}

val Typography = buildItqanTypography(1.0f)
