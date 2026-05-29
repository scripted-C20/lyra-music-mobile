import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react'
import { View, ScrollView, StyleSheet } from 'react-native'
import TagGroup, { type TagGroupProps } from './TagGroup'
import { useI18n } from '@/lang'
import { type TagInfo, type Source } from '@/store/songlist/state'
import { getTags } from '@/core/songlist'
import Text from '@/components/common/Text'
import { useDS } from '@/theme/useDS'
import music from '@/utils/musicSdk'
import { useSettingValue } from '@/store/setting/hook'

export interface ListProps {
  onTagChange: TagGroupProps['onTagChange']
}

export interface ListType {
  loadTag: (source: Source, activeId: string) => void
}

export default forwardRef<ListType, ListProps>(({ onTagChange }, ref) => {
  const ds = useDS()
  const [activeId, setActiveId] = useState('')
  const [list, setList] = useState<TagInfo['tags']>([])
  const [sourceName, setSourceName] = useState('')
  const t = useI18n()
  const sourceNameType = useSettingValue('common.sourceNameType')
  const prevSource = useRef('')

  const isUnmountedRef = useRef(false)
  useEffect(() => {
    isUnmountedRef.current = false
    return () => { isUnmountedRef.current = true }
  }, [])

  useImperativeHandle(ref, () => ({
    loadTag(source, id) {
      if (id != activeId) setActiveId(id)
      setSourceName(
        music.sources.some(item => item.id == source)
          ? t(`source_${sourceNameType}_${source}`)
          : source.toUpperCase(),
      )
      if (source != prevSource.current) {
        setList([{ name: '', list: [{ name: t('songlist_tag_default'), id: '', parent_id: '', parent_name: '', source }] }])
        void getTags(source).then(tagInfo => {
          if (isUnmountedRef.current) return
          prevSource.current = source
          setList([
            { name: '', list: [{ name: t('songlist_tag_default'), id: '', parent_id: '', parent_name: '', source }] },
            { name: t('songlist_tag_hot'), list: [...tagInfo.hotTag] },
            ...tagInfo.tags,
          ].filter(t => t.list.length))
        })
      }
    },
  }))

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: ds.isDark ? ds.bg : '#F2F2F7' }]}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps={'always'}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container} onStartShouldSetResponder={() => true}>
        {/* 紧凑标题 */}
        <View style={styles.headerRow}>
          <Text size={11} color={ds.textDim} style={styles.headerLabel}>分类</Text>
          <Text size={13} color={ds.text} style={styles.headerSource}>{sourceName}</Text>
        </View>

        {/* 标签组 */}
        {list.map((type, index) => (
          <TagGroup
            key={index}
            name={type.name}
            list={type.list}
            activeId={activeId}
            onTagChange={onTagChange}
          />
        ))}

        {list.length === 1 ? (
          <View style={[styles.blankView, { backgroundColor: ds.bgCard }]}>
            <Text size={12} color={ds.textDim}>{t('list_loading')}</Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  )
})

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 16 },
  container: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingTop: 6,
    paddingBottom: 8,
    gap: 8,
  },
  headerLabel: {
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  headerSource: {
    fontWeight: '600',
  },
  blankView: {
    minHeight: 60,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
