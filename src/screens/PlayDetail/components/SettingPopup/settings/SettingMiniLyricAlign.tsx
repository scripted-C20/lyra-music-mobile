import { useMemo } from 'react'

import { StyleSheet, TouchableOpacity, View } from 'react-native'
import Text from '@/components/common/Text'
import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { useDS } from '@/theme/useDS'

type AlignType = LX.AppSetting['playDetail.vertical.style.miniLyricAlign']

const ALIGN_LIST = [
  'left',
  'center',
  'right',
] as const

const Item = ({ id, name, change }: {
  id: AlignType
  name: string
  change: (id: AlignType) => void
}) => {
  const ds = useDS()
  const align = useSettingValue('playDetail.vertical.style.miniLyricAlign')
  const isActive = useMemo(() => align == id, [align, id])

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => { change(id) }}
      style={[
        localStyles.item,
        {
          backgroundColor: isActive ? ds.accent : ds.bgCard,
          borderColor: isActive ? ds.accent : ds.separator,
        },
      ]}
    >
      <Text
        size={12}
        color={isActive ? ds.textOnAccent : ds.text}
        style={localStyles.itemText}
      >
        {name}
      </Text>
    </TouchableOpacity>
  )
}

export default () => {
  const t = useI18n()
  const ds = useDS()
  const list = useMemo(() => {
    return ALIGN_LIST.map(id => ({ id, name: t(`play_detail_setting_lrc_align_${id}`) }))
  }, [t])

  const setAlign = (id: AlignType) => {
    updateSetting({ 'playDetail.vertical.style.miniLyricAlign': id })
  }

  return (
    <View style={localStyles.container}>
      <View style={localStyles.header}>
        <Text size={13} color={ds.text} style={localStyles.title}>{t('play_detail_setting_mini_lrc_align')}</Text>
        <Text size={10.5} color={ds.textMuted} style={localStyles.desc}>{t('play_detail_setting_mini_lrc_align_desc')}</Text>
      </View>
      <View style={[localStyles.segment, { backgroundColor: ds.fill1, borderColor: ds.separator }]}>
        {
          list.map(({ id, name }) => <Item name={name} id={id} key={id} change={setAlign} />)
        }
      </View>
    </View>
  )
}

const localStyles = StyleSheet.create({
  container: {
    paddingTop: 8,
    paddingLeft: 15,
    paddingRight: 15,
    paddingBottom: 16,
  },
  header: {
    marginBottom: 9,
  },
  title: {
    fontWeight: '700',
  },
  desc: {
    marginTop: 4,
    lineHeight: 15,
  },
  segment: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 13,
    padding: 4,
    gap: 5,
  },
  item: {
    flex: 1,
    minHeight: 34,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  itemText: {
    fontWeight: '700',
  },
})
