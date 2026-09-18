import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { playerPosition } from '../state/playerTransform'
import { useGameStore } from '../state/gameStore'
import { PICKUP_RADIUS, type CollectibleDef } from '../constants'
import { useAudioCues } from '../hooks/useAudioCues'

export function CollectibleBot({ def }: { def: CollectibleDef }) {
  const groupRef = useRef<THREE.Group>(null!)
  const collectedAt = useRef<number | null>(null)
  const alreadyCollected = useGameStore((s) => s.collectedIds.has(def.id))
  const collectBot = useGameStore((s) => s.collectBot)
  const audio = useAudioCues()
  const [visible, setVisible] = useState(true)

  useFrame((state) => {
    if (!groupRef.current || !visible) return
    const t = state.clock.elapsedTime

    if (!alreadyCollected && collectedAt.current === null) {
      const dist = playerPosition.distanceTo(new THREE.Vector3(...def.position))
      if (dist < PICKUP_RADIUS) {
        collectedAt.current = t
        collectBot(def.id, def.label)
        audio.playCollect()
      }
    }

    if (collectedAt.current !== null) {
      const elapsed = t - collectedAt.current
      const spin = elapsed * 10
      const rise = elapsed * 1.4
      const scale = Math.max(0, 1 - elapsed / 0.7)
      groupRef.current.rotation.y = spin
      groupRef.current.position.y = def.position[1] + rise
      groupRef.current.scale.setScalar(scale)
      if (elapsed > 0.7) setVisible(false)
      return
    }

    // Idle bob + slow turn while waiting to be found.
    groupRef.current.position.y = def.position[1] + Math.sin(t * 2.4) * 0.08
    groupRef.current.rotation.y = t * 0.8
  })

  if (!visible) return null

  return (
    <group ref={groupRef} position={def.position}>
      <mesh castShadow>
        <capsuleGeometry args={[0.2, 0.16, 6, 10]} />
        <meshStandardMaterial color="#ff9f43" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.05, 0.19]}>
        <planeGeometry args={[0.2, 0.13]} />
        <meshStandardMaterial color="#fff2d6" emissive="#fff2d6" emissiveIntensity={0.7} />
      </mesh>
      <pointLight color="#ffb454" intensity={0.6} distance={2} />
    </group>
  )
}
