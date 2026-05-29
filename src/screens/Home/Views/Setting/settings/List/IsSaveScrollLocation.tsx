import { memo } from 'react'
import { View } from 'react-native'

import CheckBoxItem from '../../components/CheckBoxItem'
import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { createStyle } from '@/utils/tools'

export default memo(() => {
  const t = useI18n()
  const isSaveScrollLocation = useSettingValue('list.isSaveScrollLocation')

  return (
    <View style={styles.content}>
      <CheckBoxItem
        check={isSaveScrollLocation}
        onChange={value => { updateSetting({ 'list.isSaveScrollLocation': value }) }}
        label={t('setting_list_save_scroll_location')}
      />
    </View>
  )
})

const styles = createStyle({
  content: {
    marginTop: 5,
  },
})
