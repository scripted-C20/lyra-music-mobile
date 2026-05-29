import { useI18n } from '@/lang'
import { memo } from 'react'

import Section from '../../components/Section'
import Part from './Part'
import SubTitle from '../../components/SubTitle'
// import MaxCache from './MaxCache'

export default memo(() => {
  const t = useI18n()

  return (
    <Section title={t('setting_backup')} icon="download-2" description={t('setting_section_desc_backup')}>
      <SubTitle title={t('setting_group_manage')}>
        <Part />
      </SubTitle>
      {/* <MaxCache /> */}
    </Section>
  )
})
