/**
 * Completion chime synthesized with the Web Audio API — no audio files.
 * Plays a short three-note ascending arpeggio (E5 -> G5 -> B5).
 */

let audioContext: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  if (!Ctor) return null
  if (!audioContext) audioContext = new Ctor()
  if (audioContext.state === 'suspended') {
    void audioContext.resume()
  }
  return audioContext
}

export function playChime(): void {
  const ctx = getContext()
  if (!ctx) return

  const notes = [659.25, 783.99, 987.77] // E5, G5, B5
  const now = ctx.currentTime

  notes.forEach((frequency, index) => {
    const startAt = now + index * 0.16
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0, startAt)
    gain.gain.linearRampToValueAtTime(0.22, startAt + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.55)
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.start(startAt)
    oscillator.stop(startAt + 0.6)
  })
}
