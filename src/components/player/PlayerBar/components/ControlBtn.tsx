import { TouchableOpacity, View, StyleSheet } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useIsPlay, useStatusText } from '@/store/player/hook'
import { useDS } from '@/theme/useDS'
import { togglePlay, playNext } from '@/core/player/player'
import { isPlayerLoading } from '@/core/player/playStatus'

const onNext = () => { void playNext() }

const ICON_SIZE = 14

const PlayBtn = () => {
  const isPlay = useIsPlay()
  const statusText = useStatusText()
  const ds = useDS()
  const isLoading = isPlayerLoading(statusText)
  const backgroundColor = isPlay || isLoading ? ds.accent : ds.fill3
  const iconColor = isPlay || isLoading ? '#FFFFFF' : ds.textDim
  const iconName = isPlay || isLoading ? 'pause' : 'play'

  return (
    <TouchableOpacity
      style={[
        styles.playBtn,
        {
          backgroundColor,
          borderColor: isPlay || isLoading ? ds.accent : ds.separator,
          shadowColor: isPlay || isLoading ? ds.accent : 'transparent',
        },
      ]}
      activeOpacity={0.6}
      onPress={togglePlay}
    >
      <Icon name={iconName} color={iconColor} size={ICON_SIZE} />
    </TouchableOpacity>
  )
}

const NextBtn = () => {
  const ds = useDS()
  return (
    <TouchableOpacity style={styles.nextBtn} activeOpacity={0.6} onPress={onNext}>
      <Icon name="nextMusic" color={ds.accent} size={ICON_SIZE} />
    </TouchableOpacity>
  )
}

export default () => (
  <View style={styles.row}>
    <PlayBtn />
    <NextBtn />
  </View>
)

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  playBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  nextBtn: {
    width: 24,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
