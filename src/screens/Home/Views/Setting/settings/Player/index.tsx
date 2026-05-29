import { memo } from 'react'

import Section from '../../components/Section'
import IsSavePlayTime from './IsSavePlayTime'
import PlayHighQuality from './PlayHighQuality'
import IsHandleAudioFocus from './IsHandleAudioFocus'
import IsEnableAudioOffload from './IsEnableAudioOffload'
import IsAutoCleanPlayedList from './IsAutoCleanPlayedList'
import IsShowBluetoothLyric from './IsShowBluetoothLyric'
import IsShowBluetoothFullLyric from './IsShowBluetoothFullLyric'
import IsShowNotificationImage from './IsShowNotificationImage'
import IsShowLyricTranslation from './IsShowLyricTranslation'
import IsShowLyricRoma from './IsShowLyricRoma'
import IsS2T from './IsS2T'
import MaxCache from './MaxCache'
import { useI18n } from '@/lang'
import SubTitle from '../../components/SubTitle'


export default memo(() => {
  const t = useI18n()

  return (
    <Section title={t('setting_player')} icon="play" description={t('setting_section_desc_player')}>
      <SubTitle title={t('setting_group_playback')}>
        <IsSavePlayTime />
        <IsAutoCleanPlayedList />
        <IsHandleAudioFocus />
        <IsEnableAudioOffload />
      </SubTitle>
      <SubTitle title={t('setting_group_lyrics')}>
        <IsShowBluetoothLyric />
        <IsShowBluetoothFullLyric />
        <IsShowNotificationImage />
        <IsShowLyricTranslation />
        <IsShowLyricRoma />
        <IsS2T />
      </SubTitle>
      <SubTitle title={t('setting_group_quality')}>
        <MaxCache />
        <PlayHighQuality />
      </SubTitle>
    </Section>
  )
})
