/**
 * LX Music Design System
 * 基于 iOS 18 Human Interface Guidelines
 * 深色优先 · 大标题 · Hairline · 主题色强调
 */

// ─── 间距系统（8倍数） ─────────────────────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20, // 标准页面边距
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const

// ─── 圆角系统 ──────────────────────────────────────────────────────────────────
export const radius = {
  none: 0,
  xs: 4, // 标签
  sm: 8, // 小元素
  md: 10, // 按钮、Pill 内部
  lg: 12, // 列表项
  xl: 14, // 小卡片
  '2xl': 18, // 标准卡片（iOS 18）
  '3xl': 22, // 大卡片
  '4xl': 28, // 突出卡片
  full: 999,
} as const

// ─── 字体大小（iOS Type Scale） ────────────────────────────────────────────────
export const fontSize = {
  caption2: 11,
  caption1: 12,
  footnote: 13,
  subheadline: 15,
  callout: 16,
  body: 17,
  headline: 17,
  title3: 20,
  title2: 22,
  title1: 28,
  largeTitle: 34,
} as const

// ─── 字重 ────────────────────────────────────────────────────────────────────
export const fontWeight = {
  ultraLight: '100',
  thin: '200',
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
  black: '900',
} as const

// ─── 字间距 ──────────────────────────────────────────────────────────────────
export const letterSpacing = {
  tightest: -1.2,
  tighter: -0.8,
  tight: -0.4,
  normal: 0,
  wide: 0.2,
  wider: 0.5,
  widest: 1.0,
} as const

// ─── 行高（相对字号） ─────────────────────────────────────────────────────────
export const lineHeight = {
  tight: 1.15,
  snug: 1.25,
  normal: 1.4,
  relaxed: 1.55,
  loose: 1.7,
} as const

// ─── 阴影系统 ─────────────────────────────────────────────────────────────────
export const shadows = {
  none: {
    shadowOpacity: 0,
    elevation: 0,
  },
  // 微弱（hover 状态）
  xs: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  // 卡片
  sm: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
  },
  // 浮层
  md: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
  // 弹窗
  lg: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 24,
    elevation: 14,
  },
  // 突出 / 播放按钮
  xl: {
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.30,
    shadowRadius: 32,
    elevation: 20,
  },
  // 封面专用
  artwork: {
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.40,
    shadowRadius: 48,
    elevation: 24,
  },
} as const

// ─── 暗色模式调色板（iOS 系统色） ────────────────────────────────────────────
export const darkColors = {
  // 背景层级 (Material Surfaces)
  bgBase: '#000000', // 纯黑根背景
  bgElevated: '#1C1C1E', // 一级浮起（卡片）
  bgElevated2: '#2C2C2E', // 二级浮起（浮层）
  bgElevated3: '#3A3A3C', // 三级浮起（高亮）
  bgGrouped: '#000000', // 分组列表背景
  bgGroupedItem: '#1C1C1E', // 分组列表项

  // 文字
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(235,235,245,0.60)',
  textTertiary: 'rgba(235,235,245,0.30)',
  textQuaternary: 'rgba(235,235,245,0.16)',
  textOnAccent: '#FFFFFF',

  // 填充色（Fill）
  fillPrimary: 'rgba(120,120,128,0.36)',
  fillSecondary: 'rgba(120,120,128,0.32)',
  fillTertiary: 'rgba(118,118,128,0.24)',
  fillQuaternary: 'rgba(118,118,128,0.18)',

  // 分隔线
  separator: 'rgba(84,84,88,0.65)',
  separatorOpaque: '#38383A',

  // 系统语义色
  systemRed: '#FF453A',
  systemOrange: '#FF9F0A',
  systemYellow: '#FFD60A',
  systemGreen: '#30D158',
  systemBlue: '#0A84FF',
  systemPurple: '#BF5AF2',
  systemPink: '#FF375F',

  // 遮罩
  scrim1: 'rgba(0,0,0,0.20)',
  scrim2: 'rgba(0,0,0,0.45)',
  scrim3: 'rgba(0,0,0,0.70)',
  scrim4: 'rgba(0,0,0,0.85)',
} as const

// ─── 亮色模式调色板 ───────────────────────────────────────────────────────────
export const lightColors = {
  bgBase: '#FFFFFF',
  bgElevated: '#FFFFFF',
  bgElevated2: '#F2F2F7',
  bgElevated3: '#E5E5EA',
  bgGrouped: '#F2F2F7',
  bgGroupedItem: '#FFFFFF',

  textPrimary: '#000000',
  textSecondary: 'rgba(60,60,67,0.60)',
  textTertiary: 'rgba(60,60,67,0.30)',
  textQuaternary: 'rgba(60,60,67,0.18)',
  textOnAccent: '#FFFFFF',

  fillPrimary: 'rgba(120,120,128,0.20)',
  fillSecondary: 'rgba(120,120,128,0.16)',
  fillTertiary: 'rgba(118,118,128,0.12)',
  fillQuaternary: 'rgba(116,116,128,0.08)',

  separator: 'rgba(60,60,67,0.29)',
  separatorOpaque: '#C6C6C8',

  systemRed: '#FF3B30',
  systemOrange: '#FF9500',
  systemYellow: '#FFCC00',
  systemGreen: '#34C759',
  systemBlue: '#007AFF',
  systemPurple: '#AF52DE',
  systemPink: '#FF2D55',

  scrim1: 'rgba(0,0,0,0.15)',
  scrim2: 'rgba(0,0,0,0.35)',
  scrim3: 'rgba(0,0,0,0.55)',
  scrim4: 'rgba(0,0,0,0.75)',
} as const

// ─── iOS 文字样式预设 ────────────────────────────────────────────────────────
export const textStyles = {
  // 大标题（页面顶部唯一）
  largeTitle: {
    fontSize: fontSize.largeTitle,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.tightest,
    lineHeight: fontSize.largeTitle * lineHeight.tight,
  },
  // 一级标题（章节）
  title1: {
    fontSize: fontSize.title1,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.tighter,
    lineHeight: fontSize.title1 * lineHeight.tight,
  },
  // 二级标题
  title2: {
    fontSize: fontSize.title2,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.tight,
    lineHeight: fontSize.title2 * lineHeight.snug,
  },
  // 三级标题（卡片标题）
  title3: {
    fontSize: fontSize.title3,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.tight,
    lineHeight: fontSize.title3 * lineHeight.snug,
  },
  // 列表项标题（粗）
  headline: {
    fontSize: fontSize.headline,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.normal,
    lineHeight: fontSize.headline * lineHeight.snug,
  },
  // 正文
  body: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.regular,
    letterSpacing: letterSpacing.normal,
    lineHeight: fontSize.body * lineHeight.normal,
  },
  // 标题/导航按钮
  callout: {
    fontSize: fontSize.callout,
    fontWeight: fontWeight.regular,
    letterSpacing: letterSpacing.normal,
    lineHeight: fontSize.callout * lineHeight.normal,
  },
  // 副标题
  subheadline: {
    fontSize: fontSize.subheadline,
    fontWeight: fontWeight.regular,
    letterSpacing: letterSpacing.normal,
    lineHeight: fontSize.subheadline * lineHeight.normal,
  },
  // 脚注
  footnote: {
    fontSize: fontSize.footnote,
    fontWeight: fontWeight.regular,
    letterSpacing: letterSpacing.normal,
    lineHeight: fontSize.footnote * lineHeight.normal,
  },
  // 小标签（区段标题）
  caption1: {
    fontSize: fontSize.caption1,
    fontWeight: fontWeight.regular,
    letterSpacing: letterSpacing.normal,
    lineHeight: fontSize.caption1 * lineHeight.normal,
  },
  caption2: {
    fontSize: fontSize.caption2,
    fontWeight: fontWeight.medium,
    letterSpacing: letterSpacing.wide,
    lineHeight: fontSize.caption2 * lineHeight.normal,
  },
  // 区段标题（全大写）
  sectionHeader: {
    fontSize: fontSize.footnote,
    fontWeight: fontWeight.medium,
    letterSpacing: letterSpacing.widest,
    lineHeight: fontSize.footnote * lineHeight.snug,
  },
} as const

// ─── 触摸目标（Apple HIG 最低 44pt） ──────────────────────────────────────────
export const touchTarget = {
  minimum: 44,
  comfortable: 48,
  large: 56,
} as const

// ─── 工具函数 ─────────────────────────────────────────────────────────────────
export const getColors = (isDark: boolean) => isDark ? darkColors : lightColors
