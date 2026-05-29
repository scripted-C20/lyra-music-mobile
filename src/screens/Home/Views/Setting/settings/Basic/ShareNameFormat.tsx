import { memo, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'

import CheckBox from '@/components/common/CheckBox'
import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import SubTitle from '../../components/SubTitle'

type ShareNameFormat = LX.AppSetting['download.fileName']

const FORMATS = [
  { id: '歌名 - 歌手', labelKey: 'setting_basic_share_name_format_name_singer' },
  { id: '歌手 - 歌名', labelKey: 'setting_basic_share_name_format_singer_name' },
  { id: '歌名', labelKey: 'setting_basic_share_name_format_name' },
] as const

const Item = ({ id, name }: {
  id: ShareNameFormat
  name: string
}) => {
  const fileName = useSettingValue('download.fileName')
  const active = useMemo(() => fileName == id, [fileName, id])

  return (
    <CheckBox
      marginRight={8}
      check={active}
      label={name}
      onChange={() => { updateSetting({ 'download.fileName': id }) }}
      need
    />
  )
}

export default memo(() => {
  const t = useI18n()

  return (
    <SubTitle title={t('setting_basic_share_name_format')}>
      <View style={styles.list}>
        {FORMATS.map(format => (
          <Item key={format.id} id={format.id} name={t(format.labelKey)} />
        ))}
      </View>
    </SubTitle>
  )
})

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
})
