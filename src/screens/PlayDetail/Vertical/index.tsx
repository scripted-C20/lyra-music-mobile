import { memo, useRef, useMemo, useEffect } from 'react'
import { View, AppState, StyleSheet } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import Header, { PAGE_SIDE_PADDING } from './components/Header'
import Player from './Player'
import PagerView, { type PagerViewOnPageSelectedEvent } from 'react-native-pager-view'
import Pic from './Pic'
import Lyric from './Lyric'
import { screenkeepAwake, screenUnkeepAwake } from '@/utils/nativeModules/utils'
import commonState, { type InitState as CommonState } from '@/store/common/state'
import { useDS } from '@/theme/useDS'
import ImageBackground from '@/components/common/ImageBackground'
import { defaultHeaders } from '@/components/common/Image'
import { usePlayerMusicInfo } from '@/store/player/hook'

export default memo(({ componentId }: { componentId: string }) => {
  const ds = useDS()
  const musicInfo = usePlayerMusicInfo()
  const showLyricRef = useRef(false)

  const backgroundSource = useMemo(() => {
    const pic = musicInfo.pic
    if (!pic) return null
    if (typeof pic == 'number') return pic
    return {
      uri: pic.startsWith('/') ? `file://${pic}` : pic,
      headers: defaultHeaders,
    }
  }, [musicInfo.pic])

  const gradientColors = useMemo(() => {
    return ds.isDark
      ? ['rgba(176,30,40,0.78)', 'rgba(42,24,27,0.90)', 'rgba(7,7,10,0.98)']
      : ['rgba(224,83,78,0.42)', 'rgba(211,156,146,0.32)', 'rgba(238,235,235,0.98)']
  }, [ds.isDark])
  const glossColors = useMemo(() => {
    return ds.isDark
      ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)', 'rgba(255,255,255,0)']
      : ['rgba(255,255,255,0.40)', 'rgba(255,255,255,0.12)', 'rgba(255,255,255,0)']
  }, [ds.isDark])
  const bottomShadeColors = useMemo(() => {
    return ds.isDark
      ? ['rgba(0,0,0,0)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.45)']
      : ['rgba(255,255,255,0)', 'rgba(255,255,255,0.20)', 'rgba(255,255,255,0.42)']
  }, [ds.isDark])

  const onPageSelected = ({ nativeEvent }: PagerViewOnPageSelectedEvent) => {
    showLyricRef.current = nativeEvent.position === 1
    showLyricRef.current ? screenkeepAwake() : screenUnkeepAwake()
  }

  useEffect(() => {
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active' && showLyricRef.current && !commonState.componentIds.comment) {
        screenkeepAwake()
      } else if (state === 'background') {
        screenUnkeepAwake()
      }
    })
    const handleIds = (ids: CommonState['componentIds']) => {
      if (ids.comment) screenUnkeepAwake()
      else if (AppState.currentState === 'active') screenkeepAwake()
    }
    global.state_event.on('componentIdsUpdated', handleIds)
    return () => {
      global.state_event.off('componentIdsUpdated', handleIds)
      listener.remove()
      screenUnkeepAwake()
    }
  }, [])

  return (
    <View style={[styles.root, { backgroundColor: ds.bg }]}>
      {backgroundSource ? (
        <ImageBackground
          style={styles.backdrop}
          source={backgroundSource}
          blurRadius={44}
        >
          <View
            style={[
              styles.backdropScrim,
              { backgroundColor: ds.isDark ? 'rgba(0,0,0,0.34)' : 'rgba(255,255,255,0.12)' },
            ]}
          />
        </ImageBackground>
      ) : null}
      <LinearGradient
        pointerEvents="none"
        colors={gradientColors}
        locations={[0, 0.38, 1]}
        start={{ x: 0.08, y: 0 }}
        end={{ x: 0.96, y: 1 }}
        style={styles.gradientLayer}
      />
      <LinearGradient
        pointerEvents="none"
        colors={glossColors}
        locations={[0, 0.28, 1]}
        start={{ x: 0.18, y: 0 }}
        end={{ x: 0.72, y: 0.58 }}
        style={styles.glossLayer}
      />
      <LinearGradient
        pointerEvents="none"
        colors={bottomShadeColors}
        locations={[0, 0.64, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.bottomShadeLayer}
      />
      <Header />

      <View style={styles.body}>
        <View style={styles.stage}>
          <PagerView
            onPageSelected={onPageSelected}
            style={styles.pager}
          >
            <View collapsable={false} key="pic" style={styles.page}>
              <Pic componentId={componentId} />
            </View>
            <View collapsable={false} key="lyric" style={styles.page}>
              <Lyric />
            </View>
          </PagerView>
        </View>
      </View>

      <Player />
    </View>
  )
})

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropScrim: {
    flex: 1,
  },
  gradientLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  glossLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomShadeLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  body: {
    flex: 1,
    paddingHorizontal: PAGE_SIDE_PADDING,
    paddingBottom: 0,
  },
  stage: {
    flex: 1,
  },
  pager: { flex: 1 },
  page: { flex: 1 },
})
