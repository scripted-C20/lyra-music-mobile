import { forwardRef, useImperativeHandle, useState } from 'react'
import { View, ScrollView, StyleSheet } from 'react-native'
import { type Position } from './ListMenu'
import ListItem, { type ListItemProps } from './ListItem'
import { type BoardItem } from '@/store/leaderboard/state'
import Text from '@/components/common/Text'
import { useDS } from '@/theme/useDS'
import { Icon } from '@/components/common/Icon'

export interface ListProps {
  onBoundChange: (listId: string) => void
  onShowMenu: (info: { listId: string, name: string, index: number }, position: Position) => void
}
export interface ListType {
  setList: (list: BoardItem[], activeId: string) => void
  hideMenu: () => void
}

export default forwardRef<ListType, ListProps>(({ onBoundChange, onShowMenu }, ref) => {
  const [activeId, setActiveId] = useState('')
  const [longPressIndex, setLongPressIndex] = useState(-1)
  const [list, setList] = useState<BoardItem[]>([])
  const ds = useDS()

  useImperativeHandle(ref, () => ({
    setList(list, activeId) {
      setList(list)
      setActiveId(activeId)
    },
    hideMenu() {
      setLongPressIndex(-1)
    },
  }), [])

  const handleBoundChange = (item: BoardItem) => {
    setActiveId(item.id)
    onBoundChange(item.id)
  }

  const handleShowMenu: ListItemProps['onShowMenu'] = (listId, name, index, position: Position) => {
    setLongPressIndex(index)
    onShowMenu({ listId, name, index }, position)
  }

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: ds.bg }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps={'always'}
      showsVerticalScrollIndicator={false}
    >
      {/* 紧凑标题 */}
      <View style={styles.header}>
        <Text size={11} color={ds.textDim} style={styles.headerLabel}>榜单</Text>
        <Text size={13} color={ds.text} style={styles.headerCount}>共 {list.length} 个</Text>
      </View>

      {/* 列表卡片包装 */}
      <View style={[styles.listCard, { backgroundColor: ds.bgCard, borderColor: ds.separator }]}>
        {list.length ? (
          list.map((item, index) => (
            <ListItem
              key={item.id}
              item={item}
              index={index}
              longPressIndex={longPressIndex}
              activeId={activeId}
              onShowMenu={handleShowMenu}
              onBoundChange={handleBoundChange}
              isLast={index === list.length - 1}
            />
          ))
        ) : (
          <View style={styles.empty}>
            <Icon name="menu" size={18} color={ds.textDim} />
            <Text size={12} color={ds.textMuted} style={styles.emptyText}>榜单加载中</Text>
          </View>
        )}
      </View>
    </ScrollView>
  )
})

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  content: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 10,
    gap: 8,
  },
  headerLabel: {
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  headerCount: {
    fontWeight: '500',
  },
  listCard: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  empty: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    fontWeight: '500',
  },
})
