import { forwardRef, useImperativeHandle, useRef, useState, useMemo } from 'react'
import { View, TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import Menu, { type MenuType } from '@/components/common/Menu'
import { useDS } from '@/theme/useDS'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import leaderboardState, { type Source } from '@/store/leaderboard/state'
import {
  HEADER_CONTROL_FONT_SIZE,
  HEADER_CONTROL_GAP,
  HEADER_CONTROL_HORIZONTAL_PADDING,
  HEADER_CONTROL_VERTICAL_PADDING,
} from '../../../common/headerControls'

export interface SourceSelectorProps {
  onSourceChange: (source: Source) => void
  style?: ViewStyle
}

export interface SourceSelectorType {
  setSource: (source: Source) => void
}

export default forwardRef<SourceSelectorType, SourceSelectorProps>(({ style, onSourceChange }, ref) => {
  const ds = useDS()
  const t = useI18n()
  const sourceNameType = useSettingValue('common.sourceNameType')
  const wrapperRef = useRef<View>(null)
  const menuRef = useRef<MenuType>(null)
  const [source, setSource] = useState<Source>('kw')

  useImperativeHandle(ref, () => ({
    setSource(s) { setSource(s) },
  }), [])

  const menus = useMemo(() => {
    return leaderboardState.sources.map(s => ({
      label: t(`source_${sourceNameType}_${s}`),
      action: s,
    }))
  }, [sourceNameType, t])

  const handleShow = () => {
    if (!wrapperRef.current) return
    setTimeout(() => {
      wrapperRef.current?.measureInWindow((x, y, width, height) => {
        if (Number.isNaN(x) || Number.isNaN(y)) return
        menuRef.current?.show(
          { x: Math.ceil(x), y: Math.ceil(y), w: Math.ceil(width), h: Math.ceil(height) },
          { width: 90, height: 32 },
        )
      })
    }, 0)
  }

  const handlePress = (menu: { action: Source, label: string }) => {
    setSource(menu.action)
    onSourceChange(menu.action)
  }

  const sourceLabel = t(`source_${sourceNameType}_${source}`) || source.toUpperCase()

  return (
    <View ref={wrapperRef} style={[styles.wrapper, style]} collapsable={false}>
      <TouchableOpacity style={styles.btn} activeOpacity={0.6} onPress={handleShow}>
        <Text size={HEADER_CONTROL_FONT_SIZE} color={ds.accent} style={styles.text} numberOfLines={1}>
          {sourceLabel}
        </Text>
        <Icon family="ionicons" name="chevron-down" size={10} color={ds.accent} style={styles.icon} />
      </TouchableOpacity>
      <Menu
        ref={menuRef}
        menus={menus}
        onPress={handlePress}
        activeId={source}
        fontSize={HEADER_CONTROL_FONT_SIZE}
        height={32}
        width={90}
        center
      />
    </View>
  )
})

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    height: '100%',
    minWidth: 0,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: HEADER_CONTROL_HORIZONTAL_PADDING,
    paddingVertical: HEADER_CONTROL_VERTICAL_PADDING,
    gap: HEADER_CONTROL_GAP,
  },
  text: {
    fontWeight: '500',
    flexShrink: 1,
    minWidth: 0,
    includeFontPadding: false,
    textAlign: 'center',
  },
  icon: { flexShrink: 0 },
})
