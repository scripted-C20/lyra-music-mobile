import { createIconSetFromIcoMoon } from 'react-native-vector-icons'
import IconAntDesign from 'react-native-vector-icons/AntDesign'
import IconEntypo from 'react-native-vector-icons/Entypo'
import IconEvilIcons from 'react-native-vector-icons/EvilIcons'
import IconFeather from 'react-native-vector-icons/Feather'
import IconFontAwesome from 'react-native-vector-icons/FontAwesome'
import IconFontAwesome5 from 'react-native-vector-icons/FontAwesome5'
import IconFontisto from 'react-native-vector-icons/Fontisto'
import IconFoundation from 'react-native-vector-icons/Foundation'
import IconIonicons from 'react-native-vector-icons/Ionicons'
import IconMaterialIcons from 'react-native-vector-icons/MaterialIcons'
import IconMaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import IconOcticons from 'react-native-vector-icons/Octicons'
import IconSimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons'
import IconZocial from 'react-native-vector-icons/Zocial'
import icoMoonConfig from '@/resources/fonts/selection.json'
import { scaleSizeW } from '@/utils/pixelRatio'
import { memo, type ComponentProps } from 'react'
import { useTextShadow, useTheme } from '@/store/theme/hook'
import { StyleSheet, type StyleProp, type TextStyle } from 'react-native'

const IcoMoon = createIconSetFromIcoMoon(icoMoonConfig)
const getSafeIconSize = (size: number) => {
  const scaled = scaleSizeW(size)
  return Number.isFinite(scaled) && scaled >= 4 ? scaled : size
}

// https://oblador.github.io/react-native-vector-icons/

type IconType = ReturnType<typeof createIconSetFromIcoMoon>
const iconRegistry = {
  icomoon: IcoMoon,
  antDesign: IconAntDesign,
  entypo: IconEntypo,
  evilIcons: IconEvilIcons,
  feather: IconFeather,
  fontAwesome: IconFontAwesome,
  fontAwesome5: IconFontAwesome5,
  fontisto: IconFontisto,
  foundation: IconFoundation,
  ionicons: IconIonicons,
  materialIcons: IconMaterialIcons,
  materialCommunity: IconMaterialCommunityIcons,
  octicons: IconOcticons,
  simpleLineIcons: IconSimpleLineIcons,
  zocial: IconZocial,
} as const

export type IconFamily = keyof typeof iconRegistry

interface IconProps extends Omit<ComponentProps<IconType>, 'style' | 'name'> {
  family?: IconFamily
  name: string
  style?: StyleProp<TextStyle>
  rawSize?: number
  [key: string]: unknown
}

export const Icon = memo(({ size = 15, rawSize, color, style, family = 'icomoon', ...props }: IconProps) => {
  const theme = useTheme()
  const textShadow = useTextShadow()
  const newStyle = textShadow ? StyleSheet.compose({
    textShadowColor: theme['c-primary-dark-300-alpha-800'],
    textShadowOffset: { width: 0.2, height: 0.2 },
    textShadowRadius: 2,
  }, style) : style
  const IconComponent = (iconRegistry[family] ?? IcoMoon) as any
  return (
    <IconComponent
      size={rawSize ?? getSafeIconSize(size)}
      color={color ?? theme['c-font']}
      style={newStyle}
      {...props as any}
    />
  )
})


export {
  IconAntDesign,
  IconEntypo,
  IconEvilIcons,
  IconFeather,
  IconFontAwesome,
  IconFontAwesome5,
  IconFontisto,
  IconFoundation,
  IconIonicons,
  IconMaterialIcons,
  IconMaterialCommunityIcons,
  IconOcticons,
  IconZocial,
  IconSimpleLineIcons,
}
