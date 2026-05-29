import { useCallback, useRef } from 'react'
import { View, StyleSheet } from 'react-native'
import Text from '@/components/common/Text'
import { useDS } from '@/theme/useDS'
import Button, { type BtnType } from '@/components/common/Button'
import { type BoardItem } from '@/store/leaderboard/state'
import { Icon } from '@/components/common/Icon'

export interface ListItemProps {
  item: BoardItem
  index: number
  longPressIndex: number
  activeId: string
  onShowMenu: (id: string, name: string, index: number, position: { x: number, y: number, w: number, h: number }) => void
  onBoundChange: (item: BoardItem) => void
  isLast?: boolean
}

export default ({ item, activeId, index, longPressIndex, onBoundChange, onShowMenu, isLast }: ListItemProps) => {
  const ds = useDS()
  const buttonRef = useRef<BtnType>(null)

  const setPosition = useCallback(() => {
    if (buttonRef.current?.measure) {
      buttonRef.current.measure((fx, fy, width, height, px, py) => {
        onShowMenu(item.id, item.name, index, {
          x: Math.ceil(px), y: Math.ceil(py), w: Math.ceil(width), h: Math.ceil(height),
        })
      })
    }
  }, [index, item, onShowMenu])

  const active = activeId === item.id

  return (
    <Button
      ref={buttonRef}
      style={[
        styles.row,
        {
          backgroundColor: active
            ? ds.accent
            : index === longPressIndex
              ? ds.fill4
              : 'transparent',
        },
      ]}
      key={item.id}
      onLongPress={setPosition}
      onPress={() => { onBoundChange(item) }}
    >
      {/* 左侧序号 */}
      <View style={styles.rankSlot}>
        <Text
          size={12}
          color={active ? ds.textOnAccent : ds.textDim}
          style={styles.rankText}
        >
          {String(index + 1).padStart(2, '0')}
        </Text>
      </View>

      {/* 榜单名 */}
      <View style={styles.nameSlot}>
        <Text
          size={14}
          color={active ? ds.textOnAccent : ds.text}
          style={active ? styles.nameActive : styles.name}
          numberOfLines={1}
          textBreakStrategy="simple"
        >
          {item.name}
        </Text>
      </View>

      {/* 当前指示 */}
      {active ? (
        <Icon name="chevron-right" size={14} color={ds.textOnAccent} />
      ) : null}
    </Button>
  )
}

const styles = StyleSheet.create({
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
  rankSlot: {
    width: 24,
    alignItems: 'center',
  },
  rankText: {
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  nameSlot: {
    flex: 1,
  },
  name: {
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  nameActive: {
    fontWeight: '700',
    letterSpacing: -0.1,
  },
})
