export interface RGB {
  r: number
  g: number
  b: number
}

const clampChannel = (v: number) => Math.min(255, Math.max(0, Math.round(v)))

export function hexToRgb(hex: string): RGB {
  const clean = normalizeHex(hex)
  if (!clean) return { r: 0, g: 0, b: 0 }
  return {
    r: parseInt(clean.slice(1, 3), 16),
    g: parseInt(clean.slice(3, 5), 16),
    b: parseInt(clean.slice(5, 7), 16),
  }
}

export function rgbToHex({ r, g, b }: RGB) {
  return `#${[r, g, b]
    .map((v) => clampChannel(v).toString(16).padStart(2, '0'))
    .join('')}`.toUpperCase()
}

export function normalizeHex(value: string) {
  const trimmed = value.trim()
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toUpperCase()
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    return `#${trimmed
      .slice(1)
      .split('')
      .map((c) => c + c)
      .join('')}`.toUpperCase()
  }
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) return `#${trimmed}`.toUpperCase()
  return null
}

export function isValidHex(value: string) {
  return normalizeHex(value) !== null
}

export function withAlpha(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function mix(a: string, b: string, t: number) {
  const ca = hexToRgb(a)
  const cb = hexToRgb(b)
  return rgbToHex({
    r: ca.r + (cb.r - ca.r) * t,
    g: ca.g + (cb.g - ca.g) * t,
    b: ca.b + (cb.b - ca.b) * t,
  })
}

export function luminance(hex: string) {
  const { r, g, b } = hexToRgb(hex)
  const a = [r, g, b].map((channel) => {
    const s = channel / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]
}

export function contrastText(background: string) {
  return luminance(background) > 0.4 ? '#151310' : '#F7F3EA'
}

export function shade(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex)
  if (amount >= 0) {
    return rgbToHex({
      r: r + (255 - r) * amount,
      g: g + (255 - g) * amount,
      b: b + (255 - b) * amount,
    })
  }
  return rgbToHex({
    r: r * (1 + amount),
    g: g * (1 + amount),
    b: b * (1 + amount),
  })
}

export function rgbString(hex: string) {
  const { r, g, b } = hexToRgb(hex)
  return `${r}, ${g}, ${b}`
}

export function cmykString(hex: string) {
  const { r, g, b } = hexToRgb(hex)
  const rr = r / 255
  const gg = g / 255
  const bb = b / 255
  const k = 1 - Math.max(rr, gg, bb)
  if (k >= 1) return '0, 0, 0, 100'
  const c = (1 - rr - k) / (1 - k)
  const m = (1 - gg - k) / (1 - k)
  const y = (1 - bb - k) / (1 - k)
  return `${Math.round(c * 100)}, ${Math.round(m * 100)}, ${Math.round(
    y * 100,
  )}, ${Math.round(k * 100)}`
}
