import { useRef, useEffect, useCallback } from 'react'
import { View } from 'react-native'

import HeaderBar, { type HeaderBarProps, type HeaderBarType } from './HeaderBar'
import searchState, { type SearchType } from '@/store/search/state'
import searchMusicState from '@/store/search/music/state'
import searchSonglistState from '@/store/search/songlist/state'
import { getSearchSetting, saveSearchSetting } from '@/utils/data'
import { createStyle } from '@/utils/tools'
import List, { type ListType } from './List'
import { addHistoryWord, setTempSource } from '@/core/search/search'

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
  const searchInfo = useRef<SearchInfo>({ temp_source: 'kw', source: 'kw', searchType: 'music' })

  const handleSearch = useCallback((text: string) => {
    headerBarRef.current?.setText(text)
    headerBarRef.current?.blur()
    global.app_event.topNavSearchTextUpdate(text)
    void addHistoryWord(text)
    listRef.current?.loadList(text, searchInfo.current.source, searchInfo.current.searchType)
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
      setTempSource(tempSource)
      listRef.current?.loadList(searchState.searchText, source, searchType)
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
      listRef.current?.loadList(searchState.searchText, nextSource, type)
    }

    global.app_event.on('searchTypeChanged', handleTypeChange)
    global.app_event.on('topNavSearchSubmit', handleSearch)

    return () => {
      global.app_event.off('searchTypeChanged', handleTypeChange)
      global.app_event.off('topNavSearchSubmit', handleSearch)
    }
  }, [handleSearch])

  const handleSourceChange: HeaderBarProps['onSourceChange'] = (source) => {
    searchInfo.current.source = source
    if (source != 'all') {
      searchInfo.current.temp_source = source
      setTempSource(source)
      void saveSearchSetting({ source, temp_source: source })
    } else {
      void saveSearchSetting({ source })
    }
    listRef.current?.loadList(searchState.searchText, source, searchInfo.current.searchType)
  }

  return (
    <View style={styles.container}>
      <HeaderBar
        ref={headerBarRef}
        onSourceChange={handleSourceChange}
      />
      <View style={styles.content}>
        <List ref={listRef} onSearch={handleSearch} />
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
  },
})
