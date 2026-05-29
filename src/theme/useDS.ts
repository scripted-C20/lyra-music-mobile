/**
 * useDS — 使用设计系统
 * 桥接现有主题与新设计系统
 */
import { useTheme } from '@/store/theme/hook'
import {
  darkColors, lightColors,
  spacing, radius, fontSize, fontWeight, letterSpacing, lineHeight,
  shadows, textStyles, touchTarget,
} from './designSystem'

export const useDS = () => {
  const theme = useTheme()
  const isDark = theme.isDark

  // 静态色
  const c = isDark ? darkColors : lightColors

  // 旧主题已经处理了自定义主题、自动主题和背景图场景。
  // DS 的文字/背景必须跟随真实主题颜色，否则会出现白底白字。
  const text = theme['c-font'] || c.textPrimary
  const textMuted = theme['c-font-label'] || c.textSecondary
  const bg = theme['c-main-background'] || c.bgBase
  const bgCard = theme['c-content-background'] || c.bgElevated

  // 主题色（用户选择的强调色）
  const accent = theme['c-primary-dark-200']
  const accentSoft = theme['c-primary-light-100-alpha-900']
  const accentMuted = theme['c-primary-light-500-alpha-700']

  return {
    // ─── 模式 ────────────────────────────────────
    isDark,

    // ─── 背景层级 ────────────────────────────────
    bg,
    bgCard,
    bgFloat: bgCard,
    bgHigh: c.bgElevated3,
    bgHighlight: c.bgElevated3, // 兼容旧

    // ─── 文字 ────────────────────────────────────
    text,
    textMuted,
    textSecondary: textMuted, // 兼容旧
    textDim: textMuted,
    textTertiary: textMuted, // 兼容旧
    textFaint: c.textQuaternary,
    textDisabled: c.textQuaternary, // 兼容旧
    textOnAccent: c.textOnAccent,

    // ─── 填充 ────────────────────────────────────
    fill1: c.fillPrimary,
    fill2: c.fillSecondary,
    fill3: c.fillTertiary,
    fill4: c.fillQuaternary,

    // ─── 边框/分隔线 ─────────────────────────────
    separator: c.separator,
    separatorOpaque: c.separatorOpaque,
    border: c.separator, // 兼容旧
    borderSubtle: c.separator, // 兼容旧
    divider: c.separator, // 兼容旧

    // ─── 遮罩 ────────────────────────────────────
    scrim: c.scrim2,
    scrimSoft: c.scrim1,
    scrimHeavy: c.scrim3,
    overlay: c.scrim1, // 兼容旧
    overlayMedium: c.scrim2, // 兼容旧
    overlayHeavy: c.scrim3, // 兼容旧

    // ─── 系统色 ──────────────────────────────────
    red: c.systemRed,
    orange: c.systemOrange,
    yellow: c.systemYellow,
    green: c.systemGreen,
    blue: c.systemBlue,
    purple: c.systemPurple,
    pink: c.systemPink,

    // ─── 主题色 ──────────────────────────────────
    accent,
    accentSoft,
    accentMuted,
    accentBg: accentSoft, // 兼容旧
    accentLight: accentMuted, // 兼容旧

    // ─── 阴影 ────────────────────────────────────
    shadowColor: '#000000',
    accentShadow: accent,
    accentShadowColor: accent, // 兼容旧

    // ─── Design Tokens ───────────────────────────
    spacing,
    radius,
    fontSize,
    fontWeight,
    letterSpacing,
    lineHeight,
    shadows,
    textStyles,
    touchTarget,

    // ─── 完整调色板 ──────────────────────────────
    colors: c,
  } as const
}

export type DS = ReturnType<typeof useDS>
