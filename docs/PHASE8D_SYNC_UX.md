# PHASE 8D — OFFLINE-FIRST & SYNCHRONIZATION UX SPECIFICATION

## 1. User-Facing Sync States

The UI integrates seamlessly with Phase 8C (`SyncCoordinator`), translating complex distributed state machine conditions into calm, reassuring Arabic language:

| Technical State | Arabic Display Copy | Icon / Visual Indicator | Description |
| :--- | :--- | :--- | :--- |
| `ONLINE & SYNCED` | **تمت المزامنة** | CheckCircle2 (Emerald) | جميع البيانات محدثة ومحفوظة سحابيًا ومحليًا |
| `SYNCING` | **جاري المزامنة...** | RefreshCw (Spinning Emerald) | يتم إرسال التغييرات أو استقبال التحديثات |
| `OFFLINE` | **الوضع غير المتصل (محفوظ محليًا)** | WifiOff (Stone) | التطبيق يعمل بكامل كفاءته من ذاكرة الجهاز (IndexedDB) |
| `PENDING_CHANGES` | **{n} تغييرات بانتظار الاتصال** | CloudUpload (Amber) | سيتولى النظام المزامنة التلقائية فور عودة الاتصال |
| `CONFLICT_DETECTED` | **يوجد تعارض يحتاج مراجعتك** | AlertTriangle (Red/Amber) | تم رصد تعارض في التلاوة بين أجهزة متعددة |
| `AUTH_REQUIRED` | **يتطلب تسجيل الدخول للمزامنة** | Lock (Stone) | البيانات محفوظة محليًا كطالب غير مسجل |

---

## 2. Cryptographic Privacy Rule
- **No Hashes or Signatures in Primary UI**: The student sees dates, surahs, ayat, and status. Cryptographic SHA-256 hashes (`payloadHash`, `eventHash`) remain in underlying inspection drawers for audits and debugging, never cluttering primary student views.
- **Zero Raw Audio**: The student is assured that no raw audio files leave their browser.

---

## 3. Conflict Resolution UI Contract
When a conflict occurs:
1. The student or teacher is presented with a non-destructive dialog.
2. Shows:
   - تاريخ وتفاصيل التسجيل المحلي (Local Record)
   - تاريخ وتفاصيل التسجيل الوارد من الجهاز الآخر (Remote Record)
3. Three clear, human-driven choices:
   - **اعتماد التلاوة المحلية (LOCAL_WINS)**
   - **اعتماد التلاوة الأخرى (REMOTE_WINS)**
   - **فصل السجلين للمراجعة اليدوية (MANUAL_SPLIT)**
4. No automatic AI choice is ever made.
