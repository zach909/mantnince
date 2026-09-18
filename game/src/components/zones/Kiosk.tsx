import type { ReactNode } from 'react'
import { Html } from '@react-three/drei'

/** A small physical "info kiosk" prop with a floating HTML readout above it — the
 * shared shape every subsystem zone uses (pedestal + glowing disc + panel). */
export function Kiosk({ color, children }: { color: string; children: ReactNode }) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.6, 0]}>
        <boxGeometry args={[1.1, 1.2, 1.1]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.32, 0]}>
        <cylinderGeometry args={[0.52, 0.52, 0.1, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      <pointLight color={color} intensity={0.5} distance={3} position={[0, 1.4, 0]} />
      <Html position={[0, 2.15, 0]} center distanceFactor={7.5} occlude={false} style={{ pointerEvents: 'none' }}>
        {children}
      </Html>
    </group>
  )
}

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      style={{
        width: 190,
        background: 'rgba(10,10,18,0.72)',
        border: '1px solid rgba(255,255,255,0.16)',
        borderRadius: 10,
        padding: '8px 10px',
        color: '#fff',
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>{children}</div>
    </div>
  )
}

export function Row({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' | 'muted' }) {
  const color = tone === 'good' ? '#8fe3b0' : tone === 'bad' ? '#f0a2a2' : tone === 'muted' ? 'rgba(255,255,255,0.5)' : '#fff'
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 10.5 }}>
      <span style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</span>
      <span style={{ color, fontWeight: 600 }}>{value}</span>
    </div>
  )
}
