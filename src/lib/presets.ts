import type {
  BrandConfig,
  Palette,
  ProductId,
  SceneConfig,
  SceneId,
  SceneLength,
  StyleId,
} from '../types'

const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <path fill="#FFFFFF" d="M101 412 236 84h40l135 328h-68l-29-74H196l-29 74h-66Zm117-134h78l-39-100-39 100Z"/>
  <circle fill="#FFFFFF" cx="256" cy="328" r="22"/>
</svg>`

export const DEFAULT_LOGO = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  logoSvg,
)}`

export const palettes: Palette[] = [
  {
    id: 'cognac-ivory',
    name: 'Cognac & Ivory',
    primary: '#A7592D',
    secondary: '#D5B48B',
    dark: '#211A14',
    light: '#F2E9D9',
  },
  {
    id: 'noir-gold',
    name: 'Noir & Gold',
    primary: '#C7A253',
    secondary: '#E9D9AE',
    dark: '#111110',
    light: '#F5F0E5',
  },
  {
    id: 'midnight-champagne',
    name: 'Midnight Champagne',
    primary: '#B9A37A',
    secondary: '#DFD1B6',
    dark: '#0D1722',
    light: '#F5F0E5',
  },
  {
    id: 'forest-cream',
    name: 'Forest & Cream',
    primary: '#31523D',
    secondary: '#A8B99A',
    dark: '#122019',
    light: '#F0EBDD',
  },
  {
    id: 'bordeaux-blush',
    name: 'Bordeaux & Blush',
    primary: '#6C202B',
    secondary: '#DAA7A3',
    dark: '#241014',
    light: '#F8EBE6',
  },
  {
    id: 'slate-copper',
    name: 'Slate & Copper',
    primary: '#B96D4C',
    secondary: '#8C999B',
    dark: '#151A1D',
    light: '#EEEAE4',
  },
]

export const fontOptions = [
  {
    name: 'Space Grotesk',
    css: '"Space Grotesk", sans-serif',
    note: 'Precise · technical',
  },
  {
    name: 'Bricolage Grotesque',
    css: '"Bricolage Grotesque", sans-serif',
    note: 'Characterful · modern',
  },
  {
    name: 'DM Sans',
    css: '"DM Sans", sans-serif',
    note: 'Warm · modern',
  },
  {
    name: 'Fraunces',
    css: '"Fraunces", serif',
    note: 'Editorial · expressive',
  },
  {
    name: 'Syne',
    css: '"Syne", sans-serif',
    note: 'Bold · distinctive',
  },
]

export const styleMeta: Record<
  StyleId,
  { name: string; number: string; description: string }
> = {
  reveal: {
    name: 'Reveal',
    number: '01',
    description: 'Spin-in mark, diagonal wipe',
  },
  blueprint: {
    name: 'Blueprint',
    number: '02',
    description: 'Draft lines, outline trace',
  },
  pulse: {
    name: 'Pulse',
    number: '03',
    description: 'Radar rings, elastic pop',
  },
  lockup: {
    name: 'Lockup',
    number: '04',
    description: 'Split panels, side-by-side',
  },
  pattern: {
    name: 'Pattern',
    number: '05',
    description: 'Tiled mark, infinite zoom',
  },
}

export const defaultScenes: SceneConfig[] = [
  { id: 'wordmark', enabled: true, length: 'medium' },
  { id: 'trace', enabled: true, length: 'medium' },
  { id: 'grid', enabled: true, length: 'medium' },
  { id: 'phone', enabled: true, length: 'medium' },
  { id: 'browser', enabled: true, length: 'medium' },
  { id: 'palette', enabled: true, length: 'medium' },
  { id: 'merch', enabled: true, length: 'long' },
  { id: 'lockup', enabled: true, length: 'medium' },
]

export const sceneMeta: Record<
  SceneId,
  { name: string; kicker: string; description: string }
> = {
  wordmark: {
    name: 'Wordmark Reveal',
    kicker: 'Typography',
    description: 'Bold entrance, subtle drift',
  },
  trace: {
    name: 'Outline Trace',
    kicker: 'Mark',
    description: 'Technical trace, gloss pass',
  },
  grid: {
    name: 'Construction Grid',
    kicker: 'System',
    description: 'Drafting guides, measurements',
  },
  phone: {
    name: 'App Icon on Phone',
    kicker: 'Digital',
    description: 'Device mockup and UI',
  },
  browser: {
    name: 'Browser Tab',
    kicker: 'Digital',
    description: 'Favicon, URL and page',
  },
  palette: {
    name: 'Colour Palette',
    kicker: 'Colour',
    description: 'HEX, RGB, CMYK strips',
  },
  merch: {
    name: 'Merch Showcase',
    kicker: 'Objects',
    description: 'Twelve product plates',
  },
  lockup: {
    name: 'End Lockup',
    kicker: 'Signature',
    description: 'Minimal closing mark',
  },
}

export const sceneLengths: Record<SceneLength, number> = {
  short: 1.25,
  medium: 1.8,
  long: 2.75,
}

export const productMeta: Record<
  ProductId,
  { name: string; surface: string; prompt: string }
> = {
  tshirt: {
    name: 'Heavyweight Tee',
    surface: 'Chest placement',
    prompt:
      'a premium heavyweight cream cotton crew-neck t-shirt laid on a warm studio surface, chest print',
  },
  tote: {
    name: 'Canvas Tote',
    surface: 'Fabric multiply',
    prompt:
      'a natural canvas tote bag with handles, soft fabric texture, front print, warm studio light',
  },
  lanyard: {
    name: 'ID Lanyard',
    surface: 'Badge print',
    prompt:
      'a corporate lanyard with an ID badge on a dark graphite surface, premium event identity',
  },
  mug: {
    name: 'Ceramic Mug',
    surface: 'Cylindrical wrap',
    prompt:
      'a handcrafted off-white ceramic mug on a stone plinth, curved print wrapping the cylinder',
  },
  cap: {
    name: 'Embroidered Cap',
    surface: 'Front embroidery',
    prompt:
      'a six-panel cotton baseball cap in graphite with embroidered front logo, editorial studio product photo',
  },
  cards: {
    name: 'Card Stack',
    surface: 'Isometric print',
    prompt:
      'a stack of thick letterpress business cards at an isometric angle on warm paper, edge detail',
  },
  hoodie: {
    name: 'Heavyweight Hoodie',
    surface: 'Chest embroidery',
    prompt:
      'a heavyweight brushed cotton hoodie in graphite with a small chest embroidery, studio product photo',
  },
  poster: {
    name: 'Framed Poster',
    surface: 'Large format',
    prompt:
      'a large framed art poster leaning against a warm plaster wall, thin dark frame, soft raking light',
  },
  notebook: {
    name: 'Cloth Notebook',
    surface: 'Deboss cover',
    prompt:
      'a cloth-bound notebook with an elastic closure and debossed cover mark on a warm desk, editorial still life',
  },
  bottle: {
    name: 'Steel Bottle',
    surface: 'Laser etch',
    prompt:
      'a brushed stainless steel water bottle with a laser-etched mark on a dark stone plinth, studio lighting',
  },
  stickers: {
    name: 'Sticker Sheet',
    surface: 'Die-cut vinyl',
    prompt:
      'a die-cut vinyl sticker sheet with several shaped stickers on warm paper, top-down studio photo',
  },
  pouch: {
    name: 'Canvas Pouch',
    surface: 'Zip print',
    prompt:
      'a natural canvas zip pouch with a leather pull and front print on a warm studio surface, product photo',
  },
}

export const productIds: ProductId[] = [
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

const defaultPalette = palettes[0]

export const initialConfig: BrandConfig = {
  logoDataUrl: DEFAULT_LOGO,
  logoFileName: 'aurel-mark.svg',
  logoSize: 1,
  logoMonochrome: true,
  brandName: 'AUREL',
  tagline: 'Objects of quiet intention',
  website: 'aurel.studio',
  fontFamily: 'Space Grotesk',
  fontWeight: 500,
  tracking: 0.02,
  primary: defaultPalette.primary,
  secondary: defaultPalette.secondary,
  dark: defaultPalette.dark,
  light: defaultPalette.light,
  paletteId: defaultPalette.id,
  layers: {
    logo: { speed: 1, delay: 0, easing: 'backOut' },
    text: { speed: 1, delay: 0.12, easing: 'easeOutCubic' },
    background: { speed: 1, delay: 0, easing: 'easeInOutCubic' },
  },
  scenes: defaultScenes,
}

export const STYLE_DURATION = 6.2
export const SHOWREEL_STYLE_DURATION = 4.5
export const SHOWREEL_END_DURATION = 2.8
export const REEL_TRANSITION = 0.42
export const REEL_MAX_DURATION = 15

export function sceneSeconds(scene: SceneConfig) {
  const base = sceneLengths[scene.length]
  if (scene.id === 'merch') return base + 0.45
  return base
}

export function reelBaseDuration(config: BrandConfig) {
  const total = config.scenes
    .filter((scene) => scene.enabled)
    .reduce((sum, scene) => sum + sceneSeconds(scene), 0)
  return Math.max(1, total)
}

export function reelPlaybackDuration(config: BrandConfig) {
  const total = reelBaseDuration(config)
  return Math.min(total, REEL_MAX_DURATION)
}

export function totalDuration(mode: string, config: BrandConfig) {
  if (mode === 'brandreel') return reelPlaybackDuration(config)
  if (mode === 'showreel') {
    return (
      SHOWREEL_STYLE_DURATION * 5 + SHOWREEL_END_DURATION
    )
  }
  return STYLE_DURATION
}
