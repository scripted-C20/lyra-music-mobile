import { TouchableOpacity } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { createStyle } from '@/utils/tools'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT as _HEADER_HEIGHT } from '@/config/constant'
import { useDS } from '@/theme/useDS'

export const HEADER_HEIGHT = scaleSizeH(_HEADER_HEIGHT)

export default ({ icon, color, onPress }: {
  icon: string
  color?: string
  onPress: () => void
}) => {
  const ds = useDS()
  return (
    <TouchableOpacity
      activeOpacity={0.74}
      onPress={onPress}
      style={{
        ...styles.button,
        backgroundColor: ds.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.46)',
        borderColor: ds.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.42)',
        shadowColor: ds.isDark ? '#000000' : 'rgba(50,38,38,0.20)',
      }}
    >
      <Icon name={icon} color={color ?? ds.text} size={16} />
    </TouchableOpacity>
  )
}

const styles = createStyle({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
})
