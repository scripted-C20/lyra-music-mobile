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
  useActionBarMetrics,
} from '@/components/common/actionBarTokens'

export interface ActionBarProps {
  searchText: string
  onSearch: (text: string) => void
}

export default memo(({ searchText, onSearch }: ActionBarProps) => {
  const ds = useDS()
  const info = useListInfo()
  const metrics = useActionBarMetrics()

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
      <View style={[styles.primaryRow, { gap: metrics.rowGap }]}>
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: searchBg,
              minHeight: metrics.searchHeight,
              borderRadius: metrics.searchRadius,
              gap: Math.max(5, metrics.railGap),
            },
          ]}
        >
          <Icon name="search-2" size={metrics.searchIconSize} color={ds.textDim} />
          <TextInput
            style={[styles.searchInput, { color: ds.text, fontSize: metrics.inputFontSize, height: metrics.searchHeight - 4 }]}
            placeholder="搜索当前列表"
            placeholderTextColor={ds.textDim}
            value={searchText}
            onChangeText={onSearch}
            returnKeyType="search"
          />
          {searchText ? (
            <TouchableOpacity activeOpacity={0.7} onPress={handleClear} style={[styles.clearBtn, { width: metrics.clearButtonSize, height: metrics.clearButtonSize }]}>
              <Icon name="close" size={metrics.clearIconSize} color={ds.textDim} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View
          style={[
            styles.actionRail,
            {
              backgroundColor: railBg,
              borderColor: ds.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)',
              borderRadius: metrics.searchRadius,
              paddingHorizontal: metrics.railPadding,
              paddingVertical: metrics.railPadding,
              gap: metrics.railGap,
            },
          ]}
        >
          <TouchableOpacity activeOpacity={0.8} onPress={handlePlayAll} style={[styles.iconBtn, styles.iconBtnActive, { backgroundColor: ds.accent, width: metrics.iconBtnSize, height: metrics.iconBtnSize, borderRadius: metrics.iconBtnRadius }]}>
            <Icon name="play-outline" size={metrics.actionIconSize + 2} color={ds.textOnAccent} />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} onPress={handleCollection} style={[styles.iconBtn, { width: metrics.iconBtnSize, height: metrics.iconBtnSize, borderRadius: metrics.iconBtnRadius }]}>
            <Icon name="love" size={metrics.actionIconSize + 1} color={ds.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} onPress={back} style={[styles.iconBtn, { width: metrics.iconBtnSize, height: metrics.iconBtnSize, borderRadius: metrics.iconBtnRadius }]}>
            <Icon name="back-2" size={metrics.actionIconSize + 1} color={ds.textMuted} />
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
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
  },
  clearBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRail: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  iconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: {},
})
