import { StyleSheet } from 'react-native'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { useDS } from '@/theme/useDS'
import Text from '@/components/common/Text'

export default ({ isHome }: { isHome: boolean }) => {
  const musicInfo = usePlayerMusicInfo()
  const ds = useDS()

  const label = musicInfo.id
    ? `${musicInfo.name}${musicInfo.singer ? `  –  ${musicInfo.singer}` : ''}`
    : '未在播放'

  return (
    <Text size={13} style={[styles.text, { color: ds.text }]} numberOfLines={1}>
      {label}
    </Text>
  )
}

const styles = StyleSheet.create({
  text: { fontWeight: '500', letterSpacing: -0.1 },
})
