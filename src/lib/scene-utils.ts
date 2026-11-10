import type { BrandConfig, ProductId } from '../types'
import { drawGrain, drawTrackedText, drawTrackedTextFit, drawVignette, fontString, roundRectPath } from './canvas'
import { withAlpha } from './colors'
import { drawLogo, getLoadedImage } from './logo'
import { getProductImage } from './products'

export function drawBackdrop(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  top: string,
  bottom: string,
  glow?: { color: string; x?: number; y?: number; radius?: number; alpha?: number },
) {
  const gradient = ctx.createLinearGradient(0, 0, width * 0.24, height)
  gradient.addColorStop(0, top)
  gradient.addColorStop(0.58, bottom)
  gradient.addColorStop(1, top)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
  if (glow) {
    const radial = ctx.createRadialGradient(
      glow.x ?? width * 0.5,
      glow.y ?? height * 0.45,
      0,
      glow.x ?? width * 0.5,
      glow.y ?? height * 0.45,
      glow.radius ?? Math.max(width, height) * 0.6,
    )
    radial.addColorStop(0, withAlpha(glow.color, glow.alpha ?? 0.16))
    radial.addColorStop(1, withAlpha(glow.color, 0))
    ctx.fillStyle = radial
    ctx.fillRect(0, 0, width, height)
  }
}

export function drawEyebrow(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  align: 'left' | 'center' | 'right' = 'left',
  alpha = 0.6,
) {
  drawTrackedText(ctx, text.toUpperCase(), x, y, {
    size: 18,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color,
    align,
    tracking: 0.24,
    alpha,
  })
}

export function drawCornerMarks(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string,
  margin: number,
  size: number,
  alpha = 0.42,
) {
  ctx.save()
  ctx.strokeStyle = withAlpha(color, alpha)
  ctx.lineWidth = 1.5
  const points: Array<[number, number, number, number]> = [
    [margin, margin + size, margin, margin],
    [margin, margin, margin + size, margin],
    [width - margin - size, margin, width - margin, margin],
    [width - margin, margin, width - margin, margin + size],
    [margin, height - margin - size, margin, height - margin],
    [margin, height - margin, margin + size, height - margin],
    [width - margin - size, height - margin, width - margin, height - margin],
    [width - margin, height - margin - size, width - margin, height - margin],
  ]
  for (const [x1, y1, x2, y2] of points) {
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }
  ctx.restore()
}

export function drawHairline(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  color: string,
  alpha = 0.3,
  lineWidth = 1,
) {
  ctx.save()
  ctx.strokeStyle = withAlpha(color, alpha)
  ctx.lineWidth = lineWidth
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + width, y)
  ctx.stroke()
  ctx.restore()
}

export function drawEndCard(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: BrandConfig,
  progress: number,
  portrait = false,
) {
  const logo = getLoadedImage(config.logoDataUrl)
  const alpha = Math.max(0, Math.min(1, progress))
  if (alpha <= 0) return
  const e = 1 - Math.pow(1 - alpha, 3)
  ctx.save()
  ctx.globalAlpha = alpha
  drawBackdrop(ctx, width, height, config.dark, '#080807', {
    color: config.primary,
    x: width * 0.5,
    y: height * 0.46,
    radius: Math.max(width, height) * 0.55,
    alpha: 0.12,
  })

  const markSize = Math.min(width, height) * (portrait ? 0.088 : 0.07)
  const centerY = height * (portrait ? 0.43 : 0.42)
  drawLogo(
    ctx,
    logo,
    width / 2,
    centerY - markSize * 0.08,
    markSize * config.logoSize,
    config.light,
    e,
  )

  drawTrackedTextFit(ctx, config.brandName, width / 2, centerY + markSize * 0.72, width * 0.68, {
    size: portrait ? 74 : 72,
    family: `"${config.fontFamily}", sans-serif`,
    weight: config.fontWeight,
    color: config.light,
    align: 'center',
    tracking: config.tracking,
    alpha: Math.max(0, Math.min(1, (alpha - 0.18) / 0.82)),
  })

  drawTrackedText(ctx, config.tagline.toUpperCase(), width / 2, centerY + markSize * 0.72 + (portrait ? 55 : 48), {
    size: portrait ? 18 : 17,
    family: '"Space Grotesk", sans-serif',
    weight: 400,
    color: withAlpha(config.light, 0.5),
    align: 'center',
    tracking: 0.32,
    alpha: Math.max(0, Math.min(1, (alpha - 0.32) / 0.68)),
  })

  const lineWidth = Math.min(width * 0.2, 220) * e
  ctx.strokeStyle = withAlpha(config.primary, 0.7 * alpha)
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(width / 2 - lineWidth / 2, height * (portrait ? 0.77 : 0.79))
  ctx.lineTo(width / 2 + lineWidth / 2, height * (portrait ? 0.77 : 0.79))
  ctx.stroke()

  drawTrackedText(ctx, config.website.toUpperCase(), width / 2, height * (portrait ? 0.81 : 0.84), {
    size: portrait ? 16 : 15,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.light, 0.62),
    align: 'center',
    tracking: 0.28,
    alpha: Math.max(0, Math.min(1, (alpha - 0.46) / 0.54)),
  })

  drawGrain(ctx, width, height, 0.04, 0.00012, 101)
  drawVignette(ctx, width, height, 0.18)
  ctx.restore()
}

export function getMockupImage(product: ProductId, config: BrandConfig) {
  const localUrl = getProductImage(product, config)
  return localUrl ? getLoadedImage(localUrl) : null
}

export function drawGlassPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string | CanvasGradient,
  stroke: string,
) {
  ctx.save()
  roundRectPath(ctx, x, y, width, height, radius)
  ctx.fillStyle = fill
  ctx.fill()
  ctx.strokeStyle = stroke
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.restore()
}

export function drawWordmark(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  size: number,
  config: BrandConfig,
  color: string,
  align: 'left' | 'center' | 'right' = 'center',
  alpha = 1,
  tracking = config.tracking,
) {
  return drawTrackedTextFit(ctx, text, x, y, maxWidth, {
    size,
    family: `"${config.fontFamily}", sans-serif`,
    weight: config.fontWeight,
    color,
    align,
    tracking,
    alpha,
  })
}

export function setCanvasFont(
  ctx: CanvasRenderingContext2D,
  size: number,
  family: string,
  weight = 500,
) {
  ctx.font = fontString(size, `"${family}", sans-serif`, weight)
}
