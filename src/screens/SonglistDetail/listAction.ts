import { createList, setTempList } from '@/core/list'
import { playList } from '@/core/player/player'
import { getListDetail, getListDetailAll, resolveListDetailId } from '@/core/songlist'
import { LIST_IDS } from '@/config/constant'
import listState from '@/store/list/state'
import syncSourceList from '@/core/syncSourceList'
import { confirmDialog, toMD5, toast } from '@/utils/tools'
import { type Source } from '@/store/songlist/state'

const getListId = (id: string, source: LX.OnlineSource) => `${source}__${id}`

const findCollectedTargetList = async(source: Source, rawId: string, normalizedId: string) => {
  const candidateLists = listState.userList.filter(listInfo => {
    return listInfo.source === source && !!listInfo.sourceListId
  })

  for (const listInfo of candidateLists) {
    const sourceListId = listInfo.sourceListId!
    if (sourceListId === normalizedId || sourceListId === rawId) return listInfo
    if (!/[?&:/]/.test(sourceListId)) continue

    const resolvedSourceListId = await resolveListDetailId(source, sourceListId)
    if (resolvedSourceListId === normalizedId) return listInfo
  }

  return null
}

export const handlePlay = async(id: string, source: Source, list?: LX.Music.MusicInfoOnline[], index = 0) => {
  const listId = getListId(id, source)
  let isPlayingList = false
  // console.log(list)
  if (!list?.length) list = (await getListDetail(id, source, 1)).list
  if (list?.length) {
    await setTempList(listId, [...list])
    void playList(LIST_IDS.TEMP, index)
    isPlayingList = true
  }
  const fullList = await getListDetailAll(source, id)
  if (!fullList.length) return
  if (isPlayingList) {
    if (listState.tempListMeta.id == listId) {
      await setTempList(listId, [...fullList])
    }
  } else {
    await setTempList(listId, [...fullList])
    void playList(LIST_IDS.TEMP, index)
  }
}

export const handleCollect = async(id: string, source: Source, name: string) => {
  const normalizedId = await resolveListDetailId(source, id)
  const listId = getListId(normalizedId, source)
  const targetList = await findCollectedTargetList(source, id, normalizedId)
  if (targetList) {
    const confirm = await confirmDialog({
      message: global.i18n.t('duplicate_list_tip', { name: targetList.name }),
      cancelButtonText: global.i18n.t('list_import_part_button_cancel'),
      confirmButtonText: global.i18n.t('confirm_button_text'),
    })
    if (!confirm) return
    void syncSourceList(targetList)
    return
  }

  const list = await getListDetailAll(source, normalizedId)
  await createList({
    name,
    id: `${source}_${toMD5(listId)}`,
    list,
    source,
    sourceListId: normalizedId,
  })
  toast(global.i18n.t('collect_success'))
}
