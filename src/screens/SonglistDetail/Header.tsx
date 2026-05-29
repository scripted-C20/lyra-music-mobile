import { forwardRef, memo, useEffect, useImperativeHandle, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import ButtonBar from './ActionBar'
import { useNavigationComponentDidAppear } from '@/navigation'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { scaleSizeW } from '@/utils/pixelRatio'
import { useDS } from '@/theme/useDS'
import Text, { AnimatedText } from '@/components/common/Text'
import Image from '@/components/common/Image'
import { useListInfo } from './state'
import { useAnimateOnecNumber } from '@/utils/hooks/useAnimateNumber'
import { useStatusbarHeight } from '@/store/common/hook'

const IMG_SIZE = scaleSizeW(100)

const CountText = memo(({ count }: { count: string }) => {
  const [animFade] = useAnimateOnecNumber(0, 1, 250, false)
  const [animY] = useAnimateOnecNumber(6, 0, 250, false)
  return (
    <AnimatedText
      style={[styles.playCount, { opacity: animFade, transform: [{ translateY: animY }] }]}
      numberOfLines={1}
    >{count}</AnimatedText>
  )
}, () => true)

const Pic = ({ componentId, playCount, imgUrl }: {
  componentId: string
  playCount: string
  imgUrl?: string
}) => {
  const [pic, setPic] = useState(imgUrl)
  const [animated, setAnimated] = useState(false)
  const info = useListInfo()
  const ds = useDS()

  useEffect(() => { if (animated) setPic(imgUrl) }, [imgUrl, animated])
  useNavigationComponentDidAppear(componentId, () => { setAnimated(true) })

  return (
    <View style={[styles.picWrap, { shadowColor: ds.shadowColor }]}>
      <Image
        nativeID={`${NAV_SHEAR_NATIVE_IDS.songlistDetail_pic}_to_${info.id}`}
        url={pic}
        style={styles.picImg}
      />
      {playCount && animated ? <CountText count={playCount} /> : null}
    </View>
  )
}

export interface HeaderProps {
  componentId: string
  searchText: string
  onSearch: (text: string) => void
}
export interface HeaderType { setInfo: (info: DetailInfo) => void }
export interface DetailInfo {
  name: string
  desc: string
  playCount: string
  imgUrl?: string
}

export default forwardRef<HeaderType, HeaderProps>(({ componentId, searchText, onSearch }, ref) => {
  const statusBarHeight = useStatusbarHeight()
  const ds = useDS()
  const info = useListInfo()
  const [detailInfo, setDetailInfo] = useState<DetailInfo>({ name: '', desc: '', playCount: '', imgUrl: info.img })

  useImperativeHandle(ref, () => ({ setInfo(info) { setDetailInfo(info) } }), [])

  return (
    <View style={[styles.container, { paddingTop: statusBarHeight, backgroundColor: ds.bg }]}>
      <View style={styles.infoRow}>
        <Pic componentId={componentId} playCount={detailInfo.playCount} imgUrl={detailInfo.imgUrl} />
        <View style={styles.textBlock} nativeID={NAV_SHEAR_NATIVE_IDS.songlistDetail_title}>
          <Text size={18} style={[styles.name, { color: ds.text }]} numberOfLines={2}>
            {detailInfo.name}
          </Text>
          {detailInfo.desc ? (
            <Text size={13} color={ds.textMuted} numberOfLines={3} style={styles.desc}>
              {detailInfo.desc}
            </Text>
          ) : null}
        </View>
      </View>
      <ButtonBar
        searchText={searchText}
        onSearch={onSearch}
      />
    </View>
  )
})

const styles = StyleSheet.create({
  container: {},
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 16,
  },
  picWrap: {
    width: IMG_SIZE,
    height: IMG_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
    flexShrink: 0,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30,
    shadowRadius: 16,
    elevation: 10,
  },
  picImg: { flex: 1, borderRadius: 12 },
  playCount: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#FFFFFF',
  },
  textBlock: { flex: 1, paddingTop: 4 },
  name: { fontWeight: '700', letterSpacing: -0.3, lineHeight: 24, marginBottom: 6 },
  desc: { lineHeight: 18 },
})
