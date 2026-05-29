import { useRef, forwardRef, useImperativeHandle } from 'react'
import { TouchableOpacity, StyleSheet } from 'react-native'
import Modal, { type ModalType } from './Modal'
import { type Source } from '@/store/songlist/state'
import Text from '@/components/common/Text'
import { navigations } from '@/navigation'
import commonState from '@/store/common/state'
import { useDS } from '@/theme/useDS'
import { useI18n } from '@/lang'
import { resolveListDetailId } from '@/core/songlist'
import {
  HEADER_CONTROL_FONT_SIZE,
  HEADER_CONTROL_HORIZONTAL_PADDING,
  HEADER_CONTROL_VERTICAL_PADDING,
} from '../constants'

export interface OpenListType {
  setInfo: (source: Source) => void
}

export default forwardRef<OpenListType, {}>((props, ref) => {
  const modalRef = useRef<ModalType>(null)
  const songlistInfoRef = useRef<{ source: Source }>({ source: 'kw' })
  const ds = useDS()
  const t = useI18n()

  useImperativeHandle(ref, () => ({
    setInfo(source) {
      songlistInfoRef.current.source = source
    },
  }))

  const handleOpenSonglist = async(id: string, source: Source) => {
    const targetId = await resolveListDetailId(source, id)
    navigations.pushSonglistDetailScreen(commonState.componentIds.home!, {
      play_count: undefined,
      id: targetId || id.trim(),
      author: '',
      name: '',
      img: undefined,
      desc: undefined,
      source,
    })
  }

  return (
    <>
      <TouchableOpacity
        style={styles.btn}
        activeOpacity={0.6}
        onPress={() => modalRef.current?.show(songlistInfoRef.current.source)}
      >
        <Text size={HEADER_CONTROL_FONT_SIZE} color={ds.text} style={styles.text} numberOfLines={1}>
          {t('songlist_add') || '添加'}
        </Text>
      </TouchableOpacity>
      <Modal ref={modalRef} onOpenId={handleOpenSonglist} />
    </>
  )
})

const styles = StyleSheet.create({
  btn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingHorizontal: HEADER_CONTROL_HORIZONTAL_PADDING,
    paddingVertical: HEADER_CONTROL_VERTICAL_PADDING,
  },
  text: {
    fontWeight: '400',
    includeFontPadding: false,
    textAlign: 'center',
  },
})
