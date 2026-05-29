import { forwardRef, useImperativeHandle, useState } from 'react'
import { TouchableOpacity, StyleSheet } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useDS } from '@/theme/useDS'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { normalizeSettingScreenId, type SettingScreenIds } from '../Main'

export interface HeaderProps { onShowNavBar: () => void }
export interface HeaderType { setActiveId: (id: SettingScreenIds) => void }

export default forwardRef<HeaderType, HeaderProps>(({ onShowNavBar }, ref) => {
  const [activeId, setActiveId] = useState(normalizeSettingScreenId(global.lx.settingActiveId))
  const ds = useDS()
  const t = useI18n()

  useImperativeHandle(ref, () => ({ setActiveId(id) { setActiveId(id) } }))

  return (
    <TouchableOpacity
      onPress={onShowNavBar}
      style={[styles.container, { borderBottomColor: ds.separator }]}
      activeOpacity={0.6}
    >
      <Icon name="chevron-right" size={14} color={ds.accent} style={styles.icon} />
      <Text numberOfLines={1} size={16} color={ds.accent} style={styles.text}>
        {t(`setting_${activeId}`)}
      </Text>
    </TouchableOpacity>
  )
})

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  icon: { marginRight: 8 },
  text: { flex: 1, fontWeight: '500' },
})
