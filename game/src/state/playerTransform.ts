import { Vector3 } from 'three'

/**
 * Mutable singleton updated every frame by RobotController and read every
 * frame by the camera and collectibles. Deliberately outside React state —
 * putting a value that changes 60x/second into React state would force a
 * re-render every frame for every subscriber.
 */
export const playerPosition = new Vector3(0, 1, 6)
export const playerFacing = new Vector3(0, 0, -1)
export let playerGrounded = true
export function setPlayerGrounded(value: boolean) {
  playerGrounded = value
}

/** Simple decaying camera-shake amount, poked by impactful events (boost, landing hard). */
export const cameraShake = { amount: 0 }
export function triggerCameraShake(amount: number) {
  cameraShake.amount = Math.max(cameraShake.amount, amount)
}
