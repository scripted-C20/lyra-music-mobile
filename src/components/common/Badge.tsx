import { memo, useMemo } from 'react'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from './Text'
// const menuItemHeight = 42
// const menuItemWidth = 100

const styles = createStyle({
  text: {
    marginRight: 6,
    paddingLeft: 6,
    paddingRight: 6,
    paddingTop: 2,
    paddingBottom: 2,
    borderRadius: 999,
    overflow: 'hidden',
    fontWeight: '500',
    alignSelf: 'center',
  },
})

export type BadgeType = 'normal' | 'secondary' | 'tertiary'

export default memo(({ type = 'normal', children }: {
  type?: BadgeType
  children: string
}) => {
  const theme = useTheme()
  // console.log(visible)
  const colors = useMemo(() => {
    const colors = { textColor: '', bgColor: '', borderColor: '' }
    switch (type) {
      case 'normal':
        colors.textColor = theme['c-badge-primary']
        colors.bgColor = theme['c-primary-light-500-alpha-700']
        colors.borderColor = theme['c-primary-light-200-alpha-500']
        break
      case 'secondary':
        colors.textColor = theme['c-badge-secondary']
        colors.bgColor = 'rgba(75, 174, 213, 0.12)'
        colors.borderColor = 'rgba(75, 174, 213, 0.24)'
        break
      case 'tertiary':
        colors.textColor = theme['c-badge-tertiary']
        colors.bgColor = 'rgba(231, 170, 54, 0.12)'
        colors.borderColor = 'rgba(231, 170, 54, 0.24)'
        break
    }
    return colors
  }, [type, theme])

  return (
    <Text
      style={{
        ...styles.text,
        backgroundColor: colors.bgColor,
        borderColor: colors.borderColor,
        borderWidth: 1,
      }}
      size={9}
      color={colors.textColor}
    >{children}</Text>
  )
})
