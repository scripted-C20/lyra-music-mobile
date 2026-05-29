import { forwardRef, useImperativeHandle, useState } from 'react'
import { TouchableOpacity } from 'react-native'

import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'

export interface ActiveListNameProps {
  onShowBound: () => void
}
export interface ActiveListNameType {
  setBound: (id: string, name: string) => void
}

export default forwardRef<ActiveListNameType, ActiveListNameProps>(({ onShowBound }, ref) => {
  const theme = useTheme()
  let [currentListName, setCurrentListName] = useState('')

  useImperativeHandle(ref, () => ({
    setBound(id, name) {
      setCurrentListName(name)
    },
  }), [])

  return (
    <TouchableOpacity onPress={onShowBound} style={styles.currentList}>
      <Text numberOfLines={1} style={styles.currentListText} size={12.5} color={theme['c-primary-dark-200']}>{currentListName || global.i18n.t('nav_top')}</Text>
      <Icon name="chevron-right" color={theme['c-font-label']} size={12} />
    </TouchableOpacity>
  )
})


const styles = createStyle({
  currentList: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 10,
    paddingRight: 10,
    minHeight: 30,
  },
  currentListText: {
    flex: 1,
    paddingRight: 8,
    fontWeight: '700',
  },
})
