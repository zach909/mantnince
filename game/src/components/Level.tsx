import { Sky } from '@react-three/drei'
import { PLATFORMS, ZONE_POSITIONS } from '../constants'
import type { BackendData } from '../lib/backendClient'
import { DedupReef } from './zones/DedupReef'
import { CloudDocks } from './zones/CloudDocks'
import { SystemVitals } from './zones/SystemVitals'
import { SecurityBeacon } from './zones/SecurityBeacon'
import { EarningsPlaza } from './zones/EarningsPlaza'
import { PortGate } from './zones/PortGate'
import { Terminal } from './zones/Terminal'
import { KernelCore } from './zones/KernelCore'

/**
 * The diorama: the original staircase-of-platforms rescue puzzle, plus eight
 * small "kiosk" zones around the ground level, each a physical stand-in for
 * one real subsystem of the backup app (dedup, cloud connections, device
 * vitals, ports, the risky-site heuristic, the mock ad ledger, live activity)
 * plus the Kernel Core boss arena — driven by live or demo data where a real
 * subsystem exists; see game/README.md for the full mapping.
 */
export function Level({ data }: { data: BackendData }) {
  return (
    <>
      <Sky sunPosition={[6, 14, 4]} turbidity={2} rayleigh={2.4} mieCoefficient={0.003} />
      <fog attach="fog" args={['#cdeaff', 26, 58]} />

      <ambientLight intensity={0.75} color="#fff7e6" />
      <directionalLight
        position={[8, 14, 6]}
        intensity={1.6}
        color="#fff4d6"
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
            <meshStandardMaterial color="#a9784f" />
          </mesh>
          <mesh position={[0, 1.05, 0]} castShadow>
            <coneGeometry args={[0.55, 1.1, 10]} />
            <meshStandardMaterial color="#5fce7e" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Oversized background object — the "small robot, huge world" beat */}
      <mesh position={[9, 4, -16]} rotation={[0, 0.4, 0]} castShadow>
        <torusGeometry args={[4.2, 0.6, 16, 48]} />
        <meshStandardMaterial color="#ffd166" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[9, 4, -16]}>
        <cylinderGeometry args={[0.25, 0.25, 10, 12]} />
        <meshStandardMaterial color="#ff8fa3" metalness={0.4} roughness={0.35} />
      </mesh>

      {/* Subsystem zones — the actual "ad for your computer" content */}
      <EarningsPlaza earnings={data.earnings} position={ZONE_POSITIONS.earnings} />
      <DedupReef backup={data.backup} position={ZONE_POSITIONS.dedup} />
      <CloudDocks cloud={data.cloud} position={ZONE_POSITIONS.cloud} />
      <PortGate position={ZONE_POSITIONS.ports} />
      <Terminal position={ZONE_POSITIONS.terminal} />
      <SystemVitals position={ZONE_POSITIONS.vitals} />
      <KernelCore position={ZONE_POSITIONS.kernel} />
      <SecurityBeacon position={ZONE_POSITIONS.security} />
    </>
  )
}

// Kept at z <= 6 (the spawn point's z) — see the comment on ZONE_POSITIONS;
// the same close-up-in-front-of-the-camera issue applies to any prop, not
// just the zone kiosks.
const TREE_POSITIONS: [number, number, number][] = [
  [7, 0, 1], [-7, 0, 1], [7.2, 0, -4.2], [-7.2, 0, -9], [3.2, 1.9, -9.6], [-4, 2.9, -11.5],
]
