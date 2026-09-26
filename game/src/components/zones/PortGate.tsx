import { loadConnectConfig } from '../../lib/backendClient'
import { Kiosk, Panel, Row } from './Kiosk'

interface PortInfo {
  port: number
  label: string
  real: boolean
}

function realApiPort(): number {
  const cfg = loadConnectConfig()
  try {
    const url = new URL(cfg?.apiUrl || 'http://127.0.0.1:8000')
    return url.port ? Number(url.port) : url.protocol === 'https:' ? 443 : 80
  } catch {
    return 8000
  }
}

/** One real port (whatever the connected Backup Cloud API is actually
 * listening on), plus a couple of illustrative ones — clearly labeled which
 * is which, since a browser page can't genuinely scan a host's open ports. */
export function PortGate({ position }: { position: [number, number, number] }) {
  const ports: PortInfo[] = [
    { port: realApiPort(), label: 'Backup Cloud API', real: true },
    { port: 443, label: 'HTTPS (illustrative)', real: false },
    { port: 22, label: 'SSH (illustrative)', real: false },
  ]

  return (
    <group position={position}>
      {ports.map((p, i) => {
        const x = (i - 1) * 1.3
        return (
          <group key={p.port + p.label} position={[x, 0, 0]}>
            <mesh castShadow receiveShadow position={[0, 0.4, 0]}>
              <torusGeometry args={[0.32, 0.1, 12, 24]} />
              <meshStandardMaterial
                color={p.real ? '#22a06b' : '#8896a8'}
                emissive={p.real ? '#22a06b' : '#000'}
                emissiveIntensity={p.real ? 0.5 : 0}
              />
            </mesh>
            <mesh position={[0, 0.05, 0]}>
              <cylinderGeometry args={[0.36, 0.4, 0.1, 16]} />
              <meshStandardMaterial color="#5a6472" roughness={0.7} />
            </mesh>
          </group>
        )
      })}
      <Kiosk color="#2f8f5c">
        <Panel title="Port Gate">
          {ports.map((p) => (
            <Row key={p.port + p.label} label={p.label} value={`:${p.port}`} tone={p.real ? 'good' : 'muted'} />
          ))}
          <Row label="" value="green = real, gray = illustrative" tone="muted" />
        </Panel>
      </Kiosk>
    </group>
  )
}
