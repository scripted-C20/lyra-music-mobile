import { useRef, useEffect, useCallback } from 'react'
import { View, type LayoutChangeEvent } from 'react-native'

import HeaderBar, { type HeaderBarProps, type HeaderBarType } from './HeaderBar'
import searchState, { type SearchType } from '@/store/search/state'
import searchMusicState, { type Source as MusicSource } from '@/store/search/music/state'
import searchSonglistState, { type Source as SonglistSource } from '@/store/search/songlist/state'
import { getSearchSetting, saveSearchSetting } from '@/utils/data'
import { createStyle } from '@/utils/tools'
import List, { type ListType } from './List'
import TipList, { type TipListType } from './TipList'
import { addHistoryWord, setSearchText, setTempSource } from '@/core/search/search'
import { useBackHandler } from '@/utils/hooks/useBackHandler'
import commonState from '@/store/common/state'
import { setNavActiveId } from '@/core/common'

interface SearchInfo {
  temp_source: LX.OnlineSource
  source: LX.OnlineSource | 'all'
  searchType: 'music' | 'songlist'
}

const getSourceList = (type: SearchType) => {
  return type == 'music' ? searchMusicState.sources : searchSonglistState.sources
}

const getDirectSourceList = (type: SearchType) => {
  return getSourceList(type).filter((source): source is LX.OnlineSource => source != 'all')
}

const resolveTempSource = (type: SearchType, source: LX.OnlineSource) => {
  const list = getDirectSourceList(type)
  return list.includes(source) ? source : list[0]
}

const resolveSource = (type: SearchType, source: SearchInfo['source'], tempSource: LX.OnlineSource) => {
  const list = getSourceList(type)
  if (list.includes(source)) return source
  return resolveTempSource(type, tempSource)
}

export default () => {
  const headerBarRef = useRef<HeaderBarType>(null)
  const listRef = useRef<ListType>(null)
  const tipListRef = useRef<TipListType>(null)
  const contentHeightRef = useRef(0)
  const lastKeywordRef = useRef(searchState.searchText)
  const searchInfo = useRef<SearchInfo>({ temp_source: 'kw', source: 'kw', searchType: 'music' })

  useBackHandler(useCallback(() => {
    if (global.lx.isSonglistDetailFromSearch && commonState.componentIds.songlistDetail) return false
    if (commonState.navActiveId != 'nav_search') return false
    setNavActiveId(commonState.lastNavActiveId == 'nav_search' ? 'nav_songlist' : commonState.lastNavActiveId)
    return true
  }, []))

  const loadSearchList = useCallback((text: string) => {
    const info = searchInfo.current
    listRef.current?.loadList(text, {
      music: resolveSource('music', info.source, info.temp_source) as MusicSource,
      songlist: resolveSource('songlist', info.source, info.temp_source) as SonglistSource,
    }, info.searchType)
  }, [])

  const handleSearch = useCallback((text: string) => {
    const keyword = text.trim()
    tipListRef.current?.hide()
    headerBarRef.current?.setText(keyword)
    headerBarRef.current?.blur()
    lastKeywordRef.current = keyword
    setSearchText(keyword)
    global.app_event.topNavSearchTextUpdate(keyword)
    void addHistoryWord(keyword)
    loadSearchList(keyword)
  }, [loadSearchList])

  const clearSearch = useCallback(() => {
    global.lx.shouldClearSearchOnOpen = false
    tipListRef.current?.hide()
    lastKeywordRef.current = ''
    setSearchText('')
    global.app_event.topNavSearchTextUpdate('')
    global.app_event.topNavSearchTextChange('')
    loadSearchList('')
  }, [loadSearchList])

  const handleContentLayout = useCallback(({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    contentHeightRef.current = layout.height
  }, [])

  useEffect(() => {
    void getSearchSetting().then(info => {
      const searchType = info.type
      const tempSource = resolveTempSource(searchType, info.temp_source)
      const source = resolveSource(searchType, info.source, tempSource)
      searchInfo.current.temp_source = tempSource
      searchInfo.current.source = source
      searchInfo.current.searchType = searchType
      headerBarRef.current?.setSourceList(getSourceList(searchType), source)
      headerBarRef.current?.setText(searchState.searchText)
      global.app_event.topNavSearchTextUpdate(searchState.searchText)
      lastKeywordRef.current = searchState.searchText
      setTempSource(tempSource)
      if (global.lx.shouldClearSearchOnOpen) clearSearch()
      else loadSearchList(searchState.searchText)
    })

    const handleTypeChange = (type: SearchType) => {
      const nextTempSource = resolveTempSource(type, searchInfo.current.temp_source)
      const nextSource = resolveSource(type, searchInfo.current.source, nextTempSource)
      searchInfo.current.searchType = type
      searchInfo.current.temp_source = nextTempSource
      searchInfo.current.source = nextSource
      setTempSource(nextTempSource)
      headerBarRef.current?.setSourceList(getSourceList(type), nextSource)
      void saveSearchSetting({ type, source: nextSource, temp_source: nextTempSource })
      tipListRef.current?.hide()
      loadSearchList(lastKeywordRef.current)
    }

    const handleSearchTextChange = (text: string) => {
      if (commonState.navActiveId != 'nav_search') return
      if (!text) {
        tipListRef.current?.hide()
        return
      }
      tipListRef.current?.search(text, contentHeightRef.current)
    }

    global.app_event.on('searchTypeChanged', handleTypeChange)
    global.app_event.on('topNavSearchSubmit', handleSearch)
    global.app_event.on('topNavSearchTextChange', handleSearchTextChange)
    global.app_event.on('topNavSearchOpen', clearSearch)

    return () => {
      global.app_event.off('searchTypeChanged', handleTypeChange)
      global.app_event.off('topNavSearchSubmit', handleSearch)
      global.app_event.off('topNavSearchTextChange', handleSearchTextChange)
      global.app_event.off('topNavSearchOpen', clearSearch)
    }
  }, [clearSearch, handleSearch, loadSearchList])

  const handleSourceChange: HeaderBarProps['onSourceChange'] = (source) => {
    searchInfo.current.source = source
    if (source != 'all') {
      searchInfo.current.temp_source = source
      setTempSource(source)
      void saveSearchSetting({ source, temp_source: source })
    } else {
      void saveSearchSetting({ source })
    }
    tipListRef.current?.hide()
    loadSearchList(lastKeywordRef.current)
  }

  return (
    <View style={styles.container}>
      <HeaderBar
        ref={headerBarRef}
        onSourceChange={handleSourceChange}
      />
      <View style={styles.content} onLayout={handleContentLayout}>
        <List ref={listRef} onSearch={handleSearch} />
        <TipList ref={tipListRef} onSearch={handleSearch} />
      </View>
    </View>
  )
}

const styles = createStyle({
  container: {
    width: '100%',
    flex: 1,
  },
  content: {
    flex: 1,
    position: 'relative',
  },
})
