/**
 * Created by qianxin on 17/6/1.
 * 屏幕工具类
 * ui设计基准,iphone 6
 * width:375
 * height:667
 */
import { Dimensions, PixelRatio } from 'react-native'
import { windowSizeTools } from './windowSizeTools'

// 高保真的宽度和高度
const designWidth = 375.0
const designHeight = 667.0

const getSafeFontScale = () => {
  const size = global.lx?.fontSize
  return typeof size == 'number' && Number.isFinite(size) && size >= 0.8 && size <= 1.3 ? size : 1
}

const getScreenSize = () => {
  const cachedSize = windowSizeTools.getSize()
  const fallbackSize = Dimensions.get('window')
  let screenW = cachedSize.width || fallbackSize.width
  let screenH = cachedSize.height || fallbackSize.height

  if (!Number.isFinite(screenW) || screenW <= 0) screenW = designWidth
  if (!Number.isFinite(screenH) || screenH <= 0) screenH = designHeight

  if (screenW > screenH) {
    const temp = screenW
    screenW = screenH
    screenH = temp
  }

  return { screenW, screenH }
}

const getScaleInfo = () => {
  const { screenW, screenH } = getScreenSize()
  const fontScale = PixelRatio.getFontScale()
  const pixelRatio = PixelRatio.get()
  const safeFontScale = Number.isFinite(fontScale) && fontScale > 0 ? fontScale : 1
  const safePixelRatio = Number.isFinite(pixelRatio) && pixelRatio > 0 ? pixelRatio : 1
  const screenPxW = PixelRatio.getPixelSizeForLayoutSize(screenW)
  const screenPxH = PixelRatio.getPixelSizeForLayoutSize(screenH)
  const scaleW = screenPxW / designWidth
  const scaleH = screenPxH / designHeight
  const scale = Math.min(scaleW, scaleH, 3.1)

  return {
    screenW,
    screenH,
    fontScale: safeFontScale,
    pixelRatio: safePixelRatio,
    scale: Number.isFinite(scale) && scale > 0 ? scale : safePixelRatio,
  }
}

/**
 * 设置text
 * @param size  px
 * @returns dp
 */
export function getTextSize(size: number) {
  // console.log('screenW======' + screenW)
  // console.log('screenPxW======' + screenPxW)
  const { screenW, screenH, fontScale } = getScaleInfo()
  let scaleWidth = screenW / designWidth
  let scaleHeight = screenH / designHeight
  // console.log(scaleWidth, scaleHeight)
  let scale = Math.min(scaleWidth, scaleHeight, 1.3)
  size = Math.floor(size * scale / fontScale)
  // console.log(size)
  return size
}
export function setSpText(size: number) {
  return getTextSize(size) * getSafeFontScale()
}

/**
 * 设置高度
 * @param size  px
 * @returns dp
 */
export function scaleSizeH(size: number) {
  // console.log(screenPxH / designHeight)
  // let scaleHeight = size * Math.min(screenPxH / designHeight, 3.1)
  const { scale, pixelRatio } = getScaleInfo()
  let scaleHeight = size * scale
  size = Math.floor(scaleHeight / pixelRatio)
  return size * getSafeFontScale()
}

/**
 * 设置宽度
 * @param size  px
 * @returns dp
 */
export function scaleSizeW(size: number) {
  // console.log(screenPxW / designWidth)
  // let scaleWidth = size * Math.min(screenPxW / designWidth, 3.1)
  const { scale, pixelRatio } = getScaleInfo()
  let scaleWidth = size * scale
  size = Math.floor(scaleWidth / pixelRatio)
  return size * getSafeFontScale()
}


export const scaleSizeWR = (size: number) => {
  return size * 2 - scaleSizeW(size)
}

export const scaleSizeHR = (size: number) => {
  return size * 2 - scaleSizeH(size)
}

export const scaleSizeAbsHR = (size: number) => {
  const { scale, pixelRatio } = getScaleInfo()
  let scaleHeight = size * scale
  return size * 2 - Math.floor(scaleHeight / pixelRatio)
}
