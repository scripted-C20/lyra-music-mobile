import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import OnlineList, { type OnlineListType, type OnlineListProps } from '@/components/OnlineList'
import { search } from '@/core/search/music'
import searchMusicState, { type Source } from '@/store/search/music/state'
import ResultHeader from './ResultHeader'

export interface MusicListType {
  loadList: (text: string, source: Source) => void
}

export default forwardRef<MusicListType, {}>((props, ref) => {
  const listRef = useRef<OnlineListType>(null)
  const searchInfoRef = useRef<{ text: string, source: Source }>({ text: '', source: 'kw' })
  const [headerInfo, setHeaderInfo] = useState<{ keyword: string, source: Source, total: number } | null>(null)
  const isUnmountedRef = useRef(false)

  const updateHeader = (keyword: string, source: Source) => {
    setHeaderInfo({
      keyword,
      source,
      total: searchMusicState.listInfos[source]?.total ?? 0,
    })
  }

  useImperativeHandle(ref, () => ({
    async loadList(text, source) {
      listRef.current?.setList([], false, source == 'all')
      searchInfoRef.current.text = text
      searchInfoRef.current.source = source
      if (searchMusicState.searchText == text && searchMusicState.source == source && searchMusicState.listInfos[searchMusicState.source]!.list.length) {
        requestAnimationFrame(() => {
          listRef.current?.setList(searchMusicState.listInfos[searchMusicState.source]!.list, false, source == 'all')
          updateHeader(text, source)
        })
      } else {
        listRef.current?.setStatus('loading')
        const page = 1
        return search(text, page, source).then((list) => {
          if (isUnmountedRef.current) return
          requestAnimationFrame(() => {
            listRef.current?.setList(list, false, source == 'all')
            listRef.current?.setStatus(searchMusicState.listInfos[searchMusicState.source]!.maxPage <= page ? 'end' : 'idle')
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


  const handleRefresh: OnlineListProps['onRefresh'] = () => {
    const page = 1
    listRef.current?.setStatus('refreshing')
    search(searchInfoRef.current.text, page, searchInfoRef.current.source).then((list) => {
      if (isUnmountedRef.current) return
      listRef.current?.setList(list, false, searchInfoRef.current.source == 'all')
      listRef.current?.setStatus(searchMusicState.listInfos[searchInfoRef.current.source]!.maxPage <= page ? 'end' : 'idle')
      updateHeader(searchInfoRef.current.text, searchInfoRef.current.source)
    }).catch(() => {
      listRef.current?.setStatus('error')
    })
  }
  const handleLoadMore: OnlineListProps['onLoadMore'] = () => {
    listRef.current?.setStatus('loading')
    const info = searchMusicState.listInfos[searchInfoRef.current.source]!
    const page = info.list.length ? info.page + 1 : 1
    search(searchInfoRef.current.text, page, searchInfoRef.current.source).then((list) => {
      if (isUnmountedRef.current) return
      listRef.current?.setList(list, true, searchInfoRef.current.source == 'all')
      listRef.current?.setStatus(info.maxPage <= page ? 'end' : 'idle')
      updateHeader(searchInfoRef.current.text, searchInfoRef.current.source)
    }).catch(() => {
      listRef.current?.setStatus('error')
    })
  }

  const listHeaderComponent = useMemo(() => {
    if (!headerInfo?.keyword) return null
    return <ResultHeader keyword={headerInfo.keyword} source={headerInfo.source} type="music" total={headerInfo.total} />
  }, [headerInfo])

  return <OnlineList
    ref={listRef}
    onRefresh={handleRefresh}
    onLoadMore={handleLoadMore}
    ListHeaderComponent={listHeaderComponent}
    checkHomePagerIdle
  />
})
