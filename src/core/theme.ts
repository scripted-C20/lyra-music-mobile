import themeActions from '@/store/theme/action'
import { getTheme } from '@/theme/themes'
import { updateSetting } from './common'
import themeState from '@/store/theme/state'
import settingState from '@/store/setting/state'
import { setDesktopLyricColor, setStatusBarLyricColor } from './desktopLyric'

const refreshThemeLyricOverlayColor = () => {
  if (settingState.setting['statusBarLyric.enable']) {
    if (
      settingState.setting['statusBarLyric.style.lyricUnplayColor'] == 'theme' ||
      settingState.setting['statusBarLyric.style.lyricPlayedColor'] == 'theme'
    ) {
      requestAnimationFrame(() => {
        void setStatusBarLyricColor(null, null, null)
      })
    }
  }

  if (!settingState.setting['desktopLyric.enable']) return
  if (
    settingState.setting['desktopLyric.style.lyricUnplayColor'] != 'theme' &&
    settingState.setting['desktopLyric.style.lyricPlayedColor'] != 'theme'
  ) return

  requestAnimationFrame(() => {
    void setDesktopLyricColor(null, null, null)
  })
}

export const setShouldUseDarkColors = (shouldUseDarkColors: boolean) => {
  themeActions.setShouldUseDarkColors(shouldUseDarkColors)
}

export const applyTheme = (theme: LX.Theme) => {
  themeActions.setTheme(theme)
  refreshThemeLyricOverlayColor()
}

export const setTheme = (id: string) => {
  const nextSetting: Partial<LX.AppSetting> = { 'theme.id': id }
  if (settingState.setting['common.isAutoTheme']) {
    nextSetting[themeState.shouldUseDarkColors ? 'theme.darkId' : 'theme.lightId'] = id
  }
  updateSetting(nextSetting)
  void getTheme().then(theme => {
    if (theme.id == themeState.theme.id) return
    applyTheme(theme)
  })
}
