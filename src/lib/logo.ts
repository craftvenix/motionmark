import { hexToRgb, withAlpha } from './colors'

const imageCache = new Map<string, HTMLImageElement>()
const pending = new Map<string, Promise<HTMLImageElement>>()
const tintCache = new Map<string, HTMLCanvasElement>()
const outlineCache = new Map<string, HTMLCanvasElement>()

export function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src)
  if (cached?.complete && cached.naturalWidth > 0) return Promise.resolve(cached)
  const existing = pending.get(src)
  if (existing) return existing
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.decoding = 'async'
    image.onload = () => {
      imageCache.set(src, image)
      pending.delete(src)
      resolve(image)
    }
    image.onerror = () => {
      pending.delete(src)
      reject(new Error('Could not load image'))
    }
    image.src = src
  })
  pending.set(src, promise)
  return promise
}

export function getLoadedImage(src: string | null | undefined) {
  if (!src) return null
  const cached = imageCache.get(src)
  if (cached?.complete && cached.naturalWidth > 0) return cached
  if (!pending.has(src)) {
    loadImage(src).catch(() => undefined)
  }
  return null
}

export function preloadImage(src: string | null | undefined) {
  if (!src) return Promise.resolve(null)
  return loadImage(src).catch(() => null)
}

function sourceSize(image: HTMLImageElement) {
  const naturalW = image.naturalWidth || 512
  const naturalH = image.naturalHeight || 512
  const max = Math.max(naturalW, naturalH)
  const scale = Math.min(1, 720 / max)
  return {
    width: Math.max(1, Math.round(naturalW * scale)),
    height: Math.max(1, Math.round(naturalH * scale)),
  }
}

function buildTint(image: HTMLImageElement, color: string) {
  const key = `${image.src}|${color}`
  const cached = tintCache.get(key)
  if (cached) return cached
  const { width, height } = sourceSize(image)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  ctx.drawImage(image, 0, 0, width, height)
  ctx.globalCompositeOperation = 'source-in'
  ctx.fillStyle = color
  ctx.fillRect(0, 0, width, height)
  tintCache.set(key, canvas)
  return canvas
}

function buildOutline(image: HTMLImageElement, color: string) {
  const key = `${image.src}|${color}|outline`
  const cached = outlineCache.get(key)
  if (cached) return cached
  const tinted = buildTint(image, '#FFFFFF')
  const canvas = document.createElement('canvas')
  canvas.width = tinted.width
  canvas.height = tinted.height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return canvas
  ctx.drawImage(tinted, 0, 0)
  const source = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const out = ctx.createImageData(canvas.width, canvas.height)
  const alphaAt = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return 0
    return source.data[(y * canvas.width + x) * 4 + 3]
  }
  const rgb = hexToRgb(color)
  const threshold = 32
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const index = (y * canvas.width + x) * 4
      const alpha = source.data[index + 3]
      if (alpha < threshold) continue
      const edge =
        alphaAt(x - 1, y) < threshold ||
        alphaAt(x + 1, y) < threshold ||
        alphaAt(x, y - 1) < threshold ||
        alphaAt(x, y + 1) < threshold ||
        alphaAt(x - 1, y - 1) < threshold ||
        alphaAt(x + 1, y + 1) < threshold
      if (!edge) continue
      out.data[index] = rgb.r
      out.data[index + 1] = rgb.g
      out.data[index + 2] = rgb.b
      out.data[index + 3] = 255
    }
  }
  ctx.putImageData(out, 0, 0)
  outlineCache.set(key, canvas)
  return canvas
}

export interface DrawLogoOptions {
  tint?: boolean
  outline?: boolean
  rotation?: number
  globalAlpha?: number
  blend?: GlobalCompositeOperation
  compositeAlpha?: number
  shadow?: boolean
}

/**
 * Draw a logo centered at x/y with the requested visual height.
 * The aspect ratio is always preserved from the source artwork.
 */
export function drawLogo(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
  x: number,
  y: number,
  height: number,
  color: string,
  alpha = 1,
  options: DrawLogoOptions = {},
) {
  if (!image || height <= 0) return
  const { width: sw, height: sh } = sourceSize(image)
  const drawHeight = height
  const drawWidth = (sw / sh) * drawHeight
  const rotation = options.rotation ?? 0
  ctx.save()
  if (options.blend) ctx.globalCompositeOperation = options.blend
  else if (options.tint ?? true) ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = alpha * (options.globalAlpha ?? 1)
  if (options.shadow) {
    ctx.shadowColor = withAlpha(color, 0.36)
    ctx.shadowBlur = drawHeight * 0.28
    ctx.shadowOffsetY = drawHeight * 0.1
  }
  ctx.translate(x, y)
  if (rotation) ctx.rotate(rotation)
  if (options.tint === false) {
    ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)
  } else if (options.outline) {
    const outline = buildOutline(image, color)
    ctx.drawImage(outline, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)
  } else {
    const tinted = buildTint(image, color)
    ctx.drawImage(tinted, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)
  }
  ctx.restore()
}

export function logoAspect(image: HTMLImageElement | null) {
  if (!image) return 1
  const { width, height } = sourceSize(image)
  return width / height
}

export async function rasterizeLogo(src: string, size = 768) {
  const image = await loadImage(src)
  const ratio = image.naturalWidth / image.naturalHeight || 1
  const width = ratio >= 1 ? size : Math.round(size * ratio)
  const height = ratio >= 1 ? Math.round(size / ratio) : size
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  ctx.drawImage(image, 0, 0, width, height)
  return canvas.toDataURL('image/png')
}

export function logoKey(image: HTMLImageElement | null) {
  return image?.src ?? 'none'
}
