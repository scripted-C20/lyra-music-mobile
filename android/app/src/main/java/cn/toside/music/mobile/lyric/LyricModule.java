package cn.toside.music.mobile.lyric;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;

public class LyricModule extends ReactContextBaseJavaModule implements LifecycleEventListener {
  private final ReactApplicationContext reactContext;
  Lyric lyric;
  Lyric statusBarLyric;
  FlymeStatusBarLyric flymeStatusBarLyric;
  // final Map<String, Object> constants = new HashMap<>();

  boolean isShowTranslation = false;
  boolean isShowRoma = false;
  float playbackRate = 1;
  boolean isAppInForeground = true;

  private int listenerCount = 0;

  private Lyric getLyric() {
    if (lyric == null) {
      lyric = new Lyric(reactContext, isShowTranslation, isShowRoma, playbackRate, "desktop");
      lyric.setAppInForeground(isAppInForeground);
    }
    return lyric;
  }

  private Lyric getStatusBarLyric() {
    if (statusBarLyric == null) statusBarLyric = new Lyric(reactContext, isShowTranslation, isShowRoma, playbackRate, "statusBar");
    return statusBarLyric;
  }

  private FlymeStatusBarLyric getFlymeStatusBarLyric() {
    if (flymeStatusBarLyric == null) flymeStatusBarLyric = new FlymeStatusBarLyric(reactContext);
    return flymeStatusBarLyric;
  }

  LyricModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
    reactContext.addLifecycleEventListener(this);

    // constants.put("THEME_GREEN", "#07c556");
    // constants.put("THEME_YELLOW", "#fffa12");
    // constants.put("THEME_BLUE", "#19b5fe");
    // constants.put("THEME_RED", "#ff1222");
    // constants.put("THEME_PINK", "#f1828d");
    // constants.put("THEME_PURPLE", "#c851d4");
    // constants.put("THEME_ORANGE", "#fffa12");
    // constants.put("THEME_GREY", "#bdc3c7");
  }

  @Override
  public String getName() {
    return "LyricModule";
  }

//  @Override
//  public Map<String, Object> getConstants() {
//    return constants;
//  }

  @ReactMethod
  public void addListener(String eventName) {
    if (listenerCount == 0) {
      // Set up any upstream listeners or background tasks as necessary
    }

    listenerCount += 1;
  }

  @ReactMethod
  public void removeListeners(Integer count) {
    listenerCount -= count;
    if (listenerCount == 0) {
      // Remove upstream listeners, stop unnecessary background tasks
    }
  }

  @ReactMethod
  public void showDesktopLyric(ReadableMap data, Promise promise) {
    getLyric().showDesktopLyric(Arguments.toBundle(data), promise);
    if (statusBarLyric != null) statusBarLyric.bringToFront(0);
  }

  @ReactMethod
  public void showStatusBarLyric(ReadableMap data, Promise promise) {
    Lyric lyric = getStatusBarLyric();
    FlymeStatusBarLyric flymeLyric = getFlymeStatusBarLyric();
    if (flymeLyric.isSupported()) {
      lyric.setCurrentLyricHandler(flymeLyric::setLyric);
      flymeLyric.show();
      lyric.showNativeStatusBarLyric(promise);
    } else {
      lyric.setCurrentLyricHandler(null);
      lyric.showDesktopLyric(Arguments.toBundle(data), promise);
      lyric.bringToFront(0);
    }
  }

  @ReactMethod
  public void isFlymeStatusBarLyricSupported(Promise promise) {
    promise.resolve(getFlymeStatusBarLyric().isSupported());
  }

  @ReactMethod
  public void hideDesktopLyric(Promise promise) {
    if (lyric != null) lyric.hideDesktopLyric();
    promise.resolve(null);
  }

  @ReactMethod
  public void hideStatusBarLyric(Promise promise) {
    if (statusBarLyric != null) statusBarLyric.hideDesktopLyric();
    if (flymeStatusBarLyric != null) flymeStatusBarLyric.hide();
    promise.resolve(null);
  }

  @ReactMethod
  public void setSendLyricTextEvent(boolean isSend, Promise promise) {
    getLyric().setSendLyricTextEvent(isSend);
    promise.resolve(null);
  }


  @ReactMethod
  public void setLyric(String lyric, String translation, String romaLyric, Promise promise) {
    // Log.d("Lyric", "set lyric: " + lyric);
    // Log.d("Lyric", "set lyric translation: " + translation);
    if (this.lyric != null) this.lyric.setLyric(lyric, translation, romaLyric);
    if (statusBarLyric != null) statusBarLyric.setLyric(lyric, translation, romaLyric);
    promise.resolve(null);
  }

  @ReactMethod
  public void setPlaybackRate(float playbackRate, Promise promise) {
    this.playbackRate = playbackRate;
    if (lyric != null) lyric.setPlaybackRate(playbackRate);
    if (statusBarLyric != null) statusBarLyric.setPlaybackRate(playbackRate);
    promise.resolve(null);
  }

  @ReactMethod
  public void toggleTranslation(boolean isShowTranslation, Promise promise) {
    this.isShowTranslation = isShowTranslation;
    if (lyric != null) lyric.toggleTranslation(isShowTranslation);
    if (statusBarLyric != null) statusBarLyric.toggleTranslation(isShowTranslation);
    promise.resolve(null);
  }

  @ReactMethod
  public void toggleRoma(boolean isShowRoma, Promise promise) {
    this.isShowRoma = isShowRoma;
    if (lyric != null) lyric.toggleRoma(isShowRoma);
    if (statusBarLyric != null) statusBarLyric.toggleRoma(isShowRoma);
    promise.resolve(null);
  }

  @ReactMethod
  public void play(int time, Promise promise) {
    Log.d("Lyric", "play lyric: " + time);
    if (lyric != null) lyric.play(time);
    if (statusBarLyric != null) statusBarLyric.play(time);
    if (flymeStatusBarLyric != null) flymeStatusBarLyric.setPlaying(true);
    promise.resolve(null);
  }

  @ReactMethod
  public void pause(Promise promise) {
    Log.d("Lyric", "play pause");
    if (lyric != null) lyric.pauseLyric();
    if (statusBarLyric != null) statusBarLyric.pauseLyric();
    if (flymeStatusBarLyric != null) flymeStatusBarLyric.setPlaying(false);
    promise.resolve(null);
  }

  @ReactMethod
  public void toggleLock(boolean isLock, Promise promise) {
    if (lyric != null) {
      if (isLock) {
        lyric.lockLyric();
      } else {
        lyric.unlockLyric();
      }
    }
    promise.resolve(null);
  }

  @ReactMethod
  public void setColor(String unplayColor, String playedColor, String shadowColor, Promise promise) {
    if (lyric != null) lyric.setPlayedColor(unplayColor, playedColor, shadowColor);
    promise.resolve(null);
  }

  @ReactMethod
  public void setStatusBarColor(String unplayColor, String playedColor, String shadowColor, Promise promise) {
    if (statusBarLyric != null) statusBarLyric.setPlayedColor(unplayColor, playedColor, shadowColor);
    promise.resolve(null);
  }

  @ReactMethod
  public void setBackgroundColor(String backgroundColor, Promise promise) {
    if (lyric != null) lyric.setBackgroundColor(backgroundColor);
    promise.resolve(null);
  }

  @ReactMethod
  public void setStatusBarBackgroundColor(String backgroundColor, Promise promise) {
    if (statusBarLyric != null) statusBarLyric.setBackgroundColor(backgroundColor);
    promise.resolve(null);
  }

  @ReactMethod
  public void setStatusBarMode(boolean isStatusBarMode, Promise promise) {
    if (lyric != null) lyric.setStatusBarMode(isStatusBarMode);
    promise.resolve(null);
  }

  @ReactMethod
  public void setAlpha(float alpha, Promise promise) {
    if (lyric != null) lyric.setAlpha(alpha);
    promise.resolve(null);
  }

  @ReactMethod
  public void setStatusBarAlpha(float alpha, Promise promise) {
    if (statusBarLyric != null) statusBarLyric.setAlpha(alpha);
    promise.resolve(null);
  }

  @ReactMethod
  public void setTextSize(float size, Promise promise) {
    if (lyric != null) lyric.setTextSize(size);
    promise.resolve(null);
  }

  @ReactMethod
  public void setStatusBarTextSize(float size, Promise promise) {
    if (statusBarLyric != null) statusBarLyric.setTextSize(size);
    promise.resolve(null);
  }

  @ReactMethod
  public void setMaxLineNum(int maxLineNum, Promise promise) {
    if (lyric != null) lyric.setMaxLineNum(maxLineNum);
    promise.resolve(null);
  }

  @ReactMethod
  public void setStatusBarMaxLineNum(int maxLineNum, Promise promise) {
    if (statusBarLyric != null) statusBarLyric.setMaxLineNum(maxLineNum);
    promise.resolve(null);
  }

  @ReactMethod
  public void setSingleLine(boolean singleLine, Promise promise) {
    if (lyric != null) lyric.setSingleLine(singleLine);
    promise.resolve(null);
  }

  @ReactMethod
  public void setStatusBarSingleLine(boolean singleLine, Promise promise) {
    if (statusBarLyric != null) statusBarLyric.setSingleLine(singleLine);
    promise.resolve(null);
  }

  @ReactMethod
  public void setShowToggleAnima(boolean showToggleAnima, Promise promise) {
    if (lyric != null) lyric.setShowToggleAnima(showToggleAnima);
    promise.resolve(null);
  }

  @ReactMethod
  public void setStatusBarShowToggleAnima(boolean showToggleAnima, Promise promise) {
    if (statusBarLyric != null) statusBarLyric.setShowToggleAnima(showToggleAnima);
    promise.resolve(null);
  }

  @ReactMethod
  public void setWidth(int width, Promise promise) {
    if (lyric != null) lyric.setWidth(width);
    promise.resolve(null);
  }

  @ReactMethod
  public void setStatusBarWidth(int width, Promise promise) {
    if (statusBarLyric != null) statusBarLyric.setWidth(width);
    promise.resolve(null);
  }

  @ReactMethod
  public void setPosition(double x, double y, Promise promise) {
    if (lyric != null) lyric.setPosition((float) x, (float) y);
    promise.resolve(null);
  }

  @ReactMethod
  public void setStatusBarPosition(double x, double y, Promise promise) {
    if (statusBarLyric != null) {
      statusBarLyric.setPosition((float) x, (float) y);
      statusBarLyric.bringToFront(500);
    }
    promise.resolve(null);
  }

  @ReactMethod
  public void setLyricTextPosition(String positionX, String positionY, Promise promise) {
    if (lyric != null) lyric.setLyricTextPosition(positionX, positionY);
    promise.resolve(null);
  }

  @ReactMethod
  public void setStatusBarLyricTextPosition(String positionX, String positionY, Promise promise) {
    if (statusBarLyric != null) statusBarLyric.setLyricTextPosition(positionX, positionY);
    promise.resolve(null);
  }

  @ReactMethod
  public void checkOverlayPermission(Promise promise) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(reactContext)) {
      promise.reject(new Exception("Permission denied"));
    }
    promise.resolve(null);
  }

  @ReactMethod
  public void openOverlayPermissionActivity(Promise promise) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(reactContext)) {
      Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + reactContext.getApplicationContext().getPackageName()));
      reactContext.startActivityForResult(intent, 1, null);
    }
    promise.resolve(null);
  }

  @Override
  public void onHostResume() {
    isAppInForeground = true;
    if (lyric != null) lyric.setAppInForeground(true);
  }

  @Override
  public void onHostPause() {
    isAppInForeground = false;
    if (lyric != null) lyric.setAppInForeground(false);
  }

  @Override
  public void onHostDestroy() {
    isAppInForeground = false;
    if (lyric != null) lyric.setAppInForeground(false);
  }

}
