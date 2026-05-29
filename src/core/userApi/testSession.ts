import BackgroundTimer from 'react-native-background-timer'

import { fetchData } from '@/core/init/userApi/request'
import { getUserApiScript } from '@/utils/data'
import {
  destroySession,
  loadScriptSession,
  onScriptAction,
  sendSessionAction,
  type InitParams,
  type RequestParams,
  type ResponseParams,
} from '@/utils/nativeModules/userApi'

const INIT_TIMEOUT = 20_000
const REQUEST_TIMEOUT = 20_000

export interface TestSessionRuntimeApiHandlers {
  getMusicUrl?: (songInfo: any, quality: LX.Quality) => { promise: Promise<{ url: string, type: LX.Quality }> }
  getLyric?: (songInfo: any) => { promise: Promise<LX.Music.LyricInfo> }
  getPic?: (songInfo: any) => { promise: Promise<string> }
}

export interface UserApiTestRuntime {
  apis: Partial<Record<LX.OnlineSource, TestSessionRuntimeApiHandlers>>
  qualityList: LX.QualityList
}

export interface UserApiTestSession extends UserApiTestRuntime {
  apiInfo: LX.UserApi.UserApiInfo
  destroy: () => Promise<void>
  sessionId: string
}

const createSessionId = (apiId: string) => {
  return `test_${apiId}_${Date.now()}_${Math.random().toString().slice(2, 8)}`
}

const buildRuntimeContext = (
  sessionId: string,
  info: LX.UserApi.UserApiInfo,
): UserApiTestRuntime => {
  const apis: Partial<Record<LX.OnlineSource, TestSessionRuntimeApiHandlers>> = {}
  const qualityList: LX.QualityList = {}

  for (const [source, sourceInfo] of Object.entries(info.sources ?? {})) {
    if (sourceInfo.type !== 'music') continue
    const sourceId = source as LX.OnlineSource
    apis[sourceId] = {}
    qualityList[sourceId] = sourceInfo.qualitys

    for (const action of sourceInfo.actions) {
      switch (action) {
        case 'musicUrl':
          apis[sourceId].getMusicUrl = (songInfo: LX.Music.MusicInfo, type: LX.Quality) => {
            const requestKey = `request__${Math.random().toString().slice(2)}`
            return {
              promise: sendSessionRequest(sessionId, {
                requestKey,
                data: {
                  source: sourceId,
                  action: 'musicUrl',
                  info: {
                    type,
                    musicInfo: songInfo,
                  },
                },
              }).then(result => ({
                type,
                url: result.data.url as string,
              })),
            }
          }
          break
        case 'lyric':
          apis[sourceId].getLyric = (songInfo: LX.Music.MusicInfo) => {
            const requestKey = `request__${Math.random().toString().slice(2)}`
            return {
              promise: sendSessionRequest(sessionId, {
                requestKey,
                data: {
                  source: sourceId,
                  action: 'lyric',
                  info: {
                    musicInfo: songInfo,
                  },
                },
              }).then(result => result.data as LX.Music.LyricInfo),
            }
          }
          break
        case 'pic':
          apis[sourceId].getPic = (songInfo: LX.Music.MusicInfo) => {
            const requestKey = `request__${Math.random().toString().slice(2)}`
            return {
              promise: sendSessionRequest(sessionId, {
                requestKey,
                data: {
                  source: sourceId,
                  action: 'pic',
                  info: {
                    musicInfo: songInfo,
                  },
                },
              }).then(result => result.data as string),
            }
          }
          break
        default:
          break
      }
    }
  }

  return {
    apis,
    qualityList,
  }
}

const activeSessionRequests = new Map<string, Map<string, {
  reject: (error: Error) => void
  resolve: (result: ResponseParams['result']) => void
  timeout: number
}>>()

const sendSessionRequest = async(sessionId: string, data: LX.UserApi.UserApiRequestParams) => {
  return new Promise<ResponseParams['result']>((resolve, reject) => {
    const timeout = BackgroundTimer.setTimeout(() => {
      const sessionRequests = activeSessionRequests.get(sessionId)
      if (!sessionRequests?.has(data.requestKey)) return
      sessionRequests.delete(data.requestKey)
      reject(new Error('request timeout'))
    }, REQUEST_TIMEOUT)

    let sessionRequests = activeSessionRequests.get(sessionId)
    if (!sessionRequests) {
      sessionRequests = new Map()
      activeSessionRequests.set(sessionId, sessionRequests)
    }
    sessionRequests.set(data.requestKey, {
      resolve,
      reject,
      timeout,
    })

    try {
      const sent = sendSessionAction(sessionId, 'request', data)
      // Android ReactMethod calls are asynchronous, so their Java return value is
      // usually exposed to JS as undefined. Only an explicit synchronous false is
      // treated as a send failure; otherwise the request timeout owns failure.
      if (sent !== false) return
      throw new Error('request failed')
    } catch (error: unknown) {
      BackgroundTimer.clearTimeout(timeout)
      sessionRequests.delete(data.requestKey)
      reject(new Error(error instanceof Error ? error.message : 'request failed'))
    }
  })
}

export const createUserApiTestSession = async(apiInfo: LX.UserApi.UserApiInfo): Promise<UserApiTestSession> => {
  const sessionId = createSessionId(apiInfo.id)
  const script = await getUserApiScript(apiInfo.id)
  if (!script) throw new Error('script not found')

  const scriptRequestMap = new Map<string, { abort: () => void }>()
  let unsubscribe = () => {}
  let destroyed = false
  let rejectInit: (error: Error) => void = () => {}
  const initTimeout = BackgroundTimer.setTimeout(() => {
    rejectInit(new Error('init timeout'))
  }, INIT_TIMEOUT)

  const destroy = async() => {
    if (destroyed) return
    destroyed = true
    unsubscribe()
    BackgroundTimer.clearTimeout(initTimeout)

    for (const [requestKey, request] of scriptRequestMap) {
      scriptRequestMap.delete(requestKey)
      request.abort()
    }

    const sessionRequests = activeSessionRequests.get(sessionId)
    if (sessionRequests) {
      activeSessionRequests.delete(sessionId)
      for (const [requestKey, request] of sessionRequests) {
        sessionRequests.delete(requestKey)
        BackgroundTimer.clearTimeout(request.timeout)
        request.reject(new Error('session destroyed'))
      }
    }

    destroySession(sessionId)
  }

  const initPromise = new Promise<UserApiTestRuntime>((resolve, reject) => {
    rejectInit = reject

    const handleScriptRequest = (request: RequestParams) => {
      const nativeRequest = fetchData(request.url, request.options)
      scriptRequestMap.set(request.requestKey, nativeRequest)
      nativeRequest.request.then(response => {
        sendSessionAction(sessionId, 'response', {
          error: null,
          requestKey: request.requestKey,
          response,
        })
      }).catch((error: Error) => {
        sendSessionAction(sessionId, 'response', {
          error: error.message,
          requestKey: request.requestKey,
          response: null,
        })
      }).finally(() => {
        scriptRequestMap.delete(request.requestKey)
      })
    }

    const handleSessionResponse = ({ status, result, requestKey, errorMessage }: ResponseParams) => {
      const sessionRequests = activeSessionRequests.get(sessionId)
      const targetRequest = sessionRequests?.get(requestKey)
      if (!targetRequest) return
      sessionRequests?.delete(requestKey)
      BackgroundTimer.clearTimeout(targetRequest.timeout)
      if (status) targetRequest.resolve(result)
      else targetRequest.reject(new Error(errorMessage ?? 'failed'))
    }

    unsubscribe = onScriptAction((event) => {
      if (event.sessionId !== sessionId) return

      switch (event.action) {
        case 'init': {
          const data = event.data as InitParams
          if ((event as { errorMessage?: string }).errorMessage) {
            data.errorMessage = (event as { errorMessage: string }).errorMessage
          }
          BackgroundTimer.clearTimeout(initTimeout)
          if (!data.status || !data.info) {
            reject(new Error(data.errorMessage ?? 'init failed'))
            return
          }
          resolve(buildRuntimeContext(sessionId, data.info))
          return
        }
        case 'request':
          handleScriptRequest(event.data as RequestParams)
          break
        case 'cancelRequest': {
          const requestKey = event.data as string
          const target = scriptRequestMap.get(requestKey)
          if (!target) return
          scriptRequestMap.delete(requestKey)
          target.abort()
          return
        }
        case 'response':
          handleSessionResponse(event.data as ResponseParams)
          break
        default:
          break
      }
    })

    loadScriptSession(sessionId, {
      ...apiInfo,
      allowShowUpdateAlert: false,
      script,
    })
  })

  try {
    const runtime = await initPromise
    return {
      ...runtime,
      apiInfo,
      destroy,
      sessionId,
    }
  } catch (error) {
    await destroy()
    throw error
  }
}
