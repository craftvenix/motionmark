import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import {
  BookOpen,
  Maximize2,
  MonitorPlay,
  Pause,
  Play,
  Repeat,
  RotateCcw,
  Smartphone,
  StepBack,
  StepForward,
} from 'lucide-react'
import type {
  AnimationMode,
  Aspect,
  BrandConfig,
  PresentationMode,
} from '../types'
import { renderFrame } from '../lib/renderer'
import { buildSoundCues, studioAudio, type SoundCue } from '../lib/audio'
import { formatTimecode, cn } from '../lib/utils'
import { IconButton, Segmented, StatusDot } from './ui'

interface StageProps {
  config: BrandConfig
  mode: AnimationMode
  aspect: Aspect
  duration: number
  modeLabel: string
  soundEnabled: boolean
}

export function Stage({
  config,
  mode,
  aspect,
  duration,
  modeLabel,
  soundEnabled,
}: StageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stageAreaRef = useRef<HTMLDivElement>(null)
  const scrubRef = useRef<HTMLInputElement>(null)
  const timeRef = useRef(0)
  const durationRef = useRef(duration)
  const modeRef = useRef(mode)
  const configRef = useRef(config)
  const playingRef = useRef(true)
  const loopRef = useRef(true)
  const dirtyRef = useRef(true)
  const wasPlayingRef = useRef(true)
  const cuesRef = useRef<SoundCue[]>([])
  const soundEnabledRef = useRef(soundEnabled)
  const timecodeRef = useRef<HTMLSpanElement>(null)
  const frameRef = useRef<HTMLSpanElement>(null)
  const [playing, setPlaying] = useState(true)
  const [loop, setLoop] = useState(true)
  const [presentation, setPresentation] = useState<PresentationMode>('stage')
  const [fps, setFps] = useState(60)

  configRef.current = config
  durationRef.current = duration
  modeRef.current = mode
  soundEnabledRef.current = soundEnabled

  const setPlayingSafe = (value: boolean) => {
    playingRef.current = value
    setPlaying(value)
  }
  const setLoopSafe = (value: boolean) => {
    loopRef.current = value
    setLoop(value)
  }

  const seek = (seconds: number) => {
    timeRef.current = Math.max(0, Math.min(durationRef.current, seconds))
    dirtyRef.current = true
  }

  const syncUI = () => {
    const total = durationRef.current || 1
    const t = timeRef.current
    const percent = Math.max(0, Math.min(100, (t / total) * 100))
    if (scrubRef.current) {
      scrubRef.current.value = String((t / total) * 1000)
      scrubRef.current.style.setProperty('--value', `${percent}%`)
    }
    if (timecodeRef.current) {
      timecodeRef.current.textContent = formatTimecode(t)
    }
    if (frameRef.current) {
      frameRef.current.textContent = String(
        Math.min(99999, Math.floor(t * 60)),
      ).padStart(4, '0')
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return
    let raf = 0
    let last = performance.now()
    let lastFps = last
    let lastIdleDraw = 0
    let frames = 0
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const total = durationRef.current
      if (playingRef.current) {
        const from = timeRef.current
        timeRef.current += dt
        if (timeRef.current >= total) {
          if (loopRef.current) {
            timeRef.current = timeRef.current % total
          } else {
            timeRef.current = total
            playingRef.current = false
            setPlaying(false)
          }
        }
        const to = timeRef.current
        if (soundEnabledRef.current && to !== from) {
          if (to < from) {
            studioAudio.playRange(from, total, cuesRef.current)
            studioAudio.playRange(-0.001, to, cuesRef.current)
          } else {
            studioAudio.playRange(from, to, cuesRef.current)
          }
        }
        dirtyRef.current = true
      }
      // While paused, refresh at a low rate so asynchronously loaded logos
      // and plates still find their way onto the canvas.
      if (!playingRef.current && now - lastIdleDraw > 280) {
        dirtyRef.current = true
        lastIdleDraw = now
      }
      const canvas = canvasRef.current
      if (canvas && dirtyRef.current) {
        const ctx = canvas.getContext('2d', { alpha: false })
        if (ctx) {
          renderFrame(
            ctx,
            canvas.width,
            canvas.height,
            configRef.current,
            modeRef.current,
            timeRef.current,
          )
          syncUI()
        }
        dirtyRef.current = false
      }
      frames += 1
      if (now - lastFps > 700) {
        setFps(Math.max(1, Math.round((frames * 1000) / (now - lastFps))))
        frames = 0
        lastFps = now
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // The loop reads refs so it never restarts while the studio is edited.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    cuesRef.current = buildSoundCues(mode, config, duration)
  }, [mode, config, duration])

  useEffect(() => {
    studioAudio.setEnabled(soundEnabled)
    if (soundEnabled && playing) {
      studioAudio.startBed(mode)
    } else {
      studioAudio.stopBed()
    }
  }, [soundEnabled, playing, mode])

  useEffect(() => {
    const unlock = () => studioAudio.unlock()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  useEffect(() => {
    return () => {
      studioAudio.stopBed()
    }
  }, [])

  useEffect(() => {
    dirtyRef.current = true
    if (timeRef.current > duration) seek(duration)
  }, [config, mode, aspect, duration, presentation])

  useEffect(() => {
    timeRef.current = 0
    dirtyRef.current = true
    setPlayingSafe(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, aspect])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase()
      if (
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        tag === 'button' ||
        target?.isContentEditable
      ) {
        return
      }
      if (event.code === 'Space') {
        event.preventDefault()
        if (!playingRef.current && timeRef.current >= durationRef.current) {
          seek(0)
        }
        setPlayingSafe(!playingRef.current)
      }
      if (event.code === 'ArrowLeft') {
        event.preventDefault()
        setPlayingSafe(false)
        seek(timeRef.current - (event.shiftKey ? 1 : 1 / 60))
      }
      if (event.code === 'ArrowRight') {
        event.preventDefault()
        setPlayingSafe(false)
        seek(timeRef.current + (event.shiftKey ? 1 : 1 / 60))
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const togglePlay = () => {
    if (!playingRef.current && timeRef.current >= durationRef.current - 0.001) {
      seek(0)
    }
    setPlayingSafe(!playingRef.current)
  }

  const restart = () => {
    seek(0)
    setPlayingSafe(true)
  }

  const step = (amount: number) => {
    setPlayingSafe(false)
    seek(timeRef.current + amount)
  }

  const startScrub = (event: ReactPointerEvent<HTMLInputElement>) => {
    wasPlayingRef.current = playingRef.current
    setPlayingSafe(false)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const endScrub = () => {
    if (wasPlayingRef.current) setPlayingSafe(true)
  }

  const toggleFullscreen = () => {
    const element = stageAreaRef.current
    if (!element) return
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void element.requestFullscreen?.()
    }
  }

  const canvasNode = (
    <canvas
      ref={canvasRef}
      width={aspect === 'wide' ? 1920 : 1080}
      height={aspect === 'wide' ? 1080 : 1920}
      className="preview-canvas"
      aria-label={`${config.brandName} motion preview`}
    />
  )

  return (
    <section className="flex min-w-0 flex-1 flex-col">
      <div className="flex h-[58px] shrink-0 items-center justify-between gap-4 border-b border-white/[0.055] px-5 lg:px-7">
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="flex items-center gap-1.5">
            <StatusDot />
            <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-ivory-400">
              Live canvas
            </span>
          </span>
          <span className="h-3 w-px bg-white/10" />
          <span className="font-mono text-[10px] text-ivory-600">
            {aspect === 'wide' ? '1920 × 1080' : '1080 × 1920'}
          </span>
          <span className="rounded-md border border-white/[0.07] bg-white/[0.035] px-1.5 py-0.5 font-mono text-[9px] text-ivory-500">
            {fps} FPS
          </span>
          <span className="hidden truncate text-[11px] text-ivory-500 xl:block">
            {modeLabel}
          </span>
        </div>
        <Segmented<PresentationMode>
          value={presentation}
          onChange={setPresentation}
          options={[
            {
              value: 'stage',
              label: (
                <>
                  <MonitorPlay className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Stage</span>
                </>
              ),
              title: 'Event stage display',
            },
            {
              value: 'phone',
              label: (
                <>
                  <Smartphone className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Phone</span>
                </>
              ),
              title: 'Phone frame',
            },
            {
              value: 'deck',
              label: (
                <>
                  <BookOpen className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Deck</span>
                </>
              ),
              title: 'Brand guideline deck',
            },
          ]}
        />
      </div>

      <div
        ref={stageAreaRef}
        className="stage-area relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4 py-5 sm:px-8"
        data-presentation={presentation}
      >
        <div className="stage-grid" aria-hidden />
        <div className="stage-glow" aria-hidden />
        <div
          className={cn(
            'presentation-frame relative z-10',
            `presentation-${presentation}`,
          )}
          data-aspect={aspect}
        >
          {presentation === 'phone' ? (
            <div className="phone-mock">
              <div className="phone-mock-island" />
              <div className="phone-mock-screen">{canvasNode}</div>
              <div className="phone-mock-button phone-mock-button-left" />
              <div className="phone-mock-button phone-mock-button-right" />
            </div>
          ) : presentation === 'deck' ? (
            <div className="deck-mock" data-aspect={aspect}>
              <div className="deck-topline">
                <span>Motionmark / Brand guidelines</span>
                <span>Identity in motion</span>
              </div>
              <div className="deck-canvas-wrap">{canvasNode}</div>
              <div className="deck-bottomline">
                <span className="deck-swatches">
                  {[config.primary, config.secondary, config.dark, config.light].map(
                    (color) => (
                      <span
                        key={color}
                        className="deck-swatch"
                        style={{ background: color }}
                      />
                    ),
                  )}
                </span>
                <span>{config.website}</span>
                <span>MM—26</span>
              </div>
            </div>
          ) : (
            <div className="stage-screen">
              <div className="stage-screen-top">
                <span>{modeLabel}</span>
                <span className="flex items-center gap-1.5">
                  <StatusDot />
                  Preview
                </span>
              </div>
              {canvasNode}
              <div className="stage-screen-bottom">
                <span>{config.brandName}</span>
                <span>{config.website}</span>
              </div>
            </div>
          )}
        </div>
        <div className="absolute bottom-4 right-5 z-20 flex items-center gap-2">
          <span className="hidden rounded-md border border-white/[0.07] bg-black/30 px-2 py-1 font-mono text-[9px] text-ivory-600 backdrop-blur sm:block">
            SPACE PLAY · ← → FRAME
          </span>
          <IconButton
            onClick={toggleFullscreen}
            title="Fullscreen stage"
            className="border border-white/[0.08] bg-black/30 backdrop-blur"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </IconButton>
        </div>
      </div>

      <div className="shrink-0 border-t border-white/[0.06] bg-[#0b0b0e]/80 px-4 py-3.5 backdrop-blur-lg sm:px-6">
        <div className="mb-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            <IconButton onClick={restart} title="Restart (R)">
              <RotateCcw className="h-3.5 w-3.5" />
            </IconButton>
            <IconButton onClick={() => step(-1 / 60)} title="Previous frame">
              <StepBack className="h-3.5 w-3.5" />
            </IconButton>
            <button
              type="button"
              onClick={togglePlay}
              className="mx-1 flex h-9 w-9 items-center justify-center rounded-full bg-signal text-[#17190e] shadow-[0_0_0_4px_rgba(216,255,101,0.08),0_8px_20px_-8px_rgba(216,255,101,0.6)] transition-transform hover:scale-105 active:scale-95"
              aria-label={playing ? 'Pause' : 'Play'}
            >
              {playing ? (
                <Pause className="h-3.5 w-3.5 fill-current" />
              ) : (
                <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
              )}
            </button>
            <IconButton onClick={() => step(1 / 60)} title="Next frame">
              <StepForward className="h-3.5 w-3.5" />
            </IconButton>
            <IconButton
              onClick={() => setLoopSafe(!loop)}
              title="Loop playback"
              className={cn(loop && 'text-signal')}
            >
              <Repeat className="h-3.5 w-3.5" />
            </IconButton>
          </div>
          <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.04em]">
            <span className="text-ivory-500">
              FRAME <span ref={frameRef} className="text-ivory-300">0000</span>
            </span>
            <span className="h-3 w-px bg-white/10" />
            <span className="text-ivory-200">
              <span ref={timecodeRef}>{formatTimecode(0)}</span>
              <span className="text-ivory-600"> / {formatTimecode(duration)}</span>
            </span>
          </div>
        </div>
        <div className="scrub-shell">
          <input
            ref={scrubRef}
            type="range"
            min={0}
            max={1000}
            step={1}
            defaultValue={0}
            onPointerDown={startScrub}
            onPointerUp={endScrub}
            onPointerCancel={endScrub}
            onChange={(event) => {
              const ratio = Number(event.target.value) / 1000
              seek(ratio * durationRef.current)
            }}
            className="mm-range mm-scrub"
            aria-label="Timeline scrubber"
          />
        </div>
      </div>
    </section>
  )
}
