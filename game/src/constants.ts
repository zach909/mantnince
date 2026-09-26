export const MOVE_SPEED = 5.2
export const ACCEL = 22
export const DECEL = 26
export const GRAVITY = 24
export const JUMP_SPEED = 8.5
export const BOOST_UP_SPEED = 9
export const BOOST_FORWARD_SPEED = 6
export const BOOST_COOLDOWN_MS = 3000
export const FALL_RESET_Y = -12
export const SPAWN_POINT: [number, number, number] = [0, 1, 6]
export const PICKUP_RADIUS = 1.1

// ── Combat / defense layer ────────────────────────────────────────────
export const ATTACK_RADIUS = 1.4
export const ATTACK_COOLDOWN_MS = 350
export const ATTACK_DAMAGE = 1
export const GRUNT_HP = 1
export const GRUNT_SPEED = 1.6
export const GRUNT_INFECT_RADIUS = 1.3
export const GRUNT_INFECT_DAMAGE = 6 // corruption %
export const GRUNT_DEFEAT_RELIEF = 1 // corruption % restored per grunt defeated
export const BOSS_HP = 12
export const BOSS_SPEED = 0.9
export const BOSS_DRAIN_PER_SEC = 1.2 // corruption %/sec while boss is alive
export const BOSS_DEFEAT_RELIEF = 35 // corruption % restored on boss kill
export const BOSS_ROAM_RADIUS = 3.5
export const WAVE_INTERVAL_MS = 20_000 // how often the wave number ticks up
export const BOSS_WAVE_THRESHOLD = 3 // wave at which the first boss appears
export const BASE_SPAWN_INTERVAL_MS = 4200
export const MIN_SPAWN_INTERVAL_MS = 1200
export const MAX_ACTIVE_GRUNTS = 10

/** Authored platform list — single source of truth for both rendering and grounding checks. */
export interface PlatformDef {
  id: string
  position: [number, number, number]
  size: [number, number, number]
  color: string
}

export const PLATFORMS: PlatformDef[] = [
  { id: 'ground', position: [0, -0.5, 0], size: [16, 1, 22], color: '#6fd68a' },
  { id: 'step-1', position: [-2.5, 0.5, -2], size: [3, 1, 3], color: '#8ee6a8' },
  { id: 'step-2', position: [1.5, 1.3, -6], size: [3, 1, 3], color: '#8ee6a8' },
  { id: 'step-3', position: [-1.5, 2.2, -10], size: [3, 1, 3], color: '#8ee6a8' },
  { id: 'high-ledge', position: [-1.5, 4.4, -13.5], size: [3.4, 1, 3], color: '#ffd166' },
]

/** Canonical positions for every OS-subsystem zone — the single source of
 * truth for both Level.tsx's placement and the bug AI's infection targets. */
// All zones sit at z <= SPAWN_POINT.z (6): the camera trails the player at
// +Z, so anything with a *larger* z than the player renders in extreme
// close-up, right in front of the lens, instead of out in the world.
export const ZONE_POSITIONS: Record<string, [number, number, number]> = {
  dedup: [-6, 0, 3],
  earnings: [0, 0, 3],
  cloud: [6, 0, 3],
  ports: [-6, 0, -2],
  terminal: [6, 0, -2],
  vitals: [-6, 0, -6.5],
  kernel: [0, 0, -6.5],
  security: [6, 0, -6.5],
}

export interface CollectibleDef {
  id: string
  label: string
  position: [number, number, number]
  hint: 'onPath' | 'hidden'
}

/** Fixed physical slots for the rescue puzzle (already jump/boost-tuned).
 * The *identity* of what's rescued there is filled in from real device data
 * — see buildCollectibleDefs() below — so the mechanic stays reliable while
 * the content is live. */
const COLLECTIBLE_SLOTS: { position: [number, number, number]; hint: 'onPath' | 'hidden' }[] = [
  { position: [1.5, 2.4, -6], hint: 'onPath' },
  { position: [-1.5, 6.5, -13.5], hint: 'hidden' },
]

/** Rescuing a bot here represents a real registered device coming online —
 * pulled from /api/devices (or its demo equivalent). Padded with a generic
 * bot if there are fewer than two devices, so the puzzle always has exactly
 * as many targets as it was tuned for. */
export function buildCollectibleDefs(deviceNames: string[]): CollectibleDef[] {
  return COLLECTIBLE_SLOTS.map((slot, i) => ({
    id: `device-${i}`,
    label: deviceNames[i] ?? `Spare Bot ${i + 1}`,
    position: slot.position,
    hint: slot.hint,
  }))
}
