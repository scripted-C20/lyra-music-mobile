import { forwardRef, useImperativeHandle, useState } from 'react'
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { type Source as MusicSource } from '@/store/search/music/state'
import { type Source as SonglistSource } from '@/store/search/songlist/state'
import { useDS } from '@/theme/useDS'
import Text from '@/components/common/Text'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import SearchTypeSelector from '../SearchTypeSelector'
import {
  HEADER_CONTROL_FONT_SIZE,
  HEADER_CONTROL_HEIGHT,
  HEADER_CONTROL_HORIZONTAL_PADDING,
  HEADER_CONTROL_RADIUS,
  HEADER_CONTROL_ROW_GAP,
  HEADER_CONTROL_VERTICAL_PADDING,
} from '../../common/headerControls'

type Sources = Readonly<Array<MusicSource | SonglistSource>>

export interface HeaderBarProps {
  onSourceChange: (source: Sources[number]) => void
}

export interface HeaderBarType {
  setSourceList: (list: Sources, source: Sources[number]) => void
  setText: (text: string) => void
  blur: () => void
}

export default forwardRef<HeaderBarType, HeaderBarProps>(({ onSourceChange }, ref) => {
  const ds = useDS()
  const t = useI18n()
  const sourceNameType = useSettingValue('common.sourceNameType')
  const [sourceList, setSourceList] = useState<Sources>([])
  const [activeSource, setActiveSource] = useState<Sources[number]>('kw')

  useImperativeHandle(ref, () => ({
    setSourceList(list, source) {
      setSourceList(list)
      setActiveSource(source)
    },
    setText() {},
    blur() {},
  }), [])

  const handleSourceChange = (source: Sources[number]) => {
    setActiveSource(source)
    onSourceChange(source)
  }

  const chipBg = ds.isDark ? ds.bgFloat : '#FFFFFF'

  return (
    <View style={[styles.wrapper, { backgroundColor: ds.isDark ? ds.bg : 'rgba(249,249,249,0.98)' }]}>
      <View style={styles.row}>
        {/* 左：歌曲/歌单切换（固定） */}
        <View style={[styles.typeChip, { backgroundColor: chipBg }]}>
          <SearchTypeSelector />
        </View>

        {/* 中间：来源列表（可滚动） */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          style={styles.scroll}
        >
          {sourceList.map(source => {
            const active = activeSource === source
            return (
              <TouchableOpacity
                key={source}
                activeOpacity={0.6}
                onPress={() => { handleSourceChange(source) }}
                style={[
                  styles.chip,
                  active ? { backgroundColor: ds.accent } : { backgroundColor: chipBg },
                ]}
              >
                <Text
                  size={HEADER_CONTROL_FONT_SIZE}
                  color={active ? ds.textOnAccent : ds.text}
                  style={styles.chipText}
                  numberOfLines={1}
                >
                  {t(`source_${sourceNameType}_${source}`)}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 12,
    paddingTop: 0,
    paddingBottom: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: HEADER_CONTROL_HEIGHT,
    gap: HEADER_CONTROL_ROW_GAP,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    gap: HEADER_CONTROL_ROW_GAP,
    paddingRight: 4,
  },
  typeChip: {
    height: HEADER_CONTROL_HEIGHT,
    borderRadius: HEADER_CONTROL_RADIUS,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 0,
    paddingVertical: 0,
    flexShrink: 0,
  },
  chip: {
    height: HEADER_CONTROL_HEIGHT,
    paddingHorizontal: HEADER_CONTROL_HORIZONTAL_PADDING,
    paddingVertical: HEADER_CONTROL_VERTICAL_PADDING,
    borderRadius: HEADER_CONTROL_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontWeight: '400' },
})
