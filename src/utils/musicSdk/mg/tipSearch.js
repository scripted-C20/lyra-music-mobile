import { createHttpFetch } from './utils'

export default {
  requestObj: null,
  cancelTipSearch() {
    if (this.requestObj && this.requestObj.cancelHttp) this.requestObj.cancelHttp()
  },
  tipSearchBySong(str) {
    this.cancelTipSearch()
    this.requestObj = createHttpFetch(`https://music.migu.cn/v3/api/search/suggest?keyword=${encodeURIComponent(str)}`, {
      headers: {
        referer: 'https://music.migu.cn/v3',
      },
    })
    return this.requestObj.then(body => {
      return body?.songs ?? []
    })
  },
  handleResult(rawData) {
    if (!Array.isArray(rawData)) return []
    return rawData.map(info => `${info.name || ''}${info.singerName ? ` - ${info.singerName}` : ''}`.trim()).filter(Boolean)
  },
  async search(str) {
    return this.tipSearchBySong(str).then(result => this.handleResult(result))
  },
}
