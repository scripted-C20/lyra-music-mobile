import { memo, useEffect, useRef, useState, useMemo } from 'react'
import { TouchableOpacity, View, StyleSheet } from 'react-native'
import { setNavActiveId } from '@/core/common'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { useNavActiveId, useStatusbarHeight } from '@/store/common/hook'
import { useDS } from '@/theme/useDS'
import StatusBar from '@/components/common/StatusBar'
import Input, { type InputType, type InputProps } from '@/components/common/Input'
import searchState from '@/store/search/state'
import commonState from '@/store/common/state'
import { useHeaderControlMetrics } from '../Views/common/headerControls'

export default memo(() => {
  const activeId = useNavActiveId()
  const statusbarHeight = useStatusbarHeight()
  const ds = useDS()
  const t = useI18n()
  const controlMetrics = useHeaderControlMetrics()
  const inputRef = useRef<InputType>(null)
  const prevActiveIdRef = useRef(activeId)
  const [searchText, setSearchText] = useState(searchState.searchText)

  const isSearchActive = activeId === 'nav_search'
  const isSettingActive = activeId === 'nav_setting'

  const title = useMemo(() => {
    if (isSettingActive) return t('nav_setting')
    if (isSearchActive) return t('nav_search')
    return t(activeId)
  }, [activeId, isSettingActive, isSearchActive, t])

  useEffect(() => {
    const handleSyncText = (text: string) => { setSearchText(text) }
    global.app_event.on('topNavSearchTextUpdate', handleSyncText)
    return () => { global.app_event.off('topNavSearchTextUpdate', handleSyncText) }
  }, [])

  useEffect(() => {
    if (isSearchActive && prevActiveIdRef.current !== 'nav_search') {
      requestAnimationFrame(() => { inputRef.current?.focus() })
    }
    if (!isSearchActive) inputRef.current?.blur()
    prevActiveIdRef.current = activeId
  }, [activeId, isSearchActive])

  const handleSearchSubmit = (text: string) => { global.app_event.topNavSearchSubmit(text.trim()) }
  const handleClearText = () => { setSearchText(''); global.app_event.topNavSearchTextChange(''); global.app_event.topNavSearchSubmit('') }
  const handleChangeText = (text: string) => {
    setSearchText(text)
    global.app_event.topNavSearchTextChange(text.trim())
  }
  const handleInputSubmit = (({ nativeEvent: { text } }) => { handleSearchSubmit(text) }) as NonNullable<InputProps['onSubmitEditing']>

  const goToSearch = () => {
    global.lx.shouldClearSearchOnOpen = true
    setNavActiveId('nav_search')
    requestAnimationFrame(() => {
      global.app_event.topNavSearchOpen()
    })
  }
  const goBackFromSearch = () => {
    setNavActiveId(commonState.lastNavActiveId === 'nav_search' ? 'nav_songlist' : commonState.lastNavActiveId)
  }

  return (
    <>
      <StatusBar />
      <View style={[styles.wrap, { paddingTop: statusbarHeight, backgroundColor: ds.isDark ? ds.bg : 'rgba(249,249,249,0.98)' }]}>
        <View style={styles.panel}>
          {/* 搜索页：返回icon + 搜索框 + 版本 */}
          {isSearchActive ? (
            <View style={[styles.row, { minHeight: controlMetrics.height + 10, gap: controlMetrics.rowGap * 2 }]}>
              <TouchableOpacity
                activeOpacity={0.6}
                onPress={goBackFromSearch}
                style={[styles.backBtn, { width: controlMetrics.height + 4, height: controlMetrics.height + 4 }]}
              >
                <Icon name="chevron-left" size={controlMetrics.actionIconSize + 4} color={ds.text} />
              </TouchableOpacity>

              <View
                style={[
                  styles.searchEntry,
                  {
                    backgroundColor: ds.isDark ? ds.bgFloat : 'rgba(0,0,0,0.04)',
                    flex: 1,
                    height: controlMetrics.height,
                    borderRadius: controlMetrics.radius,
                    paddingHorizontal: controlMetrics.horizontalPadding,
                    gap: controlMetrics.gap,
                  },
                ]}
              >
                <Icon name="search-2" size={controlMetrics.iconSize + 1} color={ds.textDim} />
                <Input
                  ref={inputRef}
                  size={controlMetrics.fontSize}
                  value={searchText}
                  onChangeText={handleChangeText}
                  onSubmitEditing={handleInputSubmit}
                  onClearText={handleClearText}
                  placeholder={t('search_placeholder')}
                  placeholderTextColor={ds.textDim}
                  style={[styles.searchInputInline, { color: ds.text, height: controlMetrics.height }]}
                  returnKeyType="search"
                  clearBtn
                />
              </View>

              <TouchableOpacity
                activeOpacity={0.6}
                onPress={() => { handleSearchSubmit(searchText) }}
                style={[
                  styles.searchBtn,
                  {
                    backgroundColor: ds.accent,
                    height: controlMetrics.height,
                    borderRadius: controlMetrics.radius,
                    paddingHorizontal: controlMetrics.horizontalPadding + 4,
                  },
                ]}
              >
                <Text size={controlMetrics.fontSize} color={ds.textOnAccent} style={styles.searchBtnText}>搜索</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* 一行：标题 + 搜索入口 + 版本号 */}
              <View style={[styles.row, { minHeight: controlMetrics.height + 10, gap: controlMetrics.rowGap * 2 }]}>
                <Text size={controlMetrics.fontSize} style={[styles.title, { color: ds.text }]} numberOfLines={1}>
                  {title}
                </Text>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={goToSearch}
                  style={[
                    styles.searchEntry,
                    {
                      backgroundColor: ds.isDark ? ds.bgFloat : 'rgba(0,0,0,0.04)',
                      height: controlMetrics.height,
                      borderRadius: controlMetrics.radius,
                      paddingHorizontal: controlMetrics.horizontalPadding,
                      gap: controlMetrics.gap,
                    },
                  ]}
                >
                  <Icon name="search-2" size={controlMetrics.iconSize + 1} color={ds.textDim} />
                  <Text size={controlMetrics.fontSize} color={ds.textDim} numberOfLines={1} style={styles.searchPlaceholder}>
                    {t('search_placeholder')}
                  </Text>
                </TouchableOpacity>

                <Text size={controlMetrics.fontSize} color={ds.textDim} style={styles.version}>
                  v{process.versions.app}
                </Text>
              </View>
            </>
          )}

          {/* 设置/关于 子 Tab — 已移到设置操作区 */}
        </View>
      </View>
    </>
  )
})

const styles = StyleSheet.create({
  wrap: {},
  panel: {
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '400',
    letterSpacing: 0,
    flexShrink: 0,
  },
  searchEntry: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchPlaceholder: {
    flex: 1,
  },
  searchInputInline: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingLeft: 0,
    paddingRight: 0,
  },
  searchBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: { fontWeight: '500' },
  version: {
    fontWeight: '400',
    flexShrink: 0,
  },
})
