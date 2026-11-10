import type { AnimationMode, BrandConfig, StyleId } from '../types'
import { clamp, easeOutCubic, smoothstep } from './easing'
import { drawBrandReel } from './reel'
import { drawEndCard } from './scene-utils'
import {
  SHOWREEL_END_DURATION,
  SHOWREEL_STYLE_DURATION,
  STYLE_DURATION,
  totalDuration,
} from './presets'
import { drawStyle } from './styles'

const styleSequence: StyleId[] = [
  'reveal',
  'blueprint',
  'pulse',
  'lockup',
  'pattern',
]

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

function renderShowreel(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: BrandConfig,
  time: number,
) {
  const styleDuration = SHOWREEL_STYLE_DURATION
  const contentTotal = styleDuration * styleSequence.length
  const duration = totalDuration('showreel', config)
  const t = clamp(time, 0, duration)

  if (t >= contentTotal) {
    const lastBuffer = getBuffer(width, height, 'showreel-last')
    const lastCtx = lastBuffer.getContext('2d')
    if (lastCtx) {
      drawStyle(
        lastCtx,
        'pattern',
        config,
        styleDuration,
        width,
        height,
        styleDuration,
      )
      ctx.drawImage(lastBuffer, 0, 0)
    }
    const progress = smoothstep(
      contentTotal,
      contentTotal + 0.52,
      Math.min(t, contentTotal + SHOWREEL_END_DURATION),
    )
    drawEndCard(ctx, width, height, config, progress, false)
    return
  }

  const index = Math.min(
    styleSequence.length - 1,
    Math.floor(t / styleDuration),
  )
  const local = t - index * styleDuration
  const transition = 0.46
  if (local > styleDuration - transition && index < styleSequence.length - 1) {
    const progress = smoothstep(
      styleDuration - transition,
      styleDuration,
      local,
    )
    const a = getBuffer(width, height, 'showreel-a')
    const b = getBuffer(width, height, 'showreel-b')
    const actx = a.getContext('2d')
    const bctx = b.getContext('2d')
    if (actx && bctx) {
      drawStyle(
        actx,
        styleSequence[index],
        config,
        styleDuration,
        width,
        height,
        styleDuration,
      )
      drawStyle(
        bctx,
        styleSequence[index + 1],
        config,
        0,
        width,
        height,
        styleDuration,
      )
      const eased = easeOutCubic(progress)
      ctx.fillStyle = config.dark
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(a, -eased * width * 0.92, 0)
      ctx.drawImage(b, width * (1 - eased), 0)
      ctx.save()
      ctx.translate(width * (1 - eased) - 4, 0)
      ctx.fillStyle = 'rgba(255,255,255,0.55)'
      ctx.fillRect(0, 0, 2, height)
      ctx.restore()
      return
    }
  }

  drawStyle(
    ctx,
    styleSequence[index],
    config,
    local,
    width,
    height,
    styleDuration,
  )
  // A subtle style counter keeps the reel feeling authored.
  ctx.save()
  ctx.globalAlpha = 0.32
  ctx.fillStyle = config.light
  ctx.font = '500 11px "Space Grotesk", sans-serif'
  ctx.fillText(
    `${String(index + 1).padStart(2, '0')} / 05`,
    60,
    height - 48,
  )
  ctx.restore()
}

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: BrandConfig,
  mode: AnimationMode,
  time: number,
) {
  ctx.save()
  ctx.clearRect(0, 0, width, height)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  if (mode === 'brandreel' || height > width) {
    drawBrandReel(ctx, width, height, config, time)
    ctx.restore()
    return
  }

  if (mode === 'showreel') {
    renderShowreel(ctx, width, height, config, time)
    ctx.restore()
    return
  }

  const style = mode as StyleId
  const contentDuration = STYLE_DURATION - 2.1
  drawStyle(
    ctx,
    styleSequence.includes(style) ? style : 'reveal',
    config,
    Math.min(time, contentDuration),
    width,
    height,
    contentDuration,
  )

  const endProgress = smoothstep(
    contentDuration,
    contentDuration + 0.55,
    Math.min(time, STYLE_DURATION),
  )
  if (endProgress > 0) {
    drawEndCard(ctx, width, height, config, endProgress, false)
  }
  ctx.restore()
}
