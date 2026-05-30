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
  useHeaderControlMetrics,
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
  const controlMetrics = useHeaderControlMetrics()
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
      <View style={[styles.row, { minHeight: controlMetrics.height, gap: controlMetrics.rowGap }]}>
        {/* 左：歌曲/歌单切换（固定） */}
        <View style={[styles.typeChip, { backgroundColor: chipBg, height: controlMetrics.height, borderRadius: controlMetrics.radius }]}>
          <SearchTypeSelector />
        </View>

        {/* 中间：来源列表（可滚动） */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { gap: controlMetrics.rowGap }]}
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
                  {
                    height: controlMetrics.height,
                    paddingHorizontal: controlMetrics.horizontalPadding,
                    paddingVertical: controlMetrics.verticalPadding,
                    borderRadius: controlMetrics.radius,
                  },
                  active ? { backgroundColor: ds.accent } : { backgroundColor: chipBg },
                ]}
              >
                <Text
                  size={controlMetrics.fontSize}
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
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingRight: 4,
  },
  typeChip: {
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 0,
    paddingVertical: 0,
    flexShrink: 0,
  },
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontWeight: '400' },
})
