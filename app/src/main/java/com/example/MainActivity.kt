package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.CloudDone
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.RecordVoiceOver
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationRail
import androidx.compose.material3.NavigationRailItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.credentials.CredentialManager
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.data.firebase.configureAppCheck
import com.example.ui.screens.AcademyAndMatnScreen
import com.example.ui.screens.AiScholarScreen
import com.example.ui.screens.AuthScreen
import com.example.ui.screens.HifzAndTasmeeScreen
import com.example.ui.screens.HomeRawdahScreen
import com.example.ui.screens.ItqanSettingsModalDialog
import com.example.ui.screens.MushafInteractiveScreen
import com.example.ui.screens.onGoogleSignInClicked
import com.example.ui.screens.signOut
import com.example.ui.theme.AmiriFontFamily
import com.example.ui.theme.CairoFontFamily
import com.example.ui.theme.IlluminatedGold
import com.example.ui.theme.ItqanTheme
import com.example.ui.theme.ItqanThemeMode
import com.example.ui.viewmodel.ItqanViewModel
import com.google.firebase.Firebase
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.auth

enum class ItqanNavTab(
    val routeId: String,
    val labelAr: String,
    val icon: ImageVector,
    val testTag: String
) {
    RAWDAH("rawdah", "الروضة", Icons.Default.Home, "nav_tab_rawdah"),
    MUSHAF("mushaf", "المصحف", Icons.Default.Book, "nav_tab_mushaf"),
    ACADEMY("academy", "الأكاديمية", Icons.Default.School, "nav_tab_academy"),
    HIFZ("hifz", "التحفيظ", Icons.Default.RecordVoiceOver, "nav_tab_hifz"),
    AI_SCHOLAR("ai_scholar", "المعلم الذكي", Icons.Default.AutoAwesome, "nav_tab_ai_scholar")
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Initialize Firebase App Check (Debug provider on debug/emulator, Play Integrity on release)
        configureAppCheck(this, intent)
        enableEdgeToEdge()
        setContent {
            ItqanRootApp()
        }
    }
}

@Composable
fun ItqanRootApp() {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val credentialManager = remember(context) { CredentialManager.create(context) }

    var currentUser by remember { mutableStateOf<FirebaseUser?>(Firebase.auth.currentUser) }
    var guestModeAccepted by rememberSaveable { mutableStateOf(false) }
    var showDedicatedAuthScreen by rememberSaveable { mutableStateOf(false) }
    var authErrorMessage by remember { mutableStateOf<String?>(null) }

    DisposableEffect(Unit) {
        val listener = FirebaseAuth.AuthStateListener { firebaseAuth ->
            currentUser = firebaseAuth.currentUser
            if (firebaseAuth.currentUser != null) {
                showDedicatedAuthScreen = false
            }
        }
        Firebase.auth.addAuthStateListener(listener)
        onDispose {
            Firebase.auth.removeAuthStateListener(listener)
        }
    }

    val triggerInteractiveGoogleSignIn: () -> Unit = {
        authErrorMessage = null
        onGoogleSignInClicked(
            context = context,
            credentialManager = credentialManager,
            onAuthSuccess = {
                currentUser = Firebase.auth.currentUser
                showDedicatedAuthScreen = false
            },
            onAuthError = { msg ->
                authErrorMessage = msg
            },
            scope = coroutineScope
        )
    }

    val triggerSignOut: () -> Unit = {
        signOut(
            credentialManager = credentialManager,
            scope = coroutineScope,
            onSignOutComplete = {
                currentUser = null
                guestModeAccepted = false
            }
        )
    }

    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
        if ((currentUser == null && !guestModeAccepted) || showDedicatedAuthScreen) {
            ItqanTheme(themeMode = ItqanThemeMode.PARCHMENT_LIGHT) {
                BackHandler(enabled = showDedicatedAuthScreen && guestModeAccepted) {
                    showDedicatedAuthScreen = false
                }
                AuthScreen(
                    onAuthSuccess = {
                        currentUser = Firebase.auth.currentUser
                        showDedicatedAuthScreen = false
                    },
                    onContinueAsGuest = {
                        guestModeAccepted = true
                        showDedicatedAuthScreen = false
                    },
                    initialErrorMessage = authErrorMessage
                )
            }
        } else {
            val userSessionKey = currentUser?.uid ?: "guest_local"
            key(userSessionKey) {
                val viewModel: ItqanViewModel = viewModel(
                    key = userSessionKey,
                    factory = ItqanViewModel.provideFactory(authenticatedUserId = currentUser?.uid)
                )
                ItqanMainShell(
                    viewModel = viewModel,
                    currentUser = currentUser,
                    onSignInWithGoogle = triggerInteractiveGoogleSignIn,
                    onOpenAuthScreen = { showDedicatedAuthScreen = true },
                    onSignOut = triggerSignOut
                )
            }
        }
    }
}

@Composable
fun AuthOrGuestGateScreen(
    isSigningIn: Boolean = false,
    authErrorMessage: String? = null,
    onSignInWithGoogle: () -> Unit = {},
    onContinueAsGuest: () -> Unit
) {
    AuthScreen(
        onAuthSuccess = onSignInWithGoogle,
        onContinueAsGuest = onContinueAsGuest,
        initialErrorMessage = authErrorMessage
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ItqanMainShell(
    viewModel: ItqanViewModel,
    currentUser: FirebaseUser?,
    onSignInWithGoogle: () -> Unit,
    onOpenAuthScreen: () -> Unit = onSignInWithGoogle,
    onSignOut: () -> Unit
) {
    val userPrefs by viewModel.userPrefs.collectAsStateWithLifecycle()
    val selectedSurahNumber by viewModel.selectedSurahNumber.collectAsStateWithLifecycle()
    val currentSurahAyahs by viewModel.currentSurahAyahs.collectAsStateWithLifecycle()
    val allCachedAyahs by viewModel.allCachedAyahs.collectAsStateWithLifecycle()
    val isDownloadingSurah by viewModel.isDownloadingSurah.collectAsStateWithLifecycle()
    val searchQuery by viewModel.searchQuery.collectAsStateWithLifecycle()
    val searchResults by viewModel.searchResults.collectAsStateWithLifecycle()
    val selectedAyahForSheet by viewModel.selectedAyahForSheet.collectAsStateWithLifecycle()
    val playbackState by viewModel.playbackState.collectAsStateWithLifecycle()
    val bookmarks by viewModel.bookmarks.collectAsStateWithLifecycle()
    val lessonProgress by viewModel.lessonProgress.collectAsStateWithLifecycle()
    val fsrsReviews by viewModel.fsrsReviews.collectAsStateWithLifecycle()
    val certificates by viewModel.certificates.collectAsStateWithLifecycle()
    val errorReports by viewModel.errorReports.collectAsStateWithLifecycle()
    val mistakeLogs by viewModel.mistakeLogs.collectAsStateWithLifecycle()
    val khatmahPlans by viewModel.khatmahPlans.collectAsStateWithLifecycle()
    val groupHalqahs by viewModel.groupHalqahs.collectAsStateWithLifecycle()
    val scholarUiState by viewModel.scholarUiState.collectAsStateWithLifecycle()
    val scholarHistory by viewModel.scholarHistory.collectAsStateWithLifecycle()
    val voiceReport by viewModel.voiceReport.collectAsStateWithLifecycle()
    val cloudSyncState by viewModel.cloudSyncState.collectAsStateWithLifecycle()
    val statusBannerMessage by viewModel.statusBannerMessage.collectAsStateWithLifecycle()

    val snackbarHostState = remember { SnackbarHostState() }
    var currentTab by rememberSaveable { mutableStateOf(ItqanNavTab.RAWDAH) }
    var showSettingsModal by rememberSaveable { mutableStateOf(false) }
    var pendingScholarPrompt by rememberSaveable { mutableStateOf<String?>(null) }

    // System back button returns to RAWDAH home tab when on any secondary tab
    BackHandler(enabled = currentTab != ItqanNavTab.RAWDAH) {
        currentTab = ItqanNavTab.RAWDAH
    }

    LaunchedEffect(statusBannerMessage) {
        val msg = statusBannerMessage
        if (!msg.isNullOrBlank()) {
            snackbarHostState.showSnackbar(msg)
            viewModel.clearStatusBanner()
        }
    }

    ItqanTheme(
        themeMode = userPrefs.themeMode,
        fontScale = userPrefs.fontScale
    ) {
        BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
            val isExpandedScreen = maxWidth >= 600.dp

            Scaffold(
                modifier = Modifier.fillMaxSize(),
                contentWindowInsets = WindowInsets.safeDrawing,
                snackbarHost = { SnackbarHost(hostState = snackbarHostState) },
                topBar = {
                    TopAppBar(
                        title = {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Surface(
                                    shape = CircleShape,
                                    color = IlluminatedGold.copy(alpha = 0.18f),
                                    border = BorderStroke(1.dp, IlluminatedGold)
                                ) {
                                    Text(
                                        text = "إتقان",
                                        fontFamily = AmiriFontFamily,
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = IlluminatedGold,
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 2.dp)
                                    )
                                }
                                Column {
                                    Text(
                                        text = currentTab.labelAr,
                                        fontFamily = CairoFontFamily,
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = if (currentUser != null) {
                                            "مزامنة سحابية متصلة (${currentUser.displayName ?: currentUser.email ?: "حساب موثق"})"
                                        } else {
                                            "وضع محلي دون إنترنت (Offline-First)"
                                        },
                                        fontFamily = CairoFontFamily,
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        },
                        actions = {
                            if (currentUser == null) {
                                IconButton(
                                    onClick = onOpenAuthScreen,
                                    modifier = Modifier.testTag("top_bar_auth_button")
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.AccountCircle,
                                        contentDescription = "شاشة تسجيل الدخول (Sign in)",
                                        tint = IlluminatedGold
                                    )
                                }
                            }
                            IconButton(
                                onClick = { showSettingsModal = true },
                                modifier = Modifier.testTag("top_bar_settings_button")
                            ) {
                                Icon(
                                    imageVector = if (currentUser != null) Icons.Default.CloudDone else Icons.Default.Settings,
                                    contentDescription = "الإعدادات والمزامنة السحابية",
                                    tint = IlluminatedGold
                                )
                            }
                        },
                        colors = TopAppBarDefaults.topAppBarColors(
                            containerColor = MaterialTheme.colorScheme.surface
                        )
                    )
                },
                bottomBar = {
                    if (!isExpandedScreen) {
                        NavigationBar(
                            containerColor = MaterialTheme.colorScheme.surface,
                            tonalElevation = 6.dp
                        ) {
                            ItqanNavTab.entries.forEach { tab ->
                                val selected = currentTab == tab
                                NavigationBarItem(
                                    selected = selected,
                                    onClick = { currentTab = tab },
                                    icon = {
                                        Icon(
                                            imageVector = tab.icon,
                                            contentDescription = tab.labelAr
                                        )
                                    },
                                    label = {
                                        Text(
                                            text = tab.labelAr,
                                            fontFamily = CairoFontFamily,
                                            style = MaterialTheme.typography.labelSmall,
                                            fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal
                                        )
                                    },
                                    modifier = Modifier.testTag(tab.testTag)
                                )
                            }
                        }
                    }
                }
            ) { innerPadding ->
                Row(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding)
                ) {
                    if (isExpandedScreen) {
                        NavigationRail(
                            containerColor = MaterialTheme.colorScheme.surface,
                            modifier = Modifier.fillMaxHeight()
                        ) {
                            Spacer(modifier = Modifier.height(12.dp))
                            ItqanNavTab.entries.forEach { tab ->
                                val selected = currentTab == tab
                                NavigationRailItem(
                                    selected = selected,
                                    onClick = { currentTab = tab },
                                    icon = {
                                        Icon(
                                            imageVector = tab.icon,
                                            contentDescription = tab.labelAr
                                        )
                                    },
                                    label = {
                                        Text(
                                            text = tab.labelAr,
                                            fontFamily = CairoFontFamily,
                                            style = MaterialTheme.typography.labelSmall,
                                            fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal
                                        )
                                    },
                                    modifier = Modifier
                                        .padding(vertical = 4.dp)
                                        .testTag("${tab.testTag}_rail")
                                )
                            }
                        }
                        HorizontalDivider(
                            modifier = Modifier
                                .fillMaxHeight()
                                .width(1.dp)
                        )
                    }

                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxHeight()
                    ) {
                        when (currentTab) {
                            ItqanNavTab.RAWDAH -> {
                                HomeRawdahScreen(
                                    userPrefs = userPrefs,
                                    surahCatalog = viewModel.surahCatalog,
                                    fsrsReviews = fsrsReviews,
                                    lessonProgress = lessonProgress,
                                    certificates = certificates,
                                    bookmarks = bookmarks,
                                    dailyBenefits = viewModel.dailyBenefits,
                                    sourceRegistry = viewModel.sourceRegistry,
                                    onNavigateToMushaf = { surahNum ->
                                        viewModel.selectSurah(surahNum)
                                        currentTab = ItqanNavTab.MUSHAF
                                    },
                                    onNavigateToAcademy = {
                                        currentTab = ItqanNavTab.ACADEMY
                                    },
                                    onNavigateToHifz = {
                                        currentTab = ItqanNavTab.HIFZ
                                    },
                                    onNavigateToScholar = { prompt ->
                                        pendingScholarPrompt = prompt
                                        currentTab = ItqanNavTab.AI_SCHOLAR
                                    },
                                    onSubmitErrorReport = { screen, refKey, itemTitle, details ->
                                        viewModel.submitContentErrorReport(screen, refKey, itemTitle, details)
                                    },
                                    khatmahPlans = khatmahPlans,
                                    mistakeLogs = mistakeLogs,
                                    onLogDailyKhatmahWird = { plan ->
                                        viewModel.logDailyKhatmahWirdProgress(plan)
                                    },
                                    onCreateNewKhatmahPlan = { title, type, days ->
                                        viewModel.createKhatmahPlan(title, type, days)
                                    }
                                )
                            }

                            ItqanNavTab.MUSHAF -> {
                                MushafInteractiveScreen(
                                    userPrefs = userPrefs,
                                    surahCatalog = viewModel.surahCatalog,
                                    selectedSurahNumber = selectedSurahNumber,
                                    currentSurahAyahs = currentSurahAyahs,
                                    isDownloadingSurah = isDownloadingSurah,
                                    searchQuery = searchQuery,
                                    searchResults = searchResults,
                                    selectedAyahForSheet = selectedAyahForSheet,
                                    playbackState = playbackState,
                                    reciters = viewModel.reciters,
                                    onSelectSurah = { surahNum -> viewModel.selectSurah(surahNum) },
                                    onDownloadSurah = { surahNum -> viewModel.downloadAndCacheSurah(surahNum) },
                                    onSearchQueryChange = { q -> viewModel.updateSearchQuery(q) },
                                    onTogglePageMode = { isPage -> viewModel.setMushafPageMode(isPage) },
                                    onToggleTajweedColors = { enabled -> viewModel.setShowTajweedColors(enabled) },
                                    onPlayAyah = { ayah -> viewModel.playAyahAudio(ayah) },
                                    onOpenAyahSheet = { ayah -> viewModel.openAyahSciencesSheet(ayah) },
                                    onCloseAyahSheet = { viewModel.closeAyahSciencesSheet() },
                                    onSaveBookmarkNote = { ayah, note -> viewModel.saveBookmarkOrNote(ayah, note) },
                                    onAskScholarAboutAyah = { ayah ->
                                        viewModel.closeAyahSciencesSheet()
                                        pendingScholarPrompt = "اشرح لي أحكام وتفسير الآية ${ayah.ayahNumber} من سورة ${ayah.surahNameAr} بالمصادر المعتمدة"
                                        currentTab = ItqanNavTab.AI_SCHOLAR
                                    },
                                    onTogglePlayPause = { viewModel.audioPlayer.togglePlayPause() },
                                    onStopAudio = { viewModel.audioPlayer.stopPlayback() },
                                    onCycleRepeat = { viewModel.audioPlayer.cycleRepeatTarget() },
                                    onCycleSpeed = { viewModel.audioPlayer.cyclePlaybackSpeed() },
                                    onCycleSilenceGap = { viewModel.audioPlayer.cycleSilenceGap() },
                                    onCycleSleepTimer = { viewModel.audioPlayer.cycleSleepTimer() },
                                    onSelectReciter = { reciter -> viewModel.audioPlayer.selectReciter(reciter) },
                                    onSubmitErrorReport = { screen, refKey, itemTitle, details ->
                                        viewModel.submitContentErrorReport(screen, refKey, itemTitle, details)
                                    }
                                )
                            }

                            ItqanNavTab.ACADEMY -> {
                                AcademyAndMatnScreen(
                                    userPrefs = userPrefs,
                                    lessons = viewModel.academyLessons,
                                    matnVerses = viewModel.matnVerses,
                                    allCachedAyahs = allCachedAyahs,
                                    lessonProgress = lessonProgress,
                                    certificates = certificates,
                                    onSubmitQuizScore = { lesson, score ->
                                        viewModel.submitLessonQuizScore(lesson, score)
                                    },
                                    onSubmitErrorReport = { screen, refKey, itemTitle, details ->
                                        viewModel.submitContentErrorReport(screen, refKey, itemTitle, details)
                                    }
                                )
                            }

                            ItqanNavTab.HIFZ -> {
                                HifzAndTasmeeScreen(
                                    userPrefs = userPrefs,
                                    surahCatalog = viewModel.surahCatalog,
                                    allCachedAyahs = allCachedAyahs,
                                    fsrsReviews = fsrsReviews,
                                    voiceReport = voiceReport,
                                    onGradeFsrsReview = { review, grade ->
                                        viewModel.gradeFsrsReview(review, grade)
                                    },
                                    onAddHifzPlan = { surah, start, end, reps ->
                                        viewModel.addCustomHifzPlan(surah, start, end, reps)
                                    },
                                    onEvaluateVoiceRecitation = { ayah, spoken ->
                                        viewModel.evaluateVoiceRecitation(ayah, spoken)
                                    },
                                    onClearVoiceReport = {
                                        viewModel.clearVoiceReport()
                                    },
                                    onPlayReferenceAyahAudio = { ayah ->
                                        viewModel.playAyahAudio(ayah)
                                    },
                                    mistakeLogs = mistakeLogs,
                                    groupHalqahs = groupHalqahs,
                                    onRecordRecitationMistake = { surahNum, surahName, ayahNum, wordIdx, expectedW, spokenW, tajweedH ->
                                        viewModel.recordRecitationMistake(
                                            surahNum,
                                            surahName,
                                            ayahNum,
                                            wordIdx,
                                            expectedW,
                                            spokenW,
                                            tajweedH
                                        )
                                    },
                                    onToggleMistakeResolved = { mistakeId, resolved ->
                                        viewModel.toggleMistakeResolved(mistakeId, resolved)
                                    },
                                    onJoinOrCompleteGroupHalqahWird = { halqahId ->
                                        viewModel.joinOrCompleteGroupHalqahWird(halqahId)
                                    }
                                )
                            }

                            ItqanNavTab.AI_SCHOLAR -> {
                                AiScholarScreen(
                                    userPrefs = userPrefs,
                                    scholarUiState = scholarUiState,
                                    scholarHistory = scholarHistory,
                                    initialPrompt = pendingScholarPrompt,
                                    onConsumeInitialPrompt = { pendingScholarPrompt = null },
                                    onAskQuestion = { q -> viewModel.askAiScholar(q) },
                                    onSubmitErrorReport = { screen, refKey, itemTitle, details ->
                                        viewModel.submitContentErrorReport(screen, refKey, itemTitle, details)
                                    }
                                )
                            }
                        }
                    }
                }
            }
        }

        if (showSettingsModal) {
            ItqanSettingsModalDialog(
                userPrefs = userPrefs,
                cloudSyncState = cloudSyncState,
                errorReports = errorReports,
                isAuthenticated = currentUser != null,
                userEmailOrId = currentUser?.email ?: currentUser?.displayName ?: currentUser?.uid,
                onSelectThemeMode = { mode -> viewModel.setThemeMode(mode) },
                onChangeFontScale = { scale -> viewModel.setFontScale(scale) },
                onToggleEasternDigits = { enabled -> viewModel.setUseEasternDigits(enabled) },
                onUpdateStudentName = { name -> viewModel.setStudentName(name) },
                onUpdateAiModel = { model -> viewModel.setRemoteConfigAiModel(model) },
                onTriggerGoogleSignIn = onSignInWithGoogle,
                onSignOut = onSignOut,
                onDismiss = { showSettingsModal = false }
            )
        }
    }
}
