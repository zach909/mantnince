import type { CloudStatus } from '../../lib/backendClient'
import { Kiosk, Panel, Row } from './Kiosk'

const PROVIDERS: { key: string; label: string; color: string }[] = [
  { key: 'google', label: 'Google Drive', color: '#4f8cff' },
  { key: 'microsoft', label: 'OneDrive', color: '#22a06b' },
]

function formatAgo(iso: string | null): string {
  if (!iso) return 'never'
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}

/** Three small "docks" for the real cloud connectors (server/api/cloud.py).
 * Apple/iCloud is omitted here too, same as the server — it has no
 * comparable third-party OAuth data-access flow (see docs/architecture.md). */
export function CloudDocks({ cloud, position }: { cloud: CloudStatus; position: [number, number, number] }) {
  return (
    <group position={position}>
      {PROVIDERS.map((p, i) => {
        const status = cloud.providers[p.key]
        const connected = !!status?.connected
        const x = (i - 0.5) * 2.4
        return (
          <group key={p.key} position={[x, 0, 0]}>
            <mesh castShadow receiveShadow position={[0, 0.05, 0]}>
              <boxGeometry args={[1, 0.1, 2]} />
              <meshStandardMaterial color="#5a4632" roughness={0.9} />
            </mesh>
            <mesh castShadow position={[0, 0.55, -0.7]}>
              <coneGeometry args={[0.5, 1, 4]} />
              <meshStandardMaterial
                color={p.color}
                emissive={connected ? p.color : '#000'}
                emissiveIntensity={connected ? 0.5 : 0}
                opacity={connected ? 1 : 0.4}
                transparent
              />
            </mesh>
            {connected && <pointLight color={p.color} intensity={0.6} distance={2.5} position={[0, 0.8, -0.7]} />}
          </group>
        )
      })}
      <Kiosk color="#7c6a4f">
        <Panel title="Cloud Docks">
          {PROVIDERS.map((p) => {
            const status = cloud.providers[p.key]
            return (
              <Row
                key={p.key}
                label={p.label}
                value={status?.connected ? `synced ${formatAgo(status.last_sync)}` : 'not connected'}
                tone={status?.connected ? 'good' : 'muted'}
              />
            )
          })}
        </Panel>
      </Kiosk>
    </group>
  )
}
