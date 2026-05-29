import { memo } from 'react'
import { TouchableOpacity, StyleSheet, View } from 'react-native'
import { useDS } from '@/theme/useDS'

export default memo(({ onPress, bottom = 12 }: {
  onPress: () => void
  bottom?: number
}) => {
  const ds = useDS()

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={onPress}
      style={[
        styles.btn,
        {
          bottom,
          backgroundColor: ds.isDark ? 'rgba(48,48,52,0.92)' : 'rgba(255,255,255,0.94)',
          borderColor: ds.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(58,58,60,0.12)',
          shadowColor: ds.accent,
        },
      ]}
    >
      <View style={styles.locateIcon} pointerEvents="none">
        <View style={[styles.ring, { borderColor: ds.accent }]} />
        <View style={[styles.centerDot, { backgroundColor: ds.accent }]} />
        <View style={[styles.tickTop, { backgroundColor: ds.accent }]} />
        <View style={[styles.tickRight, { backgroundColor: ds.accent }]} />
        <View style={[styles.tickBottom, { backgroundColor: ds.accent }]} />
        <View style={[styles.tickLeft, { backgroundColor: ds.accent }]} />
        <View style={[styles.playMark, { borderLeftColor: ds.accent }]} />
      </View>
    </TouchableOpacity>
  )
})

const styles = StyleSheet.create({
  btn: {
    position: 'absolute',
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
    zIndex: 3,
  },
  locateIcon: {
    width: 23,
    height: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 1.6,
  },
  centerDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 3,
  },
  tickTop: {
    position: 'absolute',
    top: 0,
    width: 1.6,
    height: 5,
    borderRadius: 1,
  },
  tickRight: {
    position: 'absolute',
    right: 0,
    width: 5,
    height: 1.6,
    borderRadius: 1,
  },
  tickBottom: {
    position: 'absolute',
    bottom: 0,
    width: 1.6,
    height: 5,
    borderRadius: 1,
  },
  tickLeft: {
    position: 'absolute',
    left: 0,
    width: 5,
    height: 1.6,
    borderRadius: 1,
  },
  playMark: {
    position: 'absolute',
    right: 2,
    bottom: 1,
    width: 0,
    height: 0,
    borderTopWidth: 3.5,
    borderBottomWidth: 3.5,
    borderLeftWidth: 5,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
})
