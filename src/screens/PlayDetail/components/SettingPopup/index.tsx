import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { ScrollView, View } from 'react-native'
import Popup, { type PopupType, type PopupProps } from '@/components/common/Popup'
import { useI18n } from '@/lang'

import SettingLyricProgress from './settings/SettingLyricProgress'
import SettingVolume from './settings/SettingVolume'
import SettingPlaybackRate from './settings/SettingPlaybackRate'
import SettingLrcFontSize from './settings/SettingLrcFontSize'
import SettingLrcAlign from './settings/SettingLrcAlign'
import SettingMiniLyricAlign from './settings/SettingMiniLyricAlign'
import SettingMiniLyricFontSize from './settings/SettingMiniLyricFontSize'

export interface SettingPopupProps extends Omit<PopupProps, 'children'> {
  direction: 'vertical' | 'horizontal'
}

export interface SettingPopupType {
  show: () => void
}

export default forwardRef<SettingPopupType, SettingPopupProps>(({ direction, ...props }, ref) => {
  const [visible, setVisible] = useState(false)
  const popupRef = useRef<PopupType>(null)
  // console.log('render import export')
  const t = useI18n()

  useImperativeHandle(ref, () => ({
    show() {
      if (visible) popupRef.current?.setVisible(true)
      else setVisible(true)
    },
  }))

  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(() => {
      popupRef.current?.setVisible(true)
    }, 0)
    return () => { clearTimeout(timer) }
  }, [visible])


  return (
    visible
      ? (
        <Popup ref={popupRef} title={t('play_detail_setting_title')} {...props}>
          <ScrollView>
            <View onStartShouldSetResponder={() => true}>
              <SettingLyricProgress />
              <SettingVolume />
              <SettingPlaybackRate />
              <SettingLrcFontSize direction={direction} />
              <SettingLrcAlign />
              {direction == 'vertical' ? <SettingMiniLyricFontSize /> : null}
              {direction == 'vertical' ? <SettingMiniLyricAlign /> : null}
            </View>
          </ScrollView>
        </Popup>
        )
      : null
  )
})
