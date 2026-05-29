import themeActions from '@/store/theme/action'
import { getTheme } from '@/theme/themes'
import { updateSetting } from './common'
import themeState from '@/store/theme/state'
import settingState from '@/store/setting/state'

export const setShouldUseDarkColors = (shouldUseDarkColors: boolean) => {
  themeActions.setShouldUseDarkColors(shouldUseDarkColors)
}

export const applyTheme = (theme: LX.Theme) => {
  themeActions.setTheme(theme)
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
