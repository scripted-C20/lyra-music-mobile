import { useRef, useImperativeHandle, forwardRef, useState, useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import SearchTipList, { type SearchTipListProps as _SearchTipListProps, type SearchTipListType as _SearchTipListType } from '@/components/SearchTipList'
import Button from '@/components/common/Button'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { scaleSizeH } from '@/utils/pixelRatio'
import musicSdk from '@/utils/musicSdk'
import searchState, { type InitState as SearchState } from '@/store/search/state'
import { setSearchText, setTipList, setTipListInfo } from '@/core/search/search'
import { debounce } from '@/utils'
import { useDS } from '@/theme/useDS'
import { useHeaderControlMetrics } from '../common/headerControls'

export const ITEM_HEIGHT = scaleSizeH(42)

interface MusicSearchTipModule {
  tipSearch?: {
    search: (text: string) => Promise<string[]>
  }
  musicSearch?: {
    search: (text: string, page?: number, limit?: number) => Promise<{
      list?: Array<Partial<Pick<LX.Music.MusicInfoOnline, 'name' | 'singer'>>>
    }>
  }
}

const MAX_TIP_COUNT = 8

const normalizeTipText = (text: string) => text.replace(/\s+/g, ' ').trim()

const normalizeTipList = (keyword: string, list: string[]) => {
  const dedupe = new Set<string>()
  const result: string[] = []
  for (const item of list) {
    const text = normalizeTipText(item)
    if (!text || dedupe.has(text)) continue
    dedupe.add(text)
    result.push(text)
    if (result.length >= MAX_TIP_COUNT) break
  }

  const searchText = normalizeTipText(keyword)
  if (searchText && !dedupe.has(searchText)) result.unshift(searchText)
  return result.slice(0, MAX_TIP_COUNT)
}

const getRealSearchTipList = async(keyword: string, source: SearchState['temp_source'], sourceSdk: MusicSearchTipModule) => {
  if (!sourceSdk.musicSearch?.search) return []
  const result = await sourceSdk.musicSearch.search(keyword, 1, MAX_TIP_COUNT)
  return (result.list ?? []).map(info => {
    const name = normalizeTipText(String(info.name ?? ''))
    const singer = normalizeTipText(String(info.singer ?? ''))
    return `${name}${singer ? ` - ${singer}` : ''}`
  })
}

const getTipList = async(keyword: string, source: SearchState['temp_source']) => {
  const sourceSdk = (musicSdk[source] ?? {}) as MusicSearchTipModule
  let list: string[] = []

  if (sourceSdk.tipSearch?.search) {
    list = await sourceSdk.tipSearch.search(keyword).catch(() => [])
  }
  if (!list.length) {
    list = await getRealSearchTipList(keyword, source, sourceSdk).catch(() => [])
  }

  return normalizeTipList(keyword, list)
}

export const debounceTipSearch = debounce((keyword: string, source: SearchState['temp_source'], callback: (list: string[]) => void) => {
  void getTipList(keyword, source).then(callback).catch(() => {
    callback(normalizeTipList(keyword, []))
  })
}, 40)


export type SearchTipListProps = _SearchTipListProps<string>
export type SearchTipListType = _SearchTipListType<string>

interface TipListProps {
  onSearch: (keyword: string) => void
}
export interface TipListType {
  search: (keyword: string, height: number) => void
  show: (height: number) => void
  hide: () => void
}

export default forwardRef<TipListType, TipListProps>(({ onSearch }, ref) => {
  const searchTipListRef = useRef<SearchTipListType>(null)
  const ds = useDS()
  const controlMetrics = useHeaderControlMetrics()
  const lineColor = ds.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(60,60,67,0.12)'
  const iconBg = ds.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(180,39,39,0.08)'
  const [visible, setVisible] = useState(false)
  const visibleListRef = useRef(false)
  const isUnmountedRef = useRef(false)

  useEffect(() => {
    isUnmountedRef.current = false
    return () => {
      isUnmountedRef.current = true
    }
  }, [])

  const handleSearch = (keyword: string, height: number) => {
    searchTipListRef.current?.setHeight(height)
    setSearchText(keyword)
    if (keyword) {
      const source = searchState.temp_source
      setTipListInfo(keyword, source)
      setTipList([])
      searchTipListRef.current?.clearList()
      searchTipListRef.current?.setList(normalizeTipList(keyword, []))
      debounceTipSearch(keyword, source, (list) => {
        if (keyword != searchState.tipListInfo.text || source != searchState.tipListInfo.source) return
        setTipList(list)
        if (!visibleListRef.current || isUnmountedRef.current) return
        searchTipListRef.current?.setList(list)
      })
    } else {
      setTipListInfo(keyword, searchState.temp_source)
      setTipList([])
      searchTipListRef.current?.setList([])
    }
  }

  const handleShowList = (height: number) => {
    searchTipListRef.current?.setHeight(height)
    if (searchState.tipListInfo.list.length) {
      visibleListRef.current = true
      searchTipListRef.current?.setList([...searchState.tipListInfo.list])
    }
  }

  useImperativeHandle(ref, () => ({
    search(keyword, height) {
      visibleListRef.current = Boolean(keyword)
      if (visible) handleSearch(keyword, height)
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          handleSearch(keyword, height)
        })
      }
    },
    show(height) {
      visibleListRef.current = true
      if (visible) handleShowList(height)
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          handleShowList(height)
        })
      }
    },
    hide() {
      requestAnimationFrame(() => {
        visibleListRef.current = false
        searchTipListRef.current?.setList([])
      })
    },
  }), [visible])

  const renderItem: SearchTipListProps['renderItem'] = ({ item, index }) => {
    return (
      <Button
        style={[
          styles.item,
          index > 0 ? { borderTopColor: lineColor, borderTopWidth: StyleSheet.hairlineWidth } : null,
        ]}
        onPress={() => { onSearch(item) }}
        key={index}
      >
        <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
          <Icon name="search-2" size={controlMetrics.iconSize + 1} color={ds.accent} />
        </View>
        <Text size={controlMetrics.fontSize + 2} color={ds.text} numberOfLines={1} style={styles.itemText}>{item}</Text>
      </Button>
    )
  }
  const getkey: SearchTipListProps['keyExtractor'] = (item, index) => String(index)
  const getItemLayout: SearchTipListProps['getItemLayout'] = (data, index) => {
    return { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }
  }

  return (
    visible
      ? <SearchTipList
          ref={searchTipListRef}
          ListHeaderComponent={(
            <View style={[styles.header, { borderBottomColor: lineColor }]}>
              <Text size={controlMetrics.fontSize} color={ds.textDim}>预搜索建议</Text>
            </View>
          )}
          renderItem={renderItem}
          onPressBg={() => searchTipListRef.current?.setList([])}
          keyExtractor={getkey}
          getItemLayout={getItemLayout}
          contentContainerStyle={styles.listContent}
        />
      : null
  )
})


const styles = createStyle({
  header: {
    height: 32,
    paddingHorizontal: 18,
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  item: {
    height: ITEM_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 18,
    paddingRight: 18,
    gap: 12,
  },
  iconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemText: {
    flex: 1,
    fontWeight: '400',
  },
  listContent: {
    paddingBottom: 6,
  },
})
