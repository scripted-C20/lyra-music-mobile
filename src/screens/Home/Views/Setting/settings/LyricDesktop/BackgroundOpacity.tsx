import { memo, useCallback, useState } from 'react'
import { View } from 'react-native'

import SubTitle from '../../components/SubTitle'
import Slider, { type SliderProps } from '../../components/Slider'
import { updateSetting } from '@/core/common'
import { setDesktopLyricBackgroundOpacity } from '@/core/desktopLyric'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'

export default memo(() => {
  const t = useI18n()
  const opacity = useSettingValue('desktopLyric.style.backgroundOpacity')
  const theme = useTheme()
  const [sliderSize, setSliderSize] = useState(opacity)
  const [isSliding, setSliding] = useState(false)

  const handleSlidingStart = useCallback<NonNullable<SliderProps['onSlidingStart']>>(() => {
    setSliding(true)
  }, [])
  const handleValueChange = useCallback<NonNullable<SliderProps['onValueChange']>>(value => {
    setSliderSize(value)
    void setDesktopLyricBackgroundOpacity(value)
  }, [])
  const handleSlidingComplete = useCallback<NonNullable<SliderProps['onSlidingComplete']>>(value => {
    if (opacity != value) {
      void setDesktopLyricBackgroundOpacity(value).then(() => {
        updateSetting({ 'desktopLyric.style.backgroundOpacity': value })
      }).finally(() => {
        setSliding(false)
      })
      return
    }
    setSliding(false)
  }, [opacity])

  return (
    <SubTitle title={t('setting_lyric_desktop_background_opacity')}>
      <View style={styles.content}>
        <Text size={12} style={{ color: theme['c-primary-font'] }}>{isSliding ? sliderSize : opacity}</Text>
        <Slider
          minimumValue={0}
          maximumValue={100}
          onSlidingComplete={handleSlidingComplete}
          onValueChange={handleValueChange}
          onSlidingStart={handleSlidingStart}
          step={2}
          value={opacity}
        />
      </View>
    </SubTitle>
  )
})

const styles = createStyle({
  content: {
    flexGrow: 0,
    flexShrink: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
})
