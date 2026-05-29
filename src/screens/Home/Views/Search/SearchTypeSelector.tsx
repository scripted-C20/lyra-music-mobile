import { useEffect, useMemo, useState } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'

import { type SearchType } from '@/store/search/state'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import { useDS } from '@/theme/useDS'
import { getSearchSetting } from '@/utils/data'
import {
  HEADER_CONTROL_FONT_SIZE,
  HEADER_CONTROL_HEIGHT,
  HEADER_CONTROL_HORIZONTAL_PADDING,
} from '../common/headerControls'

const SEARCH_TYPE_LIST = [
  'music',
  'songlist',
] as const

export default () => {
  const t = useI18n()
  const ds = useDS()
  const [type, setType] = useState<SearchType>('music')

  useEffect(() => {
    void getSearchSetting().then(info => {
      setType(info.type)
    })
  }, [])

  const list = useMemo(() => {
    return SEARCH_TYPE_LIST.map(type => ({ label: t(`search_type_${type}`), id: type }))
  }, [t])

  const handleTypeChange = (type: SearchType) => {
    setType(type)
    global.app_event.searchTypeChanged(type)
  }

  return (
    <View style={styles.container}>
      {list.map(item => {
        const active = type === item.id
        return (
          <TouchableOpacity
            style={[
              styles.btn,
              active && { backgroundColor: ds.accent },
            ]}
            onPress={() => { handleTypeChange(item.id) }}
            key={item.id}
          >
            <Text
              size={HEADER_CONTROL_FONT_SIZE}
              color={active ? ds.textOnAccent : ds.text}
              style={styles.text}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: HEADER_CONTROL_HEIGHT,
  },
  btn: {
    height: HEADER_CONTROL_HEIGHT,
    paddingHorizontal: HEADER_CONTROL_HORIZONTAL_PADDING,
    paddingVertical: 0,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '400',
  },
})
