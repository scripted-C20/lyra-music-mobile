import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import type { InitState as SearchState } from '@/store/search/state'
import type { Source as MusicSource } from '@/store/search/music/state'
import type { Source as SongListSource } from '@/store/search/songlist/state'
import MusicList, { type MusicListType } from './MusicList'
import BlankView, { type BlankViewType } from './BlankView'
import SonglistList, { type SonglistListType } from './SonglistList'

interface ListProps {
  onSearch: (keyword: string) => void
}
export interface ListType {
  loadList: (text: string, sources: { music: MusicSource, songlist: SongListSource }, activeType: SearchState['searchType']) => void
}

export default forwardRef<ListType, ListProps>(({ onSearch }, ref) => {
  const [listType, setListType] = useState<SearchState['searchType']>('music')
  const [showBlankView, setShowListView] = useState(true)
  const musicListRef = useRef<MusicListType>(null)
  const songlistListRef = useRef<SonglistListType>(null)
  const blankViewRef = useRef<BlankViewType>(null)

  useImperativeHandle(ref, () => ({
    loadList(text, sources, activeType) {
      setListType(activeType)
      if (text) {
        setShowListView(false)
        requestAnimationFrame(() => {
          musicListRef.current?.loadList(text, sources.music)
          songlistListRef.current?.loadList(text, sources.songlist)
        })
      } else {
        setShowListView(true)
        requestAnimationFrame(() => {
          blankViewRef.current?.show(sources[activeType], activeType)
        })
      }
    },
  }), [])

  return (
    showBlankView
      ? <BlankView ref={blankViewRef} onSearch={onSearch} />
      : (
          <View style={styles.container}>
            <View style={listType == 'music' ? styles.visiblePanel : styles.hiddenPanel}>
              <MusicList ref={musicListRef} />
            </View>
            <View style={listType == 'songlist' ? styles.visiblePanel : styles.hiddenPanel}>
              <SonglistList ref={songlistListRef} />
            </View>
          </View>
        )
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  visiblePanel: {
    flex: 1,
  },
  hiddenPanel: {
    display: 'none',
  },
})
