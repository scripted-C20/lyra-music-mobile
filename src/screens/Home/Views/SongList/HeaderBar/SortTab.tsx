import { useMemo, useRef } from 'react'
import { ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import songlistState, { type Source } from '@/store/songlist/state'
import { useI18n } from '@/lang'
import { useDS } from '@/theme/useDS'
import Text from '@/components/common/Text'
import {
  HEADER_CONTROL_FONT_SIZE,
  HEADER_CONTROL_HORIZONTAL_PADDING,
  HEADER_CONTROL_RADIUS,
  HEADER_CONTROL_VERTICAL_PADDING,
} from './constants'

export interface SortTabProps {
  source: Source
  activeId: string
  onSortChange: (id: string) => void
}

export default ({ source, activeId, onSortChange }: SortTabProps) => {
  const t = useI18n()
  const ds = useDS()
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
      contentContainerStyle={styles.content}
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
              active && { backgroundColor: ds.accent },
            ]}
            onPress={() => { handleSortChange(s.id) }}
            key={s.id}
          >
            <Text
              size={HEADER_CONTROL_FONT_SIZE}
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
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  btn: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 20,
    minWidth: 34,
    paddingHorizontal: HEADER_CONTROL_HORIZONTAL_PADDING,
    paddingVertical: HEADER_CONTROL_VERTICAL_PADDING,
    borderRadius: HEADER_CONTROL_RADIUS,
    marginRight: 2,
  },
  text: {
    fontWeight: '400',
    includeFontPadding: false,
    textAlign: 'center',
  },
})
