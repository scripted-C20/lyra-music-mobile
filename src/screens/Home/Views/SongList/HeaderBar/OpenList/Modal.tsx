import { useRef, useImperativeHandle, forwardRef, useState } from 'react'
import ConfirmAlert, { type ConfirmAlertType } from '@/components/common/ConfirmAlert'
import Text from '@/components/common/Text'
import { View } from 'react-native'
import Input, { type InputType } from '@/components/common/Input'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import SourceSelector, { type SourceSelectorType } from '../SourceSelector'
import songlistState, { type Source } from '@/store/songlist/state'
import songlistAction from '@/store/songlist/action'

interface IdInputType {
  setText: (text: string) => void
  getText: () => string
  focus: () => void
}
const IdInput = forwardRef<IdInputType, {}>((props, ref) => {
  const theme = useTheme()
  const t = useI18n()
  const [text, setText] = useState('')
  const inputRef = useRef<InputType>(null)

  useImperativeHandle(ref, () => ({
    getText() {
      return text.trim()
    },
    setText(text) {
      setText(text)
    },
    focus() {
      inputRef.current?.focus()
    },
  }))

  return (
    <Input
      ref={inputRef}
      placeholder={t('songlist_open_input_placeholder')}
      value={text}
      onChangeText={setText}
      style={{ ...styles.input, backgroundColor: theme['c-primary-input-background'] }}
    />
  )
})


export interface ModalProps {
  onOpenId: (id: string, source: Source) => void
}
export interface ModalType {
  show: (source: Source) => void
}

export default forwardRef<ModalType, ModalProps>(({ onOpenId }, ref) => {
  const alertRef = useRef<ConfirmAlertType>(null)
  const sourceSelectorRef = useRef<SourceSelectorType>(null)
  const inputRef = useRef<IdInputType>(null)
  const [visible, setVisible] = useState(false)
  const [source, setSource] = useState<Source>('kw')
  const theme = useTheme()
  const t = useI18n()

  const handleShow = (fallbackSource: Source) => {
    const rememberedSource = songlistState.openSongListInputInfo.source
    const nextSource = songlistState.sources.includes(rememberedSource as Source)
      ? rememberedSource as Source
      : fallbackSource

    alertRef.current?.setVisible(true)
    requestAnimationFrame(() => {
      setSource(nextSource)
      sourceSelectorRef.current?.setSource(nextSource)
      inputRef.current?.setText(songlistState.openSongListInputInfo.text)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 300)
    })
  }
  useImperativeHandle(ref, () => ({
    show(source) {
      if (visible) handleShow(source)
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          handleShow(source)
        })
      }
    },
  }))

  const handleConfirm = () => {
    let id = inputRef.current?.getText() ?? ''
    if (!id.length) return
    if (id.length > 500) id = id.substring(0, 500)
    songlistAction.setOpenSongListInputInfo(id, source)
    alertRef.current?.setVisible(false)
    onOpenId(id, source)
  }

  return (
    visible
      ? <ConfirmAlert
          ref={alertRef}
          title={t('songlist_add')}
          confirmText={t('songlist_open')}
          onConfirm={handleConfirm}
        >
          <View style={styles.content}>
            <View style={{ ...styles.col, backgroundColor: theme['c-primary-input-background'], borderColor: theme['c-primary-light-100-alpha-300'] }}>
              <SourceSelector
                ref={sourceSelectorRef}
                style={{ ...styles.selector, backgroundColor: theme['c-primary-input-background'], borderColor: theme['c-primary-light-100-alpha-300'] }}
                onSourceChange={setSource}
              />
              <IdInput ref={inputRef} />
            </View>
            <Text style={styles.inputTipText} size={13} color={theme['c-600']}>{t('songlist_open_input_tip')}</Text>
          </View>
        </ConfirmAlert>
      : null
  )
})


const styles = createStyle({
  content: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'column',
  },
  col: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  selector: {
    width: 104,
    flexGrow: 0,
    flexShrink: 0,
    borderRightWidth: 1,
  },
  input: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 180,
    height: '100%',
    borderRadius: 0,
    paddingLeft: 10,
    paddingRight: 10,
  },
  inputTipText: {
    marginTop: 15,
  },
})
