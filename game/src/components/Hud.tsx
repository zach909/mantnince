import { useEffect, useState, type CSSProperties } from 'react'
import { useGameStore } from '../state/gameStore'
import { useBugStore } from '../state/bugStore'

export function Hud() {
  const collectedIds = useGameStore((s) => s.collectedIds)
  const total = useGameStore((s) => s.totalCollectibles)
  const toast = useGameStore((s) => s.toast)
  const gadgetReadyAt = useGameStore((s) => s.gadgetReadyAt)
  const corruption = useBugStore((s) => s.corruption)
  const wave = useBugStore((s) => s.wave)
  const bugs = useBugStore((s) => s.bugs)
  const [now, setNow] = useState(() => performance.now())

  useEffect(() => {
    let raf: number
    const tick = () => { setNow(performance.now()); raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const cooldownRemaining = Math.max(0, gadgetReadyAt - now)
  const gadgetReady = cooldownRemaining <= 0
  const integrity = Math.round(100 - corruption)
  const integrityColor = integrity > 60 ? '#8fe3b0' : integrity > 30 ? '#ffd166' : '#f0a2a2'
  const boss = bugs.find((b) => b.kind === 'boss')

  return (
    <div style={styles.root}>
      <div style={styles.topBar}>
        <div style={styles.pill}>
          🤖 {collectedIds.size}/{total} rescued
        </div>
        <div style={styles.pill}>Wave {wave}</div>
        <div style={{ ...styles.pill, opacity: gadgetReady ? 1 : 0.6 }}>
          Optimizer: {gadgetReady ? 'Ready' : `${(cooldownRemaining / 1000).toFixed(1)}s`}
        </div>
      </div>

      <div style={styles.integrityWrap}>
        <div style={styles.integrityLabel}>
          <span>System Integrity</span>
          <span>{integrity}%</span>
        </div>
        <div style={styles.integrityTrack}>
          <div style={{ ...styles.integrityFill, width: `${integrity}%`, background: integrityColor }} />
        </div>
      </div>

      {boss && (
        <div style={styles.bossWrap}>
          <div style={styles.integrityLabel}>
            <span>⚠ Kernel Corruptor</span>
            <span>{boss.hp}/{boss.maxHp}</span>
          </div>
          <div style={styles.integrityTrack}>
            <div style={{ ...styles.integrityFill, width: `${(boss.hp / boss.maxHp) * 100}%`, background: '#c084fc' }} />
          </div>
        </div>
      )}

      {toast && <div style={styles.toast}>{toast}</div>}

      <div style={styles.hint}>WASD/Arrows — move · Space — jump · F — attack bugs · Shift/E — optimizer thruster</div>

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
    display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap',
  },
  pill: {
    background: 'rgba(10,10,18,0.55)', backdropFilter: 'blur(6px)',
    border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999,
    padding: '8px 14px', fontSize: 13, fontWeight: 600,
  },
  integrityWrap: {
    position: 'absolute', top: 60, left: 16, width: 200,
    background: 'rgba(10,10,18,0.55)', borderRadius: 10, padding: '8px 10px',
    border: '1px solid rgba(255,255,255,0.12)',
  },
  bossWrap: {
    position: 'absolute', top: 60, right: 16, width: 200,
    background: 'rgba(30,10,40,0.6)', borderRadius: 10, padding: '8px 10px',
    border: '1px solid rgba(192,132,252,0.35)',
  },
  integrityLabel: {
    display: 'flex', justifyContent: 'space-between', fontSize: 10.5,
    color: 'rgba(255,255,255,0.75)', marginBottom: 4, fontWeight: 600,
  },
  integrityTrack: { height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' },
  integrityFill: { height: '100%', transition: 'width 200ms linear' },
  toast: {
    position: 'absolute', top: 108, left: '50%', transform: 'translateX(-50%)',
    background: 'rgba(10,10,18,0.7)', border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600,
  },
  hint: {
    position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
    fontSize: 11, color: 'rgba(255,255,255,0.55)', textAlign: 'center',
  },
  complete: {
    position: 'absolute', bottom: 44, left: '50%', transform: 'translateX(-50%)',
    fontSize: 15, fontWeight: 700, color: '#ffe27a',
  },
}
