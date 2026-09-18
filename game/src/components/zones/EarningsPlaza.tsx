import type { EarningsStatus } from '../../lib/backendClient'
import { Kiosk, Panel, Row } from './Kiosk'

/** Read-only display of the real (mock) ad-earnings ledger from
 * server/api/earnings.py — the same one the desktop app's ad-break
 * screensaver feeds. This zone doesn't add its own fake currency; it just
 * shows the real total. */
export function EarningsPlaza({ earnings, position }: { earnings: EarningsStatus; position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh receiveShadow position={[0, 0.05, 0]}>
        <cylinderGeometry args={[1.4, 1.4, 0.1, 32]} />
        <meshStandardMaterial color="#2a3550" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.12, 0.16, 1, 10]} />
        <meshStandardMaterial color="#ffd23f" emissive="#a67f1a" emissiveIntensity={0.5} />
      </mesh>
      <pointLight color="#ffd23f" intensity={0.6} distance={3} position={[0, 1.1, 0]} />
      <Kiosk color="#8a6d1f">
        <Panel title="Earnings Plaza">
          <Row label="Mock balance" value={`$${earnings.total.toFixed(2)}`} tone="good" />
          <Row label="Ad breaks watched" value={String(earnings.ads_watched)} />
          <Row label="" value={earnings.note} tone="muted" />
        </Panel>
      </Kiosk>
    </group>
  )
}
