import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type Dispatch,
  type DragEvent,
  type ReactNode,
  type SetStateAction,
} from 'react'
import {
  Check,
  ChevronDown,
  Download,
  Fingerprint,
  Image as ImageIcon,
  LayoutGrid,
  Palette,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Square,
  SwatchBook,
  Type,
  Upload,
} from 'lucide-react'
import type {
  AnimationMode,
  BrandConfig,
  EaseName,
  LayerKey,
  ProductId,
  SceneId,
  SceneLength,
  StyleId,
  ToastTone,
} from '../types'
import {
  DEFAULT_LOGO,
  fontOptions,
  palettes,
  productIds,
  productMeta,
  reelBaseDuration,
  reelPlaybackDuration,
  REEL_MAX_DURATION,
  sceneLengths,
  sceneMeta,
  styleMeta,
} from '../lib/presets'
import {
  cmykString,
  isValidHex,
  normalizeHex,
  rgbString,
} from '../lib/colors'
import { easings } from '../lib/easing'
import { getProductImage } from '../lib/products'
import { preloadImage } from '../lib/logo'
import { cn, formatShortTime } from '../lib/utils'
import {
  Button,
  Checkbox,
  Divider,
  Field,
  IconButton,
  PanelHeading,
  Select,
  Slider,
  SwitchRow,
  TextInput,
} from './ui'

type SetConfig = Dispatch<SetStateAction<BrandConfig>>
type Notify = (title: string, tone?: ToastTone, description?: string) => void

interface SidebarProps {
  config: BrandConfig
  setConfig: SetConfig
  mode: AnimationMode
  onSelectMode: (mode: AnimationMode) => void
  onSelectAspect: (aspect: 'wide' | 'tall') => void
  aspect: 'wide' | 'tall'
  notify: Notify
  onReset: () => void
}

type TabId = 'brand' | 'colour' | 'motion' | 'timing' | 'plates'

const tabs: Array<{
  id: TabId
  label: string
  icon: typeof Fingerprint
}> = [
  { id: 'brand', label: 'Brand', icon: Fingerprint },
  { id: 'colour', label: 'Colour', icon: SwatchBook },
  { id: 'motion', label: 'Motion', icon: Palette },
  { id: 'timing', label: 'Timing', icon: SlidersHorizontal },
  { id: 'plates', label: 'Plates', icon: LayoutGrid },
]

export function Sidebar({
  config,
  setConfig,
  mode,
  onSelectMode,
  onSelectAspect,
  aspect,
  notify,
  onReset,
}: SidebarProps) {
  const [tab, setTab] = useState<TabId>('brand')
  const scrollRef = useRef<HTMLDivElement>(null)

  const selectTab = (next: TabId) => {
    setTab(next)
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = 0
    })
  }

  return (
    <aside className="sidebar-panel flex w-[398px] shrink-0 flex-col border-l border-white/[0.065] bg-[#0c0c0f]">
      <div className="flex h-[58px] shrink-0 items-center justify-between border-b border-white/[0.055] px-4">
        <div className="flex items-center gap-2">
          <span className="font-display text-[11px] font-medium uppercase tracking-[0.22em] text-ivory-300">
            Studio controls
          </span>
          <span className="rounded border border-white/[0.08] px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-ivory-600">
            v1.0
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="mr-1 flex items-center gap-1.5 font-mono text-[9px] text-ivory-600">
            <span className="h-1 w-1 rounded-full bg-signal/80" />
            autosave
          </span>
          <IconButton onClick={onReset} title="Reset studio">
            <RotateCcw className="h-3.5 w-3.5" />
          </IconButton>
        </div>
      </div>

      <div className="shrink-0 px-2.5 pt-2.5">
        <div className="grid grid-cols-5 gap-0.5 rounded-xl border border-white/[0.065] bg-black/20 p-1">
          {tabs.map((item) => {
            const Icon = item.icon
            const active = tab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectTab(item.id)}
                className={cn(
                  'group flex h-[46px] flex-col items-center justify-center gap-1 rounded-lg text-[9px] font-medium uppercase tracking-[0.08em] transition-all',
                  active
                    ? 'bg-white/[0.09] text-ivory-100 shadow-[0_1px_0_rgba(255,255,255,0.06)_inset]'
                    : 'text-ivory-600 hover:bg-white/[0.035] hover:text-ivory-300',
                )}
              >
                <Icon
                  className={cn(
                    'h-3.5 w-3.5 transition-colors',
                    active ? 'text-signal' : 'text-ivory-500 group-hover:text-ivory-300',
                  )}
                />
                {item.label}
              </button>
            )
          })}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="mm-scroll min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-5"
      >
        {tab === 'brand' ? (
          <BrandPanel config={config} setConfig={setConfig} notify={notify} />
        ) : null}
        {tab === 'colour' ? (
          <ColourPanel config={config} setConfig={setConfig} notify={notify} />
        ) : null}
        {tab === 'motion' ? (
          <MotionPanel
            config={config}
            setConfig={setConfig}
            mode={mode}
            onSelectMode={onSelectMode}
            aspect={aspect}
            onSelectAspect={onSelectAspect}
          />
        ) : null}
        {tab === 'timing' ? (
          <TimingPanel config={config} setConfig={setConfig} />
        ) : null}
        {tab === 'plates' ? (
          <PlatesPanel config={config} notify={notify} />
        ) : null}
      </div>
    </aside>
  )
}

function BrandPanel({
  config,
  setConfig,
  notify,
}: {
  config: BrandConfig
  setConfig: SetConfig
  notify: Notify
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const patch = (value: Partial<BrandConfig>) =>
    setConfig((prev) => ({ ...prev, ...value }))

  const processFile = async (file: File) => {
    if (!/^image\/(svg\+xml|png|jpeg|webp)$/i.test(file.type)) {
      notify('Use an SVG, PNG, JPG or WebP logo', 'error')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      notify('Logo is too large', 'error', 'Please use a file under 8 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = async () => {
      const url = String(reader.result)
      try {
        await preloadImage(url)
        patch({ logoDataUrl: url, logoFileName: file.name })
        notify('Logo updated', 'success', file.name)
      } catch {
        notify('Could not read that logo', 'error')
      }
    }
    reader.onerror = () => notify('Could not read that file', 'error')
    reader.readAsDataURL(file)
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file) void processFile(file)
  }

  return (
    <div className="space-y-5">
      <PanelHeading
        eyebrow="01 / Identity"
        title="Logo & brand"
        description="Drop in the mark. Everything else is choreographed around it."
      />

      <div
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'group relative cursor-pointer overflow-hidden rounded-xl border border-dashed transition-all',
          dragging
            ? 'border-signal/70 bg-signal/[0.06]'
            : 'border-white/[0.12] bg-black/25 hover:border-white/[0.24] hover:bg-white/[0.025]',
        )}
      >
        <div className="flex h-[116px] items-center justify-center px-4">
          <div className="logo-drop-preview relative flex h-[86px] w-[86px] items-center justify-center rounded-2xl border border-white/[0.1] bg-[#d9d2c4] shadow-[0_18px_40px_-20px_rgba(0,0,0,0.9)]">
            <img
              src={config.logoDataUrl || DEFAULT_LOGO}
              alt="Current logo"
              className="max-h-[52px] max-w-[52px] object-contain"
            />
          </div>
          <div className="ml-4 min-w-0 flex-1">
            <p className="truncate text-[12px] font-medium text-ivory-200">
              {config.logoFileName}
            </p>
            <p className="mt-0.5 text-[10px] leading-relaxed text-ivory-600">
              SVG preferred. Transparent PNG works beautifully too.
            </p>
            <span className="mt-2 inline-flex items-center gap-1 rounded-md border border-white/[0.1] bg-white/[0.04] px-2 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-ivory-400 group-hover:border-white/[0.2] group-hover:text-ivory-200">
              <Upload className="h-2.5 w-2.5" /> Replace artwork
            </span>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".svg,.png,.jpg,.jpeg,.webp,image/svg+xml,image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void processFile(file)
            event.target.value = ''
          }}
          onClick={(event) => event.stopPropagation()}
        />
        <div className="flex items-center justify-between border-t border-white/[0.07] bg-black/20 px-3 py-1.5">
          <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-ivory-600">
            drag & drop
          </span>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              patch({ logoDataUrl: DEFAULT_LOGO, logoFileName: 'aurel-mark.svg' })
              notify('Default mark restored', 'info')
            }}
            className="text-[9px] text-ivory-600 transition-colors hover:text-ivory-300"
          >
            use default
          </button>
        </div>
      </div>

      <Field label="Logo scale" hint={`${Math.round(config.logoSize * 100)}%`}>
        <Slider
          value={config.logoSize}
          min={0.5}
          max={1.45}
          step={0.01}
          onValueChange={(logoSize) => patch({ logoSize })}
        />
      </Field>
      <SwitchRow
        checked={config.logoMonochrome}
        onCheckedChange={(logoMonochrome) => patch({ logoMonochrome })}
        title="Monochrome application"
        description="Tint the mark to the active scene"
        icon={<ImageIcon className="h-3.5 w-3.5" />}
      />

      <Divider />

      <div className="space-y-3">
        <Field label="Brand name">
          <TextInput
            value={config.brandName}
            maxLength={28}
            onChange={(event) => patch({ brandName: event.target.value })}
            placeholder="AUREL"
          />
        </Field>
        <Field label="Tagline">
          <TextInput
            value={config.tagline}
            maxLength={64}
            onChange={(event) => patch({ tagline: event.target.value })}
            placeholder="Objects of quiet intention"
          />
        </Field>
        <Field label="Website">
          <TextInput
            value={config.website}
            maxLength={42}
            onChange={(event) => patch({ website: event.target.value })}
            placeholder="aurel.studio"
          />
        </Field>
      </div>

      <Divider />

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-ivory-500">
            Typeface
          </span>
          <span className="font-mono text-[9px] text-ivory-600">
            {config.fontFamily}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {fontOptions.map((font) => {
            const active = config.fontFamily === font.name
            return (
              <button
                key={font.name}
                type="button"
                onClick={() => patch({ fontFamily: font.name })}
                className={cn(
                  'relative rounded-xl border p-3 text-left transition-all',
                  active
                    ? 'border-signal/50 bg-signal/[0.055]'
                    : 'border-white/[0.075] bg-black/20 hover:border-white/[0.15]',
                )}
              >
                <span
                  className="block truncate text-[17px] leading-none text-ivory-100"
                  style={{ fontFamily: font.css }}
                >
                  {font.name}
                </span>
                <span className="mt-1.5 block text-[9px] text-ivory-600">
                  {font.note}
                </span>
                {active ? (
                  <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-signal text-[#15170e]">
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      </div>

      <Field label="Weight" hint={String(config.fontWeight)}>
        <Slider
          value={config.fontWeight}
          min={300}
          max={800}
          step={100}
          onValueChange={(fontWeight) => patch({ fontWeight })}
        />
      </Field>
      <Field
        label="Tracking"
        hint={`${config.tracking.toFixed(3)} em`}
      >
        <Slider
          value={config.tracking}
          min={-0.02}
          max={0.2}
          step={0.005}
          onValueChange={(tracking) => patch({ tracking })}
        />
      </Field>

      <div className="overflow-hidden rounded-xl border border-white/[0.075] bg-gradient-to-br from-white/[0.045] to-transparent p-4">
        <p className="text-[8px] uppercase tracking-[0.24em] text-ivory-600">
          Type specimen
        </p>
        <p
          className="mt-2 truncate text-[34px] leading-none text-ivory-100"
          style={{
            fontFamily: `"${config.fontFamily}", sans-serif`,
            fontWeight: config.fontWeight,
            letterSpacing: `${config.tracking}em`,
          }}
        >
          {config.brandName || 'Brand'}
        </p>
        <p className="mt-2 truncate text-[10px] uppercase tracking-[0.2em] text-ivory-500">
          {config.tagline || 'Your tagline here'}
        </p>
      </div>
    </div>
  )
}

function ColourPanel({
  config,
  setConfig,
  notify,
}: {
  config: BrandConfig
  setConfig: SetConfig
  notify: Notify
}) {
  const patch = (value: Partial<BrandConfig>) =>
    setConfig((prev) => ({ ...prev, ...value }))

  const selectPalette = (palette: (typeof palettes)[number]) => {
    patch({
      paletteId: palette.id,
      primary: palette.primary,
      secondary: palette.secondary,
      dark: palette.dark,
      light: palette.light,
    })
    notify(`${palette.name} applied`, 'success')
  }

  const setColor = (
    key: 'primary' | 'secondary' | 'dark' | 'light',
    value: string,
  ) => {
    const normalized = normalizeHex(value)
    if (!normalized) return
    patch({ [key]: normalized, paletteId: 'custom' })
  }

  return (
    <div className="space-y-5">
      <PanelHeading
        eyebrow="02 / Colour"
        title="Palette"
        description="Six restrained systems, or define your own with precise HEX control."
      />

      <div className="grid grid-cols-2 gap-2">
        {palettes.map((palette) => {
          const active = config.paletteId === palette.id
          return (
            <button
              key={palette.id}
              type="button"
              onClick={() => selectPalette(palette)}
              className={cn(
                'group rounded-xl border p-2 text-left transition-all',
                active
                  ? 'border-signal/55 bg-signal/[0.055]'
                  : 'border-white/[0.075] bg-black/20 hover:border-white/[0.16]',
              )}
            >
              <div className="flex h-10 overflow-hidden rounded-md border border-black/30">
                {[palette.primary, palette.secondary, palette.dark, palette.light].map(
                  (color, index) => (
                    <span
                      key={index}
                      className="h-full flex-1"
                      style={{ background: color }}
                    />
                  ),
                )}
              </div>
              <div className="mt-2 flex items-start justify-between gap-1">
                <span className="text-[10px] font-medium leading-tight text-ivory-300">
                  {palette.name}
                </span>
                {active ? (
                  <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-signal text-[#15170e]">
                    <Check className="h-2 w-2" strokeWidth={4} />
                  </span>
                ) : null}
              </div>
            </button>
          )
        })}
      </div>

      <Divider />

      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-ivory-500">
          Custom palette
        </span>
        <span
          className={cn(
            'rounded-full border px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.15em]',
            config.paletteId === 'custom'
              ? 'border-signal/30 bg-signal/[0.08] text-signal/80'
              : 'border-white/[0.08] text-ivory-600',
          )}
        >
          {config.paletteId === 'custom' ? 'custom' : 'curated'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <HexField
          label="Primary"
          value={config.primary}
          onChange={(value) => setColor('primary', value)}
        />
        <HexField
          label="Secondary"
          value={config.secondary}
          onChange={(value) => setColor('secondary', value)}
        />
        <HexField
          label="Dark"
          value={config.dark}
          onChange={(value) => setColor('dark', value)}
        />
        <HexField
          label="Light"
          value={config.light}
          onChange={(value) => setColor('light', value)}
        />
      </div>

      <div className="rounded-xl border border-white/[0.075] bg-black/20 p-3">
        <p className="text-[8px] uppercase tracking-[0.24em] text-ivory-600">
          Colour notes
        </p>
        <div className="mt-2.5 space-y-2">
          {(
            [
              ['Primary', config.primary],
              ['Secondary', config.secondary],
              ['Dark', config.dark],
              ['Light', config.light],
            ] as const
          ).map(([label, color]) => (
            <div key={label} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-[10px] text-ivory-500">
                <span
                  className="h-3.5 w-3.5 rounded-[4px] border border-white/15"
                  style={{ background: color }}
                />
                {label}
              </span>
              <span className="font-mono text-[9px] text-ivory-500">
                {rgbString(color)} · {cmykString(color)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function HexField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const [draft, setDraft] = useState(value)
  const [lastValue, setLastValue] = useState(value)
  const [invalid, setInvalid] = useState(false)

  if (value !== lastValue) {
    setLastValue(value)
    setDraft(value)
    setInvalid(false)
  }

  const commit = (next: string) => {
    setDraft(next)
    if (isValidHex(next)) {
      setInvalid(false)
      onChange(next)
    } else {
      setInvalid(next.length > 0)
    }
  }

  const normalized = normalizeHex(draft)

  return (
    <Field
      label={label}
      hint={invalid ? <span className="text-red-400">invalid</span> : value}
    >
      <div className="flex gap-1.5">
        <div
          className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-white/[0.12]"
          style={{ background: normalized || value }}
        >
          <input
            type="color"
            value={normalized || value}
            onChange={(event) => commit(event.target.value.toUpperCase())}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label={`${label} colour picker`}
          />
        </div>
        <TextInput
          value={draft}
          invalid={invalid}
          maxLength={7}
          spellCheck={false}
          className="font-mono text-[11px] uppercase"
          onChange={(event) => commit(event.target.value.toUpperCase())}
          onBlur={() => {
            if (!isValidHex(draft)) {
              setDraft(value)
              setInvalid(false)
            }
          }}
        />
      </div>
      {invalid ? (
        <p className="mt-1 text-[9px] text-red-400/90">
          Use a 3 or 6 digit HEX value, e.g. #A7592D.
        </p>
      ) : null}
    </Field>
  )
}

function MotionPanel({
  config,
  setConfig,
  mode,
  onSelectMode,
  aspect,
  onSelectAspect,
}: {
  config: BrandConfig
  setConfig: SetConfig
  mode: AnimationMode
  onSelectMode: (mode: AnimationMode) => void
  aspect: 'wide' | 'tall'
  onSelectAspect: (aspect: 'wide' | 'tall') => void
}) {
  const styles = Object.keys(styleMeta) as StyleId[]
  const base = reelBaseDuration(config)
  const adaptive = base > REEL_MAX_DURATION
  const playback = reelPlaybackDuration(config)
  const enabledScenes = config.scenes.filter((scene) => scene.enabled)

  const updateScene = (
    id: SceneId,
    value: Partial<{ enabled: boolean; length: SceneLength }>,
  ) => {
    setConfig((prev) => ({
      ...prev,
      scenes: prev.scenes.map((scene) =>
        scene.id === id ? { ...scene, ...value } : scene,
      ),
    }))
  }

  const setAllScenes = (enabled: boolean) => {
    setConfig((prev) => ({
      ...prev,
      scenes: prev.scenes.map((scene) => ({ ...scene, enabled })),
    }))
  }

  return (
    <div className="space-y-5">
      <PanelHeading
        eyebrow="03 / Choreography"
        title="Motion system"
        description="Five signature behaviours, a full showreel, or a fast-cut vertical brand reel."
      />

      <div className="grid grid-cols-2 gap-2">
        {styles.map((style) => {
          const meta = styleMeta[style]
          const active = mode === style
          return (
            <button
              key={style}
              type="button"
              onClick={() => onSelectMode(style)}
              className={cn(
                'group overflow-hidden rounded-xl border text-left transition-all',
                active
                  ? 'border-signal/55 bg-signal/[0.055]'
                  : 'border-white/[0.075] bg-black/20 hover:border-white/[0.16]',
              )}
            >
              <StyleArt
                style={style}
                config={config}
                className="h-[58px] w-full"
              />
              <div className="px-2.5 py-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[8px] text-ivory-600">
                    {meta.number}
                  </span>
                  <span className="text-[11px] font-medium text-ivory-200">
                    {meta.name}
                  </span>
                  {active ? (
                    <Check className="ml-auto h-3 w-3 text-signal" strokeWidth={3} />
                  ) : null}
                </div>
                <p className="mt-0.5 truncate text-[9px] text-ivory-600">
                  {meta.description}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-2">
        <ModeCard
          active={mode === 'showreel'}
          onClick={() => onSelectMode('showreel')}
          title="Showreel"
          subtitle="All five styles · sliding wipes"
          badge="16:9"
          icon={<Palette className="h-4 w-4" />}
          art="showreel"
          config={config}
        />
        <ModeCard
          active={mode === 'brandreel'}
          onClick={() => {
            onSelectAspect('tall')
            onSelectMode('brandreel')
          }}
          title="Brand Reel"
          subtitle="8 scenes · 15 second cap"
          badge="9:16"
          icon={<Sparkles className="h-4 w-4" />}
          art="reel"
          config={config}
        />
      </div>

      {mode === 'brandreel' ? (
        <div className="space-y-3 rounded-xl border border-signal/20 bg-signal/[0.025] p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium text-ivory-200">
                Scene sequence
              </p>
              <p className="mt-0.5 text-[9px] text-ivory-600">
                {enabledScenes.length} scenes · {formatShortTime(playback)} final
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setAllScenes(true)}
                className="text-[8px] uppercase tracking-[0.12em] text-ivory-500 hover:text-ivory-200"
              >
                all
              </button>
              <span className="text-ivory-700">/</span>
              <button
                type="button"
                onClick={() => setAllScenes(false)}
                className="text-[8px] uppercase tracking-[0.12em] text-ivory-500 hover:text-ivory-200"
              >
                none
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            {config.scenes.map((scene, index) => {
              const meta = sceneMeta[scene.id]
              return (
                <div
                  key={scene.id}
                  className={cn(
                    'rounded-lg border transition-all',
                    scene.enabled
                      ? 'border-white/[0.075] bg-black/20'
                      : 'border-white/[0.035] bg-black/10 opacity-50',
                  )}
                >
                  <div className="flex items-center gap-2 px-2 py-2">
                    <Checkbox
                      checked={scene.enabled}
                      onCheckedChange={(enabled) =>
                        updateScene(scene.id, { enabled })
                      }
                      label={meta.name}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[8px] text-ivory-600">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="truncate text-[10px] font-medium text-ivory-300">
                          {meta.name}
                        </span>
                      </div>
                      <p className="truncate text-[8px] uppercase tracking-[0.1em] text-ivory-600">
                        {meta.kicker}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 rounded-md border border-white/[0.06] bg-black/20 p-0.5">
                      {(['short', 'medium', 'long'] as SceneLength[]).map(
                        (length) => (
                          <button
                            key={length}
                            type="button"
                            disabled={!scene.enabled}
                            onClick={() => updateScene(scene.id, { length })}
                            className={cn(
                              'h-[20px] w-[24px] rounded text-[8px] font-semibold uppercase transition-colors',
                              scene.length === length
                                ? 'bg-white/[0.11] text-ivory-100'
                                : 'text-ivory-600 hover:text-ivory-300',
                            )}
                            title={`${length} — ${sceneLengths[length]}s`}
                          >
                            {length[0]}
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between rounded-lg bg-black/20 px-2.5 py-2">
            <span className="text-[9px] text-ivory-500">
              {adaptive ? 'Adaptive speed' : 'Timeline duration'}
            </span>
            <span className="font-mono text-[9px] text-ivory-300">
              {formatShortTime(base)}
              {adaptive ? (
                <span className="text-signal"> → {formatShortTime(playback)}</span>
              ) : null}
            </span>
          </div>
          {adaptive ? (
            <p className="text-[9px] leading-relaxed text-ivory-600">
              Playback is compressed {((base / playback) * 100).toFixed(0)}% to
              land exactly on the 15 second cap without dropping a scene.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.075] bg-black/20 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-[0.16em] text-ivory-600">
              Output frame
            </span>
            <span className="font-mono text-[9px] text-ivory-400">
              {aspect === 'wide' ? '16:9 · 1920 × 1080' : '9:16 · 1080 × 1920'}
            </span>
          </div>
          <div className="mt-2.5 flex gap-1">
            {[...Array(16)].map((_, index) => (
              <span
                key={index}
                className="h-1 flex-1 rounded-full bg-white/[0.07]"
              />
            ))}
          </div>
          <p className="mt-2 text-[9px] leading-relaxed text-ivory-600">
            {mode === 'showreel'
              ? 'Five signature styles cut together with authored wipes. The end card closes the reel.'
              : 'Each style resolves into a typographic end card with mark, brand name and site.'}
          </p>
        </div>
      )}
    </div>
  )
}

function StyleArt({
  style,
  config,
  className,
  art,
}: {
  style?: StyleId
  config: BrandConfig
  className?: string
  art?: 'showreel' | 'reel'
}) {
  return (
    <div
      className={cn('style-art', className)}
      data-style={style || art}
      style={
        {
          '--art-primary': config.primary,
          '--art-secondary': config.secondary,
          '--art-dark': config.dark,
          '--art-light': config.light,
        } as CSSProperties
      }
    >
      <span className="art-a" />
      <span className="art-b" />
      <span className="art-c" />
    </div>
  )
}

function ModeCard({
  active,
  onClick,
  title,
  subtitle,
  badge,
  icon,
  art,
  config,
}: {
  active: boolean
  onClick: () => void
  title: string
  subtitle: string
  badge: string
  icon: ReactNode
  art: 'showreel' | 'reel'
  config: BrandConfig
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex items-center gap-3 overflow-hidden rounded-xl border p-3 text-left transition-all',
        active
          ? 'border-signal/55 bg-signal/[0.055]'
          : 'border-white/[0.075] bg-black/20 hover:border-white/[0.16]',
      )}
    >
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg">
        <StyleArt art={art} config={config} className="absolute inset-0" />
        <span className="relative z-10 flex h-6 w-6 items-center justify-center rounded-md bg-black/35 text-ivory-100 backdrop-blur">
          {icon}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-ivory-200">{title}</span>
          <span className="rounded border border-white/[0.08] px-1 py-0.5 font-mono text-[7px] text-ivory-500">
            {badge}
          </span>
        </div>
        <p className="truncate text-[9px] text-ivory-600">{subtitle}</p>
      </div>
      {active ? <Check className="h-3.5 w-3.5 text-signal" strokeWidth={3} /> : null}
    </button>
  )
}

const layerMeta: Record<
  LayerKey,
  { label: string; description: string; icon: typeof Fingerprint }
> = {
  logo: {
    label: 'Logo',
    description: 'Mark entrance and rotation',
    icon: Fingerprint,
  },
  text: {
    label: 'Typography',
    description: 'Wordmark and supporting lines',
    icon: Type,
  },
  background: {
    label: 'Background',
    description: 'Wipes, grids and atmosphere',
    icon: Square,
  },
}

const easingLabels: Record<EaseName, string> = {
  easeOutCubic: 'Ease out cubic',
  easeInOutCubic: 'Ease in-out cubic',
  backOut: 'Back out',
  elasticOut: 'Elastic out',
  linear: 'Linear',
}

function TimingPanel({
  config,
  setConfig,
}: {
  config: BrandConfig
  setConfig: SetConfig
}) {
  const [open, setOpen] = useState<LayerKey | null>('logo')
  const updateLayer = (key: LayerKey, patch: Partial<BrandConfig['layers'][LayerKey]>) => {
    setConfig((prev) => ({
      ...prev,
      layers: {
        ...prev.layers,
        [key]: { ...prev.layers[key], ...patch },
      },
    }))
  }
  const reset = () => {
    setConfig((prev) => ({
      ...prev,
      layers: {
        logo: { speed: 1, delay: 0, easing: 'backOut' },
        text: { speed: 1, delay: 0.12, easing: 'easeOutCubic' },
        background: { speed: 1, delay: 0, easing: 'easeInOutCubic' },
      },
    }))
  }

  return (
    <div className="space-y-5">
      <PanelHeading
        eyebrow="04 / Timing"
        title="Channel warping"
        description="Give each layer its own clock. Speed, delay and curve are applied independently at render time."
        action={
          <Button size="sm" variant="ghost" onClick={reset}>
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
        }
      />

      <div className="space-y-2">
        {(Object.keys(layerMeta) as LayerKey[]).map((key) => {
          const meta = layerMeta[key]
          const layer = config.layers[key]
          const Icon = meta.icon
          const expanded = open === key
          return (
            <div
              key={key}
              className="overflow-hidden rounded-xl border border-white/[0.075] bg-black/20"
            >
              <button
                type="button"
                onClick={() => setOpen(expanded ? null : key)}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.025]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.035] text-ivory-400">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-medium text-ivory-200">
                    {meta.label}
                  </span>
                  <span className="block truncate text-[9px] text-ivory-600">
                    {meta.description}
                  </span>
                </span>
                <span className="font-mono text-[9px] text-ivory-500">
                  {layer.speed.toFixed(2)}×
                </span>
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 text-ivory-600 transition-transform',
                    expanded && 'rotate-180',
                  )}
                />
              </button>
              {expanded ? (
                <div className="space-y-3 border-t border-white/[0.06] px-3 pb-3.5 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-[0.13em] text-ivory-600">
                      Easing curve
                    </span>
                    <EasingCurve curve={layer.easing} color="var(--color-signal)" />
                  </div>
                  <Field label="Speed" hint={`${layer.speed.toFixed(2)}×`}>
                    <Slider
                      value={layer.speed}
                      min={0.4}
                      max={2.2}
                      step={0.05}
                      onValueChange={(speed) => updateLayer(key, { speed })}
                    />
                  </Field>
                  <Field
                    label="Delay offset"
                    hint={`${Math.round(layer.delay * 1000)} ms`}
                  >
                    <Slider
                      value={layer.delay}
                      min={0}
                      max={0.8}
                      step={0.01}
                      onValueChange={(delay) => updateLayer(key, { delay })}
                    />
                  </Field>
                  <Field label="Curve">
                    <Select
                      value={layer.easing}
                      onChange={(event) =>
                        updateLayer(key, {
                          easing: event.target.value as EaseName,
                        })
                      }
                    >
                      {(Object.keys(easingLabels) as EaseName[]).map((curve) => (
                        <option key={curve} value={curve}>
                          {easingLabels[curve]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      <div className="rounded-xl border border-white/[0.075] bg-black/20 p-3">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-signal" />
          <span className="text-[10px] font-medium text-ivory-300">
            Frame-accurate
          </span>
        </div>
        <p className="mt-1.5 text-[9px] leading-relaxed text-ivory-600">
          Every scene is evaluated as a pure function of time. Scrubbing and
          offline export use the identical render path.
        </p>
      </div>
    </div>
  )
}

function EasingCurve({ curve, color }: { curve: EaseName; color: string }) {
  const path = useMemo(() => {
    const fn = easings[curve]
    const points: string[] = []
    for (let i = 0; i <= 32; i++) {
      const p = i / 32
      const y = 26 - Math.max(-0.2, Math.min(1.2, fn(p))) * 22
      points.push(`${i === 0 ? 'M' : 'L'}${(p * 44).toFixed(1)},${y.toFixed(1)}`)
    }
    return points.join(' ')
  }, [curve])
  return (
    <svg width="48" height="30" viewBox="0 0 48 30" className="opacity-70">
      <path d="M2 28 H46" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      <path d="M2 4 V28" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      <path d={path} fill="none" stroke={color} strokeWidth="1.4" />
    </svg>
  )
}

function PlatesPanel({
  config,
  notify,
}: {
  config: BrandConfig
  notify: Notify
}) {
  const [sources, setSources] = useState<Partial<Record<ProductId, string>>>({})

  useEffect(() => {
    let active = true
    void preloadImage(config.logoDataUrl).then(() => {
      if (!active) return
      const next: Partial<Record<ProductId, string>> = {}
      productIds.forEach((product) => {
        const image = getProductImage(product, config)
        if (image) next[product] = image
      })
      setSources(next)
    })
    return () => {
      active = false
    }
  }, [config])

  const ready = productIds.filter((product) => sources[product]).length

  return (
    <div className="space-y-5">
      <PanelHeading
        eyebrow="05 / Local plates"
        title="Product mockups"
        description="Twelve studio plates rendered locally from your mark and palette. No API, no uploads. The Brand Reel pages through every plate."
        action={
          <span className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-black/20 px-2 py-1 font-mono text-[8px] text-ivory-500">
            <span className="h-1 w-1 rounded-full bg-signal" />
            {ready}/{productIds.length}
          </span>
        }
      />

      <div className="grid grid-cols-2 gap-2">
        {productIds.map((product, index) => (
          <PlateCard
            key={product}
            product={product}
            index={index}
            src={sources[product]}
            onNotify={notify}
          />
        ))}
      </div>

      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-3.5 w-3.5 text-signal/80" />
          <p className="text-[10px] font-medium text-ivory-200">
            Rendered from the current brand
          </p>
        </div>
        <p className="mt-1.5 text-[9px] leading-relaxed text-ivory-600">
          Plates update automatically when the logo, colours or type change.
          Download any plate as a 675 × 1200 JPEG for decks and social posts.
        </p>
      </div>
    </div>
  )
}

function PlateCard({
  product,
  index,
  src,
  onNotify,
}: {
  product: ProductId
  index: number
  src?: string
  onNotify: Notify
}) {
  const meta = productMeta[product]

  const download = () => {
    if (!src) return
    const link = document.createElement('a')
    link.href = src
    link.download = `${meta.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.jpg`
    document.body.appendChild(link)
    link.click()
    link.remove()
    onNotify(`${meta.name} downloaded`, 'success', '675 × 1200 JPEG plate.')
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/[0.075] bg-black/25">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#171614]">
        {src ? (
          <img
            src={src}
            alt={`${meta.name} mockup`}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-white/[0.06] to-transparent" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25" />
        <span className="absolute left-2 top-2 rounded border border-white/[0.1] bg-black/45 px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-[0.12em] text-ivory-400 backdrop-blur">
          Local
        </span>
        <button
          type="button"
          onClick={download}
          disabled={!src}
          className="absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-md border border-white/[0.15] bg-black/45 text-ivory-200 opacity-100 backdrop-blur transition-all hover:border-signal/60 hover:text-signal sm:opacity-0 sm:group-hover:opacity-100 disabled:opacity-0"
          title="Download plate"
        >
          <Download className="h-3 w-3" />
        </button>
        <div className="absolute bottom-2 left-2 right-10">
          <p className="truncate text-[10px] font-medium text-ivory-100">
            {meta.name}
          </p>
          <p className="truncate font-mono text-[7px] uppercase tracking-[0.12em] text-ivory-400">
            {String(index + 1).padStart(2, '0')} · {meta.surface}
          </p>
        </div>
      </div>
    </div>
  )
}
