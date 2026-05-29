package cn.toside.music.mobile.userApi;

import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.util.Log;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import java.util.HashMap;
import java.util.Map;
import java.lang.Thread;

public class UserApiModule extends ReactContextBaseJavaModule {
  private static final String MAIN_SESSION_ID = "__main__";
  private JavaScriptThread javaScriptThread;
  private final Map<String, JavaScriptThread> sessionThreads = new HashMap<>();
  private final ReactApplicationContext reactContext;
  private UtilsEvent utilsEvent;

  private int listenerCount = 0;

  UserApiModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.javaScriptThread = null;
    this.utilsEvent = null;
    this.reactContext = reactContext;
  }

  @Override
  public String getName() {
    return "UserApiModule";
  }

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

  private JavaScriptThread createJavaScriptThread(String sessionId, ReadableMap data) {
    if (this.utilsEvent == null) this.utilsEvent = new UtilsEvent(this.reactContext);
    Bundle info = Arguments.toBundle(data);
    final JavaScriptThread targetThread = new JavaScriptThread(this.reactContext, info);
    targetThread.prepareHandler(new JsHandler(this.reactContext.getMainLooper(), this.utilsEvent, sessionId));
    targetThread.getHandler().sendEmptyMessage(HandlerWhat.INIT);
    targetThread.setUncaughtExceptionHandler((thread, ex) -> {
      Handler jsHandler = targetThread.getHandler();
      if (jsHandler == null) return;
      Message message = jsHandler.obtainMessage();
      message.what = HandlerWhat.LOG;
      message.obj = new Object[]{"error", "Uncaught exception in JavaScriptThread: " + ex.getMessage()};
      jsHandler.sendMessage(message);
      Log.e("JavaScriptThread", "Uncaught exception in JavaScriptThread: " + ex.getMessage());
    });
    Log.d("UserApi", "Module Thread id: " + Thread.currentThread().getId());
    return targetThread;
  }

  private boolean sendThreadAction(JavaScriptThread targetThread, String action, String info) {
    if (targetThread == null) return false;
    Handler jsHandler = targetThread.getHandler();
    if (jsHandler == null) return false;
    Message message = jsHandler.obtainMessage();
    message.what = HandlerWhat.ACTION;
    message.obj = new Object[]{action, info};
    jsHandler.sendMessage(message);
    return true;
  }

  private void destroyJavaScriptThread(JavaScriptThread targetThread) {
    if (targetThread == null) return;
    Handler targetHandler = targetThread.getHandler();
    if (targetHandler != null) targetHandler.sendEmptyMessage(HandlerWhat.DESTROY);
    targetThread.stopThread();
  }

  @ReactMethod
  public void loadScript(ReadableMap data) {
    if (this.javaScriptThread != null) destroy();
    this.javaScriptThread = createJavaScriptThread(MAIN_SESSION_ID, data);
  }

  @ReactMethod
  public void loadScriptSession(String sessionId, ReadableMap data) {
    if (sessionId == null || sessionId.isEmpty()) return;
    JavaScriptThread currentThread = this.sessionThreads.remove(sessionId);
    if (currentThread != null) destroyJavaScriptThread(currentThread);
    this.sessionThreads.put(sessionId, createJavaScriptThread(sessionId, data));
  }

  @ReactMethod
  public boolean sendAction(String action, String info) {
    return sendThreadAction(this.javaScriptThread, action, info);
  }

  @ReactMethod
  public boolean sendSessionAction(String sessionId, String action, String info) {
    if (sessionId == null || sessionId.isEmpty()) return false;
    return sendThreadAction(this.sessionThreads.get(sessionId), action, info);
  }

  @ReactMethod
  public void destroySession(String sessionId) {
    if (sessionId == null || sessionId.isEmpty()) return;
    JavaScriptThread targetThread = this.sessionThreads.remove(sessionId);
    destroyJavaScriptThread(targetThread);
  }

  @ReactMethod
  public void destroyAllSessions() {
    for (JavaScriptThread targetThread: this.sessionThreads.values()) {
      destroyJavaScriptThread(targetThread);
    }
    this.sessionThreads.clear();
  }

  @ReactMethod
  public void destroy() {
    JavaScriptThread javaScriptThread = this.javaScriptThread;
    if (javaScriptThread == null) return;
    destroyJavaScriptThread(javaScriptThread);
    this.javaScriptThread = null;
  }
}
