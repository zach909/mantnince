import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useKeyboard, consumeEdge } from '../hooks/useKeyboard'
import { useAudioCues } from '../hooks/useAudioCues'
import { useGameStore } from '../state/gameStore'
import { playerPosition, playerFacing, setPlayerGrounded, triggerCameraShake } from '../state/playerTransform'
import { groundHeightAt, lerpAngle } from '../utils'
import {
  MOVE_SPEED, ACCEL, DECEL, GRAVITY, JUMP_SPEED,
  BOOST_UP_SPEED, BOOST_FORWARD_SPEED, BOOST_COOLDOWN_MS,
  FALL_RESET_Y, SPAWN_POINT,
} from '../constants'

type AnimState = 'idle' | 'run' | 'jump' | 'fall' | 'land' | 'boost'

const VISOR_COLORS: Record<AnimState, string> = {
  idle: '#bfe7ff',
  run: '#bfe7ff',
  jump: '#8fd6ff',
  fall: '#8fa0ff',
  land: '#ffe27a',
  boost: '#ffd23f',
}

export function RobotController() {
  const keys = useKeyboard()
  const audio = useAudioCues()
  const useGadget = useGameStore((s) => s.useGadget)
  const isGadgetReady = useGameStore((s) => s.isGadgetReady)

  const groupRef = useRef<THREE.Group>(null!)
  const bodyGroupRef = useRef<THREE.Group>(null!)
  const visorRef = useRef<THREE.Mesh>(null!)
  const legLRef = useRef<THREE.Mesh>(null!)
  const legRRef = useRef<THREE.Mesh>(null!)

  const pos = useRef(new THREE.Vector3(...SPAWN_POINT))
  const vel = useRef(new THREE.Vector3(0, 0, 0))
  const yaw = useRef(0)
  const grounded = useRef(true)
  const animState = useRef<AnimState>('idle')
  const stateSince = useRef(0)
  const boostFlashUntil = useRef(0)

  useEffect(() => {
    if (import.meta.env.DEV) {
      ;(window as any).__debug = { pos: pos.current, vel: vel.current, grounded }
    }
  }, [])

  const visorMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: VISOR_COLORS.idle, emissive: new THREE.Color(VISOR_COLORS.idle), emissiveIntensity: 0.6,
  }), [])

  function setAnim(next: AnimState, t: number) {
    if (animState.current !== next) {
      animState.current = next
      stateSince.current = t
      visorMaterial.color.set(VISOR_COLORS[next])
      visorMaterial.emissive.set(VISOR_COLORS[next])
    }
  }

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05)
    const t = state.clock.elapsedTime
    const k = keys.current

    // ── Horizontal input → damped velocity (gives movement real weight) ──
    let dirX = (k.right ? 1 : 0) - (k.left ? 1 : 0)
    let dirZ = (k.back ? 1 : 0) - (k.forward ? 1 : 0)
    const hasInput = dirX !== 0 || dirZ !== 0
    if (hasInput) {
      const len = Math.hypot(dirX, dirZ)
      dirX /= len
      dirZ /= len
    }
    const rate = hasInput ? ACCEL : DECEL
    vel.current.x = THREE.MathUtils.damp(vel.current.x, dirX * MOVE_SPEED, rate, delta)
    vel.current.z = THREE.MathUtils.damp(vel.current.z, dirZ * MOVE_SPEED, rate, delta)

    // ── Jump ──
    if (grounded.current && consumeEdge(keys, 'jumpPressed')) {
      vel.current.y = JUMP_SPEED
      grounded.current = false
      audio.playJump()
    }

    // ── Boost gadget: adds to current velocity, so combining it with a
    //    jump reaches much further than either alone (rewards "combine
    //    ability with normal movement," per the design spec). ──
    if (consumeEdge(keys, 'boostPressed') && isGadgetReady()) {
      vel.current.y += BOOST_UP_SPEED
      vel.current.x += playerFacing.x * BOOST_FORWARD_SPEED
      vel.current.z += playerFacing.z * BOOST_FORWARD_SPEED
      useGadget(BOOST_COOLDOWN_MS)
      audio.playBoost()
      setAnim('boost', t)
      boostFlashUntil.current = t + 0.3
      triggerCameraShake(0.12)
    }

    // ── Gravity + integrate ──
    vel.current.y -= GRAVITY * delta
    pos.current.x += vel.current.x * delta
    pos.current.y += vel.current.y * delta
    pos.current.z += vel.current.z * delta

    // ── Ground resolve ──
    const groundTop = groundHeightAt(pos.current.x, pos.current.z, pos.current.y)
    const wasGrounded = grounded.current
    if (vel.current.y <= 0 && groundTop !== null) {
      pos.current.y = groundTop
      vel.current.y = 0
      grounded.current = true
      if (!wasGrounded) { audio.playLand(); setAnim('land', t); triggerCameraShake(0.05) }
    } else {
      grounded.current = false
    }
    setPlayerGrounded(grounded.current)

    // ── Fell off the world → respawn (the slice's one failure state) ──
    if (pos.current.y < FALL_RESET_Y) {
      pos.current.set(...SPAWN_POINT)
      vel.current.set(0, 0, 0)
      grounded.current = true
      audio.playFall()
      useGameStore.getState().setToast('Watch your step!')
      window.setTimeout(() => {
        if (useGameStore.getState().toast === 'Watch your step!') useGameStore.getState().setToast(null)
      }, 1800)
    }

    // ── Facing (smoothly turn toward movement direction) ──
    const speed = Math.hypot(vel.current.x, vel.current.z)
    if (speed > 0.4) {
      const targetYaw = Math.atan2(vel.current.x, vel.current.z)
      yaw.current = lerpAngle(yaw.current, targetYaw, 1 - Math.exp(-14 * delta))
      playerFacing.set(Math.sin(yaw.current), 0, Math.cos(yaw.current))
    }

    // ── Animation state (transient states expire back to physical ones) ──
    const transient = animState.current === 'land' || animState.current === 'boost'
    const transientExpired = t - stateSince.current > (animState.current === 'boost' ? 0.3 : 0.18)
    if (!transient || transientExpired) {
      if (!grounded.current) setAnim(vel.current.y > 0 ? 'jump' : 'fall', t)
      else setAnim(speed > 0.4 ? 'run' : 'idle', t)
    }

    // ── Apply to scene graph ──
    groupRef.current.position.copy(pos.current)
    groupRef.current.rotation.y = yaw.current
    playerPosition.copy(pos.current)

    const bounce = animState.current === 'idle' ? Math.sin(t * 2) * 0.02 : 0
    const stateT = t - stateSince.current
    let squashY = 1, squashXZ = 1
    if (animState.current === 'jump' && stateT < 0.15) { squashY = 1.25; squashXZ = 0.85 }
    if (animState.current === 'land') { const p = Math.min(1, stateT / 0.18); squashY = THREE.MathUtils.lerp(0.7, 1, p); squashXZ = THREE.MathUtils.lerp(1.25, 1, p) }
    if (animState.current === 'boost') { squashY = 1.15; squashXZ = 0.9 }
    bodyGroupRef.current.scale.set(squashXZ, squashY, squashXZ)
    bodyGroupRef.current.position.y = 0.55 + bounce

    if (legLRef.current && legRRef.current) {
      const swing = animState.current === 'run' ? Math.sin(t * 10) * 0.5 : 0
      legLRef.current.rotation.x = swing
      legRRef.current.rotation.x = -swing
    }

    if (t < boostFlashUntil.current && visorRef.current) {
      visorRef.current.scale.setScalar(1 + Math.sin(t * 40) * 0.15)
    } else if (visorRef.current) {
      visorRef.current.scale.setScalar(1)
    }
  })

  return (
    <group ref={groupRef}>
      <group ref={bodyGroupRef}>
        <mesh castShadow>
          <capsuleGeometry args={[0.32, 0.3, 6, 12]} />
          <meshStandardMaterial color="#f4f6fb" roughness={0.35} metalness={0.1} />
        </mesh>
        <mesh ref={visorRef} position={[0, 0.08, 0.3]} material={visorMaterial}>
          <planeGeometry args={[0.34, 0.22]} />
        </mesh>
        <mesh ref={legLRef} position={[-0.14, -0.58, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.28, 10]} />
          <meshStandardMaterial color="#2f6fb0" />
        </mesh>
        <mesh ref={legRRef} position={[0.14, -0.58, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.28, 10]} />
          <meshStandardMaterial color="#2f6fb0" />
        </mesh>
      </group>
    </group>
  )
}
