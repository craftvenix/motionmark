import { withAlpha } from './colors'

export interface TextOptions {
  size: number
  family: string
  weight?: number
  color: string
  align?: 'left' | 'center' | 'right'
  tracking?: number
  alpha?: number
  baseline?: CanvasTextBaseline
  italic?: boolean
}

export function fontString(
  size: number,
  family: string,
  weight = 500,
  italic = false,
) {
  return `${italic ? 'italic ' : ''}${weight} ${Math.max(
    1,
    size,
  )}px ${family}`
}

function letterSpacingPx(ctx: CanvasRenderingContext2D, tracking: number) {
  const match = ctx.font.match(/(\d+(?:\.\d+)?)px/)
  const size = match ? Number(match[1]) : 16
  return tracking * size
}

export function trackedWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  tracking = 0,
) {
  const chars = Array.from(text)
  if (!chars.length) return 0
  let width = 0
  for (const char of chars) width += ctx.measureText(char).width
  return width + Math.max(0, chars.length - 1) * letterSpacingPx(ctx, tracking)
}

export function drawTrackedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: TextOptions,
) {
  const {
    size,
    family,
    weight = 500,
    color,
    align = 'left',
    tracking = 0,
    alpha = 1,
    baseline = 'alphabetic',
    italic = false,
  } = options
  ctx.save()
  ctx.font = fontString(size, family, weight, italic)
  ctx.fillStyle = color
  ctx.globalAlpha = alpha
  ctx.textBaseline = baseline
  const chars = Array.from(text)
  const spacing = letterSpacingPx(ctx, tracking)
  const width = trackedWidth(ctx, text, tracking)
  let cursor = x
  if (align === 'center') cursor -= width / 2
  if (align === 'right') cursor -= width
  for (const char of chars) {
    ctx.fillText(char, cursor, y)
    cursor += ctx.measureText(char).width + spacing
  }
  ctx.restore()
  return width
}

export function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  size: number,
  family: string,
  weight = 500,
  tracking = 0,
  min = 8,
) {
  let candidate = size
  while (candidate > min) {
    ctx.font = fontString(candidate, family, weight)
    if (trackedWidth(ctx, text, tracking) <= maxWidth) return candidate
    candidate -= Math.max(1, candidate * 0.04)
  }
  return min
}

export function drawTrackedTextFit(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  options: TextOptions,
) {
  const size = fitFontSize(
    ctx,
    text,
    maxWidth,
    options.size,
    options.family,
    options.weight,
    options.tracking,
  )
  return drawTrackedText(ctx, text, x, y, { ...options, size })
}

export function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
}

export function fillRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string | CanvasGradient,
) {
  roundRectPath(ctx, x, y, width, height, radius)
  ctx.fillStyle = fill
  ctx.fill()
}

export function strokeRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  stroke: string,
  lineWidth = 1,
) {
  roundRectPath(ctx, x, y, width, height, radius)
  ctx.strokeStyle = stroke
  ctx.lineWidth = lineWidth
  ctx.stroke()
}

export function drawGrain(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  opacity = 0.07,
  density = 0.00022,
  seed = 7,
) {
  let state = seed >>> 0
  const rand = () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
  const count = Math.floor(width * height * density)
  ctx.save()
  ctx.globalAlpha = opacity
  for (let i = 0; i < count; i++) {
    const x = rand() * width
    const y = rand() * height
    const size = rand() * 1.7 + 0.35
    ctx.fillStyle = rand() > 0.5 ? '#FFFFFF' : '#000000'
    ctx.fillRect(x, y, size, size)
  }
  ctx.restore()
}

export function drawVignette(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  strength = 0.4,
) {
  const gradient = ctx.createRadialGradient(
    width / 2,
    height * 0.46,
    Math.min(width, height) * 0.12,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.72,
  )
  gradient.addColorStop(0, 'rgba(0,0,0,0)')
  gradient.addColorStop(1, `rgba(0,0,0,${strength})`)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}

export function drawImageCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  align: 'center' | 'top' | 'bottom' = 'center',
) {
  const ratio = image.naturalWidth / image.naturalHeight || 1
  const frameRatio = width / height
  let dw = width
  let dh = height
  if (ratio > frameRatio) {
    dh = height
    dw = height * ratio
  } else {
    dw = width
    dh = width / ratio
  }
  const dx = x + (width - dw) / 2
  let dy = y + (height - dh) / 2
  if (align === 'top') dy = y
  if (align === 'bottom') dy = y + height - dh
  ctx.drawImage(image, dx, dy, dw, dh)
}

export function drawSoftShadow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  blur: number,
  color = 'rgba(0,0,0,0.24)',
) {
  ctx.save()
  ctx.filter = `blur(${blur}px)`
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.ellipse(x, y, width / 2, height / 2, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

export function drawTextureLines(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  gap = 5,
  alpha = 0.12,
) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, width, height)
  ctx.clip()
  ctx.strokeStyle = withAlpha(color, alpha)
  ctx.lineWidth = 1
  for (let yy = y; yy < y + height; yy += gap) {
    ctx.beginPath()
    ctx.moveTo(x, yy)
    ctx.lineTo(x + width, yy + 1.2)
    ctx.stroke()
  }
  ctx.restore()
}
