import { TouchableOpacity, StyleSheet } from 'react-native'
import Text from '@/components/common/Text'
import { useDS } from '@/theme/useDS'
import {
  HEADER_CONTROL_FONT_SIZE,
  HEADER_CONTROL_HORIZONTAL_PADDING,
  HEADER_CONTROL_VERTICAL_PADDING,
} from '../constants'

export interface CurrentTagBtnProps {
  name: string
  onShowList: () => void
}

export default ({ name, onShowList }: CurrentTagBtnProps) => {
  const ds = useDS()
  const label = name?.trim() && name !== '默认' ? name : '筛选'

  return (
    <TouchableOpacity style={styles.btn} activeOpacity={0.6} onPress={onShowList}>
      <Text size={HEADER_CONTROL_FONT_SIZE} color={ds.text} style={styles.text} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  btn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingHorizontal: HEADER_CONTROL_HORIZONTAL_PADDING,
    paddingVertical: HEADER_CONTROL_VERTICAL_PADDING,
  },
  text: {
    fontWeight: '400',
    includeFontPadding: false,
    textAlign: 'center',
  },
})
