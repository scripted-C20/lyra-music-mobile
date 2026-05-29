import { memo } from 'react'
import { TouchableOpacity, View, StyleSheet } from 'react-native'
import { setNavActiveId } from '@/core/common'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { useNavActiveId } from '@/store/common/hook'
import { useDS } from '@/theme/useDS'
import { useKeyboard } from '@/utils/hooks'

const BOTTOM_TABS = [
  { id: 'nav_songlist' },
  { id: 'nav_top' },
  { id: 'nav_love' },
  { id: 'nav_setting' },
] as const
type BottomTabId = typeof BOTTOM_TABS[number]['id']

export default memo(() => {
  const activeId = useNavActiveId()
  const ds = useDS()
  const t = useI18n()
  const { keyboardShown } = useKeyboard()

  if (keyboardShown) return null
  if (activeId === 'nav_search') return null

  const getTabActive = (tabId: BottomTabId) => {
    if (tabId === 'nav_songlist') return activeId === 'nav_songlist'
    if (tabId === 'nav_setting') return activeId === 'nav_setting' || activeId === 'nav_about'
    return activeId === tabId
  }

  return (
    <View style={[
      styles.bar,
    ]}>
      {BOTTOM_TABS.map(tab => {
        const active = getTabActive(tab.id)
        return (
          <TouchableOpacity
            key={tab.id}
            activeOpacity={0.6}
            onPress={() => {
              if (!active) setNavActiveId(tab.id)
            }}
            style={styles.item}
          >
            <Text
              size={15}
              color={active ? ds.text : ds.textDim}
              style={active ? styles.labelActive : styles.label}
              numberOfLines={1}
            >
              {t(tab.id)}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
})

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    paddingTop: 4,
    paddingHorizontal: 8,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  label: { fontWeight: '400' },
  labelActive: { fontWeight: '700' },
})
