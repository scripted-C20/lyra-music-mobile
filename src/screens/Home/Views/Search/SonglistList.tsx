import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'

import { search } from '@/core/search/songlist'
import Songlist, { type SonglistProps, type SonglistType } from '@/screens/Home/Views/SongList/components/Songlist'
import searchSonglistState, { type Source } from '@/store/search/songlist/state'
import ResultHeader from './ResultHeader'

export interface SonglistListType {
  loadList: (text: string, source: Source) => void
}

export default forwardRef<SonglistListType, {}>((props, ref) => {
  const listRef = useRef<SonglistType>(null)
  const searchInfoRef = useRef<{ text: string, source: Source }>({ text: '', source: 'kw' })
  const [headerInfo, setHeaderInfo] = useState<{ keyword: string, source: Source, total: number } | null>(null)
  const isUnmountedRef = useRef(false)

  const updateHeader = (keyword: string, source: Source) => {
    setHeaderInfo({
      keyword,
      source,
      total: searchSonglistState.listInfos[source]?.total ?? 0,
    })
  }

  useImperativeHandle(ref, () => ({
    async loadList(text, source) {
      listRef.current?.setList([], source == 'all')
      searchInfoRef.current.text = text
      searchInfoRef.current.source = source
      if (searchSonglistState.searchText == text && searchSonglistState.source == source && searchSonglistState.listInfos[searchSonglistState.source]!.list.length) {
        requestAnimationFrame(() => {
          listRef.current?.setList(searchSonglistState.listInfos[searchSonglistState.source]!.list, source == 'all')
          updateHeader(text, source)
        })
      } else {
        listRef.current?.setStatus('loading')
        const page = 1
        return search(text, page, source).then((list) => {
          if (isUnmountedRef.current) return
          requestAnimationFrame(() => {
            listRef.current?.setList(list, source == 'all')
            listRef.current?.setStatus(searchSonglistState.maxPages[searchSonglistState.source] == page ? 'end' : 'idle')
            updateHeader(text, source)
          })
        }).catch(() => {
          listRef.current?.setStatus('error')
        })
      }
    },
  }), [])

  useEffect(() => {
    isUnmountedRef.current = false
    return () => {
      isUnmountedRef.current = true
    }
  }, [])


  const handleRefresh: SonglistProps['onRefresh'] = () => {
    const page = 1
    listRef.current?.setStatus('refreshing')
    search(searchInfoRef.current.text, page, searchInfoRef.current.source).then((list) => {
      if (isUnmountedRef.current) return
      listRef.current?.setList(list, searchInfoRef.current.source == 'all')
      listRef.current?.setStatus(searchSonglistState.maxPages[searchInfoRef.current.source] == page ? 'end' : 'idle')
      updateHeader(searchInfoRef.current.text, searchInfoRef.current.source)
    }).catch(() => {
      listRef.current?.setStatus('error')
    })
  }
  const handleLoadMore: SonglistProps['onLoadMore'] = () => {
    listRef.current?.setStatus('loading')
    const info = searchSonglistState.listInfos[searchInfoRef.current.source]!
    const page = info.list.length ? info.page + 1 : 1
    search(searchInfoRef.current.text, page, searchInfoRef.current.source).then((list) => {
      if (isUnmountedRef.current) return
      listRef.current?.setList(list, searchInfoRef.current.source == 'all')
      listRef.current?.setStatus(searchSonglistState.maxPages[searchSonglistState.source] == page ? 'end' : 'idle')
      updateHeader(searchInfoRef.current.text, searchInfoRef.current.source)
    }).catch(() => {
      listRef.current?.setStatus('error')
    })
  }

  const listHeaderComponent = useMemo(() => {
    if (!headerInfo?.keyword) return null
    return <ResultHeader keyword={headerInfo.keyword} source={headerInfo.source} type="songlist" total={headerInfo.total} />
  }, [headerInfo])

  return <Songlist
    ref={listRef}
    onRefresh={handleRefresh}
    onLoadMore={handleLoadMore}
    ListHeaderComponent={listHeaderComponent}
  />
})
