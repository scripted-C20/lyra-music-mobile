import { memo, useCallback, useMemo, useRef, useState } from 'react'
import { View, TouchableOpacity, StyleSheet, PanResponder } from 'react-native'
import { useDrag, useKeyboard } from '@/utils/hooks'
import Pic from './components/Pic'
import Title from './components/Title'
import ControlBtn from './components/ControlBtn'
import { useDS } from '@/theme/useDS'
import { useSettingValue } from '@/store/setting/hook'
import { usePlayerMusicInfo, useProgress } from '@/store/player/hook'
import { navigations } from '@/navigation'
import commonState from '@/store/common/state'

const ProgressBar = () => {
  const ds = useDS()
  const { progress, maxPlayTime } = useProgress()
  const allowProgressBarSeek = useSettingValue('common.allowProgressBarSeek')
  const [draging, setDraging] = useState(false)
  const [dragProgress, setDragProgress] = useState(0)
  const safeProgress = Number.isFinite(progress) ? Math.max(0, Math.min(progress, 1)) : 0
  const safeDragProgress = Number.isFinite(dragProgress) ? Math.max(0, Math.min(dragProgress, 1)) : 0
  const durationRef = useRef(maxPlayTime)
  durationRef.current = maxPlayTime

  const onSetProgress = useCallback((nextProgress: number) => {
    if (!durationRef.current) return
    global.app_event.setProgress(nextProgress * durationRef.current)
  }, [])
  const {
    onLayout,
    onDragStart,
    onDragEnd,
    onDrag,
  } = useDrag(onSetProgress, setDraging, setDragProgress)

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderMove: (_evt, gestureState) => {
        onDrag(gestureState.dx)
      },
      onPanResponderGrant: (evt, gestureState) => {
        onDragStart(gestureState.dx, evt.nativeEvent.locationX)
      },
      onPanResponderRelease: () => {
        onDragEnd()
      },
      onPanResponderTerminate: () => {
        onDragEnd()
      },
    }),
  ).current

  return (
    <View style={[styles.progressTrack, { backgroundColor: ds.fill3 }]}>
      <View style={[styles.progressFill, { backgroundColor: ds.accent, width: `${(draging ? safeDragProgress : safeProgress) * 100}%` }]} />
      {allowProgressBarSeek && maxPlayTime > 0 ? (
        <View onLayout={onLayout} style={styles.progressHitSlop} {...panResponder.panHandlers} />
      ) : null}
    </View>
  )
}

export default memo(({ isHome = false }: { isHome?: boolean }) => {
  const { keyboardShown } = useKeyboard()
  const ds = useDS()
  const autoHide = useSettingValue('common.autoHidePlayBar')
  const musicInfo = usePlayerMusicInfo()

  const onPress = () => {
    if (!musicInfo.id) return
    navigations.pushPlayDetailScreen(commonState.componentIds.home!)
  }

  const node = useMemo(() => (
    <View style={styles.outer}>
      {/* 顶部渐隐遮罩 */}
      <View style={[styles.fadeTop, { backgroundColor: ds.isDark ? 'rgba(0,0,0,0.6)' : 'rgba(242,242,247,0.85)' }]} />

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={[
          styles.capsule,
          {
            backgroundColor: ds.isDark ? 'rgba(50,50,54,0.96)' : '#FFFFFF',
            shadowColor: ds.isDark ? '#000' : ds.accent,
          },
        ]}
      >
        <Pic isHome={isHome} />
        <View style={styles.info}>
          <Title isHome={isHome} />
        </View>
        <ControlBtn />
        {/* 底部进度条 */}
        <ProgressBar />
      </TouchableOpacity>
    </View>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [ds, isHome, musicInfo.id])

  return autoHide && keyboardShown ? null : node
})

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: 12,
    paddingTop: 0,
    paddingBottom: 2,
    position: 'relative',
  },
  fadeTop: {
    position: 'absolute',
    top: -2,
    left: 0,
    right: 0,
    height: 6,
  },
  capsule: {
    borderRadius: 999,
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 6,
    paddingRight: 12,
    gap: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 14,
    elevation: 6,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  info: { flex: 1, overflow: 'hidden' },
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    height: 2,
    borderRadius: 1,
  },
  progressFill: {
    height: '100%',
    borderRadius: 1,
  },
  progressHitSlop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -10,
    bottom: -10,
  },
})
