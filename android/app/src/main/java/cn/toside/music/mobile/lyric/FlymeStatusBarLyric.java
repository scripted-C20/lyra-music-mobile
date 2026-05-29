package cn.toside.music.mobile.lyric;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import java.lang.reflect.Field;
import java.util.ArrayList;

import cn.toside.music.mobile.R;

public class FlymeStatusBarLyric {
  private static final String TAG = "FlymeStatusBarLyric";
  private static final String CHANNEL_ID = "flyme_status_bar_lyric";
  private static final int NOTIFICATION_ID = 0x4c584c;

  private final Context context;
  private final NotificationManager notificationManager;
  private Integer flagShowTicker = null;
  private Integer flagUpdateTicker = null;
  private boolean enabled = false;
  private boolean supportedChecked = false;
  private boolean supported = false;
  private boolean playing = false;
  private String lastLyric = "";

  public FlymeStatusBarLyric(Context context) {
    this.context = context.getApplicationContext();
    notificationManager = (NotificationManager) this.context.getSystemService(Context.NOTIFICATION_SERVICE);
  }

  public boolean isSupported() {
    if (supportedChecked) return supported;
    supportedChecked = true;
    try {
      Class<?> notificationClass = Class.forName("android.app.Notification");
      flagShowTicker = (Integer) getFieldStepwise(notificationClass, notificationClass, "FLAG_ALWAYS_SHOW_TICKER");
      flagUpdateTicker = (Integer) getFieldStepwise(notificationClass, notificationClass, "FLAG_ONLY_UPDATE_TICKER");
      supported = flagShowTicker != null && flagShowTicker > 0 && flagUpdateTicker != null && flagUpdateTicker > 0;
    } catch (Throwable e) {
      supported = false;
      Log.d(TAG, "Flyme ticker flags unavailable: " + e.getMessage());
    }
    return supported;
  }

  public void show() {
    enabled = true;
    update(lastLyric, playing);
  }

  public void hide() {
    enabled = false;
    lastLyric = "";
    if (notificationManager == null) return;
    try {
      notificationManager.cancel(NOTIFICATION_ID);
    } catch (Exception e) {
      Log.e(TAG, "cancel failed: " + e.getMessage());
    }
  }

  public void setPlaying(boolean isPlaying) {
    playing = isPlaying;
    if (enabled) update(lastLyric, playing);
  }

  public void setLyric(String lyric, ArrayList<String> extendedLyrics) {
    String text = lyric == null ? "" : lyric.trim();
    if (text.length() == 0 && extendedLyrics != null && !extendedLyrics.isEmpty()) {
      text = extendedLyrics.get(0) == null ? "" : extendedLyrics.get(0).trim();
    }
    lastLyric = text;
    if (enabled) update(text, playing);
  }

  private void update(String lyric, boolean isPlaying) {
    if (!enabled || notificationManager == null || !isSupported()) return;
    if (lyric == null || lyric.trim().length() == 0) {
      hide();
      enabled = true;
      return;
    }

    createNotificationChannel();

    NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(R.mipmap.ic_launcher)
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setSilent(true)
      .setShowWhen(false)
      .setContentTitle(context.getString(R.string.app_name))
      .setContentText(lyric)
      .setTicker(lyric);

    Notification notification = builder.build();
    notification.flags |= Notification.FLAG_NO_CLEAR;
    notification.flags |= flagShowTicker;
    notification.flags |= flagUpdateTicker;
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT && notification.extras != null) {
      // Flyme supports a ticker-side icon, but the expected Lyra style is lyric-first.
      notification.extras.putBoolean("ticker_icon_switch", false);
      notification.extras.putInt("ticker_icon", R.mipmap.ic_launcher);
    }

    notificationManager.notify(NOTIFICATION_ID, notification);
  }

  private void createNotificationChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O || notificationManager == null) return;
    NotificationChannel channel = new NotificationChannel(
      CHANNEL_ID,
      "Status bar lyric",
      NotificationManager.IMPORTANCE_LOW
    );
    channel.setSound(null, null);
    channel.enableVibration(false);
    channel.setShowBadge(false);
    notificationManager.createNotificationChannel(channel);
  }

  private static Object getFieldStepwise(Class<?> targetClass, Object targetObject, String fieldName) throws NoSuchFieldException {
    Class<?> currentClass = targetClass;
    while (currentClass != null) {
      try {
        Field field = currentClass.getDeclaredField(fieldName);
        field.setAccessible(true);
        return field.get(targetObject);
      } catch (NoSuchFieldException ignore) {
        currentClass = currentClass.getSuperclass();
      } catch (Exception e) {
        throw new NoSuchFieldException(fieldName);
      }
    }
    throw new NoSuchFieldException(fieldName);
  }
}
