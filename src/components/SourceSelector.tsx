import { forwardRef, type Ref, useImperativeHandle, useMemo, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import DorpDownMenu, { type DorpDownMenuProps as _DorpDownMenuProps } from '@/components/common/DorpDownMenu'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { Icon } from '@/components/common/Icon'
import { useSettingValue } from '@/store/setting/hook'
import { useDS } from '@/theme/useDS'

type Sources = Readonly<Array<LX.OnlineSource | 'all'>>

export interface SourceSelectorProps<S extends Sources> {
  fontSize?: number
  center?: _DorpDownMenuProps<any>['center']
  onSourceChange: (source: S[number]) => void
}

export interface SourceSelectorType<S extends Sources> {
  setSourceList: (list: S, activeSource: S[number]) => void
}

export const useSourceListI18n = (list: Sources) => {
  const sourceNameType = useSettingValue('common.sourceNameType')
  const t = useI18n()
  return useMemo(() => {
    return list.map(s => ({ label: t(`source_${sourceNameType}_${s}`), action: s }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, sourceNameType, t])
}

const Component = <S extends Sources>({ fontSize = 15, center, onSourceChange }: SourceSelectorProps<S>, ref: Ref<SourceSelectorType<S>>) => {
  const sourceNameType = useSettingValue('common.sourceNameType')
  const [list, setList] = useState([] as unknown as S)
  const [source, setSource] = useState<S[number]>('kw')
  const t = useI18n()
  const ds = useDS()

  useImperativeHandle(ref, () => ({
    setSourceList(list, activeSource) {
      setList(list)
      setSource(activeSource)
    },
  }), [])

  const sourceList_t = useSourceListI18n(list)

  type DorpDownMenuProps = _DorpDownMenuProps<typeof sourceList_t>

  const handleChangeSource: DorpDownMenuProps['onPress'] = ({ action }) => {
    onSourceChange(action)
    setSource(action)
  }

  return (
    <DorpDownMenu
      menus={sourceList_t}
      center={center}
      onPress={handleChangeSource}
      fontSize={fontSize}
      activeId={source}
      btnStyle={styles.dropdownBtn}
    >
      <View style={styles.sourceMenu} pointerEvents="none">
        <Text
          style={[styles.sourceText, { color: ds.accent }]}
          numberOfLines={1}
          size={fontSize}
        >
          {t(`source_${sourceNameType}_${source}`)}
        </Text>
        <Icon name="chevron-right" size={10} color={ds.textDim} style={styles.icon} />
      </View>
    </DorpDownMenu>
  )
}

export default forwardRef(Component) as <S extends Sources>(p: SourceSelectorProps<S> & { ref?: Ref<SourceSelectorType<S>> }) => JSX.Element | null

const styles = StyleSheet.create({
  dropdownBtn: {
    flex: 1,
    height: '100%',
  },
  sourceMenu: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    gap: 4,
  },
  sourceText: {
    fontWeight: '500',
    letterSpacing: -0.1,
    flexShrink: 1,
  },
  icon: {
    transform: [{ rotate: '90deg' }],
  },
})
