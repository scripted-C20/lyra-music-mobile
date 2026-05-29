import { memo, useState, useEffect, useRef } from 'react'
import { StyleSheet, View, Keyboard } from 'react-native'
import type { InputType, InputProps } from '@/components/common/Input'
import Input from '@/components/common/Input'
import { useDS } from '@/theme/useDS'
import Text from '@/components/common/Text'

export interface InputItemProps extends InputProps {
  value: string
  label: string
  onChanged: (text: string, callback: (value: string) => void) => void
}

export default memo(({ value, label, onChanged, ...props }: InputItemProps) => {
  const [text, setText] = useState(value)
  const textRef = useRef(value)
  const isMountRef = useRef(false)
  const inputRef = useRef<InputType>(null)
  const ds = useDS()

  const saveValue = () => {
    onChanged?.(text, (value: string) => {
      if (!isMountRef.current) return
      const newValue = String(value)
      setText(newValue)
      textRef.current = newValue
    })
  }

  useEffect(() => {
    isMountRef.current = true
    return () => { isMountRef.current = false }
  }, [])

  useEffect(() => {
    const handleKeyboardDidHide = () => {
      if (!inputRef.current?.isFocused()) return
      onChanged?.(textRef.current, value => {
        if (!isMountRef.current) return
        const newValue = String(value)
        setText(newValue)
        textRef.current = newValue
      })
    }
    const keyboardDidHide = Keyboard.addListener('keyboardDidHide', handleKeyboardDidHide)
    return () => { keyboardDidHide.remove() }
  }, [onChanged])

  useEffect(() => {
    if (value !== text) {
      const newValue = String(value)
      setText(newValue)
      textRef.current = newValue
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const handleSetSelectMode = (text: string) => {
    setText(text)
    textRef.current = text
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: ds.textMuted }]} size={12}>{label}</Text>
      <View style={styles.inputRow}>
        <Input
          value={text}
          ref={inputRef}
          onChangeText={handleSetSelectMode}
          style={[styles.input, { backgroundColor: ds.bgFloat, color: ds.text }]}
          {...props}
          onBlur={saveValue}
        />
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: { paddingHorizontal: 12, marginTop: 8, marginBottom: 6 },
  label: { marginBottom: 3, fontWeight: '500' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flexGrow: 0,
    flexShrink: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    maxWidth: 260,
    minWidth: 120,
    height: 28,
    fontSize: 10,
  },
})
