import { View, StyleSheet } from 'react-native'
import { useWindowSize } from '@/utils/hooks'
import { useMemo } from 'react'
import { scaleSizeAbsHR } from '@/utils/pixelRatio'
import { defaultHeaders } from './common/Image'
import SizeView from './SizeView'
import { useBgPic } from '@/store/common/hook'
import { useDS } from '@/theme/useDS'
import ImageBackground from '@/components/common/ImageBackground'

interface Props { children: React.ReactNode }

const BLUR_RADIUS = Math.max(scaleSizeAbsHR(24), 16)

export default ({ children }: Props) => {
  const ds = useDS()
  const win = useWindowSize()
  const pic = useBgPic()

  const node = useMemo(() => (
    <View style={[styles.root, { backgroundColor: ds.bg }]}>
      {pic ? (
        <ImageBackground
          style={[styles.bg, { width: win.width, height: win.height }]}
          source={{ uri: pic, headers: defaultHeaders }}
          resizeMode="cover"
          blurRadius={BLUR_RADIUS}
        >
          <View style={[styles.scrim, { backgroundColor: ds.scrimHeavy }]} />
        </ImageBackground>
      ) : null}
      <View style={styles.content}>{children}</View>
    </View>
  ), [children, ds, pic, win.width, win.height])

  return <>
    <SizeView />
    {node}
  </>
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  bg: { position: 'absolute', left: 0, top: 0 },
  scrim: { flex: 1 },
  content: { flex: 1 },
})
