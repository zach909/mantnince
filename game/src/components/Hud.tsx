import { useEffect, useState, type CSSProperties } from 'react'
import { useGameStore } from '../state/gameStore'

export function Hud() {
  const collectedIds = useGameStore((s) => s.collectedIds)
  const total = useGameStore((s) => s.totalCollectibles)
  const toast = useGameStore((s) => s.toast)
  const gadgetReadyAt = useGameStore((s) => s.gadgetReadyAt)
  const [now, setNow] = useState(() => performance.now())

  useEffect(() => {
    let raf: number
    const tick = () => { setNow(performance.now()); raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const cooldownRemaining = Math.max(0, gadgetReadyAt - now)
  const gadgetReady = cooldownRemaining <= 0

  return (
    <div style={styles.root}>
      <div style={styles.topBar}>
        <div style={styles.pill}>
          🤖 {collectedIds.size}/{total} rescued
        </div>
        <div style={{ ...styles.pill, opacity: gadgetReady ? 1 : 0.6 }}>
          Optimizer: {gadgetReady ? 'Ready' : `${(cooldownRemaining / 1000).toFixed(1)}s`}
        </div>
      </div>

      {toast && <div style={styles.toast}>{toast}</div>}

      <div style={styles.hint}>WASD / Arrows — move · Space — jump · Shift / E — optimizer thruster</div>

      {collectedIds.size === total && (
        <div style={styles.complete}>All bots rescued! 🎉</div>
      )}
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  root: {
    position: 'fixed', inset: 0, pointerEvents: 'none',
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', color: '#fff',
  },
  topBar: {
    position: 'absolute', top: 16, left: 16, right: 16,
    display: 'flex', justifyContent: 'space-between', gap: 8,
  },
  pill: {
    background: 'rgba(10,10,18,0.55)', backdropFilter: 'blur(6px)',
    border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999,
    padding: '8px 14px', fontSize: 13, fontWeight: 600,
  },
  toast: {
    position: 'absolute', top: 64, left: '50%', transform: 'translateX(-50%)',
    background: 'rgba(10,10,18,0.7)', border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600,
  },
  hint: {
    position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
    fontSize: 11, color: 'rgba(255,255,255,0.55)',
  },
  complete: {
    position: 'absolute', bottom: 44, left: '50%', transform: 'translateX(-50%)',
    fontSize: 15, fontWeight: 700, color: '#ffe27a',
  },
}
