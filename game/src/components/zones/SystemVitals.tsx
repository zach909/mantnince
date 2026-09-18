import { useMemo } from 'react'
import { readBrowserVitals } from '../../lib/browserVitals'
import { Kiosk, Panel, Row } from './Kiosk'

/** Genuinely real (not fabricated) browser-visible machine signals — a
 * lightweight cousin of the desktop app's System Health panel. A browser tab
 * cannot see host-wide CPU/RAM/disk usage the way Node's os/fs modules can,
 * so this only shows what navigator.* actually, honestly exposes. */
export function SystemVitals({ position }: { position: [number, number, number] }) {
  const vitals = useMemo(() => readBrowserVitals(), [])
  const pillarHeight = Math.min(2.4, 0.4 + (vitals.cpuCores ?? 4) * 0.25)

  return (
    <group position={position}>
      <mesh castShadow position={[0, pillarHeight / 2, 0.9]}>
        <cylinderGeometry args={[0.22, 0.28, pillarHeight, 10]} />
        <meshStandardMaterial color="#4f8cff" emissive="#2a4f8f" emissiveIntensity={0.3} />
      </mesh>
      <Kiosk color="#33507a">
        <Panel title="System Vitals">
          <Row label="CPU cores (this browser)" value={vitals.cpuCores ? String(vitals.cpuCores) : 'unknown'} />
          <Row
            label="Approx. device memory"
            value={vitals.deviceMemoryGb ? `${vitals.deviceMemoryGb}+ GB` : 'not reported'}
          />
          <Row label="Network" value={vitals.connectionType ?? 'not reported'} tone="muted" />
          <Row label="" value="the desktop app sees more" tone="muted" />
        </Panel>
      </Kiosk>
    </group>
  )
}
