import { forwardRef, useImperativeHandle, useMemo, useState } from 'react'

import Basic from './settings/Basic'
import CustomSource from './settings/CustomSource'
import Player from './settings/Player'
import LyricDesktop from './settings/LyricDesktop'
import Search from './settings/Search'
import List from './settings/List'
import Sync from './settings/Sync'
import Backup from './settings/Backup'
import Other from './settings/Other'

export const SETTING_SCREENS = [
  'basic',
  'custom_source',
  'player',
  'lyric_desktop',
  'search',
  'list',
  'sync',
  'backup',
  'other',
] as const

export type SettingScreenIds = typeof SETTING_SCREENS[number]
export const DEFAULT_SETTING_SCREEN: SettingScreenIds = 'basic'
export const normalizeSettingScreenId = (id: string): SettingScreenIds => {
  return SETTING_SCREENS.includes(id as SettingScreenIds) ? id as SettingScreenIds : DEFAULT_SETTING_SCREEN
}

// interface MainProps {
//   onUpdateActiveId: (id: string) => void
// }
export interface MainType {
  setActiveId: (id: SettingScreenIds) => void
}

const Main = forwardRef<MainType, {}>((props, ref) => {
  const [id, setId] = useState<SettingScreenIds>(normalizeSettingScreenId(global.lx.settingActiveId))

  useImperativeHandle(ref, () => ({
    setActiveId(id) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const nextId = normalizeSettingScreenId(id)
          setId(nextId)
          global.lx.settingActiveId = nextId
        })
      })
    },
  }))

  const component = useMemo(() => {
    switch (id) {
      case 'custom_source': return <CustomSource />
      case 'player': return <Player />
      case 'lyric_desktop': return <LyricDesktop />
      case 'search': return <Search />
      case 'list': return <List />
      case 'sync': return <Sync />
      case 'backup': return <Backup />
      case 'other': return <Other />
      case 'basic':
      default: return <Basic />
    }
  }, [id])

  return component
})


export default Main
