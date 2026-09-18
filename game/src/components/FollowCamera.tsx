import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { playerPosition, cameraShake } from '../state/playerTransform'

const OFFSET = new THREE.Vector3(0, 3.4, 7.5)
const LOOK_LEAD = new THREE.Vector3(0, 1, 0)

/**
 * Fixed-yaw chase camera: it always trails the player from the same world-
 * space direction rather than orbiting behind their facing. Simpler and more
 * predictable than a full third-person orbit rig — a deliberate scope cut
 * for this slice (see game/README.md).
 */
export function FollowCamera() {
  const { camera } = useThree()
  const desired = useRef(new THREE.Vector3())
  const lookAt = useRef(new THREE.Vector3())

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1)
    desired.current.copy(playerPosition).add(OFFSET)
    camera.position.lerp(desired.current, 1 - Math.exp(-6 * delta))

    if (cameraShake.amount > 0) {
      camera.position.x += (Math.random() - 0.5) * cameraShake.amount
      camera.position.y += (Math.random() - 0.5) * cameraShake.amount
      cameraShake.amount = Math.max(0, cameraShake.amount - delta * 1.8)
    }

    lookAt.current.copy(playerPosition).add(LOOK_LEAD)
    camera.lookAt(lookAt.current)
  })

  return null
}
