import { useEffect, useMemo, useState } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'

import { type SearchType } from '@/store/search/state'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import { useDS } from '@/theme/useDS'
import { getSearchSetting } from '@/utils/data'
import {
  useHeaderControlMetrics,
} from '../common/headerControls'

const SEARCH_TYPE_LIST = [
  'music',
  'songlist',
] as const

export default () => {
  const t = useI18n()
  const ds = useDS()
  const controlMetrics = useHeaderControlMetrics()
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
    <View style={[styles.container, { height: controlMetrics.height }]}>
      {list.map(item => {
        const active = type === item.id
        return (
          <TouchableOpacity
            style={[
              styles.btn,
              {
                height: controlMetrics.height,
                paddingHorizontal: controlMetrics.horizontalPadding,
                paddingVertical: controlMetrics.verticalPadding,
              },
              active && { backgroundColor: ds.accent },
            ]}
            onPress={() => { handleTypeChange(item.id) }}
            key={item.id}
          >
            <Text
              size={controlMetrics.fontSize}
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
  },
  btn: {
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '400',
  },
})
