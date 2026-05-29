import '@/utils/errorHandle'
import { init as initLog } from '@/utils/log'
import { bootLog, getBootLog } from '@/utils/bootLog'
import '@/config/globalData'
import { getFontSize } from '@/utils/data'
import { exitApp } from './utils/nativeModules/utils'
import { windowSizeTools } from './utils/windowSizeTools'
import { listenLaunchEvent } from './navigation/regLaunchedEvent'
import { init as initNavigation, navigations } from './navigation'
import { tipDialog } from './utils/tools'

console.log('starting app...')
listenLaunchEvent()

const bootReadyPromise = Promise.all([getFontSize(), windowSizeTools.init()]).then(([fontSize]) => {
  global.lx.fontSize = fontSize
  bootLog('Font size setting loaded.')
})

let isInited = false
let handlePushedHomeScreen: () => void | Promise<void>

const tryGetBootLog = () => {
  try {
    return getBootLog()
  } catch (err) {
    return 'Get boot log failed.'
  }
}

const handleInit = async() => {
  if (isInited) return
  await bootReadyPromise
  void initLog()
  const { default: init } = await import('@/core/init')
  try {
    handlePushedHomeScreen = await init()
  } catch (err: any) {
    void tipDialog({
      title: '初始化失败 (Init Failed)',
      message: `Boot Log:\n${tryGetBootLog()}\n\n${(err.stack ?? err.message) as string}`,
      btnText: 'Exit',
      bgClose: false,
    }).then(() => {
      exitApp()
    })
    return
  }
  isInited ||= true
}

// React Native Navigation can ask native to remount the previous root before
// async boot tasks finish, so screen registration must happen synchronously.
initNavigation(async() => {
  try {
    await handleInit()
    if (!isInited) return
    // import('@/utils/nativeModules/cryptoTest')

    await navigations.pushHomeScreen().then(() => {
      void handlePushedHomeScreen()
    }).catch((err: any) => {
      void tipDialog({
        title: 'Error',
        message: err.message,
        btnText: 'Exit',
        bgClose: false,
      }).then(() => {
        exitApp()
      })
    })
  } catch (err: any) {
    void tipDialog({
      title: '初始化失败 (Init Failed)',
      message: `Boot Log:\n${tryGetBootLog()}\n\n${(err.stack ?? err.message) as string}`,
      btnText: 'Exit',
      bgClose: false,
    }).then(() => {
      exitApp()
    })
  }
})
