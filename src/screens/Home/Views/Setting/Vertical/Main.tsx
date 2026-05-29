import { memo, useCallback, useEffect, useState } from 'react'
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'

import Basic from '../settings/Basic'
import CustomSource from '../settings/CustomSource'
import Player from '../settings/Player'
import LyricDesktop from '../settings/LyricDesktop'
import Search from '../settings/Search'
import List from '../settings/List'
import Sync from '../settings/Sync'
import Backup from '../settings/Backup'
import Other from '../settings/Other'
import About from '../../About'
import { normalizeSettingScreenId, SETTING_SCREENS, type SettingScreenIds } from '../Main'
import Text from '@/components/common/Text'
import { useDS } from '@/theme/useDS'
import { useNavActiveId } from '@/store/common/hook'
import {
  HEADER_CONTROL_FONT_SIZE,
  HEADER_CONTROL_HEIGHT,
  HEADER_CONTROL_HORIZONTAL_PADDING,
  HEADER_CONTROL_RADIUS,
  HEADER_CONTROL_ROW_GAP,
  HEADER_CONTROL_VERTICAL_PADDING,
} from '../../common/headerControls'

const SETTING_LABELS: Record<SettingScreenIds, string> = {
  basic: '基本',
  custom_source: '自定义源',
  player: '播放',
  lyric_desktop: '歌词',
  search: '搜索',
  list: '列表',
  sync: '同步',
  backup: '备份',
  other: '其他',
}

type TabId = SettingScreenIds | 'about'
const ALL_TABS: TabId[] = [...SETTING_SCREENS, 'about']
const TAB_LABELS: Record<TabId, string> = {
  ...SETTING_LABELS,
  about: '关于',
}

const SettingContent = memo(({ id }: { id: TabId }) => {
  switch (id) {
    case 'custom_source': return <CustomSource />
    case 'player': return <Player />
    case 'lyric_desktop': return <LyricDesktop />
    case 'search': return <Search />
    case 'list': return <List />
    case 'sync': return <Sync />
    case 'backup': return <Backup />
    case 'other': return <Other />
    case 'about': return <About />
    case 'basic':
    default: return <Basic />
  }
}, (prev, next) => prev.id === next.id)

export default () => {
  const ds = useDS()
  const navActiveId = useNavActiveId()
  const [activeId, setActiveId] = useState<TabId>(normalizeSettingScreenId(global.lx.settingActiveId))

  const handleSelect = useCallback((id: TabId) => {
    if (id !== 'about') {
      global.lx.settingActiveId = id
    }
    setActiveId(id)
  }, [])

  useEffect(() => {
    if (navActiveId == 'nav_about') {
      setActiveId('about')
      return
    }
    if (navActiveId == 'nav_setting') {
      setActiveId(normalizeSettingScreenId(global.lx.settingActiveId))
    }
  }, [navActiveId])

  const chipBg = ds.isDark ? ds.bgFloat : '#FFFFFF'

  return (
    <View style={styles.container}>
      {/* 操作区：横向可滚动的设置分类按钮 */}
      <View style={[styles.headerBar, { backgroundColor: ds.isDark ? ds.bg : 'rgba(249,249,249,0.98)' }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {ALL_TABS.map(id => {
            const active = activeId === id
            return (
              <TouchableOpacity
                key={id}
                activeOpacity={0.6}
                onPress={() => { handleSelect(id) }}
                style={[
                  styles.chip,
                  active
                    ? { backgroundColor: ds.accent }
                    : { backgroundColor: chipBg },
                ]}
              >
                <Text
                  size={HEADER_CONTROL_FONT_SIZE}
                  color={active ? ds.textOnAccent : ds.text}
                  style={styles.chipText}
                >
                  {TAB_LABELS[id]}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* 设置内容区 */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        <SettingContent id={activeId} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    paddingHorizontal: 12,
    paddingTop: 0,
    paddingBottom: 2,
  },
  scrollContent: {
    alignItems: 'center',
    gap: HEADER_CONTROL_ROW_GAP,
    paddingRight: 4,
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
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 28,
  },
})
