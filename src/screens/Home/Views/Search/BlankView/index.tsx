import { useSettingValue } from '@/store/setting/hook'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { ScrollView, View, StyleSheet } from 'react-native'
import HistorySearch, { type HistorySearchType } from './HistorySearch'
import HotSearch, { type HotSearchType } from './HotSearch'
import type { SearchType } from '@/store/search/state'

interface BlankViewProps {
  onSearch: (keyword: string) => void
}
type Source = LX.OnlineSource | 'all'

export interface BlankViewType {
  show: (source: Source, type: SearchType) => void
}

export default forwardRef<BlankViewType, BlankViewProps>(({ onSearch }, ref) => {
  const [visible, setVisible] = useState(false)
  const hotSearchRef = useRef<HotSearchType>(null)
  const historySearchRef = useRef<HistorySearchType>(null)
  const isShowHotSearch = useSettingValue('search.isShowHotSearch')
  const isShowHistorySearch = useSettingValue('search.isShowHistorySearch')

  const handleShow = (source: Source, _type: SearchType) => {
    hotSearchRef.current?.show(source)
    historySearchRef.current?.show()
  }

  useImperativeHandle(ref, () => ({
    show(source, type) {
      if (visible) handleShow(source, type)
      else {
        setVisible(true)
        requestAnimationFrame(() => { handleShow(source, type) })
      }
    },
  }), [visible])

  if (!visible) return null

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        {isShowHotSearch ? <HotSearch ref={hotSearchRef} onSearch={onSearch} /> : null}
        {isShowHistorySearch ? <HistorySearch ref={historySearchRef} onSearch={onSearch} /> : null}
      </View>
    </ScrollView>
  )
})

const styles = StyleSheet.create({
  scroll: { paddingBottom: 100 },
  content: { paddingTop: 8, paddingHorizontal: 16 },
})
