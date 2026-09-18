import { useRef } from 'react'

/**
 * Tiny synthesized SFX bank (oscillator + gain envelope) so the slice has
 * audio feedback without needing external sound asset files.
 */
export function useAudioCues() {
  const ctxRef = useRef<AudioContext | null>(null)

  function ctx() {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume()
    return ctxRef.current
  }

  function tone(freq: number, duration: number, type: OscillatorType, gain = 0.15, glideTo?: number) {
    const audio = ctx()
    const osc = audio.createOscillator()
    const g = audio.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, audio.currentTime)
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, audio.currentTime + duration)
    g.gain.setValueAtTime(gain, audio.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration)
    osc.connect(g)
    g.connect(audio.destination)
    osc.start()
    osc.stop(audio.currentTime + duration)
  }

  return {
    playJump: () => tone(440, 0.12, 'square', 0.1, 660),
    playLand: () => tone(120, 0.08, 'sine', 0.12, 60),
    playCollect: () => tone(660, 0.18, 'triangle', 0.14, 990),
    playBoost: () => tone(220, 0.25, 'sawtooth', 0.12, 880),
    playFall: () => tone(200, 0.2, 'sine', 0.1, 90),
  }
}
