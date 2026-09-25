# PHASE 8D — STUDENT PROGRESS UX DESIGN & ARCHITECTURE

## 1. Visual Hierarchy & Philosophy

The student progress experience is built around serenity, clarity, and deep reverence for the Book of Allah:
1. **Student Context**: Quiet greeting, student identity mode (anonymous local vs authenticated synced).
2. **Today's Focus**: Current surah/ayah under memorization, direct resume button.
3. **Daily Revision Queue**: Clear breakdown of what requires attention today, sorted by deterministic urgency.
4. **Focal Points & Weaknesses**: Tender, pedagogical highlight of recurrent slips, devoid of punitive or derogatory labeling.
5. **Surah & Ayah Progress Explorer**: Comprehensive exploration across all 114 Surahs with verified Uthmani script and real metrics.
6. **Session History**: Clear trace of recitations, attempts, and confirmed improvements.

---

## 2. Design System Tokens (Tailwind CSS)

- **Primary Spiritual Green**: `emerald-900` (#064e3b), `emerald-800`, `emerald-700`
- **Soft Backgrounds**: `stone-50` (#fafaf9), `stone-100` (#f5f5f4)
- **Borders & Dividers**: `stone-200` (#e7e5e4), `stone-300`
- **Quiet Text Hierarchy**:
  - Title/Headers: `stone-900`
  - Body: `stone-700`
  - Secondary/Metadata: `stone-500`
  - Tertiary/Micro-labels: `stone-400`
- **Zero-Pill Discipline**: Metadata is separated with subtle `·` glyphs, never loud rounded pills.
- **Arabic Typography**: Traditional Naskh / Amiri / Amiri Quran font families, with fallback to system Arabic sans-serif.

---

## 3. Screen Structure

### A. Home Dashboard (`TodayView`)
- Top Bar: Student Identity & Sync Badge with live status.
- Greeting Banner: «السلام عليكم ورحمة الله وبركاته - مرحبًا بك في تعاهد القرآن الكريم».
- Quick Stats Matrix:
  - آيات متقنة جدولياً (Consolidated)
  - آيات قيد الحفظ (Learning)
  - مراجعة مستحقة (Review Due)
  - إجمالي المواضع (Total Tracked)
- Today's Action Card: Direct continuation of active passage.
- Revision Queue Preview: Grouped by urgency with one-click launch.
- Weakness Focal List: Recurrent places needing revision.

### B. Memorization Explorer (`MemorizationView`)
- Juz / Surah Selector (Surah 1 to 114).
- Surah Progress Header: Revelation type (Meccan/Medinan), total ayahs, completion ratio.
- Ayah Grid & List: Interactive view of each ayah with current state and accuracy.
- Ayah Detail Drawer / Modal: Shows verified Uthmani text, state history, attempt clusters, and teacher recommendations.

### C. Revision Scheduler (`RevisionScheduleView`)
- 5 Urgency tabs: Critical (أولوية قصوى), Overdue (متأخرة), Due Today (مستحقة اليوم), Upcoming (قادمة), Stable (مستقرة).
- Batch Review Starter: Launch recitation session focused directly on selected queue.

### D. Analytics & Longitudinal Progress (`AnalyticsView`)
- Surah Coverage Map.
- Accuracy trajectory (cumulative vs recent).
- Recurrent mistake distribution across Tajweed categories without pseudoscientific retention claims.
