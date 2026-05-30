import { createHttpFetch } from './util'

export default {
  requestObj: null,
  cancelTipSearch() {
    if (this.requestObj && this.requestObj.cancelHttp) this.requestObj.cancelHttp()
  },
  tipSearchBySong(str) {
    this.cancelTipSearch()
    this.requestObj = createHttpFetch(`https://searchtip.kugou.com/getSearchTip?MusicTipCount=10&keyword=${encodeURIComponent(str)}`, {
      headers: {
        referer: 'https://www.kugou.com/',
      },
    })
    return this.requestObj.then(body => {
      return body?.[0]?.RecordDatas ?? []
    })
  },
  handleResult(rawData) {
    if (!Array.isArray(rawData)) return []
    return rawData.map(info => info.HintInfo).filter(Boolean)
  },
  async search(str) {
    return this.tipSearchBySong(str).then(result => this.handleResult(result))
  },
}
