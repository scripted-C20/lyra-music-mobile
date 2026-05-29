import { memo } from 'react'
import { ScrollView, TouchableOpacity, View, StyleSheet } from 'react-native'
import { useI18n, type Message } from '@/lang'
import { useNavActiveId, useStatusbarHeight } from '@/store/common/hook'
import { Icon } from '@/components/common/Icon'
import { confirmDialog, exitApp as backHome } from '@/utils/tools'
import { NAV_MENUS } from '@/config/constant'
import type { InitState } from '@/store/common/state'
import { exitApp, setNavActiveId } from '@/core/common'
import Text from '@/components/common/Text'
import { useSettingValue } from '@/store/setting/hook'
import { useDS } from '@/theme/useDS'
import { Separator } from '@/components/ui/Separator'

type IdType = InitState['navActiveId'] | 'nav_exit' | 'back_home'

// ─── Header ──────────────────────────────────────────────────────────────────
const Header = () => {
  const ds = useDS()
  const t = useI18n()
  const statusBarHeight = useStatusbarHeight()
  const themeId = useSettingValue('theme.id')
  const themeLabelKey = `theme_${themeId}` as keyof Message

  return (
    <View style={[styles.header, { paddingTop: statusBarHeight + 24 }]}>
      <View style={styles.brandRow}>
        <View style={[styles.logoBox, { backgroundColor: ds.accentSoft }]}>
          <Icon name="logo" color={ds.accent} size={28} />
        </View>
        <View style={styles.brandText}>
          <Text style={[styles.brandName, { color: ds.text }]}>LX Music</Text>
          <Text size={13} color={ds.textMuted} style={styles.brandSub}>
            {t('home_drawer_desc')}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={[styles.metaPill, { backgroundColor: ds.bgFloat }]}>
          <Text size={12} color={ds.textMuted} style={styles.metaText}>
            v{process.versions.app}
          </Text>
        </View>
        <View style={[styles.metaPill, { backgroundColor: ds.accentSoft }]}>
          <Text size={12} color={ds.accent} style={styles.metaText}>
            {t(themeLabelKey)}
          </Text>
        </View>
      </View>
    </View>
  )
}

// ─── MenuItem ─────────────────────────────────────────────────────────────────
const MenuItem = ({ id, icon, onPress, isLast }: {
  id: IdType
  icon: string
  onPress: (id: IdType) => void
  isLast?: boolean
}) => {
  const t = useI18n()
  const activeId = useNavActiveId()
  const ds = useDS()
  const active = activeId === id

  return (
    <>
      <TouchableOpacity
        style={[
          styles.menuItem,
          active && { backgroundColor: ds.fill4 },
        ]}
        activeOpacity={0.6}
        onPress={() => {
          onPress(id)
        }}
      >
        <View style={[
          styles.menuIcon,
          { backgroundColor: active ? ds.accent : ds.bgFloat },
        ]}>
          <Icon
            name={icon}
            size={18}
            color={active ? ds.textOnAccent : ds.text}
          />
        </View>
        <Text
          size={16}
          color={ds.text}
          style={active ? styles.menuLabelActive : styles.menuLabel}
          numberOfLines={1}
        >
          {t(id)}
        </Text>
        {active ? (
          <View style={[styles.activeDot, { backgroundColor: ds.accent }]} />
        ) : (
          <Icon name="chevron-right" size={14} color={ds.textDim} />
        )}
      </TouchableOpacity>
      {!isLast && <Separator inset={62} />}
    </>
  )
}

// ─── Section Title ────────────────────────────────────────────────────────────
const SectionTitle = ({ label }: { label: string }) => {
  const ds = useDS()
  return (
    <Text size={11} color={ds.textDim} style={styles.sectionTitle}>
      {label.toUpperCase()}
    </Text>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default memo(() => {
  const ds = useDS()
  const t = useI18n()
  const showBackBtn = useSettingValue('common.showBackBtn')
  const showExitBtn = useSettingValue('common.showExitBtn')

  const handlePress = (id: IdType) => {
    switch (id) {
      case 'nav_exit':
        void confirmDialog({
          message: global.i18n.t('exit_app_tip'),
          confirmButtonText: global.i18n.t('list_remove_tip_button'),
        }).then(isExit => {
          if (!isExit) return
          exitApp('Exit Btn')
        })
        return
      case 'back_home':
        backHome()
        return
    }
    global.app_event.changeMenuVisible(false)
    setNavActiveId(id)
  }

  const discoverMenus = NAV_MENUS.slice(0, 3)
  const libraryMenus = NAV_MENUS.slice(3)

  return (
    <View style={[styles.root, { backgroundColor: ds.bg }]}>
      <Header />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <SectionTitle label={t('home_drawer_discover')} />
        <View style={[styles.menuGroup, { backgroundColor: ds.bgCard }]}>
          {discoverMenus.map((menu, i) => (
            <MenuItem
              key={menu.id}
              id={menu.id}
              icon={menu.icon}
              onPress={handlePress}
              isLast={i === discoverMenus.length - 1}
            />
          ))}
        </View>

        <SectionTitle label={t('home_drawer_library')} />
        <View style={[styles.menuGroup, { backgroundColor: ds.bgCard }]}>
          {libraryMenus.map((menu, i) => (
            <MenuItem
              key={menu.id}
              id={menu.id}
              icon={menu.icon}
              onPress={handlePress}
              isLast={i === libraryMenus.length - 1}
            />
          ))}
        </View>
      </ScrollView>

      {(showBackBtn || showExitBtn) && (
        <View style={styles.footer}>
          <View style={[styles.menuGroup, { backgroundColor: ds.bgCard }]}>
            {showBackBtn && (
              <MenuItem id="back_home" icon="home" onPress={handlePress} isLast={!showExitBtn} />
            )}
            {showExitBtn && (
              <MenuItem id="nav_exit" icon="exit2" onPress={handlePress} isLast />
            )}
          </View>
        </View>
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  root: { flex: 1 },
  // Header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  logoBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandText: { flex: 1 },
  brandName: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.6,
    marginBottom: 2,
  },
  brandSub: {
    fontWeight: '400',
    lineHeight: 17,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metaPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  metaText: {
    fontWeight: '500',
  },
  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontWeight: '500',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  // Group container
  menuGroup: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  // MenuItem
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    minHeight: 56,
    gap: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    flex: 1,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  menuLabelActive: {
    flex: 1,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // Footer
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },
})
