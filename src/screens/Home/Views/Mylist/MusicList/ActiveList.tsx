import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { TouchableOpacity, View, StyleSheet, ScrollView, TextInput } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useActiveListId, useMyList } from '@/store/list/hook'
import { getListPrevSelectId } from '@/utils/data'
import { setActiveList } from '@/core/list'
import Text from '@/components/common/Text'
import { LIST_IDS } from '@/config/constant'
import { useSettingValue } from '@/store/setting/hook'
import { useDS } from '@/theme/useDS'
import {
  useHeaderControlMetrics,
} from '../../common/headerControls'

export interface ActiveListProps {
  onSearch: (keyword: string) => void
  onScrollToTop: () => void
  onPlayAll: () => void
  onNew?: () => void
}
export interface ActiveListType {
  setVisibleBar: (visible: boolean) => void
}

// 截断到4个字
const truncate = (str: string) => str.length > 4 ? str.slice(0, 4) + '…' : str

export default forwardRef<ActiveListType, ActiveListProps>(({ onSearch, onScrollToTop, onPlayAll, onNew }, ref) => {
  const ds = useDS()
  const controlMetrics = useHeaderControlMetrics()
  const currentListId = useActiveListId()
  const allLists = useMyList()
  const langId = useSettingValue('common.langId')
  const [visibleBar, setVisibleBar] = useState(true)
  const [searchText, setSearchText] = useState('')
  const inputRef = useRef<TextInput>(null)

  useImperativeHandle(ref, () => ({
    setVisibleBar(visible) { setVisibleBar(visible) },
  }))

  useEffect(() => {
    void getListPrevSelectId().then((id) => { setActiveList(id) })
  }, [])

  // 所有歌单：我的收藏 + 试听列表 + 用户自定义
  const scrollLists = useMemo(() => {
    const fixed = [
      { id: LIST_IDS.DEFAULT, name: '试听列表' },
      { id: LIST_IDS.LOVE, name: '我的收藏' },
    ]
    const user = allLists.filter(l =>
      l.id !== LIST_IDS.LOVE &&
      l.id !== LIST_IDS.TEMP &&
      l.id !== LIST_IDS.DOWNLOAD &&
      l.id !== LIST_IDS.DEFAULT,
    )
    return [...fixed, ...user]
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allLists, langId])

  const handleSelectList = (id: string) => {
    if (id !== currentListId) {
      requestAnimationFrame(() => { setActiveList(id) })
    }
  }

  const handleChangeText = useCallback((text: string) => {
    setSearchText(text)
    onSearch(text.trim())
  }, [onSearch])

  const handleClear = useCallback(() => {
    setSearchText('')
    onSearch('')
    inputRef.current?.blur()
  }, [onSearch])

  if (!visibleBar) return null

  const chipBg = ds.isDark ? ds.bgFloat : '#FFFFFF'
  return (
    <View style={[styles.wrapper, { backgroundColor: ds.isDark ? ds.bg : 'rgba(249,249,249,0.98)' }]}>
      <View style={[styles.row, { minHeight: controlMetrics.height, gap: controlMetrics.rowGap }]}>
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: chipBg,
              borderRadius: controlMetrics.radius,
              paddingHorizontal: Math.max(6, controlMetrics.horizontalPadding),
              height: controlMetrics.height,
              gap: controlMetrics.gap,
              width: controlMetrics.minSearchWidth,
            },
          ]}
        >
          <Icon name="search-2" size={controlMetrics.iconSize} color={ds.textDim} />
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: ds.text, fontSize: controlMetrics.inputFontSize, height: controlMetrics.height - 2 }]}
            placeholder="搜索"
            placeholderTextColor={ds.textDim}
            value={searchText}
            onChangeText={handleChangeText}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={[styles.clearBtn, { width: controlMetrics.clearButtonSize, height: controlMetrics.clearButtonSize }]}>
              <Icon name="close" size={controlMetrics.clearIconSize} color={ds.textDim} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { gap: controlMetrics.rowGap }]}
          style={styles.scroll}
        >
          <TouchableOpacity
            style={[
              styles.chip,
              {
                backgroundColor: chipBg,
                height: controlMetrics.height,
                borderRadius: controlMetrics.radius,
                paddingHorizontal: controlMetrics.horizontalPadding,
              },
            ]}
            activeOpacity={0.6}
            onPress={onNew}
          >
            <Text size={controlMetrics.fontSize} color={ds.text} style={styles.chipText}>新建歌单</Text>
          </TouchableOpacity>

          {scrollLists.map(list => {
            const active = currentListId === list.id
            return (
              <TouchableOpacity
                key={list.id}
                activeOpacity={0.6}
                onPress={() => { handleSelectList(list.id) }}
                style={[
                  styles.listChip,
                  {
                    height: controlMetrics.height,
                    paddingHorizontal: controlMetrics.horizontalPadding,
                    borderRadius: controlMetrics.radius,
                    maxWidth: Math.max(70, controlMetrics.height * 3),
                  },
                  active ? { backgroundColor: ds.accent } : { backgroundColor: chipBg },
                ]}
              >
                <Text
                  size={controlMetrics.fontSize}
                  color={active ? ds.textOnAccent : ds.text}
                  style={styles.listChipText}
                  numberOfLines={1}
                >
                  {truncate(list.name)}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
        <View style={styles.rightActions}>
          <TouchableOpacity
            style={[
              styles.iconChip,
              {
                backgroundColor: chipBg,
                width: controlMetrics.height,
                height: controlMetrics.height,
                borderRadius: controlMetrics.radius,
              },
            ]}
            activeOpacity={0.6}
            onPress={onPlayAll}
          >
            <Icon family="ionicons" name="play-outline" size={controlMetrics.actionIconSize} color={ds.accent} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.iconChip,
              {
                backgroundColor: chipBg,
                width: controlMetrics.height,
                height: controlMetrics.height,
                borderRadius: controlMetrics.radius,
              },
            ]}
            activeOpacity={0.6}
            onPress={() => { global.app_event.changeLoveListVisible(true) }}
          >
            <Icon family="ionicons" name="menu" size={controlMetrics.actionIconSize} color={ds.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 12,
    paddingTop: 0,
    paddingBottom: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
    fontWeight: '400',
  },
  clearBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0,
    flexShrink: 0,
  },
  chipText: { fontWeight: '400' },
  scroll: { flex: 1 },
  scrollContent: {
    alignItems: 'center',
    paddingRight: 2,
  },
  listChip: {
    paddingVertical: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listChipText: { fontWeight: '400' },
  iconChip: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
})
