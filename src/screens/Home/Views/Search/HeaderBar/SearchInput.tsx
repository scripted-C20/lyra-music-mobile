import { useCallback, useRef, forwardRef, useImperativeHandle, useState } from 'react'
import { View } from 'react-native'
import Input, { type InputType, type InputProps } from '@/components/common/Input'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { Icon } from '@/components/common/Icon'
import { createStyle } from '@/utils/tools'

export interface SearchInputProps {
  onChangeText: (text: string) => void
  onSubmit: (text: string) => void
  onBlur: () => void
  onTouchStart: () => void
}

export interface SearchInputType {
  setText: (text: string) => void
  // getText: () => string
  focus: () => void
  blur: () => void
}

export default forwardRef<SearchInputType, SearchInputProps>(({ onChangeText, onSubmit, onBlur, onTouchStart }, ref) => {
  const theme = useTheme()
  const t = useI18n()
  const [text, setText] = useState('')
  const inputRef = useRef<InputType>(null)

  useImperativeHandle(ref, () => ({
    // getText() {
    //   return text.trim()
    // },
    setText(text) {
      setText(text)
    },
    focus() {
      inputRef.current?.focus()
    },
    blur() {
      inputRef.current?.blur()
    },
  }))

  const handleChangeText = (text: string) => {
    setText(text)
    onChangeText(text.trim())
  }

  const handleClearText = useCallback(() => {
    setText('')
    onChangeText('')
    onSubmit('')
  }, [onChangeText, onSubmit])

  const handleSubmit = useCallback<NonNullable<InputProps['onSubmitEditing']>>(({ nativeEvent: { text } }) => {
    onSubmit(text)
  }, [onSubmit])

  return (
    <View style={{ ...styles.container, backgroundColor: theme['c-main-background'], borderColor: theme['c-border-background'] }}>
      <View style={styles.icon}>
        <Icon name="search-2" size={15} color={theme['c-font-label']} />
      </View>
      <Input
        ref={inputRef}
        placeholder={t('search_placeholder')}
        value={text}
        onChangeText={handleChangeText}
        style={styles.input}
        onBlur={onBlur}
        onSubmitEditing={handleSubmit}
        onClearText={handleClearText}
        onTouchStart={onTouchStart}
        returnKeyType="search"
        clearBtn
      />
    </View>
  )
})

const styles = createStyle({
  container: {
    width: '100%',
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  icon: {
    width: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: 'transparent',
    height: 44,
    paddingLeft: 0,
    fontSize: 14,
  },
})
