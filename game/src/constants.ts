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

/** Authored platform list — single source of truth for both rendering and grounding checks. */
export interface PlatformDef {
  id: string
  position: [number, number, number]
  size: [number, number, number]
  color: string
}

export const PLATFORMS: PlatformDef[] = [
  { id: 'ground', position: [0, -0.5, 0], size: [16, 1, 22], color: '#3a6b52' },
  { id: 'step-1', position: [-2.5, 0.5, -2], size: [3, 1, 3], color: '#5a8f6a' },
  { id: 'step-2', position: [1.5, 1.3, -6], size: [3, 1, 3], color: '#5a8f6a' },
  { id: 'step-3', position: [-1.5, 2.2, -10], size: [3, 1, 3], color: '#5a8f6a' },
  { id: 'high-ledge', position: [-1.5, 4.4, -13.5], size: [3.4, 1, 3], color: '#e0a95c' },
]

export interface CollectibleDef {
  id: string
  label: string
  position: [number, number, number]
  hint: 'onPath' | 'hidden'
}

export const COLLECTIBLES: CollectibleDef[] = [
  { id: 'bit', label: 'Bit', position: [1.5, 2.4, -6], hint: 'onPath' },
  { id: 'byte', label: 'Byte', position: [-1.5, 6.5, -13.5], hint: 'hidden' },
]
