import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { View } from 'react-native'
import { type Source, type InitState } from '@/store/hotSearch/state'
import Button from '@/components/common/Button'
import { getList } from '@/core/hotSearch'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'


interface ListProps {
  onSearch: (keyword: string) => void
}
export interface HotSearchType {
  show: (source: Source) => void
}


export type List = NonNullable<InitState['sourceList'][keyof InitState['sourceList']]>

const ListItem = ({ keyword, onSearch }: {
  keyword: string
  onSearch: (keyword: string) => void
}) => {
  const theme = useTheme()
  return (
    <Button style={{ ...styles.button, backgroundColor: theme['c-button-background'] }} onPress={() => { onSearch(keyword) }}>
      <Text color={theme['c-button-font']} size={13}>{keyword}</Text>
    </Button>
  )
}

export default forwardRef<HotSearchType, ListProps>((props, ref) => {
  const [list, setList] = useState<List>([])
  const t = useI18n()
  const theme = useTheme()

  const isUnmountedRef = useRef(false)
  useEffect(() => {
    isUnmountedRef.current = false
    return () => {
      isUnmountedRef.current = true
    }
  }, [])

  useImperativeHandle(ref, () => ({
    show(source) {
      void getList(source).then((list) => {
        if (isUnmountedRef.current) return
        setList(list)
      })
    },
  }), [])

  return (
    list.length
      ? (
          <View style={{ ...styles.section, backgroundColor: theme['c-main-background'], borderColor: theme['c-border-background'] }}>
            <View style={styles.header}>
              <View style={styles.copy}>
                <Text style={styles.title} size={14}>{t('search_hot_search')}</Text>
                <Text size={10.5} color={theme['c-font-label']}>{t('search_section_hot_desc')}</Text>
              </View>
            </View>
            <View style={styles.list}>
              {
                list.map(keyword => <ListItem keyword={keyword} key={keyword} onSearch={props.onSearch} />)
              }
            </View>
          </View>
        )
      : null
  )
})


const styles = createStyle({
  section: {
    borderRadius: 16,
    borderWidth: 1,
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 12,
    paddingBottom: 14,
    marginBottom: 10,
  },
  title: {
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  copy: {
    flex: 1,
  },
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  button: {
    textAlign: 'center',
    paddingLeft: 11,
    paddingRight: 11,
    paddingTop: 7,
    paddingBottom: 7,
    borderRadius: 999,
    marginRight: 6,
    marginTop: 6,
  },
})
