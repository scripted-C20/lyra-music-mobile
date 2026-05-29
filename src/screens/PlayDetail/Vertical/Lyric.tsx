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

const getCenterPosition = (height: number) => {
  if (!Number.isFinite(height) || height <= 0) return 0.34
  if (height >= 620) return 0.42
  if (height >= 500) return 0.39
  if (height >= 380) return 0.36
  return 0.32
}

const getSpaceHeight = (height: number) => {
  const safeHeight = Number.isFinite(height) && height > 0 ? height : DEFAULT_LYRIC_HEIGHT
  return Math.max(42, Math.min(180, safeHeight * 0.32))
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
  const isShowLyricProgressSetting = useSettingValue('playDetail.isShowLyricProgressSetting')
  const [containerHeight, setContainerHeight] = useState(DEFAULT_LYRIC_HEIGHT)
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
      if (scrollInfoRef.current && lineRef.current.line - lineRef.current.prevLine == 1) {
        let offset = listLayoutInfoRef.current.spaceHeight
        for (let line = 0; line < index; line++) {
          offset += listLayoutInfoRef.current.lineHeights[line]
        }
        offset += (listLayoutInfoRef.current.lineHeights[line] ?? 0) / 2
        try {
          const viewPosition = getCenterPosition(scrollInfoRef.current.layoutMeasurement.height)
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
            viewPosition: getCenterPosition(containerHeight),
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

  const handleLineLayout = useCallback<LineProps['onLayout']>((lineNum, height) => {
    listLayoutInfoRef.current.lineHeights[lineNum] = height
    playLineRef.current?.updateLayoutInfo(listLayoutInfoRef.current)
  }, [])

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

  const spaceComponent = useMemo(() => (
    <View style={{ height: getSpaceHeight(containerHeight) }} onLayout={handleSpaceLayout}></View>
  ), [containerHeight, handleSpaceLayout])
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
        ListHeaderComponent={hasLyric ? spaceComponent : null}
        ListEmptyComponent={emptyComponent}
        ListFooterComponent={hasLyric ? spaceComponent : null}
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
    paddingBottom: 14,
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
