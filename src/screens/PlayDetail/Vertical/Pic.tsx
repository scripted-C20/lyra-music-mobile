import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { useIsPlay, usePlayerMusicInfo } from '@/store/player/hook'
import { useWindowSize } from '@/utils/hooks'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { useNavigationComponentDidAppear } from '@/navigation'
import { HEADER_HEIGHT } from './components/Header'
import Image from '@/components/common/Image'
import { useStatusbarHeight } from '@/store/common/hook'
import commonState from '@/store/common/state'
import { useDS } from '@/theme/useDS'
import Text from '@/components/common/Text'
import { useLrcPlay, useLrcSet } from '@/plugins/lyric'

// 衔接到进度条的迷你歌词：显示当前行 + 前后几行，播放时自动滚动
const MiniLyric = ({ activeColor, dimColor, height }: { activeColor: string, dimColor: string, height: number }) => {
  const lyricLines = useLrcSet()
  const { line } = useLrcPlay()
  const LINE_HEIGHT = 26
  const VISIBLE = Math.max(3, Math.floor(height / LINE_HEIGHT))
  const translateAnim = useRef(new Animated.Value(0)).current

  const validLines = useMemo(() => lyricLines.filter(l => !!l.text.trim()), [lyricLines])
  const hasLyric = validLines.length > 0

  // 当前行在 validLines 中的索引
  const activeIdx = useMemo(() => {
    if (line < 0 || !lyricLines.length) return -1
    const cur = lyricLines[line]
    if (cur && validLines.includes(cur)) return validLines.indexOf(cur)
    const nextIndex = lyricLines.findIndex((item, index) => index >= line && !!item.text.trim())
    if (nextIndex >= 0) return validLines.indexOf(lyricLines[nextIndex])
    return 0
  }, [line, lyricLines, validLines])

  useEffect(() => {
    const target = activeIdx < 0 ? 0 : activeIdx
    Animated.timing(translateAnim, {
      toValue: -target * LINE_HEIGHT,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [activeIdx, translateAnim])

  if (!hasLyric) return <View style={{ height }} />

  return (
    <View style={[styles.miniLyricWrap, { height: VISIBLE * LINE_HEIGHT }]}>
      <Animated.View style={{ transform: [{ translateY: translateAnim }], paddingTop: (Math.floor(VISIBLE / 2)) * LINE_HEIGHT }}>
        {validLines.map((l, idx) => {
          const active = idx === activeIdx
          return (
            <View key={idx} style={[styles.miniLine, { height: LINE_HEIGHT }]}>
              <Text
                size={active ? 14 : 12.5}
                color={active ? activeColor : dimColor}
                style={[styles.miniLineText, { opacity: active ? 1 : 0.5, fontWeight: active ? '700' : '500' }]}
                numberOfLines={1}
              >
                {l.text.trim()}
              </Text>
            </View>
          )
        })}
      </Animated.View>
    </View>
  )
}

export default ({ componentId }: { componentId: string }) => {
  const musicInfo = usePlayerMusicInfo()
  const isPlay = useIsPlay()
  const { width: winW, height: winH } = useWindowSize()
  const statusBarH = useStatusbarHeight()
  const ds = useDS()

  const [animated, setAnimated] = useState(!!commonState.componentIds.playDetail)
  const [pic, setPic] = useState(musicInfo.pic)

  useEffect(() => { if (animated) setPic(musicInfo.pic) }, [musicInfo.pic, animated])
  useNavigationComponentDidAppear(componentId, () => { setAnimated(true) })

  const discRotateAnim = useRef(new Animated.Value(0)).current
  const spinLoopRef = useRef<Animated.CompositeAnimation | null>(null)

  useEffect(() => {
    discRotateAnim.setValue(0)
  }, [discRotateAnim, musicInfo.id])

  useEffect(() => {
    if (!pic || !isPlay) {
      spinLoopRef.current?.stop()
      spinLoopRef.current = null
      return
    }

    const animation = Animated.loop(Animated.timing(discRotateAnim, {
      toValue: 1,
      duration: 13000,
      easing: Easing.linear,
      useNativeDriver: true,
    }))

    spinLoopRef.current = animation
    animation.start()

    return () => {
      animation.stop()
      spinLoopRef.current = null
    }
  }, [discRotateAnim, isPlay, pic])

  const discRotate = discRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const recordSize = useMemo(() => {
    const maxH = (winH - statusBarH - HEADER_HEIGHT - 272) * 0.74
    return Math.min(winW * 0.58, maxH)
  }, [statusBarH, winH, winW])

  const stageSize = useMemo(() => ({
    width: recordSize * 1.16,
    height: recordSize * 1.06,
  }), [recordSize])

  const coverShellSize = recordSize * 0.43
  const coverSize = recordSize * 0.35
  const spindleSize = recordSize * 0.11
  const pivotSize = recordSize * 0.16
  const armLength = recordSize * 0.42
  const armThickness = Math.max(10, recordSize * 0.032)
  const ringScales = [0.96, 0.88, 0.8, 0.72, 0.64, 0.56]

  return (
    <View style={styles.container}>
      {/* 唱片动画（往上提） */}
      <View style={[styles.artworkBlock, { transform: [{ translateY: 10 }] }]}>
        <View style={[styles.stage, stageSize]}>
          <View
            pointerEvents="none"
            style={[
              styles.stageGlow,
              {
                width: recordSize * 1.08,
                height: recordSize * 0.58,
                borderRadius: recordSize * 0.29,
                bottom: recordSize * -0.025,
                backgroundColor: ds.isDark ? 'rgba(255,80,88,0.10)' : 'rgba(148,72,64,0.11)',
              },
            ]}
          />
          <View
            style={[
              styles.armPivot,
              {
                width: pivotSize,
                height: pivotSize,
                borderRadius: pivotSize / 2,
                top: recordSize * 0.02,
                right: recordSize * 0.1,
                shadowColor: ds.isDark ? '#000000' : 'rgba(44,44,52,0.18)',
              },
            ]}
          >
            <LinearGradient
              colors={ds.isDark ? ['#d8dde7', '#8a93a4', '#f6f8fb'] : ['#f8fbff', '#c8d0db', '#fefefe']}
              start={{ x: 0.15, y: 0.1 }}
              end={{ x: 0.82, y: 0.9 }}
              style={StyleSheet.absoluteFillObject}
            />
          </View>

          <LinearGradient
            colors={ds.isDark ? ['#d3d9e2', '#9ca6b5', '#f5f7fb'] : ['#eef2f7', '#cfd6e0', '#ffffff']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[
              styles.armBar,
              {
                width: armLength,
                height: armThickness,
                borderRadius: armThickness / 2,
                top: recordSize * 0.12,
                right: recordSize * -0.015,
              },
            ]}
          />

          <View
            style={[
              styles.armHead,
              {
                width: armThickness * 0.92,
                height: armThickness * 1.45,
                borderRadius: armThickness * 0.42,
                top: recordSize * 0.255,
                right: recordSize * 0.01,
                backgroundColor: ds.isDark ? '#eef2f6' : '#ffffff',
              },
            ]}
          />

          <Animated.View
            style={[
              styles.recordShadow,
              {
                width: recordSize,
                height: recordSize,
                borderRadius: recordSize / 2,
                shadowColor: ds.isDark ? '#000000' : 'rgba(17,17,22,0.34)',
                transform: [{ rotate: discRotate }],
              },
            ]}
          >
            <LinearGradient
              colors={['#040507', '#0c0e12', '#161920', '#050608']}
              locations={[0, 0.38, 0.72, 1]}
              start={{ x: 0.18, y: 0.1 }}
              end={{ x: 0.86, y: 0.92 }}
              style={[styles.recordFace, { borderRadius: recordSize / 2 }]}
            />

            {ringScales.map((scale, index) => {
              const size = recordSize * scale
              return (
                <View
                  key={scale}
                  style={[
                    styles.recordRing,
                    {
                      width: size,
                      height: size,
                      borderRadius: size / 2,
                      top: (recordSize - size) / 2,
                      left: (recordSize - size) / 2,
                      borderColor: index % 2
                        ? 'rgba(255,255,255,0.065)'
                        : 'rgba(255,255,255,0.12)',
                    },
                  ]}
                />
              )
            })}

            <View
              style={[
                styles.recordCenterShell,
                {
                  width: coverShellSize,
                  height: coverShellSize,
                  borderRadius: coverShellSize / 2,
                  top: (recordSize - coverShellSize) / 2,
                  left: (recordSize - coverShellSize) / 2,
                },
              ]}
            >
              <Image
                url={pic}
                nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pic}
                style={{
                  width: coverSize,
                  height: coverSize,
                  borderRadius: coverSize / 2,
                }}
              />
            </View>

            <View
              style={[
                styles.spindle,
                {
                  width: spindleSize,
                  height: spindleSize,
                  borderRadius: spindleSize / 2,
                  top: (recordSize - spindleSize) / 2,
                  left: (recordSize - spindleSize) / 2,
                },
              ]}
            >
              <LinearGradient
                colors={ds.isDark ? ['#f2f5f8', '#bec6d2', '#fcfdff'] : ['#ffffff', '#cfd5de', '#f7f9fc']}
                start={{ x: 0.15, y: 0.1 }}
                end={{ x: 0.82, y: 0.88 }}
                style={StyleSheet.absoluteFillObject}
              />
            </View>

            <View style={styles.recordHighlight} />
          </Animated.View>
        </View>
      </View>

      {/* 歌手副标题 */}
      {musicInfo.singer ? (
        <View style={styles.singerRow}>
          <View style={[styles.singerDot, { backgroundColor: ds.accent }]} />
          <Text
            size={13}
            color={ds.isDark ? 'rgba(255,255,255,0.8)' : 'rgba(45,45,50,0.72)'}
            style={styles.singerText}
            numberOfLines={1}
          >
            {musicInfo.singer}
          </Text>
        </View>
      ) : null}

      {/* 迷你歌词（衔接进度条，播放时自动滚动） */}
      <View style={styles.lyricBlock}>
        <MiniLyric
          activeColor={ds.isDark ? '#ffffff' : ds.text}
          dimColor={ds.isDark ? 'rgba(255,255,255,0.55)' : 'rgba(55,48,48,0.6)'}
          height={130}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 12,
  },
  artworkBlock: {
    alignItems: 'center',
  },
  stage: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  stageGlow: {
    position: 'absolute',
    alignSelf: 'center',
    opacity: 0.88,
    transform: [{ scaleX: 1.08 }],
  },
  singerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    maxWidth: '80%',
  },
  singerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0.82,
  },
  singerText: {
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: -0.2,
    includeFontPadding: false,
  },
  lyricBlock: {
    flex: 0,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 18,
  },
  miniLyricWrap: {
    width: '100%',
    overflow: 'hidden',
    alignItems: 'center',
  },
  miniLine: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  miniLineText: {
    textAlign: 'center',
    letterSpacing: -0.2,
    includeFontPadding: false,
  },
  recordShadow: {
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
    elevation: 12,
  },
  recordFace: {
    flex: 1,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  recordRing: {
    position: 'absolute',
    borderWidth: 1,
  },
  recordCenterShell: {
    position: 'absolute',
    backgroundColor: '#090b10',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  spindle: {
    position: 'absolute',
    overflow: 'hidden',
  },
  recordHighlight: {
    position: 'absolute',
    top: '12%',
    left: '16%',
    width: '28%',
    height: '22%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.045)',
    transform: [{ rotate: '-28deg' }],
  },
  armPivot: {
    position: 'absolute',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 8,
    zIndex: 3,
  },
  armBar: {
    position: 'absolute',
    transform: [{ rotate: '32deg' }],
    zIndex: 2,
  },
  armHead: {
    position: 'absolute',
    transform: [{ rotate: '32deg' }],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    zIndex: 2,
  },
})
