import { memo } from 'react'
import { View } from 'react-native'

import CheckBoxItem from '../../components/CheckBoxItem'
import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { createStyle } from '@/utils/tools'

export default memo(() => {
  const t = useI18n()
  const isShowSource = useSettingValue('list.isShowSource')

  return (
    <View style={styles.content}>
      <CheckBoxItem
        check={isShowSource}
        onChange={value => { updateSetting({ 'list.isShowSource': value }) }}
        label={t('setting_list_show_source')}
      />
    </View>
  )
})

const styles = createStyle({
  content: {
    marginTop: 5,
  },
})
