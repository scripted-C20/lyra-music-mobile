import { memo, useCallback } from 'react'
import { View, StyleSheet } from 'react-native'

import Section from '../../components/Section'
import IsShowLyric from './IsShowLyric'
import IsLockLyric from './IsLockLyric'
import IsShowToggleAnima from './IsShowToggleAnima'
import IsSingleLine from './IsSingleLine'
import TextSize from './TextSize'
import ViewWidth from './ViewWidth'
import MaxLineNum from './MaxLineNum'
import TextOpacity from './TextOpacity'
import TextPositionX from './TextPositionX'
import TextPositionY from './TextPositionY'
import { useI18n } from '@/lang'
import Theme from './Theme'
import SubTitle from '../../components/SubTitle'
import Button from '../../components/Button'
import { updateSetting } from '@/core/common'
import {
  setDesktopLyricAlpha,
  setDesktopLyricBackgroundColor,
  setDesktopLyricColor,
  setDesktopLyricMaxLineNum,
  setDesktopLyricSingleLine,
  setDesktopLyricTextPosition,
  setDesktopLyricTextSize,
  setDesktopLyricWidth,
  setShowDesktopLyricToggleAnima,
  toggleDesktopLyricLock,
} from '@/core/desktopLyric'
import { toast } from '@/utils/tools'

export default memo(() => {
  const t = useI18n()

  const handleReset = useCallback(() => {
    void Promise.all([
      setDesktopLyricTextSize(180),
      setDesktopLyricAlpha(100),
      setDesktopLyricWidth(100),
      setDesktopLyricMaxLineNum(5),
      setDesktopLyricSingleLine(false),
      setShowDesktopLyricToggleAnima(true),
      toggleDesktopLyricLock(false),
      setDesktopLyricTextPosition('left', 'top'),
      setDesktopLyricColor('theme', 'theme', 'rgba(0, 0, 0, 0.6)'),
      setDesktopLyricBackgroundColor('rgba(0, 0, 0, 0)'),
    ]).then(() => {
      updateSetting({
        'desktopLyric.style.fontSize': 180,
        'desktopLyric.style.opacity': 100,
        'desktopLyric.width': 100,
        'desktopLyric.maxLineNum': 5,
        'desktopLyric.isSingleLine': false,
        'desktopLyric.showToggleAnima': true,
        'desktopLyric.isLock': false,
        'desktopLyric.textPosition.x': 'left',
        'desktopLyric.textPosition.y': 'top',
        'desktopLyric.style.lyricUnplayColor': 'theme',
        'desktopLyric.style.lyricPlayedColor': 'theme',
        'desktopLyric.style.lyricShadowColor': 'rgba(0, 0, 0, 0.6)',
        'desktopLyric.style.backgroundColor': 'rgba(0, 0, 0, 0)',
      })
      toast(t('setting_lyric_desktop_reset_success_tip'))
    })
  }, [t])

  return (
    <Section title={t('setting_lyric_desktop')} icon="lyric-on" description={t('setting_section_desc_lyric_desktop')}>
      <SubTitle title={t('setting_group_display')}>
        <IsShowLyric />
        <IsLockLyric />
        <IsShowToggleAnima />
        <IsSingleLine />
        <Theme />
        <TextSize />
        <TextOpacity />
      </SubTitle>
      <SubTitle title={t('setting_group_layout')}>
        <ViewWidth />
        <MaxLineNum />
        <TextPositionX />
        <TextPositionY />
      </SubTitle>
      <View style={styles.resetRow}>
        <Button onPress={handleReset}>{t('setting_lyric_desktop_reset')}</Button>
      </View>
    </Section>
  )
})

const styles = StyleSheet.create({
  resetRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
})
