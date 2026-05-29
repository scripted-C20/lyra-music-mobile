import { useRef, useImperativeHandle, forwardRef, useState, useMemo, useCallback } from 'react'
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
import { type Message } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'

const sourceMatchers: Array<{ source: Source, patterns: RegExp[] }> = [
  { source: 'wy', patterns: [/music\.163\.com/i, /y\.music\.163\.com/i, /163cn\.tv/i] },
  { source: 'tx', patterns: [/y\.qq\.com/i, /i\.y\.qq\.com/i, /c6\.y\.qq\.com/i, /qq\.com\/.*(?:playlist|taoge)/i] },
  { source: 'kg', patterns: [/kugou\.com/i, /t\.kugou\.com/i, /m\.kugou\.com/i] },
  { source: 'kw', patterns: [/kuwo\.cn/i, /kuwo\.com/i, /h5app\.kuwo\.cn/i] },
  { source: 'mg', patterns: [/migu\.cn/i, /nf\.migu\.cn/i, /c\.migu\.cn/i] },
]

const detectSourceFromInput = (input: string, supportedSources: Source[]): Source | null => {
  const text = input.trim()
  if (!/^https?:\/\//i.test(text)) return null
  const detected = sourceMatchers.find(item => item.patterns.some(pattern => pattern.test(text)))?.source
  return detected && supportedSources.includes(detected) ? detected : null
}

const getSourceLangKey = (sourceNameType: LX.AppSetting['common.sourceNameType'], source: Source) => {
  return `source_${sourceNameType}_${source}` as keyof Message
}

interface IdInputType {
  setText: (text: string) => void
  getText: () => string
  focus: () => void
}
const IdInput = forwardRef<IdInputType, { onTextChange: (text: string) => void }>(({ onTextChange }, ref) => {
  const theme = useTheme()
  const t = useI18n()
  const [text, setText] = useState('')
  const inputRef = useRef<InputType>(null)

  const handleChangeText = (text: string) => {
    setText(text)
    onTextChange(text)
  }

  useImperativeHandle(ref, () => ({
    getText() {
      return text.trim()
    },
    setText(text) {
      setText(text)
      onTextChange(text)
    },
    focus() {
      inputRef.current?.focus()
    },
  }), [onTextChange, text])

  return (
    <Input
      ref={inputRef}
      placeholder={t('songlist_open_input_placeholder')}
      value={text}
      onChangeText={handleChangeText}
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
  const [detectedSource, setDetectedSource] = useState<Source | null>(null)
  const theme = useTheme()
  const t = useI18n()
  const sourceNameType = useSettingValue('common.sourceNameType')
  const getSourceLabel = useCallback((source: Source) => {
    return t(getSourceLangKey(sourceNameType, source)) || source.toUpperCase()
  }, [sourceNameType, t])

  const sourceTip = useMemo(() => {
    if (!detectedSource) return t('songlist_open_source_current', { source: getSourceLabel(source) })
    if (detectedSource == source) return t('songlist_open_source_detected', { source: getSourceLabel(detectedSource) })
    return t('songlist_open_source_auto', { source: getSourceLabel(detectedSource) })
  }, [detectedSource, getSourceLabel, source, t])

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
    const targetSource = detectedSource ?? source
    songlistAction.setOpenSongListInputInfo(id, targetSource)
    alertRef.current?.setVisible(false)
    onOpenId(id, targetSource)
  }
  const handleTextChange = (text: string) => {
    setDetectedSource(detectSourceFromInput(text, songlistState.sources))
  }
  const handleSourceChange = (source: Source) => {
    setSource(source)
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
                onSourceChange={handleSourceChange}
              />
              <IdInput ref={inputRef} onTextChange={handleTextChange} />
            </View>
            <View style={{
              ...styles.sourceTip,
              backgroundColor: detectedSource && detectedSource != source ? theme['c-primary-light-100-alpha-100'] : theme['c-primary-input-background'],
              borderColor: theme['c-primary-light-100-alpha-300'],
            }}>
              <Text size={12} color={detectedSource && detectedSource != source ? theme['c-primary-font'] : theme['c-600']} style={styles.sourceTipText}>
                {sourceTip}
              </Text>
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
    marginTop: 12,
  },
  sourceTip: {
    marginTop: 10,
    minHeight: 30,
    borderWidth: 1,
    borderRadius: 6,
    justifyContent: 'center',
    paddingLeft: 10,
    paddingRight: 10,
  },
  sourceTipText: {
    fontWeight: '600',
  },
})
