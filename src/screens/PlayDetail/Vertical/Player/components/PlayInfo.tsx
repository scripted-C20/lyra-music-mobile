import { View, StyleSheet } from 'react-native'
import Progress from '@/components/player/ProgressBar'
import { useProgress } from '@/store/player/hook'
import { useDS } from '@/theme/useDS'
import Text from '@/components/common/Text'
import { useBufferProgress } from '@/plugins/player'

export default () => {
  const ds = useDS()
  const { maxPlayTimeStr, nowPlayTimeStr, progress, maxPlayTime } = useProgress()
  const buffered = useBufferProgress()
  const timeColor = ds.isDark ? 'rgba(255,255,255,0.7)' : 'rgba(55,55,59,0.55)'

  return (
    <View style={styles.container}>
      {/* 进度条 */}
      <Progress progress={progress} duration={maxPlayTime} buffered={buffered} />
      {/* 时间行 */}
      <View style={styles.timeRow}>
        <Text size={11} color={timeColor} style={styles.time}>
          {nowPlayTimeStr}
        </Text>
        <Text size={11} color={timeColor} style={[styles.time, styles.timeRight]}>
          {maxPlayTimeStr}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -2,
  },
  time: {
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.1,
    includeFontPadding: false,
  },
  timeRight: { textAlign: 'right' },
})
