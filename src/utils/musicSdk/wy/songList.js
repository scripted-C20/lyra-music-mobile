// https://github.com/Binaryify/NeteaseCloudMusicApi/blob/master/module/playlist_catlist.js
// https://github.com/Binaryify/NeteaseCloudMusicApi/blob/master/module/playlist_hot.js
// https://github.com/Binaryify/NeteaseCloudMusicApi/blob/master/module/top_playlist.js
// https://github.com/Binaryify/NeteaseCloudMusicApi/blob/master/module/playlist_detail.js

import { weapi, linuxapi } from './utils/crypto'
import { httpFetch } from '../../request'
import { formatPlayTime, sizeFormate, dateFormat, formatPlayCount } from '../../index'
import musicDetailApi from './musicDetail'
import { eapiRequest } from './utils/index'
import { formatSingerName } from '../utils'

export default {
  _requestObj_tags: null,
  _requestObj_hotTags: null,
  _requestObj_list: null,
  limit_list: 30,
  limit_song: 100000,
  successCode: 200,
  cookie: 'MUSIC_U=',
  sortList: [
    {
      name: '最热',
      tid: 'hot',
      id: 'hot',
    },
    // {
    //   name: '最新',
    //   tid: 'new',
    //   id: 'new',
    // },
  ],
  regExps: {
    listDetailLink: /(?:^|[?&#])id=(\d+)(?=[&#]|$)/i,
    listDetailLink2: /\/playlist\/(\d+)(?:\/|$|\?)/i,
    listUserId: /(?:^|[?&#])(?:userId|userid|uid)=(\d+)(?=[&#]|$)/i,
  },

  normalizeListInput(input) {
    return String(input ?? '').trim().replace(/^['"]+|['"]+$/g, '')
  },

  extractListId(input) {
    const raw = this.normalizeListInput(input)
    if (!raw) return ''
    if (/^\d+$/.test(raw)) return raw

    let decoded = raw
    try {
      decoded = decodeURIComponent(raw)
    } catch {}

    for (const candidate of [decoded, raw]) {
      const match = candidate.match(this.regExps.listDetailLink) ?? candidate.match(this.regExps.listDetailLink2)
      if (match?.[1]) return match[1]
    }

    if (!/^https?:/i.test(decoded)) return ''

    try {
      const url = new URL(decoded)
      const searchId = url.searchParams.get('id')
      if (searchId) return searchId

      const hash = url.hash.replace(/^#/, '')
      if (hash) {
        const hashQueryIndex = hash.indexOf('?')
        if (hashQueryIndex > -1) {
          const hashId = new URLSearchParams(hash.slice(hashQueryIndex + 1)).get('id')
          if (hashId) return hashId
        }
        const hashMatch = hash.match(this.regExps.listDetailLink2)
        if (hashMatch?.[1]) return hashMatch[1]
      }
    } catch {}

    return ''
  },

  extractUserId(input) {
    const raw = this.normalizeListInput(input)
    if (!raw) return ''

    let decoded = raw
    try {
      decoded = decodeURIComponent(raw)
    } catch {}

    for (const candidate of [decoded, raw]) {
      const match = candidate.match(this.regExps.listUserId)
      if (match?.[1]) return match[1]
    }

    if (!/^https?:/i.test(decoded)) return ''

    try {
      const url = new URL(decoded)
      return url.searchParams.get('userId') ||
        url.searchParams.get('userid') ||
        url.searchParams.get('uid') ||
        new URLSearchParams(url.hash.replace(/^#.*?\?/, '')).get('userId') ||
        new URLSearchParams(url.hash.replace(/^#.*?\?/, '')).get('userid') ||
        new URLSearchParams(url.hash.replace(/^#.*?\?/, '')).get('uid') ||
        ''
    } catch {}

    return ''
  },

  async getFavoriteListId(cookie, userId, retryNum = 0) {
    if (!userId) throw new Error('favorite playlist userId not found')
    if (retryNum > 2) throw new Error('favorite playlist try max num')

    const requestObj = httpFetch(`https://music.163.com/api/user/playlist?offset=0&limit=1000&uid=${userId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
        Referer: 'https://music.163.com/',
        Cookie: cookie,
      },
    })
    const { statusCode, body } = await requestObj.promise
    if (statusCode !== 200 || body.code !== this.successCode || !Array.isArray(body.playlist)) {
      return this.getFavoriteListId(cookie, userId, ++retryNum)
    }

    const favoriteList = body.playlist.find(item => item.specialType === 5) ??
      body.playlist.find(item => item.userId == userId && /喜欢的音乐$/.test(item.name))

    if (!favoriteList?.id) throw new Error('favorite playlist id not found')
    return String(favoriteList.id)
  },

  async handleParseId(link, retryNum = 0) {
    if (retryNum > 2) throw new Error('link try max num')

    const currentId = this.extractListId(link)
    if (currentId) return currentId

    const requestObj_listDetailLink = httpFetch(link)
    const { url, statusCode } = await requestObj_listDetailLink.promise
    // console.log(headers)
    if (statusCode > 400) return this.handleParseId(link, ++retryNum)
    const nextUrl = url == null ? link : url
    const id = this.extractListId(nextUrl)
    if (id) return id
    throw new Error('playlist id parse failed')
  },

  async getListId(id) {
    id = this.normalizeListInput(id)
    let cookie
    if (/###/.test(id)) {
      const splitIndex = id.indexOf('###')
      const url = id.slice(0, splitIndex)
      const token = id.slice(splitIndex + 3).trim()
      id = this.normalizeListInput(url)
      if (token) cookie = `MUSIC_U=${token}`
    }
    const userId = this.extractUserId(id)
    const parsedId = this.extractListId(id)
    if (parsedId) {
      id = parsedId
    } else if ((/[?&:/]/.test(id))) {
      id = await this.handleParseId(id)
    }
    if (id === '11332' && cookie && userId) id = await this.getFavoriteListId(cookie, userId)
    if (!/^\d+$/.test(id)) throw new Error('playlist id parse failed')
    return { id, cookie }
  },
  async getListDetail(rawId, page, tryNum = 0, requestCookie = null) { // 获取歌曲列表内的音乐
    if (tryNum > 2) return Promise.reject(new Error('try max num'))

    const { id, cookie } = await this.getListId(rawId)
    const currentCookie = cookie || requestCookie || this.cookie
    if (cookie) this.cookie = cookie

    const requestObj_listDetail = httpFetch('https://music.163.com/api/linux/forward', {
      method: 'post',
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
        Cookie: currentCookie,
      },
      credentials: 'omit',
      cache: 'default',
      form: linuxapi({
        method: 'POST',
        url: 'https://music.163.com/api/v3/playlist/detail',
        params: {
          id,
          n: this.limit_song,
          s: 8,
        },
      }),
    })
    const { statusCode, body } = await requestObj_listDetail.promise
    if (statusCode !== 200 || body.code !== this.successCode) return this.getListDetail(id, page, ++tryNum, currentCookie)
    let limit = 1000
    let rangeStart = (page - 1) * limit
    // console.log(body)
    let list
    if (body.playlist.trackIds.length == body.privileges.length) {
      list = this.filterListDetail(body)
    } else {
      try {
        list = (await musicDetailApi.getList(body.playlist.trackIds.slice(rangeStart, limit * page).map(trackId => trackId.id))).list
      } catch (err) {
        console.log(err)
        if (err.message == 'try max num') {
          if (body.playlist.tracks?.length) {
            list = this.filterListDetail({
              playlist: {
                tracks: body.playlist.tracks.slice(rangeStart, limit * page),
              },
              privileges: body.privileges,
            })
          } else {
            throw err
          }
        } else {
          return this.getListDetail(id, page, ++tryNum, currentCookie)
        }
      }
    }
    // console.log(list)
    return {
      list,
      page,
      limit,
      total: body.playlist.trackIds.length,
      source: 'wy',
      info: {
        play_count: formatPlayCount(body.playlist.playCount),
        name: body.playlist.name,
        img: body.playlist.coverImgUrl,
        desc: body.playlist.description,
        author: body.playlist.creator.nickname,
      },
    }
  },
  filterListDetail({ playlist: { tracks }, privileges }) {
    // console.log(tracks, privileges)
    const list = []
    tracks.forEach((item, index) => {
      const types = []
      const _types = {}
      let size
      let privilege = privileges[index]
      if (privilege.id !== item.id) privilege = privileges.find(p => p.id === item.id)
      if (!privilege) return

      if (privilege.maxBrLevel == 'hires') {
        size = item.hr ? sizeFormate(item.hr.size) : null
        types.push({ type: 'flac24bit', size })
        _types.flac24bit = {
          size,
        }
      }
      switch (privilege.maxbr) {
        case 999000:
          size = null
          types.push({ type: 'flac', size })
          _types.flac = {
            size,
          }
        case 320000:
          size = item.h ? sizeFormate(item.h.size) : null
          types.push({ type: '320k', size })
          _types['320k'] = {
            size,
          }
        case 192000:
        case 128000:
          size = item.l ? sizeFormate(item.l.size) : null
          types.push({ type: '128k', size })
          _types['128k'] = {
            size,
          }
      }

      types.reverse()

      if (item.pc) {
        list.push({
          singer: item.pc.ar ?? '',
          name: item.pc.sn ?? '',
          albumName: item.pc.alb ?? '',
          albumId: item.al?.id,
          source: 'wy',
          interval: formatPlayTime(item.dt / 1000),
          songmid: item.id,
          img: item.al?.picUrl ?? '',
          lrc: null,
          otherSource: null,
          types,
          _types,
          typeUrl: {},
        })
      } else {
        list.push({
          singer: formatSingerName(item.ar, 'name'),
          name: item.name ?? '',
          albumName: item.al?.name,
          albumId: item.al?.id,
          source: 'wy',
          interval: formatPlayTime(item.dt / 1000),
          songmid: item.id,
          img: item.al?.picUrl,
          lrc: null,
          otherSource: null,
          types,
          _types,
          typeUrl: {},
        })
      }
    })
    return list
  },

  // 获取列表数据
  getList(sortId, tagId, page, tryNum = 0) {
    if (tryNum > 2) return Promise.reject(new Error('try max num'))
    if (this._requestObj_list) this._requestObj_list.cancelHttp()
    this._requestObj_list = httpFetch('https://music.163.com/weapi/playlist/list', {
      method: 'post',
      form: weapi({
        cat: tagId || '全部', // 全部,华语,欧美,日语,韩语,粤语,小语种,流行,摇滚,民谣,电子,舞曲,说唱,轻音乐,爵士,乡村,R&B/Soul,古典,民族,英伦,金属,朋克,蓝调,雷鬼,世界音乐,拉丁,另类/独立,New Age,古风,后摇,Bossa Nova,清晨,夜晚,学习,工作,午休,下午茶,地铁,驾车,运动,旅行,散步,酒吧,怀旧,清新,浪漫,性感,伤感,治愈,放松,孤独,感动,兴奋,快乐,安静,思念,影视原声,ACG,儿童,校园,游戏,70后,80后,90后,网络歌曲,KTV,经典,翻唱,吉他,钢琴,器乐,榜单,00后
        order: sortId, // hot,new
        limit: this.limit_list,
        offset: this.limit_list * (page - 1),
        total: true,
      }),
    })
    return this._requestObj_list.promise.then(({ body }) => {
      // console.log(body)
      if (body.code !== this.successCode) return this.getList(sortId, tagId, page, ++tryNum)
      return {
        list: this.filterList(body.playlists),
        total: parseInt(body.total),
        page,
        limit: this.limit_list,
        source: 'wy',
      }
    })
  },
  filterList(rawData) {
    // console.log(rawData)
    return rawData.map(item => ({
      play_count: formatPlayCount(item.playCount),
      id: String(item.id),
      author: item.creator.nickname,
      name: item.name,
      time: item.createTime ? dateFormat(item.createTime, 'Y-M-D') : '',
      img: item.coverImgUrl,
      grade: item.grade,
      total: item.trackCount,
      desc: item.description,
      source: 'wy',
    }))
  },

  // 获取标签
  getTag(tryNum = 0) {
    if (this._requestObj_tags) this._requestObj_tags.cancelHttp()
    if (tryNum > 2) return Promise.reject(new Error('try max num'))
    this._requestObj_tags = httpFetch('https://music.163.com/weapi/playlist/catalogue', {
      method: 'post',
      form: weapi({}),
    })
    return this._requestObj_tags.promise.then(({ body }) => {
      // console.log(JSON.stringify(body))
      if (body.code !== this.successCode) return this.getTag(++tryNum)
      return this.filterTagInfo(body)
    })
  },
  filterTagInfo({ sub, categories }) {
    const subList = {}
    for (const item of sub) {
      if (!subList[item.category]) subList[item.category] = []
      subList[item.category].push({
        parent_id: categories[item.category],
        parent_name: categories[item.category],
        id: item.name,
        name: item.name,
        source: 'wy',
      })
    }

    const list = []
    for (const key of Object.keys(categories)) {
      list.push({
        name: categories[key],
        list: subList[key],
        source: 'wy',
      })
    }
    return list
  },

  // 获取热门标签
  getHotTag(tryNum = 0) {
    if (this._requestObj_hotTags) this._requestObj_hotTags.cancelHttp()
    if (tryNum > 2) return Promise.reject(new Error('try max num'))
    this._requestObj_hotTags = httpFetch('https://music.163.com/weapi/playlist/hottags', {
      method: 'post',
      form: weapi({}),
    })
    return this._requestObj_hotTags.promise.then(({ body }) => {
      // console.log(JSON.stringify(body))
      if (body.code !== this.successCode) return this.getTag(++tryNum)
      return this.filterHotTagInfo(body.tags)
    })
  },
  filterHotTagInfo(rawList) {
    return rawList.map(item => ({
      id: item.playlistTag.name,
      name: item.playlistTag.name,
      source: 'wy',
    }))
  },

  getTags() {
    return Promise.all([this.getTag(), this.getHotTag()]).then(([tags, hotTag]) => ({ tags, hotTag, source: 'wy' }))
  },

  async getDetailPageUrl(rawId) {
    const { id } = await this.getListId(rawId)
    return `https://music.163.com/#/playlist?id=${id}`
  },

  search(text, page, limit = 20) {
    return eapiRequest('/api/cloudsearch/pc', {
      s: text,
      type: 1000, // 1: 单曲, 10: 专辑, 100: 歌手, 1000: 歌单, 1002: 用户, 1004: MV, 1006: 歌词, 1009: 电台, 1014: 视频
      limit,
      total: page == 1,
      offset: limit * (page - 1),
    })
      .promise.then(({ body }) => {
        if (body.code != this.successCode) throw new Error('filed')
        // console.log(body)
        return {
          list: this.filterList(body.result.playlists),
          limit,
          total: body.result.playlistCount,
          source: 'wy',
        }
      })
  },
}

// getList
// getTags
// getListDetail
