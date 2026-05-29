import {
  hideDesktopLyricView,
  hideStatusBarLyricView,
  showDesktopLyricView,
  showStatusBarLyricView,
  setSendLyricTextEvent,
  setLyric,
  play,
  pause,
  setPlaybackRate,
  toggleTranslation,
  toggleRoma,
  toggleLock,
  setColor,
  setStatusBarColor,
  setBackgroundColor,
  setStatusBarBackgroundColor,
  setStatusBarMode,
  setAlpha,
  setStatusBarAlpha,
  setTextSize,
  setStatusBarTextSize,
  setShowToggleAnima,
  setStatusBarShowToggleAnima,
  setSingleLine,
  setStatusBarSingleLine,
  setPosition,
  setStatusBarPosition,
  setMaxLineNum,
  setStatusBarMaxLineNum,
  setWidth,
  setStatusBarWidth,
  setLyricTextPosition,
  setStatusBarLyricTextPosition as setStatusBarNativeLyricTextPosition,
  checkOverlayPermission,
  openOverlayPermissionActivity,
  onPositionChange,
} from '@/utils/nativeModules/lyricDesktop'
import settingState from '@/store/setting/state'
import playerState from '@/store/player/state'
import themeState from '@/store/theme/state'
import { tranditionalize } from '@/utils/simplify-chinese-main'
import { getPosition } from '@/plugins/player'
export {
  onLyricLinePlay,
} from '@/utils/nativeModules/lyricDesktop'

const resolveThemeLyricColor = (color: string) => color == 'theme' ? themeState.theme['c-primary'] : color
type LyricOverlayMode = 'desktop' | 'statusBar'

const getOverlaySetting = (mode: LyricOverlayMode) => {
  const setting = settingState.setting
  if (mode == 'statusBar') {
    return {
      isShowToggleAnima: setting['statusBarLyric.showToggleAnima'],
      isSingleLine: setting['statusBarLyric.isSingleLine'],
      isStatusBarMode: true,
      isLock: true,
      unplayColor: resolveThemeLyricColor(setting['statusBarLyric.style.lyricUnplayColor']),
      playedColor: resolveThemeLyricColor(setting['statusBarLyric.style.lyricPlayedColor']),
      shadowColor: setting['statusBarLyric.style.lyricShadowColor'],
      backgroundColor: setting['statusBarLyric.style.backgroundColor'],
      opacity: setting['statusBarLyric.style.opacity'],
      textSize: setting['statusBarLyric.style.fontSize'],
      width: setting['statusBarLyric.width'],
      maxLineNum: setting['statusBarLyric.maxLineNum'],
      positionX: setting['statusBarLyric.position.x'],
      positionY: setting['statusBarLyric.position.y'],
      textPositionX: setting['statusBarLyric.textPosition.x'],
      textPositionY: setting['statusBarLyric.textPosition.y'],
    }
  }

  return {
    isShowToggleAnima: setting['desktopLyric.showToggleAnima'],
    isSingleLine: setting['desktopLyric.isSingleLine'],
    isStatusBarMode: false,
    isLock: setting['desktopLyric.isLock'],
    unplayColor: resolveThemeLyricColor(setting['desktopLyric.style.lyricUnplayColor']),
    playedColor: resolveThemeLyricColor(setting['desktopLyric.style.lyricPlayedColor']),
    shadowColor: setting['desktopLyric.style.lyricShadowColor'],
    backgroundColor: setting['desktopLyric.style.backgroundColor'],
    opacity: setting['desktopLyric.style.opacity'],
    textSize: setting['desktopLyric.style.fontSize'],
    width: setting['desktopLyric.width'],
    maxLineNum: setting['desktopLyric.maxLineNum'],
    positionX: setting['desktopLyric.position.x'],
    positionY: setting['desktopLyric.position.y'],
    textPositionX: setting['desktopLyric.textPosition.x'],
    textPositionY: setting['desktopLyric.textPosition.y'],
  }
}

const showLyricOverlay = async(mode: LyricOverlayMode) => {
  const setting = settingState.setting
  if (mode == 'statusBar') await showStatusBarLyricView(getOverlaySetting(mode))
  else await showDesktopLyricView(getOverlaySetting(mode))
  let lrc = playerState.musicInfo.lrc ?? ''
  let tlrc = playerState.musicInfo.tlrc ?? ''
  let rlrc = playerState.musicInfo.rlrc ?? ''
  if (setting['player.isS2t']) {
    lrc = tranditionalize(lrc)
    tlrc = tranditionalize(tlrc)
  }
  await setLyric(lrc, tlrc, rlrc)
  if (playerState.isPlay && !global.lx.gettingUrlId) {
    void getPosition().then(position => {
      void play(position * 1000)
    })
  }
}

export const showDesktopLyric = async() => {
  return showLyricOverlay('desktop')
}

export const showStatusBarLyric = async() => {
  return showLyricOverlay('statusBar')
}

export const hideDesktopLyric = async() => {
  return hideDesktopLyricView()
}

export const hideStatusBarLyric = async() => {
  return hideStatusBarLyricView()
}

export const playDesktopLyric = play
export const pauseDesktopLyric = pause
export const setDesktopLyric = setLyric
export const setDesktopLyricPlaybackRate = setPlaybackRate
export const toggleDesktopLyricTranslation = toggleTranslation
export const toggleDesktopLyricRoma = toggleRoma
export const toggleDesktopLyricLock = async(isLock: boolean) => {
  if (!settingState.setting['desktopLyric.enable']) return
  return toggleLock(isLock)
}
export const setDesktopLyricColor = async(unplayColor: string | null, playedColor: string | null, shadowColor: string | null) => {
  const setting = settingState.setting
  if (!setting['desktopLyric.enable']) return
  return setColor(resolveThemeLyricColor(unplayColor ?? setting['desktopLyric.style.lyricUnplayColor']),
    resolveThemeLyricColor(playedColor ?? setting['desktopLyric.style.lyricPlayedColor']),
    shadowColor ?? setting['desktopLyric.style.lyricShadowColor'],
  )
}
export const setDesktopLyricBackgroundColor = async(backgroundColor: string | null) => {
  const setting = settingState.setting
  if (!setting['desktopLyric.enable']) return
  return setBackgroundColor(backgroundColor ?? setting['desktopLyric.style.backgroundColor'])
}
export const setDesktopLyricStatusBarMode = async(isStatusBarMode: boolean) => {
  if (!settingState.setting['desktopLyric.enable']) return
  return setStatusBarMode(isStatusBarMode)
}
export const setDesktopLyricAlpha = async(alpha: number) => {
  if (!settingState.setting['desktopLyric.enable']) return
  return setAlpha(alpha)
}
export const setDesktopLyricTextSize = async(size: number) => {
  if (!settingState.setting['desktopLyric.enable']) return
  return setTextSize(size)
}
export const setShowDesktopLyricToggleAnima = async(isShowToggleAnima: boolean) => {
  if (!settingState.setting['desktopLyric.enable']) return
  return setShowToggleAnima(isShowToggleAnima)
}
export const setDesktopLyricSingleLine = async(isSingleLine: boolean) => {
  if (!settingState.setting['desktopLyric.enable']) return
  return setSingleLine(isSingleLine)
}
export const setDesktopLyricPosition = async(x: number, y: number) => {
  if (!settingState.setting['desktopLyric.enable']) return
  return setPosition(x, y)
}
export const setDesktopLyricMaxLineNum = async(maxLineNum: number) => {
  if (!settingState.setting['desktopLyric.enable']) return
  return setMaxLineNum(maxLineNum)
}
export const setDesktopLyricWidth = async(width: number) => {
  if (!settingState.setting['desktopLyric.enable']) return
  return setWidth(width)
}
export const setDesktopLyricTextPosition = async(x: LX.AppSetting['desktopLyric.textPosition.x'] | null, y: LX.AppSetting['desktopLyric.textPosition.y'] | null) => {
  if (!settingState.setting['desktopLyric.enable']) return
  return setLyricTextPosition(x ?? settingState.setting['desktopLyric.textPosition.x'], y ?? settingState.setting['desktopLyric.textPosition.y'])
}
export const setStatusBarLyricColor = async(unplayColor: string | null, playedColor: string | null, shadowColor: string | null) => {
  if (!settingState.setting['statusBarLyric.enable']) return
  return setStatusBarColor(resolveThemeLyricColor(unplayColor ?? settingState.setting['statusBarLyric.style.lyricUnplayColor']),
    resolveThemeLyricColor(playedColor ?? settingState.setting['statusBarLyric.style.lyricPlayedColor']),
    shadowColor ?? settingState.setting['statusBarLyric.style.lyricShadowColor'],
  )
}
export const setStatusBarLyricBackgroundColor = async(backgroundColor: string | null) => {
  if (!settingState.setting['statusBarLyric.enable']) return
  return setStatusBarBackgroundColor(backgroundColor ?? settingState.setting['statusBarLyric.style.backgroundColor'])
}
export const setStatusBarLyricAlpha = async(alpha: number) => {
  if (!settingState.setting['statusBarLyric.enable']) return
  return setStatusBarAlpha(alpha)
}
export const setStatusBarLyricTextSize = async(size: number) => {
  if (!settingState.setting['statusBarLyric.enable']) return
  return setStatusBarTextSize(size)
}
export const setStatusBarLyricShowToggleAnima = async(isShowToggleAnima: boolean) => {
  if (!settingState.setting['statusBarLyric.enable']) return
  return setStatusBarShowToggleAnima(isShowToggleAnima)
}
export const setStatusBarLyricSingleLine = async(isSingleLine: boolean) => {
  if (!settingState.setting['statusBarLyric.enable']) return
  return setStatusBarSingleLine(isSingleLine)
}
export const setStatusBarLyricPosition = async(x: number, y: number) => {
  if (!settingState.setting['statusBarLyric.enable']) return
  return setStatusBarPosition(x, y)
}
export const setStatusBarLyricMaxLineNum = async(maxLineNum: number) => {
  if (!settingState.setting['statusBarLyric.enable']) return
  return setStatusBarMaxLineNum(maxLineNum)
}
export const setStatusBarLyricWidth = async(width: number) => {
  if (!settingState.setting['statusBarLyric.enable']) return
  return setStatusBarWidth(width)
}
export const setStatusBarLyricTextPosition = async(x: LX.AppSetting['statusBarLyric.textPosition.x'] | null, y: LX.AppSetting['statusBarLyric.textPosition.y'] | null) => {
  if (!settingState.setting['statusBarLyric.enable']) return
  return setStatusBarNativeLyricTextPosition(x ?? settingState.setting['statusBarLyric.textPosition.x'], y ?? settingState.setting['statusBarLyric.textPosition.y'])
}
export const checkDesktopLyricOverlayPermission = checkOverlayPermission
export const openDesktopLyricOverlayPermissionActivity = openOverlayPermissionActivity
export const onDesktopLyricPositionChange = onPositionChange


export const showRemoteLyric = async(isSend: boolean) => {
  await setSendLyricTextEvent(isSend)
  if (isSend) {
    let lrc = playerState.musicInfo.lrc ?? ''
    let tlrc = playerState.musicInfo.tlrc ?? ''
    let rlrc = playerState.musicInfo.rlrc ?? ''
    if (settingState.setting['player.isS2t']) {
      lrc = tranditionalize(lrc)
      tlrc = tranditionalize(tlrc)
    }
    await setLyric(lrc, tlrc, rlrc)
    if (playerState.isPlay && !global.lx.gettingUrlId) {
      void getPosition().then(position => {
        void play(position * 1000)
      })
    }
  }
}
