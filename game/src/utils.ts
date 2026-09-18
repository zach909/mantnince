import { PLATFORMS } from './constants'

/** Shortest-path angle interpolation (handles the -PI/PI wraparound). */
export function lerpAngle(from: number, to: number, t: number): number {
  let diff = (to - from) % (Math.PI * 2)
  if (diff > Math.PI) diff -= Math.PI * 2
  if (diff < -Math.PI) diff += Math.PI * 2
  return from + diff * t
}

/**
 * Highest authored platform surface at (x, z) whose top is at or below
 * `feetY + tolerance` — i.e. "the step you're standing on or falling onto,"
 * not a lower platform that merely shares the same footprint.
 */
export function groundHeightAt(x: number, z: number, feetY: number, tolerance = 0.4): number | null {
  let best: number | null = null
  for (const p of PLATFORMS) {
    const halfX = p.size[0] / 2
    const halfZ = p.size[2] / 2
    const minX = p.position[0] - halfX
    const maxX = p.position[0] + halfX
    const minZ = p.position[2] - halfZ
    const maxZ = p.position[2] + halfZ
    if (x < minX || x > maxX || z < minZ || z > maxZ) continue
    const top = p.position[1] + p.size[1] / 2
    if (top <= feetY + tolerance && (best === null || top > best)) best = top
  }
  return best
}
