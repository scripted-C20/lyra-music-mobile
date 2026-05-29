import versionActions from '@/store/version/action'
import { type InitState } from '@/store/version/state'

const createLocalVersionInfo = (): InitState['versionInfo'] => ({
  version: process.versions.app,
  newVersion: {
    version: process.versions.app,
    desc: '',
    history: [],
  },
  showModal: false,
  isUnknown: false,
  isLatest: true,
  reCheck: false,
  status: 'idle',
})

export const checkUpdate = async() => {
  versionActions.setVisibleModal(false)
  versionActions.setProgress({ total: 0, current: 0 })
  versionActions.setVersionInfo(createLocalVersionInfo())
}

export const downloadUpdate = () => {
  versionActions.setVisibleModal(false)
  versionActions.setProgress({ total: 0, current: 0 })
  versionActions.setVersionInfo(createLocalVersionInfo())
}
