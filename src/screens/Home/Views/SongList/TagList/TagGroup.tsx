import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { type TagInfoItem } from '@/store/songlist/state'
import { useDS } from '@/theme/useDS'
import Text from '@/components/common/Text'

export interface TagGroupProps {
  name: string
  list: TagInfoItem[]
  onTagChange: (name: string, id: string) => void
  activeId: string
}

export default ({ name, list, onTagChange, activeId }: TagGroupProps) => {
  const ds = useDS()
  return (
    <View style={[styles.group, { backgroundColor: ds.bgCard }]}>
      {name ? (
        <Text style={[styles.groupTitle, { color: ds.textMuted }]} size={11}>
          {name}
        </Text>
      ) : null}
      <View style={styles.tagWrap}>
        {list.map(item => {
          const active = activeId === item.id
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.tag,
                active
                  ? { backgroundColor: ds.accent }
                  : { backgroundColor: ds.isDark ? ds.bgFloat : 'rgba(0,0,0,0.04)' },
              ]}
              activeOpacity={0.6}
              onPress={() => { if (!active) onTagChange(item.name, item.id) }}
            >
              <Text
                size={11}
                color={active ? ds.textOnAccent : ds.text}
                style={active ? styles.tagTextActive : styles.tagText}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  group: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
    marginBottom: 8,
  },
  groupTitle: {
    fontWeight: '500',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  tag: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagText: {
    fontWeight: '400',
  },
  tagTextActive: {
    fontWeight: '600',
  },
})
