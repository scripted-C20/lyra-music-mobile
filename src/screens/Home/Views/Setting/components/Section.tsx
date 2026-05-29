import { View, StyleSheet } from 'react-native'
import { useDS } from '@/theme/useDS'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'

interface Props {
  title: string
  description?: string
  icon?: string
  children: React.ReactNode | React.ReactNode[]
}

export default ({ title, description, icon = 'setting', children }: Props) => {
  const ds = useDS()

  return (
    <View style={[styles.container, { backgroundColor: ds.bgCard }]}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: ds.accentSoft }]}>
          <Icon name={icon} size={14} color={ds.accent} />
        </View>
        <View style={styles.headerText}>
          <Text size={13} style={[styles.title, { color: ds.text }]}>{title}</Text>
          {description ? (
            <Text size={11} color={ds.textDim} style={styles.desc} numberOfLines={2}>
              {description}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={[styles.divider, { backgroundColor: ds.separator }]} />
      <View style={styles.body}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 10,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: { flex: 1 },
  title: { fontWeight: '600', letterSpacing: -0.2 },
  desc: { marginTop: 3, lineHeight: 16 },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 14 },
  body: { paddingTop: 4, paddingBottom: 4 },
})
