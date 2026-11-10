import type { BrandConfig, ProductId, SceneId } from '../types'
import {
  drawGrain,
  drawImageCover,
  drawTrackedText,
  drawTrackedTextFit,
  fillRoundRect,
  fontString,
  roundRectPath,
  strokeRoundRect,
  trackedWidth,
} from './canvas'
import {
  cmykString,
  luminance,
  rgbString,
  shade,
  withAlpha,
} from './colors'
import { anim, clamp, easeOutCubic, layerTime, smoothstep } from './easing'
import { drawLogo, getLoadedImage } from './logo'
import { productIds, productMeta, sceneSeconds, REEL_MAX_DURATION } from './presets'
import {
  drawBackdrop,
  drawCornerMarks,
  drawEyebrow,
  drawGlassPanel,
  drawHairline,
  getMockupImage,
} from './scene-utils'

interface SceneArgs {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  config: BrandConfig
  sceneId: SceneId
  index: number
  local: number
  duration: number
}

function reelLayer(
  local: number,
  config: BrandConfig,
  key: 'logo' | 'text' | 'background',
  duration: number,
) {
  return layerTime(local, config.layers[key], duration)
}

function drawLetterReveal(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  baseline: number,
  size: number,
  config: BrandConfig,
  color: string,
  progressFor: (index: number) => number,
  maxWidth: number,
) {
  ctx.save()
  ctx.font = fontString(size, `"${config.fontFamily}", sans-serif`, config.fontWeight)
  const rawWidth = trackedWidth(ctx, text, config.tracking)
  const fitted = rawWidth > maxWidth ? size * (maxWidth / rawWidth) : size
  ctx.font = fontString(fitted, `"${config.fontFamily}", sans-serif`, config.fontWeight)
  const chars = Array.from(text)
  const widths = chars.map((char) => ctx.measureText(char).width)
  const spacing = fitted * config.tracking
  const total =
    widths.reduce((sum, width) => sum + width, 0) +
    spacing * Math.max(0, chars.length - 1)
  let x = centerX - total / 2
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = color
  chars.forEach((char, index) => {
    const p = progressFor(index)
    const eased = easeOutCubic(clamp(p))
    ctx.globalAlpha = clamp(p)
    ctx.fillText(char, x, baseline + (1 - eased) * fitted * 0.56)
    x += widths[index] + spacing
  })
  ctx.restore()
  return fitted
}

function wordmarkScene({
  ctx,
  width,
  height,
  config,
  local,
  duration,
  index,
}: SceneArgs) {
  const D = duration
  const t = clamp(local / D)
  const bgT = reelLayer(local, config, 'background', D)
  const logoT = reelLayer(local, config, 'logo', D)
  const textT = reelLayer(local, config, 'text', D)
  const logo = getLoadedImage(config.logoDataUrl)
  const driftX = Math.sin(t * 1.4) * width * 0.008
  const driftY = Math.cos(t * 1.1) * height * 0.005

  drawBackdrop(ctx, width, height, config.dark, '#0A0A09', {
    color: config.primary,
    x: width * 0.52,
    y: height * 0.38,
    radius: width * 0.66,
    alpha: 0.14,
  })
  ctx.save()
  ctx.strokeStyle = withAlpha(config.light, 0.05)
  ctx.lineWidth = 1
  for (let i = 0; i < 7; i++) {
    ctx.beginPath()
    ctx.moveTo(width * 0.06, height * (0.15 + i * 0.11))
    ctx.lineTo(width * 0.94, height * (0.15 + i * 0.11))
    ctx.stroke()
  }
  ctx.restore()

  ctx.save()
  ctx.translate(driftX, driftY)
  const logoP = anim(logoT, 0, D * 0.36, config.layers.logo.easing)
  drawLogo(ctx, logo, width * 0.5, height * 0.25, width * 0.052 * config.logoSize, config.light, logoP * 0.78)

  const enter = anim(bgT, 0, D * 0.5, 'easeOutCubic')
  drawHairline(ctx, width * 0.5 - 90 * enter, height * 0.31, 180 * enter, config.primary, 0.7)

  const size = width * 0.176
  drawLetterReveal(
    ctx,
    config.brandName,
    width * 0.5,
    height * 0.55,
    size,
    config,
    config.light,
    (i) =>
      anim(
        textT,
        D * 0.08 + i * 0.032,
        D * 0.42,
        config.layers.text.easing,
      ),
    width * 0.86,
  )

  const tagP = anim(textT, D * 0.44, D * 0.3, 'easeOutCubic')
  drawTrackedText(ctx, config.tagline.toUpperCase(), width * 0.5, height * 0.61, {
    size: width * 0.0165,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.secondary, 0.8),
    align: 'center',
    tracking: 0.36,
    alpha: tagP,
  })

  drawEyebrow(ctx, `Identity / ${String(index + 1).padStart(2, '0')}`, width * 0.09, height * 0.12, config.light, 'left', 0.48)
  drawEyebrow(ctx, 'Wordmark', width * 0.91, height * 0.12, config.light, 'right', 0.3)
  drawEyebrow(ctx, config.website, width * 0.5, height * 0.88, config.light, 'center', 0.34 * tagP)

  // subtle lens marks
  ctx.strokeStyle = withAlpha(config.light, 0.12)
  ctx.beginPath()
  ctx.arc(width * 0.5, height * 0.44, width * 0.43, Math.PI * 1.08, Math.PI * 1.34)
  ctx.stroke()
  ctx.restore()
  drawCornerMarks(ctx, width, height, config.light, width * 0.065, 22, 0.2)
  drawGrain(ctx, width, height, 0.055, 0.00013, 107)
}

function traceScene({
  ctx,
  width,
  height,
  config,
  local,
  duration,
  index,
}: SceneArgs) {
  const D = duration
  const logoT = reelLayer(local, config, 'logo', D)
  const textT = reelLayer(local, config, 'text', D)
  const logo = getLoadedImage(config.logoDataUrl)
  const cx = width * 0.5
  const cy = height * 0.43

  drawBackdrop(ctx, width, height, config.dark, '#080808', {
    color: config.primary,
    x: cx,
    y: cy,
    radius: width * 0.62,
    alpha: 0.1,
  })
  ctx.strokeStyle = withAlpha(config.secondary, 0.09)
  ctx.lineWidth = 1
  for (let x = 0; x < width; x += width * 0.08) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }

  drawEyebrow(ctx, `Mark / ${String(index + 1).padStart(2, '0')}`, width * 0.09, height * 0.12, config.light, 'left', 0.48)
  drawEyebrow(ctx, 'Outline trace', width * 0.91, height * 0.12, config.light, 'right', 0.3)

  const markH = width * 0.46 * config.logoSize
  const trace = anim(logoT, D * 0.1, D * 0.5, 'easeInOutCubic')
  const fill = anim(logoT, D * 0.42, D * 0.32, config.layers.logo.easing)

  ctx.save()
  ctx.globalAlpha = 0.14
  drawLogo(ctx, logo, cx, cy, markH, config.primary, 1)
  ctx.restore()

  if (trace > 0) {
    ctx.save()
    ctx.beginPath()
    ctx.rect(cx - markH, cy - markH, markH * 2 * trace, markH * 2)
    ctx.clip()
    drawLogo(ctx, logo, cx, cy, markH, config.secondary, 0.98, { outline: true })
    ctx.restore()
  }
  if (fill > 0) {
    drawLogo(ctx, logo, cx, cy, markH, config.light, fill * 0.92, { shadow: true })
  }

  // Reflection
  const reflection = anim(logoT, D * 0.4, D * 0.45, 'easeOutCubic')
  ctx.save()
  ctx.translate(cx, cy + markH * 0.72)
  ctx.scale(1, -0.38)
  ctx.globalAlpha = reflection * 0.075
  drawLogo(ctx, logo, 0, 0, markH * 0.82, config.light, 1)
  ctx.restore()

  // Gloss pass
  const gloss = anim(logoT, D * 0.35, D * 0.48, 'easeInOutCubic')
  if (gloss > 0) {
    ctx.save()
    ctx.beginPath()
    ctx.rect(cx - markH * 0.65, cy - markH * 0.55, markH * 1.3, markH * 1.1)
    ctx.clip()
    const sx = cx - markH * 0.9 + gloss * markH * 2.1
    const gradient = ctx.createLinearGradient(sx - 50, 0, sx + 50, 0)
    gradient.addColorStop(0, 'rgba(255,255,255,0)')
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.38)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.transform(1, 0, -0.35, 1, sx * 0.35, 0)
    ctx.fillRect(sx - 90, cy - markH, 180, markH * 2)
    ctx.restore()
  }

  // Technical rails
  const rail = anim(textT, D * 0.25, D * 0.4, 'easeOutCubic')
  ctx.strokeStyle = withAlpha(config.secondary, 0.3 * rail)
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(width * 0.12, cy + markH * 0.76)
  ctx.lineTo(width * 0.12 + width * 0.76 * rail, cy + markH * 0.76)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(width * 0.12, cy + markH * 0.76 - 8)
  ctx.lineTo(width * 0.12, cy + markH * 0.76 + 8)
  ctx.moveTo(width * 0.88, cy + markH * 0.76 - 8)
  ctx.lineTo(width * 0.88, cy + markH * 0.76 + 8)
  ctx.stroke()
  drawTrackedText(ctx, 'MASTER MARK / 1:1', width * 0.12, cy + markH * 0.76 + 28, {
    size: 13,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.secondary, 0.62),
    tracking: 0.2,
    alpha: rail,
  })

  const wordP = anim(textT, D * 0.55, D * 0.35, config.layers.text.easing)
  drawTrackedTextFit(ctx, config.brandName, cx, height * 0.79, width * 0.62, {
    size: width * 0.062,
    family: `"${config.fontFamily}", sans-serif`,
    weight: config.fontWeight,
    color: config.light,
    align: 'center',
    tracking: config.tracking,
    alpha: wordP,
  })
  drawTrackedText(ctx, config.website.toUpperCase(), cx, height * 0.83, {
    size: 13,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.light, 0.4),
    align: 'center',
    tracking: 0.28,
    alpha: wordP,
  })
  drawCornerMarks(ctx, width, height, config.light, width * 0.065, 22, 0.18)
  drawGrain(ctx, width, height, 0.05, 0.00013, 127)
}

function gridScene({
  ctx,
  width,
  height,
  config,
  local,
  duration,
  index,
}: SceneArgs) {
  const D = duration
  const bgT = reelLayer(local, config, 'background', D)
  const logoT = reelLayer(local, config, 'logo', D)
  const textT = reelLayer(local, config, 'text', D)
  const logo = getLoadedImage(config.logoDataUrl)
  const cx = width * 0.5
  const cy = height * 0.43

  drawBackdrop(ctx, width, height, config.light, shade(config.light, -0.08), {
    color: '#FFFFFF',
    x: width * 0.2,
    y: height * 0.15,
    radius: width * 0.7,
    alpha: 0.3,
  })

  const gridP = anim(bgT, 0, D * 0.5, 'easeOutCubic')
  ctx.save()
  ctx.strokeStyle = withAlpha(config.dark, 0.08 * gridP)
  ctx.lineWidth = 1
  const step = width * 0.055
  for (let x = width * 0.09; x < width * 0.94; x += step) {
    ctx.beginPath()
    ctx.moveTo(x, height * 0.16)
    ctx.lineTo(x, height * 0.79)
    ctx.stroke()
  }
  for (let y = height * 0.16; y < height * 0.8; y += step) {
    ctx.beginPath()
    ctx.moveTo(width * 0.09, y)
    ctx.lineTo(width * 0.91, y)
    ctx.stroke()
  }
  ctx.restore()

  drawEyebrow(ctx, `System / ${String(index + 1).padStart(2, '0')}`, width * 0.09, height * 0.12, config.dark, 'left', 0.55)
  drawEyebrow(ctx, 'Construction grid', width * 0.91, height * 0.12, config.dark, 'right', 0.4)

  const rail = anim(bgT, 0, D * 0.55, 'easeInOutCubic')
  const left = width * 0.24
  const right = width * 0.76
  const top = height * 0.25
  const bottom = height * 0.62
  ctx.save()
  ctx.strokeStyle = withAlpha(config.primary, 0.4 * rail)
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(left, top)
  ctx.lineTo(left, top + (bottom - top) * rail)
  ctx.lineTo(left + (right - left) * rail, top + (bottom - top) * rail)
  ctx.stroke()
  ctx.strokeStyle = withAlpha(config.dark, 0.16)
  ctx.setLineDash([5, 7])
  ctx.beginPath()
  ctx.moveTo(cx, top)
  ctx.lineTo(cx, height * 0.72)
  ctx.moveTo(left, cy)
  ctx.lineTo(right, cy)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.restore()

  const circleP = anim(bgT, D * 0.12, D * 0.45, 'easeOutCubic')
  ctx.save()
  ctx.strokeStyle = withAlpha(config.primary, 0.34)
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.arc(cx, cy, width * 0.22 * circleP, 0, Math.PI * 2)
  ctx.stroke()
  ctx.strokeStyle = withAlpha(config.secondary, 0.5)
  ctx.setLineDash([4, 9])
  ctx.beginPath()
  ctx.arc(cx, cy, width * 0.17 * circleP, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.restore()

  const markP = anim(logoT, D * 0.12, D * 0.42, config.layers.logo.easing)
  const markH = width * 0.3 * config.logoSize
  drawLogo(ctx, logo, cx, cy, markH, config.dark, markP * 0.94, {
    outline: false,
    rotation: (1 - markP) * -0.06,
  })

  // Measurement annotations
  const labels = [
    [left, top, 'A'],
    [right, top, 'B'],
    [left, bottom, 'C'],
    [right, bottom, 'D'],
  ] as const
  labels.forEach(([x, y, label]) => {
    ctx.fillStyle = withAlpha(config.primary, 0.9 * rail)
    ctx.beginPath()
    ctx.arc(x, y, 3.5, 0, Math.PI * 2)
    ctx.fill()
    drawTrackedText(ctx, label, x - 14, y - 10, {
      size: 11,
      family: '"Space Grotesk", sans-serif',
      weight: 600,
      color: withAlpha(config.primary, 0.72),
      tracking: 0.15,
      alpha: rail,
    })
  })
  drawTrackedText(ctx, `${Math.round(width * 0.44)} PX`, right + 16, (top + bottom) / 2, {
    size: 12,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.dark, 0.45),
    tracking: 0.12,
    alpha: rail,
  })
  drawTrackedText(ctx, 'OPTICAL AXIS', cx + 15, bottom + 25, {
    size: 11,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.dark, 0.4),
    tracking: 0.18,
    alpha: rail,
  })

  const wordP = anim(textT, D * 0.45, D * 0.32, config.layers.text.easing)
  drawTrackedTextFit(ctx, config.brandName, cx, height * 0.72, width * 0.58, {
    size: width * 0.07,
    family: `"${config.fontFamily}", sans-serif`,
    weight: config.fontWeight,
    color: config.dark,
    align: 'center',
    tracking: config.tracking,
    alpha: wordP,
  })
  drawTrackedText(ctx, '8PT GRID / 1080 × 1920', cx, height * 0.765, {
    size: 12,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.dark, 0.4),
    align: 'center',
    tracking: 0.26,
    alpha: wordP,
  })
  drawCornerMarks(ctx, width, height, config.dark, width * 0.065, 22, 0.18)
  drawGrain(ctx, width, height, 0.045, 0.00011, 149)
}

function phoneScene({
  ctx,
  width,
  height,
  config,
  local,
  duration,
  index,
}: SceneArgs) {
  const D = duration
  const logoT = reelLayer(local, config, 'logo', D)
  const textT = reelLayer(local, config, 'text', D)
  const logo = getLoadedImage(config.logoDataUrl)

  drawBackdrop(ctx, width, height, shade(config.primary, -0.5), config.dark, {
    color: config.primary,
    x: width * 0.48,
    y: height * 0.37,
    radius: width * 0.75,
    alpha: 0.42,
  })
  // Floating colour discs
  const discP = anim(reelLayer(local, config, 'background', D), 0, D * 0.5, 'easeOutCubic')
  ctx.save()
  ctx.globalAlpha = discP * 0.7
  ctx.fillStyle = withAlpha(config.secondary, 0.22)
  ctx.beginPath()
  ctx.arc(width * 0.2, height * 0.25, width * 0.15, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = withAlpha(config.primary, 0.32)
  ctx.beginPath()
  ctx.arc(width * 0.83, height * 0.66, width * 0.22, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  drawEyebrow(ctx, `Digital / ${String(index + 1).padStart(2, '0')}`, width * 0.09, height * 0.12, config.light, 'left', 0.5)
  drawEyebrow(ctx, 'App icon', width * 0.91, height * 0.12, config.light, 'right', 0.3)

  const enter = anim(logoT, 0, D * 0.4, 'easeOutCubic')
  const phoneW = width * 0.55
  const phoneH = height * 0.59
  ctx.save()
  ctx.translate(width * 0.5, height * 0.47)
  ctx.rotate(-0.015 + (1 - enter) * 0.055)
  const scale = 0.86 + enter * 0.14
  ctx.scale(scale, scale)
  ctx.globalAlpha = enter
  drawPhone(ctx, phoneW, phoneH, config, logo, local, D)
  ctx.restore()

  drawTrackedText(ctx, 'AVAILABLE ON iOS', width * 0.5, height * 0.85, {
    size: 12,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.light, 0.42),
    align: 'center',
    tracking: 0.32,
    alpha: anim(textT, D * 0.55, D * 0.25, 'easeOutCubic'),
  })
  drawCornerMarks(ctx, width, height, config.light, width * 0.065, 22, 0.18)
  drawGrain(ctx, width, height, 0.055, 0.00013, 173)
}

function drawPhone(
  ctx: CanvasRenderingContext2D,
  phoneW: number,
  phoneH: number,
  config: BrandConfig,
  logo: HTMLImageElement | null,
  local: number,
  duration: number,
) {
  const x = -phoneW / 2
  const y = -phoneH / 2
  const radius = phoneW * 0.13

  // Ground shadow
  ctx.save()
  ctx.filter = 'blur(32px)'
  ctx.fillStyle = 'rgba(0,0,0,0.5)'
  ctx.beginPath()
  ctx.ellipse(0, phoneH * 0.53, phoneW * 0.45, phoneH * 0.025, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // Metallic frame
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.55)'
  ctx.shadowBlur = 42
  ctx.shadowOffsetY = 26
  const frame = ctx.createLinearGradient(x, y, x + phoneW, y + phoneH)
  frame.addColorStop(0, '#77736B')
  frame.addColorStop(0.18, '#CFC9BB')
  frame.addColorStop(0.5, '#4B4843')
  frame.addColorStop(0.82, '#B7B1A4')
  frame.addColorStop(1, '#2A2926')
  fillRoundRect(ctx, x, y, phoneW, phoneH, radius, frame)
  ctx.restore()

  ctx.save()
  const inner = ctx.createLinearGradient(x, y, x + phoneW, y + phoneH)
  inner.addColorStop(0, '#191917')
  inner.addColorStop(1, '#090909')
  fillRoundRect(ctx, x + 4, y + 4, phoneW - 8, phoneH - 8, radius - 3, inner)
  ctx.restore()

  // Side buttons
  ctx.fillStyle = '#6E6A62'
  fillRoundRect(ctx, x - 3, y + phoneH * 0.18, 5, phoneH * 0.07, 3, '#77736B')
  fillRoundRect(ctx, x - 3, y + phoneH * 0.28, 5, phoneH * 0.11, 3, '#77736B')
  fillRoundRect(ctx, x + phoneW - 2, y + phoneH * 0.23, 5, phoneH * 0.12, 3, '#77736B')

  // Screen
  const inset = phoneW * 0.032
  const screenX = x + inset
  const screenY = y + inset
  const screenW = phoneW - inset * 2
  const screenH = phoneH - inset * 2
  const screenR = radius - inset
  ctx.save()
  roundRectPath(ctx, screenX, screenY, screenW, screenH, screenR)
  ctx.clip()
  drawBackdrop(ctx, screenW, screenH, config.dark, '#0C0C0B')
  ctx.translate(screenX, screenY)
  drawPhoneUI(ctx, screenW, screenH, config, logo, local, duration)
  ctx.restore()

  // Glass reflection
  ctx.save()
  roundRectPath(ctx, screenX, screenY, screenW, screenH, screenR)
  ctx.clip()
  ctx.translate(screenX, screenY)
  ctx.globalAlpha = 0.12
  const glass = ctx.createLinearGradient(0, 0, screenW, screenH)
  glass.addColorStop(0, 'rgba(255,255,255,0.55)')
  glass.addColorStop(0.28, 'rgba(255,255,255,0)')
  glass.addColorStop(0.7, 'rgba(255,255,255,0)')
  glass.addColorStop(1, 'rgba(255,255,255,0.2)')
  ctx.fillStyle = glass
  ctx.fillRect(0, 0, screenW, screenH)
  ctx.restore()

  strokeRoundRect(ctx, screenX, screenY, screenW, screenH, screenR, 'rgba(255,255,255,0.18)', 1)
}

function drawPhoneUI(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  config: BrandConfig,
  logo: HTMLImageElement | null,
  local: number,
  duration: number,
) {
  const bg = ctx.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, shade(config.primary, -0.12))
  bg.addColorStop(0.48, config.dark)
  bg.addColorStop(1, '#090909')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  const glow = ctx.createRadialGradient(w * 0.5, h * 0.12, 10, w * 0.5, h * 0.12, w * 0.7)
  glow.addColorStop(0, withAlpha(config.secondary, 0.26))
  glow.addColorStop(1, withAlpha(config.secondary, 0))
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, w, h)

  // Status bar + dynamic island
  ctx.fillStyle = '#F7F3EA'
  ctx.font = '600 14px "Space Grotesk", sans-serif'
  ctx.fillText('9:41', 30, 34)
  ctx.font = '600 12px "Space Grotesk", sans-serif'
  ctx.fillText('5G', w - 64, 34)
  fillRoundRect(ctx, w - 48, 24, 20, 10, 3, '#F7F3EA')
  fillRoundRect(ctx, w / 2 - 61, 20, 122, 33, 16, '#050505')

  // App icon
  const iconSize = w * 0.25
  const iconX = w / 2 - iconSize / 2
  const iconY = h * 0.11
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.44)'
  ctx.shadowBlur = 28
  ctx.shadowOffsetY = 13
  const iconGrad = ctx.createLinearGradient(iconX, iconY, iconX + iconSize, iconY + iconSize)
  iconGrad.addColorStop(0, shade(config.primary, 0.1))
  iconGrad.addColorStop(1, shade(config.primary, -0.3))
  fillRoundRect(ctx, iconX, iconY, iconSize, iconSize, iconSize * 0.24, iconGrad)
  ctx.restore()
  strokeRoundRect(ctx, iconX, iconY, iconSize, iconSize, iconSize * 0.24, 'rgba(255,255,255,0.22)', 1)
  drawLogo(ctx, logo, w / 2, iconY + iconSize * 0.5, iconSize * 0.48 * config.logoSize, config.light, 0.96)

  drawTrackedTextFit(ctx, config.brandName, w / 2, iconY + iconSize + 46, w * 0.64, {
    size: 30,
    family: `"${config.fontFamily}", sans-serif`,
    weight: config.fontWeight,
    color: config.light,
    align: 'center',
    tracking: config.tracking,
  })
  drawTrackedText(ctx, config.tagline.toUpperCase(), w / 2, iconY + iconSize + 70, {
    size: 9,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.light, 0.46),
    align: 'center',
    tracking: 0.28,
  })

  // Interface card
  const cardX = 30
  const cardY = h * 0.48
  const cardW = w - 60
  const cardH = h * 0.24
  const cardGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH)
  cardGrad.addColorStop(0, withAlpha(config.light, 0.1))
  cardGrad.addColorStop(1, withAlpha(config.light, 0.035))
  drawGlassPanel(ctx, cardX, cardY, cardW, cardH, 24, cardGrad, 'rgba(255,255,255,0.1)')
  ctx.save()
  ctx.beginPath()
  roundRectPath(ctx, cardX, cardY, cardW, cardH, 24)
  ctx.clip()
  const art = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH)
  art.addColorStop(0, withAlpha(config.secondary, 0.24))
  art.addColorStop(1, withAlpha(config.primary, 0.04))
  ctx.fillStyle = art
  ctx.fillRect(cardX, cardY, cardW, cardH)
  ctx.globalAlpha = 0.28
  drawLogo(ctx, logo, cardX + cardW * 0.5, cardY + cardH * 0.45, cardH * 0.6, config.light, 1, {
    rotation: -0.12,
  })
  ctx.restore()
  drawTrackedText(ctx, 'THE HOUSE', cardX + 22, cardY + cardH - 48, {
    size: 9,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.light, 0.5),
    tracking: 0.24,
  })
  drawTrackedTextFit(ctx, 'Quiet objects, considered.', cardX + 22, cardY + cardH - 24, cardW - 44, {
    size: 18,
    family: `"${config.fontFamily}", sans-serif`,
    weight: 500,
    color: config.light,
    tracking: 0,
  })

  // Secondary tile
  const tileY = cardY + cardH + 18
  const tileW = (cardW - 12) / 2
  const tileH = h * 0.12
  ctx.fillStyle = withAlpha(config.light, 0.06)
  fillRoundRect(ctx, cardX, tileY, tileW, tileH, 20, withAlpha(config.light, 0.06))
  fillRoundRect(ctx, cardX + tileW + 12, tileY, tileW, tileH, 20, withAlpha(config.primary, 0.16))
  drawTrackedText(ctx, 'COLLECTION', cardX + 18, tileY + 28, {
    size: 8,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.light, 0.48),
    tracking: 0.22,
  })
  drawTrackedText(ctx, '12 OBJECTS', cardX + 18, tileY + 55, {
    size: 15,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: config.light,
    tracking: 0.1,
  })
  drawTrackedText(ctx, 'ATELIER', cardX + tileW + 30, tileY + 28, {
    size: 8,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.light, 0.48),
    tracking: 0.22,
  })
  drawTrackedText(ctx, 'PARIS / 48', cardX + tileW + 30, tileY + 55, {
    size: 15,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: config.light,
    tracking: 0.1,
  })

  // Tab bar
  const navY = h - 84
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.beginPath()
  ctx.moveTo(30, navY - 18)
  ctx.lineTo(w - 30, navY - 18)
  ctx.stroke()
  const icons = ['◒', '◇', '⌕', '◯']
  icons.forEach((icon, i) => {
    const ix = 60 + i * ((w - 120) / 3)
    drawTrackedText(ctx, icon, ix, navY + 16, {
      size: 18,
      family: '"Space Grotesk", sans-serif',
      weight: i === 0 ? 600 : 400,
      color: i === 0 ? config.light : withAlpha(config.light, 0.34),
      align: 'center',
    })
  })
  fillRoundRect(ctx, w / 2 - 52, h - 18, 104, 4, 2, 'rgba(255,255,255,0.5)')

  // subtle UI motion
  const shimmer = (local * 0.22) % 1
  ctx.save()
  ctx.globalAlpha = 0.08
  ctx.fillStyle = '#FFFFFF'
  ctx.transform(1, 0, -0.35, 1, shimmer * w * 1.6, 0)
  ctx.fillRect(-60, 0, 40, h)
  ctx.restore()
  void duration
}

function browserScene({
  ctx,
  width,
  height,
  config,
  local,
  duration,
  index,
}: SceneArgs) {
  const D = duration
  const bgT = reelLayer(local, config, 'background', D)
  const textT = reelLayer(local, config, 'text', D)
  const logo = getLoadedImage(config.logoDataUrl)

  drawBackdrop(ctx, width, height, shade(config.secondary, -0.18), shade(config.light, -0.08), {
    color: config.light,
    x: width * 0.5,
    y: height * 0.22,
    radius: width * 0.7,
    alpha: 0.36,
  })
  ctx.save()
  ctx.globalAlpha = 0.24
  ctx.strokeStyle = config.dark
  ctx.lineWidth = 1
  for (let i = 0; i < 12; i++) {
    ctx.beginPath()
    ctx.moveTo(0, height * 0.1 + i * height * 0.075)
    ctx.lineTo(width, height * 0.1 + i * height * 0.075)
    ctx.stroke()
  }
  ctx.restore()

  drawEyebrow(ctx, `Digital / ${String(index + 1).padStart(2, '0')}`, width * 0.09, height * 0.12, config.dark, 'left', 0.5)
  drawEyebrow(ctx, 'Browser', width * 0.91, height * 0.12, config.dark, 'right', 0.36)

  const enter = anim(bgT, 0, D * 0.45, 'easeOutCubic')
  const browserW = width * 0.86
  const browserH = height * 0.54
  ctx.save()
  ctx.translate(width * 0.5, height * 0.46)
  ctx.rotate(-0.018)
  ctx.scale(0.9 + enter * 0.1, 0.9 + enter * 0.1)
  ctx.globalAlpha = enter
  drawBrowserWindow(ctx, browserW, browserH, config, logo, local, D)
  ctx.restore()

  drawTrackedText(ctx, 'A QUIET DIGITAL HOME', width * 0.5, height * 0.79, {
    size: 12,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.dark, 0.5),
    align: 'center',
    tracking: 0.34,
    alpha: anim(textT, D * 0.52, D * 0.25, 'easeOutCubic'),
  })
  drawCornerMarks(ctx, width, height, config.dark, width * 0.065, 22, 0.18)
  drawGrain(ctx, width, height, 0.042, 0.00011, 197)
}

function drawBrowserWindow(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  config: BrandConfig,
  logo: HTMLImageElement | null,
  local: number,
  duration: number,
) {
  const x = -w / 2
  const y = -h / 2
  const r = 18
  ctx.save()
  ctx.shadowColor = 'rgba(40,28,17,0.28)'
  ctx.shadowBlur = 50
  ctx.shadowOffsetY = 28
  fillRoundRect(ctx, x, y, w, h, r, '#F7F3EA')
  ctx.restore()

  // Chrome
  const chromeH = h * 0.12
  ctx.save()
  roundRectPath(ctx, x, y, w, h, r)
  ctx.clip()
  const chrome = ctx.createLinearGradient(x, y, x, y + chromeH)
  chrome.addColorStop(0, '#EAE5DA')
  chrome.addColorStop(1, '#DCD5C8')
  ctx.fillStyle = chrome
  ctx.fillRect(x, y, w, chromeH)
  ctx.strokeStyle = 'rgba(44,34,22,0.12)'
  ctx.beginPath()
  ctx.moveTo(x, y + chromeH)
  ctx.lineTo(x + w, y + chromeH)
  ctx.stroke()

  // Traffic dots
  const dotY = y + chromeH * 0.34
  ;['#DD7665', '#D9B368', '#7DA887'].forEach((color, i) => {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x + 24 + i * 17, dotY, 5, 0, Math.PI * 2)
    ctx.fill()
  })

  // Tab
  const tabX = x + 90
  const tabW = w * 0.3
  const tabY = y + chromeH * 0.25
  fillRoundRect(ctx, tabX, tabY, tabW, chromeH * 0.68, 9, '#F9F6EF')
  const favSize = 19
  fillRoundRect(ctx, tabX + 13, tabY + (chromeH * 0.68 - favSize) / 2, favSize, favSize, 5, config.primary)
  ctx.save()
  ctx.translate(tabX + 13 + favSize / 2, tabY + (chromeH * 0.68 - favSize) / 2 + favSize / 2)
  drawLogo(ctx, logo, 0, 0, favSize * 0.53, config.light, 1)
  ctx.restore()
  drawTrackedTextFit(ctx, config.brandName, tabX + 40, tabY + chromeH * 0.45, tabW - 56, {
    size: 12,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.dark, 0.72),
    tracking: 0.06,
  })

  // URL
  const urlX = x + w * 0.37
  const urlY = tabY
  const urlW = w * 0.55
  fillRoundRect(ctx, urlX, urlY, urlW, chromeH * 0.68, 10, '#F9F6EF')
  drawTrackedText(ctx, '⌕', urlX + 14, urlY + chromeH * 0.43, {
    size: 13,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.dark, 0.45),
  })
  drawTrackedText(ctx, `https://${config.website}`, urlX + 36, urlY + chromeH * 0.43, {
    size: 12,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.dark, 0.64),
    tracking: 0.04,
  })
  ctx.restore()

  // Page
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y + chromeH, w, h - chromeH)
  ctx.clip()
  ctx.translate(x, y + chromeH)
  const pageW = w
  const pageH = h - chromeH
  ctx.fillStyle = config.light
  ctx.fillRect(0, 0, pageW, pageH)

  // Nav
  ctx.fillStyle = config.dark
  drawTrackedTextFit(ctx, config.brandName, 34, 48, 160, {
    size: 20,
    family: `"${config.fontFamily}", sans-serif`,
    weight: config.fontWeight,
    color: config.dark,
    tracking: config.tracking,
  })
  const navItems = ['OBJECTS', 'ATELIER', 'JOURNAL', 'CONTACT']
  navItems.forEach((item, i) => {
    drawTrackedText(ctx, item, pageW - 26 - (navItems.length - 1 - i) * 94, 47, {
      size: 8,
      family: '"Space Grotesk", sans-serif',
      weight: 500,
      color: withAlpha(config.dark, 0.55),
      align: 'right',
      tracking: 0.18,
    })
  })

  // Hero
  const heroY = 80
  const heroH = pageH * 0.56
  const hero = ctx.createLinearGradient(0, heroY, pageW, heroY + heroH)
  hero.addColorStop(0, config.primary)
  hero.addColorStop(0.58, shade(config.primary, -0.2))
  hero.addColorStop(1, config.dark)
  ctx.fillStyle = hero
  ctx.fillRect(0, heroY, pageW, heroH)
  ctx.save()
  ctx.globalAlpha = 0.18
  ctx.strokeStyle = config.light
  for (let i = 0; i < 7; i++) {
    ctx.beginPath()
    ctx.arc(pageW * 0.84, heroY + heroH * 0.46, 60 + i * 42, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()

  const heroP = anim(reelLayer(local, config, 'logo', duration), 0, duration * 0.35, 'easeOutCubic')
  ctx.save()
  ctx.globalAlpha = heroP
  drawLogo(ctx, logo, pageW * 0.27, heroY + heroH * 0.45, heroH * 0.22 * config.logoSize, config.light, 0.95)
  ctx.restore()

  drawTrackedTextFit(ctx, config.brandName, pageW * 0.27, heroY + heroH * 0.69, pageW * 0.36, {
    size: 34,
    family: `"${config.fontFamily}", sans-serif`,
    weight: config.fontWeight,
    color: config.light,
    align: 'center',
    tracking: config.tracking,
    alpha: heroP,
  })
  drawTrackedTextFit(ctx, config.tagline, pageW * 0.7, heroY + heroH * 0.45, pageW * 0.36, {
    size: 19,
    family: `"${config.fontFamily}", sans-serif`,
    weight: 500,
    color: withAlpha(config.light, 0.88),
    align: 'center',
    tracking: 0.02,
    alpha: anim(reelLayer(local, config, 'text', duration), duration * 0.15, duration * 0.35, 'easeOutCubic'),
  })
  drawTrackedText(ctx, 'EXPLORE THE COLLECTION  ↗', pageW * 0.7, heroY + heroH * 0.57, {
    size: 9,
    family: '"Space Grotesk", sans-serif',
    weight: 600,
    color: withAlpha(config.secondary, 0.9),
    align: 'center',
    tracking: 0.22,
  })

  // Lower editorial row
  const rowY = heroY + heroH + 30
  for (let i = 0; i < 3; i++) {
    const colW = (pageW - 68 - 24) / 3
    const colX = 34 + i * (colW + 12)
    ctx.fillStyle = withAlpha(config.secondary, 0.28 + i * 0.08)
    fillRoundRect(ctx, colX, rowY, colW, pageH - rowY - 24, 8, withAlpha(config.secondary, 0.18 + i * 0.07))
    drawTrackedText(ctx, `0${i + 1}`, colX + 12, rowY + 20, {
      size: 8,
      family: '"Space Grotesk", sans-serif',
      weight: 500,
      color: withAlpha(config.dark, 0.48),
      tracking: 0.14,
    })
    drawTrackedText(ctx, ['FORM', 'MATTER', 'LIGHT'][i], colX + 12, rowY + 44, {
      size: 13,
      family: '"Space Grotesk", sans-serif',
      weight: 500,
      color: config.dark,
      tracking: 0.12,
    })
  }
  ctx.restore()
  strokeRoundRect(ctx, x, y, w, h, r, 'rgba(255,255,255,0.3)', 1)
}

function paletteScene({
  ctx,
  width,
  height,
  config,
  local,
  duration,
  index,
}: SceneArgs) {
  const D = duration
  const textT = reelLayer(local, config, 'text', D)
  const cols = [
    { name: 'Primary', color: config.primary },
    { name: 'Secondary', color: config.secondary },
    { name: 'Dark', color: config.dark },
    { name: 'Light', color: config.light },
  ]
  drawBackdrop(ctx, width, height, config.light, shade(config.light, -0.07))
  drawEyebrow(ctx, `Colour / ${String(index + 1).padStart(2, '0')}`, width * 0.09, height * 0.12, config.dark, 'left', 0.55)
  drawEyebrow(ctx, config.brandName, width * 0.91, height * 0.12, config.dark, 'right', 0.36)

  const margin = width * 0.07
  const gap = width * 0.013
  const colW = (width - margin * 2 - gap * 3) / 4
  const top = height * 0.2
  const bottom = height * 0.86
  const maxH = bottom - top
  cols.forEach((col, i) => {
    const p = anim(
      reelLayer(local, config, 'background', D),
      D * 0.04 + i * 0.055,
      D * 0.42,
      'easeOutCubic',
    )
    const x = margin + i * (colW + gap)
    const h = maxH * (0.72 + i * 0.09) * p
    const y = bottom - h
    const textColor = luminance(col.color) > 0.45 ? '#1A1713' : '#F7F2E8'
    ctx.save()
    ctx.globalAlpha = p
    fillRoundRect(ctx, x, y, colW, h, 3, col.color)
    ctx.restore()
    if (p > 0.7) {
      const labelP = anim(textT, D * 0.3 + i * 0.04, D * 0.26, 'easeOutCubic')
      ctx.save()
      ctx.globalAlpha = labelP
      drawTrackedText(ctx, col.name.toUpperCase(), x + 12, y + 27, {
        size: 11,
        family: '"Space Grotesk", sans-serif',
        weight: 600,
        color: withAlpha(textColor, 0.7),
        tracking: 0.17,
      })
      drawTrackedText(ctx, col.color.toUpperCase(), x + 12, bottom - 120, {
        size: 23,
        family: '"Space Grotesk", sans-serif',
        weight: 500,
        color: textColor,
        tracking: 0.02,
      })
      drawTrackedText(ctx, `RGB ${rgbString(col.color)}`, x + 12, bottom - 88, {
        size: 9,
        family: '"Space Grotesk", sans-serif',
        weight: 500,
        color: withAlpha(textColor, 0.65),
        tracking: 0.06,
      })
      drawTrackedText(ctx, `CMYK ${cmykString(col.color)}`, x + 12, bottom - 68, {
        size: 9,
        family: '"Space Grotesk", sans-serif',
        weight: 500,
        color: withAlpha(textColor, 0.65),
        tracking: 0.06,
      })
      ctx.restore()
    }
  })

  const lineP = anim(textT, D * 0.45, D * 0.3, 'easeOutCubic')
  drawHairline(ctx, width * 0.5 - 110 * lineP, height * 0.91, 220 * lineP, config.dark, 0.28)
  drawTrackedText(ctx, 'A systematic language of colour.', width * 0.5, height * 0.94, {
    size: 17,
    family: `"${config.fontFamily}", sans-serif`,
    weight: 400,
    color: withAlpha(config.dark, 0.6),
    align: 'center',
    tracking: 0.03,
    alpha: lineP,
  })
  drawCornerMarks(ctx, width, height, config.dark, width * 0.065, 22, 0.18)
  drawGrain(ctx, width, height, 0.04, 0.00011, 223)
}

function merchScene({
  ctx,
  width,
  height,
  config,
  local,
  duration,
  index,
}: SceneArgs) {
  const D = duration
  const count = productIds.length
  const perPage = 4
  const pageCount = Math.max(1, Math.ceil(count / perPage))
  const pageDuration = Math.max(0.01, D / pageCount)
  const sceneLocal = clamp(local, 0, D - 0.001)
  const page = Math.min(pageCount - 1, Math.floor(sceneLocal / pageDuration))
  const pageLocal = sceneLocal - page * pageDuration
  const pageT = clamp(pageLocal / pageDuration)
  const intro = smoothstep(0, 0.34, pageT)
  const start = page * perPage
  const pageProducts = productIds.slice(start, start + perPage)
  const hero = pageProducts[0] ?? productIds[0]
  const previousHero = page > 0 ? productIds[(page - 1) * perPage] : hero
  const meta = productMeta[hero]

  drawBackdrop(ctx, width, height, shade(config.dark, 0.1), config.dark, {
    color: config.primary,
    x: width * 0.3,
    y: height * 0.3,
    radius: width * 0.95,
    alpha: 0.14,
  })

  const margin = width * 0.058
  const heroY = height * 0.16
  const heroW = width * 0.54
  const heroH = heroW / 0.5625
  const gap = width * 0.022
  const sideX = margin + heroW + gap
  const sideW = width - sideX - margin
  const sideH = (heroH - gap * 2) / 3
  const radius = width * 0.018

  const drawPlate = (
    product: ProductId,
    x: number,
    y: number,
    w: number,
    h: number,
    alpha: number,
    scale: number,
    label?: string,
  ) => {
    if (alpha <= 0.001) return
    const image = getMockupImage(product, config)
    const productMetaEntry = productMeta[product]
    const cx = x + w / 2
    const cy = y + h / 2
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.translate(cx, cy)
    ctx.scale(scale, scale)
    ctx.translate(-cx, -cy)
    ctx.save()
    roundRectPath(ctx, x, y, w, h, radius)
    ctx.clip()
    if (image) {
      drawImageCover(ctx, image, x, y, w, h)
    } else {
      ctx.save()
      ctx.translate(x, y)
      drawBackdrop(ctx, w, h, shade(config.dark, 0.14), config.dark, {
        color: config.primary,
        alpha: 0.2,
      })
      drawLogo(
        ctx,
        getLoadedImage(config.logoDataUrl),
        w / 2,
        h / 2,
        Math.min(w, h) * 0.26,
        config.light,
        0.2,
      )
      ctx.restore()
    }
    const veil = ctx.createLinearGradient(0, y + h * 0.54, 0, y + h)
    veil.addColorStop(0, 'rgba(8,8,7,0)')
    veil.addColorStop(1, 'rgba(8,8,7,0.66)')
    ctx.fillStyle = veil
    ctx.fillRect(x, y + h * 0.54, w, h * 0.46)
    ctx.restore()

    strokeRoundRect(
      ctx,
      x,
      y,
      w,
      h,
      radius,
      withAlpha(config.light, label ? 0.16 : 0.12),
      1.2,
    )

    drawTrackedText(
      ctx,
      String(productIds.indexOf(product) + 1).padStart(2, '0'),
      x + w * 0.045,
      y + h * 0.07,
      {
        size: Math.max(8, w * 0.036),
        family: '"Space Grotesk", sans-serif',
        weight: 600,
        color: withAlpha(config.light, label ? 0.66 : 0.5),
        tracking: 0.14,
      },
    )

    if (label) {
      drawTrackedTextFit(ctx, productMetaEntry.name, x + w * 0.045, y + h * 0.94, w * 0.72, {
        size: Math.max(9, w * 0.038),
        family: '"Space Grotesk", sans-serif',
        weight: 600,
        color: withAlpha(config.light, 0.72),
        tracking: 0.1,
      })
    }
    ctx.restore()
  }

  // Header.
  drawLogo(
    ctx,
    getLoadedImage(config.logoDataUrl),
    margin + width * 0.017,
    height * 0.048,
    width * 0.032,
    config.light,
    0.9,
  )
  drawTrackedText(
    ctx,
    `Objects / ${String(index + 1).padStart(2, '0')}`,
    margin + width * 0.048,
    height * 0.052,
    {
      size: 10,
      family: '"Space Grotesk", sans-serif',
      weight: 500,
      color: withAlpha(config.light, 0.56),
      tracking: 0.26,
    },
  )
  drawTrackedText(
    ctx,
    `${String(page + 1).padStart(2, '0')} / ${String(pageCount).padStart(2, '0')}`,
    width - margin,
    height * 0.052,
    {
      size: 10,
      family: '"Space Grotesk", sans-serif',
      weight: 500,
      color: withAlpha(config.light, 0.5),
      align: 'right',
      tracking: 0.24,
    },
  )

  drawTrackedTextFit(ctx, 'The collection', margin, height * 0.113, width * 0.7, {
    size: width * 0.058,
    family: `"${config.fontFamily}", sans-serif`,
    weight: config.fontWeight,
    color: config.light,
    tracking: config.tracking,
  })
  drawTrackedText(ctx, `${count} PLATES · ONE MARK`, width - margin, height * 0.113, {
    size: 9,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.secondary, 0.72),
    align: 'right',
    tracking: 0.22,
  })
  drawHairline(
    ctx,
    margin,
    height * 0.137,
    width - margin * 2,
    config.light,
    0.1,
  )

  // Hero plate crossfades between pages.
  const drift = easeOutCubic(clamp(sceneLocal / D))
  if (intro < 0.999) {
    drawPlate(previousHero, margin, heroY, heroW, heroH, 1 - intro, 1.01 + drift * 0.005)
  }
  drawPlate(hero, margin, heroY, heroW, heroH, intro, 1 + drift * 0.014)

  // Supporting plates slide in beside the hero.
  pageProducts.slice(1).forEach((product, i) => {
    const tileTop = heroY + i * (sideH + gap)
    const reveal = smoothstep(i * 0.05, 0.34 + i * 0.05, pageT)
    if (reveal <= 0) return
    const offset = (1 - reveal) * height * 0.018
    drawPlate(
      product,
      sideX,
      tileTop + offset,
      sideW,
      sideH,
      reveal,
      1,
      'tile',
    )
  })

  // A quiet flash on each page turn.
  if (page > 0) {
    const flash = clamp(1 - pageLocal / 0.16)
    if (flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${flash * 0.18})`
      ctx.fillRect(0, 0, width, height)
    }
  }

  // Footer.
  const footerY = heroY + heroH + height * 0.035
  drawTrackedText(
    ctx,
    `${meta.surface.toUpperCase()} / ${String(start + 1).padStart(2, '0')}`,
    margin,
    footerY,
    {
      size: 11,
      family: '"Space Grotesk", sans-serif',
      weight: 500,
      color: withAlpha(config.secondary, 0.82),
      tracking: 0.28,
      alpha: intro,
    },
  )
  drawTrackedTextFit(ctx, meta.name, margin, footerY + height * 0.04, width * 0.62, {
    size: width * 0.046,
    family: `"${config.fontFamily}", sans-serif`,
    weight: config.fontWeight,
    color: config.light,
    tracking: config.tracking,
    alpha: intro,
  })
  drawTrackedText(
    ctx,
    `${config.brandName}  /  ${config.website}`,
    margin,
    footerY + height * 0.062,
    {
      size: 11,
      family: '"Space Grotesk", sans-serif',
      weight: 500,
      color: withAlpha(config.light, 0.44),
      tracking: 0.2,
      alpha: intro,
    },
  )

  // Oversized page ordinal.
  drawTrackedText(
    ctx,
    String(page + 1).padStart(2, '0'),
    width - margin,
    footerY + height * 0.06,
    {
      size: width * 0.12,
      family: '"Space Grotesk", sans-serif',
      weight: 500,
      color: withAlpha(config.light, 0.08),
      align: 'right',
      tracking: 0.02,
    },
  )

  // Plate index.
  const pipW = Math.min(20, (width - margin * 2) / count - 5)
  const pipGap = 5
  const totalW = count * pipW + (count - 1) * pipGap
  let px = width / 2 - totalW / 2
  const pipY = height * 0.918
  productIds.forEach((_, i) => {
    const active = i >= start && i < start + perPage
    fillRoundRect(
      ctx,
      px,
      pipY,
      pipW,
      2.5,
      1.25,
      active ? config.primary : withAlpha(config.light, 0.18),
    )
    px += pipW + pipGap
  })
  drawTrackedText(
    ctx,
    `PLATES ${String(start + 1).padStart(2, '0')}—${String(
      Math.min(count, start + perPage),
    ).padStart(2, '0')} OF ${count}`,
    width / 2,
    pipY + 26,
    {
      size: 8,
      family: '"Space Grotesk", sans-serif',
      weight: 500,
      color: withAlpha(config.light, 0.38),
      align: 'center',
      tracking: 0.22,
    },
  )

  drawHairline(ctx, margin, height * 0.955, width - margin * 2, config.light, 0.08)
  drawTrackedText(ctx, 'MERCHANDISE', margin, height * 0.973, {
    size: 8,
    family: '"Space Grotesk", sans-serif',
    weight: 600,
    color: withAlpha(config.light, 0.3),
    tracking: 0.28,
  })
  drawTrackedText(ctx, 'MM—26', width - margin, height * 0.973, {
    size: 8,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.light, 0.3),
    align: 'right',
    tracking: 0.24,
  })

  drawGrain(ctx, width, height, 0.06, 0.00014, 251 + page)
}

function lockupScene({
  ctx,
  width,
  height,
  config,
  local,
  duration,
  index,
}: SceneArgs) {
  const D = duration
  const logoT = reelLayer(local, config, 'logo', D)
  const textT = reelLayer(local, config, 'text', D)
  const bgT = reelLayer(local, config, 'background', D)
  const logo = getLoadedImage(config.logoDataUrl)

  drawBackdrop(ctx, width, height, config.dark, '#080807', {
    color: config.primary,
    x: width * 0.5,
    y: height * 0.46,
    radius: width * 0.68,
    alpha: 0.16,
  })
  const lineP = anim(bgT, 0, D * 0.5, 'easeOutCubic')
  drawHairline(ctx, width * 0.2, height * 0.31, width * 0.6 * lineP, config.light, 0.12)
  drawHairline(ctx, width * 0.2, height * 0.69, width * 0.6 * lineP, config.light, 0.12)

  const logoP = anim(logoT, 0, D * 0.4, config.layers.logo.easing)
  drawLogo(ctx, logo, width * 0.5, height * 0.42, width * 0.075 * config.logoSize, config.light, logoP * 0.96)

  const wordP = anim(textT, D * 0.12, D * 0.38, config.layers.text.easing)
  drawTrackedTextFit(ctx, config.brandName, width * 0.5, height * 0.51, width * 0.7, {
    size: width * 0.12,
    family: `"${config.fontFamily}", sans-serif`,
    weight: config.fontWeight,
    color: config.light,
    align: 'center',
    tracking: config.tracking,
    alpha: wordP,
  })
  const tagP = anim(textT, D * 0.28, D * 0.3, 'easeOutCubic')
  drawTrackedText(ctx, config.tagline.toUpperCase(), width * 0.5, height * 0.545, {
    size: width * 0.0135,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.secondary, 0.9),
    align: 'center',
    tracking: 0.42,
    alpha: tagP,
  })
  drawTrackedText(ctx, config.website.toUpperCase(), width * 0.5, height * 0.73, {
    size: 13,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.light, 0.42),
    align: 'center',
    tracking: 0.3,
    alpha: tagP,
  })
  drawEyebrow(ctx, `End / ${String(index + 1).padStart(2, '0')}`, width * 0.5, height * 0.85, config.light, 'center', 0.3 * tagP)

  // gentle camera vignette
  ctx.save()
  ctx.globalAlpha = 0.7
  ctx.strokeStyle = withAlpha(config.light, 0.06)
  ctx.beginPath()
  ctx.arc(width * 0.5, height * 0.45, width * 0.54, Math.PI * 1.1, Math.PI * 1.9)
  ctx.stroke()
  ctx.restore()
  drawCornerMarks(ctx, width, height, config.light, width * 0.065, 22, 0.16)
  drawGrain(ctx, width, height, 0.05, 0.00013, 277)
}

const sceneRenderers: Record<
  SceneId,
  (args: SceneArgs) => void
> = {
  wordmark: wordmarkScene,
  trace: traceScene,
  grid: gridScene,
  phone: phoneScene,
  browser: browserScene,
  palette: paletteScene,
  merch: merchScene,
  lockup: lockupScene,
}

export function renderReelScene(
  ctx: CanvasRenderingContext2D,
  sceneId: SceneId,
  local: number,
  duration: number,
  config: BrandConfig,
  width: number,
  height: number,
  index: number,
) {
  ctx.save()
  ctx.clearRect(0, 0, width, height)
  sceneRenderers[sceneId]({
    ctx,
    width,
    height,
    config,
    sceneId,
    index,
    local,
    duration,
  })
  ctx.restore()
}

const bufferCache = new Map<string, HTMLCanvasElement>()

function getBuffer(width: number, height: number, key: string) {
  const cacheKey = `${key}:${width}x${height}`
  const existing = bufferCache.get(cacheKey)
  if (existing) return existing
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  bufferCache.set(cacheKey, canvas)
  return canvas
}

function drawBuffer(
  target: CanvasRenderingContext2D,
  buffer: HTMLCanvasElement,
  dx: number,
  dy: number,
  alpha = 1,
  filter = 'none',
) {
  target.save()
  target.globalAlpha = alpha
  target.filter = filter
  target.drawImage(buffer, dx, dy)
  target.restore()
}

export function getReelTimeline(config: BrandConfig) {
  const scenes = config.scenes.filter((scene) => scene.enabled)
  const entries: Array<{
    id: SceneId
    index: number
    start: number
    duration: number
  }> = []
  let cursor = 0
  scenes.forEach((scene, index) => {
    const duration = sceneSeconds(scene)
    entries.push({ id: scene.id, index, start: cursor, duration })
    cursor += duration
  })
  return { entries, total: cursor, playback: Math.min(cursor, REEL_MAX_DURATION) }
}

export function drawBrandReel(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: BrandConfig,
  time: number,
) {
  const { entries, total, playback } = getReelTimeline(config)
  if (!entries.length) {
    drawBackdrop(ctx, width, height, config.dark, '#080807')
    return
  }
  const scale = total > REEL_MAX_DURATION ? total / playback : 1
  const renderTime = clamp(time * scale, 0, total - 0.0001)
  let current = entries[entries.length - 1]
  for (const entry of entries) {
    if (renderTime >= entry.start && renderTime < entry.start + entry.duration) {
      current = entry
      break
    }
  }
  const local = renderTime - current.start
  const transition = Math.min(0.42, current.duration * 0.28)
  const currentIdx = entries.findIndex((entry) => entry.start === current.start)

  if (local < transition && currentIdx > 0) {
    const previous = entries[currentIdx - 1]
    const progress = smoothstep(0, 1, local / transition)
    const prevBuffer = getBuffer(width, height, 'prev')
    const currBuffer = getBuffer(width, height, 'curr')
    const pctx = prevBuffer.getContext('2d')
    const cctx = currBuffer.getContext('2d')
    if (pctx && cctx) {
      renderReelScene(
        pctx,
        previous.id,
        Math.max(0, previous.duration - 0.001),
        previous.duration,
        config,
        width,
        height,
        previous.index,
      )
      renderReelScene(
        cctx,
        current.id,
        local,
        current.duration,
        config,
        width,
        height,
        current.index,
      )
      ctx.fillStyle = config.dark
      ctx.fillRect(0, 0, width, height)
      const mode = current.index % 3
      if (mode === 0) {
        ctx.drawImage(prevBuffer, 0, 0)
        drawBuffer(ctx, currBuffer, 0, 0, progress)
        const flash = Math.sin(progress * Math.PI)
        ctx.fillStyle = `rgba(255,255,255,${flash * 0.92})`
        ctx.fillRect(0, 0, width, height)
      } else if (mode === 1) {
        const whip = easeOutCubic(progress)
        drawBuffer(ctx, prevBuffer, 0, -height * 0.12 * whip)
        const blur = (1 - whip) * 7
        drawBuffer(ctx, currBuffer, 0, height * (1 - whip), 1, `blur(${blur.toFixed(2)}px)`)
        const flash = Math.sin(progress * Math.PI) * 0.26
        ctx.fillStyle = `rgba(255,255,255,${flash})`
        ctx.fillRect(0, 0, width, height)
      } else {
        const ease = easeOutCubic(progress)
        ctx.save()
        ctx.translate(width / 2, height / 2)
        ctx.scale(1 + ease * 0.12, 1 + ease * 0.12)
        drawBuffer(ctx, prevBuffer, -width / 2, -height / 2, 1 - ease * 0.45, `blur(${(ease * 9).toFixed(2)}px)`)
        ctx.restore()
        const blur = (1 - ease) * 16
        drawBuffer(ctx, currBuffer, 0, 0, ease, `blur(${blur.toFixed(2)}px)`)
        const flash = Math.sin(progress * Math.PI) * 0.42
        ctx.fillStyle = `rgba(255,255,255,${flash})`
        ctx.fillRect(0, 0, width, height)
      }
      return
    }
  }

  renderReelScene(
    ctx,
    current.id,
    local,
    current.duration,
    config,
    width,
    height,
    current.index,
  )
}
