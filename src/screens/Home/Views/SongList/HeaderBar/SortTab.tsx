import { useMemo, useRef } from 'react'
import { ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import songlistState, { type Source } from '@/store/songlist/state'
import { useI18n } from '@/lang'
import { useDS } from '@/theme/useDS'
import Text from '@/components/common/Text'
import {
  useHeaderControlMetrics,
} from './constants'

export interface SortTabProps {
  source: Source
  activeId: string
  onSortChange: (id: string) => void
}

export default ({ source, activeId, onSortChange }: SortTabProps) => {
  const t = useI18n()
  const ds = useDS()
  const controlMetrics = useHeaderControlMetrics()
  const scrollViewRef = useRef<ScrollView>(null)

  const sorts = useMemo(() => {
    return (songlistState.sortList[source] ?? []).map(s => {
      const label = t(`songlist_${s.tid}`) || s.name || s.id
      return { label, id: s.id }
    })
  }, [source, t])

  const handleSortChange = (id: string) => {
    onSortChange(id)
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({ x: 0, animated: true })
    })
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingHorizontal: Math.max(2, Math.round(controlMetrics.horizontalPadding / 2)) },
      ]}
      keyboardShouldPersistTaps={'always'}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {sorts.map(s => {
        const active = activeId === s.id
        return (
          <TouchableOpacity
            style={[
              styles.btn,
              {
                minHeight: Math.max(20, controlMetrics.height - 4),
                minWidth: Math.max(34, controlMetrics.height + controlMetrics.horizontalPadding),
                paddingHorizontal: controlMetrics.horizontalPadding,
                paddingVertical: controlMetrics.verticalPadding,
                borderRadius: controlMetrics.radius,
                marginRight: Math.max(2, Math.round(controlMetrics.rowGap / 2)),
              },
              active && { backgroundColor: ds.accent },
            ]}
            onPress={() => { handleSortChange(s.id) }}
            key={s.id}
          >
            <Text
              size={controlMetrics.fontSize}
              color={active ? ds.textOnAccent : ds.text}
              style={styles.text}
              numberOfLines={1}
            >
              {s.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    alignItems: 'center',
  },
  btn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: '400',
    includeFontPadding: false,
    textAlign: 'center',
  },
})
