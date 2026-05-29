import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import OnlineList, { type OnlineListType, type OnlineListProps } from '@/components/OnlineList'
import { clearListDetail, getListDetail, setListDetail, setListDetailInfo } from '@/core/leaderboard'
import boardState from '@/store/leaderboard/state'
import { handlePlay } from './listAction'
import { usePlayMusicInfo } from '@/store/player/hook'

// export type MusicListProps = Pick<OnlineListProps,
// 'onLoadMore'
// | 'onPlayList'
// | 'onRefresh'
// >

export interface MusicListType {
  loadList: (source: LX.OnlineSource, listId: string) => void
}

export default forwardRef<MusicListType, {}>((props, ref) => {
  const listRef = useRef<OnlineListType>(null)
  const isUnmountedRef = useRef(false)
  const playMusicInfo = usePlayMusicInfo()
  const [currentBoardId, setCurrentBoardId] = useState('')
  const [fullList, setFullList] = useState<LX.Music.MusicInfoOnline[]>([])

  const activeMusicInfo = useMemo(() => {
    const musicInfo = playMusicInfo.musicInfo
    if (!musicInfo || 'progress' in musicInfo || musicInfo.source == 'local') return null
    return musicInfo
  }, [playMusicInfo.musicInfo])

  const hasCurrentInLoadedList = useMemo(() => {
    if (!activeMusicInfo) return false
    return fullList.some(item => item.id == activeMusicInfo.id && item.source == activeMusicInfo.source)
  }, [activeMusicInfo, fullList])

  useImperativeHandle(ref, () => ({
    async loadList(source, id) {
      const listDetailInfo = boardState.listDetailInfo
      setCurrentBoardId(id)
      setFullList([])
      listRef.current?.setList([])
      if (listDetailInfo.id == id && listDetailInfo.source == source && listDetailInfo.list.length) {
        requestAnimationFrame(() => {
          setFullList(listDetailInfo.list)
          listRef.current?.setList(listDetailInfo.list)
        })
      } else {
        listRef.current?.setStatus('loading')
        const page = 1
        setListDetailInfo(id)
        return getListDetail(id, page).then((listDetail) => {
          const result = setListDetail(listDetail, id, page)
          if (isUnmountedRef.current) return
          requestAnimationFrame(() => {
            setFullList(result.list)
            listRef.current?.setList(result.list)
            listRef.current?.setStatus(boardState.listDetailInfo.maxPage <= page ? 'end' : 'idle')
          })
        }).catch(() => {
          if (boardState.listDetailInfo.list.length && page == 1) clearListDetail()
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


  const handlePlayList: OnlineListProps['onPlayList'] = (index) => {
    const listDetailInfo = boardState.listDetailInfo
    const targetList = fullList.length ? fullList : listDetailInfo.list
    void handlePlay(listDetailInfo.id, targetList, index)
  }
  const handleRefresh: OnlineListProps['onRefresh'] = () => {
    const page = 1
    listRef.current?.setStatus('refreshing')
    getListDetail(boardState.listDetailInfo.id, page, true).then((listDetail) => {
      const result = setListDetail(listDetail, boardState.listDetailInfo.id, page)
      if (isUnmountedRef.current) return
      setFullList(result.list)
      listRef.current?.setList(result.list)
      listRef.current?.setStatus(boardState.listDetailInfo.maxPage <= page ? 'end' : 'idle')
    }).catch(() => {
      if (boardState.listDetailInfo.list.length && page == 1) clearListDetail()
      listRef.current?.setStatus('error')
    })
  }
  const handleLoadMore: OnlineListProps['onLoadMore'] = () => {
    listRef.current?.setStatus('loading')
    const page = boardState.listDetailInfo.list.length ? boardState.listDetailInfo.page + 1 : 1
    getListDetail(boardState.listDetailInfo.id, page).then((listDetail) => {
      const result = setListDetail(listDetail, boardState.listDetailInfo.id, page)
      if (isUnmountedRef.current) return
      setFullList(result.list)
      listRef.current?.setList(result.list, true)
      listRef.current?.setStatus(boardState.listDetailInfo.maxPage <= page ? 'end' : 'idle')
    }).catch(() => {
      if (boardState.listDetailInfo.list.length && page == 1) clearListDetail()
      listRef.current?.setStatus('error')
    })
  }

  const handleLocateCurrent = useCallback(async() => {
    if (!activeMusicInfo || !currentBoardId) return

    if (hasCurrentInLoadedList) {
      listRef.current?.scrollToInfo(activeMusicInfo)
      return
    }

    if (boardState.listDetailInfo.page >= boardState.listDetailInfo.maxPage) return

    listRef.current?.setStatus('loading')
    try {
      let page = boardState.listDetailInfo.page
      while (page < boardState.listDetailInfo.maxPage) {
        page += 1
        const listDetail = await getListDetail(currentBoardId, page)
        const result = setListDetail(listDetail, currentBoardId, page)
        if (isUnmountedRef.current) return
        setFullList(result.list)
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            listRef.current?.setList(result.list, true)
            resolve()
          })
        })
        if (result.list.some(item => item.id == activeMusicInfo.id && item.source == activeMusicInfo.source)) {
          listRef.current?.setStatus(boardState.listDetailInfo.maxPage <= page ? 'end' : 'idle')
          requestAnimationFrame(() => {
            listRef.current?.scrollToInfo(activeMusicInfo)
          })
          return
        }
      }
      listRef.current?.setStatus('end')
    } catch {
      listRef.current?.setStatus('error')
    }
  }, [activeMusicInfo, currentBoardId, hasCurrentInLoadedList])

  return <OnlineList
    ref={listRef}
    onPlayList={handlePlayList}
    onRefresh={handleRefresh}
    onLoadMore={handleLoadMore}
    onLocateCurrent={handleLocateCurrent}
    checkHomePagerIdle
    locateBtnVisible={true}
    locateBtnBottom={18}
    rowType='medium'
   />
})
