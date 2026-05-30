import { useMemo } from 'react'
import { useFontSize } from '@/store/common/hook'
import { setSpText } from '@/utils/pixelRatio'

export const HEADER_CONTROL_HEIGHT = 24
export const HEADER_CONTROL_RADIUS = 6
export const HEADER_CONTROL_FONT_SIZE = 11
export const HEADER_CONTROL_HORIZONTAL_PADDING = 8
export const HEADER_CONTROL_VERTICAL_PADDING = 0
export const HEADER_CONTROL_GAP = 4
export const HEADER_CONTROL_ROW_GAP = 4

const normalizeScale = (value: number) => {
  return Number.isFinite(value) && value >= 0.8 && value <= 1.3 ? value : 1
}

const scaleLayout = (value: number, scale: number) => {
  return Math.max(1, Math.round(value * normalizeScale(scale)))
}

export const getHeaderControlMetrics = (fontScale = global.lx?.fontSize ?? 1) => {
  const scale = normalizeScale(fontScale)
  const height = scaleLayout(HEADER_CONTROL_HEIGHT, scale)
  const radius = scaleLayout(HEADER_CONTROL_RADIUS, scale)
  const horizontalPadding = scaleLayout(HEADER_CONTROL_HORIZONTAL_PADDING, scale)
  const gap = scaleLayout(HEADER_CONTROL_GAP, scale)
  const rowGap = scaleLayout(HEADER_CONTROL_ROW_GAP, scale)

  return {
    scale,
    height,
    radius,
    fontSize: HEADER_CONTROL_FONT_SIZE,
    inputFontSize: setSpText(HEADER_CONTROL_FONT_SIZE),
    horizontalPadding,
    verticalPadding: HEADER_CONTROL_VERTICAL_PADDING,
    gap,
    rowGap,
    iconSize: scaleLayout(10, scale),
    actionIconSize: scaleLayout(12, scale),
    clearIconSize: scaleLayout(10, scale),
    minSearchWidth: scaleLayout(88, scale),
    menuWidth: scaleLayout(90, scale),
    menuHeight: scaleLayout(32, scale),
    clearButtonSize: scaleLayout(16, scale),
  }
}

export const useHeaderControlMetrics = () => {
  const fontScale = useFontSize()
  return useMemo(() => getHeaderControlMetrics(fontScale), [fontScale])
}
