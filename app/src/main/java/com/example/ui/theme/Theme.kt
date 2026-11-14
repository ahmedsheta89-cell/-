package com.example.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp

enum class ItqanThemeMode(val labelAr: String) {
    PARCHMENT_LIGHT("رق المخطوطات (نهاري)"),
    ROYAL_EMERALD_DARK("الزمرد الملكي (ليلي)"),
    AMOLED_BLACK("أسود AMOLED (توفير الطاقة)")
}

private val ParchmentLightColors = lightColorScheme(
    primary = RoyalEmerald,
    onPrimary = WarmParchment,
    primaryContainer = Color(0xFFDCEBE5),
    onPrimaryContainer = RoyalEmeraldDark,
    secondary = IlluminatedGold,
    onSecondary = RoyalEmeraldDark,
    secondaryContainer = IlluminatedGoldSoft,
    onSecondaryContainer = Color(0xFF3E2D05),
    tertiary = RoyalEmeraldLight,
    onTertiary = WarmParchment,
    background = WarmParchment,
    onBackground = DeepInkText,
    surface = WarmParchment,
    onSurface = DeepInkText,
    surfaceVariant = WarmParchmentCard,
    onSurfaceVariant = MutedInkText,
    outline = WarmParchmentBorder,
    error = Color(0xFFB3261E),
    onError = Color.White
)

private val RoyalEmeraldDarkColors = darkColorScheme(
    primary = IlluminatedGoldBright,
    onPrimary = RoyalEmeraldDark,
    primaryContainer = RoyalEmerald,
    onPrimaryContainer = IlluminatedGoldSoft,
    secondary = IlluminatedGold,
    onSecondary = RoyalEmeraldDark,
    secondaryContainer = Color(0xFF3B2F13),
    onSecondaryContainer = IlluminatedGoldBright,
    tertiary = Color(0xFF6BC4A6),
    onTertiary = RoyalEmeraldDark,
    background = NightEmeraldBg,
    onBackground = IvoryText,
    surface = NightEmeraldSurface,
    onSurface = IvoryText,
    surfaceVariant = NightEmeraldCard,
    onSurfaceVariant = MutedIvoryText,
    outline = Color(0xFF285343),
    error = Color(0xFFF2B8B5),
    onError = Color(0xFF601410)
)

private val AmoledBlackColors = darkColorScheme(
    primary = IlluminatedGoldBright,
    onPrimary = Color.Black,
    primaryContainer = Color(0xFF0A291F),
    onPrimaryContainer = IlluminatedGoldBright,
    secondary = IlluminatedGold,
    onSecondary = Color.Black,
    secondaryContainer = Color(0xFF241C08),
    onSecondaryContainer = IlluminatedGoldBright,
    tertiary = Color(0xFF6BC4A6),
    onTertiary = Color.Black,
    background = AmoledBlackBg,
    onBackground = IvoryText,
    surface = AmoledBlackBg,
    onSurface = IvoryText,
    surfaceVariant = AmoledSurface,
    onSurfaceVariant = MutedIvoryText,
    outline = Color(0xFF1F3D31),
    error = Color(0xFFF2B8B5),
    onError = Color(0xFF601410)
)

val ItqanShapes = Shapes(
    small = RoundedCornerShape(10.dp),
    medium = RoundedCornerShape(16.dp),
    large = RoundedCornerShape(22.dp)
)

@Composable
fun ItqanTheme(
    themeMode: ItqanThemeMode = ItqanThemeMode.PARCHMENT_LIGHT,
    fontScale: Float = 1.0f,
    forceRtl: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = when (themeMode) {
        ItqanThemeMode.PARCHMENT_LIGHT -> ParchmentLightColors
        ItqanThemeMode.ROYAL_EMERALD_DARK -> RoyalEmeraldDarkColors
        ItqanThemeMode.AMOLED_BLACK -> AmoledBlackColors
    }

    val direction = if (forceRtl) LayoutDirection.Rtl else LayoutDirection.Ltr

    CompositionLocalProvider(LocalLayoutDirection provides direction) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = buildItqanTypography(fontScale),
            shapes = ItqanShapes,
            content = content
        )
    }
}

fun Int.toArabicDigits(useEasternArabic: Boolean = true): String {
    if (!useEasternArabic) return this.toString()
    val easternDigits = charArrayOf('٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩')
    return this.toString().map { ch ->
        if (ch in '0'..'9') easternDigits[ch - '0'] else ch
    }.joinToString("")
}

@Composable
fun MyApplicationTheme(content: @Composable () -> Unit) {
    ItqanTheme(content = content)
}
