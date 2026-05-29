import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'

import Section from '../../components/Section'
import SubTitle from '../../components/SubTitle'
import ConfirmAlert, { type ConfirmAlertType } from '@/components/common/ConfirmAlert'
import Text from '@/components/common/Text'
import Input from '@/components/common/Input'
import CheckBox from '@/components/common/CheckBox'
import { Icon } from '@/components/common/Icon'
import { useDS } from '@/theme/useDS'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import settingState from '@/store/setting/state'
import { state as userApiState, useStatus, useUserApiList } from '@/store/userApi'
import { getUserApiScript } from '@/utils/data'
import { httpFetch } from '@/utils/request'
import { confirmDialog, tipDialog, toast } from '@/utils/tools'
import { importUserApi, removeUserApi } from '@/core/userApi'
import { setApiSource } from '@/core/apiSource'
import { createUserApiTestSession, type TestSessionRuntimeApiHandlers } from '@/core/userApi/testSession'
import musicSdk from '@/utils/musicSdk'
import { isUserApiSessionTestSupported } from '@/utils/nativeModules/userApi'
import ScriptImportExport, { type ScriptImportExportType } from '../Basic/UserApiEditModal/ScriptImportExport'

type SegmentId = 'local' | 'subscribe'
type TestMode = 'full'
type TestAction = 'musicUrl' | 'lyric' | 'pic'
interface TestState {
  mode?: TestMode
  status: 'idle' | 'loading' | 'success' | 'error'
  message: string
  detail?: string
}
interface SubscribePreviewItem {
  name: string
  description: string
  author: string
  version: string
  homepage: string
  script: string
  scriptOrigin: string
  scriptLabel: string
  selected: boolean
}
interface SubscribeGroup {
  key: string
  name: string
  url: string
  apis: LX.UserApi.UserApiInfo[]
}
interface PreparedSubscribeImportItem {
  item: SubscribePreviewItem
  script: string
  mergeKey: string
  identityKey: string
  scriptKey: string
}
interface RuntimeTestTask {
  source: LX.OnlineSource
  action: TestAction
  samples: any[]
}
interface RuntimeTestResult {
  source: LX.OnlineSource
  action: TestAction
  status: 'success' | 'error'
  message: string
  duration?: number
  quality?: LX.Quality
  verifyDuration?: number
}
type RuntimeApiHandlers = TestSessionRuntimeApiHandlers
type RuntimeTestSamples = Partial<Record<LX.OnlineSource, any[]>>
type RuntimeTestSession = Awaited<ReturnType<typeof createUserApiTestSession>>

const MAX_USER_API_COUNT = 20
const TEST_WORKER_POOL_SIZE = 5
const TEST_SOURCE_CONCURRENCY = 2
const SUBSCRIBE_IMPORT_CONCURRENCY = 3
const TEST_SEARCH_RESULT_LIMIT = 12
const MAX_TEST_SAMPLES_PER_SOURCE = 3
const TEST_SAMPLE_SEARCH_TIMEOUT = 6_000
const TEST_SAMPLE_SOURCE_TIMEOUT = 18_000
const TEST_SESSION_INIT_TIMEOUT = 25_000
const PLAYABLE_VERIFY_TIMEOUT = 8_000
const TEST_SEARCH_KEYWORDS = [
  '稻香 周杰伦',
  '晴天 周杰伦',
  '七里香 周杰伦',
  '起风了 买辣椒也用券',
  '后来 刘若英',
  '孤勇者 陈奕迅',
  '光年之外 邓紫棋',
  '小幸运 田馥甄',
]
const TEST_QUALITY_ORDER: LX.Quality[] = ['128k', '192k', '320k', 'flac', 'flac24bit', 'ape', 'wav']
const TEST_SOURCE_INFO = (musicSdk.sources as Array<{ id: LX.OnlineSource, name: string }>).filter(source => !!musicSdk[source.id]?.musicSearch)
const TEST_SOURCE_ORDER = TEST_SOURCE_INFO.map(source => source.id)
const TEST_SOURCE_NAME_MAP = Object.fromEntries(TEST_SOURCE_INFO.map(source => [source.id, source.name])) as Partial<Record<LX.OnlineSource, string>>
const SUBSCRIBE_PAYLOAD_LIST_KEYS = ['data', 'list', 'sources', 'items', 'result'] as const

const runConcurrentQueue = async<T, R>(
  tasks: T[],
  concurrency: number,
  handler: (task: T, taskIndex: number) => Promise<R>,
  shouldContinue?: () => boolean,
) => {
  const results: R[] = []
  let currentIndex = 0

  const runWorker = async() => {
    while (currentIndex < tasks.length) {
      if (shouldContinue && !shouldContinue()) return
      const taskIndex = currentIndex++
      const task = tasks[taskIndex]
      if (task == null) return
      results[taskIndex] = await handler(task, taskIndex)
    }
  }

  await Promise.all(Array.from({
    length: Math.max(1, Math.min(concurrency, tasks.length)),
  }, async() => {
    await runWorker()
  }))

  return results
}

class TestCancelledError extends Error {
  constructor() {
    super('test cancelled')
  }
}

const createTestController = () => ({
  cancelled: false,
  abortControllers: new Set<AbortController>(),
  sessions: new Set<RuntimeTestSession>(),
  cancelListeners: new Set<() => void>(),
  cancel() {
    if (this.cancelled) return
    this.cancelled = true
    for (const abortController of this.abortControllers) abortController.abort()
    this.abortControllers.clear()
    for (const session of this.sessions) void session.destroy()
    this.sessions.clear()
    for (const listener of this.cancelListeners) listener()
    this.cancelListeners.clear()
  },
  addAbortController(abortController: AbortController) {
    if (this.cancelled) {
      abortController.abort()
      throw new TestCancelledError()
    }
    this.abortControllers.add(abortController)
  },
  removeAbortController(abortController: AbortController) {
    this.abortControllers.delete(abortController)
  },
  addSession(session: RuntimeTestSession) {
    if (this.cancelled) {
      void session.destroy()
      throw new TestCancelledError()
    }
    this.sessions.add(session)
  },
  removeSession(session: RuntimeTestSession) {
    this.sessions.delete(session)
  },
  onCancel(listener: () => void) {
    if (this.cancelled) {
      listener()
      return () => {}
    }
    this.cancelListeners.add(listener)
    return () => {
      this.cancelListeners.delete(listener)
    }
  },
  throwIfCancelled() {
    if (this.cancelled) throw new TestCancelledError()
  },
})

type TestController = ReturnType<typeof createTestController>

const isTestCancelledError = (error: unknown) => error instanceof TestCancelledError ||
  (error instanceof Error && (error.message === 'test cancelled' || error.message === 'session destroyed'))

const withTestTimeout = async<T,>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string,
  controller?: TestController,
) => {
  controller?.throwIfCancelled()
  let timer: ReturnType<typeof setTimeout> | null = null
  let removeCancelListener = () => {}

  const guardPromise = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      reject(new Error(timeoutMessage))
    }, timeoutMs)
    removeCancelListener = controller?.onCancel(() => {
      reject(new TestCancelledError())
    }) ?? removeCancelListener
  })

  try {
    return await Promise.race([promise, guardPromise])
  } finally {
    if (timer) clearTimeout(timer)
    removeCancelListener()
    controller?.throwIfCancelled()
  }
}

const markTestCancelled = (
  apiIds: string[],
  mode: TestMode,
  updateTestState: (id: string, nextState: TestState) => void,
  t: ReturnType<typeof useI18n>,
) => {
  for (const id of apiIds) {
    updateTestState(id, {
      mode,
      status: 'idle',
      message: t('setting_custom_source_test_cancelled'),
    })
  }
}

const createManagedTestSession = async(
  api: LX.UserApi.UserApiInfo,
  controller: TestController,
) => {
  controller.throwIfCancelled()
  let session: RuntimeTestSession | null = null
  let shouldDestroy = false
  const destroySession = async() => {
    if (!session) return
    const targetSession: RuntimeTestSession = session
    await targetSession.destroy()
  }
  const sessionPromise = createUserApiTestSession(api).then((nextSession) => {
    session = nextSession
    if (shouldDestroy || controller.cancelled) {
      void nextSession.destroy()
      throw new TestCancelledError()
    }
    return nextSession
  })
  const removeCancelListener = controller.onCancel(() => {
    shouldDestroy = true
    void destroySession()
  })

  try {
    return await withTestTimeout(
      sessionPromise,
      TEST_SESSION_INIT_TIMEOUT,
      'init timeout',
      controller,
    )
  } catch (error) {
    shouldDestroy = true
    await destroySession()
    throw error
  } finally {
    removeCancelListener()
  }
}

const defaultPlayableVerifyHeaders = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Pixel 3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.79 Mobile Safari/537.36',
}

const verifyPlayableUrl = async(url: string, controller: TestController) => {
  const runProbe = async(method: 'HEAD' | 'GET') => {
    controller.throwIfCancelled()
    const startedAt = Date.now()
    const abortController = new AbortController()
    controller.addAbortController(abortController)
    const timeout = setTimeout(() => {
      abortController.abort()
    }, PLAYABLE_VERIFY_TIMEOUT)

    try {
      const response = await global.fetch(url, {
        method,
        headers: method === 'GET'
          ? { ...defaultPlayableVerifyHeaders, Range: 'bytes=0-2047' }
          : defaultPlayableVerifyHeaders,
        signal: abortController.signal,
      })
      controller.throwIfCancelled()
      const statusCode = response.status
      if (statusCode >= 200 && statusCode < 400) {
        const contentType = response.headers?.get?.('content-type') ?? ''
        if (/text\/html|application\/json/i.test(contentType)) {
          throw new Error(`invalid content-type ${contentType}`)
        }
        return Date.now() - startedAt
      }
      throw new Error(`HTTP ${statusCode}`)
    } finally {
      clearTimeout(timeout)
      controller.removeAbortController(abortController)
      if (method === 'GET') abortController.abort()
    }
  }

  try {
    return await runProbe('HEAD')
  } catch (error) {
    if (isTestCancelledError(error)) throw error
    return runProbe('GET')
  }
}

const formatVersionName = (version: string) => {
  return /^\d/.test(version) ? `v${version}` : version
}

const getSourceDisplayName = (source: LX.OnlineSource) => {
  return TEST_SOURCE_NAME_MAP[source] ?? source
}

const isSameApiIdentity = (left: LX.UserApi.UserApiInfo, right: LX.UserApi.UserApiInfo) => {
  return left.name === right.name &&
    left.version === right.version &&
    left.author === right.author &&
    left.homepage === right.homepage
}

const getApiOrigin = (api: LX.UserApi.UserApiInfo): LX.UserApi.UserApiOriginInfo => {
  if (api.origin?.type === 'subscribe' && (api.origin.subscribeName || api.origin.subscribeUrl)) {
    return api.origin
  }
  return { type: 'local' }
}

const getSubscribeFallbackName = (subscribeUrl: string) => {
  if (!subscribeUrl) return 'Subscription'
  try {
    const hostname = new URL(subscribeUrl).hostname.replace(/^www\./, '')
    return hostname || 'Subscription'
  } catch {
    return 'Subscription'
  }
}

const getSubscribeGroupName = (origin: LX.UserApi.UserApiOriginInfo) => {
  if (origin.type !== 'subscribe') return 'Subscription'
  return origin.subscribeName?.trim() || getSubscribeFallbackName(origin.subscribeUrl)
}

const getSubscribeGroupKey = (origin: LX.UserApi.UserApiOriginInfo) => {
  if (origin.type !== 'subscribe') return 'local'
  return origin.subscribeUrl ? `subscribe:${origin.subscribeUrl}` : `subscribe_name:${getSubscribeGroupName(origin)}`
}

const normalizeCompareText = (value?: string | null) => {
  return typeof value == 'string' ? value.trim() : ''
}

const buildApiMergeKey = (name: string, author: string, homepage: string) => {
  return [
    normalizeCompareText(name),
    normalizeCompareText(author),
    normalizeCompareText(homepage),
  ].join('__')
}

const getApiMergeKey = (api: Pick<LX.UserApi.UserApiInfo, 'name' | 'author' | 'homepage'>) => {
  return buildApiMergeKey(api.name, api.author, api.homepage)
}

const getSubscribePreviewMergeKey = (item: Pick<SubscribePreviewItem, 'name' | 'author' | 'homepage'>) => {
  return buildApiMergeKey(item.name, item.author, item.homepage)
}

const normalizeScriptCompareText = (script: string) => {
  return script.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim()
}

const buildScriptIdentityKey = (script: string) => {
  return normalizeScriptCompareText(script)
}

const buildSubscribeIdentityKey = (mergeKey: string, script: string) => {
  return `${mergeKey}__${buildScriptIdentityKey(script)}`
}

const getSubscribePreviewIdentityKey = (item: SubscribePreviewItem) => {
  return buildSubscribeIdentityKey(getSubscribePreviewMergeKey(item), item.script)
}

const dedupeSubscribePreviewItems = (items: SubscribePreviewItem[]) => {
  const identityKeySet = new Set<string>()
  const list: SubscribePreviewItem[] = []

  for (const item of items) {
    const identityKey = getSubscribePreviewIdentityKey(item)
    if (identityKeySet.has(identityKey)) continue
    identityKeySet.add(identityKey)
    list.push(item)
  }

  return list
}

const isDuplicateImportError = (error: unknown) => {
  const message = String((error as Error | undefined)?.message ?? '')
  return /duplicate|same as|相同|已有|既有/i.test(message)
}

const isSameSubscribeOrigin = (api: LX.UserApi.UserApiInfo, subscribeUrl: string) => {
  const origin = getApiOrigin(api)
  return origin.type === 'subscribe' &&
    normalizeCompareText(origin.subscribeUrl) === normalizeCompareText(subscribeUrl)
}

const parseSubscribeJsonString = (body: string) => {
  const text = body.replace(/^\uFEFF/, '').trim()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

const unwrapSubscribePayload = (payload: unknown, depth = 0): unknown[] | null => {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== 'object' || depth > 3) return null

  const record = payload as Record<string, unknown>
  for (const key of SUBSCRIBE_PAYLOAD_LIST_KEYS) {
    const value = record[key]
    if (Array.isArray(value)) return value
    if (typeof value === 'string') {
      const parsed = parseSubscribeJsonString(value)
      const list = unwrapSubscribePayload(parsed, depth + 1)
      if (list) return list
      continue
    }
    const list = unwrapSubscribePayload(value, depth + 1)
    if (list) return list
  }

  return null
}

const parseSubscribePayload = (body: unknown, t: ReturnType<typeof useI18n>) => {
  let payload = body
  if (typeof payload === 'string') {
    payload = parseSubscribeJsonString(payload)
    if (payload == null) throw new Error(t('setting_custom_source_subscribe_invalid_json'))
  }

  const list = unwrapSubscribePayload(payload)
  if (list) return list
  throw new Error(t('setting_custom_source_subscribe_invalid_format'))
}

const pickSubscribeTextField = (record: Record<string, unknown> | null | undefined, keys: string[]) => {
  if (!record) return ''
  for (const key of keys) {
    const value = record[key]
    if (typeof value !== 'string') continue
    const text = value.trim()
    if (text) return text
  }
  return ''
}

const getSubscribePreviewName = (script: string, fallbackName: string, index: number) => {
  if (fallbackName) return fallbackName
  if (/^https?:\/\//i.test(script)) {
    try {
      const url = new URL(script)
      const fileName = url.pathname.split('/').filter(Boolean).pop()?.replace(/\.(js|mjs|cjs|json)$/i, '')
      if (fileName) return decodeURIComponent(fileName)
      const hostname = url.hostname.replace(/^www\./, '')
      if (hostname) return hostname
    } catch {}
  }
  return `Source ${index + 1}`
}

const getSubscribeScriptMeta = (script: string) => {
  if (!/^https?:\/\//i.test(script)) {
    return {
      origin: 'Inline',
      label: 'inline script',
    }
  }

  try {
    const url = new URL(script)
    const origin = url.hostname.replace(/^www\./, '') || url.host
    const fileName = decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() ?? '')
    const label = fileName && fileName !== origin ? `${origin} / ${fileName}` : origin
    return {
      origin,
      label: label.length > 96 ? `${label.slice(0, 93)}...` : label,
    }
  } catch {
    return {
      origin: 'Remote',
      label: script.length > 96 ? `${script.slice(0, 93)}...` : script,
    }
  }
}

const normalizeSubscribePreview = (body: unknown, t: ReturnType<typeof useI18n>) => {
  return parseSubscribePayload(body, t)
    .map((item, index): SubscribePreviewItem | null => {
      if (typeof item === 'string') {
        const script = item.trim()
        if (!script) return null
        const scriptMeta = getSubscribeScriptMeta(script)
        return {
          name: getSubscribePreviewName(script, '', index),
          description: '',
          author: '',
          version: '',
          homepage: '',
          script,
          scriptOrigin: scriptMeta.origin,
          scriptLabel: scriptMeta.label,
          selected: true,
        }
      }
      if (!item || typeof item !== 'object') return null

      const record = item as Record<string, unknown>
      const meta = record.meta && typeof record.meta === 'object'
        ? record.meta as Record<string, unknown>
        : null
      const script = pickSubscribeTextField(record, ['script', 'url', 'src', 'js', 'code', 'scriptUrl', 'script_url']) ||
        pickSubscribeTextField(meta, ['script', 'url', 'src', 'js', 'code', 'scriptUrl', 'script_url'])
      if (!script) return null

      const fallbackName = pickSubscribeTextField(record, ['name', 'title', 'alias']) ||
        pickSubscribeTextField(meta, ['name', 'title', 'alias'])
      const scriptMeta = getSubscribeScriptMeta(script)

      return {
        name: getSubscribePreviewName(script, fallbackName, index),
        description: pickSubscribeTextField(record, ['description', 'desc', 'remark']) ||
          pickSubscribeTextField(meta, ['description', 'desc', 'remark']),
        author: pickSubscribeTextField(record, ['author', 'owner', 'creator']) ||
          pickSubscribeTextField(meta, ['author', 'owner', 'creator']),
        version: pickSubscribeTextField(record, ['version', 'ver']) ||
          pickSubscribeTextField(meta, ['version', 'ver']),
        homepage: pickSubscribeTextField(record, ['homepage', 'home', 'website']) ||
          pickSubscribeTextField(meta, ['homepage', 'home', 'website']),
        script,
        scriptOrigin: scriptMeta.origin,
        scriptLabel: scriptMeta.label,
        selected: true,
      }
    })
    .filter((item): item is SubscribePreviewItem => !!item)
}

const fetchSubscribeSources = async(subscribeUrl: string, t: ReturnType<typeof useI18n>) => {
  const resp = await httpFetch(subscribeUrl, { follow_max: 3 }).promise
  return normalizeSubscribePreview(resp.body, t)
}

const fetchSubscribeScript = async(script: string) => {
  if (!/^https?:\/\//i.test(script)) return script
  const resp = await httpFetch(script, { follow_max: 3 }).promise
  return resp.body
}

const getTestSampleKey = (musicInfo: any) => {
  return [
    musicInfo?.source ?? '',
    musicInfo?.songmid ?? '',
    musicInfo?.hash ?? '',
    musicInfo?.interval ?? '',
  ].join('__')
}

const hasTestSampleIdentity = (musicInfo: any) => {
  const qualityTypes = musicInfo?._types as Record<string, unknown> | null | undefined
  const hasQualityTypes = qualityTypes != null && Object.keys(qualityTypes).length > 0
  const hasIdentity = musicInfo?.songmid != null || musicInfo?.hash != null || musicInfo?.id != null
  return !!musicInfo?.name && (hasQualityTypes || hasIdentity)
}

const selectTestMusics = (result: any) => {
  if (!Array.isArray(result?.list)) return []
  return (result.list as Array<{ name?: string, songmid?: string | number, hash?: string, id?: string | number, _types?: Record<string, unknown> }>).filter(hasTestSampleIdentity)
}

const pickTestQuality = (qualityList: LX.Quality[] | undefined, musicInfo: any): LX.Quality | null => {
  if (!qualityList?.length || !musicInfo?._types) return null
  const availableQualityList = qualityList.filter(type => !!musicInfo._types?.[type])
  if (!availableQualityList.length) return null
  for (const quality of TEST_QUALITY_ORDER) {
    if (availableQualityList.includes(quality)) return quality
  }
  return availableQualityList[0] ?? null
}

const getResultUrl = (result: any): string => {
  if (typeof result === 'string') return result
  if (typeof result?.url === 'string') return result.url
  if (typeof result?.data === 'string') return result.data
  if (typeof result?.data?.url === 'string') return result.data.url
  return ''
}

const isValidRequestResult = (action: TestAction, result: any) => {
  switch (action) {
    case 'musicUrl': {
      const url = getResultUrl(result)
      return /^https?:/i.test(url)
    }
    case 'lyric': {
      const lyric = typeof result?.lyric === 'string'
        ? result.lyric
        : typeof result?.data?.lyric === 'string'
          ? result.data.lyric
          : typeof result?.data === 'string'
            ? result.data
            : ''
      return !!lyric.trim()
    }
    case 'pic': {
      const pic = getResultUrl(result)
      return !!pic.trim()
    }
    default:
      return false
  }
}

const getRuntimeStatusLabel = (
  status: LX.UserApi.UserApiStatus,
  t: ReturnType<typeof useI18n>,
) => {
  if (status.status) return t('setting_basic_source_status_success')
  if (status.message === 'initing') return t('setting_basic_source_status_initing')
  return status.message ?? t('setting_basic_source_status_failed')
}

const getTestActionLabel = (action: TestAction, t: ReturnType<typeof useI18n>) => {
  switch (action) {
    case 'musicUrl':
      return t('setting_custom_source_test_action_music_url')
    case 'lyric':
      return t('setting_custom_source_test_action_lyric')
    case 'pic':
      return t('setting_custom_source_test_action_pic')
    default:
      return action
  }
}

const formatDuration = (duration?: number) => {
  if (duration == null) return ''
  const seconds = Math.max(0, duration) / 1000
  return `${seconds >= 10 ? seconds.toFixed(1) : seconds.toFixed(2)}s`
    .replace(/\.0s$/, 's')
    .replace(/(\.\d*[1-9])0s$/, '$1s')
}

const getTestModeLabel = (mode: TestMode, t: ReturnType<typeof useI18n>) => {
  return t('setting_custom_source_test_mode_full')
}

const formatRuntimeTestResultLabel = (result: RuntimeTestResult, t: ReturnType<typeof useI18n>) => {
  const baseLabel = `${getSourceDisplayName(result.source)} / ${getTestActionLabel(result.action, t)}`
  if (result.status === 'success') {
    const meta = [
      result.quality,
      result.verifyDuration != null ? t('setting_custom_source_test_verified', { time: formatDuration(result.verifyDuration) }) : '',
    ].filter(Boolean).join(' · ')
    return meta ? `${baseLabel} (${meta})` : baseLabel
  }
  return result.message ? `${baseLabel} (${result.message})` : baseLabel
}

const SegmentButton = ({
  active,
  count,
  label,
  onPress,
}: {
  active: boolean
  count?: number
  label: string
  onPress: () => void
}) => {
  const ds = useDS()

  return (
    <TouchableOpacity
      activeOpacity={0.72}
      onPress={onPress}
      style={[
        styles.segmentButton,
        {
          backgroundColor: active ? ds.accent : ds.bgFloat,
          borderColor: active ? ds.accent : ds.separator,
        },
      ]}
    >
      <Text size={11} color={active ? ds.textOnAccent : ds.text} style={styles.segmentButtonText} numberOfLines={1}>
        {label}
      </Text>
      {typeof count === 'number' ? (
        <View style={[
          styles.segmentCount,
          { backgroundColor: active ? 'rgba(255,255,255,0.18)' : ds.accentSoft },
        ]}>
          <Text size={9} color={active ? ds.textOnAccent : ds.accent} style={styles.segmentCountText} numberOfLines={1}>
            {count}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  )
}

const MiniActionButton = ({
  label,
  onPress,
  disabled = false,
  tone = 'default',
}: {
  label: string
  onPress: () => void
  disabled?: boolean
  tone?: 'default' | 'danger' | 'primary'
}) => {
  const ds = useDS()
  const style = useMemo(() => {
    switch (tone) {
      case 'danger':
        return {
          backgroundColor: ds.isDark ? 'rgba(255,82,82,0.16)' : '#FFF1F1',
          borderColor: ds.isDark ? 'rgba(255,82,82,0.26)' : '#FFD4D4',
          color: ds.red,
        }
      case 'primary':
        return {
          backgroundColor: ds.accentSoft,
          borderColor: ds.accentSoft,
          color: ds.accent,
        }
      case 'default':
      default:
        return {
          backgroundColor: ds.bgFloat,
          borderColor: ds.separator,
          color: ds.textMuted,
        }
    }
  }, [ds, tone])

  return (
    <TouchableOpacity
      activeOpacity={0.72}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.actionButton,
        {
          opacity: disabled ? 0.45 : 1,
          backgroundColor: style.backgroundColor,
          borderColor: style.borderColor,
        },
      ]}
    >
      <Text size={11} color={style.color} style={styles.actionButtonText}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

const InlinePrimaryButton = ({
  disabled = false,
  label,
  onPress,
}: {
  disabled?: boolean
  label: string
  onPress: () => void
}) => {
  const ds = useDS()

  return (
    <TouchableOpacity
      activeOpacity={0.72}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.inlinePrimaryButton,
        {
          opacity: disabled ? 0.45 : 1,
          backgroundColor: ds.accentSoft,
          borderColor: ds.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
        },
      ]}
    >
      <Text size={11} color={ds.accent} style={styles.inlinePrimaryButtonText} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

const StatusPill = ({
  compact = false,
  label,
  tone,
}: {
  compact?: boolean
  label: string
  tone: 'neutral' | 'success' | 'error' | 'loading'
}) => {
  const ds = useDS()
  const style = useMemo(() => {
    switch (tone) {
      case 'success':
        return {
          backgroundColor: ds.isDark ? 'rgba(52,199,89,0.16)' : '#EEF9F1',
          borderColor: ds.isDark ? 'rgba(52,199,89,0.24)' : '#D2F0DB',
          color: ds.green,
        }
      case 'error':
        return {
          backgroundColor: ds.isDark ? 'rgba(255,82,82,0.16)' : '#FFF1F1',
          borderColor: ds.isDark ? 'rgba(255,82,82,0.24)' : '#FFD4D4',
          color: ds.red,
        }
      case 'loading':
        return {
          backgroundColor: ds.accentSoft,
          borderColor: ds.accentSoft,
          color: ds.accent,
        }
      case 'neutral':
      default:
        return {
          backgroundColor: ds.bgFloat,
          borderColor: ds.separator,
          color: ds.textMuted,
        }
    }
  }, [ds, tone])

  return (
    <View style={[
      styles.statusPill,
      compact ? styles.statusPillCompact : null,
      { backgroundColor: style.backgroundColor, borderColor: style.borderColor },
    ]}>
      <Text size={compact ? 9 : 10} color={style.color} style={styles.statusPillText} numberOfLines={1}>{label}</Text>
    </View>
  )
}

const MetaChip = ({
  icon,
  label,
}: {
  icon: string
  label: string
}) => {
  const ds = useDS()

  return (
    <View style={[styles.metaChip, { backgroundColor: ds.isDark ? 'rgba(255,255,255,0.06)' : '#F5F6F8' }]}>
      <Icon family="ionicons" name={icon} size={10} color={ds.textDim} />
      <Text size={10} color={ds.textMuted} numberOfLines={1}>{label}</Text>
    </View>
  )
}

const EmptyState = ({
  icon,
  label,
}: {
  icon: string
  label: string
}) => {
  const ds = useDS()

  return (
    <View style={[styles.emptyBlock, { backgroundColor: ds.bgFloat, borderColor: ds.separator }]}>
      <View style={[styles.emptyIcon, { backgroundColor: ds.accentSoft }]}>
        <Icon family="ionicons" name={icon} size={16} color={ds.accent} />
      </View>
      <Text size={12} color={ds.textDim} style={styles.emptyText}>{label}</Text>
    </View>
  )
}

const SubscribeGroupHeader = ({
  group,
  showRefresh = false,
  disabled = false,
  onRefresh,
}: {
  group: SubscribeGroup
  showRefresh?: boolean
  disabled?: boolean
  onRefresh?: (group: SubscribeGroup) => void
}) => {
  const ds = useDS()
  const t = useI18n()

  return (
    <View style={styles.groupHeader}>
      <View style={[styles.groupIcon, { backgroundColor: ds.accentSoft }]}>
        <Icon family="ionicons" name="albums-outline" size={14} color={ds.accent} />
      </View>
      <View style={styles.groupMain}>
        <View style={styles.groupTitleRow}>
          <Text size={13} color={ds.text} style={styles.groupTitle} numberOfLines={1}>
            {group.name}
          </Text>
          <StatusPill
            label={t('setting_custom_source_test_scope_count', { count: group.apis.length })}
            tone="neutral"
          />
        </View>
        <Text size={10} color={ds.textDim} numberOfLines={1}>{group.url}</Text>
      </View>
      {showRefresh ? (
        <MiniActionButton
          label={t('setting_custom_source_subscribe_resubscribe')}
          onPress={() => { onRefresh?.(group) }}
          disabled={disabled}
        />
      ) : null}
    </View>
  )
}

const SourceActionToolbar = ({
  totalCount,
  selectedCount,
  disabled,
  testing,
  onToggleAll,
  onDeleteSelected,
  onTestAll,
}: {
  totalCount: number
  selectedCount: number
  disabled?: boolean
  testing?: boolean
  onToggleAll: () => void
  onDeleteSelected: () => void
  onTestAll: () => void
}) => {
  const ds = useDS()
  const t = useI18n()
  const isAllSelected = totalCount > 0 && selectedCount === totalCount

  return (
    <View style={[styles.selectionToolbar, { backgroundColor: ds.bgFloat, borderColor: ds.separator }]}>
      <Text size={11} color={ds.textMuted} style={styles.selectionToolbarText}>
        {t('setting_custom_source_action_selected_count', { selected: selectedCount, total: totalCount })}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.selectionToolbarScroll}
        contentContainerStyle={styles.selectionToolbarActions}
      >
        <MiniActionButton
          label={testing ? t('setting_custom_source_test_stop') : t('setting_custom_source_action_test_all')}
          onPress={onTestAll}
          disabled={Boolean(disabled && !testing) || !totalCount}
          tone={testing ? 'danger' : 'primary'}
        />
        <MiniActionButton
          label={isAllSelected ? t('setting_custom_source_action_clear_selected') : t('setting_custom_source_action_select_all')}
          onPress={onToggleAll}
          disabled={Boolean(disabled) || !totalCount}
        />
        <MiniActionButton
          label={t('setting_custom_source_action_remove_selected')}
          onPress={onDeleteSelected}
          disabled={Boolean(disabled) || !selectedCount}
          tone="danger"
        />
      </ScrollView>
    </View>
  )
}

const SourceOverviewCard = ({
  activeName,
  overviewStatusLabel,
  overviewTone,
}: {
  activeName: string
  overviewStatusLabel: string
  overviewTone: 'neutral' | 'success' | 'error' | 'loading'
}) => {
  const ds = useDS()
  const t = useI18n()

  return (
    <View style={[
      styles.summaryCard,
      {
        backgroundColor: ds.isDark ? 'rgba(255,255,255,0.06)' : '#FAFBFC',
        borderColor: ds.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.06)',
        shadowColor: ds.shadowColor,
      },
    ]}>
      <View style={styles.summaryTop}>
        <View style={[styles.summaryBadge, { backgroundColor: ds.accentSoft }]}>
          <Icon family="ionicons" name="pulse-outline" size={13} color={ds.accent} />
        </View>
        <View style={styles.summaryMain}>
          <Text size={10} color={ds.textDim} style={styles.summaryTitle} numberOfLines={1}>
            {t('setting_custom_source_overview')}
          </Text>
          <Text size={13} color={ds.text} style={styles.summaryActiveName} numberOfLines={1}>
            {activeName}
          </Text>
        </View>
        <StatusPill label={overviewStatusLabel} tone={overviewTone} />
      </View>
    </View>
  )
}

const ApiCard = ({
  api,
  activeId,
  runtimeStatusLabel,
  selected = false,
  selectable = false,
  busy = false,
  testing = false,
  testDisabled = false,
  testState,
  onSelectChange,
  onUse,
  onRemove,
  onTest,
}: {
  api: LX.UserApi.UserApiInfo
  activeId: string
  runtimeStatusLabel: string
  selected?: boolean
  selectable?: boolean
  busy?: boolean
  testing?: boolean
  testDisabled?: boolean
  testState?: TestState
  onSelectChange?: (api: LX.UserApi.UserApiInfo, selected: boolean) => void
  onUse: (api: LX.UserApi.UserApiInfo) => void
  onRemove: (api: LX.UserApi.UserApiInfo) => void
  onTest: (api: LX.UserApi.UserApiInfo) => void
}) => {
  const ds = useDS()
  const t = useI18n()
  const isActive = activeId === api.id
  const hasTestState = !!testState && testState.status !== 'idle'
  const tone = hasTestState
    ? testState.status === 'success'
      ? 'success'
      : testState?.status === 'error'
        ? 'error'
        : testState?.status === 'loading'
          ? 'loading'
          : 'neutral'
    : isActive
      ? (userApiState.status.status ? 'success' : userApiState.status.message === 'initing' ? 'loading' : 'error')
      : 'neutral'
  const statusLabel = isActive
    ? hasTestState ? testState.message : runtimeStatusLabel
    : testState?.message ?? t('setting_custom_source_test_idle')

  return (
    <View style={[
      styles.apiCard,
      {
        backgroundColor: ds.isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
        borderColor: isActive ? ds.accent : ds.separator,
        shadowColor: isActive ? ds.accent : ds.shadowColor,
      },
    ]}>
      <View style={styles.apiCardHeader}>
        <View style={[styles.apiAvatar, { backgroundColor: isActive ? ds.accent : ds.accentSoft }]}>
          <Icon
            family="ionicons"
            name={isActive ? 'radio-outline' : 'code-slash-outline'}
            size={14}
            color={isActive ? ds.textOnAccent : ds.accent}
          />
        </View>
        <View style={styles.apiTitleWrap}>
          <Text size={13} color={ds.text} style={styles.apiTitle} numberOfLines={1}>{api.name}</Text>
          <View style={styles.apiMetaRow}>
            {api.version ? <MetaChip icon="pricetag-outline" label={formatVersionName(api.version)} /> : null}
            {api.author ? <MetaChip icon="person-outline" label={api.author} /> : null}
          </View>
        </View>
        <StatusPill label={statusLabel} tone={tone} compact />
      </View>
      {api.homepage ? (
        <Text size={10} color={ds.textDim} style={styles.apiHomepage} numberOfLines={1}>
          {api.homepage}
        </Text>
      ) : null}
      {api.description ? (
        <Text size={11} color={ds.textMuted} style={styles.apiDesc} numberOfLines={2}>
          {api.description}
        </Text>
      ) : null}
      {testState?.detail ? (
        <Text size={10} color={ds.textDim} style={styles.apiTestDetail}>
          {testState.detail}
        </Text>
      ) : null}
      <View style={[styles.apiActionRow, { borderColor: ds.separator }]}>
        {selectable ? (
          <CheckBox
            check={selected}
            disabled={busy}
            onChange={(nextSelected) => { onSelectChange?.(api, nextSelected) }}
            label={t('setting_custom_source_action_select')}
            size={0.85}
            marginRight={4}
          />
        ) : null}
        <MiniActionButton
          label={isActive ? t('setting_custom_source_action_using') : t('setting_custom_source_action_use')}
          onPress={() => { onUse(api) }}
          disabled={isActive || busy}
          tone="primary"
        />
        <MiniActionButton
          label={testing ? t('setting_custom_source_test_stop') : t('setting_custom_source_action_test')}
          onPress={() => { onTest(api) }}
          disabled={(busy && !testing) || testDisabled}
          tone={testing ? 'danger' : 'default'}
        />
        <MiniActionButton
          label={t('setting_custom_source_action_remove')}
          onPress={() => { onRemove(api) }}
          disabled={busy}
          tone="danger"
        />
      </View>
    </View>
  )
}

export default memo(() => {
  const ds = useDS()
  const t = useI18n()
  const userApiList = useUserApiList()
  const userApiStatus = useStatus()
  const activeApiId = useSettingValue('common.apiSource')
  const importRef = useRef<ScriptImportExportType>(null)
  const subscribePreviewRef = useRef<ConfirmAlertType>(null)

  const [segmentId, setSegmentId] = useState<SegmentId>('local')
  const [onlineScriptUrl, setOnlineScriptUrl] = useState('')
  const [isImportingOnline, setIsImportingOnline] = useState(false)
  const [subscribeName, setSubscribeName] = useState('')
  const [subscribeUrl, setSubscribeUrl] = useState('')
  const [subscribePreview, setSubscribePreview] = useState<SubscribePreviewItem[]>([])
  const [isFetchingSubscribe, setIsFetchingSubscribe] = useState(false)
  const [isImportingSubscribe, setIsImportingSubscribe] = useState(false)
  const [selectedApiIds, setSelectedApiIds] = useState<string[]>([])
  const [testStates, setTestStates] = useState<Record<string, TestState>>({})
  const [testingIds, setTestingIds] = useState<string[]>([])
  const [testingScope, setTestingScope] = useState<'current' | 'local' | 'subscribe' | null>(null)
  const [testingMode, setTestingMode] = useState<TestMode | null>(null)
  const testSamplesRef = useRef<RuntimeTestSamples | null>(null)
  const testSamplesPromiseRef = useRef<Promise<RuntimeTestSamples> | null>(null)
  const testControllerRef = useRef<TestController | null>(null)
  const isSessionTestSupported = useMemo(() => isUserApiSessionTestSupported(), [])

  const activeApi = useMemo(() => userApiList.find(api => api.id === activeApiId) ?? null, [activeApiId, userApiList])
  const runtimeStatusLabel = useMemo(() => getRuntimeStatusLabel(userApiStatus, t), [t, userApiStatus])
  const overviewStatusLabel = activeApi ? runtimeStatusLabel : t('setting_custom_source_test_idle')
  const localApis = useMemo(() => userApiList.filter(api => getApiOrigin(api).type !== 'subscribe'), [userApiList])
  const subscribeApis = useMemo(() => userApiList.filter(api => getApiOrigin(api).type === 'subscribe'), [userApiList])
  const subscribeGroups = useMemo<SubscribeGroup[]>(() => {
    const map = new Map<string, SubscribeGroup>()
    for (const api of userApiList) {
      const origin = getApiOrigin(api)
      if (origin.type !== 'subscribe') continue
      const key = getSubscribeGroupKey(origin)
      const prev = map.get(key)
      if (prev) {
        prev.apis.push(api)
        continue
      }
      map.set(key, {
        key,
        name: getSubscribeGroupName(origin),
        url: origin.subscribeUrl,
        apis: [api],
      })
    }
    return [...map.values()]
  }, [userApiList])
  const selectedLocalCount = useMemo(() => localApis.filter(api => selectedApiIds.includes(api.id)).length, [localApis, selectedApiIds])
  const selectedSubscribeCount = useMemo(() => subscribeApis.filter(api => selectedApiIds.includes(api.id)).length, [selectedApiIds, subscribeApis])
  const hasSelectedPreview = useMemo(() => subscribePreview.some(item => item.selected), [subscribePreview])
  const selectedPreviewCount = useMemo(() => subscribePreview.filter(item => item.selected).length, [subscribePreview])
  const isAllPreviewSelected = useMemo(
    () => subscribePreview.length > 0 && subscribePreview.every(item => item.selected),
    [subscribePreview],
  )
  const isBusy = !!testingIds.length || isImportingOnline || isFetchingSubscribe || isImportingSubscribe
  const overviewTone = useMemo((): 'neutral' | 'success' | 'error' | 'loading' => {
    if (!activeApi) return 'neutral'
    if (userApiStatus.status) return 'success'
    if (userApiStatus.message === 'initing') return 'loading'
    return 'error'
  }, [activeApi, userApiStatus.message, userApiStatus.status])

  const stopCurrentTest = useCallback(() => {
    testControllerRef.current?.cancel()
    setTestingIds([])
    setTestingScope(null)
    setTestingMode(null)
  }, [])

  useEffect(() => {
    const validIdSet = new Set(userApiList.map(api => api.id))
    setSelectedApiIds(prev => prev.filter(id => validIdSet.has(id)))
  }, [userApiList])

  const clearSubscribePreview = useCallback(() => {
    setSubscribePreview([])
  }, [])

  const showSubscribePreviewModal = useCallback(() => {
    requestAnimationFrame(() => {
      subscribePreviewRef.current?.setVisible(true)
    })
  }, [])

  const hideSubscribePreviewModal = useCallback(() => {
    subscribePreviewRef.current?.setVisible(false)
  }, [])

  const updateTestState = useCallback((id: string, nextState: TestState) => {
    setTestStates(prev => ({ ...prev, [id]: nextState }))
  }, [])

  const ensureUserApiTotalLimit = useCallback((nextTotal: number) => {
    if (nextTotal <= MAX_USER_API_COUNT) return true
    toast(t('user_api_max_tip'), 'long')
    return false
  }, [t])

  const ensureUserApiLimit = useCallback((incomingCount: number) => {
    return ensureUserApiTotalLimit(userApiList.length + incomingCount)
  }, [ensureUserApiTotalLimit, userApiList.length])

  const prepareSubscribeImportItems = useCallback(async(items: SubscribePreviewItem[]) => {
    const previewItems = dedupeSubscribePreviewItems(items)
    const prepared = await runConcurrentQueue(previewItems, SUBSCRIBE_IMPORT_CONCURRENCY, async(item) => {
      try {
        const script = await fetchSubscribeScript(item.script)
        if (typeof script !== 'string' || script.length > 9_000_000) return null
        const mergeKey = getSubscribePreviewMergeKey(item)
        return {
          item,
          script,
          mergeKey,
          identityKey: buildSubscribeIdentityKey(mergeKey, script),
          scriptKey: buildScriptIdentityKey(script),
        } satisfies PreparedSubscribeImportItem
      } catch {
        return null
      }
    })

    const identityKeySet = new Set<string>()
    const scriptKeySet = new Set<string>()
    const result: PreparedSubscribeImportItem[] = []
    let failCount = 0

    for (const preparedItem of prepared) {
      if (!preparedItem) {
        failCount++
        continue
      }
      if (identityKeySet.has(preparedItem.identityKey) || scriptKeySet.has(preparedItem.scriptKey)) continue
      identityKeySet.add(preparedItem.identityKey)
      scriptKeySet.add(preparedItem.scriptKey)
      result.push(preparedItem)
    }

    return {
      items: result,
      failCount,
    }
  }, [])

  const getApiIdentityRecords = useCallback(async(apis: LX.UserApi.UserApiInfo[]) => {
    return runConcurrentQueue(apis, SUBSCRIBE_IMPORT_CONCURRENCY, async(api) => {
      const script = await getUserApiScript(api.id)
      const mergeKey = getApiMergeKey(api)
      return {
        api,
        mergeKey,
        identityKey: buildSubscribeIdentityKey(mergeKey, script),
        scriptKey: buildScriptIdentityKey(script),
      }
    })
  }, [])

  const cleanupImportedSubscribeDuplicates = useCallback(async(api: LX.UserApi.UserApiInfo, targetSubscribeUrl: string, importedScript?: string) => {
    const targetIdentityKey = buildSubscribeIdentityKey(
      getApiMergeKey(api),
      importedScript ?? await getUserApiScript(api.id),
    )
    const candidateApis = userApiState.list.filter(item => {
      return item.id !== api.id &&
        isSameSubscribeOrigin(item, targetSubscribeUrl) &&
        getApiMergeKey(item) === getApiMergeKey(api)
    })

    const duplicateIds = (await getApiIdentityRecords(candidateApis))
      .filter(record => record.identityKey === targetIdentityKey)
      .map(record => record.api.id)

    if (!duplicateIds.length) {
      if (activeApiId === api.id) {
        setApiSource(api.id)
        await global.lx.apiInitPromise[0].catch(() => false)
      }
      return
    }

    if (duplicateIds.includes(activeApiId)) {
      setApiSource(api.id)
      await global.lx.apiInitPromise[0].catch(() => false)
    }

    const duplicateIdSet = new Set(duplicateIds)
    await removeUserApi(duplicateIds)
    setTestStates(prev => {
      const next = { ...prev }
      for (const id of duplicateIds) delete next[id]
      return next
    })
    setSelectedApiIds(prev => prev.filter(id => !duplicateIdSet.has(id)))
  }, [activeApiId, getApiIdentityRecords])

  const getFallbackApiId = useCallback((excludeIds: string[] = []) => {
    const excludedIdSet = new Set(excludeIds)
    const customFallbackId = userApiList.find(item => !excludedIdSet.has(item.id))?.id
    if (customFallbackId) return customFallbackId
    return (musicSdk.sources as Array<{ id: string }>).find(source => !excludedIdSet.has(source.id))?.id ?? ''
  }, [userApiList])

  const prepareTestSamples = useCallback(async(controller: TestController) => {
    controller.throwIfCancelled()
    if (testSamplesRef.current) return testSamplesRef.current
    if (testSamplesPromiseRef.current) return testSamplesPromiseRef.current

    const nextPromise = Promise.all(TEST_SOURCE_ORDER.map(async(source) => {
      const sampleKeys = new Set<string>()
      const samples: any[] = []
      try {
        await withTestTimeout((async() => {
          for (const keyword of TEST_SEARCH_KEYWORDS) {
            controller.throwIfCancelled()
            const result = await withTestTimeout(
              Promise.resolve(musicSdk[source].musicSearch.search(keyword, 1, TEST_SEARCH_RESULT_LIMIT)) as Promise<unknown>,
              TEST_SAMPLE_SEARCH_TIMEOUT,
              'sample search timeout',
              controller,
            )
            controller.throwIfCancelled()
            for (const musicInfo of selectTestMusics(result)) {
              const sampleKey = getTestSampleKey(musicInfo)
              if (sampleKeys.has(sampleKey)) continue
              sampleKeys.add(sampleKey)
              samples.push(musicInfo)
              if (samples.length >= MAX_TEST_SAMPLES_PER_SOURCE) return
            }
          }
        })(), TEST_SAMPLE_SOURCE_TIMEOUT, 'sample source timeout', controller)
      } catch (error) {
        if (isTestCancelledError(error)) throw error
      }
      controller.throwIfCancelled()
      return samples.length ? [source, samples] as const : null
    })).then((entries) => {
      controller.throwIfCancelled()
      const validEntries = entries.filter((entry): entry is readonly [LX.OnlineSource, any[]] => !!entry)
      const samples = Object.fromEntries(validEntries) as RuntimeTestSamples
      if (!Object.keys(samples).length) throw new Error(t('setting_custom_source_test_search_failed'))
      testSamplesRef.current = samples
      return samples
    }).finally(() => {
      testSamplesPromiseRef.current = null
    })

    testSamplesPromiseRef.current = nextPromise
    return nextPromise
  }, [t])

  const runSourceRequestTest = useCallback(async(
    task: RuntimeTestTask,
    runtimeApis: Partial<Record<LX.OnlineSource, RuntimeApiHandlers>>,
    runtimeQualityList: LX.QualityList,
    mode: TestMode,
    controller: TestController,
  ): Promise<RuntimeTestResult> => {
    controller.throwIfCancelled()
    const runtimeApi = runtimeApis[task.source]
    if (!runtimeApi) {
      return {
        source: task.source,
        action: task.action,
        status: 'error',
        message: t('setting_custom_source_test_no_supported_source'),
      }
    }
    let lastError: any = null

    for (const sample of task.samples) {
      controller.throwIfCancelled()
      try {
        const startedAt = Date.now()
        switch (task.action) {
          case 'musicUrl': {
            const quality = pickTestQuality(runtimeQualityList[task.source], sample)
            if (!quality) continue
            const getMusicUrl = runtimeApi.getMusicUrl
            if (!getMusicUrl) throw new Error(t('setting_custom_source_test_no_supported_source'))
            const result = await getMusicUrl(sample, quality).promise
            if (!isValidRequestResult(task.action, result)) throw new Error(t('setting_custom_source_test_request_failed'))
            const url = getResultUrl(result)
            const verifyDuration = mode === 'full' ? await verifyPlayableUrl(url, controller) : undefined
            return {
              source: task.source,
              action: task.action,
              status: 'success',
              message: getSourceDisplayName(task.source),
              duration: Date.now() - startedAt,
              quality: result.type,
              verifyDuration,
            }
          }
          case 'lyric': {
            const getLyric = runtimeApi.getLyric
            if (!getLyric) throw new Error(t('setting_custom_source_test_no_supported_source'))
            const result = await getLyric(sample).promise
            if (!isValidRequestResult(task.action, result)) throw new Error(t('setting_custom_source_test_request_failed'))
            return {
              source: task.source,
              action: task.action,
              status: 'success',
              message: getSourceDisplayName(task.source),
              duration: Date.now() - startedAt,
            }
          }
          case 'pic': {
            const getPic = runtimeApi.getPic
            if (!getPic) throw new Error(t('setting_custom_source_test_no_supported_source'))
            const result = await getPic(sample).promise
            if (!isValidRequestResult(task.action, result)) throw new Error(t('setting_custom_source_test_request_failed'))
            return {
              source: task.source,
              action: task.action,
              status: 'success',
              message: getSourceDisplayName(task.source),
              duration: Date.now() - startedAt,
            }
          }
        }
      } catch (error: any) {
        if (isTestCancelledError(error)) throw error
        lastError = error
      }
    }

    return {
      source: task.source,
      action: task.action,
      status: 'error',
      message: String(lastError?.message ?? t('setting_custom_source_test_request_failed')),
    }
  }, [t])

  const runConcurrentSourceTests = useCallback(async(
    tasks: RuntimeTestTask[],
    runtime: {
      apis: Partial<Record<LX.OnlineSource, RuntimeApiHandlers>>
      qualityList: LX.QualityList
    },
    mode: TestMode,
    controller: TestController,
  ) => {
    const results = await runConcurrentQueue(tasks, TEST_SOURCE_CONCURRENCY, async(task) => {
      controller.throwIfCancelled()
      return runSourceRequestTest(task, runtime.apis, runtime.qualityList, mode, controller)
    }, () => !controller.cancelled)
    return results.filter(Boolean)
  }, [runSourceRequestTest])

  const buildTestStateFromResults = useCallback((results: RuntimeTestResult[], mode: TestMode): TestState => {
    const successResults = results.filter(result => result.status === 'success')
    const failResults = results.filter(result => result.status === 'error')
    const successNames = successResults.map(result => formatRuntimeTestResultLabel(result, t)).join('、')
    const failNames = failResults.map(result => formatRuntimeTestResultLabel(result, t)).join('、')
    const details: string[] = []

    if (successNames) details.push(t('setting_custom_source_test_detail_success', { sources: successNames }))
    if (failNames) details.push(t('setting_custom_source_test_detail_failed', { sources: failNames }))

    return {
      mode,
      status: successResults.length ? 'success' : 'error',
      message: `${getTestModeLabel(mode, t)} · ${t('setting_custom_source_test_summary', { success: successResults.length, total: results.length })}`,
      detail: details.join('  '),
    }
  }, [t])

  const handleUseApi = useCallback((api: LX.UserApi.UserApiInfo) => {
    if (activeApiId === api.id) return
    setApiSource(api.id)
  }, [activeApiId])

  const handleToggleApiSelected = useCallback((api: LX.UserApi.UserApiInfo, selected: boolean) => {
    setSelectedApiIds(prev => {
      if (selected) {
        if (prev.includes(api.id)) return prev
        return [...prev, api.id]
      }
      return prev.filter(id => id !== api.id)
    })
  }, [])

  const handleToggleApiListSelected = useCallback((apis: LX.UserApi.UserApiInfo[]) => {
    const ids = apis.map(api => api.id)
    const idSet = new Set(ids)
    const selectedCount = ids.filter(id => selectedApiIds.includes(id)).length
    const shouldSelectAll = selectedCount !== ids.length

    setSelectedApiIds(prev => {
      const next = prev.filter(id => !idSet.has(id))
      return shouldSelectAll ? [...next, ...ids] : next
    })
  }, [selectedApiIds])

  const removeApiIds = useCallback(async(ids: string[]) => {
    if (!ids.length) return
    const idSet = new Set(ids)
    if (activeApiId && idSet.has(activeApiId)) {
      const fallbackId = getFallbackApiId(ids)
      setApiSource(fallbackId)
      await global.lx.apiInitPromise[0].catch(() => false)
    }
    await removeUserApi(ids)
    setTestStates(prev => {
      const next = { ...prev }
      for (const id of ids) delete next[id]
      return next
    })
    setSelectedApiIds(prev => prev.filter(id => !idSet.has(id)))
  }, [activeApiId, getFallbackApiId])

  const handleRemoveApi = useCallback(async(api: LX.UserApi.UserApiInfo) => {
    if (isBusy) return
    const confirmed = await confirmDialog({
      message: t('user_api_remove_tip', { name: api.name }),
      cancelButtonText: t('cancel_button_text_2'),
      confirmButtonText: t('confirm_button_text'),
      bgClose: false,
    })
    if (!confirmed) return
    await removeApiIds([api.id])
  }, [isBusy, removeApiIds, t])

  const handleRemoveSelected = useCallback(async(apis: LX.UserApi.UserApiInfo[]) => {
    const ids = apis.map(api => api.id).filter(id => selectedApiIds.includes(id))
    if (isBusy || !ids.length) return
    const confirmed = await confirmDialog({
      message: t('setting_custom_source_remove_selected_confirm', { count: ids.length }),
      cancelButtonText: t('cancel_button_text_2'),
      confirmButtonText: t('confirm_button_text'),
      bgClose: false,
    })
    if (!confirmed) return
    await removeApiIds(ids)
    toast(t('setting_custom_source_remove_selected_result', { count: ids.length }))
  }, [isBusy, removeApiIds, selectedApiIds, t])

  const buildRuntimeTasks = useCallback((
    runtime: {
      apis: Partial<Record<LX.OnlineSource, RuntimeApiHandlers>>
      qualityList: LX.QualityList
    },
    samples: RuntimeTestSamples,
    mode: TestMode,
  ) => {
    return TEST_SOURCE_ORDER.reduce<RuntimeTestTask[]>((list, source) => {
      const runtimeApi = runtime.apis[source]
      if (!runtimeApi) return list
      const sourceSamples = samples[source]
      if (!sourceSamples?.length) return list
      if (runtimeApi.getMusicUrl) {
        list.push({ source, action: 'musicUrl', samples: sourceSamples })
      }
      if (runtimeApi.getLyric) list.push({ source, action: 'lyric', samples: sourceSamples })
      if (runtimeApi.getPic) list.push({ source, action: 'pic', samples: sourceSamples })
      return list
    }, [])
  }, [])

  const runIsolatedRuntimeTest = useCallback(async(
    api: LX.UserApi.UserApiInfo,
    samples: RuntimeTestSamples,
    mode: TestMode,
    controller: TestController,
  ) => {
    updateTestState(api.id, {
      mode,
      status: 'loading',
      message: `${getTestModeLabel(mode, t)} · ${t('setting_custom_source_test_running')}`,
      detail: mode === 'full' ? t('setting_custom_source_test_full_requesting') : t('setting_custom_source_test_requesting'),
    })

    let session: RuntimeTestSession | null = null
    try {
      controller.throwIfCancelled()
      session = await createManagedTestSession(api, controller)
      controller.addSession(session)
      const runtimeTasks = buildRuntimeTasks(session, samples, mode)
      if (!runtimeTasks.length) {
        updateTestState(api.id, {
          mode,
          status: 'error',
          message: t('setting_custom_source_test_no_supported_source'),
        })
        return false
      }

      const results = await runConcurrentSourceTests(runtimeTasks, session, mode, controller)
      updateTestState(api.id, buildTestStateFromResults(results, mode))
      return results.some(result => result.status === 'success')
    } catch (error: any) {
      if (isTestCancelledError(error)) {
        updateTestState(api.id, {
          mode,
          status: 'idle',
          message: t('setting_custom_source_test_cancelled'),
        })
        return null
      }
      updateTestState(api.id, {
        mode,
        status: 'error',
        message: String(error?.message ?? t('setting_custom_source_test_request_failed')),
      })
      return false
    } finally {
      if (session) controller.removeSession(session)
      await session?.destroy()
    }
  }, [buildRuntimeTasks, buildTestStateFromResults, runConcurrentSourceTests, t, updateTestState])

  const runApiTest = useCallback(async(api: LX.UserApi.UserApiInfo, mode: TestMode = 'full') => {
    if (!isSessionTestSupported) {
      toast(t('setting_custom_source_test_not_supported'), 'long')
      return
    }
    if (testingIds.includes(api.id) && testingScope === 'current' && testingMode === mode) {
      stopCurrentTest()
      markTestCancelled([api.id], mode, updateTestState, t)
      return
    }
    if (isBusy) return
    const controller = createTestController()
    testControllerRef.current = controller
    setTestingIds([api.id])
    setTestingScope('current')
    setTestingMode(mode)
    try {
      updateTestState(api.id, {
        mode,
        status: 'loading',
        message: t('setting_custom_source_test_preparing'),
      })
      const samples = await prepareTestSamples(controller)
      controller.throwIfCancelled()
      await runIsolatedRuntimeTest(api, samples, mode, controller)
    } catch (error: any) {
      if (isTestCancelledError(error)) {
        updateTestState(api.id, {
          mode,
          status: 'idle',
          message: t('setting_custom_source_test_cancelled'),
        })
        return
      }
      updateTestState(api.id, {
        mode,
        status: 'error',
        message: String(error?.message ?? t('setting_custom_source_test_request_failed')),
      })
    } finally {
      controller.cancel()
      if (testControllerRef.current === controller) testControllerRef.current = null
      setTestingIds([])
      setTestingScope(null)
      setTestingMode(null)
    }
  }, [isBusy, isSessionTestSupported, prepareTestSamples, runIsolatedRuntimeTest, stopCurrentTest, t, testingIds, testingMode, testingScope, updateTestState])

  const runBatchTest = useCallback(async(scope: 'local' | 'subscribe', mode: TestMode = 'full') => {
    if (!isSessionTestSupported) {
      toast(t('setting_custom_source_test_not_supported'), 'long')
      return
    }
    if (testingScope === scope && testingMode === mode) {
      stopCurrentTest()
      const list = scope === 'local'
        ? localApis
        : subscribeApis
      markTestCancelled(list.map(api => api.id), mode, updateTestState, t)
      return
    }
    if (isBusy) return
    const list = scope === 'local'
      ? localApis
      : subscribeApis
    if (!list.length) return
    const controller = createTestController()
    testControllerRef.current = controller
    setTestingScope(scope)
    setTestingMode(mode)
    setTestingIds(list.map(api => api.id))
    try {
      for (const api of list) {
        updateTestState(api.id, {
          mode,
          status: 'loading',
          message: t('setting_custom_source_test_preparing'),
        })
      }
      const samples = await prepareTestSamples(controller)
      controller.throwIfCancelled()
      const results = await runConcurrentQueue(list, TEST_WORKER_POOL_SIZE, async(api) => {
        controller.throwIfCancelled()
        return runIsolatedRuntimeTest(api, samples, mode, controller)
      }, () => !controller.cancelled)
      const success = results.filter(result => result === true).length
      const fail = results.filter(result => result === false).length
      await tipDialog({
        message: t('setting_custom_source_test_batch_result', { mode: getTestModeLabel(mode, t), success, fail }),
        btnText: t('ok'),
      })
    } catch (error: any) {
      if (!isTestCancelledError(error)) toast(String(error?.message ?? t('setting_custom_source_test_request_failed')), 'long')
    } finally {
      controller.cancel()
      if (testControllerRef.current === controller) testControllerRef.current = null
      setTestingIds([])
      setTestingScope(null)
      setTestingMode(null)
    }
  }, [isBusy, isSessionTestSupported, localApis, prepareTestSamples, runIsolatedRuntimeTest, stopCurrentTest, subscribeApis, t, testingMode, testingScope, updateTestState])

  const handleImportOnline = useCallback(async() => {
    if (isBusy) return
    const url = onlineScriptUrl.trim()
    if (!/^https?:\/\//i.test(url)) {
      toast(t('setting_custom_source_input_invalid_url'))
      return
    }
    if (!ensureUserApiLimit(1)) return
    setIsImportingOnline(true)
    try {
      const script = await httpFetch(url, { follow_max: 3 }).promise.then(resp => resp.body)
      if (typeof script !== 'string' || script.length > 9_000_000) {
        throw new Error('Too large script')
      }
      await importUserApi({
        script,
        origin: { type: 'local' },
      })
      setOnlineScriptUrl('')
      toast(t('user_api_import_success_tip'))
    } catch (error: any) {
      toast(t('user_api_import_failed_tip', { message: error.message }), 'long')
    } finally {
      setIsImportingOnline(false)
    }
  }, [ensureUserApiLimit, isBusy, onlineScriptUrl, t])

  const handleFetchSubscribe = useCallback(async() => {
    if (isBusy) return
    const name = subscribeName.trim()
    const url = subscribeUrl.trim()
    if (!name) {
      toast(t('setting_custom_source_subscribe_name_required'))
      return
    }
    if (!/^https?:\/\//i.test(url)) {
      toast(t('setting_custom_source_input_invalid_url'))
      return
    }
    setIsFetchingSubscribe(true)
    setSubscribePreview([])
    try {
      const preview = await fetchSubscribeSources(url, t)
      if (!preview.length) {
        toast(t('setting_custom_source_subscribe_preview_empty'))
        return
      }
      setSubscribePreview(preview)
      showSubscribePreviewModal()
    } catch (error: any) {
      toast(String(error.message ?? error), 'long')
    } finally {
      setIsFetchingSubscribe(false)
    }
  }, [isBusy, showSubscribePreviewModal, subscribeName, subscribeUrl, t])

  const handleTogglePreview = useCallback((index: number, selected: boolean) => {
    setSubscribePreview(prev => prev.map((item, itemIndex) => itemIndex === index ? { ...item, selected } : item))
  }, [])

  const handleToggleAllPreview = useCallback(() => {
    const nextSelected = !isAllPreviewSelected
    setSubscribePreview(prev => prev.map(item => ({ ...item, selected: nextSelected })))
  }, [isAllPreviewSelected])

  const handleImportPreview = useCallback(async() => {
    if (isBusy) return
    const selectedItems = dedupeSubscribePreviewItems(subscribePreview.filter(item => item.selected))
    if (!selectedItems.length) return
    const normalizedSubscribeUrl = subscribeUrl.trim()

    setIsImportingSubscribe(true)
    let success = 0
    let skipped = 0
    let fail = 0
    try {
      const { items: preparedItems, failCount } = await prepareSubscribeImportItems(selectedItems)
      fail += failCount

      const existingRecords = await getApiIdentityRecords(userApiList)
      const existingIdentitySet = new Set(
        existingRecords
          .filter(record => isSameSubscribeOrigin(record.api, normalizedSubscribeUrl))
          .map(record => record.identityKey),
      )
      const existingScriptKeySet = new Set(existingRecords.map(record => record.scriptKey))
      const importItems = preparedItems.filter(item => {
        return !existingIdentitySet.has(item.identityKey) && !existingScriptKeySet.has(item.scriptKey)
      })
      if (!ensureUserApiLimit(importItems.length)) return

      for (const preparedItem of preparedItems) {
        if (existingIdentitySet.has(preparedItem.identityKey) || existingScriptKeySet.has(preparedItem.scriptKey)) {
          skipped++
          continue
        }

        try {
          const info = await importUserApi({
            script: preparedItem.script,
            origin: {
              type: 'subscribe',
              subscribeName: subscribeName.trim(),
              subscribeUrl: normalizedSubscribeUrl,
            },
          })
          existingIdentitySet.add(preparedItem.identityKey)
          existingScriptKeySet.add(preparedItem.scriptKey)
          await cleanupImportedSubscribeDuplicates(info, normalizedSubscribeUrl, preparedItem.script)
          success++
        } catch (error) {
          if (isDuplicateImportError(error)) {
            skipped++
            existingIdentitySet.add(preparedItem.identityKey)
            existingScriptKeySet.add(preparedItem.scriptKey)
          } else {
            fail++
          }
        }
      }
      toast(t('setting_custom_source_subscribe_result', { success, skipped, fail }), 'long')
      if (success > 0 || skipped > 0) {
        hideSubscribePreviewModal()
        setSubscribeName('')
        setSubscribeUrl('')
        setSegmentId('subscribe')
      }
    } finally {
      setIsImportingSubscribe(false)
    }
  }, [cleanupImportedSubscribeDuplicates, ensureUserApiLimit, getApiIdentityRecords, hideSubscribePreviewModal, isBusy, prepareSubscribeImportItems, subscribeName, subscribePreview, subscribeUrl, t, userApiList])

  const handleResubscribe = useCallback(async(group: SubscribeGroup) => {
    if (isBusy) return
    const confirmed = await confirmDialog({
      message: t('setting_custom_source_subscribe_resubscribe_confirm', { name: group.name }),
      cancelButtonText: t('cancel_button_text_2'),
      confirmButtonText: t('confirm_button_text'),
      bgClose: false,
    })
    if (!confirmed) return

    setIsImportingSubscribe(true)
    let success = 0
    let skipped = 0
    let fail = 0
    try {
      const preview = dedupeSubscribePreviewItems(await fetchSubscribeSources(group.url, t))
      if (!preview.length) {
        await tipDialog({
          message: t('setting_custom_source_subscribe_resubscribe_result', { success: 0, skipped: 0, fail: 0 }),
          btnText: t('ok'),
        })
        return
      }

      const { items: preparedItems, failCount } = await prepareSubscribeImportItems(preview)
      fail += failCount
      if (!preparedItems.length) {
        await tipDialog({
          message: t('setting_custom_source_subscribe_resubscribe_result', { success, skipped, fail }),
          btnText: t('ok'),
        })
        return
      }

      const previousApiId = settingState.setting['common.apiSource']
      const previousApi = group.apis.find(api => api.id === previousApiId) ?? null
      const currentGroupIds = group.apis.map(api => api.id)
      const shouldRestoreCurrent = currentGroupIds.includes(previousApiId)
      const currentGroupRecords = await getApiIdentityRecords(group.apis)
      const currentGroupRecordMap = new Map<string, LX.UserApi.UserApiInfo[]>()
      const currentGroupScriptMap = new Map<string, LX.UserApi.UserApiInfo[]>()
      for (const record of currentGroupRecords) {
        const list = currentGroupRecordMap.get(record.identityKey) ?? []
        list.push(record.api)
        currentGroupRecordMap.set(record.identityKey, list)

        const scriptList = currentGroupScriptMap.get(record.scriptKey) ?? []
        scriptList.push(record.api)
        currentGroupScriptMap.set(record.scriptKey, scriptList)
      }

      const externalScriptKeySet = new Set(
        (await getApiIdentityRecords(userApiList.filter(api => !currentGroupIds.includes(api.id))))
          .map(record => record.scriptKey),
      )
      const reusableCountMap = new Map<string, number>()
      const reusableScriptCountMap = new Map<string, number>()
      for (const record of currentGroupRecords) {
        reusableCountMap.set(record.identityKey, (reusableCountMap.get(record.identityKey) ?? 0) + 1)
        reusableScriptCountMap.set(record.scriptKey, (reusableScriptCountMap.get(record.scriptKey) ?? 0) + 1)
      }
      let importCount = 0
      let reusedCount = 0
      for (const preparedItem of preparedItems) {
        const reusableCount = reusableCountMap.get(preparedItem.identityKey) ?? 0
        if (reusableCount > 0) {
          reusableCountMap.set(preparedItem.identityKey, reusableCount - 1)
          reusedCount++
          continue
        }
        const reusableScriptCount = reusableScriptCountMap.get(preparedItem.scriptKey) ?? 0
        if (reusableScriptCount > 0) {
          reusableScriptCountMap.set(preparedItem.scriptKey, reusableScriptCount - 1)
          reusedCount++
          continue
        }
        if (externalScriptKeySet.has(preparedItem.scriptKey)) continue
        importCount++
      }
      const nextTotal = userApiList.length - currentGroupIds.length + reusedCount + importCount
      if (!ensureUserApiTotalLimit(nextTotal)) return

      const retainedApiIds = new Set<string>()
      let firstResolvedApiId = ''
      let restoredApiId = ''
      for (const preparedItem of preparedItems) {
        const matchedApis = currentGroupRecordMap.get(preparedItem.identityKey)
        const reusedApi = matchedApis?.shift()
        const matchedScriptApis = reusedApi ? undefined : currentGroupScriptMap.get(preparedItem.scriptKey)
        const reusedByScriptApi = matchedScriptApis?.shift()
        const reusableApi = reusedApi ?? reusedByScriptApi
        if (reusableApi) {
          retainedApiIds.add(reusableApi.id)
          if (!firstResolvedApiId) firstResolvedApiId = reusableApi.id
          if (previousApi?.id === reusableApi.id) restoredApiId = reusableApi.id
          skipped++
          continue
        }

        try {
          if (externalScriptKeySet.has(preparedItem.scriptKey)) {
            skipped++
            continue
          }
          const info = await importUserApi({
            script: preparedItem.script,
            origin: {
              type: 'subscribe',
              subscribeName: group.name,
              subscribeUrl: group.url,
            },
          })
          await cleanupImportedSubscribeDuplicates(info, group.url, preparedItem.script)
          externalScriptKeySet.add(preparedItem.scriptKey)
          if (!firstResolvedApiId) firstResolvedApiId = info.id
          if (previousApi && !restoredApiId && isSameApiIdentity(previousApi, info)) restoredApiId = info.id
          success++
        } catch (error) {
          if (isDuplicateImportError(error)) {
            skipped++
            externalScriptKeySet.add(preparedItem.scriptKey)
          } else {
            fail++
          }
        }
      }

      if (!success && !skipped) {
        await tipDialog({
          message: t('setting_custom_source_subscribe_resubscribe_result', { success, skipped, fail }),
          btnText: t('ok'),
        })
        return
      }

      const removableIds = currentGroupIds.filter(id => !retainedApiIds.has(id))
      await removeUserApi(removableIds)
      setTestStates(prev => {
        const next = { ...prev }
        for (const id of removableIds) delete next[id]
        return next
      })
      setSelectedApiIds(prev => prev.filter(id => !removableIds.includes(id)))

      if (shouldRestoreCurrent) {
        setApiSource(restoredApiId || firstResolvedApiId || getFallbackApiId(removableIds))
        await global.lx.apiInitPromise[0].catch(() => false)
      }
      await tipDialog({
        message: t('setting_custom_source_subscribe_resubscribe_result', { success, skipped, fail }),
        btnText: t('ok'),
      })
    } finally {
      setIsImportingSubscribe(false)
    }
  }, [cleanupImportedSubscribeDuplicates, ensureUserApiTotalLimit, getApiIdentityRecords, getFallbackApiId, isBusy, prepareSubscribeImportItems, t, userApiList])

  const renderSubscribePreviewContent = () => {
    if (!subscribePreview.length) {
      return (
        <View style={[styles.previewEmptyBlock, { backgroundColor: ds.bgFloat, borderColor: ds.separator }]}>
          <Text size={12} color={ds.textDim}>{t('setting_custom_source_subscribe_preview_empty')}</Text>
        </View>
      )
    }

    return (
        <View style={[styles.previewCard, { backgroundColor: ds.bgFloat, borderColor: ds.separator }]}>
          <View style={styles.previewHeader}>
            <Text size={12} color={ds.text} style={styles.previewTitle}>
              {t('setting_custom_source_subscribe_preview_count', { count: subscribePreview.length })}
            </Text>
            <View style={styles.previewHeaderActions}>
              <StatusPill label={`${selectedPreviewCount}/${subscribePreview.length}`} tone="loading" />
              <MiniActionButton
                label={isAllPreviewSelected ? t('setting_custom_source_subscribe_clear_all') : t('setting_custom_source_subscribe_select_all')}
                onPress={handleToggleAllPreview}
              />
            </View>
          </View>
        <View style={styles.previewList}>
          {subscribePreview.map((item, index) => (
            <View key={`${item.name}_${index}`} style={[styles.previewItem, { borderColor: ds.separator }]}>
              <CheckBox
                check={item.selected}
                marginRight={0}
                size={0.95}
                onChange={(selected) => { handleTogglePreview(index, selected) }}
              >
                <View style={styles.previewInfo}>
                  <View style={styles.previewTitleRow}>
                    <View style={[styles.previewIcon, { backgroundColor: ds.accentSoft }]}>
                      <Icon family="ionicons" name="cube-outline" size={12} color={ds.accent} />
                    </View>
                    <Text size={12} color={ds.text} style={styles.previewItemTitle} numberOfLines={2}>{item.name}</Text>
                  </View>
                  <View style={styles.previewMeta}>
                    <MetaChip icon="code-slash-outline" label={item.scriptOrigin} />
                    {item.version ? <MetaChip icon="pricetag-outline" label={formatVersionName(item.version)} /> : null}
                    {item.author ? <MetaChip icon="person-outline" label={item.author} /> : null}
                  </View>
                  {item.description ? <Text size={10} color={ds.textMuted} numberOfLines={2}>{item.description}</Text> : null}
                  <Text size={10} color={ds.textDim} style={styles.previewScript} numberOfLines={1}>
                    {t('setting_custom_source_subscribe_preview_script', { script: item.scriptLabel })}
                  </Text>
                </View>
              </CheckBox>
            </View>
          ))}
        </View>
      </View>
    )
  }

  return (
    <Section title={t('setting_custom_source')} description={t('setting_section_desc_custom_source')}>
      <View style={styles.topGrid}>
        <SourceOverviewCard
          activeName={activeApi ? activeApi.name : t('setting_custom_source_overview_empty')}
          overviewStatusLabel={overviewStatusLabel}
          overviewTone={overviewTone}
        />

        <View style={styles.segmentRow}>
          <SegmentButton
            active={segmentId === 'local'}
            count={localApis.length}
            label={t('setting_custom_source_segment_local')}
            onPress={() => { setSegmentId('local') }}
          />
          <SegmentButton
            active={segmentId === 'subscribe'}
            count={subscribeApis.length}
            label={t('setting_custom_source_segment_subscribe')}
            onPress={() => { setSegmentId('subscribe') }}
          />
        </View>
      </View>

      {segmentId === 'local' ? (
        <>
          <SubTitle title={t('setting_custom_source_local_import')}>
            <View style={[styles.importCard, { backgroundColor: ds.bgFloat, borderColor: ds.separator }]}>
              <View style={styles.importHeroRow}>
                <View style={[styles.importIcon, { backgroundColor: ds.accentSoft }]}>
                  <Icon family="ionicons" name="document-attach-outline" size={16} color={ds.accent} />
                </View>
                <View style={styles.importHeroText}>
                  <Text size={13} color={ds.text} style={styles.importHeroTitle}>
                    {t('setting_custom_source_local_import_file')}
                  </Text>
                  <Text size={10} color={ds.textDim} numberOfLines={1}>
                    {t('setting_custom_source_local_import_hint')}
                  </Text>
                </View>
                <InlinePrimaryButton
                  disabled={isBusy}
                  label={t('setting_custom_source_local_import_file')}
                  onPress={() => { importRef.current?.import() }}
                />
              </View>
              <View style={styles.inlineInputBlock}>
                <Text size={11} color={ds.textMuted} style={styles.inlineInputLabel}>
                  {t('setting_custom_source_local_import_online')}
                </Text>
                <View style={styles.inlineInputRow}>
                  <Input
                    value={onlineScriptUrl}
                    onChangeText={setOnlineScriptUrl}
                    placeholder={t('setting_custom_source_local_import_input')}
                    style={[styles.inlineInput, { backgroundColor: ds.bg, color: ds.text }]}
                  />
                  <InlinePrimaryButton
                    disabled={isBusy || !onlineScriptUrl.trim()}
                    label={isImportingOnline ? t('user_api_btn_import_online_input_loading') : t('user_api_btn_import_online_input_confirm')}
                    onPress={() => { void handleImportOnline() }}
                  />
                </View>
              </View>
            </View>
          </SubTitle>

          <SubTitle title={t('setting_custom_source_local_list')}>
            {localApis.length ? (
              <SourceActionToolbar
                totalCount={localApis.length}
                selectedCount={selectedLocalCount}
                disabled={isBusy}
                testing={testingScope === 'local'}
                onToggleAll={() => { handleToggleApiListSelected(localApis) }}
                onDeleteSelected={() => { void handleRemoveSelected(localApis) }}
                onTestAll={() => { void runBatchTest('local', 'full') }}
              />
            ) : null}
            {localApis.length ? localApis.map(api => (
              <ApiCard
                key={api.id}
                api={api}
                activeId={activeApiId}
                runtimeStatusLabel={runtimeStatusLabel}
                selectable
                busy={isBusy}
                testing={testingScope === 'current' && testingIds.includes(api.id)}
                testDisabled={!isSessionTestSupported}
                selected={selectedApiIds.includes(api.id)}
                testState={testStates[api.id]}
                onSelectChange={handleToggleApiSelected}
                onUse={handleUseApi}
                onRemove={(target) => { void handleRemoveApi(target) }}
                onTest={(target) => { void runApiTest(target, 'full') }}
              />
            )) : (
              <EmptyState icon="folder-open-outline" label={t('setting_custom_source_local_empty')} />
            )}
          </SubTitle>
        </>
      ) : null}

      {segmentId === 'subscribe' ? (
        <>
          <SubTitle title={t('setting_custom_source_subscribe_import')}>
            <View style={[styles.importCard, { backgroundColor: ds.bgFloat, borderColor: ds.separator }]}>
              <View style={styles.importHeroRow}>
                <View style={[styles.importIcon, { backgroundColor: ds.accentSoft }]}>
                  <Icon family="ionicons" name="cloud-download-outline" size={16} color={ds.accent} />
                </View>
                <View style={styles.importHeroText}>
                  <Text size={13} color={ds.text} style={styles.importHeroTitle}>
                    {t('setting_custom_source_subscribe_fetch')}
                  </Text>
                  <Text size={10} color={ds.textDim} numberOfLines={1}>
                    {t('setting_custom_source_subscribe_fetch_hint')}
                  </Text>
                </View>
              </View>
              <View style={styles.inlineInputRow}>
                <Input
                  value={subscribeName}
                  onChangeText={setSubscribeName}
                  placeholder={t('setting_custom_source_subscribe_import_name_tip')}
                  style={[styles.nameInput, { backgroundColor: ds.bg, color: ds.text }]}
                />
                <Input
                  value={subscribeUrl}
                  onChangeText={setSubscribeUrl}
                  placeholder={t('setting_custom_source_subscribe_import_url_tip')}
                  style={[styles.inlineInput, { backgroundColor: ds.bg, color: ds.text }]}
                />
                <InlinePrimaryButton
                  disabled={isBusy || !subscribeUrl.trim()}
                  label={isFetchingSubscribe ? t('user_api_btn_import_online_input_loading') : t('setting_custom_source_subscribe_fetch')}
                  onPress={() => { void handleFetchSubscribe() }}
                />
              </View>
            </View>
          </SubTitle>

          <SubTitle title={t('setting_custom_source_subscribe_list')}>
            {subscribeApis.length ? (
              <SourceActionToolbar
                totalCount={subscribeApis.length}
                selectedCount={selectedSubscribeCount}
                disabled={isBusy}
                testing={testingScope === 'subscribe'}
                onToggleAll={() => { handleToggleApiListSelected(subscribeApis) }}
                onDeleteSelected={() => { void handleRemoveSelected(subscribeApis) }}
                onTestAll={() => { void runBatchTest('subscribe', 'full') }}
              />
            ) : null}
            {subscribeGroups.length ? subscribeGroups.map(group => (
              <View key={group.key} style={[styles.groupCard, { backgroundColor: ds.bgFloat, borderColor: ds.separator }]}>
                <SubscribeGroupHeader
                  group={group}
                  showRefresh
                  disabled={isBusy}
                  onRefresh={(targetGroup) => { void handleResubscribe(targetGroup) }}
                />
                <View style={styles.groupList}>
                  {group.apis.map(api => (
                    <ApiCard
                      key={api.id}
                      api={api}
                      activeId={activeApiId}
                      runtimeStatusLabel={runtimeStatusLabel}
                      selectable
                      busy={isBusy}
                      testing={testingScope === 'current' && testingIds.includes(api.id)}
                      testDisabled={!isSessionTestSupported}
                      selected={selectedApiIds.includes(api.id)}
                      testState={testStates[api.id]}
                      onSelectChange={handleToggleApiSelected}
                      onUse={handleUseApi}
                      onRemove={(target) => { void handleRemoveApi(target) }}
                      onTest={(target) => { void runApiTest(target, 'full') }}
                    />
                  ))}
                </View>
              </View>
            )) : (
              <EmptyState icon="cloud-offline-outline" label={t('setting_custom_source_subscribe_empty')} />
            )}
          </SubTitle>
        </>
      ) : null}

      <ConfirmAlert
        ref={subscribePreviewRef}
        title={t('setting_custom_source_subscribe_import')}
        confirmText={isImportingSubscribe ? t('user_api_btn_import_online_input_loading') : t('setting_custom_source_subscribe_import_selected')}
        disabledConfirm={isImportingSubscribe || !hasSelectedPreview}
        bgHide={!isImportingSubscribe}
        keyHide={!isImportingSubscribe}
        closeBtn={!isImportingSubscribe}
        onConfirm={() => { void handleImportPreview() }}
        onHide={clearSubscribePreview}
      >
        {renderSubscribePreviewContent()}
      </ConfirmAlert>

      <ScriptImportExport ref={importRef} />
    </Section>
  )
})

const styles = StyleSheet.create({
  topGrid: {
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  summaryCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 5,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  summaryMain: {
    flex: 1,
    gap: 1,
  },
  summaryBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: {
    fontWeight: '500',
  },
  summaryActiveName: {
    fontWeight: '600',
    lineHeight: 17,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    minHeight: 27,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
    flexDirection: 'row',
    gap: 6,
  },
  segmentButtonText: {
    fontWeight: '600',
  },
  segmentCount: {
    minWidth: 20,
    height: 18,
    borderRadius: 999,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentCountText: {
    fontWeight: '700',
  },
  importCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingTop: 5,
    paddingBottom: 5,
    marginBottom: 5,
    gap: 6,
  },
  importHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  importIcon: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  importHeroText: {
    flex: 1,
    gap: 2,
  },
  importHeroTitle: {
    fontWeight: '600',
  },
  metaChip: {
    maxWidth: '100%',
    minHeight: 20,
    borderRadius: 999,
    paddingHorizontal: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  inlineInputBlock: {
    gap: 4,
  },
  fieldBlock: {
    gap: 4,
  },
  inlineInputLabel: {
    fontWeight: '500',
  },
  inlineInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inlineInput: {
    minWidth: 0,
    flex: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 26,
    fontSize: 11,
  },
  nameInput: {
    width: 128,
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 26,
    fontSize: 11,
    flexShrink: 0,
  },
  fullInput: {
    width: '100%',
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 26,
    fontSize: 11,
  },
  previewCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 10,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  previewHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewTitle: {
    flex: 1,
    fontWeight: '600',
  },
  previewList: {
    gap: 6,
  },
  previewItem: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 2,
    paddingTop: 8,
    paddingBottom: 8,
  },
  previewInfo: {
    flex: 1,
    gap: 3,
  },
  previewTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  previewIcon: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  previewItemTitle: {
    flex: 1,
    fontWeight: '600',
    lineHeight: 18,
  },
  previewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
  },
  previewScript: {
    lineHeight: 13,
  },
  previewEmptyBlock: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBlock: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 16,
  },
  apiCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 5,
    marginBottom: 4,
  },
  apiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  apiAvatar: {
    width: 25,
    height: 25,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apiTitleWrap: {
    flex: 1,
    gap: 2,
  },
  apiTitle: {
    fontWeight: '600',
  },
  apiMetaRow: {
    flexDirection: 'row',
    gap: 5,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  apiHomepage: {
    marginTop: 3,
  },
  apiDesc: {
    marginTop: 3,
    lineHeight: 14,
  },
  apiTestDetail: {
    marginTop: 5,
    lineHeight: 14,
  },
  apiActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
    paddingTop: 5,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  actionButton: {
    minHeight: 22,
    paddingHorizontal: 7,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontWeight: '600',
  },
  inlinePrimaryButton: {
    minWidth: 50,
    maxWidth: 92,
    minHeight: 26,
    borderRadius: 7,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  inlinePrimaryButtonText: {
    fontWeight: '600',
  },
  statusPill: {
    maxWidth: 104,
    minHeight: 22,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPillCompact: {
    maxWidth: 88,
    minHeight: 20,
    paddingHorizontal: 7,
  },
  statusPillText: {
    fontWeight: '600',
  },
  groupCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingTop: 6,
    paddingBottom: 2,
    marginBottom: 6,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 10,
    paddingBottom: 6,
  },
  groupIcon: {
    width: 25,
    height: 25,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupMain: {
    flex: 1,
    gap: 3,
  },
  groupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupTitle: {
    flex: 1,
    fontWeight: '600',
  },
  groupList: {
    paddingTop: 1,
    paddingHorizontal: 5,
  },
  selectionToolbar: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 7,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  selectionToolbarText: {
    flexShrink: 0,
    maxWidth: 124,
  },
  selectionToolbarScroll: {
    flex: 1,
  },
  selectionToolbarActions: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'flex-end',
    paddingLeft: 2,
  },
})
