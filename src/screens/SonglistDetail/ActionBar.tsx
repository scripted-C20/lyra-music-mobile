import { memo, useCallback } from 'react'
import { View, TouchableOpacity, TextInput, StyleSheet } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { pop } from '@/navigation'
import commonState from '@/store/common/state'
import { handleCollect, handlePlay } from './listAction'
import songlistState from '@/store/songlist/state'
import { useListInfo } from './state'
import { useDS } from '@/theme/useDS'
import {
  ACTION_CONTROL_FONT_SIZE,
  ACTION_ICON_BTN_RADIUS,
  ACTION_ICON_BTN_SIZE,
  ACTION_RAIL_GAP,
  ACTION_RAIL_PADDING,
  ACTION_ROW_GAP,
  ACTION_SEARCH_HEIGHT,
  ACTION_SEARCH_ICON_SIZE,
  ACTION_SEARCH_RADIUS,
} from '@/components/common/actionBarTokens'

export interface ActionBarProps {
  searchText: string
  onSearch: (text: string) => void
}

export default memo(({ searchText, onSearch }: ActionBarProps) => {
  const ds = useDS()
  const info = useListInfo()

  const back = () => {
    void pop(commonState.componentIds.songlistDetail!)
  }

  const handlePlayAll = () => {
    if (!songlistState.listDetailInfo.info.name) return
    void handlePlay(info.id, info.source, songlistState.listDetailInfo.list)
  }

  const handleCollection = () => {
    if (!songlistState.listDetailInfo.info.name) return
    void handleCollect(info.id, info.source, songlistState.listDetailInfo.info.name || info.name)
  }

  const handleClear = useCallback(() => {
    onSearch('')
  }, [onSearch])

  const railBg = ds.isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF'
  const searchBg = ds.isDark ? 'rgba(255,255,255,0.06)' : '#F6F7F9'

  return (
    <View style={styles.container}>
      <View style={styles.primaryRow}>
        <View style={[styles.searchBox, { backgroundColor: searchBg }]}>
          <Icon name="search-2" size={ACTION_SEARCH_ICON_SIZE} color={ds.textDim} />
          <TextInput
            style={[styles.searchInput, { color: ds.text }]}
            placeholder="搜索当前列表"
            placeholderTextColor={ds.textDim}
            value={searchText}
            onChangeText={onSearch}
            returnKeyType="search"
          />
          {searchText ? (
            <TouchableOpacity activeOpacity={0.7} onPress={handleClear} style={styles.clearBtn}>
              <Icon name="close" size={10} color={ds.textDim} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={[styles.actionRail, { backgroundColor: railBg, borderColor: ds.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)' }]}>
          <TouchableOpacity activeOpacity={0.8} onPress={handlePlayAll} style={[styles.iconBtn, styles.iconBtnActive, { backgroundColor: ds.accent }]}>
            <Icon name="play-outline" size={14} color={ds.textOnAccent} />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} onPress={handleCollection} style={styles.iconBtn}>
            <Icon name="love" size={13} color={ds.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} onPress={back} style={styles.iconBtn}>
            <Icon name="back-2" size={13} color={ds.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  primaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ACTION_ROW_GAP,
  },
  searchBox: {
    flex: 1,
    minHeight: ACTION_SEARCH_HEIGHT,
    borderRadius: ACTION_SEARCH_RADIUS,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 8,
    gap: 5,
  },
  searchInput: {
    flex: 1,
    fontSize: ACTION_CONTROL_FONT_SIZE,
    paddingVertical: 0,
    height: ACTION_SEARCH_HEIGHT - 4,
  },
  clearBtn: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRail: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: ACTION_SEARCH_RADIUS,
    borderWidth: 1,
    paddingHorizontal: ACTION_RAIL_PADDING,
    paddingVertical: ACTION_RAIL_PADDING,
    gap: ACTION_RAIL_GAP,
  },
  iconBtn: {
    width: ACTION_ICON_BTN_SIZE,
    height: ACTION_ICON_BTN_SIZE,
    borderRadius: ACTION_ICON_BTN_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: {},
})
