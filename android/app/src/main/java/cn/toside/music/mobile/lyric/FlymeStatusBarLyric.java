package cn.toside.music.mobile.lyric;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;
import android.os.Bundle;
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
  private boolean flymeDevice = false;
  private boolean playing = false;
  private String lastLyric = "";

  public FlymeStatusBarLyric(Context context) {
    this.context = context.getApplicationContext();
    notificationManager = (NotificationManager) this.context.getSystemService(Context.NOTIFICATION_SERVICE);
  }

  public boolean isSupported() {
    if (supportedChecked) return supported;
    supportedChecked = true;
    flymeDevice = isFlymeDevice();
    try {
      Class<?> notificationClass = Class.forName("android.app.Notification");
      flagShowTicker = (Integer) getFieldStepwise(notificationClass, notificationClass, "FLAG_ALWAYS_SHOW_TICKER");
      flagUpdateTicker = (Integer) getFieldStepwise(notificationClass, notificationClass, "FLAG_ONLY_UPDATE_TICKER");
      supported = hasFlymeTickerFlags();
    } catch (Throwable e) {
      supported = false;
      Log.d(TAG, "Flyme ticker flags unavailable: " + e.getMessage());
    }

    // Some Flyme builds do not expose the private ticker constants through reflection,
    // but still accept the extra bundle keys below. Mark real Meizu/Flyme devices as
    // supported so we try the native status-bar route before falling back to overlay.
    if (!supported && flymeDevice) supported = true;
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
    if (text.length() == 0 && lastLyric.length() > 0) {
      if (enabled) update(lastLyric, playing);
      return;
    }
    lastLyric = text;
    if (enabled) update(text, playing);
  }

  private void update(String lyric, boolean isPlaying) {
    if (!enabled || notificationManager == null || !isSupported()) return;
    if (lyric == null || lyric.trim().length() == 0) {
      return;
    }

    createNotificationChannel();

    NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(R.drawable.ic_stat_lyric_transparent)
      .setPriority(NotificationCompat.PRIORITY_MIN)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setSilent(true)
      .setShowWhen(false)
      .setContentTitle(context.getString(R.string.app_name))
      .setContentText(lyric)
      .setTicker(lyric);

    Notification notification = builder.build();
    notification.flags |= Notification.FLAG_NO_CLEAR;
    if (flagShowTicker != null && flagShowTicker > 0) notification.flags |= flagShowTicker;
    if (flagUpdateTicker != null && flagUpdateTicker > 0) notification.flags |= flagUpdateTicker;
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT && notification.extras != null) {
      setFlymeTickerExtras(notification.extras, lyric, isPlaying);
    }

    try {
      notificationManager.notify(NOTIFICATION_ID, notification);
    } catch (Throwable e) {
      Log.e(TAG, "notify failed: " + e.getMessage());
    }
  }

  private boolean hasFlymeTickerFlags() {
    return flagShowTicker != null && flagShowTicker > 0 && flagUpdateTicker != null && flagUpdateTicker > 0;
  }

  private void setFlymeTickerExtras(Bundle extras, String lyric, boolean isPlaying) {
    // Flyme status-bar lyric is a private ticker extension. These keys keep the
    // status-bar area lyric-first instead of showing the app icon beside text.
    extras.putBoolean("ticker_icon_switch", false);
    extras.putInt("ticker_icon", R.drawable.ic_stat_lyric_transparent);
    extras.putInt("ticker_icon_id", R.drawable.ic_stat_lyric_transparent);
    extras.putString("ticker_text", lyric);
    extras.putString("ticker_title", lyric);
    extras.putString("flyme.ticker.text", lyric);
    extras.putBoolean("flyme.ticker.icon_switch", false);
    extras.putBoolean("flyme.statusbar.lyric", true);
    extras.putBoolean("flyme_status_bar_lyric", true);
    extras.putBoolean("is_music", true);
    // Flyme may hide ticker lyrics when this flag is false. Keep the lyric ticker
    // visible while pause state is still handled by the standard media notification.
    extras.putBoolean("is_playing", true);
  }

  private void createNotificationChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O || notificationManager == null) return;
    NotificationChannel channel = new NotificationChannel(
      CHANNEL_ID,
      "Status bar lyric",
      NotificationManager.IMPORTANCE_MIN
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

  private static boolean isFlymeDevice() {
    String manufacturer = safeLower(Build.MANUFACTURER);
    String brand = safeLower(Build.BRAND);
    String display = safeLower(Build.DISPLAY);
    String product = safeLower(Build.PRODUCT);
    String model = safeLower(Build.MODEL);
    return manufacturer.contains("meizu") ||
      brand.contains("meizu") ||
      product.contains("meizu") ||
      model.contains("meizu") ||
      display.contains("flyme") ||
      !getSystemProperty("ro.flyme.published").isEmpty() ||
      safeLower(getSystemProperty("ro.build.display.id")).contains("flyme") ||
      safeLower(getSystemProperty("ro.meizu.product.model")).contains("meizu");
  }

  private static String safeLower(String value) {
    return value == null ? "" : value.toLowerCase();
  }

  private static String getSystemProperty(String key) {
    try {
      Class<?> systemProperties = Class.forName("android.os.SystemProperties");
      Object value = systemProperties.getMethod("get", String.class).invoke(null, key);
      return value == null ? "" : value.toString();
    } catch (Throwable e) {
      return "";
    }
  }
}
