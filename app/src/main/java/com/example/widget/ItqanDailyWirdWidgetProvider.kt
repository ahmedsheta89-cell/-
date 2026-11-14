package com.example.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import com.example.MainActivity
import com.example.R

class ItqanDailyWirdWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (widgetId in appWidgetIds) {
            updateWidgetInstance(
                context = context,
                appWidgetManager = appWidgetManager,
                appWidgetId = widgetId,
                ayahSnippet = "﴿ أَوْ زِدْ عَلَيْهِ وَرَتِّلِ ٱلْقُرْءَانَ تَرْتِيلًا ﴾",
                statusLine = "الختمة الشهرية • الورد: ٢٠ صفحة • مواظبة ٧ أيام"
            )
        }
    }

    companion object {
        fun refreshAllWidgets(
            context: Context,
            ayahSnippet: String,
            statusLine: String
        ) {
            runCatching {
                val manager = AppWidgetManager.getInstance(context)
                val ids = manager.getAppWidgetIds(
                    ComponentName(context, ItqanDailyWirdWidgetProvider::class.java)
                )
                for (id in ids) {
                    updateWidgetInstance(context, manager, id, ayahSnippet, statusLine)
                }
            }
        }

        private fun updateWidgetInstance(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int,
            ayahSnippet: String,
            statusLine: String
        ) {
            val views = RemoteViews(context.packageName, R.layout.widget_daily_wird)
            views.setTextViewText(R.id.widget_ayah_text, ayahSnippet)
            views.setTextViewText(R.id.widget_wird_status, statusLine)

            val launchIntent = Intent(context, MainActivity::class.java)
            val pendingIntent = PendingIntent.getActivity(
                context,
                0,
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_root_container, pendingIntent)
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
