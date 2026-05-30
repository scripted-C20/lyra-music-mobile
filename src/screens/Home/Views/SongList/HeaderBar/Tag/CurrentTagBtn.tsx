import { TouchableOpacity, StyleSheet } from 'react-native'
import Text from '@/components/common/Text'
import { useDS } from '@/theme/useDS'
import {
  useHeaderControlMetrics,
} from '../constants'

export interface CurrentTagBtnProps {
  name: string
  onShowList: () => void
}

export default ({ name, onShowList }: CurrentTagBtnProps) => {
  const ds = useDS()
  const controlMetrics = useHeaderControlMetrics()
  const label = name?.trim() && name !== '默认' ? name : '筛选'

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        {
          paddingHorizontal: controlMetrics.horizontalPadding,
          paddingVertical: controlMetrics.verticalPadding,
        },
      ]}
      activeOpacity={0.6}
      onPress={onShowList}
    >
      <Text size={controlMetrics.fontSize} color={ds.text} style={styles.text} numberOfLines={1}>
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
  },
  text: {
    fontWeight: '400',
    includeFontPadding: false,
    textAlign: 'center',
  },
})
