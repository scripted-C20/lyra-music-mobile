import { useState, useRef, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react'
import { Animated, View, TouchableOpacity } from 'react-native'

import Text from '@/components/common/Text'
import Button from '@/components/common/Button'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'

export type SelectMode = 'single' | 'range'

export interface MultipleModeBarProps {
  onSwitchMode: (mode: SelectMode) => void
  onSelectAll: (isAll: boolean) => void
  onExitSelectMode: () => void
}
export interface MultipleModeBarType {
  show: () => void
  setVisibleBar: (visible: boolean) => void
  setIsSelectAll: (isAll: boolean) => void
  setSwitchMode: (mode: SelectMode) => void
  exitSelectMode: () => void
}

export default forwardRef<MultipleModeBarType, MultipleModeBarProps>(({ onSelectAll, onSwitchMode, onExitSelectMode }, ref) => {
  // const isGetDetailFailedRef = useRef(false)
  const [visible, setVisible] = useState(false)
  const [animatePlayed, setAnimatPlayed] = useState(true)
  const animFade = useRef(new Animated.Value(0)).current
  const animTranslateY = useRef(new Animated.Value(0)).current
  const [selectMode, setSelectMode] = useState<SelectMode>('single')
  const [isSelectAll, setIsSelectAll] = useState(false)
  const [visibleBar, setVisibleBar] = useState(true)
  const theme = useTheme()

  useImperativeHandle(ref, () => ({
    show() {
      handleShow()
    },
    setVisibleBar(visible) {
      setVisibleBar(visible)
    },
    setIsSelectAll(isAll) {
      setIsSelectAll(isAll)
    },
    setSwitchMode(mode: SelectMode) {
      setSelectMode(mode)
    },
    exitSelectMode() {
      handleHide()
    },
  }))

  const handleShow = useCallback(() => {
    // console.log('show List')
    setVisible(true)
    setAnimatPlayed(false)
    requestAnimationFrame(() => {
      animTranslateY.setValue(-20)

      Animated.parallel([
        Animated.timing(animFade, {
          toValue: 0.92,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(animTranslateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setAnimatPlayed(true)
      })
    })
  }, [animFade, animTranslateY])

  const handleHide = useCallback(() => {
    setAnimatPlayed(false)
    Animated.parallel([
      Animated.timing(animFade, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(animTranslateY, {
        toValue: -20,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(finished => {
      if (!finished) return
      setVisible(false)
      setAnimatPlayed(true)
    })
  }, [animFade, animTranslateY])


  const animaStyle = useMemo(() => ({
    ...styles.container,
    opacity: visibleBar ? animFade : 0, // Bind opacity to animated value
    transform: [
      { translateY: animTranslateY },
    ],
  }), [animFade, animTranslateY, visibleBar])

  const handleSelectAll = useCallback(() => {
    const selectAll = !isSelectAll
    setIsSelectAll(selectAll)
    onSelectAll(selectAll)
  }, [isSelectAll, onSelectAll])

  const component = useMemo(() => {
    return (
      <Animated.View style={animaStyle}>
        <View style={{ ...styles.inner, backgroundColor: theme['c-main-background'], borderColor: theme['c-border-background'] }}>
          <View style={styles.switchBtn}>
            <Button onPress={() => { onSwitchMode('single') }} style={{ ...styles.btn, backgroundColor: selectMode == 'single' ? theme['c-primary-background-active'] : theme['c-primary-light-700-alpha-500'] }}>
              <Text color={selectMode == 'single' ? theme['c-primary-dark-200'] : theme['c-font']}>{global.i18n.t('list_select_single')}</Text>
            </Button>
            <Button onPress={() => { onSwitchMode('range') }} style={{ ...styles.btn, backgroundColor: selectMode == 'range' ? theme['c-primary-background-active'] : theme['c-primary-light-700-alpha-500'] }}>
              <Text color={selectMode == 'range' ? theme['c-primary-dark-200'] : theme['c-font']}>{global.i18n.t('list_select_range')}</Text>
            </Button>
          </View>
          <TouchableOpacity onPress={handleSelectAll} style={styles.textBtn}>
            <Text color={theme['c-primary-font']}>{global.i18n.t(isSelectAll ? 'list_select_unall' : 'list_select_all')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onExitSelectMode} style={styles.textBtn}>
            <Text color={theme['c-primary-font']}>{global.i18n.t('list_select_cancel')}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    )
  }, [animaStyle, selectMode, theme, handleSelectAll, isSelectAll, onExitSelectMode, onSwitchMode])

  return !visible && animatePlayed ? null : component
})

const styles = createStyle({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 8,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingLeft: 8,
    paddingRight: 8,
    borderRadius: 24,
    borderWidth: 1,
  },
  switchBtn: {
    flexDirection: 'row',
    flex: 1,
  },
  btn: {
    paddingLeft: 14,
    paddingRight: 14,
    minHeight: 38,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  textBtn: {
    paddingLeft: 10,
    paddingRight: 10,
    minHeight: 36,
    justifyContent: 'center',
  },
})
