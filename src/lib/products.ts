import type { BrandConfig, ProductId } from '../types'
import {
  drawGrain,
  drawImageCover,
  drawSoftShadow,
  drawTextureLines,
  drawTrackedText,
  drawTrackedTextFit,
  fillRoundRect,
  roundRectPath,
  strokeRoundRect,
} from './canvas'
import { shade, withAlpha } from './colors'
import { drawLogo, getLoadedImage } from './logo'

export const PRODUCT_WIDTH = 675
export const PRODUCT_HEIGHT = 1200

const cache = new Map<string, string>()

function productKey(product: ProductId, config: BrandConfig) {
  return [
    product,
    config.logoDataUrl,
    config.logoMonochrome,
    config.logoSize,
    config.brandName,
    config.tagline,
    config.website,
    config.fontFamily,
    config.fontWeight,
    config.tracking,
    config.primary,
    config.secondary,
    config.dark,
    config.light,
  ].join('|')
}

export function getProductImage(product: ProductId, config: BrandConfig) {
  const key = productKey(product, config)
  const cached = cache.get(key)
  if (cached) return cached
  const canvas = document.createElement('canvas')
  canvas.width = PRODUCT_WIDTH
  canvas.height = PRODUCT_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  const logo = getLoadedImage(config.logoDataUrl)
  if (!logo && config.logoDataUrl) {
    // First paint is a placeholder; the render loop asks again once loaded.
    return ''
  }
  renderProduct(ctx, product, config, logo)
  const url = canvas.toDataURL('image/jpeg', 0.9)
  cache.set(key, url)
  if (cache.size > 48) {
    const first = cache.keys().next().value
    if (first) cache.delete(first)
  }
  return url
}

export function clearProductCache() {
  cache.clear()
}

export function renderProduct(
  ctx: CanvasRenderingContext2D,
  product: ProductId,
  config: BrandConfig,
  logo: HTMLImageElement | null,
) {
  ctx.save()
  ctx.clearRect(0, 0, PRODUCT_WIDTH, PRODUCT_HEIGHT)
  switch (product) {
    case 'tshirt':
      drawTshirt(ctx, config, logo)
      break
    case 'tote':
      drawTote(ctx, config, logo)
      break
    case 'lanyard':
      drawLanyard(ctx, config, logo)
      break
    case 'mug':
      drawMug(ctx, config, logo)
      break
    case 'cap':
      drawCap(ctx, config, logo)
      break
    case 'cards':
      drawCards(ctx, config, logo)
      break
    case 'hoodie':
      drawHoodie(ctx, config, logo)
      break
    case 'poster':
      drawPoster(ctx, config, logo)
      break
    case 'notebook':
      drawNotebook(ctx, config, logo)
      break
    case 'bottle':
      drawBottle(ctx, config, logo)
      break
    case 'stickers':
      drawStickers(ctx, config, logo)
      break
    case 'pouch':
      drawPouch(ctx, config, logo)
      break
  }
  drawGrain(ctx, PRODUCT_WIDTH, PRODUCT_HEIGHT, 0.055, 0.00019, product.length * 91)
  ctx.restore()
}

export function drawProductInFrame(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  drawImageCover(ctx, image, x, y, width, height)
}

function studioBackground(
  ctx: CanvasRenderingContext2D,
  top: string,
  bottom: string,
  glow = 'rgba(255,244,222,0.2)',
  glowX = 300,
  glowY = 380,
) {
  const gradient = ctx.createLinearGradient(0, 0, 0, PRODUCT_HEIGHT)
  gradient.addColorStop(0, top)
  gradient.addColorStop(1, bottom)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, PRODUCT_WIDTH, PRODUCT_HEIGHT)
  const radial = ctx.createRadialGradient(
    glowX,
    glowY,
    20,
    glowX,
    glowY,
    620,
  )
  radial.addColorStop(0, glow)
  radial.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = radial
  ctx.fillRect(0, 0, PRODUCT_WIDTH, PRODUCT_HEIGHT)
}

function drawTshirt(
  ctx: CanvasRenderingContext2D,
  config: BrandConfig,
  logo: HTMLImageElement | null,
) {
  studioBackground(
    ctx,
    shade(config.light, 0.04),
    shade(config.secondary, -0.12),
    'rgba(255,250,235,0.75)',
    360,
    300,
  )
  drawSoftShadow(ctx, 338, 962, 470, 70, 28, 'rgba(42,30,20,0.25)')

  const shirt = new Path2D()
  shirt.moveTo(278, 300)
  shirt.bezierCurveTo(303, 320, 372, 320, 397, 300)
  shirt.lineTo(450, 315)
  shirt.bezierCurveTo(498, 332, 540, 367, 562, 422)
  shirt.lineTo(617, 575)
  shirt.lineTo(530, 626)
  shirt.lineTo(493, 555)
  shirt.lineTo(506, 937)
  shirt.bezierCurveTo(397, 953, 278, 953, 169, 937)
  shirt.lineTo(183, 555)
  shirt.lineTo(145, 626)
  shirt.lineTo(58, 575)
  shirt.lineTo(113, 422)
  shirt.bezierCurveTo(135, 367, 177, 332, 225, 315)
  shirt.closePath()

  const fabric = ctx.createLinearGradient(95, 340, 585, 930)
  fabric.addColorStop(0, '#F5F1E8')
  fabric.addColorStop(0.42, '#EDE7DC')
  fabric.addColorStop(0.72, '#E1D8C9')
  fabric.addColorStop(1, '#D4C9B8')
  ctx.save()
  ctx.shadowColor = 'rgba(38,25,16,0.18)'
  ctx.shadowBlur = 28
  ctx.shadowOffsetY = 16
  ctx.fillStyle = fabric
  ctx.fill(shirt)
  ctx.restore()

  ctx.save()
  ctx.clip(shirt)
  const leftShade = ctx.createLinearGradient(110, 0, 240, 0)
  leftShade.addColorStop(0, 'rgba(92,70,45,0.18)')
  leftShade.addColorStop(1, 'rgba(92,70,45,0)')
  ctx.fillStyle = leftShade
  ctx.fillRect(90, 300, 180, 680)
  const rightShade = ctx.createLinearGradient(510, 0, 610, 0)
  rightShade.addColorStop(0, 'rgba(92,70,45,0)')
  rightShade.addColorStop(1, 'rgba(92,70,45,0.16)')
  ctx.fillStyle = rightShade
  ctx.fillRect(455, 300, 170, 680)

  ctx.strokeStyle = 'rgba(104,84,61,0.12)'
  ctx.lineWidth = 2.5
  for (let i = 0; i < 5; i++) {
    ctx.beginPath()
    ctx.moveTo(205 + i * 24, 810 + i * 9)
    ctx.bezierCurveTo(260, 830 + i * 8, 380, 846 + i * 7, 476 - i * 7, 818)
    ctx.stroke()
  }
  ctx.strokeStyle = 'rgba(104,84,61,0.16)'
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    ctx.moveTo(226, 390 + i * 8)
    ctx.bezierCurveTo(280, 404 + i * 9, 395, 404 + i * 9, 448, 390 + i * 8)
    ctx.stroke()
  }
  ctx.restore()

  // Collar
  ctx.beginPath()
  ctx.moveTo(278, 300)
  ctx.bezierCurveTo(300, 326, 375, 326, 397, 300)
  ctx.bezierCurveTo(377, 373, 298, 373, 278, 300)
  ctx.closePath()
  const collar = ctx.createLinearGradient(280, 300, 390, 355)
  collar.addColorStop(0, '#D1C6B5')
  collar.addColorStop(0.55, '#E8E1D4')
  collar.addColorStop(1, '#C9BDAB')
  ctx.fillStyle = collar
  ctx.fill()
  ctx.strokeStyle = 'rgba(106,87,63,0.3)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.strokeStyle = 'rgba(255,255,255,0.24)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(113, 423)
  ctx.lineTo(58, 575)
  ctx.stroke()

  drawLogo(
    ctx,
    logo,
    337,
    553,
    86 * config.logoSize,
    config.dark,
    0.88,
    { blend: 'multiply' },
  )

  drawTrackedText(
    ctx,
    config.brandName,
    338,
    626,
    {
      size: 13,
      family: '"Space Grotesk", sans-serif',
      weight: 600,
      color: withAlpha(config.dark, 0.64),
      align: 'center',
      tracking: 0.28,
    },
  )

  drawGrain(ctx, PRODUCT_WIDTH, PRODUCT_HEIGHT, 0.09, 0.00036, 17)
  ctx.save()
  ctx.globalCompositeOperation = 'multiply'
  const vignette = ctx.createRadialGradient(340, 610, 260, 340, 610, 730)
  vignette.addColorStop(0, 'rgba(255,255,255,0)')
  vignette.addColorStop(1, 'rgba(56,37,22,0.2)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, PRODUCT_WIDTH, PRODUCT_HEIGHT)
  ctx.restore()
}

function drawTote(
  ctx: CanvasRenderingContext2D,
  config: BrandConfig,
  logo: HTMLImageElement | null,
) {
  studioBackground(
    ctx,
    '#DED5C5',
    '#C2B5A2',
    'rgba(255,250,232,0.7)',
    350,
    280,
  )
  drawSoftShadow(ctx, 344, 985, 430, 64, 24, 'rgba(48,34,22,0.28)')

  // Back handle
  ctx.save()
  ctx.strokeStyle = '#C7B89F'
  ctx.lineWidth = 22
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(246, 490)
  ctx.bezierCurveTo(245, 260, 415, 260, 416, 490)
  ctx.stroke()
  ctx.strokeStyle = 'rgba(255,255,255,0.34)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(238, 486)
  ctx.bezierCurveTo(238, 274, 397, 282, 405, 486)
  ctx.stroke()
  ctx.restore()

  const bag = new Path2D()
  bag.moveTo(176, 462)
  bag.bezierCurveTo(255, 450, 420, 450, 500, 462)
  bag.lineTo(490, 955)
  bag.bezierCurveTo(405, 978, 265, 978, 186, 955)
  bag.closePath()
  const fill = ctx.createLinearGradient(180, 470, 500, 950)
  fill.addColorStop(0, '#EFE8D9')
  fill.addColorStop(0.5, '#E4DAC8')
  fill.addColorStop(1, '#D4C7B2')
  ctx.save()
  ctx.shadowColor = 'rgba(44,31,20,0.16)'
  ctx.shadowBlur = 18
  ctx.shadowOffsetY = 10
  ctx.fillStyle = fill
  ctx.fill(bag)
  ctx.restore()

  ctx.save()
  ctx.clip(bag)
  drawTextureLines(ctx, 180, 460, 320, 510, '#5F4D36', 4, 0.06)
  const side = ctx.createLinearGradient(175, 500, 275, 900)
  side.addColorStop(0, 'rgba(77,58,36,0.16)')
  side.addColorStop(1, 'rgba(77,58,36,0)')
  ctx.fillStyle = side
  ctx.fillRect(176, 460, 110, 500)
  const side2 = ctx.createLinearGradient(425, 500, 510, 900)
  side2.addColorStop(0, 'rgba(77,58,36,0)')
  side2.addColorStop(1, 'rgba(77,58,36,0.12)')
  ctx.fillStyle = side2
  ctx.fillRect(420, 460, 90, 500)
  ctx.strokeStyle = 'rgba(90,72,49,0.18)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(235, 790)
  ctx.bezierCurveTo(280, 810, 400, 812, 452, 786)
  ctx.stroke()
  ctx.restore()

  ctx.save()
  ctx.setLineDash([5, 6])
  ctx.strokeStyle = 'rgba(85,68,45,0.28)'
  ctx.lineWidth = 1.4
  roundRectPath(ctx, 196, 480, 284, 452, 3)
  ctx.stroke()
  ctx.restore()

  // Front handle
  ctx.save()
  ctx.strokeStyle = '#D8CBB7'
  ctx.lineWidth = 24
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(247, 480)
  ctx.bezierCurveTo(246, 292, 408, 292, 409, 480)
  ctx.stroke()
  ctx.strokeStyle = 'rgba(96,75,47,0.16)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(258, 480)
  ctx.bezierCurveTo(259, 310, 395, 310, 397, 480)
  ctx.stroke()
  ctx.restore()

  drawLogo(
    ctx,
    logo,
    337,
    646,
    104 * config.logoSize,
    config.dark,
    0.78,
    { blend: 'multiply' },
  )

  drawTrackedText(ctx, config.brandName, 338, 740, {
    size: 14,
    family: '"Space Grotesk", sans-serif',
    weight: 600,
    color: withAlpha(config.dark, 0.66),
    align: 'center',
    tracking: 0.34,
  })
  drawTrackedText(ctx, config.website, 338, 768, {
    size: 10,
    family: '"Space Grotesk", sans-serif',
    weight: 400,
    color: withAlpha(config.dark, 0.46),
    align: 'center',
    tracking: 0.18,
  })

  drawGrain(ctx, PRODUCT_WIDTH, PRODUCT_HEIGHT, 0.08, 0.0003, 29)
}

function drawLanyard(
  ctx: CanvasRenderingContext2D,
  config: BrandConfig,
  logo: HTMLImageElement | null,
) {
  studioBackground(ctx, '#25231F', '#11110F', 'rgba(255,240,213,0.12)', 350, 360)

  // Lanyard straps
  ctx.save()
  ctx.lineCap = 'round'
  ctx.strokeStyle = config.primary
  ctx.lineWidth = 30
  ctx.beginPath()
  ctx.moveTo(214, 0)
  ctx.bezierCurveTo(230, 180, 294, 290, 322, 430)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(461, 0)
  ctx.bezierCurveTo(445, 180, 381, 290, 353, 430)
  ctx.stroke()
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(202, 0)
  ctx.bezierCurveTo(218, 178, 280, 292, 308, 430)
  ctx.stroke()
  ctx.restore()

  // Repeated lanyard marks
  ctx.save()
  ctx.translate(224, 178)
  ctx.rotate(0.42)
  drawTrackedText(ctx, `${config.brandName}  /  ${config.brandName}`, 0, 0, {
    size: 10,
    family: '"Space Grotesk", sans-serif',
    weight: 600,
    color: withAlpha(config.light, 0.72),
    align: 'center',
    tracking: 0.28,
  })
  ctx.restore()

  // Clip
  ctx.save()
  const metal = ctx.createLinearGradient(310, 414, 364, 454)
  metal.addColorStop(0, '#8A8985')
  metal.addColorStop(0.5, '#D8D5CE')
  metal.addColorStop(1, '#777570')
  fillRoundRect(ctx, 306, 414, 62, 38, 8, metal)
  ctx.fillStyle = '#262624'
  fillRoundRect(ctx, 322, 402, 30, 26, 4, '#262624')
  ctx.restore()

  // Badge
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.62)'
  ctx.shadowBlur = 42
  ctx.shadowOffsetY = 24
  const badge = ctx.createLinearGradient(220, 440, 455, 810)
  badge.addColorStop(0, '#F7F3EA')
  badge.addColorStop(1, '#DDD5C7')
  fillRoundRect(ctx, 220, 448, 235, 360, 22, badge)
  ctx.restore()
  strokeRoundRect(ctx, 220, 448, 235, 360, 22, 'rgba(255,255,255,0.32)', 1)

  strokeRoundRect(ctx, 236, 466, 203, 66, 12, 'rgba(40,33,25,0.1)', 1)
  fillRoundRect(ctx, 337, 484, 46, 5, 2.5, withAlpha(config.dark, 0.22))

  drawLogo(ctx, logo, 337, 565, 58 * config.logoSize, config.dark, 0.92)

  drawTrackedTextFit(ctx, config.brandName, 337, 630, 180, {
    size: 28,
    family: `"${config.fontFamily}", sans-serif`,
    weight: config.fontWeight,
    color: config.dark,
    align: 'center',
    tracking: config.tracking,
  })
  drawTrackedText(ctx, 'STUDIO ACCESS', 337, 656, {
    size: 9,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.dark, 0.55),
    align: 'center',
    tracking: 0.3,
  })

  ctx.save()
  ctx.fillStyle = withAlpha(config.primary, 0.9)
  fillRoundRect(ctx, 246, 684, 182, 31, 15.5, withAlpha(config.primary, 0.12))
  drawTrackedText(ctx, 'IDENTITY / 2026', 337, 704, {
    size: 9,
    family: '"Space Grotesk", sans-serif',
    weight: 600,
    color: config.primary,
    align: 'center',
    tracking: 0.24,
  })
  ctx.restore()

  // Barcode
  let x = 250
  for (let i = 0; i < 26; i++) {
    const width = i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : 1.2
    ctx.fillStyle = withAlpha(config.dark, 0.72)
    ctx.fillRect(x, 742, width, 34)
    x += width + 2.7
  }
  drawTrackedText(ctx, config.website.toUpperCase(), 337, 795, {
    size: 8,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.dark, 0.5),
    align: 'center',
    tracking: 0.2,
  })

  drawGrain(ctx, PRODUCT_WIDTH, PRODUCT_HEIGHT, 0.11, 0.00032, 41)
  drawSoftShadow(ctx, 337, 845, 240, 26, 16, 'rgba(0,0,0,0.38)')
}

function drawMug(
  ctx: CanvasRenderingContext2D,
  config: BrandConfig,
  logo: HTMLImageElement | null,
) {
  studioBackground(ctx, '#D9D0C0', '#B6A891', 'rgba(255,247,228,0.8)', 250, 280)
  // Plinth
  ctx.fillStyle = '#B4A48C'
  ctx.fillRect(0, 880, PRODUCT_WIDTH, 320)
  const plinthShade = ctx.createLinearGradient(0, 880, 0, 1200)
  plinthShade.addColorStop(0, 'rgba(255,255,255,0.12)')
  plinthShade.addColorStop(1, 'rgba(40,24,12,0.24)')
  ctx.fillStyle = plinthShade
  ctx.fillRect(0, 880, PRODUCT_WIDTH, 320)
  drawSoftShadow(ctx, 350, 890, 330, 52, 18, 'rgba(40,24,12,0.28)')

  // Handle
  ctx.save()
  ctx.strokeStyle = '#DBD0BE'
  ctx.lineWidth = 48
  ctx.beginPath()
  ctx.ellipse(513, 650, 79, 141, 0, -Math.PI / 2, Math.PI / 2)
  ctx.stroke()
  ctx.strokeStyle = 'rgba(255,255,255,0.38)'
  ctx.lineWidth = 9
  ctx.beginPath()
  ctx.ellipse(510, 650, 79, 141, 0, -Math.PI / 2.2, Math.PI / 2.2)
  ctx.stroke()
  ctx.restore()

  // Body
  const body = ctx.createLinearGradient(208, 0, 474, 0)
  body.addColorStop(0, '#C6BAA6')
  body.addColorStop(0.18, '#EEE6D6')
  body.addColorStop(0.42, '#F8F2E6')
  body.addColorStop(0.73, '#E9DFCE')
  body.addColorStop(1, '#BCAF9A')
  ctx.beginPath()
  ctx.moveTo(208, 492)
  ctx.bezierCurveTo(208, 470, 476, 470, 476, 492)
  ctx.lineTo(467, 826)
  ctx.bezierCurveTo(467, 862, 217, 862, 217, 826)
  ctx.closePath()
  ctx.fillStyle = body
  ctx.fill()

  // Rim + opening
  ctx.beginPath()
  ctx.ellipse(342, 492, 134, 27, 0, 0, Math.PI * 2)
  const rim = ctx.createLinearGradient(210, 480, 474, 508)
  rim.addColorStop(0, '#EFE8D9')
  rim.addColorStop(0.5, '#FFF9ED')
  rim.addColorStop(1, '#CFC3B0')
  ctx.fillStyle = rim
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(342, 496, 113, 17, 0, 0, Math.PI * 2)
  const inside = ctx.createRadialGradient(330, 495, 5, 340, 497, 120)
  inside.addColorStop(0, '#8C7F6C')
  inside.addColorStop(0.7, '#A89A84')
  inside.addColorStop(1, '#D5C9B5')
  ctx.fillStyle = inside
  ctx.fill()

  // Bottom ellipse
  ctx.beginPath()
  ctx.ellipse(342, 828, 125, 22, 0, 0, Math.PI)
  ctx.strokeStyle = 'rgba(86,67,45,0.2)'
  ctx.lineWidth = 2
  ctx.stroke()

  // Gloss
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(208, 492)
  ctx.bezierCurveTo(208, 470, 476, 470, 476, 492)
  ctx.lineTo(467, 826)
  ctx.bezierCurveTo(467, 862, 217, 862, 217, 826)
  ctx.closePath()
  ctx.clip()
  const gloss = ctx.createLinearGradient(228, 0, 300, 0)
  gloss.addColorStop(0, 'rgba(255,255,255,0)')
  gloss.addColorStop(0.45, 'rgba(255,255,255,0.46)')
  gloss.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gloss
  ctx.fillRect(210, 480, 100, 400)
  ctx.restore()

  drawLogo(
    ctx,
    logo,
    342,
    658,
    92 * config.logoSize,
    config.dark,
    0.88,
    { blend: 'multiply' },
  )
  drawTrackedText(ctx, config.brandName, 342, 718, {
    size: 11,
    family: '"Space Grotesk", sans-serif',
    weight: 600,
    color: withAlpha(config.dark, 0.58),
    align: 'center',
    tracking: 0.28,
  })

  // Secondary band
  ctx.fillStyle = withAlpha(config.primary, 0.9)
  ctx.fillRect(222, 780, 240, 3)

  drawGrain(ctx, PRODUCT_WIDTH, PRODUCT_HEIGHT, 0.08, 0.00029, 53)
}

function drawCap(
  ctx: CanvasRenderingContext2D,
  config: BrandConfig,
  logo: HTMLImageElement | null,
) {
  studioBackground(ctx, '#2B2925', '#0F0F0E', 'rgba(255,239,211,0.18)', 330, 320)
  drawSoftShadow(ctx, 340, 788, 480, 54, 24, 'rgba(0,0,0,0.52)')

  // Brim
  ctx.save()
  const brim = new Path2D()
  brim.moveTo(152, 628)
  brim.bezierCurveTo(252, 670, 430, 670, 526, 626)
  brim.bezierCurveTo(592, 642, 621, 674, 597, 706)
  brim.bezierCurveTo(503, 754, 329, 760, 117, 707)
  brim.bezierCurveTo(84, 679, 101, 646, 152, 628)
  brim.closePath()
  const brimFill = ctx.createLinearGradient(130, 630, 590, 740)
  brimFill.addColorStop(0, '#302E2A')
  brimFill.addColorStop(0.42, '#46423C')
  brimFill.addColorStop(1, '#22211E')
  ctx.fillStyle = brimFill
  ctx.fill(brim)
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'
  ctx.lineWidth = 1.4
  ctx.stroke()
  ctx.save()
  ctx.clip(brim)
  ctx.strokeStyle = 'rgba(235,222,199,0.2)'
  ctx.setLineDash([4, 5])
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(139, 652)
  ctx.bezierCurveTo(243, 700, 429, 700, 543, 650)
  ctx.stroke()
  ctx.restore()
  ctx.restore()

  // Dome
  const dome = new Path2D()
  dome.moveTo(159, 628)
  dome.bezierCurveTo(165, 451, 243, 340, 338, 340)
  dome.bezierCurveTo(433, 340, 511, 451, 517, 628)
  dome.bezierCurveTo(413, 666, 263, 666, 159, 628)
  dome.closePath()
  const capFill = ctx.createLinearGradient(150, 370, 530, 650)
  capFill.addColorStop(0, '#3D3A35')
  capFill.addColorStop(0.35, '#55514A')
  capFill.addColorStop(0.7, '#37342F')
  capFill.addColorStop(1, '#292824')
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.45)'
  ctx.shadowBlur = 22
  ctx.shadowOffsetY = 15
  ctx.fillStyle = capFill
  ctx.fill(dome)
  ctx.restore()

  // Panel seams
  ctx.save()
  ctx.strokeStyle = 'rgba(17,16,15,0.42)'
  ctx.lineWidth = 2.2
  ctx.beginPath()
  ctx.moveTo(338, 341)
  ctx.bezierCurveTo(329, 440, 325, 530, 334, 648)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(252, 373)
  ctx.bezierCurveTo(285, 456, 300, 548, 294, 643)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(424, 373)
  ctx.bezierCurveTo(391, 456, 377, 548, 382, 643)
  ctx.stroke()
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(257, 375)
  ctx.bezierCurveTo(290, 458, 305, 550, 299, 645)
  ctx.stroke()
  ctx.restore()

  // Eyelets
  ctx.fillStyle = '#262522'
  for (const [x, y] of [
    [280, 450],
    [398, 450],
    [240, 540],
    [438, 540],
  ]) {
    ctx.beginPath()
    ctx.arc(x, y, 4.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.14)'
    ctx.lineWidth = 1
    ctx.stroke()
  }

  // Button
  ctx.beginPath()
  ctx.arc(338, 338, 12, 0, Math.PI * 2)
  ctx.fillStyle = '#302E2A'
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'
  ctx.stroke()

  // Embroidery mark
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = 4
  ctx.shadowOffsetY = 3
  drawLogo(
    ctx,
    logo,
    338,
    528,
    76 * config.logoSize,
    config.light,
    0.94,
    { blend: 'multiply' },
  )
  ctx.restore()
  ctx.save()
  ctx.globalAlpha = 0.38
  drawTrackedText(ctx, config.brandName, 338, 584, {
    size: 10,
    family: '"Space Grotesk", sans-serif',
    weight: 600,
    color: config.light,
    align: 'center',
    tracking: 0.32,
  })
  ctx.restore()

  drawGrain(ctx, PRODUCT_WIDTH, PRODUCT_HEIGHT, 0.1, 0.00034, 67)
}

function drawCards(
  ctx: CanvasRenderingContext2D,
  config: BrandConfig,
  logo: HTMLImageElement | null,
) {
  studioBackground(ctx, '#E9E1D2', '#C7BBA7', 'rgba(255,250,234,0.8)', 320, 290)
  drawSoftShadow(ctx, 338, 880, 600, 100, 36, 'rgba(45,30,18,0.28)')

  const cardW = 375
  const cardH = 224
  const drawCard = (
    offsetX: number,
    offsetY: number,
    rotation: number,
    fill: string,
  ) => {
    ctx.save()
    ctx.translate(338 + offsetX, 630 + offsetY)
    ctx.rotate(rotation)
    ctx.transform(1, -0.055, -0.32, 0.98, 0, 0)
    ctx.shadowColor = 'rgba(35,22,12,0.22)'
    ctx.shadowBlur = 18
    ctx.shadowOffsetY = 12
    fillRoundRect(ctx, -cardW / 2, -cardH / 2, cardW, cardH, 12, fill)
    ctx.restore()
  }

  drawCard(20, 42, 0.2, '#B96D4C')
  drawCard(8, 22, 0.18, '#2B2420')
  drawCard(-18, 0, 0.16, '#EFE7D9')

  ctx.save()
  ctx.translate(338, 626)
  ctx.rotate(0.16)
  ctx.transform(1, -0.055, -0.32, 0.98, 0, 0)

  drawLogo(
    ctx,
    logo,
    -78,
    -8,
    56 * config.logoSize,
    config.dark,
    0.88,
    { blend: 'multiply' },
  )

  drawTrackedTextFit(ctx, config.brandName, 70, 2, 155, {
    size: 24,
    family: `"${config.fontFamily}", sans-serif`,
    weight: config.fontWeight,
    color: config.dark,
    align: 'center',
    tracking: config.tracking,
  })
  drawTrackedText(ctx, config.website, 70, 25, {
    size: 8,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.dark, 0.54),
    align: 'center',
    tracking: 0.2,
  })
  ctx.fillStyle = withAlpha(config.primary, 0.85)
  ctx.fillRect(-150, 78, 300, 2)
  drawTrackedText(ctx, config.tagline.toUpperCase(), 0, 96, {
    size: 6.5,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.dark, 0.48),
    align: 'center',
    tracking: 0.24,
  })
  ctx.restore()

  // Edge stack detail
  ctx.save()
  ctx.translate(330, 748)
  ctx.rotate(0.16)
  ctx.transform(1, -0.055, -0.32, 0.98, 0, 0)
  ctx.strokeStyle = 'rgba(255,255,255,0.16)'
  ctx.lineWidth = 1
  for (let i = 0; i < 4; i++) {
    ctx.beginPath()
    ctx.moveTo(-168, i * 3)
    ctx.lineTo(168, i * 3)
    ctx.stroke()
  }
  ctx.restore()

  drawGrain(ctx, PRODUCT_WIDTH, PRODUCT_HEIGHT, 0.075, 0.00028, 83)
}

function drawHoodie(
  ctx: CanvasRenderingContext2D,
  config: BrandConfig,
  logo: HTMLImageElement | null,
) {
  studioBackground(ctx, '#2C2A26', '#0E0E0D', 'rgba(255,238,206,0.18)', 340, 300)
  drawSoftShadow(ctx, 338, 1042, 490, 72, 34, 'rgba(0,0,0,0.58)')

  const body = new Path2D()
  body.moveTo(252, 326)
  body.bezierCurveTo(286, 358, 390, 358, 424, 326)
  body.lineTo(486, 346)
  body.bezierCurveTo(542, 364, 585, 408, 604, 468)
  body.lineTo(644, 700)
  body.lineTo(548, 732)
  body.lineTo(518, 648)
  body.lineTo(536, 1004)
  body.bezierCurveTo(404, 1030, 272, 1030, 140, 1004)
  body.lineTo(158, 648)
  body.lineTo(128, 732)
  body.lineTo(32, 700)
  body.lineTo(72, 468)
  body.bezierCurveTo(91, 408, 134, 364, 190, 346)
  body.closePath()

  const fabric = ctx.createLinearGradient(70, 340, 610, 1010)
  fabric.addColorStop(0, '#4B4740')
  fabric.addColorStop(0.3, '#3B3833')
  fabric.addColorStop(0.62, '#2D2B27')
  fabric.addColorStop(1, '#22211E')
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = 34
  ctx.shadowOffsetY = 20
  ctx.fillStyle = fabric
  ctx.fill(body)
  ctx.restore()

  // Hood opening behind the chest panel.
  const hood = new Path2D()
  hood.moveTo(262, 326)
  hood.bezierCurveTo(244, 418, 282, 470, 338, 470)
  hood.bezierCurveTo(394, 470, 432, 418, 414, 326)
  hood.bezierCurveTo(388, 410, 288, 410, 262, 326)
  hood.closePath()
  const hoodFill = ctx.createLinearGradient(260, 330, 414, 470)
  hoodFill.addColorStop(0, '#171614')
  hoodFill.addColorStop(0.55, '#262420')
  hoodFill.addColorStop(1, '#121211')
  ctx.fillStyle = hoodFill
  ctx.fill(hood)
  ctx.strokeStyle = 'rgba(255,255,255,0.09)'
  ctx.lineWidth = 2
  ctx.stroke()

  // Hood rim.
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'
  ctx.lineWidth = 15
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(258, 330)
  ctx.bezierCurveTo(244, 430, 284, 486, 338, 486)
  ctx.bezierCurveTo(392, 486, 432, 430, 418, 330)
  ctx.stroke()
  ctx.strokeStyle = 'rgba(0,0,0,0.32)'
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.restore()

  // Drawstrings.
  ctx.save()
  ctx.strokeStyle = '#D9D1C2'
  ctx.lineWidth = 5
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(316, 432)
  ctx.bezierCurveTo(307, 482, 304, 532, 309, 578)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(362, 432)
  ctx.bezierCurveTo(371, 482, 374, 532, 369, 578)
  ctx.stroke()
  ctx.fillStyle = config.primary
  fillRoundRect(ctx, 302, 574, 14, 22, 5, config.primary)
  fillRoundRect(ctx, 362, 574, 14, 22, 5, config.primary)
  ctx.restore()

  // Kangaroo pocket.
  const pocket = new Path2D()
  pocket.moveTo(218, 748)
  pocket.lineTo(458, 748)
  pocket.bezierCurveTo(462, 836, 438, 880, 390, 892)
  pocket.lineTo(286, 892)
  pocket.bezierCurveTo(238, 880, 214, 836, 218, 748)
  pocket.closePath()
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'
  ctx.lineWidth = 2.5
  ctx.stroke(pocket)
  ctx.fillStyle = 'rgba(0,0,0,0.14)'
  ctx.fill(pocket)
  ctx.restore()

  // Ribbed hem and cuffs.
  const rib = (x: number, y: number, w: number, h: number, angle = 0) => {
    ctx.save()
    ctx.translate(x + w / 2, y + h / 2)
    ctx.rotate(angle)
    fillRoundRect(ctx, -w / 2, -h / 2, w, h, 8, 'rgba(24,23,21,0.72)')
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.lineWidth = 1.4
    for (let i = -w / 2 + 8; i < w / 2; i += 9) {
      ctx.beginPath()
      ctx.moveTo(i, -h / 2 + 4)
      ctx.lineTo(i, h / 2 - 4)
      ctx.stroke()
    }
    ctx.restore()
  }
  rib(145, 976, 386, 54)
  rib(548, 676, 96, 58, 0.13)
  rib(32, 644, 96, 58, -0.13)

  drawLogo(
    ctx,
    logo,
    338,
    614,
    82 * config.logoSize,
    config.light,
    0.92,
    { blend: 'screen' },
  )
  drawTrackedText(ctx, config.brandName, 338, 690, {
    size: 12,
    family: '"Space Grotesk", sans-serif',
    weight: 600,
    color: withAlpha(config.light, 0.5),
    align: 'center',
    tracking: 0.3,
  })

  drawGrain(ctx, PRODUCT_WIDTH, PRODUCT_HEIGHT, 0.1, 0.00034, 31)
  ctx.save()
  ctx.globalCompositeOperation = 'multiply'
  const vignette = ctx.createRadialGradient(340, 640, 250, 340, 640, 760)
  vignette.addColorStop(0, 'rgba(255,255,255,0)')
  vignette.addColorStop(1, 'rgba(0,0,0,0.34)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, PRODUCT_WIDTH, PRODUCT_HEIGHT)
  ctx.restore()
}

function drawPoster(
  ctx: CanvasRenderingContext2D,
  config: BrandConfig,
  logo: HTMLImageElement | null,
) {
  studioBackground(ctx, '#E9DFCE', '#C8B8A1', 'rgba(255,249,234,0.82)', 300, 290)
  drawSoftShadow(ctx, 370, 948, 540, 64, 30, 'rgba(45,30,18,0.3)')

  ctx.save()
  ctx.translate(338, 596)
  ctx.rotate(-0.014)

  const frame = ctx.createLinearGradient(-230, -330, 230, 330)
  frame.addColorStop(0, '#39352F')
  frame.addColorStop(0.5, '#1D1B18')
  frame.addColorStop(1, '#2B2823')
  ctx.save()
  ctx.shadowColor = 'rgba(34,22,12,0.4)'
  ctx.shadowBlur = 34
  ctx.shadowOffsetY = 22
  fillRoundRect(ctx, -230, -330, 460, 660, 5, frame)
  ctx.restore()
  fillRoundRect(ctx, -216, -316, 432, 632, 2, '#141210')
  fillRoundRect(ctx, -204, -304, 408, 608, 1, config.light)

  // Paper depth.
  const paperShade = ctx.createLinearGradient(-204, -304, 204, 304)
  paperShade.addColorStop(0, 'rgba(255,255,255,0.34)')
  paperShade.addColorStop(0.5, 'rgba(255,255,255,0)')
  paperShade.addColorStop(1, 'rgba(55,36,20,0.12)')
  ctx.fillStyle = paperShade
  ctx.fillRect(-204, -304, 408, 608)

  // Glass glare.
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(-204, -304)
  ctx.lineTo(30, -304)
  ctx.lineTo(-120, 304)
  ctx.lineTo(-204, 304)
  ctx.closePath()
  const glare = ctx.createLinearGradient(-204, -304, -20, 304)
  glare.addColorStop(0, 'rgba(255,255,255,0.34)')
  glare.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = glare
  ctx.fill()
  ctx.restore()

  drawLogo(
    ctx,
    logo,
    0,
    -138,
    78 * config.logoSize,
    config.dark,
    0.92,
    { blend: 'multiply' },
  )
  drawTrackedTextFit(ctx, config.brandName, 0, -22, 294, {
    size: 46,
    family: `"${config.fontFamily}", sans-serif`,
    weight: config.fontWeight,
    color: config.dark,
    align: 'center',
    tracking: config.tracking,
  })
  drawTrackedText(ctx, config.tagline.toUpperCase(), 0, 16, {
    size: 7.5,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.dark, 0.5),
    align: 'center',
    tracking: 0.3,
  })

  ctx.fillStyle = withAlpha(config.primary, 0.85)
  ctx.fillRect(-112, 58, 224, 2)
  drawTrackedText(ctx, config.website.toUpperCase(), 0, 88, {
    size: 7,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.dark, 0.46),
    align: 'center',
    tracking: 0.24,
  })

  // Exhibition card at the foot of the print.
  ctx.strokeStyle = withAlpha(config.dark, 0.18)
  ctx.lineWidth = 1
  ctx.strokeRect(-150, 206, 300, 54)
  drawTrackedText(ctx, `${config.brandName} / EDITION 01`, 0, 228, {
    size: 7,
    family: '"Space Grotesk", sans-serif',
    weight: 600,
    color: withAlpha(config.dark, 0.56),
    align: 'center',
    tracking: 0.2,
  })
  drawTrackedText(ctx, 'PRINTED ON ARCHIVAL STOCK', 0, 246, {
    size: 5.6,
    family: '"Space Grotesk", sans-serif',
    weight: 400,
    color: withAlpha(config.dark, 0.38),
    align: 'center',
    tracking: 0.18,
  })
  ctx.restore()

  // Contact shadow and floor.
  ctx.fillStyle = 'rgba(64,42,24,0.16)'
  ctx.beginPath()
  ctx.ellipse(390, 924, 280, 18, 0, 0, Math.PI * 2)
  ctx.fill()
  drawGrain(ctx, PRODUCT_WIDTH, PRODUCT_HEIGHT, 0.07, 0.00026, 47)
}

function drawNotebook(
  ctx: CanvasRenderingContext2D,
  config: BrandConfig,
  logo: HTMLImageElement | null,
) {
  studioBackground(ctx, '#EAE1D2', '#C7B7A1', 'rgba(255,250,236,0.84)', 320, 300)
  drawSoftShadow(ctx, 344, 906, 480, 78, 28, 'rgba(45,30,18,0.3)')

  ctx.save()
  ctx.translate(335, 648)
  ctx.rotate(-0.055)

  // Back cover and page block.
  ctx.save()
  ctx.shadowColor = 'rgba(35,22,12,0.26)'
  ctx.shadowBlur = 24
  ctx.shadowOffsetY = 14
  fillRoundRect(ctx, -206, -322, 412, 644, 18, shade(config.dark, -0.06))
  ctx.restore()
  fillRoundRect(ctx, -194, -308, 388, 620, 12, '#F8F1E4')

  ctx.save()
  ctx.beginPath()
  roundRectPath(ctx, -194, -308, 388, 620, 12)
  ctx.clip()
  for (let i = 0; i < 46; i++) {
    ctx.strokeStyle = `rgba(96,76,52,${i % 4 === 0 ? 0.15 : 0.08})`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(150, -306 + i * 13.4)
    ctx.lineTo(196, -306 + i * 13.4)
    ctx.stroke()
  }
  ctx.restore()

  // Front cover.
  const cover = ctx.createLinearGradient(-200, -316, 200, 316)
  cover.addColorStop(0, shade(config.dark, 0.1))
  cover.addColorStop(0.52, config.dark)
  cover.addColorStop(1, shade(config.dark, -0.16))
  ctx.save()
  ctx.shadowColor = 'rgba(35,22,12,0.3)'
  ctx.shadowBlur = 20
  ctx.shadowOffsetY = 10
  fillRoundRect(ctx, -200, -316, 400, 632, 15, cover)
  ctx.restore()

  // Spine shading.
  const spine = ctx.createLinearGradient(-200, 0, -120, 0)
  spine.addColorStop(0, 'rgba(0,0,0,0.3)')
  spine.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = spine
  ctx.fillRect(-200, -316, 90, 632)

  // Elastic closure.
  ctx.save()
  ctx.fillStyle = withAlpha(config.secondary, 0.9)
  fillRoundRect(ctx, 118, -326, 13, 652, 4, withAlpha(config.secondary, 0.9))
  ctx.fillStyle = 'rgba(0,0,0,0.18)'
  ctx.fillRect(118, -326, 3, 652)
  ctx.restore()

  // Debossed mark.
  ctx.save()
  ctx.globalAlpha = 0.92
  drawLogo(ctx, logo, -20, -64, 82 * config.logoSize, config.light, 0.9)
  ctx.restore()
  drawTrackedTextFit(ctx, config.brandName, -20, 34, 250, {
    size: 32,
    family: `"${config.fontFamily}", sans-serif`,
    weight: config.fontWeight,
    color: withAlpha(config.light, 0.9),
    align: 'center',
    tracking: config.tracking,
  })
  drawTrackedText(ctx, config.tagline.toUpperCase(), -20, 62, {
    size: 6.5,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.light, 0.42),
    align: 'center',
    tracking: 0.28,
  })

  ctx.fillStyle = withAlpha(config.primary, 0.9)
  ctx.fillRect(-116, 112, 192, 2)
  drawTrackedText(ctx, config.website.toUpperCase(), -20, 140, {
    size: 6.5,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.light, 0.4),
    align: 'center',
    tracking: 0.22,
  })

  // Ribbon bookmark.
  ctx.fillStyle = withAlpha(config.primary, 0.92)
  ctx.beginPath()
  ctx.moveTo(-152, -326)
  ctx.lineTo(-118, -326)
  ctx.lineTo(-118, -222)
  ctx.lineTo(-135, -242)
  ctx.lineTo(-152, -222)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  drawGrain(ctx, PRODUCT_WIDTH, PRODUCT_HEIGHT, 0.075, 0.00028, 59)
}

function drawBottle(
  ctx: CanvasRenderingContext2D,
  config: BrandConfig,
  logo: HTMLImageElement | null,
) {
  studioBackground(ctx, '#252320', '#0C0C0B', 'rgba(255,240,213,0.16)', 340, 280)

  // Plinth.
  ctx.fillStyle = '#1A1918'
  ctx.fillRect(0, 932, PRODUCT_WIDTH, 268)
  const plinth = ctx.createLinearGradient(0, 932, 0, 1200)
  plinth.addColorStop(0, 'rgba(255,255,255,0.09)')
  plinth.addColorStop(1, 'rgba(0,0,0,0.35)')
  ctx.fillStyle = plinth
  ctx.fillRect(0, 932, PRODUCT_WIDTH, 268)
  drawSoftShadow(ctx, 338, 944, 270, 46, 20, 'rgba(0,0,0,0.6)')

  // Neck and cap.
  ctx.save()
  const neck = ctx.createLinearGradient(292, 0, 382, 0)
  neck.addColorStop(0, '#6B6861')
  neck.addColorStop(0.28, '#D7D3C9')
  neck.addColorStop(0.55, '#F2EEE4')
  neck.addColorStop(1, '#77746C')
  fillRoundRect(ctx, 300, 318, 76, 94, 10, neck)
  const cap = ctx.createLinearGradient(288, 0, 390, 0)
  cap.addColorStop(0, '#59564F')
  cap.addColorStop(0.3, '#BDB9B0')
  cap.addColorStop(0.58, '#E9E4DA')
  cap.addColorStop(1, '#5C5952')
  fillRoundRect(ctx, 290, 256, 96, 70, 13, cap)
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'
  ctx.lineWidth = 1.4
  for (let i = 0; i < 7; i++) {
    const y = 266 + i * 8
    ctx.beginPath()
    ctx.moveTo(296, y)
    ctx.lineTo(380, y)
    ctx.stroke()
  }
  ctx.fillStyle = 'rgba(0,0,0,0.22)'
  fillRoundRect(ctx, 326, 306, 24, 12, 4, 'rgba(0,0,0,0.22)')
  ctx.restore()

  // Body.
  const body = new Path2D()
  body.moveTo(302, 396)
  body.bezierCurveTo(280, 412, 246, 436, 240, 486)
  body.lineTo(248, 894)
  body.bezierCurveTo(250, 934, 426, 934, 428, 894)
  body.lineTo(436, 486)
  body.bezierCurveTo(430, 436, 396, 412, 374, 396)
  body.closePath()
  const metal = ctx.createLinearGradient(232, 0, 446, 0)
  metal.addColorStop(0, '#4C4A45')
  metal.addColorStop(0.16, '#918D84')
  metal.addColorStop(0.36, '#E7E2D8')
  metal.addColorStop(0.52, '#FAF6EC')
  metal.addColorStop(0.72, '#B4B0A7')
  metal.addColorStop(0.88, '#706D66')
  metal.addColorStop(1, '#3D3B37')
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = 28
  ctx.shadowOffsetY = 16
  ctx.fillStyle = metal
  ctx.fill(body)
  ctx.restore()

  // Vertical brushed highlight.
  ctx.save()
  ctx.clip(body)
  const highlight = ctx.createLinearGradient(280, 0, 360, 0)
  highlight.addColorStop(0, 'rgba(255,255,255,0)')
  highlight.addColorStop(0.5, 'rgba(255,255,255,0.34)')
  highlight.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = highlight
  ctx.fillRect(276, 392, 94, 548)
  ctx.strokeStyle = 'rgba(0,0,0,0.08)'
  ctx.lineWidth = 1
  for (let i = 0; i < 30; i++) {
    ctx.beginPath()
    ctx.moveTo(240 + i * 6.5, 400)
    ctx.lineTo(243 + i * 6.5, 930)
    ctx.stroke()
  }
  const bottomShade = ctx.createLinearGradient(0, 820, 0, 934)
  bottomShade.addColorStop(0, 'rgba(0,0,0,0)')
  bottomShade.addColorStop(1, 'rgba(0,0,0,0.28)')
  ctx.fillStyle = bottomShade
  ctx.fillRect(230, 810, 230, 130)
  ctx.restore()

  // Etched collar rings.
  ctx.strokeStyle = 'rgba(255,255,255,0.16)'
  ctx.lineWidth = 1.5
  for (const y of [424, 442]) {
    ctx.beginPath()
    ctx.ellipse(338, y, 92, 9, 0, 0, Math.PI * 2)
    ctx.stroke()
  }

  drawLogo(
    ctx,
    logo,
    338,
    652,
    88 * config.logoSize,
    config.light,
    0.9,
    { blend: 'screen' },
  )
  drawTrackedText(ctx, config.brandName, 338, 730, {
    size: 11,
    family: '"Space Grotesk", sans-serif',
    weight: 600,
    color: withAlpha(config.light, 0.62),
    align: 'center',
    tracking: 0.3,
  })
  ctx.fillStyle = withAlpha(config.primary, 0.9)
  ctx.fillRect(250, 806, 176, 2)
  drawTrackedText(ctx, config.website.toUpperCase(), 338, 832, {
    size: 6.6,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.light, 0.38),
    align: 'center',
    tracking: 0.22,
  })

  drawGrain(ctx, PRODUCT_WIDTH, PRODUCT_HEIGHT, 0.09, 0.00031, 73)
  drawVignetteLocal(ctx)
}

function drawStickers(
  ctx: CanvasRenderingContext2D,
  config: BrandConfig,
  logo: HTMLImageElement | null,
) {
  studioBackground(ctx, '#F0E8D9', '#CEC0AB', 'rgba(255,251,239,0.86)', 320, 300)

  ctx.save()
  ctx.translate(338, 618)
  ctx.rotate(-0.032)

  // Sheet.
  ctx.save()
  ctx.shadowColor = 'rgba(45,30,18,0.28)'
  ctx.shadowBlur = 28
  ctx.shadowOffsetY = 18
  fillRoundRect(ctx, -246, -340, 492, 680, 20, '#FAF5EC')
  ctx.restore()
  strokeRoundRect(ctx, -246, -340, 492, 680, 20, 'rgba(95,73,47,0.16)', 1.4)
  drawTextureLines(ctx, -246, -340, 492, 680, '#6B5335', 8, 0.035)

  drawTrackedText(ctx, 'STICKER SHEET / 06', 0, -304, {
    size: 8,
    family: '"Space Grotesk", sans-serif',
    weight: 600,
    color: withAlpha(config.dark, 0.52),
    align: 'center',
    tracking: 0.26,
  })
  ctx.strokeStyle = withAlpha(config.dark, 0.16)
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(-210, -290)
  ctx.lineTo(210, -290)
  ctx.stroke()

  // Circle mark sticker.
  ctx.save()
  ctx.shadowColor = 'rgba(45,30,18,0.2)'
  ctx.shadowBlur = 11
  ctx.shadowOffsetY = 5
  ctx.beginPath()
  ctx.arc(-116, -190, 82, 0, Math.PI * 2)
  ctx.fillStyle = config.primary
  ctx.fill()
  ctx.restore()
  ctx.save()
  ctx.beginPath()
  ctx.arc(-116, -190, 82, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255,255,255,0.32)'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.restore()
  drawLogo(ctx, logo, -116, -206, 58 * config.logoSize, config.light, 0.94)
  drawTrackedText(ctx, config.brandName, -116, -152, {
    size: 7,
    family: '"Space Grotesk", sans-serif',
    weight: 600,
    color: withAlpha(config.light, 0.72),
    align: 'center',
    tracking: 0.22,
  })

  // Rounded label sticker.
  ctx.save()
  ctx.shadowColor = 'rgba(45,30,18,0.18)'
  ctx.shadowBlur = 10
  ctx.shadowOffsetY = 5
  fillRoundRect(ctx, 32, -262, 178, 144, 26, config.light)
  ctx.restore()
  strokeRoundRect(ctx, 32, -262, 178, 144, 26, withAlpha(config.dark, 0.24), 1.6)
  drawTrackedText(ctx, 'OBJECTS', 121, -206, {
    size: 9,
    family: '"Space Grotesk", sans-serif',
    weight: 600,
    color: withAlpha(config.dark, 0.56),
    align: 'center',
    tracking: 0.28,
  })
  drawTrackedTextFit(ctx, config.brandName, 121, -168, 138, {
    size: 27,
    family: `"${config.fontFamily}", sans-serif`,
    weight: config.fontWeight,
    color: config.dark,
    align: 'center',
    tracking: config.tracking,
  })
  drawTrackedText(ctx, 'OF QUIET INTENTION', 121, -146, {
    size: 5.6,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.dark, 0.4),
    align: 'center',
    tracking: 0.2,
  })

  // Capsule wordmark sticker.
  ctx.save()
  ctx.shadowColor = 'rgba(45,30,18,0.16)'
  ctx.shadowBlur = 9
  ctx.shadowOffsetY = 4
  fillRoundRect(ctx, -220, -42, 250, 76, 38, config.dark)
  ctx.restore()
  drawTrackedTextFit(ctx, config.brandName, -95, -1, 206, {
    size: 25,
    family: `"${config.fontFamily}", sans-serif`,
    weight: config.fontWeight,
    color: config.light,
    align: 'center',
    tracking: config.tracking,
  })

  // Arch sticker.
  const arch = new Path2D()
  arch.moveTo(70, 46)
  arch.bezierCurveTo(70, -28, 214, -28, 214, 46)
  arch.lineTo(214, 142)
  arch.bezierCurveTo(164, 162, 120, 162, 70, 142)
  arch.closePath()
  ctx.save()
  ctx.shadowColor = 'rgba(45,30,18,0.18)'
  ctx.shadowBlur = 10
  ctx.shadowOffsetY = 5
  ctx.fillStyle = config.secondary
  ctx.fill(arch)
  ctx.restore()
  ctx.save()
  ctx.clip(arch)
  drawLogo(ctx, logo, 142, 54, 44 * config.logoSize, config.dark, 0.88, {
    blend: 'multiply',
  })
  drawTrackedText(ctx, 'EST. 2026', 142, 106, {
    size: 6.4,
    family: '"Space Grotesk", sans-serif',
    weight: 600,
    color: withAlpha(config.dark, 0.52),
    align: 'center',
    tracking: 0.24,
  })
  ctx.restore()

  // Asterisk sticker.
  ctx.save()
  ctx.shadowColor = 'rgba(45,30,18,0.16)'
  ctx.shadowBlur = 9
  ctx.shadowOffsetY = 4
  ctx.fillStyle = config.primary
  starPath(ctx, -130, 148, 66, 30, 8)
  ctx.fill()
  ctx.restore()
  drawLogo(ctx, logo, -130, 148, 38 * config.logoSize, config.light, 0.94)

  // Small dot sticker.
  ctx.save()
  ctx.shadowColor = 'rgba(45,30,18,0.14)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetY = 4
  ctx.beginPath()
  ctx.arc(120, 226, 56, 0, Math.PI * 2)
  ctx.fillStyle = config.secondary
  ctx.fill()
  ctx.restore()
  drawTrackedText(ctx, config.website.toUpperCase(), 120, 232, {
    size: 6,
    family: '"Space Grotesk", sans-serif',
    weight: 600,
    color: withAlpha(config.dark, 0.62),
    align: 'center',
    tracking: 0.18,
  })

  // Die-cut dashes.
  ctx.save()
  ctx.setLineDash([4, 5])
  ctx.strokeStyle = withAlpha(config.dark, 0.16)
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(-116, -190, 90, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(120, 226, 64, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()

  ctx.restore()
  drawGrain(ctx, PRODUCT_WIDTH, PRODUCT_HEIGHT, 0.07, 0.00027, 89)
}

function drawPouch(
  ctx: CanvasRenderingContext2D,
  config: BrandConfig,
  logo: HTMLImageElement | null,
) {
  studioBackground(ctx, '#E6DCCB', '#C2B29D', 'rgba(255,250,236,0.82)', 340, 300)
  drawSoftShadow(ctx, 338, 992, 500, 68, 28, 'rgba(45,30,18,0.3)')

  ctx.save()
  ctx.translate(338, 642)
  ctx.rotate(-0.021)

  // Body.
  ctx.save()
  ctx.shadowColor = 'rgba(45,30,18,0.28)'
  ctx.shadowBlur = 26
  ctx.shadowOffsetY = 16
  const canvasFill = ctx.createLinearGradient(-230, -280, 230, 280)
  canvasFill.addColorStop(0, '#F2EADB')
  canvasFill.addColorStop(0.5, '#E7DBC8')
  canvasFill.addColorStop(1, '#D3C2A9')
  fillRoundRect(ctx, -232, -280, 464, 560, 30, canvasFill)
  ctx.restore()

  // Fabric shading.
  ctx.save()
  ctx.beginPath()
  roundRectPath(ctx, -232, -280, 464, 560, 30)
  ctx.clip()
  drawTextureLines(ctx, -232, -280, 464, 560, '#6C5337', 6, 0.05)
  const sideShade = ctx.createLinearGradient(-232, 0, -110, 0)
  sideShade.addColorStop(0, 'rgba(74,54,33,0.2)')
  sideShade.addColorStop(1, 'rgba(74,54,33,0)')
  ctx.fillStyle = sideShade
  ctx.fillRect(-232, -280, 150, 560)
  const sideShade2 = ctx.createLinearGradient(232, 0, 110, 0)
  sideShade2.addColorStop(0, 'rgba(74,54,33,0.16)')
  sideShade2.addColorStop(1, 'rgba(74,54,33,0)')
  ctx.fillStyle = sideShade2
  ctx.fillRect(110, -280, 122, 560)
  ctx.restore()

  // Top zip band.
  ctx.save()
  ctx.beginPath()
  roundRectPath(ctx, -232, -280, 464, 560, 30)
  ctx.clip()
  const band = ctx.createLinearGradient(0, -280, 0, -196)
  band.addColorStop(0, '#D8C8B1')
  band.addColorStop(1, '#C9B69C')
  ctx.fillStyle = band
  ctx.fillRect(-232, -280, 464, 96)
  ctx.restore()

  // Stitch line.
  ctx.save()
  ctx.setLineDash([6, 6])
  ctx.strokeStyle = withAlpha(config.dark, 0.24)
  ctx.lineWidth = 1.3
  roundRectPath(ctx, -214, -262, 428, 524, 24)
  ctx.stroke()
  ctx.restore()

  // Zipper teeth.
  ctx.save()
  ctx.strokeStyle = 'rgba(68,50,32,0.42)'
  ctx.lineWidth = 1
  for (let x = -198; x < 190; x += 12) {
    ctx.beginPath()
    ctx.moveTo(x, -234)
    ctx.lineTo(x + 6, -226)
    ctx.lineTo(x, -218)
    ctx.stroke()
  }
  ctx.strokeStyle = '#B9A78E'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(-206, -226)
  ctx.lineTo(202, -226)
  ctx.stroke()
  ctx.restore()

  // Zipper slider and leather pull.
  ctx.save()
  const slider = ctx.createLinearGradient(62, -246, 104, -206)
  slider.addColorStop(0, '#8A8780')
  slider.addColorStop(0.5, '#DAD6CD')
  slider.addColorStop(1, '#77746D')
  fillRoundRect(ctx, 68, -248, 36, 44, 8, slider)
  ctx.strokeStyle = 'rgba(0,0,0,0.28)'
  ctx.lineWidth = 1.2
  ctx.strokeRect(78, -238, 16, 24)
  ctx.fillStyle = config.primary
  fillRoundRect(ctx, 78, -202, 16, 54, 6, config.primary)
  ctx.fillStyle = 'rgba(255,255,255,0.2)'
  ctx.fillRect(81, -198, 3, 44)
  ctx.beginPath()
  ctx.arc(86, -210, 3, 0, Math.PI * 2)
  ctx.fillStyle = '#6E665B'
  ctx.fill()
  ctx.restore()

  // Leather tab.
  ctx.save()
  ctx.translate(-146, -224)
  ctx.rotate(0.08)
  ctx.fillStyle = config.primary
  fillRoundRect(ctx, -16, 0, 32, 74, 8, config.primary)
  ctx.fillStyle = 'rgba(0,0,0,0.16)'
  ctx.fillRect(-16, 8, 32, 4)
  ctx.beginPath()
  ctx.arc(0, 20, 3, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.fill()
  ctx.restore()

  drawLogo(
    ctx,
    logo,
    0,
    18,
    100 * config.logoSize,
    config.dark,
    0.88,
    { blend: 'multiply' },
  )
  drawTrackedTextFit(ctx, config.brandName, 0, 102, 280, {
    size: 25,
    family: `"${config.fontFamily}", sans-serif`,
    weight: config.fontWeight,
    color: withAlpha(config.dark, 0.78),
    align: 'center',
    tracking: config.tracking,
  })
  drawTrackedText(ctx, config.website.toUpperCase(), 0, 132, {
    size: 7,
    family: '"Space Grotesk", sans-serif',
    weight: 500,
    color: withAlpha(config.dark, 0.46),
    align: 'center',
    tracking: 0.22,
  })

  ctx.fillStyle = withAlpha(config.primary, 0.85)
  ctx.fillRect(-84, 172, 168, 2)
  drawTrackedText(ctx, 'CANVAS GOODS / 01', 0, 200, {
    size: 6.4,
    family: '"Space Grotesk", sans-serif',
    weight: 600,
    color: withAlpha(config.dark, 0.42),
    align: 'center',
    tracking: 0.24,
  })
  ctx.restore()

  drawGrain(ctx, PRODUCT_WIDTH, PRODUCT_HEIGHT, 0.075, 0.00029, 97)
}

function starPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  points: number,
) {
  ctx.beginPath()
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outer : inner
    const angle = (Math.PI / points) * i - Math.PI / 2
    const x = cx + Math.cos(angle) * radius
    const y = cy + Math.sin(angle) * radius
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
}

function drawVignetteLocal(ctx: CanvasRenderingContext2D) {
  ctx.save()
  ctx.globalCompositeOperation = 'multiply'
  const vignette = ctx.createRadialGradient(340, 600, 280, 340, 600, 760)
  vignette.addColorStop(0, 'rgba(255,255,255,0)')
  vignette.addColorStop(1, 'rgba(0,0,0,0.24)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, PRODUCT_WIDTH, PRODUCT_HEIGHT)
  ctx.restore()
}

/** Preload all local product renders for a configuration. */
export function preloadProductImages(config: BrandConfig) {
  const ids: ProductId[] = [
    'tshirt',
    'tote',
    'lanyard',
    'mug',
    'cap',
    'cards',
    'hoodie',
    'poster',
    'notebook',
    'bottle',
    'stickers',
    'pouch',
  ]
  return Promise.all(
    ids.map((id) => Promise.resolve(getProductImage(id, config))),
  )
}
