import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { type NativeScrollEvent, type NativeSyntheticEvent, View, TouchableOpacity, Animated } from 'react-native'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import { type Lines } from 'lrc-file-parser'
import { useTheme } from '@/store/theme/hook'
import { BorderWidths } from '@/theme'
import { formatPlayTime2 } from '@/utils'
import { Icon } from '@/components/common/Icon'


export interface PlayLineType {
  updateScrollInfo: (scrollInfo: NativeSyntheticEvent<NativeScrollEvent>['nativeEvent'] | null) => void
  updateLayoutInfo: (listLayoutInfo: { spaceHeight: number, lineHeights: number[] }) => void
  updateLyricLines: (lyricLines: Lines) => void
  setVisible: (visible: boolean) => void
}

export interface PlayLineProps {
  onPlayLine: (time: number) => void
}

const ANIMATION_DURATION = 300

export default forwardRef<PlayLineType, PlayLineProps>(({ onPlayLine }, ref) => {
  const theme = useTheme()
  const [scrollInfo, setScrollInfo] = useState<NativeSyntheticEvent<NativeScrollEvent>['nativeEvent'] | null>(null)
  const [listLayoutInfo, setListLayoutInfo] = useState<{ spaceHeight: number, lineHeights: number[] }>({ spaceHeight: 0, lineHeights: [] })
  const [lyricLines, setLyricLines] = useState<Lines>([])
  const [visible, setVisible] = useState(false)
  const opsAnim = useRef<Animated.Value>(
    new Animated.Value(0),
  ).current

  const setShow = (visible: boolean) => {
    Animated.timing(opsAnim, {
      toValue: visible ? 1 : 0,
      duration: ANIMATION_DURATION,
      useNativeDriver: true,
    }).start(() => {
      if (!visible) setVisible(false)
    })
  }

  useImperativeHandle(ref, () => ({
    updateScrollInfo(scrollInfo) {
      setScrollInfo(scrollInfo)
    },
    updateLayoutInfo(listLayoutInfo) {
      setListLayoutInfo(listLayoutInfo)
    },
    updateLyricLines(lyricLines) {
      setLyricLines(lyricLines)
    },
    setVisible(visible) {
      if (visible) {
        setVisible(true)
      }
      requestAnimationFrame(() => {
        setShow(visible)
      })
      // setVisible()
    },
  }))

  const handlePlayLine = () => {
    onPlayLine(time / 1000)
  }

  if (!scrollInfo || !visible) return null
  const offset = scrollInfo.contentOffset.y + scrollInfo.layoutMeasurement.height * 0.4
  let lineOffset = listLayoutInfo.spaceHeight
  let targetLineNum = -1
  for (let line = 0; line < listLayoutInfo.lineHeights.length; line++) {
    lineOffset += listLayoutInfo.lineHeights[line]
    if (lineOffset < offset) continue
    targetLineNum = line
    break
  }
  if (targetLineNum == -1) targetLineNum = listLayoutInfo.lineHeights.length - 1
  const time = lyricLines[targetLineNum]?.time ?? 0
  const timeLabel = formatPlayTime2(time / 1000)
  return (
    <Animated.View style={{ ...styles.playLine, opacity: opsAnim }}>
      <View style={styles.lineContent}>
        <View style={{ ...styles.label, backgroundColor: theme['c-main-background'], borderColor: theme['c-border-background'] }}>
          <Text color={theme['c-primary-dark-200']} size={12}>{timeLabel}</Text>
        </View>
        <View style={{ ...styles.line, borderBottomColor: theme['c-primary-dark-200-alpha-700'] }} />
        <TouchableOpacity style={{ ...styles.button, backgroundColor: theme['c-primary-dark-200'] }} onPress={handlePlayLine}>
          <Icon name="play" color={theme['c-main-background']} size={16} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  )
})

const styles = createStyle({
  playLine: {
    position: 'absolute',
    width: '100%',
    top: '43%',
    left: 0,
    height: 2,
  },
  label: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  lineContent: {
    position: 'absolute',
    width: '100%',
    height: 32,
    top: -16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
  },
  line: {
    borderBottomWidth: BorderWidths.normal2,
    borderStyle: 'solid',
    flex: 1,
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
