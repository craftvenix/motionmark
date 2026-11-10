export type Aspect = 'wide' | 'tall'

export type EaseName =
  | 'easeOutCubic'
  | 'easeInOutCubic'
  | 'backOut'
  | 'elasticOut'
  | 'linear'

export type LayerKey = 'logo' | 'text' | 'background'

export type StyleId = 'reveal' | 'blueprint' | 'pulse' | 'lockup' | 'pattern'

export type AnimationMode = StyleId | 'showreel' | 'brandreel'

export type SceneId =
  | 'wordmark'
  | 'trace'
  | 'grid'
  | 'phone'
  | 'browser'
  | 'palette'
  | 'merch'
  | 'lockup'

export type SceneLength = 'short' | 'medium' | 'long'

export type ProductId =
  | 'tshirt'
  | 'tote'
  | 'lanyard'
  | 'mug'
  | 'cap'
  | 'cards'
  | 'hoodie'
  | 'poster'
  | 'notebook'
  | 'bottle'
  | 'stickers'
  | 'pouch'

export type PresentationMode = 'stage' | 'phone' | 'deck'

export interface Palette {
  id: string
  name: string
  primary: string
  secondary: string
  dark: string
  light: string
}

export interface LayerControl {
  speed: number
  delay: number
  easing: EaseName
}

export interface SceneConfig {
  id: SceneId
  enabled: boolean
  length: SceneLength
}

export interface BrandConfig {
  logoDataUrl: string | null
  logoFileName: string
  logoSize: number
  logoMonochrome: boolean
  brandName: string
  tagline: string
  website: string
  fontFamily: string
  fontWeight: number
  tracking: number
  primary: string
  secondary: string
  dark: string
  light: string
  paletteId: string
  layers: Record<LayerKey, LayerControl>
  scenes: SceneConfig[]
}

export type ExportFormat = 'mp4' | 'webm'

export interface ExportState {
  running: boolean
  progress: number
  format: ExportFormat
  label: string
}

export type ToastTone = 'success' | 'error' | 'info'

export interface ToastMessage {
  id: number
  title: string
  description?: string
  tone: ToastTone
}

