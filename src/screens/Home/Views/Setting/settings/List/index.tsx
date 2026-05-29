import { memo } from 'react'

import Section from '../../components/Section'
import AddMusicLocationType from './AddMusicLocationType'
import IsClickPlayList from './IsClickPlayList'
import IsShowAlbumName from './IsShowAlbumName'
import IsShowInterval from './IsShowInterval'
import IsShowSource from './IsShowSource'
import IsSaveScrollLocation from './IsSaveScrollLocation'

import { useI18n } from '@/lang'
import SubTitle from '../../components/SubTitle'

export default memo(() => {
  const t = useI18n()

  return (
    <Section title={t('setting_list')} icon="album" description={t('setting_section_desc_list')}>
      <SubTitle title={t('setting_group_playback')}>
        <IsClickPlayList />
      </SubTitle>
      <SubTitle title={t('setting_group_display')}>
        <IsShowSource />
        <IsShowAlbumName />
        <IsShowInterval />
      </SubTitle>
      <SubTitle title={t('setting_group_manage')}>
        <IsSaveScrollLocation />
        <AddMusicLocationType />
      </SubTitle>
    </Section>
  )
})
