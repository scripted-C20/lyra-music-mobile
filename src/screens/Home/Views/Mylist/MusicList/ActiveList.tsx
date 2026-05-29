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
  HEADER_CONTROL_FONT_SIZE,
  HEADER_CONTROL_HEIGHT,
  HEADER_CONTROL_HORIZONTAL_PADDING,
  HEADER_CONTROL_RADIUS,
  HEADER_CONTROL_ROW_GAP,
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
      <View style={styles.row}>
        <View style={[styles.searchBox, { backgroundColor: chipBg }]}>
          <Icon name="search-2" size={10} color={ds.textDim} />
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: ds.text }]}
            placeholder="搜索"
            placeholderTextColor={ds.textDim}
            value={searchText}
            onChangeText={handleChangeText}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
              <Icon name="close" size={10} color={ds.textDim} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          style={styles.scroll}
        >
          <TouchableOpacity
            style={[styles.chip, { backgroundColor: chipBg }]}
            activeOpacity={0.6}
            onPress={onNew}
          >
            <Text size={HEADER_CONTROL_FONT_SIZE} color={ds.text} style={styles.chipText}>新建歌单</Text>
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
                  active ? { backgroundColor: ds.accent } : { backgroundColor: chipBg },
                ]}
              >
                <Text
                  size={HEADER_CONTROL_FONT_SIZE}
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
            style={[styles.iconChip, { backgroundColor: chipBg }]}
            activeOpacity={0.6}
            onPress={onPlayAll}
          >
            <Icon family="ionicons" name="play-outline" size={12} color={ds.accent} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconChip, { backgroundColor: chipBg }]}
            activeOpacity={0.6}
            onPress={() => { global.app_event.changeLoveListVisible(true) }}
          >
            <Icon family="ionicons" name="menu" size={12} color={ds.textMuted} />
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
    minHeight: HEADER_CONTROL_HEIGHT,
    gap: HEADER_CONTROL_ROW_GAP,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: HEADER_CONTROL_RADIUS,
    paddingHorizontal: 6,
    height: HEADER_CONTROL_HEIGHT,
    gap: 3,
    width: 88,
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    fontSize: HEADER_CONTROL_FONT_SIZE,
    paddingVertical: 0,
    fontWeight: '400',
    height: HEADER_CONTROL_HEIGHT - 2,
  },
  clearBtn: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    height: HEADER_CONTROL_HEIGHT,
    borderRadius: HEADER_CONTROL_RADIUS,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: HEADER_CONTROL_HORIZONTAL_PADDING,
    paddingVertical: 0,
    flexShrink: 0,
  },
  chipText: { fontWeight: '400' },
  scroll: { flex: 1 },
  scrollContent: {
    alignItems: 'center',
    paddingRight: 2,
    gap: HEADER_CONTROL_ROW_GAP,
  },
  listChip: {
    height: HEADER_CONTROL_HEIGHT,
    paddingHorizontal: HEADER_CONTROL_HORIZONTAL_PADDING,
    paddingVertical: 0,
    borderRadius: HEADER_CONTROL_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 70,
  },
  listChipText: { fontWeight: '400' },
  iconChip: {
    width: HEADER_CONTROL_HEIGHT,
    height: HEADER_CONTROL_HEIGHT,
    borderRadius: HEADER_CONTROL_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: HEADER_CONTROL_ROW_GAP,
    flexShrink: 0,
  },
})
