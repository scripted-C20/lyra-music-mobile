import { TouchableOpacity, StyleSheet } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useDS } from '@/theme/useDS'

export const BTN_WIDTH = 36
export const BTN_ICON_SIZE = 15

export default ({ icon, color, onPress, onLongPress }: {
  icon: string
  color?: string
  onPress: () => void
  onLongPress?: () => void
}) => {
  const ds = useDS()
  const isActive = !!color
  const iconColor = color ?? (ds.isDark ? 'rgba(255,255,255,0.88)' : 'rgba(34,34,38,0.82)')
  return (
    <TouchableOpacity
      style={[
        styles.btn,
        {
          width: BTN_WIDTH,
          height: BTN_WIDTH,
          backgroundColor: isActive ? ds.accentSoft : 'transparent',
          borderColor: isActive
            ? ds.isDark ? 'rgba(255,255,255,0.20)' : `${ds.accent}26`
            : 'transparent',
          shadowColor: 'transparent',
        },
      ]}
      hitSlop={8}
      activeOpacity={0.5}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <Icon name={icon} color={iconColor} size={BTN_ICON_SIZE} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  btn: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BTN_WIDTH / 2,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
})
