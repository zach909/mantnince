import { Sky } from '@react-three/drei'
import { PLATFORMS } from '../constants'

/**
 * A small diorama-style scene: a handful of authored platforms forming one
 * simple path, a couple of decorative props, and one oversized background
 * object to sell "tiny robot in a huge world" scale contrast — the core
 * visual idea from the spec, scoped down to a single tiny vignette rather
 * than a full biome.
 */
export function Level() {
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
    </>
  )
}

const TREE_POSITIONS: [number, number, number][] = [
  [4, 0, 2], [5.5, 0, -1], [-5, 0, 1], [-6, 0, -3], [3.2, 1.9, -9.6], [-4, 2.9, -11.5],
]
