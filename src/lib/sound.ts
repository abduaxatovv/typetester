/**
 * Tiny offline sound effects synthesized with the Web Audio API.
 * No audio files, no network — completely self-contained.
 */

let context: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!context) context = new Ctor()
  return context
}

function blip(frequency: number, duration: number, gain: number): void {
  const ctx = getContext()
  if (!ctx) return
  if (ctx.state === 'suspended') void ctx.resume()
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = frequency
  g.gain.setValueAtTime(gain, ctx.currentTime)
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)
  osc.connect(g)
  g.connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + duration)
}

export function playKeypressSound(): void {
  blip(720, 0.04, 0.02)
}

export function playErrorSound(): void {
  blip(180, 0.1, 0.045)
}

export function playCompleteSound(): void {
  blip(523.25, 0.12, 0.05)
  setTimeout(() => blip(783.99, 0.18, 0.05), 110)
}

export function unlockAudio(): void {
  const ctx = getContext()
  if (ctx?.state === 'suspended') void ctx.resume()
}