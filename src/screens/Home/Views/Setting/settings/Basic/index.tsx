import { memo } from 'react'

import Theme from '../Theme'
import Section from '../../components/Section'
import SourceName from './SourceName'
import Language from './Language'
import FontSize from './FontSize'
import ShareType from './ShareType'
import IsStartupAutoPlay from './IsStartupAutoPlay'
import IsStartupPushPlayDetailScreen from './IsStartupPushPlayDetailScreen'
import IsAutoHidePlayBar from './IsAutoHidePlayBar'
import IsHomePageScroll from './IsHomePageScroll'
import IsAllowProgressBarSeek from './IsAllowProgressBarSeek'
import IsUseSystemFileSelector from './IsUseSystemFileSelector'
import IsAlwaysKeepStatusbarHeight from './IsAlwaysKeepStatusbarHeight'
import IsShowBackBtn from './IsShowBackBtn'
import IsShowExitBtn from './IsShowExitBtn'
import DrawerLayoutPosition from './DrawerLayoutPosition'
import { useI18n } from '@/lang/i18n'
import SubTitle from '../../components/SubTitle'

export default memo(() => {
  const t = useI18n()


  return (
    <Section title={t('setting_basic')} icon="slider" description={t('setting_section_desc_basic')}>
      <SubTitle title={t('setting_group_startup')}>
        <IsStartupAutoPlay />
        <IsStartupPushPlayDetailScreen />
      </SubTitle>
      <SubTitle title={t('setting_group_navigation')}>
        <IsShowBackBtn />
        <IsShowExitBtn />
        <IsAutoHidePlayBar />
        <IsHomePageScroll />
        <IsAllowProgressBarSeek />
        <IsAlwaysKeepStatusbarHeight />
        <DrawerLayoutPosition />
      </SubTitle>
      <SubTitle title={t('setting_group_appearance')}>
        <Theme />
        <Language />
        <FontSize />
      </SubTitle>
      <SubTitle title={t('setting_group_source')}>
        <ShareType />
        <IsUseSystemFileSelector />
        <SourceName />
      </SubTitle>
    </Section>
  )
})
