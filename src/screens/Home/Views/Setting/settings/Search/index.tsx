import { memo } from 'react'

import Section from '../../components/Section'
import SubTitle from '../../components/SubTitle'
import IsShowHotSearch from './IsShowHotSearch'
import IsShowHistorySearch from './IsShowHistorySearch'

import { useI18n } from '@/lang'

export default memo(() => {
  const t = useI18n()

  return (
    <Section title={t('setting_search')} icon="search-2" description={t('setting_section_desc_search')}>
      <SubTitle title={t('setting_group_search_home')} description={t('setting_group_search_home_desc')}>
        <IsShowHotSearch />
        <IsShowHistorySearch />
      </SubTitle>
    </Section>
  )
})
