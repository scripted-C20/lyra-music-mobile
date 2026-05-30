import { Navigation } from 'react-native-navigation'
import * as screenNames from './screenNames'
import * as navigations from './navigation'

import registerScreens from './registerScreens'
import { removeComponentId, setNavActiveId } from '@/core/common'
import { onAppLaunched } from './regLaunchedEvent'
import { COMPONENT_IDS } from '@/config/constant'
import commonState from '@/store/common/state'

let unRegisterEvent: ReturnType<ReturnType<typeof Navigation.events>['registerScreenPoppedListener']>

const init = (callback: () => void | Promise<void>) => {
  // Register all screens on launch
  registerScreens()

  if (unRegisterEvent) unRegisterEvent.remove()

  Navigation.setDefaultOptions({
    // animations: {
    //   setRoot: {
    //     waitForRender: true,
    //   },
    // },
  })
  unRegisterEvent = Navigation.events().registerScreenPoppedListener(({ componentId }) => {
    const isSearchSonglistDetail = global.lx.isSonglistDetailFromSearch && componentId == commonState.componentIds[COMPONENT_IDS.songlistDetail]
    removeComponentId(componentId)
    if (isSearchSonglistDetail) {
      global.lx.isSonglistDetailFromSearch = false
      setNavActiveId('nav_search')
    }
  })
  onAppLaunched(() => {
    console.log('Register app launched listener')
    void callback()
  })
}

export * from './utils'
export * from './event'
export * from './hooks'

export {
  init,
  screenNames,
  navigations,
}
