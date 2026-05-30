import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, View, StyleSheet, type LayoutChangeEvent, type NativeSyntheticEvent, type TextLayoutEventData } from 'react-native'
import { pop } from '@/navigation'
import StatusBar from '@/components/common/StatusBar'
import { useDS } from '@/theme/useDS'
import { usePlayerMusicInfo } from '@/store/player/hook'
import Text, { AnimatedText } from '@/components/common/Text'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT as _HEADER_HEIGHT, NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import commonState from '@/store/common/state'
import SettingPopup, { type SettingPopupType } from '../../components/SettingPopup'
import { useStatusbarHeight } from '@/store/common/hook'
import Btn from './Btn'

export const HEADER_HEIGHT = scaleSizeH(_HEADER_HEIGHT)
export const PAGE_SIDE_PADDING = 18
const TOP_SAFE_GAP = 8
const TITLE_SCROLL_GAP = 52
const TITLE_SCROLL_PAUSE = 900
const TITLE_SCROLL_SPEED = 38
const TITLE_MEASURE_WIDTH = 10000

const Title = () => {
  const ds = useDS()
  const musicInfo = usePlayerMusicInfo()
  const translateX = useRef(new Animated.Value(0)).current
  const [containerWidth, setContainerWidth] = useState(0)
  const [textWidth, setTextWidth] = useState(0)

  const title = useMemo(() => {
    const name = (musicInfo.name || '').trim()
    const singer = (musicInfo.singer || '').trim()
    if (name && singer) return `${name} - ${singer}`
    return name || singer
  }, [musicInfo.name, musicInfo.singer])

  const overflow = textWidth > containerWidth + 1

  useEffect(() => {
    translateX.stopAnimation()
    translateX.setValue(0)

    if (!overflow || containerWidth <= 0 || textWidth <= 0) return

    const distance = textWidth + TITLE_SCROLL_GAP
    const duration = Math.max(3600, Math.round((distance / TITLE_SCROLL_SPEED) * 1000))
    const animation = Animated.loop(Animated.sequence([
      Animated.delay(TITLE_SCROLL_PAUSE),
      Animated.timing(translateX, {
        toValue: -distance,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]))

    animation.start()
    return () => { animation.stop() }
  }, [containerWidth, overflow, textWidth, title, translateX])

  const handleContainerLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    const nextWidth = nativeEvent.layout.width
    if (Number.isFinite(nextWidth) && nextWidth > 0) setContainerWidth(nextWidth)
  }

  const updateTextWidth = (nextWidth: number) => {
    if (!Number.isFinite(nextWidth) || nextWidth <= 0) return
    setTextWidth(prevWidth => Math.abs(prevWidth - nextWidth) > 1 ? nextWidth : prevWidth)
  }

  const handleTextLayout = ({ nativeEvent }: NativeSyntheticEvent<TextLayoutEventData>) => {
    const nextWidth = nativeEvent.lines?.[0]?.width
    if (typeof nextWidth == 'number') updateTextWidth(nextWidth)
  }

  return (
    <View style={styles.titleBlock} onLayout={handleContainerLayout}>
      <View style={[styles.titleViewport, overflow ? styles.titleViewportLeft : styles.titleViewportCenter]}>
        <Animated.View
          style={[
            overflow ? styles.marqueeTrack : styles.staticTitleTrack,
            {
              transform: [{ translateX: overflow ? translateX : 0 }],
            },
          ]}
        >
          <AnimatedText
            numberOfLines={1}
            size={17}
            style={[
              styles.name,
              {
                width: overflow ? textWidth : '100%',
                color: ds.text,
                textAlign: overflow ? 'left' : 'center',
              },
            ]}
          >
            {title}
          </AnimatedText>
          {overflow ? (
            <>
              <View style={{ width: TITLE_SCROLL_GAP }} />
              <AnimatedText
                numberOfLines={1}
                size={17}
                style={[
                  styles.name,
                  {
                    width: textWidth,
                    color: ds.text,
                    textAlign: 'left',
                  },
                ]}
              >
                {title}
              </AnimatedText>
            </>
          ) : null}
        </Animated.View>
      </View>
      <View pointerEvents="none" style={styles.measureWrap}>
        <Text
          numberOfLines={1}
          size={17}
          style={[styles.name, styles.measureText]}
          onTextLayout={handleTextLayout}
          onLayout={({ nativeEvent }) => { updateTextWidth(nativeEvent.layout.width) }}
        >
          {title}
        </Text>
      </View>
    </View>
  )
}

export default memo(() => {
  const popupRef = useRef<SettingPopupType>(null)
  const statusBarHeight = useStatusbarHeight()

  const back = () => { void pop(commonState.componentIds.playDetail!) }
  const showSetting = () => { popupRef.current?.show() }

  return (
    <View
      style={[styles.wrap, { height: statusBarHeight + HEADER_HEIGHT + 14 }]}
      nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_header}
    >
      <StatusBar />
      <View style={[styles.row, { paddingTop: statusBarHeight + TOP_SAFE_GAP }]}>
        <View style={styles.sideSlot}>
          <Btn icon="chevron-left" onPress={back} />
        </View>

        <View style={styles.centerSpacer} />

        <View style={styles.sideSlot}>
          <Btn icon="slider" onPress={showSetting} />
        </View>
      </View>
      <View pointerEvents="none" style={[styles.titleWrap, { top: statusBarHeight + TOP_SAFE_GAP }]}>
        <Title />
      </View>
      <SettingPopup ref={popupRef} direction="vertical" />
    </View>
  )
})

const styles = StyleSheet.create({
  wrap: {
    height: HEADER_HEIGHT + 26,
    position: 'relative',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PAGE_SIDE_PADDING,
  },
  sideSlot: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  centerSpacer: {
    flex: 1,
  },
  titleWrap: {
    position: 'absolute',
    left: PAGE_SIDE_PADDING + 48,
    right: PAGE_SIDE_PADDING + 48,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  titleBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 38,
  },
  titleViewport: {
    width: '100%',
    overflow: 'hidden',
  },
  titleViewportCenter: {
    alignItems: 'center',
  },
  titleViewportLeft: {
    alignItems: 'flex-start',
  },
  staticTitleTrack: {
    width: '100%',
  },
  marqueeTrack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.45,
    includeFontPadding: false,
    textShadowColor: 'rgba(255,255,255,0.22)',
    textShadowOffset: { width: 0, height: 0.8 },
    textShadowRadius: 5,
  },
  measureText: {
    alignSelf: 'flex-start',
    textAlign: 'left',
  },
  measureWrap: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: TITLE_MEASURE_WIDTH,
    opacity: 0,
    zIndex: -1,
    overflow: 'visible',
  },
})
