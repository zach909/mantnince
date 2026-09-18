import { Sky } from '@react-three/drei'
import { PLATFORMS } from '../constants'
import type { BackendData } from '../lib/backendClient'
import { DedupReef } from './zones/DedupReef'
import { CloudDocks } from './zones/CloudDocks'
import { SystemVitals } from './zones/SystemVitals'
import { SecurityBeacon } from './zones/SecurityBeacon'
import { EarningsPlaza } from './zones/EarningsPlaza'

/**
 * The diorama: the original staircase-of-platforms rescue puzzle, plus five
 * small "kiosk" zones around the ground level, each a physical stand-in for
 * one real subsystem of the backup app (dedup, cloud connections, device
 * vitals, the risky-site heuristic, the mock ad ledger) driven by live or
 * demo data — see game/README.md for the full mapping.
 */
export function Level({ data }: { data: BackendData }) {
  return (
    <>
      <Sky sunPosition={[10, 8, -6]} turbidity={4} rayleigh={1.2} />
      <fog attach="fog" args={['#bcd4e8', 18, 46]} />

      <ambientLight intensity={0.55} />
      <directionalLight
        position={[8, 12, 6]}
        intensity={1.4}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
      />

      {PLATFORMS.map((p) => (
        <mesh key={p.id} position={p.position} receiveShadow castShadow>
          <boxGeometry args={p.size} />
          <meshStandardMaterial color={p.color} roughness={0.85} />
        </mesh>
      ))}

      {/* Decorative props — simple procedural "trees" made of primitives */}
      {TREE_POSITIONS.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh position={[0, 0.4, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.16, 0.8, 8]} />
            <meshStandardMaterial color="#6b4a2f" />
          </mesh>
          <mesh position={[0, 1.05, 0]} castShadow>
            <coneGeometry args={[0.55, 1.1, 10]} />
            <meshStandardMaterial color="#3f8f5c" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Oversized background object — the "small robot, huge world" beat */}
      <mesh position={[9, 4, -16]} rotation={[0, 0.4, 0]} castShadow>
        <torusGeometry args={[4.2, 0.6, 16, 48]} />
        <meshStandardMaterial color="#8896a8" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[9, 4, -16]}>
        <cylinderGeometry args={[0.25, 0.25, 10, 12]} />
        <meshStandardMaterial color="#5a6472" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Subsystem zones — the actual "ad for your computer" content */}
      <EarningsPlaza earnings={data.earnings} position={[0, 0, 9.5]} />
      <DedupReef backup={data.backup} position={[-6, 0, 2]} />
      <CloudDocks cloud={data.cloud} position={[6, 0, 2]} />
      <SystemVitals position={[-6, 0, -6.5]} />
      <SecurityBeacon position={[6, 0, -6.5]} />
    </>
  )
}

const TREE_POSITIONS: [number, number, number][] = [
  [4, 0, 5], [5.5, 0, -1], [-4.2, 0, -1.5], [3.2, 1.9, -9.6], [-4, 2.9, -11.5],
]
