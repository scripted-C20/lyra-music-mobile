import { memo } from 'react'
import { StyleSheet } from 'react-native'
import Button, { type BtnProps } from '@/components/common/Button'
import Text from '@/components/common/Text'
import { useDS } from '@/theme/useDS'

type ButtonProps = BtnProps

export default memo(({ disabled, onPress, children }: ButtonProps) => {
  const ds = useDS()
  return (
    <Button
      style={[styles.button, { backgroundColor: ds.accentSoft }]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text size={12} color={ds.accent} style={styles.label}>{children}</Text>
    </Button>
  )
})

const styles = StyleSheet.create({
  button: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6, marginRight: 6 },
  label: { fontWeight: '500' },
})
