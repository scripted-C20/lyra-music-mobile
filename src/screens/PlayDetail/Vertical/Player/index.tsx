import { memo } from 'react'
import { View, StyleSheet } from 'react-native'
import MoreBtn from './components/MoreBtn'
import PlayInfo from './components/PlayInfo'
import ControlBtn from './components/ControlBtn'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { PAGE_SIDE_PADDING } from '../components/Header'

export default memo(() => {
  return (
    <View
      nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_player}
      style={styles.container}
    >
      {/* 进度条 + 时间 */}
      <PlayInfo />
      {/* 上一首 / 播放 / 下一首 */}
      <ControlBtn />
      {/* 底部功能按钮行 */}
      <MoreBtn />
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: PAGE_SIDE_PADDING,
    paddingBottom: 14,
    paddingTop: 4,
    justifyContent: 'flex-start',
    gap: 10,
  },
})
