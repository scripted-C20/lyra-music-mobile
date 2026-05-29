import { View, StyleSheet, type ViewStyle } from 'react-native'
import { useDS } from '@/theme/useDS'

interface SeparatorProps {
  inset?: number
  opaque?: boolean
  style?: ViewStyle
}

/**
 * iOS 风格 hairline 分隔线
 */
export const Separator = ({ inset = 0, opaque = false, style }: SeparatorProps) => {
  const ds = useDS()
  return (
    <View
      style={[
        {
          height: StyleSheet.hairlineWidth,
          backgroundColor: opaque ? ds.separatorOpaque : ds.separator,
          marginLeft: inset,
        },
        style,
      ]}
    />
  )
}
