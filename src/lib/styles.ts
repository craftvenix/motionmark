import type { BrandConfig, StyleId } from '../types'
import {
  drawGrain,
  drawTrackedText,
  drawTrackedTextFit,
  fillRoundRect,
  fontString,
  trackedWidth,
} from './canvas'
import { withAlpha } from './colors'
import { anim, clamp, layerTime, lerp } from './easing'
import { drawLogo, getLoadedImage } from './logo'
import { drawBackdrop, drawEyebrow, drawHairline } from './scene-utils'

interface StyleContext {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  config: BrandConfig
  time: number
  duration: number
}

function drawStaggeredWordmark(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  size: number,
  config: BrandConfig,
  color: string,
  progressAt: (index: number) => number,
  fitWidth: number,
) {
  ctx.save()
  const fitted = Math.min(
    size,
    (size * fitWidth) /
      Math.max(1, trackedWidth((ctx.font = fontString(size, `"${config.fontFamily}", sans-serif`, config.fontWeight), ctx), text, config.tracking)),
  )
  ctx.font = fontString(fitted, `"${config.fontFamily}", sans-serif`, config.fontWeight)
  const chars = Array.from(text)
  const widths = chars.map((char) => ctx.measureText(char).width)
  const spacing = fitted * config.tracking
  const total = widths.reduce((sum, width) => sum + width, 0) + spacing * Math.max(0, chars.length - 1)
  let x = centerX - total / 2
  ctx.textBaseline = 'alphabetic'
  chars.forEach((char, index) => {
    const p = progressAt(index)
    const yOffset = (1 - p) * fitted * 0.5
    ctx.globalAlpha = clamp(p)
    ctx.fillStyle = color
    ctx.fillText(char, x, y + yOffset)
    x += widths[index] + spacing
  })
  ctx.restore()
  return fitted
}

function drawReveal({ ctx, width, height, config, time, duration }: StyleContext) {
  const logo = getLoadedImage(config.logoDataUrl)
  const D = duration
  const t = clamp(time, 0, D)
  const bgT = layerTime(t, config.layers.background, D)
  const logoT = layerTime(t, config.layers.logo, D)
  const textT = layerTime(t, config.layers.text, D)
  const w = 1

  drawBackdrop(ctx, width, height, config.primary, config.primary, {
    color: config.secondary,
    x: width * 0.25,
    y: height * 0.18,
    radius: width * 0.7,
    alpha: 0.24,
  })

  // Darken the primary field at its edges so the wipe has depth.
  const shadeGradient = ctx.createLinearGradient(0, 0, width, height)
  shadeGradient.addColorStop(0, 'rgba(0,0,0,0.12)')
  shadeGradient.addColorStop(0.4, 'rgba(0,0,0,0)')
  shadeGradient.addColorStop(1, 'rgba(0,0,0,0.2)')
  ctx.fillStyle = shadeGradient
  ctx.fillRect(0, 0, width, height)

  const wipe = anim(bgT, 0, D * 0.42, 'easeInOutCubic')
  const xTop = lerp(-width * 0.55, width * 0.32, wipe)
  const xBottom = xTop - width * 0.23
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(xTop, 0)
  ctx.lineTo(width + 2, 0)
  ctx.lineTo(width + 2, height + 2)
  ctx.lineTo(xBottom, height + 2)
  ctx.closePath()
  const paper = ctx.createLinearGradient(xTop, 0, width, height)
  paper.addColorStop(0, config.light)
  paper.addColorStop(0.72, config.light)
  paper.addColorStop(1, config.secondary)
  ctx.fillStyle = paper
  ctx.fill()
  ctx.restore()

  // Secondary rule riding the wipe edge.
  ctx.save()
  ctx.strokeStyle = withAlpha(config.secondary, 0.95)
  ctx.lineWidth = Math.max(2, width * 0.006)
  ctx.beginPath()
  ctx.moveTo(xTop + width * 0.004, 0)
  ctx.lineTo(xBottom + width * 0.004, height)
  ctx.stroke()
  ctx.strokeStyle = withAlpha(config.dark, 0.24)
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(xTop + width * 0.013, 0)
  ctx.lineTo(xBottom + width * 0.013, height)
  ctx.stroke()
  ctx.restore()

  // Studio detailing on the paper side.
  ctx.save()
  ctx.globalAlpha = wipe * 0.55
  ctx.strokeStyle = withAlpha(config.dark, 0.08)
  ctx.lineWidth = 1
  for (let i = 0; i < 7; i++) {
    const x = width * 0.48 + i * width * 0.082
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  ctx.restore()

  drawEyebrow(ctx, 'Brand identity — 2026', width * 0.68, height * 0.13, config.dark, 'left', wipe * 0.6)
  drawHairline(ctx, width * 0.68, height * 0.145, width * 0.24 * wipe, config.dark, 0.2)

  // Thin primary ring behind the mark.
  const ringP = anim(logoT, D * 0.05, D * 0.45, 'easeOutCubic')
  ctx.save()
  ctx.globalAlpha = ringP * 0.7
  ctx.strokeStyle = withAlpha(config.primary, 0.65)
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(width * 0.655, height * 0.39, Math.min(width, height) * 0.18, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ringP)
  ctx.stroke()
  ctx.restore()

  const logoP = anim(logoT, D * 0.14, D * 0.38, config.layers.logo.easing)
  if (logoP > 0) {
    ctx.save()
    ctx.translate(width * 0.655, height * 0.39)
    ctx.rotate((-0.85 + 0.85 * logoP) * w)
    const scale = 0.58 + 0.42 * logoP
    ctx.scale(scale, scale)
    ctx.globalAlpha = clamp(logoP * 1.35)
    drawLogo(ctx, logo, 0, 0, Math.min(width, height) * 0.28 * config.logoSize * 1.2, config.dark, 1)
    ctx.restore()
  }

  // Brand line
  const wordSize = Math.min(width, height) * 0.092
  drawStaggeredWordmark(
    ctx,
    config.brandName,
    width * 0.655,
    height * 0.67,
    wordSize,
    config,
    config.dark,
    (index) => anim(textT, D * 0.25 + index * 0.028, D * 0.28, config.layers.text.easing),
    width * 0.48,
  )

  const tagP = anim(textT, D * 0.48, D * 0.25, 'easeOutCubic')
  drawTrackedText(ctx, config.tagline.toUpperCase(), width * 0.655, height * 0.725, {
    size: Math.min(width, height) * 0.020,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.primary, 0.9),
    align: 'center',
    tracking: 0.32,
    alpha: tagP,
  })

  const detailP = anim(textT, D * 0.62, D * 0.24, 'easeOutCubic')
  drawTrackedText(ctx, config.website.toUpperCase(), width * 0.83, height * 0.86, {
    size: Math.min(width, height) * 0.016,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.dark, 0.52),
    align: 'right',
    tracking: 0.24,
    alpha: detailP,
  })
  drawTrackedText(ctx, '01 / Reveal', width * 0.17, height * 0.86, {
    size: Math.min(width, height) * 0.014,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.light, 0.55),
    align: 'left',
    tracking: 0.22,
    alpha: detailP * 0.8,
  })

  ctx.save()
  ctx.globalAlpha = wipe * 0.5
  drawTrackedText(ctx, 'A', width * 0.17, height * 0.48, {
    size: Math.min(width, height) * 0.34,
    family: `"${config.fontFamily}", sans-serif`,
    weight: 300,
    color: withAlpha(config.light, 0.12),
    align: 'center',
    tracking: 0,
  })
  ctx.restore()

  drawGrain(ctx, width, height, 0.04, 0.00012, 11)
}

function drawBlueprint({ ctx, width, height, config, time, duration }: StyleContext) {
  const logo = getLoadedImage(config.logoDataUrl)
  const D = duration
  const t = clamp(time, 0, D)
  const bgT = layerTime(t, config.layers.background, D)
  const logoT = layerTime(t, config.layers.logo, D)
  const textT = layerTime(t, config.layers.text, D)
  const cx = width * 0.5
  const cy = height * 0.43

  drawBackdrop(ctx, width, height, config.dark, '#0B0B0B', {
    color: config.primary,
    x: width * 0.5,
    y: height * 0.42,
    radius: width * 0.58,
    alpha: 0.09,
  })

  const gridP = anim(bgT, 0, D * 0.5, 'easeOutCubic')
  ctx.save()
  ctx.strokeStyle = withAlpha(config.secondary, 0.075 * gridP)
  ctx.lineWidth = 1
  const step = width * 0.04
  const offset = ((bgT * 5) % step) * 0.35
  for (let x = width * 0.08 + offset; x < width * 0.95; x += step) {
    ctx.beginPath()
    ctx.moveTo(x, height * 0.07)
    ctx.lineTo(x, height * 0.9)
    ctx.stroke()
  }
  for (let y = height * 0.07 + offset; y < height * 0.92; y += step) {
    ctx.beginPath()
    ctx.moveTo(width * 0.08, y)
    ctx.lineTo(width * 0.92, y)
    ctx.stroke()
  }
  ctx.restore()

  // Build guides
  const guideP = anim(bgT, D * 0.04, D * 0.35, 'easeInOutCubic')
  ctx.save()
  ctx.strokeStyle = withAlpha(config.secondary, 0.34)
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(width * 0.08, cy)
  ctx.lineTo(width * 0.08 + (width * 0.84) * guideP, cy)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx, height * 0.08)
  ctx.lineTo(cx, height * 0.08 + height * 0.82 * guideP)
  ctx.stroke()
  ctx.restore()

  // Dimension rails
  const dimP = anim(bgT, D * 0.18, D * 0.34, 'easeOutCubic')
  ctx.save()
  ctx.strokeStyle = withAlpha(config.secondary, 0.22 * dimP)
  ctx.fillStyle = withAlpha(config.secondary, 0.7 * dimP)
  ctx.lineWidth = 1
  const left = width * 0.23
  const right = width * 0.77
  const top = height * 0.19
  const bottom = height * 0.67
  ctx.beginPath()
  ctx.moveTo(left, top)
  ctx.lineTo(left, bottom)
  ctx.lineTo(right, bottom)
  ctx.stroke()
  for (const [x, y] of [
    [left, top],
    [left, bottom],
    [right, bottom],
  ]) {
    ctx.beginPath()
    ctx.arc(x, y, 3.2, 0, Math.PI * 2)
    ctx.fill()
  }
  // Arrow tips
  ctx.beginPath()
  ctx.moveTo(left, top + 16)
  ctx.lineTo(left - 5, top + 6)
  ctx.lineTo(left + 5, top + 6)
  ctx.closePath()
  ctx.fill()
  drawTrackedText(ctx, '640 × 640', right + 18, (top + bottom) / 2, {
    size: 13,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.secondary, 0.7),
    tracking: 0.15,
    alpha: dimP,
  })
  drawTrackedText(ctx, 'OPTICAL CENTRE', cx + 18, bottom + 24, {
    size: 12,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.secondary, 0.6),
    tracking: 0.2,
    alpha: dimP,
  })
  ctx.restore()

  // Concentric guides
  const circP = anim(bgT, D * 0.12, D * 0.45, 'easeOutCubic')
  ctx.save()
  ctx.strokeStyle = withAlpha(config.primary, 0.35)
  ctx.lineWidth = 1
  ctx.setLineDash([6, 8])
  ctx.beginPath()
  ctx.arc(cx, cy, Math.min(width, height) * 0.29 * circP, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.strokeStyle = withAlpha(config.secondary, 0.2)
  ctx.beginPath()
  ctx.arc(cx, cy, Math.min(width, height) * 0.19 * circP, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()

  // Outline trace
  const traceP = anim(logoT, D * 0.08, D * 0.52, 'easeInOutCubic')
  const fillP = anim(logoT, D * 0.48, D * 0.27, config.layers.logo.easing)
  const markH = Math.min(width, height) * 0.25 * config.logoSize
  const markW = markH * 1.18
  if (traceP > 0) {
    ctx.save()
    ctx.beginPath()
    ctx.rect(cx - markW, cy - markH, markW * 2 * traceP, markH * 2.2)
    ctx.clip()
    drawLogo(ctx, logo, cx, cy, markH, config.secondary, 0.9, {
      outline: true,
      rotation: 0,
    })
    ctx.restore()
  }
  if (fillP > 0) {
    drawLogo(ctx, logo, cx, cy, markH, config.primary, fillP * 0.92, {
      shadow: true,
    })
  }

  // Rotating construction arc
  ctx.save()
  ctx.strokeStyle = withAlpha(config.secondary, 0.65)
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, cy, markH * 0.72, bgT * 0.25, bgT * 0.25 + Math.PI * 0.7)
  ctx.stroke()
  ctx.fillStyle = config.secondary
  const dotAngle = bgT * 0.25 + Math.PI * 0.7
  ctx.beginPath()
  ctx.arc(cx + Math.cos(dotAngle) * markH * 0.72, cy + Math.sin(dotAngle) * markH * 0.72, 3.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  drawEyebrow(ctx, '02 / Blueprint', width * 0.08, height * 0.105, config.light, 'left', 0.6)
  drawEyebrow(ctx, 'Construction drawing', width * 0.92, height * 0.105, config.light, 'right', 0.32)
  drawHairline(ctx, width * 0.08, height * 0.12, width * 0.84 * guideP, config.light, 0.18)

  // Typewriter wordmark
  const typeP = anim(textT, D * 0.52, D * 0.31, 'linear')
  const visible = Math.floor(Array.from(config.brandName).length * typeP)
  const typed = Array.from(config.brandName).slice(0, visible).join('')
  const typeSize = Math.min(width, height) * 0.048
  ctx.font = fontString(typeSize, `"${config.fontFamily}", sans-serif`, config.fontWeight)
  const typedWidth = trackedWidth(ctx, typed, config.tracking)
  drawTrackedText(ctx, typed, cx, height * 0.79, {
    size: typeSize,
    family: `"${config.fontFamily}", sans-serif`,
    weight: config.fontWeight,
    color: config.light,
    align: 'center',
    tracking: config.tracking,
  })
  if (typeP < 1) {
    ctx.fillStyle = config.primary
    ctx.fillRect(cx + typedWidth / 2 + 5, height * 0.79 - typeSize * 0.76, 3, typeSize * 0.9)
  }

  const tagP = anim(textT, D * 0.68, D * 0.22, 'easeOutCubic')
  drawTrackedText(ctx, config.tagline.toUpperCase(), cx, height * 0.835, {
    size: 14,
    family: '"Space Grotesk", sans-serif',
    weight: 400,
    color: withAlpha(config.light, 0.5),
    align: 'center',
    tracking: 0.35,
    alpha: tagP,
  })
  drawTrackedText(ctx, config.website.toUpperCase(), width * 0.92, height * 0.88, {
    size: 12,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.light, 0.34),
    align: 'right',
    tracking: 0.25,
    alpha: tagP,
  })
  drawGrain(ctx, width, height, 0.055, 0.00014, 23)
}

function drawPulse({ ctx, width, height, config, time, duration }: StyleContext) {
  const logo = getLoadedImage(config.logoDataUrl)
  const D = duration
  const t = clamp(time, 0, D)
  const bgT = layerTime(t, config.layers.background, D)
  const logoT = layerTime(t, config.layers.logo, D)
  const textT = layerTime(t, config.layers.text, D)
  const cx = width * 0.5
  const cy = height * 0.42

  drawBackdrop(ctx, width, height, '#11110F', config.dark, {
    color: config.primary,
    x: cx,
    y: cy,
    radius: width * 0.62,
    alpha: 0.22,
  })
  const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, width * 0.34)
  halo.addColorStop(0, withAlpha(config.primary, 0.2))
  halo.addColorStop(0.45, withAlpha(config.primary, 0.08))
  halo.addColorStop(1, withAlpha(config.primary, 0))
  ctx.fillStyle = halo
  ctx.fillRect(0, 0, width, height)

  // Radar rings
  const maxR = Math.min(width, height) * 0.46
  for (let i = 0; i < 7; i++) {
    const phase = (bgT * 0.26 + i * 0.145) % 1
    const radius = maxR * (0.1 + phase * 1.2)
    const alpha = Math.sin(phase * Math.PI) * 0.28
    ctx.strokeStyle = withAlpha(config.primary, alpha)
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Orbiting satellites
  ctx.fillStyle = withAlpha(config.secondary, 0.7)
  for (let i = 0; i < 3; i++) {
    const angle = bgT * (0.18 + i * 0.045) + (i * Math.PI * 2) / 3
    const radius = minRadius(width, height) * (0.2 + i * 0.055)
    ctx.beginPath()
    ctx.arc(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius, 2.3, 0, Math.PI * 2)
    ctx.fill()
  }

  const pop = anim(logoT, D * 0.1, D * 0.34, config.layers.logo.easing)
  if (pop > 0) {
    ctx.save()
    ctx.globalAlpha = clamp(pop * 1.5)
    const size = Math.min(width, height) * 0.28 * config.logoSize
    const scale = 0.35 + 0.65 * pop
    ctx.translate(cx, cy)
    ctx.scale(scale, scale)
    drawLogo(ctx, logo, 0, 0, size, config.light, 1, { shadow: true })
    ctx.restore()
  }

  // Pulse line
  ctx.save()
  ctx.strokeStyle = withAlpha(config.primary, 0.5)
  ctx.lineWidth = 1.2
  ctx.beginPath()
  for (let x = 0; x <= width; x += 6) {
    const wave = Math.sin(x * 0.018 + bgT * 2.2) * 8 * Math.exp(-Math.pow((x - cx) / (width * 0.16), 2))
    if (x === 0) ctx.moveTo(x, cy + Math.min(width, height) * 0.24)
    else ctx.lineTo(x, cy + Math.min(width, height) * 0.24 + wave)
  }
  ctx.stroke()
  ctx.restore()

  const wordSize = Math.min(width, height) * 0.1
  drawStaggeredWordmark(
    ctx,
    config.brandName,
    width * 0.5,
    height * 0.71,
    wordSize,
    config,
    config.light,
    (index) => anim(textT, D * 0.34 + index * 0.045, D * 0.26, config.layers.text.easing),
    width * 0.7,
  )

  const tagP = anim(textT, D * 0.58, D * 0.26, 'easeOutCubic')
  drawTrackedText(ctx, config.tagline.toUpperCase(), width * 0.5, height * 0.765, {
    size: 15,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.secondary, 0.82),
    align: 'center',
    tracking: 0.42,
    alpha: tagP,
  })

  drawEyebrow(ctx, '03 / Pulse', width * 0.08, height * 0.105, config.light, 'left', 0.55)
  drawEyebrow(ctx, 'Signal active', width * 0.92, height * 0.105, config.light, 'right', 0.32)
  drawTrackedText(ctx, config.website.toUpperCase(), width * 0.5, height * 0.88, {
    size: 12,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.light, 0.36),
    align: 'center',
    tracking: 0.3,
    alpha: tagP,
  })
  drawGrain(ctx, width, height, 0.055, 0.00015, 37)
}

function drawLockup({ ctx, width, height, config, time, duration }: StyleContext) {
  const logo = getLoadedImage(config.logoDataUrl)
  const D = duration
  const t = clamp(time, 0, D)
  const bgT = layerTime(t, config.layers.background, D)
  const logoT = layerTime(t, config.layers.logo, D)
  const textT = layerTime(t, config.layers.text, D)
  const left = config.primary
  const right = config.light

  drawBackdrop(ctx, width, height, right, right)
  ctx.fillStyle = right
  ctx.fillRect(0, 0, width, height)

  const slide = anim(bgT, 0, D * 0.48, 'easeOutCubic')
  const leftPanelW = width * 0.47
  const leftX = -leftPanelW + leftPanelW * slide
  const rightPanelW = width * 0.53
  const rightX = width - rightPanelW * slide

  ctx.save()
  const leftGradient = ctx.createLinearGradient(0, 0, leftPanelW, height)
  leftGradient.addColorStop(0, left)
  leftGradient.addColorStop(0.6, left)
  leftGradient.addColorStop(1, shadowed(left))
  ctx.fillStyle = leftGradient
  ctx.fillRect(leftX, 0, leftPanelW, height)
  ctx.restore()

  ctx.save()
  const rightGradient = ctx.createLinearGradient(rightPanelW, 0, width, height)
  rightGradient.addColorStop(0, right)
  rightGradient.addColorStop(1, config.secondary)
  ctx.globalAlpha = 0.52 * slide
  ctx.fillStyle = rightGradient
  ctx.fillRect(rightX, 0, rightPanelW, height)
  ctx.restore()

  // Fine rules
  ctx.save()
  ctx.strokeStyle = withAlpha(config.dark, 0.13)
  ctx.lineWidth = 1
  const panelLineX = leftPanelW
  ctx.beginPath()
  ctx.moveTo(panelLineX, 0)
  ctx.lineTo(panelLineX, height)
  ctx.stroke()
  for (let i = 0; i < 5; i++) {
    ctx.beginPath()
    ctx.moveTo(panelLineX + 32, height * 0.18 + i * 34)
    ctx.lineTo(width - 32, height * 0.18 + i * 34)
    ctx.stroke()
  }
  ctx.restore()

  // Mark
  const markP = anim(logoT, D * 0.12, D * 0.4, config.layers.logo.easing)
  if (markP > 0) {
    ctx.save()
    ctx.translate(leftPanelW * 0.5, height * 0.47)
    ctx.rotate((1 - markP) * -0.25)
    const s = 0.72 + 0.28 * markP
    ctx.scale(s, s)
    ctx.globalAlpha = clamp(markP * 1.2)
    drawLogo(ctx, logo, 0, 0, Math.min(width, height) * 0.28 * config.logoSize, config.light, 0.96)
    ctx.restore()
  }

  const textStart = D * 0.22
  const wordSize = Math.min(width, height) * 0.07
  drawStaggeredWordmark(
    ctx,
    config.brandName,
    panelLineX + (width - panelLineX) * 0.5,
    height * 0.48,
    wordSize,
    config,
    config.dark,
    (index) => anim(textT, textStart + index * 0.035, D * 0.3, config.layers.text.easing),
    (width - panelLineX) * 0.72,
  )

  const tP = anim(textT, D * 0.46, D * 0.27, 'easeOutCubic')
  drawTrackedText(ctx, config.tagline.toUpperCase(), panelLineX + (width - panelLineX) * 0.5, height * 0.54, {
    size: 15,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.dark, 0.52),
    align: 'center',
    tracking: 0.34,
    alpha: tP,
  })
  drawHairline(ctx, panelLineX + (width - panelLineX) * 0.35, height * 0.585, (width - panelLineX) * 0.3 * tP, config.dark, 0.24)
  drawTrackedText(ctx, config.website.toUpperCase(), panelLineX + (width - panelLineX) * 0.5, height * 0.64, {
    size: 12,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.dark, 0.5),
    align: 'center',
    tracking: 0.25,
    alpha: tP,
  })

  drawEyebrow(ctx, '04 / Lockup', leftPanelW + 32, height * 0.115, config.dark, 'left', 0.58 * slide)
  drawEyebrow(ctx, 'Mark + wordmark', width - 32, height * 0.115, config.dark, 'right', 0.36 * slide)
  drawTrackedText(ctx, 'A — A', 32, height * 0.88, {
    size: 11,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.light, 0.45),
    tracking: 0.3,
    alpha: slide,
  })

  drawGrain(ctx, width, height, 0.045, 0.00012, 47)
}

function shadowed(hex: string) {
  // Local mix toward black without importing a heavier helper.
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const toHex = (v: number) => Math.round(v * 0.58).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function drawPattern({ ctx, width, height, config, time, duration }: StyleContext) {
  const logo = getLoadedImage(config.logoDataUrl)
  const D = duration
  const t = clamp(time, 0, D)
  const bgT = layerTime(t, config.layers.background, D)
  const logoT = layerTime(t, config.layers.logo, D)
  const textT = layerTime(t, config.layers.text, D)
  const zoomP = anim(bgT, 0, D * 0.55, 'easeInOutCubic')

  drawBackdrop(ctx, width, height, config.dark, '#0C0C0B', {
    color: config.primary,
    x: width * 0.5,
    y: height * 0.45,
    radius: width * 0.5,
    alpha: 0.08,
  })

  const cell = Math.min(width, height) * 0.105
  const scale = 1.16 - zoomP * 0.18
  const driftX = Math.sin(bgT * 0.32) * width * 0.012
  const driftY = Math.cos(bgT * 0.28) * height * 0.009
  ctx.save()
  ctx.translate(width / 2 + driftX, height / 2 + driftY)
  ctx.rotate(-0.08 + zoomP * 0.04)
  ctx.scale(scale, scale)
  const cols = Math.ceil(width / cell / 2) + 2
  const rows = Math.ceil(height / cell / 2) + 2
  const become = anim(bgT, 0, D * 0.3, 'easeOutCubic')
  for (let row = -rows; row <= rows; row++) {
    for (let col = -cols; col <= cols; col++) {
      const phase = (row * 7 + col * 3 + Math.floor(bgT * 0.3)) % 5
      const alpha = (0.09 + (phase === 0 ? 0.06 : 0)) * become
      drawLogo(ctx, logo, col * cell * 1.5, row * cell * 1.5, cell * 0.37, config.light, alpha)
    }
  }
  ctx.restore()

  // Dark radial pool so the centre reads clearly against the tile.
  const pool = ctx.createRadialGradient(width / 2, height * 0.44, 0, width / 2, height * 0.44, width * 0.39)
  pool.addColorStop(0, withAlpha(config.dark, 0.9))
  pool.addColorStop(0.58, withAlpha(config.dark, 0.62))
  pool.addColorStop(1, withAlpha(config.dark, 0))
  ctx.fillStyle = pool
  ctx.fillRect(0, 0, width, height)

  drawEyebrow(ctx, '05 / Pattern', width * 0.08, height * 0.105, config.light, 'left', 0.58)
  drawEyebrow(ctx, 'Infinite mark', width * 0.92, height * 0.105, config.light, 'right', 0.3)

  const heroP = anim(logoT, D * 0.1, D * 0.42, config.layers.logo.easing)
  if (heroP > 0) {
    ctx.save()
    ctx.translate(width / 2, height * 0.43)
    const s = 0.62 + heroP * 0.38
    ctx.scale(s, s)
    ctx.globalAlpha = clamp(heroP * 1.2)
    const r = Math.min(width, height) * 0.205
    ctx.shadowColor = 'rgba(0,0,0,0.4)'
    ctx.shadowBlur = 60
    ctx.shadowOffsetY = 20
    fillRoundRect(ctx, -r, -r, r * 2, r * 2, r * 0.5, config.light)
    ctx.shadowColor = 'transparent'
    drawLogo(ctx, logo, 0, 0, r * 1.08 * config.logoSize, config.dark, 0.95)
    ctx.restore()

    // Glossy diagonal sweep
    ctx.save()
    ctx.beginPath()
    ctx.rect(width / 2 - 205, height * 0.43 - 205, 410, 410)
    ctx.clip()
    ctx.globalAlpha = heroP * 0.22
    ctx.fillStyle = '#FFFFFF'
    ctx.translate(width / 2 - 420 + Math.max(0, logoT - D * 0.22) * 620, height * 0.43)
    ctx.rotate(-0.65)
    ctx.fillRect(-70, -330, 110, 660)
    ctx.restore()
  }

  const wordP = anim(textT, D * 0.34, D * 0.28, config.layers.text.easing)
  drawTrackedTextFit(ctx, config.brandName, width / 2, height * 0.72, width * 0.58, {
    size: Math.min(width, height) * 0.075,
    family: `"${config.fontFamily}", sans-serif`,
    weight: config.fontWeight,
    color: config.light,
    align: 'center',
    tracking: config.tracking,
    alpha: wordP,
  })
  const tagP = anim(textT, D * 0.48, D * 0.26, 'easeOutCubic')
  drawTrackedText(ctx, config.tagline.toUpperCase(), width / 2, height * 0.76, {
    size: 14,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.primary, 0.92),
    align: 'center',
    tracking: 0.4,
    alpha: tagP,
  })
  drawTrackedText(ctx, config.website.toUpperCase(), width / 2, height * 0.87, {
    size: 12,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.light, 0.4),
    align: 'center',
    tracking: 0.3,
    alpha: tagP,
  })
  drawGrain(ctx, width, height, 0.06, 0.00015, 59)
}

function minRadius(width: number, height: number) {
  return Math.min(width, height)
}

export function drawStyle(
  ctx: CanvasRenderingContext2D,
  style: StyleId,
  config: BrandConfig,
  time: number,
  width: number,
  height: number,
  duration: number,
) {
  const context: StyleContext = {
    ctx,
    width,
    height,
    config,
    time,
    duration,
  }
  ctx.save()
  switch (style) {
    case 'reveal':
      drawReveal({ ...context, duration })
      break
    case 'blueprint':
      drawBlueprint({ ...context, duration })
      break
    case 'pulse':
      drawPulse({ ...context, duration })
      break
    case 'lockup':
      drawLockup({ ...context, duration })
      break
    case 'pattern':
      drawPattern({ ...context, duration })
      break
  }
  ctx.restore()
}
