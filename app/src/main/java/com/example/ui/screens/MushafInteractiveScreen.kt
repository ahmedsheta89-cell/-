package com.example.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.BookmarkAdd
import androidx.compose.material.icons.filled.CloudDownload
import androidx.compose.material.icons.filled.ColorLens
import androidx.compose.material.icons.filled.Flag
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.RecordVoiceOver
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.ViewAgenda
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.ScrollableTabRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.audio.PlaybackUiState
import com.example.data.local.AyahEntity
import com.example.data.repository.UserPreferencesState
import com.example.domain.model.ContentAttributionType
import com.example.domain.model.ReciterProfile
import com.example.domain.model.SurahMetadata
import com.example.ui.components.ContentAttributionBadge
import com.example.ui.components.IlluminatedSurahHeader
import com.example.ui.components.RecitationPlayerBar
import com.example.ui.components.ReportScholarlyErrorDialog
import com.example.ui.components.TajweedColorLegendStrip
import com.example.ui.components.TajweedUthmaniText
import com.example.ui.components.shareFormattedAyahCard
import com.example.ui.theme.AmiriFontFamily
import com.example.ui.theme.IlluminatedGold
import com.example.ui.theme.RoyalEmerald
import com.example.ui.theme.toArabicDigits

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MushafInteractiveScreen(
    userPrefs: UserPreferencesState,
    surahCatalog: List<SurahMetadata>,
    selectedSurahNumber: Int,
    currentSurahAyahs: List<AyahEntity>,
    isDownloadingSurah: Boolean,
    searchQuery: String,
    searchResults: List<AyahEntity>,
    selectedAyahForSheet: AyahEntity?,
    playbackState: PlaybackUiState,
    reciters: List<ReciterProfile>,
    onSelectSurah: (Int) -> Unit,
    onDownloadSurah: (Int) -> Unit,
    onSearchQueryChange: (String) -> Unit,
    onTogglePageMode: (Boolean) -> Unit,
    onToggleTajweedColors: (Boolean) -> Unit,
    onPlayAyah: (AyahEntity) -> Unit,
    onOpenAyahSheet: (AyahEntity) -> Unit,
    onCloseAyahSheet: () -> Unit,
    onSaveBookmarkNote: (AyahEntity, String) -> Unit,
    onAskScholarAboutAyah: (AyahEntity) -> Unit,
    onTogglePlayPause: () -> Unit,
    onStopAudio: () -> Unit,
    onCycleRepeat: () -> Unit,
    onCycleSpeed: () -> Unit,
    onCycleSilenceGap: () -> Unit,
    onCycleSleepTimer: () -> Unit,
    onSelectReciter: (ReciterProfile) -> Unit,
    onSubmitErrorReport: (String, String, String, String) -> Unit,
    selectedQiraatNarratorId: String = "hafs_asim",
    tadabburJournals: List<com.example.data.local.TadabburJournalEntity> = com.example.data.local.ItqanPhase3SeedData.buildInitialTadabburJournal(),
    onSelectQiraatNarrator: (String) -> Unit = {},
    onSaveTadabburJournalEntry: (Int, String, Int, String, String, String, String, Int) -> Unit = { _, _, _, _, _, _, _, _ -> },
    modifier: Modifier = Modifier
) {
    var showReciterDialog by remember { mutableStateOf(false) }
    var ayahForErrorReport by remember { mutableStateOf<AyahEntity?>(null) }
    var encyclopediaExplorerTab by remember { mutableStateOf<Int?>(null) }
    var showColoredQiraatBar by remember { mutableStateOf(false) }
    var showKhalwahTadabburSheet by remember { mutableStateOf(false) }

    val selectedSurahMeta = surahCatalog.find { it.number == selectedSurahNumber } ?: surahCatalog.first()
    val displayedAyahs = if (searchQuery.isNotBlank()) searchResults else currentSurahAyahs

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 14.dp, vertical = 10.dp)
            .testTag("mushaf_interactive_screen")
    ) {
        // 1. Search & Mode Controls Row
        OutlinedTextField(
            value = searchQuery,
            onValueChange = onSearchQueryChange,
            placeholder = { Text("ابحث في الآيات أو السور أو التفسير (بدون تشكيل)...") },
            leadingIcon = {
                Icon(
                    imageVector = Icons.Default.Search,
                    contentDescription = "بحث في المصحف"
                )
            },
            trailingIcon = {
                if (searchQuery.isNotEmpty()) {
                    TextButton(onClick = { onSearchQueryChange("") }) {
                        Text("مسح")
                    }
                }
            },
            singleLine = true,
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier
                .fillMaxWidth()
                .testTag("mushaf_search_input")
        )

        Spacer(modifier = Modifier.height(8.dp))

        // 2. Surah Selector Horizontal Ribbon
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            items(surahCatalog, key = { it.number }) { surah ->
                val isSelected = surah.number == selectedSurahNumber
                FilterChip(
                    selected = isSelected,
                    onClick = { onSelectSurah(surah.number) },
                    label = {
                        Text(
                            text = "${surah.number.toArabicDigits(userPrefs.useEasternArabicDigits)}. ${surah.nameAr}",
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                        )
                    },
                    modifier = Modifier.testTag("surah_chip_${surah.number}")
                )
            }
        }

        // 3. Display Mode Toggle (Page 604 View vs Study View) & Tajweed Colors Toggle
        Row(
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(
                    selected = userPrefs.mushafPageMode,
                    onClick = { onTogglePageMode(!userPrefs.mushafPageMode) },
                    leadingIcon = {
                        Icon(
                            imageVector = if (userPrefs.mushafPageMode) Icons.Default.MenuBook else Icons.Default.ViewAgenda,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp)
                        )
                    },
                    label = {
                        Text(if (userPrefs.mushafPageMode) "صفحات المصحف (٦٠٤)" else "وضع الدراسة والتفسير")
                    },
                    modifier = Modifier.testTag("toggle_mushaf_mode_chip")
                )

                FilterChip(
                    selected = userPrefs.showTajweedColors,
                    onClick = { onToggleTajweedColors(!userPrefs.showTajweedColors) },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.ColorLens,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp)
                        )
                    },
                    label = { Text("تلوين التجويد") },
                    modifier = Modifier.testTag("toggle_tajweed_colors_chip")
                )
            }

            IconButton(
                onClick = { onDownloadSurah(selectedSurahNumber) },
                modifier = Modifier.testTag("download_surah_offline_button")
            ) {
                Icon(
                    imageVector = Icons.Default.CloudDownload,
                    contentDescription = "تنزيل السورة للعمل دون إنترنت",
                    tint = IlluminatedGold
                )
            }
        }

        // 3b. Phase 2 Interactive Encyclopedic Tools Ribbon (Ten Qira'at & Tafsirs | Mind Maps & Mutashabihat | Gharib Lexicon)
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 6.dp)
        ) {
            item {
                FilterChip(
                    selected = encyclopediaExplorerTab == 0,
                    onClick = { encyclopediaExplorerTab = 0 },
                    label = { Text("مقارنة القراءات ١٠ والتفاسير") },
                    modifier = Modifier.testTag("open_encyclopedia_qiraat_chip")
                )
            }
            item {
                FilterChip(
                    selected = encyclopediaExplorerTab == 1,
                    onClick = { encyclopediaExplorerTab = 1 },
                    label = { Text("خرائط المقاصد والمتشابهات") },
                    modifier = Modifier.testTag("open_encyclopedia_mindmap_chip")
                )
            }
            item {
                FilterChip(
                    selected = encyclopediaExplorerTab == 2,
                    onClick = { encyclopediaExplorerTab = 2 },
                    label = { Text("معجم غريب القرآن وأسباب النزول") },
                    modifier = Modifier.testTag("open_encyclopedia_lexicon_chip")
                )
            }
            item {
                FilterChip(
                    selected = showColoredQiraatBar,
                    onClick = { showColoredQiraatBar = !showColoredQiraatBar },
                    label = { Text("مصحف القراءات الملون") },
                    modifier = Modifier.testTag("toggle_colored_qiraat_bar_chip")
                )
            }
            item {
                FilterChip(
                    selected = showKhalwahTadabburSheet,
                    onClick = { showKhalwahTadabburSheet = true },
                    label = { Text("خلوة التدبر ودفتر الخواطر") },
                    modifier = Modifier.testTag("open_mushaf_khalwah_chip")
                )
            }
        }

        if (showColoredQiraatBar) {
            com.example.ui.components.ColoredQiraatMushafRibbon(
                selectedNarratorId = selectedQiraatNarratorId,
                onSelectNarrator = onSelectQiraatNarrator,
                modifier = Modifier.padding(bottom = 8.dp)
            )
        }

        if (isDownloadingSurah) {
            LinearProgressIndicator(
                color = IlluminatedGold,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp)
            )
        }

        if (userPrefs.showTajweedColors) {
            TajweedColorLegendStrip(modifier = Modifier.padding(bottom = 8.dp))
        }

        // 4. Main Mushaf Content Area
        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(12.dp),
            contentPadding = PaddingValues(bottom = 12.dp),
            modifier = Modifier.weight(1f)
        ) {
            if (searchQuery.isBlank()) {
                item {
                    IlluminatedSurahHeader(
                        surahNumber = selectedSurahMeta.number,
                        surahNameAr = selectedSurahMeta.nameAr,
                        revelationType = selectedSurahMeta.revelationType,
                        ayahCount = selectedSurahMeta.ayahCount,
                        juzNumber = selectedSurahMeta.juzNumber,
                        maqasidSummary = selectedSurahMeta.maqasidSummary,
                        useEasternDigits = userPrefs.useEasternArabicDigits
                    )
                }
            }

            if (userPrefs.mushafPageMode && searchQuery.isBlank()) {
                // Mode 1: Classical Madani Mushaf Page Frame (604-page metadata layout)
                val groupedByPage = displayedAyahs.groupBy { it.pageNumber }
                groupedByPage.forEach { (pageNum, pageAyahs) ->
                    item(key = "mushaf_page_$pageNum") {
                        val firstAyah = pageAyahs.firstOrNull()
                        val juz = firstAyah?.juzNumber ?: selectedSurahMeta.juzNumber
                        val hizb = firstAyah?.hizbNumber ?: 1

                        Card(
                            shape = RoundedCornerShape(22.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.surface
                            ),
                            border = BorderStroke(2.dp, IlluminatedGold),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(18.dp)) {
                                // Top Manuscript Page Header
                                Row(
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Text(
                                        text = "الجزء ${juz.toArabicDigits(userPrefs.useEasternArabicDigits)} • الحزب ${hizb.toArabicDigits(userPrefs.useEasternArabicDigits)}",
                                        style = MaterialTheme.typography.labelMedium,
                                        color = IlluminatedGold
                                    )
                                    ContentAttributionBadge(attribution = ContentAttributionType.AUTHENTIC_QUOTE)
                                    Text(
                                        text = "سورة ${selectedSurahMeta.nameAr}",
                                        style = MaterialTheme.typography.labelMedium,
                                        color = IlluminatedGold
                                    )
                                }

                                HorizontalDivider(
                                    color = IlluminatedGold.copy(alpha = 0.4f),
                                    modifier = Modifier.padding(vertical = 10.dp)
                                )

                                // Flow of Ayahs on the Page
                                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                    pageAyahs.forEach { ayah ->
                                        val isCurrentPlaying =
                                            playbackState.currentSurah == ayah.surahNumber &&
                                                playbackState.currentAyah == ayah.ayahNumber

                                        Surface(
                                            color = if (isCurrentPlaying) {
                                                IlluminatedGold.copy(alpha = 0.14f)
                                            } else {
                                                Color.Transparent
                                            },
                                            shape = RoundedCornerShape(12.dp),
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .clickable { onOpenAyahSheet(ayah) }
                                                .testTag("mushaf_ayah_${ayah.surahNumber}_${ayah.ayahNumber}")
                                        ) {
                                            Column(modifier = Modifier.padding(8.dp)) {
                                                TajweedUthmaniText(
                                                    uthmaniText = ayah.uthmaniText,
                                                    ayahNumber = ayah.ayahNumber,
                                                    showTajweedColors = userPrefs.showTajweedColors,
                                                    highlightedWordIndex = if (isCurrentPlaying) playbackState.highlightedWordIndex else -1,
                                                    useEasternDigits = userPrefs.useEasternArabicDigits,
                                                    modifier = Modifier.fillMaxWidth()
                                                )
                                                Row(
                                                    horizontalArrangement = Arrangement.End,
                                                    verticalAlignment = Alignment.CenterVertically,
                                                    modifier = Modifier.fillMaxWidth()
                                                ) {
                                                    TextButton(onClick = { onPlayAyah(ayah) }) {
                                                        Icon(
                                                            imageVector = Icons.Default.VolumeUp,
                                                            contentDescription = "استماع للآية",
                                                            modifier = Modifier.size(16.dp)
                                                        )
                                                        Spacer(modifier = Modifier.width(4.dp))
                                                        Text("تلاوة الآية")
                                                    }
                                                    TextButton(onClick = { onOpenAyahSheet(ayah) }) {
                                                        Icon(
                                                            imageVector = Icons.Default.MenuBook,
                                                            contentDescription = "بطاقة علوم الآية",
                                                            modifier = Modifier.size(16.dp)
                                                        )
                                                        Spacer(modifier = Modifier.width(4.dp))
                                                        Text("علوم الآية والتفسير")
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }

                                HorizontalDivider(
                                    color = IlluminatedGold.copy(alpha = 0.4f),
                                    modifier = Modifier.padding(vertical = 10.dp)
                                )

                                // Page Number Footer (out of 604)
                                Text(
                                    text = "صفحة ${pageNum.toArabicDigits(userPrefs.useEasternArabicDigits)} من ${(604).toArabicDigits(userPrefs.useEasternArabicDigits)}",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = MaterialTheme.colorScheme.primary,
                                    textAlign = TextAlign.Center,
                                    modifier = Modifier.fillMaxWidth()
                                )
                            }
                        }
                    }
                }
            } else {
                // Mode 2: Ayah-by-Ayah Study View with Direct Tafsir & Sciences Preview
                items(displayedAyahs, key = { it.compositeKey }) { ayah ->
                    val isCurrentPlaying =
                        playbackState.currentSurah == ayah.surahNumber &&
                            playbackState.currentAyah == ayah.ayahNumber

                    Card(
                        shape = RoundedCornerShape(18.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = if (isCurrentPlaying) {
                                MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.45f)
                            } else {
                                MaterialTheme.colorScheme.surfaceVariant
                            }
                        ),
                        border = BorderStroke(
                            width = if (isCurrentPlaying) 1.5.dp else 1.dp,
                            color = if (isCurrentPlaying) IlluminatedGold else MaterialTheme.colorScheme.outline
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onOpenAyahSheet(ayah) }
                            .testTag("study_ayah_card_${ayah.compositeKey}")
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    text = "سورة ${ayah.surahNameAr} • الآية ${ayah.ayahNumber.toArabicDigits(userPrefs.useEasternArabicDigits)} • ص ${ayah.pageNumber.toArabicDigits(userPrefs.useEasternArabicDigits)}",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = MaterialTheme.colorScheme.primary,
                                    fontWeight = FontWeight.Bold
                                )
                                Row {
                                    IconButton(
                                        onClick = { onPlayAyah(ayah) },
                                        modifier = Modifier.size(36.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.VolumeUp,
                                            contentDescription = "تشغيل التلاوة",
                                            tint = IlluminatedGold
                                        )
                                    }
                                    IconButton(
                                        onClick = { ayahForErrorReport = ayah },
                                        modifier = Modifier.size(36.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Flag,
                                            contentDescription = "الإبلاغ عن خطأ",
                                            tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                            modifier = Modifier.size(18.dp)
                                        )
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(6.dp))
                            TajweedUthmaniText(
                                uthmaniText = ayah.uthmaniText,
                                ayahNumber = ayah.ayahNumber,
                                showTajweedColors = userPrefs.showTajweedColors,
                                highlightedWordIndex = if (isCurrentPlaying) playbackState.highlightedWordIndex else -1,
                                useEasternDigits = userPrefs.useEasternArabicDigits,
                                modifier = Modifier.fillMaxWidth()
                            )

                            HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

                            Text(
                                text = "التفسير الميسر: ${ayah.tafsirMuyassar}",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Row(
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                ContentAttributionBadge(attribution = ContentAttributionType.AUTHENTIC_QUOTE)
                                TextButton(onClick = { onOpenAyahSheet(ayah) }) {
                                    Text("المصادر الأربعة وعلوم الآية ←")
                                }
                            }
                        }
                    }
                }
            }
        }

        // 5. Persistent Recitation Player Bar
        RecitationPlayerBar(
            playbackState = playbackState,
            onTogglePlayPause = onTogglePlayPause,
            onStop = onStopAudio,
            onCycleRepeat = onCycleRepeat,
            onCycleSpeed = onCycleSpeed,
            onCycleSilenceGap = onCycleSilenceGap,
            onCycleSleepTimer = onCycleSleepTimer,
            onOpenReciterPicker = { showReciterDialog = true },
            useEasternDigits = userPrefs.useEasternArabicDigits
        )
    }

    // Ayah Sciences Bottom Sheet (5 Tabs: 4 Tafsirs | Gharib & Asbab | Tajweed & Qira'at | I'rab & Balaghah | Bookmark & AI)
    if (selectedAyahForSheet != null) {
        AyahSciencesModalBottomSheet(
            ayah = selectedAyahForSheet,
            useEasternDigits = userPrefs.useEasternArabicDigits,
            onDismiss = onCloseAyahSheet,
            onPlayAyah = { onPlayAyah(selectedAyahForSheet) },
            onSaveBookmark = { note -> onSaveBookmarkNote(selectedAyahForSheet, note) },
            onAskScholar = {
                onCloseAyahSheet()
                onAskScholarAboutAyah(selectedAyahForSheet)
            },
            onReportError = {
                ayahForErrorReport = selectedAyahForSheet
            }
        )
    }

    // Reciter Selection Dialog
    if (showReciterDialog) {
        AlertDialog(
            onDismissRequest = { showReciterDialog = false },
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.RecordVoiceOver,
                        contentDescription = null,
                        tint = IlluminatedGold
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("اختيار القارئ المتقن")
                }
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    reciters.forEach { reciter ->
                        val isSelected = reciter.id == playbackState.selectedReciter.id
                        Surface(
                            color = if (isSelected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant,
                            shape = RoundedCornerShape(12.dp),
                            border = BorderStroke(1.dp, if (isSelected) IlluminatedGold else Color.Transparent),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    onSelectReciter(reciter)
                                    showReciterDialog = false
                                }
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(
                                    text = reciter.nameAr,
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "${reciter.styleAr} — ${reciter.descriptionAr}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showReciterDialog = false }) {
                    Text("إغلاق")
                }
            }
        )
    }

    // Error Reporting Dialog
    ayahForErrorReport?.let { targetAyah ->
        ReportScholarlyErrorDialog(
            screenName = "المصحف التفاعلي وبطاقة علوم الآية",
            referenceKey = targetAyah.compositeKey,
            itemTitle = "سورة ${targetAyah.surahNameAr} الآية ${targetAyah.ayahNumber}",
            onDismiss = { ayahForErrorReport = null },
            onSubmitReport = { details ->
                onSubmitErrorReport(
                    "المصحف التفاعلي",
                    targetAyah.compositeKey,
                    "سورة ${targetAyah.surahNameAr} (${targetAyah.ayahNumber})",
                    details
                )
            }
        )
    }

    if (encyclopediaExplorerTab != null) {
        com.example.ui.components.MushafEncyclopediaExplorerSheet(
            initialTab = encyclopediaExplorerTab ?: 0,
            selectedSurahNumber = selectedSurahNumber,
            currentSurahAyahs = currentSurahAyahs,
            mindMaps = com.example.data.local.ItqanPhase2SeedData.surahMindMaps,
            mutashabihatRules = com.example.data.local.ItqanPhase2SeedData.mutashabihatRules,
            qiraatComparisons = com.example.data.local.ItqanPhase2SeedData.qiraatComparisons,
            gharibLexicon = com.example.data.local.ItqanPhase2SeedData.gharibLexiconEntries,
            useEasternDigits = userPrefs.useEasternArabicDigits,
            onDismiss = { encyclopediaExplorerTab = null }
        )
    }

    if (showKhalwahTadabburSheet) {
        com.example.ui.components.QuranicKhalwahAndTadabburSheet(
            currentAyah = displayedAyahs.firstOrNull(),
            tadabburJournals = tadabburJournals,
            useEasternDigits = userPrefs.useEasternArabicDigits,
            onSaveJournalEntry = onSaveTadabburJournalEntry,
            onDismiss = { showKhalwahTadabburSheet = false }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AyahSciencesModalBottomSheet(
    ayah: AyahEntity,
    useEasternDigits: Boolean,
    onDismiss: () -> Unit,
    onPlayAyah: () -> Unit,
    onSaveBookmark: (String) -> Unit,
    onAskScholar: () -> Unit,
    onReportError: () -> Unit
) {
    val context = LocalContext.current
    var selectedTab by remember { mutableIntStateOf(0) }
    var selectedTafsirIdx by remember { mutableIntStateOf(0) }
    var noteInput by remember { mutableStateOf("") }

    val tabs = listOf(
        "التفاسير الأربعة",
        "الغريب وأسباب النزول",
        "التجويد والقراءات",
        "الإعراب والبلاغة",
        "حفظ وتدبر"
    )

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = MaterialTheme.colorScheme.surface
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 18.dp, vertical = 10.dp)
        ) {
            Row(
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = "بطاقة علوم الآية: سورة ${ayah.surahNameAr} (${ayah.ayahNumber.toArabicDigits(useEasternDigits)})",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
                Row {
                    IconButton(onClick = onPlayAyah) {
                        Icon(
                            imageVector = Icons.Default.VolumeUp,
                            contentDescription = "استماع",
                            tint = IlluminatedGold
                        )
                    }
                    IconButton(
                        onClick = {
                            shareFormattedAyahCard(
                                context = context,
                                surahNameAr = ayah.surahNameAr,
                                ayahNumber = ayah.ayahNumber,
                                uthmaniText = ayah.uthmaniText,
                                tafsirSnippet = ayah.tafsirMuyassar,
                                tafsirSource = "التفسير الميسر"
                            )
                        }
                    ) {
                        Icon(
                            imageVector = Icons.Default.Share,
                            contentDescription = "مشاركة البطاقة",
                            tint = MaterialTheme.colorScheme.primary
                        )
                    }
                    IconButton(onClick = onReportError) {
                        Icon(
                            imageVector = Icons.Default.Flag,
                            contentDescription = "الإبلاغ عن خطأ",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            // Authenticated Uthmani Ayah Header
            Surface(
                color = MaterialTheme.colorScheme.surfaceVariant,
                shape = RoundedCornerShape(14.dp),
                border = BorderStroke(1.dp, IlluminatedGold.copy(alpha = 0.6f)),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp)
            ) {
                Text(
                    text = "﴿ ${ayah.uthmaniText} ﴾",
                    fontFamily = AmiriFontFamily,
                    fontSize = 22.sp,
                    lineHeight = 38.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(14.dp)
                )
            }

            ScrollableTabRow(
                selectedTabIndex = selectedTab,
                edgePadding = 0.dp
            ) {
                tabs.forEachIndexed { idx, title ->
                    Tab(
                        selected = selectedTab == idx,
                        onClick = { selectedTab = idx },
                        text = { Text(title, style = MaterialTheme.typography.labelMedium) }
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            when (selectedTab) {
                0 -> {
                    val tafsirSources = listOf(
                        "التفسير الميسر" to ayah.tafsirMuyassar,
                        "تفسير السعدي" to ayah.tafsirSaadi,
                        "تفسير ابن كثير" to ayah.tafsirIbnKathir,
                        "تفسير الطبري" to ayah.tafsirTabari
                    )
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        tafsirSources.forEachIndexed { idx, pair ->
                            FilterChip(
                                selected = selectedTafsirIdx == idx,
                                onClick = { selectedTafsirIdx = idx },
                                label = { Text(pair.first, style = MaterialTheme.typography.labelSmall) }
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    ContentAttributionBadge(attribution = ContentAttributionType.AUTHENTIC_QUOTE)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = tafsirSources[selectedTafsirIdx].second,
                        style = MaterialTheme.typography.bodyLarge
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "المصدر المعتمد: ${tafsirSources[selectedTafsirIdx].first} — سورة ${ayah.surahNameAr} الآية ${ayah.ayahNumber}",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
                1 -> {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        ContentAttributionBadge(attribution = ContentAttributionType.AUTHENTIC_QUOTE)
                        Text(
                            text = "📖 غريب القرآن (مفردات الراغب الأصفهاني):",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Text(text = ayah.gharibKalimat, style = MaterialTheme.typography.bodyMedium)
                        HorizontalDivider()
                        Text(
                            text = "📜 أسباب النزول (الإمام الواحدي):",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Text(text = ayah.asbabNuzul, style = MaterialTheme.typography.bodyMedium)
                    }
                }
                2 -> {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        ContentAttributionBadge(attribution = ContentAttributionType.TEAM_SIMPLIFIED)
                        Text(
                            text = "🎙️ أحكام التجويد وفرش القراءات العشر:",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Text(text = ayah.tajweedAndQiraat, style = MaterialTheme.typography.bodyLarge)
                        Text(
                            text = "المصدر: المقدمة الجزرية والنشر في القراءات العشر لابن الجزري",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                3 -> {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        ContentAttributionBadge(attribution = ContentAttributionType.TEAM_SIMPLIFIED)
                        Text(
                            text = "✒️ الإعراب البياني والوجوه البلاغية:",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Text(text = ayah.irabAndBalaghah, style = MaterialTheme.typography.bodyLarge)
                        Text(
                            text = "المصدر: الإتقان في علوم القرآن للسيوطي — باب الإعراب والبلاغة",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                4 -> {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        OutlinedTextField(
                            value = noteInput,
                            onValueChange = { noteInput = it },
                            label = { Text("سجّل خاطرتك التدبرية أو فائدة الحفظ حول الآية") },
                            modifier = Modifier.fillMaxWidth()
                        )
                        Button(
                            onClick = { onSaveBookmark(noteInput) },
                            colors = ButtonDefaults.buttonColors(containerColor = RoyalEmerald),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(imageVector = Icons.Default.BookmarkAdd, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("حفظ العلامة المرجعية والخاطرة")
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))
            OutlinedButton(
                onClick = onAskScholar,
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("ask_scholar_from_ayah_sheet_button")
            ) {
                Icon(
                    imageVector = Icons.Default.AutoAwesome,
                    contentDescription = null,
                    tint = IlluminatedGold
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text("اسأل المعلم الذكي الموثق تفصيلاً عن هذه الآية")
            }
            Spacer(modifier = Modifier.height(20.dp))
        }
    }
}
