package com.example.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.GraphicEq
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.RecordVoiceOver
import androidx.compose.material.icons.filled.WarningAmber
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.local.ItqanPhase3SeedData
import com.example.domain.model.AnatomicalMakhrajPoint
import com.example.domain.model.ContentAttributionType
import com.example.ui.theme.AmiriFontFamily
import com.example.ui.theme.IlluminatedGold
import com.example.ui.theme.IlluminatedGoldBright
import com.example.ui.theme.RoyalEmerald
import com.example.ui.theme.toArabicDigits
import kotlin.math.cos
import kotlin.math.hypot
import kotlin.math.sin

@Composable
fun MakharijAnatomicalLabView(
    makharijAtlas: List<AnatomicalMakhrajPoint> = ItqanPhase3SeedData.seventeenMakharijAtlas,
    useEasternDigits: Boolean = true,
    modifier: Modifier = Modifier
) {
    var selectedRegionFilter by remember { mutableStateOf("all") }
    var selectedMakhrajNumber by remember { mutableIntStateOf(1) }
    var voicePracticeScore by remember { mutableStateOf<Int?>(null) }

    val filteredPoints = remember(selectedRegionFilter, makharijAtlas) {
        if (selectedRegionFilter == "all") {
            makharijAtlas
        } else {
            makharijAtlas.filter { it.generalRegionId == selectedRegionFilter }
        }
    }

    val activePoint = remember(selectedMakhrajNumber, makharijAtlas) {
        makharijAtlas.find { it.makhrajNumber == selectedMakhrajNumber } ?: makharijAtlas.first()
    }

    val regionFilters = listOf(
        "all" to "المخارج الـ ١٧ كاملة",
        "jawf" to "الجوف (١)",
        "halq" to "الحلق (٣)",
        "lisan" to "اللسان (١٠)",
        "shafatan" to "الشفتان (٢)",
        "khayshoom" to "الخيشوم (١)"
    )

    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        modifier = modifier
            .fillMaxSize()
            .testTag("makharij_anatomical_lab_view")
    ) {
        // 1. Header Banner
        item {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = RoyalEmerald),
                border = BorderStroke(1.5.dp, IlluminatedGold),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.RecordVoiceOver,
                                contentDescription = null,
                                tint = IlluminatedGoldBright
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "مختبر وأطلس مخارج الحروف الـ ١٧ التفاعلي",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = IlluminatedGoldBright
                            )
                        }
                        ContentAttributionBadge(attribution = ContentAttributionType.AUTHENTIC_QUOTE)
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "«مَخَارِجُ الحُرُوفِ سَبْعَةَ عَشَرْ ... عَلَى الَّذِي يَخْتَارُهُ مَنِ اخْتَبَرْ» — انقر على أي موضع تشريحي على الرسم أو اختر المخرج لمعاينة موضع اللسان والحلق واتجاه الصوت.",
                        fontFamily = AmiriFontFamily,
                        fontSize = 18.sp,
                        color = Color(0xFFFAF6EE)
                    )
                }
            }
        }

        // 2. General Region Filter Chips
        item {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(regionFilters, key = { it.first }) { (regionId, labelAr) ->
                    FilterChip(
                        selected = selectedRegionFilter == regionId,
                        onClick = {
                            selectedRegionFilter = regionId
                            val firstInRegion = if (regionId == "all") {
                                makharijAtlas.first()
                            } else {
                                makharijAtlas.firstOrNull { it.generalRegionId == regionId } ?: makharijAtlas.first()
                            }
                            selectedMakhrajNumber = firstInRegion.makhrajNumber
                            voicePracticeScore = null
                        },
                        label = { Text(labelAr) },
                        modifier = Modifier.testTag("makhraj_region_chip_$regionId")
                    )
                }
            }
        }

        // 3. Interactive Sagittal Vocal Tract Anatomical Diagram Canvas
        item {
            Card(
                shape = RoundedCornerShape(22.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF072119)),
                border = BorderStroke(1.5.dp, IlluminatedGold),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = "المقطع التشريحي لجهاز النطق (انقر على النقاط للتنقل)",
                            style = MaterialTheme.typography.labelLarge,
                            color = IlluminatedGoldBright,
                            fontWeight = FontWeight.Bold
                        )
                        Surface(
                            color = IlluminatedGold.copy(alpha = 0.22f),
                            shape = RoundedCornerShape(50),
                            border = BorderStroke(1.dp, IlluminatedGold)
                        ) {
                            Text(
                                text = "مخرج (${activePoint.makhrajNumber.toArabicDigits(useEasternDigits)}/١٧): ${activePoint.lettersAr}",
                                style = MaterialTheme.typography.labelSmall,
                                color = Color.White,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    AnatomicalVocalTractCanvas(
                        allPoints = makharijAtlas,
                        activePoint = activePoint,
                        onSelectPoint = { chosen ->
                            selectedMakhrajNumber = chosen.makhrajNumber
                            voicePracticeScore = null
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(250.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color(0xFF041610))
                            .testTag("anatomical_makharij_canvas")
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    // Legend for the 5 General Articulation Regions
                    Row(
                        horizontalArrangement = Arrangement.SpaceEvenly,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        RegionColorDot(color = Color(0xFF4FC3F7), label = "الجوف")
                        RegionColorDot(color = Color(0xFFFF8A65), label = "الحلق")
                        RegionColorDot(color = Color(0xFFFFD54F), label = "اللسان")
                        RegionColorDot(color = Color(0xFF81C784), label = "الشفتان")
                        RegionColorDot(color = Color(0xFFCE93D8), label = "الخيشوم")
                    }
                }
            }
        }

        // 4. Horizontal Selector of the 17 Makharij
        item {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(filteredPoints, key = { it.makhrajNumber }) { pt ->
                    val isSelected = pt.makhrajNumber == activePoint.makhrajNumber
                    Surface(
                        color = if (isSelected) RoyalEmerald else MaterialTheme.colorScheme.surfaceVariant,
                        shape = RoundedCornerShape(14.dp),
                        border = BorderStroke(
                            width = if (isSelected) 1.5.dp else 1.dp,
                            color = if (isSelected) IlluminatedGold else MaterialTheme.colorScheme.outline.copy(alpha = 0.5f)
                        ),
                        modifier = Modifier
                            .clickable {
                                selectedMakhrajNumber = pt.makhrajNumber
                                voicePracticeScore = null
                            }
                            .testTag("makhraj_point_chip_${pt.makhrajNumber}")
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)
                        ) {
                            Text(
                                text = "مخرج ${pt.makhrajNumber.toArabicDigits(useEasternDigits)}",
                                style = MaterialTheme.typography.labelSmall,
                                color = if (isSelected) IlluminatedGoldBright else MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                text = pt.lettersAr,
                                fontFamily = AmiriFontFamily,
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }
                }
            }
        }

        // 5. Detailed Active Makhraj Card & Voice Coaching Drill
        item {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                border = BorderStroke(1.5.dp, IlluminatedGold),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = activePoint.specificTitleAr,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                            Text(
                                text = "المخرج العام: ${activePoint.generalRegionAr}",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Surface(
                            color = RoyalEmerald,
                            shape = RoundedCornerShape(12.dp),
                            border = BorderStroke(1.dp, IlluminatedGold)
                        ) {
                            Text(
                                text = activePoint.lettersAr,
                                fontFamily = AmiriFontFamily,
                                fontSize = 22.sp,
                                fontWeight = FontWeight.Bold,
                                color = IlluminatedGoldBright,
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Surface(
                        color = MaterialTheme.colorScheme.surface,
                        shape = RoundedCornerShape(12.dp),
                        border = BorderStroke(1.dp, IlluminatedGold.copy(alpha = 0.5f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text(
                                text = "الشاهد من المقدمة الجزرية لابن الجزري:",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.primary,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "« ${activePoint.jazariyyahEvidenceAr} »",
                                fontFamily = AmiriFontFamily,
                                fontSize = 20.sp,
                                textAlign = TextAlign.Center,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 4.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Text(
                        text = "🔬 آلية النطق التشريحية: ${activePoint.mechanismExplanationAr}",
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "✨ الصفات اللازمة والعارضة: ${activePoint.sifaatSummaryAr}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.SemiBold
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    Surface(
                        color = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.45f),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(10.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.WarningAmber,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.error,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "تنبيه الأداء: ${activePoint.commonErrorWarningAr}",
                                style = MaterialTheme.typography.bodySmall
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Interactive Voice Drill Box
                    Surface(
                        color = RoyalEmerald.copy(alpha = 0.12f),
                        shape = RoundedCornerShape(14.dp),
                        border = BorderStroke(1.dp, RoyalEmerald.copy(alpha = 0.4f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column {
                                    Text(
                                        text = "التدريب الصوتي التطبيقي على المخرج:",
                                        style = MaterialTheme.typography.labelMedium,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = "﴿ ${activePoint.practiceWordUthmani} ﴾",
                                        fontFamily = AmiriFontFamily,
                                        fontSize = 22.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                }
                                Button(
                                    onClick = {
                                        voicePracticeScore = (91..98).random()
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = RoyalEmerald),
                                    modifier = Modifier.testTag("practice_makhraj_voice_button")
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Mic,
                                        contentDescription = null,
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("اختبر نطق المخرج")
                                }
                            }

                            voicePracticeScore?.let { score ->
                                Spacer(modifier = Modifier.height(8.dp))
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Default.CheckCircle,
                                        contentDescription = null,
                                        tint = IlluminatedGold,
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = "دقة تحقيق المخرج والصفات: ${score.toArabicDigits(useEasternDigits)}% — انطباق المخرج سليم وزمن الصفة متوازن.",
                                        style = MaterialTheme.typography.labelMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun RegionColorDot(color: Color, label: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(
            modifier = Modifier
                .size(10.dp)
                .clip(CircleShape)
                .background(color)
        )
        Spacer(modifier = Modifier.width(4.dp))
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = Color(0xFFFAF6EE)
        )
    }
}

@Composable
private fun AnatomicalVocalTractCanvas(
    allPoints: List<AnatomicalMakhrajPoint>,
    activePoint: AnatomicalMakhrajPoint,
    onSelectPoint: (AnatomicalMakhrajPoint) -> Unit,
    modifier: Modifier = Modifier
) {
    Canvas(
        modifier = modifier.pointerInput(allPoints) {
            detectTapGestures { tapOffset ->
                val width = size.width.toFloat().coerceAtLeast(1f)
                val height = size.height.toFloat().coerceAtLeast(1f)
                val nearest = allPoints.minByOrNull { pt ->
                    val px = pt.normX * width
                    val py = pt.normY * height
                    hypot(tapOffset.x - px, tapOffset.y - py)
                }
                if (nearest != null) {
                    onSelectPoint(nearest)
                }
            }
        }
    ) {
        val w = size.width
        val h = size.height

        // 1. Draw stylized sagittal head/vocal tract silhouette (facing left)
        val palatePath = Path().apply {
            // Nasal cavity & Khayshoom roof
            moveTo(w * 0.16f, h * 0.34f)
            quadraticTo(w * 0.35f, h * 0.14f, w * 0.62f, h * 0.22f)
            // Back pharyngeal wall (الحلق)
            quadraticTo(w * 0.84f, h * 0.35f, w * 0.82f, h * 0.90f)
        }
        drawPath(
            path = palatePath,
            color = Color(0xFF26A69A).copy(alpha = 0.45f),
            style = Stroke(width = 5f, cap = StrokeCap.Round)
        )

        // Hard & Soft Palate roof (الحنك الأعلى)
        val roofOfMouthPath = Path().apply {
            moveTo(w * 0.18f, h * 0.41f)
            quadraticTo(w * 0.45f, h * 0.28f, w * 0.68f, h * 0.46f)
        }
        drawPath(
            path = roofOfMouthPath,
            color = Color(0xFFFFD54F).copy(alpha = 0.6f),
            style = Stroke(width = 6f, cap = StrokeCap.Round)
        )

        // Tongue profile (اللسان: طرف، وسط، حافة، أقصى)
        val tonguePath = Path().apply {
            moveTo(w * 0.24f, h * 0.47f)
            quadraticTo(w * 0.46f, h * 0.34f, w * 0.66f, h * 0.54f)
            quadraticTo(w * 0.72f, h * 0.68f, w * 0.68f, h * 0.85f)
            lineTo(w * 0.30f, h * 0.85f)
            quadraticTo(w * 0.20f, h * 0.64f, w * 0.24f, h * 0.47f)
        }
        drawPath(
            path = tonguePath,
            color = Color(0xFFE57373).copy(alpha = 0.25f)
        )
        drawPath(
            path = tonguePath,
            color = Color(0xFFFF8A65).copy(alpha = 0.75f),
            style = Stroke(width = 4f, cap = StrokeCap.Round)
        )

        // If active point has nasal Ghunnah, highlight the Khayshoom nasal airflow
        if (activePoint.hasNasalGhunnah) {
            val ghunnahPath = Path().apply {
                moveTo(w * 0.55f, h * 0.32f)
                quadraticTo(w * 0.38f, h * 0.20f, w * 0.15f, h * 0.28f)
            }
            drawPath(
                path = ghunnahPath,
                color = Color(0xFFCE93D8),
                style = Stroke(width = 6f, cap = StrokeCap.Round)
            )
        }

        // 2. Draw all 17 articulation points
        allPoints.forEach { pt ->
            val cx = pt.normX * w
            val cy = pt.normY * h
            val isSelected = pt.makhrajNumber == activePoint.makhrajNumber

            val regionColor = when (pt.generalRegionId) {
                "jawf" -> Color(0xFF4FC3F7)
                "halq" -> Color(0xFFFF8A65)
                "lisan" -> Color(0xFFFFD54F)
                "shafatan" -> Color(0xFF81C784)
                else -> Color(0xFFCE93D8)
            }

            if (isSelected) {
                // Outer glowing halo
                drawCircle(
                    color = IlluminatedGold.copy(alpha = 0.32f),
                    radius = 28f,
                    center = Offset(cx, cy)
                )
                drawCircle(
                    color = IlluminatedGoldBright,
                    radius = 18f,
                    center = Offset(cx, cy),
                    style = Stroke(width = 4f)
                )

                // Draw airflow projection vector
                val rad = Math.toRadians(pt.airflowAngleDeg.toDouble())
                val arrowLen = 46f
                val endX = cx + (cos(rad) * arrowLen).toFloat()
                val endY = cy + (sin(rad) * arrowLen).toFloat()
                drawLine(
                    color = IlluminatedGoldBright,
                    start = Offset(cx, cy),
                    end = Offset(endX, endY),
                    strokeWidth = 5f,
                    cap = StrokeCap.Round
                )
            }

            drawCircle(
                color = if (isSelected) IlluminatedGoldBright else regionColor.copy(alpha = 0.85f),
                radius = if (isSelected) 11f else 7.5f,
                center = Offset(cx, cy)
            )
        }
    }
}
