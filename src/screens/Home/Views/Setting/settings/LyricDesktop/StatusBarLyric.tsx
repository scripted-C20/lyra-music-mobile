import { memo, useCallback, useRef, useState } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

import Button from '../../components/Button'
import CheckBoxItem from '../../components/CheckBoxItem'
import Slider, { type SliderProps } from '../../components/Slider'
import SubTitle from '../../components/SubTitle'
import DesktopLyricEnable, { type DesktopLyricEnableType } from '@/components/DesktopLyricEnable'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { updateSetting } from '@/core/common'
import {
  setStatusBarLyricAlpha,
  setStatusBarLyricBackgroundColor,
  setStatusBarLyricColor,
  setStatusBarLyricMaxLineNum,
  setStatusBarLyricPosition,
  setStatusBarLyricShowToggleAnima,
  setStatusBarLyricSingleLine,
  setStatusBarLyricTextPosition,
  setStatusBarLyricTextSize,
  setStatusBarLyricWidth,
  showStatusBarLyric,
  hideStatusBarLyric,
} from '@/core/desktopLyric'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { useDS } from '@/theme/useDS'
import { toast } from '@/utils/tools'

interface StatusPreset {
  id: string
  nameKey: 'setting_lyric_statusbar_preset_center' | 'setting_lyric_statusbar_preset_xiaomi' | 'setting_lyric_statusbar_preset_huawei' | 'setting_lyric_statusbar_preset_meizu' | 'setting_lyric_statusbar_preset_ov' | 'setting_lyric_statusbar_preset_samsung'
  setting: Partial<LX.AppSetting>
}

const BASE_PRESET_SETTING: Partial<LX.AppSetting> = {
  'statusBarLyric.isLock': true,
  'statusBarLyric.maxLineNum': 1,
  'statusBarLyric.isSingleLine': true,
  'statusBarLyric.showToggleAnima': false,
  'statusBarLyric.textPosition.x': 'center',
  'statusBarLyric.textPosition.y': 'center',
  'statusBarLyric.style.fontSize': 132,
  'statusBarLyric.style.opacity': 100,
  'statusBarLyric.style.lyricUnplayColor': 'rgba(255, 255, 255, 1)',
  'statusBarLyric.style.lyricPlayedColor': 'rgba(255, 255, 255, 1)',
  'statusBarLyric.style.lyricShadowColor': 'rgba(0, 0, 0, 0.5)',
  'statusBarLyric.style.backgroundColor': 'rgba(0, 0, 0, 0.42)',
}

const STATUS_PRESETS: StatusPreset[] = [
  {
    id: 'center',
    nameKey: 'setting_lyric_statusbar_preset_center',
    setting: {
      ...BASE_PRESET_SETTING,
      'statusBarLyric.width': 64,
      'statusBarLyric.position.x': 18,
      'statusBarLyric.position.y': 0,
    },
  },
  {
    id: 'xiaomi',
    nameKey: 'setting_lyric_statusbar_preset_xiaomi',
    setting: {
      ...BASE_PRESET_SETTING,
      'statusBarLyric.width': 58,
      'statusBarLyric.position.x': 21,
      'statusBarLyric.position.y': 0,
    },
  },
  {
    id: 'huawei',
    nameKey: 'setting_lyric_statusbar_preset_huawei',
    setting: {
      ...BASE_PRESET_SETTING,
      'statusBarLyric.width': 54,
      'statusBarLyric.position.x': 23,
      'statusBarLyric.position.y': 1,
    },
  },
  {
    id: 'meizu',
    nameKey: 'setting_lyric_statusbar_preset_meizu',
    setting: {
      ...BASE_PRESET_SETTING,
      'statusBarLyric.width': 72,
      'statusBarLyric.position.x': 14,
      'statusBarLyric.position.y': 0,
      'statusBarLyric.style.fontSize': 124,
      'statusBarLyric.style.lyricUnplayColor': 'theme',
      'statusBarLyric.style.lyricPlayedColor': 'theme',
      'statusBarLyric.style.lyricShadowColor': 'rgba(0, 0, 0, 0.68)',
      'statusBarLyric.style.backgroundColor': 'rgba(0, 0, 0, 0)',
    },
  },
  {
    id: 'ov',
    nameKey: 'setting_lyric_statusbar_preset_ov',
    setting: {
      ...BASE_PRESET_SETTING,
      'statusBarLyric.width': 68,
      'statusBarLyric.position.x': 16,
      'statusBarLyric.position.y': 0,
    },
  },
  {
    id: 'samsung',
    nameKey: 'setting_lyric_statusbar_preset_samsung',
    setting: {
      ...BASE_PRESET_SETTING,
      'statusBarLyric.width': 50,
      'statusBarLyric.position.x': 25,
      'statusBarLyric.position.y': 0,
    },
  },
]

const TEXT_COLORS = [
  'rgba(255, 255, 255, 1)',
  'theme',
  'rgba(255, 59, 48, 1)',
  'rgba(255, 250, 230, 1)',
] as const

const BACKGROUND_COLORS = [
  'rgba(0, 0, 0, 0)',
  'rgba(0, 0, 0, 0.42)',
  'rgba(255, 59, 48, 0.72)',
  'rgba(255, 255, 255, 0.88)',
] as const

const RESET_SETTING: Partial<LX.AppSetting> = {
  ...BASE_PRESET_SETTING,
  'statusBarLyric.width': 64,
  'statusBarLyric.position.x': 18,
  'statusBarLyric.position.y': 0,
}

const applyPresetToNative = async(setting: Partial<LX.AppSetting>) => {
  await setStatusBarLyricWidth(setting['statusBarLyric.width']!)
  await setStatusBarLyricMaxLineNum(setting['statusBarLyric.maxLineNum']!)
  await setStatusBarLyricSingleLine(setting['statusBarLyric.isSingleLine']!)
  await setStatusBarLyricShowToggleAnima(setting['statusBarLyric.showToggleAnima']!)
  await setStatusBarLyricPosition(setting['statusBarLyric.position.x']!, setting['statusBarLyric.position.y']!)
  await setStatusBarLyricTextPosition(setting['statusBarLyric.textPosition.x']!, setting['statusBarLyric.textPosition.y']!)
  await setStatusBarLyricTextSize(setting['statusBarLyric.style.fontSize']!)
  await setStatusBarLyricAlpha(setting['statusBarLyric.style.opacity']!)
  await setStatusBarLyricColor(
    setting['statusBarLyric.style.lyricUnplayColor']!,
    setting['statusBarLyric.style.lyricPlayedColor']!,
    setting['statusBarLyric.style.lyricShadowColor']!,
  )
  await setStatusBarLyricBackgroundColor(setting['statusBarLyric.style.backgroundColor']!)
}

const ColorChip = ({ color, active, onPress }: {
  color: string
  active: boolean
  onPress: () => void
}) => {
  const ds = useDS()
  const displayColor = color == 'theme' ? ds.accent : color

  return (
    <TouchableOpacity
      activeOpacity={0.65}
      onPress={onPress}
      style={[
        styles.colorChip,
        {
          borderColor: active ? ds.accent : ds.separator,
          backgroundColor: ds.bgCard,
        },
      ]}
    >
      <View style={[styles.colorPreview, { backgroundColor: displayColor }]}>
        {color == 'theme' ? <Text size={8} color={ds.textOnAccent} style={styles.themeMark}>T</Text> : null}
      </View>
    </TouchableOpacity>
  )
}

const formatSliderValue = (value: number, precision?: number) => {
  return precision == null ? `${value}` : value.toFixed(precision)
}

const normalizeSliderValue = (value: number, precision?: number) => {
  return precision == null ? value : Number(value.toFixed(precision))
}

const StatusSlider = ({ title, value, min, max, step, precision, onApply }: {
  title: string
  value: number
  min: number
  max: number
  step: number
  precision?: number
  onApply: (value: number) => Promise<void>
}) => {
  const ds = useDS()
  const [sliderValue, setSliderValue] = useState(value)
  const [isSliding, setSliding] = useState(false)
  const displayValue = isSliding ? sliderValue : value

  const handleSlidingStart = useCallback<NonNullable<SliderProps['onSlidingStart']>>(() => {
    setSliding(true)
  }, [])
  const handleValueChange = useCallback<NonNullable<SliderProps['onValueChange']>>(nextValue => {
    setSliderValue(normalizeSliderValue(nextValue, precision))
  }, [precision])
  const handleSlidingComplete = useCallback<NonNullable<SliderProps['onSlidingComplete']>>(nextValue => {
    const normalizedValue = normalizeSliderValue(nextValue, precision)
    if (normalizedValue == value) {
      setSliding(false)
      return
    }
    void onApply(normalizedValue).finally(() => {
      setSliding(false)
    })
  }, [onApply, precision, value])

  return (
    <View style={styles.sliderLine}>
      <Text size={11} color={ds.textMuted} style={styles.sliderLabel}>{title}</Text>
      <Text size={11} color={ds.accent} style={styles.sliderValue}>{formatSliderValue(displayValue, precision)}</Text>
      <Slider
        minimumValue={min}
        maximumValue={max}
        onSlidingComplete={handleSlidingComplete}
        onValueChange={handleValueChange}
        onSlidingStart={handleSlidingStart}
        step={step}
        value={value}
      />
    </View>
  )
}

export default memo(() => {
  const t = useI18n()
  const ds = useDS()
  const enabledLyric = useSettingValue('statusBarLyric.enable')
  const locked = useSettingValue('statusBarLyric.isLock')
  const width = useSettingValue('statusBarLyric.width')
  const positionX = useSettingValue('statusBarLyric.position.x')
  const positionY = useSettingValue('statusBarLyric.position.y')
  const fontSize = useSettingValue('statusBarLyric.style.fontSize')
  const opacity = useSettingValue('statusBarLyric.style.opacity')
  const textColor = useSettingValue('statusBarLyric.style.lyricPlayedColor')
  const shadowColor = useSettingValue('statusBarLyric.style.lyricShadowColor')
  const backgroundColor = useSettingValue('statusBarLyric.style.backgroundColor')
  const desktopLyricEnableRef = useRef<DesktopLyricEnableType>(null)
  const previewTextColor = textColor == 'theme' ? ds.accent : textColor

  const handleToggleStatusBarLyric = useCallback((enabled: boolean) => {
    desktopLyricEnableRef.current?.setEnabled(enabled)
  }, [])

  const handleApplyPreset = useCallback((setting: Partial<LX.AppSetting>) => {
    const nextSetting = {
      ...setting,
      'statusBarLyric.enable': true,
      'statusBarLyric.isLock': true,
    }
    updateSetting(nextSetting)
    void hideStatusBarLyric().then(showStatusBarLyric).then(() => {
      void applyPresetToNative(nextSetting)
      toast(t('setting_lyric_statusbar_applied'))
    }).catch(() => {
      updateSetting({ 'statusBarLyric.enable': false })
      desktopLyricEnableRef.current?.setEnabled(true)
    })
  }, [t])

  const handleReset = useCallback(() => {
    const nextSetting = {
      ...RESET_SETTING,
      'statusBarLyric.isLock': true,
    }
    updateSetting(nextSetting)
    const applyReset = async() => {
      if (enabledLyric) await applyPresetToNative(nextSetting)
      toast(t('setting_lyric_statusbar_reset_success_tip'))
    }
    void applyReset()
  }, [enabledLyric, t])

  const handleChangeTextColor = useCallback((color: string) => {
    const nextShadowColor = color == 'rgba(255, 255, 255, 1)' ? 'rgba(0, 0, 0, 0.5)' : shadowColor
    void setStatusBarLyricColor(color, color, nextShadowColor).then(() => {
      updateSetting({
        'statusBarLyric.style.lyricUnplayColor': color,
        'statusBarLyric.style.lyricPlayedColor': color,
        'statusBarLyric.style.lyricShadowColor': nextShadowColor,
      })
    })
  }, [shadowColor])

  const handleChangeBackgroundColor = useCallback((color: string) => {
    void setStatusBarLyricBackgroundColor(color).then(() => {
      updateSetting({ 'statusBarLyric.style.backgroundColor': color })
    })
  }, [])

  const applyPosition = useCallback(async(x: number, y: number) => {
    await setStatusBarLyricPosition(x, y)
    updateSetting({
      'statusBarLyric.position.x': x,
      'statusBarLyric.position.y': y,
    })
  }, [])

  return (
    <View style={[styles.container, { backgroundColor: ds.fill1, borderColor: ds.separator }]}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: ds.accentSoft }]}>
          <Icon name="lyric-on" size={15} color={ds.accent} />
        </View>
        <View style={styles.headerText}>
          <Text size={13} style={styles.title} color={ds.text}>{t('setting_lyric_statusbar')}</Text>
          <Text size={11} style={styles.desc} color={ds.textDim}>{t('setting_lyric_statusbar_desc')}</Text>
        </View>
      </View>

      <View style={[styles.preview, { backgroundColor: ds.bgCard, borderColor: ds.separator }]}>
        <View style={[styles.phoneBar, { backgroundColor }]}>
          <View style={[styles.cameraDot, { backgroundColor: ds.bg }]} />
          <Text size={11} color={previewTextColor} numberOfLines={1} style={styles.previewText}>
            {t('setting_lyric_statusbar_preview')}
          </Text>
        </View>
        <Text size={10} color={ds.textDim} style={styles.previewTip}>{t('setting_lyric_statusbar_notice')}</Text>
      </View>

      <View style={styles.row}>
        <CheckBoxItem check={enabledLyric} onChange={handleToggleStatusBarLyric} label={t('setting_lyric_statusbar_mode')} />
        <CheckBoxItem check={locked} onChange={() => { updateSetting({ 'statusBarLyric.isLock': true }) }} label={t('setting_lyric_statusbar_lock')} disabled />
      </View>

      <View style={styles.paletteRow}>
        <Text size={12} color={ds.textMuted} style={styles.paletteTitle}>{t('setting_lyric_statusbar_text')}</Text>
        <View style={styles.palette}>
          {TEXT_COLORS.map(color => (
            <ColorChip
              key={color}
              color={color}
              active={color == textColor}
              onPress={() => { handleChangeTextColor(color) }}
            />
          ))}
        </View>
      </View>

      <View style={styles.paletteRow}>
        <Text size={12} color={ds.textMuted} style={styles.paletteTitle}>{t('setting_lyric_statusbar_background')}</Text>
        <View style={styles.palette}>
          {BACKGROUND_COLORS.map(color => (
            <ColorChip
              key={color}
              color={color}
              active={color == backgroundColor}
              onPress={() => { handleChangeBackgroundColor(color) }}
            />
          ))}
        </View>
      </View>

      <SubTitle title={t('setting_lyric_statusbar_finetune')}>
        <StatusSlider
          title={t('setting_lyric_statusbar_width')}
          value={width}
          min={35}
          max={100}
          step={1}
          onApply={async value => {
            await setStatusBarLyricWidth(value)
            updateSetting({ 'statusBarLyric.width': value })
          }}
        />
        <StatusSlider
          title={t('setting_lyric_statusbar_text_size')}
          value={fontSize}
          min={90}
          max={180}
          step={2}
          onApply={async value => {
            await setStatusBarLyricTextSize(value)
            updateSetting({ 'statusBarLyric.style.fontSize': value })
          }}
        />
        <StatusSlider
          title={t('setting_lyric_statusbar_opacity')}
          value={opacity}
          min={20}
          max={100}
          step={2}
          onApply={async value => {
            await setStatusBarLyricAlpha(value)
            updateSetting({ 'statusBarLyric.style.opacity': value })
          }}
        />
        <StatusSlider
          title={t('setting_lyric_statusbar_move_x')}
          value={positionX}
          min={0}
          max={100}
          step={0.1}
          precision={1}
          onApply={async value => applyPosition(value, positionY)}
        />
        <StatusSlider
          title={t('setting_lyric_statusbar_move_y')}
          value={positionY}
          min={0}
          max={12}
          step={0.1}
          precision={1}
          onApply={async value => applyPosition(positionX, value)}
        />
      </SubTitle>

      <View style={styles.actions}>
        <Button onPress={() => { handleApplyPreset(STATUS_PRESETS[0].setting) }}>{t('setting_lyric_statusbar_apply')}</Button>
        <Button onPress={handleReset}>{t('setting_lyric_statusbar_reset')}</Button>
      </View>
      <View style={styles.presetList}>
        {STATUS_PRESETS.map(preset => (
          <TouchableOpacity
            key={preset.id}
            activeOpacity={0.68}
            style={[styles.presetButton, { backgroundColor: ds.bgCard, borderColor: ds.separator }]}
            onPress={() => { handleApplyPreset(preset.setting) }}
          >
            <Text size={11} color={ds.text}>{t(preset.nameKey)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <DesktopLyricEnable ref={desktopLyricEnableRef} mode="statusBar" />
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 11,
    paddingBottom: 8,
    gap: 9,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontWeight: '600',
  },
  desc: {
    marginTop: 3,
    lineHeight: 15,
  },
  preview: {
    marginHorizontal: 12,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  phoneBar: {
    height: 30,
    borderRadius: 999,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cameraDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.76,
    marginRight: 8,
  },
  previewText: {
    flex: 1,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  previewTip: {
    marginTop: 6,
    lineHeight: 14,
  },
  row: {
    marginTop: 2,
  },
  paletteRow: {
    paddingHorizontal: 12,
    paddingTop: 5,
  },
  paletteTitle: {
    marginBottom: 7,
    fontWeight: '500',
  },
  palette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorChip: {
    width: 38,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    padding: 4,
  },
  colorPreview: {
    flex: 1,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeMark: {
    fontWeight: '800',
  },
  sliderLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingTop: 4,
  },
  sliderLabel: {
    minWidth: 58,
    fontWeight: '500',
  },
  sliderValue: {
    minWidth: 32,
    textAlign: 'right',
    marginRight: 4,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  presetList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  presetButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
})
