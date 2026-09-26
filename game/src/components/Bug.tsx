import { useEffect, useLayoutEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { bugRegistry } from '../state/bugRegistry'
import { useBugStore, type BugSpec } from '../state/bugStore'
import { ZONE_POSITIONS, GRUNT_SPEED, GRUNT_INFECT_RADIUS, GRUNT_INFECT_DAMAGE, BOSS_SPEED, BOSS_ROAM_RADIUS } from '../constants'

const SPAWN_RING_RADIUS = 12

export function spawnEdgePosition(): THREE.Vector3 {
  const angle = Math.random() * Math.PI * 2
  return new THREE.Vector3(Math.cos(angle) * SPAWN_RING_RADIUS, 0, Math.sin(angle) * SPAWN_RING_RADIUS * 0.6 - 2)
}

/** A small spiky "bug" — friendly-cartoonish, not scary. Grunts beeline for
 * a zone kiosk and infect it (raising corruption) if they arrive unkilled;
 * the boss just roams near Kernel Core, slowly draining integrity while
 * alive, until the player fights it down. */
export function Bug({ spec, spawnAt }: { spec: BugSpec; spawnAt: THREE.Vector3 }) {
  const groupRef = useRef<THREE.Group>(null!)
  const bodyRef = useRef<THREE.Mesh>(null!)
  const pos = useRef(spawnAt.clone())
  const roamAngle = useRef(Math.random() * Math.PI * 2)
  const hurtUntil = useRef(0)
  const hurtFlag = useRef(false)
  const infected = useRef(false)

  useEffect(() => {
    bugRegistry.set(spec.id, { position: pos.current, kind: spec.kind })
    return () => {
      bugRegistry.delete(spec.id)
    }
  }, [spec.id, spec.kind])

  const target = ZONE_POSITIONS[spec.zoneKey] ?? ZONE_POSITIONS.kernel

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1)
    const t = state.clock.elapsedTime

    if (spec.kind === 'grunt' && !infected.current) {
      const dir = new THREE.Vector3(target[0] - pos.current.x, 0, target[2] - pos.current.z)
      const dist = dir.length()
      if (dist < GRUNT_INFECT_RADIUS) {
        infected.current = true
        useBugStore.getState().infectZone(spec.id, spec.zoneLabel, GRUNT_INFECT_DAMAGE)
        return
      }
      dir.normalize()
      pos.current.x += dir.x * GRUNT_SPEED * delta
      pos.current.z += dir.z * GRUNT_SPEED * delta
    } else if (spec.kind === 'boss') {
      roamAngle.current += (BOSS_SPEED / BOSS_ROAM_RADIUS) * delta
      const kernel = ZONE_POSITIONS.kernel
      pos.current.x = kernel[0] + Math.cos(roamAngle.current) * BOSS_ROAM_RADIUS
      pos.current.z = kernel[2] + Math.sin(roamAngle.current) * BOSS_ROAM_RADIUS
    }

    groupRef.current.position.x = pos.current.x
    groupRef.current.position.z = pos.current.z
    groupRef.current.position.y = Math.sin(t * 6 + pos.current.x) * 0.06
    groupRef.current.rotation.y = t * (spec.kind === 'boss' ? 0.8 : 2.2)

    if (hurtFlag.current) {
      hurtUntil.current = t + 0.12
      hurtFlag.current = false
    }
    const hurt = t < hurtUntil.current
    const scale = spec.kind === 'boss' ? 1.8 : 1
    const flash = hurt ? 1.4 : 1
    if (bodyRef.current) bodyRef.current.scale.setScalar(scale * flash)
  })

  // Attacks land through useBugStore (called from RobotController); when hp
  // drops, flash briefly to sell the hit without needing its own event bus.
  const prevHp = useRef(spec.hp)
  useLayoutEffect(() => {
    if (spec.hp < prevHp.current) hurtFlag.current = true
    prevHp.current = spec.hp
  }, [spec.hp])

  const color = spec.kind === 'boss' ? '#7c3aed' : '#ef476f'

  return (
    <group ref={groupRef}>
      <mesh ref={bodyRef} castShadow>
        <icosahedronGeometry args={[spec.kind === 'boss' ? 0.55 : 0.26, 0]} />
        <meshStandardMaterial color={color} roughness={0.4} emissive={color} emissiveIntensity={0.25} />
      </mesh>
      {/* googly eyes — keeps these menacing-shaped things reading as friendly/cartoonish */}
      <mesh position={[0.12, 0.08, spec.kind === 'boss' ? 0.42 : 0.2]}>
        <sphereGeometry args={[spec.kind === 'boss' ? 0.14 : 0.07, 10, 10]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      <mesh position={[-0.12, 0.08, spec.kind === 'boss' ? 0.42 : 0.2]}>
        <sphereGeometry args={[spec.kind === 'boss' ? 0.14 : 0.07, 10, 10]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
    </group>
  )
}
