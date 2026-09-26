import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useBugStore } from '../state/bugStore'
import { ZONE_POSITIONS, WAVE_INTERVAL_MS, BOSS_WAVE_THRESHOLD, BASE_SPAWN_INTERVAL_MS, MIN_SPAWN_INTERVAL_MS, MAX_ACTIVE_GRUNTS, BOSS_DRAIN_PER_SEC } from '../constants'

const ZONE_LABELS: Record<string, string> = {
  earnings: 'Earnings Plaza',
  dedup: 'Dedup Reef',
  cloud: 'Cloud Docks',
  ports: 'Port Gate',
  terminal: 'Terminal',
  vitals: 'System Vitals',
  kernel: 'Kernel Core',
  security: 'Security Beacon',
}
const ZONE_KEYS = Object.keys(ZONE_POSITIONS)

let bugCounter = 0

/** No visuals of its own — just the ticking logic that spawns grunts,
 * escalates waves over time, and triggers the boss encounter. Mount once
 * per play session. */
export function WaveDirector() {
  const spawnTimer = useRef(0)
  const waveTimer = useRef(0)

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1)
    const { wave, bugs, crashed, bossActive, nextWave, spawnGrunt, spawnBoss, addCorruption } = useBugStore.getState()
    if (crashed) return

    waveTimer.current += delta * 1000
    if (waveTimer.current >= WAVE_INTERVAL_MS) {
      waveTimer.current = 0
      nextWave()
    }

    if (!bossActive && wave >= BOSS_WAVE_THRESHOLD && wave % BOSS_WAVE_THRESHOLD === 0) {
      const alreadyHasBoss = bugs.some((b) => b.kind === 'boss')
      if (!alreadyHasBoss) {
        spawnBoss(`boss-${bugCounter++}`)
      }
    }
    if (bossActive) {
      addCorruption(BOSS_DRAIN_PER_SEC * delta)
    }

    const gruntCount = bugs.filter((b) => b.kind === 'grunt').length
    spawnTimer.current += delta * 1000
    const spawnInterval = Math.max(MIN_SPAWN_INTERVAL_MS, BASE_SPAWN_INTERVAL_MS - wave * 350)
    if (spawnTimer.current >= spawnInterval && gruntCount < MAX_ACTIVE_GRUNTS) {
      spawnTimer.current = 0
      const zoneKey = ZONE_KEYS[Math.floor(Math.random() * ZONE_KEYS.length)]
      spawnGrunt(`grunt-${bugCounter++}`, zoneKey, ZONE_LABELS[zoneKey] ?? zoneKey)
    }
  })

  return null
}
