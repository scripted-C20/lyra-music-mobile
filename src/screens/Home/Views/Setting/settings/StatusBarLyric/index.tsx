import { memo } from 'react'

import Section from '../../components/Section'
import StatusBarLyric from '../LyricDesktop/StatusBarLyric'
import { useI18n } from '@/lang'

export default memo(() => {
  const t = useI18n()

  return (
    <Section title={t('setting_lyric_statusbar')} icon="lyric-on" description={t('setting_section_desc_statusbar_lyric')}>
      <StatusBarLyric />
    </Section>
  )
})
