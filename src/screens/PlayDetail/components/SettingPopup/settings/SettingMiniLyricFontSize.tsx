import { useState } from 'react'

import { View } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { useSettingValue } from '@/store/setting/hook'
import Slider, { type SliderProps } from '@/components/common/Slider'
import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import styles from './style'

export default () => {
  const theme = useTheme()
  const t = useI18n()
  const fontSize = useSettingValue('playDetail.vertical.style.miniLyricFontSize')
  const [sliderSize, setSliderSize] = useState(fontSize)
  const [isSliding, setSliding] = useState(false)

  const handleSlidingStart: SliderProps['onSlidingStart'] = () => {
    setSliding(true)
  }
  const handleValueChange: SliderProps['onValueChange'] = value => {
    setSliderSize(value)
  }
  const handleSlidingComplete: SliderProps['onSlidingComplete'] = value => {
    setSliding(false)
    if (fontSize == value) return
    updateSetting({ 'playDetail.vertical.style.miniLyricFontSize': value })
  }

  return (
    <View style={styles.container}>
      <Text>{t('play_detail_setting_mini_lrc_font_size')}</Text>
      <View style={styles.content}>
        <Text style={styles.label} color={theme['c-font-label']}>{isSliding ? sliderSize : fontSize}</Text>
        <Slider
          minimumValue={10}
          maximumValue={18}
          onSlidingComplete={handleSlidingComplete}
          onValueChange={handleValueChange}
          onSlidingStart={handleSlidingStart}
          step={0.5}
          value={fontSize}
        />
      </View>
      <Text size={10.5} color={theme['c-font-label']}>{t('play_detail_setting_mini_lrc_font_size_desc')}</Text>
    </View>
  )
}
