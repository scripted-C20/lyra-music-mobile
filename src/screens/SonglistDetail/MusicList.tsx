import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import OnlineList, { type OnlineListType, type OnlineListProps } from '@/components/OnlineList'
import { clearListDetail, getListDetail, setListDetail, setListDetailInfo } from '@/core/songlist'
import songlistState from '@/store/songlist/state'
import { handlePlay } from './listAction'
import Header, { type HeaderType } from './Header'
import { useListInfo } from './state'
import { usePlayMusicInfo } from '@/store/player/hook'

export interface MusicListProps {
  componentId: string
}

export interface MusicListType {
  loadList: (source: LX.OnlineSource, listId: string) => void
}

export default forwardRef<MusicListType, MusicListProps>(({ componentId }, ref) => {
  const listRef = useRef<OnlineListType>(null)
  const headerRef = useRef<HeaderType>(null)
  const isUnmountedRef = useRef(false)
  const pendingLocateAfterSearchRef = useRef(false)
  const info = useListInfo()
  const playMusicInfo = usePlayMusicInfo()
  const [fullList, setFullList] = useState<LX.Music.MusicInfoOnline[]>([])
  const [searchText, setSearchText] = useState('')

  const activeMusicInfo = useMemo(() => {
    const musicInfo = playMusicInfo.musicInfo
    if (!musicInfo || 'progress' in musicInfo || musicInfo.source == 'local') return null
    return musicInfo
  }, [playMusicInfo.musicInfo])

  const visibleList = useMemo(() => {
    const keyword = searchText.trim().toLowerCase()
    if (!keyword) return fullList
    return fullList.filter(item => {
      const haystack = `${item.name} ${item.singer} ${item.meta.albumName ?? ''}`.toLowerCase()
      return haystack.includes(keyword)
    })
  }, [fullList, searchText])

  const hasCurrentInFullList = useMemo(() => {
    if (!activeMusicInfo) return false
    return fullList.some(item => item.id == activeMusicInfo.id && item.source == activeMusicInfo.source)
  }, [activeMusicInfo, fullList])

  const hasCurrentInVisibleList = useMemo(() => {
    if (!activeMusicInfo) return false
    return visibleList.some(item => item.id == activeMusicInfo.id && item.source == activeMusicInfo.source)
  }, [activeMusicInfo, visibleList])

  useImperativeHandle(ref, () => ({
    async loadList(source, id) {
      clearListDetail()
      setSearchText('')
      setFullList([])
      const listDetailInfo = songlistState.listDetailInfo
      listRef.current?.setList([])
      if (listDetailInfo.id == id && listDetailInfo.source == source && listDetailInfo.list.length) {
        requestAnimationFrame(() => {
          setFullList(listDetailInfo.list)
          headerRef.current?.setInfo({
            name: (info.name || listDetailInfo.info.name) ?? '',
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            desc: listDetailInfo.info.desc || info.desc || '',
            playCount: (info.play_count ?? listDetailInfo.info.play_count) ?? '',
            imgUrl: info.img ?? listDetailInfo.info.img,
          })
        })
      } else {
        listRef.current?.setStatus('loading')
        const page = 1
        setListDetailInfo(info.source, info.id)
        headerRef.current?.setInfo({
          name: (info.name || listDetailInfo.info.name) ?? '',
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          desc: listDetailInfo.info.desc || info.desc || '',
          playCount: (info.play_count ?? listDetailInfo.info.play_count) ?? '',
          imgUrl: info.img ?? listDetailInfo.info.img,
        })
        return getListDetail(id, source, page).then((listDetail) => {
          const result = setListDetail(listDetail, id, page)
          if (isUnmountedRef.current) return
          requestAnimationFrame(() => {
            headerRef.current?.setInfo({
              name: (info.name || listDetailInfo.info.name) ?? '',
              // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
              desc: listDetailInfo.info.desc || info.desc || '',
              playCount: (info.play_count ?? listDetailInfo.info.play_count) ?? '',
              imgUrl: info.img ?? listDetailInfo.info.img,
            })
            setFullList(result.list)
            listRef.current?.setStatus(songlistState.listDetailInfo.maxPage <= page ? 'end' : 'idle')
          })
        }).catch(() => {
          if (songlistState.listDetailInfo.list.length && page == 1) clearListDetail()
          listRef.current?.setStatus('error')
        })
      }
    },
  }))

  useEffect(() => {
    isUnmountedRef.current = false
    return () => {
      isUnmountedRef.current = true
    }
  }, [])

  useEffect(() => {
    listRef.current?.setList(visibleList)
  }, [visibleList])

  useEffect(() => {
    if (!pendingLocateAfterSearchRef.current || searchText || !hasCurrentInVisibleList) return
    pendingLocateAfterSearchRef.current = false
    requestAnimationFrame(() => {
      if (activeMusicInfo) listRef.current?.scrollToInfo(activeMusicInfo)
    })
  }, [activeMusicInfo, hasCurrentInVisibleList, searchText])

  const handleSearch = useCallback((text: string) => {
    setSearchText(text)
  }, [])

  const handleLocateCurrent = useCallback(async() => {
    if (!activeMusicInfo) return
    if (searchText && !hasCurrentInVisibleList) {
      pendingLocateAfterSearchRef.current = true
      setSearchText('')
    }

    if (hasCurrentInFullList) {
      if (!searchText || hasCurrentInVisibleList) {
        listRef.current?.scrollToInfo(activeMusicInfo)
      }
      return
    }

    if (songlistState.listDetailInfo.page >= songlistState.listDetailInfo.maxPage) return

    listRef.current?.setStatus('loading')
    try {
      let page = songlistState.listDetailInfo.page
      while (page < songlistState.listDetailInfo.maxPage) {
        page += 1
        const listDetail = await getListDetail(songlistState.listDetailInfo.id, songlistState.listDetailInfo.source, page)
        const result = setListDetail(listDetail, songlistState.listDetailInfo.id, page)
        if (isUnmountedRef.current) return
        setFullList(result.list)
        if (result.list.some(item => item.id == activeMusicInfo.id && item.source == activeMusicInfo.source)) {
          listRef.current?.setStatus(songlistState.listDetailInfo.maxPage <= page ? 'end' : 'idle')
          if (!searchText) {
            requestAnimationFrame(() => {
              listRef.current?.scrollToInfo(activeMusicInfo)
            })
          }
          return
        }
      }
      listRef.current?.setStatus('end')
    } catch {
      listRef.current?.setStatus('error')
    }
  }, [activeMusicInfo, hasCurrentInFullList, hasCurrentInVisibleList, searchText])

  const handlePlayList: OnlineListProps['onPlayList'] = (index) => {
    const listDetailInfo = songlistState.listDetailInfo
    const target = visibleList[index]
    if (!target) return
    const playIndex = fullList.findIndex(item => item.id == target.id && item.source == target.source)
    if (playIndex < 0) return
    void handlePlay(listDetailInfo.id, listDetailInfo.source, fullList, playIndex)
  }
  const handleRefresh: OnlineListProps['onRefresh'] = () => {
    const page = 1
    listRef.current?.setStatus('refreshing')
    getListDetail(songlistState.listDetailInfo.id, songlistState.listDetailInfo.source, page, true).then((listDetail) => {
      const result = setListDetail(listDetail, songlistState.listDetailInfo.id, page)
      if (isUnmountedRef.current) return
      setFullList(result.list)
      listRef.current?.setStatus(songlistState.listDetailInfo.maxPage <= page ? 'end' : 'idle')
    }).catch(() => {
      if (songlistState.listDetailInfo.list.length && page == 1) clearListDetail()
      listRef.current?.setStatus('error')
    })
  }
  const handleLoadMore: OnlineListProps['onLoadMore'] = () => {
    listRef.current?.setStatus('loading')
    const page = songlistState.listDetailInfo.list.length ? songlistState.listDetailInfo.page + 1 : 1
    getListDetail(songlistState.listDetailInfo.id, songlistState.listDetailInfo.source, page).then((listDetail) => {
      const result = setListDetail(listDetail, songlistState.listDetailInfo.id, page)
      if (isUnmountedRef.current) return
      setFullList(result.list)
      listRef.current?.setStatus(songlistState.listDetailInfo.maxPage <= page ? 'end' : 'idle')
    }).catch(() => {
      if (songlistState.listDetailInfo.list.length && page == 1) clearListDetail()
      listRef.current?.setStatus('error')
    })
  }

  const header = useMemo(() => (
    <Header
      ref={headerRef}
      componentId={componentId}
      searchText={searchText}
      onSearch={handleSearch}
    />
  ), [componentId, handleSearch, searchText])

  return <OnlineList
    ref={listRef}
    onPlayList={handlePlayList}
    onRefresh={handleRefresh}
    onLoadMore={handleLoadMore}
    onLocateCurrent={handleLocateCurrent}
    locateBtnBottom={18}
    locateBtnVisible={true}
    ListHeaderComponent={header}
    // progressViewOffset={}
   />
})
