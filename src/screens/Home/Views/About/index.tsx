import { TouchableOpacity, View, StyleSheet } from 'react-native'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useI18n } from '@/lang'
import { openUrl } from '@/utils/tools'
import { showPactModal } from '@/core/common'
import { useDS } from '@/theme/useDS'

const homePage = 'https://github.com/scripted-C20/-lyra-music-mobile#readme'
const faqPage = 'https://lyswhut.github.io/lx-music-doc/mobile/faq'

export default () => {
  const ds = useDS()
  const t = useI18n()

  return (
    <View style={styles.container}>
      {/* 应用信息 */}
      <View style={[styles.card, { backgroundColor: ds.bgCard }]}>
        <View style={styles.appRow}>
          <View style={[styles.iconBox, { backgroundColor: ds.accentSoft }]}>
            <Icon name="logo" size={18} color={ds.accent} />
          </View>
          <View style={styles.appInfo}>
            <Text size={14} color={ds.text} style={styles.appName}>LX Music Mobile</Text>
            <Text size={11} color={ds.textDim}>v{process.versions.app}</Text>
          </View>
        </View>
        <Text size={12} color={ds.textMuted} style={styles.desc}>
          {t('about_tab_desc')}
        </Text>
      </View>

      {/* 链接 */}
      <View style={[styles.card, { backgroundColor: ds.bgCard }]}>
        <TouchableOpacity
          activeOpacity={0.6}
          onPress={() => { void openUrl(homePage) }}
          style={styles.linkRow}
        >
          <Text size={13} color={ds.text} style={styles.linkLabel}>{t('about_tab_source')}</Text>
          <Text size={11} color={ds.textDim}>GitHub</Text>
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: ds.separator }]} />

        <TouchableOpacity
          activeOpacity={0.6}
          onPress={() => { void openUrl(faqPage) }}
          style={styles.linkRow}
        >
          <Text size={13} color={ds.text} style={styles.linkLabel}>常见问题</Text>
          <Text size={11} color={ds.textDim}>FAQ</Text>
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: ds.separator }]} />

        <TouchableOpacity
          activeOpacity={0.6}
          onPress={() => { showPactModal() }}
          style={styles.linkRow}
        >
          <Text size={13} color={ds.text} style={styles.linkLabel}>{t('about_tab_pact')}</Text>
          <Text size={11} color={ds.textDim}>Apache-2.0</Text>
        </TouchableOpacity>
      </View>

      {/* 免责声明 */}
      <View style={[styles.card, { backgroundColor: ds.bgCard }]}>
        <Text size={12} color={ds.textMuted} style={styles.warning}>
          {t('about_tab_warning_desc')}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  card: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontWeight: '600',
    marginBottom: 2,
  },
  desc: {
    lineHeight: 18,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  linkLabel: {
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  warning: {
    lineHeight: 18,
  },
})
