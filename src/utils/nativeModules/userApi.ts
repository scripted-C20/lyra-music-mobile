import { NativeEventEmitter, NativeModules, type NativeModule } from 'react-native'

interface LoadedUserApiInfo extends LX.UserApi.UserApiInfo {
  script: string
}

interface NativeUserApiModule extends NativeModule {
  loadScript: (data: {
    id: string
    name: string
    description: string
    version: string
    author: string
    homepage: string
    script: string
  }) => void
  loadScriptSession?: (sessionId: string, data: {
    id: string
    name: string
    description: string
    version: string
    author: string
    homepage: string
    script: string
  }) => void
  sendAction: (action: string, info: string) => boolean | undefined
  sendSessionAction?: (sessionId: string, action: string, info: string) => boolean | undefined
  destroy: () => void
  destroySession?: (sessionId: string) => void
  destroyAllSessions?: () => void
}

interface NativeScriptActionEvent {
  sessionId?: string
  action: string
  data?: unknown
  errorMessage?: string
  type?: string
  log?: string
}

export interface InitParams {
  status: boolean
  errorMessage?: string
  info: (LX.UserApi.UserApiInfo & { script?: string }) | null
}

export interface RequestParams {
  requestKey: string
  url: string
  options: {
    timeout?: number
    method?: string
    headers?: Record<string, string>
    form?: Record<string, string>
    formData?: Record<string, unknown>
    body?: unknown
    binary?: boolean
    follow_max?: number
    [key: string]: unknown
  }
}

export interface ResponseParams {
  status: boolean
  requestKey: string
  errorMessage?: string
  result: {
    data: any
    type?: LX.Quality
    [key: string]: unknown
  }
}

export interface UpdateInfoParams {
  name: string
  log: string
  updateUrl?: string
}

export interface ScriptActionEvent {
  sessionId: string
  action: string
  data: any
  errorMessage?: string
  type?: string
  log?: string
}

const { UserApiModule } = NativeModules as {
  UserApiModule: NativeUserApiModule
}

export const MAIN_USER_API_SESSION_ID = '__main__'

const loadScriptInfoMap = new Map<string, LoadedUserApiInfo>()

const normalizeLoadScriptInfo = (info: LoadedUserApiInfo) => ({
  ...info,
  version: info.version ?? '',
  author: info.author ?? '',
  homepage: info.homepage ?? '',
})

const saveLoadScriptInfo = (sessionId: string, info: LoadedUserApiInfo) => {
  loadScriptInfoMap.set(sessionId, normalizeLoadScriptInfo(info))
}

const getLoadScriptInfo = (sessionId: string) => {
  return loadScriptInfoMap.get(sessionId ?? MAIN_USER_API_SESSION_ID) ?? null
}

const buildNativeScriptInfo = (info: LoadedUserApiInfo) => {
  const nextInfo = normalizeLoadScriptInfo(info)
  return {
    id: nextInfo.id,
    name: nextInfo.name,
    description: nextInfo.description,
    version: nextInfo.version,
    author: nextInfo.author,
    homepage: nextInfo.homepage,
    script: nextInfo.script,
  }
}

const parseEventData = (data: unknown) => {
  if (typeof data !== 'string') return data
  try {
    return JSON.parse(data) as unknown
  } catch {
    return data
  }
}

export const loadScript = (info: LoadedUserApiInfo) => {
  saveLoadScriptInfo(MAIN_USER_API_SESSION_ID, info)
  UserApiModule.loadScript(buildNativeScriptInfo(info))
}

export const loadScriptSession = (sessionId: string, info: LoadedUserApiInfo) => {
  if (!sessionId) throw new Error('sessionId is required')
  if (!UserApiModule.loadScriptSession) throw new Error('loadScriptSession is not supported on this platform')
  saveLoadScriptInfo(sessionId, info)
  UserApiModule.loadScriptSession(sessionId, buildNativeScriptInfo(info))
}

export const sendAction = (action: string, data: unknown) => {
  return UserApiModule.sendAction(action, JSON.stringify(data))
}

export const sendSessionAction = (sessionId: string, action: string, data: unknown) => {
  if (!sessionId) throw new Error('sessionId is required')
  if (!UserApiModule.sendSessionAction) throw new Error('sendSessionAction is not supported on this platform')
  return UserApiModule.sendSessionAction(sessionId, action, JSON.stringify(data))
}

export const isUserApiSessionTestSupported = () => {
  return !!UserApiModule.loadScriptSession &&
    !!UserApiModule.sendSessionAction &&
    !!UserApiModule.destroySession
}

export const onScriptAction = (handler: (event: ScriptActionEvent) => void) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const eventEmitter = new NativeEventEmitter(UserApiModule)
  const eventListener = eventEmitter.addListener('api-action', (event: NativeScriptActionEvent) => {
    const sessionId = event.sessionId ?? MAIN_USER_API_SESSION_ID
    const data = parseEventData(event.data)
    const nextEvent: ScriptActionEvent = {
      ...event,
      sessionId,
      data,
    }

    if (nextEvent.action === 'init') {
      const loadScriptInfo = getLoadScriptInfo(sessionId)
      if (loadScriptInfo) {
        if (nextEvent.data?.info) {
          nextEvent.data.info = {
            ...loadScriptInfo,
            ...nextEvent.data.info,
          }
        } else if (nextEvent.data && typeof nextEvent.data == 'object') {
          nextEvent.data.info = { ...loadScriptInfo }
        }
      }
    } else if (nextEvent.action === 'showUpdateAlert') {
      return
    }

    handler(nextEvent)
  })

  return () => {
    eventListener.remove()
  }
}

export const destroy = () => {
  loadScriptInfoMap.delete(MAIN_USER_API_SESSION_ID)
  UserApiModule.destroy()
}

export const destroySession = (sessionId: string) => {
  if (!sessionId) return
  loadScriptInfoMap.delete(sessionId)
  UserApiModule.destroySession?.(sessionId)
}

export const destroyAllSessions = () => {
  for (const sessionId of loadScriptInfoMap.keys()) {
    if (sessionId === MAIN_USER_API_SESSION_ID) continue
    loadScriptInfoMap.delete(sessionId)
  }
  UserApiModule.destroyAllSessions?.()
}
