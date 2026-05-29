import { TouchableOpacity, View, StyleSheet } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useDS } from '@/theme/useDS'
import { playNext, playPrev, togglePlay } from '@/core/player/player'
import { useIsPlay, useStatusText } from '@/store/player/hook'
import { isPlayerLoading } from '@/core/player/playStatus'
import { useWindowSize } from '@/utils/hooks'

const onPrev = () => { void playPrev() }
const onNext = () => { void playNext() }

const SideBtn = ({ icon, onPress, size }: { icon: string, onPress: () => void, size: number }) => {
  const ds = useDS()
  return (
    <TouchableOpacity
      style={[
        styles.sideBtn,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: ds.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.58)',
          borderColor: ds.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(58,58,60,0.14)',
          shadowColor: ds.isDark ? '#000000' : 'rgba(30,30,32,0.28)',
        },
      ]}
      activeOpacity={0.5}
      onPress={onPress}
    >
      <Icon name={icon} color={ds.isDark ? ds.text : '#161618'} rawSize={size * 0.45} />
    </TouchableOpacity>
  )
}

const PlayBtn = ({ size }: { size: number }) => {
  const ds = useDS()
  const isPlay = useIsPlay()
  const statusText = useStatusText()
  const isLoading = isPlayerLoading(statusText)
  return (
    <TouchableOpacity
      style={[
        styles.mainBtn,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: ds.accent,
          shadowColor: ds.accent,
        },
      ]}
      activeOpacity={0.7}
      onPress={togglePlay}
    >
      <Icon
        name={isPlay || isLoading ? 'pause' : 'play'}
        color="#FFFFFF"
        rawSize={size * 0.38}
      />
    </TouchableOpacity>
  )
}

export default () => {
  const { width } = useWindowSize()
  const mainSize = Math.min(Math.max(width * 0.16, 60), 68)
  const sideSize = 44

  return (
    <View style={styles.row}>
      <SideBtn icon="prevMusic" onPress={onPrev} size={sideSize} />
      <PlayBtn size={mainSize} />
      <SideBtn icon="nextMusic" onPress={onNext} size={sideSize} />
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 2,
    paddingBottom: 2,
    gap: 32,
  },
  sideBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  mainBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 7,
  },
})
