import { View, type ViewStyle, type StyleProp } from 'react-native'
import { useDS } from '@/theme/useDS'

interface CardProps {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  variant?: 'flat' | 'elevated' | 'grouped'
  padding?: number
}

/**
 * iOS 18 风格卡片
 * - flat: 无背景区分（用于纯分隔列表）
 * - elevated: 浮起卡片（默认）
 * - grouped: iOS 分组列表风格
 */
export const Card = ({ children, style, variant = 'elevated', padding }: CardProps) => {
  const ds = useDS()

  const baseStyle: ViewStyle = {
    borderRadius: ds.radius['2xl'],
    overflow: 'hidden',
  }

  const variantStyle: ViewStyle =
    variant === 'flat' ? {
      backgroundColor: 'transparent',
    } : variant === 'grouped' ? {
      backgroundColor: ds.bgCard,
    } : {
      backgroundColor: ds.bgCard,
    }

  return (
    <View style={[baseStyle, variantStyle, padding != null && { padding }, style]}>
      {children}
    </View>
  )
}
