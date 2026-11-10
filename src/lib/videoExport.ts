import type { AnimationMode, Aspect, BrandConfig, ExportFormat } from '../types'
import { renderFrame } from './renderer'
import { renderAnimationSoundtrack, studioAudio } from './audio'

const MP4_TYPES = [
  'video/mp4;codecs=avc1.42E01E',
  'video/mp4;codecs=avc1',
  'video/mp4',
]
const WEBM_TYPES = [
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
]
const MP4_AUDIO_TYPES = [
  'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
  'video/mp4;codecs=avc1,mp4a.40.2',
]
const WEBM_AUDIO_TYPES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
]

export function supportsMime(type: string) {
  if (typeof MediaRecorder === 'undefined') return false
  try {
    return MediaRecorder.isTypeSupported(type)
  } catch {
    return false
  }
}

export function pickMime(format: ExportFormat) {
  const types = format === 'mp4' ? MP4_TYPES : WEBM_TYPES
  return types.find(supportsMime) || ''
}

function pickAudioMime(format: ExportFormat) {
  const types = format === 'mp4' ? MP4_AUDIO_TYPES : WEBM_AUDIO_TYPES
  return types.find(supportsMime) || ''
}

export function formatSupport() {
  return {
    mp4: Boolean(pickMime('mp4')),
    webm: Boolean(pickMime('webm')),
    mediaRecorder: typeof MediaRecorder !== 'undefined',
    audio: Boolean(pickAudioMime('mp4') || pickAudioMime('webm')),
  }
}

interface ExportOptions {
  config: BrandConfig
  mode: AnimationMode
  aspect: Aspect
  duration: number
  format: ExportFormat
  fps?: number
  audio?: boolean
  onProgress?: (progress: number, frame: number, total: number) => void
}

export interface ExportResult {
  blob: Blob
  mime: string
  extension: 'mp4' | 'webm'
  audio: boolean
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}

function chooseRecordingFormat(
  format: ExportFormat,
  withAudio: boolean,
): { mime: string; extension: 'mp4' | 'webm'; audio: boolean } {
  if (withAudio) {
    const requested = pickAudioMime(format)
    if (requested) return { mime: requested, extension: format, audio: true }
    const other: ExportFormat = format === 'mp4' ? 'webm' : 'mp4'
    const fallback = pickAudioMime(other)
    if (fallback) return { mime: fallback, extension: other, audio: true }
  }
  const requested = pickMime(format)
  if (requested) return { mime: requested, extension: format, audio: false }
  const webm = pickMime('webm')
  if (webm) return { mime: webm, extension: 'webm', audio: false }
  return { mime: '', extension: 'webm', audio: false }
}

export async function exportCanvasVideo({
  config,
  mode,
  aspect,
  duration,
  format,
  fps = 60,
  audio = true,
  onProgress,
}: ExportOptions): Promise<ExportResult> {
  if (typeof MediaRecorder === 'undefined') {
    throw new Error('This browser does not support MediaRecorder.')
  }

  const soundtrack = audio
    ? await renderAnimationSoundtrack(mode, config, duration)
    : null

  let audioSource: AudioBufferSourceNode | null = null
  let audioDestination: MediaStreamAudioDestinationNode | null = null
  if (soundtrack) {
    const audioContext = await studioAudio.acquireRunningContext()
    if (audioContext) {
      audioDestination = audioContext.createMediaStreamDestination()
      audioSource = audioContext.createBufferSource()
      audioSource.buffer = soundtrack
      audioSource.connect(audioDestination)
    }
  }

  const recording = chooseRecordingFormat(
    format,
    Boolean(audioSource && audioDestination),
  )
  const mime = recording.mime
  let extension = recording.extension
  let includesAudio = recording.audio
  if (!mime) {
    if (audioSource) {
      try {
        audioSource.disconnect()
      } catch {
        // already disconnected
      }
    }
    if (audioDestination) audioDestination.disconnect()
    throw new Error('No supported video encoder found in this browser.')
  }

  const width = aspect === 'wide' ? 1920 : 1080
  const height = aspect === 'wide' ? 1080 : 1920
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) throw new Error('Could not create the export canvas.')
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, width, height)

  const totalFrames = Math.max(2, Math.ceil(duration * fps))
  renderFrame(ctx, width, height, config, mode, 0)

  let stream: MediaStream
  let manualFrames = false
  try {
    stream = canvas.captureStream(0)
    const track = stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack
    manualFrames = typeof track?.requestFrame === 'function'
    if (!manualFrames) {
      stream.getTracks().forEach((t) => t.stop())
      stream = canvas.captureStream(fps)
    }
  } catch {
    stream = canvas.captureStream(fps)
  }

  if (includesAudio && audioDestination) {
    const audioTrack = audioDestination.stream.getAudioTracks()[0]
    if (audioTrack) stream.addTrack(audioTrack)
    else includesAudio = false
  }

  const track = stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack | undefined
  const chunks: Blob[] = []
  let recorder: MediaRecorder
  let actualMime = mime
  try {
    recorder = new MediaRecorder(stream, {
      mimeType: mime,
      videoBitsPerSecond: 16_000_000,
      audioBitsPerSecond: 192_000,
    })
  } catch {
    // Some browsers reject an audio codec string even though they advertise
    // support. Retry with a video-only mime so the export still completes.
    if (audioSource) {
      try {
        audioSource.disconnect()
      } catch {
        // already disconnected
      }
    }
    if (audioDestination) audioDestination.disconnect()
    stream.getAudioTracks().forEach((item) => {
      stream.removeTrack(item)
      item.stop()
    })
    includesAudio = false
    actualMime = pickMime(format) || pickMime('webm')
    if (!actualMime) {
      stream.getTracks().forEach((t) => t.stop())
      throw new Error('No supported video encoder found in this browser.')
    }
    extension = pickMime(format) ? format : 'webm'
    recorder = new MediaRecorder(stream, {
      mimeType: actualMime,
      videoBitsPerSecond: 16_000_000,
    })
  }

  const stopped = new Promise<Blob>((resolve, reject) => {
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data)
    }
    recorder.onerror = () => reject(new Error('The video encoder failed.'))
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: actualMime })
      resolve(blob)
    }
  })

  recorder.start(200)
  if (includesAudio && audioSource) {
    try {
      audioSource.start()
    } catch {
      includesAudio = false
    }
  }

  const startedAt = performance.now()
  onProgress?.(0, 0, totalFrames)

  try {
    for (let frame = 0; frame < totalFrames; frame++) {
      const target = startedAt + (frame * 1000) / fps
      const wait = target - performance.now()
      if (wait > 0) await sleep(wait)
      const time = Math.min(duration, frame / fps)
      renderFrame(ctx, canvas.width, canvas.height, config, mode, time)
      if (manualFrames) track?.requestFrame()
      const progress = ((frame + 1) / totalFrames) * 100
      onProgress?.(progress, frame + 1, totalFrames)
    }
    // Hold on the end frame briefly so the recorder flushes it cleanly.
    await sleep(220)
    if (recorder.state !== 'inactive') recorder.stop()
    // Wait for onstop before ending the stream so the encoder can flush the
    // final chunk. Stopping the capture track first yields an empty blob.
    const blob = await stopped
    if (!blob.size) throw new Error('The encoder produced an empty video.')
    return { blob, mime, extension, audio: includesAudio }
  } finally {
    if (recorder.state !== 'inactive') recorder.stop()
    if (audioSource) {
      try {
        audioSource.stop()
      } catch {
        // already stopped
      }
      try {
        audioSource.disconnect()
      } catch {
        // already disconnected
      }
    }
    if (audioDestination) {
      audioDestination.stream.getTracks().forEach((item) => item.stop())
      audioDestination.disconnect()
    }
    stream.getTracks().forEach((t) => t.stop())
  }
}
