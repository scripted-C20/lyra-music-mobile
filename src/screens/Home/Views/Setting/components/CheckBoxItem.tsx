import { memo } from 'react'
import { View, StyleSheet } from 'react-native'
import CheckBox, { type CheckBoxProps } from '@/components/common/CheckBox'

export default memo((props: CheckBoxProps) => {
  return (
    <View style={styles.container}>
      <CheckBox {...props} />
    </View>
  )
})

const styles = StyleSheet.create({
  container: { paddingHorizontal: 12, paddingVertical: 2 },
})
