import { memo } from 'react'

import Section from '../../components/Section'
import ResourceCache from './ResourceCache'
import MetaCache from './MetaCache'
import DislikeList from './DislikeList'
import Log from './Log'
// import MaxCache from './MaxCache'
import { useI18n } from '@/lang'
import SubTitle from '../../components/SubTitle'

export default memo(() => {
  const t = useI18n()

  return (
    <Section title={t('setting_other')} icon="sd-card" description={t('setting_section_desc_other')}>
      <SubTitle title={t('setting_group_manage')}>
        <ResourceCache />
        <MetaCache />
        <Log />
      </SubTitle>
      <SubTitle title={t('setting_group_rules')}>
        <DislikeList />
      </SubTitle>
      {/* <MaxCache /> */}
    </Section>
  )
})
