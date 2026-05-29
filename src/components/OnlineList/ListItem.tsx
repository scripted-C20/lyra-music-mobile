import { memo, useRef } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import Text from '@/components/common/Text'
import { type BadgeType } from '@/components/common/Badge'
import { Icon } from '@/components/common/Icon'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { scaleSizeH } from '@/utils/pixelRatio'
import { LIST_ITEM_HEIGHT } from '@/config/constant'
import { type RowInfo, type RowInfoType } from '@/utils/tools'

export const ITEM_HEIGHT = scaleSizeH(LIST_ITEM_HEIGHT + 10)

const useQualityTag = (musicInfo: LX.Music.MusicInfoOnline) => {
  const t = useI18n()
  let info: { type: BadgeType | null, text: string, shortText: string } = { type: null, text: '', shortText: '' }
  if (musicInfo.meta._qualitys.flac24bit) {
    info.type = 'secondary'
    info.text = t('quality_lossless_24bit')
    info.shortText = '24bit'
  } else if (musicInfo.meta._qualitys.flac ?? musicInfo.meta._qualitys.ape) {
    info.type = 'secondary'
    info.text = t('quality_lossless')
    info.shortText = 'SQ'
  } else if (musicInfo.meta._qualitys['320k']) {
    info.type = 'tertiary'
    info.text = t('quality_high_quality')
    info.shortText = 'HQ'
  }
  return info
}

const isSameMusic = (a: LX.Music.MusicInfoOnline | null, b: LX.Music.MusicInfoOnline) => {
  if (!a) return false
  return a.id == b.id && a.source == b.source
}

export default memo(({ item, index, rowType, showSource, onPress, onLongPress, onShowMenu, selectedList, activeMusicInfo, rowInfo, isShowAlbumName, isShowInterval }: {
  item: LX.Music.MusicInfoOnline
  index: number
  rowType?: RowInfoType
  showSource?: boolean
  onPress: (item: LX.Music.MusicInfoOnline, index: number) => void
  onLongPress: (item: LX.Music.MusicInfoOnline, index: number) => void
  onShowMenu: (item: LX.Music.MusicInfoOnline, index: number, position: { x: number, y: number, w: number, h: number }) => void
  selectedList: LX.Music.MusicInfoOnline[]
  activeMusicInfo: LX.Music.MusicInfoOnline | null
  rowInfo: RowInfo
  isShowAlbumName: boolean
  isShowInterval: boolean
}) => {
  const theme = useTheme()
  const isSelected = selectedList.includes(item)
  const isActive = isSameMusic(activeMusicInfo, item)
  const isHighlight = isSelected || isActive

  const moreButtonRef = useRef<TouchableOpacity>(null)
  const handleShowMenu = () => {
    if (moreButtonRef.current?.measure) {
      moreButtonRef.current.measure((fx, fy, width, height, px, py) => {
        onShowMenu(item, index, { x: Math.ceil(px), y: Math.ceil(py), w: Math.ceil(width), h: Math.ceil(height) })
      })
    }
  }
  const tagInfo = useQualityTag(item)
  const rankLabel = `${index + 1}`.padStart(2, '0')
  const subtitle = `${item.singer}${isShowAlbumName && item.meta.albumName ? ` · ${item.meta.albumName}` : ''}`
  const qualityLabel = tagInfo.shortText || (showSource ? item.source.toUpperCase() : '')

  return (
    <View style={[
      styles.row,
      {
        width: rowInfo.rowWidth,
        height: ITEM_HEIGHT,
        backgroundColor: isHighlight ? theme['c-primary-light-1000-alpha-400'] : 'transparent',
        borderBottomColor: theme['c-border-background'],
      },
    ]}>
      {/* 播放中指示线 — 仅选中时显示 */}
      {isHighlight && (
        <View style={[styles.activeLine, { backgroundColor: theme['c-primary-dark-200'] }]} />
      )}

      <TouchableOpacity
        style={styles.touchArea}
        activeOpacity={0.6}
        onPress={() => { onPress(item, index) }}
        onLongPress={() => { onLongPress(item, index) }}
      >
        {/* 序号 */}
        <View style={styles.rankSlot}>
          {isActive
            ? <Icon name="play-outline" size={13} color={theme['c-primary-dark-200']} />
            : (
                <Text
                  size={13}
                  color={isHighlight ? theme['c-primary-dark-200'] : theme['c-450']}
                  style={styles.rankText}
                >
                  {rankLabel}
                </Text>
              )}
        </View>

        {/* 歌曲信息 */}
        <View style={styles.infoSlot}>
          <Text
            size={15}
            style={[styles.songName, { color: isHighlight ? theme['c-primary-dark-200'] : theme['c-font'] }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text size={12} color={theme['c-500']} numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </Text>
        </View>

        {/* 品质标签 */}
        {qualityLabel ? (
          <View style={[styles.qualityPill, { backgroundColor: theme['c-primary-light-1000-alpha-200'], borderColor: theme['c-border-background'] }]}>
            <Text size={10} color={theme['c-600']} style={styles.qualityText}>
              {qualityLabel}
            </Text>
          </View>
        ) : null}

        {/* 时长 */}
        {isShowInterval && item.interval ? (
          <Text size={12} color={theme['c-350']} style={styles.duration}>
            {item.interval}
          </Text>
        ) : null}
      </TouchableOpacity>

      {/* 更多按钮 */}
      <TouchableOpacity onPress={handleShowMenu} ref={moreButtonRef} style={styles.moreBtn}>
        <Icon name="dots-vertical" color={theme['c-500']} size={16} />
      </TouchableOpacity>
    </View>
  )
}, (prevProps, nextProps) => {
  return !!(prevProps.item === nextProps.item &&
    prevProps.index === nextProps.index &&
    prevProps.rowType === nextProps.rowType &&
    prevProps.isShowAlbumName === nextProps.isShowAlbumName &&
    prevProps.isShowInterval === nextProps.isShowInterval &&
    nextProps.selectedList.includes(nextProps.item) === prevProps.selectedList.includes(prevProps.item) &&
    isSameMusic(nextProps.activeMusicInfo, nextProps.item) === isSameMusic(prevProps.activeMusicInfo, prevProps.item)
  )
})

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    position: 'relative',
    overflow: 'hidden',
  },
  activeLine: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: 2,
  },
  touchArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingRight: 4,
  },
  // 序号
  rankSlot: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  // 歌曲信息
  infoSlot: {
    flex: 1,
    paddingRight: 8,
    minWidth: 0,
  },
  songName: {
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  subtitle: {
    fontWeight: '400',
  },
  // 品质 Pill
  qualityPill: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 8,
  },
  qualityText: {
    fontWeight: '600',
  },
  // 时长
  duration: {
    minWidth: 36,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
    fontWeight: '400',
  },
  // 更多
  moreBtn: {
    width: 36,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
