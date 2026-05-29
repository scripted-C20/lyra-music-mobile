import { useEffect, useRef } from 'react'

import CurrentTagBtn from './CurrentTagBtn'
import { type Source } from '@/store/songlist/state'
import { useI18n } from '@/lang'

export interface TagProps {
  source: Source
  activeId: string
  name: string
  onTagChange: (name: string, id: string) => void
}

export default ({ source, activeId, name, onTagChange }: TagProps) => {
  const t = useI18n()
  const tagInfoRef = useRef<{ source: Source, activeId: string }>({ source: 'kw', activeId: '' })

  useEffect(() => {
    tagInfoRef.current.source = source
    tagInfoRef.current.activeId = activeId
  }, [activeId, source])

  useEffect(() => {
    const handleChange = (name: string, id: string) => {
      onTagChange(name, id)
      tagInfoRef.current.activeId = id
    }

    global.app_event.on('songlistTagInfoChange', handleChange)
    return () => {
      global.app_event.off('songlistTagInfoChange', handleChange)
    }
  }, [onTagChange])

  const handleShowList = () => {
    global.app_event.showSonglistTagList(tagInfoRef.current.source, tagInfoRef.current.activeId)
  }

  return <CurrentTagBtn name={name || t('songlist_tag_default')} onShowList={handleShowList} />
}
