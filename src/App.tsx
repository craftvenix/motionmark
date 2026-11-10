import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  Info,
  Loader2,
  Monitor,
  Smartphone,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import type {
  AnimationMode,
  Aspect,
  BrandConfig,
  ExportFormat,
  ToastMessage,
  ToastTone,
} from './types'
import {
  initialConfig,
  totalDuration as calculateDuration,
} from './lib/presets'
import { Stage } from './components/Stage'
import { Sidebar } from './components/Sidebar'
import { formatSupport } from './lib/videoExport'
import { exportCanvasVideo } from './lib/videoExport'
import { downloadBlob, formatShortTime, slugify, cn } from './lib/utils'
import { preloadImage } from './lib/logo'
import { ensureFontFamily } from './lib/fonts'
import { studioAudio } from './lib/audio'
import { Button, IconButton } from './components/ui'

const STORAGE_KEY = 'motionmark.studio.v1'
const SOUND_KEY = 'motionmark.sound.v1'

function loadSoundEnabled() {
  if (typeof window === 'undefined') return true
  try {
    const saved = window.localStorage.getItem(SOUND_KEY)
    return saved === null ? true : saved === '1'
  } catch {
    return true
  }
}

function cloneConfig(config: BrandConfig): BrandConfig {
  return {
    ...config,
    layers: {
      logo: { ...config.layers.logo },
      text: { ...config.layers.text },
      background: { ...config.layers.background },
    },
    scenes: config.scenes.map((scene) => ({ ...scene })),
  }
}

function loadConfig(): BrandConfig {
  if (typeof window === 'undefined') return cloneConfig(initialConfig)
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return cloneConfig(initialConfig)
    const saved = JSON.parse(raw) as Partial<BrandConfig>
    const base = cloneConfig(initialConfig)
    return {
      ...base,
      ...saved,
      layers: {
        logo: { ...base.layers.logo, ...saved.layers?.logo },
        text: { ...base.layers.text, ...saved.layers?.text },
        background: {
          ...base.layers.background,
          ...saved.layers?.background,
        },
      },
      scenes: base.scenes.map(
        (scene) =>
          saved.scenes?.find((item) => item.id === scene.id) ?? scene,
      ),
      logoDataUrl: saved.logoDataUrl || base.logoDataUrl,
      logoFileName: saved.logoFileName || base.logoFileName,
    }
  } catch {
    return cloneConfig(initialConfig)
  }
}

function modeLabel(mode: AnimationMode) {
  if (mode === 'showreel') return 'Showreel'
  if (mode === 'brandreel') return 'Brand Reel · 9:16'
  return mode.charAt(0).toUpperCase() + mode.slice(1)
}

function App() {
  const [config, setConfig] = useState<BrandConfig>(loadConfig)
  const [mode, setMode] = useState<AnimationMode>('reveal')
  const [aspect, setAspect] = useState<Aspect>('wide')
  const [soundEnabled, setSoundEnabled] = useState(loadSoundEnabled)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [exportOpen, setExportOpen] = useState(false)
  const [exportState, setExportState] = useState({
    running: false,
    progress: 0,
    format: 'webm' as ExportFormat,
  })
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const toastId = useRef(1)
  const support = useMemo(() => formatSupport(), [])

  const notify = useCallback(
    (title: string, tone: ToastTone = 'info', description?: string) => {
      const id = toastId.current++
      setToasts((prev) => [...prev.slice(-3), { id, title, description, tone }])
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id))
      }, tone === 'error' ? 6200 : 4200)
    },
    [],
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
      } catch {
        try {
          const light = { ...config, logoDataUrl: initialConfig.logoDataUrl }
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(light))
        } catch {
          // Autosave is a convenience; the studio itself never depends on it.
        }
      }
    }, 600)
    return () => window.clearTimeout(timer)
  }, [config])

  useEffect(() => {
    if (!exportOpen) return
    const close = (event: MouseEvent) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target as Node)
      ) {
        setExportOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [exportOpen])

  useEffect(() => {
    try {
      window.localStorage.setItem(SOUND_KEY, soundEnabled ? '1' : '0')
    } catch {
      // Sound preference is optional.
    }
    studioAudio.setEnabled(soundEnabled)
    if (!soundEnabled) studioAudio.stopBed()
  }, [soundEnabled])

  useEffect(() => {
    const unlock = () => studioAudio.unlock()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  const duration = useMemo(() => calculateDuration(mode, config), [mode, config])

  const toggleSound = () => {
    studioAudio.unlock()
    setSoundEnabled((value) => !value)
  }

  const selectMode = (next: AnimationMode) => {
    if (next === 'brandreel') {
      setAspect('tall')
      setMode('brandreel')
      return
    }
    setAspect('wide')
    setMode(next)
  }

  const selectAspect = (next: Aspect) => {
    setAspect(next)
    if (next === 'tall') {
      setMode('brandreel')
    } else if (mode === 'brandreel') {
      setMode('reveal')
    }
  }

  const preferredFormat: ExportFormat = support.mp4 ? 'mp4' : 'webm'

  const handleExport = async (format: ExportFormat) => {
    if (exportState.running) return
    setExportOpen(false)
    const actualFormat = format === 'mp4' && !support.mp4 ? 'webm' : format
    if (format === 'mp4' && !support.mp4) {
      notify(
        'MP4 encoder unavailable',
        'info',
        'This browser will export WebM (VP9) instead.',
      )
    }
    setExportState({ running: true, progress: 0, format: actualFormat })
    try {
      await Promise.all([
        preloadImage(config.logoDataUrl),
        ensureFontFamily(config.fontFamily),
      ])
      let lastReported = -1
      const runExport = (format: ExportFormat) =>
        exportCanvasVideo({
          config,
          mode,
          aspect,
          duration,
          format,
          fps: 60,
          onProgress: (progress) => {
            if (progress - lastReported >= 0.45 || progress >= 100) {
              lastReported = progress
              setExportState((prev) => ({ ...prev, progress }))
            }
          },
        })

      let result: Awaited<ReturnType<typeof runExport>>
      try {
        result = await runExport(actualFormat)
      } catch (error) {
        // Some browsers advertise an MP4 encoder that silently records no
        // frames. Retry with WebM rather than dropping the export entirely.
        if (actualFormat !== 'mp4') throw error
        notify(
          'MP4 encoder unavailable',
          'info',
          'The MP4 encoder produced no frames. Saving WebM (VP9) instead.',
        )
        lastReported = -1
        setExportState({ running: true, progress: 0, format: 'webm' })
        result = await runExport('webm')
      }

      const fileMode = mode === 'brandreel' ? 'brand-reel' : mode
      const filename = `${slugify(config.brandName)}-${fileMode}-${
        aspect === 'wide' ? '16x9' : '9x16'
      }.${result.extension}`
      downloadBlob(result.blob, filename)
      notify(
        'Video exported',
        'success',
        `${result.extension.toUpperCase()} · 60 FPS · ${formatShortTime(
          duration,
        )}${result.audio ? ' · Sound' : ' · Silent'}`,
      )
      setExportState((prev) => ({ ...prev, progress: 100 }))
      window.setTimeout(
        () =>
          setExportState({
            running: false,
            progress: 0,
            format: actualFormat,
          }),
        700,
      )
    } catch (error) {
      setExportState({ running: false, progress: 0, format: actualFormat })
      notify(
        'Export failed',
        'error',
        error instanceof Error ? error.message : 'The encoder stopped.',
      )
    }
  }

  const handleReset = () => {
    setConfig(cloneConfig(initialConfig))
    setMode('reveal')
    setAspect('wide')
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
    notify('Studio reset', 'info', 'Back to the founding brand system.')
  }

  return (
    <div className="studio-app flex h-screen flex-col overflow-hidden bg-[#08080a] text-ivory-200">
      <header className="relative z-40 flex h-[64px] shrink-0 items-center justify-between gap-5 border-b border-white/[0.065] bg-[#0a0a0d]/95 px-4 backdrop-blur-xl sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="brand-glyph">
              <span />
              <span />
              <span />
            </div>
            <div className="leading-none">
              <div className="font-display text-[15px] font-medium tracking-[-0.02em] text-ivory-100">
                motionmark<span className="text-signal">.</span>
              </div>
              <div className="mt-1 font-mono text-[7px] uppercase tracking-[0.33em] text-ivory-600">
                Brand motion studio
              </div>
            </div>
          </div>
          <span className="hidden h-7 w-px bg-white/[0.07] sm:block" />
          <div className="hidden items-center gap-2 sm:flex">
            <span className="rounded-md border border-white/[0.075] bg-white/[0.025] px-2 py-1 font-mono text-[8px] uppercase tracking-[0.12em] text-ivory-500">
              Studio
            </span>
            <span className="text-[10px] text-ivory-600">/</span>
            <span className="max-w-[120px] truncate text-[10px] text-ivory-400">
              {config.brandName}
            </span>
          </div>
        </div>

        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-2 md:flex">
          <SegmentedAspect aspect={aspect} onChange={selectAspect} />
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={soundEnabled}
            title={soundEnabled ? 'Mute animation sound' : 'Enable animation sound'}
            className={cn(
              'flex h-9 items-center gap-1.5 rounded-lg border px-2.5 transition-all',
              soundEnabled
                ? 'border-signal/35 bg-signal/[0.07] text-signal hover:bg-signal/[0.12]'
                : 'border-white/[0.07] bg-black/25 text-ivory-500 hover:text-ivory-300',
            )}
          >
            {soundEnabled ? (
              <Volume2 className="h-3.5 w-3.5" />
            ) : (
              <VolumeX className="h-3.5 w-3.5" />
            )}
            <span className="hidden text-[9px] font-medium uppercase tracking-[0.12em] xl:inline">
              Sound
            </span>
          </button>
          <div className="hidden items-center gap-2 rounded-lg border border-white/[0.07] bg-black/25 px-3 py-1.5 lg:flex">
            <Clock3 className="h-3 w-3 text-ivory-500" />
            <span className="font-mono text-[10px] text-ivory-300">
              {formatShortTime(duration)}
            </span>
            <span className="h-3 w-px bg-white/10" />
            <span className="text-[9px] uppercase tracking-[0.12em] text-ivory-600">
              {aspect === 'wide' ? 'Wide' : 'Tall'}
            </span>
          </div>
          <div className="relative" ref={exportMenuRef}>
            <div className="flex items-stretch">
              <Button
                variant="primary"
                size="md"
                className={cn(
                  'relative h-9 min-w-[140px] overflow-hidden rounded-r-none border-r border-black/15 px-3.5 text-[12px]',
                  exportState.running && 'min-w-[164px]',
                )}
                onClick={() => {
                  if (!exportState.running) void handleExport(preferredFormat)
                }}
                disabled={exportState.running}
              >
                {exportState.running ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Rendering {Math.round(exportState.progress)}%
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" strokeWidth={2.4} />
                    Export video
                  </>
                )}
                {exportState.running ? (
                  <span
                    className="absolute bottom-0 left-0 h-[2px] bg-[#15170e]"
                    style={{ width: `${exportState.progress}%` }}
                  />
                ) : null}
              </Button>
              <button
                type="button"
                aria-label="Export settings"
                disabled={exportState.running}
                onClick={() => setExportOpen((open) => !open)}
                className="flex h-9 w-8 items-center justify-center rounded-r-xl bg-signal text-[#12130d] transition-colors hover:bg-[#e3ff8d] disabled:opacity-50"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
            {exportOpen ? (
              <div className="absolute right-0 top-[calc(100%+8px)] w-[274px] overflow-hidden rounded-xl border border-white/[0.1] bg-[#141418] shadow-[0_24px_70px_-20px_rgba(0,0,0,0.9)]">
                <div className="border-b border-white/[0.07] px-3.5 py-3">
                  <p className="text-[11px] font-medium text-ivory-200">
                    Render settings
                  </p>
                  <p className="mt-0.5 font-mono text-[9px] text-ivory-600">
                    {aspect === 'wide' ? '1920 × 1080 · 16:9' : '1080 × 1920 · 9:16'}{' '}
                    · 60 FPS
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!support.mp4}
                  onClick={() => void handleExport('mp4')}
                  className="flex w-full items-center justify-between px-3.5 py-3 text-left transition-colors hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span>
                    <span className="block text-[11px] font-medium text-ivory-200">
                      MP4 · H.264
                    </span>
                    <span className="block text-[9px] text-ivory-600">
                      Universal · social ready
                    </span>
                  </span>
                  {support.mp4 ? (
                    <Check className="h-3.5 w-3.5 text-signal" />
                  ) : (
                    <span className="font-mono text-[8px] text-ivory-600">
                      unavailable
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  disabled={!support.webm}
                  onClick={() => void handleExport('webm')}
                  className="flex w-full items-center justify-between border-t border-white/[0.055] px-3.5 py-3 text-left transition-colors hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span>
                    <span className="block text-[11px] font-medium text-ivory-200">
                      WebM · VP9
                    </span>
                    <span className="block text-[9px] text-ivory-600">
                      Lightweight · web native
                    </span>
                  </span>
                  {support.webm ? (
                    <Check className="h-3.5 w-3.5 text-signal" />
                  ) : (
                    <span className="font-mono text-[8px] text-ivory-600">
                      unavailable
                    </span>
                  )}
                </button>
                <div className="border-t border-white/[0.055] bg-black/20 px-3.5 py-2">
                  <p className="text-[8px] leading-relaxed text-ivory-600">
                    Frame-by-frame canvas capture. Keep this tab active while
                    rendering.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main className="flex min-h-0 flex-1">
        <Stage
          config={config}
          mode={mode}
          aspect={aspect}
          duration={duration}
          modeLabel={modeLabel(mode)}
          soundEnabled={soundEnabled && !exportState.running}
        />
        <Sidebar
          config={config}
          setConfig={setConfig}
          mode={mode}
          onSelectMode={selectMode}
          onSelectAspect={selectAspect}
          aspect={aspect}
          notify={notify}
          onReset={handleReset}
        />
      </main>

      <ToastViewport
        toasts={toasts}
        onDismiss={(id) =>
          setToasts((prev) => prev.filter((toast) => toast.id !== id))
        }
      />
    </div>
  )
}

function SegmentedAspect({
  aspect,
  onChange,
}: {
  aspect: Aspect
  onChange: (aspect: Aspect) => void
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-white/[0.075] bg-black/25 p-1">
      <button
        type="button"
        onClick={() => onChange('wide')}
        className={cn(
          'flex h-7 items-center gap-1.5 rounded-[6px] px-2.5 text-[10px] font-medium transition-all',
          aspect === 'wide'
            ? 'bg-white/[0.1] text-ivory-100'
            : 'text-ivory-500 hover:text-ivory-300',
        )}
      >
        <Monitor className="h-3 w-3" />
        16:9
      </button>
      <button
        type="button"
        onClick={() => onChange('tall')}
        className={cn(
          'flex h-7 items-center gap-1.5 rounded-[6px] px-2.5 text-[10px] font-medium transition-all',
          aspect === 'tall'
            ? 'bg-white/[0.1] text-ivory-100'
            : 'text-ivory-500 hover:text-ivory-300',
        )}
      >
        <Smartphone className="h-3 w-3" />
        9:16
      </button>
    </div>
  )
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[]
  onDismiss: (id: number) => void
}) {
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[340px] flex-col gap-2">
      {toasts.map((toast) => {
        const Icon =
          toast.tone === 'success'
            ? CheckCircle2
            : toast.tone === 'error'
              ? AlertCircle
              : Info
        return (
          <div
            key={toast.id}
            className={cn(
              'toast-enter pointer-events-auto flex gap-3 rounded-xl border bg-[#151519]/95 p-3.5 shadow-[0_20px_50px_-16px_rgba(0,0,0,0.8)] backdrop-blur-xl',
              toast.tone === 'success'
                ? 'border-signal/20'
                : toast.tone === 'error'
                  ? 'border-red-400/20'
                  : 'border-white/[0.1]',
            )}
          >
            <Icon
              className={cn(
                'mt-0.5 h-4 w-4 shrink-0',
                toast.tone === 'success'
                  ? 'text-signal'
                  : toast.tone === 'error'
                    ? 'text-red-300'
                    : 'text-ivory-400',
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-ivory-100">
                {toast.title}
              </p>
              {toast.description ? (
                <p className="mt-0.5 text-[10px] leading-relaxed text-ivory-500">
                  {toast.description}
                </p>
              ) : null}
            </div>
            <IconButton
              onClick={() => onDismiss(toast.id)}
              className="-mr-1 -mt-1 h-6 w-6 text-ivory-600 hover:text-ivory-200"
              aria-label="Dismiss notification"
            >
              <X className="h-3 w-3" />
            </IconButton>
          </div>
        )
      })}
    </div>
  )
}

export default App
