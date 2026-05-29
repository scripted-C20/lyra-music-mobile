import { memo, useEffect, useRef } from 'react'
import { View, TouchableOpacity, ScrollView, StyleSheet, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useActiveListId, useListFetching, useMyList } from '@/store/list/hook'
import { LIST_SCROLL_POSITION_KEY } from '@/config/constant'
import { getListPosition, saveListPosition } from '@/utils/data'
import { setActiveList } from '@/core/list'
import Text from '@/components/common/Text'
import { type Position } from './ListMenu'
import Loading from '@/components/common/Loading'
import { useDS } from '@/theme/useDS'

const ListItem = memo(({ item, index, activeId, onPress, onShowMenu, isLast }: {
  onPress: (item: LX.List.MyListInfo) => void
  index: number
  activeId: string
  item: LX.List.MyListInfo
  isLast: boolean
  onShowMenu: (item: LX.List.MyListInfo, index: number, position: { x: number, y: number, w: number, h: number }) => void
}) => {
  const ds = useDS()
  const moreButtonRef = useRef<TouchableOpacity>(null)
  const fetching = useListFetching(item.id)
  const active = activeId === item.id

  const handleShowMenu = () => {
    if (moreButtonRef.current?.measure) {
      moreButtonRef.current.measure((fx, fy, width, height, px, py) => {
        onShowMenu(item, index, { x: Math.ceil(px), y: Math.ceil(py), w: Math.ceil(width), h: Math.ceil(height) })
      })
    }
  }

  return (
    <TouchableOpacity
      style={[
        styles.row,
        {
          backgroundColor: active ? ds.accent : 'transparent',
        },
      ]}
      activeOpacity={0.6}
      onPress={() => {
        onPress(item)
      }}
      onLongPress={handleShowMenu}
    >
      <View style={styles.rankSlot}>
        <Text size={12} color={active ? ds.textOnAccent : ds.textDim} style={styles.rankText}>
          {String(index + 1).padStart(2, '0')}
        </Text>
      </View>
      <View style={styles.nameSlot}>
        {fetching ? <Loading color={active ? '#FFFFFF' : ds.text} style={styles.loading} /> : null}
        <Text size={14} color={active ? ds.textOnAccent : ds.text} style={active ? styles.nameActive : styles.name} numberOfLines={1}>
          {item.name}
        </Text>
      </View>
      {active ? (
        <Icon name="chevron-right" size={14} color={ds.textOnAccent} />
      ) : (
        <TouchableOpacity ref={moreButtonRef} onPress={handleShowMenu} style={styles.moreBtn}>
          <Icon name="dots-vertical" size={14} color={ds.textDim} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  )
}, (prevProps, nextProps) => {
  return !!(prevProps.item === nextProps.item &&
    prevProps.index === nextProps.index &&
    prevProps.item.name === nextProps.item.name &&
    prevProps.activeId !== nextProps.item.id &&
    nextProps.activeId !== nextProps.item.id
  )
})

export default ({ onShowMenu }: {
  onShowMenu: (info: { listInfo: LX.List.MyListInfo, index: number }, position: Position) => void
}) => {
  const scrollViewRef = useRef<ScrollView>(null)
  const allList = useMyList()
  const activeListId = useActiveListId()
  const ds = useDS()

  const handleToggleList = (item: LX.List.MyListInfo) => {
    global.app_event.changeLoveListVisible(false)
    requestAnimationFrame(() => { setActiveList(item.id) })
  }

  const handleScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    void saveListPosition(LIST_SCROLL_POSITION_KEY, nativeEvent.contentOffset.y)
  }

  const showMenu = (listInfo: LX.List.MyListInfo, index: number, position: Position) => {
    onShowMenu({ listInfo, index }, position)
  }

  useEffect(() => {
    void getListPosition(LIST_SCROLL_POSITION_KEY).then((offset) => {
      scrollViewRef.current?.scrollTo({ y: offset, animated: false })
    })
  }, [])

  return (
    <View style={[styles.container, { backgroundColor: ds.bg }]}>
      {/* 标题 */}
      <View style={styles.header}>
        <Text size={11} color={ds.textDim} style={styles.headerLabel}>列表</Text>
        <Text size={13} color={ds.text} style={styles.headerCount}>共 {allList.length} 个</Text>
      </View>

      {/* 列表卡片 — ScrollView 高度自适应 */}
      <View style={[styles.listCard, { backgroundColor: ds.bgCard, borderColor: ds.separator }]}>
        <ScrollView
          ref={scrollViewRef}
          onScroll={handleScroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
        >
          {allList.map((item, index) => (
            <ListItem
              key={item.id}
              item={item}
              index={index}
              activeId={activeListId}
              onPress={handleToggleList}
              onShowMenu={showMenu}
              isLast={index === allList.length - 1}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flexShrink: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 8,
  },
  headerLabel: { fontWeight: '500', letterSpacing: 0.5 },
  headerCount: { fontWeight: '500' },
  listCard: {
    borderRadius: 10,
    marginHorizontal: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    minHeight: 38,
    gap: 10,
    marginHorizontal: 5,
    marginVertical: 1,
    borderRadius: 8,
  },
  rankSlot: { width: 24, alignItems: 'center' },
  rankText: { fontWeight: '600', fontVariant: ['tabular-nums'] },
  nameSlot: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontWeight: '500', letterSpacing: -0.1 },
  nameActive: { fontWeight: '700', letterSpacing: -0.1 },
  loading: { marginRight: 4 },
  moreBtn: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
})
