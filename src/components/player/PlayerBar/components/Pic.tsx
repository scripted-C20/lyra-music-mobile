import { useCallback, useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'
import { useIsPlay, usePlayerMusicInfo, useStatusText } from '@/store/player/hook'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import Image from '@/components/common/Image'
import { setLoadErrorPicUrl, setMusicInfo } from '@/core/player/playInfo'
import Loading from '@/components/common/Loading'
import { useDS } from '@/theme/useDS'
import { isPlayerLoading } from '@/core/player/playStatus'

const SIZE = 38

export default ({ isHome }: { isHome: boolean }) => {
  const musicInfo = usePlayerMusicInfo()
  const statusText = useStatusText()
  const isPlay = useIsPlay()
  const ds = useDS()
  const isLoading = isPlayerLoading(statusText)
  const rotateAnim = useRef(new Animated.Value(0)).current
  const spinLoopRef = useRef<Animated.CompositeAnimation | null>(null)

  const handleError = useCallback((url: string | number) => {
    setLoadErrorPicUrl(url as string)
    setMusicInfo({ pic: null })
  }, [])

  useEffect(() => {
    rotateAnim.setValue(0)
  }, [musicInfo.id, rotateAnim])

  useEffect(() => {
    if (!musicInfo.pic || !isPlay) {
      spinLoopRef.current?.stop()
      spinLoopRef.current = null
      return
    }

    const animation = Animated.loop(Animated.timing(rotateAnim, {
      toValue: 1,
      duration: 8500,
      easing: Easing.linear,
      useNativeDriver: true,
    }))

    spinLoopRef.current = animation
    animation.start()

    return () => {
      animation.stop()
      spinLoopRef.current = null
    }
  }, [isPlay, musicInfo.pic, rotateAnim])

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  return (
    <View
      style={[
        styles.wrap,
        {
          shadowColor: isPlay ? ds.accent : '#000000',
        },
      ]}
    >
      <Animated.View style={{ transform: [{ rotate }] }}>
        <Image
          url={musicInfo.pic}
          nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pic}
          style={styles.image}
          onError={handleError}
        />
      </Animated.View>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <Loading color="#FFFFFF" size={14} />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 5,
  },
  image: { width: SIZE, height: SIZE, borderRadius: SIZE / 2 },
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
})
