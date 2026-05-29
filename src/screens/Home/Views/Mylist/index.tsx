import { useEffect, useRef } from 'react'
import MusicList from './MusicList'
import MyList from './MyList'
import { useTheme } from '@/store/theme/hook'
import DrawerLayoutFixed, { type DrawerLayoutFixedType } from '@/components/common/DrawerLayoutFixed'
import { COMPONENT_IDS } from '@/config/constant'
import { scaleSizeW } from '@/utils/pixelRatio'
import type { InitState as CommonState } from '@/store/common/state'
import { useSettingValue } from '@/store/setting/hook'

// 和排行榜完全一致
const MAX_WIDTH = scaleSizeW(300)

export default () => {
  const drawer = useRef<DrawerLayoutFixedType>(null)
  const theme = useTheme()
  const drawerLayoutPosition = useSettingValue('common.drawerLayoutPosition')

  useEffect(() => {
    const handleFixDrawer = (id: CommonState['navActiveId']) => {
      if (id === 'nav_love') drawer.current?.fixWidth()
    }
    const changeVisible = (visible: boolean) => {
      if (visible) {
        requestAnimationFrame(() => { drawer.current?.openDrawer() })
      } else {
        drawer.current?.closeDrawer()
      }
    }

    global.state_event.on('navActiveIdUpdated', handleFixDrawer)
    global.app_event.on('changeLoveListVisible', changeVisible)

    return () => {
      global.state_event.off('navActiveIdUpdated', handleFixDrawer)
      global.app_event.off('changeLoveListVisible', changeVisible)
    }
  }, [])

  const navigationView = () => <MyList />

  return (
    <DrawerLayoutFixed
      ref={drawer}
      visibleNavNames={[COMPONENT_IDS.home]}
      widthPercentage={0.7}
      widthPercentageMax={MAX_WIDTH}
      drawerPosition={drawerLayoutPosition}
      renderNavigationView={navigationView}
      drawerBackgroundColor={theme['c-main-background']}
      style={{ elevation: 2 }}
    >
      <MusicList />
    </DrawerLayoutFixed>
  )
}
