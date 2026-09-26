import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useBugStore } from '../state/bugStore'
import { useAudioCues } from '../hooks/useAudioCues'

/**
 * Escalating visual feedback for corruption — cheap CSS/DOM effects (no
 * postprocessing shader pass), scaled by severity:
 *  0–25%  nothing
 *  25–50% occasional brief flicker
 *  50–75% frequent flicker + a subtle animated scanline/noise layer
 *  75–99% heavy, frequent glitching + a pulsing red vignette
 *  100%   crash screen
 *
 * The purely decorative glitch layer and the actually-interactive crash
 * screen are separate siblings, not one aria-hidden div containing both —
 * a screen-reader (or Playwright, which treats aria-hidden the same way a
 * real assistive-tech user would) can't reach a Reboot button nested inside
 * a subtree marked "not real content."
 */
export function GlitchOverlay() {
  const corruption = useBugStore((s) => s.corruption)
  const crashed = useBugStore((s) => s.crashed)
  const reset = useBugStore((s) => s.reset)
  const audio = useAudioCues()
  const [flash, setFlash] = useState(false)
  const timerRef = useRef<number | null>(null)
  const hasCrashedBefore = useRef(false)

  useEffect(() => {
    if (corruption < 25 || crashed) return
    const severity = Math.min(1, (corruption - 25) / 75)
    const minGap = 3000 - severity * 2700 // 3s down to ~300ms between flickers
    let cancelled = false

    function scheduleNext() {
      const jitter = minGap * (0.5 + Math.random())
      timerRef.current = window.setTimeout(() => {
        if (cancelled) return
        setFlash(true)
        audio.playGlitch()
        window.setTimeout(() => setFlash(false), 60 + Math.random() * 80)
        scheduleNext()
      }, jitter)
    }
    scheduleNext()
    return () => {
      cancelled = true
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corruption > 25 ? Math.floor(corruption / 5) : 0, crashed])

  useEffect(() => {
    if (crashed && !hasCrashedBefore.current) {
      hasCrashedBefore.current = true
      audio.playCrash()
    }
    if (!crashed) hasCrashedBefore.current = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crashed])

  const severity = Math.max(0, Math.min(1, (corruption - 25) / 75))

  return (
    <>
      <div style={styles.root} aria-hidden>
        {corruption >= 50 && (
          <div style={{ ...styles.scanlines, opacity: severity * 0.35 }} />
        )}
        {corruption >= 75 && (
          <div style={{ ...styles.vignette, opacity: 0.25 + Math.sin(Date.now() / 260) * 0.1 * severity }} />
        )}
        {flash && (
          <>
            <div style={{ ...styles.rgbFlash, background: 'rgba(255,0,80,0.12)', transform: 'translateX(-3px)' }} />
            <div style={{ ...styles.rgbFlash, background: 'rgba(0,220,255,0.1)', transform: 'translateX(3px)' }} />
          </>
        )}
      </div>

      {crashed && (
        <div style={styles.crashScreen} role="alertdialog" aria-label="System crashed">
          <div style={styles.crashCard}>
            <div style={styles.crashEmoji}>💥😵</div>
            <h2 style={styles.crashTitle}>Oops! System crashed.</h2>
            <p style={styles.crashBody}>
              Too many bugs got through and the whole thing gave up. Nothing real was
              lost — just a quick reboot needed.
            </p>
            <button style={styles.rebootButton} onClick={reset}>
              Reboot
            </button>
          </div>
        </div>
      )}
    </>
  )
}

const styles: Record<string, CSSProperties> = {
  root: { position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50 },
  scanlines: {
    position: 'absolute', inset: 0,
    backgroundImage: 'repeating-linear-gradient(to bottom, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 3px)',
    mixBlendMode: 'overlay',
  },
  vignette: {
    position: 'absolute', inset: 0,
    boxShadow: 'inset 0 0 160px 40px rgba(240,60,60,0.9)',
  },
  rgbFlash: { position: 'absolute', inset: 0 },
  crashScreen: {
    position: 'fixed', inset: 0, pointerEvents: 'auto', zIndex: 60,
    background: 'rgba(10,6,14,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  crashCard: {
    width: 340, background: '#181022', border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 16, padding: '28px 24px', textAlign: 'center',
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', color: '#fff',
  },
  crashEmoji: { fontSize: 40, marginBottom: 8 },
  crashTitle: { margin: '0 0 8px', fontSize: 19 },
  crashBody: { margin: '0 0 18px', fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 },
  rebootButton: {
    padding: '10px 24px', fontSize: 14, fontWeight: 700, borderRadius: 999,
    border: 'none', background: '#4f8cff', color: '#fff', cursor: 'pointer',
  },
}
