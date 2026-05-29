const sourceDefs = [
  { id: 'kw', name: '酷我音乐' },
  { id: 'kg', name: '酷狗音乐' },
  { id: 'tx', name: 'QQ音乐' },
  { id: 'wy', name: '网易音乐' },
  { id: 'mg', name: '咪咕音乐' },
] as const

const sources: Array<{
  id: string
  name: string
  disabled: boolean
  supportQualitys: Partial<Record<LX.OnlineSource, LX.Quality[]>>
}> = sourceDefs.map(source => ({
  ...source,
  disabled: false,
  supportQualitys: {},
}))

export default sources
