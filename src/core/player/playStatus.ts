import playerActions from '@/store/player/action'
import playerState from '@/store/player/state'


export const setIsPlay = (val: boolean) => {
  if (playerState.isPlay == val) return
  playerActions.setIsPlay(val)
}


export const setStatusText = (val: string) => {
  if (playerState.statusText == val) return
  playerActions.setStatusText(val)
}

const normalizeStatusText = (text: string) => text.replace(/\d+/g, '').replace(/\s+/g, ' ').trim()

type PendingStatusKey =
  | 'player__getting_url'
  | 'player__getting_url_delay_retry'
  | 'player__loading'
  | 'player__refresh_url'
  | 'player__buffering'
  | 'toggle_source_try'
  | 'player__error'

const matchStatusText = (statusText: string, key: PendingStatusKey, params?: Record<string, string | number>) => {
  if (!statusText || !global.i18n) return false
  return normalizeStatusText(statusText) == normalizeStatusText(global.i18n.t(key, params))
}

export const isPlayerLoading = (statusText: string = playerState.statusText) => {
  if (global.lx.gettingUrlId) return true
  return matchStatusText(statusText, 'player__getting_url') ||
    matchStatusText(statusText, 'player__getting_url_delay_retry', { time: 0 }) ||
    matchStatusText(statusText, 'player__loading') ||
    matchStatusText(statusText, 'player__refresh_url') ||
    matchStatusText(statusText, 'player__buffering') ||
    matchStatusText(statusText, 'toggle_source_try')
}

export const canCancelPendingPlayTask = (statusText: string = playerState.statusText) => {
  if (global.lx.gettingUrlId) return true
  return matchStatusText(statusText, 'player__getting_url') ||
    matchStatusText(statusText, 'player__getting_url_delay_retry', { time: 0 }) ||
    matchStatusText(statusText, 'player__loading') ||
    matchStatusText(statusText, 'player__refresh_url') ||
    matchStatusText(statusText, 'player__buffering') ||
    matchStatusText(statusText, 'toggle_source_try') ||
    matchStatusText(statusText, 'player__error')
}
