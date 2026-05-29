import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import SortTab from './SortTab'
import SourceSelector, {
  type SourceSelectorType,
  type SourceSelectorProps,
} from './SourceSelector'
import songlistState, { type Source } from '@/store/songlist/state'
import Tag, { type TagProps } from './Tag'
import OpenList, { type OpenListType } from './OpenList'
import { HEADER_CONTROL_HEIGHT, HEADER_CONTROL_RADIUS } from './constants'

export interface HeaderBarProps {
  onSortChange: (id: string) => void
  onTagChange: TagProps['onTagChange']
  onSourceChange: SourceSelectorProps['onSourceChange']
}

export interface HeaderBarType {
  setSource: (source: Source, sortId: string, tagName: string, tagId: string) => void
}

export default forwardRef<HeaderBarType, HeaderBarProps>(({ onSortChange, onTagChange, onSourceChange }, ref) => {
  const openListRef = useRef<OpenListType>(null)
  const sourceSelectorRef = useRef<SourceSelectorType>(null)
  const [meta, setMeta] = useState<{ source: Source, sortId: string, tagName: string, tagId: string }>({
    source: 'kw',
    sortId: songlistState.sortList.kw?.[0]?.id ?? '',
    tagName: '',
    tagId: '',
  })

  useImperativeHandle(ref, () => ({
    setSource(source, sortId, tagName, tagId) {
      sourceSelectorRef.current?.setSource(source)
      openListRef.current?.setInfo(source)
      setMeta({ source, sortId, tagName, tagId })
    },
  }), [])

  const handleSortChange = (id: string) => {
    setMeta(prev => ({ ...prev, sortId: id }))
    onSortChange(id)
  }

  const handleTagChange: HeaderBarProps['onTagChange'] = (name, id) => {
    setMeta(prev => ({ ...prev, tagName: name, tagId: id }))
    onTagChange(name, id)
  }

  const handleSourceChange: HeaderBarProps['onSourceChange'] = (source) => {
    setMeta(prev => ({
      ...prev,
      source,
      sortId: songlistState.sortList[source]?.[0]?.id ?? '',
      tagId: '',
      tagName: '',
    }))
    onSourceChange(source)
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        {/* 排序（最新/最热） */}
        <View style={styles.chip}>
          <SortTab source={meta.source} activeId={meta.sortId} onSortChange={handleSortChange} />
        </View>

        {/* 筛选 */}
        <View style={styles.chip}>
          <Tag source={meta.source} activeId={meta.tagId} name={meta.tagName} onTagChange={handleTagChange} />
        </View>

        {/* 添加歌单 */}
        <View style={styles.chip}>
          <OpenList ref={openListRef} />
        </View>

        {/* 来源下拉（右侧） */}
        <View style={styles.chip}>
          <SourceSelector
            ref={sourceSelectorRef}
            onSourceChange={handleSourceChange}
            style={styles.chipInner}
          />
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
    backgroundColor: 'rgba(249,249,249,0.98)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: HEADER_CONTROL_HEIGHT,
    gap: 4,
  },
  chip: {
    flex: 1,
    height: HEADER_CONTROL_HEIGHT,
    minWidth: 0,
    borderRadius: HEADER_CONTROL_RADIUS,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  chipInner: {
    flex: 1,
    justifyContent: 'center',
  },
})
