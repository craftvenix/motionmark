import type { AnimationMode, BrandConfig, StyleId } from '../types'
import {
  SHOWREEL_END_DURATION,
  SHOWREEL_STYLE_DURATION,
} from './presets'
import { getReelTimeline } from './reel'

export type SoundCueKind =
  | 'shimmer'
  | 'sparkle'
  | 'chime'
  | 'tick'
  | 'thump'
  | 'whoosh'
  | 'swell'

export interface SoundCue {
  time: number
  kind: SoundCueKind
  gain?: number
  pitch?: number
}

const STYLE_END = 4.1

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

/**
 * Build the score for a timeline. The cues are intentionally sparse: a low
 * bed carries the scene and short synthesized accents mark the typography,
 * wipes and page turns.
 */
export function buildSoundCues(
  mode: AnimationMode,
  config: BrandConfig,
  duration: number,
): SoundCue[] {
  const cues: SoundCue[] = []

  if (mode === 'showreel') {
    const styleCount = 5
    for (let i = 0; i < styleCount; i++) {
      const cut = i * SHOWREEL_STYLE_DURATION
      if (i === 0) {
        cues.push({ time: 0.02, kind: 'thump', gain: 0.8 })
      } else {
        cues.push({ time: cut - 0.44, kind: 'whoosh', gain: 0.7 })
        cues.push({ time: cut + 0.01, kind: 'tick', gain: 0.55 })
      }
      cues.push({
        time: cut + 0.24 + i * 0.02,
        kind: i % 2 === 0 ? 'sparkle' : 'shimmer',
        gain: 0.62,
        pitch: 1 + i * 0.035,
      })
    }
    const content = styleCount * SHOWREEL_STYLE_DURATION
    cues.push({ time: content - 0.02, kind: 'whoosh', gain: 0.8 })
    cues.push({ time: content + 0.04, kind: 'chime', gain: 0.9 })
    cues.push({ time: content + 0.62, kind: 'sparkle', gain: 0.55, pitch: 1.06 })
    cues.push({
      time: content + SHOWREEL_END_DURATION - 0.5,
      kind: 'tick',
      gain: 0.4,
    })
    return filterCues(cues, duration)
  }

  if (mode === 'brandreel') {
    const timeline = getReelTimeline(config)
    if (!timeline.entries.length) return []
    const scale =
      timeline.total > timeline.playback ? timeline.total / timeline.playback : 1
    const at = (base: number) => base / scale

    timeline.entries.forEach((entry, entryIndex) => {
      const start = at(entry.start)
      const span = at(entry.duration)
      cues.push({
        time: Math.max(0.02, start + 0.015),
        kind: entryIndex === 0 ? 'thump' : 'whoosh',
        gain: entryIndex === 0 ? 0.8 : 0.68,
      })

      switch (entry.id) {
        case 'wordmark':
          cues.push({ time: start + 0.12, kind: 'sparkle', gain: 0.54 })
          cues.push({ time: start + Math.min(0.62, span * 0.4), kind: 'tick', gain: 0.36 })
          break
        case 'trace':
          cues.push({ time: start + 0.2, kind: 'tick', gain: 0.42 })
          cues.push({ time: start + Math.min(0.7, span * 0.45), kind: 'shimmer', gain: 0.52 })
          break
        case 'grid':
          for (let i = 0; i < 3; i++) {
            cues.push({
              time: start + 0.16 + i * 0.16,
              kind: 'tick',
              gain: 0.32,
              pitch: 1 + i * 0.06,
            })
          }
          break
        case 'phone':
        case 'browser':
          cues.push({ time: start + 0.2, kind: 'tick', gain: 0.4 })
          cues.push({ time: start + Math.min(0.85, span * 0.55), kind: 'sparkle', gain: 0.4 })
          break
        case 'palette':
          for (let i = 0; i < 4; i++) {
            cues.push({
              time: start + 0.14 + i * 0.19,
              kind: 'tick',
              gain: 0.3,
              pitch: 0.94 + i * 0.05,
            })
          }
          break
        case 'merch': {
          cues.push({ time: start + span * 0.33, kind: 'whoosh', gain: 0.42 })
          cues.push({ time: start + span * 0.66, kind: 'whoosh', gain: 0.42 })
          cues.push({ time: start + span * 0.34, kind: 'tick', gain: 0.34 })
          cues.push({ time: start + span * 0.67, kind: 'tick', gain: 0.34 })
          break
        }
        case 'lockup':
          cues.push({ time: start + 0.18, kind: 'chime', gain: 0.85 })
          cues.push({ time: start + Math.min(0.85, span * 0.55), kind: 'sparkle', gain: 0.56 })
          break
      }
    })

    cues.push({
      time: Math.max(0.4, timeline.playback - 0.32),
      kind: 'sparkle',
      gain: 0.42,
      pitch: 1.04,
    })
    return filterCues(cues, duration)
  }

  const style = mode as StyleId
  const logoDelay = clamp(config.layers.logo.delay, 0, 0.8)
  const textDelay = clamp(config.layers.text.delay, 0, 0.8)
  const backgroundDelay = clamp(config.layers.background.delay, 0, 0.8)

  cues.push({
    time: 0.02 + backgroundDelay * 0.3,
    kind: style === 'pulse' || style === 'lockup' ? 'thump' : 'whoosh',
    gain: 0.72,
  })
  cues.push({
    time: 0.12 + logoDelay,
    kind: 'shimmer',
    gain: 0.64,
    pitch: style === 'pattern' ? 1.05 : 1,
  })
  cues.push({
    time: 0.3 + textDelay,
    kind: 'tick',
    gain: 0.42,
  })

  if (style === 'blueprint') {
    cues.push({ time: 0.18, kind: 'tick', gain: 0.32, pitch: 1.12 })
    cues.push({ time: 0.34, kind: 'tick', gain: 0.3, pitch: 1.2 })
  }
  if (style === 'pattern') {
    cues.push({ time: 0.4, kind: 'sparkle', gain: 0.4, pitch: 0.96 })
    cues.push({ time: 0.66, kind: 'tick', gain: 0.28, pitch: 1.18 })
    cues.push({ time: 0.82, kind: 'tick', gain: 0.24, pitch: 1.26 })
  }
  if (style === 'pulse') {
    cues.push({ time: 0.42, kind: 'thump', gain: 0.32 })
  }
  if (style === 'lockup') {
    cues.push({ time: 0.34, kind: 'whoosh', gain: 0.4 })
  }

  cues.push({ time: STYLE_END - 0.03, kind: 'whoosh', gain: 0.8 })
  cues.push({ time: STYLE_END + 0.04, kind: 'chime', gain: 0.88 })
  cues.push({ time: STYLE_END + 0.56, kind: 'sparkle', gain: 0.52, pitch: 1.04 })
  return filterCues(cues, duration)
}

function filterCues(cues: SoundCue[], duration: number) {
  return cues
    .filter((cue) => cue.time > 0 && cue.time < duration + 0.001)
    .sort((a, b) => a.time - b.time)
}

const BED_NOTES: Record<AnimationMode, number[]> = {
  reveal: [110, 164.81, 220],
  blueprint: [98, 146.83, 196],
  pulse: [73.42, 110, 146.83],
  lockup: [130.81, 196, 261.63],
  pattern: [87.31, 130.81, 174.61],
  showreel: [110, 164.81, 246.94],
  brandreel: [98, 146.83, 220],
}

interface AudioGraph {
  ctx: BaseAudioContext
  destination: AudioNode
  noise: AudioBuffer | null
}

function createNoiseBuffer(ctx: BaseAudioContext) {
  const length = Math.floor(ctx.sampleRate * 2.5)
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1
  }
  return buffer
}

function scheduleTone(
  graph: AudioGraph,
  frequency: number,
  when: number,
  duration: number,
  peak: number,
  type: OscillatorType,
  endFrequency?: number,
) {
  const { ctx, destination } = graph
  const oscillator = ctx.createOscillator()
  const envelope = ctx.createGain()
  oscillator.type = type
  oscillator.frequency.setValueAtTime(Math.max(20, frequency), when)
  if (endFrequency) {
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(20, endFrequency),
      when + duration * 0.86,
    )
  }
  const attack = Math.min(0.06, duration * 0.22)
  envelope.gain.setValueAtTime(0.0001, when)
  envelope.gain.exponentialRampToValueAtTime(
    Math.max(0.0002, peak),
    when + attack,
  )
  envelope.gain.exponentialRampToValueAtTime(0.0001, when + duration)
  oscillator.connect(envelope)
  envelope.connect(destination)
  oscillator.start(when)
  oscillator.stop(when + duration + 0.03)
}

function scheduleNoiseBurst(
  graph: AudioGraph,
  when: number,
  duration: number,
  peak: number,
  type: BiquadFilterType,
  startFrequency: number,
  endFrequency: number,
  q: number,
  attack: number,
) {
  const { ctx, destination, noise } = graph
  if (!noise) return
  const source = ctx.createBufferSource()
  source.buffer = noise
  const filter = ctx.createBiquadFilter()
  filter.type = type
  filter.Q.value = q
  filter.frequency.setValueAtTime(Math.max(20, startFrequency), when)
  filter.frequency.exponentialRampToValueAtTime(
    Math.max(20, endFrequency),
    when + duration * 0.9,
  )
  const envelope = ctx.createGain()
  envelope.gain.setValueAtTime(0.0001, when)
  envelope.gain.exponentialRampToValueAtTime(
    Math.max(0.0002, peak),
    when + Math.max(0.005, attack),
  )
  envelope.gain.exponentialRampToValueAtTime(0.0001, when + duration)
  source.connect(filter)
  filter.connect(envelope)
  envelope.connect(destination)
  const offset = Math.random() * 1.2
  source.start(when, offset, duration + 0.05)
  source.stop(when + duration + 0.06)
}

function scheduleCue(
  graph: AudioGraph,
  kind: SoundCueKind,
  when: number,
  gain: number,
  pitch: number,
) {
  const level = Math.max(0, gain)
  switch (kind) {
    case 'shimmer': {
      const partials = [880, 1174.66, 1568, 2093]
      partials.forEach((frequency, index) => {
        scheduleTone(
          graph,
          frequency * pitch,
          when + index * 0.022,
          0.9 + index * 0.08,
          0.026 * level,
          index % 2 === 0 ? 'sine' : 'triangle',
        )
      })
      break
    }
    case 'sparkle': {
      const partials = [1760, 2093, 2637, 3136]
      partials.forEach((frequency, index) => {
        scheduleTone(
          graph,
          frequency * pitch,
          when + index * 0.036,
          0.3 + index * 0.02,
          0.018 * level,
          'sine',
        )
      })
      break
    }
    case 'chime': {
      const partials = [523.25, 659.25, 783.99, 1046.5]
      partials.forEach((frequency, index) => {
        scheduleTone(
          graph,
          frequency * pitch,
          when + index * 0.026,
          1.5,
          0.042 * level,
          index === 0 ? 'triangle' : 'sine',
        )
      })
      break
    }
    case 'tick': {
      scheduleNoiseBurst(graph, when, 0.055, 0.03 * level, 'highpass', 2400, 2200, 0.7, 0.006)
      scheduleTone(graph, 1900 * pitch, when, 0.06, 0.014 * level, 'sine')
      break
    }
    case 'thump': {
      scheduleTone(graph, 110 * pitch, when, 0.42, 0.1 * level, 'sine', 44 * pitch)
      scheduleNoiseBurst(graph, when, 0.12, 0.04 * level, 'lowpass', 420, 120, 0.8, 0.01)
      break
    }
    case 'whoosh': {
      scheduleNoiseBurst(graph, when, 0.46, 0.07 * level, 'bandpass', 280, 3300, 0.9, 0.14)
      scheduleTone(graph, 92 * pitch, when, 0.3, 0.026 * level, 'sine', 48 * pitch)
      break
    }
    case 'swell': {
      scheduleNoiseBurst(graph, when, 0.88, 0.055 * level, 'bandpass', 180, 2400, 1.3, 0.6)
      scheduleTone(graph, 220 * pitch, when + 0.52, 1.15, 0.03 * level, 'sine')
      break
    }
  }
}

function scheduleBed(
  graph: AudioGraph,
  mode: AnimationMode,
  when: number,
  peak: number,
  fadeIn: number,
  fadeOutAt?: number,
  fadeOut = 0.7,
) {
  const { ctx, destination } = graph
  const bed = ctx.createGain()
  bed.gain.setValueAtTime(0.0001, when)
  bed.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), when + fadeIn)
  if (fadeOutAt !== undefined && fadeOutAt > when + fadeIn) {
    bed.gain.setValueAtTime(Math.max(0.0002, peak), fadeOutAt - fadeOut)
    bed.gain.exponentialRampToValueAtTime(0.0001, fadeOutAt)
  }

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 820
  filter.Q.value = 0.35
  filter.connect(bed)
  bed.connect(destination)

  const notes = BED_NOTES[mode] ?? BED_NOTES.reveal
  const oscillators: OscillatorNode[] = []
  notes.forEach((frequency, index) => {
    const oscillator = ctx.createOscillator()
    oscillator.type = index === 0 ? 'triangle' : 'sine'
    oscillator.frequency.value = frequency
    const level = ctx.createGain()
    level.gain.value = index === 0 ? 0.72 : 0.4
    oscillator.connect(level)
    level.connect(filter)
    oscillator.start(when)
    if (fadeOutAt !== undefined) {
      oscillator.stop(fadeOutAt + 0.06)
    }
    oscillators.push(oscillator)
  })

  const lfo = ctx.createOscillator()
  lfo.type = 'sine'
  lfo.frequency.value = 0.075 + notes.length * 0.011
  const lfoDepth = ctx.createGain()
  lfoDepth.gain.value = 0.017
  lfo.connect(lfoDepth)
  lfoDepth.connect(bed.gain)
  lfo.start(when)
  if (fadeOutAt !== undefined) {
    lfo.stop(fadeOutAt + 0.06)
  }

  return { bed, oscillators, lfo }
}

/**
 * Render the full preview score into an AudioBuffer for video export.
 * Returns null when offline rendering is unavailable or fails.
 */
export async function renderAnimationSoundtrack(
  mode: AnimationMode,
  config: BrandConfig,
  duration: number,
  sampleRate = 48000,
): Promise<AudioBuffer | null> {
  if (typeof OfflineAudioContext === 'undefined') return null
  const safeDuration = Math.max(0.5, duration)
  const tail = 0.7
  const total = safeDuration + tail
  try {
    const ctx = new OfflineAudioContext(
      2,
      Math.ceil(total * sampleRate),
      sampleRate,
    )
    const master = ctx.createGain()
    master.gain.value = 0.85
    master.connect(ctx.destination)
    const graph: AudioGraph = {
      ctx,
      destination: master,
      noise: createNoiseBuffer(ctx),
    }

    scheduleBed(graph, mode, 0, 0.055, 1.2, safeDuration, 0.7)
    buildSoundCues(mode, config, safeDuration).forEach((cue) => {
      scheduleCue(graph, cue.kind, cue.time, cue.gain ?? 1, cue.pitch ?? 1)
    })

    return await ctx.startRendering()
  } catch {
    return null
  }
}

class StudioAudio {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private noise: AudioBuffer | null = null
  private bedGain: GainNode | null = null
  private bedOscillators: OscillatorNode[] = []
  private bedLfo: OscillatorNode | null = null
  private bedMode: AnimationMode | null = null
  private enabled = true

  private ensure() {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const Ctor = window.AudioContext
      if (!Ctor) return null
      const ctx = new Ctor()
      this.ctx = ctx
      const master = ctx.createGain()
      master.gain.value = 0.85
      master.connect(ctx.destination)
      this.master = master
      this.noise = createNoiseBuffer(ctx)
    }
    return this.ctx
  }

  private graph(): AudioGraph | null {
    if (!this.ctx || !this.master) return null
    return {
      ctx: this.ctx,
      destination: this.master,
      noise: this.noise,
    }
  }

  unlock() {
    const ctx = this.ensure()
    if (!ctx) return
    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => undefined)
    }
  }

  /**
   * Resolve a running AudioContext for the export mixer. Reusing the studio
   * context avoids autoplay restrictions and keeps monitoring silent because
   * the export graph is routed to a MediaStream destination only.
   */
  async acquireRunningContext() {
    const ctx = this.ensure()
    if (!ctx) return null
    if (ctx.state === 'suspended') {
      try {
        await Promise.race([
          ctx.resume(),
          new Promise<void>((resolve) => {
            window.setTimeout(resolve, 500)
          }),
        ])
      } catch {
        return null
      }
    }
    return ctx.state === 'running' ? ctx : null
  }

  setEnabled(value: boolean) {
    this.enabled = value
    if (!value) this.stopBed(0.24)
  }

  isEnabled() {
    return this.enabled
  }

  startBed(mode: AnimationMode) {
    if (!this.enabled) return
    const ctx = this.ensure()
    const graph = this.graph()
    if (!ctx || !graph) return
    if (this.bedMode === mode && this.bedGain) return
    this.stopBed(0.08)

    const { bed, oscillators, lfo } = scheduleBed(
      graph,
      mode,
      ctx.currentTime,
      0.055,
      1.2,
    )
    this.bedGain = bed
    this.bedOscillators = oscillators
    this.bedLfo = lfo
    this.bedMode = mode
  }

  stopBed(fade = 0.28) {
    const ctx = this.ctx
    const bed = this.bedGain
    if (!ctx || !bed) {
      this.bedGain = null
      this.bedOscillators = []
      this.bedLfo = null
      this.bedMode = null
      return
    }
    const now = ctx.currentTime
    const current = Math.max(0.0002, bed.gain.value)
    bed.gain.cancelScheduledValues(now)
    bed.gain.setValueAtTime(current, now)
    bed.gain.exponentialRampToValueAtTime(0.0001, now + fade)
    const oscillators = this.bedOscillators
    const lfo = this.bedLfo
    window.setTimeout(() => {
      oscillators.forEach((oscillator) => {
        try {
          oscillator.stop()
        } catch {
          // already stopped
        }
      })
      if (lfo) {
        try {
          lfo.stop()
        } catch {
          // already stopped
        }
      }
      try {
        bed.disconnect()
      } catch {
        // already disconnected
      }
    }, (fade + 0.1) * 1000)

    this.bedGain = null
    this.bedOscillators = []
    this.bedLfo = null
    this.bedMode = null
  }

  playRange(from: number, to: number, cues: SoundCue[]) {
    if (!this.enabled || from >= to) return
    const ctx = this.ctx
    if (!ctx || ctx.state !== 'running') return
    for (const cue of cues) {
      if (cue.time > from && cue.time <= to) {
        const offset = Math.min(0.06, Math.max(0, cue.time - from))
        this.fire(cue.kind, ctx.currentTime + offset, cue.gain ?? 1, cue.pitch ?? 1)
      }
    }
  }

  private fire(kind: SoundCueKind, when: number, gain: number, pitch: number) {
    const graph = this.graph()
    if (!graph) return
    scheduleCue(graph, kind, when, gain, pitch)
  }
}

export const studioAudio = new StudioAudio()
