import Btn from './Btn'
import { useSettingValue } from '@/store/setting/hook'
import DesktopLyricEnable, { type DesktopLyricEnableType } from '@/components/DesktopLyricEnable'
import { memo, useRef } from 'react'
import { toggleDesktopLyricLock } from '@/core/desktopLyric'
import { updateSetting } from '@/core/common'
import settingState from '@/store/setting/state'
import { useTheme } from '@/store/theme/hook'


export default memo(() => {
  const enabledLyric = useSettingValue('desktopLyric.enable')
  const theme = useTheme()
  const desktopLyricEnableRef = useRef<DesktopLyricEnableType>(null)
  const update = () => {
    desktopLyricEnableRef.current?.setEnabled(!enabledLyric)
  }
  const updateLock = () => {
    const isLock = !settingState.setting['desktopLyric.isLock']
    void toggleDesktopLyricLock(isLock).then(() => {
      updateSetting({ 'desktopLyric.isLock': isLock })
    })
  }

  return (
    <>
      <Btn
        icon={enabledLyric ? 'lyric-on' : 'lyric-off'}
        color={enabledLyric ? theme['c-primary-dark-200'] : undefined}
        onPress={update}
        onLongPress={updateLock}
      />
      <DesktopLyricEnable ref={desktopLyricEnableRef} />
    </>
  )
})
