import { updateSetting } from '@/core/common'
import { setDesktopLyricBackgroundColor, setDesktopLyricColor } from '@/core/desktopLyric'
import { useI18n } from '@/lang'
import { memo } from 'react'
import { StyleSheet, View, TouchableOpacity } from 'react-native'

import SubTitle from '../../components/SubTitle'
import Text from '@/components/common/Text'
import { useDS } from '@/theme/useDS'
import { useSettingValue } from '@/store/setting/hook'

const themes = [
  ['theme', 'rgba(0,0,0,0.6)'],
  ['#08e664', 'rgba(0,0,0,0.6)'],
  ['#fffa12', 'rgba(0,0,0,0.6)'],
  ['#019ce4', 'rgba(0,0,0,0.6)'],
  ['#ff1222', 'rgba(0,0,0,0.6)'],
  ['#ef6976', 'rgba(0,0,0,0.6)'],
  ['#c851d4', 'rgba(0,0,0,0.6)'],
  ['#ffa600', 'rgba(0,0,0,0.6)'],
  ['#000000', '#ffffff'],
  ['#ffffff', 'rgba(0,0,0,0.6)'],
] as const
type Theme = typeof themes[number]

const backgroundThemes = [
  'rgba(0, 0, 0, 0)',
  'rgba(0, 0, 0, 1)',
  'rgba(255, 255, 255, 1)',
  'rgba(255, 59, 48, 1)',
] as const

const ThemeItem = ({ color, active, change }: {
  color: Theme
  active: boolean
  change: (color: Theme) => void
}) => {
  const ds = useDS()

  return (
    <TouchableOpacity style={styles.item} activeOpacity={0.5} onPress={() => { change(color) }}>
      <View style={[styles.colorContent, { borderColor: active ? ds.accent : ds.separator }]}>
        <View style={{ ...styles.image, backgroundColor: color[0] == 'theme' ? ds.accent : color[0] }} />
      </View>
    </TouchableOpacity>
  )
}

const BackgroundItem = ({ color, active, change }: {
  color: string
  active: boolean
  change: (color: string) => void
}) => {
  const ds = useDS()
  const isTransparent = color == 'rgba(0, 0, 0, 0)'

  return (
    <TouchableOpacity style={styles.item} activeOpacity={0.5} onPress={() => { change(color) }}>
      <View style={[styles.colorContent, { borderColor: active ? ds.accent : ds.separator }]}>
        <View style={[styles.image, { backgroundColor: isTransparent ? ds.bgCard : color, borderWidth: isTransparent ? StyleSheet.hairlineWidth : 0, borderColor: ds.separator }]}>
          {isTransparent ? <Text size={8} color={ds.textDim} style={styles.transparentText}>T</Text> : null}
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default memo(() => {
  const t = useI18n()
  const textColor = useSettingValue('desktopLyric.style.lyricPlayedColor')
  const backgroundColor = useSettingValue('desktopLyric.style.backgroundColor')
  const backgroundOpacity = useSettingValue('desktopLyric.style.backgroundOpacity')

  const setThemeDesktopLyric = (color: Theme) => {
    // const shadowColor = 'rgba(0,0,0,0.6)'
    void setDesktopLyricColor(null, color[0], color[1]).then(() => {
      updateSetting({
        'desktopLyric.style.lyricUnplayColor': color[0],
        'desktopLyric.style.lyricPlayedColor': color[0],
        'desktopLyric.style.lyricShadowColor': color[1],
      })
    })
  }

  const setBackgroundDesktopLyric = (color: string) => {
    const nextOpacity = color == 'rgba(0, 0, 0, 0)'
      ? 0
      : backgroundOpacity <= 0 ? 32 : backgroundOpacity
    void setDesktopLyricBackgroundColor(color, nextOpacity).then(() => {
      updateSetting({
        'desktopLyric.style.backgroundColor': color,
        'desktopLyric.style.backgroundOpacity': nextOpacity,
      })
    })
  }

  return (
    <SubTitle title={t('setting_lyric_desktop_theme')}>
      <Text size={11} style={styles.label}>{t('setting_lyric_desktop_text_color')}</Text>
      <View style={styles.list}>
        {
          themes.map((c, i) => <ThemeItem key={i.toString()} color={c} active={textColor == c[0]} change={setThemeDesktopLyric} />)
        }
      </View>
      <Text size={11} style={styles.label}>{t('setting_lyric_desktop_background_color')}</Text>
      <View style={styles.list}>
        {
          backgroundThemes.map(color => <BackgroundItem key={color} color={color} active={backgroundColor == color} change={setBackgroundDesktopLyric} />)
        }
      </View>
    </SubTitle>
  )
})

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  label: {
    marginBottom: 4,
    marginTop: 4,
    opacity: 0.72,
  },
  item: {
    marginRight: 15,
    marginTop: 5,
    alignItems: 'center',
    width: 26,
    // backgroundColor: 'rgba(0,0,0,0.2)',
  },
  colorContent: {
    width: 26,
    height: 26,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 20,
    height: 20,
    borderRadius: 4,
    elevation: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transparentText: {
    fontWeight: '700',
  },
})
