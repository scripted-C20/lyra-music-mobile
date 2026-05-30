import { useRef, useState, useCallback, useMemo, forwardRef, useImperativeHandle, type Ref } from 'react'
import { StyleSheet, View, Animated } from 'react-native'
// import PropTypes from 'prop-types'
// import { AppColors } from '@/theme'
import { useTheme } from '@/store/theme/hook'
import { useDS } from '@/theme/useDS'
import List, { type ItemT, type ListProps, type ListType } from './List'
// import InsetShadow from 'react-native-inset-shadow'

export interface SearchTipListProps<T> extends ListProps<T> {
  onPressBg?: () => void
}
export interface SearchTipListType<T> {
  setList: (list: T[]) => void
  clearList: () => void
  setHeight: (height: number) => void
}

const noop = () => {}

const Component = <T extends ItemT<T>>({ onPressBg = noop, ...props }: SearchTipListProps<T>, ref: Ref<SearchTipListType<T>>) => {
  const theme = useTheme()
  const ds = useDS()
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(0)).current
  const [visible, setVisible] = useState(false)
  const [animatePlayed, setAnimatPlayed] = useState(true)
  const [listData, setListData] = useState<T[]>([])
  const listRef = useRef<ListType<T>>(null)
  const prevListRef = useRef<T[]>([])
  const heightRef = useRef(0)

  useImperativeHandle(ref, () => ({
    setList(list) {
      const prevLength = prevListRef.current.length
      prevListRef.current = list
      setListData(list)
      if (prevLength) {
        if (!list.length) handleHide()
      } else if (list.length) handleShow()
    },
    clearList() {
      prevListRef.current = []
      setListData([])
    },
    setHeight(height) {
      heightRef.current = height
    },
  }))


  const handleShow = useCallback(() => {
    // console.log('handleShow', height, visible)
    setVisible(true)
    setAnimatPlayed(false)
    requestAnimationFrame(() => {
      opacity.setValue(0)
      translateY.setValue(-8)

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 140,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setAnimatPlayed(true)
      })
    })
  }, [opacity, translateY])

  const handleHide = useCallback(() => {
    setAnimatPlayed(false)
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 110,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -6,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start((finished) => {
      // console.log(finished)
      if (!finished) return
      setVisible(false)
      setAnimatPlayed(true)
    })
  }, [opacity, translateY])


  const component = useMemo(() => (
    <Animated.View
      style={{
        ...styles.anima,
        opacity,
        transform: [
          { translateY },
        ],
      }}>
      <View style={{
        ...styles.container,
        maxHeight: Math.max(154, Math.min(heightRef.current * 0.56, 330)),
        backgroundColor: theme['c-content-background'],
        borderColor: ds.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.05)',
        shadowColor: ds.shadowColor,
      }}>
        <List ref={listRef} list={listData} {...props} />
      </View>
      <View style={styles.blank} onTouchStart={onPressBg}></View>
    </Animated.View>
  ), [ds.isDark, ds.shadowColor, listData, onPressBg, opacity, props, theme, translateY])

  return !visible && animatePlayed ? null : component
}

export default forwardRef(Component) as
  <T,>(p: SearchTipListProps<T> & { ref?: Ref<SearchTipListType<T>> }) => JSX.Element | null

const styles = StyleSheet.create({
  anima: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    width: '100%',
    zIndex: 10,
  },
  container: {
    marginHorizontal: 14,
    marginTop: 8,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 5,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
  },
  blank: {
    flex: 1,
    flexGrow: 1,
    // backgroundColor: 'transparent',
    // backgroundColor: 'rgba(0,0,0,0.2)',
  },
})
