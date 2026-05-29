import { useEffect, useRef } from 'react'
import { View, StyleSheet } from 'react-native'
import DrawerNav from './DrawerNav'
import TopNav from './TopNav'
import Main from './Main'
import { useSettingValue } from '@/store/setting/hook'
import { COMPONENT_IDS } from '@/config/constant'
import DrawerLayoutFixed, { type DrawerLayoutFixedType } from '@/components/common/DrawerLayoutFixed'
import { scaleSizeW } from '@/utils/pixelRatio'
import { useDS } from '@/theme/useDS'

const MAX_WIDTH = scaleSizeW(320)

const Content = () => {
  const drawer = useRef<DrawerLayoutFixedType>(null)
  const drawerLayoutPosition = useSettingValue('common.drawerLayoutPosition')
  const ds = useDS()

  useEffect(() => {
    const changeVisible = (visible: boolean) => {
      if (visible) drawer.current?.openDrawer()
      else drawer.current?.closeDrawer()
    }
    global.app_event.on('changeMenuVisible', changeVisible)
    return () => { global.app_event.off('changeMenuVisible', changeVisible) }
  }, [])

  const navigationView = () => <DrawerNav />

  return (
    <DrawerLayoutFixed
      ref={drawer}
      widthPercentage={0.78}
      widthPercentageMax={MAX_WIDTH}
      visibleNavNames={[COMPONENT_IDS.home]}
      drawerPosition={drawerLayoutPosition}
      renderNavigationView={navigationView}
    >
      <View style={[styles.container, { backgroundColor: ds.isDark ? ds.bg : '#F2F2F7' }]}>
        <TopNav />
        <Main />
      </View>
    </DrawerLayoutFixed>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
})

export default Content
