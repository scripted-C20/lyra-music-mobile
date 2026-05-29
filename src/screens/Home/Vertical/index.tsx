import { View, StyleSheet, Platform } from 'react-native'
import Content from './Content'
import PlayerBar from '@/components/player/PlayerBar'
import BottomNav from './BottomNav'
import { useDS } from '@/theme/useDS'

export default () => {
  const ds = useDS()
  return (
    <View style={[styles.root, { backgroundColor: ds.isDark ? ds.bg : '#F2F2F7' }]}>
      <View style={styles.body}>
        <Content />
      </View>
      {/* 底部 */}
      <View style={styles.bottomDock}>
        <PlayerBar isHome />
        <BottomNav />
        <View style={styles.safeArea} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1, overflow: 'hidden' },
  bottomDock: {
    paddingTop: 0,
  },
  safeArea: {
    height: Platform.OS === 'ios' ? 20 : 4,
  },
})
