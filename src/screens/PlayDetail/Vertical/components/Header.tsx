import { memo, useRef } from 'react'
import { View, StyleSheet } from 'react-native'
import { pop } from '@/navigation'
import StatusBar from '@/components/common/StatusBar'
import { useDS } from '@/theme/useDS'
import { usePlayerMusicInfo } from '@/store/player/hook'
import Text from '@/components/common/Text'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT as _HEADER_HEIGHT, NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import commonState from '@/store/common/state'
import SettingPopup, { type SettingPopupType } from '../../components/SettingPopup'
import { useStatusbarHeight } from '@/store/common/hook'
import Btn from './Btn'

export const HEADER_HEIGHT = scaleSizeH(_HEADER_HEIGHT)
export const PAGE_SIDE_PADDING = 18

const Title = () => {
  const ds = useDS()
  const musicInfo = usePlayerMusicInfo()
  return (
    <View style={styles.titleBlock}>
      <Text numberOfLines={1} size={17} style={[styles.name, { color: ds.text }]}>
        {musicInfo.name || ''}
      </Text>
    </View>
  )
}

export default memo(() => {
  const popupRef = useRef<SettingPopupType>(null)
  const statusBarHeight = useStatusbarHeight()

  const back = () => { void pop(commonState.componentIds.playDetail!) }
  const showSetting = () => { popupRef.current?.show() }

  return (
    <View
      style={[styles.wrap, { paddingTop: statusBarHeight + 18 }]}
      nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_header}
    >
      <StatusBar />
      <View style={styles.row}>
        <View style={styles.sideSlot}>
          <Btn icon="chevron-left" onPress={back} />
        </View>

        <View style={styles.titleWrap}>
          <Title />
        </View>

        <View style={styles.sideSlot}>
          <Btn icon="slider" onPress={showSetting} />
        </View>
      </View>
      <SettingPopup ref={popupRef} direction="vertical" />
    </View>
  )
})

const styles = StyleSheet.create({
  wrap: {
    height: HEADER_HEIGHT + 26,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PAGE_SIDE_PADDING,
  },
  sideSlot: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: { flex: 1, paddingHorizontal: 12, alignItems: 'center' },
  titleBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 38,
  },
  name: {
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.45,
    includeFontPadding: false,
    textShadowColor: 'rgba(255,255,255,0.22)',
    textShadowOffset: { width: 0, height: 0.8 },
    textShadowRadius: 5,
  },
  singerRow: {
    marginTop: 4,
    maxWidth: '86%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  singerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0.82,
  },
  singer: {
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: -0.2,
    includeFontPadding: false,
  },
})
