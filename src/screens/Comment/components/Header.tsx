import { memo } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { pop } from '@/navigation'
import StatusBar from '@/components/common/StatusBar'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import { HEADER_HEIGHT as _HEADER_HEIGHT } from '@/config/constant'
import { scaleSizeH } from '@/utils/pixelRatio'
import commonState from '@/store/common/state'
import { useStatusbarHeight } from '@/store/common/hook'
import { useDS } from '@/theme/useDS'

const HEADER_HEIGHT = scaleSizeH(_HEADER_HEIGHT)

export default memo(({ musicInfo }: { musicInfo: LX.Music.MusicInfo }) => {
  const t = useI18n()
  const statusBarHeight = useStatusbarHeight()
  const ds = useDS()

  const back = () => { void pop(commonState.componentIds.comment!) }

  return (
    <View style={[styles.wrap, { height: HEADER_HEIGHT + statusBarHeight, paddingTop: statusBarHeight, backgroundColor: ds.bg }]}>
      <StatusBar />
      <View style={styles.row}>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.5} onPress={back}>
          <Icon name="chevron-left" color={ds.text} size={20} />
        </TouchableOpacity>
        <Text numberOfLines={1} size={16} style={[styles.title, { color: ds.text }]}>
          {t('comment_title', { name: musicInfo.name, singer: musicInfo.singer })}
        </Text>
        <View style={styles.placeholder} />
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  wrap: {},
  row: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  backBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  title: { flex: 1, textAlign: 'center', fontWeight: '600', letterSpacing: -0.2 },
  placeholder: { width: 44 },
})
