import { Html } from '@react-three/drei'
import { useActivityLog } from '../../state/activityLog'

/** Tails the real activity log (rescues, bug defeats, infections, boss
 * events) as they actually happen — not scripted flavor text. */
export function Terminal({ position }: { position: [number, number, number] }) {
  const entries = useActivityLog((s) => s.entries)
  const recent = entries.slice(-6)

  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, 0.55, 0]}>
        <boxGeometry args={[1.3, 1.1, 0.15]} />
        <meshStandardMaterial color="#1a1d24" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.55, 0.09]}>
        <planeGeometry args={[1.1, 0.9]} />
        <meshStandardMaterial color="#0a1a12" emissive="#0a1a12" emissiveIntensity={0.4} />
      </mesh>
      <pointLight color="#3fdc7a" intensity={0.3} distance={2} position={[0, 0.7, 0.5]} />

      <Html position={[0, 1.9, 0]} center distanceFactor={7.5} occlude={false} style={{ pointerEvents: 'none' }}>
        <div
          style={{
            width: 230,
            background: 'rgba(6,12,8,0.82)',
            border: '1px solid rgba(63,220,122,0.35)',
            borderRadius: 10,
            padding: '8px 10px',
            fontFamily: 'ui-monospace, monospace',
            color: '#7dffa8',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4, color: '#a8ffca' }}>
            Terminal — live activity
          </div>
          {recent.length === 0 && <div style={{ fontSize: 9, opacity: 0.6 }}>$ waiting for events…</div>}
          {recent.map((line, i) => (
            <div key={i} style={{ fontSize: 8.5, lineHeight: 1.5, opacity: 0.55 + (i / recent.length) * 0.45 }}>
              $ {line}
            </div>
          ))}
        </div>
      </Html>
    </group>
  )
}
