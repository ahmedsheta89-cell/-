package com.example.data.notifications

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.example.MainActivity
import com.example.R

object SmartWirdNotificationHelper {

    private const val CHANNEL_ID = "itqan_smart_wird_channel"
    private const val NOTIFICATION_ID_WIRD = 4101

    fun ensureChannelCreated(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "تذكير الورد القرآني والمراجعة الذكية (إتقان)",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "إشعارات ذكية لتذكيرك بموعد الورد اليومي والآيات المستحقة للمراجعة في خوارزمية FSRS"
            }
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            manager?.createNotificationChannel(channel)
        }
    }

    fun sendSmartWirdReminder(
        context: Context,
        khatmahTitle: String,
        dueReviewsCount: Int,
        recurringMistakesCount: Int
    ): Boolean {
        ensureChannelCreated(context)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val granted = ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
            if (!granted) return false
        }

        return runCatching {
            val launchIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            }
            val pendingIntent = PendingIntent.getActivity(
                context,
                0,
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val contentText = buildString {
                append("حان موعد وردك في «$khatmahTitle». ")
                if (dueReviewsCount > 0) {
                    append("لديك $dueReviewsCount أوراد مستحقة للمراجعة (FSRS)")
                }
                if (recurringMistakesCount > 0) {
                    append(" و$recurringMistakesCount مواضع في سجل الأخطاء المتكررة.")
                }
            }

            val notification = NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle("إتقان • تذكير الورد القرآني والمراجعة الذكية")
                .setContentText(contentText)
                .setStyle(NotificationCompat.BigTextStyle().bigText(contentText))
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true)
                .build()

            NotificationManagerCompat.from(context).notify(NOTIFICATION_ID_WIRD, notification)
            true
        }.getOrDefault(false)
    }
}
