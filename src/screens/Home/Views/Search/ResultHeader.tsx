import { memo } from 'react'
import { View, StyleSheet } from 'react-native'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { useDS } from '@/theme/useDS'

interface Props {
  keyword: string
  source: LX.OnlineSource | 'all'
  type: 'music' | 'songlist'
  total?: number
}

export default memo(({ keyword, source, type, total }: Props) => {
  const t = useI18n()
  const ds = useDS()
  const sourceNameType = useSettingValue('common.sourceNameType')
  const sourceLabel = t(`source_${sourceNameType}_${source}`)
  const typeLabel = t(`search_type_${type}`)
  const resultLabel = total != null ? `${total} 首` : ''

  return (
    <View style={styles.wrapper}>
      <Text size={11} color={ds.textDim} numberOfLines={1}>
        {sourceLabel} · {typeLabel}{resultLabel ? ` · ${resultLabel}` : ''}
      </Text>
    </View>
  )
})

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 4,
  },
})
