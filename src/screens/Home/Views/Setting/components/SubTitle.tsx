import { memo } from 'react'
import { View, StyleSheet } from 'react-native'
import Text from '@/components/common/Text'
import { useDS } from '@/theme/useDS'

export default memo(({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode | React.ReactNode[]
}) => {
  const ds = useDS()

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text size={12} style={styles.title} color={ds.textMuted}>{title}</Text>
      </View>
      {description ? (
        <Text size={11} color={ds.textDim} style={styles.desc}>{description}</Text>
      ) : null}
      <View style={styles.body}>{children}</View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: { marginBottom: 6, paddingHorizontal: 12 },
  header: { marginBottom: 2 },
  title: { fontWeight: '500', fontSize: 12 },
  desc: { lineHeight: 15, marginTop: 2 },
  body: { paddingTop: 2 },
})
