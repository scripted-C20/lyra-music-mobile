import { View, TouchableOpacity } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { useNavActiveId, useStatusbarHeight } from '@/store/common/hook'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import StatusBar from '@/components/common/StatusBar'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT } from '@/config/constant'
import { type InitState as CommonState } from '@/store/common/state'

const headerComponents: Partial<Record<CommonState['navActiveId'], React.ReactNode>> = {}

const Header = () => {
  const theme = useTheme()
  const id = useNavActiveId()
  const t = useI18n()
  const statusBarHeight = useStatusbarHeight()
  const headerComponent = headerComponents[id] ?? null

  const openMenu = () => {
    global.app_event.changeMenuVisible(true)
  }

  return (
    <>
      <StatusBar />
      <View style={{
        ...styles.container,
        height: scaleSizeH(HEADER_HEIGHT) + statusBarHeight,
        paddingTop: statusBarHeight,
        backgroundColor: theme['c-content-background'],
        borderBottomColor: theme['c-border-background'],
      }}>
        <View style={styles.titleWrap}>
          <Text style={styles.eyebrow} size={9} color={theme['c-font-label']}>LX MUSIC</Text>
          <Text style={styles.title} size={16}>{t(id)}</Text>
        </View>
        <View style={styles.actions}>
          {
            headerComponent
              ? <View style={{ ...styles.rightSlot, backgroundColor: theme['c-primary-light-700-alpha-500'] }}>{headerComponent}</View>
              : null
          }
          <TouchableOpacity style={{ ...styles.btn, backgroundColor: theme['c-primary-light-1000-alpha-700'], borderColor: theme['c-border-background'] }} onPress={openMenu}>
            <Icon color={theme['c-font']} name="menu" size={16} />
          </TouchableOpacity>
        </View>
      </View>
    </>
  )
}

const styles = createStyle({
  container: {
    paddingLeft: 14,
    paddingRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
    borderBottomWidth: 1,
  },
  titleWrap: {
    flex: 1,
    justifyContent: 'center',
    height: '100%',
    paddingRight: 8,
  },
  eyebrow: {
    marginBottom: 1,
    letterSpacing: 1.1,
    fontWeight: '600',
  },
  title: {
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSlot: {
    minWidth: 86,
    maxWidth: '48%',
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 6,
  },
})

export default Header
