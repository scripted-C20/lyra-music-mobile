import { memo, useMemo, useEffect, useRef, useCallback, useState } from 'react'
import { View, FlatList, type FlatListProps, type LayoutChangeEvent, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native'
// import { useLayout } from '@/utils/hooks'
import { type Line, useLrcPlay, useLrcSet } from '@/plugins/lyric'
import { createStyle } from '@/utils/tools'
// import { useComponentIds } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { useDS } from '@/theme/useDS'
import { useSettingValue } from '@/store/setting/hook'
import Text, { AnimatedColorText } from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { setSpText } from '@/utils/pixelRatio'
import playerState from '@/store/player/state'
import { scrollTo } from '@/utils/scroll'
import PlayLine, { type PlayLineType } from '../components/PlayLine'
// import { screenkeepAwake } from '@/utils/nativeModules/utils'
// import { log } from '@/utils/log'
// import { toast } from '@/utils/tools'

type FlatListType = FlatListProps<Line>

// const useLock = () => {
//   const showCommentRef = useRef(false)


//   useEffect(() => {
//     let appstateListener = AppState.addEventListener('change', (state) => {
//       switch (state) {
//         case 'active':
//           if (showLyricRef.current && !showCommentRef.current) screenkeepAwake()
//           break
//         case 'background':
//           screenUnkeepAwake()
//           break
//       }
//     })
//     return () => {
//       appstateListener.remove()
//     }
//   }, [])
//   useEffect(() => {
//     let listener: ReturnType<typeof onNavigationComponentDidDisappearEvent>
//     showCommentRef.current = !!componentIds.comment
//     if (showCommentRef.current) {
//       if (showLyricRef.current) screenUnkeepAwake()
//       listener = onNavigationComponentDidDisappearEvent(componentIds.comment as string, () => {
//         if (showLyricRef.current && AppState.currentState == 'active') screenkeepAwake()
//       })
//     }

//     const rm = global.state_event.on('componentIdsUpdated', (ids) => {

//     })

//     return () => {
//       if (listener) listener.remove()
//     }
//   }, [])
// }

interface LineProps {
  line: Line
  lineNum: number
  activeLine: number
  onLayout: (lineNum: number, height: number, width: number) => void
}

const isInfoLine = (text: string, lineNum: number) => {
  const value = text.trim()
  return /^(词|作词|曲|作曲|编曲|和声|监制|制作人|录音|混音|母带|统筹|策划|lyrics|lyricist|composer|arranger|producer)\s*[：:]/i.test(value) ||
    (lineNum <= 1 && value.includes(' - '))
}

const hasVisibleLine = (line: Line) => {
  return !!line.text.trim() || line.extendedLyrics.some(text => !!text.trim())
}

const findFirstVisibleLineIndex = (lines: Line[]) => {
  const index = lines.findIndex(hasVisibleLine)
  return index < 0 ? 0 : index
}

const LrcLine = memo(({ line, lineNum, activeLine, onLayout }: LineProps) => {
  const theme = useTheme()
  const lrcFontSize = useSettingValue('playDetail.vertical.style.lrcFontSize')
  const textAlign = useSettingValue('playDetail.style.align')
  const size = Math.max(15.5, Math.min(lrcFontSize / 10 * 0.86, 18.5))
  const infoLine = isInfoLine(line.text, lineNum)
  const displaySize = infoLine ? size * 0.82 : size
  const lineHeight = setSpText(displaySize) * (infoLine ? 1.18 : 1.24)

  const colors = useMemo(() => {
    const active = activeLine == lineNum
    return active ? [
      theme['c-primary-dark-200'],
      theme['c-primary-dark-200-alpha-300'],
      1,
    ] as const : [
      theme['c-font'],
      theme['c-font-label'],
      0.62,
    ] as const
  }, [activeLine, lineNum, theme])

  const handleLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    onLayout(lineNum, nativeEvent.layout.height, nativeEvent.layout.width)
  }


  // textBreakStrategy="simple" 用于解决某些设备上字体被截断的问题
  // https://stackoverflow.com/a/72822360
  return (
    <View style={styles.line} onLayout={handleLayout}>
      <AnimatedColorText style={{
        ...styles.lineText,
        textAlign,
        lineHeight,
        fontWeight: activeLine == lineNum ? '700' : '500',
      }} textBreakStrategy="simple" color={colors[0]} opacity={infoLine ? Math.min(colors[2], 0.88) : colors[2]} size={displaySize}>{line.text}</AnimatedColorText>
      {
        line.extendedLyrics.map((lrc, index) => {
          return (<AnimatedColorText style={{
            ...styles.lineTranslationText,
            textAlign,
            lineHeight: lineHeight * 0.78,
          }} textBreakStrategy="simple" key={index} color={colors[1]} opacity={colors[2]} size={displaySize * 0.76}>{lrc}</AnimatedColorText>)
        })
      }
    </View>
  )
}, (prevProps, nextProps) => {
  return prevProps.line === nextProps.line &&
    prevProps.activeLine != nextProps.lineNum &&
    nextProps.activeLine != nextProps.lineNum
})
const wait = async() => new Promise(resolve => setTimeout(resolve, 100))
const DEFAULT_LYRIC_HEIGHT = 360
const DEFAULT_LINE_HEIGHT = 46

const getCenterPosition = (height: number) => {
  if (!Number.isFinite(height) || height <= 0) return 0.34
  if (height >= 620) return 0.46
  if (height >= 500) return 0.43
  if (height >= 380) return 0.4
  return 0.36
}

const getVisibleTailCount = (lines: Line[], index: number) => {
  if (index < 0) return lines.filter(hasVisibleLine).length
  return lines.slice(index + 1).filter(hasVisibleLine).length
}

const getActiveViewPosition = (height: number, lines: Line[], index: number) => {
  const basePosition = getCenterPosition(height)
  const tailCount = getVisibleTailCount(lines, index)

  if (tailCount <= 2) return Math.min(0.63, basePosition + 0.17)
  if (tailCount <= 5) return Math.min(0.58, basePosition + 0.12)
  if (tailCount <= 8) return Math.min(0.53, basePosition + 0.07)
  return basePosition
}

const getFallbackSpaceHeight = (height: number, lineCount: number) => {
  const safeHeight = Number.isFinite(height) && height > 0 ? height : DEFAULT_LYRIC_HEIGHT
  const compactMax = lineCount <= 5 ? 42 : lineCount <= 10 ? 68 : 96
  const compactRatio = lineCount <= 5 ? 0.09 : lineCount <= 10 ? 0.14 : 0.18
  return Math.max(14, Math.min(compactMax, safeHeight * compactRatio))
}

const getMeasuredLineHeight = (lineHeights: number[], lineCount: number) => {
  const measured = lineHeights.filter(height => Number.isFinite(height) && height > 0)
  if (!measured.length) return DEFAULT_LINE_HEIGHT
  const average = measured.reduce((total, height) => total + height, 0) / measured.length
  if (!Number.isFinite(average) || average <= 0) return DEFAULT_LINE_HEIGHT
  return Math.max(32, Math.min(68, average))
}

const getDynamicSpaceHeight = (height: number, lineCount: number, lineHeights: number[]) => {
  const safeHeight = Number.isFinite(height) && height > 0 ? height : DEFAULT_LYRIC_HEIGHT
  if (!lineCount) return 0
  const lineHeight = getMeasuredLineHeight(lineHeights, lineCount)
  const measuredTotalHeight = lineHeights.reduce((total, item) => {
    return total + (Number.isFinite(item) && item > 0 ? item : lineHeight)
  }, 0)
  const estimatedTotalHeight = Math.max(measuredTotalHeight, lineCount * lineHeight)
  const compactFallback = getFallbackSpaceHeight(safeHeight, lineCount)
  const activeLineCenter = safeHeight * getCenterPosition(safeHeight) - lineHeight * 0.5
  const shortLyricSpace = Math.max(10, Math.min(38, (safeHeight - estimatedTotalHeight) * 0.18))

  if (lineCount <= 2) return shortLyricSpace
  if (estimatedTotalHeight <= safeHeight * 0.62) {
    return Math.max(10, Math.min(compactFallback, shortLyricSpace))
  }
  return Math.max(12, Math.min(safeHeight * 0.18, activeLineCenter))
}

const getDynamicFooterHeight = (height: number, lineCount: number, headerHeight: number, lineHeights: number[]) => {
  const safeHeight = Number.isFinite(height) && height > 0 ? height : DEFAULT_LYRIC_HEIGHT
  if (!lineCount) return 0
  const lineHeight = getMeasuredLineHeight(lineHeights, lineCount)
  const measuredTotalHeight = lineHeights.reduce((total, item) => {
    return total + (Number.isFinite(item) && item > 0 ? item : lineHeight)
  }, 0)
  const contentRatio = measuredTotalHeight / safeHeight
  if (contentRatio < 0.55) return Math.max(6, Math.min(18, safeHeight * 0.028))
  if (lineCount <= 2) return Math.max(8, Math.min(20, safeHeight * 0.034))
  if (lineCount <= 6) return Math.max(12, Math.min(28, safeHeight * 0.045))
  return Math.max(18, Math.min(42, safeHeight * 0.06, headerHeight * 0.46))
}

export default () => {
  const lyricLines = useLrcSet()
  const { line } = useLrcPlay()
  const ds = useDS()
  const flatListRef = useRef<FlatList>(null)
  const playLineRef = useRef<PlayLineType>(null)
  const isPauseScrollRef = useRef(true)
  const scrollTimoutRef = useRef<NodeJS.Timeout | null>(null)
  const delayScrollTimeout = useRef<NodeJS.Timeout | null>(null)
  const lineRef = useRef({ line: 0, prevLine: 0 })
  const isFirstSetLrc = useRef(true)
  const scrollInfoRef = useRef<NativeSyntheticEvent<NativeScrollEvent>['nativeEvent'] | null>(null)
  const listLayoutInfoRef = useRef<{ spaceHeight: number, lineHeights: number[] }>({ spaceHeight: 0, lineHeights: [] })
  const scrollCancelRef = useRef<(() => void) | null>(null)
  const layoutUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isShowLyricProgressSetting = useSettingValue('playDetail.isShowLyricProgressSetting')
  const [containerHeight, setContainerHeight] = useState(DEFAULT_LYRIC_HEIGHT)
  const [lineLayoutVersion, setLineLayoutVersion] = useState(0)
  // useLock()
  // const [imgUrl, setImgUrl] = useState(null)
  // const theme = useGetter('common', 'theme')
  // const { onLayout, ...layout } = useLayout()

  // useEffect(() => {
  //   const url = playMusicInfo ? playMusicInfo.musicInfo.img : null
  //   if (imgUrl == url) return
  //   setImgUrl(url)
  // // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [playMusicInfo])

  // const imgWidth = useMemo(() => layout.width * 0.75, [layout.width])
  const handleScrollToActive = (index = lineRef.current.line) => {
    if (index < 0) return
    if (flatListRef.current) {
      // console.log('handleScrollToActive', index)
      const viewPosition = getActiveViewPosition(scrollInfoRef.current?.layoutMeasurement.height ?? containerHeight, lyricLines, index)
      if (scrollInfoRef.current && lineRef.current.line - lineRef.current.prevLine == 1) {
        let offset = listLayoutInfoRef.current.spaceHeight
        for (let line = 0; line < index; line++) {
          offset += listLayoutInfoRef.current.lineHeights[line]
        }
        offset += (listLayoutInfoRef.current.lineHeights[line] ?? 0) / 2
        try {
          scrollCancelRef.current = scrollTo(flatListRef.current, scrollInfoRef.current, offset - scrollInfoRef.current.layoutMeasurement.height * viewPosition, 600, () => {
            scrollCancelRef.current = null
          })
        } catch {}
      } else {
        if (scrollCancelRef.current) {
          scrollCancelRef.current()
          scrollCancelRef.current = null
        }
        try {
          flatListRef.current.scrollToIndex({
            index,
            animated: true,
            viewPosition,
          })
        } catch {}
      }
    }
  }

  const handleScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollInfoRef.current = nativeEvent
    if (isPauseScrollRef.current) {
      playLineRef.current?.updateScrollInfo(nativeEvent)
    }
  }
  const handleScrollBeginDrag = () => {
    isPauseScrollRef.current = true
    playLineRef.current?.setVisible(true)
    if (delayScrollTimeout.current) {
      clearTimeout(delayScrollTimeout.current)
      delayScrollTimeout.current = null
    }
    if (scrollTimoutRef.current) {
      clearTimeout(scrollTimoutRef.current)
      scrollTimoutRef.current = null
    }
    if (scrollCancelRef.current) {
      scrollCancelRef.current()
      scrollCancelRef.current = null
    }
  }

  const onScrollEndDrag = () => {
    if (!isPauseScrollRef.current) return
    if (scrollTimoutRef.current) clearTimeout(scrollTimoutRef.current)
    scrollTimoutRef.current = setTimeout(() => {
      playLineRef.current?.setVisible(false)
      scrollTimoutRef.current = null
      isPauseScrollRef.current = false
      if (!playerState.isPlay) return
      handleScrollToActive()
    }, 3000)
  }


  useEffect(() => {
    return () => {
      if (layoutUpdateTimeoutRef.current) {
        clearTimeout(layoutUpdateTimeoutRef.current)
        layoutUpdateTimeoutRef.current = null
      }
      if (delayScrollTimeout.current) {
        clearTimeout(delayScrollTimeout.current)
        delayScrollTimeout.current = null
      }
      if (scrollTimoutRef.current) {
        clearTimeout(scrollTimoutRef.current)
        scrollTimoutRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    // linesRef.current = lyricLines
    listLayoutInfoRef.current.lineHeights = []
    setLineLayoutVersion(version => version + 1)
    lineRef.current.prevLine = 0
    const initialLine = findFirstVisibleLineIndex(lyricLines)
    lineRef.current.line = initialLine
    if (!flatListRef.current) return
    flatListRef.current.scrollToOffset({
      offset: 0,
      animated: false,
    })
    if (!lyricLines.length) return
    playLineRef.current?.updateLyricLines(lyricLines)
    requestAnimationFrame(() => {
      if (isFirstSetLrc.current) {
        isFirstSetLrc.current = false
        setTimeout(() => {
          isPauseScrollRef.current = false
          handleScrollToActive(initialLine)
        }, 100)
      } else {
        if (delayScrollTimeout.current) clearTimeout(delayScrollTimeout.current)
        delayScrollTimeout.current = setTimeout(() => {
          handleScrollToActive(initialLine)
        }, 100)
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lyricLines])

  useEffect(() => {
    if (line < 0) return
    lineRef.current.prevLine = lineRef.current.line
    lineRef.current.line = line
    if (!flatListRef.current || isPauseScrollRef.current) return

    if (line - lineRef.current.prevLine != 1) {
      handleScrollToActive()
      return
    }

    delayScrollTimeout.current = setTimeout(() => {
      delayScrollTimeout.current = null
      handleScrollToActive()
    }, 600)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line])

  useEffect(() => {
    requestAnimationFrame(() => {
      playLineRef.current?.updateLayoutInfo(listLayoutInfoRef.current)
      playLineRef.current?.updateLyricLines(lyricLines)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isShowLyricProgressSetting])

  const handleScrollToIndexFailed: FlatListType['onScrollToIndexFailed'] = (info) => {
    void wait().then(() => {
      handleScrollToActive(info.index)
    })
  }

  const scheduleLayoutUpdate = useCallback(() => {
    if (layoutUpdateTimeoutRef.current) return
    layoutUpdateTimeoutRef.current = setTimeout(() => {
      layoutUpdateTimeoutRef.current = null
      playLineRef.current?.updateLayoutInfo(listLayoutInfoRef.current)
      setLineLayoutVersion(version => version + 1)
    }, 80)
  }, [])

  const handleLineLayout = useCallback<LineProps['onLayout']>((lineNum, height) => {
    const prevHeight = listLayoutInfoRef.current.lineHeights[lineNum]
    if (Math.abs((prevHeight ?? 0) - height) <= 1) return
    listLayoutInfoRef.current.lineHeights[lineNum] = height
    scheduleLayoutUpdate()
  }, [scheduleLayoutUpdate])

  const handleSpaceLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
    listLayoutInfoRef.current.spaceHeight = nativeEvent.layout.height
    playLineRef.current?.updateLayoutInfo(listLayoutInfoRef.current)
  }, [])
  const handleContainerLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
    const nextHeight = nativeEvent.layout.height
    if (!Number.isFinite(nextHeight) || nextHeight <= 0) return
    setContainerHeight(prevHeight => Math.abs(prevHeight - nextHeight) > 2 ? nextHeight : prevHeight)
  }, [])

  const handlePlayLine = useCallback((time: number) => {
    playLineRef.current?.setVisible(false)
    global.app_event.setProgress(time)
  }, [])

  const renderItem: FlatListType['renderItem'] = ({ item, index }) => {
    return (
      <LrcLine line={item} lineNum={index} activeLine={line} onLayout={handleLineLayout} />
    )
  }
  const getkey: FlatListType['keyExtractor'] = (item, index) => `${index}${item.text}`

  const emptyComponent = useMemo(() => (
    <View style={styles.empty}>
      <View style={[
        styles.emptyIcon,
        {
          backgroundColor: ds.accentSoft,
          borderColor: ds.separator,
        },
      ]}>
        <Icon family="ionicons" name="musical-notes-outline" size={20} color={ds.accent} />
      </View>
      <Text size={15} color={ds.text} style={styles.emptyTitle}>暂无歌词</Text>
      <Text size={12} color={ds.textMuted} style={styles.emptyDesc}>当前歌曲暂时没有可显示的歌词</Text>
    </View>
  ), [ds])
  const hasLyric = useMemo(() => lyricLines.some(hasVisibleLine), [lyricLines])
  const visibleLineCount = useMemo(() => lyricLines.filter(hasVisibleLine).length, [lyricLines])
  const spaceHeight = useMemo(() => {
    return getDynamicSpaceHeight(containerHeight, visibleLineCount, listLayoutInfoRef.current.lineHeights)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerHeight, lineLayoutVersion, visibleLineCount])
  const footerHeight = useMemo(() => {
    return getDynamicFooterHeight(containerHeight, visibleLineCount, spaceHeight, listLayoutInfoRef.current.lineHeights)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerHeight, lineLayoutVersion, spaceHeight, visibleLineCount])
  const headerSpaceComponent = useMemo(() => (
    <View style={{ height: spaceHeight }} onLayout={handleSpaceLayout}></View>
  ), [handleSpaceLayout, spaceHeight])
  const footerSpaceComponent = useMemo(() => (
    <View style={{ height: footerHeight }}></View>
  ), [footerHeight])

  return (
    <>
      <FlatList
        data={hasLyric ? lyricLines : []}
        renderItem={renderItem}
        keyExtractor={getkey}
        style={styles.container}
        onLayout={handleContainerLayout}
        contentContainerStyle={hasLyric ? styles.content : styles.emptyContent}
        ref={flatListRef}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={hasLyric ? headerSpaceComponent : null}
        ListEmptyComponent={emptyComponent}
        ListFooterComponent={hasLyric ? footerSpaceComponent : null}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        fadingEdgeLength={100}
        initialNumToRender={Math.max(line + 10, 10)}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        onScroll={handleScroll}
      />
      { isShowLyricProgressSetting && hasLyric ? <PlayLine ref={playLineRef} onPlayLine={handlePlayLine} /> : null }
    </>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
    paddingLeft: 26,
    paddingRight: 26,
  },
  content: {
    paddingBottom: 0,
  },
  emptyContent: {
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 14,
    paddingRight: 14,
    paddingBottom: 28,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 5,
    textAlign: 'center',
  },
  emptyDesc: {
    fontWeight: '500',
    textAlign: 'center',
  },
  space: {
    height: 116,
  },
  line: {
    paddingTop: 13,
    paddingBottom: 13,
  },
  lineText: {
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: -0.25,
  },
  lineTranslationText: {
    textAlign: 'center',
    paddingTop: 8,
    letterSpacing: 0,
  },
})
