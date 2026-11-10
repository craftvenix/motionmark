import type { EaseName, LayerControl } from '../types'

export const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value))

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export const invLerp = (a: number, b: number, value: number) =>
  clamp((value - a) / (b - a))

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

export const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5)

export const backOut = (t: number) => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

export const elasticOut = (t: number) => {
  if (t === 0 || t === 1) return t
  const c4 = (2 * Math.PI) / 3
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

export const linear = (t: number) => t

export const easings: Record<EaseName, (t: number) => number> = {
  easeOutCubic,
  easeInOutCubic,
  backOut,
  elasticOut,
  linear,
}

export function ease(name: EaseName, t: number) {
  return easings[name](clamp(t))
}

/** Eased progress of an animation that begins at `start` and lasts `duration`. */
export function anim(
  t: number,
  start: number,
  duration: number,
  curve: EaseName = 'easeOutCubic',
) {
  return ease(curve, clamp((t - start) / Math.max(0.0001, duration)))
}

/**
 * Warps the global clock for one layer using its speed, delay and easing.
 * Speed > 1 moves the layer through its choreography faster.
 */
export function layerTime(
  t: number,
  control: LayerControl,
  duration: number,
) {
  const warped = (t - control.delay) * control.speed
  return clamp(warped, 0, duration)
}

export const mapRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
) => {
  const p = invLerp(inMin, inMax, value)
  return outMin + (outMax - outMin) * p
}

export function smoothstep(edge0: number, edge1: number, value: number) {
  const x = clamp((value - edge0) / (edge1 - edge0))
  return x * x * (3 - 2 * x)
}
