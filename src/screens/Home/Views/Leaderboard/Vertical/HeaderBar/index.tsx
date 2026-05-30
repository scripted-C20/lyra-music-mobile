import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { View, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native'
import SourceSelector, { type SourceSelectorType } from './SourceSelector'
import { useDS } from '@/theme/useDS'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import leaderboardState from '@/store/leaderboard/state'
import {
  useHeaderControlMetrics,
} from '../../../common/headerControls'

export interface HeaderBarProps {
  onShowBound: () => void
  onSourceChange: (source: LX.OnlineSource) => void
  onSelectBoard?: (id: string) => void
  onSearch?: (keyword: string) => void
  onPlayAll?: () => void
}

export interface HeaderBarType {
  setBound: (source: LX.OnlineSource, id: string, name: string) => void
}

export default forwardRef<HeaderBarType, HeaderBarProps>(({ onShowBound, onSourceChange, onSelectBoard, onSearch, onPlayAll }, ref) => {
  const sourceSelectorRef = useRef<SourceSelectorType>(null)
  const ds = useDS()
  const controlMetrics = useHeaderControlMetrics()
  const [activeId, setActiveId] = useState('')
  const [boards, setBoards] = useState<Array<{ id: string, name: string }>>([])
  const [currentBoardName, setCurrentBoardName] = useState('')
  const [searchText, setSearchText] = useState('')

  useImperativeHandle(ref, () => ({
    setBound(source, id, name) {
      sourceSelectorRef.current?.setSource(source)
      setActiveId(id)
      setCurrentBoardName(name)
      const board = leaderboardState.boards[source]
      const list = board?.list ?? []
      setBoards(list.map(b => ({ id: b.id, name: b.name })))
    },
  }), [])

  const handleSelectBoard = (id: string) => {
    setActiveId(id)
    onSelectBoard?.(id)
  }

  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text)
    onSearch?.(text.trim())
  }, [onSearch])

  const getBoardLabel = useCallback((board: { id: string, name?: string }) => {
    const label = typeof board.name === 'string' ? board.name.trim() : ''
    return label || board.id.split('__')[1] || global.i18n.t('nav_top')
  }, [])

  const displayBoards = useMemo(() => {
    const fallback = activeId && currentBoardName ? [{ id: activeId, name: currentBoardName }] : []
    if (!boards.length) return fallback

    const nextBoards = [...boards]
    const activeIndex = nextBoards.findIndex(board => board.id === activeId)
    if (activeIndex > 0) {
      const [activeBoard] = nextBoards.splice(activeIndex, 1)
      nextBoards.unshift(activeBoard)
    } else if (activeIndex < 0 && fallback.length) {
      nextBoards.unshift(fallback[0])
    }

    const seen = new Set<string>()
    return nextBoards.filter(board => {
      if (seen.has(board.id)) return false
      seen.add(board.id)
      return true
    }).slice(0, 12)
  }, [activeId, boards, currentBoardName])

  const chipBg = ds.isDark ? ds.bgFloat : '#FFFFFF'
  const mutedChipBg = ds.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.92)'
  return (
    <View style={[styles.wrapper, { backgroundColor: ds.isDark ? ds.bg : 'rgba(249,249,249,0.98)' }]}>
      <View style={[styles.row, { minHeight: controlMetrics.height, gap: controlMetrics.rowGap }]}>
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: mutedChipBg,
              borderColor: ds.separator,
              borderRadius: controlMetrics.radius,
              paddingHorizontal: Math.max(6, controlMetrics.horizontalPadding),
              height: controlMetrics.height,
              gap: controlMetrics.gap,
              width: controlMetrics.minSearchWidth,
            },
          ]}
        >
          <Icon name="search-2" size={controlMetrics.iconSize} color={ds.textDim} />
          <TextInput
            style={[styles.searchInput, { color: ds.text, fontSize: controlMetrics.inputFontSize, height: controlMetrics.height - 2 }]}
            placeholder="搜索"
            placeholderTextColor={ds.textDim}
            value={searchText}
            onChangeText={handleSearchChange}
            returnKeyType="search"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.controlsContent, { gap: controlMetrics.rowGap }]}
          style={styles.scroll}
        >
          <View
            style={[
              styles.sourceChip,
              {
                backgroundColor: mutedChipBg,
                borderColor: ds.separator,
                height: controlMetrics.height,
                borderRadius: controlMetrics.radius,
                width: Math.max(74, controlMetrics.minSearchWidth - 14),
              },
            ]}
          >
            <SourceSelector ref={sourceSelectorRef} onSourceChange={onSourceChange} />
          </View>

          {displayBoards.map(board => {
            const active = activeId === board.id
            const label = getBoardLabel(board)
            return (
              <TouchableOpacity
                key={board.id}
                activeOpacity={0.6}
                onPress={() => { if (!active) handleSelectBoard(board.id) }}
                style={[
                  styles.boardChip,
                  {
                    height: controlMetrics.height,
                    minWidth: Math.max(52, controlMetrics.height * 2),
                    maxWidth: Math.max(82, controlMetrics.height * 3),
                    paddingHorizontal: controlMetrics.horizontalPadding,
                    borderRadius: controlMetrics.radius,
                  },
                  active
                    ? { backgroundColor: ds.accent, borderColor: ds.accent }
                    : { backgroundColor: chipBg, borderColor: ds.separator },
                ]}
              >
                <Text
                  size={controlMetrics.fontSize}
                  color={active ? ds.textOnAccent : ds.text}
                  style={styles.boardText}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
        <View style={styles.rightActions}>
          {onPlayAll ? (
            <TouchableOpacity
              style={[
                styles.iconChip,
                {
                  backgroundColor: mutedChipBg,
                  width: controlMetrics.height,
                  height: controlMetrics.height,
                  borderRadius: controlMetrics.radius,
                },
              ]}
              activeOpacity={0.6}
              onPress={onPlayAll}
            >
              <Icon family="ionicons" name="play" size={controlMetrics.actionIconSize} color={ds.accent} />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={[
              styles.iconChip,
              {
                backgroundColor: mutedChipBg,
                width: controlMetrics.height,
                height: controlMetrics.height,
                borderRadius: controlMetrics.radius,
              },
            ]}
            activeOpacity={0.6}
            onPress={onShowBound}
          >
            <Icon family="ionicons" name="list" size={controlMetrics.actionIconSize + 1} color={ds.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 12,
    paddingTop: 0,
    paddingBottom: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
  },
  sourceChip: {
    flexShrink: 0,
  },
  scroll: {
    flex: 1,
  },
  controlsContent: {
    alignItems: 'center',
    paddingRight: 2,
  },
  boardChip: {
    paddingVertical: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boardText: {
    fontWeight: '500',
    includeFontPadding: false,
    textAlign: 'center',
  },
  iconChip: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
})
