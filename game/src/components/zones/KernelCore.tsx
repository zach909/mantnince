import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useBugStore } from '../../state/bugStore'
import { Kiosk, Panel, Row } from './Kiosk'

/** The heart of the "OS" — where the boss (Kernel Corruptor) appears once
 * enough waves have passed. No real backend data here; this zone is
 * intentionally the game-y centerpiece rather than a subsystem readout. */
export function KernelCore({ position }: { position: [number, number, number] }) {
  const coreRef = useRef<THREE.Mesh>(null!)
  const corruption = useBugStore((s) => s.corruption)
  const bossActive = useBugStore((s) => s.bossActive)

  useFrame((state) => {
    if (coreRef.current) {
      const t = state.clock.elapsedTime
      coreRef.current.rotation.y = t * 0.5
      coreRef.current.rotation.x = Math.sin(t * 0.4) * 0.15
      const pulse = 1 + Math.sin(t * 3) * (bossActive ? 0.12 : 0.05)
      coreRef.current.scale.setScalar(pulse)
    }
  })

  const color = bossActive ? '#c084fc' : corruption > 50 ? '#ffb454' : '#4f8cff'

  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, 0.05, 0]}>
        <cylinderGeometry args={[2, 2, 0.1, 32]} />
        <meshStandardMaterial color="#f4e8ff" roughness={0.6} />
      </mesh>
      <mesh ref={coreRef} position={[0, 1.1, 0]} castShadow>
        <octahedronGeometry args={[0.55, 1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} roughness={0.25} />
      </mesh>
      <pointLight color={color} intensity={0.9} distance={4} position={[0, 1.3, 0]} />
      <Kiosk color="#7c4fcc">
        <Panel title="Kernel Core">
          <Row label="Status" value={bossActive ? 'Corruptor active!' : 'Stable'} tone={bossActive ? 'bad' : 'good'} />
          <Row label="" value={bossActive ? 'Fight it off with F!' : 'A boss appears every few waves.'} tone="muted" />
        </Panel>
      </Kiosk>
    </group>
  )
}
