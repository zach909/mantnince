import { useState } from 'react'
import { Html } from '@react-three/drei'
import { assessSiteRisk } from '../../lib/siteRisk'

const SAMPLE_URLS = [
  'https://example.com/statement.pdf',
  'http://free-prizes-now.example/download.exe',
  'https://192.168.4.20/setup.apk',
  'https://paypal.com.secure-verify.example/login',
]

/** Runs the REAL local heuristic from the browser extension's
 * src/lib/siteRisk.ts (mirrored in game/src/lib/siteRisk.ts) live against a
 * few sample URLs — not an animation of what it does, the actual function. */
export function SecurityBeacon({ position }: { position: [number, number, number] }) {
  const [index, setIndex] = useState(0)
  const url = SAMPLE_URLS[index]
  const result = assessSiteRisk(url)

  return (
    <group position={position}>
      <mesh castShadow position={[0, 1.6, 0]}>
        <coneGeometry args={[0.35, 0.6, 12]} />
        <meshStandardMaterial
          color={result.risky ? '#d05c5c' : '#22a06b'}
          emissive={result.risky ? '#d05c5c' : '#22a06b'}
          emissiveIntensity={0.6}
        />
      </mesh>
      <mesh castShadow position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.16, 0.2, 1.4, 10]} />
        <meshStandardMaterial color="#3a3d44" />
      </mesh>
      <pointLight color={result.risky ? '#d05c5c' : '#22a06b'} intensity={0.7} distance={3} position={[0, 1.8, 0]} />

      <Html position={[0, 2.5, 0]} center distanceFactor={7.5} occlude={false} style={{ pointerEvents: 'none' }}>
        <div
          style={{
            width: 220,
            background: 'rgba(10,10,18,0.75)',
            border: '1px solid rgba(255,255,255,0.16)',
            borderRadius: 10,
            padding: '8px 10px',
            color: '#fff',
            fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Security Beacon</div>
          <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.55)', marginBottom: 4, wordBreak: 'break-all' }}>
            {url}
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: result.risky ? '#f0a2a2' : '#8fe3b0',
              marginBottom: 4,
            }}
          >
            {result.risky ? '⚠ Flagged by heuristic' : '✓ Looks fine'}
          </div>
          {result.risky && (
            <ul style={{ margin: 0, paddingLeft: 14, fontSize: 9.5, color: 'rgba(255,255,255,0.7)' }}>
              {result.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
          <button
            onClick={() => setIndex((i) => (i + 1) % SAMPLE_URLS.length)}
            style={{
              marginTop: 6,
              width: '100%',
              pointerEvents: 'auto',
              border: 0,
              borderRadius: 6,
              background: '#4f8cff',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              padding: '5px 0',
              cursor: 'pointer',
            }}
          >
            Scan next sample URL
          </button>
          <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
            Local heuristic only — not a verified threat-intel scan.
          </div>
        </div>
      </Html>
    </group>
  )
}
