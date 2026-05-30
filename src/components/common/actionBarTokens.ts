import {
  HEADER_CONTROL_FONT_SIZE,
  HEADER_CONTROL_HEIGHT,
  HEADER_CONTROL_HORIZONTAL_PADDING,
  HEADER_CONTROL_RADIUS,
  HEADER_CONTROL_ROW_GAP,
  useHeaderControlMetrics,
} from '@/screens/Home/Views/common/headerControls'

export const ACTION_CONTROL_FONT_SIZE = HEADER_CONTROL_FONT_SIZE
export const ACTION_SEARCH_HEIGHT = HEADER_CONTROL_HEIGHT
export const ACTION_SEARCH_RADIUS = HEADER_CONTROL_RADIUS
export const ACTION_SEARCH_ICON_SIZE = 10
export const ACTION_TEXT_CHIP_HEIGHT = HEADER_CONTROL_HEIGHT
export const ACTION_TEXT_CHIP_RADIUS = HEADER_CONTROL_RADIUS
export const ACTION_TEXT_CHIP_PADDING = HEADER_CONTROL_HORIZONTAL_PADDING
export const ACTION_ICON_BTN_SIZE = HEADER_CONTROL_HEIGHT
export const ACTION_ICON_BTN_RADIUS = HEADER_CONTROL_RADIUS
export const ACTION_RAIL_PADDING = 0
export const ACTION_RAIL_GAP = HEADER_CONTROL_ROW_GAP
export const ACTION_ROW_GAP = HEADER_CONTROL_ROW_GAP

export const useActionBarMetrics = () => {
  const metrics = useHeaderControlMetrics()
  return {
    controlFontSize: metrics.fontSize,
    inputFontSize: metrics.inputFontSize,
    searchHeight: metrics.height,
    searchRadius: metrics.radius,
    searchIconSize: metrics.iconSize,
    textChipHeight: metrics.height,
    textChipRadius: metrics.radius,
    textChipPadding: metrics.horizontalPadding,
    iconBtnSize: metrics.height,
    iconBtnRadius: metrics.radius,
    actionIconSize: metrics.actionIconSize,
    railPadding: ACTION_RAIL_PADDING,
    railGap: metrics.rowGap,
    rowGap: metrics.rowGap,
    clearButtonSize: Math.max(18, metrics.clearButtonSize),
    clearIconSize: metrics.clearIconSize,
  }
}
