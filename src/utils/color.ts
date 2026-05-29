const clampOpacity = (opacity: number) => {
  if (!Number.isFinite(opacity)) return 100
  return Math.max(0, Math.min(100, opacity))
}

interface RgbaColor {
  r: number
  g: number
  b: number
  a: number
}

const formatRgba = ({ r, g, b, a }: RgbaColor) => {
  const safeAlpha = Math.max(0, Math.min(1, a))
  return `rgba(${r}, ${g}, ${b}, ${Number(safeAlpha.toFixed(3))})`
}

export const parseColorToRgba = (color: string): RgbaColor | null => {
  const value = color.trim()
  if (value == 'transparent') return { r: 0, g: 0, b: 0, a: 0 }

  const rgbaMatch = /^rgba?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([\d.]+))?\s*\)$/i.exec(value)
  if (rgbaMatch) {
    return {
      r: Math.max(0, Math.min(255, Number(rgbaMatch[1]))),
      g: Math.max(0, Math.min(255, Number(rgbaMatch[2]))),
      b: Math.max(0, Math.min(255, Number(rgbaMatch[3]))),
      a: rgbaMatch[4] == null ? 1 : Math.max(0, Math.min(1, Number(rgbaMatch[4]))),
    }
  }

  const hexMatch = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value)
  if (!hexMatch) return null
  const hex = hexMatch[1]
  if (hex.length == 3) {
    return {
      r: parseInt(hex[0] + hex[0], 16),
      g: parseInt(hex[1] + hex[1], 16),
      b: parseInt(hex[2] + hex[2], 16),
      a: 1,
    }
  }
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
    a: 1,
  }
}

export const applyColorOpacity = (color: string, opacity: number) => {
  const rgba = parseColorToRgba(color)
  if (!rgba) return color
  if (rgba.a <= 0) return formatRgba({ ...rgba, a: 0 })
  return formatRgba({ ...rgba, a: clampOpacity(opacity) / 100 })
}

export const normalizeColorAlphaToOpacity = (color: string) => {
  const rgba = parseColorToRgba(color)
  if (!rgba) return null
  if (rgba.a == 1) return null

  return {
    color: formatRgba({ ...rgba, a: rgba.a <= 0 ? 0 : 1 }),
    opacity: Math.round(rgba.a * 100),
  }
}
