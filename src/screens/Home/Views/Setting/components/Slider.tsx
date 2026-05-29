import { memo } from 'react'
import { StyleSheet } from 'react-native'
import Slider, { type SliderProps } from '@react-native-community/slider'
import { useDS } from '@/theme/useDS'

export type { SliderProps }

export default memo(({ value, minimumValue, maximumValue, onSlidingStart, onSlidingComplete, onValueChange, step }: SliderProps) => {
  const ds = useDS()
  return (
    <Slider
      value={value}
      style={styles.slider}
      minimumValue={minimumValue}
      maximumValue={maximumValue}
      minimumTrackTintColor={ds.accent}
      maximumTrackTintColor={ds.fill3}
      thumbTintColor={ds.text}
      onSlidingStart={onSlidingStart}
      onSlidingComplete={onSlidingComplete}
      onValueChange={onValueChange}
      step={step}
    />
  )
})

const styles = StyleSheet.create({
  slider: {
    flexShrink: 0,
    flexGrow: 1,
    maxWidth: 260,
    height: 30,
    marginTop: -2,
  },
})
