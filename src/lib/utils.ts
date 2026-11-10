import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatTimecode = (seconds: number, fps = 60) => {
  const safe = Math.max(0, seconds)
  const mins = Math.floor(safe / 60)
  const secs = Math.floor(safe % 60)
  const frames = Math.min(59, Math.floor((safe % 1) * fps))
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(
    2,
    '0',
  )}:${String(frames).padStart(2, '0')}`
}

export const formatShortTime = (seconds: number) =>
  `${seconds.toFixed(seconds < 10 ? 1 : 0)}s`

export function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'motionmark'
  )
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 3000)
}
