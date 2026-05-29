import { memo } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { type ListInfoItem } from '@/store/songlist/state'
import Text from '@/components/common/Text'
import { scaleSizeW } from '@/utils/pixelRatio'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { useDS } from '@/theme/useDS'
import Image from '@/components/common/Image'
import { Icon } from '@/components/common/Icon'

const gap = scaleSizeW(10)

const pickText = (...values: Array<string | undefined>) => {
  return values.find(value => !!value?.trim())?.trim() ?? '未命名歌单'
}

export default memo(({ item, index, width, showSource, onPress }: {
  item: ListInfoItem
  index: number
  showSource: boolean
  width: number
  onPress: (item: ListInfoItem, index: number) => void
}) => {
  const ds = useDS()
  const itemWidth = width - gap
  const title = pickText(item.name, item.desc, item.author, item.id)
  const subtitleParts = [item.desc, item.author].filter((text): text is string => !!text && !!text.trim())
  const subtitle = subtitleParts.length ? subtitleParts.join(' · ') : (item.total ? `${item.total} 首` : item.source?.toUpperCase())

  const handlePress = () => { onPress(item, index) }

  if (!item.source) return <View style={{ width: itemWidth }} />

  return (
    <View style={{ width: itemWidth }}>
      <TouchableOpacity activeOpacity={0.6} onPress={handlePress} style={styles.row}>
        <View style={styles.thumbWrap}>
          <Image
            url={item.img}
            nativeID={`${NAV_SHEAR_NATIVE_IDS.songlistDetail_pic}_from_${item.id}`}
            style={styles.cover}
          />
          {showSource ? (
            <Text style={[styles.sourceLabel, { backgroundColor: ds.accent }]} size={9} color="#fff">
              {item.source}
            </Text>
          ) : null}
        </View>
        <View style={styles.copy}>
          <Text size={14} style={[styles.title, { color: ds.text }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text size={11} color={ds.textMuted} numberOfLines={1} style={styles.meta}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {item.play_count ? (
          <View style={styles.playCount}>
            <Icon family="ionicons" name="play" size={9} color={ds.accent} />
            <Text size={10} color={ds.accent} style={styles.playCountText}>{item.play_count}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
      {/* hairline 分隔线 */}
      <View style={[styles.divider, { backgroundColor: ds.separator }]} />
    </View>
  )
})

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 76,
    gap: 12,
  },
  thumbWrap: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    flexShrink: 0,
  },
  cover: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    justifyContent: 'center',
  },
  title: {
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 18,
    marginBottom: 4,
    includeFontPadding: false,
  },
  meta: {
    fontWeight: '400',
    lineHeight: 14,
  },
  playCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
    paddingLeft: 4,
  },
  playCountText: {
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  sourceLabel: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    position: 'absolute',
    top: 4,
    left: 4,
    borderRadius: 999,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 12 + 56 + 12, // 与歌单图片对齐
  },
})
